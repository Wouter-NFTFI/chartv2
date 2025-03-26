import React, { useState, useEffect } from 'react';
import { fetchCollections, fetchLoans, NFTfiCollection } from './api/nftfiApi';
import { Loan } from './types/nftfi';
import { DepthChartDemo } from './components/DepthChartDemo';
import { FilterBar } from './components/FilterBar';
import { isLoanMatchingLTV } from './utils/financial';
import './App.css';

function App() {
  const [collections, setCollections] = useState<NFTfiCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<NFTfiCollection | null>(null);
  const [allLoans, setAllLoans] = useState<Loan[]>([]); // Store the complete set of loans
  const [selectedLoans, setSelectedLoans] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false); // Track if filtering is active
  const [activeLTV, setActiveLTV] = useState<number | null>(null); // Track active LTV filter

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const collectionsData = await fetchCollections();
        setCollections(collectionsData);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      }
    };
    loadCollections();
  }, []);

  const handleCollectionSelect = async (collectionId: string) => {
    setIsLoadingLoans(true);
    setLoanError(null);
    setIsFiltered(false); // Reset filter status when selecting a new collection
    
    try {
      const selected = collections.find(c => c.nftProjectName === collectionId) || null;
      setSelectedCollection(selected);
      
      if (selected) {
        const response = await fetchLoans(365, collectionId);
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid loan data received from API');
        }
        
        const transformedLoans = response.data.map(loan => ({
          loanId: loan.loanId,
          protocolName: loan.protocolName,
          nftId: loan.nftId,
          nftImageSmallUri: loan.nftImageSmallUri,
          principalAmountUSD: loan.principalAmountUSD,
          maximumRepaymentAmountUSD: loan.maximumRepaymentAmountUSD,
          apr: loan.apr,
          durationDays: loan.durationDays,
          hoursUntilDue: loan.hoursUntilDue,
          borrowerAddress: loan.borrowerAddress,
          lenderAddress: loan.lenderAddress
        }));
        
        // Set both allLoans and selectedLoans to the full dataset
        setAllLoans(transformedLoans);
        setSelectedLoans(transformedLoans);
      }
    } catch (err) {
      setLoanError(err instanceof Error ? err.message : 'Failed to fetch loans');
      setAllLoans([]);
      setSelectedLoans([]);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const handleDataPointClick = (ltv: number, floorPriceUSD: number) => {
    if (!selectedCollection) return;
    
    console.log('Chart point clicked:', { 
      ltv, 
      floorPriceUSD,
      allLoansCount: allLoans.length
    });
    
    // Always filter from the complete dataset (allLoans), not the already filtered set
    const filteredLoans = allLoans.filter(loan => {
      // Use exact bucket matching instead of tolerance-based matching
      // This ensures we only show loans that are in the exact LTV bucket shown in the tooltip
      // The bucket size (1%) must match what's used in the DepthChart component
      // This fixes the issue where tooltip shows X loans but table shows many more
      const isExactMatch = isLoanMatchingLTV(loan, ltv, floorPriceUSD, { 
        exactMatch: true, 
        bucketSize: 1  // Must match the bucket size used in the chart
      });
      
      // Log only a few sample loans to avoid console spam
      const loanIdNumber = parseInt(loan.loanId, 10);
      if (!isNaN(loanIdNumber) && loanIdNumber % 50 === 0) {
        console.log('Loan LTV check (sample):', {
          loanId: loan.loanId,
          targetLtv: ltv,
          floorPriceUSD,
          exactMatch: isExactMatch
        });
      }
      
      return isExactMatch;
    });

    console.log('Filtered loans:', {
      totalLoans: allLoans.length,
      filteredCount: filteredLoans.length,
      ltv,
      floorPriceUSD
    });

    setSelectedLoans(filteredLoans);
    setIsFiltered(true); // Set filter status to active
    setActiveLTV(ltv); // Track which LTV we're currently filtering on
  };

  // Function to reset to the full dataset
  const handleResetFilters = () => {
    console.log('Resetting filters, showing all loans:', allLoans.length);
    setSelectedLoans(allLoans);
    setIsFiltered(false);
    setActiveLTV(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 white-bg-override">
      <div className="container mx-auto px-6 py-8 white-bg-override">
        <div className="chart-container-filter-bar mb-6">
          <FilterBar 
            collections={collections}
            selectedCollectionId={selectedCollection?.nftProjectName || null}
            onSelectCollection={handleCollectionSelect}
            isFiltered={isFiltered}
            activeLTV={activeLTV}
            selectedLoansCount={selectedLoans.length}
            totalLoansCount={allLoans.length}
            onResetFilters={handleResetFilters}
          />
        </div>
        
        {selectedCollection ? (
          <DepthChartDemo
            collection={selectedCollection}
            onDataPointClick={handleDataPointClick}
            loans={selectedLoans}
            isLoadingLoans={isLoadingLoans}
            loanError={loanError}
            isFiltered={isFiltered}
            activeLTV={activeLTV}
          />
        ) : (
          <div className="flex items-center justify-center h-64 white-bg-override">
            {/* Placeholder text removed */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 