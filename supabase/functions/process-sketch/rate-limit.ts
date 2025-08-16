import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders(null);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

interface RateLimitResult {
  allowed: boolean;
  response?: Response;
}

export const checkRateLimit = (userId: string): RateLimitResult => {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(userId) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  if (now > userRateLimit.resetTime) {
    userRateLimit.count = 0;
    userRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }

  if (userRateLimit.count >= RATE_LIMIT) {
    const waitTime = Math.ceil((userRateLimit.resetTime - now) / 1000);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
          success: false,
          retryAfter: waitTime,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": waitTime.toString(),
          },
        },
      ),
    };
  }

  userRateLimit.count++;
  rateLimitMap.set(userId, userRateLimit);

  return { allowed: true };
};
