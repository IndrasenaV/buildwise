const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const pdfParse = require('pdf-parse');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Initialize LangChain ChatOpenAI instance
 */
function getLangChainLLM(model = 'gpt-4o-mini', temperature = 0.2) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new ChatOpenAI({
    modelName: model,
    temperature,
    openAIApiKey: apiKey,
  });
}

/**
 * Fetch array buffer from URL
 */
async function fetchArrayBuffer(url) {
  const fetchImpl = global.fetch ? global.fetch.bind(global) : (await import('node-fetch')).default;
  const res = await fetchImpl(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed (${res.status}) ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  const arrayBuffer = await res.arrayBuffer();
  return { arrayBuffer, contentType };
}

/**
 * Extract text from PDF URL or buffer
 */
async function extractTextFromPdfUrl(url) {
  const { arrayBuffer } = await fetchArrayBuffer(url);
  const buf = Buffer.from(arrayBuffer);
  const parsed = await pdfParse(buf);
  return parsed.text || '';
}

/**
 * Extract text from various document types
 */
async function extractTextFromUrl(url) {
  const { arrayBuffer, contentType } = await fetchArrayBuffer(url);
  const buf = Buffer.from(arrayBuffer);
  if (/application\/pdf/i.test(contentType) || /\.pdf($|[\?#])/i.test(url)) {
    const parsed = await pdfParse(buf);
    return parsed.text || '';
  }
  if (/^text\//i.test(contentType) || /application\/(json|xml)/i.test(contentType)) {
    return buf.toString('utf8');
  }
  return buf.toString('utf8');
}

/**
 * Execute LLM with LangChain, supporting PDFs directly via text extraction
 * PDFs are processed as text (no image conversion), images are passed directly for vision models
 * @param {Object} options
 * @param {string} options.systemPrompt - System prompt
 * @param {string} options.userPrompt - User prompt/instruction
 * @param {Array<string>} options.urls - URLs to process (PDFs, images, text)
 * @param {string} options.model - Model name (default: gpt-4o-mini)
 * @param {number} options.temperature - Temperature (default: 0.2)
 * @param {boolean} options.supportsImages - Whether prompt supports images/vision
 * @param {string} options.extraContext - Additional context text
 * @returns {Promise<Object>} - { text, usage }
 */
async function executeWithLangChain({
  systemPrompt,
  userPrompt,
  urls = [],
  model = 'gpt-4o-mini',
  temperature = 0.2,
  supportsImages = false,
  extraContext = '',
  schema = null,
}) {
  const imageUrlRegex = /\.(png|jpe?g|webp|gif)$/i;

  // Separate URLs by type
  const pdfUrls = urls.filter((u) => /\.pdf($|[\?#])/i.test(u));
  const imageUrls = urls.filter((u) => imageUrlRegex.test(u));
  const textUrls = urls.filter((u) => !pdfUrls.includes(u) && !imageUrls.includes(u));

  // Extract text from PDFs and text URLs (PDFs are processed as text, not images)
  let combinedText = '';

  // Process text URLs
  for (let i = 0; i < textUrls.length; i++) {
    try {
      const text = await extractTextFromUrl(textUrls[i]);
      if (text && text.trim()) {
        combinedText += `\n\n--- Document ${i + 1}: ${textUrls[i]} ---\n${text}`;
        if (combinedText.length > 200000) break;
      }
    } catch (e) {
      combinedText += `\n\n--- Document ${i + 1}: ${textUrls[i]} (could not retrieve: ${e.message}) ---\n`;
    }
  }

  // Extract text from PDFs (no image conversion)
  for (let i = 0; i < pdfUrls.length; i++) {
    try {
      const text = await extractTextFromPdfUrl(pdfUrls[i]);
      if (text && text.trim()) {
        combinedText += `\n\n--- PDF ${i + 1}: ${pdfUrls[i]} ---\n${text}`;
        if (combinedText.length > 200000) break;
      }
    } catch (e) {
      combinedText += `\n\n--- PDF ${i + 1}: ${pdfUrls[i]} (could not retrieve: ${e.message}) ---\n`;
    }
  }

  if (extraContext && extraContext.trim()) {
    combinedText += `\n\n--- Additional Context ---\n${extraContext.slice(0, 30000)}`;
  }

  // Build messages
  const messages = [
    new SystemMessage(systemPrompt),
  ];

  // Build user message content
  const userContentParts = [userPrompt];
  if (combinedText.trim()) {
    userContentParts.push(`Relevant document text:\n${combinedText.slice(0, 200000)}`);
  }

  // Prepare model
  let llm;
  if (supportsImages && imageUrls.length > 0) {
    const visionModel = model.includes('gpt-4o') ? model : 'gpt-4o';
    llm = getLangChainLLM(visionModel, temperature);

    const userMessage = new HumanMessage({
      content: [
        { type: 'text', text: userContentParts.join('\n\n') },
        ...imageUrls.slice(0, 10).map((url) => ({
          type: 'image_url',
          image_url: { url },
        })),
      ],
    });
    messages.push(userMessage);
  } else {
    llm = getLangChainLLM(model, temperature);
    const userMessage = new HumanMessage(userContentParts.join('\n\n'));
    messages.push(userMessage);
  }

  // Execute with or without schema
  if (schema) {
    const structuredLlm = llm.withStructuredOutput(schema);
    const result = await structuredLlm.invoke(messages);
    return {
      text: JSON.stringify(result), // Return as string to maintain interface compatibility, or change interface if needed. 
      // Controller expects { text, usage }. Since structured output returns object, we stringify it so controller can parse or use directly.
      // Actually, if I return object as 'text', generic controllers might break.
      // Better: return `result` as a new property `data` in the return object?
      // But let's verify aiController usage. It expects { text, usage }.
      // Existing code does `const parsed = parseJsonLoose(raw)`.
      // If I return the stringified JSON here, `parseJsonLoose` will parse it back.
      data: result, // useful for direct access
      usage: undefined, // structured output might not return usage metadata easily in all versions
    };
  } else {
    const response = await llm.invoke(messages);
    return {
      text: response.content.toString(),
      usage: response.response_metadata?.usage || undefined,
    };
  }
}

module.exports = {
  getLangChainLLM,
  executeWithLangChain,
  extractTextFromUrl,
  extractTextFromPdfUrl,
};

