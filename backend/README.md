# PAS Membership App - Backend Server

Backend API server for the PAS Membership App. Handles Salesforce integration and Clerk user management for the CreateAccount flow.

## Overview

This is a Node.js/Express server that:
1. **Authenticates to Salesforce** using Integration User credentials
2. **Creates Contact records** in Salesforce when users sign up
3. **Manages user deletions** for rollback on failures
4. **Verifies Clerk tokens** from the frontend

## Quick Start

### Prerequisites

You need to have set up in Salesforce:
1. **Integration User Account** with Contact/Opportunity CRUD permissions
2. **Connected App** with OAuth 2.0 enabled (Consumer Key & Secret)
3. **Membership RecordType ID** for Opportunities: `0124x000001aYWcAAM`

### Installation

```bash
# Install dependencies
npm install

# Copy example env file
cp .env.local.example .env.local

# Edit .env.local with your credentials
nano .env.local

# Start server
npm run dev
```

### Environment Variables

Create `.env.local` file in backend directory:

```bash
# Salesforce Integration User Credentials
SF_INTEGRATION_USER_USERNAME=webapp.integration@pisgaharea.dev
SF_INTEGRATION_USER_PASSWORD=your_temporary_password

# Salesforce OAuth (from Connected App)
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret
SF_LOGIN_URL=https://test.salesforce.com

# Salesforce API Configuration
SF_API_VERSION=59.0
SF_MEMBERSHIP_RECORD_TYPE_ID=0124x000001aYWcAAM

# Backend Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8081

# Clerk (for user deletion - BACKEND SECRET KEY)
CLERK_SECRET_KEY=your_clerk_backend_secret_key

# Logging
LOG_LEVEL=debug
```

## Development

### Scripts

```bash
npm run dev       # Run development server with hot reload
npm run build     # Build TypeScript to JavaScript
npm run start     # Run production build
```

### Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── services/
│   │   ├── auth.ts            # Salesforce authentication
│   │   └── salesforce.ts      # Salesforce API client
│   ├── routes/
│   │   ├── salesforce.ts      # Salesforce API endpoints
│   │   └── clerk.ts           # Clerk user endpoints
│   └── middleware/
│       └── auth.ts            # Clerk token verification
├── package.json
├── tsconfig.json
├── .env.local.example
└── README.md
```

## API Endpoints

### Health Check
```
GET /api/health

Response (200):
{
  "status": "ok",
  "timestamp": "2025-12-01T12:00:00Z"
}
```

### Salesforce - Create Contact
```
POST /api/salesforce/contacts
Authorization: Bearer CLERK_TOKEN

Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "city": "Denver",
  "state": "Colorado"
}

Response (201):
{
  "Id": "0031700000IZ3TAAW",
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john@example.com",
  "Phone": "123-456-7890",
  "City": "Denver",
  "State": "Colorado"
}
```

### Salesforce - Get Contact
```
GET /api/salesforce/contacts/:id
Authorization: Bearer CLERK_TOKEN

Response (200):
{
  "Id": "0031700000IZ3TAAW",
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john@example.com"
}
```

### Salesforce - Query Contact by Email
```
GET /api/salesforce/contacts/email/:email
Authorization: Bearer CLERK_TOKEN

Response (200):
{
  "Id": "0031700000IZ3TAAW",
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john@example.com"
}
```

### Salesforce - Create Opportunity
```
POST /api/salesforce/opportunities
Authorization: Bearer CLERK_TOKEN

Request:
{
  "name": "Membership - John Doe",
  "contactId": "0031700000IZ3TAAW",
  "closeDate": "2025-12-31"
}

Response (201):
{
  "Id": "0061700000IZ3TAAW",
  "Name": "Membership - John Doe",
  "StageName": "Open"
}
```

### Salesforce - Query Opportunities
```
GET /api/salesforce/opportunities/:contactId
Authorization: Bearer CLERK_TOKEN

Response (200):
[
  {
    "Id": "0061700000IZ3TAAW",
    "Name": "Membership - John Doe",
    "StageName": "Open"
  }
]
```

### Clerk - Delete User (for rollback)
```
DELETE /api/clerk/users/:userId
Authorization: Bearer CLERK_TOKEN

Response (200):
{
  "success": true,
  "message": "User 12345 deleted"
}
```

## Error Handling

All errors return JSON with error description:

```json
{
  "error": "Descriptive error message"
}
```

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | Request missing required fields |
| 401 | Missing or invalid Authorization header | No Clerk token provided |
| 401 | Invalid authentication token | Clerk token is invalid |
| 404 | Not found | Resource not found in Salesforce |
| 500 | Salesforce API error | Issue with Salesforce connection |

## Troubleshooting

### Salesforce Connection Fails

**Check:**
1. Integration User username and password are correct
2. Integration User has Contact/Opportunity CRUD permissions
3. Connected App Consumer Key & Secret are correct
4. Salesforce sandbox is accessible (test.salesforce.com)

**Test:**
```bash
# Check if Salesforce connection works
curl http://localhost:3000/api/health
```

### CORS Errors

**Check:**
1. `CORS_ORIGIN` in `.env.local` matches frontend URL
2. Frontend is running on the correct port
3. Authorization header is being sent correctly

### Token Expiration

The server automatically:
1. Caches Salesforce tokens with 5-minute buffer
2. Refreshes tokens before they expire
3. Returns new tokens on each request

## Development Tips

### Enable Debug Logging
Set `LOG_LEVEL=debug` in `.env.local`

### Test Salesforce Connection
The server automatically tests Salesforce connection on startup and logs the result.

### Check Active Connections
```bash
# See what endpoints are being hit
npm run dev

# Look for request logging in output
```

## Production Deployment

Before deploying to production:

1. **Change environment variables**:
   - Set `NODE_ENV=production`
   - Use production Salesforce URL instead of sandbox
   - Update `CORS_ORIGIN` to production domain

2. **Update Connected App**:
   - Change callback URL to production domain
   - Add production domain to CORS origins

3. **Security**:
   - Store secrets in secure environment variables
   - Rotate Integration User password regularly
   - Implement rate limiting on endpoints
   - Add request validation middleware
   - Enable HTTPS only

4. **Monitoring**:
   - Setup error logging (Sentry, etc.)
   - Monitor Salesforce API rate limits
   - Setup uptime monitoring

## Resources

- [Express Documentation](https://expressjs.com/)
- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [Clerk Backend SDK](https://clerk.com/docs/backend-requests)
- [Axios HTTP Client](https://axios-http.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs with `npm run dev`
3. Test endpoints with curl or Postman
4. Check Salesforce sandbox for data consistency
