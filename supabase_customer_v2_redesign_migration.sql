-- ============================================================================
-- CRM APP KMP - CUSTOMER MODULE V2 REDESIGN SCHEMA MIGRATION
-- Idempotent, Safe & Non-Destructive Extension to public.customers and public.udhaari
-- ============================================================================

-- 1. ADD MISSING CUSTOMER COLUMNS SAFELY
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

-- 2. SAFELY POPULATE MISSING CUSTOMER_ID AND CUSTOMER_CODE FOR EXISTING RECORDS
DO $$
DECLARE
    r RECORD;
    v_counter INT := 100001;
BEGIN
    FOR r IN SELECT id FROM public.customers WHERE customer_id IS NULL OR customer_id = '' ORDER BY created_at ASC LOOP
        UPDATE public.customers 
        SET customer_id = v_counter::TEXT,
            customer_code = COALESCE(customer_code, 'Cd' || LPAD(v_counter::TEXT, 12, '0')),
            cibil_status = COALESCE(cibil_status, 'Good'),
            credit_limit = COALESCE(credit_limit, 50000.00),
            status = COALESCE(status, 'Active'),
            credit_blocked = COALESCE(credit_blocked, false)
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

-- 4. ATOMIC CREDIT-LIMIT & CREDIT-BLOCK ENFORCED UDHAARI TRANSACTION RPC
CREATE OR REPLACE FUNCTION public.add_udhaari_transaction(
    p_customer_id UUID,
    p_type TEXT, -- 'Baki' (or 'Udhaar') or 'Jama'
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

    -- Normalize transaction type ('Baki' vs 'Jama')
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

GRANT EXECUTE ON FUNCTION public.add_udhaari_transaction(UUID, TEXT, NUMERIC, TEXT) TO authenticated;

-- 5. ADMIN-ONLY UPDATE & DELETE POLICIES FOR PUBLIC.CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers Business Update" ON public.customers;
DROP POLICY IF EXISTS "Customers Business Update Admin Only" ON public.customers;
DROP POLICY IF EXISTS "Customers Business Delete Admin Only" ON public.customers;

-- READ: All authenticated members in business
CREATE POLICY "Customers Business Read" ON public.customers
FOR SELECT TO authenticated
USING (business_id = public.get_auth_business_id());

-- INSERT: All authenticated members in business
CREATE POLICY "Customers Business Insert" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (business_id = public.get_auth_business_id());

-- UPDATE: ADMIN ONLY (STAFF CANNOT MODIFY MASTER CUSTOMER DETAILS)
CREATE POLICY "Customers Business Update Admin Only" ON public.customers
FOR UPDATE TO authenticated
USING (
    business_id = public.get_auth_business_id()
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() 
          AND UPPER(role) = 'ADMIN'
    )
)
WITH CHECK (
    business_id = public.get_auth_business_id()
    AND EXISTS (
        SELECT 1 FROM public.business_members 
        WHERE id = auth.uid() 
          AND UPPER(role) = 'ADMIN'
    )
);

-- DELETE: ADMIN ONLY
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
