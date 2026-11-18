import {DATA} from './data.mjs';
import {publicView} from './engine.mjs';
import {legacyView,LEGACY_EFFECT} from './legacy.mjs';
import {esc,image} from './experience.mjs';
import {campaignRecap} from './campaign-ui.mjs';
import {escortHistory} from './escort-ui.mjs';
import {promiseHistory} from './story-ui.mjs';
import {regressionPreview} from './regression-ui.mjs';
const button=(label,action,primary=false)=>`<button type="button" class="wide${primary?' primary':''}" data-ui="${action}">${esc(label)}</button>`;
const heading=title=>`${button('시작 화면으로','lobby-back')}<h2 tabindex="-1">${title}</h2>`;
const tag=text=>`<span class="lb-tag">${esc(text)}</span>`;
const ending=h=>({interrupted:'중단한 생애',battle:'전투에서 마친 생애',retired:'스스로 마친 생애',natural:'자연의 흐름으로 마친 생애'})[h.cause]??'기록된 결말 없음';
const success=h=>h.success==='retirement'?'금분세수 성공':h.success==='conquest'?'정복 성공':null;
function currentStatus(v){return v.phase==='ended'?'생애를 마침 · 마지막 기록 확인':v.phase==='event'?v.pending.name+' · 선택 대기':v.phase==='grace'?'수명 연장 선택 대기':v.phase==='result'?'행동 결과 확인 대기':v.active?`${v.active.name} · ${v.active.elapsed} / ${v.active.duration}개월`:'강호의 다음 행동을 기다립니다.';}
export function lobbyScreen(s){
 const v=s?publicView(s):null;
 return `<div class="lb-screen lb-lobby"><h2 tabindex="-1">한 사람의 생애, 다음 이야기</h2>${v?`<section class="card"><p class="lb-eyebrow">현재 인물</p><div class="lb-portrait lb-landscape">${image('UI-CHR-PLAYER','lb-player')}<div class="lb-copy"><h3>${esc(v.name)}</h3><p>${esc(v.originName)} · ${esc(v.realm)}</p><p>${v.age}세 ${v.ageMonths}개월${v.escortCareer?.joined?' · '+esc(v.escortCareer.rank):''}</p></div></div><p class="lb-status">${esc(currentStatus(v))}</p>${button('이어하기','lobby-continue',true)}</section>`:`<section class="card lb-landscape"><div class="lb-copy"><h3>아직 쓰지 않은 이야기</h3><p>문파를 고르고 첫 삶을 시작하세요.</p></div>${button('새로운 삶 시작','new-life-map',true)}</section>`}<nav class="lb-menu" aria-label="시작 메뉴">${v?button('＋ 새로운 삶 시작','new-life-map'):''}${button('▤ 지난 인물들','lobby-history')}${button('🌿 전생의 유산','lobby-legacy')}</nav></div>`;
}
export function historyScreen(s){
 const v=s?publicView(s):null,history=v?.history??[];
 return `<div class="lb-screen lb-history">${heading('지난 인물들')}<p>마치거나 중단한 삶의 기록입니다.</p>${!history.length?'<section class="card"><h3>아직 남겨진 인물이 없어요</h3><p>현재 인물의 삶은 이어하기에서 계속할 수 있습니다.</p></section>':history.slice().reverse().map(h=>`<article class="card" data-life="${esc(h.id)}"><div class="lb-history-portrait">${image('UI-CHR-PLAYER','lb-player')}<div><h3>${esc(h.name)}</h3><p>${esc(h.originName)} · ${esc(h.realm)}</p><p>${Number.isFinite(h.age)?h.age+'세':'나이 기록 없음'}${h.ageMonths===undefined?'':' '+h.ageMonths+'개월'}</p>${h.campaign?.role?`<p>${esc(h.campaign.role)}</p>`:''}${h.escortCareer?.rank?`<p>${esc(h.escortCareer.rank)}</p>`:''}</div></div>${tag(ending(h))}${success(h)?tag(success(h)):''}<details><summary>행적 보기</summary><p>사부 · ${esc(h.mentorName)}</p>${h.lastAction?`<p>마지막 행동 · ${esc(h.lastAction)}</p>`:''}${h.recapQuote?`<p>${esc(h.recapQuote)}</p>`:''}${h.legacy?.choices.length?'<p>영초의 흔적을 기억하고 물러나 다음 삶의 길을 남겼습니다.</p>':''}${campaignRecap(h)}${escortHistory(h)}${promiseHistory({story:h.story})}</details></article>`).join('')}</div>`;
}
export function legacyScreen(s){
 const l=legacyView(s),v=s?publicView(s):null;
 return `<div class="lb-screen lb-legacy">${heading('전생의 유산')}<p>이번 삶 적용 ${l.active?1:0}개</p><article class="card"><div class="lb-legacy-top"><span class="lb-leaf" aria-hidden="true">🌿</span><h3>영초의 길</h3></div>${tag(l.active?'이번 삶 적용':l.earned?'보유 · 다음 새로운 삶부터':'아직 미획득')}<p><strong>여행 중 영초를 발견할 기회가 늘어납니다.</strong></p>${l.earned?`<p>획득 인물 · ${esc(l.earned.name)}<br>흔적을 기억하고 물러난 선택</p>`:'<p>영초를 지키는 영물을 만나면, 흔적을 기억하고 물러나 길을 남길 수 있습니다.</p>'}${l.earned&&!l.active?'<p class="notice">얻은 삶에는 적용되지 않습니다.</p>':''}${s&&!l.enabled?'<p>이전 생애의 규칙은 유지됩니다. 새로운 삶부터 이 유산을 얻을 수 있습니다.</p>':''}<details><summary>효과와 조건</summary><p>${LEGACY_EFFECT}가 생깁니다.</p><p>약을 바로 주거나 채집 성공을 보장하지 않습니다. 같은 유산을 다시 얻어도 효과는 겹치지 않습니다.</p></details></article><section class="card"><h3>호송 기억</h3><p>완수한 호송의 판단을 다음 회귀에서 활용하는 별도 이점입니다. 일반 새로운 삶에는 적용되지 않습니다.</p>${v?`<details><summary>이번 인물의 회귀 기억</summary>${regressionPreview(v)}</details>`:'<p>현재 인물의 호송 기억 없음 · 0개</p>'}</section></div>`;
}
export function newLifeConfirm(s,setup){
 const origin=DATA.origins.find(o=>o.id===setup.origin),mentor=DATA.mentors.find(m=>m.id===setup.mentor),owned=!!s?.meta.legacy?.earned.length;
 const old=s?.life,oldSuccess=old?success(old):null;
 return `<div class="lb-screen lb-confirm"><h2 tabindex="-1">이 삶으로 시작할까요?</h2><section class="card"><h3>새 인물 · ${esc(setup.name.trim()||'무명')}</h3><dl class="lb-facts"><div><dt>문파</dt><dd>${esc(origin.name)}</dd></div><div><dt>사부</dt><dd>${esc(mentor.name)}</dd></div><div><dt>적용할 유산</dt><dd>${owned?'영초의 길 · 1개':'적용할 유산 없음 · 0개'}</dd></div></dl>${old?`<p class="notice">${esc(old.name)}${old.ending?'의 지난 기록은 남습니다.':'의 현재 삶은 중단한 생애로 남습니다.'}${oldSuccess?' '+oldSuccess+' 기록도 그대로 남습니다.':''}</p>`:''}<p>능력·재화·장비·진행 중인 임무는 처음부터 시작합니다.</p><p>지난 인물·얻은 유산·해금 기록은 남습니다.</p><div class="lb-menu">${button('새로운 삶 시작 확정','new-life-confirm',true)}${button('취소 · 설정으로','new-life-back')}</div></section></div>`;
}
export function legacyBranch(s){return s.pending?.id==='A-007'&&s.versions.legacy===1?`<p class="notice">‘흔적을 기억하고 물러난다’를 선택하면 ${s.meta.legacy.earned.length?'이미 보유한 영초의 길을 기억합니다. 효과는 중첩되지 않습니다.':'영초의 길을 얻습니다. 지금 채집하지 않고, 다음 새로운 삶의 영초 발견 기회를 늘립니다.'}</p>`:'';}
export const legacyAcquired=()=>`<aside class="card lb-acquired" role="status"><h2>영초의 길을 얻었습니다</h2><p>이번 삶의 발견 확률은 바뀌지 않습니다. 다음 새로운 삶부터 적용됩니다.</p>${button('전생의 유산 보기','lobby-legacy')}${button('획득 안내 닫기','legacy-dismiss')}</aside>`;
