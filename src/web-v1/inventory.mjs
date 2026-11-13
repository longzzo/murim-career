import {VERSION} from './data.mjs';

const integer = (n,min,max=Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n)&&n>=min&&n<=max;
const requireItem = (condition,message) => {if(!condition)throw Error(message);};
export const hasInventory = state => state.versions.rules===VERSION.rules;
const herbId = 'CON-HERB';

export function startInventory(state) {
 const bag=state.life.inventory={weapons:[],equipped:null,herbs:0,grants:[],used:0,last:null,herbUse:null,battles:[]};
 bag.equipped=grantItem(state,'WPN-TRAIN',state.life.id+'/start').instanceId;
}

export function validateInventory(state) {
 const {items,itemRules}=state.content,bag=state.life.inventory;
 const herb=items?.[herbId];
 requireItem(state.versions.save===2&&state.versions.inventory===1&&bag&&
  herb?.type==='herb'&&integer(herb.months,1)&&integer(herb.uses,1)&&integer(bag.herbs,0)&&integer(bag.used,0,herb.uses)&&
  (bag.used>0)===state.life.herbApplied&&Array.isArray(bag.battles)&&Array.isArray(bag.weapons)&&Array.isArray(bag.grants),'소지품 버전 또는 구조 오류');
 requireItem(bag.used===0?bag.herbUse===null:bag.herbUse?.kind==='use'&&typeof bag.herbUse.commandId==='string'&&
  bag.herbUse.itemId===herbId&&integer(bag.herbUse.after,0)&&bag.herbUse.before===bag.herbUse.after+1&&
  bag.herbUse.months===herb.months,'영초 사용 기록 오류');
 requireItem(integer(itemRules?.wear,1)&&integer(itemRules?.repairStep,1)&&integer(itemRules?.repairPrice,1)&&
  itemRules.warningRatio>=0&&itemRules.warningRatio<=1,'장비 규칙 오류');
 for(const id of ['WPN-TRAIN','WPN-FORGED']){
  const def=items[id];
  requireItem(def?.type==='weapon'&&typeof def.name==='string'&&integer(def.attack,0)&&integer(def.maxDurability,1),'무기 정의 오류');
 }
 requireItem(typeof herb.name==='string'&&bag.weapons.some(w=>w?.id===bag.equipped)&&
  new Set(bag.weapons.map(w=>w?.id)).size===bag.weapons.length,'장착 또는 무기 인스턴스 오류');
 requireItem(new Set(bag.grants.map(g=>g?.source)).size===bag.grants.length&&
  bag.grants.every(g=>typeof g?.source==='string'&&g.source.startsWith(state.life.id+'/')&&items[g.itemId]&&
   (g.itemId===herbId?g.instanceId===undefined:bag.weapons.some(w=>w.id===g.instanceId&&w.itemId===g.itemId))),'아이템 지급 기록 오류');
 requireItem(bag.weapons.every(w=>typeof w?.id==='string'&&['WPN-TRAIN','WPN-FORGED'].includes(w.itemId)&&
  integer(w.durability,0,items[w.itemId].maxDurability)&&bag.grants.some(g=>g.instanceId===w.id))&&
  bag.grants.filter(g=>g.itemId==='WPN-TRAIN').length===1&&bag.grants.filter(g=>g.itemId==='WPN-FORGED').length<=1&&
  bag.grants.filter(g=>g.itemId===herbId).length===bag.herbs+bag.used,'소유 또는 내구 기록 오류');
 requireItem(bag.battles.every((entry,index)=>{
  const definition=items[entry?.itemId];
  return bag.weapons.some(w=>w.id===entry?.instanceId&&w.itemId===entry.itemId)&&
   entry.battleId===state.life.id+'/battle-'+(index+1)&&integer(entry.startDurability,0,definition.maxDurability)&&
   entry.endDurability===Math.max(0,entry.startDurability-itemRules.wear)&&
   entry.attack===(entry.startDurability>0?definition.attack:0);
 }),'전투 장비 기록 오류');
}

export function grantItem(state,itemId,source) {
 const bag=state.life.inventory;
 if(bag.grants.some(g=>g.source===source||(itemId!==herbId&&g.itemId===itemId)))return null;
 const def=state.content.items[itemId];
 const grant={itemId,source}, result={kind:'gain',itemId,name:def.name,quantity:1};
 if(itemId===herbId){
  result.before=bag.herbs;
  result.after=++bag.herbs;
 }else{
  grant.instanceId=state.life.id+'/'+itemId;
  bag.weapons.push({id:grant.instanceId,itemId,durability:def.maxDurability});
  result.before=0;
  result.after=1;
 }
 bag.grants.push(grant);
 return {...result,...grant};
}

const attack = (weapon,definition) => weapon.durability>0?definition.attack:0;
const repairCost = (weapon,definition,rules) =>
 rules.repairPrice*Math.ceil((definition.maxDurability-weapon.durability)/rules.repairStep);

export function equippedForBattle(state) {
 if(!hasInventory(state))return null;
 const bag=state.life.inventory,weapon=bag.weapons.find(w=>w.id===bag.equipped),def=state.content.items[weapon.itemId];
 return {instanceId:weapon.id,itemId:weapon.itemId,name:def.name,startDurability:weapon.durability,attack:attack(weapon,def)};
}

export function wearWeapon(state,weapon) {
 const {weapons,battles}=state.life.inventory;
 const owned=weapons.find(w=>w.id===weapon.instanceId);
 owned.durability=Math.max(0,weapon.startDurability-state.content.itemRules.wear);
 const record={...weapon,battleId:state.life.id+'/battle-'+(battles.length+1),endDurability:owned.durability};
 battles.push(record);
 return record;
}

function managementBlock(state) {
 if(state.life.ending)return '생애가 끝났습니다.';
 if(state.phase!=='home'||state.active||state.pending)return '현재 상황을 마친 뒤 이용할 수 있습니다.';
 return '';
}

function herbBlock(state) {
 const bag=state.life.inventory;
 return managementBlock(state)||(bag.used>=state.content.items[herbId].uses?'이 생애의 효험을 이미 사용했습니다.':
  bag.herbs===0?'보관한 영초가 없습니다.':'');
}

export function manageInventory(state,command) {
 requireItem(hasInventory(state),'장비·영약 보관은 다음 생애부터 이용할 수 있습니다.');
 const blocked=managementBlock(state);
 requireItem(!blocked,blocked);
 const life=state.life,bag=life.inventory,{items,itemRules}=state.content;
 const transaction={commandId:command.id};
 if(command.type==='useHerb'){
  requireItem(command.itemId===herbId,'사용할 영약을 확인해 주세요.');
  const reason=herbBlock(state);
  requireItem(!reason,reason);
  const def=items[herbId], before=bag.herbs;
  bag.herbs--;bag.used++;life.herbApplied=true;life.limit+=def.months;
  if(!state.meta.clues.includes('영초의 효험'))state.meta.clues.push('영초의 효험');
  bag.herbUse=bag.last={...transaction,kind:'use',itemId:herbId,name:def.name,before,after:bag.herbs,months:def.months};
  return `보관한 영초를 사용했습니다. 수명 ${def.months}개월 연장.`;
 }
 const weapon=bag.weapons.find(w=>w.id===command.instanceId);
 requireItem(weapon,'소유한 무기를 선택해 주세요.');
 const def=items[weapon.itemId];
 if(command.type==='equipWeapon'){
  requireItem(bag.equipped!==weapon.id,'이미 장착한 무기입니다.');
  const previous=bag.equipped;
  bag.equipped=weapon.id;
  bag.last={...transaction,kind:'equip',itemId:weapon.itemId,name:def.name,instanceId:weapon.id,previous};
  return def.name+'을(를) 장착했습니다.';
 }
 const cost=repairCost(weapon,def,itemRules);
 requireItem(cost>0,'이미 내구도가 가득 찼습니다.');
 requireItem(life.money>=cost,'수리할 재화가 부족합니다.');
 requireItem(command.cost===cost,'수리비가 바뀌었습니다. 다시 확인해 주세요.');
 const moneyBefore=life.money,durabilityBefore=weapon.durability;
 life.money-=cost;weapon.durability=def.maxDurability;
 bag.last={...transaction,kind:'repair',itemId:weapon.itemId,name:def.name,instanceId:weapon.id,cost,
  moneyBefore,moneyAfter:life.money,durabilityBefore,durabilityAfter:weapon.durability};
 return def.name+' 수리 완료';
}

export function inventoryView(state) {
 if(!hasInventory(state))return null;
 const bag=state.life.inventory,{items,itemRules}=state.content;
 const blocked=managementBlock(state);
 const weapons=bag.weapons.map(weapon=>{
  const def=items[weapon.itemId];
  return {...weapon,...def,equipped:weapon.id===bag.equipped,effective:attack(weapon,def),
   repairCost:repairCost(weapon,def,itemRules),needsRepair:weapon.durability/def.maxDurability<=itemRules.warningRatio};
 });
 const last=bag.last;
 return {weapons,blocked,herb:{itemId:herbId,...items[herbId],quantity:bag.herbs,used:bag.used,blocked:herbBlock(state)},
  last:last?{kind:last.kind,itemId:last.itemId,instanceId:last.instanceId,name:last.name,cost:last.cost,moneyAfter:last.moneyAfter,after:last.after,months:last.months}:null};
}
