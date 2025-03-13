import React from 'react'
import ReactDOM from 'react-dom/client'
<<<<<<< HEAD
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
=======
import App from './App'
import './index.css' // Only this CSS import remains
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
  </React.StrictMode>
)