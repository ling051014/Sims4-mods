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
test('原本正常的室友、永遠的麻吉、林克斯區塊維持修正前位置',()=>{
  // 固定測試環境的 95px 卡片尺寸；這些位置取自排序退步前的穩定版。
  const unchanged=[
    ['史考特崔維斯',1979],
    ['帕托柔伊',2486],
    ['林克斯卡特琳娜',3162]
  ];
  unchanged.forEach(([name,x])=>{
    assert.equal(person(name).x,x,'無關家族不應因修阿布蘭特斯被整組搬走：'+name);
  });
});
test('阿布蘭特斯修正只位移實際擋路的蓋普／蒙提分支，不擾動其他預設家族',()=>{
  const oldSolver=vm.runInNewContext(
    implementations.replace(
      'compactCrossRootSiblingGroups(layers,model,ownership);',
      '// 關閉跨家系兄弟姊妹校正以比較影響範圍'
    )+'\nsolveAutomaticGenealogyPositions;',ctx
  );
  const before=oldSolver(ids);
  const moved=sims.filter(sim=>{
    const old=before.get(sim.id),now=positions.get(sim.id);
    return old.x!==now.x||old.y!==now.y;
  }).map(sim=>sim.name);
  const allowed=new Set([
    '阿布蘭特斯艾梅琳達','阿布蘭特斯蘇菲亞',
    '蓋普提伯特','蓋普碧翠絲','蓋普瑟勒絲特','蓋普維吉里歐',
    '蒙提茱麗葉','蒙提但丁'
  ]);
  assert.ok(moved.length>0,'測試應確實觸發排列校正');
  assert.ok(moved.every(name=>allowed.has(name)),
    '修阿布蘭特斯不得動到無關的家族：'+moved.join('、'));
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

test('姻親完整家系靠接後：已正確的親子中軸不可因接入而偏離',()=>{
  const marker='  alignAffinalAncestryBlocks(layers,model,ownership,connectorGroups);';
  assert.ok(implementations.includes(marker),'正式自動排列必須實際呼叫姻親完整區塊接合');
  const baseline=vm.runInNewContext(
    implementations.replace(marker,'  // 測試比較：停用姻親家系接合')+
    '\nsolveAutomaticGenealogyPositions;',ctx
  )(ids);
  const anchorX=(id,map)=>map.get(id)?.x+47.5;
  const center=values=>(Math.min(...values)+Math.max(...values))/2;
  const axis=(group,map)=>center(group.parentIds.map(id=>anchorX(id,map)))-
    center(group.children.map(id=>anchorX(id,map)));
  const groups=[...parentGroupMap.values()];
  let protectedAxes=0;
  groups.forEach(group=>{
    const old=axis(group,baseline);
    const current=axis(group,positions);
    if(Math.abs(old)<=1){
      protectedAxes++;
      assert.ok(Math.abs(current)<=1,
        '原本正確的親子中軸不能因姻親接入被改壞：'+
        group.parentIds.map(id=>byId.get(id)?.name).join('、'));
    }
  });
  assert.ok(protectedAxes>=15,'應有足夠已經正確的父母群組作為回歸保護');
});

test('選中蓋普大家族時，僅靠接相關姻親祖先，保持原本無關家系座標',()=>{
  const marker='  alignAffinalAncestryBlocks(layers,model,ownership,connectorGroups);';
  const baseline=vm.runInNewContext(
    implementations.replace(marker,'  // 測試比較：停用姻親家系接合')+
    '\nsolveAutomaticGenealogyPositions;',ctx
  )(ids);
  const posOf=(name,map)=>{
    const id=sims.find(sim=>sim.name===name)?.id;
    assert.ok(id,'找不到預設市民：'+name);
    return map.get(id);
  };
  ['史考特崔維斯','帕托柔伊','林克斯卡特琳娜'].forEach(name=>{
    assert.equal(posOf(name,positions).x,posOf(name,baseline).x,
      '未連到大家族的家系不應移位：'+name);
  });
  const center=xs=>(Math.min(...xs)+Math.max(...xs))/2;
  const axis=([father,mother],children,map)=>{
    const parentXs=[father,mother].map(name=>posOf(name,map).x+47.5);
    const childXs=children.map(name=>posOf(name,map).x+47.5);
    return center(parentXs)-center(childXs);
  };
  const examples=[
    [['底比女王','約翰．威爾森．鬍鬍'],['柯德莉亞．底比二世']],
    [['安德洛瑪刻．底比','海克特．底比'],['蓋普康索特']],
    [['蓋普康索特','康特莎．蓋普'],['柯德莉亞．蓋普']],
    [['蒙提茱麗葉','蒙提羅密歐'],['蒙提但丁']]
  ];
  examples.forEach(([parents,children])=>{
    const old=Math.abs(axis(parents,children,baseline));
    const updated=Math.abs(axis(parents,children,positions));
    assert.ok(old>1000,'測試案例應確實重現跨家系嚴重偏移');
    assert.ok(updated<40,
      '配偶另一側的完整家系應靠接到子女群組，不可繼續遠離：'+
      parents.join('、')+'；偏移 '+updated);
  });
});

test('大家族實際入口：未列入主要成員的其他家庭只能跟隨整張畫布平移',()=>{
  const scope={...ctx,getActiveFamilySelectorEntry:()=>({
    primaryMemberIds:[...family.memberIds],
    labelFamily:family
  })};
  const marker='  alignAffinalAncestryBlocks(layers,model,ownership,connectorGroups);';
  const solver=vm.runInNewContext(
    implementations+'\nsolveAutomaticGenealogyPositions;',scope
  );
  const baselineSolver=vm.runInNewContext(
    implementations.replace(marker,'  // 測試比較：未接入姻親')+
    '\nsolveAutomaticGenealogyPositions;',scope
  );
  const next=solver(ids),before=baselineSolver(ids);
  const simId=name=>sims.find(sim=>sim.name===name)?.id;
  const originId=simId('史考特崔維斯');
  assert.ok(originId,'測試缺少室友家庭人物');
  const canvasShift=next.get(originId).x-before.get(originId).x;
  ['史考特崔維斯','李莉珀提','帕托柔伊','林克斯卡特琳娜',
   '伊藤直樹','戴爾加托塞普莉亞'].forEach(name=>{
    const id=simId(name);
    assert.ok(id,'測試缺少無關家庭成員：'+name);
    assert.ok(Math.abs(next.get(id).x-before.get(id).x-canvasShift)<0.001,
      '外部姻親接合不可改動無關家系內部距離：'+name);
    assert.equal(next.get(id).y,before.get(id).y);
  });
  const center=xs=>(Math.min(...xs)+Math.max(...xs))/2;
  [...parentGroupMap.values()].forEach(group=>{
    const axis=positions=>{
      const parents=group.parentIds.map(id=>positions.get(id).x+47.5);
      const children=group.children.map(id=>positions.get(id).x+47.5);
      return center(parents)-center(children);
    };
    if(Math.abs(axis(before))<=1){
      assert.ok(Math.abs(axis(next))<=1,
        '主要成員範圍縮小後仍必須保護原有中軸：'+group.key);
    }
  });
});
