// 使用真實網站預設人物資料，驗證蓋普大家族的跨家系兄弟姊妹排列。
// 這裡只替代瀏覽器尺寸與視覺 DOM；人物／父母／配偶資訊全部直接讀預設資料。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const scene=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
const presetJs=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_sample_preset.js'),'utf8');
const sampleWindow={};
vm.runInNewContext(presetJs,{window:sampleWindow});
const preset=sampleWindow.L1nGGenealogySamplePack;
const sims=Object.values(preset.sims);
const byId=new Map(sims.map(sim=>[sim.id,sim]));
const canonical=new Map(sims.map(sim=>[sim.id,0]));
for(let pass=0;pass<20;pass++){
  let changed=false;
  sims.forEach(sim=>(sim.parentIds||[]).forEach(parentId=>{
    if(!canonical.has(parentId)||canonical.get(sim.id)>canonical.get(parentId))return;
    canonical.set(sim.id,canonical.get(parentId)+1);
    changed=true;
  }));
  if(!changed)break;
}
const parentGroupMap=new Map();
sims.forEach(sim=>{
  const parentIds=(sim.parentIds||[]).map(String).filter(id=>byId.has(id)).sort();
  if(!parentIds.length)return;
  const key=parentIds.join('|');
  if(!parentGroupMap.has(key))parentGroupMap.set(key,{key,parentIds,children:[]});
  parentGroupMap.get(key).children.push(sim.id);
});
const family=preset.families.find(item=>item.name==='蓋普');
assert.ok(family);
const start=scene.indexOf('function buildGenealogyLayoutModel(');
const end=scene.indexOf('function petCardFieldRows(',start);
assert.ok(start>0&&end>start);
const implementations=scene.slice(start,end);
const ctx={
  getCachedGenealogyTopology:()=>({
    sims,byId,
    parentGroups:[...parentGroupMap.values()].map(group=>({...group})),
    canonicalGenerationBySim:canonical
  }),
  getActiveFamilySelectorEntry:()=>({
    primaryMemberIds:sims.map(sim=>sim.id),
    seedIds:family.memberIds,
    labelFamily:family
  }),
  currentFamily:()=>family,
  currentTreeFamily:()=>({memberIds:sims.map(sim=>sim.id)}),
  familyTreeViewMode:'extended',
  genealogyData:{sims:preset.sims,links:preset.links||[],families:preset.families},
  getNodeDimensions:()=>({W:95,H:105}),
  getNodeDimensionsById:()=>({W:95,H:105}),
  resolveLayoutGaps:()=>({SIBLING:34,SPOUSE:65,LEVEL:90}),
  relationshipBubbleWidth:()=>48,
  viewMode:'view',
  getRelInfoByKey:(key,type)=>({key,type,label:type}),
  pairKey:(a,b)=>[a,b].sort().join('|'),
  getChildrenOf:id=>sims.filter(sim=>(sim.parentIds||[]).includes(id)),
  isSiblingLink:()=>false,
  genealogyParentIds:sim=>sim.parentIds||[],
  relationshipLayoutPriority:()=>0,
  relationshipOtherType:()=>'',relationshipVerticalAnchorLocalX:()=>47.5,
  cardVerticalAnchor:pos=>({x:pos.x+47.5,y:pos.y}),
  pairJoinPoint:(a,b)=>({x:(a.x+b.x+95)/2,y:a.y+52.5}),
  genealogyNonSpousalCoParentLink:()=>null,
  parentConnectorSource:()=>null,
  PAD:0,uiText:text=>text
};
const solve=vm.runInNewContext(implementations+'\nsolveAutomaticGenealogyPositions;',ctx);
const ids=new Set(sims.map(sim=>sim.id));
const positions=solve(ids);
const person=name=>{
  const sim=sims.find(sim=>sim.name===name);
  assert.ok(sim,'預設人物缺少：'+name);
  const pos=positions.get(sim.id);
  assert.ok(pos,'族譜位置缺少：'+name);
  return pos;
};
test('使用完整預設人物資料與蓋普主要家庭，不只測試三張卡片',()=>{
  assert.ok(sims.length>=40);
  assert.equal(positions.size,sims.length);
  assert.ok(family.memberIds.length>=4);
});
test('阿布蘭特斯兩名子女維持同代並緊靠排列，不被蓋普提伯特插開',()=>{
  const tiago=person('阿布蘭特斯蒂亞戈');
  const sofia=person('阿布蘭特斯蘇菲亞');
  const tibert=person('蓋普提伯特');
  assert.equal(tiago.y,sofia.y);
  assert.ok(sofia.x>tiago.x,'蘇菲亞應緊鄰蒂亞戈的配偶卡片右側');
  assert.ok(sofia.x-tiago.x<300,'同父母子女不可橫跨其他家族');
  assert.ok(tibert.x>sofia.x,'蓋普不能插在阿布蘭特斯兄弟姊妹中間');
});
test('阿布蘭特斯母親位於兩名子女連接中軸上方',()=>{
  const parent=person('阿布蘭特斯艾梅琳達');
  const tiago=person('阿布蘭特斯蒂亞戈');
  const sofia=person('阿布蘭特斯蘇菲亞');
  const center=(tiago.x+sofia.x)/2;
  assert.ok(parent.y<tiago.y);
  assert.ok(Math.abs(parent.x-center)<90,
    '父母沒有位在這兩張血緣子女卡之間');
});
test('蓋普提伯特與三名子女仍同代排齊且沒有彼此交疊',()=>{
  const parent=person('蓋普提伯特');
  const children=[
    person('蓋普碧翠絲'),
    person('蓋普瑟勒絲特'),
    person('蓋普維吉里歐')
  ];
  assert.ok(children.every(pos=>pos.y>parent.y&&pos.y===children[0].y));
  const xs=children.map(pos=>pos.x).sort((a,b)=>a-b);
  assert.ok(xs[1]-xs[0]>=95);
  assert.ok(xs[2]-xs[1]>=95);
});
test('完成排列後同世代所有人物卡不得碰撞',()=>{
  const rows=new Map();
  for(const [id,pos] of positions){
    if(!rows.has(pos.y))rows.set(pos.y,[]);
    rows.get(pos.y).push({id,x:pos.x});
  }
  rows.forEach((members,row)=>{
    members.sort((a,b)=>a.x-b.x);
    for(let i=1;i<members.length;i++){
      assert.ok(members[i].x-members[i-1].x>=95-0.001,
        '第 '+row+' 列卡片重疊：'+members[i-1].id+'/'+members[i].id);
    }
  });
});
