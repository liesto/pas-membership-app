/**
 * Clerk API Service
 * Handles user management operations including deletion for rollback
 */

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
const CLERK_API = `${API_BASE_URL}/clerk`;

export interface ApiError {
  error: string;
  details?: any;
}

/**
 * Delete a Clerk user
 * Used for rollback when Salesforce contact creation fails
 * @param userId - Clerk user ID to delete
 * @returns Promise that resolves when user is deleted
 * @throws Error if deletion fails
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`${CLERK_API}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || `Failed to delete user: ${response.statusText}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting user');
  }
}

/**
 * Get current user information
 * @returns Promise with user data
 * @throws Error if fetch fails
 */
export async function getCurrentUser() {
  try {
    const response = await fetch(`${CLERK_API}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching user');
  }
}
