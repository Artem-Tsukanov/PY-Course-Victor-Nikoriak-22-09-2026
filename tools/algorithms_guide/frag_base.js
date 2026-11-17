/* ===================== MAP ===================== */
(function(){
  const DESC={
    start:'Як порівнювати алгоритми: скільки кроків, як росте робота з n.',
    search:'Знайти елемент чи діапазон швидше, ніж перебором.',
    hash:'Словник і множина: пошук за O(1) і що для цього потрібно.',
    rec:'Задача, що містить меншу копію себе; повний перебір із відсіканням.',
    sort:'Упорядкувати дані: від O(n²) до O(n log n) і Timsort.',
    dp:'Обрати найкраще: жадібний вибір проти динамічного програмування.',
    lin:'Масив, зв\'язний список, стек, черга, deque — як дані лежать у пам\'яті.',
    tree:'Ієрархії й пріоритети: BST, обходи, купа, префіксне дерево, LRU.',
    graph:'Мережі зв\'язків: обхід, найкоротший шлях, від\'ємні ваги.',
    heur:'Коли точна відповідь задорога — достатньо хороша.',
    cheat:'Усе в одній таблиці.'};
  const host=$('#kart-map');
  host.innerHTML=CHAPTERS.filter(c=>c[0]!=='start'||true).map(([id,title,ids])=>{
    const items=ids.filter(x=>x!=='kart'&&document.getElementById(x));if(!items.length)return '';
    return `<div class="mapcard"><h3>${esc(title)}</h3><p>${esc(DESC[id]||'')}</p><ul>${items.map(x=>`<li><a href="#${x}" data-go="${x}">${esc(document.getElementById(x).dataset.title)}</a></li>`).join('')}</ul></div>`;}).join('');
})();

/* ===================== DUPLICATES (lesson 9) ===================== */
(function(){
  const C1=['def has_duplicates_v1(data):','    for i in range(len(data)):','        for j in range(i + 1, len(data)):','            if data[i] == data[j]:','                return True','    return False'];
  const C2=['def has_duplicates_v2(data):','    seen = set()','    for value in data:','        if value in seen:','            return True','        seen.add(value)','    return False'];
  code($('#dupl-code1'),C1);code($('#dupl-code2'),C2);
  let data=[];
  function make(){const n=+$('#dupl-n').value,kind=$('#dupl-kind').value;const ids=shuffle(Array.from({length:60},(_,i)=>101+i)).slice(0,n);
    if(kind==='late')ids[n-1]=ids[rnd(0,n-3)];if(kind==='early')ids[2]=ids[0];data=ids;}
  function* v1(){let c=0;const n=data.length;yield{i:-1,j:-1,c,line:0,msg:'Порівнюємо кожну пару (i, j), j > i'};
    for(let i=0;i<n;i++){for(let j=i+1;j<n;j++){c++;const eq=data[i]===data[j];yield{i,j,c,line:3,msg:`data[${i}]=${data[i]} == data[${j}]=${data[j]}? ${eq?'так':'ні'}`};if(eq){yield{i,j,c,found:true,line:4,msg:`Повтор: ${data[i]}. Порівнянь: ${c}`};return;}}}
    yield{i:-1,j:-1,c,none:true,line:5,msg:`Повторів немає. Порівнянь: ${c} = n·(n−1)/2`};}
  function* v2(){let c=0;const seen=[];yield{k:-1,c,seen:[],line:1,msg:'seen = set()'};
    for(let k=0;k<data.length;k++){c++;const has=seen.includes(data[k]);yield{k,c,seen:seen.slice(),line:3,msg:`${data[k]} in seen? ${has?'так':'ні'}`};if(has){yield{k,c,seen:seen.slice(),found:true,line:4,msg:`Повтор: ${data[k]}. Перевірок: ${c}`};return;}seen.push(data[k]);yield{k,c,seen:seen.slice(),line:5,msg:`seen.add(${data[k]})`};}
    yield{k:-1,c,seen:seen.slice(),none:true,line:6,msg:`Повторів немає. Перевірок: ${c} = n`};}
  function render([a,b]){
    $('#dupl-v1').innerHTML=data.map((v,i)=>`<div class="cell ${a.found&&(i===a.i||i===a.j)?'bad':(i===a.i?'pivot':(i===a.j?'cmp':''))}"><span class="idx">${i}</span>${v}</div>`).join('');
    $('#dupl-msg1').textContent=a.msg;$('#dupl-c1').textContent=a.c;codeOn($('#dupl-code1'),a.line);
    $('#dupl-v2').innerHTML=data.map((v,i)=>`<div class="cell ${b.found&&i===b.k?'bad':(i===b.k?'cmp':(i<b.k||b.none?'seen':''))}"><span class="idx">${i}</span>${v}</div>`).join('');
    chips($('#dupl-seen'),'seen:',b.seen,{hot:b.found?b.seen.indexOf(data[b.k]):-1,empty:'порожня множина'});
    $('#dupl-msg2').textContent=b.msg;$('#dupl-c2').textContent=b.c;codeOn($('#dupl-code2'),b.line);}
  function table(){const t=$('#dupl-table');const rows=[10,20,40,80,1000,2000,1e6];let h='<tr><th style="text-align:right">n</th><th style="text-align:right">v1: пар</th><th style="text-align:right">×</th><th style="text-align:right">v2: перевірок</th><th style="text-align:right">×</th></tr>';
    rows.forEach((n,i)=>{const p=n*(n-1)/2,pp=i&&rows[i]===2*rows[i-1]?(p/(rows[i-1]*(rows[i-1]-1)/2)).toFixed(1):'';const q=i&&rows[i]===2*rows[i-1]?'2.0':'';h+=`<tr${n>=1e6?' class="warn"':''}><td class="num">${fmt(n)}</td><td class="num">${fmt(p)}</td><td class="num">${pp}</td><td class="num">${fmt(n)}</td><td class="num">${q}</td></tr>`;});t.innerHTML=h;}
  make();table();const R=new Runner(()=>both(v1(),v2()),render);controls($('#dupl-controls'),R,'dupl');
  $('#dupl-kind').onchange=()=>{make();R.reset();};$('#dupl-n').oninput=e=>{$('#dupl-n-v').textContent=e.target.value;make();R.reset();};
  course($('#dupl-course'),['l09']);
})();

/* ===================== CHEAT SHEET ===================== */
(function(){
  const Q=[
    ['Чи є елемент у колекції? Шукаю багато разів','set / dict','O(1)','hashtable'],
    ['Пошук у вже відсортованих даних, «перший ≥ x», діапазон','бінарний пошук, bisect','O(log n)','bisect'],
    ['Пара з потрібною сумою','dict за один прохід або два вказівники на відсортованому','O(n)','twosum'],
    ['Найкращий відрізок фіксованої довжини','ковзне вікно','O(n)','window'],
    ['Упорядкувати дані','sorted() / list.sort() — Timsort','O(n log n)','sortuvannya'],
    ['Найменший / найтерміновіший елемент раз у раз','купа, heapq','O(log n) на операцію','heap'],
    ['Хто прийшов першим — той і перший','deque.popleft()','O(1)','queue'],
    ['Скасувати останню дію, дужки, вкладеність','стек (list.append / pop)','O(1)','brackets'],
    ['Автодоповнення за префіксом','префіксне дерево або bisect у відсортованому','O(довжини префікса)','trie'],
    ['Найкоротший шлях без ваг (кількість переходів)','BFS','O(V + E)','hrafy'],
    ['Найдешевший шлях, ваги ≥ 0','Дейкстра + heapq','O((V + E) log V)','dijkstra'],
    ['Є від\'ємні ваги','Беллман–Форд','O(V·E)','bellman'],
    ['Найкращий вибір, підзадачі повторюються','динамічне програмування','залежить від таблиці','wis'],
    ['Усі варіанти, що задовольняють умову','перебір з поверненням + відсікання','експоненційно','backtrack'],
    ['Точна відповідь задорога','евристика (генетичний алгоритм тощо)','обмежено бюджетом','henetyka'],
  ];
  const A=[
    ['Лінійний пошук','пошук','O(n)','O(1)','будь-які, зокрема невідсортовані дані','poshuk'],
    ['Бінарний пошук','пошук','O(log n)','O(1)','лише відсортовані дані','poshuk'],
    ['bisect: перший ≥ x, діапазон префікса','пошук','O(log n)','O(1)','відсортовані часи, адреси','bisect'],
    ['Два вказівники','пошук','O(n)','O(1)','пара із сумою у відсортованому','twoptr'],
    ['Ковзне вікно','пошук','O(n)','O(1)','суми/частоти у вікні фіксованої довжини','window'],
    ['Хеш-таблиця (dict, set)','хешування','O(1), найгірше O(n)','O(n)','пошук за ключем, лічильники, дублікати','hashtable'],
    ['Two Sum за один прохід','хешування','O(n)','O(n)','пара із сумою в невідсортованих даних','twosum'],
    ['Групування за канонічним ключем','хешування','O(n·k log k)','O(n)','анаграми, маршрути A→B = B→A','anagram'],
    ['Пари / set: пошук дублікатів','складність','O(n²) / O(n)','O(1) / O(n)','перший приклад вибору алгоритму','dupl'],
    ['Рекурсія по вкладеній структурі','рекурсія','O(n)','O(глибини)','меню, дерева каталогів, JSON','callstack'],
    ['Перебір з поверненням','рекурсія','O(2ⁿ)','O(n)','усі комбінації під умову','backtrack'],
    ['Bubble Sort','сортування','O(n²)','O(1)','лише для розуміння','sortuvannya'],
    ['Selection Sort','сортування','O(n²)','O(1)','мало записів: n−1 обмінів','sortuvannya'],
    ['Insertion Sort','сортування','O(n²), майже відсортовані — O(n)','O(1)','малі й майже впорядковані дані','sortuvannya'],
    ['Merge Sort','сортування','O(n log n)','O(n)','стабільність, зовнішнє сортування','sortuvannya'],
    ['QuickSort','сортування','O(n log n), найгірше O(n²)','O(log n)','загальний випадок, на місці','sortuvannya'],
    ['Heap Sort','сортування','O(n log n)','O(1)','гарантія без додаткової пам\'яті','sortuvannya'],
    ['Timsort (sorted)','сортування','O(n log n), відсортовані — O(n)','O(n)','завжди в Python-коді','sortrace'],
    ['Жадібна решта','жадібні','O(кількості монет)','O(1)','лише «канонічні» набори монет','zhadibnyi'],
    ['Розклад: найраніше завершення','жадібні','O(n log n)','O(n)','найбільше несумісних інтервалів','intervals'],
    ['Розклад з вагами (p(i), M[i])','ДП','O(n log n)','O(n)','найбільший заробіток','wis'],
    ['Фібоначчі з мемоізацією','ДП','O(n)','O(n)','кеш підзадач, lru_cache','dp'],
    ['Решта найменшою кількістю монет','ДП','O(сума·монет)','O(суми)','будь-які набори монет','coindp'],
    ['Масив проти зв\'язного списку','структури','вставка O(n) / O(1)','O(n)','де частіше вставляєш','arrlist'],
    ['Розворот зв\'язного списку','структури','O(n)','O(1)','класика співбесід','revlist'],
    ['Стек: баланс дужок','структури','O(n)','O(n)','вкладеність, undo, DFS','brackets'],
    ['Черга: list.pop(0) проти deque','структури','O(n) / O(1) на операцію','O(n)','черги задач, BFS','queue'],
    ['Максимум у вікні (монотонна deque)','структури','O(n)','O(k)','максимум/мінімум за останні k','windowmax'],
    ['Бінарне дерево пошуку','дерева','O(log n), вироджене O(n)','O(n)','впорядковані ключі, діапазони','bst'],
    ['Обходи дерева (pre/in/post, BFS)','дерева','O(n)','O(висоти) / O(ширини)','серіалізація, виведення, рівні','traverse'],
    ['Купа (heapq)','дерева','O(log n)','O(n)','пріоритети, top-k, Дейкстра','heap'],
    ['Префіксне дерево (Trie)','дерева','O(довжини слова)','O(сума довжин)','автодоповнення','trie'],
    ['LRU-кеш','структури','O(1)','O(місткості)','кеш цін, lru_cache','lru'],
    ['BFS і DFS','графи','O(V + E)','O(V)','обхід, найкоротший шлях без ваг','hrafy'],
    ['Дейкстра','графи','O((V + E) log V)','O(V)','найдешевший маршрут, ваги ≥ 0','dijkstra'],
    ['Беллман–Форд','графи','O(V·E)','O(V)','від\'ємні ваги, пошук від\'ємного циклу','bellman'],
    ['Генетичний алгоритм','евристики','обмежено поколіннями','O(популяції)','оптимізація без точного методу','henetyka'],
  ];
  const link=(t,id)=>document.getElementById(id)?`<a href="#${id}" data-go="${id}">${esc(t)}</a>`:esc(t);
  $('#cheat-q').innerHTML='<tr><th>Задача</th><th>Інструмент</th><th>Ціна</th></tr>'+Q.map(([q,t,c,id])=>`<tr><td>${link(q,id)}</td><td>${esc(t)}</td><td class="num" style="text-align:left">${esc(c)}</td></tr>`).join('');
  function draw(){const f=($('#cheat-filter').value||'').toLowerCase();
    $('#cheat-table').innerHTML='<tr><th>Алгоритм / структура</th><th>Розділ</th><th>Час</th><th>Пам\'ять</th><th>Коли брати</th></tr>'+A.filter(r=>!f||r.slice(0,5).join(' ').toLowerCase().includes(f)).map(([n,g,t,m,w,id])=>`<tr><td>${link(n,id)}</td><td>${esc(g)}</td><td style="font-family:var(--mono)">${esc(t)}</td><td style="font-family:var(--mono)">${esc(m)}</td><td>${esc(w)}</td></tr>`).join('');}
  $('#cheat-filter').oninput=draw;draw();
})();
