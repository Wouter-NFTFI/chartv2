import React, { useState } from 'react';
import { useCollections } from './hooks/useCollections';
import { CollectionDropdown } from './components/CollectionDropdown';
import { InfoPanel } from './components/InfoPanel';
import { NFTfiCollection } from './types/reservoir';
import './App.css';

function App() {
  const { collections, isLoading, error } = useCollections();
  const [selectedCollection, setSelectedCollection] = useState<NFTfiCollection | null>(null);

  const handleCollectionSelect = (collectionId: string) => {
    const selected = collections.find(c => c.nftProjectName === collectionId) || null;
    setSelectedCollection(selected);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>NFT Collection Stats</h1>
        {isLoading ? (
          <p>Loading collections...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : (
          <CollectionDropdown
            collections={collections}
            selectedCollectionId={selectedCollection?.nftProjectName || null}
            onSelect={handleCollectionSelect}
          />
        )}
      </header>
      <main>
        <InfoPanel collection={selectedCollection} />
      </main>
    </div>
  );
}

export default App; 