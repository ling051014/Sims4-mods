/* 管理中心共用時區：只影響顯示與報表日期，不修改資料庫 UTC 時間。 */
(() => {
  'use strict';
  const TIME_ZONE='Asia/Taipei';
  const dateFormatter=new Intl.DateTimeFormat('en-US',{
    timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'
  });
  const timestampFormatter=new Intl.DateTimeFormat('zh-TW',{
    timeZone:TIME_ZONE,dateStyle:'medium',timeStyle:'short'
  });
  const clockFormatter=new Intl.DateTimeFormat('zh-TW',{
    timeZone:TIME_ZONE,hour:'2-digit',minute:'2-digit',second:'2-digit'
  });
  function today(value=new Date()){
    const parts={};
    for(const part of dateFormatter.formatToParts(value))
      if(part.type!=='literal')parts[part.type]=part.value;
    return parts.year+'-'+parts.month+'-'+parts.day;
  }
  function daysBefore(date,days){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(days)||days<0)
      throw new RangeError('無效的日期或天數');
    // 純日期使用 UTC 日曆計算，避免瀏覽器的時區和夏令時間干擾。
    const value=new Date(date+'T00:00:00Z');
    if(!Number.isFinite(value.getTime())||value.toISOString().slice(0,10)!==date)
      throw new RangeError('無效的日期');
    value.setUTCDate(value.getUTCDate()-days);
    return value.toISOString().slice(0,10);
  }
  function validDate(value){
    const date=value instanceof Date?value:new Date(value);
    return Number.isFinite(date.getTime())?date:null;
  }
  const timestamp=value=>{
    if(value===null||value===undefined||value==='')return '未知';
    const date=validDate(value);
    return date?timestampFormatter.format(date)+'（UTC+8）':'未知';
  };
  const clock=(value=new Date())=>{
    const date=validDate(value);
    return date?clockFormatter.format(date)+'（UTC+8）':'未知';
  };

  /* 折線圖的曆日以查詢範圍為準，API 未回傳的日期不得猜測成零。 */
  function normalizeDailyTrend(range,rows=[]){
    const asDate=value=>{
      const raw=String(value||'');
      const text=/^\d{8}$/.test(raw)
        ?raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6,8):raw;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return null;
      const time=Date.parse(text+'T00:00:00Z');
      return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===text?text:null;
    };
    const start=asDate(range?.startDate||range?.start);
    const end=asDate(range?.endDate||range?.end);
    if(!start||!end)throw new RangeError('無效的報表日期範圍');
    const first=Date.parse(start+'T00:00:00Z');
    const count=Math.round((Date.parse(end+'T00:00:00Z')-first)/86400000)+1;
    if(count<1||count>366)throw new RangeError('報表日期範圍超出限制');
    const reported=new Map();
    for(const row of Array.isArray(rows)?rows:[]){
      const date=asDate(row?.date),raw=row?.value;
      if(!date||date<start||date>end||raw===null||raw===undefined||raw==='')continue;
      const value=Number(raw);
      if(Number.isFinite(value))reported.set(date,value);
    }
    return Array.from({length:count},(_,index)=>{
      const date=new Date(first+index*86400000).toISOString().slice(0,10);
      return {date:date.replace(/-/g,''),value:reported.has(date)?reported.get(date):null,reported:reported.has(date)};
    });
  }
  window.L1nGAdminTime=Object.freeze({timeZone:TIME_ZONE,today,daysBefore,timestamp,clock,normalizeDailyTrend});
})();
