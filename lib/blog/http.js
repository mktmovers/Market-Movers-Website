const CACHE_PAGE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';
const CACHE_MISS = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';
const CACHE_ERROR = 'no-store';

function readQuery(req) {
  const query = {};
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    for (const [key, value] of url.searchParams.entries()) query[key] = value;
  } catch (err) {
    // Ignore a malformed URL and fall through to req.query.
  }
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) query[key] = value[0] == null ? '' : String(value[0]);
      else if (value != null) query[key] = String(value);
    }
  }
  return query;
}

function send(req, res, status, body, { contentType, cacheControl, extra }) {
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    ...(extra || {}),
  };
  if (cacheControl.startsWith('public') && cacheControl.includes('s-maxage=')) {
    headers['Vercel-CDN-Cache-Control'] = cacheControl;
  }
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

function sendHtml(req, res, status, html, cacheControl) {
  send(req, res, status, html, {
    contentType: 'text/html; charset=utf-8',
    cacheControl,
  });
}

function allowMethod(req, res) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  send(req, res, 405, 'Method not allowed', {
    contentType: 'text/plain; charset=utf-8',
    cacheControl: CACHE_ERROR,
    extra: { Allow: 'GET, HEAD' },
  });
  return false;
}

module.exports = {
  CACHE_PAGE,
  CACHE_MISS,
  CACHE_ERROR,
  readQuery,
  send,
  sendHtml,
  allowMethod,
};
