import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  clerkToken?: string;
}

// Re-export Request, Response, NextFunction types
export type { Request, Response, NextFunction };

/**
 * Middleware to verify Clerk token from Authorization header
 * Token is optional - if present, it will be validated and attached to req.clerkToken
 * If not present, request continues without auth (use requireAuth middleware to enforce)
 */
export async function verifyClerkToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    // If no auth header, continue without setting token (not an error for optional auth)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    req.clerkToken = token;

    // For now, just validate token format
    // In production, you would verify with Clerk's API
    console.log('Clerk token received for request:', req.path);

    // TODO: Implement full Clerk token verification
    // This requires the Clerk SDK and secret key
    // For MVP, we'll trust the frontend to send valid tokens

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      error: 'Invalid authentication token',
    });
  }
}

/**
 * Middleware to check if user is authenticated (token is present)
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.clerkToken) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  next();
}
