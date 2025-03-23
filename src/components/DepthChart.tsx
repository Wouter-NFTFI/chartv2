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
      
      setIsLoading(true);
      setError(null);
      
      try {
        const distribution = await fetchLoanDistribution(collection.nftProjectName);
        
        // Convert distribution to DataPoint format
        const points: DataPoint[] = distribution.map(bucket => ({
          ltv: bucket.ltv,
          value: bucket.totalValue,
          cumulativeValue: 0, // Will be calculated below
          loanCount: bucket.loanCount
        }));

        // Calculate cumulative values
        let cumulative = 0;
        points.forEach(point => {
          cumulative += point.value;
          point.cumulativeValue = cumulative;
        });

        setBucketData(points);
      } catch (err) {
        console.error('Error fetching loan distribution:', err);
        setError('Failed to fetch loan distribution');
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