import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders, handleCorsRequest } from "../_shared/cors.ts";
import {
  validateAuthHeader,
  validateUser,
  validateRequestFields,
  validateImageData,
  validatePreset,
  validateOpenAIKey,
} from "./validation.ts";
import {
  checkUserCredits,
  checkBudgetLimits,
  deductUserCredits,
  logCreditUsage,
} from "./credit-service.ts";
import {
  checkImageSafety,
  transformImageWithGPTImage1,
  callOpenAIVision,
  generateImage,
  fallbackImageGeneration,
} from "./openai-service.ts";
import {
  generateVideoMotionPrompt,
  submitFalVideoGeneration,
  pollFalVideoResult,
} from "./fal-service.ts";
import { checkRateLimit } from "./rate-limit.ts";

// These prompts are used with gpt-image-1 (image editing) where the model sees
// the original image directly — so prompts are concise style instructions rather
// than detailed text descriptions.
const PRESET_PROMPTS = {
  cartoon:
    "Transform this image into a vibrant 2D cartoon. Keep every subject, pose, object, and background from the original. Apply clean bold outlines, flat cel-shaded colors, and a Saturday-morning cartoon style.",
  pixar:
    "Transform this image into Pixar 3D animation style. Keep every subject, pose, object, and setting from the original. Apply Pixar's soft rounded forms, large expressive eyes, warm subsurface lighting, and cinematic depth of field.",
  realistic:
    "Transform this image into a painterly storybook illustration. Keep every subject, pose, object, and scene from the original. Apply rich textures, warm atmospheric lighting, and painterly depth.",
};

function logWithContext(level: string, message: string, context?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${level.toUpperCase()}: ${message}`,
    context ? JSON.stringify(context, null, 2) : "",
  );
}

async function updateSketchWithRetry(
  supabase: unknown,
  sketchId: string,
  status: string,
  animatedImageUrl?: string,
  maxRetries = 3,
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logWithContext(
        "info",
        `Attempt ${attempt}/${maxRetries}: Updating sketch ${sketchId}`,
        { status, hasAnimatedUrl: !!animatedImageUrl },
      );

      const updateData: {
        status: string;
        updated_at: string;
        animated_image_url?: string;
      } = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (animatedImageUrl) {
        updateData.animated_image_url = animatedImageUrl;
      }

      const { data, error } = await (supabase as any)
        .from("sketches")
        .update(updateData)
        .eq("id", sketchId)
        .select();

      if (error) {
        logWithContext(
          "error",
          `Database update error (attempt ${attempt})`,
          error,
        );
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      logWithContext(
        "success",
        `Successfully updated sketch ${sketchId} on attempt ${attempt}`,
        data,
      );
      return data;
    } catch (error) {
      logWithContext("error", `Update attempt ${attempt} failed`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function handleProcessingError(
  supabase: unknown,
  sketchId: string,
  error: unknown,
  stage: string,
) {
  logWithContext("error", `Processing failed at stage: ${stage}`, {
    sketchId,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  try {
    await updateSketchWithRetry(supabase, sketchId, "failed");
  } catch (updateError) {
    logWithContext(
      "error",
      "Failed to update sketch status to failed",
      updateError,
    );
  }
}

serve(async (req) => {
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Helper function to update CORS headers in responses
  const updateCorsHeaders = (response: Response): Response => {
    const origin = req.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin);
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };

  let sketchId = "";
  const requestStartTime = Date.now();

  try {
    // Step 1: Validate authentication header
    const authHeader = req.headers.get("Authorization");
    const authHeaderValidation = validateAuthHeader(authHeader);
    if (!authHeaderValidation.isValid) {
      return updateCorsHeaders(authHeaderValidation.response!);
    }

    // Step 2: Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      logWithContext("error", "Missing Supabase environment variables", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return updateCorsHeaders(
        new Response(
          JSON.stringify({
            error: "Server configuration error",
            success: false,
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 500,
          },
        ),
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 3: Verify user session
    const jwt = authHeader!.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);
    const userValidation = validateUser(user, authError);
    if (!userValidation.isValid) {
      return updateCorsHeaders(userValidation.response!);
    }

    logWithContext("info", "Authenticated user:", { userId: (user as any).id });

    // Step 4: Check rate limiting
    const rateLimitCheck = checkRateLimit((user as any).id);
    if (!rateLimitCheck.allowed) {
      return updateCorsHeaders(rateLimitCheck.response!);
    }

    // Step 5: Parse and validate request body
    const {
      imageData,
      preset,
      sketchId: requestSketchId,
      isVideo,
      videoPromptMode,
      customVideoPrompt,
    } = await req.json();
    sketchId = requestSketchId;

    logWithContext("info", "🎨 Processing sketch request started", {
      sketchId,
      preset,
      isVideo: !!isVideo,
      videoPromptMode,
      imageDataLength: imageData?.length,
      requestId: Math.random().toString(36).substr(2, 9),
    });

    const fieldsValidation = validateRequestFields(imageData, preset, sketchId);
    if (!fieldsValidation.isValid) {
      return updateCorsHeaders(fieldsValidation.response!);
    }

    const imageDataValidation = validateImageData(imageData);
    if (!imageDataValidation.isValid) {
      return updateCorsHeaders(imageDataValidation.response!);
    }

    const presetValidation = validatePreset(preset, PRESET_PROMPTS);
    if (!presetValidation.isValid) {
      return updateCorsHeaders(presetValidation.response!);
    }

    // Step 5b: Verify sketch ownership
    const { data: ownershipCheck, error: ownershipError } = await (
      supabase as any
    )
      .from("sketches")
      .select("id")
      .eq("id", sketchId)
      .eq("user_id", (user as any).id)
      .single();

    if (ownershipError || !ownershipCheck) {
      logWithContext("warn", "Sketch ownership verification failed", {
        sketchId,
        userId: (user as any).id,
      });
      return updateCorsHeaders(
        new Response(
          JSON.stringify({
            error: "Sketch not found or access denied",
            success: false,
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 403,
          },
        ),
      );
    }

    // Step 6: Validate OpenAI API key
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const openAIValidation = validateOpenAIKey(openAIApiKey);
    if (!openAIValidation.isValid) {
      await handleProcessingError(
        supabase,
        sketchId,
        new Error("OpenAI API key missing"),
        "initialization",
      );
      return updateCorsHeaders(openAIValidation.response!);
    }

    // Step 6b: Safety check — run before any credit deduction or processing
    logWithContext("info", "🛡️ Running content safety check...");
    const safetyResult = await checkImageSafety(openAIApiKey!, imageData);
    if (!safetyResult.safe) {
      logWithContext("warn", "Content safety check failed", { sketchId, reason: safetyResult.reason });
      // Delete the sketch record so the user's gallery stays clean
      await (supabase as any).from("sketches").delete().eq("id", sketchId);
      return updateCorsHeaders(
        new Response(
          JSON.stringify({
            error: "CONTENT_POLICY_VIOLATION",
            message: "This image cannot be transformed due to our content policy. No credits were used.",
            success: false,
          }),
          { headers: { "Content-Type": "application/json" }, status: 422 },
        ),
      );
    }

    // Step 7: Check user credits
    const creditsRequired = isVideo ? 2 : 1;
    logWithContext("info", `Checking user credits (need ${creditsRequired})...`);
    const creditCheck = await checkUserCredits(supabase, (user as any).id, creditsRequired);
    if (!creditCheck.hasCredits) {
      return updateCorsHeaders(creditCheck.response!);
    }

    // Step 8: Check budget limits
    logWithContext("info", "Checking budget limits...");
    const budgetCheck = await checkBudgetLimits(supabase, creditsRequired);
    if (!budgetCheck.allowed) {
      return updateCorsHeaders(budgetCheck.response!);
    }

    logWithContext("info", "User has sufficient credits", {
      userId: (user as any).id,
      availableCredits: creditCheck.credits,
    });

    // ── VIDEO GENERATION BRANCH ──
    if (isVideo && preset === "realistic") {
      logWithContext("info", "🎬 Video generation branch");

      // Determine motion prompt
      let motionPrompt: string;
      if (videoPromptMode === "custom" && customVideoPrompt) {
        motionPrompt = customVideoPrompt;
        logWithContext("info", "Using custom motion prompt", { motionPrompt });
      } else {
        const motionResult = await generateVideoMotionPrompt(
          openAIApiKey!,
          imageData,
        );
        if (!motionResult.success) {
          await handleProcessingError(supabase, sketchId, new Error(motionResult.error), "motion_prompt");
          return updateCorsHeaders(
            new Response(
              JSON.stringify({ error: "Failed to generate motion prompt", details: motionResult.error, success: false }),
              { headers: { "Content-Type": "application/json" }, status: 500 },
            ),
          );
        }
        motionPrompt = motionResult.prompt!;
      }

      // Get the original image public URL from the sketch record
      const { data: sketchRecord } = await (supabase as any)
        .from("sketches")
        .select("original_image_url")
        .eq("id", sketchId)
        .single();

      if (!sketchRecord?.original_image_url) {
        await handleProcessingError(supabase, sketchId, new Error("No original image URL"), "video_setup");
        return updateCorsHeaders(
          new Response(
            JSON.stringify({ error: "Original image URL not found", success: false }),
            { headers: { "Content-Type": "application/json" }, status: 500 },
          ),
        );
      }

      // Submit to fal.ai
      const submitResult = await submitFalVideoGeneration(
        sketchRecord.original_image_url,
        motionPrompt,
      );
      if (!submitResult.success) {
        await handleProcessingError(supabase, sketchId, new Error(submitResult.error), "video_submit");
        return updateCorsHeaders(
          new Response(
            JSON.stringify({ error: "Failed to submit video generation", details: submitResult.error, success: false }),
            { headers: { "Content-Type": "application/json" }, status: 500 },
          ),
        );
      }

      // Save fal.ai request ID and motion prompt to sketch record for async polling
      const { error: updateError } = await (supabase as any)
        .from("sketches")
        .update({
          fal_request_id: submitResult.requestId,
          video_prompt: motionPrompt,
          content_type: "video",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sketchId);

      if (updateError) {
        logWithContext("error", "Failed to save fal_request_id to sketch", {
          sketchId,
          requestId: submitResult.requestId,
          error: updateError,
        });
        await handleProcessingError(supabase, sketchId, updateError, "save_fal_request_id");
        return updateCorsHeaders(
          new Response(
            JSON.stringify({ error: "Failed to save video job reference", success: false }),
            { headers: { "Content-Type": "application/json" }, status: 500 },
          ),
        );
      }

      logWithContext("info", "Video submitted to fal.ai, returning immediately", {
        sketchId,
        requestId: submitResult.requestId,
      });

      // Return immediately - the client will poll via poll-video function
      return updateCorsHeaders(
        new Response(
          JSON.stringify({
            videoSubmitted: true,
            requestId: submitResult.requestId,
            sketchId,
            success: true,
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 },
        ),
      );
    }

    // ── IMAGE GENERATION PATH ──

    // Step 9: Transform image using gpt-image-1 (image editing — model sees the
    // actual pixels, so it stays faithful to the original subject and composition).
    // Falls back to Vision + DALL-E 3 if gpt-image-1 is unavailable.
    logWithContext("info", "🔘 Starting transformation", { preset });
    const presetPrompt = PRESET_PROMPTS[preset as keyof typeof PRESET_PROMPTS];

    logWithContext("info", "🎨 Trying gpt-image-1 (direct image editing)...");
    let imageResult = await transformImageWithGPTImage1(openAIApiKey!, imageData, presetPrompt);

    if (!imageResult.success) {
      logWithContext("warn", "gpt-image-1 failed, falling back to Vision + DALL-E 3", imageResult.error);

      // Fallback: Vision analysis → DALL-E 3 (less faithful but widely available)
      const visionResult = await callOpenAIVision(openAIApiKey!, imageData, preset, presetPrompt);

      if (visionResult.success) {
        imageResult = await generateImage(openAIApiKey!, visionResult.enhancedPrompt!);
        if (!imageResult.success) {
          logWithContext("warn", "DALL-E 3 failed, trying last-resort fallback", imageResult.error);
        }
      } else {
        logWithContext("warn", "Vision API also failed", visionResult.error);
      }

      // Last resort: DALL-E 3 with the bare preset prompt
      if (!imageResult.success) {
        const lastResort = await fallbackImageGeneration(openAIApiKey!, presetPrompt);
        if (!lastResort.success) {
          await handleProcessingError(
            supabase,
            sketchId,
            new Error(`All generation paths failed. Last error: ${lastResort.error}`),
            "image_generation",
          );
          return new Response(
            JSON.stringify({
              error: "Image transformation failed",
              details: lastResort.error,
              success: false,
            }),
            {
              headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
              status: 500,
            },
          );
        }
        imageResult = lastResort;
      }
    }

    // Step 10b: Upload generated image to Supabase Storage for permanent URL
    let finalImageUrl = imageResult.imageUrl!;
    try {
      if (finalImageUrl.startsWith("http")) {
        logWithContext("info", "📦 Uploading generated image to Storage...");
        const imgResponse = await fetch(finalImageUrl);
        const imgBlob = await imgResponse.arrayBuffer();
        const storagePath = `generated_${sketchId}_${Date.now()}.png`;

        const { data: storageData, error: storageError } = await (supabase as any)
          .storage
          .from("sketches")
          .upload(storagePath, imgBlob, {
            contentType: "image/png",
            upsert: true,
          });

        if (!storageError && storageData) {
          const { data: urlData } = (supabase as any)
            .storage
            .from("sketches")
            .getPublicUrl(storageData.path);
          finalImageUrl = urlData.publicUrl;
          logWithContext("info", "Image uploaded to Storage", { finalImageUrl });
        } else {
          logWithContext("warn", "Storage upload failed, using temporary URL", storageError);
        }
      }
    } catch (uploadErr) {
      logWithContext("warn", "Failed to upload to storage, using original URL", uploadErr);
    }

    // Step 11: Update database and deduct credits
    logWithContext("info", "💾 Updating database with completed result...");
    await updateSketchWithRetry(
      supabase,
      sketchId,
      "completed",
      finalImageUrl,
    );

    logWithContext(
      "info",
      "💳 Deducting credit after successful processing...",
    );
    const deductResult = await deductUserCredits(
      supabase,
      (user as any).id,
      creditCheck.credits!,
    );

    if (!deductResult.success) {
      logWithContext(
        "error",
        "Failed to deduct credit after processing",
        deductResult.error,
      );
    } else {
      logWithContext("info", "Credit deducted successfully after processing", {
        userId: (user as any).id,
        previousCredits: creditCheck.credits,
        newCredits: creditCheck.credits! - 1,
      });

      await logCreditUsage(supabase, (user as any).id, sketchId);
    }

    const processingTime = Date.now() - requestStartTime;
    logWithContext("success", "🎉 Successfully processed sketch", {
      sketchId,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({
        animatedImageUrl: finalImageUrl,
        sketchId,
        success: true,
        processingTimeMs: processingTime,
      }),
      {
        headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const processingTime = Date.now() - requestStartTime;
    logWithContext("error", "💥 Error in process-sketch function", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime,
      sketchId,
    });

    if (sketchId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseKey) {
          logWithContext("error", "Cannot update sketch status: missing Supabase env vars");
          throw new Error("Missing Supabase environment variables");
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        await updateSketchWithRetry(supabase, sketchId, "failed");
        logWithContext(
          "info",
          "Processing failed but no credit was deducted (credits only deducted after success)",
        );
      } catch (updateError) {
        logWithContext("error", "Failed to update sketch status", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        success: false,
        processingTimeMs: processingTime,
      }),
      {
        headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
