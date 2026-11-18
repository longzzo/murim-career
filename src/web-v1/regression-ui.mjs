import {esc} from './experience.mjs';
const brain='<span aria-hidden="true">🧠</span>';
const cards=(rows,current=null)=>`<ul class="rm-list">${rows.map(m=>`<li><h3>${brain} ${esc(m.name)}</h3><p class="rm-condition">${m.rankId==='EC-R0'?'신입 표사부터':esc(m.rankName)+' 승진 후'} · ${esc(m.eventName)}에서 사용${current===m.id?' · 현재 직위에서 활용 가능':''}</p><p><strong>선택 추가 기간 ${m.monthsSaved} → 0개월</strong></p></li>`).join('')}</ul>`;
export function memorySources(rows){return rows.length?`<details class="rm-sources"><summary>기억의 근거 보기</summary><ul>${rows.map(m=>`<li><strong>${esc(m.name)}</strong><p>${m.source.lifeNumber}번째 생애 · ${esc(m.source.lifeName)} · ${16+Math.floor(m.source.month/12)}세 ${m.source.month%12}개월</p><p>${esc(m.source.mission)} 완수 · ${esc(m.source.choice)}</p></li>`).join('')}</ul></details>`:'';}
export function regressionPreview(v){
 const r=v.regressionMemory,rows=r.next;
 return `<div class="rm-review"><p class="rm-count"><strong>이번에 가져갈 호송 기억 ${rows.length}개</strong></p>${rows.length?`${cards(rows)}<p class="notice">첫 호송은 신입 표사부터 시작합니다. 각 기억은 해당 직위에 오른 뒤 맞는 사건에서 사용합니다.</p>${memorySources(rows)}`:`<p><strong>가져갈 호송 기억 없음</strong></p><p class="notice">${r.eligible?'책임 판단을 선택한 호송을 완수하면 다음 회귀에 가져갑니다.':'이 생애에는 호송 경력 기록이 없습니다.'}</p><p>기억이 없어도 회귀할 수 있습니다.</p>`}
 <details><summary>유지되는 것과 다시 시작하는 것</summary><p>출신·사부·체질과 지난 기록은 유지합니다.</p><p>능력·재화·무공·표사 직위와 승진 진척은 다시 시작합니다.</p><p>기억은 종류별1개, 최대4개이며 중첩되거나 소모되지 않습니다. 일반 새 생애는 활용 기억0개로 시작합니다.</p></details>
 ${r.bridge?'<p class="notice">회귀를 확정하면 기존 내용에 호송 기억 선택만 더해집니다. 지금 생애에는 적용되지 않습니다.</p>':''}</div>`;
}
export function homeMemories(v){const r=v.regressionMemory;return r?.enabled?`<details class="rm-home"><summary>${brain} 호송 기억 ${r.carried.length}개 · 보기</summary>${r.carried.length?cards(r.carried,r.available?.id):'<p>이번 생애에 가져온 호송 기억이 없습니다.</p>'}${r.next.some(m=>!m.inherited)?'<p>이번에 얻은 기억은 다음 회귀부터 활용합니다.</p>':''}${memorySources(r.carried)}</details>`:'';}
export function escortMemoryHint(v){const m=v.regressionMemory?.available;return m?`<p class="rm-hint">${brain} ${esc(m.name)} 활용 가능 · 해당 사건에서 선택 추가 ${m.monthsSaved} → 0개월</p>`:'';}
export function memoryBenefit(v){const r=v.memoryResult;if(!r?.used&&!r?.acquired)return '';const m=r.used??r.acquired;
 return `<section class="rm-benefit"><h3>${brain} ${r.used?'기억으로 달라진 점':'회귀 시 활용할 기억을 얻음'}</h3><p><strong>${esc(m.name)}</strong></p>${r.used?`<p><strong>선택 추가 기간 ${m.extraMonthsSaved}개월 단축</strong></p><p>‘${esc(m.baselineChoice)}’ 대비 ${m.extraMonthsSaved} → 0개월</p>${m.otherMonths?`<p>다른 돌발 사건의 추가 ${m.otherMonths}개월은 그대로입니다.</p>`:''}`:`<p>다음 회귀의 ${esc(m.rankName)} 사건에서 추가 ${m.monthsSaved} → 0개월</p><p>이번 생애에는 새 기억 선택이 열리지 않습니다.</p>`}</section>`;
}
export function memoryResultSources(v){const m=v.memoryResult?.used??v.memoryResult?.acquired;return m?memorySources([m]):'';}
