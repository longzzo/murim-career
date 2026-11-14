// Self-authored TMP pixel scene. No PixelFX or third-party artwork is included.
import {playTimeline} from './replay-clock.mjs';
let cancelPrevious=()=>{};
export function stopScene(){cancelPrevious();cancelPrevious=()=>{};}
export function playScene(canvas,battle,onCaption,{speed=1,finish=false,onState}={}){
 stopScene();const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function actor(x,y,flip,color,pose){
  ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);
  const r=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(a,b,w,h);};
  r(-8,-47,15,8,'#263e3c');r(-6,-40,12,12,'#d3ad83');r(6,-39,3,5,'#263e3c');
  r(-10,-28,19,22,'#233d3b');r(-8,-26,15,17,color);r(-10,-10,21,5,color);r(-8,-5,6,5,'#243b3c');r(4,-5,6,5,'#243b3c');
  if(pose){r(7,-29,13,5,color);r(18,-40,2,28,'#f0e9d3');r(16,-14,6,3,'#947646');}
  else{r(8,-23,5,15,color);r(13,-22,2,25,'#f0e9d3');r(10,0,7,3,'#947646');}
  r(-11,-25,5,15,color);ctx.restore();
 }
 function draw(index,phase=0){
  ctx.clearRect(0,0,256,144);ctx.fillStyle='#dae7dd';ctx.fillRect(0,0,256,144);
  ctx.fillStyle='#9ebbb0';const ridge=[[0,65],[30,37],[59,65],[95,30],[140,66],[175,41],[211,64],[240,27],[256,41]];ctx.beginPath();ctx.moveTo(0,102);for(const[x,y]of ridge)ctx.lineTo(x,y);ctx.lineTo(256,108);ctx.fill();
  ctx.fillStyle='#bed0b7';ctx.fillRect(0,88,256,56);ctx.fillStyle='#5b7665';ctx.fillRect(0,118,256,3);ctx.fillStyle='#879978';for(let x=0;x<256;x+=19)ctx.fillRect(x,126+(x%3),7,2);
  actor(56,120,false,'#407b72',phase>.25&&phase<.65);actor(200,120,true,'#99704e',phase>.45&&phase<.85);
  if(phase>.35&&phase<.55){ctx.fillStyle='#f7f0d0';ctx.fillRect(130,69,28,3);ctx.fillRect(148,61,3,20);ctx.fillStyle='#c6a65d';ctx.fillRect(138,79,17,2);}
  const t=battle?.turns[index];if(t){ctx.fillStyle='#35564b';ctx.fillRect(17,14,84,3);ctx.fillRect(155,14,84,3);ctx.fillStyle='#90b99b';ctx.fillRect(17,14,Math.max(0,Math.floor(t.hp*.84)),3);ctx.fillStyle='#c6a16b';ctx.fillRect(155,14,Math.max(0,Math.floor(t.enemyHp*.84)),3);}
 }
 if(!battle){draw(0);return cancelPrevious;}
 const duration=battle.turns.length*650;
 cancelPrevious=playTimeline(canvas,duration,(elapsed,finished)=>{
  const index=Math.min(battle.turns.length-1,Math.floor(elapsed/650));draw(index,reduced||finished?0:elapsed%650/650);
  const t=battle.turns[index];canvas.dataset.turn=String(t.round);canvas.dataset.phase=finished?'finished':'attack';
  onCaption(finished?`기록된 결과: ${battle.outcome==='win'?'승리':battle.outcome==='escape'?'도주':battle.outcome==='mutual'?'동반 사망':'패배'} · 연출은 판정을 바꾸지 않습니다.`:`${t.round}합 · ${t.skill} 발동 · ${t.damage} 피해 / ${t.received} 피격`);
 },{speed,finish:finish||reduced,onState});return cancelPrevious;
}
