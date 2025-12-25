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
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import IconButton from '@mui/material/IconButton'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

export default function PlanningWindowsDoors() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // counts
  const [windowsCount, setWindowsCount] = useState(0)
  const [exteriorDoorsCount, setExteriorDoorsCount] = useState(0)
  const [interiorDoorsCount, setInteriorDoorsCount] = useState(0)

  // selections
  const [windowType, setWindowType] = useState('vinyl_basic')
  const [windowPane, setWindowPane] = useState('double')
  const [windowColor, setWindowColor] = useState('')

  const [extDoorType, setExtDoorType] = useState('fiberglass')
  const [extDoorFinish, setExtDoorFinish] = useState('painted')

  const [intDoorType, setIntDoorType] = useState('hollow_core')
  const [intDoorFinish, setIntDoorFinish] = useState('painted')

  const [budget, setBudget] = useState(0)
  const [windowItems, setWindowItems] = useState([])

  // Baseline $ per unit
  const COSTS = {
    window: {
      vinyl_basic: 25,      // $/sqft opening
      vinyl_premium: 35,
      composite: 45,
      wood_clad: 55,
      aluminum: 65,
      steel_iron: 90,
    },
    paneAdj: {
      double: 0,            // $/sqft addition
      triple: 5,
    },
    exteriorDoor: {
      fiberglass: 600,
      steel: 700,
      wood: 1200,
      iron: 2500,
    },
    interiorDoor: {
      hollow_core: 120,
      solid_core: 260,
      shaker: 220,
      panel: 180,
      glass: 350,
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const h = await api.getHome(id)
        setHome(h)
        // estimates from analysis
        const docs = Array.isArray(h?.documents) ? h.documents : []
        const archDocs = docs.filter((d) => String(d.category || '').startsWith('architecture_'))
        const finalBase = archDocs.find((d) => d.category === 'architecture_base' && d.isFinal)
        const preferred = finalBase || archDocs.find((d) => d.isFinal) || archDocs[0]
        const rooms = Array.isArray(preferred?.analysis?.roomAnalysis) ? preferred.analysis.roomAnalysis : []
        const winEst = rooms.reduce((sum, r) => sum + (Number(r.windows || 0)), 0)
        const doorEst = rooms.reduce((sum, r) => sum + (Number(r.doors || 0)), 0)
        const wdSaved = h?.windowsDoors || null
        setWindowsCount(Number(wdSaved?.windowsCount ?? winEst) || 0)
        const defaultExterior = Math.min(doorEst || 0, 2)
        setExteriorDoorsCount(Number(wdSaved?.exteriorDoorsCount ?? defaultExterior) || 0)
        const defaultInterior = Math.max((doorEst || 0) - defaultExterior, 0)
        setInteriorDoorsCount(Number(wdSaved?.interiorDoorsCount ?? defaultInterior) || 0)
        setWindowType(String(wdSaved?.windowType || 'vinyl_basic'))
        setWindowPane(String(wdSaved?.windowPane || 'double'))
        setWindowColor(String(wdSaved?.windowColor || ''))
        setExtDoorType(String(wdSaved?.extDoorType || 'fiberglass'))
        setExtDoorFinish(String(wdSaved?.extDoorFinish || 'painted'))
        setIntDoorType(String(wdSaved?.intDoorType || 'hollow_core'))
        setIntDoorFinish(String(wdSaved?.intDoorFinish || 'painted'))
        setBudget(Number(wdSaved?.budget || 0))
        const savedItems = Array.isArray(wdSaved?.windowItems) ? wdSaved.windowItems : []
        setWindowItems(savedItems.map((it, idx) => ({
          id: `${idx}-${it.roomName || ''}-${it.level || ''}`,
          roomName: it.roomName || '',
          level: it.level || '',
          widthIn: Number(it.widthIn || 0),
          heightIn: Number(it.heightIn || 0),
          location: String(it.location || ''),
        })))
      } catch {}
    }
    load()
  }, [id])

  const windowRateSqft = useMemo(() => {
    const base = COSTS.window[windowType] || 0
    const pane = COSTS.paneAdj[windowPane] || 0
    return base + pane
  }, [windowType, windowPane])

  const extDoorUnitCost = useMemo(() => COSTS.exteriorDoor[extDoorType] || 0, [extDoorType])
  const intDoorUnitCost = useMemo(() => COSTS.interiorDoor[intDoorType] || 0, [intDoorType])

  const totals = useMemo(() => {
    const winTotal = (windowItems && windowItems.length)
      ? windowItems.reduce((sum, w) => {
          const sqft = Math.max(0, Number(w.widthIn || 0)) * Math.max(0, Number(w.heightIn || 0)) / 144
          return sum + sqft * windowRateSqft
        }, 0)
      : (windowsCount * (36 * 48 / 144) * windowRateSqft) // default 3x4 ft if no details
    const windows = winTotal
    const exDoors = exteriorDoorsCount * extDoorUnitCost
    const inDoors = interiorDoorsCount * intDoorUnitCost
    return {
      windows, exDoors, inDoors,
      total: windows + exDoors + inDoors
    }
  }, [windowsCount, exteriorDoorsCount, interiorDoorsCount, windowItems, windowRateSqft, extDoorUnitCost, intDoorUnitCost])

  async function saveAll() {
    try {
      setSaving(true)
      setSaved(false)
      const payload = {
        windowsCount,
        exteriorDoorsCount,
        interiorDoorsCount,
        windowType,
        windowPane,
        windowColor,
        extDoorType,
        extDoorFinish,
        intDoorType,
        intDoorFinish,
        budget: Number(budget || 0),
        windowItems: (windowItems || []).map((w) => ({
          roomName: w.roomName || '',
          level: w.level || '',
          widthIn: Number(w.widthIn || 0),
          heightIn: Number(w.heightIn || 0),
          location: w.location || ''
        })),
        updatedAt: new Date().toISOString(),
      }
      const updated = await api.updateWindowsDoors(id, payload)
      setHome(updated)
      setSaved(true)
    } catch {}
    finally {
      setSaving(false)
    }
  }

  function getPlanRooms() {
    const h = home
    if (!h) return []
    const docs = Array.isArray(h?.documents) ? h.documents : []
    const archDocs = docs.filter((d) => String(d.category || '').startsWith('architecture_'))
    const finalBase = archDocs.find((d) => d.category === 'architecture_base' && d.isFinal)
    const preferred = finalBase || archDocs.find((d) => d.isFinal) || archDocs[0]
    const rooms = Array.isArray(preferred?.analysis?.roomAnalysis) ? preferred.analysis.roomAnalysis : []
    return rooms.map((r) => ({ roomName: r.name || 'Room', level: r.level || '', windows: Number(r.windows || 0) }))
  }

  function generateWindowsFromPlan() {
    const rooms = getPlanRooms()
    const out = []
    for (const r of rooms) {
      for (let i = 0; i < (r.windows || 0); i++) {
        out.push({
          id: `${r.roomName}-${r.level}-${i}-${Date.now()}`,
          roomName: r.roomName,
          level: r.level,
          widthIn: 36,
          heightIn: 48,
          location: ''
        })
      }
    }
    setWindowItems(out)
    setWindowsCount(out.length)
    setSaved(false)
  }

  function addWindowRow() {
    setWindowItems((prev) => ([
      ...prev,
      { id: `manual-${Date.now()}`, roomName: '', level: '', widthIn: 0, heightIn: 0, location: '' }
    ]))
    setSaved(false)
  }

  function removeWindowRow(id) {
    setWindowItems((prev) => prev.filter((w) => w.id !== id))
    setSaved(false)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Windows & Doors"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Windows & Doors' }
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
        <Typography variant="h6" gutterBottom>Counts</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Windows count"
              value={windowsCount}
              onChange={(e) => setWindowsCount(Math.max(0, Number(e.target.value || 0)))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Exterior doors count"
              value={exteriorDoorsCount}
              onChange={(e) => setExteriorDoorsCount(Math.max(0, Number(e.target.value || 0)))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Interior doors count"
              value={interiorDoorsCount}
              onChange={(e) => setInteriorDoorsCount(Math.max(0, Number(e.target.value || 0)))}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">Windows details</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={addWindowRow}>Add window</Button>
            <Button size="small" variant="outlined" onClick={generateWindowsFromPlan}>Generate from plan</Button>
          </Stack>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Room</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Width (in)</TableCell>
              <TableCell>Height (in)</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Est. Cost</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(windowItems || []).map((w) => {
              const sqft = Math.max(0, Number(w.widthIn || 0)) * Math.max(0, Number(w.heightIn || 0)) / 144
              const cost = sqft * windowRateSqft
              return (
                <TableRow key={w.id}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={w.roomName}
                      onChange={(e) => setWindowItems((prev) => prev.map((it) => it.id === w.id ? { ...it, roomName: e.target.value } : it))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={w.level}
                      onChange={(e) => setWindowItems((prev) => prev.map((it) => it.id === w.id ? { ...it, level: e.target.value } : it))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={w.widthIn}
                      onChange={(e) => setWindowItems((prev) => prev.map((it) => it.id === w.id ? { ...it, widthIn: Math.max(0, Number(e.target.value || 0)) } : it))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={w.heightIn}
                      onChange={(e) => setWindowItems((prev) => prev.map((it) => it.id === w.id ? { ...it, heightIn: Math.max(0, Number(e.target.value || 0)) } : it))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={w.location}
                      onChange={(e) => setWindowItems((prev) => prev.map((it) => it.id === w.id ? { ...it, location: e.target.value } : it))}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(cost)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => removeWindowRow(w.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
            {!windowItems.length && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">No windows added. Use "Generate from plan" to auto-create rows or "Add window".</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Windows</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Type</Typography>
            <Select fullWidth size="small" value={windowType} onChange={(e) => setWindowType(e.target.value)}>
              <MenuItem value="vinyl_basic">Vinyl - Basic</MenuItem>
              <MenuItem value="vinyl_premium">Vinyl - Premium</MenuItem>
              <MenuItem value="composite">Composite</MenuItem>
              <MenuItem value="wood_clad">Wood Clad</MenuItem>
              <MenuItem value="aluminum">Aluminum</MenuItem>
              <MenuItem value="steel_iron">Steel/Iron</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Glass</Typography>
            <Select fullWidth size="small" value={windowPane} onChange={(e) => setWindowPane(e.target.value)}>
              <MenuItem value="double">Double-pane</MenuItem>
              <MenuItem value="triple">Triple-pane</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Color" value={windowColor} onChange={(e) => setWindowColor(e.target.value)} />
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
          Est. rate: {formatCurrency(windowRateSqft)} per sqft opening
        </Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Exterior Doors</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Type</Typography>
            <Select fullWidth size="small" value={extDoorType} onChange={(e) => setExtDoorType(e.target.value)}>
              <MenuItem value="fiberglass">Fiberglass</MenuItem>
              <MenuItem value="steel">Steel</MenuItem>
              <MenuItem value="wood">Wood</MenuItem>
              <MenuItem value="iron">Iron</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish</Typography>
            <Select fullWidth size="small" value={extDoorFinish} onChange={(e) => setExtDoorFinish(e.target.value)}>
              <MenuItem value="painted">Painted</MenuItem>
              <MenuItem value="stained">Stained</MenuItem>
              <MenuItem value="factory_finish">Factory Finish</MenuItem>
            </Select>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
          Est. per-exterior-door: {formatCurrency(extDoorUnitCost)}
        </Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Interior Doors</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Type</Typography>
            <Select fullWidth size="small" value={intDoorType} onChange={(e) => setIntDoorType(e.target.value)}>
              <MenuItem value="hollow_core">Hollow Core</MenuItem>
              <MenuItem value="solid_core">Solid Core</MenuItem>
              <MenuItem value="shaker">Shaker</MenuItem>
              <MenuItem value="panel">Panel</MenuItem>
              <MenuItem value="glass">Glass</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ display: 'block', mb: .5 }}>Finish</Typography>
            <Select fullWidth size="small" value={intDoorFinish} onChange={(e) => setIntDoorFinish(e.target.value)}>
              <MenuItem value="painted">Painted</MenuItem>
              <MenuItem value="stained">Stained</MenuItem>
              <MenuItem value="factory_finish">Factory Finish</MenuItem>
            </Select>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
          Est. per-interior-door: {formatCurrency(intDoorUnitCost)}
        </Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="body2">
                {windowItems.length ? (
                  <>Windows (details): {formatCurrency(totals.windows)}</>
                ) : (
                  <>Windows: {windowsCount} × {formatCurrency((36 * 48 / 144) * windowRateSqft)} = {formatCurrency(totals.windows)}</>
                )}
              </Typography>
              <Typography variant="body2">Exterior doors: {exteriorDoorsCount} × {formatCurrency(extDoorUnitCost)} = {formatCurrency(totals.exDoors)}</Typography>
              <Typography variant="body2">Interior doors: {interiorDoorsCount} × {formatCurrency(intDoorUnitCost)} = {formatCurrency(totals.inDoors)}</Typography>
              <Divider />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Total: {formatCurrency(totals.total)}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <TextField
                size="small"
                type="number"
                label="Budget (USD)"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value || 0))}
              />
              <Typography variant="body2" color={(Number(budget || 0) - totals.total) >= 0 ? 'success.main' : 'error.main'}>
                {Number(budget || 0) - totals.total >= 0
                  ? `Under by ${formatCurrency(Number(budget || 0) - totals.total)}`
                  : `Over by ${formatCurrency(totals.total - Number(budget || 0))}`}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  )
}

function formatCurrency(n) {
  const v = Number(n || 0)
  return `$${Math.round(v).toLocaleString()}`
}


