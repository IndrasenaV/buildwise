const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // e.g., 'architecture.analyze', 'system.jsonOnly', 'bid.trade.electrical'
    text: { type: String, required: true },
    description: { type: String, default: '' },
    // Optional per-prompt context configuration to control what data is fetched to build context
    contextConfig: { type: mongoose.Schema.Types.Mixed, default: null },
    // Preferred OpenAI model for this prompt (e.g., 'gpt-4o-mini', 'gpt-4o')
    model: { type: String, default: '' },
    // Whether this prompt expects or benefits from including images (vision)
    supportsImages: { type: Boolean, default: false },
    // Freeform description/example of expected JSON output (for consumers to know the shape)
    outputJsonSchema: { type: String, default: '' },
  },
  { timestamps: true }
);

const Prompt = mongoose.model('Prompt', PromptSchema);

module.exports = { Prompt };


