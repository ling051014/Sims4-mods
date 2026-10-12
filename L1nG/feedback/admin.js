/* L1nG 管理中心：僅後台介面。資料端點未接線時不虛構回饋或分析數字。 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let page='overview';let entries=[];let current=null;let status='all';
const idList=['all','pending','progress','done','spam'];
function label(s){return({pending:'尚未處理',progress:'處理中',done:'已完成',spam:'垃圾訊息'})[s]||s}
function notify(message){const t=$('toast');if(!t)return;t.textContent=message;t.classList.add('show');}
function showPage(next){
 if(!['overview','analytics','feedback','settings'].includes(next))return;
 page=next;
 for(const name of ['overview','analytics','feedback','settings']){
  const panel=$('panel-'+name);if(panel)panel.hidden=name!==next;
 }
 document.querySelectorAll('[data-adminpage]').forEach(b=>{const active=b.dataset.adminpage===next;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 const area=document.querySelector('.admin-main');if(area)area.scrollTop=0;
}
function render(){
 for(const key of idList){
  const n=key==='all'?entries.length:entries.filter(e=>e.status===key).length;
  if($('count-'+key))$('count-'+key).textContent=n;
  if($('nav-count-'+key))$('nav-count-'+key).textContent=n;
 }
 if($('ov-pending'))$('ov-pending').textContent=entries.filter(e=>e.status==='pending').length;
 if($('list-count'))$('list-count').textContent=entries.length+' 則';
 const q=($('search-input')?.value||'').trim().toLowerCase();
 const list=entries.filter(e=>(status==='all'||e.status===status)&&
 (($('site-filter')?.value||'all')==='all'||e.site===$('site-filter').value)&&
 (($('contact-filter')?.value||'all')==='all'||(!!e.contact===($('contact-filter').value==='contact')))&&
 (($('reply-filter')?.value||'all')==='all'||e.replyState===$('reply-filter').value)&&
 (!q||(e.title+' '+e.message+' '+e.id).toLowerCase().includes(q)));
 const root=$('feedback-rows');if(!root)return;root.replaceChildren();
 if(!list.length){const el=document.createElement('div');el.className='empty-inbox';el.textContent=entries.length?'沒有符合條件的回饋。':'目前沒有回饋紀錄。';root.appendChild(el);return;}
 for(const e of list){
  const row=document.createElement('button');row.type='button';row.className='feedback-row';row.textContent=e.title+'　'+e.site+'　'+label(e.status);row.addEventListener('click',()=>openDetail(e));root.appendChild(row);
 }
}
function openDetail(e){current=e;$('detail-layer')?.classList.add('open');$('detail-layer')?.setAttribute('aria-hidden','false');if($('detail-title'))$('detail-title').textContent=e.title;if($('detail-body'))$('detail-body').textContent=e.message;if($('detail-status'))$('detail-status').value=e.status}
function closeDetail(){$('detail-layer')?.classList.remove('open');$('detail-layer')?.setAttribute('aria-hidden','true')}
function activateTheme(){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next}
document.querySelectorAll('[data-adminpage]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.adminpage)));
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.jump)));
document.querySelectorAll('[data-status],[data-mobilefilter]').forEach(b=>b.addEventListener('click',()=>{
 status=b.dataset.status||b.dataset.mobilefilter||'all';showPage('feedback');
 document.querySelectorAll('[data-status],[data-mobilefilter]').forEach(x=>x.classList.toggle('active',(x.dataset.status||x.dataset.mobilefilter)===status));
 render();
}));
for(const id of ['search-input','site-filter','contact-filter','reply-filter'])$(id)?.addEventListener('input',render);
document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('active',x===b));
 if($('custom-date-row'))$('custom-date-row').hidden=b.dataset.range!=='custom';
}));
$('apply-date')?.addEventListener('click',()=>{
 const from=$('date-from')?.value,to=$('date-to')?.value;const error=$('date-error');
 if(!error)return;error.textContent=(!from||!to||from>to)?'請選擇正確的日期範圍。':'';
});
$('settings-theme')?.addEventListener('click',activateTheme);
$('detail-close')?.addEventListener('click',closeDetail);
$('detail-layer')?.addEventListener('click',e=>{if(e.target===$('detail-layer'))closeDetail()});
$('detail-update')?.addEventListener('click',()=>notify('目前尚未連接管理服務，無法儲存變更。'));
$('detail-delete')?.addEventListener('click',()=>notify('目前尚未連接管理服務，無法刪除回饋。'));
$('admin-send')?.addEventListener('click',()=>notify('目前尚未連接回覆服務。'));
$('cancel-delete')?.addEventListener('click',()=>{$('confirm-layer')?.setAttribute('aria-hidden','true')});
$('confirm-delete')?.addEventListener('click',()=>notify('目前尚未連接管理服務。'));
for(const id of ['ga-users','ga-views','ga-downloads','ga-new','ov-users','ov-views','ov-downloads'])if($(id))$(id).textContent='—';
if($('overview-chart'))$('overview-chart').innerHTML='<span class="empty-data">尚未連接網站分析資料。</span>';
if($('overview-recent'))$('overview-recent').textContent='目前沒有回饋紀錄。';
for(const id of ['ga-countries','ga-pages','ga-devices','ga-referrals','ga-trend-chart','analytics-traffic-chart'])if($(id))$(id).textContent='尚未連接資料來源。';
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail()});
showPage('overview');render();
})();