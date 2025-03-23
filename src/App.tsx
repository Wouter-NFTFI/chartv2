import { useState, useEffect } from 'react';
import { useCollections } from './hooks/useCollections';
import { CollectionDropdown } from './components/CollectionDropdown';
import DepthChart from './components/DepthChart';
import LoanTable from './components/LoanTable';
import { NFTfiCollection } from './types/reservoir';
import { fetchLoans } from './api/nftfiApi';
import './App.css';

interface Loan {
  asset: string;
  currentLTV: number;
  currentLoanAmount: number;
  originalLTV: number;
  originalLoanAmount: number;
  startDate: string;
  dueDate: string;
}

function App() {
  const { collections, isLoading, error } = useCollections();
  const [selectedCollection, setSelectedCollection] = useState<NFTfiCollection | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const handleCollectionSelect = (collectionId: string) => {
    const selected = collections.find(c => c.nftProjectName === collectionId) || null;
    setSelectedCollection(selected);
    setSelectedLoans([]); // Clear selected loans when changing collections
  };

  const handleDataPointClick = async (ltv: number) => {
    if (!selectedCollection) return;

    setIsLoadingLoans(true);
    setLoanError(null);

    try {
      const response = await fetchLoans(365, selectedCollection.nftProjectName);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid loan data received from API');
      }

      // Filter loans by LTV and transform into our format
      const transformedLoans = response.data
        .filter(loan => {
          const loanLtv = (loan.repaymentAmount / loan.principalAmount) * 100;
          // Match loans within ±2.5% of the clicked LTV (one bucket width)
          return Math.abs(loanLtv - ltv) <= 2.5;
        })
        .map(loan => ({
          asset: selectedCollection.nftProjectName,
          currentLTV: (loan.repaymentAmount / loan.principalAmount) * 100,
          currentLoanAmount: loan.principalAmount,
          originalLTV: (loan.repaymentAmount / loan.principalAmount) * 100,
          originalLoanAmount: loan.principalAmount,
          startDate: new Date().toISOString(),
          dueDate: loan.dueDate
        }));

      setSelectedLoans(transformedLoans);
    } catch (err) {
      setLoanError(err instanceof Error ? err.message : 'Failed to fetch loans');
      setSelectedLoans([]);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        {isLoading ? (
          <p>Loading collections...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : (
          <CollectionDropdown
            collections={collections}
            selectedCollectionId={selectedCollection?.nftProjectName || null}
            onSelect={handleCollectionSelect}
          />
        )}
      </header>
      <main className="app-main">
        {selectedCollection && (
          <>
            <DepthChart 
              collection={selectedCollection}
              onDataPointClick={handleDataPointClick}
            />
            {isLoadingLoans ? (
              <p>Loading loans...</p>
            ) : loanError ? (
              <p className="error">Error: {loanError}</p>
            ) : (
              <LoanTable loans={selectedLoans} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App; 