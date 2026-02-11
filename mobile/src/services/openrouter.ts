import { OPENROUTER_BASE_URL, OPENROUTER_APP_NAME, OPENROUTER_APP_URL, VISION_MODEL, IMAGE_MODEL } from '@/constants/config';
import type { PresetOption } from '@/types';

const PRESET_PROMPTS: Record<PresetOption, string> = {
  cartoon:
    'Transform this drawing into a clean 2D hand-drawn cartoon style with bold outlines, flat vibrant colors, and expressive character features. Make it look like a professional cartoon illustration.',
  pixar:
    'Transform this drawing into a high-quality 3D Pixar-style scene with soft geometry, expressive features, beautiful lighting, and rich detailed textures. Make it look like a frame from a Pixar movie.',
  realistic:
    'Transform this drawing into a semi-realistic storybook illustration with painterly effects, soft lighting, detailed textures, and warm atmospheric tones.',
  anime:
    'Transform this drawing into a vibrant Japanese anime style with characteristic large eyes, dynamic poses, clean line art, and colorful cel-shaded aesthetics.',
  watercolor:
    'Transform this drawing into a beautiful watercolor painting with soft blended colors, delicate brush strokes, flowing pigments, and dreamy atmospheric effects.',
  fantasy:
    'Transform this drawing into an epic fantasy scene with magical elements, glowing effects, enchanted landscapes, mythical creatures, and otherworldly lighting.',
};

interface VisionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Analyze a drawing using OpenRouter's vision API
 * This is called from the Supabase Edge Function, but can also be called directly
 * if the user has their own OpenRouter key configured
 */
export async function analyzeDrawing(
  apiKey: string,
  imageBase64: string,
  preset: PresetOption
): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> {
  try {
    const presetPrompt = PRESET_PROMPTS[preset];

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OPENROUTER_APP_URL,
        'X-Title': OPENROUTER_APP_NAME,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an AI artist assistant. Please analyze this drawing and provide a detailed description for generating a transformed version. ${presetPrompt}

Please provide a comprehensive description that captures:
1. The main subject/character in the drawing
2. The setting and background elements
3. The artistic style requested (${preset})
4. Specific visual details and composition

Your response should be a detailed visual description suitable for image generation.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Vision API error: ${errorText}` };
    }

    const data: VisionResponse = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content;

    if (!enhancedPrompt) {
      return { success: false, error: 'No enhanced prompt generated' };
    }

    return { success: true, enhancedPrompt };
  } catch (error) {
    return {
      success: false,
      error: `Vision API exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Generate a transformed image using OpenRouter
 */
export async function generateImage(
  apiKey: string,
  enhancedPrompt: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OPENROUTER_APP_URL,
        'X-Title': OPENROUTER_APP_NAME,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Image generation error: ${errorText}` };
    }

    const data = await response.json();
    const imageData = data.data?.[0];

    let imageUrl = '';
    if (imageData?.b64_json) {
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else if (imageData?.url) {
      imageUrl = imageData.url;
    }

    if (!imageUrl) {
      return { success: false, error: 'No image generated' };
    }

    return { success: true, imageUrl };
  } catch (error) {
    return {
      success: false,
      error: `Image generation exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
