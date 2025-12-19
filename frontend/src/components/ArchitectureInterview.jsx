import { useEffect, useMemo, useState } from 'react'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Slider from '@mui/material/Slider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { api } from '../api/client'

export default function ArchitectureInterview({ homeId, initialAnswers = null, initialMode = 'summary', onSaved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState(initialMode || 'summary')
  const [answers, setAnswers] = useState(initialAnswers || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [questions, setQuestions] = useState([])
  const modes = useMemo(() => [{ key: 'summary', label: 'Summary (20 questions)' }, { key: 'in_depth', label: 'In-Depth (100 questions)' }], [])
  // KB editor
  const [kbOpen, setKbOpen] = useState(false)
  const [kbText, setKbText] = useState('')
  const [kbBusy, setKbBusy] = useState(false)
  const [kbMsg, setKbMsg] = useState('')

  useEffect(() => {
    // Fetch initial questions dynamically
    let mounted = true
    async function fetchNext() {
      try {
        setLoading(true)
        const res = await api.nextArchitectureQuestions({ mode, answers })
        if (!mounted) return
        setQuestions(Array.isArray(res?.questions) ? res.questions : [])
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load questions')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchNext()
    return () => { mounted = false }
  }, [mode])

  // Next step to get more questions based on current answers
  async function getNextQuestions() {
    try {
      setLoading(true)
      // Auto-save current answers before fetching next set
      try {
        setSaving(true)
        const payload = { mode, answers }
        await api.saveRequirementsInterview(homeId, payload)
        setSaved(true)
      } catch (_e) {
        // Ignore save error for now; still attempt to fetch next
      } finally {
        setSaving(false)
      }
      const res = await api.nextArchitectureQuestions({ mode, answers })
      setQuestions(Array.isArray(res?.questions) ? res.questions : [])
    } catch (e) {
      setError(e.message || 'Failed to load next questions')
    } finally {
      setLoading(false)
    }
  }

  function renderQuestion(q) {
    const val = answers[q.id]
    const setVal = (v) => setAnswers((a) => ({ ...a, [q.id]: v }))
    switch (q.type) {
      case 'text':
        return <TextField fullWidth size="small" value={val || ''} onChange={(e) => setVal(e.target.value)} placeholder={q.placeholder || ''} />
      case 'number':
        return <TextField type="number" fullWidth size="small" value={typeof val === 'number' || val === '' ? val : ''} onChange={(e) => setVal(e.target.value === '' ? '' : Number(e.target.value))} inputProps={{ min: q.min ?? undefined, max: q.max ?? undefined }} />
      case 'boolean':
        return <FormControlLabel control={<Checkbox checked={!!val} onChange={(e) => setVal(e.target.checked)} />} label={q.text} />
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{q.text}</InputLabel>
            <Select value={val ?? ''} label={q.text} onChange={(e) => setVal(e.target.value)}>
              {(q.options || []).map((opt) => <MenuItem key={String(opt)} value={opt}>{String(opt)}</MenuItem>)}
            </Select>
          </FormControl>
        )
      case 'scale':
        return (
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">{q.text}</Typography>
            <Slider value={typeof val === 'number' ? val : Math.round(((q.min || 1) + (q.max || 5)) / 2)} min={q.min || 1} max={q.max || 5} step={1} marks onChange={(_e, v) => setVal(Number(v))} />
          </Stack>
        )
      default:
        return <TextField fullWidth size="small" value={val || ''} onChange={(e) => setVal(e.target.value)} />
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Interview</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Depth</InputLabel>
            <Select value={mode} label="Depth" onChange={(e) => setMode(e.target.value)}>
              {modes.map((m) => (
                <MenuItem key={m.key} value={m.key}>{m.label || m.key}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" onClick={() => { setAnswers({}); setSaved(false); getNextQuestions() }}>Restart</Button>
        </Stack>

        {loading && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">Loading…</Typography>
          </Stack>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">Saved</Alert>}

        <Grid container spacing={2}>
          {(questions || []).map((q) => (
            <Grid key={q.id} item xs={12} sm={q.type === 'boolean' ? 12 : 6}>
              {q.type !== 'boolean' && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .5 }}>{q.text}</Typography>}
              {renderQuestion(q)}
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true)
                const payload = { mode, answers }
                await api.saveRequirementsInterview(homeId, payload)
                setSaved(true)
                onSaved?.(payload)
              } catch (e) {
                setError(e.message || 'Save failed')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving…' : 'Save answers'}
          </Button>
          <Button variant="outlined" onClick={getNextQuestions} disabled={loading || saving}>
            {loading ? 'Loading…' : 'Next questions'}
          </Button>
          <Button
            disabled={saving}
            onClick={() => { setAnswers({}); setSaved(false) }}
          >
            Clear
          </Button>
        </Stack>

        {/* KB editor moved to admin Prompts/KB page */}
      </Stack>
    </Paper>
  )
}


