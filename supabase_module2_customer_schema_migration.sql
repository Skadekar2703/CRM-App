-- ============================================================================
-- CRM APP KMP - MODULE 2: CUSTOMER MANAGEMENT SCHEMA MIGRATION
-- Idempotent & Non-Destructive Extension to public.customers Table
-- ============================================================================

-- 1. ADD MISSING CUSTOMER COLUMNS SAFELY
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_code TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cibil_status TEXT DEFAULT 'Good';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS guarantor_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS guarantor_mobile TEXT;

-- 2. SAFELY POPULATE MISSING CUSTOMER_ID AND CUSTOMER_CODE FOR EXISTING RECORDS
DO $$
DECLARE
    r RECORD;
    v_counter INT := 100001;
BEGIN
    FOR r IN SELECT id, phone FROM public.customers WHERE customer_id IS NULL OR customer_id = '' ORDER BY created_at ASC LOOP
        UPDATE public.customers 
        SET customer_id = v_counter::TEXT,
            customer_code = COALESCE(customer_code, 'Cd' || LPAD(v_counter::TEXT, 12, '0')),
            cibil_status = COALESCE(cibil_status, 'Good')
        WHERE id = r.id;
        v_counter := v_counter + 1;
    END LOOP;
END $$;

-- 3. FUNCTION TO GENERATE NEXT UNIQUE 6-DIGIT CUSTOMER ID PER BUSINESS
CREATE OR REPLACE FUNCTION public.generate_next_customer_id(p_business_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
    v_max INT;
    v_next TEXT;
BEGIN
    SELECT MAX(CAST(customer_id AS INT)) INTO v_max
    FROM public.customers
    WHERE business_id = p_business_id
      AND customer_id ~ '^[0-9]{6}$';

    IF v_max IS NULL OR v_max < 100000 THEN
        v_max := 100000;
    END IF;

    v_next := (v_max + 1)::TEXT;
    RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_next_customer_id(UUID) TO anon, authenticated;

-- 4. BUSINESS-SCOPED UNIQUE INDEXES FOR DUPLICATE PREVENTION
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_customer_id 
ON public.customers(business_id, customer_id) 
WHERE customer_id IS NOT NULL AND customer_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_phone 
ON public.customers(business_id, phone) 
WHERE phone IS NOT NULL AND phone <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_customer_code 
ON public.customers(business_id, LOWER(TRIM(customer_code))) 
WHERE customer_code IS NOT NULL AND customer_code <> '';
