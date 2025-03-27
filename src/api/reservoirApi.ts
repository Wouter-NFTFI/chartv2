import { getMappedContractAddress } from '../utils/contractAddressMappings';

const RESERVOIR_API_URL = 'https://api.reservoir.tools';
const RESERVOIR_API_KEY = import.meta.env.VITE_RESERVOIR_API_KEY || 'demo-api-key';

/**
 * Fetches the current floor price for an NFT collection using its contract address
 * 
 * This function includes a fallback mechanism to handle contract addresses that 
 * lack floor price data by mapping them to alternative contracts that represent
 * the same underlying assets but do have floor price data available.
 * 
 * @param contractAddress The NFT collection's contract address
 * @returns The floor price in USD, or 0 if not available
 */
export async function getCurrentFloorPrice(contractAddress: string): Promise<number> {
  try {
    // Apply contract address mapping if needed
    const mappedAddress = getMappedContractAddress(contractAddress);
    
    // If different, log that we're using a mapped address
    if (mappedAddress.toLowerCase() !== contractAddress.toLowerCase()) {
      console.log(`Using mapped contract address for floor price data: ${contractAddress} → ${mappedAddress}`);
    }
    
    // Make the API request with the potentially mapped address
    const response = await fetch(`${RESERVOIR_API_URL}/collections/v6?id=${mappedAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': RESERVOIR_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch floor price for contract: ${mappedAddress} (original: ${contractAddress})`);
    }
    
    const data = await response.json();
    const floorPrice = data.collections?.[0]?.floorAsk?.price?.amount?.usd || 0;
    
    // Log the result for debugging
    if (floorPrice > 0) {
      console.log(`Floor price found for ${mappedAddress}: $${floorPrice.toLocaleString()}`);
    } else {
      console.warn(`No floor price data available for ${mappedAddress} (original: ${contractAddress})`);
    }
    
    return floorPrice;
  } catch (error) {
    console.error('Error fetching floor price:', error);
    throw error;
  }
} 