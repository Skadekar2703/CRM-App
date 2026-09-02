-- ============================================================================
-- CRM APP KMP - MULTI-USER SUPABASE RLS SECURITY MIGRATION SCRIPT
-- Safe, Idempotent, Production-Ready Setup for Multi-User Data Isolation
-- ============================================================================

-- 1. ADD USER_ID COLUMNS TO ALL USER-OWNED CRM TABLES
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.udhaari ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.cheques ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.daag ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_ledger ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. SAFE DATA MIGRATION: ASSIGN EXISTING ORPHAN ROWS TO THE FIRST ACTIVE USER ID
DO $$
DECLARE
    v_first_user_id UUID;
BEGIN
    SELECT id INTO v_first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF v_first_user_id IS NOT NULL THEN
        UPDATE public.items SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.customers SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.sales SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.categories SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.areas SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.suppliers SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.udhaari SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.cheques SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.transports SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.employees SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.daag SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.notes SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.reminders SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.expenses SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.supplier_ledger SET user_id = v_first_user_id WHERE user_id IS NULL;
        UPDATE public.cash_book SET user_id = v_first_user_id WHERE user_id IS NULL;

        -- Update sale_items from parent sales table user_id
        UPDATE public.sale_items si
        SET user_id = s.user_id
        FROM public.sales s
        WHERE si.sale_id = s.id AND si.user_id IS NULL;

        UPDATE public.sale_items SET user_id = v_first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- 3. CREATE PERFORMANCE INDEXES ON USER_ID
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_user_id ON public.sale_items(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_areas_user_id ON public.areas(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_udhaari_user_id ON public.udhaari(user_id);
CREATE INDEX IF NOT EXISTS idx_cheques_user_id ON public.cheques(user_id);
CREATE INDEX IF NOT EXISTS idx_transports_user_id ON public.transports(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_daag_user_id ON public.daag(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_user_id ON public.supplier_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_book_user_id ON public.cash_book(user_id);

-- 4. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.udhaari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_book ENABLE ROW LEVEL SECURITY;

-- 5. DROP ALL PERMISSIVE RLS POLICIES
DROP POLICY IF EXISTS "Allow authenticated read items" ON public.items;
DROP POLICY IF EXISTS "Allow authenticated insert items" ON public.items;
DROP POLICY IF EXISTS "Allow authenticated update items" ON public.items;
DROP POLICY IF EXISTS "Allow authenticated delete items" ON public.items;

DROP POLICY IF EXISTS "Allow authenticated read customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated update customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated delete customers" ON public.customers;

DROP POLICY IF EXISTS "Allow authenticated read sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated insert sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated update sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated delete sales" ON public.sales;

DROP POLICY IF EXISTS "Allow authenticated read sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow authenticated insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow authenticated update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow authenticated delete sale_items" ON public.sale_items;

DROP POLICY IF EXISTS "Allow authenticated read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated delete categories" ON public.categories;

DROP POLICY IF EXISTS "Allow authenticated read areas" ON public.areas;
DROP POLICY IF EXISTS "Allow authenticated insert areas" ON public.areas;
DROP POLICY IF EXISTS "Allow authenticated update areas" ON public.areas;
DROP POLICY IF EXISTS "Allow authenticated delete areas" ON public.areas;

DROP POLICY IF EXISTS "Allow authenticated read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Allow authenticated read udhaari" ON public.udhaari;
DROP POLICY IF EXISTS "Allow authenticated insert udhaari" ON public.udhaari;
DROP POLICY IF EXISTS "Allow authenticated update udhaari" ON public.udhaari;
DROP POLICY IF EXISTS "Allow authenticated delete udhaari" ON public.udhaari;

DROP POLICY IF EXISTS "Allow authenticated read cheques" ON public.cheques;
DROP POLICY IF EXISTS "Allow authenticated insert cheques" ON public.cheques;
DROP POLICY IF EXISTS "Allow authenticated update cheques" ON public.cheques;
DROP POLICY IF EXISTS "Allow authenticated delete cheques" ON public.cheques;

DROP POLICY IF EXISTS "Allow authenticated read transports" ON public.transports;
DROP POLICY IF EXISTS "Allow authenticated insert transports" ON public.transports;
DROP POLICY IF EXISTS "Allow authenticated update transports" ON public.transports;
DROP POLICY IF EXISTS "Allow authenticated delete transports" ON public.transports;

DROP POLICY IF EXISTS "Allow authenticated read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated delete employees" ON public.employees;

DROP POLICY IF EXISTS "Allow authenticated read daag" ON public.daag;
DROP POLICY IF EXISTS "Allow authenticated insert daag" ON public.daag;
DROP POLICY IF EXISTS "Allow authenticated update daag" ON public.daag;
DROP POLICY IF EXISTS "Allow authenticated delete daag" ON public.daag;

DROP POLICY IF EXISTS "Allow authenticated read notes" ON public.notes;
DROP POLICY IF EXISTS "Allow authenticated insert notes" ON public.notes;
DROP POLICY IF EXISTS "Allow authenticated update notes" ON public.notes;
DROP POLICY IF EXISTS "Allow authenticated delete notes" ON public.notes;

DROP POLICY IF EXISTS "Allow authenticated read reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow authenticated insert reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow authenticated update reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow authenticated delete reminders" ON public.reminders;

DROP POLICY IF EXISTS "Allow authenticated read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated delete expenses" ON public.expenses;

DROP POLICY IF EXISTS "Allow authenticated read supplier_ledger" ON public.supplier_ledger;
DROP POLICY IF EXISTS "Allow authenticated insert supplier_ledger" ON public.supplier_ledger;
DROP POLICY IF EXISTS "Allow authenticated update supplier_ledger" ON public.supplier_ledger;
DROP POLICY IF EXISTS "Allow authenticated delete supplier_ledger" ON public.supplier_ledger;

DROP POLICY IF EXISTS "Allow authenticated read cash_book" ON public.cash_book;
DROP POLICY IF EXISTS "Allow authenticated insert cash_book" ON public.cash_book;
DROP POLICY IF EXISTS "Allow authenticated update cash_book" ON public.cash_book;
DROP POLICY IF EXISTS "Allow authenticated delete cash_book" ON public.cash_book;

-- 6. CREATE STRICT PER-USER RLS ISOLATION POLICIES FOR ALL CRM TABLES

-- ITEMS
CREATE POLICY "Users can view own items" ON public.items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own items" ON public.items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own items" ON public.items FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own items" ON public.items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CUSTOMERS
CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SALES
CREATE POLICY "Users can view own sales" ON public.sales FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sales" ON public.sales FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own sales" ON public.sales FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SALE ITEMS
CREATE POLICY "Users can view own sale_items" ON public.sale_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own sale_items" ON public.sale_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CATEGORIES
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE TO authenticated USING (user_id = auth.uid());

-- AREAS
CREATE POLICY "Users can view own areas" ON public.areas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own areas" ON public.areas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own areas" ON public.areas FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own areas" ON public.areas FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SUPPLIERS
CREATE POLICY "Users can view own suppliers" ON public.suppliers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own suppliers" ON public.suppliers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- UDHAARI
CREATE POLICY "Users can view own udhaari" ON public.udhaari FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own udhaari" ON public.udhaari FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own udhaari" ON public.udhaari FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own udhaari" ON public.udhaari FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CHEQUES
CREATE POLICY "Users can view own cheques" ON public.cheques FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own cheques" ON public.cheques FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own cheques" ON public.cheques FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own cheques" ON public.cheques FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TRANSPORTS
CREATE POLICY "Users can view own transports" ON public.transports FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transports" ON public.transports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own transports" ON public.transports FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own transports" ON public.transports FOR DELETE TO authenticated USING (user_id = auth.uid());

-- EMPLOYEES
CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE TO authenticated USING (user_id = auth.uid());

-- DAAG
CREATE POLICY "Users can view own daag" ON public.daag FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own daag" ON public.daag FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own daag" ON public.daag FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own daag" ON public.daag FOR DELETE TO authenticated USING (user_id = auth.uid());

-- NOTES
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- REMINDERS
CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE TO authenticated USING (user_id = auth.uid());

-- EXPENSES
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SUPPLIER LEDGER
CREATE POLICY "Users can view own supplier_ledger" ON public.supplier_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own supplier_ledger" ON public.supplier_ledger FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own supplier_ledger" ON public.supplier_ledger FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own supplier_ledger" ON public.supplier_ledger FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CASH BOOK
CREATE POLICY "Users can view own cash_book" ON public.cash_book FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own cash_book" ON public.cash_book FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own cash_book" ON public.cash_book FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own cash_book" ON public.cash_book FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 7. HARDEN ATOMIC COMPLETE_SALE RPC FUNCTION WITH USER OWNERSHIP VALIDATION
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
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID := auth.uid();
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
    -- Verify User Authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required. Current user session is invalid.';
    END IF;

    -- Verify Customer Ownership if customer_id provided
    IF p_customer_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND user_id = v_user_id) THEN
            RAISE EXCEPTION 'Unauthorized: Customer does not belong to the active user.';
        END IF;
    END IF;

    -- Generate Invoice Number
    v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- Validate Stock & Item Ownership for all cart items in a single atomic lock (FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'item_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        IF v_item_id IS NOT NULL THEN
            SELECT stock_quantity, name INTO v_curr_stock, v_item_name
            FROM public.items
            WHERE id = v_item_id AND user_id = v_user_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Item not found in user inventory or unauthorized access.';
            END IF;

            IF v_curr_stock < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for "%". Only % units available.', v_item_name, v_curr_stock;
            END IF;
        END IF;
    END LOOP;

    -- Insert Sale Header Record with User ID
    INSERT INTO public.sales (
        invoice_number, customer_id, customer_name, user_id,
        subtotal, discount, tax, total, payment_method, status
    ) VALUES (
        v_invoice_no, p_customer_id, p_customer_name, v_user_id,
        p_subtotal, p_discount, p_tax, p_total, p_payment_method, 'Completed'
    ) RETURNING id INTO v_sale_id;

    -- Insert Line Items with User ID and Decrement Inventory Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'item_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        v_item_name := v_item->>'item_name';
        v_sku := v_item->>'sku';
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_subtotal := (v_item->>'subtotal')::NUMERIC;

        INSERT INTO public.sale_items (
            sale_id, item_id, item_name, sku, quantity, unit_price, subtotal, user_id
        ) VALUES (
            v_sale_id, v_item_id, v_item_name, v_sku, v_qty, v_unit_price, v_subtotal, v_user_id
        );

        IF v_item_id IS NOT NULL THEN
            UPDATE public.items
            SET stock_quantity = stock_quantity - v_qty,
                updated_at = NOW()
            WHERE id = v_item_id AND user_id = v_user_id;
        END IF;
    END LOOP;

    -- Return Receipt Data Object
    RETURN jsonb_build_object(
        'id', v_sale_id,
        'invoice_number', v_invoice_no,
        'total', p_total,
        'created_at', NOW()
    );
END;
$$;
