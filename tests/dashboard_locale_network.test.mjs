import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const folder=new URL('../L1nG/feedback/',import.meta.url);
function load(file,host='home.by-l1ng.com',fetcher=()=>{throw Error('unexpected fetch')}) {
  const window={location:{hostname:host,origin:'https://'+host}};
  const context={window,fetch:fetcher,URL,Intl,AbortController,setTimeout,clearTimeout,navigator:{onLine:true}};
  vm.runInNewContext(fs.readFileSync(new URL(file,folder),'utf8'),context,{filename:file});
  return window;
}
const response=(data,status=200)=>({
  status,ok:status>=200&&status<300,redirected:false,
  url:'https://home.by-l1ng.com/feedback/admin-api/feedback',
  headers:{get:()=> 'application/json; charset=utf-8'},
  json:async()=>data
});
test('countries are Traditional Chinese and unknown labels remain intact',()=>{
  const window=load('ga4-country-labels.js');
  for(const [raw,want] of Object.entries({
    Ireland:'愛爾蘭',Taiwan:'臺灣',Japan:'日本',Germany:'德國',
    'South Korea':'南韓','United States':'美國','Czech Republic':'捷克',
    '(not set)':'未設定',Atlantis:'Atlantis'
  }))assert.equal(window.L1nGGa4Countries.label(raw),want,raw);
});
test('read-only GET retries one transient network failure',async()=>{
  let calls=0;
  const window=load('admin-network.js','home.by-l1ng.com',async()=>{
    if(++calls===1)throw new TypeError('Failed to fetch');
    return response({ok:true,items:[]});
  });
  const result=await window.L1nGAdminNetwork.requestJSON('/feedback/admin-api/feedback');
  assert.equal(result.ok,true);
  assert.equal(calls,2);
});
test('mutations are never retried',async()=>{
  let calls=0;
  const window=load('admin-network.js','home.by-l1ng.com',async()=>{calls++;throw new TypeError('offline')});
  await assert.rejects(window.L1nGAdminNetwork.requestJSON('/feedback/admin-api/feedback',{
    method:'POST',body:'{}'}),/連線未完成/);
  assert.equal(calls,1);
});
test('access rejection never retries',async()=>{
  let calls=0;
  const window=load('admin-network.js','home.by-l1ng.com',async()=>{
    calls++;return response({ok:false,error:'FORBIDDEN'},403);
  });
  await assert.rejects(window.L1nGAdminNetwork.requestJSON('/feedback/ga4-api'),/驗證/);
  assert.equal(calls,1);
});
test('preview environment does not contact private production APIs',async()=>{
  let calls=0;
  const window=load('admin-network.js','raw.githack.com',async()=>{calls++;return response({ok:true})});
  await assert.rejects(window.L1nGAdminNetwork.requestJSON('/feedback/admin-api/feedback'),/預覽模式/);
  assert.equal(calls,0);
});

test('Access AJAX request uses same-origin cookies and XMLHttpRequest header',async()=>{
  let options;
  const window=load('admin-network.js','home.by-l1ng.com',async(_url,init)=>{
    options=init;
    return response({ok:true,items:[]});
  });
  await window.L1nGAdminNetwork.requestJSON('/feedback/admin-api/feedback');
  assert.equal(options.credentials,'same-origin');
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers['X-Requested-With'],'XMLHttpRequest');
});
test('Access login redirect is treated as authentication, not as failed network',async()=>{
  let calls=0;
  const window=load('admin-network.js','home.by-l1ng.com',async()=>{
    calls++;
    return {type:'opaqueredirect',status:0,url:'',headers:{get:()=>null}};
  });
  await assert.rejects(window.L1nGAdminNetwork.requestJSON('/feedback/admin-api/feedback'),
    error=>error.kind==='auth');
  assert.equal(calls,1);
});
test('unauthorized Access response does not retry',async()=>{
  let calls=0;
  const window=load('admin-network.js','home.by-l1ng.com',async()=>{
    calls++;
    return response({ok:false,error:'UNAUTHORIZED'},401);
  });
  await assert.rejects(window.L1nGAdminNetwork.requestJSON('/feedback/admin-api/feedback'),
    error=>error.kind==='auth');
  assert.equal(calls,1);
});
