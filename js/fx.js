/* Атмосфера: поле валютных знаков, которое оживает под курсором, и «монетки» при нажатии на главные кнопки */
(function () {
  'use strict';
  const GLYPHS = ['₽', '$', '€', '¥', '£', '₿', '₸', '%', '¢', '₹'];
  const STEP = 48, RADIUS = 170;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  const cv = document.createElement('canvas');
  cv.id = 'bgfx'; cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  const ctx = cv.getContext('2d');
  const base = document.createElement('canvas'), bctx = base.getContext('2d');

  let W = 0, H = 0, dpr = 1, cells = [], col = {}, raf = 0;
  const m = { x: -999, y: -999, tx: -999, ty: -999, a: 0, ta: 0 };

  function hash(i, j) { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; }
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const dark = cs.colorScheme === 'dark' || /dark/.test(document.documentElement.getAttribute('data-theme') || '') ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    col = { ink: cs.getPropertyValue('--ink-3').trim() || '#7A8496', acc: cs.getPropertyValue('--money').trim() || '#35589A', gold: cs.getPropertyValue('--gold').trim() || '#9C7420', baseA: dark ? 0.09 : 0.1 };
  }
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    [cv, base].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cells = [];
    for (let j = 0, y = STEP / 2; y < H + STEP; j++, y += STEP) {
      for (let i = 0, x = STEP / 2 + (j % 2 ? STEP / 2 : 0); x < W + STEP; i++, x += STEP) {
        const h = hash(i, j);
        cells.push({ x: x, y: y, g: GLYPHS[h % GLYPHS.length], r: ((h >>> 8) % 40 - 20) * Math.PI / 180 * 0.6, s: 0.85 + ((h >>> 16) % 30) / 100 });
      }
    }
    readColors(); drawBase(); frame(true);
  }
  function glyph(c2, c, scale, alpha, color, dx, dy) {
    c2.save();
    c2.translate((c.x + dx) * dpr, (c.y + dy) * dpr);
    c2.rotate(c.r);
    c2.globalAlpha = alpha; c2.fillStyle = color;
    c2.font = '500 ' + Math.round(14 * c.s * scale * dpr) + 'px "JetBrains Mono", Consolas, monospace';
    c2.textAlign = 'center'; c2.textBaseline = 'middle';
    c2.fillText(c.g, 0, 0);
    c2.restore();
  }
  function drawBase() {
    bctx.clearRect(0, 0, base.width, base.height);
    cells.forEach(function (c) { glyph(bctx, c, 1, col.baseA, col.ink, 0, 0); });
  }
  function frame(force) {
    raf = 0;
    m.x += (m.tx - m.x) * 0.18; m.y += (m.ty - m.y) * 0.18; m.a += (m.ta - m.a) * 0.12;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    if (m.a > 0.01) {
      cells.forEach(function (c) {
        const dx = c.x - m.x, dy = c.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d > RADIUS) return;
        const k = (1 - d / RADIUS), e = k * k * (3 - 2 * k) * m.a;
        ctx.clearRect((c.x - STEP / 2) * dpr, (c.y - STEP / 2) * dpr, STEP * dpr, STEP * dpr);
        const push = e * 14 / (d || 1);
        glyph(ctx, c, 1 + e * 0.9, col.baseA + e * 0.55, e > 0.55 ? col.gold : col.acc, dx * push, dy * push);
      });
      const g = ctx.createRadialGradient(m.x * dpr, m.y * dpr, 0, m.x * dpr, m.y * dpr, RADIUS * 1.4 * dpr);
      g.addColorStop(0, col.acc); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.06 * m.a; ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1;
    }
    const moving = Math.abs(m.tx - m.x) > 0.3 || Math.abs(m.ty - m.y) > 0.3 || Math.abs(m.ta - m.a) > 0.01;
    if ((moving || force) && !reduce.matches) raf = raf || requestAnimationFrame(function () { frame(false); });
  }
  function kick() { if (!raf && !reduce.matches) raf = requestAnimationFrame(function () { frame(false); }); }
  window.addEventListener('pointermove', function (ev) {
    if (ev.pointerType !== 'mouse' || !fine.matches) return;
    m.tx = ev.clientX; m.ty = ev.clientY;
    if (m.x < -500) { m.x = m.tx; m.y = m.ty; }
    m.ta = 1; kick();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { m.ta = 0; kick(); });
  window.addEventListener('blur', function () { m.ta = 0; kick(); });
  let rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  new MutationObserver(function () { setTimeout(function () { readColors(); drawBase(); frame(true); }, 30); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColors(); drawBase(); frame(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawBase(); frame(true); });
  layout();

  /* монетки при нажатии на главные кнопки */
  document.addEventListener('pointerdown', function (ev) {
    if (reduce.matches) return;
    const b = ev.target.closest && ev.target.closest('.btn:not(.quiet):not(.ghost):not([disabled]), .continue, .sb-next, .opt, .choice');
    if (!b) return;
    const n = 7, color = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'coin-burst'; s.textContent = GLYPHS[(Math.random() * 6) | 0];
      s.style.left = ev.clientX + 'px'; s.style.top = ev.clientY + 'px'; s.style.color = color;
      document.body.appendChild(s);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, dist = 36 + Math.random() * 46;
      const a = s.animate([
        { transform: 'translate(-50%,-50%) scale(.6) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + (Math.cos(ang) * dist).toFixed(1) + 'px), calc(-50% + ' + (Math.sin(ang) * dist).toFixed(1) + 'px)) scale(1.15) rotate(' + ((Math.random() - 0.5) * 120).toFixed(0) + 'deg)', opacity: 0 }
      ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.7,.3,1)' });
      a.onfinish = function () { s.remove(); };
    }
  });
})();
