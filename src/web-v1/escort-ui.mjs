import {esc,number} from './experience.mjs';
import {memoryBenefit,memoryResultSources} from './regression-ui.mjs';
const response=r=>r?`<div class="ec-reaction"><strong>${esc(r.name)}</strong><p>${esc(r.text)}</p></div>`:'';
export function escortProgress(c){
 if(!c?.joined)return '';
 return c.highest?'<p class="ec-progress"><strong>표두 · 최고 직위</strong> · 주요 호송을 총괄합니다.</p>':
  `<div class="ec-progress"><strong>다음 직위 · ${esc(c.next.name)}</strong><p>${c.completedAtRank>=c.required?'완수 조건 달성':`완수 ${c.completedAtRank} / ${c.required}`} · ${esc(c.responsibility)} ${c.responsibilityMet?'달성':'필요'}</p></div>`;
}
export function escortJourney(v){
 const c=v.escortCareer?.active;if(!c)return '';
 const adjustment=c.choice?.rewardDelta??0;
 return `<section class="ec-contract" aria-label="진행 중 호송 약정"><p class="kicker">출발 직위 · ${esc(c.rankName)}</p><p><strong>${esc(c.mission)}</strong></p>
 <div class="ec-terms"><p>약정 기본 보수 <strong>${number(c.baseReward)} 재화</strong></p><p>기본 ${c.baseMonths}개월 · 현재 총 ${v.active.duration}개월</p></div>
 ${c.choice?`<p>선택 · ${esc(c.choice.label)}</p><p>추가 기간 +${c.choice.months}개월 · 정산 조정 ${adjustment>0?'+':''}${adjustment}</p>`:'<p>중간 판단에 따라 기간과 정산이 달라집니다.</p>'}
 <p class="ec-unpaid">아직 미정산 · 완수 시 ${c.baseReward+adjustment} 재화${c.choice?'':' (현재 약정 기준)'}</p>${response(c.briefing)}</section>`;
}
export function escortChoiceInfo(c){
 if(!c.escort)return c.extraMonths?`<small>기간 +${c.extraMonths}개월</small>`:'';
 return `<strong class="ec-choice-cost">추가 ${c.extraMonths}개월 · 완수 보수 ${c.escort.finalReward} 재화</strong>
 <small>${c.escort.rewardDelta<0?`지원·인계 비용 ${-c.escort.rewardDelta} 공제`:c.escort.rewardDelta>0?`보수 ${c.escort.rewardDelta} 추가`:'보수 조정 없음'}${c.escort.responsibility?' · '+esc(c.escort.responsibility)+' 기록':' · 승진 책임 추가 없음'}${c.escort.npcGain?' · 추가 인연 +'+c.escort.npcGain:''}${c.escort.fameGain?' · 추가 명성 +'+c.escort.fameGain:''}</small>${c.memory?`<small class="rm-choice-benefit">‘${esc(c.memory.baselineChoice)}’ 대비 추가 ${c.memory.monthsSaved} → 0개월</small>`:''}`;
}
export function escortResult(v){
 const r=v.result?.escortCareer;if(!r)return '';
 return `<section class="ec-result" aria-label="호송 정산과 경력"><p class="kicker">${esc(r.rankName)}의 임무 완료</p><h3>${esc(r.mission)}</h3>
 <div class="ec-current-pay"><span>이번 호송에서 받은 보수</span><strong>${number(r.actualReward)} 재화</strong><p>출발 약정 ${r.baseReward} · 선택 조정 ${r.choice.rewardDelta>0?'+':''}${r.choice.rewardDelta}${v.memoryResult?'':` · 실제 ${r.elapsed}개월`}</p>${v.memoryResult?`<p><strong>실제 ${r.elapsed}개월</strong></p><p>${v.memoryResult.responsibility?esc(v.memoryResult.responsibility)+' 기록 · ':''}명성 +${v.memoryResult.fameGain} · 인연 +${v.memoryResult.npcGain}</p>`:''}</div>
 ${memoryBenefit(v)}
 ${r.promotion?`<p class="ec-promotion"><strong>${esc(r.promotion.from)} → ${esc(r.promotion.to)} 승진</strong></p>`:''}
 ${r.promotion||r.actualReward!==v.escortCareer.reward?`<div class="ec-future-pay"><p>다음 호송의 기본 보수 <strong>${v.escortCareer.reward} 재화</strong></p><p>${esc(v.escortCareer.mission)}</p><p>다음 호송부터 적용됩니다.</p></div>`:''}
 <p>이번 생애 호송 총 완수 <strong>${r.totalCompleted-1} → ${r.totalCompleted}회</strong></p>${escortProgress(v.escortCareer)}
 ${response(r.promotion?.reaction??r.reaction)}${r.promotion?`<details><summary>이번 선택에 대한 반응</summary>${response(r.reaction)}</details>`:''}${memoryResultSources(v)}</section>`;
}
export function escortHistory(v){
 const c=v.escortCareer;if(!c||c.joined===false||!c.rank)return '';
 return `<details class="ec-history"><summary>표사 경력 · ${esc(c.rank)} · 총 완수 ${c.totalCompleted}회</summary>
 ${c.history.map(h=>`<div class="ec-history-entry"><strong>${esc(h.rankName)} · ${esc(h.mission)}</strong><p>${h.status==='completed'?`완수 · ${h.actualReward} 재화 · ${h.elapsed}개월`:`미완수 · ${h.elapsed}개월 진행 · 완료 보수 없음`}</p>${h.choice?`<p>선택 · ${esc(h.choice.label)}</p>`:''}${h.promotion?`<p><strong>${esc(h.promotion.from)} → ${esc(h.promotion.to)}</strong></p>`:''}${response(h.reaction)}${response(h.promotion?.reaction)}</div>`).join('')||'<p>아직 완수한 호송이 없습니다.</p>'}</details>`;
}
export function escortEnding(v){
 const c=v.history.at(-1)?.escortCareer;if(!c)return '';
 const last=c.history.at(-1);
 return `<section class="ec-ending"><h3>마지막 역할 · ${esc(c.rank)}</h3><p>이번 생애 호송 총 완수 ${c.totalCompleted}회</p>${last?.status==='interrupted'?`<p class="ec-unpaid">${esc(last.mission)} · 미완수<br>진행 ${last.elapsed} / ${last.duration}개월 · 지급 0 재화 · 완수·승진 없음</p>`:''}</section>`;
}
