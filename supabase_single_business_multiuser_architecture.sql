-- ============================================================================
-- CRM APP KMP - SINGLE BUSINESS ACCOUNT & MULTI-USER ARCHITECTURE MIGRATION
-- Production-Hardened Migration to Business-Level Data Ownership (business_id)
-- ============================================================================

-- 1. CREATE BUSINESSES TABLE & SEED DEFAULT SINGLE BUSINESS ACCOUNT
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default single business account if not present
INSERT INTO public.businesses (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Single Business Account')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. CREATE / UPDATE BUSINESS MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.businesses(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'STAFF')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT business_members_username_key UNIQUE (username)
);

ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS business_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'STAFF';
ALTER TABLE public.business_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';

CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_username ON public.business_members(LOWER(TRIM(username)));

-- 3. LINK EXISTING AUTH USERS TO BUSINESS MEMBERS (ROW-BY-ROW SAFE SYNC WITH CONFLICT SKIPPING)
DO $$
DECLARE
    u RECORD;
    v_username TEXT;
    v_role TEXT;
    conflict_count INT := 0;
BEGIN
    FOR u IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
        -- Compute normalized username
        v_username := LOWER(TRIM(COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))));
        
        -- Compute role (default to STAFF unless explicitly ADMIN)
        v_role := CASE 
            WHEN UPPER(COALESCE(u.raw_user_meta_data->>'role', '')) = 'ADMIN' THEN 'ADMIN'
            ELSE 'STAFF'
        END;

        -- Check 1: Skip if auth user is ALREADY registered in business_members by id
        IF EXISTS (SELECT 1 FROM public.business_members WHERE id = u.id) THEN
            CONTINUE;
        END IF;

        -- Check 2: Skip if username is ALREADY taken in business_members by another member
        IF EXISTS (SELECT 1 FROM public.business_members WHERE LOWER(TRIM(username)) = v_username) THEN
            conflict_count := conflict_count + 1;
            RAISE NOTICE 'SKIPPED USERNAME CONFLICT: Auth User ID %, Email "%", Attempted Username "%" (already taken)', 
                u.id, u.email, v_username;
            CONTINUE;
        END IF;

        -- Check 3: Safely insert single row with EXCEPTION guard
        BEGIN
            INSERT INTO public.business_members (id, business_id, username, role, status)
            VALUES (u.id, '00000000-0000-0000-0000-000000000001'::uuid, v_username, v_role, 'Active');
        EXCEPTION WHEN unique_violation THEN
            conflict_count := conflict_count + 1;
            RAISE NOTICE 'SKIPPED DUPLICATE USERNAME ON INSERT: Auth User ID %, Email "%", Username "%"', 
                u.id, u.email, v_username;
        END;
    END LOOP;

    IF conflict_count > 0 THEN
        RAISE NOTICE 'TOTAL SKIPPED CONFLICTS: %. Existing accounts were preserved without error.', conflict_count;
    END IF;
END $$;

-- 4. ADD BUSINESS_ID COLUMNS & SAFELY POPULATE EXISTING RECORDS FOR ALL 17 TABLES
DO $$
DECLARE
    tbl TEXT;
    tbls TEXT[] := ARRAY[
        'items', 'customers', 'sales', 'sale_items', 'categories', 'areas', 
        'suppliers', 'udhaari', 'cheques', 'transports', 'employees', 
        'daag', 'notes', 'reminders', 'expenses', 'supplier_ledger', 'cash_book'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        -- Step A: Add business_id column if missing
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;', tbl);
        
        -- Step B: Assign all existing rows without business_id to the single business account
        EXECUTE format('UPDATE public.%I SET business_id = %L WHERE business_id IS NULL;', tbl, '00000000-0000-0000-0000-000000000001');
        
        -- Step C: Set default and NOT NULL constraint after populating existing data
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN business_id SET DEFAULT %L;', tbl, '00000000-0000-0000-0000-000000000001');
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN business_id SET NOT NULL;', tbl);
        
        -- Step D: Create performance index
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(business_id);', 'idx_' || tbl || '_business_id', tbl);
    END LOOP;
END $$;

-- 5. HARDENED SECURITY DEFINER HELPER FUNCTIONS (FIXED SEARCH_PATH)
CREATE OR REPLACE FUNCTION public.get_auth_business_id()
RETURNS UUID STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT business_id FROM public.business_members
  WHERE id = auth.uid() AND status = 'Active'
  LIMIT 1;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT role FROM public.business_members
  WHERE id = auth.uid() AND status = 'Active'
  LIMIT 1;
$$ LANGUAGE sql;

-- 6. USERNAME LOOKUP FUNCTION FOR USERNAME/PASSWORD LOGIN
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, role TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
    RETURN QUERY
    SELECT u.email::TEXT, bm.role, bm.status
    FROM public.business_members bm
    JOIN auth.users u ON u.id = bm.id
    WHERE LOWER(TRIM(bm.username)) = LOWER(TRIM(p_username))
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_email_by_username(TEXT) TO anon, authenticated;

-- 7. RE-DEFINE COMPLETE_SALE STORED PROCEDURE TO USE BUSINESS_ID
CREATE OR REPLACE FUNCTION public.complete_sale(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_tax NUMERIC,
    p_total NUMERIC,
    p_payment_method TEXT,
    p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_business_id UUID;
    v_sale_id UUID;
    v_invoice_no TEXT;
    v_item JSONB;
    v_item_id UUID;
    v_qty INT;
    v_curr_stock INT;
    v_item_name TEXT;
    v_sku TEXT;
    v_unit_price NUMERIC;
    v_subtotal NUMERIC;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required. Current user session is invalid.';
    END IF;

    v_business_id := public.get_auth_business_id();
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User does not belong to an active business account.';
    END IF;

    -- Validate Customer Ownership within Business
    IF p_customer_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND business_id = v_business_id) THEN
            RAISE EXCEPTION 'Unauthorized: Customer does not belong to your business account.';
        END IF;
    END IF;

    -- Generate Invoice Number
    v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- Validate Stock & Item Ownership within Business
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'item_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        IF v_item_id IS NOT NULL THEN
            SELECT stock_quantity, name INTO v_curr_stock, v_item_name
            FROM public.items
            WHERE id = v_item_id AND business_id = v_business_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Item not found in business inventory.';
            END IF;

            IF v_curr_stock < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for "%". Only % units available.', v_item_name, v_curr_stock;
            END IF;
        END IF;
    END LOOP;

    -- Insert Sale Header Record with business_id
    INSERT INTO public.sales (
        invoice_number, customer_id, customer_name, user_id, business_id,
        subtotal, discount, tax, total, payment_method, status
    ) VALUES (
        v_invoice_no, p_customer_id, p_customer_name, v_user_id, v_business_id,
        p_subtotal, p_discount, p_tax, p_total, p_payment_method, 'Completed'
    ) RETURNING id INTO v_sale_id;

    -- Insert Line Items & Decrement Inventory Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'item_id')::UUID;
        v_item_name := v_item->>'item_name';
        v_sku := v_item->>'sku';
        v_qty := (v_item->>'quantity')::INT;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_subtotal := (v_item->>'subtotal')::NUMERIC;

        INSERT INTO public.sale_items (
            sale_id, item_id, item_name, sku, quantity, unit_price, subtotal, user_id, business_id
        ) VALUES (
            v_sale_id, v_item_id, v_item_name, v_sku, v_qty, v_unit_price, v_subtotal, v_user_id, v_business_id
        );

        IF v_item_id IS NOT NULL THEN
            UPDATE public.items
            SET stock_quantity = stock_quantity - v_qty,
                updated_at = NOW()
            WHERE id = v_item_id AND business_id = v_business_id;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'invoice_number', v_invoice_no
    );
END;
$$;

-- 8. DYNAMIC CLEANUP OF ALL OLD RLS POLICIES & ENFORCEMENT OF BUSINESS SECURITY
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_members;', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can view members of same business" ON public.business_members
FOR SELECT TO authenticated
USING (business_id = public.get_auth_business_id());

CREATE POLICY "Admins can manage business members" ON public.business_members
FOR ALL TO authenticated
USING (business_id = public.get_auth_business_id() AND public.get_auth_role() = 'ADMIN')
WITH CHECK (business_id = public.get_auth_business_id() AND public.get_auth_role() = 'ADMIN');

-- Apply Business RLS Policies across all 17 CRM tables after purging ALL old policies
DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
    tbls TEXT[] := ARRAY[
        'items', 'customers', 'sales', 'sale_items', 'categories', 'areas', 
        'suppliers', 'udhaari', 'cheques', 'transports', 'employees', 
        'daag', 'notes', 'reminders', 'expenses', 'supplier_ledger', 'cash_book'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- DYNAMIC PURGE: Drop ALL existing policies on table regardless of policy name
        FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl) LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
        END LOOP;

        -- Create business-scoped policies
        EXECUTE format('CREATE POLICY "Business members can view %I" ON public.%I FOR SELECT TO authenticated USING (business_id = public.get_auth_business_id());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Business members can insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (business_id = public.get_auth_business_id());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Business members can update %I" ON public.%I FOR UPDATE TO authenticated USING (business_id = public.get_auth_business_id()) WITH CHECK (business_id = public.get_auth_business_id());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Business members can delete %I" ON public.%I FOR DELETE TO authenticated USING (business_id = public.get_auth_business_id());', tbl, tbl);
    END LOOP;
END $$;
