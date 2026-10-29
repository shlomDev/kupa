// Product images are matched by barcode; chain prices remain untouched.
const imageRequests=new Map(),imageCache=new Map();
async function lookupProductImage(barcode){
 if(!/^\d{8,14}$/.test(barcode))return response('{"error":"Invalid barcode"}',400);
 const cached=imageCache.get(barcode);if(cached&&Date.now()<cached.until)return cached.response.clone();
 if(imageRequests.has(barcode))return (await imageRequests.get(barcode)).clone();
 const pending=(async()=>{
  let reached=false,result={barcode,image:'',category:'',source:'',version:3};
  // This barcode path is published in SuperPharm's product page image metadata.
  const image='https://superpharmstorage.blob.core.windows.net/hybris/products/desktop/medium/'+barcode+'.jpg';
  try{const r=await fetch(image,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(6000)});if(r.status===404)reached=true;if(r.ok&&r.headers.get('Content-MD5')!=='hkW1kQtoiP3Bgl9Q5Qqkdw=='&&/^image\/(jpeg|png|webp)/i.test(r.headers.get('Content-Type')||'')&&Number(r.headers.get('Content-Length'))>100){reached=true;result={...result,image,source:'SuperPharm product photography'};}}catch{}
  if(!result.image)for(const [host,label] of [['world.openfoodfacts.org','Open Food Facts'],['world.openbeautyfacts.org','Open Beauty Facts']]){
   try{const r=await fetch('https://'+host+'/api/v2/product/'+barcode+'.json?fields=code,image_front_url,image_url,categories',{headers:{'User-Agent':'Kupa/3.0 (grocery-price-catalog-live.purplegnat2.chatgpt.site)'},redirect:'manual',signal:AbortSignal.timeout(6000)});if(!r.ok)continue;const d=await r.json();reached=true;if(d.status!==1||String(d.product?.code)!==barcode)continue;const candidate=d.product.image_front_url||d.product.image_url||'';let safe='';try{const u=new URL(candidate);if(u.protocol==='https:'&&!u.username&&!u.password&&['images.openfoodfacts.org','images.openbeautyfacts.org'].includes(u.hostname))safe=u.href;}catch{}result={...result,image:safe,category:'',source:label};if(result.image)break;}catch{}
  }
  if(!reached)return response('{"error":"Photo sources unavailable"}',503);
  const out=response(JSON.stringify(result));out.headers.set('Cache-Control',result.image?'public,max-age=604800':'public,max-age=3600');return out;
 })();imageRequests.set(barcode,pending);
 try{const out=await pending;if(out.ok){const data=await out.clone().json();if(imageCache.size>=2000)imageCache.delete(imageCache.keys().next().value);imageCache.set(barcode,{until:Date.now()+(data.image?604800000:3600000),response:out.clone()});}return out.clone();}finally{imageRequests.delete(barcode);}
}
