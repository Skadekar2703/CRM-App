-- ============================================================================
-- CRM APP KMP - SAFE ACCOUNT-SCOPED UNIQUENESS MIGRATION
-- Database-First, Non-Destructive Account Uniqueness for Multi-Tenant CRM
-- ============================================================================

-- STEP 1: SAFE DEDUPLICATION & REFERENCE RE-LINKING FOR MASTER ENTITIES

DO $$
DECLARE
    rec RECORD;
    v_canonical_id UUID;
BEGIN
    -- 1A. AREAS (Re-link customers.area)
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.areas
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        UPDATE public.customers SET area = (SELECT name FROM public.areas WHERE id = v_canonical_id) WHERE area IN (SELECT name FROM public.areas WHERE id = ANY(rec.ids[2:]));
        DELETE FROM public.areas WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1B. CATEGORIES (Re-link items.category)
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.categories
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        UPDATE public.items SET category = (SELECT name FROM public.categories WHERE id = v_canonical_id) WHERE category IN (SELECT name FROM public.categories WHERE id = ANY(rec.ids[2:]));
        DELETE FROM public.categories WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1C. TRANSPORTS
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.transports
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        DELETE FROM public.transports WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1D. SUPPLIERS (Re-link supplier_ledger.supplier_id)
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.suppliers
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        UPDATE public.supplier_ledger SET supplier_id = v_canonical_id WHERE supplier_id = ANY(rec.ids[2:]);
        DELETE FROM public.suppliers WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1E. EMPLOYEES
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.employees
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        DELETE FROM public.employees WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1F. CUSTOMERS (Re-link sales and udhaari records)
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.customers
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        UPDATE public.sales SET customer_id = v_canonical_id WHERE customer_id = ANY(rec.ids[2:]);
        UPDATE public.udhaari SET customer_id = v_canonical_id WHERE customer_id = ANY(rec.ids[2:]);
        DELETE FROM public.customers WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1G. ITEMS (Safely Merge stock_quantity & Re-link sale_items references)
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.items
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        UPDATE public.items 
        SET stock_quantity = COALESCE(stock_quantity, 0) + (
            SELECT COALESCE(SUM(stock_quantity), 0) FROM public.items WHERE id = ANY(rec.ids[2:])
        )
        WHERE id = v_canonical_id;

        UPDATE public.sale_items SET item_id = v_canonical_id WHERE item_id = ANY(rec.ids[2:]);
        DELETE FROM public.items WHERE id = ANY(rec.ids[2:]);
    END LOOP;
END $$;


-- STEP 2: DROP GLOBAL UNIQUE CONSTRAINTS AND CREATE ACCOUNT-SCOPED INDEXES

-- 2A. AREAS (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.areas DROP CONSTRAINT IF EXISTS areas_name_key;
DROP INDEX IF EXISTS public.areas_name_key;
DROP INDEX IF EXISTS public.idx_areas_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_user_id_name_unique
ON public.areas (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2B. CATEGORIES (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
DROP INDEX IF EXISTS public.categories_name_key;
DROP INDEX IF EXISTS public.idx_categories_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_id_name_unique
ON public.categories (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2C. TRANSPORTS (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.transports DROP CONSTRAINT IF EXISTS transports_name_key;
DROP INDEX IF EXISTS public.transports_name_key;
DROP INDEX IF EXISTS public.idx_transports_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transports_user_id_name_unique
ON public.transports (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2D. SUPPLIERS (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.suppliers DROP CONSTRAINT IF EXISTS suppliers_name_key;
DROP INDEX IF EXISTS public.suppliers_name_key;
DROP INDEX IF EXISTS public.idx_suppliers_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_user_id_name_unique
ON public.suppliers (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2E. EMPLOYEES (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_name_key;
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_mobile_key;
DROP INDEX IF EXISTS public.employees_name_key;
DROP INDEX IF EXISTS public.idx_employees_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id_name_unique
ON public.employees (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2F. CUSTOMERS (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.customers DROP CONSTRAINT IF EXISTS customers_name_key;
DROP INDEX IF EXISTS public.customers_name_key;
DROP INDEX IF EXISTS public.idx_customers_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_id_name_unique
ON public.customers (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2G. ITEMS (ACCOUNT-SCOPED)
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_name_key;
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_code_key;
DROP INDEX IF EXISTS public.items_name_key;
DROP INDEX IF EXISTS public.idx_items_user_id_name_unique;
DROP INDEX IF EXISTS public.idx_items_user_id_name_code_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_user_id_name_unique
ON public.items (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;
