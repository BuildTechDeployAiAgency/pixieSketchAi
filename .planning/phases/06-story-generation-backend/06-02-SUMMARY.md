---
phase: 06-story-generation-backend
plan: 02
subsystem: api
tags: [openai, gpt-image-1, gpt-4o-mini, supabase, edge-functions, deno, credits, storage]

# Dependency graph
requires:
  - phase: 06-01
    provides: stories/story_pages DB schema, RLS policies, Supabase types
provides:
  - generate-story edge function with auth, credit check, fire-and-forget story generation
  - story-service.ts with generateStoryText, generatePageIllustration, downloadAndUploadIllustration
affects:
  - 07-story-ui
  - 08-videobook

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget async generation via detached promise (same pattern as poll-video)
    - GPT-4o-mini with json_object response_format for structured story output
    - gpt-image-1 /v1/images/edits FormData pattern with reference image for character consistency
    - Credits deducted only after full success (5 credits for complete 5-page story)
    - Per-page illustration failures are non-fatal; story continues with null illustration_url

key-files:
  created:
    - supabase/functions/generate-story/index.ts
    - supabase/functions/generate-story/story-service.ts
  modified: []

key-decisions:
  - "Per-page illustration failures are non-fatal: story continues and page is inserted with illustration_url=null"
  - "Credits deducted only after all 5 story_pages rows are inserted and story is marked completed"
  - "btoa/atob used for base64 encoding in Deno (no Buffer API); binary string loop for arrayBuffer to base64"
  - "styleHint derived from sketch content_type: cartoon/pixar/realistic map to three illustration styles"
  - "story title UPDATE is done mid-generation (before illustrations) to provide early feedback in UI"

patterns-established:
  - "Fire-and-forget: insert processing row → return storyId immediately → async work happens out-of-band"
  - "Illustration upload to sketches bucket under stories/ prefix using downloadAndUploadIllustration helper"
  - "logCreditUsage receives storyId (not sketchId) as the resource reference for story operations"

requirements-completed: [STORY-03, STORY-04, STORY-05, CHAR-01]

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 6 Plan 02: Generate-Story Edge Function Summary

**generate-story Deno edge function: GPT-4o-mini 5-page story text + gpt-image-1 character-consistent illustrations uploaded to Supabase Storage, deducting 5 credits only on success**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T02:58:19Z
- **Completed:** 2026-03-16T03:02:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- story-service.ts with three exported helpers: GPT-4o-mini story text, gpt-image-1 illustration, and Supabase Storage upload
- generate-story/index.ts edge function: auth guard, sketch ownership check, animated_image_url validation, credit check, budget check, story row creation, fire-and-forget generation
- Per-page illustration failures are non-fatal — story continues and page row inserted with null illustration_url
- Credits deducted only after all 5 pages are stored and story status flips to completed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create story-service.ts with AI generation helpers** - `a553968` (feat)
2. **Task 2: Create generate-story/index.ts edge function** - `3baca1f` (feat)

## Files Created/Modified

- `supabase/functions/generate-story/story-service.ts` - AI helpers: generateStoryText, generatePageIllustration, downloadAndUploadIllustration
- `supabase/functions/generate-story/index.ts` - Edge function: orchestration, auth, credits, fire-and-forget async generation

## Decisions Made

- Per-page illustration failures are non-fatal: pages are inserted with `illustration_url=null` rather than failing the whole story — aligns with graceful degradation
- `btoa`/`atob` used for base64 encoding in Deno (no Node.js Buffer API available); binary string loop used for arrayBuffer-to-base64 conversion
- `styleHint` derived from `content_type` of the source sketch: `cartoon` → "vibrant 2D cartoon style", `pixar` → "Pixar 3D animation style", `realistic` → "painterly storybook illustration style", default → cartoon
- Story title is written to the stories row mid-generation (before illustrations begin) for early UI feedback
- `logCreditUsage` receives `storyId` as the resource reference because this is a story operation, not a sketch operation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used binary string loop for arrayBuffer-to-base64 encoding**
- **Found during:** Task 2 (generateAndPersistStory implementation)
- **Issue:** Deno does not support `Buffer.from(arrayBuffer).toString('base64')` — that's a Node.js API. Direct `btoa(String.fromCharCode(...uint8))` on large images causes stack overflow.
- **Fix:** Used a for-loop to build the binary string character-by-character before calling `btoa()` — safe for large images
- **Files modified:** supabase/functions/generate-story/index.ts
- **Verification:** Pattern matches known Deno-safe base64 encoding
- **Committed in:** 3baca1f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness in Deno runtime. No scope creep.

## Issues Encountered

- `deno` binary not installed on this machine — `deno check` type verification could not be executed. Types were manually verified against existing patterns in process-sketch. Deploy-time type checking will catch any remaining issues.

## User Setup Required

None - no external service configuration required. Uses existing `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` secrets.

## Next Phase Readiness

- `generate-story` edge function ready to deploy via `supabase functions deploy generate-story`
- Phase 7 (Story UI) can build against `POST /generate-story` with `{ sketchId, theme }` returning `{ storyId, success: true }`
- Client should poll the `stories` table (or use realtime subscription) to detect when `status` transitions from `processing` → `completed`
- `story_pages` rows become available as each page is inserted during async generation (realtime-friendly)

---
*Phase: 06-story-generation-backend*
*Completed: 2026-03-16*

## Self-Check: PASSED

- supabase/functions/generate-story/story-service.ts: FOUND
- supabase/functions/generate-story/index.ts: FOUND
- .planning/phases/06-story-generation-backend/06-02-SUMMARY.md: FOUND
- Commit a553968 (Task 1): FOUND
- Commit 3baca1f (Task 2): FOUND
