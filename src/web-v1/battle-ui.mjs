import {esc} from './experience.mjs';

export function replayControls(button){
 return `<div class="battle-top"><h3>전투 재생</h3><p class="replay-speed badge" role="status">기본 · 1×</p></div><div class="row">${button('빠르게 4×','fast','','aria-pressed="false"')}${button('연출 생략','skip')}</div>`;
}
export function replayReview(button,content=''){
 return `<details class="replay-review"><summary>천천히 · 다시보기 · 합 기록</summary><div class="row">${button('느리게 0.5×','slow','','aria-pressed="false"')}${button('처음부터 다시 보기','replay')}</div>${content}</details>`;
}
export function resourceBattlePanel(battle,button){
 return `<section class="recorded-battle">${replayControls(button)}<p class="muted">반복 공격은 짧게 표시합니다. 공격·자원 기록은 모두 유지됩니다.</p><canvas width="256" height="144" aria-label="기록된 선후공의 도트 전투" role="img"></canvas>
 <div class="battle-resources" aria-label="기록된 합의 자원"></div><p class="battle-caption">저장된 공격 순서로 재생합니다.</p>
 ${replayReview(button,`<label>합 기록 살펴보기<select id="battle-round">${battle.turns.map(t=>`<option value="${t.round}">${t.round}합 · ${t.first==='player'?'내 선공':'상대 선공'}</option>`).join('')}</select></label>`)}
 <details><summary>실제 발동 무공과 소모</summary><p>${esc(battle.reason)}</p><ol class="battle-log">${battle.turns.map(t=>`<li><strong>${t.round}합 · ${t.first==='player'?'내 선공':'상대 선공'}</strong>${[t.first,t.first==='player'?'opponent':'player'].map(side=>actionText(t[side],side==='player'?'나':battle.enemy)).join('')}</li>`).join('')}</ol></details></section>`;
}
function actionText(a,name){
 return a?`<p><strong>${esc(name)} · ${esc(a.skill)}</strong><br>내공 −${a.cost} · ${a.qiBefore} → ${a.qiAfter} · 피해 ${a.damage}${a.reason?`<br><strong class="activation-reason">${esc(a.reason)}</strong>`:''}</p>`:
  `<p>${esc(name)} · 공격 전에 쓰러짐 · 공격과 내공 소모 없음</p>`;
}
export function battleResources(battle,frame){
 const t=battle.turns.find(t=>t.round===frame.round),v=frame.values;
 const a=frame.action,name=frame.side==='player'?'나':battle.enemy,target=frame.side==='player'?'enemyHp':'hp';
 const activation=frame.phase==='ready'?`<p><strong>${esc(name)} · ${esc(a.skill)}</strong><br>발동 준비 · 필요 내공 ${a.cost} · 현재 ${a.qiBefore} (소모 전)</p>`:
  `<p><strong>${esc(name)} · ${esc(a.skill)}</strong><br>내공 −${a.cost} · ${a.qiBefore} → ${a.qiAfter}${frame.phase==='attack'?' · 공격 중':`<br>피해 ${a.damage} · 상대 생명력 ${t.before[target]} → ${v[target]}`}</p>`;
 const side=(name,hp,qi,max)=>`<div class="battle-side"><strong>${esc(name)}</strong><label>생명력 <span>${hp} / ${max.maxHp}</span><progress class="hp-meter" value="${hp}" max="${max.maxHp}" aria-label="${esc(name)} 생명력"></progress></label><label>내공 <span>${qi} / ${max.maxQi}</span><progress class="qi-meter" value="${qi}" max="${max.maxQi}" aria-label="${esc(name)} 내공"></progress></label></div>`;
 return `<p><strong>${t.round}합 · ${t.first==='player'?'내 선공':'상대 선공'} · ${frame.finished?'최종 기록':frame.phase==='ready'?'공격 준비':frame.phase==='attack'?'무공 발동':'피해 반영'}</strong></p>
 <div class="battle-sides">${side('나',v.hp,v.qi,battle.resources.player)}${side(battle.enemy,v.enemyHp,v.enemyQi,battle.resources.opponent)}</div>
 <div class="activation-record">${activation}${a.reason?`<p class="activation-reason"><strong>${esc(a.reason)}</strong></p>`:''}</div>`;
}
