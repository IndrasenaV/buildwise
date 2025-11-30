const Joi = require('joi');
const { Person } = require('../models/Person');

const upsertSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
  phone: Joi.string().allow('').optional(),
  roles: Joi.array().items(Joi.string().valid('builder', 'client', 'monitor')).default([]),
});

async function listPeople(req, res) {
  const { role } = req.query || {};
  const filter = role ? { roles: role } : {};
  const people = await Person.find(filter).sort({ fullName: 1 }).limit(200);
  res.json(people);
}

async function upsertPerson(req, res) {
  const { value, error } = upsertSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { email, fullName, phone, roles } = value;
  const person = await Person.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        phone: phone || '',
      },
      $addToSet: {
        roles: { $each: roles || [] },
      },
    },
    { upsert: true, new: true }
  );
  res.status(201).json(person);
}

module.exports = { listPeople, upsertPerson };


