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

// NFT Price Floor API Client
// Fetches historical floor price data for NFT collections

import { NFT_PRICE_FLOOR } from '../config/api';
import { VALIDATED_SLUGS, COLLECTION_NAME_TO_SLUG_MAP } from '../utils/nftCollectionSlugs';

/**
 * Interface for individual price data points
 */
export interface PricePoint {
  timestamp: number;
  floorNative: number;
  floorUsd: number;
  volumeNative: number;
  volumeUsd: number;
  salesCount: number;
}

/**
 * Interface for the API response
 */
export interface PriceHistoryResponse {
  slug: string;
  granularity: string;
  timestamps: number[];
  floorNative: number[];
  floorUsd: number[];
  volumeNative: number[];
  volumeUsd: number[];
  salesCount: number[];
}

/**
 * Type for time intervals
 */
export type TimeInterval = '2h' | '8h' | '1d';

/**
 * Fetches historical floor prices for a specific NFT collection
 * 
 * @param slug - The collection slug (e.g., "azuki")
 * @param interval - Time interval (default: "1d")
 * @returns Promise with historical price data
 */
export const fetchHistoricalPrices = async (
  slug: string,
  interval: TimeInterval = '1d'
): Promise<PriceHistoryResponse> => {
  try {
    // First check if this is a validated slug we know should work
    if (!VALIDATED_SLUGS.includes(slug)) {
      console.warn(`Warning: Using non-validated slug "${slug}"`);
    }
    
    const url = `${NFT_PRICE_FLOOR.BASE_URL}/projects/${slug}/charts/${interval}?${NFT_PRICE_FLOOR.PARAM_NAME}=${NFT_PRICE_FLOOR.API_KEY}`;
    
    console.log(`Fetching price history for: ${slug} with interval ${interval}`);
    
    const response = await fetch(url);
    
    if (response.status === 404) {
      // For validated slugs, provide more specific error for time period issues
      if (VALIDATED_SLUGS.includes(slug) && interval !== '1d') {
        throw new Error(`No data available for "${slug}" with time period "${interval}". Try a different time period.`);
      } else {
        throw new Error(`Collection "${slug}" not found. Please check if the collection slug is correct.`);
      }
    }
    
    if (VALIDATED_SLUGS.includes(slug) && !response.ok) {
      throw new Error(`No data available for "${slug}" with time period "${interval}". Only 2h, 8h, and 1d intervals are supported.`);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price data for "${slug}". Only 2h, 8h, and 1d intervals are supported.`);
    }
    
    const data = await response.json();
    
    // Check if we got empty or incomplete data
    if (!data.timestamps || data.timestamps.length === 0) {
      throw new Error(`No price data available for "${slug}" with time period "${interval}".`);
    }
    
    return data as PriceHistoryResponse;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
};

/**
 * Checks if a collection exists in the NFT Price Floor database
 * 
 * @param slug - The collection slug to check
 * @returns Promise that resolves to boolean indicating if collection exists
 */
export const checkCollectionExists = async (slug: string): Promise<boolean> => {
  try {
    const url = `${NFT_PRICE_FLOOR.BASE_URL}/projects/${slug}?${NFT_PRICE_FLOOR.PARAM_NAME}=${NFT_PRICE_FLOOR.API_KEY}`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Error checking collection:', error);
    return false;
  }
};

/**
 * Transforms the raw API response into an array of price points
 * for easier consumption by charts and other components
 * 
 * @param response - The raw API response
 * @returns Array of formatted price points
 */
export const formatPriceHistory = (response: PriceHistoryResponse): PricePoint[] => {
  const { timestamps, floorNative, floorUsd, volumeNative, volumeUsd, salesCount } = response;
  
  return timestamps.map((timestamp, index) => ({
    timestamp,
    floorNative: floorNative[index],
    floorUsd: floorUsd[index],
    volumeNative: volumeNative[index],
    volumeUsd: volumeUsd[index],
    salesCount: salesCount[index]
  }));
};

/**
 * Filters an array of NFT collections to only include those with available price floor data
 * 
 * @param collections - Array of NFT collections with name property
 * @param nameField - The field name that contains the collection name (default: 'nftProjectName')
 * @returns Filtered array containing only collections with available price data
 */
export function filterCollectionsWithAvailablePriceData<T>(
  collections: T[],
  nameField: string = 'nftProjectName'
): T[] {
  return collections.filter(collection => {
    // Skip collections without a name
    const collectionObj = collection as Record<string, unknown>;
    
    if (!collectionObj[nameField]) return false;
    
    const collectionName = collectionObj[nameField] as string;
    
    // Check if we have a direct mapping for this collection name
    if (COLLECTION_NAME_TO_SLUG_MAP[collectionName]) {
      const slug = COLLECTION_NAME_TO_SLUG_MAP[collectionName];
      return VALIDATED_SLUGS.includes(slug);
    }
    
    // If no direct mapping, try a simplified version of the name as a slug
    const simplifiedSlug = collectionName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return VALIDATED_SLUGS.includes(simplifiedSlug);
  });
} 