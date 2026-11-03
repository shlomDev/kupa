import assert from 'node:assert/strict';import {shopperProductInfo,normalizeCatalog} from '../src/catalog.mjs';
const p=normalizeCatalog({Items:{Item:[{ItemCode:'123',ItemName:'Deodorant',ItemPrice:'19.80',ManufactureName:'לא ידוע',Quantity:'70.00',UnitQty:'מיליליטר',UnitOfMeasure:'100 מיליליטר',UnitOfMeasurePrice:'.28'}]}}).products[0];
const d=shopperProductInfo(p);assert.equal(d.manufacturer,'');assert.equal(d.contents,'70 מ״ל');assert.equal(d.comparisonBasis,'100 מ״ל');assert(Math.abs(d.comparisonPrice-28.285714)<.00001);
assert.equal(shopperProductInfo({...p,brand:'Gillette'}).manufacturer,'Gillette');
assert.equal(shopperProductInfo({...p,quantity:'0'}).comparisonPrice,null);
assert.equal(shopperProductInfo({...p,unit:'unknown'}).contents,'');
assert.equal(shopperProductInfo({...p,quantity:'1',unit:'ק״ג',price:10}).comparisonPrice,1);
assert.equal(shopperProductInfo({...p,quantity:'1',unit:'ליטר',price:10},'en').contents,'1 l');
console.log('Clear contents labels, hidden unknown manufacturer, comparison-unit separation and 100g/100ml calculation passed.');
