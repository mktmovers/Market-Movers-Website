// HTML for the blog index, article pages, and the friendly error states.
// Article HTML from BabyLoveGrowth is sanitized before it is inserted.

const SITE = 'https://mktmovers.com';
const PAGE_SIZE = 12;
const DEFAULT_SHARE_IMAGE = `${SITE}/assets/img/og-image.jpg`;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonScript(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function safeHttpUrl(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.href;
  } catch (err) {
    return '';
  }
}

function isSafeSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) && slug.length <= 180;
}

function postPath(slug) {
  return `/blog/${encodeURIComponent(slug)}/`;
}

function postUrl(slug) {
  return `${SITE}${postPath(slug)}`;
}

function pagePath(page) {
  return page > 1 ? `/blog/?page=${page}` : '/blog/';
}

function pageUrl(page) {
  return `${SITE}${pagePath(page)}`;
}

function parsePage(value) {
  if (value == null || value === '') return 1;
  if (!/^[1-9]\d{0,4}$/.test(String(value))) return null;
  return Number(value);
}

function languageOf(code) {
  const value = String(code || '').trim();
  return /^[a-z]{2}(?:-[A-Za-z0-9]+)*$/i.test(value) ? value : 'en';
}

function dateValue(article) {
  return article.published_at || article.created_at || article.updated_at || '';
}

function modifiedValue(article) {
  return article.updated_at || article.published_at || article.created_at || '';
}

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function isoDay(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function plainText(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function excerptOf(article) {
  return plainText(article.excerpt) || plainText(article.meta_description);
}

function keywordsOf(article) {
  const seen = new Set();
  const out = [];
  for (const value of [article.seedKeyword, ...(article.keywords || [])]) {
    const text = String(value || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length === 12) break;
  }
  return out;
}

function attrUrl(attrs, name) {
  const match = String(attrs).match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) return '';
  return match[2] || match[3] || match[4] || '';
}

function allowedEmbed(src) {
  const url = safeHttpUrl(src);
  if (!url) return false;
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch (err) {
    return false;
  }
  return (
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com' ||
    host.endsWith('.youtube-nocookie.com') ||
    host === 'vimeo.com' ||
    host.endsWith('.vimeo.com')
  );
}

function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  let out = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script\b[^>]*\/?>/gi, '');
  out = out.replace(/<(?:object|embed|base|meta|link|form)\b[^>]*>[\s\S]*?<\/(?:object|embed|base|meta|link|form)>/gi, '');
  out = out.replace(/<(?:object|embed|base|meta|link|form)\b[^>]*\/?>/gi, '');
  const keepIframe = (attrs) => {
    if (!allowedEmbed(attrUrl(attrs, 'src'))) return '';
    let cleaned = String(attrs)
      .replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    if (!/\ssandbox\s*=/i.test(cleaned)) {
      cleaned += ' sandbox="allow-scripts allow-same-origin allow-presentation"';
    }
    return `<iframe${cleaned}></iframe>`;
  };
  out = out.replace(/<iframe\b([^>]*)\/>/gi, (match, attrs) => keepIframe(attrs));
  out = out.replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (match, attrs) => keepIframe(attrs));
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/\s+(href|src|xlink:href|action)\s*=\s*(["'])\s*(?:javascript:|data:)[\s\S]*?\2/gi, '');
  out = out.replace(/\s+(href|src|xlink:href|action)\s*=\s*(?:javascript:|data:)[^\s>]*/gi, '');
  return out;
}

function prepareContent(html) {
  // The page template supplies the single h1. Drop a leading duplicate from the article HTML.
  return sanitizeHtml(html).replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, '');
}

const TRACKING_HEAD = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6WQPTY95XX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-6WQPTY95XX');
</script>
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1633252588384268');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1633252588384268&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

function headerHtml() {
  return `<header class="site-header">
  <div class="site-header__bar">
    <a class="brand" href="/"><img src="/assets/img/mm-logo-white.png" alt="Market Movers" width="192" height="192"><span>Market Movers</span></a>
    <nav class="nav" aria-label="Main">
      <a href="/#approach">Approach</a>
      <div class="nav__drop">
        <button type="button" class="nav__drop-btn" aria-expanded="false" aria-controls="nav-services">Services<span class="nav__caret" aria-hidden="true"></span></button>
        <div class="nav__menu" id="nav-services">
          <a href="/webinar-marketing/">Webinar Marketing</a>
          <a href="/law-firm-seo/">Law Firm SEO</a>
          <a href="/course-creators/">Course Launch Marketing</a>
          <a href="/#services">All services</a>
        </div>
      </div>
      <div class="nav__drop">
        <button type="button" class="nav__drop-btn" aria-expanded="false" aria-controls="nav-cases">Case Studies<span class="nav__caret" aria-hidden="true"></span></button>
        <div class="nav__menu" id="nav-cases">
          <a href="/case-studies/cogent-law/">Cogent Law</a>
          <a href="/case-studies/cybervault/">CyberVault School</a>
          <a href="/case-studies/elder-law-college/">Elder Law College</a>
          <a href="/case-studies/solkoff-legal/">Solkoff Legal</a>
          <a href="/case-studies/">All case studies</a>
        </div>
      </div>
      <a href="/free-tools/">Free Tools</a>
      <div class="nav__drop" data-until="2026-12-03">
        <button type="button" class="nav__drop-btn" aria-expanded="false" aria-controls="nav-events">Events<span class="nav__caret" aria-hidden="true"></span></button>
        <div class="nav__menu" id="nav-events">
          <a href="/webinar-dec-02-mkm/" data-until="2026-12-03">Dec 2 · Free Live Webinar</a>
        </div>
      </div>
      <a href="/community/">Training</a>
      <a href="/blog/" aria-current="page">Blog</a>
      <a href="/#team">Team</a>
      <a href="/#faq">FAQ</a>
    </nav>
    <a class="btn btn--blue btn--sm site-header__cta" href="https://calendly.com/jessica-caldwell2/30min">Book a strategy call</a>
    <button type="button" class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="mobile-nav">Menu ☰</button>
  </div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile">
    <a href="/#approach">Approach</a>
    <span class="mobile-nav__group">Services</span>
    <a class="mobile-nav__sub" href="/webinar-marketing/">Webinar Marketing</a>
    <a class="mobile-nav__sub" href="/law-firm-seo/">Law Firm SEO</a>
    <a class="mobile-nav__sub" href="/course-creators/">Course Launch Marketing</a>
    <a class="mobile-nav__sub" href="/#services">All services</a>
    <span class="mobile-nav__group">Case Studies</span>
    <a class="mobile-nav__sub" href="/case-studies/cogent-law/">Cogent Law</a>
    <a class="mobile-nav__sub" href="/case-studies/cybervault/">CyberVault School</a>
    <a class="mobile-nav__sub" href="/case-studies/elder-law-college/">Elder Law College</a>
    <a class="mobile-nav__sub" href="/case-studies/solkoff-legal/">Solkoff Legal</a>
    <a class="mobile-nav__sub" href="/case-studies/">All case studies</a>
    <a href="/free-tools/">Free Tools</a>
    <span class="mobile-nav__group" data-until="2026-12-03">Events</span>
    <a class="mobile-nav__sub" href="/webinar-dec-02-mkm/" data-until="2026-12-03">Dec 2 · Free Live Webinar</a>
    <a href="/community/">Training</a>
    <a href="/blog/" aria-current="page">Blog</a>
    <a href="/#team">Team</a>
    <a href="/#faq">FAQ</a>
    <a class="mobile-nav__cta" href="https://calendly.com/jessica-caldwell2/30min">Book a strategy call</a>
  </nav>
</header>`;
}

function footerHtml() {
  return `<footer class="site-footer">
  <div class="site-footer__row">
    <a class="brand" href="/"><img src="/assets/img/mm-logo-white.png" alt="Market Movers" width="192" height="192"><span>Market Movers</span></a>
    <span>Stay ahead of the curve in marketing, AI and automation</span>
    <span class="site-footer__copy">© 2026 Market Movers</span>
    <a class="site-footer__link" href="/privacy/">Privacy</a>
    <a class="site-footer__link" href="/blog/">Blog</a>
  </div>
</footer>`;
}

function ctaHtml() {
  return `<section class="sec--cta">
  <div class="glow glow--cta"></div>
  <div class="cta__inner">
    <img src="/assets/img/mm-logo-gold.png" alt="" width="192" height="192">
    <h2 class="h-cta">Ready to move your market?</h2>
    <p>Bring the problem. Leave with the beginning of a solution. No fluff, no ninety-slide deck, no junior account manager.</p>
    <div class="btn-row">
      <a class="btn btn--blue btn--lg" href="https://calendly.com/jessica-caldwell2/30min">Book a strategy call</a>
      <a class="btn btn--ghost btn--lg" href="mailto:support@mktmovers.com">support@mktmovers.com</a>
    </div>
  </div>
</section>`;
}

function layout(options) {
  const title = options.title;
  const description = options.description;
  const canonical = options.canonical;
  const image = safeHttpUrl(options.image) || DEFAULT_SHARE_IMAGE;
  const imageAlt = options.imageAlt || 'Market Movers';
  const robots = options.robots ? `<meta name="robots" content="${escapeHtml(options.robots)}">` : '';
  const ogType = options.ogType || 'website';
  const lang = languageOf(options.lang || 'en');
  const jsonLd = (options.jsonLd || []).map(jsonScript).join('\n');
  const extraHead = options.extraHead || '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${TRACKING_HEAD}
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${robots}
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:type" content="${escapeHtml(ogType)}">
<meta property="og:site_name" content="Market Movers">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
${extraHead}
${jsonLd}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900&amp;family=Inter:wght@400;500;600;700&amp;family=Source+Serif+4:ital,wght@0,600;1,600&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script src="/assets/js/site.js" defer></script>
</head>
<body>
${headerHtml()}
<main>
${options.main}
</main>
${footerHtml()}
</body>
</html>`;
}

function cardHtml(article) {
  const href = postPath(article.slug);
  const image = safeHttpUrl(article.hero_image_url);
  const date = formatDate(dateValue(article));
  const excerpt = excerptOf(article);
  const media = image
    ? `<div class="blog-card__media"><img src="${escapeHtml(image)}" alt=""></div>`
    : '<div class="blog-card__media blog-card__media--empty" aria-hidden="true"></div>';
  const time = date
    ? `<time class="blog-card__date" datetime="${escapeHtml(isoDay(dateValue(article)))}">${escapeHtml(date)}</time>`
    : '';
  const summary = excerpt ? `<p class="blog-card__excerpt">${escapeHtml(excerpt)}</p>` : '';
  return `<a class="blog-card" href="${escapeHtml(href)}">
  ${media}
  <div class="blog-card__body">
    ${time}
    <h2 class="blog-card__title">${escapeHtml(article.title)}</h2>
    ${summary}
  </div>
</a>`;
}

function pagerHtml(page, hasNext) {
  if (page <= 1 && !hasNext) return '';
  const newer = page > 1
    ? `<a href="${escapeHtml(pagePath(page - 1))}">← Newer</a>`
    : '<span></span>';
  const older = hasNext
    ? `<a href="${escapeHtml(pagePath(page + 1))}">Older →</a>`
    : '<span></span>';
  return `<nav class="blog-pager" aria-label="Blog pages">
  ${newer}
  <span class="blog-pager__status">Page ${page}</span>
  ${older}
</nav>`;
}

function renderIndex({ articles, page, hasNext }) {
  articles = articles.filter((article) => isSafeSlug(article.slug));
  const title = page > 1 ? `Blog, page ${page} | Market Movers` : 'Blog | Market Movers';
  const description = 'Notes from Market Movers on webinars, search, and the systems that turn expertise into a pipeline.';
  const canonical = pageUrl(page);
  const links = [];
  if (page > 1) links.push(`<link rel="prev" href="${escapeHtml(pageUrl(page - 1))}">`);
  if (hasNext) links.push(`<link rel="next" href="${escapeHtml(pageUrl(page + 1))}">`);

  const list = articles.length
    ? `<div class="blog-grid">${articles.map(cardHtml).join('\n')}</div>\n${pagerHtml(page, hasNext)}`
    : `<div class="blog-empty">
  <p class="eyebrow">Coming soon</p>
  <h2 class="h3">Articles coming soon.</h2>
  <p class="lede">New writing from the Market Movers team will show up here. Check back shortly.</p>
  <a class="btn btn--black" href="/">Back to Market Movers</a>
</div>`;

  const itemList = articles.length
    ? {
        '@type': 'ItemList',
        itemListElement: articles.map((article, index) => ({
          '@type': 'ListItem',
          position: (page - 1) * PAGE_SIZE + index + 1,
          url: postUrl(article.slug),
          name: article.title,
        })),
      }
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${SITE}/blog/#blog`,
        name: 'Market Movers Blog',
        url: `${SITE}/blog/`,
        description,
        publisher: { '@id': `${SITE}/#org` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: canonical },
        ],
      },
      ...(itemList ? [itemList] : []),
    ],
  };

  return layout({
    title,
    description,
    canonical,
    extraHead: links.join('\n'),
    jsonLd: [jsonLd],
    main: `<section class="sec--hero blog-hero">
  <div class="glow glow--hero"></div>
  <div class="hero-lines"></div>
  <div class="wrap blog-hero__inner">
    <div class="eyebrow eyebrow--gold">Notes from the team</div>
    <h1 class="h1">Blog</h1>
    <p class="hero-lede">Ideas on webinars, search, and the systems that turn expertise into a pipeline.</p>
  </div>
</section>
<section class="sec blog-index">
  <div class="wrap">
    ${list}
  </div>
</section>
${ctaHtml()}`,
  });
}

function blogPosting(article, canonical) {
  const image = safeHttpUrl(article.hero_image_url);
  const published = dateValue(article);
  const modified = modifiedValue(article);
  const posting = {
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    headline: article.title,
    description: article.meta_description || excerptOf(article) || article.title,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: languageOf(article.languageCode),
    author: { '@type': 'Organization', name: 'Market Movers', url: `${SITE}/` },
    publisher: {
      '@type': 'Organization',
      name: 'Market Movers',
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/mm-logo-gold.png` },
    },
  };
  if (image) posting.image = [image];
  if (published && !Number.isNaN(Date.parse(published))) posting.datePublished = new Date(published).toISOString();
  if (modified && !Number.isNaN(Date.parse(modified))) posting.dateModified = new Date(modified).toISOString();
  const keywords = keywordsOf(article);
  if (keywords.length) posting.keywords = keywords;
  return posting;
}

function renderArticle(article) {
  const canonical = postUrl(article.slug);
  const description = article.meta_description || excerptOf(article) || `Read ${article.title} on the Market Movers blog.`;
  const image = safeHttpUrl(article.hero_image_url);
  const published = dateValue(article);
  const modified = modifiedValue(article);
  const dateLabel = formatDate(published);
  const content = prepareContent(article.content_html);
  const body = content.trim()
    ? content
    : '<p>This article is being prepared and will be available shortly.</p>';
  const tags = keywordsOf(article);
  const tagHtml = tags.length
    ? `<ul class="blog-tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
    : '';
  const timeHtml = dateLabel
    ? `<time class="blog-date" datetime="${escapeHtml(isoDay(published))}">${escapeHtml(dateLabel)}</time>`
    : '';
  const extra = [];
  if (published && !Number.isNaN(Date.parse(published))) {
    extra.push(`<meta property="article:published_time" content="${escapeHtml(new Date(published).toISOString())}">`);
  }
  if (modified && !Number.isNaN(Date.parse(modified))) {
    extra.push(`<meta property="article:modified_time" content="${escapeHtml(new Date(modified).toISOString())}">`);
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      blogPosting(article, canonical),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
          { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
        ],
      },
    ],
  };
  const jsonLd = [graph];
  if (article.faqJsonLd && (article.faqJsonLd['@type'] || article.faqJsonLd['@graph'])) {
    jsonLd.push(article.faqJsonLd);
  }

  return layout({
    title: `${article.title} | Market Movers`,
    description,
    canonical,
    ogType: 'article',
    image: image || DEFAULT_SHARE_IMAGE,
    imageAlt: article.title,
    lang: article.languageCode,
    extraHead: extra.join('\n'),
    jsonLd,
    main: `<article class="sec blog-article">
  <div class="blog-article__wrap">
    <p class="blog-kicker"><a href="/blog/">← All articles</a></p>
    <h1 class="h1">${escapeHtml(article.title)}</h1>
    ${timeHtml}
    <div class="blog-prose">${body}</div>
    ${tagHtml}
  </div>
</article>
${ctaHtml()}`,
  });
}

function renderMessage({ statusTitle, heading, message, canonical }) {
  return layout({
    title: `${statusTitle} | Market Movers`,
    description: message,
    canonical,
    robots: 'noindex',
    main: `<section class="sec--cta blog-status">
  <div class="glow glow--cta"></div>
  <div class="cta__inner">
    <img src="/assets/img/mm-logo-gold.png" alt="" width="192" height="192">
    <div class="eyebrow eyebrow--gold">${escapeHtml(statusTitle)}</div>
    <h1 class="h-cta">${escapeHtml(heading)}</h1>
    <p>${escapeHtml(message)}</p>
    <div class="btn-row">
      <a class="btn btn--blue btn--lg" href="/blog/">Back to the blog</a>
      <a class="btn btn--ghost btn--lg" href="/">Market Movers</a>
    </div>
  </div>
</section>`,
  });
}

function renderNotFound() {
  return renderMessage({
    statusTitle: 'Not found',
    heading: 'This article isn’t here.',
    message: 'The link may be old, or the article may not be published yet.',
    canonical: `${SITE}/blog/`,
  });
}

function renderUnavailable() {
  return renderMessage({
    statusTitle: 'Blog',
    heading: 'The blog is taking a short break.',
    message: 'Articles are temporarily unavailable. Please check back shortly.',
    canonical: `${SITE}/blog/`,
  });
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function latestDay(articles) {
  let best = 0;
  let day = '';
  for (const article of articles) {
    const raw = modifiedValue(article);
    const time = Date.parse(raw);
    if (!Number.isNaN(time) && time >= best) {
      best = time;
      day = isoDay(raw);
    }
  }
  return day;
}

function renderSitemap(articles) {
  const indexDay = latestDay(articles);
  const indexLastmod = indexDay ? `\n    <lastmod>${indexDay}</lastmod>` : '';
  const urls = [
    `  <url>\n    <loc>${escapeXml(`${SITE}/blog/`)}</loc>${indexLastmod}\n  </url>`,
  ];
  const seen = new Set();
  for (const article of articles) {
    if (!isSafeSlug(article.slug) || seen.has(article.slug)) continue;
    seen.add(article.slug);
    const day = isoDay(modifiedValue(article));
    const lastmod = day ? `\n    <lastmod>${day}</lastmod>` : '';
    urls.push(`  <url>\n    <loc>${escapeXml(postUrl(article.slug))}</loc>${lastmod}\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

module.exports = {
  PAGE_SIZE,
  SITE,
  escapeHtml,
  isSafeSlug,
  parsePage,
  postUrl,
  pageUrl,
  sanitizeHtml,
  renderIndex,
  renderArticle,
  renderNotFound,
  renderUnavailable,
  renderSitemap,
};
