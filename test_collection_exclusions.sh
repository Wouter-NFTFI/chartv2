#!/bin/bash

# Test script to verify collection exclusions with the NFTfi API
echo "Testing collection exclusions with the NFTfi API..."

# Collections to exclude
collections=(
  "Art Blocks V1"
  "Arcade Vault"
  "Arcade Vault V2"
  "Gondi Vault"
  "XCOPY"
  "XCOPY editions 2019-22"
  "SuperRare 1/1s: XCOPY"
  "TRAITORS by XCOPY"
  "MAX PAIN AND FRENS BY XCOPY"
  "Decal by XCOPY"
)

# Function to test a collection query
test_collection() {
  local collection="$1"
  local encoded_collection=$(echo "$collection" | sed 's/ /%20/g')
  echo "Testing collection: $collection"
  
  # Make the API request and get loan count
  local result=$(curl -s "https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_endpoint.json?daysFromNow=365&page_size=10&page=0&nftProjectName=$encoded_collection")
  local loan_count=$(echo "$result" | grep -o '"rows": [0-9]*' | cut -d' ' -f2)
  
  echo "  - Found $loan_count loans for '$collection'"
  
  # Get some sample loan data if available
  if [ "$loan_count" -gt 0 ]; then
    echo "  - Sample loan data:"
    echo "$result" | grep -E 'nftProjectName|principalAmountUSD' | head -6
  fi
  
  echo ""
}

# Run tests for each collection
for collection in "${collections[@]}"; do
  test_collection "$collection"
done

echo "Testing complete!" 