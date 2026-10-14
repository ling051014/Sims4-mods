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
for (const name of ['site-skeleton.css','site-skeleton.js']) put(path.join(base,name),path.join(out,name));
for (const name of [
  'site-footer.css','site-info-modal.css','site-info-modal.js',
  'site-info.css','site-info.js','site-info.html'
]) file(name);
// Repository SVG sources are stored exclusively in html icons/.
for (const icon of ['ui-search.svg', 'ui-clear.svg', 'afdian.svg',
                    'genealogy-extractor.svg', 'genealogy-people.svg',
                    'genealogy-zip-folder.svg', 'patreon.svg']) {
  put(path.join(base,'html icons',icon),path.join(out,'html icons',icon));
}
file('analytics.js');
file('cookie-consent.js');
file('cookie-consent.css');
// Scope the only Pages Function to its one analytics-region endpoint;
// all regular web pages and assets remain purely static.
fs.writeFileSync(path.join(out,'_routes.json'),
  JSON.stringify({version:1,include:['/l1ng-analytics-region'],exclude:[]}));
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
  for (const name of ['admin.html','admin.css','admin.js','feedback.css','select-ui.js']) {
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
const rewrite = (value,attribute) => {
  if (attribute !== 'href') return value;
  const main=value.split(/[?#]/,1)[0];
  if (value.startsWith('../home.html') || value==='home.html' && mode!=='home')
    return 'https://home.by-l1ng.com/' + value.slice(main.length);
  if (domains[main]) return domains[main]+value.slice(main.length);
  if (main.startsWith('RealDate/')) return 'https://realdate.by-l1ng.com/'+main.slice('RealDate/'.length)+value.slice(main.length);
  if (main.startsWith('GenealogyExporter/')) return 'https://genealogy-tool.by-l1ng.com/'+main.slice('GenealogyExporter/'.length)+value.slice(main.length);
  if (mode==='genealogy' && main==='genealogy-exporter.html')
    return 'https://genealogy-exporter.by-l1ng.com/'+value.slice(main.length);
  if (mode==='extractor' && main==='genealogy.html')
    return 'https://genealogy-tool.by-l1ng.com/'+value.slice(main.length);
  return value;
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
  let modified=html.replace(/\b(href|src)=(["'])([^"']+)\2/g, (whole,key,quote,value)=>
    key+'='+quote+rewrite(value,key)+quote);
  const relative=path.relative(out,p).split(path.sep).join('/');
  // Never count private administrator activity as public traffic.
  if (relative !== 'feedback/admin.html') {
    if (!/<\/head\s*>/i.test(modified)) throw new Error('Missing HTML head: '+relative);
    const assetPrefix='../'.repeat(relative.split('/').length-1);
    modified=modified.replace(/<\/head\s*>/i,
      '    <link rel="stylesheet" href="'+assetPrefix+'cookie-consent.css?v=20261014-consent-r1">\n' +
      '    <script src="'+assetPrefix+'cookie-consent.js?v=20261015-consent-region-r1" defer></script>\n</head>');
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
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory() && !fs.existsSync(path.join(resolved,'index.html'))) {
      missing.push(rel+': missing '+value);
    }
  }
}
if (mode==='home') {
  for(const name of ['feedback/admin.html','feedback/admin.js','feedback/admin.css'])
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
