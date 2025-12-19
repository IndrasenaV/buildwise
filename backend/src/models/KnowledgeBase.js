const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // e.g., 'architecture.questions'
    type: { type: String, default: 'questions' }, // future: 'codes', 'materials', etc.
    description: { type: String, default: '' },
    version: { type: Number, default: 1 },
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON structure
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

module.exports = { KnowledgeBase };


