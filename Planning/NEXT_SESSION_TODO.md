# Next Session TODO - Salesforce Integration Phase 1

**Date Created**: 2025-11-30
**Status**: Ready to start Phase 1
**Context**: OAuth 2.0 + Backend Server architecture approved. Planning complete.

---

## CRITICAL: User Action Items (Must Complete First)

These must be completed in Salesforce before Claude can begin backend implementation.

### 1. Create Salesforce Integration User Account
**Location**: Salesforce pas-membership-sb org
**Steps**:
- [ ] Go to Setup → Users
- [ ] Create new user account
  - **Email**: `webapp-integration@pisgaharea.com` (or similar)
  - **Username**: Unique value (e.g., `webapp.integration@pisgaharea.dev`)
  - **Profile**: System Administrator (or custom profile with API permissions)
  - Assign necessary permissions for Contact and Opportunity CRUD
- [ ] Note the temporary password
- [ ] Document username and password (will use in backend `.env.local`)

### 2. Create New Connected App for Web App
**Location**: Salesforce pas-membership-sb Setup → Apps → App Manager → New Connected App
**Settings**:
- [ ] **Basic Information**:
  - Name: `PAS Membership Web App`
  - API Name: `PAS_Membership_Web_App`
  - Contact Email: Your email

- [ ] **API (Enable OAuth Settings)**:
  - ✅ Enable OAuth Settings
  - **Callback URL**: `http://localhost:3000/auth/callback`
  - **OAuth Scopes**:
    - ✅ `api` (Access and manage your data)
    - ✅ `refresh_token` (Obtain refresh tokens)

- [ ] After creation, click "Manage Consumer Details"
  - **Record the Consumer Key** (Client ID)
  - **Record the Consumer Secret** (Client Secret)
  - Store these securely for backend `.env.local`

### 3. Verify Query Capabilities
- [ ] Confirm the integration user can:
  - [ ] Query Contact records
  - [ ] Query Opportunity records
  - [ ] Create Contact records
  - [ ] Create Opportunity records
- [ ] Note the **Membership RecordType ID** for Opportunities (will need this for creation)

---

## Claude Action Items (Next Session)

### Phase 1: Backend Setup & Salesforce Integration User Authentication

**IMPORTANT CLARIFICATION:**
- **Web App Users**: Authenticate via Clerk (NOT Salesforce)
- **Backend**: Authenticates to Salesforce using Integration User credentials (Service Account)
- **Flow**: Clerk User → Backend API → Salesforce (via Integration User token)

**1. Create Backend Directory Structure**
```
backend/
├── package.json
├── tsconfig.json
├── .env.local (user provides credentials)
├── .gitignore
├── src/
│   ├── server.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   └── salesforce.ts
│   ├── services/
│   │   ├── salesforce.ts
│   │   ├── auth.ts
│   │   └── tokenManager.ts
│   └── middleware/
│       └── auth.ts
└── README.md (development instructions)
```

**2. Install Dependencies**
- Express.js
- axios (for HTTP requests)
- dotenv (environment variables)
- cookie-parser (for secure cookies)
- cors (cross-origin requests)
- TypeScript types

**3. Implement Salesforce Integration User Authentication**
**Backend authenticates to Salesforce** (not the web user):
- Use Integration User username/password from `.env.local`
- Get access token from Salesforce via REST API
- Store token in memory (or cache with TTL)
- Implement token refresh logic (when expired)

**Endpoints to create**:
- `POST /api/salesforce/contacts/me` → Get logged-in user's contact from SF
- `GET /api/salesforce/opportunities/me` → Get logged-in user's opportunities from SF
- `POST /api/salesforce/contacts` → Create new contact in SF
- `POST /api/salesforce/opportunities` → Create new opportunity in SF

**Authentication Flow**:
1. Web app user logs in via Clerk (frontend handles this)
2. Web app user makes API call to backend (includes Clerk auth token)
3. Backend verifies Clerk token is valid
4. Backend uses Integration User credentials to get Salesforce token
5. Backend queries Salesforce with Integration User token
6. Backend filters/returns only data relevant to logged-in user

**4. Test Backend Salesforce Connection Locally**
- Start backend on `localhost:3000`
- Test that backend can authenticate to Salesforce with integration user
- Test that backend can query Contact and Opportunity objects
- Test that tokens refresh when expired
- Verify error handling when Salesforce is unreachable

**Success Criteria for Phase 1**:
- ✅ Backend can authenticate to Salesforce using integration user credentials
- ✅ Backend can successfully query Contact objects
- ✅ Backend can successfully query Opportunity objects
- ✅ Backend handles token expiration and refresh
- ✅ Backend has proper error handling for Salesforce API failures
- ✅ Salesforce access token is stored securely in memory

---

## User Information Needed

**Provide at start of next session**:
```
Salesforce Integration User Credentials:
(The service account the backend will use to authenticate)
- Username: __________________
- Password: __________________
- Instance URL: https://test.salesforce.com

Salesforce Org Details:
- Membership RecordType ID: __________________
(Query in SOQL: SELECT Id, Name FROM RecordType WHERE Name = 'Membership' AND SobjectType = 'Opportunity')
```

**Note**: We don't need OAuth Consumer Key/Secret anymore since we're using Service Account authentication with username/password.

---

## Development Environment Setup

**Once user items completed, run**:
```bash
cd /Users/jbwmson/Agent/PAS\ Membership\ App

# Create backend folder
mkdir -p backend/src/routes backend/src/services backend/src/middleware

# Create backend/.env.local with credentials provided
cat > backend/.env.local << 'EOF'
SF_CLIENT_ID=<Consumer Key from Connected App>
SF_CLIENT_SECRET=<Consumer Secret from Connected App>
SF_LOGIN_URL=https://test.salesforce.com
SF_REDIRECT_URI=http://localhost:3000/auth/callback
SF_INTEGRATION_USER_USERNAME=<integration user email>
SF_INTEGRATION_USER_PASSWORD=<integration user password>
NODE_ENV=development
EOF

# Initialize backend project
cd backend
npm init -y
npm install express axios dotenv cookie-parser cors
npm install -D @types/express @types/node typescript ts-node
npm install -D @types/cookie-parser
```

---

## References & Documentation

**Related Planning Documents**:
- `Planning/salesforce-integration.md` - Full architecture overview
- `Planning/salesforce-integration-decisions.md` - Decisions made & next steps

**Key Resources**:
- [Salesforce OAuth 2.0 Web Flow](https://developer.salesforce.com/docs/atlas.en-us.oauth_tokens_api.meta/oauth_tokens_api/oauth_auth_flows.htm)
- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [Connected Apps Setup](https://help.salesforce.com/s/articleView?id=sf.connected_app_overview.htm)

---

## Important Reminders

🚫 **DO NOT**:
- Commit `.env.local` files to GitHub
- Hardcode credentials in code
- Expose client secrets to frontend
- Use localhost:8081 OAuth callback (must be backend at 3000)

✅ **DO**:
- Use `.gitignore` for all `.env.local` files
- Store credentials in environment variables only
- Use httpOnly cookies for tokens
- Verify OAuth callback URL matches Connected App setting
- Test locally before moving to production

---

## Success Checklist for Next Session

**By end of next session, we should have**:
- [ ] User created Salesforce integration user account
- [ ] User created new Connected App with OAuth settings
- [ ] User provided Consumer Key & Secret
- [ ] Backend directory structure created
- [ ] Dependencies installed
- [ ] OAuth 2.0 login flow implemented
- [ ] OAuth callback handler working
- [ ] Token stored securely in httpOnly cookie
- [ ] `/auth/login` redirects to Salesforce
- [ ] `/auth/callback` handles redirect successfully
- [ ] `/auth/status` returns auth state
- [ ] Manual testing of OAuth flow completes successfully

---

## Next Phase Preview

Once Phase 1 is complete:

**Phase 2** (Week 2): Build Salesforce API client & endpoints
- Query Contact by ID
- Query Opportunities by Contact ID
- Create Contact
- Create Opportunity (with record type = Membership)

**Phase 3** (Week 3): Frontend integration
- Update MyAccount page
- Display member data
- Create/edit forms

**Phase 4** (Week 4): Localhost setup
- `npm run dev` script
- Developer documentation
- Full flow testing
