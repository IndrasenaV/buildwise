import React from 'react'
import { Box, Paper, Typography, Tooltip, Container } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

const cell = {
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '8px 10px',
  verticalAlign: 'top',
  fontSize: 14,
  textAlign: 'left',
}

const th = {
  ...cell,
  fontWeight: 700,
  background: 'rgba(255,255,255,0.04)',
}

export default function CompareTable() {
  const rows = [
    {
      label: 'Owner leads day‑to‑day',
      tips: {
        buildwise: 'You drive execution with guided steps and smart assistance.',
        ubuildit: 'Owner‑led build with periodic advisor input.',
        checklists: 'You manage tasks using static checklists.',
        pm: 'Project manager runs day‑to‑day; you approve milestones.',
        gc: 'Builder/GC controls daily workflow; you review and sign off.',
      },
      buildwise: true, ubuildit: true, checklists: true, pm: false, gc: false,
    },
    {
      label: 'High transparency/control',
      tips: {
        buildwise: 'Live budget, tasks, and documents in one place.',
        ubuildit: 'High control, but tracking is mostly manual.',
        checklists: 'High control, but you maintain your own tracking.',
        pm: 'Moderate control; status via PM reports.',
        gc: 'Lower day‑to‑day control; rely on builder updates.',
      },
      buildwise: true, ubuildit: true, checklists: true, pm: false, gc: false,
    },
    {
      label: 'Guidance tailored to your plans/messages',
      tips: {
        buildwise: 'Phase‑aware steps based on your drawings, preferences, and messages.',
        ubuildit: 'General coaching; not automated from your files.',
        checklists: 'One‑size‑fits‑all lists; no context from your project.',
        pm: 'Process oversight; limited deep tailoring to your documents.',
        gc: 'Expertise varies; guidance not programmatically tied to your files.',
      },
      buildwise: true, ubuildit: false, checklists: false, pm: false, gc: false,
    },
    {
      label: 'Built‑in bid comparison/checks',
      tips: {
        buildwise: 'Normalize scope, highlight gaps/assumptions, capture docs.',
        ubuildit: 'May advise on bids; no integrated comparison workflow.',
        checklists: 'No bid comparison; you must compare manually.',
        pm: 'Often out of scope or handled ad‑hoc.',
        gc: 'Typically selects subs; limited transparency into comparisons.',
      },
      buildwise: true, ubuildit: false, checklists: false, pm: false, gc: false,
    },
    {
      label: 'Built‑in quality checkpoints',
      tips: {
        buildwise: 'Structured QA steps per phase; record photos and approvals.',
        ubuildit: 'Advisor walkthroughs may be available, not baked into tool.',
        checklists: 'You must remember and record checks manually.',
        pm: 'Some PMs include site checks; depth varies.',
        gc: 'QC performed by builder; quality varies by team.',
      },
      buildwise: true, ubuildit: false, checklists: false, pm: true, gc: true,
    },
    {
      label: 'Per‑home pricing / avoid GC markup',
      tips: {
        buildwise: 'Simple per‑home pricing; avoid % GC markup on trades.',
        ubuildit: 'Owner‑builder model can avoid GC fee.',
        checklists: 'Low software/content cost; no service layer.',
        pm: 'PM fee plus potential pass‑through markups.',
        gc: 'Highest overhead and markup for full service.',
      },
      buildwise: true, ubuildit: true, checklists: true, pm: false, gc: false,
    },
    {
      label: 'Smart parsing of drawings/bids/messages',
      tips: {
        buildwise: 'Parses PDFs and images to surface action items.',
        ubuildit: 'Not a software platform; relies on human review.',
        checklists: 'Static content; no file parsing.',
        pm: 'Varies by PM tooling; often generic task tools.',
        gc: 'Varies by builder; not consistently available.',
      },
      buildwise: true, ubuildit: false, checklists: false, pm: false, gc: false,
    },
    {
      label: 'Human support / onsite available',
      tips: {
        buildwise: 'Human help and optional site visits when you want them.',
        ubuildit: 'Advisor support and visits included in plan.',
        checklists: 'No service; content only.',
        pm: 'Manager site visits per contract.',
        gc: 'Builder on site as part of service.',
      },
      buildwise: true, ubuildit: true, checklists: false, pm: true, gc: true,
    },
  ]

  const YesNo = ({ ok, tip }) =>
    ok ? (
      <Tooltip title={tip} arrow>
        <span><CheckCircleOutlineIcon sx={{ color: 'success.main', verticalAlign: 'middle' }} /></span>
      </Tooltip>
    ) : (
      <Tooltip title={tip} arrow>
        <span><CloseRoundedIcon sx={{ color: 'error.main', verticalAlign: 'middle' }} /></span>
      </Tooltip>
    )

  return (
    <Box sx={{ my: 6 }}>
      <Container maxWidth="lg">
        <Typography id="compare" variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          How We Compare
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Hover a check/cross to see why.
        </Typography>
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Box sx={{ maxWidth: 960, mx: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 960, margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ ...th, minWidth: 160 }}></th>
              <th style={th}>Buildwise (You + Guided)</th>
              <th style={th}><a href="https://go.ubuildit.com/" target="_blank" rel="noreferrer">Owner‑Builder Consulting</a></th>
              <th style={th}><a href="https://builderbrigade.com/" target="_blank" rel="noreferrer">Static Checklists</a></th>
              <th style={th}>Project Mgmt Service</th>
              <th style={th}>Full‑Service Builder/GC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td style={cell}>{r.label}</td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <YesNo ok={r.buildwise} tip={r.tips.buildwise} />
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <YesNo ok={r.ubuildit} tip={r.tips.ubuildit} />
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <YesNo ok={r.checklists} tip={r.tips.checklists} />
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <YesNo ok={r.pm} tip={r.tips.pm} />
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <YesNo ok={r.gc} tip={r.tips.gc} />
                </td>
              </tr>
            ))}
          </tbody>
            </table>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}


