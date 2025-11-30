import React from 'react';
import { Box, Container, Grid, Card, CardContent, Stack, Typography } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import ConstructionIcon from '@mui/icons-material/Construction';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function Features() {
  const items = [
    { icon: <AssignmentTurnedInIcon />, title: 'Guided tasks', desc: 'Step‑by‑step workflow for every build phase with self quality checks.' },
    { icon: <ArchitectureIcon />, title: 'AI plan analysis', desc: 'Upload drawings; get flagged conflicts and missing scope across trades.' },
    { icon: <ConstructionIcon />, title: 'Bid & contract assurance', desc: 'Catch inconsistencies, exclusions, and risky clauses before execution.' },
    { icon: <CheckCircleIcon />, title: 'Savings you can feel', desc: 'Avoid change orders and schedule slips—save tens of thousands.' },
    { icon: <CheckCircleIcon />, title: 'Simple per‑home pricing', desc: 'Subscribe monthly or per‑project on a per‑home basis.' },
    { icon: <SupportAgentIcon />, title: 'Pro coordinator option', desc: 'Hire a pro builder coordinator for full support including onsite.' },
  ];
  return (
    <Box id="features" sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>What you get</Typography>
        <Grid container spacing={2}>
          {items.map((it) => (
            <Grid item xs={12} md={4} key={it.title}>
              <Card variant="outlined" sx={{ height: '100%', borderColor: '#1f2942', backgroundColor: '#121a2b' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: .5 }}>
                    {it.icon}
                    <Typography variant="h6">{it.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">{it.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


