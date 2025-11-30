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

## Forgot Password Page (`src/pages/ForgotPassword.tsx`)

### Functionality
- Users enter their email address
- System sends a password reset code via email using Clerk's built-in email service
- On success: User is redirected to `/verify-reset-code` page
- On error: Error message displayed on the form

### User Experience
- Email input field with placeholder
- Loading state shown while email is being sent
- Button text changes to "Sending..." during submission
- Form input is disabled while email is being sent
- Toast notifications for success/error feedback
- Link to return to login page

### Technical Details
- Uses `useSignIn()` hook from `@clerk/clerk-react`
- Uses `reset_password_email_code` strategy to initiate password reset
- Calls `signIn.create()` with identifier (email) and strategy
- Console logging for debugging password reset flow
- Error handling extracts messages from Clerk error responses

## Verify Reset Code Page (`src/pages/VerifyResetCode.tsx`)

### Functionality
- Users enter the 6-digit code received in their email
- Code is validated locally (minimum 6 characters)
- On success: User is redirected to `/reset-password?code=XXXXX` with code in URL
- On error: Error message displayed on the form

### User Experience
- Code input field with uppercase transformation and centered styling
- Input accepts up to 20 characters (allows flexibility for different code formats)
- Loading state shown while verifying
- Button text changes to "Verifying..." during submission
- Option to request a new code (redirects back to `/forgot-password`)
- Toast notifications for success/error feedback

### Technical Details
- Client-side validation only (no API call to Clerk at this stage)
- Code passed as URL parameter using `encodeURIComponent()`
- Input styling with large text and letter spacing for clarity
- Handles uppercase conversion on input change

## Reset Password Page (`src/pages/ResetPassword.tsx`)

### Functionality
- Users enter their new password (minimum 8 characters)
- Users confirm their new password (must match)
- Code from URL parameter is extracted and used for validation
- System resets the password and logs the user in
- On success: User is logged in and redirected to `/my-account`
- On error: Error message displayed on the form

### User Experience
- New password and confirm password input fields
- Password validation: matches, minimum 8 characters, code present
- Loading state shown while password is being reset
- Button text changes to "Resetting Password..." during submission
- Form inputs are disabled while reset is in progress
- Toast notifications for success/error feedback

### Technical Details
- Uses `useSignIn()` hook from `@clerk/clerk-react`
- Extracts code from URL search parameters: `searchParams.get("code")`
- Uses `signIn.attemptFirstFactor()` with:
  - Strategy: `reset_password_email_code`
  - Code from URL parameter
  - New password from form input
- Checks for `complete` status to confirm successful reset
- Automatic session activation after successful password reset
- Console logging for debugging password reset flow
- Error handling extracts messages from Clerk error responses

## Future Enhancements

### Phase 2
- [x] Integrate password reset functionality
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
- [x] Password reset link works
- [x] Sign-up link redirects to create account page

### Create Account Page
- [x] User can create account with required fields
- [x] User sees error for mismatched passwords
- [x] User sees error for missing required fields
- [x] User is logged in automatically after account creation
- [x] User is redirected to `/my-account` on successful signup
- [x] Loading state displays during account creation
- [ ] Optional fields (phone, city, state) validation
- [ ] reCAPTCHA integration

### Forgot Password Page
- [x] User can request password reset with email
- [x] User receives reset code email from Clerk
- [x] User sees success message and is redirected to code verification
- [x] Error message displays for invalid email or API errors
- [x] Loading state displays during email sending
- [x] Link to return to login page works

### Verify Reset Code Page
- [x] User can enter reset code from email
- [x] Code is validated (minimum 6 characters)
- [x] User is redirected to reset password page with code in URL
- [x] Option to request new code redirects to forgot password
- [x] Loading state displays during verification
- [x] Error messages display for invalid codes

### Reset Password Page
- [x] User can enter new password
- [x] User sees error for mismatched passwords
- [x] User sees error for passwords less than 8 characters
- [x] User sees error if code is missing or invalid
- [x] User is logged in automatically after successful reset
- [x] User is redirected to `/my-account` on successful reset
- [x] Loading state displays during password reset
- [x] Error messages display from Clerk API errors

## Dependencies
- `@clerk/clerk-react@latest` - Official Clerk React SDK

## References
- Clerk React Documentation: https://clerk.com/docs/quickstarts/react
- Clerk Dashboard: https://dashboard.clerk.com
