import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BoardProvider } from './context/BoardProvider'
import './styles/global.css'


import './scripts/seedData.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BoardProvider>
      <App />
    </BoardProvider>
  </StrictMode>,
)
