const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // e.g., 'architecture.analyze', 'system.jsonOnly', 'bid.trade.electrical'
    text: { type: String, required: true },
    description: { type: String, default: '' },
    // Optional per-prompt context configuration to control what data is fetched to build context
    contextConfig: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Prompt = mongoose.model('Prompt', PromptSchema);

module.exports = { Prompt };


