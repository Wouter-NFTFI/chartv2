import type { NFTfiCollection } from '../types/reservoir';
import './InfoPanel.css';

interface Props {
  collection: NFTfiCollection | null;
}

export function InfoPanel({ collection }: Props) {
  if (!collection) {
    return (
      <div className="info-panel">
        <p>Select a collection to view details</p>
      </div>
    );
  }

  // Calculate floor price in ETH - this calculation happens in the UI layer, not data layer
  const floorPriceETH = collection.avg_usd_value / 1800;

  return (
    <div className="info-panel">
      <h2>{collection.nftProjectName}</h2>
      <div className="info-grid">
        <div className="info-item">
          <label>Floor Price (estimated)</label>
          <span className="value">{floorPriceETH.toFixed(4)} ETH</span>
        </div>
        <div className="info-item">
          <label>Floor Price (USD)</label>
          <span className="value">${collection.avg_usd_value.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <label>Total Volume (365d)</label>
          <span className="value">${collection.total_usd_value.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <label>Market Share</label>
          <span className="value">{collection.volumePercentage?.toFixed(2)}%</span>
        </div>
        <div className="info-item">
          <label>Average APR</label>
          <span className="value">{collection.avg_apr.toFixed(2)}%</span>
        </div>
        <div className="info-item">
          <label>Total Loans</label>
          <span className="value">{collection.loan_count}</span>
        </div>
      </div>
    </div>
  );
} 