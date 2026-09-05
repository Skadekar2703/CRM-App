-- ============================================================================
-- CRM APP KMP - PRODUCTION ROLE-BASED ACCESS CONTROL (RBAC) & RLS POLICIES
-- Scoped to authenticated user's business_id via public.get_auth_business_id()
-- DO NOT RUN DIRECTLY - PRESENTED FOR USER REVIEW & APPROVAL FIRST
-- ============================================================================

-- 1. PUBLIC.CUSTOMERS RLS POLICIES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers Business Read" ON public.customers;
DROP POLICY IF EXISTS "Customers Business Insert" ON public.customers;
DROP POLICY IF EXISTS "Customers Business Update" ON public.customers;
DROP POLICY IF EXISTS "Customers Business Delete Admin Only" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.customers;

-- SELECT (READ): Authenticated CRM staff or admin in the same business
CREATE POLICY "Customers Business Read" ON public.customers
FOR SELECT TO authenticated
USING (business_id = public.get_auth_business_id());

-- INSERT (CREATE): Authenticated CRM staff or admin in the same business
CREATE POLICY "Customers Business Insert" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (business_id = public.get_auth_business_id());

-- UPDATE (EDIT): Authenticated CRM staff or admin in the same business
CREATE POLICY "Customers Business Update" ON public.customers
FOR UPDATE TO authenticated
USING (business_id = public.get_auth_business_id())
WITH CHECK (business_id = public.get_auth_business_id());

-- DELETE: ADMIN ONLY - STAFF DELETE DENIED BY RLS
CREATE POLICY "Customers Business Delete Admin Only" ON public.customers
FOR DELETE TO authenticated
USING (
    business_id = public.get_auth_business_id()
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() 
          AND UPPER(role) = 'ADMIN'
    )
);


-- 2. PUBLIC.UDHAARI (REAL CUSTOMER TRANSACTIONS TABLE) RLS POLICIES
ALTER TABLE public.udhaari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Udhaari Business Read" ON public.udhaari;
DROP POLICY IF EXISTS "Udhaari Business Insert" ON public.udhaari;
DROP POLICY IF EXISTS "Udhaari Business Update" ON public.udhaari;
DROP POLICY IF EXISTS "Udhaari Business Delete Admin Only" ON public.udhaari;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.udhaari;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.udhaari;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.udhaari;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.udhaari;

-- SELECT (READ): Authenticated CRM staff or admin in the same business
CREATE POLICY "Udhaari Business Read" ON public.udhaari
FOR SELECT TO authenticated
USING (business_id = public.get_auth_business_id());

-- INSERT (CREATE): Authenticated CRM staff or admin in the same business
CREATE POLICY "Udhaari Business Insert" ON public.udhaari
FOR INSERT TO authenticated
WITH CHECK (business_id = public.get_auth_business_id());

-- UPDATE (EDIT): Authenticated CRM staff or admin in the same business
CREATE POLICY "Udhaari Business Update" ON public.udhaari
FOR UPDATE TO authenticated
USING (business_id = public.get_auth_business_id())
WITH CHECK (business_id = public.get_auth_business_id());

-- DELETE: ADMIN ONLY - STAFF DELETE DENIED BY RLS
CREATE POLICY "Udhaari Business Delete Admin Only" ON public.udhaari
FOR DELETE TO authenticated
USING (
    business_id = public.get_auth_business_id()
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() 
          AND UPPER(role) = 'ADMIN'
    )
);


-- 3. STORAGE.OBJECTS (CUSTOMER_PHOTOS BUCKET) SECURITY POLICIES
-- Storage policies for the private customer_photos bucket

DROP POLICY IF EXISTS "Customer Photos Select" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Insert" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Update Admin Only" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Delete Admin Only" ON storage.objects;

-- SELECT: Authenticated users can read customer photos
CREATE POLICY "Customer Photos Select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'customer_photos');

-- INSERT: Authenticated users can upload new customer photos
CREATE POLICY "Customer Photos Insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'customer_photos');

-- UPDATE: ADMIN ONLY within active business can replace existing photos
CREATE POLICY "Customer Photos Update Admin Only" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'customer_photos'
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid()
          AND business_id = public.get_auth_business_id()
          AND UPPER(role) = 'ADMIN'
    )
);

-- DELETE: ADMIN ONLY within active business can delete existing photos
CREATE POLICY "Customer Photos Delete Admin Only" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'customer_photos'
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid()
          AND business_id = public.get_auth_business_id()
          AND UPPER(role) = 'ADMIN'
    )
);
