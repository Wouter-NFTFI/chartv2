import React, { useState } from 'react';
import './LoanTable.css';

interface Loan {
  asset: string;
  currentLTV: number;
  currentLoanAmount: number;
  originalLTV: number;
  originalLoanAmount: number;
  startDate: string;
  dueDate: string;
}

interface Props {
  loans: Loan[];
}

type SortField = 'asset' | 'currentLTV' | 'originalLTV' | 'startDate' | 'dueDate';
type SortDirection = 'asc' | 'desc';

const LoanTable: React.FC<Props> = ({ loans }) => {
  const [sortField, setSortField] = useState<SortField>('currentLTV');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '/');
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
      case 'asset':
        comparison = a.asset.localeCompare(b.asset);
        break;
      case 'currentLTV':
        comparison = a.currentLTV - b.currentLTV;
        break;
      case 'originalLTV':
        comparison = a.originalLTV - b.originalLTV;
        break;
      case 'startDate':
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        break;
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="loan-table-container">
      <table className="loan-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('asset')}>
              Asset
              {sortField === 'asset' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('currentLTV')}>
              Current LTV
              {sortField === 'currentLTV' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('originalLTV')}>
              Original LTV
              {sortField === 'originalLTV' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('startDate')}>
              Start
              {sortField === 'startDate' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th onClick={() => handleSort('dueDate')}>
              Due
              {sortField === 'dueDate' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedLoans.map((loan, index) => (
            <tr key={`${loan.asset}-${index}`}>
              <td>{loan.asset}</td>
              <td>
                {loan.currentLTV}% {formatCurrency(loan.currentLoanAmount)}
              </td>
              <td>
                {loan.originalLTV}% {formatCurrency(loan.originalLoanAmount)}
              </td>
              <td>{formatDate(loan.startDate)}</td>
              <td>{formatDate(loan.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LoanTable; 