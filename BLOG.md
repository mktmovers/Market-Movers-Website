# Blog

The blog at [mktmovers.com/blog](https://mktmovers.com/blog/) is rendered on each request by Vercel serverless functions. Article copy comes from BabyLoveGrowth. The rest of the site stays static HTML.

## Environment variable

Set this in the Vercel project for **Preview** and **Production**. It is server-side only.

| Name | Required | Purpose |
| --- | --- | --- |
| `BABYLOVEGROWTH_BLOG_API_KEY` | Yes | Reads articles for this website. Server-side only. Never expose it to the browser, and never commit it. |
| `BABYLOVEGROWTH_BLOG_API_URL` | No | Overrides the API base. Defaults to `https://api.babylovegrowth.ai/api/integrations/v1`. |

In BabyLoveGrowth: Settings → Publishing → Next.js Blog (or API) → Connect, then copy the key into Vercel. The same key is shared with the API, Duda, Lovable, Framer, and Next.js Blog integrations. Regenerating it stops the old key everywhere.

Do not create a `.env` file in this repo. For local `vercel dev`, put the key in `.env.local` (gitignored) or export it in the shell.

After adding or changing the variable, redeploy. A preview that was built before the variable existed will keep serving the “temporarily unavailable” page until then.

## URLs

`vercel.json` keeps `trailingSlash: true`, same as the rest of the site, and rewrites these paths to the functions:

| URL | Function | What it returns |
| --- | --- | --- |
| `/blog/` | `api/blog.js` | Article index, newest first. 12 per page, `?page=2` for the next page. |
| `/blog/<slug>/` | `api/blog-post.js` | Full article. Unknown slugs are HTTP 404. |
| `/blog/sitemap.xml` | `api/blog-sitemap.js` | Sitemap of the index and every article. |

`/blog` and `/blog/<slug>` redirect to the trailing-slash URLs, like every other page. Canonicals use that trailing-slash form, for example `https://mktmovers.com/blog/<slug>/`. `robots.txt` lists the blog sitemap next to the main one, and `sitemap.xml` includes the blog index.

Successful responses send `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`, so a new daily article shows up within about an hour of the first request after it is published, and the CDN can keep serving the previous copy while it refreshes. Missing slugs are cached for about five minutes. Upstream errors are not cached.

If BabyLoveGrowth returns no articles, `/blog/` is HTTP 200 and says articles are coming soon.

## BabyLoveGrowth API

Requests are server-side only, with `X-API-Key` and `User-Agent: MarketMoversBlog/1.0`.

- `GET /articles?limit=&offset=` — summaries (title, slug, excerpt, meta description, hero image, dates). Newest first. `limit` max is 50.
- `GET /articles/by-slug/{slug}` — one article, including `content_html`, `jsonLd`, and `faqJsonLd`. HTTP 404 when the slug is unknown.

The public API guide also documents `GET /articles/{id}` for the full article. This blog uses the slug route from `babylovegrowth-next-js-blog` instead of looking up an id.

The Next.js starter hides articles whose `published` field is false. This blog does not. BabyLoveGrowth’s Lovable guide says that field is false for almost every article on this pull API, and filtering on it produces an empty blog. Every article the list returns is shown.

The sitemap walks the list 50 at a time, at most 1,000 articles, with a short pause between pages so it stays under the published rate limit (about 2 requests per second and 30 per minute). Page views do not call the API again until the CDN cache expires.
