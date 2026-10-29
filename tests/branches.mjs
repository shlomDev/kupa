import assert from 'node:assert/strict';
import app from '../worker/index.js';
const call=u=>app.fetch(new Request('https://test'+u),{},{});
const city=await(await call('/city?q=Netanya')).json();assert.equal(city.city,'נתניה');
for(const [store,count,local] of [['RamiLevi',5,5],['osherad',1,1],['superpharm',8,8]]){
 const r=await call('/branches?store='+store+'&city='+encodeURIComponent(city.city));assert.equal(r.status,200);const d=await r.json();assert.equal(d.branches.length,count);assert(d.branches.every(b=>b.branchId&&b.source.startsWith('Official')));assert(d.branches.every(b=>b.sameCity&&b.city==='נתניה')); if(local)assert.equal(d.branches.filter(b=>b.sameCity).length,local);console.log(store,count,'official branches;',d.branches.filter(b=>b.sameCity).length,'in Netanya');
}
assert.equal((await call('/branches?store=wrong')).status,503);assert.equal((await call('/branches?store=superpharm&lat=bad&lng=34')).status,400);
assert.equal((await(await call('/branches?store=RamiLevi&city=NoSuchCity')).json()).branches.length,0);
const page=await(await call('/')).text();assert(page.includes('findLocation'));assert(page.includes('cardsView'));assert(page.includes('listView'));assert(!page.includes('id="importBtn"'));assert(!page.includes('id="catalogText"'));assert(!page.includes('Other branches'));assert(page.includes("if(branch){focusResults();catalogRefresh.run(true)}"));
console.log('Strict city-only filtering, unknown-city empty results, automatic product loading, card/list views and shopper-only controls passed.');
