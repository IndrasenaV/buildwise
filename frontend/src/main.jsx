import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'
import { CssBaseline } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const rootEl = document.getElementById('root')
const root = createRoot(rootEl)

const theme = createTheme({
  palette: {
    mode: 'light'
  },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, Segoe UI, Arial'
  }
})

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js').catch(() => {
      // ignore registration errors
    })
  })
}


