import React from 'react';
import { Container, Box } from '@mui/material';
import NavBar from './components/NavBar.jsx';
import Hero from './components/Hero.jsx';
import Features from './components/Features.jsx';
import Segments from './components/Segments.jsx';
import Pricing from './components/Pricing.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import FAQ from './components/FAQ.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <Box>
      <NavBar />
      <Hero />
      <Features />
      <Segments />
      <Pricing />
      <HowItWorks />
      <FAQ />
      <Contact />
      <Footer />
    </Box>
  );
}


