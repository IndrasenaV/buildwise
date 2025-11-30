import React from 'react';
import { Box, Container, Grid, Card, CardContent, CardActions, Typography, Divider, Stack, Chip, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Pricing() {
  const tiers = [
    {
      name: 'Guide',
      subtitle: 'Essential tools',
      features: ['Task guidance for all phases', 'Self quality‑checks', 'Checklists and templates', 'Email support'],
      cta: 'Get quote',
      priceDisplay: '$99/month/home',
      chipLabel: 'Per home • monthly'
    },
    {
      name: 'AI Assurance',
      subtitle: 'Plan + bid analysis',
      features: ['AI plan & drawing analysis', 'Bid & contract checks', 'Variance & omission flags', 'Priority support'],
      cta: 'Request proposal',
      featured: true,
      priceDisplay: '$299/month/home',
      chipLabel: 'Per home • monthly'
    },
    {
      name: 'Concierge',
      subtitle: 'Pro coordinator',
      features: ['Dedicated builder coordinator', 'End‑to‑end build support', 'Optional onsite support', 'Executive reporting'],
      cta: 'Talk to sales',
      priceDisplay: 'Talk to sales',
      chipLabel: 'Per home • custom'
    }
  ];
  return (
    <Box id="pricing" sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Pricing</Typography>
        <Typography color="text.secondary">Pricing is per home. Choose monthly or per‑project to match your workflow.</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {tiers.map((t) => (
            <Grid item xs={12} md={4} key={t.name}>
              <Card variant="outlined" sx={{
                height: '100%', borderColor: t.featured ? 'rgba(66,230,164,.4)' : '#1f2942',
                outline: t.featured ? '2px solid rgba(66,230,164,.15)' : 'none',
                backgroundColor: '#121a2b'
              }}>
                <CardContent>
                  <Typography variant="h6">{t.name}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>{t.subtitle}</Typography>
                  <Typography sx={{ mb: 1, fontWeight: 800, fontSize: 24, color: '#e6ebff' }}>
                    {t.priceDisplay}
                  </Typography>
                  <Divider sx={{ borderColor: '#1f2942', mb: 1 }} />
                  <Stack spacing={1}>
                    {t.features.map((f) => (
                      <Stack key={f} direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography color="text.secondary">{f}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                  <Chip label={t.chipLabel} variant="outlined" sx={{ borderColor: '#1f2942', color: 'text.secondary' }} />
                  <Button variant="contained" sx={{ color: '#0b1220' }} onClick={() => document.getElementById('contact').scrollIntoView({behavior:'smooth'})}>{t.cta}</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


