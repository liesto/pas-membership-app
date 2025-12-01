/**
 * Validate a US phone number
 * Accepts formats: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
 * @param phone - Phone number string to validate
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/\D/g, '');

  // Valid US phone number should have 10 digits (or 11 if it starts with 1)
  if (cleaned.length === 10) {
    return true;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return true;
  }

  return false;
}

/**
 * Get a human-readable error message for invalid phone number
 * @param phone - Phone number that failed validation
 * @returns Error message string
 */
export function getPhoneErrorMessage(phone: string): string {
  if (!phone) {
    return 'Phone number is required';
  }

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return 'Please enter a valid phone number';
  }

  if (cleaned.length < 10) {
    return 'Phone number must be at least 10 digits';
  }

  if (cleaned.length > 11) {
    return 'Phone number is too long';
  }

  return 'Please enter a valid US phone number (10 digits)';
}

/**
 * Format a phone number for display
 * Converts: 1234567890 -> (123) 456-7890
 * @param phone - Unformatted phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned.charAt(0)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }

  return phone;
}
