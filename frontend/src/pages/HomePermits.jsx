import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import CloseIcon from '@mui/icons-material/Close'
import PageHeader from '../components/PageHeader.jsx'
import UploadDocumentDialog from '../components/UploadDocumentDialog.jsx'

export default function HomePermits() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState({ open: false, url: '', title: '', isObjectUrl: false })

  useEffect(() => {
    api.getHome(id).then(setHome).catch(() => {})
  }, [id])

  const permitDocs = useMemo(() => {
    const all = Array.isArray(home?.documents) ? home.documents : []
    return all.filter((d) => (d.category || '') === 'permit')
  }, [home])

  async function openPreview(url, title) {
    try {
      const res = await fetch(url, { mode: 'cors' })
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      setPreview({ open: true, url: objUrl, title, isObjectUrl: true })
    } catch {
      setPreview({ open: true, url: url, title, isObjectUrl: false })
    }
  }

  function closePreview() {
    try {
      if (preview?.isObjectUrl && preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
    } catch {}
    setPreview({ open: false, url: '', title: '', isObjectUrl: false })
  }

  async function onDelete(docId) {
    if (!window.confirm('Delete this permit document?')) return
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

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Permits"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Permits' }
        ]}
        actions={
          <Button variant="contained" onClick={() => setUploadOpen(true)}>Upload Permit Doc</Button>
        }
      />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Track permit-related documents and requirements. If your home address was recognized, starter templates from your city may be pre-populated below. Upload signed applications, plan sets, energy compliance, and approvals as you receive them.
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permitDocs.map((d) => {
              const name = d.fileName || d.title || (d.url || '').split('/').pop() || 'File'
              const uploadedAt = d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'
              return (
                <TableRow key={d._id}>
                  <TableCell sx={{ wordBreak: 'break-all' }}>{name}</TableCell>
                  <TableCell>{uploadedAt}</TableCell>
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
            {!permitDocs.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">No permit documents yet. Use “Upload” to add required forms and approvals.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={preview.open} onClose={closePreview} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{preview.title}</span>
          <IconButton onClick={closePreview} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', p: 0 }}>
          <iframe title={preview.title} src={preview.url} style={{ width: '100%', height: '100%', border: 0 }} />
        </DialogContent>
      </Dialog>

      <UploadDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        homeId={id}
        trades={home?.trades || []}
        defaultPinnedType="home"
        defaultDocType="permit"
        onCompleted={(updated) => setHome(updated)}
      />
    </Stack>
  )
}


