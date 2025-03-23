import { useState, useEffect } from 'react';
import { getCollections } from '../services/reservoirService';
import type { NFTfiCollection } from '../types/reservoir';
import { TOP_COLLECTIONS_LIMIT } from '../config/collections';

export function useCollections() {
  const [collections, setCollections] = useState<NFTfiCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch collections sorted by volume
        const data = await getCollections();
        const sortedCollections = data
          .sort((a, b) => b.volumePercentage || 0 - (a.volumePercentage || 0))
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