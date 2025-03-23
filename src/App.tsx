// Interact with verified on-chain data using ABI-defined structure
// Do not use mock data, fallbacks, or inferred fields
// Use exact field names from contract ABIs only
// Treat all data as immutable and verifiable

import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './components/App.css'
import { fetchLoans } from './api/nftfiApi'

function App() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLoanData() {
      try {
        setLoading(true)
        // Fetch loans due in the next 365 days, no specific lender
        const response = await fetchLoans(365)
        console.log('Fetched loan data:', response)
        console.log(`Total loans: ${response.rows}`)
        console.log(`First loan protocol: ${response.data[0]?.protocolName}`)
        console.log(`First loan amount: ${response.data[0]?.principalAmount} ${response.data[0]?.currencyName}`)
      } catch (error) {
        console.error('Failed to fetch loan data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLoanData()
  }, [])

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
          {loading ? 'Loading loan data...' : 'Loan data fetched! Check console for results.'}
        </p>
      </div>
      
      <p className="read-the-docs">
        API test deployed to Cloudflare Pages
      </p>
    </>
  )
}

export default App
