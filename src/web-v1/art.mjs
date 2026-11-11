// Consumes delivered PNG/JSON/SVG only. Does not import or execute PixelFX source.
const assets=new Map();let status={revision:null,ready:false,errors:[]};
const presentations=new Map();
export const artAsset=id=>assets.get(id);
export const skillPresentation=id=>presentations.get(id);
export const artStatus=()=>structuredClone(status);
export async function loadArt(){
 try{
  const response=await fetch(new URL('./assets/art/art-manifest.json',import.meta.url));if(!response.ok)throw Error('아트 manifest를 읽을 수 없습니다.');
  const manifest=await response.json();if(manifest.schemaVersion!==1||!Array.isArray(manifest.assets))throw Error('아트 manifest 형식 오류');
  status.revision=manifest.deliveryRevision;
  await Promise.all(manifest.assets.map(a=>new Promise(resolve=>{
   if(!a.file||/\.\.|:|\\|^\//.test(a.file)){status.errors.push(a.assetId+': 경로 오류');resolve();return;}
   const image=new Image();const source=new URL('./assets/art/'+a.file,import.meta.url).href;
   image.onload=()=>{if(a.format.startsWith('png')&&(image.naturalWidth!==a.width||image.naturalHeight!==a.height))status.errors.push(a.assetId+': 크기 불일치');else assets.set(a.assetId,{...a,image,source});resolve();};
   image.onerror=()=>{status.errors.push(a.assetId+': 이미지 읽기 실패');resolve();};image.src=source;
  })));
  status.ready=['AC-CHR-PLAYER','AC-CHR-HUMAN','AC-BG-ROAD','AC-BG-COURTYARD','AC-FX-SLASH','AC-FX-HIT','AC-FX-GUARD'].every(id=>assets.has(id));
  try{
   const response=await fetch(new URL('./assets/art/skill-vfx-map.v001.json',import.meta.url));
   if(!response.ok)throw Error('무공 효과 매핑을 읽을 수 없습니다.');
   const map=await response.json();
   if(map.schemaVersion!==1||!Array.isArray(map.mappings))throw Error('무공 효과 매핑 형식 오류');
   for(const entry of map.mappings){
    const t=entry.presentationTiming;
    if(typeof entry.skillId!=='string'||typeof entry.assetId!=='string'||!entry.presentationOnly||!t||t.attackFrames?.length!==6||t.attackFrameDurationsMs?.length!==6||!t.attackFrameDurationsMs.every(x=>Number.isFinite(x)&&x>0)||!Number.isInteger(t.visualContactEffectFrame)||t.visualContactEffectFrame<0)throw Error('무공 효과 타이밍 오류');
    presentations.set(entry.skillId,entry);
   }
  }catch(e){presentations.clear();status.errors.push(e.message);}
 }catch(e){status.errors.push(e.message);}
 return artStatus();
}
