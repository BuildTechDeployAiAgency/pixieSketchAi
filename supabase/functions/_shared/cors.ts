export const allowedOrigins = [
  "http://localhost:8080",
  "https://pixie-sketch-ai.vercel.app",
  "https://pixiesketch.com",
  "https://www.pixiesketch.com",
];

export function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : null;

  return {
    "Access-Control-Allow-Origin": allowedOrigin || "null",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
}

export function handleCorsRequest(req: Request): Response | null {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return null;
}
