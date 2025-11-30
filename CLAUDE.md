# Claude Instructions For the PAS Membership App

This is the primary development repository for the PAS Membership App - a hosted web app that enables self-serve membership management for Pisgah Area SORBA. It will use Clerk.dev for authentication/login, Stripe for payment processing, Netlify for hosting, Salesforce for data integration, and is built in React.

## Critical Operating Principle: NEVER GUESS

⚠️ **DO NOT MAKE ASSUMPTIONS OR GUESSES ABOUT:**
- Field names in Salesforce objects
- Object names or structure in Salesforce
- API endpoints or response formats
- Code behavior or file locations
- Dependencies or package versions
- Database schema or table structure

**INSTEAD:**
- **Query the actual system** (Salesforce CLI, database, API, codebase)
- **Read the actual code** before modifying
- **Verify objects exist** before referencing them
- **Check actual data** before making assumptions about structure
- **Ask for clarification** if uncertain

**Example of WRONG approach:**
- "Member__c is probably a custom object in PAS" → WRONG (it's in USMS, not PAS)

**Example of RIGHT approach:**
- Run: `sf sobject list --target-org pas-membership-sb` → Verify actual objects exist
- Read the file before editing it
- Query actual Salesforce data to understand structure

This principle is more important than speed. A few extra seconds to verify is infinitely better than implementing against non-existent objects or incorrect assumptions.

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

## Salesforce Integration

### Sandbox Configuration

This project integrates with a Salesforce sandbox for data persistence and member management.

**PAS Membership App Salesforce Sandbox**
- **Salesforce Alias**: `pas-membership-sb`
- **Org ID**: `00DU7000009QgG9MAK`
- **Username**: `jbwpas@buildabonfire.com.membership`
- **Purpose**: Pisgah Area SORBA member data management

### Accessing Salesforce Data

⚠️ **IMPORTANT**: There are NO MCP Salesforce tools available for this project. Use **Salesforce CLI only**.

All Salesforce interactions must use the Salesforce CLI (`sf` command) with the `--target-org pas-membership-sb` flag to ensure queries go to the correct sandbox.

**Example Queries**:
```bash
# List Salesforce orgs (verify pas-membership-sb is available)
sf org list

# Query Member records
sf data query --query "SELECT Id, Name, Email FROM Member__c LIMIT 10" --target-org pas-membership-sb

# Query Member Registrations
sf data query --query "SELECT Id, Name, Member__c FROM MemberRegistration__c LIMIT 10" --target-org pas-membership-sb

# Display object metadata
sf sobject describe --sobject Member__c --target-org pas-membership-sb
```

### Critical Rules for Salesforce Interactions

🚫 **NEVER**:
- Assume MCP Salesforce tools are available (they are not)
- Omit the `--target-org pas-membership-sb` flag from Salesforce CLI commands
- Query without specifying which org is being accessed
- Use Salesforce CLI without explicit org targeting

✅ **ALWAYS**:
- Use Salesforce CLI (`sf` command) for all Salesforce interactions
- Include `--target-org pas-membership-sb` in every command
- Verify you're querying the correct org ID: `00DU7000009QgG9MAK`
- Document which Salesforce queries were executed
- Ask for clarification if unsure about object/field names

### Custom Objects in PAS Org

PAS-Specific Custom Objects:
- `Budget__c` - Budget tracking
- `Contact_Payload__c` - Contact data payloads
- `Contact_Snapshot__c` - Contact snapshots
- `Grant__c` - Grant records
- `PAS_Event__c` - PAS events
- `PAS_Event_Attendance__c` - Event attendance tracking
- `Paypal_Payload__c` - PayPal transaction payloads
- `RFM_Snapshot__c` - RFM analysis snapshots
- `Signup_Genius_Payload__c` - SignUp Genius integration
- `Trail__c` - Trail records
- `Trail_Ride__c` - Trail ride records
- `Volunteer_Information__c` - Volunteer data
- `VolunteerHub_Payload__c` - VolunteerHub integration
- `Workbook__c` - Workbook records

Installed Packages (Nonprofit Cloud):
- `npe01__*` - Contacts and Organizations
- `npe03__*` - Recurring Donations
- `npe04__*` - Relationships
- `npe05__*` - Affiliations
- `npo02__*` - Household
- `npsp__*` - Salesforce Nonprofit Cloud
- `dlrs__*` - Declarative Lookup Rollup Summaries
- And additional managed packages (Give Lively, VolunteerHub, etc.)

For complete list of objects, query: `sf sobject list --target-org pas-membership-sb`

