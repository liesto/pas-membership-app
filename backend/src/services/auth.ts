import axios from 'axios';

interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  instance_url: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
  instanceUrl: string;
}

let cachedToken: CachedToken | null = null;

/**
 * Get Salesforce access token using OAuth 2.0 Resource Owner Password Credentials flow
 */
export async function getSalesforceAccessToken(): Promise<string> {
  // Check if cached token is still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('Using cached Salesforce access token');
    return cachedToken.token;
  }

  console.log('Requesting new Salesforce access token...');

  const loginUrl = process.env.SF_LOGIN_URL || 'https://test.salesforce.com';
  return getAccessTokenViaOAuth(loginUrl);
}

/**
 * Get Salesforce access token using Resource Owner Password Credentials flow
 */
async function getAccessTokenViaOAuth(loginUrl: string): Promise<string> {
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const username = process.env.SF_INTEGRATION_USER_USERNAME;
  const password = process.env.SF_INTEGRATION_USER_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error(
      'Missing OAuth credentials: SF_CLIENT_ID, SF_CLIENT_SECRET, SF_INTEGRATION_USER_USERNAME, SF_INTEGRATION_USER_PASSWORD'
    );
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post<AuthTokenResponse>(
      `${loginUrl}/services/oauth2/token`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in, instance_url } = response.data;

    // Cache token with 5-minute buffer before expiration
    cachedToken = {
      token: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - 300000,
      instanceUrl: instance_url,
    };

    console.log(`Got Salesforce access token via OAuth (expires in ${expires_in}s)`);
    console.log(`Instance URL: ${instance_url}`);
    return access_token;
  } catch (error: any) {
    console.error('OAuth authentication error:', error.response?.data || error.message);
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
  const apiVersion = process.env.SF_API_VERSION || '59.0';

  const accessToken = await getSalesforceAccessToken();

  // Use instance URL from cached token (returned by Salesforce OAuth)
  if (!cachedToken?.instanceUrl) {
    throw new Error('Salesforce instance URL not available');
  }

  const url = `${cachedToken.instanceUrl}/services/data/v${apiVersion}${endpoint}`;
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
