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
