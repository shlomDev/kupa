// Only product photography is read here. Branch prices never come from shop pages.
const imageRequests=new Map(),imageCache=new Map(),photoCooldown=new Map();
const photoHosts=['superpharmstorage.blob.core.windows.net','shop.super-pharm.co.il','img.rami-levy.co.il','www.rami-levy.co.il','rami-levy.co.il','osherad.co.il','www.osherad.co.il','images.openfoodfacts.org','images.openbeautyfacts.org'];
function safePhotoUrl(value,base){if(typeof value!=='string'||!value.trim())return '';try{const u=new URL(String(value||'').replace(/&amp;/g,'&'),base);return u.protocol==='https:'&&!u.username&&!u.password&&photoHosts.includes(u.hostname)&&!/(?:placeholder|no[-_]?image|camera_icon|default[-_]?product)/i.test(u.pathname)?u.href:'';}catch{return '';}}
async function photoFetch(url,options={}){const host=new URL(url).hostname;if((photoCooldown.get(host)||0)>Date.now())throw Error('Photo provider temporarily unavailable');const r=await fetch(url,{...options,signal:AbortSignal.timeout(options.timeout||6000)});if([403,429].includes(r.status))photoCooldown.set(host,Date.now()+300000);return r;}
async function verifyPhoto(candidate,excluded){const image=safePhotoUrl(candidate);if(!image||excluded.has(image))return '';try{const r=await photoFetch(image,{method:'HEAD',redirect:'manual'});if(!r.ok||!/^image\/(jpeg|png|webp|avif)/i.test(r.headers.get('Content-Type')||'')||r.headers.get('Content-MD5')==='hkW1kQtoiP3Bgl9Q5Qqkdw==')return '';const size=r.headers.get('Content-Length');return size!==null&&Number(size)<100?'':image;}catch{return '';}}
function officialPageImage(html,barcode,base='https://shop.super-pharm.co.il'){
 // Only the main product barcode or an exact Product record can supply its photo.
 const ean=html.match(/<[^>]*class=["'][^"']*description-ean[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)?.[1]?.replace(/<[^>]*>/g,'');
 if(ean&&new RegExp('(?:^|\\D)'+barcode+'(?:\\D|$)').test(ean))for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){if(!/property=["']og:image["']/i.test(tag))continue;const u=safePhotoUrl(tag.match(/content=["']([^"']+)["']/i)?.[1],base);if(u)return u;}
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{const d=JSON.parse(m[1]);for(const p of Array.isArray(d)?d:d['@graph']||[d]){if(!(Array.isArray(p['@type'])?p['@type'].includes('Product'):p['@type']==='Product')||![p.gtin,p.gtin8,p.gtin12,p.gtin13,p.gtin14,p.barcode].some(v=>String(v)===barcode))continue;for(const v of Array.isArray(p.image)?p.image:[p.image]){const u=safePhotoUrl(typeof v==='string'?v:v?.url||v?.contentUrl,base);if(u)return u;}}}catch{}
 return '';
}
async function storeProductPhoto(store,barcode,language,excluded){
 const headers={'Accept-Language':language==='en'?'en,he;q=0.8':'he,en;q=0.8'};
 if(store==='RamiLevi'){
  // These barcode paths are returned in Rami Levi's own catalog images object.
  const direct=await verifyPhoto('https://img.rami-levy.co.il/product/'+barcode+'/large.jpg',excluded);if(direct)return {image:direct,source:'Rami Levi product photography'};
  try{const r=await photoFetch('https://www.rami-levy.co.il/api/catalog',{method:'POST',headers:{...headers,'Content-Type':'application/json',locale:language==='en'?'en':'he'},body:JSON.stringify({q:barcode,aggs:0}),redirect:'manual'});if(!r.ok)return null;const data=await r.json();const p=(Array.isArray(data.data)?data.data:[]).find(p=>String(p.barcode)===barcode);if(p){for(const value of [p.images?.original,p.images?.large,p.images?.small]){const image=await verifyPhoto(safePhotoUrl(value,'https://img.rami-levy.co.il'),excluded);if(image)return {image,source:'Rami Levi product catalog'};}}
   const url='https://www.rami-levy.co.il/'+(language==='en'?'en':'he')+'/online/market/product/?item='+barcode;const page=await photoFetch(url,{headers,redirect:'follow'});if(page.ok){const image=await verifyPhoto(officialPageImage(await page.text(),barcode,url),excluded);if(image)return {image,source:'Rami Levi product page'};}
  }catch{}return null;
 }
 if(store==='osherad'){
  try{const url='https://osherad.co.il/?s='+barcode;const r=await photoFetch(url,{headers,redirect:'follow'});if(!r.ok)return null;const html=await r.text();let image=await verifyPhoto(officialPageImage(html,barcode,url),excluded);if(image)return {image,source:'Osher Ad product page'};
   // Follow only official search-result links containing this exact barcode.
   const links=[...html.matchAll(/href=["']([^"']+)["']/gi)].map(m=>{try{return new URL(m[1].replace(/&amp;/g,'&'),url)}catch{return null}}).filter(u=>u&&['osherad.co.il','www.osherad.co.il'].includes(u.hostname)&&u.href.includes(barcode)&&u.searchParams.get('s')!==barcode);
   for(const u of links.slice(0,2)){const p=await photoFetch(u.href,{headers,redirect:'follow'});if([403,429].includes(p.status))break;if(!p.ok)continue;image=await verifyPhoto(officialPageImage(await p.text(),barcode,u.href),excluded);if(image)return {image,source:'Osher Ad product page'};}
  }catch{}return null;
 }
 if(store==='superpharm'){
  const direct=await verifyPhoto('https://superpharmstorage.blob.core.windows.net/hybris/products/desktop/medium/'+barcode+'.jpg',excluded);if(direct)return {image:direct,source:'SuperPharm product photography'};
  try{const url='https://shop.super-pharm.co.il/search?q='+barcode;const r=await photoFetch(url,{headers,redirect:'follow',timeout:8000});if(r.ok){const image=await verifyPhoto(officialPageImage(await r.text(),barcode,url),excluded);if(image)return {image,source:language==='en'?'SuperPharm product page':'סופר־פארם · תמונת מוצר'};}}catch{}return null;
 }
 return null;
}
async function lookupProductImage(barcode,language='he',name='',store='superpharm',exclude=''){
 if(!/^\d{1,14}$/.test(barcode))return response('{"error":"Invalid barcode"}',400);
 if(!['superpharm','RamiLevi','osherad'].includes(store))return response('{"error":"Invalid store"}',400);
 const excluded=new Set(String(exclude).slice(0,4000).split('\n').filter(Boolean).slice(0,5));const cacheKey=store+':'+barcode+':'+(language==='en'?'en':'he')+':'+[...excluded].join('|');const cached=imageCache.get(cacheKey);if(cached&&Date.now()<cached.until)return cached.response.clone();if(imageRequests.has(cacheKey))return(await imageRequests.get(cacheKey)).clone();
 const pending=(async()=>{
  let result={barcode,store,image:'',category:'',source:'',version:5};const deadline=Date.now()+35000;
  // Selected store first; exact-barcode photographs from another retailer are fallback only.
  for(const chain of [store,...(barcode.length>=8?['superpharm','RamiLevi'].filter(s=>s!==store):[])]){if(Date.now()>deadline)break;const found=await storeProductPhoto(chain,barcode,language,excluded);if(found){result={...result,...found};break;}}
  if(!result.image&&barcode.length>=8)for(const [host,label] of [['world.openfoodfacts.org','Open Food Facts'],['world.openbeautyfacts.org','Open Beauty Facts']])try{if(Date.now()>deadline)break;const r=await photoFetch('https://'+host+'/api/v2/product/'+barcode+'.json?fields=code,image_front_url,image_url',{headers:{'User-Agent':'Kupa/5.0 (grocery-price-catalog-live.purplegnat2.chatgpt.site)','Accept-Language':language==='en'?'en':'he'},redirect:'manual'});if(!r.ok)continue;const d=await r.json();if(d.status!==1||String(d.product?.code)!==barcode)continue;const image=await verifyPhoto(d.product.image_front_url||d.product.image_url,excluded);if(image){result={...result,image,source:label};break;}}catch{}
  const out=response(JSON.stringify(result));out.headers.set('Cache-Control',result.image?'public,max-age=604800':'public,max-age=900');return out;
 })();imageRequests.set(cacheKey,pending);
 try{const out=await pending;const d=await out.clone().json();if(imageCache.size>=2000)imageCache.delete(imageCache.keys().next().value);imageCache.set(cacheKey,{until:Date.now()+(d.image?604800000:900000),response:out.clone()});return out.clone();}finally{imageRequests.delete(cacheKey);}
}
