import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
// Removed grid/card imports as the quick-access section is removed
import PageHeader from '../components/PageHeader.jsx'
import ArchitectureIcon from '@mui/icons-material/Architecture'
import TextureIcon from '@mui/icons-material/Texture'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CabinetIcon from '@mui/icons-material/Kitchen'
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices'
import PlumbingIcon from '@mui/icons-material/Plumbing'
import FormatPaintIcon from '@mui/icons-material/FormatPaint'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import RoofingIcon from '@mui/icons-material/Roofing'
import LayersIcon from '@mui/icons-material/Layers'
import CountertopsIcon from '@mui/icons-material/Countertops'
// import MenuBookIcon from '@mui/icons-material/MenuBook'
import UploadDocumentDialog from '../components/UploadDocumentDialog.jsx'

export default function HomePlanning() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [engUploadOpen, setEngUploadOpen] = useState(false)

  useEffect(() => {
    api.getHome(id).then(setHome).catch(() => {})
  }, [id])

  const hasFinalArchitecture = useMemo(() => {
    const docs = Array.isArray(home?.documents) ? home.documents : []
    const archDocs = docs.filter((d) => String(d?.category || '').startsWith('architecture_'))
    return !!archDocs.find((d) => d?.isFinal)
  }, [home])

  

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Planning"
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Planning' }
        ]}
      />
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Planning Flow</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Follow the typical construction order: Architect, HVAC, Plumbing, Electricals, Exterior Materials, Insulation, Drywall/Paint, Cabinets, Flooring, Countertops.
        </Typography>
        {(() => {
          const steps = [
            {
              key: 'architect',
              title: 'Architect',
              description: 'Upload drawings and run Architecture Analysis to establish your baseline.',
              route: `/homes/${id}/planning/architect`,
              icon: <ArchitectureIcon color="primary" />,
              enabled: true,
              done: Array.isArray(home?.documents) && (home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal),
            },
            {
              key: 'hvac',
              title: 'HVAC',
              description: 'Plan system type, zones, and rough-ins per area.',
              route: `/homes/${id}/planning/hvac`,
              icon: <AcUnitIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'plumbing',
              title: 'Plumbing',
              description: 'Plan fixture locations, counts, and rough‑ins per room.',
              route: `/homes/${id}/planning/plumbing`,
              icon: <PlumbingIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'electrical',
              title: 'Electricals',
              description: 'Plan circuits, lighting, and low-voltage needs.',
              route: `/homes/${id}/planning/electrical`,
              icon: <ElectricalServicesIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'exterior_materials',
              title: 'Exterior Materials',
              description: 'Select roofing, cladding, windows/doors finishes, and weatherproofing notes.',
              route: `/homes/${id}/planning/exterior-materials`,
              icon: <RoofingIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'insulation',
              title: 'Insulation',
              description: 'Define wall/ceiling insulation types and R-values per area.',
              route: `/homes/${id}/planning/insulation`,
              icon: <LayersIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'drywall_paint',
              title: 'Drywall &amp; Paint',
              description: 'Define wall/ceiling finish, paint schedule, and special areas.',
              route: `/homes/${id}/planning/drywall-paint`,
              icon: <FormatPaintIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'cabinets',
              title: 'Cabinets',
              description: 'Enter linear feet and pick materials/finishes for kitchens &amp; baths.',
              route: `/homes/${id}/planning/cabinets`,
              icon: <CabinetIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'flooring',
              title: 'Flooring',
              description: 'Choose carpet, tile, or hardwood per room; balance selections to budget.',
              route: `/homes/${id}/planning/flooring`,
              icon: <TextureIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            {
              key: 'countertops',
              title: 'Countertops',
              description: 'Select countertop materials and edges for kitchens &amp; baths.',
              route: `/homes/${id}/planning/countertops`,
              icon: <CountertopsIcon color="primary" />,
              enabled: !!((home?.documents || []).some((d) => String(d?.category || '').startsWith('architecture_') && d?.isFinal)),
            },
            // Knowledge step intentionally removed
          ]
          return (
            <Box sx={{ position: 'relative', pl: 3 }}>
              <Box sx={{ position: 'absolute', left: 18, top: 10, bottom: 10, width: 2, bgcolor: 'divider' }} />
              {steps.map((s, idx) => {
                const status = s.done ? 'done' : s.enabled ? 'current' : 'todo'
                const dotColor =
                  status === 'done' ? 'success.main' : status ? 'primary.main' : 'divider'
                return (
                  <Box key={s.key} sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                    <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: dotColor, mt: 0.5 }} />
                    </Box>
                    <Box sx={{ pb: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: .5 }}>
                        {s.icon}
                        <Typography variant="h6" sx={{ fontWeight: 700, color: status === 'current' ? 'primary.main' : 'text.primary' }}>
                          {idx + 1}. <span dangerouslySetInnerHTML={{ __html: s.title }} />
                        </Typography>
                        {s.done ? <CheckBoxIcon fontSize="small" color="success" /> : null}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{s.description}</Typography>
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        variant={status === 'current' ? 'contained' : 'outlined'}
                        onClick={() => s.enabled ? navigate(s.route) : null}
                        disabled={!s.enabled}
                      >
                        {s.done ? 'View' : `Start ${s.title.replace(/&amp;/g, '&')}`}
                      </Button>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )
        })()}
      </Paper>
      {/* Engineering documents upload section */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">Engineering Documents</Typography>
          <Button variant="contained" onClick={() => setEngUploadOpen(true)}>Upload Engineering Doc</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Upload remaining structural, MEP, geotechnical, energy, or other engineering documents needed for permits and construction.
        </Typography>
      </Paper>
      <UploadDocumentDialog
        open={engUploadOpen}
        onClose={() => setEngUploadOpen(false)}
        homeId={id}
        trades={home?.trades || []}
        defaultPinnedType="home"
        defaultDocType="engineering"
        onCompleted={(updated) => setHome(updated)}
      />
    </Stack>
  )
}

