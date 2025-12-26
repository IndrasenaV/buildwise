import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'

export default function Knowledge() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [trade, setTrade] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [file, setFile] = useState(null)
  const fileRef = useRef(null)
  const [keywordOptions, setKeywordOptions] = useState([])
  const [keywordValues, setKeywordValues] = useState([])

  const API = (path) => `${import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:5051/api')}${path}`
  const authHeaders = () => (localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})

  async function refresh() {
    try {
      const res = await fetch(API('/ai/knowledge'), { headers: { ...authHeaders() } })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setDocs(Array.isArray(json.documents) ? json.documents : [])
    } catch {}
  }

  async function loadTaxonomy() {
    try {
      const res = await fetch(API('/ai/knowledge-taxonomy'), { headers: { ...authHeaders() } })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const union = Array.from(new Set([...(json.keywords || []), ...(json.trades || []), ...(json.cities || []), ...(json.states || []), ...(json.zipCodes || []), ...(json.docTypes || [])]))
      union.sort()
      setKeywordOptions(union)
    } catch {}
  }

  useEffect(() => { refresh(); loadTaxonomy() }, [])

  async function onUpload() {
    if (!file || !title.trim()) return
    try {
      setBusy(true)
      const form = new FormData()
      form.append('file', file)
      form.append('folderName', `knowledge`)
      const uploadRes = await fetch(API('/file-storage/upload'), { method: 'POST', headers: { ...authHeaders() }, body: form })
      if (!uploadRes.ok) throw new Error(await uploadRes.text())
      const uploaded = await uploadRes.json()
      const fileUrl = uploaded?.data?.fileUrl
      const knownSet = new Set(keywordOptions.map(v => String(v).toLowerCase()))
      const keywords = []
      const customKeywords = []
      for (const k of (keywordValues || [])) {
        const key = String(k || '').trim()
        if (!key) continue
        if (knownSet.has(key.toLowerCase())) keywords.push(key); else customKeywords.push(key)
      }
      const payload = {
        url: fileUrl,
        title: title.trim(),
        keywords,
        customKeywords,
        contentType: file?.type || ''
      }
      const res = await fetch(API('/ai/knowledge'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(await res.text())
      await refresh()
      setTitle(''); setTrade(''); setCity(''); setState(''); setKeywordValues([]); setFile(null); if (fileRef.current) fileRef.current.value = ''
    } catch {} finally { setBusy(false) }
  }

  async function onDelete(docId) {
    if (!window.confirm('Delete this knowledge document and its embeddings?')) return
    try {
      setBusy(true)
      const res = await fetch(API(`/ai/knowledge/${encodeURIComponent(docId)}`), { method: 'DELETE', headers: { ...authHeaders() } })
      if (!res.ok) throw new Error(await res.text())
      await refresh()
    } catch {} finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Knowledge Base"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Home', href: '/homes' },
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
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              freeSolo
              options={keywordOptions}
              value={keywordValues}
              onChange={(_e, vals) => setKeywordValues(vals)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} size="small" label="Keywords (suggested + custom)" placeholder="Type and press Enter" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Add keywords like trades, locations, zip codes, document types (e.g., “bid quotation”), etc. Supported: PDF (best), plain text.
        </Typography>
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


