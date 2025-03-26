import Select, { StylesConfig, GroupBase } from 'react-select';
import type { NFTfiCollection } from '../api/nftfiApi';
import './CollectionDropdown.css';

interface Props {
  collections: NFTfiCollection[];
  selectedCollectionId: string | null;
  onSelect: (collectionId: string) => void;
}

interface OptionType {
  value: string;
  label: string;
  collection: NFTfiCollection;
}

export function CollectionDropdown({ collections, selectedCollectionId, onSelect }: Props) {
  const options: OptionType[] = collections
    .sort((a, b) => (b.volumePercentage || 0) - (a.volumePercentage || 0))
    .map((collection) => ({
      value: collection.nftProjectName,
      label: collection.nftProjectName,
      collection
    }));

  const selectedOption = selectedCollectionId ? options.find(option => option.value === selectedCollectionId) || null : null;

  const formatOptionLabel = ({ collection }: OptionType) => (
    <div className="collection-option">
      <span className="collection-name">{collection.nftProjectName}</span>
      <span className="collection-volume">{collection.volumePercentage?.toFixed(1)}% (365d)</span>
    </div>
  );

  const handleChange = (option: OptionType | null) => {
    if (option) {
      onSelect(option.value);
    }
  };

  const customStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
    menu: (provided) => ({
      ...provided,
      height: '90vh',
      maxHeight: '90vh',
      position: 'absolute',
      width: '100%',
      zIndex: 1000,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: 'none',
      height: '100%',
      padding: '0 0 20px 0',
    })
  };

  return (
    <div className="collection-select-container">
      <Select
        className="collection-select"
        classNamePrefix="select"
        value={selectedOption}
        onChange={handleChange}
        options={options}
        formatOptionLabel={formatOptionLabel}
        placeholder="Select a collection..."
        isClearable={true}
        isSearchable
        styles={customStyles}
      />
    </div>
  );
} 