import Avatar from '@mui/material/Avatar'
import BoltIcon from '@mui/icons-material/Bolt'
import PlumbingIcon from '@mui/icons-material/Plumbing'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import FoundationIcon from '@mui/icons-material/Foundation'
import RoofingIcon from '@mui/icons-material/Roofing'
import WindowIcon from '@mui/icons-material/Window'
import YardIcon from '@mui/icons-material/Yard'
import CarpenterIcon from '@mui/icons-material/Carpenter'
import PoolIcon from '@mui/icons-material/Pool'
import RollerShadesClosedIcon from '@mui/icons-material/RollerShadesClosed'
import PaintRollerIcon from '@mui/icons-material/RollerShades'
import KitchenIcon from '@mui/icons-material/Kitchen'
import TableBarIcon from '@mui/icons-material/TableBar'
import StairsIcon from '@mui/icons-material/Stairs'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import VideocamIcon from '@mui/icons-material/Videocam'
import DevicesOtherIcon from '@mui/icons-material/DevicesOther'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import ExploreIcon from '@mui/icons-material/Explore'
import ScienceIcon from '@mui/icons-material/Science'
import ArchitectureIcon from '@mui/icons-material/Architecture'
import BuildIcon from '@mui/icons-material/Build'
import Typography from '@mui/material/Typography'

function hashToHsl(input) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  const s = 60
  const l = 45
  return `hsl(${h}, ${s}%, ${l}%)`
}

function normalizeKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function pickIcon(key, name) {
  const s = `${key} ${name}`.toLowerCase()
  if (s.includes('elect')) return <BoltIcon fontSize="small" />
  if (s.includes('plumb')) return <PlumbingIcon fontSize="small" />
  if (s.includes('hvac') || s.includes('air')) return <AcUnitIcon fontSize="small" />
  if (s.includes('roof')) return <RoofingIcon fontSize="small" />
  if (s.includes('foundation') || s.includes('slab')) return <FoundationIcon fontSize="small" />
  if (s.includes('window') || s.includes('door')) return <WindowIcon fontSize="small" />
  if (s.includes('landscap') || s.includes('yard')) return <YardIcon fontSize="small" />
  if (s.includes('framing') || s.includes('carp')) return <CarpenterIcon fontSize="small" />
  if (s.includes('pool')) return <PoolIcon fontSize="small" />
  if (s.includes('drywall') || s.includes('sheetrock')) return <RollerShadesClosedIcon fontSize="small" />
  if (s.includes('paint')) return <PaintRollerIcon fontSize="small" />
  if (s.includes('cabinet')) return <KitchenIcon fontSize="small" />
  if (s.includes('counter')) return <TableBarIcon fontSize="small" />
  if (s.includes('stair')) return <StairsIcon fontSize="small" />
  if (s.includes('fireplace')) return <LocalFireDepartmentIcon fontSize="small" />
  if (s.includes('security') || s.includes('camera')) return <VideocamIcon fontSize="small" />
  if (s.includes('appliance')) return <DevicesOtherIcon fontSize="small" />
  if (s.includes('permit')) return <AssignmentTurnedInIcon fontSize="small" />
  if (s.includes('survey') || s.includes('land_survey')) return <ExploreIcon fontSize="small" />
  if (s.includes('soil')) return <ScienceIcon fontSize="small" />
  if (s.includes('structural') || s.includes('engineer')) return <ArchitectureIcon fontSize="small" />
  return null
}

export default function TradeAvatar({ trade, size = 32 }) {
  const base = String(trade?.promptBaseKey || normalizeKey(trade?.name || trade?.category || '') || 'trade')
  const color = hashToHsl(base)
  const icon = pickIcon(base, trade?.name || '')
  const initials = base
    .split('_')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'T'
  return (
    <Avatar sx={{ bgcolor: color, width: size, height: size, fontSize: Math.max(12, Math.floor(size * 0.45)) }}>
      {icon ? icon : <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>{initials}</Typography>}
    </Avatar>
  )
}



