import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

export const PlanChat = ({ homeId, personaTitle = 'Plan Assistant', preface = '', welcome = '', defaultOpen = false, promptKey = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Auto-open with welcome message
    useEffect(() => {
        if (defaultOpen && !isOpen) {
            setIsOpen(true);
        }
    }, [defaultOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (welcome && isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', content: welcome }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || !homeId) return;

        const userMsg = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-5);
            const combined = preface ? `${preface}\n\nUser: ${userMsg.content}` : userMsg.content;
            const res = await api.chat({ homeId, message: combined, history, promptKey });
            const aiMsg = {
                role: 'assistant',
                content: res.reply,
                context: res.contextUsed
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't get an answer right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
                {!isOpen && (
                    <Fab color="primary" aria-label="chat" onClick={() => setIsOpen(true)}>
                        <ChatIcon />
                    </Fab>
                )}
            </Box>

            {isOpen && (
                <Paper
                    elevation={6}
                    sx={{
                        position: 'fixed',
                        bottom: 90,
                        right: 24,
                        width: 400,
                        maxWidth: '90vw',
                        height: 600,
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1200,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <SmartToyIcon />
                            <Typography variant="subtitle1" fontWeight="bold">{personaTitle}</Typography>
                        </Stack>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: 'grey.50' }}>
                        {messages.length === 0 && (
                            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: 'text.secondary', textAlign: 'center' }}>
                                <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                                <Typography variant="body2">
                                    Ask me anything about your architecture plans!
                                </Typography>
                            </Stack>
                        )}
                        <Stack spacing={2}>
                            {messages.map((m, i) => (
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
                                            <Tooltip title={
                                                <Stack spacing={0.5}>
                                                    {m.context.slice(0, 3).map((c, idx) => (
                                                        <Typography key={idx} variant="caption" display="block">• {c.substring(0, 80)}...</Typography>
                                                    ))}
                                                </Stack>
                                            } arrow placement="right">
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

                    {/* Input */}
                    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'common.white' }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading || !homeId}
                                autoComplete="off"
                            />
                            <IconButton type="submit" color="primary" disabled={isLoading || !input.trim() || !homeId}>
                                <SendIcon />
                            </IconButton>
                        </Stack>
                    </Box>
                </Paper>
            )}
        </>
    );
};
