import { callSalesforceApi } from './auth.js';

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
