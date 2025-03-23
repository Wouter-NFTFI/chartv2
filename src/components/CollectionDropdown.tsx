import Select from 'react-select';
import type { CollectionFloorPrice } from '../types/reservoir';
import './CollectionDropdown.css';

interface Props {
  collections: CollectionFloorPrice[];
  selectedCollectionId: string | null;
  onSelect: (collectionId: string) => void;
}

interface OptionType {
  value: string;
  label: string;
  collection: CollectionFloorPrice;
}

export function CollectionDropdown({ collections, selectedCollectionId, onSelect }: Props) {
  const options: OptionType[] = collections.map((collection) => ({
    value: collection.id,
    label: collection.name,
    collection
  }));

  const selectedOption = options.find(option => option.value === selectedCollectionId);

  const formatOptionLabel = ({ collection }: OptionType) => (
    <div className="collection-option">
      <span className="collection-name">{collection.name}</span>
      <span className="collection-volume">{collection.volume24h.toFixed(2)} ETH (24h)</span>
    </div>
  );

  return (
    <div className="collection-select-container">
      <Select
        className="collection-select"
        classNamePrefix="select"
        value={selectedOption}
        onChange={(option) => option && onSelect(option.value)}
        options={options}
        formatOptionLabel={formatOptionLabel}
        placeholder="Select a collection..."
        isSearchable
      />
    </div>
  );
} 