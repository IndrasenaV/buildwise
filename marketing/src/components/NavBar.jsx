import React from 'react';
import { AppBar, Toolbar, Stack, Button, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../assets/logo.svg';

export default function NavBar() {
  const isMdUp = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width:900px)').matches;
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(11,18,32,.7)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1f2942' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => scrollTo('top')}>
          <img src={logo} alt="BuildWise AI" width="120" height="24" />
        </Box>
        {isMdUp ? (
          <Stack direction="row" spacing={1}>
            <Button color="inherit" onClick={() => scrollTo('features')}>Features</Button>
            <Button color="inherit" onClick={() => scrollTo('segments')}>Segments</Button>
            <Button color="inherit" onClick={() => scrollTo('pricing')}>Pricing</Button>
            <Button color="inherit" onClick={() => scrollTo('how')}>How it works</Button>
            <Button color="inherit" onClick={() => scrollTo('faq')}>FAQ</Button>
            <Button variant="contained" sx={{ color: '#0b1220' }} onClick={() => scrollTo('contact')}>Get in touch</Button>
          </Stack>
        ) : (
          <IconButton color="inherit" onClick={() => scrollTo('contact')}>
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}


