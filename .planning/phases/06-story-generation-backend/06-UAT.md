---
status: testing
phase: 06-story-generation-backend
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, documentation/gemini_designs/home_screen_redesign_plan_v2.md]
started: 2026-03-19T16:15:00Z
updated: 2026-03-19T16:15:00Z
---

## Current Test

number: 1
name: Story Generation End-to-End
expected: |
  Select a transformed character in story mode, enter a theme, tap "Generate Story". Spinner shows "Generating your story...". Within 3-5 minutes, a success toast appears and you're navigated to Gallery. Story completes with status=completed (not stuck at processing).
awaiting: user response

## Tests

### 1. Story Generation End-to-End
expected: Select a transformed character, enter a theme, tap "Generate Story". Spinner shows "Generating your story...". Within 3-5 minutes, story completes (success toast, navigate to Gallery). Story is NOT stuck at "processing" forever.
result: [pending]

### 2. Credits Deducted on Success
expected: After a story completes successfully, your credit balance decreases by exactly 5. No credits deducted if story fails.
result: [pending]

### 3. Story Pages Created
expected: A completed story has 5 pages, each with text (2-3 sentences) and an illustration image. Check Gallery or database — all 5 pages should exist.
result: [pending]

### 4. Segmented Toggle (Transform / Create Story)
expected: The mode toggle is a prominent segmented control — active tab is a solid purple pill with white text and drop shadow. Large enough to be obvious primary navigation.
result: [pending]

### 5. Generate Story Button Alignment
expected: The "Generate Story" button has perfectly centered icon + text. During generation, the spinner + "Generating your story..." text are also centered. No clipping, no misalignment.
result: [pending]

### 6. Choose Your Drawing Cards
expected: Gallery and Camera cards are rounded-square with icon containers, bold titles, and descriptive mini-labels ("Upload from photos" / "Take a new photo"). Drop shadows instead of flat borders.
result: [pending]

### 7. How It Works Section
expected: Steps shown inside a premium card with a purple "How it works" badge at top. Step numbers are solid purple circles with white text — not light/faded.
result: [pending]

### 8. Choose a Style Cards + Video Badge
expected: Style options show concise labels ("Cartoon", "Pixar Character", "Bring to Life") with circular icon containers. The VIDEO indicator is a small golden pill badge on the right — not a full-width yellow bar.
result: [pending]

### 9. Pick a Character Cards (Story Mode)
expected: Character thumbnails have white background cards with subtle shadow. Selected character has a purple border and a floating checkmark badge with shadow (inset from the corner, not crammed to the edge).
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0

## Gaps

[none yet]
