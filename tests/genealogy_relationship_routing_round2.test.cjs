'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {scene,extract,api,rect,card,routeContext,curve,clearResult}=require('./genealogy_smart_curve_fixture.cjs');
const A=card(0,0),B=card(440,0);
test('曲線關閉：無障礙時是直線，沒有 Bézier 指令',()=>{
  const result=api.relationshipOtherRenderGeometry(A,B,{curved:false},routeContext([],{sameGeneration:true}));
  assert.doesNotMatch(result.d,/\bC/);
  assert.ok(result.d.startsWith('M'));
});
test('曲線關閉：卡片阻擋時以直角折線避障，不畫曲線',()=>{
  const obstacle=rect(180,0,300,90);
  const result=api.relationshipOtherRenderGeometry(A,B,{curved:false},routeContext([obstacle],{sameGeneration:true}));
  assert.doesNotMatch(result.d,/\bC/);
  assert.ok((result.points||[]).length>=3,'需要繞過阻擋卡片');
  for(let i=1;i<result.points.length;i++){
    const a=result.points[i-1],b=result.points[i];
    assert.ok(a.x===b.x||a.y===b.y,'所有折線路徑必須水平或垂直');
  }
});
test('同代曲線從雙方頭像中線連接，向上拱且保持單段',()=>{
  const result=curve(A,B,[],{sameGeneration:true});
  assert.equal(result.segments?.length,1);
  const seg=result.segments[0];
  assert.equal(seg.from.y,A.avatarY);
  assert.equal(seg.to.y,B.avatarY);
  assert.equal(seg.from.x,A.rect.right);
  assert.equal(seg.to.x,B.rect.left);
  assert.ok(api.relationshipCubicAt(seg,0.5).y<Math.min(seg.from.y,seg.to.y));
});
test('同代曲線遇一般障礙物，若輸出 Bézier 則整段實際路徑必須避開',()=>{
  const obstacles=[rect(160,-25,290,82)];
  const result=curve(A,B,obstacles,{sameGeneration:true});
  assert.ok(result.d.length>0);
  if(result.segments?.length){
    assert.equal(result.segments.length,1,'只能使用單一弧度');
    assert.ok(clearResult(result,obstacles),'取樣的曲線不能穿過卡片');
  }else{
    assert.ok(result.points?.length>=2,'無安全上拱時須使用直角避障');
  }
});
test('跨世代避障無解時要回報 blocked，不能偷畫穿卡片線段',()=>{
  const upper=card(0,0),lower=card(0,350);
  const obstacles=[rect(-2000,90,2000,330)];
  const result=curve(upper,lower,obstacles);
  assert.ok(result.blocked||clearResult(result,obstacles));
});
test('關係端點順序顛倒時曲線仍向上，且不產生下凹或 S 形',()=>{
  const forward=curve(A,B,[],{sameGeneration:true});
  const backward=curve(B,A,[],{sameGeneration:true});
  for(const result of [forward,backward]){
    assert.equal(result.segments?.length,1);
    const seg=result.segments[0];
    let minY=Infinity;
    for(let i=0;i<=50;i++)minY=Math.min(minY,api.relationshipCubicAt(seg,i/50).y);
    assert.ok(minY<seg.from.y);
    assert.equal(seg.c1.y,seg.c2.y,'等高端點的 Bézier 應只有一個上拱');
  }
});
test('已存在的共同父母關係與配偶關係只共用連接點，不重複建立父母橋',()=>{
  const source=extract('function parentConnectorSource(','function parentConnectorChildAnchor(');
  const context={
    genealogyNonSpousalCoParentLink:()=>({from:'A',to:'B',type:'情人'}),
    genealogyCoParentRelationshipJunction:()=>({x:210,y:55}),
    pairJoinPoint:()=>({x:205,y:42}),
    cardVerticalAnchor:(position,side)=>({x:position.x+10,y:position.y+(side==='bottom'?30:0)})
  };
  const parentSource=vm.runInNewContext(source+'\nparentConnectorSource;',context);
  const positions=new Map([['A',{x:0,y:0}],['B',{x:400,y:0}]]);
  const common=(A,B)=>({parentIds:['A','B'],children:['child']});
  const lovers=new Map([
    ['A',{id:'A',spouseIds:[],exSpouseIds:[],gameData:{}}],
    ['B',{id:'B',spouseIds:[],exSpouseIds:[],gameData:{}}]
  ]);
  const paths=[];
  const junction=parentSource(common(),positions,lovers,paths);
  assert.equal(junction.x,210);
  assert.equal(junction.y,55);
  assert.equal(paths.length,0,'情人共同子女不得產生第二組父母橋');
  lovers.get('A').spouseIds=['B'];
  const married=parentSource(common(),positions,lovers,paths);
  assert.equal(married.x,205);
  assert.equal(paths.length,0,'配偶共同子女不得產生第二組父母橋');
});