import { jsonContent } from '../util.js';

function parseAllowedDomains() {
  const raw = String(process.env.ALLOWED_IMAGE_DOMAINS || '').trim();
  if (!raw) return [];
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function isAllowedUrl(url, allowed) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return allowed.some(d => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function registerImagesSearchAllowed(server) {
  server.tool(
    'images_search_allowed',
    {
      description: 'Search images from approved domains only (via Bing Image Search).',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          count: { type: 'number' },
          domains: { type: 'array', items: { type: 'string' } }
        },
        required: ['query'],
        additionalProperties: false
      }
    },
    async ({ query, count = 12, domains }) => {
      const result = await imagesSearchAllowedHandler({ query, count, domains });
      return result;
    }
  );
}

export async function imagesSearchAllowedHandler({ query, count = 12, domains }, fetchImpl = fetch) {
  const provider = String(process.env.IMAGES_PROVIDER || 'bing').toLowerCase();
  const allowedFromEnv = parseAllowedDomains();
  const allowed = Array.isArray(domains) && domains.length
    ? domains.map(d => d.toLowerCase())
    : allowedFromEnv;
  if (!allowed.length) {
    throw new Error('No allowed domains configured (set ALLOWED_IMAGE_DOMAINS or pass domains[])');
  }
  // Build site-restricted query string
  const siteExpr = allowed.map(d => `site:${d}`).join(' OR ');
  const q = `${siteExpr} ${query}`.trim();

  let mapped = [];
  if (provider === 'google') {
    const cseId = process.env.GOOGLE_CSE_ID;
    const apiKey = process.env.GOOGLE_CSE_KEY;
    if (!cseId || !apiKey) throw new Error('Missing GOOGLE_CSE_ID or GOOGLE_CSE_KEY');
    // Google Custom Search: supports up to 10 results per call
    const num = Math.min(Math.max(Number(count) || 10, 1), 10);
    const url = `https://www.googleapis.com/customsearch/v1?searchType=image&q=${encodeURIComponent(q)}&cx=${encodeURIComponent(cseId)}&key=${encodeURIComponent(apiKey)}&num=${num}&safe=active`;
    const res = await fetchImpl(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Google CSE image search failed: ${res.status} ${txt || ''}`);
    }
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    mapped = items.map(it => {
      const imageUrl = it.link || '';
      const hostUrl = it.image?.contextLink || it.link || '';
      const domain = (() => {
        try { return new URL(imageUrl || hostUrl).hostname.toLowerCase(); } catch { return ''; }
      })();
      return {
        id: it.cacheId || it.link || it.image?.contextLink,
        thumbUrl: it.image?.thumbnailLink || it.link || '',
        fullUrl: imageUrl,
        width: it.image?.width || null,
        height: it.image?.height || null,
        alt: it.title || '',
        domain,
        sourceUrl: hostUrl,
        attribution: it.displayLink || domain || ''
      };
    }).filter(it => it.fullUrl && isAllowedUrl(it.fullUrl, allowed));
  } else {
    const key = process.env.BING_API_KEY;
    if (!key) throw new Error('Missing BING_API_KEY');
    const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(q)}&count=${Math.min(Math.max(Number(count) || 12, 1), 50)}&safeSearch=Moderate`;
    const res = await fetchImpl(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Bing image search failed: ${res.status} ${txt || ''}`);
    }
    const data = await res.json();
    const items = Array.isArray(data?.value) ? data.value : [];
    mapped = items.map(it => {
      const imageUrl = it.contentUrl || it.thumbnailUrl || '';
      const hostUrl = it.hostPageUrl || '';
      const domain = (() => {
        try { return new URL(imageUrl || hostUrl).hostname.toLowerCase(); } catch { return ''; }
      })();
      return {
        id: it.imageId || it.imageInsightsToken || it.contentUrl || it.hostPageUrl,
        thumbUrl: it.thumbnailUrl || it.contentUrl || '',
        fullUrl: it.contentUrl || '',
        width: it.width || it.thumbnail?.width || null,
        height: it.height || it.thumbnail?.height || null,
        alt: it.name || '',
        domain,
        sourceUrl: hostUrl || it.webSearchUrl || '',
        attribution: it.provider?.[0]?.name || domain || ''
      };
    }).filter(it => it.fullUrl && isAllowedUrl(it.fullUrl, allowed));
  }

  return { content: jsonContent({ items: mapped, allowedDomains: allowed, provider }) };
}


