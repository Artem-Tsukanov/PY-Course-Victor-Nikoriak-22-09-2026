/* ===================== BST ===================== */
(function(){
  const CODE=['class Node:','    def __init__(self, value):','        self.value = value','        self.left = self.right = None','','def bst_insert(node, value):','    if node is None:','        return Node(value)','    if value < node.value:','        node.left = bst_insert(node.left, value)','    elif value > node.value:','        node.right = bst_insert(node.right, value)','    return node','','def bst_search_count(node, target):','    steps = 0','    while node:','        steps += 1','        if node.value == target:','            return steps','        elif target < node.value:','            node = node.left','        else:','            node = node.right','    return steps'];
  code($('#bst-code'),CODE);
  flow($('#bst-flow'),['Вставити наступний номер','Порівняти з вузлом','Порожнє місце → новий вузол','Пошук: порівняти з ціллю','Знайдено / немає']);
  let keys=[],target=0,svgH=300;
  const height=n=>n?1+Math.max(height(n.left),height(n.right)):-1;
  function newKeys(){const s=new Set();while(s.size<12)s.add(rnd(10,99));keys=[...s];setTarget();}
  function order(){return $('#bst-mode').value==='sorted'?keys.slice().sort((a,b)=>a-b):keys;}
  function setTarget(){const sel=$('#bst-target');const sorted=keys.slice().sort((a,b)=>a-b);let miss=50;while(keys.includes(miss))miss++;
    sel.innerHTML=sorted.map(v=>`<option value="${v}">${v}</option>`).join('')+`<option value="${miss}">${miss} (немає)</option>`;sel.value=sorted[sorted.length-1];target=+sel.value;}
  function* g(){
    const seq=order();let root=null;
    // final height → stable svg size
    let tmp=null;const ins=(n,v)=>{if(!n)return{key:v,left:null,right:null};if(v<n.key)n.left=ins(n.left,v);else if(v>n.key)n.right=ins(n.right,v);return n;};seq.forEach(v=>tmp=ins(tmp,v));svgH=Math.max(200,60+height(tmp)*42);
    const S=(o)=>({root,seq,cmp:0,path:[],...o});
    yield S({i:-1,line:-1,f:-1,msg:`Вставляємо ${seq.length} номерів у порядку: ${seq.join(', ')}`});
    for(let i=0;i<seq.length;i++){const v=seq[i];
      if(!root){root={key:v,left:null,right:null};yield S({i,line:7,f:2,newKey:v,msg:`Дерево порожнє → ${v} стає коренем`});continue;}
      let n=root;const path=[];
      while(true){path.push(n.key);
        if(v<n.key){yield S({i,cur:n.key,path:path.slice(),line:8,f:1,msg:`${v} < ${n.key} → ліворуч`});if(!n.left){n.left={key:v,left:null,right:null};yield S({i,path,line:7,f:2,newKey:v,msg:`Ліворуч від ${n.key} порожньо → новий вузол ${v}`});break;}n=n.left;}
        else{yield S({i,cur:n.key,path:path.slice(),line:10,f:1,msg:`${v} > ${n.key} → праворуч`});if(!n.right){n.right={key:v,left:null,right:null};yield S({i,path,line:7,f:2,newKey:v,msg:`Праворуч від ${n.key} порожньо → новий вузол ${v}`});break;}n=n.right;}
      }
    }
    let n=root,steps=0;const path=[];
    yield S({i:seq.length,line:15,f:3,msg:`Пошук ${target}: steps = 0, починаємо з кореня ${root.key}`});
    while(n){steps++;path.push(n.key);
      yield S({i:seq.length,cur:n.key,path:path.slice(),cmp:steps,line:18,f:3,msg:`Порівняння ${steps}: ${n.key} == ${target}? ${n.key===target?'так':'ні'}`});
      if(n.key===target){yield S({i:seq.length,found:n.key,path:path.slice(),cmp:steps,line:19,f:4,msg:`Знайдено ${target} за ${steps} порівнянь (висота дерева ${height(root)})`});return;}
      if(target<n.key){yield S({i:seq.length,cur:n.key,path:path.slice(),cmp:steps,line:21,f:3,msg:`${target} < ${n.key} → ліворуч`});n=n.left;}
      else{yield S({i:seq.length,cur:n.key,path:path.slice(),cmp:steps,line:23,f:3,msg:`${target} > ${n.key} → праворуч`});n=n.right;}
    }
    yield S({i:seq.length,path,cmp:steps,line:24,f:4,miss:true,msg:`Порожня гілка: ${target} немає в дереві. Порівнянь: ${steps}`});
  }
  function count(n){return n?1+count(n.left)+count(n.right):0;}
  function render(st){
    const on=new Set(st.path);
    treeSvg($('#bst-svg'),st.root,{h:svgH,cls:n=>n.key===st.found?'ok':(n.key===st.cur?'cur':(n.key===st.newKey?'ok':(on.has(n.key)?'front':''))),edge:(p,c)=>on.has(p.key)&&on.has(c.key)?'on':''});
    chips($('#bst-input'),'Порядок вставки:',st.seq,{hot:st.i,ok:st.seq.map((_,k)=>k).filter(k=>k<st.i)});
    $('#bst-msg').textContent=st.msg;codeOn($('#bst-code'),st.line);flowOn($('#bst-flow'),st.f);
    $('#bst-n').textContent=count(st.root);$('#bst-h').textContent=st.root?height(st.root):'—';$('#bst-cmp').textContent=st.cmp;
  }
  newKeys();const R=new Runner(g,render);controls($('#bst-controls'),R,'bst');
  $('#bst-mode').onchange=()=>R.reset();$('#bst-target').onchange=e=>{target=+e.target.value;R.reset();};$('#bst-new').onclick=()=>{newKeys();R.reset();};
  course($('#bst-course'),['b_trees']);
})();

/* ===================== TRAVERSALS ===================== */
(function(){
  const KEYS=[50,30,70,20,40,60,80,45,65];
  const ins=(n,v)=>{if(!n)return{key:v,left:null,right:null};if(v<n.key)n.left=ins(n.left,v);else if(v>n.key)n.right=ins(n.right,v);return n;};
  let root=null;KEYS.forEach(v=>root=ins(root,v));
  const NAMES={pre:'preorder',in:'inorder',post:'postorder'};
  // order of the three body lines per mode: S = append self, L = left call, R = right call
  const ORDER={pre:['S','L','R'],in:['L','S','R'],post:['L','R','S']};
  function dfsCode(m){const nm=NAMES[m];const body={S:'        result.append(node.value)',L:`        ${nm}(node.left, result)`,R:`        ${nm}(node.right, result)`};
    return [`def ${nm}(node, result):`,'    if node is not None:',...ORDER[m].map(k=>body[k]),'    return result'];}
  const BFS=['from collections import deque','','def bfs_traversal(root):','    result = []','    queue = deque([root])','    while queue:','        node = queue.popleft()','        result.append(node.value)','        if node.left:','            queue.append(node.left)','        if node.right:','            queue.append(node.right)','    return result'];
  const LAB={S:'Записати вузол',L:'Ліве піддерево',R:'Праве піддерево'};
  function* dfs(m){
    const out=[],stack=[];const S=o=>({out:out.slice(),stack:stack.slice(),...o});
    yield S({line:-1,f:-1,msg:`${NAMES[m]}(root, []) — стек викликів порожній`});
    function* rec(n){
      stack.push(n?n.key:'∅');
      if(!n){yield S({line:1,f:1,msg:'node is None → нічого не робимо, повертаємося'});stack.pop();return;}
      yield S({cur:n.key,line:1,f:0,msg:`Виклик ${NAMES[m]}(${n.key})`});
      for(let k=0;k<3;k++){const a=ORDER[m][k];const fi=2+k;
        if(a==='S'){out.push(n.key);yield S({cur:n.key,line:2+k,f:fi,msg:`result.append(${n.key}) → [${out.join(', ')}]`});}
        else{const c=a==='L'?n.left:n.right;yield S({cur:n.key,line:2+k,f:fi,msg:`${NAMES[m]}(${a==='L'?'node.left':'node.right'}) — ${c?'заходимо у '+c.key:'нащадка немає'}`});yield* rec(c);yield S({cur:n.key,line:2+k,f:fi,msg:`Повернулися у ${n.key}`});}
      }
      yield S({cur:n.key,line:5,f:5,msg:`${NAMES[m]}(${n.key}) завершено → повертаємося`});stack.pop();
    }
    yield* rec(root);
    yield S({line:5,f:5,done:true,msg:m==='in'?`Готово: [${out.join(', ')}] — у порядку зростання, бо це BST`:`Готово: [${out.join(', ')}]`});
  }
  function* bfs(){
    const out=[],q=[root];const S=o=>({out:out.slice(),queue:q.map(n=>n.key),...o});
    yield S({line:4,f:-1,msg:`queue = deque([${root.key}])`});
    while(q.length){const n=q.shift();yield S({cur:n.key,line:6,f:0,msg:`popleft() → ${n.key}`});
      out.push(n.key);yield S({cur:n.key,line:7,f:1,msg:`result = [${out.join(', ')}]`});
      if(n.left){q.push(n.left);yield S({cur:n.key,added:n.left.key,line:9,f:2,msg:`Лівий нащадок ${n.left.key} → у кінець черги`});}
      if(n.right){q.push(n.right);yield S({cur:n.key,added:n.right.key,line:11,f:2,msg:`Правий нащадок ${n.right.key} → у кінець черги`});}
    }
    yield S({line:12,f:3,done:true,msg:`Черга порожня. По рівнях: [${out.join(', ')}]`});
  }
  function make(){const m=$('#traverse-mode').value;
    if(m==='bfs'){code($('#traverse-code'),BFS);$('#traverse-code-title').textContent='bfs_traversal';flow($('#traverse-flow'),['popleft() — перший у черзі','Записати вузол','Дітей — у кінець черги','Черга порожня']);return bfs();}
    code($('#traverse-code'),dfsCode(m));$('#traverse-code-title').textContent=NAMES[m];
    flow($('#traverse-flow'),['Виклик для вузла','Порожньо → назад',...ORDER[m].map(k=>LAB[k]),'Повернутися']);return dfs(m);}
  function render(st){
    const done=new Set(st.out),inq=new Set(st.queue||[]),onStack=new Set((st.stack||[]).filter(x=>x!=='∅'));
    treeSvg($('#traverse-svg'),root,{h:260,cls:n=>n.key===st.cur?'cur':(done.has(n.key)?'ok':((inq.has(n.key)||onStack.has(n.key))?'front':'')),note:n=>{const i=st.out.indexOf(n.key);return i>=0?i+1:'';}});
    if(st.queue)chips($('#traverse-ds'),'Черга (вихід ліворуч):',st.queue,{hot:0,swap:st.added!==undefined?[st.queue.lastIndexOf(st.added)]:[]});
    else chips($('#traverse-ds'),'Стек викликів (вершина праворуч):',st.stack.map(k=>'f('+k+')'),{hot:st.stack.length-1,empty:'порожній'});
    chips($('#traverse-out'),'Результат:',st.out,{ok:st.out.map((_,i)=>i)});
    $('#traverse-msg').textContent=st.msg;codeOn($('#traverse-code'),st.line);flowOn($('#traverse-flow'),st.f);
  }
  const R=new Runner(make,render);controls($('#traverse-controls'),R,'traverse');
  $('#traverse-mode').onchange=()=>R.reset();
  course($('#traverse-course'),['b_trees']);
})();

/* ===================== HEAP ===================== */
(function(){
  const CODE=['class MinHeap:','    def __init__(self):','        self._items = []','','    def push(self, item):','        self._items.append(item)','        self._sift_up(len(self._items) - 1)','','    def pop(self):','        top = self._items[0]','        last = self._items.pop()','        if self._items:','            self._items[0] = last','            self._sift_down(0)','        return top','','    def _sift_up(self, i):','        while i > 0:','            parent = (i - 1) // 2','            if not self._items[i] < self._items[parent]:','                break','            self._items[i], self._items[parent] = self._items[parent], self._items[i]','            i = parent','','    def _sift_down(self, i):','        n = len(self._items)','        while True:','            smallest = i','            for child in (2 * i + 1, 2 * i + 2):','                if child < n and self._items[child] < self._items[smallest]:','                    smallest = child','            if smallest == i:','                break','            self._items[i], self._items[smallest] = self._items[smallest], self._items[i]','            i = smallest'];
  code($('#heap-code'),CODE);
  flow($('#heap-flow'),['push: у кінець списку','sift_up: менший за батька?','Обмін','pop: корінь ← останній','sift_down: найменша дитина','Готово']);
  function parse(){return $('#heap-ops').value.trim().split(/[\s,;]+/).filter(Boolean).slice(0,24).map(t=>/^pop$/i.test(t)?'pop':(Number.isFinite(+t)?Math.round(+t):null)).filter(t=>t!==null);}
  let stats={cmp:0,swp:0};
  function* g(){
    const ops=parse(),a=[],out=[];stats={cmp:0,swp:0};
    const S=(marks,line,f,msg,op)=>({a:a.slice(),marks,line,f,msg,out:out.slice(),op,ops});
    yield S({},-1,-1,`Операції: ${ops.join(' ')}`,-1);
    for(let k=0;k<ops.length;k++){const op=ops[k];
      if(op==='pop'){
        if(!a.length){yield S({},9,3,'pop() на порожній купі: у Python тут буде виняток — пропускаємо',k);continue;}
        const top=a[0];yield S({0:'ok'},9,3,`pop(): top = ${top} — мінімум завжди в корені`,k);
        const last=a.pop();
        if(a.length){a[0]=last;yield S({0:'swap'},12,3,`Останній елемент ${last} ставимо в корінь — тепер правило купи порушено`,k);
          let i=0;const n=a.length;
          while(true){let s=i;
            for(const c of [2*i+1,2*i+2]){if(c<n){stats.cmp++;yield S({[c]:'cmp',[s]:'pivot'},29,4,`дитина a[${c}]=${a[c]} < поточний мінімум a[${s}]=${a[s]}? ${a[c]<a[s]?'так':'ні'}`,k);if(a[c]<a[s])s=c;}}
            if(s===i){yield S({[i]:'ok'},32,4,`${a[i]} не більший за дітей — купа відновлена`,k);break;}
            [a[i],a[s]]=[a[s],a[i]];stats.swp++;yield S({[i]:'swap',[s]:'swap'},33,2,`Обмін: ${a[i]} ↑, ${a[s]} ↓`,k);i=s;}
        }
        out.push(top);yield S({},14,5,`Видано замовлення з дедлайном ${top} хв`,k);
      }else{
        a.push(op);let i=a.length-1;yield S({[i]:'ok'},5,0,`push(${op}): додаємо в кінець, індекс ${i}`,k);
        if(i===0){yield S({0:'ok'},17,1,'i = 0 — це корінь, спливати нікуди',k);continue;}
        while(i>0){const p=(i-1)>>1;stats.cmp++;
          yield S({[i]:'cmp',[p]:'cmp'},19,1,`a[${i}]=${a[i]} < батько a[${p}]=${a[p]}? ${a[i]<a[p]?'так':'ні'}`,k);
          if(!(a[i]<a[p])){yield S({[i]:'ok'},20,5,`Не менший за батька — зупиняємось`,k);break;}
          [a[i],a[p]]=[a[p],a[i]];stats.swp++;yield S({[i]:'swap',[p]:'swap'},21,2,`Обмін: ${a[p]} піднімається на індекс ${p}`,k);i=p;
          if(i===0)yield S({0:'ok'},17,5,`${a[0]} дійшов до кореня — новий мінімум`,k);}
      }
    }
    yield S({},-1,5,`Готово. Видано по черзі: [${out.join(', ')}] — завжди найменший`,ops.length);
  }
  function build(a,i){return i<a.length?{key:i,val:a[i],left:build(a,2*i+1),right:build(a,2*i+2)}:null;}
  const TCLS={cmp:'cur',swap:'bad',ok:'ok',pivot:'front'};
  function render(st){
    treeSvg($('#heap-svg'),build(st.a,0),{h:250,label:n=>n.val,note:n=>'['+n.key+']',cls:n=>TCLS[st.marks[n.key]]||''});
    $('#heap-arr').innerHTML=st.a.length?st.a.map((v,i)=>`<div class="cell ${st.marks[i]||''}"><span class="idx">${i}</span>${v}</div>`).join(''):'<span class="chip empty">порожній список</span>';
    chips($('#heap-out'),'Видано (pop):',st.out,{ok:st.out.map((_,i)=>i)});
    $('#heap-msg').textContent=st.msg;codeOn($('#heap-code'),st.line);flowOn($('#heap-flow'),st.f);$('#heap-cmp').textContent=stats.cmp;$('#heap-swp').textContent=stats.swp;
  }
  const R=new Runner(g,render);controls($('#heap-controls'),R,'heap');
  $('#heap-ops').onchange=()=>R.reset();
  $('#heap-rand').onclick=()=>{const xs=Array.from({length:8},()=>rnd(1,60));$('#heap-ops').value=[...xs,'pop','pop','pop','pop'].join(' ');R.reset();};
  course($('#heap-course'),['l29','b_sort']);
})();

/* ===================== TRIE ===================== */
(function(){
  const CODE=['class _Node:','    def __init__(self):','        self.children = {}','        self.is_word = False','','class Trie:','    def __init__(self):','        self._root = _Node()','','    def add(self, word):','        node = self._root','        for letter in word:','            node = node.children.setdefault(letter, _Node())','        node.is_word = True','','    def _find(self, prefix):','        node = self._root','        for letter in prefix:','            node = node.children.get(letter)','            if node is None:','                return None','        return node','','    def starts_with(self, prefix):','        node = self._find(prefix)','        if node is None:','            return []','        words = []','        self._collect(node, prefix, words)','        return words','','    def _collect(self, node, path, words):','        if node.is_word:','            words.append(path)','        for letter in sorted(node.children):','            self._collect(node.children[letter], path + letter, words)'];
  code($('#trie-code'),CODE);
  flow($('#trie-flow'),['add: літера за літерою','Позначити кінець слова','_find: спуск по префіксу','_collect: зібрати слова','Готово']);
  let uid=0;const mk=ch=>({id:uid++,ch,children:{},is_word:false});
  function parse(){const ws=[...new Set($('#trie-words').value.split(/[,;\n]+/).map(w=>w.trim().toLowerCase()).filter(Boolean).map(w=>w.slice(0,12)))].slice(0,8);return {words:ws,prefix:$('#trie-prefix').value.trim().toLowerCase().slice(0,12)};}
  let steps=0;
  function* g(){
    const {words,prefix}=parse();uid=0;const root=mk('•');steps=0;
    const S=o=>({root,words,found:[],path:[],sub:null,...o});
    yield S({line:7,f:-1,msg:`Порожнє дерево: лише корінь. Додамо ${words.length} слів, потім шукаємо «${prefix}»`});
    for(const w of words){let n=root;const path=[root.id];
      yield S({cur:root.id,path:path.slice(),word:w,line:10,f:0,msg:`add("${w}")`});
      for(const ch of w){const ex=!!n.children[ch];if(!ex)n.children[ch]=mk(ch);n=n.children[ch];path.push(n.id);
        yield S({cur:n.id,path:path.slice(),word:w,line:12,f:0,msg:ex?`«${ch}» — гілка вже є, йдемо нею`:`«${ch}» — нової гілки немає, створюємо вузол`});}
      n.is_word=true;yield S({cur:n.id,path:path.slice(),word:w,line:13,f:1,msg:`Кінець «${w}»: is_word = True`});}
    // find
    let n=root;const path=[root.id];
    yield S({cur:root.id,path:path.slice(),query:true,line:24,f:2,msg:`starts_with("${prefix}") → _find("${prefix}")`});
    for(const ch of prefix){steps++;const nx=n.children[ch];
      if(!nx){yield S({cur:n.id,path:path.slice(),query:true,line:19,f:2,msg:`children.get("${ch}") → None: слів на «${prefix}» немає`});yield S({path:path.slice(),query:true,line:26,f:4,done:true,msg:'Повертаємо [] — вузла префікса не існує'});return;}
      n=nx;path.push(n.id);yield S({cur:n.id,path:path.slice(),query:true,line:18,f:2,msg:`children.get("${ch}") → вузол «${ch}» (перехід ${steps})`});}
    const sub=new Set();(function walk(x){sub.add(x.id);Object.values(x.children).forEach(walk);})(n);
    const found=[];
    yield S({cur:n.id,path:path.slice(),sub,query:true,line:28,f:3,msg:`Вузол префікса знайдено за ${steps} переходів. Збираємо все, що росте з нього`});
    function* collect(x,p){
      yield S({cur:x.id,path:path.slice(),sub,found:found.slice(),query:true,line:32,f:3,msg:`_collect(«${p}»): is_word = ${x.is_word?'True':'False'}`});
      if(x.is_word){found.push(p);yield S({cur:x.id,path:path.slice(),sub,found:found.slice(),query:true,line:33,f:3,msg:`words.append("${p}")`});}
      for(const ch of Object.keys(x.children).sort())yield* collect(x.children[ch],p+ch);
    }
    yield* collect(n,prefix);
    yield S({path:path.slice(),sub,found:found.slice(),query:true,line:29,f:4,done:true,msg:found.length?`starts_with("${prefix}") → [${found.map(w=>'"'+w+'"').join(', ')}]`:`Вузол є, але слів під ним немає`});
  }
  function render(st){
    // horizontal layout: depth → x, leaf order → y
    const nodes=[];let leaf=0,maxD=0;
    (function lay(n,d){n._d=d;maxD=Math.max(maxD,d);const ks=Object.keys(n.children).sort();if(!ks.length){n._y=leaf++;}else{ks.forEach(k=>lay(n.children[k],d+1));const ys=ks.map(k=>n.children[k]._y);n._y=(Math.min(...ys)+Math.max(...ys))/2;}nodes.push(n);})(st.root,0);
    const W=640,rows=Math.max(1,leaf),H=Math.max(140,30+rows*40),dx=Math.min(64,(W-60)/Math.max(1,maxD)),dy=(H-40)/Math.max(1,rows-1||1);
    const X=n=>30+n._d*dx,Y=n=>rows===1?H/2:20+n._y*dy;const r=14;
    const pathS=new Set(st.path),foundPaths=new Set();
    const svg=$('#trie-svg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const cls=n=>{if(n.id===st.cur)return 'cur';if(pathS.has(n.id))return 'ok';if(st.query&&st.sub&&st.sub.has(n.id))return 'front';if(st.query)return 'dim';return '';};
    let e='',v='';
    nodes.forEach(n=>Object.values(n.children).forEach(c=>{e+=`<line class="e ${pathS.has(n.id)&&pathS.has(c.id)?'on':''}" x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`;}));
    nodes.forEach(n=>{v+=`<g class="v ${cls(n)}">${n.is_word?`<circle cx="${X(n)}" cy="${Y(n)}" r="${r+4}" style="fill:none"/>`:''}<circle cx="${X(n)}" cy="${Y(n)}" r="${r}"/><text x="${X(n)}" y="${Y(n)}" style="font-size:13px">${esc(n.ch)}</text></g>`;});
    svg.innerHTML=e+v;
    chips($('#trie-out'),'Знайдено:',st.found,{ok:st.found.map((_,i)=>i),empty:st.query?'поки нічого':'—'});
    $('#trie-msg').textContent=st.msg;codeOn($('#trie-code'),st.line);flowOn($('#trie-flow'),st.f);
    $('#trie-n').textContent=nodes.length;$('#trie-steps').textContent=st.query?steps:0;
  }
  const R=new Runner(g,render);controls($('#trie-controls'),R,'trie');
  $('#trie-words').onchange=$('#trie-prefix').onchange=()=>R.reset();
  course($('#trie-course'),['l29','b_search']);
})();

/* ===================== DIJKSTRA ===================== */
(function(){
  const POS={D:[190,32],A:[55,100],F:[310,66],B:[190,150],E:[80,225],C:[290,225],G:[350,150]};
  const ZONES={A:'Поділ',B:'Центр',C:'Печерськ',D:'Оболонь',E:'Лук’янівка',F:'Лівобережна',G:'Видубичі'};
  const EDGES=[['A','B',6],['A','E',2],['E','B',3],['A','D',7],['D','F',11],['B','C',4],['B','F',8],['C','F',3],['C','G',6],['F','G',5]];
  const GRAPH={};Object.keys(ZONES).sort().forEach(k=>GRAPH[k]=[]);EDGES.forEach(([u,v,w])=>{GRAPH[u].push([v,w]);GRAPH[v].push([u,w]);});
  const CODE=['import heapq','','def dijkstra(graph, start):','    dist = {node: float(\'inf\') for node in graph}','    prev = {node: None for node in graph}','    dist[start] = 0','    heap = [(0, start)]','    visited = set()','    while heap:','        cost, node = heapq.heappop(heap)','        if node in visited:','            continue','        visited.add(node)','        for neighbor, weight in graph[node]:','            new_cost = cost + weight','            if new_cost < dist[neighbor]:','                dist[neighbor] = new_cost','                prev[neighbor] = node','                heapq.heappush(heap, (new_cost, neighbor))','    return dist, prev','','def reconstruct_path(prev, target):','    path = []','    while target is not None:','        path.append(target)','        target = prev[target]','    return path[::-1]'];
  code($('#dijkstra-code'),CODE);
  flow($('#dijkstra-flow'),['heappop: найближчий','Уже оброблено?','Релаксація сусідів','Відновити шлях','Готово']);
  $('#dijkstra-legend').innerHTML=Object.keys(ZONES).sort().map(k=>`<span><b style="font-family:var(--mono)">${k}</b> — ${ZONES[k]}</span>`).join('')+'<span>число на ребрі — хвилини</span>';
  const opts=Object.keys(ZONES).sort().map(k=>`<option value="${k}">${k} — ${ZONES[k]}</option>`).join('');
  $('#dijkstra-start').innerHTML=opts;$('#dijkstra-target').innerHTML=opts;$('#dijkstra-start').value='A';$('#dijkstra-target').value='G';
  let st0={pops:0,relax:0};
  const fmtD=d=>d===Infinity?'∞':d;
  function* g(){
    const s=$('#dijkstra-start').value,t=$('#dijkstra-target').value;st0={pops:0,relax:0};
    const dist={},prev={},vis=new Set();Object.keys(GRAPH).forEach(k=>{dist[k]=Infinity;prev[k]=null;});dist[s]=0;
    let heap=[[0,s]];const sortH=()=>heap.sort((a,b)=>a[0]-b[0]||(a[1]<b[1]?-1:a[1]>b[1]?1:0));
    const S=o=>({dist:{...dist},prev:{...prev},vis:new Set(vis),heap:heap.map(x=>x.slice()),s,t,path:null,...o});
    yield S({line:6,f:-1,msg:`dist[${s}] = 0, решта ∞; heap = [(0, ${s})]`});
    while(heap.length){sortH();const [cost,u]=heap.shift();st0.pops++;
      yield S({cur:u,popped:[cost,u],line:9,f:0,msg:`heappop → (${cost}, ${u}) — найменша відома вартість`});
      if(vis.has(u)){yield S({cur:u,line:11,f:1,msg:`${u} уже оброблено — це застарілий запис у купі, пропускаємо`});continue;}
      vis.add(u);yield S({cur:u,line:12,f:1,msg:`${u} (${ZONES[u]}) остаточно: ${cost} хв`});
      for(const [v,w] of GRAPH[u]){const nc=cost+w;
        if(nc<dist[v]){const old=dist[v];dist[v]=nc;prev[v]=u;heap.push([nc,v]);sortH();st0.relax++;
          yield S({cur:u,edge:[u,v],better:v,line:18,f:2,msg:`${u}→${v}: ${cost} + ${w} = ${nc} < ${fmtD(old)} → dist[${v}] = ${nc}, prev[${v}] = ${u}`});}
        else yield S({cur:u,edge:[u,v],line:15,f:2,msg:`${u}→${v}: ${cost} + ${w} = ${nc} не менше за ${fmtD(dist[v])} — без змін`});}
    }
    yield S({line:19,f:3,msg:'Купа порожня — усі відстані остаточні'});
    const path=[];let x=t;while(x!==null){path.push(x);yield S({path:path.slice().reverse(),cur:x,line:24,f:3,msg:`path.append(${x}); далі prev[${x}] = ${prev[x]===null?'None':prev[x]}`});x=prev[x];}
    path.reverse();
    yield S({path,line:26,f:4,done:true,msg:dist[t]===Infinity?`До ${t} дороги немає`:`Найшвидше ${ZONES[s]} → ${ZONES[t]}: ${path.join(' → ')} = ${dist[t]} хв`});
  }
  function render(st){
    const inHeap=new Set(st.heap.map(x=>x[1]));const pe=new Set();
    if(st.path)for(let i=1;i<st.path.length;i++){pe.add(st.path[i-1]+st.path[i]);pe.add(st.path[i]+st.path[i-1]);}
    graphSvg($('#dijkstra-svg'),POS,EDGES,{
      cls:k=>k===st.cur?'cur':(st.path&&st.path.includes(k)?'ok':(st.vis.has(k)?'ok':(inHeap.has(k)?'front':''))),
      edge:(u,v)=>{if(st.edge&&((st.edge[0]===u&&st.edge[1]===v)||(st.edge[0]===v&&st.edge[1]===u)))return 'cur';if(st.path)return pe.has(u+v)?'on':'';return (st.prev[v]===u||st.prev[u]===v)?'on':'';},
      note:k=>fmtD(st.dist[k])});
    chips($('#dijkstra-heap'),'Купа (найменший ліворуч):',st.heap.map(([c,v])=>`(${c}, ${v})`),{hot:0,empty:'порожня'});
    $('#dijkstra-table').innerHTML='<tr><th>Район</th><th style="text-align:right">dist, хв</th><th>prev</th><th>Стан</th></tr>'+Object.keys(ZONES).sort().map(k=>`<tr${k===st.better?' class="warn"':''}><td><b style="font-family:var(--mono)">${k}</b> ${ZONES[k]}</td><td class="num">${fmtD(st.dist[k])}</td><td style="font-family:var(--mono)">${st.prev[k]||'—'}</td><td>${st.vis.has(k)?'остаточно':(inHeap.has(k)?'у купі':'—')}</td></tr>`).join('');
    $('#dijkstra-msg').textContent=st.msg;codeOn($('#dijkstra-code'),st.line);flowOn($('#dijkstra-flow'),st.f);
    $('#dijkstra-pops').textContent=st0.pops;$('#dijkstra-relax').textContent=st0.relax;
  }
  const R=new Runner(g,render);controls($('#dijkstra-controls'),R,'dijkstra');
  $('#dijkstra-start').onchange=$('#dijkstra-target').onchange=()=>R.reset();
  course($('#dijkstra-course'),['b_graphs']);
})();

/* ===================== BELLMAN-FORD ===================== */
(function(){
  const POS={S:[40,115],A:[165,45],B:[165,190],C:[295,45],D:[360,160]};
  const NODES=['S','A','B','C','D'];
  const BASE=[['C','D',2],['A','C',3],['B','A',-3],['S','A',4],['S','B',5],['B','D',6]];
  const CODE=['def bellman_ford(nodes, edges, start):','    dist = {node: float(\'inf\') for node in nodes}','    dist[start] = 0','    for _ in range(len(nodes) - 1):','        changed = False','        for u, v, w in edges:','            if dist[u] + w < dist[v]:','                dist[v] = dist[u] + w','                changed = True','        if not changed:','            break','    for u, v, w in edges:','        if dist[u] + w < dist[v]:','            raise ValueError("від\'ємний цикл")','    return dist'];
  code($('#bellman-code'),CODE);
  flow($('#bellman-flow'),['Раунд: пройти всі ребра','Релаксація','Змін не було → стоп','Контрольний прохід','Готово / цикл']);
  const fmtD=d=>d===Infinity?'∞':d;const fw=w=>w<0?'−'+(-w):w;
  function* g(){
    const E=$('#bellman-cycle').checked?[...BASE,['C','B',-5]]:BASE;
    const dist={};NODES.forEach(k=>dist[k]=Infinity);dist.S=0;const rows=[{label:'старт',d:{...dist},chg:[]}];
    const S=o=>({E,dist:{...dist},rows:rows.map(r=>({...r,d:{...r.d}})),...o});
    yield S({line:2,f:-1,msg:`dist[S] = 0, решта ∞. Ребер: ${E.length}, вузлів: ${NODES.length} → до ${NODES.length-1} раундів`});
    let round=0;
    for(;round<NODES.length-1;round++){let changed=false;const chg=[];
      yield S({ei:-1,round:round+1,line:4,f:0,msg:`Раунд ${round+1}: changed = False`});
      for(let i=0;i<E.length;i++){const [u,v,w]=E[i];const nd=dist[u]+w;
        if(nd<dist[v]){const old=dist[v];dist[v]=nd;changed=true;chg.push(v);yield S({ei:i,round:round+1,hot:v,line:7,f:1,msg:`${u}→${v}: ${fmtD(dist[u])} + (${fw(w)}) = ${nd} < ${fmtD(old)} → dist[${v}] = ${nd}`});}
        else yield S({ei:i,round:round+1,line:6,f:0,msg:`${u}→${v}: ${fmtD(dist[u])} + (${fw(w)}) = ${fmtD(nd)} не менше за ${fmtD(dist[v])}`});}
      rows.push({label:`раунд ${round+1}`,d:{...dist},chg});
      if(!changed){yield S({ei:-1,round:round+1,line:10,f:2,msg:`За раунд ${round+1} нічого не змінилось — далі змін не буде, виходимо`});break;}
      yield S({ei:-1,round:round+1,line:9,f:0,msg:`Раунд ${round+1} змінив: ${[...new Set(chg)].join(', ')}`});
    }
    for(let i=0;i<E.length;i++){const [u,v,w]=E[i];const nd=dist[u]+w;
      if(nd<dist[v]){yield S({ei:i,check:true,bad:[u,v],line:13,f:4,done:true,cycle:true,msg:`Контрольний прохід: ${u}→${v} усе ще покращує (${nd} < ${dist[v]}) → від'ємний цикл`});return;}
      yield S({ei:i,check:true,line:12,f:3,msg:`Контроль ${u}→${v}: ${fmtD(nd)} < ${fmtD(dist[v])}? ні`});}
    yield S({ei:-1,line:14,f:4,done:true,msg:`Готово: ${NODES.map(k=>k+' = '+fmtD(dist[k])).join(', ')}`});
  }
  function render(st){
    const cur=st.ei>=0?st.E[st.ei]:null;
    graphSvg($('#bellman-svg'),POS,st.E.map(([u,v,w])=>[u,v,fw(w)]),{directed:true,
      cls:k=>(st.bad&&st.bad.includes(k))?'bad':(cur&&cur[1]===k?'cur':(cur&&cur[0]===k?'front':(st.dist[k]!==Infinity?'ok':''))),
      edge:(u,v)=>cur&&cur[0]===u&&cur[1]===v?'cur':'',note:k=>fmtD(st.dist[k])});
    chips($('#bellman-edges'),st.check?'Контрольний прохід:':'Список ребер (по черзі):',st.E.map(([u,v,w])=>`${u}→${v} ${fw(w)}`),{hot:st.ei,swap:st.bad?[st.ei]:[]});
    $('#bellman-table').innerHTML='<tr><th></th>'+NODES.map(k=>`<th style="text-align:right">${k}</th>`).join('')+'</tr>'+st.rows.map(r=>`<tr><td>${r.label}</td>${NODES.map(k=>`<td class="num${r.chg.includes(k)?' tg-chg':''}">${fmtD(r.d[k])}</td>`).join('')}</tr>`).join('');
    $('#bellman-msg').textContent=st.msg;codeOn($('#bellman-code'),st.line);flowOn($('#bellman-flow'),st.f);
    const v=$('#bellman-verdict');
    if(!st.done)v.innerHTML='';
    else if(st.cycle)v.innerHTML='<p class="note bad">Цикл B → A → C → B має сумарну вагу −3 + 3 − 5 = −5: кожен обхід здешевлює маршрут ще на 5, тож «найкоротшого» шляху не існує. Беллман–Форд це виявляє, Дейкстра — ні.</p>';
    else v.innerHTML='<p class="note">Шлях S → B → A коштує 5 − 3 = 2 — дешевше за пряме S → A = 4. Жадібний Дейкстра закрив би A зі значенням 4 і помилився б.</p>';
  }
  const R=new Runner(g,render);controls($('#bellman-controls'),R,'bellman');
  $('#bellman-cycle').onchange=()=>R.reset();
  course($('#bellman-course'),['b_graphs']);
})();
