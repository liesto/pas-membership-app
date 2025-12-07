import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import { verifyClerkToken, requireAuth, type AuthenticatedRequest } from '../../middleware/auth';
import * as clerkBackend from '@clerk/backend';

// Mock @clerk/backend
vi.mock('@clerk/backend');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockRequest = {
      headers: {},
      path: '/test-path',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    nextFunction = vi.fn();

    // Spy on console methods to suppress logs in test output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyClerkToken', () => {
    describe('Success Cases', () => {
      it('should extract and attach token from valid Authorization header', async () => {
        // Arrange
        const testToken = 'valid_test_token_abc123';
        mockRequest.headers = {
          authorization: `Bearer ${testToken}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(testToken);
        expect(nextFunction).toHaveBeenCalledOnce();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Clerk token received for request:',
          '/test-path'
        );
      });

      it('should handle token with special characters', async () => {
        // Arrange
        const testToken = 'token_with-special.chars_123!@#';
        mockRequest.headers = {
          authorization: `Bearer ${testToken}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(testToken);
        expect(nextFunction).toHaveBeenCalledOnce();
      });

      it('should continue without error when no Authorization header is present', async () => {
        // Arrange
        mockRequest.headers = {};

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBeUndefined();
        expect(nextFunction).toHaveBeenCalledOnce();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });

      it('should continue without error when Authorization header is empty string', async () => {
        // Arrange
        mockRequest.headers = {
          authorization: '',
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBeUndefined();
        expect(nextFunction).toHaveBeenCalledOnce();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should continue without error when Authorization header does not start with "Bearer "', async () => {
        // Arrange
        mockRequest.headers = {
          authorization: 'Basic abc123',
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBeUndefined();
        expect(nextFunction).toHaveBeenCalledOnce();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should handle case-sensitive "Bearer" prefix correctly', async () => {
        // Arrange - lowercase "bearer" should not be accepted
        mockRequest.headers = {
          authorization: 'bearer test_token',
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBeUndefined();
        expect(nextFunction).toHaveBeenCalledOnce();
      });
    });

    describe('Edge Cases', () => {
      it('should handle Authorization header with "Bearer " but no token', async () => {
        // Arrange
        mockRequest.headers = {
          authorization: 'Bearer ',
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe('');
        expect(nextFunction).toHaveBeenCalledOnce();
      });

      it('should handle very long token strings', async () => {
        // Arrange
        const veryLongToken = 'a'.repeat(1000);
        mockRequest.headers = {
          authorization: `Bearer ${veryLongToken}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(veryLongToken);
        expect(nextFunction).toHaveBeenCalledOnce();
      });

      it('should handle token with whitespace', async () => {
        // Arrange
        const tokenWithSpaces = 'token with spaces';
        mockRequest.headers = {
          authorization: `Bearer ${tokenWithSpaces}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(tokenWithSpaces);
        expect(nextFunction).toHaveBeenCalledOnce();
      });

      it('should handle multiple "Bearer " occurrences in token', async () => {
        // Arrange
        const token = 'Bearer nested_bearer_token';
        mockRequest.headers = {
          authorization: `Bearer ${token}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(token);
        expect(nextFunction).toHaveBeenCalledOnce();
      });
    });

    describe('Error Handling', () => {
      it('should return 401 when an error is thrown during processing', async () => {
        // Arrange
        mockRequest.headers = {
          authorization: 'Bearer valid_token',
        };

        // Mock the request to throw an error when accessing path
        Object.defineProperty(mockRequest, 'path', {
          get: () => {
            throw new Error('Unexpected error');
          },
        });

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Invalid authentication token',
        });
        expect(nextFunction).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Token verification error:',
          expect.any(Error)
        );
      });

      it('should handle errors with proper error message', async () => {
        // Arrange
        const customError = new Error('Custom verification error');
        mockRequest.headers = {
          authorization: 'Bearer test_token',
        };

        // Force an error by making headers getter throw
        Object.defineProperty(mockRequest, 'path', {
          get: () => {
            throw customError;
          },
        });

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith('Token verification error:', customError);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Invalid authentication token',
        });
      });
    });

    describe('Token Extraction', () => {
      it('should correctly extract token by removing exactly "Bearer " prefix (7 characters)', async () => {
        // Arrange
        const expectedToken = 'abc123xyz';
        mockRequest.headers = {
          authorization: `Bearer ${expectedToken}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(expectedToken);
        expect(mockRequest.clerkToken?.length).toBe(expectedToken.length);
      });

      it('should preserve token exactly as provided after "Bearer "', async () => {
        // Arrange
        const tokenWithSpecialFormat = 'ey.J0eXAiOi.JKV1QiLC.JhbGciOi.JSUZI1Ni';
        mockRequest.headers = {
          authorization: `Bearer ${tokenWithSpecialFormat}`,
        };

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockRequest.clerkToken).toBe(tokenWithSpecialFormat);
      });
    });

    describe('Logging Behavior', () => {
      it('should log the request path when token is received', async () => {
        // Arrange
        mockRequest.headers = {
          authorization: 'Bearer test_token',
        };
        mockRequest.path = '/api/test/endpoint';

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'Clerk token received for request:',
          '/api/test/endpoint'
        );
      });

      it('should not log when no token is provided', async () => {
        // Arrange
        mockRequest.headers = {};

        // Act
        await verifyClerkToken(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(consoleLogSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('requireAuth', () => {
    describe('Success Cases', () => {
      it('should call next() when clerkToken is present', () => {
        // Arrange
        mockRequest.clerkToken = 'valid_token_abc123';

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(nextFunction).toHaveBeenCalledOnce();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });

      it('should accept any non-empty string as valid token', () => {
        // Arrange
        mockRequest.clerkToken = 'x';

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(nextFunction).toHaveBeenCalledOnce();
      });

      it('should accept token with special characters', () => {
        // Arrange
        mockRequest.clerkToken = 'token!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(nextFunction).toHaveBeenCalledOnce();
      });

      it('should accept very long token strings', () => {
        // Arrange
        mockRequest.clerkToken = 'a'.repeat(10000);

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(nextFunction).toHaveBeenCalledOnce();
      });
    });

    describe('Failure Cases', () => {
      it('should return 401 when clerkToken is undefined', () => {
        // Arrange
        mockRequest.clerkToken = undefined;

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Authentication required',
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should return 401 when clerkToken is null', () => {
        // Arrange
        mockRequest.clerkToken = null as any;

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Authentication required',
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should return 401 when clerkToken is empty string', () => {
        // Arrange
        mockRequest.clerkToken = '';

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Authentication required',
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should return 401 when request has no clerkToken property', () => {
        // Arrange
        delete mockRequest.clerkToken;

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Authentication required',
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });

    describe('Response Format', () => {
      it('should return correct error structure', () => {
        // Arrange
        mockRequest.clerkToken = undefined;

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(String),
          })
        );
        const callArgs = (mockResponse.json as any).mock.calls[0][0];
        expect(callArgs).toHaveProperty('error');
        expect(callArgs.error).toBe('Authentication required');
      });

      it('should chain status and json methods correctly', () => {
        // Arrange
        mockRequest.clerkToken = undefined;
        const statusSpy = vi.spyOn(mockResponse as any, 'status');
        const jsonSpy = vi.spyOn(mockResponse as any, 'json');

        // Act
        requireAuth(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(statusSpy).toHaveBeenCalledBefore(jsonSpy);
      });
    });
  });

  describe('Integration: verifyClerkToken + requireAuth', () => {
    it('should allow request through when token is valid in both middlewares', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid_integration_token',
      };
      const nextFn1 = vi.fn();
      const nextFn2 = vi.fn();

      // Act - First middleware: verifyClerkToken
      await verifyClerkToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFn1
      );

      // Act - Second middleware: requireAuth
      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFn2
      );

      // Assert
      expect(nextFn1).toHaveBeenCalledOnce();
      expect(nextFn2).toHaveBeenCalledOnce();
      expect(mockRequest.clerkToken).toBe('valid_integration_token');
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block request when no token provided and requireAuth is used', async () => {
      // Arrange
      mockRequest.headers = {};
      const nextFn1 = vi.fn();
      const nextFn2 = vi.fn();

      // Act - First middleware: verifyClerkToken
      await verifyClerkToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFn1
      );

      // Act - Second middleware: requireAuth
      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFn2
      );

      // Assert
      expect(nextFn1).toHaveBeenCalledOnce(); // verifyClerkToken allows through
      expect(nextFn2).not.toHaveBeenCalled(); // requireAuth blocks
      expect(mockRequest.clerkToken).toBeUndefined();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
    });

    it('should demonstrate optional vs required auth pattern', async () => {
      // Scenario 1: Optional auth (verifyClerkToken only)
      const req1: Partial<AuthenticatedRequest> = { headers: {}, path: '/public' };
      const next1 = vi.fn();

      await verifyClerkToken(req1 as AuthenticatedRequest, mockResponse as Response, next1);
      expect(next1).toHaveBeenCalledOnce();

      // Scenario 2: Required auth (verifyClerkToken + requireAuth)
      const req2: Partial<AuthenticatedRequest> = { headers: {}, path: '/protected' };
      const next2 = vi.fn();
      const next3 = vi.fn();
      const res2 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      await verifyClerkToken(req2 as AuthenticatedRequest, res2 as Response, next2);
      requireAuth(req2 as AuthenticatedRequest, res2 as Response, next3);

      expect(next2).toHaveBeenCalledOnce(); // First middleware passes
      expect(next3).not.toHaveBeenCalled(); // Second middleware blocks
      expect(res2.status).toHaveBeenCalledWith(401);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should properly extend Request with AuthenticatedRequest interface', async () => {
      // Arrange
      const typedRequest: AuthenticatedRequest = {
        headers: { authorization: 'Bearer type_test_token' },
        path: '/type-test',
      } as AuthenticatedRequest;

      // Act
      await verifyClerkToken(typedRequest, mockResponse as Response, nextFunction);

      // Assert
      expect(typedRequest.clerkToken).toBe('type_test_token');
      // TypeScript compilation success validates type safety
    });

    it('should handle userId property from AuthenticatedRequest interface', () => {
      // Arrange
      mockRequest.userId = 'user_123';
      mockRequest.clerkToken = 'token_abc';

      // Act
      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalledOnce();
      expect(mockRequest.userId).toBe('user_123');
    });
  });
});
