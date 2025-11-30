import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import HomeIcon from '@mui/icons-material/Home'
import Login from './Login.jsx'
import Register from './Register.jsx'

export default function Auth() {
  const [tab, setTab] = useState(0)
  const navigate = useNavigate()
  const authed = useMemo(() => {
    try { return Boolean(localStorage.getItem('token')) } catch { return false }
  }, [])
  if (authed) {
    navigate('/homes')
  }
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Buildwise AI" style={{ height: 40, marginBottom: 8 }} />
          <div className="brand-text brand-text--lg">Buildwise AI</div>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Tabs value={tab} onChange={(_e, v) => setTab(v)} centered>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          <Box sx={{ mt: 2 }}>
            {tab === 0 ? <Login /> : <Register />}
          </Box>
        </Paper>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Laitysol LLC. All Rights Reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}


