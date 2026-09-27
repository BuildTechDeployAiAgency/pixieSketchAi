import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsRequest } from "../_shared/cors.ts";

/**
 * Recursively searches a nested payload for a video URL string.
 * Handles all known fal.ai response shapes (video.url, output.url,
 * nested response envelopes, arrays, etc.)
 */
function findVideoUrl(payload: unknown): string | undefined {
  if (!payload) return undefined;
  if (typeof payload === "string" && payload.startsWith("http")) return payload;

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const found = findVideoUrl(entry);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    // Direct .url property
    if (typeof obj.url === "string" && obj.url.startsWith("http")) return obj.url;

    // Priority keys for video content
    for (const key of ["video", "output", "data", "result", "response", "content"]) {
      if (key in obj) {
        const found = findVideoUrl(obj[key]);
        if (found) return found;
      }
    }

    // fal.ai sometimes returns outputs[] array
    if (Array.isArray(obj.outputs)) {
      for (const item of obj.outputs as unknown[]) {
        const found = findVideoUrl(item);
        if (found) return found;
      }
    }
  }

  return undefined;
}

/**
 * Parses a response body that might be JSON or NDJSON (newline-delimited JSON).
 * fal.ai response_url endpoints sometimes return NDJSON.
 */
async function parseResponseBody(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();

  // Try standard JSON first
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to NDJSON parsing
  }

  // Try NDJSON - take the last non-empty line (final result)
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      continue;
    }
  }

  console.error("Failed to parse response body as JSON or NDJSON:", text.substring(0, 500));
  throw new Error("Unparseable fal.ai response");
}

/**
 * Downloads a video from a URL with retry and exponential backoff.
 * Returns the ArrayBuffer on success, or null on failure.
 */
async function downloadVideoWithRetry(
  videoUrl: string,
  maxRetries = 3,
  initialTimeoutMs = 30_000,
): Promise<ArrayBuffer | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutMs = initialTimeoutMs * attempt; // Increase timeout per retry
      console.log(`⬇️ Download attempt ${attempt}/${maxRetries} (timeout: ${timeoutMs / 1000}s)...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(videoUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Download HTTP ${response.status} on attempt ${attempt}`);
        if (attempt < maxRetries) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
        return null;
      }

      const blob = await response.arrayBuffer();
      console.log(`✅ Video downloaded: ${(blob.byteLength / 1024 / 1024).toFixed(1)}MB`);
      return blob;
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      console.warn(
        isTimeout
          ? `⏱️ Download timed out on attempt ${attempt}`
          : `⚠️ Download error on attempt ${attempt}:`,
        isTimeout ? "" : err,
      );

      if (attempt < maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${backoffMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  return null;
}

serve(async (req) => {
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const { sketchId } = await req.json();
    if (!sketchId) {
      return new Response(
        JSON.stringify({ error: "Missing sketchId", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Fetch sketch with ownership check
    const { data: sketch, error: sketchError } = await supabase
      .from("sketches")
      .select("id, fal_request_id, status, user_id")
      .eq("id", sketchId)
      .eq("user_id", user.id)
      .single();

    if (sketchError || !sketch) {
      return new Response(
        JSON.stringify({ error: "Sketch not found", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // Already completed or failed - return current status
    if (sketch.status !== "processing") {
      return new Response(
        JSON.stringify({ status: sketch.status, success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // No fal.ai request ID means it's not a video or wasn't submitted yet
    if (!sketch.fal_request_id) {
      return new Response(
        JSON.stringify({ status: "processing", success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const falKey = Deno.env.get("FAL_KEY");
    if (!falKey) {
      return new Response(
        JSON.stringify({ error: "FAL_KEY not configured", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const requestId = sketch.fal_request_id;
    // fal.ai routes status/result to the app_id (fal-ai/bytedance), NOT the full model subpath
    const FAL_APP_ID = "fal-ai/bytedance";
    const statusUrl = `https://queue.fal.run/${FAL_APP_ID}/requests/${requestId}/status`;
    const resultUrl = `https://queue.fal.run/${FAL_APP_ID}/requests/${requestId}`;

    // Check fal.ai status (single check per poll invocation)
    console.log(`🎬 Checking fal.ai status for request ${requestId}...`);
    const statusResponse = await fetch(statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    });

    if (!statusResponse.ok) {
      const statusText = await statusResponse.text();
      console.error(`fal.ai status check failed (${statusResponse.status}):`, statusText);
      return new Response(
        JSON.stringify({
          status: "processing",
          success: true,
          statusCheckFailed: true,
          statusCheckError: `fal.ai returned HTTP ${statusResponse.status}`,
          errorDetail: statusText.substring(0, 200),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const statusData = await statusResponse.json();
    console.log(`📊 fal.ai status for ${requestId}: ${statusData.status}`);

    if (statusData.status === "FAILED") {
      console.error(`❌ fal.ai job FAILED for request ${requestId}`);
      await supabase
        .from("sketches")
        .update({ status: "failed", fal_request_id: null, updated_at: new Date().toISOString() })
        .eq("id", sketchId);

      return new Response(
        JSON.stringify({ status: "failed", success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (statusData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ status: "processing", falStatus: statusData.status, success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ─── COMPLETED: fetch and process the result ───
    const fetchUrl = statusData.response_url || resultUrl;
    console.log(`📥 Fetching result from: ${fetchUrl}`);

    const resultResponse = await fetch(fetchUrl, {
      headers: { Authorization: `Key ${falKey}` },
    });

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text();
      console.error(`Failed to fetch fal.ai result (${resultResponse.status}):`, errorText);
      return new Response(
        JSON.stringify({
          status: "processing",
          success: true,
          resultFetchFailed: true,
          errorDetail: `Result fetch HTTP ${resultResponse.status}: ${errorText.substring(0, 200)}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Parse response - handles both JSON and NDJSON formats
    let resultData: Record<string, unknown>;
    try {
      resultData = await parseResponseBody(resultResponse);
    } catch {
      console.error("Failed to parse fal.ai result response");
      return new Response(
        JSON.stringify({
          status: "processing",
          success: true,
          parseFailed: true,
          errorDetail: "Failed to parse fal.ai result as JSON or NDJSON",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    console.log("📋 fal.ai raw result keys:", Object.keys(resultData));

    // Unwrap the queue API response envelope (fal.ai wraps model output under "response")
    const modelOutput = (resultData.response ?? resultData) as Record<string, unknown>;
    console.log("📋 fal.ai model output keys:", Object.keys(modelOutput));

    // Extract video URL using robust recursive search
    const videoUrl =
      findVideoUrl(modelOutput) ??
      findVideoUrl(resultData.response) ??
      findVideoUrl(resultData.data) ??
      findVideoUrl(resultData);

    if (!videoUrl) {
      // Log the full payload for debugging (truncated to avoid log overflow)
      const fullPayload = JSON.stringify(resultData);
      console.error("❌ No video URL found in fal.ai result.");
      console.error("Full payload (first 2000 chars):", fullPayload.substring(0, 2000));

      await supabase
        .from("sketches")
        .update({ status: "failed", fal_request_id: null, updated_at: new Date().toISOString() })
        .eq("id", sketchId);

      return new Response(
        JSON.stringify({ status: "failed", error: "No video URL in result", success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ─── Mark completed with CDN URL immediately so sketch never stays stuck ───
    console.log("🎥 Video URL extracted:", videoUrl);

    const { error: updateError } = await supabase
      .from("sketches")
      .update({
        status: "completed",
        animated_image_url: videoUrl,
        fal_request_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sketchId);

    if (updateError) {
      console.error("❌ Failed to update sketch with video URL:", updateError);
      return new Response(
        JSON.stringify({ status: "failed", error: "Database update failed", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    let finalVideoUrl = videoUrl;

    // ─── Attempt to download and re-upload to Supabase Storage for a permanent URL ───
    const videoBlob = await downloadVideoWithRetry(videoUrl);

    if (videoBlob) {
      try {
        console.log("📤 Uploading video to Supabase Storage...");
        const storagePath = `generated_video_${sketchId}_${Date.now()}.mp4`;

        const { data: storageData, error: storageError } = await supabase
          .storage
          .from("sketches")
          .upload(storagePath, videoBlob, {
            contentType: "video/mp4",
            upsert: true,
          });

        if (!storageError && storageData) {
          const { data: urlData } = supabase
            .storage
            .from("sketches")
            .getPublicUrl(storageData.path);
          finalVideoUrl = urlData.publicUrl;
          console.log("✅ Video uploaded to Storage:", finalVideoUrl);

          // Upgrade the sketch URL to the permanent storage URL
          await supabase
            .from("sketches")
            .update({ animated_image_url: finalVideoUrl, updated_at: new Date().toISOString() })
            .eq("id", sketchId);
        } else {
          console.warn("⚠️ Storage upload failed, keeping CDN URL:", storageError?.message);
        }
      } catch (uploadErr) {
        console.warn("⚠️ Storage upload exception, keeping CDN URL:", uploadErr);
      }
    } else {
      console.warn("⚠️ Download failed, keeping fal.ai CDN URL (may expire):", videoUrl);
    }

    // Deduct 2 credits for video
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ credits: Math.max(0, profile.credits - 2) })
        .eq("id", user.id)
        .eq("credits", profile.credits); // Optimistic concurrency check

      try {
        await supabase.rpc("log_credit_usage", {
          p_user_id: user.id,
          p_credits_used: 2,
          p_operation_type: "video_generation",
          p_sketch_id: sketchId,
        });
      } catch (rpcErr) {
        console.warn("⚠️ log_credit_usage RPC failed (non-fatal):", rpcErr);
      }
    }

    return new Response(
      JSON.stringify({
        status: "completed",
        animatedImageUrl: finalVideoUrl,
        success: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("💥 poll-video error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error", success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
