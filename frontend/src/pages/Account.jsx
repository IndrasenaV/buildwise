import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Alert from '@mui/material/Alert'

export default function Account() {
  const [account, setAccount] = useState(null)
  const [sub, setSub] = useState(null)
  const [homes, setHomes] = useState([])
  const [homeSubs, setHomeSubs] = useState([])
  const [invite, setInvite] = useState({ email: '', fullName: '', role: 'member' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const myEmail = useMemo(() => {
    try { return localStorage.getItem('userEmail') || '' } catch { return '' }
  }, [])

  const myRole = useMemo(() => {
    if (!account || !myEmail) return ''
    const m = (account.members || []).find((mm) => (mm.email || '').toLowerCase() === myEmail.toLowerCase())
    return m?.role || ''
  }, [account, myEmail])

  const canManage = myRole === 'owner' || myRole === 'admin'

  async function load() {
    try {
      setLoading(true)
      // Ensure account exists
      const acc = await api.getMyAccount()
      setAccount(acc)
      const s = await api.getSubscription()
      setSub(s)
      const [homesList, subsList] = await Promise.all([
        api.listMyHomes(),
        api.listAccountSubscriptions()
      ])
      setHomes(homesList || [])
      setHomeSubs(subsList || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onInvite(e) {
    e.preventDefault()
    setError('')
    try {
      if (!invite.email) return
      const updated = await api.inviteAccountMember(invite)
      setAccount(updated)
      setInvite({ email: '', fullName: '', role: 'member' })
    } catch (e2) {
      setError(e2.message)
    }
  }

  async function updateRole(email, role) {
    setError('')
    try {
      const updated = await api.updateAccountMemberRole({ email, role })
      setAccount(updated)
    } catch (e2) {
      setError(e2.message)
    }
  }

  async function remove(email) {
    setError('')
    try {
      const updatedAcc = await api.removeAccountMember(email)
      setAccount(updatedAcc)
    } catch (e2) {
      setError(e2.message)
    }
  }

  async function setSubAction(action) {
    setError('')
    try {
      const s = await api.updateSubscription(action)
      setSub(s)
    } catch (e2) {
      setError(e2.message)
    }
  }

  function subForHome(id) {
    return (homeSubs || []).find((s) => String(s.homeId) === String(id))
  }

  async function createHomeSub(homeId, planId) {
    setError('')
    try {
      const created = await api.createAccountSubscription({ homeId, planId })
      setHomeSubs((prev) => {
        const other = prev.filter((s) => String(s.homeId) !== String(homeId))
        return [...other, created]
      })
    } catch (e2) {
      setError(e2.message)
    }
  }

  async function updateHomeSub(homeId, action, planId) {
    setError('')
    try {
      const updated = await api.updateAccountHomeSubscription({ homeId, action, planId })
      setHomeSubs((prev) => prev.map((s) => (String(s.homeId) === String(homeId) ? updated : s)))
    } catch (e2) {
      setError(e2.message)
    }
  }

  function fmtDate(d) {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return String(d)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>Account & Subscription</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Subscription</Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography>Status: <strong>{sub?.status || 'inactive'}</strong></Typography>
          <Box sx={{ flexGrow: 1 }} />
          {canManage && (
            <>
              {sub?.status === 'active' ? (
                <Button variant="outlined" color="warning" onClick={() => setSubAction('cancel')}>Cancel</Button>
              ) : (
                <Button variant="contained" onClick={() => setSubAction('resume')}>Resume</Button>
              )}
            </>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Per-Home Subscriptions</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Home</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(homes || []).map((h) => {
              const subH = subForHome(h._id)
              const canStart = !subH || subH.status !== 'active'
              const [planState, setPlanState] = [undefined, undefined] // placeholder to satisfy linter (we won't use hooks in map)
              return (
                <TableRow key={h._id}>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>
                    {subH ? (
                      canManage ? (
                        <Select
                          size="small"
                          value={subH.planId}
                          onChange={(e) => updateHomeSub(h._id, 'change_plan', e.target.value)}
                        >
                          <MenuItem value="guide">Guide</MenuItem>
                          <MenuItem value="ai_assurance">AI Assurance</MenuItem>
                        </Select>
                      ) : (
                        subH.planId === 'guide' ? 'Guide' : 'AI Assurance'
                      )
                    ) : (
                      canManage ? (
                        <Select
                          size="small"
                          defaultValue="guide"
                          onChange={(e) => createHomeSub(h._id, e.target.value)}
                        >
                          <MenuItem value="guide">Guide</MenuItem>
                          <MenuItem value="ai_assurance">AI Assurance</MenuItem>
                        </Select>
                      ) : (
                        '-'
                      )
                    )}
                  </TableCell>
                  <TableCell>{subH?.status || 'inactive'}</TableCell>
                  <TableCell>{fmtDate(subH?.startedAt)}</TableCell>
                  <TableCell align="right">
                    {canManage && (
                      subH?.status === 'active' ? (
                        <Button size="small" color="warning" onClick={() => updateHomeSub(h._id, 'cancel')}>Cancel</Button>
                      ) : (
                        <Button size="small" variant="contained" onClick={() => updateHomeSub(h._id, 'resume')}>Resume</Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Members</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(account?.members || []).map((m) => (
              <TableRow key={m.email}>
                <TableCell>{m.email}{String(m.email || '').toLowerCase() === String(account?.primaryEmail || '').toLowerCase() ? ' (owner)' : ''}</TableCell>
                <TableCell>{m.fullName || '-'}</TableCell>
                <TableCell>
                  {String(m.email || '').toLowerCase() === String(account?.primaryEmail || '').toLowerCase() ? (
                    'owner'
                  ) : canManage ? (
                    <Select size="small" value={m.role || 'member'} onChange={(e) => updateRole(m.email, e.target.value)}>
                      <MenuItem value="member">member</MenuItem>
                      <MenuItem value="admin">admin</MenuItem>
                    </Select>
                  ) : (
                    m.role || 'member'
                  )}
                </TableCell>
                <TableCell align="right">
                  {canManage && String(m.email || '').toLowerCase() !== String(account?.primaryEmail || '').toLowerCase() && (
                    <IconButton onClick={() => remove(m.email)} aria-label="remove">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {canManage && (
          <Box component="form" onSubmit={onInvite} sx={{ mt: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField label="Email" type="email" required value={invite.email} onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))} />
              <TextField label="Full Name" value={invite.fullName} onChange={(e) => setInvite((s) => ({ ...s, fullName: e.target.value }))} />
              <Select size="small" value={invite.role} onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value }))}>
                <MenuItem value="member">member</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
              <Button type="submit" variant="contained">Invite</Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  )
}


