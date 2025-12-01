import { describe, it, expect } from 'vitest';
import { server } from '../setup';
import { deleteUser } from '@/services/clerkApi';
import { clerkErrorHandler } from '../mocks/salesforceHandlers';

describe('clerkApi', () => {
  describe('deleteUser', () => {
    it('should delete a user with valid userId', async () => {
      const userId = 'user_12345';

      // Should not throw
      await expect(deleteUser(userId)).resolves.toBeUndefined();
    });

    it('should throw error when user deletion fails', async () => {
      server.use(clerkErrorHandler);

      const userId = 'user_invalid';

      await expect(deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });

    it('should handle various user ID formats', async () => {
      const userIds = ['user_123', 'user_abc_123', 'user_xyz-789'];

      for (const userId of userIds) {
        await expect(deleteUser(userId)).resolves.toBeUndefined();
      }
    });
  });
});
