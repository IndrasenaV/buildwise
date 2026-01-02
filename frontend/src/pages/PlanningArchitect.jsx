import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PageHeader from '../components/PageHeader.jsx'
import UploadDocumentDialog from '../components/UploadDocumentDialog.jsx'
import AddIcon from '@mui/icons-material/Add'
import Link from '@mui/material/Link'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export default function PlanningArchitect() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForCategory, setUploadForCategory] = useState('architecture_base')
  const [busy, setBusy] = useState(false)
  const [addTaskDlg, setAddTaskDlg] = useState({ open: false, title: '', description: '', tradeId: '', phaseKey: 'planning' })
  const [pageDlg, setPageDlg] = useState({ open: false, busy: false, error: '', docId: '', pages: [] })
  // Legacy dialog references guarded off; define to avoid reference errors
  const [analyzeDlg, setAnalyzeDlg] = useState({ open: false, busy: false, result: null })
  const [reqList, setReqList] = useState([])
  const [newReq, setNewReq] = useState('')
  const [reqSaving, setReqSaving] = useState(false)
  const [reqSaved, setReqSaved] = useState(false)
  const [kb, setKb] = useState(null)

  useEffect(() => {
    api.getHome(id).then((h) => {
      setHome(h)
      try {
        const raw = Array.isArray(h?.requirementsList) ? h.requirementsList : []
        if (raw.length) {
          const normalized = raw.map((it) => {
            if (typeof it === 'string') return { text: String(it || ''), tags: [] }
            return { text: String(it?.text || ''), tags: Array.isArray(it?.tags) ? it.tags : [] }
          }).filter((it) => it.text)
          setReqList(normalized)
        } else {
          const single = String(h?.requirements || '').trim()
          setReqList(single ? [{ text: single, tags: [] }] : [])
        }
      } catch { }
      setReqSaved(false)
    }).catch(() => { })
  }, [id])
  // Simple heuristic categorizer to add tags
  function categorizeRequirement(text) {
    const t = String(text || '').toLowerCase()
    const tags = []
    if (/bed|bedroom|bath|kitchen|living|garage|office|study|dining/.test(t)) tags.push('rooms')
    if (/square ?feet|sqft|sf|area|size|layout|open concept|open-plan/.test(t)) tags.push('layout')
    if (/window|light|sunlight|daylight|natural light/.test(t)) tags.push('lighting')
    if (/door|entry|hallway|wheelchair|accessib|ada|ramp/.test(t)) tags.push('accessibility')
    if (/budget|cost|price|afford|savings|value/.test(t)) tags.push('budget')
    if (/deadline|timeline|schedule|move[- ]?in|completion/.test(t)) tags.push('timeline')
    if (/style|modern|traditional|farmhouse|contemporary|aesthetic/.test(t)) tags.push('style')
    if (/solar|efficient|insulation|hvac|energy|green|sustain/.test(t)) tags.push('sustainability')
    if (/patio|deck|yard|garden|outdoor|pool/.test(t)) tags.push('outdoor')
    if (/plumbing|electrical|hvac|mechanical|appliance/.test(t)) tags.push('utilities')
    if (/must[- ]?have|require|mandatory|need/.test(t)) tags.push('priority:must')
    if (/nice[- ]?to[- ]?have|optional|wish/.test(t)) tags.push('priority:nice')
    return Array.from(new Set(tags))
  }


  useEffect(() => {
    let mounted = true
    api.getArchitectureQuestions().then((res) => {
      if (!mounted) return
      setKb(res?.questions || null)
    }).catch(() => { })
    return () => { mounted = false }
  }, [])

  const answeredEntries = useMemo(() => Object.entries(home?.requirementsInterview?.answers || {}), [home])
  const idToLabel = useMemo(() => {
    const map = {}
    const node = kb
    if (node && Array.isArray(node.sections)) {
      for (const s of node.sections) {
        const qs = Array.isArray(s.questions) ? s.questions : []
        for (const q of qs) {
          if (q?.id && q?.text) map[q.id] = q.text
        }
      }
    }
    return map
  }, [kb])

  function openPreview(url, title) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function onDelete(docId) {
    if (!window.confirm('Delete this document from the project? This cannot be undone.')) return
    try {
      setBusy(true)
      const res = await api.deleteDocument(id, docId)
      setHome(res.home)
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  const byCategory = useMemo(() => {
    const items = Array.isArray(home?.documents) ? home.documents : []
    const pick = (cat) => items.filter((d) => (d.category || '') === cat)
      .sort((a, b) => (Number(b.version || 0) - Number(a.version || 0)) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    return {
      architecture_base: pick('architecture_base'),
      architecture_structural: pick('architecture_structural'),
      architecture_foundation: pick('architecture_foundation'),
      architecture_mep: pick('architecture_mep'),
    }
  }, [home])

  function Section({ title, catKey, optional }) {
    const items = byCategory[catKey] || []
    const finalItem = items.find((d) => d.isFinal)
    return (
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title} {!optional && !items.length ? <span style={{ color: '#ff7961', fontWeight: 400, fontSize: 12 }}>(required)</span> : null}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => { setUploadForCategory(catKey); setUploadOpen(true) }}>
            Upload
          </Button>
        </Box>
        {finalItem && (
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Final: v{finalItem.version || '—'} — {finalItem.title || finalItem.fileName || 'Document'}
            {(finalItem.analysis && (finalItem.analysis.houseType || finalItem.analysis.roofType || finalItem.analysis.exteriorType)) && (
              <span style={{ display: 'inline-block', marginLeft: 8, color: '#90caf9' }}>
                Detected — House: {finalItem.analysis.houseType || '—'}, Roof: {finalItem.analysis.roofType || '—'}, Exterior: {finalItem.analysis.exteriorType || '—'}
                {finalItem.analysis.analyzedAt ? ` (at ${new Date(finalItem.analysis.analyzedAt).toLocaleString()})` : ''}
              </span>
            )}
          </Typography>
        )}
        {finalItem?.analysis?.suggestions?.length ? (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: .5 }}>Suggestions</Typography>
            <List dense disablePadding>
              {finalItem.analysis.suggestions.map((s, idx) => (
                <div key={idx}>
                  <ListItem>
                    <ListItemText primary={s} />
                  </ListItem>
                  {idx < finalItem.analysis.suggestions.length - 1 && <Divider component="li" />}
                </div>
              ))}
            </List>
          </Box>
        ) : null}
        {finalItem?.analysis?.suggestedTasks?.length ? (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: .5 }}>Suggested Tasks</Typography>
            <List dense disablePadding>
              {finalItem.analysis.suggestedTasks.map((t, idx) => (
                <div key={idx}>
                  <ListItem
                    secondaryAction={
                      <Button size="small" variant="outlined" onClick={() => setAddTaskDlg({ open: true, title: t.title, description: t.description || '', tradeId: '', phaseKey: (t.phaseKey || 'planning') })}>Add</Button>
                    }
                  >
                    <ListItemText
                      primary={t.title}
                      secondary={
                        <span>
                          {(t.description || '').trim() || '—'} {t.phaseKey ? ` · Phase: ${t.phaseKey}` : ''}
                        </span>
                      }
                    />
                  </ListItem>
                  {idx < finalItem.analysis.suggestedTasks.length - 1 && <Divider component="li" />}
                </div>
              ))}
            </List>
          </Box>
        ) : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Version</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Analysis</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Final</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((d) => {
              const name = d.fileName || d.title || (d.url || '').split('/').pop() || 'File'
              const uploadedAt = d.createdAt ? new Date(d.createdAt).toLocaleString() : ''
              const isFinal = !!d.isFinal
              return (
                <TableRow key={d._id}>
                  <TableCell>{d.version || '—'}</TableCell>
                  <TableCell sx={{ wordBreak: 'break-all' }}>{d.title || name}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {d.analysis ? `House: ${d.analysis.houseType || '—'}, Roof: ${d.analysis.roofType || '—'}, Ext: ${d.analysis.exteriorType || '—'}` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{uploadedAt || '—'}</TableCell>
                  <TableCell>{isFinal ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Classify pages">
                      <span>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            setPageDlg({ open: true, busy: true, error: '', docId: d._id, pages: [] })
                            try {
                              const resp = await api.classifyArchitecturePages(id, d._id)
                              const pages = (resp?.pages || []).map((p) => {
                                const lbl = String(p.label || '').toLowerCase()
                                const isFloor = lbl.includes('floor')
                                return { ...p, selected: isFloor }
                              })
                              setPageDlg((s) => ({ ...s, busy: false, pages }))
                            } catch (e) {
                              setPageDlg((s) => ({ ...s, busy: false, error: String(e?.message || 'Classification failed') }))
                            }
                          }}
                        >
                          🗂
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => openPreview(d.url, name)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" component={Link} href={d.url} download target="_blank" rel="noreferrer">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Analyze">
                      <span>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            navigate(`/homes/${id}/planning/architect/analysis/${d._id}`)
                          }}
                        >
                          ⚙
                        </IconButton>
                      </span>
                    </Tooltip>
                    {!isFinal && ['architecture_base', 'architecture_structural', 'architecture_foundation', 'architecture_mep'].includes(catKey) && (
                      <Tooltip title="Mark as Final">
                        <span>
                          <IconButton
                            size="small"
                            disabled={busy}
                            onClick={async () => {
                              try {
                                setBusy(true)
                                const updated = await api.updateDocument(id, d._id, { isFinal: true })
                                setHome(updated)
                              } catch { }
                              finally { setBusy(false) }
                            }}
                          >
                            ✓
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <span>
                        <IconButton size="small" color="error" disabled={busy} onClick={() => onDelete(d._id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
            {!items.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">No documents</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Architect Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Architect' }
        ]}
      />
      {home && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Homeowner Requirements</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Add goals, preferences, and constraints to tailor architecture analysis and suggestions.
          </Typography>
          {reqSaved && <Typography variant="caption" color="success.main">Saved</Typography>}
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                placeholder="Add a requirement (e.g., 4-bedroom, natural light, open kitchen)"
                value={newReq}
                onChange={(e) => { setNewReq(e.target.value); setReqSaved(false) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = String(newReq || '').trim()
                  if (!v) return
                  const tags = categorizeRequirement(v)
                  setReqList((lst) => [...lst, { text: v, tags }])
                    setNewReq('')
                    e.preventDefault()
                  }
                }}
                fullWidth
              />
              <IconButton
                color="primary"
                size="small"
                aria-label="Add"
                disabled={reqSaving || !String(newReq || '').trim()}
                onClick={() => {
                  const v = String(newReq || '').trim()
                if (!v) return
                const tags = categorizeRequirement(v)
                setReqList((lst) => [...lst, { text: v, tags }])
                  setNewReq('')
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
              <List dense disablePadding>
                {reqList.map((item, idx) => (
                  <div key={idx}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" color="error" onClick={() => {
                          setReqList((lst) => lst.filter((_, i) => i !== idx))
                          setReqSaved(false)
                        }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <TextField
                      value={item.text}
                        onChange={(e) => {
                          const v = e.target.value
                        setReqList((lst) => lst.map((it, i) => (i === idx ? { ...it, text: v } : it)))
                          setReqSaved(false)
                        }}
                        fullWidth
                        size="small"
                      />
                    <Box sx={{ width: 8 }} />
                    <Autocomplete
                      multiple
                      freeSolo
                      size="small"
                      options={[]}
                      value={Array.isArray(item.tags) ? item.tags : []}
                      onChange={(_e, newValue) => {
                        setReqList((lst) => lst.map((it, i) => (i === idx ? { ...it, tags: newValue } : it)))
                        setReqSaved(false)
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} size="small" />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} placeholder="tags" />
                      )}
                      sx={{ minWidth: 160, maxWidth: 240 }}
                    />
                    </ListItem>
                    {idx < reqList.length - 1 && <Divider component="li" />}
                  </div>
                ))}
                {!reqList.length && (
                  <ListItem>
                    <ListItemText primary="No requirements added yet." secondary="Use the field above to add your first requirement." />
                  </ListItem>
                )}
              </List>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              disabled={reqSaving}
              onClick={async () => {
                try {
                  setReqSaving(true)
                  const cleaned = reqList.map((it) => ({
                    text: String(it?.text || '').trim(),
                    tags: Array.isArray(it?.tags) ? it.tags : []
                  })).filter((it) => it.text)
                  const payload = {
                    requirementsList: cleaned,
                    // keep legacy freeform string updated for back-compat elsewhere
                    requirements: cleaned.map((it) => it.text).join('\n')
                  }
                  const updated = await api.updateHome(id, payload)
                  setHome(updated)
                  setReqSaved(true)
                } catch {
                  // ignore
                } finally {
                  setReqSaving(false)
                }
              }}
            >
              {reqSaving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              disabled={reqSaving}
              onClick={() => {
                try {
                  const raw = Array.isArray(home?.requirementsList) ? home.requirementsList : []
                  if (raw.length) {
                    const normalized = raw.map((it) => {
                      if (typeof it === 'string') return { text: String(it || ''), tags: [] }
                      return { text: String(it?.text || ''), tags: Array.isArray(it?.tags) ? it.tags : [] }
                    }).filter((it) => it.text)
                    setReqList(normalized)
                  } else {
                    const single = String(home?.requirements || '').trim()
                    setReqList(single ? [{ text: single, tags: [] }] : [])
                  }
                } catch {}
                setNewReq('')
                setReqSaved(false)
              }}
            >
              Reset
            </Button>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(`/homes/${id}/planning/architect/interview`)}>
              Questionnaire
            </Button>
          </Box>
          {!!answeredEntries.length && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Answered Interview Questions ({answeredEntries.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {answeredEntries.map(([qid, val]) => (
                      <Grid key={qid} item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .5 }}>
                          {idToLabel[qid] || qid}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {String(val)}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" onClick={() => navigate(`/homes/${id}/planning/architect/interview`)}>Edit</Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Paper>
          )}
        </Paper>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Plans & Analysis</Typography>
        {(() => {
          const items = byCategory.architecture_base || []
          const finalItem = items.find((d) => d.isFinal) || items[0]
          if (!items.length) {
            return (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  No base architecture plans uploaded. Upload your plan set to start analysis.
                </Typography>
                <Button variant="contained" onClick={() => { setUploadForCategory('architecture_base'); setUploadOpen(true) }}>
                  Upload
                </Button>
              </Stack>
            )
          }
          return (
            <Stack spacing={1}>
              <Typography variant="body2">
                Current {finalItem?.isFinal ? 'final' : 'latest'}: v{finalItem?.version || '—'} — {finalItem?.title || finalItem?.fileName || 'Document'}
              </Typography>
              {finalItem?.analysis ? (
                <Box sx={{ mt: .5 }}>
                  <Typography variant="subtitle2" sx={{ mb: .5 }}>Detected</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    House: {finalItem.analysis.houseType || '—'} · Roof: {finalItem.analysis.roofType || '—'} · Exterior: {finalItem.analysis.exteriorType || '—'}
                  </Typography>
                  {!!(finalItem.analysis?.suggestions || []).length && (
                    <Typography variant="caption" color="text.secondary">
                      Suggestions available · View full analysis for details
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">No analysis found yet. Open analysis to run.</Typography>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/homes/${id}/planning/architect/analysis/${finalItem?._id}`)}
                >
                  {finalItem?.analysis ? 'View' : 'Open'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => { setUploadForCategory('architecture_base'); setUploadOpen(true) }}
                >
                  Upload
                </Button>
              </Stack>
            </Stack>
          )
        })()}
      </Paper>
      <UploadDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        homeId={id}
        trades={home?.trades || home?.bids || []}
        defaultPinnedType="home"
        defaultDocType={uploadForCategory}
        onCompleted={async (updatedHome, newDoc) => {
          setHome(updatedHome)
          try {
            if (newDoc && String(newDoc.category || '').startsWith('architecture_')) {
              setPageDlg({ open: true, busy: true, error: '', docId: newDoc._id, pages: [] })
              const resp = await api.classifyArchitecturePages(id, newDoc._id)
              const pages = (resp?.pages || []).map((p) => {
                const lbl = String(p.label || '').toLowerCase()
                const isFloor = lbl.includes('floor')
                return { ...p, selected: isFloor }
              })
              setPageDlg((s) => ({ ...s, busy: false, pages }))
            }
          } catch (e) {
            setPageDlg((s) => ({ ...s, busy: false, error: String(e?.message || 'Classification failed') }))
          }
        }}
      />
      <Dialog open={addTaskDlg.open} onClose={() => setAddTaskDlg((d) => ({ ...d, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Add Suggested Task</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={addTaskDlg.title} onChange={(e) => setAddTaskDlg((d) => ({ ...d, title: e.target.value }))} fullWidth />
            <TextField label="Description" value={addTaskDlg.description} onChange={(e) => setAddTaskDlg((d) => ({ ...d, description: e.target.value }))} fullWidth multiline minRows={2} />
            <TextField
              label="Phase"
              value={addTaskDlg.phaseKey}
              onChange={(e) => setAddTaskDlg((d) => ({ ...d, phaseKey: e.target.value }))}
              select
              fullWidth
            >
              {['planning', 'preconstruction', 'exterior', 'interior'].map((p) => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
            </TextField>
            <TextField
              label="Trade"
              value={addTaskDlg.tradeId}
              onChange={(e) => setAddTaskDlg((d) => ({ ...d, tradeId: e.target.value }))}
              select
              fullWidth
            >
              {(home?.trades || []).map((t) => (<MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskDlg((d) => ({ ...d, open: false }))}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!addTaskDlg.tradeId || !addTaskDlg.title}
            onClick={async () => {
              try {
                const res = await api.addTask(id, addTaskDlg.tradeId, { title: addTaskDlg.title, description: addTaskDlg.description, phaseKey: addTaskDlg.phaseKey })
                setHome(res.home)
                setAddTaskDlg({ open: false, title: '', description: '', tradeId: '', phaseKey: 'planning' })
              } catch { }
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      {false && (
        <Dialog open={analyzeDlg.open} onClose={() => (!analyzeDlg.busy ? setAnalyzeDlg((d) => ({ ...d, open: false })) : null)} fullWidth maxWidth="md">
          <DialogTitle>Architecture Analysis</DialogTitle>
          <DialogContent dividers>
            {analyzeDlg.busy ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Analyzing…</Typography>
              </Stack>
            ) : (
              <Stack spacing={2}>
                {analyzeDlg.result?.error && <Typography variant="body2" color="error.main">{analyzeDlg.result.error}</Typography>}
                <Box>
                  <Typography variant="subtitle2">Detected</Typography>
                  <Typography variant="body2">House Type: {analyzeDlg.result?.houseType || '—'}</Typography>
                  <Typography variant="body2">Roof Type: {analyzeDlg.result?.roofType || '—'}</Typography>
                  <Typography variant="body2">Exterior Type: {analyzeDlg.result?.exteriorType || '—'}</Typography>
                </Box>
                {analyzeDlg.result?.functionalScores && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Functional Overview</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FunctionalRadar scores={analyzeDlg.result.functionalScores} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1}>
                          {Object.entries(analyzeDlg.result.functionalScores).map(([k, v]) => (
                            <Box key={k}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{k}</Typography>
                                <Typography variant="caption">{Math.round((v || 0) * 100)}%</Typography>
                              </Stack>
                              <LinearProgress variant="determinate" value={Math.round((v || 0) * 100)} />
                            </Box>
                          ))}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
                {!!(analyzeDlg.result?.roomAnalysis || []).length && (
                  <Box>
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
                        {(analyzeDlg.result?.roomAnalysis || []).map((r, i) => (
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
                  </Box>
                )}
                {(analyzeDlg.result?.costAnalysis && (analyzeDlg.result?.costAnalysis?.summary || (analyzeDlg.result?.costAnalysis?.highImpactItems || []).length || (analyzeDlg.result?.costAnalysis?.valueEngineeringIdeas || []).length)) ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: .5 }}>Cost Efficiency Analysis</Typography>
                    {analyzeDlg.result?.costAnalysis?.summary ? (
                      <Typography variant="body2" sx={{ mb: 1 }}>{analyzeDlg.result.costAnalysis.summary}</Typography>
                    ) : null}
                    {!!(analyzeDlg.result?.costAnalysis?.highImpactItems || []).length && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Key Cost Drivers vs Typical</Typography>
                        <CostDriversChart
                          data={(analyzeDlg.result?.costAnalysis?.highImpactItems || []).map((it) => ({
                            label: it.item,
                            project: Number(it.projectValue ?? 0),
                            typical: Number(it.typicalValue ?? 0),
                          }))}
                        />
                      </Paper>
                    )}
                    {!!(analyzeDlg.result?.costAnalysis?.highImpactItems || []).length && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>High-Impact Items</Typography>
                        <List dense disablePadding>
                          {(analyzeDlg.result?.costAnalysis?.highImpactItems || []).map((it, i) => (
                            <div key={i}>
                              <ListItem>
                                <ListItemText
                                  primary={it.item || 'Item'}
                                  secondary={
                                    <span>
                                      {it.rationale || '—'}
                                      {it.metricName ? ` · ${it.metricName}: ${it.projectValue ?? '—'} (typical ${it.typicalValue ?? '—'})` : ''}
                                      {it.estCostImpact ? ` · Est. Impact: ${typeof it.estCostImpact === 'number' ? `$${it.estCostImpact.toLocaleString()}` : it.estCostImpact}` : ''}
                                    </span>
                                  }
                                />
                              </ListItem>
                              {i < (analyzeDlg.result?.costAnalysis?.highImpactItems || []).length - 1 && <Divider component="li" />}
                            </div>
                          ))}
                        </List>
                      </Box>
                    )}
                    {!!(analyzeDlg.result?.costAnalysis?.valueEngineeringIdeas || []).length && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>Value Engineering Ideas</Typography>
                        <List dense disablePadding>
                          {(analyzeDlg.result?.costAnalysis?.valueEngineeringIdeas || []).map((it, i) => (
                            <div key={i}>
                              <ListItem>
                                <ListItemText
                                  primary={it.idea || 'Idea'}
                                  secondary={`${it.trade ? `Trade: ${it.trade} · ` : ''}${it.estSavings ? `Est. Savings: ${it.estSavings}` : ''}`}
                                />
                              </ListItem>
                              {i < (analyzeDlg.result?.costAnalysis?.valueEngineeringIdeas || []).length - 1 && <Divider component="li" />}
                            </div>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ) : null}
                {(analyzeDlg.result?.accessibilityComfort && ((analyzeDlg.result?.accessibilityComfort?.issues || []).length || (analyzeDlg.result?.accessibilityComfort?.metrics && Object.keys(analyzeDlg.result.accessibilityComfort.metrics).length))) ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: .5 }}>Accessibility & Comfort</Typography>
                    {analyzeDlg.result?.accessibilityComfort?.metrics ? (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>Metrics</Typography>
                        <List dense disablePadding>
                          {Object.entries(analyzeDlg.result.accessibilityComfort.metrics).map(([k, v]) => (
                            <ListItem key={k}><ListItemText primary={`${k}: ${v}`} /></ListItem>
                          ))}
                        </List>
                      </Box>
                    ) : null}
                    {!!(analyzeDlg.result?.accessibilityComfort?.issues || []).length && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: .5 }}>Issues</Typography>
                        <List dense disablePadding>
                          {(analyzeDlg.result?.accessibilityComfort?.issues || []).map((it, i) => (
                            <div key={i}>
                              <ListItem>
                                <ListItemText
                                  primary={`${it.area || 'Area'}${it.severity ? ` · ${it.severity}` : ''}`}
                                  secondary={`${it.issue || '—'}${it.recommendation ? ` · Rec: ${it.recommendation}` : ''}`}
                                />
                              </ListItem>
                              {i < (analyzeDlg.result?.accessibilityComfort?.issues || []).length - 1 && <Divider component="li" />}
                            </div>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ) : null}
                {!!(analyzeDlg.result?.suggestions || []).length && (
                  <Box>
                    <Typography variant="subtitle2">Suggestions</Typography>
                    <List dense disablePadding>
                      {(analyzeDlg.result?.suggestions || []).map((s, i) => (
                        <div key={i}>
                          <ListItem><ListItemText primary={s} /></ListItem>
                          {i < (analyzeDlg.result?.suggestions || []).length - 1 && <Divider component="li" />}
                        </div>
                      ))}
                    </List>
                  </Box>
                )}
                {(analyzeDlg.result?.lightingAnalysis && ((analyzeDlg.result?.lightingAnalysis?.rooms || []).length || analyzeDlg.result?.lightingAnalysis?.summary)) && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: .5 }}>Lighting & Daylight</Typography>
                    {analyzeDlg.result?.lightingAnalysis?.summary ? (
                      <Typography variant="body2" sx={{ mb: 1 }}>{analyzeDlg.result.lightingAnalysis.summary}</Typography>
                    ) : null}
                    {!!(analyzeDlg.result?.lightingAnalysis?.rooms || []).length && (
                      <Box>
                        {(analyzeDlg.result?.lightingAnalysis?.rooms || []).map((r, i) => (
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
                {!!(analyzeDlg.result?.optimizationSuggestions || []).length && (
                  <Box>
                    <Typography variant="subtitle2">Smart Optimization Suggestions</Typography>
                    <List dense disablePadding>
                      {(analyzeDlg.result?.optimizationSuggestions || []).map((s, i) => (
                        <div key={i}>
                          <ListItem>
                            <ListItemText
                              primary={`${s.title || s || 'Suggestion'}${s.impact ? ` · ${s.impact}` : ''}`}
                              secondary={s.description || '—'}
                            />
                          </ListItem>
                          {i < (analyzeDlg.result?.optimizationSuggestions || []).length - 1 && <Divider component="li" />}
                        </div>
                      ))}
                    </List>
                  </Box>
                )}
                {!!(analyzeDlg.result?.suggestedTasks || []).length && (
                  <Box>
                    <Typography variant="subtitle2">Suggested Tasks</Typography>
                    <List dense disablePadding>
                      {(analyzeDlg.result?.suggestedTasks || []).map((t, i) => (
                        <div key={i}>
                          <ListItem
                            secondaryAction={
                              <Button size="small" variant="outlined" onClick={() => setAddTaskDlg({ open: true, title: t.title, description: t.description || '', tradeId: '', phaseKey: (t.phaseKey || 'planning') })}>Add</Button>
                            }
                          >
                            <ListItemText primary={t.title} secondary={(t.description || '').trim() || '—'} />
                          </ListItem>
                          {i < (analyzeDlg.result?.suggestedTasks || []).length - 1 && <Divider component="li" />}
                        </div>
                      ))}
                    </List>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAnalyzeDlg((d) => ({ ...d, open: false }))} disabled={analyzeDlg.busy}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Page Classification Dialog */}
      <Dialog open={pageDlg.open} onClose={() => (!pageDlg.busy ? setPageDlg((s) => ({ ...s, open: false })) : null)} fullWidth maxWidth="lg">
        <DialogTitle>Classify Pages</DialogTitle>
        <DialogContent dividers>
          {pageDlg.busy ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Analyzing pages…</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {!!pageDlg.error && <Typography variant="body2" color="error.main">{pageDlg.error}</Typography>}
              <Grid container spacing={2}>
                {pageDlg.pages.map((p) => (
                  <Grid key={p.index} item xs={12} sm={6} md={4} lg={3}>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Box sx={{ position: 'relative', mb: 1 }}>
                        <img src={p.image} alt={`Page ${p.index + 1}`} style={{ width: '100%', height: 240, objectFit: 'contain', background: 'rgba(255,255,255,0.04)' }} />
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Chip size="small" label={`${p.label || 'unknown'}${typeof p.confidence === 'number' ? ` (${Math.round(p.confidence * 100)}%)` : ''}`} />
                        <FormControlLabel
                          control={<Checkbox checked={!!p.selected} onChange={(e) => {
                            const sel = e.target.checked
                            setPageDlg((s) => ({ ...s, pages: s.pages.map((pg) => (pg.index === p.index ? { ...pg, selected: sel } : pg)) }))
                          }} />}
                          label="Use"
                        />
                      </Stack>
                      {p.title ? <Typography variant="caption" color="text.secondary">{p.title}</Typography> : null}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPageDlg((s) => ({ ...s, open: false }))} disabled={pageDlg.busy}>Close</Button>
          <Button
            variant="contained"
            disabled={pageDlg.busy || !(pageDlg.pages || []).some((p) => p.selected)}
            onClick={async () => {
              try {
                setPageDlg((s) => ({ ...s, busy: true }))
                const selectedPages = (pageDlg.pages || []).filter((p) => p.selected).map((p) => p.index)
                const resp = await api.analyzeArchitectureSelectedPages(id, pageDlg.docId, selectedPages)
                const updatedHome = resp?.home || null
                if (updatedHome) setHome(updatedHome)
                const result = resp?.result || null
                navigate(`/homes/${id}/planning/architect/analysis/${pageDlg.docId}`, { state: { result } })
                setPageDlg((s) => ({ ...s, open: false, busy: false }))
              } catch (e) {
                setPageDlg((s) => ({ ...s, busy: false, error: String(e?.message || 'Analyze selected pages failed') }))
              }
            }}
          >
            Analyze
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}


