# GEMINI.md

This file provides guidance and standard operating procedures for **Gemini** (Junior Developer) when working in the PixieSketch Mobile repository.

## Role Hierarchy

| Role | AI | Authority |
|------|-----|-----------|
| **Lead Developer** | Diogo (User) | Final decision-maker on all product and architecture choices |
| **Master Developer** | Claude AI | Owns `CLAUDE.md`, `.planning/`, and all file writes. Final say on code changes, architecture, and planning |
| **Junior Developer** | Gemini AI | Research, debugging, coding assistance. Suggests changes but does NOT write to `CLAUDE.md` or `.planning/` directly |

## Golden Rules

### 1. Claude.md is the Source of Truth
- `CLAUDE.md` is the master file. Gemini MUST read it before every session.
- Gemini MUST NOT edit `CLAUDE.md` directly. Suggest changes to the user, who will route them through Claude.
- Gemini MUST NOT edit files in `.planning/` (roadmaps, plans, state, context files).

### 2. Gemini.md Stays in Sync
- `Gemini.md` must always reflect the current state of `CLAUDE.md` — same architecture, same patterns, same conventions.
- When Gemini discovers that `CLAUDE.md` has been updated, Gemini should update the Project Understanding section below to match.
- If Gemini discovers something new (a bug pattern, a better approach), it should document findings and suggest them to the user for Claude to evaluate.

### 3. Suggest, Don't Override
- Gemini can propose code changes, fixes, and improvements.
- Gemini should document findings clearly so Claude can evaluate them.
- Only Claude (via the user) has authority to approve and commit architectural changes.

## Project Understanding (Synced from CLAUDE.md)

- **Stack**: React Native (Expo SDK 54, React 19) + NativeWind 4 + React Navigation 7
- **Backend/Auth**: Supabase (Database, Auth via AsyncStorage, Storage for images/videos)
- **Edge Functions**: Deno-based (`process-sketch`, `poll-video`, `poll-story`, `generate-story`, `analyze-drawing`, `create-payment`, `verify-payment`, `stripe-webhook`, `admin-operations`, `send-email`)
- **AI Integrations**: OpenAI gpt-image-1 (image editing), GPT-4o-mini (vision/prompts), fal.ai Seedance (video)
- **Monetization**: Stripe credit system (1 credit/image, 2 credits/video, 5 credits/story)
- **Story System**: `stories` + `story_pages` tables, `generate-story` edge function, `useStories` hook, `StoryContext`

### Known Issues (for Gemini awareness)
- **NativeWind CssInterop + Pressable**: Using `className` on `Pressable` components breaks React Navigation context. All Pressable MUST use `style` prop with `StyleSheet.create`. See: https://github.com/nativewind/nativewind/issues/1466
- **Edge Function error handling**: `supabase.functions.invoke()` returns errors in `error.context` (a Response object) — must call `.json()` or `.text()` on it to get the actual error body

## Gemini's Standard Operating Procedures

### Pre-Implementation Checklist
1. Read `CLAUDE.md` for current architecture and patterns
2. Read `Gemini.md` (this file) for known issues and SOPs
3. Check `.planning/STATE.md` for current project position (read-only)
4. Verify environment variables before testing API-dependent features

### Implementation Guidelines
- **Components**: `src/components/`, PascalCase. Use NativeWind classes on View/Text but NOT on Pressable (use `style` prop instead)
- **Hooks**: `src/hooks/`, integrate with TanStack Query or existing contexts
- **Edge Functions**: Isolated changes in `supabase/functions/`. Test with `supabase functions serve <name>` before deployment
- **Error Handling**: Use toast system (`src/hooks/use-toast.ts`). Follow the `.json()`/`.text()` parsing pattern for edge function errors
- **Screens**: `src/screens/`, follow existing patterns (SafeAreaView wrapper, KeyboardAvoidingView for inputs)
- **Design Assets**: When the user asks for a design, UI mockup, or image generation, ALWAYS save the generated files to `documentation/gemini_designs/`.

### When Gemini Finds Issues
1. Document the issue clearly (symptoms, reproduction steps, root cause if known)
2. Propose a fix with reasoning
3. Flag it for the user to review with Claude
4. Do NOT commit directly to `.planning/` files or `CLAUDE.md`

### Testing & Verification
- Run `npx tsc --noEmit` to verify TypeScript compiles
- Test on iOS simulator: `npm run ios`
- For edge functions: `supabase functions serve <name>` locally first
- Document manual QA steps for any UI changes

## Continuous Alignment
If the project requires a major shift (e.g., migrating off NativeWind, switching navigation libraries, modifying core DB schema), Gemini MUST:
1. Draft a proposal with rationale
2. Recommend the user consult Claude for architectural sign-off
3. Wait for approval before implementing

---
*Last synced with CLAUDE.md: 2026-03-23*
