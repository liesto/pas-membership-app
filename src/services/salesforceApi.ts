/**
 * Salesforce API Service
 * Handles all communication with Salesforce through the backend API
 */

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface CreateContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SALESFORCE_API = `${API_BASE_URL}/salesforce`;

/**
 * Create a Salesforce Contact record
 * @param contactData - Contact information to create
 * @param token - Optional Clerk authentication token
 * @returns Promise with the created contact data
 * @throws Error if creation fails
 */
export async function createContact(
  contactData: CreateContactRequest,
  token?: string
): Promise<CreateContactResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${SALESFORCE_API}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(contactData),
      credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || `Failed to create contact: ${response.statusText}`);
    }

    return await response.json() as CreateContactResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating contact');
  }
}

/**
 * Test the Salesforce API connection
 * Useful for debugging and initialization
 * @returns Promise that resolves if connection is successful
 */
export async function testSalesforceConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${SALESFORCE_API}/health`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}
