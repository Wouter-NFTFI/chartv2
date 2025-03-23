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

import { API_URL } from '../config/api'
import { filterCollectionsWithAvailablePriceData } from './priceFloorApi'

const NFTFI_API_URL = 'https://theta-sdk-api.nftfi.com';

// Interfaces for API responses
export interface NFTfiLoanMeta {
  elapsed: number
  rows: number
  bytes_read: number
  // Additional meta fields from the API
}

export interface NFTfiLoan {
  id: string
  protocolName: string
  principalAmount: number
  repaymentAmount: number
  currencyName: string
  dueDate: string
  lenderAddress: string
  borrowerAddress: string
  // Additional loan data fields from the API
}

export interface NFTfiCollection {
  nftProjectName: string
  nftProjectImageUri: string
  total_usd_value: number
  avg_usd_value: number
  avg_apr: number
  loan_count: number
  volumePercentage?: number // Added for UI display
}

export interface NFTfiLoansResponse {
  meta: NFTfiLoanMeta
  data: NFTfiLoan[]
  rows: number
}

export interface NFTfiCollectionsResponse {
  meta: {
    elapsed: number
    rows_read: number
    bytes_read: number
  }
  data: NFTfiCollection[]
  rows: number
}

export interface LoanDistribution {
  ltv: number;
  loanCount: number;
  totalValue: number;
}

/**
 * Fetches loans due within a specific number of days
 * @param daysFromNow Number of days from now to fetch loans for
 * @param collectionName Optional collection name to filter loans
 * @param lenderAddress Optional lender address to filter loans
 * @returns Promise containing loan data
 */
export async function fetchLoans(
  daysFromNow: number,
  collectionName?: string,
  lenderAddress?: string
): Promise<NFTfiLoansResponse> {
  try {
    const url = new URL(`${NFTFI_API_URL}/data/v0/pipes/loans_v2.json`)
    url.searchParams.append('howDaysFromNow', daysFromNow.toString())
    url.searchParams.append('page_size', '10000')
    
    if (lenderAddress) {
      url.searchParams.append('lenderAddress', lenderAddress)
    }

    if (collectionName) {
      url.searchParams.append('nftProjectName', encodeURIComponent(collectionName))
    }
    
    console.log('Fetching loans from:', url.toString()); // Debug log
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors' // Explicitly request CORS
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch loans: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Raw loan data:', data); // Debug log
    return data as NFTfiLoansResponse
  } catch (error) {
    console.error('Error fetching loans:', error)
    throw error
  }
}

/**
 * Fetches top collections with loan data from NFTfi
 * @param daysFromNow Number of days from now to fetch collections for
 * @param pageSize Number of collections to fetch
 * @param limit Optional limit to return only top N collections
 * @param filterByPriceData Whether to filter collections by available price floor data (default: true)
 * @returns Promise containing processed collection data
 */
export async function fetchTopCollections(
  daysFromNow: number,
  pageSize: number = 100,
  limit: number = 20,
  filterByPriceData: boolean = true
): Promise<NFTfiCollection[]> {
  try {
    const url = new URL(`${API_URL}/data/v0/pipes/loans_due_by_collection_endpoint.json`)
    url.searchParams.append('howDaysFromNow', daysFromNow.toString())
    url.searchParams.append('page_size', pageSize.toString())
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json() as NFTfiCollectionsResponse
    
    // Filter collections if needed
    let filteredCollections = [...data.data];
    if (filterByPriceData) {
      // Filter collections by those that have price floor data available
      filteredCollections = filterCollectionsWithAvailablePriceData(filteredCollections);
    }
    
    // Sort collections by total USD value (descending)
    const sortedCollections = filteredCollections.sort((a, b) => 
      b.total_usd_value - a.total_usd_value
    );
    
    // Calculate total volume for percentage calculation
    const totalVolume = sortedCollections.reduce(
      (sum, collection) => sum + collection.total_usd_value, 
      0
    );
    
    // Add volume percentage to each collection
    const collectionsWithPercentage = sortedCollections.map(collection => ({
      ...collection,
      volumePercentage: (collection.total_usd_value / totalVolume) * 100
    }));
    
    // Return only the top N collections
    return collectionsWithPercentage.slice(0, limit);
  } catch (error) {
    console.error('Error fetching collections:', error)
    throw error
  }
}

/**
 * Fetches loan distribution data for a collection
 * @param collectionName Collection name to fetch distribution for
 * @returns Promise containing loan distribution data
 */
export async function fetchLoanDistribution(collectionName: string): Promise<LoanDistribution[]> {
  try {
    const url = `https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_endpoint.json?daysFromNow=365&page_size=1000000&page=0&nftProjectName=${encodeURIComponent(collectionName)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw loan data:', data);

    // Create buckets for LTV values (0-100% in 5% increments)
    const buckets: { [key: number]: LoanDistribution } = {};
    for (let i = 0; i <= 100; i += 5) {
      buckets[i] = {
        ltv: i,
        loanCount: 0,
        totalValue: 0
      };
    }

    // Process each loan and add to appropriate bucket
    data.data.forEach((loan: any) => {
      if (loan.principalAmountUSD && loan.maximumRepaymentAmountUSD) {
        // Calculate LTV as principal/maxRepayment * 100
        const ltv = (loan.principalAmountUSD / loan.maximumRepaymentAmountUSD) * 100;
        const bucketLtv = Math.min(100, Math.max(0, Math.floor(ltv / 5) * 5));
        buckets[bucketLtv].loanCount++;
        buckets[bucketLtv].totalValue += loan.principalAmountUSD;
      }
    });

    // Convert buckets to array and sort by LTV
    const distribution = Object.values(buckets)
      .filter(bucket => bucket.loanCount > 0)
      .sort((a, b) => a.ltv - b.ltv);
    
    console.log('Processed loan distribution:', distribution);
    return distribution;
  } catch (error) {
    console.error('Error fetching loan distribution:', error);
    return [];
  }
} 