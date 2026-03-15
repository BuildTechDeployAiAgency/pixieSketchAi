# Requirements: PixieSketchAI

**Defined:** 2026-03-15
**Core Value:** A child's drawing becomes a living, styled character — faithfully transformed, not replaced.

## v1 Requirements (Shipped — Milestone v1.0)

### Transformation
- ✓ **TRANS-01**: User can photograph or upload a drawing
- ✓ **TRANS-02**: User can transform drawing into Cartoon, Pixar, or Storybook style
- ✓ **TRANS-03**: Transformation uses gpt-image-1 (faithful to original drawing)
- ✓ **TRANS-04**: Content safety check runs before transformation

### Video
- ✓ **VIDEO-01**: User can animate a drawing as a short video ("Bring to Life")
- ✓ **VIDEO-02**: Video costs 2 credits, deducted on success

### Gallery
- ✓ **GALL-01**: User can view all created sketches and videos
- ✓ **GALL-02**: User can delete sketches

### Payments
- ✓ **PAY-01**: User can buy credits via Stripe Checkout (1, 10, 25 packs)
- ✓ **PAY-02**: Payment returns to app via deep link after checkout

### Auth
- ✓ **AUTH-01**: User can sign up and sign in with email

---

## v2 Requirements (Active — Milestone v2.0 Storytelling)

### Story Generation
- [ ] **STORY-01**: User can select a transformed character from their gallery to start a story
- [ ] **STORY-02**: User can enter a story theme/prompt (e.g. "goes on a space adventure")
- [ ] **STORY-03**: AI generates a 5–8 page story with text tailored to the character
- [ ] **STORY-04**: AI generates a unique illustration for each page, consistent with the character
- [ ] **STORY-05**: Story generation costs 5 credits (flat fee, deducted on success)
- [ ] **STORY-06**: User can read the generated story page-by-page in an in-app reader

### Export
- [ ] **EXPORT-01**: User can export their story as a PDF
- [ ] **EXPORT-02**: User can download/share the PDF from their device

### Videobook
- [ ] **VID-01**: User can convert a story into a Videobook (animated pages + AI narration)
- [ ] **VID-02**: Videobook costs 10 credits (premium upsell, deducted on success)
- [ ] **VID-03**: User can play the Videobook inside the app

### Character Consistency
- [ ] **CHAR-01**: Story illustrations maintain the character's appearance across all pages

---

## Future Requirements (v3+)

- Physical hardcover printing ($24.99 + shipping)
- Multi-language story generation
- Community gallery (share stories publicly)
- Spelling/vocabulary word weaving (educational mode)
- Grade-level targeting (K–5)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Subscription model | Credit-based only — no churn, validated by LoveToRead model |
| Web app | Mobile-first |
| Story from scratch (no drawing) | Core value is the user's own drawing as the character |
| Share link (public URL) | Deferred — PDF covers sharing for v2.0 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STORY-01 | Phase 6 | Pending |
| STORY-02 | Phase 6 | Pending |
| STORY-03 | Phase 6 | Pending |
| STORY-04 | Phase 6 | Pending |
| STORY-05 | Phase 6 | Pending |
| STORY-06 | Phase 7 | Pending |
| EXPORT-01 | Phase 7 | Pending |
| EXPORT-02 | Phase 7 | Pending |
| CHAR-01 | Phase 6 | Pending |
| VID-01 | Phase 8 | Pending |
| VID-02 | Phase 8 | Pending |
| VID-03 | Phase 8 | Pending |

**Coverage:**
- v2 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after milestone v2.0 kickoff*
