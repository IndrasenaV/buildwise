const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { Template } = require('../models/Template');
const { PhaseKeyEnum } = require('../models/Home');

const tradeSchema = Joi.object({
  _id: Joi.string().optional(),
  name: Joi.string().required(),
  phaseKeys: Joi.array().items(Joi.string().valid(...PhaseKeyEnum)).min(1).required(),
  tasks: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      title: Joi.string().required(),
      description: Joi.string().allow('').optional(),
      phaseKey: Joi.string().valid(...PhaseKeyEnum).required(),
    })
  ).default([]),
  qualityChecks: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      phaseKey: Joi.string().valid(...PhaseKeyEnum).required(),
      title: Joi.string().required(),
      notes: Joi.string().allow('').optional(),
    })
  ).default([]),
});

const templateCreateSchema = Joi.object({
  templateKey: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  trades: Joi.array().items(tradeSchema).default([]),
});

async function listTemplates(_req, res) {
  const items = await Template.find({}).sort({ templateKey: 1, version: -1 });
  return res.json(items);
}

async function getTemplate(req, res) {
  const { id } = req.params;
  const doc = await Template.findById(id);
  if (!doc) return res.status(404).json({ message: 'Template not found' });
  return res.json(doc);
}

async function createTemplate(req, res) {
  const { value, error } = templateCreateSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  // compute next version for templateKey
  const latest = await Template.findOne({ templateKey: value.templateKey }).sort({ version: -1 });
  const version = latest ? (latest.version + 1) : 1;
  const normalizedTrades = (value.trades || []).map((t) => ({
    _id: t._id || uuidv4(),
    name: t.name,
    phaseKeys: t.phaseKeys,
    tasks: (t.tasks || []).map((task) => ({ _id: task._id || uuidv4(), title: task.title, description: task.description || '', phaseKey: task.phaseKey })),
    qualityChecks: (t.qualityChecks || []).map((qc) => ({ _id: qc._id || uuidv4(), phaseKey: qc.phaseKey, title: qc.title, notes: qc.notes || '' })),
  }));
  const created = await Template.create({
    _id: uuidv4(),
    templateKey: value.templateKey,
    name: value.name,
    description: value.description || '',
    version,
    status: 'draft',
    trades: normalizedTrades,
  });
  return res.status(201).json(created);
}

async function versionTemplate(req, res) {
  const { id } = req.params;
  const base = await Template.findById(id);
  if (!base) return res.status(404).json({ message: 'Template not found' });
  const latest = await Template.findOne({ templateKey: base.templateKey }).sort({ version: -1 });
  const version = latest ? (latest.version + 1) : (base.version + 1);
  const clone = await Template.create({
    _id: uuidv4(),
    templateKey: base.templateKey,
    name: base.name,
    description: base.description,
    version,
    status: 'draft',
    trades: JSON.parse(JSON.stringify(base.trades || [])),
  });
  return res.status(201).json(clone);
}

const templateUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow('').optional(),
  trades: Joi.array().items(tradeSchema).optional(),
});

async function updateTemplate(req, res) {
  const { id } = req.params;
  const existing = await Template.findById(id);
  if (!existing) return res.status(404).json({ message: 'Template not found' });
  if (existing.status === 'frozen') return res.status(400).json({ message: 'Template is frozen and cannot be edited' });
  const { value, error } = templateUpdateSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const set = {};
  if (value.name !== undefined) set.name = value.name;
  if (value.description !== undefined) set.description = value.description;
  if (value.trades !== undefined) {
    set.trades = (value.trades || []).map((t) => ({
      _id: t._id || uuidv4(),
      name: t.name,
      phaseKeys: t.phaseKeys,
      tasks: (t.tasks || []).map((task) => ({ _id: task._id || uuidv4(), title: task.title, description: task.description || '', phaseKey: task.phaseKey })),
      qualityChecks: (t.qualityChecks || []).map((qc) => ({ _id: qc._id || uuidv4(), phaseKey: qc.phaseKey, title: qc.title, notes: qc.notes || '' })),
    }));
  }
  const updated = await Template.findByIdAndUpdate(id, { $set: set }, { new: true });
  return res.json(updated);
}

async function freezeTemplate(req, res) {
  const { id } = req.params;
  const existing = await Template.findById(id);
  if (!existing) return res.status(404).json({ message: 'Template not found' });
  if (existing.status === 'frozen') return res.json(existing);
  const updated = await Template.findByIdAndUpdate(id, { $set: { status: 'frozen' } }, { new: true });
  return res.json(updated);
}

// Helpers to update nested arrays with guards
async function ensureEditableTemplate(id) {
  const t = await Template.findById(id);
  if (!t) return { error: { code: 404, message: 'Template not found' } };
  if (t.status === 'frozen') return { error: { code: 400, message: 'Template is frozen and cannot be edited' } };
  return { template: t };
}

async function addTrade(req, res) {
  const { id } = req.params;
  const guard = await ensureEditableTemplate(id);
  if (guard.error) return res.status(guard.error.code).json({ message: guard.error.message });
  const { value, error } = tradeSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const newTrade = {
    _id: uuidv4(),
    name: value.name,
    phaseKeys: value.phaseKeys,
    tasks: (value.tasks || []).map((t) => ({ _id: uuidv4(), title: t.title, description: t.description || '', phaseKey: t.phaseKey })),
    qualityChecks: (value.qualityChecks || []).map((c) => ({ _id: uuidv4(), phaseKey: c.phaseKey, title: c.title, notes: c.notes || '' })),
  };
  const updated = await Template.findByIdAndUpdate(
    id,
    { $push: { trades: newTrade } },
    { new: true }
  );
  return res.status(201).json(updated);
}

const taskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  phaseKey: Joi.string().valid(...PhaseKeyEnum).required(),
});

async function addTask(req, res) {
  const { id, tradeId } = req.params;
  const guard = await ensureEditableTemplate(id);
  if (guard.error) return res.status(guard.error.code).json({ message: guard.error.message });
  const { value, error } = taskSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const updated = await Template.findOneAndUpdate(
    { _id: id, 'trades._id': tradeId },
    { $push: { 'trades.$.tasks': { _id: uuidv4(), title: value.title, description: value.description || '', phaseKey: value.phaseKey } } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Template/Trade not found' });
  return res.status(201).json(updated);
}

const qualityCheckSchema = Joi.object({
  phaseKey: Joi.string().valid(...PhaseKeyEnum).required(),
  title: Joi.string().required(),
  notes: Joi.string().allow('').optional(),
});

async function addQualityCheck(req, res) {
  const { id, tradeId } = req.params;
  const guard = await ensureEditableTemplate(id);
  if (guard.error) return res.status(guard.error.code).json({ message: guard.error.message });
  const { value, error } = qualityCheckSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const updated = await Template.findOneAndUpdate(
    { _id: id, 'trades._id': tradeId },
    { $push: { 'trades.$.qualityChecks': { _id: uuidv4(), phaseKey: value.phaseKey, title: value.title, notes: value.notes || '' } } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Template/Trade not found' });
  return res.status(201).json(updated);
}

async function deleteTrade(req, res) {
  const { id, tradeId } = req.params;
  const guard = await ensureEditableTemplate(id);
  if (guard.error) return res.status(guard.error.code).json({ message: guard.error.message });
  const updated = await Template.findByIdAndUpdate(
    id,
    { $pull: { trades: { _id: tradeId } } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Template not found' });
  return res.json(updated);
}

async function deleteTask(req, res) {
  const { id, tradeId, taskId } = req.params;
  const guard = await ensureEditableTemplate(id);
  if (guard.error) return res.status(guard.error.code).json({ message: guard.error.message });
  const updated = await Template.findOneAndUpdate(
    { _id: id, 'trades._id': tradeId },
    { $pull: { 'trades.$.tasks': { _id: taskId } } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Template/Trade not found' });
  return res.json(updated);
}

async function deleteQualityCheck(req, res) {
  const { id, tradeId, checkId } = req.params;
  const guard = await ensureEditableTemplate(id);
  if (guard.error) return res.status(guard.error.code).json({ message: guard.error.message });
  const updated = await Template.findOneAndUpdate(
    { _id: id, 'trades._id': tradeId },
    { $pull: { 'trades.$.qualityChecks': { _id: checkId } } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Template/Trade not found' });
  return res.json(updated);
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  versionTemplate,
  updateTemplate,
  freezeTemplate,
  addTrade,
  deleteTrade,
  addTask,
  deleteTask,
  addQualityCheck,
  deleteQualityCheck,
};



