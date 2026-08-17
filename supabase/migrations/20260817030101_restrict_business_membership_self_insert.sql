/*
  # Restrict self-service business membership inserts

  1. Problem
     The INSERT policy on `business_users` allowed any authenticated user to insert a
     membership row for themselves into ANY business, because the predicate contained
     an unconditional `user_id = auth.uid()` branch. Writing that row is what makes
     `is_business_member()` return true, so this granted full read/write access to
     every business-scoped table of the targeted tenant.

  2. Change
     The self-insert branch is now limited to the legitimate bootstrap case: a user may
     insert their own membership row only when the target business has no members yet
     (i.e. the business they just created during sign-up). Adding further members still
     requires already being a member of that business.

  3. Security
     - Replaces policy `insert_business_users` on `business_users`.
     - No data is modified.
*/

DROP POLICY IF EXISTS "insert_business_users" ON business_users;

CREATE POLICY "insert_business_users"
  ON business_users FOR INSERT
  TO authenticated
  WITH CHECK (
    is_business_member(business_id)
    OR (
      user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM business_users existing
        WHERE existing.business_id = business_users.business_id
      )
    )
  );
