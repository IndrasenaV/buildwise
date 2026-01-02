import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'
import { CssBaseline } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const rootEl = document.getElementById('root')
const root = createRoot(rootEl)

function resolveInitialMode() {
  try {
    const stored = localStorage.getItem('themeMode')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {}
  return 'light'
}

function useAppTheme() {
  const [mode, setMode] = useState(resolveInitialMode)

  useEffect(() => {
    function onThemeSet(ev) {
      try {
        const next = ev?.detail?.mode
        if (next === 'light' || next === 'dark') {
          setMode(next)
          try { localStorage.setItem('themeMode', next) } catch {}
        }
      } catch {}
    }
    window.addEventListener('theme:set', onThemeSet)
    return () => window.removeEventListener('theme:set', onThemeSet)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('themeMode', mode) } catch {}
  }, [mode])

  const theme = useMemo(() => createTheme({
    palette: { mode },
    typography: {
      fontFamily: 'Roboto, system-ui, -apple-system, Segoe UI, Arial',
      htmlFontSize: 14, // slightly smaller baseline
    },
    shape: { borderRadius: 6 },
    components: {
      MuiButton: { defaultProps: { size: 'small' } },
      MuiIconButton: { defaultProps: { size: 'small' } },
      MuiTextField: { defaultProps: { size: 'small', margin: 'dense' } },
      MuiFormControl: { defaultProps: { size: 'small', margin: 'dense' } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiInputBase: {
        styleOverrides: {
          root: { fontSize: '0.875rem' },
          input: {
            paddingTop: 8,
            paddingBottom: 8,
            color: '#111', // keep text readable on white inputs even in dark mode
            '::placeholder': { color: 'rgba(0,0,0,0.5)', opacity: 1 }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            color: '#111',
            '::placeholder': { color: 'rgba(0,0,0,0.5)', opacity: 1 }
          }
        }
      },
      MuiFilledInput: {
        styleOverrides: {
          input: {
            color: '#111',
            '::placeholder': { color: 'rgba(0,0,0,0.5)', opacity: 1 }
          }
        }
      },
      MuiFormLabel: {
        styleOverrides: { root: { fontSize: '0.8rem' } }
      },
      MuiMenuItem: { defaultProps: { dense: true } },
      MuiListItem: { defaultProps: { dense: true } },
      MuiChip: { defaultProps: { size: 'small' } },
      MuiTabs: { styleOverrides: { root: { minHeight: 36 } } },
      MuiTab: { styleOverrides: { root: { minHeight: 36, padding: '6px 12px' } } },
      MuiPaper: { styleOverrides: { root: { padding: 0 } } },
    }
  }), [mode])

  return theme
}

function Root() {
  const theme = useAppTheme()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  )
}

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js').catch(() => {
      // ignore registration errors
    })
  })
}


