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
test('市民與寵物選單在清單內及 body 浮層都使用相同操作處理器',async()=>{
  const delegate=between('async function handlePersonLibraryMenuAction(','function renderPersonLibraryRows(');
  const listListeners=[],documentListeners=[],calls=[];
  const list={
    dataset:{},
    addEventListener:(name,handler)=>{if(name==='click')listListeners.push(handler);},
    contains:row=>!!row
  };
  const pet={key:'PET',pet:{id:'PET',name:'小黑'}};
  const button=(kind,id,action)=>{
    const sim=kind==='sim';
    const target={
      dataset:sim
        ? {personLibraryAction:action,personLibraryActionId:id}
        : {petLibraryAction:action,petLibraryActionId:id}
    };
    target.closest=selector=>{
      if(selector==='[data-person-library-action]')return sim?target:null;
      if(selector==='[data-pet-library-action]')return sim?null:target;
      if(selector==='.ui-menu-body-portal')return {};
      return null;
    };
    return target;
  };
  const context={
    $:name=>name==='personLibraryList'?list:null,
    document:{addEventListener:(name,handler,capture)=>{
      if(name==='click')documentListeners.push({handler,capture});
    }},
    personLibraryDialog:{classList:{contains:value=>value==='show'}},
    currentGenealogyData:()=>({sims:{B:{id:'B',name:'Beth'}}}),
    getPersonLibraryIndex:()=>({petsByKey:new Map([['PET',pet]])}),
    locatePersonFromLibrary:id=>calls.push('sim:'+id),
    locatePetFromLibrary:entry=>calls.push('pet:'+entry.key)
  };
  vm.runInNewContext(delegate+'\nbindPersonLibraryEvents();bindPersonLibraryEvents();',context);
  assert.equal(listListeners.length,1,'清單只綁定一次');
  assert.equal(documentListeners.length,1,'body 浮層只綁定一次');
  assert.equal(documentListeners[0].capture,true,'在共用 UI 還原浮層前處理動作');

  const simAction=button('sim','B','locate');
  const simRow={dataset:{personLibraryId:'B'}};
  let stopped=0;
  await listListeners[0]({
    target:{closest:selector=>{
      if(selector==='[data-person-library-id]')return simRow;
      if(selector==='[data-person-library-action], [data-pet-library-action]')return simAction;
      return null;
    }},
    stopPropagation:()=>stopped++
  });
  assert.deepEqual(calls,['sim:B']);
  assert.equal(stopped,1);

  const portal=(action)=>({
    closest:selector=>
      selector==='[data-person-library-action], [data-pet-library-action]'?action:null
  });
  documentListeners[0].handler({target:portal(button('sim','B','locate'))});
  documentListeners[0].handler({target:portal(button('pet','PET','locate'))});
  assert.deepEqual(calls,['sim:B','sim:B','pet:PET']);
  assert.doesNotMatch(delegate,/focusSimOnCanvas\(simId\)/);

  const petMarkup=between('function renderPetLibrary() {','function renderPersonLibrary() {');
  assert.equal((petMarkup.match(/data-pet-library-action-id/g)||[]).length,4,
    '寵物每個操作項目都附有可供 body 浮層查找的穩定 ID');
});

test('分批加入的清單使用局部選單初始化，不重掃全文件',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_ui.js'),'utf8');
  const begin=source.indexOf('function setupAppMenus(scope = document) {');
  const end=source.indexOf('// ========【共用說明 Tooltip】',begin);
  assert.ok(begin>=0&&end>begin,'找不到共用選單初始化');
  const fn=source.slice(begin,end);
  const bindings={menu:0,global:0};
  const menu={
    dataset:{},
    querySelector:selector=>selector===':scope > .ui-menu-trigger'?trigger:null,
    querySelectorAll:selector=>selector==='.ui-menu-item'?[item]:[]
  };
  const trigger={dataset:{},addEventListener:()=>bindings.menu++};
  const item={addEventListener:()=>bindings.menu++};
  const row={querySelectorAll:selector=>selector==='.ui-menu'?[menu]:[]};
  vm.runInNewContext('let _appMenuGlobalBound=false;\n'+fn+
    '\nsetupAppMenus([row]);setupAppMenus([row]);',{
      row,
      document:{
        querySelectorAll:()=>{throw Error('不應掃描整個 document');},
        addEventListener:()=>bindings.global++
      },
      window:{addEventListener:()=>bindings.global++}
    });
  assert.equal(bindings.menu,2,'同一選單按鈕與項目均只初始化一次');
  assert.equal(bindings.global,3,'全域 click、keydown、resize 監聽只初始化一次');
});

test('總覽大清單分批渲染，且切換分類後取消過期批次',()=>{
  const source=between('function renderPersonLibraryRows(','function renderPetLibrary(');
  const run=(total,cancel)=>{
    const frames=[];
    let observed=0;
    const menuScopes=[];
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
      setupAppMenus:rows=>menuScopes.push(rows.length)
    };
    vm.runInNewContext(source+'\nrenderPersonLibraryRows(list,items,()=>"<article></article>");',context);
    const firstPaint=list.children.length;
    if(cancel)context.personLibraryRenderToken++;
    while(frames.length)frames.shift()();
    return {firstPaint,count:list.children.length,observed,menuScopes};
  };
  assert.deepEqual(run(80,false),{firstPaint:80,count:80,observed:80,menuScopes:[80]});
  const many=run(700,false);
  assert.equal(many.firstPaint,48);
  assert.equal(many.count,700);
  assert.equal(many.observed,700);
  assert.equal(many.menuScopes.length,15);
  assert.equal(many.menuScopes.reduce((a,b)=>a+b,0),700);
  assert.deepEqual(run(700,true),{firstPaint:48,count:48,observed:48,menuScopes:[48]});
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

test('寵物總覽輸出的四項選單操作均攜帶真實寵物 ID',()=>{
  const renderSource=between('function renderPetLibrary() {','function renderPersonLibrary() {');
  const keys=['PET-001','PET-002'];
  const entries=keys.map(key=>({key,pet:{id:key,name:key}}));
  let html='';
  const list={replaceChildren(){}};
  const controller={syncCategoryCounts(){},syncViewControls(){},syncBatchToolbar(){}};
  vm.runInNewContext(renderSource+'\nrenderPetLibrary();',{
    $:()=>list,
    getPersonLibraryIndex:()=>({pets:entries}),
    personLibrarySearch:{value:''},
    personLibraryController:controller,
    petLibraryDisplayInfo:entry=>({
      name:entry.pet.name,species:'狗',breed:'',ownerLabel:'飼主'
    }),
    uiText:text=>text,
    petGenderLabel:()=>'',personLibraryViewMode:'detailed',
    personLibraryState:{batchMode:false,selection:new Set()},
    esc:value=>String(value),
    iconSvg:()=>'',petLibraryAvatarHTML:()=>'<span></span>',
    renderPersonLibraryRows:(root,filtered,renderRow)=>{
      html=filtered.map(renderRow).join('');
    }
  });
  const actions=[...html.matchAll(/data-pet-library-action="(view|edit|locate|delete)" data-pet-library-action-id="([^"]*)"/g)]
    .map(match=>({action:match[1],id:match[2]}));
  assert.equal(actions.length,8);
  for(const key of keys){
    assert.deepEqual(actions.filter(item=>item.id===key).map(item=>item.action),
      ['view','edit','locate','delete']);
  }
  assert.doesNotMatch(html,/data-pet-library-action-id="' \+ esc\(entry\.key\) \+ '"/);
});
