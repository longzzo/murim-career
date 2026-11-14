import {esc,image} from './experience.mjs';
const labels={offered:'제안',accepted:'수락 · 진행 중',completed:'완료',declined:'거절',deferred:'나중에 보기',interrupted:'생애 종료 · 미완료'};
export function storyPanel(v){
 const story=v.story;if(!story)return '';
 const pending=story.offers.filter(o=>['offered','accepted'].includes(o.status));
 return `<section class="story-panel" aria-label="찾아온 일"><h2>찾아온 일</h2>${pending.length?pending.map(o=>
  `<p class="kicker">${esc(story.npc)}</p><h3>${esc(o.title)}</h3>${o.status==='offered'?`
  <p>“${esc(o.quote)}”</p><div class="offer-terms"><p>지역 의뢰 · <strong>${story.months}개월 · 선지출 0 재화</strong></p><p>완료 보수 <strong>${story.reward} 재화</strong></p></div>
  <p class="action-restriction">${image('UI-ICO-WARNING','menu-icon')}맡으면 시작합니다. 시작 후 변경할 수 없습니다.</p>
  ${o.blocked?`<p class="notice">${esc(o.blocked)}</p>`:''}<div class="story-actions">
  <button class="primary" data-ui="offer-accept" data-id="${o.id}" ${o.blocked?'disabled':''}>맡기</button>
  <button data-ui="offer-defer" data-id="${o.id}" ${o.blocked?'disabled':''}>나중에</button>
  <button data-ui="offer-decline" data-id="${o.id}" ${o.blocked?'disabled':''}>거절</button></div>`:
  `<p><strong>${o.elapsed} / ${o.duration}개월</strong> 진행 · 수락한 지역 의뢰를 이어갑니다.</p><p>시작한 약속은 보류하거나 바꿀 수 없습니다.</p>`}`).join(''):
  '<p>지금 찾아온 일이 없습니다.</p>'}</section>`;
}
export function promiseHistory(v){
 if(!v.story?.history.length)return '';
 return `<details class="promise-history"><summary>${esc(v.story.npc)} · 약속 기록</summary><ul class="log">${v.story.history.map(h=>
  `<li><small>${16+Math.floor(h.month/12)}세 ${h.month%12}개월</small><strong>${esc(h.title)} · ${labels[h.state]}</strong>${h.action?`<p>${esc(h.action)}</p>`:''}</li>`).join('')}</ul></details>`;
}
export function storyResult(v){
 const event=v.result?.story;if(!event||!v.story)return '';
 const completed=v.story.offers.find(o=>o.id===event.completed);
 const offered=v.story.offers.find(o=>o.id===event.offered&&o.status==='offered');
 return `<aside class="story-result"><p class="kicker">${esc(v.story.npc)}</p>${completed?`<h3>${esc(completed.title)} 완료</h3><p>${esc(completed.completion)}</p>`:''}
 ${offered?'<p>상단에서 새 부탁이 왔습니다.</p><button class="wide" data-ui="story-next">찾아온 일 살피기</button>':''}</aside>`;
}
