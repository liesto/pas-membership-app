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
 * Helper function to wait for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retrieve a Payment Intent by ID with expanded data
 * Includes retry logic to wait for balance_transaction to be populated
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  console.log('[Stripe] Retrieving payment intent:', paymentIntentId);

  try {
    const stripeClient = getStripeClient();
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge', 'latest_charge.balance_transaction', 'payment_method'],
      });

      // Check if balance_transaction is populated
      const latestCharge = paymentIntent.latest_charge;
      const chargeObject = typeof latestCharge === 'object' ? latestCharge : null;
      const balanceTransaction = chargeObject?.balance_transaction;
      const hasBalanceTransaction = balanceTransaction && typeof balanceTransaction === 'object' && balanceTransaction.id;

      console.log('[Stripe] Payment intent retrieval attempt:', {
        attempt,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        hasLatestCharge: !!latestCharge,
        hasBalanceTransaction: !!hasBalanceTransaction,
        timestamp: new Date().toISOString(),
      });

      if (hasBalanceTransaction) {
        console.log('[Stripe] Payment intent retrieved with balance transaction:', {
          paymentIntentId: paymentIntent.id,
          balanceTransactionId: (balanceTransaction as Stripe.BalanceTransaction).id,
          net: (balanceTransaction as Stripe.BalanceTransaction).net,
          fee: (balanceTransaction as Stripe.BalanceTransaction).fee,
          timestamp: new Date().toISOString(),
        });
        return paymentIntent;
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const waitTime = baseDelay * attempt; // Linear backoff: 1s, 2s, 3s, 4s
        console.log('[Stripe] Balance transaction not yet available, retrying in', waitTime, 'ms');
        await delay(waitTime);
      }
    }

    // Return payment intent even if balance_transaction is not populated after all retries
    console.warn('[Stripe] Balance transaction not populated after', maxRetries, 'attempts, returning payment intent anyway');
    const finalPaymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.balance_transaction', 'payment_method'],
    });
    return finalPaymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Failed to retrieve payment intent:', {
      paymentIntentId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
}

/**
 * Create a Stripe Customer
 * @param email - Customer email
 * @param name - Customer name
 * @param metadata - Additional metadata
 */
export async function createCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  console.log('[Stripe] Creating customer:', { email, name });

  try {
    const stripeClient = getStripeClient();
    const customer = await stripeClient.customers.create({
      email,
      name,
      metadata: metadata || {},
    });

    console.log('[Stripe] Customer created:', {
      customerId: customer.id,
      email: customer.email,
      timestamp: new Date().toISOString(),
    });

    return customer;
  } catch (error: any) {
    console.error('[Stripe] Failed to create customer:', {
      email,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}
