import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import LinearProgress from '@mui/material/LinearProgress'
import BidCompareDialog from '../components/BidCompareDialog.jsx'
// Icons for common trades
import TradeAvatar from '../components/TradeAvatar.jsx'

export default function HomeTrades() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [compareDlg, setCompareDlg] = useState({ open: false, tradeId: '' })
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.getHome(id).then(setHome).catch((e) => setError(e.message))
  }, [id])

  const trades = useMemo(() => home?.trades || [], [home])
  const filteredTrades = useMemo(() => {
    const q = String(query || '').toLowerCase().trim()
    if (!q) return trades
    return trades.filter((t) => {
      const vendor = t?.vendor?.name || t?.vendor?.contactName || ''
      const phases = (t?.phaseKeys || []).join(' ')
      return [t.name, vendor, phases].some((s) => String(s || '').toLowerCase().includes(q))
    })
  }, [trades, query])
  const docsByTrade = useMemo(() => {
    const map = {}
    const allDocs = Array.isArray(home?.documents) ? home.documents : []
    for (const t of trades) {
      const pinned = allDocs.filter((d) => d?.pinnedTo?.type === 'trade' && d?.pinnedTo?.id === t._id)
      const attachments = Array.isArray(t?.attachments) ? t.attachments : []
      map[t._id] = [...attachments, ...pinned]
    }
    return map
  }, [home, trades])

  const computeTaskProgress = (trade) => {
    const tasks = Array.isArray(trade?.tasks) ? trade.tasks : []
    const done = tasks.filter((t) => t && t.status === 'done').length
    const total = tasks.length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { done, total, pct }
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6'>Trades</Typography>
      {error && <Alert severity='error'>{error}</Alert>}

      <Paper variant='outlined' sx={{ p: 2 }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search trades by name, vendor, or phase…'
          fullWidth
          size='small'
        />
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {filteredTrades.map((t) => {
              const prog = computeTaskProgress(t)
              return (
                <Grid item xs={12} sm={6} md={4} key={t._id}>
                  <Card
                    variant='outlined'
                    sx={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    onClick={() => navigate(`/homes/${id}/trades/${t._id}`)}
                  >
                    <CardHeader
                      avatar={<TradeAvatar trade={t} />}
                      title={<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>{t.name}</Typography>}
                      subheader={
                        <Typography variant='caption' color='text.secondary'>
                          {(t?.vendor?.name || t?.vendor?.contactName) ? (t?.vendor?.name || t?.vendor?.contactName) : '—'}
                        </Typography>
                      }
                      sx={{ pb: 0.5 }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                        {(t?.phaseKeys || []).map((p) => <Chip key={p} size='small' label={p} />)}
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant='caption' color='text.secondary'>Tasks {prog.done} / {prog.total}</Typography>
                        <LinearProgress variant='determinate' value={prog.pct} />
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      <Button size='small' variant='outlined' onClick={() => setCompareDlg({ open: true, tradeId: t._id })}>
                        Compare Bids
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
            {!filteredTrades.length && (
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>No trades found</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
      <BidCompareDialog
        open={compareDlg.open}
        onClose={() => setCompareDlg({ open: false, tradeId: '' })}
        homeId={id}
        tradeId={compareDlg.tradeId}
        existingDocs={(docsByTrade[compareDlg.tradeId] || []).filter((d) => /\.pdf($|[\?#])/i.test(d?.url || ''))}
        onAfterUpload={(updatedHome) => setHome(updatedHome)}
      />
    </Stack>
  )
}


