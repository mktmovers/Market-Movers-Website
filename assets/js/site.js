// Market Movers — small progressive enhancements. Every page is fully readable without this file.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduce && 'IntersectionObserver' in window;
  if (motion) document.documentElement.classList.add('mm-motion');

  // Run `fn` once for each element the first time it scrolls into view.
  var onceInView = function (els, fn, opts) {
    if (!els.length) return;
    if (!motion) { els.forEach(function (el) { fn(el, 0); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        fn(e.target, batch++);
      });
    }, opts || { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };
  var all = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var belowFold = function (el) { return el.getBoundingClientRect().top > window.innerHeight * 0.92; };

  // Mobile menu (shown under 900px via CSS).
  var header = document.querySelector('.site-header');
  var menuBtn = header && header.querySelector('.menu-btn');
  if (menuBtn) {
    var setOpen = function (open) {
      header.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close ✕' : 'Menu ☰';
    };
    menuBtn.addEventListener('click', function () { setOpen(!header.classList.contains('is-open')); });
    header.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) setOpen(false); });
  }

  // Header compresses slightly once the page is scrolled.
  if (header) {
    var ticking = false;
    var syncHeader = function () {
      header.classList.toggle('is-compact', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(syncHeader); }
    }, { passive: true });
    syncHeader();
  }

  // FAQ accordion: one answer open at a time; clicking the open one closes it.
  document.querySelectorAll('.faq__list').forEach(function (list) {
    var items = list.querySelectorAll('.faq__item');
    items.forEach(function (item) {
      var q = item.querySelector('.faq__q');
      var a = item.querySelector('.faq__a');
      q.addEventListener('click', function () {
        var opening = q.getAttribute('aria-expanded') !== 'true';
        items.forEach(function (other) {
          other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq__a').hidden = true;
        });
        q.setAttribute('aria-expanded', String(opening));
        a.hidden = !opening;
      });
    });
  });

  // Scroll reveals: eyebrow → headline → copy → cards, a 20px rise, staggered 80ms per batch.
  // Elements already on screen at load are left alone so nothing above the fold flashes.
  if (motion) {
    var REVEAL = '.eyebrow, .h2, .lede, .faq__intro, .faq__list, .path-card, .video, .quote, .compare__col, .partner-box, ' +
      '.flagship, .seo, .service, .case, us-map, .member, .inside-card, .tool, .founder-p, .cta__inner > *, ' +
      '.card-title, .big-num';
    var targets = [];
    all('main > section:not(.sec--hero):not(.clients)').forEach(function (sec) {
      sec.querySelectorAll(REVEAL).forEach(function (el) {
        if (el.closest('[data-rv]') || !belowFold(el)) return;
        el.setAttribute('data-rv', '');
        targets.push(el);
      });
    });
    onceInView(targets, function (el, i) {
      el.style.setProperty('--rv', Math.min(i * 0.08, 0.48) + 's');
      el.classList.add('is-in');
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }

  // Signal flows, case-study signals and the final CTA line play once when they come into view.
  onceInView(all('[data-flow], .case, .cta__signal'), function (el) { el.classList.add('is-on'); }, { threshold: 0.45 });

  // Count-up numbers: <span data-count="10000" data-decimals="1" data-final="2">…</span>
  var fmt = function (el, v) {
    var dec = +(el.getAttribute('data-decimals') || 0);
    el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
  };
  var finalText = function (el) { return el.getAttribute('data-final') || Number(el.getAttribute('data-count')).toLocaleString('en-US'); };
  var counters = all('[data-count]');
  if (motion) counters.forEach(function (el) { if (belowFold(el)) fmt(el, 0); });
  onceInView(counters, function (el) {
    if (!motion) { el.textContent = finalText(el); return; }
    var start = performance.now(), dur = 1400, to = +el.getAttribute('data-count');
    var tick = function (now) {
      var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
      if (t >= 1) el.textContent = finalText(el);
      else { fmt(el, to * e); requestAnimationFrame(tick); }
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });

  // SEO demo: type a query, then show the firm winning on Search → Maps → AI answer. Plays once per visit to the section.
  var serp = document.querySelector('[data-serp]');
  if (serp && motion) {
    var q = serp.querySelector('.serp__q');
    var tabs = serp.querySelectorAll('[data-tab]');
    var panes = serp.querySelectorAll('[data-pane]');
    var STEPS = [
      { tab: 'search', q: 'best estate planning attorney near me' },
      { tab: 'maps', q: 'best estate planning attorney near me' },
      { tab: 'ai', q: 'who should I hire for estate planning?' }
    ];
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var show = function (name) {
      panes.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-pane') === name); });
    };
    var type = function (text) {
      serp.classList.add('is-typing');
      q.textContent = '';
      var i = 0;
      return new Promise(function (done) {
        var next = function () {
          q.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(next, 38); else { serp.classList.remove('is-typing'); done(); }
        };
        next();
      });
    };
    var running = false;
    var play = function () {
      if (running) return;
      running = true;
      var chain = Promise.resolve();
      STEPS.forEach(function (s) {
        chain = chain.then(function () {
          tabs.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-tab') === s.tab); });
          if (q.textContent === s.q) return wait(250);
          show(null);
          return wait(200).then(function () { return type(s.q); }).then(function () { return wait(250); });
        }).then(function () { show(s.tab); return wait(2400); });
      });
      chain.then(function () { running = false; });
    };
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) play();
    }, { threshold: 0.5 }).observe(serp);
  }
})();
