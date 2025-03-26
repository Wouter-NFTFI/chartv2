import React, { useState } from 'react';
import { Loan } from '../types/nftfi';
import './LoanTable.css';

interface Props {
  loans: Loan[];
}

type SortField = 'protocolName' | 'nftId' | 'principalAmountUSD' | 'maximumRepaymentAmountUSD' | 'apr' | 'durationDays' | 'hoursUntilDue' | 'borrowerAddress' | 'lenderAddress';
type SortDirection = 'asc' | 'desc';

const LoanTable: React.FC<Props> = ({ loans }) => {
  const [sortField, setSortField] = useState<SortField>('hoursUntilDue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ${Math.round(hours % 24)}h`;
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLoans = [...loans].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'protocolName':
        comparison = a.protocolName.localeCompare(b.protocolName);
        break;
      case 'nftId':
        comparison = a.nftId.localeCompare(b.nftId);
        break;
      case 'principalAmountUSD':
        comparison = a.principalAmountUSD - b.principalAmountUSD;
        break;
      case 'maximumRepaymentAmountUSD':
        comparison = a.maximumRepaymentAmountUSD - b.maximumRepaymentAmountUSD;
        break;
      case 'apr':
        comparison = a.apr - b.apr;
        break;
      case 'durationDays':
        comparison = a.durationDays - b.durationDays;
        break;
      case 'hoursUntilDue':
        comparison = a.hoursUntilDue - b.hoursUntilDue;
        break;
      case 'borrowerAddress':
        comparison = a.borrowerAddress.localeCompare(b.borrowerAddress);
        break;
      case 'lenderAddress':
        comparison = a.lenderAddress.localeCompare(b.lenderAddress);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="loan-table-container">
      <table className="loan-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('protocolName')}>
              Protocol
              {sortField === 'protocolName' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('nftId')}>
              Asset
              {sortField === 'nftId' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th>Thumbnail</th>
            <th onClick={() => handleSort('principalAmountUSD')}>
              Principal
              {sortField === 'principalAmountUSD' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('maximumRepaymentAmountUSD')}>
              Repayment
              {sortField === 'maximumRepaymentAmountUSD' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('apr')}>
              APR
              {sortField === 'apr' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('durationDays')}>
              Duration
              {sortField === 'durationDays' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('hoursUntilDue')}>
              Due in
              {sortField === 'hoursUntilDue' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('borrowerAddress')}>
              Borrower
              {sortField === 'borrowerAddress' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('lenderAddress')}>
              Lender
              {sortField === 'lenderAddress' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedLoans.map((loan, index) => (
            <tr key={`${loan.nftId}-${index}`}>
              <td>{loan.protocolName}</td>
              <td>{loan.nftId}</td>
              <td>
                <img 
                  src={loan.nftImageSmallUri} 
                  alt={`NFT ${loan.nftId}`}
                  className="nft-thumbnail"
                />
              </td>
              <td>{formatCurrency(loan.principalAmountUSD)}</td>
              <td>{formatCurrency(loan.maximumRepaymentAmountUSD)}</td>
              <td>{loan.apr.toFixed(2)}%</td>
              <td>{loan.durationDays}d</td>
              <td>{formatDuration(loan.hoursUntilDue)}</td>
              <td title={loan.borrowerAddress}>{formatAddress(loan.borrowerAddress)}</td>
              <td title={loan.lenderAddress}>{formatAddress(loan.lenderAddress)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LoanTable; 