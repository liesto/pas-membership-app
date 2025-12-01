/**
 * Clerk API Service
 * Handles user management operations with Clerk backend API
 */

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

/**
 * Delete a Clerk user by ID
 * This is used for rollback if Salesforce contact creation fails
 * @param userId - Clerk user ID to delete
 * @returns Promise that resolves if deletion is successful
 * @throws Error if deletion fails
 */
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  try {
    const response = await fetch(`/api/clerk/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting user');
  }
}
