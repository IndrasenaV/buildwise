import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import SmartToyIcon from '@mui/icons-material/SmartToy'

export default function PlanningHVAC() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [notes, setNotes] = useState('')
  const [systemType, setSystemType] = useState('heat_pump') // heat_pump | gas_furnace_ac | mini_split
  const [brand, setBrand] = useState('')
  const [zones, setZones] = useState(1)
  const [climate, setClimate] = useState('mixed') // hot_humid | mixed | cool
  const [efficiency, setEfficiency] = useState('standard') // standard | high | premium
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getHome(id).then((h) => {
      setHome(h)
      const saved = h?.planning?.hvac?.notes || ''
      setNotes(String(saved))
    }).catch(() => {})
  }, [id])

  const hasFinalArchitecture = useMemo(() => {
    const docs = Array.isArray(home?.documents) ? home.documents : []
    const archDocs = docs.filter((d) => String(d?.category || '').startsWith('architecture_'))
    return !!archDocs.find((d) => d?.isFinal)
  }, [home])

  const preferredDoc = useMemo(() => {
    const docs = Array.isArray(home?.documents) ? home.documents : []
    const archDocs = docs.filter((d) => String(d?.category || '').startsWith('architecture_'))
    const finalBase = archDocs.find((d) => d.category === 'architecture_base' && d.isFinal)
    return finalBase || archDocs.find((d) => d.isFinal) || archDocs[0] || null
  }, [home])

  const rooms = useMemo(() => {
    const list = Array.isArray(preferredDoc?.analysis?.roomAnalysis) ? preferredDoc.analysis.roomAnalysis : []
    return list.map((r) => ({
      name: r.name || 'Room',
      level: (r.level === null || r.level === undefined) ? '' : String(r.level),
      areaSqFt: Number(r.areaSqFt || 0),
      windows: Number(r.windows || 0),
    }))
  }, [preferredDoc])

  const totalSqFt = useMemo(() => rooms.reduce((s, r) => s + (Number(r.areaSqFt || 0)), 0), [rooms])
  const levels = useMemo(() => {
    const set = new Set()
    for (const r of rooms) {
      const lv = (r.level || '').toString().trim() || 'main'
      set.add(lv.toLowerCase())
    }
    return Array.from(set)
  }, [rooms])

  const brandOptions = [
    'Trane', 'American Standard', 'Carrier', 'Bryant', 'Lennox', 'Goodman', 'Amana',
    'Rheem', 'Ruud', 'York',
    'Daikin', 'Mitsubishi', 'Fujitsu', 'LG'
  ]

  const zoneSuggestion = useMemo(() => {
    const floors = levels.length
    const sq = totalSqFt
    // Base recommendation
    if (floors >= 2) {
      // Up/Down zoning
      if (sq > 3500) return 3
      return 2
    }
    if (sq > 3000) return 2
    return 1
  }, [levels, totalSqFt])

  const specialZoneHints = useMemo(() => {
    const hints = []
    const nameHas = (sub) => rooms.some(r => String(r.name || '').toLowerCase().includes(sub))
    if (nameHas('primary') || nameHas('master')) {
      hints.push('Consider a dedicated zone for the primary suite for comfort.')
    }
    if (nameHas('media') || nameHas('theater')) {
      hints.push('Media/theater rooms benefit from their own zone due to intermittent loads.')
    }
    if (nameHas('office')) {
      hints.push('Home office may merit separate zoning for quiet and schedule control.')
    }
    const manyWindowRooms = rooms.filter(r => (r.windows || 0) >= 3).map(r => r.name).slice(0, 5)
    if (manyWindowRooms.length) {
      hints.push(`Rooms with many windows (${manyWindowRooms.join(', ')}) may need larger supplies or closer zoning.`)
    }
    return hints
  }, [rooms])

  useEffect(() => {
    setZones(zoneSuggestion)
  }, [zoneSuggestion])

  const sqftPerTon = useMemo(() => {
    if (climate === 'hot_humid') return 500
    if (climate === 'cool') return 700
    return 600 // mixed/default
  }, [climate])

  const estTons = useMemo(() => {
    if (!totalSqFt) return 0
    const raw = totalSqFt / sqftPerTon
    // round up to nearest 0.5 ton
    return Math.ceil(raw * 2) / 2
  }, [totalSqFt, sqftPerTon])

  const efficiencyMultiplier = useMemo(() => {
    if (efficiency === 'high') return 1.1
    if (efficiency === 'premium') return 1.25
    return 1.0
  }, [efficiency])

  function estimateCost() {
    let min = 0
    let max = 0
    if (systemType === 'mini_split') {
      // cost per head/zone
      const perZoneMin = 3000
      const perZoneMax = 5500
      min = zones * perZoneMin
      max = zones * perZoneMax
    } else if (systemType === 'heat_pump') {
      // base covers ~2.5–3.5 ton system
      const baseMin = 9000
      const baseMax = 14000
      const zoningExtraMin = 1400
      const zoningExtraMax = 2600
      const extraZones = Math.max(0, Number(zones || 1) - 1)
      min = baseMin + (extraZones * zoningExtraMin)
      max = baseMax + (extraZones * zoningExtraMax)
    } else {
      // gas furnace + AC
      const baseMin = 8000
      const baseMax = 13000
      const zoningExtraMin = 1200
      const zoningExtraMax = 2400
      const extraZones = Math.max(0, Number(zones || 1) - 1)
      min = baseMin + (extraZones * zoningExtraMin)
      max = baseMax + (extraZones * zoningExtraMax)
    }
    min = Math.round(min * efficiencyMultiplier)
    max = Math.round(max * efficiencyMultiplier)
    return { min, max }
  }
  const estCost = estimateCost()

  async function saveNotes() {
    try {
      setSaving(true)
      // Placeholder local save; structure can be persisted later with a dedicated API
      // eslint-disable-next-line no-console
      console.log('HVAC plan (local only):', {
        systemType, brand, zones, climate, efficiency, estTons, estCost, notes
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="HVAC Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'HVAC' }
        ]}
        actions={
          <Button variant="contained" onClick={saveNotes} disabled={saving}>
            {saving ? 'Saving…' : 'Save notes'}
          </Button>
        }
      />
      {!hasFinalArchitecture && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Upload and mark a final architecture plan first to enable detailed planning. You can still draft notes below.
          </Typography>
        </Paper>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Detected rooms and areas</Typography>
            <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {rooms.length ? rooms.map((r, idx) => (
                <Typography key={idx} variant="body2">
                  {r.name}{r.level ? ` · ${r.level}` : ''}{r.areaSqFt ? ` · ${Math.round(r.areaSqFt)} sq ft` : ''}{r.windows ? ` · ${r.windows} windows` : ''}
                </Typography>
              )) : (
                <Typography variant="body2" color="text.secondary">No rooms detected. Upload and analyze plans to populate room list.</Typography>
              )}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Total area: {Math.round(totalSqFt).toLocaleString()} sq ft</Typography>
            <Typography variant="body2">Levels detected: {levels.length || 1}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>System selection</Typography>
              <Tooltip title="Compare systems with AI">
                <IconButton
                  size="small"
                  aria-label="Compare systems"
                  onClick={() => {
                    const msg = [
                      `Compare HVAC system options for a home ~${Math.round(totalSqFt).toLocaleString()} sq ft across ${levels.length || 1} level(s).`,
                      `Climate: ${climate.replace('_', ' ')}. Planned zones: ${zones}. Estimated capacity: ${estTons ? `${estTons.toFixed(1)} tons` : 'n/a'}.`,
                      `Compare Heat pump vs Gas furnace + AC vs Mini-splits.`,
                      `Cover: install cost ranges, operating costs/efficiency, comfort (zoning), noise, IAQ/ventilation fit, maintenance, and common pitfalls.`,
                      `Recommend which is best for this context and list what to confirm next (load calc, duct routes, returns, thermostat placement).`
                    ].join(' ')
                    window.dispatchEvent(new CustomEvent('agentchat:prompt', { detail: { message: msg, agentId: 'hvac', promptKey: 'assistant.hvac' } }))
                  }}
                >
                  <SmartToyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <RadioGroup
              value={systemType}
              onChange={(e) => setSystemType(e.target.value)}
            >
              <FormControlLabel value="heat_pump" control={<Radio />} label="Heat pump (all-electric; high-efficiency heating/cooling)" />
              <FormControlLabel value="gas_furnace_ac" control={<Radio />} label="Gas furnace + AC (traditional split system)" />
              <FormControlLabel value="mini_split" control={<Radio />} label="Mini-splits (ducted/ductless; flexible zoning)" />
            </RadioGroup>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Tip: Heat pumps excel in most climates; gas furnaces can suit colder regions or if gas is already planned.
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: .5 }}>Preferred brand</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Select size="small" fullWidth value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <MenuItem value=""><em>No preference</em></MenuItem>
                  {brandOptions.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </Box>
              <Tooltip title="Ask AI about this brand">
                <IconButton
                  size="small"
                  aria-label="Ask AI"
                  onClick={() => {
                    const b = brand || 'top HVAC brands';
                    const msg = [
                      `We are planning HVAC for a home ~${Math.round(totalSqFt).toLocaleString()} sq ft across ${levels.length || 1} level(s).`,
                      `Climate: ${climate.replace('_', ' ')}. Current zones planned: ${zones}. System type preference: ${systemType}.`,
                      `Please compare ${b} to typical alternatives on reliability, warranty support, noise, dealer network quality, and value.`,
                      `Recommend efficiency tiers appropriate for this case; avoid specific model SKUs unless necessary.`,
                      `Also note any installation considerations or pitfalls that impact long-term performance.`
                    ].join(' ')
                    window.dispatchEvent(new CustomEvent('agentchat:prompt', { detail: { message: msg, agentId: 'hvac', promptKey: 'assistant.hvac' } }))
                  }}
                >
                  <SmartToyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .5 }}>
              Brands vary by local dealer quality. Prioritize installer reputation and warranty support.
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: .5 }}>Zones</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="number"
                label="Zones"
                value={zones}
                onChange={(e) => setZones(Math.max(1, Number(e.target.value || 1)))}
                sx={{ width: 120 }}
              />
              <Typography variant="body2" color="text.secondary">Suggested: {zoneSuggestion}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: .5 }}>Climate & sizing</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={climate} onChange={(e) => setClimate(e.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="hot_humid">Hot/Humid (≈ 500 sqft/ton)</MenuItem>
                <MenuItem value="mixed">Mixed (≈ 600 sqft/ton)</MenuItem>
                <MenuItem value="cool">Cool/Mild (≈ 700 sqft/ton)</MenuItem>
              </Select>
              <Select size="small" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="standard">Efficiency: Standard</MenuItem>
                <MenuItem value="high">Efficiency: High (+10%)</MenuItem>
                <MenuItem value="premium">Efficiency: Premium (+25%)</MenuItem>
              </Select>
            </Stack>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Estimated capacity: {estTons ? `${estTons.toFixed(1)} tons` : '—'} ({Math.round(totalSqFt).toLocaleString()} sqft ÷ {sqftPerTon} sqft/ton)
              </Typography>
              <Typography variant="body2">
                Estimated installed cost: ${estCost.min.toLocaleString()} – ${estCost.max.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rough budget guidance only. Actual sizing requires load calculations (Manual J/S/D) and site specifics.
              </Typography>
            </Stack>
            {!!specialZoneHints.length && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .5 }}>Hints</Typography>
                <Stack spacing={0.5}>
                  {specialZoneHints.map((h, i) => (
                    <Typography key={i} variant="body2">• {h}</Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Notes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Capture ventilation (ERV/HRV), fresh air intake, return locations, thermostat placement, and any comfort priorities.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (e.g., 2 zones up/down, ERV with MERV 13 filtration, returns per bedroom hallway, thermostat locations)..."
        />
      </Paper>
    </Stack>
  )
}


