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
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

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
    promptKey: 'assistant.appliances',
    preface: 'You specialize in appliance selection (kitchen and laundry). Provide guidance on sizing, fuel types, efficiency, noise, ventilation, and rough-in considerations. Keep within budget.',
    welcome: 'Hi! I’m your Appliances Assistant. Ask me about selecting kitchen and laundry appliances within budget.',
  },
  // Planning: HVAC
  {
    id: 'hvac',
    title: 'HVAC Assistant',
    promptKey: 'assistant.hvac',
    preface: 'You specialize in HVAC planning. Propose system types, zoning, ventilation and IAQ guidance based on rooms, levels, and square footage.',
    welcome: 'Hi! I’m your HVAC Assistant. I can help with system type, zoning, ventilation, and IAQ.',
  },
  // Planning: Electrical
  {
    id: 'electrical',
    title: 'Electrical Assistant',
    promptKey: 'assistant.electrical',
    preface: 'You specialize in electrical planning. Help design circuits, lighting, and low-voltage runs with practical code-aware guidance.',
    welcome: 'Hi! I’m your Electrical Assistant. I can help plan circuits, lighting, and low-voltage rough-ins.',
  },
  // Planning: Plumbing
  {
    id: 'plumbing',
    title: 'Plumbing Assistant',
    promptKey: 'assistant.plumbing',
    preface: 'You specialize in plumbing planning. Help enumerate fixtures and rough-ins per room and highlight special venting or slope needs.',
    welcome: 'Hi! I’m your Plumbing Assistant. I can help plan fixtures and rough-ins by room.',
  },
  // Planning: Exterior Materials
  {
    id: 'exterior',
    title: 'Exterior Materials Assistant',
    promptKey: 'assistant.exterior_materials',
    preface: 'You specialize in exterior materials. Help select roofing, cladding, trim, and finishes with weatherproofing details.',
    welcome: 'Hi! I’m your Exterior Materials Assistant. I can help with roofing, cladding, and finishes.',
  },
  // Planning: Insulation
  {
    id: 'insulation',
    title: 'Insulation Assistant',
    promptKey: 'assistant.insulation',
    preface: 'You specialize in insulation planning. Recommend types and R-values by area, with air sealing and vapor control reminders.',
    welcome: 'Hi! I’m your Insulation Assistant. I can help choose insulation types and R-values.',
  },
  // Planning: Drywall & Paint
  {
    id: 'drywall_paint',
    title: 'Drywall & Paint Assistant',
    promptKey: 'assistant.drywall_paint',
    preface: 'You specialize in drywall and paint. Define finish levels and paint schedules with sequencing guidance.',
    welcome: 'Hi! I’m your Drywall & Paint Assistant. I can help define finishes and paint schedules.',
  },
  // Planning: Countertops
  {
    id: 'countertops',
    title: 'Countertops Assistant',
    promptKey: 'assistant.countertops',
    preface: 'You specialize in countertop planning. Help select materials, thickness, edges, and splash with install considerations.',
    welcome: 'Hi! I’m your Countertops Assistant. I can help choose materials and edges.',
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
  // Product
  {
    id: 'product',
    title: 'Product Assistant',
    promptKey: 'assistant.product',
    preface: 'You are the Buildwise AI product assistant. Explain features, where to find things, recommended workflows, and how to use tools. Be clear and concise, and guide the user step by step.',
    welcome: 'Hi! I’m the Product Assistant. I can explain how to use Buildwise AI and where to find what you need.',
  },
];

function chooseDefaultAgent(pathname) {
  const p = String(pathname || '').toLowerCase();
  // Non-home routes default to Product Assistant
  if (!p.includes('/homes/')) return 'product';
  if (p.includes('/planning/windows-doors')) return 'windows';
  if (p.includes('/planning/flooring')) return 'flooring';
  if (p.includes('/planning/cabinets')) return 'cabinets';
  if (p.includes('/planning/appliances')) return 'appliances';
  if (p.includes('/planning/knowledge')) return 'knowledge';
  if (p.includes('/planning/hvac')) return 'hvac';
  if (p.includes('/planning/insulation')) return 'insulation';
  if (p.includes('/planning/exterior-materials')) return 'exterior';
  if (p.includes('/planning/countertops')) return 'countertops';
  if (p.includes('/planning/electrical')) return 'electrical';
  if (p.includes('/planning/plumbing')) return 'plumbing';
  if (p.includes('/planning/drywall-paint')) return 'drywall_paint';
  if (p.includes('/planning/architect')) return 'architect';
  if (p.includes('/budget')) return 'budget';
  if (p.includes('/trades')) return 'trades';
  if (p.includes('/schedule')) return 'schedule';
  if (p.includes('/permits')) return 'product';
  if (p.includes('/dashboard')) return 'product';
  if (p.includes('/documents')) return 'documents';
  if (p.includes('/messages')) return 'messages';
  if (p.includes('/planning')) return 'architect';
  if (p.includes('/preconstruction') || p.includes('/exterior') || p.includes('/interior')) return 'schedule';
  // Fallback to Product Assistant for unmatched routes
  return 'product';
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

  async function sendAssistantMessage(userText, overridePromptKey) {
    if (!homeId || !String(userText || '').trim()) return;
    const userMsg = { role: 'user', content: userText };
    setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [ ...(prev[selectedAgentId] || []), userMsg ] }));
    setIsLoading(true);
    try {
      const currentMsgs = (messagesByAgent[selectedAgentId] || []);
      const history = currentMsgs.slice(-5).map((m) => ({ role: m.role, content: m.content }));
      const message = agent?.preface ? `${agent.preface}\n\nUser: ${userMsg.content}` : userMsg.content;
      const payload = { homeId, message, history };
      const key = typeof overridePromptKey === 'string' && overridePromptKey.trim() ? overridePromptKey : (agent?.promptKey || '');
      if (key) payload.promptKey = key;
      const res = await api.chat(payload);
      const aiMsg = { role: 'assistant', content: res.reply, context: res.contextUsed, rich: res.rich };
      setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [ ...(prev[selectedAgentId] || []), aiMsg ] }));
    } catch (_e) {
      setMessagesByAgent((prev) => ({ ...prev, [selectedAgentId]: [ ...(prev[selectedAgentId] || []), { role: 'assistant', content: "Sorry, I couldn't get an answer right now." } ] }));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    function onExternalPrompt(ev) {
      try {
        const detail = ev?.detail || {};
        const text = String(detail.message || '').trim();
        const desiredAgent = String(detail.agentId || '').trim();
        const overridePromptKey = String(detail.promptKey || '').trim();
        if (desiredAgent && !userPinned) {
          setSelectedAgentId(desiredAgent);
        }
        if (text) {
          // slight delay to allow agent switch state to apply
          setTimeout(() => { sendAssistantMessage(text, overridePromptKey) }, desiredAgent ? 50 : 0);
        }
      } catch {}
    }
    window.addEventListener('agentchat:prompt', onExternalPrompt);
    return () => window.removeEventListener('agentchat:prompt', onExternalPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPinned, selectedAgentId, messagesByAgent, homeId]);

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
      const aiMsg = { role: 'assistant', content: res.reply, context: res.contextUsed, rich: res.rich };
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
        <Tooltip title="Expand/collapse chat">
          <IconButton
            size="small"
            aria-label="Expand chat"
            onClick={() => window.dispatchEvent(new CustomEvent('agentchat:toggleExpand'))}
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Change agent">
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Change agent"
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={userPinned ? 'Unpin agent' : 'Pin agent'}>
          <IconButton
            size="small"
            onClick={() => setUserPinned((v) => !v)}
            aria-label={userPinned ? 'Unpin agent' : 'Pin agent'}
            sx={{ ml: 1 }}
          >
            {userPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
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
                setMenuAnchor(null);
              }}
            >
              {a.title}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
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
                  color: m.role === 'user' ? 'primary.contrastText' : '#111',
                  borderRadius: 2,
                  borderTopRightRadius: m.role === 'user' ? 0 : 2,
                  borderTopLeftRadius: m.role === 'assistant' ? 0 : 2,
                  border: m.role === 'assistant' ? 1 : 0,
                  borderColor: 'divider'
                }}
              >
                {m.role === 'assistant' && m.rich ? (
                  <Stack spacing={1.5}>
                    {m.rich.answer && (
                      <Typography variant="body2">{m.rich.answer}</Typography>
                    )}
                    {Array.isArray(m.rich.images) && m.rich.images.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: .5 }}>Images</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
                          {m.rich.images.map((img, idx) => (
                            <Box key={idx} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: 'common.white' }}>
                              <a href={img.sourceUrl || img.fullUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                                <img
                                  src={img.thumbUrl || img.fullUrl}
                                  alt={img.alt || 'image'}
                                  style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                                  loading="lazy"
                                />
                              </a>
                              <Box sx={{ p: .5 }}>
                                <Typography variant="caption" color="text.secondary" noWrap title={img.domain || ''}>
                                  {img.domain || ''}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    {Array.isArray(m.rich.comparisons) && m.rich.comparisons.map((cmp, idx) => (
                      <Box key={idx}>
                        {cmp.title && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{cmp.title}</Typography>}
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {cmp.columns.map((c, ci) => (
                                  <TableCell key={ci} sx={{ fontWeight: 600 }}>{c}</TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cmp.rows.map((row, ri) => (
                                <TableRow key={ri}>
                                  {row.map((cell, ci) => (
                                    <TableCell key={ci}>
                                      <Typography variant="body2">{cell}</Typography>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                    {Array.isArray(m.rich.options) && m.rich.options.length > 0 && (
                      <Stack spacing={1}>
                        {m.rich.options.map((opt, oi) => (
                          <Card key={oi} variant="outlined">
                            {opt.name && <CardHeader title={opt.name} sx={{ py: 1.0 }} />}
                            <CardContent sx={{ pt: 0, '&:last-child': { pb: 1 } }}>
                              <Stack spacing={1}>
                                {(opt.pros && opt.pros.length > 0) || (opt.cons && opt.cons.length > 0) ? (
                                  <Stack direction="row" spacing={2} alignItems="flex-start">
                                    {opt.pros && opt.pros.length > 0 && (
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Pros</Typography>
                                        <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                                          {opt.pros.map((p, pi) => <Typography key={pi} component="li" variant="body2">{p}</Typography>)}
                                        </Stack>
                                      </Box>
                                    )}
                                    {opt.cons && opt.cons.length > 0 && (
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Cons</Typography>
                                        <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                                          {opt.cons.map((c, ci) => <Typography key={ci} component="li" variant="body2">{c}</Typography>)}
                                        </Stack>
                                      </Box>
                                    )}
                                  </Stack>
                                ) : null}
                                {opt.attributes && (
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableBody>
                                        {Array.isArray(opt.attributes)
                                          ? opt.attributes.map((pair, pk) => (
                                              <TableRow key={pk}>
                                                <TableCell sx={{ fontWeight: 600, width: '35%' }}>{pair?.key}</TableCell>
                                                <TableCell>{pair?.value}</TableCell>
                                              </TableRow>
                                            ))
                                          : Object.entries(opt.attributes || {}).map(([k, v]) => (
                                              <TableRow key={k}>
                                                <TableCell sx={{ fontWeight: 600, width: '35%' }}>{k}</TableCell>
                                                <TableCell>{v}</TableCell>
                                              </TableRow>
                                            ))
                                        }
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                )}
                                {opt.cost && (opt.cost.min || opt.cost.max || opt.cost.note) && (
                                  <Typography variant="body2">
                                    {typeof opt.cost.min === 'number' || typeof opt.cost.max === 'number'
                                      ? `Estimated cost: ${opt.cost.min ? `$${Math.round(opt.cost.min).toLocaleString()}` : '—'}${opt.cost.max ? ` – $${Math.round(opt.cost.max).toLocaleString()}` : ''}${opt.cost.unit ? ` ${opt.cost.unit}` : ''}`
                                      : null}
                                    {opt.cost.note ? ` ${opt.cost.note}` : ''}
                                  </Typography>
                                )}
                                {(typeof opt.score === 'number' || typeof opt.recommendation === 'boolean') && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {typeof opt.score === 'number' && <Chip size="small" label={`Score: ${Math.round(opt.score)}`} />}
                                    {typeof opt.recommendation === 'boolean' && <Chip size="small" color={opt.recommendation ? 'success' : 'default'} label={opt.recommendation ? 'Recommended' : 'Consider'} />}
                                  </Stack>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                    {Array.isArray(m.rich.followUps) && m.rich.followUps.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {m.rich.followUps.map((q, qi) => (
                          <Chip
                            key={qi}
                            size="small"
                            variant="outlined"
                            label={q}
                            onClick={() => sendAssistantMessage(q)}
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: m.role === 'user' ? 'inherit' : '#111' }}>{m.content}</Typography>
                )}
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
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'common.white', color: '#111', border: 1, borderColor: 'divider', borderRadius: 2, borderTopLeftRadius: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ color: '#111' }}>Thinking...</Typography>
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


