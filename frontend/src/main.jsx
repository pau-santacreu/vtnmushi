import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Apply saved theme before render to avoid flash
const saved = localStorage.getItem('vn_theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute(
  'data-theme',
  saved || (prefersDark ? 'dark' : 'light')
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
