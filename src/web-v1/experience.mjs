import {artAsset} from './art.mjs';
import {ECONOMY} from './data.mjs';

export const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const number=value=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:20}).format(value);
export const groups=[
 {id:'training',name:'수련·배움',icon:'UI-ICO-LEARNING',actions:['ACT-01','ACT-02','ACT-07','ACT-10']},
 {id:'world',name:'강호 활동',icon:'UI-ICO-ACT-04',actions:['ACT-03','ACT-04','ACT-08']},
 {id:'duel',name:'비무·도전',icon:'UI-ICO-ACT-06',actions:['ACT-06','ACT-09']},
 {id:'rest',name:'회복',icon:'UI-ICO-ACT-05',actions:['ACT-05']}
];
const destinations=[
 ['home','홈','UI-ICO-HOME'],['record','무공','UI-ICO-LEARNING'],['inventory','소지품','UI-ICO-CODEX'],
 ['map','강호','UI-ICO-MAP'],['chronicle','기록','UI-ICO-CHRONICLE']
];
const itemArt={
 'WPN-TRAIN':'UI-ITEM-WPN-TRAIN','WPN-FORGED':'UI-ITEM-WPN-FORGED','CON-HERB':'UI-ITEM-HERB',
 'CON-QI-RECOVER':'UI-ITEM-HERB','CON-QI-CAPACITY':'UI-ITEM-HERB'
};

export function image(id,cls='',fallback=''){
 const asset=artAsset(id);
 return asset?`<img class="${cls}" src="${esc(asset.source)}" alt="" width="${asset.width}" height="${asset.height}"${fallback?` data-image-fallback="${esc(fallback)}"`:''}>`:
  fallback?`<span class="${cls} image-fallback" aria-hidden="true">${fallback}</span>`:'';
}
const itemImage=(item,fallback='')=>image(itemArt[item.itemId],'item-image',fallback);
const equipped=v=>v.inventory?.weapons.find(w=>w.equipped);
export function currency(v,caption='재화'){
 const formatted=number(v.money).replaceAll(',',',<wbr>');
 return `<div class="currency"><span>${image('UI-ICO-MONEY','money-icon','銭')}${caption} <strong>${formatted}</strong></span><span class="muted public-time">${v.age}세 ${v.ageMonths}개월 · ${esc(v.season)}${v.active?`<br>${esc(v.active.name)} ${v.active.elapsed}/${v.active.duration}개월`:''}</span></div>`;
}

const targetLabels={inner:'내공 수련',outer:'외공 단련',skill:'주력 숙련',assist:'기예 익히기',breathing:'운기 회복'};
export function battleRisk(value){
 const mode=value.mode==='duel'?'비무':'생사결';
 const consequence=value.mode==='duel'?'패배해도 생존합니다. 부상을 입을 수 있습니다.':
  value.mode==='encounter'?'도주할 수 있습니다. 패배하거나 동반 사망하면 생애가 끝납니다.':'패배하거나 동반 사망하면 생애가 끝납니다.';
 return `<div class="combat-risk ${value.mode==='duel'?'':'combat-life'}"><div class="combat-heading"><span>${image(value.mode==='duel'?'UI-ICO-ACT-06':'UI-ICO-WARNING','menu-icon')}${mode}</span><strong>전력 ${esc(value.level)}</strong></div><p>${consequence}</p><p class="risk-reason">${esc(value.reason)}</p>${value.comparison?`<details><summary>비교 기준</summary><p>${esc(value.comparison)} 상대 최대 생명력 ${value.enemyHp} · 내공 ${value.enemyQi}</p></details>`:''}</div>`;
}
export function actionCard(v,a,{recommended=false,target}={}){
 if(a.id==='ACT-05'&&v.qi)return recoveryCard(v,target);
 const cost=a.id==='ACT-05'&&v.money>=ECONOMY.treatment?ECONOMY.treatment:0;
 const reward=a.id==='ACT-03'?ECONOMY.commission:a.id==='ACT-04'?ECONOMY.escort:0;
 const mentor=a.id==='ACT-02'?(v.knowsMentorSkill&&!v.knowsMentorAssist?'검법을 익혔고, 사부의 기예는 아직 배우지 않았습니다.':!v.knowsMentorSkill?'사부의 후속 검법을 아직 배우지 않았습니다.':''):'';
 const directRisk=a.id==='ACT-06'?v.battleRisks.novice:a.id==='ACT-08'&&v.quest===1&&!v.assists.includes('의술')?v.battleRisks.rival:null;
 const targets=target?[target]:a.targets;
 const buttons=targets.map(id=>{
  const risk=a.id==='ACT-09'?v.battleRisks[id]:null;
  const confirm=risk&&risk.mode!=='duel';
  const label=risk?(confirm?'생사결 살피기':'비무 시작'):targetLabels[id]??(directRisk?'비무 시작':`${a.name} 시작`);
  return `${risk?`<h4>${esc(risk.enemy)}</h4>${battleRisk(risk)}`:''}<button class="primary wide" data-ui="${confirm?'confirm-battle':'start-action'}" data-id="${a.id}" data-target="${id}">${esc(label)}</button>`;
 }).join('');
 return `<div class="action-card">${recommended?'':`<h3>${image('UI-ICO-'+a.id,'menu-icon')}${esc(a.name)}</h3>`}
 ${recommended?'':`<p>${esc(a.desc)}</p>`}
 <p class="action-cost"><strong>${a.months}개월 · 선지출 ${cost} 재화${reward?` · 완료 보수 ${reward} 재화`:''}</strong></p>
 ${a.id==='ACT-05'&&!cost?'<p class="notice">무료 휴식으로는 심한 부상을 치료할 수 없습니다.</p>':''}
 ${directRisk?battleRisk(directRisk):a.id==='ACT-09'||recommended?'':'<p class="muted">돌발 사건의 위험은 대응 전에 안내합니다.</p>'}
 ${a.id==='ACT-07'?`<p class="muted">주력 ${esc(v.skills.find(skill=>skill.id===v.loadout.primary)?.name)} · 사부의 기예 ${esc(v.mentorAssist)}${v.knowsMentorAssist?' (습득함)':''}</p>`:''}
 ${v.qi&&v.loadout.primary==='BASIC'&&['ACT-07','ACT-10'].includes(a.id)?'<p>기본 외공 · <strong>삼재검법 기초 숙련</strong>을 단련합니다.</p>':''}
 <p class="action-restriction">${image('UI-ICO-WARNING','menu-icon')}시작 후 행동을 바꿀 수 없습니다.</p><div class="action-options">${buttons}</div></div>`;
}
function recoveryCard(v,target){
 const choices=target?[target]:['breathing','default'];
 return choices.map(id=>{
  const breathing=id==='breathing',full=v.qi.current===v.qi.max,cost=breathing?0:v.money>=ECONOMY.treatment?ECONOMY.treatment:0;
  return `<div class="action-card"><h3>${breathing?'운기 회복':'휴식 · 치료'}</h3>
   <p class="action-cost"><strong>${breathing?1:6}개월 · 선지출 ${cost} 재화</strong></p>
   <p>${breathing?`완료 시 현재 내공 <strong>${v.qi.current} → ${v.qi.max}</strong>. 심한 부상은 치료하지 않습니다.`:cost?'완료 시 부상을 치료합니다. 내공 회복과 별개입니다.':'무료 휴식은 가벼운 상처를 돌봅니다. 심한 부상에는 치료가 필요합니다.'}</p>
   ${breathing&&full?'<p class="notice">내공이 이미 가득 찼습니다.</p>':''}
   <p class="action-restriction">${image('UI-ICO-WARNING','menu-icon')}시작 후 행동을 바꿀 수 없습니다.</p>
   <button class="primary wide" data-ui="start-action" data-id="ACT-05" data-target="${id}" ${breathing&&full?'disabled':''}>${breathing?'운기 회복 시작':'휴식 · 치료 시작'}</button></div>`;
 }).join('');
}

export function situation(v){
 if(v.phase!=='home')return null;
 if(v.body!=='안정')return {title:'몸을 추스를 때',label:'휴식·치료 살피기',action:'ACT-05',...(v.qi?{target:'default'}:{})};
 if(equipped(v)?.durability===0)return {title:'무기를 손볼 때',label:'장착 무기 살피기',item:equipped(v).id};
 if(v.success)return {title:'강호에 이름을 남기다',label:'생애 마무리 살피기',review:'finish'};
 if(v.canRetire)return {title:'금분세수를 앞두고',label:'금분세수 살피기',review:'retire'};
 if(v.qi&&v.qi.current<Math.max(4,v.skills.find(k=>k.id===v.loadout.primary)?.cost??4))return {title:'운기로 내공을 채울 때',label:'운기 회복',action:'ACT-05',target:'breathing'};
 const targets=v.actions.find(a=>a.id==='ACT-09').targets;
 if(targets.includes('leader'))return {title:'우두머리에게 도전',label:'결전 살피기',action:'ACT-09',target:'leader'};
 if(v.threat.occurred&&!v.threat.resolved&&targets.includes('threat'))return {title:'강호에 닥친 위협',label:'위협 대응 살피기',action:'ACT-09',target:'threat'};
 if(v.debt.length)return {title:'남은 은원을 풀다',label:'지역 의뢰 살피기',action:'ACT-03'};
 if(v.guidance?.practiceSuggested)return {title:'배운 검법을 시험해 볼 때',label:'교류 비무 살피기',group:'duel'};
 if(v.quest===1)return {title:'명문의 시험이 남았다',label:'시험 살피기',action:'ACT-08'};
 if(!v.knowsMentorSkill)return {title:'사부의 후속 검법을 익힐 때',label:'후속 검법 배우기',action:'ACT-02'};
 if(!v.knowsMentorAssist)return {title:'배움의 폭을 넓히다',label:'사부의 기예 배우기',action:'ACT-02'};
 return {title:'다음 발걸음을 정하다',label:'강호 활동 보기',group:'world'};
}

export function bottomNav(tab){
 return `<nav class="bottom-nav" aria-label="강호 메뉴">${destinations.map(([id,name,icon])=>
  `<button data-ui="tab-${id}" ${tab===id?'aria-current="page"':''}>${image(icon,'menu-icon')}<span>${name}</span></button>`).join('')}</nav>`;
}

export function weaponGauge(weapon){
 return `<span class="durability ${weapon.needsRepair?'durability-low':''}"><progress aria-label="무기 내구도" value="${weapon.durability}" max="${weapon.maxDurability}"></progress><span>내구 ${weapon.durability}/${weapon.maxDurability}</span></span>`;
}
export function character(v){
 const weapon=equipped(v),skill=v.skills.find(s=>s.id===v.loadout.primary);
 return `<section class="character-scene" aria-label="캐릭터">
  ${image('UI-BG-HOME','home-background')}
  <div class="character-figure">${image('UI-CHR-PLAYER','home-character','武')}</div>
  <div class="character-info"><p class="kicker">${esc(v.originName)} · ${esc(v.realm)}</p>
   <h2 class="name">${esc(v.name)}</h2>
   <span class="badge ${v.body==='안정'?'':'warn'}">${esc(v.body)}</span>
   ${v.rejuvenated?'<span class="badge warn">육체 약화</span>':''}
   <p class="main-skill">${esc(skill?.name)}</p>
   <p class="reputation">명성 ${number(v.fame)} · 문파 신뢰 ${number(v.trust)}</p>
  </div>
  ${weapon?`<button class="equipped-preview" data-ui="item" data-id="${esc(weapon.id)}">${itemImage(weapon,'劍')}
   <span><strong>${esc(weapon.name)}</strong> <span>공격력 +${weapon.effective}</span> ${weaponGauge(weapon)}
    ${weapon.needsRepair?`<span class="durability durability-low">${weapon.durability===0?'날이 무뎌짐':'내구도가 낮음'}</span>`:''}</span></button>`:''}
 </section>${resourceSummary(v)}`;
}
export function resourceSummary(v){
 return v.qi?`<div class="resource-summary"><label>현재 / 최대 내공 <strong>${v.qi.current} / ${v.qi.max}</strong>
 <progress class="qi-meter" aria-label="현재 내공" value="${v.qi.current}" max="${v.qi.max}"></progress></label>
 <p>최대 생명력 <strong>${v.qi.maxHp}</strong> · ${esc(v.body)}${v.qi.weakened?' · 육체 약화':''}</p></div>`:'';
}

export function home(v,notice=''){
 const next=situation(v);
 const marker=next.action?`UI-ICO-${next.action}`:next.item?'UI-ICO-CODEX':next.review?'UI-ICO-CHRONICLE':'UI-ICO-MAP';
 const attrs=next.item?`data-ui="item" data-id="${esc(next.item)}"`:next.review?`data-ui="review" data-id="${next.review}"`:
  `data-ui="group" data-id="${next.group}"`;
 return currency(v)+character(v)+`<section class="current-situation"><h2>${image(marker,'menu-icon')}${next.title}</h2>
  ${v.age>=50&&v.body!=='심한 부상'?`<p class="notice">${esc(v.warning)}</p>`:''}
  ${next.group==='duel'&&v.guidance?.practiceSuggested?'<p>교류 비무는 패배해도 생존합니다. 부상을 입을 수 있습니다.</p>':''}
  ${next.action?actionCard(v,v.actions.find(a=>a.id===next.action),{recommended:true,target:next.target}):`<button class="primary wide" ${attrs}>${next.label}</button>`}</section>${notice}
  <section class="activity-grid" aria-label="활동 분류">${groups.map(g=>
   `<button data-ui="group" data-id="${g.id}">${image(g.icon,'menu-icon')}<span>${g.name}${g.id==='world'&&v.story?.offered?'<span class="offer-badge">새 제안</span>':''}</span></button>`).join('')}</section>`+
  bottomNav('home');
}

export function actionGroup(v,id,extra=''){
 const group=groups.find(g=>g.id===id);
 return currency(v)+`<section class="card"><button data-ui="back-group">홈으로</button><h2>${group.name}</h2>${extra}<div class="actions">
  ${group.actions.map(id=>actionCard(v,v.actions.find(a=>a.id===id))).join('')}</div></section>`+bottomNav('home');
}

export function inventory(v,tab){
 const bag=v.inventory;
 let list='<p class="empty">장비·영약 보관은 다음 생애부터 이용할 수 있습니다.</p>';
 if(bag){
  const items=tab==='herb'?[...(bag.herb.quantity?[bag.herb]:[]),...(bag.medicines??[]).filter(m=>m.quantity>0)]:bag.weapons;
  list=items.length?`<div class="item-grid">${items.map(item=>
   `<button class="item-card" data-ui="item" data-id="${esc(item.id||item.itemId)}">${itemImage(item)}<strong>${esc(item.name)}</strong>
    ${item.quantity!==undefined?`<span>${item.quantity}개</span>${item.effect?`<span>${item.effect==='recover'?'현재 내공 회복':'최대 내공 증가'} +${item.amount}</span>`:''}`:`<span>공격력 +${item.effective}</span>${weaponGauge(item)}${item.equipped?'<span class="badge">장착 중</span>':''}`}</button>`).join('')}</div>`:
   '<p class="empty">보관한 영약 없음</p>';
 }
 return currency(v)+`<section class="card"><h2>소지품</h2><div class="row">
  <button data-ui="items-weapon" aria-pressed="${tab==='weapon'}">무기</button>
  <button data-ui="items-herb" aria-pressed="${tab==='herb'}">영약</button></div>
  ${bag?.blocked?`<p class="notice">${esc(bag.blocked)}</p>`:''}${list}</section>`;
}

export function itemDetail(v,id,confirmation){
 const medicine=v.inventory.medicines?.find(m=>m.itemId===id);
 if(medicine)return medicineDetail(v,medicine,confirmation);
 const bag=v.inventory,herb=id==='CON-HERB';
 const item=herb?bag.herb:bag.weapons.find(w=>w.id===id);
 const last=bag.last;
 if(herb){
  const reason=item.blocked;
  return currency(v)+`<section class="card item-detail">
   <button data-ui="back-item">돌아가기</button>${itemImage(item)}<h2>${esc(item.name)}</h2>
   <p>보관 ${item.quantity}개 · 효험 ${item.used}/${item.uses}회 사용</p>
   <p>사용 시 수명 ${item.months}개월 연장</p>
   ${last?.kind==='use'?`<p class="badge">사용 완료 · 남은 영초 ${last.after}개</p>`:''}
   ${reason?`<p class="notice" id="use-block">${image('UI-ICO-WARNING','menu-icon')}${esc(reason)}</p>`:''}
   ${confirmation==='use'&&!reason?`<section class="item-confirm" aria-label="영초 사용 확인">
    <h3>영초 1개를 사용할까요?</h3><p>사용 뒤 ${item.quantity-1}개 · 수명 ${item.months}개월 연장</p>
    <div class="row"><button data-ui="item-cancel">취소</button><button class="primary" data-ui="item-apply">영초 사용 확정</button></div></section>`:
    `<button class="primary wide" data-ui="item-use" ${reason?'disabled aria-describedby="use-block"':''}>사용 살피기</button>`}
   </section>`;
 }
 const current=equipped(v),delta=item.effective-current.effective;
 const repairBlock=bag.blocked||(item.repairCost===0?'이미 내구도가 가득 찼습니다.':v.money<item.repairCost?'수리할 재화가 부족합니다.':'');
 return currency(v)+`<section class="card item-detail"><button data-ui="back-item">돌아가기</button>${itemImage(item)}
  <h2>${esc(item.name)}</h2>${item.equipped?'<span class="badge">장착 중</span>':''}
  <p>무기 공격력 +${item.attack} · 현재 보정 +${item.effective}</p>${weaponGauge(item)}
  ${item.durability===0?'<p class="notice">날이 무뎌졌습니다. 기본 공격으로 전투할 수 있습니다.</p>':item.needsRepair?'<p class="notice">내구도가 낮습니다.</p>':''}
  <p>현재 장착 ${esc(current.name)} +${current.effective} · 교체 시 ${delta>=0?'+':''}${delta}</p>
  ${bag.weapons.filter(w=>w.id!==item.id).map(w=>`<button data-ui="compare-item" data-id="${esc(w.id)}">${esc(w.name)}과 비교</button>`).join('')}
  ${last?.kind==='repair'&&last.instanceId===item.id?`<p class="badge">수리 완료 · 재화 −${number(last.cost)}</p>`:''}
  ${bag.blocked?`<p class="notice" id="equip-block">${esc(bag.blocked)}</p>`:''}
  <button data-ui="item-equip" ${bag.blocked?'disabled aria-describedby="equip-block"':item.equipped?'disabled':''}>${item.equipped?'이미 장착 중':'이 무기 장착'}</button>
  <p>완전 수리비 ${number(item.repairCost)} 재화</p>
  ${repairBlock?`<p class="notice" id="repair-block">${esc(repairBlock)}</p>`:''}
  ${confirmation==='repair'&&!repairBlock?`<section class="item-confirm" aria-label="수리 확인">
   <h3>${esc(item.name)}을(를) 수리할까요?</h3>
   <p>내구 ${item.durability} → ${item.maxDurability} · 재화 ${number(v.money)} → ${number(v.money-item.repairCost)}</p>
   <div class="row"><button data-ui="item-cancel">취소</button><button class="primary" data-ui="item-apply">수리 확정</button></div></section>`:
   `<button class="primary wide" data-ui="item-repair" ${repairBlock?'disabled aria-describedby="repair-block"':''}>수리 살피기</button>`}</section>`;
}
function medicineDetail(v,item,confirmation){
 const last=v.qi.last?.itemId===item.itemId?v.qi.last:null;
 const applied=last&&item.quantity===0;
 const shown=applied?{current:last.currentBefore,currentAfter:last.currentAfter,max:last.maxBefore,maxAfter:last.maxAfter,
  recovered:last.currentAfter-last.currentBefore,overflow:Math.max(0,last.currentBefore+last.amount-last.maxBefore)}:item;
 return currency(v)+`<section class="card item-detail"><button data-ui="back-item">돌아가기</button>${itemImage(item)}
  <h2>${esc(item.name)}</h2><p><strong>보관 ${item.quantity}개 · 사용 1개 · 0개월 · 재화 0</strong></p>
  <p>${item.effect==='recover'?`현재 내공 +${item.amount} 회복`:`최대 내공 +${item.amount} 증가 · 현재 잔량 유지`}</p>
  <div class="resource-change"><strong>${applied?'사용 완료 · 실제 적용 결과':'사용 시 변화'}</strong><p>현재 내공 <strong>${shown.current} → ${shown.currentAfter}</strong></p><p>최대 내공 <strong>${shown.max} → ${shown.maxAfter}</strong></p>
  ${item.effect==='recover'?`<p>실제 회복 <strong>${shown.recovered}</strong> · 초과 미적용 <strong>${shown.overflow}</strong></p>`:''}</div>
  ${item.blocked?`<p class="notice" id="medicine-block">${image('UI-ICO-WARNING','menu-icon')}${esc(item.blocked)}</p>`:''}
  ${confirmation==='use'&&!item.blocked?`<section class="item-confirm" aria-label="내공 약 사용 확인"><h3>${esc(item.name)} 1개를 사용할까요?</h3>
   <p><strong>사용 뒤 ${item.quantity-1}개</strong> · 위 전후값을 적용합니다.</p><div class="row"><button data-ui="item-cancel">취소</button><button class="primary" data-ui="item-apply">약 사용 확정</button></div></section>`:
   `<button class="primary wide" data-ui="item-use" ${item.blocked?'disabled aria-describedby="medicine-block"':''}>사용 살피기</button>`}</section>`;
}
