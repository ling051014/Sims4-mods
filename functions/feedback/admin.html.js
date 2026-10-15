/* Protect the management HTML itself, not only its backing APIs. */
import {allowAdmin} from './ga4-api.js';
const HOME='home.by-l1ng.com';
const rejected=(status,error)=>new Response(JSON.stringify({ok:false,error}),{
  status,headers:{'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store, private','x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer'}
});
export async function onRequestGet({request,env,next}) {
  const url=new URL(request.url);
  if(url.hostname!==HOME || url.pathname!=='/feedback/admin.html')return rejected(404,'NOT_FOUND');
  if(!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAIL)
    return rejected(503,'AUTH_NOT_CONFIGURED');
  if(!await allowAdmin(request,env))return rejected(403,'FORBIDDEN');
  const response=await next();
  const headers=new Headers(response.headers);
  headers.set('cache-control','no-store, private');
  headers.set('x-content-type-options','nosniff');
  headers.set('referrer-policy','no-referrer');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
