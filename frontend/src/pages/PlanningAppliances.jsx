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

export default function PlanningAppliances() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [appliances, setAppliances] = useState([])
  const [budget, setBudget] = useState(0)

  const BRANDS = {
    fridge: {
      regular: ['GE','Whirlpool','Frigidaire','LG','Samsung','KitchenAid','Bosch','Monogram','Thermador','Sub-Zero'],
      built_in: ['Monogram','Thermador','Sub-Zero','Miele']
    },
    range: {
      gas: ['GE','Whirlpool','Frigidaire','LG','Samsung','KitchenAid','Bosch','Monogram','Thermador','Wolf'],
      electric: ['GE','Whirlpool','Frigidaire','LG','Samsung','KitchenAid','Bosch','Monogram','Thermador'],
      induction: ['GE','Bosch','KitchenAid','Monogram','Thermador','Miele']
    },
    oven: {
      single: ['GE','Whirlpool','Frigidaire','LG','Samsung','KitchenAid','Bosch','Monogram','Thermador','Miele'],
      double: ['GE','KitchenAid','Bosch','Monogram','Thermador','Miele']
    },
    microwave: {
      otr: ['GE','Whirlpool','Frigidaire','LG','Samsung','KitchenAid','Bosch'],
      drawer: ['Bosch','Monogram','Thermador','Miele','Sharp']
    },
    dishwasher: {
      standard: ['GE','Whirlpool','Frigidaire','LG','Samsung','KitchenAid','Bosch','Monogram','Thermador','Miele'],
      panel_ready: ['Bosch','Monogram','Thermador','Miele']
    }
  }

  const COSTS = {
    fridge: { regular: 1200, built_in: 7000 },
    range: { gas: 1000, electric: 900, induction: 2500 },
    oven: { single: 1500, double: 2800 },
    microwave: { otr: 350, drawer: 1200 },
    dishwasher: { standard: 700, panel_ready: 1600 },
    brandAdj: (brand) => {
      const hi = ['Monogram','Thermador','Sub-Zero','Wolf','Miele']
      const mid = ['Bosch','KitchenAid']
      if (hi.includes(brand)) return 1.8
      if (mid.includes(brand)) return 1.3
      return 1.0
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const h = await api.getHome(id)
        setHome(h)
        const saved = h?.appliances || null
        if (saved && Array.isArray(saved.items)) {
          setAppliances(saved.items)
          setBudget(Number(saved.budget || 0))
          return
        }
        // Generate base set from plan (kitchen existence)
        const docs = Array.isArray(h?.documents) ? h.documents : []
        const archDocs = docs.filter((d) => String(d.category || '').startsWith('architecture_'))
        const finalBase = archDocs.find((d) => d.category === 'architecture_base' && d.isFinal)
        const preferred = finalBase || archDocs.find((d) => d.isFinal) || archDocs[0]
        const rooms = Array.isArray(preferred?.analysis?.roomAnalysis) ? preferred.analysis.roomAnalysis : []
        const hasKitchen = rooms.some((r) => (String(r.name || '').toLowerCase().includes('kitchen')))
        const base = hasKitchen ? [
          { key: 'fridge', label: 'Refrigerator', type: 'regular', brand: 'GE', model: '', qty: 1 },
          { key: 'range', label: 'Range / Stove', type: 'gas', brand: 'GE', model: '', qty: 1 },
          { key: 'oven', label: 'Wall Oven', type: 'single', brand: 'GE', model: '', qty: 1 },
          { key: 'microwave', label: 'Microwave', type: 'otr', brand: 'GE', model: '', qty: 1 },
          { key: 'dishwasher', label: 'Dishwasher', type: 'standard', brand: 'GE', model: '', qty: 1 },
        ] : []
        setAppliances(base)
      } catch {}
    }
    load()
  }, [id])

  const itemsWithCost = useMemo(() => {
    return (appliances || []).map((a) => {
      const base = COSTS[a.key]?.[a.type] || 0
      const adj = COSTS.brandAdj(String(a.brand || ''))
      return { ...a, unitCost: Math.round(base * adj) }
    })
  }, [appliances])

  const totals = useMemo(() => {
    const parts = (itemsWithCost || []).map((a) => (a.qty || 1) * (a.unitCost || 0))
    const total = parts.reduce((s, n) => s + n, 0)
    return { total }
  }, [itemsWithCost])

  const rangeTotals = useMemo(() => {
    // cheapest = lowest type cost with base brand; costliest = highest type with hi-end brand adj
    const brandHiAdj = COSTS.brandAdj('Miele')
    const brandBaseAdj = COSTS.brandAdj('GE')
    let cheapest = 0
    let costliest = 0
    for (const a of appliances) {
      const typeCosts = COSTS[a.key] || {}
      const low = Math.min(...Object.values(typeCosts))
      const high = Math.max(...Object.values(typeCosts))
      const qty = Number(a.qty || 1)
      cheapest += qty * Math.round(low * brandBaseAdj || 0)
      costliest += qty * Math.round(high * brandHiAdj || 0)
    }
    return { cheapest, costliest }
  }, [appliances])

  async function saveAll() {
    try {
      setSaving(true)
      setSaved(false)
      const payload = { items: appliances, budget: Number(budget || 0), updatedAt: new Date().toISOString() }
      const updated = await api.updateAppliances(id, payload)
      setHome(updated)
      setSaved(true)
    } catch {}
    finally {
      setSaving(false)
    }
  }

  function setItem(idx, patch) {
    setAppliances((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
    setSaved(false)
  }

  function addItem() {
    setAppliances((prev) => ([...prev, { key: 'fridge', label: 'Refrigerator', type: 'regular', brand: 'GE', model: '', qty: 1 }]))
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Appliances"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Appliances' }
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
              {(itemsWithCost || []).map((a, i) => (
                <Typography key={i} variant="body2">
                  {a.label}: {a.qty} × ${a.unitCost.toLocaleString()} = ${((a.qty || 1) * (a.unitCost || 0)).toLocaleString()}
                </Typography>
              ))}
              <Divider />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Total: ${totals.total.toLocaleString()}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  type="number"
                  label="Budget (USD)"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value || 0))}
                />
                <Typography variant="body2" color={(Number(budget || 0) - totals.total) >= 0 ? 'success.main' : 'error.main'}>
                  {Number(budget || 0) - totals.total >= 0
                    ? `Under by $${(Number(budget || 0) - totals.total).toLocaleString()}`
                    : `Over by $${(totals.total - Number(budget || 0)).toLocaleString()}`}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <RangeCostBar
              minLabel="Cheapest brands/types"
              minValue={rangeTotals.cheapest}
              maxLabel="Costliest brands/types"
              maxValue={rangeTotals.costliest}
              currentValue={totals.total}
              budgetValue={Number(budget || 0)}
              width={720}
              height={96}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">Select appliances</Typography>
          <Button size="small" onClick={addItem}>Add appliance</Button>
        </Stack>
        <Grid container spacing={2}>
          {(appliances || []).map((a, idx) => {
            const types = Object.keys(BRANDS[a.key] || BRANDS.fridge)
            const brands = (BRANDS[a.key] && BRANDS[a.key][a.type]) ? BRANDS[a.key][a.type] : BRANDS.fridge.regular
            const unit = (itemsWithCost[idx]?.unitCost || 0)
            return (
              <Grid key={idx} item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Appliance</Typography>
                      <Select size="small" fullWidth value={a.key} onChange={(e) => {
                        const key = e.target.value
                        const labelMap = { fridge: 'Refrigerator', range: 'Range / Stove', oven: 'Wall Oven', microwave: 'Microwave', dishwasher: 'Dishwasher' }
                        const defaultType = Object.keys(BRANDS[key])[0]
                        setItem(idx, { key, label: labelMap[key] || 'Appliance', type: defaultType, brand: (BRANDS[key][defaultType] || [])[0] || 'GE' })
                      }}>
                        <MenuItem value="fridge">Refrigerator</MenuItem>
                        <MenuItem value="range">Range / Stove</MenuItem>
                        <MenuItem value="oven">Wall Oven</MenuItem>
                        <MenuItem value="microwave">Microwave</MenuItem>
                        <MenuItem value="dishwasher">Dishwasher</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Type</Typography>
                      <Select size="small" fullWidth value={a.type} onChange={(e) => {
                        const t = e.target.value
                        const brand = ((BRANDS[a.key] && BRANDS[a.key][t]) ? BRANDS[a.key][t][0] : 'GE')
                        setItem(idx, { type: t, brand })
                      }}>
                        {types.map((t) => (<MenuItem key={t} value={t}>{t.replace(/_/g,' ')}</MenuItem>))}
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Brand</Typography>
                      <Select size="small" fullWidth value={a.brand} onChange={(e) => setItem(idx, { brand: e.target.value })}>
                        {brands.map((b) => (<MenuItem key={b} value={b}>{b}</MenuItem>))}
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Qty</Typography>
                      <TextField size="small" type="number" value={a.qty} onChange={(e) => setItem(idx, { qty: Math.max(1, Number(e.target.value || 1)) })} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Est. unit</Typography>
                      <Typography variant="body2">${unit.toLocaleString()}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )
          })}
          {!appliances.length && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">No appliances detected. Click "Add appliance" to start.</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Stack>
  )
}


