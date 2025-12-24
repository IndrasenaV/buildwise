import { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import LinearProgress from '@mui/material/LinearProgress'
import FunctionalRadar from '../components/analysis/FunctionalRadar.jsx'
import CostDriversChart from '../components/analysis/CostDriversChart.jsx'
import { mockArchitectureAnalysis } from '../mock/architectureAnalysis.js'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import { PlanChat } from '../components/PlanChat.jsx'

export default function PlanningArchitectAnalysis() {
  const { id, docId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('overview')
  const [busy, setBusy] = useState(false)

  const useMock = useMemo(() => {
    const params = new URLSearchParams(location.search || '')
    return params.get('mock') === '1'
  }, [location.search])

  const doc = useMemo(() => {
    return (home?.documents || []).find((d) => String(d._id) === String(docId))
  }, [home, docId])

  useEffect(() => {
    let mounted = true
    api.getHome(id).then((h) => {
      if (!mounted) return
      setHome(h)
      const stateResult = location.state && location.state.result ? location.state.result : null
      const existing = ((h?.documents || []).find((d) => String(d._id) === String(docId)))?.analysis || null
      if (useMock) {
        setResult(stateResult || mockArchitectureAnalysis)
      } else {
        setResult(stateResult || existing || null)
      }
    }).catch(() => { })
    return () => { mounted = false }
  }, [id, docId, useMock])

  const autoRunRef = useRef(false)
  useEffect(() => { autoRunRef.current = false }, [docId])

  useEffect(() => {
    if (!home || useMock || busy || autoRunRef.current) return
    const doc = (home?.documents || []).find((d) => String(d._id) === String(docId))
    // If doc exists but no analysis OR analysis is incomplete/not-analyzed OR missing projectInfo (schema fix), trigger run
    const analysis = doc?.analysis
    if (doc && (!analysis || !analysis.analyzed || !analysis.projectInfo)) {
      autoRunRef.current = true
      runAnalysisNow()
    }
  }, [home, result, useMock, busy, docId])

  async function runAnalysisNow() {
    try {
      setBusy(true)
      const resp = await api.analyzeArchitectureDoc(id, docId)
      const updatedHome = resp?.home || resp
      setHome(updatedHome)
      const doc = (updatedHome?.documents || []).find((d) => String(d._id) === String(docId))
      setResult(doc?.analysis || null)
    } catch (_e) {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Architecture Analysis"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Architect', href: `/homes/${id}/planning/architect` },
          { label: 'Analysis' }
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={useMock}
                  onChange={(e) => {
                    const checked = e.target.checked
                    const params = new URLSearchParams(location.search || '')
                    if (checked) params.set('mock', '1'); else params.delete('mock')
                    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true, state: {} })
                    // Optimistically update result
                    if (checked) {
                      setResult(mockArchitectureAnalysis)
                    } else {
                      setResult(doc?.analysis || null)
                    }
                  }}
                />
              }
              label="Mock results"
            />
            {!result && !useMock ? (
              <Button variant="contained" onClick={runAnalysisNow} disabled={busy}>
                {busy ? 'Analyzing…' : 'Run Analysis'}
              </Button>
            ) : !useMock ? (
              <Button variant="outlined" size="small" onClick={runAnalysisNow} disabled={busy}>
                {busy ? 'Re-analyzing…' : 'Re-analyze'}
              </Button>
            ) : null}
          </Stack>
        }
      />
      {!result ? (
        <Typography variant="body2" color="text.secondary">
          {useMock ? 'Loading mock analysis…' : 'No analysis yet. Use Run Analysis to start.'}
        </Typography>
      ) : (
        <>
          <Paper variant="outlined" sx={{ px: 2 }}>
            <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
              <Tab label="Overview" value="overview" />
              <Tab label="Rooms" value="rooms" />
              <Tab label="Cost" value="cost" />
              <Tab label="Lighting" value="lighting" />
              <Tab label="Accessibility" value="access" />
              <Tab label="Suggestions" value="suggestions" />
              <Tab label="Tasks" value="tasks" />
              <Tab label="Raw" value="raw" />
            </Tabs>
          </Paper>

          {tab === 'raw' && (
            <Paper variant="outlined" sx={{ p: 2, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Raw Analysis Result</Typography>
              <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace' }}>
                {result?.raw || JSON.stringify(result, null, 2)}
              </pre>
            </Paper>
          )}

          {tab === 'overview' && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Project Information</Typography>
                {result?.projectInfo?.address && (
                  <Typography variant="body2">Address: {result.projectInfo.address}</Typography>
                )}
                {result?.projectInfo?.totalSqFt ? (
                  <Typography variant="body2">Total Square Feet: {result.projectInfo.totalSqFt.toLocaleString()}</Typography>
                ) : result?.totalSqFt ? (
                  <Typography variant="body2">Total Square Feet: {result.totalSqFt.toLocaleString()}</Typography>
                ) : null}
                <Typography variant="body2">House Type: {result?.projectInfo?.houseType || result?.houseType || '—'}</Typography>
                <Typography variant="body2">Roof Type: {result?.projectInfo?.roofType || result?.roofType || '—'}</Typography>
                <Typography variant="body2">Exterior Type: {result?.projectInfo?.exteriorType || result?.exteriorType || '—'}</Typography>
              </Paper>
              {result?.functionalScores && Object.keys(result.functionalScores).length > 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Functional Overview</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Box><FunctionalRadar scores={result.functionalScores} /></Box>
                    <Stack spacing={1}>
                      {Object.entries(result.functionalScores).map(([k, v]) => {
                        const numValue = typeof v === 'number' ? v : (typeof v === 'string' && !isNaN(parseFloat(v))) ? parseFloat(v) : 0;
                        return (
                          <Box key={k}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{k}</Typography>
                              <Typography variant="caption">{Math.round(numValue * 100)}%</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={Math.round(numValue * 100)} />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Paper>
              )}
            </Stack>
          )}

          {tab === 'rooms' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: .5 }}>Detailed Room Analysis</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Area (sq ft)</TableCell>
                    <TableCell>Dimensions (ft)</TableCell>
                    <TableCell>Windows</TableCell>
                    <TableCell>Doors</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(result?.roomAnalysis || []).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.name || '—'}</TableCell>
                      <TableCell>{r.level || '—'}</TableCell>
                      <TableCell>{r.areaSqFt || 0}</TableCell>
                      <TableCell>{(r.dimensions && (r.dimensions.lengthFt || r.dimensions.widthFt)) ? `${r.dimensions.lengthFt || 0} × ${r.dimensions.widthFt || 0}` : '—'}</TableCell>
                      <TableCell>{typeof r.windows === 'number' ? r.windows : '—'}</TableCell>
                      <TableCell>{typeof r.doors === 'number' ? r.doors : '—'}</TableCell>
                      <TableCell>{r.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {tab === 'cost' && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: .5 }}>Cost Efficiency Analysis</Typography>
                {result?.costAnalysis?.summary ? (
                  <Typography variant="body2" sx={{ mb: 1 }}>{result.costAnalysis.summary}</Typography>
                ) : null}
                {!!(result?.costAnalysis?.highImpactItems || []).length && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Key Cost Drivers vs Typical</Typography>
                    <CostDriversChart
                      data={(result?.costAnalysis?.highImpactItems || []).map((it) => ({
                        label: it.item,
                        project: Number(it.projectValue ?? 0),
                        typical: Number(it.typicalValue ?? 0),
                      }))}
                    />
                  </Paper>
                )}
                {!!(result?.costAnalysis?.highImpactItems || []).length && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>High-Impact Items</Typography>
                    <List dense disablePadding>
                      {(result?.costAnalysis?.highImpactItems || []).map((it, i) => (
                        <div key={i}>
                          <ListItem>
                            <ListItemText
                              primary={it.item || 'Item'}
                              secondary={
                                <span>
                                  {it.rationale || '—'}
                                  {it.metricName ? ` · Metric: ${it.metricName}` : ''}
                                  {(it.projectValue !== undefined && it.projectValue !== null) ? ` · Project: ${typeof it.projectValue === 'number' ? it.projectValue.toLocaleString() : it.projectValue}` : ''}
                                  {(it.typicalValue !== undefined && it.typicalValue !== null) ? ` · Typical: ${typeof it.typicalValue === 'number' ? it.typicalValue.toLocaleString() : it.typicalValue}` : ''}
                                  {it.estCostImpact ? ` · Impact: ${typeof it.estCostImpact === 'number' ? `$${it.estCostImpact.toLocaleString()}` : it.estCostImpact}` : ''}
                                </span>
                              }
                            />
                          </ListItem>
                          {i < (result?.costAnalysis?.highImpactItems || []).length - 1 && <Divider component="li" />}
                        </div>
                      ))}
                    </List>
                  </Box>
                )}
                {!!(result?.costAnalysis?.valueEngineeringIdeas || []).length && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>Value Engineering Ideas</Typography>
                    <List dense disablePadding>
                      {(result?.costAnalysis?.valueEngineeringIdeas || []).map((it, i) => (
                        <div key={i}>
                          <ListItem>
                            <ListItemText
                              primary={it.idea || 'Idea'}
                              secondary={`${it.trade ? `Trade: ${it.trade} · ` : ''}${it.estSavings ? `Est. Savings: ${it.estSavings}` : ''}`}
                            />
                          </ListItem>
                          {i < (result?.costAnalysis?.valueEngineeringIdeas || []).length - 1 && <Divider component="li" />}
                        </div>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Stack>
          )}

          {tab === 'lighting' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: .5 }}>Lighting & Daylight</Typography>
              {result?.lightingAnalysis?.summary ? (
                <Typography variant="body2" sx={{ mb: 1 }}>{result.lightingAnalysis.summary}</Typography>
              ) : null}
              {!!(result?.lightingAnalysis?.rooms || []).length && (
                <Box>
                  {(result?.lightingAnalysis?.rooms || []).map((r, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">{r.name} {r.orientation ? `· ${r.orientation}` : ''} {typeof r.glazingAreaPct === 'number' ? `· ${r.glazingAreaPct}% glazing` : ''}</Typography>
                        <Typography variant="caption">{Math.round((r.daylightScore || 0) * 100)}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.round((r.daylightScore || 0) * 100)} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          )}

          {tab === 'access' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: .5 }}>Accessibility & Comfort</Typography>
              {result?.accessibilityComfort?.metrics ? (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>Metrics</Typography>
                  <List dense disablePadding>
                    {Object.entries(result.accessibilityComfort.metrics).map(([k, v]) => {
                      // Handle both Pass/Fail strings and numeric values for backward compatibility
                      const displayValue = typeof v === 'string' ? v : (typeof v === 'number' ? v : String(v));
                      return (
                        <ListItem key={k}>
                          <ListItemText
                            primary={`${k}: ${displayValue}`}
                            secondary={typeof v === 'string' && (v === 'Pass' || v === 'Fail') ? (v === 'Pass' ? 'Compliant' : 'Non-compliant') : undefined}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              ) : null}
              {!!(result?.accessibilityComfort?.issues || []).length && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>Issues</Typography>
                  <List dense disablePadding>
                    {(result?.accessibilityComfort?.issues || []).map((it, i) => (
                      <div key={i}>
                        <ListItem>
                          <ListItemText
                            primary={`${it.area || 'Area'}${it.severity ? ` · ${it.severity}` : ''}`}
                            secondary={`${it.issue || '—'}${it.recommendation ? ` · Rec: ${it.recommendation}` : ''}`}
                          />
                        </ListItem>
                        {i < (result?.accessibilityComfort?.issues || []).length - 1 && <Divider component="li" />}
                      </div>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          )}

          {tab === 'suggestions' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2">Suggestions</Typography>
              <List dense disablePadding>
                {(result?.suggestions || []).map((s, i) => (
                  <div key={i}>
                    <ListItem><ListItemText primary={s} /></ListItem>
                    {i < (result?.suggestions || []).length - 1 && <Divider component="li" />}
                  </div>
                ))}
              </List>
            </Paper>
          )}

          {tab === 'tasks' && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2">Suggested Tasks</Typography>
              <List dense disablePadding>
                {(result?.suggestedTasks || []).map((t, i) => (
                  <div key={i}>
                    <ListItem>
                      <ListItemText primary={t.title} secondary={(t.description || '').trim() || '—'} />
                    </ListItem>
                    {i < (result?.suggestedTasks || []).length - 1 && <Divider component="li" />}
                  </div>
                ))}
              </List>
            </Paper>
          )}
        </>
      )}
      {home && <PlanChat homeId={home._id} />}
    </Stack>
  )
}


