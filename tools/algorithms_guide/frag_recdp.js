/* ===== frag_recdp: recursion, backtracking, sort race, greedy intervals, weighted intervals DP, coin DP ===== */

/* Ukrainian plural: rdPl(2, 'монета', 'монети', 'монет') */
const rdPl = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return `${n} ${a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many}`; };

/* timeline of orders (shared by `intervals` and `wis`). rows: [{o, cls, note}] in display order */
function rdTimeline(svg, rows, opt = {}) {
  const lo = Math.min(...rows.map(r => r.o.start)) - 0, hi = Math.max(...rows.map(r => r.o.end));
  const W = 640, top = 34, rowH = 26, H = top + rows.length * rowH + 12;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const L = 70, R = W - 20, X = h => L + (h - lo) / Math.max(1, hi - lo) * (R - L);
  let s = '';
  for (let h = lo; h <= hi; h++) s += `<line class="rd-grid" x1="${X(h)}" y1="${top - 8}" x2="${X(h)}" y2="${H - 6}"/><text class="rd-hour" x="${X(h)}" y="${top - 16}">${h}:00</text>`;
  rows.forEach((r, i) => {
    const y = top + i * rowH, o = r.o;
    s += `<g class="rd-bar ${r.cls || ''}"><text class="rd-name" x="${L - 10}" y="${y + rowH / 2 - 1}">${esc(r.label || o.name)}</text>` +
      `<rect x="${X(o.start) + 1}" y="${y + 3}" width="${Math.max(4, X(o.end) - X(o.start) - 2)}" height="${rowH - 8}" rx="5"/>` +
      `<text class="rd-in" x="${(X(o.start) + X(o.end)) / 2}" y="${y + rowH / 2 - 1}">${esc(r.text !== undefined ? r.text : `${o.start}–${o.end}`)}</text></g>`;
  });
  svg.innerHTML = s;
}
const RD_ORDERS = {
  four: [['А', 9, 10, 200], ['Б', 10, 11, 200], ['В', 9, 11, 550], ['Г', 11, 12, 200]],
  shift: [['А', 9, 10, 200], ['Б', 10, 11, 200], ['В', 9, 11, 550], ['Г', 11, 12, 200], ['Ґ', 12, 14, 380], ['Д', 11, 13, 300], ['Е', 13, 15, 250], ['Є', 14, 16, 420], ['Ж', 15, 17, 260], ['З', 16, 18, 330]],
  early: [['Л', 8, 12, 0], ['М', 9, 10, 0], ['Н', 10, 11, 0]],
  trap: [['П', 9, 12, 0], ['Р', 11, 13, 0], ['С', 12, 15, 0]],
};
const rdOrders = k => RD_ORDERS[k].map(([name, start, end, reward]) => ({ name, start, end, reward }));

/* ===================== callstack ===================== */
(function () {
  const MENU = { 'Кухня': { 'Перші страви': { 'Борщ': 95, 'Юшка': 85 }, 'Основні': { 'Вареники': 80, 'Деруни': 75 } },
    'Напої': { 'Гарячі': { 'Чай': 30, 'Кава': { 'Еспресо': 40, 'Лате': 55 } }, 'Холодні': { 'Узвар': 35 } }, 'Хліб': 10 };
  let nid = 0;
  const build = (name, v, d) => { const n = { id: nid++, name, d, kids: [] }; if (typeof v === 'object') n.kids = Object.entries(v).map(([k, c]) => build(k, c, d + 1)); else n.val = v; return n; };
  const ROOT = build('MENU', MENU, 0);
  const ALL = []; (function walk(n) { ALL.push(n); n.kids.forEach(walk); })(ROOT);
  let leaf = 0; (function lay(n) { if (!n.kids.length) n.x = leaf++; else { n.kids.forEach(lay); n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2; } })(ROOT);
  const W = 720, gx = W / leaf, X = n => gx * (n.x + 0.5), Y = n => 26 + n.d * 62;
  $('#callstack-data').innerHTML = '';
  code($('#callstack-data'), ['MENU = {', '    "Кухня": {', '        "Перші страви": {"Борщ": 95, "Юшка": 85},', '        "Основні": {"Вареники": 80, "Деруни": 75},', '    },', '    "Напої": {', '        "Гарячі": {"Чай": 30, "Кава": {"Еспресо": 40, "Лате": 55}},', '        "Холодні": {"Узвар": 35},', '    },', '    "Хліб": 10,', '}']);
  const mode = () => $('#callstack-mode').value, fnk = () => $('#callstack-fn').value;
  const fname = () => (fnk() === 'count' ? 'count_dishes' : 'total_price') + (mode() === 'it' ? '_iterative' : '');
  function codeLines() {
    const f = fname(), c = fnk() === 'count';
    if (mode() === 'rec') return [`def ${f}(node):`, '    if not isinstance(node, dict):', `        return ${c ? '1   ' : 'node'}                    # страва — базовий випадок`, '    total = 0', '    for child in node.values():', `        total += ${f}(child)${c ? '   ' : '    '} # спуск у підменю`, '    return total'];
    return [`def ${f}(menu):`, '    stack = [menu]', `    ${c ? 'count' : 'total'} = 0`, '    while stack:', '        node = stack.pop()              # з вершини стека', '        if isinstance(node, dict):', '            stack.extend(node.values()) # підпункти — на стек', '        else:', `            ${c ? 'count += 1' : 'total += node'}`, `    return ${c ? 'count' : 'total'}`];
  }
  const FLOW_REC = ['Виклик: новий кадр', 'Страва?', 'Повернути базове значення', 'Виклик для підпункту', 'Додати відповідь до total', 'Повернути total, зняти кадр'];
  const FLOW_IT = ['Меню — на стек', 'Зняти вершину', 'Розділ: підпункти на стек', 'Страва: додати', 'Стек порожній'];
  function* gen() {
    code($('#callstack-code'), codeLines()); $('#callstack-code-title').textContent = fname();
    flow($('#callstack-flow'), mode() === 'rec' ? FLOW_REC : FLOW_IT);
    const isCount = fnk() === 'count', base = n => isCount ? 1 : n.val;
    const st = { stack: [], done: {}, part: {}, cur: null, calls: 0, max: 0, res: null };
    const S = (line, f, msg) => ({ ...st, stack: st.stack.slice(), done: { ...st.done }, part: { ...st.part }, line, f, msg });
    if (mode() === 'rec') {
      yield S(-1, -1, `${fname()}(MENU): натисніть «Крок»`);
      function* rec(n) {
        st.calls++; st.stack.push(n); st.max = Math.max(st.max, st.stack.length); st.cur = n.id;
        yield S(0, 0, `Виклик ${fname()}(${n.name}) — новий кадр на вершині стека (глибина ${st.stack.length})`);
        const isLeaf = !n.kids.length;
        yield S(1, 1, `${n.name}: ${isLeaf ? 'не словник — це страва' : 'словник — розділ меню'}`);
        if (isLeaf) { const r = base(n); st.done[n.id] = r; yield S(2, 2, `return ${r} — кадр ${n.name} знято зі стека`); st.stack.pop(); st.cur = st.stack.length ? st.stack[st.stack.length - 1].id : null; return r; }
        let total = 0; st.part[n.id] = 0; yield S(3, -1, `${n.name}: total = 0`);
        for (const c of n.kids) {
          yield S(4, 3, `${n.name}: наступний підпункт — ${c.name}`);
          const r = yield* rec(c); total += r; st.part[n.id] = total; st.cur = n.id;
          yield S(5, 4, `Повернулись у ${n.name}: ${fname()}(${c.name}) = ${r} → total = ${total}`);
        }
        delete st.part[n.id]; st.done[n.id] = total;
        yield S(6, 5, `return ${total} — кадр ${n.name} знято зі стека`);
        st.stack.pop(); st.cur = st.stack.length ? st.stack[st.stack.length - 1].id : null; return total;
      }
      st.res = yield* rec(ROOT); st.cur = null;
      yield S(-1, 5, `Готово: ${fname()}(MENU) = ${st.res}. Викликів: ${st.calls}, найбільша глибина стека: ${st.max}`);
    } else {
      st.stack.push(ROOT); st.max = 1;
      yield S(1, 0, 'stack = [MENU]');
      let acc = 0; st.res = 0; yield S(2, 0, `${isCount ? 'count' : 'total'} = 0`);
      while (st.stack.length) {
        yield S(3, -1, `Стек не порожній: ${st.stack.length} елемент(и)`);
        const n = st.stack.pop(); st.calls++; st.cur = n.id;
        yield S(4, 1, `pop() → ${n.name}`);
        if (n.kids.length) {
          yield S(5, 2, `${n.name} — розділ`);
          st.stack.push(...n.kids); st.max = Math.max(st.max, st.stack.length); st.done[n.id] = '';
          yield S(6, 2, `extend: ${n.kids.map(k => k.name).join(', ')} — на стек (останній буде знятий першим)`);
        } else {
          acc += base(n); st.res = acc; st.done[n.id] = base(n);
          yield S(8, 3, `${n.name} — страва: ${isCount ? 'count' : 'total'} = ${acc}`);
        }
      }
      st.cur = null;
      yield S(9, 4, `Стек порожній: результат ${acc}. Знято зі стека: ${st.calls}, найбільший розмір стека: ${st.max}`);
    }
  }
  function render(st) {
    const onStack = new Set(st.stack.map(n => n.id));
    let e = '', v = '';
    ALL.forEach(n => n.kids.forEach(c => { e += `<line class="e ${st.done[c.id] !== undefined ? 'on' : ''}" x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`; }));
    ALL.forEach(n => {
      const cls = st.cur === n.id ? 'cur' : (onStack.has(n.id) ? 'front' : (st.done[n.id] !== undefined ? 'ok' : ''));
      const lab = n.val !== undefined ? `${n.name} ${n.val}` : n.name;
      const fs = Math.min(11.5, (gx + 4) / (lab.length * 0.62 + 1)), w = Math.min(gx + 6, 10 + lab.length * fs * 0.62);
      const note = st.done[n.id] !== undefined && st.done[n.id] !== '' ? `→ ${st.done[n.id]}` : (st.part[n.id] !== undefined ? `Σ ${st.part[n.id]}` : '');
      v += `<g class="v rd-node ${cls}"><rect x="${X(n) - w / 2}" y="${Y(n) - 13}" width="${w}" height="26" rx="7"/><text x="${X(n)}" y="${Y(n)}" style="font-size:${fs.toFixed(1)}px">${esc(lab)}</text>${note ? `<text class="rd-note" x="${X(n)}" y="${Y(n) + 25}">${esc(note)}</text>` : ''}</g>`;
    });
    $('#callstack-svg').innerHTML = e + v;
    const items = mode() === 'rec' ? st.stack.map(n => `${fname()}(${n.name})`) : st.stack.map(n => n.name);
    chips($('#callstack-ds'), mode() === 'rec' ? 'Стек викликів (вершина праворуч):' : 'stack (вершина праворуч):', items, { hot: items.length - 1 });
    $('#callstack-msg').textContent = st.msg; codeOn($('#callstack-code'), st.line); flowOn($('#callstack-flow'), st.f);
    $('#callstack-calls').textContent = st.calls; $('#callstack-depth').textContent = st.stack.length; $('#callstack-max').textContent = st.max;
    $('#callstack-res').textContent = st.res === null ? '—' : st.res;
  }
  const R = new Runner(gen, render); controls($('#callstack-controls'), R, 'callstack');
  $('#callstack-mode').onchange = $('#callstack-fn').onchange = () => R.reset();
  course($('#callstack-course'), ['l23']);
})();

/* ===================== backtrack ===================== */
(function () {
  const BASE = [230, 150, 270, 180, 120, 410];
  const pruned = () => $('#backtrack-prune').checked, target = () => +$('#backtrack-target').value;
  const TAGGED = [
    ['def', null], ['sort', '    fares = sorted(fares)', true], ['found0', '    found = []'], ['b1', ''],
    ['call', '    def explore(start, chosen, total):'], ['check', '        if total == target:'],
    ['hit', '            found.append(list(chosen))   # знайшли набір'], ['ret', '            return'],
    ['loop', '        for i in range(start, len(fares)):'],
    ['prune', '            if total + fares[i] > target:   # далі лише дорожчі', true], ['cut', '                break                       # відсікаємо гілку', true],
    ['push', '            chosen.append(fares[i])         # спробувати'], ['rec', '            explore(i + 1, chosen, total + fares[i])'],
    ['pop', '            chosen.pop()                    # повернутися назад'], ['b2', ''], ['start', '    explore(0, [], 0)'], ['end', '    return found'],
  ];
  let LN = {};
  function setCode() {
    const p = pruned(), name = p ? 'voucher_sets_pruned' : 'voucher_sets';
    const rows = TAGGED.filter(r => !r[2] || p); LN = {}; rows.forEach((r, i) => LN[r[0]] = i);
    code($('#backtrack-code'), rows.map(r => r[0] === 'def' ? `def ${name}(fares, target):` : r[1]));
    $('#backtrack-code-title').textContent = name;
  }
  function countCalls(p, t) { const f = p ? BASE.slice().sort((a, b) => a - b) : BASE; let c = 0; (function ex(s, tot) { c++; if (tot === t) return; for (let i = s; i < f.length; i++) { if (p && tot + f[i] > t) break; ex(i + 1, tot + f[i]); } })(0, 0); return c; }
  /* dry run → tree layout in the same order as the animation */
  let NODES = [];
  function buildTree(p, t, f) {
    NODES = []; let leaves = 0;
    (function ex(s, tot, d, parent, fare) {
      const n = { id: NODES.length, d, sum: tot, parent, kids: [], fare }; NODES.push(n); if (parent) parent.kids.push(n);
      if (tot !== t) for (let i = s; i < f.length; i++) {
        if (p && tot + f[i] > t) { const c = { id: NODES.length, d: d + 1, sum: tot + f[i], parent: n, kids: [], cut: true, fare: f[i] }; NODES.push(c); n.kids.push(c); break; }
        ex(i + 1, tot + f[i], d + 1, n, f[i]);
      }
    })(0, 0, 0, null, null);
    (function lay(n) { if (!n.kids.length) n.x = leaves++; else { n.kids.forEach(lay); n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2; } })(NODES[0]);
    return leaves;
  }
  const FL = ['Виклик explore', 'Сума = ваучер?', 'Спробувати поїздку', 'Рекурсія глибше', 'Прибрати (повернення)', 'Відсікти гілку', 'Усе перебрано'];
  let LEAVES = 1, FARES = BASE;
  function* gen() {
    setCode(); flow($('#backtrack-flow'), FL);
    const p = pruned(), t = target(); FARES = p ? BASE.slice().sort((a, b) => a - b) : BASE.slice();
    LEAVES = buildTree(p, t, FARES);
    $('#backtrack-calls-off').textContent = countCalls(false, t); $('#backtrack-calls-on').textContent = countCalls(true, t);
    const st = { seen: new Set(), path: [], cur: null, chosen: [], found: [], hits: new Set(), calls: 0 };
    const S = (tag, f, msg) => ({ seen: new Set(st.seen), path: st.path.slice(), cur: st.cur, chosen: st.chosen.slice(), found: st.found.map(x => x.slice()), hits: new Set(st.hits), calls: st.calls, line: tag ? LN[tag] : -1, f, msg });
    yield S('start', -1, `${p ? 'fares = sorted(fares) → [' + FARES.join(', ') + ']. ' : ''}Ваучер ${t} грн. Натисніть «Крок»`);
    let next = 0;
    function* ex(start, total) {
      const id = next++; st.calls++; st.seen.add(id); st.path.push(id); st.cur = id;
      yield S('call', 0, `explore(start=${start}, chosen=[${st.chosen.join(', ')}], total=${total})`);
      yield S('check', 1, `total = ${total} == ${t}? ${total === t ? 'так' : 'ні'}`);
      if (total === t) { st.found.push(st.chosen.slice()); st.hits.add(id); yield S('hit', 1, `Знайдено набір [${st.chosen.join(', ')}] = ${t} грн`); yield S('ret', 4, 'return — далі з цього вузла не йдемо'); st.path.pop(); return; }
      for (let i = start; i < FARES.length; i++) {
        yield S('loop', 2, `i = ${i}: поїздка ${FARES[i]} грн`);
        if (p) {
          if (total + FARES[i] > t) { const cid = next++; st.seen.add(cid); yield S('prune', 5, `${total} + ${FARES[i]} = ${total + FARES[i]} > ${t}`); yield S('cut', 5, `break: решта поїздок ще дорожчі — гілку відсічено`); break; }
          yield S('prune', 2, `${total} + ${FARES[i]} = ${total + FARES[i]} ≤ ${t} — пробуємо`);
        }
        st.chosen.push(FARES[i]); yield S('push', 2, `chosen.append(${FARES[i]}) → [${st.chosen.join(', ')}]`);
        yield S('rec', 3, `explore(${i + 1}, [${st.chosen.join(', ')}], ${total + FARES[i]})`);
        yield* ex(i + 1, total + FARES[i]); st.cur = id;
        const out = st.chosen.pop(); yield S('pop', 4, `chosen.pop() → прибрали ${out}, повертаємось до [${st.chosen.join(', ')}]`);
      }
      st.path.pop();
    }
    yield* ex(0, 0); st.cur = null;
    yield S('end', 6, `Готово: ${rdPl(st.found.length, 'набір', 'набори', 'наборів')}, ${rdPl(st.calls, 'виклик', 'виклики', 'викликів')} explore${p ? ' з відсіканням' : ' без відсікання'}`);
  }
  function render(st) {
    const W = 900, gx = W / (LEAVES + 1), X = n => gx * (n.x + 1), Y = n => 22 + n.d * 44, r = Math.max(9, Math.min(15, gx * 0.45));
    const onPath = new Set(st.path);
    let e = '', v = '';
    NODES.forEach(n => { if (!st.seen.has(n.id) || !n.parent) return; e += `<line class="e ${onPath.has(n.id) ? 'on' : ''}" x1="${X(n.parent)}" y1="${Y(n.parent)}" x2="${X(n)}" y2="${Y(n)}"/>`; });
    NODES.forEach(n => {
      if (!st.seen.has(n.id)) return;
      const cls = n.cut ? 'bad' : (st.cur === n.id ? 'cur' : (st.hits.has(n.id) ? 'ok' : (onPath.has(n.id) ? 'front' : '')));
      v += `<g class="v ${cls}"><circle cx="${X(n)}" cy="${Y(n)}" r="${r}"/><text x="${X(n)}" y="${Y(n)}" style="font-size:${Math.round(r * 0.72)}px">${n.sum}</text></g>`;
    });
    $('#backtrack-svg').innerHTML = e + v;
    chips($('#backtrack-chosen'), 'chosen:', st.chosen, { hot: st.chosen.length - 1, empty: '[]' });
    chips($('#backtrack-found'), 'found:', st.found.map(x => `[${x.join(', ')}]`), { ok: st.found.map((_, i) => i), empty: '[]' });
    $('#backtrack-msg').textContent = st.msg; codeOn($('#backtrack-code'), st.line); flowOn($('#backtrack-flow'), st.f);
    $('#backtrack-calls').textContent = st.calls;
  }
  const R = new Runner(gen, render); controls($('#backtrack-controls'), R, 'backtrack');
  $('#backtrack-prune').onchange = $('#backtrack-target').onchange = () => R.reset();
  course($('#backtrack-course'), ['l23']);
})();

/* ===================== sortrace ===================== */
(function () {
  code($('#sortrace-code'), ['from functools import cmp_to_key', '', 'comparisons = 0', '', 'def compare(a, b):', '    global comparisons', '    comparisons += 1', '    return (a > b) - (a < b)', '', 'data = [5, 2, 9, 1, 7]', 'sorted(data, key=cmp_to_key(compare))', 'print(comparisons)']);
  code($('#sortrace-code-heap'), ['def heapify(arr, size, root):', '    largest = root', '    left, right = 2 * root + 1, 2 * root + 2', '    if left < size and arr[left] > arr[largest]:', '        largest = left', '    if right < size and arr[right] > arr[largest]:', '        largest = right', '    if largest != root:', '        arr[root], arr[largest] = arr[largest], arr[root]', '        heapify(arr, size, largest)', '', 'def heap_sort(arr):', '    n = len(arr)', '    for i in range(n // 2 - 1, -1, -1):     # 1. будуємо max-купу', '        heapify(arr, n, i)', '    for end in range(n - 1, 0, -1):         # 2. максимум — у кінець', '        arr[0], arr[end] = arr[end], arr[0]', '        heapify(arr, end, 0)', '    return arr']);
  function data() {
    const n = +$('#sortrace-n').value, kind = $('#sortrace-data').value;
    if (kind === 'random') return Array.from({ length: n }, () => rnd(1, 10000));
    if (kind === 'reversed') return Array.from({ length: n }, (_, i) => n - i);
    if (kind === 'few') return Array.from({ length: n }, () => [100, 200, 300, 400][rnd(0, 3)]);
    const b = Array.from({ length: n }, (_, i) => i + 1); for (let k = 0; k < Math.max(1, n / 20); k++) { const i = rnd(0, n - 2); [b[i], b[i + 1]] = [b[i + 1], b[i]]; } return b;
  }
  const ALGOS = {
    'Bubble': (x, c) => { const n = x.length; for (let i = 0; i < n; i++) { let sw = false; for (let j = 0; j < n - i - 1; j++) { c.cmp++; if (x[j] > x[j + 1]) { [x[j], x[j + 1]] = [x[j + 1], x[j]]; c.w += 2; sw = true; } } if (!sw) break; } },
    'Selection': (x, c) => { const n = x.length; for (let i = 0; i < n; i++) { let m = i; for (let j = i + 1; j < n; j++) { c.cmp++; if (x[j] < x[m]) m = j; } if (m !== i) { [x[i], x[m]] = [x[m], x[i]]; c.w += 2; } } },
    'Insertion': (x, c) => { for (let i = 1; i < x.length; i++) { const cur = x[i]; let j = i - 1; while (j >= 0) { c.cmp++; if (x[j] > cur) { x[j + 1] = x[j]; c.w++; j--; } else break; } x[j + 1] = cur; c.w++; } },
    'Merge': (x, c) => { (function ms(lo, hi) { if (hi - lo < 1) return; const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid + 1, hi); const L = x.slice(lo, mid + 1), Rr = x.slice(mid + 1, hi + 1); let i = 0, j = 0, k = lo; while (i < L.length && j < Rr.length) { c.cmp++; x[k++] = L[i] <= Rr[j] ? L[i++] : Rr[j++]; c.w++; } while (i < L.length) { x[k++] = L[i++]; c.w++; } while (j < Rr.length) { x[k++] = Rr[j++]; c.w++; } })(0, x.length - 1); },
    'Quick (Lomuto)': (x, c) => { const st = [[0, x.length - 1]]; while (st.length) { const [lo, hi] = st.pop(); if (lo >= hi) continue; const p = x[hi]; let i = lo - 1; for (let j = lo; j < hi; j++) { c.cmp++; if (x[j] <= p) { i++; if (i !== j) { [x[i], x[j]] = [x[j], x[i]]; c.w += 2; } } } [x[i + 1], x[hi]] = [x[hi], x[i + 1]]; c.w += 2; st.push([lo, i], [i + 2, hi]); } },
    'Heap': (x, c) => { const hp = (size, root) => { while (true) { let lg = root; const l = 2 * root + 1, r = 2 * root + 2; if (l < size) { c.cmp++; if (x[l] > x[lg]) lg = l; } if (r < size) { c.cmp++; if (x[r] > x[lg]) lg = r; } if (lg === root) return; [x[root], x[lg]] = [x[lg], x[root]]; c.w += 2; root = lg; } }; const n = x.length; for (let i = (n >> 1) - 1; i >= 0; i--) hp(n, i); for (let e = n - 1; e > 0; e--) { [x[0], x[e]] = [x[e], x[0]]; c.w += 2; hp(e, 0); } },
    'Вбудоване (Timsort)': (x, c) => { const s = x.slice().sort((a, b) => { c.cmp++; return a - b; }); for (let i = 0; i < x.length; i++) x[i] = s[i]; c.w = null; },
  };
  function run() {
    const d = data(), n = d.length, ref = d.slice().sort((a, b) => a - b);
    const t0 = performance.now(); const res = [];
    for (const [name, f] of Object.entries(ALGOS)) { const x = d.slice(), c = { cmp: 0, w: 0 }; f(x, c); if (x.some((v, i) => v !== ref[i])) throw new Error(name + ' sorted wrongly'); res.push({ name, ...c }); }
    const ms = performance.now() - t0;
    const max = Math.max(...res.map(r => Math.max(r.cmp, r.w || 0))), log = $('#sortrace-scale').value === 'log';
    const wv = v => !v ? 0 : (log ? Math.log10(v + 1) / Math.log10(max + 1) : v / max) * 100;
    const best = res.reduce((a, b) => b.cmp < a.cmp ? b : a), worst = res.reduce((a, b) => b.cmp > a.cmp ? b : a);
    $('#sortrace-bars').innerHTML = `<div class="rd-race-head"><span></span><span><i style="background:var(--ink)"></i>порівняння <i style="background:var(--pivot);margin-left:14px"></i>записи в масив</span></div>` + res.map(r => `<div class="rd-race ${r === best ? 'win' : ''} ${r === worst ? 'lose' : ''}"><span class="nm">${esc(r.name)}</span><span class="tr"><span class="b c" style="width:${wv(r.cmp)}%"></span><span class="b w" style="width:${wv(r.w)}%"></span></span><span class="nums">${fmt(r.cmp)}<br><small>${r.w === null ? 'записи —' : fmt(r.w)}</small></span></div>`).join('');
    $('#sortrace-n2').textContent = fmt(n * n / 2); $('#sortrace-nlogn').textContent = fmt(n * Math.log2(n)); $('#sortrace-ms').textContent = ms.toFixed(0) + ' мс';
    $('#sortrace-msg').textContent = `Найменше порівнянь: ${best.name} (${fmt(best.cmp)}). Найбільше: ${worst.name} (${fmt(worst.cmp)}) — у ${rdPl(Math.round(worst.cmp / Math.max(1, best.cmp)), 'раз', 'рази', 'разів')} більше.`;
  }
  $('#sortrace-run').onclick = run; $('#sortrace-data').onchange = run; $('#sortrace-scale').onchange = run;
  $('#sortrace-n').oninput = e => { $('#sortrace-n-v').textContent = e.target.value; }; $('#sortrace-n').onchange = run;
  run();
  course($('#sortrace-course'), ['b_sort', 'l23']);
})();

/* ===================== intervals ===================== */
(function () {
  const RULES = {
    end: { key: o => o.end, title: 'max_orders', lines: ['def max_orders(orders):', '    chosen = []', '    last_end = None', '    for order in sorted(orders, key=lambda o: o.end):', '        if last_end is None or order.start >= last_end:', '            chosen.append(order)', '            last_end = order.end', '    return chosen'], L: { sort: 3, check: 4, take: 5, upd: 6, ret: 7 } },
    start: { key: o => o.start, title: 'max_orders_by_start', lines: ['def max_orders_by_start(orders):', '    chosen = []', '    last_end = None', '    for order in sorted(orders, key=lambda o: o.start):', '        if last_end is None or order.start >= last_end:', '            chosen.append(order)', '            last_end = order.end', '    return chosen'], L: { sort: 3, check: 4, take: 5, upd: 6, ret: 7 } },
    len: { key: o => o.end - o.start, title: 'max_orders_shortest', lines: ['def max_orders_shortest(orders):', '    chosen = []', '    for order in sorted(orders, key=lambda o: o.end - o.start):', '        if all(compatible(order, c) for c in chosen):', '            chosen.append(order)', '    return chosen'], L: { sort: 2, check: 3, take: 4, upd: 4, ret: 5 } },
  };
  const FL = ['Сортувати за правилом', 'Наступне замовлення', 'Сумісне з узятими?', 'Взяти', 'Пропустити', 'Готово'];
  const fits = (o, chosen) => chosen.every(c => o.start >= c.end || o.end <= c.start);
  const bestCount = os => { let last = -Infinity, k = 0; os.slice().sort((a, b) => a.end - b.end).forEach(o => { if (o.start >= last) { k++; last = o.end; } }); return k; };
  function* gen() {
    const rule = RULES[$('#intervals-rule').value], os = rdOrders($('#intervals-data').value);
    code($('#intervals-code'), rule.lines); flow($('#intervals-flow'), FL);
    $('#intervals-best').textContent = bestCount(os); $('#intervals-verdict').innerHTML = '';
    const sorted = os.slice().sort((a, b) => rule.key(a) - rule.key(b));
    const cls = {}, chosen = [];
    const S = (line, f, msg, done) => ({ order: sorted, cls: { ...cls }, n: chosen.length, chosen: chosen.slice(), line, f, msg, done });
    yield { order: os, cls: {}, n: 0, chosen: [], line: 0, f: -1, msg: `${rdPl(os.length, 'замовлення', 'замовлення', 'замовлень')} у вихідному порядку. Натисніть «Крок»` };
    yield S(rule.L.sort, 0, `Відсортовано за правилом: ${sorted.map(o => o.name).join(', ')}`);
    for (const o of sorted) {
      cls[o.name] = 'cur'; yield S(rule.L.sort, 1, `Розглядаємо ${o.name} (${o.start}:00–${o.end}:00)`);
      const ok = fits(o, chosen);
      yield S(rule.L.check, 2, ok ? `${o.name} не перетинається з узятими` : `${o.name} перетинається з ${chosen.filter(c => !(o.start >= c.end || o.end <= c.start)).map(c => c.name).join(', ')}`);
      if (ok) { chosen.push(o); cls[o.name] = 'ok'; yield S(rule.L.take, 3, `Взяли ${o.name}: тепер ${chosen.map(c => c.name).join(', ')}`); }
      else { cls[o.name] = 'bad'; yield S(rule.L.check, 4, `Пропустили ${o.name}`); }
    }
    yield S(rule.L.ret, 5, `Готово: ${rdPl(chosen.length, 'замовлення', 'замовлення', 'замовлень')} — ${chosen.map(c => c.name).join(', ')}`, true);
  }
  function render(st) {
    rdTimeline($('#intervals-svg'), st.order.map(o => ({ o, cls: st.cls[o.name] || '' })));
    $('#intervals-msg').textContent = st.msg; codeOn($('#intervals-code'), st.line); flowOn($('#intervals-flow'), st.f); $('#intervals-count').textContent = st.n;
    if (st.done) { const b = +$('#intervals-best').textContent; $('#intervals-verdict').innerHTML = st.n < b ? `<p class="note bad">Правило дало ${st.n}, а можна ${b}. Локально «привабливий» вибір зайняв час, потрібний іншим замовленням.</p>` : `<p class="note">${st.n} — найбільше можливе для цих даних.${$('#intervals-rule').value !== 'end' ? ' Але це правило не гарантує оптимуму: спробуйте інші дані.' : ' Правило «найраніше закінчення» доведено оптимальне.'}</p>`; }
  }
  const R = new Runner(gen, render); controls($('#intervals-controls'), R, 'intervals');
  $('#intervals-rule').onchange = $('#intervals-data').onchange = () => R.reset();
  course($('#intervals-course'), ['l27']);
})();

/* ===================== wis ===================== */
(function () {
  code($('#wis-code'), ['def best_schedule(orders):', '    orders = sorted(orders, key=lambda o: o.end)', '    p = prev_compatible(orders)        # p[i]: останнє сумісне перед i', '    dp = [0] * (len(orders) + 1)', '    for i in range(1, len(orders) + 1):', '        skip = dp[i - 1]', '        take = orders[i - 1].reward + dp[p[i]]', '        dp[i] = max(skip, take)', '    chosen, i = [], len(orders)', '    while i > 0:', '        if orders[i - 1].reward + dp[p[i]] > dp[i - 1]:', '            chosen.append(orders[i - 1])', '            i = p[i]', '        else:', '            i -= 1', '    return list(reversed(chosen))']);
  code($('#wis-code-p'), ['def prev_compatible(orders):', '    p = [0] * (len(orders) + 1)', '    for i in range(1, len(orders) + 1):', '        start = orders[i - 1].start', '        for j in range(i - 1, 0, -1):', '            if orders[j - 1].end <= start:', '                p[i] = j', '                break', '    return p']);
  flow($('#wis-flow'), ['Сортувати за кінцем', 'Знайти p(i)', 'dp[i] = max(не брати, брати)', 'Відновити розклад', 'Готово']);
  let OS = [];
  function* gen() {
    const raw = rdOrders($('#wis-data').value); OS = raw.slice().sort((a, b) => a.end - b.end); const n = OS.length;
    let last = -Infinity, g = 0; OS.forEach(o => { if (o.start >= last) { g += o.reward; last = o.end; } });
    $('#wis-greedy').textContent = fmt(g) + ' грн'; $('#wis-best').textContent = '—';
    const p = Array(n + 1).fill(null), dp = Array(n + 1).fill(null); dp[0] = 0;
    const st = { hot: -1, ref: -1, take: new Set(), skip: null, chosen: new Set(), lineP: -1, phaseDone: false };
    const S = (line, f, msg, extra = {}) => ({ p: p.slice(), dp: dp.slice(), hot: st.hot, ref: st.ref, chosen: new Set(st.chosen), line, lineP: st.lineP, f, msg, order: extra.order || OS, dim: !!extra.dim, cand: extra.cand });
    yield S(-1, -1, `${rdPl(raw.length, 'замовлення', 'замовлення', 'замовлень')}: ${raw.map(o => `${o.name} ${o.start}–${o.end} (${o.reward})`).join(', ')}`, { order: raw });
    yield S(1, 0, `Відсортовано за кінцем: ${OS.map(o => o.name).join(', ')}. Тепер i = 1…${n}`);
    p[0] = 0;
    for (let i = 1; i <= n; i++) {
      st.hot = i; st.ref = -1; p[i] = 0; st.lineP = 3; yield S(2, 1, `p(${i}): ${OS[i - 1].name} починається о ${OS[i - 1].start}:00 — шукаємо назад останнє, що закінчилось до цього`);
      for (let j = i - 1; j >= 1; j--) {
        st.ref = j; st.lineP = 5; const ok = OS[j - 1].end <= OS[i - 1].start;
        yield S(2, 1, `${OS[j - 1].name} закінчується о ${OS[j - 1].end}:00 ${ok ? '≤' : '>'} ${OS[i - 1].start}:00 → ${ok ? `p(${i}) = ${j}` : 'далі назад'}`);
        if (ok) { p[i] = j; st.lineP = 7; break; }
      }
      if (!p[i]) { st.ref = -1; st.lineP = 4; yield S(2, 1, `Сумісних раніше немає → p(${i}) = 0`); }
    }
    st.lineP = 8; st.ref = -1; st.hot = -1; yield S(2, 1, `p = [${p.join(', ')}]`);
    st.lineP = -1; yield S(3, 2, 'dp[0] = 0: без замовлень заробіток 0');
    for (let i = 1; i <= n; i++) {
      st.hot = i; st.ref = p[i]; const skip = dp[i - 1], take = OS[i - 1].reward + dp[p[i]];
      yield S(5, 2, `i = ${i} (${OS[i - 1].name}): не брати → dp[${i - 1}] = ${fmt(skip)}`, { cand: 'skip' });
      yield S(6, 2, `брати → ${OS[i - 1].reward} + dp[p(${i}) = ${p[i]}] = ${OS[i - 1].reward} + ${fmt(dp[p[i]])} = ${fmt(take)}`, { cand: 'take' });
      dp[i] = Math.max(skip, take);
      yield S(7, 2, `dp[${i}] = max(${fmt(skip)}, ${fmt(take)}) = ${fmt(dp[i])} — ${take > skip ? 'вигідніше взяти' : 'вигідніше не брати'}`);
    }
    st.hot = -1; st.ref = -1; $('#wis-best').textContent = fmt(dp[n]) + ' грн';
    let i = n; yield S(8, 3, `Найбільший заробіток dp[${n}] = ${fmt(dp[n])}. Відновлюємо розклад з кінця`);
    while (i > 0) {
      st.hot = i; const take = OS[i - 1].reward + dp[p[i]];
      yield S(10, 3, `i = ${i} (${OS[i - 1].name}): ${OS[i - 1].reward} + dp[${p[i]}] = ${fmt(take)} ${take > dp[i - 1] ? '>' : '≤'} dp[${i - 1}] = ${fmt(dp[i - 1])}`);
      if (take > dp[i - 1]) { st.chosen.add(i); yield S(12, 3, `${OS[i - 1].name} — у розкладі, стрибаємо на i = p(${i}) = ${p[i]}`); i = p[i]; }
      else { yield S(14, 3, `${OS[i - 1].name} не беремо, i = ${i - 1}`); i -= 1; }
    }
    st.hot = -1; const ch = [...st.chosen].sort((a, b) => a - b).map(k => OS[k - 1]);
    yield S(15, 4, `Розклад: ${ch.map(o => o.name).join(', ')} — ${fmt(ch.reduce((s, o) => s + o.reward, 0))} грн`, { dim: true });
  }
  function render(st) {
    const idx = o => OS.indexOf(o) + 1;
    rdTimeline($('#wis-svg'), st.order.map(o => { const i = idx(o); return { o, label: st.order === OS ? `${i}. ${o.name}` : o.name, text: `${o.start}–${o.end} · ${o.reward}`, cls: st.chosen.has(i) ? 'ok' : (i === st.hot ? 'cur' : (i === st.ref && st.ref > 0 ? 'ref' : (st.dim ? 'dimmed' : ''))) }; }));
    const rows = [`<tr><th>i</th><th>замовлення</th><th>час</th><th>ціна</th><th>p(i)</th><th>dp[i]</th></tr>`, `<tr class="${st.ref === 0 && st.hot > 0 ? 'rd-ref' : ''}"><td class="num">0</td><td>—</td><td></td><td></td><td></td><td class="num">${st.dp[0]}</td></tr>`];
    OS.forEach((o, k) => { const i = k + 1; rows.push(`<tr class="${i === st.hot ? 'rd-hot' : (i === st.ref ? 'rd-ref' : '')} ${st.chosen.has(i) ? 'rd-take' : ''}"><td class="num">${i}</td><td>${o.name}</td><td>${o.start}–${o.end}</td><td class="num">${o.reward}</td><td class="num">${st.p[i] === null ? '' : st.p[i]}</td><td class="num">${st.dp[i] === null ? '' : fmt(st.dp[i])}</td></tr>`); });
    $('#wis-table').innerHTML = rows.join('');
    $('#wis-msg').textContent = st.msg; codeOn($('#wis-code'), st.line); codeOn($('#wis-code-p'), st.lineP); flowOn($('#wis-flow'), st.f);
  }
  const R = new Runner(gen, render); controls($('#wis-controls'), R, 'wis');
  $('#wis-data').onchange = () => R.reset();
  course($('#wis-course'), ['l27']);
})();

/* ===================== coindp ===================== */
(function () {
  code($('#coindp-code'), ['def min_coins(amount, coins):', '    dp = [0] + [float("inf")] * amount   # dp[s]: найменше монет для суми s', '    choice = [None] * (amount + 1)', '    for s in range(1, amount + 1):', '        for coin in coins:', '            if coin <= s and dp[s - coin] + 1 < dp[s]:', '                dp[s] = dp[s - coin] + 1', '                choice[s] = coin', '    if dp[amount] == float("inf"):', '        return None', '    result = []', '    while amount > 0:', '        result.append(choice[amount])', '        amount -= choice[amount]', '    return result']);
  flow($('#coindp-flow'), ['Наступна сума s', 'Спробувати монету', 'Краще за dp[s]?', 'Записати dp[s] і монету', 'Відновити набір', 'Готово']);
  const parse = () => { const coins = [...new Set($('#coindp-coins').value.split(/[\s,;]+/).map(Number).filter(v => v > 0 && Number.isInteger(v)))]; const amount = Math.max(1, Math.min(40, Math.round(+$('#coindp-amount').value || 1))); return { coins: coins.length ? coins : [1], amount }; };
  let P = parse();
  function* gen() {
    P = parse(); const { coins, amount } = P;
    const dp = [0, ...Array(amount).fill(Infinity)], choice = Array(amount + 1).fill(null);
    const st = { s: -1, ref: -1, path: [], cands: [], cHot: -1, result: [] };
    const S = (line, f, msg) => ({ dp: dp.slice(), choice: choice.slice(), s: st.s, ref: st.ref, path: st.path.slice(), cands: st.cands.slice(), cHot: st.cHot, result: st.result.slice(), line, f, msg });
    yield S(1, -1, `Монети [${coins.join(', ')}], сума ${amount}. dp[0] = 0, решта поки ∞`);
    for (let s = 1; s <= amount; s++) {
      st.s = s; st.ref = -1; st.cands = []; st.cHot = -1; yield S(3, 0, `s = ${s}`);
      for (const c of coins) {
        st.cHot = st.cands.length;
        if (c > s) { st.cands.push({ t: `${c}: більша за ${s}`, cls: 'dim' }); st.ref = -1; yield S(5, 1, `Монета ${c} > ${s} — не підходить`); continue; }
        st.ref = s - c; const cand = dp[s - c] + 1; const better = cand < dp[s];
        st.cands.push({ t: `${c}: dp[${s - c}] + 1 = ${cand === Infinity ? '∞' : cand}`, cls: better ? 'ok' : '' });
        yield S(5, 2, `Остання монета ${c}: решту ${s - c} видаємо за dp[${s - c}] = ${dp[s - c] === Infinity ? '∞' : dp[s - c]} → ${cand === Infinity ? '∞' : cand} ${better ? `< ${dp[s] === Infinity ? '∞' : dp[s]} — краще` : `не краще за ${dp[s]}`}`);
        if (better) { dp[s] = cand; choice[s] = c; yield S(7, 3, `dp[${s}] = ${cand}, choice[${s}] = ${c}`); }
      }
    }
    st.s = -1; st.ref = -1; st.cHot = -1; st.cands = [];
    if (dp[amount] === Infinity) { yield S(9, 5, `dp[${amount}] = ∞: цими монетами суму ${amount} видати неможливо → None`); return; }
    let a = amount; yield S(10, 4, `dp[${amount}] = ${rdPl(dp[amount], 'монета', 'монети', 'монет')}. Відновлюємо, які саме`);
    while (a > 0) { st.path.push(a); st.result.push(choice[a]); yield S(12, 4, `choice[${a}] = ${choice[a]} → ${a} − ${choice[a]} = ${a - choice[a]}`); a -= choice[a]; }
    st.path.push(0); yield S(14, 5, `Результат: [${st.result.join(', ')}] — ${rdPl(st.result.length, 'монета', 'монети', 'монет')}`);
  }
  function render(st) {
    $('#coindp-cells').innerHTML = st.dp.map((v, s) => { const cls = s === st.s ? 'cmp' : (s === st.ref ? 'pivot' : (st.path.includes(s) ? 'ok' : '')); return `<div class="cell ${cls}"><span class="idx">${s}</span>${v === Infinity ? '∞' : v}${st.choice[s] ? `<span class="tag">+${st.choice[s]}</span>` : ''}</div>`; }).join('');
    $('#coindp-cands').innerHTML = `<span class="lab">${st.s > 0 ? `Кандидати для s = ${st.s}:` : 'Кандидати:'}</span>` + (st.cands.length ? st.cands.map((c, i) => `<span class="chip ${c.cls}${i === st.cHot ? ' hot' : ''}">${esc(c.t)}</span>`).join('') : '<span class="chip empty">—</span>');
    $('#coindp-result').innerHTML = '<span class="lab">Монети:</span>' + (st.result.length ? st.result.map(c => `<span class="coin">${c}</span>`).join('') : '<span class="chip empty">порожньо</span>');
    $('#coindp-msg').textContent = st.msg; codeOn($('#coindp-code'), st.line); flowOn($('#coindp-flow'), st.f);
  }
  const R = new Runner(gen, render); controls($('#coindp-controls'), R, 'coindp');
  $('#coindp-coins').onchange = $('#coindp-amount').onchange = () => R.reset();
  const preset = (c, a) => () => { $('#coindp-coins').value = c; $('#coindp-amount').value = a; R.reset(); };
  $('#coindp-p1').onclick = preset('1, 3, 4', 6); $('#coindp-p2').onclick = preset('25, 10, 5, 1', 30); $('#coindp-p3').onclick = preset('5, 7', 11);
  course($('#coindp-course'), ['l27']);
})();
