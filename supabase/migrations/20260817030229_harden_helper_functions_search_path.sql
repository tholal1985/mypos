/*
  # Harden helper function search paths and grants

  1. Problem
     - `is_business_member()` is SECURITY DEFINER but had no fixed `search_path`, so the
       table it resolves could be shadowed by an earlier-resolving schema. It is the
       single predicate behind every row level security policy in this database.
     - `is_business_member()` was also executable by the `anon` role via
       `/rest/v1/rpc/is_business_member`, letting an unauthenticated caller probe which
       business ids exist. No policy in this schema is scoped `TO anon`, so no signed-out
       caller needs it.
     - `update_updated_at()` (the trigger function on every table's `updated_at` column)
       had the same mutable search_path.

  2. Changes
     - Pin `search_path = public, pg_temp` on both functions.
     - Revoke EXECUTE on `is_business_member()` from `anon`. The `authenticated` grant is
       retained because every policy calls it.

  3. Security
     - Closes the search_path shadowing vector on the tenant boundary check.
     - Removes an unauthenticated existence oracle.
*/

ALTER FUNCTION public.is_business_member(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;
