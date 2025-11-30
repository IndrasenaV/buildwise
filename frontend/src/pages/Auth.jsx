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
          <HomeIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Home Tracker</Typography>
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
      </Box>
    </Box>
  )
}


