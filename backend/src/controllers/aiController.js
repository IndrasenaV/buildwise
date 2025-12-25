const Joi = require('joi');
const { z } = require('zod');
const { AiLog } = require('../models/AiLog');
const { Message } = require('../models/Message');
const { Home } = require('../models/Home');
const { getPromptText, getTradePrompt, getPrompt } = require('../services/promptService');
const { executeWithLangChain, extractTextFromUrl } = require('../services/langchainService');
const { storeChunk, searchSimilar, ingestPdf } = require('../services/vectorService');

const analyzeSchema = Joi.object({
  // Allow either a single URL or an array of URLs
  url: Joi.string().uri(),
  urls: Joi.array().items(Joi.string().uri()),
  prompt: Joi.string().min(1).required(),
}).xor('url', 'urls');


async function analyzeUrl(req, res) {
  const schema = Joi.object({
    url: Joi.string().uri(),
    urls: Joi.array().items(Joi.string().uri()),
    prompt: Joi.string().min(1),
    promptKey: Joi.string(),
  }).oxor('url', 'urls').xor('prompt', 'promptKey');
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { url, urls, prompt: bodyPrompt, promptKey } = value;
  try {
    const allUrls = urls && urls.length ? urls : (url ? [url] : []);
    if (!allUrls.length) {
      return res.status(400).json({ message: 'URL or URLs required' });
    }

    const system = await getPromptText('system.analyze');
    const userPrompt = promptKey ? await getPromptText(promptKey) : bodyPrompt;

    const { text, usage } = await executeWithLangChain({
      systemPrompt: system,
      userPrompt: `User prompt: ${userPrompt}`,
      urls: allUrls,
      model: 'gpt-4o-mini',
      temperature: 0.2,
      supportsImages: true,
    });

    // Log raw text for debugging
    console.log('[analyzeUrl] Raw LLM response:', text);

    // Log usage/result
    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: (urls && urls.length ? 'urls' : 'url'),
        prompt: userPrompt,
        urls: allUrls,
        model: 'gpt-4o-mini',
        responseText: text,
        usage: usage || undefined,
      });
    } catch (_e) { }

    // Attempt to parse JSON if possible, otherwise return raw text
    const parsed = parseJsonLoose(text);

    res.json({
      result: parsed || text,
      model: 'gpt-4o-mini',
      usage: usage || undefined,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'LLM analysis failed' });
  }
}

// Analyze files using LangChain - PDFs processed as text, images supported for vision models
async function analyzeFilesDirectToOpenAI(req, res) {
  const schema = Joi.object({
    urls: Joi.array().items(Joi.string().uri()).min(1).required(),
    prompt: Joi.string().min(1),
    promptKey: Joi.string(),
    model: Joi.string().optional(),
  }).xor('prompt', 'promptKey');
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { urls, prompt: bodyPrompt, promptKey, model } = value;
  try {
    const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
    const hasImages = urls.some((u) => imageUrlRegex.test(u));
    const usedModel = model || (hasImages ? 'gpt-4o' : 'gpt-4o-mini');

    const system = await getPromptText('system.analyze');
    const userPrompt = promptKey ? await getPromptText(promptKey) : bodyPrompt;

    const { text, usage } = await executeWithLangChain({
      systemPrompt: system,
      userPrompt: `User prompt: ${userPrompt}`,
      urls,
      model: usedModel,
      temperature: 0.2,
      supportsImages: hasImages,
    });

    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: 'files',
        prompt: userPrompt,
        urls,
        model: usedModel,
        responseText: text,
        usage: usage || undefined,
      });
    } catch (_e) { }
    res.json({ result: text, model: usedModel, usage: usage || undefined });
  } catch (e) {
    res.status(500).json({ message: e.message || 'LLM file analysis failed' });
  }
}

// Analyze with trade/task context: include messages and trade-specific prompt
async function analyzeTradeContext(req, res) {
  const schema = Joi.object({
    homeId: Joi.string().required(),
    tradeId: Joi.string().allow('').optional(),
    taskId: Joi.string().allow('').optional(),
    urls: Joi.array().items(Joi.string().uri()).optional(),
    prompt: Joi.string().allow('').optional(),
    promptKey: Joi.string().allow('').optional(),
    action: Joi.string().valid('analyze', 'compare', 'task', 'general').optional(),
    model: Joi.string().optional(),
    containsImage: Joi.boolean().optional(),
    containsImages: Joi.boolean().optional(),
  }).or('tradeId', 'taskId');
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { homeId, tradeId, taskId, urls = [], prompt, promptKey, action, model } = value;
  const wantImages = Boolean(value.containsImage || value.containsImages);
  try {
    const usedModel = model || 'gpt-4o-mini';
    const query = { homeId: String(homeId) };
    if (tradeId) query.tradeId = String(tradeId);
    if (taskId) query.taskId = String(taskId);
    const msgs = await Message.find(query).sort({ createdAt: -1 }).limit(200).lean();
    const msgText = (msgs || [])
      .map((m) => {
        const who = m.author?.fullName || m.author?.email || 'Unknown';
        return `- ${new Date(m.createdAt).toISOString()} ${who}: ${m.text || ''}`;
      })
      .join('\n');

    let tradePrompt = '';
    if (promptKey && promptKey.trim()) {
      tradePrompt = await getPromptText(promptKey.trim());
    } else if (tradeId) {
      const home = await Home.findById(homeId).lean();
      const trade = (home?.trades || []).find((t) => String(t._id) === String(tradeId));
      if (trade) {
        const act = (action || 'analyze').toLowerCase();
        if (trade.promptBaseKey && String(trade.promptBaseKey).trim()) {
          const base = String(trade.promptBaseKey).trim().toLowerCase();
          const key = base.includes('.') ? base : `${act}.trade.${base}`;
          tradePrompt = await getPromptText(key);
        } else if (trade.promptKey && String(trade.promptKey).trim()) {
          tradePrompt = await getPromptText(String(trade.promptKey).trim());
        } else {
          tradePrompt = await getTradePrompt(trade.name || trade.category || '', '');
        }
      }
    }

    const system = (await getPromptText('system.analyze.context')) || (await getPromptText('system.analyze'));

    const userParts = [];
    if (tradePrompt) userParts.push(`Trade guidance:\n${tradePrompt}`);
    if (prompt && prompt.trim()) userParts.push(`User notes:\n${prompt.trim()}`);
    if (msgText.trim()) userParts.push(`Recent project messages:\n${msgText.slice(0, 50000)}`);
    const userPrompt = userParts.join('\n\n');

    const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
    const hasImages = wantImages && urls.some((u) => imageUrlRegex.test(u));

    const { text, usage } = await executeWithLangChain({
      systemPrompt: system,
      userPrompt,
      urls: urls.slice(0, 10),
      model: hasImages ? 'gpt-4o' : usedModel,
      temperature: 0.2,
      supportsImages: hasImages,
      extraContext: msgText.slice(0, 50000),
    });

    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: 'trade',
        prompt: prompt || tradePrompt || '',
        urls,
        model: hasImages ? 'gpt-4o' : usedModel,
        responseText: text,
        usage: usage || undefined,
      });
    } catch (_e) { }
    return res.json({ result: text, model: hasImages ? 'gpt-4o' : usedModel, usage: usage || undefined });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Trade analysis failed' });
  }
}

function normalizeHouseType(v) {
  const s = String(v || '').toLowerCase().replace(/\s+/g, '_')
  if (['single_family', 'townhome', 'pool', 'airport_hangar'].includes(s)) return s
  return ''
}
function normalizeRoofType(v) {
  const s = String(v || '').toLowerCase().replace(/\s+/g, '_')
  if (s.includes('metal')) return 'metal_roof'
  if (s.includes('tile') || s.includes('concrete')) return 'concrete_tile'
  if (s.includes('flat')) return 'flat_roof'
  if (s.includes('shingle') || s.includes('asphalt')) return 'shingles'
  if (['shingles', 'concrete_tile', 'flat_roof', 'metal_roof', 'other'].includes(s)) return s
  return 'other'
}
function normalizeExteriorType(v) {
  const s = String(v || '').toLowerCase()
  if (['brick', 'stucco', 'siding', 'other'].includes(s)) return s
  return 'other'
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text)
  } catch {
    try {
      const raw = String(text || '')
      const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      const inner = fence ? fence[1] : raw
      let candidate = inner
      if (!fence) {
        const start = inner.indexOf('{')
        const end = inner.lastIndexOf('}')
        if (start !== -1 && end !== -1 && end > start) {
          candidate = inner.slice(start, end + 1)
        }
      }
      return JSON.parse(candidate)
    } catch {
      return null
    }
  }
}

// Analyze architecture docs/images and return normalized JSON
async function analyzeArchitecture(req, res) {
  const schema = Joi.object({
    urls: Joi.array().items(Joi.string().uri()).min(1).required(),
    model: Joi.string().optional(),
  });
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { urls, model } = value;
  try {
    // Load DB prompt config - use Texas compliance prompt, fallback to standard
    const system = await getPromptText('system.jsonOnly');
    const promptDoc = await getPrompt('architecture.analyze.texas');
    const supportsImages = !!promptDoc.supportsImages;
    const preferredModel = String(promptDoc.model || '').trim();
    const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
    const hasImages = urls.some((u) => imageUrlRegex.test(u));
    const usedModel = model || (preferredModel || (hasImages ? 'gpt-4o' : 'gpt-4o-mini'));
    const instruction = promptDoc.text;

    const { text: raw, usage } = await executeWithLangChain({
      systemPrompt: system,
      userPrompt: instruction,
      urls,
      model: usedModel,
      temperature: 0.1,
      supportsImages: supportsImages && hasImages,
    });

    const parsed = parseJsonLoose(raw) || {};

    // Handle new structure with projectInfo wrapper, fallback to top-level for backward compatibility
    const projectInfo = parsed.projectInfo || {};
    const houseType = normalizeHouseType(projectInfo.houseType || parsed.houseType);
    const roofType = normalizeRoofType(projectInfo.roofType || parsed.roofType);
    const exteriorType = normalizeExteriorType(projectInfo.exteriorType || parsed.exteriorType);
    const address = String(projectInfo.address || parsed.address || '').trim();
    const totalSqFt = Number(projectInfo.totalSqFt || parsed.totalSqFt || 0);

    // Extract functionalScores (new structure: Livability, Happiness, Circulation, Acoustic)
    const functionalScores = parsed.functionalScores || {};

    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.map((s) => String(s || '').trim()).filter(Boolean) : [];
    const suggestedTasks = Array.isArray(parsed.suggestedTasks)
      ? parsed.suggestedTasks.map((t) => ({
        title: String(t?.title || '').trim(),
        description: String(t?.description || '').trim(),
        phaseKey: ['planning', 'preconstruction', 'exterior', 'interior'].includes(String(t?.phaseKey || '').toLowerCase())
          ? String(t.phaseKey).toLowerCase()
          : 'planning',
      })).filter((t) => t.title)
      : [];
    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: 'architecture',
        prompt: instruction,
        urls,
        model: usedModel,
        responseText: raw,
        usage: usage || undefined,
      });

      // [RAG] Store the analysis in vector store for future context
      // We convert the structured data to a readable summary for better embedding
      const summaryText = `Architecture Analysis for ${address || 'Home'}.
      House Type: ${houseType}. Roof: ${roofType}. Exterior: ${exteriorType}.
      SqFt: ${totalSqFt}.
      Suggestions: ${suggestions.join('. ')}.
      Rooms: ${roomAnalysis.map(r => `${r.name} (${r.dimensions?.lengthFt}x${r.dimensions?.widthFt})`).join(', ')}.
      `;
      // Find home ID from request if possible, or use a placeholder if stateless (but RAG requires state)
      // The current analyzeArchitecture is stateless (urls only).
      // We need a homeId to store this against.
      // If req.body.homeId exists? The schema doesn't require it.
      // For now, we only store if homeId is provided in body (optional param addition)
      if (req.body.homeId) {
        // 1. Store the summary
        await storeChunk({
          homeId: req.body.homeId,
          content: summaryText,
          metadata: { source: 'automated_analysis', model: usedModel }
        });

        // 2. Ingest the actual PDF/Image content for deep RAG (Multi-modal)
        console.log('[Analyze] Triggering ingestion for URLs:', urls);
        for (const url of urls) {
          try {
            // ingestPdf handles URL fetching and LlamaParse
            await ingestPdf(url, req.body.homeId);
          } catch (err) {
            console.error(`[Analyze] Failed to ingest URL ${url}:`, err.message);
          }
        }
      }
    } catch (_e) {
      console.error('[Analyze] Error storing chunks:', _e);
    }
    // Normalize enriched sections
    const roomAnalysis = Array.isArray(parsed.roomAnalysis) ? parsed.roomAnalysis : [];
    const costAnalysis = typeof parsed.costAnalysis === 'object' && parsed.costAnalysis ? parsed.costAnalysis : { summary: '', highImpactItems: [], valueEngineeringIdeas: [] };
    const accessibilityComfort = typeof parsed.accessibilityComfort === 'object' && parsed.accessibilityComfort ? parsed.accessibilityComfort : { metrics: {}, issues: [] };
    const optimizationSuggestions = Array.isArray(parsed.optimizationSuggestions) ? parsed.optimizationSuggestions : [];
    return res.json({
      houseType,
      roofType,
      exteriorType,
      address,
      totalSqFt,
      projectInfo: address || totalSqFt ? { address, totalSqFt, houseType, roofType, exteriorType } : undefined,
      functionalScores: Object.keys(functionalScores).length > 0 ? functionalScores : undefined,
      suggestions,
      suggestedTasks,
      roomAnalysis,
      costAnalysis,
      accessibilityComfort,
      optimizationSuggestions,
      raw,
      model: usedModel
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Architecture analysis failed' });
  }
}

async function analyzeArchitectureUrls(urls, model, extraContext) {
  // Reuse core logic but return normalized fields only
  const system = await getPromptText('system.jsonOnly');
  const promptDoc = await getPrompt('architecture.analyze.texas');
  const supportsImages = !!promptDoc.supportsImages;
  const preferredModel = String(promptDoc.model || '').trim();
  const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
  const hasImages = urls.some((u) => imageUrlRegex.test(u));
  const usedModel = model || (preferredModel || (hasImages ? 'gpt-4o' : 'gpt-4o-mini'));
  const instruction = promptDoc.text;

  // Define Zod schema for the analysis result
  const analysisSchema = z.object({
    projectInfo: z.object({
      address: z.string().describe("The project address"),
      totalSqFt: z.number().describe("Total square footage of the home"),
      houseType: z.string().describe("Type of house, e.g. 'Two Story'"),
      roofType: z.string().describe("Roof material type, e.g. 'Concrete Tile'"),
      exteriorType: z.string().describe("Exterior material type, e.g. 'Stucco and Stone Veneer'"),
    }).required(),
    functionalScores: z.object({
      Livability: z.number().describe("Score 0-1"),
      Happiness: z.number().describe("Score 0-1"),
      Circulation: z.number().describe("Score 0-1"),
      Acoustic: z.number().describe("Score 0-1"),
    }).optional().nullable(),
    suggestions: z.array(z.string()).describe("List of improvement suggestions"),
    suggestedTasks: z.array(z.object({
      title: z.string(),
      description: z.string(),
      phaseKey: z.enum(['planning', 'preconstruction', 'exterior', 'interior']).optional().nullable(),
    })).describe("List of suggested tasks"),
    roomAnalysis: z.array(z.object({
      name: z.string(),
      level: z.union([z.number(), z.string()]).optional().nullable(),
      areaSqFt: z.number().optional().nullable(),
      dimensions: z.object({
        lengthFt: z.number().optional().nullable(),
        widthFt: z.number().optional().nullable(),
      }).optional().nullable(),
      windows: z.number().optional().nullable(),
      doors: z.number().optional().nullable(),
      notes: z.string().optional().nullable(),
    })).optional().nullable(),
    costAnalysis: z.object({
      summary: z.string(),
      highImpactItems: z.array(z.object({
        item: z.string(),
        rationale: z.string(),
        metricName: z.string().optional().nullable(),
        projectValue: z.union([z.number(), z.string()]).optional().nullable(),
        typicalValue: z.union([z.number(), z.string()]).optional().nullable(),
        estCostImpact: z.string().optional().nullable(),
      })),
      valueEngineeringIdeas: z.array(z.object({
        idea: z.string(),
        trade: z.string(),
        estSavings: z.string(),
      })),
    }).optional().nullable(),
    accessibilityComfort: z.object({
      metrics: z.object({
        avgDoorWidthIn: z.number().optional().nullable(),
        minHallwayWidthIn: z.number().optional().nullable(),
        bathroomTurnRadiusIn: z.number().optional().nullable(),
        stepFreeEntries: z.number().optional().nullable(),
        naturalLightScore: z.number().optional().nullable(),
        thermalZoningScore: z.number().optional().nullable(),
      }).optional().nullable(),
      issues: z.array(z.object({
        area: z.string(),
        severity: z.string(),
        issue: z.string(),
        recommendation: z.string(),
      })).optional().nullable(),
    }).optional().nullable(),
    optimizationSuggestions: z.array(z.object({
      title: z.string(),
      description: z.string(),
      impact: z.enum(['low', 'medium', 'high']).optional().nullable(),
    })).optional().nullable(),
  });

  // Helper to remove nulls (convert to undefined for Mongoose)
  function sanitize(obj) {
    if (obj === null) return undefined;
    if (Array.isArray(obj)) return obj.map(sanitize).filter(v => v !== undefined);
    if (typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const val = sanitize(v);
        if (val !== undefined) out[k] = val;
      }
      return out;
    }
    return obj;
  }

  // Refactor: Use the Texas Prompt as the System Prompt
  const newSystemPrompt = instruction; // architecture.analyze.texas
  const newUserPrompt = "Analyze the provided architectural plans and extract all required data.";

  // Eval / Critique Loop (Max 3 attempts)
  let attempts = 0;
  const maxAttempts = 3;
  let currentInstruction = newUserPrompt; // User prompt may accumulate critique
  let lastParsed = null;
  let lastUsage = null;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[analyzeArchitectureUrls] Iteration ${attempts}/${maxAttempts}...`);

    const { data: rawData, usage } = await executeWithLangChain({
      systemPrompt: newSystemPrompt,
      userPrompt: currentInstruction,
      urls,
      model: usedModel,
      temperature: 0.1,
      supportsImages: supportsImages && hasImages,
      extraContext: extraContext ? String(extraContext).slice(0, 30000) : '',
      schema: analysisSchema,
    });

    const parsed = sanitize(rawData);
    lastParsed = parsed;
    lastUsage = usage;

    // Check for "Totally Empty Object"
    const parsedKeys = parsed ? Object.keys(parsed) : [];
    if (!parsed || parsedKeys.length === 0) {
      console.warn(`[analyzeArchitectureUrls] Iteration ${attempts}: Received EMPTY object.`);
      currentInstruction += `\n\nCRITICAL ERROR: Your last response was an empty JSON object. You MUST return a populated JSON object matching the schema.`;
      continue; // Retry immediately
    }

    // Evaluate Quality (Missing Dimensions/Windows)
    const rooms = parsed.roomAnalysis || [];
    const meaningfulRooms = rooms.filter(r =>
      /bed|living|great|family|kitchen|office|study|dining/i.test(r.name || '')
    );
    const badMeaningfulRooms = meaningfulRooms.filter(r =>
      (!r.dimensions || (!r.dimensions.lengthFt && !r.dimensions.widthFt)) ||
      (r.windows === 0)
    );

    if (badMeaningfulRooms.length > 0 && attempts < maxAttempts) {
      const failedNames = badMeaningfulRooms.map(r => r.name).slice(0, 5).join(', ');
      const critique = `CRITICAL FEEDBACK: You missed dimensions or window counts for key rooms: ${failedNames}. You MUST look closer at the plan provided. Re-analyze the images and fill in these missing values. Estimate if necessary.`;
      console.warn(`[analyzeArchitectureUrls] Critique: ${critique}`);
      // Append critique to instruction for next run
      currentInstruction += `\n\n${critique}`;
    } else {
      console.log('[analyzeArchitectureUrls] Quality check passed or max attempts reached.');
      break;
    }
  }

  // Safety fallbacks if final result is still empty/null
  if (!lastParsed) lastParsed = {};

  console.log('[analyzeArchitectureUrls] Final Structured LLM response:', JSON.stringify(lastParsed, null, 2));

  // No manual normalization needed thanks to Zod
  const projectInfo = lastParsed.projectInfo || {};

  // Return result matching existing format expected by route
  return {
    ...lastParsed,
    // Duplicate top-level keys for backward compatibility if needed by frontend/other logic
    houseType: projectInfo.houseType || '',
    roofType: projectInfo.roofType || '',
    exteriorType: projectInfo.exteriorType || '',
    address: projectInfo.address || '',
    totalSqFt: projectInfo.totalSqFt || 0,
    raw: JSON.stringify(lastParsed), // store structured result as "raw" text for inspection
    model: usedModel
  };
}

async function chat(req, res) {
  const schema = Joi.object({
    homeId: Joi.string().required(),
    message: Joi.string().required(),
    threadId: Joi.string().optional(),
    history: Joi.array().optional() // Optional client-provided history
  });

  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { homeId, message, history = [] } = value;

  try {
    // 1. Retrieve relevant context (RAG)
    const similarChunks = await searchSimilar(message, homeId, 3);
    const contextText = similarChunks.map(c => c.content).join('\n---\n');

    // 2. Fetch Structured Analysis for specific room counts
    const home = await Home.findById(homeId);
    let analysisSummary = "No structured analysis available.";

    if (home && home.documents) {
      const analyzedDoc = home.documents.find(d => d.analysis && d.analysis.analyzed);
      if (analyzedDoc) {
        const a = analyzedDoc.analysis;
        const rooms = a.roomAnalysis || [];

        // Count rooms by category
        const counts = {};
        rooms.forEach(r => {
          const name = (r.name || 'Other').toLowerCase();
          let cat = 'Other';
          if (name.includes('bed') || name.includes('br')) cat = 'Bedroom';
          else if (name.includes('bath') || name.includes('pwd') || name.includes('ensuite')) cat = 'Bathroom';
          else if (name.includes('kitchen')) cat = 'Kitchen';
          else if (name.includes('dining')) cat = 'Dining';
          else if (name.includes('liv') || name.includes('great') || name.includes('fam')) cat = 'Living';
          else if (name.includes('garage')) cat = 'Garage';

          counts[cat] = (counts[cat] || 0) + 1;
        });

        const countStr = Object.entries(counts).map(([k, v]) => `${v} ${k}(s)`).join(', ');

        analysisSummary = `
            Analysis Summary for ${a.projectInfo?.address || 'Home'}:
            - Type: ${a.houseType}, SqFt: ${a.totalSqFt}
            - Room Counts: ${countStr}
            - Suggestions: ${(a.suggestions || []).slice(0, 3).join('; ')}
            `;
      }
    }

    console.log('[Chat] User Message:', message);
    console.log('[Chat] Analysis Summary:', analysisSummary);

    // 3. Build system prompt with context
    const systemPrompt = `You are an expert architect assistant.
    
    PRIMARY SOURCE (Structured Analysis):
    ${analysisSummary}

    SECONDARY SOURCE (Vector Search Context):
    ${contextText}

    INSTRUCTIONS:
    1. Use the "Analysis Summary" for quantitative questions like "How many bedrooms?" or "square footage".
    2. Use the "Vector Search Context" for specific details not in the summary.
    3. If the user's question is vague (e.g., "Is it good?"), ambiguous, or requires more detail than available (e.g., "What is the wall color?"), ASK A CLARIFYING QUESTION instead of guessing.
    4. Be helpful but strictly accurate to the plans provided.
    `;
    console.log('[Chat] System Prompt:', systemPrompt);

    // 4. Construct conversation history for Memory
    let userPromptWithHistory = message;
    if (history.length > 0) {
      userPromptWithHistory = `Previous conversation:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nCurrent User Question: ${message}`;
    }
    console.log('[Chat] Final User Prompt to LLM:', userPromptWithHistory);

    // 4. Call LLM
    const { text, usage } = await executeWithLangChain({
      systemPrompt,
      userPrompt: userPromptWithHistory,
      model: 'gpt-4o-mini',
      temperature: 0.3
    });

    // 5. Respond
    // Ideally save message to DB here if threadId exists

    res.json({
      reply: text,
      contextUsed: similarChunks.map(c => c.content.slice(0, 100) + '...'),
      usage
    });

  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({ message: e.message || "Chat failed" });
  }
}

module.exports = { analyzeUrl, analyzeFiles: analyzeFilesDirectToOpenAI, analyzeTradeContext, analyzeArchitecture, analyzeArchitectureUrls, chat };
