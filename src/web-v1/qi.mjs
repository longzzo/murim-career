import {VERSION,REALMS} from './data.mjs';

export const hasQi=s=>s.versions.rules===VERSION.rules&&s.versions.qi===1;
export const MEDICINES=['CON-QI-RECOVER','CON-QI-CAPACITY'];
const requireQi=(value,message)=>{if(!value)throw Error(message);};
const integer=(value,min=0)=>Number.isSafeInteger(value)&&value>=min;
export const maxQi=s=>capacity(s.life.foundation,s.content.qiRules,s.life.qi.bonus);
export const maxHp=s=>health(s.life.foundation,s.content.qiRules);
const capacity=(foundation,rules,bonus=0)=>Math.floor(rules.baseQi+foundation.inner/1000*rules.innerRate+bonus+1e-9);
const health=(foundation,rules)=>{const outer=foundation.outer/1000;return Math.floor(rules.baseHp+outer*rules.outerLinear+outer*outer*rules.outerQuadratic+1e-9);};
export function startQi(s){
 s.life.qi={version:1,current:0,bonus:0,medicines:Object.fromEntries(MEDICINES.map(id=>[id,0])),grants:[],uses:[],battles:[]};
 s.life.qi.current=maxQi(s);
}
export function validateQi(s){
 const q=s.life.qi,r=s.content.qiRules;
 requireQi(s.versions.qi===1&&q?.version===1&&r?.version===1,'내공 규칙 버전 오류');
 requireQi(integer(r.baseQi,1)&&integer(r.baseHp,1)&&integer(r.breathingMonths,1)&&
  [r.innerRate,r.outerLinear,r.outerQuadratic].every(n=>Number.isFinite(n)&&n>=0)&&r.basicScale>0&&r.basicScale<=1&&
  Array.isArray(r.riskThresholds)&&r.riskThresholds.length===3&&r.riskThresholds.every((n,i)=>Number.isFinite(n)&&n>0&&(!i||n>r.riskThresholds[i-1]))&&
  s.content.skills.every(k=>integer(k.cost,1))&&Object.values(s.content.enemies).every(e=>integer(e.cost,1)&&integer(e.foundation?.inner)&&integer(e.foundation?.outer)),
  '내공 콘텐츠 수치 오류');
 requireQi(integer(s.life.foundation?.inner)&&integer(s.life.foundation?.outer)&&integer(q.bonus)&&
  integer(q.current)&&integer(maxQi(s),1)&&integer(maxHp(s),1)&&q.current<=maxQi(s),'내공·외공 자원 오류');
 requireQi(Array.isArray(q.grants)&&Array.isArray(q.uses)&&Array.isArray(q.battles),'내공 기록 구조 오류');
 for(const id of MEDICINES){
  const def=s.content.items[id];
  requireQi(def?.type==='qiMedicine'&&integer(def.amount,1)&&integer(q.medicines?.[id]),'내공 약 정의/수량 오류');
  const grants=q.grants.filter(g=>g.itemId===id),uses=q.uses.filter(u=>u.itemId===id);
  requireQi(grants.length<=1&&grants.length-uses.length===q.medicines[id],'내공 약 소유 기록 오류');
 }
 requireQi(q.bonus===q.uses.filter(u=>u.itemId==='CON-QI-CAPACITY').reduce((n,u)=>n+u.amount,0),'내공 증진 기록 오류');
 requireQi(new Set(q.grants.map(g=>g.source)).size===q.grants.length&&q.grants.every(g=>MEDICINES.includes(g.itemId)&&
  typeof g.source==='string'&&g.source.startsWith(s.life.id+'/')),'내공 약 지급 원천 오류');
 requireQi(q.uses.every(u=>MEDICINES.includes(u.itemId)&&typeof u.commandId==='string'&&integer(u.currentBefore)&&
  integer(u.currentAfter)&&integer(u.maxBefore,1)&&integer(u.maxAfter,1)&&u.currentAfter<=u.maxAfter&&
  u.amount===s.content.items[u.itemId].amount&&
  (u.itemId==='CON-QI-RECOVER'?u.currentAfter===Math.min(u.maxBefore,u.currentBefore+u.amount)&&u.maxBefore===u.maxAfter:
   u.currentAfter===u.currentBefore&&u.maxAfter===u.maxBefore+u.amount)),'내공 약 사용 기록 오류');
 requireQi(new Set(q.uses.map(u=>u.commandId)).size===q.uses.length,'내공 약 중복 사용');
 requireQi(new Set(q.battles.map(b=>b.id)).size===q.battles.length&&q.battles.every(validBattle),'합별 자원 기록 오류');
 if(q.last)requireQi(q.uses.length&&Object.entries(q.uses.at(-1)).every(([key,value])=>q.last[key]===value),'마지막 약 사용 기록 오류');
}
function validBattle(b){
 if(b.resources?.version!==1||!Array.isArray(b.turns)||!b.turns.length)return false;
 const p=b.resources.player,e=b.resources.opponent;
 if(![p,e].every(a=>a&&integer(a.maxHp,1)&&integer(a.maxQi,1)&&integer(a.startHp,1)&&a.startHp<=a.maxHp&&
  integer(a.startQi)&&a.startQi<=a.maxQi&&integer(a.endQi)&&a.endQi<=a.startQi))return false;
 let values={hp:p.startHp,enemyHp:e.startHp,qi:p.startQi,enemyQi:e.startQi};
 for(const [index,t]of b.turns.entries()){
  if(t.round!==index+1||!['player','opponent'].includes(t.first)||!t.before||
   !Object.entries(values).every(([key,value])=>t.before[key]===value)||values.hp===0||values.enemyHp===0)return false;
  for(const side of [t.first,t.first==='player'?'opponent':'player']){
   const hp=side==='player'?'hp':'enemyHp',target=side==='player'?'enemyHp':'hp',qi=side==='player'?'qi':'enemyQi',a=t[side];
   if(values[hp]===0){if(a!==null)return false;continue;}
   if(!a||typeof a.skillId!=='string'||typeof a.skill!=='string'||!integer(a.cost)||!integer(a.damage,1)||
    a.qiBefore!==values[qi]||a.qiAfter!==values[qi]-a.cost||!integer(a.qiAfter))return false;
   values={...values,[qi]:a.qiAfter,[target]:Math.max(0,values[target]-a.damage)};
  }
  if(!Object.entries(values).every(([key,value])=>t[key]===value))return false;
 }
 return values.qi===p.endQi&&values.enemyQi===e.endQi;
}
export function grantMedicine(s,id,source){
 const q=s.life.qi;
 requireQi(MEDICINES.includes(id),'내공 약 참조 오류');
 if(q.grants.some(g=>g.itemId===id||g.source===source))return null;
 const before=q.medicines[id];q.medicines[id]++;
 q.grants.push({itemId:id,source});
 return {kind:'gain',itemId:id,name:s.content.items[id].name,quantity:1,before,after:q.medicines[id],source};
}
export function medicineView(s,id){
 const q=s.life.qi,def=s.content.items[id],current=q.current,max=maxQi(s);
 const blocked=s.life.ending?'생애가 끝났습니다.':s.phase!=='home'||s.active||s.pending?'현재 상황을 마친 뒤 이용할 수 있습니다.':
  !q.medicines[id]?'보관한 약이 없습니다.':def.effect==='recover'&&current===max?'내공이 이미 가득 찼습니다.':'';
 const currentAfter=def.effect==='recover'?Math.min(max,current+def.amount):current,maxAfter=def.effect==='capacity'?max+def.amount:max;
 return {itemId:id,...def,quantity:q.medicines[id],blocked,current,max,currentAfter,maxAfter,
  recovered:currentAfter-current,overflow:def.effect==='recover'?Math.max(0,current+def.amount-max):0};
}
export function useMedicine(s,command){
 requireQi(hasQi(s)&&MEDICINES.includes(command.itemId),'사용할 내공 약을 확인해 주세요.');
 const view=medicineView(s,command.itemId);requireQi(!view.blocked,view.blocked);
 const q=s.life.qi;
 q.current=view.currentAfter;if(view.effect==='capacity')q.bonus+=view.amount;
 q.medicines[command.itemId]--;
 const record={commandId:command.id,itemId:command.itemId,amount:view.amount,currentBefore:view.current,currentAfter:view.currentAfter,
  maxBefore:view.max,maxAfter:view.maxAfter,month:s.life.month};
 q.uses.push(record);
 q.last={...record,name:view.name,quantity:q.medicines[command.itemId]};
 return `${view.name} 사용 · 현재 내공 ${view.current} → ${view.currentAfter} · 최대 내공 ${view.max} → ${view.maxAfter}`;
}
export function qiView(s){
 if(!hasQi(s))return null;
 return {current:s.life.qi.current,max:maxQi(s),maxHp:maxHp(s),weakened:s.life.rejuvenated,
  medicines:MEDICINES.map(id=>medicineView(s,id)),last:s.life.qi.last??null};
}
export function qiDistribution(s,current=s.life.qi.current){
 const l=s.life;
 const known=id=>id==='BASIC'||l.skills[id]!==undefined&&!l.disabled.includes(id)&&s.content.skills.find(k=>k.id===id)?.type==='attack';
 const eligible=id=>known(id)&&skillCost(s,id)<=current;
 const primary=eligible(l.loadout.primary)?l.loadout.primary:null;
 const aux=l.loadout.aux.filter(eligible);
 if(!primary&&!aux.length)return [{id:'BASIC',weight:1}];
 const main=primary?[1,.8,.7,.6][Math.min(aux.length,3)]:0;
 const total=aux.reduce((n,id)=>n+Math.max(1,l.skills[id]/1000),0);
 return [...(primary?[{id:primary,weight:main}]:[]),...aux.map(id=>({id,weight:(1-main)*Math.max(1,l.skills[id]/1000)/total}))];
}
export const skillCost=(s,id)=>id==='BASIC'?0:s.content.skills.find(k=>k.id===id)?.cost??Infinity;
function actors(s,enemy,weapon){
 const l=s.life,r=s.content.qiRules;
 if(enemy.hpOverride!==undefined)requireQi(s.content.version==='web-v1.5'&&enemy.id==='E-NOVICE'&&enemy.mode==='duel'&&integer(enemy.hpOverride,1),'초보 비무 생명력 정의 오류');
 const opponentHp=enemy.hpOverride??health(enemy.foundation,r);
 const player={name:l.name,realm:l.realm,hp:Math.floor(maxHp(s)*(l.injury===2?.8:1)),maxHp:maxHp(s),maxQi:maxQi(s),qi:l.qi.current,
  power:(8+l.realm*4+(weapon?.attack??0))*(l.injury===2?.8:1)*(l.rejuvenated?.85:1)};
 const opponent={name:enemy.name,realm:enemy.realm,hp:opponentHp,maxHp:opponentHp,
  maxQi:capacity(enemy.foundation,r),qi:capacity(enemy.foundation,r),power:8+enemy.realm*4};
 player.options=current=>{
  const distribution=qiDistribution(s,current),aux=distribution.filter(o=>o.id!==l.loadout.primary&&o.id!=='BASIC').length;
  return distribution.map(option=>{
   const basic=option.id==='BASIC',spec=basic?{name:'기본 외공',style:'neutral'}:s.content.skills.find(k=>k.id===option.id);
   const mastery=l.skills[basic?'SAMJAE':option.id]??0;
   const raw=player.power*(1+mastery/200000)*(basic?r.basicScale:[1,.98,.95,.92][Math.min(3,aux)]);
   const primary=l.loadout.primary,unavailable=skillCost(s,primary)>current;
   const reason=basic?(primary==='BASIC'?'기본 외공 주력':unavailable?'가능한 검법의 내공 부족 · 기본 외공 발동':'사용 가능한 검법 없음 · 기본 외공 발동'):
    unavailable?`주력 내공 부족 · 보조 ${spec.name} 발동`:'';
   return {...option,...spec,id:option.id,cost:skillCost(s,option.id),raw,reason};
  });
 };
 opponent.options=current=>{
  const basic=current<enemy.cost;
  return [{id:basic?'BASIC':enemy.id+'-ATTACK',name:basic?'기본 외공':enemy.style==='neutral'?'삼재검법':enemy.name+'의 검',
   style:basic?'neutral':enemy.style,cost:basic?0:enemy.cost,weight:1,
   raw:opponent.power*(1+enemy.mastery/200)*(basic?r.basicScale:1),reason:basic?'내공 부족 · 기본 외공 발동':''}];
 };
 return [player,opponent];
}
function choose(options,value){let total=0;for(const option of options){total+=option.weight;if(value<total)return option;}return options.at(-1);}
function affinity(a,b,gap){
 const ring=['쾌','중','강','환','유'];if(!ring.includes(a)||!ring.includes(b)||gap>=2)return 1;
 const ix=ring.indexOf(a),iy=ring.indexOf(b),amount=gap===0?.1:.05;
 return(ix+1)%5===iy?1+amount:(iy+1)%5===ix?1-amount:1;
}
export function fightQi(s,enemy,weapon,random){
 const sides=actors(s,enemy,weapon),hp=sides.map(a=>a.hp),reserve=sides.map(a=>a.qi),turns=[];
 const resources={version:1,player:{maxHp:sides[0].maxHp,startHp:hp[0],maxQi:sides[0].maxQi,startQi:reserve[0]},
  opponent:{maxHp:sides[1].maxHp,startHp:hp[1],maxQi:sides[1].maxQi,startQi:reserve[1]}};
 let outcome=null;
 for(let round=1;round<=sides[0].hp+sides[1].hp;round++){
  const before={hp:hp[0],enemyHp:hp[1],qi:reserve[0],enemyQi:reserve[1]};
  const first=random(s)<.5?0:1;
  const selected=sides.map((actor,i)=>({...choose(actor.options(reserve[i]),random(s)),damageRoll:random(s)}));
  const actual=[null,null];
  for(const side of [first,1-first]){
   if(hp[side]===0)continue;
   const a=selected[side],multiplier=affinity(a.style,selected[1-side].style,Math.abs(sides[0].realm-sides[1].realm));
   const damage=Math.max(1,Math.floor(a.raw*multiplier*(.9+.2*a.damageRoll)));
   const qiBefore=reserve[side];reserve[side]-=a.cost;
   requireQi(reserve[side]>=0,'내공이 음수가 될 수 없습니다.');
   actual[side]={skillId:a.id,skill:a.name,style:a.style,cost:a.cost,qiBefore,qiAfter:reserve[side],damage,affinity:multiplier,reason:a.reason};
   hp[1-side]=Math.max(0,hp[1-side]-damage);
  }
  const [player,opponent]=actual;
  turns.push({round,first:first===0?'player':'opponent',before,player,opponent,
   hp:hp[0],enemyHp:hp[1],qi:reserve[0],enemyQi:reserve[1],skill:player?.skill??'공격 전에 쓰러짐',
   skillId:player?.skillId??null,style:player?.style??'neutral',damage:player?.damage??0,received:opponent?.damage??0});
  if(hp.some(n=>n===0)){outcome=hp[0]===0?'loss':'win';break;}
  if(enemy.mode==='encounter'&&hp[0]/sides[0].maxHp<.35&&round>=3&&random(s)<.35){outcome='escape';break;}
 }
 requireQi(outcome,'전투가 종료되지 않았습니다.');
 s.life.qi.current=reserve[0];
 resources.player.endQi=reserve[0];resources.opponent.endQi=reserve[1];
 return {outcome,turns,resources};
}
function expectedDamage(raw){
 const lo=raw*.9,hi=raw*1.1;let total=0;
 for(let n=Math.floor(lo);n<=Math.floor(hi);n++)total+=Math.max(1,n)*Math.max(0,Math.min(hi,n+1)-Math.max(lo,n));
 return total/(hi-lo);
}
function expectedRounds(actor,target){
 let states=new Map([[actor.qi,1]]),damageDone=0;
 for(let round=1;;round++){
  const next=new Map();let damage=0,spending=false;
  for(const [qi,mass]of states)for(const a of actor.options(qi)){
   const chance=mass*a.weight;damage+=chance*expectedDamage(a.raw);
   const remaining=qi-a.cost;next.set(remaining,(next.get(remaining)??0)+chance);spending||=a.cost>0;
  }
  if(!spending||damageDone+damage>=target.hp)return round-1+(target.hp-damageDone)/damage;
  damageDone+=damage;states=next;
 }
}
export function qiRisk(s,enemy,weapon){
 const [player,opponent]=actors(s,enemy,weapon);
 const ratio=expectedRounds(opponent,player)/expectedRounds(player,opponent);
 const [close,favored,dominant]=s.content.qiRules.riskThresholds;
 const unavailable=skillCost(s,s.life.loadout.primary)>player.qi;
 return {level:ratio<close?'위험':ratio<favored?'접전':ratio<dominant?'유리':'우세',enemy:enemy.name,mode:enemy.mode,
  reason:`현재 내공 ${player.qi}/${player.maxQi} · 시작 생명력 ${player.hp}/${player.maxHp}${unavailable?' · 주력 내공 부족':''}${s.life.injury===2?' · 심한 부상':''}${s.life.rejuvenated?' · 연장 후 약화':''}`,
  comparison:'묘리를 중립으로 둔 참고 비교 · 승률을 뜻하지 않습니다.',enemyHp:opponent.maxHp,enemyQi:opponent.maxQi,
  realm:REALMS[enemy.realm]};
}
