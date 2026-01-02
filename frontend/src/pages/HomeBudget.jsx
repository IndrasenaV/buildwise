import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import * as d3 from 'd3'

function TradesPie({ trades, size = 260 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    while (el.firstChild) el.removeChild(el.firstChild)
    const data = (trades || [])
      .map((t) => ({ name: t.name, value: Math.max(0, Number(t.totalPrice) || 0) }))
      .filter((d) => d.value > 0)
    if (!data.length) {
      const div = document.createElement('div')
      div.style.textAlign = 'center'
      div.style.color = '#607d8b'
      div.style.fontSize = '12px'
      div.textContent = 'No trade budgets'
      el.appendChild(div)
      return
    }
    const tooltip = d3.select(el)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.75)')
      .style('color', '#fff')
      .style('padding', '4px 8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('display', 'none')
      .style('z-index', '10')
    const fmt = (n) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`)
    const radius = (size / 2) - 6
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius)
    const pie = d3.pie().sort(null).value((d) => d.value)
    const arcs = pie(data)
    const palette = d3.schemeTableau10
    const color = (i) => palette[i % palette.length]
    svg
      .selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (_d, i) => color(i))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mousemove', (event, d) => {
        const [x, y] = d3.pointer(event, el)
        tooltip
          .style('left', `${x + 12}px`)
          .style('top', `${y + 12}px`)
          .style('display', 'block')
          .text(`${d.data.name}: ${fmt(d.data.value)}`)
      })
      .on('mouseleave', () => {
        tooltip.style('display', 'none')
      })
    const total = data.reduce((s, d) => s + d.value, 0)
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '20px')
      .style('font-weight', 600)
      .text(total.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }))
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '12px')
      .style('fill', '#607d8b')
      .text('Total Budget')
  }, [trades, size])
  return <div ref={ref} style={{ position: 'relative' }} />
}

export default function HomeBudget() {
  const { id } = useParams()
  const navigate = useNavigate()
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
  const allDocs = Array.isArray(home?.documents) ? home.documents : []

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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, alignItems: 'center', gap: 2 }}>
          <Box sx={{ justifySelf: 'center' }}>
            <TradesPie trades={trades} size={260} />
          </Box>
          <Box>
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
            const plannedMin = (t.plannedCostRange && typeof t.plannedCostRange.min === 'number') ? t.plannedCostRange.min : null
            const plannedMax = (t.plannedCostRange && typeof t.plannedCostRange.max === 'number') ? t.plannedCostRange.max : null
            const tradeDocs = allDocs.filter((d) => d?.pinnedTo?.type === 'trade' && d?.pinnedTo?.id === t._id)
            const bidCount = tradeDocs.filter((d) => String(d?.category || '').toLowerCase() === 'bid').length
            const contractCount = tradeDocs.filter((d) => String(d?.category || '').toLowerCase() === 'contract').length
            const hasContract = !!t.contractSignedAt || contractCount > 0
            return (
              <div key={t._id}>
                <ListItem
                  onClick={() => navigate(`/homes/${id}/trades/${t._id}/budget`)}
                  sx={{ cursor: 'pointer' }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip variant="outlined" size="small" label={`Bids ${bidCount}`} />
                      <Chip variant="outlined" size="small" color={hasContract ? 'success' : 'default'} label={hasContract ? 'Contract' : 'No Contract'} />
                      {overrun ? <Chip color="error" size="small" label={`Overrun ${fmt(variance)}`} /> : <Chip color="success" size="small" label="On Budget" />}
                    </Box>
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
                        {(plannedMin !== null || plannedMax !== null) && (
                          <span>Planned: {plannedMin !== null ? fmt(plannedMin) : '—'} – {plannedMax !== null ? fmt(plannedMax) : '—'}</span>
                        )}
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


