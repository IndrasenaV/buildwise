import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'

export default function Templates() {
  const [items, setItems] = useState([])
  const [creating, setCreating] = useState({ templateKey: '', name: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function refresh() {
    setError('')
    try {
      const data = await api.listTemplates()
      setItems(data || [])
    } catch (e) {
      setError(e.message || 'Failed to load templates')
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleCreate() {
    if (!creating.templateKey || !creating.name) return
    setError('')
    try {
      const created = await api.createTemplate({ templateKey: creating.templateKey, name: creating.name })
      setCreating({ templateKey: '', name: '' })
      await refresh()
      navigate(`/templates/${created._id}`)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleVersion(id) {
    setError('')
    try {
      const v = await api.createTemplateVersion(id)
      await refresh()
      navigate(`/templates/${v._id}`)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleFreeze(id) {
    setError('')
    try {
      await api.freezeTemplate(id)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Templates</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField label="Template Key (e.g. single_family)" value={creating.templateKey} onChange={(e) => setCreating({ ...creating, templateKey: e.target.value })} />
          <TextField label="Name" value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} />
          <Button variant="contained" onClick={handleCreate} disabled={!creating.templateKey || !creating.name}>New Template</Button>
        </Stack>
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Template Key</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(items || []).map((t) => (
              <TableRow key={t._id} hover>
                <TableCell>{t.templateKey}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.version}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => navigate(`/templates/${t._id}`)}>Edit</Button>
                    <Button size="small" onClick={() => handleVersion(t._id)}>New Version</Button>
                    {t.status !== 'frozen' && <Button size="small" color="warning" onClick={() => handleFreeze(t._id)}>Freeze</Button>}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}



