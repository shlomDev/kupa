import fs from 'node:fs';
let parser=fs.readFileSync('src/catalog.mjs','utf8').replace(/^export /gm,'');
const html=fs.readFileSync('src/page.html','utf8').replace('/*CATALOG_PARSER*/',parser);
let backend=fs.readFileSync('worker/backend.js','utf8');
const feeds=fs.readFileSync('worker/feeds.mjs','utf8');
const metadata=`
 if(url.pathname==='/metadata'){
   const barcode=url.searchParams.get('barcode')||'';
   if(!/^\\d{8,14}$/.test(barcode))return response('{"error":"Invalid barcode"}',400);
   const cacheKey=new Request('https://metadata.local/'+barcode);
   if(globalThis.caches){const hit=await caches.default.match(cacheKey);if(hit)return hit;}
   let responded=false;let result={image:'',category:'',source:'Open Food Facts / Open Beauty Facts',barcode};
   for(const [host,label] of [['world.openfoodfacts.org','Open Food Facts'],['world.openbeautyfacts.org','Open Beauty Facts']]){
     try{
       const r=await fetch('https://'+host+'/api/v2/product/'+barcode+'.json?fields=code,image_front_url,categories',{headers:{'User-Agent':'GroceryCatalog/2.0 (https://grocery-price-catalog-live.purplegnat2.chatgpt.site)'},signal:AbortSignal.timeout(8000),redirect:'manual'});
       if(!r.ok)continue;
       const d=await r.json();responded=true;if(d.status!==1||String(d.product?.code)!==barcode)continue;
       const image=d.product.image_front_url||'';let safe='';try{const u=new URL(image);if(u.protocol==='https:'&&['images.openfoodfacts.org','images.openbeautyfacts.org'].includes(u.hostname))safe=u.href;}catch{}
       result={image:safe,category:String(d.product.categories||'').split(',')[0].trim(),source:label,barcode};if(result.image||result.category)break;
     }catch{}
   }
   if(!responded)return response('{"error":"Photo providers are unavailable. No product match was verified."}',503);
   const out=response(JSON.stringify(result));out.headers.set('Cache-Control','public,max-age=86400');if(globalThis.caches&&ctx.waitUntil)ctx.waitUntil(caches.default.put(cacheKey,out.clone()));return out;
 }
`;
backend=backend.replace(" if(url.pathname==='/ping')",metadata+" if(url.pathname==='/ping')");
const bootstrap='const branchDirectory='+fs.readFileSync('data/branch-directory.json','utf8')+';\nconst cityDirectory='+fs.readFileSync('data/cities.json','utf8')+';\n'+feeds+'\n';
const worker=bootstrap+'const page='+JSON.stringify(html)+';\nconst verified='+JSON.stringify(fs.readFileSync('data/verified.json','utf8'))+';\n'+backend;
fs.mkdirSync('worker',{recursive:true});fs.writeFileSync('worker/index.js',worker);
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});fs.writeFileSync('dist/server/index.js',worker);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built inline HTML, catalog parser, verified official data and Worker routes.');
