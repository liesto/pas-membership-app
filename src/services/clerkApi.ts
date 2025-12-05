/**
 * Clerk API Service
 * Handles user management operations with Clerk backend API
 */

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export interface CreateUserResponse {
  success: boolean;
  userId: string;
  email: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

/**
 * Create a new Clerk user via backend API
 * This uses the Clerk Admin API to create users without requiring email verification
 * @param userData - User data including email, firstName, lastName, and optional password
 * @returns Promise with the created user ID and email
 * @throws Error if creation fails
 */
export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const response = await fetch('/api/clerk/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create user: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating user');
  }
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
