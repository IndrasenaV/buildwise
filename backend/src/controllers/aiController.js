const Joi = require('joi');
const { z } = require('zod');
const { AiLog } = require('../models/AiLog');
const { Message } = require('../models/Message');
const { Home } = require('../models/Home');
const { getPromptText, getTradePrompt, getPrompt } = require('../services/promptService');
const { KnowledgeDocument } = require('../models/KnowledgeDocument');
const { ingestPdf, ingestText } = require('../services/vectorService');
const { extractTextFromUrl } = require('../services/langchainService');
const { executeWithLangChain, extractTextFromUrl } = require('../services/langchainService');
const { storeChunk, searchSimilar } = require('../services/vectorService');

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
        await storeChunk({
          homeId: req.body.homeId,
          content: summaryText,
          metadata: { source: 'automated_analysis', model: usedModel }
        });
      }
    } catch (_e) { }
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
    }),
    functionalScores: z.object({
      Livability: z.number().describe("Score 0-1"),
      Happiness: z.number().describe("Score 0-1"),
      Circulation: z.number().describe("Score 0-1"),
      Acoustic: z.number().describe("Score 0-1"),
    }).nullable(),
    suggestions: z.array(z.string()).describe("List of improvement suggestions"),
    suggestedTasks: z.array(z.object({
      title: z.string(),
      description: z.string(),
      phaseKey: z.enum(['planning', 'preconstruction', 'exterior', 'interior']).nullable(),
    })).describe("List of suggested tasks"),
    roomAnalysis: z.array(z.object({
      name: z.string(),
      level: z.union([z.number(), z.string()]).nullable(),
      areaSqFt: z.number().nullable(),
      dimensions: z.object({
        lengthFt: z.number().nullable(),
        widthFt: z.number().nullable(),
      }).nullable(),
      windows: z.number().nullable(),
      doors: z.number().nullable(),
      notes: z.string().nullable(),
    })).nullable(),
    costAnalysis: z.object({
      summary: z.string(),
      highImpactItems: z.array(z.object({
        item: z.string(),
        rationale: z.string(),
        metricName: z.string().nullable(),
        projectValue: z.union([z.number(), z.string()]).nullable(),
        typicalValue: z.union([z.number(), z.string()]).nullable(),
        estCostImpact: z.string().nullable(),
      })),
      valueEngineeringIdeas: z.array(z.object({
        idea: z.string(),
        trade: z.string(),
        estSavings: z.string(),
      })),
    }).nullable(),
    accessibilityComfort: z.object({
      metrics: z.record(z.string()).nullable(),
      issues: z.array(z.object({
        area: z.string(),
        severity: z.string(),
        issue: z.string(),
        recommendation: z.string(),
      })).nullable(),
    }).nullable(),
    optimizationSuggestions: z.array(z.string()).nullable(),
  });

  const { data: parsed, usage } = await executeWithLangChain({
    systemPrompt: system,
    userPrompt: instruction,
    urls,
    model: usedModel,
    temperature: 0.1,
    supportsImages: supportsImages && hasImages,
    extraContext: extraContext ? String(extraContext).slice(0, 30000) : '',
    schema: analysisSchema,
  });

  console.log('[analyzeArchitectureUrls] Structured LLM response:', JSON.stringify(parsed, null, 2));

  // No manual normalization needed thanks to Zod
  const projectInfo = parsed.projectInfo || {};

  // Return result matching existing format expected by route
  return {
    ...parsed,
    // Duplicate top-level keys for backward compatibility if needed by frontend/other logic
    houseType: projectInfo.houseType || '',
    roofType: projectInfo.roofType || '',
    exteriorType: projectInfo.exteriorType || '',
    address: projectInfo.address || '',
    totalSqFt: projectInfo.totalSqFt || 0,
    raw: JSON.stringify(parsed), // store structured result as "raw" text for inspection
    model: usedModel
  };
}

async function chat(req, res) {
  const schema = Joi.object({
    homeId: Joi.string().required(),
    message: Joi.string().required(),
    threadId: Joi.string().optional(),
    history: Joi.array().optional(), // Optional client-provided history
    promptKey: Joi.string().allow('').optional()
  });

  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { homeId, message, history = [], promptKey } = value;

  try {
    // 1. Retrieve relevant context (RAG)
    const similarChunks = await searchSimilar(message, homeId, 3);
    const contextText = similarChunks.map(c => c.content).join('\n---\n');

    console.log('[Chat] User Message:', message);
    console.log('[Chat] Retrieved Chunks:', JSON.stringify(similarChunks, null, 2));

    // 2. Build system prompt with optional seeded assistant prompt from DB + context
    let prefix = '';
    try {
      if (promptKey && String(promptKey).trim()) {
        prefix = await getPromptText(String(promptKey).trim());
      }
    } catch (_e) {}
    const systemPrompt = `${prefix ? `${prefix}\n\n` : ''}You are an expert architect assistant.
    Use the following context from the home's architecture plans to answer the user's question.
    If the context doesn't contain the answer, say you don't know based on the current plans.
    
    Context:
    ${contextText}
    `;
    console.log('[Chat] System Prompt:', systemPrompt);

    // 3. Construct conversation history for Memory
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
/**
 * Create a knowledge document and ingest into vector store
 * body: { url, title, trade?, city?, state?, contentType? }
 */
async function createKnowledge(req, res) {
  const schema = Joi.object({
    url: Joi.string().uri().required(),
    title: Joi.string().required(),
    trade: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    contentType: Joi.string().allow('').optional(),
  });
  const { homeId: homeIdParam } = req.params || {};
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });

  const { url, title, trade = '', city = '', state = '', contentType = '' } = value;

  try {
    const homeId = homeIdParam || 'global';
    const doc = await KnowledgeDocument.create({
      homeId,
      title,
      url,
      s3Key: '',
      trade,
      city,
      state,
      contentType,
      chunkCount: 0,
    });
    // Ingest
    let count = 0;
    const meta = { docId: String(doc._id), title, trade, city, state, contentType, source: 'kb_doc' };
    if (/\.pdf($|[\?#])/i.test(url) || /application\/pdf/i.test(contentType)) {
      count = await ingestPdf(url, homeId, meta);
    } else {
      const text = await extractTextFromUrl(url).catch(() => '');
      if (text && text.trim()) {
        count = await ingestText(text, homeId, meta);
      }
    }
    const updated = await KnowledgeDocument.findByIdAndUpdate(doc._id, { $set: { chunkCount: count } }, { new: true });
    return res.status(201).json({ document: updated, chunks: count });
  } catch (e) {
    console.error('[Knowledge] create failed:', e);
    return res.status(500).json({ message: e.message || 'Failed to create knowledge doc' });
  }
}

/**
 * List knowledge documents for a home
 */
async function listKnowledge(req, res) {
  const { homeId } = req.query || {};
  const filter = homeId ? { homeId } : {};
  const docs = await KnowledgeDocument.find(filter).sort({ createdAt: -1 }).lean();
  return res.json({ documents: docs });
}

/**
 * Delete a knowledge document and its chunks
 */
async function deleteKnowledge(req, res) {
  const { homeId: homeIdParam, docId } = req.params;
  const filter = { _id: docId };
  if (homeIdParam) filter.homeId = homeIdParam;
  const doc = await KnowledgeDocument.findOneAndDelete(filter);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const { KnowledgeChunk } = require('../models/KnowledgeChunk');
  await KnowledgeChunk.deleteMany({ 'metadata.docId': String(docId), homeId });
  return res.json({ ok: true });
}

module.exports.createKnowledge = createKnowledge;
module.exports.listKnowledge = listKnowledge;
module.exports.deleteKnowledge = deleteKnowledge;
