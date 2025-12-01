# Salesforce OAuth Authentication - Debugging Summary

## Problem Statement

Backend service cannot authenticate with Salesforce sandbox using OAuth 2.0 Resource Owner Password Credentials flow. All OAuth token requests fail with:
```
{"error":"invalid_client_id","error_description":"client identifier invalid"}
```

This error occurs despite:
- Valid sandbox environment (pas-membership-sb, Org ID: 00DU7000009QgG9MAK)
- Salesforce CLI successfully authenticating with the same sandbox
- Multiple connected apps being tested
- Correct username/password credentials for integration user

## Steps Tried

### 1. Initial OAuth Implementation
- Implemented standard Resource Owner Password Credentials flow
- Sent: `grant_type=password&client_id=X&username=Y&password=Z`
- Result: "client identifier invalid"

### 2. Verified Credentials
- Confirmed integration user credentials: `jbwpas@buildabonfire.com.membership`
- Confirmed password: `ck%t*mvYR4z@KJ`
- Tested credentials successfully with Salesforce CLI

### 3. Tested Multiple Connected Apps
- **Salesforce CLI App**:
  - Client ID: `3MVG9aePn9FJJ2ncdojyBqTXzSKYFBWEQwpqRx7d83m50WJXOp1pjDF0qVoYnk6kVSyl8IlIDNpI_lMmsmPtqn`
  - Result: "client identifier invalid"

- **PAS Membership App**:
  - Client ID: `[REDACTED]`
  - Client Secret: `[REDACTED]`
  - Result: "client identifier invalid"

### 4. Attempted With/Without Client Secret
- Tried sending client_secret (PAS Membership App)
- Tried omitting client_secret (Salesforce CLI App - PKCE enabled)
- Both approaches rejected at client ID validation stage

### 5. Direct cURL Testing
- Tested both connected apps directly via cURL with same parameters
- Both returned "client identifier invalid" error
- Confirms issue is not specific to Node.js/axios implementation

### 6. PKCE Implementation Attempt
- Generated PKCE code verifier and challenge
- Attempted to use PKCE authorization code flow
- Issue: PKCE flow requires browser-based redirect, not suitable for backend service

## Key Observations

1. **Salesforce CLI Works**: User confirms Salesforce CLI successfully connects to pas-membership-sb
2. **Sandbox is Valid**: Org ID and environment confirmed working with Salesforce CLI
3. **Both Apps Fail**: Neither the Salesforce CLI app nor PAS Membership App can authenticate
4. **Client ID Rejection**: Salesforce is rejecting the client ID itself, not credentials
5. **Error Consistent**: Same "invalid_client_id" error from both curl and Node.js implementations

## Root Cause Analysis

The "client identifier invalid" error at the client ID validation stage suggests:
- Connected apps may not be properly configured for OAuth token endpoint access
- Client IDs may be incorrectly formatted or from wrong environment
- Salesforce sandbox may have OAuth restrictions on these apps
- Password grant flow may be disabled on the connected apps

## JWT Bearer Flow Workaround - Implementation Status

### Approach Attempted
Implemented JWT Bearer flow (OAuth 2.0 JWT Bearer grant type) as a workaround:
- Generated self-signed certificate (RSA 2048-bit)
- Implemented JWT signing using `jsonwebtoken` package
- Created JWT assertions with proper claims (iss, sub, aud, exp)
- Exchanged JWT for Salesforce access token

### Result
✗ Still returns "client identifier invalid" error

**Important Finding**: The JWT implementation correctly:
- Generates valid JWT assertions
- Sends them to Salesforce token endpoint
- Fails at client ID validation stage (before grant type is even processed)

This indicates the root issue is **not the OAuth flow type**, but rather that **the client ID itself is not recognized by Salesforce in this sandbox**.

## Root Cause Analysis

The consistent "invalid_client_id" error across multiple approaches (OAuth password grant, JWT Bearer, PKCE) strongly suggests:

1. **Connected Apps Not Properly Configured/Activated**
   - Apps may not be visible to Salesforce OAuth token endpoint
   - May not be activated in the sandbox
   - May have wrong configuration

2. **Client IDs Are Incorrect**
   - Client IDs may be from wrong environment
   - May be malformed or corrupted
   - May need to be regenerated

3. **Salesforce Sandbox Restriction**
   - Sandbox may have OAuth restrictions enabled
   - May require specific IP whitelist
   - May require additional OAuth configuration

4. **Authentication Method Mismatch**
   - Salesforce CLI likely uses cached session tokens, not OAuth tokens
   - CLI may bypass standard OAuth entirely
   - Backend service cannot use the same method

## SOLUTION - OAuth Authentication Fixed ✅

### The Real Problem

The issue had two layers:

1. **Consumer Key/Secret Not Registered in OAuth Service** (initial error: `invalid_client_id`)
   - The Consumer Key/Secret visible in Salesforce UI were not yet registered in Salesforce's OAuth token endpoint
   - This happened because the Connected App had been created but the credentials hadn't been fully activated
   - Both OAuth password grant AND JWT Bearer flows failed at the same point (client ID validation), confirming the credentials weren't registered

2. **Missing `client_secret` Parameter** (second error: `invalid_client_credentials`)
   - After regenerating credentials via "Staged Consumer Details" in Salesforce, the OAuth password grant required the `client_secret` parameter to be included in the token request
   - Initial implementation only sent `client_id`, `username`, `password`, and `grant_type`
   - Salesforce rejected this as "invalid client credentials" because the secret wasn't provided

### Solution Steps

#### Step 1: Regenerate Connected App Credentials
1. Navigated to Salesforce Setup → Integrations → Connected Apps → Manage Connected Apps
2. Found "PAS Membership Backend" connected app
3. Located "Staged Consumer Details" section
4. Clicked "Generate" to create new Consumer Key and Secret
5. Salesforce indicated it would take ~10 minutes for credentials to be active in OAuth service
6. New credentials obtained:
   - Consumer Key: `[REDACTED]`
   - Consumer Secret: `[REDACTED]`

#### Step 2: Update Backend Environment Configuration
Updated `/Users/jbwmson/Agent/PAS Membership App/backend/.env.local`:
```
SF_CLIENT_ID=[REDACTED]
SF_CLIENT_SECRET=[REDACTED]
SF_AUTH_METHOD=oauth
```

#### Step 3: Add client_secret to OAuth Implementation
Modified `src/services/auth.ts` - `getAccessTokenViaOAuth()` function (line 132-150):
- Added `SF_CLIENT_SECRET` to required credentials check
- Added `params.append('client_secret', clientSecret);` to the OAuth token request
- Changed validation error message to reflect new required parameter

**Before:**
```typescript
const params = new URLSearchParams();
params.append('grant_type', 'password');
params.append('client_id', clientId);
params.append('username', username);
params.append('password', password);
```

**After:**
```typescript
const params = new URLSearchParams();
params.append('grant_type', 'password');
params.append('client_id', clientId);
params.append('client_secret', clientSecret);
params.append('username', username);
params.append('password', password);
```

#### Step 4: Switched Auth Method
Changed `SF_AUTH_METHOD` from `jwt` back to `oauth` since JWT Bearer flow had issues with the private key encoding in environment variables, and standard OAuth password grant is simpler and more reliable for backend service-to-service authentication.

### Result
✅ Backend now successfully authenticates with Salesforce
- Successfully requests access tokens via OAuth 2.0 Resource Owner Password Credentials flow
- Token caching working with 5-minute expiration buffer
- Backend logs show: `"Got Salesforce access token via OAuth (expires in Xs)"`
- Salesforce connection verification: `✅ Salesforce connection OK`

### Key Learnings

1. **Salesforce Connected App Credentials Have Two States**
   - Initial credentials created in UI are not immediately usable in OAuth
   - Must use "Staged Consumer Details" → "Generate" to create OAuth-enabled credentials
   - New credentials take ~10 minutes to propagate through Salesforce's OAuth service

2. **OAuth Password Grant Requires client_secret**
   - Salesforce OAuth 2.0 password grant flow requires both client_id AND client_secret
   - This is different from some OAuth implementations that allow client_id-only access
   - The client_secret must be included in the token request body/params

3. **JWT Bearer vs OAuth Password Grant for Backend Auth**
   - Both should work in theory, but password grant is simpler when you have standard credentials
   - JWT Bearer requires careful handling of private key encoding in environment variables
   - Password grant is more straightforward: username + password + client credentials
