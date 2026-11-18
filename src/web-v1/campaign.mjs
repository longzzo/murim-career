const clone=structuredClone,need=(ok,message='문파 이야기 저장의 근거가 맞지 않습니다.')=>{if(!ok)throw Error(message);};
const integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
const sameValue=(left,right)=>{
 if(left===right)return true;
 if(!left||!right||typeof left!=='object'||typeof right!=='object'||Array.isArray(left)!==Array.isArray(right))return false;
 if(Object.prototype.toString.call(left)!==Object.prototype.toString.call(right)||Array.isArray(left)&&left.length!==right.length)return false;
 const keys=Object.keys(left);return keys.length===Object.keys(right).length&&keys.every(key=>Object.hasOwn(right,key)&&sameValue(left[key],right[key]));
};
export const hasCampaign=s=>s.versions.campaign===1&&['P-HUASHAN','S-HAOMEN'].includes(s.life.origin);
export const campaignSatisfied=s=>!hasCampaign(s)||s.life.campaign.status==='completed';
const arcFor=s=>s.content.campaign.arcs.find(a=>a.id===s.life.campaign.arcId);
const nextRng=n=>{let x=n>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0||1;};
const zeroResources=d=>Object.fromEntries(Object.keys(d.resources).map(k=>[k,0]));
const roleFor=(a,c)=>c.status!=='completed'?['입문 제자','문파의 일을 맡은 제자','강호 인연의 동행','갈등에 대비하는 제자','해결을 맡은 제자'][Math.min(4,Math.floor(c.cursor/5))]:a.id==='C-HS-01'?(c.flags['shared-credit']?'주민과 동문의 약속을 함께 지킨 사람':'사문에 보호 책임을 남긴 사람'):a.id==='C-HS-02'?(c.flags['independent-credit']?'자기 구간을 증명한 제자':'공동 판단을 이은 제자'):a.id==='C-HA-01'?(c.flags['safety-role']?'출처를 함부로 팔지 않는 연락자':'확인한 전언을 책임지는 연락자'):(c.flags['independent-role']?'독자 연락을 잇는 사람':'서로 다른 몫을 조정한 사람');
const initialRng=s=>((s.initialSeed^Math.imul(s.life.seq,0x9e3779b9)^0x53544f52)>>>0)||1;
const availableArcs=s=>s.content.campaign.arcs.filter(a=>a.origin===s.life.origin);
export function startCampaign(s){
 if(!hasCampaign(s))return;
 const seed=initialRng(s),arcs=availableArcs(s);need(arcs.length>0,'이 문파의 이야기를 찾을 수 없습니다.');const rng=arcs.length>1?nextRng(seed):seed,arc=arcs[Math.floor(rng/4294967296*arcs.length)];
 s.life.campaign={version:1,lifeId:s.life.id,arcId:arc.id,seed,rng,cursor:0,status:'active',pending:null,inFlight:null,resources:zeroResources(s.content.campaign),relations:Object.fromEntries(arc.npcs.map(n=>[n.id,0])),flags:{},facts:[],history:[]};updateCampaign(s);
}
export function campaignActionCompleted(s,a){if(!hasCampaign(s)||a.id==='ACT-CAMPAIGN')return;const c=s.life.campaign,source=s.life.id+'/'+a.key;if(c.facts.some(f=>f.source===source))return;c.facts.push({source,actionId:a.id,month:s.life.month,target:a.target,battleOutcome:s.result?.battle?.outcome??null});}
function gate(s,scene){const c=s.life.campaign,facts=c.facts,mentor=s.content.mentors.find(m=>m.id===s.life.mentor);switch(scene?.gate){case 'foundation':return s.life.realm>=1;case 'realm-ready':return s.life.realm>=2;case 'readiness':return s.life.origin==='P-HUASHAN'?s.life.realm>=2&&s.life.world.resolved&&!s.life.debt.length:s.life.realm>=3&&s.life.fame>=6&&s.life.trust>=3;case 'learning':return s.life.skills[mentor.skill]!==undefined&&facts.some(f=>f.actionId==='ACT-02');case 'practice':return facts.some(f=>f.actionId==='ACT-06');case 'work':return facts.some(f=>['ACT-03','ACT-04'].includes(f.actionId));case 'training':return facts.some(f=>['ACT-01','ACT-07','ACT-10'].includes(f.actionId));default:return true;}}
function candidates(s,scene){const c=s.life.campaign;return (scene.variants??[]).filter(v=>v.id==='training'?c.facts.some(f=>['ACT-01','ACT-02','ACT-06','ACT-07','ACT-10'].includes(f.actionId)):v.id==='work'?c.facts.some(f=>['ACT-03','ACT-04','ACT-08'].includes(f.actionId)):c.history.some(h=>h.status==='completed'&&h.relation?.[1]>0));}
export function updateCampaign(s){
 if(!hasCampaign(s))return;const c=s.life.campaign;if(c.status!=='active'||c.pending||c.inFlight||s.phase!=='home'||s.active||s.pending||s.queue.length||s.life.ending)return;
 const scene=arcFor(s).scenes[c.cursor];if(!gate(s,scene))return;const eligible=candidates(s,scene),before=c.rng;if(eligible.length>1)c.rng=nextRng(c.rng);const selected=eligible.length?eligible[Math.floor(c.rng/4294967296*eligible.length)]:null;
 c.pending={sceneId:scene.id,index:c.cursor,variantId:selected?.id??null,selectedMonth:s.life.month,rngBefore:before,rngAfter:c.rng,eligible:eligible.map(v=>v.id),sources:c.facts.map(f=>f.source),choiceSources:c.history.filter(h=>h.status==='completed'&&h.relation?.[1]>0).map(h=>h.source)};
}
function selectedOptions(scene,pending){const variant=scene.variants?.find(v=>v.id===pending?.variantId);return variant?(scene.choices.length===3?[scene.choices[0],variant.choice,scene.choices[2]]:[...scene.choices,variant.choice]):scene.choices;}
export function campaignChoiceBlocked(s,choice){const c=s.life.campaign,r=choice.requires;if(s.life.money<choice.cost)return '재화 '+choice.cost+' 필요';if(r?.notFlag&&c.flags[r.notFlag])return '앞선 노출로 이 연락선을 그대로 쓸 수 없음';if(r?.flag&&!c.flags[r.flag])return '앞선 약속의 근거가 없음';if(r?.resource&&c.resources[r.resource]<r.min)return s.content.campaign.resources[r.resource]+' '+r.min+' 필요';if(r?.assist&&!s.life.assists.includes(r.assist))return ({medicine:'의술',light:'경공',body:'외공 단련'})[r.assist]+' 필요';return '';}
export function beginCampaignChoice(s,command){
 need(hasCampaign(s)&&s.phase==='home'&&!s.active&&!s.pending&&!s.queue.length&&!s.life.ending,'현재 상황을 마친 뒤 약속을 선택할 수 있습니다.');const c=s.life.campaign,a=arcFor(s),p=c.pending;need(c.status==='active'&&p&&!c.inFlight&&command.sceneId===p.sceneId&&command.variantId===p.variantId,'이미 지나갔거나 다른 이야기 장면입니다.');const scene=a.scenes[c.cursor],choice=selectedOptions(scene,p).find(o=>o.id===command.choice);need(choice,'해당 장면에 없는 선택입니다.');need(!campaignChoiceBlocked(s,choice),campaignChoiceBlocked(s,choice));
 c.inFlight={choiceId:choice.id,commandId:command.id,source:s.life.id+'/campaign/'+command.id,startedMonth:s.life.month,cost:choice.cost,months:choice.months};s.life.money-=choice.cost;
 return clone(choice);
}
function apply(c,choice,source){for(const [k,n]of Object.entries(choice.effects))c.resources[k]=Math.max(0,c.resources[k]+n);if(choice.relation){const [id,n]=choice.relation;c.relations[id]=Math.max(-5,Math.min(5,c.relations[id]+n));}if(choice.flag)c.flags[choice.flag]=source;}
export function campaignBattleKey(s){if(!hasCampaign(s)||!s.life.campaign.inFlight)return null;const c=s.life.campaign,scene=arcFor(s).scenes[c.cursor],o=selectedOptions(scene,c.pending).find(o=>o.id===c.inFlight.choiceId);return o.battle?arcFor(s).enemyKey:null;}
export function completeCampaignChoice(s,battle=null){
 const c=s.life.campaign,a=arcFor(s),scene=a.scenes[c.cursor],p=c.pending,inFlight=c.inFlight;need(inFlight&&p);const choice=selectedOptions(scene,p).find(o=>o.id===inFlight.choiceId);need(choice);const succeeded=!choice.battle||battle?.outcome==='win';
 const before=clone(c.resources),relationsBefore=clone(c.relations);if(succeeded)apply(c,choice,inFlight.source);
 const record={...clone(inFlight),sceneId:scene.id,index:c.cursor,variantId:p.variantId,title:scene.title,speaker:scene.speaker,label:choice.label,endedMonth:s.life.month,status:succeeded?'completed':'failed',effects:clone(choice.effects),relation:clone(choice.relation??null),flag:choice.flag??null,battleId:battle?.id??null,resourcesBefore:before,resourcesAfter:clone(c.resources),relationsBefore,relationsAfter:clone(c.relations),selection:clone(p)};
 c.history.push(record);c.inFlight=null;if(succeeded){c.cursor++;c.pending=null;if(c.cursor===a.scenes.length){c.status='completed';c.completedMonth=s.life.month;}}
 s.phase='result';s.result={title:succeeded?scene.title+' · 선택의 결과':scene.title+' · 다시 대비할 때',text:succeeded?(c.status==='completed'?'이 갈등을 마무리했습니다. 성공을 기록하려면 기존 경지와 강호의 조건도 갖춰야 합니다.':'선택의 후속을 기록했습니다.'):'겨룸에서 길을 열지 못했습니다. 몸을 돌보거나 다른 해결을 고를 수 있습니다.',battle,actionId:choice.months?'ACT-CAMPAIGN':undefined,campaign:{...clone(record),arcTitle:a.title,stage:s.content.campaign.stages[scene.stage],stageCompleted:succeeded&&c.cursor%5===0,completed:c.status==='completed'}};
 return record;
}
export function closeCampaign(s,cause){if(!hasCampaign(s))return;const c=s.life.campaign;if(c.status==='completed')return;c.status='interrupted';c.endedMonth=s.life.month;c.cause=cause;if(c.inFlight)c.interruptedChoice=clone(c.inFlight);c.inFlight=null;}
export function campaignArchive(s){if(!hasCampaign(s))return null;const c=s.life.campaign,a=arcFor(s);return {version:1,lifeId:s.life.id,title:a.title,role:roleFor(a,c),stage:s.content.campaign.stages[Math.min(4,Math.floor(c.cursor/5))],completed:c.status==='completed',completedScenes:c.cursor,status:c.status,relations:a.npcs.map(n=>({...n,name:n.id==='master'?s.content.mentors.find(m=>m.id===s.life.mentor).name:n.name,value:c.relations[n.id],reasons:c.history.filter(h=>h.status==='completed'&&h.relation?.[0]===n.id).map(h=>({title:h.title,label:h.label,month:h.endedMonth}))})),decisions:c.history.map(h=>({title:h.title,label:h.label,status:h.status,month:h.endedMonth,cost:h.cost,months:h.months})),resources:clone(c.resources),resourceNames:clone(s.content.campaign.resources),unfinished:c.interruptedChoice?{spent:c.interruptedChoice.cost,startedMonth:c.interruptedChoice.startedMonth,plannedMonths:c.interruptedChoice.months}:null};}
export function campaignEnemy(s,key,enemy){
 if(!hasCampaign(s)||key!==arcFor(s).enemyKey)return enemy;const r=s.life.campaign.resources,e=clone(enemy),information=Math.min(8,Math.floor(r.information/2)),support=Math.min(12000,r.support*2000),supplies=Math.min(8,r.supplies);
 e.mastery=Math.max(0,e.mastery-information-supplies);e.foundation.inner=Math.max(0,e.foundation.inner-support);return e;
}
export function campaignView(s){
 if(!hasCampaign(s))return null;const c=s.life.campaign,a=arcFor(s),scene=a.scenes[c.cursor],p=c.pending,gates={learning:{title:'사부의 검법을 배우고 약속을 잇기',action:'ACT-02'},practice:{title:'첫 비무를 마치고 동문과 이야기하기',action:'ACT-06'},work:{title:'강호의 일을 마치고 돌아오기',action:'ACT-03'},training:{title:'기반을 수련하고 대비를 확인하기',action:'ACT-01',target:'inner'}};
 const readiness=scene?.gate==='readiness';if(['foundation','realm-ready'].includes(scene?.gate))gates[scene.gate]={title:scene.gate==='foundation'?'첫 책임을 맡을 이류의 기반':'갈등에 대비할 일류의 기반',action:'ACT-01',target:'inner'};if(readiness){if(s.life.realm<(s.life.origin==='P-HUASHAN'?2:3))gates.readiness={title:'최종 대응을 맡을 경지의 기반',action:'ACT-01',target:'outer'};else if(s.life.origin==='S-HAOMEN'&&(s.life.fame<6||s.life.trust<3)||s.life.debt.length)gates.readiness={title:'강호의 일로 지지와 남은 은원 정리',action:'ACT-03'};else if(s.life.world.occurred&&!s.life.world.resolved)gates.readiness={title:'이미 마주한 강호의 위협에 대응',action:'ACT-09',target:'threat'};else gates.readiness={title:'강호 소식을 살피며 현재 준비 다듬기',action:'ACT-01',target:'outer'};}const next=c.status==='completed'?null:p?{title:scene.title,reason:a.title+' · '+s.content.campaign.stages[scene.stage],label:'약속 살피기',campaign:true}:gates[scene?.gate]?{...gates[scene.gate],reason:'완료한 성취를 이어서 인정합니다. 같은 행동을 다시 할 필요는 없습니다.',label:'필요한 행동 살피기'}:{title:'현재 상황을 마칠 때',reason:'진행 중인 일과 사건을 마치면 다음 약속이 이어집니다.',label:'약속 살피기',campaign:true};
 const variant=scene?.variants?.find(v=>v.id===p?.variantId),npcs=a.npcs.map(n=>({...n,name:n.id==='master'?s.content.mentors.find(m=>m.id===s.life.mentor).name:n.name,value:c.relations[n.id],reason:c.history.findLast(h=>h.status==='completed'&&h.relation?.[0]===n.id)?.label??'이번 생애에서 막 만남'}));
 return {title:a.title,summary:a.summary,role:roleFor(a,c),motif:s.life.origin==='P-HUASHAN'?'plum':'lantern',completed:c.status==='completed',status:c.status,stage:s.content.campaign.stages[Math.min(4,Math.floor(c.cursor/5))],stageNumber:Math.min(5,Math.floor(c.cursor/5)+1),completedScenes:c.cursor,next,npcs,resources:clone(c.resources),resourceNames:clone(s.content.campaign.resources),ongoing:c.inFlight?{label:selectedOptions(scene,p).find(o=>o.id===c.inFlight.choiceId).label,cost:c.inFlight.cost,months:c.inFlight.months}:null,safe:s.phase==='home'&&!s.active&&!s.pending&&!s.queue.length&&!s.life.ending,scene:p?{id:scene.id,variantId:p.variantId,title:scene.title,text:scene.text,consequence:variant?.text??null,speaker:npcs.find(n=>n.id===scene.speaker),choices:selectedOptions(scene,p).map(o=>({...clone(o),blocked:campaignChoiceBlocked(s,o),benefits:Object.entries(o.effects).map(([k,n])=>s.content.campaign.resources[k]+' '+(n>0?'+':'')+n),battleProfile:o.battle?{name:a.enemy.name,realm:a.enemy.realm,hint:a.enemy.preparationHint??null,masteryBefore:a.enemy.mastery,masteryAfter:campaignEnemy(s,a.enemyKey,s.content.enemies[a.enemyKey]).mastery,qiFoundationBefore:a.enemy.foundation.inner,qiFoundationAfter:campaignEnemy(s,a.enemyKey,s.content.enemies[a.enemyKey]).foundation.inner,known:c.resources.information>=3}:null}))}:null,history:c.history.map(h=>({title:h.title,label:h.label,month:h.endedMonth,cost:h.cost,months:h.months,status:h.status})),archive:campaignArchive(s)};
}
export function validateCampaign(s){
 const c=s.life.campaign;need(s.versions.campaign===undefined&&s.versions.content!=='web-v1.8'||s.versions.campaign===1&&s.versions.content==='web-v1.8'&&s.versions.rules==='web-v1.5');
 validateCampaignArchives(s);
 if(!hasCampaign(s)){need(c===undefined&&!Object.hasOwn(s.result??{},'campaign'));return;}
 need(s.versions.content==='web-v1.8'&&s.versions.rules==='web-v1.5'&&c?.version===1&&c.lifeId===s.life.id&&integer(c.seed,1)&&c.seed===initialRng(s)&&integer(c.rng,1)&&c.rng<=0xffffffff&&integer(c.cursor)&&c.cursor<=25&&['active','completed','interrupted'].includes(c.status));
 const a=arcFor(s),arcs=availableArcs(s),draw=arcs.length>1?nextRng(c.seed):c.seed;need(a&&a.origin===s.life.origin&&a===arcs[Math.floor(draw/4294967296*arcs.length)]);
 need(Array.isArray(c.facts)&&new Set(c.facts.map(f=>f.source)).size===c.facts.length&&c.facts.every(f=>typeof f.source==='string'&&f.source.startsWith(s.life.id+'/action-')&&integer(Number(f.source.slice((s.life.id+'/action-').length)),1)&&Number(f.source.slice((s.life.id+'/action-').length))<=s.nextAction&&s.content.actions.some(a=>a.id===f.actionId&&a.id!=='ACT-CAMPAIGN')&&integer(f.month)&&f.month<=s.life.month));
 need(Array.isArray(c.history)&&new Set(c.history.map(h=>h.source)).size===c.history.length);
 const rebuilt={resources:zeroResources(s.content.campaign),relations:Object.fromEntries(a.npcs.map(n=>[n.id,0])),flags:{}};let index=0,lastMonth=0,selectionRng=draw,lastSelection=null;const prior=[];
 function validateSelection(p,scene){
  need(p&&p.index===index&&p.sceneId===scene.id&&integer(p.selectedMonth)&&p.selectedMonth<=s.life.month&&integer(p.rngBefore,1)&&integer(p.rngAfter,1)&&Array.isArray(p.sources)&&Array.isArray(p.choiceSources)&&Array.isArray(p.eligible));
  need(p.sources.every((source,i)=>c.facts[i]?.source===source&&c.facts[i].month<=p.selectedMonth));
  const positives=prior.filter(h=>h.status==='completed'&&h.relation?.[1]>0);need(JSON.stringify(p.choiceSources)===JSON.stringify(positives.map(h=>h.source))&&positives.every(h=>h.endedMonth<=p.selectedMonth));
  const facts=c.facts.slice(0,p.sources.length),eligible=(scene.variants??[]).filter(v=>v.id==='training'?facts.some(f=>['ACT-01','ACT-02','ACT-06','ACT-07','ACT-10'].includes(f.actionId)):v.id==='work'?facts.some(f=>['ACT-03','ACT-04','ACT-08'].includes(f.actionId)):positives.length>0).map(v=>v.id);
  need(JSON.stringify(p.eligible)===JSON.stringify(eligible));
  if(lastSelection?.index===index)need(JSON.stringify(p)===JSON.stringify(lastSelection));
  else{need(p.rngBefore===selectionRng&&p.selectedMonth>=lastMonth);selectionRng=eligible.length>1?nextRng(selectionRng):selectionRng;need(p.rngAfter===selectionRng);lastSelection=p;}
  need(p.variantId===(eligible.length?eligible[Math.floor(p.rngAfter/4294967296*eligible.length)]:null));
 }
 for(const h of c.history){const scene=a.scenes[index];need(scene&&h.index===index&&h.sceneId===scene.id&&h.selection?.sceneId===scene.id&&h.selection.index===index&&h.selection.variantId===h.variantId&&integer(h.startedMonth)&&h.startedMonth>=lastMonth&&integer(h.endedMonth)&&h.endedMonth>=h.startedMonth+h.months&&h.endedMonth<=s.life.month&&typeof h.source==='string'&&h.source===s.life.id+'/campaign/'+h.commandId);
  validateSelection(h.selection,scene);need(h.selection.selectedMonth<=h.startedMonth);
  const o=selectedOptions(scene,h.selection).find(o=>o.id===h.choiceId);need(o&&o.cost===h.cost&&o.months===h.months&&h.label===o.label&&h.title===scene.title&&JSON.stringify(h.effects)===JSON.stringify(o.effects)&&JSON.stringify(h.relation)===JSON.stringify(o.relation??null)&&h.flag===(o.flag??null)&&['completed','failed'].includes(h.status));
  need(JSON.stringify(h.resourcesBefore)===JSON.stringify(rebuilt.resources)&&JSON.stringify(h.relationsBefore)===JSON.stringify(rebuilt.relations));const req=o.requires;need(!req?.flag||rebuilt.flags[req.flag]);need(!req?.notFlag||!rebuilt.flags[req.notFlag]);need(!req?.resource||rebuilt.resources[req.resource]>=req.min);need(!req?.assist||s.life.assists.includes(req.assist));if(h.status==='completed'){apply(rebuilt,o,h.source);index++;}else need(o.battle&&s.life.qi.battles.some(b=>b.id===h.battleId&&b.outcome!=='win'));
  if(o.battle&&h.status==='completed')need(s.life.qi.battles.some(b=>b.id===h.battleId&&b.outcome==='win'));need(JSON.stringify(h.resourcesAfter)===JSON.stringify(rebuilt.resources)&&JSON.stringify(h.relationsAfter)===JSON.stringify(rebuilt.relations));lastMonth=h.endedMonth;prior.push(h);
 }
 need(index===c.cursor&&JSON.stringify(rebuilt.resources)===JSON.stringify(c.resources)&&JSON.stringify(rebuilt.relations)===JSON.stringify(c.relations)&&JSON.stringify(rebuilt.flags)===JSON.stringify(c.flags));
 need((c.cursor===25)===(c.status==='completed'));if(c.status==='completed')need(c.completedMonth===c.history.at(-1).endedMonth&&!c.pending&&!c.inFlight);if(c.status==='interrupted')need(!!s.life.ending&&!c.inFlight&&c.endedMonth===s.life.month);if(s.life.ending)need(c.status!=='active');
 if(c.pending){const scene=a.scenes[c.cursor];need(scene);validateSelection(c.pending,scene);}
 need(c.rng===selectionRng);
 if(c.inFlight){const f=c.inFlight,scene=a.scenes[c.cursor],o=selectedOptions(scene,c.pending).find(o=>o.id===f.choiceId);need(c.status==='active'&&c.pending&&o&&o.months>0&&typeof f.commandId==='string'&&!!f.commandId&&f.source===s.life.id+'/campaign/'+f.commandId&&integer(f.startedMonth)&&f.startedMonth>=c.pending.selectedMonth&&f.cost===o.cost&&f.months===o.months&&s.active?.id==='ACT-CAMPAIGN'&&s.active.baseDuration===f.months&&s.active.summary?.startMonth===f.startedMonth);}
 if(s.active?.id==='ACT-CAMPAIGN')need(!!c.inFlight);
 validateCampaignResult(s,c,a);
}
function validateCampaignResult(s,c,a){
 const result=s.result,last=c.history.at(-1),present=Object.hasOwn(result??{},'campaign');
 const title=last?last.title+(last.status==='completed'?' · 선택의 결과':' · 다시 대비할 때'):null;
 const valid=condition=>need(condition,'문파 이야기 결과 기록이 실제 선택 원장과 일치하지 않습니다. 원본 저장은 보존됩니다.');
 // Acknowledging a result leaves it stored; validate against its receipt, not the next pending scene.
 if(!present){valid(result?.actionId!=='ACT-CAMPAIGN'&&(!last||result?.title!==title));return;}
 valid(!!last&&!!result.campaign&&typeof result.campaign==='object'&&!Array.isArray(result.campaign));
 const scene=a.scenes[last.index];valid(!!scene&&last.sceneId===scene.id&&last.speaker===scene.speaker&&last.source===s.life.id+'/campaign/'+last.commandId);
 const completed=last.status==='completed',expected={...last,arcTitle:a.title,stage:s.content.campaign.stages[scene.stage],stageCompleted:completed&&(last.index+1)%5===0,completed:completed&&last.index===a.scenes.length-1};
 valid(sameValue(result.campaign,expected)&&result.title===title&&result.actionId===(last.months?'ACT-CAMPAIGN':undefined));
 if(last.battleId){const battle=s.life.qi.battles.find(b=>b.id===last.battleId);valid(!!battle&&battle.enemyKey===a.enemyKey&&sameValue(result.battle,battle));}
 else valid(result.battle===null);
}
function validateCampaignArchives(s){
 const text=value=>typeof value==='string'&&!!value.trim(),object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const valid=condition=>need(condition,'문파 이야기 회고 기록의 구조나 근거가 맞지 않습니다. 원본 저장은 보존됩니다.');
 for(const record of s.meta.history){
  if(!Object.hasOwn(record,'campaign'))continue;
  const c=record.campaign,endMonth=(record.age-16)*12+(record.ageMonths??0);
  valid(object(c)&&c.version===1&&c.lifeId===record.id&&text(c.title)&&text(c.role)&&text(c.stage)&&integer(endMonth));
  valid(typeof c.completed==='boolean'&&['completed','interrupted'].includes(c.status)&&c.completed===(c.status==='completed')&&integer(c.completedScenes)&&c.completedScenes<=25&&c.completed===(c.completedScenes===25));
  valid(Array.isArray(c.decisions)&&c.decisions.filter(d=>d?.status==='completed').length===c.completedScenes);
  let previousMonth=0;
  for(const d of c.decisions){valid(object(d)&&text(d.title)&&text(d.label)&&['completed','failed'].includes(d.status)&&integer(d.month)&&d.month>=previousMonth&&d.month<=endMonth&&[0,10,20,30].includes(d.cost)&&[0,1,3].includes(d.months));previousMonth=d.month;}
  valid(Array.isArray(c.relations)&&c.relations.length===3&&c.relations.every(n=>object(n)&&text(n.id)&&text(n.name)&&text(n.role)&&text(n.symbol)&&Number.isSafeInteger(n.value)&&Math.abs(n.value)<=5&&Array.isArray(n.reasons))&&new Set(c.relations.map(n=>n.id)).size===c.relations.length);
  // Old names and roles belong to this archive, not the current life or the latest catalog.
  for(const n of c.relations)for(const r of n.reasons)valid(object(r)&&text(r.title)&&text(r.label)&&integer(r.month)&&c.decisions.some(d=>d.status==='completed'&&d.title===r.title&&d.label===r.label&&d.month===r.month));
  const keys=['support','information','supplies','standing'];valid(object(c.resources)&&object(c.resourceNames)&&Object.keys(c.resources).length===keys.length&&Object.keys(c.resourceNames).length===keys.length&&keys.every(k=>integer(c.resources[k])&&text(c.resourceNames[k])));
  valid(c.unfinished===null||!c.completed&&object(c.unfinished)&&[0,10,20,30].includes(c.unfinished.spent)&&integer(c.unfinished.startedMonth)&&c.unfinished.startedMonth<=endMonth&&[1,3].includes(c.unfinished.plannedMonths));
 }
}
