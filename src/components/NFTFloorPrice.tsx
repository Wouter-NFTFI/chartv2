// Follow rules from .cursor-ruleset.md
// Get latest NFT floor price from verified contract ABI
// Do not use fallbacks, mock data, or normalized fields

import { useState, useEffect } from 'react';
import { getNFTFloorPrice } from '../api/nftFloorPrice';
import './NFTFloorPrice.css';

interface NFTFloorPriceProps {
  contractAddress: string;
}

export default function NFTFloorPrice({ contractAddress }: NFTFloorPriceProps) {
  const [floorPrice, setFloorPrice] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFloorPrice() {
      try {
        setLoading(true);
        const data = await getNFTFloorPrice(contractAddress);
        setFloorPrice(data.floorPrice);
        setCurrency(data.currency);
        setError(null);
      } catch (err) {
        setError('Failed to fetch floor price');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchFloorPrice();
  }, [contractAddress]);

  if (loading) return <div>Loading floor price...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="nft-floor-price">
      <h3>Floor Price</h3>
      <p>{floorPrice} {currency}</p>
    </div>
  );
} 