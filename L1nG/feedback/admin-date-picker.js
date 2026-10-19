/* 管理中心日期範圍：雙月桌面、單月手機；點選起點後懸停預覽，完成後才提交。 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const pop=$('admin-date-popover'), trigger=$('admin-date-range-trigger');
const custom=document.querySelector('[data-range="custom"]');
const from=$('date-from'),to=$('date-to'),apply=$('apply-date');
if(!pop||!trigger||!from||!to||!apply)return;
const today=()=>window.L1nGAdminTime?.today?.()||new Date().toLocaleDateString('en-CA');
const iso=(y,m,d)=>[y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
const parse=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Date(Number(value.slice(0,4)),Number(value.slice(5,7))-1,Number(value.slice(8,10))):null;
const monthAt=(y,m)=>new Date(y,m,1);
const format=value=>value?value.replace(/-/g,'/'): '—';
const spanDays=(a,b)=>Math.round(Math.abs(Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
const mobile=()=>matchMedia('(max-width:700px)').matches;
let anchor=monthAt(new Date().getFullYear(),new Date().getMonth()),open=false,source=null;
let start='',end='',hover='',selectingEnd=false;
function summary(){
 const text=from.value&&to.value?format(from.value)+' – '+format(to.value):'選擇日期範圍';
 trigger.querySelector('.admin-date-value').textContent=text;
 trigger.setAttribute('aria-label','日期範圍：'+text);
}
function status(text){
 $('admin-date-hint').textContent=text;
 $('admin-date-summary').textContent=start?(format(start)+(end?' – '+format(end):hover?' – '+format(hover):' – …')):'尚未選擇';
 apply.disabled=!(start&&end&&!selectingEnd);
}
function styleDays(){
 const preview=selectingEnd&&hover?hover:end;
 const lower=start&&preview?(start<preview?start:preview):start;
 const upper=start&&preview?(start>preview?start:preview):start;
 for(const day of pop.querySelectorAll('.admin-date-day')){
  const value=day.dataset.date;
  day.classList.toggle('range-middle',Boolean(lower&&upper&&value>lower&&value<upper));
  day.classList.toggle('range-start',Boolean(start&&value===start));
  day.classList.toggle('range-end',Boolean(preview&&value===preview));
  day.classList.toggle('range-preview',Boolean(selectingEnd&&hover&&value>=lower&&value<=upper));
  day.classList.toggle('range-selected',Boolean(!selectingEnd&&start&&end&&value>=lower&&value<=upper));
  day.setAttribute('aria-pressed',String(Boolean(value===start||(!selectingEnd&&value===end))));
 }
 $('admin-date-summary').textContent=start?(format(start)+(end?' – '+format(end):hover?' – '+format(hover):' – …')):'尚未選擇';
}
function pick(value){
 if(!selectingEnd||!start){
  start=value;end='';hover='';selectingEnd=true;
  status('已選擇開始日期，請選擇結束日期（最多 366 天）');
 }else{
  if(spanDays(start,value)>365){
   status('日期區間最多 366 天，請選擇更近的日期');return;
  }
  const first=start<value?start:value,last=start<value?value:start;
  start=first;end=last;hover='';selectingEnd=false;
  status('已選擇完整區間，按「套用日期」開始查詢');
 }
 styleDays();
}
function render(){
 const cols=mobile()?1:2,limit=today();
 const months=$('admin-date-months');months.replaceChildren();
 for(let i=0;i<cols;i++){
  const m=monthAt(anchor.getFullYear(),anchor.getMonth()+i);
  const y=m.getFullYear(),mo=m.getMonth();
  const month=document.createElement('section');
  month.className='admin-calendar-month';
  const label=document.createElement('h3');label.textContent=y+' 年 '+(mo+1)+' 月';
  month.append(label);
  const weekdays=document.createElement('div');weekdays.className='admin-date-weekdays';
  for(const wd of ['日','一','二','三','四','五','六']){
   const el=document.createElement('span');el.textContent=wd;weekdays.append(el);
  }
  month.append(weekdays);
  const days=document.createElement('div');days.className='admin-date-days';
  days.setAttribute('role','group');days.setAttribute('aria-label',label.textContent);
  const shift=new Date(y,mo,1).getDay(),last=new Date(y,mo+1,0).getDate();
  for(let d=0;d<shift;d++){const el=document.createElement('span');el.className='admin-date-blank';days.append(el);}
  for(let d=1;d<=last;d++){
   const value=iso(y,mo,d),button=document.createElement('button');
   button.type='button';button.className='admin-date-day';button.dataset.date=value;
   button.textContent=d;button.setAttribute('aria-label',value);
   button.disabled=value>limit;
   if(value===limit)button.classList.add('is-today');
   button.addEventListener('click',()=>pick(value));
   button.addEventListener('pointerenter',event=>{
    if(event.pointerType!=='touch'&&selectingEnd&&value<=limit){hover=value;styleDays();}
   });
   button.addEventListener('focus',()=>{if(selectingEnd){hover=value;styleDays();}});
   days.append(button);
  }
  days.addEventListener('pointerleave',event=>{
   if(event.pointerType!=='touch'&&selectingEnd){hover='';styleDays();}
  });
  month.append(days);months.append(month);
 }
 const first=anchor, last=monthAt(anchor.getFullYear(),anchor.getMonth()+cols-1);
 $('admin-date-month').textContent=first.getFullYear()+' 年 '+(first.getMonth()+1)+' 月'+
  (cols===2?' – '+last.getFullYear()+' 年 '+(last.getMonth()+1)+' 月':'');
 pop.querySelector('[data-calendar-step="1"]').disabled=last>=monthAt(Number(limit.slice(0,4)),Number(limit.slice(5,7))-1);
 styleDays();
}
function place(){
 if(!open||pop.hidden||!source)return;
 const r=source.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
 const left=Math.max(8,Math.min(r.left,innerWidth-w-8));
 const below=innerHeight-r.bottom,above=r.top;
 pop.style.left=left+'px';
 pop.style.top=(below>=h+8||below>=above?r.bottom+7:Math.max(8,r.top-h-7))+'px';
 pop.style.maxHeight='calc(100dvh - 16px)';
}
function close(restore=false){
 if(!open)return;
 open=false;pop.hidden=true;trigger.setAttribute('aria-expanded','false');
 if(restore)source?.focus({preventScroll:true});
 source=null;
}
function show(sourceButton=trigger){
 if(open){close();return;}
 source=sourceButton;open=true;start=from.value||'';end=to.value||'';
 hover='';selectingEnd=false;
 const date=parse(end||today())||new Date();
 anchor=monthAt(date.getFullYear(),date.getMonth()-(mobile()?0:1));
 pop.hidden=false;trigger.setAttribute('aria-expanded','true');
 status('先點選開始日期，再點選結束日期；滑鼠移動可預覽區間');
 render();place();
}
trigger.addEventListener('click',()=>show(trigger));
custom?.addEventListener('click',()=>queueMicrotask(()=>{
 if(!$('custom-date-row').hidden&&!open)show(trigger);
}));
pop.querySelectorAll('[data-calendar-step]').forEach(btn=>btn.addEventListener('click',()=>{
 anchor=monthAt(anchor.getFullYear(),anchor.getMonth()+Number(btn.dataset.calendarStep));
 render();place();
}));
apply.addEventListener('click',()=>{
 if(!open||!start||!end||selectingEnd)return;
 from.value=start;to.value=end;
 for(const input of [from,to])input.dispatchEvent(new Event('change',{bubbles:true}));
 summary();close(false);
 document.dispatchEvent(new Event('l1ng:analytics-date-applied'));
});
$('admin-date-close').addEventListener('click',()=>close(true));
document.addEventListener('pointerdown',event=>{
 if(open&&!pop.contains(event.target)&&!trigger.contains(event.target)&&!custom?.contains(event.target))close();
});
document.addEventListener('keydown',event=>{if(open&&event.key==='Escape'){event.preventDefault();close(true);}});
window.addEventListener('resize',()=>{if(open){render();place();}});
document.addEventListener('scroll',place,{capture:true,passive:true});
for(const input of [from,to])input.addEventListener('change',summary);
window.L1nGAdminDatePicker={refresh:summary,close:()=>close(false)};
summary();
})();