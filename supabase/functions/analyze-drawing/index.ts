import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { getCorsHeaders, handleCorsRequest } from "../_shared/cors.ts";

interface AnalyzeRequest {
  prompt: string;
  imageUrl: string;
}

// Simple in-memory cache for recent requests
const cache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

serve(async (req) => {
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with the user's JWT
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the user's session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Invalid authentication:", authError);
      return new Response(
        JSON.stringify({
          error: "Invalid authentication token",
          code: "INVALID_AUTH",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Authenticated user:", user.id);

    // Check rate limit
    const now = Date.now();
    const userRateLimit = rateLimitMap.get(user.id) || {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };

    if (now > userRateLimit.resetTime) {
      // Reset the rate limit window
      userRateLimit.count = 0;
      userRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
    }

    if (userRateLimit.count >= RATE_LIMIT) {
      const waitTime = Math.ceil((userRateLimit.resetTime - now) / 1000);
      console.error(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: waitTime,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": waitTime.toString(),
          },
        },
      );
    }

    userRateLimit.count++;
    rateLimitMap.set(user.id, userRateLimit);

    const { prompt, imageUrl }: AnalyzeRequest = await req.json();

    console.log("Received request:", {
      prompt: prompt?.substring(0, 100),
      imageUrl,
    });

    // Validate inputs
    if (!prompt || !imageUrl) {
      console.error("Missing required fields:", {
        hasPrompt: !!prompt,
        hasImageUrl: !!imageUrl,
      });
      return new Response(
        JSON.stringify({
          error: "Both prompt and imageUrl are required",
          code: "MISSING_REQUIRED_FIELDS",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate API key
    if (!openAIApiKey) {
      console.error("OpenAI API key not configured");
      return new Response(
        JSON.stringify({
          error: "AI service not configured properly",
          code: "API_KEY_MISSING",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if imageUrl is a blob URL (which won't work with OpenAI)
    if (imageUrl.startsWith("blob:")) {
      console.error("Cannot use blob URL with OpenAI API:", imageUrl);
      return new Response(
        JSON.stringify({
          error:
            "Invalid image format. Please upload the image to a public URL first.",
          code: "INVALID_IMAGE_URL",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create cache key
    const cacheKey = `${prompt}-${imageUrl}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Returning cached response");
      return new Response(JSON.stringify({ analysis: cached.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      "Making OpenAI API request with key:",
      openAIApiKey ? "Present" : "Missing",
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a magical AI that analyzes children's drawings and creates enchanting descriptions for 3D animation. Be creative, positive, and capture the child's imagination in your response.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    console.log("OpenAI response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);

      let errorMessage = "Failed to analyze drawing";
      let errorCode = "OPENAI_ERROR";

      if (response.status === 401) {
        errorMessage = "Invalid API key configuration";
        errorCode = "INVALID_API_KEY";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        errorCode = "RATE_LIMITED";
      } else if (response.status === 400) {
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.message?.includes("image")) {
            errorMessage = "Invalid image URL or format";
            errorCode = "INVALID_IMAGE_URL";
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: errorCode,
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenAI response format:", data);
      return new Response(
        JSON.stringify({
          error: "Unexpected response from AI service",
          code: "INVALID_RESPONSE_FORMAT",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const analysis = data.choices[0].message.content;

    // Cache the result
    cache.set(cacheKey, { data: analysis, timestamp: Date.now() });

    // Clean up old cache entries (simple LRU)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    console.log("Analysis completed successfully");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-drawing function:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
