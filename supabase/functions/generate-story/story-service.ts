// story-service.ts — AI generation helpers for generate-story edge function

export interface StoryPage {
  page_number: number;
  text: string;
  scene_description: string;
}

export interface StoryTextResult {
  success: boolean;
  title?: string;
  pages?: StoryPage[];
  error?: string;
}

export interface IllustrationResult {
  success: boolean;
  imageBase64?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Generates 5-page story text via GPT-4o-mini.
 * Returns structured JSON with title and pages array.
 */
export async function generateStoryText(
  apiKey: string,
  theme: string,
  characterDescription: string,
): Promise<StoryTextResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are a children's picture book author. Write a short, joyful, age-appropriate story.",
          },
          {
            role: "user",
            content: `Write a 5-page children's picture book story. Theme: "${theme}". The main character is described as: "${characterDescription}". Return ONLY valid JSON with this exact shape: { "title": "...", "pages": [ { "page_number": 1, "text": "2-3 sentences of story text for this page.", "scene_description": "one sentence describing what the character is doing in this scene for the illustration." }, ... ] } No markdown, no code blocks, just the raw JSON object.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `OpenAI API error ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: "No content in GPT response" };
    }

    const parsed = JSON.parse(content);

    if (!parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      return { success: false, error: "Invalid story JSON structure from GPT" };
    }

    return {
      success: true,
      title: parsed.title,
      pages: parsed.pages,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generates a page illustration via gpt-image-1 /v1/images/edits.
 * Uses the character's animated image as reference to maintain consistency.
 * Returns base64 or URL of the generated image. Never throws.
 */
export async function generatePageIllustration(
  apiKey: string,
  referenceImageBase64: string,
  sceneDescription: string,
  styleHint: string,
): Promise<IllustrationResult> {
  try {
    const prompt = `${styleHint} illustration for a children's picture book. Scene: ${sceneDescription}. Keep the character's exact appearance, colors, and features consistent with the reference image.`;

    // Decode base64 to bytes for the FormData upload
    const imageBytes = Uint8Array.from(atob(referenceImageBase64), (c) =>
      c.charCodeAt(0),
    );
    const imageBlob = new Blob([imageBytes], { type: "image/png" });

    const formData = new FormData();
    formData.append("image", imageBlob, "image.png");
    formData.append("prompt", prompt);
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
      return {
        success: false,
        error: `gpt-image-1 error ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const imageData = data.data?.[0];

    if (!imageData) {
      return { success: false, error: "No image data in gpt-image-1 response" };
    }

    // gpt-image-1 returns b64_json by default
    if (imageData.b64_json) {
      return { success: true, imageBase64: imageData.b64_json };
    }

    if (imageData.url) {
      return { success: true, imageUrl: imageData.url };
    }

    return { success: false, error: "No b64_json or url in gpt-image-1 response" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Downloads or decodes illustration data and uploads to Supabase Storage.
 * Bucket: `sketches` (reuses existing bucket).
 * Returns the permanent public URL for the uploaded illustration.
 * Throws on upload failure.
 */
export async function downloadAndUploadIllustration(
  supabase: unknown,
  storyId: string,
  pageNumber: number,
  imageBase64OrUrl: string,
): Promise<string> {
  const storagePath = `stories/story_${storyId}_page_${pageNumber}_${Date.now()}.png`;

  let imageBytes: ArrayBuffer;

  if (imageBase64OrUrl.startsWith("data:image")) {
    // Strip data URI prefix: e.g. "data:image/png;base64,<base64>"
    const base64Data = imageBase64OrUrl.split(",")[1];
    const uint8 = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    imageBytes = uint8.buffer;
  } else if (
    imageBase64OrUrl.startsWith("http://") ||
    imageBase64OrUrl.startsWith("https://")
  ) {
    // Download from URL
    const imgResponse = await fetch(imageBase64OrUrl);
    if (!imgResponse.ok) {
      throw new Error(
        `Failed to download illustration from URL: ${imgResponse.status}`,
      );
    }
    imageBytes = await imgResponse.arrayBuffer();
  } else {
    // Assume raw base64 (no data URI prefix)
    const uint8 = Uint8Array.from(atob(imageBase64OrUrl), (c) =>
      c.charCodeAt(0),
    );
    imageBytes = uint8.buffer;
  }

  const { data: storageData, error: storageError } = await (supabase as any)
    .storage
    .from("sketches")
    .upload(storagePath, imageBytes, {
      contentType: "image/png",
      upsert: true,
    });

  if (storageError || !storageData) {
    throw new Error(
      `Storage upload failed: ${JSON.stringify(storageError)}`,
    );
  }

  const { data: urlData } = (supabase as any)
    .storage
    .from("sketches")
    .getPublicUrl(storageData.path);

  return urlData.publicUrl as string;
}
