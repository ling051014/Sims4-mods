// Production public-URL contracts. HTML files stay named .html in GitHub.
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const {test} = require('node:test');
const assert = require('node:assert/strict');
const root=join(__dirname,'..');
const build=readFileSync(join(root,'L1nG/build-pages.mjs'),'utf8');
const router=readFileSync(join(root,'L1nG/RealDate/realdate-router.js'),'utf8');
const indicator=readFileSync(join(root,'L1nG/RealDate/realdate-nav-indicator.js'),'utf8');
const realdate=readFileSync(join(root,'L1nG/RealDate/realdate.js'),'utf8');
const start=build.indexOf('const domains = ');
const stop=build.indexOf('function htmlFiles(directory)',start);
assert.ok(start>=0&&stop>start,'public URL rewrite block is available');
const rewriteSource=build.slice(start,stop);

function rewrite(mode,value,relative='index.html'){
  return runInNewContext(rewriteSource+'\nrewrite(value,"href",relative)',{
    URL,mode,value
  });
}

test('five deployed sites use extensionless canonical public links',()=>{
  for(const [site,href,from,want] of [
    ['realdate','faq.html','index.html','/faq'],
    ['realdate','faq.html#faq-resource','download.html','/faq#faq-resource'],
    ['realdate','download.html?from=faq#installation','faq.html','/download?from=faq#installation'],
    ['realdate','index.html','faq.html','/'],
    ['realdate','../home.html#projects','faq.html','https://home.by-l1ng.com/#projects'],
    ['home','home.html#projects','home.html','/#projects'],
    ['home','home-en.html','index.html','/home-en'],
    ['home','RealDate/index.html','index.html','https://realdate.by-l1ng.com/'],
    ['home','RealDate/changelog.html#v060','index.html','https://realdate.by-l1ng.com/changelog#v060'],
    ['genealogy','genealogy-exporter.html','index.html','https://genealogy-exporter.by-l1ng.com/'],
    ['extractor','genealogy.html','index.html','https://genealogy-tool.by-l1ng.com/'],
    ['translations','index.html','index.html','/'],
    ['realdate','https://home.by-l1ng.com/site-info.html#privacy','faq.html','https://home.by-l1ng.com/site-info#privacy']
  ]) assert.equal(rewrite(site,href,from),want,site+' '+href);
});

test('assets, protected admin paths, external URLs and fragment links are untouched',()=>{
  for(const [site,href,from] of [
    ['home','feedback/admin.html','index.html'],
    ['realdate','downloads/L1nG_RealDate_v0.6%20Beta.zip','download.html'],
    ['realdate','realdate.css?v=1','index.html'],
    ['realdate','#v060','changelog.html'],
    ['home','https://example.net/abc.html','index.html'],
    ['home','mailto:test@example.net','index.html']
  ]) assert.equal(rewrite(site,href,from),href);
});

test('RealDate router recognizes both clean and legacy HTML URLs',()=>{
  const a=router.indexOf('  function routeName(target) {');
  const b=router.indexOf('  function isPlainClick(event, anchor) {',a);
  assert.ok(a>0&&b>a);
  const snippet=router.slice(a,b);
  const base=new URL('https://realdate.by-l1ng.com/');
  const location={href:base.href,origin:base.origin,pathname:base.pathname};
  const pages=new Set(['index.html','faq.html','download.html','changelog.html','feedback.html']);
  for(const [url,expected] of [
    ['https://realdate.by-l1ng.com/','index.html'],
    ['https://realdate.by-l1ng.com/index.html','index.html'],
    ['https://realdate.by-l1ng.com/faq','faq.html'],
    ['https://realdate.by-l1ng.com/faq.html','faq.html'],
    ['https://realdate.by-l1ng.com/download#installation','download.html'],
    ['https://realdate.by-l1ng.com/faq?x=1','faq.html'],
    ['https://realdate.by-l1ng.com/not-exist',null],
    ['https://other.example/faq',null]
  ]){
    const got=runInNewContext(snippet+'\nrouteName(target)',{URL,location,base,pages,target:url});
    assert.equal(got,expected,url);
  }
  const canonical=runInNewContext(snippet+'\ncleanUrl(target).href',{
    URL,location,base,pages,target:'https://realdate.by-l1ng.com/faq.html#faq-resource'
  });
  assert.equal(canonical,'https://realdate.by-l1ng.com/faq#faq-resource');
});

test('navigation indicator and page titles accept clean routes',()=>{
  assert.match(indicator,/const normalize = path =>/);
  assert.match(realdate,/segment\.endsWith\('\.html'\)/);
  assert.match(router,/history\.pushState\([^\n]*cleanUrl\(url\)\.href/);
});
