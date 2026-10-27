/* Симуляторы для уроков уровня MBA: экономика, решения, корпоративные финансы, операции */
(function () {
  'use strict';
  const BA = window.BA, e = BA.esc, ic = BA.icon;
  const L = BA.lineChart, N = BA.n, M = BA.money;
  const mln = function (x) { return BA.n(x, 1) + ' млн ₽'; };

  /* ============ Основы экономики ============ */
  BA.sim('market', {
    title: 'Спрос, предложение и равновесная цена', group: 'Основы экономики', lesson: 'x3-1',
    desc: 'Сдвигай спрос и предложение и смотри, как рынок находит новую цену и объём.',
    inputs: [
      { id: 'd', l: 'Доходы и интерес покупателей', min: -30, max: 30, step: 1, v: 0, h: 'Плюс — спрос растёт (кривая вправо), минус — падает' },
      { id: 's', l: 'Затраты производителей', min: -30, max: 30, step: 1, v: 0, h: 'Плюс — сырьё и логистика дорожают (кривая предложения влево)' },
      { id: 'b', l: 'Чувствительность спроса к цене', min: 0.4, max: 2, step: 0.1, v: 0.9, f: 'n1', h: 'Больше — кривая спроса круче: покупатели меньше реагируют на цену' }
    ],
    presets: [{ n: 'Исходный рынок', v: { d: 0, s: 0, b: 0.9 } }, { n: 'Бум спроса', v: { d: 25, s: 0, b: 0.9 } }, { n: 'Дорогое сырьё', v: { d: 0, s: 25, b: 0.9 } }, { n: 'Товар первой необходимости', v: { d: 0, s: 25, b: 2 } }],
    calc: function (v) {
      const q0 = 90 / (0.9 + 0.8), p0 = 10 + 0.8 * q0;
      const q = Math.max(0, (90 + v.d - v.s) / (v.b + 0.8)), p = 10 + v.s + 0.8 * q;
      const dem = [], sup = [], dem0 = [], sup0 = [];
      for (let x = 0; x <= 100; x += 2) {
        dem.push([x, 100 + v.d - v.b * x]); sup.push([x, 10 + v.s + 0.8 * x]);
        dem0.push([x, 100 - 0.9 * x]); sup0.push([x, 10 + 0.8 * x]);
      }
      const dq = q - q0, dp = p - p0;
      let msg;
      if (Math.abs(dq) < 0.5 && Math.abs(dp) < 0.5) msg = ['', 'Исходное равновесие. Сдвинь спрос или затраты и посмотри, как меняются цена и объём.'];
      else if (dp > 0 && dq > 0) msg = ['good', 'Цена и объём выросли **вместе** — признак роста спроса. Продавцы зарабатывают больше и на цене, и на количестве.'];
      else if (dp > 0 && dq < 0) msg = ['warn', 'Цена выросла, а объём упал — признак роста затрат (сдвиг предложения). Чем круче кривая спроса, тем больше подорожания переходит покупателям.'];
      else if (dp < 0 && dq < 0) msg = ['bad', 'Цена и объём упали вместе — спрос сократился.'];
      else msg = ['good', 'Цена упала, а объём вырос — производство подешевело. Выигрывают покупатели.'];
      return {
        k: [['Равновесная цена', p, 'rub0'], ['Объём рынка', N(q, 1) + ' тыс. шт.'], ['Изменение цены', (dp >= 0 ? '+' : '') + N(dp / p0 * 100, 1) + '%', null, dp > 0.5 ? 'warn' : ''], ['Изменение объёма', (dq >= 0 ? '+' : '') + N(dq / q0 * 100, 1) + '%']],
        chart: L({ series: [{ data: dem0, color: 'var(--blue)', dash: true, end: false, width: 1.2 }, { data: sup0, color: 'var(--seal)', dash: true, end: false, width: 1.2 }, { data: dem, color: 'var(--blue)', end: false }, { data: sup, color: 'var(--seal)', end: false }],
          xMin: 0, xMax: 100, yMin: 0, yMax: 140, xLabel: 'количество, тыс. шт.', points: [{ x: q, y: p, label: N(p) + ' ₽' }] }),
        legend: [{ name: 'Спрос', color: 'var(--blue)' }, { name: 'Предложение', color: 'var(--seal)' }, { name: 'пунктир — исходный рынок', color: 'var(--ink-3)' }],
        v: msg
      };
    }
  });

  BA.sim('pricewar', {
    title: 'Ценовая война: сыграй с конкурентом', group: 'Основы экономики', lesson: 'x3-4', kind: 'game',
    desc: 'Две заправки на одной трассе. 10 раундов: держать цену или снизить? Конкурент играет по своей тайной стратегии.',
    render: function (root, touch) {
      const PAY = { hh: [300, 300], hc: [100, 450], ch: [450, 100], cc: [200, 200] };
      const STR = [
        { n: 'Око за око', d: 'начинает с сотрудничества и повторяет твой прошлый ход', f: function (h) { return h.length ? h[h.length - 1].me : 'h'; } },
        { n: 'Злопамятный', d: 'сотрудничает, пока ты ни разу не снизил цену, а потом снижает до конца игры', f: function (h) { return h.some(function (r) { return r.me === 'c'; }) ? 'c' : 'h'; } },
        { n: 'Агрессор', d: 'всегда снижает цену', f: function () { return 'c'; } },
        { n: 'Простак', d: 'всегда держит цену, что бы ты ни делал', f: function () { return 'h'; } }
      ];
      let st, hist;
      root.innerHTML = '<div class="sim-body"><div class="sim-in"><div class="btnrow" style="flex-direction:column;align-items:stretch;gap:10px">' +
        '<button class="btn" data-m="h">Держать 60 ₽</button><button class="btn ghost" data-m="c">Снизить до 57 ₽</button>' +
        '<button class="btn quiet small" data-new>' + ic('dice', 'ico') + 'Новый соперник</button></div>' +
        '<div class="hint" style="margin-top:12px;font-size:.82rem;color:var(--ink-3)">Прибыль за день, тыс. ₽ (ты / конкурент): обе держат — 300 / 300; ты снизил — 450 / 100; он снизил — 100 / 450; обе снизили — 200 / 200.</div></div>' +
        '<div class="sim-out"><div class="kpis"></div><div class="chart"></div><div class="verdict"></div></div></div>';
      const kp = root.querySelector('.kpis'), ch = root.querySelector('.chart'), vd = root.querySelector('.verdict');
      function start() { st = STR[Math.floor(Math.random() * STR.length)]; hist = []; draw(); }
      function draw() {
        const me = hist.reduce(function (a, r) { return a + r.p[0]; }, 0), op = hist.reduce(function (a, r) { return a + r.p[1]; }, 0), done = hist.length >= 10;
        kp.innerHTML = '<div class="kpi"><small>Раунд</small><b>' + Math.min(hist.length + (done ? 0 : 1), 10) + ' из 10</b></div><div class="kpi ' + (me >= op ? 'good' : 'bad') + '"><small>Твоя прибыль</small><b>' + N(me) + ' тыс. ₽</b></div><div class="kpi"><small>Конкурент</small><b>' + N(op) + ' тыс. ₽</b></div>';
        ch.innerHTML = hist.length ? '<div class="pw-log">' + hist.map(function (r, k) {
          return '<div class="pw-row"><span class="tm">' + (k + 1) + '</span><span class="pw-c ' + (r.me === 'h' ? 'h' : 'c') + '">ты: ' + (r.me === 'h' ? '60 ₽' : '57 ₽') + '</span><span class="pw-c ' + (r.op === 'h' ? 'h' : 'c') + '">он: ' + (r.op === 'h' ? '60 ₽' : '57 ₽') + '</span><b>+' + r.p[0] + '</b></div>';
        }).join('') + '</div>' : '<p class="muted" style="margin:0">Сделай первый ход. Максимум за 10 раундов вместе — 6 000 тыс. ₽, если обе держат цену.</p>';
        root.querySelectorAll('[data-m]').forEach(function (b) { b.disabled = done; });
        if (done) {
          const tot = me + op;
          vd.className = 'verdict ' + (me >= 2800 ? 'good' : me >= 2000 ? 'warn' : 'bad');
          vd.innerHTML = BA.inline('Соперник играл по стратегии **«' + st.n + '»**: ' + st.d + '. Вместе вы заработали ' + N(tot) + ' из 6 000 возможных. ' +
            (st.n === 'Агрессор' ? 'Против агрессора сотрудничество не работает: лучший ответ — тоже снижать.' : st.n === 'Простак' ? 'Против простака снижение даёт больше в моменте — но в реальном рынке такой соперник быстро меняет тактику.' : 'Против ответных стратегий выгодно держать цену: снижение даёт разовый выигрыш, а дальше ответная война съедает прибыль обоих.'));
        } else { vd.className = 'verdict'; vd.innerHTML = BA.inline('Подсказка: в повторяющейся игре важно, **как соперник отвечает** на твои ходы. Попробуй понять его стратегию.'); }
      }
      root.querySelectorAll('[data-m]').forEach(function (b) {
        b.onclick = function () {
          if (hist.length >= 10) return;
          const m = b.getAttribute('data-m'), o = st.f(hist);
          hist.push({ me: m, op: o, p: PAY[m + o] }); draw(); touch();
        };
      });
      root.querySelector('[data-new]').onclick = function () { start(); };
      start();
    }
  });

  /* ============ Мышление и решения ============ */
  BA.sim('ev', {
    title: 'Ожидаемая ценность и риск разорения', group: 'Мышление и решения', lesson: 'x4-3',
    desc: 'Решение о запуске продукта: три исхода с вероятностями. Положительное среднее ещё не значит, что ставка разумна.',
    inputs: [
      { id: 'pb', l: 'Вероятность большого успеха', min: 0, max: 0.7, step: 0.05, v: 0.3, f: 'pct0' },
      { id: 'win', l: 'Выигрыш при успехе, млн ₽', min: 1, max: 60, step: 1, v: 20 },
      { id: 'pf', l: 'Вероятность провала', min: 0, max: 0.7, step: 0.05, v: 0.3, f: 'pct0', h: 'Остальное — средний исход (+3 млн ₽)' },
      { id: 'loss', l: 'Потеря при провале, млн ₽', min: 1, max: 40, step: 1, v: 6 },
      { id: 'cap', l: 'Свободный капитал компании, млн ₽', min: 2, max: 50, step: 1, v: 15, h: 'Сколько можно потерять и выжить' }
    ],
    presets: [{ n: 'Пример из урока', v: { pb: 0.3, win: 20, pf: 0.3, loss: 6, cap: 15 } }, { n: 'Ставка «всё или ничего»', v: { pb: 0.6, win: 40, pf: 0.3, loss: 25, cap: 20 } }, { n: 'Осторожный запуск', v: { pb: 0.15, win: 15, pf: 0.4, loss: 2, cap: 15 } }],
    calc: function (v) {
      const pm = 1 - v.pb - v.pf, ok = pm >= -1e-9, mid = 3;
      const ev = v.pb * v.win + Math.max(0, pm) * mid - v.pf * v.loss, ruin = v.loss >= v.cap;
      const surv10 = ruin ? Math.pow(1 - v.pf, 10) : 1;
      return {
        k: [['Ожидаемая ценность', ok ? (ev >= 0 ? '+' : '') + mln(ev) : '—', null, !ok ? '' : ev > 0 ? 'good' : 'bad'], ['Вероятность среднего исхода', ok ? BA.pct(pm, 0) : 'сумма > 100%', null, ok ? '' : 'bad'], ['Провал разоряет компанию?', ruin ? 'да' : 'нет', null, ruin ? 'bad' : 'good'], ['Шанс пережить 10 таких ставок', BA.pct(surv10, 0), null, surv10 < 0.5 ? 'bad' : surv10 < 0.9 ? 'warn' : 'good']],
        chart: ok ? BA.barChart({ h: 220, items: [{ label: 'Успех', sub: BA.pct(v.pb, 0), value: v.pb * v.win, color: 'var(--money)' }, { label: 'Средний', sub: BA.pct(pm, 0), value: pm * mid, color: 'var(--blue)' }, { label: 'Провал', sub: BA.pct(v.pf, 0), value: -v.pf * v.loss }, { label: 'Итого EV', value: ev, color: 'var(--gold)' }], fmt: function (x) { return N(x, 1); } }) : '',
        v: !ok ? ['bad', 'Вероятности успеха и провала в сумме больше 100% — уменьши одну из них.'] :
          ruin && ev > 0 ? ['warn', 'Среднее положительное, но провал **уничтожает компанию**. Если делать такие ставки регулярно, шанс дожить до «среднего» — ' + BA.pct(surv10, 0) + ' за 10 раз. Уменьши ставку: запусти дешевле, найди партнёра, проверь спрос заранее.'] :
            ev > 0 ? ['good', 'Ставка с положительной ожидаемой ценностью, и худший исход компания переживёт. Такие решения стоит принимать — и много раз.'] :
              ['bad', 'Ожидаемая ценность отрицательна: в среднем решение теряет деньги. Нужно повысить шансы успеха или снизить цену провала.']
      };
    }
  });

  BA.sim('samples', {
    title: 'Маленькие выборки обманывают', group: 'Мышление и решения', lesson: 'x4-4',
    desc: 'У всех 20 магазинов одинаковая настоящая конверсия. Посмотри, какой разброс покажут замеры на маленьком и большом числе посетителей.',
    inputs: [
      { id: 'n', l: 'Посетителей в замере у каждого магазина', min: 10, max: 2000, step: 10, v: 30 },
      { id: 'p', l: 'Настоящая конверсия у всех', min: 0.02, max: 0.5, step: 0.01, v: 0.1, f: 'pct0' }
    ],
    presets: [{ n: '30 посетителей', v: { n: 30, p: 0.1 } }, { n: '300 посетителей', v: { n: 300, p: 0.1 } }, { n: '2000 посетителей', v: { n: 2000, p: 0.1 } }],
    calc: function (v) {
      const obs = [];
      for (let i = 0; i < 20; i++) { let c = 0; for (let j = 0; j < v.n; j++) if (Math.random() < v.p) c++; obs.push(c / v.n); }
      const mn = Math.min.apply(null, obs), mx = Math.max.apply(null, obs);
      return {
        k: [['Худший магазин', BA.pct(mn, 1), null, 'bad'], ['Лучший магазин', BA.pct(mx, 1), null, 'good'], ['Разница лучшего и худшего', N(mx / Math.max(mn, 0.001), 1) + '×']],
        chart: BA.barChart({ h: 230, items: obs.map(function (o, k) { return { label: String(k + 1), value: o * 100, color: Math.abs(o - v.p) > v.p * 0.4 ? 'var(--gold)' : 'var(--money)' }; }), fmt: function (x) { return N(x, 0) + '%'; } }),
        v: v.n < 200 ? ['warn', 'Все магазины **одинаковые**, но замеры выглядят как «лучшие» и «худшие». Если бы ты наградил лидеров и наказал отстающих, ты наградил бы случайность. Каждое движение ползунка — новый случайный замер.'] :
          ['good', 'На большой выборке замеры собираются вокруг настоящего значения ' + BA.pct(v.p, 0) + '. Выводы о различиях можно делать только тогда, когда данных достаточно.']
      };
    }
  });

  /* ============ Финансы ============ */
  BA.sim('dupont', {
    title: 'Формула DuPont: из чего сделан ROE', group: 'Финансы', lesson: 'x11-5',
    desc: 'Одинаковую доходность владельцев можно получить маржой, оборотом или долгом. Риски у этих путей разные.',
    inputs: [
      { id: 'm', l: 'Чистая маржа', min: 0.005, max: 0.3, step: 0.005, v: 0.05, f: 'pct' },
      { id: 't', l: 'Оборачиваемость активов', min: 0.1, max: 5, step: 0.1, v: 2, f: 'x', h: 'Выручка / активы: сколько раз в год активы «оборачиваются» в выручку' },
      { id: 'l', l: 'Финансовый рычаг', min: 1, max: 12, step: 0.5, v: 2.5, f: 'x', h: 'Активы / собственный капитал: 2× — половина активов на долг' }
    ],
    presets: [{ n: 'Ювелирный бренд', v: { m: 0.2, t: 0.5, l: 2 } }, { n: 'Дискаунтер', v: { m: 0.025, t: 4, l: 2 } }, { n: 'Банк', v: { m: 0.2, t: 0.1, l: 10 } }],
    calc: function (v) {
      const roa = v.m * v.t, roe = roa * v.l, debt = 1 - 1 / v.l;
      return {
        k: [['ROA', BA.pct(roa, 1)], ['ROE', BA.pct(roe, 1), null, roe >= 0.15 ? 'good' : roe >= 0.08 ? '' : 'warn'], ['Доля долга в активах', BA.pct(debt, 0), null, debt > 0.75 ? 'bad' : debt > 0.5 ? 'warn' : '']],
        chart: BA.barChart({ h: 220, items: [{ label: 'Маржа', value: v.m * 100, color: 'var(--blue)' }, { label: 'ROA', sub: 'маржа × оборот', value: roa * 100, color: 'var(--money)' }, { label: 'ROE', sub: 'ROA × рычаг', value: roe * 100, color: 'var(--gold)' }], fmt: function (x) { return N(x, 1) + '%'; } }),
        v: v.l >= 6 ? ['warn', 'Большая часть ROE создаётся **долгом**. Это хрупко: падение маржи на пару пунктов при таком рычаге быстро превращает прибыль владельцев в убыток. Так устроены банки — поэтому их строго регулируют.'] :
          v.t >= 3 ? ['good', 'Доходность создаётся **оборотом**: тонкая маржа, но активы работают много раз в год. Так зарабатывают дискаунтеры и продуктовые сети — нужна сильная операционная эффективность.'] :
            ['good', 'Доходность создаётся **маржой**: каждая продажа приносит много. Так зарабатывают сильные бренды и уникальные продукты — нужно защищать ценность бренда.']
      };
    }
  });

  /* ============ Корпоративные финансы ============ */
  function npvOf(inv, cf, n, r) { let s = -inv; for (let t = 1; t <= n; t++) s += cf / Math.pow(1 + r, t); return s; }
  BA.sim('npv', {
    title: 'NPV, IRR и окупаемость проекта', group: 'Корпоративные финансы', lesson: 'x13-2',
    desc: 'Вложение сейчас и одинаковый денежный поток каждый год. Создаёт ли проект стоимость?',
    inputs: [
      { id: 'inv', l: 'Вложение сейчас, млн ₽', min: 1, max: 50, step: 0.5, v: 10, f: 'n1' },
      { id: 'cf', l: 'Денежный поток в год, млн ₽', min: 0.5, max: 15, step: 0.1, v: 3, f: 'n1' },
      { id: 'n', l: 'Срок проекта, лет', min: 1, max: 15, step: 1, v: 5 },
      { id: 'r', l: 'Ставка дисконтирования', min: 0.03, max: 0.4, step: 0.01, v: 0.15, f: 'pct0', h: 'Доходность альтернативных вложений с похожим риском' }
    ],
    presets: [{ n: 'Пример из урока', v: { inv: 10, cf: 3, n: 5, r: 0.15 } }, { n: 'Долгий проект', v: { inv: 20, cf: 3, n: 15, r: 0.15 } }, { n: 'Высокий риск', v: { inv: 10, cf: 3, n: 5, r: 0.3 } }],
    calc: function (v) {
      const npv = npvOf(v.inv, v.cf, v.n, v.r);
      let lo = -0.99, hi = 5, irr = null;
      if (npvOf(v.inv, v.cf, v.n, 0) > 0) { for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (npvOf(v.inv, v.cf, v.n, mid) > 0) lo = mid; else hi = mid; } irr = (lo + hi) / 2; }
      const pb = v.inv / v.cf;
      const pts = []; for (let r = 0; r <= 0.5001; r += 0.01) pts.push([r * 100, npvOf(v.inv, v.cf, v.n, r)]);
      return {
        k: [['NPV', (npv >= 0 ? '+' : '') + mln(npv), null, npv >= 0 ? 'good' : 'bad'], ['IRR', irr == null ? 'нет' : BA.pct(irr, 1), null, irr != null && irr > v.r ? 'good' : 'bad'], ['Простая окупаемость', pb <= v.n ? N(pb, 1) + ' г.' : 'не окупится', null, pb > v.n ? 'bad' : '']],
        chart: L({ series: [{ data: pts, color: 'var(--money)', end: false }], xMin: 0, xMax: 50, hlines: [{ y: 0, label: 'NPV = 0', color: 'var(--ink-3)' }], vlines: [{ x: v.r * 100, label: 'ставка ' + N(v.r * 100) + '%' }], points: irr != null && irr <= 0.5 ? [{ x: irr * 100, y: 0, label: 'IRR', color: 'var(--gold)' }] : [], xLabel: 'ставка дисконтирования, %', yFmt: function (x) { return N(x, 0); } }),
        v: npv >= 0 ? ['good', 'NPV положительный: проект зарабатывает больше, чем стоит капитал, и **создаёт стоимость**. IRR выше ставки — это то же самое, сказанное другими словами.'] :
          ['bad', 'NPV отрицательный: при такой ставке деньги выгоднее вложить в альтернативу. Посмотри, как сильно результат зависит от ставки и срока: точка пересечения кривой с нулём — это IRR.']
      };
    }
  });

  BA.sim('wacc', {
    title: 'WACC и доля долга', group: 'Корпоративные финансы', lesson: 'x13-3',
    desc: 'Долг дешевле капитала акционеров и даёт налоговый щит, но с ростом долга дорожает всё.',
    inputs: [
      { id: 'ce0', l: 'Доходность акционеров без долга', min: 0.1, max: 0.4, step: 0.01, v: 0.22, f: 'pct0' },
      { id: 'cd', l: 'Ставка по кредиту', min: 0.05, max: 0.3, step: 0.01, v: 0.16, f: 'pct0' },
      { id: 't', l: 'Налог на прибыль', min: 0, max: 0.3, step: 0.01, v: 0.25, f: 'pct0' },
      { id: 'w', l: 'Доля долга в капитале', min: 0, max: 0.85, step: 0.05, v: 0.3, f: 'pct0' }
    ],
    calc: function (v) {
      function at(w) {
        const de = w / (1 - w), ce = v.ce0 + (v.ce0 - v.cd) * (1 - v.t) * de;
        const cd = v.cd + Math.pow(Math.max(0, w - 0.35), 2) * 0.9;
        return { ce: ce, cd: cd, wacc: (1 - w) * ce + w * cd * (1 - v.t) };
      }
      const cur = at(v.w), pts = []; let best = { w: 0, x: 1 };
      for (let w = 0; w <= 0.851; w += 0.025) { const a = at(w); pts.push([w * 100, a.wacc * 100]); if (a.wacc < best.x) best = { w: w, x: a.wacc }; }
      return {
        k: [['Цена долга после налога', BA.pct(cur.cd * (1 - v.t), 1)], ['Требуемая доходность акционеров', BA.pct(cur.ce, 1)], ['WACC', BA.pct(cur.wacc, 1), null, Math.abs(v.w - best.w) <= 0.06 ? 'good' : 'warn'], ['Минимум WACC', 'при ~' + N(best.w * 100) + '% долга']],
        chart: L({ series: [{ data: pts, color: 'var(--money)', end: false }], xMin: 0, xMax: 85, vlines: [{ x: v.w * 100, label: 'сейчас' }], points: [{ x: best.w * 100, y: best.x * 100, label: 'минимум', color: 'var(--gold)' }], xLabel: 'доля долга, %', yFmt: function (x) { return N(x, 0) + '%'; } }),
        v: v.w < best.w - 0.06 ? ['', 'Долга мало: компания недоиспользует дешёвый капитал и налоговый щит. Но помни: модель упрощённая, а у молодых компаний с нестабильной прибылью долг гораздо опаснее.'] :
          v.w > best.w + 0.06 ? ['bad', 'Долга слишком много: кредиторы требуют премию за риск, акционеры — тоже. Растёт риск банкротства, и WACC идёт вверх. Это и есть **теория компромисса**.'] :
            ['good', 'Около оптимума: выгода налогового щита уравновешена ростом риска. В реальности точку ищут с запасом, потому что прибыль колеблется.']
      };
    }
  });

  BA.sim('leverage', {
    title: 'Финансовый рычаг: долг усиливает и прибыль, и убытки', group: 'Корпоративные финансы', lesson: 'x13-4',
    desc: 'Бизнес на 10 млн ₽ активов. Сравни доходность владельца без долга и с долгом при разной рентабельности.',
    inputs: [
      { id: 'roa', l: 'Операционная рентабельность активов', min: -0.1, max: 0.4, step: 0.01, v: 0.2, f: 'pct0' },
      { id: 'w', l: 'Доля заёмных денег', min: 0, max: 0.85, step: 0.05, v: 0.6, f: 'pct0' },
      { id: 'r', l: 'Ставка по кредиту', min: 0.05, max: 0.3, step: 0.01, v: 0.14, f: 'pct0' }
    ],
    presets: [{ n: 'Хороший год', v: { roa: 0.2, w: 0.6, r: 0.14 } }, { n: 'Плохой год', v: { roa: 0.06, w: 0.6, r: 0.14 } }, { n: 'Без долга', v: { roa: 0.2, w: 0, r: 0.14 } }],
    calc: function (v) {
      const t = 0.25;
      function roe(a, w) { const pre = a * 10 - v.r * w * 10, net = pre > 0 ? pre * (1 - t) : pre; return net / (10 * (1 - w)); }
      const r0 = roe(v.roa, 0), r1 = roe(v.roa, v.w), s0 = [], s1 = [];
      for (let a = -0.1; a <= 0.4001; a += 0.01) { s0.push([a * 100, roe(a, 0) * 100]); s1.push([a * 100, roe(a, v.w) * 100]); }
      return {
        k: [['ROE без долга', BA.pct(r0, 1), null, r0 >= 0 ? '' : 'bad'], ['ROE с долгом', BA.pct(r1, 1), null, r1 > r0 ? 'good' : 'bad'], ['Эффект рычага', (r1 - r0 >= 0 ? '+' : '') + N((r1 - r0) * 100, 1) + ' п.п.', null, r1 > r0 ? 'good' : 'bad']],
        chart: L({ series: [{ data: s0, color: 'var(--ink-3)', end: false }, { data: s1, color: 'var(--money)', end: false }], xMin: -10, xMax: 40, hlines: [{ y: 0, color: 'var(--ink-3)' }], vlines: [{ x: v.r * 100, label: 'ставка', color: 'var(--seal)' }, { x: v.roa * 100, label: 'сейчас' }], xLabel: 'рентабельность активов, %', yFmt: function (x) { return N(x, 0) + '%'; } }),
        legend: [{ name: 'Без долга', color: 'var(--ink-3)' }, { name: 'С долгом ' + N(v.w * 100) + '%', color: 'var(--money)' }],
        v: v.w === 0 ? ['', 'Без долга доходность владельца просто повторяет рентабельность бизнеса за вычетом налога. Добавь долг и посмотри, как наклон линии становится круче.'] :
          v.roa > v.r ? ['good', 'Бизнес зарабатывает больше, чем стоит долг, — рычаг **усиливает** доходность владельца. Но посмотри на график слева от линии ставки: там долг так же усиливает убытки.'] :
            ['bad', 'Рентабельность ниже ставки по кредиту — долг **съедает** доходность владельца. При убытке проценты всё равно надо платить, и денег может не хватить.']
      };
    }
  });

  /* ============ Операции ============ */
  BA.sim('eoq', {
    title: 'Сколько заказывать за раз: EOQ', group: 'Операции', lesson: 'x16-3',
    desc: 'Частые мелкие заказы дороги в оформлении, редкие крупные — в хранении. Найди баланс.',
    inputs: [
      { id: 'd', l: 'Годовой спрос, шт.', min: 1000, max: 50000, step: 500, v: 12000 },
      { id: 's', l: 'Затраты на один заказ', min: 500, max: 30000, step: 500, v: 6000, f: 'rub0', h: 'Оформление, доставка, приёмка' },
      { id: 'h', l: 'Хранение единицы в год', min: 10, max: 1000, step: 10, v: 100, f: 'rub0', h: 'Склад, замороженные деньги, порча' },
      { id: 'q', l: 'Твой размер заказа, шт.', min: 100, max: 6000, step: 50, v: 3000 }
    ],
    presets: [{ n: 'Пример из урока', v: { d: 12000, s: 6000, h: 100, q: 3000 } }, { n: 'Дорогое хранение', v: { d: 12000, s: 6000, h: 600, q: 3000 } }],
    calc: function (v) {
      const eoq = Math.sqrt(2 * v.d * v.s / v.h), cost = function (q) { return v.d / q * v.s + q / 2 * v.h; };
      const c1 = cost(v.q), c0 = cost(eoq), o = [], hd = [], tot = [];
      for (let q = 100; q <= 6000; q += 50) { o.push([q, v.d / q * v.s]); hd.push([q, q / 2 * v.h]); tot.push([q, cost(q)]); }
      return {
        k: [['Оптимальный заказ (EOQ)', N(eoq) + ' шт.', null, 'good'], ['Заказов в год', N(v.d / eoq, 1)], ['Затраты при твоём заказе', c1, 'rub', c1 > c0 * 1.1 ? 'warn' : 'good'], ['Переплата к оптимуму', c1 - c0, 'rub', c1 - c0 > c0 * 0.1 ? 'bad' : '']],
        chart: L({ series: [{ data: o, color: 'var(--blue)', end: false }, { data: hd, color: 'var(--seal)', end: false }, { data: tot, color: 'var(--money)', end: false }], xMin: 100, xMax: 6000, yMin: 0, yMax: Math.max(cost(100) * 0.6, c0 * 2.2), vlines: [{ x: v.q, label: 'твой заказ' }], points: eoq <= 6000 ? [{ x: eoq, y: c0, label: 'EOQ', color: 'var(--gold)' }] : [], xLabel: 'размер заказа, шт.', yFmt: function (x) { return N(x / 1000) + 'k'; } }),
        legend: [{ name: 'Оформление заказов', color: 'var(--blue)' }, { name: 'Хранение', color: 'var(--seal)' }, { name: 'Всего', color: 'var(--money)' }],
        v: Math.abs(v.q - eoq) / eoq < 0.15 ? ['good', 'Ты около оптимума. Заметь: кривая общих затрат пологая рядом с минимумом — небольшие отклонения от EOQ стоят немного.'] :
          ['warn', 'До оптимума далеко. ' + (v.q > eoq ? 'Партии слишком крупные: деньги заморожены на складе.' : 'Партии слишком мелкие: много денег уходит на оформление и доставку.')]
      };
    }
  });

  BA.sim('bullwhip', {
    title: 'Эффект хлыста в цепочке поставок', group: 'Операции', lesson: 'x16-4',
    desc: 'Магазин → дистрибьютор → производитель → поставщик сырья. Покупатели один раз чуть увеличили спрос. Что происходит с заказами выше по цепочке?',
    inputs: [
      { id: 'j', l: 'Рост спроса покупателей на 5-й неделе', min: 0, max: 0.3, step: 0.01, v: 0.1, f: 'pct0' },
      { id: 'lt', l: 'Срок поставки, недель', min: 1, max: 6, step: 1, v: 2 },
      { id: 'a', l: 'Насколько резко звенья исправляют запас', min: 0.1, max: 0.8, step: 0.05, v: 0.3, f: 'n2', h: '0,8 — почти сразу заказывают всю нехватку, 0,1 — исправляют плавно' },
      { id: 'sh', l: 'Звенья видят реальные продажи (0 — нет, 1 — да)', min: 0, max: 1, step: 1, v: 0 }
    ],
    presets: [{ n: 'Без обмена данными', v: { j: 0.1, lt: 3, a: 0.3, sh: 0 } }, { n: 'Обмен данными', v: { j: 0.1, lt: 3, a: 0.3, sh: 1 } }, { n: 'Короткие поставки и плавные заказы', v: { j: 0.1, lt: 1, a: 0.15, sh: 1 } }],
    calc: function (v) {
      const T = 40, K = 4, dem = [];
      for (let t = 0; t < T; t++) dem.push(100 * (t >= 5 ? 1 + v.j : 1) + 3 * Math.sin(t * 1.3));
      const orders = [];
      let inc = dem;
      for (let k = 0; k < K; k++) {
        let F = 100, onh = 200, pipe = []; const out = [];
        for (let t = 0; t < T + v.lt + 1; t++) pipe.push(t < v.lt ? 100 : 0);
        for (let t = 0; t < T; t++) {
          onh += pipe[t]; onh -= inc[t];
          F += 0.4 * ((v.sh ? dem[t] : inc[t]) - F);
          let ip = onh; for (let u = t + 1; u < t + v.lt + 1 && u < pipe.length; u++) ip += pipe[u];
          const target = F * (v.lt + 1), o = Math.max(0, F + v.a * (target - ip));
          pipe[t + v.lt] += o; out.push(o);
        }
        orders.push(out); inc = out;
      }
      function sd(a) { const m = a.reduce(function (x, y) { return x + y; }, 0) / a.length; return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / a.length); }
      const amp = sd(orders[3]) / Math.max(sd(dem), 0.01), peak = Math.max.apply(null, orders[3]), peakD = Math.max.apply(null, dem);
      const ser = function (a) { return a.map(function (y, t) { return [t, y]; }); };
      return {
        k: [['Пик спроса покупателей', N(peakD) + ' шт.'], ['Пик заказов поставщику сырья', N(peak) + ' шт.', null, peak > peakD * 1.5 ? 'bad' : 'warn'], ['Усиление колебаний', N(amp, 1) + '×', null, amp > 3 ? 'bad' : amp > 1.5 ? 'warn' : 'good']],
        chart: L({ series: [{ data: ser(dem), color: 'var(--ink)', end: false, width: 2.6 }, { data: ser(orders[0]), color: 'var(--blue)', end: false, width: 1.6 }, { data: ser(orders[1]), color: 'var(--money)', end: false, width: 1.6 }, { data: ser(orders[3]), color: 'var(--seal)', end: false, width: 2 }], xMin: 0, xMax: T - 1, yMin: 0, xLabel: 'неделя' }),
        legend: [{ name: 'Покупатели', color: 'var(--ink)' }, { name: 'Заказы магазина', color: 'var(--blue)' }, { name: 'Заказы дистрибьютора', color: 'var(--money)' }, { name: 'Заказы поставщику сырья', color: 'var(--seal)' }],
        v: amp > 2 ? ['bad', 'Покупатели изменили спрос на ' + N(v.j * 100) + '%, а заказы в начале цепочки скачут в разы сильнее. Каждое звено видит только заказы соседа и «перестраховывается». Попробуй включить обмен данными, сократить срок поставки или сделать исправление запаса плавнее.'] :
          ['good', 'Колебания почти не усиливаются: звенья видят реальный спрос, поставки быстрые, заказы плавные. Так лечат эффект хлыста на практике.']
      };
    }
  });

  /* ============ Управление и риски ============ */
  BA.sim('risk', {
    title: 'Окупается ли защита от риска', group: 'Управление и риски', lesson: 'x23-2',
    desc: 'Ожидаемый ущерб до и после меры защиты — и проверка, не смертелен ли риск для компании.',
    inputs: [
      { id: 'p', l: 'Вероятность события за год', min: 0.01, max: 0.6, step: 0.01, v: 0.1, f: 'pct0' },
      { id: 'loss', l: 'Ущерб, если случится, млн ₽', min: 0.1, max: 30, step: 0.1, v: 4, f: 'n1' },
      { id: 'red', l: 'Мера снижает вероятность на', min: 0, max: 1, step: 0.05, v: 0.8, f: 'pct0' },
      { id: 'cost', l: 'Стоимость меры в год, тыс. ₽', min: 0, max: 3000, step: 10, v: 150 },
      { id: 'cap', l: 'Запас прочности компании, млн ₽', min: 0.5, max: 50, step: 0.5, v: 8, f: 'n1', h: 'Сколько денег можно потерять без закрытия' }
    ],
    presets: [{ n: 'Пример из урока', v: { p: 0.1, loss: 4, red: 0.8, cost: 150, cap: 8 } }, { n: 'Редкая катастрофа', v: { p: 0.02, loss: 30, red: 0.9, cost: 400, cap: 10 } }, { n: 'Частая мелочь', v: { p: 0.5, loss: 0.2, red: 0.5, cost: 120, cap: 10 } }],
    calc: function (v) {
      const before = v.p * v.loss, after = v.p * (1 - v.red) * v.loss, cost = v.cost / 1000, net = before - after - cost, fatal = v.loss >= v.cap;
      return {
        k: [['Ожидаемый ущерб без меры', mln(before)], ['С мерой (ущерб + стоимость)', mln(after + cost)], ['Чистая выгода меры', (net >= 0 ? '+' : '') + N(net * 1000) + ' тыс. ₽', null, net >= 0 ? 'good' : 'bad'], ['Риск смертелен?', fatal ? 'да' : 'нет', null, fatal ? 'bad' : 'good']],
        chart: BA.barChart({ h: 220, items: [{ label: 'Без меры', value: before, color: 'var(--seal)' }, { label: 'Ущерб с мерой', value: after, color: 'var(--blue)' }, { label: 'Стоимость меры', value: cost, color: 'var(--gold)' }, { label: 'Итого с мерой', value: after + cost, color: 'var(--money)' }], fmt: function (x) { return N(x, 2); } }),
        v: fatal && net < 0 ? ['warn', 'По среднему мера не окупается, но событие **уничтожит компанию**. От катастроф защищаются, даже переплачивая: страховка, резерв, отказ от рискованной деятельности.'] :
          fatal ? ['good', 'Мера окупается и защищает от катастрофы — берём без раздумий.'] :
            net >= 0 ? ['good', 'Мера окупается: снижает ожидаемый ущерб больше, чем стоит.'] :
              ['', 'Мера стоит дороже, чем экономит, а риск компанию не убьёт. Разумно **принять риск** — осознанно, записав это решение в реестр.']
      };
    }
  });

  /* ============ Маркетинг и продажи ============ */
  BA.sim('seller', {
    title: 'Экономика продавца на маркетплейсе', group: 'Маркетинг и продажи', lesson: 'x9-6',
    desc: 'Что остаётся продавцу с одной продажи после комиссий, логистики, возвратов, рекламы и налога.',
    inputs: [
      { id: 'price', l: 'Цена для покупателя', min: 300, max: 10000, step: 50, v: 2500, f: 'rub0' },
      { id: 'cogs', l: 'Себестоимость с доставкой до склада', min: 100, max: 6000, step: 50, v: 900, f: 'rub0' },
      { id: 'com', l: 'Комиссия площадки', min: 0.03, max: 0.35, step: 0.01, v: 0.2, f: 'pct0' },
      { id: 'log', l: 'Логистика и хранение на один заказ', min: 30, max: 600, step: 10, v: 120, f: 'rub0', h: 'Возврат тоже стоит логистики' },
      { id: 'ret', l: 'Доля возвратов', min: 0, max: 0.6, step: 0.01, v: 0.15, f: 'pct0' },
      { id: 'ads', l: 'Внутренняя реклама, % от выручки', min: 0, max: 0.3, step: 0.01, v: 0.08, f: 'pct0' }
    ],
    presets: [{ n: 'Аксессуары', v: { price: 1200, cogs: 300, com: 0.2, log: 90, ret: 0.05, ads: 0.08 } }, { n: 'Одежда', v: { price: 2500, cogs: 900, com: 0.25, log: 140, ret: 0.4, ads: 0.1 } }, { n: 'Крупная бытовая техника', v: { price: 9000, cogs: 6200, com: 0.1, log: 450, ret: 0.05, ads: 0.05 } }],
    calc: function (v) {
      const lg = v.log * (1 + v.ret) / (1 - v.ret || 0.0001), com = v.com * v.price, ads = v.ads * v.price, tax = 0.06 * v.price;
      const profit = v.price - com - lg - ads - tax - v.cogs, margin = profit / v.price;
      return {
        k: [['Прибыль с одной продажи', profit, 'rub0', profit > 0 ? 'good' : 'bad'], ['Маржа', BA.pct(margin, 0), null, margin >= 0.15 ? 'good' : margin > 0 ? 'warn' : 'bad'], ['Логистика на продажу с учётом возвратов', lg, 'rub0', v.ret > 0.3 ? 'warn' : ''], ['Прибыль на 1000 заказов', profit * 1000 * (1 - v.ret), 'rub']],
        chart: BA.waterfall({ items: [{ label: 'Цена', value: v.price, total: true }, { label: 'Комиссия', value: -com }, { label: 'Логистика', value: -lg }, { label: 'Реклама', value: -ads }, { label: 'Налог 6%', value: -tax }, { label: 'Товар', value: -v.cogs }, { label: 'Остаток', value: profit, total: true }] }),
        v: profit <= 0 ? ['bad', 'Каждая продажа **убыточна**. Большой оборот здесь только ускоряет потери. Пересмотри цену, себестоимость, категорию или схему работы.'] :
          margin < 0.12 ? ['warn', 'Маржа тонкая: любой рост комиссии, ставок рекламы или возвратов уведёт в минус. Налог 6% считается со всей цены продажи (УСН «Доходы»).'] :
            ['good', 'Здоровая экономика. Следи за возвратами и рекламой — они растут незаметно.']
      };
    }
  });
})();
