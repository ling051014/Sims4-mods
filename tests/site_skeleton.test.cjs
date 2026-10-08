// ========【全站骨架屏回歸】 檢查頁面使用正確版型與快取版本 ========
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const assert = require("node:assert/strict");
const test = require("node:test");
const root = join(__dirname, "..");
const script = readFileSync(join(root,"site-skeleton.js"),"utf8");
const style = readFileSync(join(root,"site-skeleton.css"),"utf8");
const layouts = new Map([
  ["index.html","mods-home"],
  ...["build-buy","cas","cheat-mods","default-mods","nsfw-mods","other","pose-mods","prep-mods","slider","social-mods","ui-mods","world-mods"].map(k=>[k+".html","mods-list"]),
  ["L1nG/home.html","l1ng-home"],
  ["L1nG/home-en.html","l1ng-home"],
  ["L1nG/changelog.html","l1ng-changelog"],
  ["L1nG/Translations/index.html","translations"],
  ["L1nG/GenealogyExporter/index.html","genealogy-exporter"],
  ["L1nG/RealDate/index.html","realdate-home"],
  ...["download","installation","faq","roadmap","gameplay","compatibility","changelog"].map(k=>["L1nG/RealDate/"+k+".html","realdate-"+k])
]);
test("正式頁面皆使用對應骨架及最新版資源",()=>{
  for (const [path,layout] of layouts) {
    const html=readFileSync(join(root,path),"utf8");
    assert.ok(html.includes('data-skeleton-layout="'+layout+'"'), path+" layout");
    assert.ok(html.includes("site-skeleton.js?v=20261008-site-skeleton-r2"),path+" JS cache");
    assert.ok(html.includes("site-skeleton.css?v=20261008-site-skeleton-r2"),path+" CSS cache");
    assert.ok(script.includes('"'+layout+'": () =>'),layout+" template");
  }
});
test("特殊版面不使用通用四宮格",()=>{
  assert.match(script,/sk-exporter-hero/);
  assert.match(script,/sk-translation-toolbar/);
  assert.match(script,/sk-faq-row/);
  assert.match(script,/sk-timeline-row/);
  assert.match(script,/sk-calendar-scene/);
  assert.match(script,/sk-download-card/);
  assert.match(script,/sk-doc-index/);
  assert.match(style,/\.sk-translation-grid\s*\{\s*display:grid;\s*grid-template-columns:repeat\(2/);
  assert.match(style,/\.sk-realdate-home-hero\s*\{[^}]*grid-template-columns:/);
  assert.match(style,/@media \(max-width:720px\)/);
  assert.doesNotMatch(style,/!important/);
});
test("骨架退出由單一公開 ready 接口控制",()=>{
  assert.match(script,/window\.L1nGSkeleton/);
  assert.match(script,/prefers-reduced-motion/);
  assert.match(script,/transitionend/);
});
