# Deployment Checklist & Owner Actions

1. **Redeploy `process-sketch` Edge Function**
   - Run `supabase functions deploy process-sketch` (or trigger the CI deploy) so the updated fal.ai parser ships to prod.
   - Confirm environment variables (`OPENAI_API_KEY`, `FAL_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are present in the Supabase dashboard.

2. **Validate fal.ai Credentials**
   - In the Supabase Edge Function logs, verify requests show `response_url` and that the new parser logs `✅ Video generation complete` for fresh jobs.
   - If fal.ai rejects the request, re-issue the API key in the Fal console and update the secret.

3. **Smoke-Test the App**
   - `npm run start` (or the Expo Go flow you prefer), then run through: upload sketch → submit transformation.
   - Observe the new "Transformation in Progress" alert and follow the Gallery link to ensure the job appears without manual refresh.

4. **Gallery/Toast UX Content**
   - If you want different wording for the alert or toasts, update the strings in `src/screens/HomeScreen.tsx` and `src/hooks/sketch/useSketchSubscription.ts` respectively.

5. **Monitor Storage Bucket**
   - After a few video generations, confirm the `sketches` bucket contains the MP4 uploads and that access permissions remain correct (public read).

Let me know once the redeploy/test pass or if you need this checklist extended for the “other AI” integration path.
