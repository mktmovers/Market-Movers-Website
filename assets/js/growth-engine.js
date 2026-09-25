// Infographics (home growth engine, webinar-page flywheel): play once in view.
// The home graphic also gets lead "particles" moving along its curves.
(function () {
  if (!document.documentElement.classList.contains('mm-motion')) return;

  var playOnce = function (root) {
    var play = function () { root.classList.add('is-play'); };
    if (!('IntersectionObserver' in window)) return play();
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { play(); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(root);
  };

  var engine = document.querySelector('[data-mmg]');
  if (engine) {
    var g = engine.querySelector('[data-mmg-dots]'), NS = 'http://www.w3.org/2000/svg';
    [['mmgL', '#1c72e6'], ['mmgR', '#af9e65']].forEach(function (p, side) {
      for (var i = 0; i < 4; i++) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', '6'); c.setAttribute('fill', p[1]); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '2.5'); c.setAttribute('opacity', '0');
        var begin = (i * 0.55 + side * 0.28).toFixed(2) + 's';
        var m = document.createElementNS(NS, 'animateMotion');
        m.setAttribute('dur', '2.2s'); m.setAttribute('repeatCount', 'indefinite'); m.setAttribute('begin', begin);
        m.setAttribute('calcMode', 'spline'); m.setAttribute('keyTimes', '0;1'); m.setAttribute('keySplines', '.45 0 .55 1');
        var mp = document.createElementNS(NS, 'mpath');
        mp.setAttribute('href', '#' + p[0]); mp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + p[0]);
        m.appendChild(mp);
        var o = document.createElementNS(NS, 'animate');
        o.setAttribute('attributeName', 'opacity'); o.setAttribute('values', '0;1;1;0'); o.setAttribute('keyTimes', '0;.1;.8;1');
        o.setAttribute('dur', '2.2s'); o.setAttribute('repeatCount', 'indefinite'); o.setAttribute('begin', begin);
        c.appendChild(m); c.appendChild(o); g.appendChild(c);
      }
    });
    playOnce(engine);
  }

  var flywheel = document.querySelector('[data-mmf]');
  if (flywheel) playOnce(flywheel);
})();
