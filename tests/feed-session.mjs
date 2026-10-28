import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
let posts=0,listings=0;
const source=fs.readFileSync('worker/feeds.mjs','utf8');
const context={Map,Set,Date,RegExp,URL,URLSearchParams,Response,Request,TextDecoder,Uint8Array,Blob,DecompressionStream,AbortSignal,setTimeout,branchDirectory:{chains:{}},cityDirectory:{},fetch:async(url,opts={})=>{
 const path=new URL(url).pathname;
 if(path==='/login')return new Response('<meta name="csrftoken" content="before"><form action="/login/user"><input name="r" value=""><input name="username"><input type="password" name="password"></form>',{headers:{'set-cookie':'test=initial; Path=/'}});
 if(path==='/login/user'){posts++;const f=new URLSearchParams(opts.body);assert.equal(f.get('username'),'RamiLevi');assert.equal(f.get('password'),'');assert.equal(f.get('csrftoken'),'before');assert(opts.headers.Cookie.includes('test=initial'));return new Response(null,{status:302,headers:{location:'/file','set-cookie':'test=authenticated; Path=/'}});}
 if(path==='/file')return new Response('<meta content="after" name="csrftoken"><form action="/account/change-password"><input type="password"></form>');
 if(path==='/file/json/dir'){listings++;const f=new URLSearchParams(opts.body);assert.equal(opts.method,'POST');assert.equal(f.get('csrftoken'),'after');assert.equal(f.get('sSearch'),'PriceFull');assert(opts.headers.Cookie.includes('test=authenticated'));return Response.json({aaData:[{DT_RowId:'PriceFull7290058140886-024-202610280010.gz',fname:'PriceFull7290058140886-024-202610280010.gz'}],iTotalRecords:1});}
 throw Error('Unexpected test URL '+url);
}};
vm.createContext(context);vm.runInContext(source+'\nglobalThis.testAPI={portalSession,portalFiles,loginPage,decodeXmlBytes};',context);
assert.equal(context.testAPI.loginPage('<form action="/account/change-password"><input type="password"></form>'),false);
assert.equal(context.testAPI.loginPage('<form action="/login/user">'),true);
const files=await context.testAPI.portalFiles('RamiLevi','PriceFull');assert.equal(files.length,1);await context.testAPI.portalFiles('RamiLevi','PriceFull');assert.equal(posts,1);assert.equal(listings,1);
const utf16=Buffer.concat([Buffer.from([255,254]),Buffer.from('<Root>שלום</Root>','utf16le')]);assert.equal(context.testAPI.decodeXmlBytes(utf16),'<Root>שלום</Root>');
console.log('Public session cookies, redirect, rotated CSRF, POST file list, unrelated password fields, cache and UTF-16 XML passed.');
