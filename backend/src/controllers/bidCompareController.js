const Joi = require('joi');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { Home } = require('../models/Home');
const { buildTradePrompt } = require('../services/bidComparisonPrompts');

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

const compareSchema = Joi.object({
  urls: Joi.array().items(Joi.string().uri()).min(2).required(),
  extraContext: Joi.string().allow('').optional(),
});

async function compareTradeBids(req, res) {
  const { homeId, bidId } = req.params;
  const { value, error } = compareSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details });
  }
  try {
    const home = await Home.findById(homeId);
    if (!home) return res.status(404).json({ message: 'Home not found' });
    const trade = (home.trades || []).find((t) => String(t._id) === String(bidId));
    if (!trade) return res.status(404).json({ message: 'Trade not found on home' });
    const prompt = buildTradePrompt(trade.name || trade.category || '', value.extraContext || '');
    // Extract text from each URL (cap combined length)
    let combined = '';
    for (let i = 0; i < value.urls.length; i++) {
      const u = value.urls[i];
      try {
        const text = await extractTextFromUrl(u);
        if (text && text.trim()) {
          const header = `\n\n--- Bid Document ${i + 1}: ${u} ---\n`;
          combined += `${header}${text}`;
          if (combined.length > 200_000) break;
        }
      } catch (e) {
        combined += `\n\n--- Bid Document ${i + 1}: ${u} (error: ${e.message}) ---\n`;
      }
    }
    if (!combined.trim()) {
      return res.status(415).json({ message: 'No readable text found in provided PDFs' });
    }
    const system = [
      'You are Buildwise AI. Provide accurate, structured construction bid comparisons.',
      'Keep answers structured, specific, and concise where possible.',
    ].join(' ');
    const openai = ensureOpenAI();
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
      { role: 'user', content: `Extracted bid texts:\n${combined.slice(0, 200000)}` },
    ];
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
    });
    const text = completion?.choices?.[0]?.message?.content?.toString?.() || '';
    return res.json({
      result: text,
      model: completion?.model || 'gpt-4o-mini',
      usage: completion?.usage || undefined,
      trade: { id: trade._id, name: trade.name || '' },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Bid comparison failed' });
  }
}

module.exports = { compareTradeBids };


