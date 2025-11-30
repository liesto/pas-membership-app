# Claude Instructions For the PAS Membership App

This will be a hosted web app that enables self-serve membership management for Pisgah Area SORBA.  It will use Clerk.dev for authentication/login.  It will use Stripe for payment processing.  It will be hosted at Netlify.  It will integrate with Salesforce.  It will be built in React.

The member-connect-hub folder/project pushes to https://github.com/liesto/member-connect-hub.

## Clerk.dev Authentication Setup

### Implementation Details

**Environment Variables:**
- `VITE_CLERK_PUBLISHABLE_KEY` - Set in `.env.local` (required for Vite to expose to client)

**Main Configuration:**
- `src/main.tsx` - Wrapped with `<ClerkProvider>` at the root level
- `afterSignOutUrl="/"` - Users are redirected to home after sign out

**Login Page (`src/pages/Login.tsx`):**
- Uses `useSignIn()` hook from `@clerk/clerk-react`
- Uses `useAuth()` hook to check authentication status
- Email and password authentication flow
- Error handling displays validation messages
- Loading state management during authentication
- On successful login, redirects to `/my-account`
- Handles edge cases where Clerk returns `needs_second_factor` status by allowing login without requiring additional verification

**Key Dependencies:**
- `@clerk/clerk-react@latest` - Official Clerk React SDK

### Important Notes

- Do NOT use `frontendApi` - only use `publishableKey`
- `<ClerkProvider>` must be in `main.tsx`, not deeper in the component tree
- Store real keys ONLY in `.env.local` - never commit them to git
- Ensure `.gitignore` includes `.env*` files

