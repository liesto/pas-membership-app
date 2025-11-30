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

### Phase 1: Backend Setup & OAuth Authentication

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

**3. Implement OAuth 2.0 Flow**
**Endpoints to create**:
- `GET /auth/login` → Redirect to Salesforce login
- `GET /auth/callback` → Handle Salesforce callback, store token
- `GET /auth/logout` → Clear session
- `GET /auth/status` → Check if user is authenticated

**Token Management**:
- Use httpOnly cookies (not localStorage)
- Implement refresh token logic
- Secure storage of access tokens

**4. Test OAuth Flow Locally**
- Start backend on `localhost:3000`
- Navigate to `http://localhost:3000/auth/login`
- Verify redirect to Salesforce
- Verify callback and token storage
- Verify `/auth/status` returns authenticated state

**Success Criteria for Phase 1**:
- ✅ User can click "Login with Salesforce"
- ✅ User is redirected to Salesforce login
- ✅ User authenticates with integration user credentials
- ✅ User is redirected back to app
- ✅ Backend has valid access token in secure cookie
- ✅ Token can be refreshed when expired

---

## User Information Needed

**Provide at start of next session**:
```
Integration User Credentials:
- Username: __________________
- Password: __________________

Connected App Credentials:
- Consumer Key (Client ID): __________________
- Consumer Secret: __________________
- Callback URL: http://localhost:3000/auth/callback

Salesforce Org Details:
- Instance URL: https://test.salesforce.com
- Membership RecordType ID: __________________
```

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
