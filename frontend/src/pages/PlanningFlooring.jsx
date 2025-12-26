import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import RangeCostBar from '../components/analysis/RangeCostBar.jsx'

export default function PlanningFlooring() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // selections keyed by roomKey => { type, options, meta }
  const [selections, setSelections] = useState({})
  const [selectedKeys, setSelectedKeys] = useState({})
  const [search, setSearch] = useState('')
  const [bulkType, setBulkType] = useState('')
  const [bulkOptions, setBulkOptions] = useState({})
  const [roomOpen, setRoomOpen] = useState({})
  const [roomStep, setRoomStep] = useState({})
  const [budget, setBudget] = useState(0)

  // Baseline $/sqft estimates
  const COSTS = {
    carpet: 3.5,
    hardwood: 8.5,
    tile: 6.5,
  }

  useEffect(() => {
    async function load() {
      try {
        const h = await api.getHome(id)
        setHome(h)
        // hydrate selections from saved home.flooring if exists
        const floor = h?.flooring || null
        const b = Number(floor?.budget || 0)
        if (!isNaN(b)) setBudget(b)
        const savedArr = Array.isArray(floor?.selections) ? floor.selections : []
        const map = {}
        for (const it of savedArr) {
          const roomKey = it.roomKey || `${String(it.roomName || '').toLowerCase()}|${String(it.level || '').toLowerCase()}`
          map[roomKey] = {
            type: it.type || '',
            options: typeof it.options === 'object' && it.options ? it.options : {},
            meta: {
              roomName: it.roomName || '',
              level: it.level || '',
              areaSqFt: Number(it.areaSqFt || 0)
            }
          }
        }
        setSelections(map)
      } catch {}
    }
    load()
  }, [id])

  const allRooms = useMemo(() => {
    const docs = Array.isArray(home?.documents) ? home.documents : []
    const archDocs = docs.filter((d) => String(d.category || '').startsWith('architecture_'))
    const finalBase = archDocs.find((d) => d.category === 'architecture_base' && d.isFinal)
    const preferred = finalBase || archDocs.find((d) => d.isFinal) || archDocs[0]
    const list = Array.isArray(preferred?.analysis?.roomAnalysis) ? preferred.analysis.roomAnalysis : []
    return list.map((r) => ({
      roomName: r.name || 'Room',
      level: r.level || '',
      areaSqFt: Number(r.areaSqFt || 0)
    }))
  }, [home])
  const rooms = useMemo(() => {
    if (!(search || '').trim()) return allRooms
    const q = search.toLowerCase()
    return allRooms.filter((r) => (r.roomName || '').toLowerCase().includes(q) || (r.level || '').toLowerCase().includes(q))
  }, [allRooms, search])

  const areaTotals = useMemo(() => {
    const byKey = {}
    for (const r of allRooms) byKey[roomKeyOf(r)] = r
    const totals = { carpet: 0, hardwood: 0, tile: 0 }
    Object.entries(selections).forEach(([key, val]) => {
      const t = String(val?.type || '').toLowerCase()
      if (!['carpet','hardwood','tile'].includes(t)) return
      const area = Number(val?.meta?.areaSqFt ?? byKey[key]?.areaSqFt ?? 0)
      totals[t] += area
    })
    return { totals, totalSqFt: totals.carpet + totals.hardwood + totals.tile }
  }, [selections, allRooms])

  const costTotals = useMemo(() => {
    const costs = {
      carpet: areaTotals.totals.carpet * COSTS.carpet,
      hardwood: areaTotals.totals.hardwood * COSTS.hardwood,
      tile: areaTotals.totals.tile * COSTS.tile,
    }
    return { costs, totalCost: costs.carpet + costs.hardwood + costs.tile }
  }, [areaTotals, COSTS])

  const rangeCosts = useMemo(() => {
    const totalArea = allRooms.reduce((sum, r) => sum + Number(r.areaSqFt || 0), 0)
    const cheapest = totalArea * COSTS.carpet
    const costliest = totalArea * COSTS.hardwood
    return { totalArea, cheapest, costliest }
  }, [allRooms, COSTS])

  function roomKeyOf(r) {
    return `${String(r.roomName || '').toLowerCase()}|${String(r.level || '').toLowerCase()}`
  }

  function ensureSelection(r) {
    const key = roomKeyOf(r)
    if (!selections[key]) {
      setSelections((s) => ({
        ...s,
        [key]: {
          type: '',
          options: {},
          meta: { roomName: r.roomName, level: r.level, areaSqFt: r.areaSqFt }
        }
      }))
    }
  }

  function toggleSelectAll(checked) {
    if (!rooms.length) return
    const map = {}
    if (checked) {
      for (const r of rooms) {
        map[roomKeyOf(r)] = true
      }
    }
    setSelectedKeys(map)
  }

  function applyBulkToSelected() {
    if (!bulkType) return
    const keys = Object.entries(selectedKeys).filter(([k, v]) => !!v).map(([k]) => k)
    if (!keys.length) return
    setSelections((prev) => {
      const next = { ...prev }
      for (const r of rooms) {
        const key = roomKeyOf(r)
        if (!keys.includes(key)) continue
        next[key] = {
          type: bulkType,
          options: { ...(bulkOptions || {}) },
          meta: { roomName: r.roomName, level: r.level, areaSqFt: r.areaSqFt }
        }
      }
      return next
    })
    setSaved(false)
  }

  async function saveAll() {
    try {
      setSaving(true)
      setSaved(false)
      const arr = Object.entries(selections).map(([key, val]) => ({
        roomKey: key,
        roomName: val?.meta?.roomName || '',
        level: val?.meta?.level || '',
        areaSqFt: Number(val?.meta?.areaSqFt || 0),
        type: val?.type || '',
        options: val?.options || {}
      }))
      const payload = { flooring: { selections: arr, budget: Number(budget || 0), updatedAt: new Date().toISOString() } }
      const updated = await api.updateHome(id, payload)
      setHome(updated)
      setSaved(true)
    } catch {}
    finally {
      setSaving(false)
    }
  }

  const roomCost = (r, t) => {
    const type = String(t || '').toLowerCase()
    const area = Number(r.areaSqFt || 0)
    if (type === 'carpet') return area * COSTS.carpet
    if (type === 'tile') return area * COSTS.tile
    if (type === 'hardwood') return area * COSTS.hardwood
    return 0
  }

  const suggestions = useMemo(() => {
    // Recommend one-step cheaper category: hardwood -> tile, tile -> carpet
    const out = []
    const byKey = {}
    for (const r of allRooms) byKey[roomKeyOf(r)] = r
    for (const [key, val] of Object.entries(selections)) {
      const r = byKey[key]
      if (!r) continue
      const type = String(val?.type || '').toLowerCase()
      let cheaper = ''
      if (type === 'hardwood') cheaper = 'tile'
      else if (type === 'tile') cheaper = 'carpet'
      else cheaper = ''
      if (!cheaper) continue
      const current = roomCost(r, type)
      const alt = roomCost(r, cheaper)
      const save = Math.max(0, current - alt)
      if (save > 0) {
        out.push({
          roomKey: key,
          roomName: val?.meta?.roomName || r.roomName,
          level: val?.meta?.level || r.level,
          from: type,
          to: cheaper,
          savings: save,
        })
      }
    }
    out.sort((a, b) => b.savings - a.savings)
    return out
  }, [selections, allRooms])

  function applySuggestion(s) {
    setSelections((prev) => {
      const cur = prev[s.roomKey]
      const meta = cur?.meta || {}
      return { ...prev, [s.roomKey]: { type: s.to, options: {}, meta } }
    })
    setSaved(false)
  }

  function applyToReachBudget() {
    let remaining = costTotals.totalCost
    const target = Number(budget || 0)
    if (!(remaining > target)) return
    const copy = { ...selections }
    for (const s of suggestions) {
      if (remaining <= target) break
      const cur = copy[s.roomKey]
      if (!cur) continue
      copy[s.roomKey] = { type: s.to, options: {}, meta: cur.meta }
      remaining -= s.savings
    }
    setSelections(copy)
    setSaved(false)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Flooring"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Flooring' }
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {saved && <Typography variant="caption" color="success.main">Saved</Typography>}
            <Button variant="contained" onClick={saveAll} disabled={saving || !rooms.length}>
              {saving ? 'Saving…' : 'Save selections'}
            </Button>
          </Stack>
        }
      />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Summary</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">Carpet: {Math.round(areaTotals.totals.carpet).toLocaleString()} sq ft · {formatCurrency(costTotals.costs.carpet)}</Typography>
              <Typography variant="body2">Hardwood: {Math.round(areaTotals.totals.hardwood).toLocaleString()} sq ft · {formatCurrency(costTotals.costs.hardwood)}</Typography>
              <Typography variant="body2">Tile: {Math.round(areaTotals.totals.tile).toLocaleString()} sq ft · {formatCurrency(costTotals.costs.tile)}</Typography>
              <Divider />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total: {Math.round(areaTotals.totalSqFt).toLocaleString()} sq ft · {formatCurrency(costTotals.totalCost)}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  label="Budget (USD)"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value || 0))}
                />
                <Typography variant="body2" color={(Number(budget || 0) - costTotals.totalCost) >= 0 ? 'success.main' : 'error.main'}>
                  {Number(budget || 0) - costTotals.totalCost >= 0
                    ? `Under by ${formatCurrency(Number(budget || 0) - costTotals.totalCost)}`
                    : `Over by ${formatCurrency(costTotals.totalCost - Number(budget || 0))}`}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Optimize to budget</Typography>
            {!suggestions.length ? (
              <Typography variant="body2" color="text.secondary">No cost-saving suggestions available.</Typography>
            ) : (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!(costTotals.totalCost > Number(budget || 0))}
                    onClick={applyToReachBudget}
                  >
                    Apply suggestions to meet budget
                  </Button>
                </Stack>
                <Divider />
                <Stack spacing={0.5} sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {suggestions.slice(0, 8).map((s) => (
                    <Stack key={s.roomKey} direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">
                        {s.roomName}{s.level ? ` · ${s.level}` : ''}: {s.from} → {s.to} · save {formatCurrency(s.savings)}
                      </Typography>
                      <Button size="small" onClick={() => applySuggestion(s)}>Apply</Button>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            )}
          </Grid>
          <Grid item xs={12}>
            <RangeCostBar
              minLabel="All carpet"
              minValue={rangeCosts.cheapest}
              maxLabel="All hardwood"
              maxValue={rangeCosts.costliest}
              currentValue={costTotals.totalCost}
              budgetValue={Number(budget || 0)}
              width={720}
              height={96}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Bulk selection</Typography>
            <TextField
              size="small"
              placeholder="Search rooms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 260 }}
            />
          </Stack>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Type</Typography>
            <RadioGroup
              row
              value={bulkType}
              onChange={(e) => { setBulkType(e.target.value); setBulkOptions({}) }}
            >
              <FormControlLabel value="carpet" control={<Radio />} label="Carpet" />
              <FormControlLabel value="hardwood" control={<Radio />} label="Hardwood" />
              <FormControlLabel value="tile" control={<Radio />} label="Tile" />
            </RadioGroup>
          </Box>
          {bulkType === 'carpet' && (
            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Style</Typography>
                <Select size="small" fullWidth value={bulkOptions.style || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, style: e.target.value }))}>
                  {['Plush','Berber','Frieze'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Padding</Typography>
                <Select size="small" fullWidth value={bulkOptions.padding || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, padding: e.target.value }))}>
                  {['Standard 6lb','Premium 8lb'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
              <TextField size="small" label="Color" value={bulkOptions.color || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, color: e.target.value }))} />
            </Stack>
          )}
          {bulkType === 'hardwood' && (
            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Species</Typography>
                <Select size="small" fullWidth value={bulkOptions.species || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, species: e.target.value }))}>
                  {['Oak','Maple','Hickory'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Plank width</Typography>
                <Select size="small" fullWidth value={bulkOptions.plankWidth || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, plankWidth: e.target.value }))}>
                  {['2.25"','3"','5"'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish</Typography>
                <Select size="small" fullWidth value={bulkOptions.finish || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, finish: e.target.value }))}>
                  {['Matte','Satin','Gloss'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
            </Stack>
          )}
          {bulkType === 'tile' && (
            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Material</Typography>
                <Select size="small" fullWidth value={bulkOptions.material || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, material: e.target.value }))}>
                  {['Porcelain','Ceramic','Natural Stone'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Size</Typography>
                <Select size="small" fullWidth value={bulkOptions.size || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, size: e.target.value }))}>
                  {['12x24','24x24','6x36'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish</Typography>
                <Select size="small" fullWidth value={bulkOptions.finish || ''} onChange={(e) => setBulkOptions((o) => ({ ...o, finish: e.target.value }))}>
                  {['Matte','Polished'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </Box>
            </Stack>
          )}
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => toggleSelectAll(true)} disabled={!rooms.length}>Select all</Button>
            <Button size="small" onClick={() => toggleSelectAll(false)} disabled={!rooms.length}>Clear selection</Button>
            <Button size="small" variant="contained" onClick={applyBulkToSelected} disabled={!bulkType}>Apply to selected</Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Select flooring per room</Typography>
        {!rooms.length ? (
          <Typography variant="body2" color="text.secondary">
            No rooms found. Upload and analyze architecture plans first to detect rooms.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {rooms.map((r, idx) => {
              const key = roomKeyOf(r)
              const sel = selections[key] || { type: '', options: {}, meta: { roomName: r.roomName, level: r.level, areaSqFt: r.areaSqFt } }
              const type = sel.type || ''
              const isOpen = !!roomOpen[key]
              const step = Number(roomStep[key] || 0) || (type ? 2 : 1)
              const summary = (() => {
                if (!type) return 'No selection'
                const opt = sel.options || {}
                if (type === 'carpet') {
                  const parts = [opt.style, opt.padding, opt.color].filter(Boolean)
                  return `Carpet${parts.length ? ` · ${parts.join(', ')}` : ''}`
                }
                if (type === 'hardwood') {
                  const parts = [opt.species, opt.plankWidth, opt.finish].filter(Boolean)
                  return `Hardwood${parts.length ? ` · ${parts.join(', ')}` : ''}`
                }
                if (type === 'tile') {
                  const parts = [opt.material, opt.size, opt.finish].filter(Boolean)
                  return `Tile${parts.length ? ` · ${parts.join(', ')}` : ''}`
                }
                return String(type)
              })()
              return (
                <Grid item xs={12} md={6} key={`${key}-${idx}`}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {r.roomName} {r.level ? `· ${r.level}` : ''}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!selectedKeys[key]}
                              onChange={(e) => setSelectedKeys((m) => ({ ...m, [key]: e.target.checked }))}
                            />
                          }
                          label="Select"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Area: {Number(r.areaSqFt || 0).toLocaleString()} sq ft
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      {!isOpen ? (
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">{summary}</Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setRoomOpen((m) => ({ ...m, [key]: true }))
                              setRoomStep((m) => ({ ...m, [key]: type ? 2 : 1 }))
                              ensureSelection(r)
                            }}
                          >
                            Edit
                          </Button>
                        </Stack>
                      ) : (
                        <Stack spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            Step {step} of 2
                          </Typography>
                          {step === 1 && (
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Choose type</Typography>
                              <RadioGroup
                                row
                                value={type}
                                onChange={(e) => {
                                  const nextType = e.target.value
                                  setSelections((s) => ({
                                    ...s,
                                    [key]: {
                                      type: nextType,
                                      options: {},
                                      meta: { roomName: r.roomName, level: r.level, areaSqFt: r.areaSqFt }
                                    }
                                  }))
                                }}
                                onFocus={() => ensureSelection(r)}
                              >
                                <FormControlLabel value="carpet" control={<Radio />} label="Carpet" />
                                <FormControlLabel value="hardwood" control={<Radio />} label="Hardwood" />
                                <FormControlLabel value="tile" control={<Radio />} label="Tile" />
                              </RadioGroup>
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button size="small" onClick={() => setRoomOpen((m) => ({ ...m, [key]: false }))}>Cancel</Button>
                                <Button size="small" variant="contained" disabled={!type} onClick={() => setRoomStep((m) => ({ ...m, [key]: 2 }))}>Next</Button>
                              </Stack>
                            </Box>
                          )}
                          {step === 2 && (
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Configure options</Typography>
                              {type === 'carpet' && (
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Style</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.style || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, style: e.target.value } } }))}
                                    >
                                      {['Plush','Berber','Frieze'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Padding</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.padding || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, padding: e.target.value } } }))}
                                    >
                                      {['Standard 6lb','Premium 8lb'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                  <TextField
                                    size="small"
                                    label="Color"
                                    value={sel.options.color || ''}
                                    onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, color: e.target.value } } }))}
                                  />
                                </Stack>
                              )}
                              {type === 'hardwood' && (
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Species</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.species || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, species: e.target.value } } }))}
                                    >
                                      {['Oak','Maple','Hickory'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Plank width</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.plankWidth || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, plankWidth: e.target.value } } }))}
                                    >
                                      {['2.25"','3"','5"'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.finish || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, finish: e.target.value } } }))}
                                    >
                                      {['Matte','Satin','Gloss'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                </Stack>
                              )}
                              {type === 'tile' && (
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Material</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.material || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, material: e.target.value } } }))}
                                    >
                                      {['Porcelain','Ceramic','Natural Stone'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Size</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.size || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, size: e.target.value } } }))}
                                    >
                                      {['12x24','24x24','6x36'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish</Typography>
                                    <Select
                                      size="small"
                                      fullWidth
                                      value={sel.options.finish || ''}
                                      onChange={(e) => setSelections((s) => ({ ...s, [key]: { ...sel, options: { ...sel.options, finish: e.target.value } } }))}
                                    >
                                      {['Matte','Polished'].map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                                    </Select>
                                  </Box>
                                </Stack>
                              )}
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button size="small" onClick={() => setRoomStep((m) => ({ ...m, [key]: 1 }))}>Back</Button>
                                <Button size="small" variant="contained" onClick={() => setRoomOpen((m) => ({ ...m, [key]: false }))}>Done</Button>
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Paper>
      {/* Chat moved to global right-side panel */}
    </Stack>
  )
}

function formatCurrency(n) {
  const v = Number(n || 0)
  return `$${Math.round(v).toLocaleString()}`
}


