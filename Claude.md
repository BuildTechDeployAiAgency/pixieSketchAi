# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixieSketch Mobile is a React Native (Expo) app that lets users photograph drawings and transform them into AI-generated art (images via OpenAI, videos via fal.ai). It uses Supabase for auth, database, storage, and edge functions, with a credit-based payment system through Stripe.

## Development Commands

```bash
npm install                          # Install dependencies
npm run start                        # Launch Expo dev server
npm run ios                          # iOS simulator
npm run android                      # Android emulator
npm run web                          # Web preview
npx expo-doctor                      # Validate environment
npx tsc --noEmit                     # Typecheck (no script in package.json)
```

### Supabase Edge Functions

```bash
supabase login                       # Authenticate CLI (once per machine)
supabase link --project-ref <ref>    # Link repo to hosted project
supabase functions serve <name>      # Local dev for a single function
supabase functions deploy <name>     # Deploy one function to linked project
supabase db push                     # Apply migrations
supabase secrets set KEY=value       # Set edge function secrets on hosted project
```

Deploy each function after linking, for example: `process-sketch`, `poll-video`, `poll-story`, `generate-story`, `analyze-drawing`, `create-payment`, `verify-payment`, `stripe-webhook`, `admin-operations`, `send-email`. See **Environment Variables** below for required secrets per feature.

No test runner is currently configured. There is no linter configured in package.json scripts.

## Architecture

### Tech Stack

- **Expo SDK 54** / React Native 0.81 / React 19 (New Architecture enabled)
- **NativeWind 4** (Tailwind CSS via `global.css` + `nativewind/babel` preset)
- **React Navigation 7** — native stack + bottom tabs
- **TanStack React Query** for server state
- **Supabase JS v2** with AsyncStorage for session persistence
- **expo-video** for video playback, **expo-image** for images
- **lucide-react-native** for icons
- **Zod** for validation

### Path Alias

`@/*` → `./src/*` (configured in `tsconfig.json`, resolved by Metro via babel)

### App Entry & Navigation

`index.ts` → `App.tsx` wraps the app in provider layers:

```
ErrorBoundary > SafeAreaProvider > NetworkProvider > QueryClientProvider > AuthProvider > NavigationContainer
```

Inside **MainTabs** only (authenticated app shell):

```
SketchProvider > StoryProvider > BottomTabNavigator
```

Navigation structure:
- **RootStack** (native stack, headerless): `Auth` | `MainTabs` | `PaymentSuccess` | `PaymentCanceled` | `PaymentHistory`
- **MainTabs** (bottom tabs): `Home` (Create) | `Gallery` | `Account`
- `MainTabs` is wrapped in `SketchProvider` and `StoryProvider` — sketches and stories are only loaded in the authenticated shell

Auth gating: `RootNavigator` checks `useAuth().session` — unauthenticated users see `AuthScreen`, authenticated users see `MainTabs`.

### State Management

Primary React Context providers, each with a co-located `useX()` hook:

| Context | File | Purpose |
|---------|------|---------|
| `AuthContext` | `src/contexts/AuthContext.tsx` | Supabase session, exposes `useAuth()` |
| `NetworkContext` | `src/contexts/NetworkContext.tsx` | Online/offline via `@react-native-community/netinfo` |
| `SketchContext` | `src/contexts/SketchContext.tsx` | All sketch CRUD + realtime, wraps `useSketches()` |
| `StoryContext` | `src/contexts/StoryContext.tsx` | Story generation flow, wraps `useStories()` |

### Sketch Management Hook Architecture

`useSketches()` orchestrates four sub-hooks:

| Hook | File | Responsibility |
|------|------|---------------|
| `useSketchState` | `src/hooks/sketch/useSketchState.ts` | State definitions, `Sketch` type, `convertToSketch()` |
| `useSketchOperations` | `src/hooks/sketch/useSketchOperations.ts` | CRUD: create, retry, delete, bulk delete, mark viewed |
| `useSketchSubscription` | `src/hooks/sketch/useSketchSubscription.ts` | Supabase realtime channel for INSERT/UPDATE/DELETE |
| `useSketchFetcher` | `src/hooks/sketch/useSketchFetcher.ts` | Initial fetch with retry (timeout code `57014`) |
| `useSketchTimeout` | `src/hooks/sketch/useSketchTimeout.ts` | Marks stuck "processing" sketches as failed |

All sub-hooks receive state setters via props — `useSketches` wires them together and exposes a flat API through `SketchContext`.

### Supabase Configuration

- Client: `src/integrations/supabase/client.ts` — uses `AsyncStorage` adapter, `detectSessionInUrl: false` (no deep-link auth)
- Types: `src/integrations/supabase/types.ts` — auto-generated database types
- Project ID: `uihnpebacpcndtkdizxd`

### Database Schema (`sketches` table)

Key columns: `id`, `user_id`, `name`, `original_image_url`, `animated_image_url`, `content_type` (image|video), `video_prompt`, `fal_request_id`, `status` (processing|completed|failed), `is_new`, `created_at`, `updated_at`.

RLS is enabled — queries are scoped to `user_id`.

### Edge Functions (Deno)

All functions use `supabase/functions/_shared/cors.ts` for CORS (allowed origins: localhost:8080, vercel app, pixiesketch.com).

| Function | Purpose |
|----------|---------|
| `process-sketch` | Main processing: validates auth/credits/rate-limit, then branches to **image** (OpenAI vision + DALL-E) or **video** (fal.ai submit). Uploads results to Supabase Storage. |
| `poll-video` | Client polls this to check fal.ai status. On COMPLETED: downloads video, uploads to Storage, updates sketch, deducts 2 credits. |
| `analyze-drawing` | OpenAI vision analysis of a drawing |
| `create-payment` | Creates Stripe checkout session |
| `stripe-webhook` | Handles Stripe webhook events, adds credits |
| `verify-payment` | Verifies payment session |
| `admin-operations` | Admin-only user management |
| `send-email` | Email sending (optional `EMAIL_API_KEY` / `EMAIL_SERVICE`) |
| `generate-story` | Creates story + pages from a sketch; OpenAI; deducts credits on success |
| `poll-story` | Client polls long-running story job status; updates DB when complete |

### Video Generation Pipeline

This is the most complex flow and the area most actively being debugged:

1. **HomeScreen** → user picks image + "Bring this to Life" preset + motion prompt mode
2. **process-sketch** edge function:
   - Generates motion prompt via OpenAI GPT-4o-mini (or uses custom prompt)
   - Submits image to **fal.ai** queue (`seedance/v1.5/pro/image-to-video`)
   - Saves `fal_request_id` to sketch row
   - Returns `{ videoSubmitted: true }` immediately
3. **HomeScreen** starts `pollVideoStatus()` — calls `poll-video` every 10s (max 60 attempts = 10min)
4. **poll-video** edge function:
   - Checks fal.ai status endpoint
   - On COMPLETED: fetches result (handles JSON + NDJSON), extracts video URL via recursive `findVideoUrl()`, downloads video, uploads to Supabase Storage, updates sketch to completed
5. **GalleryScreen** shows video via `expo-video` VideoView component

### Credit System

- Image transformation: 1 credit
- Video generation: 2 credits (deducted in `poll-video` on success, not upfront)
- Story generation: 5 credits (deducted in `generate-story` on success)
- Image credits deducted in `process-sketch` after successful generation
- Pricing: $1 (1 credit), $4.99 (10 credits), $9.99 (25 credits)

## Environment Variables

App-level (set in `.env` or Expo config; see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge function secrets (set via `supabase secrets set` on the **hosted** project — never embed service role or Stripe secrets in the app):

| Secret | Used by |
|--------|---------|
| `OPENAI_API_KEY` | `process-sketch`, `analyze-drawing`, `generate-story`, story/sketch flows |
| `FAL_KEY` | `process-sketch` (video queue), `poll-video` |
| `STRIPE_SECRET_KEY` | `create-payment`, `verify-payment`, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | All functions that use the service client (usually auto-set on Supabase) |
| `SUPABASE_ANON_KEY` | `create-payment`, `admin-operations` (JWT/admin flows) |
| `EMAIL_API_KEY`, `EMAIL_SERVICE` | `send-email` (optional) |

Remote deploy is manual: run `supabase link` once, set secrets, run `supabase functions deploy <name>` per function (or from CI with `SUPABASE_ACCESS_TOKEN`).

## EAS Build Profiles

Configured in `eas.json`:
- `development` — dev client, internal distribution, iOS simulator
- `preview` — internal distribution
- `production` — auto-increment version

## Git Conventions

Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, etc.

## Key Patterns

- Toast notifications via `react-native-toast-message` (wrapper in `src/hooks/use-toast.ts` adapts a web-style `toast()` API)
- Image upload flow: pick → resize to 1024w via `expo-image-manipulator` → read as base64 → upload raw bytes to Supabase Storage via `decode(base64)` from `base64-arraybuffer`
- Edge function error handling: `supabase.functions.invoke()` returns errors in `error.context` (a Response object) — must call `.json()` or `.text()` on it to get the actual error body
- Sketch retry: downloads original image from Storage, re-encodes to base64, re-invokes `process-sketch`
- `fal_request_id` is cleared (set to null) when a video completes or fails, so it serves as a "pending video" indicator
