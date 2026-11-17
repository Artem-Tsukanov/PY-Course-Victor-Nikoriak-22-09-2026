/* ================= SHARED HELPERS (available to every fragment) =================
   All fragment code runs inside one closure after these definitions, so use them directly.

   $(sel)                      -> document.querySelector
   esc(s)                      -> HTML-escape
   fmt(n)                      -> rounded number with uk-UA thousands separators
   rnd(a,b)                    -> random int in [a,b]
   shuffle(arr)                -> new shuffled copy

   new Runner(makeGen, render) -> stepper. makeGen() returns a generator of plain state objects;
                                  render(state, runner) draws one state. runner.reset() re-creates the generator.
                                  runner.steps = number of steps taken.
   controls(host, runner, idp) -> fills host with ▶ Старт / Крок → / Скинути / Швидкість. idp = unique id prefix.
   both(...gens)               -> runs several generators in lock-step; yields arrays [lastStateA, lastStateB, ...].

   flow(host, ["Крок 1", ...]) -> flow schema; flowOn(host, i) highlights node i (-1 = none). Last node is the "end" node.
   code(host, lines)           -> renders Python with line numbers; codeOn(host, i) highlights line i (0-based, -1 = none).

   chips(host, label, items, opt) -> horizontal strip of chips.
        items: array of strings/numbers. opt: {hot: idx|[idx], ok:[idx], swap:[idx], dim:[idx], empty:'порожньо'}
   treeSvg(svg, root, opt)     -> draws a binary tree. root = {key, left, right} (null = empty).
        opt: {cls: node => 'cur'|'ok'|'front'|'bad'|'', edge: (parent,child) => 'on'|'', label: node => text,
              note: node => small text above-right, w: 640, h: 300}
   graphSvg(svg, pos, edges, opt) -> draws a graph. pos = {A:[x,y], ...}; edges = [[u,v,w?], ...]
        opt: {directed:false, cls: k => 'cur'|'ok'|'front'|'', edge: (u,v) => 'on'|'cur'|'', note: k => text under-right}
        The svg must have a viewBox (e.g. "0 0 320 260").
   course(host, keys)          -> fills «У курсі:» line with links. keys from COURSE below.
*/
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('uk-UA');
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const shuffle=arr=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

class Runner{
  constructor(make,render){this.make=make;this.render=render;this.timer=null;this.delay=450;this.playBtn=null;this.stepBtn=null;this.reset();}
  reset(){this.pause();this.gen=this.make();this.done=false;this.steps=0;const r=this.gen.next();this.state=r.value;this.done=!!r.done;if(this.state!==undefined)this.render(this.state,this);this.ui();}
  step(){if(this.done)return;const r=this.gen.next();if(r.done){this.done=true;this.pause();}else{this.state=r.value;this.steps++;this.render(this.state,this);}this.ui();}
  play(){if(this.timer||this.done)return;const tick=()=>{this.step();if(!this.done)this.timer=setTimeout(tick,this.delay);else this.timer=null;};this.timer=setTimeout(tick,0);this.ui();}
  pause(){if(this.timer){clearTimeout(this.timer);this.timer=null;}this.ui();}
  toggle(){this.timer?this.pause():this.play();}
  ui(){if(this.playBtn){this.playBtn.textContent=this.timer?'⏸ Пауза':(this.done?'✓ Готово':'▶ Старт');this.playBtn.disabled=this.done;}if(this.stepBtn)this.stepBtn.disabled=this.done;}
}
function controls(host,runner,idp){
  host.innerHTML=`<button class="btn primary" id="${idp}-play">▶ Старт</button><button class="btn" id="${idp}-step">Крок →</button><button class="btn" id="${idp}-reset">Скинути</button><label>Швидкість <input type="range" id="${idp}-speed" min="1" max="10" value="5"></label>`;
  runner.playBtn=$('#'+idp+'-play');runner.stepBtn=$('#'+idp+'-step');
  runner.playBtn.onclick=()=>runner.toggle();runner.stepBtn.onclick=()=>{runner.pause();runner.step();};
  $('#'+idp+'-reset').onclick=()=>runner.reset();
  const sp=$('#'+idp+'-speed');const set=()=>runner.delay=1150-sp.value*110;sp.oninput=set;set();runner.ui();
  RUNNERS.push(runner);
}
const RUNNERS=[];
function* both(...gens){const its=gens.map(g=>g);const last=its.map(()=>undefined);const done=its.map(()=>false);
  its.forEach((it,i)=>{const r=it.next();if(r.done)done[i]=true;else last[i]=r.value;});yield last.slice();
  while(done.some(d=>!d)){its.forEach((it,i)=>{if(done[i])return;const r=it.next();if(r.done)done[i]=true;else last[i]=r.value;});yield last.slice();}}

function flow(host,nodes){host.innerHTML=nodes.map((n,i)=>`${i?'<span class="arrow">→</span>':''}<span class="node${i===nodes.length-1?' end':''}" data-i="${i}">${esc(n)}</span>`).join('');}
function flowOn(host,i){host.querySelectorAll('.node').forEach(n=>n.classList.toggle('on',+n.dataset.i===i));}
function code(host,lines){host.innerHTML=lines.map((l,i)=>`<span class="ln" data-n="${i+1}">${hi(l)||' '}</span>`).join('');}
function hi(l){
  // strings first (as placeholders) so keywords inside strings are not coloured
  const S=[];let t=esc(l).replace(/(f?"[^"]*"|f?'[^']*')/g,m=>{S.push(m);return '\u0000'+String.fromCharCode(0xE000+S.length-1)+'\u0000';});
  let comment='';const h=t.indexOf('#');if(h>=0){comment=t.slice(h);t=t.slice(0,h);}
  t=t.replace(/\b(def|class|return|for|in|while|if|elif|else|not|and|or|is|import|from|as|lambda|True|False|None|yield|break|continue|pass|with|try|except|raise|del|global|nonlocal|self)\b/g,'<span class="k">$1</span>')
     .replace(/\b(range|len|print|sorted|enumerate|min|max|sum|set|dict|list|tuple|zip|reversed|hash|isinstance|any|all|abs)\b(?=\()/g,'<span class="f">$1</span>')
     .replace(/\b(\d+(\.\d+)?)\b/g,'<span class="n">$1</span>');
  const back=c=>S[c.charCodeAt(0)-0xE000];
  t=t.replace(/\u0000([\uE000-\uF8FF])\u0000/g,(_,c)=>`<span class="s">${back(c)}</span>`);
  comment=comment.replace(/\u0000([\uE000-\uF8FF])\u0000/g,(_,c)=>back(c));
  return t+(comment?`<span class="c">${comment}</span>`:'');
}
function codeOn(host,i){host.querySelectorAll('.ln').forEach((n,k)=>n.classList.toggle('hl',k===i));}

function chips(host,label,items,opt={}){
  const as=v=>v===undefined?[]:(Array.isArray(v)?v:[v]);
  const hot=as(opt.hot),ok=as(opt.ok),sw=as(opt.swap),dim=as(opt.dim);
  host.innerHTML=(label?`<span class="lab">${label}</span>`:'')+(items.length?items.map((x,i)=>`<span class="chip${hot.includes(i)?' hot':''}${ok.includes(i)?' ok':''}${sw.includes(i)?' swap':''}${dim.includes(i)?' dim':''}">${esc(x)}</span>`).join(''):`<span class="chip empty">${opt.empty||'порожньо'}</span>`);
}

function treeSvg(svg,root,opt={}){
  const W=opt.w||640,H=opt.h||300;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const nodes=[];let idx=0,maxD=0;
  (function walk(n,d){if(!n)return;walk(n.left,d+1);n._x=idx++;n._d=d;maxD=Math.max(maxD,d);nodes.push(n);walk(n.right,d+1);})(root,0);
  if(!nodes.length){svg.innerHTML=`<text x="${W/2}" y="${H/2}" class="empty">порожнє дерево</text>`;return;}
  const gx=W/(nodes.length+1),gy=Math.min(70,(H-50)/Math.max(1,maxD));
  const X=n=>(n._x+1)*gx,Y=n=>28+n._d*gy;const r=Math.max(11,Math.min(19,gx*0.42));
  let e='',v='';
  nodes.forEach(n=>{[n.left,n.right].forEach(c=>{if(c)e+=`<line class="e ${opt.edge?opt.edge(n,c):''}" x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`;});});
  nodes.forEach(n=>{const lab=opt.label?opt.label(n):n.key;const note=opt.note?opt.note(n):'';
    v+=`<g class="v ${opt.cls?opt.cls(n):''}"><circle cx="${X(n)}" cy="${Y(n)}" r="${r}"/><text x="${X(n)}" y="${Y(n)}" style="font-size:${Math.round(r*0.85)}px">${esc(lab)}</text>${note!==''&&note!=null?`<text class="ord" x="${X(n)+r+4}" y="${Y(n)-r+2}">${esc(note)}</text>`:''}</g>`;});
  svg.innerHTML=e+v;
}

function graphSvg(svg,pos,edges,opt={}){
  let defs=opt.directed?'<defs><marker id="arr-'+svg.id+'" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>':'';
  const R=18;let e='';
  edges.forEach(([u,v,w])=>{const [x1,y1]=pos[u],[x2,y2]=pos[v];const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1;
    const sx=x1+dx/L*R,sy=y1+dy/L*R,ex=x2-dx/L*(R+(opt.directed?3:0)),ey=y2-dy/L*(R+(opt.directed?3:0));
    const c=opt.edge?opt.edge(u,v):'';
    e+=`<line class="e ${c}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" ${opt.directed?`marker-end="url(#arr-${svg.id})"`:''}/>`;
    if(w!==undefined){const mx=(x1+x2)/2,my=(y1+y2)/2;e+=`<g class="w ${c}"><rect x="${mx-12}" y="${my-10}" width="24" height="20" rx="5"/><text x="${mx}" y="${my}">${w}</text></g>`;}});
  let v='';Object.keys(pos).forEach(k=>{const [x,y]=pos[k];const note=opt.note?opt.note(k):'';
    v+=`<g class="v ${opt.cls?opt.cls(k):''}"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y}">${esc(k)}</text>${note!==''&&note!=null?`<text class="ord" x="${x+R+4}" y="${y-R+2}">${esc(note)}</text>`:''}</g>`;});
  svg.innerHTML=defs+e+v;
}

const REPO='https://github.com/NikoriakViktor/PY-Course-Victor-Nikoriak-22-09-2026/blob/main/';
const BOOK='https://nikoriakviktor.github.io/PY-Course-Victor-Nikoriak-22-09-2026/modules/';
const COURSE={
  l09:{t:'Урок 9 · П1. Big O',u:BOOK+'m1/lesson_09/'},
  l12:{t:'Урок 12 · П2. Пошук',u:BOOK+'m1/lesson_12/'},
  l17:{t:'Урок 17 · П3. Хеш-структури',u:BOOK+'m1/lesson_17/'},
  l23:{t:'Урок 23 · П4. Рекурсія, divide & conquer, backtracking',u:BOOK+'m2/lesson_23/'},
  l27:{t:'Урок 27 · П5. ДП + greedy',u:BOOK+'m2/lesson_27/'},
  l29:{t:'Урок 29 · П6. Stack, Queue, Heap, Trie, LRU',u:BOOK+'m2/lesson_29/'},
  b_list:{t:'Бонус: список як архітектурне рішення',u:REPO+'module_3/bonus/lesson_list_data_structure/note_lesson_24_list_data_structure.ipynb'},
  b_deque:{t:'Бонус: Stack, Queue, Deque',u:REPO+'module_3/bonus/lesson_deque_queue/note_lesson_23_deque_queue.ipynb'},
  b_search:{t:'Бонус: пошук і хешування',u:REPO+'module_3/bonus/lesson_search_hashing/note_lesson_25_search_hashing.ipynb'},
  b_sort:{t:'Бонус: алгоритми сортування',u:REPO+'module_3/bonus/lesson_sorting/note_lesson_27_sorting.ipynb'},
  b_trees:{t:'Бонус: дерева',u:REPO+'module_3/bonus/lesson_trees/note_lesson_26_trees.ipynb'},
  b_graphs:{t:'Бонус: графи, BFS/DFS, Dijkstra',u:REPO+'module_3/bonus/lesson_graphs/note_lesson_28_graphs.ipynb'},
};
function course(host,keys){host.innerHTML='<span class="lab">У курсі:</span>'+keys.map(k=>`<a href="${COURSE[k].u}" target="_blank" rel="noopener">${esc(COURSE[k].t)}</a>`).join('');}
