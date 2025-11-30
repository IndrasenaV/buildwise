import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { token, user } = await api.login({ email, password })
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('userEmail', user.email)
      } catch {}
      // try to navigate to last home or user's first home
      try {
        const last = localStorage.getItem('lastHomeId')
        if (last) {
          navigate(`/homes/${last}`)
          return
        }
      } catch {}
      const homes = await api.listMyHomes()
      if (homes?.length) {
        navigate(`/homes/${homes[0]._id}`)
      } else {
        navigate('/onboarding')
      }
    } catch (e2) {
      setError(e2.message)
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={onSubmit}>
      <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" variant="contained">Continue</Button>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  )
}


