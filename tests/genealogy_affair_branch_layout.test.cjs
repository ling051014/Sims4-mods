const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const scene=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
function between(first,last) {
 const a=scene.indexOf(first),b=scene.indexOf(last,a+first.length);
 assert.ok(a>=0&&b>a,'Function boundaries '+first);
 return scene.slice(a,b);
}
function cubicAt(segment,t){
 const u=1-t;
 return {
  x:u*u*u*segment.from.x+3*u*u*t*segment.c1.x+3*u*t*t*segment.c2.x+t*t*t*segment.to.x,
  y:u*u*u*segment.from.y+3*u*u*t*segment.c1.y+3*u*t*t*segment.c2.y+t*t*t*segment.to.y
 };
}
const A={x:0,y:0},B={x:400,y:0},S={x:190,y:0},C={x:500,y:300};
const cubic={from:{x:90,y:40},c1:{x:140,y:-110},c2:{x:355,y:-110},to:{x:400,y:40}};
const p=new Map([['A',A],['B',B],['spouse',S],['C',C]]);
const byId=new Map([
 ['A',{id:'A',spouseIds:['spouse'],exSpouseIds:[],gameData:{}}],
 ['B',{id:'B',spouseIds:[],exSpouseIds:[],gameData:{}}],
 ['spouse',{id:'spouse',spouseIds:['A'],exSpouseIds:[],gameData:{}}],
 ['C',{id:'C',parentIds:['A','B'],spouseIds:[]}]
]);
const group={parentIds:['A','B'],children:['C'],childKinds:new Map([['C','parent-child']])};
const links=[{from:'A',to:'B',type:'情人'}];
const rect=o=>({left:o.x,right:o.x+90,top:o.y,bottom:o.y+95});
const vertical=(o,side)=>({x:o.x+45,y:side==='bottom'?o.y+95:o.y});
const intersects=(x1,y1,x2,y2,r,padding=0)=>{
 let i=0;
 for(;i<=160;i++){
  const t=i/160,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
  if(x>=r.left-padding&&x<=r.right+padding&&y>=r.top-padding&&y<=r.bottom+padding)return true;
 }
 return false;
};
const environment={
 genealogyData:{links},
 isSiblingLink:()=>false,
 relationshipOtherType:link=>link.type,
 relationshipLayoutPriority:()=>150,
 inferCoParentRelationshipLinks:()=>[],
 cardVerticalAnchor:vertical,
 cardOuterRect:rect,
 avatarBoundaryAnchor:(o,other)=>({x:o.x+45,y:40}),
 relationshipSegmentIntersectsRect:intersects,
 relationshipOtherRenderGeometry:()=>({d:'M90 40 C140 -110 355 -110 400 40',segments:[cubic]}),
 getOtherRelationshipLineSetting:()=>({curved:true,curveAmount:50}),
 relationshipCubicAt:cubicAt,
 pairJoinPoint:()=>({x:-999,y:-999})
};
const joinImpl=between('function genealogyNonSpousalCoParentLink(','function parentConnectorChildAnchor(');
const join=vm.runInNewContext(joinImpl+'\n({genealogyNonSpousalCoParentLink,genealogyCoParentRelationshipJunction,parentConnectorSource})',environment);
test('共親生的情人是單一關係線而非兩條下方假配偶橫線',()=>{
 const pts=[];
 const point=join.parentConnectorSource(group,p,byId,pts);
 assert.ok(point);
 assert.equal(pts.length,0,'情人不應另外畫下方父母橋接線');
 assert.ok(point.x>275&&point.x<405,'共同連接點應避開中間配偶卡片');
 const candidates=Array.from({length:29},(_,i)=>cubicAt(cubic,(i+1)/30));
 assert.ok(candidates.some(q=>Math.hypot(q.x-point.x,q.y-point.y)<.001),
   '親子主幹必須從實際情人曲線上的點開始');
});
test('連接到子女的垂直主幹不能穿越中間配偶卡片',()=>{
 const point=join.genealogyCoParentRelationshipJunction(group,p,byId,links[0]);
 assert.ok(!intersects(point.x,point.y,point.x,C.y,rect(S),5),
   '應選擇原配卡片旁的空隙接入子女');
});
test('真正的配偶仍使用標準水平關係線中點',()=>{
 const groupSpouse={parentIds:['A','spouse'],children:['C']};
 const paths=[];
 const point=join.parentConnectorSource(groupSpouse,p,byId,paths);
 assert.equal(point.x,-999);
 assert.equal(paths.length,0);
});
test('自動排列會實際移動整個私生子女後代區塊，而非只改繪線位置',()=>{
 const parentA={id:'UA',generation:0,x:0,y:0,width:90};
 const parentB={id:'UB',generation:0,x:400,y:0,width:90};
 const child={id:'UC',generation:1,x:500,y:200,width:90};
 const grandchild={id:'UD',generation:2,x:520,y:400,width:90};
 const unrelated={id:'UE',generation:1,x:900,y:200,width:90};
 const model={
  units:[parentA,parentB,child,grandchild,unrelated],
  unitBySim:new Map([['A',parentA],['B',parentB],['C',child],['D',grandchild]]),
  unitById:new Map([parentA,parentB,child,grandchild,unrelated].map(u=>[u.id,u])),
  byId
 };
 const layers=new Map([[0,[parentA,parentB]],[1,[child,unrelated]],[2,[grandchild]]]);
 const ownership={
  primaryChildren:new Map([['UC',['UD']]]),
  ownerParentByUnit:new Map([['UD','UC']])
 };
 const pair={parentIds:['A','B'],children:['C']};
 const env={
  resolveLayoutGaps:()=>({SIBLING:24}),
  genealogyNonSpousalCoParentLink:()=>links[0],
  genealogyCoParentRelationshipJunction:()=>({x:275,y:-10}),
  placeGenealogyUnitMembers:units=>new Map([
   ['A',{x:parentA.x,y:0}],['B',{x:parentB.x,y:0}],
   ['C',{x:child.x,y:200}],['D',{x:grandchild.x,y:400}]
  ]),
  cardVerticalAnchor:(pos)=>({x:pos.x+45,y:pos.y})
 };
 const src=between('function translateFamilyDescendants(','function alignFamilyBranchParentAxes(')+
  '\n'+between('function alignNonSpousalCoParentBranches(','function solveAutomaticGenealogyPositions(');
 const run=vm.runInNewContext(src+'\nalignNonSpousalCoParentBranches;',env);
 const oldC=child.x,oldD=grandchild.x;
 assert.equal(run(layers,model,ownership,[pair]),1);
 assert.notEqual(child.x,oldC,'必須實際更改子女單位座標');
 assert.equal(child.x,230,'子女卡片中心應對準關係線連接點');
 assert.equal(grandchild.x-oldD,child.x-oldC,'後代必須連同整個分支一起平移');
 assert.equal(unrelated.x,900,'沒有關聯的家族不應被移動');
});
test('真正的自動排列流程必須使用新的分支定位步驟',()=>{
 const body=between('function solveAutomaticGenealogyPositions(','// ========【家庭寵物排列】');
 assert.match(body,/alignNonSpousalCoParentBranches\(/);
 assert.ok(body.indexOf('alignNonSpousalCoParentBranches')>
  body.indexOf('alignFamilyBranchParentAxes'));
});
