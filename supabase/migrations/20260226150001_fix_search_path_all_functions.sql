-- Migration: fix_search_path_all_functions
-- Adds SET search_path = public, pg_temp to all public functions
-- to prevent search_path hijacking (Supabase Security Advisors warning).

-- 1. bulk_update_products
CREATE OR REPLACE FUNCTION public.bulk_update_products(product_updates jsonb)
  RETURNS TABLE(success boolean, updated_count integer, failed_count integer, errors jsonb)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS $function$
DECLARE
  product_data JSONB;
  update_count INTEGER := 0;
  fail_count INTEGER := 0;
  error_list JSONB := '[]'::JSONB;
  current_product_id INTEGER;
BEGIN
  FOR product_data IN SELECT * FROM jsonb_array_elements(product_updates)
  LOOP
    BEGIN
      current_product_id := (product_data->>'id')::INTEGER;
      UPDATE products
      SET
        bar1 = COALESCE((product_data->>'bar1')::NUMERIC, bar1),
        bar2 = COALESCE((product_data->>'bar2')::NUMERIC, bar2),
        cold_room = COALESCE((product_data->>'cold_room')::NUMERIC, cold_room)
      WHERE id = current_product_id;
      IF FOUND THEN
        update_count := update_count + 1;
      ELSE
        fail_count := fail_count + 1;
        error_list := error_list || jsonb_build_object(
          'product_id', current_product_id,
          'error', 'Product not found'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      fail_count := fail_count + 1;
      error_list := error_list || jsonb_build_object(
        'product_id', current_product_id,
        'error', SQLERRM,
        'error_detail', SQLSTATE
      );
    END;
  END LOOP;
  RETURN QUERY SELECT
    TRUE,
    update_count,
    fail_count,
    error_list;
END;
$function$;

-- 2. freeze_product
CREATE OR REPLACE FUNCTION public.freeze_product(
  p_product_id bigint,
  p_freeze boolean DEFAULT true,
  p_user_email text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $function$
DECLARE
  ts TIMESTAMPTZ := NOW();
BEGIN
  IF p_freeze THEN
    UPDATE public.products
    SET
      is_frozen = true,
      frozen_at = ts,
      frozen_by = p_user_email,
      visible_to_bar1 = false,
      visible_to_bar2 = false,
      updated_at = ts
    WHERE id = p_product_id;
  ELSE
    UPDATE public.products
    SET
      is_frozen = false,
      frozen_at = NULL,
      frozen_by = NULL,
      visible_to_bar1 = true,
      visible_to_bar2 = true,
      updated_at = ts
    WHERE id = p_product_id;
  END IF;
END;
$function$;

-- 3. freeze_products_by_category
CREATE OR REPLACE FUNCTION public.freeze_products_by_category(
  p_category_id bigint,
  p_freeze boolean DEFAULT true,
  p_user_email text DEFAULT NULL::text
)
  RETURNS integer
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $function$
DECLARE
  rows_affected INTEGER;
  ts TIMESTAMPTZ := NOW();
BEGIN
  IF p_freeze THEN
    UPDATE public.products
    SET
      is_frozen = true,
      frozen_at = ts,
      frozen_by = p_user_email,
      visible_to_bar1 = false,
      visible_to_bar2 = false,
      updated_at = ts
    WHERE category_id = p_category_id;
  ELSE
    UPDATE public.products
    SET
      is_frozen = false,
      frozen_at = NULL,
      frozen_by = NULL,
      visible_to_bar1 = true,
      visible_to_bar2 = true,
      updated_at = ts
    WHERE category_id = p_category_id;
  END IF;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$function$;

-- 4. get_my_role
CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS $function$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$function$;

-- 5. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'bar1');
  RETURN NEW;
END;
$function$;

-- 6. log_stock_change
CREATE OR REPLACE FUNCTION public.log_stock_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS $function$
DECLARE
    bar_num INTEGER;
    change_type TEXT;
BEGIN
    IF NEW.bar1 IS DISTINCT FROM OLD.bar1 THEN
        bar_num := 1;
        INSERT INTO stock_history (product_id, user_id, bar_number, old_value, new_value, change_amount, change_type)
        VALUES (
            NEW.id,
            auth.uid(),
            bar_num,
            OLD.bar1,
            NEW.bar1,
            NEW.bar1 - OLD.bar1,
            'manual'
        );
    END IF;
    IF NEW.bar2 IS DISTINCT FROM OLD.bar2 THEN
        bar_num := 2;
        INSERT INTO stock_history (product_id, user_id, bar_number, old_value, new_value, change_amount, change_type)
        VALUES (
            NEW.id,
            auth.uid(),
            bar_num,
            OLD.bar2,
            NEW.bar2,
            NEW.bar2 - OLD.bar2,
            'manual'
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- 7. reorder_category
CREATE OR REPLACE FUNCTION public.reorder_category(category_id bigint, new_order_index integer)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.categories
  SET order_index = new_order_index
  WHERE id = category_id;
END;
$function$;

-- 8. reorder_product
CREATE OR REPLACE FUNCTION public.reorder_product(product_id bigint, new_order_index integer)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.products
  SET order_index = new_order_index
  WHERE id = product_id;
END;
$function$;

-- 9. update_product_visibility
CREATE OR REPLACE FUNCTION public.update_product_visibility(
  p_product_id bigint,
  p_visible_bar1 boolean DEFAULT NULL::boolean,
  p_visible_bar2 boolean DEFAULT NULL::boolean
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.products
  SET
    visible_to_bar1 = COALESCE(p_visible_bar1, visible_to_bar1),
    visible_to_bar2 = COALESCE(p_visible_bar2, visible_to_bar2),
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$function$;

-- 10. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$function$;
