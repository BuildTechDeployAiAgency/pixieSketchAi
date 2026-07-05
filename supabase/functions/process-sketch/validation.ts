import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders(null);

interface ValidationResult {
  isValid: boolean;
  response?: Response;
}

export const validateAuthHeader = (
  authHeader: string | null,
): ValidationResult => {
  if (!authHeader) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "Authentication required",
          success: false,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }
  return { isValid: true };
};

export const validateUser = (
  user: unknown,
  authError: unknown,
): ValidationResult => {
  if (authError || !user) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "Invalid authentication token",
          success: false,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }
  return { isValid: true };
};

export const validateRequestFields = (
  imageData: string,
  preset: string,
  sketchId: string,
): ValidationResult => {
  if (!imageData || !preset || !sketchId) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error:
            "Missing required fields: imageData, preset, and sketchId are required",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      ),
    };
  }
  return { isValid: true };
};

export const validateImageData = (imageData: string): ValidationResult => {
  if (typeof imageData !== "string") {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "Image data must be a base64 string",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      ),
    };
  }

  const base64SizeLimit = 67 * 1024 * 1024;
  if (imageData.length > base64SizeLimit) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "Image file too large. Maximum size is 50MB.",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 413,
        },
      ),
    };
  }

  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(imageData.replace(/\s/g, ""))) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "Invalid image data format",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      ),
    };
  }

  return { isValid: true };
};

export const validatePreset = (
  preset: string,
  availablePresets: Record<string, string>,
): ValidationResult => {
  if (!availablePresets[preset]) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "Invalid preset. Must be one of: cartoon, pixar, realistic",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      ),
    };
  }
  return { isValid: true };
};

export const validateOpenAIKey = (
  apiKey: string | undefined,
): ValidationResult => {
  if (!apiKey) {
    return {
      isValid: false,
      response: new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      ),
    };
  }
  return { isValid: true };
};
