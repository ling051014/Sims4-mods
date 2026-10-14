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
test('舊 workers.dev 管理預檢路由一律拒絕',async()=>{
  const res=await call('/v1/admin/feedback',{method:'OPTIONS',headers:{Origin:'https://home.by-l1ng.com'}});
  assert.equal(res.status,403);
  assert.equal(res.headers.get('access-control-allow-origin'),null);
});
test('格式錯誤或未驗證的回饋不會寫入資料庫',async()=>{
  const form=new FormData();
  form.set('source','RealDate');form.set('category','bug');
  form.set('message','太短');
  const res=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:form});
  assert.equal(res.status,400);
});
test('RealDate 模組錯誤回饋缺少遊戲版本時仍須拒絕',async()=>{
  const form=new FormData();
  form.set('source','RealDate');form.set('category','bug');
  form.set('target','mod');form.set('followUp','once');
  form.set('message','這是一則超過十字但缺少遊戲版本的測試回饋');
  form.set('turnstileToken','fake-token');
  const res=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:form});
  assert.equal(res.status,400);
  assert.match((await res.json()).error,/遊戲版本/);
});
test('無 Turnstile Secret 時不能讓回饋通過',async()=>{
  const form=new FormData();
  form.set('source','RealDate');form.set('category','bug');
  form.set('target','mod');form.set('followUp','once');
  form.set('message','測試回饋必須至少十個中文字元才符合規定');
  form.set('gameVersion','1.128.90.1030');
  form.set('turnstileToken','fake-token');
  const res=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:form});
  assert.equal(res.status,503);
});

test('有效的 Turnstile 仍須通過 D1 頻率限制才可寫入',async()=>{
  const original=globalThis.fetch;
  let stored=0,limitUsed=0;
  globalThis.fetch=async()=>Response.json({success:true,hostname:'realdate.by-l1ng.com'});
  const db={
    prepare(sql){
      return {
        bind(...values){
          return {
            async first(){
              if(sql.includes('INSERT INTO request_limits')){
                limitUsed++;
                return limitUsed<=6?{used:limitUsed}:null;
              }
              throw new Error('Unexpected SQL in first: '+sql);
            }
          };
        }
      };
    },
    async batch(){stored++;}
  };
  try{
    const form=()=>{const data=new FormData();data.set('source','RealDate');data.set('category','bug');data.set('target','mod');data.set('followUp','once');data.set('message','測試有效回饋至少十字');data.set('gameVersion','1.128.90.1030');data.set('turnstileToken','valid-token');return data;};
    const env={DB:db,TURNSTILE_SECRET_KEY:'unit-test-secret'};
    for(let i=0;i<6;i++){
      const response=await call('/v1/feedback',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'203.0.113.5'},body:form(),env});
      assert.equal(response.status,201);
      assert.equal((await response.json()).ok,true);
    }
    const blocked=await call('/v1/feedback',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'203.0.113.5'},body:form(),env});
    assert.equal(blocked.status,429);
    assert.equal(stored,6);
  }finally{globalThis.fetch=original;}
});
test('沒有可信來源位址時拒絕建立回饋',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({success:true,hostname:'realdate.by-l1ng.com'});
  try{
    const data=new FormData();data.set('source','RealDate');data.set('category','bug');data.set('target','mod');data.set('message','有效回饋至少十個字以上');data.set('followUp','once');data.set('gameVersion','1.128.90.1030');data.set('turnstileToken','token');
    const response=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:data,env:{DB:dummyDB,TURNSTILE_SECRET_KEY:'secret'}});
    assert.equal(response.status,503);
  }finally{globalThis.fetch=original;}
});
test('驗證核發網域和提交網站不一致時拒絕',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({success:true,hostname:'genealogy-tool.by-l1ng.com'});
  try{
    const data=new FormData();data.set('source','RealDate');data.set('category','bug');data.set('target','mod');data.set('message','有效回饋至少十個字以上');data.set('followUp','once');data.set('gameVersion','1.128.90.1030');data.set('turnstileToken','token');
    const response=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:data,env:{DB:dummyDB,TURNSTILE_SECRET_KEY:'secret'}});
    assert.equal(response.status,403);
  }finally{globalThis.fetch=original;}
});

test('不得從 RealDate 網域冒充 Genealogy 來源',async()=>{
  const data=new FormData();
  data.set('source','Genealogy');data.set('category','bug');
  data.set('target','web');data.set('followUp','once');
  data.set('message','這是一則有效的測試用回饋訊息');
  const response=await call('/v1/feedback',{method:'POST',headers:{Origin:origin},body:data});
  assert.equal(response.status,403);
});

test('正式族譜工具可通過 Origin 預檢，舊錯誤網域必須拒絕',async()=>{
 const correct=await call('/v1/feedback',{method:'OPTIONS',headers:{Origin:'https://genealogy-tool.by-l1ng.com'}});
 assert.equal(correct.status,204);
 assert.equal(correct.headers.get('access-control-allow-origin'),'https://genealogy-tool.by-l1ng.com');
 const outdated=await call('/v1/feedback',{method:'OPTIONS',headers:{Origin:'https://genealogy.by-l1ng.com'}});
 assert.equal(outdated.status,403);
});
test('族譜回饋前端只在真正的正式網域啟用',async()=>{
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const code=readFileSync(new URL('../feedback-core.js',import.meta.url),'utf8');
 const frontend=host=>{
   const window={location:{hostname:host}};
   runInNewContext(code,{window});
   return window.L1nGFeedbackCore.isLive();
 };
 assert.equal(frontend('genealogy-tool.by-l1ng.com'),true);
 assert.equal(frontend('genealogy.by-l1ng.com'),false);
 assert.equal(frontend('realdate.by-l1ng.com'),true);
 assert.equal(frontend('genealogy-tool.pages.dev'),false);
});

test('直連 workers.dev 管理路徑即使有認證標頭仍拒絕',async()=>{
 const response=await call('/v1/admin/feedback',{headers:{'Cf-Access-Jwt-Assertion':'untrusted'}});
 assert.equal(response.status,403);
});
test('同網域管理路由在缺少 Access 驗證時拒絕',async()=>{
 const response=await worker.fetch(new Request('https://home.by-l1ng.com/feedback/admin-api/feedback'),{DB:dummyDB});
 assert.equal(response.status,403);
});
