# Market Movers — mktmovers.com

This is the static marketing site built from the Claude Design redesign. It's plain HTML, CSS and JS with no build step and no framework. Every page is fully pre-rendered HTML, which means search engines and AI crawlers can read all of the text.

## Pages

| URL | File |
| --- | --- |
| `/` | `index.html` |
| `/webinar-marketing/` | `webinar-marketing/index.html` |
| `/law-firm-seo/` | `law-firm-seo/index.html` |
| `/case-studies/` | `case-studies/index.html` (overview) |
| `/case-studies/cogent-law/` | `case-studies/cogent-law/index.html` |
| `/case-studies/cybervault/` | `case-studies/cybervault/index.html` |
| `/case-studies/elder-law-college/` | `case-studies/elder-law-college/index.html` (placeholder, noindex) |
| `/case-studies/solkoff-legal/` | `case-studies/solkoff-legal/index.html` (placeholder, noindex) |
| `/course-creators/` | `course-creators/index.html` |
| `/free-tools/` | `free-tools/index.html` |
| `/community/` | `community/index.html` |
| `/privacy/` | `privacy/index.html` (draft for legal review) |

Shared files:
- `assets/css/site.css` holds the brand tokens and all component styles.
- `assets/js/site.js` runs the mobile menu, the FAQ accordion and the stat counters.
- `assets/js/us-map.js` draws the U.S. client map from self-hosted, hash-pinned d3 and topojson files in `assets/js/vendor/`.

## Deploy

Any static host works: Netlify, Vercel, Cloudflare Pages or GitHub Pages. Publish the repository root with no build command. `404.html`, `robots.txt` and `sitemap.xml` are already included.

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

## Still to fill in

- **Group-chat screenshots.** The section is hidden for now; search for `Chat proof:`. Add the three images to `assets/img/`, then remove the `hidden` attribute.
- **Community waitlist link.** Every `data-waitlist` button in `community/index.html` points to `#top`. Swap in the Circle or GHL URL when it exists.
- **Webinar Planner link.** It should be the public `notion.site` link. The current `app.notion.com` link asks visitors to sign in.
- **Privacy policy.** Fill in the [bracketed] items and have counsel review it. It is set to `noindex` and left out of `sitemap.xml` until then; flip both back once it is approved.
- **Map markers.** The cities are illustrative. Edit `MARKERS` in `assets/js/us-map.js`.
- **Client names** in the "Trusted by" strip need to be confirmed.
- **Social share image.** `assets/img/og-image.jpg` (1200×630) is wired into every page's `og:image` / `twitter:image`. Swap the file to change it.
- **Structured data.** Each page has JSON-LD in its `<head>`. The FAQ schema on each page is copied from the on-page FAQ text, so update both together.
