# Backend Implementation Checklist

**Date**: December 1, 2025
**Membership RecordType ID**: `0124x000001aYWcAAM`
**Status**: Ready to start implementation

---

## Prerequisites - User Must Complete These First

### 1. Create Salesforce Integration User Account
**Location**: Salesforce pas-membership-sb org → Setup → Users

**Steps**:
- [ ] Go to Setup → Users → New User
- [ ] Create new user:
  - **Email**: `webapp-integration@pisgaharea.com` (or similar)
  - **Username**: Unique value, e.g., `webapp.integration@pisgaharea.dev`
  - **Profile**: System Administrator (for now, can restrict later)
  - **First Name**: Web
  - **Last Name**: App Integration
- [ ] Note the temporary password
- [ ] **Store credentials securely** - will need in backend `.env.local`

**After Creation**:
- [ ] Verify user can log in to Salesforce
- [ ] Verify user has Contact CRUD permissions
- [ ] Verify user has Opportunity CRUD permissions

### 2. Create Connected App in Salesforce
**Location**: Salesforce pas-membership-sb → Setup → Apps → App Manager → New Connected App

**Settings**:
- [ ] **Basic Information**:
  - Name: `PAS Membership Web App`
  - API Name: `PAS_Membership_Web_App`
  - Contact Email: Your email

- [ ] **API (Enable OAuth Settings)**:
  - ✅ Enable OAuth Settings checkbox
  - **Callback URL**: `http://localhost:3000/auth/callback`
  - **OAuth Scopes** (add both):
    - ✅ `api` (Access and manage your data)
    - ✅ `refresh_token` (Obtain refresh tokens)

- [ ] After creation → Click "Manage Consumer Details"
  - **Record the Consumer Key** (Client ID)
  - **Record the Consumer Secret** (Client Secret)
  - **Store securely** - will need in backend `.env.local`

**Assign to Integration User**:
- [ ] In Policies tab, set "Permitted Users" to "Admin approved users are pre-authorized"
- [ ] OR manually approve the integration user

---

## Backend Implementation - Claude Will Do These

### Phase 1: Backend Directory Structure

**Create folder structure**:
```bash
mkdir -p backend/src/routes
mkdir -p backend/src/services
mkdir -p backend/src/middleware
mkdir -p backend/src/utils
```

**Create files**:
- [ ] `backend/package.json` - Dependencies and scripts
- [ ] `backend/tsconfig.json` - TypeScript configuration
- [ ] `backend/.env.local` - Environment variables (user provides values)
- [ ] `backend/.gitignore` - Ignore node_modules, .env.local
- [ ] `backend/src/server.ts` - Express server entry point
- [ ] `backend/src/services/salesforce.ts` - Salesforce API client
- [ ] `backend/src/services/auth.ts` - Salesforce authentication
- [ ] `backend/src/middleware/auth.ts` - Clerk token verification
- [ ] `backend/src/routes/salesforce.ts` - Salesforce endpoints
- [ ] `backend/README.md` - Development instructions

### Phase 2: Salesforce Authentication Service

**File**: `backend/src/services/auth.ts`

**Functionality**:
- [ ] OAuth 2.0 authentication with Salesforce
- [ ] Get access token using:
  - `SF_INTEGRATION_USER_USERNAME` (from `.env.local`)
  - `SF_INTEGRATION_USER_PASSWORD` (from `.env.local`)
  - `SF_CLIENT_ID` (Consumer Key from Connected App)
  - `SF_CLIENT_SECRET` (Consumer Secret from Connected App)
  - `SF_LOGIN_URL` (https://test.salesforce.com for sandbox)
- [ ] Token refresh logic (when expired)
- [ ] Error handling with clear messages
- [ ] In-memory token caching with TTL

**Endpoint Used**:
```
POST https://test.salesforce.com/services/oauth2/token
  client_id=YOUR_CLIENT_ID
  client_secret=YOUR_CLIENT_SECRET
  username=INTEGRATION_USER_EMAIL
  password=INTEGRATION_USER_PASSWORD
  grant_type=password
```

### Phase 3: Salesforce API Client Service

**File**: `backend/src/services/salesforce.ts`

**Functions**:
- [ ] `async createContact(data: CreateContactRequest): Promise<CreateContactResponse>`
  - POST to `/services/data/v59.0/sobjects/Contact`
  - Required fields: FirstName, LastName, Email
  - Optional fields: Phone, City, BillingStreet, BillingCity, BillingState
  - Returns: Contact ID and data

- [ ] `async createOpportunity(data: CreateOpportunityRequest): Promise<CreateOpportunityResponse>`
  - POST to `/services/data/v59.0/sobjects/Opportunity`
  - Required: Name, StageName, CloseDate, RecordTypeId
  - Uses Membership RecordType: `0124x000001aYWcAAM`
  - Returns: Opportunity ID

- [ ] `async getContactById(id: string): Promise<Contact>`
  - GET from `/services/data/v59.0/sobjects/Contact/{id}`

- [ ] `async queryContactByEmail(email: string): Promise<Contact>`
  - SOQL: `SELECT Id, FirstName, LastName, Email FROM Contact WHERE Email='user@example.com'`

**Error Handling**:
- [ ] Catch Salesforce API errors
- [ ] Return meaningful error messages
- [ ] Handle token expiration (refresh and retry)
- [ ] Handle invalid request data (validation errors)

### Phase 4: Clerk Token Verification Middleware

**File**: `backend/src/middleware/auth.ts`

**Functionality**:
- [ ] Extract Clerk token from `Authorization` header
- [ ] Verify token is valid
- [ ] Extract user ID from token
- [ ] Add user info to request object
- [ ] Return 401 if token invalid
- [ ] Allow requests without auth for health check

**Token Format**:
```
Authorization: Bearer CLERK_TOKEN
```

### Phase 5: API Routes

**File**: `backend/src/routes/salesforce.ts`

**Endpoints**:

#### POST `/api/salesforce/contacts`
- [ ] **Authentication**: Required (Clerk token)
- [ ] **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "city": "Denver",
    "state": "Colorado"
  }
  ```
- [ ] **Response** (201):
  ```json
  {
    "id": "SF_CONTACT_ID",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "city": "Denver",
    "state": "Colorado"
  }
  ```
- [ ] **Error** (400/500):
  ```json
  {
    "error": "Descriptive error message",
    "details": "Additional error info"
  }
  ```

#### POST `/api/salesforce/opportunities`
- [ ] **Authentication**: Required (Clerk token)
- [ ] **Request Body**:
  ```json
  {
    "name": "Membership - John Doe",
    "contactId": "SF_CONTACT_ID",
    "closeDate": "2025-12-31"
  }
  ```
- [ ] **Response** (201):
  ```json
  {
    "id": "SF_OPPORTUNITY_ID",
    "name": "Membership - John Doe"
  }
  ```

#### GET `/api/salesforce/contacts/:id`
- [ ] **Authentication**: Required (Clerk token)
- [ ] **Response** (200):
  ```json
  {
    "id": "SF_CONTACT_ID",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
  ```

#### GET `/api/health`
- [ ] **Authentication**: NOT required
- [ ] **Response** (200):
  ```json
  {
    "status": "ok",
    "timestamp": "2025-12-01T12:00:00Z"
  }
  ```

### Phase 6: Clerk User Deletion (Rollback)

**File**: `backend/src/middleware/clerk.ts` (new)

**Functionality**:
- [ ] POST endpoint: `DELETE /api/clerk/users/:userId`
- [ ] Authentication: Required (internal use only)
- [ ] Calls Clerk API to delete user
- [ ] Used when Salesforce creation fails
- [ ] Error handling if deletion fails

**Implementation Note**:
- Uses `@clerk/backend` SDK
- Requires `CLERK_SECRET_KEY` from Clerk dashboard
- This is for backend use only (different from frontend key)

### Phase 7: Express Server Setup

**File**: `backend/src/server.ts`

**Configuration**:
- [ ] Express app on port 3000
- [ ] CORS enabled for http://localhost:8081
- [ ] Body parser for JSON
- [ ] Environment variables loaded from `.env.local`
- [ ] Error handling middleware
- [ ] Request logging
- [ ] Routes:
  - `/api/salesforce/*` → salesforce routes
  - `/api/clerk/*` → clerk routes
  - `/api/health` → health check

**Start Command**:
```bash
cd backend
npm run dev
```

---

## Environment Variables Required

**Backend `.env.local`**:
```
# Salesforce Integration User Credentials
SF_INTEGRATION_USER_USERNAME=webapp.integration@pisgaharea.dev
SF_INTEGRATION_USER_PASSWORD=temporary_password_from_salesforce

# Salesforce OAuth (Connected App)
SF_CLIENT_ID=your_consumer_key_here
SF_CLIENT_SECRET=your_consumer_secret_here
SF_LOGIN_URL=https://test.salesforce.com

# Backend Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8081

# Clerk (for user deletion)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Logging
LOG_LEVEL=debug
```

**Frontend `.env.local`** (already exists):
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000
```

---

## Installation & Setup

**User Will Do**:
```bash
# In Salesforce, after creating Integration User and Connected App

# Set up backend
cd /Users/jbwmson/Agent/PAS\ Membership\ App
mkdir -p backend/src/{routes,services,middleware,utils}

# Create backend/.env.local with:
# - SF_INTEGRATION_USER_USERNAME
# - SF_INTEGRATION_USER_PASSWORD
# - SF_CLIENT_ID (Consumer Key)
# - SF_CLIENT_SECRET (Consumer Secret)
# - CLERK_SECRET_KEY

# Install dependencies
cd backend
npm install
npm run dev
```

---

## Testing Against Real Salesforce

**Manual Smoke Test Scenarios**:

### Scenario 1: Successful Contact Creation
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev` (in root)
3. Go to http://localhost:8081
4. Click "Create Account"
5. Fill in form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: (555) 123-4567
   - City: Denver
   - State: Colorado
   - Password: Test@123456
6. Click GO!
7. Verify:
   - [ ] Clerk user created (check Clerk dashboard)
   - [ ] Salesforce Contact created (check SF sandbox)
   - [ ] Redirected to /my-account
   - [ ] No errors displayed

### Scenario 2: Phone Validation
1. Fill form with invalid phone: "123"
2. Click elsewhere to blur
3. Verify: Red border and error message
4. Fix phone: "5551234567"
5. Verify: Error disappears

### Scenario 3: Salesforce API Failure
1. Stop backend
2. Fill form correctly
3. Click GO!
4. Verify:
   - [ ] Clerk user deleted (no orphaned accounts)
   - [ ] Error shown to user: "Failed to create your profile"
   - [ ] User can retry after restarting backend

### Scenario 4: Optional Fields
1. Fill ONLY required fields (no phone/city/state)
2. Submit
3. Verify: Salesforce Contact created with only required fields

---

## Development Notes

### Key Decisions
- **Membership RecordType ID**: `0124x000001aYWcAAM` (hardcoded, can make configurable later)
- **API Version**: v59.0 (current Salesforce API version)
- **Authentication**: OAuth 2.0 with username/password grant (Resource Owner Password Credentials)
- **Token Caching**: In-memory with TTL (no database)
- **Error Handling**: All errors logged to console, meaningful messages to client

### Potential Issues & Solutions
1. **Salesforce rate limiting**: Add retry logic with exponential backoff
2. **Token expiration**: Implement refresh token logic automatically
3. **Integration User permissions**: Ensure user has Contact/Opportunity CRUD rights
4. **CORS errors**: Ensure CORS_ORIGIN in backend `.env` matches frontend URL
5. **Clerk secret key**: Must use BACKEND secret key, not frontend publishable key

### Future Improvements
- [ ] Add database to store sync status
- [ ] Implement async contact creation (queue if fails)
- [ ] Add request validation middleware
- [ ] Add API rate limiting
- [ ] Add request/response logging
- [ ] Add Salesforce API error handling specifics
- [ ] Create Salesforce Contact lookup by email (prevent duplicates)

---

## Success Criteria - Phase Complete

Backend implementation is complete when:
- [ ] All endpoints respond correctly
- [ ] Clerk token verification works
- [ ] Salesforce Contact creation works with real credentials
- [ ] Salesforce authentication and token refresh works
- [ ] Error handling shows meaningful messages
- [ ] Manual smoke test passes all scenarios
- [ ] No orphaned accounts on failure (rollback works)
- [ ] All tests pass (npm test:run)
- [ ] Code committed to GitHub

---

## Timeline Estimate

- **Phase 1-2 (Setup & Auth)**: 1 session
- **Phase 3-5 (Services & Routes)**: 1 session
- **Phase 6-7 (Clerk & Server)**: 1 session
- **Testing & Debugging**: 1 session
- **Total**: 4 sessions (or 1-2 intensive sessions)

---

**Ready to begin backend implementation!**
