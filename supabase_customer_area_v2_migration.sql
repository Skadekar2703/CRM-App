-- ============================================================================
-- CRM V2 — CUSTOMER AREA SYSTEM HARDENED BUSINESS-SCOPED MIGRATION (FINAL)
-- File: supabase_customer_area_v2_migration.sql
-- Description: Adds area_id FK column to customers table, links existing
--              customers to real public.areas records strictly within the
--              same business_id scope, purges ALL legacy policies dynamically,
--              and enforces business-scoped RLS policies.
--              STRICTLY NON-DESTRUCTIVE: Zero customer or area data deleted.
-- ============================================================================

-- 1. ADD area_id COLUMN TO CUSTOMERS TABLE IF NOT EXISTS
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

-- 2. CREATE INDEXES FOR FAST AREA LOOKUPS
CREATE INDEX IF NOT EXISTS idx_customers_area_id ON public.customers(area_id);
CREATE INDEX IF NOT EXISTS idx_customers_area ON public.customers(area);
CREATE INDEX IF NOT EXISTS idx_areas_business_id ON public.areas(business_id);

-- 3. ENABLE RLS AND DYNAMICALLY PURGE ALL EXISTING POLICIES ON PUBLIC.AREAS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'areas') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.areas;', pol.policyname);
    END LOOP;
END $$;

-- 4. RE-CREATE STRICT BUSINESS-SCOPED RLS POLICIES ON PUBLIC.AREAS
-- SELECT (READ): CRM Staff and Admin can view areas belonging to their business
CREATE POLICY "Areas Business Read" ON public.areas
FOR SELECT TO authenticated
USING (business_id = public.get_auth_business_id());

-- INSERT (CREATE): CRM Staff and Admin can insert areas into their business
CREATE POLICY "Areas Business Insert" ON public.areas
FOR INSERT TO authenticated
WITH CHECK (business_id = public.get_auth_business_id());

-- UPDATE (EDIT): CRM Staff and Admin can update areas in their business
CREATE POLICY "Areas Business Update" ON public.areas
FOR UPDATE TO authenticated
USING (business_id = public.get_auth_business_id())
WITH CHECK (business_id = public.get_auth_business_id());

-- DELETE: ADMIN ONLY within their active business scope
CREATE POLICY "Areas Business Delete Admin Only" ON public.areas
FOR DELETE TO authenticated
USING (
    business_id = public.get_auth_business_id()
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() 
          AND UPPER(role) = 'ADMIN'
    )
);

-- 5. BUSINESS-SCOPED BACKFILL: POPULATE area_id ONLY WHEN MATCHED WITHIN SAME BUSINESS
UPDATE public.customers c
SET area_id = a.id
FROM public.areas a
WHERE c.area_id IS NULL
  AND c.area IS NOT NULL
  AND TRIM(c.area) <> ''
  AND LOWER(TRIM(c.area)) = LOWER(TRIM(a.name))
  AND c.business_id IS NOT NULL 
  AND a.business_id IS NOT NULL 
  AND c.business_id = a.business_id;

-- 6. READ-ONLY AUDIT SUMMARY REPORT
SELECT 
    (SELECT COUNT(*) FROM public.areas) AS total_areas,
    (SELECT COUNT(*) FROM public.customers WHERE area_id IS NOT NULL) AS customers_with_area_id,
    (SELECT COUNT(*) FROM public.customers WHERE area_id IS NULL) AS customers_without_area_id;
