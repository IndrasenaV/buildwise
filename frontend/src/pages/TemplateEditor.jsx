import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

const PHASES = ['preconstruction', 'exterior', 'interior']

export default function TemplateEditor() {
  const { id } = useParams()
  const [tmpl, setTmpl] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function refresh() {
    setError('')
    try {
      const t = await api.getTemplate(id)
      setTmpl(t)
    } catch (e) {
      setError(e.message || 'Failed to load template')
    }
  }

  useEffect(() => { refresh() }, [id])

  const isDraft = useMemo(() => (tmpl?.status === 'draft'), [tmpl])

  // Dialog state for adding task/check
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('task') // 'task' | 'check'
  const [dialogTradeId, setDialogTradeId] = useState('')
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogDesc, setDialogDesc] = useState('')
  const [dialogPhase, setDialogPhase] = useState('preconstruction')

  async function saveMeta() {
    if (!isDraft) return
    setSaving(true)
    try {
      await api.updateTemplate(tmpl._id, { name: tmpl.name, description: tmpl.description })
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function addTrade() {
    if (!isDraft) return
    const name = prompt('Trade name?')
    if (!name) return
    try {
      await api.addTemplateTrade(tmpl._id, { name, phaseKeys: ['preconstruction'] })
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  async function removeTrade(tradeId) {
    if (!isDraft) return
    try {
      await api.deleteTemplateTrade(tmpl._id, tradeId)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  async function addTask(tradeId) {
    if (!isDraft) return
    setDialogMode('task')
    setDialogTradeId(tradeId)
    setDialogTitle('')
    setDialogDesc('')
    setDialogPhase('preconstruction')
    setDialogOpen(true)
  }

  async function removeTask(tradeId, taskId) {
    if (!isDraft) return
    try {
      await api.deleteTemplateTask(tmpl._id, tradeId, taskId)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  async function addCheck(tradeId) {
    if (!isDraft) return
    setDialogMode('check')
    setDialogTradeId(tradeId)
    setDialogTitle('')
    setDialogDesc('')
    setDialogPhase('preconstruction')
    setDialogOpen(true)
  }

  async function removeCheck(tradeId, checkId) {
    if (!isDraft) return
    try {
      await api.deleteTemplateQualityCheck(tmpl._id, tradeId, checkId)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  async function freeze() {
    try {
      await api.freezeTemplate(tmpl._id)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!tmpl) return null

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Edit Template</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField label="Template Key" value={tmpl.templateKey} disabled />
          <TextField
            label="Name"
            value={tmpl.name}
            disabled={!isDraft}
            onChange={(e) => setTmpl({ ...tmpl, name: e.target.value })}
          />
          <TextField
            label="Description"
            value={tmpl.description || ''}
            disabled={!isDraft}
            onChange={(e) => setTmpl({ ...tmpl, description: e.target.value })}
            multiline
          />
          <Stack direction="row" spacing={1}>
            <Chip label={`Version ${tmpl.version}`} />
            <Chip label={tmpl.status} color={tmpl.status === 'frozen' ? 'warning' : 'default'} />
            {isDraft && <Button variant="outlined" onClick={saveMeta} disabled={saving}>Save</Button>}
            {isDraft && <Button variant="outlined" color="warning" onClick={freeze}>Freeze</Button>}
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Trades</Typography>
        {isDraft && <Button onClick={addTrade} startIcon={<AddIcon />}>Add Trade</Button>}
      </Stack>
      {(tmpl.trades || []).map((tr) => (
        <Paper key={tr._id} variant="outlined" sx={{ p: 2, mb: 1 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">{tr.name}</Typography>
              {isDraft && <IconButton size="small" onClick={() => removeTrade(tr._id)}><DeleteIcon fontSize="small" /></IconButton>}
            </Stack>
            <FormControl size="small" disabled={!isDraft} sx={{ maxWidth: 360 }}>
              <InputLabel id={`phasekeys-${tr._id}`}>Phases</InputLabel>
              <Select
                multiple
                labelId={`phasekeys-${tr._id}`}
                label="Phases"
                value={tr.phaseKeys}
                onChange={async (e) => {
                  const newTrades = (tmpl.trades || []).map((x) => x._id === tr._id ? { ...x, phaseKeys: e.target.value } : x)
                  try {
                    await api.updateTemplate(tmpl._id, { trades: newTrades })
                    await refresh()
                  } catch (err) {
                    setError(err.message)
                  }
                }}
                renderValue={(selected) => selected.join(', ')}
              >
                {PHASES.map((p) => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Tasks</Typography>
              {isDraft && <Button size="small" onClick={() => addTask(tr._id)}>Add Task</Button>}
            </Stack>
            <Stack spacing={1}>
              {(tr.tasks || []).map((tk) => (
                <Stack key={tk._id} direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="Title" value={tk.title} disabled />
                  <TextField size="small" label="Phase" value={tk.phaseKey} disabled />
                  {isDraft && <IconButton size="small" onClick={() => removeTask(tr._id, tk._id)}><DeleteIcon fontSize="small" /></IconButton>}
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Quality Checks</Typography>
              {isDraft && <Button size="small" onClick={() => addCheck(tr._id)}>Add Check</Button>}
            </Stack>
            <Stack spacing={1}>
              {(tr.qualityChecks || []).map((qc) => (
                <Stack key={qc._id} direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="Title" value={qc.title} disabled />
                  <TextField size="small" label="Phase" value={qc.phaseKey} disabled />
                  {isDraft && <IconButton size="small" onClick={() => removeCheck(tr._id, qc._id)}><DeleteIcon fontSize="small" /></IconButton>}
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Paper>
      ))}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === 'task' ? 'Add Task' : 'Add Quality Check'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={dialogTitle}
              onChange={(e) => setDialogTitle(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label={dialogMode === 'task' ? 'Description' : 'Notes'}
              value={dialogDesc}
              onChange={(e) => setDialogDesc(e.target.value)}
              multiline
            />
            <FormControl fullWidth>
              <InputLabel id="dlg-phase">Phase</InputLabel>
              <Select
                labelId="dlg-phase"
                label="Phase"
                value={dialogPhase}
                onChange={(e) => setDialogPhase(e.target.value)}
              >
                {PHASES.map((p) => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!dialogTitle}
            onClick={async () => {
              try {
                if (dialogMode === 'task') {
                  await api.addTemplateTask(tmpl._id, dialogTradeId, {
                    title: dialogTitle,
                    description: dialogDesc,
                    phaseKey: dialogPhase
                  })
                } else {
                  await api.addTemplateQualityCheck(tmpl._id, dialogTradeId, {
                    title: dialogTitle,
                    notes: dialogDesc,
                    phaseKey: dialogPhase
                  })
                }
                setDialogOpen(false)
                await refresh()
              } catch (e) {
                setError(e.message)
              }
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}



