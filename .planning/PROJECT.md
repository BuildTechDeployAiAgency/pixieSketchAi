# PixieSketchAI

## What This Is

PixieSketch is a React Native (Expo) mobile app that lets users photograph their drawings and transform them into AI-generated art. Users can turn any sketch into a cartoon, Pixar-style character, or storybook illustration — and animate it as a short video. It uses a credit-based payment system (Stripe) and runs on Supabase + OpenAI + fal.ai.

## Core Value

A child's drawing becomes a living, styled character — faithfully transformed, not replaced.

## Requirements

### Validated (Milestone v1.0 — Core App)

- ✓ User can photograph or upload a drawing — v1.0
- ✓ User can transform drawing into Cartoon, Pixar, or Storybook illustration style — v1.0
- ✓ User can animate drawing as a short video ("Bring to Life") — v1.0
- ✓ User can view gallery of all created sketches and videos — v1.0
- ✓ User can buy credits via Stripe Checkout (1, 10, 25 credit packs) — v1.0
- ✓ User can sign in / sign up with email — v1.0
- ✓ Image transformation uses gpt-image-1 (direct image editing, faithful to original) — v1.0
- ✓ Content safety check runs before any transformation — v1.0

### Active (Milestone v2.0 — Storytelling)

- [ ] User can generate a multi-page AI storybook from their transformed character
- [ ] User can export / share storybook as PDF or in-app reader
- [ ] User can create a Videobook (animated pages + narration) as premium upsell

### Out of Scope

- Subscription model — credit-based only, no churn friction
- Web app — mobile-first
- Multi-language stories — English only for v2.0
- Physical hardcover printing — future milestone

## Context

- **Stack**: Expo SDK 54 / React Native 0.81, NativeWind 4, React Navigation 7, Supabase JS v2, TanStack Query
- **Edge Functions**: Deno, deployed to Supabase. Key functions: process-sketch, poll-video, create-payment, stripe-webhook, verify-payment
- **AI**: OpenAI gpt-image-1 (image editing), GPT-4o-mini (vision/prompts), DALL-E 3 (fallback), fal.ai Seedance (video)
- **Payments**: Stripe Checkout via in-app browser (expo-web-browser openAuthSessionAsync), deep link return
- **Credits**: Image = 1 credit, Video = 2 credits. Deducted after successful generation.
- **Inspiration**: LoveToRead.ai — studied for storytelling, character consistency, videobook, and credit-based monetization patterns

## Constraints

- **Mobile-first**: All features must work on iOS and Android via Expo
- **Edge Functions**: All AI processing happens server-side in Deno edge functions
- **EAS Build required**: Apple Pay and any native modules need a proper build (not Expo Go)
- **Credit economics**: New features must map to clear credit costs to sustain API costs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| gpt-image-1 for image transformation | Direct image editing preserves original subject; DALL-E 3 text-to-image was generating random outputs | ✓ Good |
| expo-web-browser openAuthSessionAsync for payments | Stripe redirect back to app failed with Linking.openURL (Safari); in-app browser intercepts deep link | ✓ Good |
| fal.ai Seedance for video | Best image-to-video quality for the use case | — Pending |
| Credit-based pricing (no subscription) | Low friction, no churn, matches LoveToRead.ai validated model | — Pending |

---
*Last updated: 2026-03-15 — Milestone v2.0 Storytelling started*
