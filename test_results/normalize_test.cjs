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
