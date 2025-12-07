#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectToDatabase } = require('../config/db');
const { Prompt } = require('../models/Prompt');
const { DEFAULT_PROMPT, TRADE_PROMPTS } = require('../services/bidComparisonPrompts');

async function upsert(key, text, description = '') {
  if (!text || !text.trim()) {
    console.warn(`Skip empty prompt for key=${key}`);
    return;
  }
  await Prompt.updateOne(
    { key },
    { $set: { text, description } },
    { upsert: true }
  );
  console.log(`Upserted prompt: ${key}`);
}

async function main() {
  await connectToDatabase();
  // Core system prompts
  await upsert(
    'system.analyze',
    [
      'You are Buildwise AI. Analyze construction-related documents and provide clear, actionable, and accurate insights.',
      'If there are uncertainties or missing data, call them out explicitly.',
      'Keep answers concise and structured.',
    ].join(' '),
    'General analysis system prompt'
  );
  await upsert(
    'system.jsonOnly',
    'You are Buildwise AI. Return ONLY raw JSON when asked. No prose, no code fences.',
    'Force JSON-only responses'
  );
  await upsert(
    'system.analyze.context',
    [
      'You are Buildwise AI. Provide accurate, structured construction analysis.',
      'Use provided context from project messages and documents. Call out uncertainties explicitly.',
      'Keep answers structured, specific, and concise where possible.',
    ].join(' '),
    'Context-aware analysis system prompt'
  );
  // Architecture analyze instruction
  await upsert(
    'architecture.analyze',
    [
      'Extract home characteristics from the provided architectural drawings/blueprints or images.',
      'Respond with a JSON object with keys:',
      'houseType (one of: single_family, townhome, pool, airport_hangar or empty string),',
      'roofType (one of: shingles, concrete_tile, flat_roof, metal_roof, other or empty string),',
      'exteriorType (one of: brick, stucco, siding, other or empty string),',
      'suggestions (array of short strings with recommendations or cautions),',
      'suggestedTasks (array of objects with: title, description, phaseKey one of planning, preconstruction, exterior, interior).',
      'If unsure for any key, use empty string. Do NOT include code fences or explanations.',
    ].join(' '),
    'Extract project attributes and suggestions from architecture PDFs/images'
  );
  // Seed trade prompts
  await upsert('bid.default', DEFAULT_PROMPT, 'Default bid comparison prompt');
  for (const [k, v] of Object.entries(TRADE_PROMPTS)) {
    await upsert(`bid.trade.${k}`, v, `Bid comparison guidance for trade: ${k}`);
  }
  console.log('All prompts seeded.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


