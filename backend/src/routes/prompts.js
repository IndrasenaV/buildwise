const express = require('express');
const Joi = require('joi');
const { requireAuth } = require('../middleware/auth');
const { Prompt } = require('../models/Prompt');

const router = express.Router();

function requireSysadmin(req, res, next) {
  const roles = Array.isArray(req?.user?.roles) ? req.user.roles : [];
  if (!roles.includes('sysadmin')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

router.get('/', requireAuth, requireSysadmin, async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = q
    ? { $or: [{ key: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }] }
    : {};
  const prompts = await Prompt.find(filter).sort({ key: 1 }).lean();
  res.json(prompts);
});

router.get('/:key', requireAuth, requireSysadmin, async (req, res) => {
  const key = String(req.params.key || '');
  const doc = await Prompt.findOne({ key }).lean();
  if (!doc) return res.status(404).json({ message: 'Prompt not found' });
  res.json(doc);
});

const upsertSchema = Joi.object({
  key: Joi.string().min(2).required(),
  text: Joi.string().min(1).required(),
  description: Joi.string().allow('').optional(),
  contextConfig: Joi.any().optional(),
});

router.post('/', requireAuth, requireSysadmin, async (req, res) => {
  const { value, error } = upsertSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const { key, text, description, contextConfig } = value;
  const updated = await Prompt.findOneAndUpdate(
    { key },
    { $set: { text, description: description || '', contextConfig: contextConfig ?? null } },
    { upsert: true, new: true }
  );
  res.status(201).json(updated);
});

router.patch('/:key', requireAuth, requireSysadmin, async (req, res) => {
  const key = String(req.params.key || '');
  const schema = Joi.object({
    text: Joi.string().min(1).required(),
    description: Joi.string().allow('').optional(),
    contextConfig: Joi.any().optional(),
  });
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const updated = await Prompt.findOneAndUpdate(
    { key },
    { $set: { text: value.text, description: value.description || '', contextConfig: value.contextConfig ?? null } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Prompt not found' });
  res.json(updated);
});

router.delete('/:key', requireAuth, requireSysadmin, async (req, res) => {
  const key = String(req.params.key || '');
  const result = await Prompt.deleteOne({ key });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Prompt not found' });
  res.json({ ok: true });
});

// Build context for a given prompt key using its stored contextConfig
router.get('/:key/context', requireAuth, requireSysadmin, async (req, res) => {
  const key = String(req.params.key || '');
  const { homeId, tradeId, taskId } = req.query || {};
  if (!homeId) return res.status(400).json({ message: 'homeId is required' });
  const doc = await Prompt.findOne({ key }).lean();
  if (!doc) return res.status(404).json({ message: 'Prompt not found' });
  const config = doc.contextConfig || {};
  const { buildContext } = require('../services/contextService');
  const context = await buildContext({ homeId: String(homeId), tradeId: tradeId ? String(tradeId) : undefined, taskId: taskId ? String(taskId) : undefined, config });
  res.json({ key, context });
});

module.exports = router;


