const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { Message } = require('../models/Message');
const { Home } = require('../models/Home');

const listSchema = Joi.object({
  tradeId: Joi.string().allow('').optional(),
  taskId: Joi.string().allow('').optional(),
  limit: Joi.number().integer().min(1).max(200).default(50),
  before: Joi.date().optional(),
});

async function listMessages(req, res) {
  const { homeId } = req.params;
  const { value, error } = listSchema.validate(req.query || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const filter = { homeId: String(homeId) };
  if (value.tradeId) filter.tradeId = String(value.tradeId);
  if (value.taskId) filter.taskId = String(value.taskId);
  if (value.before) filter.createdAt = { $lt: new Date(value.before) };
  const items = await Message.find(filter).sort({ createdAt: -1 }).limit(value.limit);
  return res.json(items);
}

const createSchema = Joi.object({
  text: Joi.string().min(1).required(),
  tradeId: Joi.string().allow('').optional(),
  taskId: Joi.string().allow('').optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().allow('').optional(),
        url: Joi.string().uri().required(),
      })
    )
    .default([]),
});

async function createMessage(req, res) {
  const { homeId } = req.params;
  const { value, error } = createSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const home = await Home.findById(homeId);
  if (!home) return res.status(404).json({ message: 'Home not found' });
  const msg = await Message.create({
    _id: uuidv4(),
    homeId: String(homeId),
    tradeId: value.tradeId || '',
    taskId: value.taskId || '',
    author: {
      email: (req.user && req.user.email) || '',
      fullName: (req.user && req.user.fullName) || '',
    },
    text: value.text,
    attachments: (value.attachments || []).map((a) => ({ _id: uuidv4(), title: a.title || '', url: a.url })),
  });
  return res.status(201).json(msg);
}

const taskFromMessageSchema = Joi.object({
  messageId: Joi.string().required(),
  tradeId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  phaseKey: Joi.string().valid('preconstruction', 'exterior', 'interior').required(),
});

async function createTaskFromMessage(req, res) {
  const { homeId } = req.params;
  const { value, error } = taskFromMessageSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const home = await Home.findById(homeId);
  if (!home) return res.status(404).json({ message: 'Home not found' });
  const message = await Message.findOne({ _id: value.messageId, homeId: String(homeId) });
  if (!message) return res.status(404).json({ message: 'Message not found' });
  const task = {
    _id: uuidv4(),
    title: value.title,
    description: value.description || message.text || '',
    phaseKey: value.phaseKey,
    status: 'todo',
    dueDate: null,
    assignee: '',
    checklist: [],
    comments: [],
  };
  const updatedHome = await Home.findOneAndUpdate(
    { _id: homeId, 'trades._id': value.tradeId },
    { $push: { 'trades.$.tasks': task } },
    { new: true }
  );
  if (!updatedHome) return res.status(404).json({ message: 'Trade not found on home' });
  // Update message to reference the created task if not already set
  await Message.updateOne({ _id: message._id }, { $set: { tradeId: value.tradeId, taskId: task._id } });
  return res.status(201).json({ home: updatedHome, task });
}

module.exports = { listMessages, createMessage, createTaskFromMessage };



