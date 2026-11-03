import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {shopperProductInfo} from '../src/catalog.mjs';
const page=fs.readFileSync('src/page.html','utf8');const p={barcode:'729001',name:'Product title',brand:'Brand',quantity:'150',unit:'ml',price:20,unitPrice:0.13};const offer={name:'Buy two for 30',barcodes:[p.barcode],discountedPrice:null,minQty:'2'};
const c=vm.createContext({lang:'en',shopperProductInfo,document:{createElement:()=>({querySelector:()=>({})})},catalog:{products:[p],promotions:[]},favorites:new Set(),favoriteKey:p=>p.barcode,esc:s=>String(s??''),tr:(he,en)=>en,money:n=>'ILS '+n,imageMarkup:()=>'<img>',metadata:{},photoKey:b=>b,promoStatus:()=>'',save:()=>{},render:()=>{}});
vm.runInContext(page.slice(page.indexOf('function offerDetails'),page.indexOf('function render()')),c);c.p=p;c.offer=offer;
const normal=vm.runInContext('productCard(p)',c);const promo=vm.runInContext('offerCard({...offer,product:p})',c);
for(const card of [normal,promo]){assert(card.innerHTML.includes('<h3 class="title">Product title</h3>'));assert(card.innerHTML.includes('class="heart"'));assert(card.innerHTML.includes('<summary>Product details</summary>'));assert(card.innerHTML.includes('class="price">ILS 20'));}
assert(promo.innerHTML.includes('Regular price · see offer details'));assert(promo.innerHTML.includes('Buy two for 30'));assert(!normal.innerHTML.includes('Buy two for 30'));
c.offer={...offer,discountedPrice:15};assert(vm.runInContext('offerCard({...offer,product:p})',c).innerHTML.includes('class="price">ILS 15'));
assert(vm.runInContext('offerCard({...offer,product:undefined,discountedPrice:null})',c).innerHTML.includes('class="price">—'));
console.log('Shared regular/promotion card structure, product titles, favorites, offer terms and honest price labels passed.');
