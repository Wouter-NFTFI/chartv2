import { API_URL } from './api';

export const ENDPOINTS = {
  LOANS_BY_COLLECTION: '/data/v0/pipes/loans_due_by_collection_endpoint.json',
  LOANS: '/loans',
  COLLECTIONS: '/collections',
  LOANS_DUE: '/data/v0/pipes/loans_due_endpoint.json'
};

export const DEFAULTS = {
  MIN_LOAN_AMOUNT: 0.1,
  MAX_LOAN_AMOUNT: 1000,
  DEFAULT_CURRENCY: 'ETH',
  DEFAULT_INTERVAL: '1d',
  DAYS_LOOKBACK: 30,
  PAGE_SIZE: 100,
  TOP_COLLECTIONS_LIMIT: 10
}; 