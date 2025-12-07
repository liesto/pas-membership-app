import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import {
  createContact,
  getContactByEmail,
  getContactById,
  getContactByClerkUserId,
  createOpportunity,
  getOpportunitiesByContactId,
  createMembershipContact,
  createMembershipOpportunity,
  updateContactClerkUserId,
  type MembershipLevel,
  type MembershipTerm,
} from '../services/salesforce.ts';
import { createClerkUser } from '../services/clerk.ts';

const router = Router();

/**
 * POST /api/salesforce/contacts
 * Create a new Contact in Salesforce
 * Public endpoint - no auth required for signup flow
 */
router.post(
  '/contacts',
  async (req: AuthenticatedRequest, res) => {
    try {
      const { firstName, lastName, email, phone, city, state } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          error: 'Missing required fields: firstName, lastName, email',
        });
      }

      // Create contact in Salesforce
      const contact = await createContact({
        firstName,
        lastName,
        email,
        phone,
        city,
        state,
      });

      res.status(201).json(contact);
    } catch (error: any) {
      console.error('Create contact error:', error.message);
      res.status(500).json({
        error: error.message || 'Failed to create contact',
      });
    }
  }
);

/**
 * GET /api/salesforce/contacts/:id
 * Get a Contact by ID
 */
router.get(
  '/contacts/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const contact = await getContactById(id);

      res.json(contact);
    } catch (error: any) {
      console.error('Get contact error:', error.message);
      res.status(500).json({
        error: error.message || 'Failed to get contact',
      });
    }
  }
);

/**
 * GET /api/salesforce/contacts/email/:email
 * Get a Contact by Email
 */
router.get(
  '/contacts/email/:email',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { email } = req.params;

      const contact = await getContactByEmail(email);

      if (!contact) {
        return res.status(404).json({
          error: 'Contact not found',
        });
      }

      res.json(contact);
    } catch (error: any) {
      console.error('Query contact error:', error.message);
      res.status(500).json({
        error: error.message || 'Failed to query contact',
      });
    }
  }
);

/**
 * GET /api/salesforce/contacts/clerk/:clerkUserId
 * Get a Contact by Clerk User ID
 */
router.get(
  '/contacts/clerk/:clerkUserId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { clerkUserId } = req.params;

      const contact = await getContactByClerkUserId(clerkUserId);

      if (!contact) {
        return res.status(404).json({
          error: 'Contact not found',
        });
      }

      res.json(contact);
    } catch (error: any) {
      console.error('Query contact by Clerk User ID error:', error.message);
      res.status(500).json({
        error: error.message || 'Failed to query contact',
      });
    }
  }
);

/**
 * POST /api/salesforce/opportunities
 * Create a new Opportunity (Membership) in Salesforce
 */
router.post(
  '/opportunities',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, contactId, closeDate } = req.body;

      // Validate required fields
      if (!name || !closeDate) {
        return res.status(400).json({
          error: 'Missing required fields: name, closeDate',
        });
      }

      // Create opportunity in Salesforce
      const opportunity = await createOpportunity({
        name,
        contactId,
        closeDate,
      });

      res.status(201).json(opportunity);
    } catch (error: any) {
      console.error('Create opportunity error:', error.message);
      res.status(500).json({
        error: error.message || 'Failed to create opportunity',
      });
    }
  }
);

/**
 * GET /api/salesforce/opportunities/:contactId
 * Get Opportunities for a Contact
 */
router.get(
  '/opportunities/:contactId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { contactId } = req.params;

      const opportunities = await getOpportunitiesByContactId(contactId);

      res.json(opportunities);
    } catch (error: any) {
      console.error('Query opportunities error:', error.message);
      res.status(500).json({
        error: error.message || 'Failed to query opportunities',
      });
    }
  }
);

/**
 * POST /api/salesforce/membership
 * Create both Contact and Opportunity for membership signup
 * This is a public endpoint (no requireAuth) for new member signups
 */
router.post('/membership', async (req, res) => {
  console.log('[API] Membership signup request received:', {
    email: req.body.email,
    membershipLevel: req.body.membershipLevel,
    membershipTerm: req.body.membershipTerm,
    timestamp: new Date().toISOString(),
  });

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      mailingStreet,
      mailingCity,
      mailingState,
      mailingPostalCode,
      emailOptIn,
      membershipLevel,
      membershipTerm,
      stripeCustomerId,
      stripePaymentId,
      stripePaymentMethodId,
      stripeNetAmount,
      stripeProcessingFees,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, email',
      });
    }

    if (!membershipLevel || !membershipTerm) {
      return res.status(400).json({
        error: 'Missing required fields: membershipLevel, membershipTerm',
      });
    }

    // Validate emailOptIn is boolean
    if (typeof emailOptIn !== 'boolean') {
      return res.status(400).json({
        error: 'emailOptIn must be a boolean',
      });
    }

    // Transform UI values to Salesforce values
    const levelMap: Record<string, MembershipLevel> = {
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
    };

    const termMap: Record<string, MembershipTerm> = {
      monthly: 'Month',
      annual: 'Year',
    };

    const salesforceMembershipLevel = levelMap[membershipLevel.toLowerCase()];
    const salesforceMembershipTerm = termMap[membershipTerm.toLowerCase()];

    if (!salesforceMembershipLevel) {
      return res.status(400).json({
        error: 'Invalid membershipLevel. Must be bronze, silver, or gold',
      });
    }

    if (!salesforceMembershipTerm) {
      return res.status(400).json({
        error: 'Invalid membershipTerm. Must be monthly or annual',
      });
    }

    // Stage 1: Create Contact
    console.log('[API] Contact creation stage starting...');
    let contact;
    try {
      contact = await createMembershipContact({
        firstName,
        lastName,
        email,
        phone,
        mailingStreet,
        mailingCity,
        mailingState,
        mailingPostalCode,
        emailOptIn,
        stripeCustomerId,
      });
      console.log('[API] Contact created successfully:', {
        contactId: contact.Id,
        accountId: contact.AccountId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[API] Membership signup failed at stage: contact', error);
      return res.status(500).json({
        error: error.message || 'Failed to create contact',
        stage: 'contact',
        details: error,
      });
    }

    // Stage 2: Create Opportunity
    console.log('[API] Contact created, starting opportunity creation...');
    let opportunity;
    try {
      opportunity = await createMembershipOpportunity({
        firstName,
        lastName,
        membershipLevel: salesforceMembershipLevel,
        membershipTerm: salesforceMembershipTerm,
        contactId: contact.Id,
        accountId: contact.AccountId!,
        stripePaymentId,
        stripePaymentMethodId,
        stripeNetAmount,
        stripeProcessingFees,
      });
      console.log('[API] Opportunity created successfully:', {
        opportunityId: opportunity.Id,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[API] Membership signup failed at stage: opportunity', error);
      return res.status(500).json({
        error: error.message || 'Failed to create opportunity',
        stage: 'opportunity',
        contactId: contact.Id,
        details: error,
      });
    }

    // Stage 3: Create Clerk User
    console.log('[API] Opportunity created, starting Clerk user creation...');
    let clerkUserId;
    let clerkUserCreated = false;
    try {
      clerkUserId = await createClerkUser(email, firstName, lastName);
      clerkUserCreated = true;

      console.log('[API] Clerk user created successfully:', {
        clerkUserId,
        timestamp: new Date().toISOString(),
      });

      // Stage 4: Update Salesforce Contact with Clerk User ID
      console.log('[API] Updating Salesforce Contact with Clerk User ID...');
      try {
        await updateContactClerkUserId(contact.Id, clerkUserId);
        console.log('[API] Contact updated with Clerk User ID');
      } catch (updateError: any) {
        // Log but don't fail - Contact and Opportunity are already created
        console.error('[API] Warning: Failed to update Contact with Clerk User ID:', {
          error: updateError.message,
          contactId: contact.Id,
          clerkUserId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (clerkError: any) {
      // Log but don't fail the entire signup
      // Contact and Opportunity are already created in Salesforce
      console.error('[API] Warning: Failed to create Clerk user (marking as pending):', {
        error: clerkError.message,
        contactId: contact.Id,
        opportunityId: opportunity.Id,
        timestamp: new Date().toISOString(),
      });
      // User will be marked as "pending Clerk setup" by not having a Clerk_User_Id__c value
    }

    // Success
    console.log('[API] Membership signup completed successfully', {
      clerkUserCreated,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json({
      success: true,
      contact: {
        id: contact.Id,
        firstName: contact.FirstName,
        lastName: contact.LastName,
        email: contact.Email,
        accountId: contact.AccountId,
        clerkUserId: clerkUserId || null,
      },
      opportunity: {
        id: opportunity.Id,
        name: opportunity.Name,
        amount: opportunity.Amount,
        membershipStartDate: opportunity.MembershipStartDate,
        membershipEndDate: opportunity.MembershipEndDate,
      },
      clerkUserCreated,
    });
  } catch (error: any) {
    console.error('[API] Unexpected error during membership signup:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred',
      details: error,
    });
  }
});

export default router;
