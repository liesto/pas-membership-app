# PAS Membership App - Project Structure

## Overview

The PAS Membership App is a separate, custom development repository maintained for building the membership management platform for Pisgah Area SORBA. This repository is independent from the original Lovable.dev design codebase.

## Repository Separation

### PAS Membership App (This Repository)
- **Repository**: https://github.com/liesto/pas-membership-app
- **Purpose**: Custom development and feature implementation
- **Content**:
  - Clerk.dev authentication system
  - Password reset flows
  - Membership management features
  - Custom business logic
  - Netlify deployment configuration

### Member Connect Hub (Original Design)
- **Repository**: https://github.com/liesto/member-connect-hub
- **Purpose**: Original Lovable.dev UI design
- **Status**: Reference only - do not push custom code here
- **Use Case**: Pull design updates if needed, manually integrate

## Directory Structure

```
/Users/jbwmson/Agent/PAS Membership App/
├── src/
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── Login.tsx              # Login with Clerk
│   │   ├── CreateAccount.tsx      # Signup with Clerk
│   │   ├── ForgotPassword.tsx     # Password reset request
│   │   ├── VerifyResetCode.tsx    # Code entry for reset
│   │   ├── ResetPassword.tsx      # New password entry
│   │   ├── MyAccount.tsx          # User account page
│   │   ├── Signup.tsx             # Legacy signup
│   │   ├── Confirmation.tsx       # Email confirmation
│   │   └── NotFound.tsx           # 404 page
│   ├── components/
│   │   └── ui/                    # shadcn-ui components
│   ├── assets/
│   │   └── pisgah-logo.png
│   ├── App.tsx                    # Main app with routing
│   └── main.tsx                   # App entry point with ClerkProvider
├── Planning/
│   ├── clerk-integration.md       # Clerk feature documentation
│   ├── history.md                 # Development history
│   ├── Research.md                # Research notes
│   └── [other planning docs]
├── .env.local                     # Local environment (not tracked)
├── .gitignore                     # Git ignore rules
├── README.md                      # Project documentation
├── PROJECT_STRUCTURE.md           # This file
├── package.json                   # Dependencies
├── vite.config.ts                 # Vite configuration
└── [other config files]
```

## Key Technologies

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn-ui + Tailwind CSS
- **Authentication**: Clerk.dev (@clerk/clerk-react)
- **Routing**: React Router
- **Notifications**: Sonner (toast notifications)
- **API**: React Query (@tanstack/react-query)
- **Build Tool**: Vite

## Environment Variables

### Required for Development
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Required for Netlify Deployment
- Set `VITE_CLERK_PUBLISHABLE_KEY` in Netlify environment variables

## Development Workflow

1. Clone repository
2. Run `npm install`
3. Create `.env.local` with Clerk key
4. Run `npm run dev`
5. Make changes
6. Commit to `main` branch
7. Push to GitHub (Netlify auto-deploys)

## Integration Points

### With Lovable.dev
- Lovable hosts the original design project
- Manual design updates are pulled as needed
- Code changes in this repo should NOT go back to member-connect-hub

### With Clerk.dev
- Authentication system for all pages
- Password reset flow
- Session management
- User metadata (future enhancement)

### Future Integrations (Not Yet Implemented)
- Salesforce CRM for member data sync
- Stripe for payment processing
- Email service for transactional emails

## Important Notes

1. **Never commit secrets**: `.env.local` is in `.gitignore` for a reason
2. **Keep repos separate**: Do not mix Lovable updates with custom code
3. **Update member-connect-hub carefully**: Only pull design changes if needed
4. **All custom code stays in pas-membership-app**: This is the source of truth

## Moving Forward

When Lovable updates the design:
1. Review changes in member-connect-hub
2. Identify UI components that were updated
3. Manually cherry-pick components into pas-membership-app if needed
4. Test thoroughly before committing
5. Never auto-sync from member-connect-hub to avoid losing custom code

This structure ensures clean separation between design and custom development.
