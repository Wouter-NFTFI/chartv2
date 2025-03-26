import React, { useState, useEffect } from 'react';
import { fetchCollections, fetchLoans, NFTfiCollection } from './api/nftfiApi';
import { Loan } from './types/nftfi';
import { CollectionDropdown } from './components/CollectionDropdown';
import { DepthChartDemo } from './components/DepthChartDemo';
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
    
    // Find loans where the LTV is close to the clicked value
    // We'll use a 5% tolerance to account for rounding and small variations
    const tolerance = 0.05;
    
    // Always filter from the complete dataset (allLoans), not the already filtered set
    const filteredLoans = allLoans.filter(loan => {
      // We now have the floor price directly from the chart
      const isWithinTolerance = isLoanMatchingLTV(loan, ltv, floorPriceUSD, tolerance * 100);
      
      // Log only a few sample loans to avoid console spam
      const loanIdNumber = parseInt(loan.loanId, 10);
      if (!isNaN(loanIdNumber) && loanIdNumber % 50 === 0) {
        console.log('Loan LTV check (sample):', {
          loanId: loan.loanId,
          targetLtv: ltv,
          floorPriceUSD,
          tolerance: ltv * tolerance,
          isWithinTolerance
        });
      }
      
      return isWithinTolerance;
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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">NFTfi Loan Analysis</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <CollectionDropdown
              collections={collections}
              selectedCollectionId={selectedCollection?.nftProjectName || null}
              onSelect={handleCollectionSelect}
            />
          </div>
          
          {selectedCollection && (
            <div className={`bg-white rounded-lg shadow p-6 ${isFiltered ? 'filter-active' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedCollection.nftProjectName}</h2>
                  {isFiltered && activeLTV && (
                    <p className="text-sm text-gray-600">
                      Showing loans with LTV around {activeLTV.toFixed(0)}% 
                      ({selectedLoans.length} of {allLoans.length} loans)
                    </p>
                  )}
                </div>
                {isFiltered && (
                  <button 
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors reset-button"
                  >
                    View All Loans
                  </button>
                )}
              </div>
              <DepthChartDemo
                collection={selectedCollection}
                onDataPointClick={handleDataPointClick}
                loans={selectedLoans}
                isLoadingLoans={isLoadingLoans}
                loanError={loanError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 