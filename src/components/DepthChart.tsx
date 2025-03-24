import React, { useState, useEffect } from 'react';
import { Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart } from 'recharts';
import { NFTfiCollection } from '../types/reservoir';
import { fetchLoanDistribution, LoanDistributionResponseItem } from '../api/nftfiApi';
import './DepthChart.css';

interface DepthChartProps {
  collection: NFTfiCollection | null;
  onDataPointClick: (ltv: number) => void;
}

interface DataPoint {
  ltv: number;
  value: number;
  cumulativeValue: number;
  loanCount: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DataPoint;
  }>;
}

interface LoanBucket {
  ltv: number;
  loanCount: number;
  totalValue: number;
}

export function DepthChart({ collection, onDataPointClick }: DepthChartProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucketData, setBucketData] = useState<DataPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!collection || !collection.nftProjectName) return;
      
      console.log('DepthChart: Fetching data for collection:', collection.nftProjectName);
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch raw loan data
        const loanData: LoanDistributionResponseItem[] = await fetchLoanDistribution(collection.nftProjectName);
        console.log('DepthChart: Received raw loan data:', loanData.length, 'items');
        
        // Get current floor price in ETH
        const floorPriceETH = 39; // TODO: Get this from API
        console.log('Using floor price:', floorPriceETH, 'ETH');
        
        if (!loanData || loanData.length === 0) {
          console.warn('No loan data available');
          // Create some example data for development purposes
          const exampleData: DataPoint[] = [
            { ltv: 25, value: 50000, cumulativeValue: 50000, loanCount: 5 },
            { ltv: 50, value: 75000, cumulativeValue: 125000, loanCount: 10 },
            { ltv: 75, value: 25000, cumulativeValue: 150000, loanCount: 3 }
          ];
          console.log('DepthChart: Using example data instead');
          setBucketData(exampleData);
          return;
        }
        
        // Calculate LTV for each loan
        const ltvValues: number[] = [];
        console.log('Raw loan data sample:', loanData.slice(0, 5));
        
        loanData.forEach((loan, index) => {
          if (loan.principalAmount) {
            // LTV is principal amount in ETH divided by floor price in ETH
            const ltv = (loan.principalAmount / floorPriceETH) * 100;
            if (index < 5) {
              console.log(`Sample loan ${index + 1}:`, {
                principalETH: loan.principalAmount,
                floorPriceETH: floorPriceETH,
                calculatedLTV: ltv,
                raw: loan
              });
            }
            ltvValues.push(ltv);
          }
        });
        
        // Find min and max LTV
        const minLtv = Math.min(...ltvValues);
        const maxLtv = Math.max(...ltvValues);
        console.log(`DepthChart: Full LTV range: ${minLtv.toFixed(2)}% to ${maxLtv.toFixed(2)}%`);
        console.log('LTV values distribution:', {
          total: ltvValues.length,
          sample: ltvValues.slice(0, 10),
          histogram: ltvValues.reduce((acc, ltv) => {
            const bucket = Math.floor(ltv / 50) * 50;
            acc[bucket] = (acc[bucket] || 0) + 1;
            return acc;
          }, {} as Record<number, number>)
        });
        
        // Create buckets with 5% increments
        const bucketSize = 5;
        const minBucket = Math.floor(minLtv / bucketSize) * bucketSize;
        const maxBucket = Math.ceil(maxLtv / bucketSize) * bucketSize;
        
        // Create buckets
        const buckets: { [key: number]: LoanBucket } = {};
        for (let i = minBucket; i <= maxBucket; i += bucketSize) {
          buckets[i] = {
            ltv: i,
            loanCount: 0,
            totalValue: 0
          };
        }
        
        // Fill buckets with loan data
        let processedLoans = 0;
        loanData.forEach(loan => {
          if (loan.principalAmount) {
            const ltv = (loan.principalAmount / floorPriceETH) * 100;
            const bucketLtv = Math.floor(ltv / bucketSize) * bucketSize;
            
            // Ensure bucket exists (in case of rounding issues)
            if (!buckets[bucketLtv]) {
              buckets[bucketLtv] = {
                ltv: bucketLtv,
                loanCount: 0,
                totalValue: 0
              };
            }
            
            buckets[bucketLtv].loanCount++;
            buckets[bucketLtv].totalValue += loan.principalAmountUSD; // Keep USD for value display
            processedLoans++;
          }
        });
        
        console.log(`DepthChart: Processed ${processedLoans} loans into ${Object.keys(buckets).length} buckets`);
        
        // Convert to array and sort by LTV
        const bucketArray = Object.values(buckets)
          .filter(bucket => bucket.loanCount > 0)
          .sort((a, b) => a.ltv - b.ltv);
        
        // Convert to DataPoint format
        const points: DataPoint[] = bucketArray.map(bucket => ({
          ltv: bucket.ltv,
          value: bucket.totalValue,
          cumulativeValue: 0, // Will be calculated below
          loanCount: bucket.loanCount
        }));
        
        // Sort points by LTV in descending order (high to low)
        const sortedPoints = [...points].sort((a, b) => b.ltv - a.ltv);
        
        // Calculate cumulative values from high LTV to low LTV
        let cumulative = 0;
        sortedPoints.forEach(point => {
          cumulative += point.value;
          point.cumulativeValue = cumulative;
        });
        
        // Re-sort back to ascending order for display
        sortedPoints.sort((a, b) => a.ltv - b.ltv);
        
        console.log('DepthChart: Final processed chart data:', sortedPoints);
        setBucketData(sortedPoints);
      } catch (err) {
        console.error('Error fetching loan distribution:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [collection]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!collection || bucketData.length === 0) {
    return <div>No data available</div>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p><strong>LTV: {data.ltv}%</strong></p>
          <p>Value at this LTV: ${data.value.toLocaleString()}</p>
          <p>Loans at this LTV: {data.loanCount}</p>
          <p>Cumulative value: ${data.cumulativeValue.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="depth-chart">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={bucketData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onClick={(e) => {
            if (e && e.activeLabel) {
              onDataPointClick(parseInt(e.activeLabel));
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ltv"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="step"
            dataKey="cumulativeValue"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DepthChart; 