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
  ["L1nG/Translations/index.html","translations"],
  ["L1nG/GenealogyExporter/genealogy-exporter.html","genealogy-exporter"],
  ["L1nG/RealDate/index.html","realdate-home"],
  ...["download","faq","roadmap","gameplay","compatibility","changelog"].map(k=>["L1nG/RealDate/"+k+".html","realdate-"+k])
]);
test("正式頁面皆使用對應骨架及最新版資源",()=>{
  for (const [path,layout] of layouts) {
    const html=readFileSync(join(root,path),"utf8");
    assert.ok(html.includes('data-skeleton-layout="'+layout+'"'), path+" layout");
    const expectedJsVersion = "20261116-full-page-skeleton-r1";
    assert.ok(html.includes("site-skeleton.js?v="+expectedJsVersion),path+" JS cache");
    assert.ok(html.includes("site-skeleton.css?v=20261116-full-page-skeleton-r1"),path+" CSS cache");
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
  assert.match(script,/sk-home-creator-link/);
  assert.match(script,/sk-realdate-release/);
  assert.match(script,/sk-translation-stat-wide/);
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

test("17 種骨架皆可建立畫面並確實退出",()=>{
  const vm=require("node:vm");
  const all=[
    "mods-home","mods-list","mods-table","l1ng-home","l1ng-changelog",
    "genealogy-exporter","translations","realdate-home","realdate-download",
    "realdate-faq","realdate-roadmap","realdate-gameplay",
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
    "realdate-gameplay":"sk-doc-copy",
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

test("主視覺骨架保持與實際內容一致",()=>{
  const home = readFileSync(join(root,"L1nG/home.html"),"utf8");
  const homeEn = readFileSync(join(root,"L1nG/home-en.html"),"utf8");
  const count = (home.match(/class="creator-link"/g)||[]).length;
  assert.ok(count>0,"首頁應保留外部連結");
  assert.equal((homeEn.match(/class="creator-link"/g)||[]).length,count,
    "中英文首頁外部連結數量必須一致");
  const skeletonLinks = script.match(/repeat\((\d+), \(\) =>\s*'<div class="sk-home-creator-link">/);
  assert.ok(skeletonLinks,"首頁骨架需要包含外部連結佔位");
  assert.equal(Number(skeletonLinks[1]),count,"首頁連結數量與骨架佔位數量必須相符");
  assert.match(script,/const links = type === "realdate" \? 7/);
  assert.match(script,/sk-translation-stat-wide/);
  assert.match(script,/sk-realdate-release-item/);
  assert.doesNotMatch(script,/docIndex\(4\)|docIndex\(8\)/);
  assert.match(style,/\.sk-site-links\s*\{[^}]*justify-content:center;/);
  assert.match(style,/\.sk-release-sections\s*\{[^}]*display:grid;/);
  assert.match(style,/\.sk-translations-hero\s*\{[^}]*min-height:620px;/);
});

test("骨架支援整頁捲動並維持固定工作區模式",()=>{
  assert.match(style,/\.l1ng-site-skeleton\s*\{[^}]*position:absolute;/);
  assert.match(style,/\.l1ng-site-skeleton\.is-document-scroll \.sk-sitebar\s*\{[^}]*position:sticky;/);
  assert.match(style,/\.l1ng-site-skeleton\.is-internal-scroll\s*\{[^}]*position:fixed;/);
  assert.match(style,/\.l1ng-site-skeleton\.is-internal-scroll \.sk-mods-scroll\s*\{[^}]*overflow-y:auto;/);
  assert.match(script,/function sizeToDocument\(\)/);
  assert.match(script,/document\.body\.getBoundingClientRect\(\)\.height/);
  assert.match(script,/layoutObserver\.observe\(document\.body\)/);
  assert.match(script,/content\.scrollTop = placeholder\.scrollTop/);
  assert.match(script,/setTimeout\(remove, 260\)/);
});
test("FAQ 骨架對應六題並保留展開答案，長頁面具有後續章節",()=>{
  const faq=readFileSync(join(root,"L1nG/RealDate/faq.html"),"utf8");
  assert.equal((faq.match(/<details class="faq-item reveal"/g)||[]).length,6);
  assert.match(script,/repeat\(5, \(\) => '<div class="sk-faq-row">/);
  assert.match(script,/class="sk-faq-answer"/);
  assert.doesNotMatch(script,/repeat\(9, \(\) => '<div class="sk-faq-row">/);
  assert.match(script,/repeat\(8, releaseRow\)/);
  assert.match(script,/sk-home-project-grid/);
  assert.match(script,/sk-feedback-layout/);
});

test("文件骨架依真實內容高度延伸且在退場時解除高度監聽",()=>{
  const vm=require("node:vm");
  let skeleton;
  let disconnected=false;
  let watched=null;
  const body={
    getBoundingClientRect:()=>({height:2600}),
    offsetHeight:2450
  };
  const doc={
    readyState:"complete",
    body,
    documentElement:{clientHeight:780},
    currentScript:{
      dataset:{skeletonLayout:"realdate-faq",skeletonAuto:"manual"},
      insertAdjacentElement(_position,node){skeleton=node;}
    },
    createElement(){return {
      style:{},innerHTML:"",setAttribute(){},remove(){},
      classList:{add(){}},addEventListener(){}
    };}
  };
  class Observer{
    observe(node){watched=node;}
    disconnect(){disconnected=true;}
  }
  const win={innerHeight:900,ResizeObserver:Observer,addEventListener(){},removeEventListener(){}};
  vm.runInNewContext(script,{
    document:doc,window:win,
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    setTimeout(){},matchMedia:()=>({matches:true})
  });
  assert.equal(skeleton.style.height,"2600px");
  assert.equal(watched,body);
  win.L1nGSkeleton.ready();
  assert.equal(disconnected,true);
});
test("內部捲動骨架退出時保留模組列表的捲動進度",()=>{
  const vm=require("node:vm");
  const scrollport={scrollTop:325};
  const content={scrollTop:0};
  let skeleton;
  const doc={
    currentScript:{
      dataset:{skeletonLayout:"mods-list",skeletonAuto:"manual"},
      insertAdjacentElement(_position,node){skeleton=node;}
    },
    querySelector:s=>s===".page-scroll"?content:null,
    createElement(){return {
      style:{},innerHTML:"",setAttribute(){},
      classList:{add(){}},addEventListener(){},remove(){},
      querySelector:s=>s===".sk-mods-scroll"?scrollport:null
    };}
  };
  const win={};
  vm.runInNewContext(script,{
    document:doc,window:win,requestAnimationFrame:()=>1,
    cancelAnimationFrame(){},matchMedia:()=>({matches:true})
  });
  assert.match(skeleton.className,/is-internal-scroll/);
  win.L1nGSkeleton.ready();
  assert.equal(content.scrollTop,325);
});
