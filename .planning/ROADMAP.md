# Roadmap: PixieSketchAI

## Milestones

- ✅ **v1.0 Core App** — Phases 1–5 (shipped 2026-03-15)
- 🚧 **v2.0 Storytelling** — Phases 6–8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Core App (Phases 1–5) — SHIPPED 2026-03-15</summary>

Phases 1–5 delivered: photo upload, gpt-image-1 transformation, fal.ai video animation, gallery management, Stripe credit payments, email auth, content safety filtering.

</details>

---

### 🚧 v2.0 Storytelling (In Progress)

**Milestone Goal:** Turn a user's transformed character into a full AI-generated storybook — multi-page, illustrated, exportable — with a premium Videobook upsell.

- [ ] **Phase 6: Story Generation Backend** — Edge function that produces story text + per-page illustrations with character consistency
- [ ] **Phase 7: Story Reader + PDF Export** — In-app page-by-page reader and downloadable PDF
- [ ] **Phase 8: Videobook** — Animated story pages with AI narration and in-app playback

## Phase Details

### Phase 6: Story Generation Backend
**Goal**: Users can submit a character and theme and receive a fully illustrated, multi-page AI story stored in Supabase
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: STORY-01, STORY-02, STORY-03, STORY-04, STORY-05, CHAR-01
**Success Criteria** (what must be TRUE):
  1. User can select a transformed character from their gallery and enter a story theme to trigger generation
  2. A 5–8 page story is returned with unique per-page illustration, each depicting the same character appearance
  3. Story generation costs exactly 5 credits, deducted only after successful generation
  4. Story data (text + illustration URLs) is persisted to Supabase and scoped to the user
**Plans**: TBD

### Phase 7: Story Reader + PDF Export
**Goal**: Users can read their generated story page-by-page inside the app and export it as a shareable PDF
**Depends on**: Phase 6
**Requirements**: STORY-06, EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):
  1. User can open any story from the gallery and navigate through pages one at a time with text and illustration visible
  2. User can tap "Export PDF" and receive a PDF file containing all story pages with illustrations
  3. User can share or save the PDF to their device from the native share sheet
**Plans**: TBD

### Phase 8: Videobook
**Goal**: Users can convert a completed story into a premium animated Videobook with AI narration and play it inside the app
**Depends on**: Phase 7
**Requirements**: VID-01, VID-02, VID-03
**Success Criteria** (what must be TRUE):
  1. User can initiate a Videobook conversion from a completed story and see a clear 10-credit cost before confirming
  2. Each story page animates as a short video clip accompanied by AI-generated narration
  3. User can play the Videobook from start to finish inside the app without leaving to an external player
  4. Videobook costs exactly 10 credits, deducted only after successful generation
**Plans**: TBD

## Progress

**Execution Order:** 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–5. Core App | v1.0 | — | Complete | 2026-03-15 |
| 6. Story Generation Backend | v2.0 | 0/? | Not started | - |
| 7. Story Reader + PDF Export | v2.0 | 0/? | Not started | - |
| 8. Videobook | v2.0 | 0/? | Not started | - |
