// Career state is settled only inside the engine's existing atomic command transition.
import {escortChoiceRecord,memoryOutcome} from './regression.mjs';
export const hasEscort=s=>s.versions.escortCareer===1;
const clone=x=>structuredClone(x),requireEscort=(ok,message='표사 경력 기록 오류')=>{if(!ok)throw Error(message);};
const integer=(x,min=0)=>Number.isSafeInteger(x)&&x>=min;
const rank=(s,id)=>s.content.escortCareer.ranks.find(r=>r.id===id);
const speech=(s,id,text)=>({npcId:id,name:s.content.escortCareer.npcs.find(n=>n.id===id).name,text});
const source=(s,a)=>s.life.id+'/'+a.key;
function emptyCounts(s){return Object.fromEntries(s.content.escortCareer.ranks.map(r=>[r.id,0]));}
export function startEscort(s){if(hasEscort(s))s.life.escortCareer={version:1,lifeId:s.life.id,joinedMonth:null,rankId:null,totalCompleted:0,completedByRank:emptyCounts(s),milestones:[],history:[]};}
export function beginEscort(s,a){
 if(!hasEscort(s)||a.id!=='ACT-04')return;
 const c=s.life.escortCareer;if(c.joinedMonth===null){c.joinedMonth=s.life.month;c.rankId='EC-R0';}
 const r=rank(s,c.rankId);
 a.escortCareer={version:1,lifeId:s.life.id,actionKey:a.key,source:source(s,a),rankId:r.id,rankName:r.name,missionId:r.missionId,mission:r.mission,
  baseReward:r.reward,baseMonths:12,startedMonth:s.life.month,eventId:r.eventId,eventShown:false,eventMonth:null,choice:null,briefing:speech(s,r.speaker,r.brief)};
}
export function dueEscortEvent(s){
 const contract=s.active?.escortCareer;
 return hasEscort(s)&&contract&&!contract.eventShown&&s.active.elapsed>=s.content.escortCareer.choiceMonth?contract.eventId:null;
}
export function markEscortEvent(s){const c=s.active.escortCareer;c.eventShown=true;c.eventMonth=s.life.month;return c.source+'/'+c.eventId;}
export function chooseEscort(s,pending,choice){
 if(!hasEscort(s)||s.content.events.find(e=>e.id===pending.id)?.special!=='escortCareer')return;
 const c=s.active?.escortCareer;requireEscort(c&&c.eventId===pending.id&&c.eventShown&&!c.choice&&pending.token===c.source+'/'+c.eventId,'호송 판단의 근거가 맞지 않습니다.');
 c.choice=escortChoiceRecord(s,choice,s.life.month);
}
function promotion(s,from,to){return from===to?null:{from:rank(s,from).name,to:rank(s,to).name,nextMission:rank(s,to).mission,nextReward:rank(s,to).reward,
 reaction:speech(s,'NPC-ESCORT-STEWARD',`${rank(s,from).name}에서 ${rank(s,to).name}로 승진이다. 다음에는 ${rank(s,to).mission}을 맡기겠네.`)};}
export function settleEscort(s,a){
 if(!hasEscort(s)||a.id!=='ACT-04')return null;
 const c=s.life.escortCareer,contract=a.escortCareer,choice=contract?.choice;requireEscort(contract&&choice&&!c.history.some(h=>h.source===contract.source),'호송 정산이 없거나 이미 적용됐습니다.');
 const r=rank(s,contract.rankId),reward=contract.baseReward+choice.rewardDelta;
 s.life.money+=reward;s.life.fame+=2+choice.fameGain;s.life.npc+=1+choice.npcGain;
 c.totalCompleted++;c.completedByRank[r.id]++;
 if(choice.milestone&&!c.milestones.includes(choice.milestone))c.milestones.push(choice.milestone);
 const index=s.content.escortCareer.ranks.findIndex(x=>x.id===r.id);
 if(index<3&&c.completedByRank[r.id]>=2&&c.milestones.includes(r.milestone))c.rankId=s.content.escortCareer.ranks[index+1].id;
 const record={...clone(contract),status:'completed',endedMonth:s.life.month,elapsed:a.elapsed,duration:a.duration,actualReward:reward,npcGain:1+choice.npcGain,fameGain:2+choice.fameGain,
  rankAfter:c.rankId,rankNameAfter:rank(s,c.rankId).name,totalCompleted:c.totalCompleted,promotion:promotion(s,r.id,c.rankId),reaction:speech(s,choice.speaker,choice.reaction)};
 if(s.life.regressionMemory)record.memoryOutcome=memoryOutcome(s,record);
 c.history.push(record);return clone(record);
}
export function interruptEscort(s,cause){
 const a=s.active,c=a?.escortCareer;if(!hasEscort(s)||!c)return;
 requireEscort(!s.life.escortCareer.history.some(h=>h.source===c.source));
 s.life.escortCareer.history.push({...clone(c),status:'interrupted',endedMonth:s.life.month,elapsed:a.elapsed,duration:a.duration,cause,actualReward:0,npcGain:0,fameGain:0,
  rankAfter:s.life.escortCareer.rankId,rankNameAfter:rank(s,s.life.escortCareer.rankId).name,totalCompleted:s.life.escortCareer.totalCompleted,promotion:null,reaction:null});
}
export function escortSnapshot(s){
 if(!hasEscort(s))return {};
 const c=s.life.escortCareer;return {'표사 직위':c.rankId?rank(s,c.rankId).name:'미진입','호송 총 완수':c.totalCompleted,'인연':s.life.npc};
}
export function escortRecordView(h){
 if(!h)return null;
 return {rankName:h.rankName,mission:h.mission,baseReward:h.baseReward,baseMonths:h.baseMonths,startedMonth:h.startedMonth,eventShown:h.eventShown,
  briefing:clone(h.briefing),choice:h.choice?{label:h.choice.label,months:h.choice.months,rewardDelta:h.choice.rewardDelta,npcGain:h.choice.npcGain,fameGain:h.choice.fameGain}:null,
  status:h.status??'progress',endedMonth:h.endedMonth,elapsed:h.elapsed,duration:h.duration,actualReward:h.actualReward,
  rankNameAfter:h.rankNameAfter,totalCompleted:h.totalCompleted,promotion:clone(h.promotion??null),reaction:clone(h.reaction??null)};
}
export function savedEscortView(c){
 if(!c||c.joinedMonth===null)return null;
 const last=c.history.at(-1);return {rank:last?.rankNameAfter??'신입 표사',totalCompleted:c.totalCompleted,history:c.history.map(escortRecordView)};
}
export function escortView(s){
 if(!hasEscort(s))return null;
 const c=s.life.escortCareer,r=rank(s,c.rankId??'EC-R0'),i=s.content.escortCareer.ranks.findIndex(x=>x.id===r.id);
 return {joined:c.joinedMonth!==null,rankId:c.rankId,rank:c.rankId?r.name:null,totalCompleted:c.totalCompleted,completedAtRank:c.completedByRank[r.id],required:2,
  responsibility:r.responsibility,responsibilityMet:r.milestone?c.milestones.includes(r.milestone):true,highest:i===3,
  mission:r.mission,reward:r.reward,months:12,next:i<3?clone(s.content.escortCareer.ranks[i+1]):null,
  active:escortRecordView(s.active?.escortCareer),history:c.history.map(escortRecordView)};
}
export function validateEscort(s,historyOnly=false){
 const c=s.life.escortCareer;
 if(!hasEscort(s)){requireEscort(s.versions.escortCareer===undefined&&s.content.escortCareer===undefined&&c===undefined&&s.active?.escortCareer===undefined,'기존 생애의 경력 상태 오류');return;}
 requireEscort((s.versions.content==='web-v1.6'&&s.versions.rules==='web-v1.3'||s.versions.content==='web-v1.7'&&s.versions.rules==='web-v1.4'||s.versions.content==='web-v1.8'&&s.versions.rules==='web-v1.5')&&c?.version===1&&c.lifeId===s.life.id&&integer(c.totalCompleted)&&Array.isArray(c.history)&&Array.isArray(c.milestones));
 const ranks=s.content.escortCareer.ranks,counts=emptyCounts(s),marks=[];let current='EC-R0',total=0,lastMonth=-1,lastKey=0;const sources=new Set();
 const validateContract=h=>{
  const r=rank(s,h.rankId),key=Number(h.actionKey?.slice(7));requireEscort(r&&h.version===1&&h.lifeId===s.life.id&&/^action-[1-9]\d*$/.test(h.actionKey)&&key>lastKey&&key<=s.nextAction&&h.source===s.life.id+'/'+h.actionKey);
  requireEscort(h.rankId===current&&h.rankName===r.name&&h.missionId===r.missionId&&h.mission===r.mission&&h.baseReward===r.reward&&h.baseMonths===12&&h.eventId===r.eventId&&integer(h.startedMonth)&&h.startedMonth>=lastMonth&&h.startedMonth<=s.life.month&&h.startedMonth>=c.joinedMonth);
  requireEscort(JSON.stringify(h.briefing)===JSON.stringify(speech(s,r.speaker,r.brief))&&typeof h.eventShown==='boolean');
  requireEscort(h.eventShown?integer(h.eventMonth)&&h.eventMonth>=h.startedMonth+6&&h.eventMonth<=s.life.month:h.eventMonth===null&&h.choice===null);
  if(!historyOnly)requireEscort(Array.isArray(s.life.occurrences)&&s.life.occurrences.includes(h.source+'/'+h.eventId)===h.eventShown,'호송 사건의 발생 근거가 맞지 않습니다.');
  if(h.choice){const d=s.content.events.find(e=>e.id===h.eventId).choices.find(x=>x.id===h.choice.id);requireEscort(h.eventShown&&d&&integer(h.choice.month)&&h.choice.month===h.eventMonth&&h.choice.month<=s.life.month);requireEscort(JSON.stringify(h.choice)===JSON.stringify(escortChoiceRecord(s,d,h.choice.month)));}
  return r;
 };
 for(const h of c.history){
  const r=validateContract(h);requireEscort(!sources.has(h.source)&&['completed','interrupted'].includes(h.status)&&integer(h.endedMonth)&&h.endedMonth<=s.life.month&&integer(h.elapsed)&&integer(h.duration,12)&&h.endedMonth===h.startedMonth+h.elapsed&&h.duration>=12+(h.choice?.months??0));sources.add(h.source);lastMonth=h.endedMonth;
  requireEscort(!h.eventShown||h.eventMonth<=h.endedMonth);lastKey=Number(h.actionKey.slice(7));
  const from=current;
  if(h.status==='completed'){
   requireEscort(JSON.stringify(h.memoryOutcome)===JSON.stringify(memoryOutcome(s,h,c.history.slice(0,c.history.indexOf(h)))),'호송 기억의 획득/사용 근거 오류');
   requireEscort(h.choice&&h.elapsed===h.duration&&h.actualReward===h.baseReward+h.choice.rewardDelta&&h.npcGain===1+h.choice.npcGain&&h.fameGain===2+h.choice.fameGain);
   counts[r.id]++;total++;if(h.choice.milestone&&!marks.includes(h.choice.milestone))marks.push(h.choice.milestone);
   const i=ranks.findIndex(x=>x.id===r.id);if(i<3&&counts[r.id]>=2&&marks.includes(r.milestone))current=ranks[i+1].id;
   requireEscort(JSON.stringify(h.reaction)===JSON.stringify(speech(s,h.choice.speaker,h.choice.reaction)));
  }else requireEscort(!!s.life.ending&&h===c.history.at(-1)&&h.cause===s.life.ending&&h.elapsed<h.duration&&h.actualReward===0&&h.npcGain===0&&h.fameGain===0&&h.reaction===null&&h.memoryOutcome===undefined);
  requireEscort(h.rankAfter===current&&h.rankNameAfter===rank(s,current).name&&h.totalCompleted===total&&JSON.stringify(h.promotion)===JSON.stringify(promotion(s,from,current)));
 }
 requireEscort(JSON.stringify(c.completedByRank)===JSON.stringify(counts)&&JSON.stringify(c.milestones)===JSON.stringify(marks)&&c.totalCompleted===total);
 if(c.joinedMonth===null)requireEscort(c.rankId===null&&!c.history.length&&!s.active?.escortCareer);
 else requireEscort(integer(c.joinedMonth)&&c.joinedMonth<=s.life.month&&c.rankId===current&&(c.history.length||s.active?.escortCareer));
 if(s.active?.id==='ACT-04'){
  const h=s.active.escortCareer;requireEscort(h&&c.joinedMonth!==null&&!sources.has(h.source));validateContract(h);
  requireEscort(h.actionKey===s.active.key&&s.active.baseDuration===12&&h.startedMonth+s.active.elapsed===s.life.month&&s.active.duration>=12+(h.choice?.months??0));
  if(h.eventShown&&!h.choice)requireEscort(s.pending?.id===h.eventId&&s.pending.token===h.source+'/'+h.eventId&&s.pending.month===h.eventMonth);
 }else requireEscort(s.active?.escortCareer===undefined);
 if(s.pending?.id?.startsWith('EC-'))requireEscort(s.active?.escortCareer?.eventId===s.pending.id&&s.active.escortCareer.eventShown&&!s.active.escortCareer.choice);
 if(s.result?.escortCareer){
  const r=s.result,h=r.escortCareer,a=r.actionSummary;
  requireEscort(h.status==='completed'&&r.actionId==='ACT-04'&&r.actionKey===h.source&&h.actionKey==='action-'+s.nextAction&&r.completionMoney===h.actualReward&&
   c.history.at(-1)?.source===h.source&&h.totalCompleted===c.totalCompleted&&h.rankAfter===c.rankId&&JSON.stringify(a)===JSON.stringify(s.life.lastActionSummary)&&
   a?.lifeId===h.lifeId&&a.actionKey===h.actionKey&&a.actionId==='ACT-04'&&a.status==='complete'&&a.startMonth===h.startedMonth&&a.elapsed===h.elapsed&&a.baseDuration===h.baseMonths&&a.baseDuration+a.extraMonths===h.duration&&
   a.end['표사 직위']===h.rankNameAfter&&a.end['호송 총 완수']===h.totalCompleted&&c.history.some(x=>JSON.stringify(x)===JSON.stringify(h)),'현재 호송 결과와 정산 근거가 맞지 않습니다.');
 }else if(s.result?.actionId==='ACT-04')requireEscort(false,'호송 결과의 정산 기록이 없습니다.');
 if(!historyOnly)for(const h of s.meta.history)if(h.escortCareer){
  const saved=h.escortCareer;
  requireEscort(saved.lifeId===h.id&&saved.joinedMonth!==null&&Array.isArray(saved.history)&&saved.history.length);
  if(h.id===s.life.id)requireEscort(!!s.life.ending&&JSON.stringify(saved)===JSON.stringify(c));
  validateEscort({versions:s.versions,content:s.content,life:{id:h.id,month:h.id===s.life.id?s.life.month:(h.age-16)*12+(h.ageMonths??0),ending:h.cause,escortCareer:saved,regressionMemory:h.regressionMemory},
   active:null,pending:null,result:null,nextAction:Math.max(...saved.history.map(r=>Number(r.actionKey?.slice(7))))},true);
 }
}
