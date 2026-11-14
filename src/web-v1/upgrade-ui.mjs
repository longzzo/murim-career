import {esc,number} from './experience.mjs';
import {summaryChanges} from './action-summary.mjs';
import {battleFacts,nextPreparation} from './upgrade-model.mjs';

export function wholeSummary(r){
 if(!r)return '';
 const changes=summaryChanges(r),preferred=r.target==='outer'?['최대 생명력','외공 기반']:r.target==='inner'?['최대 내공','내공 기반']:['최대 내공','기반 경험'];
 const rank=label=>preferred.includes(label)?preferred.indexOf(label):2;
 const ranked=[...changes].sort((a,b)=>rank(a.label)-rank(b.label));
 const growth=ranked.find(c=>!c.label.endsWith(' 보유')),holding=changes.find(c=>c.label.endsWith(' 보유'));
 const key=[...new Set([growth,holding,...ranked].filter(Boolean))].slice(0,2);
 const value=v=>typeof v==='number'?number(v):esc(v);
 const line=c=>`<p>${esc(c.label)} <strong>${value(c.from)} → ${value(c.to)}</strong></p>`;
 return `<section class="ua-whole" aria-label="행동 전체 성과"><h3>${r.status==='complete'?`${r.elapsed}개월 행동 완료`:'진행 중 쌓은 성과'}</h3>
  <div class="ua-period"><span>실제 경과 ${r.elapsed}개월</span><span>원래 ${r.baseDuration}개월 · 추가 ${r.extraMonths}개월</span><span>${r.status==='complete'?'완료':r.status==='interrupted'?'중단 · 완료 보수 없음':'진행 중'}</span></div>
  ${r.end['현재 내공']!==undefined?`<p>현재 내공 <strong>${r.end['현재 내공']}</strong> / 최대 내공 <strong>${r.end['최대 내공']}</strong></p>`:''}
  <div class="ua-facts">${key.map(c=>`<div class="ua-fact">${line(c)}</div>`).join('')||'<p>기록된 공개 변화가 없습니다.</p>'}</div>
  <details class="ua-detail"><summary>시작부터 전체 변화</summary><p>시작 비용 지출 전 기준입니다. 재화 순변화에는 선지출이 이미 포함됩니다.</p>${changes.map(line).join('')||'<p>변화 없음</p>'}</details></section>`;
}
export function combatSummary(b){return `<div class="ua-facts" aria-label="실제 전투 요약">${battleFacts(b).map(text=>`<p class="ua-fact">${esc(text)}</p>`).join('')}</div>`;}
export function nextPanel(v){
 const next=nextPreparation(v);
 return `<section class="ua-next"><h3>다음 준비 · ${esc(next.title)}</h3><p>${esc(next.reason)}</p>
 ${next.destination?`<button class="primary wide" data-ui="result-next" data-id="${next.destination}">기록 확인 · ${{record:'무공 구성',inventory:'소지품',rest:'회복',training:'수련·배움',duel:'비무·도전',world:'강호 활동'}[next.destination]} 보기</button>`:''}</section>`;
}
export function configurationSummary(p){
 if(p.legacy)return `<p>주력 <strong>${esc(p.primary)}</strong> · 보조 ${p.aux.map(esc).join(', ')||'없음'}</p><p>이 생애는 기존 전투 규칙을 따릅니다. 내공 소모 기록을 새로 적용하지 않습니다.</p>`;
 return `<p>주력 <strong>${esc(p.primary)}</strong> · 비용 <strong>${p.cost}</strong> / 현재 내공 <strong>${p.current}</strong></p>
  <p>편성 보조 · ${p.aux.map(esc).join(', ')||'없음'}</p>
  <p>지금 발동 가능한 공격 · ${p.candidates.map(c=>esc(c.name)).join(', ')}</p>
  <p>${p.basicOnly?'현재 후보는 무소모 기본 외공뿐입니다.':p.cost===0?'주력 기본 외공은 무소모이며, 편성한 보조가 발동하면 내공을 씁니다.':'주력 비용이 부족해지면 가능한 보조 또는 기본 외공을 사용합니다.'}</p>
  <details class="ua-detail"><summary>현재 후보의 분배와 효율</summary><p>매 공격 직전 잔량에 맞춰 후보를 다시 정합니다. 보유만 한 무공은 발동하지 않습니다.</p>
  <ul>${p.candidates.map(c=>`<li>${esc(c.name)} · 내공 ${c.cost} · ${(c.weight*100).toFixed(1)}%</li>`).join('')}</ul>
  <p>가능한 보조 수에 따른 내공 소모 공격 효율 ${(p.efficiency*100).toFixed(0)}%. 기본 외공은 삼재검법 기초 숙련을 공유하며 기본 피해 배율 ${(p.basicScale*100).toFixed(0)}%입니다.</p></details>`;
}
