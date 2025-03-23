import { useState, useEffect } from 'react';
import { getCollectionsFloorPrices } from '../services/reservoirService';
import type { CollectionFloorPrice } from '../types/reservoir';

const TOP_COLLECTIONS_LIMIT = 10;

export function useCollections() {
  const [collections, setCollections] = useState<CollectionFloorPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch collections sorted by volume
        const data = await getCollectionsFloorPrices();
        const sortedCollections = data
          .sort((a, b) => b.volume365d - a.volume365d)
          .slice(0, TOP_COLLECTIONS_LIMIT);
        setCollections(sortedCollections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch collections');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { collections, isLoading, error };
} 