import { useState } from 'react';
import { CollectionDropdown } from './components/CollectionDropdown';
import { InfoPanel } from './components/InfoPanel';
import { useCollections } from './hooks/useCollections';
import './App.css';

function App() {
  const { collections, isLoading, error } = useCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const selectedCollection = collections.find(c => c.id === selectedCollectionId) ?? null;

  if (isLoading) {
    return <div className="loading">Loading collections...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="app">
      <div className="container">
        <h1>NFT Floor Prices</h1>
        <div className="content">
          <CollectionDropdown
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelect={setSelectedCollectionId}
          />
          <InfoPanel collection={selectedCollection} />
        </div>
      </div>
    </div>
  );
}

export default App; 