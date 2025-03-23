import { useState } from 'react';
import { CollectionDropdown } from './components/CollectionDropdown';
import { InfoPanel } from './components/InfoPanel';
import { useCollections } from './hooks/useCollections';
import './App.css';

function App() {
  const { collections, isLoading, error } = useCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const selectedCollection = selectedCollectionId 
    ? collections.find(c => c.id === selectedCollectionId) ?? null 
    : null;

  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
  };

  if (isLoading) {
    return <div className="loading">Loading collections...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <CollectionDropdown
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelect={handleSelectCollection}
        />
      </header>
      <main className="app-main">
        <InfoPanel collection={selectedCollection} />
      </main>
    </div>
  );
}

export default App; 