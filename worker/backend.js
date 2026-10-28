
const allowed=new Set(['prices.super-pharm.co.il']);
function response(body,status=200,type='application/json'){return new Response(body,{status,headers:{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(request.method!=='GET')return response('{"error":"Method not allowed"}',405);
 if(url.pathname==='/')return response(page,200,'text/html; charset=utf-8');
 if(url.pathname==='/city'){
  const found=cityRecord(url.searchParams.get('q')||'');return response(JSON.stringify(found?{city:found.he}:{city:''}));
 }
 if(url.pathname==='/branches'){
  try{const store=url.searchParams.get('store');const lat=url.searchParams.has('lat')?Number(url.searchParams.get('lat')):NaN,lng=url.searchParams.has('lng')?Number(url.searchParams.get('lng')):NaN;
   if((Number.isFinite(lat)||Number.isFinite(lng))&&(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180))return response('{"error":"Invalid location coordinates"}',400);
   const data=await nearbyBranches(store,lat,lng,url.searchParams.get('city')||'');const cached=directoryCache.get('official:'+store);if(ctx.waitUntil&&(!cached||Date.now()-cached.t>864e5))ctx.waitUntil(refreshDirectory(store).catch(()=>{}));return response(JSON.stringify(data));
  }catch(e){return response(JSON.stringify({error:e.message,code:e.code||'directory_unavailable'}),503);}
 }
 if(url.pathname==='/branch-catalog'){
  try{const store=url.searchParams.get('store'),id=url.searchParams.get('branch')||'',type=url.searchParams.get('type');if(!FEED_CHAINS[store])return response('{"error":"Unknown chain"}',400);return store==='superpharm'?await superpharmCatalog(id,type):await chainCatalog(store,id,type);
  }catch(e){return response(JSON.stringify({error:e.message,code:e.code||'catalog_unavailable'}),503);}
 }
 if(url.pathname==='/ping')return response('{"ok":true,"hosted":true}');
 if(url.pathname==='/verified-catalog')return response(verified);
 if(url.pathname==='/proxy'||url.pathname==='/geocode'){
  try{
   const target=new URL(url.searchParams.get('url'));
   const geo=url.pathname==='/geocode';
   if(target.protocol!=='https:'||target.username||target.password||target.port||!(geo?target.hostname==='nominatim.openstreetmap.org'&&['/search','/reverse'].includes(target.pathname):allowed.has(target.hostname)))return response('{"error":"Unsupported source"}',400);
   const upstream=await fetch(target.href,{headers:{'User-Agent':'GroceryPriceCatalog/1.0 (official catalog browser)','Accept':geo?'application/json':'*/*'},redirect:'manual',signal:AbortSignal.timeout(45000)});
   if(!upstream.ok)return response(JSON.stringify({error:'Official source returned HTTP '+upstream.status+'. Try again later or open the verified catalog.'}),502);
   if(!geo&&upstream.headers.get('Content-Type')?.includes('text/html')){
     const html=await upstream.text();
     const challenged=/window\.rbzns|winsocks\(\)|kramericaindustries|verify you are human|checking your browser/i.test(html);
     if(challenged)return response(JSON.stringify({code:'source_verification_required',error:'SuperPharm requires browser verification for this hosted connection. Fresh branch catalogs are currently unavailable. You can browse the verified catalog from 25 October 2026 below.'}),503);
     if(!/<table[\s>]/i.test(html))return response(JSON.stringify({code:'invalid_catalog_index',error:'SuperPharm returned a page without its price catalog table. Open the dated verified catalog below.'}),502);
     return response(html,200,'text/html; charset=utf-8');
   }
   return new Response(upstream.body,{headers:{'Content-Type':upstream.headers.get('Content-Type')||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch(e){return response(JSON.stringify({error:'Source connection failed. Try again or open the verified catalog.'}),502);}
 }
 return response('{"error":"Not found"}',404);
}};