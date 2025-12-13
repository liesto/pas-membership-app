import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClerkUser } from '../../services/clerk';

// Mock the @clerk/backend module
const { mockCreateUser, mockGetClerkClient } = vi.hoisted(() => {
  const mockCreateUser = vi.fn();
  const mockGetClerkClient = vi.fn(() => ({
    users: {
      createUser: mockCreateUser,
    },
  }));

  return { mockCreateUser, mockGetClerkClient };
});

vi.mock('@clerk/backend', () => ({
  createClerkClient: mockGetClerkClient,
}));

describe('Clerk Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'sk_test_mock_key';
    // Mock console.log to suppress log output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createClerkUser', () => {
    it('should create a user without password', async () => {
      // Arrange
      const mockUser = {
        id: 'user_test123',
        emailAddresses: [
          {
            emailAddress: 'test@example.com',
            verification: { status: 'verified' },
          },
        ],
        firstName: 'John',
        lastName: 'Doe',
      };

      mockCreateUser.mockResolvedValue(mockUser);

      // Act
      const userId = await createClerkUser('test@example.com', 'John', 'Doe');

      // Assert
      expect(userId).toBe('user_test123');
      expect(mockCreateUser).toHaveBeenCalledWith({
        emailAddress: ['test@example.com'],
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should create a user with password and mark email as verified', async () => {
      // Arrange
      const mockUser = {
        id: 'user_test456',
        emailAddresses: [
          {
            emailAddress: 'jane@example.com',
            verification: { status: 'verified' },
          },
        ],
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockCreateUser.mockResolvedValue(mockUser);

      // Act
      const userId = await createClerkUser(
        'jane@example.com',
        'Jane',
        'Smith',
        'SecurePassword123!'
      );

      // Assert
      expect(userId).toBe('user_test456');
      expect(mockCreateUser).toHaveBeenCalledWith({
        emailAddress: ['jane@example.com'],
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'SecurePassword123!',
        skipPasswordChecks: true,
        verified: true,
      });
    });

    it('should handle Clerk API errors', async () => {
      // Arrange
      const clerkError = {
        message: 'Email address already exists',
        status: 422,
        clerkTraceId: 'trace_123',
        errors: [{ code: 'duplicate_email', message: 'Email already exists' }],
      };
      mockCreateUser.mockRejectedValue(clerkError);

      // Act & Assert
      await expect(
        createClerkUser('existing@example.com', 'John', 'Doe')
      ).rejects.toThrow('Failed to create Clerk user: Email address already exists');
    });

    it('should handle generic errors', async () => {
      // Arrange
      mockCreateUser.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        createClerkUser('test@example.com', 'John', 'Doe')
      ).rejects.toThrow('Failed to create Clerk user: Network error');
    });

    it('should create user with password even if password is empty string', async () => {
      // Arrange
      const mockUser = {
        id: 'user_test789',
        emailAddresses: [
          {
            emailAddress: 'empty@example.com',
            verification: { status: 'unverified' },
          },
        ],
        firstName: 'Empty',
        lastName: 'Password',
      };

      mockCreateUser.mockResolvedValue(mockUser);

      // Act
      const userId = await createClerkUser(
        'empty@example.com',
        'Empty',
        'Password',
        ''
      );

      // Assert
      expect(userId).toBe('user_test789');
      // Empty string is falsy, so password won't be included
      expect(mockCreateUser).toHaveBeenCalledWith({
        emailAddress: ['empty@example.com'],
        firstName: 'Empty',
        lastName: 'Password',
      });
    });

    it('should handle user with multiple email addresses', async () => {
      // Arrange
      const mockUser = {
        id: 'user_multi',
        emailAddresses: [
          {
            emailAddress: 'primary@example.com',
            verification: { status: 'verified' },
          },
          {
            emailAddress: 'secondary@example.com',
            verification: { status: 'unverified' },
          },
        ],
        firstName: 'Multi',
        lastName: 'Email',
      };

      mockCreateUser.mockResolvedValue(mockUser);

      // Act
      const userId = await createClerkUser(
        'primary@example.com',
        'Multi',
        'Email',
        'password123'
      );

      // Assert
      expect(userId).toBe('user_multi');
    });

    it('should handle user with no email addresses in response', async () => {
      // Arrange
      const mockUser = {
        id: 'user_noemail',
        emailAddresses: [],
        firstName: 'No',
        lastName: 'Email',
      };

      mockCreateUser.mockResolvedValue(mockUser);

      // Act
      const userId = await createClerkUser(
        'test@example.com',
        'No',
        'Email'
      );

      // Assert
      expect(userId).toBe('user_noemail');
    });

    it('should handle errors without message property', async () => {
      // Arrange
      const errorWithoutMessage: any = {
        status: 500,
        clerkTraceId: 'trace_456',
      };
      mockCreateUser.mockRejectedValue(errorWithoutMessage);

      // Act & Assert
      await expect(
        createClerkUser('test@example.com', 'John', 'Doe')
      ).rejects.toThrow('Failed to create Clerk user: undefined');
    });
  });
});
