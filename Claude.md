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