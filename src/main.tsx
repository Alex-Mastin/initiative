import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import InitiativeTracker from './InitiativeTracker.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InitiativeTracker />
  </StrictMode>,
)
