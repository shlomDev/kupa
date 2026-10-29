import assert from 'node:assert/strict';
import {catalogImage,normalizeCatalog} from '../src/catalog.mjs';
import app from '../worker/index.js';
for(const item of [{image_url:'https://img.example/a.jpg'},{images:[{url:'https://img.example/a.jpg'}]},{ProductImage:{contentUrl:'https://img.example/a.jpg'}}])assert.equal(catalogImage(item),'https://img.example/a.jpg');
assert.equal(catalogImage({images:[{url:'javascript:alert(1)'}]}),'');assert.equal(catalogImage({url:'https://unrelated.example/'}),'');
const p=normalizeCatalog({products:[{barcode:'12345678',name:'Test',price:1,images:[{url:'https://img.example/a.jpg'}]}]});assert.equal(p.products[0].image,'https://img.example/a.jpg');
const original=globalThis.fetch;let calls=[];
try{
 globalThis.fetch=async(u,options)=>{calls.push([String(u),options?.method]);return new Response(null,{headers:{'Content-Type':'image/jpeg','Content-Length':'63624','Content-MD5':'real-photo'}})};
 const r=await app.fetch(new Request('https://test/metadata?barcode=7290019444343'),{},{});assert.equal(r.status,200);const d=await r.json();assert(d.image.endsWith('/7290019444343.jpg'));assert.equal(calls.length,1);assert.equal(calls[0][1],'HEAD');
 globalThis.fetch=async u=>String(u).includes('blob.core')?new Response(null,{status:404}):new Response(JSON.stringify({status:1,product:{code:'WRONG',image_front_url:'https://images.openfoodfacts.org/wrong.jpg'}}));
 const wrong=await(await app.fetch(new Request('https://test/metadata?barcode=12345678'),{},{})).json();assert.equal(wrong.image,'');
 globalThis.fetch=async u=>String(u).includes('blob.core')?new Response(null,{headers:{'Content-Type':'image/jpeg','Content-Length':'4388','Content-MD5':'hkW1kQtoiP3Bgl9Q5Qqkdw=='}}):new Response(JSON.stringify({status:0}));
 const placeholder=await(await app.fetch(new Request('https://test/metadata?barcode=0000000000000'),{},{})).json();assert.equal(placeholder.image,'');
 assert.equal((await app.fetch(new Request('https://test/metadata?barcode=bad'),{},{})).status,400);
}finally{globalThis.fetch=original}
console.log('Nested catalog images, safe URLs, verified barcode CDN images, placeholder rejection and wrong barcode rejection passed.');
