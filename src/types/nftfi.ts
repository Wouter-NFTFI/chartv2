export interface NFTfiLoan {
  protocolName: string;
  loanId: string;
  loanContractAddress: string;
  nftProjectName: string;
  nftProjectImageUri: string;
  nftAddress: string;
  nftId: string;
  nftName: string;
  nftImageSmallUri: string;
  nftImageLargeUri: string;
  status: string;
  currencyName: string;
  principalAmount: number;
  principalAmountETH: number;
  principalAmountUSD: number;
  maximumRepaymentAmount: number;
  maximumRepaymentAmountETH: number;
  maximumRepaymentAmountUSD: number;
  apr: number;
  durationDays: number;
  borrowerAddress: string;
  lenderAddress: string;
  dueTime: string;
  startTime: string;
  hoursUntilDue: number;
}

export interface NFTfiCollection {
  id: string;
  name: string;
  symbol: string;
  totalLoans: number;
  activeLoans: number;
  total_usd_value: number;
  volumePercentage?: number;
  floorPrice?: number;
  nftProjectName?: string;
  nftProjectImageUri?: string;
  avg_usd_value?: number;
  avg_apr?: number;
  loan_count?: number;
}

export interface NFTfiLoansResponse {
  data: NFTfiLoan[];
  rows: number;
  rows_before_limit_at_least: number;
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

export interface NFTfiCollectionsResponse {
  data: NFTfiCollection[];
  rows: number;
  rows_before_limit_at_least: number;
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

export interface NFTfiLoanMeta {
  nftProjectName: string;
  nftProjectId: string;
  loanAmount: number;
  loanCurrency: string;
  ltv: number;
  apr: number;
  duration: number;
  timestamp: number;
}

export interface LoanDistribution {
  ltv: number;
  loanCount: number;
  totalValue: number;
  actualLtv?: number;
}

export interface LoanStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  count: number;
}

export interface Loan {
  loanId: string;
  protocolName: string;
  nftId: string;
  nftImageSmallUri: string;
  principalAmountUSD: number;
  maximumRepaymentAmountUSD: number;
  apr: number;
  durationDays: number;
  hoursUntilDue: number;
  borrowerAddress: string;
  lenderAddress: string;
} 