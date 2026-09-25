// <us-map> — US footprint from Natural Earth TopoJSON with client markers.
// Loads its own pinned, hash-verified libs (self-hosted in ./vendor) so mount timing never races.
(function () {
  const BASE = new URL('vendor/', document.currentScript ? document.currentScript.src : location.href).href;
  const LIBS = [
    {
      src: BASE + 'd3.min.js',
      integrity: 'sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i',
      check: () => window.d3
    },
    {
      src: BASE + 'topojson-client.min.js',
      integrity: 'sha384-Ukv1p/xTma6P4/2bY5KzWBw+ydSpXmhCMtyciIQVDJ1RmOxtCYNMF1uXT9T63H67',
      check: () => window.topojson
    }
  ];

  function loadLib(def) {
    if (def.check()) return Promise.resolve();
    const existing = document.querySelector('script[data-uslib="' + def.src + '"]');
    if (existing) return existing.__p;
    const s = document.createElement('script');
    s.src = def.src;
    s.integrity = def.integrity;
        s.setAttribute('data-uslib', def.src);
    s.__p = new Promise((res, rej) => {
      s.onload = res;
      s.onerror = () => rej(new Error('failed to load ' + def.src));
    });
    document.head.appendChild(s);
    return s.__p;
  }

  const MARKERS = [
    { c: 'Washington, DC', ll: [-77.04, 38.91], label: true },
    { c: 'Charlotte, NC', ll: [-80.84, 35.23] },
    { c: 'Atlanta, GA', ll: [-84.39, 33.75], label: true },
    { c: 'Miami, FL', ll: [-80.19, 25.76], label: true, side: 'left' },
    { c: 'Chicago, IL', ll: [-87.63, 41.88], label: true },
    { c: 'Austin, TX', ll: [-97.74, 30.27], label: true },
    { c: 'Los Angeles, CA', ll: [-118.24, 34.05], label: true },
    { c: 'Seattle, WA', ll: [-122.33, 47.61], label: true }
  ];

  let topoPromise = null;

  class USMap extends HTMLElement {
    connectedCallback() {
      if (this.__mounted) return;
      this.__mounted = true;
      this.style.display = 'block';
      this.style.width = '100%';
      this.style.position = 'relative';
      this.render();
      this.__ro = new ResizeObserver(() => this.draw());
      this.__ro.observe(this);
    }
    disconnectedCallback() {
      if (this.__ro) this.__ro.disconnect();
    }
    async render() {
      try {
        await loadLib(LIBS[0]);
        await loadLib(LIBS[1]);
        if (!topoPromise) {
          topoPromise = fetch(BASE + 'countries-110m.json').then((r) => r.json());
        }
        const topo = await topoPromise;
        const fc = window.topojson.feature(topo, topo.objects.countries);
        this.__usa = fc.features.find((f) => f.properties && f.properties.name === 'United States of America');
        this.draw();
      } catch (e) {
        console.warn('us-map: ' + e.message);
      }
    }
    draw() {
      if (!this.__usa || !window.d3) return;
      const w = this.clientWidth || 900;
      if (!w) return;
      const h = Math.round(w * 0.56);
      const accent = this.getAttribute('accent') || '#1c72e6';
      const stroke = this.getAttribute('stroke') || 'rgba(255,255,255,0.30)';
      const fill = this.getAttribute('land') || 'rgba(255,255,255,0.045)';
      const labelColor = this.getAttribute('label-color') || 'rgba(255,255,255,0.55)';
      const showLabels = w > 620;

      const d3 = window.d3;
      const projection = d3.geoAlbersUsa().fitExtent(
        [[w * 0.04, h * 0.06], [w * 0.96, h * 0.94]],
        this.__usa
      );
      const path = d3.geoPath(projection);

      const pts = [];
      MARKERS.forEach((m) => {
        const p = projection(m.ll);
        if (p) pts.push({ m: m, x: p[0], y: p[1] });
      });

      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', String(h));
      svg.style.display = 'block';
      svg.style.overflow = 'visible';

      const defs = document.createElementNS(ns, 'defs');
      defs.innerHTML =
        '<radialGradient id="mmglow"><stop offset="0%" stop-color="' + accent + '" stop-opacity="0.55"/>' +
        '<stop offset="100%" stop-color="' + accent + '" stop-opacity="0"/></radialGradient>' +
        '<style>@keyframes mmpulse{0%{r:3;opacity:.95}50%{r:5;opacity:.5}100%{r:3;opacity:.95}}' +
        '@keyframes mmring{0%{r:4;opacity:.5}100%{r:22;opacity:0}}</style>';
      svg.appendChild(defs);

      const land = document.createElementNS(ns, 'path');
      land.setAttribute('d', path(this.__usa));
      land.setAttribute('fill', fill);
      land.setAttribute('stroke', stroke);
      land.setAttribute('stroke-width', '1');
      land.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(land);

      pts.forEach((p, i) => {
        const glow = document.createElementNS(ns, 'circle');
        glow.setAttribute('cx', p.x); glow.setAttribute('cy', p.y);
        glow.setAttribute('r', '18'); glow.setAttribute('fill', 'url(#mmglow)');
        glow.setAttribute('opacity', '0.5');
        svg.appendChild(glow);

        const ring = document.createElementNS(ns, 'circle');
        ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', accent);
        ring.setAttribute('stroke-width', '1');
        ring.style.animation = 'mmring 3.2s ease-out ' + (i * 0.23).toFixed(2) + 's infinite';
        svg.appendChild(ring);

        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
        dot.setAttribute('r', '3.5'); dot.setAttribute('fill', accent);
        dot.style.animation = 'mmpulse 3.2s ease-in-out ' + (i * 0.23).toFixed(2) + 's infinite';
        svg.appendChild(dot);

        if (showLabels && p.m.label) {
          const left = p.m.side === 'left';
          const t = document.createElementNS(ns, 'text');
          t.setAttribute('x', left ? p.x - 9 : p.x + 9);
          t.setAttribute('y', p.y + 3.5 + (p.m.dy || 0));
          if (left) t.setAttribute('text-anchor', 'end');
          t.setAttribute('fill', labelColor);
          t.setAttribute('font-size', '10.5');
          t.setAttribute('letter-spacing', '0.06em');
          t.setAttribute('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');
          t.textContent = p.m.c.toUpperCase();
          svg.appendChild(t);
        }
      });

      this.innerHTML = '';
      this.appendChild(svg);
    }
  }

  if (!customElements.get('us-map')) customElements.define('us-map', USMap);
})();
