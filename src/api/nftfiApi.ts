/**
 * ─────────────────────────────────────────────────────────────
 * 📦 Web3 Data Integrity Rules
 * ─────────────────────────────────────────────────────────────
 * 
 * ✅ All on-chain data must be fetched via verified contract ABIs
 * ❌ Never use mock data or placeholder values
 * ❌ No fallbacks (e.g., `value || default`)
 * ❌ Do not normalize or alias contract field names
 * ✅ Always use canonical names from the ABI
 * ✅ Treat blockchain data as immutable and final
 * ✅ Validate with types (TypeScript, Zod, viem)
 * 
 * 🔐 No secrets or keys should be stored in code — use environment variables only
 * 🧼 Keep logic DRY and reusable — extract common handlers where needed
 */

// Interact with verified on-chain data using ABI-defined structure
// Do not use mock data, fallbacks, or inferred fields
// Use exact field names from contract ABIs only
// Treat all data as immutable and verifiable

export interface NFTfiLoanMetadata {
  name: string;
  type: string;
}

export interface NFTfiLoan {
  protocolName: string;
  loanId: string;
  loanContractAddress: string;
  nftProjectName: string | null;
  nftProjectImageUri: string;
  nftAddress: string;
  nftId: string;
  nftName: string;
  nftImageSmallUri: string;
  nftImageLargeUri: string;
  status: string;
  currencyName: string | null;
  principalAmount: number;
  principalAmountETH: number | null;
  repaymentAmount: number;
  loanStartTime: number;
  loanDuration: number;
  loanMaturityDate: number;
}

export interface NFTfiLoansResponse {
  meta: NFTfiLoanMetadata[];
  data: NFTfiLoan[];
  rows: number;
}

/**
 * Fetches loans that are due within the specified number of days
 * @param daysFromNow Number of days from now for which to fetch due loans
 * @param lenderAddress Optional Ethereum address of the lender
 * @param pageSize Number of records to return per page
 * @param page Page number (starting from 0)
 * @returns A promise that resolves to the loans response
 */
export const fetchLoans = async (
  daysFromNow: number = 365,
  lenderAddress?: string,
  pageSize: number = 10000,
  page: number = 0
): Promise<NFTfiLoansResponse> => {
  const url = new URL('https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_endpoint.json');
  
  // Add query parameters
  url.searchParams.append('daysFromNow', daysFromNow.toString());
  url.searchParams.append('page_size', pageSize.toString());
  url.searchParams.append('page', page.toString());
  
  if (lenderAddress) {
    url.searchParams.append('lenderAddress', lenderAddress);
  }
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json() as NFTfiLoansResponse;
  } catch (error) {
    console.error('Error fetching NFTfi loans:', error);
    throw error;
  }
}; 