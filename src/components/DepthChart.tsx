import React, { useState, useEffect } from 'react';
import { Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Brush, BarChart, Bar } from 'recharts';
import { NFTfiCollection } from '../types/reservoir';
import { fetchLoanDistribution, LoanDistributionResponseItem } from '../api/nftfiApi';
import { getCurrentFloorPrice } from '../api/reservoirApi';
import './DepthChart.css';
// Will be imported once we create the component
// import { DepthChartComparison } from './DepthChartComparison';

interface DepthChartProps {
  collection: NFTfiCollection;
  onDataPointClick?: (ltv: number) => void;
  visualizationType?: 'standard' | 'logScale' | 'segmented' | 'brush' | 'barChart';
}

interface DataPoint {
  ltv: number;
  value: number;
  cumulativeValue: number;
  loanCount: number;
  cumulativeLoanCount: number;
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

export function DepthChart({ collection, onDataPointClick, visualizationType = 'standard' }: DepthChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketData, setBucketData] = useState<DataPoint[]>([]);
  const [chartDomain, setChartDomain] = useState<[number, number]>([0, 0]);
  const [isCumulative, setIsCumulative] = useState(true);
  const [brushDomain, setBrushDomain] = useState<[number, number]>([0, 100]);

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
        
        // Get floor price using the contract address from the first loan
        if (!loanData?.[0]?.nftAddress) {
          throw new Error('No NFT contract address found in loan data');
        }
        const contractAddress = loanData[0].nftAddress;
        const floorPriceUSD = await getCurrentFloorPrice(contractAddress);
        console.log('Using floor price:', floorPriceUSD, 'USD for contract:', contractAddress);
        
        if (!loanData || loanData.length === 0) {
          throw new Error('No loan data available');
        }
        
        // Calculate LTV for each loan
        const ltvValues: number[] = [];
        console.log('Raw loan data sample:', loanData.slice(0, 5));
        
        loanData.forEach(loan => {
          if (loan.principalAmountUSD && floorPriceUSD > 0) {
            // LTV is principal amount in USD divided by floor price in USD
            const ltv = (loan.principalAmountUSD / floorPriceUSD) * 100;
            ltvValues.push(ltv);
          }
        });
        
        // Find min and max LTV
        const minLtv = Math.min(...ltvValues);
        const calculatedMaxLtv = Math.max(...ltvValues);
        
        console.log(`DepthChart: Full LTV range: ${minLtv.toFixed(2)}% to ${calculatedMaxLtv.toFixed(2)}%`);
        
        // Create buckets with 5% increments
        const bucketSize = 5;
        const minBucket = Math.floor(minLtv / bucketSize) * bucketSize;
        const maxBucket = Math.ceil(calculatedMaxLtv / bucketSize) * bucketSize;
        
        setChartDomain([minBucket, maxBucket]);
        setBrushDomain([minBucket, Math.min(maxBucket, 100)]);  // Default brush domain
        
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
        loanData.forEach(loan => {
          if (loan.principalAmountUSD && floorPriceUSD > 0) {
            const ltv = (loan.principalAmountUSD / floorPriceUSD) * 100;
            const bucketLtv = Math.floor(ltv / bucketSize) * bucketSize;
            
            buckets[bucketLtv].loanCount++;
            buckets[bucketLtv].totalValue += loan.principalAmountUSD;
          }
        });
        
        // Convert buckets to array and sort by LTV (ascending for stable animations)
        const sortedBuckets = Object.values(buckets).sort((a, b) => a.ltv - b.ltv);
        
        // First pass: calculate non-cumulative values and store in points array
        const points: DataPoint[] = sortedBuckets.map(bucket => ({
          ltv: bucket.ltv,
          value: bucket.totalValue,
          loanCount: bucket.loanCount,
          cumulativeValue: 0, // Will be calculated in second pass
          cumulativeLoanCount: 0 // Will be calculated in second pass
        }));

        // Second pass: calculate cumulative values from high LTV to low LTV
        let cumulativeValue = 0;
        let cumulativeLoanCount = 0;
        for (let i = points.length - 1; i >= 0; i--) {
          cumulativeValue += points[i].value;
          cumulativeLoanCount += points[i].loanCount;
          points[i].cumulativeValue = cumulativeValue;
          points[i].cumulativeLoanCount = cumulativeLoanCount;
        }
        
        setBucketData(points);
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

  // We'll implement the comparison view when we create the DepthChartComparison component
  // if (viewMode === 'comparison') {
  //   return (
  //     <DepthChartComparison 
  //       data={bucketData} 
  //       collection={collection} 
  //       chartDomain={chartDomain}
  //       onDataPointClick={onDataPointClick} 
  //     />
  //   );
  // }

  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      const points = bucketData.slice(domain.startIndex, domain.endIndex + 1);
      if (points.length > 0) {
        setBrushDomain([points[0].ltv, points[points.length - 1].ltv]);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p><strong>LTV: {data.ltv}%</strong></p>
          <p>Number of loans: {isCumulative ? data.cumulativeLoanCount : data.loanCount}</p>
          <p>Total value: ${(isCumulative ? data.cumulativeValue : data.value).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // Filter data for segmented view
  const segment1Data = bucketData.filter(d => d.ltv <= 100);
  const segment2Data = bucketData.filter(d => d.ltv > 100 && d.ltv <= 500);
  const segment3Data = bucketData.filter(d => d.ltv > 500);

  // Visualization types
  if (visualizationType === 'logScale') {
    // Filter out zero values and ensure minimum values for log scale
    const logScaleData = bucketData.filter(d => {
      const value = isCumulative ? d.cumulativeLoanCount : d.loanCount;
      return value > 0 && d.ltv > 0;
    });

    // Add console logs to debug data
    console.log('Filtered data for log scale:', logScaleData);

    return (
      <div className="depth-chart">
        <div className="chart-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isCumulative}
              onChange={(e) => setIsCumulative(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Cumulative</span>
          </label>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={logScaleData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                onDataPointClick?.(parseInt(e.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ltv"
              type="number"
              scale="log"
              domain={[1, 'auto']}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Loan-to-Value Ratio (%) - Log Scale', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              type="number"
              scale="log"
              domain={[1, 'auto']}
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Number of Loans', angle: -90, position: 'left', offset: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="step"
              dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (visualizationType === 'segmented') {
    return (
      <div className="depth-chart">
        <div className="chart-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isCumulative}
              onChange={(e) => setIsCumulative(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Cumulative</span>
          </label>
        </div>
        <div className="segmented-charts">
          <div className="chart-segment">
            <h4>0-100% LTV</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={segment1Data}
                margin={{ top: 10, right: 10, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ltv"
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Area
                  type="step"
                  dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-segment">
            <h4>100-500% LTV</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={segment2Data}
                margin={{ top: 10, right: 10, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ltv"
                  type="number"
                  domain={[100, 500]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Area
                  type="step"
                  dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-segment">
            <h4>500%+ LTV</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={segment3Data}
                margin={{ top: 10, right: 10, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ltv"
                  type="number"
                  domain={[500, chartDomain[1]]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Area
                  type="step"
                  dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.3}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  if (visualizationType === 'brush') {
    return (
      <div className="depth-chart">
        <div className="chart-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isCumulative}
              onChange={(e) => setIsCumulative(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Cumulative</span>
          </label>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={bucketData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                onDataPointClick?.(parseInt(e.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ltv"
              type="number"
              domain={brushDomain}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Loan-to-Value Ratio (%)', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Number of Loans', angle: -90, position: 'left', offset: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="step"
              dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
            <Brush 
              dataKey="ltv" 
              height={30} 
              stroke="#8884d8"
              onChange={handleBrushChange}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (visualizationType === 'barChart') {
    return (
      <div className="depth-chart">
        <div className="chart-controls">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isCumulative}
              onChange={(e) => setIsCumulative(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Cumulative</span>
          </label>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={bucketData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                onDataPointClick?.(parseInt(e.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ltv"
              type="number"
              domain={[0, 100]} // Focus on the 0-100% range
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Loan-to-Value Ratio (%) - Focus on 0-100%', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Number of Loans', angle: -90, position: 'left', offset: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
              fill="#8884d8"
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default: standard visualization
  return (
    <div className="depth-chart">
      <div className="chart-controls">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isCumulative}
            onChange={(e) => setIsCumulative(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Cumulative</span>
        </label>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={bucketData}
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
          onClick={(e) => {
            if (e && e.activeLabel) {
              onDataPointClick?.(parseInt(e.activeLabel));
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ltv"
            type="number"
            domain={chartDomain}
            tickFormatter={(value) => `${value}%`}
            label={{ value: 'Loan-to-Value Ratio (%)', position: 'bottom', offset: 0 }}
            padding={{ left: 0, right: 0 }}
          />
          <YAxis 
            tickFormatter={(value) => `${value}`}
            label={{ value: 'Number of Loans', angle: -90, position: 'left', offset: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="step"
            dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DepthChart; 