/* ================= NAVIGATION (two levels: chapter → algorithm) ================= */
(function(){
  const secById={};document.querySelectorAll('section.lesson').forEach(s=>secById[s.id]=s);
  const chapters=CHAPTERS.map(([id,title,ids])=>[id,title,ids.filter(x=>secById[x])]).filter(c=>c[2].length);
  const order=chapters.flatMap(c=>c[2]);const chapterOf={};chapters.forEach(c=>c[2].forEach(x=>chapterOf[x]=c));
  const top=$('#tabbar'),sub=$('#subbar');
  chapters.forEach(c=>{const b=document.createElement('button');b.textContent=c[1];b.dataset.ch=c[0];b.setAttribute('role','tab');b.onclick=()=>show(c[2][0],true);top.appendChild(b);});
  order.forEach((id,i)=>{const s=secById[id];const p=document.createElement('div');p.className='pager';
    const prev=order[i-1],next=order[i+1];
    p.innerHTML=(prev?`<button class="btn" data-go="${prev}">← ${esc(secById[prev].dataset.title)}</button>`:'<span></span>')+(next?`<button class="btn" data-go="${next}">${esc(secById[next].dataset.title)} →</button>`:'<span></span>');
    s.appendChild(p);});
  document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){e.preventDefault();show(g.dataset.go,true);}});
  function show(id,push){if(!chapterOf[id])id=order[0];const ch=chapterOf[id];
    RUNNERS.forEach(r=>r.pause());
    Object.values(secById).forEach(s=>s.classList.toggle('active',s.id===id));
    [...top.children].forEach(b=>b.setAttribute('aria-selected',b.dataset.ch===ch[0]));
    sub.innerHTML='';ch[2].forEach(x=>{const b=document.createElement('button');b.textContent=secById[x].dataset.title;b.setAttribute('aria-selected',x===id);b.onclick=()=>show(x,true);sub.appendChild(b);});
    sub.hidden=ch[2].length<2;
    if(push){try{history.replaceState(null,'','#'+id);}catch(e){}}window.scrollTo({top:0});}
  window.addEventListener('hashchange',()=>show(location.hash.slice(1),false));
  window.showSection=show;
  show((location.hash||'#'+order[0]).slice(1),false);
})();
