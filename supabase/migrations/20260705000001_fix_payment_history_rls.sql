-- Fix payment_history SELECT policy: authenticated role cannot read auth.users,
-- so policies using a subquery on auth.users fail with "permission denied".
-- Use auth.jwt() ->> 'email' instead, and collapse the two overlapping
-- SELECT policies into one.
DROP POLICY IF EXISTS "Admin and user payment access" ON public.payment_history;
DROP POLICY IF EXISTS "Payment history access policy" ON public.payment_history;
CREATE POLICY "Payment history access policy" ON public.payment_history
  FOR SELECT
  USING (
    is_admin()
    OR auth.uid() = user_id
    OR customer_email = (auth.jwt() ->> 'email')
  );
