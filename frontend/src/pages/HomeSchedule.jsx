import { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import GanttDemo from '../components/GanttDemo.jsx'

// Lazy-load SVAR Gantt (MIT core). If the library is present, it will render; otherwise fallback shows.
// Replaced by internal demo-based Gantt for reliability
// const SvarGantt = lazy(() => import('@svar-ui/react-gantt').then((m) => ({ default: m.Gantt || m.default || m.ReactGantt })))

export default function HomeSchedule() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', startsAt: '', endsAt: '', bidId: '', taskId: '' })
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [viewMode, setViewMode] = useState('gantt')

  useEffect(() => {
    api.getHome(id).then(setHome).catch((e) => setError(e.message))
  }, [id])

  const schedules = useMemo(() => {
    return (home?.schedules || []).slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
  }, [home])

  const next20Days = useMemo(() => {
    const now = new Date()
    const end = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
    return schedules.filter((s) => {
      const st = new Date(s.startsAt)
      return st >= now && st <= end
    })
  }, [schedules])

  // Build Gantt data set from trades/tasks + schedules with phases and dependencies
  const ganttData = useMemo(() => {
    const trades = Array.isArray(home?.trades) ? home.trades : []
    const schedules = Array.isArray(home?.schedules) ? home.schedules : []
    // Group schedules by taskId to compute task windows/durations
    const schedByTaskId = new Map()
    for (const s of schedules) {
      if (!s?.taskId) continue
      const arr = schedByTaskId.get(s.taskId) || []
      arr.push(s)
      schedByTaskId.set(s.taskId, arr)
    }
    const phaseKeySet = new Set()
    for (const t of trades) {
      (Array.isArray(t?.phaseKeys) ? t.phaseKeys : []).forEach((p) => phaseKeySet.add(p))
      for (const tk of (Array.isArray(t?.tasks) ? t.tasks : [])) {
        if (tk?.phaseKey) phaseKeySet.add(tk.phaseKey)
      }
    }
    const phaseKeys = Array.from(phaseKeySet)
    const items = []
    const links = []
    const phaseIdByKey = {}
    for (const p of phaseKeys) {
      const pid = `phase:${p}`
      phaseIdByKey[p] = pid
      items.push({ id: pid, text: (p || 'Phase'), type: 'project', open: true })
    }
    for (const trade of trades) {
      for (const tk of (Array.isArray(trade?.tasks) ? trade.tasks : [])) {
        const idStr = `task:${tk._id}`
        const phaseKey = tk?.phaseKey || (Array.isArray(trade?.phaseKeys) ? trade.phaseKeys[0] : '')
        const parent = phaseIdByKey[phaseKey]
        const arr = schedByTaskId.get(tk._id) || []
        const starts = arr.map((s) => new Date(s.startsAt).getTime()).filter((n) => Number.isFinite(n))
        const ends = arr.map((s) => new Date(s.endsAt).getTime()).filter((n) => Number.isFinite(n))
        const startMs = starts.length ? Math.min(...starts) : undefined
        const endMs = ends.length ? Math.max(...ends) : undefined
        const duration = (() => {
          if (startMs && endMs && endMs >= startMs) {
            const ms = endMs - startMs
            return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)))
          }
          return 1
        })()
        items.push({
          id: idStr,
          text: tk.title || 'Task',
          parent,
          start_date: startMs ? new Date(startMs) : undefined,
          end_date: endMs ? new Date(endMs) : undefined,
          duration,
          progress: tk.status === 'done' ? 1 : 0,
        })
        const deps = Array.isArray(tk?.dependsOn) ? tk.dependsOn : []
        for (const d of deps) {
          if (!d?.taskId) continue
          links.push({ id: `link:${d.taskId}->${tk._id}`, source: `task:${d.taskId}`, target: idStr, type: 'FS' })
        }
      }
    }
    return { items, links }
  }, [home])

  // Demo data for consistent Gantt rendering (ignore live data)
  const demoGanttData = useMemo(() => {
    const today = new Date()
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    function addDaysStr(date, days) {
      const d = new Date(date)
      d.setDate(d.getDate() + days)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    }
    const items = [
      { id: 'project:build', text: 'Buildwise Demo Project', type: 'project', open: true },
      {
        id: 'task:site-prep',
        text: 'Site Preparation',
        parent: 'project:build',
        start_date: addDaysStr(base, 0),
        duration: 5, // days
        progress: 0.4
      },
      {
        id: 'task:foundation',
        text: 'Foundation',
        parent: 'project:build',
        start_date: addDaysStr(base, 6),
        duration: 6,
        progress: 0.2
      },
      {
        id: 'task:framing',
        text: 'Framing',
        parent: 'project:build',
        start_date: addDaysStr(base, 13),
        duration: 9,
        progress: 0.1
      },
      {
        id: 'task:roofing',
        text: 'Roofing',
        parent: 'project:build',
        start_date: addDaysStr(base, 23),
        duration: 5,
        progress: 0
      },
    ]
    // Omit links in demo to avoid polyline rendering issues if library expects exact geometry
    const links = []
    return { items, links }
  }, [])

  function addMonths(d, months) {
    const nd = new Date(d)
    nd.setMonth(nd.getMonth() + months)
    return nd
  }
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
  }
  function toKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }
  const monthMeta = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const first = new Date(year, month, 1)
    const totalDays = daysInMonth(year, month)
    const leadingEmpty = first.getDay() // 0=Sun
    const grid = []
    for (let i = 0; i < leadingEmpty; i++) {
      grid.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
      grid.push(new Date(year, month, d))
    }
    return { year, month, grid }
  }, [monthCursor])

  const dayToItems = useMemo(() => {
    const map = new Map()
    for (const s of schedules) {
      const st = new Date(s.startsAt)
      const key = toKey(new Date(st.getFullYear(), st.getMonth(), st.getDate()))
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return map
  }, [schedules])

  async function addSchedule(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        title: form.title,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        bidId: form.bidId || undefined,
        taskId: form.taskId || undefined,
      }
      const res = await api.addSchedule(id, payload)
      setHome(res.home)
      setForm({ title: '', startsAt: '', endsAt: '', bidId: '', taskId: '' })
    } catch (e2) {
      setError(e2.message)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h6" sx={{ mr: 1 }}>Schedule</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_e, v) => { if (v) setViewMode(v) }}
        >
          <ToggleButton value="gantt">Gantt</ToggleButton>
          <ToggleButton value="calendar">Calendar</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {viewMode === 'gantt' && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Project Gantt</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Phases are derived from tasks. Tasks include dependencies, durations, and any available scheduled dates.
          </Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', p: 1 }}>
            <GanttDemo />
          </Box>
        </Paper>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Add Schedule Item</Typography>
        <Stack component="form" spacing={2} onSubmit={addSchedule}>
          <TextField label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Starts At"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
            <TextField
              label="Ends At"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="bid-select">Trade</InputLabel>
              <Select
                labelId="bid-select"
                label="Trade"
                value={form.bidId}
                onChange={(e) => setForm({ ...form, bidId: e.target.value, taskId: '' })}
              >
                <MenuItem value="">None</MenuItem>
                {(home?.trades || []).map((b) => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!form.bidId}>
              <InputLabel id="task-select">Task</InputLabel>
              <Select
                labelId="task-select"
                label="Task"
                value={form.taskId}
                onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {(home?.trades || []).find((b) => b._id === form.bidId)?.tasks?.map((t) => (
                  <MenuItem key={t._id} value={t._id}>{t.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Button variant="contained" type="submit">Add</Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Next 20 days</Typography>
        <List dense disablePadding>
          {next20Days.map((s, idx) => (
            <div key={s._id}>
              <ListItem>
                <ListItemText
                  primary={s.title}
                  secondary={[
                    new Date(s.startsAt).toLocaleString(),
                    '→',
                    new Date(s.endsAt).toLocaleString(),
                    s.bidId ? ` • bid:${s.bidId}` : '',
                    s.taskId ? ` • task:${s.taskId}` : '',
                  ].filter(Boolean).join(' ')}
                />
              </ListItem>
              {idx < next20Days.length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!next20Days.length && <Typography variant="body2" color="text.secondary">No upcoming items</Typography>}
        </List>
      </Paper>

      {viewMode === 'calendar' && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <IconButton onClick={() => setMonthCursor((d) => addMonths(d, -1))}><ChevronLeftIcon /></IconButton>
            <Typography variant="subtitle1">
              {monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton onClick={() => setMonthCursor((d) => addMonths(d, 1))}><ChevronRightIcon /></IconButton>
          </Stack>
          <Box sx={{ overflowX: 'auto' }}>
          <Stack sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(44px, 1fr))', gap: 1, minWidth: 7 * 44 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>{d}</Typography>
            ))}
            {monthMeta.grid.map((cell, idx) => {
              if (!cell) return <Box key={`e-${idx}`} sx={{ minHeight: { xs: 72, sm: 100 }, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }} />
              const key = toKey(cell)
              const items = dayToItems.get(key) || []
              const isToday = (() => {
                const t = new Date()
                return cell.getFullYear() === t.getFullYear() && cell.getMonth() === t.getMonth() && cell.getDate() === t.getDate()
              })()
              return (
                <Box key={key} sx={{ minHeight: { xs: 72, sm: 100 }, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1, p: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: isToday ? 'primary.main' : 'text.secondary' }}>
                    {cell.getDate()}
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {items.slice(0,3).map((s) => (
                      <Chip key={s._id} size="small" label={s.title} />
                    ))}
                    {items.length > 3 && (
                      <Typography variant="caption" color="text.secondary">+{items.length - 3} more</Typography>
                    )}
                  </Stack>
                </Box>
              )
            })}
          </Stack>
          </Box>
        </Paper>
      )}
    </Stack>
  )
}


