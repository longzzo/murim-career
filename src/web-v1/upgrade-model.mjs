import {hasQi,qiDistribution,skillCost} from './qi.mjs';

// Display-only projections. No new qualification, random draw, or save write.
export function nextGoal(v){
 if(v.phase!=='home')return null;
 const direction=v.originRoute==='orthodox'?'강호의 일과 은원을 정리하고 금분세수로 나아갑니다.':'실력과 지지를 쌓아 우두머리에 도전합니다.';
 const goal=(title,reason,entry)=>({direction,title,reason,...entry});
 const weapon=v.inventory?.weapons.find(w=>w.equipped);
 if(v.body!=='안정')return goal('몸을 추스를 때','부상이 남아 있습니다. 회복 메뉴에서 치료 비용을 살펴보세요.',{label:'휴식·치료 살피기',action:'ACT-05',...(v.qi?{target:'default'}:{})});
 if(weapon?.durability===0)return goal('무기를 손볼 때','장착 무기의 내구가 소진됐습니다.',{label:'장착 무기 살피기',item:weapon.id});
 if(v.success)return goal('강호에 이름을 남기다','성공을 기록했습니다. 계속 지내거나 생애를 마칠 수 있습니다.',{label:'생애 마무리 살피기',review:'finish'});
 if(v.canRetire)return goal('금분세수를 앞두고','경지와 위협·은원 정리 조건을 갖췄습니다.',{label:'금분세수 살피기',review:'retire'});
 if(v.qi?.canRestorePaidSkill)return goal('운기로 내공을 채울 때','편성한 무공 중 현재 내공으로 발동할 수 없는 것이 있습니다.',{label:'운기 회복',action:'ACT-05',target:'breathing'});
 const targets=v.actions.find(a=>a.id==='ACT-09').targets;
 if(targets.includes('leader'))return goal('우두머리에게 도전','현재 실력과 지지로 결전에 나설 자격이 있습니다.',{label:'결전 살피기',action:'ACT-09',target:'leader'});
 if(v.threat.occurred&&!v.threat.resolved&&targets.includes('threat'))return goal('강호에 닥친 위협','이미 마주한 위협이 아직 해결되지 않았습니다.',{label:'위협 대응 살피기',action:'ACT-09',target:'threat'});
 if(v.debt.length)return goal('남은 은원을 풀다','지역 의뢰를 마치면 남은 은원 하나를 수습합니다.',{label:'지역 의뢰 시작',action:'ACT-03'});
 if(!v.knowsMentorSkill)return goal('사부의 후속 검법을 익힐 때','새 검법을 배운 뒤 무공에서 구성을 확인하고 교류 비무로 시험하세요.',{label:'후속 검법 배우기',action:'ACT-02'});
 if(v.guidance?.practiceSuggested)return goal('배운 검법을 시험해 볼 때','무공에서 적용 중 구성을 확인하세요. 교류 비무는 패배해도 생존하지만 부상을 입을 수 있습니다.',{label:'교류 비무 시작',action:'ACT-06'});
 if(!v.knowsMentorAssist)return goal('배움의 폭을 넓히다','검법 다음으로 사부의 기예를 익힐 수 있습니다.',{label:'사부의 기예 배우기',action:'ACT-02'});
 if(v.story?.offered)return goal('연락책의 제안을 살피다','현재 도착한 부탁의 목적과 완료 보수를 강호 활동에서 확인하세요.',{label:'도착한 제안 보기',group:'world'});
 if(v.quest<2){
  if(v.factions===1&&v.unlocks.includes('F-POPULAR'))return goal(v.quest===0?'이번 생애의 명문 교류':'이번 생애의 시험 과제',
   v.quest===0?'이미 보유한 입문 자격은 유지됩니다. 이번 생애의 교류·시험 두 단계를 마치면 내공 증진약 1개를 받습니다.':'이번 생애의 의술 과제 또는 시험 비무가 남았습니다. 완료 보수는 내공 증진약 1개이며, 기존 입문 자격은 유지됩니다.',{label:'명문 교류 과제 살피기',action:'ACT-08'});
  return goal(v.quest===0?'명문으로 향하는 단서':'명문의 시험이 남았다',v.quest===0?'첫 의뢰를 마치면 다음 시험의 단서를 얻습니다.':'첫 단계는 마쳤습니다. 의술 과제 또는 시험 비무가 남아 있습니다.',{label:'명문 의뢰 살피기',action:'ACT-08'});
 }
 if(v.originRoute==='orthodox')return v.realmIndex<2?
  goal('금분세수를 향한 기반','명문 의뢰를 마쳤습니다. 내공과 외공 중 필요한 기반을 골라 쌓으세요.',{label:'기반 수련 살피기',group:'training'}):
  goal('강호의 일로 인연을 잇다',v.threat.resolved?'위협을 정리했습니다. 지역 의뢰로 인연과 신뢰를 쌓을 수 있습니다.':'명문 의뢰를 마쳤습니다. 현재 할 수 있는 의뢰로 인연과 신뢰를 쌓으세요.',{label:'지역 의뢰 시작',action:'ACT-03'});
 return v.realmIndex<3?goal('결전을 향한 실력','명문 의뢰를 마쳤습니다. 내공과 외공 중 필요한 기반을 골라 돌파를 준비하세요.',{label:'기반 수련 살피기',group:'training'}):
  goal('결전을 향한 지지','현재 결전 자격이 부족합니다. 지역 의뢰는 명성과 문파 신뢰를 높입니다.',{label:'지역 의뢰 시작',action:'ACT-03'});
}

export function battleFacts(b){
 if(!b)return [];
 const attacks=b.resources?b.turns.filter(t=>t.player).map(t=>({...t.player,round:t.round})):
  b.turns.filter(t=>t.skill&&t.damage>0).map(t=>({skill:t.skill,skillId:t.skill,round:t.round}));
 const counts=new Map();for(const a of attacks){const entry=counts.get(a.skillId)??{id:a.skillId,name:a.skill,count:0};entry.count++;counts.set(a.skillId,entry);}
 const most=[...counts.values()].sort((a,z)=>z.count-a.count||(a.id<z.id?-1:a.id>z.id?1:0))[0];
 const first=most?`주 사용 · ${most.name} ${most.count}회`:'실제 공격 없음';
 if(!b.resources)return [first+' · 내공 자원 기록 없음'];
 const spent=attacks.reduce((sum,a)=>sum+a.cost,0),exhausted=attacks.find(a=>a.skillId==='BASIC'&&a.reason?.includes('내공 부족'));
 const canceled=b.turns.filter(t=>t.first==='opponent'&&t.player===null).length;
 const last=attacks.at(-1);
 return [first+` · 전투 전체 내공 소모 ${spent}`,exhausted?`${exhausted.round}합부터 내공 부족으로 기본 외공 발동 · 남은 내공 ${b.resources.player.endQi}`:
  `${last?`최종 공격 ${last.skill}`:'공격 전 전투 종료'} · 남은 내공 ${b.resources.player.endQi}${canceled?' · 상대 선공 뒤 반격 취소 '+canceled+'회':''}`];
}
export function nextPreparation(v){
 if(v.body!=='안정')return {title:'부상을 돌볼 준비',reason:'이번 결과 뒤 부상이 남았습니다. 치료 조건을 살펴보세요.',destination:'rest'};
 if(v.inventory?.weapons.some(w=>w.equipped&&w.durability===0))return {title:'무기를 손볼 준비',reason:'장착 무기의 내구가 소진됐습니다.',destination:'inventory'};
 if(v.qi?.canRestorePaidSkill)return {title:'내공을 채울 준비',reason:'편성한 무공의 발동 여력을 운기로 되찾을 수 있습니다.',destination:'rest'};
 if(v.result?.battle?.outcome==='loss')return {title:'구성과 성장 비교',reason:'실제 발동 기록과 현재 구성을 함께 살펴보세요. 패인을 하나로 단정할 수는 없습니다.',destination:'record'};
 if(v.guidance?.active.includes('learning'))return {title:'배운 검법의 구성 확인',reason:'배운 기술과 편성한 기술을 확인한 뒤 교류 비무로 시험하세요.',destination:'record'};
 const goal=nextGoal({...v,phase:'home'});
 if(!goal||goal.review)return {title:'다음 발걸음',reason:goal?.reason??'홈에서 현재 상황을 확인하세요.',destination:null};
 return {title:goal.title,reason:goal.reason,destination:goal.item?'inventory':goal.group??
  (['ACT-01','ACT-02','ACT-07','ACT-10'].includes(goal.action)?'training':['ACT-06','ACT-09'].includes(goal.action)?'duel':goal.action==='ACT-05'?'rest':'world')};
}
export function loadoutPreview(s,loadout){
 const selected={primary:loadout.primary,aux:loadout.aux.filter(id=>id!==loadout.primary)};
 const state={...s,life:{...s.life,loadout:selected}};
 const name=id=>id==='BASIC'?'기본 외공':s.content.skills.find(k=>k.id===id)?.name??id;
 if(!hasQi(s))return {primary:name(selected.primary),aux:selected.aux.map(name),legacy:true};
 const candidates=qiDistribution(state).map(o=>({id:o.id,name:name(o.id),cost:skillCost(s,o.id),weight:o.weight}));
 const validAux=candidates.filter(o=>o.id!==selected.primary&&o.id!=='BASIC').length;
 return {primary:name(selected.primary),aux:selected.aux.map(name),cost:skillCost(s,selected.primary),current:s.life.qi.current,
  candidates,efficiency:[1,.98,.95,.92][Math.min(3,validAux)],basicScale:s.content.qiRules.basicScale,
  basicOnly:candidates.length===1&&candidates[0].id==='BASIC'};
}
