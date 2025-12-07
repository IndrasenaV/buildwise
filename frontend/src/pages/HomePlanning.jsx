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
import Link from '@mui/material/Link'
import { useLocation } from 'react-router-dom'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

export default function HomePlanning() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [preview, setPreview] = useState({ open: false, url: '', title: '' })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForCategory, setUploadForCategory] = useState('architecture_base')
  const [busy, setBusy] = useState(false)
  const [addTaskDlg, setAddTaskDlg] = useState({ open: false, title: '', description: '', tradeId: '', phaseKey: 'planning' })
  const [analyzeDlg, setAnalyzeDlg] = useState({ open: false, busy: false, result: null })

  useEffect(() => {
    api.getHome(id).then(setHome).catch(() => {})
  }, [id])
  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const openUpload = params.get('openUpload')
    if (openUpload) {
      setUploadForCategory(openUpload)
      setUploadOpen(true)
    }
  }, [location.search])

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
      permit: items.filter((d) => (d.category || '') === 'permit')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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
            {items.length ? 'Upload New Version' : 'Upload'}
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
        {/* Suggestions */}
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
        {/* Suggested Tasks */}
        {finalItem?.analysis?.suggestedTasks?.length ? (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: .5 }}>Suggested Tasks</Typography>
            <List dense disablePadding>
              {finalItem.analysis.suggestedTasks.map((t, idx) => (
                <div key={idx}>
                  <ListItem
                    secondaryAction={
                      <Button size="small" variant="outlined" onClick={() => setAddTaskDlg({ open: true, title: t.title, description: t.description || '', tradeId: '', phaseKey: (t.phaseKey || 'planning') })}>Add Task</Button>
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
              {catKey.startsWith('architecture_') && <TableCell>Analysis</TableCell>}
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
                  {catKey.startsWith('architecture_') && (
                    <TableCell>
                      <Typography variant="caption">
                        {d.analysis ? `House: ${d.analysis.houseType || '—'}, Roof: ${d.analysis.roofType || '—'}, Ext: ${d.analysis.exteriorType || '—'}` : '—'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>{uploadedAt || '—'}</TableCell>
                  <TableCell>{isFinal ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
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
                    {catKey.startsWith('architecture_') && (
                      <Tooltip title="Analyze">
                        <span>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              setAnalyzeDlg({ open: true, busy: true, result: null })
                              try {
                                const resp = await api.analyzeArchitectureDoc(id, d._id)
                                const updatedHome = resp?.home || resp
                                setHome(updatedHome)
                                setAnalyzeDlg({ open: true, busy: false, result: resp?.result || null })
                              } catch (e) {
                                setAnalyzeDlg({ open: true, busy: false, result: { error: String(e?.message || 'Analysis failed') } })
                              }
                            }}
                          >
                            ⚙
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {!isFinal && ['architecture_base','architecture_structural','architecture_foundation','architecture_mep'].includes(catKey) && (
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
                              } catch {}
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
                <TableCell colSpan={5}>
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
        title="Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning' }
        ]}
        actions={
          <Button variant="contained" onClick={() => { setUploadForCategory('architecture_base'); setUploadOpen(true) }}>Upload</Button>
        }
      />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Architecture</Typography>
        <Stack spacing={2}>
          <Section title="Base Architecture" catKey="architecture_base" optional={false} />
          <Section title="Structural (optional)" catKey="architecture_structural" optional />
          <Section title="Foundation Letter (optional)" catKey="architecture_foundation" optional />
          <Section title="MEP Planning (optional)" catKey="architecture_mep" optional />
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Permits</Typography>
        <Section title="City Permits" catKey="permit" optional />
      </Paper>
      <UploadDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        homeId={id}
        trades={home?.trades || home?.bids || []}
        defaultPinnedType="home"
        defaultDocType={uploadForCategory}
        onCompleted={(updatedHome) => setHome(updatedHome)}
      />
      {/* Add Task Dialog */}
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
              {['planning','preconstruction','exterior','interior'].map((p) => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
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
              } catch {}
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      {/* Analyze Result Dialog */}
      <Dialog open={analyzeDlg.open} onClose={() => (!analyzeDlg.busy ? setAnalyzeDlg((d) => ({ ...d, open: false })) : null)} fullWidth maxWidth="sm">
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
              {!!(analyzeDlg.result?.suggestedTasks || []).length && (
                <Box>
                  <Typography variant="subtitle2">Suggested Tasks</Typography>
                  <List dense disablePadding>
                    {(analyzeDlg.result?.suggestedTasks || []).map((t, i) => (
                      <div key={i}>
                        <ListItem
                          secondaryAction={
                            <Button size="small" variant="outlined" onClick={() => setAddTaskDlg({ open: true, title: t.title, description: t.description || '', tradeId: '', phaseKey: (t.phaseKey || 'planning') })}>Add Task</Button>
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
    </Stack>
  )
}


