// Simple test script to verify our collection name utils against real data
// Run with: node test_collection_utils.cjs

const fs = require('fs');
const path = require('path');

// Load the real collection data from our test results
let collections = [];
try {
  const dataPath = path.join(__dirname, 'test_results', 'collections_raw.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  collections = JSON.parse(rawData).data;
  console.log(`Loaded ${collections.length} collections from test data`);
} catch (error) {
  console.error('Error loading test data:', error);
  process.exit(1);
}

// Simple implementation of our utility functions to test
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

// Special case mappings for collections that need custom handling
const SPECIAL_CASE_MAPPINGS = {
  'chromiesquiggle': ['chromiesquiggles', 'chromiesquiggle'],
  'cryptopunks': ['cryptopunks', 'cryptopunks721', 'wrappedcryptopunks'],
  'bayc': ['boredapeyachtclub', 'bayc'],
  'mayc': ['mutantapeyachtclub', 'mayc'],
};

// List of collections we want to exclude
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
  "KnownOrigin",
  "CryptoPunks",
  "CryptoPunks 721",
  "Wrapped CryptoPunks"
];

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

// Test our exclusion logic
console.log('\n--- Testing exclusion logic with real collections ---');
const excludedCollections = [];
const includedCollections = [];

collections.forEach(collection => {
  const name = collection.nftProjectName;
  if (isExcludedCollection(name)) {
    excludedCollections.push(name);
  } else {
    includedCollections.push(name);
  }
});

console.log(`\nExcluded collections (${excludedCollections.length}):`);
excludedCollections.forEach(name => {
  console.log(`  - ${name} (normalized: ${normalizeCollectionName(name)})`);
});

console.log(`\nTotal: ${excludedCollections.length} excluded, ${includedCollections.length} included`);

// Test specific collections we're concerned about
console.log('\n--- Testing specific problematic collections ---');
const testCases = [
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
  "CryptoPunks 721",
  "Wrapped CryptoPunks"
];

testCases.forEach(name => {
  console.log(`${name}: ${isExcludedCollection(name) ? 'EXCLUDED' : 'INCLUDED'} (normalized: ${normalizeCollectionName(name)})`);
}); 