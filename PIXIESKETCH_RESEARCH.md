# PixieSketch Integration & Reliability Research

## Context
- **Product Goal:** Offer “Bring it to Life” transformations for sketches that may return either still images or Seedance videos, while keeping users informed via Gallery status updates and push-style alerts.
- **Recent Fixes:** Improved fal.ai response parsing, added in-app alerts directing users to the Gallery, and auto-refreshed Gallery data when the tab gains focus.
- **Remaining Problem:** Some Fal jobs succeed in the dashboard but never surface in our app due to storage uploads, timeouts, or response-format drift.

## Issues Tackled So Far
1. **Missing Fal video URLs** – The queue API nests assets under `{ response: { output: { video }}}`; our updated parser now crawls those structures but still depends on Fal returning a publicly retrievable URL.
2. **User feedback gap** – After submitting a transformation the UI now shows an alert (“transformation in progress”) and points toward the Gallery so users aren’t left wondering.
3. **Gallery staleness** – Navigating to the Gallery now triggers an immediate refresh instead of relying on manual pull-to-refresh.

## Goals Moving Forward
- **Reliability:** Ensure every Fal job writes a final MP4/PNG URL to Supabase Storage (or at least to the `sketches` table) before the user sees “failed”.
- **Observability:** Collect enough logs/telemetry to distinguish between Fal failures, Supabase storage errors, credit/budget denials, and client connectivity issues.
- **Experience:** Keep users in the loop (push notifications, toasts, or email) when long-running jobs finish or fail, even if the app is backgrounded.

## Web Research & Potential Solutions
1. **Fal.ai Queue Reliability**
   - Fal’s docs recommend using `fal.queue.result()` or `fal.subscribe()` (with `onQueueUpdate`) to retrieve logs and final outputs. They also provide `logs: true` to capture streaming errors. Consider instrumenting our Edge Function to capture `update.logs` for easier debugging.
   - Fal suggests downloading from the provided `video.url` immediately; the hosted URLs may be short-lived. Uploading the returned MP4 to Supabase Storage as soon as we fetch it (already implemented) is still best practice. If downloads intermittently fail, adding retries with exponential backoff (and a HEAD request to ensure the Object Storage is ready) is recommended.

2. **Supabase Edge Function Timeouts**
   - Supabase functions default to 60s runtime; Seedance jobs can exceed that. Fal’s queue API pattern (submit + poll) is the correct workaround, but we should ensure the Deno deploy has `SUPABASE_EDGE_FUNCTION_TIMEOUT` increased (Pro plan) or we use `setTimeout` to extend waiting with streaming responses.
   - Another pattern is to enqueue Fal jobs via Supabase Edge Function, persist `request_id`, and let a scheduled function (CRON) poll and update `sketches` asynchronously. This would prevent the user-facing request from waiting the entire duration.

3. **Storage Upload/Permissions**
   - If uploads randomly fail, check `sketches` bucket’s `public` access and confirm we aren’t exceeding the 50 MB per-file limit. Supabase recommends chunked uploads for large videos; in Deno we can stream the fetch response to `upload()` rather than buffering entire `arrayBuffer()` to reduce memory pressure.

4. **Client Session & Credit Sync**
   - Ensure `profiles.credits` updates propagate via realtime (already set up) but consider adding optimistic credit deductions client-side with reconciliation on completion so users see immediate credit usage.

5. **Alerting & Monitoring**
   - Hook Supabase Edge Function logs into Logflare or another sink to set alerts on `fal.ai video generation failed` messages.
   - Optionally integrate Supabase with Sentry to capture unhandled exceptions in Edge Functions and React Native app.

## Next Experiments
1. **Fal Subscribe Mode** – Prototype a server-side `fal.subscribe()` worker (Node or Deno) to capture `logs` and final payloads in real time; persist them to Supabase for user-visible progress updates.
2. **Deferred Polling Worker** – Store Fal `request_id` + sketch metadata, return immediately to the client, and use a Supabase Scheduled Function (CRON) every minute to poll outstanding requests. This avoids long HTTP waits and reduces risk of timeouts.
3. **Enhanced UX Messaging** – Add push notifications (Expo Notifications) when sketch status flips to `completed`/`failed`, and provide a dedicated “Activity” feed referencing `credit_usage_log` entries.
4. **Telemetry Dashboard** – Build a lightweight admin view (or Supabase dashboard query) listing Fal request IDs, timestamps, and error states so ops can quickly spot systemic failures.

Keep this file updated as we try new approaches or discover additional failure modes.
