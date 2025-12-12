import { createClerkClient, type ClerkClient } from '@clerk/backend';

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

/**
 * Get or create the Clerk client instance
 * Lazy initialization to ensure environment variables are loaded
 */
function getClerkClient(): ReturnType<typeof createClerkClient> {
  if (!clerkClient) {
    console.log('[Clerk] Initializing Clerk client with secret key:', {
      hasKey: !!process.env.CLERK_SECRET_KEY,
      keyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 10),
      timestamp: new Date().toISOString(),
    });

    clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }
  return clerkClient;
}

/**
 * Create a new Clerk user for membership signup
 * If password is provided, user can log in immediately
 * If no password, user will receive email verification link to set password
 *
 * @param email - User's email address
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param password - Optional password for immediate login
 * @returns Clerk user ID
 */
export async function createClerkUser(
  email: string,
  firstName: string,
  lastName: string,
  password?: string
): Promise<string> {
  console.log('[Clerk] Creating user:', {
    email,
    firstName,
    lastName,
    hasPassword: !!password,
    timestamp: new Date().toISOString(),
  });

  try {
    const client = getClerkClient();
    const user = await client.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      ...(password && { password }),
    });

    console.log('[Clerk] User created successfully:', {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      timestamp: new Date().toISOString(),
    });

    return user.id;
  } catch (error: any) {
    console.error('[Clerk] Failed to create user:', {
      email,
      error: error.message,
      status: error.status,
      clerkTraceId: error.clerkTraceId,
      errors: error.errors,
      fullError: JSON.stringify(error, null, 2),
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create Clerk user: ${error.message}`);
  }
}

/**
 * Update Salesforce Contact with Clerk User ID
 *
 * @param contactId - Salesforce Contact ID
 * @param clerkUserId - Clerk User ID
 */
export async function updateContactWithClerkId(
  contactId: string,
  clerkUserId: string
): Promise<void> {
  // This will be implemented using the Salesforce service
  // For now, we'll export this function signature
  console.log('[Clerk] Would update Salesforce Contact:', {
    contactId,
    clerkUserId,
    timestamp: new Date().toISOString(),
  });
}
