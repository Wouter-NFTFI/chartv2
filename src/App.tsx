// Interact with verified on-chain data using ABI-defined structure
// Do not use mock data, fallbacks, or inferred fields
// Use exact field names from contract ABIs only
// Treat all data as immutable and verifiable

import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetchTopCollections, NFTfiCollection } from './api/nftfiApi'
import CollectionDropdown from './components/CollectionDropdown'

function App() {
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<NFTfiCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<NFTfiCollection | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch top collections with loan data
        const collectionsData = await fetchTopCollections(1000000, 1000);
        setCollections(collectionsData);
        
        console.log(`Fetched ${collectionsData.length} collections`);
        console.log(`Top collection: ${collectionsData[0]?.nftProjectName}`);
        console.log(`Total volume: $${Math.round(collectionsData[0]?.total_usd_value).toLocaleString()}`);
        
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle collection selection
  const handleSelectCollection = (collection: NFTfiCollection) => {
    setSelectedCollection(collection);
    
    // Log collection loans to console
    console.log('Selected collection:', collection.nftProjectName);
    console.log('Loan count:', collection.loan_count);
    console.log('Total USD value:', collection.total_usd_value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }));
    console.log('Average APR:', collection.avg_apr.toFixed(2) + '%');
    console.log('Volume percentage:', collection.volumePercentage?.toFixed(2) + '%');
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>NFTfi Collections by Volume</h1>
      
      <div className="card">
        <CollectionDropdown 
          collections={collections}
          onSelectCollection={handleSelectCollection}
          isLoading={loading}
        />
        
        {selectedCollection && (
          <div className="collection-details">
            <h3>{selectedCollection.nftProjectName}</h3>
            <p>Loan Count: {selectedCollection.loan_count}</p>
            <p>Total Value: ${Math.round(selectedCollection.total_usd_value).toLocaleString()}</p>
            <p>Average APR: {selectedCollection.avg_apr.toFixed(2)}%</p>
          </div>
        )}
        
        <p className="description">
          {loading 
            ? 'Loading NFTfi collections data...' 
            : 'Select a collection to see details. Collection data sorted by loan volume.'}
        </p>
      </div>
      
      <p className="read-the-docs">
        Data from NFTfi API - Showing Top 20 Collections by Volume
      </p>
    </>
  )
}

export default App
