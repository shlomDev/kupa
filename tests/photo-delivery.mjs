import assert from 'node:assert/strict';import app from '../worker/index.js';
const original=globalThis.fetch;try{
 let calls=[];globalThis.fetch=async u=>{calls.push(String(u));return String(u).endsWith('/old.jpg')?new Response(null,{status:302,headers:{Location:'https://img.rami-levy.co.il/product/123/new.jpg'}}):new Response(new Uint8Array(200),{headers:{'Content-Type':'image/jpeg'}})};
 const request=u=>new Request('https://app.test/photo?url='+encodeURIComponent(u));
 const r=await app.fetch(request('https://img.rami-levy.co.il/product/123/old.jpg'),{},{});assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'image/jpeg');assert.equal((await r.arrayBuffer()).byteLength,200);assert.equal(calls.length,2);
 calls=[];assert.equal((await app.fetch(request('https://evil.example/image.jpg'),{},{})).status,404);assert.equal(calls.length,0);
 globalThis.fetch=async()=>new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}});assert.equal((await app.fetch(request('https://img.rami-levy.co.il/product/123/old.jpg'),{},{})).status,404);
 globalThis.fetch=async()=>new Response('<html>verification</html>',{headers:{'Content-Type':'text/html'}});assert.equal((await app.fetch(request('https://img.rami-levy.co.il/product/123/old.jpg'),{},{})).status,404);
}finally{globalThis.fetch=original}
console.log('Photo delivery streams real images, follows only approved redirects, rejects unsupported hosts and rejects HTML.');
