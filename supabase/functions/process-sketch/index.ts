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
  callOpenAIVision,
  generateImage,
  fallbackImageGeneration,
} from "./openai-service.ts";
import { checkRateLimit } from "./rate-limit.ts";

const PRESET_PROMPTS = {
  cartoon:
    "Please convert the uploaded children's drawing into a clean, 2-D hand-drawn cartoon. Keep every line, shape, and character exactly where the child placed them, but redraw with smooth bold outlines, flat vibrant colors, and minimal shading. Preserve the whimsical imperfections so it still feels like a kid's artwork, just in polished Saturday-morning-cartoon style.",
  pixar:
    "Transform the uploaded children's drawing into a high-quality Pixar-style 3-D scene. Maintain the original layout, proportions, and color placement of every character and object. Rebuild them with soft rounded geometry, expressive Pixar eyes, gentle subsurface lighting, and a cheerful cinematic palette. Aim for a final render that looks like a frame from a modern Pixar short while clearly echoing the child's design.",
  realistic:
    "Bring the uploaded children's drawing to life in a semi-realistic storybook illustration. Keep the exact composition and whimsical shapes, but add believable textures, depth, and dynamic lighting. Use rich painterly brushstrokes and subtle gradients so the scene feels tangible and vibrant, yet retains the playful spirit and color blocking of the child's original art.",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader!,
        },
      },
    });

    // Step 3: Verify user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
    const { imageData, preset, sketchId: requestSketchId } = await req.json();
    sketchId = requestSketchId;

    logWithContext("info", "🎨 Processing sketch request started", {
      sketchId,
      preset,
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

    // Step 7: Check user credits
    logWithContext("info", "Checking user credits...");
    const creditCheck = await checkUserCredits(supabase, (user as any).id);
    if (!creditCheck.hasCredits) {
      return updateCorsHeaders(creditCheck.response!);
    }

    // Step 8: Check budget limits
    logWithContext("info", "Checking budget limits...");
    const budgetCheck = await checkBudgetLimits(supabase);
    if (!budgetCheck.allowed) {
      return updateCorsHeaders(budgetCheck.response!);
    }

    logWithContext("info", "User has sufficient credits", {
      userId: (user as any).id,
      availableCredits: creditCheck.credits,
    });

    // Step 9: Process with OpenAI Vision API
    logWithContext("info", "🔘 Starting transformation", { preset });
    const presetPrompt = PRESET_PROMPTS[preset as keyof typeof PRESET_PROMPTS];

    const visionResult = await callOpenAIVision(
      openAIApiKey!,
      imageData,
      preset,
      presetPrompt,
    );
    if (!visionResult.success) {
      logWithContext(
        "error",
        "Vision API failed, trying fallback",
        visionResult.error,
      );
      await handleProcessingError(
        supabase,
        sketchId,
        new Error(visionResult.error),
        "vision_analysis",
      );

      const fallbackResult = await fallbackImageGeneration(
        openAIApiKey!,
        presetPrompt,
      );
      if (!fallbackResult.success) {
        return new Response(
          JSON.stringify({
            error: "Both primary and fallback generation failed",
            details: fallbackResult.error,
            success: false,
          }),
          {
            headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
            status: 500,
          },
        );
      }

      await updateSketchWithRetry(
        supabase,
        sketchId,
        "completed",
        fallbackResult.imageUrl,
      );
      await deductUserCredits(supabase, (user as any).id, creditCheck.credits!);
      await logCreditUsage(supabase, (user as any).id, sketchId);

      const processingTime = Date.now() - requestStartTime;
      return new Response(
        JSON.stringify({
          animatedImageUrl: fallbackResult.imageUrl,
          sketchId,
          success: true,
          processingTimeMs: processingTime,
          usedFallback: true,
        }),
        {
          headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Step 10: Generate final image
    const imageResult = await generateImage(
      openAIApiKey!,
      visionResult.enhancedPrompt!,
    );
    if (!imageResult.success) {
      logWithContext("error", "Image generation failed", imageResult.error);
      await handleProcessingError(
        supabase,
        sketchId,
        new Error(imageResult.error),
        "image_generation",
      );

      return new Response(
        JSON.stringify({
          error: "Failed to generate image",
          details: imageResult.error,
          success: false,
        }),
        {
          headers: { ...getCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Step 11: Update database and deduct credits
    logWithContext("info", "💾 Updating database with completed result...");
    await updateSketchWithRetry(
      supabase,
      sketchId,
      "completed",
      imageResult.imageUrl,
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
      enhancedPromptLength: visionResult.enhancedPrompt!.length,
    });

    return new Response(
      JSON.stringify({
        animatedImageUrl: imageResult.imageUrl,
        sketchId,
        success: true,
        processingTimeMs: processingTime,
        enhancedPrompt: visionResult.enhancedPrompt!.substring(0, 100) + "...",
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
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
