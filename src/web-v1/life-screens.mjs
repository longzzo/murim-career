import {ASSISTS,ECONOMY,MENTORS,ORIGINS,REJUVENATION_MONTHS,SKILLS} from './data.mjs';
import {esc,number} from './experience.mjs';

const origins={
 'P-01':{desc:'마을과 길목을 지키는 정파 문파입니다.',symbol:'雲'},
 'S-01':{desc:'교역로의 동료와 생계를 중시하는 사파 방파입니다.',symbol:'松'}
};
const styles={'쾌':'속도','유':'흘림·전환','중':'무게·지속 압력','환':'허초·기만'};
const traits={
 random:'관련 경험에서 자신의 체질을 알아갑니다.',
 천무지체:'무공 숙련을 더 빠르게 쌓습니다.',
 약응체:'의술을 배운 뒤 구호에서 이점이 있습니다.'
};
const button=(label,action,style='',extra='')=>`<button type="button" class="${style}" data-ui="${action}" ${extra}>${esc(label)}</button>`;

export function schoolMap(selected,current=null,available=ORIGINS){
 const origin=available.find(entry=>entry.id===selected);
 const markers=available.map(entry=>`<button type="button" class="school-marker" data-ui="school" data-id="${entry.id}" aria-pressed="${entry.id===selected}"><span aria-hidden="true">${origins[entry.id].symbol}</span><strong>${esc(entry.name)}</strong>${entry.id===current?'<small>현재 소속</small>':''}</button>`).join('');
 return `${current?`<p class="school-affiliation">현재 소속 <strong>${esc(available.find(entry=>entry.id===current).name)}</strong></p>`:''}
 <div class="school-map" aria-label="강호 약도">${markers}</div>
 ${origin?`<section class="school-description"><h3>${esc(origin.name)}</h3><p>${origins[origin.id].desc}</p>${current?'':button('이 문파 선택','school-select','primary wide')}</section>`:''}`;
}

export function setupScreen(setup,selected,configuring,returning){
 if(!configuring)return `<section class="card"><h2>강호에서 첫걸음</h2><p>약도에서 문파를 살펴보고 시작할 곳을 고르세요.</p>${schoolMap(selected)}${returning?button('회고로 돌아가기','setup-cancel'):''}</section>`;
 const origin=ORIGINS.find(entry=>entry.id===setup.origin);
 const mentors=MENTORS.filter(mentor=>mentor.origin===origin.id);
 const mentorChoices=mentors.map(mentor=>{
  const skill=SKILLS.find(entry=>entry.id===mentor.skill);
  return `<label class="mentor-choice"><input type="radio" name="mentor" value="${mentor.id}" ${setup.mentor===mentor.id?'checked':''}>
  <span><strong>${mentor.name}</strong><br>${skill.name} · ${styles[skill.style]}<br>기예 ${ASSISTS[mentor.assist]}</span></label>`;
 }).join('');
 return `<form id="setup" class="card"><h2>${origin.name} 입문</h2>${button('약도로 돌아가기','setup-map')}
 <label>이름 직접 입력<input name="name" maxlength="16" value="${esc(setup.name)}" placeholder="무명" autocomplete="off"></label>
 <fieldset><legend>주 사부</legend>${mentorChoices}</fieldset>
 <label>초기 수련 성향<select name="inclination"><option value="inner"${setup.inclination==='inner'?' selected':''}>내공</option><option value="outer"${setup.inclination==='outer'?' selected':''}>외공</option></select></label>
 <label>체질 · 타고난 성장 특성<select name="trait" aria-describedby="trait-description">${Object.keys(traits).map(key=>`<option value="${key}"${setup.trait===key?' selected':''}>${key==='random'?'인연에 맡기기':key}</option>`).join('')}</select></label>
 <p class="muted" id="trait-description">${traits[setup.trait]}</p>
 <p class="muted">삼재검법으로 시작합니다. 사부의 검법과 기예는 강호에서 배웁니다.</p>
 <button class="primary wide" type="submit">강호에 첫발을 내딛기</button></form>`;
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
