const Joi = require('joi');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { AiLog } = require('../models/AiLog');
const { Message } = require('../models/Message');
const { Home } = require('../models/Home');
const { getPromptText, getTradePrompt } = require('../services/promptService');

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
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      if (imageUrlRegex.test(u)) {
        imageUrls.push(u);
        continue;
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
    if (!combined.trim() && imageUrls.length === 0) {
      return res.status(415).json({ message: 'Unsupported or empty content at URL(s)' });
    }
    const usedModel = model || (imageUrls.length > 0 ? 'gpt-4o' : 'gpt-4o-mini');
    const system = await getPromptText('system.analyze');
    let completion;
    if (imageUrls.length === 0) {
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
      for (const img of imageUrls.slice(0, 10)) {
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
    model: Joi.string().optional(),
    containsImage: Joi.boolean().optional(),
    containsImages: Joi.boolean().optional(),
  }).or('tradeId', 'taskId');
  const { value, error } = schema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  const { homeId, tradeId, taskId, urls = [], prompt, model } = value;
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
    for (let i = 0; i < Math.min(urls.length, 10); i++) {
      const u = urls[i];
      try {
        if (wantImages && imageUrlRegex.test(u)) {
          imageUrls.push(u);
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
    let tradePrompt = '';
    if (tradeId) {
      const home = await Home.findById(homeId).lean();
      const trade = (home?.trades || []).find((t) => String(t._id) === String(tradeId));
      if (trade) {
        tradePrompt = await getTradePrompt(trade.name || trade.category || '', '');
      }
    }
    const system = (await getPromptText('system.analyze.context')) || (await getPromptText('system.analyze'));
    let completion;
    if (wantImages && imageUrls.length > 0) {
      const userContent = [];
      if (tradePrompt) userContent.push({ type: 'text', text: `Trade guidance:\n${tradePrompt}` });
      if (prompt && prompt.trim()) userContent.push({ type: 'text', text: `User notes:\n${prompt.trim()}` });
      if (msgText.trim()) userContent.push({ type: 'text', text: `Recent project messages:\n${msgText.slice(0, 50_000)}` });
      if (docsText.trim()) userContent.push({ type: 'text', text: `Relevant document text:\n${docsText.slice(0, 150_000)}` });
      for (const img of imageUrls.slice(0, 10)) {
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
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      if (imageUrlRegex.test(u)) {
        imageUrls.push(u);
        continue;
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
    const usedModel = model || (imageUrls.length > 0 ? 'gpt-4o' : 'gpt-4o-mini');
    const system = await getPromptText('system.jsonOnly');
    const instruction = await getPromptText('architecture.analyze');
    let completion;
    if (imageUrls.length > 0) {
      const userContent = [{ type: 'text', text: instruction }];
      if (combined.trim()) {
        userContent.push({ type: 'text', text: `Relevant document text:\n${combined.slice(0, 180_000)}` });
      }
      for (const img of imageUrls.slice(0, 10)) {
        userContent.push({ type: 'image_url', image_url: { url: img } });
      }
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
      });
    } else {
      completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `${instruction}\n${combined.trim() ? `Relevant document text:\n${combined.slice(0, 180_000)}` : ''}`.trim() },
        ],
        temperature: 0.1,
      });
    }
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
    try {
      await AiLog.create({
        userEmail: req?.user?.email || null,
        mode: 'architecture',
        prompt: instruction,
        urls,
        model: completion?.model || usedModel,
        responseText: raw,
        usage: completion?.usage || undefined,
      });
    } catch (_e) {}
    return res.json({ houseType, roofType, exteriorType, suggestions, suggestedTasks, raw, model: completion?.model || usedModel });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Architecture analysis failed' });
  }
}

async function analyzeArchitectureUrls(urls, model) {
  // Reuse core logic but return normalized fields only
  const req = { body: { urls, model }, user: {} };
  const openai = ensureOpenAI(); // ensure key present early
  // Use the same internal steps as analyzeArchitecture without logging/res wrapper
  // Extract text + detect image URLs
  const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;
  let combined = '';
  const imageUrls = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    if (imageUrlRegex.test(u)) {
      imageUrls.push(u);
      continue;
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
  const usedModel = model || (imageUrls.length > 0 ? 'gpt-4o' : 'gpt-4o-mini');
  const system = 'You are Buildwise AI. Return ONLY raw JSON when asked. No prose, no code fences.';
  const instruction = [
    'Extract home characteristics from the provided architectural drawings/blueprints or images.',
    'Respond with a JSON object with keys:',
    'houseType (one of: single_family, townhome, pool, airport_hangar or empty string),',
    'roofType (one of: shingles, concrete_tile, flat_roof, metal_roof, other or empty string),',
    'exteriorType (one of: brick, stucco, siding, other or empty string).',
    'If unsure for any key, use empty string. Do NOT include code fences or explanations.',
  ].join(' ');
  let completion;
  if (imageUrls.length > 0) {
    const userContent = [{ type: 'text', text: instruction }];
    if (combined.trim()) {
      userContent.push({ type: 'text', text: `Relevant document text:\n${combined.slice(0, 180_000)}` });
    }
    for (const img of imageUrls.slice(0, 10)) {
      userContent.push({ type: 'image_url', image_url: { url: img } });
    }
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
    });
  } else {
    completion = await openai.chat.completions.create({
      model: usedModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${instruction}\n${combined.trim() ? `Relevant document text:\n${combined.slice(0, 180_000)}` : ''}`.trim() },
      ],
      temperature: 0.1,
    });
  }
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
        phaseKey: normalizeHouseType('x') && ['planning','preconstruction','exterior','interior'].includes(String(t?.phaseKey || '').toLowerCase())
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
      responseText: raw,
      usage: completion?.usage || undefined,
    });
  } catch (_e) {}
  return { houseType, roofType, exteriorType, suggestions, suggestedTasks, raw, model: completion?.model || usedModel };
}

module.exports = { analyzeUrl, analyzeFiles: analyzeFilesDirectToOpenAI, analyzeTradeContext, analyzeArchitecture, analyzeArchitectureUrls };

