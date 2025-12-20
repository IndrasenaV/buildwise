const Joi = require('joi');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { AiLog } = require('../models/AiLog');
const { Message } = require('../models/Message');
const { Home } = require('../models/Home');
const { getPromptText, getTradePrompt, getPrompt } = require('../services/promptService');

const analyzeSchema = Joi.object({
  // Allow either a single URL or an array of URLs
  url: Joi.string().uri(),
  urls: Joi.array().items(Joi.string().uri()),
  prompt: Joi.string().min(1).required(),
}).xor('url', 'urls');

function ensureOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey });
}

async function fetchArrayBuffer(u) {
  const fetchImpl = global.fetch ? global.fetch.bind(global) : (await import('node-fetch')).default;
  const res = await fetchImpl(u);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed (${res.status}) ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  const arrayBuffer = await res.arrayBuffer();
  return { arrayBuffer, contentType };
}

async function extractTextFromUrl(u) {
  const { arrayBuffer, contentType } = await fetchArrayBuffer(u);
  const buf = Buffer.from(arrayBuffer);
  if (/application\/pdf/i.test(contentType) || /\.pdf($|[\?#])/i.test(u)) {
    const parsed = await pdfParse(buf);
    return parsed.text || '';
  }
  if (/^text\//i.test(contentType) || /application\/(json|xml)/i.test(contentType)) {
    return buf.toString('utf8');
  }
  // Fallback: try utf8 decode
  return buf.toString('utf8');
}

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
    const openai = ensureOpenAI();
    let combined = '';
    if (urls && Array.isArray(urls) && urls.length > 0) {
      for (let i = 0; i < urls.length; i++) {
        const u = urls[i];
        try {
          const text = await extractTextFromUrl(u);
          if (text && text.trim()) {
            const header = `\n\n--- Document ${i + 1}: ${u} ---\n`;
            combined += `${header}${text}`;
            if (combined.length > 200000) break; // ~200k chars cap
          }
        } catch (e) {
          combined += `\n\n--- Document ${i + 1}: ${u} (could not retrieve: ${e.message}) ---\n`;
        }
      }
    } else if (url) {
      combined = await extractTextFromUrl(url);
    }
    if (!combined || combined.trim().length === 0) {
      return res.status(415).json({ message: 'Unsupported or empty content at URL(s)' });
    }

    const system = await getPromptText('system.analyze');
    const userPrompt = promptKey ? await getPromptText(promptKey) : bodyPrompt;
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: `User prompt: ${userPrompt}` },
      { role: 'user', content: `Relevant document text:\n${combined.slice(0, 200000)}` }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
    });
    const text = completion?.choices?.[0]?.message?.content?.toString?.() || '';

    // Log usage/result
    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: (urls && urls.length ? 'urls' : 'url'),
        prompt: userPrompt,
        urls: urls && urls.length ? urls : (url ? [url] : []),
        model: completion?.model || 'gpt-4o-mini',
        responseText: text,
        usage: completion?.usage || undefined,
      });
    } catch (_e) {}

    res.json({
      result: text,
      model: completion?.model || 'gpt-4o-mini',
      usage: completion?.usage || undefined,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'OpenAI analysis failed' });
  }
}

// Analyze by uploading files to OpenAI (file_search) so the model can read PDFs/diagrams
async function analyzeFilesDirectToOpenAI(req, res) {
  const schema = Joi.object({
    urls: Joi.array().items(Joi.string().uri()).min(1).required(),
    prompt: Joi.string().min(1),
    promptKey: Joi.string(),
    model: Joi.string().optional(),
  }).xor('prompt','promptKey');
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { urls, prompt: bodyPrompt, promptKey, model } = value;
  try {
    const openai = ensureOpenAI();
    // Support images (vision) and text/PDFs (text extraction)
    const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
    let combined = '';
    const imageUrls = [];
    const pdfUrls = [];
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      if (imageUrlRegex.test(u)) {
        imageUrls.push(u);
        continue;
      }
      if (/\.pdf($|[\?#])/i.test(u)) {
        pdfUrls.push(u);
      }
      try {
        const text = await extractTextFromUrl(u);
        if (text && text.trim()) {
          const header = `\n\n--- Document ${i + 1}: ${u} ---\n`;
          combined += `${header}${text}`;
          if (combined.length > 200_000) break;
        }
      } catch (e) {
        combined += `\n\n--- Document ${i + 1}: ${u} (could not retrieve: ${e.message}) ---\n`;
      }
    }
    // Try converting PDFs to images so vision models can reason over diagrams
    let convertedImageUrls = [];
    if (pdfUrls.length) {
      try {
        convertedImageUrls = await convertPdfUrlsToImages(pdfUrls);
      } catch (_e) { try { console.log('[AI] analyze-files pdf conversion failed'); } catch {} }
    }
    const allImageUrls = [...imageUrls, ...convertedImageUrls];
    if (!combined.trim() && allImageUrls.length === 0) {
      return res.status(415).json({ message: 'Unsupported or empty content at URL(s)' });
    }
    const usedModel = model || (allImageUrls.length > 0 ? 'gpt-4o' : 'gpt-4o-mini');
    const system = await getPromptText('system.analyze');
    let completion;
    if (allImageUrls.length === 0) {
      // Text/PDF-only flow: use plain string messages to avoid any parsing ambiguities
      const userPrompt = promptKey ? await getPromptText(promptKey) : bodyPrompt;
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `User prompt:\n${userPrompt}\n\nRelevant document text:\n${combined.slice(0, 200000)}` },
        ],
        temperature: 0.2,
      });
    } else {
      // Mixed content (images): use multi-part content for vision support
      const userContent = [];
      const userPrompt = promptKey ? await getPromptText(promptKey) : bodyPrompt;
      userContent.push({ type: 'text', text: `User prompt: ${userPrompt}` });
      if (combined.trim()) {
        userContent.push({ type: 'text', text: `Relevant document text:\n${combined.slice(0, 200000)}` });
      }
      for (const img of allImageUrls.slice(0, 10)) {
        userContent.push({ type: 'image_url', image_url: { url: img } });
      }
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
      });
    }
    const result = completion?.choices?.[0]?.message?.content?.toString?.() || '';
    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: 'files',
        prompt: promptKey ? await getPromptText(promptKey) : bodyPrompt,
        urls,
        model: completion?.model || usedModel,
        responseText: result,
        usage: completion?.usage || undefined,
      });
    } catch (_e) {}
    res.json({ result, model: completion?.model || usedModel, usage: completion?.usage, echoPrompt: prompt });
  } catch (e) {
    res.status(500).json({ message: e.message || 'OpenAI file analysis failed' });
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
    const openai = ensureOpenAI();
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
    let docsText = '';
    const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
    const imageUrls = [];
    const pdfUrls = [];
    for (let i = 0; i < Math.min(urls.length, 10); i++) {
      const u = urls[i];
      try {
        if (wantImages && imageUrlRegex.test(u)) {
          imageUrls.push(u);
        }
        if (wantImages && /\.pdf($|[\?#])/i.test(u)) {
          pdfUrls.push(u);
        }
        const t = await extractTextFromUrl(u);
        if (t && t.trim()) {
          const header = `\n\n--- Attachment ${i + 1}: ${u} ---\n`;
          docsText += `${header}${t}`;
          if (docsText.length > 150_000) break;
        }
      } catch (e) {
        docsText += `\n\n--- Attachment ${i + 1}: ${u} (could not retrieve: ${e.message}) ---\n`;
      }
    }
    // Attempt to convert PDFs to images if vision is desired
    let convertedImageUrls = [];
    if (wantImages && pdfUrls.length) {
      try {
        convertedImageUrls = await convertPdfUrlsToImages(pdfUrls);
      } catch (_e) { try { console.log('[AI] trade pdf conversion failed'); } catch {} }
    }
    const allImageUrls = [...imageUrls, ...convertedImageUrls];
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
    let completion;
    if (wantImages && allImageUrls.length > 0) {
      const userContent = [];
      if (tradePrompt) userContent.push({ type: 'text', text: `Trade guidance:\n${tradePrompt}` });
      if (prompt && prompt.trim()) userContent.push({ type: 'text', text: `User notes:\n${prompt.trim()}` });
      if (msgText.trim()) userContent.push({ type: 'text', text: `Recent project messages:\n${msgText.slice(0, 50_000)}` });
      if (docsText.trim()) userContent.push({ type: 'text', text: `Relevant document text:\n${docsText.slice(0, 150_000)}` });
      for (const img of allImageUrls.slice(0, 10)) {
        userContent.push({ type: 'image_url', image_url: { url: img } });
      }
      completion = await openai.chat.completions.create({
        model: 'gpt-4o', // ensure vision-capable when images included
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
      });
    } else {
      const parts = [];
      if (tradePrompt) parts.push(`Trade guidance:\n${tradePrompt}\n`);
      if (prompt && prompt.trim()) parts.push(`User notes:\n${prompt.trim()}\n`);
      if (msgText.trim()) parts.push(`Recent project messages:\n${msgText.slice(0, 50_000)}\n`);
      if (docsText.trim()) parts.push(`Relevant document text:\n${docsText.slice(0, 150_000)}\n`);
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: parts.join('\n') },
        ],
        temperature: 0.2,
      });
    }
    const result = completion?.choices?.[0]?.message?.content?.toString?.() || '';
    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: 'trade',
        prompt: prompt || tradePrompt || '',
        urls,
        model: completion?.model || usedModel,
        responseText: result,
        usage: completion?.usage || undefined,
      });
    } catch (_e) {}
    return res.json({ result, model: completion?.model || usedModel, usage: completion?.usage });
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
  if (['shingles','concrete_tile','flat_roof','metal_roof','other'].includes(s)) return s
  return 'other'
}
function normalizeExteriorType(v) {
  const s = String(v || '').toLowerCase()
  if (['brick','stucco','siding','other'].includes(s)) return s
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
    const openai = ensureOpenAI();
    // Extract text + detect image URLs
    const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
    let combined = '';
    const imageUrls = [];
    const pdfUrls = [];
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      if (imageUrlRegex.test(u)) {
        imageUrls.push(u);
        continue;
      }
      if (/\.pdf($|[\?#])/i.test(u)) {
        pdfUrls.push(u);
      }
      try {
        const text = await extractTextFromUrl(u);
        if (text && text.trim()) {
          const header = `\n\n--- Document ${i + 1}: ${u} ---\n`;
          combined += `${header}${text}`;
          if (combined.length > 180_000) break;
        }
      } catch (_e) {}
    }
    // Load DB prompt config - use Texas compliance prompt, fallback to standard
    const system = await getPromptText('system.jsonOnly');
    let promptDoc = await getPrompt('architecture.analyze.texas');
    const supportsImages = !!promptDoc.supportsImages;
    const preferredModel = String(promptDoc.model || '').trim();
    // Optionally convert PDFs to images if supported
    let convertedImageUrls = [];
    if (supportsImages && pdfUrls.length) {
      try {
        convertedImageUrls = await convertPdfUrlsToImages(pdfUrls);
      } catch (e) { try { console.log('[AI] pdf conversion failed', e?.message || e) } catch {} }
    }
    const allImageUrls = [...imageUrls, ...convertedImageUrls];
    const usedModel = model || (preferredModel || (allImageUrls.length > 0 ? 'gpt-4o' : 'gpt-4o-mini'));
    const instruction = promptDoc.text;
    // Console visibility for debugging
    try {
      console.log('[AI] architecture.analyze',
        { supportsImages, preferredModel, requestModel: model || null, resolvedModel: usedModel,
          pdfCount: pdfUrls.length, imageCount: imageUrls.length, convertedFromPdfCount: convertedImageUrls.length,
          totalImagesSent: allImageUrls.length });
    } catch {}
    let completion;
    let messagesToSend = [];
    if (allImageUrls.length > 0) {
      const userContent = [{ type: 'text', text: instruction }];
      if (combined.trim()) {
        userContent.push({ type: 'text', text: `Relevant document text:\n${combined.slice(0, 180_000)}` });
      }
      for (const img of allImageUrls) {
        userContent.push({ type: 'image_url', image_url: { url: img } });
      }
      messagesToSend = [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ];
      completion = await openai.chat.completions.create({
        model: usedModel || 'gpt-4o',
        messages: messagesToSend,
        temperature: 0.1,
      });
    } else {
      messagesToSend = [
        { role: 'system', content: system },
        { role: 'user', content: `${instruction}\n${combined.trim() ? `Relevant document text:\n${combined.slice(0, 180_000)}` : ''}`.trim() },
      ];
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: messagesToSend,
        temperature: 0.1,
      });
    }
    const raw = completion?.choices?.[0]?.message?.content?.toString?.() || '';
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
          phaseKey: ['planning','preconstruction','exterior','interior'].includes(String(t?.phaseKey || '').toLowerCase())
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
        model: completion?.model || usedModel,
        requestMessages: messagesToSend,
        responseText: raw,
        usage: completion?.usage || undefined,
      });
    } catch (_e) {}
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
      model: completion?.model || usedModel
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Architecture analysis failed' });
  }
}

async function analyzeArchitectureUrls(urls, model, extraContext) {
  // Reuse core logic but return normalized fields only
  const req = { body: { urls, model }, user: {} };
  const openai = ensureOpenAI(); // ensure key present early
  // Use the same internal steps as analyzeArchitecture without logging/res wrapper
  // Extract text + detect image URLs
  const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
  let combined = '';
  const imageUrls = [];
  const pdfUrls = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    if (imageUrlRegex.test(u)) {
      imageUrls.push(u);
      continue;
    }
    if (/\.pdf($|[\?#])/i.test(u)) {
      pdfUrls.push(u);
    }
    try {
      const text = await extractTextFromUrl(u);
      if (text && text.trim()) {
        const header = `\n\n--- Document ${i + 1}: ${u} ---\n`;
        combined += `${header}${text}`;
        if (combined.length > 180_000) break;
      }
    } catch (_e) {}
  }
  // Load prompt metadata - use Texas compliance prompt, fallback to standard
  const system = await getPromptText('system.jsonOnly');
  let promptDoc;
  try {
    promptDoc = await getPrompt('architecture.analyze.texas');
  } catch {
    promptDoc = await getPrompt('architecture.analyze');
  }
  const supportsImages = !!promptDoc.supportsImages;
  const preferredModel = String(promptDoc.model || '').trim();
  // Attempt to convert PDFs to images if supported
  let convertedImageUrls = [];
  if (supportsImages && pdfUrls.length) {
      try {
      convertedImageUrls = await convertPdfUrlsToImages(pdfUrls);
      } catch (e) { try { console.log('[AI] pdf conversion failed', e?.message || e) } catch {} }
  }
  const allImageUrls = [...imageUrls, ...convertedImageUrls];
  const usedModel = model || (preferredModel || (allImageUrls.length > 0 ? 'gpt-4o' : 'gpt-4o-mini'));
  const instruction = promptDoc.text;
  try {
    console.log('[AI] architecture.analyzeUrls',
      { supportsImages, preferredModel, requestModel: model || null, resolvedModel: usedModel,
        originalImageCount: imageUrls.length, pdfCount: pdfUrls.length, convertedFromPdfCount: convertedImageUrls.length,
        totalImagesSent: allImageUrls.length, urlCount: urls.length });
  } catch {}
  let completion;
  let messagesToSend = [];
  if (allImageUrls.length > 0) {
    const userContent = [{ type: 'text', text: instruction }];
    if (combined.trim()) {
      userContent.push({ type: 'text', text: `Relevant document text:\n${combined.slice(0, 180_000)}` });
    }
    if (extraContext && String(extraContext).trim()) {
      userContent.push({ type: 'text', text: `Homeowner context:\n${String(extraContext).slice(0, 30_000)}` });
    }
    for (const img of allImageUrls) {
      userContent.push({ type: 'image_url', image_url: { url: img } });
    }
    messagesToSend = [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ];
    completion = await openai.chat.completions.create({
      model: usedModel || 'gpt-4o',
      messages: messagesToSend,
      temperature: 0.1,
    });
  } else {
    const contextText = [
      { role: 'system', content: system },
      { role: 'user', content: instruction },
    ];
    if (combined.trim()) {
      contextText.push({ role: 'user', content: `Relevant document text:\n${combined.slice(0, 180_000)}` });
    }
    if (extraContext && String(extraContext).trim()) {
      contextText.push({ role: 'user', content: `Homeowner context:\n${String(extraContext).slice(0, 30_000)}` });
    }
    messagesToSend = contextText;
    completion = await openai.chat.completions.create({
      model: usedModel,
      messages: messagesToSend,
      temperature: 0.1,
    });
  }
  const raw = completion?.choices?.[0]?.message?.content?.toString?.() || '';
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
        phaseKey: ['planning','preconstruction','exterior','interior'].includes(String(t?.phaseKey || '').toLowerCase())
          ? String(t.phaseKey).toLowerCase()
          : 'planning',
      })).filter((t) => t.title)
    : [];
  try {
    await AiLog.create({
      userEmail: null,
      mode: 'architecture',
      prompt: instruction,
      urls,
      model: completion?.model || usedModel,
      requestMessages: messagesToSend,
      responseText: raw,
      usage: completion?.usage || undefined,
    });
  } catch (_e) {}
  const roomAnalysis = Array.isArray(parsed.roomAnalysis) ? parsed.roomAnalysis : [];
  const costAnalysis = typeof parsed.costAnalysis === 'object' && parsed.costAnalysis ? parsed.costAnalysis : { summary: '', highImpactItems: [], valueEngineeringIdeas: [] };
  const accessibilityComfort = typeof parsed.accessibilityComfort === 'object' && parsed.accessibilityComfort ? parsed.accessibilityComfort : { metrics: {}, issues: [] };
  const optimizationSuggestions = Array.isArray(parsed.optimizationSuggestions) ? parsed.optimizationSuggestions : [];
  return {
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
    model: completion?.model || usedModel
  };
}

// Step 1: Classify pages of an architecture PDF (returns page thumbnails + labels)
async function analyzeArchitecturePages(req, res) {
  const schema = Joi.object({
    urls: Joi.array().items(Joi.string().uri()).min(1).optional(),
    maxPages: Joi.number().integer().min(1).max(50).optional(),
    model: Joi.string().optional(),
  });
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { urls = [], maxPages, model } = value;
  try {
    const usedModel = model || 'gpt-4o';
    const pdfUrls = urls.filter((u) => /\.pdf($|[\?#])/i.test(u));
    if (!pdfUrls.length && urls.length) {
      // If not PDFs, treat each as a single-page image
      const pages = urls.map((u, i) => ({ index: i, image: u }));
      const classified = await classifyPageImagesWithVision(pages.map((p) => p.image), usedModel);
      const out = classified.map((c, i) => ({
        index: i,
        image: pages[i].image,
        label: c.label,
        confidence: c.confidence,
        title: c.title || '',
      }));
      return res.json({ pages: out });
    }
    const images = await convertPdfUrlsToImages(pdfUrls.length ? pdfUrls : urls, maxPages);
    if (!images.length) return res.status(415).json({ message: 'No pages extracted from PDF' });
    const classified = await classifyPageImagesWithVision(images, usedModel);
    const pages = classified.map((c, i) => ({
      index: i,
      image: images[i],
      label: c.label,
      confidence: c.confidence,
      title: c.title || '',
    }));
    return res.json({ pages });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Page classification failed' });
  }
}

// Helper: classify an array of image data URLs with OpenAI Vision
async function classifyPageImagesWithVision(imageDataUrls, model) {
  const openai = ensureOpenAI();
  const system = await getPromptText('system.jsonOnly');
  const allowed = ['floor_plan','first_floor_plan','second_floor_plan','roof_plan','electrical_plan','elevation','site_plan','details','notes','unknown'];
  const instruction =
    `You are classifying architectural drawing pages. For each image, output a JSON array with entries:
     { "label": one of ${JSON.stringify(allowed)}, "title": short human-friendly title, "confidence": 0..1 }.
     Use specific floor labels when obvious (first_floor_plan, second_floor_plan). If unsure, use 'unknown'.
     Respond with ONLY JSON array, length equal to number of images.`;
  const userContent = [{ type: 'text', text: instruction }];
  for (const img of imageDataUrls) {
    userContent.push({ type: 'image_url', image_url: { url: img } });
  }
  const completion = await openai.chat.completions.create({
    model: model || 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    temperature: 0.1,
  });
  const raw = completion?.choices?.[0]?.message?.content?.toString?.() || '[]';
  const parsed = parseJsonLoose(raw);
  if (Array.isArray(parsed)) {
    return parsed.map((p) => ({
      label: String(p?.label || 'unknown').toLowerCase(),
      title: String(p?.title || '').trim(),
      confidence: Math.max(0, Math.min(1, Number(p?.confidence || 0))),
    }));
  }
  return imageDataUrls.map(() => ({ label: 'unknown', title: '', confidence: 0 }));
}

// Step 2: Analyze only selected floor plan pages (by page indices) along with extracted PDF text
async function analyzeArchitectureFromSelectedPages(req, res) {
  const schema = Joi.object({
    urls: Joi.array().items(Joi.string().uri()).min(1).required(),
    selectedPages: Joi.array().items(Joi.number().integer().min(0)).min(1).required(),
    model: Joi.string().optional(),
  });
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { urls, selectedPages, model } = value;
  try {
    const openai = ensureOpenAI();
    // Extract combined text from all provided URLs (usually just the PDF)
    let combined = '';
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      try {
        const text = await extractTextFromUrl(u);
        if (text && text.trim()) {
          const header = `\n\n--- Document ${i + 1}: ${u} ---\n`;
          combined += `${header}${text}`;
          if (combined.length > 180_000) break;
        }
      } catch {}
    }
    // Convert PDFs to images, then select only requested page indices
    const pdfUrls = urls.filter((u) => /\.pdf($|[\?#])/i.test(u));
    const allImages = pdfUrls.length ? await convertPdfUrlsToImages(pdfUrls) : [];
    const selectedImages = selectedPages
      .map((idx) => allImages[idx])
      .filter(Boolean);
    // Fallback: if user passed image URLs directly as urls, and no PDFs, treat urls as pages and index into them
    if (!selectedImages.length && !pdfUrls.length) {
      for (const i of selectedPages) {
        if (urls[i]) selectedImages.push(urls[i]);
      }
    }
    if (!selectedImages.length) {
      return res.status(400).json({ message: 'No selected pages available to analyze' });
    }
    // Build messages with instruction and include selected images only
    const system = await getPromptText('system.jsonOnly');
    const promptDoc = await getPrompt('architecture.analyze');
    const instruction = promptDoc.text;
    const usedModel = model || (String(promptDoc.model || '').trim() || 'gpt-4o');
    const userContent = [{ type: 'text', text: instruction }];
    if (combined.trim()) {
      userContent.push({ type: 'text', text: `Relevant document text:\n${combined.slice(0, 180_000)}` });
    }
    for (const img of selectedImages) {
      userContent.push({ type: 'image_url', image_url: { url: img } });
    }
    const completion = await openai.chat.completions.create({
      model: usedModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
    });
    const raw = completion?.choices?.[0]?.message?.content?.toString?.() || '';
    const parsed = parseJsonLoose(raw) || {};
    const houseType = normalizeHouseType(parsed.houseType);
    const roofType = normalizeRoofType(parsed.roofType);
    const exteriorType = normalizeExteriorType(parsed.exteriorType);
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.map((s) => String(s || '').trim()).filter(Boolean) : [];
    const suggestedTasks = Array.isArray(parsed.suggestedTasks)
      ? parsed.suggestedTasks.map((t) => ({
          title: String(t?.title || '').trim(),
          description: String(t?.description || '').trim(),
          phaseKey: ['planning','preconstruction','exterior','interior'].includes(String(t?.phaseKey || '').toLowerCase())
            ? String(t.phaseKey).toLowerCase()
            : 'planning',
        })).filter((t) => t.title)
      : [];
    const roomAnalysis = Array.isArray(parsed.roomAnalysis) ? parsed.roomAnalysis : [];
    const costAnalysis = typeof parsed.costAnalysis === 'object' && parsed.costAnalysis ? parsed.costAnalysis : { summary: '', highImpactItems: [], valueEngineeringIdeas: [] };
    const accessibilityComfort = typeof parsed.accessibilityComfort === 'object' && parsed.accessibilityComfort ? parsed.accessibilityComfort : { metrics: {}, issues: [] };
    const optimizationSuggestions = Array.isArray(parsed.optimizationSuggestions) ? parsed.optimizationSuggestions : [];
    return res.json({
      result: {
        houseType,
        roofType,
        exteriorType,
        suggestions,
        suggestedTasks,
        roomAnalysis,
        costAnalysis,
        accessibilityComfort,
        optimizationSuggestions,
        raw,
        model: completion?.model || usedModel
      }
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Selected page analysis failed' });
  }
}

module.exports = { analyzeUrl, analyzeFiles: analyzeFilesDirectToOpenAI, analyzeTradeContext, analyzeArchitecture, analyzeArchitectureUrls, analyzeArchitecturePages, analyzeArchitectureFromSelectedPages };

// Best-effort PDF -> image conversion using optional dependencies.
// If required packages are not available, this returns [] silently.
async function convertPdfUrlsToImages(urls, maxPages) {
  const results = [];
  // Allow env override; 0 or negative means all pages
  let envMax = Number(process.env.PDF_RENDER_MAX_PAGES || NaN);
  const limit = Number.isFinite(maxPages) ? Number(maxPages) : (Number.isFinite(envMax) ? envMax : 0);
  for (const u of urls) {
    try {
      const { arrayBuffer, contentType } = await fetchArrayBuffer(u);
      if (!/application\/pdf/i.test(contentType) && !/\.pdf($|[\?#])/i.test(u)) continue;
      const buf = Buffer.from(arrayBuffer);
      const imgs = await convertPdfBufferToPngDataUrls(buf, limit);
      results.push(...imgs);
      try {
        console.log('[AI] pdf->images', { url: u, generatedImages: imgs.length });
      } catch {}
    } catch (err) { try { console.log('[AI] pdf->images error', { url: u, error: err?.message || String(err) }) } catch {} }
  }
  return results;
}

async function convertPdfBufferToPngDataUrls(buffer, maxPages) {
  try {
    // Lazy require to avoid hard dependency if env lacks these libs
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    const { createCanvas } = require('canvas');
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const total = pdf.numPages;
    const count = (maxPages && maxPages > 0) ? Math.min(total, Math.max(1, maxPages)) : total;
    const out = [];
    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');
      const renderContext = { canvasContext: ctx, viewport };
      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/png');
      out.push(dataUrl);
    }
    try {
      console.log('[AI] pdf buffer converted', { totalPages: total, renderedPages: count });
    } catch {}
    return out;
  } catch (e) {
    // Fallback to system poppler (pdftoppm) if available
    try {
      console.log('[AI] canvas/pdfjs failed, trying poppler fallback', e?.message || e);
    } catch {}
    const imgs = await convertPdfBufferViaPoppler(buffer, maxPages).catch(() => []);
    if (imgs && imgs.length) {
      try { console.log('[AI] poppler fallback succeeded', { generatedImages: imgs.length }); } catch {}
      return imgs;
    }
    try { console.log('[AI] pdf conversion skipped (no converters available)'); } catch {}
    return [];
  }
}

async function convertPdfBufferViaPoppler(buffer, maxPages) {
  return new Promise((resolve) => {
    try {
      const { execFile } = require('node:child_process');
      const tmpDir = os.tmpdir();
      const tmpBase = `bw_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const inPath = path.join(tmpDir, `${tmpBase}.pdf`);
      fs.writeFileSync(inPath, buffer);
      const outPrefix = path.join(tmpDir, `${tmpBase}_page`);
      const args = ['-png', '-f', '1'];
      if (maxPages && maxPages > 0) {
        args.push('-l', String(maxPages));
      }
      // Scale to a reasonable width for OCR/vision
      args.push('-scale-to', '2000', inPath, outPrefix);
      execFile('pdftoppm', args, { timeout: 60_000 }, (_err) => {
        const images = [];
        try {
          // Collect files: outPrefix-1.png, outPrefix-2.png, ...
          const dir = path.dirname(outPrefix);
          const base = path.basename(outPrefix);
          const files = fs.readdirSync(dir)
            .filter((f) => f.startsWith(base + '-') && f.endsWith('.png'))
            .sort((a, b) => {
              const ai = Number((a.match(/-(\d+)\.png$/) || [])[1] || 0);
              const bi = Number((b.match(/-(\d+)\.png$/) || [])[1] || 0);
              return ai - bi;
            });
          for (const f of files) {
            const p = path.join(dir, f);
            const bin = fs.readFileSync(p);
            images.push(`data:image/png;base64,${bin.toString('base64')}`);
          }
        } catch {}
        // Cleanup best-effort
        try {
          fs.unlinkSync(inPath);
        } catch {}
        try {
          const dir = path.dirname(outPrefix);
          const base = path.basename(outPrefix);
          for (const f of fs.readdirSync(dir)) {
            if (f.startsWith(base + '-') && f.endsWith('.png')) {
              try { fs.unlinkSync(path.join(dir, f)); } catch {}
            }
          }
        } catch {}
        resolve(images);
      });
    } catch {
      resolve([]);
    }
  });
}
