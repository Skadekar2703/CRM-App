-- ============================================================================
-- CRM APP KMP - CUSTOMER PHOTO STORAGE BUCKET MIGRATION & RLS POLICIES
-- Idempotent script to setup PRIVATE storage.buckets and storage.objects policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('customer_photos', 'customer_photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 1. SELECT (READ): Authenticated CRM business users can read customer photos
DROP POLICY IF EXISTS "Public Read Customer Photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Customer Photos" ON storage.objects;

CREATE POLICY "Authenticated Read Customer Photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'customer_photos');

-- 2. INSERT (UPLOAD): Authenticated CRM staff or admin can upload photo files
DROP POLICY IF EXISTS "Authenticated Upload Customer Photos" ON storage.objects;

CREATE POLICY "Authenticated Upload Customer Photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'customer_photos');

-- 3. UPDATE: Restricted to ADMIN role only
DROP POLICY IF EXISTS "Authenticated Update Customer Photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only Update Customer Photos" ON storage.objects;

CREATE POLICY "Admin Only Update Customer Photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'customer_photos' 
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() AND UPPER(role) = 'ADMIN'
    )
)
WITH CHECK (
    bucket_id = 'customer_photos' 
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() AND UPPER(role) = 'ADMIN'
    )
);

-- 4. DELETE: Restricted to ADMIN role only
DROP POLICY IF EXISTS "Authenticated Delete Customer Photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only Delete Customer Photos" ON storage.objects;

CREATE POLICY "Admin Only Delete Customer Photos" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'customer_photos' 
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() AND UPPER(role) = 'ADMIN'
    )
);
