// 人物庫定位與透明肖像回歸：以真實函式驗證跨家族切換與姓名佔位清除。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_app.js'),'utf8');
function between(start,end){
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'找不到函式範圍 '+start);
  return app.slice(a,b);
}
const locateSource=between('function findPersonFamilyLocation(','function focusSimOnCanvas(');
function fixture(){
  const db={currentFamilyId:'F1',sims:{
    A:{id:'A',name:'阿布蘭特斯艾梅琳達',gender:'女',status:'在世',race:'human',lifeStage:'成年'},
    B:{id:'B',name:'蓋普提伯特',gender:'男',status:'在世',race:'human',lifeStage:'成年'},
    C:{id:'C',name:'外部成員',gender:'男',status:'在世',race:'human',lifeStage:'成年'}
  },families:[
    {id:'F1',name:'阿布蘭特斯',memberIds:['A']},
    {id:'F2',name:'蓋普',memberIds:['B']}
  ]};
  const entry=(mode,id,members,extra={})=>({
    mode, value:mode+':'+id, familyId:id, memberIds:members,
    primaryMemberIds:members, sourceFamilyIds:[id],...extra
  });
  const entries={
    household:[entry('household','F1',['A']),entry('household','F2',['B'])],
    ea:[entry('ea','F1',['A']),entry('ea','F2',['B'])],
    extended:[entry('extended','F1',['A']),entry('extended','F2',['B'])]
  };
  const selected={household:'household:F1',ea:'ea:F1',extended:'extended:F1'};
  const calls=[];
  const callbacks=[];
  const makeInputs=values=>values.map(value=>({value,checked:true}));
  const context={
    familyTreeViewMode:'household',
    familyTreeLastSourceFamilyId:null,
    currentGenealogyData:()=>db,
    currentFamily:()=>db.families.find(f=>f.id===db.currentFamilyId),
    getActiveFamilySelectorEntry:mode=>entries[mode]?.find(e=>e.value===selected[mode]),
    getFamilySelectorEntries:mode=>entries[mode],
    getFamilyTreeSelectionValue:mode=>selected[mode],
    setFamilyTreeSelectionValue:(mode,value)=>{selected[mode]=value;},
    familySourceSeedIds:f=>[...f.memberIds],
    genealogyStore:{
      setCurrentFamilyId:id=>{db.currentFamilyId=id;},
      getVisibleFamilyIds:f=>new Set(f.memberIds||[])
    },
    statusFilterInputs:makeInputs(['在世','已故']),
    genderFilterInputs:makeInputs(['男','女']),
    raceFilterInputs:makeInputs(['human','alien']),
    lifeStageFilterInputs:makeInputs(['成年','老年']),
    checkedTopbarFilterValues:inputs=>new Set(inputs.filter(i=>i.checked).map(i=>i.value)),
    topbarFilterGroupMatches:(selected,inputs,value)=>
      selected.size===inputs.length||selected.has(value||''),
    updateTopbarFilterUI:()=>calls.push('filtersUI'),
    uiText:text=>text,
    uiAlert:text=>calls.push('alert:'+text),
    localStorage:{setItem:(k,v)=>calls.push('savePref:'+v)},
    FAMILY_TREE_VIEW_MODE_KEY:'familyTreeViewMode',
    dragHistory:{clear:()=>calls.push('history')},
    clearNodeSelection:()=>calls.push('clearSelection'),
    resetFamilyMemberOperations:()=>calls.push('resetMembers'),
    personLibraryController:{close:()=>calls.push('closeLibrary')},
    save:()=>calls.push('save'),
    refreshFamilyUI:()=>calls.push('refreshFamilyUI'),
    refreshFamilyProfilePanel:()=>calls.push('refreshProfile'),
    render:()=>calls.push('render'),
    requestAnimationFrame:cb=>{callbacks.push(cb);},
    getSceneLayout:()=>({pos:new Map(db.families.find(f=>f.id===db.currentFamilyId).memberIds.map(id=>[id,{x:1,y:1}]))}),
    focusSimOnCanvas:id=>calls.push('focus:'+id)
  };
  const functions=vm.runInNewContext(locateSource+
    '\n({findPersonFamilyLocation,revealPersonInTopbarFilters,locatePersonFromLibrary})',context);
  return {context,functions,db,entries,selected,calls,callbacks,
    flush(){while(callbacks.length)callbacks.shift()();}
  };
}
test('人物在當前畫布時，定位只置中，不更換家庭',()=>{
  const f=fixture();
  assert.equal(f.functions.locatePersonFromLibrary('A'),true);
  f.flush();
  assert.equal(f.db.currentFamilyId,'F1');
  assert.equal(f.context.familyTreeViewMode,'household');
  assert.ok(f.calls.includes('focus:A'));
  assert.ok(!f.calls.includes('save'),'沒有切換家庭時不應寫入存檔');
});
test('人物在另一個 Household 時，自動切換家庭並於更新後定位',()=>{
  const f=fixture();
  assert.equal(f.functions.locatePersonFromLibrary('B'),true);
  assert.equal(f.db.currentFamilyId,'F2');
  assert.equal(f.selected.household,'household:F2');
  assert.ok(f.calls.includes('refreshFamilyUI'));
  assert.ok(!f.calls.includes('focus:B'),'畫布更新前不能讀取舊座標');
  f.flush();
  assert.ok(f.calls.includes('focus:B'));
});
test('目前模式沒有目標時，搜尋 EA 或大家族範圍再切換分頁',()=>{
  const f=fixture();
  f.entries.household=f.entries.household.filter(e=>e.memberIds.includes('A'));
  f.entries.ea=f.entries.ea.filter(e=>e.memberIds.includes('A'));
  assert.equal(f.functions.locatePersonFromLibrary('B'),true);
  assert.equal(f.context.familyTreeViewMode,'extended');
  assert.equal(f.db.currentFamilyId,'F2');
  f.flush();
  assert.ok(f.calls.includes('focus:B'));
});
test('定位被頂條篩選隱藏的市民時，只恢復必要選項',()=>{
  const f=fixture();
  f.context.genderFilterInputs[0].checked=false;
  assert.equal(f.functions.locatePersonFromLibrary('B'),true);
  assert.equal(f.context.genderFilterInputs[0].checked,true);
  assert.ok(f.calls.includes('filtersUI'));
  f.flush();
  assert.ok(f.calls.includes('focus:B'));
});
test('人物未屬於任何可見家系時不能假裝定位成功，也不擅自加入家庭',()=>{
  const f=fixture();
  assert.equal(f.functions.locatePersonFromLibrary('C'),false);
  assert.equal(f.db.currentFamilyId,'F1');
  assert.equal(f.callbacks.length,0);
  assert.ok(f.calls.some(x=>x.startsWith('alert:')));
  assert.ok(!f.calls.includes('closeLibrary'));
});
test('遊戲載入與玩家自訂的半透明肖像有圖片就不渲染姓名首字',()=>{
  const fn=vm.runInNewContext(
    between('function personLibraryAvatarHTML(','function petLibraryAvatarHTML(')+
    '\npersonLibraryAvatarHTML;',{
    displayDataText:v=>v,
    esc:s=>s,
    framedAvatarImageHTML:ref=>ref?'<img data-asset-id="'+ref+'">':''
  });
  for(const ref of ['game-portrait-1','custom-portrait-1']){
    const html=fn({name:'艾梅琳達',avatar:ref});
    assert.match(html,/^<img /);
    assert.doesNotMatch(html,/艾|person-library-avatar-fallback/);
  }
  assert.equal(fn({name:'艾梅琳達',avatar:null}),'艾');
});
test('iOS Safari 和 iPadOS 使用不漏畫頭像的匯出路徑，桌面保留原繪製方式',()=>{
  const detect=vm.runInNewContext(
    between('function useSafeIosGenealogyCapture(','async function exportGenealogyImage(')+
    '\nuseSafeIosGenealogyCapture;',{}
  );
  assert.equal(detect({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'}),true);
  assert.equal(detect({userAgent:'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'}),true);
  assert.equal(detect({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X)',platform:'MacIntel',maxTouchPoints:5}),true);
  assert.equal(detect({userAgent:'Mozilla/5.0 (Windows NT 10.0)',platform:'Win32',maxTouchPoints:0}),false);
  assert.match(app,/foreignObjectRendering:\s*!useSafeIosGenealogyCapture\(\)/);
  assert.match(app,/await\s+Promise\.all\(\[\s*prepareCaptureIcons\(captureViewport\),\s*prepareCaptureRelationshipIcons\(captureViewport\),\s*prepareCaptureAssetImages\(captureViewport, backgroundMode\)/);
});
test('總覽改由容器事件委派後，更多操作仍確實呼叫跨家庭定位',async()=>{
  const delegate=between('function bindPersonLibraryEvents() {','function renderPersonLibraryRows(');
  const listeners=[];
  const calls=[];
  const row={dataset:{personLibraryId:'B'}};
  const action={dataset:{personLibraryAction:'locate'}};
  const list={
    dataset:{},
    addEventListener:(name,handler)=>{if(name==='click')listeners.push(handler);},
    contains:element=>element===row
  };
  const target={
    closest:selector=>{
      if(selector==='[data-person-library-id]')return row;
      if(selector==='[data-person-library-action]')return action;
      return null;
    }
  };
  vm.runInNewContext(delegate+'\nbindPersonLibraryEvents();bindPersonLibraryEvents();',{
    $:id=>id==='personLibraryList'?list:null,
    currentGenealogyData:()=>({sims:{B:{id:'B'}}}),
    locatePersonFromLibrary:id=>calls.push(id)
  });
  assert.equal(listeners.length,1,'容器僅綁定一次 click 事件');
  let stopped=0;
  await listeners[0]({target,stopPropagation:()=>{stopped++;}});
  assert.deepEqual(calls,['B']);
  assert.equal(stopped,1);
  assert.doesNotMatch(delegate,/focusSimOnCanvas\(simId\)/);
});

test('總覽大清單分批渲染，且切換分類後取消過期批次',()=>{
  const source=between('function renderPersonLibraryRows(','function renderPetLibrary(');
  const run=(total,cancel)=>{
    const frames=[];
    let observed=0;
    const list={
      isConnected:true,children:[],
      insertAdjacentHTML:(position,html)=>{
        for(const _ of html.matchAll(/<article>/g))list.children.push({querySelectorAll:()=>[]});
      }
    };
    const context={
      list,items:Array.from({length:total},(_,i)=>i),
      personLibraryRenderToken:1,
      personLibraryState:{batchMode:false},
      requestAnimationFrame:fn=>frames.push(fn),
      observePersonLibraryAvatars:(root,rows)=>{observed+=rows.length;},
      setupAppMenus:()=>{}
    };
    vm.runInNewContext(source+'\nrenderPersonLibraryRows(list,items,()=>"<article></article>");',context);
    const firstPaint=list.children.length;
    if(cancel)context.personLibraryRenderToken++;
    while(frames.length)frames.shift()();
    return {firstPaint,count:list.children.length,observed};
  };
  assert.deepEqual(run(80,false),{firstPaint:80,count:80,observed:80});
  assert.deepEqual(run(700,false),{firstPaint:48,count:700,observed:700});
  assert.deepEqual(run(700,true),{firstPaint:48,count:48,observed:48});
});

test('總覽市民家族索引快取在資料變動時失效',()=>{
  const source=between('let personLibraryIndexCache = null;','function resetPersonLibraryOperations(');
  const db={
    sims:{b:{id:'b',name:'Bob'},a:{id:'a',name:'Amy'}},
    families:[{id:'one',memberIds:['a','b']},{id:'two',memberIds:['a']}]
  };
  let petCollections=0;
  const context={
    currentGenealogyData:()=>db,
    collectPetLibraryEntries:()=>{petCollections++;return [{key:'pet',pet:{id:'pet'}}];}
  };
  const examine=vm.runInNewContext(source+'\n({getPersonLibraryIndex,invalidatePersonLibraryIndex})',context);
  const first=examine.getPersonLibraryIndex();
  assert.equal(examine.getPersonLibraryIndex(),first);
  assert.equal(first.sims[0].id,'a');
  assert.equal(first.familyNamesBySimId.get('a').length,2);
  assert.equal(first.petsByKey.get('pet').key,'pet');
  assert.equal(petCollections,1);
  db.sims.z={id:'z',name:'Zed'};
  examine.invalidatePersonLibraryIndex();
  assert.equal(examine.getPersonLibraryIndex().sims.length,3);
  assert.equal(petCollections,2);
});
