import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppProviders } from './app/app-providers'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Không tìm thấy root element (#root)')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
)
