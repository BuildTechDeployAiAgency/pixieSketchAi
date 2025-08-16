import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders(null);

interface CreditCheckResult {
  hasCredits: boolean;
  response?: Response;
  credits?: number;
}

export const checkUserCredits = async (
  supabase: unknown,
  userId: string,
): Promise<CreditCheckResult> => {
  try {
    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        hasCredits: false,
        response: new Response(
          JSON.stringify({
            error: "Failed to fetch user profile",
            success: false,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          },
        ),
      };
    }

    if (profile.credits <= 0) {
      return {
        hasCredits: false,
        response: new Response(
          JSON.stringify({
            error:
              "Insufficient credits. Please purchase more credits to continue.",
            success: false,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 402,
          },
        ),
      };
    }

    return {
      hasCredits: true,
      credits: profile.credits,
    };
  } catch (error) {
    return {
      hasCredits: false,
      response: new Response(
        JSON.stringify({
          error: "Failed to check user credits",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      ),
    };
  }
};

export const checkBudgetLimits = async (
  supabase: unknown,
): Promise<{ allowed: boolean; response?: Response }> => {
  try {
    const { data: budgetCheck, error: budgetError } = await (
      supabase as any
    ).rpc("check_budget_limit", { credits_to_use: 1 });

    if (budgetError) {
      console.error("Budget check failed:", budgetError);
      return { allowed: true };
    }

    if (budgetCheck && !budgetCheck.allowed) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error:
              "Service temporarily unavailable due to budget limits. Please try again later.",
            success: false,
            code: "BUDGET_LIMIT_EXCEEDED",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 503,
          },
        ),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Budget check exception:", error);
    return { allowed: true };
  }
};

export const deductUserCredits = async (
  supabase: unknown,
  userId: string,
  currentCredits: number,
): Promise<{ success: boolean; error?: unknown }> => {
  try {
    const { error: deductError } = await (supabase as any)
      .from("profiles")
      .update({ credits: currentCredits - 1 })
      .eq("id", userId)
      .eq("credits", currentCredits);

    if (deductError) {
      return { success: false, error: deductError };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const logCreditUsage = async (
  supabase: unknown,
  userId: string,
  sketchId: string,
): Promise<void> => {
  try {
    await (supabase as any).rpc("log_credit_usage", {
      p_user_id: userId,
      p_credits_used: 1,
      p_operation_type: "sketch_generation",
      p_sketch_id: sketchId,
    });
  } catch (error) {
    console.error("Budget logging exception:", error);
  }
};
