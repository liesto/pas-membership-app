import Stripe from 'stripe';

// Initialize Stripe with secret key (lazy initialization to ensure env vars are loaded)
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  return stripe;
}

/**
 * Create a Payment Intent for membership payment
 * @param amount - Amount in dollars (will be converted to cents)
 * @param customerEmail - Customer email address
 * @param metadata - Additional metadata to attach to the payment
 */
export async function createPaymentIntent(
  amount: number,
  customerEmail: string,
  metadata: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  console.log('[Stripe] Creating payment intent:', {
    amount,
    customerEmail,
    metadata,
    timestamp: new Date().toISOString(),
  });

  try {
    const stripeClient = getStripeClient();

    // Convert dollars to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      receipt_email: customerEmail,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('[Stripe] Payment intent created:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      timestamp: new Date().toISOString(),
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Failed to create payment intent:', {
      error: error.message,
      errorType: error.type,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

/**
 * Retrieve a Payment Intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  console.log('[Stripe] Retrieving payment intent:', paymentIntentId);

  try {
    const stripeClient = getStripeClient();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    console.log('[Stripe] Payment intent retrieved:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      timestamp: new Date().toISOString(),
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Failed to retrieve payment intent:', {
      paymentIntentId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
}
