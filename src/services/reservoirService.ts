import type { ReservoirResponse, CollectionFloorPrice } from '../types/reservoir';

const BASE_URL = 'https://api.reservoir.tools/collections/v7';
const API_KEY = import.meta.env.VITE_RESERVOIR_API_KEY;

// Rate limiting configuration
const MAX_REQUESTS_PER_SECOND = 5;
const REQUEST_WINDOW_MS = 1000;

// Request queue to track timestamps
const requestQueue: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove requests older than the window
  while (requestQueue.length > 0 && requestQueue[0] < now - REQUEST_WINDOW_MS) {
    requestQueue.shift();
  }
  return requestQueue.length < MAX_REQUESTS_PER_SECOND;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ReservoirError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservoirError';
  }
}

export async function getCollectionsFloorPrices(): Promise<CollectionFloorPrice[]> {
  if (!API_KEY) {
    throw new ReservoirError('Reservoir API key is not configured');
  }

  try {
    // Check rate limit
    if (!checkRateLimit()) {
      await delay(REQUEST_WINDOW_MS);
    }

    // Add current request to queue
    requestQueue.push(Date.now());

    const queryParams = new URLSearchParams({
      limit: '20',
      sortBy: 'allTimeVolume',
      sortDirection: 'desc'
    });

    const response = await fetch(`${BASE_URL}?${queryParams}`, {
      headers: {
        'x-api-key': API_KEY,
        'accept': '*/*'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ReservoirError(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data: ReservoirResponse = await response.json();

    return data.collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      floorPrice: collection.floorAsk?.price.amount.native || 0,
      floorPriceUSD: collection.floorAsk?.price.amount.usd || 0,
      image: collection.image,
      volume24h: collection.volume['1day'],
      volume7d: collection.volume['7day'],
      volume365d: collection.volume['30day'] * 12, // Approximate 365-day volume
      tokenCount: parseInt(collection.tokenCount),
      onSaleCount: parseInt(collection.onSaleCount)
    }));
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error instanceof ReservoirError ? error : new ReservoirError('Failed to fetch collections');
  }
}

export async function validateApiKey(): Promise<boolean> {
  try {
    await getCollectionsFloorPrices();
    return true;
  } catch {
    return false;
  }
} 