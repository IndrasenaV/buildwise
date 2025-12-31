import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import HomeIcon from '@mui/icons-material/Home'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import ListSubheader from '@mui/material/ListSubheader'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import RoofingIcon from '@mui/icons-material/Roofing'
import DesignServicesIcon from '@mui/icons-material/DesignServices'
import ArchitectureIcon from '@mui/icons-material/Architecture'
import { api } from '../api/client'
import DescriptionIcon from '@mui/icons-material/Description'
import ContactsIcon from '@mui/icons-material/Contacts'
import EventIcon from '@mui/icons-material/Event'
import BuildIcon from '@mui/icons-material/Build'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import DesignServicesOutlinedIcon from '@mui/icons-material/DesignServicesOutlined'
import ChatIcon from '@mui/icons-material/Chat'
import SettingsIcon from '@mui/icons-material/Settings'
import AgentChat from '../components/AgentChat.jsx'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'

const drawerWidth = 260

export default function SideNavLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [homeTitle, setHomeTitle] = useState('')
  const [home, setHome] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [userRoles, setUserRoles] = useState([])
  const [chatExpanded, setChatExpanded] = useState(false)

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
    <Box sx={{ display: 'flex' }}>
      {isMobile && (
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" aria-label="menu" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, cursor: 'pointer' }} onClick={() => go('/homes')}>
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Buildwise AI" style={{ height: 24, marginRight: 8 }} />
              <span className="brand-text">Buildwise AI</span>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          },
          display: { xs: 'block', sm: 'block' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => go('/homes')}>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Buildwise AI" style={{ height: 26, marginRight: 8 }} />
            <span className="brand-text">Buildwise AI</span>
          </Box>
        </Box>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => go('/homes')}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Homes" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => go('/onboarding')}>
              <ListItemIcon><AddCircleOutlineIcon /></ListItemIcon>
              <ListItemText primary="Onboard New Home" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            {userRoles.includes('sysadmin') && (
              <ListItemButton onClick={() => go('/templates')}>
                <ListItemIcon><DesignServicesOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Templates" />
              </ListItemButton>
            )}
          </ListItem>
          <ListItem disablePadding>
            {userRoles.includes('sysadmin') && (
              <ListItemButton onClick={() => go('/prompts')}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Prompts" />
              </ListItemButton>
            )}
          </ListItem>
          <ListItem disablePadding>
            {userRoles.includes('sysadmin') && (
              <ListItemButton onClick={() => go('/knowledge')}>
                <ListItemIcon><DescriptionIcon /></ListItemIcon>
                <ListItemText primary="Knowledge Base" />
              </ListItemButton>
            )}
          </ListItem>
        </List>
        {currentHomeId && (
          <>
            <Divider />
            <List subheader={<ListSubheader component="div" disableSticky sx={{ bgcolor: 'transparent' }}>{homeTitle || 'Selected Home'}</ListSubheader>}>
              <ListSubheader component="div" disableSticky sx={{ bgcolor: 'transparent', color: 'text.secondary', fontSize: 12, lineHeight: '28px' }}>
                Project Flow
              </ListSubheader>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/planning')} onClick={() => go(`/homes/${currentHomeId}/planning`)}>
                  <ListItemIcon><ArchitectureIcon /></ListItemIcon>
                  <ListItemText primary="Planning" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/budget')} onClick={() => go(`/homes/${currentHomeId}/budget`)}>
                  <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
                  <ListItemText primary="Budget" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/permits')} onClick={() => go(`/homes/${currentHomeId}/permits`)}>
                  <ListItemIcon><DescriptionIcon /></ListItemIcon>
                  <ListItemText primary="Permits" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/preconstruction')} onClick={() => go(`/homes/${currentHomeId}/preconstruction`)}>
                  <ListItemIcon><DesignServicesIcon /></ListItemIcon>
                  <ListItemText primary="Preconstruction" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/exterior')} onClick={() => go(`/homes/${currentHomeId}/exterior`)}>
                  <ListItemIcon><RoofingIcon /></ListItemIcon>
                  <ListItemText primary="Exterior Build" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/interior')} onClick={() => go(`/homes/${currentHomeId}/interior`)}>
                  <ListItemIcon><AssignmentTurnedInIcon /></ListItemIcon>
                  <ListItemText primary="Interior / Finish Out" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListSubheader component="div" disableSticky sx={{ bgcolor: 'transparent', color: 'text.secondary', fontSize: 12, lineHeight: '28px' }}>
                General
              </ListSubheader>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/dashboard')} onClick={() => go(`/homes/${currentHomeId}/dashboard`)}>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/messages')} onClick={() => go(`/homes/${currentHomeId}/messages`)}>
                  <ListItemIcon><ChatIcon /></ListItemIcon>
                  <ListItemText primary="Messages" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/tools')} onClick={() => go(`/homes/${currentHomeId}/tools`)}>
                  <ListItemIcon><DesignServicesOutlinedIcon /></ListItemIcon>
                  <ListItemText primary="Tools" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/trades')} onClick={() => go(`/homes/${currentHomeId}/trades`)}>
                  <ListItemIcon><BuildIcon /></ListItemIcon>
                  <ListItemText primary="Trades" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/documents')} onClick={() => go(`/homes/${currentHomeId}/documents`)}>
                  <ListItemIcon><DescriptionIcon /></ListItemIcon>
                  <ListItemText primary="Documents" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/contacts')} onClick={() => go(`/homes/${currentHomeId}/contacts`)}>
                  <ListItemIcon><ContactsIcon /></ListItemIcon>
                  <ListItemText primary="Contacts" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={location.pathname.includes('/schedule')} onClick={() => go(`/homes/${currentHomeId}/schedule`)}>
                  <ListItemIcon><EventIcon /></ListItemIcon>
                  <ListItemText primary="Schedule" />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <Box sx={{ p: 2 }}>
          <ListItem disablePadding>
            <ListItemButton selected={location.pathname.includes('/account')} onClick={() => go('/account')}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Account" />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {userEmail || 'Logged in'}
          </Typography>
          <ListItem disablePadding>
            <ListItemButton color="inherit" onClick={logout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
        {/* Center content area */}
        <Box sx={{ flexGrow: 1, p: 3, pt: isMobile ? 8 : 3, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <Container maxWidth={location.pathname.includes('/documents') ? false : 'lg'} sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <Box
              sx={{
                display: currentHomeId ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 67,
                borderBottom: 1,
                borderColor: 'divider',
                mb: 2
              }}
            >
              <Box sx={{ maxWidth: 560, flex: '1 1 auto' }}>
                <Box component={Paper} variant="outlined" sx={{ p: 0.5, borderRadius: 1, bgcolor: 'background.paper' }}>
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
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          )
                        }}
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
              </Box>
              <IconButton sx={{ ml: 2 }} aria-label="Notifications">
                <NotificationsNoneIcon />
              </IconButton>
            </Box>
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


