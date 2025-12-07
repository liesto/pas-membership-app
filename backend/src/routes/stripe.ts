import express from 'express';
import { createPaymentIntent, getPaymentIntent, createCustomer } from '../services/stripe.ts';
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

      // Extract charge data for fees and net amount
      const latestCharge = paymentIntent.latest_charge;
      const chargeData = typeof latestCharge === 'object' ? latestCharge : null;
      const balanceTransaction = chargeData?.balance_transaction;
      const balanceData = typeof balanceTransaction === 'object' ? balanceTransaction : null;

      console.log('[Stripe API] Payment intent details:', {
        hasLatestCharge: !!latestCharge,
        latestChargeType: typeof latestCharge,
        hasBalanceTransaction: !!balanceTransaction,
        balanceTransactionType: typeof balanceTransaction,
        balanceData: balanceData ? {
          id: balanceData.id,
          net: balanceData.net,
          fee: balanceData.fee,
          amount: balanceData.amount,
        } : null,
      });

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        payment_method: paymentIntent.payment_method,
        latest_charge: chargeData ? {
          id: chargeData.id,
          amount: chargeData.amount,
          amount_captured: chargeData.amount_captured,
          balance_transaction: balanceData ? {
            id: balanceData.id,
            net: balanceData.net,
            fee: balanceData.fee,
            amount: balanceData.amount,
          } : null,
        } : null,
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

/**
 * POST /api/stripe/create-customer
 * Create a Stripe Customer
 */
router.post(
  '/create-customer',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, name } = req.body;

      // Validate required fields
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          error: 'Invalid email provided',
        });
      }

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          error: 'Invalid name provided',
        });
      }

      console.log('[Stripe API] Creating customer:', { email, name });

      // Create customer
      const customer = await createCustomer(email, name);

      // Return customer ID
      res.json({
        customerId: customer.id,
      });
    } catch (error: any) {
      console.error('[Stripe API] Error creating customer:', error);
      res.status(500).json({
        error: 'Failed to create customer',
        details: error.message,
      });
    }
  }
);

export default router;
