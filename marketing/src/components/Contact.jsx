import React from 'react';
import { Box, Container, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Button, Typography, Snackbar, Alert } from '@mui/material';

export default function Contact() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', company: '', segment: '', pricing: '', volume: '', message: '' });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    console.info('[BuildWise AI] Contact form submitted:', form);
    setOpen(true);
    setForm({ name: '', email: '', company: '', segment: '', pricing: '', volume: '', message: '' });
  };
  return (
    <Box id="contact" sx={{ py: 8, background: 'linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0))' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Contact</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Tell us about your project and preferred pricing mode. We’ll follow up with next steps and a tailored proposal.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required label="Name" name="name" value={form.name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required type="email" label="Email" name="email" value={form.email} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Company" name="company" value={form.company} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select label="Segment" name="segment" value={form.segment} onChange={handleChange}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  <MenuItem value="Build‑Your‑Home">Build‑Your‑Home</MenuItem>
                  <MenuItem value="Custom High‑End">Custom High‑End</MenuItem>
                  <MenuItem value="Commercial">Commercial</MenuItem>
                  <MenuItem value="Townhome">Townhome</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Pricing mode</InputLabel>
                <Select label="Pricing mode" name="pricing" value={form.pricing} onChange={handleChange}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  <MenuItem value="Per home • monthly">Per home • monthly</MenuItem>
                  <MenuItem value="Per home • per‑project">Per home • per‑project</MenuItem>
                  <MenuItem value="Concierge • custom">Concierge • custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Homes / year" name="volume" value={form.volume} onChange={handleChange} inputProps={{ min: 1, step: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={4} label="Message" name="message" value={form.message} onChange={handleChange} placeholder="Share goals, timelines, and plan/bid context" />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" sx={{ color: '#0b1220' }}>Send</Button>
            <Typography color="text.secondary">We’ll reply within one business day.</Typography>
          </Stack>
        </Box>
        <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
          <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
            Thanks! We received your message and will reply shortly.
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}


