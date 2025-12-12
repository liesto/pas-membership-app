import { http, HttpResponse } from 'msw';

const SALESFORCE_BASE_URL = 'http://localhost:3000/api/salesforce';

export const salesforceHandlers = [
  // Create Contact endpoint
  http.post(`${SALESFORCE_BASE_URL}/contacts`, async ({ request }) => {
    const body = await request.json() as any;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simulate successful contact creation
    return HttpResponse.json(
      {
        id: 'SF_CONTACT_ID_' + Date.now(),
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        city: body.city || null,
        state: body.state || null,
      },
      { status: 201 }
    );
  }),

  // Create Membership endpoint
  http.post(`${SALESFORCE_BASE_URL}/membership`, async ({ request }) => {
    const body = await request.json() as any;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.membershipLevel || !body.membershipTerm) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simulate successful membership creation
    const contactId = 'SF_CONTACT_' + Date.now();
    const opportunityId = 'SF_OPPORTUNITY_' + Date.now();
    const accountId = 'SF_ACCOUNT_' + Date.now();

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (body.membershipTerm === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (body.membershipTerm === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return HttpResponse.json(
      {
        success: true,
        contact: {
          id: contactId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          accountId: accountId,
        },
        opportunity: {
          id: opportunityId,
          name: `${body.firstName} ${body.lastName} - ${body.membershipLevel}`,
          amount: body.membershipLevel === 'bronze' ? (body.membershipTerm === 'annual' ? 50 : 5) :
                  body.membershipLevel === 'silver' ? (body.membershipTerm === 'annual' ? 100 : 10) :
                  (body.membershipTerm === 'annual' ? 250 : 25),
          membershipStartDate: startDate.toISOString().split('T')[0],
          membershipEndDate: endDate.toISOString().split('T')[0],
        },
      },
      { status: 201 }
    );
  }),

  // Delete Clerk user endpoint
  http.delete('http://localhost:3000/api/clerk/users/:userId', () => {
    // Simulate successful user deletion
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Get Contact by Clerk User ID endpoint
  http.get(`${SALESFORCE_BASE_URL}/contacts/clerk/:clerkUserId`, ({ params }) => {
    const { clerkUserId } = params;

    // Simulate user not found
    if (clerkUserId === 'unknown-user-id') {
      return HttpResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Return mock user data
    return HttpResponse.json(
      {
        Id: 'SF_CONTACT_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john.doe@example.com',
        Phone: '5551234567',
        MailingStreet: '123 Main St',
        MailingCity: 'Asheville',
        MailingState: 'NC',
        MailingPostalCode: '28801',
        Membership_Status__c: 'Current',
        npo02__MembershipEndDate__c: '2025-12-31',
        npo02__LastMembershipLevel__c: 'Silver',
        npo02__OppAmountThisYear__c: 100,
        npo02__OppAmountLastYear__c: 100,
        Trailwork_Hours_This_Year__c: 10,
        Trailwork_Hours_Last_Year__c: 8,
        Trail_Builders_Club__c: true,
        Contact_is_Industry_Partner__c: false,
        Trail_Crew_Leader__c: false,
        Sawyer__c: false,
      },
      { status: 200 }
    );
  }),

  // Update Contact endpoint
  http.patch(`${SALESFORCE_BASE_URL}/contacts/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;

    // Simulate contact not found
    if (id === 'invalid-id') {
      return HttpResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Return updated contact data
    return HttpResponse.json(
      {
        Id: id,
        FirstName: body.firstName || 'John',
        LastName: body.lastName || 'Doe',
        Email: body.email || 'john.doe@example.com',
        Phone: body.phone || '5551234567',
        MailingStreet: body.mailingStreet || '123 Main St',
        MailingCity: body.mailingCity || 'Asheville',
        MailingState: body.mailingState || 'NC',
        MailingPostalCode: body.mailingPostalCode || '28801',
      },
      { status: 200 }
    );
  }),
];

// Export handler for simulating Salesforce API errors
export const salesforceErrorHandler = http.post(
  `${SALESFORCE_BASE_URL}/contacts`,
  () => {
    return HttpResponse.json(
      { error: 'Salesforce API error' },
      { status: 500 }
    );
  }
);

// Export handler for simulating membership creation errors
export const membershipErrorHandler = http.post(
  `${SALESFORCE_BASE_URL}/membership`,
  () => {
    return HttpResponse.json(
      { error: 'Failed to create membership', stage: 'contact' },
      { status: 500 }
    );
  }
);

// Export handler for simulating Clerk deletion errors
export const clerkErrorHandler = http.delete(
  'http://localhost:3000/api/clerk/users/:userId',
  () => {
    return HttpResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
);

// Export handler for simulating contact update errors
export const contactUpdateErrorHandler = http.patch(
  `${SALESFORCE_BASE_URL}/contacts/:id`,
  () => {
    return HttpResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
);

// Export handler for simulating contact fetch errors
export const contactFetchErrorHandler = http.get(
  `${SALESFORCE_BASE_URL}/contacts/clerk/:clerkUserId`,
  () => {
    return HttpResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
);
