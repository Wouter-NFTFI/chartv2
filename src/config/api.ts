// Follow rules from .cursor-ruleset.md
// Get latest NFT floor price from verified contract ABI
// Do not use fallbacks, mock data, or normalized fields

export const API_CONFIG = {
  BASE_URL: 'https://api.example.com',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// API configuration
export const API_URL = 'https://theta-sdk-api.nftfi.com';
