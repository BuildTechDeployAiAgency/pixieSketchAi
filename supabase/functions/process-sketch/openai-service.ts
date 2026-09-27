interface VisionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface ImageGenerationResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

// Primary image transformation: passes the actual image to gpt-image-1 so it sees
// the original pixels directly — no text description middleman.
export const transformImageWithGPTImage1 = async (
  apiKey: string,
  imageData: string,
  stylePrompt: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  try {
    console.log("🎨 Transforming image with gpt-image-1 (image edits)...");

    const imageBytes = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));
    const imageBlob = new Blob([imageBytes], { type: "image/png" });

    const formData = new FormData();
    formData.append("image", imageBlob, "image.png");
    formData.append("prompt", stylePrompt);
    formData.append("model", "gpt-image-1");
    formData.append("n", "1");
    formData.append("size", "1024x1024");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `gpt-image-1 error (${response.status}): ${errorText}` };
    }

    const data: ImageGenerationResponse = await response.json();
    let imageUrl = "";

    if (data.data?.[0]) {
      if (data.data[0].b64_json) {
        imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      } else if (data.data[0].url) {
        imageUrl = data.data[0].url;
      }
    }

    if (!imageUrl) {
      return { success: false, error: "No image in gpt-image-1 response" };
    }

    console.log("✅ gpt-image-1 transformation complete");
    return { success: true, imageUrl };
  } catch (error) {
    return {
      success: false,
      error: `gpt-image-1 exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const checkImageSafety = async (
  apiKey: string,
  imageData: string,
): Promise<{ safe: boolean; reason?: string }> => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a content safety reviewer for a family-friendly AI art app. Analyze this image and determine if it is safe to process.

Flag as UNSAFE only if the image clearly contains:
- Sexual or explicit content
- Graphic violence or gore
- Hate symbols, extremist imagery, or slurs
- Content that sexualizes or could harm minors

Do NOT flag: cartoons, fantasy creatures, action scenes, stick figures, or ambiguous drawings.

Respond with JSON only — no other text:
{"safe": true}
or
{"safe": false, "reason": "one short sentence explaining what was found"}`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${imageData}`, detail: "low" },
            },
          ],
        }],
        max_tokens: 60,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.warn("Safety check API failed, defaulting to safe");
      return { safe: true };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { safe: true };

    const jsonMatch = content.match(/\{.*\}/s);
    if (!jsonMatch) return { safe: true };

    return JSON.parse(jsonMatch[0]);
  } catch {
    return { safe: true };
  }
};

export const callOpenAIVision = async (
  apiKey: string,
  imageData: string,
  preset: string,
  presetPrompt: string,
): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> => {
  try {
    const requestPayload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI art director. Work in two steps:

STEP 1 — IDENTIFY the source image:
Look at this drawing and note exactly:
- The main subject(s): what they are, their specific features, pose, clothing, expression
- The setting: where the scene takes place, background elements
- All objects and props visible
- Overall composition, colors, and mood

STEP 2 — WRITE the DALL-E prompt:
Using your Step 1 analysis as the foundation, write a DALL-E image generation prompt that applies the "${preset}" style to this exact scene.

Style requirement: ${presetPrompt}

The prompt you write MUST:
- Be rooted in what you identified in Step 1 — if a figure is sitting in a chair, the styled version must also show a figure sitting in a chair
- Carry all key identifying features, pose, setting, and objects into the styled version
- Describe all subjects as "character" or "figure" — never reference age
- Not invent or remove any elements from the original

Output ONLY the final DALL-E prompt. No preamble, no step labels.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageData}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 700,
      temperature: 0.7,
    };

    console.log("🤖 Calling OpenAI Vision API...");

    const visionResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      },
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      return { success: false, error: `Vision API error: ${errorText}` };
    }

    const visionData: VisionResponse = await visionResponse.json();

    if (
      !visionData.choices ||
      !visionData.choices[0] ||
      !visionData.choices[0].message
    ) {
      return { success: false, error: "Invalid vision response structure" };
    }

    const enhancedPrompt = visionData.choices[0].message.content;
    if (!enhancedPrompt) {
      return { success: false, error: "No enhanced prompt generated" };
    }

    return { success: true, enhancedPrompt };
  } catch (error) {
    return {
      success: false,
      error: `Vision API exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const generateImage = async (
  apiKey: string,
  enhancedPrompt: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  try {
    console.log("🖼️ Starting image generation...");

    const imageGenResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          response_format: "url",
        }),
      },
    );

    if (!imageGenResponse.ok) {
      const errorText = await imageGenResponse.text();
      return { success: false, error: `Image generation error: ${errorText}` };
    }

    const imageData: ImageGenerationResponse = await imageGenResponse.json();

    let animatedImageUrl = "";

    if (imageData.data && imageData.data[0]) {
      if (imageData.data[0].url) {
        animatedImageUrl = imageData.data[0].url;
      } else if (imageData.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
      }
    }

    if (!animatedImageUrl) {
      return { success: false, error: "No image generated in response" };
    }

    return { success: true, imageUrl: animatedImageUrl };
  } catch (error) {
    return {
      success: false,
      error: `Image generation exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const fallbackImageGeneration = async (
  apiKey: string,
  prompt: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  console.log("🔄 Using fallback image generation");

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          response_format: "url",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Fallback generation failed: ${errorText}`,
      };
    }

    const data: ImageGenerationResponse = await response.json();
    let animatedImageUrl = "";

    if (data.data && data.data[0]) {
      if (data.data[0].url) {
        animatedImageUrl = data.data[0].url;
      } else if (data.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      }
    }

    if (!animatedImageUrl) {
      return {
        success: false,
        error: "Fallback generation failed - no image URL",
      };
    }

    return { success: true, imageUrl: animatedImageUrl };
  } catch (error) {
    return {
      success: false,
      error: `Fallback generation exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
