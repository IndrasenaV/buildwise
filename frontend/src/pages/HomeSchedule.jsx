import { useEffect, useMemo, useState } from 'react'
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

export default function HomeSchedule() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', startsAt: '', endsAt: '', bidId: '', taskId: '' })
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

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
      <Typography variant="h6">Schedule</Typography>
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
    </Stack>
  )
}


