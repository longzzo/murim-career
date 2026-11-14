import {DATA,ECONOMY} from './data.mjs';
export const hasStory=s=>s.versions.story===1;
const requireStory=(value,message)=>{if(!value)throw Error(message);};
const first='OFFER-GRAIN-01',second='OFFER-GRAIN-02';
const source=(s,a)=>s.life.id+'/'+a.key;
export function startStory(s){if(hasStory(s))s.life.story={version:1,lifeId:s.life.id,offers:[],history:[]};}
function history(s,offer,state,action=null){s.life.story.history.push({offerId:offer.id,npcId:offer.npcId,state,month:s.life.month,action});}
function open(s,id,completion){
 const story=s.life.story;if(story.offers.some(o=>o.id===id))return null;
 const offer={id,npcId:s.content.story.npc.id,lifeId:s.life.id,status:'offered',sourceCompletion:completion,
  acceptedAction:null,followupCreated:false,offeredMonth:s.life.month};
 story.offers.push(offer);history(s,offer,'offered',completion);return offer;
}
export function requireOffer(s,id){
 requireStory(hasStory(s)&&s.phase==='home'&&!s.active&&!s.pending&&!s.life.ending,'현재 상황을 마친 뒤 부탁을 선택할 수 있습니다.');
 const offer=s.life.story.offers.find(o=>o.id===id);requireStory(offer?.status==='offered','현재 맡을 수 있는 부탁이 아닙니다.');return offer;
}
export function acceptOffer(s,offer,action){
 offer.status='accepted';offer.acceptedAction=source(s,action);offer.acceptedMonth=s.life.month;
 history(s,offer,'accepted',offer.acceptedAction);
}
export function decideOffer(s,id,decision){
 const offer=requireOffer(s,id);requireStory(['defer','decline'].includes(decision),'제안 선택 오류');
 if(decision==='decline')offer.status='declined';
 history(s,offer,decision==='defer'?'deferred':'declined');
}
export function storyCompletion(s,action){
 if(!hasStory(s))return;
 const completion=source(s,action),story=s.life.story;
 if(action.id==='ACT-04'){
  const offer=open(s,first,completion);if(offer)s.result.story={offered:offer.id};
 }else if(action.id==='ACT-03'){
  const offer=story.offers.find(o=>o.status==='accepted'&&o.acceptedAction===completion);
  if(!offer)return;
  offer.status='completed';offer.completedMonth=s.life.month;history(s,offer,'completed',completion);
  s.result.story={completed:offer.id};
  if(offer.id===first&&!offer.followupCreated){
   const next=open(s,second,completion);offer.followupCreated=true;if(next)s.result.story.offered=next.id;
  }
 }
}
export function closeStory(s){
 if(!hasStory(s))return;
 for(const offer of s.life.story.offers)if(['offered','accepted'].includes(offer.status)){
  offer.status='interrupted';history(s,offer,'interrupted',offer.acceptedAction);
 }
}
export function validateStory(s){
 const st=s.life.story,definition=s.content.story;
 if(!hasStory(s)){requireStory(s.versions.story===undefined&&st===undefined&&definition===undefined,'기존 생애의 제안 상태 오류');return;}
 requireStory(s.versions.qi===1&&st?.version===1&&st.lifeId===s.life.id&&definition?.version===1&&
  definition.npc?.id==='NPC-GRAIN-CONTACT'&&Array.isArray(definition.offers)&&definition.offers.length===2&&
  [first,second].every(id=>definition.offers.some(o=>o.id===id&&[o.title,o.quote,o.completion].every(t=>typeof t==='string'&&t.length)))&&
  Array.isArray(st.offers)&&st.offers.length<=2&&new Set(st.offers.map(o=>o.id)).size===st.offers.length&&Array.isArray(st.history),'이야기 구조 오류');
 const validSource=value=>typeof value==='string'&&value.startsWith(s.life.id+'/action-');
 for(const offer of st.offers){
  requireStory([first,second].includes(offer.id)&&offer.lifeId===s.life.id&&offer.npcId===definition.npc.id&&validSource(offer.sourceCompletion)&&
   ['offered','accepted','completed','declined','interrupted'].includes(offer.status)&&typeof offer.followupCreated==='boolean','부탁 기록 오류');
  if(['accepted','completed'].includes(offer.status))requireStory(validSource(offer.acceptedAction),'연결 의뢰 오류');
  if(offer.status==='accepted')requireStory(!s.life.ending&&s.active?.id==='ACT-03'&&source(s,s.active)===offer.acceptedAction,'진행 중인 약속 오류');
  if(s.life.ending)requireStory(!['offered','accepted'].includes(offer.status),'종료된 생애의 약속 오류');
  if(offer.id===second){const previous=st.offers.find(o=>o.id===first);requireStory(previous?.status==='completed'&&previous.followupCreated&&previous.acceptedAction===offer.sourceCompletion,'후속 개방 근거 오류');}
 }
 requireStory(st.history.every(h=>st.offers.some(o=>o.id===h.offerId)&&h.npcId===definition.npc.id&&
  ['offered','accepted','completed','declined','deferred','interrupted'].includes(h.state)&&Number.isInteger(h.month)&&h.month>=0&&h.month<=s.life.month),'약속 이력 오류');
}
export function storyView(s){
 if(!hasStory(s))return null;
 const definition=s.content.story,st=s.life.story;
 const offers=st.offers.map(o=>({...definition.offers.find(d=>d.id===o.id),status:o.status,
  ...(o.status==='accepted'?{elapsed:s.active.elapsed,duration:s.active.duration}:{}),
  blocked:s.phase==='home'&&!s.active&&!s.pending&&!s.life.ending?'':'현재 상황을 마친 뒤 선택할 수 있습니다.'}));
 return {npc:definition.npc.name,offers,offered:offers.some(o=>o.status==='offered'),
  months:s.content.actions.find(a=>a.id==='ACT-03').months,reward:ECONOMY.commission,
  history:savedStoryView(st,definition).history};
}
export function savedStoryView(story,definition=DATA.story){
 if(story?.version!==1||!Array.isArray(story.history))return null;
 const history=story.history.flatMap(h=>{
  const offer=definition.offers.find(o=>o.id===h.offerId);
  if(!offer||h.npcId!==definition.npc.id)return [];
  return [{title:offer.title,state:h.state,month:h.month,
   action:h.state==='offered'&&h.offerId===first?'상단 호송 완료':h.action?'연결 지역 의뢰':''}];
 });
 return {npc:definition.npc.name,history};
}
