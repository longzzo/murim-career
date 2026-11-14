import {esc} from './experience.mjs';

function copy(v,keys){
 const facts=v.guidance.facts,paragraphs=[];
 if(keys.includes('learning')){
  const a=facts.learning,primary=v.skills.find(k=>k.id===v.loadout.primary)?.name;
  const aux=v.loadout.aux.map(id=>v.skills.find(k=>k.id===id)?.name).filter(Boolean).join(' · ')||'없음';
  paragraphs.push(`<strong>${esc(a.name)}</strong>을 배웠습니다. 발동 내공 <strong>${a.cost}</strong> · 현재 내공 <strong>${v.qi.current} / ${v.qi.max}</strong>. 주력 <strong>${esc(primary)}</strong> · 보조 ${esc(aux)}.`);
 }
 if(keys.includes('spar')){
  const a=facts.spar;paragraphs.push(`첫 교류 비무에서 <strong>${a.skills.map(esc).join(' · ')||'공격 전에 쓰러짐'}</strong>. 내공 <strong>${a.before} → ${a.after}</strong> (소모 ${a.spent}) · 현재 몸 상태 <strong>${esc(v.body)}</strong>.`);
 }
 if(keys.includes('exhaustion'))paragraphs.push('내공이 부족해 <strong>기본 외공</strong>으로 이어갔습니다. 운기는 내공을 채우고, 휴식·치료는 부상을 돌봅니다.');
 return paragraphs.map(p=>`<p>${p}</p>`).join('');
}
export function guidancePanel(v){
 const g=v.guidance;if(!g?.active.length)return '';
 const learning=g.active.includes('learning');
 return `<aside class="guidance-panel" aria-label="다음 선택 안내"><h3>다음 발걸음</h3>
 ${g.collapsed?'<p>안내를 접었습니다. 아래 선택은 계속 이용할 수 있습니다.</p>':copy(v,g.active)}
 <button data-ui="guide-fold" data-collapsed="${!g.collapsed}" aria-expanded="${!g.collapsed}">${g.collapsed?'안내 펼치기':'안내 접기'}</button>
 <div class="guidance-actions"><button data-ui="guide-next" data-id="record">무공 살피기</button>
 <button data-ui="guide-next" data-id="${learning?'duel':'rest'}">${learning?'교류 비무 살피기':'회복 살피기'}</button>
 ${learning?'':'<button data-ui="guide-next" data-id="training">수련 살피기</button>'}
 <button data-ui="guide-next" data-id="world">다른 활동 보기</button></div></aside>`;
}
export function guidanceHelp(v){
 const g=v.guidance;
 return `<details class="guidance-help"><summary>도움말 · 첫 발걸음 다시 읽기</summary>
 <p>무공 구성에서 주력과 보조를 고릅니다. 교류 비무는 패배해도 생존하지만 부상을 입을 수 있습니다.</p>
 ${g?`<p>내공이 모자란 무공은 제외하고 가능한 공격을 사용합니다. 기본 외공은 내공 소모가 없고 피해가 낮습니다.</p>
 ${Object.keys(g.facts).length?copy(v,Object.keys(g.facts)):'<p>아직 기록된 첫 배움·비무·고갈 경험이 없습니다.</p>'}
 <button data-ui="guide-help-read">도움말 읽음 · 안내 펼치기</button>`:
 `<p>이 생애는 시작할 때의 규칙으로 이어집니다. 현재 배운 무공: ${v.skills.map(k=>esc(k.name)).join(' · ')}.</p>`}</details>`;
}
