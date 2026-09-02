-- ============================================================================
-- CRM APP KMP - SAFE 100% SCHEMA-ACCURATE READ-ONLY DUPLICATE DIAGNOSTIC SCRIPT
-- Strictly uses verified schema columns: items.stock_quantity, items.sku, items.name
-- Contains ONLY SELECT queries. Modifies NO data, creates NO indexes.
-- ============================================================================

-- 1. INSPECT NULL USER_ID RECORDS ACROSS ALL MASTER TABLES
SELECT 'areas' AS table_name, COUNT(*) AS null_user_id_count FROM public.areas WHERE user_id IS NULL
UNION ALL
SELECT 'categories', COUNT(*) FROM public.categories WHERE user_id IS NULL
UNION ALL
SELECT 'transports', COUNT(*) FROM public.transports WHERE user_id IS NULL
UNION ALL
SELECT 'suppliers', COUNT(*) FROM public.suppliers WHERE user_id IS NULL
UNION ALL
SELECT 'employees', COUNT(*) FROM public.employees WHERE user_id IS NULL
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers WHERE user_id IS NULL
UNION ALL
SELECT 'items', COUNT(*) FROM public.items WHERE user_id IS NULL;


-- 2. DETECT DUPLICATE AREAS PER ACCOUNT
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, array_agg(id) AS area_ids
FROM public.areas
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 3. DETECT DUPLICATE CATEGORIES PER ACCOUNT
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, array_agg(id) AS category_ids
FROM public.categories
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 4. DETECT DUPLICATE TRANSPORTS PER ACCOUNT
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, array_agg(id) AS transport_ids
FROM public.transports
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 5. DETECT DUPLICATE SUPPLIERS PER ACCOUNT
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, array_agg(id) AS supplier_ids
FROM public.suppliers
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 6. DETECT DUPLICATE EMPLOYEES PER ACCOUNT
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, array_agg(id) AS employee_ids
FROM public.employees
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 7. DETECT DUPLICATE CUSTOMERS PER ACCOUNT
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, array_agg(id) AS customer_ids
FROM public.customers
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 8. DETECT DUPLICATE ITEMS PER ACCOUNT BY DISPLAY NAME
SELECT user_id, LOWER(TRIM(name)) AS norm_name, COUNT(*) AS dup_count, 
       array_agg(id) AS item_ids, 
       array_agg(COALESCE(sku, 'NO_SKU')) AS skus, 
       array_agg(COALESCE(price, 0)) AS prices, 
       array_agg(COALESCE(stock_quantity, 0)) AS stock_quantities
FROM public.items
GROUP BY user_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;


-- 9. DETAILED RECORD VIEW FOR REPORTED ITEM "basmati rice premium 5kg"
SELECT id, user_id, name, sku, price, stock_quantity, created_at, updated_at
FROM public.items
WHERE LOWER(TRIM(name)) LIKE '%basmati rice premium 5kg%';


-- 10. CHECK FOREIGN KEY REFERENCES IN SALE_ITEMS FOR DUPLICATE ITEMS
SELECT 'sale_items' AS referencing_table, item_id, COUNT(*) AS reference_count
FROM public.sale_items
WHERE item_id IN (
    SELECT id FROM public.items WHERE LOWER(TRIM(name)) LIKE '%basmati rice premium 5kg%'
)
GROUP BY item_id;
