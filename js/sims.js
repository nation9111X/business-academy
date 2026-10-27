/* Симуляторы: общий движок ползунков + конкретные модели */
(function () {
  'use strict';
  const BA = window.BA, e = BA.esc, ic = BA.icon;

  BA.renderSim = function (el, id) {
    const s = BA.sims[id];
    if (!s) { el.remove(); return; }
    el.classList.add('sim'); el.classList.remove('sim-mount');
    el.innerHTML = '<div class="sim-head"><div><div class="tag">' + ic(s.kind === 'game' ? 'dice' : 'flask') + (s.kind === 'game' ? 'Тренажёр' : 'Симулятор') + '</div><h4>' + e(s.title) + '</h4>' + (s.desc ? '<p>' + BA.inline(s.desc) + '</p>' : '') + '</div>' +
      (s.presets ? '<div class="presets">' + s.presets.map(function (p, k) { return '<button data-p="' + k + '">' + e(p.n) + '</button>'; }).join('') + '</div>' : '') + '</div><div class="sim-root"></div>';
    const root = el.querySelector('.sim-root');
    let touched = false;
    function touch() {
      if (touched) return; touched = true;
      if (!BA.S.sims[id]) { BA.S.sims[id] = 1; BA.save(); }
      BA.award('sim:' + id, 5, 'симулятор «' + s.title + '»');
    }
    if (s.render) { s.render(root, touch); return; }
    // стандартный симулятор: ползунки слева, результат справа
    const v = {};
    s.inputs.forEach(function (i) { v[i.id] = i.v; });
    let h = '<div class="sim-body"><div class="sim-in">';
    s.inputs.forEach(function (i) {
      const rid = 'r-' + id + '-' + i.id;
      h += '<div class="rng"><div class="rng-h"><label for="' + rid + '">' + e(i.l) + '</label><output id="o-' + rid + '"></output></div>' +
        '<input type="range" id="' + rid + '" data-i="' + i.id + '" min="' + i.min + '" max="' + i.max + '" step="' + (i.step || 1) + '" value="' + i.v + '">' + (i.h ? '<div class="hint">' + e(i.h) + '</div>' : '') + '</div>';
    });
    h += '</div><div class="sim-out"><div class="kpis"></div><div class="chart"></div><div class="legend-slot"></div><div class="verdict" hidden></div></div></div>';
    root.innerHTML = h;
    const kp = root.querySelector('.kpis'), ch = root.querySelector('.chart'), lg = root.querySelector('.legend-slot'), vd = root.querySelector('.verdict');
    function upd() {
      s.inputs.forEach(function (i) {
        const r = document.getElementById('r-' + id + '-' + i.id);
        r.style.setProperty('--p', ((v[i.id] - i.min) / (i.max - i.min) * 100) + '%');
        document.getElementById('o-r-' + id + '-' + i.id).textContent = BA.fmt(v[i.id] * (i.mul || 1), i.f);
      });
      const r = s.calc(v);
      kp.innerHTML = (r.k || []).map(function (k) { return '<div class="kpi ' + (k[3] || '') + '"><small>' + e(k[0]) + '</small><b>' + e(typeof k[1] === 'number' ? BA.fmt(k[1], k[2]) : k[1]) + '</b></div>'; }).join('');
      ch.innerHTML = r.chart || ''; ch.hidden = !r.chart;
      lg.innerHTML = r.legend ? BA.legend(r.legend) : '';
      if (r.v) { vd.hidden = false; vd.className = 'verdict ' + (r.v[0] || ''); vd.innerHTML = BA.inline(r.v[1]); } else vd.hidden = true;
    }
    root.querySelectorAll('input[type=range]').forEach(function (r) {
      r.addEventListener('input', function () { v[r.getAttribute('data-i')] = +r.value; upd(); touch(); el.querySelectorAll('.presets button').forEach(function (b) { b.classList.remove('on'); }); });
    });
    el.querySelectorAll('.presets button').forEach(function (b) {
      b.onclick = function () {
        const p = s.presets[+b.getAttribute('data-p')];
        Object.keys(p.v).forEach(function (k) { v[k] = p.v[k]; const r = document.getElementById('r-' + id + '-' + k); if (r) r.value = p.v[k]; });
        el.querySelectorAll('.presets button').forEach(function (x) { x.classList.toggle('on', x === b); });
        upd(); touch();
      };
    });
    upd();
  };

  const L = BA.lineChart, M = BA.money, P = BA.pct, N = BA.n;
  const rub = function (v) { return M(v, ''); };

  /* ============ 1. Основы ============ */
  BA.sim('scale', {
    title: 'Постоянные и переменные издержки', group: 'Основы экономики', lesson: 'l1-4',
    desc: 'Почему себестоимость единицы падает с ростом объёма — и где этот эффект заканчивается.',
    inputs: [
      { id: 'fixed', l: 'Постоянные расходы в месяц', min: 50000, max: 2000000, step: 10000, v: 400000, f: 'rub', h: 'Аренда, оклады, софт — платишь, даже если продаж ноль' },
      { id: 'varc', l: 'Переменные расходы на единицу', min: 20, max: 2000, step: 10, v: 180, f: 'rub0', h: 'Сырьё, упаковка, доставка — растут с каждой продажей' },
      { id: 'price', l: 'Цена единицы', min: 50, max: 4000, step: 10, v: 450, f: 'rub0' },
      { id: 'q', l: 'Объём продаж в месяц, шт.', min: 100, max: 20000, step: 100, v: 2500 }
    ],
    presets: [{ n: 'Кофейня', v: { fixed: 450000, varc: 70, price: 250, q: 3000 } }, { n: 'Онлайн-курс', v: { fixed: 600000, varc: 40, price: 3000, q: 400 } }, { n: 'Пекарня', v: { fixed: 350000, varc: 90, price: 180, q: 4500 } }],
    calc: function (v) {
      const unit = v.varc + v.fixed / v.q, profit = (v.price - v.varc) * v.q - v.fixed, be = v.price > v.varc ? v.fixed / (v.price - v.varc) : Infinity;
      const pts = []; for (let q = 100; q <= 20000; q += 200) pts.push([q, v.varc + v.fixed / q]);
      return {
        k: [['Себестоимость единицы', unit, 'rub0', unit > v.price ? 'bad' : 'good'], ['Прибыль в месяц', profit, 'rub', profit < 0 ? 'bad' : 'good'], ['Точка безубыточности', isFinite(be) ? N(be) + ' шт.' : 'недостижима', null, be > v.q ? 'warn' : '']],
        chart: L({ series: [{ data: pts, name: 'Себестоимость единицы', color: 'var(--money)' }], yMax: Math.max(v.price * 2.2, v.varc * 2), yMin: 0, hlines: [{ y: v.price, label: 'цена ' + N(v.price) + ' ₽', color: 'var(--gold)' }], vlines: [{ x: v.q, label: 'сейчас' }], xLabel: 'штук в месяц', yFmt: function (x) { return N(x); } }),
        v: profit < 0 ? ['bad', 'Пока объём ниже точки безубыточности, каждая проданная единица «не доплачивает» за аренду и оклады. Нужно либо продавать больше, либо поднимать цену, либо резать постоянные расходы.'] :
          ['good', 'Выше точки безубыточности постоянные расходы «размазываются» на большой объём — себестоимость единицы падает. Это и есть **эффект масштаба**. Но обрати внимание: кривая выполаживается, ниже переменных расходов (' + N(v.varc) + ' ₽) не опуститься никогда.']
      };
    }
  });

  /* ============ 2. Рынок ============ */
  BA.sim('tam', {
    title: 'Размер рынка снизу вверх', group: 'Клиент и рынок', lesson: 'l2-3',
    desc: 'Считаем TAM, SAM и SOM не «1% от огромного рынка», а через реальных клиентов и чек.',
    inputs: [
      { id: 'all', l: 'Всего потенциальных клиентов в стране', min: 10000, max: 5000000, step: 10000, v: 1200000, h: 'Например, все кофейни, все малые бизнесы, все родители школьников' },
      { id: 'reach', l: 'Доля, до которой реально дотянуться', min: 0.05, max: 1, step: 0.05, v: 0.35, f: 'pct0', h: 'Регион, язык, канал продаж, подходящий сегмент' },
      { id: 'share', l: 'Доля рынка через 3–5 лет', min: 0.005, max: 0.3, step: 0.005, v: 0.04, f: 'pct', h: 'Честно: сколько ты отобьёшь у конкурентов и привычек' },
      { id: 'check', l: 'Выручка с клиента в год', min: 1000, max: 500000, step: 1000, v: 24000, f: 'rub' }
    ],
    calc: function (v) {
      const tam = v.all * v.check, sam = tam * v.reach, som = sam * v.share;
      return {
        k: [['TAM — весь рынок', tam, 'rub'], ['SAM — доступный', sam, 'rub'], ['SOM — реально твой', som, 'rub', 'good'], ['Клиентов в SOM', N(v.all * v.reach * v.share)]],
        chart: BA.barChart({ items: [{ label: 'TAM', value: tam, color: 'var(--ink-3)' }, { label: 'SAM', value: sam, color: 'var(--blue)' }, { label: 'SOM', value: som, color: 'var(--money)' }], fmt: rub, h: 230 }),
        v: som < 1e8 ? ['warn', 'SOM меньше 100 млн ₽ в год — хороший малый бизнес, но венчурный фонд, скорее всего, не заинтересуется: ему нужны компании, способные вырасти в миллиарды.'] : ['good', 'Посчитано снизу вверх: инвестору понятно, **сколько клиентов** и **какой чек** стоят за цифрой. Это сильнее, чем «рынок 5 трлн, нам хватит 1%».']
      };
    }
  });

  /* ============ 3. Продукт ============ */
  BA.sim('retention', {
    title: 'Кривая удержания и Product-Market Fit', group: 'Продукт и метрики', lesson: 'l3-2',
    desc: 'Если кривая падает к нулю — продукт «протекает». Если выходит на плато — у тебя есть ядро, которому он нужен.',
    inputs: [
      { id: 'd1', l: 'Вернулись в первый месяц', min: 0.1, max: 0.95, step: 0.01, v: 0.55, f: 'pct0' },
      { id: 'decay', l: 'Скорость оттока после', min: 0.05, max: 0.8, step: 0.01, v: 0.35, f: 'pct0', h: 'Как быстро уходят оставшиеся' },
      { id: 'floor', l: 'Плато: доля «ядра» навсегда', min: 0, max: 0.6, step: 0.01, v: 0.18, f: 'pct0', h: 'Клиенты, которым продукт по-настоящему нужен' },
      { id: 'arpu', l: 'Выручка с активного клиента в месяц', min: 100, max: 5000, step: 50, v: 600, f: 'rub0' }
    ],
    presets: [{ n: 'Нет PMF', v: { d1: 0.35, decay: 0.5, floor: 0, arpu: 600 } }, { n: 'Есть ядро', v: { d1: 0.6, decay: 0.3, floor: 0.25, arpu: 600 } }, { n: 'Привычка (как Duolingo)', v: { d1: 0.7, decay: 0.2, floor: 0.4, arpu: 300 } }],
    calc: function (v) {
      const pts = [[0, 1]]; let ltv = v.arpu;
      for (let m = 1; m <= 24; m++) {
        const r = v.floor + (v.d1 - v.floor) * Math.pow(1 - v.decay, m - 1);
        pts.push([m, Math.max(0, r)]); ltv += Math.max(0, r) * v.arpu;
      }
      const r12 = pts[12][1];
      return {
        k: [['Удержание через 12 мес.', r12, 'pct0', r12 > .2 ? 'good' : r12 > .08 ? 'warn' : 'bad'], ['Выручка с клиента за 2 года', ltv, 'rub0']],
        chart: L({ series: [{ data: pts, area: true, color: 'var(--money)' }], yMin: 0, yMax: 1, yFmt: function (x) { return Math.round(x * 100) + '%'; }, xLabel: 'месяц после первой покупки', hlines: v.floor > 0 ? [{ y: v.floor, label: 'плато ' + Math.round(v.floor * 100) + '%', color: 'var(--gold)' }] : [] }),
        v: v.floor < 0.05 ? ['bad', 'Кривая сползает к нулю: каждый привлечённый клиент рано или поздно уходит. Заливать такой продукт рекламой — всё равно что наливать воду в дырявое ведро. Сначала ищи, кому продукт нужен постоянно.'] :
          v.floor < 0.15 ? ['warn', 'Плато есть, но низкое. Ядро существует — найди, чем эти люди отличаются от ушедших, и сфокусируйся на них.'] :
          ['good', 'Кривая выходит на плато — классический признак **Product-Market Fit**. Есть люди, которые остаются надолго, значит, рост маркетингом начнёт накапливаться, а не утекать.']
      };
    }
  });

  BA.sim('abtest', {
    title: 'A/B-тест: случайность или результат?', group: 'Продукт и метрики', lesson: 'l3-5',
    desc: 'Две версии страницы. Насколько уверенно можно сказать, что B лучше A?',
    inputs: [
      { id: 'n', l: 'Посетителей в каждой группе', min: 100, max: 50000, step: 100, v: 2000 },
      { id: 'ca', l: 'Конверсия A', min: 0.005, max: 0.3, step: 0.001, v: 0.05, f: 'pct' },
      { id: 'cb', l: 'Конверсия B', min: 0.005, max: 0.3, step: 0.001, v: 0.058, f: 'pct' }
    ],
    calc: function (v) {
      const p = (v.ca + v.cb) / 2, se = Math.sqrt(2 * p * (1 - p) / v.n), z = (v.cb - v.ca) / se;
      const cdf = function (x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const pr = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - pr : pr; };
      const pval = 2 * (1 - cdf(Math.abs(z)));
      const need = Math.ceil(16 * p * (1 - p) / Math.pow(v.cb - v.ca || 1e-9, 2));
      const lift = (v.cb - v.ca) / v.ca;
      return {
        k: [['Рост B к A', lift, 'pct', lift > 0 ? 'good' : 'bad'], ['p-value', pval < 0.001 ? '< 0,001' : BA.n(pval, 2), null, pval < 0.05 ? 'good' : 'bad'], ['Нужно на группу (мощность 80%)', N(need)], ['Заказов A / B', N(v.n * v.ca) + ' / ' + N(v.n * v.cb)]],
        v: pval < 0.05 ? ['good', 'Разница статистически значима: вероятность увидеть такую разницу при отсутствии эффекта — меньше 5%. Но проверь, что тест шёл полные недели и ты не подглядывал каждый день.'] :
          ['bad', 'Разница **не значима**: такое расхождение легко получить случайно. Нужно примерно ' + N(need) + ' посетителей в каждую группу, чтобы уверенно поймать эффект такого размера. Не останавливай тест, когда «показалось, что выиграли».']
      };
    }
  });

  /* ============ 4. Цена ============ */
  BA.sim('pricing', {
    title: 'Цена, спрос и прибыль', group: 'Бизнес-модель и цена', lesson: 'l4-4',
    desc: 'Чем выше цена — тем меньше покупателей. Где максимум прибыли? Почти никогда не там, где максимум продаж.',
    inputs: [
      { id: 'price', l: 'Цена', min: 100, max: 3000, step: 10, v: 990, f: 'rub0' },
      { id: 'cost', l: 'Переменная себестоимость единицы', min: 0, max: 1500, step: 10, v: 350, f: 'rub0' },
      { id: 'el', l: 'Чувствительность к цене (эластичность)', min: 0.5, max: 4, step: 0.1, v: 1.8, f: 'n1', h: '1,8 — рост цены на 1% снижает спрос на 1,8%' },
      { id: 'base', l: 'Продаж в месяц при цене 1 000 ₽', min: 100, max: 10000, step: 100, v: 2000 }
    ],
    presets: [{ n: 'Товар-аналог (высокая эластичность)', v: { el: 3.2, cost: 350, price: 790 } }, { n: 'Уникальный продукт', v: { el: 0.9, cost: 350, price: 1900 } }],
    calc: function (v) {
      const q = function (p) { return v.base * Math.pow(p / 1000, -v.el); };
      const pr = function (p) { return (p - v.cost) * q(p); };
      const pts = [], rev = []; let best = 100, bv = -Infinity;
      for (let p = 100; p <= 3000; p += 20) { const x = pr(p); pts.push([p, x]); rev.push([p, p * q(p)]); if (x > bv) { bv = x; best = p; } }
      const opt = v.el > 1 ? v.cost * v.el / (v.el - 1) : 3000;
      return {
        k: [['Продаж в месяц', N(q(v.price))], ['Выручка', v.price * q(v.price), 'rub'], ['Прибыль', pr(v.price), 'rub', pr(v.price) < 0 ? 'bad' : 'good'], ['Цена максимальной прибыли', Math.min(3000, opt), 'rub0', 'warn']],
        chart: L({ series: [{ data: pts, name: 'Прибыль', color: 'var(--money)', area: true }, { data: rev, name: 'Выручка', color: 'var(--ink-3)', dash: true, end: false }], vlines: [{ x: v.price, label: 'твоя цена' }], points: [{ x: best, y: bv, label: 'максимум прибыли', anchor: best > 2200 ? 'end' : 'start' }], xLabel: 'цена, ₽', yFmt: rub }),
        legend: [{ name: 'Прибыль', color: 'var(--money)' }, { name: 'Выручка', color: 'var(--ink-3)' }],
        v: Math.abs(v.price - best) < 80 ? ['good', 'Ты около максимума прибыли. Обрати внимание: выручка в этой точке **не максимальная** — и это нормально.'] :
          v.price < best ? ['warn', 'Цена ниже оптимальной: продаёшь больше, а зарабатываешь меньше. Частая ошибка новичков — «дёшево, зато много».'] : ['warn', 'Цена выше оптимальной: каждый клиент приносит много, но их слишком мало.']
      };
    }
  });

  BA.sim('discount', {
    title: 'Сколько стоит скидка', group: 'Бизнес-модель и цена', lesson: 'l4-5',
    desc: 'Скидка режет не цену, а маржу. Посмотри, насколько должны вырасти продажи, чтобы просто остаться при своих.',
    inputs: [
      { id: 'm', l: 'Маржа (доля цены после переменных расходов)', min: 0.1, max: 0.9, step: 0.01, v: 0.4, f: 'pct0' },
      { id: 'd', l: 'Скидка', min: 0.01, max: 0.5, step: 0.01, v: 0.2, f: 'pct0' }
    ],
    calc: function (v) {
      const need = v.d < v.m ? v.d / (v.m - v.d) : Infinity;
      const pts = []; for (let d = 0.01; d < Math.min(v.m - 0.01, 0.6); d += 0.01) pts.push([d * 100, Math.min(10, d / (v.m - d)) * 100]);
      return {
        k: [['Новая маржа', Math.max(0, v.m - v.d), 'pct0', v.d >= v.m ? 'bad' : ''], ['Нужен рост продаж', isFinite(need) ? P(need, 0) : 'невозможно', null, need > 0.5 ? 'bad' : 'warn']],
        chart: L({ series: [{ data: pts, color: 'var(--seal)', area: true }], yMin: 0, yMax: 1000, xLabel: 'скидка, %', yFmt: function (x) { return N(x) + '%'; }, points: isFinite(need) && need <= 10 ? [{ x: v.d * 100, y: need * 100, label: '+' + Math.round(need * 100) + '% продаж' }] : [] }),
        v: v.d >= v.m ? ['bad', 'Скидка больше маржи: каждая продажа приносит **убыток**. Чем больше продаёшь — тем больше теряешь.'] :
          ['warn', 'При марже ' + P(v.m, 0) + ' скидка ' + P(v.d, 0) + ' требует продать на **' + P(need, 0) + ' больше**, чтобы заработать столько же. Скидка оправдана, только если приводит новых клиентов, которые потом вернутся по полной цене.']
      };
    }
  });

  /* ============ 5. Маркетинг ============ */
  BA.sim('funnel', {
    title: 'Воронка продаж', group: 'Маркетинг и продажи', lesson: 'l5-1',
    desc: 'Каждый шаг воронки теряет людей. Улучшение одного узкого места часто важнее, чем удвоение рекламы.',
    inputs: [
      { id: 'vis', l: 'Посетителей сайта в месяц', min: 1000, max: 200000, step: 1000, v: 40000 },
      { id: 'c1', l: 'Оставили заявку / зарегистрировались', min: 0.005, max: 0.3, step: 0.005, v: 0.06, f: 'pct' },
      { id: 'c2', l: 'Дошли до пробного использования', min: 0.05, max: 1, step: 0.01, v: 0.45, f: 'pct0' },
      { id: 'c3', l: 'Купили', min: 0.02, max: 0.8, step: 0.01, v: 0.2, f: 'pct0' },
      { id: 'spend', l: 'Рекламный бюджет', min: 50000, max: 3000000, step: 10000, v: 600000, f: 'rub' }
    ],
    calc: function (v) {
      const s1 = v.vis * v.c1, s2 = s1 * v.c2, s3 = s2 * v.c3, cac = s3 ? v.spend / s3 : Infinity;
      const steps = [['Визиты', v.vis], ['Заявки', s1], ['Пробовали', s2], ['Купили', s3]];
      return {
        k: [['Покупателей', N(s3), null, 'good'], ['Сквозная конверсия', s3 / v.vis, 'pct'], ['Цена покупателя (CAC)', cac, 'rub0', cac > 5000 ? 'bad' : '']],
        chart: BA.barChart({ items: steps.map(function (s, k) { return { label: s[0], value: s[1], color: ['var(--ink-3)', 'var(--blue)', 'var(--gold)', 'var(--money)'][k] }; }), h: 230 }),
        v: ['', 'Проверь: что даёт больше покупателей — +10% бюджета или +5 п.п. на шаге «Купили»? Самое слабое звено воронки обычно самое дешёвое для улучшения.']
      };
    }
  });

  BA.sim('ads', {
    title: 'Рекламная кампания: CPM → CTR → CR → ROAS', group: 'Маркетинг и продажи', lesson: 'l5-2',
    desc: 'Как из показов рекламы получаются деньги. Метрики, на которых говорят маркетологи.',
    inputs: [
      { id: 'budget', l: 'Бюджет', min: 10000, max: 2000000, step: 10000, v: 300000, f: 'rub' },
      { id: 'cpm', l: 'CPM — цена 1000 показов', min: 50, max: 1500, step: 10, v: 350, f: 'rub0' },
      { id: 'ctr', l: 'CTR — доля кликнувших', min: 0.001, max: 0.05, step: 0.001, v: 0.012, f: 'pct' },
      { id: 'cr', l: 'CR — доля купивших из кликнувших', min: 0.002, max: 0.15, step: 0.001, v: 0.025, f: 'pct' },
      { id: 'aov', l: 'Средний чек', min: 300, max: 30000, step: 100, v: 3500, f: 'rub0' },
      { id: 'gm', l: 'Маржа с заказа', min: 0.1, max: 0.9, step: 0.01, v: 0.45, f: 'pct0' }
    ],
    calc: function (v) {
      const imp = v.budget / v.cpm * 1000, clicks = imp * v.ctr, orders = clicks * v.cr, rev = orders * v.aov;
      const cpc = v.budget / clicks, cpa = v.budget / orders, roas = rev / v.budget, drr = v.budget / rev, profit = rev * v.gm - v.budget;
      return {
        k: [['Показов', N(imp)], ['Кликов', N(clicks)], ['Заказов', N(orders)], ['CPC — цена клика', cpc, 'rub0'], ['CPA — цена заказа', cpa, 'rub0'], ['ROAS', roas, 'x', roas * v.gm >= 1 ? 'good' : 'bad'], ['ДРР — доля рекламных расходов', drr, 'pct', drr > v.gm ? 'bad' : 'good'], ['Прибыль после рекламы', profit, 'rub', profit < 0 ? 'bad' : 'good']],
        v: profit < 0 ? ['bad', 'ROAS ' + BA.n(roas, 1) + '× выглядит прилично, но маржи ' + P(v.gm, 0) + ' не хватает: реклама съедает больше, чем приносит. Порог безубыточности: ROAS = 1 / маржа = **' + BA.n(1 / v.gm, 1) + '×**. Если клиенты возвращаются, первая покупка может быть и в минус — но это надо доказать когортами.'] :
          ['good', 'Кампания окупается на первом заказе. Теперь вопрос масштаба: при росте бюджета CPM обычно растёт, а CTR и CR падают — дешёвая аудитория заканчивается.']
      };
    }
  });

  BA.sim('viral', {
    title: 'Вирусный рост: k-фактор', group: 'Маркетинг и продажи', lesson: 'l5-5',
    desc: 'Каждый пользователь приводит k новых. Если k > 1 — рост сам себя кормит. Если меньше — затухает.',
    inputs: [
      { id: 'start', l: 'Стартовых пользователей', min: 100, max: 10000, step: 100, v: 1000 },
      { id: 'inv', l: 'Приглашений от одного человека', min: 0, max: 10, step: 0.5, v: 4 },
      { id: 'conv', l: 'Доля принявших приглашение', min: 0.01, max: 0.5, step: 0.01, v: 0.2, f: 'pct0' },
      { id: 'cycle', l: 'Цикл приглашения, дней', min: 1, max: 30, step: 1, v: 7 }
    ],
    calc: function (v) {
      const k = v.inv * v.conv, pts = []; let total = v.start, wave = v.start;
      for (let d = 0; d <= 90; d++) { if (d > 0 && d % v.cycle === 0) { wave = wave * k; total += wave; } pts.push([d, total]); if (total > 1e9) break; }
      return {
        k: [['k-фактор', k, 'n2', k >= 1 ? 'good' : 'warn'], ['Пользователей через 90 дней', N(total)], ['Итог от одного стартового', BA.n(k < 1 ? 1 / (1 - k) : Infinity, 1) + (k < 1 ? '×' : '')]],
        chart: L({ series: [{ data: pts, area: true, step: true, color: k >= 1 ? 'var(--money)' : 'var(--gold)' }], xLabel: 'дни', yFmt: function (x) { return M(x, ''); } }),
        v: k >= 1 ? ['good', 'k ≥ 1 — экспоненциальный рост. В реальности так бывает недолго: аудитория насыщается и k падает. Но важнее k — **длина цикла**: попробуй сократить её с 7 до 2 дней.'] :
          ['warn', 'k < 1 — вирусность не заменяет маркетинг, но **усиливает** его: каждый купленный пользователь приводит ещё ' + BA.n(k / (1 - k), 1) + ' бесплатных. Это снижает реальную цену привлечения.']
      };
    }
  });

  /* ============ 6. Юнит-экономика ============ */
  BA.sim('unit', {
    title: 'Юнит-экономика одного заказа', group: 'Юнит-экономика', lesson: 'l6-1',
    desc: 'Сквозной кейс «Маяк»: наборы для готовки. Сколько остаётся с одного заказа после всех прямых расходов?',
    inputs: [
      { id: 'check', l: 'Средний чек', min: 500, max: 6000, step: 50, v: 2400, f: 'rub0' },
      { id: 'food', l: 'Продукты и упаковка, % чека', min: 0.2, max: 0.8, step: 0.01, v: 0.48, f: 'pct0' },
      { id: 'deliv', l: 'Доставка заказа', min: 0, max: 800, step: 10, v: 290, f: 'rub0' },
      { id: 'fee', l: 'Эквайринг и комиссии, % чека', min: 0, max: 0.1, step: 0.005, v: 0.025, f: 'pct' },
      { id: 'cac', l: 'Реклама на заказ (CAC / число заказов клиента)', min: 0, max: 1500, step: 10, v: 420, f: 'rub0' }
    ],
    presets: [{ n: 'Маяк на старте', v: { check: 2400, food: 0.48, deliv: 290, fee: 0.025, cac: 420 } }, { n: 'Маяк после исправлений', v: { check: 2900, food: 0.43, deliv: 220, fee: 0.02, cac: 260 } }],
    calc: function (v) {
      const food = v.check * v.food, fee = v.check * v.fee, cm1 = v.check - food - fee, cm2 = cm1 - v.deliv, cm3 = cm2 - v.cac;
      return {
        k: [['Маржа после себестоимости', cm1, 'rub0'], ['После доставки', cm2, 'rub0', cm2 < 0 ? 'bad' : ''], ['После рекламы (вклад заказа)', cm3, 'rub0', cm3 < 0 ? 'bad' : 'good'], ['Вклад, % чека', cm3 / v.check, 'pct', cm3 < 0 ? 'bad' : 'good']],
        chart: BA.waterfall({ items: [{ label: 'Чек', value: v.check, total: true }, { label: 'Продукты', value: -food }, { label: 'Комиссии', value: -fee }, { label: 'Доставка', value: -v.deliv }, { label: 'Реклама', value: -v.cac }, { label: 'Остаток', value: cm3, total: true }], fmt: function (x) { return N(x); } }),
        v: cm3 < 0 ? ['bad', 'Каждый заказ **убыточен** ещё до аренды и зарплат. Рост в такой модели увеличивает убыток. Чини экономику заказа раньше, чем масштаб: чек, себестоимость, доставку или повторные покупки.'] :
          ['good', 'С каждого заказа остаётся ' + N(cm3) + ' ₽ на покрытие постоянных расходов. Теперь посчитай, сколько таких заказов нужно в месяц, чтобы оплатить кухню, команду и офис — это и будет точка безубыточности.']
      };
    }
  });

  BA.sim('ltvcac', {
    title: 'LTV, CAC и окупаемость клиента', group: 'Юнит-экономика', lesson: 'l6-2',
    desc: 'Главная пара метрик для инвестора: сколько стоит привлечь клиента и сколько он принесёт за всю жизнь.',
    inputs: [
      { id: 'arpu', l: 'Выручка с клиента в месяц (ARPU)', min: 100, max: 10000, step: 50, v: 1500, f: 'rub0' },
      { id: 'gm', l: 'Валовая маржа', min: 0.1, max: 0.95, step: 0.01, v: 0.7, f: 'pct0' },
      { id: 'churn', l: 'Отток в месяц (churn)', min: 0.005, max: 0.3, step: 0.005, v: 0.05, f: 'pct' },
      { id: 'cac', l: 'Стоимость привлечения (CAC)', min: 500, max: 100000, step: 500, v: 12000, f: 'rub0' }
    ],
    presets: [{ n: 'SaaS для бизнеса', v: { arpu: 4900, gm: 0.8, churn: 0.025, cac: 45000 } }, { n: 'Потребительская подписка', v: { arpu: 399, gm: 0.6, churn: 0.09, cac: 1600 } }, { n: 'Плохая экономика', v: { arpu: 990, gm: 0.45, churn: 0.12, cac: 9000 } }],
    calc: function (v) {
      const life = 1 / v.churn, ltv = v.arpu * v.gm * life, ratio = ltv / v.cac, payback = v.cac / (v.arpu * v.gm);
      const pts = []; let cum = -v.cac, alive = 1;
      for (let m = 0; m <= 36; m++) { pts.push([m, cum]); cum += v.arpu * v.gm * alive; alive *= 1 - v.churn; }
      return {
        k: [['Средняя жизнь клиента', life, 'mo'], ['LTV (по марже)', ltv, 'rub0'], ['LTV / CAC', ratio, 'x', ratio >= 3 ? 'good' : ratio >= 1 ? 'warn' : 'bad'], ['Окупаемость CAC', payback, 'mo', payback <= 12 ? 'good' : payback <= 24 ? 'warn' : 'bad']],
        chart: L({ series: [{ data: pts, area: true, color: cum > 0 ? 'var(--money)' : 'var(--seal)' }], xLabel: 'месяц жизни клиента', yFmt: rub, hlines: [{ y: 0, label: 'клиент окупился', color: 'var(--ink-3)' }] }),
        v: ratio < 1 ? ['bad', 'LTV меньше CAC: компания **платит за то, чтобы терять деньги**. Каждый новый клиент — минус. Нужно снижать CAC, поднимать цену или удерживать клиентов дольше.'] :
          ratio < 3 ? ['warn', 'LTV/CAC между 1 и 3: клиенты окупаются, но запас тонкий. Инвесторы обычно хотят видеть **3× и выше** при окупаемости до 12–18 месяцев.'] :
            ['good', 'LTV/CAC ≥ 3 — здоровая экономика. Если окупаемость короткая, можно увеличивать маркетинг. Если LTV/CAC больше 5–6 — возможно, ты **недоинвестируешь** в рост.']
      };
    }
  });

  BA.sim('saas', {
    title: 'Подписочный бизнес: MRR за 24 месяца', group: 'Юнит-экономика', lesson: 'l6-4',
    desc: 'Новые клиенты, отток и допродажи. Почему отток в 5% в месяц ставит потолок любому росту.',
    inputs: [
      { id: 'newc', l: 'Новых клиентов в месяц', min: 5, max: 500, step: 5, v: 60 },
      { id: 'grow', l: 'Рост притока новых, в месяц', min: 0, max: 0.15, step: 0.005, v: 0.04, f: 'pct' },
      { id: 'price', l: 'Подписка в месяц', min: 500, max: 50000, step: 500, v: 5000, f: 'rub0' },
      { id: 'churn', l: 'Отток клиентов в месяц', min: 0, max: 0.15, step: 0.005, v: 0.04, f: 'pct' },
      { id: 'exp', l: 'Допродажи оставшимся, в месяц', min: 0, max: 0.05, step: 0.0025, v: 0.01, f: 'pct', h: 'Апгрейды тарифов и рост числа мест' }
    ],
    calc: function (v) {
      let mrr = 0, nw = v.newc; const pts = [], ch = []; let lost = 0;
      for (let m = 1; m <= 24; m++) {
        const churned = mrr * v.churn; lost += churned;
        mrr = mrr - churned + mrr * v.exp + nw * v.price;
        nw *= 1 + v.grow; pts.push([m, mrr]); ch.push([m, lost]);
      }
      const nrr = Math.pow((1 - v.churn) * (1 + v.exp), 12);
      const cap = v.churn - v.exp > 0 ? v.newc * v.price / (v.churn - v.exp) : Infinity;
      return {
        k: [['MRR через 24 мес.', mrr, 'rub'], ['ARR (×12)', mrr * 12, 'rub', 'good'], ['NRR за год', nrr, 'pct0', nrr >= 1 ? 'good' : 'warn'], ['Потолок MRR без роста притока', cap, 'rub']],
        chart: L({ series: [{ data: pts, area: true, color: 'var(--money)' }, { data: ch, color: 'var(--seal)', dash: true }], xLabel: 'месяц', yFmt: rub }),
        legend: [{ name: 'MRR', color: 'var(--money)' }, { name: 'Потерянная выручка от оттока (накопленно)', color: 'var(--seal)' }],
        v: nrr >= 1 ? ['good', 'NRR выше 100%: даже без новых клиентов выручка растёт за счёт допродаж. Это «отрицательный отток» — мечта любого SaaS.'] :
          ['warn', 'Отток задаёт потолок: при постоянном притоке MRR не вырастет выше ' + M(cap) + ', сколько ни жди. Снизь отток на 1 п.п. и посмотри, как сдвинется кривая.']
      };
    }
  });

  BA.sim('breakeven', {
    title: 'Точка безубыточности и операционный рычаг', group: 'Юнит-экономика', lesson: 'l6-5',
    desc: 'Две компании с одинаковой выручкой. У одной в основном постоянные расходы, у другой — переменные. Что будет при падении продаж на 20%?',
    inputs: [
      { id: 'price', l: 'Цена единицы', min: 100, max: 5000, step: 10, v: 1200, f: 'rub0' },
      { id: 'varc', l: 'Переменные расходы на единицу', min: 0, max: 4000, step: 10, v: 500, f: 'rub0' },
      { id: 'fixed', l: 'Постоянные расходы в месяц', min: 50000, max: 5000000, step: 10000, v: 1400000, f: 'rub' },
      { id: 'q', l: 'Продаж в месяц', min: 100, max: 10000, step: 50, v: 2600 }
    ],
    calc: function (v) {
      const cm = v.price - v.varc, be = cm > 0 ? v.fixed / cm : Infinity, profit = cm * v.q - v.fixed;
      const dol = profit > 0 ? cm * v.q / profit : Infinity, mos = (v.q - be) / v.q;
      const qmax = Math.max(v.q * 1.6, isFinite(be) ? be * 1.4 : v.q * 2), rev = [], cost = [];
      for (let q = 0; q <= qmax; q += qmax / 40) { rev.push([q, q * v.price]); cost.push([q, v.fixed + q * v.varc]); }
      return {
        k: [['Точка безубыточности', isFinite(be) ? N(be) + ' шт.' : 'нет', null, be > v.q ? 'bad' : 'good'], ['Прибыль', profit, 'rub', profit < 0 ? 'bad' : 'good'], ['Запас прочности', isFinite(be) ? mos : -1, 'pct0', mos < 0.15 ? 'warn' : 'good'], ['Операционный рычаг', isFinite(dol) ? BA.n(dol, 1) + '×' : '—', null, dol > 4 ? 'warn' : '']],
        chart: L({ series: [{ data: rev, name: 'Выручка', color: 'var(--money)', end: false }, { data: cost, name: 'Все расходы', color: 'var(--seal)', end: false }], xLabel: 'штук в месяц', yFmt: rub, vlines: [{ x: v.q, label: 'сейчас' }], points: isFinite(be) && be < qmax ? [{ x: be, y: be * v.price, label: 'безубыточность' }] : [] }),
        legend: [{ name: 'Выручка', color: 'var(--money)' }, { name: 'Расходы', color: 'var(--seal)' }],
        v: profit <= 0 ? ['bad', 'Ниже точки безубыточности. Каждая проданная единица приносит ' + N(cm) + ' ₽ на покрытие постоянных расходов — нужно ' + N(be) + ' штук.'] :
          ['', 'Рычаг ' + BA.n(dol, 1) + '×: если продажи упадут на 10%, прибыль упадёт примерно на **' + Math.round(dol * 10) + '%**. Высокий рычаг — это быстрый рост прибыли в хорошие времена и быстрая смерть в плохие.']
      };
    }
  });

  /* ============ 7. Финансы ============ */
  BA.sim('pnl', {
    title: 'Отчёт о прибылях и убытках (P&L)', group: 'Финансы', lesson: 'l7-2',
    desc: 'Путь от выручки к чистой прибыли: где теряются деньги и что такое EBITDA.',
    inputs: [
      { id: 'rev', l: 'Выручка за год', min: 1e6, max: 5e8, step: 1e6, v: 1.2e8, f: 'rub' },
      { id: 'cogs', l: 'Себестоимость (COGS), % выручки', min: 0.1, max: 0.9, step: 0.01, v: 0.55, f: 'pct0' },
      { id: 'opex', l: 'Операционные расходы (OPEX), % выручки', min: 0.05, max: 0.8, step: 0.01, v: 0.3, f: 'pct0', h: 'Зарплаты офиса, маркетинг, аренда' },
      { id: 'da', l: 'Амортизация, % выручки', min: 0, max: 0.15, step: 0.005, v: 0.03, f: 'pct' },
      { id: 'debt', l: 'Долг (проценты по ставке 18%)', min: 0, max: 2e8, step: 1e6, v: 2e7, f: 'rub' }
    ],
    calc: function (v) {
      const cogs = v.rev * v.cogs, gp = v.rev - cogs, opex = v.rev * v.opex, ebitda = gp - opex, da = v.rev * v.da, ebit = ebitda - da, int = v.debt * 0.18, ebt = ebit - int, tax = Math.max(0, ebt) * 0.25, ni = ebt - tax;
      return {
        k: [['Валовая прибыль', gp, 'rub'], ['Валовая маржа', gp / v.rev, 'pct0'], ['EBITDA', ebitda, 'rub', ebitda < 0 ? 'bad' : ''], ['Чистая прибыль', ni, 'rub', ni < 0 ? 'bad' : 'good']],
        chart: BA.waterfall({ items: [{ label: 'Выручка', value: v.rev, total: true }, { label: 'Себестоимость', value: -cogs }, { label: 'Валовая прибыль', value: gp, total: true }, { label: 'OPEX', value: -opex }, { label: 'EBITDA', value: ebitda, total: true }, { label: 'Амортизация', value: -da }, { label: 'Проценты', value: -int }, { label: 'Налог', value: -tax }, { label: 'Чистая прибыль', value: ni, total: true }], fmt: rub, h: 300 }),
        v: ebitda > 0 && ni < 0 ? ['warn', 'EBITDA положительная, а чистая прибыль — нет. Вот почему фраза «мы прибыльны по EBITDA» требует уточнения: амортизация, проценты и налоги — реальные расходы.'] : ['', 'Налог на прибыль в примере — 25% (ставка для ООО на общем режиме с 2025 года). На упрощёнке считается иначе — об этом в модуле 8.']
      };
    }
  });

  BA.sim('cashgap', {
    title: 'Кассовый разрыв и оборотный капитал', group: 'Финансы', lesson: 'l7-3',
    desc: 'Прибыль есть, а денег нет. Почему быстрый рост «съедает» кассу, когда клиенты платят позже, чем ты поставщикам.',
    inputs: [
      { id: 'sales', l: 'Продажи в месяц', min: 1e6, max: 1e8, step: 1e6, v: 2e7, f: 'rub' },
      { id: 'dso', l: 'Клиенты платят через, дней', min: 0, max: 120, step: 5, v: 60, h: 'Дебиторская задолженность' },
      { id: 'dio', l: 'Товар лежит на складе, дней', min: 0, max: 120, step: 5, v: 30 },
      { id: 'dpo', l: 'Ты платишь поставщикам через, дней', min: 0, max: 120, step: 5, v: 20, h: 'Кредиторская задолженность' },
      { id: 'cogs', l: 'Себестоимость, % продаж', min: 0.2, max: 0.9, step: 0.01, v: 0.7, f: 'pct0' },
      { id: 'g', l: 'Рост продаж в месяц', min: 0, max: 0.2, step: 0.01, v: 0.08, f: 'pct0' }
    ],
    calc: function (v) {
      const ccc = v.dso + v.dio - v.dpo, wc = v.sales * 12 / 365 * ccc * v.cogs;
      const pts = []; let s = v.sales, cash = 0;
      for (let m = 0; m <= 12; m++) {
        const need = s * 12 / 365 * ccc * v.cogs;
        const profit = s * (1 - v.cogs) * 0.35;
        if (m > 0) cash += profit - (need - (s / (1 + v.g)) * 12 / 365 * ccc * v.cogs);
        pts.push([m, cash]); s *= 1 + v.g;
      }
      return {
        k: [['Цикл денег (CCC)', ccc, 'd', ccc > 45 ? 'bad' : ccc > 0 ? 'warn' : 'good'], ['Заморожено в обороте', wc, 'rub', 'warn'], ['Касса через 12 мес. (с прибылью)', pts[12][1], 'rub', pts[12][1] < 0 ? 'bad' : 'good']],
        chart: L({ series: [{ data: pts, area: true, color: pts[12][1] < 0 ? 'var(--seal)' : 'var(--money)' }], xLabel: 'месяц', yFmt: rub, hlines: [{ y: 0, label: '', color: 'var(--ink-3)' }] }),
        v: ccc <= 0 ? ['good', 'Отрицательный цикл: клиенты платят раньше, чем ты поставщикам. Рост **генерирует** деньги — так работают Amazon и маркетплейсы.'] :
          ['bad', 'Каждый рубль роста требует денег в обороте: сначала платишь за товар, а деньги клиента приходят через ' + v.dso + ' дней. Прибыльная компания может обанкротиться именно так. Сократи отсрочку клиентам или договорись об отсрочке у поставщиков.']
      };
    }
  });

  BA.sim('runway', {
    title: 'Burn rate и runway: сколько осталось жить', group: 'Финансы', lesson: 'l7-5',
    desc: 'Деньги на счёте, расходы и растущая выручка. Когда закончатся деньги — и успеешь ли ты выйти в плюс?',
    inputs: [
      { id: 'cash', l: 'Деньги на счёте', min: 1e6, max: 2e8, step: 1e6, v: 3e7, f: 'rub' },
      { id: 'cost', l: 'Расходы в месяц', min: 5e5, max: 3e7, step: 1e5, v: 4.5e6, f: 'rub' },
      { id: 'rev', l: 'Выручка сейчас, в месяц', min: 0, max: 2e7, step: 1e5, v: 1.2e6, f: 'rub' },
      { id: 'g', l: 'Рост выручки в месяц', min: 0, max: 0.25, step: 0.005, v: 0.07, f: 'pct' },
      { id: 'cg', l: 'Рост расходов в месяц', min: 0, max: 0.1, step: 0.005, v: 0.02, f: 'pct' }
    ],
    presets: [{ n: 'Default alive', v: { cash: 3e7, cost: 4.5e6, rev: 1.8e6, g: 0.1, cg: 0.015 } }, { n: 'Default dead', v: { cash: 2e7, cost: 6e6, rev: 8e5, g: 0.05, cg: 0.03 } }],
    calc: function (v) {
      let cash = v.cash, r = v.rev, c = v.cost, dead = null, be = null; const pts = [], burn0 = v.cost - v.rev;
      for (let m = 0; m <= 36; m++) {
        pts.push([m, cash]);
        if (be == null && r >= c) be = m;
        cash += r - c; r *= 1 + v.g; c *= 1 + v.cg;
        if (cash < 0 && dead == null) { dead = m + 1; pts.push([m + 1, cash]); break; }
      }
      const simple = burn0 > 0 ? v.cash / burn0 : Infinity;
      return {
        k: [['Burn сейчас', burn0, 'rub', burn0 > 0 ? 'bad' : 'good'], ['Runway «в лоб»', isFinite(simple) ? simple : 999, 'mo'], ['Деньги кончатся', dead ? 'через ' + dead + ' мес.' : 'не кончатся', null, dead ? 'bad' : 'good'], ['Выход в плюс', be != null ? 'на ' + be + '-м мес.' : 'не успеваем', null, be != null && (!dead || be < dead) ? 'good' : 'bad']],
        chart: L({ series: [{ data: pts, area: true, color: dead ? 'var(--seal)' : 'var(--money)' }], xMin: 0, xMax: 36, xLabel: 'месяц', yFmt: rub, hlines: [{ y: 0, color: 'var(--ink-3)' }], vlines: be != null ? [{ x: be, label: 'выручка ≥ расходы', color: 'var(--money)' }] : [] }),
        v: dead ? ['bad', '**Default dead** (термин Пола Грэма): при текущей траектории компания умрёт раньше, чем выйдет в плюс. Поднимать раунд нужно начинать минимум за 6–9 месяцев до нуля — или резать расходы сейчас.'] :
          ['good', '**Default alive**: компания дотягивает до безубыточности на текущих деньгах. Это лучшая позиция для переговоров с инвестором — тебе не нужны его деньги, чтобы выжить.']
      };
    }
  });

  /* ============ 11. Инвестиции ============ */
  BA.sim('round', {
    title: 'Pre-money, post-money и доля инвестора', group: 'Инвестиции и сделки', lesson: 'l11-4',
    desc: 'Инвестор даёт деньги в обмен на долю. Как из двух чисел получаются остальные.',
    inputs: [
      { id: 'pre', l: 'Оценка до денег (pre-money)', min: 1e7, max: 2e9, step: 1e7, v: 1.6e8, f: 'rub' },
      { id: 'inv', l: 'Сумма инвестиций', min: 5e6, max: 5e8, step: 5e6, v: 4e7, f: 'rub' },
      { id: 'sh', l: 'Акций (долей) у основателей до раунда', min: 1e5, max: 1e7, step: 1e5, v: 1e6 }
    ],
    calc: function (v) {
      const post = v.pre + v.inv, pct = v.inv / post, price = v.pre / v.sh, newSh = v.inv / price;
      return {
        k: [['Post-money', post, 'rub'], ['Доля инвестора', pct, 'pct', 'warn'], ['Доля основателей после', 1 - pct, 'pct', 'good'], ['Цена одной акции', price, 'rub0'], ['Новых акций выпущено', N(newSh)]],
        chart: BA.stackChart({ cats: ['До раунда', 'После раунда'], series: [{ name: 'Основатели', values: [1, 1 - pct], color: 'var(--money)' }, { name: 'Инвестор', values: [0, pct], color: 'var(--gold)' }], h: 240 }),
        legend: [{ name: 'Основатели', color: 'var(--money)' }, { name: 'Инвестор', color: 'var(--gold)' }],
        v: ['', 'Формулы: **post = pre + инвестиции**, **доля инвестора = инвестиции / post**. Слышишь «даём 40 млн за 20%» — значит post-money 200 млн, а pre-money 160 млн. Всегда уточняй, о какой оценке речь.']
      };
    }
  });

  BA.sim('captable', {
    title: 'Cap table: размытие долей по раундам', group: 'Инвестиции и сделки', lesson: 'l11-5',
    desc: 'Основатели начинают со 100%. Ангел, seed, раунды A и B, опционный пул. Сколько останется — и сколько это будет стоить?',
    inputs: [
      { id: 'a', l: 'Ангел: доля за раунд', min: 0, max: 0.25, step: 0.01, v: 0.1, f: 'pct0' },
      { id: 's', l: 'Seed: доля за раунд', min: 0, max: 0.3, step: 0.01, v: 0.18, f: 'pct0' },
      { id: 'esop', l: 'Опционный пул сотрудникам', min: 0, max: 0.2, step: 0.01, v: 0.1, f: 'pct0' },
      { id: 'A', l: 'Раунд A: доля', min: 0, max: 0.35, step: 0.01, v: 0.2, f: 'pct0' },
      { id: 'B', l: 'Раунд B: доля', min: 0, max: 0.3, step: 0.01, v: 0.15, f: 'pct0' },
      { id: 'exit', l: 'Продажа компании за', min: 1e8, max: 5e10, step: 1e8, v: 6e9, f: 'rub' }
    ],
    calc: function (v) {
      let own = { f: 1, an: 0, sd: 0, es: 0, a: 0, b: 0 }; const snaps = [];
      function dil(p, key) { Object.keys(own).forEach(function (k) { own[k] *= 1 - p; }); own[key] += p; }
      snaps.push(Object.assign({}, own));
      dil(v.a, 'an'); snaps.push(Object.assign({}, own));
      dil(v.s, 'sd'); snaps.push(Object.assign({}, own));
      dil(v.esop, 'es'); snaps.push(Object.assign({}, own));
      dil(v.A, 'a'); snaps.push(Object.assign({}, own));
      dil(v.B, 'b'); snaps.push(Object.assign({}, own));
      const keys = [['f', 'Основатели', 'var(--money)'], ['an', 'Ангел', 'var(--blue)'], ['sd', 'Seed', 'var(--gold)'], ['es', 'Опционы', 'var(--ink-3)'], ['a', 'Раунд A', 'var(--seal)'], ['b', 'Раунд B', 'color-mix(in srgb, var(--blue) 50%, var(--gold))']];
      return {
        k: [['Доля основателей в конце', own.f, 'pct', own.f < 0.3 ? 'warn' : 'good'], ['Основатели получат при продаже', own.f * v.exit, 'rub', 'good'], ['Инвесторы вместе', own.an + own.sd + own.a + own.b, 'pct']],
        chart: BA.stackChart({ cats: ['Старт', 'Ангел', 'Seed', 'Пул', 'A', 'B'], series: keys.map(function (k) { return { name: k[1], color: k[2], values: snaps.map(function (s) { return s[k[0]]; }) }; }) }),
        legend: keys.map(function (k) { return { name: k[1], color: k[2] }; }),
        v: ['', 'Размытие — не потеря, если пирог растёт быстрее, чем уменьшается твой кусок. 100% от компании в 0 ₽ — это 0 ₽; ' + P(own.f, 0) + ' от ' + M(v.exit) + ' — это ' + M(own.f * v.exit) + '. Но в реальной продаже ещё действуют **ликвидационные привилегии** — их смотри в следующем симуляторе.']
      };
    }
  });

  BA.sim('safe', {
    title: 'SAFE и конвертируемый заём: во что превратятся деньги', group: 'Инвестиции и сделки', lesson: 'l11-6',
    desc: 'Ранний инвестор даёт деньги без оценки. Цена его доли определится в следующем раунде — с потолком (cap) и скидкой.',
    inputs: [
      { id: 'inv', l: 'Сумма SAFE', min: 1e6, max: 1e8, step: 1e6, v: 1.5e7, f: 'rub' },
      { id: 'cap', l: 'Потолок оценки (cap)', min: 5e7, max: 2e9, step: 1e7, v: 1.5e8, f: 'rub' },
      { id: 'disc', l: 'Скидка к цене раунда', min: 0, max: 0.35, step: 0.05, v: 0.2, f: 'pct0' },
      { id: 'pre', l: 'Pre-money следующего раунда', min: 5e7, max: 3e9, step: 1e7, v: 4e8, f: 'rub' }
    ],
    calc: function (v) {
      const byCap = v.cap, byDisc = v.pre * (1 - v.disc), eff = Math.min(byCap, byDisc);
      const pct = v.inv / (eff + v.inv);
      const naive = v.inv / (v.pre + v.inv);
      return {
        k: [['Оценка по cap', byCap, 'rub', eff === byCap ? 'good' : ''], ['Оценка со скидкой', byDisc, 'rub', eff === byDisc ? 'good' : ''], ['Сработает', eff === byCap ? 'потолок (cap)' : 'скидка', null, 'warn'], ['Доля SAFE-инвестора', pct, 'pct'], ['Если бы зашёл в раунд', naive, 'pct']],
        v: ['', 'Инвестор получает **лучшее** из двух: цену по потолку или цену раунда со скидкой. Чем дороже следующий раунд относительно cap, тем больше выигрывает ранний инвестор — это плата за риск зайти первым.']
      };
    }
  });

  BA.sim('waterfall', {
    title: 'Ликвидационные привилегии: кто что получит при продаже', group: 'Инвестиции и сделки', lesson: 'l11-7',
    desc: 'Инвестор вложил 300 млн за 25%. Компанию продали. Почему при скромной продаже основатели получают почти ноль?',
    inputs: [
      { id: 'exit', l: 'Цена продажи компании', min: 5e7, max: 5e9, step: 5e7, v: 6e8, f: 'rub' },
      { id: 'inv', l: 'Вложил инвестор', min: 5e7, max: 1e9, step: 5e7, v: 3e8, f: 'rub' },
      { id: 'pct', l: 'Доля инвестора', min: 0.05, max: 0.6, step: 0.01, v: 0.25, f: 'pct0' },
      { id: 'mult', l: 'Множитель привилегии', min: 1, max: 3, step: 0.5, v: 1, f: 'x' },
      { id: 'part', l: 'Участие (0 — без участия, 1 — с участием)', min: 0, max: 1, step: 1, v: 0 }
    ],
    calc: function (v) {
      function payout(exit) {
        const pref = Math.min(exit, v.inv * v.mult);
        let inv;
        if (v.part) inv = pref + (exit - pref) * v.pct;
        else inv = Math.max(pref, exit * v.pct);
        inv = Math.min(exit, inv);
        return { inv: inv, f: exit - inv };
      }
      const p = payout(v.exit), pts1 = [], pts2 = [];
      for (let x = 0; x <= 5e9; x += 1e8) { const q = payout(x); pts1.push([x, q.f]); pts2.push([x, q.inv]); }
      return {
        k: [['Инвестор получит', p.inv, 'rub', 'warn'], ['Основатели и команда', p.f, 'rub', p.f < v.exit * (1 - v.pct) * 0.7 ? 'bad' : 'good'], ['Без привилегий основатели получили бы', v.exit * (1 - v.pct), 'rub']],
        chart: L({ series: [{ data: pts1, name: 'Основатели', color: 'var(--money)' }, { data: pts2, name: 'Инвестор', color: 'var(--gold)' }], xLabel: 'цена продажи', xFmt: function (x) { return M(x, ''); }, yFmt: rub, vlines: [{ x: v.exit, label: 'сделка' }] }),
        legend: [{ name: 'Основатели', color: 'var(--money)' }, { name: 'Инвестор', color: 'var(--gold)' }],
        v: v.part ? ['bad', '**С участием (participating)** инвестор сначала забирает свои ' + M(v.inv * v.mult) + ', а потом ещё и долю от остатка. «Двойное окунание» — жёсткое условие, за него стоит торговаться сильнее, чем за оценку.'] :
          ['', '**Без участия (non-participating)**: инвестор выбирает лучшее — вернуть вложенное ×' + v.mult + ' или взять свою долю. При дорогой продаже привилегия не работает, при дешёвой — защищает инвестора за счёт основателей.']
      };
    }
  });

  BA.sim('vcfund', {
    title: 'Венчурный фонд: закон степени', group: 'Инвестиции и сделки', lesson: 'l11-2', kind: 'game',
    desc: 'Ты управляешь фондом на 1 млрд ₽ и делаешь 25 инвестиций. Большинство умрёт. Нажимай «Новый фонд» и смотри, от чего зависит итог.',
    render: function (root, touch) {
      root.innerHTML = '<div class="sim-body"><div class="sim-in"><div class="rng"><div class="rng-h"><label for="vcN">Сколько компаний в портфеле</label><output id="vcNo">25</output></div><input type="range" id="vcN" min="5" max="60" value="25"></div>' +
        '<div class="rng"><div class="rng-h"><label for="vcU">Шанс найти «единорога» (×50+)</label><output id="vcUo">2%</output></div><input type="range" id="vcU" min="0" max="8" step="0.5" value="2"></div>' +
        '<button class="btn" id="vcGo">' + ic('dice', 'ico') + 'Новый фонд</button><div class="hint" style="font-size:.8rem;color:var(--ink-3)">Распределение исходов: 50% компаний — ноль, 20% — вернули вложенное, 20% — ×3, 6% — ×10, остальное — ×50 и выше.</div></div>' +
        '<div class="sim-out"><div class="kpis" id="vcK"></div><div class="chart" id="vcC"></div><div class="verdict" id="vcV"></div></div></div>';
      const $ = function (s) { return root.querySelector(s); };
      function run() {
        const n = +$('#vcN').value, u = +$('#vcU').value / 100;
        $('#vcNo').textContent = n; $('#vcUo').textContent = $('#vcU').value + '%';
        [$('#vcN'), $('#vcU')].forEach(function (r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); });
        const each = 1e9 * 0.8 / n, outs = [];
        for (let i = 0; i < n; i++) {
          const r = Math.random(); let m;
          if (r < u) m = 50 + Math.random() * 150; else if (r < u + 0.06) m = 10; else if (r < u + 0.26) m = 3; else if (r < u + 0.46) m = 1; else m = 0;
          outs.push(m);
        }
        outs.sort(function (a, b) { return b - a; });
        const total = outs.reduce(function (a, m) { return a + m * each; }, 0), mult = total / 1e9, top = outs[0] * each / (total || 1);
        $('#vcK').innerHTML = '<div class="kpi ' + (mult >= 3 ? 'good' : mult >= 1 ? 'warn' : 'bad') + '"><small>Фонд вернул инвесторам (LP)</small><b>' + BA.n(mult, 1) + '×</b></div><div class="kpi"><small>Компаний с нулём</small><b>' + outs.filter(function (m) { return m === 0; }).length + ' из ' + n + '</b></div><div class="kpi"><small>Вклад лучшей компании</small><b>' + P(top, 0) + '</b></div>';
        $('#vcC').innerHTML = BA.barChart({ items: outs.map(function (m, k) { return { label: k < 9 ? String(k + 1) : '', value: m, color: m >= 50 ? 'var(--gold)' : m >= 3 ? 'var(--money)' : m > 0 ? 'var(--blue)' : 'var(--seal)' }; }), fmt: function (x) { return x ? Math.round(x) + '×' : '0'; }, h: 230 });
        $('#vcV').innerHTML = mult >= 3 ? 'Отличный фонд. Посмотри, сколько дала **одна лучшая** компания — обычно больше, чем все остальные вместе. Поэтому фонд спрашивает тебя не «окупишься ли ты», а «можешь ли ты стать огромным».' :
          'Без крупного выигрыша фонд не возвращает даже вложенное, хотя половина компаний «нормальные». Вот почему венчурный инвестор отказывает хорошему, но небольшому бизнесу: ему нужны шансы на ×50.';
      }
      $('#vcGo').onclick = function () { run(); touch(); };
      $('#vcN').oninput = $('#vcU').oninput = function () { run(); touch(); };
      run();
    }
  });

  /* ============ 13. Оценка и рынки ============ */
  BA.sim('compound', {
    title: 'Сложный процент', group: 'Оценка и инвестиции', lesson: 'l13-1',
    desc: '«Восьмое чудо света». Как ежемесячные взносы и годы превращают небольшие суммы в капитал.',
    inputs: [
      { id: 'start', l: 'Стартовая сумма', min: 0, max: 5e6, step: 5e4, v: 1e5, f: 'rub' },
      { id: 'month', l: 'Пополнение в месяц', min: 0, max: 2e5, step: 1000, v: 15000, f: 'rub0' },
      { id: 'r', l: 'Доходность в год', min: 0, max: 0.25, step: 0.005, v: 0.12, f: 'pct' },
      { id: 'inf', l: 'Инфляция в год', min: 0, max: 0.15, step: 0.005, v: 0.06, f: 'pct' },
      { id: 'yrs', l: 'Лет', min: 1, max: 40, step: 1, v: 20, f: 'yr' }
    ],
    calc: function (v) {
      const pts = [], dep = [], real = []; let s = v.start, put = v.start;
      for (let m = 0; m <= v.yrs * 12; m++) {
        if (m % 12 === 0) { pts.push([m / 12, s]); dep.push([m / 12, put]); real.push([m / 12, s / Math.pow(1 + v.inf, m / 12)]); }
        s = s * (1 + v.r / 12) + v.month; put += v.month;
      }
      const fin = pts[pts.length - 1][1], inv = dep[dep.length - 1][1];
      return {
        k: [['Итог', fin, 'rub', 'good'], ['Вложено своих', inv, 'rub'], ['Заработал процент', fin - inv, 'rub', 'good'], ['В сегодняшних деньгах', real[real.length - 1][1], 'rub'], ['Правило 72: удвоение за', v.r > 0 ? 72 / (v.r * 100) : 0, 'yr']],
        chart: L({ series: [{ data: pts, area: true, color: 'var(--money)' }, { data: dep, color: 'var(--ink-3)', dash: true }, { data: real, color: 'var(--gold)' }], xLabel: 'годы', yFmt: rub }),
        legend: [{ name: 'Капитал', color: 'var(--money)' }, { name: 'Вложено своих', color: 'var(--ink-3)' }, { name: 'С поправкой на инфляцию', color: 'var(--gold)' }],
        v: ['', 'В первые годы почти всё — твои взносы. Потом проценты начинают зарабатывать проценты, и кривая загибается вверх. Главные рычаги — **время** и **доходность**; сравни 10 и 30 лет.']
      };
    }
  });

  BA.sim('dcf', {
    title: 'DCF: стоимость как сумма будущих денег', group: 'Оценка и инвестиции', lesson: 'l13-2',
    desc: 'Компания стоит столько, сколько денег она принесёт в будущем, приведённых к сегодняшнему дню.',
    inputs: [
      { id: 'fcf', l: 'Свободный денежный поток сейчас, в год', min: 1e7, max: 1e9, step: 1e7, v: 1e8, f: 'rub' },
      { id: 'g', l: 'Рост в ближайшие 5 лет', min: -0.1, max: 0.5, step: 0.01, v: 0.15, f: 'pct0' },
      { id: 'tg', l: 'Рост «навсегда» после 5 лет', min: 0, max: 0.06, step: 0.005, v: 0.04, f: 'pct' },
      { id: 'r', l: 'Ставка дисконтирования (WACC)', min: 0.08, max: 0.35, step: 0.005, v: 0.2, f: 'pct', h: 'Чем выше ставки в экономике и риск компании, тем она выше' }
    ],
    calc: function (v) {
      let f = v.fcf, pv = 0; const items = [];
      for (let y = 1; y <= 5; y++) { f *= 1 + v.g; const d = f / Math.pow(1 + v.r, y); pv += d; items.push({ label: 'Год ' + y, value: d, color: 'var(--money)' }); }
      const tv = v.r > v.tg ? f * (1 + v.tg) / (v.r - v.tg) : 0, tvpv = tv / Math.pow(1 + v.r, 5);
      items.push({ label: 'Хвост', value: tvpv, color: 'var(--gold)' });
      const ev = pv + tvpv;
      return {
        k: [['Стоимость бизнеса (EV)', ev, 'rub', 'good'], ['Доля «хвоста» в оценке', tvpv / ev, 'pct0', tvpv / ev > 0.7 ? 'warn' : ''], ['EV / текущий FCF', ev / v.fcf, 'x']],
        chart: BA.barChart({ items: items, fmt: rub, h: 240 }),
        v: ['', 'Двигай ставку дисконтирования: +5 п.п. — и оценка падает на десятки процентов. Поэтому при росте ключевой ставки ЦБ дешевеют акции и стартапы, особенно те, чья ценность далеко в будущем. Обрати внимание, какую долю даёт «хвост» — допущение, что компания живёт вечно.']
      };
    }
  });

  BA.sim('multiples', {
    title: 'Мультипликаторы: от EV к цене доли', group: 'Оценка и инвестиции', lesson: 'l13-2',
    desc: 'Сравнительная оценка: похожие компании стоят N годовых прибылей. Но покупатель платит за бизнес, а не за акции — учти долг.',
    inputs: [
      { id: 'ebitda', l: 'EBITDA за год', min: 1e7, max: 2e9, step: 1e7, v: 2e8, f: 'rub' },
      { id: 'm', l: 'Мультипликатор EV/EBITDA в отрасли', min: 2, max: 20, step: 0.5, v: 6, f: 'x' },
      { id: 'debt', l: 'Долг', min: 0, max: 3e9, step: 1e7, v: 4e8, f: 'rub' },
      { id: 'cash', l: 'Деньги на счетах', min: 0, max: 1e9, step: 1e7, v: 1e8, f: 'rub' },
      { id: 'own', l: 'Твоя доля', min: 0.01, max: 1, step: 0.01, v: 0.3, f: 'pct0' }
    ],
    calc: function (v) {
      const ev = v.ebitda * v.m, nd = v.debt - v.cash, eq = ev - nd;
      return {
        k: [['Стоимость бизнеса (EV)', ev, 'rub'], ['Чистый долг', nd, 'rub', nd > 0 ? 'warn' : 'good'], ['Стоимость капитала (Equity)', eq, 'rub', eq < 0 ? 'bad' : 'good'], ['Твоя доля стоит', Math.max(0, eq) * v.own, 'rub', 'good']],
        chart: BA.waterfall({ items: [{ label: 'EV', value: ev, total: true }, { label: 'Долг', value: -v.debt }, { label: 'Деньги', value: v.cash }, { label: 'Equity', value: eq, total: true }], fmt: rub, h: 240 }),
        v: ['', '**EV − чистый долг = Equity.** Две компании с одинаковой EBITDA могут стоить для акционеров совершенно по-разному: у одной долг съедает половину стоимости. На переговорах о продаже говорят о EV, а в карман тебе приходит доля Equity.']
      };
    }
  });

  BA.sim('rates', {
    title: 'Ставка ЦБ и оценка компаний', group: 'Оценка и инвестиции', lesson: 'l13-5',
    desc: 'Почему при росте ключевой ставки падают акции, дорожают кредиты и дешевеют стартапы.',
    inputs: [
      { id: 'key', l: 'Ключевая ставка', min: 0.04, max: 0.25, step: 0.005, v: 0.16, f: 'pct' },
      { id: 'prem', l: 'Премия за риск компании', min: 0.02, max: 0.25, step: 0.005, v: 0.08, f: 'pct', h: 'Стартап — 15–25%, надёжная компания — 3–6%' },
      { id: 'cf', l: 'Денежный поток через 5 лет', min: 1e7, max: 1e9, step: 1e7, v: 5e8, f: 'rub' }
    ],
    calc: function (v) {
      const r = v.key + v.prem, pv = v.cf / Math.pow(1 + r, 5), pts = [];
      for (let k = 0.04; k <= 0.25; k += 0.005) pts.push([k * 100, v.cf / Math.pow(1 + k + v.prem, 5)]);
      return {
        k: [['Ставка дисконтирования', r, 'pct'], ['Стоит сегодня', pv, 'rub', 'good'], ['Потеря от дисконта', 1 - pv / v.cf, 'pct0', 'warn']],
        chart: L({ series: [{ data: pts, area: true, color: 'var(--blue)' }], xLabel: 'ключевая ставка, %', yFmt: rub, points: [{ x: v.key * 100, y: pv, label: 'сейчас' }], xFmt: function (x) { return Math.round(x) + '%'; } }),
        v: ['', 'Деньги через 5 лет сегодня стоят меньше: их можно было положить под ставку без риска. Чем выше ставка ЦБ, тем меньше стоят **будущие** деньги — и тем сильнее падает оценка компаний, чья прибыль далеко впереди.']
      };
    }
  });

  BA.sim('loan', {
    title: 'Кредит или доля: что дороже', group: 'Инвестиции и сделки', lesson: 'l11-1',
    desc: 'Нужно 20 млн ₽. Можно взять кредит под процент или продать долю инвестору. Что выгоднее, зависит от будущего компании.',
    inputs: [
      { id: 'need', l: 'Нужно денег', min: 1e6, max: 1e8, step: 1e6, v: 2e7, f: 'rub' },
      { id: 'rate', l: 'Ставка кредита', min: 0.08, max: 0.35, step: 0.005, v: 0.22, f: 'pct' },
      { id: 'pre', l: 'Оценка компании (pre-money)', min: 1e7, max: 1e9, step: 1e7, v: 8e7, f: 'rub' },
      { id: 'exit', l: 'Стоимость компании через 5 лет', min: 1e7, max: 5e9, step: 1e7, v: 5e8, f: 'rub' }
    ],
    calc: function (v) {
      const loanCost = v.need * (Math.pow(1 + v.rate, 5) - 1), pct = v.need / (v.pre + v.need), eqCost = pct * v.exit - v.need;
      return {
        k: [['Переплата по кредиту за 5 лет', loanCost, 'rub'], ['Доля инвестору', pct, 'pct'], ['Цена доли при выходе', pct * v.exit, 'rub'], ['Что дешевле', loanCost < eqCost ? 'кредит' : 'доля', null, 'good']],
        chart: BA.barChart({ items: [{ label: 'Кредит: проценты', value: loanCost, color: 'var(--blue)' }, { label: 'Доля: упущенная стоимость', value: Math.max(0, eqCost), color: 'var(--gold)' }], fmt: rub, h: 230 }),
        v: ['', 'Если компания вырастет сильно, доля окажется самым дорогим источником денег. Если не вырастет — кредит может её убить: платить проценты надо в любом случае, а инвестор делит с тобой риск. **Долг — для предсказуемого бизнеса, капитал — для рискованного роста.**']
      };
    }
  });

  BA.sim('zopa', {
    title: 'Переговоры: ZOPA и BATNA', group: 'Команда и переговоры', lesson: 'l12-3',
    desc: 'Продаёшь компанию. У тебя есть нижняя граница, у покупателя — верхняя. Где возможна сделка?',
    inputs: [
      { id: 'sMin', l: 'Твой минимум (BATNA продавца)', min: 1e8, max: 2e9, step: 1e7, v: 6e8, f: 'rub', h: 'Лучшая альтернатива: другой покупатель или продолжать самому' },
      { id: 'bMax', l: 'Максимум покупателя (его BATNA)', min: 1e8, max: 2e9, step: 1e7, v: 9e8, f: 'rub' },
      { id: 'anchor', l: 'Твой первый запрос (якорь)', min: 1e8, max: 3e9, step: 1e7, v: 1.2e9, f: 'rub' }
    ],
    calc: function (v) {
      const zopa = v.bMax - v.sMin, mid = (Math.max(v.sMin, Math.min(v.anchor, v.bMax)) + v.sMin + v.bMax) / 3;
      return {
        k: [['ZOPA', zopa > 0 ? M(zopa) : 'нет', null, zopa > 0 ? 'good' : 'bad'], ['Вероятная цена сделки', zopa > 0 ? M(Math.min(v.bMax, Math.max(v.sMin, mid))) : '—'], ['Якорь выше максимума покупателя на', v.anchor > v.bMax ? P(v.anchor / v.bMax - 1, 0) : '—', null, v.anchor > v.bMax * 1.5 ? 'bad' : '']],
        chart: L({ series: [], xMin: 0, xMax: 3e9, yMin: 0, yMax: 1, h: 120, xFmt: function (x) { return M(x, ''); }, yFmt: function () { return ''; }, bands: zopa > 0 ? [{ x1: v.sMin, x2: v.bMax, label: 'ZOPA', color: 'var(--money-soft)' }] : [], vlines: [{ x: v.sMin, label: 'твой минимум', color: 'var(--seal)' }, { x: v.bMax, label: 'максимум покупателя', color: 'var(--blue)' }, { x: v.anchor, label: 'якорь', color: 'var(--gold)' }] }),
        v: zopa <= 0 ? ['bad', 'Зоны согласия нет: твой минимум выше максимума покупателя. Сделки не будет, сколько ни торгуйся. Нужно менять условия: рассрочка, earn-out, часть акциями.'] :
          v.anchor > v.bMax * 1.5 ? ['warn', 'Якорь слишком далёк от реальности — покупатель может просто встать из-за стола. Сильный якорь амбициозен, но обоснован.'] :
            ['good', 'Зона сделки есть. Кто лучше знает чужой BATNA и не раскрывает свой, тот забирает большую часть ZOPA. Улучшить свою позицию можно одним способом — найти второго покупателя.']
      };
    }
  });

  BA.sim('queue', {
    title: 'Очереди и загрузка: почему 95% — это плохо', group: 'Команда и переговоры', lesson: 'l9-4',
    desc: 'Кухня, поддержка, разработка — любая система с очередью. Время ожидания взрывается, когда загрузка подходит к 100%.',
    inputs: [
      { id: 'u', l: 'Загрузка команды', min: 0.3, max: 0.98, step: 0.01, v: 0.8, f: 'pct0' },
      { id: 't', l: 'Время на одну задачу, минут', min: 2, max: 120, step: 1, v: 15 }
    ],
    calc: function (v) {
      const w = v.u / (1 - v.u) * v.t, pts = [];
      for (let u = 0.3; u <= 0.98; u += 0.01) pts.push([u * 100, u / (1 - u) * v.t]);
      return {
        k: [['Среднее ожидание в очереди', w, null, w > v.t * 4 ? 'bad' : w > v.t ? 'warn' : 'good'], ['В разах от времени работы', w / v.t, 'x']].map(function (k, i) { return i === 0 ? [k[0], N(w) + ' мин', null, k[3]] : k; }),
        chart: L({ series: [{ data: pts, area: true, color: 'var(--seal)' }], xLabel: 'загрузка, %', yFmt: function (x) { return N(x) + ' мин'; }, points: [{ x: v.u * 100, y: w, label: N(w) + ' мин', anchor: v.u > 0.85 ? 'end' : 'start' }], xFmt: function (x) { return Math.round(x) + '%'; } }),
        v: ['', 'Формула очереди (упрощённо): ожидание = загрузка / (1 − загрузка) × время работы. При 80% ждут 4 «работы», при 95% — 19. Руководитель, который требует «загрузить всех на 100%», получает бесконечные очереди и сорванные сроки. Запас мощности — не лень, а условие скорости.']
      };
    }
  });
})();
