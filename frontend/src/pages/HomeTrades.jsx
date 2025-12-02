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
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import BidCompareDialog from '../components/BidCompareDialog.jsx'
import TableContainer from '@mui/material/TableContainer'

export default function HomeTrades() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [compareDlg, setCompareDlg] = useState({ open: false, tradeId: '' })

  useEffect(() => {
    api.getHome(id).then(setHome).catch((e) => setError(e.message))
  }, [id])

  const trades = useMemo(() => home?.trades || [], [home])
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

      <Paper variant='outlined' sx={{ maxHeight: { xs: 'none', md: 'calc(100vh - 200px)' } }}>
        <TableContainer sx={{ maxHeight: { xs: 'none', md: 'calc(100vh - 260px)' } }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Trade</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Vendor</TableCell>
                <TableCell>Phases</TableCell>
                <TableCell align='right'>Tasks</TableCell>
                <TableCell align='center' sx={{ width: 120 }}>Progress</TableCell>
                <TableCell align='right' sx={{ width: 160 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((t) => {
                const prog = computeTaskProgress(t)
                return (
                  <TableRow
                    key={t._id}
                    hover
                    onClick={() => navigate(`/homes/${id}/trades/${t._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>{t.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant='body2' color='text.secondary'>
                        {(t?.vendor?.name || t?.vendor?.contactName) ? (t?.vendor?.name || t?.vendor?.contactName) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {(t?.phaseKeys || []).map((p) => <Chip key={p} size='small' label={p} />)}
                      </Stack>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{prog.done} / {prog.total}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        size='small'
                        label={`${prog.pct}%`}
                        color={prog.pct >= 80 ? 'success' : prog.pct >= 50 ? 'info' : 'default'}
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell align='right' onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setCompareDlg({ open: true, tradeId: t._id })}
                        >
                          Compare Bids
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!trades.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant='body2' color='text.secondary'>No trades yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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


