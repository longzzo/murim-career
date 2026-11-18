// REG-01 extends only a cloned 1.6 snapshot at explicit regression, or a new life.
export const REGRESSION_MEMORY={version:1,memories:[
 {id:'RM-01',name:'화물 검수 요령',eventId:'EC-01',rankId:'EC-R0',rankName:'신입 표사',earnedChoices:['inspect'],baseChoice:'inspect',choiceId:'memory-inspect',monthsSaved:1,label:'기억한 순서로 화물을 대조한다',reaction:'화물을 빠짐없이 대조해 인계했군. 검수 순서가 능숙했네.'},
 {id:'RM-02',name:'동행 보호 요령',eventId:'EC-02',rankId:'EC-R1',rankName:'표사',earnedChoices:['protect'],baseChoice:'protect',choiceId:'memory-protect',monthsSaved:2,label:'기억한 휴식 배치로 함께 호위한다',reaction:'휴식 배치 덕에 뒤처지지 않고 함께 도착했군. 도움을 기억하겠네.'},
 {id:'RM-03',name:'신입 인솔 요령',eventId:'EC-03',rankId:'EC-R2',rankName:'선임 표사',earnedChoices:['teach','support'],baseChoice:'teach',choiceId:'memory-teach',monthsSaved:1,label:'기억한 길 안내로 신입을 이끈다',reaction:'길을 차근차근 짚어 준 덕에 신입도 헤매지 않고 배웠습니다.'},
 {id:'RM-04',name:'우회 조율 요령',eventId:'EC-04',rankId:'EC-R3',rankName:'표두',earnedChoices:['detour'],baseChoice:'detour',choiceId:'memory-detour',monthsSaved:2,label:'기억한 조율법으로 우회 일정을 짠다',reaction:'미리 조율해 주신 덕에 우회 인계를 마쳤습니다. 약정한 추가 보수20도 정산했습니다.'}
]};
export function memoryDefinition(data,id){return data.regressionMemory?.memories.find(m=>m.id===id);}
export function memoryChoice(data,m){
 const base=data.events.find(e=>e.id===m.eventId).choices.find(c=>c.id===m.baseChoice);
 return {id:m.choiceId,label:m.label,requires:null,requiresMemory:m.id,effects:[],escort:{...structuredClone(base.escort),months:0,reaction:m.reaction,memory:{type:m.id,baselineChoiceId:m.baseChoice,extraMonthsSaved:m.monthsSaved}}};
}
export function withRegressionMemory(data){
 const next=structuredClone(data);next.version='web-v1.7';next.regressionMemory=structuredClone(REGRESSION_MEMORY);
 for(const m of next.regressionMemory.memories)next.events.find(e=>e.id===m.eventId).choices.push(memoryChoice(next,m));
 return next;
}
export function validateRegressionData(data){
 const fail=()=>{throw Error('호송 기억 콘텐츠 오류');};
 if(data.version!=='web-v1.7'){if(data.regressionMemory!==undefined||data.events.some(e=>e.choices.some(c=>c.requiresMemory!==undefined||c.escort?.memory!==undefined)))fail();return;}
 if(JSON.stringify(data.regressionMemory)!==JSON.stringify(REGRESSION_MEMORY))fail();
 for(const m of data.regressionMemory.memories){const e=data.events.find(e=>e.id===m.eventId),c=e?.choices.find(c=>c.id===m.choiceId);if(!c||JSON.stringify(c)!==JSON.stringify(memoryChoice(data,m)))fail();}
 const choices=data.events.flatMap(e=>e.choices);
 if(choices.filter(c=>c.requiresMemory!==undefined).length!==4||choices.filter(c=>c.escort?.memory!==undefined).length!==4)fail();
}
