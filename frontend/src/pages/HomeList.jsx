import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import AddIcon from '@mui/icons-material/Add'

export default function HomeList() {
  const [homes, setHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
        return
      }
    } catch {}
    api.listMyHomes()
      .then((data) => { if (mounted) { setHomes(data) } })
      .catch((e) => { if (mounted) { setError(e.message) } })
      .finally(() => { if (mounted) { setLoading(false) } })
    return () => { mounted = false }
  }, [])

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="h6">Homes</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card variant="outlined">
            <CardActionArea onClick={() => navigate('/onboarding')}>
              <CardContent sx={{ display: 'grid', placeItems: 'center', minHeight: 120, textAlign: 'center' }}>
                <AddIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="subtitle1">Onboard New Home</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        {loading ? (
          <Grid item xs={12}>
            <Typography variant="body2">Loading…</Typography>
          </Grid>
        ) : (
          homes.map((h) => (
            <Grid key={h._id} item xs={12} sm={6} md={4} lg={3}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(`/homes/${h._id}/preconstruction`)}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{h.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{h.address || 'No address'}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Stack>
  )
}


