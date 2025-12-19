#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectToDatabase } = require('../config/db');
const { Prompt } = require('../models/Prompt');
const { DEFAULT_PROMPT, TRADE_PROMPTS } = require('../services/bidComparisonPrompts');

async function upsert(key, text, description = '', extra = {}) {
  if (!text || !text.trim()) {
    console.warn(`Skip empty prompt for key=${key}`);
    return;
  }
  await Prompt.updateOne(
    { key },
    {
      $set: {
        text,
        description,
        ...(typeof extra.model === 'string' ? { model: extra.model } : {}),
        ...(typeof extra.supportsImages === 'boolean' ? { supportsImages: extra.supportsImages } : {}),
        ...(typeof extra.outputJsonSchema === 'string' ? { outputJsonSchema: extra.outputJsonSchema } : {}),
      },
    },
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
    'General analysis system prompt',
    { model: 'gpt-4o-mini', supportsImages: false }
  );
  await upsert(
    'system.jsonOnly',
    'You are Buildwise AI. Return ONLY raw JSON when asked. No prose, no code fences.',
    'Force JSON-only responses',
    { model: 'gpt-4o-mini', supportsImages: false }
  );
  await upsert(
    'system.analyze.context',
    [
      'You are Buildwise AI. Provide accurate, structured construction analysis.',
      'Use provided context from project messages and documents. Call out uncertainties explicitly.',
      'Keep answers structured, specific, and concise where possible.',
    ].join(' '),
    'Context-aware analysis system prompt',
    { model: 'gpt-4o-mini', supportsImages: false }
  );
  // Architecture analyze instruction
  await upsert(
    'architecture.analyze',
    [
      'Analyze the provided architectural PDFs/images and return ONLY JSON with:',
      'houseType: one of single_family | townhome | pool | airport_hangar | ""',
      'roofType: one of shingles | concrete_tile | flat_roof | metal_roof | other | ""',
      'exteriorType: one of brick | stucco | siding | other | ""',
      'suggestions: array<string> of brief general recommendations',
      'suggestedTasks: array<{ title, description, phaseKey: planning|preconstruction|exterior|interior }>',
      'roomAnalysis: array<{ name, level, areaSqFt, dimensions: { lengthFt, widthFt }, windows, doors, notes }>',
      'costAnalysis: { summary, highImpactItems: array<{ item, rationale, estCostImpact }>, valueEngineeringIdeas: array<{ idea, estSavings, trade }> }',
      'accessibilityComfort: { metrics: { avgDoorWidthIn, minHallwayWidthIn, bathroomTurnRadiusIn, stepFreeEntries, naturalLightScore, thermalZoningScore }, issues: array<{ area, issue, severity, recommendation }> }',
      'optimizationSuggestions: array<{ title, description, impact: low|medium|high }>',
      'roomAnalysis extraction requirements:',
      '- Detect and list ALL rooms you can confidently identify across ALL pages/images. Do NOT arbitrarily limit the number of rooms.',
      '- Include: bedrooms (BR/Bdrm/Bed/Primary), bathrooms (Full/Half/Bath/Ensuite/Powder), closets (WIC/Closet), pantry, laundry/utility, hallways, foyer/entry, kitchen, dining, breakfast/nook, living/family/great room, office/den/study, flex/bonus, media, mudroom, storage, mechanical, porches/patios/balconies, garage bays, stairs/landing.',
      '- Use common abbreviations and label variations (e.g., BR, Bdrm, Prim, Pwd, WIC, Ldy, Mech).',
      '- Level: infer from sheet titles/annotations (e.g., Floor 1/2, Ground/Main/Upper). Use 1 for ground/main if unclear.',
      '- Dimensions/area: prefer annotated dimensions. If only scale/overall dims are present, approximate; if unknown, set 0.',
      '- Windows/doors: count visible windows and doors/openings in the plan if discernible; otherwise 0.',
      '- Notes: capture salient features (e.g., tray/vaulted ceiling, bay window, walk-in, double vanity).',
      '- Avoid duplicates: if the same room appears on multiple sheets, include once.',
      'If unsure for any key, use empty string, 0, or empty arrays. No prose, no code fences.',
    ].join(' '),
    'Extract project attributes, room/cost/accessibility, and optimization suggestions from architecture PDFs/images',
    {
      model: 'gpt-4o',
      supportsImages: true,
      outputJsonSchema: JSON.stringify({
        houseType: 'single_family | townhome | pool | airport_hangar | ""',
        roofType: 'shingles | concrete_tile | flat_roof | metal_roof | other | ""',
        exteriorType: 'brick | stucco | siding | other | ""',
        suggestions: ['string'],
        suggestedTasks: [{ title: 'string', description: 'string', phaseKey: 'planning|preconstruction|exterior|interior' }],
        roomAnalysis: [{
          name: 'string', level: 'string', areaSqFt: 0,
          dimensions: { lengthFt: 0, widthFt: 0 }, windows: 0, doors: 0, notes: 'string'
        }],
        costAnalysis: {
          summary: 'string',
          highImpactItems: [{ item: 'string', rationale: 'string', estCostImpact: 'string' }],
          valueEngineeringIdeas: [{ idea: 'string', estSavings: 'string', trade: 'string' }],
        },
        accessibilityComfort: {
          metrics: {
            avgDoorWidthIn: 0, minHallwayWidthIn: 0, bathroomTurnRadiusIn: 0, stepFreeEntries: 0,
            naturalLightScore: 0, thermalZoningScore: 0
          },
          issues: [{ area: 'string', issue: 'string', severity: 'low|medium|high', recommendation: 'string' }]
        },
        optimizationSuggestions: [{ title: 'string', description: 'string', impact: 'low|medium|high' }],
      }, null, 2),
    }
  );
  // Dynamic questions generator prompt
  await upsert(
    'architecture.questions.generator',
    [
      'You are Buildwise AI. You generate ONLY JSON arrays of the NEXT set of interview questions for architecture planning.',
      'Use the provided knowledge base (KB) that contains an exhaustive taxonomy of possible questions grouped by sections and modes.',
      'Strategy:',
      '- Start with high-level questions across sections in the selected mode (e.g., summary).',
      '- Based on the user’s answers so far, propose targeted follow-ups that drill down per section.',
      '- Never repeat already-answered questions (check IDs in the answers).',
      '- Keep each question concise and unambiguous.',
      '- Respect conditional logic (e.g., only ask office specifics if office needed).',
      'Output format: JSON array of { id, text, type, options?, min?, max?, section?, required? }',
      'Types: text | number | boolean | select | scale',
      'Do NOT include prose or explanations—JSON only.',
    ].join(' '),
    'Generator for dynamic architecture interview questions',
    { model: 'gpt-4o-mini', supportsImages: false }
  );
  // Seed trade prompts
  await upsert('bid.default', DEFAULT_PROMPT, 'Default bid comparison prompt', { model: 'gpt-4o-mini', supportsImages: false });
  for (const [k, v] of Object.entries(TRADE_PROMPTS)) {
    await upsert(`bid.trade.${k}`, v, `Bid comparison guidance for trade: ${k}`, { model: 'gpt-4o-mini', supportsImages: false });
  }
  console.log('All prompts seeded.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


