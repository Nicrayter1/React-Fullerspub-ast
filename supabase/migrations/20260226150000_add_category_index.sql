-- Migration: add_category_index
-- Adds btree index on products.category_id to speed up
-- category filtering and JOIN queries.
-- Fixes Supabase Advisors "Unindexed foreign keys" warning.

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products USING btree (category_id);
