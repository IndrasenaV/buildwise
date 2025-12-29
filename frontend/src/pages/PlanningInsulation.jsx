import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

export default function PlanningInsulation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getHome(id).then((h) => {
      setHome(h)
      const saved = h?.planning?.insulation?.notes || ''
      setNotes(String(saved))
    }).catch(() => {})
  }, [id])

  const hasFinalArchitecture = useMemo(() => {
    const docs = Array.isArray(home?.documents) ? home.documents : []
    const archDocs = docs.filter((d) => String(d?.category || '').startsWith('architecture_'))
    return !!archDocs.find((d) => d?.isFinal)
  }, [home])

  async function saveNotes() {
    try {
      setSaving(true)
      // Placeholder local notes
      // eslint-disable-next-line no-console
      console.log('Insulation notes (local only):', notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Insulation Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Insulation' }
        ]}
        actions={
          <Button variant="contained" onClick={saveNotes} disabled={saving}>
            {saving ? 'Saving…' : 'Save notes'}
          </Button>
        }
      />
      {!hasFinalArchitecture && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Upload and mark a final architecture plan first to enable detailed planning. You can still draft notes below.
          </Typography>
        </Paper>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>R-values and assemblies</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Capture wall/ceiling/attic insulation type (batts, blown-in, spray foam), target R-values, vapor control, and special rooms.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (e.g., R-19 walls, R-38 attic, spray foam bonus room roofline, bath exhaust dampers)..."
        />
      </Paper>
    </Stack>
  )
}


