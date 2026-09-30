/* ========【L1nG Genealogy Person Editor】 設定 - 人物編輯工作區 / Draft State / Editor Lifecycle Authority ======== */
(function (global) {
  'use strict';

  let genealogyStoreAuthority = null;

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
    traits:[],
    parentKinds:new Map(),
    childKinds:new Map(),
    explicitSiblingIds:new Set(),
    derivedSiblingIds:new Set()
  };

  const editingPets = [];

  const petEditorState = {
    index:-1,
    avatar:null,
    avatarFrame:{ ...DEFAULT_AVATAR_FRAME }
  };

  const editingGallery = [];

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

  function resetPersonEditorDraftState() {
    simEditorState.simId = null;
    simEditorState.avatar = null;
    simEditorState.avatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };
    simEditorState.traits = [];
    simEditorState.parentKinds.clear();
    simEditorState.childKinds.clear();
    simEditorState.explicitSiblingIds.clear();
    simEditorState.derivedSiblingIds.clear();

    replaceDraftCollection(
      editingPets,
      []
    );

    replaceDraftCollection(
      editingGallery,
      []
    );
  }

function renderPersonEditorAvatarPreview(){
    const element=$('avatarPreview');
    const avatar=framedAvatarImageHTML(simEditorState.avatar,simEditorState.avatarFrame);

    if(avatar){
      element.innerHTML=avatar;
    }else{
      const name=$('fName').value.trim();
      element.textContent=name?name.charAt(0):'?';
    }

    const adjust=$('avatarAdjustBtn');
    if(adjust)adjust.disabled=!simEditorState.avatar;
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

function buildPersonEditorDraft(){
    const existing=
      currentSimEditorPerson();
    const status=$('fStatus').value;

    return {
      ...(existing
        ? {gameData:existing.gameData?JSON.parse(JSON.stringify(existing.gameData)):undefined}
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
      bio:$('fBio').value.trim(),
      avatar:simEditorState.avatar||null,
      avatarFrame:normalizeAvatarFrame(simEditorState.avatarFrame),
      pets:JSON.parse(JSON.stringify(editingPets)),
      gallery:JSON.parse(JSON.stringify(editingGallery))
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

  function applyEditorSiblingStateToSelect(){
    const select=$('fSiblings');
    if(!select)return;

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

  function relationPersonMarkup(sim,relationLabel=''){
    if(!sim)return'';

    const name=displayDataText(sim.name,sim);
    const avatar=framedAvatarImageHTML(sim.avatar,sim.avatarFrame)||esc((name||'?').charAt(0));

    return '<span class="family-rel-person">'+
      '<span class="family-rel-person-avatar">'+avatar+'</span>'+
      '<span class="family-rel-person-copy">'+
        '<span class="family-rel-person-name">'+esc(name)+'</span>'+
        (relationLabel
          ? '<span class="family-rel-person-kinship">'+esc(displayRelationshipText(relationLabel))+'</span>'
          : '')+
      '</span>'+
    '</span>';
  }

  function renderEditorRelationPeople(targetId,ids,labelResolver=null,emptyText='—'){
    const target=$(targetId);
    if(!target)return;

    const unique=[...new Set((ids||[]).map(String).filter(Boolean))];

    if(!unique.length){
      target.innerHTML=`<span class="family-rel-empty">${esc(uiText(emptyText))}</span>`;
      return;
    }

    const draft=buildPersonEditorDraft();

    target.innerHTML=unique.map(id=>{
      const sim=currentGenealogyData().sims[id];
      if(!sim)return'';

      const label=typeof labelResolver==='function'
        ? labelResolver(sim,draft)
        : '';

      return relationPersonMarkup(sim,label);
    }).join('')||`<span class="family-rel-empty">${esc(uiText(emptyText))}</span>`;
  }

  function renderEditorRelationKindList(listId,selectId,kindMap,role){
    const list=$(listId);
    if(!list)return;

    syncEditorRelationKindMap(selectId,kindMap);
    const draft=buildPersonEditorDraft();

    list.innerHTML=selectedEditorIds(selectId).map(id=>{
      const sim=currentGenealogyData().sims[id];
      if(!sim)return'';

      const kind=kindMap.get(id)||'parent-child';
      const label=directFamilyKinshipLabel(role,sim,draft,kind);

      return '<div class="family-rel-kind-row">'+
        '<div class="family-rel-kind-person">'+relationPersonMarkup(sim,label)+'</div>'+
        '<select data-editor-relation-kind="'+esc(role)+'" data-editor-relation-id="'+esc(id)+'">'+
          '<option value="parent-child"'+(kind==='parent-child'?' selected':'')+'>'+esc(uiText('親生'))+'</option>'+
          '<option value="adoptive"'+(kind==='adoptive'?' selected':'')+'>'+esc(uiText('收養'))+'</option>'+
        '</select>'+
      '</div>';
    }).join('');

    list.querySelectorAll('[data-editor-relation-kind]').forEach(select=>{
      select.onchange=()=>{
        const id=select.dataset.editorRelationId;
        const targetMap=select.dataset.editorRelationKind==='parent'
          ? simEditorState.parentKinds
          : simEditorState.childKinds;

        targetMap.set(id,select.value==='adoptive'?'adoptive':'parent-child');
        renderPersonEditorFamilyPreviews();
        renderPersonEditorInfoPreviewIfActive();
      };
    });
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

    renderEditorRelationPeople(
      'editorParentsPreview',
      selectedEditorIds('fParents'),
      sim=>directFamilyKinshipLabel(
        'parent',
        sim,
        buildPersonEditorDraft(),
        simEditorState.parentKinds.get(String(sim.id))||'parent-child'
      )
    );

    renderEditorRelationPeople(
      'editorSpousePreview',
      selectedEditorIds('fSpouse'),
      sim=>directFamilyKinshipLabel('spouse',sim,buildPersonEditorDraft())
    );

    renderEditorRelationPeople(
      'editorExSpousePreview',
      selectedEditorIds('fExSpouse'),
      sim=>directFamilyKinshipLabel('exspouse',sim,buildPersonEditorDraft())
    );

    renderEditorRelationPeople(
      'editorChildrenPreview',
      selectedEditorIds('fChildren'),
      sim=>directFamilyKinshipLabel(
        'child',
        sim,
        buildPersonEditorDraft(),
        simEditorState.childKinds.get(String(sim.id))||'parent-child'
      )
    );

    renderEditorRelationPeople(
      'editorSiblingsPreview',
      editorSiblingIds(),
      sim=>directFamilyKinshipLabel('sibling',sim,buildPersonEditorDraft())
    );

    renderEditorRelationKindList(
      'editorParentKindList',
      'fParents',
      simEditorState.parentKinds,
      'parent'
    );

    renderEditorRelationKindList(
      'editorChildKindList',
      'fChildren',
      simEditorState.childKinds,
      'child'
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
    const panel=document.querySelector('.sim-editor-panel[data-editor-panel="preview"]');
    if(panel&&!panel.hidden)renderEditorInfoPreview();
  }

  function switchEditorTab(tabName='basic'){
    const tabs=[...document.querySelectorAll('.sim-editor-tab[data-editor-tab]')];
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

    if(tabName==='preview'){
      renderEditorInfoPreview();
    }
  }

  function resetEditorFamilyPanels(){
    document.querySelectorAll('[data-family-editor-edit]').forEach(panel=>{
      panel.hidden=true;
    });

    document.querySelectorAll('[data-family-editor-toggle]').forEach(button=>{
      button.setAttribute('aria-expanded','false');
    });
  }

  function setupPersonEditorInteractions(){
    document.querySelectorAll('.sim-editor-tab[data-editor-tab]').forEach(tab=>{
      tab.addEventListener('click',()=>switchEditorTab(tab.dataset.editorTab));

      tab.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;

        const tabs=[...document.querySelectorAll('.sim-editor-tab[data-editor-tab]')];
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

        document.querySelectorAll('[data-family-editor-edit]').forEach(other=>{
          if(other!==panel)other.hidden=true;
        });

        document.querySelectorAll('[data-family-editor-toggle]').forEach(other=>{
          other.setAttribute('aria-expanded','false');
        });

        panel.hidden=!willOpen;
        button.setAttribute('aria-expanded',willOpen?'true':'false');

        if(willOpen){
          panel.querySelector('.ui-select-input')?.focus({preventScroll:true});
        }
      });
    });

    const editorModal=document.querySelector('.sim-editor-modal');

    editorModal?.addEventListener('input',()=>{
      renderPersonEditorInfoPreviewIfActive();
    });

    editorModal?.addEventListener('change',()=>{
      renderPersonEditorInfoPreviewIfActive();
    });
  }


  function openPersonEditor(id){
    resetPersonEditorDraftState();

    simEditorState.simId=
      id || null;

    const sim=
      id
        ? currentGenealogyData().sims[id]
        : null;

    const familyAuthority=
      sim
        ? resolveDirectFamilyRelationships(
            sim.id
          )
        : null;

    $('modalTitle').textContent=sim?uiText('編輯模擬市民'):uiText('新增模擬市民');

    $('fName').value=sim?displayDataText(sim.name,sim):'';
    $('fStage').value=sim?sim.lifeStage:'成年';
    $('fGender').value=sim?(sim.gender||'男'):'男';
    $('fStatus').value=sim?(sim.status||'在世'):'在世';
    $('fRace').value=sim?(sim.race||''):'';

    $('fBirthdayYear').value=sim&&sim.birthdayYear!=null
      ? String(sim.birthdayYear)
      : '';

    $('fBirthdayMonth').value=sim&&sim.birthdayMonth
      ? String(sim.birthdayMonth)
      : '';

    populatePersonEditorBirthdayDays(sim&&sim.birthdayDay?sim.birthdayDay:'');

    $('fAge').value=sim&&sim.age!=null
      ? String(sim.age)
      : '';

    $('fResidence').value=sim?displayDataText(sim.residence,sim):'';
    $('fAspiration').value=sim?displayDataText(sim.aspiration,sim):'';
    $('fCauseOfDeath').value=sim?displayDataText(sim.causeOfDeath,sim):'';

    simEditorState.traits=sim
      ? (sim.traits||[]).map(value=>displayDataText(value,sim))
      : [];

    renderTraitEditor();

    if($('traitInput'))$('traitInput').value='';

    $('fCareer').value=sim?displayDataText(sim.career,sim):'';
    $('fBio').value=sim?displayDataText(sim.bio,sim):'';

    simEditorState.avatar=sim?(sim.avatar||null):null;
    simEditorState.avatarFrame=normalizeAvatarFrame(sim?.avatarFrame);
    renderPersonEditorAvatarPreview();

    replaceDraftCollection(
      editingPets,
      sim
        ? JSON.parse(JSON.stringify(sim.pets||[]))
        : []
    );
    renderPetDraftList();

    replaceDraftCollection(
      editingGallery,
      sim
        ? JSON.parse(JSON.stringify(sim.gallery||[]))
        : []
    );
    lifePhotoWorkspace.renderList();

    syncPersonEditorCauseOfDeathVisibility();
    switchEditorTab('basic');

    $('fFamilyIds').innerHTML=currentGenealogyData().families
      .map(family=>`<option value="${family.id}">${esc(displayDataText(family.name,family))}</option>`)
      .join('');

    const currentFamilies=new Set();

    if(sim){
      currentGenealogyData().families.forEach(family=>{
        if(family.memberIds.includes(sim.id)){
          currentFamilies.add(String(family.id));
        }
      });
    }else if(currentGenealogyData().currentFamilyId){
      currentFamilies.add(String(currentGenealogyData().currentFamilyId));
    }

    [...$('fFamilyIds').options].forEach(option=>{
      option.selected=currentFamilies.has(String(option.value));
    });

    const allSims=Object.values(currentGenealogyData().sims);

    const parentOptions=allSims
      .filter(candidate=>
        !sim||
        (
          candidate.id!==sim.id&&
          !isDescendant(sim.id,candidate.id)
        )
      )
      .map(candidate=>
        `<option value="${candidate.id}">${esc(displayDataText(candidate.name,candidate))}</option>`
      )
      .join('');

    $('fParents').innerHTML=parentOptions;

    simEditorState.parentKinds=new Map();

    if(familyAuthority){
      familyAuthority.parents
        .forEach(relation=>{
          simEditorState.parentKinds.set(
            relation.targetId,
            relation.kind
          );
        });
    }

    [...$('fParents').options].forEach(option=>{
      option.selected=simEditorState.parentKinds.has(String(option.value));
    });

    const relationOptions=allSims
      .filter(candidate=>!sim||candidate.id!==sim.id)
      .map(candidate=>
        `<option value="${candidate.id}">${esc(displayDataText(candidate.name,candidate))}</option>`
      )
      .join('');

    $('fSpouse').innerHTML=relationOptions;

    const currentSpouses=
      new Set(
        familyAuthority
          ? familyAuthority.spouses
              .map(relation=>
                relation.targetId
              )
          : []
      );
    [...$('fSpouse').options].forEach(option=>{
      option.selected=currentSpouses.has(String(option.value));
    });

    $('fExSpouse').innerHTML=relationOptions;

    const currentExSpouses=
      new Set(
        familyAuthority
          ? familyAuthority.exSpouses
              .map(relation=>
                relation.targetId
              )
          : []
      );
    [...$('fExSpouse').options].forEach(option=>{
      option.selected=currentExSpouses.has(String(option.value));
    });

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

    simEditorState.childKinds=new Map(
      childRelations.map(relation=>[
        relation.childId,
        relation.kind
      ])
    );

    $('fChildren').innerHTML=relationOptions;
    [...$('fChildren').options].forEach(option=>{
      option.selected=simEditorState.childKinds.has(String(option.value));
    });

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

    $('fSiblings').innerHTML=relationOptions;

    applyEditorSiblingStateToSelect();

    $('relationshipTarget').innerHTML=allSims
      .filter(candidate=>!sim||candidate.id!==sim.id)
      .map(candidate=>
        `<option value="${candidate.id}">${esc(displayDataText(candidate.name,candidate))}</option>`
      )
      .join('');

    populateRelationshipTypePicker();
    renderPersonEditorRelationshipList(sim);
    renderRelAnno(sim?sim.id:null);

    [
      'fFamilyIds',
      'fParents',
      'fSpouse',
      'fExSpouse',
      'fChildren',
      'fSiblings',
      'relationshipType',
      'relationshipTarget'
    ].forEach(refreshEditorSelect);

    resetEditorFamilyPanels();
    renderPersonEditorFamilyPreviews();

    $('btnDelete').style.display=sim?'':'none';
    $('relationshipSection').style.display=sim?'':'none';

    const newRelHint=$('newSimRelationshipsHint');
    if(newRelHint)newRelHint.hidden=!!sim;

    mask.classList.add('show');
    setTimeout(()=>$('fName').focus(),60);
  }

  function closePersonEditor() {
  mask.classList.remove(
    'show'
  );

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

  lifePhotoEditorDialog.classList.remove(
    'show'
  );

  lifePhotoState.editor.index = -1;
  lifePhotoState.editor.imageRef = '';
  lifePhotoState.editor.sizeKB = 0;
  lifePhotoState.editor.isOriginal = false;
}

function renderPersonEditorRelationshipList(c) {
  if (!c) { $('relationshipList').innerHTML = ''; return; }
  const rels = (currentGenealogyData().links||[]).filter(l => (l.from === c.id || l.to === c.id) && !isSiblingLink(l));
  $('relationshipList').innerHTML = rels.length
    ? rels.map((l, i) => {
        const otherId = l.from === c.id ? l.to : l.from;
        const other = currentGenealogyData().sims[otherId];
        const arrow = l.from === c.id ? '→' : '←';
        return `<div class="relationship-item">
          <span>${esc(displayRelationshipText(l.label || l.type || '關聯'))} ${arrow} ${esc(other ? displayDataText(other.name, other) : uiText('（已刪除）'))}</span>
          <button type="button" data-del="${i}" title="刪除">×</button>
        </div>`;
      }).join('')
    : `<div class="relationship-empty">${esc(uiText('暫無其他關係'))}</div>`;
  $('relationshipList').querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      const target = rels[+btn.dataset.del];
      if (!target?.id) return;

      const mutation =
        genealogyStoreAuthority.removeRelationship(
          target.id
        );

      renderPersonEditorRelationshipList(c);
      renderRelAnno(c.id);
      applyGenealogyMutation(mutation);
    };
  });
}

function collectRelAnnotationDraft() {
  const entries = [];
  const items =
    document.querySelectorAll(
      '#familyRelationshipAnnotationList .relationship-annotation-item, #relationshipAnnotationList .relationship-annotation-item'
    );

  items.forEach(item => {
    const key = item.dataset.annoKey;
    if (!key) return;

    const select =
      item.querySelector(
        '[data-rel-display-mode]'
      );

    const input =
      item.querySelector(
        'input[type="text"]'
      );

    entries.push({
      key,
      hidden:select?.value === 'none',
      text:input?.value.trim() || ''
    });
  });

  return entries;
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
    bio:
      preserveEditorSampleText(
        existing,
        'bio',
        $('fBio').value
      ),
    avatar:
      simEditorState.avatar ||
      null,
    avatarFrame:
      normalizeAvatarFrame(
        simEditorState.avatarFrame
      ),
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
    currentFamily();

  ensureFamilyLayoutShape(
    family
  );

  if (
    !family.freeLayout[
      viewMode
    ]
  ) {
    return mutation;
  }

  const manualPositions =
    family.manualPositions[
      viewMode
    ];

  if (
    manualPositions[sim.id]
  ) {
    return mutation;
  }

  const {
    H:NODE_H
  } = getDims();

  const {
    LEVEL:LEVEL_GAP
  } = getGaps();

  const anchorParentId =
    parentRelations
      .map(relation =>
        relation.parentId
      )
      .find(parentId =>
        manualPositions[
          parentId
        ]
      );

  let nextPosition;

  if (anchorParentId) {
    const parentPosition =
      manualPositions[
        anchorParentId
      ];

    nextPosition = {
      x:parentPosition.x,
      y:
        parentPosition.y +
        NODE_H +
        LEVEL_GAP
    };
  } else {
    let maxY = 0;

    Object.values(
      manualPositions
    )
      .forEach(position => {
        maxY =
          Math.max(
            maxY,
            position.y +
            NODE_H
          );
      });

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
          viewMode,
          sim.id,
          nextPosition
        )
    );
}

function commitPersonEditorDraft() {
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
    ensureSavedSimManualPosition(
      sim,
      request.parentRelations,
      mutation
    );

  applyGenealogyMutation(
    mutation
  );

  closePersonEditor();
  scheduleGC();
}


  let mounted = false;
  let avatarCropOpener = null;

  function mountPersonEditor({
    openAvatarCropEditor
  } = {}) {
    if (
      typeof openAvatarCropEditor !==
      'function'
    ) {
      throw new Error(
        'Person Editor requires avatar crop opener.'
      );
    }

    avatarCropOpener =
      openAvatarCropEditor;

    if (mounted) return;
    mounted = true;

    $('avatarInput').onchange=async event=>{
      const file=event.target.files[0];
      if(!file)return;

      try{
        const result=await compressImage(file,'sim');
        simEditorState.avatar=await saveImageAsset(result.blob,{
          width:result.width,
          height:result.height
        });
        simEditorState.avatarFrame={...DEFAULT_AVATAR_FRAME};
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

    $('avatarClearBtn').onclick=()=>{
      simEditorState.avatar=null;
      simEditorState.avatarFrame={...DEFAULT_AVATAR_FRAME};
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
