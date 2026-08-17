/*
  # Remove default PUBLIC execute grants from SECURITY DEFINER functions

  1. Problem
     PostgreSQL grants EXECUTE on a newly created function to PUBLIC by default.
     Revoking from `anon` alone therefore had no effect: `anon` still inherited EXECUTE
     through PUBLIC, so `is_business_member()` and `is_platform_admin()` remained
     callable without signing in via `/rest/v1/rpc/...`.

  2. Changes
     - Revoke EXECUTE from PUBLIC and from `anon` on `is_business_member(uuid)` and
       `is_platform_admin()`, then grant EXECUTE explicitly to `authenticated` only.
     - The same treatment for `adjust_stock` and `increment_stock`, which must never be
       callable by a signed-out visitor.

  3. Security
     - Signed-out visitors can no longer probe business membership or platform operator
       status, and cannot invoke stock adjustments.
     - Row level security policies continue to work because policy predicates are
       evaluated internally and `authenticated` retains its grant.
*/

REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_stock(uuid, numeric) TO authenticated;
