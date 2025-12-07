import React from 'react';
import { Box, Container, Grid, Card, CardContent, Stack, Typography } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import ConstructionIcon from '@mui/icons-material/Construction';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function Features() {
  const items = [
    { icon: <AssignmentTurnedInIcon />, title: 'Adaptive guidance', desc: 'Not a static checklist—steps change by phase, plans, preferences, and conversations.' },
    { icon: <ArchitectureIcon />, title: 'Understands your project', desc: 'Uses your drawings, preferences, and messages to provide context‑aware guidance.' },
    { icon: <ConstructionIcon />, title: 'Bid & contract assurance', desc: 'Catch exclusions and risky clauses early—reduce change orders and delays.' },
    { icon: <CompareArrowsIcon />, title: 'Bid comparison', desc: 'Apples‑to‑apples comparisons with line‑item gaps and follow‑ups for vendors.' },
    { icon: <CheckCircleIcon />, title: 'Calmer decisions', desc: 'Cut through internet overload; get the one next right step for your build.' },
    { icon: <CheckCircleIcon />, title: 'Simple per‑home pricing', desc: 'Pay per project; add optional onsite coordination when you need it.' },
    { icon: <SupportAgentIcon />, title: 'Human support & onsite visits', desc: 'Talk to real people and get onsite help at key milestones—AI augments, it doesn’t replace.' },
    { icon: <SupportAgentIcon />, title: 'Smart assistance, you decide', desc: 'We enhance your research with context from plans and messages, then help you decide.' },
  ];
  return (
    <Box id="features" sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>What you get</Typography>
        <Grid container spacing={2}>
          {items.map((it) => (
            <Grid item xs={12} md={4} key={it.title}>
              <Card variant="outlined" sx={{ height: '100%', borderColor: 'divider', backgroundColor: 'background.paper' }}>
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


