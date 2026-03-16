---
phase: 06-story-generation-backend
plan: 03
subsystem: ui
tags: [react-native, supabase, edge-functions, polling, context, hooks, stories]

# Dependency graph
requires:
  - phase: 06-story-generation-backend
    provides: "generate-story edge function, stories + story_pages DB tables, RLS policies (from 06-01 and 06-02)"
provides:
  - "poll-story edge function: JWT-authenticated story status endpoint with ownership check"
  - "useStories hook: story CRUD + realtime subscription on stories table"
  - "StoryContext: React context wrapping useStories, exposes createStory, stories, isLoading"
  - "HomeScreen story creation mode: Transform/Create Story toggle, character picker, theme input, polling"
  - "App.tsx: StoryProvider wired inside SketchProvider in MainTabs"
affects:
  - "07-story-gallery-ui — needs StoryContext and poll-story to display stories in Gallery"
  - "08-videobook-backend — same provider/hook pattern as story integration"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useStories hook mirrors useSketches sub-hook pattern with Supabase realtime channel"
    - "StoryContext mirrors SketchContext provider pattern exactly"
    - "pollStoryStatus: setInterval every 10s, max 72 attempts (12 min), clearInterval on complete/fail/timeout"
    - "poll-story edge function: simple status read with ownership check, no fal.ai dependency"

key-files:
  created:
    - "supabase/functions/poll-story/index.ts"
    - "src/hooks/useStories.ts"
    - "src/contexts/StoryContext.tsx"
  modified:
    - "src/screens/HomeScreen.tsx"
    - "App.tsx"

key-decisions:
  - "poll-story is a pure status read (no generation logic) — all generation happens in generate-story async"
  - "Story mode toggle (Transform/Create Story) added to HomeScreen rather than a new screen — keeps navigation simple"
  - "Character picker shows only completed sketches with animated_image_url (not all sketches)"
  - "Story polling max 72 attempts (12 min) vs video polling max 60 attempts (10 min) — stories take longer"

patterns-established:
  - "StoryContext: same pattern as SketchContext — context wraps hook, exported useStoryContext throws if outside provider"
  - "Mode toggle UI: bg-gray-200 segmented control with active tab showing bg-white shadow-sm"

requirements-completed:
  - STORY-01
  - STORY-02

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 6 Plan 3: Story Generation Mobile Integration Summary

**poll-story Deno edge function + useStories hook + StoryContext + HomeScreen story creation mode with character picker, theme input, and 12-min polling pipeline**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-16T03:05:31Z
- **Completed:** 2026-03-16T03:09:00Z
- **Tasks:** 2 of 3 complete (Task 3 is human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- poll-story edge function: JWT auth + ownership check, returns `{ status, storyId?, success }` for authenticated user only
- useStories hook: fetches user's stories on mount, Supabase realtime subscription for INSERT/UPDATE/DELETE, exposes `createStory()` via `generate-story` invocation
- StoryContext: React context wrapping useStories, consumed by HomeScreen via `useStoryContext()`
- HomeScreen: Transform/Create Story mode toggle; story mode shows character picker (completed sketches), theme TextInput, and "Generate Story (5 Credits)" button; `pollStoryStatus()` runs every 10s up to 72 attempts (12 min)
- App.tsx: StoryProvider wraps Tab.Navigator inside SketchProvider

## Task Commits

Each task was committed atomically:

1. **Task 1: poll-story edge function, useStories hook, StoryContext** - `3dc66c7` (feat)
2. **Task 2: HomeScreen story mode + App.tsx StoryProvider** - `d46fab1` (feat)

## Files Created/Modified
- `supabase/functions/poll-story/index.ts` - Story status polling endpoint (auth + ownership enforced)
- `src/hooks/useStories.ts` - Story CRUD hook with realtime subscription
- `src/contexts/StoryContext.tsx` - React context wrapping useStories
- `src/screens/HomeScreen.tsx` - Added story creation mode with character picker, theme input, polling
- `App.tsx` - Added StoryProvider around Tab.Navigator inside SketchProvider

## Decisions Made
- poll-story is a pure status read — no fal.ai calls, no generation. generate-story handles all async work
- Character picker filters to `status === 'completed' && animated_image_url !== null` — only truly transformed characters
- Mode toggle in HomeScreen (not a new screen) — avoids nav complexity for v2.0 MVP

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled cleanly on first pass.

## User Setup Required

Task 3 is a `checkpoint:human-verify` — deploy edge functions and verify the end-to-end flow:

```bash
supabase functions deploy generate-story poll-story
```

Then run the app (`npm run ios` or `npm run web`) and test the story creation flow.

## Next Phase Readiness
- Full story generation pipeline wired end-to-end
- Stories appear in `stories` table, pages in `story_pages`
- Phase 7 (Story Gallery UI) can read from StoryContext to display completed stories
- Checkpoint Task 3 pending human verification of live flow

---
*Phase: 06-story-generation-backend*
*Completed: 2026-03-16*
