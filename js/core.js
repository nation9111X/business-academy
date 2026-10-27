/* Бизнес как система — ядро: реестр контента, состояние, опыт, разметка уроков */
(function () {
  'use strict';
  const BA = window.BA = {
    modules: [], lessons: {}, order: [], glossary: {}, gl: [], alias: {}, people: {},
    stories: [], decisions: [], library: [], sims: {}, figs: {}, extra: {}, quotes: []
  };

  /* ---------- реестр ---------- */
  // уроки регистрируются из файлов контента; структуру курса задаёт BA.program
  BA.module = function (m) { (m.lessons || []).forEach(function (l) { BA.lessons[l.id] = l; }); };
  BA.lesson = function (l) { BA.lessons[l.id] = l; };
  const deep = {};
  // дополнительные разделы теории: вставка после раздела с заголовком `after` (или в конец)
  BA.deepen = function (id, sections) { deep[id] = (deep[id] || []).concat(sections); };
  function injectDeep(l) {
    const secs = deep[l.id]; if (!secs) return;
    let lines = dedent(l.body || '');
    secs.forEach(function (s) {
      const add = [''].concat(dedent(s.md)).concat(['']);
      // по умолчанию — перед итоговым конспектом урока
      const sum = lines.findIndex(function (x) { return /^:::summary/.test(x.trim()); });
      let at = sum >= 0 ? sum : lines.length;
      if (s.after) {
        const h = lines.findIndex(function (x) { return /^##\s/.test(x.trim()) && x.indexOf(s.after) >= 0; });
        if (h >= 0) { at = lines.findIndex(function (x, k) { return k > h && /^##\s/.test(x.trim()); }); if (at < 0) at = lines.length; if (sum > h && sum < at) at = sum; }
        else if (window.console) console.warn('deepen: heading not found', l.id, s.after);
      }
      lines = lines.slice(0, at).concat(add, lines.slice(at));
    });
    l.body = lines.join('\n');
  }
  BA.stepKey = function (st) {
    if (typeof st === 'string') return st;
    if (st.t === 'dec') return 'dec-' + st.id;
    if (st.t === 'review') return 'rev-' + st.mod;
    if (st.t === 'game') return 'startup';
    if (st.t === 'exam') return 'exam';
    return '';
  };
  BA.stepDone = function (st) {
    if (typeof st === 'string') return !!BA.S.done[st];
    if (st.t === 'dec') return !!BA.S.decisions[st.id];
    if (st.t === 'review') return !!BA.S.done['rev-' + st.mod];
    if (st.t === 'game') return !!(BA.S.game && BA.S.game.played);
    if (st.t === 'exam') return !!(BA.S.exam && BA.S.exam.passed);
    return false;
  };
  BA.stepTitle = function (st) {
    if (typeof st === 'string') return BA.lessons[st] ? BA.lessons[st].title : st;
    if (st.t === 'dec') { const d = BA.decisions.find(function (x) { return x.id === st.id; }); return 'Практикум: ' + (d ? d.title : st.id); }
    if (st.t === 'review') return 'Повторение модуля';
    if (st.t === 'game') return 'Мини-игра «Стартап за 24 месяца»';
    if (st.t === 'exam') return 'Итоговый экзамен';
    return '';
  };
  BA.stepKind = function (st) { return typeof st === 'string' ? 'урок' : ({ dec: 'практикум', review: 'повторение', game: 'игра', exam: 'экзамен' })[st.t]; };
  BA.finalize = function () {
    BA.modules = []; BA.order = []; BA.steps = [];
    let num = 0;
    (BA.program || []).forEach(function (p) {
      p.modules.forEach(function (m) {
        num++; m.num = num; m.part = p.part; m.partTitle = p.title;
        m.lessonIds = []; m.stepList = [];
        m.steps.forEach(function (st) {
          if (typeof st === 'string' && !BA.lessons[st]) { if (window.console) console.warn('lesson missing', st); return; }
          if (typeof st === 'object' && st.t === 'review') st.mod = num;
          if (typeof st === 'object' && st.t === 'dec' && !BA.decisions.some(function (d) { return d.id === st.id; })) return;
          const key = BA.stepKey(st);
          m.stepList.push(st);
          BA.steps.push({ key: key, st: st, mod: m });
          if (typeof st === 'string') {
            const l = BA.lessons[st]; l.module = m.id; l.idx = m.lessonIds.length; m.lessonIds.push(st); BA.order.push(st);
          }
        });
        BA.modules.push(m);
      });
    });
    BA.order.forEach(function (id) { injectDeep(BA.lessons[id]); });
    // какие термины впервые встречаются в каком уроке
    BA.order.forEach(function (id) {
      const l = BA.lessons[id];
      const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g; let mm;
      l.terms = [];
      while ((mm = re.exec(l.body || ''))) {
        const k = BA.termKey(mm[1]);
        if (k && l.terms.indexOf(k) < 0) l.terms.push(k);
        if (k && BA.glossary[k] && !BA.glossary[k].lesson) BA.glossary[k].lesson = id;
      }
    });
  };
  // [key, term, ru, def, ex]
  BA.addTerms = function (cat, arr) {
    normIdx = null;
    arr.forEach(function (t) {
      const o = { key: t[0], term: t[1], ru: t[2] || '', def: t[3], ex: t[4] || '', cat: cat };
      BA.glossary[o.key] = o; BA.gl.push(o);
    });
  };
  BA.aliases = function (map) { Object.assign(BA.alias, map); };
  let normIdx = null;
  BA.termKey = function (s) {
    const raw = String(s).trim().toLowerCase();
    if (BA.glossary[raw]) return raw;
    if (BA.alias[raw]) return BA.alias[raw];
    const k = raw.replace(/ё/g, 'е');
    if (!normIdx) { normIdx = {}; Object.keys(BA.glossary).forEach(function (g) { normIdx[g.replace(/ё/g, 'е')] = g; }); }
    if (normIdx[k]) return normIdx[k];
    if (BA.alias[k]) return BA.alias[k];
    return k;
  };
  BA.person = function (id, name, role, wiki) { BA.people[id] = { id: id, name: name, role: role, wiki: wiki }; };
  BA.sim = function (id, def) { def.id = id; BA.sims[id] = def; };
  BA.fig = function (id, fn) { BA.figs[id] = fn; };

  /* ---------- утилиты ---------- */
  BA.esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  BA.today = function (d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  BA.norm = function (s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); };
  const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
  BA.n = function (v, d) { if (!isFinite(v)) return '∞'; return (d === 2 ? nf2 : d === 1 ? nf1 : nf).format(v); };
  // компактная сумма: 1,2 млн ₽
  BA.money = function (v, cur) {
    cur = cur == null ? '₽' : cur;
    if (!isFinite(v)) return '∞';
    const a = Math.abs(v), s = v < 0 ? '−' : '';
    let out;
    if (a >= 1e12) out = nf1.format(a / 1e12) + ' трлн';
    else if (a >= 1e9) out = nf1.format(a / 1e9) + ' млрд';
    else if (a >= 1e6) out = nf1.format(a / 1e6) + ' млн';
    else if (a >= 1e4) out = nf1.format(a / 1e3) + ' тыс.';
    else out = nf.format(a);
    return s + out + (cur ? ' ' + cur : '');
  };
  BA.pct = function (v, d) { if (!isFinite(v)) return '∞'; return (d === 0 ? nf : nf1).format(v * 100) + '%'; };
  BA.fmt = function (v, f) {
    switch (f) {
      case 'rub': return BA.money(v);
      case 'rub0': return nf.format(Math.round(v)) + ' ₽';
      case 'usd': return BA.money(v, '$');
      case 'pct': return BA.pct(v);
      case 'pct0': return BA.pct(v, 0);
      case 'x': return nf1.format(v) + '×';
      case 'mo': return nf1.format(v) + ' мес.';
      case 'd': return nf.format(v) + ' дн.';
      case 'yr': return nf.format(v) + ' лет';
      case 'n1': return nf1.format(v);
      case 'n2': return nf2.format(v);
      default: return nf.format(v);
    }
  };
  BA.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  BA.plural = function (n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many;
  };
  BA.seeded = function (seed) { let s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  BA.hash = function (str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ---------- события ---------- */
  const ev = {};
  BA.on = function (n, f) { (ev[n] = ev[n] || []).push(f); };
  BA.emit = function (n, d) { (ev[n] || []).forEach(function (f) { try { f(d); } catch (e) { console.error(e); } }); };

  /* ---------- состояние ---------- */
  const KEY = 'ba.state.v1';
  function blank() {
    return { xp: 0, aw: {}, days: {}, done: {}, quiz: {}, probs: {}, sims: {}, tasks: {}, cards: {}, stories: {},
      decisions: {}, ach: {}, exam: {}, game: {}, last: null, theme: null, name: '', seen: {} };
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* хранилище недоступно */ }
    return blank();
  }
  BA.S = load();
  BA.save = function () { try { localStorage.setItem(KEY, JSON.stringify(BA.S)); } catch (e) { /* молча */ } };
  BA.exportState = function () { try { return btoa(unescape(encodeURIComponent(JSON.stringify(BA.S)))); } catch (e) { return ''; } };
  BA.importState = function (code) {
    const o = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (typeof o !== 'object' || o == null || typeof o.xp !== 'number') throw new Error('bad');
    BA.S = Object.assign(blank(), o); BA.save(); BA.emit('state');
  };
  BA.reset = function () { BA.S = blank(); BA.save(); BA.emit('state'); };

  /* ---------- стадии (уровни) ---------- */
  BA.STAGES = [
    { xp: 0, name: 'Идея', note: 'Есть мысль, но нет ни одного доказательства. С этого начинается любая компания.' },
    { xp: 150, name: 'Pre-seed', note: 'Первые деньги — свои, друзей или ангела. Задача: доказать, что проблема реальна.' },
    { xp: 600, name: 'Seed', note: 'Есть продукт и первые клиенты. Ищешь Product-Market Fit.' },
    { xp: 1500, name: 'Раунд A', note: 'Рост доказан цифрами. Строишь повторяемую машину продаж.' },
    { xp: 3000, name: 'Раунд B', note: 'Масштабируешь то, что уже работает: команда, рынки, процессы.' },
    { xp: 4800, name: 'Раунд C', note: 'Борьба за лидерство в категории, новые страны, поглощения.' },
    { xp: 6500, name: 'IPO', note: 'Акции торгуются на бирже. Каждый квартал отчитываешься перед рынком.' },
    { xp: 8500, name: 'Голубая фишка', note: 'Надёжный гигант. Ты видишь бизнес как систему целиком.' }
  ];
  BA.stage = function (xp) {
    xp = xp == null ? BA.S.xp : xp;
    let i = 0; for (let k = 0; k < BA.STAGES.length; k++) if (xp >= BA.STAGES[k].xp) i = k;
    const cur = BA.STAGES[i], nx = BA.STAGES[i + 1] || null;
    return { i: i, cur: cur, next: nx, pct: nx ? (xp - cur.xp) / (nx.xp - cur.xp) : 1, left: nx ? nx.xp - xp : 0 };
  };
  BA.valuation = function (xp) { xp = xp == null ? BA.S.xp : xp; return Math.round(xp * 50000); };

  BA.streak = function () {
    const days = BA.S.days; let n = 0; const d = new Date();
    if (!days[BA.today(d)]) d.setDate(d.getDate() - 1);
    while (days[BA.today(d)]) { n++; d.setDate(d.getDate() - 1); }
    return { n: n, today: !!days[BA.today()] };
  };

  // начислить опыт один раз за ключ
  BA.award = function (key, xp, label) {
    if (BA.S.aw[key]) return false;
    const before = BA.stage().i;
    BA.S.aw[key] = 1; BA.S.xp += xp;
    const t = BA.today(); BA.S.days[t] = (BA.S.days[t] || 0) + xp;
    BA.save();
    BA.toast('<b>+' + xp + ' XP</b> ' + BA.esc(label || ''));
    const after = BA.stage().i;
    BA.emit('xp');
    if (after > before) BA.emit('levelup', after);
    BA.checkAch();
    return true;
  };
  BA.isAwarded = function (key) { return !!BA.S.aw[key]; };

  /* ---------- достижения ---------- */
  function modDone(id) { const m = BA.modules.find(function (x) { return x.id === id; }); return !!m && m.lessonIds.every(function (l) { return BA.S.done[l]; }); }
  function cnt(o) { return Object.keys(o || {}).length; }
  function known() { let k = 0; for (const key in BA.S.cards) if (BA.S.cards[key].box >= 3) k++; return k; }
  BA.ACH = [
    ['first', 'Первая продажа', 'Заверши первый урок', function () { return cnt(BA.S.done) >= 1; }],
    ['perfect', 'Без единой ошибки', 'Пройди тест урока на 100% с первой попытки', function () { return !!BA.S.aw['ach-perfect-flag']; }],
    ['ten', 'Десять уроков', 'Заверши 10 уроков', function () { return cnt(BA.S.done) >= 10; }],
    ['half', 'Экватор', 'Заверши половину курса', function () { return cnt(BA.S.done) >= Math.ceil(BA.order.length / 2); }],
    ['all', 'Вся система', 'Заверши все уроки курса', function () { return BA.order.length && BA.order.every(function (id) { return BA.S.done[id]; }); }],
    ['unit', 'Юнит-экономист', 'Заверши модуль «Юнит-экономика»', function () { return modDone('m6'); }],
    ['fin', 'Финансист', 'Заверши модуль «Финансовый учёт и анализ»', function () { return modDone('m7'); }],
    ['vc', 'Венчурный аналитик', 'Заверши модуль «Инвестиции в стартапы»', function () { return modDone('m11'); }],
    ['lab10', 'Лаборант', 'Попробуй 10 симуляторов', function () { return cnt(BA.S.sims) >= 10; }],
    ['laball', 'Инженер моделей', 'Попробуй все симуляторы', function () { return cnt(BA.S.sims) >= Object.keys(BA.sims).length; }],
    ['words50', 'Словарный запас', 'Выучи 50 терминов в карточках', function () { return known() >= 50; }],
    ['words150', 'Свободно говорю', 'Выучи 150 терминов', function () { return known() >= 150; }],
    ['streak3', 'Привычка', '3 дня подряд', function () { return BA.streak().n >= 3; }],
    ['streak7', 'Неделя дисциплины', '7 дней подряд', function () { return BA.streak().n >= 7; }],
    ['streak30', 'Месяц без пропусков', '30 дней подряд', function () { return BA.streak().n >= 30; }],
    ['calc10', 'Считаю в уме', 'Реши 10 задач на расчёт', function () { return Object.values(BA.S.probs).filter(Boolean).length >= 10; }],
    ['stories10', 'Что бы сделал ты', 'Прими 10 решений в историях компаний', function () { return cnt(BA.S.stories) >= 10; }],
    ['dec', 'Стратег', 'Пройди все сценарии тренажёра решений', function () { return BA.decisions.length && BA.decisions.every(function (d) { return BA.S.decisions[d.id]; }); }],
    ['tasks10', 'Рабочая тетрадь', 'Заполни 10 практических заданий', function () { return Object.keys(BA.S.tasks).filter(function (k) { return BA.S.tasks[k] && BA.S.tasks[k]._saved; }).length >= 10; }],
    ['survivor', 'Выживший', 'Доведи стартап в симуляторе до 24-го месяца', function () { return !!(BA.S.game && BA.S.game.survived); }],
    ['unicorn', 'Большой выход', 'Получи на руки от 500 млн ₽ в игре «Стартап за 24 месяца»', function () { return !!(BA.S.game && BA.S.game.take >= 5e8); }],
    ['exam', 'Выпускник', 'Сдай итоговый экзамен', function () { return !!(BA.S.exam && BA.S.exam.passed); }],
    ['ipo', 'IPO', 'Дойди до стадии IPO', function () { return BA.S.xp >= 6500; }]
  ];
  BA.checkAch = function () {
    let changed = false;
    BA.ACH.forEach(function (a) {
      if (!BA.S.ach[a[0]] && a[3]()) {
        BA.S.ach[a[0]] = Date.now(); changed = true;
        setTimeout(function () { BA.toast('Достижение: <b>' + BA.esc(a[1]) + '</b>'); }, 600);
      }
    });
    if (changed) BA.save();
  };

  /* ---------- тосты ---------- */
  BA.toast = function (html) {
    const box = document.getElementById('toasts'); if (!box) return;
    while (box.children.length >= 4) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; box.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  };

  /* ---------- розетка-гильош (как на ценных бумагах) ---------- */
  const roseCache = {};
  BA.rosette = function (seed, cls) {
    seed = seed || 1;
    if (!roseCache[seed]) {
      const rnd = BA.seeded(seed * 7919);
      let paths = '';
      const layers = [
        { R: 96, r: 7 + Math.floor(rnd() * 5), d: 40 + rnd() * 18, w: .5 },
        { R: 70, r: 5 + Math.floor(rnd() * 4), d: 30 + rnd() * 12, w: .45 },
        { R: 46, r: 3 + Math.floor(rnd() * 3), d: 18 + rnd() * 8, w: .4 }
      ];
      layers.forEach(function (L) {
        const k = (L.R - L.r) / L.r; let p = ''; const N = 900;
        const turns = L.r; // замкнутая кривая
        for (let i = 0; i <= N; i++) {
          const t = i / N * Math.PI * 2 * turns;
          const x = 100 + (L.R - L.r) * Math.cos(t) * .5 + L.d * Math.cos(k * t) * .5;
          const y = 100 + (L.R - L.r) * Math.sin(t) * .5 - L.d * Math.sin(k * t) * .5;
          p += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        paths += '<path d="' + p + '" fill="none" stroke="currentColor" stroke-width="' + L.w + '"/>';
      });
      paths += '<circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width=".4" stroke-dasharray="1.5 2.5"/>';
      roseCache[seed] = paths;
    }
    return '<svg class="' + (cls || '') + '" viewBox="0 0 200 200" aria-hidden="true">' + roseCache[seed] + '</svg>';
  };

  /* ---------- иконки ---------- */
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 14h10"/>',
    scroll: '<path d="M6 3h11a2 2 0 0 1 2 2v12M6 3a2 2 0 0 0-2 2v2h4M6 3a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-2H10"/>',
    fork: '<path d="M6 3v6a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M12 15v6M6 3h0M18 3h0"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l2 2M14.5 4.5C17 2 21 3 21 3s1 4-1.5 6.5L13 16l-5-5zM15 9a1 1 0 1 0 0-.01"/>',
    dict: '<path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14M8 7h8M8 11h5"/>',
    cards: '<rect x="3" y="6" width="14" height="15" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v13"/>',
    fx: '<path d="M4 7h16M4 12h16M4 17h10M17 15l4 4M21 15l-4 4"/>',
    lib: '<path d="M4 3h4v18H4zM10 3h4v18h-4zM16 4l4 1-3 16-4-1z"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    cap: '<path d="M2 9 12 4l10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    fire: '<path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.5-6-4-8 0 2.5-1.5 4-3 4 .5-3-1-6-4-8 0 4-4 7-4 12 0 4.3 3.5 7 8 7z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    key: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>',
    warn: '<path d="M12 3 2 20h20zM12 10v4M12 17v.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    pad: '<rect x="3" y="7" width="18" height="11" rx="5"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/>',
    quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    doc: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8.5 10 6 3h4l2 5M15.5 10 18 3h-4l-2 5M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    ru: '<path d="M4 4h16v16H4z"/><path d="M4 9.5h16M4 14.5h16"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'
  };
  BA.icon = function (n, cls) {
    return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>';
  };

  /* ---------- портреты ---------- */
  function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join(''); }
  BA.portrait = function (id, size) {
    const p = BA.people[id];
    if (!p) return '';
    return '<span class="portrait ' + (size || '') + '" data-wiki="' + BA.esc(p.wiki || '') + '" title="' + BA.esc(p.name) + '">' +
      BA.rosette((BA.hash(id) % 9) + 1, 'r') + '<span class="mono-ini">' + BA.esc(initials(p.name)) + '</span></span>';
  };
  // Фото из Википедии (если сеть и политика страницы позволяют); иначе остаётся монограмма
  const IMG_KEY = 'ba.img.v1';
  let imgCache = {};
  try { imgCache = JSON.parse(localStorage.getItem(IMG_KEY) || '{}'); } catch (e) { imgCache = {}; }
  let wikiBlocked = false;
  BA.loadPortraits = function (root) {
    const els = Array.prototype.slice.call((root || document).querySelectorAll('.portrait[data-wiki]:not([data-done])'));
    if (!els.length) return;
    const need = [];
    els.forEach(function (el) {
      const w = el.getAttribute('data-wiki'); el.setAttribute('data-done', '1');
      if (!w) return;
      if (imgCache[w]) put(el, imgCache[w]);
      else if (imgCache[w] !== 0 && need.indexOf(w) < 0) need.push(w);
    });
    if (!need.length || wikiBlocked) return;
    ['en', 'ru'].forEach(function (lang) {
      const part = need.filter(function (w) { return lang === 'ru' ? w.indexOf('ru:') === 0 : w.indexOf('ru:') !== 0; });
      for (let i = 0; i < part.length; i += 45) fetchBatch(part.slice(i, i + 45), els, lang);
    });
  };
  function put(el, src) {
    if (el.querySelector('img')) return;
    const img = new Image(); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onerror = function () { img.remove(); };
    img.src = src; el.appendChild(img);
  }
  function fetchBatch(titles, els, lang) {
    const clean = function (t) { return t.replace(/^ru:/, '').replace(/_/g, ' '); };
    const url = 'https://' + (lang || 'en') + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=220&titles=' +
      encodeURIComponent(titles.map(clean).join('|'));
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      const map = {};
      const q = j.query || {};
      const back = {};
      titles.forEach(function (t) { back[clean(t)] = t; });
      (q.normalized || []).forEach(function (n) { back[n.to] = back[n.from] || n.from; });
      (q.redirects || []).forEach(function (n) { back[n.to] = back[n.from] || n.from; });
      Object.values(q.pages || {}).forEach(function (pg) {
        const orig = back[pg.title] || pg.title;
        map[orig] = pg.thumbnail ? pg.thumbnail.source : 0;
      });
      titles.forEach(function (t) { imgCache[t] = map[t] == null ? 0 : map[t]; });
      try { localStorage.setItem(IMG_KEY, JSON.stringify(imgCache)); } catch (e) { /* молча */ }
      els.forEach(function (el) { const w = el.getAttribute('data-wiki'); if (imgCache[w]) put(el, imgCache[w]); });
    }).catch(function () { wikiBlocked = true; });
  }

  /* ---------- разметка уроков ---------- */
  const CALLOUT = {
    key: ['Главное', 'key'], example: ['Пример', 'bulb'], story: ['История', 'scroll'], warn: ['Ловушка', 'warn'],
    ru: ['В России', 'ru'], game: ['В геймдеве', 'pad'], talk: ['Как это звучит в разговоре', 'chat'],
    formula: ['Формула', 'fx'], tip: ['Совет практика', 'flag'], case: ['Кейс', 'doc'], mayak: ['Сквозной кейс · «Маяк»', 'target'],
    myth: ['Миф', 'x'], deep: ['Глубже', 'book'], task: ['Попробуй', 'pen'],
    theory: ['Теория', 'book'], science: ['Что показывают исследования', 'chart'], framework: ['Инструмент', 'target'], summary: ['Коротко о главном', 'check'], life: ['Как это выглядит в жизни', 'bulb']
  };
  function inline(s) {
    s = BA.esc(s);
    s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, k, t) {
      const key = BA.termKey(k);
      return '<span class="term" tabindex="0" role="button" data-term="' + BA.esc(key) + '">' + (t || k) + '</span>';
    });
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\[([^\]]+)\]\(#([\w.~-]+)\)/g, '<a href="#$2">$1</a>');
    s = s.replace(/%%(.+?)%%/g, '<span class="f">$1</span>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(«—])\*(?!\s)(.+?)(?!\s)\*(?=[\s.,;:!?)»—]|$)/g, '$1<em>$2</em>');
    s = s.replace(/==(.+?)==/g, '<mark>$1</mark>');
    return s;
  }
  BA.inline = inline;
  function dedent(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    let min = Infinity;
    lines.forEach(function (l) { if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length); });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(min); });
  }
  BA.md = function (src, opt) {
    opt = opt || {};
    const lines = Array.isArray(src) ? src : dedent(src || '');
    let out = '', para = [], i = 0, firstP = !!opt.lead;
    function flush() {
      if (para.length) {
        out += '<p' + (firstP ? ' class="lead-p"' : '') + '>' + inline(para.join(' ')) + '</p>';
        firstP = false; para = [];
      }
    }
    while (i < lines.length) {
      const raw = lines[i], l = raw.trim();
      if (!l) { flush(); i++; continue; }
      let m;
      if ((m = l.match(/^(#{2,3})\s+(.*)$/))) {
        flush();
        const lvl = m[1].length, txt = m[2];
        const id = 'h-' + BA.hash(txt).toString(36);
        out += '<h' + lvl + ' id="' + id + '">' + inline(txt) + '</h' + lvl + '>';
        i++; continue;
      }
      if ((m = l.match(/^:::(\w+)\s*(.*)$/))) {
        flush();
        const type = m[1], title = m[2]; const inner = []; i++;
        while (i < lines.length && lines[i].trim() !== ':::') { inner.push(lines[i]); i++; }
        i++;
        out += callout(type, title, inner);
        continue;
      }
      if (l === '???') {
        flush();
        const inner = []; i++;
        while (i < lines.length && lines[i].trim() !== '???') { inner.push(lines[i].trim()); i++; }
        i++;
        out += check(inner);
        continue;
      }
      if ((m = l.match(/^\{\{(sim|fig|story):([\w-]+)\}\}$/))) {
        flush();
        out += m[1] === 'sim' ? '<div class="sim-mount" data-sim="' + m[2] + '"></div>' : m[1] === 'story' ? '<div class="story-mount" data-story="' + m[2] + '"></div>' : '<div class="fig-mount" data-fig="' + m[2] + '"></div>';
        i++; continue;
      }
      if (l.charAt(0) === '>') {
        flush();
        const q = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '>') { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        out += quote(q);
        continue;
      }
      if (/^[-•]\s+/.test(l)) {
        flush();
        out += '<ul>';
        while (i < lines.length && /^[-•]\s+/.test(lines[i].trim())) { out += '<li>' + inline(lines[i].trim().replace(/^[-•]\s+/, '')) + '</li>'; i++; }
        out += '</ul>'; continue;
      }
      if (/^\d+[.)]\s+/.test(l)) {
        flush();
        out += '<ol>';
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) { out += '<li>' + inline(lines[i].trim().replace(/^\d+[.)]\s+/, '')) + '</li>'; i++; }
        out += '</ol>'; continue;
      }
      if (l.charAt(0) === '|') {
        flush();
        const rows = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '|') {
          const r = lines[i].trim();
          if (!/^\|[\s:|-]+\|$/.test(r)) rows.push(r.replace(/^\||\|$/g, '').replace(/\[\[([^\]|]+)\|/g, '[[$1\u0001').split('|').map(function (c) { return c.trim().replace(/\u0001/g, '|'); }));
          i++;
        }
        out += '<div class="tbl-wrap"><table><thead><tr>' + rows[0].map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
        continue;
      }
      para.push(l); i++;
    }
    flush();
    return out;
  };
  function callout(type, title, inner) {
    const c = CALLOUT[type] || ['', 'bulb'];
    let who = '';
    title = (title || '').replace(/@([\w-]+)/g, function (_, id) { who += BA.portrait(id, 'sm'); return ''; }).trim();
    if (type === 'formula') {
      const fx = [], rest = [];
      inner.forEach(function (l) { if (/^\s*=\s/.test(l)) fx.push(l.replace(/^\s*=\s/, '')); else rest.push(l); });
      return '<div class="callout formula"><div class="tag">' + BA.icon(c[1]) + c[0] + '</div>' + (title ? '<b class="ttl">' + inline(title) + '</b>' : '') +
        '<div class="in">' + fx.map(function (f) { return '<span class="fx">' + inline(f) + '</span>'; }).join('') + BA.md(rest) + '</div></div>';
    }
    if (type === 'deep') {
      return '<details class="callout deep"><summary>' + inline(title || 'Глубже: для тех, кому интересно') + '</summary><div class="in">' + BA.md(inner) + '</div></details>';
    }
    const head = who ? '<div class="who">' + who + '<b class="ttl" style="margin:0">' + inline(title) + '</b></div>' : (title ? '<b class="ttl">' + inline(title) + '</b>' : '');
    return '<div class="callout ' + type + '"><div class="tag">' + BA.icon(c[1]) + c[0] + '</div>' + head + '<div class="in">' + BA.md(inner) + '</div></div>';
  }
  function quote(q) {
    let attr = '', pid = null;
    if (q.length > 1 && /^[—–-]{1,2}\s/.test(q[q.length - 1])) attr = q.pop().replace(/^[—–-]{1,2}\s*/, '');
    attr = attr.replace(/@([\w-]+)/, function (_, id) { pid = id; const p = BA.people[id]; return p ? '<b>' + BA.esc(p.name) + '</b>, ' + BA.esc(p.role) : ''; });
    attr = attr.replace(/^(<b>.*<\/b>, [^,]*),\s*/, '$1 · ');
    const text = inline(q.join(' '));
    return '<figure class="quote' + (pid ? '' : ' noimg') + '">' + (pid ? BA.portrait(pid) : '') +
      '<div><blockquote>' + text + '</blockquote>' + (attr ? '<figcaption>' + attr + '</figcaption>' : '') + '</div></figure>';
  }
  let checkN = 0;
  function check(lines) {
    const q = lines[0]; const opts = []; let why = '';
    lines.slice(1).forEach(function (l) {
      if (l.charAt(0) === '+') opts.push([l.slice(1).trim(), 1]);
      else if (l.charAt(0) === '-') opts.push([l.slice(1).trim(), 0]);
      else if (l.charAt(0) === '=') why += l.slice(1).trim() + ' ';
    });
    const id = 'c' + BA.hash(q).toString(36); checkN++;
    return '<div class="check" data-check="' + id + '"><div class="tag">Проверь себя · +5 XP</div><div class="q">' + inline(q) + '</div><div class="opts">' +
      opts.map(function (o, k) { return '<button class="opt" data-ok="' + o[1] + '"><span class="mk">' + 'АБВГД'[k] + '</span><span>' + inline(o[0]) + '</span></button>'; }).join('') +
      '</div><div class="why" hidden>' + inline(why.trim()) + '</div></div>';
  }
})();
