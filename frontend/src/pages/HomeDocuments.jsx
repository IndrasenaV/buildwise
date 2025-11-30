import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

export default function HomeDocuments() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [pinType, setPinType] = useState('home')
  const [pinId, setPinId] = useState('')

  useEffect(() => {
    api.getHome(id).then(setHome).catch((e) => setError(e.message))
  }, [id])

  const docs = useMemo(() => {
    if (!home?.documents) return []
    let items = home.documents
    if (filter === 'pdf') {
      items = items.filter((d) => (d.url || '').toLowerCase().endsWith('.pdf'))
    } else if (filter === 'photos') {
      items = items.filter((d) => /\.(png|jpg|jpeg|webp|gif)$/i.test(d.url || ''))
    }
    return items
  }, [home, filter])

  async function addDoc(e) {
    e.preventDefault()
    setError('')
    try {
      const body = {
        title,
        url,
        pinnedTo: { type: pinType, id: pinType === 'home' ? undefined : pinId },
      }
      const res = await api.addDocument(id, body)
      setHome(res.home)
      setTitle('')
      setUrl('')
      setPinType('home')
      setPinId('')
    } catch (e2) {
      setError(e2.message)
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Add Document (by URL)</Typography>
        <Stack component="form" spacing={2} onSubmit={addDoc}>
          <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="URL" required value={url} onChange={(e) => setUrl(e.target.value)} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="pin-type">Pin To</InputLabel>
              <Select labelId="pin-type" label="Pin To" value={pinType} onChange={(e) => setPinType(e.target.value)}>
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="bid">Bid</MenuItem>
                <MenuItem value="task">Task</MenuItem>
              </Select>
            </FormControl>
            {pinType !== 'home' && (
              <FormControl fullWidth>
                <InputLabel id="pin-id">Select {pinType}</InputLabel>
                <Select
                  labelId="pin-id"
                  label={`Select ${pinType}`}
                  value={pinId}
                  onChange={(e) => setPinId(e.target.value)}
                >
                  {pinType === 'bid' &&
                    (home?.bids || []).map((b) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                  {pinType === 'task' &&
                    (home?.bids || []).flatMap((b) =>
                      (b.tasks || []).map((t) => (
                        <MenuItem key={t._id} value={t._id}>{`${b.name} — ${t.title}`}</MenuItem>
                      ))
                    )}
                </Select>
              </FormControl>
            )}
          </Stack>
          <Button variant="contained" type="submit">Add</Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Documents</Typography>
          <FormControl size="small">
            <InputLabel id="doc-filter">Filter</InputLabel>
            <Select labelId="doc-filter" label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pdf">PDFs</MenuItem>
              <MenuItem value="photos">Photos</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <List dense disablePadding>
          {docs.map((d, idx) => (
            <div key={d._id}>
              <ListItem>
                <ListItemText
                  primary={<a href={d.url} target="_blank" rel="noreferrer">{d.title}</a>}
                  secondary={`${d.pinnedTo?.type || 'home'}${d.pinnedTo?.id ? ` • ${d.pinnedTo.id}` : ''}`}
                />
              </ListItem>
              {idx < docs.length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!docs.length && <Typography variant="body2" color="text.secondary">No documents</Typography>}
        </List>
      </Paper>
    </Stack>
  )
}


