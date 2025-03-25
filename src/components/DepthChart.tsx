import React, { useState, useEffect } from 'react';
import { Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Brush, BarChart, Bar, ReferenceLine } from 'recharts';
import { NFTfiCollection } from '../types/reservoir';
import { fetchLoanDistribution, LoanDistributionResponseItem } from '../api/nftfiApi';
import { getCurrentFloorPrice } from '../api/reservoirApi';
import './DepthChart.css';
// Will be imported once we create the component
// import { DepthChartComparison } from './DepthChartComparison';

interface DepthChartProps {
  collection: NFTfiCollection;
  onDataPointClick?: (ltv: number) => void;
  visualizationType?: 'standard' | 'segmented' | 'brush' | 'barChart';
}

interface DataPoint {
  ltv: number;
  value: number;
  loanCount: number;
  cumulativeValue: number;
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

interface BrushDomain {
  startIndex?: number;
  endIndex?: number;
}

const HIGH_RISK_COLOR = '#ffd6d6'; // Bright pink for high risk area
const REFERENCE_LINE_COLOR = '#ff4444'; // Red for 100% LTV line
const REFERENCE_LINE_LABEL = { value: '100% LTV', position: 'insideTopRight' as const };

export function DepthChart({ collection, onDataPointClick, visualizationType = 'standard' }: DepthChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketData, setBucketData] = useState<DataPoint[]>([]);
  const [chartDomain, setChartDomain] = useState<[number, number]>([0, 0]);
  const [isCumulative, setIsCumulative] = useState(true);
  const [brushDomain, setBrushDomain] = useState<[number, number]>([0, 100]);
  const [minLtvValue, setMinLtvValue] = useState<number>(0);

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
            const ltv = (loan.principalAmountUSD / floorPriceUSD) * 100;
            ltvValues.push(ltv);
          }
        });

        // Find min and max LTV
        const minLtv = Math.min(...ltvValues);
        const maxLtv = Math.max(...ltvValues);
        
        console.log(`DepthChart: Full LTV range: ${minLtv.toFixed(2)}% to ${maxLtv.toFixed(2)}%`);
        
        // Create buckets with 1% increments
        const bucketSize = 1;
        const minBucket = Math.floor(minLtv / bucketSize) * bucketSize;
        const maxBucket = Math.ceil(maxLtv / bucketSize) * bucketSize;
        
        setMinLtvValue(minBucket);
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
            
            if (buckets[bucketLtv]) {
              buckets[bucketLtv].loanCount++;
              buckets[bucketLtv].totalValue += loan.principalAmountUSD;
            }
          }
        });

        // Convert buckets to array and sort by LTV (ascending for stable animations)
        const sortedBuckets = Object.values(buckets).sort((a, b) => a.ltv - b.ltv);
        
        // First pass: calculate non-cumulative values and store in points array
        const points: DataPoint[] = sortedBuckets.map(bucket => ({
          ltv: bucket.ltv,
          value: bucket.totalValue,
          loanCount: bucket.loanCount,
          cumulativeValue: 0,
          cumulativeLoanCount: 0
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

  // Update chartDomain when bucketData changes
  useEffect(() => {
    if (bucketData.length > 0) {
      setChartDomain([minLtvValue, Math.min(Math.max(...bucketData.map(d => d.ltv)), 300)]);
    }
  }, [bucketData, minLtvValue]);

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

  const handleBrushChange = (domain: BrushDomain) => {
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
          <p className="label">{`LTV: ${data.ltv}%`}</p>
          <p className="value">{`Number of loans: ${isCumulative ? data.cumulativeLoanCount : data.loanCount}`}</p>
          <p className="value">{`Total value: $${(isCumulative ? data.cumulativeValue : data.value).toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  // Filter data for segmented view
  const segment1Data = bucketData.filter(d => d.ltv <= 100);
  const segment2Data = bucketData.filter(d => d.ltv > 100 && d.ltv <= 500);
  const segment3Data = bucketData.filter(d => d.ltv > 500);

  // Calculate segment-specific domains
  const segment1Min = segment1Data.length > 0 ? Math.min(...segment1Data.map(d => d.ltv)) : minLtvValue;
  const segment1Max = 100;
  const segment2Min = 100;
  const segment2Max = 500;
  const segment3Min = 500;
  const segment3Max = segment3Data.length > 0 ? Math.max(...segment3Data.map(d => d.ltv)) : chartDomain[1];

  // Visualization types
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
                  domain={[segment1Min, segment1Max]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={100} stroke={REFERENCE_LINE_COLOR} strokeWidth={2} />
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
                <defs>
                  <linearGradient id="highRiskArea2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#highRiskArea2)" />
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ltv"
                  type="number"
                  domain={[segment2Min, segment2Max]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip content={<CustomTooltip />} />
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
                <defs>
                  <linearGradient id="highRiskArea3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#highRiskArea3)" />
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ltv"
                  type="number"
                  domain={[segment3Min, segment3Max]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip content={<CustomTooltip />} />
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
            <defs>
              <linearGradient id="highRiskArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={1}/>
                <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={1}/>
              </linearGradient>
            </defs>
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
            <Area
              type="step"
              dataKey={(dataPoint: DataPoint) => 
                dataPoint.ltv > 100 
                  ? (isCumulative ? dataPoint.cumulativeLoanCount : dataPoint.loanCount) 
                  : 0
              }
              stroke="none"
              fill="url(#highRiskArea)"
              fillOpacity={0.5}
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
            <defs>
              <linearGradient id="highRiskArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="normalRiskArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#8884d8" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ltv"
              type="number"
              domain={[minLtvValue, 100]} // Focus on the min-100% range
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
          <defs>
            <linearGradient id="highRiskArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={1}/>
              <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={1}/>
            </linearGradient>
          </defs>
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
          <ReferenceLine x={100} stroke={REFERENCE_LINE_COLOR} strokeWidth={2} label={REFERENCE_LINE_LABEL} />
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
          <Area
            type="step"
            dataKey={(dataPoint: DataPoint) => 
              dataPoint.ltv > 100 
                ? (isCumulative ? dataPoint.cumulativeLoanCount : dataPoint.loanCount) 
                : 0
            }
            stroke="none"
            fill="url(#highRiskArea)"
            fillOpacity={0.5}
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