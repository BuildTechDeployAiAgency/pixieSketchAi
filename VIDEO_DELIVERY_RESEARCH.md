# Seedance Video Delivery Research & Remediation Plan

## 1. Current Pipeline (as implemented)
- **Client (React Native / Expo)**: uploads the user sketch to the `sketches` bucket, creates a DB record, then invokes the `process-sketch` Edge Function. After submission, the UI now alerts users to monitor the Gallery.
- **Edge Function (`process-sketch`)**:
  1. Validates auth/credits.
  2. For video presets, calls `generateVideoMotionPrompt` (OpenAI) and `submitFalVideoGeneration`.
  3. Polls Fal’s queue API for up to 120s.
  4. When Fal returns a result, downloads the MP4 via `fetch(videoUrl)` and uploads it to `storage.from("sketches")`.
  5. Updates `sketches` table with `animated_image_url` and deducts credits.
- **Gallery**: subscribes to realtime updates on `sketches` and assumes completed rows include a usable `animated_image_url` (image or video) hosted in Supabase Storage.

## 2. Failure Symptoms & Hypotheses
- Fal dashboard shows completed jobs (e.g., `906f0e71-b5b4-4b74-b7db-ada98f858d00`), yet our Edge Function logs “No video URL in fal.ai result” or times out before uploading to Supabase.
- Potential causes:
  1. Fal queue responses are still changing (e.g., nested arrays, signed URLs expiring before download, or `response_url` returning NDJSON instead of JSON).
  2. Supabase Edge Function hits runtime/memory limits while buffering large MP4s, causing uploads to fail silently.
  3. Storage bucket `sketches` may be misconfigured (private bucket without signed URL generation, per-file size limit exceeded, or missing CORS for direct playback).
  4. After upload, the public URL might not be saved (e.g., `storage.from().getPublicUrl()` returning cacheable, but RLS preventing read).

## 3. Best Practices (Fal.ai, Supabase, React Native)

### 3.1 Fal.ai Queue
- Use `fal.queue.result(model, { requestId })` instead of manual REST polling when possible; the SDK handles retries, response parsing, and returns `{ data, requestId }` where `data.video.url` is guaranteed.
- If sticking with REST, log entire `response` payload when `videoUrl` is falsy; Fal sometimes returns arrays in `response.outputs[0].content[0].url`.
- Fal hosted URLs are short-lived; download immediately and retry at least twice with exponential backoff before declaring failure.
- Consider Fal’s `subscribe` API to stream logs; we could pipe logs to Supabase so users see progress (and the server knows when the process actually failed).

### 3.2 Supabase Edge Functions & Storage
- Edge Functions default to 60s execution. For long-running polls, keep the HTTP response alive by streaming chunked text (or convert to “enqueue job” + “scheduled poller” architecture). Supabase docs recommend splitting heavy workflows into two functions: one to enqueue metadata and a scheduled/cron function to poll and finalize.
- When uploading large files via Deno, stream the response instead of buffering with `arrayBuffer()`:
  ```ts
  const response = await fetch(videoUrl);
  const readable = response.body?.getReader();
  const { data, error } = await supabase.storage.from("sketches").upload(path, readable, { duplex: "half" });
  ```
  This keeps RAM usage low and avoids timeouts.
- Ensure the `sketches` bucket is public (or we generate signed URLs for clients). RLS doesn’t apply to storage buckets, but bucket policies must allow read.
- For larger-than-50MB assets, consider splitting into multiple objects or enabling “increase file size limit” via support.

### 3.3 React Native Consumption
- Prefer streaming playback (Expo AV already supports remote MP4). If we expect signed URLs, implement refresh logic when `animated_image_url` expires.
- Provide user feedback when a job is “processing”, “retrying”, or “failed” using realtime subscription events and toasts.
- For offline support, download the MP4 to device storage after completion (optional) to avoid repeated network load.

## 4. Investigation Plan
1. **Fal Response Logging**
   - Temporarily log `JSON.stringify(resultData)` whenever we enter the “No video URL” block; capture several request IDs to inspect actual schema.
   - Validate whether the Fal queue endpoint returns NDJSON lines or zipped payloads when `response_url` is provided.

2. **Edge Function Limits**
   - Check Supabase project plan; increase Edge Function timeout if available. Otherwise, refactor to: enqueue job → return 202 → scheduled poller updates DB.
   - Instrument timing logs (submit-to-result, download duration, upload duration) to pinpoint where timeouts occur.

3. **Storage Health**
   - Verify bucket settings via `SELECT * FROM storage.buckets WHERE name='sketches';` Ensure `public=true`.
   - Inspect Supabase dashboard for failed uploads or quotas reached.
   - Upload a test MP4 from psql using the same service role key to ensure permissions match.

4. **Client Experience**
   - Add a temporary admin screen listing `sketches` rows with Fal `request_id`, status, and `animated_image_url` to visually confirm when a job bottoms out.
   - Ensure the Gallery handles signed URLs / expiring URLs by refreshing via Supabase Storage’s `createSignedUrl` endpoint if needed.

## 5. Long-Term Architecture Options
- **Async Worker**: After the client submits a job, the Edge Function stores metadata and immediately returns. A Supabase Scheduled Function (or external worker) polls Fal and updates the record, making timeouts irrelevant.
- **Webhooks/Callbacks**: If Fal adds webhook delivery in the future, subscribe with a secure endpoint so Fal posts the result directly.
- **Queue + Retries**: Introduce a `video_jobs` table storing Fal IDs, status, retry counts, and errors. Use it to power an admin dashboard and automated retries (e.g., if storage upload fails, re-download while Fal URL is still valid).

## 6. Next Steps
1. Capture failing Fal responses and confirm schema mismatches.
2. Measure upload timings and confirm whether we hit Edge Function limits.
3. Review bucket configuration (public flag, file size limits, CORS) and document expected URL pattern.
4. Decide between “extend timeout & streaming upload” vs. “enqueue + scheduled poller” and draft the implementation plan accordingly.

*(Per request, this document only outlines research and planning; no code changes were made.)*
