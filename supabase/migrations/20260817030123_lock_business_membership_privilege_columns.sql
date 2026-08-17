/*
  # Lock membership role and tenant columns

  1. Problem
     The UPDATE policy on `business_users` contained a `user_id = auth.uid()` branch,
     letting a signed-in user rewrite their own membership row. Because neither the
     USING nor the WITH CHECK pinned `business_id` or `role`, a user could move their
     membership into another tenant, or promote themselves to `admin`.

  2. Changes
     - `update_business_users` and `delete_business_users` policies now require actual
       membership of the row's business; the self-branch is removed.
     - Column-level UPDATE privileges on `business_users` are narrowed so that
       `business_id`, `user_id` and `role` can no longer be written through the Data API
       at all. `is_default` remains updatable, which is all the application changes.

  3. Security
     - Prevents cross-tenant membership transfer and self-promotion to administrator.
     - SELECT is unchanged, so the app can still list the businesses a user belongs to.
*/

DROP POLICY IF EXISTS "update_business_users" ON business_users;

CREATE POLICY "update_business_users"
  ON business_users FOR UPDATE
  TO authenticated
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

DROP POLICY IF EXISTS "delete_business_users" ON business_users;

CREATE POLICY "delete_business_users"
  ON business_users FOR DELETE
  TO authenticated
  USING (is_business_member(business_id));

REVOKE UPDATE ON business_users FROM anon, authenticated;
GRANT UPDATE (is_default) ON business_users TO authenticated;
