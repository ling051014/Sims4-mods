/* GA4 Dashboard: authenticated report data, no Google credentials in browser. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const number = n => new Intl.NumberFormat('zh-TW').format(Number(n) || 0);
  const siteLabels = {
    'home.by-l1ng.com':'L1nG',
    'realdate.by-l1ng.com':'RealDate',
    'genealogy-tool.by-l1ng.com':'族譜工具',
    'genealogy-exporter.by-l1ng.com':'族譜提取器',
    'translations.by-l1ng.com':'漢化專區'
  };
  const labelSite = name => siteLabels[name] || name || '未知網站';
  const node = (tag,cls,text) => {
    const item=document.createElement(tag);
    if(cls)item.className=cls;
    if(text!==undefined)item.textContent=String(text);
    return item;
  };
  const today = () => {
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  function daysBefore(date,offset) {
    const d=new Date(date+'T12:00:00');
    d.setDate(d.getDate()-offset);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  let chosenRange='30',requestId=0;
  const errors={
    FORBIDDEN:'未通過 Cloudflare Access 管理員驗證。請確認登入狀態與管理 API 存取權。',
    AUTH_NOT_CONFIGURED:'尚未設定 Cloudflare Access 管理員驗證變數。',
    GA4_NOT_CONFIGURED:'GA4 資源 ID 或服務帳戶金鑰尚未設定。',
    GA4_UNAVAILABLE:'GA4 查詢失敗，請檢查服務帳戶的檢視者權限與 Google Analytics Data API。',
    INVALID_DATE_RANGE:'日期範圍不正確。',
    INVALID_FILTER:'網站篩選條件不正確。'
  };
  async function fetchReport(site,range) {
    const params=new URLSearchParams({site,startDate:range.start,endDate:range.end});
    const response=await fetch('/feedback/ga4-api?'+params,{
      credentials:'include',cache:'no-store'
    });
    const data=await response.json().catch(()=>null);
    if(response.ok && data?.ok)return data;
    throw Error(errors[data?.error] || '無法讀取 GA4 報表（HTTP '+response.status+'）。');
  }
  const setText=(id,value)=>{if($(id))$(id).textContent=value;};
  function empty(id,message) {
    const root=$(id);if(root)root.replaceChildren(node('p','empty-data',message));
  }
  function list(id,values,makeLabel) {
    const root=$(id);if(!root)return;
    root.replaceChildren();
    const rows=(values||[]).filter(item=>Number(item.value)>0).slice(0,10);
    if(!rows.length){root.append(node('p','empty-data','目前沒有資料。'));return;}
    const max=Math.max(...rows.map(row=>Number(row.value)),1);
    for(const [i,item] of rows.entries()){
      const row=node('div','rank-row'),heading=node('div','rank-top');
      const label=makeLabel(item);
      heading.append(node('span','rank-index',String(i+1).padStart(2,'0')));
      const title=node('span','rank-title',label);title.title=label;
      heading.append(title);
      const amount=node('strong','rank-value',number(item.value));
      const track=node('div','rank-bar-bg'),bar=node('div','rank-bar');
      bar.style.width=String(Math.max(1,Number(item.value)/max*100))+'%';
      track.append(bar);row.append(heading,amount,track);root.append(row);
    }
  }
  function svgElement(tag,attrs={}) {
    const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
    return el;
  }
  function trend(id,series) {
    const root=$(id);if(!root)return;
    root.replaceChildren();
    const points=(series||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
    if(!points.length){empty(id,'目前沒有每日訪客資料。');return;}
    const max=Math.max(1,...points.map(x=>Number(x.value)||0));
    const svg=svgElement('svg',{viewBox:'0 0 760 224',role:'img','aria-label':'GA4 每日活躍使用者趨勢'});
    const left=35,right=741,top=16,bottom=184;
    for(let n=0;n<=4;n++){
      const y=bottom-n*(bottom-top)/4;
      svg.append(svgElement('line',{x1:left,x2:right,y1:y,y2:y,stroke:'currentColor','stroke-opacity':'.13'}));
      const t=svgElement('text',{x:left-7,y:y+4,'text-anchor':'end','font-size':10,fill:'currentColor',opacity:'.65'});
      t.textContent=number(Math.round(max*n/4));svg.append(t);
    }
    const coords=points.map((p,i)=>({
      x:points.length===1?left+(right-left)/2:left+(right-left)*i/(points.length-1),
      y:bottom-(bottom-top)*(Number(p.value)||0)/max
    }));
    const path=coords.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
    const area=path+' L'+coords[coords.length-1].x+' '+bottom+' L'+coords[0].x+' '+bottom+' Z';
    svg.append(svgElement('path',{d:area,fill:'var(--primary)','fill-opacity':'.10'}));
    svg.append(svgElement('path',{d:path,fill:'none',stroke:'var(--primary)','stroke-width':2.5,'stroke-linejoin':'round','stroke-linecap':'round'}));
    const indices=[...new Set([0,Math.floor((points.length-1)/2),points.length-1])];
    for(const idx of indices){
      const p=coords[idx],raw=points[idx].date;
      const t=svgElement('text',{x:p.x,y:210,'text-anchor':idx===0?'start':idx===points.length-1?'end':'middle','font-size':11,fill:'currentColor',opacity:'.6'});
      t.textContent=/^\d{8}$/.test(raw)?raw.slice(4,6)+'/'+raw.slice(6,8):raw;
      svg.append(t);
    }
    root.append(svg);
  }
  function devices(items) {
    const root=$('ga-device');if(!root)return;
    root.replaceChildren();
    const rows=(items||[]).filter(x=>Number(x.value)>0);
    if(!rows.length){empty('ga-device','目前沒有裝置資料。');return;}
    const sum=rows.reduce((n,x)=>n+Number(x.value),0);
    const colors=['var(--primary)','#9298bc','#c3a483','#95abb4','#a6a8a9'];
    let from=0;
    const stops=rows.map((x,i)=>{
      const to=from+100*Number(x.value)/sum;
      const slice=colors[i%colors.length]+' '+from.toFixed(2)+'% '+to.toFixed(2)+'%';
      from=to;return slice;
    });
    const ring=node('div','donut'),legend=node('div','device-legend');
    ring.style.background='conic-gradient('+stops.join(',')+')';
    ring.setAttribute('role','img');
    ring.setAttribute('aria-label',rows.map(x=>x.name+' '+number(x.value)).join('、'));
    for(const [i,item] of rows.entries()){
      const itemRow=node('div','legend-item'),left=node('span');
      const dot=node('span','dot');dot.style.background=colors[i%colors.length];
      left.append(dot,document.createTextNode(item.name||'其他'));
      itemRow.append(left,node('b','',Math.round(100*Number(item.value)/sum)+'%'));legend.append(itemRow);
    }
    root.append(ring,legend);
  }
  function renderAnalytics(data) {
    const s=data.summary||{};
    for(const [id,n] of Object.entries({'ga-users':s.activeUsers,'ga-views':s.views,'ga-downloads':s.downloads,'ga-new':s.newUsers}))
      setText(id,number(n));
    setText('chart-description',data.range.startDate+' 至 '+data.range.endDate+' · 活躍使用者');
    trend('ga-trend-chart',data.trend);
    list('ga-pages',data.pages,x=>labelSite(x.host)+' · '+(x.path||'/'));
    list('ga-countries',data.countries,x=>x.name||'未知');
    list('ga-files',data.downloads,x=>labelSite(x.host));
    list('ga-referrals',data.referrals,x=>x.name||'(direct) / (none)');
    devices(data.devices);
  }
  function renderOverview(data) {
    const s=data.summary||{};
    setText('ov-users',number(s.activeUsers));
    setText('ov-views',number(s.views));
    setText('ov-downloads',number(s.downloads));
    trend('overview-chart',data.trend);
  }
  function resetDetails(message) {
    for(const id of ['ga-users','ga-views','ga-downloads','ga-new'])setText(id,'—');
    for(const id of ['ga-trend-chart','ga-pages','ga-countries','ga-files','ga-referrals','ga-device'])empty(id,message);
  }
  function dateRange() {
    const end=today();
    return chosenRange==='custom'
      ? {start:$('date-from')?.value||'',end:$('date-to')?.value||''}
      : {start:daysBefore(end,Number(chosenRange)-1),end};
  }
  async function refreshAnalytics() {
    const id=++requestId,range=dateRange(),site=$('analytics-site')?.value||'all';
    setText('ga-load-status','正在讀取 GA4 真實數據…');
    resetDetails('正在載入…');
    try{
      const data=await fetchReport(site,range);
      if(requestId!==id)return;
      renderAnalytics(data);
      setText('ga-load-status','已更新 · '+new Date().toLocaleString('zh-TW'));
    }catch(e){
      if(requestId!==id)return;
      resetDetails('目前無法顯示資料，請查看上方提示。');
      setText('ga-load-status',e.message);
    }
  }
  async function refreshOverview() {
    const end=today();
    try{renderOverview(await fetchReport('all',{start:daysBefore(end,29),end}));}
    catch(e){
      for(const id of ['ov-users','ov-views','ov-downloads'])setText(id,'—');
      empty('overview-chart',e.message);
    }
  }
  function initialize() {
    const end=today();
    for(const id of ['date-from','date-to'])if($(id))$(id).max=end;
    if($('date-from'))$('date-from').value=daysBefore(end,29);
    if($('date-to'))$('date-to').value=end;
    document.querySelectorAll('[data-range]').forEach(button=>button.addEventListener('click',()=>{
      chosenRange=button.dataset.range;
      document.querySelectorAll('[data-range]').forEach(el=>el.classList.toggle('active',el===button));
      if($('custom-date-row'))$('custom-date-row').hidden=chosenRange!=='custom';
      setText('date-error','');
      if(chosenRange!=='custom')void refreshAnalytics();
    }));
    $('analytics-site')?.addEventListener('change',()=>void refreshAnalytics());
    $('apply-date')?.addEventListener('click',()=>{
      const range=dateRange();
      const n=(Date.parse(range.end)-Date.parse(range.start))/86400000;
      if(!range.start || !range.end || !Number.isFinite(n) || n<0 || n>365 || range.end>today()){
        setText('date-error','請選擇有效日期（最多 366 天）。');return;
      }
      setText('date-error','');void refreshAnalytics();
    });
    void refreshOverview();
    void refreshAnalytics();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();