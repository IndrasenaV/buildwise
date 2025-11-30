const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { Person } = require('../models/Person');
const { signToken } = require('../middleware/auth');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow('').optional(),
});

async function register(req, res) {
  const { value, error } = registerSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { email, fullName, phone, password } = value;
  const existing = await Person.findOne({ email: email.toLowerCase() });
  if (existing && existing.passwordHash) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const person = existing
    ? await Person.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { fullName, phone: phone || '', passwordHash }, $addToSet: { roles: 'monitor' } },
        { new: true }
      )
    : await Person.create({
        email: email.toLowerCase(),
        fullName,
        phone: phone || '',
        passwordHash,
        roles: ['monitor'],
      });
  const token = signToken({ email: person.email, fullName: person.fullName, roles: person.roles });
  res.json({
    token,
    user: {
      email: person.email,
      fullName: person.fullName,
      phone: person.phone || '',
      roles: person.roles || [],
    },
  });
}

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

async function login(req, res) {
  const { value, error } = loginSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { email, password } = value;
  const person = await Person.findOne({ email: email.toLowerCase() });
  if (!person || !person.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, person.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken({ email: person.email, fullName: person.fullName, roles: person.roles });
  res.json({
    token,
    user: {
      email: person.email,
      fullName: person.fullName,
      phone: person.phone || '',
      roles: person.roles || [],
    },
  });
}

async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const person = await Person.findOne({ email: req.user.email.toLowerCase() });
  if (!person) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({
    email: person.email,
    fullName: person.fullName,
    phone: person.phone || '',
    roles: person.roles || [],
  });
}

module.exports = { register, login, me };


