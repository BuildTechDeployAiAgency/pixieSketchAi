# Repository Guidelines

## Project Structure & Module Organization
- `App.tsx` wires Expo navigation and global providers, while `src/` hosts feature code (`components/`, `screens/`, `hooks/`, `contexts/`, `lib/`, and `integrations/`). Keep shared UI or logic inside these directories so it can be tree-shaken by Metro.
- Static assets and fonts belong in `assets/`; update `app.json` when adding new files so bundling metadata stays accurate.
- Backend artefacts live in `supabase/` (`functions/`, `migrations/`, policy SQL, and `config.toml`). Use this folder exclusively for Supabase CLI workflows to keep deployable artefacts versioned.
- Reference system docs under `documentation/` and publishable bundles under `dist/` only after running an Expo export or CI build.

## Build, Test, and Development Commands
- `npm install` – install JS dependencies and sync Expo/NativeWind tooling.
- `npm run start` – launch Expo dev server; use `npm run android`, `npm run ios`, or `npm run web` for device-specific previews.
- `npx expo-doctor` – validate environment parity before shipping native changes.
- Supabase: run `npx supabase start` to spin up local services, `npx supabase db push` for schema changes, and `npx supabase functions serve <name>` when iterating on Edge Functions.

## Coding Style & Naming Conventions
- TypeScript + React function components with hooks; prefer `useSomething.ts` naming for hooks and PascalCase for components/screens.
- Indent with two spaces, keep imports sorted from external → `@/` aliases (see `tsconfig.json` paths), then relative modules.
- Favor NativeWind utility classes in JSX over inline styles; place shared helpers in `src/lib/` or `src/components/utils.ts`.
- Keep files cohesive (~200 lines); split large flows into smaller components under `src/components/`.

## Testing Guidelines
- Automated tests are not yet wired up; when adding them, prefer React Native Testing Library for UI and colocate files as `<Component>.test.tsx` under the same folder.
- Exercise Supabase routines with `supabase tests run` or SQL fixtures before promoting migrations. Until Jest is introduced, document manual QA steps inside PR descriptions and capture Expo screenshots or screen recordings.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.) as seen in the git history to keep changelog automation viable.
- Each PR should describe scope, testing evidence (commands run, simulators used), and any Supabase migrations involved. Link Linear/Jira/GitHub issues and include screenshots or recordings for UI tweaks.
- Rebase before requesting review, ensure CI/Expo Doctor are clean, and double-check that secrets remain outside version control (use `.env` with `supabase/config.toml` references).

## Security & Configuration Tips
- Never hardcode Supabase keys or payment endpoints; load them through Expo config plugins or secure environment variables.
- When editing Edge Functions, keep SQL policies in `supabase/*.sql` synchronized with `rls-policies.sql`, and regenerate service roles via Supabase CLI before deploying.
