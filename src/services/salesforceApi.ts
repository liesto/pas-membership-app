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

/**
 * Get user account data by Clerk User ID
 */
export interface UserAccountData {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingPostalCode?: string;
  Membership_Status__c?: string | null;
  npo02__MembershipEndDate__c?: string | null;
}

export async function getUserAccountData(
  clerkUserId: string,
  token: string
): Promise<UserAccountData> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${SALESFORCE_API}/contacts/clerk/${clerkUserId}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || `Failed to get user data: ${response.statusText}`);
    }

    return await response.json() as UserAccountData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching user data');
  }
}

/**
 * Membership signup interfaces and function
 */

export interface CreateMembershipRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  emailOptIn: boolean;
  membershipLevel: 'bronze' | 'silver' | 'gold';
  membershipTerm: 'monthly' | 'annual';
}

export interface CreateMembershipResponse {
  success: true;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountId: string;
  };
  opportunity: {
    id: string;
    name: string;
    amount: number;
    membershipStartDate: string;
    membershipEndDate: string;
  };
}

/**
 * Create a membership signup (Contact + Opportunity)
 * @param membershipData - Complete membership signup data
 * @param token - Optional Clerk authentication token
 * @returns Promise with contact and opportunity data
 * @throws Error if creation fails at any stage
 */
export async function createMembership(
  membershipData: CreateMembershipRequest,
  token?: string
): Promise<CreateMembershipResponse> {
  console.log('[SalesforceAPI] Creating membership:', {
    email: membershipData.email,
    level: membershipData.membershipLevel,
    term: membershipData.membershipTerm,
    timestamp: new Date().toISOString(),
  });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${SALESFORCE_API}/membership`, {
      method: 'POST',
      headers,
      body: JSON.stringify(membershipData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError & { stage?: string; contactId?: string };
      const errorMessage = errorData.error || `Failed to create membership: ${response.statusText}`;

      console.error('[SalesforceAPI] Membership creation failed:', {
        error: errorMessage,
        stage: errorData.stage,
        contactId: errorData.contactId,
        timestamp: new Date().toISOString(),
      });

      throw new Error(errorMessage);
    }

    const result = await response.json() as CreateMembershipResponse;

    console.log('[SalesforceAPI] Membership created successfully:', {
      contactId: result.contact.id,
      opportunityId: result.opportunity.id,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating membership');
  }
}
