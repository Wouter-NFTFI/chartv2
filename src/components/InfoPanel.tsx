import type { CollectionFloorPrice } from '../types/reservoir';
import './InfoPanel.css';

interface Props {
  collection: CollectionFloorPrice | null;
}

export function InfoPanel({ collection }: Props) {
  if (!collection) {
    return (
      <div className="info-panel">
        <p>Select a collection to view details</p>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <h2>{collection.name}</h2>
      <div className="info-grid">
        <div className="info-item">
          <label>Floor Price</label>
          <span className="value">{collection.floorPrice.toFixed(4)} ETH</span>
        </div>
        <div className="info-item">
          <label>Floor Price (USD)</label>
          <span className="value">${collection.floorPriceUSD.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <label>24h Volume</label>
          <span className="value">{collection.volume24h.toFixed(2)} ETH</span>
        </div>
        <div className="info-item">
          <label>7d Volume</label>
          <span className="value">{collection.volume7d.toFixed(2)} ETH</span>
        </div>
        <div className="info-item">
          <label>365d Volume</label>
          <span className="value">{collection.volume365d.toFixed(2)} ETH</span>
        </div>
        <div className="info-item">
          <label>Total Supply</label>
          <span className="value">{collection.tokenCount}</span>
        </div>
        <div className="info-item">
          <label>Listed</label>
          <span className="value">{collection.onSaleCount}</span>
        </div>
      </div>
    </div>
  );
} 