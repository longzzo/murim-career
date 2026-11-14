import {DATA,VERSION,INVENTORY_DATA,INVENTORY_VERSION,LEGACY_DATA,LEGACY_VERSION,REALMS,THRESHOLDS,ASSISTS,ECONOMY,REJUVENATION_MONTHS,validateData} from './data.mjs';
import {hasInventory,startInventory,validateInventory,grantItem,equippedForBattle,wearWeapon,manageInventory,inventoryView} from './inventory.mjs';
import {hasQi,startQi,validateQi,maxQi,maxHp,qiView,qiDistribution,skillCost,qiRisk,fightQi,grantMedicine,useMedicine,MEDICINES} from './qi.mjs';
import {hasGuidance,startGuidance,validateGuidance,learnedGuidance,battleGuidance,practiceGuidance,manageGuidance,guidanceView} from './guidance.mjs';
import {hasStory,startStory,validateStory,requireOffer,acceptOffer,decideOffer,storyCompletion,closeStory,storyView,savedStoryView} from './story.mjs';
const clone=x=>structuredClone(x);
const addUnique=(xs,x)=>{if(!xs.includes(x))xs.push(x);};
const requireThat=(condition,message)=>{if(!condition)throw Error(message);};
export const RECAP_QUOTE_KEY='new-breakthrough-unreached';
export const RECAP_QUOTE='조금만 더 시간이 있었더라면, 새로운 경지에 닿을 수 있었을 텐데.';
export function random(s){let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0||1;return s.rng/4294967296;}
function note(s,text){s.life.log.push({month:s.life.month,text});if(s.life.log.length>240)s.life.log.shift();}
const bodyName=injury=>['안정','가벼운 상처','심한 부상'][injury];
const validChangeValue=value=>typeof value==='string'||Number.isFinite(value);
const validChanges=changes=>Array.isArray(changes)&&changes.every(change=>typeof change?.label==='string'&&
 validChangeValue(change.from)&&validChangeValue(change.to));

function recordChanges(before,after,command){
 const previous=before.life,current=after.life,changes=[];
 function change(label,from,to){
  if(from!==to)changes.push({label,from,to});
 }
 change('기반 경험',Math.floor(previous.xp/1000),Math.floor(current.xp/1000));
 change('내공 기반',Math.floor(previous.foundation.inner/1000),Math.floor(current.foundation.inner/1000));
 change('외공 기반',Math.floor(previous.foundation.outer/1000),Math.floor(current.foundation.outer/1000));
 change('경지',REALMS[previous.realm],REALMS[current.realm]);
 change('재화',previous.money,current.money);
 change('명성',previous.fame,current.fame);
 change('문파 신뢰',previous.trust,current.trust);
 change('몸 상태',bodyName(previous.injury),bodyName(current.injury));
 if(hasQi(before)&&hasQi(after)){
  change('현재 내공',previous.qi.current,current.qi.current);
  change('최대 내공',maxQi(before),maxQi(after));
  change('최대 생명력',maxHp(before),maxHp(after));
  for(const id of MEDICINES)change(after.content.items[id].name+' 보유',previous.qi.medicines[id],current.qi.medicines[id]);
 }
 for(const [id,value] of Object.entries(current.skills)){
  const skill=after.content.skills.find(entry=>entry.id===id).name;
  if(previous.skills[id]===undefined)change(skill,'미습득','습득');
  else change(skill+' 숙련',Math.floor(previous.skills[id]/1000),Math.floor(value/1000));
 }
 for(const assist of current.assists)if(!previous.assists.includes(assist))change(ASSISTS[assist],'미습득','습득');
 const oldBag=previous.inventory,bag=current.inventory;
 if(bag&&oldBag){
  for(const weapon of bag.weapons){
   const old=oldBag.weapons.find(entry=>entry.id===weapon.id);
   const name=after.content.items[weapon.itemId].name;
   if(old)change(name+' 내구',old.durability,weapon.durability);
   else change(name+' 보유',0,1);
  }
  change('영초 보유',oldBag.herbs,bag.herbs);
  if(oldBag.equipped!==bag.equipped)change('장착 무기',after.content.items[oldBag.weapons.find(w=>w.id===oldBag.equipped).itemId].name,
   after.content.items[bag.weapons.find(w=>w.id===bag.equipped).itemId].name);
 }
 if(command.type==='rejuvenate')change('육체 약화','미적용','적용');
 if(!changes.length)return;
 const history=current.changes??=[];
 history.push({revision:after.revision,month:current.month,changes});
 if(history.length>40)history.shift();
 if(after.result&&['advance','choose'].includes(command.type)&&
  (after.phase==='result'||after.result.battle?.id!==before.result?.battle?.id))after.result.changes=changes;
}

function recordEnding(before,after){
 if(before.life.ending||!after.life.ending)return;
 const record=after.meta.history.find(entry=>entry.id===after.life.id);
 record.ageMonths=after.life.month%12;
 const actionId=before.active?.id??after.result?.actionId??before.result?.actionId??after.life.lastActionId;
 const action=after.content.actions.find(entry=>entry.id===actionId);
 if(action)record.lastAction=action.name;
}
export function newGame(options={},previous=null){
 return createGame(options,previous,VERSION,DATA);
}
export function newInventoryGame(options={}){
 return createGame(options,null,INVENTORY_VERSION,INVENTORY_DATA);
}
export function newLegacyGame(options={}){
 return createGame(options,null,LEGACY_VERSION,LEGACY_DATA);
}
function createGame(options,previous,version,data){
 const meta=previous?clone(previous.meta):{unlocks:[],clues:[],history:[],successes:[]};
 const old=previous?.life;
 const origin=options.origin||old?.origin||'P-01';
 const mentor=options.mentor||old?.mentor||DATA.mentors.find(m=>m.origin===origin)?.id;
 requireThat(DATA.mentors.some(m=>m.id===mentor&&m.origin===origin),'출신과 스승이 맞지 않습니다.');
 const s={versions:clone(version),content:clone(data),revision:0,commands:[],initialSeed:(Number(options.seed)>>>0)||1729,rng:(Number(options.seed)>>>0)||1729,phase:'home',pending:null,queue:[],active:null,result:null,nextAction:0,life:null,meta};
 const seq=(previous?.life.seq||0)+1;
 const trait=options.regress?old.trait:options.trait&&options.trait!=='random'?options.trait:(random(s)<.5?'천무지체':'약응체');
 requireThat(['천무지체','약응체'].includes(trait),'체질 오류');
 s.life={id:`life-${seq}`,seq,name:String(options.name||old?.name||'무명').trim().slice(0,16)||'무명',origin,mentor,inclination:options.inclination||old?.inclination||'inner',month:0,limit:528,realm:0,xp:0,foundation:{inner:0,outer:0},money:100,fame:0,trust:0,npc:0,skills:{SAMJAE:10000},loadout:{primary:'SAMJAE',aux:[]},disabled:[],assists:[],trait,traitKnown:false,insight:false,breakthroughs:[],injury:0,lightMonths:0,rejuvenated:false,herbApplied:false,realmExtension:false,world:{id:random(s)<.5?'W-E02':'W-M02',checked:[],occurred:false,resolved:false},seen:[],occurrences:[],debt:[],quest:0,success:null,ending:null,leader:false,regression:!!options.regress,log:[]};
 if(hasInventory(s))startInventory(s);
 if(hasQi(s))startQi(s);
 startGuidance(s);
 startStory(s);
 note(s,options.regress?'기억을 품고 새 생애를 시작했다. 실력과 배움은 다시 쌓아야 한다.':'삼재검법으로 강호의 첫걸음을 내디뎠다.');
 validateState(s);return s;
}
export function validateState(s){
 const v=s?.versions;
 const legacy=v?.rules===LEGACY_VERSION.rules&&['web-v1.0',LEGACY_VERSION.content].includes(v.content);
 const inventory=v?.rules===INVENTORY_VERSION.rules&&v.save===2&&v.content===INVENTORY_VERSION.content;
 requireThat((legacy&&[1,2].includes(v.save)&&v.inventory===undefined)||
  inventory||(v?.rules===VERSION.rules&&v.save===VERSION.save&&v.content===VERSION.content&&v.qi===1),'호환되지 않는 저장 버전입니다. 원본은 보존됩니다.');
 requireThat(s.versions.recap===undefined||s.versions.recap===1,'호환되지 않는 회고 버전입니다. 원본은 보존됩니다.');
 validateData(s.content);
 requireThat(s.content.version===s.versions.content,'콘텐츠 버전 불일치');
 const l=s.life;
 requireThat(l&&Number.isInteger(l.month)&&l.month>=0&&Number.isFinite(l.limit)&&l.limit>=0,'시간 상태 손상');
 requireThat(Number.isInteger(l.realm)&&l.realm>=0&&l.realm<5&&Number.isFinite(l.xp)&&l.xp>=0,'성장 상태 손상');
 requireThat(['home','journey','event','result','grace','ended'].includes(s.phase),'진행 상태 손상');
 requireThat(s.content.mentors.some(m=>m.id===l.mentor&&m.origin===l.origin),'스승 참조 손상');
 const skillIds=new Set(s.content.skills.map(x=>x.id));
 for(const [id,v]of Object.entries(l.skills))requireThat(skillIds.has(id)&&Number.isFinite(v)&&v>=0,'무공 참조 손상');
 requireThat((hasQi(s)&&l.loadout.primary==='BASIC')||skillIds.has(l.loadout.primary)&&l.skills[l.loadout.primary]!==undefined,'주력 참조 손상');
 requireThat(l.loadout.aux.every(id=>skillIds.has(id)&&l.skills[id]!==undefined&&id!==l.loadout.primary)&&new Set(l.loadout.aux).size===l.loadout.aux.length,'보조 참조 손상');
 requireThat(Number.isInteger(s.rng)&&s.rng>0&&Number.isInteger(s.revision),'난수/리비전 손상');
 requireThat(Number.isFinite(l.money)&&l.money>=0&&Number.isInteger(l.quest)&&l.quest>=0&&l.quest<=2,'재화/퀘스트 손상');
 if(s.active){const a=s.active;requireThat(s.content.actions.some(x=>x.id===a.id)&&Number.isInteger(a.elapsed)&&a.elapsed>=0&&a.elapsed<=a.duration,'행동 상태 손상');}
 if(s.phase==='journey')requireThat(!!s.active,'진행 행동 누락');
 if(s.phase==='event')requireThat(s.content.events.some(x=>x.id===s.pending?.id),'사건 참조 손상');
 if(s.phase==='ended')requireThat(!!l.ending&&!s.active&&!s.pending,'종료 상태 손상');
 if(s.naturalRecapCandidate){const c=s.naturalRecapCandidate;requireThat(s.phase==='grace'&&validRecapFact(s,c),'회고 후보 상태 손상');}
 if(s.pending)requireThat(typeof s.pending.token==='string'&&s.pending.token.length>0,'사건 기록 오류');
 if(l.lastActionId!==undefined)requireThat(s.content.actions.some(action=>action.id===l.lastActionId),'마지막 행동 참조 오류');
 if(l.changes!==undefined)requireThat(Array.isArray(l.changes)&&l.changes.length<=40&&l.changes.every(entry=>
  Number.isInteger(entry?.revision)&&entry.revision<=s.revision&&Number.isInteger(entry.month)&&entry.month>=0&&entry.month<=l.month&&
  validChanges(entry.changes)),'상태 변화 기록 오류');
 if(s.result?.changes!==undefined)requireThat(validChanges(s.result.changes),'결과 변화 기록 오류');
 if(!legacy)validateInventory(s);
 else requireThat(l.inventory===undefined&&s.content.items===undefined,'기존 생애에 새 소지품이 포함되어 있습니다.');
 if(hasQi(s))validateQi(s);
 else requireThat(l.qi===undefined&&v.qi===undefined&&s.content.qiRules===undefined,'기존 생애에 새 내공 규칙이 포함되어 있습니다.');
 validateGuidance(s);
 validateStory(s);
 return true;
}
export function migrateSave(state){
 validateState(state);
 return state.versions.save===VERSION.save?state:{...clone(state),versions:{...state.versions,save:VERSION.save}};
}
function offeredTarget(s,target){
 return (s.life.breakthroughOffers||[]).some(x=>x.targetRealm===target)||s.life.occurrences.some(x=>x.startsWith(`${s.life.id}/realm-${target}/`))||
  (s.pending?.id==='V-004'&&s.life.realm+1===target);
}
function validRecapFact(s,c){return c.schemaVersion===1&&c.lifeId===s.life.id&&c.month===s.life.month&&c.targetRealm===s.life.realm+1&&c.targetRealm<5&&c.eligibleBefore===false&&c.eligibleAfter===true&&typeof c.token==='string'&&c.token.startsWith(`${s.life.id}/realm-${c.targetRealm}/`)&&!offeredTarget(s,c.targetRealm);}
function finishLife(s,cause,weapon=null){
 const l=s.life;if(l.ending)return;
 const candidate=s.naturalRecapCandidate;
 const recap=cause==='natural'&&candidate&&validRecapFact(s,candidate)?{...clone(candidate),quoteKey:RECAP_QUOTE_KEY,cause}:null;
 l.ending=cause;s.phase='ended';s.active=null;s.pending=null;s.queue=[];
 closeStory(s);
 delete s.naturalRecapCandidate;delete s.resumePhase;
 const record={id:l.id,name:l.name,origin:l.origin,mentor:l.mentor,age:16+Math.floor(l.month/12),realm:REALMS[l.realm],cause,success:l.success,regression:l.regression};
 if(recap)record.recap=recap;
 if(weapon)record.finalWeapon=clone(weapon);
 if(hasStory(s))record.story=clone(l.story);
 if(!s.meta.history.some(x=>x.id===l.id))s.meta.history.push(record);
 note(s,cause==='battle'?'전투에서 생애를 마쳤다.':'자연의 흐름 속에 생애를 마쳤다.');
}
function recordSuccess(s,kind){const l=s.life;if(l.success)return;l.success=kind;addUnique(s.meta.successes,l.id+':'+kind);note(s,kind==='retirement'?'은원을 정리하고 금분세수를 기록했다.':'결전에서 승리하고 살아남아 정복을 기록했다.');}
function naturalBoundary(s,candidate=null){
 if(s.life.ending||s.life.month<s.life.limit)return false;
 if(candidate)s.naturalRecapCandidate=candidate;else delete s.naturalRecapCandidate;
 if(!s.life.rejuvenated&&s.life.realm>=0&&s.life.breakthroughs.length>=2){s.resumePhase=s.phase;s.phase='grace';note(s,'몸이 한계에 다다랐다. 깨달음으로 마지막 선택을 마주한다.');}
 else finishLife(s,'natural');return true;
}
function event(s,id,token=id){const e=s.content.events.find(x=>x.id===id);requireThat(e,'없는 사건');s.pending={id,token,month:s.life.month};s.phase='event';addUnique(s.life.occurrences,token);if(id==='V-004'){s.life.breakthroughOffers??=[];s.life.breakthroughOffers.push({targetRealm:s.life.realm+1,token,offeredMonth:s.life.month});}addUnique(s.meta.clues,e.name);note(s,e.name+' — 새로운 선택을 마주했다.');}
function canChoose(l,choice){return !choice.requires||(choice.requires==='mediation'?l.fame>=4&&l.npc>=3:choice.requires==='inner'?l.foundation.inner>=20000:l.assists.includes(choice.requires));}
function canBreak(s){const l=s.life;return l.realm<4&&l.xp>=THRESHOLDS[l.realm+1]*1000&&l.insight&&s.active?.breakDeclined!==l.realm;}
function maybeBreak(s){if(canBreak(s)){event(s,'V-004',`${s.life.id}/realm-${s.life.realm+1}/action-${s.active.key}`);return true;}return false;}
function worldAtBoundary(s){
 const l=s.life;if(l.month%12||l.world.occurred)return;
 const year=l.month/12,from=l.world.id==='W-E02'?8:12,to=from+4;
 if(year<from||year>to||l.world.checked.includes(year))return;
 l.world.checked.push(year);
 if(year===to||random(s)<.3){l.world.occurred=true;s.queue.push({id:l.world.id,token:`${l.id}/${l.world.id}`});}
}
function showQueue(s){if(!s.queue.length)return false;const e=s.queue.shift();event(s,e.id,e.token);return true;}
function randomEvent(s){
 const a=s.active,l=s.life;if(a.randomChecked||a.elapsed<Math.floor(a.baseDuration/2))return false;
 a.randomChecked=true;
 const def=s.content.actions.find(x=>x.id===a.id);
 const candidates=s.content.events.filter(e=>!e.special&&!l.seen.includes(e.id)&&e.tags.some(t=>def.tags.includes(t))&&(!e.npc||l.npc>=e.npc));
 if(candidates.length&&random(s)<.25){const e=candidates[Math.floor(random(s)*candidates.length)];addUnique(l.seen,e.id);event(s,e.id,`${l.id}/${a.key}/${e.id}`);return true;}return false;
}
export function attackDistribution(s){
 if(hasQi(s))return qiDistribution(s);
 const l=s.life,known=id=>l.skills[id]!==undefined&&!l.disabled.includes(id)&&s.content.skills.find(x=>x.id===id)?.type==='attack';
 const p=known(l.loadout.primary)?l.loadout.primary:null;
 const aux=l.loadout.aux.filter(known);
 if(!p&&!aux.length)return [{id:'BASIC',weight:1}];
 if(!aux.length)return [{id:p,weight:1}];
 const main=p?([1,.8,.7,.6][Math.min(aux.length,3)]):0;
 const sum=aux.reduce((v,id)=>v+Math.max(1,l.skills[id]/1000),0);
 return [...(p?[{id:p,weight:main}]:[]),...aux.map(id=>({id,weight:(1-main)*Math.max(1,l.skills[id]/1000)/sum}))];
}
function injuryFactor(l){return(l.injury===2?.8:1)*(l.rejuvenated?.85:1);}
const basicAttack=(life,weapon)=>8+life.realm*4+(weapon?.attack??0);
function playerPower(l,distribution,base){
 return base*distribution.reduce((n,x)=>n+x.weight*(1+(l.skills[x.id]||0)/200000),0)*injuryFactor(l);
}
export function power(s){return playerPower(s.life,attackDistribution(s),basicAttack(s.life,equippedForBattle(s)));}
export function risk(s,enemy='rival'){
 const key=enemy.startsWith('ambush')?'ambush':enemy,original=s.content.enemies[key]||s.content.enemies.rival;
 if(hasQi(s)){
  const e=clone(original);
  if(enemy==='ambushTerrain')e.mastery=Math.max(0,e.mastery-5);
  if(enemy==='ambushLight')e.mastery=Math.max(0,e.mastery-10);
  return qiRisk(s,e,equippedForBattle(s));
 }
 const e=original,weapon=equippedForBattle(s),ratio=power(s)/((8+e.realm*4)*(1+e.mastery/200));return{level:ratio>=2?'우세':ratio>=1.1?'유리':ratio>=.8?'접전':'위험',enemy:e.name,mode:e.mode,reason:`${REALMS[s.life.realm]}의 기반과 실제 무공 숙련${weapon?' · 무기 공격력 +'+weapon.attack:''}${s.life.injury===2?' · 심한 부상':''}${s.life.rejuvenated?' · 연장 후 약화':''}`};
}
function styleMultiplier(a,b,gap){if(a==='neutral'||b==='neutral'||gap>=2)return 1;const ring=['쾌','중','강','환','유'];const ix=ring.indexOf(a),iy=ring.indexOf(b),v=gap===0?.1:.05;return(ix+1)%5===iy?1+v:(iy+1)%5===ix?1-v:1;}
export function resolveBattle(s,enemyKey){
 const baseKey=enemyKey.startsWith('ambush')?'ambush':enemyKey;
 const original=s.content.enemies[baseKey];requireThat(original,'전투 상대 오류');const e=clone(original);
 if(enemyKey==='ambushTerrain')e.mastery=Math.max(0,e.mastery-5);
 if(enemyKey==='ambushLight')e.mastery=Math.max(0,e.mastery-10);
 const l=s.life,battleRisk=risk(s,hasQi(s)?enemyKey:baseKey),weapon=equippedForBattle(s);
 let outcome=null,turns=[],over=false,resources=null;
 if(hasQi(s))({outcome,turns,resources}=fightQi(s,e,weapon,random));
 else{
 const dist=attackDistribution(s),aux=dist.filter(x=>x.id!==l.loadout.primary&&x.id!=='BASIC').length;
 const base=basicAttack(l,weapon);
 const diversity=aux?[1,.98,.95,.92][Math.min(3,aux)]:1;
 let hp=l.injury===2?80:100,enemyHp=100;
 const own=playerPower(l,dist,base),opp=(8+e.realm*4)*(1+e.mastery/200),under=opp>=own*2;
 over=own>=opp*2;
 for(let round=0;round<128;round++){
  const pick=random(s);let cumulative=0,id=dist.at(-1).id;
  for(const d of dist){cumulative+=d.weight;if(pick<cumulative){id=d.id;break;}}
  const skill=s.content.skills.find(x=>x.id===id)||{name:'기본 대응',style:'neutral'};
  let damage=Math.max(1,Math.floor(base*(1+(l.skills[id]||0)/200000)*injuryFactor(l)*diversity*styleMultiplier(skill.style,e.style,Math.abs(l.realm-e.realm))*(.9+random(s)*.2)));
  let received=Math.max(1,Math.floor(opp*styleMultiplier(e.style,skill.style,Math.abs(l.realm-e.realm))*(.9+random(s)*.2)));
  if(over)received=0;if(under)damage=Math.min(damage,1);
  hp=Math.max(0,hp-received);enemyHp=Math.max(0,enemyHp-damage);
  turns.push({round:round+1,skill:skill.name,skillId:id,style:skill.style,damage,received,hp,enemyHp});
  if(hp<=0||enemyHp<=0){outcome=hp<=0?(enemyHp<=0?'mutual':'loss'):'win';break;}
  if(e.mode==='encounter'&&hp<35&&round>=2&&random(s)<.35){outcome='escape';break;}
 }
 }
 requireThat(outcome,'전투가 종료되지 않았습니다. 검증 오류입니다.');
 const usedWeapon=weapon?wearWeapon(s,weapon):null;
 addUnique(s.meta.unlocks,e.faction);l.insight=true;
 if(outcome==='win'){
  if(over&&random(s)<.1){l.injury=Math.max(l.injury,1);l.lightMonths=6;}
  if(baseKey==='threat'){l.world.resolved=true;note(s,'회차의 핵심 위협을 해결했다.');}
  if(baseKey==='leader')recordSuccess(s,'conquest');
 }else if(e.mode==='duel'){l.injury=2;if(outcome==='mutual')outcome='loss';}
 else if(outcome==='loss'||outcome==='mutual'){
  if(outcome==='mutual'&&baseKey==='leader')addUnique(s.meta.clues,'최종 상대 격파 업적');
  finishLife(s,'battle',usedWeapon);
 }else if(outcome==='escape'){l.injury=2;addUnique(l.debt,'잃어버린 호송의 신뢰');}
 const result={id:usedWeapon?.battleId??`${l.id}/battle-${l.occurrences.length}-${l.month}-${l.log.length}`,enemy:e.name,enemyId:e.id,enemyKey:baseKey,mode:e.mode,outcome,turns,reason:battleRisk.reason};
 if(usedWeapon)result.weapon=usedWeapon;
 if(resources){result.resources=resources;l.qi.battles.push(clone(result));battleGuidance(s,result);}
 note(s,`${e.name}: ${outcome==='win'?'승리':outcome==='escape'?'도주':outcome==='mutual'?'동반 사망':'패배'} · 실제 발동 무공 ${[...new Set(turns.filter(t=>!resources||t.player).map(t=>t.skill))].join(', ')||'없음'}`);
 s.result={title:e.name,text:'전투 결과를 기록했습니다.',battle:result};return result;
}
function completeAction(s){
 const a=s.active,l=s.life,id=a.id;s.active=null;s.phase='result';
 const gains=a.itemGains??[];
 let text='진행한 시간과 성과를 기록했습니다.',battle=null;
 if(id==='ACT-02'){
  const m=s.content.mentors.find(x=>x.id===l.mentor);
  if(l.skills[m.skill]===undefined){l.skills[m.skill]=10000;l.loadout.primary=m.skill;l.loadout.aux=['SAMJAE'];text='사부에게 후속 검법을 배웠습니다.';learnedGuidance(s,a,m.skill);}
  else if(!l.assists.includes(m.assist)){l.assists.push(m.assist);text=`${ASSISTS[m.assist]}의 기초를 배웠습니다.`;}
  else{text='익힌 검의 원리를 사부와 되짚었습니다.';l.skills[m.skill]+=10000;l.insight=true;}
 }else if(id==='ACT-03'){
  l.money+=ECONOMY.commission;l.fame++;l.trust++;l.npc++;
  if(hasInventory(s)){
   const gain=grantItem(s,'WPN-FORGED',l.id+'/'+a.key+'/ACT-03');
   if(gain){gains.push(gain);note(s,gain.name+'을(를) 의뢰 보수로 받았습니다.');}
  }
  if(hasQi(s)){
   const gain=grantMedicine(s,'CON-QI-RECOVER',l.id+'/'+a.key+'/ACT-03/CON-QI-RECOVER');
   if(gain)gains.push(gain);
  }
  if(l.debt.length){const debt=l.debt.shift();text=`의뢰를 마치고 ${debt}의 은원을 수습했습니다.`;}else text='의뢰 완료 · 재화 +30 · 명성 +1 · 문파 신뢰 +1';
 }else if(id==='ACT-04'){l.money+=ECONOMY.escort;l.fame+=2;l.npc++;text='호송 완료 · 재화 +50 · 명성 +2';}
 else if(id==='ACT-05'){
  if(hasQi(s)&&a.target==='breathing'){const before=l.qi.current;l.qi.current=maxQi(s);text=`운기 완료 · 현재 내공 ${before} → ${l.qi.current} · 부상 치료 효과 없음`;}
  else if(a.paid){l.injury=0;l.lightMonths=0;text='치료를 마쳤습니다.';}
  else{if(l.injury===1)l.injury=0;text='무료 휴식으로 기력을 가다듬었습니다. 심한 부상에는 치료가 필요합니다.';}
 }
 else if(id==='ACT-06'){battle=resolveBattle(s,'novice');practiceGuidance(s,battle,a);if(battle.outcome==='win')l.fame+=2;text='비무로 실전의 계기를 얻었습니다.';}
 else if(id==='ACT-07'&&a.target==='assist'){
  const m=s.content.mentors.find(x=>x.id===l.mentor);addUnique(l.assists,m.assist);text=`${ASSISTS[m.assist]}를 배웠습니다.`;
 }else if(id==='ACT-08'){
  if(l.quest===0){l.quest=1;addUnique(s.meta.clues,'명문 입문 의뢰의 단서');text='첫 단계를 마쳤습니다. 다음 의뢰에서 시험을 치릅니다.';}
  else if(l.quest===1){
   if(l.assists.includes('medicine')){l.quest=2;addUnique(s.meta.unlocks,'F-POPULAR');text='의술 과제를 마치고 명문을 해금했습니다.';}
   else{battle=resolveBattle(s,'rival');if(battle.outcome==='win'){l.quest=2;addUnique(s.meta.unlocks,'F-POPULAR');text='시험 비무를 마치고 명문을 해금했습니다.';}else text='시험에서 배움을 얻었습니다. 첫 단계는 유지되어 재도전할 수 있습니다.';}
   if(hasQi(s)&&l.quest===2){
    const gain=grantMedicine(s,'CON-QI-CAPACITY',l.id+'/'+a.key+'/ACT-08/CON-QI-CAPACITY');
    if(gain)gains.push(gain);
   }
  }else text='이미 명문 해금을 마쳤습니다.';
 }else if(id==='ACT-09'){battle=resolveBattle(s,a.target||'rival');text=battle.outcome==='win'?'도전에서 승리했습니다.':'도전의 결과를 기록했습니다.';}
 if(l.ending)return;
 s.result={title:s.content.actions.find(x=>x.id===id).name+' 완료',text,battle,actionId:id};note(s,text);
 if(hasGuidance(s))s.result.actionKey=l.id+'/'+a.key;
 storyCompletion(s,a);
 if(hasInventory(s)&&id==='ACT-03')s.result.completionMoney=ECONOMY.commission;
 if(hasInventory(s)&&id==='ACT-04')s.result.completionMoney=ECONOMY.escort;
 if(hasInventory(s)&&a.paid)s.result.paidMoney=ECONOMY.treatment;
 if(gains.length)s.result.itemGains=gains;
}
function advance(s){
 requireThat(s.phase==='journey'&&s.active,'진행할 행동이 없습니다.');
 if(showQueue(s)||maybeBreak(s)||randomEvent(s))return;
 for(let guard=0;guard<1000;guard++){
  const a=s.active,l=s.life,def=s.content.actions.find(x=>x.id===a.id);
  requireThat(a&&a.elapsed<a.duration,'행동 진행 오류');
  const eligibleBefore=canBreak(s),targetRealm=l.realm+1,token=`${l.id}/realm-${targetRealm}/action-${a.key}`;
  a.elapsed++;l.month++;
  const growthElapsed=Math.min(a.elapsed,a.baseDuration);
  const desired=Math.floor(def.xp*1000*growthElapsed/a.baseDuration),delta=desired-a.xpCredited;
  l.xp+=delta;a.xpCredited=desired;
  const subject=a.target==='outer'?'outer':a.target==='inner'?'inner':l.inclination;
  l.foundation[subject]+=delta;
  if(a.target!=='assist'&&def.mastery&&l.skills[a.skill]!==undefined){
   const factor=l.trait==='천무지체'?1.15:1;
   const total=Math.floor(def.mastery*1000*factor*growthElapsed/a.baseDuration);
   l.skills[a.skill]+=total-a.masteryCredited;a.masteryCredited=total;
  }
  if(def.tags.includes('training')&&a.elapsed>=Math.floor(a.baseDuration/2))l.insight=true;
  if(!l.traitKnown&&def.tags.includes('training')){l.traitKnown=true;note(s,`${l.trait}의 작용을 알아차렸다. 효과는 발견 전부터 작용하고 있었다.`);addUnique(s.meta.clues,l.trait);}
  if(l.lightMonths>0){l.lightMonths--;if(l.lightMonths===0&&l.injury===1)l.injury=0;}
  const done=a.elapsed>=a.duration;
  if(done)completeAction(s);
  if(l.ending)return;
  const candidate=!eligibleBefore&&l.realm+1===targetRealm&&canBreak(s)&&!offeredTarget(s,targetRealm)?{schemaVersion:1,lifeId:l.id,month:l.month,targetRealm,token,eligibleBefore:false,eligibleAfter:true}:null;
  if(naturalBoundary(s,candidate))return;
  worldAtBoundary(s);
  if(done)return;
  if(showQueue(s)||maybeBreak(s)||randomEvent(s))return;
 }
 throw Error('진행 안전 한도를 초과했습니다.');
}
function applyEffect(s,type,value,source){const l=s.life;
 if(type==='npc')l.npc+=value;
 else if(type==='extra'){if(s.active)s.active.duration+=value;}
 else if(type==='heal'){if(l.assists.includes('medicine')&&l.trait==='약응체'){l.injury=0;l.npc++;}else if(l.injury===1)l.injury=0;}
 else if(type==='clue')addUnique(s.meta.clues,value);
 else if(type==='fame')l.fame+=value;
 else if(type==='debt')addUnique(l.debt,value);
 else if(type==='randomStudy'){if(random(s)<.5){l.insight=true;addUnique(s.meta.clues,'석실의 수련 흔적');}else{l.injury=Math.max(l.injury,1);l.lightMonths=6;note(s,'빈 석실에서 작은 상처를 입었다. 비급은 없었다.');}}
 else if(type==='insight')l.insight=true;
 else if(type==='learn'){if(l.skills[value]===undefined)l.skills[value]=10000;}
 else if(type==='herb'){
  if(random(s)<(value===2?.8:.45)){
   if(hasInventory(s)){
    const gain=grantItem(s,'CON-HERB',source);
    if(gain){
     if(s.active)(s.active.itemGains??=[]).push(gain);
     note(s,'영초 1개를 소지품에 보관했습니다.');
    }
   }else{
    if(!l.herbApplied){l.limit+=12;l.herbApplied=true;note(s,'영초의 효험으로 수명이 1년 늘었다.');}
    addUnique(s.meta.clues,'영초의 효험');
   }
  }else{l.injury=Math.max(1,l.injury);l.lightMonths=6;note(s,'영초는 얻지 못하고 물러났다.');}
 }else if(type==='resolveThreat')l.world.resolved=true;
 else if(type==='battle')resolveBattle(s,value);
 else if(type==='breakthrough'){
  const next=l.realm+1;requireThat(next<5&&l.xp>=THRESHOLDS[next]*1000&&l.insight,'돌파 자격이 없습니다.');
  requireThat(!l.breakthroughs.includes(next),'이미 적용한 돌파입니다.');l.realm=next;l.breakthroughs.push(next);
  if(next===4&&!l.realmExtension){l.limit+=24;l.realmExtension=true;note(s,'초절정의 변화로 수명이 2년 늘었다.');}
  note(s,`${REALMS[next]}의 경지에 올랐다. 깨달음 +1`);
 }else throw Error('알 수 없는 효과');
}
function choose(s,id){
 requireThat(s.phase==='event'&&s.pending,'선택할 사건이 없습니다.');
 const pending=s.pending,e=s.content.events.find(x=>x.id===pending.id),c=e.choices.find(x=>x.id===id);
 requireThat(c&&canChoose(s.life,c),'현재 선택할 수 없습니다.');
 if(e.id==='V-004'){
  s.life.breakthroughOffers??=[];
  let offer=s.life.breakthroughOffers.find(x=>x.token===pending.token);
  if(!offer){offer={targetRealm:s.life.realm+1,token:pending.token,offeredMonth:pending.month??s.life.month};s.life.breakthroughOffers.push(offer);}
  offer.choice=c.id;offer.chosenMonth=s.life.month;
 }
 s.pending=null;s.phase=s.active?'journey':'home';
 if(e.id==='V-004'&&c.id==='decline'&&s.active)s.active.breakDeclined=s.life.realm;
 const prefix=s.life.id+'/';
 const source=pending.token.startsWith(prefix)?pending.token:prefix+pending.token;
 for(const [type,value]of c.effects){applyEffect(s,type,value,source);if(s.life.ending)break;}
 if(s.life.ending)return;
 note(s,`${e.name}: ${c.label}`);
 if(e.id==='A-001'&&c.id==='medicine'&&!s.life.traitKnown){s.life.traitKnown=true;addUnique(s.meta.clues,s.life.trait);}
 naturalBoundary(s);
}
export function allowedTargets(s,action){
 const l=s.life;if(action==='ACT-09')return ['rival',...(l.world.occurred&&!l.world.resolved?['threat']:[]),...(l.origin==='S-01'&&l.realm>=3&&l.fame>=6&&l.trust>=3&&!l.success?['leader']:[])];
 if(action==='ACT-01')return ['inner','outer'];
 if(action==='ACT-05'&&hasQi(s))return ['default','breathing'];
 if(action==='ACT-07')return ['skill','assist'];return ['default'];
}
export function transition(input,command){
 validateState(input);requireThat(command&&typeof command.type==='string'&&command.id,'명령 ID가 필요합니다.');
 if(input.commands.includes(command.id))return input;
 const s=clone(input),l=s.life;
 if(command.type==='newLife'){
  requireThat(s.phase==='ended','생애 종료 뒤에만 재도전할 수 있습니다.');
  const next=newGame({...command.options,seed:(s.rng^((l.seq+1)*2654435761))>>>0},s);
  next.revision=s.revision+1;next.commands=[command.id];return next;
 }
 if(command.type==='startAction'||command.type==='acceptOffer'){
  requireThat(s.phase==='home'&&!s.active&&!l.ending,'현재 행동을 바꿀 수 없습니다.');
  const offer=command.type==='acceptOffer'?requireOffer(s,command.offerId):null;
  const def=s.content.actions.find(x=>x.id===(offer?'ACT-03':command.action));requireThat(def,'없는 행동');
  const target=command.target||allowedTargets(s,def.id)[0];requireThat(allowedTargets(s,def.id).includes(target),'행동 대상 자격이 없습니다.');
  const breathing=hasQi(s)&&def.id==='ACT-05'&&target==='breathing';
  if(breathing)requireThat(l.qi.current<maxQi(s),'내공이 이미 가득 찼습니다.');
  const months=breathing?s.content.qiRules.breathingMonths:def.months;
  const paid=def.id==='ACT-05'&&!breathing&&l.money>=ECONOMY.treatment;if(paid)l.money-=ECONOMY.treatment;
  l.lastActionId=def.id;
  s.active={id:def.id,key:`action-${++s.nextAction}`,target,duration:months,baseDuration:months,elapsed:0,xpCredited:0,masteryCredited:0,skill:hasQi(s)&&l.loadout.primary==='BASIC'?'SAMJAE':l.loadout.primary,randomChecked:false,breakDeclined:-1,paid};
  if(offer)acceptOffer(s,offer,s.active);
  if(target==='leader'){l.leader=true;note(s,'지지와 실력을 인정받고 우두머리 결전에 나섰다.');}
  s.result=null;s.phase='journey';note(s,`${breathing?'운기 회복':def.name}을 확정했다. 기간 ${months}개월, 중간에 교체할 수 없다.`);
 }else if(command.type==='advance')advance(s);
 else if(command.type==='choose')choose(s,command.choice);
 else if(command.type==='ack'){
  requireThat(s.phase==='result','확인할 결과가 없습니다.');
  if(command.destination)requireThat(['record','duel','rest','training','world'].includes(command.destination),'다음 화면 오류');
  if(command.guideRead)manageGuidance(s,{read:command.guideRead});
  s.phase='home';showQueue(s);
 }else if(command.type==='guidance'){
  manageGuidance(s,command);
 }else if(command.type==='offerDecision'){
  decideOffer(s,command.offerId,command.decision);
 }else if(['equipWeapon','repairWeapon','useHerb'].includes(command.type)){
  note(s,manageInventory(s,command));
 }else if(command.type==='useMedicine'){
  note(s,useMedicine(s,command));
 }else if(command.type==='loadout'){
  requireThat(s.phase==='home','행동 중에는 구성을 바꿀 수 없습니다.');
  requireThat(l.skills[command.primary]!==undefined||hasQi(s)&&command.primary==='BASIC','배우지 않은 주력');
  const aux=command.aux||[];requireThat(aux.every(x=>l.skills[x]!==undefined&&x!==command.primary)&&new Set(aux).size===aux.length,'잘못된 보조');
  l.loadout={primary:command.primary,aux};
 }else if(command.type==='retire'){
  requireThat(s.phase==='home'&&l.origin==='P-01'&&l.realm>=2&&l.world.resolved&&!l.debt.length,'금분세수 자격이 없습니다.');
  recordSuccess(s,'retirement');s.result={title:'금분세수',text:'위협과 은원을 정리하고 성공을 기록했습니다. 생애는 계속할 수 있습니다.'};s.phase='result';naturalBoundary(s);
 }else if(command.type==='finish'){
  requireThat(s.phase==='home'&&l.success,'성공 기록 뒤 행동을 마친 상태에서 마무리할 수 있습니다.');finishLife(s,'retired');
 }else if(command.type==='rejuvenate'){
  requireThat((s.phase==='grace'||s.phase==='home'||s.phase==='result')&&!l.ending&&!l.rejuvenated&&l.breakthroughs.length>=2,'반로환동 자격이 없습니다.');
  requireThat(command.method==='simulation'||command.method==='money','체험 방법 오류');
  if(command.method==='money'){requireThat(l.money>=ECONOMY.rejuvenation,'재화가 부족합니다.');l.money-=ECONOMY.rejuvenation;}
  l.rejuvenated=true;l.limit+=REJUVENATION_MONTHS;
  delete s.naturalRecapCandidate;
  if(s.phase==='grace')s.phase=s.resumePhase||'journey';delete s.resumePhase;
  const method=command.method==='money'?`재화 ${ECONOMY.rejuvenation} 사용`:'무료 체험으로 사용';
  note(s,`반로환동: 수명 10년 연장, 육체 약화. ${method}. 같은 생애에서 한 번만 사용할 수 있다.`);
 }else if(command.type==='declineGrace'){
  requireThat(s.phase==='grace','자연 만료 선택이 아닙니다.');finishLife(s,'natural');
 }else throw Error('허용되지 않은 명령');
 s.revision++;s.commands.push(command.id);
 recordChanges(input,s,command);
 recordEnding(input,s);
 validateState(s);return s;
}
export function publicView(s){
 const l=s.life;
 const view={revision:s.revision,phase:s.phase,name:l.name,origin:l.origin,mentor:s.content.mentors.find(x=>x.id===l.mentor),age:16+Math.floor(l.month/12),season:['봄','여름','가을','겨울'][Math.floor(l.month%12/3)],worldYear:Math.floor(l.month/12)+1,realm:REALMS[l.realm],realmIndex:l.realm,xp:Math.floor(l.xp/1000),money:l.money,fame:l.fame,trust:l.trust,npc:l.npc,body:l.injury===2?'심한 부상':l.injury===1?'가벼운 상처':'안정',warning:l.injury===2?'몸을 돌보며 도전에 신중할 때입니다.':(16+Math.floor(l.month/12))>=50?'몸이 예전 같지 않습니다. 긴 수련은 부담이 됩니다.':'강호의 일에는 늘 변수가 따릅니다.',trait:l.traitKnown?l.trait:'아직 알아차리지 못한 체질',rejuvenated:l.rejuvenated,canRejuvenate:!l.ending&&!l.rejuvenated&&l.breakthroughs.length>=2,canRetire:l.origin==='P-01'&&l.realm>=2&&l.world.resolved&&!l.debt.length,success:l.success,ending:l.ending,skills:Object.entries(l.skills).map(([id,value])=>({...s.content.skills.find(x=>x.id===id),mastery:Math.floor(value/1000)})),loadout:clone(l.loadout),assists:l.assists.map(x=>ASSISTS[x]),actions:s.content.actions.map(x=>({...x,targets:allowedTargets(s,x.id),risk:risk(s,x.id==='ACT-09'?'rival':'novice')})),active:s.active?{id:s.active.id,name:s.content.actions.find(x=>x.id===s.active.id).name,elapsed:s.active.elapsed,duration:s.active.duration}:null,pending:s.pending?{...s.content.events.find(x=>x.id===s.pending.id),choices:s.content.events.find(x=>x.id===s.pending.id).choices.map(x=>({id:x.id,label:x.label,allowed:canChoose(l,x),reason:x.requires==='mediation'?'명성4 · 인연3 필요':x.requires?`${ASSISTS[x.requires]} 필요`:''}))}:null,result:clone(s.result),log:clone(l.log),debt:clone(l.debt),threat:{occurred:l.world.occurred,resolved:l.world.resolved},quest:l.quest,unlocks:clone(s.meta.unlocks),clues:clone(s.meta.clues),history:clone(s.meta.history),regression:l.regression};
 // Internal boundary facts never enter the display model, including historical records.
 view.history=s.meta.history.map(({recap,story,...record})=>({...record,...(story?{story:savedStoryView(story,s.content.story)}:{}),...(record.cause==='natural'&&recap?.schemaVersion===1&&recap.quoteKey===RECAP_QUOTE_KEY?{recapQuote:RECAP_QUOTE}:{})}));
 view.recapQuote=s.phase==='ended'?view.history.find(x=>x.id===l.id)?.recapQuote||null:null;
 view.ageMonths=l.month%12;
 view.changes=clone(l.changes??[]);
 view.battleRisks=Object.fromEntries(['novice',...allowedTargets(s,'ACT-09')].map(target=>[target,risk(s,target)]));
 view.origins=clone(s.content.origins||[{id:'P-01',name:'정파 문중'},{id:'S-01',name:'사파 방파'}]);
 view.originName=view.origins.find(x=>x.id===l.origin)?.name||l.origin;
 view.inventory=inventoryView(s);
 view.qi=qiView(s);
 view.guidance=guidanceView(s);
 view.story=storyView(s);
 if(view.qi){
  for(const skill of view.skills){skill.cost=skillCost(s,skill.id);skill.affordable=skill.cost<=view.qi.current;}
  view.skills.unshift({id:'BASIC',name:'기본 외공',style:'neutral',type:'attack',mastery:Math.floor(l.skills.SAMJAE/1000),cost:0,affordable:true,basic:true});
  view.inventory.medicines=view.qi.medicines;
  if(view.active){
   view.active.target=s.active.target;
   if(s.content.actions.find(a=>a.id===s.active.id).mastery&&s.active.target!=='assist')
    view.active.masterySubject=(s.active.skill==='SAMJAE'&&l.loadout.primary==='BASIC'?'기본 외공 · 삼재검법 기초':s.content.skills.find(k=>k.id===s.active.skill).name)+' 숙련';
  }
 }
 view.mentorAssist=ASSISTS[view.mentor.assist];
 view.knowsMentorSkill=l.skills[view.mentor.skill]!==undefined;
 view.knowsMentorAssist=l.assists.includes(view.mentor.assist);
 if(view.result?.itemGains)view.result.itemGains=view.result.itemGains.map(({name,quantity})=>({name,quantity}));
 if(view.pending){for(const c of view.pending.choices){const definition=s.content.events.find(e=>e.id===view.pending.id).choices.find(x=>x.id===c.id);const battle=definition.effects.find(x=>x[0]==='battle');if(battle)c.risk=risk(s,battle[1]);c.extraMonths=definition.effects.filter(([type])=>type==='extra').reduce((sum,[,months])=>sum+months,0);}}
 if(view.pending?.id==='W-E02'){const fight=view.pending.choices.find(c=>c.id==='fight');fight.label=l.origin==='P-01'?'토벌 원정에 참여한다':'공격에 맞서 방어한다';}
 return view;
}
