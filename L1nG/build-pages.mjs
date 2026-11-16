#!/usr/bin/env node
/**
 * L1nG Cloudflare Pages unified production builder.
 * Usage: node L1nG/build-pages.mjs home|realdate|genealogy|extractor|translations
 * Pages output directory (every project): dist
 * Never expose feedback/api, tests, server credentials or private Worker sources.
 */
import fs from 'node:fs';
import path from 'node:path';

const modes = ['home','realdate','genealogy','extractor','translations'];
const mode = process.argv[2];
if (!modes.includes(mode)) {
  console.error('Usage: node L1nG/build-pages.mjs ' + modes.join('|'));
  process.exit(2);
}
const base = process.cwd();
const out = path.resolve(base,'dist');
const site = (...parts) => path.join(base,'L1nG',...parts);
const put = (from,to) => {
  if (!fs.existsSync(from)) throw new Error('Missing input file: ' + from);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.cpSync(from,to,{recursive:true,force:true});
};
const file = (source,dest=source) => put(site(source),path.join(out,dest));
const folder = (source,dest=source) => put(site(source),path.join(out,dest));
const contents = source => {
  for (const name of fs.readdirSync(site(source))) file(path.join(source,name),name);
};
fs.rmSync(out,{force:true,recursive:true});
fs.mkdirSync(out,{recursive:true});

// Resources required by page-local links and the shared about/privacy modal.
for (const name of ['site-skeleton.css','site-skeleton.js','site-language.js','site-user-select.css']) put(path.join(base,name),path.join(out,name));
for (const name of [
  'site-footer.css','site-info-modal.css','site-info-modal.js',
  'site-info.css','site-info.js','site-info.html','site-scrollbar.css'
]) file(name);
// Repository SVG sources are stored exclusively in html icons/.
for (const icon of ['ui-search.svg', 'ui-clear.svg', 'afdian.svg',
                    'genealogy-extractor.svg', 'genealogy-people.svg',
                    'genealogy-zip-folder.svg', 'patreon.svg',
                    'tumblr.svg', 'curseforge.svg']) {
  put(path.join(base,'html icons',icon),path.join(out,'html icons',icon));
}
file('analytics.js');
file('cookie-consent.js');
file('cookie-consent.css');
// Only regional consent and the protected home GA4 reports use Pages Functions.
const functionRoutes=['/l1ng-analytics-region'];
if (mode==='home') functionRoutes.push('/feedback/ga4-api','/feedback/admin.html');
fs.writeFileSync(path.join(out,'_routes.json'),
  JSON.stringify({version:1,include:functionRoutes,exclude:[]}));
const publicFeedback = [
  'feedback-core.js','feedback-i18n.js','feedback-loading.css',
  'feedback.css','realdate-feedback-live.js','select-ui.js'
];
if (mode === 'home') {
  for (const name of [
    'home.css','home.js','home.html','home-en.html',
    'changelog.css','changelog.js','changelog.html'
  ]) file(name);
  // The dashboard belongs on the home domain only. Its API is NOT a static file.
  for (const name of ['admin.html','admin.css','admin-network.js','admin-time.js','ga4-country-labels.js','admin.js','ga4-dashboard.js','admin-date-picker.js','feedback.css','select-ui.js']) {
    file(path.join('feedback',name),path.join('feedback',name));
  }
  put(site('home.html'),path.join(out,'index.html'));
} else if (mode === 'realdate') {
  contents('RealDate');
  for (const name of publicFeedback) file(path.join('feedback',name),path.join('feedback',name));
} else if (mode === 'genealogy') {
  contents('GenealogyExporter');
  put(path.join(base,'html icons','relationship-label-icons.svg'),path.join(out,'html icons','relationship-label-icons.svg'));
  file('feedback/feedback-core.js');
  put(site('GenealogyExporter','genealogy.html'),path.join(out,'index.html'));
} else if (mode === 'extractor') {
  for (const name of ['genealogy-exporter.html','genealogy-exporter.css','genealogy-exporter.js']) {
    file(path.join('GenealogyExporter',name),name);
  }
  // The exporter uses local favicon paths; include the two source assets.
  file('GenealogyExporter/favicon.svg','favicon.svg');
  file('GenealogyExporter/favicon-32.png','favicon-32.png');
  // Keep the install ZIP alongside the deployed page at /downloads/.
  folder('GenealogyExporter/downloads','downloads');
  put(site('GenealogyExporter','genealogy-exporter.html'),path.join(out,'index.html'));
} else if (mode === 'translations') {
  contents('Translations');
}

// CSS/JS sit at the Pages domain root, whereas development source files
// live two levels below html icons. Rewrite only deployed copies.
if (mode === 'genealogy' || mode === 'translations') {
  const cssFile = path.join(out,mode === 'genealogy' ? 'genealogy.css' : 'translations.css');
  const css = fs.readFileSync(cssFile,'utf8');
  fs.writeFileSync(cssFile,css.replaceAll('../../html%20icons/','html%20icons/'),'utf8');
}
if (mode === 'extractor') {
  const cssFile = path.join(out,'genealogy-exporter.css');
  const css = fs.readFileSync(cssFile,'utf8');
  fs.writeFileSync(cssFile,css.replaceAll('../../html%20icons/','html%20icons/'),'utf8');
}
if (mode === 'genealogy') {
  const sceneFile = path.join(out,'genealogy_scene.js');
  const scene = fs.readFileSync(sceneFile,'utf8');
  fs.writeFileSync(sceneFile,scene.replaceAll('../../html%20icons/','html%20icons/'),'utf8');
}

// Keep each project's navigation on its own domain, rather than showing another
// website under a URL served by the wrong Cloudflare Pages project.
const domains = {
  'RealDate/index.html':'https://realdate.by-l1ng.com/',
  'GenealogyExporter/genealogy.html':'https://genealogy-tool.by-l1ng.com/',
  'GenealogyExporter/genealogy-exporter.html':'https://genealogy-exporter.by-l1ng.com/',
  'Translations/index.html':'https://translations.by-l1ng.com/'
};
// Rewrite only public HTML navigation in the deployed copies. Source files
// retain their .html names. Never change assets or protected admin URLs.
const origins={
  home:'https://home.by-l1ng.com',
  realdate:'https://realdate.by-l1ng.com',
  genealogy:'https://genealogy-tool.by-l1ng.com',
  extractor:'https://genealogy-exporter.by-l1ng.com',
  translations:'https://translations.by-l1ng.com'
};
const aliases={
  home:new Set(['/index.html','/home.html']),
  realdate:new Set(['/index.html']),
  genealogy:new Set(['/index.html','/genealogy.html']),
  extractor:new Set(['/index.html','/genealogy-exporter.html']),
  translations:new Set(['/index.html'])
};
const rewrite=(value,attribute,relative)=>{
  if(attribute!=='href'||/^(#|mailto:|tel:|javascript:|data:|blob:)/i.test(value))return value;
  const main=value.split(/[?#]/,1)[0],suffix=value.slice(main.length);
  let link=value;
  if(main==='../home.html'||main==='home.html'&&mode!=='home')
    link=origins.home+'/'+suffix;
  else if(main==='../home-en.html')link=origins.home+'/home-en.html'+suffix;
  else if(domains[main])link=domains[main]+suffix;
  else if(main.startsWith('RealDate/'))
    link=origins.realdate+'/'+main.slice('RealDate/'.length)+suffix;
  else if(main.startsWith('GenealogyExporter/'))
    link=origins.genealogy+'/'+main.slice('GenealogyExporter/'.length)+suffix;
  else if(mode==='genealogy'&&main==='genealogy-exporter.html')
    link=origins.extractor+'/'+suffix;
  else if(mode==='extractor'&&main==='genealogy.html')
    link=origins.genealogy+'/'+suffix;
  let url;
  try{url=new URL(link,new URL(relative,origins[mode]+'/'));}catch{return link;}
  const target=Object.keys(origins).find(k=>origins[k]===url.origin);
  if(!target||!url.pathname.endsWith('.html'))return link;
  // Protected dashboard keeps its exact access-controlled pathname.
  if(target==='home'&&url.pathname==='/feedback/admin.html')return link;
  const canonical=aliases[target].has(url.pathname)
    ? '/' : url.pathname.slice(0,-5);
  return target===mode
    ? canonical+url.search+url.hash
    : origins[target]+canonical+url.search+url.hash;
};
function htmlFiles(directory) {
  const all=[];
  for (const child of fs.readdirSync(directory,{withFileTypes:true})) {
    const p=path.join(directory,child.name);
    if (child.isDirectory()) all.push(...htmlFiles(p));
    else if (child.name.endsWith('.html')) all.push(p);
  }
  return all;
}
const htmls=htmlFiles(out);
let analyticsPages=0;
for(const p of htmls) {
  const html=fs.readFileSync(p,'utf8');
  const relative=path.relative(out,p).split(path.sep).join('/');
  let modified=html.replace(/\b(href|src)=(["'])([^"']+)\2/g, (whole,key,quote,value)=>
    key+'='+quote+rewrite(value,key,relative)+quote);
  // Never count private administrator activity as public traffic.
  if (relative !== 'feedback/admin.html') {
    if (!/<\/head\s*>/i.test(modified)) throw new Error('Missing HTML head: '+relative);
    const assetPrefix='../'.repeat(relative.split('/').length-1);
    if (!/src=["'][^"']*cookie-consent\.js(?:[?"'])/.test(modified)) {
      modified=modified.replace(/<\/head\s*>/i,
        '    <link rel="stylesheet" href="'+assetPrefix+'cookie-consent.css?v=20261029-cookie-states-r1">\n' +
        '    <script src="'+assetPrefix+'cookie-consent.js?v=20261015-cookie-preferences-skeleton-r4" defer></script>\n</head>');
    }
    analyticsPages++;
  }
  if (modified!==html) fs.writeFileSync(p,modified,'utf8');
}

// Validate every local URL referenced literally by deployed HTML; a Pages build
// succeeds only if the requested CSS, JS, images and linked HTML actually exist.
const missing=[];
for (const p of htmls) {
  const html=fs.readFileSync(p,'utf8');
  const rel=path.relative(out,p).split(path.sep).join('/');
  const pageUrl='https://pages.example/'+rel;
  for (const item of html.matchAll(/\b(?:href|src)=(["'])([^"']+)\1/g)) {
    const value=item[2];
    if (!value || /^#|^(mailto:|tel:|javascript:|data:|blob:)/i.test(value)) continue;
    let target;
    try { target=new URL(value,pageUrl); } catch { missing.push(rel+': invalid URL '+value); continue; }
    if (target.origin!=='https://pages.example') continue;
    const resolved=path.join(out,decodeURIComponent(target.pathname).replace(/^\/+/,''));
    const exists=fs.existsSync(resolved) &&
      (!fs.statSync(resolved).isDirectory() || fs.existsSync(path.join(resolved,'index.html')));
    const alias=target.pathname.endsWith('/')
      ? path.join(resolved,'index.html') : resolved+'.html';
    if (!exists && !fs.existsSync(alias)) missing.push(rel+': missing '+value);
  }
}
if (mode==='home') {
  for(const name of ['feedback/admin.html','feedback/admin-network.js','feedback/admin-time.js','feedback/ga4-country-labels.js','feedback/admin.js','feedback/ga4-dashboard.js','feedback/admin-date-picker.js','feedback/admin.css'])
    if(!fs.existsSync(path.join(out,name)))missing.push('Missing dashboard '+name);
}
if (mode==='realdate' && !fs.existsSync(path.join(out,'feedback.html'))) missing.push('Missing RealDate feedback page');
if (mode==='genealogy' && !fs.existsSync(path.join(out,'assets/sample-portraits'))) missing.push('Missing genealogy portraits');
if (fs.existsSync(path.join(out,'feedback/api'))) missing.push('Refuse to publish Worker API sources');
if (fs.existsSync(path.join(out,'tests'))) missing.push('Refuse to publish tests');
if (missing.length) {
  console.error('Pages build failed:\n'+missing.join('\n'));
  process.exit(1);
}
fs.writeFileSync(path.join(out,'404.html'),
  '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>找不到頁面 · L1nG</title><body><h1>找不到頁面</h1><p>這個網址不存在。</p><a href="https://home.by-l1ng.com/">返回 L1nG</a></body></html>');
console.log('Pages build ready:',mode,'— HTML:',htmls.length,'— GA4 pages:',analyticsPages,'— output: dist');
