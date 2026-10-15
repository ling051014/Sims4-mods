/*
 * L1nG GA4 management report — Cloudflare Pages Function, production home only.
 * GA4 credentials never leave the server. The management endpoint denies access
 * unless a verified Cloudflare Access JWT matches the configured admin identity.
 */
const HOME = 'home.by-l1ng.com';
const SITE_HOSTS = Object.freeze({
  home:'home.by-l1ng.com',
  realdate:'realdate.by-l1ng.com',
  genealogy:'genealogy-tool.by-l1ng.com',
  extractor:'genealogy-exporter.by-l1ng.com',
  translations:'translations.by-l1ng.com'
});
const encoder = new TextEncoder();
let cachedGoogleToken = null;
const reportCache = new Map();

const json = (data,status=200) => new Response(JSON.stringify(data), {
  status,
  headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store, private',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer'
  }
});
const reject = (code,status) => json({ok:false,error:code},status);
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function decode64(input) {
  if (typeof input !== 'string' || !/^[A-Za-z0-9_-]+$/.test(input)) throw Error('Invalid base64url');
  const normalized = input.replace(/-/g,'+').replace(/_/g,'/');
  const bin = atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'='));
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
}
function accessTokenFrom(request) {
  const header = request.headers.get('Cf-Access-Jwt-Assertion');
  if (header) return header;
  const match = (request.headers.get('cookie')||'').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? match[1] : '';
}
async function allowAdmin(request,env) {
  const rawIssuer = env.ACCESS_TEAM_DOMAIN;
  const expectedAudience = env.ACCESS_AUD;
  const admins = (env.ADMIN_EMAIL||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if (!rawIssuer || !expectedAudience || admins.length===0) return false;
  let issuer;
  try {
    const url=new URL(rawIssuer);
    if (url.protocol!=='https:' || url.username || url.password || url.search || url.hash
        || url.pathname!=='/' || !url.hostname.endsWith('.cloudflareaccess.com')) return false;
    issuer=url.origin;
  } catch { return false; }
  const token = accessTokenFrom(request);
  const parts=token.split('.');
  if (parts.length!==3 || token.length>12000) return false;
  try {
    const head=JSON.parse(new TextDecoder().decode(decode64(parts[0])));
    const payload=JSON.parse(new TextDecoder().decode(decode64(parts[1])));
    const now=Date.now()/1000;
    if (head.alg!=='RS256' || typeof head.kid!=='string' || !head.kid
        || payload.iss!==issuer || typeof payload.exp!=='number' || payload.exp<=now
        || typeof payload.iat!=='number' || payload.iat>now+60
        || (payload.nbf && payload.nbf>now)
        || !admins.includes(String(payload.email||'').toLowerCase())
        || !(Array.isArray(payload.aud)
            ? payload.aud.includes(expectedAudience)
            : payload.aud===expectedAudience)) return false;
    const certs=await fetch(issuer+'/cdn-cgi/access/certs', {
      headers:{accept:'application/json'},
      signal:AbortSignal.timeout(7000)
    });
    if(!certs.ok)return false;
    const keys=await certs.json();
    const jwk=(keys.keys||[]).find(k=>k.kty==='RSA' && k.kid===head.kid && (!k.alg || k.alg==='RS256'));
    if(!jwk)return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode64(parts[2]),encoder.encode(parts[0]+'.'+parts[1]));
  }catch{return false;}
}
function dateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return null;
  const dt=new Date(value+'T00:00:00Z');
  return Number.isFinite(dt.valueOf()) && dt.toISOString().slice(0,10)===value ? dt : null;
}
function dates(url) {
  const endDate=url.searchParams.get('endDate') || new Date().toISOString().slice(0,10);
  const startDate=url.searchParams.get('startDate') || new Date(Date.parse(endDate+'T00:00:00Z')-29*86400000).toISOString().slice(0,10);
  const from=dateParts(startDate),to=dateParts(endDate);
  if(!from || !to || from>to || (to-from)/86400000>365
      || to.getTime()>Date.now()+86400000) return null;
  return {startDate,endDate};
}
function siteFilter(site) {
  if (site==='all') return {
    filter:{fieldName:'hostName',inListFilter:{values:Object.values(SITE_HOSTS)}}
  };
  return {filter:{fieldName:'hostName',stringFilter:{matchType:'EXACT',value:SITE_HOSTS[site]}}};
}
function query(dateRange,site,dimensions,metrics,limit=100,extraFilter=null) {
  const filters=[siteFilter(site)];
  if(extraFilter) filters.push(extraFilter);
  return {
    dateRanges:[dateRange],
    dimensions:dimensions.map(name=>({name})),
    metrics:metrics.map(name=>({name})),
    dimensionFilter:filters.length===1?filters[0]:{andGroup:{expressions:filters}},
    limit:String(limit),
    keepEmptyRows:false
  };
}
function parseRows(report) {
  return (report?.rows||[]).map(row=>({
    dims:(row.dimensionValues||[]).map(x=>x.value),
    values:(row.metricValues||[]).map(x=>Number(x.value)||0)
  }));
}
function metric(report,n) {return Number(report?.rows?.[0]?.metricValues?.[n]?.value)||0;}
function oauthKey(jsonString) {
  const value=JSON.parse(jsonString);
  if(value.type!=='service_account' || typeof value.client_email!=='string'
     || !value.client_email.endsWith('.iam.gserviceaccount.com')
     || typeof value.private_key!=='string'
     || !value.private_key.includes('-----BEGIN PRIVATE KEY-----')
     || value.token_uri!=='https://oauth2.googleapis.com/token') throw Error('Invalid credentials');
  return value;
}
async function googleAccessToken(env) {
  if(cachedGoogleToken && cachedGoogleToken.until>Date.now()) return cachedGoogleToken.value;
  const account=oauthKey(env.GA4_SERVICE_ACCOUNT_JSON);
  const pem=account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const bin=Uint8Array.from(atob(pem),ch=>ch.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',bin,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const now=Math.floor(Date.now()/1000);
  const header=base64url(encoder.encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
  const payload=base64url(encoder.encode(JSON.stringify({
    iss:account.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly',
    aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3300
  })));
  const unsigned=header+'.'+payload;
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,encoder.encode(unsigned));
  const assertion=unsigned+'.'+base64url(signature);
  const body=new URLSearchParams({'grant_type':'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion});
  const response=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
    body,signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)throw Error('Google token request failed');
  const data=await response.json();
  if(!data.access_token || !Number.isFinite(data.expires_in))throw Error('Invalid Google token response');
  cachedGoogleToken={value:data.access_token,until:Date.now()+Math.max(60,data.expires_in-120)*1000};
  return cachedGoogleToken.value;
}
async function runReport(property,token,body) {
  const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
    method:'POST',
    headers:{'authorization':'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)throw Error('Google report failed');
  return response.json();
}
async function report(env,site,range) {
  const cacheKey=site+':'+range.startDate+':'+range.endDate;
  const cached=reportCache.get(cacheKey);
  if(cached && cached.until>Date.now())return cached.data;
  if(!/^\d{6,15}$/.test(env.GA4_PROPERTY_ID||''))throw Error('Invalid property');
  const property=env.GA4_PROPERTY_ID;
  const token=await googleAccessToken(env);
  const eventFilter={filter:{fieldName:'eventName',stringFilter:{matchType:'EXACT',value:'l1ng_download_click'}}};
  const jobs=[
    query(range,site,[],['activeUsers','screenPageViews','newUsers']),
    query(range,site,['date'],['activeUsers'],370),
    query(range,site,['hostName','pagePath'],['screenPageViews'],10),
    query(range,site,['country'],['activeUsers'],12),
    query(range,site,['deviceCategory'],['activeUsers'],5),
    query(range,site,['sessionSourceMedium'],['sessions'],10),
    query(range,site,['hostName'],['eventCount'],10,eventFilter)
  ];
  const results=await Promise.all(jobs.map(job=>runReport(property,token,job)));
  const downloads=parseRows(results[6]);
  const payload={
    ok:true,range,site,generatedAt:new Date().toISOString(),
    summary:{
      activeUsers:metric(results[0],0),
      views:metric(results[0],1),
      newUsers:metric(results[0],2),
      downloads:downloads.reduce((n,row)=>n+(row.values[0]||0),0)
    },
    trend:parseRows(results[1]).map(row=>({date:row.dims[0],value:row.values[0]})),
    pages:parseRows(results[2]).map(row=>({host:row.dims[0],path:row.dims[1],value:row.values[0]})),
    countries:parseRows(results[3]).map(row=>({name:row.dims[0],value:row.values[0]})),
    devices:parseRows(results[4]).map(row=>({name:row.dims[0],value:row.values[0]})),
    referrals:parseRows(results[5]).map(row=>({name:row.dims[0],value:row.values[0]})),
    downloads:downloads.map(row=>({host:row.dims[0],value:row.values[0]}))
  };
  // Prevent unbounded isolate cache growth; authentication is checked before any cache read.
  if(reportCache.size>=24)reportCache.clear();
  reportCache.set(cacheKey,{data:payload,until:Date.now()+60000});
  return payload;
}
export async function onRequestGet({request,env}) {
  const url=new URL(request.url);
  if(url.hostname!==HOME)return reject('NOT_FOUND',404);
  if(!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAIL)return reject('AUTH_NOT_CONFIGURED',503);
  if(!await allowAdmin(request,env))return reject('FORBIDDEN',403);
  if(!env.GA4_PROPERTY_ID || !env.GA4_SERVICE_ACCOUNT_JSON)return reject('GA4_NOT_CONFIGURED',503);
  const site=url.searchParams.get('site')||'all';
  if(site!=='all' && !Object.hasOwn(SITE_HOSTS,site))return reject('INVALID_FILTER',400);
  const range=dates(url);
  if(!range)return reject('INVALID_DATE_RANGE',400);
  try{return json(await report(env,site,range));}
  catch{return reject('GA4_UNAVAILABLE',502);}
}
