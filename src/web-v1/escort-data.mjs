// ESCORT-01 v1. New-life content; never retrofitted into an existing snapshot.
export const ESCORT_CAREER={version:1,baseMonths:12,choiceMonth:6,requiredCompletions:2,
 npcs:[{id:'NPC-ESCORT-STEWARD',name:'표국 총관'},{id:'NPC-ESCORT-PARTNER',name:'동행 표사'},{id:'NPC-GRAIN-CONTACT',name:'상단 연락책'}],
 ranks:[
  {id:'EC-R0',name:'신입 표사',missionId:'EC-M0',mission:'동행 호송 · 화물과 인계 확인',reward:50,eventId:'EC-01',milestone:'inspection',responsibility:'검수 책임',speaker:'NPC-ESCORT-STEWARD',brief:'화물과 인계를 빠짐없이 확인하게.'},
  {id:'EC-R1',name:'표사',missionId:'EC-M1',mission:'독립 호송 · 동료와 인계 책임',reward:70,eventId:'EC-02',milestone:'protection',responsibility:'동료 보호',speaker:'NPC-GRAIN-CONTACT',brief:'이번 인계는 표사님께 맡기겠습니다. 동료와 함께 끝까지 부탁드립니다.'},
  {id:'EC-R2',name:'선임 표사',missionId:'EC-M2',mission:'신입 인솔 · 교육과 지원 배분',reward:90,eventId:'EC-03',milestone:'mentoring',responsibility:'신입 인솔',speaker:'NPC-ESCORT-PARTNER',brief:'이번에는 선임께서 신입들에게 길을 알려 주십시오.'},
  {id:'EC-R3',name:'표두',missionId:'EC-M3',mission:'주요 호송 총괄 · 인원/노선 결정',reward:120,eventId:'EC-04',milestone:null,responsibility:null,speaker:'NPC-ESCORT-STEWARD',brief:'표두님, 주요 호송의 인원과 노선은 맡기겠습니다.'}
 ]};
const choice=(id,label,months,rewardDelta,milestone,npcGain,fameGain,speaker,reaction)=>({id,label,requires:null,effects:months?[['extra',months]]:[],escort:{months,rewardDelta,milestone,npcGain,fameGain,speaker,reaction}});
export const ESCORT_EVENTS=[
 {id:'EC-01',name:'봉인이 맞지 않는 화물',text:'인계표와 화물의 봉인이 다릅니다. 누가 검수를 맡을지 정해야 합니다.',special:'escortCareer',tags:['escort'],choices:[
  choice('inspect','직접 대조하고 인계한다',1,0,'inspection',0,0,'NPC-ESCORT-STEWARD','직접 화물을 대조해 인계했군. 검수 책임을 다한 기록을 남기겠네.'),
  choice('assist','선임에게 검수를 맡기고 상하차를 돕는다',0,10,null,0,0,'NPC-ESCORT-STEWARD','검수는 선임이 맡았고, 자네는 상하차를 도왔군. 도움의 보수 10을 더했네.')]},
 {id:'EC-02',name:'뒤처진 동행자',text:'동행자가 지쳐 뒤처졌습니다. 함께 갈 방법과 인계 일정을 정해야 합니다.',special:'escortCareer',tags:['escort'],choices:[
  choice('protect','함께 쉬고 끝까지 호위한다',2,0,'protection',1,0,'NPC-ESCORT-PARTNER','나를 기다려 끝까지 함께해 줬군. 이번 호송의 도움을 기억하겠네.'),
  choice('replace','대체 인력에게 인계해 일정을 지킨다',0,-10,null,0,0,'NPC-GRAIN-CONTACT','일정을 지켜 인계해 주셨군요. 대체 인력 비용 10은 보수에서 공제했습니다.')]},
 {id:'EC-03',name:'길이 낯선 신입',text:'신입이 위험 구간을 익히지 못했습니다. 직접 가르칠지 지원을 붙일지 정해야 합니다.',special:'escortCareer',tags:['escort'],choices:[
  choice('teach','직접 길을 짚어 가르친다',1,0,'mentoring',1,0,'NPC-ESCORT-PARTNER','선임이 직접 길을 짚어 준 덕에 신입도 무사히 배웠습니다.'),
  choice('support','숙련 표사를 붙여 함께 지도한다',0,-15,'mentoring',1,0,'NPC-ESCORT-PARTNER','숙련 표사를 붙여 신입을 지도했군요. 지원비 15를 정산하고 인솔 책임을 기록했습니다.')]},
 {id:'EC-04',name:'주요 호송의 배치',text:'주요 호송을 앞두고 인원과 노선을 조율해야 합니다. 표두의 판단을 기다립니다.',special:'escortCareer',tags:['escort'],choices:[
  choice('delegate','지원 인력을 배치한다',0,-20,null,1,1,'NPC-ESCORT-PARTNER','표두님이 지원 인력을 배치해 책임을 나눴습니다. 지원비 20을 공제한 정산입니다.'),
  choice('detour','직접 우회 노선을 조율한다',2,20,null,1,0,'NPC-GRAIN-CONTACT','표두님이 조율한 우회 일정대로 도착했습니다. 늘어난 일정의 보수 20을 더했습니다.')]}
];
export function validateEscortData(d){
 const fail=()=>{throw Error('표사 경력 콘텐츠 정의 오류');};
 if(!['web-v1.6','web-v1.7','web-v1.8','web-v1.9'].includes(d.version)){if(d.escortCareer!==undefined||d.events.some(e=>e.special==='escortCareer'||/^EC-/.test(e.id)))fail();return;}
 const c=d.escortCareer;if(!c||c.version!==1||c.baseMonths!==12||c.choiceMonth!==6||c.requiredCompletions!==2||!Array.isArray(c.ranks)||c.ranks.length!==4||!Array.isArray(c.npcs)||c.npcs.length!==3)fail();
 const text=v=>typeof v==='string'&&v.trim().length>0;
 for(const n of ESCORT_CAREER.npcs)if(!c.npcs.some(x=>x.id===n.id&&text(x.name)))fail();
 for(const [i,expected]of ESCORT_CAREER.ranks.entries()){
  const r=c.ranks[i];for(const key of ['id','missionId','reward','eventId','milestone','responsibility','speaker'])if(r?.[key]!==expected[key])fail();
  if(!['name','mission','brief'].every(k=>text(r[k])))fail();
  const e=d.events.find(e=>e.id===r.eventId),base=ESCORT_EVENTS[i];
  if(!e||e.special!=='escortCareer'||!text(e.name)||!text(e.text)||e.choices?.length!==(d.version==='web-v1.6'?2:3))fail();
  for(const b of base.choices){const a=e.choices.find(x=>x.id===b.id);if(!a||!text(a.label)||a.requires!==null||a.requiresMemory!==undefined||a.escort?.memory!==undefined||JSON.stringify(a.effects)!==JSON.stringify(b.effects)||!text(a.escort?.reaction))fail();for(const key of ['months','rewardDelta','milestone','npcGain','fameGain','speaker'])if(a.escort[key]!==b.escort[key])fail();}
 }
 if(d.events.filter(e=>e.special==='escortCareer').length!==4)fail();
}
