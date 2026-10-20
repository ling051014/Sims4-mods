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
const outputs=new Map();
for(const path of pages){
 const tag=path.replace(/\.html$/,"").replace(/[^a-z0-9]+/g,"-");
 const json=JSON.parse(await readFile(resolve(root,"data/mods",tag+".json"),"utf8"));
 const tpl=await readFile(resolve(root,"templates/mod-pages",path),"utf8");
 if(json.schemaVersion!==1||json.sourceFile!==path)throw Error("invalid schema "+path);
 const map=new Map(json.cards.map(c=>[c.id,c]));if(map.size!==json.cards.length)throw Error("duplicate IDs "+path);
 let n=0;
 let built=tpl.replace(/<!-- MOD_CARD:([a-z0-9-]+) -->/g,(_,id)=>{
  const c=map.get(id);if(!c)throw Error("missing "+id);n++;
  return c.template.replace(/\{\{(\w+)\}\}/g,(_whole,key)=>{
   if(!Object.hasOwn(c.slots,key))throw Error("missing slot "+id+" "+key);
   return c.slots[key];
  }).replace('<div class="mod-card">','<div class="mod-card" id="mod-'+id+'">');
 });
 if(n!==json.cards.length)throw Error("card mismatch "+path);
 built=built.replace(/(\n[ \t]*)(<div class="mod-container">)/,(_,space,tag)=>space+"<div class=\"mod-sort-bar\">\n  <label for=\"mod-sort\">排序</label>\n  <select id=\"mod-sort\" aria-label=\"模組排序\">\n    <option value=\"original\">原本順序</option>\n    <option value=\"author-asc\">作者 A–Z</option>\n    <option value=\"author-desc\">作者 Z–A</option>\n  </select>\n</div>"+space+tag);
 built=built.replace('</body>', '    <script src="mod-sort.js?v=20261020-author-sort"></script>\n</body>');
 outputs.set(path,built);
}
const check=process.argv.includes("--check");
for(const [path,html] of outputs){
 if(check){if(await readFile(resolve(root,path),"utf8")!==html)throw Error("stale "+path)}
 else await writeFile(resolve(root,path),html,"utf8");
}
console.log((check?"Verified ":"Generated ")+outputs.size+" categorized pages");
