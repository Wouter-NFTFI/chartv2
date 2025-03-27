/**
 * Contract Address Mappings for Floor Price Data
 * 
 * This module provides mappings between contract addresses that lack floor price data
 * and alternative contract addresses that can be used to fetch reliable floor price data.
 * 
 * This is necessary because some contract addresses (especially for wrapped collections or
 * specialized deployments) don't have floor price data available in the Reservoir API,
 * while their counterparts do.
 */

interface ContractMapping {
  /** The contract address to map to */
  targetAddress: string;
  /** The original collection name (for documentation) */
  originalName: string;
  /** The target collection name (for documentation) */
  targetName: string;
  /** Explanation of why this mapping exists */
  explanation: string;
}

/** 
 * Map of problematic contract addresses to their floor price alternatives
 * All addresses must be lowercase for consistent comparison
 */
export const CONTRACT_ADDRESS_MAPPINGS: Record<string, ContractMapping> = {
  // CryptoPunks 721 (a specialized implementation) → CryptoPunks (original)
  "0x000000000000003607fce1ac9e043a86675c5c2f": {
    targetAddress: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
    originalName: "CryptoPunks 721",
    targetName: "CryptoPunks",
    explanation: "CryptoPunks 721 lacks floor price data in Reservoir API, but represents the same assets as regular CryptoPunks"
  },
  
  // Additional mappings can be added here as needed
  
  // XCOPY special implementation → Regular XCOPY contract with floor data
  "0xc4560031bf20e5c930e77a61a4de9794db51e504": {
    targetAddress: "0xca21d4228cdcc68d4e23807e5e370c07577dd152",
    originalName: "XCOPY (Special Contract)",
    targetName: "XCOPY",
    explanation: "This XCOPY contract lacks floor price data in Reservoir API"
  },
  
  // Mapped for consistency with the first XCOPY address
  "0xfd04e14334d876635e7ea46ae636d4a45d8ffdde": {
    targetAddress: "0xca21d4228cdcc68d4e23807e5e370c07577dd152",
    originalName: "XCOPY (Alternative Contract)",
    targetName: "XCOPY",
    explanation: "This XCOPY contract lacks floor price data in Reservoir API"
  }
};

/**
 * Gets the alternative contract address for floor price data if one exists
 * 
 * @param contractAddress The original contract address (any case)
 * @returns The mapped address if available, or the original address if no mapping exists
 */
export function getMappedContractAddress(contractAddress: string): string {
  // Normalize to lowercase for consistent lookups
  const normalizedAddress = contractAddress.toLowerCase();
  
  // Look up the mapping
  const mapping = CONTRACT_ADDRESS_MAPPINGS[normalizedAddress];
  if (mapping) {
    console.log(`Contract address mapping applied: ${normalizedAddress} (${mapping.originalName}) → ${mapping.targetAddress} (${mapping.targetName})`);
    return mapping.targetAddress;
  }
  
  // Return the original if no mapping exists
  return contractAddress;
} 