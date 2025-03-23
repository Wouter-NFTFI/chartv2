import { CollectionFloorPrice, NFTfiCollection } from '../types/reservoir';

const NFTFI_API_URL = 'https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_by_collection_endpoint.json';

function getTotalVolume(collections: NFTfiCollection[]): number {
  return collections.reduce((total, collection) => total + collection.total_usd_value, 0);
}

// Normalize collection name to handle duplicates
function normalizeCollectionName(name: string): string {
  // Handle null/undefined names
  if (!name) return '';
  // Remove spaces, special characters, and convert to lowercase for comparison
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function getCollectionsFloorPrices(): Promise<CollectionFloorPrice[]> {
  try {
    const response = await fetch(`${NFTFI_API_URL}?howDaysFromNow=1000000&page_size=100000`);
    const data = await response.json();
    const collections: NFTfiCollection[] = data.data;
    const totalVolume = getTotalVolume(collections);

    // Filter out collections with empty names or missing required data
    const validCollections = collections.filter(collection => 
      collection.nftProjectName && 
      collection.nftProjectName.trim() !== '' &&
      collection.total_usd_value > 0
    );

    // Track seen collection names to prevent duplicates
    const seenCollectionNames = new Set<string>();
    const transformedCollections: CollectionFloorPrice[] = [];
    
    // Process collections and deduplicate
    for (const collection of validCollections) {
      const normalized = normalizeCollectionName(collection.nftProjectName);
      
      // Skip if empty or already seen
      if (!normalized || seenCollectionNames.has(normalized)) {
        continue;
      }
      
      // Mark as seen
      seenCollectionNames.add(normalized);
      
      // Add to results
      transformedCollections.push({
        id: collection.nftProjectName,
        name: collection.nftProjectName,
        image: collection.nftProjectImageUri,
        volume24h: collection.total_usd_value / 365,
        volume7d: (collection.total_usd_value / 365) * 7,
        volume365d: collection.total_usd_value,
        marketShare: (collection.total_usd_value / totalVolume) * 100,
        tokenCount: 0,
        onSaleCount: 0,
        floorPrice: collection.avg_usd_value / 1800,
        floorPriceUSD: collection.avg_usd_value,
        avgAPR: collection.avg_apr,
        loanCount: collection.loan_count
      });
    }
    
    return transformedCollections;
  } catch (error) {
    console.error('Error fetching collection data:', error);
    return [];
  }
}

export async function validateApiKey(): Promise<boolean> {
  try {
    await getCollectionsFloorPrices();
    return true;
  } catch {
    return false;
  }
} 