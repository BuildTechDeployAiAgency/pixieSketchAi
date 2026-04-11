import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders, handleCorsRequest } from "../_shared/cors.ts";
import {
  checkUserCredits,
  checkBudgetLimits,
  logCreditUsage,
} from "../process-sketch/credit-service.ts";
import {
  generateStoryText,
  generatePageIllustration,
  downloadAndUploadIllustration,
} from "./story-service.ts";

function logWithContext(level: string, message: string, context?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${level.toUpperCase()}: ${message}`,
    context ? JSON.stringify(context, null, 2) : "",
  );
}

/** Derives style hint text from the sketch name (preset label). */
function getStyleHint(sketchName: string | null): string {
  const name = (sketchName ?? "").toLowerCase();
  if (name.includes("pixar")) return "Pixar 3D animation style";
  if (name.includes("realistic")) return "painterly storybook illustration style";
  return "vibrant 2D cartoon style";
}

/**
 * Generates story text + illustrations, inserts story_pages,
 * marks the story as completed, and deducts 5 credits.
 * On any failure, marks story as failed and does NOT deduct credits.
 */
async function generateAndPersistStory(
  supabase: unknown,
  storyId: string,
  sketchId: string,
  theme: string,
  animatedImageUrl: string,
  sketchName: string | null,
  userId: string,
  openAIApiKey: string,
): Promise<void> {
  try {
    logWithContext("info", "Starting story generation", { storyId, theme });

    // Step 1: Download animated image to base64
    logWithContext("info", "Downloading character reference image...");
    const imgResponse = await fetch(animatedImageUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to download animated image: ${imgResponse.status}`);
    }
    const imgBuffer = await imgResponse.arrayBuffer();
    const uint8 = new Uint8Array(imgBuffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const characterBase64 = btoa(binary);

    // Step 2: Generate story text
    logWithContext("info", "Generating story text via GPT-4o-mini...");
    const storyResult = await generateStoryText(
      openAIApiKey,
      theme,
      "the main character from the reference image",
    );

    if (!storyResult.success || !storyResult.pages) {
      logWithContext("error", "Story text generation failed", { error: storyResult.error });
      await (supabase as any)
        .from("stories")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", storyId);
      return;
    }

    logWithContext("info", `Story text generated: "${storyResult.title}"`, {
      pageCount: storyResult.pages.length,
    });

    const styleHint = getStyleHint(sketchName);

    // Step 3: For each page — generate illustration, upload, insert row
    for (const page of storyResult.pages) {
      logWithContext("info", `Generating illustration for page ${page.page_number}...`);

      let finalIllustrationUrl: string | null = null;

      try {
        const illustrationResult = await generatePageIllustration(
          openAIApiKey,
          characterBase64,
          page.scene_description,
          styleHint,
        );

        if (!illustrationResult.success) {
          logWithContext("warn", `Illustration failed for page ${page.page_number}, continuing`, {
            error: illustrationResult.error,
          });
        } else {
          const imageData = illustrationResult.imageBase64 ?? illustrationResult.imageUrl;
          if (imageData) {
            try {
              finalIllustrationUrl = await downloadAndUploadIllustration(
                supabase,
                storyId,
                page.page_number,
                imageData,
              );
              logWithContext("info", `Page ${page.page_number} illustration uploaded`);
            } catch (uploadErr) {
              logWithContext("warn", `Upload failed for page ${page.page_number}, continuing`, {
                error: uploadErr instanceof Error ? uploadErr.message : uploadErr,
              });
            }
          }
        }
      } catch (pageErr) {
        logWithContext("warn", `Unexpected error for page ${page.page_number}, continuing`, {
          error: pageErr instanceof Error ? pageErr.message : pageErr,
        });
      }

      // Insert story_pages row regardless of illustration success
      const { error: insertError } = await (supabase as any)
        .from("story_pages")
        .insert({
          story_id: storyId,
          page_number: page.page_number,
          text: page.text,
          illustration_url: finalIllustrationUrl,
        });

      if (insertError) {
        throw new Error(
          `Failed to insert story_pages row for page ${page.page_number}: ${JSON.stringify(insertError)}`,
        );
      }

      logWithContext("info", `Page ${page.page_number} persisted`);
    }

    // Step 4: Mark story as completed
    const { error: completeError } = await (supabase as any)
      .from("stories")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", storyId);

    if (completeError) {
      throw new Error(`Failed to mark story completed: ${JSON.stringify(completeError)}`);
    }

    logWithContext("info", "Story marked as completed", { storyId });

    // Step 5: Atomically deduct 5 credits (avoids stale-value race)
    const { data: deductRows, error: deductError } = await (supabase as any)
      .rpc("deduct_credits_atomic", { p_user_id: userId, p_amount: 5 });

    // rpc returns the number of affected rows (or a boolean); treat 0 rows / error as failure
    if (deductError) {
      logWithContext("error", "Failed to deduct 5 credits", { error: deductError });
    } else {
      logWithContext("info", "5 credits deducted successfully");
      await logCreditUsage(supabase, userId, storyId, 5);
    }

    logWithContext("info", "Story generation complete", { storyId });
  } catch (error) {
    logWithContext("error", "Story generation failed", {
      storyId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      await (supabase as any)
        .from("stories")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", storyId);
    } catch (updateErr) {
      logWithContext("error", "Failed to mark story as failed", { updateErr });
    }
  }
}

serve(async (req) => {
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  const respond = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return respond({ error: "Missing or invalid Authorization header", success: false }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return respond({ error: "Server configuration error: missing Supabase env vars", success: false }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const jwt = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return respond({ error: "Unauthorized", success: false }, 401);
  }

  const userId = user.id;
  logWithContext("info", "Authenticated user", { userId });

  // Parse body
  let body: { sketchId?: unknown; theme?: unknown };
  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON body", success: false }, 400);
  }

  const { sketchId, theme } = body;

  if (!sketchId || typeof sketchId !== "string" || sketchId.trim() === "") {
    return respond({ error: "sketchId is required", success: false }, 400);
  }
  if (!theme || typeof theme !== "string" || theme.trim() === "") {
    return respond({ error: "theme is required", success: false }, 400);
  }
  if (theme.length > 200) {
    return respond({ error: "theme must be 200 characters or fewer", success: false }, 400);
  }

  // Verify sketch ownership
  const { data: ownershipCheck, error: ownershipError } = await (supabase as any)
    .from("sketches")
    .select("id")
    .eq("id", sketchId)
    .eq("user_id", userId)
    .single();

  if (ownershipError || !ownershipCheck) {
    return respond({ error: "Sketch not found or access denied", success: false }, 403);
  }

  // Fetch sketch details
  const { data: sketchRow, error: sketchFetchError } = await (supabase as any)
    .from("sketches")
    .select("animated_image_url, name")
    .eq("id", sketchId)
    .single();

  if (sketchFetchError || !sketchRow) {
    return respond({ error: "Failed to fetch sketch details", success: false }, 500);
  }

  if (!sketchRow.animated_image_url) {
    return respond({ error: "Character has not been transformed yet.", success: false }, 400);
  }

  // Check credits
  const creditCheck = await checkUserCredits(supabase, userId, 5);
  if (!creditCheck.hasCredits) return creditCheck.response!;

  // Check budget
  const budgetCheck = await checkBudgetLimits(supabase, 5);
  if (!budgetCheck.allowed) return budgetCheck.response!;

  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) {
    return respond({ error: "Service configuration error", success: false }, 500);
  }

  // Insert story row
  const { data: storyRow, error: storyInsertError } = await (supabase as any)
    .from("stories")
    .insert({
      user_id: userId,
      sketch_id: sketchId,
      theme: theme.trim(),
      status: "processing",
      page_count: 5,
    })
    .select("id")
    .single();

  if (storyInsertError || !storyRow) {
    return respond({ error: "Failed to create story record", success: false }, 500);
  }

  const storyId = storyRow.id as string;
  logWithContext("info", "Story row created, starting synchronous generation", { storyId });

  // ── SYNCHRONOUS GENERATION ──
  // Run the full generation inline. The client-side createStory() call will
  // take 2-5 minutes to get a response, but that's OK — the client already
  // has the storyId from the realtime INSERT subscription and polls via
  // poll-story independently. If this HTTP connection times out on the client
  // side, the generation still completes server-side.
  await generateAndPersistStory(
    supabase,
    storyId,
    sketchId,
    theme.trim(),
    sketchRow.animated_image_url,
    sketchRow.name ?? null,
    userId,
    openAIApiKey,
  );

  return respond({ storyId, success: true }, 200);
});
