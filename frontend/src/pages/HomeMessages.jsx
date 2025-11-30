import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import AddTaskIcon from '@mui/icons-material/AddTask'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import SendIcon from '@mui/icons-material/Send'
import FilterListIcon from '@mui/icons-material/FilterList'

export default function HomeMessages() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [tradeFilter, setTradeFilter] = useState('')
  const [taskFilter, setTaskFilter] = useState('')
  const [composer, setComposer] = useState({ text: '', tradeId: '', taskId: '' })
  const [files, setFiles] = useState([])
  const [createTaskDlg, setCreateTaskDlg] = useState({ open: false, messageId: '', tradeId: '', title: '', phaseKey: 'preconstruction' })
  const [filterDlg, setFilterDlg] = useState({ open: false, tradeId: '', taskId: '' })

  useEffect(() => {
    api.getHome(id).then(setHome).catch((e) => setError(e.message))
  }, [id])

  async function loadMessages() {
    setError('')
    try {
      const list = await api.listMessages(id, { tradeId: tradeFilter || undefined, taskId: taskFilter || undefined, limit: 100 })
      setMessages(list || [])
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => { loadMessages() }, [id, tradeFilter, taskFilter])

  const trades = useMemo(() => home?.trades || [], [home])
  const tasksByTrade = useMemo(() => {
    const map = {}
    for (const t of trades) map[t._id] = t.tasks || []
    return map
  }, [trades])

  async function uploadToS3(file) {
    const presign = await api.presignUpload({ contentType: file.type || 'application/octet-stream', keyPrefix: `homes/${id}/messages/` })
    const form = new FormData()
    Object.entries(presign.fields || {}).forEach(([k, v]) => form.append(k, v))
    form.append('Content-Type', presign.contentType)
    form.append('file', file)
    const res = await fetch(presign.uploadUrl, { method: 'POST', body: form })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || 'Upload failed')
    }
    // Construct public URL
    const url = presign.bucket && presign.region ? `https://${presign.bucket}.s3.${presign.region}.amazonaws.com/${presign.key}` : presign.uploadUrl
    return { title: file.name, url }
  }

  async function sendMessage() {
    setError('')
    try {
      let attachments = []
      for (const f of files) {
        // only images for now
        attachments.push(await uploadToS3(f))
      }
      await api.createMessage(id, { text: composer.text, tradeId: tradeFilter || '', taskId: taskFilter || '', attachments })
      setComposer({ text: '', tradeId: '', taskId: '' })
      setFiles([])
      await loadMessages()
    } catch (e) {
      setError(e.message)
    }
  }

  async function createTaskFromMessage() {
    setError('')
    try {
      await api.createTaskFromMessage(id, {
        messageId: createTaskDlg.messageId,
        tradeId: createTaskDlg.tradeId,
        title: createTaskDlg.title,
        phaseKey: createTaskDlg.phaseKey,
      })
      setCreateTaskDlg({ open: false, messageId: '', tradeId: '', title: '', phaseKey: 'preconstruction' })
      await api.getHome(id).then(setHome)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <Stack spacing={2} sx={{ minHeight: '70vh' }}>
      <Typography variant="h6">Messages</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, pb: 8, position: 'relative' }}>
        <Typography variant="subtitle1" gutterBottom>All Messages</Typography>
        <List dense disablePadding>
          {(messages || []).map((m, idx) => (
            <div key={m._id}>
              <ListItem
                secondaryAction={
                  <IconButton size="small" onClick={() => setCreateTaskDlg({ open: true, messageId: m._id, tradeId: m.tradeId || '', title: m.text.slice(0, 60), phaseKey: 'preconstruction' })}>
                    <AddTaskIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={m.text}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                      {m.author?.fullName || m.author?.email ? <Chip size="small" label={m.author?.fullName || m.author?.email} /> : null}
                      {m.tradeId ? <Chip size="small" label="Trade Ref" /> : null}
                      {m.taskId ? <Chip size="small" label="Task Ref" /> : null}
                      {(m.attachments || []).map((a, i) => (
                        <a key={`${m._id}-att-${i}`} href={a.url} target="_blank" rel="noreferrer">{a.title || `Attachment ${i + 1}`}</a>
                      ))}
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </Stack>
                  }
                />
              </ListItem>
              {idx < (messages || []).length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!messages.length && <Typography variant="body2" color="text.secondary">No messages yet</Typography>}
        </List>
        {/* Bottom composer with icons for filters and context */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 2,
            p: 1,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
            {/* Composer */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              {/* Filter icon (opens filter dialog) */}
              <IconButton
                size="small"
                color={(tradeFilter || taskFilter) ? 'primary' : 'default'}
                onClick={() => setFilterDlg({ open: true, tradeId: tradeFilter, taskId: taskFilter })}
                title="Filter"
              >
                <FilterListIcon />
              </IconButton>
              <TextField
                placeholder="Write a message…"
                value={composer.text}
                onChange={(e) => setComposer((c) => ({ ...c, text: e.target.value }))}
                fullWidth
                size="small"
              />
              <IconButton component="label" size="small">
                <AddPhotoAlternateIcon />
                <input type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              </IconButton>
              <IconButton color="primary" onClick={sendMessage} disabled={!composer.text}>
                <SendIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Filter dialog */}
      <Dialog open={filterDlg.open} onClose={() => setFilterDlg((d) => ({ ...d, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Filter Messages</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Trade"
              select
              value={filterDlg.tradeId}
              onChange={(e) => setFilterDlg((d) => ({ ...d, tradeId: e.target.value, taskId: '' }))}
            >
              <MenuItem value="">All</MenuItem>
              {(trades || []).map((t) => (<MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>))}
            </TextField>
            <TextField
              label="Task"
              select
              value={filterDlg.taskId}
              onChange={(e) => setFilterDlg((d) => ({ ...d, taskId: e.target.value }))}
              disabled={!filterDlg.tradeId}
            >
              <MenuItem value="">All</MenuItem>
              {(tasksByTrade[filterDlg.tradeId] || []).map((tk) => (<MenuItem key={tk._id} value={tk._id}>{tk.title}</MenuItem>))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDlg((d) => ({ ...d, open: false }))}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setTradeFilter(filterDlg.tradeId || '')
              setTaskFilter(filterDlg.taskId || '')
              setFilterDlg((d) => ({ ...d, open: false }))
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* (Context dialog removed; messages link to active filters by default) */}

      <Dialog open={createTaskDlg.open} onClose={() => setCreateTaskDlg((d) => ({ ...d, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Create Task from Message</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Trade"
              select
              value={createTaskDlg.tradeId}
              onChange={(e) => setCreateTaskDlg((d) => ({ ...d, tradeId: e.target.value }))}
              required
            >
              {(trades || []).map((t) => (<MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>))}
            </TextField>
            <TextField label="Task Title" value={createTaskDlg.title} onChange={(e) => setCreateTaskDlg((d) => ({ ...d, title: e.target.value }))} />
            <TextField label="Phase" select value={createTaskDlg.phaseKey} onChange={(e) => setCreateTaskDlg((d) => ({ ...d, phaseKey: e.target.value }))}>
              <MenuItem value="preconstruction">preconstruction</MenuItem>
              <MenuItem value="exterior">exterior</MenuItem>
              <MenuItem value="interior">interior</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTaskDlg((d) => ({ ...d, open: false }))}>Cancel</Button>
          <Button variant="contained" disabled={!createTaskDlg.title || !createTaskDlg.tradeId} onClick={createTaskFromMessage}>Create Task</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}


