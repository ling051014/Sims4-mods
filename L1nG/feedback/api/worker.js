/* L1nG 匿名回饋 API：僅處理回饋，不修改網站其他服務。
 * 部署前需建立 D1 資料表；Turnstile Secret 只能保存在 Cloudflare Secret。
 * 管理 API 必須完成 Cloudflare Access JWT 驗證，預設拒絕存取。
 */
const MAX_FILES = 3, FILE_BYTES = 10 * 1048576, TOTAL_BYTES = 20 * 1048576;
const TYPES = {png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",txt:"text/plain",log:"text/plain"};
const PUBLIC_ORIGINS = ["https://realdate.by-l1ng.com","https://genealogy-tool.by-l1ng.com"];
const EMAIL_LANGS = new Set(["zh-Hant","zh-Hans","en"]);
const emailLang = value => EMAIL_LANGS.has(value)?value:"zh-Hant";
const emailCopy = {
 "zh-Hant":{verifySubject:"L1nG · 請驗證電子郵件",verifyTitle:"確認電子郵件",verifyBody:"請點擊以下連結，啟用問題回饋的 Email 回覆通知。",verifyAction:"驗證電子郵件",replySubject:"L1nG · 你的問題回饋有新回覆",replyTitle:"管理員已回覆你的問題",replyBody:"請回到官網，使用原本保存的私人憑證查看匿名對話。",unsubscribe:"關閉 Email 回覆通知",verified:"電子郵件已驗證",disabled:"Email 回覆通知已關閉",expired:"驗證連結無效或已過期",brand:"問題回饋"},
 "zh-Hans":{verifySubject:"L1nG · 请验证电子邮箱",verifyTitle:"确认电子邮箱",verifyBody:"请点击以下链接，启用问题反馈的 Email 回复通知。",verifyAction:"验证电子邮箱",replySubject:"L1nG · 你的问题反馈有新回复",replyTitle:"管理员已回复你的问题",replyBody:"请返回官网，使用之前保存的私人凭证查看匿名对话。",unsubscribe:"关闭 Email 回复通知",verified:"电子邮箱已验证",disabled:"Email 回复通知已关闭",expired:"验证链接无效或已过期",brand:"问题反馈"},
 "en":{verifySubject:"L1nG · Verify your email",verifyTitle:"Confirm your email address",verifyBody:"Please confirm your email to receive notifications when we reply to your feedback.",verifyAction:"Verify email",replySubject:"L1nG · New reply to your feedback",replyTitle:"Your feedback has a new reply",replyBody:"Visit the website and use your saved private receipt to view the conversation.",unsubscribe:"Turn off email notifications",verified:"Email verified",disabled:"Email notifications disabled",expired:"Verification link is invalid or has expired",brand:"Feedback"}
};
const escapeHTML = v => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mailPage = (title,body)=>new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>L1nG</title><style>body{margin:0;background:#f7f7f5;color:#26262d;font:15px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}.card{background:white;max-width:420px;width:calc(100% - 60px);padding:36px;border:1px solid #e8e8e8;border-radius:18px;text-align:center}h1{font-size:24px}p{color:#777883}</style><main class="card"><h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(body)+'</p></main></html>',{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff"}});
function emailHtml(copy,title,body,button,url,footerUrl){
 const a=button?'<p style="margin:30px 0"><a href="'+escapeHTML(url)+'" style="background:#6554ae;color:#fff;padding:13px 22px;border-radius:9px;text-decoration:none">'+escapeHTML(button)+'</a></p>':'';
 return '<div style="background:#f7f7f5;padding:32px 14px;font-family:Arial,sans-serif;color:#26262d"><main style="max-width:510px;margin:auto;background:#fff;border:1px solid #e8e8e8;border-radius:16px;overflow:hidden"><header style="background:#6554ae;color:white;padding:24px 30px"><strong style="font-size:25px">L1nG</strong><p style="font-size:11px;letter-spacing:1px">'+escapeHTML(copy.brand)+'</p></header><section style="padding:30px"><h2>'+escapeHTML(title)+'</h2><p>'+escapeHTML(body)+'</p>'+a+(footerUrl?'<p style="margin-top:30px;font-size:11px"><a href="'+escapeHTML(footerUrl)+'">'+escapeHTML(copy.unsubscribe)+'</a></p>':'')+'</section></main></div>';
}
async function sendEmail(env,to,subject,html){
 // 發信密鑰只使用 Worker Secret；未配置時不得假報寄送。
 if(!env.RESEND_API_KEY || !env.FEEDBACK_MAIL_FROM) return false;
 try{
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.FEEDBACK_MAIL_FROM,to:[to],subject,html})});
  return response.ok;
 }catch(_){return false;}
}
async function createVerificationEmail(env,id,email,language,force=false){
 const row=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=?").bind(id).first();
 if(!row || row.state==="disabled")return false;
 if(!force && row.last_verification_sent_at && Date.now()-Date.parse(row.last_verification_sent_at)<300000)return false;
 const token=randomToken(),hash=await sha256(token),at=now(),expires=new Date(Date.now()+24*3600000).toISOString();
 await env.DB.prepare("UPDATE email_notifications SET verify_hash=?,verify_expires_at=?,last_verification_sent_at=? WHERE feedback_id=? AND state='pending'").bind(hash,expires,at,id).run();
 const url="https://l1ng-feedback-api.zpl74520.workers.dev/v1/feedback/email/verify?token="+encodeURIComponent(token)+"&id="+encodeURIComponent(id);
 const copy=emailCopy[emailLang(language)];
 return sendEmail(env,email,copy.verifySubject,emailHtml(copy,copy.verifyTitle,copy.verifyBody,copy.verifyAction,url));
}
async function verifyEmailLink(req,env){
 const url=new URL(req.url),id=url.searchParams.get("id")||"",token=url.searchParams.get("token")||"";
 if(!/^LNG-[A-Z0-9]{12}$/.test(id)||!/^[A-Za-z0-9_-]{40,60}$/.test(token))return mailPage("L1nG","Invalid verification link");
 const hash=await sha256(token),row=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=?").bind(id).first();
 const copy=emailCopy[emailLang(row?.language)];
 if(!row || row.state!=="pending" || row.verify_hash!==hash || !row.verify_expires_at || Date.parse(row.verify_expires_at)<Date.now())return mailPage(copy.expired,"");
 await env.DB.prepare("UPDATE email_notifications SET state='verified',verified_at=?,verify_hash=NULL,verify_expires_at=NULL WHERE feedback_id=? AND state='pending' AND verify_hash=?").bind(now(),id,hash).run();
 return mailPage(copy.verified,copy.replyBody);
}
async function unsubscribeEmailLink(req,env){
 const url=new URL(req.url),id=url.searchParams.get("id")||"",token=url.searchParams.get("token")||"";
 if(!/^LNG-[A-Z0-9]{12}$/.test(id)||!/^[A-Za-z0-9_-]{40,60}$/.test(token))return mailPage("L1nG","Invalid link");
 const hash=await sha256(token),row=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=? AND unsubscribe_hash=?").bind(id,hash).first();
 if(!row)return mailPage("L1nG","Invalid link");
 await env.DB.prepare("UPDATE email_notifications SET state='disabled',verify_hash=NULL,verify_expires_at=NULL WHERE feedback_id=?").bind(id).run();
 return mailPage(emailCopy[emailLang(row.language)].disabled,"");
}
async function emailStatus(req,env){
 let body;try{body=await req.json()}catch(_){return fail("查詢格式不正確。")}
 const row=await verifiedReceipt(env,body.receipt);if(!row)return fail("私人憑證無效或查無資料。",404);
 const item=await env.DB.prepare("SELECT state,last_verification_sent_at,language FROM email_notifications WHERE feedback_id=?").bind(row.id).first();
 return json({ok:true,email: item?{state:item.state,language:item.language}:null});
}
async function resendEmail(req,env){
 let body;try{body=await req.json()}catch(_){return fail("查詢格式不正確。")}
 const row=await verifiedReceipt(env,body.receipt);if(!row)return fail("私人憑證無效或查無資料。",404);
 const item=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=?").bind(row.id).first();
 if(!item || item.state!=="pending")return fail("此回饋不需要重新驗證。",409);
 if(item.last_verification_sent_at && Date.now()-Date.parse(item.last_verification_sent_at)<300000)return fail("請稍後再重新寄送。",429);
 const sent=await createVerificationEmail(env,row.id,item.email,item.language,true);
 return sent?json({ok:true}):fail("寄送服務暫時不可使用。",503);
}
async function notifyAdminReply(env,feedback,replyId){
 const item=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=? AND state='verified'").bind(feedback.id).first();
 if(!item)return;
 const claim=await env.DB.prepare("INSERT OR IGNORE INTO email_delivery (reply_id,feedback_id,status,updated_at) VALUES (?,?,?,?) RETURNING reply_id").bind(replyId,feedback.id,"failed",now()).first();
 if(!claim)return;
 const copy=emailCopy[emailLang(item.language)],token=randomToken(),hash=await sha256(token);
 // 取消通知用一次性祕密，儲存雜湊而非明碼。
 await env.DB.prepare("UPDATE email_notifications SET unsubscribe_hash=? WHERE feedback_id=?").bind(hash,feedback.id).run();
 const url="https://l1ng-feedback-api.zpl74520.workers.dev/v1/feedback/email/unsubscribe?id="+encodeURIComponent(feedback.id)+"&token="+encodeURIComponent(token);
 const sent=await sendEmail(env,item.email,copy.replySubject,emailHtml(copy,copy.replyTitle,copy.replyBody,"","",url));
 await env.DB.prepare("UPDATE email_delivery SET status=?,updated_at=? WHERE reply_id=?").bind(sent?"sent":"failed",now(),replyId).run();
}

const enc = new TextEncoder();
const now = () => new Date().toISOString();
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...headers}});
const fail = (message,status=400) => json({ok:false,error:message},status);
const text = v => String(v==null?"":v).trim();
const clean = (v,max) => text(v).slice(0,max);
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const randomToken = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const sha256 = async s => b64(await crypto.subtle.digest("SHA-256",enc.encode(s)));
const allowedOrigins = env => (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map(x=>x.trim()) : PUBLIC_ORIGINS);
const validOrigin = (origin,env) => !!origin && allowedOrigins(env).includes(origin);
const cors = origin => ({"access-control-allow-origin":origin,"vary":"Origin","access-control-allow-methods":"POST,GET,OPTIONS","access-control-allow-headers":"Content-Type","access-control-max-age":"600"});
const f = (form,key) => text(form.get(key));
const receiptParts = token => {
  const match=/^(LNG-[A-Z0-9]{12}):([A-Za-z0-9_-]{40,60})$/.exec(text(token));
  return match?{id:match[1],secret:match[2]}:null;
};
async function validateTurnstile(token,origin,env){
  if(!env.TURNSTILE_SECRET_KEY) return {error:"驗證服務尚未設定完成。",status:503};
  if(!token || token.length>2048) return {error:"請先完成人機驗證。",status:400};
  let result;
  try {
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token})
    });
    result=await response.json();
  }catch(_){return {error:"驗證服務暫時無法連線，請稍後重試。",status:503};}
  const allowedHostnames=(env.TURNSTILE_HOSTNAMES||"realdate.by-l1ng.com,genealogy-tool.by-l1ng.com").split(",").map(x=>x.trim());
  const expected=new URL(origin).hostname;
  if(!result.success || result.hostname!==expected || !allowedHostnames.includes(result.hostname))
    return {error:"人機驗證未通過或已過期，請重新驗證。",status:403};
  return {ok:true};
}
// 以 Cloudflare 轉送的 IP 衍生雜湊，D1 只保存每小時用量，不儲存原始 IP。
// D1 的條件式 UPSERT 是原子操作；不使用容易競態的 SELECT 後 UPDATE。
async function enforceRateLimit(request,env,kind,max){
  const ip=request.headers.get("cf-connecting-ip");
  if(!ip || !env.TURNSTILE_SECRET_KEY)return {error:"無法確認提交來源，請稍後再試。",status:503};
  const hour=now().slice(0,13);
  const bucket=kind+":"+hour+":"+await sha256(env.TURNSTILE_SECRET_KEY+":"+ip);
  const expiresAt=new Date(Date.now()+2*3600000).toISOString();
  try{
    const row=await env.DB.prepare(
      "INSERT INTO request_limits (bucket,used,expires_at) VALUES (?,1,?) "+
      "ON CONFLICT(bucket) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used"
    ).bind(bucket,expiresAt,max).first();
    return row?{ok:true}:{error:"操作過於頻繁，請稍後再試。",status:429};
  }catch(_){
    // 設定或 D1 失敗時拒絕收件，不可繞過頻率限制。
    return {error:"回饋服務暫時無法使用，請稍後再試。",status:503};
  }
}
function validatePayload(form){
  const source=f(form,"source"), category=f(form,"category"),target=f(form,"target");
  const message=f(form,"message"), followUp=f(form,"followUp"),version=f(form,"version"),gameVersion=f(form,"gameVersion");
  const method=f(form,"contactMethod"),contact=f(form,"contactValue"),emailNotify=f(form,"emailNotify")==="true",language=emailLang(f(form,"language"));
  if(!["RealDate","Genealogy"].includes(source)) return {error:"來源網站不正確。"};
  if(!["bug","feature","other"].includes(category)) return {error:"回饋類型不正確。"};
  if(message.length<10||message.length>2000) return {error:"回饋內容需為 10 至 2000 字。"};
  if(!["once","conversation"].includes(followUp)) return {error:"回饋方式不正確。"};
  if(contact.length>120 || (contact && !(method==="email"?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact):method==="discord" && contact.length>=2)))
    return {error:"聯絡方式格式不正確。"};
  if(emailNotify && (followUp!=="conversation" || method!=="email" || !contact))return {error:"Email 通知需要匿名對話及有效電子郵件。"};
  if(version.length>60||gameVersion.length>70||target.length>80) return {error:"版本或問題分類超過長度限制。"};
  if(source==="RealDate"&&category==="bug"&&target==="mod"&&!gameVersion.trim())
    return {error:"請填寫遊戲版本，可查看 RealDate 日誌確認。"};
  return {data:{source,category,target,message,followUp,version,gameVersion,contactMethod:contact?method:null,contactValue:contact||null,emailNotify,language}};
}
async function validatedFiles(form,env){
  const rawFiles=form.getAll("files");
  if(rawFiles.some(x=>!(x instanceof File) || x.size===0))return {error:"附件資料無效，請重新選擇。"};
  const files=rawFiles;
  if(files.length>MAX_FILES || files.reduce((sum,file)=>sum+file.size,0)>TOTAL_BYTES)
    return {error:"最多 3 個附件，合計不可超過 20 MB。"};
  if(files.length && !env.ATTACHMENTS) return {error:"附件儲存尚未啟用，請先移除附件再送出。",status:503};
  const accepted=[];
  for(const file of files){
    const name=clean(file.name,160);
    const ext=name.includes(".")?name.split(".").pop().toLowerCase():"";
    if(!TYPES[ext] || file.size>FILE_BYTES || !file.size) return {error:"附件格式或大小不符合限制。"};
    const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
    const isPng=ext==="png" && header.slice(0,4).join(",")==="137,80,78,71";
    const isJpg=["jpg","jpeg"].includes(ext) && header[0]===255&&header[1]===216&&header[2]===255;
    const isWebp=ext==="webp" && String.fromCharCode(...header.slice(0,4))==="RIFF" && String.fromCharCode(...header.slice(8,12))==="WEBP";
    const isText=["txt","log"].includes(ext);
    if(!(isPng||isJpg||isWebp||isText)) return {error:"附件內容與副檔名不符。"};
    accepted.push({file,name,type:TYPES[ext],size:file.size});
  }
  return {files:accepted};
}
async function saveFiles(files,id,env){
  const stored=[];
  try{
    for(const x of files){
      const fileId=crypto.randomUUID();
      const key="feedback/"+id+"/"+fileId;
      await env.ATTACHMENTS.put(key,x.file.stream(),{httpMetadata:{contentType:x.type}});
      stored.push({id:fileId,key,name:x.name,type:x.type,size:x.size});
    }
    return stored;
  }catch(e){
    await Promise.allSettled(stored.map(s=>env.ATTACHMENTS.delete(s.key)));
    throw e;
  }
}
const formatFeedback = (row,messages=[],attachments=[],admin=false) => ({
  id:row.id,source:row.source,site:row.source,category:row.category,target:row.target,
  title:row.message.slice(0,32),message:row.message,followUp:row.follow_up,
  status:row.status,createdAt:row.created_at,updatedAt:row.updated_at,
  version:row.version,gameVersion:row.game_version,
  ...(admin?{contact:row.contact_value?{method:row.contact_method,value:row.contact_value}:null}:{}),
  messages,attachments:attachments.map(a=>({id:a.id,replyId:a.reply_id??null,name:a.name,type:a.content_type,size:a.size}))
});
async function readRecord(env,id){
  const row=await env.DB.prepare("SELECT * FROM feedback WHERE id=?").bind(id).first();
  if(!row) return null;
  const messages=(await env.DB.prepare("SELECT id,author,body,created_at FROM replies WHERE feedback_id=? ORDER BY created_at ASC,id ASC").bind(id).all()).results;
  const attachments=(await env.DB.prepare("SELECT id,reply_id,name,content_type,size FROM attachments WHERE feedback_id=? ORDER BY created_at ASC,id ASC").bind(id).all()).results;
  return {row,messages,attachments};
}
async function verifiedReceipt(env,value){
  const pair=receiptParts(value);if(!pair)return null;
  const row=await env.DB.prepare("SELECT * FROM feedback WHERE id=? AND follow_up='conversation'").bind(pair.id).first();
  if(!row || !row.receipt_hash || row.receipt_hash!==await sha256(pair.secret)) return null;
  return row;
}
async function createFeedback(req,env,origin){
  const len=Number(req.headers.get("content-length")||0);
  if(len>23*1048576) return fail("回饋資料超過允許大小。",413);
  let form;
  try{form=await req.formData();}catch(_){return fail("回饋格式不正確。");}
  if(form.getAll("files").reduce((size,file)=>size+(file instanceof File?file.size:0),0)>TOTAL_BYTES)return fail("附件合計不得超過 20 MB。",413);
  const checked=validatePayload(form);if(checked.error)return fail(checked.error);
  // 來源網站必須和提交網域一致，避免冒充其他網站的回饋。
  const expectedSource=new URL(origin).hostname.startsWith("realdate.")?"RealDate":"Genealogy";
  if(checked.data.source!==expectedSource)return fail("回饋來源與提交網站不一致。",403);
  const inspected=await validatedFiles(form,env);if(inspected.error)return fail(inspected.error,inspected.status||400);
  const verified=await validateTurnstile(f(form,"turnstileToken"),origin,env);
  if(!verified.ok)return fail(verified.error,verified.status);
  const limited=await enforceRateLimit(req,env,"submit",6);
  if(!limited.ok)return fail(limited.error,limited.status);
  const data=checked.data,id="LNG-"+crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase();
  const secret=data.followUp==="conversation"?randomToken():null,hash=secret?await sha256(secret):null;
  const created=now();let saved=[];
  try{
    saved=await saveFiles(inspected.files,id,env);
    const statements=[
      env.DB.prepare("INSERT INTO feedback (id,source,category,target,message,follow_up,receipt_hash,contact_method,contact_value,version,game_version,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,data.source,data.category,data.target,data.message,data.followUp,hash,data.contactMethod,data.contactValue,data.version,data.gameVersion,"pending",created,created)
    ];
    for(const a of saved)statements.push(env.DB.prepare("INSERT INTO attachments (id,feedback_id,reply_id,r2_key,name,content_type,size,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(a.id,id,null,a.key,a.name,a.type,a.size,created));
    if(data.emailNotify) statements.push(env.DB.prepare("INSERT INTO email_notifications (feedback_id,email,language,state) VALUES (?,?,?, 'pending')").bind(id,data.contactValue,data.language));
    await env.DB.batch(statements);
  }catch(_){
    if(env.ATTACHMENTS)await Promise.allSettled(saved.map(a=>env.ATTACHMENTS.delete(a.key)));
    return fail("儲存回饋失敗，請稍後再試。",503);
  }
  let emailState=null;
  if(data.emailNotify){
    const sent=await createVerificationEmail(env,id,data.contactValue,data.language);
    emailState=sent?"pending":"delivery_unavailable";
  }
  return json({ok:true,id,receipt:secret?id+":"+secret:null,status:"pending",emailState},201);
}
async function lookup(req,env){
  let body;try{body=await req.json();}catch(_){return fail("查詢格式不正確。");}
  const limited=await enforceRateLimit(req,env,"lookup",120);
  if(!limited.ok)return fail(limited.error,limited.status);
  const row=await verifiedReceipt(env,body.receipt);if(!row)return fail("私人憑證無效或查無資料。",404);
  const record=await readRecord(env,row.id);
  const email=await env.DB.prepare("SELECT state,language FROM email_notifications WHERE feedback_id=?").bind(row.id).first();
  return json({ok:true,feedback:{...formatFeedback(record.row,record.messages,record.attachments),emailNotification:email?{state:email.state,language:email.language}:null}});
}
async function reply(req,env,origin){
  let form;try{form=await req.formData();}catch(_){return fail("回覆格式不正確。");}
  const row=await verifiedReceipt(env,f(form,"receipt"));
  if(!row)return fail("私人憑證無效或查無資料。",404);
  if(["done","spam"].includes(row.status))return fail("此對話已結束，暫時無法新增回覆。",409);
  const body=f(form,"message");
  if(body.length<1||body.length>2000)return fail("回覆內容需為 1 至 2000 字。");
  const inspected=await validatedFiles(form,env);if(inspected.error)return fail(inspected.error,inspected.status||400);
  const verified=await validateTurnstile(f(form,"turnstileToken"),origin,env);
  if(!verified.ok)return fail(verified.error,verified.status);
  const requestLimit=await enforceRateLimit(req,env,"reply",20);
  if(!requestLimit.ok)return fail(requestLimit.error,requestLimit.status);
  // 每個私人對話每小時最多五則玩家回覆，限制被竊憑證濫用。
  const limited=await env.DB.prepare("SELECT count(*) AS n FROM replies WHERE feedback_id=? AND author='player' AND created_at >= ?")
    .bind(row.id,new Date(Date.now()-3600000).toISOString()).first();
  if(limited.n>=5)return fail("一小時內回覆過於頻繁，請稍後再試。",429);
  const id=crypto.randomUUID(),created=now();let saved=[];
  try{
    saved=await saveFiles(inspected.files,row.id,env);
    const statements=[
      env.DB.prepare("INSERT INTO replies (id,feedback_id,author,body,created_at) VALUES (?,?,?,?,?)").bind(id,row.id,"player",body,created),
      env.DB.prepare("UPDATE feedback SET status='progress',updated_at=? WHERE id=?").bind(created,row.id)
    ];
    for(const a of saved)statements.push(env.DB.prepare("INSERT INTO attachments (id,feedback_id,reply_id,r2_key,name,content_type,size,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(a.id,row.id,id,a.key,a.name,a.type,a.size,created));
    await env.DB.batch(statements);
  }catch(_){
    if(env.ATTACHMENTS)await Promise.allSettled(saved.map(a=>env.ATTACHMENTS.delete(a.key)));
    return fail("儲存回覆失敗，請稍後再試。",503);
  }
  return json({ok:true});
}
async function checkAdmin(request,env){
  if(!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAIL)return false;
  let issuer;
  try{issuer=new URL(env.ACCESS_TEAM_DOMAIN).origin;}catch(_){return false;}
  if(!issuer.endsWith(".cloudflareaccess.com"))return false;
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token)return false;
  const pieces=token.split(".");if(pieces.length!==3)return false;
  try{
    const decode=s=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0))));
    const header=decode(pieces[0]),payload=decode(pieces[1]);
    if(header.alg!=="RS256" || !header.kid || payload.iss!==issuer || !env.ADMIN_EMAIL.split(",").map(e=>e.trim().toLowerCase()).includes(String(payload.email||"").toLowerCase()))return false;
    if(!(Array.isArray(payload.aud)?payload.aud.includes(env.ACCESS_AUD):payload.aud===env.ACCESS_AUD))return false;
    if(!Number.isFinite(payload.exp) || payload.exp<=Date.now()/1000 || (payload.nbf && payload.nbf>Date.now()/1000))return false;
    const response=await fetch(issuer+"/cdn-cgi/access/certs");
    if(!response.ok)return false;
    const keys=await response.json();
    const jwk=(keys.keys||[]).find(x=>x.kid===header.kid && x.kty==="RSA");
    if(!jwk)return false;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    const signature=Uint8Array.from(atob(pieces[2].replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,signature,enc.encode(pieces[0]+"."+pieces[1]));
  }catch(_){return false;}
}
async function admin(req,env,path){
  if(!await checkAdmin(req,env))return fail("未授權的管理操作。",403);
  const bits=path.split("/").filter(Boolean),id=bits[3];
  if(req.method==="GET" && bits.length===3){
    const result=await env.DB.prepare("SELECT id,source,category,target,message,follow_up,status,created_at,updated_at,contact_method,contact_value,version,game_version FROM feedback ORDER BY created_at DESC LIMIT 200").all();
    return json({ok:true,items:result.results.map(r=>formatFeedback(r,[],[],true))});
  }
  if(!/^LNG-[A-Z0-9]{12}$/.test(id||""))return fail("回饋編號不正確。",404);
  const record=await readRecord(env,id);if(!record)return fail("找不到回饋。",404);
  if(req.method==="GET"&&bits.length===4)return json({ok:true,feedback:formatFeedback(record.row,record.messages,record.attachments,true)});
  if(req.method==="PATCH"&&bits.length===4){
    let body;try{body=await req.json();}catch(_){return fail("內容格式不正確。");}
    if(!["pending","progress","done","spam"].includes(body.status))return fail("狀態不正確。");
    await env.DB.prepare("UPDATE feedback SET status=?,updated_at=? WHERE id=?").bind(body.status,now(),id).run();
    return json({ok:true});
  }
  if(req.method==="POST"&&bits[4]==="replies"){
    let body;try{body=await req.json();}catch(_){return fail("內容格式不正確。");}
    const msg=text(body.message);
    if(record.row.follow_up!=="conversation")return fail("此回饋沒有啟用匿名對話。",409);
    if(msg.length<1||msg.length>2000)return fail("回覆內容需為 1 至 2000 字。");
    const created=now();
    const replyId=crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO replies (id,feedback_id,author,body,created_at) VALUES (?,?,?,?,?)").bind(replyId,id,"admin",msg,created),
      env.DB.prepare("UPDATE feedback SET status='progress',updated_at=? WHERE id=?").bind(created,id)
    ]);
    await notifyAdminReply(env,record.row,replyId).catch(()=>{});
    return json({ok:true});
  }
  if(req.method==="DELETE"&&bits.length===4){
    const attachments=await env.DB.prepare("SELECT r2_key FROM attachments WHERE feedback_id=?").bind(id).all();
    await env.DB.prepare("DELETE FROM feedback WHERE id=?").bind(id).run();
    if(env.ATTACHMENTS)await Promise.allSettled(attachments.results.map(a=>env.ATTACHMENTS.delete(a.r2_key)));
    return json({ok:true});
  }
  if(req.method==="GET"&&bits.length===6&&bits[4]==="attachments"&&bits[5]&&env.ATTACHMENTS){
    const file=await env.DB.prepare("SELECT * FROM attachments WHERE id=? AND feedback_id=?").bind(bits[5],id).first();
    if(!file)return fail("找不到附件。",404);
    const object=await env.ATTACHMENTS.get(file.r2_key);
    if(!object)return fail("附件暫時無法讀取。",404);
    return new Response(object.body,{headers:{"content-type":file.content_type,"content-disposition":"attachment; filename*=UTF-8''"+encodeURIComponent(file.name),"cache-control":"no-store","x-content-type-options":"nosniff"}});
  }
  return fail("找不到端點。",404);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname.replace(/\/+$/,"")||"/";
    if(path==="/health"&&request.method==="GET")return json({ok:true,service:"l1ng-feedback-api"});
    if(!env.DB)return fail("回饋資料庫尚未連接。",503);
    if(path==="/v1/feedback/email/verify"&&request.method==="GET")return verifyEmailLink(request,env);
    if(path==="/v1/feedback/email/unsubscribe"&&request.method==="GET")return unsubscribeEmailLink(request,env);
    const adminPrefix="/feedback/admin-api";
    // 管理請求僅從首頁同網域的專用 Worker Route 進入，不接受 workers.dev 直連。
    // Cloudflare Access 必須保護 home.by-l1ng.com/feedback/admin-api/*。
    if(url.hostname==="home.by-l1ng.com" && path.startsWith(adminPrefix+"/")){
      const adminPath="/v1/admin"+path.slice(adminPrefix.length);
      return admin(request,env,adminPath);
    }
    if(path.startsWith("/v1/admin/")){
      return fail("管理端點只能透過受保護的網站路徑存取。",403);
    }
    const origin=request.headers.get("origin");
    if(!validOrigin(origin,env))return fail("不允許的網站來源。",403);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
    let result;
    try{
      if(path==="/v1/feedback"&&request.method==="POST")result=await createFeedback(request,env,origin);
      else if(path==="/v1/feedback/lookup"&&request.method==="POST")result=await lookup(request,env);
      else if(path==="/v1/feedback/reply"&&request.method==="POST")result=await reply(request,env,origin);
      else if(path==="/v1/feedback/email/status"&&request.method==="POST")result=await emailStatus(request,env);
      else if(path==="/v1/feedback/email/resend"&&request.method==="POST")result=await resendEmail(request,env);
      else result=fail("找不到端點。",404);
    }catch(_){result=fail("服務暫時無法處理請求。",503);}
    const headers=new Headers(result.headers);
    for(const [k,v] of Object.entries(cors(origin)))headers.set(k,v);
    return new Response(result.body,{status:result.status,headers});
  }
};