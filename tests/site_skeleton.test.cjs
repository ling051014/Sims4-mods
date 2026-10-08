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
  assert.match(script,/<div class="sk-site-brand">/);
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

test("18 種骨架皆可建立畫面並確實退出",()=>{
  const vm=require("node:vm");
  const all=[
    "mods-home","mods-list","mods-table","l1ng-home","l1ng-changelog",
    "genealogy-exporter","translations","realdate-home","realdate-download",
    "realdate-installation","realdate-faq","realdate-roadmap","realdate-gameplay",
    "realdate-compatibility","realdate-changelog","realdate-content",
    "l1ng-content","product"
  ];
  const required={
    "genealogy-exporter":"sk-exporter-hero",
    "translations":"sk-translations-hero",
    "realdate-home":"sk-calendar-scene",
    "realdate-download":"sk-download-card",
    "realdate-faq":"sk-faq-row",
    "realdate-roadmap":"sk-timeline-row",
    "realdate-gameplay":"sk-doc-index",
    "realdate-changelog":"sk-release-row",
    "l1ng-home":"l1ng-home-hero",
    "mods-list":"mods-card-grid"
  };
  for(const layout of all){
    let skeleton=null;
    let removed=false;
    let hidden=false;
    const window={};
    const document={
      currentScript:{
        dataset:{skeletonLayout:layout,skeletonAuto:"manual"},
        insertAdjacentElement(_where,node){skeleton=node;}
      },
      createElement(){
        return {
          setAttribute(){},
          classList:{add(name){if(name==="is-hidden")hidden=true;}},
          addEventListener(){},
          remove(){removed=true;},
          innerHTML:""
        };
      }
    };
    vm.runInNewContext(script,{
      document,
      window,
      matchMedia:()=>({matches:true}),
      requestAnimationFrame:fn=>fn(),
    },{filename:"site-skeleton.js"});
    assert.ok(skeleton,layout+" creates element");
    assert.ok(skeleton.innerHTML.includes("l1ng-sk-shell"),layout+" shell");
    if(required[layout])assert.ok(skeleton.innerHTML.includes(required[layout]),layout+" shape");
    assert.equal(typeof window.L1nGSkeleton.ready,"function",layout+" ready API");
    window.L1nGSkeleton.ready();
    assert.ok(hidden&&removed,layout+" cleanup");
  }
});

test("首屏圖片有最長等待上限、完成或錯誤都能解除骨架",()=>{
  assert.match(script,/waitForFirstScreen/);
  assert.match(script,/image\.addEventListener\("load"/);
  assert.match(script,/image\.addEventListener\("error"/);
  assert.match(script,/setTimeout\(finish, 750\)/);
  assert.match(script,/clearTimeout\(limit\)/);
});

test("頂欄品牌與導覽保持三區，漢化頁有專區名稱而不新增語言欄",()=>{
  assert.match(script,/class="sk-site-brand"/);
  assert.match(style,/\.sk-site-brand\s*\{\s*display:flex;/);
  assert.match(script,/"translations": \(\) =>\s*bar\("translations"\)/);
  assert.match(script,/const language = type === "realdate" \|\| type === "product"/);
});
