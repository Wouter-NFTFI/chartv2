/**
 * Verification script for updated exclusion logic
 * Run with: node verify_exclusions.js
 */

// Copy of the updated exclusion logic - must match what's in collectionNameUtils.ts
const SPECIAL_CASE_MAPPINGS = {
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

const EXCLUDED_COLLECTION_NAMES = [
  // Original excluded collections
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

// Utility functions
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

async function main() {
  console.log("Verifying updated exclusion logic...\n");
  
  // Test cases for our target collections
  const testCases = [
    // Art Blocks
    { name: "Art Blocks V1", expectedResult: true },
    { name: "art blocks v1", expectedResult: true },
    { name: "ArtBlocksV1", expectedResult: true },
    
    // Arcade Vault
    { name: "Arcade Vault", expectedResult: true },
    { name: "Arcade Vault V2", expectedResult: true },
    { name: "arcade vault", expectedResult: true },
    
    // Gondi Vault
    { name: "Gondi Vault", expectedResult: true },
    { name: "gondi vault", expectedResult: true },
    
    // XCOPY
    { name: "XCOPY", expectedResult: true },
    { name: "xcopy", expectedResult: true },
    { name: "XCOPY editions 2019-22", expectedResult: true },
    { name: "SuperRare 1/1s: XCOPY", expectedResult: true },
    { name: "TRAITORS by XCOPY", expectedResult: true },
    { name: "MAX PAIN AND FRENS BY XCOPY", expectedResult: true },
    { name: "Decal by XCOPY", expectedResult: true },
    
    // Collections that should NOT be excluded
    { name: "Bored Ape Yacht Club", expectedResult: false },
    { name: "CryptoPunks", expectedResult: false },
    { name: "Doodles", expectedResult: false }
  ];
  
  console.log("Testing with hard-coded test cases:");
  let passedTests = 0;
  let failedTests = 0;
  
  testCases.forEach(test => {
    const result = isExcludedCollection(test.name);
    const passed = result === test.expectedResult;
    
    console.log(`${passed ? '✅' : '❌'} "${test.name}" - Expected: ${test.expectedResult}, Got: ${result}`);
    
    if (passed) {
      passedTests++;
    } else {
      failedTests++;
    }
  });
  
  console.log(`\nTest results: ${passedTests} passed, ${failedTests} failed\n`);
  
  // Test with real API data
  console.log("Fetching real collection data from NFTfi API...");
  const collectionsData = await fetchCollections();
  
  if (!collectionsData.data || collectionsData.data.length === 0) {
    console.log('No collection data received from API.');
    return;
  }
  
  console.log(`Received ${collectionsData.data.length} collections from API.`);
  
  // Check which collections would be excluded
  const excludedCollections = collectionsData.data.filter(c => 
    c.nftProjectName && isExcludedCollection(c.nftProjectName)
  );
  
  console.log(`\nFound ${excludedCollections.length} collections that would be excluded:`);
  excludedCollections.forEach(c => {
    const normalized = normalizeCollectionName(c.nftProjectName);
    console.log(`- "${c.nftProjectName}" (normalized: "${normalized}")`);
  });
  
  // Specifically check our target collections
  const targetCollectionNames = [
    "Art Blocks V1", "Arcade Vault", "Arcade Vault V2", 
    "Gondi Vault", "XCOPY", "XCOPY editions 2019-22", 
    "SuperRare 1/1s: XCOPY", "TRAITORS by XCOPY", 
    "MAX PAIN AND FRENS BY XCOPY", "Decal by XCOPY"
  ];
  
  const targetCollectionsInAPI = collectionsData.data.filter(c => 
    c.nftProjectName && targetCollectionNames.includes(c.nftProjectName)
  );
  
  console.log(`\nFound ${targetCollectionsInAPI.length} of our target collections in the API data:`);
  targetCollectionsInAPI.forEach(c => {
    const normalized = normalizeCollectionName(c.nftProjectName);
    const wouldBeExcluded = isExcludedCollection(c.nftProjectName);
    
    console.log(`- "${c.nftProjectName}"
  - Normalized: "${normalized}"
  - Would be excluded: ${wouldBeExcluded}
  - USD Value: $${c.total_usd_value.toLocaleString()}`);
  });
}

main(); 