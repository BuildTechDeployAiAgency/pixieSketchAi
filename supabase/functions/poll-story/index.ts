import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders, handleCorsRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    const parts = authHeader?.split(/\s+/);
    if (!parts || parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const jwt = parts[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const body = await req.json();
    const { storyId } = body;

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: "Missing storyId", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Fetch story with ownership check
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, status, user_id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return new Response(
        JSON.stringify({ error: "Story not found", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    if (story.status === "completed") {
      return new Response(
        JSON.stringify({ status: "completed", storyId: story.id, success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify({ status: story.status, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("poll-story error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error", success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
