const Joi = require('joi');
const { Person } = require('../models/Person');
const { Home } = require('../models/Home');
const { v4: uuidv4 } = require('uuid');
const { getTemplateById } = require('../templates');
const { Template } = require('../models/Template');
const mailer = require('../services/mailer');

const onboardingSchema = Joi.object({
  participants: Joi.array().items(Joi.object({
    fullName: Joi.string().allow('').optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').optional(),
    role: Joi.string().allow('').optional(),
    permission: Joi.string().valid('admin', 'write', 'read').optional(),
  })).default([]),
  home: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('').optional(),
    withTemplates: Joi.boolean().default(true),
    templateId: Joi.string().allow('').optional(),
    subscription: Joi.object({
      planId: Joi.string().allow('').optional(),
      status: Joi.string().valid('active','canceled','inactive','past_due','').optional(),
    }).optional(),
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
  const { participants, home } = value;

  // Upsert people
  const ensurePerson = async (p) => {
    const email = p.email.toLowerCase();
    const first = await Person.findOneAndUpdate(
      { email },
      { $set: { fullName: p.fullName, phone: p.phone || '' }, $addToSet: { roles: 'user' } },
      { upsert: true, new: true }
    );
    return first;
  };

  // Participants: upsert persons and build normalized list
  const normalizedParticipants = [];
  for (const p of participants) {
    const lower = p.email.toLowerCase();
    if (normalizedParticipants.find((x) => x.email === lower)) continue;
    const ensured = await ensurePerson({ fullName: p.fullName || p.email, email: lower, phone: p.phone || '' });
    normalizedParticipants.push({
      fullName: ensured.fullName,
      email: ensured.email,
      phone: ensured.phone || '',
      role: p.role || '',
      permission: p.permission || 'read',
    });
  }
  // Add owner = current user with admin permission
  const actorEmail = (req?.user?.email || '').toLowerCase();
  if (actorEmail) {
    const me = await ensurePerson({ fullName: req?.user?.fullName || actorEmail, email: actorEmail, phone: '' });
    if (!normalizedParticipants.find((x) => x.email === me.email)) {
      normalizedParticipants.unshift({
        fullName: me.fullName,
        email: me.email,
        phone: me.phone || '',
        role: 'owner',
        permission: 'admin',
      });
    } else {
      // upgrade to admin if already present
      normalizedParticipants.forEach((x) => { if (x.email === me.email) x.permission = 'admin'; });
    }
  }

  // Create Home document embedding snapshots of people
  const trades = home.withTemplates ? await buildBidsFromTemplate(home.templateId) : [];
  const createdHome = await Home.create({
    name: home.name,
    address: home.address || '',
    participants: normalizedParticipants,
    subscription: {
      planId: home.subscription?.planId || '',
      status: home.subscription?.status || '',
    },
    phases: [
      { key: 'planning', notes: '' },
      { key: 'preconstruction', notes: '' },
      { key: 'exterior', notes: '' },
      { key: 'interior', notes: '' },
    ],
    trades,
    schedules: [],
    documents: [],
  });

  // Send SMTP invites; fall back to console when SMTP not configured
  try {
    const appBase = process.env.APP_PUBLIC_URL || process.env.MARKETING_URL || ''
    for (const p of normalizedParticipants) {
      const person = await Person.findOne({ email: p.email.toLowerCase() })
      if (person && !person.passwordHash) {
        const registerUrl = appBase
          ? `${appBase.replace(/\/+$/, '')}/register?email=${encodeURIComponent(person.email)}`
          : `register?email=${encodeURIComponent(person.email)}`
        await mailer.sendInviteEmail({
          to: person.email,
          homeName: createdHome.name,
          registerUrl,
          role: p.role,
        }).catch(() => {})
      }
    }
  } catch (_e) {}

  res.status(201).json({ home: createdHome });
}

module.exports = { onboardingCreate };


