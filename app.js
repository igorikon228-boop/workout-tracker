const KEY='four-weeks-strength-v10';
let state=JSON.parse(localStorage.getItem(KEY)||'{}');
state.done=state.done||{};state.notes=state.notes||{};state.session=state.session||null;
let selectedWeek=1,currentView='today',workouts=[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const fmt=d=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'));
const isoLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round5=n=>Math.max(5,Math.round(n/5)*5);
const dayNames=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const extraPool=[
 ['Выпады',3,'10/нога'],['Ягодичный мостик',3,'15'],['Ягодичный мостик',3,'10/сторона'],['Супермен',3,'12'],
 ['Обратные выпады',3,'10/нога'],['Скручивания',3,'15'],['Боковая планка',2,'25 сек/сторона'],['Подъёмы на носки',3,'18'],
 ['Мёртвый жук',3,'10/сторона'],['Кобра',3,'25 сек'],['Подъёмы на носки',3,'18'],['Подъёмы на носки',2,'15']
];
function extraFor(day,week){if(day%7===6)return 'Восстановление · лёгкая мобильность 8–10 мин';let e=extraPool[(day+week*2)%extraPool.length];let bump=week>=3&&/^(\d+)$/.test(e[2])?String(+e[2]+3):e[2];return `${e[0]} ${e[1]}×${bump}`}
function repSpec(max,week,type){
 const patterns={push:[[4,.42],[4,.46],[5,.48],[3,.38],[5,.52],[3,.44]],squat:[[3,.42],[4,.38],[3,.48],[2,.34],[4,.46],[3,.52]]};
 const [sets,base]=patterns[type][week.day];const factor=base+[0,.035,.07,.10][week.w-1];return `${sets}×${Math.max(type==='push'?2:8,Math.round(max*factor))}`;
}
function plankSpec(max,week){const p=[[3,.60],[3,.66],[4,.58],[2,.52],[3,.72],[1,.88]][week.day];return `${p[0]}×${Math.max(15,round5(max*(p[1]+[0,.05,.10,.15][week.w-1])))} сек`}
function generatePlan(base,start){
 const plan=[];
 for(let i=0;i<28;i++){
   const w=Math.floor(i/7)+1,d=i%7,date=addDays(start,i),ctx={w,day:d};
   if(i===27){plan.push({id:i+1,week:w,date,day:'День 28 · ТЕСТ',push:`1×макс. → ${Math.round(base.push*1.5)}`,squat:`1×макс. → ${Math.round(base.squat*1.5)}`,plank:`1×макс. → ${fmtTime(Math.round(base.plank*1.5))}`,extra:'Итоговый контроль'});continue}
   if(d===6){plan.push({id:i+1,week:w,date,day:dayNames[d],push:'—',squat:`2×${Math.max(10,Math.round(base.squat*.25))}`,plank:'—',extra:extraFor(i,w)});continue}
   let push=repSpec(base.push,ctx,'push'),squat=repSpec(base.squat,ctx,'squat'),plank=plankSpec(base.plank,ctx);
   if(w===4&&d===5){push='—';squat='—';plank='—'}
   if(w===4&&d===4){push=`2×${Math.max(2,Math.round(base.push*.30))}`;squat=`2×${Math.max(8,Math.round(base.squat*.25))}`;plank=`1×${Math.max(15,round5(base.plank*.45))} сек`}
   plan.push({id:i+1,week:w,date,day:dayNames[d],push,squat,plank,extra:w===4&&d===5?'Лёгкая растяжка всего тела 10 мин':extraFor(i,w)});
 }
 return plan;
}
function hydratePlan(){workouts=state.profile?generatePlan(state.profile,state.startDate):[]}
function fmtTime(sec){sec=Math.max(0,Number(sec)||0);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function onboarding(){return `<section class="onboarding"><p class="eyebrow">Персональная программа</p><h2>Сначала замерим твой максимум</h2><p class="onboarding-lead">Выполни по одному контрольному подходу в комфортных условиях. Введи максимальное количество качественных повторений и время планки. На их основе приложение построит программу на 4 недели с ориентиром примерно <strong>×1,5</strong>.</p><form id="baselineForm" class="baseline-form"><label><span>Отжимания</span><input name="push" type="number" min="1" max="300" required placeholder="например, 18"><small>максимум повторений</small></label><label><span>Приседания</span><input name="squat" type="number" min="1" max="500" required placeholder="например, 60"><small>максимум повторений</small></label><label><span>Планка</span><div class="time-input"><input name="plankMin" type="number" min="0" max="20" value="0" required><b>мин</b><input name="plankSec" type="number" min="0" max="59" placeholder="40" required><b>сек</b></div><small>максимальное удержание</small></label><button class="check-btn" type="submit">Составить мой план</button></form></section>`}
function renderOnboarding(){document.querySelector('.main-nav').classList.add('hidden');document.querySelector('.progress-card').classList.add('hidden');document.querySelector('#todayView').classList.remove('hidden');document.querySelector('#planView').classList.add('hidden');document.querySelector('#goalsView').classList.add('hidden');document.querySelector('#todayStatus').innerHTML='';document.querySelector('#todayWorkout').innerHTML=onboarding();document.querySelector('#baselineForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.currentTarget),push=+f.get('push'),squat=+f.get('squat'),plank=+f.get('plankMin')*60+(+f.get('plankSec'));if(plank<10)return alert('Для планки укажи время не меньше 10 секунд.');state={profile:{push,squat,plank},startDate:isoLocal(),done:{},notes:{},session:null};save();hydratePlan();render()}}
function card(w,big=false){return `<article class="workout ${big?'featured':''} ${state.done[w.id]?'done':''}"><div class="workout-top"><div><p class="date">${fmt(w.date)} · Неделя ${w.week}</p><h3>${w.day}${w.day.includes('ТЕСТ')?'':' <span class="badge">20–30 мин</span>'}</h3></div>${!big?`<button class="complete" data-id="${w.id}">${state.done[w.id]?'✓ Выполнено':'Выполнить'}</button>`:''}</div><div class="exercise-grid"><div class="exercise"><span>Отжимания</span><strong>${w.push}</strong></div><div class="exercise"><span>Приседания</span><strong>${w.squat}</strong></div><div class="exercise"><span>Планка</span><strong>${w.plank}</strong></div><div class="exercise"><span>Дополнительно</span><strong>${w.extra}</strong></div></div>${big&&!state.done[w.id]?`<button class="start-workout" data-start="${w.id}">▶ Начать тренировку</button>`:''}${big&&state.done[w.id]?`<button class="complete primary-complete" data-id="${w.id}">✓ Тренировка выполнена</button>`:''}</article>`}
function showCompletion(){const c=state.lastCompletion;if(!c)return;let mins=Math.floor(c.duration/60),secs=c.duration%60,pct=Math.round(c.programDone/c.programTotal*100),overlay=document.querySelector('#completionOverlay');if(!overlay){overlay=document.createElement('div');overlay.id='completionOverlay';overlay.className='completion-overlay';document.body.appendChild(overlay)}overlay.innerHTML=`<div class="completion-card"><div class="completion-mark">✓</div><p class="eyebrow">Тренировка завершена</p><h2>Отличная работа!</h2><p class="completion-sub">Ещё один день программы выполнен.</p><div class="completion-stats"><article><span>Время</span><strong>${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</strong></article><article><span>Подходы</span><strong>${c.sets}</strong></article><article><span>Программа</span><strong>${pct}%</strong></article></div><div class="completion-progress"><i style="width:${pct}%"></i></div><small>${c.programDone} из ${c.programTotal} дней отмечено выполненными</small><button class="check-btn" id="closeCompletion">Готово</button></div>`;requestAnimationFrame(()=>overlay.classList.add('show'));document.querySelector('#closeCompletion').onclick=()=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),220)}}
function renderToday(){const today=isoLocal(),first=workouts[0],last=workouts.at(-1);let w=workouts.find(x=>x.date===today),msg='';if(today<first.date){w=first;msg=`План стартует ${fmt(first.date)}.`}else if(today>last.date){w=last;msg='Четырёхнедельный план завершён. Ниже — итоговый тест.'}else if(!w){w=workouts.find(x=>x.date>today)||last;msg=`Ближайшая тренировка — ${fmt(w.date)}.`}else msg=state.done[w.id]?'Сегодняшняя тренировка уже отмечена.':'Персональная тренировка на сегодня готова.';document.querySelector('#todayStatus').innerHTML=`<span class="status-dot"></span><div><strong>${today===w.date?'Сегодня':'Ближайшая тренировка'}</strong><p>${msg}</p></div>`;document.querySelector('#todayWorkout').innerHTML=state.session&&state.session.id===w.id?sessionHTML(w):card(w,true)}
function renderGoals(){const b=state.profile,t={push:Math.round(b.push*1.5),squat:Math.round(b.squat*1.5),plank:Math.round(b.plank*1.5)};document.querySelector('#goalsView').innerHTML=`<section class="goals-page"><p class="eyebrow">Персональные ориентиры</p><h2>Цель ×1,5</h2><p class="goals-lead">Целевые максимумы рассчитаны от стартового теста. Рабочая нагрузка в плане ниже максимума и растёт постепенно.</p><div class="goal-grid"><article class="goal-card"><span>Отжимания</span><strong>${t.push}</strong><small>Старт: ${b.push} повторений</small><div class="goal-line"><i style="width:66.7%"></i></div></article><article class="goal-card"><span>Приседания</span><strong>${t.squat}</strong><small>Старт: ${b.squat} повторений</small><div class="goal-line"><i style="width:66.7%"></i></div></article><article class="goal-card"><span>Планка</span><strong>${fmtTime(t.plank)}</strong><small>Старт: ${fmtTime(b.plank)}</small><div class="goal-line"><i style="width:66.7%"></i></div></article></div><p>В последний день повтори стартовый тест и запиши фактические максимумы.</p></div></section>`}
function bind(){document.querySelectorAll('.complete').forEach(b=>b.onclick=()=>{let id=b.dataset.id;state.done[id]=!state.done[id];save();render()});document.querySelectorAll('.notes').forEach(n=>n.oninput=()=>{state.notes[n.dataset.note]=n.value;save()});document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{selectedWeek=+b.dataset.week;render()});document.querySelectorAll('[data-start]').forEach(e=>e.onclick=()=>startSession(+e.dataset.start));document.querySelectorAll('[data-session-action]').forEach(e=>e.onclick=sessionAction);document.querySelectorAll('.main-tab').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;render()})}
function render(){if(!state.profile){renderOnboarding();return}hydratePlan();document.querySelector('.main-nav').classList.remove('hidden');document.querySelector('.progress-card').classList.remove('hidden');document.querySelector('.hero .eyebrow').textContent=`${fmt(workouts[0].date)} — ${fmt(workouts.at(-1).date)}`;const doneCount=workouts.filter(w=>state.done[w.id]).length,pct=Math.round(doneCount/workouts.length*100);document.querySelector('#progressText').textContent=`${doneCount} / ${workouts.length}`;document.querySelector('#progressBar').style.width=pct+'%';document.querySelector('#progressPercent').textContent=`${pct}% плана выполнено`;document.querySelector('#todayView').classList.toggle('hidden',currentView!=='today');document.querySelector('#planView').classList.toggle('hidden',currentView!=='plan');document.querySelector('#goalsView').classList.toggle('hidden',currentView!=='goals');document.querySelectorAll('.main-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView));renderToday();renderGoals();document.querySelector('#weekTabs').innerHTML=[1,2,3,4].map(w=>`<button class="tab ${selectedWeek===w?'active':''}" data-week="${w}">Неделя ${w}</button>`).join('');const week=workouts.filter(w=>w.week===selectedWeek),weekDone=week.filter(w=>state.done[w.id]).length;document.querySelector('#weekSummary').innerHTML=`<span>Неделя ${selectedWeek}: ${fmt(week[0].date)} — ${fmt(week.at(-1).date)}</span><strong>${weekDone} / 7 выполнено</strong>`;document.querySelector('#workouts').innerHTML=week.map(w=>card(w)).join('');bind()}
document.querySelector('#resetBtn').onclick=()=>{if(confirm('Сбросить персональную программу, результаты и пройти стартовый тест заново?')){localStorage.removeItem(KEY);state={done:{},notes:{},session:null};workouts=[];currentView='today';render()}};
function parseSpec(name,spec){if(!spec||spec==='—')return[];let m=spec.match(/(\d+)×(.+)/);if(!m)return[{name,target:spec,rest:60}];let n=+m[1],target=m[2].trim();return Array.from({length:n},(_,i)=>({name,target:`${target} · подход ${i+1}/${n}`,rest:60}))}
function extraParts(extra){const m=extra.match(/^(.+?)\s+(\d+×.+)$/);return m?{name:m[1].trim(),spec:m[2].trim()}:{name:extra,spec:extra}}
function stepsFor(w){const ex=extraParts(w.extra),groups=[parseSpec('Отжимания',w.push),parseSpec('Приседания',w.squat),parseSpec('Планка',w.plank),parseSpec(ex.name,ex.spec)].filter(g=>g.length),steps=[],max=Math.max(0,...groups.map(g=>g.length));for(let round=0;round<max;round++)groups.forEach(g=>{if(g[round])steps.push({...g[round],round:round+1,rest:35})});return steps.map((s,i)=>({...s,next:i<steps.length-1?steps[i+1].name:null}))}
function startSession(id){state.session={id,index:0,phase:'ready',remaining:0,startedAt:Date.now(),completedSets:0};save();render()}
function timedSeconds(step){if(!step)return 0;const m=String(step.target||'').match(/(\d+)(?:[–-](\d+))?\s*сек/);return m?Number(m[2]||m[1]):0}
function sessionHTML(w){let s=state.session,steps=stepsFor(w);if(!steps.length)return card(w,true);let st=steps[Math.min(s.index,steps.length-1)],pct=Math.round(s.index/steps.length*100),maxRound=Math.max(...steps.map(x=>x.round||1)),countdown=['rest','prepare','exercise'].includes(s.phase);if(countdown)setTimeout(tickRest,1000);let total=s.phase==='prepare'?5:s.phase==='exercise'?timedSeconds(st):35,timerPct=countdown?Math.max(0,Math.min(1,s.remaining/Math.max(1,total))):1,circ=289,timed=timedSeconds(st)>0,label=s.phase==='prepare'?'Займите правильное положение':s.phase==='exercise'?'Выполняйте упражнение':'Переход к следующему упражнению';return `<section class="session"><div class="session-head"><span>Круг ${st.round||1} из ${maxRound} · шаг ${Math.min(s.index+1,steps.length)} из ${steps.length}</span></div><div class="session-progress"><div style="width:${pct}%"></div></div>${countdown?`<div class="rest ${s.phase}"><p class="rest-label">${label}</p><div class="timer-ring"><svg viewBox="0 0 104 104"><circle class="ring-bg" cx="52" cy="52" r="46"/><circle class="ring-fg" cx="52" cy="52" r="46" style="stroke-dasharray:${circ};stroke-dashoffset:${circ*(1-timerPct)}"/></svg><div class="timer-small">${fmtTime(s.remaining)}</div></div>${s.phase==='rest'?`<div class="up-next"><span>Следом</span><strong>${st.name}</strong><small>${st.target}</small></div>`:`<div class="timed-caption">${s.phase==='prepare'?'После 5 секунд подготовки рабочий таймер запустится автоматически.':`Время подхода: ${fmtTime(timedSeconds(st))}`}</div>`}<button class="secondary wide" data-session-action="skip">${s.phase==='prepare'?'Пропустить подготовку':s.phase==='exercise'?'Завершить раньше':'Пропустить отдых'}</button></div>`:`<div class="active-step"><div class="round-chip">КРУГ ${st.round||1}</div><h2>${st.name}</h2><div class="target">${st.target}</div><p>${s.phase==='ready'?(timed?'После «Приступить» начнётся 00:05 на подготовку, затем рабочий таймер.':'Следующее упражнение готово.'):'Выполни подход и отметь его.'}</p>${st.next&&s.phase==='active'?`<div class="next-hint">Дальше: <strong>${st.next}</strong></div>`:''}<button class="check-btn" data-session-action="${s.phase==='ready'?'go':'done'}">${s.phase==='ready'?'▶ Приступить':'✓ Готово'}</button></div>`}<div class="session-actions"><button class="secondary" data-session-action="exit">Выйти из режима</button></div></section>`}
function advanceSession(w,steps){let s=state.session;s.completedSets=(s.completedSets||0)+1;s.index++;if(s.index>=steps.length){state.done[w.id]=true;const doneCount=Object.values(state.done||{}).filter(Boolean).length;state.lastCompletion={id:w.id,duration:Math.max(1,Math.round((Date.now()-(s.startedAt||Date.now()))/1000)),sets:s.completedSets,total:steps.length,programDone:doneCount,programTotal:workouts.length,at:Date.now()};state.session=null;save();render();showCompletion();return true}s.phase='rest';s.remaining=35;return false}
function sessionAction(e){let a=e.currentTarget.dataset.sessionAction,s=state.session;if(!s)return;let w=workouts.find(x=>x.id===s.id),steps=stepsFor(w),st=steps[Math.min(s.index,steps.length-1)];if(a==='go'){if(timedSeconds(st)){s.phase='prepare';s.remaining=5}else s.phase='active'}if(a==='done'&&advanceSession(w,steps))return;if(a==='skip'){if(s.phase==='prepare'){s.phase='exercise';s.remaining=timedSeconds(st)}else if(s.phase==='exercise'){if(advanceSession(w,steps))return}else{s.phase='ready';s.remaining=0}}if(a==='exit')state.session=null;save();render()}
function tickRest(){let s=state.session;if(!s||!['rest','prepare','exercise'].includes(s.phase))return;if(s.remaining>0){s.remaining--;save();render();return}let w=workouts.find(x=>x.id===s.id),steps=stepsFor(w),st=steps[Math.min(s.index,steps.length-1)];if(s.phase==='prepare'){s.phase='exercise';s.remaining=timedSeconds(st)}else if(s.phase==='exercise'){if(advanceSession(w,steps))return}else s.phase='ready';save();render()}
render();


function v12WelcomeSync(){
 const w=document.getElementById('welcomeV12'); if(!w)return;
 const hasPlan=(typeof workouts!=='undefined'&&workouts&&workouts.length>0);
 w.classList.toggle('hidden',hasPlan);
 document.body.classList.toggle('onboarding-open',!hasPlan);
}
document.addEventListener('click',e=>{if(e.target?.id==='welcomeStart'){document.getElementById('welcomeV12')?.classList.add('hidden');document.body.classList.remove('onboarding-open');let first=document.querySelector('input');if(first)first.scrollIntoView({behavior:'smooth',block:'center'});}});
setTimeout(v12WelcomeSync,0);




// v17 — single plan list + achievements
(function(){
 const ACH=[
  {id:'measure',title:'Замер',desc:'Провести первый стартовый замер',img:'achievement-measure.jpg',goal:1},
  {id:'steady',title:'Планомерно',desc:'Завершить первую тренировку',img:'achievement-steady.jpg',goal:1},
  {id:'squats500',title:'Давид и Ч.',desc:'Выполнить 500 приседаний',img:'achievement-squats.jpg',goal:500},
  {id:'pushups100',title:'Мастер Отжиманий',desc:'Выполнить 100 отжиманий',img:'achievement-pushups.jpg',goal:100}
 ];
 const AKEY='four-weeks-strength-achievements-v17';

 function stateObj(){
   try{return typeof state!=='undefined'&&state?state:JSON.parse(localStorage.getItem('four-weeks-strength-v10')||'{}')}catch(e){return{}}
 }
 function loadA(){try{return JSON.parse(localStorage.getItem(AKEY)||'{}')}catch(e){return{}}}
 function saveA(a){localStorage.setItem(AKEY,JSON.stringify(a))}
 function num(v){const n=parseInt(String(v??'').match(/\d+/)?.[0]||0,10);return Number.isFinite(n)?n:0}
 function inferCompleted(){
   const s=stateObj(), done=s.completed||s.done||s.completedDays||{};
   if(Array.isArray(done)) return done.length;
   if(done&&typeof done==='object') return Object.values(done).filter(Boolean).length;
   return num(s.completedCount||0);
 }
 function inferTotals(){
   const a=loadA(), s=stateObj();
   // Prefer explicit v17 counters. Fallback derives completed prescribed work from plan/state if available.
   let push=num(a.pushups), squat=num(a.squats);
   if((!push&&!squat)&&Array.isArray(s.history)){
     for(const h of s.history){
       if(!h||h.completed===false)continue;
       push+=num(h.pushups||h.push||0); squat+=num(h.squats||h.squat||0);
     }
   }
   return {push,squat};
 }
 function progress(){
   const s=stateObj(), a=loadA(), t=inferTotals();
   const measured=!!(s.profile&&num(s.profile.push)>0&&num(s.profile.squat)>0&&num(s.profile.plank)>0);
   const completed=Math.max(num(a.workouts),inferCompleted());
   return {measure:measured?1:0,steady:completed>0?1:0,squats500:Math.min(500,t.squat),pushups100:Math.min(100,t.push)};
 }
 function renderAchievements(){
   const grid=document.getElementById('achievementsGrid'); if(!grid)return;
   const p=progress();
   grid.innerHTML=ACH.map(x=>{
     const value=p[x.id]||0, pct=Math.min(100,Math.round(value/x.goal*100)), unlocked=value>=x.goal;
     return `<article class="achievement-card ${unlocked?'unlocked':'locked'}">
       <div class="achievement-art"><img src="${x.img}" alt="${x.title}"><span class="achievement-state">${unlocked?'✓ Получено':'🔒'}</span></div>
       <div class="achievement-copy"><h3>${x.title}</h3><p>${x.desc}</p>
       <div class="achievement-progress"><div style="width:${pct}%"></div></div>
       <div class="achievement-numbers"><b>${value} / ${x.goal}</b><span>${pct}%</span></div></div>
     </article>`;
   }).join('');
 }
 function showAchievements(){
   document.querySelectorAll('.view,.page,.tab-content').forEach(v=>{
     if(v.id==='achievementsView')v.classList.remove('hidden','active');
     else if(v.id)v.classList.add('hidden');
   });
   document.getElementById('achievementsView')?.classList.remove('hidden');
   document.querySelectorAll('.main-nav button,.tabs button').forEach(b=>b.classList.toggle('active',b.hasAttribute('data-v17-achievements')));
   renderAchievements(); window.scrollTo({top:0,behavior:'smooth'});
 }
 document.addEventListener('click',e=>{
   const b=e.target.closest('[data-v17-achievements]'); if(b){e.preventDefault();showAchievements();return}
   // any normal primary tab hides achievements and remains reachable
   const normal=e.target.closest('.main-nav button:not([data-v17-achievements]),.tabs button:not([data-v17-achievements])');
   if(normal)document.getElementById('achievementsView')?.classList.add('hidden');
 });

 // Flatten plan: hide week selectors and force every generated day card visible.
 function flattenPlan(){
   document.querySelectorAll('.week-tabs,.weeks-tabs,.week-selector,[data-week-tab]').forEach(x=>x.style.display='none');
   document.querySelectorAll('[data-week],.week-panel,.week-content').forEach(x=>{
     if(!x.closest('.week-tabs,.weeks-tabs,.week-selector')){x.style.display='';x.classList.remove('hidden')}
   });
 }
 new MutationObserver(()=>{flattenPlan();renderAchievements()}).observe(document.body,{childList:true,subtree:true});
 setTimeout(()=>{flattenPlan();renderAchievements()},0);

 // Count real completed prescribed reps when the app marks a workout complete.
 // We hook completion clicks and use the active workout's visible prescribed values as a conservative fallback.
 document.addEventListener('click',e=>{
   const txt=(e.target.closest('button')?.textContent||'').toLowerCase();
   if(!/(завершить|закончить|готово|тренировка выполнена)/.test(txt))return;
   setTimeout(()=>{
     const a=loadA(); const completed=inferCompleted();
     a.workouts=Math.max(num(a.workouts),completed);
     // Capture counters exposed by workout DOM/state when available.
     const s=stateObj(), h=Array.isArray(s.history)?s.history:[];
     let pp=0,ss=0;
     for(const x of h){if(x&&x.completed!==false){pp+=num(x.pushups||x.push||0);ss+=num(x.squats||x.squat||0)}}
     if(pp||ss){a.pushups=Math.max(num(a.pushups),pp);a.squats=Math.max(num(a.squats),ss)}
     saveA(a);renderAchievements();
   },150);
 },true);
 window.v17Achievements={render:renderAchievements,load:loadA,save:saveA};
})();
