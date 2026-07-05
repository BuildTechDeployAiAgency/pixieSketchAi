const FAL_QUEUE_URL =
  "https://queue.fal.run/fal-ai/bytedance/seedance/v1.5/pro/image-to-video";

interface FalQueueResponse {
  request_id: string;
  status: string;
}

interface FalStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response_url?: string;
}

interface FalVideoAsset {
  url?: string;
}

interface FalResultResponse {
  video?: FalVideoAsset | string;
  output?: FalVideoAsset | { video?: FalVideoAsset } | string;
  data?: {
    video?: FalVideoAsset | string;
    output?: FalVideoAsset | string;
  };
  result?: {
    video?: FalVideoAsset | string;
  };
  seed?: number;
}

export const generateVideoMotionPrompt = async (
  openAIApiKey: string,
  imageData: string,
): Promise<{ success: boolean; prompt?: string; error?: string }> => {
  try {
    console.log("🎬 Generating motion prompt from drawing...");

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an animation director. Work in two steps:

STEP 1 — IDENTIFY the source image:
What is specifically shown in this drawing?
- The main subject(s): what they are, their pose, features, and setting
- Any objects, environment, or background elements
- The overall mood and scene

STEP 2 — WRITE the motion prompt:
Using Step 1 as your base, write a 1-2 sentence motion prompt that brings THIS specific scene to life in a 5-second video.

The motion must be natural and fitting for what is actually shown:
- A figure at a desk might lean back, papers might rustle, a lamp might flicker
- An outdoor scene might have wind, leaves moving, light shifting
- Add atmospheric effects that suit the specific setting (glow, sparkles, water ripples, fire embers)
- Include a subtle camera move if it serves the scene

RULES:
- Under 50 words
- Grounded in the specific scene you identified — not generic
- NEVER mention age, children, or minors — describe as characters, figures, or creatures
- Output ONLY the motion prompt, no step labels or preamble`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${imageData}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Motion prompt API error: ${errorText}` };
    }

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content?.trim();

    if (!prompt) {
      return { success: false, error: "No motion prompt generated" };
    }

    console.log("✅ Motion prompt generated:", prompt);
    return { success: true, prompt };
  } catch (error) {
    return {
      success: false,
      error: `Motion prompt exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const submitFalVideoGeneration = async (
  imageUrl: string,
  prompt: string,
): Promise<{ success: boolean; requestId?: string; error?: string }> => {
  const falKey = Deno.env.get("FAL_KEY");
  if (!falKey) {
    return { success: false, error: "FAL_KEY not configured" };
  }

  try {
    console.log("🎥 Submitting video generation to fal.ai...");

    const response = await fetch(FAL_QUEUE_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
        duration: 5,
        aspect_ratio: "16:9",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `fal.ai submit error (${response.status}): ${errorText}`,
      };
    }

    const data: FalQueueResponse = await response.json();

    if (!data.request_id) {
      return { success: false, error: "No request_id returned from fal.ai" };
    }

    console.log("✅ Video generation submitted:", data.request_id);
    return { success: true, requestId: data.request_id };
  } catch (error) {
    return {
      success: false,
      error: `fal.ai submit exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const pollFalVideoResult = async (
  requestId: string,
  maxWaitMs = 120_000,
): Promise<{ success: boolean; videoUrl?: string; error?: string }> => {
  const falKey = Deno.env.get("FAL_KEY");
  if (!falKey) {
    return { success: false, error: "FAL_KEY not configured" };
  }

  // fal.ai routes status/result to the app_id (fal-ai/bytedance), NOT the full model subpath
  const FAL_APP_ID = "fal-ai/bytedance";
  const statusUrl = `https://queue.fal.run/${FAL_APP_ID}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${FAL_APP_ID}/requests/${requestId}`;
  const pollInterval = 5_000;
  const startTime = Date.now();

  console.log(`⏳ Polling fal.ai for result (max ${maxWaitMs / 1000}s)...`);

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const statusResponse = await fetch(statusUrl, {
        headers: { Authorization: `Key ${falKey}` },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Poll status error:", errorText);
        await new Promise((r) => setTimeout(r, pollInterval));
        continue;
      }

      const statusData: FalStatusResponse = await statusResponse.json();
      console.log(`  Status: ${statusData.status}`);

      if (statusData.status === "COMPLETED") {
        const fetchUrl = statusData.response_url || resultUrl;
        const resultResponse = await fetch(fetchUrl, {
          headers: { Authorization: `Key ${falKey}` },
        });

        if (!resultResponse.ok) {
          return {
            success: false,
            error: `Failed to fetch result: ${await resultResponse.text()}`,
          };
        }

        const resultData = await resultResponse.json();
        console.log("fal.ai raw result keys:", Object.keys(resultData));

        // Unwrap the queue API response envelope (fal.ai wraps model output under "response")
        const modelOutput: FalResultResponse & { response?: FalResultResponse } =
          resultData.response ?? resultData;
        console.log("fal.ai model output keys:", Object.keys(modelOutput));

        const findVideoUrl = (payload: unknown): string | undefined => {
          if (!payload) return undefined;
          if (typeof payload === "string") return payload;
          if (typeof payload === "object") {
            const obj = payload as Record<string, unknown>;
            const directUrl = obj.url;
            if (typeof directUrl === "string") return directUrl;

            const directVideo = obj.video;
            const nestedVideo = findVideoUrl(directVideo);
            if (nestedVideo) return nestedVideo;

            for (const key of ["output", "data", "result", "response"]) {
              if (key in obj) {
                const nested = findVideoUrl(obj[key]);
                if (nested) return nested;
              }
            }

            if (Array.isArray(obj.outputs)) {
              for (const item of obj.outputs as unknown[]) {
                const nested = findVideoUrl(item);
                if (nested) return nested;
              }
            }
          }

          if (Array.isArray(payload)) {
            for (const entry of payload) {
              const nested = findVideoUrl(entry);
              if (nested) return nested;
            }
          }

          return undefined;
        };

        const videoUrl =
          findVideoUrl(modelOutput) ??
          findVideoUrl(resultData.response) ??
          findVideoUrl(resultData.data);

        if (!videoUrl) {
          console.error(
            "Unexpected fal.ai result structure:",
            JSON.stringify(modelOutput),
          );
          return {
            success: false,
            error: `No video URL in fal.ai result. Keys: ${Object.keys(resultData).join(", ")}`,
          };
        }

        console.log("✅ Video generation complete:", videoUrl);
        return { success: true, videoUrl };
      }

      if (statusData.status === "FAILED") {
        return { success: false, error: "fal.ai video generation failed" };
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    } catch (error) {
      console.error("Poll exception:", error);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
  }

  return { success: false, error: `Video generation timed out after ${maxWaitMs / 1000}s` };
};
