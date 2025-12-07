import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import salesforceRouter from '../../routes/salesforce';
import * as salesforceService from '../../services/salesforce';
import * as clerkService from '../../services/clerk';
import { requireAuth } from '../../middleware/auth';

// Mock the services
vi.mock('../../services/salesforce');
vi.mock('../../services/clerk');

// Mock the auth middleware
vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req, res, next) => {
    // Check if Authorization header is present
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.clerkToken = req.headers.authorization.substring(7);
    next();
  }),
}));

describe('Salesforce Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/salesforce', salesforceRouter);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/salesforce/contacts', () => {
    it('should create a contact with valid data', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
        Phone: '555-1234',
        MailingCity: 'Asheville',
        MailingState: 'NC',
      };

      vi.mocked(salesforceService.createContact).mockResolvedValue(mockContact as any);

      // Act
      const response = await request(app)
        .post('/api/salesforce/contacts')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          city: 'Asheville',
          state: 'NC',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockContact);
      expect(salesforceService.createContact).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        city: 'Asheville',
        state: 'NC',
      });
    });

    it('should create a contact with only required fields', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_456',
        FirstName: 'Jane',
        LastName: 'Smith',
        Email: 'jane@example.com',
      };

      vi.mocked(salesforceService.createContact).mockResolvedValue(mockContact as any);

      // Act
      const response = await request(app)
        .post('/api/salesforce/contacts')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockContact);
    });

    it('should return 400 when firstName is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/contacts')
        .send({
          lastName: 'Doe',
          email: 'john@example.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: firstName, lastName, email');
    });

    it('should return 400 when lastName is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/contacts')
        .send({
          firstName: 'John',
          email: 'john@example.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: firstName, lastName, email');
    });

    it('should return 400 when email is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/contacts')
        .send({
          firstName: 'John',
          lastName: 'Doe',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: firstName, lastName, email');
    });

    it('should return 500 when Salesforce service fails', async () => {
      // Arrange
      vi.mocked(salesforceService.createContact).mockRejectedValue(
        new Error('Salesforce API error')
      );

      // Act
      const response = await request(app)
        .post('/api/salesforce/contacts')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Salesforce API error');
    });
  });

  describe('GET /api/salesforce/contacts/:id', () => {
    it('should get a contact by ID when authenticated', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
        Phone: '555-1234',
      };

      vi.mocked(salesforceService.getContactById).mockResolvedValue(mockContact as any);

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/contact_123')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContact);
      expect(salesforceService.getContactById).toHaveBeenCalledWith('contact_123');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/salesforce/contacts/contact_123');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 500 when Salesforce service fails', async () => {
      // Arrange
      vi.mocked(salesforceService.getContactById).mockRejectedValue(
        new Error('Contact not found in Salesforce')
      );

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/invalid_id')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Contact not found in Salesforce');
    });
  });

  describe('GET /api/salesforce/contacts/email/:email', () => {
    it('should get a contact by email when authenticated', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      vi.mocked(salesforceService.getContactByEmail).mockResolvedValue(mockContact as any);

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/email/john@example.com')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContact);
      expect(salesforceService.getContactByEmail).toHaveBeenCalledWith('john@example.com');
    });

    it('should return 404 when contact is not found', async () => {
      // Arrange
      vi.mocked(salesforceService.getContactByEmail).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/email/notfound@example.com')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/salesforce/contacts/email/john@example.com');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 500 when Salesforce service fails', async () => {
      // Arrange
      vi.mocked(salesforceService.getContactByEmail).mockRejectedValue(
        new Error('Salesforce query error')
      );

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/email/test@example.com')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Salesforce query error');
    });
  });

  describe('GET /api/salesforce/contacts/clerk/:clerkUserId', () => {
    it('should get a contact by Clerk User ID when authenticated', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
        Clerk_User_ID__c: 'user_clerk123',
      };

      vi.mocked(salesforceService.getContactByClerkUserId).mockResolvedValue(mockContact as any);

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/clerk/user_clerk123')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContact);
      expect(salesforceService.getContactByClerkUserId).toHaveBeenCalledWith('user_clerk123');
    });

    it('should return 404 when contact is not found', async () => {
      // Arrange
      vi.mocked(salesforceService.getContactByClerkUserId).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/clerk/user_invalid')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/salesforce/contacts/clerk/user_clerk123');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 500 when Salesforce service fails', async () => {
      // Arrange
      vi.mocked(salesforceService.getContactByClerkUserId).mockRejectedValue(
        new Error('Query failed')
      );

      // Act
      const response = await request(app)
        .get('/api/salesforce/contacts/clerk/user_test')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Query failed');
    });
  });

  describe('POST /api/salesforce/opportunities', () => {
    it('should create an opportunity with valid data when authenticated', async () => {
      // Arrange
      const mockOpportunity = {
        Id: 'opp_123',
        Name: 'Test Membership',
        StageName: 'Open',
      };

      vi.mocked(salesforceService.createOpportunity).mockResolvedValue(mockOpportunity as any);

      // Act
      const response = await request(app)
        .post('/api/salesforce/opportunities')
        .set('Authorization', 'Bearer test_token')
        .send({
          name: 'Test Membership',
          contactId: 'contact_123',
          closeDate: '2024-12-31',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockOpportunity);
      expect(salesforceService.createOpportunity).toHaveBeenCalledWith({
        name: 'Test Membership',
        contactId: 'contact_123',
        closeDate: '2024-12-31',
      });
    });

    it('should return 400 when name is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/opportunities')
        .set('Authorization', 'Bearer test_token')
        .send({
          contactId: 'contact_123',
          closeDate: '2024-12-31',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: name, closeDate');
    });

    it('should return 400 when closeDate is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/opportunities')
        .set('Authorization', 'Bearer test_token')
        .send({
          name: 'Test Membership',
          contactId: 'contact_123',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: name, closeDate');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/opportunities')
        .send({
          name: 'Test Membership',
          closeDate: '2024-12-31',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 500 when Salesforce service fails', async () => {
      // Arrange
      vi.mocked(salesforceService.createOpportunity).mockRejectedValue(
        new Error('Failed to create opportunity')
      );

      // Act
      const response = await request(app)
        .post('/api/salesforce/opportunities')
        .set('Authorization', 'Bearer test_token')
        .send({
          name: 'Test Membership',
          closeDate: '2024-12-31',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create opportunity');
    });
  });

  describe('GET /api/salesforce/opportunities/:contactId', () => {
    it('should get opportunities for a contact when authenticated', async () => {
      // Arrange
      const mockOpportunities = [
        {
          Id: 'opp_123',
          Name: 'Membership 2024',
          StageName: 'Closed Won',
        },
        {
          Id: 'opp_456',
          Name: 'Membership 2023',
          StageName: 'Closed Won',
        },
      ];

      vi.mocked(salesforceService.getOpportunitiesByContactId).mockResolvedValue(mockOpportunities as any);

      // Act
      const response = await request(app)
        .get('/api/salesforce/opportunities/contact_123')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOpportunities);
      expect(salesforceService.getOpportunitiesByContactId).toHaveBeenCalledWith('contact_123');
    });

    it('should return empty array when no opportunities found', async () => {
      // Arrange
      vi.mocked(salesforceService.getOpportunitiesByContactId).mockResolvedValue([]);

      // Act
      const response = await request(app)
        .get('/api/salesforce/opportunities/contact_123')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app).get('/api/salesforce/opportunities/contact_123');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 500 when Salesforce service fails', async () => {
      // Arrange
      vi.mocked(salesforceService.getOpportunitiesByContactId).mockRejectedValue(
        new Error('Query failed')
      );

      // Act
      const response = await request(app)
        .get('/api/salesforce/opportunities/contact_123')
        .set('Authorization', 'Bearer test_token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Query failed');
    });
  });

  describe('POST /api/salesforce/membership', () => {
    it('should create complete membership with contact, opportunity, and Clerk user', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        AccountId: 'account_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      const mockOpportunity = {
        Id: 'opp_123',
        Name: 'John Doe - Silver 01/15/2024',
        Amount: 75,
        StageName: 'Closed Won',
        CloseDate: '2024-01-15',
        MembershipStartDate: '2024-01-15',
        MembershipEndDate: '2025-01-15',
      };

      const mockClerkUserId = 'user_clerk123';

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockResolvedValue(mockOpportunity as any);
      vi.mocked(clerkService.createClerkUser).mockResolvedValue(mockClerkUserId);
      vi.mocked(salesforceService.updateContactClerkUserId).mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          mailingStreet: '123 Main St',
          mailingCity: 'Asheville',
          mailingState: 'NC',
          mailingPostalCode: '28801',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
          stripeCustomerId: 'cus_123',
          stripePaymentId: 'pi_123',
          stripePaymentMethodId: 'pm_123',
          stripeNetAmount: 72.50,
          stripeProcessingFees: 2.50,
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.clerkUserCreated).toBe(true);
      expect(response.body.contact).toEqual({
        id: 'contact_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        accountId: 'account_123',
        clerkUserId: 'user_clerk123',
      });
      expect(response.body.opportunity).toEqual({
        id: 'opp_123',
        name: 'John Doe - Silver 01/15/2024',
        amount: 75,
        membershipStartDate: '2024-01-15',
        membershipEndDate: '2025-01-15',
      });

      expect(salesforceService.createMembershipContact).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        mailingStreet: '123 Main St',
        mailingCity: 'Asheville',
        mailingState: 'NC',
        mailingPostalCode: '28801',
        emailOptIn: true,
        stripeCustomerId: 'cus_123',
      });

      expect(salesforceService.createMembershipOpportunity).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        membershipLevel: 'Silver',
        membershipTerm: 'Year',
        contactId: 'contact_123',
        accountId: 'account_123',
        stripePaymentId: 'pi_123',
        stripePaymentMethodId: 'pm_123',
        stripeNetAmount: 72.50,
        stripeProcessingFees: 2.50,
      });

      expect(clerkService.createClerkUser).toHaveBeenCalledWith('john@example.com', 'John', 'Doe');
      expect(salesforceService.updateContactClerkUserId).toHaveBeenCalledWith('contact_123', 'user_clerk123');
    });

    it('should create membership with only required fields', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_456',
        AccountId: 'account_456',
        FirstName: 'Jane',
        LastName: 'Smith',
        Email: 'jane@example.com',
      };

      const mockOpportunity = {
        Id: 'opp_456',
        Name: 'Jane Smith - Bronze 01/15/2024',
        Amount: 35,
        StageName: 'Closed Won',
        CloseDate: '2024-01-15',
        MembershipStartDate: '2024-01-15',
        MembershipEndDate: '2024-02-15',
      };

      const mockClerkUserId = 'user_clerk456';

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockResolvedValue(mockOpportunity as any);
      vi.mocked(clerkService.createClerkUser).mockResolvedValue(mockClerkUserId);
      vi.mocked(salesforceService.updateContactClerkUserId).mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          emailOptIn: false,
          membershipLevel: 'bronze',
          membershipTerm: 'monthly',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when firstName is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: firstName, lastName, email');
    });

    it('should return 400 when lastName is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: firstName, lastName, email');
    });

    it('should return 400 when email is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: firstName, lastName, email');
    });

    it('should return 400 when membershipLevel is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: membershipLevel, membershipTerm');
    });

    it('should return 400 when membershipTerm is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: membershipLevel, membershipTerm');
    });

    it('should return 400 when emailOptIn is not a boolean', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: 'yes',
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('emailOptIn must be a boolean');
    });

    it('should return 400 when membershipLevel is invalid', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'platinum',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid membershipLevel. Must be bronze, silver, or gold');
    });

    it('should return 400 when membershipTerm is invalid', async () => {
      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'quarterly',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid membershipTerm. Must be monthly or annual');
    });

    it('should handle contact creation failure and return 500 with stage info', async () => {
      // Arrange
      vi.mocked(salesforceService.createMembershipContact).mockRejectedValue(
        new Error('Contact creation failed')
      );

      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Contact creation failed');
      expect(response.body.stage).toBe('contact');
    });

    it('should handle opportunity creation failure and return 500 with contactId', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        AccountId: 'account_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockRejectedValue(
        new Error('Opportunity creation failed')
      );

      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Opportunity creation failed');
      expect(response.body.stage).toBe('opportunity');
      expect(response.body.contactId).toBe('contact_123');
    });

    it('should succeed even if Clerk user creation fails', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        AccountId: 'account_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      const mockOpportunity = {
        Id: 'opp_123',
        Name: 'John Doe - Silver 01/15/2024',
        Amount: 75,
        StageName: 'Closed Won',
        CloseDate: '2024-01-15',
        MembershipStartDate: '2024-01-15',
        MembershipEndDate: '2025-01-15',
      };

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockResolvedValue(mockOpportunity as any);
      vi.mocked(clerkService.createClerkUser).mockRejectedValue(
        new Error('Clerk API error')
      );

      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.clerkUserCreated).toBe(false);
      expect(response.body.contact.clerkUserId).toBeNull();
    });

    it('should succeed even if Contact update with Clerk ID fails', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        AccountId: 'account_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      const mockOpportunity = {
        Id: 'opp_123',
        Name: 'John Doe - Silver 01/15/2024',
        Amount: 75,
        StageName: 'Closed Won',
        CloseDate: '2024-01-15',
        MembershipStartDate: '2024-01-15',
        MembershipEndDate: '2025-01-15',
      };

      const mockClerkUserId = 'user_clerk123';

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockResolvedValue(mockOpportunity as any);
      vi.mocked(clerkService.createClerkUser).mockResolvedValue(mockClerkUserId);
      vi.mocked(salesforceService.updateContactClerkUserId).mockRejectedValue(
        new Error('Update failed')
      );

      // Act
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.clerkUserCreated).toBe(true);
      expect(response.body.contact.clerkUserId).toBe('user_clerk123');
    });

    it('should handle all membership levels correctly', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        AccountId: 'account_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      const mockOpportunity = {
        Id: 'opp_123',
        Name: 'John Doe - Gold 01/15/2024',
        Amount: 125,
        StageName: 'Closed Won',
        CloseDate: '2024-01-15',
        MembershipStartDate: '2024-01-15',
        MembershipEndDate: '2025-01-15',
      };

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockResolvedValue(mockOpportunity as any);
      vi.mocked(clerkService.createClerkUser).mockResolvedValue('user_clerk123');
      vi.mocked(salesforceService.updateContactClerkUserId).mockResolvedValue(undefined);

      // Act - Test Gold membership
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'gold',
          membershipTerm: 'annual',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(salesforceService.createMembershipOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          membershipLevel: 'Gold',
        })
      );
    });

    it('should handle both membership terms correctly', async () => {
      // Arrange
      const mockContact = {
        Id: 'contact_123',
        AccountId: 'account_123',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john@example.com',
      };

      const mockOpportunity = {
        Id: 'opp_123',
        Name: 'John Doe - Silver 01/15/2024',
        Amount: 10,
        StageName: 'Closed Won',
        CloseDate: '2024-01-15',
        MembershipStartDate: '2024-01-15',
        MembershipEndDate: '2024-02-15',
      };

      vi.mocked(salesforceService.createMembershipContact).mockResolvedValue(mockContact as any);
      vi.mocked(salesforceService.createMembershipOpportunity).mockResolvedValue(mockOpportunity as any);
      vi.mocked(clerkService.createClerkUser).mockResolvedValue('user_clerk123');
      vi.mocked(salesforceService.updateContactClerkUserId).mockResolvedValue(undefined);

      // Act - Test Monthly term
      const response = await request(app)
        .post('/api/salesforce/membership')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          emailOptIn: true,
          membershipLevel: 'silver',
          membershipTerm: 'monthly',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(salesforceService.createMembershipOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          membershipTerm: 'Month',
        })
      );
    });
  });
});
