import { useEffect, useMemo, useRef, useState } from 'react'
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
import IconButton from '@mui/material/IconButton'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

export default function PlanningKnowledge() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [docs, setDocs] = useState([])
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [tradeId, setTradeId] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [file, setFile] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    api.getHome(id).then(setHome).catch(() => {})
    refresh()
  }, [id])

  async function refresh() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:5051/api')}/ai/knowledge?homeId=${encodeURIComponent(id)}`, {
        headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' }
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setDocs(Array.isArray(json.documents) ? json.documents : [])
    } catch (_e) {}
  }

  async function onUpload() {
    if (!file || !title.trim()) return
    try {
      setBusy(true)
      // upload file to S3
      const form = new FormData()
      form.append('file', file)
      form.append('folderName', `homes/${id}/knowledge`)
      const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:5051/api')}/file-storage/upload`, {
        method: 'POST',
        headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        body: form
      })
      if (!uploadRes.ok) throw new Error(await uploadRes.text())
      const uploaded = await uploadRes.json()
      const fileUrl = uploaded?.data?.fileUrl
      // create knowledge doc (triggers ingestion)
      const payload = {
        url: fileUrl,
        title: title.trim(),
        trade: tradeId ? (home?.trades || []).find(t => t._id === tradeId)?.name || '' : '',
        city: (city || '').trim(),
        state: (state || '').trim(),
        contentType: file?.type || ''
      }
      const createRes = await fetch(`${import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:5051/api')}/ai/knowledge/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify(payload)
      })
      if (!createRes.ok) throw new Error(await createRes.text())
      await refresh()
      setTitle('')
      setTradeId('')
      setCity('')
      setState('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (_e) {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(docId) {
    if (!window.confirm('Delete this knowledge document and its embeddings?')) return
    try {
      setBusy(true)
      const res = await fetch(`${import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:5051/api')}/ai/knowledge/${encodeURIComponent(id)}/${encodeURIComponent(docId)}`, {
        method: 'DELETE',
        headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) }
      })
      if (!res.ok) throw new Error(await res.text())
      await refresh()
    } catch (_e) {
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Knowledge Base"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Knowledge Base' }
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={onUpload} disabled={busy || !file || !title.trim()}>
              {busy ? 'Uploading…' : 'Upload & Ingest'}
            </Button>
          </Stack>
        }
      />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Upload document</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Select fullWidth size="small" displayEmpty value={tradeId} onChange={(e) => setTradeId(e.target.value)}>
              <MenuItem value="">No trade</MenuItem>
              {(home?.trades || []).map((t) => (<MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>))}
            </Select>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField fullWidth size="small" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField fullWidth size="small" label="State" value={state} onChange={(e) => setState(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Supported: PDF (best), text files. Other formats will be ingested as raw text if possible.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Documents</Typography>
        <Grid container spacing={2}>
          {(docs || []).map((d) => (
            <Grid key={d._id} item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{d.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{d.url}</Typography>
                  <Typography variant="body2">Trade: {d.trade || '—'}</Typography>
                  <Typography variant="body2">Location: {d.city || '—'}{d.state ? (d.city ? ', ' : '') + d.state : ''}</Typography>
                  <Typography variant="body2">Chunks: {d.chunkCount || 0}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" href={d.url} target="_blank" rel="noreferrer">Open</Button>
                    <IconButton size="small" color="error" onClick={() => onDelete(d._id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {!docs.length && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">No knowledge documents yet.</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Stack>
  )
}


