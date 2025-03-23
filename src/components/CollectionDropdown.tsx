import { useState, useEffect, useRef } from 'react';
import { NFTfiCollection } from '../api/nftfiApi';
import './CollectionDropdown.css';

interface CollectionDropdownProps {
  collections: NFTfiCollection[];
  onSelectCollection: (collection: NFTfiCollection) => void;
  isLoading?: boolean;
}

function CollectionDropdown({ 
  collections, 
  onSelectCollection, 
  isLoading = false 
}: CollectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<NFTfiCollection | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter collections based on search term
  const filteredCollections = collections.filter(collection => 
    collection.nftProjectName && 
    (searchTerm === '' || collection.nftProjectName.includes(searchTerm))
  );
  
  // Handle collection selection
  const handleSelectCollection = (collection: NFTfiCollection) => {
    setSelectedCollection(collection);
    onSelectCollection(collection);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isLoading) {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <div className="collection-dropdown-container" ref={dropdownRef}>
      <div 
        className={`dropdown-header ${isLoading ? 'disabled' : ''}`} 
        onClick={toggleDropdown}
      >
        {selectedCollection ? (
          <div className="selected-collection">
            <span className="collection-name">{selectedCollection.nftProjectName}</span>
            <span className="volume-percentage">{selectedCollection.volumePercentage?.toFixed(2)}%</span>
          </div>
        ) : (
          <span>{isLoading ? 'Loading collections...' : 'Select a collection'}</span>
        )}
        <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}></div>
      </div>
      
      {isOpen && (
        <div className="dropdown-content">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <ul className="collection-list">
            {filteredCollections.length > 0 ? (
              filteredCollections.map((collection, index) => (
                <li 
                  key={`${collection.nftProjectName}-${index}`}
                  className="collection-item"
                  onClick={() => handleSelectCollection(collection)}
                >
                  <span className="collection-name">{collection.nftProjectName}</span>
                  <span className="volume-percentage">{collection.volumePercentage?.toFixed(2)}%</span>
                </li>
              ))
            ) : (
              <li className="no-results">No collections found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CollectionDropdown; 