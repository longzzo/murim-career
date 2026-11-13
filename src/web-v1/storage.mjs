import {newGame,transition,validateState,migrateSave} from './engine.mjs';
export const DB_NAME='murim-web-v1';
const ORIGINAL_SAVE='original-save-1';
export class SaveStore {
 constructor(name=DB_NAME){this.name=name;this.db=null;this.blocked=null;this.pending=null;this.state=null;}
 async open(){
  this.db=await new Promise((resolve,reject)=>{
   const r=indexedDB.open(this.name,2);
   let migrationError,blocked=false;
   r.onupgradeneeded=event=>{
    if(blocked){r.transaction.abort();return;}
    if(event.oldVersion===0){r.result.createObjectStore('state');return;}
    const tx=r.transaction,store=tx.objectStore('state'),current=store.get('current');
    current.onsuccess=()=>{
     if(!current.result)return;
     try{
      const migrated=migrateSave(current.result);
      if(migrated!==current.result){
       store.add(current.result,ORIGINAL_SAVE);
       store.put(migrated,'current');
      }
     }catch(error){migrationError=error;tx.abort();}
    };
   };
   r.onsuccess=()=>{if(blocked)r.result.close();else resolve(r.result);};
   r.onerror=()=>reject(migrationError||r.error);
   r.onblocked=()=>{blocked=true;reject(Error('다른 탭의 저장 연결을 닫은 뒤 다시 열어 주세요.'));};
  });
  this.db.onversionchange=()=>{this.db.close();this.blocked=Error('저장 버전이 변경되어 연결을 종료했습니다.');};
  return this.read();
 }
 async read(){
  const state=await new Promise((resolve,reject)=>{const tx=this.db.transaction('state','readonly');const r=tx.objectStore('state').get('current');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});
  if(state)validateState(state);this.state=state;return state;
 }
 async initialize(options){
  if(this.blocked)throw this.blocked;
  return this.write(null,{type:'initialize',id:crypto.randomUUID(),options});
 }
 async dispatch(command){
  if(this.blocked)throw this.blocked;
  if(this.pending)throw Error('저장 재시도가 먼저 필요합니다.');
  return this.write(this.state?.revision??null,command);
 }
 async retry(){if(!this.pending)throw Error('재시도할 저장이 없습니다.');const p=this.pending;return this.write(p.revision,p.command);}
 async write(expected,command){
  let next;
  try{
   await new Promise((resolve,reject)=>{
    const tx=this.db.transaction('state','readwrite');const store=tx.objectStore('state');let reason;
    const request=store.get('current');
    request.onsuccess=()=>{try{
     const current=request.result||null;
     if(current?.commands.includes(command.id)){next=current;return;}
     if((current?.revision??null)!==expected){const err=Error('다른 탭에서 진행했습니다. 최신 상태를 불러와야 합니다.');err.code='STALE';throw err;}
     next=command.type==='initialize'?newGame(command.options):transition(current,command);
     store.put(next,'current');
    }catch(error){reason=error;tx.abort();}};
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(reason||tx.error||Error('저장이 중단되었습니다.'));tx.onerror=()=>{};
   });
   this.state=next;this.pending=null;return next;
  }catch(error){
   if(error.code==='STALE'){this.blocked=error;this.pending=null;}
   else this.pending={revision:expected,command};
   throw error;
  }
 }
 close(){this.db?.close();}
}
