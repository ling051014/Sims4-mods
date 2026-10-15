/* GA4 Dashboard: authenticated report data, no Google credentials in browser. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  // Branch previews (RawGitHack / pages.dev) never contact the production GA4 API.
  // This branch contains presentation code only; authentication and GA4 API remain on main.
  const previewOnly = window.location.hostname !== 'home.by-l1ng.com';
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
  const countryNames = Object.freeze({
    Taiwan:'臺灣', Japan:'日本', 'United States':'美國',
    'United Kingdom':'英國', 'Hong Kong':'香港', China:'中國',
    Singapore:'新加坡', 'South Korea':'南韓', Australia:'澳洲',
    'New Zealand':'紐西蘭', Canada:'加拿大', Germany:'德國',
    France:'法國', Italy:'義大利', Spain:'西班牙',
    Netherlands:'荷蘭', Switzerland:'瑞士', India:'印度',
    Malaysia:'馬來西亞', Philippines:'菲律賓', Thailand:'泰國',
    Indonesia:'印尼', Vietnam:'越南', Brazil:'巴西',
    '(not set)':'未設定'
  });
  const labelCountry = name => countryNames[name] || name || '未知';
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
    if(previewOnly)throw Error('預覽模式不允許查詢正式 GA4');
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
    ring.setAttribute('aria-label',rows.map(x=>labelDevice(x.name)+' '+number(x.value)).join('、'));
    for(const [i,item] of rows.entries()){
      const itemRow=node('div','legend-item'),left=node('span');
      const dot=node('span','dot');dot.style.background=colors[i%colors.length];
      left.append(dot,document.createTextNode(labelDevice(item.name)));
      itemRow.append(left,node('b','',Math.round(100*Number(item.value)/sum)+'%'));legend.append(itemRow);
    }
    root.append(ring,legend);
  }
  let overviewReady=false,analyticsReady=false;
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
    trend('ga-trend-chart',data.trend);
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
    trend('overview-chart',data.trend);
  }
  function resetDetails(message) {
    for(const id of ['ga-users','ga-views','ga-downloads','ga-new'])setText(id,'—');
    for(const id of ['ga-trend-chart','ga-pages','ga-countries','ga-referrals','ga-device','ga-feedback-events','ga-download-items'])empty(id,message);
    setText('ga-feedback-totals','開啟 — · 成功提交 —');
  }
  function dateRange() {
    const end=today();
    return chosenRange==='custom'
      ? {start:$('date-from')?.value||'',end:$('date-to')?.value||''}
      : {start:daysBefore(end,Number(chosenRange)-1),end};
  }
  async function refreshAnalytics() {
    if(previewOnly) {
      resetDetails('預覽模式不提供正式統計資料。');
      setText('ga-load-status','分支預覽：僅展示介面，不連接正式 GA4。');
      return;
    }
    const id=++requestId,range=dateRange(),site=$('analytics-site')?.value||'all';
    setText('ga-load-status','正在讀取 GA4 真實數據…');
    if(!analyticsReady)reportLoading('panel-analytics',true);
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
    }finally{
      if(requestId===id){analyticsReady=true;reportLoading('panel-analytics',false);}
    }
  }
  async function refreshOverview() {
    if(previewOnly) {
      for(const id of ['ov-users','ov-views','ov-downloads'])setText(id,'—');
      empty('overview-chart','預覽模式不提供正式統計資料。');
      return;
    }
    const end=today();
    if(!overviewReady)reportLoading('panel-overview',true);
    try{renderOverview(await fetchReport('all',{start:daysBefore(end,29),end}));}
    catch(e){
      for(const id of ['ov-users','ov-views','ov-downloads'])setText(id,'—');
      empty('overview-chart',e.message);
    }finally{overviewReady=true;reportLoading('panel-overview',false);}
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