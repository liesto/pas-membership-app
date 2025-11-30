# Salesforce Integration Planning Document

## Project Overview

This document outlines the approach for integrating the PAS Membership App with Salesforce to enable:
- Querying Contact and Opportunity objects for member data
- Creating new Contact records
- Creating new Opportunity records (record type = membership)

**Target Environment**: Salesforce Sandbox (`pas-membership-sb`)
**Development Approach**: Localhost during development, no production deployment yet

## Current Status

✅ **Connected App**: Already exists in pas-membership-sb
❓ **Authentication Method**: To be determined
❓ **Backend vs Frontend API Calls**: To be determined
✅ **Deployment**: Localhost only (no Netlify production yet)

---

## Critical Clarifying Questions

### 1. Connected App Configuration

**What we need to know:**
- What credentials/keys does the existing Connected App have?
  - Client ID
  - Client Secret (if applicable)
  - Callback/Redirect URLs
- Is the app configured for OAuth 2.0 Web Flow, or another authentication type?
- Where are these credentials currently stored (local machine, secrets manager, etc.)?

**Action Items:**
- [ ] Get Connected App credentials from Salesforce dashboard
- [ ] Verify redirect URI matches our localhost development URL (e.g., `http://localhost:8081/callback`)
- [ ] Determine if credentials need to be added to `.env.local`

---

### 2. Authentication Architecture Decision

**Three approaches for authenticating with Salesforce:**

#### Option A: OAuth 2.0 Web Flow (Recommended for user-specific data)
- User logs in with Salesforce credentials
- App receives access token
- Access token used to query/modify Salesforce as that user
- **Best for**: User-specific member data, respecting Salesforce security model
- **Complexity**: Medium
- **Setup**: Connected App already exists, just need to implement OAuth flow

#### Option B: Service Account Authentication (JWT)
- App authenticates server-to-server using certificate/private key
- No user login required to Salesforce
- App has fixed permissions regardless of who's logged in
- **Best for**: Batch operations, system-to-system integration
- **Complexity**: High
- **Setup**: Requires new Connected App configuration and certificate

#### Option C: Session-Based (Not recommended)
- Use Salesforce session token after user logs in
- Limited security controls
- Not suitable for production

**Questions to answer:**
1. Should the app respect individual user permissions in Salesforce?
2. Do all members have equal access to all Contact/Opportunity data?
3. Should admins have different permissions than regular members?

**Recommendation**: Start with **Option A (OAuth 2.0 Web Flow)** because:
- Connected App already exists
- Respects Salesforce security model
- Aligns with Clerk authentication (user-specific tokens)
- Can be enhanced later with role-based access control

---

### 3. Backend vs Frontend API Calls

**Two approaches for calling Salesforce API:**

#### Option A: Direct from React Frontend
- React app calls Salesforce API directly
- **Pros**:
  - Simpler architecture
  - Fewer moving parts
  - Easier for localhost development
- **Cons**:
  - CORS issues (Salesforce may block cross-origin requests)
  - Client-side secrets exposure
  - Rate limiting per browser session
  - Limited error handling

#### Option B: Backend Server (Proxy Pattern)
- React app → Backend API → Salesforce
- Backend handles all Salesforce authentication/queries
- **Pros**:
  - Better security (secrets on server, not browser)
  - CORS handled at backend
  - Centralized logging/monitoring
  - Better rate limiting control
  - Can implement caching
- **Cons**:
  - More infrastructure to manage
  - Additional deployment complexity
  - Extra latency

**Questions to answer:**
1. How sensitive is the member data being queried?
2. Do we need to log all Salesforce interactions?
3. Will we need caching or rate limiting?
4. Should we implement any data transformation before sending to frontend?

**Recommendation**: Start with **Option B (Backend Server)** because:
- Better security for production (even though localhost for now)
- CORS not an issue (common pain point)
- Easier to add logging/auditing later
- Can use Node.js + Express alongside the React app

---

### 4. Project Structure & Deployment Strategy

**Current Situation:**
- React frontend deployed to Localhost during development
- Salesforce is separate sandbox (pas-membership-sb)
- No Netlify production yet (localhost only)

**Proposed Structure:**

```
pas-membership-app/
├── src/                          # React frontend
│   ├── pages/
│   ├── components/
│   └── api/                      # API client code
├── backend/                      # NEW: Node.js/Express backend
│   ├── routes/
│   │   ├── salesforce.ts         # SF API routes
│   │   └── auth.ts               # Auth routes
│   ├── services/
│   │   └── salesforce.ts         # SF API client logic
│   └── .env.local                # SF credentials
├── .github/
│   └── workflows/                # CI/CD (if needed later)
└── DEPLOYMENT.md                 # Deployment guide
```

**Development Workflow:**
1. Run React dev server on `localhost:8081`
2. Run backend server on `localhost:3000` (or similar)
3. React app makes API calls to `http://localhost:3000/api/salesforce/*`
4. Backend authenticates with Salesforce using Connected App credentials

**Environment Variables Needed:**
```
# Frontend (.env.local)
VITE_CLERK_PUBLISHABLE_KEY=...
VITE_API_URL=http://localhost:3000      # Backend URL

# Backend (.env.local)
SF_CLIENT_ID=<Connected App Client ID>
SF_CLIENT_SECRET=<Connected App Secret>
SF_LOGIN_URL=https://test.salesforce.com  # Sandbox URL
SF_REDIRECT_URI=http://localhost:3000/auth/callback
NODE_ENV=development
```

**Questions to answer:**
1. Should the backend be in the same repository or separate?
2. Should we use Node.js/Express, or another backend framework?
3. Do we need database persistence (e.g., to cache Salesforce data)?

**Recommendation**:
- Backend in **same repository** (easier for localhost development)
- Use **Node.js + Express** (familiar with the stack)
- Start with **in-memory state** (no database yet)

---

### 5. GitHub & Version Control Strategy

**Challenge**: Need to deploy React to one place (Netlify later) and Backend to another (Heroku/AWS later)

**Proposed Solution: Monorepo with Separate Deploy Configurations**

```
pas-membership-app/
├── package.json              # Root package.json
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── .netlifyrc            # Netlify deployment config
├── backend/
│   ├── package.json
│   ├── server.ts
│   └── .herokurc             # Heroku deployment config (future)
└── .github/
    └── workflows/
        ├── deploy-frontend.yml
        └── deploy-backend.yml
```

**Current Setup (Localhost Only):**
1. Root `npm run dev` runs both frontend + backend concurrently
2. Both `.env.local` files contain necessary credentials
3. Add `backend/.env.local` to `.gitignore` (don't commit secrets)

**Future Setup (Production):**
1. Frontend: `npm run build` → Deploy to Netlify
2. Backend: Separate repository or deployment service
3. GitHub workflows trigger separate deployments

**Questions to answer:**
1. Should backend be in same repo or separate?
2. What backend hosting provider? (Heroku, AWS Lambda, etc.)
3. Do we need CI/CD pipelines now, or add later?

**Recommendation**:
- Keep both in **same monorepo** (easier for localhost development)
- Add frontend/backend folder separation NOW
- Plan Netlify (frontend) + Heroku (backend) for later
- Don't implement CI/CD yet, just manual deployments

---

## Implementation Roadmap

### Phase 1: Authentication Setup (Week 1)
- [ ] Verify Connected App credentials in Salesforce
- [ ] Decide on OAuth 2.0 vs Service Account
- [ ] Create `.env.local` with Salesforce credentials
- [ ] Implement Salesforce OAuth flow (or JWT if chosen)

### Phase 2: Backend API Layer (Week 2)
- [ ] Create Node.js/Express backend structure
- [ ] Build Salesforce API client service
- [ ] Implement endpoints:
  - `GET /api/salesforce/contacts/:id` - Query single contact
  - `GET /api/salesforce/opportunities/:memberId` - Query opportunities
  - `POST /api/salesforce/contacts` - Create contact
  - `POST /api/salesforce/opportunities` - Create opportunity
- [ ] Add error handling and logging

### Phase 3: Frontend Integration (Week 3)
- [ ] Create API client service (React hooks/service)
- [ ] Build "My Account" page to display member data
- [ ] Build "Update Profile" form
- [ ] Add loading states and error handling
- [ ] Test against sandbox data

### Phase 4: Localhost Deployment (Week 4)
- [ ] Create dev setup documentation
- [ ] Add `npm run dev` script that starts both frontend + backend
- [ ] Test full flow locally
- [ ] Document environment setup for future developers

---

## Security Considerations

**DO:**
- Store all Salesforce credentials in `.env.local` (never in code)
- Use OAuth tokens (short-lived) instead of storing passwords
- Validate all input before sending to Salesforce
- Log all Salesforce API calls for audit trail
- Use HTTPS in production (Netlify/Heroku enforce this)

**DON'T:**
- Expose client secret to frontend
- Store access tokens in localStorage (use httpOnly cookies in backend)
- Trust client-side data validation for Salesforce operations
- Hardcode any credentials

---

## Questions for User

Before proceeding with implementation:

1. **Connected App Details**: Can you provide the Client ID and any documentation about what scopes/permissions it has?

2. **Data Sensitivity**: How sensitive is the member contact and opportunity data? Does it contain PII that needs extra protection?

3. **User Permissions**: Should different members see different data in Salesforce, or should all members have access to all data?

4. **Rate Limiting**: Do we expect high volume of Salesforce queries, or is it low-volume (few requests per session)?

5. **Caching**: Should we cache member profile data locally (faster, but might be stale), or always query fresh from Salesforce?

6. **Error Handling**: When Salesforce API fails, what should the user see? Error message? Cached data? Graceful degradation?

7. **Audit Trail**: Do we need to log who queried/modified what in Salesforce?

8. **Future Production**: When we deploy to production (Netlify + backend), what hosting services do you prefer? (Heroku, AWS, Azure, etc.)

---

## Next Steps

1. Answer the clarifying questions above
2. Confirm authentication approach (OAuth 2.0 recommended)
3. Confirm backend approach (Node.js/Express recommended)
4. Get Connected App credentials
5. Create backend scaffolding
6. Implement authentication flow
7. Build Salesforce API client
8. Integrate with frontend

---

## References

- [Salesforce OAuth 2.0 Documentation](https://developer.salesforce.com/docs/atlas.en-us.oauth_tokens_api.meta/oauth_tokens_api/oauth_auth_flows.htm)
- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [Salesforce Connected Apps](https://help.salesforce.com/s/articleView?id=sf.connected_app_overview.htm)
- [CORS in Salesforce](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/quickstart_http_basic_auth.htm)
