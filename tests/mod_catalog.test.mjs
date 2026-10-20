import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const pages=["prep-mods.html","cheat-mods.html","ui-mods.html","world-mods.html","default-mods.html","nsfw-mods.html","social-mods.html","build-buy.html","cas.html","slider.html","pose-mods.html","other.html"];
let total=0;const seen=new Set();
for(const p of pages){const t=p.replace(/\.html$/,"").replace(/[^a-z0-9]+/g,"-");
 const data=JSON.parse(await readFile("data/mods/"+t+".json","utf8")),shell=await readFile("templates/mod-pages/"+p,"utf8"),html=await readFile(p,"utf8");
 assert.equal(data.cards.length,(shell.match(/<!-- MOD_CARD:/g)||[]).length);
 for(const card of data.cards){assert(!seen.has(card.id));seen.add(card.id);total++;assert(html.includes('id="mod-'+card.id+'"'));assert(card.slots.titleHtml&&card.slots.authorHtml)}
 assert(html.includes('href="authors.html"'));
}
assert.equal(total,194);
const authors=await readFile("authors.html","utf8");assert(authors.includes("NeedCoffee4That"));assert(authors.includes("cas.html#mod-cas-"));
console.log("PASS: 194 cards, 12 categories, author index");
