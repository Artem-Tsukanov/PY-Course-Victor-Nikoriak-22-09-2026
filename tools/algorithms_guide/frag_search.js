/* ===================== BISECT: lower bound + autocomplete ===================== */
(function(){
  const pl=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return `${n} ${a>10&&a<20?f[2]:(b===1?f[0]:(b>=2&&b<=4?f[1]:f[2]))}`;};
  const CA=['def first_at_or_after(times, target):','    low, high = 0, len(times)','    while low < high:','        mid = (low + high) // 2','        if times[mid] < target:','            low = mid + 1','        else:','            high = mid','    return low     # = bisect_left(times, target)'];
  const CB=['from bisect import bisect_left','','def suggest(streets, prefix):','    start = bisect_left(streets, prefix)','    end = bisect_left(streets, prefix + "\\uffff")','    return streets[start:end]'];
  code($('#bisect-code'),CA);code($('#bisect-code2'),CB);
  flow($('#bisect-flow'),['mid = (low + high) // 2','arr[mid] < ціль?','low = mid + 1 або high = mid','low == high → позиція']);
  const TIMES=[425,510,612,700,845,930,1035,1120,1210,1290,1375];
  const STREETS=['Богдана Хмельницького','Велика Васильківська','Верхній Вал','Володимирська','Хрещатик','Хорива','Шота Руставелі','Антоновича','Саксаганського','Січових Стрільців','Ярославів Вал','Межигірська','Мечникова'].sort();
  const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  const MAXC='\uffff';
  const showStr=v=>v.endsWith(MAXC)?`"${v.slice(0,-1)}" + "\\uffff"`:`"${v}"`;
  function readTime(){const m=/^\s*(\d{1,2})[:.](\d{2})\s*$/.exec($('#bisect-time').value);if(!m)return 1120;return Math.min(23,+m[1])*60+Math.min(59,+m[2]);}
  /* the same lower-bound loop as first_at_or_after; yields line indices of CA */
  function* lower(arr,target,show){
    let lo=0,hi=arr.length,c=0;const S=(o)=>({lo,hi,mid:-1,c,...o});
    yield S({la:1,f:-1,msg:`low = 0, high = len = ${hi}: шукаємо в [${lo}, ${hi})`});
    while(lo<hi){
      const mid=(lo+hi)>>1;
      yield S({mid,la:3,f:0,msg:`mid = (${lo} + ${hi}) // 2 = ${mid}`});
      c++;
      if(arr[mid]<target){
        yield S({mid,la:4,f:1,msg:`${show(arr[mid])} < ${show(target)}? так → відповідь правіше за mid`});
        lo=mid+1;yield S({la:5,f:2,msg:`low = ${lo}: проміжок [${lo}, ${hi})`});
      }else{
        yield S({mid,la:4,f:1,msg:`${show(arr[mid])} < ${show(target)}? ні → mid може бути відповіддю, лишаємо його`});
        hi=mid;yield S({la:7,f:2,msg:`high = ${hi}: проміжок [${lo}, ${hi})`});
      }
    }
    yield S({la:8,f:3,res:lo,msg:`low == high == ${lo}: проміжок порожній, відповідь — ${lo}`});
    return {res:lo,c};
  }
  function* main(){
    const target=readTime(),prefix=$('#bisect-prefix').value;
    const idle={lo:-1,hi:-1,mid:-1,c:0};let t={lo:0,hi:TIMES.length,mid:-1,c:0},s=idle,c2=0,result='—',range=null;
    const Y=(o)=>({t,s,c1:t.c,c2,result,range,lb:-1,...o});
    yield Y({la:-1,f:-1,msg:`Шукаємо першу поїздку о ${hm(target)} або пізніше`});
    const g=lower(TIMES,target,v=>hm(v));let r;
    while(!(r=g.next()).done){t=r.value;yield Y({la:t.la,f:t.f,msg:t.msg});}
    const ti=r.value.res;t={...t,res:ti,done:true};
    result=`індекс ${ti}`;
    const verdict=ti===TIMES.length?`Усі поїздки почалися раніше за ${hm(target)}: позиція ${ti} = len(times)`:
      (TIMES[ti]===target?`Поїздка о ${hm(target)} була: times[${ti}] = ${hm(TIMES[ti])}. До неї — ${pl(ti,['поїздка','поїздки','поїздок'])}`:`О ${hm(target)} поїздки не було. Наступна — times[${ti}] = ${hm(TIMES[ti])}`);
    yield Y({la:8,f:3,msg:verdict});
    yield Y({la:-1,lb:3,f:-1,msg:`suggest(${showStr(prefix)}): bisect_left робить той самий пошук нижньої межі, але на рядках`});
    const runOn=function*(tg,line,name){const g2=lower(STREETS,tg,showStr);let q;while(!(q=g2.next()).done){s=q.value;yield Y({la:s.la,lb:line,f:s.f,c2:c2+s.c,msg:`${name}: ${s.msg}`});}c2+=q.value.c;return q.value.res;};
    const start=yield* runOn(prefix,3,'start');
    range=[start,start];s={...idle,res:start};
    yield Y({la:-1,lb:3,f:3,msg:`start = ${start}: перша вулиця, не менша за ${showStr(prefix)}`});
    const end=yield* runOn(prefix+MAXC,4,'end');
    range=[start,end];s={...idle};
    const found=STREETS.slice(start,end);result=found.length?pl(found.length,['вулиця','вулиці','вулиць']):'нічого';
    yield Y({la:-1,lb:5,f:3,msg:found.length?`streets[${start}:${end}] = ${found.join(', ')}`:`start == end == ${start}: вулиць з префіксом ${showStr(prefix)} немає`});
  }
  function cellRow(st){
    const done=st.t.res!==undefined;const n=TIMES.length;
    const tags={};const add=(i,x)=>tags[i]=(tags[i]?tags[i]+' ':'')+x;
    if(!done){add(st.t.lo,'low');add(st.t.hi,'high');}if(st.t.mid>=0)add(st.t.mid,'mid');
    let h=TIMES.map((v,i)=>{let c='';if(done)c=i===st.t.res?'ok':(i<st.t.res?'seen':'');else c=i===st.t.mid?'cmp':((i<st.t.lo||i>=st.t.hi)?'dim':'');
      return `<div class="cell ${c}"><span class="idx">${i}</span>${hm(v)}${tags[i]?`<span class="tag">${tags[i]}</span>`:''}</div>`;}).join('');
    h+=`<div class="cell ghost ${done&&st.t.res===n?'ok':''}"><span class="idx">${n}</span>кінець${tags[n]?`<span class="tag">${tags[n]}</span>`:''}</div>`;
    $('#bisect-times').innerHTML=h;
  }
  function streetList(st){
    const s=st.s,active=s.lo>=0||s.res!==undefined;const n=STREETS.length;
    const tags={};const add=(i,x)=>tags[i]=(tags[i]?tags[i]+' ':'')+x;
    if(s.lo>=0&&s.res===undefined){add(s.lo,'low');add(s.hi,'high');}if(s.mid>=0)add(s.mid,'mid');if(s.res!==undefined)add(s.res,'→');
    if(st.range){add(st.range[0],'start');if(st.range[1]!==st.range[0]||st.lb===5)add(st.range[1],'end');}
    const inRange=i=>st.range&&st.lb===5&&i>=st.range[0]&&i<st.range[1];
    let h=STREETS.map((v,i)=>{let c='';if(inRange(i))c='ok';else if(active&&s.lo>=0&&s.res===undefined)c=i===s.mid?'cmp':((i<s.lo||i>=s.hi)?'dim':'');
      return `<div class="bl-row ${c}"><span class="i">${i}</span><span>${esc(v)}</span><span class="t">${tags[i]||''}</span></div>`;}).join('');
    h+=`<div class="bl-row ghost"><span class="i">${n}</span><span>кінець списку</span><span class="t">${tags[n]||''}</span></div>`;
    $('#bisect-streets').innerHTML=h;
  }
  function render(st){cellRow(st);streetList(st);$('#bisect-msg').textContent=st.msg;codeOn($('#bisect-code'),st.la);codeOn($('#bisect-code2'),st.lb);flowOn($('#bisect-flow'),st.f);$('#bisect-c1').textContent=st.c1;$('#bisect-c2').textContent=st.c2;$('#bisect-res').textContent=st.result;}
  const R=new Runner(main,render);controls($('#bisect-controls'),R,'bisect');
  $('#bisect-time').onchange=()=>R.reset();$('#bisect-prefix').oninput=()=>R.reset();
  document.querySelectorAll('#bisect [data-t]').forEach(b=>b.onclick=()=>{$('#bisect-time').value=b.dataset.t;R.reset();});
  course($('#bisect-course'),['l12','b_search']);
})();

/* ===================== TWO POINTERS ===================== */
(function(){
  const pl=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return `${n} ${a>10&&a<20?f[2]:(b===1?f[0]:(b>=2&&b<=4?f[1]:f[2]))}`;};
  const C=['def pair_with_sum(prices, target):','    left, right = 0, len(prices) - 1','    while left < right:','        total = prices[left] + prices[right]','        if total == target:','            return prices[left], prices[right]','        if total < target:','            left += 1        # потрібна більша сума','        else:','            right -= 1       # потрібна менша сума','    return None'];
  code($('#twoptr-code'),C);
  flow($('#twoptr-flow'),['total = ліва + права','total == ціль?','менше → left += 1','більше → right -= 1','Готово']);
  const ORIG=[120,150,180,230,270,320,410];let xs=ORIG.slice();
  const brute=(a,t)=>{let s=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){s++;if(a[i]+a[j]===t)return s;}return s;};
  function* g(){const t=+$('#twoptr-target').value||0;let l=0,r=xs.length-1,c=0;const S=o=>({l,r,c,...o});
    yield S({line:1,f:-1,msg:`left = 0, right = ${r}: дивимось на найменшу й найбільшу ціну`});
    while(l<r){
      const tot=xs[l]+xs[r];c++;
      yield S({line:3,f:0,msg:`total = ${xs[l]} + ${xs[r]} = ${tot}`});
      if(tot===t){yield S({line:5,f:4,found:true,msg:`${xs[l]} + ${xs[r]} = ${t}. Знайдено за ${pl(c,['перевірку','перевірки','перевірок'])}`});return;}
      if(tot<t){yield S({line:6,f:2,msg:`${tot} < ${t}: навіть з найбільшою ціною ${xs[r]} ціна ${xs[l]} дає замало → відкидаємо її`});l++;yield S({line:7,f:2,msg:`left = ${l}`});}
      else{yield S({line:8,f:3,msg:`${tot} > ${t}: навіть з найменшою ціною ${xs[l]} ціна ${xs[r]} дає забагато → відкидаємо її`});r--;yield S({line:9,f:3,msg:`right = ${r}`});}
    }
    yield S({line:10,f:4,none:true,msg:`left == right: пар не лишилося, відповіді немає (${pl(c,['перевірка','перевірки','перевірок'])})`});
  }
  function render(st){const t=+$('#twoptr-target').value||0;
    $('#twoptr-cells').innerHTML=xs.map((v,i)=>{let c='';if(st.found&&(i===st.l||i===st.r))c='ok';else if(i<st.l||i>st.r||st.none)c='dim';else if(i===st.l||i===st.r)c='cmp';
      const tag=st.none?'':(i===st.l&&i===st.r?'left=right':(i===st.l?'left':(i===st.r?'right':'')));
      return `<div class="cell ${c}"><span class="idx">${i}</span>${v}${tag?`<span class="tag">${tag}</span>`:''}</div>`;}).join('');
    $('#twoptr-msg').textContent=st.msg;codeOn($('#twoptr-code'),st.line);flowOn($('#twoptr-flow'),st.f);
    $('#twoptr-c').textContent=st.c;$('#twoptr-b').textContent=brute(xs,t);$('#twoptr-w').textContent=xs.length*(xs.length-1)/2;}
  const R=new Runner(g,render);controls($('#twoptr-controls'),R,'twoptr');
  $('#twoptr-target').onchange=()=>R.reset();
  $('#twoptr-new').onclick=()=>{const s=new Set();const n=rnd(7,10);while(s.size<n)s.add(rnd(8,48)*10);xs=[...s].sort((a,b)=>a-b);R.reset();};
  $('#twoptr-reset-data').onclick=()=>{xs=ORIG.slice();$('#twoptr-target').value=500;R.reset();};
  course($('#twoptr-course'),['l12','l17']);
})();

/* ===================== SLIDING WINDOW ===================== */
(function(){
  const pl=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return `${n} ${a>10&&a<20?f[2]:(b===1?f[0]:(b>=2&&b<=4?f[1]:f[2]))}`;};
  const C=['def busiest_window(counts, k):','    window_sum = sum(counts[0:k])','    best_start, best_sum = 0, window_sum','    for end in range(k, len(counts)):','        window_sum += counts[end] - counts[end - k]','        if window_sum > best_sum:','            best_start, best_sum = end - k + 1, window_sum','    return best_start, best_sum'];
  code($('#window-code'),C);
  flow($('#window-flow'),['Сума першого вікна','+ нова година − стара','Більше за рекорд?','Запамʼятати вікно','Готово']);
  const H=[3,1,0,0,1,4,12,30,41,25,18,20,22,19,17,21,33,45,52,38,24,15,9,6];
  const hh=h=>String(h).padStart(2,'0')+':00';
  $('#window-hours').innerHTML=H.map((_,i)=>`<span>${i}</span>`).join('');
  function* g(){const k=+$('#window-k').value,n=H.length;let ws=0,ops=0,naive=0,bs=0,bsum=0;
    const S=o=>({k,ws,ops,naive,bs,bsum,...o});
    for(let i=0;i<k;i++)ws+=H[i];ops=k;naive=k;bsum=ws;
    yield S({lo:0,hi:k-1,line:1,f:0,msg:`sum(counts[0:${k}]) = ${H.slice(0,k).join(' + ')} = ${ws}`});
    yield S({lo:0,hi:k-1,line:2,f:0,msg:`Рекорд поки що: вікно ${hh(0)}–${hh(k)}, ${pl(ws,['поїздка','поїздки','поїздок'])}`});
    for(let end=k;end<n;end++){
      const inc=H[end],out=H[end-k],old=ws;ws+=inc-out;ops+=2;naive+=k;
      yield S({lo:end-k+1,hi:end,inc:end,out:end-k,line:4,f:1,msg:`Зсув: + ${inc} (${hh(end)}) − ${out} (${hh(end-k)}) → ${old} + ${inc} − ${out} = ${ws}`});
      if(ws>bsum){bs=end-k+1;bsum=ws;yield S({lo:end-k+1,hi:end,line:6,f:3,msg:`${ws} > рекорду → нове найкраще вікно ${hh(bs)}–${hh(bs+k)}`});}
    }
    yield S({lo:bs,hi:bs+k-1,best:true,line:7,f:4,msg:`Найзавантаженіші ${k} год: ${hh(bs)}–${hh(bs+k)}, ${pl(bsum,['поїздка','поїздки','поїздок'])}. Операцій: ${ops} проти ${naive} наївно${ops>=naive?' — при такому малому k ковзне вікно не виграє: два кроки на зсув замість k':''}`});
  }
  function render(st){const max=Math.max(...H);
    $('#window-bars').innerHTML=H.map((v,i)=>{let c='';if(st.best)c=(i>=st.lo&&i<=st.hi)?'pivot':'';else if(i===st.inc)c='ok';else if(i===st.out)c='dim';else if(i>=st.lo&&i<=st.hi)c='cmp';
      return `<div class="bar ${c}" style="height:${Math.max(2,v/max*100)}%"><span>${v}</span></div>`;}).join('');
    $('#window-msg').textContent=st.msg;codeOn($('#window-code'),st.line);flowOn($('#window-flow'),st.f);
    $('#window-sum').textContent=st.ws;$('#window-best').textContent=`${st.bsum} · ${hh(st.bs)}–${hh(st.bs+st.k)}`;$('#window-ops').textContent=st.ops;$('#window-naive').textContent=st.naive;}
  const R=new Runner(g,render);controls($('#window-controls'),R,'window');
  $('#window-k').oninput=e=>{$('#window-k-v').textContent=e.target.value;R.reset();};
  course($('#window-course'),['l12']);
})();

/* ===================== HASH TABLE (open addressing) ===================== */
(function(){
  const pl=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return `${n} ${a>10&&a<20?f[2]:(b===1?f[0]:(b>=2&&b<=4?f[1]:f[2]))}`;};
  const C=['DUMMY = object()          # «надгробок» на місці видаленого ключа','','class HashTable:','    def __init__(self, size=8):','        self.slots = [None] * size        # None | (key, value) | DUMMY','        self.used = 0                     # ключі + надгробки','','    def _index(self, key):                # навчальний хеш: сума кодів літер','        return sum(ord(c) for c in key) % len(self.slots)','','    def set(self, key, value):','        if (self.used + 1) / len(self.slots) > 2 / 3:','            self._resize(2 * len(self.slots))','        i, free = self._index(key), None','        while self.slots[i] is not None:','            if self.slots[i] is DUMMY:','                if free is None:','                    free = i              # запам\'ятати перший надгробок','            elif self.slots[i][0] == key:','                self.slots[i] = (key, value)   # оновити значення','                return','            i = (i + 1) % len(self.slots)      # лінійне зондування','        if free is None:','            free = i','            self.used += 1','        self.slots[free] = (key, value)','','    def get(self, key):','        i = self._index(key)','        while self.slots[i] is not None:       # DUMMY не зупиняє пошук','            if self.slots[i] is not DUMMY and self.slots[i][0] == key:','                return self.slots[i][1]','            i = (i + 1) % len(self.slots)','        raise KeyError(key)','','    def delete(self, key):','        i = self._index(key)','        while self.slots[i] is not None:','            if self.slots[i] is not DUMMY and self.slots[i][0] == key:','                self.slots[i] = DUMMY          # не None, інакше пошук обірветься','                return','            i = (i + 1) % len(self.slots)','        raise KeyError(key)','','    def _resize(self, size):','        old = [s for s in self.slots if s is not None and s is not DUMMY]','        self.slots, self.used = [None] * size, 0','        for key, value in old:','            self.set(key, value)'];
  code($('#hashtable-code'),C);
  const L=(s,from=0)=>{const i=C.findIndex((l,k)=>k>=from&&l.includes(s));if(i<0)throw new Error('line not found: '+s);return i;};
  const DS=L('def set'),DG=L('def get'),DD=L('def delete'),DR=L('def _resize');
  const LN={
    idx:L('return sum(ord'),
    sCheck:L('if (self.used + 1)'),sResize:L('self._resize(2'),sStart:L('i, free ='),sWhile:L('while self.slots[i] is not None',DS),sDummy:L('if self.slots[i] is DUMMY'),sFree:L('free = i              #'),sSame:L('elif self.slots[i][0] == key'),sUpd:L('оновити значення'),sProbe:L('лінійне зондування'),sNew:L('self.used += 1'),sWrite:L('self.slots[free] = (key, value)'),
    gStart:L('i = self._index(key)',DG),gWhile:L('while self.slots[i] is not None',DG),gIf:L('if self.slots[i] is not DUMMY',DG),gRet:L('return self.slots[i][1]'),gProbe:L('i = (i + 1)',DG),gRaise:L('raise KeyError',DG),
    dStart:L('i = self._index(key)',DD),dWhile:L('while self.slots[i] is not None',DD),dIf:L('if self.slots[i] is not DUMMY',DD),dSet:L('self.slots[i] = DUMMY'),dProbe:L('i = (i + 1)',DD),dRaise:L('raise KeyError',DD),
    rOld:L('old = [s for s'),rNew:L('self.slots, self.used ='),rFor:L('self.set(key, value)',DR)
  };
  flow($('#hashtable-flow'),['hash(key) % size','Слот порожній?','Той самий ключ?','i = (i + 1) % size','Записати / знайти / видалити']);
  const PRESETS=['set Поділ 12; set Троєщина 7; set Оболонь 9; set Печерськ 15; get Печерськ; get Позняки',
                 'set Поділ 12; set Троєщина 7; set Теремки 4; del Троєщина; get Теремки; set Позняки 6',
                 'set Поділ 12; set Оболонь 9; set Виноградар 5; set Дарниця 8; set Борщагівка 3; set Нивки 2'];
  const DUMMY={dummy:true};
  const hsum=k=>[...k].reduce((a,c)=>a+c.codePointAt(0),0);
  function parse(){return $('#hashtable-ops').value.split(/[;\n]+/).map(s=>s.trim().split(/\s+/)).filter(p=>p[0]&&p[1]).map(p=>{const op=p[0].toLowerCase();return {op:op.startsWith('d')?'del':(op.startsWith('g')?'get':'set'),key:p[1],val:p[2]!==undefined&&!isNaN(+p[2])?+p[2]:0};}).filter(o=>/^\S+$/.test(o.key)).slice(0,14);}
  const opText=o=>o.op==='set'?`set("${o.key}", ${o.val})`:(o.op==='get'?`get("${o.key}")`:`delete("${o.key}")`);
  function* run(){
    const ops=parse();let slots=new Array(8).fill(null),used=0,probes=0,oi=-1,cur=-1,home=-1,mark='';
    const S=o=>({slots:slots.slice(),used,probes,oi,ops,cur,home,mark,...o});
    yield S({line:-1,f:-1,msg:`Порожня таблиця на ${slots.length} слотів. Операцій: ${ops.length}`});
    function* index(key,line){const h=hsum(key);home=cur=h%slots.length;probes++;mark='cmp';
      yield S({line:LN.idx,f:0,msg:`hash("${key}") = сума кодів літер = ${h}; ${h} % ${slots.length} = ${home}`});}
    function* set(key,val,quiet){
      if(!quiet){const ratio=(used+1)/slots.length;
        yield S({line:LN.sCheck,f:-1,cur:-1,home:-1,msg:`(used + 1) / size = ${used+1}/${slots.length} ≈ ${ratio.toFixed(2)} ${ratio>2/3?'> 2/3 → таблицю треба розширити':'≤ 2/3 → місця досить'}`});
        if(ratio>2/3){yield S({line:LN.sResize,f:-1,cur:-1,home:-1,msg:`_resize(${2*slots.length})`});yield* resize();}}
      yield* index(key);let i=cur,free=null;
      while(slots[i]!==null){
        if(slots[i]===DUMMY){if(free===null)free=i;yield S({line:LN.sFree,f:1,cur:i,mark:'cmp',msg:`Слот ${i}: надгробок. Запам'ятовуємо його як вільне місце, але шукаємо далі — ключ може бути правіше`});}
        else if(slots[i][0]===key){slots[i]=[key,val];yield S({line:LN.sUpd,f:4,cur:i,mark:'ok',msg:`Слот ${i}: той самий ключ «${key}» → оновлюємо значення на ${val}`});return;}
        else yield S({line:LN.sSame,f:2,cur:i,mark:'bad',msg:`Слот ${i} зайнятий ключем «${slots[i][0]}» → колізія`});
        const p=i;i=(i+1)%slots.length;probes++;cur=i;
        yield S({line:LN.sProbe,f:3,cur:i,mark:'cmp',msg:`i = (${p} + 1) % ${slots.length} = ${i}${i<p?' — по колу на початок':''}`});
      }
      yield S({line:LN.sWhile,f:1,cur:i,mark:'cmp',msg:`Слот ${i} порожній (None) → ключа «${key}» у таблиці немає`});
      if(free===null){free=i;used++;}
      slots[free]=[key,val];cur=free;
      yield S({line:LN.sWrite,f:4,cur:free,mark:'ok',msg:`slots[${free}] = ("${key}", ${val})${free!==i?' — на місце надгробка, used не змінюється':''}`});
    }
    function* get(key){
      yield* index(key);let i=cur;
      while(slots[i]!==null){
        if(slots[i]!==DUMMY&&slots[i][0]===key){yield S({line:LN.gRet,f:4,cur:i,mark:'ok',msg:`Слот ${i}: «${key}» → повертаємо ${slots[i][1]}`});return;}
        yield S({line:LN.gIf,f:2,cur:i,mark:slots[i]===DUMMY?'cmp':'bad',msg:slots[i]===DUMMY?`Слот ${i}: надгробок → не зупиняємось, шукаємо далі`:`Слот ${i}: «${slots[i][0]}» ≠ «${key}» → далі`});
        const p=i;i=(i+1)%slots.length;probes++;cur=i;
        yield S({line:LN.gProbe,f:3,cur:i,mark:'cmp',msg:`i = (${p} + 1) % ${slots.length} = ${i}`});
      }
      yield S({line:LN.gRaise,f:1,cur:i,mark:'bad',msg:`Слот ${i} порожній → KeyError("${key}"): ключа немає`});
    }
    function* del(key){
      yield* index(key);let i=cur;
      while(slots[i]!==null){
        if(slots[i]!==DUMMY&&slots[i][0]===key){slots[i]=DUMMY;yield S({line:LN.dSet,f:4,cur:i,mark:'bad',msg:`Слот ${i}: «${key}» → ставимо DUMMY, а не None: ключі, що зсунулись далі через колізію, мають лишитися досяжними`});return;}
        yield S({line:LN.dIf,f:2,cur:i,mark:slots[i]===DUMMY?'cmp':'bad',msg:slots[i]===DUMMY?`Слот ${i}: надгробок → далі`:`Слот ${i}: «${slots[i][0]}» ≠ «${key}» → далі`});
        const p=i;i=(i+1)%slots.length;probes++;cur=i;
        yield S({line:LN.dProbe,f:3,cur:i,mark:'cmp',msg:`i = (${p} + 1) % ${slots.length} = ${i}`});
      }
      yield S({line:LN.dRaise,f:1,cur:i,mark:'bad',msg:`Слот ${i} порожній → KeyError("${key}")`});
    }
    function* resize(){
      const old=slots.filter(s=>s!==null&&s!==DUMMY);
      yield S({line:LN.rOld,f:-1,cur:-1,home:-1,msg:`old = ${old.map(s=>s[0]).join(', ')} — ${old.length} ключів (надгробки не переносяться)`});
      slots=new Array(slots.length*2).fill(null);used=0;
      yield S({line:LN.rNew,f:-1,cur:-1,home:-1,msg:`Нова таблиця на ${slots.length} слотів: індекси рахуються заново, бо змінився дільник`});
      for(const [k,v] of old){yield S({line:LN.rFor,f:-1,cur:-1,home:-1,msg:`Переносимо «${k}»: hash % ${slots.length}`});yield* set(k,v,true);}
    }
    for(oi=0;oi<ops.length;oi++){const o=ops[oi];cur=home=-1;
      yield S({line:o.op==='set'?DS:(o.op==='get'?DG:DD),f:-1,msg:`Операція ${oi+1}: ${opText(o)}`});
      if(o.op==='set')yield* set(o.key,o.val);else if(o.op==='get')yield* get(o.key);else yield* del(o.key);}
    oi=ops.length;cur=home=-1;
    yield S({line:-1,f:-1,msg:`Готово. Переглянуто слотів: ${probes} за ${pl(ops.length,['операцію','операції','операцій'])} — у середньому ${(probes/Math.max(1,ops.length)).toFixed(1)}`});
  }
  function render(st){
    $('#hashtable-slots').innerHTML=st.slots.map((s,i)=>{let cls=s===null?'none':(s===DUMMY?'dummy':'');if(i===st.cur&&st.mark)cls+=' '+st.mark;
      const k=s===null?'None':(s===DUMMY?'DUMMY':`("${esc(s[0])}", ${s[1]})`);
      const t=[i===st.home?'hash → тут':'',i===st.cur&&i!==st.home?'i':''].filter(Boolean).join(' · ');
      return `<div class="ht-row ${cls}"><span class="i">${i}</span><span class="k">${k}</span><span class="t">${t}</span></div>`;}).join('');
    chips($('#hashtable-opsline'),'Операції:',st.ops.map(opText),{hot:st.oi<st.ops.length?st.oi:-1,ok:st.ops.map((_,i)=>i).filter(i=>i<st.oi),empty:'немає'});
    $('#hashtable-msg').textContent=st.msg;codeOn($('#hashtable-code'),st.line);flowOn($('#hashtable-flow'),st.f);
    $('#hashtable-size').textContent=st.slots.length;$('#hashtable-used').textContent=st.used;$('#hashtable-load').textContent=(st.used/st.slots.length).toFixed(2);$('#hashtable-probes').textContent=st.probes;}
  $('#hashtable-ops').value=PRESETS[0];
  const R=new Runner(run,render);controls($('#hashtable-controls'),R,'hashtable');
  $('#hashtable-preset').onchange=e=>{$('#hashtable-ops').value=PRESETS[+e.target.value];R.reset();};
  $('#hashtable-ops').onchange=()=>R.reset();
  course($('#hashtable-course'),['l17','b_search']);
})();

/* ===================== TWO SUM (dict) ===================== */
(function(){
  const pl=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return `${n} ${a>10&&a<20?f[2]:(b===1?f[0]:(b>=2&&b<=4?f[1]:f[2]))}`;};
  const C=['def pair_with_sum_hash(prices, target):','    seen = {}                          # ціна → індекс','    for i, price in enumerate(prices):','        need = target - price','        if need in seen:               # O(1) у середньому','            return seen[need], i','        seen[price] = i','    return None'];
  code($('#twosum-code'),C);
  flow($('#twosum-flow'),['Взяти ціну','need = ціль − ціна','need у seen?','Записати seen[ціна] = i','Готово']);
  const ORIG=[230,410,120,270,150,320,180];let xs=ORIG.slice();
  const brute=(a,t)=>{let s=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){s++;if(a[i]+a[j]===t)return s;}return s;};
  function* g(){const t=+$('#twosum-target').value||0;const seen=new Map();let c=0;
    const S=o=>({seen:[...seen],c,...o});
    yield S({i:-1,line:1,f:-1,msg:'seen = {} — словник «ціна → індекс» порожній'});
    for(let i=0;i<xs.length;i++){const p=xs[i];c++;
      yield S({i,line:2,f:0,msg:`i = ${i}, price = ${p}`});
      const need=t-p;yield S({i,line:3,f:1,need,msg:`need = ${t} − ${p} = ${need}`});
      if(seen.has(need)){const j=seen.get(need);yield S({i,j,need,line:4,f:2,hit:need,msg:`${need} in seen? так — це поїздка ${j}`});
        yield S({i,j,found:true,hit:need,line:5,f:4,msg:`Пара: індекси (${j}, ${i}) → ${need} + ${p} = ${t}. Переглянуто ${pl(c,['ціну','ціни','цін'])}`});return;}
      yield S({i,need,line:4,f:2,msg:`${need} in seen? ні`});
      if(!seen.has(p))seen.set(p,i);yield S({i,line:6,f:3,added:p,msg:`seen[${p}] = ${i}`});
    }
    yield S({i:-1,line:7,f:4,none:true,msg:`Пари з сумою ${t} немає. Переглянуто ${pl(c,['ціну','ціни','цін'])} — кожну один раз`});
  }
  function render(st){const t=+$('#twosum-target').value||0;
    $('#twosum-cells').innerHTML=xs.map((v,i)=>{let c='';if(st.found&&(i===st.i||i===st.j))c='ok';else if(i===st.i)c='cmp';else if(st.i>=0&&i<st.i)c='seen';else if(st.none)c='seen';
      return `<div class="cell ${c}"><span class="idx">${i}</span>${v}${i===st.i?'<span class="tag">price</span>':''}</div>`;}).join('');
    const keys=st.seen.map(([k,v])=>`${k} → ${v}`);
    chips($('#twosum-seen'),'seen:',keys,{hot:st.seen.findIndex(([k])=>k===st.hit),swap:st.seen.findIndex(([k])=>k===st.added),empty:'{}'});
    $('#twosum-msg').textContent=st.msg;codeOn($('#twosum-code'),st.line);flowOn($('#twosum-flow'),st.f);
    $('#twosum-c').textContent=st.c;$('#twosum-b').textContent=brute(xs,t);$('#twosum-n').textContent=st.seen.length;}
  const R=new Runner(g,render);controls($('#twosum-controls'),R,'twosum');
  $('#twosum-target').onchange=()=>R.reset();
  $('#twosum-shuffle').onclick=()=>{xs=shuffle(xs);R.reset();};
  $('#twosum-orig').onclick=()=>{xs=ORIG.slice();$('#twosum-target').value=500;R.reset();};
  course($('#twosum-course'),['l17']);
})();

/* ===================== ANAGRAMS: canonical key ===================== */
(function(){
  const pl=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return `${n} ${a>10&&a<20?f[2]:(b===1?f[0]:(b>=2&&b<=4?f[1]:f[2]))}`;};
  const C=['def group_anagrams(words):','    groups = {}','    for word in words:','        key = "".join(sorted(word.lower()))    # канонічний ключ','        groups.setdefault(key, []).append(word)','    return list(groups.values())'];
  code($('#anagram-code'),C);
  code($('#anagram-code2'),['from collections import Counter','','def route_key(trip):','    return tuple(sorted((trip.start, trip.end)))','','# Поділ → Оболонь і Оболонь → Поділ — один ключ','routes = Counter(route_key(trip) for trip in trips)']);
  flow($('#anagram-flow'),['Взяти слово','Ключ = відсортовані літери','Є така група?','Додати слово в групу','Готово']);
  const keyOf=w=>[...w.toLowerCase()].sort().join('');
  function* g(){const words=$('#anagram-words').value.split(/[\s,;]+/).filter(Boolean).slice(0,16);const groups=new Map();let c=0;
    const S=o=>({words,groups:[...groups].map(([k,v])=>[k,v.slice()]),c,...o});
    yield S({wi:-1,line:1,f:-1,msg:'groups = {} — словник «ключ → список слів»'});
    for(let wi=0;wi<words.length;wi++){const w=words[wi];
      yield S({wi,line:2,f:0,msg:`word = "${w}"`});
      const k=keyOf(w);yield S({wi,key:k,line:3,f:1,msg:`sorted("${w.toLowerCase()}") → ${[...k].join(', ')} → key = "${k}"`});
      const isNew=!groups.has(k);
      yield S({wi,key:k,line:4,f:2,hot:isNew?undefined:k,msg:isNew?`Ключа "${k}" ще немає → setdefault створює порожній список`:`Ключ "${k}" уже є: група ${JSON.stringify(groups.get(k))}`});
      if(isNew)groups.set(k,[]);groups.get(k).push(w);c++;
      yield S({wi,key:k,line:4,f:3,hot:k,fresh:isNew,msg:`groups["${k}"] = ${JSON.stringify(groups.get(k))}`});
    }
    yield S({wi:words.length,line:5,f:4,msg:`Груп: ${groups.size}. Кожне слово оброблено один раз, жодного попарного порівняння`});
  }
  function render(st){
    chips($('#anagram-wordsline'),'Слова:',st.words,{hot:st.wi,ok:st.words.map((_,i)=>i).filter(i=>i<st.wi),empty:'немає'});
    if(st.key!==undefined){const w=st.words[st.wi].toLowerCase();chips($('#anagram-key'),`"${esc(w)}" → ключ:`,[...st.key],{hot:[...st.key].map((_,i)=>i)});}
    else chips($('#anagram-key'),'Ключ:',[],{empty:'—'});
    $('#anagram-groups').innerHTML='<tr><th>Ключ</th><th>Слова в групі</th></tr>'+(st.groups.length?st.groups.map(([k,v])=>`<tr class="${k===st.hot?(st.fresh?'new hot':'hot'):''}"><td class="key">"${esc(k)}"</td><td>${v.map(esc).join(', ')}</td></tr>`).join(''):'<tr><td colspan="2" style="color:var(--muted)">порожньо</td></tr>');
    $('#anagram-msg').textContent=st.msg;codeOn($('#anagram-code'),st.line);flowOn($('#anagram-flow'),st.f);
    const n=st.words.length;$('#anagram-c').textContent=st.c;$('#anagram-g').textContent=st.groups.length;$('#anagram-p').textContent=n*(n-1)/2;}
  const R=new Runner(g,render);controls($('#anagram-controls'),R,'anagram');
  $('#anagram-words').onchange=()=>R.reset();
  course($('#anagram-course'),['l17']);
})();
