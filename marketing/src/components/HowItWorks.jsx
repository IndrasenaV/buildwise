import React from 'react';
import { Box, Container, Grid, Card, CardContent, Chip, Typography } from '@mui/material';

export default function HowItWorks() {
  const steps = [
    { title: 'Create a project', desc: 'Start a new home and invite your team (builder, designer, partners).' },
    { title: 'Upload your architecture', desc: 'We parse drawings to understand house, roof, exterior, and cross‑trade details.' },
    { title: 'Add bids (optional)', desc: 'Run bid assurance and comparisons to catch gaps/exclusions early.' },
    { title: 'Get adaptive tasks', desc: 'Phase‑aware tasks, tailored to your plans and preferences. Ask for human or onsite help anytime.' },
  ];
  return (
    <Box id="how" sx={{ py: 8, background: 'linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0))' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>How it works</Typography>
        <Grid container spacing={2}>
          {steps.map((s, idx) => (
            <Grid item xs={12} md={6} key={s.title}>
              <Card variant="outlined" sx={{ borderColor: 'divider', backgroundColor: 'background.paper', position: 'relative' }}>
                <CardContent>
                  <Chip label={idx + 1} sx={{ position: 'absolute', top: -12, left: -12, bgcolor: '#42e6a4', color: '#0b1220', fontWeight: 800 }} />
                  <Typography variant="h6" sx={{ mb: .5 }}>{s.title}</Typography>
                  <Typography color="text.secondary">{s.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


