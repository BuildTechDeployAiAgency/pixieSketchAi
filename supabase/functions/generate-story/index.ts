import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders, handleCorsRequest } from "../_shared/cors.ts";
import {
  checkUserCredits,
  checkBudgetLimits,
  deductUserCredits,
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

/** Derives style hint text from sketch content_type. */
function getStyleHint(contentType: string | null): string {
  switch (contentType) {
    case "cartoon":
      return "vibrant 2D cartoon style";
    case "pixar":
      return "Pixar 3D animation style";
    case "realistic":
      return "painterly storybook illustration style";
    default:
      return "vibrant 2D cartoon style";
  }
}

/**
 * Fire-and-forget: generates story text + illustrations, inserts story_pages,
 * marks the story as completed, and deducts 5 credits.
 * On any failure, marks story as failed and does NOT deduct credits.
 */
async function generateAndPersistStory(
  supabase: unknown,
  storyId: string,
  sketchId: string,
  theme: string,
  animatedImageUrl: string,
  contentType: string | null,
  userId: string,
  currentCredits: number,
  openAIApiKey: string,
): Promise<void> {
  try {
    logWithContext("info", "Starting async story generation", { storyId, theme });

    // Step 1: Download animated image to base64
    logWithContext("info", "Downloading character reference image...", { animatedImageUrl });
    const imgResponse = await fetch(animatedImageUrl);
    if (!imgResponse.ok) {
      throw new Error(
        `Failed to download animated image: ${imgResponse.status}`,
      );
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

    // Update story title while still processing
    await (supabase as any)
      .from("stories")
      .update({ title: storyResult.title, updated_at: new Date().toISOString() })
      .eq("id", storyId);

    const styleHint = getStyleHint(contentType);

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
          // Upload to Supabase Storage
          const imageData = illustrationResult.imageBase64 ?? illustrationResult.imageUrl;
          if (imageData) {
            try {
              finalIllustrationUrl = await downloadAndUploadIllustration(
                supabase,
                storyId,
                page.page_number,
                imageData,
              );
              logWithContext("info", `Page ${page.page_number} illustration uploaded`, {
                url: finalIllustrationUrl,
              });
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

      logWithContext("info", `Page ${page.page_number} persisted`, {
        illustration_url: finalIllustrationUrl,
      });
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

    // Step 5: Deduct 5 credits
    const deductResult = await deductUserCredits(supabase, userId, currentCredits, 5);
    if (!deductResult.success) {
      logWithContext("error", "Failed to deduct 5 credits after story completion", {
        error: deductResult.error,
      });
    } else {
      logWithContext("info", "5 credits deducted successfully", {
        userId,
        previousCredits: currentCredits,
        newCredits: currentCredits - 5,
      });
      // Log credit usage — pass storyId as the resource reference
      await logCreditUsage(supabase, userId, storyId, 5);
    }

    logWithContext("info", "Story generation complete", { storyId, sketchId });
  } catch (error) {
    logWithContext("error", "Story generation failed unexpectedly", {
      storyId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Mark story as failed, do NOT deduct credits
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
  // CORS preflight
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  const respond = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Step 1: Auth header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return respond({ error: "Missing or invalid Authorization header", success: false }, 401);
  }

  // Step 2: Init Supabase with service role key
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 3: Verify user JWT
  const jwt = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    return respond({ error: "Unauthorized", success: false }, 401);
  }

  const userId = user.id;
  logWithContext("info", "Authenticated user", { userId });

  // Step 4: Parse and validate request body
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

  // Step 5: Verify sketch ownership
  const { data: ownershipCheck, error: ownershipError } = await (supabase as any)
    .from("sketches")
    .select("id")
    .eq("id", sketchId)
    .eq("user_id", userId)
    .single();

  if (ownershipError || !ownershipCheck) {
    logWithContext("warn", "Sketch ownership check failed", { sketchId, userId });
    return respond({ error: "Sketch not found or access denied", success: false }, 403);
  }

  // Step 6: Fetch sketch details — need animated_image_url and content_type
  const { data: sketchRow, error: sketchFetchError } = await (supabase as any)
    .from("sketches")
    .select("animated_image_url, content_type")
    .eq("id", sketchId)
    .single();

  if (sketchFetchError || !sketchRow) {
    return respond({ error: "Failed to fetch sketch details", success: false }, 500);
  }

  if (!sketchRow.animated_image_url) {
    return respond(
      {
        error: "Character has not been transformed yet. Please transform your drawing first.",
        success: false,
      },
      400,
    );
  }

  // Step 7: Check user credits (need 5)
  logWithContext("info", "Checking user credits (need 5)...");
  const creditCheck = await checkUserCredits(supabase, userId, 5);
  if (!creditCheck.hasCredits) {
    return creditCheck.response!;
  }

  // Step 8: Check budget limits
  logWithContext("info", "Checking budget limits...");
  const budgetCheck = await checkBudgetLimits(supabase, 5);
  if (!budgetCheck.allowed) {
    return budgetCheck.response!;
  }

  // Step 9: Validate OpenAI API key
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) {
    logWithContext("error", "OPENAI_API_KEY not configured");
    return respond({ error: "Service configuration error", success: false }, 500);
  }

  // Step 10: Insert a processing stories row
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
    logWithContext("error", "Failed to insert story row", { error: storyInsertError });
    return respond({ error: "Failed to create story record", success: false }, 500);
  }

  const storyId = storyRow.id as string;
  logWithContext("info", "Story row created, starting async generation", { storyId });

  // Step 11: Fire-and-forget async generation — do NOT await
  generateAndPersistStory(
    supabase,
    storyId,
    sketchId,
    theme.trim(),
    sketchRow.animated_image_url,
    sketchRow.content_type ?? null,
    userId,
    creditCheck.credits!,
    openAIApiKey,
  ).catch((err) => {
    logWithContext("error", "Unhandled error in fire-and-forget story generation", {
      storyId,
      error: err instanceof Error ? err.message : err,
    });
  });

  // Step 12: Return immediately
  return respond({ storyId, success: true }, 200);
});
