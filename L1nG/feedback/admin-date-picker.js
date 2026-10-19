/* 管理中心專用日期選擇器：使用站內樣式，取代不可客製的原生月曆。 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const pop=$('admin-date-popover');if(!pop)return;
const controls=[...document.querySelectorAll('[data-date-target]')];
const iso=(y,m,d)=>[y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
const parse=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10))):null;
let active=null,year=0,month=0;
function display(input){
 const button=controls.find(x=>x.dataset.dateTarget===input.id);
 if(!button)return;
 const value=input.value;
 button.querySelector('.admin-date-value').textContent=value?value.replace(/-/g,' / '):'選擇日期';
 button.setAttribute('aria-label',(input.id==='date-from'?'開始日期':'結束日期')+'：'+(value||'尚未選擇'));
}
function close(restore=false){
 if(pop.hidden)return;
 pop.hidden=true;
 controls.forEach(x=>x.setAttribute('aria-expanded','false'));
 if(restore)active?.focus({preventScroll:true});
 active=null;
}
function pick(value){
 const input=$(active.dataset.dateTarget);
 input.value=value;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
 display(input);
 close(true);
}
function render(){
 const input=$(active.dataset.dateTarget);
 const selected=input.value;
 const max=input.max||'9999-12-31';
 $('admin-date-month').textContent=year+' 年 '+(month+1)+' 月';
 const grid=$('admin-date-days');grid.replaceChildren();
 const first=new Date(year,month,1).getDay();
 const count=new Date(year,month+1,0).getDate();
 for(let n=0;n<first;n++){const gap=document.createElement('span');gap.className='admin-date-blank';grid.append(gap);}
 const today=window.L1nGAdminTime?.today?.()||'';
 for(let day=1;day<=count;day++){
  const value=iso(year,month,day),button=document.createElement('button');
  button.type='button';button.className='admin-date-day';button.textContent=String(day);
  button.setAttribute('aria-label',value);
  button.disabled=value>max||(input.min&&value<input.min);
  if(value===selected){button.classList.add('selected');button.setAttribute('aria-selected','true');}
  if(value===today)button.classList.add('is-today');
  button.addEventListener('click',()=>pick(value));
  grid.append(button);
 }
 const next=pop.querySelector('[data-calendar-step="1"]');
 next.disabled=iso(year,month,1)>max.slice(0,7)+'-01'||(year>=Number(max.slice(0,4))&&month>=Number(max.slice(5,7))-1);
 $('admin-date-today').disabled=today>max;
}
function place(){
 if(!active||pop.hidden)return;
 const r=active.getBoundingClientRect(),w=pop.offsetWidth;
 const roomBelow=innerHeight-r.bottom,above=innerHeight-roomBelow-r.height;
 pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
 pop.style.top=roomBelow>=pop.offsetHeight+8||roomBelow>=above?r.bottom+6+'px':Math.max(8,r.top-pop.offsetHeight-6)+'px';
}
controls.forEach(button=>button.addEventListener('click',()=>{
 if(active===button&&!pop.hidden){close(true);return;}
 active=button;
 const date=parse($(button.dataset.dateTarget).value)||parse(window.L1nGAdminTime?.today?.())||new Date();
 year=date.getFullYear();month=date.getMonth();
 pop.hidden=false;controls.forEach(x=>x.setAttribute('aria-expanded',String(x===button)));
 render();place();
}));
pop.querySelectorAll('[data-calendar-step]').forEach(button=>button.addEventListener('click',()=>{
 const target=new Date(year,month+Number(button.dataset.calendarStep),1);
 year=target.getFullYear();month=target.getMonth();render();place();
}));
$('admin-date-today').addEventListener('click',()=>{if(active)pick(window.L1nGAdminTime.today());});
$('admin-date-close').addEventListener('click',()=>close(true));
document.addEventListener('pointerdown',event=>{if(active&&!pop.contains(event.target)&&!controls.includes(event.target)&&!controls.some(x=>x.contains(event.target)))close();});
document.addEventListener('keydown',event=>{
 if(!active||pop.hidden)return;
 if(event.key==='Escape'){event.preventDefault();close(true);}
});
window.addEventListener('resize',place);
document.addEventListener('scroll',place,{capture:true,passive:true});
for(const id of ['date-from','date-to']){const input=$(id);if(input){input.addEventListener('change',()=>display(input));display(input);}}
window.L1nGAdminDatePicker={refresh:()=>{for(const id of ['date-from','date-to']){const input=$(id);if(input)display(input);}}};
})();