import {ASSISTS,ECONOMY,DATA,REJUVENATION_MONTHS} from './data.mjs';
import {schoolChoices} from './factions.mjs';
import {esc,number,image} from './experience.mjs';

const styles={'쾌':'속도','유':'흘림·전환','중':'무게·지속 압력','환':'허초·기만','강':'강한 직선 공격'};
const traits={
 random:'관련 경험에서 자신의 체질을 알아갑니다.',
 천무지체:'무공 숙련을 더 빠르게 쌓습니다.',
 약응체:'의술을 배운 뒤 구호에서 이점이 있습니다.'
};
const button=(label,action,style='',extra='')=>`<button type="button" class="${style}" data-ui="${action}" ${extra}>${esc(label)}</button>`;
const marks={plum:'✿',sun:'☀',taiji:'☯',lantern:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5V3h6v2M6 7h12v11H6zM4 7h16M8 5h8M9 18v3m6-3v3M12 7v11"/></svg>',temple:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l9-5 9 5H3zm3 1v9m12-9v9M3 20h18M9 20v-7h6v7"/></svg>'};
const schoolSymbol=school=>`<span class="school-symbol" aria-hidden="true">${marks[school.motif]??esc(school.symbol)}</span>`;

export function schoolMap(selected,current=null,available=schoolChoices(DATA),chosen=null){
 const origin=available.find(entry=>entry.id===selected);
 const order=['plum','temple','sun','taiji','lantern'];
 const markers=[...available].sort((a,b)=>order.indexOf(a.motif)-order.indexOf(b.motif)).map(entry=>`<button type="button" class="school-marker ${entry.id===current?.id?'is-current ':''}${entry.id===chosen?'is-selected ':''}${entry.available?'is-available':'is-locked'}" data-ui="school" data-id="${entry.id}" data-school="${entry.id}" data-available="${entry.available}" data-motif="${entry.motif}" aria-pressed="${entry.id===selected}" aria-controls="school-detail">
 <span class="marker-top">${schoolSymbol(entry)}<strong>${esc(entry.name)}</strong>${entry.motif==='lantern'?'<span class="network-route" aria-hidden="true">● ··· ● ··· ●</span>':''}</span><small class="marker-location">${esc(entry.location)}</small>
 <span class="marker-states"><span class="state ${entry.available?'state-available':'state-locked'}">${entry.available?'○ 입문 가능':'◇ 잠김'}</span>${entry.id===current?.id?'<span class="state state-current">● 현재 소속</span>':''}${entry.id===chosen?'<span class="state state-selected">✓ 입문 선택</span>':''}${entry.id===selected?'<span class="state state-viewing">살펴보는 중</span>':''}</span></button>`).join('');
 const status=origin?`${origin.available?'입문 가능':'잠김'} · ${esc(origin.requirement)}`:'';
 return `${current?`<p class="school-affiliation">현재 소속 <strong>${esc(current.name)}</strong></p><p>아래 문파는 다음 새 생애의 선택지입니다. 지금 소속과 사부는 바뀌지 않습니다.</p>`:''}
 ${origin?button('설명으로 이동','school-detail','school-detail-link'):''}<div class="school-map" aria-label="강호 약도">${markers}</div>
 <p class="muted">문파 거점의 방향을 나타낸 약도입니다. 하오문은 각지의 연락망입니다.</p>
 ${origin?`<section class="school-description" id="school-detail"><div class="description-title">${schoolSymbol(origin)}<h3 tabindex="-1">${esc(origin.name)}</h3></div><p>${esc(origin.desc)}</p>
 <ul class="school-teachings">${origin.teachings.map(m=>`<li>${esc(m.skill.name)} · ${styles[m.skill.style]} · 발동 내공 ${m.skill.cost}<br>기예 ${ASSISTS[m.assist]}</li>`).join('')}</ul>
 <div class="school-access ${origin.available?'':'is-locked'}" id="school-condition"><p>${image(origin.available?'UI-ICO-CHECK':'UI-ICO-LOCK','condition-icon')}${status}</p><p>${origin.available?'새 생애를 시작할 때 선택합니다.':'해금 후 새 생애에서 선택할 수 있습니다.'}</p></div>
 ${current?'<p>현재 소속과 주 사부는 바뀌지 않습니다.</p>':button(origin.available?(origin.id===chosen?(origin.teachings.length===1?'선택한 문파 · 입문 준비 이어가기':'선택한 문파 · 사부 고르기'):'이 문파 선택'):'해금 후 새 생애에서 선택','school-select','primary wide',`aria-describedby="school-condition" ${origin.available?'':'disabled'}`)}
 ${button('약도 표식으로 돌아가기','school-back','wide',`data-id="${origin.id}"`)}
 <details><summary>배움과 해금 안내</summary><p>${origin.unlock==='F-NORMAL'?'실제 접전의 승리·패배·도주·사망 결과로 해금합니다. 지도 열람이나 전투 전 취소는 해금되지 않습니다.':origin.unlock==='F-POPULAR'?'명문 의뢰의 실제 완료로 해금합니다. 접전만으로 해금되지 않습니다.':'별도 해금 없이 새 생애의 출신으로 고를 수 있습니다.'}</p><p>주 사부는 한 명이며, 선택만으로 무공을 얻지는 않습니다. 삼재검법으로 시작하고 문파별 시작 능력 보너스는 없습니다.</p></details></section>`:''}`;
}

export function setupScreen(setup,selected,configuring,returning,unlocks=[]){
 const schools=schoolChoices(DATA,unlocks),origin=schools.find(entry=>entry.id===setup.origin);
 if(!configuring||!origin?.available)return `<section class="card"><h2>강호에서 첫걸음</h2><p>약도에서 문파를 살펴보고 시작할 곳을 고르세요.</p>${returning?'<p>새 생애는 현재 문파 목록에서 고릅니다. 회귀는 이전 출신·사부·규칙을 유지합니다.</p>':''}${schoolMap(selected,null,schools,setup.origin)}${returning?button('회고로 돌아가기','setup-cancel'):''}</section>`;
 const mentors=origin.teachings;
 const mentorChoices=mentors.map(mentor=>{
  const skill=mentor.skill;
  if(mentors.length===1)return `<input type="hidden" name="mentor" value="${mentor.id}"><div class="mentor-fixed"><strong>${esc(mentor.name)} · 주 사부 연결됨</strong><p>${esc(skill.name)} · ${styles[skill.style]} · 발동 내공 ${skill.cost}<br>기예 ${ASSISTS[mentor.assist]}</p><p>이 문파의 사부는 한 명입니다. 별도로 고르지 않아도 연결됩니다.</p></div>`;
  return `<label class="mentor-choice"><input type="radio" name="mentor" value="${mentor.id}" required ${setup.mentor===mentor.id?'checked':''}>
  <span><strong>${esc(mentor.name)}</strong><br>${esc(skill.name)} · ${styles[skill.style]} · 발동 내공 ${skill.cost}<br>기예 ${ASSISTS[mentor.assist]}</span></label>`;
 }).join('');
 return `<form id="setup" class="card"><h2>${origin.name} 입문</h2>${button('약도로 돌아가기','setup-map')}
 <label>이름 직접 입력<input name="name" maxlength="16" value="${esc(setup.name)}" placeholder="무명" autocomplete="off"></label>
 <fieldset><legend>주 사부${mentors.length===1?' · 고정 전수':''}</legend>${mentorChoices}</fieldset>
 <p class="selection-summary">입문 선택 · ${esc(origin.name)}<br>주 사부 · <strong id="chosen-teacher">${esc(mentors.find(m=>m.id===setup.mentor)?.name??'아직 선택하지 않음')}</strong></p>
 <label>초기 수련 성향<select name="inclination"><option value="inner"${setup.inclination==='inner'?' selected':''}>내공</option><option value="outer"${setup.inclination==='outer'?' selected':''}>외공</option></select></label>
 <label>체질 · 타고난 성장 특성<select name="trait" aria-describedby="trait-description">${Object.keys(traits).map(key=>`<option value="${key}"${setup.trait===key?' selected':''}>${key==='random'?'인연에 맡기기':key}</option>`).join('')}</select></label>
 <p class="muted" id="trait-description">${traits[setup.trait]}</p>
 <p class="muted">16세 · 재화100 · 삼재검법으로 시작합니다. 사부의 검법과 기예는 강호에서 배웁니다. 내공·외공 성향은 문파와 별도로 선택합니다.</p>
 <button class="primary wide" type="submit" ${mentors.some(m=>m.id===setup.mentor)?'':'disabled'}>강호에 첫발을 내딛기</button></form>`;
}

export function setupTraitDescription(value){return traits[value];}

export function rejuvenation(v,{grace=false}={}){
 const fee=ECONOMY.rejuvenation,affordable=v.money>=fee;
 return `<section class="card renewal"><h2>${grace?'마지막 깨달음 앞에서':'반로환동'}</h2>
 ${grace&&v.success?'<p class="badge">이 생애의 성공은 이미 기록했습니다.</p>':''}
 <p>수명 ${REJUVENATION_MONTHS}개월 연장 · 육체 약화 · 두 방식 합쳐 생애당 한 번.</p>
 ${v.active?`<p>${esc(v.active.name)}에서 쌓은 성과와 남은 기간을 이어갑니다.</p>`:''}
 <p>현재 재화 <strong>${number(v.money)}</strong></p>
 <div class="renewal-choice"><h3>무료 체험</h3><p>지출 0 · 남는 재화 ${number(v.money)}</p><p class="muted">광고 성공을 모사하는 체험입니다. 실제 광고와 결제는 없습니다.</p>
 ${button('무료 체험으로 이어가기','rejuvenate-simulation','primary wide')}</div>
 <div class="renewal-choice"><h3>재화로 사용</h3><p>지출 ${fee} · ${affordable?'남는 재화 '+number(v.money-fee):'재화가 부족합니다.'}</p>
 ${button(`재화 ${fee}으로 이어가기`,'rejuvenate-money','wide',affordable?'':'disabled')}</div>
 ${grace?button('생애 마무리 살피기','grace-review','wide'):button('기록으로 돌아가기','renewal-back','wide')}</section>`;
}

export function changeTags(changes){
 return changes.map(({label,from,to})=>{
  const detail=typeof from==='number'&&typeof to==='number'
   ? `${to>from?'+':'−'}${number(Math.abs(to-from))} · ${number(from)} → ${number(to)}`
   : `${from} → ${to}`;
  return `<span class="badge">${esc(label)} ${esc(detail)}</span>`;
 }).join('');
}

export function changeHistory(v){
 return v.changes.length?`<details class="change-history"><summary>상태 변화 기록</summary><ul class="log">${v.changes.slice().reverse().map(entry=>
  `<li><small>${16+Math.floor(entry.month/12)}세 ${entry.month%12}개월</small><div class="result-tags">${changeTags(entry.changes)}</div></li>`).join('')}</ul></details>`:'';
}
