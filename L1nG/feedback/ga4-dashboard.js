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

  // Use the visible Traditional Chinese navigation/page titles, not GA4 URL slugs.
  // Paths are host-scoped: /download can mean different things on different sites.
  const pageTitles = Object.freeze({
    'home.by-l1ng.com': Object.freeze({
      '/': 'L1nG · 首頁',
      '/home': 'L1nG · 首頁',
      '/home-en': 'L1nG · 首頁（英文）',
      '/site-info': 'L1nG · 使用、隱私與 Cookie 說明',
      '/changelog': 'RealDate · 更新日誌'
    }),
    'realdate.by-l1ng.com': Object.freeze({
      '/': 'RealDate',
      '/gameplay': 'RealDate · 完整玩法',
      '/download': 'RealDate · 下載與安裝',
      '/compatibility': 'RealDate · 相容性',
      '/changelog': 'RealDate · 更新日誌',
      '/roadmap': 'RealDate · 開發方向',
      '/faq': 'RealDate · 常見問題',
      '/feedback': 'RealDate · 問題反饋',
      '/installation': 'RealDate · 安裝說明已合併'
    }),
    'genealogy-tool.by-l1ng.com': Object.freeze({
      '/': '族譜工具',
      '/genealogy': '族譜工具'
    }),
    'genealogy-exporter.by-l1ng.com': Object.freeze({
      '/': '族譜提取器',
      '/genealogy-exporter': '族譜提取器'
    }),
    'translations.by-l1ng.com': Object.freeze({
      '/': '漢化專區'
    })
  });
  function labelPage(item) {
    const host = String(item?.host || '');
    let path = String(item?.path || '/').trim().split(/[?#]/, 1)[0] || '/';
    try { path = decodeURI(path); } catch (_) { /* Keep the original pathname. */ }
    if (!path.startsWith('/')) path = '/' + path;
    path = path.replace(/\/{2,}/g, '/')
      .replace(/\/index(?:\.html?)?$/i, '/')
      .replace(/\.html?$/i, '');
    if (path.length > 1) path = path.replace(/\/+$/, '');
    path = path.toLowerCase();
    const label = pageTitles[host]?.[path];
    if (label) return label;
    // Future pages with no mapped title must not expose raw URL filenames as titles.
    return labelSite(host) + ' · 其他頁面';
  }
  const downloadNames=Object.freeze({
    "r_v05_homehero":"RealDate v0.5 Beta · 首頁上方下載",
    "r_v05_homecard":"RealDate v0.5 Beta · 首頁版本卡下載",
    "r_v050_main":"RealDate v0.5 Beta · 主要下載",
    "r_v050_backup":"RealDate v0.5 Beta · 備用下載",
    "r_v040_main":"RealDate v0.4 Beta · 主要下載",
    "r_v040_backup":"RealDate v0.4 Beta · 備用下載",
    "r_v030_main":"RealDate v0.3 Beta · 主要下載",
    "r_v030_backup":"RealDate v0.3 Beta · 備用下載",
    "r_v021_main":"RealDate v0.2.1 Beta · 主要下載",
    "r_v021_backup":"RealDate v0.2.1 Beta · 備用下載",
    "r_v020_main":"RealDate v0.2 Beta · 主要下載",
    "r_v020_backup":"RealDate v0.2 Beta · 備用下載",
    "r_v011_main":"RealDate v0.1.1 Beta · 主要下載",
    "r_v011_backup":"RealDate v0.1.1 Beta · 備用下載",
    "r_v010_main":"RealDate v0.1 Beta · 主要下載",
    "r_v010_backup":"RealDate v0.1 Beta · 備用下載",
    "t_catdog_cht":"貓狗特徵包 · 繁體中文下載",
    "t_catdog_backup":"貓狗特徵包 · 備用下載",
    "t_wme_cht":"Wicked Memories Enhanced · 繁體中文下載",
    "t_wme_backup":"Wicked Memories Enhanced · 備用下載",
    "t_habit_cht":"A Morning Routine · 繁體中文下載",
    "t_habit_backup":"A Morning Routine · 備用下載",
    "t_frontdesk_cht":"Front Desk Staff · 繁體中文下載",
    "t_frontdesk_backup":"Front Desk Staff · 備用下載",
    "t_airline_cht":"Airline Employee · 繁體中文下載",
    "t_airline_backup":"Airline Employee · 備用下載",
    "t_uicheats_cht":"UI Cheats Extension · 繁體中文下載",
    "t_uicheats_backup":"UI Cheats Extension · 備用下載",
    "t_zodiac_cht":"十二星座 · 繁體中文下載",
    "t_zodiac_chs":"十二星座 · 簡體中文下載",
    "t_zodiac_backup":"十二星座 · 備用下載",
    "e_v01_main":"族譜提取器 v0.1 Beta · 主要下載"
  });
  const feedbackNames={l1ng_feedback_open:'開啟回饋',l1ng_feedback_submitted:'成功提交'};
  // Keep GA4's canonical dimension values untouched; translate only visible labels.
  const deviceNames = Object.freeze({
    desktop:'電腦', mobile:'手機', tablet:'平板',
    'smart tv':'智慧電視', '(not set)':'未設定'
  });
  const labelDevice = name => deviceNames[String(name || '').toLowerCase()] || name || '其他';
  const labelCountry = name => window.L1nGGa4Countries.label(name);
  const labelReferral = value => {
    const raw = String(value || '').trim();
    if (!raw || raw === '(not set)') return '未設定';
    if (raw === '(direct) / (none)') return '直接造訪';
    const match = /^(.+) \/ (referral|organic|cpc|paid|email|social|none)$/i.exec(raw);
    if (!match) return raw;
    const categories = {referral:'推薦連結',organic:'自然搜尋',cpc:'付費點擊',paid:'付費流量',email:'電子郵件',social:'社群',none:'無'};
    return match[1] + '／' + categories[match[2].toLowerCase()];
  };
  const node = (tag,cls,text) => {
    const item=document.createElement(tag);
    if(cls)item.className=cls;
    if(text!==undefined)item.textContent=String(text);
    return item;
  };
  const {today,daysBefore}=window.L1nGAdminTime;
  let chosenRange='30',requestId=0;
  const errors={
    FORBIDDEN:'未通過 Cloudflare Access 管理員驗證。請確認登入狀態與管理 API 存取權。',
    AUTH_NOT_CONFIGURED:'尚未設定 Cloudflare Access 管理員驗證變數。',
    GA4_NOT_CONFIGURED:'GA4 資源 ID 或服務帳戶金鑰尚未設定。',
    GA4_UNAVAILABLE:'GA4 查詢失敗，請檢查服務帳戶的檢視者權限與 Google Analytics Data API。',
    INVALID_DATE_RANGE:'日期範圍不正確。',
    INVALID_FILTER:'網站篩選條件不正確。'
  };
  const pendingReports=new Map();
  async function fetchReport(site,range) {
    const key=site+'|'+range.start+'|'+range.end;
    if(pendingReports.has(key))return pendingReports.get(key);
    const params=new URLSearchParams({site,startDate:range.start,endDate:range.end});
    const promise=window.L1nGAdminNetwork.requestJSON('/feedback/ga4-api?'+params,{
      timeoutMs:32000,errorMessages:errors
    }).finally(()=>pendingReports.delete(key));
    pendingReports.set(key,promise);
    return promise;
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
    const points=(series||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(!points.length){empty(id,'目前沒有每日訪客資料。');return;}
    const max=Math.max(1,...points.filter(item=>item.value!==null).map(item=>Number(item.value)||0));
    const width=760,height=224,left=35,right=741,top=16,bottom=184;
    const svg=svgElement('svg',{
      viewBox:'0 0 '+width+' '+height,role:'group',tabindex:0,
      'aria-label':'每日活躍使用者趨勢；使用左右方向鍵查看每日數值'
    });
    const scroll=node('div','ga-chart-scroll');
    scroll.setAttribute('aria-label','可水平捲動的每日活躍使用者折線圖');
    scroll.append(svg);
    root.setAttribute('role','group');
    for(let n=0;n<=4;n++){
      const y=bottom-n*(bottom-top)/4;
      svg.append(svgElement('line',{x1:left,x2:right,y1:y,y2:y,stroke:'currentColor','stroke-opacity':'.13'}));
      const label=svgElement('text',{x:left-7,y:y+4,'text-anchor':'end','font-size':10,fill:'currentColor',opacity:'.65'});
      label.textContent=number(Math.round(max*n/4));svg.append(label);
    }
    const coords=points.map((p,i)=>({
      x:points.length===1?(left+right)/2:left+(right-left)*i/(points.length-1),
      y:p.value===null?null:bottom-(bottom-top)*(Number(p.value)||0)/max
    }));
    // 未回傳日期不補零，並讓線段在缺漏處中斷，避免誤導為流量下跌。
    const segments=[];let segment=[];
    for(const point of coords){
      if(point.y===null){if(segment.length)segments.push(segment);segment=[];}
      else segment.push(point);
    }
    if(segment.length)segments.push(segment);
    for(const run of segments){
      const path=run.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
      if(run.length>1)svg.append(svgElement('path',{d:path+' L'+run[run.length-1].x+' '+bottom+' L'+run[0].x+' '+bottom+' Z',fill:'var(--primary)','fill-opacity':'.10'}));
      svg.append(svgElement('path',{d:path,fill:'none',stroke:'var(--primary)','stroke-width':2.5,'stroke-linejoin':'round','stroke-linecap':'round'}));
    }
    if(points.length<=31)coords.filter(p=>p.y!==null).forEach(p=>svg.append(svgElement('circle',{
      cx:p.x,cy:p.y,r:2.5,fill:'var(--primary)','fill-opacity':'.7','pointer-events':'none'
    })));
    const guide=svgElement('line',{x1:0,x2:0,y1:top,y2:bottom,stroke:'var(--primary)',
      'stroke-width':1,'stroke-dasharray':'4 4','stroke-opacity':'.5','pointer-events':'none'});
    const marker=svgElement('circle',{cx:0,cy:0,r:5,fill:'var(--primary)',
      stroke:'var(--surface)','stroke-width':2.5,'pointer-events':'none'});
    guide.style.display='none';marker.style.display='none';
    svg.append(guide,marker);
    for(const idx of new Set([0,Math.floor((points.length-1)/2),points.length-1])){
      const p=coords[idx],raw=String(points[idx].date);
      const label=svgElement('text',{x:p.x,y:210,
        'text-anchor':idx===0?'start':idx===points.length-1?'end':'middle',
        'font-size':11,fill:'currentColor',opacity:'.6'});
      label.textContent=/^\d{8}$/.test(raw)?raw.slice(4,6)+'/'+raw.slice(6,8):raw;
      svg.append(label);
    }
    const readout=node('div','ga-chart-readout');
    const detail=node('div','ga-chart-readout-detail');
    const detailDate=node('span','ga-chart-readout-date');
    const detailValue=node('strong','ga-chart-readout-value');
    detail.append(detailDate,detailValue);
    const hint=node('span','ga-chart-readout-hint','點選節點或使用方向鍵查看');
    readout.append(detail,hint);
    const tooltip=node('div','ga-chart-tooltip');
    tooltip.hidden=true;tooltip.setAttribute('role','tooltip');
    const tooltipDate=node('div','ga-chart-tooltip-date');
    const tooltipValue=node('div','ga-chart-tooltip-value');
    tooltip.append(tooltipDate,tooltipValue);
    root.append(readout,scroll,tooltip);
    const formatDate=raw=>{
      const date=String(raw||'');
      if(/^\d{8}$/.test(date))return date.slice(0,4)+'/'+date.slice(4,6)+'/'+date.slice(6,8);
      if(/^\d{4}-\d{2}-\d{2}$/.test(date))return date.replace(/-/g,'/');
      return date;
    };
    const mobile=window.matchMedia('(max-width: 700px)');
    let selectedIndex=-1;
    function show(index,withTooltip=false) {
      if(index<0||index>=points.length)return;
      selectedIndex=index;
      const point=coords[index],record=points[index],date=formatDate(record.date),value=number(record.value);
      guide.setAttribute('x1',point.x);guide.setAttribute('x2',point.x);
      marker.setAttribute('cx',point.x);marker.setAttribute('cy',point.y===null?bottom:point.y);
      const missing=record.value===null;
      guide.style.display='';marker.style.display=missing?'none':'';
      detailDate.textContent=date;
      detailValue.textContent=missing?'未取得資料':'活躍使用者 '+value;
      tooltipDate.textContent=date;
      tooltipValue.textContent=missing?'未取得資料':'活躍使用者 · '+value;
      svg.setAttribute('aria-label',date+'，'+(missing?'尚未取得 GA4 資料':'活躍使用者 '+value)+'。使用左右方向鍵切換日期');
      tooltip.hidden=mobile.matches||!withTooltip;
      if(!tooltip.hidden){
        const svgRect=svg.getBoundingClientRect(),rootRect=root.getBoundingClientRect();
        const px=svgRect.left-rootRect.left+point.x/width*svgRect.width;
        const py=svgRect.top-rootRect.top+(point.y===null?bottom:point.y)/height*svgRect.height;
        const tw=tooltip.offsetWidth,th=tooltip.offsetHeight;
        tooltip.style.left=Math.max(6,Math.min(px-tw/2,rootRect.width-tw-6))+'px';
        tooltip.style.top=(py-th-10>=0?py-th-10:py+11)+'px';
      }
    }
    function hideFloating(){
      tooltip.hidden=true;guide.style.display='none';marker.style.display='none';
    }
    function nearest(clientX){
      const rect=svg.getBoundingClientRect();
      if(!rect.width)return -1;
      const x=(clientX-rect.left)/rect.width*width;
      const idx=points.length===1?0:Math.round((x-left)/(right-left)*(points.length-1));
      return Math.max(0,Math.min(points.length-1,idx));
    }
    svg.addEventListener('pointermove',event=>{
      if(event.pointerType!=='touch')show(nearest(event.clientX),true);
    });
    svg.addEventListener('pointerdown',event=>{
      if(event.pointerType==='touch')show(nearest(event.clientX));
    });
    svg.addEventListener('click',event=>show(nearest(event.clientX),event.detail!==0));
    svg.addEventListener('pointerleave',event=>{
      if(event.pointerType!=='touch'&&document.activeElement!==svg)hideFloating();
    });
    svg.addEventListener('focus',()=>show(selectedIndex<0?points.length-1:selectedIndex));
    svg.addEventListener('blur',hideFloating);
    svg.addEventListener('keydown',event=>{
      let next=selectedIndex<0?points.length-1:selectedIndex;
      if(event.key==='ArrowLeft')next=Math.max(0,next-1);
      else if(event.key==='ArrowRight')next=Math.min(points.length-1,next+1);
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=points.length-1;
      else if(event.key==='Escape'){event.preventDefault();hideFloating();return;}
      else return;
      event.preventDefault();show(next);
      if(mobile.matches){
        const point=coords[next],scaledWidth=svg.getBoundingClientRect().width;
        const target=point.x/width*scaledWidth;
        if(target<scroll.scrollLeft+28||target>scroll.scrollLeft+scroll.clientWidth-28){
          scroll.scrollLeft=Math.max(0,target-scroll.clientWidth/2);
        }
      }
    });
    show(points.length-1);
    hideFloating();
    if(mobile.matches){
      const showLatest=()=>{
        if(!scroll.clientWidth)return false;
        if(scroll.scrollWidth>scroll.clientWidth){
          scroll.scrollLeft=scroll.scrollWidth-scroll.clientWidth;
        }
        return true;
      };
      // 網站分析分頁初始隱藏；等容器實際顯示後再定位最新日期。
      if(!showLatest()&&typeof ResizeObserver==='function'){
        const observer=new ResizeObserver(()=>{if(showLatest())observer.disconnect();});
        observer.observe(scroll);
      }
    }
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
    ring.setAttribute('aria-label',rows.map(x=>labelDevice(x.name)+' '+number(x.value)).join('、'));
    for(const [i,item] of rows.entries()){
      const itemRow=node('div','legend-item'),left=node('span');
      const dot=node('span','dot');dot.style.background=colors[i%colors.length];
      left.append(dot,document.createTextNode(labelDevice(item.name)));
      itemRow.append(left,node('b','',Math.round(100*Number(item.value)/sum)+'%'));legend.append(itemRow);
    }
    root.append(ring,legend);
  }
  let overviewReady=false,analyticsReady=false,hasAnalyticsData=false,hasOverviewData=false;
  function reportLoading(section,loading){
    const panel=$(section);
    if(!panel)return;
    panel.classList.toggle('ga4-first-loading',loading);
    if(loading)panel.setAttribute('aria-busy','true');
    else panel.removeAttribute('aria-busy');
  }
  function renderAnalytics(data) {
    const s=data.summary||{};
    for(const [id,n] of Object.entries({'ga-users':s.activeUsers,'ga-views':s.views,'ga-downloads':s.downloads,'ga-new':s.newUsers}))
      setText(id,number(n));
    setText('chart-description',data.range.startDate+' 至 '+data.range.endDate+' · 活躍使用者');
    trend('ga-trend-chart',window.L1nGAdminTime.normalizeDailyTrend(data.range,data.trend));
    list('ga-pages',data.pages,x=>labelPage(x));
    list('ga-countries',data.countries,x=>labelCountry(x.name));
    list('ga-feedback-events',data.feedbackEvents,x=>labelSite(x.host)+' · '+(feedbackNames[x.event]||'未知互動'));
    setText('ga-feedback-totals','開啟 '+number(s.feedbackOpened)+' · 成功提交 '+number(s.feedbackSubmitted));
    list('ga-download-items',data.downloadItems,x=>labelSite(x.host)+' · '+(downloadNames[x.id]||'其他下載'));
    list('ga-referrals',data.referrals,x=>labelReferral(x.name));
    devices(data.devices);
  }
  function renderOverview(data) {
    const s=data.summary||{};
    setText('ov-users',number(s.activeUsers));
    setText('ov-views',number(s.views));
    setText('ov-downloads',number(s.downloads));
    trend('overview-chart',window.L1nGAdminTime.normalizeDailyTrend(data.range,data.trend));
  }
  function resetDetails(message) {
    for(const id of ['ga-users','ga-views','ga-downloads','ga-new'])setText(id,'—');
    for(const id of ['ga-trend-chart','ga-pages','ga-countries','ga-referrals','ga-device','ga-feedback-events','ga-download-items'])empty(id,message);
    setText('ga-feedback-totals','開啟 — · 成功提交 —');
  }
  function dateRange() {
    const end=today();
    for(const id of ['date-from','date-to'])if($(id))$(id).max=end;
    return chosenRange==='custom'
      ? {start:$('date-from')?.value||'',end:$('date-to')?.value||''}
      : {start:daysBefore(end,Number(chosenRange)-1),end};
  }
  async function refreshAnalytics() {
    const id=++requestId,range=dateRange(),site=$('analytics-site')?.value||'all';
    setText('ga-load-status','正在讀取 GA4 真實數據…');
    if(!analyticsReady)reportLoading('panel-analytics',true);
    if(!hasAnalyticsData)resetDetails('正在載入…');
    try{
      const data=await fetchReport(site,range);
      if(requestId!==id)return;
      renderAnalytics(data);
      hasAnalyticsData=true;
      setText('ga-load-status','已更新 · '+window.L1nGAdminTime.timestamp(new Date()));
    }catch(e){
      if(requestId!==id)return;
      if(!hasAnalyticsData)resetDetails('目前無法顯示資料，請查看上方提示。');
      setText('ga-load-status',e.message);
    }finally{
      if(requestId===id){analyticsReady=true;reportLoading('panel-analytics',false);}
    }
  }
  async function refreshOverview() {
    const end=today();
    if(!overviewReady)reportLoading('panel-overview',true);
    try{
      renderOverview(await fetchReport('all',{start:daysBefore(end,29),end}));
      hasOverviewData=true;
      setText('overview-ga4-status','');
    }catch(e){
      setText('overview-ga4-status',e.message+(hasOverviewData?'（目前保留上次資料）':''));
      if(!hasOverviewData){
        for(const id of ['ov-users','ov-views','ov-downloads'])setText(id,'—');
        empty('overview-chart',e.message);
      }
    }finally{overviewReady=true;reportLoading('panel-overview',false);}
  }
  function initialize() {
    const end=today();
    for(const id of ['date-from','date-to'])if($(id))$(id).max=end;
    if($('date-from'))$('date-from').value=daysBefore(end,29);
    if($('date-to'))$('date-to').value=end;
    window.L1nGAdminDatePicker?.refresh();
    document.querySelectorAll('[data-range]').forEach(button=>button.addEventListener('click',()=>{
      chosenRange=button.dataset.range;
      document.querySelectorAll('[data-range]').forEach(el=>el.classList.toggle('active',el===button));
      if($('custom-date-row'))$('custom-date-row').hidden=chosenRange!=='custom';
      document.querySelector('[data-range="custom"]')?.setAttribute('aria-expanded',String(chosenRange==='custom'));
      setText('date-error','');
      if(chosenRange!=='custom')void refreshAnalytics();
    }));
    $('analytics-site')?.addEventListener('change',()=>void refreshAnalytics());
    document.addEventListener('l1ng:analytics-date-applied',()=>{
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