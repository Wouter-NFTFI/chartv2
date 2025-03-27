/**
 * Collection Name Utilities
 * 
 * This module provides utilities for working with NFT collection names,
 * particularly for normalizing names for consistent comparison regardless
 * of spacing, capitalization, or common variations.
 */

/**
 * Special case mappings for collections that need specific normalization rules
 * beyond the standard algorithm.
 */
const SPECIAL_CASE_MAPPINGS: Record<string, string[]> = {
  // Handle the "squiggle" vs "squiggles" case
  'chromiesquiggle': ['chromiesquiggles', 'chromiesquiggle'],
  
  // Handle collections that might appear with different prefixes
  'cryptopunks': ['cryptopunks', 'cryptopunks721', 'wrappedcryptopunks'],
  
  // Other special cases as needed
  'bayc': ['boredapeyachtclub', 'bayc'],
  'mayc': ['mutantapeyachtclub', 'mayc'],
  
  // Art Blocks V1 and variations
  'artblocksv1': ['artblocksv1'],
  
  // Arcade Vault and variations
  'arcadevault': ['arcadevault', 'arcadevaultv2'],
  
  // XCOPY and all variations - handle the cases where the "by XCOPY" suffix gets removed
  'xcopy': ['xcopy', 'xcopyeditions201922', 'superrare11sxcopy', 'traitors', 'maxpainandfrens', 'decal']
};

/**
 * Collection names that should be excluded from the dropdown
 */
export const EXCLUDED_COLLECTION_NAMES: string[] = [
  "Chromie Squiggles by Snowfro",
  "Chromie Squiggle by Snowfro",
  "Fidenza",
  "Fidenza by Tyler Hobbs",
  "Ringers",
  "Ringers by Dmitri Cherniak",
  "Wrapped SuperRare",
  "WrappedSuperRare",
  "Known Origin",
  "KnownOrigin",
  
  // New excluded collections
  "Art Blocks V1",
  "Arcade Vault",
  "Arcade Vault V2",
  "Gondi Vault",
  "XCOPY",
  "XCOPY editions 2019-22",
  "SuperRare 1/1s: XCOPY",
  "TRAITORS by XCOPY",
  "MAX PAIN AND FRENS BY XCOPY",
  "Decal by XCOPY"
];

/**
 * Normalize a collection name for consistent comparison
 * - Convert to lowercase
 * - Remove all spaces
 * - Remove common suffixes like "by X"
 * - Remove special characters
 * 
 * @param name The collection name to normalize
 * @returns The normalized name for comparison
 */
export function normalizeCollectionName(name: string): string {
  if (!name) return '';
    
  // Convert to lowercase and remove spaces
  let normalized = name.toLowerCase().replace(/\s+/g, '');
    
  // Remove "by X" suffixes (where X is any word)
  normalized = normalized.replace(/by[a-z0-9]+$/, '');
    
  // Remove special characters
  normalized = normalized.replace(/[^a-z0-9]/g, '');
    
  return normalized;
}

/**
 * Check if a collection name is in the excluded list, using normalized comparison
 * and special case handling.
 * 
 * @param collectionName The collection name to check
 * @returns True if the collection should be excluded
 */
export function isExcludedCollection(collectionName: string): boolean {
  // Normalize the input name
  const normalizedInput = normalizeCollectionName(collectionName);

  // Check if it matches any normalized excluded name
  const normalizedExclusions = EXCLUDED_COLLECTION_NAMES.map(normalizeCollectionName);
  if (normalizedExclusions.includes(normalizedInput)) {
    return true;
  }

  // Check special cases for collections that need custom handling
  for (const [baseForm, variations] of Object.entries(SPECIAL_CASE_MAPPINGS)) {
    // If the base form is excluded and input matches a variation
    if (normalizedExclusions.includes(baseForm) && variations.includes(normalizedInput)) {
      return true;
    }
  }

  return false;
}

/**
 * Log analytics about a collection name for debugging purposes
 * 
 * @param collectionName The collection name to analyze
 */
export function logCollectionNameAnalytics(collectionName: string): void {
  const normalized = normalizeCollectionName(collectionName);
  
  console.log(`Collection name analysis:
  - Original: "${collectionName}"
  - Normalized: "${normalized}"
  - Excluded: ${isExcludedCollection(collectionName)}
  `);
} 