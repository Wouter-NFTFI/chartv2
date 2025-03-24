const RESERVOIR_API_URL = 'https://api.reservoir.tools';
const RESERVOIR_API_KEY = import.meta.env.VITE_RESERVOIR_API_KEY || 'demo-api-key';

export async function getCurrentFloorPrice(contractAddress: string): Promise<number> {
  try {
    const response = await fetch(`${RESERVOIR_API_URL}/collections/v6?id=${contractAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': RESERVOIR_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch floor price for contract: ${contractAddress}`);
    }
    const data = await response.json();
    return data.collections?.[0]?.floorAsk?.price?.amount?.usd || 0;
  } catch (error) {
    console.error('Error fetching floor price:', error);
    throw error;
  }
} 