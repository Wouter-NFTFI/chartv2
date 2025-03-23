import React from 'react';
import useHistoricalPrices from '../hooks/useHistoricalPrices';
import { TimeInterval } from '../api/priceFloorApi';
import './PriceHistoryChart.css';

interface PriceHistoryChartProps {
  collectionSlug: string;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ collectionSlug }) => {
  const { 
    data, 
    isLoading, 
    error, 
    changeInterval,
    currentInterval
  } = useHistoricalPrices(collectionSlug);

  const intervals: { label: string; value: TimeInterval }[] = [
    { label: '2 Hours', value: '2h' },
    { label: '8 Hours', value: '8h' },
    { label: '1 Day', value: '1d' }
  ];

  if (isLoading) {
    return <div className="loading">Loading price history...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error loading price data: {error.message}</p>
        <p className="error-details">
          This collection may not be available in the NFT Price Floor API database.
          Try searching for "{collectionSlug}" on OpenSea or other marketplaces to find the correct collection slug.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="no-data">No price history available</div>;
  }

  // For now, just display the raw data as a simple chart
  // In a real application, you'd use a charting library like Chart.js or recharts
  return (
    <div className="price-history-chart">
      <div className="interval-selector">
        {intervals.map((interval) => (
          <button
            key={interval.value}
            className={currentInterval === interval.value ? 'active' : ''}
            onClick={() => changeInterval(interval.value)}
          >
            {interval.label}
          </button>
        ))}
      </div>
      
      <h3>Floor Price History for {collectionSlug}</h3>
      
      <div className="data-summary">
        <p>Latest Floor Price: {data[data.length - 1].floorNative} ETH</p>
        <p>Latest USD Value: ${data[data.length - 1].floorUsd.toFixed(2)}</p>
        <p>Total Data Points: {data.length}</p>
        <p>Time Period: {new Date(data[0].timestamp).toLocaleDateString()} - {new Date(data[data.length - 1].timestamp).toLocaleDateString()}</p>
      </div>

      <div className="chart-placeholder">
        <p>Chart would be rendered here with a library like recharts or Chart.js</p>
        <p>Latest 5 data points:</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Floor (ETH)</th>
              <th>Floor (USD)</th>
              <th>Volume (ETH)</th>
              <th>Sales</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(-5).map((point) => (
              <tr key={point.timestamp}>
                <td>{new Date(point.timestamp).toLocaleDateString()}</td>
                <td>{point.floorNative.toFixed(4)}</td>
                <td>${point.floorUsd.toFixed(2)}</td>
                <td>{point.volumeNative.toFixed(2)}</td>
                <td>{point.salesCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceHistoryChart; 