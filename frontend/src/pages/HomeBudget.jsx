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
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import * as d3 from 'd3'

function BudgetPie({ categories, size = 260 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    while (el.firstChild) el.removeChild(el.firstChild)
    const data = (categories || [])
      .map((c) => ({ name: c.name, value: Math.max(0, Number(c.estimated) || 0) }))
      .filter((d) => d.value > 0)
    if (!data.length) {
      const div = document.createElement('div')
      div.style.textAlign = 'center'
      div.style.color = '#607d8b'
      div.style.fontSize = '12px'
      div.textContent = 'No budget data'
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
  }, [categories, size])
  return <div ref={ref} style={{ position: 'relative' }} />
}

export default function HomeBudget() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({ category: 'other', label: '', estimated: 0, actual: 0 })

  const fetchHome = () => {
    setLoading(true)
    api.getHome(id)
      .then((h) => setHome(h))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHome() }, [id])

  const handleRecalculate = async () => {
    setLoading(true)
    try {
      await api.recalculateBudget(id)
      fetchHome()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!newEntry.label) return
    try {
      await api.addBudgetManualEntry(id, newEntry)
      setAddOpen(false)
      setNewEntry({ category: 'other', label: '', estimated: 0, actual: 0 })
      fetchHome()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRemoveEntry = async (entryId) => {
    try {
      await api.removeBudgetManualEntry(id, entryId)
      fetchHome()
    } catch (e) {
      setError(e.message)
    }
  }

  const trades = home?.trades || []
  const budget = home?.budget || {}
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

  // Build category data for pie chart from new budget structure
  const pieCategories = useMemo(() => {
    const cats = []
    // Exterior materials
    const ext = budget.exteriorMaterials || {}
    for (const [key, cat] of Object.entries(ext)) {
      if (cat && cat.estimated) {
        cats.push({ name: `Exterior: ${key.charAt(0).toUpperCase() + key.slice(1)}`, estimated: cat.estimated })
      }
    }
    // Other categories
    for (const key of ['flooring', 'appliances', 'cabinets', 'windowsDoors', 'trades']) {
      if (budget[key] && budget[key].estimated) {
        cats.push({ name: key.charAt(0).toUpperCase() + key.slice(1), estimated: budget[key].estimated })
      }
    }
    // Contingency
    if (budget.contingency && budget.contingency.amount) {
      cats.push({ name: 'Contingency', estimated: budget.contingency.amount })
    }
    // Manual entries
    for (const entry of (budget.manualEntries || [])) {
      cats.push({ name: entry.label, estimated: entry.estimated || 0 })
    }
    return cats
  }, [budget])

  const summary = budget.summary || {}
  const hasBudgetData = pieCategories.length > 0 || (summary.totalEstimated || 0) > 0

  if (!home) {
    return <Typography variant="body2">Loading… {error && <Box component="span" sx={{ color: 'error.main' }}>{error}</Box>}</Typography>
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRecalculate}
          disabled={loading}
        >
          Recalculate Budget
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add Entry
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Budget Overview</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, alignItems: 'center', gap: 2 }}>
          <Box sx={{ justifySelf: 'center' }}>
            <BudgetPie categories={pieCategories} size={260} />
          </Box>
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Estimated</Typography>
                <Typography variant="h6">{fmt(summary.totalEstimated)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Actual</Typography>
                <Typography variant="h6">{fmt(summary.totalActual)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Variance</Typography>
                <Typography variant="h6" sx={{ color: (summary.variance || 0) > 0 ? 'error.main' : 'success.main' }}>
                  {fmt(summary.variance)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Contingency ({budget.contingency?.percent || 10}%)</Typography>
                <Typography variant="h6">{fmt(budget.contingency?.amount)}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Exterior Materials Breakdown */}
      {budget.exteriorMaterials && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Exterior Materials</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {['roofing', 'cladding', 'windows', 'doors'].map((key) => {
              const cat = budget.exteriorMaterials[key] || {}
              return (
                <Box key={key} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
                  <Typography variant="h6">{fmt(cat.estimated)}</Typography>
                  {cat.notes && <Typography variant="caption" color="text.secondary">{cat.notes}</Typography>}
                </Box>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* Trades Section */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>By Trade</Typography>
        <List dense disablePadding>
          {trades.map((t, idx) => {
            const tradeBudget = Number(t.totalPrice) || 0
            const invoiced = (t.invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
            const paid = (t.invoices || []).filter(i => i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0)
            const extras = (t.additionalCosts || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
            const variance = (invoiced + extras) - tradeBudget
            const overrun = variance > 0
            return (
              <div key={t._id}>
                <ListItem
                  onClick={() => navigate(`/homes/${id}/trades/${t._id}/budget`)}
                  sx={{ cursor: 'pointer' }}
                  secondaryAction={
                    overrun
                      ? <Chip color="error" size="small" label={`Overrun ${fmt(variance)}`} />
                      : <Chip color="success" size="small" label="On Budget" />
                  }
                >
                  <ListItemText
                    primary={t.name}
                    secondary={
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <span>Budget: {fmt(tradeBudget)}</span>
                        <span>Invoiced: {fmt(invoiced)}</span>
                        <span>Paid: {fmt(paid)}</span>
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

      {/* Manual Entries */}
      {(budget.manualEntries || []).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Manual Entries</Typography>
          <List dense disablePadding>
            {(budget.manualEntries || []).map((entry, idx) => (
              <div key={entry._id}>
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleRemoveEntry(entry._id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={entry.label}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <span>Category: {entry.category}</span>
                        <span>Estimated: {fmt(entry.estimated)}</span>
                        <span>Actual: {fmt(entry.actual)}</span>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < (budget.manualEntries || []).length - 1 && <Divider component="li" />}
              </div>
            ))}
          </List>
        </Paper>
      )}

      {/* Add Manual Entry Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Budget Entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Category"
              value={newEntry.category}
              onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
              fullWidth
            />
            <TextField
              label="Label"
              value={newEntry.label}
              onChange={(e) => setNewEntry({ ...newEntry, label: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Estimated Amount"
              type="number"
              value={newEntry.estimated}
              onChange={(e) => setNewEntry({ ...newEntry, estimated: Number(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Actual Amount"
              type="number"
              value={newEntry.actual}
              onChange={(e) => setNewEntry({ ...newEntry, actual: Number(e.target.value) || 0 })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddEntry} variant="contained" disabled={!newEntry.label}>Add</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
