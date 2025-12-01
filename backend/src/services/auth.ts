import axios from 'axios';

interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Get Salesforce access token using Integration User credentials
 * Uses OAuth 2.0 Resource Owner Password Credentials grant
 */
export async function getSalesforceAccessToken(): Promise<string> {
  // Check if cached token is still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('Using cached Salesforce access token');
    return cachedToken.token;
  }

  console.log('Requesting new Salesforce access token...');

  const loginUrl = process.env.SF_LOGIN_URL || 'https://test.salesforce.com';
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const username = process.env.SF_INTEGRATION_USER_USERNAME;
  const password = process.env.SF_INTEGRATION_USER_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error(
      'Missing Salesforce credentials. Check your .env.local file.'
    );
  }

  try {
    const response = await axios.post<AuthTokenResponse>(
      `${loginUrl}/services/oauth2/token`,
      {
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;

    // Cache token with 5-minute buffer before expiration
    cachedToken = {
      token: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - 300000,
    };

    console.log(`Got Salesforce access token (expires in ${expires_in}s)`);
    return access_token;
  } catch (error: any) {
    console.error('Salesforce authentication error:', error.response?.data || error.message);
    throw new Error(
      `Failed to authenticate with Salesforce: ${
        error.response?.data?.error_description || error.message
      }`
    );
  }
}

/**
 * Call Salesforce REST API with automatic authentication
 */
export async function callSalesforceApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  const loginUrl = process.env.SF_LOGIN_URL || 'https://test.salesforce.com';
  const apiVersion = process.env.SF_API_VERSION || '59.0';

  const accessToken = await getSalesforceAccessToken();

  const url = `${loginUrl}/services/data/v${apiVersion}${endpoint}`;
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    let response;

    switch (method) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data, config);
        break;
      case 'PATCH':
        response = await axios.patch(url, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
    }

    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error(`Salesforce API error (${method} ${endpoint}):`, errorData);

    // Handle Salesforce-specific error format
    if (Array.isArray(errorData)) {
      const message = errorData[0]?.message || 'Unknown Salesforce API error';
      throw new Error(message);
    }

    throw new Error(
      errorData?.error || errorData?.message || 'Salesforce API error'
    );
  }
}

/**
 * Verify Salesforce connection
 */
export async function verifySalesforceConnection(): Promise<boolean> {
  try {
    const token = await getSalesforceAccessToken();
    return !!token;
  } catch (error) {
    console.error('Failed to verify Salesforce connection:', error);
    return false;
  }
}
