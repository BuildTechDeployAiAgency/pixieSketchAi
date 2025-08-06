import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Get email service credentials from environment
    const emailService = Deno.env.get("EMAIL_SERVICE") || "resend"; // Default to Resend
    const apiKey = Deno.env.get("EMAIL_API_KEY");

    if (!apiKey) {
      console.error("EMAIL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    let emailResponse;

    if (emailService === "resend") {
      // Use Resend (recommended for simplicity)
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from || "PixieSketch <receipts@pixiesketch.com>",
          to: [to],
          subject,
          html,
        }),
      });
    } else if (emailService === "sendgrid") {
      // Use SendGrid
      emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from || "receipts@pixiesketch.com", name: "PixieSketch" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
    } else {
      throw new Error(`Unsupported email service: ${emailService}`);
    }

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error(`Email service error (${emailResponse.status}):`, errorText);
      throw new Error(`Email service error: ${errorResponse.status}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", { to, subject, emailId: result.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailId: result.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});