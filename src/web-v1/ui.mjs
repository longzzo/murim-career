import {SaveStore} from './storage.mjs';
import {publicView,risk} from './engine.mjs';
import {MENTORS,ECONOMY} from './data.mjs';
import {playScene,stopScene} from './scene-final.mjs';
import {loadArt,artAsset} from './art.mjs';
import {esc,number,currency,character,situation,bottomNav,home,actionGroup,inventory,itemDetail,image} from './experience.mjs';
const app=document.querySelector('#app'),store=new SaveStore();
let busy=false,error='',confirmAction=null,selectedTarget=null,currentTab='home',group=null,review=null;
let item=null,itemTab='weapon',itemConfirm=null,previousPage=null,returnFocus=null,afterAck=null;
let setup={origin:'P-01',name:'무명',trait:'random',inclination:'inner'};
const btn=(text,action,cls='',extra='')=>{const id={skip:'UI-ICO-SKIP',slow:'UI-ICO-SLOW',cancel:'UI-ICO-BACK'}[action],a=id&&artAsset(id);return `<button class="${cls}" data-ui="${action}" ${extra}>${a?`<img class="button-icon" src="${esc(a.source)}" alt="" width="20" height="20">`:''}${esc(text)}</button>`;};
const targetNames={inner:'내공 운기',outer:'외공 단련',rival:'고정 강적 · 비무',threat:'핵심 위협',leader:'우두머리 결전',skill:'주력 무공 숙련',assist:'사부의 보조 기예',default:'기본 진행'};
function errors(){return error?`<section class="card error" role="alert"><h2>진행을 멈췄습니다</h2><p>${esc(error)}</p><p class="muted">확정 저장되지 않은 결과를 진행하지 않습니다.</p>${store.pending?btn('같은 저장 다시 시도','retry','primary'):btn('최신 저장 불러오기','reload','primary')}</section>`:'';}
function replayBattle(canvas,battle,options){
 const caption=app.querySelector('.battle-caption');
 playScene(canvas,battle,text=>{if(caption.textContent!==text)caption.textContent=text;},options);
}
function render(){
 stopScene();const start=performance.now();
 if(!store.state){app.innerHTML=errors()+(error?'':setupScreen());bind();return;}
 const v=publicView(store.state);
 let body='';
 if(item&&v.inventory&&(item==='CON-HERB'||v.inventory.weapons.some(w=>w.id===item)))body=itemDetail(v,item,itemConfirm);
 else if(currentTab==='inventory'&&v.phase!=='home')body=inventory(v,itemTab)+`<button class="wide" data-ui="back-phase">현재 상황으로</button>`;
 else if(confirmAction&&v.phase==='home')body=confirmScreen(v);
 else if(review&&v.phase==='home')body=reviewScreen(v);
 else if(v.phase==='ended')body=endedScreen(v);
 else if(v.phase==='grace')body=graceScreen(v);
 else if(v.phase==='event')body=eventScreen(v);
 else if(v.phase==='result')body=resultScreen(v);
 else if(v.phase==='journey')body=journeyScreen(v);
 else body=homeScreen(v);
 const cleanHome=v.phase==='home'&&currentTab==='home'&&!group&&!confirmAction&&!review&&!item;
 document.body.classList.toggle('compact-home',cleanHome);
 app.innerHTML=errors()+`<p class="save${cleanHome?' visually-hidden':''}" role="status">${busy?'저장 중 · 입력을 기다려 주세요':error?'저장 상태 확인 필요':'자동 저장됨 · 기록 '+v.revision}</p>`+body;
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
function homeScreen(v){
 if(currentTab==='home')return group?actionGroup(v,group):home(v);
 if(currentTab==='inventory')return inventory(v,itemTab)+bottomNav(currentTab);
 const detail=currentTab==='record'?recordScreen(v):currentTab==='map'?mapScreen(v):chronicleScreen(v);
 return currency(v)+`<section class="card">${detail}</section>`+(currentTab==='chronicle'?specialScreen(v):'')+bottomNav(currentTab);
}
function chronicleScreen(v){
 return `<h2>기록</h2><details open><summary>이번 생애의 발자취</summary>${logs(v)}</details>
 <details><summary>지난 생애</summary>${v.history.length?`<ul>${v.history.map(h=>`<li>${esc(h.name)} · ${h.age}세 · ${esc(h.realm)}${h.recapQuote?`<p>${esc(h.recapQuote)}</p>`:''}</li>`).join('')}</ul>`:'<p class="empty">지난 생애 기록 없음</p>'}</details>
 ${v.canRetire&&!v.success?btn('금분세수 살피기','review','wide','data-id="retire"'):''}
 ${v.success?btn('생애 마무리 살피기','review','wide','data-id="finish"'):''}`;
}
function reviewScreen(v){
 const finish=review==='finish';
 return currency(v)+`<section class="card"><h2>${finish?'이 생애 마무리':'금분세수'}</h2>
 <p>${finish?'이미 남긴 성공을 기록하고 이 생애를 마칩니다.':'은원을 정리한 성공을 기록합니다. 성공 뒤에도 이 생애를 이어갈 수 있습니다.'}</p>
 <div class="row">${btn('계속 지내기','cancel')}${btn(finish?'생애 마무리 확정':'금분세수 확정',review,'primary')}</div></section>`;
}
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
function confirmScreen(v){
 const a=v.actions.find(x=>x.id===confirmAction);
 const treatment=a.id==='ACT-05';
 const reward={'ACT-03':ECONOMY.commission,'ACT-04':ECONOMY.escort}[a.id];
 const cost=treatment&&v.money>=ECONOMY.treatment?ECONOMY.treatment:0;
 const mentorReason=a.id==='ACT-02'&&returnFocus==='.current-situation button'&&situation(v)?.action===a.id
  ? (v.knowsMentorSkill?'검법을 익혔고, 사부의 기예는 아직 배우지 않았습니다.':'사부의 후속 검법을 아직 배우지 않았습니다.') : '';
 return currency(v)+`<section class="card"><span class="kicker">행동 확정 전</span><h2>${esc(a.name)}</h2>
 ${mentorReason?`<p class="notice">${mentorReason}</p>`:''}<p>${esc(a.desc)}</p>
 <p>기본 기간 ${a.months}개월 · 이동 포함</p><p>선지출 ${cost} 재화${reward?` · 완료 보수 ${reward} 재화`:''}</p>
 ${treatment&&!cost?'<p class="notice">재화가 부족해 무료 휴식을 합니다. 심한 부상에는 치료가 필요합니다.</p>':''}
 <p class="notice">확정 후에는 이 행동을 취소하거나 다른 행동으로 바꿀 수 없습니다.</p>
 <form id="confirm"><label>행동의 대상<select name="target">${a.targets.map(t=>`<option value="${t}" ${t===selectedTarget?'selected':''}>${targetNames[t]}</option>`).join('')}</select></label>
 <p id="risk-confirm" class="muted">새 사건의 위험은 선택 전에 다시 안내합니다.</p>
 <div class="row">${btn('다시 살피기','cancel')}<button class="primary" type="submit">이 행동으로 확정</button></div></form></section>`;
}
const inspectInventory=()=>btn('소지품 보기','tab-inventory','wide');
function journeyScreen(v){
 return currency(v)+character(v)+`<section class="card"><h2>${esc(v.active.name)}</h2>
 <progress aria-label="여정 진행" value="${v.active.elapsed}" max="${v.active.duration}"></progress><p>진행 ${v.active.elapsed} / ${v.active.duration}개월</p>
 ${v.result?.battle?battlePanel(v):''}${btn('여정 계속','advance','primary wide')}${inspectInventory()}</section>`;
}
function eventScreen(v){
 const e=v.pending;
 return currency(v)+`<section class="card event-card">${e.id==='A-001'?image('UI-ILL-A001','event-art'):''}
 <h2>${esc(e.name)}</h2><p>${esc(e.text)}</p>
 ${v.active?`<p class="muted">${esc(v.active.name)} · ${v.active.elapsed}/${v.active.duration}개월 진행</p>`:''}
 <div class="choices">${e.choices.map(c=>`<button data-ui="choose" data-id="${esc(c.id)}" ${c.allowed?'':'disabled'}>${esc(c.label)}
 ${c.extraMonths?`<small>기간 +${c.extraMonths}개월</small>`:''}
 ${c.risk?`<small>${esc(c.risk.level)} · ${c.risk.mode==='duel'?'비무 · 패배·부상 가능':'생사 위험 · 사망 가능'} · ${esc(c.risk.reason)}</small>`:''}
 ${c.allowed?'':`<small>${esc(c.reason)}</small>`}</button>`).join('')}</div>${inspectInventory()}</section>`;
}
function battlePanel(v){return `<div><canvas width="256" height="144" aria-label="도트 자동 전투 장면" role="img"></canvas><p class="battle-caption muted">이미 확정한 전투를 재생합니다.</p><div class="row">${btn('연출 생략','skip')}${btn('느리게 보기','slow')}</div><details><summary>실제 발동 무공과 전투 원인</summary><p class="muted">${esc(v.result.battle.reason)}</p><ol class="muted">${v.result.battle.turns.map(t=>`<li>${t.round}합 · ${esc(t.skill)} · 피해 ${t.damage} / 피격 ${t.received}</li>`).join('')}</ol></details></div>`;}
function resultScreen(v){
 const result=v.result,battle=result?.battle,weapon=battle?.weapon;
 const outcome={win:'승리',loss:'패배',escape:'도주',mutual:'동반 사망'};
 const next=situation({...v,phase:'home'});
 const skill=v.skills.find(s=>s.id===v.loadout.primary);
 const delta=result?.completionMoney??0;
 return `<section class="card result-card"><h2>${esc(result?.title||'행동 결과')}${battle?' · '+outcome[battle.outcome]:''}</h2>
 ${battle?battlePanel(v):character(v)}
 <div class="result-tags"><span class="badge">현재 재화 ${number(v.money)}</span>
 ${delta?`<span class="badge">완료 보수 +${delta} 재화</span>`:''}
 ${result?.paidMoney?`<span class="badge">선지출 −${result.paidMoney} 재화</span>`:''}
 ${skill?`<span class="badge">현재 숙련 ${skill.mastery}</span>`:''}<span class="badge">${esc(v.body)}</span>
 ${(result?.itemGains??[]).map(g=>`<span class="badge">${esc(g.name)} +${g.quantity}개</span>`).join('')}
 ${weapon?`<span class="badge">${esc(weapon.name)} · 공격력 +${weapon.attack} · 내구 ${weapon.startDurability} → ${weapon.endDurability}</span>`:''}</div>
 <p>${esc(battle?.reason||result?.text)}</p>
 ${next.action?btn(next.label,'ack-next','primary wide',`data-id="${next.action}" data-target="${next.target??''}"`):btn('기록을 확인하고 계속','ack','primary wide')}
 ${next.action?btn('홈으로 돌아가기','ack','wide'):''}
 <details><summary>자세히</summary>${battle?`<p>${esc(result.text)}</p>`:''}${logs(v)}</details>
 ${inspectInventory()}</section>`;
}
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
  committed(command.type);
  const changedBattle=store.state?.result?.battle?.id&&store.state.result.battle.id!==beforeBattle;
  if(['startAction','choose','rejuvenate'].includes(command.type)&&store.state.phase==='journey'&&!changedBattle)await store.dispatch({type:'advance',id:crypto.randomUUID()});
 }catch(e){error=e.message;}finally{busy=false;render();focusPage();}
}
function focusPage(selector='h2'){
 const target=app.querySelector(selector)??app.querySelector('h2');
 if(target){
  const next=target.disabled?app.querySelector('h2'):target;
  if(next?.tagName==='H2')next.tabIndex=-1;
  next?.focus();
 }
}
function committed(type){
 if(type==='ack'){
  currentTab='home';group=null;
  if(afterAck&&store.state.phase==='home'){
   confirmAction=afterAck.id;selectedTarget=afterAck.target;
   returnFocus='.current-situation button';
  }
  afterAck=null;
 }
 if(type==='newLife'){currentTab='home';group=null;item=null;itemConfirm=null;afterAck=null;}
 if(type==='retire'||type==='finish')review=null;
 if(type==='repairWeapon'||type==='useHerb')itemConfirm=null;
}
function focusSelector(el){
 const action=el.dataset.ui,id=el.dataset.id;
 if(el.closest('.current-situation'))return '.current-situation button';
 return `[data-ui="${CSS.escape(action)}"]${id?`[data-id="${CSS.escape(id)}"]`:''}`;
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
 app.querySelector('#confirm')?.addEventListener('submit',e=>{e.preventDefault();const action=confirmAction;const target=new FormData(e.currentTarget).get('target');confirmAction=null;selectedTarget=null;perform({type:'startAction',action,target});});
 app.querySelector('#loadout')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),primary=f.get('primary');perform({type:'loadout',primary,aux:f.getAll('aux').filter(x=>x!==primary)});});
 app.querySelectorAll('[data-ui]').forEach(el=>el.addEventListener('click',async()=>{
  const a=el.dataset.ui,id=el.dataset.id;if(a==='retry'){if(busy)return;try{busy=true;error='';const type=store.pending.command.type;await store.retry();committed(type);}catch(e){error=e.message;}finally{busy=false;render();focusPage();}return;}
  if(a==='reload'){if(busy)return;try{busy=true;store.blocked=null;store.pending=null;await (store.db?store.read():store.open());error='';afterAck=null;item=null;confirmAction=null;review=null;}catch(e){error=e.message;}finally{busy=false;render();focusPage();}return;}
  if(error||busy)return;
  if(a==='action'){returnFocus=focusSelector(el);confirmAction=id;selectedTarget=el.dataset.target;render();focusPage('[name="target"]');}
  else if(a==='review'){returnFocus=focusSelector(el);review=id;render();focusPage();}
  else if(a==='cancel'){confirmAction=null;selectedTarget=null;review=null;render();focusPage(returnFocus||'h2');}
  else if(a==='group'){returnFocus=focusSelector(el);group=id;render();focusPage();}
  else if(a==='back-group'){const previous=group;group=null;render();focusPage(`.activity-grid [data-id="${previous}"]`);}
  else if(a.startsWith('tab-')){currentTab=a.slice(4);group=null;render();focusPage(store.state.phase==='home'?focusSelector(el):'h2');}
  else if(a==='back-phase'){currentTab='home';render();focusPage('[data-ui="tab-inventory"]');}
  else if(a.startsWith('items-')){itemTab=a.slice(6);render();focusPage(focusSelector(el));}
  else if(a==='item'){previousPage={tab:currentTab,selector:focusSelector(el)};item=id;itemConfirm=null;render();focusPage();}
  else if(a==='compare-item'){item=id;itemConfirm=null;render();focusPage();}
  else if(a==='back-item'){item=null;itemConfirm=null;currentTab=previousPage.tab;render();focusPage(previousPage.selector);}
  else if(a==='item-use'||a==='item-repair'){itemConfirm=a.slice(5);render();focusPage('[data-ui="item-cancel"]');}
  else if(a==='item-cancel'){const cancelled=itemConfirm;itemConfirm=null;render();focusPage(`[data-ui="item-${cancelled}"]`);}
  else if(a==='item-apply'){
   if(itemConfirm==='use')perform({type:'useHerb',itemId:item});
   else if(itemConfirm==='repair'){
    const w=publicView(store.state).inventory.weapons.find(w=>w.id===item);
    perform({type:'repairWeapon',instanceId:item,cost:w.repairCost});
   }
  }
  else if(a==='item-equip')perform({type:'equipWeapon',instanceId:item});
  else if(a==='ack-next'){afterAck={id,target:el.dataset.target};perform({type:'ack'});}
  else if(a==='choose')perform({type:'choose',choice:el.dataset.id});
  else if(a==='skip'){stopScene();app.querySelector('.battle-caption').textContent='연출을 생략했습니다. 기록된 결과와 보상은 같습니다.';}
  else if(a==='slow'){const v=publicView(store.state);replayBattle(app.querySelector('canvas'),v.result.battle,{speed:.5});}
  else if(a.startsWith('rejuvenate-'))perform({type:'rejuvenate',method:a.slice(11)});
  else if(a.startsWith('new-'))perform({type:'newLife',options:{origin:a.slice(4),mentor:MENTORS.find(m=>m.origin===a.slice(4)).id,regress:false}});
  else if(a==='regress')perform({type:'newLife',options:{regress:true}});
  else perform({type:a});
 }));
 app.querySelectorAll('img.event-art,img.home-background,img.item-image,img[data-image-fallback]').forEach(el=>{
  el.addEventListener('error',()=>{
   if(!el.dataset.imageFallback){el.remove();return;}
   const replacement=document.createElement('span');
   replacement.className=el.className+' image-fallback';
   replacement.setAttribute('aria-hidden','true');
   replacement.textContent=el.dataset.imageFallback;
   el.replaceWith(replacement);
  },{once:true});
 });
}
const art=await loadArt();document.documentElement.dataset.art=art.ready?art.revision:'fallback';
document.querySelector('footer .muted').textContent=art.errors.length?'일부 아트를 읽지 못해 대체 표현을 사용합니다. 게임 결과와 저장은 유지됩니다.':'도트 시트·네 검법의 PixelFX PNG 효과 연결 · 출처와 고지를 자산 폴더에 보존했습니다.';
try{await store.open();}catch(e){error=e.message;store.blocked=e;}
render();
