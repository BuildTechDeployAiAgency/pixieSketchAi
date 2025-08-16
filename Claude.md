# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixieSketch is a family-friendly AI drawing transformation app built with React, TypeScript, and Supabase. Users upload drawings and transform them into various AI-generated art styles using a credit-based system.

## Essential Commands

### Development

```bash
# Install dependencies
npm i

# Start development server (localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Supabase Operations

```bash
# Start local Supabase (if configured)
supabase start

# Apply database migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Architecture Overview

### Frontend Structure

- **React 18** with TypeScript and Vite
- **shadcn/ui** components built on Radix UI primitives
- **TailwindCSS** for styling with custom animations
- **React Router** for client-side routing
- **React Query** for server state management

### Backend (Supabase)

- **PostgreSQL** database with Row Level Security (RLS)
- **Authentication** with email/password and Google OAuth
- **Storage** for user-uploaded images
- **Edge Functions** for AI processing and payment handling
- **Real-time subscriptions** for live updates

### Key Database Tables

- `profiles`: User data with credit balance
- `sketches`: Uploaded drawings and AI transformations
- `payment_history`: Stripe payment records

## Important Implementation Details

### Credit System

- Users start with 10 free credits
- Credit deduction happens server-side via Supabase functions
- Real-time credit balance updates using Supabase subscriptions
- Pricing: $1 (1 credit), $4.99 (10 credits), $9.99 (25 credits)

### Authentication Flow

- Email/password or Google OAuth via Supabase Auth
- Auto-profile creation with starting credits
- Admin access restricted to `diogo@diogoppedro.com`

### File Upload & Processing

- 50MB file size limit, image types only
- Base64 encoding for API calls to Edge Functions
- Multiple AI preset styles available
- Real-time status updates (processing → completed/failed)

### Admin Dashboard

- Hard-coded admin email: `diogo@diogoppedro.com`
- User management, credit adjustment, password resets
- Payment history monitoring
- Protected route using `useAdminAuth` hook

## Key Custom Hooks

### `useUserProfile`

Manages user profile data and real-time credit balance updates.

```typescript
const { profile, loading, updateProfile } = useUserProfile();
```

### `useSketches`

Comprehensive sketch management with real-time status updates.

```typescript
const { sketches, uploadSketch, retrySketch, deleteSketch } = useSketches();
```

### `useAdminAuth`

Admin authentication and authorization.

```typescript
const { isAdmin, isLoading } = useAdminAuth();
```

## Component Architecture

### Main Pages

- `Index.tsx`: Dual-mode interface (upload/gallery)
- `AdminDashboard.tsx`: Admin panel with user management
- Payment flow pages: success/canceled/history

### Key Components

- `FileUpload.tsx`: Handles file uploads and AI preset selection
- `AuthSection.tsx`: Authentication UI with COPPA compliance
- `CreditBalance.tsx`: Real-time credit display
- `SketchGallery/`: Gallery with real-time updates and retry functionality
- `PaymentModal.tsx`: Stripe checkout integration

## Real-time Features

The app uses Supabase real-time subscriptions for:

- Credit balance updates
- Sketch status changes (processing → completed/failed)
- New sketch notifications
- Admin dashboard statistics

## Testing & Validation

Currently using:

- ESLint for code linting
- TypeScript for type checking
- Manual testing for features

## Security Considerations

- Row Level Security (RLS) policies on all database tables
- Admin operations secured via email-based access control
- File upload validation and size limits
- Secure handling of Stripe webhooks
- Environment variables for sensitive configuration

## Environment Setup

Required environment variables:

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- Supabase Edge Functions need Stripe and OpenAI API keys

## Error Handling Patterns

- Comprehensive error boundaries for React components
- Toast notifications for user feedback via Sonner
- Loading states with skeleton components
- Timeout handling for AI processing (10-minute limit)
- Retry mechanisms for failed operations

## Code Style Guidelines

- Use TypeScript strictly - no `any` types
- Functional components with hooks over class components
- Custom hooks for complex state logic
- shadcn/ui components for consistent UI
- Tailwind CSS classes for styling
- Real-time data synchronization patterns
- Optimistic UI updates where appropriate

## Payment Integration

- Stripe checkout sessions via `create-payment` Edge Function
- Webhook handling via `stripe-webhook` Edge Function
- Payment history tracking in database
- Automatic credit addition upon successful payment

## Deployment

The project is designed for flexible deployment on multiple platforms:

- **Vercel**: Automatic deployment from GitHub repository with `npm run build`
- **Netlify**: Static site hosting with build command `npm run build` and publish directory `dist`
- **Manual**: Production builds via `npm run build`, serve `dist` folder
- Custom domain support available on most hosting platforms

# CLAUDE.md

## Implementation Best Practices

### 0 — Purpose

These rules ensure maintainability, safety, and developer velocity.
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs
  ```ts
  type UserId = Brand<string, "UserId">; // ✅ Good
  type UserId = string; // ❌ Bad
  ```
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required.
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.spec.ts` in same directory as source file.
- **T-2 (MUST)** For any API change, add/extend integration tests in `packages/api/test/*.spec.ts`.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from DB-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible

  ```ts
  expect(result).toBe([value]); // Good

  expect(result).toHaveLength(1); // Bad
  expect(result[0]).toBe(value); // Bad
  ```

---

### 4 — Database

- **D-1 (MUST)** Type DB helpers as `KyselyDatabase | Transaction<Database>`, so it works for both transactions and DB instances.
- **D-2 (SHOULD)** Override incorrect generated types in `packages/shared/src/db-types.override.ts`. e.g. autogenerated types show incorrect BigInt value – so we override to `string` manually.

---

### 5 — Code Organization

- **O-1 (MUST)** Place code in `packages/shared` only if used by ≥ 2 packages.

---

### 6 — Tooling Gates

- **G-1 (MUST)** `prettier --check` passes.
- **G-2 (MUST)** `turbo typecheck lint` passes.

---

### 7 - Git

- **GH-1 (MUST**) Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT**) Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. sql queries, redis, etc.)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:

- the refactored function is used in more than one place
- the refactored function is easily unit testable while the original function is not AND you can't test it any other way
- the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don’t align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function’s output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical. Use `fast-check` library e.g.

```
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { getCharacterCount } from './string';

describe('properties', () => {
  test('concatenation functoriality', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (a, b) =>
          getCharacterCount(a + b) ===
          getCharacterCount(a) + getCharacterCount(b)
      )
    );
  });
});
```

7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by the type checker.

## Code Organization

- `packages/api` - Fastify API server
  - `packages/api/src/publisher/*.ts` - Specific implementations of publishing to social media platforms
- `packages/web` - Next.js 15 app with App Router
- `packages/shared` - Shared types and utilities
  - `packages/shared/social.ts` - Character size and media validations for social media platforms
- `packages/api-schema` - API contract schemas using TypeBox

## Remember Shortcuts

Remember the following shortcuts which the user may invoke at any time.

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in CLAUDE.md.
Your code SHOULD ALWAYS follow these best practices.
```

### QPLAN

When I type "qplan", this means:

```
Analyze similar parts of the codebase and determine whether your plan:
- is consistent with rest of codebase
- introduces minimal changes
- reuses existing code
```

## QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
Always run `prettier` on the newly created files to ensure standard formatting.
Always run `turbo typecheck lint` to make sure type checking and linting passes.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
2. CLAUDE.md checklist Writing Tests Best Practices.
3. CLAUDE.md checklist Implementation Best Practices.
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Tests Best Practices.
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the feature you implemented.
Output a comprehensive list of scenarios you would test, sorted by highest priority.
```

### QGIT

When I type "qgit", this means:

````
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
- commit SHOULD contain the following structural elements to communicate intent:
fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this Project.

## Standard Workflow

1. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or
   complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo file with a summary of the changes you made and any other
   relevant information.

## Development Commands

```bash
# Start development server (client + server on port 5000)
npm run dev

# Database operations
npm run db:push        # Push schema changes to database

# Build and production
npm run build          # Build for production
npm run start          # Start production server
npm run check          # TypeScript type checking

# Database utilities (via Node.js scripts)
node scripts/reset-database.mjs        # Reset and recreate database
node scripts/insert-sample-data.mjs    # Insert sample data
node scripts/reset-passwords-esm.js    # Reset user passwords
````

## Architecture Overview

**DistributorHub** is a full-stack TypeScript application for inventory and order management with role-based access control.

### Tech Stack

- **Frontend**: React 18 + Vite + Wouter (routing) + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + Drizzle ORM + PostgreSQL (Neon)
- **Authentication**: Passport.js with session-based auth
- **Real-time**: WebSocket integration for live updates

### Project Structure

- `client/` - React frontend with component-based architecture organized by feature
- `server/` - Express API with authentication, database operations, and real-time features
- `shared/schema.ts` - Drizzle database schema definitions shared between client/server

### Key Architecture Patterns

**Frontend**:

- Feature-based component organization (`components/dashboard/`, `components/orders/`, etc.)
- React Context for global state management
- Custom hooks for data fetching and business logic
- Route protection based on user authentication and roles

**Backend**:

- RESTful API design with proper HTTP methods
- Database operations centralized in `storage.ts`
- Session-based authentication with role-based access control
- Real-time WebSocket connections for live updates

**Database**:

- Users with roles (admin, inventory_manager, sales_manager, delivery_personnel, customer)
- Stocks (inventory items) with SKU and pricing
- Orders with JSON-based item storage
- Deliveries with carrier tracking
- Alerts system for notifications

### User Roles & Permissions

The system has a sophisticated role-based access control system. Always check user permissions when adding new features:

- **admin**: Full system access including user management
- **inventory_manager**: Stock management and reporting
- **sales_manager**: Order processing and customer management
- **delivery_personnel**: Delivery tracking and updates
- **customer**: Order placement and tracking

### Development Notes

- Database automatically seeds with sample data on server startup
- Authentication state is managed via session cookies
- Real-time features use WebSocket for instant updates
- All database interactions use Drizzle ORM with full type safety
- Components use shadcn/ui for consistent design system

## Additional Development Information

### Path Aliases

- `@/` maps to `client/src/`
- `@shared` maps to `shared/`
- `@assets` maps to `attached_assets/`

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (if using Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (if using Supabase)
- `NODE_ENV` - Environment mode (development/production)

### Database Configuration

- Uses PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- Database operations centralized in `server/storage.ts`
- Migration files output to `./migrations/`
- Requires `DATABASE_URL` environment variable

### Authentication System

- Session-based authentication using Passport.js with PostgreSQL session store
- Password hashing with bcrypt (10 salt rounds)
- Role-based access control with detailed permissions per role
- User sessions stored in PostgreSQL for persistence

### API Structure

- RESTful API with Express.js
- Request logging middleware for `/api` routes (logs requests > 80 chars truncated)
- Error handling middleware with proper HTTP status codes
- Authentication middleware protecting routes based on user roles

### Frontend Architecture

- React 18 with TypeScript and strict type checking
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching
- shadcn/ui component library with Tailwind CSS v4
- React Context providers for global state:
  - Authentication (`AuthProvider`)
  - WebSocket connections (`WebSocketProvider`)
  - Alert system (`AlertProvider`)
  - Tooltips (`TooltipProvider`)

### Key Development Patterns

- Feature-based component organization in `client/src/components/`
- Protected routes using `ProtectedRoute` component with role checking
- Custom hooks for data fetching and business logic
- Shared TypeScript types between client and server via `shared/schema.ts`
- Real-time updates via WebSocket integration
- Centralized error handling and user notifications via toast system

### File Structure Notes

- `server/index.ts` - Main server entry point with middleware setup
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database operations layer
- `server/auth.ts` - Authentication configuration
- `server/seed.ts` - Database seeding logic
- `client/src/main.tsx` - React application entry point
- `client/src/App.tsx` - Main React component with routing
- `shared/schema.ts` - Drizzle schema definitions and Zod validation schemas

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
