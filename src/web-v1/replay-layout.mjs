import {battleResources} from './battle-ui.mjs';
import {esc} from './experience.mjs';

// Reserve the largest recorded text at the current width before playback starts.
// The temporary, hidden grid is measured once per width/font change, never per frame.
export function reserveReplayLayout(root,battle){
 const panel=root.querySelector('.battle-resources'),caption=root.querySelector('.battle-caption');
 const resources=new Set(),captions=new Set([caption.textContent,'연출을 생략했습니다. 기록된 결과와 보상은 같습니다.','기록된 결과: 동반 사망 · PixelFX는 연출만 재생합니다.']);
 for(const turn of battle.turns){
  if(battle.resources){
   for(const side of ['player','opponent']){
    const action=turn[side];if(!action)continue;
    for(const phase of ['ready','attack','hit','finished'])resources.add(battleResources(battle,{round:turn.round,side,action,phase,values:turn.before,finished:phase==='finished'}));
    const who=side==='player'?'나':battle.enemy;
    for(const suffix of ['발동 준비','공격 중',action.damage+' 피해'])captions.add(`${turn.round}합 · ${who} ${action.skill} · 내공 ${action.qiBefore} → ${action.qiBefore} · ${suffix} · 반복 공격 짧게 재생`);
   }
  }else captions.add(`${turn.round}합 · ${turn.skill} 발동 · ${turn.damage} 피해 / ${turn.received} 피격`);
 }
 let signature='';
 function measure(){
  const font=getComputedStyle(caption),width=caption.getBoundingClientRect().width,key=[width,font.fontSize,font.lineHeight].join('/');
  if(key===signature||!width)return;signature=key;
  const probe=document.createElement('div');probe.className='replay-size-probe';probe.setAttribute('aria-hidden','true');probe.inert=true;probe.style.width=width+'px';
  const sizes=[...(panel?[[panel,'battle-resources',resources]]:[]),[caption,'battle-caption',[...captions].map(esc)]];
  probe.innerHTML=sizes.map(([,cls,values])=>`<div class="replay-size-stack">${[...values].map(html=>`<div class="${cls}">${html}</div>`).join('')}</div>`).join('');
  root.append(probe);
  sizes.forEach(([node],i)=>node.style.minHeight=Math.ceil(probe.children[i].getBoundingClientRect().height)+'px');
  probe.remove();
 }
 measure();const observer=new ResizeObserver(measure);observer.observe(root);
 return ()=>observer.disconnect();
}
