import React from 'react';
import Select, { StylesConfig, GroupBase, components, DropdownIndicatorProps } from 'react-select';
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

  // Custom search icon component
  const SearchIcon = () => (
    <div className="search-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#637381"/>
      </svg>
    </div>
  );

  // Custom components
  const DropdownIndicator = (props: DropdownIndicatorProps<OptionType, false>) => {
    return (
      <components.DropdownIndicator {...props}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10L12 15L17 10" stroke="#637381" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </components.DropdownIndicator>
    );
  };

  const customStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
    menu: (provided) => ({
      ...provided,
      height: '90vh',
      maxHeight: '90vh',
      position: 'absolute',
      width: '100%',
      zIndex: 1000,
      backgroundColor: '#FFF',
      boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.16)',
      borderRadius: '8px',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: 'none',
      height: '100%',
      padding: '0 0 20px 0',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    valueContainer: (provided) => ({
      ...provided,
      paddingLeft: '40px', // Make room for the search icon
    }),
    control: (provided) => ({
      ...provided,
      width: '100%',
    }),
  };

  return (
    <div className="collection-select-container">
      <SearchIcon />
      <Select
        className="collection-select"
        classNamePrefix="select"
        value={selectedOption}
        onChange={handleChange}
        options={options}
        formatOptionLabel={formatOptionLabel}
        placeholder="Select a collection"
        isClearable={false}
        isSearchable
        styles={customStyles}
        components={{ DropdownIndicator }}
      />
    </div>
  );
} 