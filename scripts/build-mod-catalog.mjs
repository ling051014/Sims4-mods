// L1nG mod collection: generated static pages. Run: node scripts/build-mod-catalog.mjs [--check]
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const pages=["prep-mods.html","cheat-mods.html","ui-mods.html","world-mods.html","default-mods.html","nsfw-mods.html","social-mods.html","build-buy.html","cas.html","slider.html","pose-mods.html","other.html"];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const text=s=>String(s).replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
const name=s=>text(s.replace(/<br\s*\/?>/gi," / "));
const author=s=>text(s.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1]||s.match(/<a\b[^>]*>([^<\n\r]+)/i)?.[1]||s).replace(/^by\s+/i,"")||"作者未標示";
const image=s=>{const u=s.match(/<img[^>]*\bsrc=["']([^"']+)["']/i)?.[1];return u&&!/\/\.(jpg|png|webp|gif)/i.test(u)?u:""};
const outputs=new Map(),all=[];
for(const path of pages){
 const tag=path.replace(/\.html$/,"").replace(/[^a-z0-9]+/g,"-");
 const json=JSON.parse(await readFile(resolve(root,"data/mods",tag+".json"),"utf8"));
 const tpl=await readFile(resolve(root,"templates/mod-pages",path),"utf8");
 if(json.schemaVersion!==1||json.sourceFile!==path)throw Error("invalid schema "+path);
 const map=new Map(json.cards.map(c=>[c.id,c]));if(map.size!==json.cards.length)throw Error("duplicate IDs "+path);
 let n=0;
 let built=tpl.replace(/<!-- MOD_CARD:([a-z0-9-]+) -->/g,(_,id)=>{
  const c=map.get(id);if(!c)throw Error("missing "+id);n++;
  all.push({id,path,title:name(c.slots.titleHtml),author:author(c.slots.authorHtml),image:image(c.slots.previewHtml)});
  return c.template.replace(/\{\{(\w+)\}\}/g,(_whole,key)=>{
   if(!Object.hasOwn(c.slots,key))throw Error("missing slot "+id+" "+key);
   return c.slots[key];
  }).replace('<div class="mod-card">','<div class="mod-card" id="mod-'+id+'">');
 });
 if(n!==json.cards.length)throw Error("card mismatch "+path);
 built=built.replace(/(<div class="nav-links">[\s\S]*?)(\s*<\/div>)/,(_,a,b)=>a+' <span style="color: #eee;">/</span> <a href="authors.html">作者</a>'+b);
 outputs.set(path,built);
}
const groups=new Map();
for(const c of all){if(!groups.has(c.author))groups.set(c.author,[]);groups.get(c.author).push(c)}
const cards=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0],"zh-Hant")).map(([label,mods])=>{
 const cover=mods.find(m=>m.image)?.image;
 const pic=cover?'<div class="preview-img"><img src="'+esc(cover)+'" alt=""></div>':"";
 const links=mods.map(m=>'<a href="'+esc(m.path)+'#mod-'+m.id+'">'+esc(m.title)+'</a>').join("<br>\n");
 return '<div class="mod-card">'+pic+'<div class="content"><h2 class="mod-header">'+esc(label)+'</h2><div class="author">收藏作者 / '+mods.length+' 款模組</div><div class="details"><div class="info-row">'+links+'</div></div></div></div>';
}).join("\n");
const authors=`<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LING'S SIMS 4 MODS - 作者索引</title>
<link rel="stylesheet" href="style.css?v=20261011-unified-controls-r1">
<link rel="stylesheet" href="site-skeleton.css?v=20261012-site-skeleton-hero-sync-r3"></head>
<body class="mod-list-page">
<script src="site-skeleton.js?v=20261012-site-skeleton-hero-sync-r3" data-skeleton-layout="mods-list"></script>
<nav class="nav-menu"><div class="nav-links"><a href="index.html">首頁</a> <span style="color: #eee;">/</span> <a href="#">依作者查看</a></div><div class="search-box"><input type="text" id="mod-search" placeholder="搜尋作者或模組..." onkeyup="searchMods()"><div id="search-results" class="search-dropdown"></div></div></nav>
<main class="page-scroll"><div class="mod-container">
${cards}
</div></main>
<script src="script.js?v=20261011-unified-controls-r1"></script>
</body></html>
`;
outputs.set("authors.html",authors);
const check=process.argv.includes("--check");
for(const [path,html] of outputs){
 if(check){if(await readFile(resolve(root,path),"utf8")!==html)throw Error("stale "+path)}
 else await writeFile(resolve(root,path),html,"utf8");
}
console.log((check?"Verified ":"Generated ")+all.length+" mods, "+groups.size+" authors, "+outputs.size+" pages");
