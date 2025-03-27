/**
 * Script to simulate how the dropdown handles collections with null names
 * Run with: node inspect_dropdown.js
 */

// Simulated data from the null collection we found
const problematicCollection = {
  nftProjectName: null,
  nftProjectImageUri: "",
  total_usd_value: 867614.7631835938,
  avg_usd_value: 37722.38100798234,
  avg_apr: 19.35217397109322,
  loan_count: 23
};

// Simulate some normal collections
const sampleCollections = [
  {
    nftProjectName: "CryptoPunks",
    nftProjectImageUri: "https://example.com/cryptopunks.png",
    total_usd_value: 5000000,
    avg_usd_value: 250000,
    avg_apr: 10.5,
    loan_count: 20,
    volumePercentage: 25.5
  },
  {
    nftProjectName: "Bored Ape Yacht Club",
    nftProjectImageUri: "https://example.com/bayc.png",
    total_usd_value: 4000000,
    avg_usd_value: 200000,
    avg_apr: 12.3,
    loan_count: 15,
    volumePercentage: 20.4
  },
  // Add the problematic collection
  problematicCollection
];

// Simulate filtering logic
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

// Simulate the dropdown option creation
function createDropdownOptions(collections) {
  // Filter out null values
  const validCollections = collections.filter(collection => !!collection.nftProjectName);
  
  // Create options with valid collections
  const options = validCollections.map(collection => ({
    value: collection.nftProjectName,
    label: collection.nftProjectName,
    collection
  }));
  
  console.log('Valid dropdown options:');
  options.forEach(option => {
    console.log(`- ${option.label} (value: ${option.value})`);
  });
  
  // Check if any collections were filtered out
  const filteredOutCollections = collections.filter(collection => !collection.nftProjectName);
  if (filteredOutCollections.length > 0) {
    console.log(`\n${filteredOutCollections.length} collections were filtered out due to null names:`);
    filteredOutCollections.forEach(collection => {
      console.log(JSON.stringify(collection, null, 2));
    });
  }
  
  return options;
}

// Simulate the App.tsx loadCollections function
function simulateAppLoad(collections) {
  console.log('Simulating App.tsx loadCollections function...');
  console.log(`Starting with ${collections.length} collections`);
  
  // Simulate the filtering logic in App.tsx
  // This is where null-named collections might slip through
  const filteredCollections = collections.filter(collection => {
    const name = collection.nftProjectName;
    
    // If there's no name, this check might be problematic
    // It doesn't explicitly filter out null names
    const shouldExclude = false; // simplified from isExcludedCollection(name);
    
    return !shouldExclude;
  });
  
  console.log(`After filtering, ${filteredCollections.length} collections remain`);
  
  // Check for null names in the filtered collections
  const nullNamedCollections = filteredCollections.filter(c => !c.nftProjectName);
  if (nullNamedCollections.length > 0) {
    console.log(`\nWARNING: ${nullNamedCollections.length} collections with null names passed through filtering`);
  }
  
  return filteredCollections;
}

// Main test function
function runTest() {
  console.log('Testing collection handling with null names\n');
  
  // Step 1: Simulate App.tsx loading and filtering collections
  const filteredCollections = simulateAppLoad(sampleCollections);
  
  // Step 2: Simulate how the dropdown would handle these collections
  console.log('\nSimulating CollectionDropdown behavior...');
  const dropdownOptions = createDropdownOptions(filteredCollections);
  
  // Step 3: Check how the collection array is passed to components
  console.log('\nFinal collections after filtering:');
  filteredCollections.forEach((collection, index) => {
    console.log(`[${index}] ${collection.nftProjectName || 'NULL'} - $${collection.total_usd_value.toFixed(2)}`);
  });
  
  // Step 4: Propose solution in comments
  console.log('\nPossible solutions:');
  console.log('1. Filter out collections with null names in App.tsx before passing to FilterBar');
  console.log('2. Add a guard in CollectionDropdown to filter out null-named collections');
  console.log('3. Add defensive coding in handleCollectionSelect to prevent selecting null-named collections');
}

runTest(); 