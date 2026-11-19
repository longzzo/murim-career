// Ephemeral reading positions only. Nothing here is part of a saved life.
export function viewportState(root){
 const positions=new Map();let current=null,restored=false,keyboard=false;
 document.addEventListener('pointerdown',()=>{keyboard=false;},true);
 document.addEventListener('keydown',()=>{keyboard=true;},true);
 const elements=()=>[...root.querySelectorAll('[data-ui],[data-focus],h2,h3,summary')];
 const identity=el=>(el.closest('[data-life]')?.dataset.life??'')+'/'+(el.dataset.ui?JSON.stringify([el.dataset.ui,el.dataset.id,el.dataset.target]):el.dataset.focus?'focus:'+el.dataset.focus:el.tagName+':'+el.textContent);
 const details=()=>{const counts=new Map();return [...root.querySelectorAll('details')].map(el=>{const id=identity(el.querySelector('summary')),index=counts.get(id)??0;counts.set(id,index+1);return {el,id,index};});};
 function capture(){
  const nodes=elements(),anchor=nodes.find(el=>{const r=el.getBoundingClientRect();return r.height&&r.top>=0&&r.top<innerHeight;});
  return {y:scrollY,anchor:anchor?{id:identity(anchor),index:nodes.filter(el=>identity(el)===identity(anchor)).indexOf(anchor),top:anchor.getBoundingClientRect().top}:null,
   details:details().map(({el,id,index})=>({id,index,open:el.open}))};
 }
 return {
  begin(key){
   if(current)positions.set(current,capture());
   const position=positions.get(key);current=key;restored=!!position;
   if(positions.size>60)positions.delete(positions.keys().next().value);
   return ()=>{
    if(!position)return;
    for(const {el,id,index} of details()){const entry=position.details.find(saved=>saved.id===id&&saved.index===index);if(entry)el.open=entry.open;}
    const anchor=position.anchor&&elements().filter(el=>identity(el)===position.anchor.id)[position.anchor.index];
    const y=anchor?scrollY+anchor.getBoundingClientRect().top-position.anchor.top:position.y;
    scrollTo({top:y,behavior:'instant'});
   };
  },
  focus(selector='h2',{reveal=false}={}){
   const target=root.querySelector(selector)??root.querySelector('h2');
   const next=target?.disabled?root.querySelector('h2'):target;
   if(next?.matches('h2,h3'))next.tabIndex=-1;
   next?.focus({preventScroll:true});
   // One deliberate navigation, never a second scroll caused by focus().
   if(next){
    const r=next.getBoundingClientRect(),visible=r.top>=0&&r.bottom<=innerHeight;
    if((!restored||reveal||keyboard)&&!visible)next.scrollIntoView({block:restored&&!reveal?'nearest':'start',behavior:'instant'});
   }
  }
 };
}
