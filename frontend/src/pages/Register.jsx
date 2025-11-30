import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'

export default function Register() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions to continue.')
      return
    }
    try {
      const { token, user } = await api.register({ email, fullName, password, phone })
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('userEmail', user.email)
      } catch {}
      // After register, go to first home if exists, else onboarding
      try {
        const homes = await api.listMyHomes()
        if (homes?.length) {
          navigate(`/homes/${homes[0]._id}`)
          return
        }
      } catch {}
      navigate('/onboarding')
    } catch (e2) {
      setError(e2.message)
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={onSubmit}>
      <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <TextField label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <FormControlLabel
        control={<Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />}
        label={
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
            , including data use, analytics tracking, and AI output limitations.
          </span>
        }
      />
      {!acceptedTerms && (
        <FormHelperText error>
          You must accept the Terms and Conditions to create an account.
        </FormHelperText>
      )}
      <Button type="submit" variant="contained" disabled={!acceptedTerms}>Create Account</Button>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  )
}


