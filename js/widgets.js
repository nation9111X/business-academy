/* Интерактивные виджеты: карта бизнеса, стадии, тренажёры */
(function () {
  'use strict';
  const BA = window.BA, e = BA.esc, ic = BA.icon;
  const W = function (id, def) { def.hidden = def.hidden !== false; BA.sim(id, def); };

  /* ---------- Карта бизнеса ---------- */
  const MAPN = [
    ['problem', 'Проблема клиента', 20, 30, 'l2-1', 'Боль или желание, за решение которого человек готов платить. С неё начинается всё остальное.'],
    ['product', 'Продукт', 20, 130, 'l3-1', 'То, что решает проблему. Его качество определяет, вернётся ли клиент и сколько готов платить.'],
    ['pmf', 'Product-Market Fit', 20, 230, 'l3-2', 'Момент, когда продукт нужен рынку настолько, что клиенты остаются и приводят других.'],
    ['team', 'Команда', 20, 370, 'l9-1', 'Люди, которые делают продукт, продают и управляют. Самая большая статья расходов в большинстве компаний.'],
    ['proc', 'Процессы', 20, 470, 'l9-4', 'Повторяемые способы делать работу: качество, скорость и себестоимость зависят от них.'],
    ['price', 'Цена', 210, 30, 'l4-4', 'Сколько клиент платит. Самый сильный рычаг прибыли: +1% к цене часто даёт больше, чем +1% к продажам.'],
    ['mkt', 'Маркетинг и продажи', 210, 130, 'l5-1', 'Как незнакомцы узнают о продукте и превращаются в покупателей.'],
    ['ret', 'Удержание', 210, 230, 'l5-6', 'Доля клиентов, которые возвращаются. Определяет, накапливается рост или утекает.'],
    ['moat', 'Ров (защита)', 210, 370, 'l10-1', 'То, что мешает конкурентам отнять клиентов и прибыль: сетевой эффект, бренд, издержки, привычка.'],
    ['cust', 'Клиенты', 400, 30, 'l5-1', 'Сколько людей или компаний покупает. Растут от маркетинга и удержания, падают от высокой цены.'],
    ['cac', 'CAC', 400, 130, 'l6-2', 'Сколько стоит привлечь одного платящего клиента.'],
    ['ltv', 'LTV', 400, 230, 'l6-2', 'Сколько маржи клиент приносит за всю жизнь. Должен быть заметно больше CAC.'],
    ['cogs', 'Себестоимость', 400, 370, 'l7-2', 'Прямые расходы на каждую продажу: сырьё, доставка, серверы, комиссии.'],
    ['opex', 'Операционные расходы', 400, 470, 'l7-2', 'Расходы, которые не зависят напрямую от объёма: офис, зарплаты, маркетинг.'],
    ['rev', 'Выручка', 590, 30, 'l7-1', 'Все продажи за период. Ещё не прибыль и ещё не деньги.'],
    ['gm', 'Валовая маржа', 590, 130, 'l7-2', 'Что остаётся от выручки после себестоимости. Показывает, есть ли у бизнеса «топливо».'],
    ['profit', 'Прибыль', 590, 230, 'l7-2', 'Результат после всех расходов. Бывает на бумаге, даже когда денег на счёте нет.'],
    ['wc', 'Оборотный капитал', 590, 370, 'l7-3', 'Деньги, застрявшие в запасах и долгах клиентов. Быстрый рост его съедает.'],
    ['cash', 'Денежный поток', 590, 470, 'l7-3', 'Реальное движение денег. Компании умирают не от убытка, а от того, что кончились деньги.'],
    ['val', 'Оценка компании', 780, 30, 'l13-2', 'Сколько стоит бизнес: будущие деньги с поправкой на риск, рост и защищённость.'],
    ['cap', 'Инвестиции', 780, 130, 'l11-1', 'Деньги инвесторов или кредиторов. Покупают время и скорость, но стоят долю или проценты.'],
    ['run', 'Runway', 780, 230, 'l7-5', 'Сколько месяцев компания проживёт на текущих деньгах.'],
    ['macro', 'Ставки и экономика', 780, 370, 'l13-5', 'Ключевая ставка, инфляция, курс. Меняют цену денег, спрос и оценки.']
  ];
  const MAPE = [['problem', 'product'], ['product', 'pmf'], ['pmf', 'ret'], ['product', 'price'], ['price', 'cust'], ['price', 'rev'], ['mkt', 'cust'], ['mkt', 'cac'], ['mkt', 'opex'],
    ['ret', 'cust'], ['ret', 'ltv'], ['price', 'ltv'], ['gm', 'ltv'], ['cust', 'rev'], ['rev', 'gm'], ['cogs', 'gm'], ['gm', 'profit'], ['opex', 'profit'], ['team', 'opex'], ['team', 'product'],
    ['proc', 'cogs'], ['proc', 'ret'], ['profit', 'cash'], ['wc', 'cash'], ['cash', 'run'], ['cap', 'run'], ['cap', 'mkt'], ['rev', 'val'], ['profit', 'val'], ['moat', 'val'], ['moat', 'price'],
    ['macro', 'val'], ['macro', 'cap'], ['rev', 'wc'], ['ltv', 'val'], ['cac', 'cash']];
  W('system-map', {
    title: 'Карта бизнеса: что на что влияет', kind: 'game', hidden: false, group: 'Карты',
    desc: 'Нажми на блок. Зелёные стрелки — на что он влияет, синие — что влияет на него.',
    render: function (root, touch) {
      const N = {}; MAPN.forEach(function (n) { N[n[0]] = { id: n[0], x: n[2], y: n[3], w: 160, h: 46, t: n[1] }; });
      let s = '<div class="fig-scroll" style="padding:14px"><svg class="sysmap" viewBox="0 0 960 536" role="img" aria-label="Карта бизнеса"><defs><marker id="arM" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink-3)"/></marker></defs>';
      ['Клиент и продукт', 'Рынок', 'Экономика клиента', 'Финансы', 'Капитал и оценка'].forEach(function (t, k) { s += '<text class="t3" x="' + [20, 210, 400, 590, 780][k] + '" y="18">' + t + '</text>'; });
      MAPE.forEach(function (ed, k) {
        const a = N[ed[0]], b = N[ed[1]];
        const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const dx = bx - ax, dy = by - ay, k1 = Math.max(Math.abs(dx) / (a.w / 2 + 3), Math.abs(dy) / (a.h / 2 + 3)), k2 = Math.max(Math.abs(dx) / (b.w / 2 + 6), Math.abs(dy) / (b.h / 2 + 6));
        s += '<path class="edge" data-a="' + ed[0] + '" data-b="' + ed[1] + '" d="M' + (ax + dx / k1).toFixed(1) + ' ' + (ay + dy / k1).toFixed(1) + ' L' + (bx - dx / k2).toFixed(1) + ' ' + (by - dy / k2).toFixed(1) + '" marker-end="url(#arM)"/>';
      });
      MAPN.forEach(function (n) {
        const o = N[n[0]];
        s += '<g class="node" data-n="' + n[0] + '" tabindex="0" role="button" aria-label="' + e(n[1]) + '"><rect class="box" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" rx="6"/><text class="t" x="' + (o.x + o.w / 2) + '" y="' + (o.y + 28) + '" text-anchor="middle" style="font-weight:600">' + e(n[1]) + '</text></g>';
      });
      s += '</svg></div><div style="padding:0 18px 18px"><div class="sysmap-info" id="smInfo"><h4>С чего начать</h4>Начни слева: проблема клиента рождает продукт, продукт — удержание и цену, они — выручку, а выручка через маржу и расходы превращается в прибыль, деньги и в итоге в стоимость компании. Нажми любой блок.</div></div>';
      root.innerHTML = s;
      const svg = root.querySelector('svg');
      function sel(id) {
        touch();
        const info = MAPN.find(function (n) { return n[0] === id; });
        const outs = MAPE.filter(function (x) { return x[0] === id; }).map(function (x) { return x[1]; });
        const ins = MAPE.filter(function (x) { return x[1] === id; }).map(function (x) { return x[0]; });
        svg.querySelectorAll('.node').forEach(function (g) {
          const n = g.getAttribute('data-n'), r = g.querySelector('rect');
          g.classList.toggle('dim', n !== id && outs.indexOf(n) < 0 && ins.indexOf(n) < 0);
          r.setAttribute('class', 'box' + (n === id ? ' ink' : outs.indexOf(n) >= 0 ? ' g' : ins.indexOf(n) >= 0 ? ' b' : ''));
          g.querySelector('text').setAttribute('class', 't' + (n === id ? ' on-ink' : ''));
        });
        svg.querySelectorAll('.edge').forEach(function (p) {
          const a = p.getAttribute('data-a'), b = p.getAttribute('data-b');
          p.setAttribute('class', 'edge' + (a === id ? ' hot' : b === id ? ' hot in' : ' dim'));
        });
        const nm = function (k) { return MAPN.find(function (n) { return n[0] === k; })[1]; };
        root.querySelector('#smInfo').innerHTML = '<h4>' + e(info[1]) + '</h4><p style="margin:0 0 8px">' + e(info[5]) + '</p>' +
          (ins.length ? '<div><b style="color:var(--blue)">Зависит от:</b> ' + ins.map(nm).join(', ') + '</div>' : '') +
          (outs.length ? '<div><b style="color:var(--money)">Влияет на:</b> ' + outs.map(nm).join(', ') + '</div>' : '') +
          (BA.lessons[info[4]] ? '<div style="margin-top:8px"><a href="#' + info[4] + '">Урок: ' + e(BA.lessons[info[4]].title) + ' →</a></div>' : '');
      }
      svg.querySelectorAll('.node').forEach(function (g) {
        g.addEventListener('click', function () { sel(g.getAttribute('data-n')); });
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); sel(g.getAttribute('data-n')); } });
      });
    }
  });

  /* ---------- Стадии компании ---------- */
  const STG = [
    ['Идея', '0', 'Понять, есть ли проблема, за решение которой платят', 'Число интервью, доля людей, у которых проблема острая', 'Свои деньги, 0–1 млн ₽', '1–2 основателя', 'Влюбиться в решение и не поговорить с клиентами', 'l2-2'],
    ['Проверка', '1', 'Доказать, что люди готовы платить — до продукта', 'Предзаказы, письма о намерениях, конверсия лендинга', 'Свои, друзья и семья, гранты; до 5 млн ₽', '2–3 человека', 'Строить полгода продукт без единой продажи', 'l3-1'],
    ['MVP', '2', 'Выпустить минимальный продукт и получить первых платящих', 'Первые 10–100 клиентов, активация, удержание первых когорт', 'Pre-seed: ангелы, акселераторы; 5–30 млн ₽', '3–7 человек', 'Добавлять функции вместо того, чтобы изучать, почему уходят', 'l3-1'],
    ['PMF', '3', 'Найти повторяемый спрос: клиенты остаются и приводят других', 'Плато удержания, тест Шона Эллиса 40%+, органический рост', 'Seed: 30–200 млн ₽', '7–20 человек', 'Масштабировать маркетинг до PMF', 'l3-2'],
    ['Рост', '4', 'Построить машину привлечения и продаж, которая окупается', 'LTV/CAC ≥ 3, окупаемость < 18 мес., рост выручки 2–3× в год', 'Раунд A/B: 0,3–3 млрд ₽', '20–200 человек', 'Нанимать быстрее, чем выстраиваются процессы', 'l6-2'],
    ['Зрелость', '5', 'Прибыльность, новые рынки и продукты, лидерство', 'EBITDA, свободный денежный поток, доля рынка', 'Раунды C+, долг, private equity', '200+ человек', 'Перестать изобретать и проспать новую технологию', 'l10-3'],
    ['Выход', '6', 'Превратить стоимость компании в деньги для акционеров', 'Оценка, мультипликаторы, качество отчётности', 'M&A, IPO, продажа доли (secondary)', 'Совет директоров, CFO', 'Продать слишком рано или не подготовить отчётность', 'l14-1']
  ];
  W('stages', {
    title: 'Путь компании: от идеи до выхода', kind: 'game', hidden: false, group: 'Карты',
    desc: 'Выбери стадию: какая цель, какие метрики, какие деньги и какая типичная ошибка.',
    render: function (root, touch) {
      root.innerHTML = '<div style="padding:18px 20px"><div class="stage-track">' + STG.map(function (s, k) { return '<button data-k="' + k + '"><small>стадия ' + k + '</small>' + e(s[0]) + '</button>'; }).join('') + '</div><div class="stage-info" id="stI"></div></div>';
      function sel(k) {
        root.querySelectorAll('.stage-track button').forEach(function (b, i) { b.classList.toggle('on', i === k); });
        const s = STG[k];
        root.querySelector('#stI').innerHTML = '<div><b>Цель</b>' + e(s[2]) + '</div><div><b>Метрики</b>' + e(s[3]) + '</div><div><b>Деньги</b>' + e(s[4]) + '</div><div><b>Команда</b>' + e(s[5]) + '</div><div><b>Типичная ошибка</b>' + e(s[6]) + '</div>' +
          (BA.lessons[s[7]] ? '<div><b>Урок</b><a href="#' + s[7] + '">' + e(BA.lessons[s[7]].title) + ' →</a></div>' : '');
      }
      root.querySelectorAll('.stage-track button').forEach(function (b) { b.onclick = function () { sel(+b.getAttribute('data-k')); touch(); }; });
      sel(0);
    }
  });

  /* ---------- универсальный «сортировщик» (Mom Test, переводчик) ---------- */
  function quizWidget(root, touch, items, opt) {
    let i = 0, ok = 0;
    function draw() {
      if (i >= items.length) {
        root.innerHTML = '<div style="padding:20px" class="sort-game"><div class="outcome ' + (ok >= items.length * .8 ? 'good' : 'mid') + '"><h4>' + ok + ' из ' + items.length + '</h4>' + e(opt.end) + '</div><div class="btnrow"><button class="btn quiet" id="qwA">Пройти ещё раз</button></div></div>';
        root.querySelector('#qwA').onclick = function () { i = 0; ok = 0; draw(); };
        if (ok === items.length) BA.award('widget-perfect:' + opt.id, 20, 'тренажёр без ошибок');
        return;
      }
      const it = items[i];
      root.innerHTML = '<div style="padding:20px" class="sort-game"><div class="eyebrow">' + e(opt.label) + ' · ' + (i + 1) + ' из ' + items.length + '</div><div class="sort-card">' + BA.inline(it.p) + '</div>' +
        '<div class="opts">' + it.o.map(function (o, k) { return '<button class="opt" data-k="' + k + '"><span class="mk">' + 'АБВГД'[k] + '</span><span>' + BA.inline(o) + '</span></button>'; }).join('') + '</div><div class="why" hidden></div>' +
        '<div class="btnrow" hidden id="qwN"><button class="btn small">Дальше</button></div></div>';
      root.querySelectorAll('.opt').forEach(function (b) {
        b.onclick = function () {
          touch();
          const k = +b.getAttribute('data-k'); if (k === it.a) ok++;
          root.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; const kk = +x.getAttribute('data-k'); if (kk === it.a) x.classList.add('ok'); else if (kk === k) x.classList.add('bad'); });
          const w = root.querySelector('.why'); w.hidden = false; w.innerHTML = (k === it.a ? '<b>Верно.</b> ' : '<b>Не совсем.</b> ') + BA.inline(it.e);
          root.querySelector('#qwN').hidden = false; root.querySelector('#qwN .btn').onclick = function () { i++; draw(); };
        };
      });
    }
    draw();
  }
  W('momtest', {
    title: 'Тест мамы: хороший или плохой вопрос?', kind: 'game', hidden: false, group: 'Тренажёры',
    desc: 'Какие вопросы клиенту дают правду, а какие — вежливую ложь? +20 XP за прохождение без ошибок.',
    render: function (root, touch) { quizWidget(root, touch, BA.extra.momtest || [], { id: 'momtest', label: 'Вопрос клиенту', end: 'Правило: спрашивай о прошлом и фактах, а не о будущем и мнениях. Не рассказывай свою идею, пока не узнал, как человек живёт сейчас.' }); }
  });
  W('translator', {
    title: 'Переводчик с инвесторского', kind: 'game', hidden: false, group: 'Тренажёры',
    desc: 'Фразы с питчей и шоу инвесторов. Что на самом деле сказано — и чего не хватает? +20 XP без ошибок.',
    render: function (root, touch) { quizWidget(root, touch, BA.extra.translator || [], { id: 'translator', label: 'Фраза с питча', end: 'Красивая фраза — это всегда вопрос: за какой период, по какой методике, на каких клиентах. Сильный собеседник не восхищается, а уточняет.' }); }
  });

  /* ---------- 30 вопросов инвестора ---------- */
  W('investorqa', {
    title: 'Тренажёр: неудобные вопросы инвестора', kind: 'game', hidden: false, group: 'Тренажёры',
    desc: 'Вопрос → подумай, что ответил бы → открой, что на самом деле проверяет инвестор и как звучит сильный ответ.',
    render: function (root, touch) {
      const Q = BA.extra.investorQA || []; let i = 0;
      function draw() {
        const q = Q[i];
        root.innerHTML = '<div style="padding:20px" class="sort-game"><div class="eyebrow">Вопрос ' + (i + 1) + ' из ' + Q.length + ' · ' + e(q.c || '') + '</div><div class="sort-card" style="font-style:normal;font-family:var(--f-display);font-size:1.35rem;font-weight:700">«' + e(q.q) + '»</div>' +
          '<div class="btnrow"><button class="btn" id="iqS">Показать разбор</button></div><div id="iqA" hidden><div class="callout" style="margin-bottom:10px"><div class="tag">' + ic('target') + 'Что проверяют</div><div class="in">' + BA.inline(q.w) + '</div></div>' +
          '<div class="grid2"><div class="outcome bad"><h4>Слабый ответ</h4>' + BA.inline(q.b) + '</div><div class="outcome good"><h4>Сильный ответ</h4>' + BA.inline(q.g) + '</div></div></div>' +
          '<div class="btnrow"><button class="btn quiet small" id="iqP"' + (i ? '' : ' disabled') + '>← Назад</button><button class="btn quiet small" id="iqN"' + (i < Q.length - 1 ? '' : ' disabled') + '>Следующий →</button><button class="btn quiet small" id="iqR">' + ic('dice') + 'Случайный</button></div></div>';
        root.querySelector('#iqS').onclick = function () { root.querySelector('#iqA').hidden = false; this.parentNode.hidden = true; touch(); };
        root.querySelector('#iqP').onclick = function () { i--; draw(); };
        root.querySelector('#iqN').onclick = function () { i++; draw(); };
        root.querySelector('#iqR').onclick = function () { i = Math.floor(Math.random() * Q.length); draw(); };
      }
      if (Q.length) draw();
    }
  });

  /* ---------- Lean Canvas ---------- */
  const CV = [['c-prob', 'Проблема', '1–3 главные проблемы клиента'], ['c-sol', 'Решение', 'Что именно ты делаешь'], ['c-met', 'Ключевые метрики', 'Что покажет, что всё работает'],
    ['c-uvp', 'Ценностное предложение', 'Одна фраза: почему ты, а не другие'], ['c-adv', 'Нечестное преимущество', 'Что нельзя скопировать или купить'], ['c-ch', 'Каналы', 'Как клиенты о тебе узнают'],
    ['c-seg', 'Сегменты клиентов', 'Кто платит. Кто первые последователи'], ['c-cost', 'Структура расходов', 'Постоянные и переменные'], ['c-rev', 'Потоки дохода', 'Кто, за что и сколько платит']];
  W('canvas', {
    title: 'Lean Canvas: бизнес-модель на одной странице', kind: 'game', hidden: false, group: 'Тренажёры',
    desc: 'Заполни девять блоков для своей идеи. Сохраняется автоматически и попадает в рабочую тетрадь.',
    render: function (root, touch) {
      const st = BA.S.tasks.canvas = BA.S.tasks.canvas || {};
      root.innerHTML = '<div style="padding:16px"><div class="canvas9">' + CV.map(function (c) { return '<div class="cell ' + c[0] + '"><b>' + e(c[1]) + '</b><span>' + e(c[2]) + '</span><textarea id="cv-' + c[0] + '" data-c="' + c[0] + '" aria-label="' + e(c[1]) + '">' + e(st[c[0]] || '') + '</textarea></div>'; }).join('') + '</div>' +
        '<div class="btnrow" style="margin-top:10px"><span class="saved" id="cvMsg"></span><button class="btn small quiet" id="cvEx">Пример: «Маяк»</button></div></div>';
      let t;
      root.querySelectorAll('textarea').forEach(function (ta) {
        ta.oninput = function () {
          st[ta.getAttribute('data-c')] = ta.value; clearTimeout(t);
          t = setTimeout(function () { BA.save(); root.querySelector('#cvMsg').textContent = 'Сохранено'; }, 500);
          const n = CV.filter(function (c) { return (st[c[0]] || '').trim().length > 5; }).length;
          if (n >= 7) { st._saved = st._saved || Date.now(); BA.award('canvas', 30, 'Lean Canvas заполнен'); }
          touch();
        };
      });
      root.querySelector('#cvEx').onclick = function () {
        const ex = { 'c-prob': 'Работающим семьям некогда планировать меню и ходить в магазин; доставка готовой еды дорогая и однообразная', 'c-sol': 'Наборы продуктов с рецептами на 20–30 минут, доставка 2 раза в неделю', 'c-met': 'Повторные заказы за 60 дней, средний чек, маржа после доставки', 'c-uvp': 'Домашний ужин за 25 минут без похода в магазин', 'c-adv': 'Своя кухня-сборка и база рецептов, протестированных на 5 000 семей', 'c-ch': 'Рекомендации, сообщества мам, промо в корпоративных чатах', 'c-seg': 'Пары 28–40 лет с детьми в крупных городах; первые — родители из школьных чатов', 'c-cost': 'Продукты 45–50% чека, доставка, кухня, команда, реклама', 'c-rev': 'Оплата набора 2 000–3 000 ₽; подписка со скидкой 7%' };
        root.querySelectorAll('textarea').forEach(function (ta) { if (!ta.value.trim()) { ta.placeholder = ex[ta.getAttribute('data-c')]; } });
        root.querySelector('#cvMsg').textContent = 'Пример показан серым в пустых полях';
      };
    }
  });

  /* ---------- Подбор источника денег ---------- */
  const FQ = [
    ['Насколько предсказуем твой доход?', [['Стабильная выручка уже есть', { loan: 3, boot: 2 }], ['Выручка есть, но скачет', { angel: 1, boot: 2, loan: 1 }], ['Выручки пока нет', { angel: 2, grant: 2, ff: 2 }]]],
    ['Может ли бизнес вырасти в 10 раз за 5 лет?', [['Да, рынок огромный, продукт масштабируется', { vc: 3, angel: 2 }], ['Может вырасти в 2–3 раза', { loan: 2, boot: 2, strat: 1 }], ['Это стабильный локальный бизнес', { boot: 3, loan: 2 }]]],
    ['Зачем нужны деньги?', [['Купить оборудование или товар', { loan: 3, lease: 3 }], ['Нанять команду и ускорить рост', { vc: 2, angel: 2 }], ['Проверить идею', { ff: 2, grant: 2, boot: 2, angel: 1 }], ['Закрыть кассовый разрыв', { loan: 2, factoring: 3 }]]],
    ['Готов ли ты делиться долей и контролем?', [['Да, ради скорости', { vc: 2, angel: 2, strat: 1 }], ['Немного, с хорошим партнёром', { angel: 2, strat: 2 }], ['Нет, хочу владеть всем', { boot: 3, loan: 2, grant: 1 }]]]
  ];
  const FS = { boot: ['Бутстрэп', 'Растёшь на выручке и своих деньгах. Медленнее, зато всё твоё.'], loan: ['Банковский кредит', 'Для предсказуемого бизнеса с выручкой. Нужен залог или поручительство, платить придётся в любом случае.'],
    lease: ['Лизинг', 'Оборудование и транспорт в рассрочку: вещь сама служит залогом.'], factoring: ['Факторинг', 'Банк платит тебе сразу за отгрузку, а сам ждёт денег клиента. Лечит кассовые разрывы в B2B.'],
    ff: ['Друзья и семья', 'Быстро и без формальностей, но оформи договор: так ты сохранишь отношения.'], grant: ['Гранты и господдержка', 'Невозвратные деньги на конкретную цель. Бумажная работа и отчётность обязательны.'],
    angel: ['Бизнес-ангел', 'Частный инвестор на ранней стадии: деньги плюс опыт и связи. Обычно 5–25% доли.'], vc: ['Венчурный фонд', 'Большие деньги за долю, но фонд ждёт роста в десятки раз. Подходит только для масштабируемых идей.'],
    strat: ['Стратегический инвестор', 'Крупная компания из отрасли: деньги, каналы сбыта, иногда — будущая покупка.'] };
  W('funding', {
    title: 'Какие деньги тебе подходят', kind: 'game', hidden: false, group: 'Тренажёры',
    desc: 'Четыре вопроса о твоём бизнесе — и карта подходящих источников финансирования.',
    render: function (root, touch) {
      const ans = [];
      function draw() {
        if (ans.length < FQ.length) {
          const q = FQ[ans.length];
          root.innerHTML = '<div style="padding:20px" class="sort-game"><div class="eyebrow">Вопрос ' + (ans.length + 1) + ' из ' + FQ.length + '</div><div class="sort-card" style="font-style:normal;font-family:var(--f-ui);font-weight:600">' + e(q[0]) + '</div><div class="choices">' +
            q[1].map(function (o, k) { return '<button class="choice" data-k="' + k + '">' + e(o[0]) + '</button>'; }).join('') + '</div></div>';
          root.querySelectorAll('.choice').forEach(function (b) { b.onclick = function () { ans.push(+b.getAttribute('data-k')); touch(); draw(); }; });
          return;
        }
        const sc = {}; ans.forEach(function (a, i) { const w = FQ[i][1][a][1]; Object.keys(w).forEach(function (k) { sc[k] = (sc[k] || 0) + w[k]; }); });
        const top = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; }).slice(0, 3);
        root.innerHTML = '<div style="padding:20px" class="sort-game"><div class="eyebrow">Тебе подходят в первую очередь</div>' + top.map(function (k, i) { return '<div class="outcome ' + (i === 0 ? 'good' : '') + '"><h4>' + (i + 1) + '. ' + e(FS[k][0]) + '</h4>' + e(FS[k][1]) + '</div>'; }).join('') +
          '<div class="btnrow"><button class="btn quiet" id="fR">Пройти заново</button></div></div>';
        root.querySelector('#fR').onclick = function () { ans.length = 0; draw(); };
      }
      draw();
    }
  });
})();
