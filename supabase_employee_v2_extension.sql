-- ========================================================
-- CRM V2 — EMPLOYEE MODULE EXTENSION & TRANSACTIONS TABLE
-- ========================================================

-- 1. EXTEND PUBLIC.EMPLOYEES TABLE (NON-DESTRUCTIVE - SAFE TO RUN ANY TIME)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS uid TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Staff';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS joined_on DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS left_on DATE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS active_days INT DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS salary NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS udhaar_balance NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS ctc_ytd NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 2. CREATE EMPLOYEE TRANSACTIONS TABLE (FINANCIAL & ACTIVITY RECORDS)
CREATE TABLE IF NOT EXISTS public.employee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_uid TEXT,
    type TEXT NOT NULL, -- 'Gift', 'Bonus', 'Extra Payment', 'Employee Udhaar', 'Labour Expense', 'Udhaar Repayment'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES FOR EMPLOYEES & EMPLOYEE TRANSACTIONS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read employees" ON public.employees;
CREATE POLICY "Allow authenticated read employees" ON public.employees FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert employees" ON public.employees;
CREATE POLICY "Allow authenticated insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update employees" ON public.employees;
CREATE POLICY "Allow authenticated update employees" ON public.employees FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete employees" ON public.employees;
CREATE POLICY "Allow authenticated delete employees" ON public.employees FOR DELETE TO authenticated USING (true);

ALTER TABLE public.employee_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read employee_transactions" ON public.employee_transactions;
CREATE POLICY "Allow authenticated read employee_transactions" ON public.employee_transactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert employee_transactions" ON public.employee_transactions;
CREATE POLICY "Allow authenticated insert employee_transactions" ON public.employee_transactions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update employee_transactions" ON public.employee_transactions;
CREATE POLICY "Allow authenticated update employee_transactions" ON public.employee_transactions FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete employee_transactions" ON public.employee_transactions;
CREATE POLICY "Allow authenticated delete employee_transactions" ON public.employee_transactions FOR DELETE TO authenticated USING (true);

