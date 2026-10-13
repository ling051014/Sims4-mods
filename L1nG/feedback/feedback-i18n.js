/* RealDate 回饋頁共用繁中／英文狀態，處理靜態與動態欄位。 */
(()=>{'use strict';
const dictionary=new Map(Object.entries({
'問題反饋':'Feedback','你的想法，讓RealDate變得更好。':'Your feedback helps make RealDate better.','遇到問題了嗎？':'Need help?','告訴我就好。':'Let me know.','從日期顯示、模組相容，到遊戲內的操作異常，都歡迎回報。寫下遇到的狀況，必要時可以附上截圖或錯誤紀錄。':'From date displays and mod compatibility to in-game issues, tell me what happened. Attach a screenshot or error log if needed.',
'無需登入':'No sign-in required','對話由玩家選擇':'Conversations are optional','附件可選填':'Attachments optional','查看我的回饋 →':'View my feedback →','選擇回饋類型':'Choose a category','錯誤回報或功能建議都可以。':'Bug reports and ideas are welcome.','描述發生的狀況':'Describe what happened','如有需要，選擇模組版本並附上相關紀錄。':'Choose the mod version and attach logs if relevant.','選擇後續方式':'Choose how to follow up','需要雙向對話時，再建立私人憑證。':'Create a private receipt only if you want two-way replies.',
'回饋類型':'Feedback category','錯誤回報':'Bug report','功能建議':'Feature suggestion','其他意見':'Other feedback','回饋對象':'Feedback about','RealDate 模組':'RealDate mod','RealDate 網站':'RealDate website','問題發生在哪裡？':'Where is the issue?','網站版本將由正式網站自動記錄，不需要手動填寫。':'Website version is recorded automatically.','使用的模組版本':'Installed mod version','依目前網站版本紀錄列出':'Based on public releases','請選擇版本':'Choose a version','其他版本（手動填寫）':'Other version (enter manually)','不確定':'Not sure','其他版本號':'Other version','不知道安裝哪一版？查看確認方式':'Not sure which version? Find out how','找不到原下載檔？':'Lost the downloaded file?','查看 RealDate 更新日誌 ↗':'View RealDate changelog ↗','遊戲版本':'Game version','回饋內容':'Feedback details','至少 10 字':'At least 10 characters','請勿填寫帳號、密碼或其他敏感資訊。':'Do not include passwords or other sensitive details.','附加檔案':'Attachments','最多 3 個 · 合計 20 MB':'Up to 3 files · 20 MB total','新增截圖或錯誤紀錄':'Add screenshot or error log','點擊選擇檔案 · 電腦亦可拖曳':'Select files or drag them here',
'是否需要後續對話？':'Would you like a reply?','由你決定':'Your choice','只送出這次回饋':'Submit once','不建立聊天室，也不需要保存私人憑證。':'No conversation or private receipt needed.','建立匿名對話':'Start an anonymous conversation','想收到回覆、補充資訊時再選擇；不用 Email。':'Get replies and follow up without email.','選擇匿名對話不代表管理員目前在線，回覆可能不是即時的。':'Replies may not be immediate, even with an anonymous conversation.',
'其他聯絡方式':'Other contact details','不留 Email 也能用私人憑證在網站接收回覆。':'Use a private receipt to receive replies without email.','聯絡方式':'Contact method','電子郵件':'Email','聯絡資料':'Contact details','未填寫就維持匿名。此欄僅供本次問題回覆，不會用於網站分析。':'Leave this blank to remain anonymous. Contact details are only used for replies.','安全驗證':'Security check','人機驗證':'Human verification','Cloudflare 驗證服務':'Cloudflare verification','驗證':'Verify','驗證服務尚未啟用。':'Verification is currently unavailable.',
'Cloudflare 安全驗證':'Cloudflare security check','正在載入 Cloudflare 安全驗證…':'Loading Cloudflare security check…','重新載入驗證':'Reload verification','安全驗證已完成。':'Security check completed.','請完成上方的安全驗證。':'Please complete the security check above.','驗證已過期，請重新完成驗證。':'Verification expired. Please complete the check again.','安全驗證發生問題，請重新載入驗證。':'Security check failed. Please reload verification.','安全驗證載入失敗，請重新載入驗證。':'Security check could not load. Please reload verification.','安全驗證載入逾時，請重新載入驗證。':'Security check timed out. Please reload verification.','預覽不會送出正式回饋':'Previews cannot submit real feedback.','請先完成人機驗證。':'Please complete verification.','請勿提交廣告、垃圾訊息、騷擾或威脅內容；違規回饋可能遭移除或限制提交。':'Do not submit advertising, spam, harassment, or threats. Violating feedback may be removed or blocked.','送出回饋':'Submit feedback','送出':'Submit',
'我的回饋':'My feedback','匿名提交，不需要登入。':'Submit anonymously without signing in.','無法送出，請先確認以下內容':'Unable to submit. Please review the following.','請檢查必填欄位。':'Please check the required fields.','目前暫未開放線上提交，請稍後再試。':'Online submissions are not available yet. Please try again later.','請填寫至少 10 個字的回饋內容。':'Please enter at least 10 characters.','請選擇模組版本，或選擇「不確定」。':'Choose a version, or select Not sure.',
'你的私人回饋憑證':'Your private feedback receipt','複製回饋憑證':'Copy private receipt','已複製回饋憑證':'Receipt copied','請妥善保存。回饋編號本身無法開啟對話；私人憑證則相當於密碼，請勿公開。':'Keep this receipt safe. The feedback number cannot open a conversation; the receipt acts like a password.','再寫一則':'Send another','查看匿名對話':'View anonymous conversation','我的匿名回饋':'My anonymous feedback','開啟匿名對話的玩家，才能在此查看回覆。':'Only people with a private receipt can view these replies.','返回填寫':'Back to form','使用私人憑證開啟對話':'Open a conversation with a private receipt','開啟對話':'Open conversation','補充資訊或回覆管理員':'Add details or reply','選擇附件':'Attach files','送出回覆':'Send reply','返回我的回饋':'Back to my feedback','目前暫未開放線上對話':'Online conversations are currently unavailable.','不支援此檔案格式':'Unsupported file type',
'請描述遇到的情況、操作步驟，或想提出的建議…':'Describe what happened, the steps to reproduce it, or your idea…','在這裡補充問題、回覆或說明結果…':'Add details, reply, or share the outcome…','貼上完整回饋憑證':'Paste your full private receipt','輸入安裝的版本，例如 v0.5 Beta':'Enter your installed version','例如：1.128.XXX':'Example: 1.128.XXX',
'（選填）':'(Optional)','至少 10 字':'At least 10 characters','最多 3 個檔案・合計 20 MB':'Up to 3 files · 20 MB total','回饋編號':'Feedback #','請選擇版本':'Select a version',
'已收到你的回饋！':'Your feedback has been received!','回饋已建立':'Feedback created','未連接網路資料庫。':'Database connection unavailable.'
}));
const roots=[document.getElementById('realdate-preview'),document.getElementById('form-layer')].filter(Boolean);
const original=new WeakMap();const attributes=new WeakMap();let translating=false;
function update(){
if(translating)return;translating=true;
try{
const en=document.documentElement.dataset.language==='en';
for(const root of roots){
const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
let node;
while(node=walker.nextNode()){
 const parent=node.parentElement;if(!parent||parent.closest('script,style,code,svg'))continue;
 const raw=node.nodeValue,trim=raw.trim();
 if(!trim)continue;
 if(!original.has(node))original.set(node,trim);
 const zh=original.get(node);
 const eng=dictionary.get(zh);
 if(!eng)continue;
 const candidate=raw.replace(trim,en?eng:zh);
 if(node.nodeValue!==candidate)node.nodeValue=candidate;
}
for(const el of root.querySelectorAll('[placeholder],[aria-label],[title]')){
 let m=attributes.get(el);if(!m){m={};attributes.set(el,m);}
 for(const k of ['placeholder','aria-label','title']){
  if(!el.hasAttribute(k))continue;
  if(!(k in m))m[k]=el.getAttribute(k);
  const translated=dictionary.get(m[k]);if(translated)el.setAttribute(k,en?translated:m[k]);
 }
}
}
}finally{translating=false}
}
let scheduled=false;
const schedule=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;update()})};
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-language']});
for(const root of roots)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true});
document.querySelectorAll('[data-language-button]').forEach(b=>b.addEventListener('click',schedule));
schedule();
})();