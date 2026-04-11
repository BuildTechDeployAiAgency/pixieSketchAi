-- Atomic credit deduction: decrements credits only if sufficient balance exists.
-- Returns the number of rows updated (0 = insufficient credits, 1 = success).
CREATE OR REPLACE FUNCTION deduct_credits_atomic(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION deduct_credits_atomic(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits_atomic(UUID, INTEGER) TO service_role;
