#!/bin/bash

# API endpoint for NFTfi collections
COLLECTIONS_API="https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_by_collection_endpoint.json?howDaysFromNow=365&page_size=100"

# Create output directory for test results
mkdir -p test_results

# Fetch the collections data
echo "Fetching collections data from NFTfi API..."
curl -s "$COLLECTIONS_API" > test_results/collections_raw.json

# Extract collection names for easy viewing
jq -r '.data[] | .nftProjectName' test_results/collections_raw.json > test_results/collection_names.txt
echo "Found $(wc -l < test_results/collection_names.txt) collections"

# Test javascript normalization function with Node.js
echo "Testing normalization logic..."
cat > test_results/normalize_test.cjs << 'EOF'
/**
 * Normalize a collection name for consistent comparison
 * - Convert to lowercase
 * - Remove all spaces
 * - Remove common suffixes like "by X"
 * - Remove special characters
 */
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

// Collections to test normalization on
const testCases = [
    ["Chromie Squiggles by Snowfro", "Chromie Squiggle by Snowfro"],
    ["Fidenza", "Fidenza by Tyler Hobbs"],
    ["Wrapped SuperRare", "WrappedSuperRare"],
    ["Known Origin", "KnownOrigin"],
    ["CryptoPunks 721", "Wrapped CryptoPunks"],
    ["Ringers", "Ringers by Dmitri Cherniak"],
    ["XCOPY", "XCOPY Official"],
    ["ArtBlocks", "Art Blocks"],
    ["BAYC", "Bored Ape Yacht Club"]
];

console.log("Testing normalization function with pairs:");
testCases.forEach(([a, b]) => {
    const normA = normalizeCollectionName(a);
    const normB = normalizeCollectionName(b);
    console.log(`Original: "${a}" vs "${b}"`);
    console.log(`Normalized: "${normA}" vs "${normB}"`);
    console.log(`Match: ${normA === normB}`);
    console.log("---");
});

// Process collection names from the API
const fs = require('fs');
const collections = JSON.parse(fs.readFileSync('test_results/collections_raw.json')).data;

// Map of normalized names to original names (to detect duplicates after normalization)
const normalizedMap = new Map();

// Check for normalization collisions
collections.forEach(collection => {
    const original = collection.nftProjectName;
    const normalized = normalizeCollectionName(original);
    
    if (normalizedMap.has(normalized)) {
        console.log(`WARNING: Normalization collision between "${original}" and "${normalizedMap.get(normalized)}"`);
        console.log(`Both normalize to: "${normalized}"`);
    } else {
        normalizedMap.set(normalized, original);
    }
});

// Test exclusion list against collection names
const exclusionList = [
    "Chromie Squiggles by Snowfro",
    "Fidenza",
    "Ringers",
    "Wrapped SuperRare",
    "Known Origin"
];

console.log("\n\nTesting exclusion list against actual collection names:");
const normalizedExclusions = exclusionList.map(name => normalizeCollectionName(name));

collections.forEach(collection => {
    const original = collection.nftProjectName;
    const normalized = normalizeCollectionName(original);
    
    if (normalizedExclusions.includes(normalized)) {
        console.log(`SHOULD EXCLUDE: "${original}" (normalizes to "${normalized}")`);
    }
});
EOF

# Run the normalization test
node test_results/normalize_test.cjs > test_results/normalization_results.txt
echo "Normalization test results saved to test_results/normalization_results.txt"

# Show results
echo "----- Normalization Test Results -----"
cat test_results/normalization_results.txt

echo -e "\n----- Top 10 Collection Names (Raw) -----"
head -10 test_results/collection_names.txt

echo -e "\nVerification complete. All results saved in test_results directory." 