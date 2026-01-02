import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'

export default function PlanningExteriorMaterials() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [notes, setNotes] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')

  useEffect(() => {
    api.getHome(id).then((h) => {
      setHome(h)
      const saved = h?.planning?.exterior_materials?.notes || ''
      setNotes(String(saved))
    }).catch(() => { })
  }, [id])

  const hasFinalArchitecture = useMemo(() => {
    const docs = Array.isArray(home?.documents) ? home.documents : []
    const archDocs = docs.filter((d) => String(d?.category || '').startsWith('architecture_'))
    return !!archDocs.find((d) => d?.isFinal)
  }, [home])

  const ext = home?.exteriorMaterials || null
  const hasExtraction = ext && ext.extractedAt

  async function runExtraction() {
    try {
      setExtracting(true)
      setExtractError('')
      const result = await api.extractExteriorMaterials(id)
      setHome(result.home)
    } catch (e) {
      setExtractError(e.message || 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  function formatCurrency(n) {
    const v = Number(n || 0)
    return `$${Math.round(v).toLocaleString()}`
  }

  function formatDate(d) {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Exterior Materials Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Exterior Materials' }
        ]}
        actions={
          <Button
            variant="contained"
            onClick={runExtraction}
            disabled={extracting || !hasFinalArchitecture}
          >
            {extracting ? 'Extracting…' : 'Extract from Plans'}
          </Button>
        }
      />

      {!hasFinalArchitecture && (
        <Alert severity="warning">
          Upload and mark a final architecture plan first to enable extraction.
        </Alert>
      )}

      {extractError && (
        <Alert severity="error" onClose={() => setExtractError('')}>
          {extractError}
        </Alert>
      )}

      {extracting && (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography component="span">Extracting roofing, cladding, windows, and doors from architecture plans...</Typography>
        </Paper>
      )}

      {hasExtraction && (
        <>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
            <Typography variant="body2" color="text.secondary">
              Last extracted: {formatDate(ext.extractedAt)}
            </Typography>
          </Paper>

          {/* Totals Summary */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Cost Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={2.4}>
                <Typography variant="body2" color="text.secondary">Roofing</Typography>
                <Typography variant="h6">{formatCurrency(ext.totals?.totalRoofingCost)}</Typography>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Typography variant="body2" color="text.secondary">Cladding</Typography>
                <Typography variant="h6">{formatCurrency(ext.totals?.totalCladdingCost)}</Typography>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Typography variant="body2" color="text.secondary">Windows ({ext.totals?.windowCount || 0})</Typography>
                <Typography variant="h6">{formatCurrency(ext.totals?.totalWindowsCost)}</Typography>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Typography variant="body2" color="text.secondary">Doors ({ext.totals?.doorCount || 0})</Typography>
                <Typography variant="h6">{formatCurrency(ext.totals?.totalDoorsCost)}</Typography>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">{formatCurrency(ext.totals?.totalCost)}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Roofing */}
          {ext.roofing && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Roofing</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography>{ext.roofing.type || '—'}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Material</Typography>
                  <Typography>{ext.roofing.material || '—'}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Area</Typography>
                  <Typography>{ext.roofing.areaSqFt ? `${ext.roofing.areaSqFt.toLocaleString()} sqft` : '—'}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Slope</Typography>
                  <Typography>{ext.roofing.slope || '—'}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Est. Cost</Typography>
                  <Typography fontWeight="bold">{formatCurrency(ext.roofing.estCost)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Cladding */}
          {Array.isArray(ext.cladding) && ext.cladding.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Cladding / Siding</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Area</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Sq Ft</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ext.cladding.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.area || '—'}</TableCell>
                      <TableCell>{c.type || '—'}</TableCell>
                      <TableCell>{c.material || '—'}</TableCell>
                      <TableCell align="right">{c.areaSqFt?.toLocaleString() || '—'}</TableCell>
                      <TableCell align="right">{formatCurrency(c.estCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Windows */}
          {Array.isArray(ext.windows) && ext.windows.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Windows ({ext.windows.length})</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size (W×H)</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Glazing</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ext.windows.map((w, i) => (
                    <TableRow key={i}>
                      <TableCell><strong>{w.label || `W${i + 1}`}</strong></TableCell>
                      <TableCell>{w.roomName || '—'}</TableCell>
                      <TableCell>{w.level || '—'}</TableCell>
                      <TableCell>{w.openingType || '—'}</TableCell>
                      <TableCell>{w.widthIn && w.heightIn ? `${w.widthIn}"×${w.heightIn}"` : '—'}</TableCell>
                      <TableCell>{w.frameMaterial || '—'}</TableCell>
                      <TableCell>{w.glazing || '—'}</TableCell>
                      <TableCell align="right">{formatCurrency(w.estCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Doors */}
          {Array.isArray(ext.doors) && ext.doors.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Doors ({ext.doors.length})</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size (W×H)</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Ext/Int</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ext.doors.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell><strong>{d.label || `D${i + 1}`}</strong></TableCell>
                      <TableCell>{d.roomName || '—'}</TableCell>
                      <TableCell>{d.level || '—'}</TableCell>
                      <TableCell>{d.doorType || '—'}</TableCell>
                      <TableCell>{d.widthIn && d.heightIn ? `${d.widthIn}"×${d.heightIn}"` : '—'}</TableCell>
                      <TableCell>{d.material || '—'}</TableCell>
                      <TableCell>{d.isExterior ? 'Exterior' : 'Interior'}</TableCell>
                      <TableCell align="right">{formatCurrency(d.estCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          <Divider />
        </>
      )}

      {/* Notes section (always visible) */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Additional Notes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Capture roofing, cladding selections, exterior trim, window/door finishes, and weatherproofing notes.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (e.g., metal roof standing seam, fiber cement lap, stucco accents, bronze windows, WRB type)..."
        />
      </Paper>
    </Stack>
  )
}
