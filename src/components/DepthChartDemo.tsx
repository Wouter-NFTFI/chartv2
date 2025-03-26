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
        <h1>1. Standard View</h1>
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
        <h1>2. Segmented Views</h1>
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
        <h1>3. Interactive Brush & Zoom</h1>
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
        <h1>4. Bar Chart (0-100% Focus)</h1>
        <p>Bar chart focusing on the most common LTV range (0-100%).</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="barChart"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>

      <section>
        <h1>5. Logarithmic Distribution View</h1>
        <p>Dynamic variable-width bins showing LTV distribution across the entire range.</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="logarithmic"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>

      <section>
        <h1>6. Symmetric Log View</h1>
        <p>Centered around the distribution peak with logarithmic scaling in both directions for balanced visualization.</p>
        <div className="chart-demo-container">
          <DepthChart 
            collection={collection} 
            visualizationType="symLog"
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </section>
    </div>
  );
}

export default DepthChartDemo; 