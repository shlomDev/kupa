// Product images are matched by barcode; chain prices remain untouched.
const imageRequests=new Map(),imageCache=new Map();
async function lookupProductImage(barcode,language='he',name=''){
 if(!/^\d{8,14}$/.test(barcode))return response('{"error":"Invalid barcode"}',400);
 const cacheKey=barcode+':'+(language==='en'?'en':'he');const cached=imageCache.get(cacheKey);if(cached&&Date.now()<cached.until)return cached.response.clone();
 if(imageRequests.has(cacheKey))return (await imageRequests.get(cacheKey)).clone();
 const pending=(async()=>{
  let reached=false,result={barcode,image:'',category:'',source:'',version:4};
  // This barcode path is published in SuperPharm's product page image metadata.
  const image='https://superpharmstorage.blob.core.windows.net/hybris/products/desktop/medium/'+barcode+'.jpg';
  try{const r=await fetch(image,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(6000)});if(r.status===404)reached=true;if(r.ok&&r.headers.get('Content-MD5')!=='hkW1kQtoiP3Bgl9Q5Qqkdw=='&&/^image\/(jpeg|png|webp)/i.test(r.headers.get('Content-Type')||'')&&Number(r.headers.get('Content-Length'))>100){reached=true;result={...result,image,source:'SuperPharm product photography'};}}catch{}
  if(!result.image)for(const [host,label] of [['world.openfoodfacts.org','Open Food Facts'],['world.openbeautyfacts.org','Open Beauty Facts']]){
   try{const r=await fetch('https://'+host+'/api/v2/product/'+barcode+'.json?fields=code,image_front_url,image_url,categories',{headers:{'User-Agent':'Kupa/3.0 (grocery-price-catalog-live.purplegnat2.chatgpt.site)'},redirect:'manual',signal:AbortSignal.timeout(6000)});if(!r.ok)continue;const d=await r.json();reached=true;if(d.status!==1||String(d.product?.code)!==barcode)continue;const candidate=d.product.image_front_url||d.product.image_url||'';let safe='';try{const u=new URL(candidate);if(u.protocol==='https:'&&!u.username&&!u.password&&['images.openfoodfacts.org','images.openbeautyfacts.org'].includes(u.hostname))safe=u.href;}catch{}result={...result,image:safe,category:'',source:label};if(result.image)break;}catch{}
  }

  if(!result.image){
   try{
    const r=await fetch('https://shop.super-pharm.co.il/search?q='+encodeURIComponent(barcode),{headers:{'Accept-Language':language==='en'?'en,he;q=0.8':'he,en;q=0.8'},redirect:'follow',signal:AbortSignal.timeout(8000)});
    if(r.ok){reached=true;const html=await r.text();const candidate=officialPageImage(html,barcode);if(candidate){const check=await fetch(candidate,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(4000)});if(check.ok&&/^image\//i.test(check.headers.get('Content-Type')||'')&&check.headers.get('Content-MD5')!=='hkW1kQtoiP3Bgl9Q5Qqkdw==')result={...result,image:candidate,source:language==='en'?'SuperPharm product page':'סופר־פארם · תמונת מוצר'};}}
   }catch{}
  }
  if(!reached)return response('{"error":"Photo sources unavailable"}',503);
  const out=response(JSON.stringify(result));out.headers.set('Cache-Control',result.image?'public,max-age=604800':'public,max-age=3600');return out;
 })();imageRequests.set(cacheKey,pending);
 try{const out=await pending;if(out.ok){const data=await out.clone().json();if(imageCache.size>=2000)imageCache.delete(imageCache.keys().next().value);imageCache.set(cacheKey,{until:Date.now()+(data.image?604800000:3600000),response:out.clone()});}return out.clone();}finally{imageRequests.delete(cacheKey);}
}

function officialPageImage(html,barcode){
 const decode=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"');
 function safe(v){try{const u=new URL(decode(v));return u.protocol==='https:'&&!u.username&&!u.password&&['superpharmstorage.blob.core.windows.net','shop.super-pharm.co.il'].includes(u.hostname)?u.href:'';}catch{return '';}}
 // Validate only the main product's barcode, never a recommended product elsewhere on the page.
 const ean=html.match(/<[^>]*class=["'][^"']*description-ean[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)?.[1]?.replace(/<[^>]*>/g,'');
 if(ean&&new RegExp('(?:^|\\D)'+barcode+'(?:\\D|$)').test(ean)){
  for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){if(!/property=["']og:image["']/i.test(tag))continue;const u=safe(tag.match(/content=["']([^"']+)["']/i)?.[1]);if(u)return u;}
 }
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{const d=JSON.parse(m[1]);for(const p of Array.isArray(d)?d:d['@graph']||[d]){if(p['@type']!=='Product'||![p.gtin,p.gtin8,p.gtin12,p.gtin13,p.gtin14].some(v=>String(v)===barcode))continue;const values=Array.isArray(p.image)?p.image:[p.image];for(const v of values){const u=safe(typeof v==='string'?v:v?.url);if(u)return u;}}}catch{}
 return '';
}
