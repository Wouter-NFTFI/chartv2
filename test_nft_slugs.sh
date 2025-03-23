#!/bin/bash

# Set API key
API_KEY="90414d13-22fa-4477-b1f9-55d4387a731b"

# Function to test a slug and print results
test_slug() {
    local slug=$1
    local name=$2
    
    echo "==================================================="
    echo "Testing: $name (slug: $slug)"
    echo "==================================================="
    
    response=$(curl -s "https://api.nftpricefloor.com/api/projects/$slug/charts/1d?qapikey=$API_KEY")
    
    # Check if response contains error
    if [[ $response == *"error"* ]]; then
        echo "❌ ERROR: Slug not found"
        echo "$response"
    else
        # Extract and display key information
        echo "✅ SUCCESS: Slug is valid"
        # Display a small sample of the data
        echo "$response" | head -50 | grep -E 'slug|granularity|timestamps|floorNative'
    fi
    echo ""
}

# Test various collections with different slug formats
test_slug "azuki" "Azuki"
test_slug "cryptopunks" "CryptoPunks"
test_slug "pudgy-penguins" "Pudgy Penguins"
test_slug "bored-ape-yacht-club" "Bored Ape Yacht Club"
test_slug "bayc" "Bored Ape Yacht Club (BAYC)"
test_slug "clonex" "CloneX"
test_slug "doodles" "Doodles"
test_slug "moonbirds" "Moonbirds"
test_slug "mutant-ape-yacht-club" "Mutant Ape Yacht Club"
test_slug "mayc" "Mutant Ape Yacht Club (MAYC)"
test_slug "veefriends" "VeeFriends"
test_slug "world-of-women" "World of Women"
test_slug "cool-cats" "Cool Cats"
test_slug "dooplicator" "Dooplicator"
test_slug "otherdeed" "Otherdeed"

echo "Testing complete!" 