import { jsonContent } from '../util.js';
import { imagesSearchAllowedHandler, isAllowedUrl } from './images_search_allowed.js';

function parseAllowedDomains() {
  const raw = String(process.env.ALLOWED_IMAGE_DOMAINS || '').trim();
  if (!raw) return [];
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function registerImagesGetAllowed(server) {
  server.tool(
    'images_get_allowed',
    {
      description: 'Validate and return an allowed image URL; optionally HEAD-check content-type.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          check: { type: 'boolean' }
        },
        required: ['url'],
        additionalProperties: false
      }
    },
    async ({ url, check = true }) => {
      const result = await imagesGetAllowedHandler({ url, check });
      return result;
    }
  );
}

export async function imagesGetAllowedHandler({ url, check = true }, fetchImpl = fetch) {
  const allowed = parseAllowedDomains();
  if (!allowed.length) {
    throw new Error('No allowed domains configured (ALLOWED_IMAGE_DOMAINS)');
  }
  if (!isAllowedUrl(url, allowed)) {
    throw new Error('URL is not in allowed domains');
  }
  let contentType = '';
  if (check) {
    const res = await fetchImpl(url, { method: 'HEAD' });
    if (!res.ok) throw new Error(`HEAD failed: ${res.status}`);
    contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType || 'unknown'}`);
    }
  }
  return { content: jsonContent({ url, contentType, allowedDomains: allowed }) };
}


