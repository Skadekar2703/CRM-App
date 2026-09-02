-- ============================================================================
-- CRM APP KMP - SUPABASE PRODUCTION DATABASE MIGRATION SCRIPT
-- Safe, Idempotent, Production-Ready Setup for Items, Sales & POS RPC
-- ============================================================================

-- 0. PROFILES TABLE SETUP & SECURITY
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- TRIGGER TO PREVENT CLIENT-SIDE ROLE ESCALATION
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Users are not allowed to change their own role.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_role_update ON public.profiles;
CREATE TRIGGER tr_prevent_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_update();


-- 1. ITEMS / PRODUCTS TABLE SETUP (SAFE COLUMN ADDITIONS FOR EXISTING SCHEMAS)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT DEFAULT 'Generic',
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    unit TEXT DEFAULT 'Pcs',
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_alert INT NOT NULL DEFAULT 5,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure missing columns are added safely if table already exists
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'Generic';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Pcs';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS low_stock_alert INT NOT NULL DEFAULT 5;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- 2. CUSTOMERS TABLE SETUP
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    area TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 3. SALES TRANSACTIONS TABLE SETUP
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    user_id UUID,
    sale_date TIMESTAMPTZ DEFAULT now(),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    status TEXT NOT NULL DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 4. SALE LINE ITEMS TABLE SETUP
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    sku TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00;


-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items(sku);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON public.sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON public.sale_items(item_id);


-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Items RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read items" ON public.items;
CREATE POLICY "Allow authenticated read items" ON public.items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert items" ON public.items;
CREATE POLICY "Allow authenticated insert items" ON public.items FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update items" ON public.items;
CREATE POLICY "Allow authenticated update items" ON public.items FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete items" ON public.items;
CREATE POLICY "Allow authenticated delete items" ON public.items FOR DELETE TO authenticated USING (true);

-- Customers RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read customers" ON public.customers;
CREATE POLICY "Allow authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert customers" ON public.customers;
CREATE POLICY "Allow authenticated insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

-- Sales RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read sales" ON public.sales;
CREATE POLICY "Allow authenticated read sales" ON public.sales FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert sales" ON public.sales;
CREATE POLICY "Allow authenticated insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

-- Sale Items RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read sale_items" ON public.sale_items;
CREATE POLICY "Allow authenticated read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert sale_items" ON public.sale_items;
CREATE POLICY "Allow authenticated insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);


-- 7. ATOMIC TRANSACTION POS COMPLETE_SALE RPC FUNCTION
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
    -- A. Generate Invoice Number (e.g., INV-20260830-4821)
    v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- B. Validate Stock for all cart items in a single atomic lock (FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'item_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        IF v_item_id IS NOT NULL THEN
            SELECT stock_quantity, name INTO v_curr_stock, v_item_name
            FROM public.items WHERE id = v_item_id FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Item not found in inventory.';
            END IF;

            IF v_curr_stock < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for "%". Only % units available.', v_item_name, v_curr_stock;
            END IF;
        END IF;
    END LOOP;

    -- C. Insert Sale Header Record
    INSERT INTO public.sales (
        invoice_number, customer_id, customer_name, user_id,
        subtotal, discount, tax, total, payment_method, status
    ) VALUES (
        v_invoice_no, p_customer_id, p_customer_name, v_user_id,
        p_subtotal, p_discount, p_tax, p_total, p_payment_method, 'Completed'
    ) RETURNING id INTO v_sale_id;

    -- D. Insert Line Items and Decrement Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_item_id := (v_item->>'item_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        v_item_name := v_item->>'item_name';
        v_sku := v_item->>'sku';
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_subtotal := (v_item->>'subtotal')::NUMERIC;

        INSERT INTO public.sale_items (
            sale_id, item_id, item_name, sku, quantity, unit_price, subtotal
        ) VALUES (
            v_sale_id, v_item_id, v_item_name, v_sku, v_qty, v_unit_price, v_subtotal
        );

        IF v_item_id IS NOT NULL THEN
            UPDATE public.items
            SET stock_quantity = stock_quantity - v_qty,
                updated_at = NOW()
            WHERE id = v_item_id;
        END IF;
    END LOOP;

    -- E. Return Receipt Data Object
    RETURN jsonb_build_object(
        'id', v_sale_id,
        'invoice_number', v_invoice_no,
        'total', p_total,
        'created_at', NOW()
    );
END;
$$;


-- 8. INITIAL SEED DATA (SAFE IF CONFLICT)
INSERT INTO public.items (name, brand, sku, category, unit, stock_quantity, low_stock_alert, price, status) VALUES
('Cotton Suit Fabric 5m', 'Kohinoor', 'TEX-001', 'Textiles', 'Meter', 45, 10, 1850.00, 'Active'),
('Denim Jeans Material Roll', 'DenimCorp', 'TEX-002', 'Textiles', 'Roll', 12, 5, 4200.00, 'Active'),
('Silk Dupatta Special', 'FabIndia', 'TEX-003', 'Textiles', 'Pcs', 5, 5, 950.00, 'Low Stock'),
('Brass Door Handle Heavy', 'Godrej', 'HDR-101', 'Hardware', 'Pcs', 80, 15, 650.00, 'Active'),
('Stainless Steel Hinges Set', 'Link', 'HDR-102', 'Hardware', 'Set', 3, 10, 320.00, 'Low Stock'),
('LED Ceiling Light 15W', 'Philips', 'ELE-201', 'Electronics', 'Pcs', 0, 5, 480.00, 'Draft'),
('Copper Wire Roll 90m', 'Havells', 'ELE-202', 'Electronics', 'Roll', 25, 8, 2450.00, 'Active')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.customers (name, phone, email, area) VALUES
('Walk-in Customer', '', '', 'Local'),
('Sharma Hardware', '+91 98123 45678', 'sharma@hardware.com', 'West Zone'),
('Ramesh Textiles', '+91 98765 43210', 'ramesh@textiles.com', 'South Market'),
('Gupta Enterprises', '+91 97654 32109', 'gupta@enterprises.com', 'Central Plaza'),
('Vijay Kirana', '+91 99887 76655', 'vijay@kirana.com', 'North Market')
ON CONFLICT DO NOTHING;

-- Ensure customer table has baki, jama & opening balance columns
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS baki NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS jama NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update customer policies for full CRUD
DROP POLICY IF EXISTS "Allow authenticated update customers" ON public.customers;
CREATE POLICY "Allow authenticated update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete customers" ON public.customers;
CREATE POLICY "Allow authenticated delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- 8B. UDHAARI TRANSACTIONS TABLE SETUP
CREATE TABLE IF NOT EXISTS public.udhaari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    type TEXT NOT NULL, -- 'Baki' or 'Jama'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'Completed',
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.udhaari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated read udhaari" ON public.udhaari FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated insert udhaari" ON public.udhaari FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated update udhaari" ON public.udhaari FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated delete udhaari" ON public.udhaari FOR DELETE TO authenticated USING (true);



-- 9. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read categories" ON public.categories;
CREATE POLICY "Allow authenticated read categories" ON public.categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert categories" ON public.categories;
CREATE POLICY "Allow authenticated insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update categories" ON public.categories;
CREATE POLICY "Allow authenticated update categories" ON public.categories FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete categories" ON public.categories;
CREATE POLICY "Allow authenticated delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

INSERT INTO public.categories (name, description) VALUES
('Textiles', 'Fabrics, clothing materials and rolls'),
('Hardware', 'Tools, handles, hinges and building hardware'),
('Electronics', 'Wires, bulbs and electrical appliances'),
('General', 'Default product category')
ON CONFLICT (name) DO NOTHING;


-- 10. AREAS TABLE
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read areas" ON public.areas;
CREATE POLICY "Allow authenticated read areas" ON public.areas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert areas" ON public.areas;
CREATE POLICY "Allow authenticated insert areas" ON public.areas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update areas" ON public.areas;
CREATE POLICY "Allow authenticated update areas" ON public.areas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete areas" ON public.areas;
CREATE POLICY "Allow authenticated delete areas" ON public.areas FOR DELETE TO authenticated USING (true);

INSERT INTO public.areas (name, code) VALUES
('Local Market', 'LOC-01'),
('West Zone', 'WZ-02'),
('South Market', 'SM-03'),
('Central Plaza', 'CP-04'),
('North Market', 'NM-05')
ON CONFLICT (name) DO NOTHING;


-- 11. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    area TEXT,
    company TEXT,
    outstanding_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

INSERT INTO public.suppliers (name, phone, email, area, company, outstanding_balance) VALUES
('Reliance Textiles Ltd', '+91 91111 22222', 'sales@reliancetex.com', 'West Zone', 'Reliance Ind', 45000.00),
('Godrej Wholesale Hardware', '+91 93333 44444', 'contact@godrejhw.com', 'Central Plaza', 'Godrej Ltd', 12500.00),
('Havells India Electricals', '+91 95555 66666', 'support@havells.com', 'North Market', 'Havells Inc', 0.00)
ON CONFLICT DO NOTHING;


-- 12. UDHAARI (CREDIT & JAMA TRANSACTIONS) TABLE
CREATE TABLE IF NOT EXISTS public.udhaari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Udhaar', -- 'Udhaar' or 'Jama'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.udhaari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated read udhaari" ON public.udhaari FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated insert udhaari" ON public.udhaari FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated update udhaari" ON public.udhaari FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete udhaari" ON public.udhaari;
CREATE POLICY "Allow authenticated delete udhaari" ON public.udhaari FOR DELETE TO authenticated USING (true);


-- 13. CHEQUES TABLE
CREATE TABLE IF NOT EXISTS public.cheques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_name TEXT NOT NULL,
    party_type TEXT DEFAULT 'Customer', -- 'Customer' or 'Supplier'
    cheque_number TEXT NOT NULL,
    bank_name TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    issue_date TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Cleared', 'Bounced'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read cheques" ON public.cheques;
CREATE POLICY "Allow authenticated read cheques" ON public.cheques FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert cheques" ON public.cheques;
CREATE POLICY "Allow authenticated insert cheques" ON public.cheques FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update cheques" ON public.cheques;
CREATE POLICY "Allow authenticated update cheques" ON public.cheques FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete cheques" ON public.cheques;
CREATE POLICY "Allow authenticated delete cheques" ON public.cheques FOR DELETE TO authenticated USING (true);


-- 14. TRANSPORTS TABLE
CREATE TABLE IF NOT EXISTS public.transports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vehicle_number TEXT,
    driver_name TEXT,
    phone TEXT,
    route TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read transports" ON public.transports;
CREATE POLICY "Allow authenticated read transports" ON public.transports FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert transports" ON public.transports;
CREATE POLICY "Allow authenticated insert transports" ON public.transports FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update transports" ON public.transports;
CREATE POLICY "Allow authenticated update transports" ON public.transports FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete transports" ON public.transports;
CREATE POLICY "Allow authenticated delete transports" ON public.transports FOR DELETE TO authenticated USING (true);


-- 15. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    designation TEXT,
    department TEXT,
    salary NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read employees" ON public.employees;
CREATE POLICY "Allow authenticated read employees" ON public.employees FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert employees" ON public.employees;
CREATE POLICY "Allow authenticated insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update employees" ON public.employees;
CREATE POLICY "Allow authenticated update employees" ON public.employees FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete employees" ON public.employees;
CREATE POLICY "Allow authenticated delete employees" ON public.employees FOR DELETE TO authenticated USING (true);


-- 16. DAAG (DISPATCH / GOODS MOVEMENT) TABLE
CREATE TABLE IF NOT EXISTS public.daag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daag_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    transport_name TEXT,
    items_summary TEXT,
    weight NUMERIC(8, 2) DEFAULT 0.0,
    parcels INT DEFAULT 1,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.daag ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read daag" ON public.daag;
CREATE POLICY "Allow authenticated read daag" ON public.daag FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert daag" ON public.daag;
CREATE POLICY "Allow authenticated insert daag" ON public.daag FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update daag" ON public.daag;
CREATE POLICY "Allow authenticated update daag" ON public.daag FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete daag" ON public.daag;
CREATE POLICY "Allow authenticated delete daag" ON public.daag FOR DELETE TO authenticated USING (true);


-- 17. NOTEPAD / NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read notes" ON public.notes;
CREATE POLICY "Allow authenticated read notes" ON public.notes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert notes" ON public.notes;
CREATE POLICY "Allow authenticated insert notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update notes" ON public.notes;
CREATE POLICY "Allow authenticated update notes" ON public.notes FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete notes" ON public.notes;
CREATE POLICY "Allow authenticated delete notes" ON public.notes FOR DELETE TO authenticated USING (true);


-- 18. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ DEFAULT now(),
    priority TEXT DEFAULT 'Medium',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read reminders" ON public.reminders;
CREATE POLICY "Allow authenticated read reminders" ON public.reminders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert reminders" ON public.reminders;
CREATE POLICY "Allow authenticated insert reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update reminders" ON public.reminders;
CREATE POLICY "Allow authenticated update reminders" ON public.reminders FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete reminders" ON public.reminders;
CREATE POLICY "Allow authenticated delete reminders" ON public.reminders FOR DELETE TO authenticated USING (true);


-- 19. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_mode TEXT DEFAULT 'Cash',
    expense_date TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read expenses" ON public.expenses;
CREATE POLICY "Allow authenticated read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert expenses" ON public.expenses;
CREATE POLICY "Allow authenticated insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update expenses" ON public.expenses;
CREATE POLICY "Allow authenticated update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete expenses" ON public.expenses;
CREATE POLICY "Allow authenticated delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);


-- 20. SUPPLIER LEDGER TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.supplier_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'Purchase', 'Payment', 'Debit', 'Credit'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    date TIMESTAMPTZ DEFAULT now(),
    reference TEXT,
    notes TEXT,
    running_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.supplier_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read supplier_ledger" ON public.supplier_ledger;
CREATE POLICY "Allow authenticated read supplier_ledger" ON public.supplier_ledger FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert supplier_ledger" ON public.supplier_ledger;
CREATE POLICY "Allow authenticated insert supplier_ledger" ON public.supplier_ledger FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update supplier_ledger" ON public.supplier_ledger;
CREATE POLICY "Allow authenticated update supplier_ledger" ON public.supplier_ledger FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete supplier_ledger" ON public.supplier_ledger;
CREATE POLICY "Allow authenticated delete supplier_ledger" ON public.supplier_ledger FOR DELETE TO authenticated USING (true);


-- 21. CASH BOOK TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.cash_book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'Income' or 'Expense'
    category TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    transaction_date TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    reference TEXT,
    running_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cash_book ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read cash_book" ON public.cash_book;
CREATE POLICY "Allow authenticated read cash_book" ON public.cash_book FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert cash_book" ON public.cash_book;
CREATE POLICY "Allow authenticated insert cash_book" ON public.cash_book FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update cash_book" ON public.cash_book;
CREATE POLICY "Allow authenticated update cash_book" ON public.cash_book FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete cash_book" ON public.cash_book;
CREATE POLICY "Allow authenticated delete cash_book" ON public.cash_book FOR DELETE TO authenticated USING (true);

