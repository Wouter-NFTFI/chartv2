// Follow rules from .cursor-ruleset.md
// Get latest NFT floor price from verified contract ABI
// Do not use fallbacks, mock data, or normalized fields

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import NFTFloorPrice from './components/NFTFloorPrice'

function App() {
  const [count, setCount] = useState(0)
  const [contractAddress, setContractAddress] = useState('0x123456789abcdef')

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>ChartV2 on Cloudflare Pages</h1>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      
      <div className="nft-section">
        <h2>NFT Floor Price Demo</h2>
        <input 
          type="text" 
          value={contractAddress} 
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Enter contract address"
        />
        <NFTFloorPrice contractAddress={contractAddress} />
      </div>
      
      <p className="read-the-docs">
        Ready to deploy to Cloudflare Pages!
      </p>
    </>
  )
}

export default App
