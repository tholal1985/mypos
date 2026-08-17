/*
  # Enforce sale value invariants in the database

  1. Problem
     Sale subtotal, discount and total were all calculated in the browser and written to
     the `sales` table verbatim. A discount larger than the subtotal, entered in the
     point of sale screen or supplied directly to the Data API, recorded a sale with a
     negative total and corrupted every revenue figure on the dashboard and reports.
     Line quantities were likewise unbounded.

  2. Changes
     - `sales`: adds checks that `subtotal`, `discount_total`, `tax_total`, `total` and
       `paid_amount` are non-negative, and that `discount_total` never exceeds `subtotal`.
     - `sale_lines`: adds checks that `quantity` is strictly positive and `unit_price`
       and `total` are non-negative.
     - `purchase_lines`: adds checks that `quantity` is strictly positive and `unit_cost`
       and `total` are non-negative.
     - `purchases`: adds checks that `total` and `paid_amount` are non-negative.

  3. Important notes
     1. Every constraint is added NOT VALID so that no pre-existing row can block the
        migration. They are enforced on all future inserts and updates.
     2. These are the same rules the interface already intends to follow, so normal use
        is unaffected; only crafted or out-of-range values are rejected.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_amounts_non_negative') THEN
    ALTER TABLE sales ADD CONSTRAINT sales_amounts_non_negative
      CHECK (subtotal >= 0 AND discount_total >= 0 AND tax_total >= 0 AND total >= 0 AND paid_amount >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_discount_within_subtotal') THEN
    ALTER TABLE sales ADD CONSTRAINT sales_discount_within_subtotal
      CHECK (discount_total <= subtotal) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_lines_positive_quantity') THEN
    ALTER TABLE sale_lines ADD CONSTRAINT sale_lines_positive_quantity
      CHECK (quantity > 0 AND unit_price >= 0 AND total >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_lines_positive_quantity') THEN
    ALTER TABLE purchase_lines ADD CONSTRAINT purchase_lines_positive_quantity
      CHECK (quantity > 0 AND unit_cost >= 0 AND total >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_amounts_non_negative') THEN
    ALTER TABLE purchases ADD CONSTRAINT purchases_amounts_non_negative
      CHECK (total >= 0 AND paid_amount >= 0) NOT VALID;
  END IF;
END $$;
