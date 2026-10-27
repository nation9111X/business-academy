/* Лёгкие SVG-графики без библиотек: линия, столбцы, водопад, стопка */
(function () {
  'use strict';
  const BA = window.BA;
  const PAL = ['var(--money)', 'var(--blue)', 'var(--gold)', 'var(--seal)', 'var(--ink-3)'];
  BA.PAL = PAL;

  function nice(min, max, n) {
    if (min === max) { max = min + 1; }
    const span = max - min, step0 = span / (n || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const f = step0 / mag;
    const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = []; for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo: lo, hi: hi, ticks: ticks };
  }
  BA.nice = nice;
  const e = BA.esc;

  /* Линейный график */
  BA.lineChart = function (o) {
    const W = o.w || 640, H = o.h || 280, L = o.left || 64, R = o.right || 18, T = 16, B = o.xLabel ? 44 : 30;
    let xs = [], ys = [];
    o.series.forEach(function (s) { s.data.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    (o.hlines || []).forEach(function (h) { ys.push(h.y); });
    const xMin = o.xMin != null ? o.xMin : Math.min.apply(null, xs), xMax = o.xMax != null ? o.xMax : Math.max.apply(null, xs);
    let yMin = o.yMin != null ? o.yMin : Math.min(0, Math.min.apply(null, ys)), yMax = o.yMax != null ? o.yMax : Math.max.apply(null, ys);
    if (!isFinite(yMax) || yMax === yMin) yMax = yMin + 1;
    const ny = nice(yMin, yMax, 5); yMin = o.yMin != null ? o.yMin : ny.lo; yMax = o.yMax != null ? o.yMax : ny.hi;
    const yt = o.yMin != null && o.yMax != null ? nice(yMin, yMax, 5).ticks.filter(function (t) { return t >= yMin && t <= yMax; }) : ny.ticks;
    const X = function (v) { return L + (v - xMin) / ((xMax - xMin) || 1) * (W - L - R); };
    const Y = function (v) { return T + (1 - (v - yMin) / ((yMax - yMin) || 1)) * (H - T - B); };
    const yf = o.yFmt || function (v) { return BA.n(v); }, xf = o.xFmt || function (v) { return BA.n(v); };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(o.label || 'график') + '">';
    yt.forEach(function (t) {
      s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>';
      s += '<text class="tm" x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + e(yf(t)) + '</text>';
    });
    if (yMin < 0 && yMax > 0) s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/>';
    const xt = o.xTicks || nice(xMin, xMax, Math.min(8, Math.max(2, Math.round((W - L - R) / 80)))).ticks.filter(function (t) { return t >= xMin && t <= xMax; });
    xt.forEach(function (t) { s += '<text class="tm" x="' + X(t) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + e(xf(t)) + '</text>'; });
    s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
    if (o.xLabel) s += '<text class="t3" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + e(o.xLabel) + '</text>';
    (o.bands || []).forEach(function (b) {
      s += '<rect x="' + X(b.x1) + '" y="' + T + '" width="' + Math.max(0, X(b.x2) - X(b.x1)) + '" height="' + (H - T - B) + '" fill="' + (b.color || 'var(--money-soft)') + '" opacity=".55"/>';
      if (b.label) s += '<text class="t3" x="' + (X(b.x1) + 6) + '" y="' + (T + 14) + '">' + e(b.label) + '</text>';
    });
    o.series.forEach(function (sr, k) {
      const c = sr.color || PAL[k % PAL.length];
      if (!sr.data.length) return;
      const pts = sr.data.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(BA.clamp(p[1], yMin, yMax)).toFixed(1); });
      if (sr.area) {
        const base = Y(Math.max(yMin, 0));
        s += '<path d="M' + X(sr.data[0][0]).toFixed(1) + ',' + base + ' L' + pts.join(' L') + ' L' + X(sr.data[sr.data.length - 1][0]).toFixed(1) + ',' + base + 'Z" fill="' + c + '" opacity=".13"/>';
      }
      if (sr.step) {
        let d = 'M' + pts[0];
        for (let i = 1; i < sr.data.length; i++) d += ' H' + X(sr.data[i][0]).toFixed(1) + ' V' + Y(BA.clamp(sr.data[i][1], yMin, yMax)).toFixed(1);
        s += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (sr.width || 2.2) + '"' + (sr.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
      } else {
        s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + c + '" stroke-width="' + (sr.width || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (sr.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
      }
      if (sr.dots) sr.data.forEach(function (p) { s += '<circle cx="' + X(p[0]) + '" cy="' + Y(BA.clamp(p[1], yMin, yMax)) + '" r="2.6" fill="' + c + '"/>'; });
      if (sr.end !== false && sr.data.length > 1) {
        const last = sr.data[sr.data.length - 1];
        s += '<circle cx="' + X(last[0]) + '" cy="' + Y(BA.clamp(last[1], yMin, yMax)) + '" r="4" fill="var(--sheet)" stroke="' + c + '" stroke-width="2"/>';
      }
    });
    (o.hlines || []).forEach(function (h) {
      if (h.y < yMin || h.y > yMax) return;
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(h.y) + '" y2="' + Y(h.y) + '" stroke="' + (h.color || 'var(--seal)') + '" stroke-width="1.3" stroke-dasharray="4 4"/>';
      if (h.label) s += '<text class="t2" x="' + (W - R - 4) + '" y="' + (Y(h.y) - 6) + '" text-anchor="end" style="fill:' + (h.color || 'var(--seal)') + '">' + e(h.label) + '</text>';
    });
    (o.vlines || []).forEach(function (v) {
      if (v.x < xMin || v.x > xMax) return;
      s += '<line x1="' + X(v.x) + '" x2="' + X(v.x) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + (v.color || 'var(--ink-3)') + '" stroke-width="1.2" stroke-dasharray="3 4"/>';
      if (v.label) s += '<text class="t2" x="' + (X(v.x) + 5) + '" y="' + (T + 12) + '" style="fill:' + (v.color || 'var(--ink-2)') + '">' + e(v.label) + '</text>';
    });
    (o.points || []).forEach(function (p) {
      if (p.x < xMin || p.x > xMax || p.y < yMin || p.y > yMax) return;
      s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="5" fill="' + (p.color || 'var(--gold)') + '" stroke="var(--sheet)" stroke-width="2"/>';
      if (p.label) s += '<text class="t2" x="' + (X(p.x) + (p.anchor === 'end' ? -9 : 9)) + '" y="' + (Y(p.y) - 9) + '" text-anchor="' + (p.anchor || 'start') + '">' + e(p.label) + '</text>';
    });
    s += '</svg>';
    return s;
  };

  /* Вертикальные столбцы */
  BA.barChart = function (o) {
    const W = o.w || 640, H = o.h || 260, L = 64, R = 12, T = 22, B = 46;
    const vals = o.items.map(function (i) { return i.value; });
    const ny = nice(Math.min(0, Math.min.apply(null, vals)), Math.max(0, Math.max.apply(null, vals)), 5);
    const yMin = ny.lo, yMax = ny.hi;
    const Y = function (v) { return T + (1 - (v - yMin) / ((yMax - yMin) || 1)) * (H - T - B); };
    const n = o.items.length, bw = (W - L - R) / n;
    const f = o.fmt || function (v) { return BA.n(v); };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(o.label || 'диаграмма') + '">';
    ny.ticks.forEach(function (t) {
      s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>';
      s += '<text class="tm" x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + e(f(t)) + '</text>';
    });
    o.items.forEach(function (it, k) {
      const x = L + k * bw + bw * .18, w = bw * .64, y0 = Y(0), y1 = Y(it.value);
      const c = it.color || (it.value < 0 ? 'var(--seal)' : 'var(--money)');
      s += '<rect x="' + x + '" y="' + Math.min(y0, y1) + '" width="' + w + '" height="' + Math.max(1, Math.abs(y1 - y0)) + '" fill="' + c + '" rx="2"/>';
      s += '<text class="tm" x="' + (x + w / 2) + '" y="' + (it.value < 0 ? y1 + 14 : y1 - 6) + '" text-anchor="middle" style="fill:var(--ink)">' + e(f(it.value)) + '</text>';
      s += '<text class="t2" x="' + (x + w / 2) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + e(it.label) + '</text>';
      if (it.sub) s += '<text class="tm" x="' + (x + w / 2) + '" y="' + (H - B + 32) + '" text-anchor="middle">' + e(it.sub) + '</text>';
    });
    s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/></svg>';
    return s;
  };

  /* Водопад: items [{label, value, total:true}] */
  BA.waterfall = function (o) {
    const W = o.w || 640, H = o.h || 280, L = 64, R = 12, T = 22, B = 52;
    let run = 0; const bars = [];
    o.items.forEach(function (it) {
      if (it.total) { bars.push({ a: 0, b: it.value, it: it }); run = it.value; }
      else { bars.push({ a: run, b: run + it.value, it: it }); run += it.value; }
    });
    const all = []; bars.forEach(function (b) { all.push(b.a, b.b); });
    const ny = nice(Math.min(0, Math.min.apply(null, all)), Math.max.apply(null, all), 5);
    const Y = function (v) { return T + (1 - (v - ny.lo) / ((ny.hi - ny.lo) || 1)) * (H - T - B); };
    const n = bars.length, bw = (W - L - R) / n, f = o.fmt || function (v) { return BA.n(v); };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(o.label || 'водопад') + '">';
    ny.ticks.forEach(function (t) {
      s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>';
      s += '<text class="tm" x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + e(f(t)) + '</text>';
    });
    bars.forEach(function (b, k) {
      const x = L + k * bw + bw * .14, w = bw * .72;
      const top = Y(Math.max(b.a, b.b)), h = Math.max(1, Math.abs(Y(b.a) - Y(b.b)));
      const c = b.it.total ? (b.b < 0 ? 'var(--seal)' : 'var(--ink-2)') : (b.b >= b.a ? 'var(--money)' : 'var(--seal)');
      s += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" fill="' + c + '" rx="2"' + (b.it.total ? '' : ' opacity=".85"') + '/>';
      if (k < bars.length - 1) s += '<line x1="' + (x + w) + '" x2="' + (x + bw) + '" y1="' + Y(b.b) + '" y2="' + Y(b.b) + '" stroke="var(--ink-3)" stroke-dasharray="2 2"/>';
      const v = b.it.total ? b.b : b.b - b.a;
      s += '<text class="tm" x="' + (x + w / 2) + '" y="' + (top - 6) + '" text-anchor="middle" style="fill:var(--ink)">' + e(f(v)) + '</text>';
      const words = String(b.it.label).split(' ');
      const l1 = words.slice(0, Math.ceil(words.length / 2)).join(' '), l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
      s += '<text class="t2" x="' + (x + w / 2) + '" y="' + (H - B + 17) + '" text-anchor="middle">' + e(words.length > 1 && b.it.label.length > 11 ? l1 : b.it.label) + '</text>';
      if (words.length > 1 && b.it.label.length > 11) s += '<text class="t2" x="' + (x + w / 2) + '" y="' + (H - B + 31) + '" text-anchor="middle">' + e(l2) + '</text>';
    });
    s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/></svg>';
    return s;
  };

  /* Стопка 100%: cats [..], series [{name, color, values:[...]}] */
  BA.stackChart = function (o) {
    const W = o.w || 640, H = o.h || 270, L = 44, R = 12, T = 14, B = 40;
    const n = o.cats.length, bw = (W - L - R) / n;
    const Y = function (v) { return T + (1 - v) * (H - T - B); };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(o.label || 'доли') + '">';
    [0, .25, .5, .75, 1].forEach(function (t) {
      s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text class="tm" x="' + (L - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + Math.round(t * 100) + '%</text>';
    });
    o.cats.forEach(function (c, k) {
      const x = L + k * bw + bw * .2, w = bw * .6; let acc = 0;
      const tot = o.series.reduce(function (a, sr) { return a + (sr.values[k] || 0); }, 0) || 1;
      o.series.forEach(function (sr, j) {
        const v = (sr.values[k] || 0) / tot; if (v <= 0) return;
        const y1 = Y(acc + v), h = Y(acc) - y1;
        s += '<rect x="' + x + '" y="' + y1 + '" width="' + w + '" height="' + Math.max(0, h - 1) + '" fill="' + (sr.color || PAL[j % PAL.length]) + '"/>';
        if (h > 16) s += '<text class="tm" x="' + (x + w / 2) + '" y="' + (y1 + h / 2 + 4) + '" text-anchor="middle" style="fill:var(--sheet);font-weight:600">' + Math.round(v * 100) + '%</text>';
        acc += v;
      });
      s += '<text class="t2" x="' + (x + w / 2) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + e(c) + '</text>';
    });
    s += '</svg>';
    return s;
  };
  BA.legend = function (items) {
    return '<div class="legend">' + items.map(function (it, k) { return '<span><i style="background:' + (it.color || PAL[k % PAL.length]) + '"></i>' + e(it.name) + '</span>'; }).join('') + '</div>';
  };

  /* Схема из прямоугольников и стрелок: {w,h,nodes:[{id,x,y,w,h,t,s,c}], edges:[[from,to,label,cls]]} */
  BA.diagram = function (o) {
    const N = {}; o.nodes.forEach(function (n) { N[n.id] = n; });
    let s = '<svg viewBox="0 0 ' + o.w + ' ' + o.h + '" role="img" aria-label="' + e(o.label || 'схема') + '"><defs><marker id="ar' + (o.mk || '') + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ink-3)"/></marker></defs>';
    function anchor(n, tx, ty) {
      const cx = n.x + n.w / 2, cy = n.y + n.h / 2, dx = tx - cx, dy = ty - cy;
      const sx = Math.abs(dx) / (n.w / 2 + 4), sy = Math.abs(dy) / (n.h / 2 + 4), k = Math.max(sx, sy) || 1;
      return [cx + dx / k, cy + dy / k];
    }
    (o.edges || []).forEach(function (ed) {
      const a = N[ed[0]], b = N[ed[1]]; if (!a || !b) return;
      const p1 = anchor(a, b.x + b.w / 2, b.y + b.h / 2), p2 = anchor(b, a.x + a.w / 2, a.y + a.h / 2);
      let d;
      if (ed[4] === 'curve') { const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2 - 40; d = 'M' + p1[0] + ' ' + p1[1] + ' Q' + mx + ' ' + my + ' ' + p2[0] + ' ' + p2[1]; }
      else d = 'M' + p1[0] + ' ' + p1[1] + ' L' + p2[0] + ' ' + p2[1];
      s += '<path class="edge ' + (ed[3] || '') + '" d="' + d + '" marker-end="url(#ar' + (o.mk || '') + ')"/>';
      if (ed[2]) s += '<text class="t2" x="' + ((p1[0] + p2[0]) / 2 + (ed[5] || 0)) + '" y="' + ((p1[1] + p2[1]) / 2 - 6 + (ed[6] || 0)) + '" text-anchor="middle">' + e(ed[2]) + '</text>';
    });
    o.nodes.forEach(function (n) {
      s += '<rect class="box ' + (n.c || '') + '" x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="' + (n.r != null ? n.r : 6) + '"/>';
      const lines = String(n.t).split('\n');
      const cy = n.y + n.h / 2 - (lines.length - 1) * 8 - (n.s ? 7 : 0);
      lines.forEach(function (ln, k) { s += '<text class="t' + (n.c === 'ink' ? ' on-ink' : '') + '" x="' + (n.x + n.w / 2) + '" y="' + (cy + k * 16 + 4) + '" text-anchor="middle" style="font-weight:600">' + e(ln) + '</text>'; });
      if (n.s) String(n.s).split('\n').forEach(function (ln, k) { s += '<text class="t2' + (n.c === 'ink' ? ' on-ink' : '') + '" x="' + (n.x + n.w / 2) + '" y="' + (cy + lines.length * 16 + 2 + k * 14) + '" text-anchor="middle">' + e(ln) + '</text>'; });
    });
    (o.labels || []).forEach(function (l) { s += '<text class="' + (l.c || 't3') + '" x="' + l.x + '" y="' + l.y + '" text-anchor="' + (l.a || 'middle') + '">' + e(l.t) + '</text>'; });
    s += '</svg>';
    return s;
  };
})();
