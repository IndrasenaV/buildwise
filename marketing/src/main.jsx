import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
import '../styles.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#42e6a4' },
    background: { default: '#0b1220', paper: '#121a2b' },
    text: { primary: '#e6ebff', secondary: '#a7b1cc' }
  },
  shape: { borderRadius: 12 }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);


