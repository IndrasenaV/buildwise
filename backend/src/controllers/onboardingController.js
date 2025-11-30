const Joi = require('joi');
const { Person } = require('../models/Person');
const { Home } = require('../models/Home');
const { v4: uuidv4 } = require('uuid');
const { getTemplateById } = require('../templates');
const { Template } = require('../models/Template');

const personSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('').optional(),
});

const onboardingSchema = Joi.object({
  client: personSchema.required(),
  monitors: Joi.array().items(personSchema).default([]),
  builder: personSchema.required(),
  home: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('').optional(),
    withTemplates: Joi.boolean().default(true),
    templateId: Joi.string().allow('').optional(),
  }).required(),
});

async function buildBidsFromTemplate(templateId) {
  // Try DB template by id first; fallback to static
  let trades = [];
  if (templateId) {
    const dbT = await Template.findById(templateId);
    if (dbT && dbT.trades) {
      trades = dbT.trades;
    }
  }
  if (!trades.length) {
    const template = getTemplateById(templateId || 'single_family');
    trades = (template?.getBids?.() || []);
  }
  const bids = (trades || []).map((b) => {
    const tasks = (b.tasks || []).map((t) => ({
      _id: uuidv4(),
      title: t.title,
      description: t.description || '',
      phaseKey: t.phaseKey,
      status: 'todo',
      dueDate: null,
      assignee: '',
      checklist: [],
      comments: [],
    }));
    return {
      _id: uuidv4(),
      name: b.name,
      phaseKeys: b.phaseKeys,
      vendor: {},
      tasks,
      qualityChecks: (b.qualityChecks || []).map((qc) => ({
        _id: uuidv4(),
        phaseKey: qc.phaseKey,
        title: qc.title,
        notes: qc.notes || '',
        accepted: false,
        acceptedBy: '',
        acceptedAt: null,
      })),
      totalPrice: 0,
      additionalCosts: [],
      notes: '',
      attachments: [],
    };
  });
  return bids;
}

async function onboardingCreate(req, res) {
  const { value, error } = onboardingSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { client, monitors, builder, home } = value;

  // Upsert people
  const ensurePerson = async (p, role) => {
    const email = p.email.toLowerCase();
    // First, upsert and add desired role
    const first = await Person.findOneAndUpdate(
      { email },
      { $set: { fullName: p.fullName, phone: p.phone || '' }, $addToSet: { roles: role } },
      { upsert: true, new: true }
    );
    // If promoting to client, remove monitor in a separate operation to avoid conflicting ops
    if (role === 'client') {
      await Person.updateOne({ email }, { $pull: { roles: 'monitor' } });
      return await Person.findOne({ email });
    }
    return first;
  };

  const clientDoc = await ensurePerson(client, 'client');
  const builderDoc = await ensurePerson(builder, 'builder');
  const monitorDocs = [];
  for (const m of monitors) {
    // silently skip duplicates by email in the input
    if (!monitorDocs.find((x) => x.email.toLowerCase() === m.email.toLowerCase())) {
      monitorDocs.push(await ensurePerson(m, 'monitor'));
    }
  }

  // Create Home document embedding snapshots of people
  const trades = home.withTemplates ? await buildBidsFromTemplate(home.templateId) : [];
  const createdHome = await Home.create({
    name: home.name,
    address: home.address || '',
    clientName: clientDoc.fullName, // legacy field
    client: {
      fullName: clientDoc.fullName,
      email: clientDoc.email,
      phone: clientDoc.phone || '',
    },
    builder: {
      fullName: builderDoc.fullName,
      email: builderDoc.email,
      phone: builderDoc.phone || '',
    },
    monitors: monitorDocs.map((md) => ({
      fullName: md.fullName,
      email: md.email,
      phone: md.phone || '',
    })),
    phases: [
      { key: 'preconstruction', notes: '' },
      { key: 'exterior', notes: '' },
      { key: 'interior', notes: '' },
    ],
    trades,
    schedules: [],
    documents: [],
  });

  res.status(201).json({ home: createdHome });
}

module.exports = { onboardingCreate };


