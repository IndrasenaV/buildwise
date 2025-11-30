import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

export default function HomeContacts() {
  const { id } = useParams()
  const [home, setHome] = useState(null)
  useEffect(() => {
    api.getHome(id).then(setHome).catch(() => {})
  }, [id])

  const client = home?.client
  const builder = home?.builder
  const monitors = home?.monitors || []

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Contacts</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Client</Typography>
        {client ? (
          <List dense disablePadding>
            <ListItem>
              <ListItemText primary={`${client.fullName} (${client.email})`} secondary={client.phone} />
            </ListItem>
          </List>
        ) : <Typography variant="body2" color="text.secondary">No client assigned</Typography>}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Builder</Typography>
        {builder ? (
          <List dense disablePadding>
            <ListItem>
              <ListItemText primary={`${builder.fullName} (${builder.email})`} secondary={builder.phone} />
            </ListItem>
          </List>
        ) : <Typography variant="body2" color="text.secondary">No builder assigned</Typography>}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Monitors</Typography>
        {monitors.length ? (
          <List dense disablePadding>
            {monitors.map((m, idx) => (
              <div key={m.email}>
                <ListItem>
                  <ListItemText primary={`${m.fullName} (${m.email})`} secondary={m.phone} />
                </ListItem>
                {idx < monitors.length - 1 && <Divider component="li" />}
              </div>
            ))}
          </List>
        ) : <Typography variant="body2" color="text.secondary">No monitors</Typography>}
      </Paper>
    </Stack>
  )
}


