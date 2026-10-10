const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
const start=source.indexOf('function relationshipRouteRects(');
const end=source.indexOf('function drawPerspectiveKinshipLabels(',start);
assert.ok(start>=0&&end>start);
const scoped=source.slice(start,end);
const context={
 clampRelationshipCurveAmount:n=>Math.max(10,Math.min(100,Number(n)||50)),
 cardOuterRect:p=>p.rect,
 avatarBoundaryAnchor:(from,to)=>from.anchor,
 relationshipQuadraticGeometry:(x1,y1,x2,y2,v)=>{
   const distance=Math.hypot(x2-x1,y2-y1),amp=Math.min(36,distance*(0.03+v/100*0.24));
   return {d:'M'+x1+' '+y1+' Q'+((x1+x2)/2)+' '+((y1+y2)/2+amp)+' '+x2+' '+y2,
     cx:(x1+x2)/2,cy:(y1+y2)/2+amp,labelX:(x1+x2)/2,labelY:(y1+y2)/2+amp/2};
 },
 relationshipSegmentIntersectsRect:(x1,y1,x2,y2,r,padding=6)=>{
   const rect={left:r.left-padding,right:r.right+padding,top:r.top-padding,bottom:r.bottom+padding};
   const length=70;
   for(let i=0;i<=length;i++){
     const t=i/length,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
     if(x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom)return true;
   }
   return false;
 }
};
const render=vm.runInNewContext(scoped+'\nrelationshipOtherRenderGeometry;',context);
const A={anchor:{x:0,y:0}},B={anchor:{x:400,y:0}};
const obstacle=rect=>({pos:new Map([['parent',{rect}]]),fromId:'A',toId:'B'});
test('沒有障礙且沒有勾曲線時維持直線',()=>{
 const result=render(A,B,{curved:false,curveAmount:100},obstacle({left:500,right:550,top:-20,bottom:20}));
 assert.doesNotMatch(result.d,/[QC]/);
});
test('有原配阻擋、曲線關閉時一定沒有曲線命令',()=>{
 const result=render(A,B,{curved:false,curveAmount:90},obstacle({left:150,right:240,top:-40,bottom:40}));
 assert.doesNotMatch(result.d,/[QC]/);
 assert.ok((result.d.match(/L/g)||[]).length>=2,'關閉曲線應為多段折線避開卡片');
});
test('有原配阻擋、曲線開啟時使用有限弧度圓角，不是巨大拱橋',()=>{
 const rect={left:150,right:240,top:-40,bottom:40};
 const result=render(A,B,{curved:true,curveAmount:100},obstacle(rect));
 assert.match(result.d,/C/);
 const nums=[...result.d.matchAll(/[-+]?(?:\d+\.?\d*|\.\d+)/g)].map(x=>Number(x[0]));
 assert.ok(nums.every(Number.isFinite));
 assert.ok(Math.max(...nums.map(Math.abs))<600,'控制點不得無限制遠離人物');
});
test('上下兩側都有其他人物卡片時尋找避障路徑',()=>{
 const pos=new Map([
   ['parent',{rect:{left:150,right:240,top:-40,bottom:40}}],
   ['ancestor',{rect:{left:155,right:245,top:-140,bottom:-60}}]
 ]);
 const result=render(A,B,{curved:false,curveAmount:50},{pos,fromId:'A',toId:'B'});
 assert.doesNotMatch(result.d,/[QC]/);
 assert.ok(result.d.length>15,'應繞開上一代，不應只有直線');
});
test('親子橋接只在推定情人狀態取消，其他親子線不受影響',()=>{
 const line=source.slice(source.indexOf('function parentConnectorSource('),source.indexOf('function parentConnectorChildAnchor('));
 assert.match(line,/const inferred = inferCoParentRelationshipLinks\(\[group\],byId\)/);
 assert.match(line,/if \(inferred\.length\)/);
 assert.match(line,/paths\.push\(/);
});
test('視覺設定曲線與弧度是同一組 setting 來源',()=>{
 assert.match(scoped,/!!setting\.curved/);
 assert.match(scoped,/setting\.curveAmount/);
 assert.doesNotMatch(scoped,/setting\.routing\s*===\s*'manual'/);
 const html=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy.html'),'utf8');
 assert.match(html,/genealogy_scene\.js\?v=20261011-smooth-bezier-r4/);
});
