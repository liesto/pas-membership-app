import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import stripeRouter from '../../routes/stripe';
import * as stripeService from '../../services/stripe';

// Mock the Stripe service
vi.mock('../../services/stripe');

describe('Stripe Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/stripe', stripeRouter);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/stripe/create-payment-intent', () => {
    it('should create a payment intent with valid data', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);

      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 100,
          email: 'test@example.com',
          metadata: {
            membershipLevel: 'silver',
            paymentFrequency: 'annual',
          },
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        clientSecret: 'pi_test123_secret_test',
        paymentIntentId: 'pi_test123',
      });
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        100,
        'test@example.com',
        {
          membershipLevel: 'silver',
          paymentFrequency: 'annual',
        }
      );
    });

    it('should return 400 when amount is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          email: 'test@example.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid amount provided');
    });

    it('should return 400 when amount is not a number', async () => {
      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 'invalid',
          email: 'test@example.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid amount provided');
    });

    it('should return 400 when email is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 100,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email provided');
    });

    it('should return 400 when email is not a string', async () => {
      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 100,
          email: 12345,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email provided');
    });

    it('should return 500 when Stripe service fails', async () => {
      // Arrange
      vi.mocked(stripeService.createPaymentIntent).mockRejectedValue(
        new Error('Stripe API error')
      );

      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 100,
          email: 'test@example.com',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create payment intent');
      expect(response.body.details).toBe('Stripe API error');
    });

    it('should handle metadata parameter correctly', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test456',
        client_secret: 'pi_test456_secret_test',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);

      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 50,
          email: 'user@example.com',
          metadata: {
            firstName: 'John',
            lastName: 'Doe',
            membershipLevel: 'bronze',
          },
        });

      // Assert
      expect(response.status).toBe(200);
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        50,
        'user@example.com',
        {
          firstName: 'John',
          lastName: 'Doe',
          membershipLevel: 'bronze',
        }
      );
    });

    it('should use empty metadata object when metadata is not provided', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test789',
        client_secret: 'pi_test789_secret_test',
        amount: 25000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);

      // Act
      const response = await request(app)
        .post('/api/stripe/create-payment-intent')
        .send({
          amount: 250,
          email: 'gold@example.com',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        250,
        'gold@example.com',
        {}
      );
    });
  });

  describe('GET /api/stripe/payment-intent/:id', () => {
    it('should retrieve a payment intent by ID with expanded data', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: {},
        payment_method: 'pm_test123',
        latest_charge: {
          id: 'ch_test123',
          amount: 10000,
          amount_captured: 10000,
          balance_transaction: {
            id: 'txn_test123',
            net: 9700,
            fee: 300,
            amount: 10000,
          },
        },
      };

      vi.mocked(stripeService.getPaymentIntent).mockResolvedValue(mockPaymentIntent as any);

      // Act
      const response = await request(app).get('/api/stripe/payment-intent/pi_test123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: {},
        payment_method: 'pm_test123',
        latest_charge: {
          id: 'ch_test123',
          amount: 10000,
          amount_captured: 10000,
          balance_transaction: {
            id: 'txn_test123',
            net: 9700,
            fee: 300,
            amount: 10000,
          },
        },
      });
    });

    it('should return 400 when payment intent ID is missing', async () => {
      // Act
      const response = await request(app).get('/api/stripe/payment-intent/');

      // Assert
      expect(response.status).toBe(404); // Express returns 404 for missing route params
    });

    it('should return 500 when payment intent retrieval fails', async () => {
      // Arrange
      vi.mocked(stripeService.getPaymentIntent).mockRejectedValue(
        new Error('Payment intent not found')
      );

      // Act
      const response = await request(app).get('/api/stripe/payment-intent/pi_invalid');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve payment intent');
    });

    it('should handle payment intent without balance_transaction', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_test456',
        status: 'requires_payment_method',
        amount: 5000,
        currency: 'usd',
        metadata: {},
        payment_method: null,
        latest_charge: 'ch_test456', // String ID, not expanded
      };

      vi.mocked(stripeService.getPaymentIntent).mockResolvedValue(mockPaymentIntent as any);

      // Act
      const response = await request(app).get('/api/stripe/payment-intent/pi_test456');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.latest_charge).toBeNull();
    });
  });

  describe('POST /api/stripe/create-customer', () => {
    it('should create a Stripe customer with valid data', async () => {
      // Arrange
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(stripeService.createCustomer).mockResolvedValue(mockCustomer as any);

      // Act
      const response = await request(app)
        .post('/api/stripe/create-customer')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        customerId: 'cus_test123',
      });
      expect(stripeService.createCustomer).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
    });

    it('should return 400 when email is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/stripe/create-customer')
        .send({
          name: 'Test User',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email provided');
    });

    it('should return 400 when name is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/stripe/create-customer')
        .send({
          email: 'test@example.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid name provided');
    });

    it('should return 500 when customer creation fails', async () => {
      // Arrange
      vi.mocked(stripeService.createCustomer).mockRejectedValue(
        new Error('Customer creation failed')
      );

      // Act
      const response = await request(app)
        .post('/api/stripe/create-customer')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create customer');
    });
  });
});
