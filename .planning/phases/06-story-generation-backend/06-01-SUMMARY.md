---
phase: 06-story-generation-backend
plan: 01
subsystem: database
tags: [supabase, postgres, rls, typescript, migrations]

# Dependency graph
requires: []
provides:
  - stories table with RLS in Supabase (user-scoped CRUD, service-role write for pages)
  - story_pages table with FK cascade from stories and RLS via parent ownership
  - TypeScript Story, StoryPage, StoryInsert, StoryPageInsert type aliases
affects:
  - 06-story-generation-backend (all subsequent plans read/write these tables)
  - 07-story-ui (reads stories and story_pages to render screens)
  - 08-videobook (may extend stories for video-per-page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS on join-owned tables: story_pages access controlled via EXISTS subquery on parent stories.user_id"
    - "Service-role bypass on INSERT/UPDATE for edge-function-written tables (story_pages)"

key-files:
  created:
    - supabase/migrations/20260315000001_create_stories_tables.sql
  modified:
    - src/integrations/supabase/types.ts

key-decisions:
  - "story_pages INSERT/UPDATE RLS uses WITH CHECK (true) — edge functions run as service role and must bypass user auth check"
  - "page_count stored on stories row (not derived) to avoid counting pages on every read"
  - "page_number constrained to 1-8 at DB level to match product max"

patterns-established:
  - "Parent-scoped RLS: child tables (story_pages) use EXISTS SELECT 1 FROM parent WHERE parent.id = child.fk AND parent.user_id = auth.uid()"
  - "Convenience type aliases (Story, StoryPage, StoryInsert, StoryPageInsert) exported alongside Database type in types.ts"

requirements-completed:
  - STORY-01
  - STORY-02
  - STORY-03
  - STORY-04
  - STORY-05
  - CHAR-01

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 6 Plan 01: Story Database Schema Summary

**stories and story_pages Supabase tables with RLS, FK cascade, indexes, and TypeScript types**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T02:55:00Z
- **Completed:** 2026-03-16T03:01:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `stories` table (user_id FK → profiles, sketch_id FK → sketches, theme, status CHECK, page_count) with full CRUD RLS policies scoped to auth.uid()
- Created `story_pages` table (story_id FK → stories CASCADE, page_number CHECK 1-8, text, illustration_url) with SELECT via parent ownership and service-role INSERT/UPDATE bypass
- Four indexes created: idx_stories_user_id, idx_stories_sketch_id, idx_story_pages_story_id, idx_story_pages_order
- Updated `src/integrations/supabase/types.ts` with full Row/Insert/Update types for both tables plus four convenience aliases
- Migration applied to remote Supabase without errors; TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Supabase migration for stories and story_pages tables** - `f6168ea` (feat)
2. **Task 2: Update TypeScript database types for stories and story_pages** - `6bc7556` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/migrations/20260315000001_create_stories_tables.sql` - DDL for stories + story_pages, indexes, RLS policies
- `src/integrations/supabase/types.ts` - Added stories/story_pages Table types and Story/StoryPage/StoryInsert/StoryPageInsert exports

## Decisions Made

- `story_pages` INSERT/UPDATE RLS uses `WITH CHECK (true)` — edge functions authenticate with the service role key and must bypass per-user auth checks when writing pages on behalf of any user
- `page_count` stored as a column on the `stories` row rather than derived at query time to avoid aggregation overhead on every gallery read
- `page_number` constrained to 1–8 at the DB level matching the product cap of 8 pages per story

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both tables exist in production Supabase with correct schema, FK constraints, indexes, and RLS
- TypeScript types are importable from `@/integrations/supabase/types` in the mobile app
- Edge function (plan 06-02) can now write to stories and story_pages using the service role key
- Mobile app (plan 06-03+) can query stories scoped to auth.uid() via the RLS policies

---
*Phase: 06-story-generation-backend*
*Completed: 2026-03-16*

## Self-Check: PASSED

- supabase/migrations/20260315000001_create_stories_tables.sql: FOUND
- src/integrations/supabase/types.ts: FOUND
- .planning/phases/06-story-generation-backend/06-01-SUMMARY.md: FOUND
- Commit f6168ea: FOUND
- Commit 6bc7556: FOUND
