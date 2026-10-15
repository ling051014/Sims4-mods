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


// 以下流程僅使用記憶體 D1 / R2 與假的 Turnstile 回應，不接觸正式服務。
function offlineFeedbackHarness(){
  const feedback=new Map(),replies=[],attachments=[],r2=new Map(),buckets=new Map();
  const DB={
    prepare(sql){
      return {bind(...values){
        return {
          async first(){
            if(sql.startsWith('INSERT INTO request_limits')){
              const n=buckets.get(values[0])||0;
              if(n>=values[2])return null;
              buckets.set(values[0],n+1);
              return {used:n+1};
            }
            if(sql.startsWith("SELECT * FROM feedback WHERE id=? AND follow_up='conversation'")){
              const row=feedback.get(values[0]);
              return row?.follow_up==='conversation'?row:null;
            }
            if(sql.startsWith('SELECT * FROM feedback WHERE id=?'))return feedback.get(values[0])||null;
            if(sql.startsWith('SELECT count(*) AS n FROM replies')){
              return {n:replies.filter(x=>x.feedback_id===values[0]&&x.author==='player').length};
            }
            throw new Error('Unexpected offline first SQL: '+sql);
          },
          async all(){
            if(sql.startsWith('SELECT id,author,body,created_at FROM replies')){
              return {results:replies.filter(x=>x.feedback_id===values[0])
                .map(({id,author,body,created_at})=>({id,author,body,created_at}))};
            }
            if(sql.startsWith('SELECT id,reply_id,name,content_type,size FROM attachments')){
              return {results:attachments.filter(x=>x.feedback_id===values[0])
                .map(({id,reply_id,name,content_type,size})=>({id,reply_id,name,content_type,size}))};
            }
            throw new Error('Unexpected offline all SQL: '+sql);
          },
          async run(){
            if(sql.startsWith('INSERT INTO feedback (')){
              const [id,source,category,target,message,follow_up,receipt_hash,contact_method,contact_value,version,game_version,status,created_at,updated_at]=values;
              feedback.set(id,{id,source,category,target,message,follow_up,receipt_hash,contact_method,contact_value,version,game_version,status,created_at,updated_at});
              return;
            }
            if(sql.startsWith('INSERT INTO replies (')){
              const [id,feedback_id,author,body,created_at]=values;
              replies.push({id,feedback_id,author,body,created_at});
              return;
            }
            if(sql.startsWith('INSERT INTO attachments (')){
              const [id,feedback_id,reply_id,r2_key,name,content_type,size,created_at]=values;
              attachments.push({id,feedback_id,reply_id,r2_key,name,content_type,size,created_at});
              return;
            }
            if(sql.startsWith("UPDATE feedback SET status='progress'")){
              const row=feedback.get(values[1]);
              if(!row)throw new Error('Missing offline feedback');
              row.status='progress';
              row.updated_at=values[0];
              return;
            }
            throw new Error('Unexpected offline run SQL: '+sql);
          }
        };
      }};
    },
    async batch(statements){for(const stmt of statements)await stmt.run();}
  };
  const ATTACHMENTS={
    async put(key,stream,options){r2.set(key,{bytes:await new Response(stream).arrayBuffer(),type:options.httpMetadata.contentType});},
    async get(key){const x=r2.get(key);return x?{body:x.bytes}:null;},
    async delete(key){r2.delete(key);}
  };
  return {env:{DB,ATTACHMENTS,TURNSTILE_SECRET_KEY:'offline-only-secret'},feedback,replies,attachments,r2};
}
const offlineHeaders={'Origin':origin,'CF-Connecting-IP':'203.0.113.50'};
function offlineFeedbackForm(followUp='conversation'){
  const form=new FormData();
  form.set('source','RealDate');form.set('category','bug');form.set('target','mod');
  form.set('followUp',followUp);form.set('message','模擬資料：確認日期切換後依然正常顯示');
  form.set('version','v0.5 Beta');form.set('gameVersion','1.128.90.1030');
  form.set('turnstileToken','offline-token');
  return form;
}
test('離線完整流程：通過驗證後提交、取得私人憑證、查詢與玩家回覆',async()=>{
  const harness=offlineFeedbackHarness();
  const original=globalThis.fetch;
  globalThis.fetch=async url=>{
    assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    return Response.json({success:true,hostname:'realdate.by-l1ng.com'});
  };
  try{
    const created=await call('/v1/feedback',{method:'POST',headers:offlineHeaders,body:offlineFeedbackForm(),env:harness.env});
    assert.equal(created.status,201);
    const item=await created.json();
    assert.match(item.receipt,/^LNG-[A-Z0-9]{12}:[A-Za-z0-9_-]{40,60}$/);
    assert.equal(harness.feedback.size,1);
    assert.equal(harness.feedback.get(item.id).game_version,'1.128.90.1030');
    const lookup=receipt=>call('/v1/feedback/lookup',{
      method:'POST',headers:{...offlineHeaders,'Content-Type':'application/json'},
      body:JSON.stringify({receipt}),env:harness.env
    });
    const first=await lookup(item.receipt);
    assert.equal(first.status,200);
    assert.equal((await first.json()).feedback.status,'pending');
    const invalid=await lookup(item.receipt.slice(0,-2)+'xy');
    assert.equal(invalid.status,404);
    const reply=new FormData();
    reply.set('receipt',item.receipt);reply.set('message','玩家追問：測試匿名回覆可否正常保存');
    reply.set('turnstileToken','offline-token');
    const posted=await call('/v1/feedback/reply',{method:'POST',headers:offlineHeaders,body:reply,env:harness.env});
    assert.equal(posted.status,200);
    const second=await lookup(item.receipt);
    assert.equal(second.status,200);
    const data=(await second.json()).feedback;
    assert.equal(data.status,'progress');
    assert.equal(data.messages.length,1);
    assert.equal(data.messages[0].author,'player');
    assert.equal(data.messages[0].body,'玩家追問：測試匿名回覆可否正常保存');
  }finally{globalThis.fetch=original;}
});
test('離線附件流程：保存日誌、查詢中列出附件，拒絕偽裝格式及超額附件',async()=>{
  const harness=offlineFeedbackHarness();
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({success:true,hostname:'realdate.by-l1ng.com'});
  try{
    const form=offlineFeedbackForm();
    form.append('files',new File(['mock RealDate log\n'],'RealDate_Test_Log.txt',{type:'text/plain'}));
    const created=await call('/v1/feedback',{method:'POST',headers:offlineHeaders,body:form,env:harness.env});
    assert.equal(created.status,201);
    const {receipt,id}=await created.json();
    assert.equal(harness.attachments.length,1);
    assert.equal(harness.r2.size,1);
    assert.equal(harness.attachments[0].feedback_id,id);
    assert.equal(harness.attachments[0].name,'RealDate_Test_Log.txt');
    assert.equal(harness.r2.get(harness.attachments[0].r2_key).type,'text/plain');
    const lookup=await call('/v1/feedback/lookup',{
      method:'POST',headers:{...offlineHeaders,'Content-Type':'application/json'},
      body:JSON.stringify({receipt}),env:harness.env
    });
    assert.equal(lookup.status,200);
    const result=(await lookup.json()).feedback;
    assert.equal(result.attachments.length,1);
    assert.equal(result.attachments[0].name,'RealDate_Test_Log.txt');
    assert.equal(result.attachments[0].replyId,null);
    const disguised=offlineFeedbackForm();
    disguised.append('files',new File(['not-a-png'],'fake.png',{type:'image/png'}));
    const blocked=await call('/v1/feedback',{method:'POST',headers:offlineHeaders,body:disguised,env:harness.env});
    assert.equal(blocked.status,400);
    const tooMany=offlineFeedbackForm();
    for(let i=0;i<4;i++)tooMany.append('files',new File(['small'],'test'+i+'.txt',{type:'text/plain'}));
    const limited=await call('/v1/feedback',{method:'POST',headers:offlineHeaders,body:tooMany,env:harness.env});
    assert.equal(limited.status,400);
    assert.equal(harness.feedback.size,1);
    assert.equal(harness.r2.size,1);
    const noStorage=offlineFeedbackForm();
    noStorage.append('files',new File(['log'],'test.txt',{type:'text/plain'}));
    const missing=await call('/v1/feedback',{method:'POST',headers:offlineHeaders,body:noStorage,
      env:{DB:harness.env.DB,TURNSTILE_SECRET_KEY:'offline-only-secret'}});
    assert.equal(missing.status,503);
    assert.equal(harness.feedback.size,1);
  }finally{globalThis.fetch=original;}
});

test('離線回覆附件依每則 replyId 配對，原始附件保留 null',async()=>{
  const harness=offlineFeedbackHarness();
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({success:true,hostname:'realdate.by-l1ng.com'});
  try{
    const form=offlineFeedbackForm();
    form.append('files',new File(['initial log'],'initial.txt',{type:'text/plain'}));
    const created=await call('/v1/feedback',{method:'POST',headers:offlineHeaders,body:form,env:harness.env});
    assert.equal(created.status,201);
    const {receipt}=await created.json();
    const reply=(body,name)=>{
      const next=new FormData();
      next.set('receipt',receipt);
      next.set('message',body);
      next.set('turnstileToken','offline-token');
      next.append('files',new File(['follow-up log'],name,{type:'text/plain'}));
      return next;
    };
    for(const [body,name] of [['玩家第一次追問','first.txt'],['玩家第二次追問','second.txt']]){
      const response=await call('/v1/feedback/reply',{method:'POST',headers:offlineHeaders,body:reply(body,name),env:harness.env});
      assert.equal(response.status,200);
    }
    const lookup=await call('/v1/feedback/lookup',{
      method:'POST',headers:{...offlineHeaders,'Content-Type':'application/json'},
      body:JSON.stringify({receipt}),env:harness.env
    });
    assert.equal(lookup.status,200);
    const item=(await lookup.json()).feedback;
    assert.equal(item.messages.length,2);
    assert.equal(item.attachments.length,3);
    assert.deepEqual(item.attachments.map(a=>[a.name,a.replyId]),[
      ['initial.txt',null],['first.txt',item.messages[0].id],['second.txt',item.messages[1].id]
    ]);
    assert.notEqual(item.messages[0].id,item.messages[1].id);
  }finally{globalThis.fetch=original;}
});
