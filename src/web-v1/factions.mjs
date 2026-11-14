// Versioned catalog and read-only selection rules. No save writes or random draws.
export const FAMILIAR_ORIGINS = [
 {id:'P-HUASHAN',name:'화산파',route:'orthodox',unlock:null,desc:'빠른 검 또는 정공을 배우는 정파 문파입니다.',symbol:'梅',location:'섬서 · 서부',motif:'plum'},
 {id:'S-HAOMEN',name:'하오문',route:'unorthodox',unlock:null,desc:'생활 속 인연과 실전 대응을 중시합니다. 이번 생애는 사파 성공 경로를 따릅니다.',symbol:'燈',location:'강호 각지 · 연락망',motif:'lantern'},
 {id:'P-DIANCANG',name:'점창파',route:'orthodox',unlock:'F-NORMAL',desc:'강한 직선 공격과 기동을 배우는 정파 문파입니다.',symbol:'日',location:'대리 · 서남부',motif:'sun'},
 {id:'P-SHAOLIN',name:'소림사',route:'orthodox',unlock:'F-POPULAR',desc:'강한 검과 몸을 단련합니다. 이번 배움은 검술 전수입니다.',symbol:'寺',location:'숭산 · 중부',motif:'temple'},
 {id:'P-WUDANG',name:'무당파',route:'orthodox',unlock:'F-POPULAR',desc:'흐름을 바꾸는 검과 구호를 배우는 정파 문파입니다.',symbol:'☯',location:'무당산 · 중남부',motif:'taiji'}
];
export const FAMILIAR_MENTORS = [
 {id:'HS-M01',origin:'P-HUASHAN',name:'매화검의 사부',desc:'빠른 검과 기동',skill:'HS-PLUM',assist:'light'},
 {id:'HS-M02',origin:'P-HUASHAN',name:'양오검의 사부',desc:'정공과 구호',skill:'HS-UPRIGHT',assist:'medicine'},
 {id:'HM-M01',origin:'S-HAOMEN',name:'실전검의 사부',desc:'무거운 검과 몸의 단련',skill:'S-S01',assist:'body'},
 {id:'HM-M02',origin:'S-HAOMEN',name:'변화검의 사부',desc:'변화의 검과 기동',skill:'S-S02',assist:'light'},
 {id:'DC-M01',origin:'P-DIANCANG',name:'사일검의 사부',desc:'직선 공격과 기동',skill:'DC-SUN',assist:'light'},
 {id:'SL-M01',origin:'P-SHAOLIN',name:'달마검의 사부',desc:'강한 검과 몸의 단련',skill:'SL-DHARMA',assist:'body'},
 {id:'WD-M01',origin:'P-WUDANG',name:'태극검의 사부',desc:'흐름 전환과 구호',skill:'WD-TAIJI',assist:'medicine'}
];
export const FAMILIAR_SKILLS = [
 {id:'HS-PLUM',name:'매화검법',style:'쾌',type:'attack',cost:7},
 {id:'HS-UPRIGHT',name:'양오검법',style:'중',type:'attack',cost:7},
 {id:'DC-SUN',name:'사일검법',style:'강',type:'attack',cost:7},
 {id:'SL-DHARMA',name:'달마검법',style:'강',type:'attack',cost:7},
 {id:'WD-TAIJI',name:'태극검법',style:'유',type:'attack',cost:7}
];
const legacyRoutes={'P-01':'orthodox','S-01':'unorthodox'};
export function originRoute(content,id){return content.origins?.find(o=>o.id===id)?.route??legacyRoutes[id]??null;}
export function canEnterOrigin(content,id,unlocks=[]){
 const origin=content.origins?.find(o=>o.id===id);
 return !!origin&&(!origin.unlock||unlocks.includes(origin.unlock));
}
export function schoolChoices(content,unlocks=[]){
 return content.origins.map(origin=>({...origin,available:canEnterOrigin(content,origin.id,unlocks),
  requirement:origin.unlock==='F-NORMAL'?'실제 접전 결과로 해금':origin.unlock==='F-POPULAR'?'명문 해금 의뢰 2단계 완료':'처음부터 입문 가능',
  teachings:content.mentors.filter(m=>m.origin===origin.id).map(m=>({...m,skill:content.skills.find(s=>s.id===m.skill)}))}));
}
export function validateFamiliarCatalog(d){
 const fail=()=>{throw Error('문파 정의/해금 참조 오류');};
 if(d.factions!==1||!Array.isArray(d.origins)||d.origins.length!==5||d.mentors.length!==7||d.skills.length!==9)fail();
 if(new Set(d.origins.map(o=>o.id)).size!==5)fail();
 for(const expected of FAMILIAR_ORIGINS){
  const o=d.origins.find(o=>o.id===expected.id);
  if(!o||o.route!==expected.route||o.unlock!==expected.unlock||!['name','desc','symbol','location','motif'].every(k=>typeof o[k]==='string'&&o[k].trim()))fail();
 }
 for(const expected of FAMILIAR_MENTORS){
  const m=d.mentors.find(m=>m.id===expected.id);
  if(!m||m.origin!==expected.origin||m.skill!==expected.skill||m.assist!==expected.assist||!m.name?.trim())fail();
 }
 for(const expected of FAMILIAR_SKILLS){
  const s=d.skills.find(s=>s.id===expected.id);
  if(!s||s.style!==expected.style||s.type!=='attack'||s.cost!==7||!s.name?.trim())fail();
 }
}
