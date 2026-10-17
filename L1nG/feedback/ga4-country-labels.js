/* GA4 的英文 country 維度只在 UI 翻譯，不改動原始數據或篩選值。 */
(() => {
  'use strict';
  const preferred=Object.freeze({
    TW:'臺灣',HK:'香港',MO:'澳門',CN:'中國',US:'美國',GB:'英國',
    KR:'南韓',JP:'日本',NZ:'紐西蘭',SG:'新加坡',VN:'越南'
  });
  const fallback=Object.freeze({
    Ireland:'愛爾蘭',Taiwan:'臺灣',Japan:'日本',
    'United States':'美國','United Kingdom':'英國','Hong Kong':'香港',
    China:'中國',Singapore:'新加坡','South Korea':'南韓',
    Australia:'澳洲','New Zealand':'紐西蘭',Canada:'加拿大',
    Germany:'德國',France:'法國',Italy:'義大利',Spain:'西班牙',
    Netherlands:'荷蘭',Switzerland:'瑞士',India:'印度',
    Malaysia:'馬來西亞',Philippines:'菲律賓',Thailand:'泰國',
    Indonesia:'印尼',Vietnam:'越南',Brazil:'巴西'
  });
  const aliases=Object.freeze({
    'hong kong':'HK','macao':'MO','macau':'MO',
    'united states of america':'US','u.s.a.':'US',
    'korea, republic of':'KR','republic of korea':'KR',
    'korea, democratic peoples republic of':'KP',
    'north korea':'KP','russian federation':'RU',
    'czech republic':'CZ','turkey':'TR','türkiye':'TR',
    'ivory coast':'CI',"cote d'ivoire":'CI',
    'republic of moldova':'MD','moldova':'MD',
    'bolivia (plurinational state of)':'BO','bolivia':'BO',
    'iran (islamic republic of)':'IR','iran':'IR',
    'syrian arab republic':'SY','syria':'SY',
    'lao peoples democratic republic':'LA','laos':'LA',
    'brunei darussalam':'BN','brunei':'BN',
    'venezuela (bolivarian republic of)':'VE','venezuela':'VE',
    'tanzania, united republic of':'TZ','tanzania':'TZ',
    'viet nam':'VN','myanmar':'MM','burma':'MM',
    'palestine':'PS','state of palestine':'PS',
    'democratic republic of the congo':'CD','congo - kinshasa':'CD',
    'republic of the congo':'CG','congo - brazzaville':'CG',
    'kosovo':'XK','curacao':'CW','curaçao':'CW',
    'réunion':'RE','aland islands':'AX','åland islands':'AX'
  });
  const normalize=value=>String(value||'').trim()
    .replace(/[’‘]/g,"'").replace(/\s+/g,' ').toLocaleLowerCase('en');
  const byEnglish=new Map();
  let names;
  try {
    if(typeof Intl.DisplayNames==='function') {
      const en=new Intl.DisplayNames(['en'],{type:'region'});
      names=new Intl.DisplayNames(['zh-Hant-TW'],{type:'region'});
      // ISO 3166 alpha-2 與 CLDR 支援的地區代碼；不依賴手寫短名單。
      for(let a=65;a<=90;a++)for(let b=65;b<=90;b++){
        const code=String.fromCharCode(a,b),english=en.of(code);
        if(english && english!==code && names.of(code)!==code)
          byEnglish.set(normalize(english),code);
      }
    }
  } catch { names=null; }
  for(const [english,code] of Object.entries(aliases))
    byEnglish.set(normalize(english),code);
  function label(value) {
    const raw=String(value??'').trim();
    if(!raw)return '未知';
    if(raw==='(not set)')return '未設定';
    if(raw==='(unknown)' || raw.toLowerCase()==='unknown')return '未知';
    if(Object.hasOwn(fallback,raw))return fallback[raw];
    const code=byEnglish.get(normalize(raw)) ||
      (/^[A-Z]{2}$/.test(raw) ? raw : null);
    if(code) {
      if(preferred[code])return preferred[code];
      if(names) {
        const translated=names.of(code);
        if(translated && translated!==code)return translated;
      }
    }
    // 遇到無法識別的 GA4 值時保留原字，避免誤標國家。
    return raw;
  }
  window.L1nGGa4Countries=Object.freeze({label});
})();
