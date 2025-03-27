#!/bin/bash

# Define collections to test
COLLECTIONS=("CryptoPunks 721" "Chromie Squiggles by Snowfro" "Fidenza" "Ringers" "Wrapped SuperRare" "Known Origin" "Arcade Vault" "Gondi Vault" "XCOPY")

# Define API endpoints
NFTFI_API="https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_endpoint.json"
RESERVOIR_API="https://api.reservoir.tools/collections/v6"

# API Key for Reservoir (using demo key)
API_KEY="demo-api-key"

# Create output directory
mkdir -p test_results

echo "Testing collections for NFTfi loan data and Reservoir floor price data"
echo "=====================================================================\n"

for collection in "${COLLECTIONS[@]}"; do
  echo "Testing collection: $collection"
  echo "---------------------------------"
  
  # URL encode the collection name
  encoded_collection=$(echo "$collection" | sed 's/ /%20/g')
  
  # 1. Fetch loans from NFTfi API
  echo "Fetching loans from NFTfi API..."
  nftfi_response_file="test_results/${collection// /_}_nftfi.json"
  curl -s "$NFTFI_API?daysFromNow=365&page_size=10&page=0&nftProjectName=$encoded_collection" > "$nftfi_response_file"
  
  # Extract loan count and sample contract address if available
  loan_count=$(jq '.data | length' "$nftfi_response_file")
  contract_address=$(jq -r '.data[0].nftAddress // "Not available"' "$nftfi_response_file")
  
  echo "Loan count: $loan_count"
  echo "Contract address: $contract_address"
  
  # 2. If we have a contract address, test Reservoir API for floor price
  if [ "$contract_address" != "Not available" ] && [ "$contract_address" != "null" ]; then
    echo "Fetching floor price from Reservoir API..."
    reservoir_response_file="test_results/${collection// /_}_reservoir.json"
    
    curl -s -X GET "$RESERVOIR_API?id=$contract_address" \
      -H "accept: application/json" \
      -H "x-api-key: $API_KEY" > "$reservoir_response_file"
    
    # Extract floor price
    floor_price=$(jq -r '.collections[0].floorAsk.price.amount.usd // "Not available"' "$reservoir_response_file")
    collection_id=$(jq -r '.collections[0].id // "Not available"' "$reservoir_response_file")
    collection_name=$(jq -r '.collections[0].name // "Not available"' "$reservoir_response_file")
    
    echo "Collection ID: $collection_id"
    echo "Collection Name: $collection_name"
    echo "Floor price in USD: $floor_price"
  else
    echo "No contract address available, skipping Reservoir API check"
  fi
  
  # Create a summary for this collection
  echo -e "\nSummary for $collection:"
  echo "- Has loans in NFTfi API: $([ "$loan_count" -gt 0 ] && echo "Yes ($loan_count loans)" || echo "No")"
  echo "- Has valid contract address: $([ "$contract_address" != "Not available" ] && [ "$contract_address" != "null" ] && echo "Yes ($contract_address)" || echo "No")"
  
  if [ "$contract_address" != "Not available" ] && [ "$contract_address" != "null" ]; then
    echo "- Has floor price data in Reservoir: $([ "$floor_price" != "Not available" ] && [ "$floor_price" != "null" ] && [ "$floor_price" != "0" ] && echo "Yes (\$$floor_price)" || echo "No")"
  else
    echo "- Has floor price data in Reservoir: N/A (no contract address)"
  fi
  
  # Check if this collection would fail in our app
  if [ "$loan_count" -gt 0 ] && [ "$contract_address" != "Not available" ] && [ "$contract_address" != "null" ]; then
    if [ "$floor_price" == "Not available" ] || [ "$floor_price" == "null" ] || [ "$floor_price" == "0" ]; then
      echo "PROBLEM DETECTED: This collection has loans but no valid floor price, which would cause chart issues in the app."
    else
      echo "All data available, should work properly in the app."
    fi
  elif [ "$loan_count" -gt 0 ]; then
    echo "PROBLEM DETECTED: This collection has loans but no valid contract address, which would cause chart issues in the app."
  else
    echo "No loans available, would not show any data in the app."
  fi
  
  echo -e "\n\n"
done

echo "All tests completed. Results saved in test_results directory." 