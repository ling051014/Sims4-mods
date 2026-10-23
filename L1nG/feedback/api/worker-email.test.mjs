// 全程離線：模擬 Resend、Cloudflare Access、Turnstile、D1，絕不寄真信。
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from './worker.js';

const endpoint='https://l1ng-feedback-api.zpl74520.workers.dev';
const sites={RealDate:'https://realdate.by-l1ng.com',Genealogy:'https://genealogy-tool.by-l1ng.com'};
const b64=x=>Buffer.from(x).toString('base64url');
const request=(path,options={},env,ctx)=>worker.fetch(new Request(endpoint+path,options),env,ctx);
const post=(path,body,env,origin=sites.RealDate)=>request(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)},env);
const check=async(res,status)=>{assert.equal(res.status,status);return res.json();};

function harness({key=true,failSend=false}={}){
 const feedback=new Map(),notifications=new Map(),replies=[],delivery=new Map(),sent=[],jobs=[];
 const DB={
   prepare(sql){
     return {bind(...a){
       return {
         async first(){
           if(sql.startsWith('INSERT INTO request_limits'))return {used:1};
           if(sql.startsWith('SELECT * FROM feedback WHERE id=? AND follow_up=')){
             const r=feedback.get(a[0]);return r?.follow_up==='conversation'?r:null;
           }
           if(sql.startsWith('SELECT * FROM feedback WHERE id=?'))return feedback.get(a[0])||null;
           if(sql.startsWith('SELECT * FROM email_notifications WHERE feedback_id=? AND unsubscribe_hash=?')){
             const r=notifications.get(a[0]);return r?.unsubscribe_hash===a[1]?r:null;
           }
           if(sql.startsWith('SELECT * FROM email_notifications WHERE feedback_id=? AND state=')){
             const r=notifications.get(a[0]);return r?.state==='verified'?r:null;
           }
           if(sql.includes('FROM email_notifications WHERE feedback_id=?'))return notifications.get(a[0])||null;
           if(sql.startsWith('INSERT OR IGNORE INTO email_delivery')){
             if(delivery.has(a[0]))return null;
             delivery.set(a[0],{reply_id:a[0],feedback_id:a[1],status:a[2],updated_at:a[3]});
             return {reply_id:a[0]};
           }
           if(sql.startsWith('SELECT count(*) AS n FROM replies'))return {n:0};
           throw Error('Unexpected first SQL '+sql);
         },
         async all(){
           if(sql.startsWith('SELECT id,author,body,created_at FROM replies'))return {results:replies.filter(r=>r.feedback_id===a[0])};
           if(sql.startsWith('SELECT id,reply_id,name,content_type,size FROM attachments'))return {results:[]};
           throw Error('Unexpected all SQL '+sql);
         },
         async run(){
           if(sql.startsWith('INSERT INTO feedback (')){
             const [id,source,category,target,message,follow_up,receipt_hash,contact_method,contact_value,version,game_version,status,created_at,updated_at]=a;
             feedback.set(id,{id,source,category,target,message,follow_up,receipt_hash,contact_method,contact_value,version,game_version,status,created_at,updated_at});
           }else if(sql.startsWith('INSERT INTO email_notifications')){
             notifications.set(a[0],{feedback_id:a[0],email:a[1],language:a[2],state:'pending',verify_hash:null,verify_expires_at:null,verified_at:null,last_verification_sent_at:null,unsubscribe_hash:null});
           }else if(sql.startsWith("UPDATE email_notifications SET state='pending'")){
             const r=notifications.get(a[3]);if(r&&['pending','delivery_unavailable'].includes(r.state))Object.assign(r,{state:'pending',verify_hash:a[0],verify_expires_at:a[1],last_verification_sent_at:a[2]});
           }else if(sql.startsWith("UPDATE email_notifications SET state='delivery_unavailable'")){
             const r=notifications.get(a[0]);if(r&&r.verify_hash===a[1])Object.assign(r,{state:'delivery_unavailable',verify_hash:null,verify_expires_at:null});
           }else if(sql.startsWith("UPDATE email_notifications SET state='verified'")){
             const r=notifications.get(a[1]);if(r?.state==='pending'&&r.verify_hash===a[2])Object.assign(r,{state:'verified',verified_at:a[0],verify_hash:null,verify_expires_at:null});
           }else if(sql.startsWith('UPDATE email_notifications SET unsubscribe_hash=')){
             const r=notifications.get(a[1]);if(r)r.unsubscribe_hash=a[0];
           }else if(sql.startsWith("UPDATE email_notifications SET state='disabled'")){
             const r=notifications.get(a[0]);if(r?.unsubscribe_hash===a[1])Object.assign(r,{state:'disabled',verify_hash:null,verify_expires_at:null});
           }else if(sql.startsWith('INSERT INTO replies (')){
             replies.push({id:a[0],feedback_id:a[1],author:a[2],body:a[3],created_at:a[4]});
           }else if(sql.startsWith("UPDATE feedback SET status='progress'")){
             const r=feedback.get(a[1]);if(r){r.status='progress';r.updated_at=a[0];}
           }else if(sql.startsWith('UPDATE email_delivery SET status=')){
             const r=delivery.get(a[2]);if(r){r.status=a[0];r.updated_at=a[1];}
           }else throw Error('Unexpected run SQL '+sql);
           return {meta:{changes:1}};
         }
       };
     }};
   },
   async batch(statements){for(const s of statements)await s.run();}
 };
 const env={DB,TURNSTILE_SECRET_KEY:'offline-turnstile',...(key?{RESEND_API_KEY:'offline-resend-secret'}:{})};
 const mock=async(url,options={})=>{
   const u=String(url);
   if(u==='https://challenges.cloudflare.com/turnstile/v0/siteverify'){
     return Response.json({success:true,hostname:mock.origin||'realdate.by-l1ng.com'});
   }
   if(u==='https://api.resend.com/emails'){
     assert.equal(options.headers.Authorization,'Bearer '+env.RESEND_API_KEY);
     const data=JSON.parse(options.body);
     sent.push({data,headers:options.headers});
     return failSend?Response.json({error:'simulated'},{status:422}):Response.json({id:'offline-message-id'});
   }
   if(u==='https://offline.cloudflareaccess.com/cdn-cgi/access/certs')return Response.json({keys:mock.keys||[]});
   throw Error('Unexpected outbound request '+u);
 };
 mock.origin='realdate.by-l1ng.com';
 const ctx={waitUntil(p){jobs.push(p);}};
 return {env,feedback,notifications,replies,delivery,sent,mock,ctx,async flush(){await Promise.all(jobs.splice(0));}};
}
function form(site='RealDate',lang='zh-Hant',notify=true,followUp='conversation'){
 const f=new FormData();
 Object.entries({source:site,category:'other',target:'',message:'Offline feedback request with enough content.',followUp,version:'v0.5',gameVersion:'',contactMethod:'email',contactValue:'player@example.com',emailNotify:String(notify),language:lang,turnstileToken:'fake-test-token'}).forEach(([k,v])=>f.set(k,v));
 return f;
}
async function submit(h,site='RealDate',lang='zh-Hant',notify=true,followUp='conversation'){
 h.mock.origin=new URL(sites[site]).hostname;
 const result=await request('/v1/feedback',{method:'POST',headers:{Origin:sites[site],'CF-Connecting-IP':'192.0.2.42'},body:form(site,lang,notify,followUp)},h.env,h.ctx);
 return check(result,201);
}
const verificationUrl=sent=>sent.data.text.match(/https:\/\/\S+\/v1\/feedback\/email\/verify\?\S+/)?.[0];
const unsubscribeUrl=sent=>sent.data.text.match(/https:\/\/\S+\/v1\/feedback\/email\/unsubscribe\?\S+/)?.[0];
async function followLink(url,env,method='GET',body=null){
 const req=new Request(url,{method,body,headers:body?{'Content-Type':'application/x-www-form-urlencoded'}:{}});
 return worker.fetch(req,env);
}
async function adminAuth(h){
 const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);
 jwk.kid='offline-key';h.mock.keys=[jwk];
 h.env.ACCESS_TEAM_DOMAIN='https://offline.cloudflareaccess.com';
 h.env.ACCESS_AUD='offline-audience';h.env.ADMIN_EMAIL='admin@example.com';
 const header=b64(JSON.stringify({alg:'RS256',typ:'JWT',kid:'offline-key'}));
 const payload=b64(JSON.stringify({iss:'https://offline.cloudflareaccess.com',aud:'offline-audience',email:'admin@example.com',exp:Math.floor(Date.now()/1000)+3600}));
 const unsigned=header+'.'+payload;
 const signature=b64(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(unsigned)));
 return unsigned+'.'+signature;
}
async function adminReply(h,id,token){
 const path='https://home.by-l1ng.com/feedback/admin-api/feedback/'+id+'/replies';
 return worker.fetch(new Request(path,{method:'POST',headers:{'Cf-Access-Jwt-Assertion':token,'Content-Type':'application/json'},body:JSON.stringify({message:'Administrative response for offline test.'})}),h.env,h.ctx);
}
async function withMock(h,run){
 const before=globalThis.fetch;globalThis.fetch=h.mock;
 try{return await run();}finally{globalThis.fetch=before;}
}

test('三種語系：同意通知後寄一次驗證信，驗證不揭露私人憑證，第二次點擊不重複核發',async()=>{
 for(const [site,lang,title] of [['RealDate','zh-Hant','請驗證電子郵件'],['Genealogy','zh-Hans','请验证电子邮箱'],['Genealogy','en','Verify your email']]){
   const h=harness();
   await withMock(h,async()=>{
     const data=await submit(h,site,lang);
     assert.equal(data.emailState,'pending');
     assert.match(data.receipt,/^LNG-[A-Z0-9]{12}:/);
     assert.equal(h.sent.length,1);
     const mail=h.sent[0];
     assert.match(mail.data.subject,new RegExp(title));
     assert.equal(mail.data.to[0],'player@example.com');
     assert.equal(mail.headers['Idempotency-Key'].startsWith('verify/'),true);
     assert.equal(mail.data.html.includes(data.receipt),false);
     assert.equal(mail.data.text.includes(data.receipt),false);
     assert.equal(h.notifications.get(data.id).language,lang);
     const url=verificationUrl(mail);assert.ok(url);
     const res=await followLink(url,h.env);
     assert.equal(res.status,200);const html=await res.text();
     assert.ok(html.includes(lang==='en'?'Email verified':lang==='zh-Hans'?'电子邮箱已验证':'電子郵件已驗證'));
     assert.equal(html.includes(data.receipt),false);
     assert.equal(h.notifications.get(data.id).state,'verified');
     const status=await post('/v1/feedback/email/status',{receipt:data.receipt},h.env,sites[site]);
     assert.equal((await check(status,200)).email.state,'verified');
     const used=await followLink(url,h.env);
     assert.ok((await used.text()).includes(lang==='en'?'expired':lang==='zh-Hans'?'过期':'過期'));
   });
 }
});
test('未勾選、單次回饋：不建立通知紀錄、不寄玩家 Email',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const d=await submit(h,'RealDate','zh-Hant',false);
   assert.equal(d.emailState,null);
   assert.equal(h.sent.length,0);
   assert.equal(h.notifications.size,0);
   const one=await submit(h,'RealDate','zh-Hant',false,'once');
   assert.equal(one.receipt,null);
   assert.equal(h.sent.length,0);
   const invalid=form('RealDate','zh-Hant',true,'once');
   const res=await request('/v1/feedback',{method:'POST',headers:{Origin:sites.RealDate},body:invalid},h.env);
   assert.equal(res.status,400);
 });
});
test('寄信服務未設置或失敗：回饋保留，狀態誠實，不會假報寄送成功',async()=>{
 for(const options of [{key:false},{failSend:true}]){
   const h=harness(options);
   await withMock(h,async()=>{
     const d=await submit(h);
     assert.equal(d.emailState,'delivery_unavailable');
     assert.ok(d.receipt);
     assert.equal(h.notifications.get(d.id).state,'delivery_unavailable');
     const status=await post('/v1/feedback/email/status',{receipt:d.receipt},h.env);
     assert.equal((await check(status,200)).email.state,'delivery_unavailable');
     const bad=await post('/v1/feedback/email/resend',{receipt:d.receipt},h.env);
     assert.equal(bad.status,429);
     h.notifications.get(d.id).last_verification_sent_at='2000-01-01T00:00:00.000Z';
     const retry=await post('/v1/feedback/email/resend',{receipt:d.receipt},h.env);
     assert.equal(retry.status,503);
   });
 }
});
test('管理員回覆：只有已驗證的回饋寄通知，使用正確站點入口與取消通知',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const idToken=await adminAuth(h);
   const unverified=await submit(h,'RealDate','zh-Hant');
   await h.flush();
   let res=await adminReply(h,unverified.id,idToken);
   assert.equal(res.status,200);await h.flush();
   assert.equal(h.sent.length,1,'pending 不能寄回覆通知');
   const verified=await submit(h,'Genealogy','en');
   await followLink(verificationUrl(h.sent[1]),h.env);
   assert.equal(h.notifications.get(verified.id).state,'verified');
   res=await adminReply(h,verified.id,idToken);
   assert.equal(res.status,200);await h.flush();
   assert.equal(h.sent.length,3);
   const notice=h.sent[2];
   assert.match(notice.data.subject,/New reply/);
   assert.match(notice.data.html,/genealogy-tool\.by-l1ng\.com\/#my-feedback/);
   assert.equal(notice.data.html.includes(verified.receipt),false);
   const cancel=unsubscribeUrl(notice);assert.ok(cancel);
   // 下一則管理員回覆不得讓舊信件的取消通知連結失效。
   res=await adminReply(h,verified.id,idToken);
   assert.equal(res.status,200);await h.flush();
   assert.equal(h.sent.length,4);
   assert.equal(unsubscribeUrl(h.sent[3]),cancel);
   const confirm=await followLink(cancel,h.env);
   assert.equal(confirm.status,200);
   assert.equal(h.notifications.get(verified.id).state,'verified','GET 不應停用');
   const u=new URL(cancel);
   const result=await followLink(cancel,h.env,'POST',new URLSearchParams({id:u.searchParams.get('id'),token:u.searchParams.get('token')}));
   assert.equal(result.status,200);
   assert.equal(h.notifications.get(verified.id).state,'disabled');
   res=await adminReply(h,verified.id,idToken);
   assert.equal(res.status,200);await h.flush();
   assert.equal(h.sent.length,4,'disabled 不能再寄通知');
 });
});
test('錯誤私人憑證、未授權管理員不能操作通知',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const item=await submit(h);
   const bad=await post('/v1/feedback/email/status',{receipt:item.receipt+'fake'},h.env);
   assert.equal(bad.status,404);
   const unauth=await worker.fetch(new Request('https://home.by-l1ng.com/feedback/admin-api/feedback/'+item.id+'/replies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'unauthorized'})}),h.env);
   assert.equal(unauth.status,403);
   assert.equal(h.replies.length,0);
 });
});

test('重寄驗證信：未滿冷卻時間拒絕、逾期後換新 token、舊連結作廢',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const item=await submit(h);
   const previous=verificationUrl(h.sent[0]);
   const tooSoon=await post('/v1/feedback/email/resend',{receipt:item.receipt},h.env);
   assert.equal(tooSoon.status,429);
   h.notifications.get(item.id).last_verification_sent_at='2000-01-01T00:00:00.000Z';
   const ok=await post('/v1/feedback/email/resend',{receipt:item.receipt},h.env);
   assert.equal(ok.status,200);
   assert.equal(h.sent.length,2);
   assert.notEqual(verificationUrl(h.sent[1]),previous);
   const stale=await followLink(previous,h.env);
   assert.match(await stale.text(),/已過期/);
   const latest=await followLink(verificationUrl(h.sent[1]),h.env);
   assert.match(await latest.text(),/電子郵件已驗證/);
   const repeated=await post('/v1/feedback/email/resend',{receipt:item.receipt},h.env);
   assert.equal(repeated.status,409);
 });
});
test('通知信寄送故障不得撤銷已保存的管理員回覆；記錄寄送失敗',async()=>{
 const h=harness({failSend:true});
 await withMock(h,async()=>{
   const jwt=await adminAuth(h),item=await submit(h);
   const row=h.notifications.get(item.id);
   // 模擬先前已完成的驗證，避免測試用假寄送失敗誤當成啟用。
   row.state='verified';row.verify_hash=null;
   const res=await adminReply(h,item.id,jwt);
   assert.equal(res.status,200);
   await h.flush();
   assert.equal(h.replies.length,1);
   assert.equal(h.sent.length,2);
   assert.equal([...h.delivery.values()][0].status,'failed');
   assert.equal(row.state,'verified');
 });
});

test('驗證連結：過期與變造都不應啟用通知，失敗頁不洩露私人憑證',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const item=await submit(h);
   const url=verificationUrl(h.sent[0]),row=h.notifications.get(item.id);
   const forged=new URL(url);
   forged.searchParams.set('token','A'.repeat(43));
   const wrong=await followLink(forged.href,h.env);
   assert.match(await wrong.text(),/驗證連結無效或已過期/);
   assert.equal(row.state,'pending');
   row.verify_expires_at='2000-01-01T00:00:00.000Z';
   const expired=await followLink(url,h.env);
   const text=await expired.text();
   assert.match(text,/驗證連結無效或已過期/);
   assert.ok(!text.includes(item.receipt));
   assert.equal(row.state,'pending','到期連結不得改為已驗證');
 });
});
test('回覆通知：更換 Resend API Key 後舊取消通知連結仍有效',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const jwt=await adminAuth(h),item=await submit(h);
   await followLink(verificationUrl(h.sent[0]),h.env);
   let result=await adminReply(h,item.id,jwt);
   assert.equal(result.status,200);await h.flush();
   const oldUrl=unsubscribeUrl(h.sent[1]);
   assert.ok(oldUrl);
   h.env.RESEND_API_KEY='rotated-offline-key';
   result=await adminReply(h,item.id,jwt);
   assert.equal(result.status,200);await h.flush();
   assert.equal(unsubscribeUrl(h.sent[2]),oldUrl);
   const q=new URL(oldUrl);
   const cancelled=await followLink(oldUrl,h.env,'POST',new URLSearchParams({id:q.searchParams.get('id'),token:q.searchParams.get('token')}));
   assert.equal(cancelled.status,200);
   assert.equal(h.notifications.get(item.id).state,'disabled');
 });
});
test('Resend 寄件格式：同一封包含 HTML、純文字、正確寄件者與固定網站網址，不含私人憑證',async()=>{
 const h=harness();
 await withMock(h,async()=>{
   const item=await submit(h,'RealDate','en');
   assert.equal(h.sent.length,1);
   const verification=h.sent[0];
   assert.equal(verification.data.from,'L1nG Notifications <notify@by-l1ng.com>');
   assert.deepEqual(verification.data.to,['player@example.com']);
   assert.match(verification.data.html,/Verify email/);
   assert.match(verification.data.text,/Verify email/);
   assert.equal(verification.data.html.includes(item.receipt),false);
   await followLink(verificationUrl(verification),h.env);
   const jwt=await adminAuth(h);
   const response=await adminReply(h,item.id,jwt);
   assert.equal(response.status,200);await h.flush();
   const reply=h.sent[1];
   assert.match(reply.data.html,/https:\/\/realdate\.by-l1ng\.com\/feedback\.html#my-feedback/);
   assert.match(reply.data.text,/https:\/\/realdate\.by-l1ng\.com\/feedback\.html#my-feedback/);
   assert.ok(reply.headers['Idempotency-Key'].startsWith('reply/'));
   assert.equal(reply.data.html.includes(item.receipt),false);
   assert.equal(reply.data.text.includes(item.receipt),false);
 });
});
