import {SaveStore} from './storage.mjs';
import {publicView,risk} from './engine.mjs';
import {MENTORS,REALMS} from './data.mjs';
import {playScene,stopScene} from './scene-final.mjs';
import {loadArt,artStatus,artAsset} from './art.mjs';
const app=document.querySelector('#app'),store=new SaveStore();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let busy=false,error='',confirmAction=null,currentTab='home',setup={origin:'P-01',name:'무명',trait:'random',inclination:'inner'};
const btn=(text,action,cls='',extra='')=>{const id={skip:'UI-ICO-SKIP',slow:'UI-ICO-SLOW',cancel:'UI-ICO-BACK'}[action],a=id&&artAsset(id);return `<button class="${cls}" data-ui="${action}" ${extra}>${a?`<img class="button-icon" src="${esc(a.source)}" alt="" width="20" height="20">`:''}${esc(text)}</button>`;};
const targetNames={inner:'내공 운기',outer:'외공 단련',rival:'고정 강적 · 비무',threat:'핵심 위협',leader:'우두머리 결전',skill:'주력 무공 숙련',assist:'사부의 보조 기예',default:'기본 진행'};
function errors(){return error?`<section class="card error" role="alert"><h2>진행을 멈췄습니다</h2><p>${esc(error)}</p><p class="muted">확정 저장되지 않은 결과를 진행하지 않습니다.</p>${store.pending?btn('같은 저장 다시 시도','retry','primary'):btn('최신 저장 불러오기','reload','primary')}</section>`:'';}
function replayBattle(canvas,battle,options){
 const caption=app.querySelector('.battle-caption');
 playScene(canvas,battle,text=>{if(caption.textContent!==text)caption.textContent=text;},options);
}
function render(){
 stopScene();const start=performance.now();
 if(!store.state){app.innerHTML=errors()+setupScreen();bind();return;}
 const v=publicView(store.state);
 let body='';
 if(confirmAction)body=confirmScreen(v);
 else if(v.phase==='ended')body=endedScreen(v);
 else if(v.phase==='grace')body=graceScreen(v);
 else if(v.phase==='event')body=eventScreen(v);
 else if(v.phase==='result')body=resultScreen(v);
 else if(v.phase==='journey')body=journeyScreen(v);
 else body=homeScreen(v);
 app.innerHTML=errors()+`<p class="save" role="status">${busy?'저장 중 · 입력을 기다려 주세요':error?'저장 상태 확인 필요':'자동 저장됨 · 기록 '+v.revision}</p>`+body;
 bind();if(error||busy)app.querySelectorAll('button:not([data-ui="retry"]):not([data-ui="reload"])').forEach(b=>b.disabled=true);
 const canvas=app.querySelector('canvas');if(canvas)replayBattle(canvas,v.result?.battle);
 document.documentElement.dataset.renderMs=(performance.now()-start).toFixed(2);
}
function setupScreen(){
 const selected=value=>value?' selected':'';
 return `<section class="card intro"><span class="kicker">첫 강호</span><h2>한 사람의 생애를<br>써 내려갑니다.</h2><p class="muted">검을 익히고, 인연을 만나고, 선택의 끝을 돌아보세요.</p></section>
 <form id="setup" class="card"><h2>새 생애</h2>
 <label>이름<input name="name" maxlength="16" value="${esc(setup.name)}" autocomplete="off"></label>
 <div class="grid">
 <label>출신<select name="origin"><option value="P-01"${selected(setup.origin==='P-01')}>청운문</option><option value="S-01"${selected(setup.origin==='S-01')}>흑송방</option></select></label>
 <label>초기 성향<select name="inclination"><option value="inner">내공</option><option value="outer"${selected(setup.inclination==='outer')}>외공</option></select></label>
 </div>
 <label>주 스승<select name="mentor" aria-describedby="mentor-description"></select></label><p class="muted" id="mentor-description"></p>
 <label>체질 체험 · 무결제<select name="trait"><option value="random">인연에 맡기기</option><option value="천무지체"${selected(setup.trait==='천무지체')}>천무지체</option><option value="약응체"${selected(setup.trait==='약응체')}>약응체</option></select></label>
 <p class="muted">모든 출신은 삼재검법으로 시작합니다. 성향은 다른 배움을 막지 않습니다. 실제 광고·결제·계정은 없습니다.</p>
 <button class="primary wide" type="submit">강호에 첫발을 내딛기</button></form>`;
}
function bindSetup(form){
 const {origin,mentor}=form.elements;
 const description=form.querySelector('#mentor-description');
 function showDescription(){
  description.textContent=MENTORS.find(entry=>entry.id===mentor.value).desc;
 }
 function updateMentors(){
  const options=MENTORS.filter(entry=>entry.origin===origin.value);
  mentor.replaceChildren(...options.map(entry=>new Option(entry.name,entry.id)));
  if(options.some(entry=>entry.id===setup.mentor))mentor.value=setup.mentor;
  showDescription();
 }
 updateMentors();
 origin.addEventListener('change',updateMentors);
 mentor.addEventListener('change',showDescription);
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;busy=true;
  setup=Object.fromEntries(new FormData(form));
  try{await store.initialize({...setup,seed:crypto.getRandomValues(new Uint32Array(1))[0]});error='';}catch(err){error=err.message;}
  busy=false;render();
 });
}
function header(v){return `<section class="card"><div class="row"><div class="fit portrait" aria-hidden="true">${v.origin==='P-01'?'山':'川'}</div><div><p class="kicker">${esc(v.originName)} · ${esc(v.realm)}</p><h2 class="name">${esc(v.name)}</h2><p class="muted">${v.age}세 · 강호 ${v.worldYear}년 ${v.season}</p></div><span class="fit badge ${v.body==='안정'?'':'warn'}">${esc(v.body)}</span></div><div class="statusgrid"><div class="stat">재화<strong>${v.money}</strong></div><div class="stat">명성<strong>${v.fame}</strong></div><div class="stat">문파 신뢰<strong>${v.trust}</strong></div></div><p class="muted">${esc(v.warning)}</p>${v.success?'<span class="badge">성공 기록 보유 · 생애 진행 중</span>':''}${v.rejuvenated?'<span class="badge warn">반로환동 이후 육체 약화</span>':''}</section>`;}
function homeScreen(v){
 const tab=(label,id)=>btn(label,'tab-'+id,currentTab===id?'primary':'',`aria-pressed="${currentTab===id}"`);
 const nav=`<div class="row">${tab('행동','home')}${tab('배움·기록','record')}${tab('지도·해금','map')}</div>`;
 return header(v)+`<section class="card">${nav}${currentTab==='home'?actionsScreen(v):currentTab==='record'?recordScreen(v):mapScreen(v)}</section>`+specialScreen(v)+`<details class="card"><summary>이번 생애의 발자취</summary>${logs(v)}</details>`;
}
function actionsScreen(v){return `<h2>다음 행동</h2><p class="muted">기간과 위험을 읽은 뒤 확정합니다. 진행 중 생긴 사건에는 새로 대응할 수 있습니다.</p><div class="actions">${v.actions.map((a,i)=>`<button class="action" data-ui="action" data-id="${a.id}"><span class="number">${String(i+1).padStart(2,'0')}</span><span class="copy"><strong>${a.name}</strong><small>${a.desc}</small></span><span class="duration">${a.months>=12?a.months/12+'년':a.months+'개월'}</span></button>`).join('')}</div>${v.canRetire?btn('은원을 정리하고 금분세수','retire','primary wide'):''}${v.success?btn('이 생애 마무리','finish','wide'):''}`;}
function recordScreen(v){return `<h2>배움과 인연</h2><p>주 스승 · <strong>${esc(v.mentor.name)}</strong></p><p class="muted">체질 · ${esc(v.trait)}<br>기예 · ${v.assists.length?v.assists.map(esc).join(' · '):'아직 배우지 않음'}<br>기반 경험 ${v.xp} · ${v.realm}<br>은거 고수 인연 ${v.npc}</p>
 <form id="loadout">
 <label>주력 무공<select name="primary" aria-describedby="primary-mastery">${v.skills.map(s=>`<option value="${s.id}" data-mastery="${s.mastery}" ${s.id===v.loadout.primary?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
 <p class="muted" id="primary-mastery"></p>
 <p class="muted">보조 공격 무공 · 배운 개수만으로 불이익을 받지 않습니다.</p>
 ${v.skills.map(s=>`<label class="row"><input class="fit" type="checkbox" name="aux" value="${s.id}" ${v.loadout.aux.includes(s.id)?'checked':''}><span>${esc(s.name)}</span></label>`).join('')}
 <button class="wide" type="submit">공격 구성 적용</button></form>
 <div class="divider"><h3>도감의 단서</h3>${v.clues.length?`<p class="muted">${v.clues.map(esc).join(' · ')}</p>`:'<p class="empty">앞으로 만날 일들이 기록됩니다.</p>'}</div>`;}
function mapScreen(v){return `<h2>강호의 소식</h2><p class="muted">첫 테스트의 플레이 출신은 정파·사파 두 곳입니다. 해금은 기록으로 남습니다.</p><div class="grid"><div><h3>${esc(v.origins[0].name)}</h3><p class="muted">입문 가능</p></div><div><h3>${esc(v.origins[1].name)}</h3><p class="muted">입문 가능</p></div><div><h3>일반 문파</h3><p class="muted">${v.unlocks.includes('F-NORMAL')?'실제 접전으로 해금':'잠김 · 실제 접전 결과 필요'}</p></div><div><h3>명문</h3><p class="muted">${v.unlocks.includes('F-POPULAR')?'해금 의뢰 완료':'잠김 · 의뢰 단계 '+v.quest+'/2'}</p></div></div><p class="notice">${v.threat.resolved?'이번 생애의 핵심 위협을 해결했습니다.':v.threat.occurred?'핵심 위협이 남아 있습니다. 강적 도전에서 다시 맞설 수 있습니다.':'회차의 핵심 위협은 아직 드러나지 않았습니다.'}</p>${v.debt.length?`<p class="muted">남은 은원: ${v.debt.map(esc).join(', ')} · 지역 의뢰로 수습</p>`:''}`;}
function specialScreen(v){return v.canRejuvenate?`<details class="card"><summary>반로환동 · 무결제 특수 체험</summary><p class="muted">깨달음 자격을 갖췄습니다. 수명 10년 연장과 육체 약화, 생애당 1회 공유 한도입니다. 실제 광고 요청은 없습니다.</p><div class="choices">${btn('테스트 체험 완료 · 모사로 사용','rejuvenate-simulation','primary')}${btn('재화 80으로 사용','rejuvenate-money','',v.money<80?'disabled':'')}</div></details>`:'';}
function confirmScreen(v){const a=v.actions.find(x=>x.id===confirmAction);return `<section class="card"><span class="kicker">행동 확정 전</span><h2>${esc(a.name)}</h2><p>${esc(a.desc)}</p><p>기간 ${a.months}개월 · 이동은 포함되어 있습니다.</p><p class="notice">확정 후에는 이 행동을 취소하거나 다른 행동으로 바꿀 수 없습니다.</p><form id="confirm"><label>행동의 대상<select name="target">${a.targets.map(t=>`<option value="${t}">${targetNames[t]}</option>`).join('')}</select></label><p id="risk-confirm" class="muted">새 사건의 위험은 선택 전에 다시 안내합니다.</p><div class="row">${btn('다시 살피기','cancel')}<button class="primary" type="submit">이 행동으로 확정</button></div></form></section>`;}
function journeyScreen(v){return header(v)+`<section class="card"><span class="kicker">확정된 여정</span><h2>${esc(v.active.name)}</h2><p class="muted">진행 ${v.active.elapsed} / ${v.active.duration}개월 · 원행동을 이어갑니다.</p><p>읽고 있는 동안과 앱을 닫은 동안 강호의 시간은 흐르지 않습니다.</p>${v.result?.battle?battlePanel(v):''}${btn('확정한 여정 이어가기','advance','primary wide')}</section>`;}
function eventScreen(v){const e=v.pending;return header(v)+`<section class="card"><span class="kicker">새로운 사건</span><h2>${esc(e.name)}</h2><p>${esc(e.text)}</p>${v.active?`<p class="muted">원행동: ${esc(v.active.name)} · 진행은 보존됩니다.</p>`:''}<div class="choices">${e.choices.map(c=>`<button data-ui="choose" data-id="${c.id}" ${c.allowed?'':'disabled'}>${esc(c.label)}${c.risk?`<small>${esc(c.risk.level)} · ${c.risk.mode==='duel'?'비무 · 패배·부상 가능':'생사 위험 · 사망 가능'} · ${esc(c.risk.reason)}</small>`:''}${c.allowed?'':`<small>${esc(c.reason)}</small>`}</button>`).join('')}</div></section>`;}
function battlePanel(v){return `<div><canvas width="256" height="144" aria-label="도트 자동 전투 장면" role="img"></canvas><p class="battle-caption muted">이미 확정한 전투를 재생합니다.</p><div class="row">${btn('연출 생략','skip')}${btn('느리게 보기','slow')}</div><details><summary>실제 발동 무공과 전투 원인</summary><p class="muted">${esc(v.result.battle.reason)}</p><ol class="muted">${v.result.battle.turns.map(t=>`<li>${t.round}합 · ${esc(t.skill)} · 피해 ${t.damage} / 피격 ${t.received}</li>`).join('')}</ol></details></div>`;}
function resultScreen(v){return `<section class="card intro"><span class="kicker">선택이 남긴 것</span><h2>${esc(v.result?.title||'행동 결과')}</h2><p>${esc(v.result?.text)}</p></section>${v.result?.battle?`<section class="card">${battlePanel(v)}</section>`:''}${header(v)}<section class="card">${btn('기록을 확인하고 계속','ack','primary wide')}</section>`;}
function graceScreen(v){return `<section class="card"><span class="kicker">생애의 갈림길</span><h2>마지막 깨달음 앞에서</h2><p>자연의 흐름이 멈춤을 청합니다. 깨달음을 써서 지금의 생애를 더 이어갈 수 있습니다.</p>${v.success?'<p class="badge">이 생애의 성공은 이미 기록했습니다.</p>':''}${v.active?`<p class="muted">${esc(v.active.name)}의 이미 진행한 성과를 유지하고 원행동의 남은 기간을 계속합니다.</p>`:''}<p class="muted">수명 10년 연장 · 육체 약화 · 생애당 한 번. 광고와 재화 방식은 같은 한도를 공유합니다.</p><div class="choices">${btn('테스트 체험 완료 · 반로환동','rejuvenate-simulation','primary')}${btn('재화 80 · 반로환동','rejuvenate-money','',v.money<80?'disabled':'')}${btn('이 생애를 돌아본다','declineGrace')}</div></section>`;}
function endedScreen(v){const cause={natural:'자연의 흐름 속에서',battle:'마지막 전투에서',retired:'스스로 정한 마침표에서'}[v.ending];return `<section class="card intro"><span class="kicker">생애 회고</span><h2>${esc(v.name)}의 발자취</h2><p>${cause} 한 생애를 마쳤습니다.</p><div class="statusgrid"><div class="stat">마지막 경지<strong>${v.realm}</strong></div><div class="stat">지나온 나이<strong>${v.age}세</strong></div><div class="stat">생애 기록<strong>${v.history.length}회</strong></div></div><p>${v.success==='retirement'?'금분세수의 성공을 남겼습니다.':v.success==='conquest'?'승리하고 생존해 정복의 성공을 남겼습니다.':'성공에 닿지 못했어도 발견과 해금은 남습니다.'}</p></section>${v.recapQuote?`<blockquote class="notice">${esc(v.recapQuote)}</blockquote>`:''}${v.result?.battle?`<section class="card">${battlePanel(v)}</section>`:''}<section class="card"><h2>다시 강호로</h2><p class="muted">해금·도감·생애 기록을 유지합니다. 능력과 재화, 미완료 퀘스트는 새로 시작합니다.</p><div class="choices">${btn('새 생애 · 청운문','new-P-01','primary')}${btn('새 생애 · 흑송방','new-S-01')}${btn('기억을 품고 회귀','regress')}</div></section><details class="card"><summary>기억할 선택과 인연</summary>${logs(v)}</details>`;}
function logs(v){return `<ul class="log">${v.log.slice(-40).reverse().map(x=>`<li><small>강호 ${Math.floor(x.month/12)+1}년</small>${esc(x.text)}</li>`).join('')}</ul>`;}
function updateRisk(){
 const form=app.querySelector('#confirm'),box=app.querySelector('#risk-confirm');if(!form||!box)return;
 const view=publicView(store.state),target=form.elements.target.value;
 const enemy=confirmAction==='ACT-09'?target:confirmAction==='ACT-06'?'novice':confirmAction==='ACT-08'&&view.quest===1&&!view.assists.includes('의술')?'rival':null;
 if(!enemy){box.textContent='새 사건의 위험은 선택 전에 다시 안내합니다.';return;}
 const r=risk(store.state,enemy);box.textContent=`${r.enemy} · ${r.level} · ${r.mode==='duel'?'비무: 패배·부상 가능':'생사 위험: 패배 시 사망 가능'} · ${r.reason}`;
}
async function perform(command){
 if(busy||error)return;busy=true;render();
 try{
  const beforeBattle=store.state?.result?.battle?.id;
  await store.dispatch({...command,id:crypto.randomUUID()});
  const changedBattle=store.state?.result?.battle?.id&&store.state.result.battle.id!==beforeBattle;
  if(['startAction','choose','rejuvenate'].includes(command.type)&&store.state.phase==='journey'&&!changedBattle)await store.dispatch({type:'advance',id:crypto.randomUUID()});
 }catch(e){error=e.message;}finally{busy=false;render();window.scrollTo(0,0);const heading=app.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
}
function bind(){
 app.querySelector('#confirm')?.addEventListener('change',updateRisk);updateRisk();
 const setupForm=app.querySelector('#setup');if(setupForm)bindSetup(setupForm);
 const loadout=app.querySelector('#loadout');
 if(loadout){
  const primary=loadout.elements.primary;
  const showMastery=()=>{loadout.querySelector('#primary-mastery').textContent='숙련 '+primary.selectedOptions[0].dataset.mastery;};
  primary.addEventListener('change',showMastery);showMastery();
 }
 app.querySelector('#confirm')?.addEventListener('submit',e=>{e.preventDefault();const action=confirmAction;const target=new FormData(e.currentTarget).get('target');confirmAction=null;perform({type:'startAction',action,target});});
 app.querySelector('#loadout')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),primary=f.get('primary');perform({type:'loadout',primary,aux:f.getAll('aux').filter(x=>x!==primary)});});
 app.querySelectorAll('[data-ui]').forEach(el=>el.addEventListener('click',async()=>{
  const a=el.dataset.ui;if(a==='retry'){try{busy=true;error='';await store.retry();}catch(e){error=e.message;}finally{busy=false;render();}return;}
  if(a==='reload'){try{store.blocked=null;store.pending=null;await store.read();error='';}catch(e){error=e.message;}render();return;}
  if(error||busy)return;
  if(a==='action'){confirmAction=el.dataset.id;render();app.querySelector('[name="target"]')?.focus();}
  else if(a==='cancel'){const previous=confirmAction;confirmAction=null;render();app.querySelector(`[data-ui="action"][data-id="${previous}"]`)?.focus();}
  else if(a.startsWith('tab-')){currentTab=a.slice(4);render();app.querySelector(`[data-ui="${a}"]`)?.focus();}
  else if(a==='choose')perform({type:'choose',choice:el.dataset.id});
  else if(a==='skip'){stopScene();app.querySelector('.battle-caption').textContent='연출을 생략했습니다. 기록된 결과와 보상은 같습니다.';}
  else if(a==='slow'){const v=publicView(store.state);replayBattle(app.querySelector('canvas'),v.result.battle,{speed:.5});}
  else if(a.startsWith('rejuvenate-'))perform({type:'rejuvenate',method:a.slice(11)});
  else if(a.startsWith('new-'))perform({type:'newLife',options:{origin:a.slice(4),mentor:MENTORS.find(m=>m.origin===a.slice(4)).id,regress:false}});
  else if(a==='regress')perform({type:'newLife',options:{regress:true}});
  else perform({type:a});
 }));
}
const art=await loadArt();document.documentElement.dataset.art=art.ready?art.revision:'fallback';
document.querySelector('footer .muted').textContent=art.errors.length?'일부 아트를 읽지 못해 대체 표현을 사용합니다. 게임 결과와 저장은 유지됩니다.':'도트 시트·네 검법의 PixelFX PNG 효과 연결 · 출처와 고지를 자산 폴더에 보존했습니다.';
try{await store.open();}catch(e){error=e.message;store.blocked=e;}
render();
