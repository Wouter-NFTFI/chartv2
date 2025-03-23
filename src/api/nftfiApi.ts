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

/**
 * Fetches loans due within a specific number of days
 * @param daysFromNow Number of days from now to fetch loans for
 * @param lenderAddress Optional lender address to filter loans
 * @returns Promise containing loan data
 */
export async function fetchLoans(
  daysFromNow: number,
  lenderAddress?: string
): Promise<NFTfiLoansResponse> {
  try {
    const url = new URL(`${API_URL}/data/v0/pipes/loans_v2.json`)
    url.searchParams.append('howDaysFromNow', daysFromNow.toString())
    
    if (lenderAddress) {
      url.searchParams.append('lenderAddress', lenderAddress)
    }
    
    url.searchParams.append('page_size', '1000')
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Failed to fetch loans: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
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
 * @returns Promise containing processed collection data
 */
export async function fetchTopCollections(
  daysFromNow: number,
  pageSize: number = 100,
  limit: number = 20
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
    
    // Sort collections by total USD value (descending)
    const sortedCollections = [...data.data].sort((a, b) => 
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