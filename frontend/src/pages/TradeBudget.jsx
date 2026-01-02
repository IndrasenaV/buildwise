import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader.jsx'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadDocumentDialog from '../components/UploadDocumentDialog.jsx'
import BidCompareDialog from '../components/BidCompareDialog.jsx'

export default function TradeBudget() {
  const { id, bidId } = useParams()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [priceEdit, setPriceEdit] = useState(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({ label: '', amount: '', dueDate: '' })
  const [docDialogOpen, setDocDialogOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    api.getHome(id).then(setHome).catch((e) => setError(e.message))
  }, [id])

  const bid = useMemo(() => (home?.trades || []).find((b) => b._id === bidId), [home, bidId])
  const bidDocs = useMemo(() => {
    const tradePinned = (home?.documents || []).filter((d) => d.pinnedTo?.type === 'trade' && d.pinnedTo?.id === bidId)
    const tradeAttachments = (home?.trades || []).find((t) => t._id === bidId)?.attachments || []
    return [...tradeAttachments, ...tradePinned]
  }, [home, bidId])
  const bidPdfDocs = useMemo(() => (bidDocs || []).filter((d) => /\.pdf($|[\?#])/i.test(d?.url || '')), [bidDocs])
  const contractDocs = useMemo(() => (bidDocs || []).filter((d) => String(d?.category || '').toLowerCase() === 'contract'), [bidDocs])
  const invoices = useMemo(() => (bid?.invoices || []), [bid])
  const paidSum = useMemo(() => invoices.filter(i => i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0), [invoices])
  const fmtCurrency = (n) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

  async function savePrice() {
    setError('')
    try {
      const updated = await api.updateBid(id, bidId, { totalPrice: Number(priceEdit || 0) })
      setHome(updated)
      setPriceEdit(null)
    } catch (e) {
      setError(e.message)
    }
  }

  async function addInvoice() {
    setError('')
    try {
      const payload = { label: invoiceForm.label, amount: Number(invoiceForm.amount || 0), dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).toISOString() : undefined }
      const res = await api.addBidInvoice(id, bidId, payload)
      setHome(res.home)
      setInvoiceForm({ label: '', amount: '', dueDate: '' })
      setInvoiceDialogOpen(false)
    } catch (e) {
      setError(e.message)
    }
  }

  async function toggleInvoicePaid(invoiceId, currentPaid) {
    setError('')
    try {
      const res = await api.updateBidInvoice(id, bidId, invoiceId, { paid: !currentPaid })
      setHome(res)
    } catch (e) {
      setError(e.message)
    }
  }

  if (!bid) {
    return <Typography variant="body2">Loading… {error && <span style={{ color: 'red' }}>{error}</span>}</Typography>
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title={`Trade Budget — ${bid.name}`}
        onBack={() => navigate(-1)}
        breadcrumbs={[
          { label: 'Homes', href: '/homes' },
          { label: home?.name || 'Home', href: `/homes/${id}` },
          { label: 'Trades', href: `/homes/${id}/trades` },
          { label: bid.name },
        ]}
        actions={<Button variant="text" onClick={() => navigate(`/homes/${id}/trades/${bidId}`)}>Go to Execution</Button>}
      />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1">Pricing & Contract</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {(bid?.plannedCostRange && (typeof bid.plannedCostRange.min === 'number' || typeof bid.plannedCostRange.max === 'number')) && (
              <Chip
                size="small"
                variant="outlined"
                label={`Planned: ${typeof bid.plannedCostRange.min === 'number' ? fmtCurrency(bid.plannedCostRange.min) : '—'} – ${typeof bid.plannedCostRange.max === 'number' ? fmtCurrency(bid.plannedCostRange.max) : '—'}`}
              />
            )}
            <Chip
              size="small"
              color={bid?.contractSignedAt ? 'success' : 'default'}
              label={bid?.contractSignedAt ? `Contract Signed ${new Date(bid.contractSignedAt).toLocaleDateString()}` : 'No Contract Signed'}
            />
          </Stack>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {priceEdit === null ? (
            <>
              <Typography variant="body1"><strong>Total Trade Price:</strong> {fmtCurrency(bid.totalPrice ?? 0)}</Typography>
              <Button variant="outlined" onClick={() => setPriceEdit(bid.totalPrice ?? 0)}>Edit Price</Button>
              <Box sx={{ flex: 1 }} />
              <Typography variant="body2"><strong>Paid:</strong> {fmtCurrency(paidSum)}</Typography>
            </>
          ) : (
            <>
              <TextField
                label="Total Trade Price"
                type="number"
                value={priceEdit}
                onChange={(e) => setPriceEdit(Number(e.target.value))}
                sx={{ maxWidth: 260 }}
              />
              <Button variant="contained" onClick={savePrice}>Save</Button>
              <Button variant="text" onClick={() => setPriceEdit(null)}>Cancel</Button>
              <Box sx={{ flex: 1 }} />
              <Typography variant="body2"><strong>Paid:</strong> {fmtCurrency(paidSum)}</Typography>
            </>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Bid Comparison</Typography>
          <Button variant="contained" onClick={() => setCompareOpen(true)}>Open Compare</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Attach vendor bids as PDFs and run a side-by-side comparison.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Contracts</Typography>
          <Button variant="contained" onClick={() => setDocDialogOpen(true)}>Upload</Button>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <List dense disablePadding>
          {contractDocs.map((d, idx) => (
            <div key={d._id || `${idx}`}>
              <ListItem
                secondaryAction={
                  d?.pinnedTo?.type === 'trade' && d?._id ? (
                    <Tooltip title="Delete file">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={async () => {
                          try {
                            if (!confirm('Delete this file from the project?')) return
                            const res = await api.deleteDocument(id, d._id)
                            setHome(res.home)
                          } catch (e) {
                            setError(e.message)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null
                }
              >
                <ListItemText
                  primary={<a href={d.url} target="_blank" rel="noreferrer">{d.title}</a>}
                  secondary={d.createdAt ? `Uploaded: ${new Date(d.createdAt).toLocaleString()}` : undefined}
                />
              </ListItem>
              {idx < contractDocs.length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!contractDocs.length && <Typography variant="body2" color="text.secondary">No contract files</Typography>}
        </List>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Invoices</Typography>
          <Button variant="contained" onClick={() => setInvoiceDialogOpen(true)}>Add Invoice</Button>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <List dense disablePadding>
          {(invoices || []).map((inv, idx) => (
            <div key={inv._id || `${idx}`}>
              <ListItem
                secondaryAction={
                  <Button size="small" variant="text" onClick={() => toggleInvoicePaid(inv._id, inv.paid)}>
                    {inv.paid ? 'Mark Unpaid' : 'Mark Paid'}
                  </Button>
                }
              >
                <ListItemText
                  primary={`${inv.label} — ${fmtCurrency(inv.amount)} ${inv.paid ? '(Paid)' : ''}`}
                  secondary={inv.dueDate ? `Due: ${new Date(inv.dueDate).toLocaleDateString()}` : undefined}
                />
              </ListItem>
              {idx < (invoices || []).length - 1 && <Divider component="li" />}
            </div>
          ))}
          {!invoices?.length && <Typography variant="body2" color="text.secondary">No invoices yet</Typography>}
        </List>
      </Paper>

      <UploadDocumentDialog
        open={docDialogOpen}
        onClose={() => setDocDialogOpen(false)}
        homeId={id}
        trades={home?.trades || []}
        defaultPinnedType="trade"
        defaultTradeId={bidId}
        onCompleted={(updatedHome) => setHome(updatedHome)}
      />
      <BidCompareDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        homeId={id}
        tradeId={bidId}
        existingDocs={bidPdfDocs}
        onAfterUpload={(updatedHome) => setHome(updatedHome)}
      />

      <Dialog open={invoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Invoice / Payment</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Label" value={invoiceForm.label} onChange={(e) => setInvoiceForm((f) => ({ ...f, label: e.target.value }))} fullWidth />
            <TextField label="Amount" type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: e.target.value }))} fullWidth />
            <TextField label="Due Date" type="date" InputLabelProps={{ shrink: true }} value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDate: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addInvoice}>Add</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}


