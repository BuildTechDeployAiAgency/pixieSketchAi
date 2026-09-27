# Integration Audit Report

## Summary of Findings
- **Unscoped sketch updates** – `supabase/functions/process-sketch/index.ts` instantiates a service-role Supabase client and then updates `sketches` rows solely by the `sketchId` provided in the request body. Because service-role tokens bypass RLS, any crafted request can mutate or deduct credits for an arbitrary sketch UUID. We need to re-fetch the row scoped to `user.id` (and bail with 403s if it does not belong to the caller) before invoking `updateSketchWithRetry`/`update`.
- **fal.ai response never parsed** – `fal-service.ts` ignores the `response_url` returned by the queue API and assumes `GET /requests/{id}` exposes a top-level `video.url`. Seedance responses deliver assets via `response.output`/`response_url`, so `videoUrl` stays undefined and every seedance call surfaces `No video URL in fal.ai result`, which matches the failures you're seeing.
- **Expo upload crashes before hitting Supabase** – `src/screens/HomeScreen.tsx` converts base64 strings with a helper that calls the browser-only `atob`. Hermes/JSI does not ship `atob`, so tapping **Transform** throws `ReferenceError: Can't find variable: atob` and the AI function is never invoked.
- **Budget checks always assume one credit** – `process-sketch/index.ts` calls `checkBudgetLimits(supabase)` without telling it whether the run will consume two credits (video). The RPC defaults to `credits_to_use = 1`, so monthly hard limits and warning thresholds are silently bypassed for video jobs and errors only appear when totals are reconciled later.
- **Fallback path marks jobs failed too early** – When the Vision step fails we immediately call `handleProcessingError`, which writes `status = 'failed'` and fires realtime toasts, *before* attempting the DALLE fallback. Users therefore see an error toast and stale retry prompts even when the fallback image eventually succeeds.

## Action Plan
1. In `process-sketch/index.ts`, load the target sketch row with `.eq("user_id", user.id)` and short-circuit with a 403 if ownership does not match; also pass `creditsRequired` into every DB update/`check_budget_limit` invocation so service-role calls remain scoped.
2. Update `fal-service.ts` to honor `response_url` (or `response.output`) and only return success after resolving a playable MP4 URL; expand logging so we can see fal.ai response shapes when debugging.
3. Replace the custom `decode` helper with `Buffer.from(base64, 'base64')` (or `decode` from `base64-arraybuffer`) so uploads work across Hermes on iOS and Android.
4. Thread the actual credit cost into the `check_budget_limit` RPC (and adjust the SQL signature if needed) to keep budget enforcement consistent for both image (1 credit) and video (2 credits) requests.
5. Move the `handleProcessingError` call inside the “fallback also failed” branch so we only mark sketches failed when no fallback succeeds, and add telemetry so clients understand which stage produced the terminal error.
