# Claude Instructions For the PAS Membership App

This is the primary development repository for the PAS Membership App - a hosted web app that enables self-serve membership management for Pisgah Area SORBA. It will use Clerk.dev for authentication/login, Stripe for payment processing, Netlify for hosting, Salesforce for data integration, and is built in React.

## Repository Structure

### PAS Membership App (Current Repository)
- **Repository**: https://github.com/liesto/pas-membership-app
- **Purpose**: Primary development and feature implementation
- **Deployment**: Netlify
- **Push to**: `pas-membership-app` repository

### Member Connect Hub (Design Reference Only)
- **Repository**: https://github.com/liesto/member-connect-hub
- **Purpose**: Original Lovable.dev design (reference only, DO NOT push custom code here)
- **Status**: Clerk authentication has been removed to avoid dependency conflicts
- **Use Case**: Pull design updates if needed, manually integrate into pas-membership-app

## What to Push Where

### Push to `pas-membership-app` (THIS REPOSITORY)
✅ **DO PUSH**:
- All Clerk authentication pages and logic
- Custom business logic and features
- Membership management functionality
- Database integrations (Salesforce, Stripe)
- Environment variables (`.env.local` - not tracked by git)
- All custom components and pages
- State management code
- API integration code
- Testing code

### DO NOT Push to `pas-membership-app`
❌ **DO NOT PUSH**:
- Design files or UI mockups only (use member-connect-hub for that)
- Lovable.dev generated code that hasn't been customized
- Code from member-connect-hub without adaptation

### DO NOT Push to `member-connect-hub`
❌ **NEVER PUSH** to member-connect-hub:
- Clerk authentication code or configuration
- Custom business logic
- Environment variables or secrets
- Any code from pas-membership-app
- Deployment-specific configuration

### Design Update Workflow
When Lovable.dev updates the design in member-connect-hub:
1. Review the changes in member-connect-hub
2. Identify UI components that were updated
3. Manually cherry-pick components into pas-membership-app if needed
4. Test thoroughly in pas-membership-app
5. DO NOT sync automatically between repos

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

