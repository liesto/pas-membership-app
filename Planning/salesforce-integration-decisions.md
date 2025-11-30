# Salesforce Integration - Decisions & Next Steps

## Summary of Decisions

Based on answers provided in `salesforce-integration.md`, here are the confirmed decisions:

### Authentication
✅ **Decision: OAuth 2.0 Web Flow**
- Connected App already configured in pas-membership-sb
- Consumer Key: `[See .env.local in backend folder]`
- Consumer Secret: `[See .env.local in backend folder]` (not needed for CLI)
- Callback URL: `http://localhost:1717/OauthRedirect` (CLI default, we'll use `http://localhost:3000/auth/callback` for web app)
- OAuth Settings: Enabled
- Device Flow: Disabled

**Important Note**: The Connected App currently used with Salesforce CLI is intended for admin management only. For the web app, we need to create a **separate External App** configured for an **integration user** account in Salesforce.

**Credentials Location**: Do NOT commit Consumer Key/Secret to GitHub. Store in `backend/.env.local` only (added to .gitignore).

### Architecture
✅ **Decision: Backend Server (Option B)**
- Node.js + Express backend handles Salesforce API calls
- React frontend calls backend, not Salesforce directly
- Better security, CORS handling, logging capability
- Runs on `localhost:3000` during development
- Frontend on `localhost:8081` calls backend at `http://localhost:3000/api/*`

### Project Structure
✅ **Decision: Monorepo with Frontend/Backend Folders**
- Keep both in same repository (easier for localhost development)
- Frontend: `src/` (existing)
- Backend: `backend/` (new folder)
- Root `npm run dev` runs both concurrently
- Each has its own `.env.local` (backend in .gitignore)

### Deployment Strategy
✅ **Decision: Localhost Now, Netlify + Backend Later**
- No CI/CD pipelines yet
- Manual deployments
- Backend hosting decision deferred (Heroku, AWS Lambda, etc.)
- Frontend will go to Netlify when ready for production

### Data & Security
✅ **Data Access Model:**
- Logged-in users see ONLY their own Contact record data
- Logged-in users see ONLY Opportunities where they are the primary contact
- No admin role in Phase 1 (all management in Salesforce)
- Query fresh from Salesforce each time (no caching)
- Show error messages to users when Salesforce API fails

✅ **Security Approach:**
- Treat data as very sensitive (secure by default)
- All Salesforce credentials in backend `.env.local`
- Log all web app interactions with Salesforce
- No audit trail required during development
- OAuth tokens stored securely (httpOnly cookies in backend)

---

## Critical Action Items (Before Implementation)

### 1. Create Salesforce Integration User Account
**In Salesforce (pas-membership-sb):**
- [ ] Create new Salesforce user account specifically for web app integration (e.g., `webapp-integration@pisgaharea.com`)
- [ ] Assign appropriate permissions to this user
- [ ] Document the username and temporary password

### 2. Create New Connected App for Web App
**In Salesforce (pas-membership-sb) Settings:**
- [ ] Create new Connected App with settings:
  - **Name**: "PAS Membership Web App"
  - **Callback URL**: `http://localhost:3000/auth/callback` (dev), update later for production
  - **OAuth Scopes**:
    - `api` (Access and manage your data)
    - `refresh_token` (Obtain refresh tokens)
  - Record the new **Consumer Key** and **Consumer Secret**
  - **Important**: This should be configured for the integration user account

### 3. Environment Setup
- [ ] Create `backend/.env.local` with:
  ```
  SF_CLIENT_ID=<new Consumer Key>
  SF_CLIENT_SECRET=<new Consumer Secret>
  SF_LOGIN_URL=https://test.salesforce.com
  SF_REDIRECT_URI=http://localhost:3000/auth/callback
  SF_INTEGRATION_USER_USERNAME=<integration user email>
  SF_INTEGRATION_USER_PASSWORD=<integration user password>
  NODE_ENV=development
  ```
- [ ] Create `src/.env.local` with:
  ```
  VITE_CLERK_PUBLISHABLE_KEY=...
  VITE_API_URL=http://localhost:3000
  ```

---

## Implementation Plan

### Phase 1: Backend Setup & Authentication (Week 1)
**Goal**: Get OAuth 2.0 flow working, user can authenticate

**Steps:**
1. [ ] Create `backend/` directory structure
   - `backend/server.ts` - Express app
   - `backend/routes/auth.ts` - OAuth routes
   - `backend/services/salesforce.ts` - SF client
   - `backend/package.json` - Node dependencies
   - `backend/.env.local` - Credentials (in .gitignore)

2. [ ] Install dependencies:
   ```bash
   npm install express axios dotenv cors
   npm install -D @types/express @types/node typescript
   ```

3. [ ] Implement OAuth 2.0 flow:
   - `GET /auth/login` - Redirect user to Salesforce login
   - `GET /auth/callback` - Handle Salesforce callback, store access token
   - `GET /auth/logout` - Clear session

4. [ ] Store OAuth tokens securely:
   - Use httpOnly cookies (not localStorage)
   - Store refresh token for token refresh
   - Implement token refresh logic

5. [ ] Test OAuth flow:
   - User clicks "Login with Salesforce"
   - Redirected to Salesforce
   - User authenticates
   - Redirected back to app with token
   - Token stored in httpOnly cookie

**Success Criteria**: User can log in via Salesforce OAuth, backend receives valid access token

### Phase 2: Salesforce API Client & Endpoints (Week 2)
**Goal**: Query Contact and Opportunity data, create records

**Steps:**
1. [ ] Build Salesforce API client service:
   ```
   backend/services/salesforce.ts
   - queryContactById(id)
   - queryOpportunitiesByContactId(id)
   - createContact(data)
   - createOpportunity(data, recordType='Membership')
   ```

2. [ ] Implement API endpoints:
   - `GET /api/salesforce/contacts/me` - Get logged-in user's contact
   - `GET /api/salesforce/opportunities/me` - Get user's opportunities
   - `POST /api/salesforce/contacts` - Create contact
   - `POST /api/salesforce/opportunities` - Create opportunity (membership)

3. [ ] Add error handling:
   - Invalid tokens → refresh or redirect to login
   - Salesforce API errors → proper error responses
   - Input validation → sanitize before sending to SF

4. [ ] Test endpoints:
   - Query your contact record
   - Query your opportunities
   - Create test contact
   - Create test opportunity

**Success Criteria**: Backend can query and create Salesforce records via API endpoints

### Phase 3: Frontend Integration (Week 3)
**Goal**: Display member data and allow profile/membership updates

**Steps:**
1. [ ] Create API client service:
   ```
   src/services/salesforceApi.ts
   - getMyContact()
   - getMyOpportunities()
   - createContact(data)
   - createOpportunity(data)
   ```

2. [ ] Update "My Account" page:
   - Display member contact information
   - Show membership status (opportunities)
   - Show current opportunities

3. [ ] Create forms:
   - "Update Profile" form (edit contact fields)
   - "Request Membership" form (create opportunity)

4. [ ] Add loading & error states:
   - Loading spinners while querying SF
   - Error messages when API fails
   - Graceful error handling

**Success Criteria**: User can view and edit their member profile and opportunities

### Phase 4: Localhost Development Setup (Week 4)
**Goal**: Easy developer experience for local testing

**Steps:**
1. [ ] Create `package.json` scripts:
   ```json
   {
     "scripts": {
       "dev": "concurrently 'npm run dev:frontend' 'npm run dev:backend'",
       "dev:frontend": "cd src && npm run dev",
       "dev:backend": "cd backend && npm run dev",
       "build": "npm run build:frontend && npm run build:backend"
     }
   }
   ```

2. [ ] Install concurrently:
   ```bash
   npm install -D concurrently
   ```

3. [ ] Create developer documentation:
   - `DEVELOPMENT.md` with setup instructions
   - Environment variables needed
   - How to run locally
   - Troubleshooting guide

4. [ ] Test full flow locally:
   - Start `npm run dev`
   - Login via Salesforce OAuth
   - View your contact data
   - Update profile
   - Create membership opportunity

**Success Criteria**: New developer can run `npm run dev` and have working app locally

---

## Key Technical Notes

### OAuth 2.0 Flow (Web App)
```
1. User clicks "Login with Salesforce"
2. Redirect to: https://test.salesforce.com/services/oauth2/authorize?
     client_id=CONSUMER_KEY
     &redirect_uri=http://localhost:3000/auth/callback
     &response_type=code
3. User logs in to Salesforce
4. Salesforce redirects to: http://localhost:3000/auth/callback?code=AUTH_CODE
5. Backend exchanges code for access token:
     POST https://test.salesforce.com/services/oauth2/token
     client_id=CONSUMER_KEY
     client_secret=CONSUMER_SECRET
     code=AUTH_CODE
     grant_type=authorization_code
6. Backend receives access_token and refresh_token
7. Store in httpOnly cookie
8. User is logged in to web app
```

### Salesforce API Queries
```bash
# Get Contact by ID
GET /services/data/v59.0/sobjects/Contact/0031700000IZ3TAAW

# Query with SOQL
GET /services/data/v59.0/query?q=SELECT+Id,Name+FROM+Contact+WHERE+Email='user@example.com'

# Query Opportunities for Contact
GET /services/data/v59.0/query?q=SELECT+Id,Name,StageName+FROM+Opportunity+WHERE+AccountId='0011700000IZ3TAAW'

# Create Contact
POST /services/data/v59.0/sobjects/Contact/
{
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john@example.com"
}

# Create Opportunity
POST /services/data/v59.0/sobjects/Opportunity/
{
  "Name": "Membership for John Doe",
  "AccountId": "0011700000IZ3TAAW",
  "ContactId": "0031700000IZ3TAAW",
  "RecordTypeId": "<Membership RecordType Id>",
  "StageName": "Open",
  "CloseDate": "2025-12-31"
}
```

### Important Gotchas
1. **Membership RecordType ID**: Need to query Salesforce for the ID of the "Membership" record type
2. **Account vs Contact**: Opportunities link to Accounts, not Contacts directly
3. **Token Refresh**: Access tokens expire; implement refresh token logic
4. **CORS**: Frontend can't call Salesforce directly (CORS blocked)
5. **Sandbox vs Production**: Remember we're using `test.salesforce.com` (sandbox), not `login.salesforce.com`

---

## Next Action

1. ✅ You: Create Salesforce integration user account in pas-membership-sb
2. ✅ You: Create new Connected App in Salesforce with OAuth settings
3. ✅ You: Provide new Consumer Key & Secret
4. 🤖 Claude: Scaffold `backend/` directory structure
5. 🤖 Claude: Implement OAuth 2.0 flow
6. Together: Test and iterate

Ready to start Phase 1 implementation?
