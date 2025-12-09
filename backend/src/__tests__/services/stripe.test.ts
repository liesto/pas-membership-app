import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';

// Mock Stripe at the module level
const mockRetrieve = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        retrieve: mockRetrieve,
      },
    })),
  };
});

describe('Stripe Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    mockRetrieve.mockClear();

    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set environment variable for Stripe secret key
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('getPaymentIntent with retry logic', () => {
    it('should return payment intent immediately when balance_transaction is available on first attempt', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: {
          id: 'ch_test123',
          amount: 10000,
          balance_transaction: {
            id: 'txn_test123',
            net: 9700,
            fee: 300,
            amount: 10000,
          },
        },
      };

      mockRetrieve.mockResolvedValue(mockPaymentIntent);

      // Act
      const { getPaymentIntent } = await import('../../services/stripe');
      const result = await getPaymentIntent('pi_test123');

      // Assert
      expect(result).toEqual(mockPaymentIntent);
      expect(mockRetrieve).toHaveBeenCalledTimes(1);
      expect(mockRetrieve).toHaveBeenCalledWith('pi_test123', {
        expand: ['latest_charge', 'latest_charge.balance_transaction', 'payment_method'],
      });
    });

    it('should retry when balance_transaction is null and succeed on second attempt', async () => {
      // Arrange
      const mockPaymentIntentWithoutBalanceTransaction = {
        id: 'pi_test456',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: {
          id: 'ch_test456',
          amount: 10000,
          balance_transaction: null,
        },
      };

      const mockPaymentIntentWithBalanceTransaction = {
        id: 'pi_test456',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: {
          id: 'ch_test456',
          amount: 10000,
          balance_transaction: {
            id: 'txn_test456',
            net: 9680,
            fee: 320,
            amount: 10000,
          },
        },
      };

      mockRetrieve
        .mockResolvedValueOnce(mockPaymentIntentWithoutBalanceTransaction)
        .mockResolvedValueOnce(mockPaymentIntentWithBalanceTransaction);

      // Act
      const { getPaymentIntent } = await import('../../services/stripe');
      const result = await getPaymentIntent('pi_test456');

      // Assert
      expect(result).toEqual(mockPaymentIntentWithBalanceTransaction);
      expect(mockRetrieve).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout to account for retry delay

    it('should retry multiple times and succeed on third attempt', async () => {
      // Arrange
      const mockPaymentIntentWithoutBalanceTransaction = {
        id: 'pi_test789',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: {
          id: 'ch_test789',
          amount: 10000,
          balance_transaction: null,
        },
      };

      const mockPaymentIntentWithBalanceTransaction = {
        id: 'pi_test789',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: {
          id: 'ch_test789',
          amount: 10000,
          balance_transaction: {
            id: 'txn_test789',
            net: 9650,
            fee: 350,
            amount: 10000,
          },
        },
      };

      mockRetrieve
        .mockResolvedValueOnce(mockPaymentIntentWithoutBalanceTransaction)
        .mockResolvedValueOnce(mockPaymentIntentWithoutBalanceTransaction)
        .mockResolvedValueOnce(mockPaymentIntentWithBalanceTransaction);

      // Act
      const { getPaymentIntent } = await import('../../services/stripe');
      const result = await getPaymentIntent('pi_test789');

      // Assert
      expect(result).toEqual(mockPaymentIntentWithBalanceTransaction);
      expect(mockRetrieve).toHaveBeenCalledTimes(3);
    }, 15000); // Increase timeout to account for multiple retry delays

    it('should return payment intent after max retries even if balance_transaction is still null', async () => {
      // Arrange
      const mockPaymentIntentWithoutBalanceTransaction = {
        id: 'pi_test999',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: {
          id: 'ch_test999',
          amount: 10000,
          balance_transaction: null,
        },
      };

      // Always return payment intent without balance transaction
      mockRetrieve.mockResolvedValue(
        mockPaymentIntentWithoutBalanceTransaction
      );

      // Act
      const { getPaymentIntent } = await import('../../services/stripe');
      const result = await getPaymentIntent('pi_test999');

      // Assert
      expect(result).toEqual(mockPaymentIntentWithoutBalanceTransaction);
      // Should try 5 times, then make one final call
      expect(mockRetrieve).toHaveBeenCalledTimes(6);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Balance transaction not populated after'),
        5,
        expect.stringContaining('attempts')
      );
    }, 20000); // Increase timeout to account for all retry delays

    it('should handle payment intent without latest_charge', async () => {
      // Arrange
      const mockPaymentIntentWithoutCharge = {
        id: 'pi_test111',
        status: 'requires_payment_method',
        amount: 10000,
        currency: 'usd',
        latest_charge: null,
      };

      mockRetrieve.mockResolvedValue(mockPaymentIntentWithoutCharge);

      // Act
      const { getPaymentIntent } = await import('../../services/stripe');
      const result = await getPaymentIntent('pi_test111');

      // Assert
      expect(result).toEqual(mockPaymentIntentWithoutCharge);
      // Should retry all 5 times since there's no charge at all
      expect(mockRetrieve).toHaveBeenCalledTimes(6);
    }, 20000);

    it('should handle payment intent with string charge ID instead of expanded object', async () => {
      // Arrange
      const mockPaymentIntentWithStringCharge = {
        id: 'pi_test222',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        latest_charge: 'ch_test222', // String ID instead of object
      };

      mockRetrieve.mockResolvedValue(
        mockPaymentIntentWithStringCharge
      );

      // Act
      const { getPaymentIntent } = await import('../../services/stripe');
      const result = await getPaymentIntent('pi_test222');

      // Assert
      expect(result).toEqual(mockPaymentIntentWithStringCharge);
      // Should retry all 5 times since charge is not expanded
      expect(mockRetrieve).toHaveBeenCalledTimes(6);
    }, 20000);

    it('should throw error when Stripe API fails', async () => {
      // Arrange
      const mockError = new Error('Stripe API error');
      mockRetrieve.mockRejectedValue(mockError);

      // Act & Assert
      const { getPaymentIntent } = await import('../../services/stripe');
      await expect(getPaymentIntent('pi_error')).rejects.toThrow('Failed to retrieve payment intent: Stripe API error');
      expect(mockRetrieve).toHaveBeenCalledTimes(1);
    });
  });
});
