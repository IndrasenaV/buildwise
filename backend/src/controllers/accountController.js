const Joi = require('joi');
const { Account } = require('../models/Account');
const { Home } = require('../models/Home');

async function ensureAccountFor(email) {
  const lower = email.toLowerCase();
  let account = await Account.findOne({ primaryEmail: lower });
  if (!account) {
    account = await Account.create({
      primaryEmail: lower,
      name: '',
      members: [{ email: lower, fullName: '', role: 'owner' }],
    });
  }
  return account;
}

function getRoleFor(account, email) {
  const lower = email.toLowerCase();
  const member = (account.members || []).find((m) => m.email === lower);
  if (!member) return '';
  return member.role || '';
}

async function getMyAccount(req, res) {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Unauthorized' });
  const account = await ensureAccountFor(email);
  res.json(account);
}

async function initMyAccount(req, res) {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Unauthorized' });
  const account = await ensureAccountFor(email);
  res.status(201).json(account);
}

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().allow('').optional(),
  role: Joi.string().valid('admin', 'member').default('member'),
});

async function inviteMember(req, res) {
  const actor = req.user?.email;
  if (!actor) return res.status(401).json({ message: 'Unauthorized' });
  const { value, error } = inviteSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const account = await ensureAccountFor(actor);
  const role = getRoleFor(account, actor);
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const lower = value.email.toLowerCase();
  // Prevent inviting owner
  if (lower === account.primaryEmail) {
    return res.status(400).json({ message: 'Cannot invite the primary owner' });
  }
  await Account.updateOne(
    { _id: account._id },
    { $addToSet: { members: { email: lower, fullName: value.fullName || '', role: value.role } } }
  );
  const updated = await Account.findById(account._id);
  res.status(201).json(updated);
}

const memberRoleSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'member').required(),
});

async function updateMemberRole(req, res) {
  const actor = req.user?.email;
  if (!actor) return res.status(401).json({ message: 'Unauthorized' });
  const { value, error } = memberRoleSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const account = await ensureAccountFor(actor);
  const role = getRoleFor(account, actor);
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const lower = value.email.toLowerCase();
  if (lower === account.primaryEmail) return res.status(400).json({ message: 'Cannot change owner role' });
  const updated = await Account.findOneAndUpdate(
    { _id: account._id, 'members.email': lower },
    { $set: { 'members.$.role': value.role } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Member not found' });
  res.json(updated);
}

async function removeMember(req, res) {
  const actor = req.user?.email;
  if (!actor) return res.status(401).json({ message: 'Unauthorized' });
  const email = String(req.params.email || '').toLowerCase();
  const account = await ensureAccountFor(actor);
  const role = getRoleFor(account, actor);
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (email === account.primaryEmail) {
    return res.status(400).json({ message: 'Cannot remove the primary owner' });
  }
  await Account.updateOne({ _id: account._id }, { $pull: { members: { email } } });
  const updated = await Account.findById(account._id);
  res.json(updated);
}

async function getSubscription(req, res) {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Unauthorized' });
  const account = await ensureAccountFor(email);
  res.json(account.subscription || { status: 'inactive' });
}

const subscriptionActionSchema = Joi.object({
  action: Joi.string().valid('cancel', 'resume').required(),
});

async function updateSubscription(req, res) {
  const actor = req.user?.email;
  if (!actor) return res.status(401).json({ message: 'Unauthorized' });
  const { value, error } = subscriptionActionSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const account = await ensureAccountFor(actor);
  const role = getRoleFor(account, actor);
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const next = { ...(account.subscription || {}) };
  if (value.action === 'cancel') {
    next.status = 'canceled';
  } else if (value.action === 'resume') {
    next.status = 'active';
  }
  await Account.updateOne({ _id: account._id }, { $set: { subscription: next } });
  const updated = await Account.findById(account._id);
  res.json(updated.subscription);
}

// Per-home subscription APIs
const planSchema = Joi.string().valid('guide', 'ai_assurance').required();
const createSubSchema = Joi.object({
  homeId: Joi.string().required(),
  planId: planSchema,
});

async function getSubscriptions(req, res) {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Unauthorized' });
  const acc = await ensureAccountFor(email);
  res.json(acc.subscriptions || []);
}

async function createSubscription(req, res) {
  const actor = req.user?.email;
  if (!actor) return res.status(401).json({ message: 'Unauthorized' });
  const { value, error } = createSubSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const account = await ensureAccountFor(actor);
  const role = getRoleFor(account, actor);
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const home = await Home.findById(value.homeId);
  if (!home) return res.status(404).json({ message: 'Home not found' });
  const existing = (account.subscriptions || []).find((s) => String(s.homeId) === String(value.homeId));
  if (existing && existing.status === 'active') {
    return res.status(409).json({ message: 'Subscription already active for this home' });
  }
  const sub = {
    homeId: String(value.homeId),
    homeName: home.name || '',
    planId: value.planId,
    status: 'active',
    startedAt: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
  // Upsert behavior
  let updated;
  if (existing) {
    updated = await Account.findOneAndUpdate(
      { _id: account._id, 'subscriptions.homeId': String(value.homeId) },
      { $set: { 'subscriptions.$': sub } },
      { new: true }
    );
  } else {
    updated = await Account.findByIdAndUpdate(
      account._id,
      { $push: { subscriptions: sub } },
      { new: true }
    );
  }
  res.status(201).json((updated.subscriptions || []).find((s) => String(s.homeId) === String(value.homeId)));
}

const updateHomeSubSchema = Joi.object({
  action: Joi.string().valid('cancel', 'resume', 'change_plan').required(),
  planId: Joi.string().valid('guide', 'ai_assurance').optional(),
});

async function updateHomeSubscription(req, res) {
  const actor = req.user?.email;
  if (!actor) return res.status(401).json({ message: 'Unauthorized' });
  const homeId = String(req.params.homeId || '');
  const { value, error } = updateHomeSubSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
  const account = await ensureAccountFor(actor);
  const role = getRoleFor(account, actor);
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const arr = account.subscriptions || [];
  const idx = arr.findIndex((s) => String(s.homeId) === String(homeId));
  if (idx < 0) return res.status(404).json({ message: 'Subscription not found for this home' });
  const sub = { ...arr[idx] };
  if (value.action === 'cancel') {
    sub.status = 'canceled';
  } else if (value.action === 'resume') {
    sub.status = 'active';
  } else if (value.action === 'change_plan') {
    if (!value.planId) return res.status(400).json({ message: 'planId required for change_plan' });
    sub.planId = value.planId;
  }
  arr[idx] = sub;
  await Account.updateOne({ _id: account._id }, { $set: { subscriptions: arr } });
  const updated = await Account.findById(account._id);
  res.json((updated.subscriptions || []).find((s) => String(s.homeId) === String(homeId)));
}

module.exports = {
  getMyAccount,
  initMyAccount,
  inviteMember,
  updateMemberRole,
  removeMember,
  getSubscription,
  updateSubscription,
  // per-home subscriptions
  getSubscriptions,
  createSubscription,
  updateHomeSubscription,
};


