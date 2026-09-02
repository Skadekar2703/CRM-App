-- ============================================================================
-- CRM APP KMP - NON-DESTRUCTIVE ACCOUNT-SCOPED UNIQUENESS MIGRATION
-- 100% Safe: Zero DELETEs, Zero UPDATEs, Zero Data Loss
-- Replaces global unique constraints with account-scoped unique indexes
-- ============================================================================

-- 1. AREAS (ACCOUNT-SCOPED: user_id + name)
ALTER TABLE IF EXISTS public.areas DROP CONSTRAINT IF EXISTS areas_name_key;
DROP INDEX IF EXISTS public.areas_name_key;
DROP INDEX IF EXISTS public.idx_areas_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_user_id_name_unique
ON public.areas (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 2. CATEGORIES (ACCOUNT-SCOPED: user_id + name)
ALTER TABLE IF EXISTS public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
DROP INDEX IF EXISTS public.categories_name_key;
DROP INDEX IF EXISTS public.idx_categories_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_id_name_unique
ON public.categories (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 3. TRANSPORTS (ACCOUNT-SCOPED: user_id + name)
ALTER TABLE IF EXISTS public.transports DROP CONSTRAINT IF EXISTS transports_name_key;
DROP INDEX IF EXISTS public.transports_name_key;
DROP INDEX IF EXISTS public.idx_transports_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transports_user_id_name_unique
ON public.transports (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 4. SUPPLIERS (ACCOUNT-SCOPED: user_id + name)
ALTER TABLE IF EXISTS public.suppliers DROP CONSTRAINT IF EXISTS suppliers_name_key;
DROP INDEX IF EXISTS public.suppliers_name_key;
DROP INDEX IF EXISTS public.idx_suppliers_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_user_id_name_unique
ON public.suppliers (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 5. EMPLOYEES (ACCOUNT-SCOPED: NAME + MOBILE / PHONE)
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_name_key;
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_mobile_key;
ALTER TABLE IF EXISTS public.employees DROP CONSTRAINT IF EXISTS employees_phone_key;
DROP INDEX IF EXISTS public.employees_name_key;
DROP INDEX IF EXISTS public.employees_mobile_key;
DROP INDEX IF EXISTS public.idx_employees_user_id_name_unique;
DROP INDEX IF EXISTS public.idx_employees_user_id_phone_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id_name_unique
ON public.employees (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id_phone_unique
ON public.employees (user_id, LOWER(TRIM(phone)))
WHERE user_id IS NOT NULL AND phone IS NOT NULL;

-- 6. CUSTOMERS (ACCOUNT-SCOPED: user_id + name)
ALTER TABLE IF EXISTS public.customers DROP CONSTRAINT IF EXISTS customers_name_key;
DROP INDEX IF EXISTS public.customers_name_key;
DROP INDEX IF EXISTS public.idx_customers_user_id_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_id_name_unique
ON public.customers (user_id, LOWER(TRIM(name)))
WHERE user_id IS NOT NULL;

-- 7. ITEMS (ACCOUNT-SCOPED: user_id + name + sku)
-- Preserves distinct SKUs under the same display name per account
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_name_key;
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_sku_key;
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_code_key;
DROP INDEX IF EXISTS public.items_name_key;
DROP INDEX IF EXISTS public.idx_items_user_id_name_unique;
DROP INDEX IF EXISTS public.idx_items_user_id_name_sku_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_user_id_name_sku_unique
ON public.items (user_id, LOWER(TRIM(name)), LOWER(TRIM(COALESCE(sku, id::text))))
WHERE user_id IS NOT NULL;
