import { DepthChart } from './DepthChart';
import { NFTfiCollection } from '../api/nftfiApi';
import { Loan } from '../types/nftfi';
import LoanTable from './LoanTable';
import './DepthChart.css';

interface DepthChartDemoProps {
  collection: NFTfiCollection;
  onDataPointClick: (ltv: number, floorPriceUSD: number) => void;
  loans: Loan[];
  isLoadingLoans: boolean;
  loanError: string | null;
}

export function DepthChartDemo({ 
  collection, 
  onDataPointClick, 
  loans, 
  isLoadingLoans, 
  loanError,
}: DepthChartDemoProps) {
  return (
    <div className="depth-chart-demo-container">
      <div className="depth-chart-demo-content">
        
        <section>
          <h1>1. Standard View</h1>
          <p>Full range of data, but most information is bunched up on the left due to extreme LTV values.</p>
          <div className="chart-demo-container">
            <DepthChart 
              collection={collection} 
              visualizationType="standard"
              onDataPointClick={onDataPointClick}
            />
          </div>
        </section>

        <section>
          <h1>2. Segmented Views</h1>
          <p>Breaking the chart into meaningful LTV segments (0-100%, 100-500%, 500%+) to see details at each level.</p>
          <div className="chart-demo-container">
            <DepthChart 
              collection={collection} 
              visualizationType="segmented"
              onDataPointClick={onDataPointClick}
            />
          </div>
        </section>

        <section>
          <h1>3. Interactive Brush & Zoom</h1>
          <p>Use the brush at the bottom to focus on specific LTV ranges.</p>
          <div className="chart-demo-container">
            <DepthChart 
              collection={collection} 
              visualizationType="brush"
              onDataPointClick={onDataPointClick}
            />
          </div>
        </section>

        <section>
          <h1>4. Logarithmic Distribution View</h1>
          <p>Dynamic variable-width bins showing LTV distribution across the entire range.</p>
          <div className="chart-demo-container">
            <DepthChart
              collection={collection}
              visualizationType="logarithmic"
              onDataPointClick={onDataPointClick}
            />
          </div>
        </section>

        <section>
          <h1>5. Symmetric Log View</h1>
          <p>Centered around the distribution peak with logarithmic scaling in both directions for balanced visualization.</p>
          <div className="chart-demo-container">
            <DepthChart 
              collection={collection} 
              visualizationType="symLog"
              onDataPointClick={onDataPointClick}
            />
          </div>
        </section>
        
        {/* Add spacing at the bottom to account for fixed table */}
        <div style={{ height: '33.33vh' }}></div>
      </div>
      
      <div className="depth-chart-demo-table">
        <div className="table-header">
          <h2 className="text-xl font-semibold">Loan Data</h2>
        </div>

        {isLoadingLoans ? (
          <div className="table-loading">Loading loans...</div>
        ) : loanError ? (
          <div className="table-error">Error: {loanError}</div>
        ) : loans.length > 0 ? (
          <LoanTable loans={loans} />
        ) : (
          <div className="table-loading">No loans match the current filter criteria</div>
        )}
      </div>
    </div>
  );
}

export default DepthChartDemo; 