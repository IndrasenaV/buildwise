import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import SmartToyIcon from '@mui/icons-material/SmartToy'

export default function PlanningPlumbing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [notes, setNotes] = useState('')
  const [waterHeaterType, setWaterHeaterType] = useState('tank') // tank | tankless
  const [waterHeaterCount, setWaterHeaterCount] = useState(1)
  const [faucetBrand, setFaucetBrand] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getHome(id).then((h) => {
      setHome(h)
      const saved = h?.planning?.plumbing?.notes || ''
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
    }))
  }, [preferredDoc])

  const totalSqFt = useMemo(() => Number(preferredDoc?.analysis?.projectInfo?.totalSqFt || preferredDoc?.analysis?.totalSqFt || 0), [preferredDoc])
  const levels = useMemo(() => {
    const set = new Set()
    for (const r of rooms) {
      const lv = (r.level || '').toString().trim() || 'main'
      set.add(lv.toLowerCase())
    }
    return Array.from(set)
  }, [rooms])

  function isHalfBathName(n) {
    const s = String(n || '').toLowerCase()
    return s.includes('powder') || s.includes('half')
  }
  function isBathName(n) {
    const s = String(n || '').toLowerCase()
    return s.includes('bath') || s.includes('ensuite') || s.includes('restroom') || isHalfBathName(n)
  }
  const bathCount = useMemo(() => rooms.filter(r => isBathName(r.name)).length, [rooms])
  const halfBathCount = useMemo(() => rooms.filter(r => isHalfBathName(r.name)).length, [rooms])
  const fullBathCount = Math.max(0, bathCount - halfBathCount)

  const recommendedWHCount = useMemo(() => {
    if (fullBathCount >= 4) return 2
    if ((levels.length >= 2 && fullBathCount >= 3)) return 2
    if (totalSqFt > 3200) return 2
    return 1
  }, [fullBathCount, levels.length, totalSqFt])
  const recommendedWHType = useMemo(() => {
    if (fullBathCount >= 4 || totalSqFt > 3200) return 'tankless'
    return 'tank'
  }, [fullBathCount, totalSqFt])
  useEffect(() => {
    setWaterHeaterCount(recommendedWHCount)
    setWaterHeaterType(recommendedWHType)
  }, [recommendedWHCount, recommendedWHType])

  const faucetBrands = [
    { id: 'delta', label: 'Delta', tier: '$$' },
    { id: 'moen', label: 'Moen', tier: '$$' },
    { id: 'kohler', label: 'Kohler', tier: '$$–$$$' },
    { id: 'american_standard', label: 'American Standard', tier: '$$' },
    { id: 'pfister', label: 'Pfister', tier: '$' },
    { id: 'grohe', label: 'Grohe', tier: '$$$' },
    { id: 'hansgrohe', label: 'Hansgrohe', tier: '$$$' },
    { id: 'brizo', label: 'Brizo', tier: '$$$$' },
  ]

  async function saveNotes() {
    try {
      setSaving(true)
      // Planning is not updatable via updateHome schema; keep local for now
      // eslint-disable-next-line no-console
      console.log('Plumbing notes (local only):', notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Plumbing Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Plumbing' }
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Detected rooms and bathrooms</Typography>
            <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {rooms.length ? rooms.filter(r => isBathName(r.name)).map((r, idx) => (
                <Typography key={idx} variant="body2">
                  {r.name}{r.level ? ` · ${r.level}` : ''}
                </Typography>
              )) : (
                <Typography variant="body2" color="text.secondary">No bathrooms detected. Upload and analyze plans to populate room list.</Typography>
              )}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Full baths: {fullBathCount}</Typography>
            <Typography variant="body2">Half baths: {halfBathCount}</Typography>
            <Typography variant="body2">Levels detected: {levels.length || 1}</Typography>
            <Typography variant="body2">Approx. total area: {Math.round(totalSqFt || 0).toLocaleString()} sq ft</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Water heaters</Typography>
              <Tooltip title="Ask AI about water heater configuration">
                <IconButton
                  size="small"
                  aria-label="Ask AI"
                  onClick={() => {
                    const msg = [
                      `We have ~${Math.round(totalSqFt || 0).toLocaleString()} sq ft across ${levels.length || 1} level(s),`,
                      `${fullBathCount} full bath(s) and ${halfBathCount} half bath(s).`,
                      `Recommend number of water heaters and type (tank vs tankless), with pros/cons, install cost ranges,`,
                      `and considerations like recirculation loops and simultaneous hot water demand.`
                    ].join(' ')
                    window.dispatchEvent(new CustomEvent('agentchat:prompt', { detail: { message: msg, agentId: 'plumbing', promptKey: 'assistant.plumbing' } }))
                  }}
                >
                  <SmartToyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .5 }}>
              Suggested: {recommendedWHCount} × {recommendedWHType === 'tankless' ? 'tankless' : 'tank'} (auto-estimated from baths/levels/sqft)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
              <Select size="small" value={waterHeaterType} onChange={(e) => setWaterHeaterType(e.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="tank">Tank (e.g., 50–75 gal)</MenuItem>
                <MenuItem value="tankless">Tankless (on-demand)</MenuItem>
              </Select>
              <TextField
                size="small"
                type="number"
                label="Count"
                value={waterHeaterCount}
                onChange={(e) => setWaterHeaterCount(Math.max(1, Number(e.target.value || 1)))}
                sx={{ width: 120 }}
              />
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Faucet brand</Typography>
              <Tooltip title="Ask AI to compare faucet brands">
                <IconButton
                  size="small"
                  aria-label="Compare faucet brands"
                  onClick={() => {
                    const sel = faucetBrand || 'typical faucet brands'
                    const msg = [
                      `Compare ${sel} with common alternatives (Delta, Moen, Kohler, Grohe, Hansgrohe, Brizo, American Standard, Pfister).`,
                      `Focus on relative cost, availability of parts, warranty/support quality, finish durability, and value at builder grade vs premium.`,
                      `Provide pros/cons and any installation notes (valve compatibility, lead times).`
                    ].join(' ')
                    window.dispatchEvent(new CustomEvent('agentchat:prompt', { detail: { message: msg, agentId: 'plumbing', promptKey: 'assistant.plumbing' } }))
                  }}
                >
                  <SmartToyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={faucetBrand} onChange={(e) => setFaucetBrand(e.target.value)} sx={{ minWidth: 220 }}>
                <MenuItem value=""><em>No preference</em></MenuItem>
                {faucetBrands.map((b) => (
                  <MenuItem key={b.id} value={b.label}>{b.label} · {b.tier}</MenuItem>
                ))}
              </Select>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .5 }}>
              Tiers are relative: $ (budget), $$ (mid), $$$ (premium), $$$$ (luxury). Actual pricing varies by series and finish.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Fixtures and rough-ins</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Capture fixture counts by room, wet-wall locations, main supply/return, and gas lines. Add any special requirements here.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (e.g., bath fixtures by room, kitchen sink and pot filler, laundry box, hose bibs, gas rough-ins)..."
        />
      </Paper>
    </Stack>
  )
}


