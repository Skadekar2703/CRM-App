-- ============================================================================
-- CRM APP KMP - SAFE ACCOUNT-SCOPED UNIQUE CONSTRAINTS & DEDUPLICATION MIGRATION
-- Safely merges duplicate references, preserves data, drops global constraints,
-- and creates account-scoped unique indexes: (user_id, LOWER(TRIM(name)))
-- ============================================================================

-- STEP 1: SAFE AUTOMATIC DEDUPLICATION & REFERENCE MIGRATION FOR MASTER TABLES

DO $$
DECLARE
    rec RECORD;
    v_canonical_id UUID;
BEGIN
    -- 1A. DEDUPLICATE AREAS
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.areas
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];
        -- Update foreign references if any
        UPDATE public.customers SET area = (SELECT name FROM public.areas WHERE id = v_canonical_id) WHERE area IN (SELECT name FROM public.areas WHERE id = ANY(rec.ids[2:]));
        -- Remove duplicates
        DELETE FROM public.areas WHERE id = ANY(rec.ids[2:]);
    END LOOP;

    -- 1B. DEDUPLICATE CATEGORIES
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

    -- 1C. DEDUPLICATE TRANSPORTS
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

    -- 1D. DEDUPLICATE SUPPLIERS
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

    -- 1E. DEDUPLICATE EMPLOYEES
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

    -- 1F. DEDUPLICATE CUSTOMERS
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

    -- 1G. DEDUPLICATE ITEMS (Merge Stock & Migrate References to Canonical Item)
    FOR rec IN 
        SELECT user_id, LOWER(TRIM(name)) AS norm_name, array_agg(id ORDER BY created_at ASC) AS ids
        FROM public.items
        WHERE user_id IS NOT NULL AND name IS NOT NULL
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        v_canonical_id := rec.ids[1];

        -- Merge stock quantity into canonical record
        UPDATE public.items 
        SET stock = COALESCE(stock, 0) + (
            SELECT COALESCE(SUM(stock), 0) FROM public.items WHERE id = ANY(rec.ids[2:])
        )
        WHERE id = v_canonical_id;

        -- Migrate sale_items references to canonical item
        UPDATE public.sale_items SET item_id = v_canonical_id WHERE item_id = ANY(rec.ids[2:]);

        -- Delete duplicate items after reference migration
        DELETE FROM public.items WHERE id = ANY(rec.ids[2:]);
    END LOOP;
END $$;


-- STEP 2: DROP GLOBAL UNIQUE CONSTRAINTS AND CREATE ACCOUNT-SCOPED UNIQUE INDEXES

-- 2A. AREAS
ALTER TABLE IF EXISTS public.areas DROP CONSTRAINT IF EXISTS areas_name_key;
DROP INDEX IF EXISTS public.areas_name_key;
DROP INDEX IF EXISTS public.idx_areas_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_user_id_name_unique
ON public.areas (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2B. CATEGORIES
ALTER TABLE IF EXISTS public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
DROP INDEX IF EXISTS public.categories_name_key;
DROP INDEX IF EXISTS public.idx_categories_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_id_name_unique
ON public.categories (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2C. TRANSPORTS
ALTER TABLE IF EXISTS public.transports DROP CONSTRAINT IF EXISTS transports_name_key;
DROP INDEX IF EXISTS public.transports_name_key;
DROP INDEX IF EXISTS public.idx_transports_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transports_user_id_name_unique
ON public.transports (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2D. SUPPLIERS
ALTER TABLE IF EXISTS public.suppliers DROP CONSTRAINT IF EXISTS suppliers_name_key;
DROP INDEX IF EXISTS public.suppliers_name_key;
DROP INDEX IF EXISTS public.idx_suppliers_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_user_id_name_unique
ON public.suppliers (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2E. EMPLOYEES
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_name_key;
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_mobile_key;
DROP INDEX IF EXISTS public.employees_name_key;
DROP INDEX IF EXISTS public.idx_employees_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id_name_unique
ON public.employees (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2F. CUSTOMERS
ALTER TABLE IF EXISTS public.customers DROP CONSTRAINT IF EXISTS customers_name_key;
DROP INDEX IF EXISTS public.customers_name_key;
DROP INDEX IF EXISTS public.idx_customers_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_id_name_unique
ON public.customers (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2G. ITEMS
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_name_key;
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_code_key;
DROP INDEX IF EXISTS public.items_name_key;
DROP INDEX IF EXISTS public.idx_items_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_user_id_name_unique
ON public.items (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;
