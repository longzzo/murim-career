import {FAMILIAR_ORIGINS,FAMILIAR_MENTORS,FAMILIAR_SKILLS,validateFamiliarCatalog} from './factions.mjs';
export const LEGACY_VERSION = {save:1, content:'web-v1.1', rules:'web-v1.0', recap:1, presentation:'web-v1.1'};
export const INVENTORY_VERSION = {save:2, content:'web-v1.2', rules:'web-v1.1', inventory:1, recap:1, presentation:'web-v1.2'};
export const PLAY_VERSION = {save:2, content:'web-v1.3', rules:'web-v1.2', inventory:1, qi:1, guidance:1, story:1, recap:1, presentation:'web-v1.3'};
export const VERSION = {...PLAY_VERSION,content:'web-v1.5',presentation:'web-v1.5',factions:1};
export const ECONOMY = {commission:30, escort:50, treatment:20, rejuvenation:80};
export const REJUVENATION_MONTHS=120;
// INV-01 v1 test values from common plan 04. New lives snapshot these definitions.
export const ITEMS = {
 'WPN-TRAIN':{type:'weapon',name:'수련검',attack:1,maxDurability:100},
 'WPN-FORGED':{type:'weapon',name:'정련철검',attack:3,maxDurability:60},
 'CON-HERB':{type:'herb',name:'영초',months:12,uses:1}
};
export const ITEM_RULES = {wear:5,warningRatio:.2,repairStep:10,repairPrice:2};
export const ORIGINS = [{id:'P-01',name:'청운문'},{id:'S-01',name:'흑송방'}];
export const REALMS = ['삼류','이류','일류','절정','초절정'];
export const THRESHOLDS = [0,80,200,400,700];
export const MENTORS = [
 {id:'P-M01',origin:'P-01',name:'실천의 사부',desc:'책임을 지는 빠른 검',skill:'P-S01',assist:'light'},
 {id:'P-M02',origin:'P-01',name:'구호의 사부',desc:'다친 사람을 살피는 유연한 검',skill:'P-S02',assist:'medicine'},
 {id:'S-M01',origin:'S-01',name:'동료의 사부',desc:'동료를 지키는 무거운 검',skill:'S-S01',assist:'body'},
 {id:'S-M02',origin:'S-01',name:'관찰의 사부',desc:'약속을 기억하는 변화의 검',skill:'S-S02',assist:'light'}
];
export const SKILLS = [
 {id:'SAMJAE',name:'삼재검법',style:'neutral',type:'attack'},
 {id:'P-S01',name:'청풍쾌검',style:'쾌',type:'attack'},
 {id:'P-S02',name:'유운검법',style:'유',type:'attack'},
 {id:'S-S01',name:'진악중검',style:'중',type:'attack'},
 {id:'S-S02',name:'흑영환검',style:'환',type:'attack'},
 {id:'HERMIT',name:'은거 고수의 검',style:'강',type:'attack'}
];
export const ASSISTS = {light:'경공',medicine:'의술',body:'외공 단련',inner:'내공 기반'};
export const ACTIONS = [
 {id:'ACT-01',name:'기반 수련',desc:'내공 또는 외공의 기반을 쌓습니다.',months:24,xp:40,mastery:0,tags:['training']},
 {id:'ACT-02',name:'사부에게 배우기',desc:'후속 검법, 다음에는 기예를 배웁니다.',months:12,xp:0,mastery:0,tags:['learning']},
 {id:'ACT-03',name:'지역 의뢰',desc:'재화와 명성, 신뢰를 얻거나 은원을 수습합니다.',months:6,xp:0,mastery:0,tags:['travel']},
 {id:'ACT-04',name:'상단 호송',desc:'이동 중의 사건에 대응하고 완료 보수를 받습니다.',months:12,xp:0,mastery:0,tags:['travel','escort']},
 {id:'ACT-05',name:'휴식 · 치료',desc:'치료비 20. 부족하면 무료 휴식으로 기력을 가다듬습니다.',months:6,xp:0,mastery:0,tags:['rest']},
 {id:'ACT-06',name:'교류 비무',desc:'패배해도 생존하는 실전 수련입니다.',months:6,xp:15,mastery:0,tags:['spar']},
 {id:'ACT-07',name:'주력 숙련 · 기예',desc:'배운 검의 숙련을 높이거나 사부의 기예를 익힙니다.',months:24,xp:30,mastery:20,tags:['training']},
 {id:'ACT-08',name:'명문 해금 의뢰',desc:'단서 전달과 시험의 두 단계를 마칩니다.',months:12,xp:0,mastery:0,tags:['travel','quest']},
 {id:'ACT-09',name:'강적에게 도전',desc:'성장 비교, 미해결 위협 또는 우두머리 결전을 고릅니다.',months:6,xp:0,mastery:0,tags:['challenge']},
 {id:'ACT-10',name:'장기 폐관',desc:'중간 사건에도 처음의 수련을 이어갑니다.',months:60,xp:120,mastery:40,tags:['training']}
];
const c=(id,label,effects=[],requires=null)=>({id,label,effects,requires});
export const EVENTS = [
 {id:'A-001',name:'호위길의 부상당한 고수',text:'길가의 고수가 도움을 청합니다. 호송을 맡긴 약속도 남아 있습니다.',tags:['escort'],choices:[c('help','상단에 도움을 요청한다',[['npc',1],['extra',1]]),c('medicine','의술로 상처를 살핀다',[['npc',2],['heal',1]],'medicine'),c('light','경공으로 약초를 구한다',[['npc',1]],'light'),c('inner','내공으로 응급 처치한다',[['npc',1],['extra',1]],'inner')]},
 {id:'A-002',name:'벼랑 아래 감춰진 석실',text:'오래된 표식 아래에 석실이 보입니다. 위험을 감수한다고 비급이 보장되지는 않습니다.',tags:['travel'],choices:[c('mark','표식만 기록한다',[['clue','석실의 위치']]),c('explore','안전을 확보하고 조사한다',[['extra',2],['randomStudy',1]]),c('light','경공으로 내려가 살핀다',[['randomStudy',1]],'light')]},
 {id:'A-005',name:'산길 매복과 숨겨진 암수',text:'길목을 막은 무리가 모습을 드러냅니다. 원래 맡은 일은 계속됩니다.',tags:['travel'],choices:[c('guard','상단과 행인을 엄호한다',[['battle','ambush']]),c('front','정면으로 대응한다',[['battle','ambush'],['fame',1]]),c('terrain','지형을 이용해 대응한다',[['battle','ambushTerrain']]),c('light','경공으로 동선을 흩뜨린다',[['battle','ambushLight']],'light')]},
 {id:'A-007',name:'영초를 지키는 영물',text:'영물이 약초 곁을 지킵니다. 다투지 않고 돌아갈 수도 있습니다.',tags:['travel'],choices:[c('leave','흔적을 기억하고 물러난다',[['clue','영초의 자리']]),c('gather','거리를 두고 약초를 구한다',[['herb',1],['extra',1]]),c('light','경공으로 접근해 기회를 본다',[['herb',2]],'light')]},
 {id:'A-008',name:'지나가던 고수의 세 초식',text:'고수가 검을 거두며 세 초식을 보여주겠다고 합니다.',tags:['training','travel','spar'],choices:[c('spar','비무를 청한다',[['battle','master'],['insight',1]]),c('listen','초식의 원리를 듣는다',[['insight',1],['npc',1]]),c('decline','예를 갖춰 사양한다',[])]},
 {id:'A-011',name:'운기 중 흔들리는 기혈',text:'기혈이 어긋나는 기미가 보입니다. 수련을 바꾸는 대신 대응을 정합니다.',tags:['training'],choices:[c('steady','호흡을 가다듬는다',[['extra',1],['heal',1]]),c('help','사부에게 도움을 청한다',[['extra',1],['insight',1]]),c('medicine','배운 의술로 안정시킨다',[['heal',1]],'medicine')]},
 {id:'V-001',name:'은거 고수의 제자 제안',text:'길에서 인연을 쌓은 고수가 자신의 검을 전하겠다고 합니다. 주 스승은 바뀌지 않습니다.',tags:['travel'],npc:3,choices:[c('learn','개별 전수를 받는다',[['learn','HERMIT'],['extra',3]]),c('talk','가르침의 뜻을 묻는다',[['insight',1],['npc',1]]),c('decline','지금의 배움에 집중한다',[])]},
 {id:'V-004',name:'정체 끝에 찾아온 깨달음',text:'쌓아 온 기반과 경험이 하나의 원리로 이어집니다. 지금 한 걸음 나아갈까요?',special:'breakthrough',choices:[c('accept','깨달음을 정리한다',[['breakthrough',1]]),c('verify','스승에게 검증을 청한다',[['extra',1],['breakthrough',1]]),c('decline','원리를 더 살핀다',[])]},
 {id:'W-E02',name:'정파 토벌대의 원정',text:'정파 문중들이 위협에 맞설 사람을 모읍니다. 무림맹이 이미 존재한다고 단정하지 않습니다.',special:'world',choices:[c('fight','방어전에 나선다',[['battle','threat']]),c('mediate','인연을 모아 중재한다',[['resolveThreat',1]],'mediation'),c('protect','주민을 보호하며 뒤를 맡는다',[['debt','주민 보호'],['fame',1]]),c('defer','지금은 참여하지 않는다',[])]},
 {id:'W-M02',name:'새외오궁의 침공',text:'독립된 새외 세력 하나가 움직였습니다. 다섯 궁의 연합으로 단정할 수 없습니다.',special:'world',choices:[c('fight','방어전에 나선다',[['battle','threat']]),c('mediate','사절과 협상한다',[['resolveThreat',1]],'mediation'),c('protect','주민의 피난을 돕는다',[['debt','주민 보호'],['fame',1]]),c('defer','소식을 기록하고 물러난다',[])]}
];
export const ENEMIES = {
 novice:{id:'E-NOVICE',name:'교류 비무 상대',realm:0,mastery:20,style:'neutral',mode:'duel',faction:'F-NORMAL'},
 rival:{id:'E-RIVAL',name:'고정 강적',realm:1,mastery:30,style:'강',mode:'duel',faction:'F-NORMAL'},
 master:{id:'E-MASTER',name:'세 초식의 고수',realm:2,mastery:40,style:'유',mode:'duel',faction:'F-NORMAL'},
 ambush:{id:'E-AMBUSH',name:'산길 매복자',realm:1,mastery:20,style:'환',mode:'encounter',faction:'F-NORMAL'},
 threat:{id:'E-THREAT',name:'회차의 핵심 위협',realm:2,mastery:40,style:'중',mode:'life',faction:'F-THREAT'},
 leader:{id:'E-LEADER',name:'우두머리 결전 상대',realm:3,mastery:50,style:'강',mode:'life',faction:'F-NORMAL'}
};
export const LEGACY_DATA = {version:LEGACY_VERSION.content,origins:ORIGINS,actions:ACTIONS,events:EVENTS,skills:SKILLS,mentors:MENTORS,enemies:ENEMIES};
export const INVENTORY_DATA = {
 ...LEGACY_DATA,version:INVENTORY_VERSION.content,items:ITEMS,itemRules:ITEM_RULES,
 actions:ACTIONS.map(a=>a.id==='ACT-04'?{...a,desc:'마을에 전할 곡물을 호송합니다. 길에서 생긴 일에 대응하고, 호송을 마치면 보수를 받습니다.'}:a),
 events:EVENTS.map(e=>e.id==='A-001'?{...e,text:'곡물을 실은 상단 앞에 다친 고수가 쓰러져 있습니다. 구조를 도우면서 호송의 약속을 이어가야 합니다.'}:e)
};
// D-043 / D-045 first runtime trial. Snapshotted only for new lives.
const enemyFoundations={novice:[0,0],rival:[40,40],ambush:[40,40],master:[100,100],threat:[100,100],leader:[200,200]};
export const PLAY_DATA = {
 ...INVENTORY_DATA,version:PLAY_VERSION.content,
 story:{version:1,npc:{id:'NPC-GRAIN-CONTACT',name:'상단 연락책'},offers:[
  {id:'OFFER-GRAIN-01',title:'마을 배급 준비',quote:'곡물은 잘 도착했습니다. 마을에 나눌 준비도 도와주시겠습니까?',completion:'곡물을 마을에 나눌 준비를 마쳤습니다.'},
  {id:'OFFER-GRAIN-02',title:'다음 장날의 약속',quote:'지난번 배급을 도와주셨지요. 다음 장날에 쓸 물자를 거두는 일도 맡아주시겠습니까?',completion:'다음 장날에 쓸 물자를 마련해 두 번째 약속을 마쳤습니다.'}]},
 qiRules:{version:1,baseQi:16,innerRate:.4,baseHp:100,outerLinear:.05,outerQuadratic:.0005,
  basicScale:.6,breathingMonths:1,riskThresholds:[.95,1.05,1.5]},
 skills:SKILLS.map(skill=>({...skill,cost:skill.id==='SAMJAE'?4:7})),
 enemies:Object.fromEntries(Object.entries(ENEMIES).map(([key,enemy])=>[key,{...enemy,
  foundation:{inner:enemyFoundations[key][0]*1000,outer:enemyFoundations[key][1]*1000},cost:enemy.style==='neutral'?4:7}])),
 items:{...ITEMS,
  'CON-QI-RECOVER':{type:'qiMedicine',name:'내공 회복약',effect:'recover',amount:12},
  'CON-QI-CAPACITY':{type:'qiMedicine',name:'내공 증진약',effect:'capacity',amount:4}}
};
export const DATA = {...PLAY_DATA,version:VERSION.content,factions:1,origins:FAMILIAR_ORIGINS,mentors:FAMILIAR_MENTORS,
 enemies:{...PLAY_DATA.enemies,novice:{...PLAY_DATA.enemies.novice,hpOverride:65}},
 skills:[...PLAY_DATA.skills.filter(s=>!['P-S01','P-S02'].includes(s.id)),...FAMILIAR_SKILLS]};
export function validateData(d=DATA){
 if(!d||!['actions','events','skills','mentors'].every(k=>Array.isArray(d[k]))||typeof d.version!=='string')throw Error('콘텐츠 구조 오류');
 const ids=new Set(); for(const group of ['actions','events','skills','mentors']) for(const x of d[group]) {if(ids.has(x.id))throw Error('중복 ID: '+x.id);ids.add(x.id);}
 if(d.actions.length!==10||d.events.length!==10)throw Error('콘텐츠 수량 오류');
 if(['web-v1.4','web-v1.5'].includes(d.version))validateFamiliarCatalog(d);
 else if(d.factions!==undefined||d.mentors.length!==4||MENTORS.some(expected=>!d.mentors.some(m=>m.id===expected.id&&m.origin===expected.origin)))throw Error('기존 스승 계약 오류');
 if(d.version==='web-v1.5'&&!Number.isSafeInteger(d.enemies?.novice?.hpOverride))throw Error('초보 비무 생명력 정의 누락');
 for(const [key,enemy]of Object.entries(d.enemies??{}))if('hpOverride' in enemy){
  if(d.version!=='web-v1.5'||key!=='novice'||enemy.id!=='E-NOVICE'||enemy.mode!=='duel'||!Number.isSafeInteger(enemy.hpOverride)||enemy.hpOverride<=0)throw Error('초보 비무 생명력 정의 오류');
 }
 const effects=new Set(['npc','extra','heal','clue','randomStudy','battle','herb','insight','learn','breakthrough','resolveThreat','fame','debt']);
 for(const e of d.events){
  const cs=new Set();if(!Array.isArray(e.choices)||!e.choices.length)throw Error('선택 없음');
  for(const x of e.choices){
   if(typeof x.id!=='string'||!x.id||cs.has(x.id))throw Error('중복/잘못된 선택');cs.add(x.id);
   if(x.requires&&!['light','medicine','body','inner','mediation'].includes(x.requires))throw Error('조건 타입 오류');
   if(!Array.isArray(x.effects))throw Error('효과 구조 오류');
   for(const effect of x.effects){
    if(!Array.isArray(effect)||effect.length!==2)throw Error('효과 구조 오류');const[type,value]=effect;
    if(!effects.has(type))throw Error('효과 타입 오류');
    if(type==='learn'){if(!d.skills.some(s=>s.id===value))throw Error('무공 참조 오류');}
    else if(type==='battle'){if(!d.enemies?.[value]&&!['ambushTerrain','ambushLight'].includes(value))throw Error('적 참조 오류');}
    else if(['clue','debt'].includes(type)){if(typeof value!=='string'||!value.trim())throw Error('문자 효과 오류');}
    else if(!Number.isFinite(value)||!Number.isInteger(value)||value<=0)throw Error('효과 수치 오류');
   }
  }
  if(!e.choices.some(x=>!x.requires))throw Error('기본 대응 없음');
 }
 for(const a of d.actions)if(!(a.months>0&&Number.isInteger(a.months)&&Number.isFinite(a.xp)&&a.xp>=0&&Number.isFinite(a.mastery)&&a.mastery>=0&&Array.isArray(a.tags)&&a.tags.length))throw Error('기간/성장 오류');
 for(const m of d.mentors)if(!d.skills.some(x=>x.id===m.skill)||!(d.origins??ORIGINS).some(o=>o.id===m.origin)||!['light','medicine','body'].includes(m.assist))throw Error('스승 참조 오류');
 for(const e of Object.values(d.enemies||{}))if(!Number.isInteger(e.realm)||e.realm<0||e.realm>4||!Number.isFinite(e.mastery)||e.mastery<0||!['duel','life','encounter'].includes(e.mode)||!['F-NORMAL','F-THREAT'].includes(e.faction))throw Error('적 수치/해금 오류');
 return true;
}
