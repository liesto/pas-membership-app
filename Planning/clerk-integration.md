# Clerk.dev Integration - Business Requirements

## Overview
Clerk.dev is integrated into the PAS Membership App to handle user authentication and account management for membership registration and login.

## Configuration

### Environment Setup
- **Environment Variable**: `VITE_CLERK_PUBLISHABLE_KEY` stored in `.env.local`
- **Provider**: `<ClerkProvider>` wraps the entire application in `src/main.tsx`
- **Sign Out URL**: Users are redirected to `/` after sign out

### Clerk Dashboard Settings
- **Email Verification at Sign-up**: Disabled (to allow immediate account creation and login)
- **Password Requirements**: Standard Clerk defaults
- **Session Timeout**: Standard Clerk defaults

## Login Page (`src/pages/Login.tsx`)

### Functionality
- Users enter email address and password
- System authenticates credentials against Clerk
- On success: User is logged in and redirected to `/my-account`
- On error: Error message displayed on the form

### User Experience
- Email and password input fields
- "Remember Me" checkbox (currently not integrated with backend)
- Password reset and sign-up links
- Loading state shown while authentication is in progress
- Error messages displayed inline on form for failed login attempts

### Technical Details
- Uses `useSignIn()` hook from `@clerk/clerk-react`
- Handles `needs_second_factor` status (allows login without 2FA verification if not required)
- Automatic session management via `setActive()`
- Console logging for debugging authentication flow

## Create Account Page (`src/pages/CreateAccount.tsx`)

### Required Fields for Account Creation
- **First Name** - Required
- **Last Name** - Required
- **Email Address** - Required
- **Password** - Required
- **Confirm Password** - Required (must match password)

### Optional Fields (Not Yet Integrated)
- Phone number
- City
- State
- reCAPTCHA verification

### Functionality
- Users enter required information (first name, last name, email, password)
- System creates a new user account in Clerk with provided credentials
- On success: User is logged in automatically and redirected to `/my-account`
- On error: Error message displayed on the form

### User Experience
- Inline error messages for validation failures
- Loading state shown while account is being created
- Button text changes to "Creating Account..." during submission
- Form inputs are disabled while account creation is in progress
- Toast notifications for success/error feedback

### Technical Details
- Uses `useSignUp()` hook from `@clerk/clerk-react`
- Creates user with: emailAddress, password, firstName, lastName
- Handles `missing_requirements` status by attempting to use session if available
- Automatic session activation after successful account creation
- Console logging for debugging account creation flow

## Future Enhancements

### Phase 2
- [ ] Integrate password reset functionality
- [ ] Add phone number and location fields to Clerk user metadata
- [ ] Implement reCAPTCHA verification
- [ ] Add email verification flow (when enabling verification)
- [ ] Implement "Remember Me" functionality

### Phase 3
- [ ] Integrate with Salesforce for member data sync
- [ ] Add Stripe payment integration for memberships
- [ ] Implement role-based access control
- [ ] Add user profile management page

## Testing Checklist

### Login Page
- [x] User can log in with valid credentials
- [x] User sees error message for invalid credentials
- [x] User is redirected to `/my-account` on successful login
- [x] Loading state displays during authentication
- [ ] Password reset link works
- [ ] Sign-up link redirects to create account page

### Create Account Page
- [x] User can create account with required fields
- [x] User sees error for mismatched passwords
- [x] User sees error for missing required fields
- [x] User is logged in automatically after account creation
- [x] User is redirected to `/my-account` on successful signup
- [x] Loading state displays during account creation
- [ ] Optional fields (phone, city, state) validation
- [ ] reCAPTCHA integration

## Dependencies
- `@clerk/clerk-react@latest` - Official Clerk React SDK

## References
- Clerk React Documentation: https://clerk.com/docs/quickstarts/react
- Clerk Dashboard: https://dashboard.clerk.com
