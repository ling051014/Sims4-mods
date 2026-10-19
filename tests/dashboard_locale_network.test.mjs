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

test('Access toast links remain clickable without enabling clicks on ordinary toasts',()=>{
  const css=fs.readFileSync(new URL('admin.css',folder),'utf8');
  const js=fs.readFileSync(new URL('admin.js',folder),'utf8');
  assert.match(css,/\.admin-only \.toast\.show\[data-kind="auth"\]\s*\{pointer-events:auto\}/);
  assert.match(js,/retry\.href='\/feedback\/admin\.html'/);
  assert.match(js,/logout\.href='\/cdn-cgi\/access\/logout'/);
  assert.doesNotMatch(css,/\.admin-only \.toast\.show\s*\{pointer-events:auto\}/);
});

test('dashboard time service handles Taipei midnight and calendar boundaries',()=>{
  const time=load('admin-time.js').L1nGAdminTime;
  assert.equal(time.timeZone,'Asia/Taipei');
  assert.equal(time.today(new Date('2026-10-19T15:59:59Z')),'2026-10-19');
  assert.equal(time.today(new Date('2026-10-19T16:00:00Z')),'2026-10-20');
  assert.equal(time.today(new Date('2025-12-31T16:00:00Z')),'2026-01-01');
  assert.equal(time.daysBefore('2026-03-01',1),'2026-02-28');
  assert.equal(time.daysBefore('2024-03-01',1),'2024-02-29');
  assert.equal(time.daysBefore('2026-01-01',29),'2025-12-03');
  assert.throws(()=>time.daysBefore('2026-02-30',1),/無效的日期/);
  assert.match(time.timestamp('2026-10-19T16:00:00.000Z'),/UTC\+8/);
  assert.match(time.clock(new Date('2026-10-19T16:00:00Z')),/UTC\+8/);
});
test('admin and GA4 views use shared Taipei time service',()=>{
  const admin=fs.readFileSync(new URL('admin.js',folder),'utf8');
  const ga4=fs.readFileSync(new URL('ga4-dashboard.js',folder),'utf8');
  const html=fs.readFileSync(new URL('admin.html',folder),'utf8');
  assert.match(admin,/const dateText = window\.L1nGAdminTime\.timestamp/);
  assert.match(admin,/window\.L1nGAdminTime\.clock\(\)/);
  assert.match(ga4,/const \{today,daysBefore\}=window\.L1nGAdminTime/);
  assert.match(ga4,/window\.L1nGAdminTime\.timestamp\(new Date\(\)\)/);
  assert.doesNotMatch(ga4,/getFullYear\(\)|getMonth\(\)|getDate\(\)/);
  assert.ok(html.indexOf('admin-time.js?')<html.indexOf('admin.js?'));
  assert.ok(html.indexOf('admin-time.js?')<html.indexOf('ga4-dashboard.js?'));
});
