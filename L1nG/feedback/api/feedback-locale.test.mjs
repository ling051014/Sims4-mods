// Offline multilingual regression for public site UI; intentionally excludes the mods catalog.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const bilingual=[
  'RealDate/index.html','RealDate/gameplay.html','RealDate/download.html',
  'RealDate/compatibility.html','RealDate/changelog.html','RealDate/roadmap.html',
  'RealDate/faq.html','GenealogyExporter/genealogy-exporter.html','site-info.html'
];
test('Non-catalog static bilingual pages preserve matching zh-Hant/en blocks',()=>{
 for(const path of bilingual){
   const html=read(path);
   const zh=(html.match(/data-lang="zh-Hant"/g)||[]).length;
   const en=(html.match(/data-lang="en"/g)||[]).length;
   assert.ok(zh>0, path+' has no bilingual content');
   assert.equal(zh,en,path+' bilingual blocks differ');
 }
});
test('RealDate translates dynamic feedback receipt, updated-at, status and rate-limit errors',()=>{
 const script=read('feedback/feedback-i18n.js');
 for(const term of ['回饋編號','更新時間：','等待管理員回覆','每 60 秒自動更新，切回頁面會立即檢查。','私人憑證無效或查無資料。','查詢已達限制，請稍後再試。']){
   assert.ok(script.includes(term),term+' is missing from translations');
 }
 assert.match(script,/original\.set\(node,trim\)/);
 assert.match(script,/rendered\.get\(node\)/);
 const core=read('feedback/feedback-core.js');
 assert.match(core,/L1nGFeedbackI18n/);
 assert.match(core,/LING_I18N/);
});
test('Genealogy locale catalogs translate email prompts and API failure states',()=>{
 const en=JSON.parse(read('GenealogyExporter/locales/en.json')).messages;
 const zh=JSON.parse(read('GenealogyExporter/locales/zh-CN.json')).messages;
 for(const key of ['管理員回覆時，透過 Email 通知我','提交後會寄送驗證信，完成驗證才會啟用回覆通知。','私人憑證無效或查無資料。','請稍後再重新寄送。','回饋來源與提交網站不一致。']){
   assert.ok(en[key]&&zh[key],key+' must exist in both locales');
   assert.doesNotMatch(en[key],/[\u3400-\u9fff]/,key+' English must not contain Chinese');
 }
 const i18n=read('GenealogyExporter/genealogy_i18n.js');
 assert.match(i18n,/feedbackCode/);
});
test('Worker verification and notification emails have three localized copies',()=>{
 const worker=read('feedback/api/worker.js');
 for(const language of ['"zh-Hant":','"zh-Hans":','"en":'])assert.ok(worker.includes(language));
 for(const label of ['verifyValidity:','verifySubject:','replySubject:','expiredHelp:','unsubscribe:'])assert.equal((worker.match(new RegExp(label,'g'))||[]).length,3);
});
test('Both opt-ins space their text; only Family Tree uses the existing themed checkbox',()=>{
 const rd=read('feedback/feedback.css'),gen=read('GenealogyExporter/genealogy.css');
 assert.match(rd,/\.feedback-email-option \.optional\{margin-inline-start:\.85em\}/);
 assert.match(gen,/\.genealogy-feedback-email-option \.genealogy-feedback-optional\{margin-inline-start:\.85em\}/);
 assert.match(gen,/\.genealogy-feedback-email-option input\[type="checkbox"\]:checked/);
 assert.doesNotMatch(rd,/\.feedback-email-option input\[type="checkbox"\]:checked/);
});
