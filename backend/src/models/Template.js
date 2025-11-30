const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { PhaseKeyEnum } = require('./Home');

const TemplateTaskSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    phaseKey: { type: String, enum: PhaseKeyEnum, required: true },
  },
  { _id: false }
);

const TemplateQualityCheckSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    phaseKey: { type: String, enum: PhaseKeyEnum, required: true },
    title: { type: String, required: true },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const TemplateTradeSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true },
    phaseKeys: [{ type: String, enum: PhaseKeyEnum, required: true }],
    tasks: [TemplateTaskSchema],
    qualityChecks: [TemplateQualityCheckSchema],
  },
  { _id: false }
);

const TemplateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    templateKey: { type: String, required: true }, // e.g. 'single_family'
    name: { type: String, required: true },
    description: { type: String, default: '' },
    version: { type: Number, required: true, default: 1 },
    status: { type: String, enum: ['draft', 'frozen'], default: 'draft' },
    trades: [TemplateTradeSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

TemplateSchema.index({ templateKey: 1, version: -1 }, { unique: true });

const Template = mongoose.model('Template', TemplateSchema);

module.exports = { Template, TemplateSchema };



