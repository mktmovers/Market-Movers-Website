const { getArticleBySlug, logBlgError } = require('../lib/blog/blg');
const { isSafeSlug, renderArticle, renderNotFound, renderUnavailable } = require('../lib/blog/html');
const { CACHE_ERROR, CACHE_MISS, CACHE_PAGE, allowMethod, readQuery, sendHtml } = require('../lib/blog/http');

function slugFrom(req) {
  const query = readQuery(req);
  if (query.slug) {
    try {
      return decodeURIComponent(query.slug);
    } catch (err) {
      return query.slug;
    }
  }
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const blogAt = parts.indexOf('blog');
    if (blogAt >= 0 && parts[blogAt + 1] && parts[blogAt + 1] !== 'sitemap.xml') {
      return decodeURIComponent(parts[blogAt + 1]);
    }
  } catch (err) {
    return '';
  }
  return '';
}

module.exports = async function handler(req, res) {
  if (!allowMethod(req, res)) return;

  const slug = slugFrom(req);
  if (!isSafeSlug(slug)) {
    sendHtml(req, res, 404, renderNotFound(), CACHE_MISS);
    return;
  }

  try {
    const article = await getArticleBySlug(slug);
    if (!article || !isSafeSlug(article.slug)) {
      sendHtml(req, res, 404, renderNotFound(), CACHE_MISS);
      return;
    }
    sendHtml(req, res, 200, renderArticle(article), CACHE_PAGE);
  } catch (err) {
    logBlgError(err, 'article');
    sendHtml(req, res, 503, renderUnavailable(), CACHE_ERROR);
  }
};
