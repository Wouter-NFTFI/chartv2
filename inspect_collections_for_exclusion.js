/**
 * Script to inspect how collection names are normalized and how exclusion works
 * Run with: node inspect_collections_for_exclusion.js
 */

// Copy-paste of the relevant functions from collectionNameUtils.ts for testing
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

// Special case mappings copied from collectionNameUtils.ts
const SPECIAL_CASE_MAPPINGS = {
  // Handle the "squiggle" vs "squiggles" case
  'chromiesquiggle': ['chromiesquiggles', 'chromiesquiggle'],
  
  // Handle collections that might appear with different prefixes
  'cryptopunks': ['cryptopunks', 'cryptopunks721', 'wrappedcryptopunks'],
  
  // Other special cases as needed
  'bayc': ['boredapeyachtclub', 'bayc'],
  'mayc': ['mutantapeyachtclub', 'mayc'],
};

// Current exclusion list
const CURRENT_EXCLUDED_COLLECTION_NAMES = [
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

// Collections we want to add to the exclusion list
const COLLECTIONS_TO_ADD = [
  "Art Blocks V1",
  "Arcade Vault",
  "Arcade Vault V2", // Including related variations
  "Gondi Vault",
  "XCOPY",
  "XCOPY editions 2019-22",
  "SuperRare 1/1s: XCOPY",
  "TRAITORS by XCOPY",
  "MAX PAIN AND FRENS BY XCOPY",
  "Decal by XCOPY"
];

// Combined list to test
const TEST_EXCLUDED_COLLECTION_NAMES = [
  ...CURRENT_EXCLUDED_COLLECTION_NAMES,
  ...COLLECTIONS_TO_ADD
];

function isExcludedCollection(collectionName, excludedList) {
  // Normalize the input name
  const normalizedInput = normalizeCollectionName(collectionName);

  // Check if it matches any normalized excluded name
  const normalizedExclusions = excludedList.map(normalizeCollectionName);
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

// Function to simulate API request
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

// Test if collections would be properly normalized and excluded
async function testExclusion() {
  console.log('Testing normalization and exclusion for collections...\n');
  
  // Collections we specifically want to check
  const collectionsToCheck = [
    "Art Blocks V1", 
    "ART BLOCKS V1", // Capitalization variant
    "Artblocksv1", // No spaces variant
    "Arcade Vault",
    "Arcade Vault V2",
    "arcade-vault", // Kebab case variant
    "Gondi Vault",
    "gondi vault", // Lowercase variant
    "gondi-vault", // Kebab case variant
    "XCOPY",
    "xcopy", // Lowercase variant
    "XCOPY editions 2019-22",
    "SuperRare 1/1s: XCOPY",
    "TRAITORS by XCOPY",
    "MAX PAIN AND FRENS BY XCOPY",
    "Decal by XCOPY"
  ];
  
  console.log('Testing with new exclusion list...');
  collectionsToCheck.forEach(name => {
    const normalized = normalizeCollectionName(name);
    const wouldBeExcluded = isExcludedCollection(name, TEST_EXCLUDED_COLLECTION_NAMES);
    
    console.log(`${name}:
  - Normalized: "${normalized}"
  - Would be excluded: ${wouldBeExcluded}
`);
  });
  
  // Check if there are possible special cases that need mapping
  console.log('\nChecking for potential special case mappings needs...');
  const uniqueNormalizedNames = new Set();
  collectionsToCheck.forEach(name => {
    const normalized = normalizeCollectionName(name);
    uniqueNormalizedNames.add(normalized);
  });
  
  console.log(`Found ${uniqueNormalizedNames.size} unique normalized names: ${Array.from(uniqueNormalizedNames).join(', ')}`);
  
  // Testing with real API data
  console.log('\nFetching real collection data from NFTfi API...');
  const collectionsData = await fetchCollections();
  
  if (!collectionsData.data || collectionsData.data.length === 0) {
    console.log('No collection data received from API.');
    return;
  }
  
  console.log(`Received ${collectionsData.data.length} collections from API.`);
  
  // Check which of our target collections are present in the API data
  const targetCollectionsPresent = collectionsData.data.filter(c => 
    COLLECTIONS_TO_ADD.some(target => 
      c.nftProjectName && c.nftProjectName.includes(target.split(' ')[0])
    )
  );
  
  console.log(`\nFound ${targetCollectionsPresent.length} target collections in API data:`);
  targetCollectionsPresent.forEach(c => {
    const normalized = normalizeCollectionName(c.nftProjectName);
    const wouldBeExcluded = isExcludedCollection(c.nftProjectName, TEST_EXCLUDED_COLLECTION_NAMES);
    
    console.log(`"${c.nftProjectName}":
  - Normalized: "${normalized}"
  - Would be excluded: ${wouldBeExcluded}
  - Total USD value: $${c.total_usd_value.toLocaleString()}
`);
  });
  
  // Check if any collections might need special mapping
  const xcopyRelated = collectionsData.data.filter(c => 
    c.nftProjectName && c.nftProjectName.toLowerCase().includes('xcopy')
  );
  
  if (xcopyRelated.length > 0) {
    console.log(`\nFound ${xcopyRelated.length} XCOPY-related collections in API data:`);
    xcopyRelated.forEach(c => console.log(`- "${c.nftProjectName}"`));
    
    // Check if all would be excluded with current approach
    const allExcluded = xcopyRelated.every(c => isExcludedCollection(c.nftProjectName, TEST_EXCLUDED_COLLECTION_NAMES));
    console.log(`Would all XCOPY-related collections be excluded? ${allExcluded}`);
    
    if (!allExcluded) {
      console.log('Some XCOPY-related collections might not be excluded correctly!');
      xcopyRelated.forEach(c => {
        if (!isExcludedCollection(c.nftProjectName, TEST_EXCLUDED_COLLECTION_NAMES)) {
          console.log(`- "${c.nftProjectName}" would NOT be excluded`);
        }
      });
    }
  }
  
  // Suggested special case mappings
  console.log('\nSuggested special case mappings to add:');
  console.log(`
  // Art Blocks V1 and variations
  'artblocksv1': ['artblocksv1'],
  
  // Arcade Vault and variations
  'arcadevault': ['arcadevault', 'arcadevaultv2'],
  
  // Gondi Vault and variations
  'gondivault': ['gondivault'],
  
  // XCOPY and all variations
  'xcopy': ['xcopy', 'xcopyeditions201922', 'superrare11sxcopy', 'traitorsbyxcopy', 'maxpainandfrensby', 'decalby']
`);
}

// Run the test
testExclusion(); 