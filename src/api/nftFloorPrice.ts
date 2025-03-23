// Follow rules from .cursor-ruleset.md
// Get latest NFT floor price from verified contract ABI
// Do not use fallbacks, mock data, or normalized fields

interface FloorPriceResponse {
  floorPrice: string;
  currency: string;
  timestamp: number;
}

export async function getNFTFloorPrice(contractAddress: string): Promise<FloorPriceResponse> {
  try {
    const response = await fetch(`https://api.example.com/nft/${contractAddress}/floor-price`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch floor price: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching NFT floor price:', error);
    throw error;
  }
} 