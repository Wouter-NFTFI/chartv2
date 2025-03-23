# NFT Loan Depth Chart - Technical Specification

## Overview
A React-based web application that provides real-time analysis of NFT-backed loans and floor prices, with a focus on data integrity and blockchain accuracy. The application visualizes lending patterns through Loan-to-Value (LTV) ratios for major NFT collections.

## Core Principles

### Blockchain Data Integrity
- CRITICAL: All blockchain data must maintain exact values and case sensitivity
- NO normalization of addresses or collection names
- NO case transformations (toLowerCase/toUpperCase)
- ALWAYS use exact matches for comparisons
- ALWAYS preserve on-chain data exactly as received
- NO mock data - only real, verified blockchain data

### CORS Configuration
- Location: `public/_headers`
- Purpose: Enable cross-origin requests for API endpoints
- Configuration:
  ```
  /*
    Access-Control-Allow-Origin: *
    Access-Control-Allow-Methods: GET, POST, OPTIONS
    Access-Control-Allow-Headers: Content-Type, Accept, Authorization
    Access-Control-Max-Age: 86400
  ```
- Implementation:
  ```typescript
  // src/api/nftfi.ts
  const BASE_URL = import.meta.env.DEV 
    ? 'http://localhost:8788'
    : window.location.origin;

  export const fetchCollections = async (params: { daysFromNow?: number } = {}): Promise<NFTfiCollection[]> => {
    const queryParams = new URLSearchParams({
      daysFromNow: (params.daysFromNow || 365).toString(),
      page_size: '10000'
    });

    const response = await fetch(`${BASE_URL}/api/nftfi/collections?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    });

    return handleResponse(response);
  };
  ```
- Error Handling:
  ```typescript
  const handleResponse = async (response: Response) => {
    if (!response.ok) {
      const error: APIError = {
        message: `HTTP error! status: ${response.status}`,
        code: response.status,
        timestamp: Date.now(),
      };
      try {
        const errorData = await response.json();
        error.details = errorData.message || errorData.error;
      } catch {
        error.details = response.statusText;
      }
      throw error;
    }
    return response.json();
  };
  ```

### Data Visualization Requirements
- Real-time updates of loan depth and price data
- Configurable time ranges for historical data
- Support for both light and dark themes
- Responsive design for different screen sizes
- Clear loading states and error feedback
- Tooltips showing detailed data points
- Interactive zoom and pan controls
- Export functionality for chart data

### Data Processing Requirements
- Loan amount normalization to standard units
- Price aggregation for specified time intervals
- Outlier detection and handling
- Missing data interpolation
- Data validation against on-chain sources
- Browser-side caching for frequently accessed data
- Error handling with user feedback

## Technical Stack

### Frontend
- React 18+
- Vite for build tooling
- Chart.js for visualizations
- Material-UI (MUI) v5 for components
- TypeScript for type safety
- React Query for data fetching and caching

### API Integration

#### 1. NFTfi API
- Base URL: `https://api.nftfi.com`
- Endpoints:
  - Collections: `/loans_due_by_collection_endpoint.json`
    - Parameters:
      - `daysFromNow`: number
      - `page_size`: number (default: 10000)
  - Loans: `/loans_due_endpoint.json`
    - Parameters:
      - `daysFromNow`: number (default: 365)
      - `page_size`: number (default: 1000000)
      - `page`: number (default: 0)
      - `nftProjectName`: string (URL encoded)
- Error Handling:
  - Implement retry logic in React Query
  - Display user-friendly error messages
  - Cache successful responses
  - Handle network timeouts gracefully

#### 2. Reservoir API
- Base URL: `https://api.reservoir.tools`
- Required headers:
  ```typescript
  {
    'Accept': 'application/json',
    'x-api-key': '[Your Reservoir API key]'
  }
  ```
- Endpoints:
  - Collections: `/collections/v7`
    - Parameters (mutually exclusive):
      - `name`: Collection name
      - `contract`: Collection contract address
    - Response format:
      ```typescript
      {
        collections: Array<{
          id: string;
          name: string;
          slug: string;
          contract: string;
          tokenCount: string;
          onSaleCount: string;
          primaryContract: string;
          tokenSetId: string;
          floorAsk: {
            id: string;
            price: {
              amount: {
                raw: string;
                decimal: number;
                usd: number;
                native: number;
              }
            }
          }
        }>
      }
      ```
- Error Handling:
  - Use React Query's built-in retry mechanism
  - Implement exponential backoff
  - Cache successful responses
  - Handle rate limits gracefully

#### 3. NFT Price Floor API
- Base URL: `https://api.nftpricefloor.com`
- Required headers:
  ```typescript
  {
    'Accept': 'application/json'
  }
  ```
- Endpoints:
  - Historical Prices: `/api/projects/{project}/charts/1d`
    - Parameters:
      - `project`: Collection slug (normalized)
      - `qapikey`: API key for authentication
    - Response format:
      ```typescript
      {
        timestamps: number[];      // Unix timestamps in seconds
        floorUsd: number[];       // Floor prices in USD
        floorNative: number[];    // Floor prices in native currency (ETH)
      }
      ```
    - Error handling:
      - 404: Returns empty arrays for timestamps, floorUsd, and floorNative
      - Other errors: Returns error message with timestamp and empty data structure
    - Data processing:
      - Timestamps are converted to milliseconds for frontend use
      - Prices are validated to be non-zero and numeric
      - Data is stored in Map structures keyed by YYYY-MM-DD
      - Missing timestamps are auto-generated based on data length

### API Client Implementation
```typescript
// src/api/client.ts
import axios from 'axios';
import { QueryClient } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
      staleTime: 60000, // Data considered fresh for 1 minute
      cacheTime: 3600000, // Cache kept for 1 hour
    },
  },
});

const createApiClient = (baseURL: string, headers: Record<string, string>) => {
  return axios.create({
    baseURL,
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
    timeout: 10000,
  });
};

export const nftfiClient = createApiClient('https://api.nftfi.com', {});
export const reservoirClient = createApiClient('https://api.reservoir.tools', {
  'x-api-key': process.env.VITE_RESERVOIR_API_KEY || '',
});
export const priceFloorClient = createApiClient('https://api.nftpricefloor.com', {});
```

## Project Structure
```
src/
├── api/
│   ├── reservoir.ts
│   └── nftfi.ts
├── components/
│   ├── Chart/
│   │   ├── DepthChart.tsx
│   │   └── PriceChart.tsx
│   └── common/
│       ├── CollectionSelector.tsx
│       └── InfoPanel.tsx
├── config/
│   ├── api.ts        # API endpoints & configurations
│   └── constants.ts  # Collection addresses & constants
├── types/
│   ├── api.ts
│   └── blockchain.ts
├── utils/
│   ├── formatting.ts
│   └── validation.ts
└── App.tsx
```

## Special Collection Handling

### Wrapped CryptoPunks Integration
```typescript
// Critical contract addresses for CryptoPunks ecosystem
export const PUNK_ADDRESSES = {
  CRYPTOPUNKS: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
  WRAPPED_PUNKS: '0xb7f7f6c52f2e2fdb1963eab30438024864c313f6',
} as const;

// Special collection mapping for data aggregation
export const COLLECTION_MAPPING = {
  [PUNK_ADDRESSES.WRAPPED_PUNKS]: {
    baseCollection: PUNK_ADDRESSES.CRYPTOPUNKS,
    name: 'CryptoPunks',
    requiresSpecialHandling: true
  }
} as const;
```

### Collection Address Registry
```typescript
export const COLLECTION_ADDRESSES = {
  'CryptoPunks': '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
  'Bored Ape Yacht Club': '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  'Azuki': '0xed5af388653567af2f388e6224dc7c4b3241c544',
  'Doodles': '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
  'MAYC': '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
  'CloneX': '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
  'Moonbirds': '0x23581767a106ae21c074b2276d25e5c3e136a68b',
  'World Of Women': '0xe785e82358879f061bc3dcac6f0444462d4b5330'
} as const;
```

## Chart Components

### Depth Chart Features
1. Display Modes:
   ```typescript
   enum DepthChartMode {
     CUMULATIVE = 'cumulative',
     NON_CUMULATIVE = 'non-cumulative'
   }
   ```

2. Data Processing:
   ```typescript
   interface DepthChartData {
     amounts: string[];          // Loan amounts in wei
     cumulative: string[];      // Cumulative sum
     nonCumulative: string[];   // Individual amounts
     totalVolume: string;       // Total loan volume
     loanCount: number;         // Total number of loans
   }
   ```

3. Chart Configuration:
   ```typescript
   const chartConfig = {
     cumulative: {
       fill: true,
       stepped: true,
       tension: 0.4,
     },
     nonCumulative: {
       fill: false,
       stepped: false,
       barPercentage: 0.95,
     }
   };
   ```

### Historical Price Chart
```typescript
interface PriceData {
  floorPriceEth: string;    // Current floor in ETH
  floorPriceUsd: string;    // Current floor in USD
  historicalEth: {
    timestamp: number;
    price: string;
  }[];
  historicalUsd: {
    timestamp: number;
    price: string;
  }[];
}
```

## Data Processing

### Loan Data Processing
```typescript
interface ProcessedLoan {
  id: string;
  principalAmount: string;      // In wei
  repaymentAmount: string;      // In wei
  duration: string;             // In seconds
  apr: string;                  // Annual rate
  timestamp: string;
  nftCollateral: {
    contractAddress: string;    // Preserve case
    tokenId: string;
  };
  lender: string;              // Ethereum address
  borrower: string;            // Ethereum address
}
```

### Special Handling for Wrapped Punks
```typescript
async function fetchWrappedPunkData(timeRange: TimeRange): Promise<AggregatedPunkData> {
  // Fetch data for both contracts in parallel
  const [cryptoPunksData, wrappedPunksData] = await Promise.all([
    fetchCollectionData(PUNK_ADDRESSES.CRYPTOPUNKS),
    fetchCollectionData(PUNK_ADDRESSES.WRAPPED_PUNKS)
  ]);

  // Use CryptoPunks floor price for both
  const floorPrice = await fetchNFTPriceFloorData('cryptopunks', timeRange);

  // Combine loan data
  const combinedLoans = mergePunkLoans(
    cryptoPunksData.loans,
    wrappedPunksData.loans
  );

  return {
    floorPrice,
    loans: combinedLoans,
    wrappedStatus: new Map(wrappedPunksData.tokens.map(token => [token.tokenId, true]))
  };
}
```

## Environment Setup
```env
VITE_RESERVOIR_API_KEY=your-reservoir-api-key
VITE_NFTFI_API_KEY=your-nftfi-api-key
VITE_PRICEFLOOR_API_KEY=your-pricefloor-api-key
```

## Error Handling
```typescript
interface APIError {
  source: 'theta' | 'reservoir' | 'pricefloor';
  endpoint: string;
  statusCode: number;
  message: string;
  timestamp: number;
}

async function handleAPIError(error: APIError): Promise<void> {
  console.error(`[${error.source}] API Error:`, error);

  if (error.statusCode === 429) {
    await exponentialBackoff(error.source);
  }

  switch (error.source) {
    case 'theta':
      handleThetaError(error);
      break;
    case 'pricefloor':
      handlePriceFloorError(error);
      break;
  }
}
```

## Performance Considerations
- Implement request debouncing
- Cache validated collection addresses
- Optimize chart rendering
- Handle large datasets efficiently

## Security
- No client-side address manipulation
- Validate all input against blockchain data
- Secure API key handling
- Rate limiting implementation

### State Management
- React Context for global state
- Local storage for user preferences
- Memory cache for API responses
- Debounced API requests
- Optimistic UI updates

### Data Flow
```typescript
interface DataFlow {
  // Collection selection
  userInput -> collectionValidation -> dataFetch;
  
  // Data processing
  rawData -> validation -> normalization -> aggregation -> visualization;
  
  // Error handling
  error -> retry -> fallback -> userFeedback;
  
  // Caching
  apiResponse -> cache -> expiryCheck -> refresh;
}
```

### API Response Caching
```typescript
interface CacheConfig {
  collections: {
    ttl: 300,  // 5 minutes
    maxSize: 100
  },
  loans: {
    ttl: 60,   // 1 minute
    maxSize: 50
  },
  prices: {
    ttl: 120,  // 2 minutes
    maxSize: 200
  }
}
```

### Performance Optimizations
```typescript
const PERFORMANCE_CONFIG = {
  maxPointsPerChart: 1000,
  debounceInterval: 250,
  loadingThreshold: 500,
  renderChunkSize: 100,
  maxConcurrentRequests: 3
} as const;
```

## App Layout
```typescript
interface AppLayout {
  header: {
    collectionSelector: CollectionSelector;
    timeRangeSelector: TimeRangeSelector;
    displayModeToggle: DisplayModeToggle; // Cumulative vs Non-cumulative
  };
  main: {
    ltvChart: LTVChart;
    infoPanel: {
      totalLoans: string;
      totalVolume: string;
      averageLTV: string;
      floorPrice: string;
    };
  };
}
```

## LTV Chart Specifications

### Core Metrics
```typescript
interface LTVMetrics {
  loanAmount: string;        // In wei
  floorPrice: string;       // In wei
  ltv: number;             // Calculated as (loanAmount / floorPrice) * 100
  timestamp: number;       // Unix timestamp
}

interface LTVChartData extends DepthChartData {
  ltv: number[];           // LTV percentages
  dangerZone: {
    threshold: 100,        // 100% LTV threshold
    color: '#ff4444'      // Red color for danger zone
  };
  yAxis: {
    label: 'Loan to Value (%)',
    range: [0, 150],      // Show up to 150% LTV
    dangerZoneStart: 100  // Highlight loans above 100% LTV
  };
  xAxis: {
    label: 'Cumulative Loan Volume (ETH)',
    secondaryLabel: 'Number of Loans' // For non-cumulative view
  };
}
```

### Chart Tooltip
```typescript
interface ChartTooltip {
  position: {
    // Smart positioning to avoid screen edges
    x: number;            // Adjusted x-coordinate
    y: number;            // Adjusted y-coordinate
    offset: number;       // Distance from data point
    boundary: DOMRect;    // Viewport boundaries
  };
  content: {
    ltv: string;         // "85.5% LTV"
    loanAmount: string;  // "10.5 ETH"
    usdValue: string;    // "$15,750"
    date: string;        // "2024-02-20"
    count?: number;      // Number of loans (non-cumulative only)
  };
  behavior: {
    showDelay: 50;       // ms delay before showing
    hideDelay: 0;        // ms delay before hiding
    followCursor: true;  // Move with cursor
    snapToDataPoint: true; // Snap to nearest data point
  };
  style: {
    background: string;
    border: string;
    borderRadius: string;
    padding: string;
    fontSize: string;
    fontFamily: string;
    boxShadow: string;
  };
}

// Tooltip positioning logic
function calculateTooltipPosition(
  point: { x: number; y: number },
  tooltip: HTMLElement,
  chart: HTMLElement
): Position {
  const padding = 10;
  const chartRect = chart.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Default position (right of point)
  let position = {
    x: point.x + padding,
    y: point.y - (tooltipRect.height / 2)
  };
  
  // Check right edge
  if (position.x + tooltipRect.width > chartRect.right) {
    position.x = point.x - tooltipRect.width - padding;
  }
  
  // Check top/bottom edges
  if (position.y < chartRect.top) {
    position.y = chartRect.top + padding;
  } else if (position.y + tooltipRect.height > chartRect.bottom) {
    position.y = chartRect.bottom - tooltipRect.height - padding;
  }
  
  return position;
}
```

### Chart Modes
```typescript
interface ChartModes {
  cumulative: {
    xAxis: 'Total Volume (ETH)';
    yAxis: 'LTV (%)';
    fill: true;
    stepped: true;
    showDangerZone: true;  // Red area above 100% LTV
  };
  nonCumulative: {
    xAxis: 'Number of Loans';
    yAxis: 'LTV (%)';
    fill: false;
    type: 'bar';
    barColors: {
      normal: '#2196f3';
      danger: '#ff4444';  // Bars above 100% LTV
    };
  };
}
```

### Data Processing for LTV
```typescript
function processLTVData(loans: ProcessedLoan[], floorPrice: string): LTVChartData {
  return loans
    .map(loan => ({
      ltv: (BigInt(loan.principalAmount) * BigInt(100)) / BigInt(floorPrice),
      amount: loan.principalAmount,
      timestamp: loan.timestamp
    }))
    .sort((a, b) => Number(a.ltv) - Number(b.ltv))
    .reduce((acc, curr) => ({
      ltv: [...acc.ltv, curr.ltv],
      amounts: [...acc.amounts, curr.amount],
      cumulative: [...acc.cumulative, acc.cumulative.at(-1) || 0n + BigInt(curr.amount)],
      timestamps: [...acc.timestamps, curr.timestamp]
    }), {
      ltv: [],
      amounts: [],
      cumulative: [],
      timestamps: []
    });
}
```

### Custom Tooltip HTML/CSS
```html
<div class="chart-tooltip" id="chartTooltip">
  <div class="tooltip-header">
    <span class="ltv-value">85.5% LTV</span>
    <span class="loan-date">2024-02-20</span>
  </div>
  <div class="tooltip-body">
    <div class="loan-amount">
      <span class="label">Loan Amount:</span>
      <span class="value">10.5 ETH</span>
    </div>
    <div class="usd-value">
      <span class="label">USD Value:</span>
      <span class="value">$15,750</span>
    </div>
    <div class="loan-count" data-visible="non-cumulative">
      <span class="label">Number of Loans:</span>
      <span class="value">5</span>
    </div>
  </div>
</div>
```

```css
.chart-tooltip {
  position: absolute;
  z-index: 1000;
  background: rgba(32, 34, 37, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
  pointer-events: none;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  backdrop-filter: blur(2px);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ltv-value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.loan-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.tooltip-body > div {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
}

.tooltip-body .label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.tooltip-body .value {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

[data-visible="non-cumulative"] {
  display: none;
}

.chart-tooltip.non-cumulative [data-visible="non-cumulative"] {
  display: flex;
}
```

### Draggable Collection Info Box
```html
<div class="collection-info-box" id="collectionInfoBox">
  <div class="drag-handle">
    <div class="drag-icon"></div>
  </div>
  <div class="collection-header">
    <img class="collection-image" src="${collectionImage}" alt="${collectionName}" />
    <div class="collection-title">
      <h3>${collectionName}</h3>
      <a href="https://etherscan.io/address/${contractAddress}" target="_blank" class="contract-link">
        ${shortenAddress(contractAddress)}
      </a>
    </div>
  </div>
  <div class="collection-stats">
    <div class="stat-row">
      <span class="stat-label">Floor Price</span>
      <span class="stat-value">${floorPrice} ETH</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Total Loans</span>
      <span class="stat-value">${totalLoans}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Total Volume</span>
      <span class="stat-value">${totalVolume} ETH</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Average LTV</span>
      <span class="stat-value">${averageLTV}%</span>
    </div>
  </div>
</div>
```

```css
.collection-info-box {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(32, 34, 37, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  width: 280px;
  padding: 16px;
  cursor: move;
  user-select: none;
  backdrop-filter: blur(2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 900;
}

.drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}

.drag-icon {
  width: 16px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  position: relative;
}

.drag-icon::before,
.drag-icon::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
}

.drag-icon::before { top: -4px; }
.drag-icon::after { bottom: -4px; }

.collection-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.collection-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

.collection-title h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.contract-link {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-decoration: none;
  margin-top: 4px;
  display: block;
}

.contract-link:hover {
  color: #fff;
}

.collection-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.stat-value {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}
```

```typescript
// Draggable functionality
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startLeft: number;
  startBottom: number;
}

function initializeDraggable(element: HTMLElement): void {
  const dragState: DragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startBottom: 0
  };

  element.addEventListener('mousedown', (e: MouseEvent) => {
    if (!element.contains(e.target as Node)) return;
    
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.startLeft = parseInt(element.style.left || '0');
    dragState.startBottom = parseInt(element.style.bottom || '0');
    
    element.style.transition = 'none';
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const newLeft = dragState.startLeft + deltaX;
    const newBottom = dragState.startBottom - deltaY;
    
    // Boundary checks
    const chartBounds = document.querySelector('.chart-container').getBoundingClientRect();
    const boxBounds = element.getBoundingClientRect();
    
    element.style.left = `${Math.max(10, Math.min(newLeft, chartBounds.width - boxBounds.width - 10))}px`;
    element.style.bottom = `${Math.max(10, Math.min(newBottom, chartBounds.height - boxBounds.height - 10))}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragState.isDragging) return;
    
    dragState.isDragging = false;
    element.style.cursor = 'move';
    element.style.transition = 'box-shadow 0.2s ease';
  });
}
``` 