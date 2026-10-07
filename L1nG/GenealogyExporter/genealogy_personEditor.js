/* ========【L1nG Genealogy Person Editor】 設定 - 人物編輯工作區 / Draft State / Editor Lifecycle Authority ======== */
(function (global) {
  'use strict';

  let genealogyStoreAuthority = null;
  let avatarImageCompressor = null;
  let avatarImageAssetSaver = null;
  let personEditorToast = null;
  let personEditorScene = null;
  let personEditorGetCurrentFamily = null;
  let personEditorGetViewMode = null;

  function bindStore(store) {
    if (!store || typeof store.getData !== 'function') {
      throw new Error('Person Editor requires Genealogy Store.');
    }
    genealogyStoreAuthority = store;
  }

  function currentGenealogyData() {
    const data = genealogyStoreAuthority?.getData?.();
    if (!data) {
      throw new Error('Person Editor has no active genealogy database.');
    }
    return data;
  }

  function refreshEditorSelect(selectId) {
    global.L1nGGenealogyUIController
      ?.refreshSelect?.(selectId);
  }

  const DEFAULT_AVATAR_FRAME =
    Object.freeze({
      x:0.5,
      y:0.5,
      zoom:1
    });

  const simEditorState = {
    simId:null,
    avatar:null,
    avatarFrame:{ ...DEFAULT_AVATAR_FRAME },
    gameAvatar:null,
    gameAvatarFrame:{ ...DEFAULT_AVATAR_FRAME },
    customAvatar:null,
    customAvatarFrame:{ ...DEFAULT_AVATAR_FRAME },
    avatarSource:'custom',
    traits:[],
    parentKinds:new Map(),
    childKinds:new Map(),
    explicitSiblingIds:new Set(),
    derivedSiblingIds:new Set(),
    familyLabelDrafts:new Map(),
    otherRelationshipAnnotationDrafts:new Map()
  };

  const editingPets = [];

  const petEditorState = {
    index:-1,
    avatar:null,
    avatarFrame:{ ...DEFAULT_AVATAR_FRAME },
    traits:[]
  };

  const editingGallery = [];

  // ========【人物編輯器延遲建立】 設定 - 基本資料先顯示，隱藏分頁真正需要時再建立 ========
  let personEditorRelationshipDataReady=false;
  let personEditorRelationshipUiReady=false;
  let personEditorRelationshipAuthority=null;
  let personEditorRelationCandidates=[];
  let personEditorRelationCandidateById=new Map();
  let personEditorParentCandidateIds=new Set();
  let personEditorWarmupHandle=null;
  let personEditorWarmupMode='';
  let personEditorSessionVersion=0;
  let personEditorMediaDraftReady=false;
  let personEditorMediaUiReady=false;

  const lifePhotoState = {
    editor:{
      index:-1,
      imageRef:'',
      sizeKB:0,
      isOriginal:false
    },
    viewer:{
      mode:'draft',
      simId:null,
      index:0
    }
  };

  function replaceDraftCollection(
    target,
    values
  ) {
    target.splice(
      0,
      target.length,
      ...(values || [])
    );
  }

  function currentSimEditorPerson() {
    return simEditorState.simId
      ? currentGenealogyData()?.sims?.[
          simEditorState.simId
        ] || null
      : null;
  }

  function syncPersonEditorActiveAvatar() {
    let source =
      simEditorState.avatarSource ===
      'game'
        ? 'game'
        : 'custom';

    if (
      source === 'game' &&
      !simEditorState.gameAvatar &&
      simEditorState.customAvatar
    ) {
      source = 'custom';
    } else if (
      source === 'custom' &&
      !simEditorState.customAvatar &&
      simEditorState.gameAvatar
    ) {
      source = 'game';
    }

    simEditorState.avatarSource =
      source;

    simEditorState.avatar =
      source === 'game'
        ? simEditorState.gameAvatar
        : simEditorState.customAvatar;

    simEditorState.avatarFrame =
      normalizeAvatarFrame(
        source === 'game'
          ? simEditorState.gameAvatarFrame
          : simEditorState.customAvatarFrame
      );

    return source;
  }

  function syncPersonEditorAvatarControls() {
    const source =
      syncPersonEditorActiveAvatar();

    const toggle =
      $('avatarSourceToggleBtn');

    if (toggle) {
      const target =
        source === 'game'
          ? 'custom'
          : 'game';

      toggle.textContent =
        uiText(
          target === 'game'
            ? '使用遊戲頭像'
            : '使用自訂頭像'
        );

      toggle.disabled =
        target === 'game'
          ? !simEditorState.gameAvatar
          : !simEditorState.customAvatar;

      toggle.dataset.avatarTarget =
        target;
    }

    const adjust =
      $('avatarAdjustBtn');

    if (adjust) {
      adjust.disabled =
        !simEditorState.avatar;
    }

    const clear =
      $('avatarClearBtn');

    if (clear) {
      clear.disabled =
        source !== 'custom' ||
        !simEditorState.customAvatar;
    }
  }

  function resetPersonEditorDraftState() {
    simEditorState.simId = null;
    simEditorState.avatar = null;
    simEditorState.avatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };
    simEditorState.gameAvatar = null;
    simEditorState.gameAvatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };
    simEditorState.customAvatar = null;
    simEditorState.customAvatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };
    simEditorState.avatarSource = 'custom';
    simEditorState.traits = [];
    simEditorState.parentKinds.clear();
    simEditorState.childKinds.clear();
    simEditorState.explicitSiblingIds.clear();
    simEditorState.derivedSiblingIds.clear();
    simEditorState.familyLabelDrafts.clear();
    simEditorState.otherRelationshipAnnotationDrafts.clear();

    replaceDraftCollection(
      editingPets,
      []
    );

    replaceDraftCollection(
      editingGallery,
      []
    );

    personEditorSessionVersion+=1;

    if(personEditorWarmupHandle!=null){
      if(
        personEditorWarmupMode==='idle'&&
        typeof global.cancelIdleCallback==='function'
      ){
        global.cancelIdleCallback(
          personEditorWarmupHandle
        );
      }else{
        global.clearTimeout(
          personEditorWarmupHandle
        );
      }
    }

    personEditorWarmupHandle=null;
    personEditorWarmupMode='';
    personEditorRelationshipDataReady=false;
    personEditorRelationshipUiReady=false;
    personEditorRelationshipAuthority=null;
    personEditorRelationCandidates=[];
    personEditorRelationCandidateById=new Map();
    personEditorParentCandidateIds=new Set();
    personEditorMediaDraftReady=false;
    personEditorMediaUiReady=false;
  }

function renderPersonEditorAvatarPreview(){
    syncPersonEditorAvatarControls();

    const element=$('avatarPreview');
    const avatar=framedAvatarImageHTML(simEditorState.avatar,simEditorState.avatarFrame);

    if(avatar){
      element.innerHTML=avatar;
    }else{
      const name=$('fName').value.trim();
      element.textContent=name?name.charAt(0):'?';
    }
  }

  function syncPersonEditorCauseOfDeathVisibility() {
  const st = $('fStatus').value;
  const label = $('causeOfDeathLabel');
  if (st === '已故' || st === '幽靈') label.style.display = '';
  else label.style.display = 'none';
}

// ========【個人檔案編輯器】 設定 - 分頁、生日年齡摘要與特徵標籤 ========
function getBirthdayDayLimit(monthValue) {
  const month = Number(monthValue) || 0;
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 31;
}

function populatePersonEditorBirthdayDays(preferredValue = null) {
  const monthSelect = $('fBirthdayMonth');
  const daySelect = $('fBirthdayDay');
  if (!monthSelect || !daySelect) return;

  const current = preferredValue !== null ? String(preferredValue || '') : String(daySelect.value || '');
  const limit = monthSelect.value ? getBirthdayDayLimit(monthSelect.value) : 31;
  daySelect.innerHTML = `<option value="">${esc(uiText('日'))}</option>` +
    Array.from({ length: limit }, (_, index) => {
      const day = String(index + 1);
      return `<option value="${day}">${day}</option>`;
    }).join('');
  if (current && Number(current) <= limit) daySelect.value = current;

  refreshEditorSelect('fBirthdayDay');
}

function syncTraitHiddenInput() {
  const hidden = $('fTraits');
  if (hidden) hidden.value = simEditorState.traits.join('，');
}

function renderTraitEditor() {
  const list = $('traitChipList');
  if (!list) return;
  syncTraitHiddenInput();
  list.innerHTML = simEditorState.traits.map((trait, index) =>
    `<span class="trait-chip"><span>${esc(trait)}</span><button type="button" class="trait-chip-remove" data-trait-index="${index}" aria-label="${esc(uiText('移除'))}" title="${esc(uiText('移除'))}">×</button></span>`
  ).join('');
  list.querySelectorAll('.trait-chip-remove').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.traitIndex);
      if (!Number.isInteger(index) || index < 0 || index >= simEditorState.traits.length) return;
      simEditorState.traits.splice(index, 1);
      renderTraitEditor();
    });
  });
}

// ========【遊戲偏好顯示】 設定 - 喜好與厭惡唯讀呈現；吸引力偏好僅在有實際資料時顯示 ========
function personEditorPreferenceData(sim=currentSimEditorPerson()){
  const source=
    sim &&
    sim.gameData &&
    sim.gameData.preferences &&
    typeof sim.gameData.preferences === 'object'
      ? sim.gameData.preferences
      : null;

  return {
    availability:
      source && source.availability
        ? String(source.availability)
        : 'unavailable',
    likesDislikes:
      source && Array.isArray(source.likesDislikes)
        ? source.likesDislikes
        : [],
    attraction:
      source && Array.isArray(source.attraction)
        ? source.attraction
        : []
  };
}

function personEditorPreferenceCategory(item){
  const category=item && item.category;
  if(!category || typeof category !== 'object'){
    return {
      key:'other',
      label:'其他'
    };
  }

  return {
    key:String(
      category.tuningId ||
      category.internalName ||
      category.localizedName ||
      'other'
    ),
    label:displayDataText(
      String(
        category.localizedName ||
        category.internalName ||
        '其他'
      ).trim() || '其他',
      currentSimEditorPerson()
    )
  };
}

function personEditorPreferenceName(item){
  if(!item || typeof item !== 'object')return '';

  return displayDataText(
    String(
      item.displayName ||
      item.localizedName ||
      item.internalName ||
      item.tuningId ||
      ''
    ).trim(),
    currentSimEditorPerson()
  );
}

function groupPersonEditorPreferences(items){
  const groups=new Map();

  (items || []).forEach(item=>{
    if(!item || typeof item !== 'object')return;

    const category=
      personEditorPreferenceCategory(item);

    if(!groups.has(category.key)){
      groups.set(category.key,{
        label:category.label,
        likes:[],
        dislikes:[]
      });
    }

    const name=
      personEditorPreferenceName(item);

    if(!name)return;

    const group=
      groups.get(category.key);

    const target=
      item.preference === 'dislike'
        ? group.dislikes
        : group.likes;

    if(!target.includes(name)){
      target.push(name);
    }
  });

  return [...groups.values()];
}

function personEditorPreferenceRowMarkup(label,items){
  if(!items.length)return '';

  return '<div class="game-preference-row">'+
    '<span class="game-preference-row-label">'+
      esc(label)+
    '</span>'+
    '<div class="game-preference-items">'+
      items
        .map(item=>
          '<span class="game-preference-chip">'+
            esc(item)+
          '</span>'
        )
        .join('')+
    '</div>'+
  '</div>';
}

function renderPersonEditorPreferences(tabName){
  const isAttraction=
    tabName === 'attraction';

  const data=
    personEditorPreferenceData();

  const items=
    isAttraction
      ? data.attraction
      : data.likesDislikes;

  const list=$(
    isAttraction
      ? 'attractionPreferenceList'
      : 'gamePreferenceList'
  );

  const empty=$(
    isAttraction
      ? 'attractionPreferenceEmpty'
      : 'gamePreferenceEmpty'
  );

  if(!list || !empty)return;

  const groups=
    groupPersonEditorPreferences(items);

  list.innerHTML=
    groups
      .map(group=>{
        const likeLabel=
          isAttraction
            ? '心動'
            : '喜歡';

        const dislikeLabel=
          isAttraction
            ? '反感'
            : '討厭';

        return '<section class="game-preference-category">'+
          '<div class="game-preference-category-title">'+
            esc(group.label)+
          '</div>'+
          personEditorPreferenceRowMarkup(
            likeLabel,
            group.likes
          )+
          personEditorPreferenceRowMarkup(
            dislikeLabel,
            group.dislikes
          )+
        '</section>';
      })
      .join('');

  empty.hidden=
    groups.length > 0;
}

function syncPersonEditorPreferenceTabs(sim){
  const data=
    personEditorPreferenceData(sim);

  const regularTab=
    document.querySelector(
      '.sim-editor-tab[data-editor-tab="preferences"]'
    );

  const attractionTab=
    document.querySelector(
      '.sim-editor-tab[data-editor-tab="attraction"]'
    );

  const regularPanel=
    document.querySelector(
      '.sim-editor-panel[data-editor-panel="preferences"]'
    );

  const attractionPanel=
    document.querySelector(
      '.sim-editor-panel[data-editor-panel="attraction"]'
    );

  const hasRegularData=
    !!sim &&
    (
      data.likesDislikes.length > 0 ||
      data.availability === 'available'
    );

  const hasAttractionData=
    !!sim &&
    data.attraction.length > 0;

  if(regularTab){
    regularTab.hidden=
      !hasRegularData;
  }

  if(attractionTab){
    attractionTab.hidden=
      !hasAttractionData;
  }

  if(!hasRegularData && regularPanel){
    regularPanel.hidden=true;
    regularPanel.classList.remove('active');
  }

  if(!hasAttractionData && attractionPanel){
    attractionPanel.hidden=true;
    attractionPanel.classList.remove('active');
  }
}

function addTraitFromEditor() {
  const input = $('traitInput');
  if (!input) return;
  const pieces = input.value.split(/[,，\n]+/).map(value => value.trim()).filter(Boolean);
  if (!pieces.length) return;
  pieces.forEach(value => {
    if (!simEditorState.traits.some(existing => existing.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      simEditorState.traits.push(value);
    }
  });
  input.value = '';
  renderTraitEditor();
  input.focus();
}

function buildPersonEditorDraft({
    copyMedia=true
  }={}){
    const existing=
      currentSimEditorPerson();
    const status=$('fStatus').value;

    return {
      ...(existing
        ? {
            gameData:
              existing.gameData
                ? JSON.parse(
                    JSON.stringify(
                      existing.gameData
                    )
                  )
                : undefined
          }
        : {}),
      id:simEditorState.simId||'__editor_preview__',
      name:$('fName').value.trim(),
      lifeStage:$('fStage').value,
      gender:$('fGender').value,
      status,
      race:$('fRace').value||'',
      birthdayYear:$('fBirthdayYear').value===''?null:Math.trunc(Number($('fBirthdayYear').value)),
      birthdayMonth:$('fBirthdayMonth').value?Number($('fBirthdayMonth').value):null,
      birthdayDay:$('fBirthdayDay').value?Number($('fBirthdayDay').value):null,
      age:$('fAge').value===''?null:Math.min(999,Math.max(0,Number($('fAge').value)||0)),
      residence:$('fResidence').value.trim(),
      aspiration:$('fAspiration').value.trim(),
      causeOfDeath:status==='已故'||status==='幽靈'?$('fCauseOfDeath').value.trim():'',
      traits:[...simEditorState.traits],
      career:$('fCareer').value.trim(),
      notes:$('fNotes').value.trim(),
      avatar:simEditorState.avatar||null,
      avatarFrame:normalizeAvatarFrame(simEditorState.avatarFrame),
      gameAvatar:simEditorState.gameAvatar||null,
      gameAvatarFrame:
        simEditorState.gameAvatar
          ? normalizeAvatarFrame(
              simEditorState.gameAvatarFrame
            )
          : null,
      customAvatar:simEditorState.customAvatar||null,
      customAvatarFrame:
        simEditorState.customAvatar
          ? normalizeAvatarFrame(
              simEditorState.customAvatarFrame
            )
          : null,
      avatarSource:simEditorState.avatarSource,
      pets:
        copyMedia
          ? JSON.parse(
              JSON.stringify(
                editingPets
              )
            )
          : editingPets,
      gallery:
        copyMedia
          ? JSON.parse(
              JSON.stringify(
                editingGallery
              )
            )
          : editingGallery
    };
  }

  function selectedEditorIds(selectId){
    return [...($(selectId)?.selectedOptions||[])]
      .map(option=>String(option.value||''))
      .filter(Boolean);
  }

  function editorSiblingIds(){
    return [...new Set([
      ...simEditorState.explicitSiblingIds,
      ...simEditorState.derivedSiblingIds
    ])]
      .filter(id =>
        id &&
        currentGenealogyData()?.sims?.[id]
      );
  }

  function editorRelationCandidate(
    simId
  ){
    return personEditorRelationCandidateById
      .get(
        String(simId||'')
      )||
      null;
  }

  function ensureEditorRelationNativeOption(
    selectId,
    simId
  ){
    const select=$(selectId);
    const id=String(simId||'');

    if(!select||!id)return null;

    let option=
      [...select.options]
        .find(item=>
          String(item.value)===id
        );

    if(option)return option;

    const candidate=
      editorRelationCandidate(id);

    if(!candidate)return null;

    option=
      document.createElement(
        'option'
      );

    option.value=id;
    option.textContent=
      candidate.label;

    select.appendChild(
      option
    );

    return option;
  }

  function replaceEditorRelationSelection(
    selectId,
    ids
  ){
    const select=$(selectId);
    if(!select)return;

    const selectedIds=[
      ...new Set(
        (ids||[])
          .map(String)
          .filter(Boolean)
      )
    ];

    const fragment=
      document.createDocumentFragment();

    selectedIds.forEach(id=>{
      const candidate=
        editorRelationCandidate(id);

      if(!candidate)return;

      const option=
        document.createElement(
          'option'
        );

      option.value=id;
      option.textContent=
        candidate.label;
      option.selected=true;

      fragment.appendChild(
        option
      );
    });

    select.replaceChildren(
      fragment
    );
  }

  function applyEditorSiblingStateToSelect(){
    const select=$('fSiblings');
    if(!select)return;

    const activeIds=[
      ...new Set([
        ...simEditorState.explicitSiblingIds,
        ...simEditorState.derivedSiblingIds
      ])
    ];

    activeIds.forEach(id=>{
      ensureEditorRelationNativeOption(
        'fSiblings',
        id
      );
    });

    [...select.options]
      .forEach(option=>{
        const siblingId=
          String(
            option.value||
            ''
          );

        if(!siblingId)return;

        const isExplicit=
          simEditorState.explicitSiblingIds
            .has(siblingId);

        const isDerived=
          simEditorState.derivedSiblingIds
            .has(siblingId);

        option.selected=
          isExplicit||
          isDerived;

        option.disabled=
          isDerived;

        if(isDerived){
          option.dataset.relationshipSource=
            'inferred';

          option.dataset.uiSelectNote=
            uiText(
              '由父母關係自動推導'
            );
        }else{
          delete option.dataset
            .relationshipSource;

          delete option.dataset
            .uiSelectNote;
        }
      });

    refreshEditorSelect('fSiblings');
  }

  function captureEditorExplicitSiblingSelection(){
    const select=$('fSiblings');
    if(!select)return;

    simEditorState.explicitSiblingIds=
      new Set(
        [...select.options]
          .filter(option=>
            option.selected&&
            !option.disabled
          )
          .map(option=>
            String(option.value||'')
          )
          .filter(Boolean)
      );
  }

  function syncEditorSiblingAuthority(){
    const relations=
      resolveSiblingRelationships(
        simEditorState.simId
          ? String(simEditorState.simId)
          : '',
        {
          parentIds:
            selectedEditorIds(
              'fParents'
            ),
          explicitIds:
            [...simEditorState.explicitSiblingIds]
        }
      );

    simEditorState.derivedSiblingIds=
      new Set(
        relations
          .filter(relation =>
            relation.derivedFromParents
          )
          .map(relation =>
            relation.targetId
          )
      );

    applyEditorSiblingStateToSelect();
  }

  function syncEditorRelationKindMap(selectId,kindMap){
    const selected=new Set(selectedEditorIds(selectId));

    [...kindMap.keys()].forEach(id=>{
      if(!selected.has(id))kindMap.delete(id);
    });

    selected.forEach(id=>{
      if(!kindMap.has(id))kindMap.set(id,'parent-child');
    });
  }

  // ========【家庭關係自訂標籤文字】 設定 - 直接整合於父母 / 配偶 / 子女等人物列 ========
  function editorFamilyLabelIdentity(role,targetId){
    if(role==='parent')return'parent-group';
    return String(role||'')+':'+String(targetId||'');
  }

  function editorFamilyAnnotationKey(role,targetId,subjectId=simEditorState.simId){
    const subject=String(subjectId||'');
    const target=String(targetId||'');

    if(!subject)return'';

    if(role==='parent'){
      return'parent:'+subject;
    }

    if(role==='child'&&target){
      return'parent:'+target;
    }

    if(role==='spouse'&&target){
      return'spouse:'+pairKey(subject,target);
    }

    if(role==='exspouse'&&target){
      return'exspouse:'+pairKey(subject,target);
    }

    if(role==='sibling'&&target){
      const link=(currentGenealogyData().links||[]).find(item=>
        item&&
        isSiblingLink(item)&&
        (
          (String(item.from)===subject&&String(item.to)===target)||
          (String(item.from)===target&&String(item.to)===subject)
        )
      );

      return link?.id
        ? 'link:'+String(link.id)
        : '';
    }

    return'';
  }

  function editorFamilySavedCustomText(role,targetId){
    const key=editorFamilyAnnotationKey(role,targetId);
    if(!key)return'';

    const saved=relationshipDisplayOverride(key);

    return typeof saved.text==='string'
      ? saved.text
      : '';
  }

  function editorFamilyDraftText(role,targetId){
    const identity=editorFamilyLabelIdentity(role,targetId);

    if(simEditorState.familyLabelDrafts.has(identity)){
      return simEditorState.familyLabelDrafts.get(identity)?.text||'';
    }

    return editorFamilySavedCustomText(role,targetId);
  }

  function editorFamilyLabelControlAvailable(role,targetId){
    if(role!=='sibling')return true;

    const target=String(targetId||'');

    return (
      simEditorState.explicitSiblingIds.has(target)||
      !!editorFamilyAnnotationKey('sibling',target)
    );
  }

  function editorFamilyLabelControlMarkup(role,targetId){
    if(!role||!editorFamilyLabelControlAvailable(role,targetId))return'';

    const identity=editorFamilyLabelIdentity(role,targetId);
    const value=editorFamilyDraftText(role,targetId);
    const hasValue=!!String(value||'').trim();

    return '<span class="family-rel-label-control" data-family-label-identity="'+esc(identity)+'" data-family-label-role="'+esc(role)+'" data-family-label-target="'+esc(String(targetId||''))+'">'+
      '<button class="family-rel-label-toggle" type="button" aria-expanded="'+(hasValue?'true':'false')+'"'+(hasValue?' hidden':'')+'>'+esc(uiText('自訂標籤文字'))+'</button>'+
      '<span class="family-rel-label-inline-editor"'+(hasValue?'':' hidden')+'>'+
        '<input class="family-rel-label-input" type="text" maxlength="40" placeholder="'+esc(uiText('輸入標籤文字'))+'" value="'+esc(value)+'">'+
        '<button class="family-rel-label-reset" type="button">'+esc(uiText('恢復預設'))+'</button>'+
      '</span>'+
    '</span>';
  }

  function syncFamilyLabelDraftInputs(identity,value){
    document.querySelectorAll('[data-family-label-identity]').forEach(control=>{
      if(control.dataset.familyLabelIdentity!==identity)return;
      const input=control.querySelector('.family-rel-label-input');
      if(input&&input.value!==value)input.value=value;
    });
  }

  function captureEditorFamilyLabelDrafts(target=document){
    target.querySelectorAll('[data-family-label-identity]').forEach(control=>{
      const input=control.querySelector('.family-rel-label-input');
      if(!input)return;

      const identity=control.dataset.familyLabelIdentity||'';
      const role=control.dataset.familyLabelRole||'';
      const targetId=control.dataset.familyLabelTarget||'';

      if(!identity)return;

      simEditorState.familyLabelDrafts.set(identity,{
        role,
        targetId,
        text:input.value
      });
    });
  }

  function bindEditorFamilyLabelControls(target){
    target.querySelectorAll('.family-rel-label-toggle').forEach(button=>{
      button.addEventListener('click',()=>{
        const control=button.closest('[data-family-label-identity]');
        const editor=control?.querySelector('.family-rel-label-inline-editor');
        if(!editor)return;

        editor.hidden=false;
        button.hidden=true;
        button.setAttribute('aria-expanded','true');

        editor.querySelector('.family-rel-label-input')?.focus({preventScroll:true});
      });
    });

    target.querySelectorAll('.family-rel-label-input').forEach(input=>{
      input.addEventListener('input',()=>{
        const control=input.closest('[data-family-label-identity]');
        if(!control)return;

        const identity=control.dataset.familyLabelIdentity||'';
        const role=control.dataset.familyLabelRole||'';
        const targetId=control.dataset.familyLabelTarget||'';

        simEditorState.familyLabelDrafts.set(identity,{
          role,
          targetId,
          text:input.value
        });

        syncFamilyLabelDraftInputs(identity,input.value);
      });

      input.addEventListener('keydown',event=>{
        if(event.key!=='Escape')return;

        const control=input.closest('[data-family-label-identity]');
        const editor=control?.querySelector('.family-rel-label-inline-editor');
        const button=control?.querySelector('.family-rel-label-toggle');

        if(editor)editor.hidden=true;

        if(button){
          button.hidden=false;
          button.setAttribute('aria-expanded','false');
          button.focus({preventScroll:true});
        }
      });
    });

    target.querySelectorAll('.family-rel-label-reset').forEach(button=>{
      button.addEventListener('click',()=>{
        const control=button.closest('[data-family-label-identity]');
        if(!control)return;

        const identity=control.dataset.familyLabelIdentity||'';
        const role=control.dataset.familyLabelRole||'';
        const targetId=control.dataset.familyLabelTarget||'';
        const input=control.querySelector('.family-rel-label-input');

        simEditorState.familyLabelDrafts.set(identity,{
          role,
          targetId,
          text:''
        });

        if(input)input.value='';
        syncFamilyLabelDraftInputs(identity,'');
        input?.focus({preventScroll:true});
      });
    });
  }

  function editorFamilyRelationExists(role,targetId,subjectId){
    const subject=String(subjectId||'');
    const target=String(targetId||'');
    const sim=currentGenealogyData().sims[subject];

    if(!sim)return false;

    if(role==='parent'){
      return genealogyParentRelations(sim).length>0;
    }

    if(role==='child'){
      const child=currentGenealogyData().sims[target];
      return !!child&&genealogyParentRelations(child).some(relation=>String(relation.parentId)===subject);
    }

    if(role==='spouse'){
      return (sim.spouseIds||[]).map(String).includes(target);
    }

    if(role==='exspouse'){
      return (sim.exSpouseIds||[]).map(String).includes(target);
    }

    if(role==='sibling'){
      return resolveSiblingRelationships(subject).some(relation=>String(relation.targetId)===target);
    }

    return false;
  }

  function applyEditorFamilyLabelDrafts(savedSimId,mutation){
    let result=mutation;

    simEditorState.familyLabelDrafts.forEach(draft=>{
      if(!draft||!editorFamilyRelationExists(draft.role,draft.targetId,savedSimId))return;

      const key=editorFamilyAnnotationKey(draft.role,draft.targetId,savedSimId);
      if(!key)return;

      const saved=relationshipDisplayOverride(key);

      result=genealogyStoreAuthority.mergeResults(
        result,
        genealogyStoreAuthority.setRelationshipAnnotation(
          key,
          {
            text:String(draft.text||'').trim(),
            hidden:saved.hidden===true
          }
        )
      );
    });

    return result;
  }

  function relationPersonMarkup(sim,relationLabel='',customDisplayText=''){
    if(!sim)return'';

    const name=displayDataText(sim.name,sim);
    const avatar=framedAvatarImageHTML(sim.avatar,sim.avatarFrame)||esc((name||'?').charAt(0));
    const customText=String(customDisplayText||'').trim();

    return '<span class="family-rel-person">'+
      '<span class="family-rel-person-avatar">'+avatar+'</span>'+
      '<span class="family-rel-person-copy">'+
        '<span class="family-rel-person-name">'+esc(name)+'</span>'+
        (relationLabel
          ? '<span class="family-rel-person-kinship">'+esc(displayRelationshipText(relationLabel))+'</span>'
          : '')+
        (customText
          ? '<span class="family-rel-person-custom">'+esc(uiText('標籤文字：'))+esc(customText)+'</span>'
          : '')+
      '</span>'+
    '</span>';
  }

  function familyEditorKeyForRole(role){
    if(role==='parent')return'parents';
    if(role==='child')return'children';
    if(role==='spouse')return'spouse';
    if(role==='exspouse')return'exspouse';
    if(role==='sibling')return'siblings';
    return'';
  }

  function familyRelationEditMode(role){
    const key=familyEditorKeyForRole(role);
    if(!key)return false;

    const panel=document.querySelector('[data-family-editor-edit="'+key+'"]');
    return !!panel&&!panel.hidden;
  }

  function familyRelationCanRemove(role,targetId){
    if(role!=='sibling')return true;

    const target=String(targetId||'');
    return (
      simEditorState.explicitSiblingIds.has(target)&&
      !simEditorState.derivedSiblingIds.has(target)
    );
  }

  function removeEditorFamilyRelation(role,targetId){
    const target=String(targetId||'');
    if(!target)return;

    const selectId={
      parent:'fParents',
      child:'fChildren',
      spouse:'fSpouse',
      exspouse:'fExSpouse',
      sibling:'fSiblings'
    }[role];

    const select=$(selectId);
    if(!select)return;

    const option=[...select.options].find(item=>String(item.value)===target);
    if(option&&!option.disabled){
      option.selected=false;
    }

    if(role==='parent'){
      simEditorState.parentKinds.delete(target);
      syncEditorSiblingAuthority();
    }

    if(role==='child'){
      simEditorState.childKinds.delete(target);
    }

    if(role==='sibling'){
      simEditorState.explicitSiblingIds.delete(target);
      syncEditorSiblingAuthority();
    }

    refreshEditorSelect(selectId);
    renderPersonEditorFamilyPreviews();
    renderPersonEditorInfoPreviewIfActive();
  }

  function editorFamilyRemoveButtonMarkup(role,targetId){
    const target=String(targetId||'');

    if(!familyRelationCanRemove(role,target))return'<span class="family-rel-remove-spacer" aria-hidden="true"></span>';

    return '<button class="family-rel-remove" type="button" data-family-rel-remove-role="'+esc(role)+'" data-family-rel-remove-id="'+esc(target)+'" aria-label="'+esc(uiText('移除'))+'" title="'+esc(uiText('移除'))+'">'+
      iconSvg('x-lg')+
    '</button>';
  }

  function editorFamilyRelationActionsMarkup(role,targetId){
    if(!familyRelationEditMode(role))return'';

    const target=String(targetId||'');
    const pieces=[];

    if(role==='parent'||role==='child'){
      const kindMap=
        role==='parent'
          ? simEditorState.parentKinds
          : simEditorState.childKinds;
      const kind=kindMap.get(target)||'parent-child';

      pieces.push(
        '<select class="family-rel-kind-select" data-ui-compact="true" data-ui-popover-match-width="true" data-editor-relation-kind="'+esc(role)+'" data-editor-relation-id="'+esc(target)+'" aria-label="'+esc(uiText('關係種類'))+'">'+
          '<option value="parent-child"'+(kind==='parent-child'?' selected':'')+'>'+esc(uiText('親生'))+'</option>'+
          '<option value="adoptive"'+(kind==='adoptive'?' selected':'')+'>'+esc(uiText('收養'))+'</option>'+
        '</select>'
      );
    }

    if(editorFamilyLabelControlAvailable(role,target)){
      pieces.push(
        editorFamilyLabelControlMarkup(
          role,
          target
        )
      );
    }

    return pieces.length
      ? '<div class="family-rel-row-actions">'+pieces.join('')+'</div>'
      : '';
  }

  function bindEditorFamilyRelationControls(target){
    bindEditorFamilyLabelControls(target);

    target.querySelectorAll('[data-editor-relation-kind]').forEach(select=>{
      select.addEventListener('change',()=>{
        const id=select.dataset.editorRelationId;
        const targetMap=select.dataset.editorRelationKind==='parent'
          ? simEditorState.parentKinds
          : simEditorState.childKinds;

        targetMap.set(
          id,
          select.value==='adoptive'
            ? 'adoptive'
            : 'parent-child'
        );

        renderPersonEditorFamilyPreviews();
        renderPersonEditorInfoPreviewIfActive();
      });
    });

    target.querySelectorAll('[data-family-rel-remove-role]').forEach(button=>{
      button.addEventListener('click',()=>{
        removeEditorFamilyRelation(
          button.dataset.familyRelRemoveRole,
          button.dataset.familyRelRemoveId
        );
      });
    });
  }

  function renderEditorRelationPeople(
    targetId,
    ids,
    labelResolver=null,
    emptyText='—',
    role='',
    draft=null
  ){
    const target=$(targetId);
    if(!target)return;

    const unique=[...new Set((ids||[]).map(String).filter(Boolean))];
    const editing=!!role&&familyRelationEditMode(role);

    target.classList.toggle('family-rel-preview-editable',editing);

    if(!unique.length){
      target.innerHTML=`<span class="family-rel-empty">${esc(uiText(emptyText))}</span>`;
      return;
    }

    const relationDraft=
      draft||
      buildPersonEditorDraft({
        copyMedia:false
      });

    target.innerHTML=unique.map(id=>{
      const sim=currentGenealogyData().sims[id];
      if(!sim)return'';

      const label=typeof labelResolver==='function'
        ? labelResolver(
            sim,
            relationDraft
          )
        : '';

      if(!role){
        return relationPersonMarkup(sim,label);
      }

      const customDisplayText=
        role
          ? editorFamilyDraftText(role,id)
          : '';

      return '<div class="family-rel-preview-row'+(editing?' is-editing':'')+'">'+
        (editing
          ? editorFamilyRemoveButtonMarkup(role,id)
          : '')+
        relationPersonMarkup(
          sim,
          label,
          editing
            ? ''
            : customDisplayText
        )+
        (editing
          ? editorFamilyRelationActionsMarkup(role,id)
          : '')+
      '</div>';
    }).join('')||`<span class="family-rel-empty">${esc(uiText(emptyText))}</span>`;

    if(editing){
      bindEditorFamilyRelationControls(target);
    }
  }

  function renderPersonEditorFamilyPreviews(){
    const familyTarget=$('editorFamilyMembershipPreview');

    if(familyTarget){
      const names=selectedEditorIds('fFamilyIds')
        .map(id=>currentGenealogyData().families.find(family=>String(family.id)===id))
        .filter(Boolean)
        .map(family=>displayDataText(family.name,family));

      familyTarget.innerHTML=names.length
        ? names.map(name=>
            '<span class="family-rel-person family-rel-family">'+
              '<span class="family-rel-person-avatar">'+iconSvg('people')+'</span>'+
              '<span class="family-rel-person-name">'+esc(name)+'</span>'+
            '</span>'
          ).join('')
        : '<span class="family-rel-empty">—</span>';
    }

    syncEditorRelationKindMap('fParents',simEditorState.parentKinds);
    syncEditorRelationKindMap('fChildren',simEditorState.childKinds);

    const relationshipDraft=
      buildPersonEditorDraft({
        copyMedia:false
      });

    renderEditorRelationPeople(
      'editorParentsPreview',
      selectedEditorIds('fParents'),
      (sim,draft)=>directFamilyKinshipLabel(
        'parent',
        sim,
        draft,
        simEditorState.parentKinds.get(String(sim.id))||'parent-child'
      ),
      '—',
      'parent',
      relationshipDraft
    );

    renderEditorRelationPeople(
      'editorSpousePreview',
      selectedEditorIds('fSpouse'),
      (sim,draft)=>directFamilyKinshipLabel(
        'spouse',
        sim,
        draft
      ),
      '—',
      'spouse',
      relationshipDraft
    );

    renderEditorRelationPeople(
      'editorExSpousePreview',
      selectedEditorIds('fExSpouse'),
      (sim,draft)=>directFamilyKinshipLabel(
        'exspouse',
        sim,
        draft
      ),
      '—',
      'exspouse',
      relationshipDraft
    );

    renderEditorRelationPeople(
      'editorChildrenPreview',
      selectedEditorIds('fChildren'),
      (sim,draft)=>directFamilyKinshipLabel(
        'child',
        sim,
        draft,
        simEditorState.childKinds.get(String(sim.id))||'parent-child'
      ),
      '—',
      'child',
      relationshipDraft
    );

    renderEditorRelationPeople(
      'editorSiblingsPreview',
      editorSiblingIds(),
      (sim,draft)=>directFamilyKinshipLabel(
        'sibling',
        sim,
        draft
      ),
      '—',
      'sibling',
      relationshipDraft
    );
  }

  function buildEditorFamilyRelationshipRows(draft){
    const groups=new Map();

    const add=(label,sim)=>{
      if(!label||!sim)return;
      if(!groups.has(label))groups.set(label,[]);
      groups.get(label).push(displayDataText(sim.name,sim));
    };

    selectedEditorIds('fParents').forEach(id=>{
      const sim=currentGenealogyData().sims[id];
      add(
        directFamilyKinshipLabel(
          'parent',
          sim,
          draft,
          simEditorState.parentKinds.get(id)||'parent-child'
        ),
        sim
      );
    });

    selectedEditorIds('fSpouse').forEach(id=>{
      const sim=currentGenealogyData().sims[id];
      add(directFamilyKinshipLabel('spouse',sim,draft),sim);
    });

    selectedEditorIds('fExSpouse').forEach(id=>{
      const sim=currentGenealogyData().sims[id];
      add(directFamilyKinshipLabel('exspouse',sim,draft),sim);
    });

    selectedEditorIds('fChildren').forEach(id=>{
      const sim=currentGenealogyData().sims[id];
      add(
        directFamilyKinshipLabel(
          'child',
          sim,
          draft,
          simEditorState.childKinds.get(id)||'parent-child'
        ),
        sim
      );
    });

    editorSiblingIds().forEach(id=>{
      const sim=currentGenealogyData().sims[id];
      add(directFamilyKinshipLabel('sibling',sim,draft),sim);
    });

    return [...groups.entries()].map(([label,names])=>({
      label,
      names:[...new Set(names)]
    }));
  }

  function renderEditorInfoPreview(){
    const target=$('editorInfoPreview');
    if(!target)return;

    const draft=buildPersonEditorDraft();

    const familyNames=selectedEditorIds('fFamilyIds')
      .map(id=>currentGenealogyData().families.find(family=>String(family.id)===id))
      .filter(family=>family&&!family.gameImport)
      .map(family=>displayDataText(family.name,family));

    renderPersonProfileContent(target,draft,{
      draft:true,
      familyNames,
      familyRelationshipRows:buildEditorFamilyRelationshipRows(draft),
      otherRelationshipRows:simEditorState.simId
        ? profileOtherRelationshipRows(simEditorState.simId)
        : [],
      generationLabel:simEditorState.simId
        ? getSimGenerationLabel(simEditorState.simId,currentFamily())
        : '',
      onGallery:index=>lifePhotoWorkspace.openDraftViewer(index)
    });
  }

  function renderPersonEditorInfoPreviewIfActive(){
    if(mask.classList.contains('preview-open')){
      renderEditorInfoPreview();
    }
  }

  function switchEditorTab(tabName='basic'){
    ensurePersonEditorTabUi(
      tabName
    );

    const tabs=[...document.querySelectorAll('.sim-editor-tab[data-editor-tab]')]
      .filter(tab=>!tab.hidden);
    const panels=[...document.querySelectorAll('.sim-editor-panel[data-editor-panel]')];

    if(!tabs.some(tab=>tab.dataset.editorTab===tabName)){
      tabName='basic';
    }

    tabs.forEach(tab=>{
      const active=tab.dataset.editorTab===tabName;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
      tab.tabIndex=active?0:-1;
    });

    panels.forEach(panel=>{
      const active=panel.dataset.editorPanel===tabName;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });

    const content=document.querySelector('.sim-editor-content');
    if(content)content.scrollTop=0;
  }

  function openEditorPreviewSheet(){
    const sheet=$('simEditorPreviewSheet');
    if(!sheet)return;

    initializePersonEditorRelationshipUi();
    initializePersonEditorMediaDraft();
    renderEditorInfoPreview();
    mask.classList.add('preview-open');
    sheet.removeAttribute('inert');
    sheet.setAttribute('aria-hidden','false');
    sheet.scrollTop=0;
  }

  function closeEditorPreviewSheet(){
    const sheet=$('simEditorPreviewSheet');
    if(!sheet)return;

    mask.classList.remove('preview-open');
    sheet.setAttribute('aria-hidden','true');
    sheet.setAttribute('inert','');
  }

  function syncEditorPreviewSheetGeometry(){
    const modal=document.querySelector('.sim-editor-modal');
    if(!modal||!mask.classList.contains('show'))return;

    const rect=modal.getBoundingClientRect();

    if(rect.width>0){
      mask.style.setProperty(
        '--sim-editor-sheet-width',
        rect.width.toFixed(2)+'px'
      );
    }

    if(rect.height>0){
      mask.style.setProperty(
        '--sim-editor-sheet-height',
        rect.height.toFixed(2)+'px'
      );
    }

    if(rect.width>0&&rect.height>0){
      mask.classList.add('sheet-ready');
    }
  }

  function familyEditorToggleDefaultLabel(button){
    return button?.dataset.familyEditorToggle==='family-membership'
      ? '管理'
      : '編輯';
  }

  function syncFamilyEditorToggleButton(button,expanded){
    if(!button)return;

    button.setAttribute(
      'aria-expanded',
      expanded?'true':'false'
    );

    button.textContent=uiText(
      expanded
        ? '完成'
        : familyEditorToggleDefaultLabel(button)
    );
  }

  function resetEditorFamilyPanels(){
    document.querySelectorAll('[data-family-editor-edit]').forEach(panel=>{
      panel.hidden=true;
    });

    document.querySelectorAll('[data-family-editor-toggle]').forEach(button=>{
      syncFamilyEditorToggleButton(button,false);
    });
  }

  function setupPersonEditorInteractions(){
    $('simEditorPreviewBtn')?.addEventListener('click',openEditorPreviewSheet);
    $('simEditorPreviewBackBtn')?.addEventListener('click',closeEditorPreviewSheet);

    document.querySelectorAll('.sim-editor-tab[data-editor-tab]').forEach(tab=>{
      tab.addEventListener('click',()=>switchEditorTab(tab.dataset.editorTab));

      tab.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;

        const tabs=[...document.querySelectorAll('.sim-editor-tab[data-editor-tab]')]
      .filter(tab=>!tab.hidden);
        const index=tabs.indexOf(tab);
        if(index<0)return;

        event.preventDefault();

        let nextIndex=index;
        if(event.key==='ArrowLeft')nextIndex=(index-1+tabs.length)%tabs.length;
        if(event.key==='ArrowRight')nextIndex=(index+1)%tabs.length;
        if(event.key==='Home')nextIndex=0;
        if(event.key==='End')nextIndex=tabs.length-1;

        switchEditorTab(tabs[nextIndex].dataset.editorTab);
        tabs[nextIndex].focus();
      });
    });

    $('traitAddBtn')?.addEventListener('click',addTraitFromEditor);

    $('traitInput')?.addEventListener('keydown',event=>{
      if(event.key!=='Enter')return;
      event.preventDefault();
      addTraitFromEditor();
    });

    $('fBirthdayMonth')?.addEventListener('change',()=>{
      populatePersonEditorBirthdayDays($('fBirthdayDay')?.value||'');
    });

    ['fFamilyIds','fParents','fSpouse','fExSpouse','fChildren','fSiblings'].forEach(id=>{
      $(id)?.addEventListener('change',()=>{
        if(id==='fParents'){
          syncEditorRelationKindMap('fParents',simEditorState.parentKinds);
          syncEditorSiblingAuthority();
        }
        if(id==='fChildren'){
          syncEditorRelationKindMap('fChildren',simEditorState.childKinds);
        }
        if(id==='fSiblings'){
          captureEditorExplicitSiblingSelection();
          syncEditorSiblingAuthority();
        }

        renderPersonEditorFamilyPreviews();
        renderPersonEditorInfoPreviewIfActive();
      });
    });

    document.querySelectorAll('[data-family-editor-toggle]').forEach(button=>{
      button.addEventListener('click',()=>{
        const key=button.dataset.familyEditorToggle;
        const panel=document.querySelector(`[data-family-editor-edit="${key}"]`);
        if(!panel)return;

        const willOpen=panel.hidden;

        captureEditorFamilyLabelDrafts();

        document.querySelectorAll('[data-family-editor-edit]').forEach(other=>{
          if(other!==panel)other.hidden=true;
        });

        document.querySelectorAll('[data-family-editor-toggle]').forEach(other=>{
          syncFamilyEditorToggleButton(other,false);
        });

        panel.hidden=!willOpen;
        syncFamilyEditorToggleButton(button,willOpen);
        renderPersonEditorFamilyPreviews();

        if(willOpen){
          panel.querySelector('.ui-select-input')?.focus({preventScroll:true});
        }
      });
    });

    $('otherRelationshipEditToggle')?.addEventListener('click',()=>{
      const panel=$('otherRelationshipEditPanel');
      if(!panel)return;

      captureOtherRelationshipAnnotationDrafts();

      const willOpen=panel.hidden;

      panel.hidden=!willOpen;
      syncOtherRelationshipEditorToggle(willOpen);

      const person=
        currentSimEditorPerson();

      renderPersonEditorRelationshipList(
        person
      );

      if(willOpen){
        panel
          .querySelector(
            '.ui-select-input'
          )
          ?.focus({
            preventScroll:true
          });
      }
    });

    const editorModal=document.querySelector('.sim-editor-modal');

    editorModal?.addEventListener('input',()=>{
      renderPersonEditorInfoPreviewIfActive();
    });

    editorModal?.addEventListener('change',()=>{
      renderPersonEditorInfoPreviewIfActive();
    });
  }


  function collectPersonEditorDescendantIds(
    allSims,
    ancestorId
  ){
    const ancestor=String(ancestorId||'');
    const descendants=new Set();

    if(!ancestor)return descendants;

    const childrenByParent=new Map();

    (allSims||[]).forEach(child=>{
      genealogyParentRelations(child)
        .forEach(relation=>{
          const parentId=
            String(
              relation.parentId||
              ''
            );

          const childId=
            String(
              child?.id||
              ''
            );

          if(!parentId||!childId)return;

          if(
            !childrenByParent.has(
              parentId
            )
          ){
            childrenByParent.set(
              parentId,
              []
            );
          }

          childrenByParent
            .get(parentId)
            .push(childId);
        });
    });

    const queue=[
      ...(childrenByParent.get(ancestor)||[])
    ];

    for(
      let index=0;
      index<queue.length;
      index+=1
    ){
      const id=
        String(
          queue[index]||
          ''
        );

      if(
        !id||
        descendants.has(id)
      ){
        continue;
      }

      descendants.add(id);

      (
        childrenByParent.get(id)||
        []
      ).forEach(childId=>{
        if(!descendants.has(childId)){
          queue.push(childId);
        }
      });
    }

    return descendants;
  }

  function preparePersonEditorRelationshipData(){
    if(personEditorRelationshipDataReady){
      return;
    }

    const sim=
      currentSimEditorPerson();

    const db=
      currentGenealogyData();

    const allSims=
      Object.values(
        db.sims
      );

    personEditorRelationshipAuthority=
      sim
        ? resolveDirectFamilyRelationships(
            sim.id
          )
        : null;

    personEditorRelationCandidates=
      allSims
        .filter(candidate=>
          !sim||
          String(candidate.id)!==
          String(sim.id)
        )
        .map(candidate=>({
          value:String(candidate.id),
          label:displayDataText(
            candidate.name,
            candidate
          )
        }));

    personEditorRelationCandidateById=
      new Map(
        personEditorRelationCandidates
          .map(candidate=>[
            candidate.value,
            candidate
          ])
      );

    const descendantIds=
      sim
        ? collectPersonEditorDescendantIds(
            allSims,
            sim.id
          )
        : new Set();

    personEditorParentCandidateIds=
      new Set(
        personEditorRelationCandidates
          .map(candidate=>
            candidate.value
          )
          .filter(id=>
            !descendantIds.has(id)
          )
      );

    personEditorRelationshipDataReady=true;
  }

  function personEditorRelationshipOptionProvider({
    selectId
  }={}){
    preparePersonEditorRelationshipData();

    if(selectId==='fParents'){
      return personEditorRelationCandidates
        .filter(candidate=>
          personEditorParentCandidateIds
            .has(candidate.value)
        );
    }

    return personEditorRelationCandidates;
  }

  function schedulePersonEditorRelationshipWarmup(){
    const sessionVersion=
      personEditorSessionVersion;

    const run=()=>{
      personEditorWarmupHandle=null;
      personEditorWarmupMode='';

      if(
        sessionVersion!==
        personEditorSessionVersion||
        !mask.classList.contains('show')
      ){
        return;
      }

      preparePersonEditorRelationshipData();
    };

    if(
      typeof global.requestIdleCallback===
      'function'
    ){
      personEditorWarmupMode='idle';
      personEditorWarmupHandle=
        global.requestIdleCallback(
          run,
          {
            timeout:250
          }
        );
    }else{
      personEditorWarmupMode='timeout';
      personEditorWarmupHandle=
        global.setTimeout(
          run,
          80
        );
    }
  }

  function initializePersonEditorRelationshipUi(){
    if(personEditorRelationshipUiReady)return;

    preparePersonEditorRelationshipData();

    const sim=
      currentSimEditorPerson();

    const db=
      currentGenealogyData();

    const familyAuthority=
      personEditorRelationshipAuthority;

    $('fFamilyIds').innerHTML=
      db.families
        .map(family=>
          `<option value="${family.id}">${esc(displayDataText(family.name,family))}</option>`
        )
        .join('');

    const currentFamilies=
      new Set();

    if(sim){
      db.families.forEach(family=>{
        if(
          family.memberIds.includes(
            sim.id
          )
        ){
          currentFamilies.add(
            String(family.id)
          );
        }
      });
    }else if(db.currentFamilyId){
      currentFamilies.add(
        String(db.currentFamilyId)
      );
    }

    [...$('fFamilyIds').options]
      .forEach(option=>{
        option.selected=
          currentFamilies.has(
            String(option.value)
          );
      });

    simEditorState.parentKinds=
      new Map();

    if(familyAuthority){
      familyAuthority.parents
        .forEach(relation=>{
          simEditorState.parentKinds.set(
            relation.targetId,
            relation.kind
          );
        });
    }

    replaceEditorRelationSelection(
      'fParents',
      [...simEditorState.parentKinds.keys()]
    );

    replaceEditorRelationSelection(
      'fSpouse',
      familyAuthority
        ? familyAuthority.spouses
            .map(relation=>
              relation.targetId
            )
        : []
    );

    replaceEditorRelationSelection(
      'fExSpouse',
      familyAuthority
        ? familyAuthority.exSpouses
            .map(relation=>
              relation.targetId
            )
        : []
    );

    const childRelations=
      familyAuthority
        ? familyAuthority.children
            .map(relation=>({
              childId:
                relation.targetId,
              kind:
                relation.kind
            }))
        : [];

    simEditorState.childKinds=
      new Map(
        childRelations
          .map(relation=>[
            relation.childId,
            relation.kind
          ])
      );

    replaceEditorRelationSelection(
      'fChildren',
      [...simEditorState.childKinds.keys()]
    );

    simEditorState.explicitSiblingIds=
      new Set(
        familyAuthority
          ? familyAuthority.siblings
              .filter(relation=>
                relation.storedExplicit
              )
              .map(relation=>
                relation.targetId
              )
          : []
      );

    simEditorState.derivedSiblingIds=
      new Set(
        familyAuthority
          ? familyAuthority.siblings
              .filter(relation=>
                relation.derivedFromParents
              )
              .map(relation=>
                relation.targetId
              )
          : []
      );

    replaceEditorRelationSelection(
      'fSiblings',
      [
        ...simEditorState.explicitSiblingIds,
        ...simEditorState.derivedSiblingIds
      ]
    );

    applyEditorSiblingStateToSelect();

    // 其他關係目標不需要預先建立整份人物 option。
    $('relationshipTarget').replaceChildren();

    resetOtherRelationshipEditor();
    populateRelationshipTypePicker();
    renderPersonEditorRelationshipList(
      sim
    );

    [
      'fFamilyIds',
      'fParents',
      'fSpouse',
      'fExSpouse',
      'fChildren',
      'relationshipTarget'
    ].forEach(
      refreshEditorSelect
    );

    resetEditorFamilyPanels();

    personEditorRelationshipUiReady=true;

    renderPersonEditorFamilyPreviews();
  }

  function initializePersonEditorMediaDraft(){
    if(personEditorMediaDraftReady)return;

    const sim=
      currentSimEditorPerson();

    replaceDraftCollection(
      editingPets,
      sim
        ? JSON.parse(
            JSON.stringify(
              sim.pets||[]
            )
          )
        : []
    );

    replaceDraftCollection(
      editingGallery,
      sim
        ? JSON.parse(
            JSON.stringify(
              sim.gallery||[]
            )
          )
        : []
    );

    personEditorMediaDraftReady=true;
  }

  function initializePersonEditorMediaUi(){
    if(personEditorMediaUiReady)return;

    initializePersonEditorMediaDraft();

    personEditorMediaUiReady=true;

    renderPetDraftList();
    lifePhotoWorkspace.renderList();
  }

  function ensurePersonEditorTabUi(
    tabName
  ){
    if(
      tabName==='family'||
      tabName==='relations'
    ){
      initializePersonEditorRelationshipUi();
    }

    if(
      tabName==='preferences'||
      tabName==='attraction'
    ){
      renderPersonEditorPreferences(
        tabName
      );
    }

    if(tabName==='media'){
      initializePersonEditorMediaUi();
    }
  }

  function openPersonEditor(id){
    resetPersonEditorDraftState();

    simEditorState.simId=
      id || null;

    const sim=
      id
        ? currentGenealogyData().sims[id]
        : null;

    $('modalTitle').textContent=
      sim
        ? uiText('編輯模擬市民')
        : uiText('新增模擬市民');

    $('fName').value=
      sim
        ? displayDataText(
            sim.name,
            sim
          )
        : '';

    $('fStage').value=
      sim
        ? sim.lifeStage
        : '成年';

    $('fGender').value=
      sim
        ? (sim.gender||'男')
        : '男';

    $('fStatus').value=
      sim
        ? (sim.status||'在世')
        : '在世';

    $('fRace').value=
      sim
        ? (sim.race||'')
        : '';

    $('fBirthdayYear').value=
      sim&&sim.birthdayYear!=null
        ? String(sim.birthdayYear)
        : '';

    $('fBirthdayMonth').value=
      sim&&sim.birthdayMonth
        ? String(sim.birthdayMonth)
        : '';

    populatePersonEditorBirthdayDays(
      sim&&sim.birthdayDay
        ? sim.birthdayDay
        : ''
    );

    $('fAge').value=
      sim&&sim.age!=null
        ? String(sim.age)
        : '';

    $('fResidence').value=
      sim
        ? displayDataText(
            sim.residence,
            sim
          )
        : '';

    $('fAspiration').value=
      sim
        ? displayDataText(
            sim.aspiration,
            sim
          )
        : '';

    $('fCauseOfDeath').value=
      sim
        ? displayDataText(
            sim.causeOfDeath,
            sim
          )
        : '';

    simEditorState.traits=
      sim
        ? (sim.traits||[])
            .map(value=>
              displayDataText(
                value,
                sim
              )
            )
        : [];

    renderTraitEditor();

    if($('traitInput')){
      $('traitInput').value='';
    }

    $('fCareer').value=
      sim
        ? displayDataText(
            sim.career,
            sim
          )
        : '';

    $('fNotes').value=
      sim
        ? displayDataText(
            sim.notes,
            sim
          )
        : '';

    simEditorState.gameAvatar=
      sim
        ? (sim.gameAvatar||null)
        : null;

    simEditorState.gameAvatarFrame=
      normalizeAvatarFrame(
        sim?.gameAvatarFrame
      );

    simEditorState.customAvatar=
      sim
        ? (sim.customAvatar||null)
        : null;

    simEditorState.customAvatarFrame=
      normalizeAvatarFrame(
        sim?.customAvatarFrame
      );

    simEditorState.avatarSource=
      sim?.avatarSource === 'game'
        ? 'game'
        : 'custom';

    syncPersonEditorActiveAvatar();
    renderPersonEditorAvatarPreview();

    // 人生照片與寵物的草稿資料也延遲到真正需要時才建立。
    syncPersonEditorCauseOfDeathVisibility();
    closeEditorPreviewSheet();

    // 只有目前可見的基本資料控制需要立即同步。
    [
      'fStage',
      'fGender',
      'fStatus',
      'fRace',
      'fBirthdayMonth',
      'fBirthdayDay',
      'fAspiration',
      'fCauseOfDeath'
    ].forEach(
      refreshEditorSelect
    );

    syncPersonEditorPreferenceTabs(
      sim
    );

    switchEditorTab('basic');

    $('btnDelete').style.display=
      sim
        ? ''
        : 'none';

    $('relationshipSection').style.display=
      sim
        ? ''
        : 'none';

    const newRelHint=
      $('newSimRelationshipsHint');

    if(newRelHint){
      newRelHint.hidden=!!sim;
    }

    mask.classList.remove(
      'sheet-ready'
    );

    mask.classList.add(
      'show'
    );

    requestAnimationFrame(()=>{
      syncEditorPreviewSheetGeometry();
      schedulePersonEditorRelationshipWarmup();
    });

    requestAnimationFrame(()=>{
      mask
        .querySelector('.sim-editor-modal')
        ?.focus({
          preventScroll:true
        });
    });
  }

  function closePersonEditor() {
  closeEditorPreviewSheet();

  mask.classList.remove(
    'show'
  );
  mask.classList.remove('sheet-ready');

  if (
    avatarCropDialog
      ?.classList
      .contains('show')
  ) {
    closeAvatarCropEditor();
  }

  resetPersonEditorDraftState();

  petEditorDialog.classList.remove(
    'show'
  );

  petEditorState.index = -1;
  petEditorState.avatar = null;
  petEditorState.avatarFrame = {
    ...DEFAULT_AVATAR_FRAME
  };
  petEditorState.traits = [];

  lifePhotoEditorDialog.classList.remove(
    'show'
  );

  lifePhotoState.editor.index = -1;
  lifePhotoState.editor.imageRef = '';
  lifePhotoState.editor.sizeKB = 0;
  lifePhotoState.editor.isOriginal = false;
}

// ========【其他關係編輯列】 設定 - 與家庭關係共用單層人物列，不再拆成獨立標籤區 ========
function personEditorOtherRelationships(simId){
  const id=String(simId||'');
  if(!id)return[];

  return (currentGenealogyData().links||[])
    .filter(link=>
      link&&
      !isSiblingLink(link)&&
      (
        String(link.from)===id||
        String(link.to)===id
      )
    );
}

function otherRelationshipEditMode(){
  const panel=$('otherRelationshipEditPanel');
  return !!panel&&!panel.hidden;
}

function syncOtherRelationshipEditorToggle(expanded){
  const button=$('otherRelationshipEditToggle');
  if(!button)return;

  button.setAttribute(
    'aria-expanded',
    expanded?'true':'false'
  );

  button.textContent=uiText(
    expanded
      ? '完成'
      : '編輯'
  );
}

function resetOtherRelationshipEditor(){
  const panel=$('otherRelationshipEditPanel');
  if(panel)panel.hidden=true;
  syncOtherRelationshipEditorToggle(false);
}

function otherRelationshipAnnotationKey(link){
  const id=String(link?.id||'');
  return id
    ? 'link:'+id
    : '';
}

function otherRelationshipAnnotationDraft(link){
  const key=otherRelationshipAnnotationKey(link);
  if(!key){
    return{
      text:'',
      hidden:false
    };
  }

  if(
    simEditorState
      .otherRelationshipAnnotationDrafts
      .has(key)
  ){
    const draft=
      simEditorState
        .otherRelationshipAnnotationDrafts
        .get(key);

    return{
      text:String(draft?.text||''),
      hidden:draft?.hidden===true
    };
  }

  const saved=
    relationshipDisplayOverride(key);

  return{
    text:
      typeof saved.text==='string'
        ? saved.text
        : '',
    hidden:
      saved.hidden===true
  };
}

function setOtherRelationshipAnnotationDraft(
  key,
  {
    text='',
    hidden=false
  }={}
){
  const annotationKey=String(key||'');
  if(!annotationKey)return;

  simEditorState
    .otherRelationshipAnnotationDrafts
    .set(
      annotationKey,
      {
        text:String(text||''),
        hidden:hidden===true
      }
    );
}

function captureOtherRelationshipAnnotationDrafts(
  target=document
){
  target
    .querySelectorAll(
      '[data-other-rel-annotation-key]'
    )
    .forEach(editor=>{
      const key=
        editor.dataset
          .otherRelAnnotationKey||
        '';

      if(!key)return;

      const input=
        editor.querySelector(
          '.other-rel-label-input'
        );

      const existingDraft=
        simEditorState
          .otherRelationshipAnnotationDrafts
          .has(key)
            ? simEditorState
                .otherRelationshipAnnotationDrafts
                .get(key)
            : relationshipDisplayOverride(
                key
              );

      setOtherRelationshipAnnotationDraft(
        key,
        {
          text:input?.value||'',
          hidden:
            existingDraft?.hidden===true
        }
      );
    });
}

function otherRelationshipAnnotationControlMarkup(
  link,
  relationLabel,
  rawRelation
){
  const key=
    otherRelationshipAnnotationKey(
      link
    );

  if(!key)return'';

  const draft=
    otherRelationshipAnnotationDraft(
      link
    );

  const hasOffset=
    !!(
      currentGenealogyData()
        .labelPositions?.[key]&&
      (
        currentGenealogyData()
          .labelPositions[key].dx||
        currentGenealogyData()
          .labelPositions[key].dy
      )
    );

  const hasCustomText=
    !!String(draft.text||'').trim();

  return (
    '<span class="other-rel-label-control" '+
    'data-other-rel-annotation-key="'+
    esc(key)+
    '">'+
      '<button class="other-rel-type-trigger" type="button" '+
      'data-other-rel-type-trigger '+
      'data-relationship-id="'+
      esc(String(link.id||''))+
      '" data-relationship-type="'+
      esc(rawRelation)+
      '" aria-haspopup="listbox" aria-expanded="false">'+
        '<span class="other-rel-type-value">'+
          esc(relationLabel)+
        '</span>'+
        iconSvg(
          'chevron-down',
          'other-rel-type-chevron'
        )+
      '</button>'+
      '<button class="family-rel-label-toggle other-rel-label-toggle" type="button" aria-expanded="'+
      (hasCustomText?'true':'false')+
      '"'+
      (hasCustomText?' hidden':'')+
      '>'+
        esc(uiText('自訂標籤文字'))+
      '</button>'+
      '<span class="other-rel-label-inline-editor"'+
      (hasCustomText?'':' hidden')+
      '>'+
        '<input class="other-rel-label-input" type="text" maxlength="40" placeholder="'+
        esc(uiText('輸入標籤文字'))+
        '" value="'+
        esc(draft.text)+
        '">'+
        '<button class="other-rel-label-reset" type="button">'+
          esc(uiText('恢復預設'))+
        '</button>'+
      '</span>'+
      (
        hasOffset
          ? '<button class="other-rel-position-reset" type="button" data-reset-other-rel-position="'+
            esc(key)+
            '">'+
              esc(uiText('重設位置'))+
            '</button>'
          : ''
      )+
    '</span>'
  );
}

function bindOtherRelationshipControls(
  person,
  target
){
  target
    .querySelectorAll(
      '[data-other-rel-type-trigger]'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        event=>{
          event.preventDefault();
          event.stopPropagation();

          const relationshipId=
            button.dataset
              .relationshipId||
            '';

          const currentType=
            button.dataset
              .relationshipType||
            '';

          const picker=
            global
              .L1nGRelationshipTypePicker;

          if(
            !relationshipId||
            !picker?.open
          ){
            return;
          }

          if(
            button.getAttribute(
              'aria-expanded'
            )==='true'
          ){
            picker.close?.();
            return;
          }

          picker.open({
            trigger:button,
            value:currentType,
            onSelect:newType=>{
              const normalized=
                String(
                  newType||
                  ''
                ).trim();

              if(
                !normalized||
                normalized===currentType
              ){
                return;
              }

              const mutation=
                genealogyStoreAuthority
                  .updateRelationship(
                    relationshipId,
                    {
                      type:normalized,
                      label:normalized
                    }
                  );

              applyGenealogyMutation(
                mutation
              );

              renderPersonEditorRelationshipList(
                person
              );
            }
          });
        }
      );
    });

  target
    .querySelectorAll(
      '.other-rel-label-toggle'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        ()=>{
          const control=
            button.closest(
              '[data-other-rel-annotation-key]'
            );

          const editor=
            control?.querySelector(
              '.other-rel-label-inline-editor'
            );

          if(!editor)return;

          editor.hidden=false;
          button.hidden=true;
          button.setAttribute(
            'aria-expanded',
            'true'
          );

          editor
            .querySelector(
              '.other-rel-label-input'
            )
            ?.focus({
              preventScroll:true
            });
        }
      );
    });

  target
    .querySelectorAll(
      '[data-other-rel-annotation-key]'
    )
    .forEach(editor=>{
      const key=
        editor.dataset
          .otherRelAnnotationKey||
        '';

      const input=
        editor.querySelector(
          '.other-rel-label-input'
        );

      const syncDraft=()=>{
        const existingDraft=
          simEditorState
            .otherRelationshipAnnotationDrafts
            .has(key)
              ? simEditorState
                  .otherRelationshipAnnotationDrafts
                  .get(key)
              : relationshipDisplayOverride(
                  key
                );

        setOtherRelationshipAnnotationDraft(
          key,
          {
            text:input?.value||'',
            hidden:
              existingDraft?.hidden===true
          }
        );
      };

      input?.addEventListener(
        'input',
        syncDraft
      );

      input?.addEventListener(
        'keydown',
        event=>{
          if(event.key!=='Escape')return;

          const inline=
            editor.querySelector(
              '.other-rel-label-inline-editor'
            );

          const toggle=
            editor.querySelector(
              '.other-rel-label-toggle'
            );

          if(inline)inline.hidden=true;

          if(toggle){
            toggle.hidden=false;
            toggle.setAttribute(
              'aria-expanded',
              'false'
            );
            toggle.focus({
              preventScroll:true
            });
          }
        }
      );

      editor
        .querySelector(
          '.other-rel-label-reset'
        )
        ?.addEventListener(
          'click',
          ()=>{
            if(input){
              input.value='';
            }

            syncDraft();
          }
        );
    });

  target
    .querySelectorAll(
      '[data-reset-other-rel-position]'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        ()=>{
          const key=
            button.dataset
              .resetOtherRelPosition;

          if(!key)return;

          const mutation=
            genealogyStoreAuthority
              .setRelationshipLabelPosition(
                key,
                null
              );

          if(
            !mutation?.dataChanged
          ){
            return;
          }

          applyGenealogyMutation(
            mutation
          );

          renderPersonEditorRelationshipList(
            person
          );
        }
      );
    });

  target
    .querySelectorAll(
      '[data-other-rel-delete]'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        ()=>{
          const relationshipId=
            button.dataset
              .otherRelDelete;

          if(!relationshipId)return;

          const key=
            'link:'+
            String(
              relationshipId
            );

          simEditorState
            .otherRelationshipAnnotationDrafts
            .delete(key);

          const mutation=
            genealogyStoreAuthority
              .removeRelationship(
                relationshipId
              );

          renderPersonEditorRelationshipList(
            person
          );

          applyGenealogyMutation(
            mutation
          );
        }
      );
    });
}

function renderPersonEditorRelationshipList(c) {
  const target=$('relationshipList');
  if(!target)return;

  if(!c){
    target.innerHTML='';
    target.classList.remove(
      'family-rel-preview-editable'
    );
    return;
  }

  const rels=
    personEditorOtherRelationships(
      c.id
    );

  const editing=
    otherRelationshipEditMode();

  target.classList.toggle(
    'family-rel-preview-editable',
    editing
  );

  if(!rels.length){
    target.innerHTML=
      '<span class="family-rel-empty">'+
      esc(uiText('暫無其他關係'))+
      '</span>';

    return;
  }

  target.innerHTML=
    rels
      .map(link=>{
        const otherId=
          String(link.from)===
            String(c.id)
            ? String(link.to)
            : String(link.from);

        const other=
          currentGenealogyData()
            .sims[otherId];

        if(!other)return'';

        const rawRelation=
          String(
            link.label||
            link.type||
            '關聯'
          ).trim()||
          '關聯';

        const relationLabel=
          displayRelationshipText(
            rawRelation
          );

        const draft=
          otherRelationshipAnnotationDraft(
            link
          );

        const customDisplayText=
          !editing&&
          !draft.hidden
            ? draft.text
            : '';

        const hiddenStatus=
          !editing&&
          draft.hidden
            ? '<span class="other-rel-hidden-label">'+
              esc(uiText('標籤文字：不顯示'))+
              '</span>'
            : '';

        return (
          '<div class="family-rel-preview-row'+
          (editing?' is-editing':'')+
          '" data-other-rel-id="'+
          esc(String(link.id||''))+
          '">'+
            (
              editing
                ? '<button class="family-rel-remove" type="button" data-other-rel-delete="'+
                  esc(String(link.id||''))+
                  '" aria-label="'+
                  esc(uiText('移除'))+
                  '" title="'+
                  esc(uiText('移除'))+
                  '">'+
                    iconSvg('x-lg')+
                  '</button>'
                : ''
            )+
            relationPersonMarkup(
              other,
              relationLabel,
              customDisplayText
            )+
            hiddenStatus+
            (
              editing
                ? '<div class="family-rel-row-actions">'+
                    otherRelationshipAnnotationControlMarkup(
                      link,
                      relationLabel,
                      rawRelation
                    )+
                  '</div>'
                : ''
            )+
          '</div>'
        );
      })
      .join('')||
    '<span class="family-rel-empty">'+
    esc(uiText('暫無其他關係'))+
    '</span>';

  if(editing){
    bindOtherRelationshipControls(
      c,
      target
    );
  }
}

function collectRelAnnotationDraft() {
  captureOtherRelationshipAnnotationDrafts();

  const person=
    currentSimEditorPerson();

  if(!person)return[];

  return personEditorOtherRelationships(
    person.id
  )
    .map(link=>{
      const key=
        otherRelationshipAnnotationKey(
          link
        );

      const draft=
        otherRelationshipAnnotationDraft(
          link
        );

      return{
        key,
        hidden:draft.hidden===true,
        text:String(draft.text||'').trim()
      };
    })
    .filter(entry=>entry.key);
}

function preserveEditorSampleText(
  existing,
  field,
  inputValue
) {
  const input =
    String(
      inputValue ??
      ''
    ).trim();

  if (
    !existing ||
    !isBuiltinSampleSim(existing)
  ) {
    return input;
  }

  const canonical =
    String(
      existing[field] ??
      ''
    );

  return (
    input ===
    displayDataText(
      canonical,
      existing
    )
  )
    ? canonical
    : input;
}

function preserveEditorSampleTraits(
  existing,
  inputTraits
) {
  if (
    !existing ||
    !isBuiltinSampleSim(existing)
  ) {
    return inputTraits;
  }

  const shown =
    (existing.traits || [])
      .map(value =>
        displayDataText(
          value,
          existing
        )
      );

  if (
    shown.length ===
      inputTraits.length &&
    shown.every(
      (value, index) =>
        value ===
        inputTraits[index]
    )
  ) {
    return [
      ...(existing.traits || [])
    ];
  }

  return inputTraits;
}

function collectPersonEditorSaveRequest() {
  const existing =
    currentSimEditorPerson();

  const rawName =
    $('fName').value.trim();

  if (!rawName) {
    uiAlert(
      '請填寫姓名',
      { title:'資料未完成' }
    );
    return null;
  }

  const familyIds =
    selectedEditorIds(
      'fFamilyIds'
    );

  if (!familyIds.length) {
    uiAlert(
      '請至少選擇一個所屬家族',
      { title:'資料未完成' }
    );
    return null;
  }

  const parentRelations =
    selectedEditorIds(
      'fParents'
    )
      .map(parentId => ({
        parentId,
        kind:
          simEditorState.parentKinds
            .get(parentId) ===
            'adoptive'
              ? 'adoptive'
              : 'parent-child'
      }));

  const childRelations =
    selectedEditorIds(
      'fChildren'
    )
      .map(childId => ({
        childId,
        kind:
          simEditorState.childKinds
            .get(childId) ===
            'adoptive'
              ? 'adoptive'
              : 'parent-child'
      }));

  const status =
    $('fStatus').value;

  const sim = {
    name:
      preserveEditorSampleText(
        existing,
        'name',
        rawName
      ),
    lifeStage:
      $('fStage').value,
    gender:
      $('fGender').value,
    status,
    race:
      $('fRace').value || '',
    birthdayYear:
      $('fBirthdayYear').value === ''
        ? null
        : Math.trunc(
            Number(
              $('fBirthdayYear').value
            )
          ),
    birthdayMonth:
      $('fBirthdayMonth').value
        ? Number(
            $('fBirthdayMonth').value
          )
        : null,
    birthdayDay:
      $('fBirthdayDay').value
        ? Number(
            $('fBirthdayDay').value
          )
        : null,
    age:
      $('fAge').value === ''
        ? null
        : Math.min(
            999,
            Math.max(
              0,
              Number(
                $('fAge').value
              ) || 0
            )
          ),
    residence:
      preserveEditorSampleText(
        existing,
        'residence',
        $('fResidence').value
      ),
    aspiration:
      preserveEditorSampleText(
        existing,
        'aspiration',
        $('fAspiration').value
      ),
    causeOfDeath:
      status === '已故' ||
      status === '幽靈'
        ? preserveEditorSampleText(
            existing,
            'causeOfDeath',
            $('fCauseOfDeath').value
          )
        : '',
    spouseIds:
      selectedEditorIds(
        'fSpouse'
      ),
    exSpouseIds:
      selectedEditorIds(
        'fExSpouse'
      ),
    traits:
      preserveEditorSampleTraits(
        existing,
        [
          ...simEditorState.traits
        ]
      ),
    career:
      preserveEditorSampleText(
        existing,
        'career',
        $('fCareer').value
      ),
    notes:
      preserveEditorSampleText(
        existing,
        'notes',
        $('fNotes').value
      ),
    gameAvatar:
      simEditorState.gameAvatar ||
      null,
    gameAvatarFrame:
      simEditorState.gameAvatar
        ? normalizeAvatarFrame(
            simEditorState.gameAvatarFrame
          )
        : null,
    customAvatar:
      simEditorState.customAvatar ||
      null,
    customAvatarFrame:
      simEditorState.customAvatar
        ? normalizeAvatarFrame(
            simEditorState.customAvatarFrame
          )
        : null,
    avatarSource:
      simEditorState.avatarSource,
    pets:
      JSON.parse(
        JSON.stringify(
          editingPets
        )
      ),
    gallery:
      JSON.parse(
        JSON.stringify(
          editingGallery
        )
      )
  };

  const siblingIds =
    [
      ...simEditorState
        .explicitSiblingIds
    ]
      .filter(siblingId =>
        !simEditorState
          .derivedSiblingIds
          .has(siblingId)
      );

  return {
    simId:
      simEditorState.simId ||
      null,
    sim,
    parentRelations,
    childRelations,
    spouseIds:
      sim.spouseIds,
    exSpouseIds:
      sim.exSpouseIds,
    siblingIds,
    familyIds,
    annotations:
      simEditorState.simId
        ? collectRelAnnotationDraft()
        : null
  };
}

function ensureSavedSimManualPosition(
  sim,
  parentRelations,
  mutation
) {
  const family =
    personEditorGetCurrentFamily?.();

  const mode =
    personEditorGetViewMode?.() ===
    'edit'
      ? 'edit'
      : 'view';

  if (
    !family ||
    !personEditorScene
      ?.isFreeLayoutActive?.(
        family
      )
  ) {
    return mutation;
  }

  const manualPositions =
    family.manualPositions?.[
      mode
    ] || {};

  if (
    manualPositions[sim.id]
  ) {
    return mutation;
  }

  const readPosition = id =>
    manualPositions[id] ||
    personEditorScene
      ?.readPersonPosition?.(id) ||
    null;

  const anchorParentId =
    parentRelations
      .map(relation =>
        relation.parentId
      )
      .find(parentId =>
        !!readPosition(parentId)
      );

  let nextPosition;

  if (anchorParentId) {
    const parentPosition =
      readPosition(
        anchorParentId
      );

    const parentDimensions =
      personEditorScene
        ?.measurePersonCardById?.(
          anchorParentId
        ) || {
          H:100
        };

    nextPosition = {
      x:parentPosition.x,
      y:
        parentPosition.y +
        (Number(parentDimensions.H) || 100) +
        80
    };
  } else {
    let maxY = 0;

    const scenePlan =
      personEditorScene
        ?.readScenePlan?.();

    if (scenePlan?.pos) {
      scenePlan.pos.forEach(
        (position, id) => {
          const dimensions =
            personEditorScene
              ?.measurePersonCardById?.(
                id
              ) || {
                H:100
              };

          maxY =
            Math.max(
              maxY,
              position.y +
              (Number(dimensions.H) || 100)
            );
        }
      );
    } else {
      Object.values(
        manualPositions
      ).forEach(position => {
        maxY =
          Math.max(
            maxY,
            Number(position?.y) || 0
          );
      });
    }

    nextPosition = {
      x:0,
      y:
        maxY
          ? maxY + 40
          : 0
    };
  }

  return genealogyStoreAuthority
    .mergeResults(
      mutation,
      genealogyStoreAuthority
        .setNodePosition(
          family.id,
          mode,
          sim.id,
          nextPosition
        )
    );
}

function commitPersonEditorDraft() {
  initializePersonEditorRelationshipUi();
  initializePersonEditorMediaDraft();

  const request =
    collectPersonEditorSaveRequest();

  if (!request) return;

  let mutation =
    genealogyStoreAuthority.saveSimDraft({
      simId:request.simId,
      sim:request.sim,
      parentRelations:
        request.parentRelations,
      childRelations:
        request.childRelations,
      spouseIds:
        request.spouseIds,
      exSpouseIds:
        request.exSpouseIds,
      siblingIds:
        request.siblingIds,
      familyIds:
        request.familyIds
    });

  const sim =
    currentGenealogyData().sims[
      mutation.simId
    ];

  if (!sim) {
    uiAlert(
      '人物資料儲存失敗。',
      {
        title:'儲存失敗',
        kind:'danger'
      }
    );
    return;
  }

  if (request.annotations) {
    mutation =
      genealogyStoreAuthority
        .mergeResults(
          mutation,
          genealogyStoreAuthority
            .setRelationshipAnnotations(
              request.annotations
            )
        );
  }

  mutation =
    applyEditorFamilyLabelDrafts(
      sim.id,
      mutation
    );

  mutation =
    ensureSavedSimManualPosition(
      sim,
      request.parentRelations,
      mutation
    );

  // 資料先交給 Store 與既有 Save Coordinator；
  // 不在按鈕點擊流程強制整庫 JSON.stringify / localStorage 寫入。
  // Scene 改走下一幀更新，避免大型族譜在關閉編輯器前同步重繪。
  applyGenealogyMutation(
    mutation,
    {
      immediateRender:false
    }
  );

  closePersonEditor();
  scheduleGC();
  personEditorToast?.(
    '已儲存模擬市民資料。'
  );

  return mutation;
}


  let mounted = false;
  let avatarCropOpener = null;

  function mountPersonEditor({
    openAvatarCropEditor,
    compressImage,
    saveImageAsset,
    showToast,
    scene,
    getCurrentFamily,
    getViewMode
  } = {}) {
    if (
      typeof openAvatarCropEditor !==
      'function'
    ) {
      throw new Error(
        'Person Editor requires avatar crop opener.'
      );
    }

    if (
      typeof compressImage !==
      'function'
    ) {
      throw new Error(
        'Person Editor requires image compressor.'
      );
    }

    if (
      typeof saveImageAsset !==
      'function'
    ) {
      throw new Error(
        'Person Editor requires image asset saver.'
      );
    }

    if (
      typeof showToast !==
      'function'
    ) {
      throw new Error(
        'Person Editor requires toast feedback.'
      );
    }

    if (
      !scene ||
      typeof scene.isFreeLayoutActive !==
        'function'
    ) {
      throw new Error(
        'Person Editor requires Genealogy Scene.'
      );
    }

    if (
      typeof getCurrentFamily !==
      'function' ||
      typeof getViewMode !==
      'function'
    ) {
      throw new Error(
        'Person Editor requires layout state access.'
      );
    }

    avatarCropOpener =
      openAvatarCropEditor;

    avatarImageCompressor =
      compressImage;

    avatarImageAssetSaver =
      saveImageAsset;

    personEditorToast =
      showToast;

    personEditorScene =
      scene;

    personEditorGetCurrentFamily =
      getCurrentFamily;

    personEditorGetViewMode =
      getViewMode;

    if (mounted) return;
    mounted = true;

    global.L1nGGenealogyUIController
      ?.registerOptionProvider?.(
        'person-editor-relations',
        personEditorRelationshipOptionProvider
      );

    $('avatarInput').onchange=async event=>{
      const file=event.target.files[0];
      if(!file)return;

      try{
        const result=
          await avatarImageCompressor(
            file,
            'sim'
          );

        simEditorState.customAvatar=
          await avatarImageAssetSaver(
            result.blob,
            {
              width:result.width,
              height:result.height
            }
          );

        simEditorState.customAvatarFrame={
          ...DEFAULT_AVATAR_FRAME
        };

        simEditorState.avatarSource=
          'custom';

        syncPersonEditorActiveAvatar();
        renderPersonEditorAvatarPreview();
        renderPersonEditorInfoPreviewIfActive();

        await avatarCropOpener('sim');
      }catch(error){
        uiAlert('圖片處理失敗：'+error.message,{
          title:'圖片處理失敗',
          kind:'danger'
        });
      }

      event.target.value='';
    };

    $('avatarAdjustBtn').onclick=()=>{
      void avatarCropOpener('sim');
    };

    $('avatarSourceToggleBtn').onclick=()=>{
      const target=
        simEditorState.avatarSource==='game'
          ? 'custom'
          : 'game';

      const available=
        target==='game'
          ? simEditorState.gameAvatar
          : simEditorState.customAvatar;

      if(!available)return;

      simEditorState.avatarSource=
        target;

      syncPersonEditorActiveAvatar();
      renderPersonEditorAvatarPreview();
      renderPersonEditorInfoPreviewIfActive();
    };

    $('avatarClearBtn').onclick=()=>{
      if(
        simEditorState.avatarSource!=='custom' ||
        !simEditorState.customAvatar
      ){
        return;
      }

      simEditorState.customAvatar=null;
      simEditorState.customAvatarFrame={
        ...DEFAULT_AVATAR_FRAME
      };

      if(simEditorState.gameAvatar){
        simEditorState.avatarSource='game';
      }

      syncPersonEditorActiveAvatar();
      renderPersonEditorAvatarPreview();
      renderPersonEditorInfoPreviewIfActive();
    };

    $('fName').addEventListener('input',()=>{
      if(!simEditorState.avatar)renderPersonEditorAvatarPreview();
      renderPersonEditorInfoPreviewIfActive();
    });

    $('fStatus').addEventListener(
      'change',
      syncPersonEditorCauseOfDeathVisibility
    );

    setupPersonEditorInteractions();

    const editorModal=document.querySelector('.sim-editor-modal');

    if(editorModal&&global.ResizeObserver){
      const previewSheetObserver=new ResizeObserver(()=>{
        if(mask.classList.contains('show')){
          syncEditorPreviewSheetGeometry();
        }
      });

      previewSheetObserver.observe(editorModal);
    }

    global.addEventListener(
      'resize',
      syncEditorPreviewSheetGeometry
    );
  }

  const state =
    Object.freeze({
      sim:simEditorState,
      pets:editingPets,
      pet:petEditorState,
      gallery:editingGallery,
      lifePhoto:lifePhotoState
    });

  global.L1nGGenealogyPersonEditor =
    Object.freeze({
      DEFAULT_AVATAR_FRAME,
      state,
      bindStore,
      mount:mountPersonEditor,
      resetDraftState:resetPersonEditorDraftState,
      open:openPersonEditor,
      close:closePersonEditor,
      commit:commitPersonEditorDraft,
      renderAvatarPreview:renderPersonEditorAvatarPreview,
      populateBirthdayDays:populatePersonEditorBirthdayDays,
      renderFamilyPreviews:renderPersonEditorFamilyPreviews,
      renderInfoPreviewIfActive:renderPersonEditorInfoPreviewIfActive,
      renderRelationshipList:renderPersonEditorRelationshipList,
      syncCauseOfDeathVisibility:syncPersonEditorCauseOfDeathVisibility
    });
})(window);
