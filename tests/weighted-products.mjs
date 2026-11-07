import assert from 'node:assert/strict';import fs from 'node:fs';import {normalizeCatalog,weightedPriceInfo} from '../src/catalog.mjs';
// Official Rami Levi branch 024 PriceFull dated 2026-11-08, downloaded for verification.
const raw=JSON.parse(fs.readFileSync('tests/fixtures/weighted-items.json','utf8'));
const products=normalizeCatalog({Items:{Item:raw}}).products;
const salmon=products.find(p=>p.name.includes('סלמון'));assert(salmon);assert.equal(salmon.isWeighted,true);const w=weightedPriceInfo(salmon);assert.equal(w.priceUnit,'לק״ג');assert.equal(w.per100g,11.99);
const packaged=normalizeCatalog({Items:{Item:[{ItemCode:'111',ItemName:'Fish 500 grams',ItemPrice:20,Quantity:500,UnitQty:'גרם',bIsWeighted:'0'},{ItemCode:'222',ItemName:'Lip balm',ItemPrice:18.9,Quantity:10,UnitQty:'גרם'}]}}).products;
for(const p of packaged){assert.equal(weightedPriceInfo(p).isWeighted,false);assert.equal(weightedPriceInfo(p).per100g,null)}
assert.equal(weightedPriceInfo({...salmon,unit:'יחידות',raw:{}}).per100g,null);
assert.equal(weightedPriceInfo(salmon,'en').priceUnit,'per kg');
console.log('Real weighted salmon: per-kg and per-100g prices; packed fish, cosmetics, missing weighted flags and unknown units remain unconverted.');
