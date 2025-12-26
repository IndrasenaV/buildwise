import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const AGENTS = [
  // Planning: Architect
  {
    id: 'architect',
    title: 'Architect Assistant',
    promptKey: '', // fallback to preface if no DB prompt configured
    preface: 'You are an expert architect assistant for residential projects. Reference plan context, room analysis, compliance, and design trade-offs. Produce concise, actionable guidance.',
    welcome: 'Hi! I’m your Architect Assistant. Ask me about plans, rooms, code compliance, and design trade-offs.',
  },
  // Planning: Windows & Doors
  {
    id: 'windows',
    title: 'Windows & Doors Assistant',
    promptKey: 'assistant.windows_doors',
    preface: 'You specialize in windows and doors. Guide on window materials (vinyl, composite, wood, aluminum, steel/iron), glazing (double/triple), U-factor/SHGC basics, and door types, balancing performance and budget.',
    welcome: 'Hello! I’m the Windows & Doors Assistant. I can recommend window tiers, glazing, and door options to meet your budget.',
  },
  // Planning: Flooring
  {
    id: 'flooring',
    title: 'Flooring Assistant',
    promptKey: 'assistant.flooring',
    preface: 'You specialize in flooring. Help choose carpet, hardwood, or tile per room with cost per sqft estimates, durability, and maintenance trade-offs. Optimize to meet budget.',
    welcome: 'Hi! I’m your Flooring Assistant. I can help choose room-by-room flooring and optimize to budget.',
  },
  // Planning: Cabinets
  {
    id: 'cabinets',
    title: 'Cabinets Assistant',
    promptKey: 'assistant.cabinets',
    preface: 'You specialize in cabinets. Advise on custom vs prebuilt, materials (MDF, plywood, hardwood, melamine), finish options, and linear-foot cost estimates.',
    welcome: 'Hi! I’m your Cabinets Assistant. I can help with cabinet types, materials, finishes, and cost estimates.',
  },
  // Planning: Appliances
  {
    id: 'appliances',
    title: 'Appliances Assistant',
    promptKey: '', // seed until DB prompt exists
    preface: 'You specialize in appliance selection (kitchen and laundry). Provide guidance on sizing, fuel types, efficiency, noise, ventilation, and rough-in considerations. Keep within budget.',
    welcome: 'Hi! I’m your Appliances Assistant. Ask me about selecting kitchen and laundry appliances within budget.',
  },
  // Planning: Knowledge/Research
  {
    id: 'knowledge',
    title: 'Knowledge Assistant',
    promptKey: '',
    preface: 'You are a research assistant. Use available project knowledge and context to summarize, compare, and explain relevant guidance in clear steps.',
    welcome: 'Hi! I’m your Knowledge Assistant. I can summarize and find relevant guidance for your project.',
  },
  // Budget
  {
    id: 'budget',
    title: 'Budget Assistant',
    promptKey: '',
    preface: 'You are a budgeting assistant. Help estimate, compare, and reconcile costs across trades and selections. Call out savings opportunities.',
    welcome: 'Hi! I’m your Budget Assistant. I can help estimate and optimize costs across the project.',
  },
  // Trades
  {
    id: 'trades',
    title: 'Trades Assistant',
    promptKey: '',
    preface: 'You specialize in construction trades and scopes. Help compare bids, clarify scope, and suggest quality checkpoints.',
    welcome: 'Hi! I’m your Trades Assistant. I can help compare bids and clarify scope details.',
  },
  // Schedule / Coordination
  {
    id: 'schedule',
    title: 'Project Coordinator',
    promptKey: '',
    preface: 'You are a project coordinator. Help with timelines, dependencies, and next steps to keep the project on schedule.',
    welcome: 'Hi! I’m your Project Coordinator. I can help plan next steps and resolve blockers.',
  },
  // Documents
  {
    id: 'documents',
    title: 'Documents Assistant',
    promptKey: '',
    preface: 'You help with documents and submittals. Provide guidance on organizing, naming, and extracting key info.',
    welcome: 'Hi! I’m your Documents Assistant. I can help manage and interpret project documents.',
  },
  // Messages / Communications
  {
    id: 'messages',
    title: 'Communications Assistant',
    promptKey: '',
    preface: 'You help draft clear, concise project communications for owners, architects, and trades.',
    welcome: 'Hi! I’m your Communications Assistant. I can help draft and clarify project messages.',
  },
];

function chooseDefaultAgent(pathname) {
  const p = String(pathname || '').toLowerCase();
  if (p.includes('/planning/windows-doors')) return 'windows';
  if (p.includes('/planning/flooring')) return 'flooring';
  if (p.includes('/planning/cabinets')) return 'cabinets';
  if (p.includes('/planning/appliances')) return 'appliances';
  if (p.includes('/planning/knowledge')) return 'knowledge';
  if (p.includes('/planning/architect')) return 'architect';
  if (p.includes('/budget')) return 'budget';
  if (p.includes('/trades')) return 'trades';
  if (p.includes('/schedule')) return 'schedule';
  if (p.includes('/documents')) return 'documents';
  if (p.includes('/messages')) return 'messages';
  if (p.includes('/planning')) return 'architect';
  if (p.includes('/preconstruction') || p.includes('/exterior') || p.includes('/interior')) return 'schedule';
  return 'architect';
}

export default function AgentChat({ homeId }) {
  const location = useLocation();
  const [selectedAgentId, setSelectedAgentId] = useState(chooseDefaultAgent(location.pathname));
  const [userPinned, setUserPinned] = useState(false);
  const [messagesByAgent, setMessagesByAgent] = useState({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    // Auto-switch agent on route change unless user pinned a selection
    const next = chooseDefaultAgent(location.pathname);
    setSelectedAgentId((prev) => (userPinned ? prev : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, userPinned]);

  const agent = useMemo(() => AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0], [selectedAgentId]);
  const messages = useMemo(() => messagesByAgent[selectedAgentId] || [], [messagesByAgent, selectedAgentId]);

  useEffect(() => {
    // Show welcome on first open per agent
    if ((messages || []).length === 0 && agent?.welcome) {
      setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [{ role: 'assistant', content: agent.welcome }] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!homeId || !String(input || '').trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [ ...(prev[selectedAgentId] || []), userMsg ] }));
    setInput('');
    setIsLoading(true);
    try {
      const history = (messages || []).slice(-5).map((m) => ({ role: m.role, content: m.content }));
      const message = agent?.preface ? `${agent.preface}\n\nUser: ${userMsg.content}` : userMsg.content;
      const payload = { homeId, message, history };
      if (agent?.promptKey) payload.promptKey = agent.promptKey;
      const res = await api.chat(payload);
      const aiMsg = { role: 'assistant', content: res.reply, context: res.contextUsed };
      setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [ ...(prev[selectedAgentId] || []), aiMsg ] }));
    } catch (_e) {
      setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [ ...(prev[selectedAgentId] || []), { role: 'assistant', content: "Sorry, I couldn't get an answer right now." } ] }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SmartToyIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{agent?.title || 'Assistant'}</Typography>
        </Stack>
        <Tooltip title="Change agent">
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Change agent"
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {AGENTS.map((a) => (
            <MenuItem
              key={a.id}
              selected={a.id === selectedAgentId}
              onClick={() => {
                setSelectedAgentId(a.id);
                setUserPinned(true);
                setMenuAnchor(null);
              }}
            >
              {a.title}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {(!messages || messages.length === 0) && (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: 'text.secondary', textAlign: 'center' }}>
            <SmartToyIcon sx={{ fontSize: 42, opacity: 0.25, mb: 1 }} />
            <Typography variant="body2">Start chatting with {agent?.title || 'Assistant'}.</Typography>
          </Stack>
        )}
        <Stack spacing={2}>
          {(messages || []).map((m, i) => (
            <Box key={i} sx={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: m.role === 'user' ? 'primary.main' : 'common.white',
                  color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  borderTopRightRadius: m.role === 'user' ? 0 : 2,
                  borderTopLeftRadius: m.role === 'assistant' ? 0 : 2,
                  border: m.role === 'assistant' ? 1 : 0,
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2">{m.content}</Typography>
              </Paper>
              {m.context && m.context.length > 0 && (
                <Box sx={{ mt: 0.5, ml: 1 }}>
                  <Tooltip
                    title={
                      <Stack spacing={0.5}>
                        {m.context.slice(0, 3).map((c, idx) => (
                          <Typography key={idx} variant="caption" display="block">• {c.substring(0, 80)}...</Typography>
                        ))}
                      </Stack>
                    }
                    arrow
                    placement="right"
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                      <InfoIcon fontSize="inherit" /> Context used
                    </Typography>
                  </Tooltip>
                </Box>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ alignSelf: 'flex-start' }}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'common.white', border: 1, borderColor: 'divider', borderRadius: 2, borderTopLeftRadius: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Thinking...</Typography>
                </Stack>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'common.white' }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder={`Ask ${agent?.title || 'Assistant'}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !homeId}
            autoComplete="off"
          />
          <IconButton type="submit" color="primary" disabled={isLoading || !String(input || '').trim() || !homeId}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}


