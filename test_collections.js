/**
 * Simple test script to fetch collections from the API and check for CryptoPunks variants
 * Run with: node test_collections.js
 */

// Basic fetch function to get collections
async function fetchCollections() {
  try {
    const response = await fetch('https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_by_collection_endpoint.json?howDaysFromNow=365&page_size=100');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching collections:', error);
    return { data: [] };
  }
}

// Simple implementation of our utility functions
function normalizeCollectionName(name) {
  if (!name) return '';
  
  // Convert to lowercase and remove spaces
  let normalized = name.toLowerCase().replace(/\s+/g, '');
  
  // Remove "by X" suffixes
  normalized = normalized.replace(/by[a-z0-9]+$/, '');
  
  // Remove special characters
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
  return normalized;
}

// Special case mappings - exact copy from collectionNameUtils.ts
const SPECIAL_CASE_MAPPINGS = {
  // Handle the "squiggle" vs "squiggles" case
  'chromiesquiggle': ['chromiesquiggles', 'chromiesquiggle'],
  
  // Handle collections that might appear with different prefixes
  'cryptopunks': ['cryptopunks', 'cryptopunks721', 'wrappedcryptopunks'],
  
  // Other special cases as needed
  'bayc': ['boredapeyachtclub', 'bayc'],
  'mayc': ['mutantapeyachtclub', 'mayc'],
};

// List of excluded collections - exact copy from collectionNameUtils.ts
// Note: CryptoPunks entries have been removed from this list
const EXCLUDED_COLLECTION_NAMES = [
  "Chromie Squiggles by Snowfro",
  "Chromie Squiggle by Snowfro",
  "Fidenza",
  "Fidenza by Tyler Hobbs",
  "Ringers",
  "Ringers by Dmitri Cherniak",
  "Wrapped SuperRare",
  "WrappedSuperRare",
  "Known Origin",
  "KnownOrigin"
];

// Function to check if a collection should be excluded
function isExcludedCollection(collectionName) {
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

// List of collections we want to check
const COLLECTIONS_TO_CHECK = [
  "CryptoPunks",
  "CryptoPunks 721",
  "Wrapped CryptoPunks",
  "XCOPY", 
  "Chromie Squiggle by Snowfro",
  "Fidenza"
];

async function main() {
  console.log('Fetching collections from NFTfi API...');
  const collectionsData = await fetchCollections();
  
  if (!collectionsData.data || collectionsData.data.length === 0) {
    console.log('No collections data received.');
    return;
  }
  
  console.log(`Found ${collectionsData.data.length} collections in total`);
  
  // Categorize collections based on exclusion
  const excludedCollections = [];
  const includedCollections = [];
  
  // Process all collections through our exclusion logic
  collectionsData.data.forEach(collection => {
    const name = collection.nftProjectName;
    const shouldExclude = isExcludedCollection(name);
    
    if (shouldExclude) {
      excludedCollections.push(name);
    } else {
      includedCollections.push(name);
    }
  });
  
  console.log('\nExclusion Summary:');
  console.log(`Excluded: ${excludedCollections.length} collections`);
  console.log(`Included: ${includedCollections.length} collections`);
  
  // Check our collections of interest specifically
  console.log('\nChecking collections of interest:');
  COLLECTIONS_TO_CHECK.forEach(name => {
    const shouldExclude = isExcludedCollection(name);
    console.log(`"${name}": ${shouldExclude ? 'EXCLUDED' : 'INCLUDED'} (normalized: "${normalizeCollectionName(name)}")`);
  });
  
  // Check for CryptoPunks variants in the API data
  console.log('\nCryptoPunks variants in API data:');
  collectionsData.data.forEach(collection => {
    const name = collection.nftProjectName;
    const normalized = normalizeCollectionName(name);
    if (normalized.includes('cryptopunk')) {
      const shouldExclude = isExcludedCollection(name);
      console.log(`"${name}": ${shouldExclude ? 'EXCLUDED' : 'INCLUDED'} (normalized: "${normalized}")`);
    }
  });
}

main(); 