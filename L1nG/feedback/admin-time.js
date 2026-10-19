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
  window.L1nGAdminTime=Object.freeze({timeZone:TIME_ZONE,today,daysBefore,timestamp,clock});
})();
