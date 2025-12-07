const { Prompt } = require('../models/Prompt');
const { normalizeKey } = require('./bidComparisonPrompts');

const cache = new Map();

async function getPromptText(key) {
  if (cache.has(key)) return cache.get(key);
  const doc = await Prompt.findOne({ key }).lean();
  if (!doc || !doc.text) {
    throw new Error(`Prompt not found: ${key}`);
  }
  cache.set(key, doc.text);
  return doc.text;
}

async function getTradePrompt(tradeName, extraContext = '') {
  const key = normalizeKey(tradeName);
  const dbKey = `bid.trade.${key}`;
  const base = await getPromptText(dbKey); // throws if missing
  return extraContext && extraContext.trim()
    ? `${base}\n\nProject/Owner Context (from user):\n${extraContext.trim()}`
    : base;
}

module.exports = {
  getPromptText,
  getTradePrompt,
};


