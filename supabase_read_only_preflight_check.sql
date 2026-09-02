-- ============================================================================
-- CRM APP KMP - SAFE READ-ONLY MIGRATION PREFLIGHT CHECK SCRIPT
-- This script ONLY performs SELECT queries against the EXACT proposed indexes.
-- Modifies NO data, creates NO indexes, deletes NO records.
-- ============================================================================

-- 1. PREFLIGHT CHECK FOR AREAS INDEX: (user_id, LOWER(TRIM(name)))
SELECT 
    'areas' AS table_name,
    user_id,
    LOWER(TRIM(name)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.areas
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 2. PREFLIGHT CHECK FOR CATEGORIES INDEX: (user_id, LOWER(TRIM(name)))
SELECT 
    'categories' AS table_name,
    user_id,
    LOWER(TRIM(name)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.categories
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 3. PREFLIGHT CHECK FOR TRANSPORTS INDEX: (user_id, LOWER(TRIM(name)))
SELECT 
    'transports' AS table_name,
    user_id,
    LOWER(TRIM(name)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.transports
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 4. PREFLIGHT CHECK FOR SUPPLIERS INDEX: (user_id, LOWER(TRIM(name)))
SELECT 
    'suppliers' AS table_name,
    user_id,
    LOWER(TRIM(name)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.suppliers
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 5. PREFLIGHT CHECK FOR EMPLOYEES NAME INDEX: (user_id, LOWER(TRIM(name)))
SELECT 
    'employees_name' AS table_name,
    user_id,
    LOWER(TRIM(name)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.employees
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 6. PREFLIGHT CHECK FOR EMPLOYEES PHONE/MOBILE INDEX: (user_id, LOWER(TRIM(phone)))
SELECT 
    'employees_mobile' AS table_name,
    user_id,
    LOWER(TRIM(phone)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.employees
WHERE user_id IS NOT NULL AND phone IS NOT NULL
GROUP BY user_id, LOWER(TRIM(phone))
HAVING COUNT(*) > 1;


-- 7. PREFLIGHT CHECK FOR CUSTOMERS INDEX: (user_id, LOWER(TRIM(name)))
SELECT 
    'customers' AS table_name,
    user_id,
    LOWER(TRIM(name)) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.customers
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 8. PREFLIGHT CHECK FOR ITEMS INDEX: (user_id, LOWER(TRIM(name)), LOWER(TRIM(COALESCE(sku, id::text))))
SELECT 
    'items' AS table_name,
    user_id,
    LOWER(TRIM(name)) || ' ::: ' || LOWER(TRIM(COALESCE(sku, id::text))) AS target_unique_key,
    COUNT(*) AS duplicate_count,
    array_agg(id) AS record_ids
FROM public.items
WHERE user_id IS NOT NULL AND name IS NOT NULL
GROUP BY user_id, LOWER(TRIM(name)), LOWER(TRIM(COALESCE(sku, id::text)))
HAVING COUNT(*) > 1;
