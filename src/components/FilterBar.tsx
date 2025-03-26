import React from 'react';
import './FilterBar.css';
import { NFTfiCollection } from '../api/nftfiApi';
import { CollectionDropdown } from './CollectionDropdown';

interface FilterBarProps {
  collections: NFTfiCollection[];
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string) => void;
  isFiltered: boolean;
  activeLTV: number | null;
  selectedLoansCount: number;
  totalLoansCount: number;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  collections,
  selectedCollectionId,
  onSelectCollection,
  isFiltered,
  activeLTV,
  selectedLoansCount,
  totalLoansCount,
  onResetFilters
}) => {
  return (
    <div className="filter-bar">
      {/* Collection dropdown - always visible */}
      <div className="filter-bar-dropdown">
        <CollectionDropdown
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelect={onSelectCollection}
        />
      </div>
      
      {/* Filter status - only visible when filtered */}
      {isFiltered && activeLTV ? (
        <p className="filter-status">
          Showing loans with an LTV around {activeLTV.toFixed(0)}% ({selectedLoansCount} of {totalLoansCount} loans)
        </p>
      ) : (
        <div></div> /* Empty spacer for layout when not filtered */
      )}
      
      {/* Reset button - only visible when filtered */}
      {isFiltered ? (
        <button 
          className="reset-filter-button"
          onClick={onResetFilters}
        >
          <span className="reset-filter-button-label">View all loans</span>
        </button>
      ) : (
        <div></div> /* Empty spacer for layout when not filtered */
      )}
    </div>
  );
};

export default FilterBar; 