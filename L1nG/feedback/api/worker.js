/* L1nG 匿名回饋 API：僅處理回饋，不修改網站其他服務。
 * 部署前需建立 D1 資料表；Turnstile Secret 只能保存在 Cloudflare Secret。
 * 管理 API 必須完成 Cloudflare Access JWT 驗證，預設拒絕存取。
 */
const MAX_FILES = 3, FILE_BYTES = 10 * 1048576, TOTAL_BYTES = 20 * 1048576;
const TYPES = {png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",txt:"text/plain",log:"text/plain"};
const PUBLIC_ORIGINS = ["https://realdate.by-l1ng.com","https://genealogy-tool.by-l1ng.com"];
const enc = new TextEncoder();
const EMAIL_LANGS = new Set(["zh-Hant","zh-Hans","en"]);
const EMAIL_VERIFY_MS = 15 * 60 * 1000, EMAIL_RESEND_MS = 60 * 1000;
const emailLang = value => EMAIL_LANGS.has(value)?value:"zh-Hant";
const emailCopy = {
 "zh-Hant":{verifySubject:"L1nG · 請驗證電子郵件",verifyTitle:"確認電子郵件",verifyBody:"請點擊以下連結，啟用問題回饋的 Email 回覆通知。",verifyValidity:"此驗證連結將於寄送後 15 分鐘失效。",expiredHelp:"請返回原本的回饋頁面，重新寄送驗證信。",autoCloseText:"{seconds} 秒後嘗試關閉此分頁；若瀏覽器阻擋，請手動關閉。",blockedText:"瀏覽器不允許自動關閉此分頁，請手動關閉，或返回問題回饋。",returnLabel:"返回問題回饋",closeLabel:"關閉分頁",verifyAction:"驗證電子郵件",verifySuccessBody:"Email 回覆通知已啟用。管理員回覆時，我們會寄送電子郵件提醒。",replySubject:"L1nG · 你的問題回饋有新回覆",replyTitle:"管理員已回覆你的問題",replyBody:"請點擊下方按鈕，使用原本保存的私人憑證查看匿名對話。",replyAction:"前往問題反饋",unsubscribe:"關閉 Email 回覆通知",verified:"電子郵件已驗證",disabled:"Email 回覆通知已關閉",expired:"驗證連結無效或已過期",brand:"問題回饋"},
 "zh-Hans":{verifySubject:"L1nG · 请验证电子邮箱",verifyTitle:"确认电子邮箱",verifyBody:"请点击以下链接，启用问题反馈的 Email 回复通知。",verifyValidity:"此验证链接将在发送后 15 分钟失效。",expiredHelp:"请返回原来的反馈页面，重新发送验证邮件。",autoCloseText:"将在 {seconds} 秒后尝试关闭此标签页；如果浏览器阻止，请手动关闭。",blockedText:"浏览器不允许自动关闭此标签页，请手动关闭，或返回问题反馈。",returnLabel:"返回问题反馈",closeLabel:"关闭标签页",verifyAction:"验证电子邮箱",verifySuccessBody:"Email 回复通知已启用。管理员回复时，我们会发送电子邮件提醒。",replySubject:"L1nG · 你的问题反馈有新回复",replyTitle:"管理员已回复你的问题",replyBody:"请点击下方按钮，使用之前保存的私人凭证查看匿名对话。",replyAction:"前往问题反馈",unsubscribe:"关闭 Email 回复通知",verified:"电子邮箱已验证",disabled:"Email 回复通知已关闭",expired:"验证链接无效或已过期",brand:"问题反馈"},
 "en":{verifySubject:"L1nG · Verify your email",verifyTitle:"Confirm your email address",verifyBody:"Please confirm your email to receive notifications when we reply to your feedback.",verifyValidity:"This verification link expires 15 minutes after it is sent.",expiredHelp:"Return to the original feedback page to resend your verification email.",autoCloseText:"Attempting to close this tab in {seconds} seconds. If your browser blocks it, close the tab manually.",blockedText:"Your browser prevented this tab from closing automatically. You can close it manually or return to feedback.",returnLabel:"Back to feedback",closeLabel:"Close tab",verifyAction:"Verify email",verifySuccessBody:"Email reply notifications are enabled. We will email you when the administrator replies.",replySubject:"L1nG · New reply to your feedback",replyTitle:"Your feedback has a new reply",replyBody:"Use the button below and your saved private receipt to view the conversation.",replyAction:"View my feedback",unsubscribe:"Turn off email notifications",verified:"Email verified",disabled:"Email notifications disabled",expired:"Verification link is invalid or has expired",brand:"Feedback"}
};
const escapeHTML = v => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// 驗證結果頁為獨立輕量 HTML，不依賴網站 JS/CSS；Email 開啟的分頁可能無法透過 window.close() 關閉。
function mailPage(title,body,{kind="info",copy=emailCopy.en,autoClose=false,returnUrl=""}={}){
 const success=kind==="success",icon=success?'<path d="m5 12 4.5 4.5L19 7"/>':kind==="error"?'<path d="M12 7v6m0 4h.01M12 2 2 21h20L12 2Z"/>':'<path d="M12 3v18m-9-9h18"/>';
 const iconMarkup='<span class="symbol '+(success?'positive':kind==="error"?'negative':'')+'" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+icon+'</svg></span>';
 const a=returnUrl?'<a class="primary" href="'+escapeHTML(returnUrl)+'">'+escapeHTML(copy.returnLabel)+'</a>':'';
 const close=autoClose?'<button class="secondary" id="close-tab" type="button">'+escapeHTML(copy.closeLabel)+'</button>':'';
 const countdown=autoClose?'<p class="countdown" id="close-countdown" role="status">'+escapeHTML(copy.autoCloseText.replace("{seconds}","15"))+'</p>':'';
 const script=autoClose?'<script>(function(){const c=document.getElementById("close-countdown"),b=document.getElementById("close-tab");let remaining=15;const attempt=()=>{window.close();setTimeout(()=>{c.textContent='+JSON.stringify(copy.blockedText)+';c.classList.add("blocked")},400)};b.addEventListener("click",attempt);const interval=setInterval(()=>{remaining--;if(remaining<=0){clearInterval(interval);attempt()}else c.textContent='+JSON.stringify(copy.autoCloseText)+'.replace("{seconds}",remaining)},1000);try{history.replaceState(null,"",location.pathname)}catch(_){}})();<\/script>':'';
 const html='<!doctype html><html lang="'+escapeHTML(emailLang(Object.keys(emailCopy).find(k=>emailCopy[k]===copy)))+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>'+escapeHTML(title)+' · L1nG</title><style>*{box-sizing:border-box}body{min-height:100vh;margin:0;padding:24px;background:radial-gradient(circle at 50% 10%,#f0ecfb 0%,#f7f7f9 47%,#f4f4f7 100%);color:#2a2933;font:15px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center}.card{width:min(100%,480px);background:white;border:1px solid #eae8f1;box-shadow:0 22px 60px #42326411;border-radius:22px;text-align:center;overflow:hidden}.brand{background:#6350ab;color:white;text-align:left;padding:20px 28px;font-weight:800;letter-spacing:.03em;font-size:22px}.content{padding:38px 32px 34px}.symbol{display:inline-grid;place-items:center;border-radius:50%;background:#ede9f8;color:#6350ab;width:74px;height:74px;margin-bottom:14px}.symbol.positive{background:#e5f6ed;color:#23835a}.symbol.negative{background:#fff0ee;color:#ba6351}.symbol svg{width:38px;height:38px}h1{font-size:23px;line-height:1.3;margin:4px 0 12px}p{margin:0 auto;max-width:370px;color:#6b6977;overflow-wrap:anywhere}.actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:24px}.primary,.secondary{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:9px 17px;border-radius:9px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}.primary{background:#6350ab;color:white;border:1px solid #6350ab}.secondary{background:white;color:#6350ab;border:1px solid #cfc8e9}.countdown{font-size:13px;margin-top:22px;color:#898397}.countdown.blocked{color:#7a718b}@media(max-width:450px){.brand{padding:17px 22px}.content{padding:32px 22px}h1{font-size:21px}}</style></head><body><main class="card"><div class="brand">L1nG</div><div class="content">'+iconMarkup+'<h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(body)+'</p><div class="actions">'+a+close+'</div>'+countdown+'</div></main>'+script+'</body></html>';
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'self'"}});
}
function emailHtml(copy,title,body,button,url,footerUrl){
 const a=button?'<p style="margin:30px 0"><a href="'+escapeHTML(url)+'" style="background:#6554ae;color:#fff;padding:13px 22px;border-radius:9px;text-decoration:none">'+escapeHTML(button)+'</a></p>':'';
 return '<div style="background:#f7f7f5;padding:32px 14px;font-family:Arial,sans-serif;color:#26262d"><main style="max-width:510px;margin:auto;background:#fff;border:1px solid #e8e8e8;border-radius:16px;overflow:hidden"><header style="background:#6554ae;color:white;padding:24px 30px"><strong style="font-size:25px">L1nG</strong><p style="font-size:11px;letter-spacing:1px">'+escapeHTML(copy.brand)+'</p></header><section style="padding:30px"><h2>'+escapeHTML(title)+'</h2><p>'+escapeHTML(body)+'</p>'+a+(!footerUrl&&button&&copy.verifyValidity?'<p style="font-size:12px;color:#777883;margin:22px 0 0">'+escapeHTML(copy.verifyValidity)+'</p>':'')+(footerUrl?'<p style="margin-top:30px;font-size:11px"><a href="'+escapeHTML(footerUrl)+'">'+escapeHTML(copy.unsubscribe)+'</a></p>':'')+'</section></main></div>';
}
// 玩家郵件獨立使用 Resend；管理員既有 Cloudflare FEEDBACK_EMAIL 通知不更動。
async function sendPlayerEmail(env,to,subject,html,plain,idempotencyKey){
  if(!env.RESEND_API_KEY)return false;
  const from=text(env.RESEND_FROM_EMAIL)||"L1nG Notifications <notify@by-l1ng.com>";
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+env.RESEND_API_KEY,
        "Content-Type":"application/json",
        "Idempotency-Key":idempotencyKey
      },
      body:JSON.stringify({from,to:[to],subject,html,text:plain})
    });
    if(!response.ok){
      // 不紀錄收件地址、密鑰、驗證連結或郵件內容。
      console.error("Resend player email failed with HTTP status:",response.status);
      return false;
    }
    return true;
  }catch(_){
    console.error("Resend player email request failed");
    return false;
  }
}
async function createVerificationEmail(env,id,email,language,force=false){
 const row=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=?").bind(id).first();
 if(!row || !["pending","delivery_unavailable"].includes(row.state))return false;
 if(!force && row.last_verification_sent_at && Date.now()-Date.parse(row.last_verification_sent_at)<EMAIL_RESEND_MS)return false;
 const token=randomToken(),hash=await sha256(token),at=now(),expires=new Date(Date.now()+EMAIL_VERIFY_MS).toISOString();
 await env.DB.prepare("UPDATE email_notifications SET state='pending',verify_hash=?,verify_expires_at=?,last_verification_sent_at=? WHERE feedback_id=? AND state IN ('pending','delivery_unavailable')").bind(hash,expires,at,id).run();
 const url="https://l1ng-feedback-api.zpl74520.workers.dev/v1/feedback/email/verify?token="+encodeURIComponent(token)+"&id="+encodeURIComponent(id);
 const copy=emailCopy[emailLang(language)];
 const plain=copy.verifyTitle+"\n\n"+copy.verifyBody+"\n\n"+copy.verifyAction+": "+url+"\n\n"+copy.verifyValidity;
 const sent=await sendPlayerEmail(env,email,copy.verifySubject,emailHtml(copy,copy.verifyTitle,copy.verifyBody,copy.verifyAction,url),plain,"verify/"+id+"/"+hash.slice(0,24));
 if(!sent)await env.DB.prepare("UPDATE email_notifications SET state='delivery_unavailable',verify_hash=NULL,verify_expires_at=NULL WHERE feedback_id=? AND verify_hash=? AND state='pending'").bind(id,hash).run();
 return sent;
}
async function verifyEmailLink(req,env){
 const url=new URL(req.url),id=url.searchParams.get("id")||"",token=url.searchParams.get("token")||"";
 if(!/^LNG-[A-Z0-9]{12}$/.test(id)||!/^[A-Za-z0-9_-]{40,60}$/.test(token))return mailPage("L1nG","Invalid verification link");
 const hash=await sha256(token),row=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=?").bind(id).first();
 const copy=emailCopy[emailLang(row?.language)];
 if(!row || row.state!=="pending" || row.verify_hash!==hash || !row.verify_expires_at || Date.parse(row.verify_expires_at)<Date.now())return mailPage(copy.expired,copy.expiredHelp,{kind:"error",copy});
 const feedback=await env.DB.prepare("SELECT source FROM feedback WHERE id=?").bind(id).first();
 await env.DB.prepare("UPDATE email_notifications SET state='verified',verified_at=?,verify_hash=NULL,verify_expires_at=NULL WHERE feedback_id=? AND state='pending' AND verify_hash=?").bind(now(),id,hash).run();
 return mailPage(copy.verified,copy.verifySuccessBody,{kind:"success",copy,autoClose:true,returnUrl:feedback?.source==="Genealogy"?"https://genealogy-tool.by-l1ng.com/#my-feedback":"https://realdate.by-l1ng.com/feedback.html#my-feedback"});
}
async function unsubscribeEmailLink(req,env){
 const url=new URL(req.url),form=req.method==="POST"?await req.formData():null;
 const id=(form?String(form.get("id")||""):url.searchParams.get("id"))||"";
 const token=(form?String(form.get("token")||""):url.searchParams.get("token"))||"";
 if(!/^LNG-[A-Z0-9]{12}$/.test(id)||!/^[A-Za-z0-9_-]{40,60}$/.test(token))return mailPage("L1nG","Invalid link");
 const hash=await sha256(token),row=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=? AND unsubscribe_hash=?").bind(id,hash).first();
 if(!row)return mailPage("L1nG","Invalid link");
 const copy=emailCopy[emailLang(row.language)];
 if(req.method==="GET"){
   const body='<form action="/v1/feedback/email/unsubscribe" method="post"><input type="hidden" name="id" value="'+escapeHTML(id)+'"><input type="hidden" name="token" value="'+escapeHTML(token)+'"><button type="submit" style="background:#6554ae;color:white;padding:12px 18px;border:0;border-radius:9px;cursor:pointer">'+escapeHTML(copy.unsubscribe)+'</button></form>';
   return new Response('<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>L1nG</title><body style="margin:0;background:#f7f7f5;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif"><main style="background:white;padding:36px;border:1px solid #ddd;border-radius:16px"><h1>L1nG</h1>'+body+'</main></body></html>',{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","referrer-policy":"no-referrer"}});
 }
 await env.DB.prepare("UPDATE email_notifications SET state='disabled',verify_hash=NULL,verify_expires_at=NULL WHERE feedback_id=? AND unsubscribe_hash=?").bind(id,hash).run();
 return mailPage(copy.disabled,"");
}
function emailStatusData(item){
 if(!item)return null;
 const sent=Date.parse(item.last_verification_sent_at||"");
 return {state:item.state,language:item.language,expiresAt:item.state==="pending"?item.verify_expires_at:null,resendAt:Number.isFinite(sent)?new Date(sent+EMAIL_RESEND_MS).toISOString():null};
}
async function emailStatus(req,env){
 let body;try{body=await req.json()}catch(_){return fail("查詢格式不正確。")}
 const row=await verifiedReceipt(env,body.receipt);if(!row)return fail("私人憑證無效或查無資料。",404);
 const item=await env.DB.prepare("SELECT state,verify_expires_at,last_verification_sent_at,language FROM email_notifications WHERE feedback_id=?").bind(row.id).first();
 return json({ok:true,email:emailStatusData(item),serverNow:now()});
}
async function resendEmail(req,env){
 let body;try{body=await req.json()}catch(_){return fail("查詢格式不正確。")}
 const row=await verifiedReceipt(env,body.receipt);if(!row)return fail("私人憑證無效或查無資料。",404);
 const item=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=?").bind(row.id).first();
 if(!item || !["pending","delivery_unavailable"].includes(item.state))return fail("此回饋不需要重新驗證。",409);
 if(item.last_verification_sent_at && Date.now()-Date.parse(item.last_verification_sent_at)<EMAIL_RESEND_MS)return fail("請稍後再重新寄送。",429);
 const sent=await createVerificationEmail(env,row.id,item.email,item.language,true);
 if(!sent)return fail("寄送服務暫時不可使用。",503);
 const updated=await env.DB.prepare("SELECT state,verify_expires_at,last_verification_sent_at,language FROM email_notifications WHERE feedback_id=?").bind(row.id).first();
 return json({ok:true,email:emailStatusData(updated),serverNow:now()});
}
async function notifyAdminReply(env,feedback,replyId){
 const item=await env.DB.prepare("SELECT * FROM email_notifications WHERE feedback_id=? AND state='verified'").bind(feedback.id).first();
 if(!item)return;
 const claim=await env.DB.prepare("INSERT OR IGNORE INTO email_delivery (reply_id,feedback_id,status,updated_at) VALUES (?,?,?,?) RETURNING reply_id").bind(replyId,feedback.id,"failed",now()).first();
 if(!claim)return;
 // 同一筆回饋的取消通知連結保持穩定；否則收到下一封通知後，舊信連結會失效。
 // 使用伺服器端祕密簽發不可猜測的 URL token，D1 僅保存其雜湊，不附加私人憑證。
 if(!feedback.receipt_hash)return;
 // 以每筆對話獨立的隨機憑證雜湊衍生 token，避免輪替 Resend API Key 導致舊郵件失效。
 const key=await crypto.subtle.importKey("raw",enc.encode(feedback.receipt_hash),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const token=b64(await crypto.subtle.sign("HMAC",key,enc.encode("feedback-email-unsubscribe:v1:"+feedback.id)));
 const copy=emailCopy[emailLang(item.language)],hash=await sha256(token);
 await env.DB.prepare("UPDATE email_notifications SET unsubscribe_hash=? WHERE feedback_id=?").bind(hash,feedback.id).run();
 const url="https://l1ng-feedback-api.zpl74520.workers.dev/v1/feedback/email/unsubscribe?id="+encodeURIComponent(feedback.id)+"&token="+encodeURIComponent(token);
 // The email link opens the site's existing private-feedback interface, never carries a receipt.
 const feedbackUrl=feedback.source==="Genealogy"
   ?"https://genealogy-tool.by-l1ng.com/#my-feedback"
   :"https://realdate.by-l1ng.com/feedback.html#my-feedback";
 const plain=copy.replyTitle+"\n\n"+copy.replyBody+"\n\n"+copy.replyAction+": "+feedbackUrl+"\n\n"+copy.unsubscribe+": "+url;
 const sent=await sendPlayerEmail(env,item.email,copy.replySubject,emailHtml(copy,copy.replyTitle,copy.replyBody,copy.replyAction,feedbackUrl,url),plain,"reply/"+replyId);
 await env.DB.prepare("UPDATE email_delivery SET status=?,updated_at=? WHERE reply_id=?").bind(sent?"sent":"failed",now(),replyId).run();
}


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
// 回饋通知僅在 D1 已成功儲存後觸發；內容不含匿名憑證、聯絡方式與附件。
// 管理員登入白名單可作為初始收件者；日後可用 FEEDBACK_NOTIFY_EMAILS 獨立指定。
const feedbackNotificationRecipients = env => [...new Set(
  text(env.FEEDBACK_NOTIFY_EMAILS || env.ADMIN_EMAIL)
    .split(",").map(email=>email.trim().toLowerCase())
    .filter(email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
)];
// HTML 郵件只使用內嵌樣式；玩家輸入插入 HTML 前必須跳脫。
const escapeFeedbackHtml = value => String(value ?? "").replace(/[&<>"']/g,char=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[char]);
const feedbackAdminUrl = "https://home.by-l1ng.com/feedback/admin.html";
const feedbackCategoryName = category => ({bug:"問題回報",feature:"功能建議",other:"其他回饋"})[category] || "玩家回饋";
function renderFeedbackEmail({type,source,category,version,gameVersion,id,timestamp,preview}){
  const title=type==="created"?"收到新的玩家回饋":"玩家新增後續留言";
  const description=type==="created"?"一位玩家提交了新的回饋。":"一位玩家補充了既有回饋的內容。";
  const rows=[
    ["作品",source],["回饋類型",feedbackCategoryName(category)],
    ...(version?[["模組版本",version]]:[]),
    ...(gameVersion?[["遊戲版本",gameVersion]]:[]),
    ["提交時間",timestamp],["回饋編號",id]
  ].map(([label,value])=>'<tr><td style="padding:9px 14px 9px 0;color:#817b91;font-size:12px;vertical-align:top;white-space:nowrap;">'+escapeFeedbackHtml(label)+'</td><td style="padding:9px 0;color:#2d2838;font-size:13px;font-weight:600;line-height:1.5;overflow-wrap:anywhere;">'+escapeFeedbackHtml(value)+'</td></tr>').join("");
  const previewHtml=escapeFeedbackHtml(preview).replace(/\r\n|\r|\n/g,"<br>");
  return [
    '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#f5f3f8;color:#302b3a;font-family:Arial,sans-serif;">',
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">'+escapeFeedbackHtml(description)+' '+escapeFeedbackHtml(source)+'</div>',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f3f8;"><tr><td align="center" style="padding:32px 14px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e7e2ee;border-radius:16px;overflow:hidden;">',
    '<tr><td style="padding:26px 30px;background:#6657aa;color:#ffffff;">',
    '<div style="font-size:24px;font-weight:800;letter-spacing:0.4px;line-height:1.2;">L1nG</div>',
    '<div style="margin-top:7px;color:#eeeafa;font-size:11px;letter-spacing:2px;font-weight:700;">FEEDBACK NOTIFICATION</div></td></tr>',
    '<tr><td style="padding:29px 30px 14px;">',
    '<div style="color:#282332;font-size:21px;font-weight:700;line-height:1.45;">'+escapeFeedbackHtml(title)+'</div>',
    '<p style="font-size:14px;color:#706a7d;line-height:1.8;margin:9px 0 18px;">'+escapeFeedbackHtml(description)+'</p>',
    '<div style="border-top:1px solid #ece8f0;padding-top:12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'+rows+'</table></div>',
    '<div style="margin-top:22px;padding:16px 17px;border-radius:10px;background:#f5f3f8;">',
    '<div style="margin-bottom:8px;color:#736a8d;font-size:11px;letter-spacing:1px;font-weight:700;">'+(type==="created"?"回饋內容":"新增留言")+'</div>',
    '<div style="font-size:14px;line-height:1.85;color:#34303d;overflow-wrap:anywhere;">'+previewHtml+'</div></div>',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td bgcolor="#6657aa" style="border-radius:8px;">',
    '<a href="'+feedbackAdminUrl+'" style="display:inline-block;padding:13px 23px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">前往管理中心 →</a>',
    '</td></tr></table></td></tr>',
    '<tr><td style="padding:18px 30px 24px;color:#87808f;font-size:12px;line-height:1.7;">',
    '此信件由 L1nG 回饋系統自動發送，請至管理中心查看完整內容與附件。',
    '</td></tr></table></td></tr></table></body></html>'
  ].join("");
}

function notifyFeedback(env,ctx,{type,id,source,category,version,gameVersion,createdAt,message}){
  if(!env.FEEDBACK_EMAIL || typeof env.FEEDBACK_EMAIL.send!=="function")return;
  const recipients=feedbackNotificationRecipients(env);
  if(!recipients.length)return;
  const subject="[L1nG] "+source+" · "+(type==="created"?"新玩家回饋":"玩家後續留言");
  const preview=clean(message,220);
  const html=renderFeedbackEmail({type,source,category,version,gameVersion,id,timestamp:new Date(createdAt).toLocaleString("zh-TW",{timeZone:"Asia/Taipei",hour12:false}),preview});
  const timestamp=new Date(createdAt).toLocaleString("zh-TW",{timeZone:"Asia/Taipei",hour12:false});
  const body=[
    type==="created"?"收到新的玩家問題回饋。":"玩家在既有回饋中新增留言。",
    "作品："+source,
    "回饋編號："+id,
    "類型："+category,
    ...(version?["模組版本："+version]:[]),
    ...(gameVersion?["遊戲版本："+gameVersion]:[]),
    "時間（台灣）："+timestamp,
    "",
    "內容預覽：",
    preview,
    "",
    "管理中心："+feedbackAdminUrl
  ].join("\n");
  const from=text(env.FEEDBACK_NOTIFY_SENDER)||"notify@by-l1ng.com";
  const task=Promise.all(recipients.map(async to=>{
    try{await env.FEEDBACK_EMAIL.send({from:{email:from,name:"L1nG Notifications"},to,subject,html,text:body});}
    catch(error){console.error("Feedback email notification failed:",error?.code||"SEND_FAILED");}
  }));
  // waitUntil 確保回應後仍能完成寄信；寄信失敗不可影響玩家已完成的提交。
  if(ctx && typeof ctx.waitUntil==="function")ctx.waitUntil(task);
  else void task;
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
async function createFeedback(req,env,origin,ctx){
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
    if(data.emailNotify)statements.push(env.DB.prepare("INSERT INTO email_notifications (feedback_id,email,language,state) VALUES (?,?,?, 'pending')").bind(id,data.contactValue,data.language));
    await env.DB.batch(statements);
  }catch(_){
    if(env.ATTACHMENTS)await Promise.allSettled(saved.map(a=>env.ATTACHMENTS.delete(a.key)));
    return fail("儲存回饋失敗，請稍後再試。",503);
  }
  notifyFeedback(env,ctx,{type:"created",id,source:data.source,category:data.category,version:data.version,gameVersion:data.gameVersion,createdAt:created,message:data.message});
  let emailState=null;
  if(data.emailNotify){
    try{emailState=await createVerificationEmail(env,id,data.contactValue,data.language)?"pending":"delivery_unavailable";}
    catch(_){emailState="delivery_unavailable";}
  }
  const notification=data.emailNotify?await env.DB.prepare("SELECT state,verify_expires_at,last_verification_sent_at,language FROM email_notifications WHERE feedback_id=?").bind(id).first():null;
  return json({ok:true,id,receipt:secret?id+":"+secret:null,status:"pending",emailState,email:emailStatusData(notification),serverNow:now()},201);
}
async function lookup(req,env){
  let body;try{body=await req.json();}catch(_){return fail("查詢格式不正確。");}
  const limited=await enforceRateLimit(req,env,"lookup",120);
  if(!limited.ok)return fail(limited.error,limited.status);
  const row=await verifiedReceipt(env,body.receipt);if(!row)return fail("私人憑證無效或查無資料。",404);
  const record=await readRecord(env,row.id);
  return json({ok:true,feedback:formatFeedback(record.row,record.messages,record.attachments)});
}
async function reply(req,env,origin,ctx){
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
  notifyFeedback(env,ctx,{type:"reply",id:row.id,source:row.source,category:row.category,version:row.version,gameVersion:row.game_version,createdAt:created,message:body});
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
async function admin(req,env,path,ctx){
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
    const created=now(),replyId=crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO replies (id,feedback_id,author,body,created_at) VALUES (?,?,?,?,?)").bind(replyId,id,"admin",msg,created),
      env.DB.prepare("UPDATE feedback SET status='progress',updated_at=? WHERE id=?").bind(created,id)
    ]);
    const notifyTask=notifyAdminReply(env,record.row,replyId).catch(()=>{});
    if(ctx && typeof ctx.waitUntil==="function")ctx.waitUntil(notifyTask);
    else await notifyTask;
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
  async fetch(request,env,ctx){
    const url=new URL(request.url),path=url.pathname.replace(/\/+$/,"")||"/";
    if(path==="/health"&&request.method==="GET")return json({ok:true,service:"l1ng-feedback-api"});
    if(!env.DB)return fail("回饋資料庫尚未連接。",503);
    if(path==="/v1/feedback/email/verify"&&request.method==="GET")return verifyEmailLink(request,env);
    if(path==="/v1/feedback/email/unsubscribe"&&["GET","POST"].includes(request.method))return unsubscribeEmailLink(request,env);
    const adminPrefix="/feedback/admin-api";
    // 管理請求僅從首頁同網域的專用 Worker Route 進入，不接受 workers.dev 直連。
    // Cloudflare Access 必須保護 home.by-l1ng.com/feedback/admin-api/*。
    if(url.hostname==="home.by-l1ng.com" && path.startsWith(adminPrefix+"/")){
      const adminPath="/v1/admin"+path.slice(adminPrefix.length);
      return admin(request,env,adminPath,ctx);
    }
    if(path.startsWith("/v1/admin/")){
      return fail("管理端點只能透過受保護的網站路徑存取。",403);
    }
    const origin=request.headers.get("origin");
    if(!validOrigin(origin,env))return fail("不允許的網站來源。",403);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
    let result;
    try{
      if(path==="/v1/feedback"&&request.method==="POST")result=await createFeedback(request,env,origin,ctx);
      else if(path==="/v1/feedback/lookup"&&request.method==="POST")result=await lookup(request,env);
      else if(path==="/v1/feedback/reply"&&request.method==="POST")result=await reply(request,env,origin,ctx);
      else if(path==="/v1/feedback/email/status"&&request.method==="POST")result=await emailStatus(request,env);
      else if(path==="/v1/feedback/email/resend"&&request.method==="POST")result=await resendEmail(request,env);
      else result=fail("找不到端點。",404);
    }catch(_){result=fail("服務暫時無法處理請求。",503);}
    const headers=new Headers(result.headers);
    for(const [k,v] of Object.entries(cors(origin)))headers.set(k,v);
    return new Response(result.body,{status:result.status,headers});
  }
};