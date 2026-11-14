import {SaveStore} from './storage.mjs';
import {publicView} from './engine.mjs';
import {MENTORS} from './data.mjs';
import {playScene,stopScene} from './scene-final.mjs';
import {loadArt,artAsset} from './art.mjs';
import {esc,number,currency,character,situation,battleRisk,bottomNav,home,actionGroup,inventory,itemDetail,image} from './experience.mjs';
import {schoolMap,setupScreen,setupTraitDescription,rejuvenation,changeTags,changeHistory} from './life-screens.mjs';
import {resourceBattlePanel,battleResources} from './battle-ui.mjs';
import {guidancePanel,guidanceHelp} from './guidance-ui.mjs';
import {storyPanel,promiseHistory,storyResult} from './story-ui.mjs';
import {loadoutPreview} from './upgrade-model.mjs';
import {wholeSummary,combatSummary,nextPanel,configurationSummary} from './upgrade-ui.mjs';
const app=document.querySelector('#app'),store=new SaveStore();
let busy=false,error='',battleConfirm=null,currentTab='home',group=null,review=null;
let item=null,itemTab='weapon',itemConfirm=null,previousPage=null,returnFocus=null;
let setup={name:'',trait:'random',inclination:'inner'},setupOrigin=null,configuring=false,startingNew=false;
let mapOrigin=null,recapOpen=false,announcement=[];
let loadoutDraft=null;
const editingLocked=()=>busy||!!error||!!store.pending;
const displayedLoadout=()=>store.pending?.command.type==='loadout'?store.pending.command:loadoutDraft??store.state.life.loadout;
const btn=(text,action,cls='',extra='')=>{const id={skip:'UI-ICO-SKIP',slow:'UI-ICO-SLOW',cancel:'UI-ICO-BACK'}[action],a=id&&artAsset(id);return `<button class="${cls}" data-ui="${action}" ${extra}>${a?`<img class="button-icon" src="${esc(a.source)}" alt="" width="20" height="20">`:''}${esc(text)}</button>`;};
function errors(){return error?`<section class="card error" role="alert"><h2>진행을 멈췄습니다</h2><p>${esc(error)}</p><p class="muted">${store.pending?.command.type==='startAction'?'행동이 시작되지 않았습니다. 이전 저장을 유지했습니다.':store.pending?.command.type==='advance'?'여정의 다음 진행은 저장되지 않았습니다. 마지막으로 저장된 시점이 유지됩니다.':'확정 저장되지 않은 결과를 진행하지 않습니다.'}</p>${store.pending?btn('같은 저장 다시 시도','retry','primary'):btn('최신 저장 불러오기','reload','primary')}</section>`:'';}
function replayBattle(canvas,battle,options){
 const caption=app.querySelector('.battle-caption');
 let lastFrame='';
 playScene(canvas,battle,text=>{if(caption.textContent!==text)caption.textContent=text;},{...options,onFrame:frame=>{
  const key=JSON.stringify([frame.round,frame.side,frame.phase,frame.values,frame.finished]);
  if(key===lastFrame)return;lastFrame=key;
  const panel=app.querySelector('.battle-resources');if(panel)panel.innerHTML=battleResources(battle,frame);
  const select=app.querySelector('#battle-round');if(select)select.value=String(frame.round);
 }});
}
function render(){
 stopScene();const start=performance.now();
 if(!store.state||startingNew){
  document.body.classList.remove('compact-home');
  app.innerHTML=errors()+(error?'':setupScreen(setup,setupOrigin,configuring,startingNew));bind();return;
 }
 const v=publicView(store.state);
 const notice=!error&&!busy&&announcement.length&&v.phase!=='result'?`<aside class="change-notice" aria-label="저장된 상태 변화"><div><strong>상태 변화</strong><div class="result-tags">${changeTags(announcement)}</div></div>${btn('닫기','dismiss-notice','', 'aria-label="상태 변화 알림 닫기"')}</aside>`:'';
 const cleanHome=v.phase==='home'&&currentTab==='home'&&!group&&!battleConfirm&&!review&&!item;
 let body='';
 if(item&&v.inventory&&(item==='CON-HERB'||v.inventory.medicines?.some(m=>m.itemId===item)||v.inventory.weapons.some(w=>w.id===item)))body=itemDetail(v,item,itemConfirm);
 else if(currentTab==='inventory'&&v.phase!=='home')body=inventory(v,itemTab)+`<button class="wide" data-ui="back-phase">현재 상황으로</button>`;
 else if(currentTab==='map'&&['journey','event','result'].includes(v.phase))body=currency(v)+`<section class="card">${mapScreen(v)}</section>`+btn('현재 상황으로','back-phase','wide');
 else if(battleConfirm)body=confirmation(v);
 else if(review&&v.phase==='home')body=reviewScreen(v);
 else if(v.phase==='ended')body=endedScreen(v);
 else if(v.phase==='grace')body=graceScreen(v);
 else if(v.phase==='event')body=eventScreen(v);
 else if(v.phase==='result')body=resultScreen(v);
 else if(v.phase==='journey')body=journeyScreen(v);
 else body=homeScreen(v,cleanHome?notice:'');
 document.body.classList.toggle('compact-home',cleanHome);
 app.innerHTML=errors()+`<p class="save${cleanHome?' visually-hidden':''}" role="status">${busy?'저장 중 · 입력을 기다려 주세요':error?'저장 상태 확인 필요':'자동 저장됨 · 기록 '+v.revision}</p>`+body+(cleanHome?'':notice);
 bind();if(editingLocked())app.querySelectorAll('button:not([data-ui="retry"]):not([data-ui="reload"]),#loadout select,#loadout input').forEach(b=>b.disabled=true);
 const canvas=app.querySelector('canvas');if(canvas)replayBattle(canvas,v.result?.battle);
 document.documentElement.dataset.renderMs=(performance.now()-start).toFixed(2);
}
function bindSetup(form){
 form.elements.trait.addEventListener('change',()=>{
  form.querySelector('#trait-description').textContent=setupTraitDescription(form.elements.trait.value);
 });
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||error)return;
  setup={...setup,...Object.fromEntries(new FormData(form))};
  const options={...setup,name:setup.name.trim()||'무명'};
  if(startingNew){await perform({type:'newLife',options});return;}
  busy=true;
  try{await store.initialize({...options,seed:crypto.getRandomValues(new Uint32Array(1))[0]});error='';}catch(err){error=err.message;}
  busy=false;render();focusPage();
 });
}
function homeScreen(v,notice){
 if(currentTab==='home')return group?actionGroup(v,group,group==='world'?storyPanel(v):''):home(v,notice);
 if(currentTab==='inventory')return inventory(v,itemTab)+bottomNav(currentTab);
 const detail=currentTab==='record'?recordScreen(v):currentTab==='map'?mapScreen(v):chronicleScreen(v);
 return currency(v)+`<section class="card">${detail}</section>`+bottomNav(currentTab);
}
function chronicleScreen(v){
 return `<h2>기록</h2>${v.canRejuvenate?btn('반로환동 방법 살피기','review','wide','data-id="renewal"'):''}${guidanceHelp(v)}${promiseHistory(v)}${changeHistory(v)}<details open><summary>이번 생애의 발자취</summary>${logs(v)}</details>
 <details class="past-lives"><summary>지난 생애</summary>${v.history.length?`<ul>${v.history.map(h=>`<li>${esc(h.name)} · ${h.age}세 · ${esc(h.realm)}${h.recapQuote?`<p>${esc(h.recapQuote)}</p>`:''}${promiseHistory(h)}</li>`).join('')}</ul>`:'<p class="empty">지난 생애 기록 없음</p>'}</details>
 ${v.canRetire&&!v.success?btn('금분세수 살피기','review','wide','data-id="retire"'):''}
 ${v.success?btn('생애 마무리 살피기','review','wide','data-id="finish"'):''}`;
}
function reviewScreen(v){
 if(review==='renewal')return currency(v)+rejuvenation(v);
 const finish=review==='finish';
 return currency(v)+`<section class="card"><h2>${finish?'이 생애 마무리':'금분세수'}</h2>
 <p>${finish?'이미 남긴 성공을 기록하고 이 생애를 마칩니다.':'은원을 정리한 성공을 기록합니다. 성공 뒤에도 이 생애를 이어갈 수 있습니다.'}</p>
 <div class="row">${btn('계속 지내기','cancel')}${btn(finish?'생애 마무리 확정':'금분세수 확정',review,'primary')}</div></section>`;
}
function recordScreen(v){const draft=displayedLoadout();return `<h2>배움과 인연</h2><p>주 스승 · <strong>${esc(v.mentor.name)}</strong></p><p class="muted">체질 · ${esc(v.trait)}<br>기예 · ${v.assists.length?v.assists.map(esc).join(' · '):'아직 배우지 않음'}<br>기반 경험 ${v.xp} · ${v.realm}<br>은거 고수 인연 ${v.npc}</p>
 <section class="ua-applied"><h3>적용 중 구성</h3>${configurationSummary(loadoutPreview(store.state,v.loadout))}</section>
 <form id="loadout" class="ua-draft"><h3>구성 편집</h3>
 <p class="ua-draft-status" role="status">${editingLocked()?(busy?'저장 중 · 이 후보의 편집을 잠갔습니다.':store.pending?.command.type==='loadout'?'재시도 대기 · 아래 후보를 그대로 저장합니다.':'저장 확인 전에는 편집할 수 없습니다.'):loadoutDraft?'편집 중 · 아직 적용되지 않았습니다.':'적용 중 구성과 같습니다.'}</p>
 <label>주력 무공<select name="primary" aria-describedby="primary-mastery">${v.skills.map(s=>`<option value="${s.id}" data-mastery="${s.mastery}" data-cost="${s.cost??''}" data-basic="${!!s.basic}" data-affordable="${s.affordable!==false}" ${s.id===draft.primary?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
 <p id="primary-mastery"></p>
 <p class="muted">보조 공격 무공 · 배운 개수만으로 불이익을 받지 않습니다.</p>
 ${v.skills.filter(s=>!s.basic).map(s=>`<label class="row"><input class="fit" type="checkbox" name="aux" value="${s.id}" ${draft.aux.includes(s.id)?'checked':''}><span>${esc(s.name)}${v.qi?` · 내공 <strong>${s.cost}</strong>${s.affordable?'':' · 현재 잔량 부족'}`:''}</span></label>`).join('')}
 <div class="ua-draft-preview">${configurationSummary(loadoutPreview(store.state,draft))}</div>
 <p>적용하면 다음 새 전투부터 사용합니다. 저장된 전투 재생에는 소급하지 않습니다.</p>
 <p class="ua-error">${esc(error)}</p><button class="wide" type="submit" data-focus="apply-loadout">공격 구성 적용</button></form>
 <div class="divider"><h3>도감의 단서</h3>${v.clues.length?`<p class="muted">${v.clues.map(esc).join(' · ')}</p>`:'<p class="empty">앞으로 만날 일들이 기록됩니다.</p>'}</div>`;}
function mapScreen(v){
 return `${storyPanel(v)}<h2>강호 약도</h2>${schoolMap(mapOrigin??v.origin,v.origin,v.origins)}
 <h3>문파 해금</h3><p>일반 문파 · ${v.unlocks.includes('F-NORMAL')?'해금':'잠김 · 실제 접전 결과 필요'}</p>
 <p>명문 · ${v.unlocks.includes('F-POPULAR')?'해금':'잠김 · 의뢰 단계 '+v.quest+'/2'}</p>
 <p class="notice">${v.threat.resolved?'이번 생애의 핵심 위협을 해결했습니다.':v.threat.occurred?'핵심 위협이 남아 있습니다. 강적 도전에서 다시 맞설 수 있습니다.':'회차의 핵심 위협은 아직 드러나지 않았습니다.'}</p>
 ${v.debt.length?`<p class="muted">남은 은원 · ${v.debt.map(esc).join(', ')}</p>`:''}`;
}
function confirmation(v){
 const {type,action,target,choice}=battleConfirm;
 const eventChoice=v.pending?.choices.find(entry=>entry.id===choice);
 const comparison=type==='choose'?eventChoice?.risk:v.battleRisks[target];
 if(!comparison)return '';
 return currency(v)+`<section class="card battle-confirm"><h2>${esc(comparison.enemy)} · 생사결</h2>
 ${type==='choose'?`<p>${esc(eventChoice.label)}</p>`:`<p>${v.actions.find(entry=>entry.id===action).months}개월 · 선지출 0 재화. 시작 후 행동을 바꿀 수 없습니다.</p>`}
 ${battleRisk(comparison)}<div class="row">${btn('돌아가기','battle-cancel')}${btn('생사결 확정','battle-apply','danger')}</div></section>`;
}
const inspectInventory=()=>`<div class="row">${btn('소지품 보기','tab-inventory')}${btn('강호 약도','tab-map')}</div>`;
function journeyScreen(v){
 return currency(v)+character(v)+`<section class="card"><h2>${esc(v.active.name)}</h2>
 ${v.active.masterySubject?`<p>수련 대상 · <strong>${esc(v.active.masterySubject)}</strong></p>`:''}
 ${v.age>=50||v.body==='심한 부상'?`<p class="notice">${esc(v.warning)}</p>`:''}
 <progress class="journey-progress" aria-label="여정 진행" value="${v.active.elapsed}" max="${v.active.duration}"></progress>
 ${v.story?.offers.some(o=>o.status==='accepted')?storyPanel(v):''}
 ${v.result?.battle?battlePanel(v):''}${btn('여정 계속','advance','primary wide')}${v.actionSummary?`<details class="ua-detail"><summary>진행 중 전체 성과</summary>${wholeSummary(v.actionSummary)}</details>`:''}${inspectInventory()}</section>`;
}
function eventScreen(v){
 const e=v.pending;
 return currency(v)+`<section class="card event-card">${e.id==='A-001'?image('UI-ILL-A001','event-art'):''}
 <h2>${esc(e.name)}</h2><p>${esc(e.text)}</p>
 <div class="choices">${e.choices.map(c=>`<div class="event-choice">${c.risk?battleRisk(c.risk):''}<button class="wide" data-ui="${c.risk&&c.risk.mode!=='duel'?'confirm-event':'choose'}" data-id="${esc(c.id)}" ${c.allowed?'':'disabled'}>${esc(c.label)}
 ${c.extraMonths?`<small>기간 +${c.extraMonths}개월</small>`:''}
 ${c.allowed?'':`<small>${esc(c.reason)}</small>`}</button></div>`).join('')}</div>${inspectInventory()}</section>`;
}
function battlePanel(v){
 if(v.result.battle.resources)return resourceBattlePanel(v.result.battle,btn);
 return `<div><canvas width="256" height="144" aria-label="도트 자동 전투 장면" role="img"></canvas><p class="battle-caption muted">이미 확정한 전투를 재생합니다.</p><div class="row">${btn('연출 생략','skip')}${btn('느리게 보기','slow')}</div><details><summary>실제 발동 무공과 전투 원인</summary><p class="muted">${esc(v.result.battle.reason)}</p><ol class="muted">${v.result.battle.turns.map(t=>`<li>${t.round}합 · ${esc(t.skill)} · 피해 ${t.damage} / 피격 ${t.received}</li>`).join('')}</ol></details></div>`;
}
function resultScreen(v){
 const result=v.result,battle=result?.battle,weapon=battle?.weapon;
 const outcome={win:'승리',loss:'패배',escape:'도주',mutual:'동반 사망'};
 const skill=v.skills.find(s=>s.id===v.loadout.primary);
 const delta=result?.completionMoney??0;
 const next=situation({...v,phase:'home'});
 const changes=announcement.length?announcement:result?.changes??[];
 return currency(v)+`<section class="card result-card"><h2>${esc(result?.title||'행동 결과')}${battle?' · '+outcome[battle.outcome]:''}</h2>
 ${battle?combatSummary(battle):wholeSummary(result?.actionSummary)}
 ${nextPanel(v)}
 ${battle?battlePanel(v):v.guidance?.active.includes('learning')?image('UI-ICO-LEARNING','learning-mark'):''}
 <details class="ua-detail ua-last"><summary>마지막 변화와 지급 기록</summary><p>마지막 저장 전이의 변화입니다. 전체 성과에 더하지 않습니다.</p><div class="result-tags"><span class="badge">현재 재화 ${number(v.money)}</span>
 ${delta?`<span class="badge">완료 보수 +${delta} 재화</span>`:''}
 ${result?.paidMoney?`<span class="badge">선지출 −${result.paidMoney} 재화</span>`:''}
 ${skill?`<span class="badge">현재 숙련 ${skill.mastery}</span>`:''}<span class="badge">${esc(v.body)}</span>
 ${(result?.itemGains??[]).map(g=>`<span class="badge">${esc(g.name)} +${g.quantity}개</span>`).join('')}
 ${weapon?`<span class="badge">${esc(weapon.name)} · 공격력 +${weapon.attack} · 내구 ${weapon.startDurability} → ${weapon.endDurability}</span>`:''}
 ${changeTags(changes.filter(entry=>
  !(entry.label==='재화'&&delta)&&entry.label!==weapon?.name+' 내구'&&!(result?.itemGains??[]).some(g=>entry.label===g.name+' 보유')))}</div></details>
 ${battle&&result?.actionSummary?`<details class="ua-detail"><summary>행동 전체 성과</summary>${wholeSummary(result.actionSummary)}</details>`:''}
 <p>${esc(battle?.reason||result?.text)}</p>
 ${guidancePanel(v)}
 ${storyResult(v)}
 ${btn('기록 확인 · 홈으로','ack','primary wide')}
 ${next?`<p class="muted">홈에서 다음 선택을 살펴보세요. ‘${esc(next.label)}’</p>`:''}
 <details><summary>자세히</summary>${battle?`<p>${esc(result.text)}</p>`:''}${logs(v)}</details>
 ${inspectInventory()}</section>`;
}
const outcomes={win:'승리',loss:'패배',escape:'도주',mutual:'동반 사망'};
function graceScreen(v){
 if(review!=='grace-end')return currency(v)+rejuvenation(v,{grace:true})+wholeSummary(v.actionSummary);
 return currency(v)+`<section class="card"><h2>이 생애를 마칠까요?</h2><p>반로환동 없이 지금까지의 여정을 마칩니다.</p><div class="row">${btn('방법 비교로 돌아가기','grace-back')}${btn('생애 마무리 확정','declineGrace','danger')}</div></section>`;
}
function endedScreen(v){
 const ending={natural:'자연의 흐름으로 생애가 끝났습니다.',battle:'전투에서 생애가 끝났습니다.',retired:'스스로 이 생애를 마무리했습니다.'}[v.ending];
 const battle=v.ending==='battle'?v.result?.battle:null,record=v.history.at(-1);
 const lastAction=record?.lastAction??(v.result?.actionId?v.actions.find(a=>a.id===v.result.actionId)?.name:null);
 if(!recapOpen)return currency(v)+`<section class="card ending"><h2>생애의 마침표</h2>
 ${lastAction?`<p>마지막 행동 · ${esc(lastAction)}</p>`:''}
  ${battle?`<h3>${esc(battle.enemy)} · ${outcomes[battle.outcome]}</h3>`:''}
 <p class="notice">${ending}</p>${wholeSummary(record?.actionSummary)}${btn('회고 보기','open-recap','primary wide')}${battle?combatSummary(battle)+battlePanel(v):''}</section>`;
 return currency(v)+`<section class="card intro"><h2>${esc(v.name)}의 발자취</h2><p>마지막 경지 ${esc(v.realm)} · 생애 기록 ${v.history.length}회</p>
 <p>${v.success==='retirement'?'금분세수의 성공을 남겼습니다.':v.success==='conquest'?'승리하고 생존해 정복의 성공을 남겼습니다.':'발견과 해금은 다음 생애에도 남습니다.'}</p></section>
 ${v.recapQuote?`<blockquote class="notice">${esc(v.recapQuote)}</blockquote>`:''}
 <section class="card"><h2>다시 강호로</h2><p>해금·도감·생애 기록을 이어갑니다. 능력과 재화는 새로 시작합니다.</p>
 <div class="choices">${btn('새 생애 · 문파 고르기','new-life-map','primary')}${btn('기억을 품고 회귀','review-regression')}${btn('마지막 순간 돌아보기','close-recap')}</div>
 ${review==='regression'?`<section class="item-confirm"><h3>이 생애의 기억을 품고 회귀할까요?</h3><div class="row">${btn('돌아가기','cancel-regression')}${btn('회귀 확정','regress','primary')}</div></section>`:''}</section>
 ${changeHistory(v)}<details class="card recap-details"><summary>기억할 선택과 인연</summary>${promiseHistory({story:record?.story})}${logs(v)}</details>`;
}
function logs(v){return `<ul class="log">${v.log.slice(-40).reverse().map(x=>`<li><small>${16+Math.floor(x.month/12)}세 ${x.month%12}개월</small>${esc(x.text)}</li>`).join('')}</ul>`;}
async function perform(command){
 if(busy||error)return;
 const keepFocus=command.type==='loadout'?'[data-focus="apply-loadout"]':document.activeElement?.dataset.ui?focusSelector(document.activeElement):'h2';
 announcement=[];
 busy=true;render();
 try{
  const beforeBattle=store.state?.result?.battle?.id;
  await store.dispatch({...command,id:crypto.randomUUID()});
  committed(command);
  collectAnnouncement();
  const changedBattle=store.state?.result?.battle?.id&&store.state.result.battle.id!==beforeBattle;
  if(['startAction','choose','rejuvenate'].includes(command.type)&&store.state.phase==='journey'&&!changedBattle){
   await store.dispatch({type:'advance',id:crypto.randomUUID()});
   collectAnnouncement();
  }
 }catch(e){error=e.message;}finally{busy=false;render();announceChanges();focusPage(error?'[data-ui="retry"],[data-ui="reload"]':keepFocus);}
}
function announceChanges(){
 const region=document.querySelector('#change-status');
 region.textContent='';
 if(!error&&announcement.length){
  const text=announcement.map(({label,from,to})=>`${label} ${from}에서 ${to}`).join(', ');
  const announced=announcement;
  requestAnimationFrame(()=>{if(!busy&&!error&&announcement===announced)region.textContent=text;});
 }
}
function collectAnnouncement(){
 const change=store.state.life.changes?.at(-1);
 if(change?.revision===store.state.revision)announcement.push(...change.changes);
}
function focusPage(selector='h2'){
 const target=app.querySelector(selector)??app.querySelector('h2');
 if(target){
  const next=target.disabled?app.querySelector('h2'):target;
  if(next?.tagName==='H2')next.tabIndex=-1;
  next?.focus();
 }
}
function committed(command){
 const type=command.type;
 if(type==='ack'||type==='startAction'||type==='acceptOffer'||type==='newLife'||type==='rejuvenate'){currentTab='home';group=null;}
 if(type==='ack'&&command.destination&&store.state.phase==='home'){
  if(['record','inventory'].includes(command.destination))currentTab=command.destination;else group=command.destination;
 }
 if(type==='offerDecision'&&command.decision==='defer'){currentTab='home';group=null;}
 if(type==='newLife'){item=null;itemConfirm=null;mapOrigin=null;recapOpen=false;startingNew=false;configuring=false;}
 if(['loadout','newLife','startAction','acceptOffer'].includes(type))loadoutDraft=null;
 if(['retire','finish','rejuvenate','declineGrace','newLife'].includes(type))review=null;
 if(type==='startAction'||type==='choose')battleConfirm=null;
 if(type==='repairWeapon'||type==='useHerb'||type==='useMedicine')itemConfirm=null;
}
function focusSelector(el){
 const action=el.dataset.ui,id=el.dataset.id;
 if(el.closest('.current-situation'))return '.current-situation button';
 const target=el.dataset.target;
 return `[data-ui="${CSS.escape(action)}"]${id?`[data-id="${CSS.escape(id)}"]`:''}${target?`[data-target="${CSS.escape(target)}"]`:''}`;
}
function bind(){
 app.onkeydown=e=>{
  if(e.key==='Escape'&&battleConfirm&&!busy&&!error){e.preventDefault();app.querySelector('[data-ui="battle-cancel"]')?.click();}
 };
 const setupForm=app.querySelector('#setup');if(setupForm)bindSetup(setupForm);
 const loadout=app.querySelector('#loadout');
 if(loadout){
  const primary=loadout.elements.primary;
  const showMastery=()=>{const selected=primary.selectedOptions[0],d=selected.dataset;loadout.querySelector('#primary-mastery').textContent=
   selected.textContent+(d.cost!==''?` · 발동 비용 ${d.cost} · 현재 내공 ${store.state.life.qi.current}`:'')+
   ' · '+(d.basic==='true'?'삼재검법 기초 숙련 ':'숙련 ')+d.mastery+(d.basic==='true'?' · 내공 소모 없음 · 낮은 피해':d.affordable==='false'?' · 현재 잔량 부족, 구성은 가능':'');};
  showMastery();
  loadout.addEventListener('change',()=>{
   if(editingLocked()){
    const draft=displayedLoadout();primary.value=draft.primary;
    for(const box of loadout.querySelectorAll('[name="aux"]'))box.checked=draft.aux.includes(box.value);
    showMastery();return;
   }
   const f=new FormData(loadout),candidatePrimary=f.get('primary');
   loadoutDraft={primary:candidatePrimary,aux:f.getAll('aux').filter(id=>id!==candidatePrimary)};
   for(const box of loadout.querySelectorAll('[name="aux"]')){if(box.value===candidatePrimary)box.checked=false;box.disabled=box.value===candidatePrimary;}
   loadout.querySelector('.ua-draft-status').textContent='편집 중 · 아직 적용되지 않았습니다.';
   loadout.querySelector('.ua-draft-preview').innerHTML=configurationSummary(loadoutPreview(store.state,loadoutDraft));
   showMastery();
  });
  for(const box of loadout.querySelectorAll('[name="aux"]'))box.disabled=box.value===primary.value;
 }
 app.querySelector('#loadout')?.addEventListener('submit',e=>{e.preventDefault();if(editingLocked())return;const f=new FormData(e.currentTarget),primary=f.get('primary');perform({type:'loadout',primary,aux:f.getAll('aux').filter(x=>x!==primary)});});
 app.querySelector('#battle-round')?.addEventListener('change',e=>replayBattle(app.querySelector('canvas'),store.state.result.battle,{round:Number(e.target.value)}));
 app.querySelectorAll('[data-ui]').forEach(el=>el.addEventListener('click',async()=>{
  const a=el.dataset.ui,id=el.dataset.id;
  if(a==='retry'){if(busy)return;let retried;try{busy=true;error='';retried=store.pending.command;await store.retry();committed(retried);collectAnnouncement();}catch(e){error=e.message;}finally{busy=false;render();announceChanges();focusPage(error?'[data-ui="retry"],[data-ui="reload"]':retried?.type==='loadout'?'[data-focus="apply-loadout"]':'h2');}return;}
  if(a==='reload'){if(busy)return;try{busy=true;store.blocked=null;store.pending=null;await (store.db?store.read():store.open());error='';item=null;battleConfirm=null;review=null;announcement=[];loadoutDraft=null;if(store.state?.phase!=='ended')startingNew=false;}catch(e){error=e.message;}finally{busy=false;render();focusPage();}return;}
  if(error||busy)return;
  announcement=[];document.querySelector('#change-status').textContent='';
  if(a==='school'){
   if(!store.state||startingNew)setupOrigin=id;
   else mapOrigin=id;
   render();focusPage(focusSelector(el));
  }
  else if(a==='school-select'){
   const same=setup.origin===setupOrigin;
   setup={...setup,origin:setupOrigin,mentor:same?setup.mentor:MENTORS.find(entry=>entry.origin===setupOrigin).id};
   configuring=true;render();focusPage();
  }
  else if(a==='setup-map'){
   setup={...setup,...Object.fromEntries(new FormData(el.closest('form')))};
   configuring=false;render();focusPage(`[data-ui="school"][data-id="${setupOrigin}"]`);
  }
  else if(a==='setup-cancel'){startingNew=false;configuring=false;render();focusPage('[data-ui="new-life-map"]');}
  else if(a==='new-life-map'){
   setup={name:'',trait:'random',inclination:'inner'};setupOrigin=null;configuring=false;startingNew=true;render();focusPage();
  }
  else if(a==='start-action')perform({type:'startAction',action:id,target:el.dataset.target});
  else if(a==='guide-next')perform({type:'ack',destination:id,guideRead:publicView(store.state).guidance.active});
  else if(a==='result-next')perform({type:'ack',destination:id});
  else if(a==='story-next')perform({type:'ack',destination:'world'});
  else if(a==='offer-accept')perform({type:'acceptOffer',offerId:id});
  else if(a==='offer-decline')perform({type:'offerDecision',offerId:id,decision:'decline'});
  else if(a==='offer-defer'){
   await perform({type:'offerDecision',offerId:id,decision:'defer'});
   if(!error)focusPage('[data-ui="group"][data-id="world"]');
  }
  else if(a==='guide-fold'){
   await perform({type:'guidance',collapsed:el.dataset.collapsed==='true',read:publicView(store.state).guidance.active});
   if(!error)focusPage('[data-ui="guide-next"][data-id="record"]');
  }
  else if(a==='guide-help-read'){
   await perform({type:'guidance',collapsed:false,read:Object.keys(publicView(store.state).guidance.facts)});
   if(!error){app.querySelector('.guidance-help').open=true;focusPage('[data-ui="guide-help-read"]');}
  }
  else if(a==='confirm-battle'||a==='confirm-event'){
   returnFocus=focusSelector(el);
   battleConfirm=a==='confirm-battle'?{type:'startAction',action:id,target:el.dataset.target}:{type:'choose',choice:id};
   render();focusPage();
  }
  else if(a==='battle-cancel'){battleConfirm=null;render();focusPage(returnFocus);}
  else if(a==='battle-apply')perform(battleConfirm);
  else if(a==='dismiss-notice'){
   const next=el.closest('.change-notice').nextElementSibling?.matches('.activity-grid')?'.activity-grid button':'[data-ui="advance"],[data-ui="back-item"],[data-ui="open-recap"]';
   render();focusPage(next);
  }
  else if(a==='review'){returnFocus=focusSelector(el);review=id;render();focusPage();}
  else if(a==='cancel'||a==='renewal-back'){review=null;render();focusPage(returnFocus||'h2');}
  else if(a==='grace-review'){review='grace-end';render();focusPage();}
  else if(a==='grace-back'){review=null;render();focusPage('[data-ui="grace-review"]');}
  else if(a==='open-recap'||a==='close-recap'){recapOpen=a==='open-recap';review=null;render();focusPage();}
  else if(a==='review-regression'||a==='cancel-regression'){review=a==='review-regression'?'regression':null;render();focusPage(review?'[data-ui="cancel-regression"]':'[data-ui="review-regression"]');}
  else if(a==='group'){returnFocus=focusSelector(el);group=id;render();focusPage();}
  else if(a==='back-group'){const previous=group;group=null;render();focusPage(`.activity-grid [data-id="${previous}"]`);}
  else if(a.startsWith('tab-')){currentTab=a.slice(4);group=null;render();focusPage(store.state.phase==='home'?focusSelector(el):'h2');}
  else if(a==='back-phase'){const previous=currentTab;currentTab='home';render();focusPage(`[data-ui="tab-${previous}"]`);}
  else if(a.startsWith('items-')){itemTab=a.slice(6);render();focusPage(focusSelector(el));}
  else if(a==='item'){previousPage={tab:currentTab,selector:focusSelector(el)};item=id;itemConfirm=null;render();focusPage();}
  else if(a==='compare-item'){item=id;itemConfirm=null;render();focusPage();}
  else if(a==='back-item'){item=null;itemConfirm=null;currentTab=previousPage.tab;render();focusPage(previousPage.selector);}
  else if(a==='item-use'||a==='item-repair'){itemConfirm=a.slice(5);render();focusPage('[data-ui="item-cancel"]');}
  else if(a==='item-cancel'){const cancelled=itemConfirm;itemConfirm=null;render();focusPage(`[data-ui="item-${cancelled}"]`);}
  else if(a==='item-apply'){
   if(itemConfirm==='use')perform({type:item==='CON-HERB'?'useHerb':'useMedicine',itemId:item});
   else if(itemConfirm==='repair'){
    const w=publicView(store.state).inventory.weapons.find(w=>w.id===item);
    perform({type:'repairWeapon',instanceId:item,cost:w.repairCost});
   }
  }
  else if(a==='item-equip')perform({type:'equipWeapon',instanceId:item});
  else if(a==='choose')perform({type:'choose',choice:el.dataset.id});
  else if(a==='skip'){
   if(store.state.result?.battle?.resources)replayBattle(app.querySelector('canvas'),store.state.result.battle,{finish:true});
   else stopScene();
   app.querySelector('.battle-caption').textContent='연출을 생략했습니다. 기록된 결과와 보상은 같습니다.';
  }
  else if(a==='fast')replayBattle(app.querySelector('canvas'),store.state.result.battle,{speed:4});
  else if(a==='slow'){const v=publicView(store.state);replayBattle(app.querySelector('canvas'),v.result.battle,{speed:.5});}
  else if(a.startsWith('rejuvenate-'))perform({type:'rejuvenate',method:a.slice(11)});
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
