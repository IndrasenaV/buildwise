import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'

export default function HomeBudget() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.getHome(id)
      .then((h) => { if (mounted) setHome(h) })
      .catch((e) => { if (mounted) setError(e.message) })
    return () => { mounted = false }
  }, [id])

  const trades = home?.trades || []

  const summary = useMemo(() => {
    const totalBudget = trades.reduce((s, t) => s + (Number(t.totalPrice) || 0), 0)
    const totalPaid = trades.reduce((s, t) => s + (t.invoices || []).filter(i => i.paid).reduce((x, i) => x + (Number(i.amount) || 0), 0), 0)
    const totalInvoiced = trades.reduce((s, t) => s + (t.invoices || []).reduce((x, i) => x + (Number(i.amount) || 0), 0), 0)
    const totalExtras = trades.reduce((s, t) => s + (t.additionalCosts || []).reduce((x, c) => x + (Number(c.amount) || 0), 0), 0)
    const totalOutstanding = Math.max(totalBudget - totalPaid, 0)
    const totalVariance = (totalInvoiced + totalExtras) - totalBudget
    return { totalBudget, totalPaid, totalInvoiced, totalExtras, totalOutstanding, totalVariance }
  }, [trades])

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

  if (!home) {
    return <Typography variant="body2">Loading… {error && <Box component="span" sx={{ color: 'error.main' }}>{error}</Box>}</Typography>
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Budget Overview</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Budget</Typography>
            <Typography variant="h6">{fmt(summary.totalBudget)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Paid</Typography>
            <Typography variant="h6">{fmt(summary.totalPaid)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Outstanding</Typography>
            <Typography variant="h6">{fmt(summary.totalOutstanding)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Invoiced (All)</Typography>
            <Typography variant="h6">{fmt(summary.totalInvoiced)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Additional Costs</Typography>
            <Typography variant="h6">{fmt(summary.totalExtras)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Variance</Typography>
            <Typography variant="h6" sx={{ color: summary.totalVariance > 0 ? 'error.main' : 'success.main' }}>
              {fmt(summary.totalVariance)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>By Trade</Typography>
        <List dense disablePadding>
          {trades.map((t, idx) => {
            const budget = Number(t.totalPrice) || 0
            const invoiced = (t.invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
            const paid = (t.invoices || []).filter(i => i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0)
            const extras = (t.additionalCosts || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
            const variance = (invoiced + extras) - budget
            const overrun = variance > 0
            return (
              <div key={t._id}>
                <ListItem
                  secondaryAction={
                    overrun ? <Chip color="error" size="small" label={`Overrun ${fmt(variance)}`} /> : <Chip color="success" size="small" label="On Budget" />
                  }
                >
                  <ListItemText
                    primary={t.name}
                    secondary={
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <span>Budget: {fmt(budget)}</span>
                        <span>Invoiced: {fmt(invoiced)}</span>
                        <span>Paid: {fmt(paid)}</span>
                        <span>Extras: {fmt(extras)}</span>
                        <span>Variance: {fmt(variance)}</span>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < trades.length - 1 && <Divider component="li" />}
              </div>
            )
          })}
          {!trades.length && <Typography variant="body2" color="text.secondary">No trades</Typography>}
        </List>
      </Paper>
    </Stack>
  )
}


