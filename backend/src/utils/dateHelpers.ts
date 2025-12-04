import { toZonedTime, format } from 'date-fns-tz';
import { addMonths, addYears } from 'date-fns';

const EST_TIMEZONE = 'America/New_York';

/**
 * Get current date in EST timezone
 * @returns Date object in EST timezone
 */
export function getCurrentDateEST(): Date {
  return toZonedTime(new Date(), EST_TIMEZONE);
}

/**
 * Format date for Salesforce (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForSalesforce(date: Date): string {
  return format(date, 'yyyy-MM-dd', { timeZone: EST_TIMEZONE });
}

/**
 * Format date for display (MM/DD/YYYY)
 * @param date - Date to format
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatDateDisplay(date: Date): string {
  return format(date, 'MM/dd/yyyy', { timeZone: EST_TIMEZONE });
}

/**
 * Calculate membership end date based on start date and term
 * @param startDate - Membership start date
 * @param term - 'Month' or 'Year'
 * @returns End date (same day next month/year)
 */
export function calculateMembershipEndDate(
  startDate: Date,
  term: 'Month' | 'Year'
): Date {
  if (term === 'Month') {
    return addMonths(startDate, 1);
  } else {
    return addYears(startDate, 1);
  }
}
