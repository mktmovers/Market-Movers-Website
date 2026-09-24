// Market Movers — small progressive enhancements. Every page is fully readable without this file.
(function () {
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

  // Count-up stats: <span data-count="10000" data-decimals="1" data-final="2">…</span>
  var counters = document.querySelectorAll('[data-count]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var fmt = function (el, v) {
      var dec = +(el.getAttribute('data-decimals') || 0);
      el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
    };
    var group = counters[0].closest('[data-count-group]') || counters[0];
    counters.forEach(function (el) { fmt(el, 0); });
    var run = function () {
      var start = performance.now(), dur = 1500;
      var tick = function (now) {
        var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
        counters.forEach(function (el) {
          if (t >= 1) el.textContent = el.getAttribute('data-final') || Number(el.getAttribute('data-count')).toLocaleString('en-US');
          else fmt(el, +el.getAttribute('data-count') * e);
        });
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(); }
    }, { threshold: 0.3 });
    io.observe(group);
  }
})();
