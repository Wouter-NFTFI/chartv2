import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { NFTfiCollection } from '../types/reservoir';
import { fetchLoanDistribution } from '../api/nftfiApi';
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

export function DepthChart({ collection, onDataPointClick }: DepthChartProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucketData, setBucketData] = useState<DataPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!collection) return;
      
      console.log('DepthChart: Fetching data for collection:', collection.nftProjectName);
      setIsLoading(true);
      setError(null);
      
      try {
        const distribution = await fetchLoanDistribution(collection.nftProjectName);
        console.log('DepthChart: Received distribution data:', distribution);
        
        if (!distribution || distribution.length === 0) {
          console.warn('No loan distribution data available');
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
        
        // Convert distribution to DataPoint format
        const points: DataPoint[] = distribution.map(bucket => ({
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
          <p>LTV: {data.ltv}%</p>
          <p>Value: ${data.value.toLocaleString()}</p>
          <p>Loans: {data.loanCount}</p>
          <p>Cumulative: ${data.cumulativeValue.toLocaleString()}</p>
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
            domain={[0, 100]}
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