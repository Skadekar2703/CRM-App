-- FIX BAKI AFTER JAMA PAYMENT MIGRATION
-- Total Baki Given = SUM(Baki transactions)
-- Total Jama = SUM(Jama transactions)
-- Current Baki = Total Baki Given - Total Jama

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
    v_current_baki NUMERIC(12, 2);
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
    ELSIF LOWER(p_type) IN ('jama', 'credit', 'payment') THEN
        v_norm_type := 'Jama';
    ELSE
        RAISE EXCEPTION 'Invalid transaction type. Allowed values are "Baki" or "Jama".';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be greater than zero.';
    END IF;

    -- VALIDATIONS & CALCULATIONS
    IF v_norm_type = 'Baki' THEN
        IF v_credit_blocked THEN
            RAISE EXCEPTION 'Credit is blocked for this customer.';
        END IF;

        IF LOWER(v_status) = 'inactive' THEN
            RAISE EXCEPTION 'Customer account is currently inactive.';
        END IF;

        v_new_baki := v_curr_baki + p_amount;
        v_new_jama := v_curr_jama;
        v_current_baki := v_new_baki - v_new_jama;

        IF v_current_baki > v_credit_limit THEN
            RAISE EXCEPTION 'Udhar exceeds the customer''s credit limit.';
        END IF;
    ELSE
        -- Jama payment increases total Jama collected
        v_new_baki := v_curr_baki;
        v_new_jama := v_curr_jama + p_amount;
        v_current_baki := v_new_baki - v_new_jama;
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
        'baki_given', v_new_baki,
        'jama', v_new_jama,
        'current_baki', v_current_baki
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_udhaari_transaction(UUID, TEXT, NUMERIC, TEXT) TO authenticated;
