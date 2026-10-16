// 親子 V-H-V → V、配偶 H-V-H → H：拖曳時應以 renderer 的真實錨點磁吸還原。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../L1nG/GenealogyExporter');
const scene=fs.readFileSync(path.join(root,'genealogy_scene.js'),'utf8');
const interaction=fs.readFileSync(path.join(root,'genealogy_interaction.js'),'utf8');
function section(source,first,last) {
  const a=source.indexOf(first),b=source.indexOf(last,a+first.length);
  assert.ok(a>=0&&b>a,'找不到來源函式區間：'+first);
  return source.slice(a,b);
}
const code=section(scene,'function genealogySpouseSnapCandidates(','function getRelationshipPositionSnap(')+
  section(scene,'function buildSingleDragRelationshipTargets(','function resizeStageToContent(');
function fixture({
  people={P:{spouseIds:['M']},M:{},C:{}},
  positions={P:{x:100,y:0},M:{x:200,y:0},C:{x:115,y:250}},
  parentIds=['P'], children=['C'],
  zoom=1
}={}) {
  const byId=new Map(Object.entries(people).map(([id,p])=>[id,{id,...p}]));
  const pos=new Map(Object.entries(positions).map(([id,p])=>[id,{id,...p}]));
  const visibleIds=new Set(pos.keys());
  const group={parentIds,children};
  const rect=card=>({centerY:card.y+40});
  const anchor=card=>({x:card.x+50,y:card.y});
  const source=(_group,points)=>{
    const xs=parentIds.map(id=>points.get(id)?.x+50).filter(Number.isFinite);
    return xs.length?{x:xs.reduce((a,b)=>a+b,0)/xs.length,y:100}:null;
  };
  const env={
    layoutCache:{byId,pos,visibleIds},
    PAD:0,GUIDE_SNAP_PX:8,RELATIONSHIP_VERTICAL_SNAP_PX:10,scale:zoom,
    getCardAvatarGeometry:()=>({top:10,size:60}),
    cardAvatarRect:rect,
    relationshipVerticalAnchorOffsetX:()=>50,
    cardVerticalAnchor:anchor,
    parentConnectorSource:source,
    buildParentChildConnectorGroups:()=>[group]
  };
  return {
    ...vm.runInNewContext(code+'\n({buildSingleDragRelationshipTargets,getParentConnectorStraightSnap,getSpouseRowSnap})',env),
    pos,byId,group,source,anchor
  };
}
const dragCode=section(interaction,'function normalizeGeometry(','function createGroupDragSession(');
const {createSingleDragSession}=vm.runInNewContext(
  dragCode+'\n({createSingleDragSession})'
);
function drag(targets,id,rawX,rawY,zoom=1) {
  const geometry=[
    {id,x:100,y:0,width:100,height:80},
    {id:'OTHER',x:430,y:520,width:100,height:80}
  ];
  return createSingleDragSession({
    id,geometry,guideSnapPx:8,relationshipSnapPx:10,
    relationshipTargets:targets
  }).snap(rawX,rawY,zoom);
}
test('原本折成 V-H-V 的單一子女，靠近父母 X 軸時直接吸回直線',()=>{
  const f=fixture();
  const targets=f.buildSingleDragRelationshipTargets('C');
  assert.equal(targets.x.length,1);
  assert.equal(targets.x[0].value,100);
  const snapped=drag(targets,'C',106,250);
  assert.equal(snapped.x,100);
  assert.equal(snapped.guideX,150);
  assert.equal(f.source(f.group,f.pos).x,snapped.x+50);
});
test('父母端也能反向吸附至子女中軸，而不只支援拖曳子女',()=>{
  const f=fixture();
  const targets=f.buildSingleDragRelationshipTargets('P');
  assert.equal(targets.x[0].value,115);
  const snapped=drag(targets,'P',110,0);
  assert.equal(snapped.x,115);
  assert.equal(snapped.guideX,165);
  const moved=new Map(f.pos);
  moved.set('P',{...moved.get('P'),x:snapped.x});
  assert.equal(f.source(f.group,moved).x,f.anchor(f.pos.get('C')).x);
});
test('兩位父母不合併成水平 unit 時，使用雙親接點的 1:2 位移斜率',()=>{
  const f=fixture({
    positions:{P:{x:100,y:0},M:{x:200,y:0},C:{x:175,y:250}},
    parentIds:['P','M'],children:['C']
  });
  const targets=f.buildSingleDragRelationshipTargets('P');
  assert.equal(targets.x.length,1);
  assert.equal(targets.x[0].value,150);
  const snapped=drag(targets,'P',146,0);
  assert.equal(snapped.x,150);
  const moved=new Map(f.pos);
  moved.set('P',{...moved.get('P'),x:snapped.x});
  assert.equal(f.source(f.group,moved).x,f.anchor(f.pos.get('C')).x);
});
test('已故配偶及單側關係紀錄仍提供水平磁吸',()=>{
  const f=fixture({
    people:{P:{spouseIds:['M']},M:{},C:{}},
    positions:{P:{x:100,y:0},M:{x:200,y:28},C:{x:100,y:250}}
  });
  assert.equal(f.buildSingleDragRelationshipTargets('M').y[0].value,0,
    '只在 P 端儲存配偶，拖曳 M 仍應找到 P');
  const deceased=fixture({
    people:{P:{gameData:{deceasedSpouseIds:['M']}},M:{},C:{}}
  });
  assert.equal(deceased.buildSingleDragRelationshipTargets('M').y[0].value,0);
});
test('配偶 H-V-H 接近同一頭像高度時吸回水平 H，輔助線指向頭像高度',()=>{
  const f=fixture();
  const targets=f.buildSingleDragRelationshipTargets('M');
  const snapped=drag(targets,'M',100,7);
  assert.equal(snapped.y,0);
  assert.equal(snapped.guideY,40);
});
test('離吸附範圍太遠時不強制移動；放大後使用同樣畫面像素閾值',()=>{
  const f=fixture();
  const targets=f.buildSingleDragRelationshipTargets('C');
  assert.equal(drag(targets,'C',114,20).x,114);
  assert.equal(drag(targets,'C',106,20,2).x,106);
  assert.equal(drag(targets,'C',104,20,2).x,100);
});
test('SVG 單一子女及配偶路徑，靠接錨點後真的收斂為純 V／純 H',()=>{
  const parentCode=section(scene,'function drawParentConnectorGroup(','function paintRelationshipLayer(');
  const env={
    parentConnectorSource:(group,pos)=>({x:pos.get('P').x+50,y:100}),
    parentConnectorChildAnchor:p=>({x:p.x+50,y:250}),
    showRelLabels:false,relationshipPerspectiveSimId:null,
    getRelInfoByKey:()=>null
  };
  const draw=vm.runInNewContext(parentCode+'\ndrawParentConnectorGroup;',env);
  const people=new Map([['P',{id:'P'}],['C',{id:'C'}]]);
  const group={parentIds:['P'],children:['C']};
  const map=new Map([['P',{x:100,y:0}],['C',{x:115,y:250}]]);
  const paths=[];
  draw(group,map,people,paths,null);
  assert.match(paths.join(''),/ V[^"]+ H[^"]+ V/,'未對齊時應是 V-H-V');
  map.set('C',{x:100,y:250});
  paths.length=0;draw(group,map,people,paths,null);
  assert.match(paths.join(''),/ V250/);
  assert.doesNotMatch(paths.join(''),/ H/,'對齊後不應殘留水平折線');
  const pairSource=section(scene,'function createPartnerConnectionPath(','function derivePersonCardClassName(');
  const pair=vm.runInNewContext(pairSource+'\ncreatePartnerConnectionPath;',{
    getPairConnectionGeometry:(a,b)=>({aX:a.x+100,aY:a.y+40,bX:b.x,bY:b.y+40})
  });
  assert.match(pair({x:100,y:0},{x:300,y:30}),/H.+V.+H/);
  const restored=pair({x:100,y:0},{x:300,y:0});
  assert.match(restored,/ H/);
  assert.doesNotMatch(restored,/ V/);
});
