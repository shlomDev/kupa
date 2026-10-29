import assert from 'node:assert/strict';
import {createCatalogRefresh,REFRESH_INTERVAL} from '../src/refresh.mjs';
assert.equal(REFRESH_INTERVAL,1800000);
let clock=0,key=null,calls=[],scheduled;
const refresh=createCatalogRefresh({selection:()=>key,now:()=>clock,setTimer:(fn,delay)=>{scheduled={fn,delay};return 1},clearTimer:()=>{},refresh:async kind=>{calls.push([key,kind]);if(kind==='price')throw Error('price source unavailable')}});
await refresh.run();assert.equal(calls.length,0);key='chain:branchA';await refresh.run(true);assert.deepEqual(calls,[['chain:branchA','price'],['chain:branchA','promo']]);assert.equal(scheduled.delay,REFRESH_INTERVAL);
clock=REFRESH_INTERVAL-1;await refresh.run();assert.equal(calls.length,2);clock++;await refresh.run();assert.equal(calls.length,4);
// Resume after a suspended/hidden tab: both feeds are checked immediately.
clock+=REFRESH_INTERVAL*3;await refresh.run();assert.equal(calls.length,6);
key='chain:branchB';await refresh.run();assert.deepEqual(calls.slice(-2),[['chain:branchB','price'],['chain:branchB','promo']]);
let release;calls=[];key='A';const race=createCatalogRefresh({selection:()=>key,setTimer:()=>1,clearTimer:()=>{},refresh:async kind=>{calls.push([key,kind]);if(kind==='price')await new Promise(r=>release=r)}});const pending=race.run(true);key=null;release();await pending;assert.deepEqual(calls,[['A','price']]);
console.log('30-minute price + promo refresh, failed-source isolation, resume catch-up, branch switching and cancelled selections passed.');
