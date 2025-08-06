import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Initialize Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabaseService);
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent, supabaseService);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent, supabaseService);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // For future subscription handling
        console.log('Invoice payment succeeded (subscriptions not implemented)');
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook processing failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log('Processing checkout session completed:', session.id);
  
  const credits = parseInt(session.metadata?.credits || "0");
  const userId = session.metadata?.user_id;
  const packageName = session.metadata?.package_name || `${credits} Credits`;

  if (!credits || credits <= 0) {
    console.error('Invalid credits in session metadata');
    return;
  }

  // Check if payment record already exists (idempotency protection)
  const { data: existingPayment } = await supabase
    .from('payment_history')
    .select('id, credits_purchased')
    .eq('stripe_session_id', session.id)
    .single();

  if (existingPayment) {
    console.log('Payment record already exists, skipping duplicate processing:', session.id);
    return;
  }

  // Store payment record
  const paymentRecord = {
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    user_id: userId !== "guest" ? userId : null,
    customer_email: session.customer_details?.email || 'unknown@example.com',
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    credits_purchased: credits,
    package_name: packageName,
    payment_status: 'completed',
    created_at: new Date().toISOString(),
  };

  // Insert payment record
  const { error: insertError } = await supabase
    .from('payment_history')
    .insert([paymentRecord]);

  if (insertError) {
    console.error('Error inserting payment record:', insertError);
    return; // Don't process credits if payment record insert failed
  } else {
    console.log('Payment record stored successfully');
  }

  // Update user credits only for authenticated users
  if (userId && userId !== "guest") {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile for webhook:', fetchError);
      return;
    }

    const newCredits = (profile?.credits || 0) + credits;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating credits via webhook:', updateError);
    } else {
      console.log('Credits updated via webhook:', { userId, newCredits });
    }
  }

  // Send email receipt
  await sendEmailReceipt(session, supabase);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  // Update payment status to succeeded
  const { error } = await supabase
    .from('payment_history')
    .update({ 
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating payment status:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  // Update payment status to failed
  const { error } = await supabase
    .from('payment_history')
    .update({ 
      payment_status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating payment status:', error);
  }
}

async function sendEmailReceipt(session: Stripe.Checkout.Session, supabase: any) {
  console.log('Sending email receipt for session:', session.id);
  
  const customerEmail = session.customer_details?.email;
  if (!customerEmail) {
    console.log('No customer email found, skipping receipt');
    return;
  }

  const credits = parseInt(session.metadata?.credits || "0");
  const packageName = session.metadata?.package_name || `${credits} Credits`;
  const amount = (session.amount_total || 0) / 100;

  // Email template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
        .total { font-weight: bold; font-size: 18px; color: #667eea; }
        .credits { background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ PixieSketch Receipt</h1>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
          <p>Hi there,</p>
          <p>Your payment has been processed successfully. Here are your purchase details:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div class="receipt-item">
              <span>Package:</span>
              <span><strong>${packageName}</strong></span>
            </div>
            <div class="receipt-item">
              <span>Credits:</span>
              <span><strong>${credits} transformation${credits > 1 ? 's' : ''}</strong></span>
            </div>
            <div class="receipt-item">
              <span>Amount Paid:</span>
              <span><strong>$${amount.toFixed(2)} USD</strong></span>
            </div>
            <div class="receipt-item">
              <span>Transaction ID:</span>
              <span><strong>${session.id}</strong></span>
            </div>
            <div class="receipt-item total">
              <span>Status:</span>
              <span style="color: #28a745;">✅ Completed</span>
            </div>
          </div>
          
          <div class="credits">
            <h3 style="margin: 0; color: #28a745;">🎉 ${credits} Credits Added!</h3>
            <p style="margin: 10px 0 0 0;">Ready to transform your drawings into magic!</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://pixiesketch.com" class="button">Start Creating Magic ✨</a>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Upload your children's drawings</li>
            <li>Choose from 3 magical styles: Cartoon, Pixar, or Realistic</li>
            <li>Each transformation uses 1 credit</li>
            <li>Download and share your magical creations!</li>
          </ul>
          
          <p>If you have any questions or need help, feel free to contact our support team.</p>
        </div>
        
        <div class="footer">
          <p>PixieSketch - Bringing Your Drawings to Life with AI Magic</p>
          <p>This is an automated receipt. Please keep it for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Use Supabase Edge Functions to send email (or integrate with your email service)
  try {
    // For now, we'll use a simple email sending service
    // In production, integrate with SendGrid, Mailgun, or similar
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: customerEmail,
        subject: `✨ PixieSketch Receipt - ${packageName}`,
        html: emailHtml,
        from: 'receipts@pixiesketch.com'
      }
    });

    if (emailError) {
      console.error('Error sending email receipt:', emailError);
    } else {
      console.log('Email receipt sent successfully to:', customerEmail);
    }
  } catch (error) {
    console.error('Failed to send email receipt:', error);
  }
}