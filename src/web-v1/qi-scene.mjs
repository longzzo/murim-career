import {artAsset,artStatus,skillPresentation} from './art.mjs';
import {turnPresentation,timedFrame} from './scene-timing.mjs';
import {playTimeline} from './replay-clock.mjs';

const budgets={decisive:[70,330,600],'first-fallback':[70,230,500],'first-skill':[100,320,480],repeat:[20,110,150]};
function retimedPlan(source,kind){
 const [ready,strike,read]=budgets[kind],contact=ready+strike,duration=contact+read;
 const map=time=>time<=source.approach?time/source.approach*ready:time<=source.contact?
  ready+(time-source.approach)/(source.contact-source.approach)*strike:
  contact+(time-source.contact)/(source.duration-source.contact)*read;
 let edge=source.approach;
 return {...Object.fromEntries(Object.entries(source).map(([key,value])=>[key,typeof value==='number'?map(value):value])),
  durations:source.durations.map(ms=>{const from=edge;edge+=ms;return map(edge)-map(from);}),approach:ready,contact,duration,source};
}
function sourceTime(plan,time){
 const s=plan.source;
 return time<=plan.approach?time/plan.approach*s.approach:time<=plan.contact?
  s.approach+(time-plan.approach)/(plan.contact-plan.approach)*(s.contact-s.approach):
  s.contact+(time-plan.contact)/(plan.duration-plan.contact)*(s.duration-s.contact);
}

// Only recorded, executed actions produce timeline entries. No rule functions are imported.
export function qiTimeline(battle,getAsset=artAsset,getMapping=skillPresentation){
 let total=0;const entries=[],seen=new Set(),fallbackSeen=new Set();
 for(const turn of battle.turns){
  let values={...turn.before};
  for(const side of [turn.first,turn.first==='player'?'opponent':'player']){
   const action=turn[side];if(!action)continue;
   const source=turnPresentation({skillId:action.skillId,damage:action.damage,received:0},getAsset,getMapping);
   const before={...values},begun={...values,[side==='player'?'qi':'enemyQi']:action.qiAfter};
   values={...begun,[side==='player'?'enemyHp':'hp']:Math.max(0,begun[side==='player'?'enemyHp':'hp']-action.damage)};
   const key=side+'/'+action.skillId,first=!seen.has(key),fallback=action.skillId==='BASIC'&&/내공 부족/.test(action.reason??'')&&!fallbackSeen.has(side);
   const decisive=values[side==='player'?'enemyHp':'hp']===0;
   const kind=decisive?'decisive':fallback?'first-fallback':first&&action.cost>0?'first-skill':'repeat';
   seen.add(key);if(fallback)fallbackSeen.add(side);
   const plan=retimedPlan(source,kind);
   entries.push({start:total,turn,side,action,plan,kind,compact:kind==='repeat',before,begun,after:{...values}});total+=plan.duration;
  }
 }
 const ending=battle.outcome==='escape'?{start:total,duration:700}:null;
 return {entries,total:total+(ending?.duration??0),ending};
}
export function qiFrameAt(timeline,elapsed,finished=false){
 const entry=timeline.entries.find(e=>elapsed<e.start+e.plan.duration)??timeline.entries.at(-1);
 const local=elapsed-entry.start;
 const phase=finished||timeline.ending&&elapsed>=timeline.ending.start?'finished':local<entry.plan.approach?'ready':local<entry.plan.contact?'attack':'hit';
 const values=phase==='finished'?entry.after:phase==='ready'?entry.before:phase==='attack'?entry.begun:entry.after;
 return {entry,local,phase,values};
}
export function playQiScene(canvas,battle,onCaption,{speed=1,finish=false,round=null,onFrame=()=>{},onState=()=>{}}={}){
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const ready=artStatus().ready;
 // Fallback timing is deterministic and uses the same executed-action record.
 const fallbackAsset=id=>({assetId:id,frameDurationsMs:[80,80,80,80,80,80]});
 const timeline=qiTimeline(battle,ready?artAsset:fallbackAsset,ready?skillPresentation:()=>null);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const background=ready?artAsset(battle.mode==='duel'||battle.enemyKey==='leader'?'AC-BG-COURTYARD':'AC-BG-ROAD'):null;
 let lastLabel='';
 function sprite(id,x,flip,clipName,time,custom){
  const a=artAsset(id),clip=a.clips[clipName]??a.clips.idle;
  const frames=custom?.frames??clip.frames,durations=custom?.durations??frames.map(()=>clip.frameMs);
  const index=timedFrame(frames,durations,time,{loop:clip.loop});
  ctx.save();ctx.translate(Math.round(x),120);if(flip)ctx.scale(-1,1);
  ctx.drawImage(a.image,index%a.columns*a.frameWidth,Math.floor(index/a.columns)*a.frameHeight,a.frameWidth,a.frameHeight,
   -a.anchorPx[0],-a.anchorPx[1],a.frameWidth,a.frameHeight);ctx.restore();
 }
 function effect(id,x,flip,time){
  if(time<0)return;const a=artAsset(id);if(!a)return;
  let left=time,index=-1;for(let i=0;i<a.frameCount;i++){left-=a.frameDurationsMs[i];if(left<0){index=i;break;}}
  if(index<0)return;const r=a.frameRects[index];ctx.save();ctx.translate(x,120);if(flip)ctx.scale(-1,1);
  ctx.drawImage(a.image,r.x,r.y,r.w,r.h,-a.anchorPx[0],-a.anchorPx[1],r.w,r.h);ctx.restore();
 }
 function draw(elapsed,finished=false){
  const state=qiFrameAt(timeline,elapsed,finished),{entry:e,local,phase,values}=state,p=e.plan.source,time=sourceTime(e.plan,Math.min(local,e.plan.duration));
  finished=phase==='finished';
  canvas.dataset.drawCount=String(Number(canvas.dataset.drawCount??0)+1);
  canvas.dataset.turn=String(e.turn.round);canvas.dataset.actor=finished?'none':e.side;canvas.dataset.phase=phase;
  canvas.dataset.skill=e.action.skillId;canvas.dataset.executed='true';
  canvas.dataset.compact=String(e.compact);
  canvas.dataset.hp=String(values.hp);canvas.dataset.enemyHp=String(values.enemyHp);
  canvas.dataset.qi=String(values.qi);canvas.dataset.enemyQi=String(values.enemyQi);
  const approaching=!reduced&&!finished&&e===timeline.entries[0]&&local<e.plan.approach;
  const move=approaching?Math.max(0,local/e.plan.approach):1,px=56+47*move,ex=200-47*move;
  canvas.dataset.playerX=String(px);canvas.dataset.enemyX=String(ex);
  ctx.clearRect(0,0,256,144);
  if(background)ctx.drawImage(background.image,0,0,256,144);
  else{ctx.fillStyle='#d3dfce';ctx.fillRect(0,0,256,144);}
  let pc='idle',ec='idle',pt=0,et=0;
  if(approaching){pc='approach';ec='approach';pt=et=time;}
  else if(!reduced&&!finished){
   if(time>=p.approach&&time<p.attackEnd){
    if(e.side==='player'){pc='attack';pt=time-p.approach;}else{ec='attack';et=time-p.approach;}
   }
   if(time>=p.contact&&time<p.contact+200){
    if(e.side==='player'){ec='hit';et=time-p.contact;}else{pc='hit';pt=time-p.contact;}
   }
  }
  if(finished||time>=p.contact+200){if(values.hp===0)pc='down';if(values.enemyHp===0)ec='down';}
  if(finished){if(values.hp>0&&battle.outcome==='win')pc='victory';if(values.enemyHp>0&&battle.outcome==='loss')ec='victory';pt=et=1000;}
  canvas.dataset.playerPose=pc;canvas.dataset.enemyPose=ec;
  if(ready){
   sprite('AC-CHR-PLAYER',px,false,pc,pt,pc==='attack'?p:null);
   sprite('AC-CHR-HUMAN',ex,true,ec,et,ec==='attack'?p:null);
   if(!reduced&&!finished){
    effect(p.effectId,e.side==='player'?px:ex,e.side!=='player',time-p.release);
    effect('AC-FX-HIT',e.side==='player'?ex:px,e.side==='player',time-p.contact);
   }
  }else{
   for(const [x,pose,color]of [[px,pc,'#407b72'],[ex,ec,'#99704e']]){
    ctx.fillStyle=color;ctx.fillRect(x-7,pose==='down'?112:80,14,pose==='down'?7:40);
    if(pose==='attack')ctx.fillRect(x,88,18,3);
   }
  }
  const who=e.side==='player'?'나':battle.enemy;
  const caption=finished?`기록된 결과: ${{win:'승리',loss:'패배',escape:'도주'}[battle.outcome]}`:
   `${e.turn.round}합 · ${who} ${e.action.skill} · 내공 ${e.action.qiBefore} → ${phase==='ready'?e.action.qiBefore:e.action.qiAfter} · ${phase==='hit'?e.action.damage+' 피해':phase==='attack'?'공격 중':'발동 준비'}${e.compact?' · 반복 공격 짧게 재생':''}`;
  if(caption!==lastLabel){lastLabel=caption;onCaption(caption);}
  onFrame({round:e.turn.round,side:e.side,action:e.action,phase,values,finished});
 }
 const selected=round===null?null:timeline.entries.filter(e=>e.turn.round===round).at(-1);
 return playTimeline(canvas,timeline.total,draw,{speed,position:selected?selected.start+selected.plan.duration-.001:0,
  paused:!!selected,finish:finish||reduced||!!selected&&round===battle.turns.at(-1).round,onState});
}
