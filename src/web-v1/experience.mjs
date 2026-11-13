import {artAsset} from './art.mjs';

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
 'WPN-TRAIN':'UI-ITEM-WPN-TRAIN','WPN-FORGED':'UI-ITEM-WPN-FORGED','CON-HERB':'UI-ITEM-HERB'
};

export function image(id,cls='',fallback=''){
 const asset=artAsset(id);
 return asset?`<img class="${cls}" src="${esc(asset.source)}" alt="" width="${asset.width}" height="${asset.height}"${fallback?` data-image-fallback="${esc(fallback)}"`:''}>`:
  fallback?`<span class="${cls} image-fallback" aria-hidden="true">${fallback}</span>`:'';
}
const itemImage=item=>image(itemArt[item.itemId],'item-image',item.itemId==='CON-HERB'?'葉':'劍');
const equipped=v=>v.inventory?.weapons.find(w=>w.equipped);
export function currency(v,caption='재화'){
 const formatted=number(v.money).replaceAll(',',',<wbr>');
 return `<div class="currency"><span>${image('UI-ICO-MONEY','money-icon','銭')}${caption} <strong>${formatted}</strong></span><span class="muted">${v.age}세 · ${esc(v.season)}</span></div>`;
}

export function situation(v){
 if(v.phase!=='home')return null;
 if(v.body!=='안정')return {title:'몸을 추스를 때',label:'휴식·치료 살피기',action:'ACT-05'};
 if(equipped(v)?.durability===0)return {title:'무기를 손볼 때',label:'장착 무기 살피기',item:equipped(v).id};
 if(v.success)return {title:'강호에 이름을 남기다',label:'생애 마무리 살피기',review:'finish'};
 if(v.canRetire)return {title:'금분세수를 앞두고',label:'금분세수 살피기',review:'retire'};
 const targets=v.actions.find(a=>a.id==='ACT-09').targets;
 if(targets.includes('leader'))return {title:'우두머리에게 도전',label:'결전 살피기',action:'ACT-09',target:'leader'};
 if(v.threat.occurred&&!v.threat.resolved&&targets.includes('threat'))return {title:'강호에 닥친 위협',label:'위협 대응 살피기',action:'ACT-09',target:'threat'};
 if(v.debt.length)return {title:'남은 은원을 풀다',label:'지역 의뢰 살피기',action:'ACT-03'};
 if(v.quest===1)return {title:'명문의 시험이 남았다',label:'시험 살피기',action:'ACT-08'};
 if(!v.knowsMentorSkill)return {title:'사부에게 배울 때',label:'후속 검법 배우기',action:'ACT-02'};
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
  ${weapon?`<button class="equipped-preview" data-ui="item" data-id="${esc(weapon.id)}">${itemImage(weapon)}
   <span><strong>${esc(weapon.name)}</strong> <span>공격력 +${weapon.effective}</span> ${weaponGauge(weapon)}
    ${weapon.needsRepair?`<span class="durability durability-low">${weapon.durability===0?'날이 무뎌짐':'내구도가 낮음'}</span>`:''}</span></button>`:''}
 </section>`;
}

export function home(v){
 const next=situation(v);
 const marker=next.action?`UI-ICO-${next.action}`:next.item?'UI-ICO-CODEX':next.review?'UI-ICO-CHRONICLE':'UI-ICO-MAP';
 const attrs=next.action?`data-ui="action" data-id="${next.action}"${next.target?` data-target="${next.target}"`:''}`:
  next.item?`data-ui="item" data-id="${esc(next.item)}"`:next.review?`data-ui="review" data-id="${next.review}"`:
  `data-ui="group" data-id="${next.group}"`;
 return currency(v)+character(v)+`<section class="current-situation"><h2>${image(marker,'menu-icon')}${next.title}</h2>
  <button class="primary wide" ${attrs}>${next.label}</button></section>
  <section class="activity-grid" aria-label="활동 분류">${groups.map(g=>
   `<button data-ui="group" data-id="${g.id}">${image(g.icon,'menu-icon')}<span>${g.name}</span></button>`).join('')}</section>`+
  bottomNav('home');
}

export function actionGroup(v,id){
 const group=groups.find(g=>g.id===id);
 return currency(v)+`<section class="card"><button data-ui="back-group">홈으로</button><h2>${group.name}</h2><div class="actions">
  ${group.actions.map(id=>{
   const a=v.actions.find(x=>x.id===id);
   return `<button class="action group-action" data-ui="action" data-id="${id}">${image('UI-ICO-'+id,'menu-icon')}
    <strong>${esc(a.name)}</strong><span class="duration">${a.months}개월</span></button>`;
  }).join('')}</div></section>`+bottomNav('home');
}

export function inventory(v,tab){
 const bag=v.inventory;
 let list='<p class="empty">장비·영약 보관은 다음 생애부터 이용할 수 있습니다.</p>';
 if(bag){
  const items=tab==='herb'?(bag.herb.quantity?[bag.herb]:[]):bag.weapons;
  list=items.length?`<div class="item-grid">${items.map(item=>
   `<button class="item-card" data-ui="item" data-id="${esc(item.id||item.itemId)}">${itemImage(item)}<strong>${esc(item.name)}</strong>
    ${item.quantity!==undefined?`<span>${item.quantity}개</span>`:`<span>공격력 +${item.effective}</span>${weaponGauge(item)}${item.equipped?'<span class="badge">장착 중</span>':''}`}</button>`).join('')}</div>`:
   '<p class="empty">보관한 영약 없음</p>';
 }
 return currency(v)+`<section class="card"><h2>소지품</h2><div class="row">
  <button data-ui="items-weapon" aria-pressed="${tab==='weapon'}">무기</button>
  <button data-ui="items-herb" aria-pressed="${tab==='herb'}">영약</button></div>
  ${bag?.blocked?`<p class="notice">${esc(bag.blocked)}</p>`:''}${list}</section>`;
}

export function itemDetail(v,id,confirmation){
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
   ${reason?`<p class="notice">${esc(reason)}</p>`:''}
   ${confirmation==='use'&&!reason?`<section class="item-confirm" aria-label="영초 사용 확인">
    <h3>영초 1개를 사용할까요?</h3><p>사용 뒤 ${item.quantity-1}개 · 수명 ${item.months}개월 연장</p>
    <div class="row"><button data-ui="item-cancel">취소</button><button class="primary" data-ui="item-apply">영초 사용 확정</button></div></section>`:
    `<button class="primary wide" data-ui="item-use" ${reason?'disabled':''}>사용 살피기</button>`}
   </section>`;
 }
 const current=equipped(v),delta=item.effective-current.effective;
 const repairBlock=bag.blocked||(item.repairCost===0?'이미 내구도가 가득 찼습니다.':v.money<item.repairCost?'수리할 재화가 부족합니다.':'');
 return currency(v)+`<section class="card item-detail"><button data-ui="back-item">돌아가기</button>${itemImage(item)}
  <h2>${esc(item.name)}</h2>${item.equipped?'<span class="badge">장착 중</span>':''}
  <p>무기 공격력 +${item.attack} · 현재 보정 +${item.effective}</p>${weaponGauge(item)}
  ${item.durability===0?'<p class="notice">날이 무뎌졌습니다. 기본 공격으로 전투할 수 있습니다.</p>':item.needsRepair?'<p class="notice">내구도가 낮습니다.</p>':''}
  <p>현재 장착 ${esc(current.name)} +${current.effective} · 교체 시 ${delta>=0?'+':''}${delta}</p>
  ${last?.kind==='repair'&&last.instanceId===item.id?`<p class="badge">수리 완료 · 재화 −${number(last.cost)}</p>`:''}
  ${bag.blocked?`<p class="notice">${esc(bag.blocked)}</p>`:''}
  <button data-ui="item-equip" ${item.equipped||bag.blocked?'disabled':''}>이 무기 장착</button>
  <p>완전 수리비 ${number(item.repairCost)} 재화</p>
  ${repairBlock?`<p class="notice">${esc(repairBlock)}</p>`:''}
  ${confirmation==='repair'&&!repairBlock?`<section class="item-confirm" aria-label="수리 확인">
   <h3>${esc(item.name)}을(를) 수리할까요?</h3>
   <p>내구 ${item.durability} → ${item.maxDurability} · 재화 ${number(v.money)} → ${number(v.money-item.repairCost)}</p>
   <div class="row"><button data-ui="item-cancel">취소</button><button class="primary" data-ui="item-apply">수리 확정</button></div></section>`:
   `<button class="primary wide" data-ui="item-repair" ${repairBlock?'disabled':''}>수리 살피기</button>`}</section>`;
}
