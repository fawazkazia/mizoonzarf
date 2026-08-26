-- Typo-tolerant search: enables similarity()/% fuzzy matching against product
-- names as a fallback when exact/contains search returns too few results.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING gin (name gin_trgm_ops);
