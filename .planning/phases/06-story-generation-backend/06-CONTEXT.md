# Phase 6: Story Generation Backend - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the backend that accepts a transformed character image + story theme and produces a fully illustrated 5-page AI story stored in Supabase. This phase delivers the generation engine and data persistence only — no in-app reader UI (Phase 7) and no Videobook (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Character Reference Strategy
- Use `animated_image_url` (the transformed Pixar/cartoon version) as the reference image for every page illustration — not the original sketch photo
- Download and re-encode the reference image to base64 on each gpt-image-1 illustration call
- Page illustration prompts are story-scene focused (e.g. "Page 3: The character discovers a glowing star map") — let gpt-image-1 maintain visual consistency from the reference image, no explicit character description prefix
- Illustration style matches the user's original transformation preset (Pixar stays Pixar, cartoon stays cartoon)

### Generation Timing
- Async with polling — same pattern as video generation (submit triggers background work, client polls for status)
- Story generation is added as a new content type / preset within the existing `process-sketch` edge function, not a separate edge function
- User sees a simple spinner + "Generating your story..." status text while polling — no page-by-page progress needed

### Data Model
- Separate `stories` table (not reusing `sketches`) with columns: `id`, `user_id`, `sketch_id` (FK to the source character), `theme`, `status` (processing|completed|failed), `page_count`, `created_at`, `updated_at`
- Separate `story_pages` child table: `id`, `story_id` (FK), `page_number`, `text`, `illustration_url`, `created_at`
- Illustration images uploaded to Supabase Storage (same bucket/pattern as existing sketch images), URL stored in `story_pages.illustration_url`

### Story Length and Format
- Fixed 5 pages per story — predictable generation time, consistent 5-credit cost
- 2–3 sentences of text per page — children's picture book convention, fits well alongside an illustration on screen

### Credit System
- 5 credits flat, deducted only after all 5 pages are successfully generated and stored
- Reuse `credit-service.ts` (`checkUserCredits`, `deductUserCredits`) from `process-sketch`

### Claude's Discretion
- Exact GPT prompt structure for generating the 5-page story text (JSON response with page array)
- How the `process-sketch` function branches to story mode (content_type param or separate preset key)
- Supabase Storage bucket path for story illustration images
- Error handling if one page illustration fails mid-generation (retry or fail whole story)

</decisions>

<specifics>
## Specific Ideas

- Story generation follows the same async pattern as video: submit → `fal_request_id`-style job ID stored → client polls → on completion images are uploaded and story is marked completed
- The `process-sketch` credit flow already checks credits before generation and deducts after — reuse this exact pattern for stories, just with 5 credits instead of 1 or 2

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/functions/process-sketch/credit-service.ts`: `checkUserCredits(supabase, userId, 5)` and `deductUserCredits(supabase, userId, currentCredits, 5)` are directly reusable
- `supabase/functions/process-sketch/openai-service.ts`: `transformImageWithGPTImage1()` — same function will be called per page illustration with the character reference image
- `supabase/functions/_shared/cors.ts`: CORS handling for the new story endpoint
- `supabase/functions/process-sketch/validation.ts`: Auth header validation reusable

### Established Patterns
- Edge function pattern: `serve()` → validate auth → check credits → do work → deduct credits on success → return result
- Async generation pattern (from `poll-video`): submit job → store job ID in DB → client polls status endpoint → on COMPLETED update DB row
- Supabase Storage upload: download content → upload via `supabase.storage.from().upload()` → get public URL → store in DB row

### Integration Points
- New `stories` and `story_pages` tables need Supabase migrations + TypeScript type updates
- `sketches` table provides `animated_image_url` and original preset as inputs to story generation
- `profiles.credits` is the source of truth for credit balance (same RLS pattern as sketches)

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-story-generation-backend*
*Context gathered: 2026-03-15*
