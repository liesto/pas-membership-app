import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import {
  createContact,
  getContactByEmail,
  getContactById,
  createOpportunity,
  getOpportunitiesByContactId,
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

export default router;
