/* 管理中心請求層：只向正式站同來源請求，不在預覽站讀取管理資料。 */
(() => {
  'use strict';
  const officialHost = 'home.by-l1ng.com';
  const isProduction = () => window.location.hostname === officialHost;
  class RequestError extends Error {
    constructor(message,kind='server',retryable=false) {
      super(message);
      this.name='DashboardRequestError';
      this.kind=kind;
      this.retryable=retryable;
    }
  }
  const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
  const accessMessage = '管理員驗證未通過或存取遭拒。請重新開啟正式管理中心，完成 Cloudflare Access 登入。';
  const loginRedirect = url => {
    try {
      const value=new URL(url,window.location.origin);
      return value.pathname.startsWith('/cdn-cgi/access/') ||
        value.hostname.endsWith('.cloudflareaccess.com');
    } catch { return false; }
  };
  async function requestJSON(path,{method='GET',body,headers,timeoutMs=20000,errorMessages={}}={}) {
    if(!isProduction())throw new RequestError(
      '目前為預覽模式，不連接正式管理資料。請前往 home.by-l1ng.com 登入管理中心。','preview');
    const url=new URL(path,window.location.origin);
    if(url.origin!==window.location.origin || !url.pathname.startsWith('/feedback/'))
      throw new RequestError('不允許連接外部管理 API。','configuration');
    const safeRead=method.toUpperCase()==='GET';
    const attempts=safeRead ? 2 : 1; // 寫入操作絕不可自動重送
    for(let attempt=0;attempt<attempts;attempt++) {
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),timeoutMs);
      try {
        const response=await fetch(url.href,{
          method,credentials:'same-origin',cache:'no-store',redirect:'manual',
          headers:{...headers,'X-Requested-With':'XMLHttpRequest'},
          body,signal:controller.signal
        });
        // Access 會以 401 告知帶有 X-Requested-With 的請求需要重新驗證；
        // 部分設定仍會回 302。手動處理轉址，避免 fetch 跟往跨網域登入頁產生 CORS 錯誤。
        if(response.type==='opaqueredirect' ||
            response.status>=300 && response.status<400 ||
            loginRedirect(response.url))
          throw new RequestError(accessMessage,'auth');
        const contentType=(response.headers?.get('content-type')||'').toLowerCase();
        if(!contentType.includes('json')) {
          if(response.status===401||response.status===403)
            throw new RequestError(accessMessage,'auth');
          throw new RequestError(
            '管理 API 回傳了非 JSON 資料（HTTP '+response.status+'），請檢查登入狀態或部署路由。',
            'response',response.status>=500);
        }
        const data=await response.json().catch(()=>null);
        if(response.status===401||response.status===403 ||
            data?.error==='FORBIDDEN' || data?.error==='UNAUTHORIZED')
          throw new RequestError(errorMessages[data?.error]||accessMessage,'auth');
        if(!response.ok || !data?.ok) {
          const code=String(data?.error||'');
          const message=errorMessages[code] || code ||
            '管理 API 回應失敗（HTTP '+response.status+'）。';
          const invalidConfig=/^(AUTH_NOT_CONFIGURED|GA4_NOT_CONFIGURED)$/.test(code);
          throw new RequestError(message,invalidConfig?'configuration':'server',
            !invalidConfig && (response.status===408||response.status===429||response.status>=500));
        }
        return data;
      } catch(error) {
        let problem=error;
        if(!(error instanceof RequestError)){
          const timedOut=controller.signal.aborted;
          const offline=typeof navigator!=='undefined' && navigator.onLine===false;
          problem=new RequestError(
            offline?'目前裝置沒有網路連線，請確認網路後重試。':
            timedOut?'管理 API 連線逾時，請稍後重試。':
            '管理 API 連線未完成。可能是網路中斷或 Cloudflare Access 重新驗證，請確認登入後重試。',
            timedOut?'timeout':'network',!offline);
        }
        if(!problem.retryable || attempt===attempts-1){
          // 僅記錄端點路徑與錯誤類型，不輸出 Token、回饋內容或查詢字串。
          console.warn('[管理中心] API 請求失敗', {
            endpoint:url.pathname,method:method.toUpperCase(),kind:problem.kind
          });
          if(problem.kind==='auth' && typeof window.dispatchEvent==='function' &&
              typeof CustomEvent==='function')
            window.dispatchEvent(new CustomEvent('l1ng-admin-auth-required'));
          throw problem;
        }
      } finally { clearTimeout(timeout); }
      await wait(650);
    }
  }
  window.L1nGAdminNetwork=Object.freeze({requestJSON,isProduction});
})();
