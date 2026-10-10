// 血緣雙親與視覺設定的優先權：實際執行幾何與親子線函式。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const scene=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_app.js'),'utf8');
const extract=(from,to)=>{
 const a=scene.indexOf(from),b=scene.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'Expected implementation '+from);
 return scene.slice(a,b);
};
const scope={
 clampRelationshipCurveAmount:n=>Math.max(10,Math.min(100,Number(n)||50)),
 cardOuterRect:p=>p.rect,
 avatarBoundaryAnchor:p=>p.anchor,
 relationshipCubicAt:null,
 relationshipSegmentIntersectsRect:(x1,y1,x2,y2,r,pad=9)=>{
  for(let i=0;i<=180;i++){
   const t=i/180,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
   if(x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad)return true;
  }
  return false;
 }
};
const functions=vm.runInNewContext(extract('function relationshipRouteRects(','function drawPerspectiveKinshipLabels(')+
 '\n({relationshipOtherRenderGeometry,relationshipArcCandidate,relationshipCurveAmplitude,'+
 'relationshipRecommendedCurveAmount,relationshipCubicAt,relationshipCubicClear})',scope);
const A={anchor:{x:0,y:0}},B={anchor:{x:400,y:0}},R={anchor:{x:400,y:0}},L={anchor:{x:0,y:0}};
const obstacle={pos:new Map([['spouse',{rect:{left:150,right:250,top:-40,bottom:40}}]]),fromId:'A',toId:'B'};
test('玩家設定的 10% 與 100% 都直接依百分比畫出上拱貝茲曲線',()=>{
 const lower=functions.relationshipOtherRenderGeometry(A,B,{curved:true,curveAmount:10,curveAmountManual:true},obstacle);
 const upper=functions.relationshipOtherRenderGeometry(A,B,{curved:true,curveAmount:100,curveAmountManual:true},obstacle);
 assert.match(lower.d,/C/);assert.match(upper.d,/C/);
 const y=d=>Number(d.match(/C[-\d.]+ ([-\d.]+)/)[1]);
 assert.ok(y(lower.d)<0&&y(upper.d)<y(lower.d));
 const expected=functions.relationshipArcCandidate(A.anchor,B.anchor,
  functions.relationshipCurveAmplitude(A.anchor,B.anchor,100),-1);
 assert.equal(upper.d,
  'M0 0 C'+expected[0].c1.x+' '+expected[0].c1.y+' '+
  expected[0].c2.x+' '+expected[0].c2.y+' 400 0');
});
test('人物順序顛倒仍往上彎，不會因路徑方向而變成向下凹',()=>{
 const reverse=functions.relationshipOtherRenderGeometry(R,L,
  {curved:true,curveAmount:70,curveAmountManual:true},null);
 assert.match(reverse.d,/C/);
 const y=Number(reverse.d.match(/C[-\d.]+ ([-\d.]+)/)[1]);
 assert.ok(y<0,'反向連線的控制點 Y 必須向上');
});
test('自動預設計算最低安全百分比，且與玩家值分離',()=>{
 const clear=functions.relationshipRecommendedCurveAmount(A.anchor,B.anchor,[]);
 const blocked=functions.relationshipRecommendedCurveAmount(
  A.anchor,B.anchor,[{left:150,right:250,top:-40,bottom:40}]
 );
 assert.equal(clear,10);
 assert.ok(blocked>clear,'阻擋卡片的預設弧度必須比無阻擋時更大');
 const curve=functions.relationshipArcCandidate(A.anchor,B.anchor,
  functions.relationshipCurveAmplitude(A.anchor,B.anchor,blocked),-1);
 assert.equal(functions.relationshipCubicClear(curve,[{left:150,right:250,top:-40,bottom:40}]),true);
});
test('情人的子女只從現有情人關係線接出，不重畫父母橫橋',()=>{
 const body=extract('function parentConnectorSource(','function parentConnectorChildAnchor(');
 const env={
  genealogyData:{links:[]},
  genealogyNonSpousalCoParentLink:()=>({from:'A',to:'B',type:'情人'}),
  genealogyCoParentRelationshipJunction:()=>({x:210,y:55}),
  cardVerticalAnchor:(pos,side)=>({x:pos.x+10,y:side==='bottom'?pos.y+30:pos.y}),
  pairJoinPoint:()=>({x:999,y:999})
 };
 const source=vm.runInNewContext(body+'\nparentConnectorSource;',env);
 const byId=new Map([
  ['A',{id:'A',spouseIds:[],exSpouseIds:[],gameData:{}}],
  ['B',{id:'B',spouseIds:[],exSpouseIds:[],gameData:{}}]
 ]);
 const positions=new Map([['A',{x:0,y:0}],['B',{x:400,y:0}],['child',{x:200,y:140}]]);
 const paths=[];
 const point=source({parentIds:['A','B'],children:['child']},positions,byId,paths);
 assert.equal(paths.length,0,'不得重新畫父母下方的橫線或折線');
 assert.equal(point.x,210);
 assert.equal(point.y,55);
});
test('親子線仍然保留真實配偶共用的連接點',()=>{
 const body=extract('function parentConnectorSource(','function parentConnectorChildAnchor(');
 const env={
   genealogyData:{links:[]},relationshipOtherType:link=>link.type,
   relationshipLayoutPriority:()=>180,isSiblingLink:()=>false,
   inferCoParentRelationshipLinks:()=>[],
   cardVerticalAnchor:(pos,side)=>({x:pos.x+10,y:side==='bottom'?pos.y+30:pos.y}),
   pairJoinPoint:()=>({x:205,y:42})
 };
 const source=vm.runInNewContext(body+'\nparentConnectorSource;',env);
 const byId=new Map([['A',{id:'A',spouseIds:['B'],exSpouseIds:[],gameData:{}}],['B',{id:'B',spouseIds:['A'],exSpouseIds:[],gameData:{}}]]);
 const positions=new Map([['A',{x:0,y:0}],['B',{x:400,y:0}]]);
 const paths=[];
 const result=source({parentIds:['A','B'],children:[]},positions,byId,paths);
 assert.equal(result.x,205);
 assert.equal(paths.length,0,'真正配偶不可額外產生第二組父母橋');
});
test('視覺設定顯示安全預設、手動後標記來源並優先使用玩家數值',()=>{
 assert.match(app,/genealogyScene\?\.recommendedOtherCurveAmount\?\.\(activeOtherRelationshipType\)/);
 assert.match(app,/setting\.curveAmountManual = true/);
 assert.match(app,/if \(!normalized\.curveAmountManual\)/);
 assert.match(scene,/if\(setting\.curveAmountManual===true\|\|relationshipCubicClear/);
 const html=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy.html'),'utf8');
 assert.match(html,/genealogy_scene\.js\?v=20261011-shared-co-parent-layout-r7/);
 assert.match(html,/genealogy_app\.js\?v=20261011-player-curve-priority-r6/);
});
