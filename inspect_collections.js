/**
 * Script to inspect collections and identify any nameless entries
 * Run with: node inspect_collections.js
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

async function main() {
  console.log('Fetching collections from NFTfi API...');
  const collectionsData = await fetchCollections();
  
  if (!collectionsData.data || collectionsData.data.length === 0) {
    console.log('No collections data received.');
    return;
  }
  
  console.log(`Found ${collectionsData.data.length} collections in total`);
  
  // Look for collections with empty or problematic names
  const problematicCollections = collectionsData.data.filter(collection => {
    const name = collection.nftProjectName;
    return !name || name.trim() === '' || name === 'undefined' || name === 'null';
  });
  
  if (problematicCollections.length > 0) {
    console.log(`\nFound ${problematicCollections.length} problematic collections:`);
    problematicCollections.forEach((collection, index) => {
      console.log(`[${index + 1}] Collection with empty/problematic name:`);
      console.log(JSON.stringify(collection, null, 2));
    });
  } else {
    console.log('\nNo collections with empty/problematic names found.');
  }
  
  // Check for collections with duplicate names
  const nameCount = {};
  collectionsData.data.forEach(collection => {
    const name = collection.nftProjectName;
    if (name) {
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
  });
  
  const duplicateNames = Object.entries(nameCount)
    .filter(([_, count]) => count > 1)
    .map(([name]) => name);
  
  if (duplicateNames.length > 0) {
    console.log(`\nFound ${duplicateNames.length} duplicate collection names:`);
    duplicateNames.forEach(name => {
      console.log(`- "${name}" appears ${nameCount[name]} times`);
    });
  } else {
    console.log('\nNo duplicate collection names found.');
  }

  // Check for collections with very low volume that might not be useful
  const lowVolumeCollections = collectionsData.data
    .filter(c => c.nftProjectName && c.total_usd_value < 1000)
    .sort((a, b) => a.total_usd_value - b.total_usd_value);
  
  if (lowVolumeCollections.length > 0) {
    console.log(`\nFound ${lowVolumeCollections.length} collections with very low volume (<$1000):`);
    lowVolumeCollections.slice(0, 10).forEach(collection => {
      console.log(`- "${collection.nftProjectName}": $${collection.total_usd_value.toFixed(2)}`);
    });
    
    if (lowVolumeCollections.length > 10) {
      console.log(`... and ${lowVolumeCollections.length - 10} more`);
    }
  }
}

main(); 