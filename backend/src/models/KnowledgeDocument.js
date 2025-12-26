const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const KnowledgeDocumentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    homeId: { type: String, default: 'global', index: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    s3Key: { type: String, default: '' },
    // Legacy single-value fields (kept for back-compat)
    trade: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    // New keyword tagging
    keywords: [{ type: String, default: '' }],        // normalized/suggested tags
    customKeywords: [{ type: String, default: '' }],  // freeform tags entered by user
    // Optional facet fields (derived or user-specified)
    trades: [{ type: String, default: '' }],
    cities: [{ type: String, default: '' }],
    states: [{ type: String, default: '' }],
    zipCodes: [{ type: String, default: '' }],
    docTypes: [{ type: String, default: '' }],
    contentType: { type: String, default: '' },
    chunkCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const KnowledgeDocument = mongoose.model('KnowledgeDocument', KnowledgeDocumentSchema);

module.exports = { KnowledgeDocument };


