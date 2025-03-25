import React from 'react';
import { DepthChart } from './DepthChart';
import { NFTfiCollection } from '../types/reservoir';
import './DepthChart.css';

interface DepthChartDemoProps {
  collection: NFTfiCollection;
}

export function DepthChartDemo({ collection }: DepthChartDemoProps) {
  const handleDataPointClick = (ltv: number) => {
    console.log(`Selected LTV: ${ltv}%`);
  };

  return (
    <div className="depth-chart-demo">
      <h1>LTV Distribution Visualization Options</h1>
      <p>The following visualizations show different approaches to display the wide range of LTV values in the loan data.</p>
      
      <section>
        <h2>1. Standard View</h2>
        <p>Full range of data, but most information is bunched up on the left due to extreme LTV values.</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="standard"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>

      <section>
        <h2>2. Segmented Views</h2>
        <p>Breaking the chart into meaningful LTV segments (0-100%, 100-500%, 500%+) to see details at each level.</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="segmented"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>

      <section>
        <h2>3. Interactive Brush & Zoom</h2>
        <p>Use the brush at the bottom to focus on specific LTV ranges.</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="brush"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>

      <section>
        <h2>4. Bar Chart (0-100% Focus)</h2>
        <p>Bar chart focusing on the most common LTV range (0-100%).</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="barChart"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>

      <div className="recommendations">
        <h2>Recommendations</h2>
        <p>Based on the data distribution:</p>
        <ul>
          <li>For overview: The standard view provides a quick overall picture of the LTV distribution.</li>
          <li>For detailed analysis: The segmented approach gives the clearest view of each LTV range.</li>
          <li>For interactive exploration: The brush & zoom approach allows users to focus on specific areas of interest.</li>
          <li>For comparison: The bar chart is best for comparing loan counts within the critical 0-100% range.</li>
        </ul>
      </div>
    </div>
  );
}

export default DepthChartDemo; 