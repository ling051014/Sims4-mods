import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {onRequestGet} from '../functions/feedback/ga4-api.js';
import {onRequestGet as adminPage} from '../functions/feedback/admin.html.js';

const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'l1ng-test-kid',alg:'RS256',use:'sig'};
const pem=privateKey.export({format:'pem',type:'pkcs8'}).toString();
const b64=value=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
function accessJwt({aud='l1ng-test-aud',email='admin@example.org',expired=false}={}) {
  const now=Math.floor(Date.now()/1000);
  const head=b64({alg:'RS256',typ:'JWT',kid:'l1ng-test-kid'});
  const body=b64({iss:'https://l1ng-test.cloudflareaccess.com',aud,email,iat:now-5,exp:expired?now-2:now+3600});
  const message=head+'.'+body;
  return message+'.'+sign('RSA-SHA256',Buffer.from(message),privateKey).toString('base64url');
}
const credentials=JSON.stringify({
  type:'service_account',
  client_email:'l1ng-ga4-reader@example.iam.gserviceaccount.com',
  private_key:pem,
  token_uri:'https://oauth2.googleapis.com/token'
});
const env={
  ACCESS_TEAM_DOMAIN:'https://l1ng-test.cloudflareaccess.com',
  ACCESS_AUD:'l1ng-test-aud',
  ADMIN_EMAIL:'admin@example.org',
  GA4_PROPERTY_ID:'558394569',
  GA4_SERVICE_ACCOUNT_JSON:credentials
};
function request({host='home.by-l1ng.com',token='',params='site=all&startDate=2026-10-01&endDate=2026-10-10'}={}) {
  return new Request('https://'+host+'/feedback/ga4-api?'+params,{
    headers:token?{'Cf-Access-Jwt-Assertion':token}:{}
  });
}
async function response(args,settings=env) {
  const result=await onRequestGet({request:request(args),env:settings});
  return {status:result.status,body:await result.json(),headers:result.headers};
}
test('rejects non-home host and unauthenticated dashboard clients',async()=>{
  assert.equal((await response({host:'realdate.by-l1ng.com'})).status,404);
  assert.equal((await response({})).status,403);
  assert.equal((await response({token:accessJwt({expired:true})})).status,403);
  assert.equal((await response({token:accessJwt({email:'intruder@example.org'})})).status,403);
  assert.equal((await response({token:accessJwt({aud:'wrong-aud'})})).status,403);
  assert.equal((await response({},{})).status,503);
});
test('rejects invalid website and date filters after Access authentication',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({keys:[jwk]});
  try {
    const token=accessJwt();
    assert.equal((await response({token,params:'site=invalid&startDate=2026-10-01&endDate=2026-10-10'})).status,400);
    assert.equal((await response({token,params:'site=all&startDate=2026-10-11&endDate=2026-10-01'})).status,400);
    assert.equal((await response({token,params:'site=all&startDate=2020-01-01&endDate=2026-10-01'})).status,400);
    assert.equal((await response({token},{...env,GA4_SERVICE_ACCOUNT_JSON:''})).status,503);
  } finally {globalThis.fetch=original;}
});
test('serves only real GA4-shaped reports to a cryptographically verified admin',async()=>{
  const original=globalThis.fetch;
  let calls=0,reportCalls=0;
  const seen=[];
  globalThis.fetch=async(input,options={})=>{
    const url=String(input);calls++;
    seen.push(new URL(url).hostname);
    if(url.endsWith('/cdn-cgi/access/certs'))return Response.json({keys:[jwk]});
    if(url==='https://oauth2.googleapis.com/token'){
      assert.match(String(options.body),/grant_type=/);
      return Response.json({access_token:'fake-google-access-token',expires_in:3599});
    }
    if(url.includes('analyticsdata.googleapis.com/v1beta/properties/558394569:runReport')){
      assert.equal(options.headers.authorization,'Bearer fake-google-access-token');
      const q=JSON.parse(options.body),dimensions=q.dimensions.map(x=>x.name);
      assert.equal(q.dimensionFilter.filter?.fieldName || q.dimensionFilter.andGroup?.expressions?.[0]?.filter?.fieldName,'hostName');
      reportCalls++;
      const tuples={
        '':['12','31','5'],
        date:['12'],
        'hostName,pagePath':['31'],
        country:['8'],
        deviceCategory:['7'],
        sessionSourceMedium:['10'],
        hostName:['3']
      };
      const names=tuples[dimensions.join(',')];
      assert.ok(names,'Unexpected dimensions '+dimensions.join(','));
      const dims={
        '':[],date:['20261003'],'hostName,pagePath':['home.by-l1ng.com','/'],
        country:['Taiwan'],deviceCategory:['mobile'],sessionSourceMedium:['(direct) / (none)'],
        hostName:['realdate.by-l1ng.com']
      };
      return Response.json({rows:[{
        dimensionValues:dims[dimensions.join(',')].map(value=>({value})),
        metricValues:names.map(value=>({value}))
      }]});
    }
    throw Error('Unexpected outbound call: '+url);
  };
  try {
    const result=await response({token:accessJwt()});
    assert.equal(result.status,200,'Outbound host sequence: '+seen.join(', ')+'; reportCalls='+reportCalls);
    assert.equal(result.headers.get('cache-control'),'no-store, private');
    assert.equal(result.body.summary.activeUsers,12);
    assert.equal(result.body.summary.views,31);
    assert.equal(result.body.summary.downloads,3);
    assert.equal(result.body.pages[0].host,'home.by-l1ng.com');
    assert.equal(result.body.countries[0].name,'Taiwan');
    assert.equal(result.body.trend[0].date,'20261003');
    assert.equal(result.body.downloads[0].value,3);
    assert.equal(reportCalls,7);
    assert.ok(calls>=9);
    assert.equal(JSON.stringify(result.body).includes('PRIVATE KEY'),false);
  } finally {globalThis.fetch=original;}
});

test('admin HTML is not publicly readable and preserves original content for a verified admin',async()=>{
  const original=globalThis.fetch;
  let served=0;
  globalThis.fetch=async()=>Response.json({keys:[jwk]});
  const next=async()=>{served++;return new Response('<html>PRIVATE DASHBOARD</html>',{headers:{'content-type':'text/html'}});};
  try {
    let res=await adminPage({request:new Request('https://home.by-l1ng.com/feedback/admin.html'),env,next});
    assert.equal(res.status,403);
    assert.equal(served,0);
    res=await adminPage({request:new Request('https://home.by-l1ng.com/feedback/admin.html',{headers:{'Cf-Access-Jwt-Assertion':accessJwt()}}),env,next});
    assert.equal(res.status,200);
    assert.match(await res.text(),/PRIVATE DASHBOARD/);
    assert.equal(served,1);
    assert.equal(res.headers.get('cache-control'),'no-store, private');
  }finally{globalThis.fetch=original;}
});
