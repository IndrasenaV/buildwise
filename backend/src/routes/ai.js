const express = require('express');
const { analyzeUrl, analyzeFiles, analyzeTradeContext, analyzeArchitecture } = require("../controllers/aiController");
const { requireAuth } = require('../middleware/auth');
const { KnowledgeBase } = require('../models/KnowledgeBase');
const OpenAI = require('openai');
const { getPromptText, getPrompt } = require('../services/promptService');

const router = express.Router();

function requireSysadmin(req, res, next) {
  try {
    const role = String(req?.user?.role || '').toLowerCase();
    if (role !== 'sysadmin' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}
router.post('/analyze', requireAuth, analyzeUrl);
router.post('/analyze-files', requireAuth, analyzeFiles);
router.post('/analyze-trade', requireAuth, analyzeTradeContext);
router.post('/analyze-architecture', requireAuth, analyzeArchitecture);

// Public (auth required, but no sysadmin) fetch for architecture interview questions
router.get('/architecture-questions', requireAuth, async (req, res) => {
  try {
    const doc = await KnowledgeBase.findOne({ key: 'architecture.questions' }).lean();
    if (!doc) return res.status(404).json({ message: 'Questions not found' });
    return res.json({ key: doc.key, description: doc.description || '', questions: doc.data });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to load questions' });
  }
});

// Update KB document for architecture questions
router.put('/architecture-questions', requireAuth, requireSysadmin, async (req, res) => {
  try {
    const existing = await KnowledgeBase.findOne({ key: 'architecture.questions' }).lean();
    if (!existing) return res.status(404).json({ message: 'Questions not found' });
    const { data, description, version, tags } = req.body || {};
    if (!data) return res.status(400).json({ message: 'Missing data' });
    const updated = await KnowledgeBase.findOneAndUpdate(
      { key: 'architecture.questions' },
      {
        $set: {
          data,
          ...(typeof description === 'string' ? { description } : {}),
          ...(typeof version === 'number' ? { version } : {}),
          ...(Array.isArray(tags) ? { tags } : {}),
        }
      },
      { new: true }
    );
    return res.json({ key: updated.key, description: updated.description || '', questions: updated.data, version: updated.version });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to update knowledge base' });
  }
});

// Dynamic next-questions generator using KB + current answers
router.post('/architecture-questions/next', requireAuth, async (req, res) => {
  try {
    const kb = await KnowledgeBase.findOne({ key: 'architecture.questions' }).lean();
    if (!kb) return res.status(404).json({ message: 'Questions KB not found' });
    const { mode = 'summary', answers = {} } = req.body || {};
    const system = await getPromptText('system.jsonOnly');
    const promptDoc = await getPrompt('architecture.questions.generator').catch(() => null);
    const instruction = promptDoc?.text || 'Generate the next concise set of questions as JSON.';
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN });
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: instruction },
      { role: 'user', content: `Question Knowledge Base (JSON):\n${JSON.stringify(kb.data).slice(0, 120000)}` },
      { role: 'user', content: `Current mode: ${mode}` },
      { role: 'user', content: `Answers so far (JSON):\n${JSON.stringify(answers).slice(0, 30000)}` },
    ];
    const completion = await openai.chat.completions.create({
      model: promptDoc?.model || 'gpt-4o-mini',
      temperature: 0.2,
      messages
    });
    const raw = completion?.choices?.[0]?.message?.content?.toString?.() || '[]';
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = []; }
    return res.json({ questions: parsed });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to generate next questions' });
  }
});

module.exports = router;


