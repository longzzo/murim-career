// A display-only clock. Speed changes accrue time at the old rate before switching.
// No state, battle rules, or storage is read or written here.
export function playTimeline(canvas,total,draw,{speed=1,position=0,paused=false,finish=false,onState=()=>{}}={},clock={
 now:()=>performance.now(),request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id)
}){
 let elapsed=finish?total:Math.max(0,Math.min(total,position)),rate=speed;
 let previous=clock.now(),frame=null,stopped=false,holding=paused,lastState='';
 const state=()=>({elapsed,total,speed:rate,finished:elapsed>=total,paused:holding});
 const accrue=now=>{if(!holding)elapsed=Math.min(total,elapsed+Math.max(0,now-previous)*rate);previous=now;};
 const render=()=>{
  canvas.dataset.elapsedMs=String(elapsed);canvas.dataset.totalMs=String(total);canvas.dataset.speed=String(rate);
  canvas.dataset.paused=String(holding);
  draw(elapsed,elapsed>=total);
  const key=[rate,holding,elapsed>=total].join('/');if(key!==lastState){lastState=key;onState(state());}
 };
 const schedule=()=>{if(!stopped&&!holding&&elapsed<total&&frame===null)frame=clock.request(tick);};
 function tick(now){frame=null;if(stopped)return;accrue(now);render();schedule();}
 const clear=()=>{if(frame!==null)clock.cancel(frame);frame=null;};
 const stop=()=>{stopped=true;clear();};
 stop.setSpeed=value=>{
  if(stopped)return;
  if(!Number.isFinite(value)||value<=0)throw Error('Invalid replay speed');
  accrue(clock.now());rate=value;render();schedule();
 };
 stop.resume=()=>{if(stopped||elapsed>=total)return;previous=clock.now();holding=false;render();schedule();};
 stop.finish=()=>{if(stopped)return;clear();elapsed=total;holding=true;render();};
 stop.getState=state;
 render();schedule();return stop;
}
