/* Мини-игра «Стартап за 24 месяца»: модель + интерфейс */
(function () {
  'use strict';
  const BA = window.BA || (window.BA = {});
  const SAL = { dev: 260000, sales: 190000, sup: 120000 };
  const PRICES = [1500, 3000, 5000, 8000];

  function newState(seed) {
    return { m: 0, cash: 8e6, cust: 20, price: 3000, q: 40, team: { dev: 2, sales: 0, sup: 0 }, mkt: 3e5, debt: 0, founder: 1, inv: [], hist: [{ m: 0, mrr: 60000, cash: 8e6 }],
      fx: { churnUp: 0, rateUp: 0 }, seed: seed || (Date.now() % 1e9), offer: null, log: [], dead: false, done: false, lastMrr: [60000] };
  }
  function rnd(s) { s.seed = (s.seed * 1103515245 + 12345) % 2147483648; return s.seed / 2147483648; }
  function mrr(s) { return s.cust * s.price; }
  function growth(s) { const a = s.lastMrr; if (a.length < 4) return 0; const g = Math.pow(a[a.length - 1] / Math.max(1, a[a.length - 4]), 1 / 3) - 1; return isFinite(g) ? g : 0; }
  function churnRate(s) {
    let c = 0.095 - s.q / 100 * 0.075 + (s.price - 3000) / 3000 * 0.012 - Math.min(3, s.team.sup) * 0.006 + (s.fx.churnUp > 0 ? 0.03 : 0);
    if (s.team.sup === 0 && s.cust > 150) c += 0.015;
    return BA.clamp ? BA.clamp(c, 0.008, 0.25) : Math.max(0.008, Math.min(0.25, c));
  }
  function costs(s) {
    const team = Math.max(0, s.team.dev - 1) * SAL.dev + s.team.sales * SAL.sales + s.team.sup * SAL.sup;
    const cogs = mrr(s) * 0.12 + s.cust * 150;
    const fixed = 150000 + (s.team.dev + s.team.sales + s.team.sup) * 25000;
    return { team: team, cogs: cogs, fixed: fixed, mkt: s.mkt, interest: s.debt * 0.018, total: team + cogs + fixed + s.mkt + s.debt * 0.018 };
  }
  function multiple(s) {
    const g = growth(s), ch = churnRate(s);
    let mlt = 3 + Math.max(0, g) * 70 - Math.max(0, ch - 0.03) * 60 - (s.fx.rateUp > 0 ? 2 : 0);
    return Math.max(1.5, Math.min(18, mlt));
  }
  function valuation(s) { return Math.max(0, mrr(s) * 12 * multiple(s) + s.cash - s.debt); }
  function founderTake(s, exit) {
    // ликвидационные привилегии: инвесторы с конца очереди, без участия — берут лучшее из привилегии и доли
    let left = exit, pctTaken = 0; const got = [];
    s.inv.slice().reverse().forEach(function (iv) {
      const pref = Math.min(left, iv.amt * iv.pref);
      const share = exit * iv.pct;
      const take = iv.part ? Math.min(left, pref + Math.max(0, (exit - pref) * iv.pct)) : Math.min(left, Math.max(pref, share));
      got.push(take); left -= take; pctTaken += iv.pct;
    });
    return Math.max(0, left * (s.founder / Math.max(1e-9, 1 - pctTaken)));
  }
  function makeOffer(s, forced) {
    const g = growth(s), ar = mrr(s) * 12;
    if (ar < 1.5e6) return forced ? { none: 'Инвесторы говорят: «Слишком рано. Вернитесь, когда будет хотя бы 150 тыс. ₽ MRR и понятный рост».' } : null;
    const chance = forced ? 0.45 + g * 3 : (g > 0.07 ? 0.18 + g * 1.5 : 0);
    if (rnd(s) > chance) return forced ? { none: 'Встречи прошли, но фонды взяли паузу: рост ' + Math.round(g * 100) + '% в месяц их не убедил. Попробуй, когда метрики станут сильнее.' } : null;
    const pre = Math.round(ar * multiple(s) * (0.8 + rnd(s) * 0.4) / 1e6) * 1e6;
    const pct = 0.15 + Math.round(rnd(s) * 10) / 100;
    const amt = Math.round(pre * pct / (1 - pct) / 1e6) * 1e6;
    const toxic = rnd(s) < 0.3;
    return { pre: pre, amt: amt, pct: amt / (pre + amt), pref: toxic ? 2 : 1, part: toxic && rnd(s) < 0.5, who: toxic ? 'Фонд «Быстрые деньги»' : (rnd(s) < 0.5 ? 'Фонд «Северный ветер»' : 'Синдикат бизнес-ангелов') };
  }
  const EVENTS = [
    [function (s) { return s.m > 3; }, function (s) { s.fx.churnUp = 2; return ['bad', 'Конкурент снизил цены вдвое. Ближайшие два месяца отток выше обычного.']; }],
    [function (s) { return s.q > 50; }, function (s) { const n = Math.round(10 + s.cust * 0.12); s.cust += n; return ['good', 'Клиент написал восторженный пост в отраслевом чате: +' + n + ' клиентов бесплатно. Так работает качество продукта.']; }],
    [function (s) { return s.team.dev > 2; }, function (s) { s.team.dev--; s.q -= 4; return ['bad', 'Ключевой разработчик ушёл к конкуренту. Минус один человек и минус качество.']; }],
    [function (s) { return s.m > 6; }, function (s) { s.fx.rateUp = 4; return ['ev', 'ЦБ поднял ключевую ставку. Четыре месяца инвесторы будут осторожнее, а оценки ниже.']; }],
    [function (s) { return s.q < 55 && s.cust > 40; }, function (s) { s.cust = Math.round(s.cust * 0.93); return ['bad', 'Сбой серверов на сутки. Часть клиентов ушла. Низкое качество продукта бьёт по удержанию.']; }],
    [function (s) { return s.team.sales > 0; }, function (s) { const n = 6 + s.team.sales * 4; s.cust += n; return ['good', 'Отдел продаж закрыл сделку с сетью из ' + n + ' филиалов.']; }],
    [function (s) { return s.cash > 3e6; }, function (s) { s.cash -= 1.2e6; return ['ev', 'Налоговая проверка и штраф за ошибку бухгалтера: −1,2 млн ₽. Учёт — не мелочь.']; }]
  ];
  // один ход: d = {mkt, price, hire, act}
  function step(s, d) {
    const log = [];
    s.mkt = d.mkt; s.price = d.price;
    if (d.hire === 'dev') s.team.dev++; else if (d.hire === 'sales') s.team.sales++; else if (d.hire === 'sup') s.team.sup++;
    else if (d.hire === 'fire') { const k = s.team.sales > 0 ? 'sales' : s.team.sup > 0 ? 'sup' : s.team.dev > 1 ? 'dev' : null; if (k) { s.team[k]--; s.cash -= SAL[k] * 2; log.push(['ev', 'Сокращение: −1 сотрудник, выплачено выходное пособие за два месяца.']); } }
    let founderBusy = false;
    if (d.act === 'feature') { s.cash -= 1.5e6; s.q += 6; log.push(['ev', 'Фича-рывок: подрядчики за 1,5 млн ₽ закрыли главные просьбы клиентов. Качество +6.']); }
    if (d.act === 'loan') {
      if (mrr(s) < 300000) log.push(['bad', 'Банк отказал: выручка меньше 300 тыс. ₽ в месяц, кредитовать нечего.']);
      else { const a = Math.round(mrr(s) * 6 / 1e5) * 1e5; s.debt += a; s.cash += a; log.push(['ev', 'Банк выдал кредит ' + BA.money(a) + ' под 21,6% годовых. Проценты — каждый месяц.']); }
    }
    if (d.act === 'raise') { founderBusy = true; const o = makeOffer(s, true); if (o && o.none) log.push(['bad', o.none]); else if (o) s.offer = o; }
    // продукт
    const devPower = s.team.dev * (founderBusy ? 1.2 : 2.2);
    s.q += devPower * (1 - s.q / 105) - 1.1;
    s.q = Math.max(5, Math.min(97, s.q));
    // привлечение
    const pf = Math.pow(s.price / 3000, 0.85), qf = 1.65 - s.q / 100;
    const salesBoost = 1 - Math.min(4, s.team.sales) * 0.07;
    const cac = 12000 * pf * qf * salesBoost * (1 + s.mkt / 4e6);
    const fromMkt = s.mkt / cac;
    const fromSales = Math.min(6, s.team.sales) * 5 * (s.q / 60);
    const organic = s.cust * 0.012 * (s.q / 50);
    const ch = churnRate(s);
    const lost = s.cust * ch;
    s.cust = Math.max(0, s.cust + fromMkt + fromSales + organic - lost);
    // события
    if (s.m >= 2 && rnd(s) < 0.32) {
      const pool = EVENTS.filter(function (x) { return x[0](s); });
      if (pool.length) log.push(pool[Math.floor(rnd(s) * pool.length)][1](s));
    }
    // деньги
    const c = costs(s), rev = mrr(s);
    s.cash += rev - c.total;
    s.m++;
    if (s.fx.churnUp > 0) s.fx.churnUp--; if (s.fx.rateUp > 0) s.fx.rateUp--;
    s.lastMrr.push(rev);
    s.hist.push({ m: s.m, mrr: rev, cash: s.cash });
    s.last = { cac: cac, churn: ch, newC: fromMkt + fromSales + organic, lost: lost, rev: rev, cost: c.total, burn: c.total - rev, ltv: s.price * 0.8 / ch };
    if (!s.offer && d.act !== 'raise') { const o = makeOffer(s, false); if (o && !o.none) { s.offer = o; log.push(['good', o.who + ' сам вышел на связь и предлагает сделку.']); } }
    if (s.cash < 0) { s.dead = true; s.done = true; log.push(['bad', 'Деньги закончились. Зарплаты платить нечем — компания закрывается.']); }
    else if (s.m >= 24) s.done = true;
    s.log = log.concat(s.log).slice(0, 40);
    return log;
  }
  function accept(s) {
    const o = s.offer; if (!o) return;
    s.cash += o.amt;
    s.inv.forEach(function (iv) { iv.pct *= 1 - o.pct; });
    s.founder *= 1 - o.pct;
    s.inv.push({ amt: o.amt, pct: o.pct, pref: o.pref, part: o.part, who: o.who });
    s.log.unshift(['good', 'Сделка закрыта: +' + BA.money(o.amt) + ' за ' + Math.round(o.pct * 100) + '%. Твоя доля теперь ' + Math.round(s.founder * 100) + '%.']);
    s.offer = null;
  }
  BA.gameModel = { newState: newState, step: step, accept: accept, valuation: valuation, founderTake: founderTake, mrr: mrr, churnRate: churnRate, costs: costs, growth: growth };

  /* ---------- интерфейс ---------- */
  BA.game = {
    render: function (root) {
      const e = BA.esc, ic = BA.icon;
      let s = newState();
      let dec = { mkt: 3e5, price: 3000, hire: 'none', act: 'none' };
      function seg(name, opts, cur) {
        return '<div class="seg" data-seg="' + name + '">' + opts.map(function (o) { return '<button data-v="' + o[0] + '" class="' + (String(o[0]) === String(cur) ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
      }
      function draw() {
        const c = costs(s), burn = c.total - mrr(s), run = burn > 0 ? s.cash / burn : Infinity;
        let h = '<div class="game"><div class="game-panel">';
        h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><h3 style="font-size:1.5rem">Месяц ' + s.m + ' из 24</h3><span class="muted small">Сервис онлайн-записи для салонов · подписка</span></div>';
        h += '<div class="ledger">' +
          cell('Деньги', BA.money(s.cash), s.cash < 2e6 ? 'down' : '') + cell('MRR', BA.money(mrr(s)), '') + cell('Клиенты', BA.n(s.cust), '') +
          cell('Отток / мес.', BA.pct(churnRate(s)), churnRate(s) > 0.05 ? 'down' : 'up') + cell('Качество', Math.round(s.q) + '/100', '') +
          cell('Burn', BA.money(burn), burn > 0 ? 'down' : 'up') + cell('Runway', isFinite(run) ? BA.n(run, 1) + ' мес.' : '∞', run < 6 ? 'down' : '') + cell('Твоя доля', Math.round(s.founder * 100) + '%', '') + '</div>';
        h += '<div class="chart">' + BA.lineChart({ series: [{ data: s.hist.map(function (x) { return [x.m, x.mrr * 10]; }), color: 'var(--money)' }, { data: s.hist.map(function (x) { return [x.m, x.cash]; }), color: 'var(--gold)' }], xMin: 0, xMax: 24, h: 220, xLabel: 'месяц', yFmt: function (v) { return BA.money(v, ''); } }) + '</div>' +
          BA.legend([{ name: 'MRR × 10 (для масштаба)', color: 'var(--money)' }, { name: 'Деньги на счёте', color: 'var(--gold)' }]);
        if (s.last) h += '<div class="small muted">Прошлый месяц: пришло ' + BA.n(s.last.newC) + ' клиентов, ушло ' + BA.n(s.last.lost) + '. CAC ≈ ' + BA.money(s.last.cac) + ', LTV ≈ ' + BA.money(s.last.ltv) + ' → LTV/CAC = ' + BA.n(s.last.ltv / s.last.cac, 1) + '×.</div>';
        h += '<div class="game-log">' + (s.log.length ? s.log.map(function (l) { return '<div class="' + l[0] + '">' + BA.inline(l[1]) + '</div>'; }).join('') : '<div>Стартовые условия: 8 млн ₽ на счёте (свои и от друзей), 20 пилотных клиентов, два разработчика (один из них ты). Подписка 3 000 ₽ в месяц.</div>') + '</div>';
        h += '</div><div class="game-panel">';
        if (s.done) {
          const val = s.dead ? 0 : valuation(s), take = s.dead ? 0 : founderTake(s, val);
          BA.S.game = BA.S.game || {}; if (!BA.S.game.played) { BA.S.game.played = true; BA.save(); BA.emit('state'); }
          if (!s.dead) { BA.S.game.survived = true; BA.S.game.best = Math.max(BA.S.game.best || 0, val); BA.S.game.take = Math.max(BA.S.game.take || 0, take); BA.save(); BA.award('game-finish', 40, 'стартап дожил до 24-го месяца'); }
          BA.checkAch();
          h += '<div class="outcome ' + (s.dead ? 'bad' : take > 3e8 ? 'good' : 'mid') + '"><h4>' + (s.dead ? 'Банкротство на ' + s.m + '-м месяце' : 'Итог через 24 месяца') + '</h4>' +
            (s.dead ? 'Компании редко умирают от плохого продукта в один день. Они умирают, когда кончаются деньги. Следи за runway и начинай искать деньги за 6–9 месяцев до нуля.' :
              'Оценка компании: <b>' + BA.money(val) + '</b> (ARR × мультипликатор + деньги − долг).<br>Твоя доля: ' + Math.round(s.founder * 100) + '% → после привилегий инвесторов ты получишь <b>' + BA.money(take) + '</b>.') + '</div>';
          h += '<div class="callout key"><div class="tag">' + ic('key') + 'Что двигало результат</div><div class="in"><p>Мультипликатор растёт от темпа роста и падает от оттока. Реклама без качества продукта даёт дорогих клиентов, которые быстро уходят. Деньги инвестора ускоряют рост, но размывают долю, а «токсичные» условия (2× привилегия, участие) съедают твою часть при скромной продаже.</p></div></div>';
          h += '<div class="btnrow"><button class="btn" id="gNew">Новая игра</button>' + (BA.S.game && BA.S.game.best ? '<span class="muted small">Рекорд оценки: ' + BA.money(BA.S.game.best) + '</span>' : '') + '</div>';
        } else {
          if (s.offer) {
            const o = s.offer;
            h += '<div class="offer"><div class="eyebrow">Term sheet</div><b style="font:700 1.2rem var(--f-display)">' + e(o.who) + '</b><div>Инвестиции: <b>' + BA.money(o.amt) + '</b> · pre-money ' + BA.money(o.pre) + ' · доля ' + Math.round(o.pct * 100) + '%</div><div>Ликвидационная привилегия: <b>' + o.pref + '×' + (o.part ? ', с участием' : ', без участия') + '</b>' + (o.pref > 1 || o.part ? ' <span class="badge r">жёсткое условие</span>' : '') + '</div>' +
              '<div class="btnrow"><button class="btn small" id="gAcc">Принять</button><button class="btn small quiet" id="gRej">Отказать</button></div></div>';
          }
          h += '<div class="field"><label>Реклама в месяц: <span class="num">' + BA.money(dec.mkt) + '</span></label><input type="range" id="gMkt" min="0" max="4000000" step="100000" value="' + dec.mkt + '" style="--p:' + (dec.mkt / 4e6 * 100) + '%"></div>';
          h += '<div class="field"><label>Цена подписки</label>' + seg('price', PRICES.map(function (p) { return [p, BA.n(p) + ' ₽']; }), dec.price) + '</div>';
          h += '<div class="field"><label>Найм в этом месяце</label>' + seg('hire', [['none', 'Никого'], ['dev', '+ Разработчик'], ['sales', '+ Продажи'], ['sup', '+ Поддержка'], ['fire', 'Сократить']], dec.hire) + '<span class="small muted">Команда: ' + s.team.dev + ' разраб. · ' + s.team.sales + ' продажи · ' + s.team.sup + ' поддержка · ФОТ ' + BA.money(c.team) + '</span></div>';
          h += '<div class="field"><label>Особое действие</label>' + seg('act', [['none', 'Ничего'], ['feature', 'Фича-рывок'], ['raise', 'Искать инвестора'], ['loan', 'Взять кредит']], dec.act) + '<span class="small muted">' + ({ none: 'Работаем в обычном режиме.', feature: '1,5 млн ₽ подрядчикам: +6 к качеству сразу.', raise: 'Месяц встреч с инвесторами: разработка идёт медленнее, предложение не гарантировано.', loan: 'Банк даст до 6 месячных выручек. Проценты 1,8% в месяц.' })[dec.act] + '</span></div>';
          h += '<button class="btn" id="gNext">Прожить месяц ' + ic('arrow') + '</button>';
          h += '<div class="small muted">Подсказка: сначала доведи качество до 60+, потом разгоняй рекламу. Следи, чтобы runway не падал ниже 6 месяцев.</div>';
        }
        h += '</div></div>';
        root.innerHTML = h;
        bind();
      }
      function cell(l, v, cls) { return '<div><small>' + l + '</small><b class="' + cls + '">' + v + '</b></div>'; }
      function bind() {
        const q = function (x) { return root.querySelector(x); };
        if (q('#gNew')) q('#gNew').onclick = function () { s = newState(); dec = { mkt: 3e5, price: 3000, hire: 'none', act: 'none' }; draw(); };
        if (q('#gMkt')) q('#gMkt').oninput = function () { dec.mkt = +this.value; this.style.setProperty('--p', (dec.mkt / 4e6 * 100) + '%'); this.previousElementSibling.querySelector('.num').textContent = BA.money(dec.mkt); };
        root.querySelectorAll('[data-seg]').forEach(function (g) {
          g.querySelectorAll('button').forEach(function (b) {
            b.onclick = function () { const k = g.getAttribute('data-seg'), v = b.getAttribute('data-v'); dec[k] = k === 'price' ? +v : v; draw(); };
          });
        });
        if (q('#gAcc')) q('#gAcc').onclick = function () { accept(s); draw(); };
        if (q('#gRej')) q('#gRej').onclick = function () { s.log.unshift(['ev', 'Ты отказал инвестору. Доля сохранена, но и денег нет.']); s.offer = null; draw(); };
        if (q('#gNext')) q('#gNext').onclick = function () {
          if (s.offer) { s.log.unshift(['ev', 'Предложение инвестора сгорело: ты не ответил вовремя.']); s.offer = null; }
          step(s, dec); dec.hire = 'none'; dec.act = 'none';
          if (s.m === 1) BA.award('game-start', 10, 'первый месяц стартапа');
          draw();
        };
      }
      draw();
    }
  };
})();
