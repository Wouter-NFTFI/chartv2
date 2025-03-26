/**
 * Financial calculations related to NFT loans and LTV
 */

/**
 * Calculate Loan-to-Value (LTV) percentage
 * @param principalAmountUSD The principal amount of the loan in USD
 * @param floorPriceUSD The floor price of the NFT in USD
 * @returns The LTV as a percentage
 */
export const calculateLTV = (principalAmountUSD: number, floorPriceUSD: number): number => {
  if (!principalAmountUSD || !floorPriceUSD || floorPriceUSD <= 0) {
    console.warn('Invalid inputs for LTV calculation', { principalAmountUSD, floorPriceUSD });
    return 0;
  }
  return (principalAmountUSD / floorPriceUSD) * 100;
};

/**
 * Calculate floor price based on principal amount and LTV
 * @param principalAmountUSD The principal amount of the loan in USD 
 * @param ltvPercentage The LTV percentage
 * @returns The calculated floor price in USD
 */
export const calculateFloorPrice = (principalAmountUSD: number, ltvPercentage: number): number => {
  if (!principalAmountUSD || !ltvPercentage || ltvPercentage <= 0) {
    console.warn('Invalid inputs for floor price calculation', { principalAmountUSD, ltvPercentage });
    return 0;
  }
  return principalAmountUSD / (ltvPercentage / 100);
};

/**
 * Check if a loan's LTV is within tolerance of a target LTV value
 * @param loan The loan object with principalAmountUSD
 * @param targetLTV The target LTV percentage to match
 * @param floorPriceUSD The floor price in USD
 * @param tolerancePercent The percentage tolerance (default: 5%)
 * @returns boolean indicating if loan matches the target LTV
 */
export const isLoanMatchingLTV = (
  loan: { principalAmountUSD: number },
  targetLTV: number,
  floorPriceUSD: number,
  tolerancePercent: number = 5
): boolean => {
  const loanLTV = calculateLTV(loan.principalAmountUSD, floorPriceUSD);
  const tolerance = targetLTV * (tolerancePercent / 100);
  return Math.abs(loanLTV - targetLTV) <= tolerance;
}; 