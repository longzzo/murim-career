// Presentation only: consumes recorded turns and delivered metadata; never advances rules.
const sum=xs=>xs.reduce((a,b)=>a+b,0);
export function timedFrame(frames,durations,time,{loop=false,hold=false}={}){
 if(hold)return frames.at(-1);
 let remaining=Math.max(0,time);
 if(loop)remaining%=sum(durations);
 for(let i=0;i<frames.length;i++){if(remaining<durations[i])return frames[i];remaining-=durations[i];}
 return frames.at(-1);
}
export function turnPresentation(turn,getAsset,getMapping){
 const mapping=getMapping(turn.skillId),mapped=mapping&&getAsset(mapping.assetId);
 const effect=getAsset(mapped?mapping.assetId:'AC-FX-SLASH');
 const t=mapped?mapping.presentationTiming:null;
 const frames=t?.attackFrames||[8,9,10,11,12,13],durations=t?.attackFrameDurationsMs||[100,100,100,100,100,100];
 const approach=180,release=approach+sum(durations.slice(0,3));
 const contact=release+sum(effect.frameDurationsMs.slice(0,t?.visualContactEffectFrame??5));
 const attackEnd=approach+sum(durations),effectEnd=release+sum(effect.frameDurationsMs);
 const counterStart=Math.max(attackEnd,contact+220),counterRelease=counterStart+300,counterContact=counterRelease+165;
 const hitDuration=sum(getAsset('AC-FX-HIT').frameDurationsMs);
 const counterEnd=turn.received>0?Math.max(counterRelease+sum(getAsset('AC-FX-SLASH').frameDurationsMs),counterContact+hitDuration):0;
 const guardEnd=turn.response==='guard'?contact+sum(getAsset('AC-FX-GUARD').frameDurationsMs):0;
 return {effectId:effect.assetId,frames,durations,approach,release,contact,attackEnd,effectEnd,counterStart,counterRelease,counterContact,
  duration:Math.max(approach+(t?.presentationBeatMs||1000),attackEnd,effectEnd,turn.damage>0?contact+hitDuration:0,counterEnd,guardEnd)+100};
}
