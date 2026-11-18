// BUTTON-01 is presentation only: commands, targets, disabled state and storage stay intact.
export const UI_BUILD='LOBBY-01-r1';
const destinations={home:['🏠','홈'],record:['📖','무공 구성'],inventory:['🎒','소지품'],map:['🗺️','강호 지도'],chronicle:['📜','생애 기록'],training:['📚','수련·배움'],world:['🧭','강호 활동'],duel:['⚔️','비무·도전'],rest:['🩹','회복']};
const groups={training:'내공·외공·무공',world:'의뢰·호송·교류',duel:'비무·강적 도전',rest:'운기·휴식·치료'};
const icons={'ACT-01':'🌀','ACT-02':'📚','ACT-03':'📜','ACT-04':'🚚','ACT-05':'🩹','ACT-06':'⚔️','ACT-07':'🥋','ACT-08':'🤝','ACT-09':'⚔️','ACT-10':'🥋'};
const span=(name,text)=>{const n=document.createElement('span');n.className=name;n.textContent=text;return n;};
const emoji=text=>{const n=span('bc-icon',text);n.setAttribute('aria-hidden','true');return n;};
export function labelButton(button,text,icon){
 if(!button)return;
 const existing=button.querySelector('img.button-icon,img.menu-icon');
 button.replaceChildren(...(existing?[existing]:icon?[emoji(icon)]:[]),span('bc-label',text));
}
function intent(button,kind){button.dataset.intent=kind;if(['navigate','preview','preview-risk','choice','replay'].includes(kind))button.classList.remove('primary');if(kind==='danger'){button.classList.remove('primary');button.classList.add('danger');}}
const labels={
 'lobby-open':['시작 화면','☰','navigate'],'lobby-back':['시작 화면으로','↩️','navigate'],'lobby-continue':['이어하기','▶️','execute'],
 'lobby-history':['지난 인물들','▤','navigate'],'lobby-legacy':['전생의 유산','🌿','navigate'],'new-life-confirm':['새로운 삶 시작 확정','🌱','execute'],'new-life-back':['취소 · 설정으로','↩️','navigate'],'legacy-dismiss':['획득 안내 닫기','✕','navigate'],
 'back-group':['홈으로','🏠','navigate'],'advance':['여정 진행','▶️','execute'],
 'battle-apply':['생사결 시작 확정','⚠️','danger'],'battle-cancel':['생사결 취소 · 선택으로','↩️','navigate'],
 'item-repair':['수리 비용 확인','🔧','preview'],'item-equip':[null,'🗡️','execute'],'compare-item':[null,'🔎','preview'],
 'back-item':['물품 상세 닫기','↩️','navigate'],'retry':['같은 저장 다시 시도','🔄','execute'],'reload':['최신 저장 불러오기','🔄','navigate'],
 'offer-accept':['부탁 맡고 시작','🤝','execute'],'offer-defer':['제안 보류 · 홈으로','🕒','execute'],'offer-decline':['제안 거절','✋','execute'],
 'cancel':['결정 취소','↩️','navigate'],'renewal-back':['생애 기록으로','↩️','navigate'],
 'grace-review':['생애 종료 전 확인','⚠️','preview-risk'],'grace-back':['수명 연장 방법으로','↩️','navigate'],
 'finish':['생애 마무리 확정','⚠️','danger'],'declineGrace':['생애 마무리 확정','⚠️','danger'],'retire':['금분세수 확정','✅','execute'],
 'open-recap':['이번 생애 회고 보기','📜','navigate'],'close-recap':['생애 마지막 기록으로','↩️','navigate'],
 'new-life-map':['새로운 삶 · 문파 고르기','🌱','preview'],'review-regression':['회귀 조건 확인','🔄','preview'],
 'regress':['기억을 품고 회귀 시작','🔄','execute'],'cancel-regression':['회귀 취소','↩️','navigate'],
 'setup-map':['문파 지도로','🗺️','navigate'],'setup-cancel':['새 생애 준비 취소','↩️','navigate'],
 'school-detail':['선택한 문파 설명 보기','🔎','preview'],'school-back':['문파 표식으로','🗺️','navigate'],
 'dismiss-notice':['변화 알림 닫기','✕','navigate'],'guide-help-read':['도움말 읽음 · 안내 다시 보기','📖','execute'],
 'skip':['전투 연출 생략','⏭️','replay'],'fast':[null,'⏩','replay'],'slow':[null,'🐢','replay'],'replay':[null,'▶️','replay'],
 'items-weapon':['무기 목록','🗡️','navigate'],'items-herb':['영약 목록','🌿','navigate']
};
export function clarifyButtons(root,v=null,{queued=false,itemConfirm=null}={}){
 document.documentElement.dataset.uiBuild=UI_BUILD;
 for(const b of root.querySelectorAll('button')){
  const a=b.dataset.ui,id=b.dataset.id,original=b.textContent.trim();
  if(labels[a]){const [label,icon,kind]=labels[a];labelButton(b,label??original,icon);intent(b,kind);}
  else if(a==='group'){
   const [icon,name]=destinations[id],badge=b.querySelector('.offer-badge');labelButton(b,name+' 보기',icon);intent(b,'navigate');
   if(b.closest('.activity-grid')){b.classList.add('bc-group');b.append(span('bc-group-note',groups[id]));if(badge)b.append(badge);}
  }else if(a==='start-action'){
   let label=original,icon=icons[id];const target=b.dataset.target;
   if(!b.disabled)label=target==='inner'?'내공 수련 시작':target==='outer'?'외공 단련 시작':target==='skill'?'주력 무공 수련 시작':target==='assist'?(v.knowsMentorAssist?'배운 기예로 기반 수련 시작':'사부 기예 배우기'):original.endsWith('시작')?original:original+' 시작';
   if(target==='outer')icon='💪';if(target==='breathing')icon='🧘';labelButton(b,label,icon);intent(b,'execute');b.classList.remove('primary');
  }else if(a==='confirm-battle'){labelButton(b,'생사결 위험 확인','⚠️');intent(b,'preview-risk');}
  else if(a==='campaign-choice'){intent(b,'choice');}
  else if(a==='campaign-open'){labelButton(b,original,'📜');intent(b,'navigate');}
  else if(a==='campaign-skip'){labelButton(b,'구간 전환 생략 · 다음 목표로','⏭️');intent(b,'execute');}
  else if(a==='campaign-defer'){labelButton(b,'약속 보류 · 홈으로','🕒');intent(b,'navigate');}
  else if(a==='choose'||a==='confirm-event'){
   // Preserve the choice's cost, duration and disabled explanation.
   const text=[...b.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
   if(text){const label=text.textContent.trim()+(a==='confirm-event'?' · 위험 확인':'');text.replaceWith(emoji(a==='confirm-event'?'⚠️':b.dataset.memory?'🧠':'💬'),span('bc-label',label));}
   intent(b,a==='choose'?'choice':'preview-risk');
  }else if(['ack','result-next','guide-next','story-next'].includes(a)){
   const dest=a==='ack'?'home':a==='story-next'?'world':id,[icon,name]=destinations[dest];
   labelButton(b,queued?'결과 확인 · 다음 사건으로':a==='ack'?'결과 확인 · 홈으로':'결과 확인 · '+name+' 보기',queued?'➡️':icon);intent(b,'execute');b.classList.remove('primary');
  }else if(a?.startsWith('tab-')){
   const [icon,name]=destinations[a.slice(4)];if(b.closest('.bottom-nav')){if(a==='tab-map')b.querySelector('span:last-child').textContent='지도';}else labelButton(b,name+' 보기',icon);intent(b,'navigate');
  }else if(a==='back-phase'){labelButton(b,({journey:'진행 중 여정으로',event:'사건 선택으로',result:'행동 결과로',grace:'수명 연장 선택으로',ended:'생애 마지막 기록으로'})[v?.phase]??'홈으로','↩️');intent(b,'navigate');}
  else if(a==='item'||a==='school'){
   intent(b,'preview');b.append(span('bc-open-label',a==='item'?'상세 보기':'문파 설명 보기'));
  }else if(a==='school-select'){labelButton(b,b.disabled?original:'이 문파로 입문 준비','🌱');intent(b,'preview');}
  else if(a==='item-use'){labelButton(b,(root.querySelector('.item-detail h2')?.textContent??'물품')+' 사용 전 확인','🌿');intent(b,'preview');}
  else if(a==='item-cancel'){labelButton(b,itemConfirm==='repair'?'수리 취소':'사용 취소','↩️');intent(b,'navigate');}
  else if(a==='item-apply'){labelButton(b,itemConfirm==='repair'?'수리 확정':(root.querySelector('.item-detail h2')?.textContent??'물품')+' 사용 확정',itemConfirm==='repair'?'🔧':'🌿');intent(b,'execute');}
  else if(a==='review'){labelButton(b,({retire:'금분세수 조건 확인',finish:'생애 종료 전 확인',renewal:'수명 연장 방법 보기'})[id],id==='finish'?'⚠️':'📜');intent(b,id==='finish'?'preview-risk':'preview');}
  else if(a==='guide-fold'){labelButton(b,b.getAttribute('aria-expanded')==='true'?'안내 접기 · 읽음 기록':'안내 다시 보기','📖');intent(b,'execute');}
  else if(a?.startsWith('rejuvenate-')){labelButton(b,original.replace('으로 이어가기','으로 수명 연장'),'🌱');intent(b,'execute');b.classList.remove('primary');}
  else if(b.type==='submit'){labelButton(b,b.closest('#setup')?'새로운 삶 최종 확인':b.closest('#loadout')?'편집한 무공 구성 적용':original,b.closest('#setup')?'🌱':'✅');intent(b,'execute');}
 }
 const recommended=root.querySelector('.current-situation button');
 if(recommended){recommended.dataset.recommended='true';if(recommended.dataset.intent!=='preview-risk')recommended.classList.add('primary');}
 const next=root.querySelector('[data-ui="result-next"]')??root.querySelector('[data-ui="ack"]');if(next)next.classList.add('primary');
 const advance=root.querySelector('[data-ui="advance"]');
 if(advance){const hint=document.createElement('p');hint.className='muted bc-caption';hint.textContent='다음 사건이나 결과까지 진행합니다.';advance.after(hint);}
 for(const d of root.querySelectorAll('.ec-result details:not(.rm-sources)')){const summary=d.querySelector('summary');const update=()=>{summary.textContent=d.open?'선택 반응 접기':'선택 반응 보기';};update();d.addEventListener('toggle',update);}
}
