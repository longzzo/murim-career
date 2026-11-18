// Meta progress comes only from committed choices; possession is not an active-life effect.
export const HERB_LEGACY='LG-HERB-PATH';
export const LEGACY_EFFECT='여행 중 일반 사건이 없을 때, 아직 만나지 않은 영초의 추가 발견 기회 20%';
const copy=structuredClone,need=ok=>{if(!ok)throw Error('전생 유산의 출처나 적용 기록이 맞지 않습니다. 원본 저장은 보존됩니다.');};
const same=(a,b)=>a===b||!!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
const seq=id=>/^life-[1-9]\d*$/.test(id??'')?Number(id.slice(5)):0;
const n=v=>Number.isSafeInteger(v)&&v>=0;
const text=v=>typeof v==='string'&&v.length>0;
export const hasLegacy=s=>s.versions.legacy===1;
export function startLegacy(s){
 if(!hasLegacy(s))return;
 s.meta.legacy??={version:1,earned:[]};
 s.life.legacy={version:1,active:copy(s.meta.legacy.earned),choices:[],checks:[],completedChoices:[]};
}
export function earnLegacy(s,pending,choice,command){
 if(!hasLegacy(s)||pending.id!=='A-007')return false;
 need(command.type==='choose'&&command.choice===choice.id);
 const completed=s.life.legacy.completedChoices??=[];
 need(!completed.length);
 completed.push({version:1,lifeId:s.life.id,eventId:pending.id,token:pending.token,choiceId:choice.id,month:s.life.month,
  command:{id:command.id,type:command.type,choice:command.choice},commandIndex:s.commands.length,revision:s.revision+1});
 if(choice.id!=='leave')return false;
 const commandId=command.id;
 const receipt={id:HERB_LEGACY,lifeId:s.life.id,name:s.life.name,eventId:pending.id,choiceId:choice.id,token:pending.token,commandId,month:s.life.month};
 need(!s.life.legacy.choices.length);
 s.life.legacy.choices.push(receipt);
 if(s.meta.legacy.earned.length)return false;
 s.meta.legacy.earned.push(copy(receipt));return true;
}
export function extraHerbEvent(s,def,random){
 if(!hasLegacy(s)||!s.life.legacy.active.length||s.life.seen.includes('A-007')||!def.tags.includes('travel'))return false;
 const before=s.rng,roll=random(s),found=roll<.2;
 s.life.legacy.checks.push({actionKey:s.active.key,actionId:def.id,month:s.life.month,rngBefore:before,rngAfter:s.rng,found});
 return found;
}
export function validateLegacy(s){
 if(!hasLegacy(s)){need(s.versions.legacy===undefined&&s.life.legacy===undefined&&s.meta.legacy===undefined);return;}
 need(s.versions.content==='web-v1.9'&&s.versions.rules==='web-v1.6'&&s.meta.legacy?.version===1&&Array.isArray(s.meta.legacy.earned)&&s.meta.legacy.earned.length<=1);
 const lives=[...s.meta.history.filter(h=>h.id!==s.life.id),s.life],byId=new Map(lives.map(l=>[l.id,l]));
 need(byId.size===lives.length&&!!s.life.legacy);
 const allChoices=[];
 for(const l of lives){
  const r=l.legacy;if(!r)continue;
  const month=l===s.life?l.month:(l.age-16)*12+(l.ageMonths??0);
  need(r.version===1&&Array.isArray(r.active)&&r.active.length<=1&&Array.isArray(r.choices)&&r.choices.length<=1&&Array.isArray(r.checks));
  // r1 never recorded completed event commands. Empty r1 progress can continue, but
  // an earned receipt without completion evidence cannot be safely backfilled.
  const completed=r.completedChoices===undefined?[]:r.completedChoices;
  need(seq(l.id)>0&&Array.isArray(completed)&&completed.length<=1);
  for(const d of completed){
   need(d?.version===1&&d.lifeId===l.id&&d.eventId==='A-007'&&['leave','gather','light'].includes(d.choiceId)&&
    typeof d.token==='string'&&new RegExp('^'+l.id+'/action-[1-9]\\d*/A-007$').test(d.token)&&
    n(d.month)&&d.month<=month&&d.command?.type==='choose'&&d.command.choice===d.choiceId&&text(d.command.id)&&
    n(d.commandIndex)&&n(d.revision)&&d.revision>d.commandIndex);
   if(l===s.life)need(s.pending?.token!==d.token&&l.occurrences.includes(d.token)&&l.seen.includes('A-007')&&
    s.commands[d.commandIndex]===d.command.id&&s.commands.indexOf(d.command.id)===d.commandIndex&&
    d.revision===s.revision-s.commands.length+1+d.commandIndex);
  }
  const expectedChoices=completed.filter(d=>d.choiceId==='leave').map(d=>({id:HERB_LEGACY,lifeId:l.id,name:l.name,eventId:d.eventId,choiceId:d.choiceId,token:d.token,commandId:d.command.id,month:d.month}));
  need(same(r.choices,expectedChoices));
  for(const c of r.choices){
   need(c.id===HERB_LEGACY&&c.lifeId===l.id&&c.name===l.name&&c.eventId==='A-007'&&c.choiceId==='leave'&&text(c.commandId)&&text(c.token)&&c.token.startsWith(l.id+'/')&&c.token.endsWith('/A-007')&&n(c.month)&&c.month<=month);
   if(l===s.life)need(l.occurrences.includes(c.token)&&l.seen.includes('A-007')&&s.commands.includes(c.commandId));
   allChoices.push(c);
  }
  const expected=s.meta.legacy.earned.filter(c=>seq(c.lifeId)<seq(l.id));need(same(r.active,expected));
  const checked=new Set();let found=false,lastMonth=0;
  for(const c of r.checks){
   need(r.active.length===1&&!found&&/^action-[1-9]\d*$/.test(c.actionKey)&&!checked.has(c.actionKey)&&s.content.actions.some(a=>a.id===c.actionId&&a.tags.includes('travel'))&&n(c.month)&&c.month>=lastMonth&&c.month<=month&&n(c.rngBefore)&&c.rngBefore>0&&c.rngBefore<=0xffffffff);
   let x=c.rngBefore;x^=x<<13;x^=x>>>17;x^=x<<5;const after=x>>>0||1;
   need(c.rngAfter===after&&c.found===(after/4294967296<.2));
   if(c.found&&l===s.life)need(l.seen.includes('A-007')&&l.occurrences.includes(l.id+'/'+c.actionKey+'/A-007'));
   checked.add(c.actionKey);found=c.found;lastMonth=c.month;
  }
 }
 allChoices.sort((a,b)=>seq(a.lifeId)-seq(b.lifeId));
 need(same(s.meta.legacy.earned,allChoices.slice(0,1)));
 if(s.life.ending)need(same(s.meta.history.find(h=>h.id===s.life.id)?.legacy,s.life.legacy));
}
export function legacyView(s){
 const earned=s?.meta.legacy?.earned[0]??null;
 return {earned,active:!!s?.life.legacy?.active.length,enabled:!!s&&hasLegacy(s)};
}
