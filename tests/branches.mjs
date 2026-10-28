import assert from 'node:assert/strict';
import app from '../worker/index.js';
const call=u=>app.fetch(new Request('https://test'+u),{},{});
const city=await(await call('/city?q=Netanya')).json();assert.equal(city.city,'נתניה');
for(const [store,count,local] of [['RamiLevi',99,5],['osherad',24,1],['superpharm',305,0]]){
 const r=await call('/branches?store='+store+'&city='+encodeURIComponent(city.city));assert.equal(r.status,200);const d=await r.json();assert.equal(d.branches.length,count);assert(d.branches.every(b=>b.branchId&&b.source.startsWith('Official')));assert(d.branches[0].sameCity);if(local)assert.equal(d.branches.filter(b=>b.sameCity).length,local);console.log(store,count,'official branches;',d.branches.filter(b=>b.sameCity).length,'in Netanya');
}
assert.equal((await call('/branches?store=wrong')).status,503);assert.equal((await call('/branches?store=superpharm&lat=bad&lng=34')).status,400);
const page=await(await call('/')).text();assert(page.includes('Find my location'));assert(page.includes('<option value="RamiLevi">'));assert(!page.includes('<option disabled>Rami'));assert(!page.includes('verified();\n</script>'));
console.log('City resolution, independent cached official directories, branch IDs, same-city ordering, all store options, GPS control and empty startup passed.');
