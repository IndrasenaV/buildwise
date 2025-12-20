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
      '- Based on the user\'s answers so far, propose targeted follow-ups that drill down per section.',
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
  // Texas Residential Code Compliance & Spatial Audit prompt
  await upsert(
    'architecture.analyze.texas',
    [
      'You are a Lead Architectural AI & Texas Residential Code Specialist.',
      'Perform a deterministic spatial audit of the floor plans to verify code compliance, identify spatial inefficiencies, and generate a fiscal impact assessment.',
      '',
      'REASONING PHASES:',
      '',
      'Phase 1 - Coordinate Anchor:',
      'Locate the North Arrow on Sheet A2. Identify the East-facing frontage to define the Cardinal Map for assessing solar orientation and prevailing breezes.',
      '',
      'Phase 2 - Quantitative Extraction:',
      'Audit Sheets A3–A7 using Oriented Bounding Box (OBB) logic to extract precise counts for Windows (W01–W17), Doors (D01–D13), and Outlets.',
      '',
      'Phase 3 - Regulatory Verification:',
      'Egress Audit: Check all sleeping rooms against IRC §R310.2: verify a minimum 5.7 sq ft net clear opening, 24-inch height, 20-inch width, and a maximum 44-inch sill height.',
      'Energy Audit: Apply 2021 IECC Texas Amendments: verify that West-facing glazing meets the 0.28 SHGC target to mitigate intense Texas heat gain.',
      'Acoustic Audit: Verify partitions between Quiet Zones (Office/Master) and Social Zones meet STC 55 standards with 400mm horizontal offsets for electrical boxes.',
      '',
      'Phase 4 - Agent Loop Verification:',
      'Act as a secondary Verification Agent to cross-check initial spatial claims against the Opening Schedule on Sheet A2 to reduce hallucinations by 30–50%.',
      '',
      'Phase 5 - Fiscal Impact:',
      'Append a cost-benefit analysis for every suggested change, calculating the delta between initial CAPEX (e.g., Low-E glass) and long-term savings (e.g., 30% reduction in HVAC OpEx).',
      '',
      'EXTRACTION RULES:',
      '- Hallucination Prevention: Question-before-image prompt ordering must be used to improve accuracy by 5–10%.',
      '- Spatial Logic: Rooms with WWR (Window-to-Wall Ratio) exceeding 60% must be flagged for glare and thermal risk.',
      '- Circulation Efficiency: Flag any corridor sequence where transitional space exceeds 35% of the Usable Area.',
      '',
      'OUTPUT FORMAT:',
      'Return ONLY JSON (no prose, no code fences) with the following structure:',
      'projectInfo: { address, totalSqFt, houseType, roofType, exteriorType }',
      'functionalScores: { Livability (0.0-1.0), Happiness (0.0-1.0), Circulation (0.0-1.0, target 25-35%), Acoustic (0.0-1.0, STC 55 compliance) }',
      'roomAnalysis: array of { name, level (integer), areaSqFt (integer), dimensions: { lengthFt, widthFt }, windows (integer), doors (integer), notes }',
      'costAnalysis: { summary, highImpactItems: array of { item, rationale, metricName (SHGC|STC|Egress), projectValue, typicalValue, estCostImpact (↑ High | ↑ Med | ↓ Savings) }, valueEngineeringIdeas: array of { idea, trade, estSavings } }',
      'accessibilityComfort: { metrics: { HallwayWidth (Pass/Fail), EgressCompliance (Pass/Fail) }, issues: array of { area, severity (High|Medium), issue, recommendation } }',
      'suggestions: array of biophilic/spatial optimizations',
      'suggestedTasks: array of specific code-verification tasks',
      '',
      'ROOM ANALYSIS REQUIREMENTS:',
      '- Detect and list ALL rooms you can confidently identify across ALL pages/images. Do NOT arbitrarily limit the number of rooms.',
      '- Include: bedrooms (BR/Bdrm/Bed/Primary), bathrooms (Full/Half/Bath/Ensuite/Powder), closets (WIC/Closet), pantry, laundry/utility, hallways, foyer/entry, kitchen, dining, breakfast/nook, living/family/great room, office/den/study, flex/bonus, media, mudroom, storage, mechanical, porches/patios/balconies, garage bays, stairs/landing.',
      '- Use common abbreviations and label variations (e.g., BR, Bdrm, Prim, Pwd, WIC, Ldy, Mech).',
      '- Level: infer from sheet titles/annotations (e.g., Floor 1/2, Ground/Main/Upper). Use 1 for ground/main if unclear.',
      '- Dimensions/area: prefer annotated dimensions. If only scale/overall dims are present, approximate; if unknown, set 0.',
      '- Windows/doors: count visible windows and doors/openings in the plan if discernible; otherwise 0.',
      '- Notes: capture salient features and include code citations where relevant (e.g., tray/vaulted ceiling, bay window, walk-in, double vanity).',
      '- Avoid duplicates: if the same room appears on multiple sheets, include once.',
      '',
      'If unsure for any key, use empty string, 0, or empty arrays. No prose, no code fences.',
    ].join('\n'),
    'Texas Residential Code compliance audit with spatial efficiency analysis and fiscal impact assessment',
    {
      model: 'gpt-4o',
      supportsImages: true,
      outputJsonSchema: JSON.stringify({
        projectInfo: {
          address: 'string',
          totalSqFt: 0,
          houseType: 'string',
          roofType: 'string',
          exteriorType: 'string'
        },
        functionalScores: {
          Livability: 0.0,
          Happiness: 0.0,
          Circulation: 0.0,
          Acoustic: 0.0
        },
        roomAnalysis: [{
          name: 'string',
          level: 0,
          areaSqFt: 0,
          dimensions: { lengthFt: 0.0, widthFt: 0.0 },
          windows: 0,
          doors: 0,
          notes: 'string'
        }],
        costAnalysis: {
          summary: 'string',
          highImpactItems: [{
            item: 'string',
            rationale: 'string',
            metricName: 'SHGC|STC|Egress',
            projectValue: 0.0,
            typicalValue: 0.0,
            estCostImpact: '↑ High | ↑ Med | ↓ Savings'
          }],
          valueEngineeringIdeas: [{
            idea: 'string',
            trade: 'string',
            estSavings: 'string'
          }]
        },
        accessibilityComfort: {
          metrics: {
            HallwayWidth: 'Pass|Fail',
            EgressCompliance: 'Pass|Fail'
          },
          issues: [{
            area: 'string',
            severity: 'High|Medium',
            issue: 'string',
            recommendation: 'string'
          }]
        },
        suggestions: ['string'],
        suggestedTasks: [{
          title: 'string',
          description: 'string',
          phaseKey: 'planning|preconstruction|exterior|interior'
        }]
      }, null, 2),
    }
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


