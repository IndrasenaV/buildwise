import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import PageHeader from '../components/PageHeader.jsx'
import ArchitectureIcon from '@mui/icons-material/Architecture'
import RoofingIcon from '@mui/icons-material/Roofing'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import TextureIcon from '@mui/icons-material/Texture'

export default function HomePlanning() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)

  useEffect(() => {
    api.getHome(id).then(setHome).catch(() => {})
  }, [id])

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
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Select a planning area</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardActionArea onClick={() => navigate(`/homes/${id}/planning/architect`)}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ArchitectureIcon color="primary" />
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Architect</Typography>
                    <Typography variant="body2" color="text.secondary">Upload plans and analyze</Typography>
                          </div>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardActionArea onClick={() => {}}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <DoorFrontIcon color="primary" />
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Windows & Doors</Typography>
                    <Typography variant="body2" color="text.secondary">Coming soon</Typography>
                          </div>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardActionArea onClick={() => {}}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <RoofingIcon color="primary" />
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Roof</Typography>
                    <Typography variant="body2" color="text.secondary">Coming soon</Typography>
                          </div>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardActionArea onClick={() => {}}>
                <CardContent style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <TextureIcon color="primary" />
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Exterior Materials</Typography>
                    <Typography variant="body2" color="text.secondary">Coming soon</Typography>
                      </div>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  )
}

