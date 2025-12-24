const mongoose = require('mongoose');

const KnowledgeChunkSchema = new mongoose.Schema(
  {
    homeId: { type: String, required: true, index: true }, // Scoped to a specific home/project
    content: { type: String, required: true }, // The text chunk (or VLM description)
    originalContent: { type: String }, // Original OCR text if different from description
    imageUrl: { type: String }, // Reference to the source image (e.g. S3 url or path)
    embedding: { type: [Number], required: true }, // Vector embedding
    metadata: {
      source: { type: String, default: 'analysis' }, // e.g. analysis, chat, doc
      docId: { type: String },
      page: { type: Number },
    },
  },
  { timestamps: true }
);

// Create vector search index instruction (User will need to run this on Atlas):
// {
//   "mappings": {
//     "dynamic": true,
//     "fields": {
//       "embedding": {
//         "dimensions": 1536,
//         "similarity": "cosine",
//         "type": "knnVector"
//       },
//       "homeId": {
//         "type": "token"
//       }
//     }
//   }
// }

const KnowledgeChunk = mongoose.model('KnowledgeChunk', KnowledgeChunkSchema);

module.exports = { KnowledgeChunk };
