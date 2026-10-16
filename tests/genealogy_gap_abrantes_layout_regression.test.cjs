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
  // 與正式 getCachedGenealogyTopology 一致：每個可見家系只取自己的成員與父母群組。
  getCachedGenealogyTopology:(visibleIds)=>{
    const ids=new Set([...visibleIds].map(String));
    const scopedSims=sims.filter(sim=>ids.has(sim.id));
    const scopedById=new Map(scopedSims.map(sim=>[sim.id,sim]));
    const groups=new Map();
    scopedSims.forEach(sim=>{
      const parents=(sim.parentIds||[]).map(String)
        .filter(id=>scopedById.has(id)).sort();
      if(!parents.length)return;
      const key=parents.join('|');
      if(!groups.has(key))groups.set(key,{key,parentIds:parents,children:[]});
      groups.get(key).children.push(sim.id);
    });
    return {
      sims:scopedSims,byId:scopedById,
      parentGroups:[...groups.values()],
      canonicalGenerationBySim:new Map(
        scopedSims.map(sim=>[sim.id,canonical.get(sim.id)])
      )
    };
  },
  getActiveFamilySelectorEntry:()=>({
    primaryMemberIds:family.memberIds,
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
  assert.ok(sofia.x<tiago.x,'姻親兄弟姊妹應在主家外側');
  assert.ok(tiago.x-sofia.x<300,'同父母子女不可橫跨其他家族');
  assert.ok(tibert.x>tiago.x,'蓋普不能插在阿布蘭特斯兄弟姊妹中間');
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
test('無關的室友與朋友家庭仍獨立排列，不和其他家庭卡片重疊',()=>{
  const names=['史考特崔維斯','李莉珀提','哈樂戴桑莫',
    '帕托柔伊','卡拉尼米切爾','林克斯卡特琳娜'];
  const cards=names.map(person);
  assert.ok(cards.every(pos=>Number.isFinite(pos.x)&&Number.isFinite(pos.y)));
  cards.forEach((left,i)=>cards.slice(i+1).forEach(right=>{
    if(left.y===right.y)
      assert.ok(Math.abs(left.x-right.x)>=95-0.001,
        '非主要家庭人物不能被排列到相同位置');
  }));
});
test('阿布蘭特斯修正只位移實際擋路的蓋普／蒙提分支，不擾動其他預設家族',()=>{
  const oldSolver=vm.runInNewContext(
    implementations.replace(
      'compactCrossRootSiblingGroups(layers,model,ownership);',
      '// 關閉跨家系兄弟姊妹校正以比較影響範圍'
    )+'\nsolveAutomaticGenealogyPositions;',ctx
  );
  const before=oldSolver(ids);
  // 獨立家系排列後，上一家系寬度變動會讓其他家系整組平移。
  // 僅主家系的跨家系兄弟與其祖先可以做局部修正；無關家系不得變形。
  const geometry=vm.runInNewContext(
    implementations+'\n({buildGenealogyLayoutModel,genealogyConnectedLayoutFamilyComponents});',
    ctx
  );
  const roots=geometry.genealogyConnectedLayoutFamilyComponents(
    geometry.buildGenealogyLayoutModel(ids),ids
  );
  const selected=new Set(family.memberIds);
  let externalChecked=0;
  roots.filter(root=>!root.some(id=>selected.has(id))).forEach(root=>{
    const anchor=root[0];
    const delta=positions.get(anchor).x-before.get(anchor).x;
    root.forEach(id=>{
      const name=byId.get(id)?.name;
      assert.ok(Math.abs((positions.get(id).x-before.get(id).x)-delta)<0.001,
        '無關完整家系內部的相對位置不可變更：'+name);
      assert.equal(positions.get(id).y,before.get(id).y,
        '無關完整家系的顯示世代不可變更：'+name);
      externalChecked++;
    });
  });
  assert.ok(externalChecked>=35,'須確實檢查大量未選取的其他家庭');
  const affected=['阿布蘭特斯蘇菲亞','蒙提茱麗葉','柯德莉亞．蓋普']
    .filter(name=>{
      const id=sims.find(sim=>sim.name===name)?.id;
      return id&&(positions.get(id).x!==before.get(id).x||
        positions.get(id).y!==before.get(id).y);
    });
  assert.ok(affected.length>0,'測試應確實觸發主要家系校正');
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

test('蓋普大家族的姻親接合保持其他完整家系的相對位置',()=>{
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
  // 外部家系會在畫布上整組搬動，但家系內部的水平距離必須不變。
  const independent=['伊藤直樹','伊藤惠','伊藤清','伊藤七海'];
  const anchor=independent[0];
  independent.forEach(name=>{
    const oldDistance=posOf(name,baseline).x-posOf(anchor,baseline).x;
    const nextDistance=posOf(name,positions).x-posOf(anchor,positions).x;
    assert.ok(Math.abs(oldDistance-nextDistance)<0.001,
      '姻親接入不能改變其他家系內部的排列：'+name);
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
    assert.ok(updated<=0.75,'姻親接合後原本正確的親子中軸仍須真正對齊');
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

test('各完整血緣家系先獨立排列，避免跨家族親子線被拉成數千像素',()=>{
  const center=values=>(Math.min(...values)+Math.max(...values))/2;
  const errors=[...parentGroupMap.values()].map(group=>{
    const parent=group.parentIds.map(id=>positions.get(id).x+47.5);
    const children=group.children.map(id=>positions.get(id).x+47.5);
    return {
      group,
      offset:center(parent)-center(children)
    };
  });
  assert.equal(errors.length,31);
  const mean=errors.reduce((total,item)=>total+Math.abs(item.offset),0)/errors.length;
  assert.ok(mean<55,'各自完整排列後親子中軸平均偏差不應仍有數百像素：'+mean);
  const long=errors.filter(item=>Math.abs(item.offset)>1000);
  assert.deepEqual(long.map(item=>item.group.key),[],
    '血緣家系應該完整接合，不得再出現數千像素長的親子線');
  assert.ok(implementations.includes('function genealogyConnectedLayoutFamilyComponents('));
  assert.ok(implementations.includes('function arrangeIndependentGenealogyFamilyComponents('));
});

test('82 位預設模擬市民的全部 31 組親子中軸都真正置中',()=>{
  const center=xs=>(Math.min(...xs)+Math.max(...xs))/2;
  assert.equal(parentGroupMap.size,31);
  parentGroupMap.forEach(group=>{
    const parents=group.parentIds.map(id=>positions.get(id).x+47.5);
    const children=group.children.map(id=>positions.get(id).x+47.5);
    const offset=Math.abs(center(parents)-center(children));
    assert.ok(offset<=0.75,
      '親子中軸偏差：'+group.parentIds.map(id=>byId.get(id)?.name).join('、')+' = '+offset);
  });
});
test('跨代共同父母在畫布同列，但 canonical generation 不變',()=>{
  const names=['高斯貝拉','高斯摩提梅爾','莉娜．達榮','賽夫．達榮',
    '阿德．達榮','艾尼歐拉．達榮','達麗拉．德里莫','戴維斯．德里莫',
    '達榮阿德科亞','伊曼尼．達榮'];
  for(let i=0;i<names.length;i+=2){
    assert.equal(person(names[i]).y,person(names[i+1]).y,
      '配偶不同世代：'+names[i]);
  }
  const model=vm.runInNewContext(implementations+'\nbuildGenealogyLayoutModel;',ctx)(ids);
  sims.forEach(sim=>assert.equal(model.canonicalGenerationBySim.get(sim.id),canonical.get(sim.id),
    '畫布世代不可覆寫資料：'+sim.name));
});
test('上游祖先與較早出生子女限制可阻止不安全的世代提升',()=>{
  const start=scene.indexOf('function alignRootCoParentLayoutGenerations(');
  const end=scene.indexOf('function selectPrimaryHorizontalPairs(',start);
  assert.ok(start>=0&&end>start);
  const normalize=vm.runInNewContext(
    scene.slice(start,end)+'\nalignRootCoParentLayoutGenerations;'
  );
  const ids=['ancestor','mother','father','child','olderChild'];
  const byId=new Map(ids.map(id=>[id,{id}]));
  const groups=[
    {parentIds:['ancestor'],children:['mother']},
    {parentIds:['mother','father'],children:['child']},
    {parentIds:['father'],children:['olderChild']}
  ];
  const generation=new Map([['ancestor',0],['mother',2],['father',0],
    ['child',3],['olderChild',1]]);
  normalize(byId,groups,generation);
  assert.equal(generation.get('mother'),2);
  assert.equal(generation.get('father'),0);
  generation.delete('olderChild');
  normalize(byId,groups.slice(0,2),generation);
  assert.equal(generation.get('father'),2);
});

test('羅吉戈與底比女王貼近橫向連接，子女仍在下一代',()=>{
  const queen=person('底比女王'),rodrigo=person('羅吉戈．迪．帕布羅');
  const child=person('羅吉戈．底比');
  assert.equal(rodrigo.y,queen.y);
  assert.ok(Math.abs(rodrigo.x-queen.x)<200,
    '共同父母相隔過遠：'+Math.abs(rodrigo.x-queen.x));
  assert.ok(child.x>rodrigo.x&&child.x<queen.x+95&&child.y>queen.y);
});
test('蒙提茱麗葉與蓋普提伯特以親子錨點對稱，保留下游家系安全空間',()=>{
  const juliet=person('蒙提茱麗葉'),tibert=person('蓋普提伯特');
  const parents=[person('卡利班．蓋普'),person('柯德莉亞．蓋普')];
  const source=(parents[0].x+47.5+parents[1].x+47.5)/2;
  const children=(juliet.x+47.5+tibert.x+47.5)/2;
  assert.ok(Math.abs(source-children)<=0.75);
  assert.ok(tibert.x-juliet.x<200,
    '配偶不能把兄妹卡片撐開超出必要空間');
  const dante=person('蒙提但丁'),beatrice=person('蓋普碧翠絲');
  assert.ok(dante.x+95+34<=beatrice.x+0.001,
    '子孫不能為了置中而互相重疊');
  assert.equal(juliet.y,tibert.y);
});

test('完整姻親家系從主家外側接入，血緣連接仍維持置中',()=>{
  const main=person('底比五世柯德莉亞');
  const partner=person('阿布蘭特斯蒂亞戈');
  const sibling=person('阿布蘭特斯蘇菲亞');
  const mother=person('阿布蘭特斯艾梅琳達');
  const ancestor=person('柯德莉亞．底比四世');
  assert.ok(partner.x+95<main.x,'外部配偶不能靠主家內側');
  assert.ok(sibling.x+95<partner.x,'兄弟姊妹應向外延伸');
  assert.ok(Math.abs(main.x-ancestor.x)<=0.75,'主家原生親子主幹不可偏移');
  assert.ok(Math.abs(mother.x-(partner.x+sibling.x)/2)<=0.75,'姻親上一代必須正確置中');
});

test('多重共同父母以完整區塊靠近，不能只修其中一名家長',()=>{
  const queen=person('底比女王'),john=person('約翰．威爾森．鬍鬍');
  const rodrigo=person('羅吉戈．迪．帕布羅');
  const cornelia=person('柯德莉亞．底比二世'),rodrigoChild=person('羅吉戈．底比');
  assert.ok(queen.x-john.x<650,'約翰仍離主要共同父母過遠');
  assert.ok(queen.x-rodrigo.x<300,'另一組共同父母不能被推遠');
  assert.ok(john.x<rodrigo.x&&rodrigo.x<queen.x,'多位共同父母應向家系外側排列');
  assert.ok(cornelia.x+95<=rodrigoChild.x,'不同父母群組的子女不能碰撞');
  const algorithm=scene.slice(scene.indexOf('function optimizeDistantCoParentFamilyBlocks('),
    scene.indexOf('function compactSiblingBranchAnchors('));
  assert.doesNotMatch(algorithm,/約翰|羅吉戈|阿布蘭特斯/,'不能用人物名稱寫死排列');
});
test('切換家系主軸時，不可惡化原本正確的親子中軸或造成重疊',()=>{
  const selections=[
    ['底比女王'],
    ['阿布蘭特斯艾梅琳達','阿布蘭特斯蘇菲亞'],
    ['蓋普提伯特','蓋普碧翠絲','蓋普瑟勒絲特','蓋普維吉里歐']
  ];
  const lookup=new Map(sims.map(sim=>[sim.name,sim.id]));
  const injection='  optimizeDistantCoParentFamilyBlocks(layers,model,ownership,connectorGroups);';
  selections.forEach(names=>{
    const selected=names.map(name=>lookup.get(name));
    const context={...ctx,getActiveFamilySelectorEntry:()=>({
      primaryMemberIds:selected,seedIds:selected,labelFamily:{memberIds:selected}
    }),currentTreeFamily:()=>({memberIds:selected})};
    const calculate=code=>vm.runInNewContext(code+'\nsolveAutomaticGenealogyPositions;',context)(ids);
    const next=calculate(implementations);
    const before=calculate(implementations.replace(injection,'  // 舊版未收斂遠距父母'));
    const center=(group,positions)=>{
      const parent=group.parentIds.map(id=>positions.get(id).x+47.5);
      const child=group.children.map(id=>positions.get(id).x+47.5);
      const mid=a=>(Math.min(...a)+Math.max(...a))/2;
      return Math.abs(mid(parent)-mid(child));
    };
    parentGroupMap.forEach(group=>{
      if(center(group,before)<=0.75)assert.ok(center(group,next)<=0.75,
        '切換主家不可破壞既有直線：'+names.join('、'));
    });
    const rows=new Map();
    next.forEach(pos=>{
      if(!rows.has(pos.y))rows.set(pos.y,[]);
      rows.get(pos.y).push(pos.x);
    });
    rows.forEach(xs=>{
      xs.sort((a,b)=>a-b);
      for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=95-0.01,
        '切換主家後卡片不可重疊：'+names.join('、'));
    });
  });
});
