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
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    // Log initial request details
    console.log(`[${requestId}] 🤖 Starting OpenAI Vision API call...`, {
      preset,
      imageDataLength: imageData.length,
      timestamp: new Date().toISOString(),
    });

    // Validate API key
    if (!apiKey || apiKey.length < 10) {
      console.error(`[${requestId}] ❌ Invalid API key provided`);
      return { success: false, error: "Invalid OpenAI API key" };
    }

    // Validate image data
    if (!imageData || imageData.length === 0) {
      console.error(`[${requestId}] ❌ Empty image data provided`);
      return { success: false, error: "Empty image data" };
    }

    // Check image data size (log warning if too large)
    const imageSizeKB = Math.round(imageData.length * 0.75 / 1024);
    if (imageSizeKB > 10000) { // > 10MB
      console.warn(`[${requestId}] ⚠️ Large image detected: ${imageSizeKB}KB`);
    }

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

    console.log(`[${requestId}] 📤 Sending request to OpenAI Vision API...`, {
      model: requestPayload.model,
      max_tokens: requestPayload.max_tokens,
      promptLength: requestPayload.messages[0].content[0]?.text?.length || 0,
    });

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

    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] 📥 OpenAI Vision API response received`, {
      status: visionResponse.status,
      statusText: visionResponse.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      let detailedError = `Vision API error: ${visionResponse.status} ${visionResponse.statusText}`;
      
      // Parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          detailedError = `Vision API error: ${errorJson.error.message}`;
          if (errorJson.error.type) {
            detailedError += ` (Type: ${errorJson.error.type})`;
          }
          if (errorJson.error.code) {
            detailedError += ` (Code: ${errorJson.error.code})`;
          }
        }
      } catch (e) {
        detailedError += ` - ${errorText}`;
      }
      
      console.error(`[${requestId}] ❌ Vision API call failed`, {
        status: visionResponse.status,
        error: detailedError,
        responseTime: `${responseTime}ms`,
      });
      
      return { success: false, error: detailedError };
    }

    const visionData: VisionResponse = await visionResponse.json();
    
    console.log(`[${requestId}] 📊 Parsing Vision API response...`, {
      hasChoices: !!visionData.choices,
      choiceCount: visionData.choices?.length || 0,
      responseTime: `${responseTime}ms`,
    });

    if (
      !visionData.choices ||
      !visionData.choices[0] ||
      !visionData.choices[0].message
    ) {
      console.error(`[${requestId}] ❌ Invalid vision response structure`, {
        response: visionData,
      });
      return { success: false, error: "Invalid vision response structure" };
    }

    const enhancedPrompt = visionData.choices[0].message.content;
    if (!enhancedPrompt) {
      console.error(`[${requestId}] ❌ No enhanced prompt generated`, {
        message: visionData.choices[0].message,
      });
      return { success: false, error: "No enhanced prompt generated" };
    }

    console.log(`[${requestId}] ✅ Vision API call successful`, {
      promptLength: enhancedPrompt.length,
      totalResponseTime: `${Date.now() - startTime}ms`,
    });

    return { success: true, enhancedPrompt };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[${requestId}] 💥 Vision API exception`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: `${totalTime}ms`,
    });
    
    // Check for common error patterns
    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return { success: false, error: "Network error connecting to OpenAI API" };
    }
    
    if (errorMessage.includes("timeout")) {
      return { success: false, error: "Request to OpenAI API timed out" };
    }
    
    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
      return { success: false, error: "Unable to connect to OpenAI API" };
    }
    
    return {
      success: false,
      error: `Vision API exception: ${errorMessage}`,
    };
  }
};

export const generateImage = async (
  apiKey: string,
  enhancedPrompt: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    console.log(`[${requestId}] 🖼️ Starting DALL-E 3 image generation...`, {
      promptLength: enhancedPrompt.length,
      timestamp: new Date().toISOString(),
    });

    // Validate inputs
    if (!apiKey || apiKey.length < 10) {
      console.error(`[${requestId}] ❌ Invalid API key provided for image generation`);
      return { success: false, error: "Invalid OpenAI API key" };
    }

    if (!enhancedPrompt || enhancedPrompt.length === 0) {
      console.error(`[${requestId}] ❌ Empty prompt provided for image generation`);
      return { success: false, error: "Empty prompt for image generation" };
    }

    // Check prompt length (DALL-E 3 has limits)
    if (enhancedPrompt.length > 4000) {
      console.warn(`[${requestId}] ⚠️ Long prompt detected: ${enhancedPrompt.length} characters`);
    }

    const requestPayload = {
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json",
    };

    console.log(`[${requestId}] 📤 Sending request to DALL-E 3...`, {
      model: requestPayload.model,
      size: requestPayload.size,
      quality: requestPayload.quality,
      responseFormat: requestPayload.response_format,
    });

    const imageGenResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      },
    );

    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] 📥 DALL-E 3 response received`, {
      status: imageGenResponse.status,
      statusText: imageGenResponse.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!imageGenResponse.ok) {
      const errorText = await imageGenResponse.text();
      let detailedError = `Image generation error: ${imageGenResponse.status} ${imageGenResponse.statusText}`;
      
      // Parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          detailedError = `Image generation error: ${errorJson.error.message}`;
          if (errorJson.error.type) {
            detailedError += ` (Type: ${errorJson.error.type})`;
          }
          if (errorJson.error.code) {
            detailedError += ` (Code: ${errorJson.error.code})`;
          }
          
          // Handle specific error codes
          if (errorJson.error.code === "content_policy_violation") {
            detailedError += " - The generated content was flagged by our content policy";
          } else if (errorJson.error.code === "rate_limit_exceeded") {
            detailedError += " - Rate limit exceeded. Please try again later";
          } else if (errorJson.error.code === "insufficient_quota") {
            detailedError += " - Insufficient quota. Please check your OpenAI account";
          }
        }
      } catch (e) {
        detailedError += ` - ${errorText}`;
      }
      
      console.error(`[${requestId}] ❌ Image generation failed`, {
        status: imageGenResponse.status,
        error: detailedError,
        responseTime: `${responseTime}ms`,
      });
      
      return { success: false, error: detailedError };
    }

    const imageData: ImageGenerationResponse = await imageGenResponse.json();
    
    console.log(`[${requestId}] 📊 Parsing image generation response...`, {
      hasData: !!imageData.data,
      dataLength: imageData.data?.length || 0,
      responseTime: `${responseTime}ms`,
    });

    let animatedImageUrl = "";

    if (imageData.data && imageData.data[0]) {
      if (imageData.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
        console.log(`[${requestId}] ✅ Received base64 image data`, {
          dataSize: Math.round(imageData.data[0].b64_json.length * 0.75 / 1024) + "KB",
        });
      } else if (imageData.data[0].url) {
        animatedImageUrl = imageData.data[0].url;
        console.log(`[${requestId}] ✅ Received image URL`, {
          url: imageData.data[0].url,
        });
      }
    }

    if (!animatedImageUrl) {
      console.error(`[${requestId}] ❌ No image generated in response`, {
        response: imageData,
      });
      return { success: false, error: "No image generated in response" };
    }

    console.log(`[${requestId}] 🎉 Image generation successful`, {
      totalTime: `${Date.now() - startTime}ms`,
      resultType: animatedImageUrl.startsWith("data:") ? "base64" : "url",
    });

    return { success: true, imageUrl: animatedImageUrl };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[${requestId}] 💥 Image generation exception`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: `${totalTime}ms`,
    });
    
    // Check for common error patterns
    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return { success: false, error: "Network error connecting to OpenAI API" };
    }
    
    if (errorMessage.includes("timeout")) {
      return { success: false, error: "Image generation request timed out" };
    }
    
    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
      return { success: false, error: "Unable to connect to OpenAI API" };
    }
    
    return {
      success: false,
      error: `Image generation exception: ${errorMessage}`,
    };
  }
};

export const fallbackImageGeneration = async (
  apiKey: string,
  prompt: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`[${requestId}] 🔄 Using fallback image generation...`, {
    promptLength: prompt.length,
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate inputs
    if (!apiKey || apiKey.length < 10) {
      console.error(`[${requestId}] ❌ Invalid API key provided for fallback generation`);
      return { success: false, error: "Invalid OpenAI API key" };
    }

    if (!prompt || prompt.length === 0) {
      console.error(`[${requestId}] ❌ Empty prompt provided for fallback generation`);
      return { success: false, error: "Empty prompt for fallback generation" };
    }

    const requestPayload = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json",
    };

    console.log(`[${requestId}] 📤 Sending fallback request to DALL-E 3...`, {
      model: requestPayload.model,
      size: requestPayload.size,
      quality: requestPayload.quality,
    });

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      },
    );

    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] 📥 Fallback DALL-E 3 response received`, {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let detailedError = `Fallback generation failed: ${response.status} ${response.statusText}`;
      
      // Parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          detailedError = `Fallback generation failed: ${errorJson.error.message}`;
          if (errorJson.error.code) {
            detailedError += ` (Code: ${errorJson.error.code})`;
          }
        }
      } catch (e) {
        detailedError += ` - ${errorText}`;
      }
      
      console.error(`[${requestId}] ❌ Fallback generation failed`, {
        status: response.status,
        error: detailedError,
        responseTime: `${responseTime}ms`,
      });
      
      return {
        success: false,
        error: detailedError,
      };
    }

    const data: ImageGenerationResponse = await response.json();
    
    console.log(`[${requestId}] 📊 Parsing fallback generation response...`, {
      hasData: !!data.data,
      dataLength: data.data?.length || 0,
      responseTime: `${responseTime}ms`,
    });

    let animatedImageUrl = "";

    if (data.data && data.data[0]) {
      if (data.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
        console.log(`[${requestId}] ✅ Fallback received base64 image data`, {
          dataSize: Math.round(data.data[0].b64_json.length * 0.75 / 1024) + "KB",
        });
      } else if (data.data[0].url) {
        animatedImageUrl = data.data[0].url;
        console.log(`[${requestId}] ✅ Fallback received image URL`, {
          url: data.data[0].url,
        });
      }
    }

    if (!animatedImageUrl) {
      console.error(`[${requestId}] ❌ Fallback generation failed - no image URL`, {
        response: data,
      });
      return {
        success: false,
        error: "Fallback generation failed - no image URL",
      };
    }

    console.log(`[${requestId}] 🎉 Fallback generation successful`, {
      totalTime: `${Date.now() - startTime}ms`,
      resultType: animatedImageUrl.startsWith("data:") ? "base64" : "url",
    });

    return { success: true, imageUrl: animatedImageUrl };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[${requestId}] 💥 Fallback generation exception`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: `${totalTime}ms`,
    });
    
    // Check for common error patterns
    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return { success: false, error: "Network error in fallback generation" };
    }
    
    if (errorMessage.includes("timeout")) {
      return { success: false, error: "Fallback generation request timed out" };
    }
    
    return {
      success: false,
      error: `Fallback generation exception: ${errorMessage}`,
    };
  }
};
