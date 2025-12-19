import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { api } from '../api/client'
import ArchitectureInterview from '../components/ArchitectureInterview.jsx'

export default function PlanningArchitectInterview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [kb, setKb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editAnswers, setEditAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [h, k] = await Promise.all([api.getHome(id), api.getArchitectureQuestions().catch(() => ({ questions: null }))])
        if (!mounted) return
        setHome(h)
        setKb(k?.questions || null)
        try { setEditAnswers(h?.requirementsInterview?.answers || {}) } catch {}
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const { idToLabel, idToQuestion } = useMemo(() => {
    const ans = (home?.requirementsInterview?.answers) || {}
    const entries = Object.entries(ans)
    const res = { idToLabel: {}, idToQuestion: {} }
    // Map IDs to labels using KB if available
    function indexKb(node) {
      if (!node) return
      const sections = Array.isArray(node.sections) ? node.sections : []
      for (const s of sections) {
        const qs = Array.isArray(s.questions) ? s.questions : []
        for (const q of qs) {
          if (q?.id) {
            if (q?.text) res.idToLabel[q.id] = q.text
            res.idToQuestion[q.id] = q
          }
        }
      }
    }
    indexKb(kb)
    return res
  }, [home, kb])

  const answeredEntries = useMemo(() => Object.entries(home?.requirementsInterview?.answers || {}), [home])

  if (loading) {
    return <Typography variant="body2">Loading… {error && <span style={{ color: 'red' }}>{error}</span>}</Typography>
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Guided Requirements Questionnaire"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning', href: `/homes/${id}/planning` },
          { label: 'Architect', href: `/homes/${id}/planning/architect` },
          { label: 'Questionnaire' },
        ]}
      />
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Answered ({answeredEntries.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Edit answers inline and click Save changes. This section shows all previously answered questions.
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {answeredEntries.map(([qid, val]) => {
              const q = idToQuestion[qid] || { id: qid, text: idToLabel[qid] || qid, type: 'text' }
              const v = Object.prototype.hasOwnProperty.call(editAnswers, qid) ? editAnswers[qid] : val
              const setV = (nv) => setEditAnswers((a) => ({ ...a, [qid]: nv }))
              let input = null
              switch (q.type) {
                case 'number':
                  input = (
                    <TextField
                      type="number"
                      fullWidth
                      size="small"
                      value={typeof v === 'number' || v === '' ? v : ''}
                      onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))}
                      inputProps={{ min: q.min ?? undefined, max: q.max ?? undefined }}
                    />
                  )
                  break
                case 'boolean':
                  input = <FormControlLabel control={<Checkbox checked={!!v} onChange={(e) => setV(e.target.checked)} />} label={q.text} />
                  break
                case 'select':
                  input = (
                    <FormControl fullWidth size="small">
                      <InputLabel>{q.text}</InputLabel>
                      <Select value={v ?? ''} label={q.text} onChange={(e) => setV(e.target.value)}>
                        {(q.options || []).map((opt) => <MenuItem key={String(opt)} value={opt}>{String(opt)}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )
                  break
                case 'scale':
                  input = (
                    <TextField
                      type="number"
                      fullWidth
                      size="small"
                      value={typeof v === 'number' || v === '' ? v : ''}
                      onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))}
                      inputProps={{ min: q.min ?? 1, max: q.max ?? 5 }}
                      helperText={`Scale ${q.min ?? 1}-${q.max ?? 5}`}
                    />
                  )
                  break
                default:
                  input = <TextField fullWidth size="small" value={v || ''} onChange={(e) => setV(e.target.value)} />
              }
              return (
                <Grid key={qid} item xs={12} sm={q.type === 'boolean' ? 12 : 6}>
                  {q.type !== 'boolean' && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: .5 }}>
                      {q.text}
                    </Typography>
                  )}
                  {input}
                </Grid>
              )
            })}
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true)
                  const payload = {
                    mode: home?.requirementsInterview?.mode || 'summary',
                    answers: editAnswers
                  }
                  const updated = await api.saveRequirementsInterview(id, payload)
                  setHome(updated)
                  setSavedMsg('Saved')
                  setTimeout(() => setSavedMsg(''), 1500)
                } catch (e) {
                  setSavedMsg(e.message || 'Save failed')
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {!!savedMsg && <Typography variant="caption" color="success.main">{savedMsg}</Typography>}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <ArchitectureInterview
        homeId={id}
        initialAnswers={home?.requirementsInterview?.answers || {}}
        initialMode={home?.requirementsInterview?.mode || 'summary'}
        onSaved={(payload) => setHome((h) => (h ? { ...h, requirementsInterview: payload } : h))}
      />
    </Stack>
  )
}


