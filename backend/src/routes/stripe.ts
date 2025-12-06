import express from 'express';
import { createPaymentIntent, getPaymentIntent } from '../services/stripe.ts';
import type { AuthenticatedRequest, Response, NextFunction } from '../middleware/auth.ts';

const router = express.Router();

/**
 * POST /api/stripe/create-payment-intent
 * Create a Stripe Payment Intent for membership payment
 */
router.post(
  '/create-payment-intent',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, email, metadata } = req.body;

      // Validate required fields
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({
          error: 'Invalid amount provided',
        });
      }

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          error: 'Invalid email provided',
        });
      }

      console.log('[Stripe API] Creating payment intent:', {
        amount,
        email,
        metadata,
        timestamp: new Date().toISOString(),
      });

      // Create payment intent
      const paymentIntent = await createPaymentIntent(amount, email, metadata || {});

      // Return client secret to frontend
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error('[Stripe API] Error creating payment intent:', error);
      res.status(500).json({
        error: 'Failed to create payment intent',
        details: error.message,
      });
    }
  }
);

/**
 * GET /api/stripe/payment-intent/:id
 * Retrieve a payment intent by ID
 */
router.get(
  '/payment-intent/:id',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Payment intent ID is required',
        });
      }

      console.log('[Stripe API] Retrieving payment intent:', id);

      const paymentIntent = await getPaymentIntent(id);

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });
    } catch (error: any) {
      console.error('[Stripe API] Error retrieving payment intent:', error);
      res.status(500).json({
        error: 'Failed to retrieve payment intent',
        details: error.message,
      });
    }
  }
);

export default router;
