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
              text: `You are an AI artist assistant. Please analyze this drawing and then provide a detailed description for generating a transformed version. ${presetPrompt}. 

Please provide a comprehensive description that captures:
1. The main subject/character in the drawing
2. The setting and background elements  
3. The artistic style requested (${preset})
4. Specific visual details and composition

Your response should be a detailed visual description suitable for image generation, incorporating the transformation style requested.`,
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
      max_tokens: 500,
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
          response_format: "b64_json",
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
      if (imageData.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
      } else if (imageData.data[0].url) {
        animatedImageUrl = imageData.data[0].url;
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
          response_format: "b64_json",
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
      if (data.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      } else if (data.data[0].url) {
        animatedImageUrl = data.data[0].url;
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
