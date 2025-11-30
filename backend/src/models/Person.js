const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    passwordHash: { type: String }, // optional for system-created contacts
    roles: [{ type: String, enum: ['builder', 'client', 'monitor'] }],
  },
  { timestamps: true }
);

const Person = mongoose.model('Person', PersonSchema);

module.exports = { Person };


