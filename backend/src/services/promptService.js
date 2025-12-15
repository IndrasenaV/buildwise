const { Prompt } = require('../models/Prompt');
const { normalizeKey } = require('./bidComparisonPrompts');

const textCache = new Map();
const docCache = new Map();

async function getPromptText(key) {
  if (textCache.has(key)) return textCache.get(key);
  const doc = await Prompt.findOne({ key }).lean();
  if (!doc || !doc.text) {
    throw new Error(`Prompt not found: ${key}`);
  }
  textCache.set(key, doc.text);
  return doc.text;
}

async function getPrompt(key) {
  if (docCache.has(key)) return docCache.get(key);
  const doc = await Prompt.findOne({ key }).lean();
  if (!doc || !doc.text) {
    throw new Error(`Prompt not found: ${key}`);
  }
  docCache.set(key, doc);
  return doc;
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
  getPrompt,
  getTradePrompt,
};


