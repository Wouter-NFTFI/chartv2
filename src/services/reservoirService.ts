import { NFTfiCollection } from '../types/reservoir';

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

export async function getCollections(): Promise<NFTfiCollection[]> {
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
    const uniqueCollections: NFTfiCollection[] = [];
    
    // Process collections and deduplicate
    for (const collection of validCollections) {
      const normalized = normalizeCollectionName(collection.nftProjectName);
      
      // Skip if empty or already seen
      if (!normalized || seenCollectionNames.has(normalized)) {
        continue;
      }
      
      // Mark as seen
      seenCollectionNames.add(normalized);
      
      // Add to results without transforming field names
      uniqueCollections.push({
        ...collection,
        volumePercentage: (collection.total_usd_value / totalVolume) * 100
      });
    }
    
    return uniqueCollections;
  } catch (error) {
    console.error('Error fetching collection data:', error);
    return [];
  }
}

export async function validateApiKey(): Promise<boolean> {
  try {
    await getCollections();
    return true;
  } catch {
    return false;
  }
} 