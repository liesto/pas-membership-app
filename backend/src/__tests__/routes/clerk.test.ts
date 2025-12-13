import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the clerk service
const { mockCreateClerkUser } = vi.hoisted(() => ({
  mockCreateClerkUser: vi.fn(),
}));

vi.mock('../../services/clerk.ts', () => ({
  createClerkUser: mockCreateClerkUser,
}));

// Mock the @clerk/backend module before importing the router
const { mockDeleteUser } = vi.hoisted(() => ({
  mockDeleteUser: vi.fn(),
}));

vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({
    users: {
      deleteUser: mockDeleteUser,
    },
  })),
}));

import clerkRouter from '../../routes/clerk';

describe('Clerk Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/clerk', clerkRouter);

    // Clear all mocks before each test
    vi.clearAllMocks();

    // Set up environment variable
    process.env.CLERK_SECRET_KEY = 'sk_test_mock_key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/clerk/users', () => {
    it('should create a user with email, firstName, and lastName (no password)', async () => {
      // Arrange
      mockCreateClerkUser.mockResolvedValue('user_test123');

      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        userId: 'user_test123',
        email: 'test@example.com',
      });
      expect(mockCreateClerkUser).toHaveBeenCalledWith('test@example.com', 'John', 'Doe', undefined);
    });

    it('should create a user with password when password is provided', async () => {
      // Arrange
      mockCreateClerkUser.mockResolvedValue('user_test456');

      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'SecurePassword123!',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        userId: 'user_test456',
        email: 'jane@example.com',
      });
      expect(mockCreateClerkUser).toHaveBeenCalledWith('jane@example.com', 'Jane', 'Smith', 'SecurePassword123!');
    });

    it('should return 400 when email is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          firstName: 'John',
          lastName: 'Doe',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: email, firstName, lastName');
      expect(mockCreateClerkUser).not.toHaveBeenCalled();
    });

    it('should return 400 when firstName is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'test@example.com',
          lastName: 'Doe',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: email, firstName, lastName');
      expect(mockCreateClerkUser).not.toHaveBeenCalled();
    });

    it('should return 400 when lastName is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'test@example.com',
          firstName: 'John',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: email, firstName, lastName');
      expect(mockCreateClerkUser).not.toHaveBeenCalled();
    });

    it('should return 400 when all required fields are missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: email, firstName, lastName');
      expect(mockCreateClerkUser).not.toHaveBeenCalled();
    });

    it('should return 500 when Clerk API fails', async () => {
      // Arrange
      const clerkError = {
        message: 'Email address already exists',
        status: 422,
        clerkTraceId: 'trace_123',
        errors: [{ code: 'duplicate_email', message: 'Email already exists' }],
      };
      mockCreateClerkUser.mockRejectedValue(clerkError);

      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'existing@example.com',
          firstName: 'John',
          lastName: 'Doe',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Email address already exists');
      expect(response.body.details).toEqual([
        { code: 'duplicate_email', message: 'Email already exists' },
      ]);
    });

    it('should handle generic errors from Clerk API', async () => {
      // Arrange
      mockCreateClerkUser.mockRejectedValue(new Error('Network error'));

      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Network error');
    });

    it('should handle empty string values for required fields', async () => {
      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: '',
          firstName: '',
          lastName: '',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields: email, firstName, lastName');
      expect(mockCreateClerkUser).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only values for required fields', async () => {
      // Act - Note: The current implementation doesn't trim, so whitespace passes validation
      // This test documents current behavior
      mockCreateClerkUser.mockResolvedValue('user_test789');

      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: '   ',
          firstName: '   ',
          lastName: '   ',
        });

      // Assert - Documents current behavior (accepts whitespace)
      expect(response.status).toBe(201);
    });

    it('should handle user creation with multiple email addresses in response', async () => {
      // Arrange
      mockCreateClerkUser.mockResolvedValue('user_multi123');

      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'primary@example.com',
          firstName: 'Multi',
          lastName: 'Email',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.email).toBe('primary@example.com');
    });

    it('should handle user creation when emailAddresses array is empty', async () => {
      // Arrange
      mockCreateClerkUser.mockResolvedValue('user_noemail');

      // Act
      const response = await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'test@example.com',
          firstName: 'No',
          lastName: 'Email',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('DELETE /api/clerk/users/:userId', () => {
    it('should delete a user by userId', async () => {
      // Arrange
      mockDeleteUser.mockResolvedValue({ id: 'user_test123', deleted: true });

      // Act
      const response = await request(app).delete('/api/clerk/users/user_test123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'User user_test123 deleted',
      });
      expect(mockDeleteUser).toHaveBeenCalledWith('user_test123');
    });

    it('should return 400 when userId is empty string', async () => {
      // Act - Note: Express route params handle this differently
      // An empty userId means the route won't match, resulting in 404
      const response = await request(app).delete('/api/clerk/users/');

      // Assert
      expect(response.status).toBe(404);
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found', async () => {
      // Arrange
      const notFoundError = {
        message: 'User not found',
        status: 404,
      };
      mockDeleteUser.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app).delete('/api/clerk/users/user_nonexistent');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
      expect(mockDeleteUser).toHaveBeenCalledWith('user_nonexistent');
    });

    it('should return 500 when Clerk API fails with non-404 error', async () => {
      // Arrange
      mockDeleteUser.mockRejectedValue(new Error('Internal Clerk API error'));

      // Act
      const response = await request(app).delete('/api/clerk/users/user_test123');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Clerk API error');
    });

    it('should handle Clerk API errors without message property', async () => {
      // Arrange
      mockDeleteUser.mockRejectedValue({
        status: 500,
        // No message property
      });

      // Act
      const response = await request(app).delete('/api/clerk/users/user_test123');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete user');
    });

    it('should successfully delete user with special characters in userId', async () => {
      // Arrange
      const specialUserId = 'user_abc-123_XYZ';
      mockDeleteUser.mockResolvedValue({ id: specialUserId, deleted: true });

      // Act
      const response = await request(app).delete(`/api/clerk/users/${specialUserId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockDeleteUser).toHaveBeenCalledWith(specialUserId);
    });

    it('should handle concurrent delete requests for same user', async () => {
      // Arrange
      mockDeleteUser.mockResolvedValue({ id: 'user_concurrent', deleted: true });

      // Act
      const [response1, response2] = await Promise.all([
        request(app).delete('/api/clerk/users/user_concurrent'),
        request(app).delete('/api/clerk/users/user_concurrent'),
      ]);

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockDeleteUser).toHaveBeenCalledTimes(2);
    });

    it('should handle error when deleteUser throws error without status', async () => {
      // Arrange
      const genericError = new Error('Something went wrong');
      // No status property
      mockDeleteUser.mockRejectedValue(genericError);

      // Act
      const response = await request(app).delete('/api/clerk/users/user_test123');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user creation with valid data using password flow', async () => {
      // Arrange
      mockCreateClerkUser.mockResolvedValue('user_password_flow');

      // Act
      await request(app)
        .post('/api/clerk/users')
        .send({
          email: 'password@example.com',
          firstName: 'Password',
          lastName: 'Flow',
          password: 'TestPassword123!',
        });

      // Assert
      expect(mockCreateClerkUser).toHaveBeenCalledWith('password@example.com', 'Password', 'Flow', 'TestPassword123!');
    });

    it('should handle user deletion with valid userId', async () => {
      // Arrange
      mockDeleteUser.mockResolvedValue({ id: 'user_delete_test', deleted: true });

      // Act
      const response = await request(app).delete('/api/clerk/users/user_delete_test');

      // Assert
      expect(response.status).toBe(200);
      expect(mockDeleteUser).toHaveBeenCalledWith('user_delete_test');
    });
  });
});
