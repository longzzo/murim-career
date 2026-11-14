import {REALMS,ASSISTS} from './data.mjs';
import {hasQi,maxQi,maxHp} from './qi.mjs';

// Optional presentation record. The baseline is captured BEFORE the start cost.
// It never participates in combat, rewards, RNG, or lifetime decisions.
export function publicActionSnapshot(s){
 const l=s.life;
 const values={'기반 경험':Math.floor(l.xp/1000),'내공 기반':Math.floor(l.foundation.inner/1000),
  '외공 기반':Math.floor(l.foundation.outer/1000),'경지':REALMS[l.realm],
  '재화':l.money,'명성':l.fame,'문파 신뢰':l.trust,'몸 상태':['안정','가벼운 상처','심한 부상'][l.injury]};
 if(hasQi(s))Object.assign(values,{'현재 내공':l.qi.current,'최대 내공':maxQi(s),'최대 생명력':maxHp(s)});
 for(const k of s.content.skills)if(l.skills[k.id]!==undefined)values[k.name+' 숙련']=Math.floor(l.skills[k.id]/1000);
 for(const id of l.assists)values['기예 · '+ASSISTS[id]]='습득';
 if(l.inventory){
  values['영초 보유']=l.inventory.herbs;
  for(const [id,item]of Object.entries(s.content.items))if(item.type==='weapon')values[item.name+' 보유']=l.inventory.weapons.filter(w=>w.itemId===id).length;
 }
 if(hasQi(s))for(const [id,count]of Object.entries(l.qi.medicines))values[s.content.items[id].name+' 보유']=count;
 return values;
}
export function startActionSummary(before,action){
 return {version:1,lifeId:before.life.id,actionKey:action.key,actionId:action.id,target:action.target,
  startMonth:before.life.month,baseDuration:action.baseDuration,costBasis:'before-start-cost',start:publicActionSnapshot(before)};
}
export function actionSummary(s,action,status='progress'){
 const basis=action?.summary;if(!basis)return null;
 return {...structuredClone(basis),status,elapsed:s.life.month-basis.startMonth,
  extraMonths:action.duration-basis.baseDuration,end:publicActionSnapshot(s)};
}
export function recordActionSummary(before,after){
 if(!before.active?.summary||after.active)return;
 const completed=after.result?.actionId===before.active.id&&after.life.ending!=='battle';
 const summary=actionSummary(after,before.active,completed?'complete':'interrupted');
 after.life.lastActionSummary=summary;
 if(after.result)after.result.actionSummary=structuredClone(summary);
}
export function summaryChanges(summary){
 if(!summary)return [];
 return Object.entries(summary.end).filter(([label,to])=>summary.start[label]!==to)
  .map(([label,to])=>({label,from:summary.start[label]??(label.endsWith(' 보유')?0:'미습득'),to}));
}
export function validateActionSummaries(s){
 const check=(r,lifeId,month,active=false)=>{
  if(r===undefined)return;
  const n=x=>Number.isSafeInteger(x)&&x>=0;
  const validValues=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length<=50&&
   Object.entries(v).every(([key,value])=>key.length<=80&&(typeof value==='string'&&value.length<=80||n(value)));
  if(!(r?.version===1&&r.lifeId===lifeId&&/^action-\d+$/.test(r.actionKey)&&
   s.content.actions.some(a=>a.id===r.actionId)&&typeof r.target==='string'&&
   n(r.startMonth)&&r.startMonth<=month&&n(r.baseDuration)&&r.baseDuration>0&&
   r.costBasis==='before-start-cost'&&validValues(r.start)&&
   (active||['complete','interrupted'].includes(r.status)&&n(r.elapsed)&&r.startMonth+r.elapsed<=month&&
    n(r.extraMonths)&&r.elapsed<=r.baseDuration+r.extraMonths&&validValues(r.end))))throw Error('행동 전체 성과 기록 오류');
 };
 check(s.active?.summary,s.life.id,s.life.month,true);
 if(s.active?.summary){const a=s.active,r=a.summary;if(r.actionKey!==a.key||r.actionId!==a.id||r.baseDuration!==a.baseDuration||r.startMonth+a.elapsed!==s.life.month)throw Error('행동 시작 기준 불일치');}
 check(s.result?.actionSummary,s.life.id,s.life.month);
 check(s.life.lastActionSummary,s.life.id,s.life.month);
 for(const h of s.meta.history)check(h.actionSummary,h.id,(h.age-16)*12+(h.ageMonths??0));
}
