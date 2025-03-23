import React, { useState } from 'react';
import Select, { StylesConfig, OptionProps } from 'react-select';
import { NFTfiCollection } from '../api/nftfiApi';
import './CollectionDropdown.css';

interface CollectionDropdownProps {
  collections: NFTfiCollection[];
  onSelectCollection: (collection: NFTfiCollection) => void;
  isLoading?: boolean;
}

interface OptionType {
  value: string;
  label: string | React.ReactNode;
  collection: NFTfiCollection;
}

function CollectionDropdown({ 
  collections, 
  onSelectCollection, 
  isLoading = false 
}: CollectionDropdownProps) {
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
  
  // Map collections to options format expected by React Select
  const options = collections.map(collection => ({
    value: collection.nftProjectName || 'unnamed',
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>{collection.nftProjectName || 'Unnamed Collection'}</span>
        <span style={{ color: '#007bff', fontWeight: 600 }}>{collection.volumePercentage?.toFixed(2)}%</span>
      </div>
    ),
    collection
  }));
  
  // Handle selection change
  const handleChange = (option: OptionType | null) => {
    setSelectedOption(option);
    if (option) {
      onSelectCollection(option.collection);
    }
  };
  
  // Custom styles for React Select
  const customStyles: StylesConfig<OptionType, false> = {
    control: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: '#fff',
      borderColor: '#e0e0e0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      '&:hover': {
        borderColor: '#007bff',
        boxShadow: '0 2px 8px rgba(0, 123, 255, 0.15)'
      }
    }),
    option: (baseStyles, state: OptionProps<OptionType, false>) => ({
      ...baseStyles,
      backgroundColor: state.isSelected 
        ? '#007bff' 
        : state.isFocused 
          ? '#f5f8ff' 
          : '#fff',
      color: state.isSelected ? 'white' : '#333',
      padding: '12px 16px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#007bff' : '#f5f8ff'
      },
      '& > div > span:last-child': {
        color: state.isSelected ? 'white' : '#007bff'
      }
    }),
    input: (baseStyles) => ({
      ...baseStyles,
      color: '#333'
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: '#aaa'
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      color: '#333',
      width: '100%'
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: '#fff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000
    })
  };
  
  return (
    <div className="collection-select-container">
      <Select
        className="collection-select"
        options={options}
        value={selectedOption}
        onChange={handleChange}
        isLoading={isLoading}
        isDisabled={isLoading}
        placeholder={isLoading ? "Loading collections..." : "Select a collection"}
        isClearable={false}
        isSearchable={true}
        styles={customStyles}
      />
    </div>
  );
}

export default CollectionDropdown; 