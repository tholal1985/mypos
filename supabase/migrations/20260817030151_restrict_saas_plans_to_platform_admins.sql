/*
  # Restrict global subscription plan management to platform operators

  1. Problem
     All four policies on `saas_plans` used `USING (true)` / `WITH CHECK (true)` for the
     `authenticated` role. Because `saas_plans` is global (it has no `business_id`), any
     signed-in tenant could rewrite or delete the pricing and limits that apply to every
     other tenant on the platform.

  2. New Tables
     - `platform_admins`
       - `user_id` (uuid, primary key, references auth.users) - the operator account
       - `created_at` (timestamptz) - when the operator was designated

  3. New Functions
     - `is_platform_admin()` - returns true when the calling user is listed in
       `platform_admins`. SECURITY DEFINER with a pinned search_path so the membership
       lookup cannot be shadowed, and so callers do not need direct read access.

  4. Changes
     - `saas_plans` SELECT stays open to signed-in users so tenants can see the plans
       that are available to them.
     - `saas_plans` INSERT, UPDATE and DELETE now require `is_platform_admin()`.
     - `platform_admins` has RLS enabled; a user may read only their own row, and there
       is no client-writable policy, so operators must be designated from the database.

  5. Important notes
     1. No existing plan data is modified.
     2. Until a row is added to `platform_admins`, nobody can change plans through the
        Data API, which is the intended fail-closed default.
*/

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_platform_admin" ON platform_admins;
CREATE POLICY "select_own_platform_admin"
  ON platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON platform_admins FROM anon, authenticated;
REVOKE ALL ON platform_admins FROM anon;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION is_platform_admin() FROM anon;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS "insert_saas_plans" ON saas_plans;
CREATE POLICY "insert_saas_plans"
  ON saas_plans FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "update_saas_plans" ON saas_plans;
CREATE POLICY "update_saas_plans"
  ON saas_plans FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "delete_saas_plans" ON saas_plans;
CREATE POLICY "delete_saas_plans"
  ON saas_plans FOR DELETE
  TO authenticated
  USING (is_platform_admin());
