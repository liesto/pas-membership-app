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

  // Delete Clerk user endpoint
  http.delete('http://localhost:3000/api/clerk/users/:userId', () => {
    // Simulate successful user deletion
    return HttpResponse.json({ success: true }, { status: 200 });
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
