import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import RangeCostBar from '../components/analysis/RangeCostBar.jsx'

export default function PlanningCabinets() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [lfItems, setLfItems] = useState([])
  const [type, setType] = useState('custom') // custom | prebuilt
  const [finish, setFinish] = useState('painted') // painted | stained (custom only)
  const [material, setMaterial] = useState('plywood') // mdf | plywood | hardwood | melamine
  const [budget, setBudget] = useState(0)

  // $ per linear foot by configuration
  const COSTS = {
    prebuilt: {
      melamine: 140,
      plywood: 220,
    },
    custom: {
      mdf: 280,
      plywood: 360,
      hardwood: 480,
    },
    finishAdj: {
      painted: 40,
      stained: 25,
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const h = await api.getHome(id)
        setHome(h)
        const saved = h?.cabinets || null
        if (saved && Array.isArray(saved.lfItems)) {
          setLfItems(saved.lfItems)
          setType(saved.selection?.type || 'custom')
          setFinish(saved.selection?.finish || 'painted')
          setMaterial(saved.selection?.material || 'plywood')
          setBudget(Number(saved.budget || 0))
          return
        }
        // Assume LF by rooms from plan; seed defaults if kitchen/baths present
        const docs = Array.isArray(h?.documents) ? h.documents : []
        const archDocs = docs.filter((d) => String(d.category || '').startsWith('architecture_'))
        const finalBase = archDocs.find((d) => d.category === 'architecture_base' && d.isFinal)
        const preferred = finalBase || archDocs.find((d) => d.isFinal) || archDocs[0]
        const rooms = Array.isArray(preferred?.analysis?.roomAnalysis) ? preferred.analysis.roomAnalysis : []
        const items = []
        const hasKitchen = rooms.some((r) => (String(r.name || '').toLowerCase().includes('kitchen')))
        if (hasKitchen) items.push({ area: 'Kitchen Perimeter', linearFt: 30 })
        const hasIsland = rooms.some((r) => (String(r.name || '').toLowerCase().includes('island')))
        if (hasIsland || hasKitchen) items.push({ area: 'Kitchen Island', linearFt: 10 })
        const bathCount = rooms.filter((r) => (String(r.name || '').toLowerCase().includes('bath'))).length
        if (bathCount) items.push({ area: 'Bathrooms (total)', linearFt: Math.max(1, bathCount) * 8 })
        setLfItems(items.length ? items : [{ area: 'Kitchen Perimeter', linearFt: 30 }])
      } catch {}
    }
    load()
  }, [id])

  const unitRate = useMemo(() => {
    if (type === 'prebuilt') {
      return COSTS.prebuilt[material] || 0
    }
    const base = COSTS.custom[material] || 0
    const adj = COSTS.finishAdj[finish] || 0
    return base + (type === 'custom' ? adj : 0)
  }, [type, material, finish])

  const totalLf = useMemo(() => (lfItems || []).reduce((s, it) => s + Number(it.linearFt || 0), 0), [lfItems])
  const totalCost = useMemo(() => Math.round(totalLf * unitRate), [totalLf, unitRate])

  const rangeTotals = useMemo(() => {
    const cheap = Math.min(COSTS.prebuilt.melamine, COSTS.prebuilt.plywood, COSTS.custom.mdf + COSTS.finishAdj.stained)
    const pricey = Math.max(COSTS.custom.hardwood + COSTS.finishAdj.painted, COSTS.prebuilt.plywood)
    return { cheapest: Math.round(totalLf * cheap), costliest: Math.round(totalLf * pricey) }
  }, [totalLf])

  function setItem(idx, patch) {
    setLfItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
    setSaved(false)
  }
  function addItem() {
    setLfItems((prev) => ([...prev, { area: 'Area', linearFt: 0 }]))
    setSaved(false)
  }
  function removeItem(idx) {
    setLfItems((prev) => prev.filter((_it, i) => i !== idx))
    setSaved(false)
  }

  async function saveAll() {
    try {
      setSaving(true)
      setSaved(false)
      const payload = {
        lfItems: (lfItems || []).map((it) => ({ area: it.area || 'Area', linearFt: Number(it.linearFt || 0) })),
        selection: { type, finish, material },
        budget: Number(budget || 0),
        updatedAt: new Date().toISOString()
      }
      const updated = await api.updateCabinets(id, payload)
      setHome(updated)
      setSaved(true)
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Cabinets"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Cabinets' }
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {saved && <Typography variant="caption" color="success.main">Saved</Typography>}
            <Button variant="contained" onClick={saveAll} disabled={saving}>
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
              {(lfItems || []).map((it, idx) => (
                <Typography key={idx} variant="body2">{it.area}: {Number(it.linearFt || 0).toLocaleString()} lf</Typography>
              ))}
              <Divider />
              <Typography variant="body2">Unit rate: ${unitRate.toLocaleString()} / lf</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Total: ${totalCost.toLocaleString()}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" type="number" label="Budget (USD)" value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} />
                <Typography variant="body2" color={(Number(budget || 0) - totalCost) >= 0 ? 'success.main' : 'error.main'}>
                  {Number(budget || 0) - totalCost >= 0
                    ? `Under by $${(Number(budget || 0) - totalCost).toLocaleString()}`
                    : `Over by $${(totalCost - Number(budget || 0)).toLocaleString()}`}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <RangeCostBar
              minLabel="Cheapest config"
              minValue={rangeTotals.cheapest}
              maxLabel="Costliest config"
              maxValue={rangeTotals.costliest}
              currentValue={totalCost}
              budgetValue={Number(budget || 0)}
              width={720}
              height={96}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Linear footage</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Enter total cabinet linear feet for key areas</Typography>
          <Button size="small" onClick={addItem}>Add area</Button>
        </Stack>
        <Grid container spacing={2}>
          {(lfItems || []).map((it, idx) => (
            <Grid key={idx} item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <TextField size="small" label="Area" value={it.area} onChange={(e) => setItem(idx, { area: e.target.value })} />
                  <TextField size="small" type="number" label="Linear feet" value={it.linearFt} onChange={(e) => setItem(idx, { linearFt: Math.max(0, Number(e.target.value || 0)) })} />
                  <Button size="small" color="error" onClick={() => removeItem(idx)}>Remove</Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {!lfItems.length && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">No areas added yet.</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Configuration</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Type</Typography>
            <Select size="small" fullWidth value={type} onChange={(e) => setType(e.target.value)}>
              <MenuItem value="custom">Custom cabinets</MenuItem>
              <MenuItem value="prebuilt">Prebuilt cabinets</MenuItem>
            </Select>
          </Grid>
          {type === 'custom' && (
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish (custom only)</Typography>
              <Select size="small" fullWidth value={finish} onChange={(e) => setFinish(e.target.value)}>
                <MenuItem value="painted">Painted</MenuItem>
                <MenuItem value="stained">Stained</MenuItem>
              </Select>
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Material</Typography>
            <Select size="small" fullWidth value={material} onChange={(e) => setMaterial(e.target.value)}>
              {type === 'prebuilt' ? (
                <>
                  <MenuItem value="melamine">Melamine</MenuItem>
                  <MenuItem value="plywood">Plywood</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem value="mdf">MDF</MenuItem>
                  <MenuItem value="plywood">Plywood</MenuItem>
                  <MenuItem value="hardwood">Hardwood</MenuItem>
                </>
              )}
            </Select>
          </Grid>
        </Grid>
      </Paper>
      {/* Chat moved to global right-side panel */}
    </Stack>
  )
}


