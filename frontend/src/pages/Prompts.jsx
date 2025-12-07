import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'

export default function Prompts() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState({ open: false, mode: 'create', key: '', text: '', description: '', contextConfig: { includes: {} } })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await api.listPrompts(query.trim() || undefined)
      setItems(list || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => items, [items])

  async function handleSave() {
    setError('')
    try {
      if (editor.mode === 'create') {
        const body = { key: editor.key.trim(), text: editor.text, description: editor.description || '', contextConfig: editor.contextConfig || null }
        await api.upsertPrompt(body)
      } else {
        await api.updatePrompt(editor.key, { text: editor.text, description: editor.description || '', contextConfig: editor.contextConfig || null })
      }
      setEditor({ open: false, mode: 'create', key: '', text: '', description: '', contextConfig: { includes: {} } })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }
  async function handleDelete(key) {
    if (!confirm(`Delete prompt "${key}"?`)) return
    try {
      await api.deletePrompt(key)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Prompt Management</Typography>
      {error && <Typography variant="body2" color="error.main">{error}</Typography>}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          <TextField
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            sx={{ minWidth: 280 }}
          />
          <Button variant="outlined" onClick={load} disabled={loading}>Search</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditor({ open: true, mode: 'create', key: '', text: '', description: '' })}
          >
            New Prompt
          </Button>
        </Stack>
        <List dense disablePadding sx={{ mt: 2 }}>
          {filtered.map((p, idx) => (
            <div key={p._id || p.key}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton aria-label="edit" size="small" onClick={() => setEditor({ open: true, mode: 'edit', key: p.key, text: p.text, description: p.description || '', contextConfig: p.contextConfig || { includes: {} } })}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="delete" size="small" onClick={() => handleDelete(p.key)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={p.key}
                  secondary={<span>{p.description || '—'} {p.updatedAt ? `• Updated ${new Date(p.updatedAt).toLocaleString()}` : ''}</span>}
                />
              </ListItem>
              {idx < filtered.length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!filtered.length && <Typography variant="body2" color="text.secondary">No prompts.</Typography>}
        </List>
      </Paper>
      <Dialog open={editor.open} onClose={() => setEditor((e) => ({ ...e, open: false }))} fullWidth maxWidth="md">
        <DialogTitle>{editor.mode === 'create' ? 'Create Prompt' : `Edit Prompt: ${editor.key}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Key"
              value={editor.key}
              onChange={(e) => setEditor((v) => ({ ...v, key: e.target.value }))}
              fullWidth
              disabled={editor.mode !== 'create'}
              placeholder="e.g., system.analyze, architecture.analyze, bid.trade.electrical"
            />
            <TextField
              label="Description"
              value={editor.description}
              onChange={(e) => setEditor((v) => ({ ...v, description: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Text"
              value={editor.text}
              onChange={(e) => setEditor((v) => ({ ...v, text: e.target.value }))}
              fullWidth
              multiline
              minRows={8}
            />
            <ContextEditor value={editor.contextConfig} onChange={(cfg) => setEditor((v) => ({ ...v, contextConfig: cfg }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditor((e) => ({ ...e, open: false }))}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!editor.key.trim() || !editor.text.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function csvToArray(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}
function arrayToCsv(arr) {
  return Array.isArray(arr) ? arr.join(', ') : ''
}

function ContextEditor({ value, onChange }) {
  const cfg = value && typeof value === 'object' ? value : { includes: {} }
  const includes = cfg.includes || {}
  function toggle(section, on) {
    const next = { ...cfg, includes: { ...includes } }
    if (!on) {
      delete next.includes[section]
    } else {
      if (!next.includes[section]) next.includes[section] = {}
    }
    onChange(next)
  }
  function setSection(section, patch) {
    const next = { ...cfg, includes: { ...includes, [section]: { ...(includes[section] || {}), ...patch } } }
    onChange(next)
  }
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Context (Optional)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Select which parts of a Home/Trade/Task to include when building context for this prompt.
      </Typography>
      <Stack spacing={2}>
        <SectionToggle
          label="Home"
          enabled={Boolean(includes.home)}
          onToggle={(on) => toggle('home', on)}
        >
          <TextField
            label="Fields (comma separated)"
            value={arrayToCsv(includes.home?.fields)}
            onChange={(e) => setSection('home', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="name, address, city, state, zip"
          />
        </SectionToggle>
        <SectionToggle
          label="Trades"
          enabled={Boolean(includes.trades)}
          onToggle={(on) => toggle('trades', on)}
        >
          <FormControlLabel
            control={<Checkbox checked={Boolean(includes.trades?.onlyCurrent)} onChange={(e) => setSection('trades', { onlyCurrent: e.target.checked })} />}
            label="Only current trade"
          />
          <TextField
            label="Fields"
            value={arrayToCsv(includes.trades?.fields)}
            onChange={(e) => setSection('trades', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="name, totalPrice, notes"
          />
        </SectionToggle>
        <SectionToggle
          label="Tasks"
          enabled={Boolean(includes.tasks)}
          onToggle={(on) => toggle('tasks', on)}
        >
          <FormControlLabel
            control={<Checkbox checked={Boolean(includes.tasks?.onlyCurrent)} onChange={(e) => setSection('tasks', { onlyCurrent: e.target.checked })} />}
            label="Only current task"
          />
          <TextField
            label="Fields"
            value={arrayToCsv(includes.tasks?.fields)}
            onChange={(e) => setSection('tasks', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="title, description, phaseKey, status"
          />
        </SectionToggle>
        <SectionToggle
          label="Quality Checks"
          enabled={Boolean(includes.qualityChecks)}
          onToggle={(on) => toggle('qualityChecks', on)}
        >
          <TextField
            label="Fields"
            value={arrayToCsv(includes.qualityChecks?.fields)}
            onChange={(e) => setSection('qualityChecks', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="title, phaseKey, accepted, acceptedBy, acceptedAt"
          />
        </SectionToggle>
        <SectionToggle
          label="Documents"
          enabled={Boolean(includes.documents)}
          onToggle={(on) => toggle('documents', on)}
        >
          <TextField
            label="Categories (comma separated)"
            value={arrayToCsv(includes.documents?.categories)}
            onChange={(e) => setSection('documents', { categories: csvToArray(e.target.value) })}
            fullWidth
            placeholder="bid, contract, invoice, picture"
          />
          <FormControlLabel
            control={<Checkbox checked={Boolean(includes.documents?.onlyFinal)} onChange={(e) => setSection('documents', { onlyFinal: e.target.checked })} />}
            label="Only final documents"
          />
          <TextField
            label="Limit"
            type="number"
            value={Number(includes.documents?.limit || 50)}
            onChange={(e) => setSection('documents', { limit: Math.max(1, Number(e.target.value || 1)) })}
            sx={{ maxWidth: 160 }}
          />
          <TextField
            label="Fields"
            value={arrayToCsv(includes.documents?.fields)}
            onChange={(e) => setSection('documents', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="title, category, fileName, createdAt, isFinal"
          />
        </SectionToggle>
        <SectionToggle
          label="Messages"
          enabled={Boolean(includes.messages)}
          onToggle={(on) => toggle('messages', on)}
        >
          <TextField
            label="Scope"
            select
            value={String(includes.messages?.scope || 'home')}
            onChange={(e) => setSection('messages', { scope: e.target.value })}
            sx={{ maxWidth: 220 }}
          >
            <MenuItem value="home">Home</MenuItem>
            <MenuItem value="trade">Trade</MenuItem>
            <MenuItem value="task">Task</MenuItem>
          </TextField>
          <TextField
            label="Limit"
            type="number"
            value={Number(includes.messages?.limit || 50)}
            onChange={(e) => setSection('messages', { limit: Math.max(1, Math.min(Number(e.target.value || 1), 200)) })}
            sx={{ maxWidth: 160 }}
          />
        </SectionToggle>
        <SectionToggle
          label="Schedules"
          enabled={Boolean(includes.schedules)}
          onToggle={(on) => toggle('schedules', on)}
        >
          <TextField
            label="Fields"
            value={arrayToCsv(includes.schedules?.fields)}
            onChange={(e) => setSection('schedules', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="title, startsAt, endsAt, bidId, taskId"
          />
        </SectionToggle>
        <SectionToggle
          label="Contacts"
          enabled={Boolean(includes.contacts)}
          onToggle={(on) => toggle('contacts', on)}
        >
          <TextField
            label="Fields"
            value={arrayToCsv(includes.contacts?.fields)}
            onChange={(e) => setSection('contacts', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="company, fullName, email, phone, isPrimary"
          />
        </SectionToggle>
        <SectionToggle
          label="Budget"
          enabled={Boolean(includes.budget)}
          onToggle={(on) => toggle('budget', on)}
        >
          <TextField
            label="Fields"
            value={arrayToCsv(includes.budget?.fields)}
            onChange={(e) => setSection('budget', { fields: csvToArray(e.target.value) })}
            fullWidth
            placeholder="totalPrice, totalPaid"
          />
        </SectionToggle>
      </Stack>
    </Paper>
  )
}

function SectionToggle({ label, enabled, onToggle, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <FormControlLabel
        control={<Checkbox checked={enabled} onChange={(e) => onToggle(e.target.checked)} />}
        label={label}
      />
      {enabled && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {children}
        </Stack>
      )}
    </Paper>
  )
}

