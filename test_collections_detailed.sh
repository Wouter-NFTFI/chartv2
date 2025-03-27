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

echo "Testing collections for NFTfi loan data and Reservoir floor price data (Detailed Analysis)"
echo "======================================================================================="

for collection in "${COLLECTIONS[@]}"; do
  echo -e "\n\n========== DETAILED ANALYSIS FOR: $collection =========="
  
  # URL encode the collection name
  encoded_collection=$(echo "$collection" | sed 's/ /%20/g')
  
  # 1. Fetch more loans from NFTfi API for better analysis
  echo "Fetching loans from NFTfi API..."
  nftfi_response_file="test_results/${collection// /_}_nftfi_detailed.json"
  curl -s "$NFTFI_API?daysFromNow=365&page_size=100&page=0&nftProjectName=$encoded_collection" > "$nftfi_response_file"
  
  # Extract loan count and sample contract address if available
  loan_count=$(jq '.data | length' "$nftfi_response_file")
  
  if [ "$loan_count" -gt 0 ]; then
    contract_address=$(jq -r '.data[0].nftAddress' "$nftfi_response_file")
    contract_addresses=$(jq -r '.data[].nftAddress' "$nftfi_response_file" | sort | uniq | tr '\n' ',' | sed 's/,$//')
    loan_amounts=$(jq -r '.data[].principalAmountUSD' "$nftfi_response_file")
    avg_loan_amount=$(echo "$loan_amounts" | awk '{ sum += $1 } END { print sum/NR }')
    max_loan_amount=$(echo "$loan_amounts" | sort -n | tail -1)
    min_loan_amount=$(echo "$loan_amounts" | sort -n | head -1)
    
    echo "Loan Statistics:"
    echo "- Total loans found: $loan_count"
    echo "- Unique contract addresses: $contract_addresses"
    echo "- Average loan amount (USD): $avg_loan_amount"
    echo "- Min loan amount (USD): $min_loan_amount"
    echo "- Max loan amount (USD): $max_loan_amount"
    
    # Sample loan data
    echo -e "\nSample loan data:"
    jq -r '.data[0] | {loanId, protocolName, nftId, principalAmountUSD, nftAddress, nftProjectName}' "$nftfi_response_file"
    
    # 2. Test Reservoir API for each unique contract address
    echo -e "\nReservoir API floor price checks:"
    IFS=',' read -ra ADDRESSES <<< "$contract_addresses"
    for address in "${ADDRESSES[@]}"; do
      echo -e "\nChecking address: $address"
      reservoir_response_file="test_results/${collection// /_}_${address}_reservoir_detailed.json"
      
      curl -s -X GET "$RESERVOIR_API?id=$address" \
        -H "accept: application/json" \
        -H "x-api-key: $API_KEY" > "$reservoir_response_file"
      
      # Extract floor price and details
      has_data=$(jq '.collections | length' "$reservoir_response_file")
      
      if [ "$has_data" -gt 0 ]; then
        collection_id=$(jq -r '.collections[0].id' "$reservoir_response_file")
        collection_name=$(jq -r '.collections[0].name' "$reservoir_response_file")
        floor_price_usd=$(jq -r '.collections[0].floorAsk.price.amount.usd // "Not available"' "$reservoir_response_file")
        floor_price_eth=$(jq -r '.collections[0].floorAsk.price.amount.decimal // "Not available"' "$reservoir_response_file")
        collection_volume=$(jq -r '.collections[0].volume.allTime // "Not available"' "$reservoir_response_file")
        token_count=$(jq -r '.collections[0].tokenCount // "Not available"' "$reservoir_response_file")
        
        echo "Collection ID: $collection_id"
        echo "Collection Name: $collection_name"
        echo "Floor price (USD): $floor_price_usd"
        echo "Floor price (ETH): $floor_price_eth"
        echo "All-time volume: $collection_volume"
        echo "Token count: $token_count"
      else
        echo "No data found in Reservoir API for this address"
      fi
    done
    
    # 3. Analyze floor price issues
    echo -e "\nFloor Price Analysis:"
    floor_prices_available=0
    for address in "${ADDRESSES[@]}"; do
      reservoir_response_file="test_results/${collection// /_}_${address}_reservoir_detailed.json"
      has_data=$(jq '.collections | length' "$reservoir_response_file")
      
      if [ "$has_data" -gt 0 ]; then
        floor_price=$(jq -r '.collections[0].floorAsk.price.amount.usd // "0"' "$reservoir_response_file")
        if [ "$floor_price" != "0" ] && [ "$floor_price" != "null" ] && [ "$floor_price" != "Not available" ]; then
          floor_prices_available=$((floor_prices_available + 1))
        fi
      fi
    done
    
    if [ "$floor_prices_available" -eq 0 ]; then
      echo "PROBLEM: No floor prices available for any contract address"
      echo "This explains why charts can't be generated - LTV calculation would fail"
      
      # Calculate alternative floor prices from loan amounts
      echo -e "\nAlternative floor price calculation:"
      echo "If we assume a typical LTV ratio of 50%, estimated floor price would be:"
      estimated_floor=$(echo "$avg_loan_amount * 2" | bc)
      echo "- Based on average loan amount: \$$estimated_floor"
    else
      echo "Floor prices are available for $floor_prices_available/${#ADDRESSES[@]} contract addresses"
      if [ "$floor_prices_available" -lt "${#ADDRESSES[@]}" ]; then
        echo "Some addresses have missing floor prices, which can affect chart generation"
      fi
    fi
  else
    echo "No loans found for this collection"
  fi
  
  # 4. Summary and recommendation
  echo -e "\n----------- SUMMARY AND RECOMMENDATION -----------"
  if [ "$loan_count" -gt 0 ]; then
    if [ "$floor_prices_available" -eq 0 ]; then
      echo "Collection: $collection"
      echo "Status: PROBLEMATIC - Has loans but no floor price data"
      echo "Loan count: $loan_count loans available"
      echo "Recommendation: REMOVE FROM APP or implement custom floor price mapping"
    else
      echo "Collection: $collection"
      echo "Status: SHOULD WORK - Has loans and floor price data"
      echo "Loan count: $loan_count loans available"
      echo "Recommendation: KEEP IN APP"
    fi
  else
    echo "Collection: $collection"
    echo "Status: NO LOANS - No data to display"
    echo "Recommendation: REMOVE FROM APP as there's no data to show"
  fi
  
  echo "========== END OF ANALYSIS FOR: $collection =========="
done

echo -e "\nAll detailed tests completed. Results saved in test_results directory." 