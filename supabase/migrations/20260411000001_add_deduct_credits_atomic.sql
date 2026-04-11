-- Atomic credit deduction: decrements credits only if sufficient balance exists.
-- Returns the number of rows updated (0 = insufficient credits, 1 = success).
-- GRANTs are included via DO block to avoid multiple-statement error in Supabase CLI.
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(p_user_id UUID, p_amount INTEGER)
  RETURNS INTEGER AS $fn$
  DECLARE
    affected INTEGER;
  BEGIN
    UPDATE public.profiles
    SET credits = credits - p_amount
    WHERE id = p_user_id
      AND credits >= p_amount;

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
  END;
  $fn$ LANGUAGE plpgsql SECURITY DEFINER;

  GRANT EXECUTE ON FUNCTION public.deduct_credits_atomic(UUID, INTEGER) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.deduct_credits_atomic(UUID, INTEGER) TO service_role;
END;
$$;
