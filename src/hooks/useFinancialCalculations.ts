import { useMemo } from 'react';
import { calculateLTV, calculateFloorPrice, isLoanMatchingLTV } from '../utils/financial';
import type { Loan } from '../types/nftfi';

/**
 * Hook to provide financial calculations for NFT loans
 * @param allLoans Complete array of loan objects for a collection
 * @param floorPriceUSD Floor price in USD
 * @returns Object with calculated values and helper functions
 */
export const useFinancialCalculations = (allLoans: Loan[], floorPriceUSD: number) => {
  // Calculate LTV for each loan and return enhanced loan objects
  const loansWithLTV = useMemo(() => {
    return allLoans.map(loan => ({
      ...loan,
      ltvValue: calculateLTV(loan.principalAmountUSD, floorPriceUSD)
    }));
  }, [allLoans, floorPriceUSD]);

  // Min and max LTV values across all loans
  const ltvRange = useMemo(() => {
    if (loansWithLTV.length === 0) return { min: 0, max: 0 };
    
    const ltvValues = loansWithLTV.map(loan => loan.ltvValue).filter(ltv => ltv > 0);
    return {
      min: Math.min(...ltvValues),
      max: Math.max(...ltvValues)
    };
  }, [loansWithLTV]);

  // Filter loans by LTV value with tolerance
  const filterLoansByLTV = (targetLTV: number, tolerancePercent: number = 5) => {
    return allLoans.filter(loan => 
      isLoanMatchingLTV(loan, targetLTV, floorPriceUSD, tolerancePercent)
    );
  };

  /**
   * Check if a loan is within a specified LTV range
   * @param loan The loan to check
   * @param targetLTV The target LTV percentage
   * @param tolerancePercent The percentage tolerance to apply
   * @returns Boolean indicating if the loan matches the criteria
   */
  const isLoanInLTVRange = (loan: Loan, targetLTV: number, tolerancePercent: number = 5): boolean => {
    return isLoanMatchingLTV(loan, targetLTV, floorPriceUSD, tolerancePercent);
  };

  return {
    loansWithLTV,
    ltvRange,
    filterLoansByLTV,
    isLoanInLTVRange,
    calculateLTV: (principalAmount: number) => calculateLTV(principalAmount, floorPriceUSD),
    calculateFloorPrice: (principalAmount: number, ltv: number) => calculateFloorPrice(principalAmount, ltv)
  };
}; 