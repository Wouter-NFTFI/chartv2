import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NFTfiCollection } from '../types/reservoir';
import './DepthChart.css';

interface ChartClickEvent {
  activePayload?: Array<{
    payload: DataPoint;
  }>;
}

interface DepthChartProps {
  collection: NFTfiCollection;
  onDataPointClick: (ltv: number) => void;
}

interface DataPoint {
  ltv: number;
  value: number;
  cumulativeValue: number;
  loanCount: number;
}

const DepthChart: React.FC<DepthChartProps> = ({ collection, onDataPointClick }) => {
  const [isCumulative, setIsCumulative] = useState(true);

  const bucketData = useMemo(() => {
    // Create LTV buckets in 5% increments from 0% to 100%
    const buckets: DataPoint[] = [];
    
    // Calculate average loan value
    const avgLoanValue = collection.total_usd_value / collection.loan_count;
    
    // Distribute loans based on a normal distribution centered around the average LTV
    const avgLTV = collection.avg_apr; // Using APR as a proxy for average LTV
    const totalLoans = collection.loan_count;
    
    for (let ltv = 0; ltv <= 100; ltv += 5) {
      // Create a rough normal distribution of loans
      const distance = Math.abs(ltv - avgLTV);
      const loanCount = Math.round(
        totalLoans * Math.exp(-(distance * distance) / (2 * 400)) / 5
      );
      
      buckets.push({
        ltv,
        value: loanCount * avgLoanValue,
        cumulativeValue: 0, // Will be calculated below
        loanCount
      });
    }

    // Normalize values to match total_usd_value
    const totalValue = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
    const scaleFactor = collection.total_usd_value / totalValue;
    
    buckets.forEach(bucket => {
      bucket.value *= scaleFactor;
    });

    // Calculate cumulative values
    let runningTotal = 0;
    buckets.forEach(bucket => {
      runningTotal += bucket.value;
      bucket.cumulativeValue = runningTotal;
    });

    return buckets;
  }, [collection]);

  return (
    <div className="depth-chart">
      <div className="chart-controls">
        <button
          className={isCumulative ? 'active' : ''}
          onClick={() => setIsCumulative(true)}
        >
          Cumulative
        </button>
        <button
          className={!isCumulative ? 'active' : ''}
          onClick={() => setIsCumulative(false)}
        >
          Non-cumulative
        </button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={bucketData}
            onClick={(event: ChartClickEvent) => {
              if (event && event.activePayload) {
                const clickedData = event.activePayload[0].payload;
                onDataPointClick(clickedData.ltv);
              }
            }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="ltv"
              type="number"
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <YAxis
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'loanCount') {
                  return [value.toFixed(0), 'Loans'];
                }
                return [`$${(value / 1000000).toFixed(2)}M`, 'Value'];
              }}
              labelFormatter={(label: number) => `LTV: ${label}%`}
            />
            <Area
              type="monotone"
              dataKey={isCumulative ? 'cumulativeValue' : 'value'}
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DepthChart; 