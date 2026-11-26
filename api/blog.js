const { listArticles, logBlgError } = require('../lib/blog/blg');
const { PAGE_SIZE, parsePage, renderIndex, renderNotFound, renderUnavailable } = require('../lib/blog/html');
const { CACHE_ERROR, CACHE_MISS, CACHE_PAGE, allowMethod, readQuery, sendHtml } = require('../lib/blog/http');

module.exports = async function handler(req, res) {
  if (!allowMethod(req, res)) return;

  const query = readQuery(req);
  const page = parsePage(query.page);
  if (page == null) {
    sendHtml(req, res, 404, renderNotFound(), CACHE_MISS);
    return;
  }
  if (query.page === '1') {
    res.writeHead(308, { Location: '/blog/', 'Cache-Control': 'public, max-age=3600' });
    res.end();
    return;
  }

  try {
    const batch = await listArticles({ limit: PAGE_SIZE + 1, offset: (page - 1) * PAGE_SIZE });
    if (page > 1 && batch.length === 0) {
      sendHtml(req, res, 404, renderNotFound(), CACHE_MISS);
      return;
    }
    const hasNext = batch.length > PAGE_SIZE;
    const articles = hasNext ? batch.slice(0, PAGE_SIZE) : batch;
    sendHtml(req, res, 200, renderIndex({ articles, page, hasNext }), CACHE_PAGE);
  } catch (err) {
    logBlgError(err, 'index');
    sendHtml(req, res, 503, renderUnavailable(), CACHE_ERROR);
  }
};
