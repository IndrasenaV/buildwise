import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import { api } from '../api/client'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SettingsIcon from '@mui/icons-material/Settings'
import DescriptionIcon from '@mui/icons-material/Description'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import AgentChat from '../components/AgentChat.jsx'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'

export default function SideNavLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [homeTitle, setHomeTitle] = useState('')
  const [home, setHome] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [userRoles, setUserRoles] = useState([])
  const [chatExpanded, setChatExpanded] = useState(false)
  const [adminAnchorEl, setAdminAnchorEl] = useState(null)
  const [userAnchorEl, setUserAnchorEl] = useState(null)
  const [execAnchorEl, setExecAnchorEl] = useState(null)
  const [projectAnchorEl, setProjectAnchorEl] = useState(null)
  const [docsAnchorEl, setDocsAnchorEl] = useState(null)
  const [scheduleAnchorEl, setScheduleAnchorEl] = useState(null)

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
      }
    } catch {}
  }, [navigate])

  const currentHomeId = useMemo(() => {
    const m = location.pathname.match(/^\/homes\/([^/]+)/)
    return m ? m[1] : ''
  }, [location.pathname])

  useEffect(() => {
    let mounted = true
    if (currentHomeId) {
      api.getHome(currentHomeId)
        .then((h) => {
          if (!mounted) return
          setHome(h)
          setHomeTitle(h?.name || '')
        })
        .catch(() => { if (mounted) setHomeTitle('') })
    } else {
      setHome(null)
      setHomeTitle('')
    }
    return () => { mounted = false }
  }, [currentHomeId])

  useEffect(() => {
    let mounted = true
    api.me()
      .then((u) => { if (mounted) setUserRoles(Array.isArray(u?.roles) ? u.roles : []) })
      .catch(() => { if (mounted) setUserRoles([]) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    function onToggleExpand() {
      setChatExpanded((v) => !v)
    }
    function onSetExpand(ev) {
      try {
        const next = !!ev?.detail?.expanded
        setChatExpanded(next)
      } catch {}
    }
    window.addEventListener('agentchat:toggleExpand', onToggleExpand)
    window.addEventListener('agentchat:setExpand', onSetExpand)
    return () => {
      window.removeEventListener('agentchat:toggleExpand', onToggleExpand)
      window.removeEventListener('agentchat:setExpand', onSetExpand)
    }
  }, [])

  function go(path) {
    if (location.pathname !== path) navigate(path)
  }

  function logout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
    } catch {}
    navigate('/')
  }

  const userEmail = (() => {
    try { return localStorage.getItem('userEmail') || '' } catch { return '' }
  })()

  const planningOptions = useMemo(() => {
    if (!currentHomeId) return []
    const base = `/homes/${currentHomeId}/planning`
    return [
      { type: 'planning', label: 'Planning: Architect', route: `${base}/architect` },
      { type: 'planning', label: 'Planning: HVAC', route: `${base}/hvac` },
      { type: 'planning', label: 'Planning: Plumbing', route: `${base}/plumbing` },
      { type: 'planning', label: 'Planning: Electricals', route: `${base}/electrical` },
      { type: 'planning', label: 'Planning: Exterior Materials', route: `${base}/exterior-materials` },
      { type: 'planning', label: 'Planning: Insulation', route: `${base}/insulation` },
      { type: 'planning', label: 'Planning: Drywall & Paint', route: `${base}/drywall-paint` },
      { type: 'planning', label: 'Planning: Cabinets', route: `${base}/cabinets` },
      { type: 'planning', label: 'Planning: Flooring', route: `${base}/flooring` },
      { type: 'planning', label: 'Planning: Countertops', route: `${base}/countertops` },
      { type: 'planning', label: 'Planning: Windows & Doors', route: `${base}/windows-doors` },
      { type: 'planning', label: 'Planning: Appliances', route: `${base}/appliances` },
    ]
  }, [currentHomeId])

  const tradeOptions = useMemo(() => {
    const list = []
    const trades = Array.isArray(home?.trades) ? home.trades : []
    for (const t of trades) {
      list.push({
        type: 'trade',
        label: `Trade: ${t.name}`,
        tradeId: String(t._id || ''),
        route: `/homes/${currentHomeId}/trades/${t._id}`
      })
    }
    return list
  }, [home, currentHomeId])

  const searchOptions = useMemo(() => {
    return [...planningOptions, ...tradeOptions]
  }, [planningOptions, tradeOptions])

  function onSelectSearchOption(_e, option) {
    if (!option) return
    if (option.route) {
      go(option.route)
    } else if (option.type === 'trade' && option.tradeId) {
      go(`/homes/${currentHomeId}/trades/${option.tradeId}`)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(0,0,0,0.72)',
          color: '#fff',
          backdropFilter: 'saturate(180%) blur(6px)'
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => go('/homes')}>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Buildwise AI" style={{ height: 26, marginRight: 8 }} />
            <span className="brand-text">Buildwise AI</span>
          </Box>
          <Divider orientation="vertical" flexItem light sx={{ borderColor: 'rgba(255,255,255,0.18)' }} />
          {currentHomeId ? (
            <>
              <Button color="inherit" onClick={() => go(`/homes/${currentHomeId}/dashboard`)} sx={{ textTransform: 'none' }}>
                Dashboard
              </Button>
              <Button
                color="inherit"
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setProjectAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none' }}
              >
                Project
              </Button>
              <Menu
                anchorEl={projectAnchorEl}
                open={!!projectAnchorEl}
                onClose={() => setProjectAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem
                  onClick={() => { setProjectAnchorEl(null); go(`/homes/${currentHomeId}/planning`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 300 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Planning</Typography>
                    <Typography variant="caption" color="text.secondary">Define selections and scope; align design decisions with budget.</Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => { setProjectAnchorEl(null); go(`/homes/${currentHomeId}/budget`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 300 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Budget</Typography>
                    <Typography variant="caption" color="text.secondary">Estimate and reconcile costs across trades and materials.</Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => { setProjectAnchorEl(null); go(`/homes/${currentHomeId}/permits`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 300 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Permits</Typography>
                    <Typography variant="caption" color="text.secondary">Submit, track, and manage permit documents and approvals.</Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => { setProjectAnchorEl(null); go(`/homes/${currentHomeId}/schedule`) }}
                  sx={{ display: 'none' }}
                />
              </Menu>
              <Button
                color="inherit"
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setExecAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none' }}
              >
                Execution
              </Button>
              <Menu
                anchorEl={execAnchorEl}
                open={!!execAnchorEl}
                onClose={() => setExecAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem
                  onClick={() => { setExecAnchorEl(null); go(`/homes/${currentHomeId}/preconstruction`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 280 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Preconstruction</Typography>
                    <Typography variant="caption" color="text.secondary">Plan sequencing, long‑lead items, and site prep prior to build.</Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => { setExecAnchorEl(null); go(`/homes/${currentHomeId}/exterior`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 280 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Exterior</Typography>
                    <Typography variant="caption" color="text.secondary">Manage structure, roofing, cladding, openings, and weatherproofing.</Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => { setExecAnchorEl(null); go(`/homes/${currentHomeId}/interior`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 280 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Interior</Typography>
                    <Typography variant="caption" color="text.secondary">Track drywall, trim, paint, and interior install/finish steps.</Typography>
                  </Box>
                </MenuItem>
              </Menu>
              <Button
                color="inherit"
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setScheduleAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none' }}
              >
                Schedule & Logs
              </Button>
              <Menu
                anchorEl={scheduleAnchorEl}
                open={!!scheduleAnchorEl}
                onClose={() => setScheduleAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={() => { setScheduleAnchorEl(null); go(`/homes/${currentHomeId}/schedule`) }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Gantt Schedule</Typography>
                </MenuItem>
                <MenuItem onClick={() => { setScheduleAnchorEl(null); go(`/homes/${currentHomeId}/daily-logs`) }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Daily Logs</Typography>
                </MenuItem>
              </Menu>
              <Button
                color="inherit"
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setDocsAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none' }}
              >
                Docs &amp; Messages
              </Button>
              <Menu
                anchorEl={docsAnchorEl}
                open={!!docsAnchorEl}
                onClose={() => setDocsAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem
                  onClick={() => { setDocsAnchorEl(null); go(`/homes/${currentHomeId}/documents`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 280 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Documents</Typography>
                    <Typography variant="caption" color="text.secondary">Organize drawings, submittals, and shared project files.</Typography>
        </Box>
                </MenuItem>
                <MenuItem
                  onClick={() => { setDocsAnchorEl(null); go(`/homes/${currentHomeId}/messages`) }}
                  sx={{ alignItems: 'flex-start', py: 1, px: 2, minWidth: 280 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Messages</Typography>
                    <Typography variant="caption" color="text.secondary">Communicate with owners, architects, and trades in one place.</Typography>
                  </Box>
                </MenuItem>
              </Menu>
            </>
          ) : null}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            {currentHomeId ? (
              <Box component={Paper} variant="outlined" sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.24)', minWidth: isMobile ? 200 : 520, maxWidth: 760, width: '100%' }}>
                  <Autocomplete
                    options={searchOptions}
                    size="small"
                    fullWidth
                    getOptionLabel={(o) => o.label}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search planning or trades…"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />
                            </InputAdornment>
                          )
                        }}
                      InputLabelProps={{ shrink: false }}
                      variant="outlined"
                      />
                    )}
                    onChange={onSelectSearchOption}
                    disableClearable
                    autoHighlight
                    filterOptions={(options, state) => {
                      const q = (state.inputValue || '').toLowerCase()
                      if (!q) return options
                      return options.filter((o) => o.label.toLowerCase().includes(q))
                    }}
                  />
                </Box>
            ) : null}
              </Box>
          {userRoles.includes('sysadmin') && (
            <>
              <Button
                color="inherit"
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setAdminAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none' }}
              >
                Admin
              </Button>
              <Menu
                anchorEl={adminAnchorEl}
                open={!!adminAnchorEl}
                onClose={() => setAdminAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={() => { setAdminAnchorEl(null); go('/templates') }}>
                  <SettingsIcon fontSize="small" style={{ marginRight: 8 }} />
                  Templates
                </MenuItem>
                <MenuItem onClick={() => { setAdminAnchorEl(null); go('/prompts') }}>
                  <SettingsIcon fontSize="small" style={{ marginRight: 8 }} />
                  Prompts
                </MenuItem>
                <MenuItem onClick={() => { setAdminAnchorEl(null); go('/knowledge') }}>
                  <DescriptionIcon fontSize="small" style={{ marginRight: 8 }} />
                  Knowledge Base
                </MenuItem>
              </Menu>
            </>
          )}
          <IconButton aria-label="Notifications" color="inherit">
                <NotificationsNoneIcon />
              </IconButton>
          <Tooltip title={userEmail || ''}>
            <IconButton color="inherit" onClick={(e) => setUserAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', color: 'black' }}>
                {(userEmail || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={userAnchorEl}
            open={!!userAnchorEl}
            onClose={() => setUserAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { setUserAnchorEl(null); go('/homes') }}>Homes</MenuItem>
            <MenuItem onClick={() => { setUserAnchorEl(null); go('/account?tab=profile') }}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { setUserAnchorEl(null); go('/account') }}>
              Account Information
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setUserAnchorEl(null); logout() }}>
              <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100%', width: '100%' }}>
        {/* Center content area */}
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <Container maxWidth={location.pathname.includes('/documents') || location.pathname.includes('/schedule') ? false : 'lg'} sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Outlet />
            </Box>
            <Box sx={{ mt: 6, mb: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Laitysol LLC. All Rights Reserved.
              </Typography>
            </Box>
          </Container>
        </Box>
        {/* Right chat panel */}
        <Box
          sx={{
            width: { xs: '100%', md: chatExpanded ? 680 : 380 },
            minWidth: { md: chatExpanded ? 520 : 340 },
            maxWidth: { md: chatExpanded ? 900 : 420 },
            height: { xs: '60vh', md: '100vh' },
            position: { xs: 'static', md: 'sticky' },
            top: { xs: 0, md: 0 },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <AgentChat homeId={currentHomeId} />
        </Box>
      </Box>
    </Box>
  )
}


