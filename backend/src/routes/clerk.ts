import { Router } from 'express';
import { createClerkClient } from '@clerk/backend';

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

/**
 * Get or create the Clerk client instance
 * Lazy initialization to ensure environment variables are loaded
 */
function getClerkClient(): ReturnType<typeof createClerkClient> {
  if (!clerkClient) {
    clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }
  return clerkClient;
}

const router = Router();

/**
 * POST /api/clerk/users
 * Create a new Clerk user
 * Public endpoint - no auth required for signup flow
 */
router.post('/users', async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields: email, firstName, lastName',
      });
    }

    console.log('[Clerk API] Creating user:', { email, firstName, lastName });

    const client = getClerkClient();

    // If password is provided, create user with password
    // If no password, user will receive email verification link
    const userData: any = {
      emailAddress: [email],
      firstName,
      lastName,
    };

    if (password) {
      userData.password = password;
      // Skip email verification if password is provided
      userData.skipPasswordChecks = false;
      userData.skipPasswordRequirement = false;
    }

    const user = await client.users.createUser(userData);

    console.log('[Clerk API] User created successfully:', {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
    });

    res.status(201).json({
      success: true,
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
    });
  } catch (error: any) {
    console.error('[Clerk API] Create user error:', {
      error: error.message,
      status: error.status,
      clerkTraceId: error.clerkTraceId,
      errors: error.errors,
    });

    res.status(500).json({
      error: error.message || 'Failed to create user',
      details: error.errors || error,
    });
  }
});

/**
 * DELETE /api/clerk/users/:userId
 * Delete a Clerk user (for rollback on Salesforce failure)
 * This is an internal endpoint - should only be called by backend
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
      });
    }

    console.log('Deleting Clerk user:', userId);

    // Delete the user using Clerk SDK
    const client = getClerkClient();
    await client.users.deleteUser(userId);

    console.log('Clerk user deleted successfully:', userId);

    res.json({
      success: true,
      message: `User ${userId} deleted`,
    });
  } catch (error: any) {
    console.error('Delete user error:', error.message);

    // If user not found, return 404
    if (error.status === 404) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to delete user',
    });
  }
});

export default router;
