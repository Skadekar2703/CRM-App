-- ============================================================================
-- CRM APP KMP - SUPABASE NEW CUSTOMER REAL DATA MIGRATION (V2 FINAL HARDENED)
-- Idempotent, Safe & Non-Destructive Extension for public.customers & udhaari
-- ============================================================================

-- 1. ADD MISSING COLUMNS SAFELY TO PUBLIC.CUSTOMERS
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_code TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cibil_status TEXT DEFAULT 'Good';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cibil_score INT DEFAULT 750;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS area TEXT DEFAULT 'Local Market';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS guarantor_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS guarantor_mobile TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS alternate_mobile TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS id_cnc_no TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Customer';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) DEFAULT 50000.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tax_no TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS udhar_wapisi_din INT DEFAULT 30;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS baki NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS jama NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. SAFE UNIQUE INDEXES (PER BUSINESS SCOPE)
DO $$
DECLARE
    v_dup_count INT;
BEGIN
    -- Check for duplicate customer_ids within the same business before index creation
    SELECT COUNT(*) INTO v_dup_count
    FROM (
        SELECT business_id, customer_id
        FROM public.customers
        WHERE customer_id IS NOT NULL AND TRIM(customer_id) <> ''
        GROUP BY business_id, customer_id
        HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_count > 0 THEN
        RAISE WARNING 'ATTENTION: Found % duplicate (business_id, customer_id) groups in public.customers. Please inspect before applying unique constraint.', v_dup_count;
    ELSE
        RAISE NOTICE 'No duplicate (business_id, customer_id) pairs found in public.customers.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'customers' AND indexname = 'idx_customers_business_phone'
    ) THEN
        CREATE UNIQUE INDEX idx_customers_business_phone ON public.customers (business_id, phone);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'customers' AND indexname = 'idx_customers_business_customer_code'
    ) THEN
        CREATE UNIQUE INDEX idx_customers_business_customer_code ON public.customers (business_id, customer_code);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'customers' AND indexname = 'idx_customers_business_customer_id'
    ) THEN
        CREATE UNIQUE INDEX idx_customers_business_customer_id ON public.customers (business_id, customer_id);
    END IF;
END $$;

-- 3. CONCURRENCY-SAFE SEQUENCE ENGINE FOR 6-DIGIT CUSTOMER UIDS
CREATE TABLE IF NOT EXISTS public.customer_sequences (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    last_value INT NOT NULL DEFAULT 100000
);

ALTER TABLE public.customer_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer Sequences Business Read" ON public.customer_sequences;

-- REVOKE ALL DIRECT CLIENT ACCESS TO CUSTOMER_SEQUENCES TABLE
REVOKE ALL ON public.customer_sequences FROM PUBLIC, anon, authenticated;

-- SAFELY SEED CUSTOMER SEQUENCES FROM MAXIMUM EXISTING CUSTOMER ID FOR EACH BUSINESS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT business_id, COALESCE(MAX(CAST(customer_id AS INT)), 100000) AS max_id
        FROM public.customers
        WHERE customer_id ~ '^[0-9]{6}$'
        GROUP BY business_id
    LOOP
        INSERT INTO public.customer_sequences (business_id, last_value)
        VALUES (r.business_id, r.max_id)
        ON CONFLICT (business_id) DO UPDATE
        SET last_value = GREATEST(public.customer_sequences.last_value, EXCLUDED.last_value);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.generate_next_customer_id(p_business_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
    v_next INT;
BEGIN
    INSERT INTO public.customer_sequences (business_id, last_value)
    VALUES (p_business_id, 100001)
    ON CONFLICT (business_id) DO UPDATE
    SET last_value = public.customer_sequences.last_value + 1
    RETURNING last_value INTO v_next;

    RETURN v_next::TEXT;
END;
$$;

-- STRICT PRIVILEGE ISOLATION: REVOKE DIRECT EXECUTE ON GENERATE_NEXT_CUSTOMER_ID FROM PUBLIC, ANON, AND AUTHENTICATED
REVOKE EXECUTE ON FUNCTION public.generate_next_customer_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_next_customer_id(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_next_customer_id(UUID) FROM authenticated;

-- 4. ATOMIC CUSTOMER CREATION RPC WITH MANDATORY SERVER-SIDE UID GENERATION
CREATE OR REPLACE FUNCTION public.create_customer_v2(
    p_name TEXT,
    p_phone TEXT,
    p_alternate_mobile TEXT DEFAULT '',
    p_email TEXT DEFAULT '',
    p_id_cnc_no TEXT DEFAULT '',
    p_customer_code TEXT DEFAULT '',
    p_photo_url TEXT DEFAULT NULL,
    p_cibil_status TEXT DEFAULT 'Good',
    p_cibil_score INT DEFAULT 750,
    p_category TEXT DEFAULT 'Customer',
    p_credit_limit NUMERIC DEFAULT 50000.00,
    p_opening_balance NUMERIC DEFAULT 0.00,
    p_tax_no TEXT DEFAULT '',
    p_udhar_wapisi_din INT DEFAULT 30,
    p_address TEXT DEFAULT '',
    p_area TEXT DEFAULT 'Local Market',
    p_remark TEXT DEFAULT '',
    p_guarantor_name TEXT DEFAULT '',
    p_guarantor_mobile TEXT DEFAULT '',
    p_status TEXT DEFAULT 'Active',
    p_credit_blocked BOOLEAN DEFAULT false,
    p_business_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_business_id UUID;
    v_cust_uid TEXT;
    v_cd_code TEXT;
    v_new_cust_id UUID;
    v_initial_baki NUMERIC(12, 2) := COALESCE(p_opening_balance, 0.00);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- RESOLVE BUSINESS ID SERVER-SIDE (NEVER TRUST CLIENT PARAMETER)
    v_business_id := public.get_auth_business_id();
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User is not linked to an active business.';
    END IF;

    IF p_business_id IS NOT NULL AND p_business_id <> v_business_id THEN
        RAISE EXCEPTION 'Security violation: Business ID mismatch.';
    END IF;

    -- MANDATORY SERVER-SIDE 6-DIGIT UID GENERATION (NO CLIENT OVERRIDE POSSIBEL)
    v_cust_uid := public.generate_next_customer_id(v_business_id);

    -- GENERATE OR VALIDATE CD CODE DATABASE-SIDE
    IF p_customer_code IS NULL OR TRIM(p_customer_code) = '' THEN
        v_cd_code := 'Cd' || LPAD(v_cust_uid, 12, '0');
    ELSE
        v_cd_code := TRIM(p_customer_code);
    END IF;

    -- Insert Customer record
    INSERT INTO public.customers (
        business_id, customer_id, customer_code, name, phone, alternate_mobile, email,
        id_cnc_no, photo_url, cibil_status, cibil_score, category, credit_limit,
        opening_balance, tax_no, udhar_wapisi_din, address, area, remark,
        guarantor_name, guarantor_mobile, status, credit_blocked, baki, jama, user_id
    ) VALUES (
        v_business_id, v_cust_uid, v_cd_code, TRIM(p_name), TRIM(p_phone), TRIM(p_alternate_mobile), TRIM(p_email),
        TRIM(p_id_cnc_no), p_photo_url, TRIM(p_cibil_status), p_cibil_score, TRIM(p_category), p_credit_limit,
        p_opening_balance, TRIM(p_tax_no), p_udhar_wapisi_din, TRIM(p_address), TRIM(p_area), TRIM(p_remark),
        TRIM(p_guarantor_name), TRIM(p_guarantor_mobile), TRIM(p_status), p_credit_blocked, v_initial_baki, 0.00, v_user_id
    ) RETURNING id INTO v_new_cust_id;

    -- Insert opening balance transaction in public.udhaari for ledger integrity if opening_balance > 0
    IF v_initial_baki > 0 THEN
        INSERT INTO public.udhaari (
            business_id, customer_id, customer_name, type, amount, notes, date, status, user_id
        ) VALUES (
            v_business_id, v_new_cust_id, TRIM(p_name), 'Baki', v_initial_baki, 'Opening Balance', NOW(), 'Completed', v_user_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_new_cust_id,
        'customer_id', v_cust_uid,
        'customer_code', v_cd_code,
        'baki', v_initial_baki,
        'jama', 0.00
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_v2 TO authenticated;

-- 5. ATOMIC CREDIT-LIMIT & CREDIT-BLOCK ENFORCED UDHAARI TRANSACTION RPC
CREATE OR REPLACE FUNCTION public.add_udhaari_transaction(
    p_customer_id UUID,
    p_type TEXT, -- 'Baki' or 'Jama'
    p_amount NUMERIC,
    p_notes TEXT DEFAULT ''
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_business_id UUID;
    v_cust_name TEXT;
    v_curr_baki NUMERIC(12, 2);
    v_curr_jama NUMERIC(12, 2);
    v_credit_limit NUMERIC(12, 2);
    v_credit_blocked BOOLEAN;
    v_status TEXT;
    v_new_baki NUMERIC(12, 2);
    v_new_jama NUMERIC(12, 2);
    v_new_outstanding NUMERIC(12, 2);
    v_norm_type TEXT;
    v_txn_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    v_business_id := public.get_auth_business_id();
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User is not linked to an active business.';
    END IF;

    -- Lock Customer record for update atomically
    SELECT name, COALESCE(baki, 0), COALESCE(jama, 0), COALESCE(credit_limit, 50000.00), COALESCE(credit_blocked, false), COALESCE(status, 'Active')
    INTO v_cust_name, v_curr_baki, v_curr_jama, v_credit_limit, v_credit_blocked, v_status
    FROM public.customers
    WHERE id = p_customer_id AND business_id = v_business_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer not found or access denied.';
    END IF;

    -- Normalize transaction type
    IF LOWER(p_type) IN ('baki', 'udhaar', 'debit') THEN
        v_norm_type := 'Baki';
    ELSIF LOWER(p_type) IN ('jama', 'credit') THEN
        v_norm_type := 'Jama';
    ELSE
        RAISE EXCEPTION 'Invalid transaction type. Allowed values are "Baki" or "Jama".';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be greater than zero.';
    END IF;

    -- VALIDATIONS FOR BAKI TRANSACTIONS
    IF v_norm_type = 'Baki' THEN
        IF v_credit_blocked THEN
            RAISE EXCEPTION 'Credit is blocked for this customer.';
        END IF;

        IF LOWER(v_status) = 'inactive' THEN
            RAISE EXCEPTION 'Customer account is currently inactive.';
        END IF;

        v_new_baki := v_curr_baki + p_amount;
        v_new_jama := v_curr_jama;
        v_new_outstanding := v_new_baki - v_new_jama;

        IF v_new_outstanding > v_credit_limit THEN
            RAISE EXCEPTION 'Udhar exceeds the customer''s credit limit.';
        END IF;
    ELSE
        -- Jama payment reduces balance
        v_new_baki := v_curr_baki;
        v_new_jama := v_curr_jama + p_amount;
        v_new_outstanding := v_new_baki - v_new_jama;
    END IF;

    -- Update Customer balance atomically
    UPDATE public.customers
    SET baki = v_new_baki,
        jama = v_new_jama,
        updated_at = NOW()
    WHERE id = p_customer_id AND business_id = v_business_id;

    -- Insert Transaction row in public.udhaari
    INSERT INTO public.udhaari (
        business_id, customer_id, customer_name, type, amount, notes, date, status, user_id
    ) VALUES (
        v_business_id, p_customer_id, v_cust_name, v_norm_type, p_amount, COALESCE(p_notes, v_norm_type || ' payment'), NOW(), 'Completed', v_user_id
    ) RETURNING id INTO v_txn_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_txn_id,
        'customer_id', p_customer_id,
        'baki', v_new_baki,
        'jama', v_new_jama,
        'outstanding', v_new_outstanding
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_udhaari_transaction TO authenticated;

-- 6. BUSINESS-SCOPED PRIVATE STORAGE RLS FOR CUSTOMER PHOTOS ({business_id}/photos/{filename})
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer_photos', 'customer_photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS Policies (Business Isolation by Path Prefix)
DROP POLICY IF EXISTS "Customer Photos Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Business Read" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Business Insert" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Business Update" ON storage.objects;
DROP POLICY IF EXISTS "Customer Photos Business Delete" ON storage.objects;

CREATE POLICY "Customer Photos Business Read" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'customer_photos'
    AND (storage.foldername(name))[1] = public.get_auth_business_id()::text
);

CREATE POLICY "Customer Photos Business Insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'customer_photos'
    AND (storage.foldername(name))[1] = public.get_auth_business_id()::text
);

CREATE POLICY "Customer Photos Business Update" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'customer_photos'
    AND (storage.foldername(name))[1] = public.get_auth_business_id()::text
);

CREATE POLICY "Customer Photos Business Delete" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'customer_photos'
    AND (storage.foldername(name))[1] = public.get_auth_business_id()::text
);
