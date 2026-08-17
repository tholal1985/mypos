/*
  # Atomic stock adjustment

  1. Problem
     Both the point of sale checkout and the purchase entry screen updated
     `products.stock` by writing an absolute number that the browser had computed from a
     value read earlier. Two concurrent sales therefore overwrite each other and stock
     that was sold reappears, and a direct API caller could set any stock value at all.
     The purchase screen already called an `increment_stock` RPC that did not exist, so
     only the unsafe fallback ever ran.

  2. New Functions
     - `adjust_stock(p_id uuid, delta numeric)` - applies a relative change to a
       product's stock in a single atomic UPDATE statement. Declared SECURITY INVOKER so
       existing row level security on `products` still decides which rows the caller may
       touch. Raises an error if the change would take stock below zero.
     - `increment_stock(p_id uuid, qty numeric)` - thin wrapper kept for the purchase
       screen, which already referenced this name.

  3. Changes
     - Adds a `products_stock_non_negative` check constraint so stock can never go
       negative through any path.

  4. Important notes
     1. The constraint is added NOT VALID so no existing row can block the migration;
        it is enforced for every future write.
     2. `anon` receives no EXECUTE grant on either function.
*/

CREATE OR REPLACE FUNCTION adjust_stock(p_id uuid, delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_stock numeric;
BEGIN
  UPDATE products
    SET stock = stock + delta
    WHERE id = p_id
    RETURNING stock INTO new_stock;

  IF new_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found or not accessible';
  END IF;

  IF new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  RETURN new_stock;
END;
$$;

CREATE OR REPLACE FUNCTION increment_stock(p_id uuid, qty numeric)
RETURNS numeric
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT adjust_stock(p_id, qty);
$$;

REVOKE EXECUTE ON FUNCTION adjust_stock(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION increment_stock(uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION adjust_stock(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(uuid, numeric) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_non_negative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0) NOT VALID;
  END IF;
END $$;
