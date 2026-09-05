-- =============================================================
-- CRM V2 — CUSTOMER CATEGORY SYSTEM SAFE MIGRATION
-- File: supabase_customer_category_v2_migration.sql
-- Description: Adds category_id column to customers table, populates
--              default Customer Categories, backfills category_id,
--              and sets up RLS policies & foreign key constraints.
--              STRICTLY NON-DESTRUCTIVE: Existing real data preserved.
-- =============================================================

-- 1. ADD category_id COLUMN TO CUSTOMERS TABLE IF NOT EXISTS
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. CREATE INDEX FOR FAST CATEGORY LOOKUP ON CUSTOMERS
CREATE INDEX IF NOT EXISTS idx_customers_category_id ON public.customers(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_category ON public.customers(category);

-- 3. ENSURE RLS POLICIES FOR CATEGORIES PERMIT AUTHENTICATED USERS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read categories" ON public.categories;
CREATE POLICY "Allow authenticated read categories" ON public.categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert categories" ON public.categories;
CREATE POLICY "Allow authenticated insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update categories" ON public.categories;
CREATE POLICY "Allow authenticated update categories" ON public.categories FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete categories" ON public.categories;
CREATE POLICY "Allow authenticated delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

-- 4. INSERT DEFAULT CUSTOMER CATEGORIES IF NONE EXIST FOR A USER/BUSINESS
DO $$
DECLARE
    rec RECORD;
    v_cat_count INT;
BEGIN
    -- Check distinct user_ids in categories or profiles
    FOR rec IN SELECT DISTINCT id AS uid FROM auth.users LOOP
        SELECT COUNT(*) INTO v_cat_count FROM public.categories WHERE user_id = rec.uid;
        IF v_cat_count = 0 THEN
            INSERT INTO public.categories (name, description, user_id) VALUES
            ('Retailer', 'Retail customers purchasing in small quantities', rec.uid),
            ('Wholesaler', 'Wholesale buyers purchasing bulk inventory', rec.uid),
            ('Customer', 'General individual customer', rec.uid),
            ('VIP', 'High-priority VIP accounts', rec.uid),
            ('Regular', 'Standard recurring client', rec.uid)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 5. BACKFILL category_id ON CUSTOMERS WHERE category_id IS NULL
UPDATE public.customers c
SET category_id = cat.id
FROM public.categories cat
WHERE c.category_id IS NULL
  AND c.category IS NOT NULL
  AND LOWER(TRIM(c.category)) = LOWER(TRIM(cat.name))
  AND (cat.user_id IS NULL OR cat.user_id = c.user_id);

-- 6. REPORT SUMMARY (SAFE READ-ONLY AUDIT QUERY)
SELECT 
    (SELECT COUNT(*) FROM public.categories) AS total_categories,
    (SELECT COUNT(*) FROM public.customers WHERE category_id IS NOT NULL) AS customers_with_category_id,
    (SELECT COUNT(*) FROM public.customers WHERE category_id IS NULL) AS customers_without_category_id;
