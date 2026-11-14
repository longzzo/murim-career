import {artAsset,artStatus,skillPresentation} from './art.mjs';
import {turnPresentation,timedFrame} from './scene-timing.mjs';
import {playScene as fallback,stopScene as stopFallback} from './scene.mjs';
import {playQiScene} from './qi-scene.mjs';
import {playTimeline} from './replay-clock.mjs';
let cancel=()=>{};
export function stopScene(){cancel();cancel=()=>{};stopFallback();}
export function setSceneSpeed(speed){cancel.setSpeed?.(speed);}
export function finishScene(){cancel.finish?.();}
export function resumeScene(){cancel.resume?.();}
export function playScene(canvas,battle,onCaption,options={}){
 const {speed=1}=options;
 stopScene();
 if(battle?.resources){cancel=playQiScene(canvas,battle,onCaption,options);return cancel;}
 if(!artStatus().ready){canvas.dataset.art='fallback';cancel=fallback(canvas,battle,onCaption,options);return cancel;}
 canvas.dataset.art=artStatus().revision;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const background=artAsset(battle?.mode==='duel'||battle?.enemyKey==='leader'?'AC-BG-COURTYARD':'AC-BG-ROAD');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const turns=battle?.turns?.length?battle.turns:null;
 let total=0;
 const timeline=turns?.map(turn=>{const plan=turnPresentation(turn,artAsset,skillPresentation),start=total;total+=plan.duration;return{turn,plan,start};});
 function sprite(id,x,y,flip,clipName,time,hold=false,custom=null){
  const a=artAsset(id),clip=a.clips[clipName]||a.clips.idle;
  const frames=custom?.frames||clip.frames,durations=custom?.durations||frames.map(()=>clip.frameMs);
  const index=timedFrame(frames,durations,time,{loop:clip.loop,hold});
  const sx=(index%a.columns)*a.frameWidth,sy=Math.floor(index/a.columns)*a.frameHeight;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);
  ctx.drawImage(a.image,sx,sy,a.frameWidth,a.frameHeight,-a.anchorPx[0],-a.anchorPx[1],a.frameWidth,a.frameHeight);ctx.restore();
 }
 function effect(id,x,y,flip,time){
  if(time<0)return;const a=artAsset(id);if(!a)return;let left=time,index=-1;
  for(let i=0;i<a.frameCount;i++){left-=a.frameDurationsMs[i];if(left<0){index=i;break;}}
  if(index<0)return;const r=a.frameRects[index];ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);
  ctx.drawImage(a.image,r.x,r.y,r.w,r.h,-a.anchorPx[0],-a.anchorPx[1],r.w,r.h);ctx.restore();
 }
 function draw(elapsed,finished=false){
  canvas.dataset.drawCount=String(Number(canvas.dataset.drawCount||0)+1);
  ctx.clearRect(0,0,256,144);ctx.drawImage(background.image,0,0,256,144);
  if(!timeline){sprite('AC-CHR-PLAYER',56,120,false,'idle',0);sprite('AC-CHR-HUMAN',200,120,true,'idle',0);return;}
  const entry=timeline.find(x=>elapsed<x.start+x.plan.duration)||timeline.at(-1),{turn:t,plan:p}=entry,local=elapsed-entry.start;
  // Approach once per battle. Later turns keep the same positions during the lead-in.
  const approaching=!reduced&&!finished&&entry===timeline[0]&&local<p.approach;
  const move=approaching?local/p.approach:1,px=56+47*move,ex=200-47*move;
  let pc='idle',ec='idle',pt=local,et=local;
  if(finished){pc=t.hp<=0?'down':battle.outcome==='win'?'victory':'idle';ec=t.enemyHp<=0?'down':battle.outcome==='loss'?'victory':'idle';}
  else if(!reduced){
   if(approaching){pc='approach';ec='approach';}
   else if(local>=p.approach){
    if(local<p.attackEnd){pc='attack';pt=local-p.approach;}
    if(t.damage>0&&local>=p.contact&&local<p.contact+200){ec='hit';et=local-p.contact;}
    else if(t.received>0&&local>=p.counterStart&&local<p.counterStart+600){ec='attack';et=local-p.counterStart;}
    if(t.received>0&&local>=p.counterContact&&local<p.counterContact+200){pc='hit';pt=local-p.counterContact;}
    if(t.response==='guard'&&local>=p.contact&&local<p.contact+200){pc='guard';pt=local-p.contact;}
   }
  }
  sprite('AC-CHR-PLAYER',px,120,false,pc,pt,finished&&pc!=='idle',pc==='attack'?p:null);
  sprite('AC-CHR-HUMAN',ex,120,true,ec,et,finished&&ec!=='idle');
  if(!reduced&&!finished){
   effect(p.effectId,px,120,false,local-p.release);
   if(t.damage>0)effect('AC-FX-HIT',ex,120,true,local-p.contact);
   if(t.received>0){effect('AC-FX-SLASH',ex,120,true,local-p.counterRelease);effect('AC-FX-HIT',px,120,false,local-p.counterContact);}
   if(t.response==='guard')effect('AC-FX-GUARD',px,120,false,local-p.contact);
  }
  // Replay attributes contain no private lifetime facts.
  canvas.dataset.skill=t.skillId||'BASIC';canvas.dataset.effect=p.effectId;canvas.dataset.turn=String(t.round);
  canvas.dataset.phase=finished?'finished':local<p.approach?'ready':local<p.contact?'attack':'hit';
  onCaption(`${t.round}합 · ${t.skill} 발동 · ${t.damage} 피해 / ${t.received} 피격`);
 }
 if(!timeline){draw(0);return cancel;}
 cancel=playTimeline(canvas,total,(elapsed,finished)=>{
  draw(elapsed,finished);
  if(finished)onCaption(`기록된 결과: ${battle.outcome==='win'?'승리':battle.outcome==='escape'?'도주':battle.outcome==='mutual'?'동반 사망':'패배'} · PixelFX는 연출만 재생합니다.`);
 },{speed,finish:options.finish||reduced,onState:options.onState});return cancel;
}
