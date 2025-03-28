export interface ReservoirCollection {
  chainId: number;
  id: string;
  slug: string;
  name: string;
  image?: string;
  floorAsk?: {
    price: {
      currency: {
        contract: string;
        name: string;
        symbol: string;
        decimals: number;
      };
      amount: {
        raw: string;
        decimal: number;
        usd: number;
        native: number;
      };
    };
  };
  tokenCount: string;
  onSaleCount: string;
  volume: {
    '1day': number;
    '7day': number;
    '30day': number;
    allTime: number;
  };
}

export interface ReservoirResponse {
  collections: ReservoirCollection[];
}

export interface CollectionFloorPrice {
  id: string;
  name: string;
  image?: string;
  volume24h: number;
  volume7d: number;
  volume365d: number;
  marketShare: number;
  tokenCount: number;
  onSaleCount: number;
  floorPrice: number;
  floorPriceUSD: number;
  avgAPR: number;
  loanCount: number;
}

export interface NFTfiCollection {
  nftProjectName: string;
  nftProjectImageUri: string;
  total_usd_value: number;
  avg_usd_value: number;
  avg_apr: number;
  loan_count: number;
  volumePercentage?: number;
} 