
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const allowedOrigins = [
  'http://localhost:8080',
  'https://pixie-sketch-ai.vercel.app',
  'https://pixiesketch.com',
  'https://www.pixiesketch.com'
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : null;
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { amount, credits } = await req.json();
    
    console.log('Payment request received:', { amount, credits });

    // Validate input
    if (!amount || !credits || amount <= 0 || credits <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount or credits" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let userEmail = "guest@magicsketch.ai";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      if (user?.email) {
        userEmail = user.email;
      }
    }

    console.log('User authenticated:', !!user, 'Email:', userEmail);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ 
      email: userEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    }

    // Define product names based on credits
    let productName = "MagicSketch Credits";
    if (credits === 1) {
      productName = "Single Magic Transform";
    } else if (credits === 10) {
      productName = "Magic Pack - 10 Transforms";
    } else if (credits === 25) {
      productName = "Super Magic Pack - 25 Transforms";
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productName,
              description: `${credits} transformation${credits > 1 ? 's' : ''} for MagicSketch AI`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: user?.id || "guest",
        credits: credits.toString(),
        amount: amount.toString(),
        package_name: productName
      }
    });

    console.log('Stripe session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Payment failed" }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
