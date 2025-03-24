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

export interface LoanDistributionResponseItem {
  principalAmount: number;
  maximumRepaymentAmount: number;
  principalAmountUSD: number;
  maximumRepaymentAmountUSD: number;
  // Add other fields as needed
}

export interface LoanDistributionResponse {
  data: LoanDistributionResponseItem[];
  rows: number;
  currentFloorPrice?: number;
  // Add other fields from the response as needed
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
      filteredCollections = filteredCollections.filter(collection => collection.total_usd_value > 0);
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
 * @returns Promise containing raw loan data
 */
export async function fetchLoanDistribution(collectionName: string): Promise<LoanDistributionResponseItem[]> {
  try {
    console.log(`Fetching loan distribution for "${collectionName}"`);
    const url = `https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_endpoint.json?daysFromNow=365&page_size=1000000&page=0&nftProjectName=${encodeURIComponent(collectionName)}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`API response not OK: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as LoanDistributionResponse;
    console.log('Raw loan data structure:', {
      hasData: !!data.data,
      dataLength: data.data?.length || 0,
      sampleItem: data.data?.length > 0 ? data.data[0] : 'No data items'
    });

    return data.data;
  } catch (error) {
    console.error('Error fetching loan distribution:', error);
    return [];
  }
}

/**
 * Fetches collections with loan data from NFTfi
 * @param options.limit - Optional limit to return only top N collections
 * @param options.filterByPriceData - If true, only returns collections with price data available
 * @returns Promise that resolves to an array of NFTfi collections with additional stats
 */
export async function fetchCollections(options: {
  limit?: number;
  filterByPriceData?: boolean;
} = {}): Promise<NFTfiCollection[]> {
  // This function is similar to fetchTopCollections but with options parameter
  const { limit = 20, filterByPriceData = true } = options;
  
  try {
    return await fetchTopCollections(365, 100, limit, filterByPriceData);
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
} 