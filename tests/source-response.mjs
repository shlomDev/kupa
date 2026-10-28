import assert from 'node:assert/strict';
import app from '../worker/index.js';
const realFetch=globalThis.fetch;
const req=()=>new Request('https://app.test/proxy?url='+encodeURIComponent('https://prices.super-pharm.co.il/'));
try{
 globalThis.fetch=async()=>new Response('<html><script>window.rbzns={};winsocks();</script></html>',{headers:{'Content-Type':'text/html'}});
 const blocked=await app.fetch(req(),{},{});assert.equal(blocked.status,503);assert.equal((await blocked.json()).code,'source_verification_required');
 globalThis.fetch=async()=>new Response('<table><tr><td>catalog</td></tr></table>',{headers:{'Content-Type':'text/html'}});
 const valid=await app.fetch(req(),{},{});assert.equal(valid.status,200);assert((await valid.text()).includes('catalog'));
 globalThis.fetch=async()=>new Response('<html>Unexpected response</html>',{headers:{'Content-Type':'text/html'}});
 assert.equal((await app.fetch(req(),{},{})).status,502);
 const page=await (await app.fetch(new Request('https://app.test/'),{},{})).text();new Function(page.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]);assert(!page.includes('(login OK)'));assert(page.includes('Import PriceFull / PromoFull'));assert(page.includes('SuperPharm requires verification')); 
 console.log('Challenge rejection, valid index passthrough, malformed index rejection, recovery UI and JS syntax passed.');
}finally{globalThis.fetch=realFetch}
