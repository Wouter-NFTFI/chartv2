// Follow rules from .cursor-ruleset.md
// Get latest NFT floor price from verified contract ABI
// Do not use fallbacks, mock data, or normalized fields

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global/index.css'
import App from './components/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
