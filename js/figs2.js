/* Схемы к урокам уровня MBA */
(function () {
  'use strict';
  const BA = window.BA, e = BA.esc;
  function fig(svg, cap, scroll) { return '<figure class="fig"><div class="' + (scroll ? 'fig-scroll' : '') + '">' + svg + '</div>' + (cap ? '<figcaption>' + BA.inline(cap) + '</figcaption>' : '') + '</figure>'; }
  const D = BA.diagram;
  function txt(x, y, t, c, a, st) { return '<text class="' + (c || 't') + '" x="' + x + '" y="' + y + '" text-anchor="' + (a || 'middle') + '"' + (st ? ' style="' + st + '"' : '') + '>' + e(t) + '</text>'; }
  function lines(x, y, arr, c, a, dy) { return arr.map(function (t, k) { return txt(x, y + k * (dy || 15), t, c || 't2', a); }).join(''); }
  // плавная кривая через опорные точки
  function smooth(pts) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      for (let t = 0; t < 1; t += 0.05) {
        const t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (j) { return 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3); }));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const PX = function (x, xmax) { return 16 + x / xmax * 606; };

  BA.fig('plc', function () {
    const sales = smooth([[0, 4], [2, 12], [4.5, 62], [6.5, 92], [8.2, 80], [10, 38]], 0.1);
    const profit = smooth([[0, -12], [2, -16], [3.5, 4], [6, 42], [8.2, 30], [10, 4]], 0.1);
    let s = BA.lineChart({ h: 280, xMin: 0, xMax: 10, yMin: -25, yMax: 105, xTicks: [], yFmt: function () { return ''; }, left: 16, series: [{ data: sales, color: 'var(--money)', area: true, end: false }, { data: profit, color: 'var(--gold)', end: false }],
      hlines: [{ y: 0, color: 'var(--ink-3)' }], vlines: [{ x: 2.6, color: 'var(--rule)' }, { x: 5.8, color: 'var(--rule)' }, { x: 8.3, color: 'var(--rule)' }] });
    s = s.replace('</svg>', [[1.3, 'Внедрение'], [4.2, 'Рост'], [7.05, 'Зрелость'], [9.15, 'Спад']].map(function (p) { return txt(PX(p[0], 10), 262, p[1], 't3'); }).join('') + '</svg>');
    return fig(s + BA.legend([{ name: 'Продажи', color: 'var(--money)' }, { name: 'Прибыль', color: 'var(--gold)' }]), 'Жизненный цикл продукта. На внедрении прибыль отрицательная — идут вложения в рынок; максимум прибыли обычно приходится на зрелость, когда рост уже замедлился.', true);
  });

  BA.fig('cjm', function () {
    const st = ['Поиск', 'Запись', 'Ожидание', 'Лечение', 'После визита'], em = [0.1, -0.7, -0.6, 0.6, 0.2];
    const pain = [['мало отзывов', 'и цен'], ['форма не работает,', '6 минут на линии'], ['25 минут', 'сверх времени'], ['—'], ['никто не напомнил', 'о контроле']];
    const opp = [['цены и отзывы', 'на сайте'], ['рабочая', 'онлайн-запись'], ['SMS', 'о задержке'], ['объяснить', 'план лечения'], ['напоминание', 'через полгода']];
    const X0 = 118, CW = 126, W = X0 + CW * 5 + 8;
    let s = '<svg viewBox="0 0 ' + W + ' 330" role="img" aria-label="Карта пути клиента">';
    [['ЭТАП', 22], ['ЭМОЦИИ', 92], ['БОЛИ', 200], ['ВОЗМОЖНОСТИ', 262]].forEach(function (r) { s += txt(10, r[1], r[0], 't3', 'start'); });
    st.forEach(function (n, k) {
      const x = X0 + k * CW;
      s += '<rect class="box ' + (k % 2 ? '' : 'b') + '" x="' + (x + 2) + '" y="6" width="' + (CW - 4) + '" height="26" rx="5"/>' + txt(x + CW / 2, 24, n, 't');
      s += '<line class="grid" x1="' + x + '" x2="' + x + '" y1="40" y2="316"/>';
      s += lines(x + CW / 2, 196, pain[k], 't2'); s += lines(x + CW / 2, 258, opp[k], 't2');
    });
    s += '<line class="grid" x1="' + X0 + '" x2="' + (W - 8) + '" y1="100" y2="100" stroke-dasharray="3 4"/>';
    const P = em.map(function (v, k) { return [X0 + k * CW + CW / 2, 100 - v * 52]; });
    s += '<polyline points="' + P.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="var(--money)" stroke-width="2.4" stroke-linejoin="round"/>';
    P.forEach(function (p, k) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + (em[k] < 0 ? 'var(--seal)' : 'var(--money)') + '" stroke="var(--sheet)" stroke-width="2"/>'; });
    s += txt(X0 - 8, 54, 'хорошо', 'tm', 'end') + txt(X0 - 8, 150, 'плохо', 'tm', 'end');
    s += '<line class="grid" x1="10" x2="' + (W - 8) + '" y1="176" y2="176"/><line class="grid" x1="10" x2="' + (W - 8) + '" y1="238" y2="238"/></svg>';
    return fig(s, 'Карта пути клиента стоматологии. Провалы эмоциональной кривой показывают, где клиент разочаровывается, — именно там самые ценные улучшения.', true);
  });

  BA.fig('maslow', function () {
    const lv = [['Самоактуализация', 'рост, смысл, творчество', 'интересные задачи, развитие', 'y'], ['Уважение', 'признание, статус', 'признание, карьерный рост', 'g'], ['Принадлежность', 'дружба, группа', 'команда, культура', 'b'], ['Безопасность', 'стабильность, защита', 'стабильный доход, договор', ''], ['Физиологические', 'еда, сон, отдых', 'достойная зарплата, условия', 'r']];
    const cx = 200, top = 14, H = 56, base = 330;
    let s = '<svg viewBox="0 0 640 300" role="img" aria-label="Пирамида потребностей">';
    lv.forEach(function (l, k) {
      const y0 = top + k * H, y1 = y0 + H - 4, w0 = 40 + k * (base - 40) / 5, w1 = 40 + (k + 1) * (base - 40) / 5;
      s += '<polygon class="box ' + l[3] + '" points="' + (cx - w0 / 2) + ',' + y0 + ' ' + (cx + w0 / 2) + ',' + y0 + ' ' + (cx + w1 / 2) + ',' + y1 + ' ' + (cx - w1 / 2) + ',' + y1 + '"/>';
      if (k === 0) s += txt(cx, y0 + 34, '★', 't');
      else s += txt(cx, y0 + 24, l[0], 't', 'middle', 'font-weight:600') + txt(cx, y0 + 40, l[1], 't2');
      s += '<line class="grid" x1="' + (cx + w1 / 2 + 8) + '" x2="384" y1="' + (y0 + H / 2) + '" y2="' + (y0 + H / 2) + '" stroke-dasharray="2 3"/>';
      s += txt(392, y0 + H / 2 - 4, k === 0 ? l[0] + ': рост, смысл' : 'на работе', k === 0 ? 't' : 't3', 'start', k === 0 ? 'font-weight:600' : '') + txt(392, y0 + H / 2 + 13, l[2], 't2', 'start');
    });
    s += '</svg>';
    return fig(s, 'Иерархия потребностей Маслоу и её проекция на работу. Пирамиду нарисовали популяризаторы, а строгая очерёдность уровней подтверждается слабо — но без базовых условий высокие мотивы не включаются.', true);
  });

  BA.fig('tuckman', function () {
    const d = smooth([[0, 45], [1, 40], [2, 22], [3, 58], [4, 88], [5, 90]], 0.05);
    let s = BA.lineChart({ h: 260, xMin: 0, xMax: 5, yMin: 0, yMax: 100, xTicks: [], yFmt: function () { return ''; }, left: 16, series: [{ data: d, color: 'var(--money)', area: true }],
      points: [{ x: 2, y: 22, label: 'конфликты — это нормально', color: 'var(--seal)' }] });
    s = s.replace('</svg>', [[0.5, 'Формирование'], [1.75, 'Шторм'], [3.05, 'Нормирование'], [4.35, 'Функционирование']].map(function (p) { return txt(PX(p[0], 5), 244, p[1], 't3'); }).join('') + txt(26, 30, 'эффективность команды', 't2', 'start') + '</svg>');
    return fig(s, 'Стадии развития команды по Брюсу Такману. Эффективность часто проседает на этапе «шторма», и это не провал, а путь к слаженной работе. Новый человек или новая задача могут вернуть команду назад.', true);
  });

  BA.fig('pdca', function () {
    const s = D({ w: 640, h: 300, mk: 'pd', nodes: [
      { id: 'p', x: 70, y: 30, w: 190, h: 70, t: 'Plan — планируй', s: 'проблема, причина,\nгипотеза улучшения', c: 'b' },
      { id: 'd', x: 380, y: 30, w: 190, h: 70, t: 'Do — сделай', s: 'попробуй в малом\nмасштабе', c: 'g' },
      { id: 'c', x: 380, y: 200, w: 190, h: 70, t: 'Check — проверь', s: 'сравни результат\nс ожиданием', c: 'y' },
      { id: 'a', x: 70, y: 200, w: 190, h: 70, t: 'Act — действуй', s: 'закрепи стандарт\nили начни заново', c: 'r' }],
      edges: [['p', 'd'], ['d', 'c'], ['c', 'a'], ['a', 'p']],
      labels: [{ x: 320, y: 158, t: 'ЦИКЛ ДЕМИНГА', c: 't3' }] });
    return fig(s, 'Цикл PDCA — основа постоянных улучшений в бережливом производстве. Это тот же цикл «создать — измерить — научиться», который Эрик Рис перенёс в стартапы.', true);
  });

  BA.fig('scrum', function () {
    const s = D({ w: 680, h: 250, mk: 'sc', nodes: [
      { id: 'pb', x: 6, y: 80, w: 112, h: 70, t: 'Бэклог', s: 'продукта:\nвсё, что нужно', c: 'y' },
      { id: 'pl', x: 146, y: 80, w: 112, h: 70, t: 'Планирование', s: 'что берём\nв спринт' },
      { id: 'sp', x: 286, y: 64, w: 130, h: 102, t: 'Спринт', s: '1–4 недели\n+ ежедневная\nвстреча 15 минут', c: 'g' },
      { id: 'in', x: 444, y: 80, w: 112, h: 70, t: 'Результат', s: 'работающий\nкусок продукта', c: 'b' },
      { id: 'rv', x: 580, y: 22, w: 94, h: 62, t: 'Обзор', s: 'с клиентами' },
      { id: 'rt', x: 580, y: 150, w: 94, h: 62, t: 'Ретро', s: 'как работать\nлучше' }],
      edges: [['pb', 'pl'], ['pl', 'sp'], ['sp', 'in'], ['in', 'rv'], ['in', 'rt']],
      labels: [{ x: 340, y: 236, t: 'ПОСЛЕ ОБЗОРА И РЕТРОСПЕКТИВЫ — СЛЕДУЮЩИЙ СПРИНТ', c: 't3' }] });
    return fig(s, 'Как устроен Scrum. Короткие циклы с работающим результатом в конце каждого позволяют часто сверяться с клиентами и менять план, пока это дёшево.', true);
  });

  BA.fig('swot', function () {
    const Q = [[60, 30, 'g', 'S — сильные стороны', ['удобное место у дома', 'лояльное ядро клиентов']], [345, 30, 'r', 'W — слабые стороны', ['старое оборудование', 'нет онлайн-записи']],
      [60, 160, 'b', 'O — возможности', ['интерес к здоровью у 45+', 'спрос на занятия у дома']], [345, 160, 'y', 'T — угрозы', ['крупная сеть открывается', 'через квартал']]];
    let s = '<svg viewBox="0 0 640 300" role="img" aria-label="SWOT-анализ">';
    Q.forEach(function (q) { s += '<rect class="box ' + q[2] + '" x="' + q[0] + '" y="' + q[1] + '" width="275" height="120" rx="8"/>' + txt(q[0] + 16, q[1] + 28, q[3], 't', 'start', 'font-weight:600') + lines(q[0] + 16, q[1] + 56, q[4].map(function (t) { return '• ' + t; }), 't2', 'start', 18); });
    s += txt(46, 92, 'ВНУТРИ', 't3', 'middle') .replace('<text', '<text transform="rotate(-90 46 92)"') + txt(46, 222, 'СНАРУЖИ', 't3', 'middle').replace('<text', '<text transform="rotate(-90 46 222)"');
    s += txt(197, 294, 'ПОМОГАЮТ', 't3') + txt(482, 294, 'МЕШАЮТ', 't3') + '</svg>';
    return fig(s, 'SWOT фитнес-клуба у дома. Полезен только конкретный SWOT, который потом превращается в решения через сочетания квадрантов (матрица TOWS).', true);
  });

  BA.fig('valuechain', function () {
    const sup = ['Инфраструктура: управление, финансы, юристы', 'Управление персоналом', 'Развитие технологий', 'Закупки'];
    const pri = [['Входящая', 'логистика'], ['Операции'], ['Исходящая', 'логистика'], ['Маркетинг', 'и продажи'], ['Сервис']];
    let s = '<svg viewBox="0 0 640 300" role="img" aria-label="Цепочка ценности Портера">';
    sup.forEach(function (t, k) { const y = 24 + k * 34; s += '<rect class="box b" x="10" y="' + y + '" width="520" height="30" rx="4"/>' + txt(24, y + 20, t, 't2', 'start'); });
    const cw = 104;
    pri.forEach(function (t, k) { const x = 10 + k * cw; s += '<rect class="box g" x="' + x + '" y="168" width="' + (cw - 4) + '" height="100" rx="4"/>' + lines(x + (cw - 4) / 2, 214, t, 't', 'middle', 16); });
    s += '<polygon class="box y" points="534,24 590,24 630,146 590,268 534,268"/>' + txt(575, 128, 'Маржа', 't', 'middle', 'font-weight:600') + txt(575, 146, 'ценность', 't2') + txt(575, 160, 'минус', 't2') + txt(575, 174, 'затраты', 't2');
    s += txt(270, 290, 'ОСНОВНЫЕ ВИДЫ ДЕЯТЕЛЬНОСТИ', 't3') + txt(270, 16, 'ВСПОМОГАТЕЛЬНЫЕ ВИДЫ ДЕЯТЕЛЬНОСТИ', 't3') + '</svg>';
    return fig(s, 'Цепочка ценности Майкла Портера. Преимущество возникает в звеньях, где компания делает заметно дешевле конкурентов или заметно лучше для клиента.', true);
  });

  BA.fig('ansoff', function () {
    const C = [[80, 40, 'g', 'Проникновение на рынок', 'больше продаж тем же клиентам', 'кофейня: комбо, лояльность'], [350, 40, 'b', 'Развитие продукта', 'новое для тех же клиентов', 'кофейня: выпечка, зёрна домой'],
      [80, 160, 'b', 'Развитие рынка', 'то же — новым клиентам', 'кофейня: новый район, офисы'], [350, 160, 'r', 'Диверсификация', 'новое — для новых', 'кофейня: обжарка для других']];
    let s = '<svg viewBox="0 0 640 310" role="img" aria-label="Матрица Ансоффа"><defs><marker id="arAn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--seal)"/></marker></defs>';
    C.forEach(function (c) { s += '<rect class="box ' + c[2] + '" x="' + c[0] + '" y="' + c[1] + '" width="260" height="110" rx="8"/>' + txt(c[0] + 130, c[1] + 36, c[3], 't', 'middle', 'font-weight:600') + txt(c[0] + 130, c[1] + 58, c[4], 't2') + txt(c[0] + 130, c[1] + 82, c[5], 'tm'); });
    s += txt(210, 22, 'ТЕКУЩИЕ ПРОДУКТЫ', 't3') + txt(480, 22, 'НОВЫЕ ПРОДУКТЫ', 't3');
    s += txt(60, 95, 'ТЕКУЩИЕ РЫНКИ', 't3').replace('<text', '<text transform="rotate(-90 60 95)"') + txt(60, 215, 'НОВЫЕ РЫНКИ', 't3').replace('<text', '<text transform="rotate(-90 60 215)"');
    s += '<path d="M230 290 L560 290" stroke="var(--seal)" stroke-width="1.6" marker-end="url(#arAn)"/>' + txt(395, 284, 'риск растёт', 't2', 'middle', 'fill:var(--seal)') + '</svg>';
    return fig(s, 'Матрица Ансоффа. Каждый шаг от левого верхнего угла добавляет неизвестное: сначала продукт или рынок, потом оба сразу.', true);
  });

  BA.fig('bcg', function () {
    const C = [[90, 30, 'y', 'Знак вопроса', 'рынок растёт, доля мала:', 'вложиться или выйти'], [360, 30, 'g', 'Звезда', 'лидер растущего рынка:', 'вкладывать в рост'],
      [90, 160, 'r', 'Собака', 'мала доля, рынок стоит:', 'продать или закрыть'], [360, 160, 'b', 'Дойная корова', 'лидер зрелого рынка:', 'собирать деньги']];
    let s = '<svg viewBox="0 0 640 310" role="img" aria-label="Матрица BCG"><defs><marker id="arBc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--money)"/></marker></defs>';
    C.forEach(function (c) { s += '<rect class="box ' + c[2] + '" x="' + c[0] + '" y="' + c[1] + '" width="250" height="110" rx="8"/>' + txt(c[0] + 125, c[1] + 40, c[3], 'td') + txt(c[0] + 125, c[1] + 64, c[4], 't2') + txt(c[0] + 125, c[1] + 82, c[5], 't2'); });
    s += '<path d="M400 210 C 300 230, 250 150, 230 128" fill="none" stroke="var(--money)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#arBc)"/>' + txt(300, 156, 'деньги', 't2', 'middle', 'fill:var(--money);font-weight:600');
    s += '<path d="M325 70 L 368 70" stroke="var(--money)" stroke-width="1.6" marker-end="url(#arBc)"/><path d="M500 140 L 500 162" stroke="var(--money)" stroke-width="1.6" marker-end="url(#arBc)"/>';
    s += txt(215, 296, 'НИЗКАЯ ДОЛЯ', 't3') + txt(485, 296, 'ВЫСОКАЯ ДОЛЯ', 't3');
    s += txt(66, 85, 'РЫНОК РАСТЁТ', 't3').replace('<text', '<text transform="rotate(-90 66 85)"') + txt(66, 215, 'РЫНОК СТОИТ', 't3').replace('<text', '<text transform="rotate(-90 66 215)"') + '</svg>';
    return fig(s, 'Матрица BCG. Деньги дойных коров финансируют знаки вопроса, удачные из них становятся звёздами, а звёзды со временем — новыми коровами.', true);
  });

  BA.fig('three-horizons', function () {
    const h1 = smooth([[0, 60], [3, 72], [6, 62], [10, 30]], 0.1), h2 = smooth([[0, 8], [2, 12], [5, 45], [8, 70], [10, 72]], 0.1), h3 = smooth([[0, 2], [4, 4], [7, 18], [10, 58]], 0.1);
    let s = BA.lineChart({ h: 270, xMin: 0, xMax: 10, yMin: 0, yMax: 85, xTicks: [], yFmt: function () { return ''; }, left: 16, xLabel: 'время', series: [{ data: h1, color: 'var(--blue)', end: false }, { data: h2, color: 'var(--money)', end: false }, { data: h3, color: 'var(--gold)', end: false }] });
    s = s.replace('</svg>', txt(PX(1.5, 10), 106, 'Горизонт 1 — ядро', 't', 'middle', 'font-weight:600;fill:var(--blue)') + txt(PX(6.6, 10), 100, 'Горизонт 2 — растущее', 't', 'middle', 'font-weight:600;fill:var(--money)') + txt(PX(8.4, 10), 190, 'Горизонт 3 — опционы', 't', 'middle', 'font-weight:600;fill:var(--gold)') + txt(26, 30, 'прибыль', 't2', 'start') + '</svg>');
    return fig(s, 'Три горизонта роста (McKinsey). Пока ядро приносит деньги, нужно растить следующие двигатели — когда ядро начнёт падать, строить их будет поздно.', true);
  });
})();
