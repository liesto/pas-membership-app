import { callSalesforceApi } from './auth.ts';
import {
  getCurrentDateEST,
  formatDateForSalesforce,
  formatDateDisplay,
  calculateMembershipEndDate,
} from '../utils/dateHelpers.ts';
import {
  calculateMembershipPrice,
  type MembershipLevel,
  type MembershipTerm,
} from '../utils/pricing.ts';

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface Contact {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingZipCode?: string;
  MailingCountry?: string;
}

export interface CreateOpportunityRequest {
  name: string;
  contactId?: string;
  closeDate: string;
}

export interface Opportunity {
  Id: string;
  Name: string;
  StageName: string;
}

/**
 * Create a Contact in Salesforce
 */
export async function createContact(
  data: CreateContactRequest
): Promise<Contact & { Id: string }> {
  console.log('Creating Salesforce Contact:', data.email);

  const payload: any = {
    FirstName: data.firstName,
    LastName: data.lastName,
    Email: data.email,
  };

  // Add optional fields if provided
  if (data.phone) {
    payload.Phone = data.phone;
  }

  // Map city and state to Salesforce mailing address fields
  if (data.city) {
    payload.MailingCity = data.city;
  }

  if (data.state) {
    payload.MailingState = data.state;
  }

  try {
    const result = await callSalesforceApi('POST', '/sobjects/Contact/', payload);

    console.log('Contact created successfully:', result.id);

    // Return the created contact data
    return {
      Id: result.id,
      FirstName: data.firstName,
      LastName: data.lastName,
      Email: data.email,
      Phone: data.phone,
      MailingCity: data.city,
      MailingState: data.state,
    };
  } catch (error: any) {
    console.error('Failed to create contact:', error.message);
    throw new Error(`Failed to create Salesforce contact: ${error.message}`);
  }
}

/**
 * Get Contact by Email
 */
export async function getContactByEmail(email: string): Promise<Contact | null> {
  console.log('Querying Contact by email:', email);

  try {
    const query = `SELECT Id, FirstName, LastName, Email, Phone, MailingStreet, MailingCity, MailingState, MailingZipCode, MailingCountry FROM Contact WHERE Email='${email}' LIMIT 1`;
    const result = await callSalesforceApi(
      'GET',
      `/query?q=${encodeURIComponent(query)}`
    );

    if (result.records && result.records.length > 0) {
      console.log('Contact found:', result.records[0].Id);
      return result.records[0];
    }

    console.log('Contact not found:', email);
    return null;
  } catch (error: any) {
    console.error('Failed to query contact:', error.message);
    throw new Error(`Failed to query contact: ${error.message}`);
  }
}

/**
 * Get Contact by ID
 */
export async function getContactById(id: string): Promise<Contact> {
  console.log('Getting Contact:', id);

  try {
    const result = await callSalesforceApi('GET', `/sobjects/Contact/${id}`);
    console.log('Contact retrieved:', result.Id);
    return result;
  } catch (error: any) {
    console.error('Failed to get contact:', error.message);
    throw new Error(`Failed to get contact: ${error.message}`);
  }
}

/**
 * Get Contact by Clerk User ID
 */
export async function getContactByClerkUserId(clerkUserId: string): Promise<any | null> {
  console.log('Querying Contact by Clerk User ID:', clerkUserId);

  try {
    const query = `SELECT Id, FirstName, LastName, Email, Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, Membership_Status__c, npo02__MembershipEndDate__c, npo02__LastMembershipLevel__c, npo02__OppAmountThisYear__c, npo02__OppAmountLastYear__c, Trailwork_Hours_This_Year__c, Trailwork_Hours_Last_Year__c, Trail_Builders_Club__c, Contact_is_Industry_Partner__c, Trail_Crew_Leader__c, Sawyer__c FROM Contact WHERE Clerk_User_ID__c='${clerkUserId}' LIMIT 1`;
    const result = await callSalesforceApi(
      'GET',
      `/query?q=${encodeURIComponent(query)}`
    );

    if (result.records && result.records.length > 0) {
      console.log('Contact found:', result.records[0].Id);
      return result.records[0];
    }

    console.log('Contact not found for Clerk User ID:', clerkUserId);
    return null;
  } catch (error: any) {
    console.error('Failed to query contact by Clerk User ID:', error.message);
    throw new Error(`Failed to query contact: ${error.message}`);
  }
}

/**
 * Create an Opportunity (Membership) in Salesforce
 */
export async function createOpportunity(
  data: CreateOpportunityRequest
): Promise<Opportunity & { Id: string }> {
  const membershipRecordTypeId =
    process.env.SF_MEMBERSHIP_RECORD_TYPE_ID ||
    '0124x000001aYWcAAM';

  console.log('Creating Salesforce Opportunity:', data.name);

  const payload: any = {
    Name: data.name,
    StageName: 'Open',
    CloseDate: data.closeDate,
    RecordTypeId: membershipRecordTypeId,
  };

  try {
    const result = await callSalesforceApi(
      'POST',
      '/sobjects/Opportunity/',
      payload
    );

    console.log('Opportunity created successfully:', result.id);

    return {
      Id: result.id,
      Name: data.name,
      StageName: 'Open',
    };
  } catch (error: any) {
    console.error('Failed to create opportunity:', error.message);
    throw new Error(`Failed to create opportunity: ${error.message}`);
  }
}

/**
 * Query Opportunities for a Contact
 */
export async function getOpportunitiesByContactId(
  contactId: string
): Promise<Opportunity[]> {
  console.log('Querying Opportunities for Contact:', contactId);

  try {
    const query = `SELECT Id, Name, StageName FROM Opportunity WHERE Id IN (SELECT OpportunityId FROM OpportunityContactRole WHERE ContactId='${contactId}')`;
    const result = await callSalesforceApi(
      'GET',
      `/query?q=${encodeURIComponent(query)}`
    );

    console.log('Found opportunities:', result.records?.length || 0);
    return result.records || [];
  } catch (error: any) {
    console.error('Failed to query opportunities:', error.message);
    throw new Error(`Failed to query opportunities: ${error.message}`);
  }
}

/**
 * Membership-specific interfaces and functions
 */

export interface CreateMembershipContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  emailOptIn: boolean;
  stripeCustomerId?: string;
}

export interface MembershipContact extends Contact {
  AccountId?: string;
}

/**
 * Create a Contact in Salesforce for membership signup
 * Maps additional fields beyond basic contact creation
 */
export async function createMembershipContact(
  data: CreateMembershipContactRequest
): Promise<MembershipContact> {
  console.log('[Salesforce] Creating membership contact:', {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    hasPhone: !!data.phone,
    hasAddress: !!(data.mailingStreet || data.mailingCity),
    emailOptIn: data.emailOptIn,
    timestamp: new Date().toISOString(),
  });

  const payload: any = {
    FirstName: data.firstName,
    LastName: data.lastName,
    Email: data.email,
    Email_Opt_In__c: data.emailOptIn ? 'Yes' : 'No',
    PAS_Newsletter__c: data.emailOptIn,
  };

  // Add optional fields if provided
  if (data.phone) {
    payload.Phone = data.phone;
  }

  if (data.mailingStreet) {
    payload.MailingStreet = data.mailingStreet;
  }

  if (data.mailingCity) {
    payload.MailingCity = data.mailingCity;
  }

  if (data.mailingState) {
    payload.MailingState = data.mailingState;
  }

  if (data.mailingPostalCode) {
    payload.MailingPostalCode = data.mailingPostalCode;
  }

  if (data.stripeCustomerId) {
    payload.Stripe_Customer_ID__c = data.stripeCustomerId;
  }

  try {
    const result = await callSalesforceApi('POST', '/sobjects/Contact/', payload);

    console.log('[Salesforce] Contact created successfully:', {
      contactId: result.id,
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    // Fetch the created contact to get AccountId
    const contact = await getContactById(result.id);

    console.log('[Salesforce] Contact retrieved with AccountId:', {
      contactId: contact.Id,
      accountId: contact.AccountId,
      timestamp: new Date().toISOString(),
    });

    return {
      ...contact,
      AccountId: (contact as any).AccountId,
    };
  } catch (error: any) {
    console.error('[Salesforce] Failed to create contact:', {
      email: data.email,
      error: error.message,
      errorDetails: error,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create Salesforce contact: ${error.message}`);
  }
}

export interface CreateMembershipOpportunityRequest {
  firstName: string;
  lastName: string;
  membershipLevel: MembershipLevel;
  membershipTerm: MembershipTerm;
  contactId: string;
  accountId: string;
  stripePaymentId?: string;
  stripePaymentMethodId?: string;
  stripeNetAmount?: number;
  stripeProcessingFees?: number;
}

export interface MembershipOpportunity {
  Id: string;
  Name: string;
  Amount: number;
  StageName: string;
  CloseDate: string;
  MembershipStartDate: string;
  MembershipEndDate: string;
}

/**
 * Create a Membership Opportunity in Salesforce
 * Calculates all required fields based on membership selection
 */
export async function createMembershipOpportunity(
  data: CreateMembershipOpportunityRequest
): Promise<MembershipOpportunity> {
  // Calculate amount
  const amount = calculateMembershipPrice(data.membershipLevel, data.membershipTerm);

  // Get dates in EST
  const today = getCurrentDateEST();
  const todayFormatted = formatDateForSalesforce(today);
  const endDate = calculateMembershipEndDate(today, data.membershipTerm);
  const endDateFormatted = formatDateForSalesforce(endDate);

  // Format opportunity name
  const currentDate = formatDateDisplay(today);
  const opportunityName = `${data.firstName} ${data.lastName} - ${data.membershipLevel} ${currentDate}`;

  // Get environment variables with defaults
  const recordTypeId =
    process.env.SF_MEMBERSHIP_RECORD_TYPE_ID || '0124x000001aYWcAAM';
  const campaignId =
    process.env.SF_CAMPAIGN_ID || '701U700000XmsUbIAJ';

  console.log('[Salesforce] Creating membership opportunity:', {
    opportunityName,
    membershipLevel: data.membershipLevel,
    membershipTerm: data.membershipTerm,
    amount,
    contactId: data.contactId,
    accountId: data.accountId,
    closeDate: todayFormatted,
    startDate: todayFormatted,
    endDate: endDateFormatted,
    timestamp: new Date().toISOString(),
  });

  const payload: any = {
    Name: opportunityName,
    RecordTypeId: recordTypeId,
    npsp__Primary_Contact__c: data.contactId,
    AccountId: data.accountId,
    CloseDate: todayFormatted,
    StageName: 'Closed Won',
    CampaignId: campaignId,
    Type: 'PAS Membership',
    npe01__Membership_Start_Date__c: todayFormatted,
    npe01__Membership_End_Date__c: endDateFormatted,
    npe01__Membership_Origin__c: 'New',
    Membership_Term__c: data.membershipTerm,
    npe01__Member_Level__c: data.membershipLevel,
    Amount: amount,
  };

  // Add Stripe payment fields if provided
  if (data.stripePaymentId) {
    payload.Stripe_Payment_ID__c = data.stripePaymentId;
  }

  if (data.stripePaymentMethodId) {
    payload.Stripe_Payment_Method_ID__c = data.stripePaymentMethodId;
  }

  if (data.stripeNetAmount !== undefined) {
    payload.Stripe_Net_Amount__c = data.stripeNetAmount;
  }

  if (data.stripeProcessingFees !== undefined) {
    payload.Stripe_Processing_Fees__c = data.stripeProcessingFees;
  }

  try {
    const result = await callSalesforceApi(
      'POST',
      '/sobjects/Opportunity/',
      payload
    );

    console.log('[Salesforce] Opportunity created successfully:', {
      opportunityId: result.id,
      opportunityName,
      amount,
      timestamp: new Date().toISOString(),
    });

    return {
      Id: result.id,
      Name: opportunityName,
      Amount: amount,
      StageName: 'Closed Won',
      CloseDate: todayFormatted,
      MembershipStartDate: todayFormatted,
      MembershipEndDate: endDateFormatted,
    };
  } catch (error: any) {
    console.error('[Salesforce] Failed to create opportunity:', {
      opportunityName,
      error: error.message,
      errorDetails: error,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create opportunity: ${error.message}`);
  }
}

/**
 * Update Contact with Clerk User ID
 * @param contactId - Salesforce Contact ID
 * @param clerkUserId - Clerk User ID to store
 */
export async function updateContactClerkUserId(
  contactId: string,
  clerkUserId: string
): Promise<void> {
  console.log('[Salesforce] Updating Contact with Clerk User ID:', {
    contactId,
    clerkUserId,
    timestamp: new Date().toISOString(),
  });

  const payload = {
    Clerk_User_Id__c: clerkUserId,
  };

  try {
    await callSalesforceApi('PATCH', `/sobjects/Contact/${contactId}`, payload);

    console.log('[Salesforce] Contact updated with Clerk User ID:', {
      contactId,
      clerkUserId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Salesforce] Failed to update Contact with Clerk User ID:', {
      contactId,
      clerkUserId,
      error: error.message,
      errorDetails: error,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to update Contact with Clerk User ID: ${error.message}`);
  }
}

/**
 * Update Contact Information
 * @param contactId - Salesforce Contact ID
 * @param data - Contact fields to update
 */
export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  emailOptIn?: boolean;
}

export async function updateContact(
  contactId: string,
  data: UpdateContactRequest
): Promise<Contact> {
  console.log('[Salesforce] Updating Contact:', {
    contactId,
    hasFirstName: !!data.firstName,
    hasLastName: !!data.lastName,
    hasEmail: !!data.email,
    hasAddress: !!(data.mailingStreet || data.mailingCity),
    timestamp: new Date().toISOString(),
  });

  const payload: any = {};

  // Add fields if provided
  if (data.firstName !== undefined) {
    payload.FirstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    payload.LastName = data.lastName;
  }

  if (data.email !== undefined) {
    payload.Email = data.email;
  }

  if (data.phone !== undefined) {
    payload.Phone = data.phone;
  }

  if (data.mailingStreet !== undefined) {
    payload.MailingStreet = data.mailingStreet;
  }

  if (data.mailingCity !== undefined) {
    payload.MailingCity = data.mailingCity;
  }

  if (data.mailingState !== undefined) {
    payload.MailingState = data.mailingState;
  }

  if (data.mailingPostalCode !== undefined) {
    payload.MailingPostalCode = data.mailingPostalCode;
  }

  if (data.emailOptIn !== undefined) {
    payload.Email_Opt_In__c = data.emailOptIn ? 'Yes' : 'No';
    payload.PAS_Newsletter__c = data.emailOptIn;
  }

  try {
    await callSalesforceApi('PATCH', `/sobjects/Contact/${contactId}`, payload);

    console.log('[Salesforce] Contact updated successfully:', {
      contactId,
      timestamp: new Date().toISOString(),
    });

    // Fetch and return the updated contact
    const contact = await getContactById(contactId);
    return contact;
  } catch (error: any) {
    console.error('[Salesforce] Failed to update Contact:', {
      contactId,
      error: error.message,
      errorDetails: error,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to update Contact: ${error.message}`);
  }
}
