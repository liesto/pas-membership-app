import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import {
  createContact,
  getContactByEmail,
  getContactById,
  createOpportunity,
  getOpportunitiesByContactId,
  createMembershipContact,
  createMembershipOpportunity,
  type MembershipLevel,
  type MembershipTerm,
} from '../services/salesforce.ts';

const router = Router();

/**
 * POST /api/salesforce/contacts
 * Create a new Contact in Salesforce
 */
router.post(
  '/contacts',
  requireAuth,
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

    // Success
    console.log('[API] Membership signup completed successfully');
    res.status(201).json({
      success: true,
      contact: {
        id: contact.Id,
        firstName: contact.FirstName,
        lastName: contact.LastName,
        email: contact.Email,
        accountId: contact.AccountId,
      },
      opportunity: {
        id: opportunity.Id,
        name: opportunity.Name,
        amount: opportunity.Amount,
        membershipStartDate: opportunity.MembershipStartDate,
        membershipEndDate: opportunity.MembershipEndDate,
      },
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
