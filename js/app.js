/* Бизнес как система — интерфейс: программа, навигация, уроки, практика */
(function () {
  'use strict';
  const BA = window.BA, e = BA.esc, ic = BA.icon;
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  let view, curKey = 'home';

  /* ================= шаги программы ================= */
  function stepIndex(key) { for (let i = 0; i < BA.steps.length; i++) if (BA.steps[i].key === key) return i; return -1; }
  function continueStep() { for (let i = 0; i < BA.steps.length; i++) if (!BA.stepDone(BA.steps[i].st)) return BA.steps[i]; return null; }
  function modOfKey(key) { const i = stepIndex(key); return i >= 0 ? BA.steps[i].mod : null; }
  function modProgress(m) {
    const n = m.stepList.length, d = m.stepList.filter(function (s) { return BA.stepDone(s); }).length;
    return { d: d, n: n, p: n ? d / n : 0 };
  }
  function doneLessons() { return BA.order.filter(function (id) { return BA.S.done[id]; }).length; }
  BA.continueStep = continueStep;

  /* ================= оболочка ================= */
  const TOOLS = [['lab', 'Лаборатория', 'flask'], ['decisions', 'Тренажёр решений', 'fork'], ['stories', 'Истории компаний', 'scroll'], ['glossary', 'Словарь', 'dict'], ['cards', 'Карточки', 'cards'], ['warmup', 'Разминка дня', 'fire'], ['formulas', 'Формулы', 'fx'], ['library', 'Библиотека', 'lib'], ['map', 'Карта бизнеса', 'map']];
  function ring(p) {
    const r = 7, c = 2 * Math.PI * r;
    return '<svg class="ring" viewBox="0 0 18 18"><circle cx="9" cy="9" r="' + r + '" fill="none" stroke="var(--rule)" stroke-width="2.2"/>' +
      (p > 0 ? '<circle cx="9" cy="9" r="' + r + '" fill="none" stroke="var(--money)" stroke-width="2.2" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 9 9)" stroke-linecap="round"/>' : '') + '</svg>';
  }
  const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
  function renderSide() {
    const cs = continueStep(), curMod = modOfKey(curKey) || (cs && cs.mod);
    const closed = BA.S.closedParts || {};
    let h = '<a class="brand" href="#home">' + BA.rosette(3) + '<span><b>Бизнес как система</b><small>Программа уровня MBA</small></span></a>';
    if (cs) h += '<a class="continue" href="#' + cs.key + '"><small>Продолжить · модуль ' + cs.mod.num + '</small><b>' + e(BA.stepTitle(cs.st)) + '</b></a>';
    h += '<div class="nav-group"><a class="nav-link" data-nav="home" href="#home">' + ic('home') + '<span>Главная</span></a>' +
      '<a class="nav-link" data-nav="course" href="#course">' + ic('book') + '<span>Вся программа</span><span class="cnt">' + doneLessons() + '/' + BA.order.length + '</span></a></div>';
    h += '<div class="tree">';
    BA.program.forEach(function (p) {
      const isClosed = closed[p.part] != null ? closed[p.part] : !(curMod && curMod.part === p.part);
      h += '<div class="tree-part' + (isClosed ? ' closed' : '') + '" data-part="' + p.part + '"><button type="button">Часть ' + p.part + ' · ' + e(p.title) + chev + '</button><div class="tree-mods">';
      p.modules.forEach(function (m) {
        const pr = modProgress(m);
        h += '<a class="nav-mod" data-nav="mod-' + m.num + '" href="#mod-' + m.num + '"><span class="n">' + String(m.num).padStart(2, '0') + '</span><span>' + e(m.short || m.title) + '</span>' + ring(pr.p) + '</a>';
        if (curMod && curMod.id === m.id) {
          h += '<div class="tree-steps">' + m.stepList.map(function (st) {
            const key = BA.stepKey(st);
            return '<a href="#' + key + '" class="' + (BA.stepDone(st) ? 'done ' : '') + (key === curKey ? 'cur ' : '') + (typeof st === 'string' ? '' : 'special') + '"><span class="st"></span><span>' + e(BA.stepTitle(st)) + '</span></a>';
          }).join('') + '</div>';
        }
      });
      h += '</div></div>';
    });
    h += '</div>';
    const toolsClosed = BA.S.toolsClosed;
    h += '<div class="nav-group nav-tools' + (toolsClosed ? ' closed' : '') + '"><button type="button" class="nav-toggle" id="toolsBtn" aria-expanded="' + (toolsClosed ? 'false' : 'true') + '"><span>Инструменты и справочник</span>' + chev + '</button><div class="nav-tools-in">' +
      TOOLS.map(function (t) {
        let cnt = '';
        if (t[0] === 'cards') { const due = dueCards().length; if (due) cnt = '<span class="cnt">' + due + '</span>'; }
        return '<a class="nav-link" data-nav="' + t[0] + '" href="#' + t[0] + '">' + ic(t[2]) + '<span>' + t[1] + '</span>' + cnt + '</a>';
      }).join('') + '</div></div>';
    h += '<div class="nav-group"><div class="nav-label">Моё</div><a class="nav-link" data-nav="workbook" href="#workbook">' + ic('pen') + '<span>Рабочая тетрадь</span></a><a class="nav-link" data-nav="profile" href="#profile">' + ic('medal') + '<span>Профиль и награды</span></a>' +
      '<button class="nav-link" type="button" id="setBtnSide">' + ic('sun') + '<span>Настройки чтения</span></button></div>';
    $('#side').innerHTML = h;
    $$('.tree-part > button').forEach(function (b) {
      b.onclick = function () {
        const p = b.parentNode, part = p.getAttribute('data-part');
        p.classList.toggle('closed');
        BA.S.closedParts = BA.S.closedParts || {}; BA.S.closedParts[part] = p.classList.contains('closed'); BA.save();
      };
    });
    $('#toolsBtn').onclick = function () { this.parentNode.classList.toggle('closed'); BA.S.toolsClosed = this.parentNode.classList.contains('closed'); this.setAttribute('aria-expanded', BA.S.toolsClosed ? 'false' : 'true'); BA.save(); };
    $('#setBtnSide').onclick = openSettings;
    markNav();
  }
  function renderChips() {
    const st = BA.stage(), sk = BA.streak();
    $('#chips').innerHTML =
      '<a class="chip streak' + (sk.today ? '' : ' cold') + '" href="#warmup" title="Дней подряд. Сегодня ' + (sk.today ? 'засчитан' : 'ещё не засчитан — пройди разминку') + '">' + ic('fire') + sk.n + '</a>' +
      '<a class="chip xp" href="#profile" title="Опыт и стадия">' + ic('coin') + '<span class="num">' + BA.n(BA.S.xp) + '</span><span class="lbl">XP</span><span class="stage">· ' + e(st.cur.name) + '</span></a>' +
      '<button class="iconbtn theme-btn" id="setBtn" title="Настройки чтения: тема, палитра, размер текста" aria-label="Настройки чтения">' + ic('sun') + '</button>';
    $('#setBtn').onclick = openSettings;
  }
  function markNav() {
    let key = curKey;
    const m = modOfKey(curKey);
    if (m) key = 'mod-' + m.num;
    if (curKey.indexOf('sim-') === 0) key = 'lab';
    if (curKey.indexOf('story-') === 0) key = 'stories';
    if (curKey.indexOf('dec-') === 0 && !m) key = 'decisions';
    $$('[data-nav]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-nav') === key); });
    $$('.tabbar a').forEach(function (a) {
      const k = a.getAttribute('data-tab');
      const grp = { home: ['home'], course: ['course'], lab: ['lab', 'decisions', 'stories', 'map', 'warmup'], glossary: ['glossary', 'cards', 'formulas', 'library'], profile: ['profile', 'workbook'] }[k] || [];
      a.classList.toggle('active', grp.indexOf(key) >= 0 || (k === 'course' && key.indexOf('mod-') === 0));
    });
  }

  /* ================= настройки чтения ================= */
  const PALETTES = [['sapphire', 'Сапфир', ['#F3F5F8', '#35589A', '#1C2433']], ['graphite', 'Графит', ['#F4F4F3', '#2F6E73', '#222322']], ['sepia', 'Сепия', ['#F4EEE2', '#8B5A2B', '#33291F']]];
  function applySettings() {
    const r = document.documentElement, s = BA.S;
    if (s.theme === 'light' || s.theme === 'dark') r.setAttribute('data-theme', s.theme); else r.removeAttribute('data-theme');
    if (s.palette && s.palette !== 'sapphire') r.setAttribute('data-palette', s.palette); else r.removeAttribute('data-palette');
    if (s.fs === 's' || s.fs === 'l' || s.fs === 'xl') r.setAttribute('data-fs', s.fs); else r.removeAttribute('data-fs');
    document.body.classList.toggle('side-collapsed', !!s.sideCollapsed);
  }
  function openSettings() {
    function seg(name, opts, cur) { return '<div class="seg" data-set="' + name + '">' + opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '" class="' + (o[0] === cur ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    const s = BA.S;
    const m = modal('<h3>Настройки чтения</h3>' +
      '<div class="set-group"><b>Тема</b>' + seg('theme', [['auto', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']], s.theme || 'auto') + '</div>' +
      '<div class="set-group"><b>Палитра</b><div class="swatches">' + PALETTES.map(function (p) {
        return '<button type="button" class="swatch' + ((s.palette || 'sapphire') === p[0] ? ' on' : '') + '" data-pal="' + p[0] + '"><i>' + p[2].map(function (c) { return '<span style="background:' + c + '"></span>'; }).join('') + '</i>' + p[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="set-group"><b>Размер текста на всём сайте</b>' + seg('fs', [['s', 'Компактный'], ['m', 'Обычный'], ['l', 'Крупный'], ['xl', 'Очень крупный']], s.fs || 'm') + '<p class="fs-preview">Выручка — ещё не богатство. Так будет выглядеть текст уроков.</p></div>' +
      '<p class="small">Настройки сохраняются в этом браузере.</p>');
    $$('[data-set] button', m).forEach(function (b) {
      b.onclick = function () {
        const k = b.parentNode.getAttribute('data-set'), v = b.getAttribute('data-v');
        BA.S[k] = v === 'auto' ? null : v; BA.save(); applySettings();
        $$('button', b.parentNode).forEach(function (x) { x.classList.toggle('on', x === b); });
      };
    });
    $$('[data-pal]', m).forEach(function (b) {
      b.onclick = function () { BA.S.palette = b.getAttribute('data-pal'); BA.save(); applySettings(); $$('[data-pal]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); };
    });
  }

  /* ================= маршрутизация ================= */
  function curHash() { return decodeURIComponent((location.hash || '').slice(1)) || 'home'; }
  const ROUTES = {};
  function route() {
    const h = curHash();
    curKey = h;
    document.body.classList.remove('nav-open');
    closeTip(); closeModal();
    document.onkeydown = null;
    let fn = ROUTES[h];
    if (!fn) {
      if (BA.lessons[h]) fn = function () { viewLesson(h); };
      else if (/^mod-\d+$/.test(h)) fn = function () { viewModule(+h.slice(4)); };
      else if (/^rev-\d+$/.test(h)) fn = function () { viewReview(+h.slice(4)); };
      else if (h.indexOf('sim-') === 0 && BA.sims[h.slice(4)]) fn = function () { viewSim(h.slice(4)); };
      else if (h.indexOf('story-') === 0) fn = function () { viewStory(h.slice(6)); };
      else if (h.indexOf('dec-') === 0) fn = function () { viewDecision(h.slice(4)); };
      else if (h.indexOf('term-') === 0) fn = function () { viewGlossary(h.slice(5)); };
      else { curKey = 'home'; fn = ROUTES.home; }
    }
    if (stepIndex(h) >= 0) { BA.S.last = h; BA.save(); }
    fn();
    renderSide();
    window.scrollTo(0, 0);
  }
  BA.go = function (h) { if (curHash() === h) route(); else location.hash = h; };

  /* ================= общие куски ================= */
  function pageHead(eyebrow, title, lede) {
    return '<div class="page-head"><div class="eyebrow">' + eyebrow + '</div><h1 class="h-l">' + title + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>';
  }
  function lessonXP(l) {
    return 20 + (l.quiz || []).length * 10 + (l.probs || []).length * 15 + (l.task ? 15 : 0) + ((l.body || '').match(/^\s*\?\?\?\s*$/gm) || []).length / 2 * 5;
  }
  function hydrate(root) {
    $$('.sim-mount', root).forEach(function (el) { BA.renderSim(el, el.getAttribute('data-sim')); });
    $$('.fig-mount', root).forEach(function (el) { const f = BA.figs[el.getAttribute('data-fig')]; if (f) el.outerHTML = f(); else el.remove(); });
    $$('.story-mount', root).forEach(function (el) {
      const s = BA.stories.find(function (x) { return x.id === el.getAttribute('data-story'); });
      if (!s) { el.remove(); return; }
      el.outerHTML = storyEmbed(s, false);
    });
    $$('.story-embed', root).forEach(bindStory);
    BA.loadPortraits(root);
  }
  BA.hydrate = hydrate;
  function stepBar(key) {
    const i = stepIndex(key); if (i < 0) return '';
    const it = BA.steps[i], m = it.mod, prev = BA.steps[i - 1], next = BA.steps[i + 1];
    const k = m.stepList.findIndex(function (s) { return BA.stepKey(s) === key; });
    const nextLbl = next ? (next.mod !== m ? 'Следующий модуль' : 'Дальше') : 'К программе';
    return '<nav class="stepbar" aria-label="Шаги модуля">' +
      (prev ? '<a class="sb-btn sb-prev" href="#' + prev.key + '" title="Назад: ' + e(BA.stepTitle(prev.st)) + ' (клавиша ←)">' + ic('back') + '<span class="sb-t"><small>Назад</small><b>' + e(BA.stepTitle(prev.st)) + '</b></span></a>' : '<span class="sb-btn sb-prev" aria-hidden="true" style="visibility:hidden"></span>') +
      '<div class="mid"><div class="lbl"><span class="mn">Модуль ' + m.num + ' <i>·</i> </span>шаг ' + (k + 1) + ' из ' + m.stepList.length + '</div><div class="dots">' + m.stepList.map(function (s) { const sk = BA.stepKey(s); return '<a href="#' + sk + '" class="' + (BA.stepDone(s) ? 'done ' : '') + (sk === key ? 'cur' : '') + '" title="' + e(BA.stepTitle(s)) + '" aria-label="' + e(BA.stepTitle(s)) + '"></a>'; }).join('') + '</div></div>' +
      '<a class="sb-btn sb-next" href="#' + (next ? next.key : 'course') + '" title="' + (next ? e(BA.stepTitle(next.st)) + ' (клавиша →)' : 'Вся программа') + '"><span class="sb-t"><small>' + nextLbl + '</small><b>' + (next ? e(BA.stepTitle(next.st)) : 'Вся программа') + '</b></span>' + ic('arrow') + '</a>' +
      '</nav>';
  }
  function bindStepKeys(key) {
    const i = stepIndex(key); if (i < 0) return;
    document.onkeydown = function (ev) {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      const t = ev.target; if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
      if ($('#modal')) return;
      if (ev.key === 'ArrowRight' && BA.steps[i + 1]) BA.go(BA.steps[i + 1].key);
      else if (ev.key === 'ArrowLeft' && BA.steps[i - 1]) BA.go(BA.steps[i - 1].key);
    };
  }
  function crumbs(key) {
    const m = modOfKey(key); if (!m) return '';
    return '<a href="#course" style="text-decoration:none">Часть ' + m.part + '</a> · <a href="#mod-' + m.num + '" style="text-decoration:none"><b>Модуль ' + m.num + ' · ' + e(m.title) + '</b></a>';
  }

  /* ================= главная ================= */
  ROUTES.home = function () {
    const st = BA.stage(), sk = BA.streak(), cs = continueStep();
    const doneN = doneLessons();
    const knownN = Object.values(BA.S.cards).filter(function (c) { return c.box >= 3; }).length;
    const serial = 'Серия ' + 'АБВГДЕЖЗ'[st.i] + ' · № ' + String(1000 + BA.S.xp).padStart(6, '0');
    let h = '<div class="wrap">';
    h += '<section class="cert"><div class="cert-body">' +
      '<div class="cert-serial">' + serial + '</div>' +
      '<h1>Бизнес <em>как</em> система</h1>' +
      '<p class="lede">Программа уровня MBA для предпринимателя: ' + BA.modules.length + ' модулей в шести частях, от экономики и клиента до финансов, лидерства, стратегии и капитала. Идёшь по шагам: теория, истории компаний, симуляторы, задачи, повторение.</p>' +
      '<div class="stagebar"><div class="lbl"><span>Стадия: <b>' + e(st.cur.name) + '</b></span><span>' + (st.next ? 'до стадии «' + e(st.next.name) + '» — ' + BA.n(st.left) + ' XP' : 'Максимальная стадия') + '</span></div><div class="bar"><i style="width:' + Math.round(st.pct * 100) + '%"></i></div></div>' +
      '<div class="stats"><div><b>' + doneN + '<span class="muted" style="font-size:.9rem">/' + BA.order.length + '</span></b><span>уроков пройдено</span></div><div><b>' + sk.n + '</b><span>' + BA.plural(sk.n, 'день', 'дня', 'дней') + ' подряд</span></div><div><b>' + knownN + '</b><span>терминов выучено</span></div><div><b>' + BA.modules.filter(function (m) { return modProgress(m).p === 1; }).length + '<span class="muted" style="font-size:.9rem">/' + BA.modules.length + '</span></b><span>модулей закрыто</span></div></div>' +
      '<div class="btnrow">' + (cs ? '<a class="btn" href="#' + cs.key + '">' + (doneN ? 'Продолжить' : 'Начать программу') + ic('arrow') + '</a>' : '') + '<a class="btn quiet" href="#course">Вся программа</a></div>' +
      '</div><div class="cert-rose">' + BA.rosette(5) + '<div class="seal-txt"><div><small>оценка знаний</small><b>' + e(BA.money(BA.valuation())) + '</b><span>' + BA.n(BA.S.xp) + ' XP</span></div></div></div></section>';
    h += '<div class="section"><div class="grid2">';
    if (cs) h += '<a class="card feature link" href="#' + cs.key + '"><div class="eyebrow">Следующий шаг · модуль ' + cs.mod.num + ' · ' + e(cs.mod.title) + '</div><h3>' + e(BA.stepTitle(cs.st)) + '</h3><p>' + e(typeof cs.st === 'string' ? (BA.lessons[cs.st].sub || '') : cs.mod.desc) + '</p><span class="btn small">Открыть</span></a>';
    const wdone = BA.isAwarded('warmup:' + BA.today());
    h += '<a class="card link" href="#warmup"><div class="eyebrow">Разминка дня · +15 XP</div><h3>' + (wdone ? 'Сегодня разминка пройдена' : '5 вопросов за 2 минуты') + '</h3><p>' + (wdone ? 'Серия дней продолжается.' : 'Держит серию дней и не даёт забыть пройденное. Вопросы — из уроков, которые ты прошёл.') + (dueCards().length ? ' Карточек к повторению: ' + dueCards().length + '.' : '') + '</p></a>';
    h += '</div></div>';
    h += '<div class="section"><div class="section-head"><h2>Программа</h2><a href="#course">Подробно →</a></div>';
    BA.program.forEach(function (p) {
      h += '<div class="part-head"><span class="pn">Часть ' + p.part + '</span><h2>' + e(p.title) + '</h2><p>' + e(p.desc) + '</p></div><div class="mods">' + p.modules.map(modCard).join('') + '</div>';
    });
    h += '</div>';
    const day = BA.hash(BA.today());
    const q = BA.quotes.length ? BA.quotes[day % BA.quotes.length] : null;
    if (q) h += '<div class="section"><div class="card"><div class="eyebrow">Цитата дня</div>' + BA.md('> ' + q[0] + '\n> — @' + q[1]) + '</div></div>';
    h += '</div>';
    view.innerHTML = h;
    hydrate(view);
  };
  function modCard(m) {
    const pr = modProgress(m);
    return '<a class="mod-card' + (pr.p === 1 ? ' done' : '') + '" href="#mod-' + m.num + '">' + BA.rosette(m.num + 2, 'rose') +
      '<span class="mnum">' + String(m.num).padStart(2, '0') + '</span><h3>' + e(m.title) + '</h3><p>' + e(m.desc) + '</p>' +
      '<div class="foot"><span>' + pr.d + '/' + pr.n + ' ' + BA.plural(pr.n, 'шаг', 'шага', 'шагов') + '</span><span class="pbar"><i style="width:' + Math.round(pr.p * 100) + '%"></i></span></div></a>';
  }

  /* ================= программа и модуль ================= */
  ROUTES.course = function () {
    const mins = BA.order.reduce(function (a, id) { return a + (BA.lessons[id].min || 12); }, 0);
    let h = '<div class="wrap">' + pageHead('Программа · ' + BA.modules.length + ' модулей · ' + BA.order.length + ' уроков · около ' + Math.round(mins / 60) + ' часов чтения', 'Программа уровня MBA',
      'Шесть частей, как семестры бизнес-школы. Шаги идут по порядку: в уроках — теория, истории компаний, симуляторы и задачи; в конце модуля — практикум и повторение. Любой шаг можно открыть отдельно.');
    BA.program.forEach(function (p) {
      h += '<div class="part-head"><span class="pn">Часть ' + p.part + '</span><h2>' + e(p.title) + '</h2><p>' + e(p.desc) + '</p></div><div class="mods">' + p.modules.map(modCard).join('') + '</div>';
    });
    view.innerHTML = h + '</div>';
  };
  function viewModule(num) {
    const m = BA.modules.find(function (x) { return x.num === num; });
    if (!m) return ROUTES.course();
    const pr = modProgress(m);
    const first = m.stepList.find(function (s) { return !BA.stepDone(s); }) || m.stepList[0];
    let h = '<div class="wrap" style="max-width:900px">' + pageHead('Часть ' + m.part + ' · ' + e(m.partTitle) + ' · <b>модуль ' + m.num + '</b> · ' + pr.d + ' из ' + pr.n + ' шагов', e(m.title), e(m.intro || m.desc));
    h += '<div class="btnrow" style="margin-bottom:18px"><a class="btn" href="#' + BA.stepKey(first) + '">' + (pr.d ? 'Продолжить модуль' : 'Начать модуль') + ic('arrow') + '</a></div>';
    h += '<div class="lesson-list">';
    let li = 0;
    m.stepList.forEach(function (st, k) {
      const key = BA.stepKey(st), d = BA.stepDone(st);
      if (typeof st === 'string') {
        li++;
        const l = BA.lessons[st];
        h += '<a class="lesson-row' + (d ? ' done' : '') + '" href="#' + key + '"><span class="n">' + m.num + '.' + li + '</span><div><b>' + e(l.title) + '</b><span>' + e(l.sub || '') + '</span></div><span class="st">' + (d ? '✓ пройден' : '≈ ' + (l.min || 10) + ' мин · ' + lessonXP(l) + ' XP') + '</span></a>';
      } else {
        h += '<a class="lesson-row' + (d ? ' done' : '') + '" href="#' + key + '"><span class="n">' + ic(st.t === 'dec' ? 'fork' : st.t === 'review' ? 'cards' : st.t === 'game' ? 'rocket' : 'cap') + '</span><div><span class="step-row-kind">' + e(BA.stepKind(st)) + '</span><b>' + e(BA.stepTitle(st)) + '</b></div><span class="st">' + (d ? '✓ пройден' : '') + '</span></a>';
      }
    });
    h += '</div>';
    const prev = BA.modules.find(function (x) { return x.num === num - 1; }), next = BA.modules.find(function (x) { return x.num === num + 1; });
    h += '<div class="nextprev">' + (prev ? '<a href="#mod-' + prev.num + '"><small>← Модуль ' + prev.num + '</small><b>' + e(prev.title) + '</b></a>' : '<span></span>') +
      (next ? '<a class="nx" href="#mod-' + next.num + '"><small>Модуль ' + next.num + ' →</small><b>' + e(next.title) + '</b></a>' : '') + '</div></div>';
    view.innerHTML = h;
  }

  /* ================= урок ================= */
  function viewLesson(id) {
    const l = BA.lessons[id], m = modOfKey(id);
    let h = '<div class="lesson"><article class="article">';
    h += '<header class="lesson-head"><div class="eyebrow">' + crumbs(id) + ' · урок ' + (l.idx + 1) + ' из ' + (m ? m.lessonIds.length : 1) + '</div>' +
      '<h1>' + e(l.title) + '</h1>' + (l.sub ? '<p class="sub">' + e(l.sub) + '</p>' : '') +
      '<div class="meta"><span>' + ic('clock') + '≈ ' + (l.min || 10) + ' мин</span><span>' + ic('coin') + 'до ' + lessonXP(l) + ' XP</span>' + (BA.S.done[id] ? '<span style="color:var(--money)">' + ic('check') + 'пройден</span>' : '') + '</div></header>';
    h += '<div class="prose" id="prose">' + BA.md(l.body || '', { lead: true }) + '</div>';
    if (l.quiz && l.quiz.length) {
      h += '<section class="block" id="quiz"><div class="block-head"><h2>Проверь себя</h2><span class="x">+10 XP за верный ответ с первой попытки</span></div><div>';
      l.quiz.forEach(function (q, i) {
        const qid = id + '-q' + i;
        h += '<div class="quiz-q" data-qid="' + qid + '"><div class="q"><span class="n">' + (i + 1) + '.</span><span>' + BA.inline(q.q) + '</span></div><div class="opts">' +
          q.o.map(function (o, k) { return '<button class="opt" data-k="' + k + '"><span class="mk">' + 'АБВГД'[k] + '</span><span>' + BA.inline(o) + '</span></button>'; }).join('') +
          '</div><div class="why" hidden></div></div>';
      });
      h += '</div><div class="score" id="quizScore" hidden></div></section>';
    }
    if (l.probs && l.probs.length) {
      h += '<section class="block" id="probs"><div class="block-head"><h2>Задачи на расчёт</h2><span class="x">+15 XP за задачу</span></div>';
      l.probs.forEach(function (p, i) {
        const pid = id + '-p' + i, solved = BA.S.probs[pid];
        h += '<div class="prob" data-pid="' + pid + '"><div class="q">' + BA.inline(p.q) + '</div><div class="row"><input class="num" inputmode="decimal" placeholder="Ответ' + (p.unit ? ', ' + e(p.unit) : '') + '" aria-label="Ответ"><button class="btn small">Проверить</button><button class="btn small quiet" data-show>Показать решение</button><span class="res' + (solved ? ' ok' : '') + '">' + (solved ? '✓ решено' : '') + '</span></div><div class="sol" hidden>' + BA.inline(p.sol) + '</div></div>';
      });
      h += '</section>';
    }
    if (l.task) {
      const saved = BA.S.tasks[id] || {};
      h += '<section class="block" id="task"><div class="block-head"><h2>Практика: ' + e(l.task.t) + '</h2><span class="x">+15 XP</span></div><div class="task">' +
        (l.task.d ? '<p class="d">' + BA.inline(l.task.d) + '</p>' : '') +
        (l.task.steps ? '<ol>' + l.task.steps.map(function (s) { return '<li>' + BA.inline(s) + '</li>'; }).join('') + '</ol>' : '') +
        l.task.f.map(function (f, k) { return '<div class="field"><label for="tf-' + id + '-' + k + '">' + e(f) + '</label><textarea id="tf-' + id + '-' + k + '" data-k="' + k + '">' + e(saved['f' + k] || '') + '</textarea></div>'; }).join('') +
        '<div class="btnrow"><button class="btn" id="taskSave">Сохранить в рабочую тетрадь</button><span class="saved" id="taskMsg">' + (saved._saved ? 'Сохранено в тетради' : '') + '</span></div></div></section>';
    }
    if (l.talk && l.talk.length) {
      h += '<section class="block"><div class="block-head"><h2>Как это звучит в разговоре</h2></div><div class="talk-list">' +
        l.talk.map(function (t) { return '<div class="talk-row"><div class="say">' + BA.inline(t[0]) + '</div><div class="mean">' + BA.inline(t[1]) + '</div></div>'; }).join('') + '</div></section>';
    }
    const terms = (l.terms || []).filter(function (k) { return BA.glossary[k]; });
    if (terms.length) h += '<section class="block" id="lterms"><div class="block-head"><h2>Закрепи термины урока</h2><span class="x" style="color:var(--ink-3)">' + terms.length + ' ' + BA.plural(terms.length, 'термин', 'термина', 'терминов') + '</span></div><div id="lcardsRoot"></div></section>';
    if (l.links && l.links.length) h += '<section class="block"><div class="block-head"><h2>Материалы по теме</h2></div><div class="links">' + l.links.map(linkItem).join('') + '</div></section>';
    const done = BA.S.done[id], i = stepIndex(id), next = BA.steps[i + 1];
    h += '<div class="finish"><div><h3>' + (done ? 'Урок пройден' : 'Дочитал? Закрепи результат') + '</h3><p>' + (done ? 'Можно вернуться к тесту, задачам и практике в любой момент.' : '+20 XP за завершение. Термины урока попадут в карточки для повторения.') + '</p></div>' +
      '<button class="btn" id="finishBtn">' + (done ? (next ? 'Следующий шаг' : 'К программе') : 'Завершить урок') + ic('arrow') + '</button></div>';
    h += stepBar(id);
    h += '</article><aside class="toc" id="toc"></aside></div>';
    view.innerHTML = h;
    hydrate(view);
    if (terms.length) lessonCards($('#lcardsRoot'), terms);
    const hs = $$('#prose h2');
    const extra = [['quiz', 'Проверь себя'], ['probs', 'Задачи'], ['task', 'Практика'], ['lterms', 'Термины']].filter(function (x) { return $('#' + x[0]); });
    $('#toc').innerHTML = '<div class="prog">Прочитано <span id="rp">0%</span><div class="bar"><i id="rpb"></i></div></div><nav>' +
      hs.map(function (x) { return '<a href="#' + id + '" data-to="' + x.id + '">' + e(x.textContent) + '</a>'; }).join('') +
      extra.map(function (x) { return '<a href="#' + id + '" data-to="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</nav>';
    $$('#toc a').forEach(function (a) { a.onclick = function (ev) { ev.preventDefault(); const t = document.getElementById(a.getAttribute('data-to')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    bindQuiz(id, l); bindProbs(l); bindTask(id, l); bindStepKeys(id);
    $('#finishBtn').onclick = function () {
      if (!BA.S.done[id]) {
        BA.S.done[id] = Date.now();
        (l.terms || []).forEach(function (k) { if (BA.glossary[k] && !BA.S.cards[k]) BA.S.cards[k] = { box: 0, due: BA.today() }; });
        BA.save();
        BA.award('done:' + id, 20, 'урок «' + l.title + '» пройден');
      }
      BA.go(next ? next.key : 'course');
    };
  }
  function linkItem(k) {
    const t = k[0], icons = { book: 'book', video: 'play', article: 'doc', site: 'globe', course: 'cap', pod: 'chat' };
    const names = { book: 'Книга', video: 'Видео', article: 'Статья', site: 'Сайт', course: 'Курс', pod: 'Подкаст' };
    const inner = '<span class="ic">' + ic(icons[t] || 'doc') + '</span><span><b>' + e(k[1]) + '</b><span>' + names[t] + (k[3] ? ' · ' + e(k[3]) : '') + '</span></span>';
    return k[2] ? '<a class="lnk" href="' + e(k[2]) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="lnk">' + inner + '</div>';
  }
  BA.linkItem = linkItem;

  // карточки терминов прямо в уроке
  function lessonCards(root, keys) {
    let i = 0, flipped = false;
    function draw() {
      if (i >= keys.length) {
        root.innerHTML = '<div class="lcards"><div class="outcome good"><h4>Термины урока пройдены</h4>Они добавлены в общую колоду: карточки сами напомнят о себе в нужный день.</div><div class="btnrow"><button class="btn small quiet" id="lcAgain">Ещё раз</button><a class="btn small quiet" href="#cards">Открыть все карточки</a></div></div>';
        $('#lcAgain', root).onclick = function () { i = 0; flipped = false; draw(); };
        return;
      }
      const g = BA.glossary[keys[i]];
      root.innerHTML = '<div class="lcards"><div class="lcard' + (flipped ? ' back' : '') + '" tabindex="0" role="button" aria-label="Перевернуть карточку">' +
        (flipped ? '<div class="eyebrow">' + e(g.term) + (g.ru ? ' · ' + e(g.ru) : '') + '</div><p>' + BA.inline(g.def) + '</p>' + (g.ex ? '<p class="ex">' + BA.inline(g.ex) + '</p>' : '')
          : '<div class="eyebrow">' + e(g.cat) + '</div><div class="big">' + e(g.term) + '</div><div class="muted small">Вспомни значение и нажми, чтобы проверить</div>') +
        '</div><div class="lcard-nav"><span>' + (i + 1) + ' из ' + keys.length + '</span><span class="btnrow">' + (flipped ? '<button class="btn small quiet" id="lcNo">Повторить позже</button><button class="btn small" id="lcYes">Помню</button>' : '<button class="btn small quiet" id="lcFlip">Показать ответ</button><button class="btn small quiet" id="lcSkip">Пропустить</button>') + '</span></div></div>';
      const card = $('.lcard', root);
      function flip() { flipped = !flipped; draw(); }
      card.onclick = flip; card.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); } };
      if ($('#lcFlip', root)) $('#lcFlip', root).onclick = flip;
      if ($('#lcSkip', root)) $('#lcSkip', root).onclick = function () { i++; draw(); };
      function answer(ok) {
        const c = BA.S.cards[keys[i]] || { box: 0, due: BA.today() };
        if (ok) { c.box = Math.max(c.box, 1); c.due = addDays(INT[c.box]); } else { c.box = 0; c.due = BA.today(); }
        BA.S.cards[keys[i]] = c; BA.save();
        i++; flipped = false; draw();
      }
      if ($('#lcYes', root)) $('#lcYes', root).onclick = function () { answer(true); };
      if ($('#lcNo', root)) $('#lcNo', root).onclick = function () { answer(false); };
    }
    draw();
  }

  function bindQuiz(id, l) {
    if (!l.quiz) return;
    function score() {
      const ids = l.quiz.map(function (q, i) { return id + '-q' + i; });
      const ans = ids.filter(function (q) { return BA.S.quiz[q] != null; });
      if (ans.length < ids.length) return;
      const ok = ids.filter(function (q) { return BA.S.quiz[q] === 1; }).length;
      const box = $('#quizScore'); box.hidden = false;
      box.innerHTML = 'Результат с первой попытки: <b>' + ok + ' из ' + ids.length + '</b>. ' + (ok === ids.length ? 'Идеально.' : ok >= ids.length * .6 ? 'Хорошо. Перечитай пояснения к ошибкам.' : 'Стоит перечитать урок. Пояснения выше подскажут, где провал.');
      if (ok === ids.length && !BA.S.aw['ach-perfect-flag']) { BA.S.aw['ach-perfect-flag'] = 1; BA.save(); }
      if (ok === ids.length) BA.award('perfect:' + id, 20, 'тест без ошибок');
    }
    $$('.quiz-q').forEach(function (box) {
      const qid = box.getAttribute('data-qid'), i = +qid.split('-q').pop(), q = l.quiz[i];
      const prev = BA.S.quiz[qid];
      if (prev != null) reveal(box, q, prev === 1 ? q.a : -1, true);
      $$('.opt', box).forEach(function (b) {
        b.onclick = function () {
          const k = +b.getAttribute('data-k');
          if (BA.S.quiz[qid] == null) {
            BA.S.quiz[qid] = k === q.a ? 1 : 0; BA.save();
            if (k === q.a) BA.award('quiz:' + qid, 10, 'верный ответ');
          }
          reveal(box, q, k, false); score();
        };
      });
    });
    score();
  }
  function reveal(box, q, picked, silent) {
    $$('.opt', box).forEach(function (b) {
      const k = +b.getAttribute('data-k');
      b.classList.remove('ok', 'bad');
      if (k === q.a) b.classList.add('ok'); else if (k === picked) b.classList.add('bad');
    });
    const w = $('.why', box); w.hidden = false;
    w.innerHTML = (silent ? '' : (picked === q.a ? '<b>Верно.</b> ' : '<b>Не совсем.</b> ')) + BA.inline(q.e || '');
  }
  function parseNum(s) { return parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')); }
  function bindProbs(l) {
    $$('.prob').forEach(function (box) {
      const pid = box.getAttribute('data-pid'), p = l.probs[+pid.split('-p').pop()];
      const inp = $('input', box), res = $('.res', box), sol = $('.sol', box);
      let tries = 0;
      function check() {
        const v = parseNum(inp.value);
        if (!isFinite(v)) { res.className = 'res bad'; res.textContent = 'Введи число'; return; }
        const tol = p.tol != null ? p.tol : Math.max(Math.abs(p.a) * 0.02, 0.01);
        tries++;
        if (Math.abs(v - p.a) <= tol) {
          res.className = 'res ok'; res.textContent = '✓ Верно'; sol.hidden = false;
          if (!BA.S.probs[pid]) { BA.S.probs[pid] = 1; BA.save(); BA.award('prob:' + pid, 15, 'задача решена'); }
        } else {
          res.className = 'res bad'; res.textContent = tries >= 2 ? 'Не сходится. Загляни в решение.' : 'Не сходится, попробуй ещё раз' + (p.hint ? ': ' + p.hint : '');
        }
      }
      $('.btn:not([data-show])', box).onclick = check;
      inp.onkeydown = function (ev) { if (ev.key === 'Enter') check(); };
      $('[data-show]', box).onclick = function () { sol.hidden = !sol.hidden; };
    });
  }
  function bindTask(id, l) {
    if (!l.task) return;
    let t;
    $$('#task textarea').forEach(function (ta) {
      ta.oninput = function () {
        const o = BA.S.tasks[id] = BA.S.tasks[id] || {}; o['f' + ta.getAttribute('data-k')] = ta.value;
        clearTimeout(t); t = setTimeout(BA.save, 400);
      };
    });
    $('#taskSave').onclick = function () {
      const o = BA.S.tasks[id] = BA.S.tasks[id] || {};
      const filled = Object.keys(o).filter(function (k) { return k[0] === 'f' && (o[k] || '').trim().length >= 10; }).length;
      if (!filled) { $('#taskMsg').textContent = 'Заполни хотя бы одно поле парой предложений'; $('#taskMsg').style.color = 'var(--seal)'; return; }
      o._saved = Date.now(); BA.save();
      $('#taskMsg').textContent = 'Сохранено в рабочей тетради'; $('#taskMsg').style.color = '';
      BA.award('task:' + id, 15, 'практика выполнена');
      BA.checkAch();
    };
  }

  /* ================= повторение модуля ================= */
  function viewReview(num) {
    const m = BA.modules.find(function (x) { return x.num === num; });
    if (!m) return ROUTES.course();
    const key = 'rev-' + num, done = BA.S.done[key];
    const keys = [];
    m.lessonIds.forEach(function (id) {
      const l = BA.lessons[id], re = /:::key[^\n]*\n([\s\S]*?)\n\s*:::/g; let mm;
      while ((mm = re.exec(l.body || ''))) keys.push([l, mm[1]]);
    });
    let h = '<div class="wrap" style="max-width:820px"><div class="eyebrow" style="margin-bottom:12px">' + crumbs(key) + '</div>' +
      pageHead('Повторение · +30 XP', 'Итоги модуля «' + e(m.title) + '»', 'Перечитай главные мысли, ответь на вопросы по всему модулю и прогони термины. Вопросы каждый раз немного другие.');
    if (keys.length) h += '<section class="block" style="margin-top:10px"><div class="block-head"><h2>Главные мысли модуля</h2></div><div class="review-keys">' + keys.map(function (k) {
      return '<div class="callout key"><div class="tag">' + ic('key') + e(k[0].title) + '</div><div class="in">' + BA.md(k[1]) + '</div></div>';
    }).join('') + '</div></section>';
    h += '<section class="block"><div class="block-head"><h2>Вопросы по модулю</h2><span class="x">' + (done ? '✓ пройдено' : '+30 XP') + '</span></div><div id="revq"></div></section>';
    const terms = [];
    m.lessonIds.forEach(function (id) { (BA.lessons[id].terms || []).forEach(function (t) { if (BA.glossary[t] && terms.indexOf(t) < 0) terms.push(t); }); });
    if (terms.length) h += '<section class="block"><div class="block-head"><h2>Термины модуля</h2><span class="x" style="color:var(--ink-3)">' + terms.length + '</span></div><div id="revCards"></div></section>';
    h += stepBar(key) + '</div>';
    view.innerHTML = h;
    hydrate(view);
    bindStepKeys(key);
    const pool = [];
    m.lessonIds.forEach(function (id) { (BA.lessons[id].quiz || []).forEach(function (q) { pool.push({ q: q, lesson: id }); }); });
    const qs = pick(pool, Math.min(8, pool.length));
    runQuiz($('#revq'), qs, {
      label: 'Повторение', done: function (ok, n) {
        if (!BA.S.done[key]) { BA.S.done[key] = Date.now(); BA.save(); }
        BA.award('rev:' + num, 30, 'повторение модуля ' + num);
        const i = stepIndex(key), next = BA.steps[i + 1];
        $('#revq').innerHTML = '<div class="outcome ' + (ok >= n * .75 ? 'good' : 'mid') + '"><h4>' + ok + ' из ' + n + '</h4>' + (ok >= n * .75 ? 'Модуль усвоен. Можно двигаться дальше.' : 'Засчитано. Вернись к урокам, где были ошибки, — ссылки под вопросами.') + '</div><div class="btnrow" style="margin-top:12px">' + (next ? '<a class="btn" href="#' + next.key + '">Дальше: ' + e(BA.stepTitle(next.st)) + ic('arrow') + '</a>' : '') + '<a class="btn quiet" href="#' + key + '">Пройти ещё раз</a></div>';
        renderSide();
      }
    });
    if (terms.length) lessonCards($('#revCards'), pick(terms, Math.min(15, terms.length)));
  }

  /* ================= термины: подсказка и окно ================= */
  let tipEl;
  function showTip(el) {
    const g = BA.glossary[el.getAttribute('data-term')]; if (!g) return;
    tipEl.innerHTML = '<b>' + e(g.term) + '</b>' + (g.ru ? '<i>' + e(g.ru) + '</i><br>' : '') + e(g.def);
    tipEl.hidden = false;
    const r = el.getBoundingClientRect(), tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2; x = BA.clamp(x, 10, innerWidth - tw - 10);
    let y = r.top - th - 10; if (y < 70) y = r.bottom + 10;
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  function closeTip() { if (tipEl) tipEl.hidden = true; }
  function modal(html, cls) {
    closeModal();
    const s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim';
    const m = document.createElement('div'); m.className = 'modal ' + (cls || ''); m.id = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<button class="iconbtn x" aria-label="Закрыть">' + ic('x') + '</button>' + html;
    document.body.appendChild(s); document.body.appendChild(m);
    s.onclick = closeModal; $('.x', m).onclick = closeModal;
    const f = $('button:not(.x), a', m) || $('.x', m); f.focus();
    return m;
  }
  function closeModal() { const a = $('#scrim'), b = $('#modal'); if (a) a.remove(); if (b) b.remove(); }
  BA.modal = modal; BA.closeModal = closeModal;
  function termModal(key) {
    const g = BA.glossary[key];
    if (!g) return;
    const c = BA.S.cards[key];
    const m = modal('<div class="eyebrow">' + e(g.cat) + '</div><h3>' + e(g.term) + '</h3>' + (g.ru ? '<p><i>' + e(g.ru) + '</i></p>' : '') + '<p style="color:var(--ink)">' + BA.inline(g.def) + '</p>' +
      (g.ex ? '<p><b>Пример.</b> ' + BA.inline(g.ex) + '</p>' : '') +
      '<div class="btnrow">' + (g.lesson && BA.lessons[g.lesson] ? '<a class="btn small quiet" href="#' + g.lesson + '">Урок: ' + e(BA.lessons[g.lesson].title) + '</a>' : '') +
      '<button class="btn small" id="tLearn">' + (c ? (c.box >= 3 ? 'Уже выучен ✓' : 'В карточках · повторить') : 'Добавить в карточки') + '</button></div>');
    $('#tLearn', m).onclick = function () {
      if (!BA.S.cards[key]) { BA.S.cards[key] = { box: 0, due: BA.today() }; BA.save(); BA.toast('Термин добавлен в карточки'); renderSide(); }
      closeModal();
    };
  }
  BA.termModal = termModal;

  /* ================= лаборатория ================= */
  ROUTES.lab = function () {
    const groups = {};
    Object.values(BA.sims).forEach(function (s) { if (s.hidden) return; const g = s.group || 'Разное'; (groups[g] = groups[g] || []).push(s); });
    const n = Object.values(BA.sims).filter(function (s) { return !s.hidden; }).length;
    let h = '<div class="wrap">' + pageHead('Лаборатория · ' + n + ' симуляторов', 'Все модели в одном месте',
      'Каждый симулятор уже встроен в свой урок программы. Здесь они собраны для быстрого доступа и повторения. +5 XP за первое открытие каждого.');
    Object.keys(groups).forEach(function (g) {
      h += '<div class="section"><div class="section-head"><h2>' + e(g) + '</h2></div><div class="grid3">' +
        groups[g].map(function (s) { return '<a class="card link" href="#sim-' + s.id + '"><div class="eyebrow">' + (BA.S.sims[s.id] ? '<b>✓ открыт</b>' : 'Симулятор') + '</div><h3>' + e(s.title) + '</h3><p>' + e(s.desc || '') + '</p></a>'; }).join('') + '</div></div>';
    });
    view.innerHTML = h + '</div>';
  };
  function viewSim(id) {
    const s = BA.sims[id];
    let h = '<div class="wrap" style="max-width:1000px"><div class="page-head"><div class="eyebrow"><a href="#lab" style="text-decoration:none">← Лаборатория</a></div></div><div class="sim-mount" data-sim="' + id + '"></div>';
    if (s.lesson && BA.lessons[s.lesson]) h += '<div class="section"><a class="card link" href="#' + s.lesson + '"><div class="eyebrow">Теория к симулятору</div><h3>' + e(BA.lessons[s.lesson].title) + '</h3><p>' + e(BA.lessons[s.lesson].sub || '') + '</p></a></div>';
    view.innerHTML = h + '</div>';
    hydrate(view);
  }

  /* ================= истории ================= */
  function storyLessonOf(id) {
    for (let i = 0; i < BA.order.length; i++) if ((BA.lessons[BA.order[i]].body || '').indexOf('{{story:' + id + '}}') >= 0) return BA.order[i];
    return null;
  }
  function storyCard(s, eyebrow) {
    return '<a class="story-card" href="#story-' + s.id + '"><div class="top-row">' + (s.people || []).slice(0, 2).map(function (p) { return BA.portrait(p, 'sm'); }).join('') +
      '<div><div class="eyebrow">' + e(eyebrow || s.country || '') + '</div><span class="yr">' + e(s.years || '') + '</span></div></div><h3>' + e(s.company) + '</h3><p>' + e(s.hook) + '</p>' +
      '<div class="tags">' + (s.tags || []).map(function (t) { return '<span class="badge">' + e(t) + '</span>'; }).join('') + (BA.S.stories[s.id] != null ? '<span class="badge g">решено</span>' : '') + '</div></a>';
  }
  function storyEmbed(s, full) {
    let h = '<div class="story-embed" data-sid="' + s.id + '"><div class="se-head"><div class="ppl">' + (s.people || []).map(function (p) { return BA.portrait(p, 'sm'); }).join('') + '</div>' +
      '<div style="min-width:0;flex:1"><div class="eyebrow">История компании · ' + e(s.country || '') + ' · ' + e(s.years || '') + '</div><h4>' + e(s.company) + '</h4></div>' +
      (full ? '' : '<a class="btn small quiet" href="#story-' + s.id + '">Страница истории</a>') + '</div><div class="se-body">' +
      '<p class="lede" style="margin:0;font-size:1.08rem">' + e(s.hook) + '</p>' +
      (s.facts ? '<div class="factrow">' + s.facts.map(function (f) { return '<div><b>' + e(f[0]) + '</b><span>' + e(f[1]) + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="prose">' + BA.md(s.story) + '</div>';
    if (s.decision) {
      h += '<div class="se-q">Что бы сделал ты? <span class="muted small">+10 XP</span></div><div class="se-q" style="font-weight:400">' + BA.inline(s.decision.q) + '</div><div class="choices">' +
        s.decision.o.map(function (o, k) { return '<button class="choice" data-k="' + k + '">' + BA.inline(o[0]) + '</button>'; }).join('') + '</div><div class="se-out"></div>';
    }
    h += '<div class="se-after"' + (s.decision && BA.S.stories[s.id] == null ? ' hidden' : '') + '>' +
      (s.lesson ? '<div class="callout key"><div class="tag">' + ic('key') + 'Урок для предпринимателя</div><div class="in">' + BA.md(s.lesson) + '</div></div>' : '') + '</div>';
    return h + '</div></div>';
  }
  function bindStory(el) {
    const s = BA.stories.find(function (x) { return x.id === el.getAttribute('data-sid'); });
    if (!s || !s.decision) return;
    function show(k) {
      $$('.choice', el).forEach(function (b) {
        b.disabled = true; const kk = +b.getAttribute('data-k');
        b.style.borderColor = s.decision.o[kk][1] ? 'var(--money)' : (kk === k ? 'var(--seal)' : '');
        b.style.background = s.decision.o[kk][1] ? 'var(--money-soft)' : (kk === k ? 'var(--seal-soft)' : '');
      });
      const o = s.decision.o[k];
      $('.se-out', el).innerHTML = '<div class="outcome ' + (o[1] ? 'good' : 'mid') + '"><h4>' + (o[1] ? 'Так и было' : 'В реальности решили иначе') + '</h4>' + BA.inline(o[2] || '') + '<div style="margin-top:10px">' + BA.inline(s.decision.real) + '</div></div>';
      $('.se-after', el).hidden = false;
    }
    if (BA.S.stories[s.id] != null) show(BA.S.stories[s.id]);
    $$('.choice', el).forEach(function (b) {
      b.onclick = function () {
        const k = +b.getAttribute('data-k');
        if (BA.S.stories[s.id] == null) { BA.S.stories[s.id] = k; BA.save(); BA.award('story:' + s.id, 10, 'решение в истории'); BA.checkAch(); }
        show(k);
      };
    });
  }
  ROUTES.stories = function () {
    let h = '<div class="wrap">' + pageHead('Истории компаний · ' + BA.stories.length, 'Как это было на самом деле',
      'Все истории встроены в уроки программы — ты встретишь их по ходу курса. Здесь они собраны вместе: можно перечитать или пройти заранее.');
    h += '<div class="story-grid">' + BA.stories.map(function (s) { return storyCard(s); }).join('') + '</div></div>';
    view.innerHTML = h; hydrate(view);
  };
  function viewStory(id) {
    const s = BA.stories.find(function (x) { return x.id === id; });
    if (!s) return ROUTES.stories();
    const lid = storyLessonOf(id);
    let h = '<div class="wrap" style="max-width:860px"><div class="eyebrow" style="margin-bottom:14px"><a href="#stories" style="text-decoration:none">← Все истории</a>' + (lid ? ' · из урока <a href="#' + lid + '" style="text-decoration:none">«' + e(BA.lessons[lid].title) + '»</a>' : '') + '</div>';
    h += storyEmbed(s, true);
    if (s.timeline) h += '<section class="block"><div class="block-head"><h2>Хронология</h2></div><div class="timeline">' + s.timeline.map(function (t) { return '<div><b>' + e(t[0]) + '</b>' + BA.inline(t[1]) + '</div>'; }).join('') + '</div></section>';
    if (s.terms) h += '<section class="block"><div class="block-head"><h2>Термины истории</h2></div><div class="terms-grid">' + s.terms.filter(function (k) { return BA.glossary[k]; }).map(function (k) { return '<button class="tpill" data-term="' + e(k) + '">' + e(BA.glossary[k].term) + '</button>'; }).join('') + '</div></section>';
    if (s.links) h += '<section class="block"><div class="block-head"><h2>Почитать и посмотреть</h2></div><div class="links">' + s.links.map(linkItem).join('') + '</div></section>';
    const i = BA.stories.indexOf(s), nx = BA.stories[(i + 1) % BA.stories.length];
    h += '<div class="nextprev"><span></span><a class="nx" href="#story-' + nx.id + '"><small>Следующая история →</small><b>' + e(nx.company) + '</b></a></div></div>';
    view.innerHTML = h; hydrate(view);
  }

  /* ================= тренажёр решений ================= */
  ROUTES.decisions = function () {
    let h = '<div class="wrap" style="max-width:1000px">' + pageHead('Тренажёр решений · ' + BA.decisions.length + ' сценариев', 'Ты — основатель. Решай.',
      'Сценарии стоят в программе как практикумы в конце модулей. Здесь все они собраны вместе. +30 XP за прохождение.');
    h += '<div class="grid2">' + BA.decisions.map(function (d) {
      const r = BA.S.decisions[d.id], m = modOfKey('dec-' + d.id);
      return '<a class="card link" href="#dec-' + d.id + '"><div class="eyebrow">' + (r ? '<b>✓ пройден · ' + e(r) + '</b>' : e(d.tag || 'Сценарий') + (m ? ' · модуль ' + m.num : '')) + '</div><h3>' + e(d.title) + '</h3><p>' + e(d.sub) + '</p></a>';
    }).join('') + '</div></div>';
    view.innerHTML = h;
  };
  function viewDecision(id) {
    const d = BA.decisions.find(function (x) { return x.id === id; });
    if (!d) return ROUTES.decisions();
    const key = 'dec-' + id, inProg = stepIndex(key) >= 0;
    let st = { at: d.first || 's1', m: Object.assign({}, d.metrics), path: [] };
    function fmtM(k, v) { const f = (d.fmt || {})[k] || 'rub'; return BA.fmt(v, f); }
    function draw(prevM) {
      let h = '<div class="wrap" style="max-width:820px"><div class="eyebrow" style="margin-bottom:14px">' + (inProg ? crumbs(key) + ' · практикум' : '<a href="#decisions" style="text-decoration:none">← Все сценарии</a>') + '</div>' +
        '<div class="page-head"><div class="eyebrow">' + e(d.tag || 'Сценарий') + '</div><h1 class="h-l">' + e(d.title) + '</h1></div>';
      h += '<div class="ledger">' + Object.keys(st.m).map(function (k) {
        const v = st.m[k], p = prevM ? prevM[k] : v, cls = v > p ? 'up' : v < p ? 'down' : '';
        return '<div><small>' + e((d.labels || {})[k] || k) + '</small><b class="' + cls + '">' + e(fmtM(k, v)) + '</b></div>';
      }).join('') + '</div>';
      const node = d.steps[st.at];
      if (node) {
        h += '<div class="dec-stage" style="margin-top:22px">' + (st.note ? '<div class="outcome">' + BA.inline(st.note) + '</div>' : '') +
          '<div class="dec-step prose">' + BA.md(node.t) + '</div><div class="choices">' +
          node.c.map(function (c, k) { return '<button class="choice" data-k="' + k + '">' + BA.inline(c.t) + (c.s ? '<small>' + BA.inline(c.s) + '</small>' : '') + '</button>'; }).join('') + '</div></div>';
      } else {
        const end = d.ends[st.at] || { tone: 'mid', h: 'Конец', t: '' };
        h += '<div class="dec-stage" style="margin-top:22px">' + (st.note ? '<div class="outcome">' + BA.inline(st.note) + '</div>' : '') +
          '<div class="outcome ' + end.tone + '"><h4>' + e(end.h) + '</h4><div class="prose" style="font-size:1rem">' + BA.md(end.t) + '</div></div>' +
          (d.debrief ? '<div class="callout key"><div class="tag">' + ic('key') + 'Разбор</div><div class="in">' + BA.md(d.debrief) + '</div></div>' : '') +
          '<div class="btnrow"><button class="btn quiet" id="decAgain">Пройти ещё раз</button></div></div>';
        if (!BA.S.decisions[id]) { BA.S.decisions[id] = end.h; BA.save(); }
        BA.award('dec:' + id, 30, 'сценарий пройден');
        BA.checkAch();
      }
      h += (inProg ? stepBar(key) : '') + '</div>';
      view.innerHTML = h;
      if (inProg) { bindStepKeys(key); renderSide(); }
      $$('.choice', view).forEach(function (b) {
        b.onclick = function () {
          const c = node.c[+b.getAttribute('data-k')], before = Object.assign({}, st.m);
          Object.keys(c.fx || {}).forEach(function (k) { const v = c.fx[k]; st.m[k] = typeof v === 'string' && v[0] === '=' ? +v.slice(1) : (st.m[k] || 0) + v; });
          st.note = c.n || ''; st.at = c.go; st.path.push(c.t);
          draw(before); window.scrollTo({ top: 0, behavior: 'smooth' });
        };
      });
      const again = $('#decAgain'); if (again) again.onclick = function () { st = { at: d.first || 's1', m: Object.assign({}, d.metrics), path: [] }; draw(); };
    }
    draw();
  }

  /* ================= стартап-игра ================= */
  ROUTES.startup = function () {
    view.innerHTML = '<div class="wrap"><div class="eyebrow" style="margin-bottom:12px">' + crumbs('startup') + '</div>' + pageHead('Мини-игра · 24 хода', 'Стартап за 24 месяца',
      'Ты запускаешь B2B-сервис по подписке. Каждый ход — месяц: решаешь, сколько тратить на рекламу, кого нанимать, какую ставить цену и брать ли деньги инвестора. Цель — дожить до 24-го месяца с максимальной стоимостью своей доли. Здесь сходится почти всё из программы: юнит-экономика, runway, удержание, размытие и условия сделок.') +
      '<div id="gameRoot"></div>' + stepBar('startup') + '</div>';
    BA.game.render($('#gameRoot'));
    bindStepKeys('startup');
  };

  /* ================= словарь ================= */
  function viewGlossary(focus) {
    const cats = ['Все'].concat(Array.from(new Set(BA.gl.map(function (g) { return g.cat; }))));
    let cat = 'Все', q = '';
    view.innerHTML = '<div class="wrap">' + pageHead('Словарь · ' + BA.gl.length + ' терминов', 'Язык предпринимателей и инвесторов',
      'Каждый термин — с понятным определением и примером. Термины из пройденных уроков сами попадают в карточки.') +
      '<div class="gl-tools"><input class="inp" id="glq" placeholder="Найти термин: CAC, оценка, оборотный капитал…" aria-label="Поиск по словарю"><div class="cats" id="glc"></div></div><div class="gl-list" id="gll"></div></div>';
    function draw() {
      $('#glc').innerHTML = cats.map(function (c) { return '<button class="' + (c === cat ? 'on' : '') + '">' + e(c) + '</button>'; }).join('');
      $$('#glc button').forEach(function (b) { b.onclick = function () { cat = b.textContent; draw(); }; });
      const nq = BA.norm(q);
      const list = BA.gl.filter(function (g) { return (cat === 'Все' || g.cat === cat) && (!nq || BA.norm(g.term + ' ' + g.ru + ' ' + g.def).indexOf(nq) >= 0); })
        .sort(function (a, b) { return a.term.localeCompare(b.term, 'ru'); });
      let h = '', letter = '';
      list.forEach(function (g) {
        const L = g.term[0].toUpperCase();
        if (!nq && L !== letter) { letter = L; h += '<div class="letter">' + e(L) + '</div>'; }
        const c = BA.S.cards[g.key];
        h += '<div class="gl-item' + (g.key === focus ? ' hl' : '') + '" id="g-' + e(g.key.replace(/[^\wа-я]/gi, '_')) + '"><div class="hd"><b>' + e(g.term) + '</b>' + (g.ru ? '<i>' + e(g.ru) + '</i>' : '') + '</div><p>' + BA.inline(g.def) + '</p>' + (g.ex ? '<p class="ex">' + BA.inline(g.ex) + '</p>' : '') +
          '<div class="act">' + (g.lesson && BA.lessons[g.lesson] ? '<a href="#' + g.lesson + '">→ урок</a>' : '') + '<button data-add="' + e(g.key) + '">' + (c ? (c.box >= 3 ? '✓ выучен' : '✓ в карточках') : '+ в карточки') + '</button></div></div>';
      });
      $('#gll').innerHTML = h || '<div class="empty-state">Ничего не нашлось. Попробуй другое слово или английскую аббревиатуру.</div>';
      $$('[data-add]').forEach(function (b) {
        b.onclick = function () { const k = b.getAttribute('data-add'); if (!BA.S.cards[k]) { BA.S.cards[k] = { box: 0, due: BA.today() }; BA.save(); b.textContent = '✓ в карточках'; renderSide(); } };
      });
    }
    $('#glq').oninput = function () { q = this.value; draw(); };
    draw();
    if (focus) { const el = document.getElementById('g-' + focus.replace(/[^\wа-я]/gi, '_')); if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); }, 50); }
  }
  ROUTES.glossary = function () { viewGlossary(null); };

  /* ================= карточки ================= */
  const INT = [0, 1, 2, 4, 8, 16];
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return BA.today(d); }
  function dueCards() { const t = BA.today(); return Object.keys(BA.S.cards).filter(function (k) { return BA.glossary[k] && BA.S.cards[k].due <= t; }); }
  ROUTES.cards = function () {
    let deck = dueCards(), mode = 'due';
    const total = Object.keys(BA.S.cards).length, known = Object.values(BA.S.cards).filter(function (c) { return c.box >= 3; }).length;
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    deck = shuffle(deck);
    let i = 0;
    function head() {
      return '<div class="wrap">' + pageHead('Карточки · интервальное повторение', 'Повторяй, пока не станет родным',
        'Термины из пройденных уроков приходят сюда сами. Помнишь — карточка вернётся позже. Не помнишь — завтра. Выучено: <b>' + known + '</b> из ' + total + ' в колоде.');
    }
    function draw() {
      if (!deck.length || i >= deck.length) {
        view.innerHTML = head() + '<div class="flash-wrap"><div class="empty-state">' + (i > 0 ? 'Колода на сегодня пройдена. Отличная работа.' : (total ? 'На сегодня повторять нечего: все карточки запланированы на будущее.' : 'Колода пуста. Пройди первый урок или добавь термины из словаря.')) +
          '</div><div class="btnrow" style="justify-content:center"><button class="btn quiet" id="cAll">Тренировать случайные термины</button><a class="btn quiet" href="#glossary">Открыть словарь</a></div></div></div>';
        $('#cAll').onclick = function () { mode = 'free'; deck = shuffle(BA.gl.map(function (g) { return g.key; })).slice(0, 20); i = 0; draw(); };
        return;
      }
      const k = deck[i], g = BA.glossary[k];
      view.innerHTML = head() + '<div class="flash-wrap"><div class="eyebrow" style="text-align:center">Карточка ' + (i + 1) + ' из ' + deck.length + (mode === 'free' ? ' · свободная тренировка' : '') + '</div>' +
        '<div class="flash" id="flash" tabindex="0" role="button" aria-label="Перевернуть карточку"><div class="flash-in"><div class="flash-face">' + BA.rosette(7, 'rose') + '<div class="eyebrow">' + e(g.cat) + '</div><div class="big">' + e(g.term) + '</div><div class="muted small">Вспомни значение и нажми, чтобы проверить</div></div>' +
        '<div class="flash-face back"><div class="eyebrow">' + e(g.term) + (g.ru ? ' · ' + e(g.ru) : '') + '</div><p>' + BA.inline(g.def) + '</p>' + (g.ex ? '<p class="ex">' + BA.inline(g.ex) + '</p>' : '') + '</div></div></div>' +
        '<div class="btnrow" style="justify-content:center" id="cBtns" hidden><button class="btn quiet" id="cNo">Не помню</button><button class="btn" id="cYes">Помню</button></div>' +
        '<div class="muted small" style="text-align:center">Пробел — перевернуть · ← не помню · → помню</div></div></div>';
      const fl = $('#flash');
      function flip() { fl.classList.toggle('flip'); $('#cBtns').hidden = false; }
      fl.onclick = flip;
      function answer(ok) {
        if (mode === 'due') {
          const c = BA.S.cards[k] || { box: 0 };
          c.box = ok ? Math.min(5, c.box + 1) : 1; c.due = addDays(ok ? INT[c.box] : 0);
          if (!ok) deck.push(k);
          BA.S.cards[k] = c; BA.save();
        }
        const day = BA.today(); BA.S.seen[day] = (BA.S.seen[day] || 0) + 1;
        if (ok && BA.S.seen[day] <= 40) BA.award('card:' + k + ':' + day, 1, 'карточка');
        i++; draw();
      }
      $('#cNo').onclick = function () { answer(false); };
      $('#cYes').onclick = function () { answer(true); };
      document.onkeydown = function (ev) {
        if (!$('#flash')) { document.onkeydown = null; return; }
        if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
        if (ev.key === ' ') { ev.preventDefault(); flip(); }
        else if (ev.key === 'ArrowRight' && !$('#cBtns').hidden) answer(true);
        else if (ev.key === 'ArrowLeft' && !$('#cBtns').hidden) answer(false);
      };
    }
    draw();
  };

  /* ================= разминка и экзамен ================= */
  function allQuestions(onlyDone) {
    const out = [];
    BA.order.forEach(function (id) {
      if (onlyDone && !BA.S.done[id]) return;
      (BA.lessons[id].quiz || []).forEach(function (q, i) { out.push({ id: id + '-q' + i, q: q, lesson: id }); });
    });
    return out;
  }
  function runQuiz(root, qs, opts) {
    let i = 0, ok = 0;
    function draw() {
      if (i >= qs.length) { opts.done(ok, qs.length); return; }
      const it = qs[i], q = it.q;
      root.innerHTML = '<div class="check" style="max-width:760px"><div class="tag">' + e(opts.label) + ' · вопрос ' + (i + 1) + ' из ' + qs.length + '</div><div class="q">' + BA.inline(q.q) + '</div><div class="opts">' +
        q.o.map(function (o, k) { return '<button class="opt" data-k="' + k + '"><span class="mk">' + 'АБВГД'[k] + '</span><span>' + BA.inline(o) + '</span></button>'; }).join('') +
        '</div><div class="why" hidden></div><div class="btnrow" style="margin-top:14px" hidden id="qNext"><button class="btn">' + (i + 1 < qs.length ? 'Дальше' : 'Результат') + '</button><a class="muted small" href="#' + it.lesson + '">из урока «' + e(BA.lessons[it.lesson].title) + '»</a></div></div>';
      $$('.opt', root).forEach(function (b) {
        b.onclick = function () {
          const k = +b.getAttribute('data-k');
          if (k === q.a) ok++;
          $$('.opt', root).forEach(function (x) { x.disabled = true; const kk = +x.getAttribute('data-k'); if (kk === q.a) x.classList.add('ok'); else if (kk === k) x.classList.add('bad'); });
          const w = $('.why', root); w.hidden = false; w.innerHTML = (k === q.a ? '<b>Верно.</b> ' : '<b>Неверно.</b> ') + BA.inline(q.e || '');
          $('#qNext', root).hidden = false; $('#qNext .btn', root).onclick = function () { i++; draw(); };
        };
      });
    }
    draw();
  }
  function pick(arr, n, seed) {
    const r = seed ? BA.seeded(seed) : Math.random;
    const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, n);
  }
  ROUTES.warmup = function () {
    let pool = allQuestions(true); if (pool.length < 5) pool = allQuestions(false).slice(0, Math.max(30, pool.length));
    const qs = pick(pool, 5, BA.hash(BA.today()));
    const done = BA.isAwarded('warmup:' + BA.today());
    view.innerHTML = '<div class="wrap">' + pageHead('Разминка дня · +15 XP', done ? 'Разминка пройдена — можно ещё раз' : 'Пять вопросов, две минуты',
      'Вопросы берутся из пройденных уроков, а пока их мало — из начала программы. Разминка засчитывает день в серию.') + '<div id="wq"></div></div>';
    runQuiz($('#wq'), qs, {
      label: 'Разминка', done: function (ok, n) {
        BA.award('warmup:' + BA.today(), 15, 'разминка дня');
        const due = dueCards().length;
        $('#wq').innerHTML = '<div class="outcome ' + (ok >= 4 ? 'good' : ok >= 3 ? 'mid' : 'bad') + '" style="max-width:760px"><h4>' + ok + ' из ' + n + '</h4>' + (ok >= 4 ? 'Отличная форма. Серия дней продолжается.' : 'Засчитано. Ошибки — повод заглянуть в уроки по ссылкам под вопросами.') + '</div><div class="btnrow" style="margin-top:14px">' + (continueStep() ? '<a class="btn" href="#' + continueStep().key + '">Продолжить программу</a>' : '') + (due ? '<a class="btn quiet" href="#cards">Повторить карточки (' + due + ')</a>' : '') + '</div>';
        renderChips();
      }
    });
  };
  ROUTES.exam = function () {
    const ex = BA.S.exam || {};
    let h = '<div class="wrap" style="max-width:900px"><div class="eyebrow" style="margin-bottom:12px">' + crumbs('exam') + '</div>' + pageHead('Итоговый экзамен · 40 вопросов · порог 80%', 'Экзамен программы',
      'Сорок случайных вопросов из всех частей программы. Сдашь от 32 верных — получишь сертификат и +200 XP. Пересдавать можно сколько угодно: вопросы каждый раз другие.');
    if (ex.passed) h += diploma(ex);
    h += '<div class="btnrow"><button class="btn" id="exStart">' + (ex.passed ? 'Сдать ещё раз' : 'Начать экзамен') + '</button>' + (ex.best ? '<span class="muted">Лучший результат: ' + ex.best + '</span>' : '') + '</div><div id="exq" style="margin-top:20px"></div>' + stepBar('exam') + '</div>';
    view.innerHTML = h; hydrate(view); bindStepKeys('exam');
    $('#exStart').onclick = function () {
      this.parentNode.hidden = true;
      const qs = pick(allQuestions(false), 40);
      runQuiz($('#exq'), qs, {
        label: 'Экзамен', done: function (ok, n) {
          const pass = ok >= Math.ceil(n * .8);
          BA.S.exam = BA.S.exam || {};
          BA.S.exam.best = Math.max(BA.S.exam.best || 0, ok);
          if (pass) { BA.S.exam.passed = true; BA.S.exam.date = BA.S.exam.date || BA.today(); BA.S.exam.score = Math.max(BA.S.exam.score || 0, ok); BA.S.exam.n = n; }
          BA.save();
          if (pass) BA.award('exam', 200, 'экзамен сдан');
          $('#exq').innerHTML = '<div class="outcome ' + (pass ? 'good' : 'bad') + '"><h4>' + ok + ' из ' + n + (pass ? ' — экзамен сдан' : ' — пока не хватает') + '</h4>' + (pass ? 'Ты говоришь на языке бизнеса. Сертификат ниже.' : 'Нужно ' + Math.ceil(n * .8) + '. Повтори модули, где были ошибки, и попробуй снова.') + '</div>' + (pass ? diploma(BA.S.exam) : '') + '<div class="btnrow" style="margin-top:14px"><a class="btn quiet" href="#exam">Ещё раз</a></div>';
          hydrate($('#exq')); bindDiploma(); renderSide();
        }
      });
    };
    bindDiploma();
  };
  function diploma(ex) {
    return '<div class="diploma" style="margin:10px 0 24px">' + BA.rosette(4, 'rose') + '<div class="eyebrow">Сертификат № ' + String(BA.hash((ex.date || '') + 'ba') % 1000000).padStart(6, '0') + '</div><h2>Бизнес как система</h2><p class="lede" style="text-align:center">подтверждает, что</p>' +
      '<div class="name" id="dName" contenteditable="true" spellcheck="false" aria-label="Имя для сертификата">' + e(BA.S.name || 'Впиши своё имя') + '</div>' +
      '<p class="lede" style="text-align:center;font-size:1rem">прошёл(а) программу уровня MBA и сдал(а) экзамен: ' + (ex.score || ex.best) + ' из ' + (ex.n || 40) + ' · ' + e(ex.date || '') + '</p></div>';
  }
  function bindDiploma() { const n = $('#dName'); if (n) n.oninput = function () { BA.S.name = n.textContent.trim(); BA.save(); }; }

  /* ================= формулы и библиотека ================= */
  ROUTES.formulas = function () {
    const F = BA.extra.formulas || [];
    const cats = Array.from(new Set(F.map(function (f) { return f.c; })));
    let h = '<div class="wrap">' + pageHead('Шпаргалка · ' + F.length + ' формул', 'Формулы, которые стоит знать наизусть', 'Кратко: формула, смысл и где поиграть с ней в лаборатории.');
    cats.forEach(function (c) {
      h += '<div class="section"><div class="section-head"><h2>' + e(c) + '</h2></div><div class="fx-grid">' + F.filter(function (f) { return f.c === c; }).map(function (f) {
        return '<div class="fx-card"><b>' + e(f.n) + '</b><code>' + e(f.f) + '</code><p>' + BA.inline(f.d) + '</p>' + (f.s && BA.sims[f.s] ? '<a href="#sim-' + f.s + '">Открыть симулятор →</a>' : '') + '</div>';
      }).join('') + '</div></div>';
    });
    view.innerHTML = h + '</div>';
  };
  ROUTES.library = function () {
    const T = [['course', 'Курсы и лекции'], ['book', 'Книги'], ['video', 'Видео'], ['article', 'Статьи'], ['site', 'Сайты и сервисы']];
    let tab = 'course';
    view.innerHTML = '<div class="wrap" style="max-width:900px">' + pageHead('Библиотека', 'Что изучать дальше',
      'Отобрано под программу: сначала русскоязычное, затем лучшее на английском. Совет: англоязычные лекции на YouTube удобно смотреть в Яндекс Браузере — он делает закадровый перевод на русский. Многие книги из списка есть в аудиоформате в Яндекс Книгах и на ЛитРес. Часть зарубежных сайтов из России может открываться медленно.') +
      '<div class="cats" id="libT" style="margin-bottom:10px"></div><div id="libL"></div></div>';
    function draw() {
      $('#libT').innerHTML = T.map(function (t) { return '<button class="' + (t[0] === tab ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
      $$('#libT button').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); draw(); }; });
      $('#libL').innerHTML = BA.library.filter(function (x) { return x.t === tab; }).map(function (x) {
        const cover = x.t === 'book' ? '<div class="cover">' + e((x.title.replace(/[«»"]/g, '')[0] || '').toUpperCase()) + '</div>' : '<div class="cover ' + (x.t === 'video' ? 'v' : 'a') + '">' + ic(x.t === 'video' ? 'play' : x.t === 'course' ? 'cap' : x.t === 'article' ? 'doc' : 'globe') + '</div>';
        return '<div class="lib-item">' + cover + '<div><b>' + e(x.title) + '</b>' + (x.au ? '<div class="au">' + e(x.au) + (x.lvl ? ' · ' + e(x.lvl) : '') + '</div>' : '') + '<p>' + BA.inline(x.why) + '</p>' + (x.url ? '<a href="' + e(x.url) + '" target="_blank" rel="noopener">' + (x.t === 'video' ? 'Найти на YouTube →' : 'Открыть →') + '</a>' : '') + '</div></div>';
      }).join('') || '<div class="empty-state">Пока пусто.</div>';
    }
    draw();
  };

  /* ================= тетрадь, итоговый план и профиль ================= */
  function workbookData() {
    const ids = BA.order.filter(function (id) { return BA.lessons[id].task; });
    const out = [];
    ids.forEach(function (id) {
      const t = BA.S.tasks[id]; if (!t) return;
      const l = BA.lessons[id], items = [];
      l.task.f.forEach(function (f, k) { const v = (t['f' + k] || '').trim(); if (v) items.push([f, v]); });
      if (items.length) out.push({ id: id, title: l.task.t, mod: modOfKey(id), items: items });
    });
    return out;
  }
  BA.workbookData = workbookData;
  ROUTES.workbook = function () {
    let h = '<div class="wrap" style="max-width:900px">' + pageHead('Рабочая тетрадь', 'Твой бизнес на бумаге',
      'Ответы из практических заданий собираются здесь по модулям. К концу программы из них складывается черновик бизнес-плана.');
    h += '<div class="btnrow" style="margin-bottom:20px"><button class="btn quiet" id="wbCopy">' + ic('copy') + 'Скопировать всё текстом</button></div>';
    let text = '';
    const cv = BA.S.tasks.canvas;
    const CVN = { 'c-prob': 'Проблема', 'c-seg': 'Сегменты клиентов', 'c-uvp': 'Ценностное предложение', 'c-sol': 'Решение', 'c-ch': 'Каналы', 'c-rev': 'Потоки дохода', 'c-cost': 'Структура расходов', 'c-met': 'Ключевые метрики', 'c-adv': 'Нечестное преимущество' };
    if (cv && Object.keys(CVN).some(function (k) { return (cv[k] || '').trim(); })) {
      h += '<section class="block" style="margin-top:28px"><div class="block-head"><h2 style="font-size:1.3rem">Lean Canvas</h2><a class="x" style="color:var(--money);font-family:var(--f-ui)" href="#l4-1">редактировать →</a></div>';
      text += '\n## Lean Canvas\n';
      Object.keys(CVN).forEach(function (k) { const v = (cv[k] || '').trim(); if (!v) return; h += '<div class="field"><label>' + CVN[k] + '</label><div class="prose" style="font-size:1rem;white-space:pre-wrap">' + e(v) + '</div></div>'; text += CVN[k] + ':\n' + v + '\n\n'; });
      h += '</section>';
    }
    const wb = workbookData();
    if (!wb.length && !cv) h += '<div class="empty-state">Пока пусто. Практика есть почти в каждом уроке — начни с <a href="#l0-1">первого задания</a>.</div>';
    wb.forEach(function (w) {
      h += '<section class="block" style="margin-top:28px"><div class="block-head"><h2 style="font-size:1.3rem">' + e(w.title) + '</h2><a class="x" style="color:var(--money);font-family:var(--f-ui)" href="#' + w.id + '">' + (w.mod ? 'модуль ' + w.mod.num + ' · ' : '') + 'к уроку →</a></div>';
      text += '\n## ' + w.title + '\n';
      w.items.forEach(function (it) { h += '<div class="field"><label>' + e(it[0]) + '</label><div class="prose" style="font-size:1rem;white-space:pre-wrap">' + e(it[1]) + '</div></div>'; text += it[0] + ':\n' + it[1] + '\n\n'; });
      h += '</section>';
    });
    view.innerHTML = h + '</div>';
    $('#wbCopy').onclick = function () { copyText('Бизнес как система — рабочая тетрадь\n' + text); };
  };
  function copyText(t) {
    const ok = function () { BA.toast('Скопировано'); };
    try { navigator.clipboard.writeText(t).then(ok, function () { fallbackCopy(t); }); } catch (err) { fallbackCopy(t); }
  }
  BA.copyText = copyText;
  function fallbackCopy(t) {
    const m = modal('<h3>Скопируй вручную</h3><p>Браузер не дал доступ к буферу. Выдели текст ниже и скопируй.</p><textarea class="inp" style="height:220px;font-family:var(--f-mono);font-size:.8rem;padding:10px" readonly>' + e(t) + '</textarea>');
    const ta = $('textarea', m); ta.focus(); ta.select();
  }
  ROUTES.profile = function () {
    const st = BA.stage();
    let h = '<div class="wrap" style="max-width:1000px">' + pageHead('Профиль', 'Стадия «' + e(st.cur.name) + '»', e(st.cur.note));
    const items = [];
    for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); const key = BA.today(d); items.push({ label: String(d.getDate()), value: BA.S.days[key] || 0, color: k === 0 ? 'var(--gold)' : 'var(--money)' }); }
    h += '<div class="grid2"><div class="card"><div class="eyebrow">Опыт за 14 дней</div><div class="chart">' + BA.barChart({ items: items, h: 220, label: 'Опыт по дням' }) + '</div></div>';
    h += '<div class="card"><div class="eyebrow">Лестница стадий</div><div class="ladder">' + BA.STAGES.map(function (s, k) {
      return '<div class="' + (k <= st.i ? 'on' : '') + (k === st.i ? ' cur' : '') + '"><b>' + e(s.name) + '</b><span class="x">' + BA.n(s.xp) + ' XP</span><span>' + e(s.note) + '</span></div>';
    }).join('') + '</div></div></div>';
    h += '<div class="section"><div class="section-head"><h2>Прогресс по модулям</h2></div><div class="card"><div class="chart">' +
      BA.barChart({ items: BA.modules.map(function (m) { return { label: String(m.num), value: Math.round(modProgress(m).p * 100) }; }), h: 220, fmt: function (v) { return v + '%'; }, label: 'Прогресс по модулям' }) + '</div></div></div>';
    const got = BA.ACH.filter(function (a) { return BA.S.ach[a[0]]; }).length;
    h += '<div class="section"><div class="section-head"><h2>Награды · ' + got + ' из ' + BA.ACH.length + '</h2></div><div class="ach-grid">' + BA.ACH.map(function (a) {
      return '<div class="ach' + (BA.S.ach[a[0]] ? ' on' : '') + '"><div class="medal">' + ic('medal') + '</div><div><b>' + e(a[1]) + '</b><span>' + e(a[2]) + '</span></div></div>';
    }).join('') + '</div></div>';
    h += '<div class="section"><div class="section-head"><h2>Перенос прогресса</h2></div><div class="card"><p>Прогресс хранится в этом браузере. Чтобы продолжить на другом устройстве, скопируй код здесь и вставь его там.</p>' +
      '<div class="btnrow"><button class="btn quiet" id="pfExport">' + ic('copy') + 'Скопировать код прогресса</button></div>' +
      '<div class="field"><label for="pfCode">Вставить код с другого устройства</label><textarea class="inp" id="pfCode" style="height:80px;padding:10px;font-size:.8rem"></textarea></div>' +
      '<div class="btnrow"><button class="btn small" id="pfImport">Загрузить прогресс</button><button class="btn small quiet" id="pfReset" style="margin-left:auto;color:var(--seal)">Сбросить всё</button><span id="pfMsg" class="small"></span></div></div></div>';
    view.innerHTML = h + '</div>';
    $('#pfExport').onclick = function () { copyText(BA.exportState()); };
    $('#pfImport').onclick = function () {
      try { BA.importState($('#pfCode').value); applySettings(); BA.toast('Прогресс загружен'); renderSide(); renderChips(); ROUTES.profile(); }
      catch (err) { $('#pfMsg').textContent = 'Код не подошёл. Скопируй его целиком ещё раз.'; $('#pfMsg').style.color = 'var(--seal)'; }
    };
    let armed = false;
    $('#pfReset').onclick = function () {
      if (!armed) { armed = true; this.textContent = 'Точно сбросить? Нажми ещё раз'; return; }
      BA.reset(); applySettings(); renderSide(); renderChips(); ROUTES.profile();
    };
  };

  /* ================= карта бизнеса ================= */
  ROUTES.map = function () {
    view.innerHTML = '<div class="wrap">' + pageHead('Карта бизнеса', 'Как всё связано',
      'Нажми на любой блок: зелёным подсветится то, на что он влияет, синим — то, что влияет на него. Под картой — путь компании от идеи до выхода.') +
      '<div class="sim-mount" data-sim="system-map"></div><div class="section"><div class="section-head"><h2>Путь компании: стадии</h2></div><div class="sim-mount" data-sim="stages"></div></div></div>';
    hydrate(view);
  };

  /* ================= поиск ================= */
  let idx = null;
  function buildIndex() {
    idx = [];
    BA.order.forEach(function (id) { const l = BA.lessons[id], m = modOfKey(id); idx.push({ k: 'Урок · модуль ' + (m ? m.num : ''), t: l.title, d: l.sub || '', h: id, s: BA.norm(l.title + ' ' + (l.sub || '')) }); });
    BA.modules.forEach(function (m) { idx.push({ k: 'Модуль ' + m.num, t: m.title, d: m.desc, h: 'mod-' + m.num, s: BA.norm(m.title + ' ' + m.desc) }); });
    BA.gl.forEach(function (g) { idx.push({ k: 'Термин', t: g.term, d: g.def, h: 'term-' + g.key, s: BA.norm(g.term + ' ' + g.ru) }); });
    Object.values(BA.sims).forEach(function (s) { if (!s.hidden) idx.push({ k: 'Симулятор', t: s.title, d: s.desc || '', h: 'sim-' + s.id, s: BA.norm(s.title + ' ' + (s.desc || '')) }); });
    BA.stories.forEach(function (s) { idx.push({ k: 'История', t: s.company, d: s.hook, h: 'story-' + s.id, s: BA.norm(s.company + ' ' + s.hook) }); });
    BA.decisions.forEach(function (d) { idx.push({ k: 'Сценарий', t: d.title, d: d.sub, h: 'dec-' + d.id, s: BA.norm(d.title + ' ' + d.sub) }); });
  }
  function bindSearch() {
    const inp = $('#q'), res = $('#qres');
    let sel = 0, items = [];
    function draw() {
      const q = BA.norm(inp.value.trim());
      if (!q) { res.hidden = true; return; }
      if (!idx) buildIndex();
      items = idx.map(function (it) { const p = it.s.indexOf(q); return p < 0 ? null : { it: it, score: (p === 0 ? 0 : 1) + (it.k.indexOf('Урок') === 0 ? 0 : it.k.indexOf('Модуль') === 0 ? .2 : it.k === 'Термин' ? .5 : 1) }; })
        .filter(Boolean).sort(function (a, b) { return a.score - b.score; }).slice(0, 14).map(function (x) { return x.it; });
      sel = 0;
      res.innerHTML = items.length ? items.map(function (it, k) { return '<a href="#' + e(it.h) + '" class="' + (k === sel ? 'sel' : '') + '"><span class="k">' + e(it.k) + '</span>' + e(it.t) + '<span class="d">' + e(it.d) + '</span></a>'; }).join('') : '<div class="empty">Ничего не нашлось</div>';
      res.hidden = false;
    }
    inp.oninput = draw;
    inp.onfocus = draw;
    inp.onkeydown = function (ev) {
      const as = $$('a', res);
      if (ev.key === 'ArrowDown') { sel = Math.min(as.length - 1, sel + 1); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { sel = Math.max(0, sel - 1); ev.preventDefault(); }
      else if (ev.key === 'Enter' && as[sel]) { location.hash = as[sel].getAttribute('href').slice(1); inp.value = ''; res.hidden = true; inp.blur(); return; }
      else if (ev.key === 'Escape') { res.hidden = true; inp.blur(); return; }
      as.forEach(function (a, k) { a.classList.toggle('sel', k === sel); });
    };
    res.onclick = function () { inp.value = ''; res.hidden = true; };
    document.addEventListener('click', function (ev) { if (!ev.target.closest('.search')) res.hidden = true; });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { ev.preventDefault(); inp.focus(); }
      if (ev.key === 'Escape') closeModal();
    });
  }

  /* ================= делегированные события ================= */
  function bindGlobal() {
    tipEl = $('#tip');
    const fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    document.addEventListener('mouseover', function (ev) { const t = ev.target.closest && ev.target.closest('.term'); if (t && fine) showTip(t); });
    document.addEventListener('mouseout', function (ev) { const t = ev.target.closest && ev.target.closest('.term'); if (t) closeTip(); });
    document.addEventListener('focusin', function (ev) { if (ev.target.classList && ev.target.classList.contains('term')) showTip(ev.target); });
    document.addEventListener('focusout', function (ev) { if (ev.target.classList && ev.target.classList.contains('term')) closeTip(); });
    window.addEventListener('scroll', function () { closeTip(); readProgress(); }, { passive: true });
    document.addEventListener('click', function (ev) {
      const t = ev.target.closest('.term, .tpill');
      if (t) { ev.preventDefault(); closeTip(); termModal(t.getAttribute('data-term')); return; }
      const opt = ev.target.closest('.check .opt');
      if (opt && opt.closest('.check').hasAttribute('data-check')) {
        const box = opt.closest('.check'); if (box.classList.contains('answered')) return;
        box.classList.add('answered');
        const ok = opt.getAttribute('data-ok') === '1';
        $$('.opt', box).forEach(function (b) { b.disabled = true; if (b.getAttribute('data-ok') === '1') b.classList.add('ok'); });
        if (!ok) opt.classList.add('bad');
        const w = $('.why', box); w.hidden = false; w.innerHTML = (ok ? '<b>Верно.</b> ' : '<b>Не совсем.</b> ') + w.innerHTML;
        if (ok) BA.award('check:' + box.getAttribute('data-check'), 5, 'проверка в тексте');
      }
    });
    document.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('term')) { ev.preventDefault(); termModal(ev.target.getAttribute('data-term')); }
    });
  }
  let rpTick = false;
  function readProgress() {
    if (rpTick) return; rpTick = true;
    requestAnimationFrame(function () {
      rpTick = false;
      const p = $('#prose'); if (!p) return;
      const r = p.getBoundingClientRect(), total = r.height - innerHeight * .6;
      const v = BA.clamp(-r.top / (total || 1), 0, 1);
      const a = $('#rp'), b = $('#rpb'); if (a) a.textContent = Math.round(v * 100) + '%'; if (b) b.style.width = (v * 100) + '%';
      let cur = null;
      $$('#prose h2').forEach(function (h) { if (h.getBoundingClientRect().top < 140) cur = h.id; });
      ['quiz', 'probs', 'task', 'lterms'].forEach(function (x) { const el = document.getElementById(x); if (el && el.getBoundingClientRect().top < 140) cur = x; });
      $$('#toc a').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-to') === cur); });
    });
  }

  /* ================= старт ================= */
  function levelUp(i) {
    const s = BA.STAGES[i];
    setTimeout(function () {
      modal('<div class="rose">' + BA.rosette(i + 11) + '</div><div class="eyebrow">Новая стадия</div><h3>' + e(s.name) + '</h3><p>' + e(s.note) + '</p><button class="btn" id="luOk">Дальше</button>', 'levelup');
      $('#luOk').onclick = closeModal;
    }, 700);
  }
  function boot() {
    BA.finalize();
    applySettings();
    view = $('#view');
    $('#searchSlot').innerHTML = '<div class="search">' + ic('search') + '<input id="q" type="search" placeholder="Поиск: урок, термин, симулятор…  /" autocomplete="off" aria-label="Поиск"><div class="search-res" id="qres" hidden></div></div>';
    $('#menuBtn').innerHTML = ic('menu');
    $('#menuBtn').setAttribute('title', 'Показать или скрыть меню');
    $('#menuBtn').onclick = function () {
      if (window.matchMedia('(max-width: 980px)').matches) { document.body.classList.toggle('nav-open'); return; }
      BA.S.sideCollapsed = !BA.S.sideCollapsed; BA.save(); applySettings();
    };
    $('#scrimNav').onclick = function () { document.body.classList.remove('nav-open'); };
    $('#tabbar').innerHTML = [['home', 'Главная', 'home'], ['course', 'Программа', 'book'], ['lab', 'Практика', 'flask'], ['glossary', 'Словарь', 'dict'], ['profile', 'Профиль', 'user']]
      .map(function (t) { return '<a href="#' + t[0] + '" data-tab="' + t[0] + '">' + ic(t[2]) + t[1] + '</a>'; }).join('');
    renderChips(); bindSearch(); bindGlobal();
    BA.on('xp', function () { renderChips(); });
    BA.on('levelup', levelUp);
    BA.on('state', function () { renderChips(); renderSide(); });
    window.addEventListener('hashchange', route);
    route();
    BA.checkAch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
