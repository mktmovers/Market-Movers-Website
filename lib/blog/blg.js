// Server-side BabyLoveGrowth read client.
// Endpoints match babylovegrowth-next-js-blog@0.2.5:
//   GET {base}/articles?limit=&offset=          summaries, newest first
//   GET {base}/articles/by-slug/{slug}          full article, or 404
// Auth header: X-API-Key. The key is never logged or returned.

const DEFAULT_BASE_URL = 'https://api.babylovegrowth.ai/api/integrations/v1';
const USER_AGENT = 'MarketMoversBlog/1.0';
const PAGE_LIMIT = 50;

class BlgError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status || 0;
  }
}

function baseUrl() {
  const configured = process.env.BABYLOVEGROWTH_BLOG_API_URL;
  const raw = configured && String(configured).trim() ? String(configured).trim() : DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, '');
}

function apiKey() {
  const key = process.env.BABYLOVEGROWTH_BLOG_API_KEY;
  return key && String(key).trim() ? String(key).trim() : '';
}

function asObject(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
      return null;
    }
  }
  return null;
}

function asKeywords(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeArticle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const slug = String(raw.slug || '').trim();
  if (!slug) return null;
  return {
    id: raw.id,
    title: String(raw.title || 'Untitled').replace(/\s+/g, ' ').trim() || 'Untitled',
    slug,
    hero_image_url: String(raw.hero_image_url || raw.heroImageUrl || '').trim(),
    languageCode: String(raw.languageCode || raw.language_code || raw.lang || 'en').trim() || 'en',
    meta_description: String(raw.meta_description || raw.metaDescription || '').replace(/\s+/g, ' ').trim(),
    excerpt: String(raw.excerpt || '').replace(/\s+/g, ' ').trim(),
    created_at: String(raw.created_at || raw.createdAt || '').trim(),
    updated_at: String(raw.updated_at || raw.updatedAt || '').trim(),
    published_at: String(raw.published_at || raw.publishedAt || '').trim(),
    published: raw.published === true,
    seedKeyword: raw.seedKeyword ? String(raw.seedKeyword).trim() : '',
    keywords: asKeywords(raw.keywords),
    content_html: String(raw.content_html || raw.contentHtml || ''),
    content_markdown: String(raw.content_markdown || raw.contentMarkdown || ''),
    jsonLd: asObject(raw.jsonLd || raw.json_ld),
    faqJsonLd: asObject(raw.faqJsonLd || raw.faq_json_ld),
  };
}

function asList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.articles)) return payload.articles;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.results)) return payload.results;
  throw new BlgError('BLG_SHAPE', 502);
}

async function blgGet(path, searchParams) {
  const key = apiKey();
  if (!key) throw new BlgError('MISSING_KEY', 503);

  const url = new URL(`${baseUrl()}${path}`);
  if (searchParams) {
    for (const [name, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(name, String(value));
      }
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': key,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch (err) {
    throw new BlgError('BLG_NETWORK', 503);
  }

  if (response.status === 404) return null;
  if (!response.ok) throw new BlgError('BLG_HTTP', response.status);

  try {
    return await response.json();
  } catch (err) {
    throw new BlgError('BLG_SHAPE', 502);
  }
}

// The list is already newest-first. Articles are not filtered on `published`:
// BabyLoveGrowth's own Lovable guide says that flag is false for almost every
// article on this pull API, and filtering it returns an empty blog.
async function listArticles({ limit = PAGE_LIMIT, offset = 0 } = {}) {
  const size = Math.min(PAGE_LIMIT, Math.max(1, limit));
  const payload = await blgGet('/articles', { limit: size, offset: Math.max(0, offset) });
  return asList(payload).map(normalizeArticle).filter(Boolean);
}

async function listAllArticles() {
  const all = [];
  let offset = 0;
  for (let page = 0; page < 20; page += 1) {
    if (page > 0) await new Promise((resolve) => setTimeout(resolve, 550));
    const batch = await listArticles({ limit: PAGE_LIMIT, offset });
    all.push(...batch);
    if (batch.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }
  return all;
}

async function getArticleBySlug(slug) {
  const payload = await blgGet(`/articles/by-slug/${encodeURIComponent(slug)}`);
  if (!payload) return null;
  return normalizeArticle(payload);
}

function logBlgError(err, where) {
  if (err && err.code === 'MISSING_KEY') {
    console.error(`Blog ${where}: BABYLOVEGROWTH_BLOG_API_KEY is not set`);
    return;
  }
  const status = err && err.status ? ` (${err.status})` : '';
  console.error(`Blog ${where}: BabyLoveGrowth request failed${status}`);
}

module.exports = {
  BlgError,
  DEFAULT_BASE_URL,
  USER_AGENT,
  listArticles,
  listAllArticles,
  getArticleBySlug,
  logBlgError,
  normalizeArticle,
};
