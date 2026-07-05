import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Verifying payment for session:", sessionId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session with line items
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const credits = parseInt(session.metadata?.credits || "0");
    const userId = session.metadata?.user_id;
    const packageName = session.metadata?.package_name || `${credits} Credits`;

    // Get payment details
    const purchaseDetails = {
      packageName,
      amount: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || "USD",
      paymentMethod: session.payment_method_types?.[0] || "card",
      customerEmail: session.customer_details?.email || "N/A",
      sessionId: sessionId,
    };

    if (!credits || credits <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid credits metadata" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Record the payment exactly once. stripe_session_id is UNIQUE, so a
    // duplicate insert is ignored — credits are only granted on first insert.
    // This makes verification idempotent and safe against the webhook racing us.
    const paymentRecord = {
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
      user_id: userId && userId !== "guest" ? userId : null,
      customer_email: session.customer_details?.email || "unknown@example.com",
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      credits_purchased: credits,
      package_name: packageName,
      payment_status: "completed",
      created_at: new Date().toISOString(),
    };

    const { data: insertedRows, error: insertError } = await supabaseService
      .from("payment_history")
      .upsert(paymentRecord, {
        onConflict: "stripe_session_id",
        ignoreDuplicates: true,
      })
      .select("id");

    if (insertError) {
      console.error("Error recording payment:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record payment" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const isFirstVerification = (insertedRows?.length ?? 0) > 0;

    // Only update credits for authenticated users, and only once per session
    if (userId && userId !== "guest") {
      const { data: profile, error: fetchError } = await supabaseService
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch user profile" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          },
        );
      }

      let newCredits = profile?.credits || 0;

      if (isFirstVerification) {
        newCredits += credits;

        const { error: updateError } = await supabaseService
          .from("profiles")
          .update({
            credits: newCredits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating credits:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update credits" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            },
          );
        }

        console.log("Credits updated successfully:", {
          userId,
          oldCredits: profile?.credits,
          newCredits,
        });
      } else {
        console.log("Session already processed, skipping credit grant:", {
          sessionId,
          userId,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          credits: newCredits,
          addedCredits: isFirstVerification ? credits : 0,
          alreadyProcessed: !isFirstVerification,
          purchaseDetails,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // For guest users, just return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified (guest user)",
        addedCredits: credits,
        alreadyProcessed: !isFirstVerification,
        purchaseDetails,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
