export type MembershipLevel = 'Bronze' | 'Silver' | 'Gold';
export type MembershipTerm = 'Month' | 'Year';

const PRICING_TABLE: Record<string, number> = {
  'Bronze-Year': 50,
  'Bronze-Month': 5,
  'Silver-Year': 100,
  'Silver-Month': 10,
  'Gold-Year': 250,
  'Gold-Month': 25,
};

/**
 * Calculate membership price based on level and term
 * @param level - Membership level (Bronze, Silver, or Gold)
 * @param term - Membership term (Month or Year)
 * @returns Price in dollars
 * @throws Error if invalid combination
 */
export function calculateMembershipPrice(
  level: MembershipLevel,
  term: MembershipTerm
): number {
  const key = `${level}-${term}`;
  const price = PRICING_TABLE[key];

  if (!price) {
    throw new Error(`Invalid membership combination: ${level} / ${term}`);
  }

  return price;
}
