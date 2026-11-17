/* ===== frag_linear: shared drawing for linked lists ===== */
/* boxes: [{id, label, x, y, cls, none, tags:[...]}]  (x, y = top-left corner)
   arrows: [{from, to, cls}] — from the "next" compartment of one box to another box. */
function linSvg(svg,boxes,arrows,W,H){
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const BW=60,BH=34,NW=50,by={};boxes.forEach(b=>by[b.id]=b);
  const w=b=>b.none?NW:BW;
  const mk=['','on','cur','new'].map(c=>`<marker id="${svg.id}-m${c}" class="${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>`).join('');
  let a='';
  arrows.forEach(r=>{const s=by[r.from],t=by[r.to];if(!s||!t)return;
    const sx=s.x+50,sy=s.y+BH/2;let d;
    if(t.x>s.x+20){d=`M${sx},${sy} L${t.x-2},${t.y+BH/2}`;}
    else{const ex=t.x+w(t)/2,ey=t.y-2;const top=Math.min(s.y,t.y)-42;d=`M${sx},${s.y} C${sx},${top} ${ex},${top} ${ex},${ey}`;}
    a+=`<path class="lin-ar ${r.cls||''}" d="${d}" marker-end="url(#${svg.id}-m${r.cls||''})"/>`;});
  let v='';
  boxes.forEach(b=>{
    if(b.none)v+=`<g class="lin-box none"><rect x="${b.x}" y="${b.y+3}" width="${NW}" height="${BH-6}" rx="6"/><text x="${b.x+NW/2}" y="${b.y+BH/2}">None</text></g>`;
    else v+=`<g class="lin-box ${b.cls||''}"><rect x="${b.x}" y="${b.y}" width="${BW}" height="${BH}" rx="6"/><line x1="${b.x+40}" y1="${b.y}" x2="${b.x+40}" y2="${b.y+BH}"/><text x="${b.x+20}" y="${b.y+BH/2}">${esc(b.label)}</text><circle cx="${b.x+50}" cy="${b.y+BH/2}" r="3"/></g>`;
    if(b.tags&&b.tags.length)v+=`<text class="lin-tag" x="${b.x+w(b)/2}" y="${b.y+BH+18}">${esc(b.tags.join(' · '))}</text>`;});
  svg.innerHTML=`<defs>${mk}</defs>`+a+v;
}
const linLine=(lines,s,from=0)=>{const i=lines.findIndex((l,k)=>k>=from&&l.includes(s));if(i<0)throw new Error('line not found: '+s);return i;};

/* ===================== ARRAY vs LINKED LIST ===================== */
(function(){
  const CA=['def array_insert(arr, index, value):','    arr.append(None)  # +1 місце в кінці','    for i in range(len(arr) - 1, index, -1):','        arr[i] = arr[i - 1]  # зсув праворуч','    arr[index] = value'];
  const CL=['class Node:','    def __init__(self, data, next_node=None):','        self.data = data','        self.next = next_node','','def linked_insert(head, index, value):','    if index == 0:','        return Node(value, head)  # новий стає головою','    prev = head','    for _ in range(index - 1):  # дійти до попередника','        prev = prev.next','    prev.next = Node(value, prev.next)  # 2 посилання — і все','    return head'];
  code($('#arrlist-code-a'),CA);code($('#arrlist-code-l'),CL);
  flow($('#arrlist-flow-a'),['Місце в кінці','Зсунути праворуч','Записати значення','Готово']);
  flow($('#arrlist-flow-l'),['Дійти до місця','Новий вузол → наступник','Попередник → новий','Готово']);
  const BASE=[101,102,103,104,105,106],CAP=8,NEW=100;
  const L=s=>linLine(CL,s);
  const stats={moves:0,walk:0,links:0};
  function* arr(k){const a=BASE.slice();yield{a:a.slice(),marks:{},line:-1,f:-1,msg:`len = 6, місткість (capacity) = ${CAP}: два місця в запасі`};
    a.push(null);yield{a:a.slice(),marks:{6:'cmp'},line:1,f:0,msg:'arr.append(None): довжина 7, зайнято одне місце з запасу'};
    if(k===6)yield{a:a.slice(),marks:{},line:2,f:1,msg:'range(6, 6, −1) порожній: зсувати нічого'};
    for(let i=6;i>k;i--){a[i]=a[i-1];stats.moves++;yield{a:a.slice(),marks:{[i]:'swap',[i-1]:'cmp'},line:3,f:1,msg:`arr[${i}] = arr[${i-1}] = ${a[i]}`};}
    a[k]=NEW;yield{a:a.slice(),marks:{[k]:'ok'},line:4,f:2,msg:`arr[${k}] = ${NEW}`};
    yield{a:a.slice(),marks:{[k]:'ok'},line:-1,f:3,done:true,msg:`Готово: зсунуто ${stats.moves} ${stats.moves===1?'елемент':(stats.moves>=2&&stats.moves<=4?'елементи':'елементів')}`};}
  const X=j=>60+j*84,Y=50;
  function boxes(order,raised,tags){return order.map((v,j)=>({id:v===null?'none':'n'+v,label:v,none:v===null,x:X(j),y:Y,cls:'',tags:tags['n'+v]||(v===null?tags.none:undefined)}))
    .concat(raised?[{id:'n'+NEW,label:NEW,x:raised.x,y:Y+82,cls:'new',tags:tags['n'+NEW]}]:[]);}
  function chain(order){const r=[];for(let j=0;j<order.length-1;j++)r.push({from:'n'+order[j],to:order[j+1]===null?'none':'n'+order[j+1]});return r;}
  function* lnk(k){const order=[...BASE,null];
    const S=(bx,ar,line,f,msg,done)=>({bx,ar,line,f,msg,done});
    yield S(boxes(order,null,{n101:['head']}),chain(order),-1,-1,'head → 101 → … → 106 → None');
    if(k===0){yield S(boxes(order,null,{n101:['head']}),chain(order),L('if index == 0'),0,'index == 0: до місця йти не треба');
      stats.links++;yield S(boxes(order,{x:X(0)-42},{n101:['head']}),[...chain(order),{from:'n'+NEW,to:'n101',cls:'new'}],L('return Node(value, head)'),1,`Node(${NEW}, head): новий вузол вказує на стару голову 101`);
      const fin=[NEW,...order];const bx=boxes(fin,null,{['n'+NEW]:['head']});bx[0].cls='ok';
      yield S(bx,chain(fin).map((r,j)=>j===0?{...r,cls:'on'}:r),L('return Node(value, head)'),3,`Готово: ${NEW} — нова голова. 0 зсувів, ${stats.links} нове посилання`,true);return;}
    let p=0;yield S(boxes(order,null,{n101:['head','prev']}),chain(order),L('prev = head'),0,'prev = head (101)');
    for(let s=0;s<k-1;s++){p++;stats.walk++;const t={n101:['head'],['n'+order[p]]:['prev']};yield S(boxes(order,null,t),chain(order),L('prev = prev.next'),0,`prev = prev.next → ${order[p]}`);}
    const prevV=order[p],succ=order[p+1],succId=succ===null?'none':'n'+succ;const tags={n101:['head'],['n'+prevV]:['prev']};
    const bxPrev=()=>{const b=boxes(order,{x:X(p+1)-42},tags);b.find(x=>x.id==='n'+prevV).cls='cur';return b;};
    stats.links++;yield S(bxPrev(),[...chain(order),{from:'n'+NEW,to:succId,cls:'new'}],L('prev.next = Node'),1,`Node(${NEW}, prev.next): новий вузол вказує на ${succ===null?'None':succ}`);
    stats.links++;const ar=chain(order).filter(r=>r.from!=='n'+prevV);ar.push({from:'n'+prevV,to:'n'+NEW,cls:'new'},{from:'n'+NEW,to:succId,cls:'new'});
    yield S(bxPrev(),ar,L('prev.next = Node'),2,`prev.next = новий вузол: ${prevV} → ${NEW} → ${succ===null?'None':succ}`);
    const fin=order.slice();fin.splice(p+1,0,NEW);const bx=boxes(fin,null,{n101:['head']});bx[p+1].cls='ok';
    yield S(bx,chain(fin).map(r=>r.from==='n'+prevV||r.from==='n'+NEW?{...r,cls:'on'}:r),L('return head'),3,`Готово: ${stats.walk} ${stats.walk===1?'крок':'кроків'} по посиланнях, 2 нові посилання, 0 зсувів`,true);}
  let K=3;
  function make(){K=+$('#arrlist-pos').value;stats.moves=stats.walk=stats.links=0;return both(arr(K),lnk(K));}
  function render([sa,sl]){
    let h='';for(let i=0;i<CAP;i++){const has=i<sa.a.length;const v=has?(sa.a[i]===null?'∅':sa.a[i]):'';h+=`<div class="cell ${has?(sa.marks[i]||''):'cap'}"><span class="idx">${i}</span>${v}</div>`;}
    $('#arrlist-arr').innerHTML=h;$('#arrlist-msg-a').textContent=sa.msg;codeOn($('#arrlist-code-a'),sa.line);flowOn($('#arrlist-flow-a'),sa.f);
    linSvg($('#arrlist-svg'),sl.bx,sl.ar,720,170);$('#arrlist-msg-l').textContent=sl.msg;codeOn($('#arrlist-code-l'),sl.line);flowOn($('#arrlist-flow-l'),sl.f);
    $('#arrlist-moves').textContent=stats.moves;$('#arrlist-walk').textContent=stats.walk;$('#arrlist-links').textContent=stats.links;}
  const R=new Runner(make,render);controls($('#arrlist-controls'),R,'arrlist');
  $('#arrlist-pos').onchange=()=>R.reset();
  course($('#arrlist-course'),['b_list']);
})();

/* ===================== REVERSE LINKED LIST ===================== */
(function(){
  const C=['def reverse_linked_list(head):','    prev = None','    cur = head','    while cur:','        nxt = cur.next  # запам\'ятати наступний','        cur.next = prev  # розвернути стрілку','        prev = cur  # prev — крок вперед','        cur = nxt  # cur — крок вперед','    return prev  # нова голова'];
  code($('#revlist-code'),C);
  flow($('#revlist-flow'),['nxt = cur.next','cur.next = prev','prev = cur','cur = nxt','return prev']);
  let n=5,done=0;
  const X=j=>16+j*82,Y=78;
  function* g(){n=+$('#revlist-n').value;done=0;
    const next={};for(let i=1;i<=n;i++)next[i]=i<n?i:'R';  // index -> target (number or 'L'/'R')
    const nx={};for(let i=1;i<=n;i++)nx[i]=i<n?i+1:'R';
    let prev=null,cur=1,nxt=null,flipped=0;
    const id=v=>v==='L'?'noneL':(v==='R'?'noneR':'n'+v);
    const S=(line,f,msg,hotArrow,end)=>{const tags={};const add=(k,t)=>{(tags[k]=tags[k]||[]).push(t);};
      add(prev===null?'noneL':'n'+prev,'prev');if(cur!==undefined)add(cur===null?'noneR':'n'+cur,'cur');if(nxt!==null)add(nxt==='R'?'noneR':'n'+nxt,'nxt');
      const bx=[{id:'noneL',none:true,x:X(0),y:Y,tags:tags.noneL}];
      for(let i=1;i<=n;i++)bx.push({id:'n'+i,label:i,x:X(i),y:Y,cls:i===cur&&!end?'cur':(i<=flipped||end?'ok':''),tags:tags['n'+i]});
      bx.push({id:'noneR',none:true,x:X(n+1),y:Y,tags:tags.noneR});
      const ar=[];for(let i=1;i<=n;i++){const rev=i<=flipped;ar.push({from:'n'+i,to:id(nx[i]),cls:i===hotArrow?'new':(rev?'on':'')});}
      return{bx,ar,line,f,msg,W:X(n+2)+4};};
    yield S(1,-1,'prev = None');
    yield S(2,-1,'cur = head (1)');
    while(cur!==null){
      yield S(3,-1,`while cur: cur = ${cur} → тіло циклу`);
      nxt=nx[cur]==='R'?'R':nx[cur];yield S(4,0,`nxt = cur.next → ${nxt==='R'?'None':nxt}: решту списку не загубимо`);
      nx[cur]=prev===null?'L':prev;flipped=cur;done++;yield S(5,1,`cur.next = prev: стрілка ${cur} тепер вказує на ${prev===null?'None':prev}`,cur);
      prev=cur;yield S(6,2,`prev = ${prev}`);
      cur=nxt==='R'?null:nxt;nxt=null;yield S(7,3,`cur = ${cur===null?'None':cur}`);}
    yield S(3,-1,'while cur: cur is None → вихід з циклу');
    yield S(8,4,`Нова голова: ${prev}. Список: ${Array.from({length:n},(_,i)=>n-i).join(' → ')} → None`,0,true);}
  function render(st){linSvg($('#revlist-svg'),st.bx,st.ar,st.W,190);$('#revlist-msg').textContent=st.msg;codeOn($('#revlist-code'),st.line);flowOn($('#revlist-flow'),st.f);$('#revlist-done').textContent=done;}
  const R=new Runner(g,render);controls($('#revlist-controls'),R,'revlist');
  $('#revlist-n').oninput=e=>{$('#revlist-n-v').textContent=e.target.value;R.reset();};
  course($('#revlist-course'),['b_list']);
})();

/* ===================== BRACKETS ===================== */
(function(){
  const C=['PAIRS = {")": "(", "]": "[", "}": "{"}','','def is_balanced(text):','    opened = []  # стек','    for char in text:','        if char in "([{":','            opened.append(char)  # push','        elif char in PAIRS:','            if not opened or opened.pop() != PAIRS[char]:','                return False','    return not opened'];
  code($('#brackets-code'),C);
  flow($('#brackets-flow'),['Наступний символ','Відкривна → push','Закривна = вершина → pop','Не збігається → False','Кінець: стек порожній?']);
  const PAIRS={')':'(',']':'[','}':'{'};
  const st={push:0,pop:0,seen:0};let text='';
  function* g(){text=$('#brackets-text').value.slice(0,60);st.push=st.pop=st.seen=0;
    const chars=[...text],cls={},stack=[];
    const S=(cur,line,f,msg,verdict)=>({cls:{...cls},cur,stack:stack.map(x=>x.ch),line,f,msg,verdict});
    yield S(-1,3,-1,`opened = []. Текст: ${chars.length} символів`);
    for(let i=0;i<chars.length;i++){const c=chars[i];st.seen++;
      if('([{'.includes(c)){yield S(i,4,0,`char = "${c}" — відкривна`);stack.push({ch:c,i});st.push++;cls[i]='seen';yield S(i,6,1,`push("${c}"): тепер на вершині стека`);}
      else if(PAIRS[c]){yield S(i,4,0,`char = "${c}" — закривна, потрібна "${PAIRS[c]}"`);
        if(!stack.length){cls[i]='bad';yield S(i,9,3,`Стек порожній, а прийшла "${c}": нема чого закривати → False`,false);return;}
        const top=stack.pop();st.pop++;
        if(top.ch!==PAIRS[c]){cls[i]='bad';cls[top.i]='bad';yield S(i,9,3,`pop() → "${top.ch}", а прийшла "${c}": порядок порушено → False`,false);return;}
        cls[i]='ok';cls[top.i]='ok';yield S(i,8,2,`pop() → "${top.ch}" збігається з "${c}" — пару закрито`);}
      else{cls[i]='dim';yield S(i,5,0,`"${c===' '?'пробіл':c}" — не дужка, пропускаємо`);}}
    if(stack.length){stack.forEach(x=>cls[x.i]='bad');yield S(-1,10,3,`Текст закінчився, у стеку лишилось ${stack.length}: ${stack.map(x=>'"'+x.ch+'"').join(', ')} → False`,false);}
    else yield S(-1,10,4,'Текст закінчився, стек порожній → True',true);}
  function render(s){const chars=[...text];
    $('#brackets-chars').innerHTML=chars.length?chars.map((c,i)=>`<div class="cell ${i===s.cur?'cmp':(s.cls[i]||'')}${c===' '?' sp':''}">${c===' '?'␣':esc(c)}</div>`).join(''):'<span class="chip empty">порожній рядок</span>';
    chips($('#brackets-stack'),'Стек (вершина праворуч):',s.stack,{hot:s.stack.length-1,empty:'порожній'});
    $('#brackets-msg').textContent=s.msg;codeOn($('#brackets-code'),s.line);flowOn($('#brackets-flow'),s.f);
    $('#brackets-verdict').innerHTML=s.verdict===undefined?'':(s.verdict?'<p class="note">✓ Збалансовано: кожна дужка закрита відповідною і в правильному порядку.</p>':'<p class="note bad">✗ Не збалансовано: такий шаблон зламає SMS.</p>');
    $('#brackets-seen').textContent=st.seen;$('#brackets-push').textContent=st.push;$('#brackets-pop').textContent=st.pop;}
  const R=new Runner(g,render);controls($('#brackets-controls'),R,'brackets');
  $('#brackets-text').oninput=()=>R.reset();
  document.querySelectorAll('[data-brackets]').forEach(b=>b.onclick=()=>{$('#brackets-text').value=b.dataset.brackets;R.reset();});
  course($('#brackets-course'),['l29','b_deque']);
})();

/* ===================== QUEUE: list vs deque ===================== */
(function(){
  flow($('#queue-flow-l'),['Взяти перший','Зсунути решту ліворуч','dispatch','Черга порожня']);
  flow($('#queue-flow-d'),['Взяти перший','Зсунути «голову»','dispatch','Черга порожня']);
  const st={l:0,d:0};let n=8;
  function codes(){const nums=Array.from({length:n},(_,i)=>101+i).join(', ');
    code($('#queue-code-l'),[`orders = [${nums}]`,'while orders:','    order = orders.pop(0)  # зсуває всіх, хто лишився','    dispatch(order)']);
    code($('#queue-code-d'),['from collections import deque','',`orders = deque([${nums}])`,'while orders:','    order = orders.popleft()  # O(1): лише зсув «голови»','    dispatch(order)']);}
  function* lst(){const a=Array.from({length:n},(_,i)=>101+i);yield{a:a.slice(),marks:{},line:0,f:-1,msg:`Черга: ${n} замовлень`};
    while(a.length){yield{a:a.slice(),marks:{0:'cmp'},line:2,f:0,msg:`pop(0) → ${a[0]}`};const o=a.shift();const m=a.length;st.l+=m;
      const marks={};a.forEach((_,i)=>marks[i]='swap');yield{a:a.slice(),marks,line:2,f:1,msg:m?`Масив переписав ${m} ${m===1?'елемент':(m<=4?'елементи':'елементів')}: кожен на одне місце ліворуч`:'Останній елемент — зсувати нічого'};
      yield{a:a.slice(),marks:{},line:3,f:2,msg:`dispatch(${o})`};}
    yield{a:[],marks:{},line:1,f:3,msg:`Черга порожня. Усього зсувів: ${st.l}`};}
  const out=[];
  function* dq(){const a=Array.from({length:n},(_,i)=>101+i);yield{a:a.slice(),marks:{},line:2,f:-1,msg:`Черга: ${n} замовлень`};
    while(a.length){yield{a:a.slice(),marks:{0:'cmp'},line:4,f:0,msg:`popleft() → ${a[0]}`};const o=a.shift();
      yield{a:a.slice(),marks:{},line:4,f:1,msg:'Зсувів 0: deque лише перемістила вказівник на нову «голову»'};
      out.push(o);yield{a:a.slice(),marks:{},line:5,f:2,msg:`dispatch(${o})`};}
    yield{a:[],marks:{},line:3,f:3,msg:'Черга порожня. Усього зсувів: 0'};}
  function make(){n=+$('#queue-n').value;st.l=st.d=0;out.length=0;codes();return both(lst(),dq());}
  const cells=(host,s)=>{host.innerHTML=s.a.length?s.a.map((v,i)=>`<div class="cell ${s.marks[i]||''}">${v}</div>`).join(''):'<span class="chip empty">порожньо</span>';};
  function render([sl,sd]){cells($('#queue-list'),sl);cells($('#queue-deque'),sd);
    $('#queue-msg-l').textContent=sl.msg;$('#queue-msg-d').textContent=sd.msg;
    codeOn($('#queue-code-l'),sl.line);codeOn($('#queue-code-d'),sd.line);flowOn($('#queue-flow-l'),sl.f);flowOn($('#queue-flow-d'),sd.f);
    chips($('#queue-out'),'Видано водіям:',out.slice(),{ok:out.map((_,i)=>i),empty:'ще нікого'});
    $('#queue-moves-l').textContent=st.l;$('#queue-moves-d').textContent=st.d;$('#queue-big').textContent=fmt(100000*99999/2);}
  const R=new Runner(make,render);controls($('#queue-controls'),R,'queue');
  $('#queue-n').oninput=e=>{$('#queue-n-v').textContent=e.target.value;R.reset();};
  course($('#queue-course'),['l29','b_list','b_deque']);
})();

/* ===================== SLIDING WINDOW MAX ===================== */
(function(){
  const C=['from collections import deque','','def sliding_window_max(nums, k):','    window = deque()  # індекси; значення спадають','    result = []','    for i, x in enumerate(nums):','        if window and window[0] <= i - k:','            window.popleft()  # вийшов з вікна','        while window and nums[window[-1]] <= x:','            window.pop()  # менші вже не знадобляться','        window.append(i)','        if i >= k - 1:','            result.append(nums[window[0]])','    return result'];
  code($('#windowmax-code'),C);const L=s=>linLine(C,s);
  flow($('#windowmax-flow'),['Новий елемент','Прибрати старий зліва','Прибрати менші справа','append(i)','Записати максимум']);
  let nums=[4,2,12,3,8,6,7,5,9,1],k=3,ops=0;
  function* g(){k=+$('#windowmax-k').value;ops=0;const w=[],res=[];
    const S=(i,line,f,msg,extra={})=>({i,w:w.slice(),res:res.slice(),line,f,msg,...extra});
    yield S(-1,L('window = deque()'),-1,`Години зміни: ${nums.length}, вікно k = ${k}`);
    for(let i=0;i<nums.length;i++){const x=nums[i];
      yield S(i,L('for i, x'),0,`i = ${i}, x = ${x}`);
      if(w.length&&w[0]<=i-k){const o=w[0];yield S(i,L('if window and window[0]'),1,`Індекс ${o} ≤ ${i} − ${k}: він уже за межами вікна`,{out:o});w.shift();ops++;yield S(i,L('window.popleft()'),1,`popleft() → прибрали індекс ${o}`);}
      while(w.length&&nums[w[w.length-1]]<=x){const t=w[w.length-1];yield S(i,L('while window'),2,`nums[${t}] = ${nums[t]} ≤ ${x}: поки ${x} у вікні, ${nums[t]} не стане максимумом`,{drop:t});w.pop();ops++;yield S(i,L('window.pop()'),2,`pop() → прибрали індекс ${t}`);}
      w.push(i);ops++;yield S(i,L('window.append(i)'),3,`append(${i}). Значення в deque: [${w.map(j=>nums[j]).join(', ')}] — спадають`);
      if(i>=k-1){res.push(nums[w[0]]);yield S(i,L('result.append'),4,`Вікно [${i-k+1}..${i}]: максимум nums[${w[0]}] = ${nums[w[0]]} — лежить ліворуч у deque`);}}
    yield S(-1,L('return result'),-1,`Результат: [${res.join(', ')}]. Операцій з deque: ${ops} ≤ 2n = ${2*nums.length}`,{end:true});}
  function render(s){const lo=s.i-k+1;
    $('#windowmax-cells').innerHTML=nums.map((v,j)=>{let c='';if(s.i>=0&&j>=Math.max(0,lo)&&j<=s.i)c='win';if(s.w.includes(j))c='pivot';if(s.w.length&&j===s.w[0]&&s.i>=0)c='ok';if(j===s.drop||j===s.out)c='bad';if(j===s.i&&c!=='ok'&&c!=='pivot')c='cmp';return `<div class="cell ${c}"><span class="idx">${j}</span>${v}</div>`;}).join('');
    chips($('#windowmax-deque'),'deque (індекс:значення):',s.w.map(j=>`${j}:${nums[j]}`),{ok:s.w.length?[0]:[],empty:'порожня'});
    chips($('#windowmax-result'),'Максимуми вікон:',s.res,{ok:s.res.map((_,i)=>i),hot:s.line===L('result.append')?s.res.length-1:-1,empty:'ще немає'});
    $('#windowmax-msg').textContent=s.msg;codeOn($('#windowmax-code'),s.line);flowOn($('#windowmax-flow'),s.f);
    $('#windowmax-ops').textContent=ops;$('#windowmax-naive').textContent=Math.max(0,nums.length-k+1)*k;}
  const R=new Runner(g,render);controls($('#windowmax-controls'),R,'windowmax');
  $('#windowmax-k').oninput=e=>{$('#windowmax-k-v').textContent=e.target.value;R.reset();};
  $('#windowmax-new').onclick=()=>{nums=Array.from({length:10},()=>rnd(1,15));R.reset();};
  $('#windowmax-classic').onclick=()=>{nums=[1,3,-1,-3,5,3,6,7];$('#windowmax-k').value=3;$('#windowmax-k-v').textContent='3';R.reset();};
  course($('#windowmax-course'),['b_deque']);
})();

/* ===================== LRU CACHE ===================== */
(function(){
  const C=['from collections import OrderedDict','','class LRUCache:','    def __init__(self, capacity):','        self.capacity = capacity','        self._data = OrderedDict()  # зліва — найдавніший','        self.hits = 0','        self.misses = 0','','    def get(self, key, default=None):','        if key not in self._data:','            self.misses += 1','            return default  # промах','        self.hits += 1','        self._data.move_to_end(key)  # щойно використали','        return self._data[key]','','    def put(self, key, value):','        if key in self._data:','            self._data.move_to_end(key)','        self._data[key] = value','        if len(self._data) > self.capacity:','            self._data.popitem(last=False)  # викинути найдавніший'];
  code($('#lru-code'),C);const L=(s,from=0)=>linLine(C,s,from);const PUT=L('def put');
  flow($('#lru-flow'),['Нова операція','Ключ у кеші?','Перемістити в кінець','Записати значення','Викинути найдавніший']);
  const OPS=[['put','Поділ→Оболонь',180],['put','Центр→Поділ',120],['put','Оболонь→Центр',150],['get','Поділ→Оболонь'],['put','Лівобережна→Центр',210],['get','Центр→Поділ'],['put','Центр→Поділ',125],['get','Оболонь→Центр'],['get','Лівобережна→Центр']];
  const opLabel=o=>o[0]==='get'?`get(${o[1]})`:`put(${o[1]}, ${o[2]})`;
  const st={hits:0,misses:0,evict:0};
  function* g(){st.hits=st.misses=st.evict=0;const d=[];// [key, value] in recency order
    const S=(op,line,f,msg,hot,evicted)=>({op,d:d.map(x=>x.slice()),line,f,msg,hot,evicted});
    yield S(-1,L('self._data = OrderedDict()'),-1,'LRUCache(3): порожній кеш на 3 маршрути');
    for(let i=0;i<OPS.length;i++){const [kind,key,val]=OPS[i];const idx=()=>d.findIndex(x=>x[0]===key);
      yield S(i,kind==='get'?L('def get'):PUT,0,opLabel(OPS[i]));
      if(kind==='get'){
        if(idx()<0){st.misses++;yield S(i,L('return default'),1,`«${key}» немає в кеші → промах: доведеться питати сервіс цін`);continue;}
        st.hits++;yield S(i,L('self.hits += 1'),1,`«${key}» є в кеші → влучання, сервіс не потрібен`,key);
        d.push(d.splice(idx(),1)[0]);yield S(i,L('self._data.move_to_end(key)'),2,`move_to_end: «${key}» тепер найсвіжіший`,key);
        yield S(i,L('return self._data[key]'),2,`Повертаємо ${d[d.length-1][1]} грн`,key);}
      else{
        if(idx()>=0){yield S(i,L('if key in self._data',PUT),1,`«${key}» уже є → переставимо в кінець`,key);d.push(d.splice(idx(),1)[0]);yield S(i,L('self._data.move_to_end(key)',PUT),2,'move_to_end',key);}
        else yield S(i,L('if key in self._data',PUT),1,`«${key}» ще немає в кеші`);
        const j=idx();if(j>=0)d[j][1]=val;else d.push([key,val]);
        yield S(i,L('self._data[key] = value'),3,`Записали «${key}» = ${val} у кінець`,key);
        if(d.length>3){yield S(i,L('if len(self._data)'),4,`У кеші ${d.length} > 3 записи: хтось має піти`,key,d[0][0]);
          const ev=d.shift();st.evict++;yield S(i,L('popitem(last=False)'),4,`popitem(last=False): викинули найдавніший «${ev[0]}»`,key);}}}
    yield S(OPS.length,-1,-1,`Готово: ${st.hits} влучання, ${st.misses} промахи, ${st.evict} витіснення. Без кешу кожен get — запит до сервісу.`);}
  function render(s){
    chips($('#lru-ops'),'Операції:',OPS.map(opLabel),{hot:s.op,ok:OPS.map((_,i)=>i).filter(i=>i<s.op)});
    const items=s.d.map(x=>`${x[0]}: ${x[1]}`);const hot=s.d.findIndex(x=>x[0]===s.hot);const ev=s.d.findIndex(x=>x[0]===s.evicted);
    chips($('#lru-cache'),'Кеш:',items,{hot:hot>=0&&hot!==ev?hot:-1,swap:ev>=0?ev:-1,empty:'порожній'});
    $('#lru-msg').textContent=s.msg;codeOn($('#lru-code'),s.line);flowOn($('#lru-flow'),s.f);
    $('#lru-hits').textContent=st.hits;$('#lru-misses').textContent=st.misses;$('#lru-evict').textContent=st.evict;}
  const R=new Runner(g,render);controls($('#lru-controls'),R,'lru');
  course($('#lru-course'),['l29','b_list']);
})();
