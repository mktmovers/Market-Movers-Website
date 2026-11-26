const { listAllArticles, logBlgError } = require('../lib/blog/blg');
const { renderSitemap } = require('../lib/blog/html');
const { CACHE_ERROR, CACHE_PAGE, allowMethod, send } = require('../lib/blog/http');

module.exports = async function handler(req, res) {
  if (!allowMethod(req, res)) return;

  try {
    const articles = await listAllArticles();
    send(req, res, 200, renderSitemap(articles), {
      contentType: 'application/xml; charset=utf-8',
      cacheControl: CACHE_PAGE,
    });
  } catch (err) {
    logBlgError(err, 'sitemap');
    send(req, res, 503, 'Sitemap temporarily unavailable\n', {
      contentType: 'text/plain; charset=utf-8',
      cacheControl: CACHE_ERROR,
    });
  }
};
