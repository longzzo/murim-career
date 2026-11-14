// Experience facts are written only by completed actions/battles, never by rendering.
export const hasGuidance=s=>s.versions.guidance===1;
const keys=['learning','spar','exhaustion'];
const requireGuide=(value,message)=>{if(!value)throw Error(message);};
// Older guidance records had no action source. Only the ACT-06 opponent was
// exclusive to practice; rival/master duel records must not consume that guide.
function actualSpar(s){
 const fact=s.life.guidance.spar;
 return fact&&(!fact.actionId||fact.actionId==='ACT-06')&&s.life.qi.battles.some(b=>b.id===fact.battleId&&b.enemyKey==='novice')?fact:null;
}
export function startGuidance(s){
 if(hasGuidance(s))s.life.guidance={version:1,collapsed:false,read:[],learning:null,spar:null,exhaustion:null};
}
export function validateGuidance(s){
 const g=s.life.guidance;
 if(!hasGuidance(s)){requireGuide(g===undefined&&s.versions.guidance===undefined,'이전 생애의 안내 상태 오류');return;}
 requireGuide(s.versions.qi===1&&g?.version===1&&typeof g.collapsed==='boolean'&&Array.isArray(g.read)&&new Set(g.read).size===g.read.length&&
  g.read.every(k=>keys.includes(k)&&g[k]),'안내 상태 오류');
 for(const key of keys)if(g[key])requireGuide(Number.isInteger(g[key].month)&&g[key].month>=0&&g[key].month<=s.life.month,'안내 경험 시점 오류');
 if(g.learning)requireGuide(typeof g.learning.action==='string'&&g.learning.action.startsWith(s.life.id+'/')&&
  s.life.skills[g.learning.skillId]!==undefined,'첫 배움 근거 오류');
 for(const key of ['spar','exhaustion'])if(g[key]){
  const battle=s.life.qi.battles.find(b=>b.id===g[key].battleId);
  requireGuide(battle&&(key==='spar'?battle.mode==='duel':battle.turns.some(t=>t.player?.skillId==='BASIC'&&t.player.reason.includes('내공 부족'))),'첫 전투 경험 근거 오류');
  if(key==='spar'&&g.spar.actionId!==undefined)requireGuide(g.spar.actionId==='ACT-06'&&battle.enemyKey==='novice'&&
   typeof g.spar.action==='string'&&g.spar.action.startsWith(s.life.id+'/action-'),'교류 비무 행동 근거 오류');
 }
}
export function learnedGuidance(s,action,skillId){
 if(hasGuidance(s)&&!s.life.guidance.learning)s.life.guidance.learning={action:s.life.id+'/'+action.key,skillId,month:s.life.month};
}
export function battleGuidance(s,battle){
 if(!hasGuidance(s))return;
 const g=s.life.guidance,fact={battleId:battle.id,month:s.life.month};
 if(!g.exhaustion&&battle.turns.some(t=>t.player?.skillId==='BASIC'&&t.player.reason.includes('내공 부족')))g.exhaustion={...fact};
}
export function practiceGuidance(s,battle,action){
 if(!hasGuidance(s)||actualSpar(s))return;
 requireGuide(action.id==='ACT-06'&&battle.enemyKey==='novice','교류 비무 완료 근거 오류');
 const g=s.life.guidance;
 g.spar={battleId:battle.id,month:s.life.month,actionId:action.id,action:s.life.id+'/'+action.key};
 g.read=g.read.filter(key=>key!=='spar');
}
export function manageGuidance(s,command){
 requireGuide(hasGuidance(s)&&['home','result'].includes(s.phase),'지금 안내 설정을 바꿀 수 없습니다.');
 const g=s.life.guidance;
 if(command.collapsed!==undefined){requireGuide(typeof command.collapsed==='boolean','안내 설정 오류');g.collapsed=command.collapsed;}
 for(const key of command.read??[]){requireGuide(keys.includes(key)&&(key==='spar'?actualSpar(s):g[key]),'확인할 경험이 없습니다.');if(!g.read.includes(key))g.read.push(key);}
}
export function guidanceView(s){
 if(!hasGuidance(s))return null;
 const g={...s.life.guidance,spar:actualSpar(s)},active=[];
 if(s.phase==='result'){
  if(g.learning&&g.learning.action===s.result?.actionKey)active.push('learning');
  for(const key of ['spar','exhaustion'])if(g[key]&&g[key].battleId===s.result?.battle?.id)active.push(key);
 }
 const facts={};
 if(g.learning){const skill=s.content.skills.find(k=>k.id===g.learning.skillId);facts.learning={name:skill.name,cost:skill.cost};}
 for(const key of ['spar','exhaustion'])if(g[key]){
  const b=s.life.qi.battles.find(b=>b.id===g[key].battleId);
  facts[key]={skills:[...new Set(b.turns.filter(t=>t.player).map(t=>t.player.skill))],before:b.resources.player.startQi,after:b.resources.player.endQi,
   spent:b.resources.player.startQi-b.resources.player.endQi};
 }
 return {collapsed:g.collapsed,read:g.read.filter(key=>key!=='spar'||g.spar),active,facts,practiceSuggested:!!g.learning&&!g.spar};
}
