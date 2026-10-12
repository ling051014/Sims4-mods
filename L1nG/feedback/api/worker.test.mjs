// 使用 Node.js 22+：node --test L1nG/feedback/api/worker.test.mjs
// 無需 Cloudflare 金鑰；所有請求都在本機模擬，不能觸碰正式資料。
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

const workerUrl='https://l1ng-feedback-api.example.workers.dev';
const origin='https://realdate.by-l1ng.com';
const dummyDB={prepare(){throw new Error('未授權請求不可查詢資料庫');}};
const call=(path,{method='GET',headers={},body=null,env={DB:dummyDB}}={})=>
  worker.fetch(new Request(workerUrl+path,{method,headers,body}),env);

test('health 不公開敏感資訊',async()=>{
  const res=await call('/health',{env:{}});
  const json=await res.json();
  assert.equal(res.status,200);
  assert.deepEqual(Object.keys(json).sort(),['ok','service']);
});
test('無綁定 D1 時明確拒絕提交',async()=>{
  const res=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},env:{}});
  assert.equal(res.status,503);
  assert.equal((await res.json()).ok,false);
});
test('拒絕白名單以外的來源',async()=>{
  const res=await call('/v1/feedback',{method:'OPTIONS',headers:{Origin:'https://attacker.example'}});
  assert.equal(res.status,403);
  assert.equal(res.headers.get('access-control-allow-origin'),null);
});
test('只允許白名單來源進行公開預檢',async()=>{
  const res=await call('/v1/feedback',{method:'OPTIONS',headers:{Origin:origin}});
  assert.equal(res.status,204);
  assert.equal(res.headers.get('access-control-allow-origin'),origin);
});
test('管理端未配置 Access 時預設拒絕',async()=>{
  const res=await call('/v1/admin/feedback',{headers:{Origin:'https://home.by-l1ng.com'}});
  assert.equal(res.status,403);
  assert.equal((await res.json()).ok,false);
});
test('管理預檢不允許陌生網域',async()=>{
  const res=await call('/v1/admin/feedback',{method:'OPTIONS',headers:{Origin:'https://attacker.example'}});
  assert.equal(res.status,403);
});
test('管理端只允許明列來源通過預檢',async()=>{
  const res=await call('/v1/admin/feedback',{method:'OPTIONS',headers:{Origin:'https://home.by-l1ng.com'}});
  assert.equal(res.status,204);
  assert.equal(res.headers.get('access-control-allow-credentials'),'true');
});
test('格式錯誤或未驗證的回饋不會寫入資料庫',async()=>{
  const form=new FormData();
  form.set('source','RealDate');form.set('category','bug');
  form.set('message','太短');
  const res=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:form});
  assert.equal(res.status,400);
});
test('無 Turnstile Secret 時不能讓回饋通過',async()=>{
  const form=new FormData();
  form.set('source','RealDate');form.set('category','bug');
  form.set('target','mod');form.set('followUp','once');
  form.set('message','測試回饋必須至少十個中文字元才符合規定');
  form.set('turnstileToken','fake-token');
  const res=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:form});
  assert.equal(res.status,503);
});
