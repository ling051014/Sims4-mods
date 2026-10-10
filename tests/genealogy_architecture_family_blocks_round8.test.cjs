// 族譜排列：家系不穿插、同住家庭相鄰、前任優先及單一子女垂直。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const s=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
function between(a,b){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return s.slice(i,j);}
const household=u=>new Set((u?.members||[]).flatMap(m=>m.gameData?.householdId?[String(m.gameData.householdId)]:[]));
const rank=vm.runInNewContext(between('function genealogyOrderRootFamilyBlocks(','function applyFamilyBranchOrdering(')+'\ngenealogyOrderRootFamilyBlocks;',{
  genealogyUnitHouseholds:household,
  compareFamilyBranchPath:(a,b)=>(a?.[0]??99)-(b?.[0]??99),
  stableGenealogyUnitCompare:(a,b)=>(a?.sequence??99)-(b?.sequence??99)
});
const U=(id,i,h)=>({id:'unit:'+id,sequence:i,members:[{id,gameData:h?{householdId:h}:{}}],width:90,x:i*160,generation:0,y:0});
function roots(units,pairs=[],active=['A'],anchors=null){
  const keys=units.map(u=>u.id);
  return [...rank(keys,{units,unitById:new Map(units.map(u=>[u.id,u])),
    unitBySim:new Map(units.flatMap(u=>u.members.map(m=>[m.id,u]))),pairCandidates:pairs},
    {primarySimIds:new Set(active),anchorSimIds:anchors?new Set(anchors):null,rootByUnit:new Map(keys.map(id=>[id,id])),
    pathByUnit:new Map(keys.map((id,i)=>[id,[i]])),primarySideByUnit:new Map()})];
}
test('前任在主家系旁、情人向兩側外擴、其他家系不穿插',()=>{
  const a=U('A',0),b=U('B',1),d=U('D',2),e=U('E',3),f=U('F',4);
  a.members.push({id:'C',gameData:{}});a.width=220;
  assert.deepEqual(roots([a,b,d,e,f],[
    {a:'A',b:'B',adjacencyTier:440,score:220},
    {a:'A',b:'D',adjacencyTier:250,score:100},
    {a:'A',b:'E',adjacencyTier:250,score:90}
  ]),['unit:D','unit:B','unit:A','unit:E','unit:F']);
});
test('擴張 EA 族譜把前任算進血緣 core，仍只以選中家庭為排列中心',()=>{
  const a=U('A',0),b=U('B',1),d=U('D',2);
  a.members.push({id:'C',gameData:{}});a.width=220;
  assert.deepEqual(roots([a,b,d],[
    {a:'A',b:'B',adjacencyTier:440,score:220},
    {a:'A',b:'D',adjacencyTier:250,score:100}
  ],['A','B','D'],['A']),['unit:D','unit:B','unit:A']);
});
test('主要家庭有一位成員與外部配偶成對，配偶朝所在家系外側',()=>{
  const source=between('function orientHorizontalPairUnitsByLineage(','function setGenerationVerticalPositions(');
  const fn=vm.runInNewContext(source+'\norientHorizontalPairUnitsByLineage;',{});
  const couple={id:'pair',members:[{id:'outside'},{id:'anchor'}]};
  const changed=fn({units:[couple]},[],{
    anchorSimIds:new Set(['anchor']),primarySideByUnit:new Map([['pair',1]])
  });
  assert.equal(changed,true);
  assert.deepEqual(couple.members.map(s=>s.id),['anchor','outside']);
});
test('同住的不同血緣根區塊依然相鄰',()=>{
  assert.deepEqual(roots([U('a',0,'H1'),U('b',1,'H2'),U('c',2,'H1')],[],['a','b','c']),
    ['unit:a','unit:c','unit:b']);
});
const geometry=vm.runInNewContext(between('function genealogyUnitHouseholds(','function solveAutomaticGenealogyPositions(')+
  '\n({genealogyTranslateChildBlockWithClearance,alignUnifiedSingleChildBranches});',{
  resolveLayoutGaps:()=>({SIBLING:24}),
  placeGenealogyUnitMembers:units=>new Map(units.flatMap(u=>u.members.map(m=>[m.id,{id:m.id,x:u.x,y:u.y}]))),
  parentConnectorSource:group=>({x:group.targetX,y:0}),
  cardVerticalAnchor:card=>({x:card.x+45,y:card.y})
});
function layout(childX=100,otherX=250,household=false,targetX=345){
  const U=(id,x,g,hh=null)=>({id,x,width:90,generation:g,y:g*200,
    members:[{id,gameData:hh?{householdId:hh}:{}}]});
  const p=U('p',0,0),c=U('c',childX,1,household?'H':null),
    g=U('g',childX+20,2),o=U('o',otherX,1,household?'H':null),z=U('z',otherX+20,2);
  const units=[p,c,g,o,z];
  return {c,g,o,z,model:{units,unitById:new Map(units.map(u=>[u.id,u])),
    unitBySim:new Map(units.map(u=>[u.id,u]))},
    layers:new Map([[0,[p]],[1,[c,o]],[2,[g,z]]]),
    owner:{primaryChildren:new Map([['c',['g']],['o',['z']]]),
      ownerParentByUnit:new Map([['g','c'],['z','o']])},
    group:{key:'p',parentIds:['p'],children:['c'],targetX}};
}
test('單一子女直接從父母關係接點垂直排列，孫代跟隨',()=>{
  const f=layout(500,900,false,295);
  assert.equal(geometry.alignUnifiedSingleChildBranches(f.layers,f.model,f.owner,[f.group]),1);
  assert.equal(f.c.x,250);assert.equal(f.g.x,270);assert.equal(f.o.x,900);
});
test('對齊時碰到別家子女，推開整個家系但不改左右次序',()=>{
  const f=layout();
  assert.equal(geometry.alignUnifiedSingleChildBranches(f.layers,f.model,f.owner,[f.group]),1);
  assert.equal(f.c.x,300);assert.equal(f.o.x,414);assert.equal(f.z.x,434);
});
test('同住的同代成員和後代整組平移',()=>{
  const f=layout(100,450,true,245);
  assert.equal(geometry.alignUnifiedSingleChildBranches(f.layers,f.model,f.owner,[f.group]),1);
  assert.equal(f.c.x,200);assert.equal(f.o.x,550);assert.equal(f.z.x,570);
});
const parentSource=vm.runInNewContext(
  between('function parentConnectorSource(','function parentConnectorChildAnchor(')+'\nparentConnectorSource;',{
  cardVerticalAnchor:p=>({x:p.x+45,y:p.y+90}),
  pairJoinPoint:()=>({x:123,y:40}),
  genealogyNonSpousalCoParentLink:()=>({type:'情人'}),
  genealogyCoParentRelationshipJunction:()=>({x:145,y:20})
});
test('前任單側記錄仍使用配偶型接點，不會新增兩條假血緣橋接',()=>{
  const group={parentIds:['A','B'],children:['C']},paths=[];
  const sims=new Map([['A',{id:'A'}],['B',{id:'B',exSpouseIds:['A']}]]);
  const pos=new Map([['A',{x:0,y:0}],['B',{x:200,y:0}]]);
  assert.equal(parentSource(group,pos,sims,paths).x,123);
  assert.equal(paths.length,0);
});
test('情人共同子女使用既有曲線上的接點，不重複畫雙親橫線',()=>{
  const paths=[];
  const result=parentSource({parentIds:['A','B'],children:['C']},
    new Map([['A',{x:0,y:0}],['B',{x:200,y:0}]]),
    new Map([['A',{id:'A'}],['B',{id:'B'}]]),paths);
  assert.equal(result.x,145);assert.equal(paths.length,0);
});
test('只更動自動排列，不碰自由排列座標及 JSON 資料',()=>{
  const auto=between('function solveAutomaticGenealogyPositions(','function petCardFieldRows(');
  const plan=between('function composeScenePlan(','// ========【Scene Incremental Pipeline】');
  assert.match(auto,/alignUnifiedSingleChildBranches\(/);
  assert.match(auto,/assignFamilyBranchBlockPositions\(/);
  assert.match(plan,/if \(isFree\)/);
});
