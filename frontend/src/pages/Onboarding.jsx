import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'

const steps = ['Home Details', 'Client & Monitors', 'Builder']

export default function Onboarding() {
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Client
  const [people, setPeople] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedMonitors, setSelectedMonitors] = useState([])

  // Builder
  const [builders, setBuilders] = useState([])
  const [selectedBuilder, setSelectedBuilder] = useState(null)

  // Home
  const [home, setHome] = useState({ name: '', address: '', withTemplates: true, templateId: '' })
  const [templates, setTemplates] = useState([])
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('')
  const [selectedVersionId, setSelectedVersionId] = useState('')

  useEffect(() => {
    api.listPeople().then(setPeople).catch(() => {})
    api.listPeople('builder').then(setBuilders).catch(() => {})
    api.listTemplates()
      .then((ts) => {
        const list = ts || []
        setTemplates(list)
        if (list.length) {
          // Preselect the first templateKey and latest version for convenience
          const byKey = groupByTemplateKey(list)
          const firstKey = Object.keys(byKey)[0]
          if (firstKey) {
            setSelectedTemplateKey(firstKey)
            const versions = sortVersionsDesc(byKey[firstKey])
            const firstVer = versions[0]
            if (firstVer) {
              setSelectedVersionId(firstVer._id)
              setHome((h) => ({ ...h, templateId: firstVer._id }))
            }
          }
        }
      })
      .catch(() => {})
  }, [])

  function groupByTemplateKey(list) {
    const map = {}
    for (const t of list) {
      const key = t.templateKey || 'unknown'
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return map
  }

  function sortVersionsDesc(items) {
    return [...(items || [])].sort((a, b) => Number(b.version || 0) - Number(a.version || 0))
  }

  const isHomeStepValid = useMemo(() => {
    return Boolean(home.name && (!home.withTemplates || home.templateId))
  }, [home])

  const isClientStepValid = useMemo(() => {
    return Boolean(selectedClient && selectedClient.email)
  }, [selectedClient])

  const isBuilderStepValid = useMemo(() => {
    return Boolean(selectedBuilder && selectedBuilder.email)
  }, [selectedBuilder])

  function removeMonitor(email) {
    setSelectedMonitors(selectedMonitors.filter((m) => m.email !== email))
  }

  async function handleSubmit() {
    setError('')
    try {
      const builderPayload = { fullName: selectedBuilder.fullName, email: selectedBuilder.email, phone: selectedBuilder.phone || '' }
      const payload = {
        client: {
          fullName: selectedClient.fullName,
          email: selectedClient.email,
          phone: selectedClient.phone || '',
        },
        monitors: selectedMonitors.map((m) => ({
          fullName: m.fullName,
          email: m.email,
          phone: m.phone || '',
        })),
        builder: builderPayload,
        home,
      }
      const res = await api.onboardingCreate(payload)
      const created = res.home || res
      if (created && created._id) {
        try { localStorage.setItem('lastHomeId', created._id) } catch {}
        navigate(`/homes/${created._id}`)
      } else {
        throw new Error('Unexpected response')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Onboard New Home</Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Home Details</Typography>
          <Stack spacing={2}>
            <TextField label="Home Name" required value={home.name} onChange={(e) => setHome({ ...home, name: e.target.value })} />
            <TextField label="Address" value={home.address} onChange={(e) => setHome({ ...home, address: e.target.value })} />
            <Box>
              <Typography variant="subtitle1" gutterBottom>Select Template</Typography>
              <Grid container spacing={2}>
                {Object.entries(groupByTemplateKey(templates)).map(([key, items]) => {
                  const latest = sortVersionsDesc(items)[0]
                  return (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Card variant={selectedTemplateKey === key ? 'outlined' : 'elevation'} sx={{ borderColor: selectedTemplateKey === key ? 'primary.main' : undefined }}>
                        <CardActionArea onClick={() => {
                          setSelectedTemplateKey(key)
                          const versions = sortVersionsDesc(items)
                          const v = versions[0]
                          setSelectedVersionId(v?._id || '')
                          setHome((h) => ({ ...h, templateId: v?._id || '' }))
                        }}>
                          <CardContent>
                            <Typography variant="subtitle1">{latest?.name || key}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>{latest?.description || ''}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip label={`Key: ${key}`} size="small" />
                              {latest?.version ? <Chip label={`Latest v${latest.version}`} size="small" /> : null}
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>

            {selectedTemplateKey && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Select Version</Typography>
                <Grid container spacing={2}>
                  {sortVersionsDesc(groupByTemplateKey(templates)[selectedTemplateKey] || []).map((v) => (
                    <Grid item xs={12} sm={6} md={4} key={v._id}>
                      <Card variant={selectedVersionId === v._id ? 'outlined' : 'elevation'} sx={{ borderColor: selectedVersionId === v._id ? 'primary.main' : undefined }}>
                        <CardActionArea onClick={() => {
                          setSelectedVersionId(v._id)
                          setHome((h) => ({ ...h, templateId: v._id }))
                        }}>
                          <CardContent>
                            <Typography variant="subtitle2">{v.name}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip label={`v${v.version}`} size="small" />
                              <Chip label={v.status} size="small" color={v.status === 'frozen' ? 'warning' : 'default'} />
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {activeStep === 1 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Client & Monitors</Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={people}
              getOptionLabel={(o) => `${o.fullName} (${o.email})`}
              onChange={(_e, value) => setSelectedClient(value)}
              renderInput={(params) => <TextField {...params} label="Select Existing Client" required />}
            />
            <Autocomplete
              multiple
              options={people.filter((p) => !selectedClient || p.email !== selectedClient.email)}
              getOptionLabel={(o) => `${o.fullName} (${o.email})`}
              value={selectedMonitors}
              onChange={(_e, value) => setSelectedMonitors(value)}
              renderInput={(params) => <TextField {...params} label="Select Monitors" />}
            />
          </Stack>
        </Paper>
      )}

      {activeStep === 2 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Builder</Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={builders}
              getOptionLabel={(o) => `${o.fullName} (${o.email})`}
              onChange={(_e, value) => setSelectedBuilder(value)}
              renderInput={(params) => <TextField {...params} label="Select Existing Builder" />}
            />
          </Stack>
        </Paper>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction="row" spacing={1} justifyContent="space-between">
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>Back</Button>
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setActiveStep((s) => s + 1)}
            disabled={
              (activeStep === 0 && !isHomeStepValid) ||
              (activeStep === 1 && !isClientStepValid) ||
              (activeStep === 2 && !isBuilderStepValid)
            }
          >
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={!isHomeStepValid}>Create Home</Button>
        )}
      </Stack>
    </Stack>
  )
}


