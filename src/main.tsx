import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'
import { LLMProvider } from './contexts/LLMContext'
import { dataService } from './services/dataService'
import './index.css'

// Initialize data service on app load
dataService.loadPOIs().catch(error => {
  console.error('Failed to load POI data on startup:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LLMProvider>
        <App />
      </LLMProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
