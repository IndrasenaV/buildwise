import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

export default function HomeDailyLogs() {
  const { id } = useParams()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'note',
    timestamp: '',
    message: ''
  })

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const res = await api.listDailyLogs(id, { limit: 50 })
      setItems(Array.isArray(res.items) ? res.items : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) refresh()
  }, [id])

  async function createLog(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        type: form.type,
        timestamp: form.timestamp ? new Date(form.timestamp).toISOString() : new Date().toISOString(),
        message: form.message
      }
      await api.createDailyLog(id, payload)
      setForm({ type: 'note', timestamp: '', message: '' })
      await refresh()
    } catch (e2) {
      setError(e2.message)
    }
  }

  const typeOptions = useMemo(() => ([
    { value: 'note', label: 'Note' },
    { value: 'weather', label: 'Weather' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'incident', label: 'Incident' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' },
  ]), [])

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Daily Logs</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Create Log Entry</Typography>
        <Stack spacing={2} component="form" onSubmit={createLog}>
          <TextField
            select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {typeOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Timestamp"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={form.timestamp}
            onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
          />
          <TextField
            label="Message"
            multiline
            minRows={2}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <TextField
            label="Message"
            multiline
            minRows={2}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <Box>
            <Button type="submit" variant="contained" disabled={loading}>Add Log</Button>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Recent Entries</Typography>
        <List dense disablePadding>
          {items.map((it, idx) => (
            <div key={it._id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={`${new Date(it.timestamp || it.createdAt).toLocaleString()} — ${it.type || 'note'}`}
                  secondary={[
                    it.message || '',
                    (it.author?.fullName || it.author?.email) ? ` • by ${it.author?.fullName || it.author?.email}` : ''
                  ].filter(Boolean).join('')}
                />
              </ListItem>
              {idx < items.length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!items.length && <Typography variant="body2" color="text.secondary">No entries yet</Typography>}
        </List>
      </Paper>
    </Stack>
  )
}


