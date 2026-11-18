import {REGRESSION_MEMORY,memoryDefinition} from './regression-data.mjs';
const clone=structuredClone,requireMemory=(ok,message='호송 기억의 출처가 맞지 않습니다.')=>{if(!ok)throw Error(message);};
export const hasRegressionMemory=s=>s.versions.regressionMemory===1;
const definitions=s=>s.content.regressionMemory?.memories??REGRESSION_MEMORY.memories;
const reference=(life,h,m)=>({type:m.id,lifeId:life.id,source:h.source,choiceId:h.choice.id});
export function memoriesForNextLife(s,life=s.life){
 const refs=new Map((life.regressionMemory?.carried??[]).map(r=>[r.type,clone(r)]));
 for(const h of life.escortCareer?.history??[]){if(h.status!=='completed')continue;
  const m=definitions(s).find(m=>m.eventId===h.eventId&&m.earnedChoices.includes(h.choice?.id));
  if(m&&!refs.has(m.id))refs.set(m.id,reference(life,h,m));
 }
 return definitions(s).filter(m=>refs.has(m.id)).map(m=>refs.get(m.id));
}
export function startRegressionMemory(s,previous,regress){
 if(!hasRegressionMemory(s))return;
 s.life.regressionMemory={version:1,lineageId:regress?(previous.life.regressionMemory?.lineageId??previous.life.id):s.life.id,fromLifeId:regress?previous.life.id:null,carried:regress?memoriesForNextLife(previous):[]};
}
export function canUseMemory(life,choice){return !choice.requiresMemory||!!life.regressionMemory?.carried.some(r=>r.type===choice.requiresMemory);}
export function escortChoiceRecord(s,choice,month){
 const record={id:choice.id,label:choice.label,month,...clone(choice.escort)};
 if(choice.requiresMemory){
  const source=s.life.regressionMemory?.carried.find(r=>r.type===choice.requiresMemory);requireMemory(source,'이번 생애에 가져온 호송 기억이 없습니다.');
  record.memory={...record.memory,source:clone(source)};
 }
 return record;
}
export function memoryOutcome(s,h,earlier=s.life.escortCareer.history){
 if(!s.life.regressionMemory)return undefined;
 const m=definitions(s).find(m=>m.eventId===h.eventId&&m.earnedChoices.includes(h.choice?.id));
 const existing=memoriesForNextLife(s,{...s.life,escortCareer:{history:earlier}});
 return {acquired:m&&!existing.some(r=>r.type===m.id)?reference(s.life,h,m):null,used:h.choice?.memory?clone(h.choice.memory):null};
}
export function validateRegressionMemory(s){
 if(!hasRegressionMemory(s)){requireMemory(s.versions.regressionMemory===undefined&&s.life.regressionMemory===undefined&&s.content.regressionMemory===undefined);return;}
 requireMemory((s.versions.content==='web-v1.7'&&s.versions.rules==='web-v1.4'||s.versions.content==='web-v1.8'&&s.versions.rules==='web-v1.5'||s.versions.content==='web-v1.9'&&s.versions.rules==='web-v1.6')&&s.versions.escortCareer===1);
 const history=s.meta.history,all=[...history.filter(h=>h.id!==s.life.id),s.life],byId=new Map(all.map(l=>[l.id,l]));
 requireMemory(byId.size===all.length);
 for(const life of all){
  const r=life.regressionMemory;if(!r){requireMemory(life!==s.life);continue;}
  requireMemory(r.version===1&&Array.isArray(r.carried)&&r.carried.length<=4);
  let expected;
  if(life.regression){
   const seq=Number(life.id.slice(5)),parent=byId.get(r.fromLifeId);
   requireMemory(parent&&r.fromLifeId==='life-'+(seq-1)&&parent!==s.life);
   expected={version:1,lineageId:parent.regressionMemory?.lineageId??parent.id,fromLifeId:parent.id,carried:memoriesForNextLife(s,parent)};
  }else expected={version:1,lineageId:life.id,fromLifeId:null,carried:[]};
  requireMemory(JSON.stringify(r)===JSON.stringify(expected));
  for(const ref of r.carried){const source=byId.get(ref.lifeId),h=source?.escortCareer?.history.find(h=>h.source===ref.source),m=memoryDefinition(s.content,ref.type);
   requireMemory(m&&source&&h?.status==='completed'&&h.lifeId===ref.lifeId&&h.eventId===m.eventId&&h.choice?.id===ref.choiceId&&m.earnedChoices.includes(ref.choiceId));
  }
 }
 if(s.phase==='ended')requireMemory(JSON.stringify(history.find(h=>h.id===s.life.id)?.regressionMemory)===JSON.stringify(s.life.regressionMemory));
}
export function memoryDisplay(s,ref){
 const m=definitions(s).find(m=>m.id===ref.type),life=ref.lifeId===s.life.id?s.life:s.meta.history.find(h=>h.id===ref.lifeId),h=life?.escortCareer?.history.find(h=>h.source===ref.source);
 requireMemory(m&&h&&life);
 const base=s.content.events.find(e=>e.id===m.eventId)?.choices.find(c=>c.id===m.baseChoice);
 return {id:m.id,name:m.name,rankId:m.rankId,rankName:m.rankName,eventId:m.eventId,eventName:s.content.events.find(e=>e.id===m.eventId)?.name,monthsSaved:m.monthsSaved,baselineChoice:base?.label??'',baseExtraMonths:m.monthsSaved,rewardDelta:base?.escort.rewardDelta??0,
  source:{lifeNumber:Number(life.id.slice(5)),lifeName:life.name,choice:h.choice.label,mission:h.mission,month:h.endedMonth},inherited:!!s.life.regressionMemory?.carried.some(x=>x.type===ref.type)};
}
export function regressionView(s){
 const eligible=s.versions.escortCareer===1,carried=s.life.regressionMemory?.carried??[],next=eligible?memoriesForNextLife(s):[];
 const activeRank=s.life.escortCareer?.rankId??'EC-R0';
 return {eligible,bridge:s.versions.content==='web-v1.6',enabled:hasRegressionMemory(s),carried:carried.map(r=>memoryDisplay(s,r)),next:next.map(r=>memoryDisplay(s,r)),available:carried.map(r=>memoryDisplay(s,r)).find(m=>m.rankId===activeRank)??null};
}
export function memoryResultView(s){
 const h=s.result?.escortCareer,o=h?.memoryOutcome;if(!o)return null;
 return {acquired:o.acquired?memoryDisplay(s,o.acquired):null,used:o.used?{...memoryDisplay(s,o.used.source),extraMonthsSaved:o.used.extraMonthsSaved,actualMonths:h.elapsed,actualReward:h.actualReward,otherMonths:h.elapsed-h.baseMonths-h.choice.months}:null,npcGain:h.npcGain,fameGain:h.fameGain,responsibility:s.content.escortCareer.ranks.find(r=>r.milestone&&r.milestone===h.choice.milestone)?.responsibility??null};
}
