import React, { useState, useEffect, useMemo } from 'react';
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
  visualizationType?: 'standard' | 'segmented' | 'brush' | 'barChart' | 'logarithmic' | 'symLog';
}

interface DataPoint {
  ltv: number;
  value: number;
  loanCount: number;
  cumulativeValue: number;
  cumulativeLoanCount: number;
}

interface LogBin {
  binStart: number;
  binEnd: number;
  displayLabel: string;
  loanCount: number;
  value: number;
  cumulativeCount: number;
  cumulativeValue: number;
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

const HIGH_RISK_COLOR = '#ffb8b8'; // More vibrant pink for high risk area
const REFERENCE_LINE_COLOR = '#ff4444'; // Red for 100% LTV line
const REFERENCE_LINE_LABEL = { value: '100% LTV', position: 'insideTopRight' as const };

// Symmetric logarithmic transformation functions
function symLogTransform(x: number, center: number, epsilon = 0.0001): number {
  if (Math.abs(x - center) < epsilon) return 0;
  if (x > center) return Math.log(x - center + epsilon);
  else return -Math.log(center - x + epsilon);
}

// Inverse function for axis labeling
function symLogInverse(y: number, center: number, epsilon = 0.0001): number {
  if (Math.abs(y) < epsilon) return center;
  if (y > 0) return center + Math.exp(y) - epsilon;
  else return center - (Math.exp(-y) - epsilon);
}

// Find the optimal center point (mode of the distribution)
function findDistributionCenter(bucketData: DataPoint[]): number {
  if (!bucketData || bucketData.length === 0) return 100;
  
  // Find the bucket with maximum loan count
  const maxBucket = bucketData.reduce((max, bucket) => 
    bucket.loanCount > max.loanCount ? bucket : max, bucketData[0]);
  
  return maxBucket.ltv;
}

export function DepthChart({ collection, onDataPointClick, visualizationType = 'standard' }: DepthChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketData, setBucketData] = useState<DataPoint[]>([]);
  const [chartDomain, setChartDomain] = useState<[number, number]>([0, 0]);
  const [isCumulative, setIsCumulative] = useState(true);
  const [brushDomain, setBrushDomain] = useState<[number, number]>([0, 100]);
  const [minLtvValue, setMinLtvValue] = useState<number>(0);
  const [distributionCenter, setDistributionCenter] = useState<number>(100);

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

  // Calculate the distribution center point
  useEffect(() => {
    if (bucketData.length > 0) {
      const center = findDistributionCenter(bucketData);
      setDistributionCenter(center);
    }
  }, [bucketData]);

  // Utility function to create logarithmic bins from the regular data
  const logBins = useMemo(() => {
    if (!bucketData.length) return [] as LogBin[];
    
    // Ensure we have valid min and max values
    const minLtv = Math.max(0.1, minLtvValue);
    const maxLtv = Math.max(...bucketData.map(d => d.ltv)); // Remove the 1000% cap
    
    // Define bin breakpoints - this determines bin widths at different LTV ranges
    const breakpoints: [number, number, number][] = [
      [minLtv, 25, 5],      // 5% bins from min to 25%
      [25, 50, 5],          // 5% bins from 25% to 50%
      [50, 100, 10],        // 10% bins from 50% to 100%
      [100, 200, 25],       // 25% bins from 100% to 200% 
      [200, 500, 50],       // 50% bins from 200% to 500%
      [500, 1000, 100],     // 100% bins from 500% to 1000%
      [1000, 2000, 200],    // 200% bins from 1000% to 2000%
      [2000, maxLtv, 500]   // 500% bins for extremely high LTVs (2000%+)
    ];
    
    // Create empty bins based on breakpoints
    const bins: LogBin[] = [];
    
    breakpoints.forEach(([start, end, step]) => {
      // Skip ranges outside our data
      if (start > maxLtv || end < minLtv) return;
      
      // Adjust range to fit our data
      const adjustedStart = Math.max(start, minLtv);
      const adjustedEnd = Math.min(end, maxLtv);
      
      // Create bins
      for (let binStart = adjustedStart; binStart < adjustedEnd; binStart += step) {
        const binEnd = Math.min(binStart + step, adjustedEnd);
        bins.push({
          binStart,
          binEnd,
          displayLabel: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}%`,
          loanCount: 0,
          value: 0,
          cumulativeCount: 0,
          cumulativeValue: 0
        });
      }
    });
    
    // Fill bins with data
    bucketData.forEach(point => {
      // Find the appropriate bin
      const bin = bins.find(b => point.ltv >= b.binStart && point.ltv < b.binEnd);
      if (bin) {
        bin.loanCount += point.loanCount;
        bin.value += point.value;
      }
    });
    
    // Sort bins by binStart
    bins.sort((a, b) => a.binStart - b.binStart);
    
    // Calculate cumulative values (from high LTV to low)
    let cumulativeCount = 0;
    let cumulativeValue = 0;
    
    for (let i = bins.length - 1; i >= 0; i--) {
      cumulativeCount += bins[i].loanCount;
      cumulativeValue += bins[i].value;
      bins[i].cumulativeCount = cumulativeCount;
      bins[i].cumulativeValue = cumulativeValue;
    }
    
    return bins;
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
  
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) => {
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
    // No need for the filtered data variables if we're not using them
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
              <linearGradient id="highRiskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="normalRiskGradient" x1="0" y1="0" x2="0" y2="1">
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
            <ReferenceLine x={100} stroke={REFERENCE_LINE_COLOR} strokeWidth={2} />
            {/* Normal risk bars (LTV <= 100%) */}
            <Bar
              name="Normal Risk"
              dataKey={(dataPoint: DataPoint) => 
                dataPoint.ltv <= 100 
                  ? (isCumulative ? dataPoint.cumulativeLoanCount : dataPoint.loanCount) 
                  : 0
              }
              fill="url(#normalRiskGradient)"
              animationDuration={500}
            />
            {/* High risk bars (LTV > 100%) */}
            <Bar
              name="High Risk"
              dataKey={(dataPoint: DataPoint) => 
                dataPoint.ltv > 100 
                  ? (isCumulative ? dataPoint.cumulativeLoanCount : dataPoint.loanCount) 
                  : 0
              }
              fill="url(#highRiskGradient)"
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (visualizationType === 'logarithmic') {
    // Early return if no data
    if (bucketData.length === 0) {
      return <div className="depth-chart">No loan data available</div>;
    }
    
    if (logBins.length === 0) {
      return <div className="depth-chart">Failed to create logarithmic bins</div>;
    }

    // Find the bin that represents 100% LTV (for reference line)
    const hundredLtvBin = logBins.find(bin => bin.binStart <= 100 && bin.binEnd > 100);
    const refLineLabel = hundredLtvBin ? hundredLtvBin.displayLabel : undefined;

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
            data={logBins}
            margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                // Parse the bin display label to get the middle value
                const bin = logBins.find(b => b.displayLabel === e.activeLabel);
                if (bin) {
                  onDataPointClick?.((bin.binStart + bin.binEnd) / 2);
                }
              }
            }}
          >
            <defs>
              <linearGradient id="normalRiskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#8884d8" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="highRiskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={HIGH_RISK_COLOR} stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayLabel"
              type="category"
              label={{ 
                value: 'Loan-to-Value Ratio (%) - Variable-width bins', 
                position: 'bottom', 
                offset: 25 
              }}
              tick={{ textAnchor: 'start', dy: 10 }}
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Number of Loans', angle: -90, position: 'left', offset: 10 }}
            />
            <Tooltip 
              formatter={(value, name) => {
                return [value, name === 'Normal Risk' || name === 'High Risk' ? 'Loans' : name];
              }}
              labelFormatter={(label) => `LTV Range: ${label}`}
              content={(props) => {
                if (!props.active || !props.payload || !props.payload.length) {
                  return null;
                }
                
                const bin = props.payload[0].payload as LogBin;
                const dataValue = isCumulative 
                  ? bin.cumulativeCount 
                  : bin.loanCount;
                  
                return (
                  <div className="custom-tooltip">
                    <p className="label">{`LTV Range: ${bin.displayLabel}`}</p>
                    <p className="value">{`Number of loans: ${dataValue}`}</p>
                    <p className="value">{`Total value: $${isCumulative ? bin.cumulativeValue.toLocaleString() : bin.value.toLocaleString()}`}</p>
                    <p className="info">Bin width: ${(bin.binEnd - bin.binStart).toFixed(0)}%</p>
                  </div>
                );
              }}
            />
            
            {/* Add reference line at 100% LTV */}
            {refLineLabel && (
              <ReferenceLine 
                x={refLineLabel}
                stroke={REFERENCE_LINE_COLOR} 
                strokeWidth={2} 
                label={{ 
                  value: '100% LTV', 
                  position: 'top',
                  fill: REFERENCE_LINE_COLOR
                }}
              />
            )}
            
            {/* Normal Risk Bars */}
            <Bar
              name="Normal Risk"
              dataKey={(bin: LogBin) => 
                bin.binStart < 100 ? (isCumulative ? bin.cumulativeCount : bin.loanCount) : 0
              }
              fill="url(#normalRiskGradient)"
              animationDuration={500}
            />
            
            {/* High Risk Bars */}
            <Bar
              name="High Risk"
              dataKey={(bin: LogBin) => 
                bin.binStart >= 100 ? (isCumulative ? bin.cumulativeCount : bin.loanCount) : 0
              }
              fill="url(#highRiskGradient)"
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Symmetric Log visualization type
  if (visualizationType === 'symLog') {
    // Early return if no data
    if (bucketData.length === 0) {
      return <div className="depth-chart">No loan data available</div>;
    }

    // Calculate transformed domain boundaries
    const minLtv = Math.min(...bucketData.map(d => d.ltv));
    const maxLtv = Math.max(...bucketData.map(d => d.ltv));
    
    // Calculate transformed values for domain endpoints
    const transformedMin = symLogTransform(minLtv, distributionCenter);
    const transformedMax = symLogTransform(maxLtv, distributionCenter);
    const transformedDomain: [number, number] = [transformedMin, transformedMax];
    
    // Create transformed data points
    const transformedData = bucketData.map(point => ({
      ...point,
      transformedLtv: symLogTransform(point.ltv, distributionCenter)
    }));
    
    // Generate ticks for the transformed domain
    const generateSymLogTicks = (domain: [number, number], tickCount = 10): number[] => {
      const step = (domain[1] - domain[0]) / (tickCount - 1);
      return Array.from({ length: tickCount }, (_, i) => 
        domain[0] + i * step
      );
    };
    
    const transformedTicks = generateSymLogTicks(transformedDomain);
    
    // Format ticks with inverse transformation to show original values
    const formatSymLogTick = (value: number): string => {
      const originalValue = symLogInverse(value, distributionCenter);
      return `${Math.round(originalValue)}%`;
    };

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
            data={transformedData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                const originalValue = symLogInverse(parseFloat(e.activeLabel), distributionCenter);
                onDataPointClick?.(originalValue);
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
              dataKey="transformedLtv"
              type="number"
              domain={transformedDomain}
              tickFormatter={formatSymLogTick}
              ticks={transformedTicks}
              label={{ 
                value: 'Loan-to-Value Ratio (%) - Symmetric Log Scale', 
                position: 'bottom', 
                offset: 0 
              }}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Number of Loans', angle: -90, position: 'left', offset: 10 }}
            />
            <Tooltip 
              formatter={(value, name) => {
                return [value, name === 'loans' ? 'Loans' : name];
              }}
              labelFormatter={(label) => {
                const originalValue = symLogInverse(parseFloat(label), distributionCenter);
                return `LTV: ${Math.round(originalValue)}%`;
              }}
              content={(props) => {
                if (!props.active || !props.payload || !props.payload.length) {
                  return null;
                }
                
                const transformedValue = parseFloat(props.label);
                const originalLtv = symLogInverse(transformedValue, distributionCenter);
                const dataPoint = props.payload[0].payload as (DataPoint & { transformedLtv: number });
                
                return (
                  <div className="custom-tooltip">
                    <p className="label">{`LTV: ${Math.round(originalLtv)}%`}</p>
                    <p className="value">{`Number of loans: ${isCumulative ? dataPoint.cumulativeLoanCount : dataPoint.loanCount}`}</p>
                    <p className="value">{`Total value: $${(isCumulative ? dataPoint.cumulativeValue : dataPoint.value).toLocaleString()}`}</p>
                  </div>
                );
              }}
            />
            
            {/* Add reference lines */}
            {/* Distribution center line */}
            <ReferenceLine 
              x={symLogTransform(distributionCenter, distributionCenter)} 
              stroke="#8884d8" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              label={{ 
                value: `Distribution Peak (${Math.round(distributionCenter)}% LTV)`, 
                position: 'top',
                fill: '#8884d8'
              }} 
            />
            
            {/* 100% LTV reference line */}
            <ReferenceLine 
              x={symLogTransform(100, distributionCenter)} 
              stroke={REFERENCE_LINE_COLOR} 
              strokeWidth={2} 
              label={{ 
                value: '100% LTV', 
                position: 'insideTopRight',
                fill: REFERENCE_LINE_COLOR
              }} 
            />
            
            <Area
              type="monotone"
              dataKey={isCumulative ? "cumulativeLoanCount" : "loanCount"}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
            
            {/* High risk area (LTV > 100%) */}
            <Area
              type="monotone"
              dataKey={(dataPoint) => {
                const originalLtv = dataPoint.ltv;
                return originalLtv > 100 
                  ? (isCumulative ? dataPoint.cumulativeLoanCount : dataPoint.loanCount) 
                  : 0;
              }}
              stroke="none"
              fill="url(#highRiskArea)"
              fillOpacity={0.5}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="symlog-explanation">
          <p>This view uses a symmetric logarithmic transformation centered at the distribution peak ({Math.round(distributionCenter)}% LTV).</p>
          <p>This approach balances the visualization, showing both common and extreme LTV values without distortion.</p>
        </div>
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