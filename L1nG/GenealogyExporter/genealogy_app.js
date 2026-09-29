/* ========【L1nG Genealogy App】 設定 - 族譜工具主程式與 UI 協調 ======== */
/*
 * 主要來源語言：繁體中文（zh-Hant）
 * 支援語言：繁體中文 / 簡體中文 / English
 * 圖示：本機 Bootstrap Icons SVG
 */


const NODE_DIMS = {
  // 編輯模式保留較大的管理卡，檢視模式則維持精簡卡。
  edit: { W: 220, H: 148 },
  view: { W: 136, H: 118 }
};
const GAPS = {
  edit: { SPOUSE: 30, SIBLING: 56, LEVEL: 118 },
  view: { SPOUSE: 22, SIBLING: 40, LEVEL: 90 }
};

const PAD = 80;
const STORE_KEY = 'l1ng_genealogy_v1';
const THEME_KEY = 'l1ng_genealogy_theme_v1';
const CUSTOM_COLORS_KEY = 'l1ng_genealogy_custom_theme_v1';
const BG_KEY = 'l1ng_genealogy_background_v1';
const MODE_KEY = 'sims4_genealogy_mode';
const LABELS_KEY = 'sims4_genealogy_labels';
const LABEL_LOCK_KEY = 'sims4_genealogy_label_lock';
const SIDEBAR_WIDTH_KEY = 'sims4_genealogy_sidebar_width';
const FAMILY_PANEL_COLLAPSED_KEY = 'sims4_genealogy_family_panel_collapsed';
const PERSON_LIBRARY_VIEW_KEY = 'sims4_genealogy_person_library_view';
const FAMILY_MEMBER_GENERATION_SORT_KEY = 'sims4_genealogy_family_member_generation_sort';
const REL_LINE_STYLE_KEY = 'sims4_genealogy_relationship_line_style';
const FAMILY_TREE_VIEW_MODE_KEY = 'sims4_genealogy_family_tree_view_mode';
const LANG_KEY = 'ling_genealogy_language_v1';
const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 260;
const SIDEBAR_MAX_WIDTH = 430;
const GUIDE_SNAP_PX = 8;
const RELATIONSHIP_VERTICAL_SNAP_PX = 10;
const SIBLING_RELATION_TYPE = 'sibling';
const SIBLING_RELATION_LABEL = '兄弟姊妹';

// ========【族譜 Runtime】 設定 - Cache / DOM / Save 由獨立執行層負責 ========
const genealogyRuntime =
  window.L1nGGenealogyRuntime?.create?.() ||
  null;

const genealogyInteraction =
  window.L1nGGenealogyInteraction ||
  null;

let genealogyStore = null;
let genealogyScene = null;

// ========【族譜卡片顯示】 設定 - 檢視 / 編輯模式各自保存顯示內容；檢視卡另有外觀設定 ========
const CARD_CONTENT_FIELD_KEYS = ['name','gender','lifeStage','age','birthday','status','race','career','residence','aspiration','traits','pets','gallery'];
const CARD_SETTING_FIELD_KEYS = [...CARD_CONTENT_FIELD_KEYS, 'genderBar'];

const DEFAULT_CARD_VIEW_SETTINGS = Object.freeze({
  avatar: true,
  name: true,
  gender: false,
  genderBar: false,
  lifeStage: false,
  age: false,
  birthday: false,
  status: true,
  race: false,
  career: false,
  residence: false,
  aspiration: false,
  traits: false,
  pets: false,
  gallery: false,
  appearance: 'minimal'
});

const DEFAULT_CARD_EDIT_SETTINGS = Object.freeze({
  avatar: true,
  name: true,
  gender: false,
  genderBar: true,
  lifeStage: true,
  age: true,
  birthday: true,
  status: false,
  race: false,
  career: false,
  residence: true,
  aspiration: false,
  traits: true,
  pets: false,
  gallery: false
});


// ========【圖片處理規則】 設定 - 依用途自動最佳化，不提供玩家畫質檔位 ========
const IMAGE_PROCESSING_POLICY = Object.freeze({
  avatar:Object.freeze({ max:384, webp:0.87, jpeg:0.84 }),
  petAvatar:Object.freeze({ max:384, webp:0.87, jpeg:0.84 }),
  gallery:Object.freeze({ max:720, webp:0.85, jpeg:0.82 })
});
const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze(['image/jpeg','image/png','image/webp']);
const SUPPORTED_IMAGE_EXTENSIONS = Object.freeze(['jpg','jpeg','png','webp']);
const DEFAULT_AVATAR_FRAME = Object.freeze({ x:0.5, y:0.5, zoom:1 });

const THEME_PRESETS = [
  { id:'ling',     name:'L1nG 晴空',     grad:'linear-gradient(120deg, #ffffff 0%, #dfeffc 100%)' },
  { id:'sage',     name:'森霧鼠尾草',    grad:'linear-gradient(120deg, #dfe9e0 0%, #eef3ea 100%)' },
  { id:'rose',     name:'莓果薄暮',      grad:'linear-gradient(120deg, #e8c4d0 0%, #f4dfe6 100%)' },
  { id:'amber',    name:'琥珀紙頁',      grad:'linear-gradient(120deg, #e5c896 0%, #f2dfb9 100%)' },
  { id:'midnight', name:'午夜靛藍',      grad:'linear-gradient(120deg, #182535 0%, #243c5c 100%)' }
];

const BG_MAX = 1920;
const BG_QUALITY = 0.72;
const SCALE_MIN = 0.12, SCALE_MAX = 3;
const MAX_TAGS = 5;
const ORIGINAL_WARN_KB = 2048;

const RELATIONSHIP_SEMANTICS = Object.freeze({
  'parent-child': Object.freeze({
    icon:'person-hearts',
    label:'親子'
  }),
  adoptive: Object.freeze({
    icon:'house-heart',
    label:'收養'
  }),
  spouse: Object.freeze({
    icon:'heart',
    label:'配偶'
  }),
  exspouse: Object.freeze({
    icon:'heartbreak',
    label:'前任配偶'
  }),
  sibling: Object.freeze({
    icon:'people',
    label:'兄弟姊妹'
  })
});

const SOCIAL_RELATIONSHIP_DEFINITIONS = Object.freeze({
  // 戀愛 / 親密
  '曖昧':Object.freeze({ icon:'hearts', category:'romance' }),
  '訂婚':Object.freeze({ icon:'gem', category:'romance' }),
  '伴侶':Object.freeze({ icon:'hearts', category:'romance' }),
  '情人':Object.freeze({ icon:'heart-fill', category:'romance' }),
  '秘密情人':Object.freeze({ icon:'heart-fill', category:'romance' }),
  '外遇':Object.freeze({ icon:'heartbreak', category:'romance' }),
  '前任情人':Object.freeze({ icon:'heartbreak', category:'romance' }),
  '單戀':Object.freeze({ icon:'heart', category:'romance' }),
  '互相暗戀':Object.freeze({ icon:'hearts', category:'romance' }),
  '喪偶':Object.freeze({ icon:'flower1', category:'romance' }),

  // 友誼
  '朋友':Object.freeze({ icon:'person-heart', category:'friendship' }),
  '好友':Object.freeze({ icon:'person-heart', category:'friendship' }),
  '摯友':Object.freeze({ icon:'person-check', category:'friendship' }),
  '青梅竹馬':Object.freeze({ icon:'person-heart', category:'friendship' }),
  '網友':Object.freeze({ icon:'person-heart', category:'friendship' }),

  // 負面
  '仇敵':Object.freeze({ icon:'lightning', category:'negative' }),
  '宿敵':Object.freeze({ icon:'lightning', category:'negative' }),
  '死對頭':Object.freeze({ icon:'lightning', category:'negative' }),
  '關係不睦':Object.freeze({ icon:'lightning', category:'negative' }),

  // 生活 / 社會
  '師生':Object.freeze({ icon:'mortarboard', category:'social' }),
  '師承':Object.freeze({ icon:'mortarboard', category:'social' }),
  '同事':Object.freeze({ icon:'people', category:'social' }),
  '室友':Object.freeze({ icon:'house-heart', category:'social' }),
  '鄰居':Object.freeze({ icon:'house-heart', category:'social' })
});

const KINSHIP_SYSTEM_LABELS = Object.freeze([
  '本人',
  '父親','母親','父母',
  '養父','養母','養親',
  '兒子','女兒','子女',
  '養子','養女','養子女',
  '丈夫','妻子','配偶',
  '前夫','前妻','前任配偶',
  '哥哥','姐姐','弟弟','妹妹','兄弟','姊妹','兄弟姊妹',
  '爺爺','奶奶','外公','外婆','祖父','祖母','祖父母',
  '孫子','孫女','外孫','外孫女','孫輩',
  '曾祖父','曾祖母','曾祖父母',
  '高祖父','高祖母','高祖父母',
  '曾孫','曾孫女','曾孫輩',
  '伯父','叔叔','叔伯','姑姑','舅舅','阿姨','父母的兄弟姊妹',
  '姪子','姪女','外甥','外甥女','兄弟姊妹的子女',
  '堂哥','堂姐','堂弟','堂妹','堂兄弟姊妹',
  '表哥','表姐','表弟','表妹','表兄弟姊妹',
  '岳父','岳母','公公','婆婆','配偶父親','配偶母親','配偶父母'
]);

const RACE_PRESETS = {
  '':           { icon:'', label:'（不顯示）' },
  human:        { icon:'person', label:'人類' },
  // 種族圖示改用「看到圖形就能聯想到內容」的語意圖，不再拿抽象導覽圖示代用。
  vampire:      { icon:'vampire-fangs', label:'吸血鬼' },
  alien:        { icon:'alien-head', label:'外星人' },
  werewolf:     { icon:'wolf-head', label:'狼人' },
  mermaid:      { icon:'mermaid-tail', label:'人魚' },
  spellcaster:  { icon:'magic', label:'魔法師' },
  fairy:        { icon:'fairy-wings', label:'仙子' },
  plant:        { icon:'flower2', label:'植物模擬市民' },
  robot:        { icon:'robot', label:'機器人' },
  other:        { icon:'asterisk', label:'其他' }
};

const PET_SPECIES = {
  // 哺乳類寵物統一以爪印表示「寵物」，避免愛心 / 圓形等圖示無法一眼辨識。
  dog:    { icon:'paw', label:'狗' },
  cat:    { icon:'paw', label:'貓' },
  horse:  { icon:'paw', label:'馬' },
  rabbit: { icon:'paw', label:'兔子' },
  bird:   { icon:'feather', label:'鳥' },
  hamster:{ icon:'paw', label:'倉鼠' },
  fish:   { icon:'water', label:'魚' },
  lizard: { icon:'bug', label:'蜥蜴' },
  other:  { icon:'paw', label:'其他' }
};

const VALID_THEMES = ['ling','sage','rose','amber','midnight'];
const VALID_MODES = ['view','edit'];
let showRelLabels = true;
let relationshipPerspectiveSimId = null;
let bgSettings = { image:null, opacity:0.5, fit:'cover' };
const personLibraryState = {
  batchMode:false,
  selection:new Set(),
  addSelection:new Set()
};

const familyMemberOperationState = {
  removeMode:false,
  selection:new Set()
};
let labelDrag = null;
let viewMode = 'view';
let personProfilePersonId = null;
let currentThemeId = 'ling';
let customColors = { c1: '#f0c050', c2: '#a878c8' };

let personLibraryViewMode = 'detailed';
try {
  const savedPersonLibraryView = localStorage.getItem(PERSON_LIBRARY_VIEW_KEY);
  if (savedPersonLibraryView === 'compact' || savedPersonLibraryView === 'detailed') personLibraryViewMode = savedPersonLibraryView;
} catch (_) {}


function resetPersonLibraryOperations({
  batch = true,
  add = true
} = {}) {
  if (batch) {
    personLibraryState.batchMode = false;
    personLibraryState.selection.clear();
  }
  if (add) {
    personLibraryState.addSelection.clear();
  }
}

function resetFamilyMemberOperations() {
  familyMemberOperationState.removeMode = false;
  familyMemberOperationState.selection.clear();
}

function removePersonFromOperationState(id) {
  const simId = String(id || '');
  if (!simId) return;

  personLibraryState.selection.delete(simId);
  personLibraryState.addSelection.delete(simId);
  familyMemberOperationState.selection.delete(simId);
}

let familyMemberGenerationSort = 'asc';
try {
  const savedFamilyMemberGenerationSort =
    localStorage.getItem(FAMILY_MEMBER_GENERATION_SORT_KEY);

  if (
    savedFamilyMemberGenerationSort === 'asc' ||
    savedFamilyMemberGenerationSort === 'desc'
  ) {
    familyMemberGenerationSort =
      savedFamilyMemberGenerationSort;
  }
} catch (_) {}

let familyTreeViewMode = 'extended';
try {
  const savedFamilyTreeViewMode = localStorage.getItem(FAMILY_TREE_VIEW_MODE_KEY);
  if (savedFamilyTreeViewMode === 'household' || savedFamilyTreeViewMode === 'ea' || savedFamilyTreeViewMode === 'extended') {
    familyTreeViewMode = savedFamilyTreeViewMode;
  }
} catch (_) {}

let familyTreeLastSourceFamilyId = null;
let familyTreeHouseholdSelectionValue = null;
let familyTreeEaSelectionValue = null;
let familyTreeExtendedSelectionValue = null;

const RELATIONSHIP_LINE_DEFAULTS = Object.freeze({
  parent: Object.freeze({
    style:'solid',
    width:2.0,
    color:null,
    curved:false,
    curveAmount:50
  }),
  spouse: Object.freeze({
    style:'solid',
    width:2.4,
    color:null,
    curved:false,
    curveAmount:50
  }),
  exspouse: Object.freeze({
    style:'short-dash',
    width:1.7,
    color:null,
    curved:true,
    curveAmount:50
  }),
  adopt: Object.freeze({
    style:'long-dash',
    width:1.7,
    color:null,
    curved:false,
    curveAmount:50
  }),
  other: Object.freeze({
    style:'dot',
    width:1.5,
    color:null,
    curved:true,
    curveAmount:50,
    bidirectional:false
  }),
  otherTypes:Object.freeze({})
});

function createRelationshipLineSettings() {
  return {
    parent:{ ...RELATIONSHIP_LINE_DEFAULTS.parent },
    spouse:{ ...RELATIONSHIP_LINE_DEFAULTS.spouse },
    exspouse:{ ...RELATIONSHIP_LINE_DEFAULTS.exspouse },
    adopt:{ ...RELATIONSHIP_LINE_DEFAULTS.adopt },
    other:{ ...RELATIONSHIP_LINE_DEFAULTS.other },
    otherTypes:{}
  };
}

function migrateRelationshipLineSetting(
  key,
  saved
) {
  const fallback =
    RELATIONSHIP_LINE_DEFAULTS[key] ||
    RELATIONSHIP_LINE_DEFAULTS.other;

  if (
    !saved ||
    typeof saved !== 'object' ||
    Array.isArray(saved)
  ) {
    return { ...fallback };
  }

  const migrated = {
    ...fallback,
    ...saved
  };

  // 2026-09-28 過渡版曾把 curve 當成第五種 stroke style。
  // 現在 cleanly 拆成「線型 + curved + curveAmount」三個維度。
  if (migrated.style === 'curve') {
    migrated.style =
      key === 'exspouse'
        ? 'short-dash'
        : key === 'other'
          ? 'dot'
          : fallback.style;

    migrated.curved = true;
  }

  if (
    !['solid','short-dash','long-dash','dot']
      .includes(migrated.style)
  ) {
    migrated.style =
      fallback.style;
  }

  migrated.curved =
    typeof migrated.curved === 'boolean'
      ? migrated.curved
      : !!fallback.curved;

  migrated.curveAmount =
    Math.max(
      10,
      Math.min(
        100,
        Number(migrated.curveAmount) ||
        fallback.curveAmount ||
        50
      )
    );

  if (key === 'other') {
    migrated.bidirectional =
      !!migrated.bidirectional;
  }

  return migrated;
}

let relationshipLineSettings =
  createRelationshipLineSettings();

try {
  const rawRelationshipStyle =
    localStorage.getItem(
      REL_LINE_STYLE_KEY
    );

  if (rawRelationshipStyle) {
    const parsed =
      JSON.parse(
        rawRelationshipStyle
      );

    ['parent','spouse','exspouse','adopt','other']
      .forEach(key => {
        relationshipLineSettings[key] =
          migrateRelationshipLineSetting(
            key,
            parsed?.[key]
          );
      });

    if (
      parsed &&
      parsed.otherTypes &&
      typeof parsed.otherTypes === 'object' &&
      !Array.isArray(parsed.otherTypes)
    ) {
      Object.entries(parsed.otherTypes)
        .forEach(([type, setting]) => {
          if (
            !type ||
            !setting ||
            typeof setting !== 'object' ||
            Array.isArray(setting)
          ) {
            return;
          }

          relationshipLineSettings.otherTypes[type] =
            migrateRelationshipLineSetting(
              'other',
              setting
            );
        });
    }
  }
} catch (_) {}

// ========【拖曳歷史】 設定 - 卡片與關係標籤共用 Ctrl+Z / Ctrl+Y ========
const DRAG_HISTORY_LIMIT = 60;
const dragHistory = {
  undoStack: [],
  redoStack: [],

  push(entry) {
    if (!entry) return;
    this.undoStack.push(entry);
    if (this.undoStack.length > DRAG_HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack.length = 0;
  },

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  },

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    applyDragHistoryEntry(entry, 'before');
    this.redoStack.push(entry);
    return true;
  },

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    applyDragHistoryEntry(entry, 'after');
    this.undoStack.push(entry);
    return true;
  }
};

function cloneManualPositionMap(source) {
  const copy = {};
  Object.entries(source || {}).forEach(([id, pos]) => {
    if (!pos || typeof pos !== 'object') return;
    copy[id] = { x: Number(pos.x) || 0, y: Number(pos.y) || 0 };
  });
  return copy;
}

function captureLayoutHistoryState(fam, mode) {
  ensureFamilyLayoutShape(fam);
  return {
    freeLayout: !!fam.freeLayout[mode],
    manualPositions: cloneManualPositionMap(fam.manualPositions[mode])
  };
}

function captureLabelHistoryState(key) {
  const saved = genealogyData && genealogyData.labelPositions ? genealogyData.labelPositions[key] : null;
  return saved ? { dx: Number(saved.dx) || 0, dy: Number(saved.dy) || 0 } : null;
}

function applyDragHistoryEntry(entry, stateKey) {
  const state = entry[stateKey];
  if (!state || !genealogyData || !genealogyStore) return;

  if (entry.type === 'card-layout') {
    const fam = genealogyData.families.find(item => item.id === entry.familyId);
    if (!fam) return;

    const mutation =
      genealogyStore.setFamilyLayoutState(
        entry.familyId,
        entry.mode,
        {
          freeLayout:!!state.freeLayout,
          manualPositions:cloneManualPositionMap(state.manualPositions)
        }
      );

    applyGenealogyMutation(mutation, {
      immediateSave:true,
      render:
        genealogyData.currentFamilyId === entry.familyId &&
        viewMode === entry.mode
    });

    if (
      genealogyData.currentFamilyId === entry.familyId &&
      viewMode === entry.mode
    ) {
      updateLayoutToggle();
    }

    return;
  }

  if (entry.type === 'relationship-label') {
    const mutation =
      genealogyStore.setRelationshipLabelPosition(
        entry.key,
        state.offset || null
      );

    applyGenealogyMutation(mutation, {
      immediateSave:true
    });
  }
}

function isNativeTextUndoTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('[contenteditable="true"]')) return true;
  return !!target.closest('input, textarea, select');
}

let editingPets = [];
const petEditorState = {
  index:-1,
  avatar:null,
  avatarFrame:{ ...DEFAULT_AVATAR_FRAME }
};
let avatarCropTarget = null;
let avatarCropDraft = { ...DEFAULT_AVATAR_FRAME };
let avatarCropUrl = '';
let avatarCropPointer = null;
let avatarCropNaturalSize = { width:0, height:0 };
let avatarCropRenderMetrics = null;

function currentSimEditorPerson() {
  return simEditorState.simId
    ? genealogyData?.sims?.[
        simEditorState.simId
      ] || null
    : null;
}

function resetSimEditorDraftState() {
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

  editingPets = [];
  editingGallery = [];
}

let editingGallery = [];
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

// ========【圖片資產權威層】 設定 - genealogy.js 只保存 assetId；Blob / SHA-256 / Lazy URL 由獨立模組管理 ========
const assetStore = window.L1nGGenealogyAssets;
if (!assetStore) {
  throw new Error('找不到 L1nG 圖片資產模組。');
}

let assetStoreReady = false;
let assetRefreshRaf = 0;
const pendingResolvedAssets = new Map();

function refreshResolvedAssetDom(
  assetId,
  url
) {
  if (!assetId || !url) return;

  document
    .querySelectorAll(
      '[data-asset-id="' +
      assetId +
      '"]'
    )
    .forEach(element => {
      if (
        element instanceof
        HTMLImageElement
      ) {
        if (element.src !== url) {
          element.src = url;
        }

        element.classList.remove(
          'asset-pending'
        );
      }
    });

  document
    .querySelectorAll(
      '[data-asset-bg-id="' +
      assetId +
      '"]'
    )
    .forEach(element => {
      element.style.backgroundImage =
        'url("' + url + '")';

      element.classList.add(
        'has-image'
      );

      if (
        element.id ===
        'photoPreview'
      ) {
        element.textContent = '';
      }
    });
}

// ========【資產局部刷新】 設定 - 圖片 ready 不再重算族譜 Layout ========
function scheduleResolvedAssetRefresh(
  assetId,
  url
){
  if (assetId && url) {
    pendingResolvedAssets.set(
      String(assetId),
      String(url)
    );
  }

  if(assetRefreshRaf)return;

  assetRefreshRaf=requestAnimationFrame(()=>{
    assetRefreshRaf=0;

    const resolved =
      [...pendingResolvedAssets.entries()];

    pendingResolvedAssets.clear();

    resolved.forEach(
      ([id, assetUrl]) =>
        refreshResolvedAssetDom(
          id,
          assetUrl
        )
    );

    try{
      if(
        resolved.some(
          ([id]) =>
            id === bgSettings?.image
        )
      ){
        renderCanvasBackground();
        paintCanvasBackgroundPreview();
      }
    }catch(_){}

    try{
      const fam=currentFamily();

      if(
        fam &&
        resolved.some(
          ([id]) =>
            id === fam.coverImage
        )
      ){
        renderFamilyCover(fam);
      }
    }catch(_){}

    try{
      if(
        lifePhotoEditorDialog?.classList.contains('show') &&
        resolved.some(
          ([id]) =>
            id === lifePhotoState.editor.imageRef
        )
      ){
        lifePhotoWorkspace.refreshPreview();
      }
    }catch(_){}

    try{
      if(
        lifePhotoViewerDialog?.classList.contains('show')
      ){
        const gallery =
          lifePhotoWorkspace.viewerGallery();

        const active =
          gallery?.[lifePhotoState.viewer.index];

        if(
          active?.image &&
          resolved.some(
            ([id]) =>
              id === active.image
          )
        ){
          lifePhotoWorkspace.refreshViewer();
        }
      }
    }catch(_){}
  });
}

function isAssetId(ref) {
  return assetStore.isAssetId(ref);
}

function resolveImageUrl(ref) {
  if (!isAssetId(ref)) return '';

  const cached = assetStore.peekUrl(ref);
  if (cached) return cached;

  assetStore.getUrl(ref)
    .then(url => {
      if (url) {
        scheduleResolvedAssetRefresh(
          ref,
          url
        );
      }
    })
    .catch(error => {
      console.warn('圖片資產載入失敗：', ref, error);
    });

  return '';
}

async function saveImageAsset(blob, metadata = {}) {
  if (!assetStoreReady) {
    await assetStore.openDb();
    assetStoreReady = true;
  }
  return assetStore.importBlob(blob, metadata);
}

function clampAvatarValue(value,min,max,fallback){
    const number=Number(value);
    return Number.isFinite(number)?Math.min(max,Math.max(min,number)):fallback;
  }
  function normalizeAvatarFrame(frame){
    return {
      x:clampAvatarValue(frame?.x,0,1,DEFAULT_AVATAR_FRAME.x),
      y:clampAvatarValue(frame?.y,0,1,DEFAULT_AVATAR_FRAME.y),
      zoom:clampAvatarValue(frame?.zoom,1,3,DEFAULT_AVATAR_FRAME.zoom)
    };
  }
  function avatarFrameInlineStyle(frame){
    const f=normalizeAvatarFrame(frame);
    return [`--avatar-x:${(f.x*100).toFixed(2)}%`,`--avatar-y:${(f.y*100).toFixed(2)}%`,`--avatar-zoom:${f.zoom.toFixed(3)}`].join(';');
  }
  function applyAvatarFrameToElement(element,frame){
    if(!element)return;
    const f=normalizeAvatarFrame(frame);
    element.style.setProperty('--avatar-x',`${(f.x*100).toFixed(2)}%`);
    element.style.setProperty('--avatar-y',`${(f.y*100).toFixed(2)}%`);
    element.style.setProperty('--avatar-zoom',f.zoom.toFixed(3));
  }
  function framedAvatarImageHTML(ref,frame){
    if(!isAssetId(ref))return'';

    const url=resolveImageUrl(ref);

    return `<img class="avatar-framed-image${url?'':' asset-pending'}" data-asset-id="${esc(ref)}"${url?` src="${esc(url)}"`:''} alt="" draggable="false" decoding="async" style="${avatarFrameInlineStyle(frame)}">`;
  }
  function validateSupportedImageFile(file){
    if(!file)throw new Error(uiText('尚未選擇圖片'));
    const mime=String(file.type||'').trim().toLowerCase();
    const extension=String(file.name||'').split('.').pop().trim().toLowerCase();
    const supported=SUPPORTED_IMAGE_MIME_TYPES.includes(mime)||(!mime&&SUPPORTED_IMAGE_EXTENSIONS.includes(extension));
    if(!supported)throw new Error(uiText('僅支援 JPG / PNG / WEBP'));
    return file;
  }

let _dimsCache = { mode: null, dims: null };
let _gapsCache = { mode: null, gaps: null };

function getCardViewSettings() {
  const target = (typeof genealogyData !== 'undefined' && genealogyData) ? genealogyData : null;
  if (!target) return { ...DEFAULT_CARD_VIEW_SETTINGS };
  if (!target.meta || typeof target.meta !== 'object') target.meta = {};
  if (!target.meta.cardView || typeof target.meta.cardView !== 'object') target.meta.cardView = {};
  const current = target.meta.cardView;
  current.avatar = true;
  CARD_SETTING_FIELD_KEYS.forEach(key => {
    if (typeof current[key] !== 'boolean') current[key] = DEFAULT_CARD_VIEW_SETTINGS[key];
  });
  if (!['minimal','translucent','full'].includes(current.appearance)) current.appearance = DEFAULT_CARD_VIEW_SETTINGS.appearance;
  return current;
}

function getCardEditSettings() {
  const target = (typeof genealogyData !== 'undefined' && genealogyData) ? genealogyData : null;
  if (!target) return { ...DEFAULT_CARD_EDIT_SETTINGS };
  if (!target.meta || typeof target.meta !== 'object') target.meta = {};
  if (!target.meta.cardEdit || typeof target.meta.cardEdit !== 'object') target.meta.cardEdit = {};
  const current = target.meta.cardEdit;
  current.avatar = true;
  CARD_SETTING_FIELD_KEYS.forEach(key => {
    if (typeof current[key] !== 'boolean') current[key] = DEFAULT_CARD_EDIT_SETTINGS[key];
  });
  return current;
}

function cardViewAppearanceClass() {
  return `card-appearance-${getCardViewSettings().appearance}`;
}

function cardSettingsHasBody(settings) {
  return CARD_CONTENT_FIELD_KEYS.some(key => !!settings[key]);
}

// ========【人物呈現模型】 設定 - 畫布卡片、個人檔案與人物清單共用同一份顯示資料 ========
function personDisplayText(value, owner, draft = false) {
  if (value == null) return '';
  return draft
    ? String(value)
    : displayDataText(value, owner);
}

function buildPersonPresentation(sim, { draft = false } = {}) {
  if (!sim) return null;

  const name =
    personDisplayText(
      sim.name,
      sim,
      draft
    );

  const career =
    personDisplayText(
      sim.career,
      sim,
      draft
    );

  const residence =
    personDisplayText(
      sim.residence,
      sim,
      draft
    );

  const aspiration =
    personDisplayText(
      sim.aspiration,
      sim,
      draft
    );

  const causeOfDeath =
    personDisplayText(
      sim.causeOfDeath,
      sim,
      draft
    );

  const bio =
    personDisplayText(
      sim.bio,
      sim,
      draft
    );

  const traits =
    (sim.traits || [])
      .map(value =>
        personDisplayText(
          value,
          sim,
          draft
        )
      )
      .filter(Boolean);

  const genderValue =
    sim.gender || '其他';

  const genderIcon =
    genderValue === '男'
      ? 'gender-male'
      : genderValue === '女'
        ? 'gender-female'
        : 'gender-ambiguous';

  const statusValue =
    sim.status || '在世';

  const statusIcon =
    statusValue === '幽靈'
      ? 'ghost-symbol'
      : statusValue === '已故'
        ? 'tombstone'
        : 'heart';

  const statusClass =
    statusValue === '幽靈'
      ? 'ghost'
      : statusValue === '已故'
        ? 'dead'
        : 'alive';

  const racePreset =
    sim.race
      ? RACE_PRESETS[sim.race]
      : null;

  const birthdayText =
    sim.birthdayMonth &&
    sim.birthdayDay
      ? formatBirthdaySummary(
          sim.birthdayMonth,
          sim.birthdayDay,
          sim.birthdayYear
        )
      : uiText('生日未知');

  const ageText =
    sim.age != null &&
    sim.age !== ''
      ? (
          (document.documentElement.lang || 'zh-Hant') === 'en'
            ? `${uiText('年齡')} ${sim.age}`
            : `${sim.age} ${uiText('歲')}`
        )
      : uiText('年齡未知');

  return {
    source:sim,
    name,
    career,
    residence,
    aspiration,
    causeOfDeath,
    bio,
    traits,
    lifeStage:{
      value:sim.lifeStage || '成年',
      text:uiText(
        sim.lifeStage || '成年'
      )
    },
    gender:{
      value:genderValue,
      text:uiText(genderValue),
      icon:genderIcon
    },
    status:{
      value:statusValue,
      text:uiText(statusValue),
      icon:statusIcon,
      className:statusClass
    },
    race:racePreset
      ? {
          value:sim.race,
          text:uiText(racePreset.label),
          icon:racePreset.icon || ''
        }
      : null,
    birthdayText,
    ageText,
    avatarHtml:
      framedAvatarImageHTML(
        sim.avatar,
        sim.avatarFrame
      ) ||
      esc(
        (name || '?')
          .trim()
          .charAt(0) ||
        '?'
      )
  };
}

// ========【檢視卡片內容模型】 設定 - 版型與外觀分離，render / 尺寸計算共用同一份資料 ========
const VIEW_CARD_LAYOUT = Object.freeze({
  width:176,
  avatarSize:76,
  horizontalPadding:20,
  topPadding:12,
  bottomPadding:10,
  gap:4,
  nameFontSize:11,
  metaFontSize:10,
  nameLineHeight:13.2,
  metaLineHeight:12.5
});

function buildViewCardContentModel(sim, settings = getCardViewSettings()) {
  const presentation =
    buildPersonPresentation(sim);

  if (!presentation) {
    return {
      name:'',
      primary:[],
      details:[],
      hasText:false
    };
  }

  const name =
    settings.name
      ? `${presentation.name}${settings.gender ? formatCardGender(presentation.gender.value) : ''}`
      : '';

  const primary = [];

  if (
    !settings.name &&
    settings.gender
  ) {
    primary.push({
      text:presentation.gender.text
    });
  }

  const stageAge = [];

  if (settings.lifeStage) {
    stageAge.push(
      presentation.lifeStage.text
    );
  }

  if (
    settings.age &&
    sim.age != null &&
    sim.age !== ''
  ) {
    stageAge.push(
      formatCardAge(sim.age)
    );
  }

  if (stageAge.length) {
    primary.push({
      text:stageAge.join(' · ')
    });
  }

  if (
    settings.birthday &&
    sim.birthdayMonth &&
    sim.birthdayDay
  ) {
    primary.push({
      text:presentation.birthdayText,
      icon:'cake2'
    });
  }

  const statusRace = [];

  if (settings.status) {
    statusRace.push(
      presentation.status.text
    );
  }

  if (
    settings.race &&
    presentation.race
  ) {
    statusRace.push(
      presentation.race.text
    );
  }

  if (statusRace.length) {
    primary.push({
      text:statusRace.join(' · ')
    });
  }

  const details = [];

  if (
    settings.career &&
    presentation.career
  ) {
    details.push({
      text:presentation.career,
      detail:true
    });
  }

  if (
    settings.residence &&
    presentation.residence
  ) {
    details.push({
      text:presentation.residence,
      icon:'house',
      detail:true
    });
  }

  if (
    settings.aspiration &&
    presentation.aspiration
  ) {
    details.push({
      text:presentation.aspiration,
      icon:'bullseye',
      detail:true
    });
  }

  if (
    settings.traits &&
    presentation.traits.length
  ) {
    details.push({
      text:presentation.traits.join(' / '),
      detail:true
    });
  }

  if (
    settings.pets ||
    settings.gallery
  ) {
    const mediaBits = [];

    if (
      settings.pets &&
      (sim.pets || []).length
    ) {
      mediaBits.push(
        `${uiText('寵物')} ${(sim.pets || []).length}`
      );
    }

    if (
      settings.gallery &&
      (sim.gallery || []).length
    ) {
      mediaBits.push(
        `${uiText('人生照片')} ${(sim.gallery || []).length}`
      );
    }

    if (mediaBits.length) {
      details.push({
        text:mediaBits.join(' · ')
      });
    }
  }

  return {
    name,
    primary,
    details,
    hasText:!!(
      name ||
      primary.length ||
      details.length
    )
  };
}

function renderViewCardLine(line) {
  const className = `person-card-view-meta${line.detail ? ' person-card-view-text' : ''}`;
  const title = line.text ? ` title="${esc(line.text)}"` : '';
  const body = line.icon
    ? `${iconSvg(line.icon)}<span>${esc(line.text)}</span>`
    : esc(line.text);

  return `<div class="${className}"${title}>${body}</div>`;
}

function estimateWrappedRows(text, maxWidth, fontSize) {
  const value = String(text || '').trim();
  if (!value) return 0;

  return Math.max(
    1,
    Math.ceil(
      measureText(value, fontSize) /
      Math.max(24, maxWidth)
    )
  );
}

function estimateViewCardHeight(sim, settings) {
  const model = buildViewCardContentModel(sim, settings);
  if (!model.hasText) return 100;

  const innerWidth =
    VIEW_CARD_LAYOUT.width -
    VIEW_CARD_LAYOUT.horizontalPadding;

  let height =
    VIEW_CARD_LAYOUT.topPadding +
    VIEW_CARD_LAYOUT.avatarSize +
    VIEW_CARD_LAYOUT.gap;

  if (model.name) {
    height +=
      estimateWrappedRows(
        model.name,
        innerWidth,
        VIEW_CARD_LAYOUT.nameFontSize
      ) *
      VIEW_CARD_LAYOUT.nameLineHeight;

    height += VIEW_CARD_LAYOUT.gap;
  }

  [...model.primary, ...model.details].forEach(line => {
    const lineWidth =
      Math.max(
        24,
        innerWidth - (line.icon ? 18 : 0)
      );

    height +=
      estimateWrappedRows(
        line.text,
        lineWidth,
        VIEW_CARD_LAYOUT.metaFontSize
      ) *
      VIEW_CARD_LAYOUT.metaLineHeight;

    height += VIEW_CARD_LAYOUT.gap;
  });

  return Math.max(
    100,
    Math.ceil(
      height +
      VIEW_CARD_LAYOUT.bottomPadding
    )
  );
}

function getViewCardDimensions(settings) {
  let maxHeight = 100;
  let hasVisibleText = false;

  if (genealogyData?.families?.length && genealogyData?.sims) {
    const family = currentFamily();
    const visibleIds = family
      ? getVisibleIds(family.id)
      : new Set();

    visibleIds.forEach(id => {
      const sim = genealogyData.sims[id];
      if (!sim) return;

      const model =
        buildViewCardContentModel(
          sim,
          settings
        );

      hasVisibleText =
        hasVisibleText ||
        model.hasText;

      maxHeight =
        Math.max(
          maxHeight,
          estimateViewCardHeight(
            sim,
            settings
          )
        );
    });
  }

  if (!hasVisibleText && !cardSettingsHasBody(settings)) {
    return { W:100, H:100 };
  }

  return {
    W:VIEW_CARD_LAYOUT.width,
    H:maxHeight
  };
}

function getDims() {
  if (viewMode === 'edit') {
    const settings = getCardEditSettings();
    const bodyRows = [
      settings.name || settings.gender,
      settings.lifeStage || settings.age,
      settings.birthday,
      settings.status || settings.race,
      settings.career,
      settings.residence,
      settings.aspiration,
      settings.traits,
      settings.pets,
      settings.gallery
    ].filter(Boolean).length;

    if (!bodyRows) return { W:92, H:92 };

    return {
      W:NODE_DIMS.edit.W,
      H:Math.max(
        98,
        30 + Math.max(64, bodyRows * 18)
      )
    };
  }

  return getViewCardDimensions(
    getCardViewSettings()
  );
}

// ========【單張卡片尺寸】 設定 - 檢視卡依自己的內容增高；全域高度只保留給世代安全間距 ========
function getNodeDimensions(sim) {
  if (viewMode === 'view' && sim) {
    return {
      W:VIEW_CARD_LAYOUT.width,
      H:estimateViewCardHeight(
        sim,
        getCardViewSettings()
      )
    };
  }

  return getDims();
}

function getNodeDimensionsById(id) {
  return getNodeDimensions(
    id && genealogyData && genealogyData.sims
      ? genealogyData.sims[id]
      : null
  );
}

function getGaps() {
  return GAPS[viewMode] || GAPS.view;
}

function getCurrentManualPositions(fam) {
  if (!fam.manualPositions) return {};
  return fam.manualPositions[viewMode] || {};
}
function getCurrentFreeLayout(fam) {
  if (!fam.freeLayout || typeof fam.freeLayout !== 'object') return false;
  return !!fam.freeLayout[viewMode];
}
function ensureFamilyLayoutShape(fam) {
  return !!(
    fam &&
    fam.manualPositions &&
    typeof fam.manualPositions === 'object' &&
    fam.manualPositions.view &&
    typeof fam.manualPositions.view === 'object' &&
    fam.manualPositions.edit &&
    typeof fam.manualPositions.edit === 'object' &&
    fam.freeLayout &&
    typeof fam.freeLayout === 'object' &&
    typeof fam.freeLayout.view === 'boolean' &&
    typeof fam.freeLayout.edit === 'boolean' &&
    typeof fam.locked === 'boolean'
  );
}

function ensureFamilyProfileShape(fam) {
  return !!(
    fam &&
    typeof fam === 'object' &&
    typeof fam.bio === 'string' &&
    Object.prototype.hasOwnProperty.call(
      fam,
      'coverImage'
    )
  );
}

function formatCardGender(gender) {
  const text = uiText(gender || '其他');
  return (document.documentElement.lang || 'zh-Hant') === 'en' ? `(${text})` : `（${text}）`;
}

function formatCardAge(age) {
  if (age == null || age === '') return '';
  return (document.documentElement.lang || 'zh-Hant') === 'en' ? `${age} ${uiText('歲')}` : `${age} ${uiText('歲')}`;
}


// ========【預設資料】 基準語言：繁體中文（zh-Hant） ========
// 簡體中文與英文僅作顯示翻譯；預設資料的 canonical source 永遠保留繁體中文。
function buildSample() {
  const sims = {};

  // ========【預設 EA NPC 範例】 設定 - 取自 2026-09-27 遊戲匯出；家庭只保留指定 EA Household ========
  // Household 選單固定為：
  // 史賓瑟．金．路易斯 / 朗德古拉伯 / 高斯 / 伊藤 / 維托 / 達榮
  // sims 額外保留這 22 位 Household 成員實際 genealogy 連得到的 family-tree-only 節點，
  // 讓 EA 族譜 / 大家族在預設資料中也能維持完整關係，不把祖先節點硬塞成 Household 成員。
  const sampleRealDateBySim = {
    "944092612642014825":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2008,"month":3,"day":1},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":18,"months":7,"days":4,"displayValue":18,"displayUnit":"years"}},
    "944092612642014826":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1959,"month":9,"day":10},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":67,"months":0,"days":25,"displayValue":67,"displayUnit":"years"}},
    "944092612642014827":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2002,"month":9,"day":22},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":24,"months":0,"days":13,"displayValue":24,"displayUnit":"years"}},
    "944092612642014828":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1943,"month":2,"day":14},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":83,"months":7,"days":21,"displayValue":83,"displayUnit":"years"}},
    "944092612642014829":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2018,"month":1,"day":11},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":8,"months":8,"days":24,"displayValue":8,"displayUnit":"years"}},
    "944092612642081636":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1994,"month":12,"day":6},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":31,"months":9,"days":29,"displayValue":31,"displayUnit":"years"}},
    "944092612642081637":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1965,"month":3,"day":16},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":61,"months":6,"days":19,"displayValue":61,"displayUnit":"years"}},
    "944092612642081638":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2011,"month":1,"day":15},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":15,"months":8,"days":20,"displayValue":15,"displayUnit":"years"}},
    "944092612642081639":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2015,"month":8,"day":27},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":11,"months":1,"days":8,"displayValue":11,"displayUnit":"years"}},
    "944092612642084275":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1990,"month":3,"day":4},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":36,"months":7,"days":1,"displayValue":36,"displayUnit":"years"}},
    "944092612642085336":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1981,"month":6,"day":30},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":45,"months":3,"days":5,"displayValue":45,"displayUnit":"years"}},
    "944092612642085337":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1974,"month":6,"day":16},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":52,"months":3,"days":19,"displayValue":52,"displayUnit":"years"}},
    "944092612642085338":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2009,"month":9,"day":25},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":17,"months":0,"days":10,"displayValue":17,"displayUnit":"years"}},
    "944092612642294749":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1998,"month":8,"day":30},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":28,"months":1,"days":5,"displayValue":28,"displayUnit":"years"}},
    "944092612642294750":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2002,"month":7,"day":12},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":24,"months":2,"days":23,"displayValue":24,"displayUnit":"years"}},
    "944092612642563314":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1989,"month":3,"day":11},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":37,"months":6,"days":24,"displayValue":37,"displayUnit":"years"}},
    "944092612642563315":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1996,"month":3,"day":1},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":30,"months":7,"days":4,"displayValue":30,"displayUnit":"years"}},
    "944092612642563316":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2013,"month":1,"day":23},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":13,"months":8,"days":12,"displayValue":13,"displayUnit":"years"}},
    "944092612642563317":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2016,"month":5,"day":15},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":10,"months":4,"days":20,"displayValue":10,"displayUnit":"years"}},
    "944092612642774243":{"source":"RealDate","runtimeActive":true,"birthday":{"year":1945,"month":3,"day":9},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":81,"months":6,"days":26,"displayValue":81,"displayUnit":"years"}},
    "944092612642774244":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2008,"month":9,"day":21},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":18,"months":0,"days":14,"displayValue":18,"displayUnit":"years"}},
    "944092612642774245":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2009,"month":1,"day":13},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":17,"months":8,"days":22,"displayValue":17,"displayUnit":"years"}},
    "944092612642774246":{"source":"RealDate","runtimeActive":true,"birthday":{"year":2017,"month":7,"day":14},"currentDate":{"year":2026,"month":10,"day":5},"age":{"years":9,"months":2,"days":21,"displayValue":9,"displayUnit":"years"}}
  };

  const rows = [
["944092612642014825","路易斯埃里克","男","青年","在世","human","柳溪 / 扁柏街道","豪宅大王",["物質主義","貪吃鬼","自信"],"",["944092612642014826"],["944092612642014827"],[],"944092612642014824","史賓瑟．金．路易斯","full",[],[],2008,3,1,18],
["944092612642014826","路易斯薇薇安","女","老年","在世","human","柳溪 / 扁柏街道","快樂大家庭",["歡樂","以家庭為重","美食家"],"",[],[],[],"944092612642014824","史賓瑟．金．路易斯","full",[],[],1959,9,10,67],
["944092612642014827","史賓瑟．金艾莉絲","女","青年","在世","human","柳溪 / 扁柏街道","非凡畫家",["創意","幼稚","熱愛戶外"],"",["944092612642014828"],["944092612642014825"],[],"944092612642014824","史賓瑟．金．路易斯","full",[],[],2002,9,22,24],
["944092612642014828","金姆丹尼斯","男","老年","在世","human","柳溪 / 扁柏街道","顯赫家世",["整潔","完美主義者","熱愛戶外"],"",[],[],[],"944092612642014824","史賓瑟．金．路易斯","full",[],[],1943,2,14,83],
["944092612642014829","金．路易斯奧莉維亞","女","兒童","在世","human","柳溪 / 扁柏街道","藝術天才",["傻瓜"],"小學生",["944092612642014825","944092612642014827"],[],[],"944092612642014824","史賓瑟．金．路易斯","full",[],[],2018,1,11,8],
["944092612642081636","高斯貝拉","女","青年","在世","human","柳溪 / 歐菲莉亞維拉","派對動物",["浪漫","良好","以家庭為重"],"特務",[],["944092612642081637"],[],"944092612642081635","高斯","full",[],[],1994,12,6,31],
["944092612642081637","高斯摩提梅爾","男","成年","在世","human","柳溪 / 歐菲莉亞維拉","文藝復興模擬市民",["外向","書呆子","創意"],"寫作",["944092612650249528"],["944092612642081636"],[],"944092612642081635","高斯","full",[],[],1965,3,16,61],
["944092612642081638","高斯卡珊多拉","女","青少年","在世","human","柳溪 / 歐菲莉亞維拉","音樂天才",["創意","陰沉"],"高中學生",["944092612642081637","944092612642081636"],[],[],"944092612642081635","高斯","full",[],[],2011,1,15,15],
["944092612642081639","高斯亞歷山大","男","兒童","在世","human","柳溪 / 歐菲莉亞維拉","神童",["書呆子"],"小學生",["944092612642081637","944092612642081636"],[],[],"944092612642081635","高斯","full",[],[],2015,8,27,11],
["944092612642084275","傑思強尼","男","青年","在世","human","綠洲之泉 / 鬆散的灌木","喜劇之王",["傻瓜","外向","雄心壯志"],"演藝人員",["944092612642085336","944092612642085337"],[],[],"944092612642084274","傑斯","full",[],[],1990,3,4,36],
["944092612642085336","朗德古拉伯傑佛瑞","男","成年","在世","human","綠洲之泉 / 阿福伊斯塔豪宅","顯赫家世",["良好","以家庭為重","外向"],"特務",[],["944092612642085337"],[],"944092612642085335","朗德古拉伯","full",[],[],1981,6,30,45],
["944092612642085337","朗德古拉伯萳西","女","成年","在世","human","綠洲之泉 / 阿福伊斯塔豪宅","家財萬萬貫",["物質主義","諂媚勢利","雄心壯志"],"罪犯",[],["944092612642085336"],[],"944092612642085335","朗德古拉伯","full",[],[],1974,6,16,52],
["944092612642085338","朗德古拉伯麥克倫","男","青少年","在世","human","綠洲之泉 / 阿福伊斯塔豪宅","全民公敵",["諂媚勢利","邪惡"],"高中學生",["944092612642085336","944092612642085337"],[],[],"944092612642085335","朗德古拉伯","full",[],[],2009,9,25,17],
["944092612642294749","維托莉莉絲","女","青年","在世","vampire","遺忘山谷 / 附子草莊園","吸血鬼家族",["外向","創意","好動"],"",["944092612650249533"],[],[],"944092612642294748","維托","full",[],[],1998,8,30,28],
["944092612642294750","維托迦勒","男","青年","在世","vampire","遺忘山谷 / 附子草莊園","善良吸血鬼",["美食家","雄心壯志","物質主義"],"",["944092612650249533"],[],[],"944092612642294748","維托","full",[],[],2002,7,12,24],
["944092612642563314","伊藤直樹","男","青年","在世","human","木漏隙光山 / 2-5-1 若葉森","顯赫家世",["物質主義","刻薄","以家庭為重"],"商業",[],["944092612642563315"],[],"944092612642563313","伊藤","full",[],[],1989,3,11,37],
["944092612642563315","伊藤惠","女","青年","在世","human","木漏隙光山 / 2-5-1 若葉森","極限運動愛好者",["愛冒險","體面","雄心壯志"],"商業",[],["944092612642563314"],[],"944092612642563313","伊藤","full",[],[],1996,3,1,30],
["944092612642563316","伊藤清","男","青少年","在世","human","木漏隙光山 / 2-5-1 若葉森","極限運動愛好者",["愛冒險","浪漫"],"",["944092612642563314","944092612642563315"],[],[],"944092612642563313","伊藤","full",[],[],2013,1,23,13],
["944092612642563317","伊藤七海","女","兒童","在世","human","木漏隙光山 / 2-5-1 若葉森","天生好動",["偷竊狂"],"小學生",["944092612642563314","944092612642563315"],[],[],"944092612642563313","伊藤","full",[],[],2016,5,15,10],
["944092612642774243","達榮阿德科亞","男","老年","在世","human","昂達里昂 / 丹貝萊宮殿","暢銷作家",["書呆子","雄心壯志","完美主義者"],"",["944092612650249517","944092612650249518"],["944092612650249519"],[],"944092612642774242","達榮","full",[],[],1945,3,9,81],
["944092612642774244","達榮賈瓦拉","女","青年","在世","human","昂達里昂 / 丹貝萊宮殿","快樂大家庭",["雄心壯志","良好","以家庭為重"],"貴族",["944092612642774243","944092612650249519"],[],[],"944092612642774242","達榮","full",[],[],2008,9,21,18],
["944092612642774245","達榮阿瑪拉奇","女","青少年","在世","human","昂達里昂 / 丹貝萊宮殿","非凡畫家",["藝術愛好者","創意"],"高中學生",["944092612642774244"],[],[],"944092612642774242","達榮","full",[],[],2009,1,13,17],
["944092612642774246","達榮歐比","男","兒童","在世","human","昂達里昂 / 丹貝萊宮殿","神童",["天才"],"小學生",["944092612642774244"],[],[],"944092612642774242","達榮","full",[],[],2017,7,14,9],
["944092612650249511","莉娜．達榮","女","成年","在世","human","","",[],"",["944092612650249520"],["944092612650249512"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249512","賽夫．達榮","男","成年","在世","human","","",[],"",[],["944092612650249511"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249513","達麗拉．德里莫","女","成年","在世","human","","",[],"",["944092612650249511","944092612650249512"],["944092612650249514"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249514","戴維斯．德里莫","男","成年","在世","human","","",[],"",[],["944092612650249513"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249515","達倫．德里莫","男","成年","在世","human","","",[],"",["944092612650249513","944092612650249514"],["944092612650249516"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249516","達琳．德里莫","女","成年","在世","human","","",[],"",[],["944092612650249515"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249517","阿德．達榮","男","成年","在世","human","","",[],"",["944092612650249520"],["944092612650249518"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249518","艾尼歐拉．達榮","女","成年","在世","human","","",[],"",[],["944092612650249517"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249519","伊曼尼．達榮","女","成年","在世","human","","",[],"",[],["944092612642774243"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249520","未知","女","成年","在世","human","","",[],"",[],[],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249528","可妮莉雅．高斯","女","成年","在世","human","","",[],"",["944092612650249529","944092612650249530"],[],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249529","普魯登斯．克蘭普巴頓","女","成年","在世","human","","",[],"",[],["944092612650249530"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249530","賽門．克蘭普巴頓","男","成年","在世","human","","",[],"",[],["944092612650249529"],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249533","喬伊婭．瓦托雷","女","成年","在世","human","","",[],"",["944092612650249534"],[],[],null,"","family_tree_only",[],[],null,null,null,null],
["944092612650249534","維托里歐．帕斯夸萊","男","成年","在世","human","","",[],"",[],[],[],null,"","family_tree_only",[],[],null,null,null,null]
  ];

  rows.forEach(([
    id,name,gender,lifeStage,status,race,residence,aspiration,traits,career,
    parentIds,spouseIds,exSpouseIds,householdId,householdName,recordState,
    adoptedParentIds,adoptedChildIds,birthdayYear,birthdayMonth,birthdayDay,age
  ]) => {
    const realDate = sampleRealDateBySim[id]
      ? JSON.parse(JSON.stringify(sampleRealDateBySim[id]))
      : null;

    sims[id] = {
      id,name,gender,lifeStage,status,race,residence,aspiration,
      causeOfDeath:'',
      pets:[],
      gallery:[],
      birthdayYear:realDate?.birthday?.year ?? birthdayYear,
      birthdayMonth:realDate?.birthday?.month ?? birthdayMonth,
      birthdayDay:realDate?.birthday?.day ?? birthdayDay,
      age:realDate?.age?.years ?? age,
      parentIds,
      spouseIds,
      exSpouseIds,
      traits,
      career,
      bio:'',
      order:0,
      avatar:null,
      gameData:{
        simId:id,
        householdId,
        householdName,
        recordState,
        adoptedParentIds,
        adoptedChildIds,
        fianceIds:[],
        steadyPartnerIds:[],
        deceasedSpouseIds:[],
        realDate,
        entityClass:
          recordState === 'family_tree_only'
            ? 'family_tree_only'
            : householdId
              ? 'household'
              : 'unassigned_npc'
      }
    };
  });

  const makeHousehold = (id, name, memberIds, bio, gameData) => ({
    id,
    name,
    memberIds:[...memberIds],
    bio,
    coverImage:null,
    freeLayout:{ view:false, edit:false },
    manualPositions:{ view:{}, edit:{} },
    locked:false,
    gameImport:true,
    gameData:{
      ...gameData,
      householdMemberIds:[...memberIds],
      petIds:[]
    }
  });

  const families = [
    makeHousehold(
      'sample_hh_944092612642014824',
      '史賓瑟．金．路易斯',
      ['944092612642014825','944092612642014826','944092612642014827','944092612642014828','944092612642014829'],
      '好吧，以下是詳細分解：丹尼斯．金和莉迪亞．史賓瑟生了一個女兒叫做艾莉絲．史賓瑟．金，然後離婚了。艾莉絲嫁給艾瑞克．路易斯，然後有了她自己的女兒奧莉維亞．金．路易斯。他們和艾莉絲的父親（還記得丹尼斯吧？）和艾瑞克的母親薇薇安．路易斯一起住。喂，可從沒人說過家庭這回事很簡單！',
      { householdId:'944092612642014824', homeZoneId:'944092612642014166', worldId:'2474553381', neighborhoodId:'944092612642013589', regionId:'8086', lotName:'扁柏街道', worldName:'', neighborhoodName:'柳溪', hidden:false, isActiveHousehold:true, isPlayedHousehold:true, isPlayerHousehold:true }
    ),
    makeHousehold(
      'sample_hh_944092612642085335',
      '朗德古拉伯',
      ['944092612642085336','944092612642085337','944092612642085338'],
      '朗德古拉伯一家似乎家庭美滿、有錢、有禮且勇敢。但萳西和傑佛瑞似乎隱藏著什麼。他們的秘密會讓他們走向陌路，還是會讓他們繼續建立起屬於自己的富裕王朝？',
      { householdId:'944092612642085335', homeZoneId:'944092612642084491', worldId:'1185542770', neighborhoodId:'944092612642084078', regionId:'15740', lotName:'阿福伊斯塔豪宅', worldName:'', neighborhoodName:'綠洲之泉', hidden:false, isActiveHousehold:false, isPlayedHousehold:false, isPlayerHousehold:false }
    ),
    makeHousehold(
      'sample_hh_944092612642081635',
      '高斯',
      ['944092612642081636','944092612642081637','944092612642081638','944092612642081639'],
      '高斯是懷著貴族氣息，被陰鬱圍繞的家族。夾在摩提梅爾所寫的恐怖故事與貝拉的神祕消失之間，卡珊多拉與亞歷山大會不會也同樣長大成為陰沉的人？',
      { householdId:'944092612642081635', homeZoneId:'944092612642081327', worldId:'2280805822', neighborhoodId:'944092612642013589', regionId:'8086', lotName:'歐菲莉亞維拉', worldName:'', neighborhoodName:'柳溪', hidden:false, isActiveHousehold:false, isPlayedHousehold:false, isPlayerHousehold:false }
    ),
    makeHousehold(
      'sample_hh_944092612642563313',
      '伊藤',
      ['944092612642563314','944092612642563315','944092612642563316','944092612642563317'],
      '伊藤惠從小在千葉町長大。身為金牌滑雪運動員，她希望讓自己的兒女也有相同的成長環境，但過往戀情的記憶卻可能令她分神。伊藤直樹也是拿過獎牌的運動員。身為充滿算計的商人，他打造木漏隙光山的願景極具爭議，包括更多觀光人潮、更多錢，以及更多現代化舉措。七海和清皆有著父母的運動天賦，但他們的心卻另繫他方…七海只想當個孩子，而清則迷戀起坡道外的其他事物…',
      { householdId:'944092612642563313', homeZoneId:'944092612642562894', worldId:'1491052508', neighborhoodId:'944092612642496440', regionId:'246370', lotName:'2-5-1 若葉森', worldName:'', neighborhoodName:'木漏隙光山', hidden:false, isActiveHousehold:false, isPlayedHousehold:false, isPlayerHousehold:false }
    ),
    makeHousehold(
      'sample_hh_944092612642294748',
      '維托',
      ['944092612642294749','944092612642294750'],
      '維托家的兄弟姐妹幾年前搬進遺忘山谷並努力讓遺忘山谷成為他們的家。這有時並不容易，因位他們和弗拉德勞斯．斯特勞處得不是很好，但被問到這點時，他們只提到他們對烹飪的品味不太相同。',
      { householdId:'944092612642294748', homeZoneId:'944092612642294464', worldId:'3950992577', neighborhoodId:'944092612642294034', regionId:'146196', lotName:'附子草莊園', worldName:'', neighborhoodName:'遺忘山谷', hidden:false, isActiveHousehold:false, isPlayedHousehold:false, isPlayerHousehold:false }
    ),
    makeHousehold(
      'sample_hh_944092612642774242',
      '達榮',
      ['944092612642774243','944092612642774244','944092612642774245','944092612642774246'],
      '「團結帶來力量」是達榮家族的家訓。他們也確實世世代代同心一體……但這真能永遠持續嗎？年邁的世家首領阿德科亞，自女兒賈瓦拉年幼時，便夢想她有朝一日成為女王。多年來，她也證明自己是絕佳人選，透過慈善事業在全王國贏得青睞。她登上王冠的道路似乎正一路順遂，直到丈夫猝不及防的早逝。彷彿這還不夠，隨著她的人氣日漸高漲，越來越多好事之徒開始打探達榮家，追究這個看似完美的家族是否真的毫無醜聞可言。挑戰接踵而來之際，賈瓦拉仍奮勇向前，集結摯愛家族的力量，支撐她在爭奪王冠的競逐中挺進。',
      { householdId:'944092612642774242', homeZoneId:'944092612642773392', worldId:'312126436', neighborhoodId:'944092612642770511', regionId:'487001', lotName:'丹貝萊宮殿', worldName:'', neighborhoodName:'昂達里昂', hidden:false, isActiveHousehold:false, isPlayedHousehold:false, isPlayerHousehold:false }
    )
  ];

  return {
    version:1,
    meta:{
      sample:true,
      sampleLanguage:'zh-Hant',
      sampleVersion:5,
      sampleSource:'ea-npc-20260927',
      gameImport:true,
      sourceFormat:'l1ng-genealogy',
      sourceSchemaVersion:1,
      exporterVersion:'0.4.3-runtime-test',
      targetGameVersion:'1.128',
      gameLocale:'zh-tw',
      exportedAt:'2026-09-27T05:26:55.970318+08:00',
      realDateCurrentDate:{ year:2026, month:10, day:5 },
      cardView:{ ...DEFAULT_CARD_VIEW_SETTINGS },
      cardEdit:{ ...DEFAULT_CARD_EDIT_SETTINGS }
    },
    sims,
    families,
    links:[],
    relationshipTypeLibrary:[],
    relationshipMap:{},
    labelPositions:{},
    currentFamilyId:families[0].id
  };
}

let genealogyData = null, scale = 1;
let panX = 0, panY = 0;

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

// ========【畫布視角狀態】 設定 - 自動 Fit 與手動視角分離，viewport 改變時保留正確中心 ========
let canvasViewState = 'fit';
let viewportResizeObserver = null;
let viewportResizeRaf = null;
let lastViewportSize = { width:0, height:0 };

// 自由排列工具：選取 / 框選與畫布拖曳分離。
let arrangeTool = 'pan';
const selectedNodeIds = new Set();
let spacePanHeld = false;
let marqueeState = null;

const $ = id => document.getElementById(id);
const viewport = $('genealogyCanvasViewport'), stage = $('genealogyCanvasStage'), svg = $('genealogyRelationshipLayer'), nodes = $('genealogyPersonLayer');
const labelsSvg = $('genealogyRelationshipLabelLayer');
const mask = $('simEditorDialog'), personLibraryDialog = $('personLibraryDialog'), appearanceDialog = $('appearanceDialog');
const storageDialog = $('storageDialog');
const familyMemberPickerDialog = $('familyMemberPickerDialog');
const helpDialog = $('helpDialog');
const personProfileDialog = $('personProfileDialog');
const petEditorDialog = $('petEditorDialog');
const avatarCropDialog = $('avatarCropDialog');
const lifePhotoEditorDialog = $('lifePhotoEditorDialog');
const lifePhotoViewerDialog = $('lifePhotoViewerDialog');
const exportDialog = $('exportDialog');
const exportCloseBtn = $('exportCloseBtn');
const exportImageBtn = $('exportImageBtn');
const exportJsonBtn = $('exportJsonBtn');
const familyNameInput = $('familyName'), familySelect = $('familySelect');
const statusFilterInputs = [...document.querySelectorAll('input[name="statusFilter"]')];
const genderFilterInputs = [...document.querySelectorAll('input[name="genderFilter"]')];
const raceFilterInputs = [...document.querySelectorAll('input[name="raceFilter"]')];
const lifeStageFilterInputs = [...document.querySelectorAll('input[name="lifeStageFilter"]')];
const personLibrarySearch = $('personLibrarySearch');
const modeToggle = $('modeToggle');
const selectToolBtn = $('selectToolBtn');
const panToolBtn = $('panToolBtn');
const arrangeToolDivider = $('arrangeToolDivider');
const arrangeToolDividerEnd = $('arrangeToolDividerEnd');
const selectionMarquee = $('selectionMarquee');
const personCardMenu = $('personCardContextMenu');
const labelLockToggle = $('labelLockToggle');
const relationshipPerspectiveBtn = $('relationshipPerspectiveBtn');
const sidebar = $('sidebar');
const sidebarResizer = $('sidebarResizer');
const sidebarBackdrop = $('sidebarBackdrop');
const menuToggle = $('menuToggle');
const smartGuideVertical = $('smartGuideVertical');
const smartGuideHorizontal = $('smartGuideHorizontal');
const smartSpacingHorizontal = $('smartSpacingHorizontal');
const smartSpacingVertical = $('smartSpacingVertical');
const appearanceThemeGrid = $('appearanceThemeGrid');
const customColor1 = $('customColor1');
const customColor2 = $('customColor2');
const appearanceCustomThemePreview = $('appearanceCustomThemePreview');
const lifePhotoGrid = $('lifePhotoGrid');

// ========【家族名稱輸入】 設定 - 固定導覽欄位、虛線只跟著文字寬度 ========
const _familyNameMeasureCanvas = document.createElement('canvas');
const _familyNameMeasureContext = _familyNameMeasureCanvas.getContext('2d');

function syncFamilyNameInputWidth() {
  if (!familyNameInput || !_familyNameMeasureContext) return;

  const editor = familyNameInput.closest('.family-name-editor');
  const identity = familyNameInput.closest('.family-identity');

  if (!editor || !identity) return;

  const inputStyle = getComputedStyle(familyNameInput);
  const fontWeight = inputStyle.fontWeight || '700';
  const fontSize = inputStyle.fontSize || '18px';
  const fontFamily = inputStyle.fontFamily || 'sans-serif';

  _familyNameMeasureContext.font =
    `${fontWeight} ${fontSize} ${fontFamily}`;

  const source =
    familyNameInput.value ||
    familyNameInput.placeholder ||
    '';

  const measured = Math.ceil(
    _familyNameMeasureContext.measureText(source).width + 18
  );

  const elementWidth = element => {
    if (!element) return 0;
    return element.getBoundingClientRect().width || element.offsetWidth || 0;
  };

  const gapWidth = element => {
    if (!element) return 0;

    const style = getComputedStyle(element);
    const value = parseFloat(
      style.columnGap && style.columnGap !== 'normal'
        ? style.columnGap
        : style.gap
    );

    return Number.isFinite(value) ? value : 0;
  };

  const editButton =
    editor.querySelector('.family-name-edit-btn');

  const familySwitch =
    identity.querySelector('.nav-select-family');

  const fixedInsideIdentity =
    elementWidth(editButton) +
    elementWidth(familySwitch) +
    gapWidth(editor) +
    gapWidth(identity);

  const identityWidth =
    identity.clientWidth ||
    identity.getBoundingClientRect().width ||
    0;

  // family-identity 本身已經由 Flex 自動扣除右側家族管理按鈕，
  // 這裡只扣 identity 內部的鉛筆、家族切換箭頭與兩層 gap。
  // 因此長名稱可以使用真正剩餘的最大寬度，不再被手機版重複預留空間。
  const availableWidth =
    identityWidth > 0
      ? Math.max(
          68,
          Math.floor(identityWidth - fixedInsideIdentity)
        )
      : measured;

  const width =
    Math.max(
      68,
      Math.min(
        availableWidth,
        measured
      )
    );

  familyNameInput.style.width = `${width}px`;
}

let familyNameWidthSyncRaf = 0;
function scheduleFamilyNameInputWidthSync() {
  if (familyNameWidthSyncRaf) return;

  familyNameWidthSyncRaf = requestAnimationFrame(() => {
    familyNameWidthSyncRaf = 0;
    syncFamilyNameInputWidth();
  });
}

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const pairKey = (a,b) => [a,b].sort().join('::');

// ========【UI 圖示】 專案 SVG 自動解析 ========
const ICON_ASSET_BASE = '../../html%20icons/';

const iconSvg = (name, extra = '') => {
  const safe = String(name || '').replace(/[^a-z0-9-]/gi, '');
  if (!safe) return '';

  const extraClass = extra ? ` ${extra}` : '';

  return `<span
    class="l1ng-icon icon-${safe}${extraClass}"
    style="--l1ng-icon:url('${ICON_ASSET_BASE}${safe}.svg')"
    aria-hidden="true"
  ></span>`;
};

function setIconText(el, iconName, text) {
  if (!el) return;
  el.innerHTML = `${iconSvg(iconName)}<span>${esc(text)}</span>`;
}

// ========【頂部自訂下拉選單】 設定 - 取代瀏覽器原生 select 展開介面 ========
const navSelectControls = new Map();

function familyNavLanguage() {
  const lang = document.documentElement.lang || 'zh-Hant';
  return String(lang).toLowerCase().startsWith('en')
    ? 'en'
    : String(lang).toLowerCase().includes('hans') || String(lang).toLowerCase().includes('cn')
      ? 'zh-Hans'
      : 'zh-Hant';
}

function familyNavModeAria(mode) {
  const lang = familyNavLanguage();

  if (lang === 'en') {
    if (mode === 'household') return 'EA Household';
    if (mode === 'ea') return 'EA Tree';
    return 'Extended Family';
  }

  if (lang === 'zh-Hans') {
    if (mode === 'household') return 'EA 家庭';
    if (mode === 'ea') return 'EA 族谱';
    return '大家族';
  }

  if (mode === 'household') return 'EA 家庭';
  if (mode === 'ea') return 'EA 族譜';
  return '大家族';
}

function familyNavTabMarkup(mode) {
  const lang = familyNavLanguage();

  if (lang === 'en') {
    const label =
      mode === 'household'
        ? 'EA HOUSEHOLD'
        : mode === 'ea'
          ? 'EA TREE'
          : 'EXTENDED FAMILY';

    return '<span class="family-nav-tab-label-en">' + label + '</span>';
  }

  if (mode === 'household') {
    return '<span class="family-nav-tab-lines">' +
      '<span class="family-nav-tab-ea">EA</span>' +
      '<span>家</span><span>庭</span>' +
      '</span>';
  }

  if (mode === 'ea') {
    return '<span class="family-nav-tab-lines">' +
      '<span class="family-nav-tab-ea">EA</span>' +
      '<span>族</span>' +
      '<span>' + (lang === 'zh-Hans' ? '谱' : '譜') + '</span>' +
      '</span>';
  }

  return '<span class="family-nav-tab-lines">' +
    '<span>大</span><span>家</span><span>族</span>' +
    '</span>';
}

// ========【家族選擇器分流】 設定 - EA 家庭 / EA 原生族譜範圍 / 完整大家族分開 ========
function familyGenealogyNeighborIds(sim) {
  if (!sim) return [];

  return [
    ...(sim.parentIds || []),
    ...(sim.spouseIds || []),
    ...(sim.gameData?.adoptedParentIds || []),
    ...(sim.gameData?.adoptedChildIds || []),
    ...(sim.gameData?.deceasedSpouseIds || [])
  ]
    .map(String)
    .filter(Boolean);
}

function familyLineageParentIds(sim) {
  return genealogyParentIds(sim);
}

function familyLineageChildIds(simId) {
  if (!simId) return [];

  const childIds = getChildrenOf(String(simId))
    .map(sim => String(sim.id));

  const adoptedChildIds =
    genealogyData.sims[String(simId)]?.gameData?.adoptedChildIds || [];

  return [...new Set([
    ...childIds,
    ...adoptedChildIds.map(String)
  ])]
    .filter(id => genealogyData.sims[id]);
}

function familyDisplaySpouseIds(sim) {
  if (!sim) return [];

  return [...new Set([
    ...(sim.spouseIds || []),
    ...(sim.gameData?.deceasedSpouseIds || [])
  ].map(String))]
    .filter(id => genealogyData.sims[id]);
}

function stableFamilyComponentKey(memberIds) {
  const source = [...memberIds].map(String).sort().join('|');
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `component_${memberIds.length}_${(hash >>> 0).toString(16)}`;
}

function familySourceSeedIds(fam) {
  if (!fam) return [];

  const householdIds =
    Array.isArray(fam.gameData?.householdMemberIds)
      ? fam.gameData.householdMemberIds.map(String).filter(id => genealogyData.sims[id])
      : [];

  if (householdIds.length) return householdIds;

  return (fam.memberIds || [])
    .map(String)
    .filter(id => genealogyData.sims[id]);
}

function buildHouseholdEntries() {
  if (!genealogyData || !Array.isArray(genealogyData.families)) return [];

  return genealogyData.families
    .map((fam, index) => {
      const imported = !!fam.gameImport;
      const memberIds =
        imported
          ? familySourceSeedIds(fam)
          : (fam.memberIds || []).map(String).filter(id => genealogyData.sims[id]);

      if (!memberIds.length) return null;

      return {
        mode:'household',
        value:`household:${fam.id}`,
        familyId:fam.id,
        labelFamily:fam,
        label:displayDataText(fam.name, fam),
        memberIds:[...memberIds],
        primaryMemberIds:[...memberIds],
        sourceFamilyIds:[fam.id],
        sortIndex:index
      };
    })
    .filter(Boolean);
}

function collectEaTreeScope(seedIds) {
  const seeds =
    [...new Set(
      seedIds
        .map(String)
        .filter(id =>
          genealogyData.sims[id]
        )
    )];

  if (!seeds.length) {
    return {
      coreIds:[],
      visibleIds:[]
    };
  }

  // coreIds = 目前族譜真正的血緣主幹。
  // 配偶只在最後加入 visibleIds，不反過來把自己的家系擴張進 core。
  const coreIds =
    new Set(seeds);

  let frontier =
    new Set(seeds);

  for (
    let depth = 0;
    depth < 5 && frontier.size;
    depth += 1
  ) {
    const next =
      new Set();

    frontier.forEach(id => {
      familyLineageParentIds(
        genealogyData.sims[id]
      ).forEach(parentId => {
        if (!coreIds.has(parentId)) {
          next.add(parentId);
        }
      });
    });

    next.forEach(id =>
      coreIds.add(id)
    );

    frontier = next;
  }

  frontier =
    new Set(seeds);

  for (
    let depth = 0;
    depth < 5 && frontier.size;
    depth += 1
  ) {
    const next =
      new Set();

    frontier.forEach(id => {
      familyLineageChildIds(id)
        .forEach(childId => {
          if (!coreIds.has(childId)) {
            next.add(childId);
          }
        });
    });

    next.forEach(id =>
      coreIds.add(id)
    );

    frontier = next;
  }

  const visibleIds =
    new Set(coreIds);

  coreIds.forEach(id => {
    familyDisplaySpouseIds(
      genealogyData.sims[id]
    ).forEach(spouseId => {
      visibleIds.add(spouseId);
    });
  });

  return {
    coreIds:[...coreIds],
    visibleIds:[...visibleIds]
  };
}

function collectEaTreeRange(seedIds) {
  return collectEaTreeScope(
    seedIds
  ).visibleIds;
}

function setsOverlap(a, b) {
  if (!a || !b) return false;

  for (const value of a) {
    if (b.has(value)) return true;
  }

  return false;
}

function splitHouseholdIntoEaTreeSeedGroups(seedIds) {
  const seeds = [...new Set(seedIds.map(String).filter(id => genealogyData.sims[id]))];
  if (!seeds.length) return [];

  const treeBySeed = new Map(
    seeds.map(id => [id, new Set(collectEaTreeRange([id]))])
  );

  const parent = new Map(seeds.map(id => [id, id]));

  const find = id => {
    let root = id;

    while (parent.get(root) !== root) {
      root = parent.get(root);
    }

    let cursor = id;
    while (parent.get(cursor) !== cursor) {
      const next = parent.get(cursor);
      parent.set(cursor, root);
      cursor = next;
    }

    return root;
  };

  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);

    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  };

  seeds.forEach((a, index) => {
    seeds.slice(index + 1).forEach(b => {
      if (setsOverlap(treeBySeed.get(a), treeBySeed.get(b))) {
        union(a, b);
      }
    });
  });

  const groups = new Map();

  seeds.forEach(id => {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(id);
  });

  return [...groups.values()];
}

function splitVisibleFamilyMembersByRenderedEdges(memberIds) {
  const visibleIds = [...new Set(
    (memberIds || [])
      .map(String)
      .filter(id => genealogyData.sims[id])
  )];

  if (!visibleIds.length) return [];

  const visibleSet = new Set(visibleIds);
  const adjacency = new Map(
    visibleIds.map(id => [id, new Set()])
  );

  const connect = (aRaw, bRaw) => {
    const a = String(aRaw);
    const b = String(bRaw);

    if (a === b || !visibleSet.has(a) || !visibleSet.has(b)) return;

    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
  };

  visibleIds.forEach(id => {
    const sim = genealogyData.sims[id];
    if (!sim) return;

    (sim.parentIds || []).forEach(parentId => connect(id, parentId));
    (sim.spouseIds || []).forEach(spouseId => connect(id, spouseId));
    (sim.exSpouseIds || []).forEach(spouseId => connect(id, spouseId));
  });

  const seen = new Set();
  const components = [];

  visibleIds.forEach(startId => {
    if (seen.has(startId)) return;

    const stack = [startId];
    const component = [];
    seen.add(startId);

    while (stack.length) {
      const id = stack.pop();
      component.push(id);

      adjacency.get(id).forEach(relatedId => {
        if (seen.has(relatedId)) return;
        seen.add(relatedId);
        stack.push(relatedId);
      });
    }

    components.push(component);
  });

  return components;
}

function eaTreeEntryLabel(fam, seedIds, splitCount) {
  const base = displayDataText(fam.name, fam);
  if (splitCount <= 1) return base;

  const names = seedIds
    .map(id => genealogyData.sims[id])
    .filter(Boolean)
    .map(sim => displayDataText(sim.name, sim))
    .filter(Boolean)
    .slice(0, 2);

  return names.length
    ? `${base} · ${names.join(' / ')}`
    : base;
}

function buildEaTreeEntries() {
  if (!genealogyData || !Array.isArray(genealogyData.families)) return [];

  const entries = [];

  genealogyData.families.forEach((fam, familyIndex) => {
    if (!fam) return;

    if (!fam.gameImport) {
      const memberIds = (fam.memberIds || []).map(String).filter(id => genealogyData.sims[id]);
      if (!memberIds.length) return;

      entries.push({
        mode:'ea',
        value:`ea:manual:${fam.id}`,
        familyId:fam.id,
        labelFamily:fam,
        label:displayDataText(fam.name, fam),
        memberIds,
        primaryMemberIds:[...memberIds],
        sourceFamilyIds:[fam.id],
        sortIndex:familyIndex
      });
      return;
    }

    const householdSeedIds = familySourceSeedIds(fam);
    const seedGroups = splitHouseholdIntoEaTreeSeedGroups(householdSeedIds);
    const branches = [];

    seedGroups.forEach(seedGroup => {
      const treeScope =
        collectEaTreeScope(seedGroup);

      const visibleIds =
        treeScope.visibleIds;

      const primarySet =
        new Set(treeScope.coreIds);

      if (!visibleIds.length) return;

      const renderedComponents =
        splitVisibleFamilyMembersByRenderedEdges(visibleIds);

      renderedComponents.forEach(componentIds => {
        const componentSet = new Set(componentIds);
        const branchSeedIds =
          seedGroup.filter(seedId => componentSet.has(seedId));

        // EA 族譜的每一個選單項目都必須以至少一位 Household 成員為入口。
        // 純粹因資料補充出現、但和入口畫面完全斷開的孤島不建立額外項目。
        if (!branchSeedIds.length) return;

        branches.push({
          seedIds:branchSeedIds,
          memberIds:componentIds,
          primaryMemberIds:
            componentIds.filter(id =>
              primarySet.has(id)
            )
        });
      });
    });

    branches.forEach((branch, branchIndex) => {
      entries.push({
        mode:'ea',
        value:`ea:${fam.id}:${stableFamilyComponentKey(branch.memberIds)}`,
        familyId:fam.id,
        labelFamily:fam,
        label:eaTreeEntryLabel(fam, branch.seedIds, branches.length),
        memberIds:branch.memberIds,
        primaryMemberIds:
          [...branch.primaryMemberIds],
        seedIds:[...branch.seedIds],
        sourceFamilyIds:[fam.id],
        sortIndex:familyIndex + branchIndex / 100
      });
    });
  });

  return entries.sort((a, b) => a.sortIndex - b.sortIndex);
}

function buildExtendedFamilyComponents() {
  if (!genealogyData || !genealogyData.sims || !Array.isArray(genealogyData.families)) return [];

  const allIds = Object.keys(genealogyData.sims);
  const adjacency = new Map(allIds.map(id => [id, new Set()]));

  allIds.forEach(id => {
    familyGenealogyNeighborIds(genealogyData.sims[id]).forEach(rawRelatedId => {
      const relatedId = String(rawRelatedId);
      if (!adjacency.has(relatedId)) return;
      adjacency.get(id).add(relatedId);
      adjacency.get(relatedId).add(id);
    });
  });

  const components = [];
  const seen = new Set();

  allIds.forEach(startId => {
    if (seen.has(startId)) return;

    const stack = [startId];
    const memberIds = [];
    seen.add(startId);

    while (stack.length) {
      const id = stack.pop();
      memberIds.push(id);

      adjacency.get(id).forEach(relatedId => {
        if (seen.has(relatedId)) return;
        seen.add(relatedId);
        stack.push(relatedId);
      });
    }

    components.push({
      key:stableFamilyComponentKey(memberIds),
      memberIds:memberIds.sort()
    });
  });

  const importedFamilies = genealogyData.families.filter(fam => fam && fam.gameImport);
  const manualFamilies = genealogyData.families.filter(fam => fam && !fam.gameImport);
  const familyIndex = new Map(genealogyData.families.map((fam, index) => [fam.id, index]));

  const componentEntries = components
    .filter(component => component.memberIds.length > 1)
    .map(component => {
      const memberSet = new Set(component.memberIds);
      const sourceFamilies = importedFamilies.filter(fam =>
        familySourceSeedIds(fam).some(id => memberSet.has(id))
      );

      if (!sourceFamilies.length) return null;

      const anchorFamily =
        [...sourceFamilies]
          .sort((a, b) => {
            const aScore = familySourceSeedIds(a).filter(id => memberSet.has(id)).length;
            const bScore = familySourceSeedIds(b).filter(id => memberSet.has(id)).length;

            return (
              bScore - aScore ||
              (familyIndex.get(a.id) ?? 0) - (familyIndex.get(b.id) ?? 0)
            );
          })[0] ||
        sourceFamilies[0];

      const anchorScope =
        collectEaTreeScope(
          familySourceSeedIds(
            anchorFamily
          )
        );

      const primaryMemberIds =
        anchorScope.coreIds
          .filter(id =>
            memberSet.has(id)
          );

      return {
        mode:'extended',
        value:`extended:${component.key}`,
        componentKey:component.key,
        familyId:anchorFamily.id,
        labelFamily:anchorFamily,
        label:displayDataText(anchorFamily.name, anchorFamily),
        memberIds:component.memberIds,
        primaryMemberIds:
          primaryMemberIds.length
            ? primaryMemberIds
            : familySourceSeedIds(anchorFamily)
                .filter(id =>
                  memberSet.has(id)
                ),
        sourceFamilyIds:sourceFamilies.map(fam => fam.id),
        sortIndex:Math.min(...sourceFamilies.map(fam => familyIndex.get(fam.id) ?? Number.MAX_SAFE_INTEGER))
      };
    })
    .filter(Boolean);

  const manualEntries = manualFamilies
    .map(fam => {
      const memberIds = (fam.memberIds || []).map(String).filter(id => genealogyData.sims[id]);
      if (!memberIds.length) return null;

      return {
        mode:'extended',
        value:`manual:${fam.id}`,
        componentKey:null,
        familyId:fam.id,
        labelFamily:fam,
        label:displayDataText(fam.name, fam),
        memberIds,
        primaryMemberIds:[...memberIds],
        sourceFamilyIds:[fam.id],
        sortIndex:familyIndex.get(fam.id) ?? Number.MAX_SAFE_INTEGER
      };
    })
    .filter(Boolean);

  return [...componentEntries, ...manualEntries]
    .sort((a, b) => a.sortIndex - b.sortIndex);
}

function getFamilySelectorEntries(mode = familyTreeViewMode) {
  if (!genealogyData || !Array.isArray(genealogyData.families)) return [];

  if (mode === 'household') return buildHouseholdEntries();
  if (mode === 'ea') return buildEaTreeEntries();
  return buildExtendedFamilyComponents();
}

function getFamilyTreeSelectionValue(mode) {
  if (mode === 'household') return familyTreeHouseholdSelectionValue;
  if (mode === 'ea') return familyTreeEaSelectionValue;
  return familyTreeExtendedSelectionValue;
}

function setFamilyTreeSelectionValue(mode, value) {
  if (mode === 'household') familyTreeHouseholdSelectionValue = value;
  else if (mode === 'ea') familyTreeEaSelectionValue = value;
  else familyTreeExtendedSelectionValue = value;
}

function findBestFamilySelectorEntry(fam, entries) {
  if (!entries.length) return null;
  if (!fam) return entries[0];

  const directSource = entries.find(entry =>
    (entry.sourceFamilyIds || []).includes(fam.id)
  );

  if (directSource) return directSource;

  const seedSet = new Set(familySourceSeedIds(fam));

  return (
    [...entries]
      .map(entry => ({
        entry,
        score:(entry.memberIds || []).reduce(
          (total, id) => total + (seedSet.has(id) ? 1 : 0),
          0
        )
      }))
      .sort((a, b) =>
        b.score - a.score ||
        a.entry.sortIndex - b.entry.sortIndex
      )[0]?.entry ||
    entries[0]
  );
}

function getActiveFamilySelectorEntry(mode = familyTreeViewMode) {
  const entries = getFamilySelectorEntries(mode);
  if (!entries.length) return null;

  const selectedValue = getFamilyTreeSelectionValue(mode);
  let entry = entries.find(item => item.value === selectedValue);

  if (!entry) {
    entry = findBestFamilySelectorEntry(currentFamily(), entries);
    setFamilyTreeSelectionValue(mode, entry?.value || null);
  }

  return entry || null;
}

function currentTreeFamily() {
  const fam =
    currentFamily();

  if (!fam) return fam;

  const entry =
    getActiveFamilySelectorEntry(
      familyTreeViewMode
    );

  if (
    !entry ||
    !(entry.memberIds || []).length
  ) {
    return fam;
  }

  return {
    ...fam,
    memberIds:
      [...entry.memberIds],
    primaryMemberIds:
      Array.isArray(
        entry.primaryMemberIds
      )
        ? [...entry.primaryMemberIds]
        : [...entry.memberIds]
  };
}

function setFamilyTreeViewMode(mode, control = null) {
  const nextMode =
    mode === 'household' || mode === 'ea'
      ? mode
      : 'extended';

  if (nextMode === familyTreeViewMode) {
    if (control) {
      syncFamilyNavTabsPortal(control);
      positionFamilyNavTabsPortal(control);
    }
    return;
  }

  const previousFamily = currentFamily();

  if (previousFamily) {
    familyTreeLastSourceFamilyId = previousFamily.id;
  }

  familyTreeViewMode = nextMode;

  try {
    localStorage.setItem(FAMILY_TREE_VIEW_MODE_KEY, familyTreeViewMode);
  } catch (_) {}

  const entries = getFamilySelectorEntries(familyTreeViewMode);
  const sourceFamily =
    familyTreeLastSourceFamilyId
      ? genealogyData.families.find(fam => fam.id === familyTreeLastSourceFamilyId)
      : previousFamily;

  const selected = findBestFamilySelectorEntry(sourceFamily || previousFamily, entries);

  setFamilyTreeSelectionValue(
    familyTreeViewMode,
    selected?.value || null
  );

  if (selected?.familyId && genealogyData.families.some(fam => fam.id === selected.familyId)) {
    genealogyData.currentFamilyId = selected.familyId;
  }

  dragHistory.clear();
  clearNodeSelection();
  resetPersonLibraryOperations({ batch:false, add:true });
  resetFamilyMemberOperations();

  save();
  refreshFamilyUI();
  render();

  requestAnimationFrame(() => {
    // 只更新左側索引位置；切換分類不重新計算右側 dropdown 幾何。
    if (control && control.host.classList.contains('open')) {
      positionFamilyNavTabsPortal(control);
    }
    fitScreen();
  });
}

function ensureFamilyNavTabsPortal(control) {
  if (!control || control.select.id !== 'familySelect') return null;

  const portal =
    control.familyTabsPortal ||
    document.getElementById('familyNavTabs');

  if (!portal) return null;

  control.familyTabsPortal = portal;

  portal.querySelectorAll('.family-nav-index-tab').forEach(button => {
    if (button.dataset.familyNavBound === '1') return;

    button.dataset.familyNavBound = '1';

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      setFamilyTreeViewMode(
        button.dataset.familyTreeViewMode,
        control
      );
    });
  });

  return portal;
}

function syncFamilyNavTabsPortal(control) {
  if (!control || control.select.id !== 'familySelect') return;

  const portal = ensureFamilyNavTabsPortal(control);
  if (!portal) return;

  portal.querySelectorAll('.family-nav-index-tab').forEach(button => {
    const mode = button.dataset.familyTreeViewMode;
    const active = mode === familyTreeViewMode;

    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute('aria-label', familyNavModeAria(mode));
    button.title = familyNavModeAria(mode);
    button.innerHTML = familyNavTabMarkup(mode);
  });
}

function hideFamilyNavTabsPortal(control) {
  if (!control || !control.familyTabsPortal) return;
  control.familyTabsPortal.style.display = 'none';
}

function positionFamilyNavTabsPortal(control) {
  if (!control || control.select.id !== 'familySelect') return;
  if (!control.host.classList.contains('open')) {
    hideFamilyNavTabsPortal(control);
    return;
  }

  const portal = ensureFamilyNavTabsPortal(control);
  if (!portal || control.menu.parentElement !== document.body) return;

  if (portal.parentElement !== document.body) {
    document.body.appendChild(portal);
  }

  syncFamilyNavTabsPortal(control);

  const menuRect = control.menu.getBoundingClientRect();
  const tabWidth = 52;

  portal.style.display = 'flex';
  portal.style.top = Math.round(menuRect.top) + 'px';
  portal.style.left = Math.max(2, Math.round(menuRect.left - tabWidth + 1)) + 'px';
}


function getNavSelectDisplayText(select, option) {
  if (!select || !option) return '';
  if (select.id === 'languageSelect') {
    const nativeNames = { 'zh-Hant':'繁中', 'zh-Hans':'简中', en:'EN' };
    return nativeNames[option.value] || option.textContent || option.value;
  }
  return option.textContent || option.value || '';
}

function getNavSelectControlByHost(host) {
  for (const control of navSelectControls.values()) {
    if (control.host === host) return control;
  }
  return null;
}

function restoreFamilyNavSelectMenu(control) {
  if (!control || control.select.id !== 'familySelect') return;

  const { host, menu } = control;

  if (menu.parentElement !== host) {
    host.appendChild(menu);
  }

  const portal = ensureFamilyNavTabsPortal(control);
  if (portal && portal.parentElement !== host) {
    host.appendChild(portal);
  }

  menu.classList.remove('family-nav-portal');
  menu.style.removeProperty('left');
  menu.style.removeProperty('top');
  menu.style.removeProperty('width');
  menu.style.removeProperty('max-width');
  menu.style.removeProperty('max-height');
  menu.style.removeProperty('--family-menu-rows');

  hideFamilyNavTabsPortal(control);
}

function positionFamilyNavSelectMenu(control) {
  if (!control || control.select.id !== 'familySelect') return;

  const { trigger, menu } = control;
  const items = [...menu.querySelectorAll('.nav-select-option')];

  if (!items.length) return;

  if (menu.parentElement !== document.body) {
    document.body.appendChild(menu);
  }

  menu.classList.add('family-nav-portal');

  const rect = trigger.getBoundingClientRect();
  const margin = 10;
  const gap = 6;
  const itemHeight = 32;
  const availableHeight = Math.max(
    itemHeight,
    window.innerHeight - rect.bottom - gap - margin
  );

  const rows = Math.max(
    1,
    Math.min(
      items.length,
      Math.floor(availableHeight / itemHeight)
    )
  );

  menu.style.setProperty('--family-menu-rows', String(rows));
  menu.style.top = `${Math.round(rect.bottom + gap)}px`;
  menu.style.left = `${Math.max(margin, Math.round(rect.left))}px`;
  menu.style.maxHeight = `${Math.floor(availableHeight)}px`;
  menu.style.maxWidth = `${Math.max(180, window.innerWidth - Math.max(margin, rect.left) - margin)}px`;
  positionFamilyNavTabsPortal(control);
}

function closeNavSelect(host) {
  if (!host) return;

  const control = getNavSelectControlByHost(host);
  if (control) restoreFamilyNavSelectMenu(control);

  host.classList.remove('open');

  const trigger = host.querySelector('.nav-select-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function closeAllNavSelects(exceptHost = null) {
  navSelectControls.forEach(control => {
    if (control.host !== exceptHost) closeNavSelect(control.host);
  });
}

function syncNavSelectControl(selectId) {
  const control = navSelectControls.get(selectId);
  if (!control) return;
  const { select, host, trigger, valueEl, menu } = control;
  if (!select || !host || !trigger || !valueEl || !menu) return;

  const options = [...select.options];
  const selected = options.find(option => option.value === select.value) || options[0] || null;
  valueEl.textContent = selected ? getNavSelectDisplayText(select, selected) : '';
  valueEl.title = valueEl.textContent;

  menu.innerHTML = options.map(option => {
    const selectedClass = option.value === select.value ? ' selected' : '';
    const label = getNavSelectDisplayText(select, option);
    return `<button type="button" class="nav-select-option${selectedClass}" role="option" aria-selected="${option.value === select.value ? 'true' : 'false'}" data-nav-value="${esc(option.value)}" title="${esc(label)}">${esc(label)}</button>`;
  }).join('');

  if (selectId === 'familySelect') syncFamilyNavTabsPortal(control);

  menu.querySelectorAll('.nav-select-option').forEach(optionButton => {
    optionButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const nextValue = optionButton.dataset.navValue ?? '';
      if (select.value !== nextValue) {
        select.value = nextValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncNavSelectControl(selectId);
      closeNavSelect(host);
      trigger.focus();
    });
  });
}

function syncAllNavSelectControls() {
  navSelectControls.forEach((_, selectId) => syncNavSelectControl(selectId));
}

function setupTopbarNavSelects() {
  document.querySelectorAll('.nav-select[data-nav-select-for]').forEach(host => {
    const selectId = host.dataset.navSelectFor;
    const select = document.getElementById(selectId);
    const trigger = host.querySelector('.nav-select-trigger');
    const valueEl = host.querySelector('.nav-select-value');
    const menu = host.querySelector('.nav-select-menu');
    if (!select || !trigger || !valueEl || !menu) return;

    const control = { select, host, trigger, valueEl, menu };
    navSelectControls.set(selectId, control);

    trigger.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const isOpen = host.classList.contains('open');
      if (isOpen) {
        closeNavSelect(host);
        return;
      }

      closeAllNavSelects(host);
      host.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      syncNavSelectControl(selectId);

      requestAnimationFrame(() => {
        if (selectId === 'familySelect') {
          positionFamilyNavSelectMenu(control);
        }

        const current =
          menu.querySelector('.nav-select-option.selected') ||
          menu.querySelector('.nav-select-option');

        if (current) current.focus({ preventScroll:true });
      });
    });

    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!host.classList.contains('open')) trigger.click();
      }
    });

    menu.addEventListener('keydown', event => {
      const items = [...menu.querySelectorAll('.nav-select-option')];
      const index = items.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNavSelect(host);
        trigger.focus();
      } else if (event.key === 'ArrowDown' && items.length) {
        event.preventDefault();
        items[(index + 1 + items.length) % items.length].focus();
      } else if (event.key === 'ArrowUp' && items.length) {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length].focus();
      }
    });

    if (selectId === 'familySelect') {
      menu.addEventListener('wheel', event => {
        const maxScrollLeft = Math.max(0, menu.scrollWidth - menu.clientWidth);
        if (maxScrollLeft <= 1) return;

        let delta =
          Math.abs(event.deltaY) >= Math.abs(event.deltaX)
            ? event.deltaY
            : event.deltaX;

        if (!delta) return;

        if (event.deltaMode === 1) {
          delta *= 32;
        } else if (event.deltaMode === 2) {
          delta *= Math.max(180, menu.clientWidth);
        }

        const before = menu.scrollLeft;
        const next = Math.max(
          0,
          Math.min(maxScrollLeft, before + delta)
        );

        if (Math.abs(next - before) < 0.5) return;

        event.preventDefault();
        menu.scrollLeft = next;
      }, { passive:false });
    }

    select.addEventListener('change', () => syncNavSelectControl(selectId));
    syncNavSelectControl(selectId);
  });

  document.addEventListener('click', event => {
    const inside = event.target.closest && event.target.closest('.nav-select');
    closeAllNavSelects(inside || null);
  });

  window.addEventListener('resize', debounce(() => {
    const control = navSelectControls.get('familySelect');
    if (!control || !control.host.classList.contains('open')) return;

    positionFamilyNavSelectMenu(control);
  }, 60));
}


// ========【共用 HTML 彈窗】 設定 - 取代瀏覽器原生 alert / confirm / prompt ========
let _uiDialogResolve = null;
let _uiDialogMode = 'alert';

function closeUiDialog(result = null) {
  const overlay = $('confirmationDialog');
  if (!overlay || !overlay.classList.contains('show')) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  const resolve = _uiDialogResolve;
  _uiDialogResolve = null;
  if (resolve) resolve(result);
}

function openUiDialog({
  title = '提示',
  message = '',
  mode = 'alert',
  kind = 'default',
  defaultValue = '',
  confirmText = '確定',
  cancelText = '取消'
} = {}) {
  const overlay = $('confirmationDialog');
  const dialog = $('uiDialog');
  const titleEl = $('uiDialogTitle');
  const messageEl = $('uiDialogMessage');
  const inputEl = $('uiDialogInput');
  const cancelBtn = $('uiDialogCancel');
  const confirmBtn = $('uiDialogConfirm');
  const closeBtn = $('uiDialogClose');

  if (!overlay || !dialog || !titleEl || !messageEl || !inputEl || !cancelBtn || !confirmBtn || !closeBtn) {
    return Promise.resolve(mode === 'confirm' ? false : mode === 'prompt' ? null : true);
  }

  if (_uiDialogResolve) closeUiDialog(null);
  _uiDialogMode = mode;
  titleEl.textContent = uiText(title);
  // 先嘗試翻譯完整訊息，讓跨行確認文案與動態樣式能一次正確處理；
  // 若沒有完整對應，再逐行翻譯，避免英文介面殘留繁中文字。
  const rawMessage = String(message ?? '');
  const wholeMessage = uiText(rawMessage);
  messageEl.textContent = wholeMessage !== rawMessage
    ? wholeMessage
    : rawMessage.split('\n').map(line => uiText(line)).join('\n');
  dialog.dataset.kind = kind;
  // 讓 CSS 能只針對「兩顆按鈕」的確認 / 輸入彈窗置中，不影響單按鈕提示。
  dialog.dataset.actionCount = mode === 'alert' ? '1' : '2';
  confirmBtn.textContent = uiText(confirmText);
  cancelBtn.textContent = uiText(cancelText);
  cancelBtn.style.display = mode === 'alert' ? 'none' : '';
  inputEl.classList.toggle('show', mode === 'prompt');
  inputEl.value = mode === 'prompt' ? uiText(defaultValue) : '';

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');

  return new Promise(resolve => {
    _uiDialogResolve = resolve;

    const finishConfirm = () => {
      if (mode === 'prompt') closeUiDialog(inputEl.value);
      else closeUiDialog(true);
    };
    const finishCancel = () => closeUiDialog(mode === 'confirm' ? false : null);

    confirmBtn.onclick = finishConfirm;
    cancelBtn.onclick = finishCancel;
    closeBtn.onclick = finishCancel;
    overlay.onclick = event => {
      if (event.target === overlay) finishCancel();
    };
    inputEl.onkeydown = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finishConfirm();
      }
    };

    requestAnimationFrame(() => {
      if (mode === 'prompt') {
        inputEl.focus();
        inputEl.select();
      } else if (mode === 'confirm' && kind === 'danger') {
        // 危險操作預設聚焦「取消」，避免鍵盤 Enter / Space 誤觸確認。
        cancelBtn.focus();
      } else {
        confirmBtn.focus();
      }
    });
  });
}

function uiAlert(message, options = {}) {
  return openUiDialog({
    title: options.title || '提示',
    message,
    mode: 'alert',
    kind: options.kind || 'default',
    confirmText: options.confirmText || '確定'
  });
}

function uiConfirm(message, options = {}) {
  return openUiDialog({
    title: options.title || '請確認',
    message,
    mode: 'confirm',
    kind: options.kind || 'default',
    confirmText: options.confirmText || '確定',
    cancelText: options.cancelText || '取消'
  });
}

function uiPrompt(message, defaultValue = '', options = {}) {
  return openUiDialog({
    title: options.title || '輸入資料',
    message,
    mode: 'prompt',
    kind: options.kind || 'default',
    defaultValue,
    confirmText: options.confirmText || '確定',
    cancelText: options.cancelText || '取消'
  });
}

function uiToast(message, duration = 2600) {
  const region = $('toastRegion');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = 'ui-toast';
  toast.textContent = uiText(message);
  region.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    toast.style.transition = 'opacity .18s ease, transform .18s ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}


document.addEventListener('keydown', event => {
  const overlay = $('confirmationDialog');
  if (!overlay || !overlay.classList.contains('show')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeUiDialog(_uiDialogMode === 'confirm' ? false : null);
  }
});


function debounce(fn, ms = 150) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

function currentFamily() {
  return genealogyData.families.find(f => f.id === genealogyData.currentFamilyId) || genealogyData.families[0];
}

// ========【頂部人物篩選】 設定 - 同類多選 OR、跨類別 AND ========
function checkedTopbarFilterValues(inputs) {
  return new Set(
    inputs
      .filter(input => input.checked)
      .map(input => input.value)
      .filter(Boolean)
  );
}

function getTopbarFilterState() {
  return {
    status:checkedTopbarFilterValues(statusFilterInputs),
    gender:checkedTopbarFilterValues(genderFilterInputs),
    race:checkedTopbarFilterValues(raceFilterInputs),
    lifeStage:checkedTopbarFilterValues(lifeStageFilterInputs)
  };
}

function topbarFilterGroupMatches(selectedValues, inputs, value) {
  // 全部勾選代表「此分類不限制」；取消部分選項後，才依勾選項目進行 OR 篩選。
  if (selectedValues.size === inputs.length) return true;

  return selectedValues.has(value || '');
}

function simMatchesTopbarFilters(sim) {
  if (!sim) return false;

  const filters = getTopbarFilterState();

  if (!topbarFilterGroupMatches(filters.status, statusFilterInputs, sim.status)) return false;
  if (!topbarFilterGroupMatches(filters.gender, genderFilterInputs, sim.gender)) return false;
  if (!topbarFilterGroupMatches(filters.race, raceFilterInputs, sim.race)) return false;
  if (!topbarFilterGroupMatches(filters.lifeStage, lifeStageFilterInputs, sim.lifeStage)) return false;

  return true;
}

function updateTopbarFilterUI() {
  const groups = [
    [statusFilterInputs, checkedTopbarFilterValues(statusFilterInputs)],
    [genderFilterInputs, checkedTopbarFilterValues(genderFilterInputs)],
    [raceFilterInputs, checkedTopbarFilterValues(raceFilterInputs)],
    [lifeStageFilterInputs, checkedTopbarFilterValues(lifeStageFilterInputs)]
  ];

  const excludedCount = groups.reduce(
    (total, [inputs, selectedValues]) =>
      total + Math.max(0, inputs.length - selectedValues.size),
    0
  );

  const button = $('topbarFilterBtn');
  const countEl = $('topbarFilterCount');

  if (button) button.classList.toggle('active', excludedCount > 0);

  if (countEl) {
    countEl.hidden = excludedCount === 0;
    countEl.textContent = excludedCount ? `· ${excludedCount}` : '';
  }
}

// ========【預設資料翻譯】 設定 - 繁中為唯一基準；只翻譯內建範例既有值 ========
// ========【預設資料翻譯】 設定 - 繁中為唯一基準；只翻譯內建範例既有值 ========
const BUILTIN_SAMPLE_REFERENCE = buildSample();
const BUILTIN_SAMPLE_SIM_IDS = new Set(
  Object.keys(BUILTIN_SAMPLE_REFERENCE.sims)
);
const BUILTIN_SAMPLE_FAMILY_IDS = new Set(
  BUILTIN_SAMPLE_REFERENCE.families.map(family => family.id)
);

// 只有內建 EA NPC 範例自己的文字可以跟著內建翻譯走。
// 目前 EA NPC 名稱 / Household 名稱以這份 zh-TW 遊戲匯出為 canonical；
// 沒有對應翻譯時就保留遊戲原文，不去猜測或自動改寫 NPC 名稱。
const BUILTIN_SAMPLE_TEXT_VALUES = new Set([
  ...BUILTIN_SAMPLE_REFERENCE.families.map(family => family.name),
  ...Object.values(BUILTIN_SAMPLE_REFERENCE.sims).flatMap(sim => [
    sim.name,
    sim.residence,
    sim.aspiration,
    sim.career,
    ...(sim.traits || [])
  ])
].filter(Boolean));

function uiText(value) {
  const text = String(value ?? '');
  if (typeof LING_I18N !== 'undefined' && LING_I18N.translate) return LING_I18N.translate(text);
  return text;
}

function isBuiltinSampleSim(sim) {
  return !!(
    sim &&
    genealogyData?.meta?.sample === true &&
    BUILTIN_SAMPLE_SIM_IDS.has(sim.id)
  );
}

function isBuiltinSampleFamily(family) {
  return !!(
    family &&
    genealogyData?.meta?.sample === true &&
    BUILTIN_SAMPLE_FAMILY_IDS.has(family.id)
  );
}

function displayDataText(value, owner = null) {
  const text = String(value ?? '');
  const isBuiltInOwner =
    owner &&
    (
      isBuiltinSampleSim(owner) ||
      isBuiltinSampleFamily(owner)
    );

  if (
    isBuiltInOwner &&
    BUILTIN_SAMPLE_TEXT_VALUES.has(text)
  ) {
    return uiText(text);
  }

  return text;
}

const BUILTIN_RELATION_LABELS =
  new Set([
    ...Object.values(RELATIONSHIP_SEMANTICS)
      .map(item => item.label),
    '親子 / 收養',
    ...Object.keys(SOCIAL_RELATIONSHIP_DEFINITIONS),
    ...KINSHIP_SYSTEM_LABELS
  ]);

function displayRelationshipText(value) {
  const text = String(value ?? '');

  // 系統語意與親屬稱謂會跟著介面語言切換；
  // 玩家自己輸入的其他關係名稱維持原文。
  return BUILTIN_RELATION_LABELS.has(text)
    ? uiText(text)
    : text;
}


// ========【其他關係詞庫】 設定 - 內建詞彙與玩家自訂詞彙分離；自訂詞彙跟著族譜資料保存 ========
function builtInSocialRelationshipTypes() {
  return Object.keys(
    SOCIAL_RELATIONSHIP_DEFINITIONS
  );
}

function isBuiltInSocialRelationshipType(value) {
  return Object.prototype.hasOwnProperty.call(
    SOCIAL_RELATIONSHIP_DEFINITIONS,
    String(value || '').trim()
  );
}

function normalizeRelationshipTypeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function relationshipTypeLibraryValues(db = genealogyData) {
  if (!db) return [];

  return Array.isArray(
    db.relationshipTypeLibrary
  )
    ? db.relationshipTypeLibrary
        .map(normalizeRelationshipTypeText)
        .filter(Boolean)
    : [];
}

function relationshipTypeOptions() {
  const builtIn =
    builtInSocialRelationshipTypes()
      .map(value => ({
        value,
        label:
          displayRelationshipText(
            value
          ),
        custom:false
      }));

  const custom =
    relationshipTypeLibraryValues()
      .filter(value =>
        !isBuiltInSocialRelationshipType(
          value
        )
      )
      .map(value => ({
        value,
        label:value,
        custom:true
      }));

  return [
    ...builtIn,
    ...custom
  ];
}

function populateRelationshipTypePicker(
  selectedValue = ''
) {
  const select =
    $('relationshipType');

  if (!select) return;

  const selected =
    normalizeRelationshipTypeText(
      selectedValue
    );

  const options =
    relationshipTypeOptions();

  if (
    selected &&
    !options.some(
      option =>
        option.value === selected
    )
  ) {
    options.push({
      value:selected,
      label:selected,
      custom:true
    });
  }

  select.innerHTML =
    '<option value=""></option>' +
    options
      .map(option =>
        '<option value="' +
        esc(option.value) +
        '">' +
        esc(option.label) +
        '</option>'
      )
      .join('');

  select.value =
    selected &&
    [...select.options]
      .some(option =>
        option.value === selected
      )
      ? selected
      : '';

  refreshSS('relationshipType');
}

function relationshipCreateOptionText(value) {
  const text =
    normalizeRelationshipTypeText(
      value
    );

  const lang =
    document.documentElement.lang ||
    'zh-Hant';

  if (lang === 'en') {
    return 'Add "' + text + '"';
  }

  if (lang === 'zh-Hans') {
    return '新增“' + text + '”';
  }

  return '新增「' + text + '」';
}

// ========【關係語意】 設定 - 客觀關係、社會關係與顯示覆寫分離 ========
function isSiblingLink(link) {
  if (!link) return false;

  return (
    link.type === SIBLING_RELATION_TYPE ||
    link.label === SIBLING_RELATION_LABEL
  );
}

function explicitSiblingIds(simId) {
  const id =
    String(simId || '');

  return [...new Set(
    (genealogyData?.links || [])
      .filter(link =>
        isSiblingLink(link) &&
        (
          String(link.from) === id ||
          String(link.to) === id
        )
      )
      .map(link =>
        String(link.from) === id
          ? String(link.to)
          : String(link.from)
      )
      .filter(otherId =>
        otherId &&
        genealogyData?.sims?.[otherId]
      )
  )];
}

function inferredSiblingIdsForParents(
  simId,
  parentIds
) {
  const id =
    String(simId || '');

  const parentSet =
    new Set(
      (parentIds || [])
        .map(String)
        .filter(Boolean)
    );

  if (!parentSet.size) return [];

  return Object.values(
    genealogyData.sims || {}
  )
    .filter(candidate => {
      if (!candidate) return false;

      const candidateId =
        String(candidate.id || '');

      if (
        !candidateId ||
        candidateId === id
      ) {
        return false;
      }

      return genealogyParentIds(candidate)
        .some(parentId =>
          parentSet.has(
            String(parentId)
          )
        );
    })
    .map(candidate =>
      String(candidate.id)
    );
}

function inferredSiblingIds(simId) {
  const id =
    String(simId || '');

  const sim =
    genealogyData?.sims?.[id];

  if (!sim) return [];

  return inferredSiblingIdsForParents(
    id,
    genealogyParentIds(sim)
  );
}

function resolveSiblingRelationships(
  simId,
  {
    parentIds = null,
    explicitIds = null
  } = {}
) {
  const id =
    String(simId || '');

  const subject =
    genealogyData?.sims?.[id];

  const canonicalParentIds =
    parentIds == null
      ? (
          subject
            ? genealogyParentIds(subject)
            : []
        )
      : parentIds;

  const canonicalExplicitIds =
    explicitIds == null
      ? explicitSiblingIds(id)
      : explicitIds;

  const explicit =
    new Set(
      (canonicalExplicitIds || [])
        .map(String)
        .filter(otherId =>
          otherId &&
          otherId !== id &&
          genealogyData?.sims?.[otherId]
        )
    );

  const inferred =
    new Set(
      inferredSiblingIdsForParents(
        id,
        canonicalParentIds || []
      )
    );

  return [...new Set([
    ...explicit,
    ...inferred
  ])]
    .filter(targetId =>
      targetId &&
      targetId !== id &&
      genealogyData?.sims?.[targetId]
    )
    .map(targetId => ({
      targetId,
      storedExplicit:
        explicit.has(targetId),
      derivedFromParents:
        inferred.has(targetId),
      source:
        explicit.has(targetId) &&
        inferred.has(targetId)
          ? 'explicit+inferred'
          : explicit.has(targetId)
            ? 'explicit'
            : 'inferred'
    }));
}

function genealogySiblingIds(simId) {
  return resolveSiblingRelationships(
    simId
  )
    .map(relation =>
      relation.targetId
    );
}

function relationshipSemanticDescriptor(
  semanticType,
  defaultText = null
) {
  const semantic =
    RELATIONSHIP_SEMANTICS[
      semanticType
    ];

  if (semantic) {
    return {
      semanticType,
      icon:semantic.icon,
      label:
        defaultText ||
        semantic.label
    };
  }

  const text =
    String(
      defaultText ||
      '關聯'
    ).trim() ||
    '關聯';

  const social =
    SOCIAL_RELATIONSHIP_DEFINITIONS[
      text
    ];

  return {
    semanticType:'social',
    icon:
      social?.icon ||
      'tag',
    label:text
  };
}

function relationshipDisplayOverride(key) {
  const saved =
    genealogyData?.relationshipMap?.[key];

  return (
    saved &&
    typeof saved === 'object' &&
    !Array.isArray(saved)
  )
    ? saved
    : {};
}

function relationshipGender(sim) {
  const gender =
    String(
      sim?.gender ||
      ''
    ).trim();

  if (
    gender === '男' ||
    gender.toLowerCase() === 'male'
  ) {
    return 'male';
  }

  if (
    gender === '女' ||
    gender.toLowerCase() === 'female'
  ) {
    return 'female';
  }

  return 'other';
}

function genderedKinship(
  sim,
  maleLabel,
  femaleLabel,
  neutralLabel
) {
  const gender =
    relationshipGender(sim);

  if (gender === 'male') {
    return maleLabel;
  }

  if (gender === 'female') {
    return femaleLabel;
  }

  return neutralLabel;
}

function simBirthOrderValue(sim) {
  if (!sim) return null;

  const year =
    Number(sim.birthdayYear);

  const month =
    Number(sim.birthdayMonth);

  const day =
    Number(sim.birthdayDay);

  if (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    return (
      Math.trunc(year) * 10000 +
      Math.trunc(month) * 100 +
      Math.trunc(day)
    );
  }

  return null;
}

function compareSimBirthOrder(
  left,
  right
) {
  const leftDate =
    simBirthOrderValue(left);

  const rightDate =
    simBirthOrderValue(right);

  if (
    leftDate != null &&
    rightDate != null &&
    leftDate !== rightDate
  ) {
    return leftDate < rightDate
      ? -1
      : 1;
  }

  const leftAge =
    Number(left?.age);

  const rightAge =
    Number(right?.age);

  if (
    Number.isFinite(leftAge) &&
    Number.isFinite(rightAge) &&
    leftAge !== rightAge
  ) {
    return leftAge > rightAge
      ? -1
      : 1;
  }

  return 0;
}

function siblingKinshipLabel(
  perspectiveSim,
  siblingSim
) {
  const order =
    compareSimBirthOrder(
      siblingSim,
      perspectiveSim
    );

  const gender =
    relationshipGender(
      siblingSim
    );

  if (order < 0) {
    if (gender === 'male') return '哥哥';
    if (gender === 'female') return '姐姐';
  }

  if (order > 0) {
    if (gender === 'male') return '弟弟';
    if (gender === 'female') return '妹妹';
  }

  if (gender === 'male') return '兄弟';
  if (gender === 'female') return '姊妹';
  return '兄弟姊妹';
}

function directFamilyKinshipLabel(
  role,
  target,
  perspective,
  kind = 'parent-child'
) {
  if (!target) return '';

  if (role === 'parent') {
    return kind === 'adoptive'
      ? genderedKinship(
          target,
          '養父',
          '養母',
          '養親'
        )
      : genderedKinship(
          target,
          '父親',
          '母親',
          '父母'
        );
  }

  if (role === 'child') {
    return kind === 'adoptive'
      ? genderedKinship(
          target,
          '養子',
          '養女',
          '養子女'
        )
      : genderedKinship(
          target,
          '兒子',
          '女兒',
          '子女'
        );
  }

  if (role === 'spouse') {
    return genderedKinship(
      target,
      '丈夫',
      '妻子',
      '配偶'
    );
  }

  if (role === 'exspouse') {
    return genderedKinship(
      target,
      '前夫',
      '前妻',
      '前任配偶'
    );
  }

  if (role === 'sibling') {
    return siblingKinshipLabel(
      perspective,
      target
    );
  }

  return '';
}

// ========【家庭關係 Authority】 設定 - 所有 UI 共用同一份直接家庭關係模型 ========
function resolveDirectFamilyRelationships(
  simId
) {
  const id =
    String(simId || '');

  const subject =
    genealogyData?.sims?.[id];

  const empty = {
    subjectId:id,
    parents:[],
    spouses:[],
    exSpouses:[],
    children:[],
    siblings:[],
    all:[]
  };

  if (!subject) return empty;

  const makeEntry = (
    role,
    targetId,
    options = {}
  ) => {
    const normalizedTargetId =
      String(targetId || '');

    const target =
      genealogyData.sims[
        normalizedTargetId
      ];

    if (!target) return null;

    const kind =
      options.kind ||
      null;

    return {
      role,
      targetId:normalizedTargetId,
      target,
      kind,
      source:
        options.source ||
        'canonical',
      storedExplicit:
        !!options.storedExplicit,
      derivedFromParents:
        !!options.derivedFromParents,
      editable:
        options.editable !== false,
      label:
        directFamilyKinshipLabel(
          role,
          target,
          subject,
          kind ||
            'parent-child'
        )
    };
  };

  const parents =
    genealogyParentRelations(subject)
      .map(relation =>
        makeEntry(
          'parent',
          relation.parentId,
          {
            kind:relation.kind,
            source:'canonical'
          }
        )
      )
      .filter(Boolean);

  const spouses =
    (subject.spouseIds || [])
      .map(targetId =>
        makeEntry(
          'spouse',
          targetId,
          { source:'canonical' }
        )
      )
      .filter(Boolean);

  const exSpouses =
    (subject.exSpouseIds || [])
      .map(targetId =>
        makeEntry(
          'exspouse',
          targetId,
          { source:'canonical' }
        )
      )
      .filter(Boolean);

  const children =
    getChildrenOf(id)
      .map(child =>
        makeEntry(
          'child',
          child.id,
          {
            kind:
              genealogyParentKindFor(
                child,
                id
              ),
            source:'canonical'
          }
        )
      )
      .filter(Boolean);

  const siblings =
    resolveSiblingRelationships(id)
      .map(relation =>
        makeEntry(
          'sibling',
          relation.targetId,
          {
            source:
              relation.source,
            storedExplicit:
              relation.storedExplicit,
            derivedFromParents:
              relation.derivedFromParents,
            editable:
              relation.storedExplicit &&
              !relation.derivedFromParents
          }
        )
      )
      .filter(Boolean);

  return {
    subjectId:id,
    parents,
    spouses,
    exSpouses,
    children,
    siblings,
    all:[
      ...parents,
      ...spouses,
      ...exSpouses,
      ...children,
      ...siblings
    ]
  };
}

function findAncestorPath(
  sourceId,
  targetId,
  maxDepth = 8
) {
  const source = String(sourceId || '');
  const target = String(targetId || '');

  if (!source || !target || source === target) {
    return null;
  }

  const queue = [{ id:source, path:[] }];
  const bestDepth = new Map([[source, 0]]);

  while (queue.length) {
    const current = queue.shift();

    if (current.path.length >= maxDepth) {
      continue;
    }

    const sim = genealogyData?.sims?.[current.id];
    if (!sim) continue;

    const relations = genealogyParentRelations(sim);

    for (const relation of relations) {
      const nextId = String(relation.parentId);
      if (!nextId) continue;

      const nextPath = [
        ...current.path,
        nextId
      ];

      if (nextId === target) {
        return nextPath;
      }

      const known = bestDepth.get(nextId);

      if (
        known != null &&
        known <= nextPath.length
      ) {
        continue;
      }

      bestDepth.set(
        nextId,
        nextPath.length
      );

      queue.push({
        id:nextId,
        path:nextPath
      });
    }
  }

  return null;
}

function findDescendantPath(
  sourceId,
  targetId,
  maxDepth = 8
) {
  const source = String(sourceId || '');
  const target = String(targetId || '');

  if (!source || !target || source === target) {
    return null;
  }

  const queue = [{ id:source, path:[] }];
  const bestDepth = new Map([[source, 0]]);

  while (queue.length) {
    const current = queue.shift();

    if (current.path.length >= maxDepth) {
      continue;
    }

    const children = getChildrenOf(current.id);

    for (const child of children) {
      const nextId = String(child.id);
      if (!nextId) continue;

      const nextPath = [
        ...current.path,
        nextId
      ];

      if (nextId === target) {
        return nextPath;
      }

      const known = bestDepth.get(nextId);

      if (
        known != null &&
        known <= nextPath.length
      ) {
        continue;
      }

      bestDepth.set(
        nextId,
        nextPath.length
      );

      queue.push({
        id:nextId,
        path:nextPath
      });
    }
  }

  return null;
}

function ancestorKinshipLabel(
  perspectiveSim,
  targetSim,
  path
) {
  const depth =
    path?.length || 0;

  if (depth === 1) {
    const relation =
      genealogyParentRelations(
        perspectiveSim
      )
        .find(item =>
          String(item.parentId) ===
          String(targetSim.id)
        );

    if (
      relation?.kind ===
      'adoptive'
    ) {
      return genderedKinship(
        targetSim,
        '養父',
        '養母',
        '養親'
      );
    }

    return genderedKinship(
      targetSim,
      '父親',
      '母親',
      '父母'
    );
  }

  if (depth === 2) {
    const directParent =
      genealogyData.sims[
        path[0]
      ];

    const parentGender =
      relationshipGender(
        directParent
      );

    const targetGender =
      relationshipGender(
        targetSim
      );

    if (parentGender === 'male') {
      if (targetGender === 'male') return '爺爺';
      if (targetGender === 'female') return '奶奶';
      return '祖父母';
    }

    if (parentGender === 'female') {
      if (targetGender === 'male') return '外公';
      if (targetGender === 'female') return '外婆';
      return '祖父母';
    }

    return genderedKinship(
      targetSim,
      '祖父',
      '祖母',
      '祖父母'
    );
  }

  if (depth === 3) {
    return genderedKinship(
      targetSim,
      '曾祖父',
      '曾祖母',
      '曾祖父母'
    );
  }

  if (depth === 4) {
    return genderedKinship(
      targetSim,
      '高祖父',
      '高祖母',
      '高祖父母'
    );
  }

  return (
    '第 ' +
    depth +
    ' 代祖先'
  );
}

function descendantKinshipLabel(
  perspectiveSim,
  targetSim,
  path
) {
  const depth =
    path?.length || 0;

  if (depth === 1) {
    const relationKind =
      genealogyParentKindFor(
        targetSim,
        perspectiveSim.id
      );

    if (
      relationKind ===
      'adoptive'
    ) {
      return genderedKinship(
        targetSim,
        '養子',
        '養女',
        '養子女'
      );
    }

    return genderedKinship(
      targetSim,
      '兒子',
      '女兒',
      '子女'
    );
  }

  if (depth === 2) {
    const directChild =
      genealogyData.sims[
        path[0]
      ];

    const childGender =
      relationshipGender(
        directChild
      );

    if (childGender === 'female') {
      return genderedKinship(
        targetSim,
        '外孫',
        '外孫女',
        '孫輩'
      );
    }

    return genderedKinship(
      targetSim,
      '孫子',
      '孫女',
      '孫輩'
    );
  }

  if (depth === 3) {
    return genderedKinship(
      targetSim,
      '曾孫',
      '曾孫女',
      '曾孫輩'
    );
  }

  return (
    '第 ' +
    depth +
    ' 代後代'
  );
}

function parentSiblingKinship(
  perspectiveId,
  targetId
) {
  const perspective =
    genealogyData?.sims?.[
      perspectiveId
    ];

  const target =
    genealogyData?.sims?.[
      targetId
    ];

  if (!perspective || !target) {
    return null;
  }

  for (
    const parentId of
    genealogyParentIds(perspective)
  ) {
    const siblings =
      genealogySiblingIds(
        parentId
      );

    if (
      !siblings.includes(
        String(targetId)
      )
    ) {
      continue;
    }

    const parent =
      genealogyData.sims[
        parentId
      ];

    const parentGender =
      relationshipGender(
        parent
      );

    const targetGender =
      relationshipGender(
        target
      );

    if (parentGender === 'male') {
      if (targetGender === 'female') {
        return '姑姑';
      }

      if (targetGender === 'male') {
        const order =
          compareSimBirthOrder(
            target,
            parent
          );

        if (order < 0) return '伯父';
        if (order > 0) return '叔叔';
        return '叔伯';
      }
    }

    if (parentGender === 'female') {
      if (targetGender === 'male') {
        return '舅舅';
      }

      if (targetGender === 'female') {
        return '阿姨';
      }
    }

    return '父母的兄弟姊妹';
  }

  return null;
}

function siblingChildKinship(
  perspectiveId,
  targetId
) {
  const target =
    genealogyData?.sims?.[
      targetId
    ];

  if (!target) return null;

  for (
    const siblingId of
    genealogySiblingIds(
      perspectiveId
    )
  ) {
    const childIds =
      getChildrenOf(
        siblingId
      )
        .map(child =>
          String(child.id)
        );

    if (
      !childIds.includes(
        String(targetId)
      )
    ) {
      continue;
    }

    const sibling =
      genealogyData.sims[
        siblingId
      ];

    const siblingGender =
      relationshipGender(
        sibling
      );

    if (siblingGender === 'male') {
      return genderedKinship(
        target,
        '姪子',
        '姪女',
        '兄弟姊妹的子女'
      );
    }

    if (siblingGender === 'female') {
      return genderedKinship(
        target,
        '外甥',
        '外甥女',
        '兄弟姊妹的子女'
      );
    }

    return '兄弟姊妹的子女';
  }

  return null;
}

function cousinKinship(
  perspectiveId,
  targetId
) {
  const perspective =
    genealogyData?.sims?.[
      perspectiveId
    ];

  const target =
    genealogyData?.sims?.[
      targetId
    ];

  if (!perspective || !target) {
    return null;
  }

  for (
    const parentId of
    genealogyParentIds(perspective)
  ) {
    const parent =
      genealogyData.sims[
        parentId
      ];

    for (
      const parentSiblingId of
      genealogySiblingIds(
        parentId
      )
    ) {
      const cousinIds =
        getChildrenOf(
          parentSiblingId
        )
          .map(child =>
            String(child.id)
          );

      if (
        !cousinIds.includes(
          String(targetId)
        )
      ) {
        continue;
      }

      const parentSibling =
        genealogyData.sims[
          parentSiblingId
        ];

      const paternalMaleBranch =
        relationshipGender(parent) ===
          'male' &&
        relationshipGender(
          parentSibling
        ) === 'male';

      const prefix =
        paternalMaleBranch
          ? '堂'
          : '表';

      const order =
        compareSimBirthOrder(
          target,
          perspective
        );

      const gender =
        relationshipGender(
          target
        );

      if (
        order < 0 &&
        gender === 'male'
      ) {
        return prefix + '哥';
      }

      if (
        order < 0 &&
        gender === 'female'
      ) {
        return prefix + '姐';
      }

      if (
        order > 0 &&
        gender === 'male'
      ) {
        return prefix + '弟';
      }

      if (
        order > 0 &&
        gender === 'female'
      ) {
        return prefix + '妹';
      }

      return (
        prefix +
        '兄弟姊妹'
      );
    }
  }

  return null;
}

function spouseParentKinship(
  perspectiveId,
  targetId
) {
  const perspective =
    genealogyData?.sims?.[
      perspectiveId
    ];

  const target =
    genealogyData?.sims?.[
      targetId
    ];

  if (!perspective || !target) {
    return null;
  }

  for (
    const spouseId of
    perspective.spouseIds || []
  ) {
    const spouse =
      genealogyData.sims[
        spouseId
      ];

    if (!spouse) continue;

    if (
      !genealogyParentIds(spouse)
        .includes(
          String(targetId)
        )
    ) {
      continue;
    }

    const targetGender =
      relationshipGender(
        target
      );

    const perspectiveGender =
      relationshipGender(
        perspective
      );

    const spouseGender =
      relationshipGender(
        spouse
      );

    if (
      perspectiveGender === 'male' &&
      spouseGender === 'female'
    ) {
      if (targetGender === 'male') return '岳父';
      if (targetGender === 'female') return '岳母';
      return '配偶父母';
    }

    if (
      perspectiveGender === 'female' &&
      spouseGender === 'male'
    ) {
      if (targetGender === 'male') return '公公';
      if (targetGender === 'female') return '婆婆';
      return '配偶父母';
    }

    if (targetGender === 'male') {
      return '配偶父親';
    }

    if (targetGender === 'female') {
      return '配偶母親';
    }

    return '配偶父母';
  }

  return null;
}

function directSocialPerspectiveLabel(
  perspectiveId,
  targetId
) {
  const link =
    (genealogyData?.links || [])
      .find(candidate =>
        !isSiblingLink(candidate) &&
        (
          (
            String(candidate.from) ===
              String(perspectiveId) &&
            String(candidate.to) ===
              String(targetId)
          ) ||
          (
            String(candidate.to) ===
              String(perspectiveId) &&
            String(candidate.from) ===
              String(targetId)
          )
        )
      );

  if (!link) return null;

  return String(
    link.label ||
    link.type ||
    '關聯'
  ).trim() || '關聯';
}

function resolveKinshipLabel(
  perspectiveId,
  targetId
) {
  const root =
    genealogyData?.sims?.[
      perspectiveId
    ];

  const target =
    genealogyData?.sims?.[
      targetId
    ];

  if (!root || !target) {
    return null;
  }

  if (
    String(root.id) ===
    String(target.id)
  ) {
    return '本人';
  }

  const ancestorPath =
    findAncestorPath(
      root.id,
      target.id
    );

  if (ancestorPath) {
    return ancestorKinshipLabel(
      root,
      target,
      ancestorPath
    );
  }

  const descendantPath =
    findDescendantPath(
      root.id,
      target.id
    );

  if (descendantPath) {
    return descendantKinshipLabel(
      root,
      target,
      descendantPath
    );
  }

  const directFamily =
    resolveDirectFamilyRelationships(
      root.id
    )
      .all
      .find(relation =>
        relation.targetId ===
        String(target.id)
      );

  if (directFamily?.label) {
    return directFamily.label;
  }

  const parentSibling =
    parentSiblingKinship(
      root.id,
      target.id
    );

  if (parentSibling) {
    return parentSibling;
  }

  const siblingChild =
    siblingChildKinship(
      root.id,
      target.id
    );

  if (siblingChild) {
    return siblingChild;
  }

  const cousin =
    cousinKinship(
      root.id,
      target.id
    );

  if (cousin) {
    return cousin;
  }

  const spouseParent =
    spouseParentKinship(
      root.id,
      target.id
    );

  if (spouseParent) {
    return spouseParent;
  }

  return directSocialPerspectiveLabel(
    root.id,
    target.id
  );
}

function relationshipPerspectiveSim() {
  const sim =
    relationshipPerspectiveSimId
      ? genealogyData?.sims?.[
          relationshipPerspectiveSimId
        ]
      : null;

  if (
    relationshipPerspectiveSimId &&
    !sim
  ) {
    relationshipPerspectiveSimId =
      null;
  }

  return sim || null;
}

function relationshipPerspectiveActionText(
  sim,
  ending = false
) {
  const name =
    displayDataText(
      sim?.name ||
      '',
      sim
    );

  const lang =
    document.documentElement.lang ||
    'zh-Hant';

  if (lang === 'en') {
    return ending
      ? 'End ' + name + ' perspective'
      : 'View genealogy from ' +
        name +
        ' perspective';
  }

  if (lang === 'zh-Hans') {
    return ending
      ? '结束“' + name + '”视角'
      : '以“' + name +
        '”视角查看族谱';
  }

  return ending
    ? '結束「' + name + '」視角'
    : '以「' + name +
      '」視角查看族譜';
}

function syncRelationshipPerspectiveUI() {
  if (!relationshipPerspectiveBtn) {
    return;
  }

  const sim =
    relationshipPerspectiveSim();

  relationshipPerspectiveBtn.hidden =
    !sim;

  relationshipPerspectiveBtn.style.display =
    sim
      ? ''
      : 'none';

  if (!sim) return;

  relationshipPerspectiveBtn.classList.add(
    'active'
  );

  setIconText(
    relationshipPerspectiveBtn,
    'person-vcard',
    relationshipPerspectiveActionText(
      sim,
      true
    )
  );

  relationshipPerspectiveBtn.title =
    relationshipPerspectiveActionText(
      sim,
      true
    );

  relationshipPerspectiveBtn
    .setAttribute(
      'aria-label',
      relationshipPerspectiveBtn.title
    );
}

function setRelationshipPerspective(
  simId
) {
  const id =
    simId == null
      ? null
      : String(simId);

  relationshipPerspectiveSimId =
    id &&
    genealogyData?.sims?.[id]
      ? id
      : null;

  syncRelationshipPerspectiveUI();

  if (getSceneLayout()) {
    invalidateRender({
      edges:true
    });
  }
}



function openSidebar() {
  if (!sidebar) return;
  sidebar.classList.add('open');
  sidebarBackdrop?.classList.add('show');
}
function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  sidebarBackdrop?.classList.remove('show');
}
function setFamilyPanelCollapsed(collapsed, { persist = true } = {}) {
  const next = !!collapsed;
  document.body.classList.toggle('family-panel-collapsed', next);
  const btn = $('familyPanelCollapseBtn');
  if (btn) {
    btn.innerHTML = iconSvg(next ? 'chevron-right' : 'chevron-left');
    btn.title = uiText(next ? '展開家族欄' : '收合家族欄');
    btn.setAttribute('aria-label', btn.title);
  }
  if (persist) { try { localStorage.setItem(FAMILY_PANEL_COLLAPSED_KEY, next ? '1' : '0'); } catch (_) {} }
}
function restoreFamilyPanelCollapsed() {
  let collapsed = false;
  try { collapsed = localStorage.getItem(FAMILY_PANEL_COLLAPSED_KEY) === '1'; } catch (_) {}
  setFamilyPanelCollapsed(collapsed, { persist:false });
}
menuToggle.onclick = () => {
  if (window.innerWidth <= 720) {
    if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
  } else {
    setFamilyPanelCollapsed(!document.body.classList.contains('family-panel-collapsed'));
  }
};
sidebarBackdrop.onclick = closeSidebar;
$('familyPanelCollapseBtn')?.addEventListener('click', () => setFamilyPanelCollapsed(true));

// ========【共用彈出選單】 設定 - 頂欄、家族與成員操作 ========
function closeAppMenus(except = null) {
  document.querySelectorAll('.ui-menu.open').forEach(menu => {
    if (menu === except) return;
    menu.classList.remove('open');
    menu.querySelector('.ui-menu-trigger')?.setAttribute('aria-expanded','false');
  });
}
let _appMenuGlobalBound = false;
function setupAppMenus() {
  document.querySelectorAll('.ui-menu').forEach(menu => {
    const trigger = menu.querySelector(':scope > .ui-menu-trigger');
    if (!trigger || trigger.dataset.menuBound === '1') return;
    trigger.dataset.menuBound = '1';
    trigger.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const willOpen = !menu.classList.contains('open');
      closeAppMenus(menu);
      menu.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true':'false');
    });
    menu.querySelectorAll('.ui-menu-item').forEach(item => item.addEventListener('click', () => {
      setTimeout(() => closeAppMenus(), 0);
    }));
  });
  if (!_appMenuGlobalBound) {
    _appMenuGlobalBound = true;
    document.addEventListener('click', e => { if (!e.target.closest?.('.ui-menu')) closeAppMenus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAppMenus(); });
  }
}

// ========【共用說明 Tooltip】 設定 - 掛到 body，避免被 modal overflow 裁切 ========
function setupHelpTooltipPortal() {
  if ($('globalHelpTooltip')) return;
  const tip = document.createElement('div');
  tip.id = 'globalHelpTooltip';
  tip.setAttribute('role','tooltip');
  document.body.appendChild(tip);
  let active = null;
  const place = () => {
    if (!active || !tip.classList.contains('show')) return;
    const r = active.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    const margin = 10, gap = 8;
    const canTop = r.top >= tr.height + gap + margin;
    const side = canTop ? 'top' : 'bottom';
    let left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tr.width - margin));
    const top = side === 'top' ? r.top - tr.height - gap : r.bottom + gap;
    const arrowX = Math.max(9, Math.min(tr.width - 9, r.left + r.width / 2 - left));
    tip.dataset.side = side;
    tip.style.left = `${Math.round(left)}px`; tip.style.top = `${Math.round(top)}px`;
    tip.style.setProperty('--tooltip-arrow-x', `${Math.round(arrowX)}px`);
  };
  const show = target => {
    const text = target?.dataset?.tooltip; if (!text) return;
    active = target; tip.textContent = text; tip.classList.add('show');
    requestAnimationFrame(place);
  };
  const hide = target => { if (!target || target === active) { tip.classList.remove('show'); active = null; } };
  document.addEventListener('mouseover', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) show(t); });
  document.addEventListener('mouseout', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t && !t.contains(e.relatedTarget)) hide(t); });
  document.addEventListener('focusin', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) show(t); });
  document.addEventListener('focusout', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) hide(t); });
  document.addEventListener('click', e => { const t=e.target.closest?.('.help-tooltip[data-tooltip]'); if (t) { e.stopPropagation(); active===t && tip.classList.contains('show') ? hide(t) : show(t); } else hide(); });
  window.addEventListener('resize', place);
  document.addEventListener('scroll', place, true);
}

// ========【側邊欄寬度】 設定 - 桌面版拖曳調整並保存寬度 ========
function getSidebarMaxWidth() {
  // 避免側邊欄在較窄桌面畫面佔掉過多族譜工作區
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.floor(window.innerWidth * 0.42)));
}

function clampSidebarWidth(value) {
  const width = Number(value);
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(getSidebarMaxWidth(), Math.round(width)));
}

function applySidebarWidth(value, { persist = true } = {}) {
  const width = clampSidebarWidth(value);
  document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
  scheduleFamilyNameInputWidthSync();
  if (sidebarResizer) sidebarResizer.setAttribute('aria-valuenow', String(width));
  if (persist) {
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width)); } catch (_) {}
  }
  return width;
}

function restoreSidebarWidth() {
  let saved = SIDEBAR_DEFAULT_WIDTH;
  try { saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || SIDEBAR_DEFAULT_WIDTH; } catch (_) {}
  applySidebarWidth(saved, { persist: false });
}

restoreSidebarWidth();

if (sidebarResizer) {
  sidebarResizer.setAttribute('aria-valuemin', String(SIDEBAR_MIN_WIDTH));
  sidebarResizer.setAttribute('aria-valuemax', String(SIDEBAR_MAX_WIDTH));

  sidebarResizer.addEventListener('pointerdown', e => {
    if (window.innerWidth <= 720 || document.body.classList.contains('family-panel-collapsed')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebar.getBoundingClientRect().width;
    document.body.classList.add('sidebar-resizing');
    try { sidebarResizer.setPointerCapture(e.pointerId); } catch (_) {}

    const onMove = ev => {
      applySidebarWidth(startWidth + (ev.clientX - startX));
    };

    const onUp = () => {
      sidebarResizer.removeEventListener('pointermove', onMove);
      sidebarResizer.removeEventListener('pointerup', onUp);
      sidebarResizer.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('sidebar-resizing');
    };

    sidebarResizer.addEventListener('pointermove', onMove);
    sidebarResizer.addEventListener('pointerup', onUp);
    sidebarResizer.addEventListener('pointercancel', onUp);
  });

  sidebarResizer.addEventListener('dblclick', () => {
    applySidebarWidth(SIDEBAR_DEFAULT_WIDTH);
  });

  sidebarResizer.addEventListener('keydown', e => {
    if (window.innerWidth <= 720) return;
    const current = sidebar.getBoundingClientRect().width;
    const step = e.shiftKey ? 20 : 8;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      applySidebarWidth(current - step);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      applySidebarWidth(current + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      applySidebarWidth(SIDEBAR_MIN_WIDTH);
    } else if (e.key === 'End') {
      e.preventDefault();
      applySidebarWidth(getSidebarMaxWidth());
    }
  });
}

window.addEventListener('resize', debounce(() => {
  if (window.innerWidth > 720) {
    const current = sidebar.getBoundingClientRect().width;
    const clamped = clampSidebarWidth(current);
    if (Math.abs(clamped - current) > 0.5) applySidebarWidth(clamped);
  }
}, 80));


// ========【資料儲存佇列】 設定 - 一般儲存延後到 idle；離頁 / 明確要求時同步 flush ========
const genealogySaveCoordinator =
  genealogyRuntime?.createSaveCoordinator?.({
    delay:260,
    idleTimeout:700,

    serialize:() =>
      JSON.stringify(
        genealogyData
      ),

    write:serialized =>
      localStorage.setItem(
        STORE_KEY,
        serialized
      ),

    getExisting:() =>
      localStorage.getItem(
        STORE_KEY
      ) || null,

    onError:error => {
      if (
        error?.name ===
          'QuotaExceededError' ||
        /quota/i.test(
          error?.message || ''
        )
      ) {
        uiAlert(
          '瀏覽器可用的儲存空間不足。\n\n建議：\n1. 前往「圖片與儲存」清理未使用的圖片\n2. 先匯出 JSON 備份\n3. 再視需要整理瀏覽器網站資料',
          {
            title:'儲存空間不足',
            kind:'danger'
          }
        );

        return;
      }

      console.error(
        '[族譜儲存]',
        error
      );
    }
  }) ||
  null;

let _saveTimer = null;
let _pendingSave = false;

function save({
  immediate = false
} = {}) {
  if (genealogySaveCoordinator) {
    return genealogySaveCoordinator
      .request({
        immediate
      });
  }

  _pendingSave = true;

  if (immediate) {
    return _flushSave();
  }

  if (_saveTimer) return;

  _saveTimer =
    setTimeout(
      _flushSave,
      260
    );
}

function _flushSave() {
  if (genealogySaveCoordinator) {
    return genealogySaveCoordinator
      .flush();
  }

  if (_saveTimer) {
    clearTimeout(
      _saveTimer
    );

    _saveTimer = null;
  }

  if (!_pendingSave) return;

  _pendingSave = false;

  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify(
        genealogyData
      )
    );
  } catch (error) {
    if (
      error.name ===
        'QuotaExceededError' ||
      /quota/i.test(
        error.message || ''
      )
    ) {
      uiAlert(
        '瀏覽器可用的儲存空間不足。\n\n建議：\n1. 前往「圖片與儲存」清理未使用的圖片\n2. 先匯出 JSON 備份\n3. 再視需要整理瀏覽器網站資料',
        {
          title:'儲存空間不足',
          kind:'danger'
        }
      );
    }
  }
}

window.addEventListener(
  'beforeunload',
  () => _flushSave()
);

document.addEventListener(
  'visibilitychange',
  () => {
    if (
      document.visibilityState ===
      'hidden'
    ) {
      _flushSave();
    }
  }
);

function hexToRgb(hex) {
  const h = String(hex).replace('#','');
  const full = h.length === 3 ? h.split('').map(c => c+c).join('') : h;
  return {
    r: parseInt(full.slice(0,2),16) || 0,
    g: parseInt(full.slice(2,4),16) || 0,
    b: parseInt(full.slice(4,6),16) || 0
  };
}
function rgbToHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0');
  return '#' + c(r) + c(g) + c(b);
}
function hexToRgba(hex, a) {
  const {r,g,b} = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function relLum(hex) {
  const {r,g,b} = hexToRgb(hex);
  const lin = c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
function mixHex(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return rgbToHex(a.r * (1-t) + b.r * t, a.g * (1-t) + b.g * t, a.b * (1-t) + b.b * t);
}
function adjustLightness(hex, delta) {
  const {r,g,b} = hexToRgb(hex);
  const adj = v => delta < 0 ? v * (1 + delta) : v + (255 - v) * delta;
  return rgbToHex(adj(r), adj(g), adj(b));
}

function resetThemeSurface() {
  [
    '--grad-1','--grad-2',
    '--grad-1-soft','--grad-2-soft',
    '--accent','--accent-hover',
    '--primary-dark','--hl'
  ].forEach(property => {
    document.body.style.removeProperty(property);
  });

  document.body.removeAttribute('data-topbar-contrast');
}

function paintThemeChoices() {
  if (!appearanceThemeGrid) return;

  const choices = THEME_PRESETS.map(theme => ({
    id:theme.id,
    name:theme.name,
    gradient:theme.grad
  }));

  choices.push({
    id:'custom',
    name:'自訂配色',
    gradient:
      `linear-gradient(120deg, ${customColors.c1} 0%, ${customColors.c2} 100%)`
  });

  appearanceThemeGrid.innerHTML = choices.map(choice => {
    const selected = choice.id === currentThemeId;
    const previewId =
      choice.id === 'custom'
        ? ' id="customCardPreview"'
        : '';

    return `
      <button
        class="appearance-theme-card${selected ? ' selected' : ''}"
        type="button"
        data-theme-id="${esc(choice.id)}"
        aria-pressed="${selected ? 'true' : 'false'}"
      >
        <span class="appearance-theme-radio" aria-hidden="true"></span>
        <span class="appearance-theme-card-name">${esc(choice.name)}</span>
        <span class="appearance-theme-preview"${previewId} style="background:${choice.gradient}"></span>
      </button>
    `;
  }).join('');

  appearanceThemeGrid
    .querySelectorAll('[data-theme-id]')
    .forEach(button => {
      button.addEventListener('click', () => {
        const themeId = button.dataset.themeId || '';

        if (themeId === 'custom') {
          chooseCustomTheme(
            customColors.c1,
            customColors.c2
          );
          return;
        }

        chooseThemePreset(themeId);
      });
    });
}

function syncThemeChoiceDisplay() {
  appearanceThemeGrid
    ?.querySelectorAll('[data-theme-id]')
    .forEach(button => {
      const selected =
        button.dataset.themeId === currentThemeId;

      button.classList.toggle('selected', selected);
      button.setAttribute(
        'aria-pressed',
        selected ? 'true' : 'false'
      );
    });

  const customPreview =
    document.getElementById('customCardPreview');

  if (customPreview) {
    customPreview.style.background =
      `linear-gradient(120deg, ${customColors.c1} 0%, ${customColors.c2} 100%)`;
  }
}

function chooseThemePreset(themeId, { persist = true } = {}) {
  const nextTheme =
    VALID_THEMES.includes(themeId)
      ? themeId
      : 'ling';

  resetThemeSurface();
  document.body.dataset.theme = nextTheme;
  currentThemeId = nextTheme;

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (_) {}
  }

  syncThemeChoiceDisplay();
  applyRelationshipLineSettings();
}

function chooseCustomTheme(primary, secondary, { persist = true } = {}) {
  const c1 = String(primary || '#f0c050');
  const c2 = String(secondary || '#a878c8');
  const mix = mixHex(c1, c2, 0.5);
  const accent = adjustLightness(mix, -0.28);
  const averageLuminance =
    (relLum(c1) + relLum(c2)) / 2;

  resetThemeSurface();
  document.body.dataset.theme = 'custom';

  [
    ['--grad-1', c1],
    ['--grad-2', c2],
    ['--grad-1-soft', hexToRgba(c1, 0.2)],
    ['--grad-2-soft', hexToRgba(c2, 0.2)],
    ['--accent', accent],
    ['--accent-hover', adjustLightness(accent, -0.12)],
    ['--primary-dark', adjustLightness(mix, -0.4)],
    ['--hl', hexToRgba(accent, 0.5)]
  ].forEach(([property, value]) => {
    document.body.style.setProperty(property, value);
  });

  document.body.setAttribute(
    'data-topbar-contrast',
    averageLuminance > 0.62 ? 'light' : 'dark'
  );

  currentThemeId = 'custom';
  customColors = { c1, c2 };

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, 'custom');
      localStorage.setItem(
        CUSTOM_COLORS_KEY,
        JSON.stringify(customColors)
      );
    } catch (_) {}
  }

  syncThemeChoiceDisplay();
  applyRelationshipLineSettings();
}

function paintCustomThemePreview() {
  if (!appearanceCustomThemePreview) return;

  appearanceCustomThemePreview.style.background =
    `linear-gradient(120deg, ${customColor1.value} 0%, ${customColor2.value} 100%)`;
}

customColor1.addEventListener(
  'input',
  paintCustomThemePreview
);
customColor2.addEventListener(
  'input',
  paintCustomThemePreview
);

$('applyCustomBtn').onclick = () => {
  chooseCustomTheme(
    customColor1.value,
    customColor2.value
  );
};

function applyViewMode(mode) {
  if (!VALID_MODES.includes(mode)) mode = 'edit';
  viewMode = mode;
  _dimsCache.mode = null;
  _gapsCache.mode = null;
  if (viewMode === 'view') {
    setIconText(modeToggle, 'eye', '檢視模式');
    modeToggle.classList.add('active');
  } else {
    setIconText(modeToggle, 'pencil-square', '編輯模式');
    modeToggle.classList.remove('active');
  }
  try { localStorage.setItem(MODE_KEY, mode); } catch(e){}
}
function toggleViewMode() {
  dragHistory.clear();
  clearNodeSelection();
  arrangeTool = 'pan';
  applyViewMode(viewMode === 'view' ? 'edit' : 'view');
  render();
  requestAnimationFrame(fitScreen);
}
modeToggle.onclick = toggleViewMode;

// ========【關係線外觀】 設定 - 沿用現有外觀 UI，次要關係增加曲線與個別類型設定 ========
const REL_LINE_KEYS =
  ['parent','spouse','exspouse','adopt','other'];

const REL_LINE_DEFAULT_COLOR_VARS = {
  parent:'--line',
  spouse:'--spouse',
  exspouse:'--exspouse',
  adopt:'--adopt',
  other:'--other-line'
};

const REL_LINE_DASH = {
  solid:'none',
  'short-dash':'4 3',
  'long-dash':'10 6',
  dot:'1 5',
  curve:'none'
};

const REL_STROKE_STYLES =
  new Set([
    'solid',
    'short-dash',
    'long-dash',
    'dot'
  ]);

function clampRelationshipCurveAmount(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 50;
  }

  return Math.max(
    10,
    Math.min(100, number)
  );
}









function normalizeColorForInput(
  value,
  fallback='#8896a4'
) {
  const v =
    String(value || '').trim();

  if (/^#[0-9a-f]{6}$/i.test(v)) {
    return v;
  }

  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return (
      '#' +
      v.slice(1)
        .split('')
        .map(c => c + c)
        .join('')
    );
  }

  const m =
    v.match(
      /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i
    );

  return m
    ? rgbToHex(
        +m[1],
        +m[2],
        +m[3]
      )
    : fallback;
}

function relationshipDefaultColor(key) {
  return normalizeColorForInput(
    getComputedStyle(document.body)
      .getPropertyValue(
        REL_LINE_DEFAULT_COLOR_VARS[key]
      ),
    '#8896a4'
  );
}

function relationshipLineSetting(key) {
  return migrateRelationshipLineSetting(
    key,
    relationshipLineSettings[key]
  );
}

function relationshipOtherType(link) {
  const value =
    String(
      link?.label ||
      link?.type ||
      '關聯'
    ).trim();

  return value || '關聯';
}

function getOtherRelationshipTypes() {
  const seen =
    new Map();

  (genealogyData?.links || [])
    .forEach(link => {
      const type =
        relationshipOtherType(link);

      if (!seen.has(type)) {
        seen.set(
          type,
          displayRelationshipText(type)
        );
      }
    });

  return [...seen.entries()]
    .map(([type, label]) => ({
      type,
      label
    }))
    .sort((left, right) =>
      String(left.label)
        .localeCompare(
          String(right.label),
          'zh'
        )
    );
}

function getOtherRelationshipLineSetting(
  type
) {
  return migrateRelationshipLineSetting(
    'other',
    relationshipLineSettings
      .otherTypes?.[type]
  );
}

function ensureOtherRelationshipLineSetting(
  type
) {
  if (
    !relationshipLineSettings.otherTypes ||
    typeof relationshipLineSettings.otherTypes !== 'object'
  ) {
    relationshipLineSettings.otherTypes = {};
  }

  if (
    !relationshipLineSettings.otherTypes[type]
  ) {
    relationshipLineSettings.otherTypes[type] = {
      ...RELATIONSHIP_LINE_DEFAULTS.other
    };
  }

  return relationshipLineSettings
    .otherTypes[type];
}

function relationshipResolvedColor(
  setting,
  key='other'
) {
  return normalizeColorForInput(
    setting.color ||
    relationshipDefaultColor(key),
    relationshipDefaultColor(key)
  );
}

function relationshipDashValue(
  setting
) {
  return (
    REL_LINE_DASH[setting.style] ||
    'none'
  );
}

function relationshipInlineSvgStyle(
  setting,
  key='other'
) {
  const color =
    relationshipResolvedColor(
      setting,
      key
    );

  const width =
    Math.max(
      0.5,
      Number(setting.width) ||
      RELATIONSHIP_LINE_DEFAULTS.other.width
    );

  const dash =
    relationshipDashValue(
      setting
    );

  return (
    'stroke:' + color + ';' +
    'stroke-width:' + width + ';' +
    'stroke-dasharray:' + dash + ';'
  );
}

function relationshipCurvePreviewPath(
  curveAmount
) {
  const amount =
    clampRelationshipCurveAmount(
      curveAmount
    );

  const amplitude =
    2 +
    (amount / 100) * 12;

  return (
    'M4 18 ' +
    'Q60 ' + (18 - amplitude) +
    ' 116 18'
  );
}

function updateRelationshipLinePreview(
  preview,
  setting,
  colorKey='other'
) {
  if (!preview) return;

  const color =
    relationshipResolvedColor(
      setting,
      colorKey
    );

  preview.dataset.lineStyle =
    setting.style;

  preview.dataset.curved =
    setting.curved
      ? 'true'
      : 'false';

  preview.style.setProperty(
    '--preview-color',
    color
  );

  preview.style.setProperty(
    '--preview-width',
    String(setting.width) + 'px'
  );

  if (setting.curved) {
    const dash =
      relationshipDashValue(
        setting
      );

    preview.innerHTML =
      '<svg class="relationship-curve-mini-preview" ' +
      'viewBox="0 0 120 26" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' +
      relationshipCurvePreviewPath(
        setting.curveAmount
      ) +
      '" style="stroke:' +
      color +
      ';stroke-width:' +
      Math.max(
        1,
        Number(setting.width) || 1.5
      ) +
      ';stroke-dasharray:' +
      dash +
      '"/>' +
      '</svg>';
  } else {
    preview.innerHTML = '';
  }
}

function applyRelationshipLineSettings() {
  REL_LINE_KEYS.forEach(key => {
    const setting =
      relationshipLineSetting(key);

    document.documentElement
      .style.setProperty(
        '--rel-' + key + '-color',
        setting.color ||
        relationshipDefaultColor(key)
      );

    document.documentElement
      .style.setProperty(
        '--rel-' + key + '-width',
        String(setting.width)
      );

    document.documentElement
      .style.setProperty(
        '--rel-' + key + '-dash',
        relationshipDashValue(setting)
      );
  });

  syncRelationshipLineControls();
}

function saveRelationshipLineSettings() {
  try {
    localStorage.setItem(
      REL_LINE_STYLE_KEY,
      JSON.stringify(
        relationshipLineSettings
      )
    );
  } catch (_) {}

  applyRelationshipLineSettings();

  if (getSceneLayout()) {
    drawEdges();
  }
}

function relationshipStyleOptionsHTML() {
  return [
    ['solid','實線'],
    ['short-dash','短虛線'],
    ['long-dash','長虛線'],
    ['dot','點線']
  ]
    .map(([value, label]) =>
      '<option value="' +
      value +
      '">' +
      esc(uiText(label)) +
      '</option>'
    )
    .join('');
}

function otherRelationshipDomKey(
  type
) {
  return encodeURIComponent(
    String(type)
  );
}

function otherRelationshipTypeFromDomKey(
  key
) {
  try {
    return decodeURIComponent(
      String(key || '')
    );
  } catch (_) {
    return String(key || '');
  }
}

function renderOtherRelationshipLineControls() {
  const list =
    $('otherRelationshipLineList');

  if (!list) return;

  const openKeys =
    new Set(
      [...list.querySelectorAll(
        '.other-relationship-line-item[open]'
      )]
        .map(item =>
          item.dataset.otherRelKey
        )
        .filter(Boolean)
    );

  const types =
    getOtherRelationshipTypes();

  if (!types.length) {
    list.innerHTML =
      '<div class="other-relationship-empty">' +
      esc(uiText('尚無其他關係')) +
      '</div>';

    return;
  }

  list.innerHTML =
    types.map(entry => {
      const key =
        otherRelationshipDomKey(
          entry.type
        );

      const open =
        openKeys.has(key)
          ? ' open'
          : '';

      return (
        '<details class="relationship-line-item other-relationship-line-item" ' +
        'data-other-rel-key="' +
        esc(key) +
        '"' +
        open +
        '>' +
          '<summary>' +
            '<span>' +
              esc(entry.label) +
            '</span>' +
            '<i data-other-rel-preview="' +
              esc(key) +
            '"></i>' +
          '</summary>' +
          '<div class="relationship-line-controls">' +
            '<label>' +
              '<span>' +
                esc(uiText('樣式')) +
              '</span>' +
              '<select data-other-rel-style="' +
                esc(key) +
              '">' +
                relationshipStyleOptionsHTML() +
              '</select>' +
            '</label>' +
            '<label>' +
              '<span>' +
                esc(uiText('粗細')) +
              '</span>' +
              '<input data-other-rel-width="' +
                esc(key) +
              '" type="range" min="1" max="4" step="0.1">' +
            '</label>' +
            '<label>' +
              '<span>' +
                esc(uiText('顏色')) +
              '</span>' +
              '<input data-other-rel-color="' +
                esc(key) +
              '" type="color">' +
            '</label>' +
          '</div>' +
          '<div class="relationship-line-extra-controls">' +
            '<label class="relationship-toggle-control">' +
              '<span>' +
                esc(uiText('曲線')) +
              '</span>' +
              '<input data-other-rel-curved="' +
                esc(key) +
              '" type="checkbox">' +
            '</label>' +
            '<label class="relationship-curve-control" data-other-rel-curve-row="' +
              esc(key) +
            '">' +
              '<span>' +
                esc(uiText('曲線弧度')) +
              '</span>' +
              '<div class="relationship-curve-slider">' +
                '<input data-other-rel-curve="' +
                  esc(key) +
                '" type="range" min="10" max="100" step="1">' +
                '<output data-other-rel-curve-value="' +
                  esc(key) +
                '"></output>' +
              '</div>' +
            '</label>' +
            '<label class="relationship-arrow-control">' +
              '<span>' +
                esc(uiText('雙向箭頭')) +
              '</span>' +
              '<input data-other-rel-bidirectional="' +
                esc(key) +
              '" type="checkbox">' +
            '</label>' +
          '</div>' +
        '</details>'
      );
    }).join('');

  installSharedNativeSelectChevrons(
    list
  );

  bindOtherRelationshipLineControls(
    list
  );

  syncOtherRelationshipLineControls();
}

function syncOtherRelationshipLineControls() {
  const list =
    $('otherRelationshipLineList');

  if (!list) return;

  list.querySelectorAll(
    '.other-relationship-line-item'
  ).forEach(item => {
    const key =
      item.dataset.otherRelKey || '';

    const type =
      otherRelationshipTypeFromDomKey(
        key
      );

    const setting =
      getOtherRelationshipLineSetting(
        type
      );

    const styleEl =
      item.querySelector(
        '[data-other-rel-style]'
      );

    const widthEl =
      item.querySelector(
        '[data-other-rel-width]'
      );

    const colorEl =
      item.querySelector(
        '[data-other-rel-color]'
      );

    const curvedEl =
      item.querySelector(
        '[data-other-rel-curved]'
      );

    const curveEl =
      item.querySelector(
        '[data-other-rel-curve]'
      );

    const curveValueEl =
      item.querySelector(
        '[data-other-rel-curve-value]'
      );

    const curveRow =
      item.querySelector(
        '[data-other-rel-curve-row]'
      );

    const bidirectionalEl =
      item.querySelector(
        '[data-other-rel-bidirectional]'
      );

    const preview =
      item.querySelector(
        '[data-other-rel-preview]'
      );

    if (styleEl) {
      styleEl.value =
        setting.style;
    }

    if (widthEl) {
      widthEl.value =
        String(setting.width);
    }

    if (colorEl) {
      colorEl.value =
        relationshipResolvedColor(
          setting,
          'other'
        );
    }

    if (curvedEl) {
      curvedEl.checked =
        !!setting.curved;
    }

    if (curveEl) {
      curveEl.value =
        String(
          setting.curveAmount
        );

      curveEl.disabled =
        !setting.curved;
    }

    if (curveValueEl) {
      curveValueEl.textContent =
        String(
          Math.round(
            setting.curveAmount
          )
        ) + '%';
    }

    if (curveRow) {
      curveRow.classList.toggle(
        'is-disabled',
        !setting.curved
      );

      curveRow.setAttribute(
        'aria-disabled',
        setting.curved
          ? 'false'
          : 'true'
      );
    }

    if (bidirectionalEl) {
      bidirectionalEl.checked =
        !!setting.bidirectional;
    }

    updateRelationshipLinePreview(
      preview,
      setting,
      'other'
    );
  });
}

function syncRelationshipLineControls() {
  REL_LINE_KEYS.forEach(key => {
    const setting =
      relationshipLineSetting(key);

    const styleEl =
      document.querySelector(
        '[data-rel-style="' +
        key +
        '"]'
      );

    const widthEl =
      document.querySelector(
        '[data-rel-width="' +
        key +
        '"]'
      );

    const colorEl =
      document.querySelector(
        '[data-rel-color="' +
        key +
        '"]'
      );

    const curvedEl =
      document.querySelector(
        '[data-rel-curved="' +
        key +
        '"]'
      );

    const curveEl =
      document.querySelector(
        '[data-rel-curve="' +
        key +
        '"]'
      );

    const curveValueEl =
      document.querySelector(
        '[data-rel-curve-value="' +
        key +
        '"]'
      );

    const curveRow =
      document.querySelector(
        '[data-rel-curve-row="' +
        key +
        '"]'
      );

    const preview =
      document.querySelector(
        '[data-rel-preview="' +
        key +
        '"]'
      );

    if (styleEl) {
      styleEl.value =
        setting.style;
    }

    if (widthEl) {
      widthEl.value =
        String(setting.width);
    }

    if (colorEl) {
      colorEl.value =
        setting.color ||
        relationshipDefaultColor(key);
    }

    if (curvedEl) {
      curvedEl.checked =
        !!setting.curved;
    }

    if (curveEl) {
      curveEl.value =
        String(setting.curveAmount);

      curveEl.disabled =
        !setting.curved;
    }

    if (curveValueEl) {
      curveValueEl.textContent =
        String(
          Math.round(
            setting.curveAmount
          )
        ) + '%';
    }

    if (curveRow) {
      curveRow.classList.toggle(
        'is-disabled',
        !setting.curved
      );

      curveRow.setAttribute(
        'aria-disabled',
        setting.curved
          ? 'false'
          : 'true'
      );
    }

    updateRelationshipLinePreview(
      preview,
      setting,
      key
    );
  });

  syncOtherRelationshipLineControls();
}

let relationshipCurvePreviewHideTimer =
  null;

function showRelationshipCurveLivePreview(
  input,
  setting,
  colorKey='other'
) {
  const preview =
    $('relationshipCurveLivePreview');

  const path =
    $('relationshipCurveLivePreviewPath');

  const value =
    $('relationshipCurveLivePreviewValue');

  if (
    !preview ||
    !path ||
    !input ||
    input.disabled
  ) {
    return;
  }

  clearTimeout(
    relationshipCurvePreviewHideTimer
  );

  const color =
    relationshipResolvedColor(
      setting,
      colorKey
    );

  path.setAttribute(
    'd',
    relationshipCurvePreviewPath(
      setting.curveAmount
    )
  );

  path.setAttribute(
    'stroke',
    color
  );

  path.setAttribute(
    'stroke-width',
    String(
      Math.max(
        1.5,
        Number(setting.width) || 1.5
      )
    )
  );

  path.setAttribute(
    'stroke-dasharray',
    relationshipDashValue(
      setting
    )
  );

  if (value) {
    value.textContent =
      String(
        Math.round(
          setting.curveAmount
        )
      ) + '%';
  }

  const rect =
    input.getBoundingClientRect();

  const width = 260;
  const estimatedHeight = 92;
  const gap = 10;
  const margin = 12;

  const left =
    Math.min(
      Math.max(
        margin,
        rect.left +
        rect.width / 2 -
        width / 2
      ),
      Math.max(
        margin,
        window.innerWidth -
        width -
        margin
      )
    );

  const canOpenAbove =
    rect.top -
    estimatedHeight -
    gap >
    margin;

  const top =
    canOpenAbove
      ? rect.top -
        estimatedHeight -
        gap
      : rect.bottom + gap;

  preview.style.left =
    Math.round(left) + 'px';

  preview.style.top =
    Math.round(top) + 'px';

  preview.classList.add(
    'show'
  );

  preview.setAttribute(
    'aria-hidden',
    'false'
  );
}

function hideRelationshipCurveLivePreview(
  delay=180
) {
  const preview =
    $('relationshipCurveLivePreview');

  if (!preview) return;

  clearTimeout(
    relationshipCurvePreviewHideTimer
  );

  relationshipCurvePreviewHideTimer =
    setTimeout(() => {
      preview.classList.remove(
        'show'
      );

      preview.setAttribute(
        'aria-hidden',
        'true'
      );
    }, delay);
}

function updateRelationshipCurveInput(
  input,
  setting,
  colorKey='other'
) {
  setting.curveAmount =
    clampRelationshipCurveAmount(
      input.value
    );

  saveRelationshipLineSettings();

  showRelationshipCurveLivePreview(
    input,
    setting,
    colorKey
  );
}

function bindOtherRelationshipLineControls(
  root
) {
  root.querySelectorAll(
    '[data-other-rel-style]'
  ).forEach(el => {
    el.addEventListener(
      'change',
      () => {
        const type =
          otherRelationshipTypeFromDomKey(
            el.dataset.otherRelStyle
          );

        const setting =
          ensureOtherRelationshipLineSetting(
            type
          );

        setting.style =
          REL_STROKE_STYLES.has(
            el.value
          )
            ? el.value
            : 'dot';

        saveRelationshipLineSettings();
      }
    );
  });

  root.querySelectorAll(
    '[data-other-rel-width]'
  ).forEach(el => {
    el.addEventListener(
      'input',
      () => {
        const type =
          otherRelationshipTypeFromDomKey(
            el.dataset.otherRelWidth
          );

        const setting =
          ensureOtherRelationshipLineSetting(
            type
          );

        setting.width =
          Number(el.value) ||
          RELATIONSHIP_LINE_DEFAULTS.other.width;

        saveRelationshipLineSettings();
      }
    );
  });

  root.querySelectorAll(
    '[data-other-rel-color]'
  ).forEach(el => {
    el.addEventListener(
      'input',
      () => {
        const type =
          otherRelationshipTypeFromDomKey(
            el.dataset.otherRelColor
          );

        const setting =
          ensureOtherRelationshipLineSetting(
            type
          );

        setting.color =
          el.value;

        saveRelationshipLineSettings();
      }
    );
  });

  root.querySelectorAll(
    '[data-other-rel-curved]'
  ).forEach(el => {
    el.addEventListener(
      'change',
      () => {
        const type =
          otherRelationshipTypeFromDomKey(
            el.dataset.otherRelCurved
          );

        const setting =
          ensureOtherRelationshipLineSetting(
            type
          );

        setting.curved =
          el.checked;

        saveRelationshipLineSettings();
      }
    );
  });

  root.querySelectorAll(
    '[data-other-rel-curve]'
  ).forEach(el => {
    el.addEventListener(
      'input',
      () => {
        const type =
          otherRelationshipTypeFromDomKey(
            el.dataset.otherRelCurve
          );

        const setting =
          ensureOtherRelationshipLineSetting(
            type
          );

        updateRelationshipCurveInput(
          el,
          setting,
          'other'
        );
      }
    );

    el.addEventListener(
      'pointerup',
      () =>
        hideRelationshipCurveLivePreview()
    );

    el.addEventListener(
      'blur',
      () =>
        hideRelationshipCurveLivePreview()
    );
  });

  root.querySelectorAll(
    '[data-other-rel-bidirectional]'
  ).forEach(el => {
    el.addEventListener(
      'change',
      () => {
        const type =
          otherRelationshipTypeFromDomKey(
            el.dataset.otherRelBidirectional
          );

        const setting =
          ensureOtherRelationshipLineSetting(
            type
          );

        setting.bidirectional =
          el.checked;

        saveRelationshipLineSettings();
      }
    );
  });
}

document.querySelectorAll(
  '[data-rel-style]'
).forEach(el => {
  el.addEventListener(
    'change',
    () => {
      const key =
        el.dataset.relStyle;

      relationshipLineSettings[key].style =
        el.value;

      saveRelationshipLineSettings();
    }
  );
});

document.querySelectorAll(
  '[data-rel-width]'
).forEach(el => {
  el.addEventListener(
    'input',
    () => {
      const key =
        el.dataset.relWidth;

      relationshipLineSettings[key].width =
        Number(el.value);

      saveRelationshipLineSettings();
    }
  );
});

document.querySelectorAll(
  '[data-rel-color]'
).forEach(el => {
  el.addEventListener(
    'input',
    () => {
      const key =
        el.dataset.relColor;

      relationshipLineSettings[key].color =
        el.value;

      saveRelationshipLineSettings();
    }
  );
});

document.querySelectorAll(
  '[data-rel-curved]'
).forEach(el => {
  el.addEventListener(
    'change',
    () => {
      const key =
        el.dataset.relCurved;

      relationshipLineSettings[key].curved =
        el.checked;

      saveRelationshipLineSettings();
    }
  );
});

document.querySelectorAll(
  '[data-rel-curve]'
).forEach(el => {
  el.addEventListener(
    'input',
    () => {
      const key =
        el.dataset.relCurve;

      updateRelationshipCurveInput(
        el,
        relationshipLineSettings[key],
        key
      );
    }
  );

  el.addEventListener(
    'pointerup',
    () =>
      hideRelationshipCurveLivePreview()
  );

  el.addEventListener(
    'blur',
    () =>
      hideRelationshipCurveLivePreview()
  );
});

$('resetRelationshipStyleBtn')
  ?.addEventListener(
    'click',
    () => {
      relationshipLineSettings =
        createRelationshipLineSettings();

      try {
        localStorage.removeItem(
          REL_LINE_STYLE_KEY
        );
      } catch (_) {}

      renderOtherRelationshipLineControls();
      applyRelationshipLineSettings();

      if (getSceneLayout()) {
        drawEdges();
      }
    }
  );

function applyLabelLock(locked) {
  labelLocked = !!locked;
  if (labelLocked) {
    setIconText(labelLockToggle, 'unlock', '解鎖關係');
    labelLockToggle.classList.add('active');
    labelsSvg.classList.add('labels-locked');
    if (labelDrag) { labelDrag.el.classList.remove('dragging'); labelDrag = null; }
  } else {
    setIconText(labelLockToggle, 'lock', '鎖定關係');
    labelLockToggle.classList.remove('active');
    labelsSvg.classList.remove('labels-locked');
  }
  try { localStorage.setItem(LABEL_LOCK_KEY, labelLocked ? '1' : '0'); } catch(e){}
}
function syncRelationshipToolbarVisibility() {
  if (!labelLockToggle) return;
  labelLockToggle.hidden = !showRelLabels;
  labelLockToggle.style.display = showRelLabels ? '' : 'none';
}
labelLockToggle.onclick = () => applyLabelLock(!labelLocked);

function restoreCanvasBackground() {
  let restored = null;

  try {
    const serialized = localStorage.getItem(BG_KEY);
    if (serialized) restored = JSON.parse(serialized);
  } catch (_) {
    restored = null;
  }

  if (
    restored &&
    typeof restored === 'object' &&
    !Array.isArray(restored)
  ) {
    const opacity = Number(restored.opacity);

    bgSettings = {
      image:restored.image || null,
      opacity:Number.isFinite(opacity)
        ? Math.max(0, Math.min(1, opacity))
        : 0.5,
      fit:['cover','contain','repeat'].includes(restored.fit)
        ? restored.fit
        : 'cover'
    };
  }

  renderCanvasBackground();
}

function renderCanvasBackground() {
  const root = document.documentElement;
  const url = resolveImageUrl(bgSettings.image);

  if (!url) {
    [
      '--custom-bg',
      '--custom-bg-opacity',
      '--custom-bg-size',
      '--custom-bg-repeat'
    ].forEach(property => {
      root.style.removeProperty(property);
    });

    viewport.classList.remove('has-bg');
    return;
  }

  const repeated = bgSettings.fit === 'repeat';

  root.style.setProperty('--custom-bg', `url("${url}")`);
  root.style.setProperty(
    '--custom-bg-opacity',
    String(bgSettings.opacity)
  );
  root.style.setProperty(
    '--custom-bg-size',
    repeated ? 'auto' : bgSettings.fit
  );
  root.style.setProperty(
    '--custom-bg-repeat',
    repeated ? 'repeat' : 'no-repeat'
  );

  viewport.classList.add('has-bg');
}

function persistCanvasBackground() {
  try {
    localStorage.setItem(
      BG_KEY,
      JSON.stringify(bgSettings)
    );
  } catch (_) {
    uiAlert(
      '背景圖片設定儲存失敗。',
      {
        title:'儲存失敗',
        kind:'danger'
      }
    );
  }
}

function paintCanvasBackgroundPreview() {
  const preview = $('appearanceBackgroundPreview');
  if (!preview) return;

  const url = resolveImageUrl(bgSettings.image);

  preview.style.backgroundImage =
    url ? `url("${url}")` : '';

  preview.textContent =
    url ? '' : '尚未設定背景圖片';
}

function openAppearancePanel() {
  $('appearanceBackgroundOpacity').value =
    Math.round(bgSettings.opacity * 100);
  $('appearanceBackgroundOpacityValue').textContent =
    Math.round(bgSettings.opacity * 100) + '%';
  $('appearanceBackgroundFit').value = bgSettings.fit;

  customColor1.value = customColors.c1;
  customColor2.value = customColors.c2;

  paintCustomThemePreview();
  paintThemeChoices();
  paintCanvasBackgroundPreview();
  renderOtherRelationshipLineControls();
  syncRelationshipLineControls();

  appearanceDialog.classList.add('show');
}

function closeAppearancePanel() {
  appearanceDialog.classList.remove('show');
}

async function replaceCanvasBackground(file) {
  const result = await compressBgImage(file);

  bgSettings.image = await saveImageAsset(
    result.blob,
    {
      width:result.width,
      height:result.height
    }
  );

  renderCanvasBackground();
  persistCanvasBackground();
  paintCanvasBackgroundPreview();
}

function setCanvasBackgroundOpacity(percent) {
  const value =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );

  bgSettings.opacity = value / 100;
  $('appearanceBackgroundOpacityValue').textContent =
    Math.round(value) + '%';

  renderCanvasBackground();
  persistCanvasBackground();
}

function setCanvasBackgroundFit(fit) {
  bgSettings.fit =
    ['cover','contain','repeat'].includes(fit)
      ? fit
      : 'cover';

  renderCanvasBackground();
  persistCanvasBackground();
}

async function removeCanvasBackground() {
  if (!bgSettings.image) return;

  const confirmed = await uiConfirm(
    '確定清除目前背景圖片嗎？',
    {
      title:'移除背景圖片',
      kind:'danger',
      confirmText:'移除背景'
    }
  );

  if (!confirmed) return;

  bgSettings.image = null;
  scheduleGC();

  renderCanvasBackground();
  persistCanvasBackground();
  paintCanvasBackgroundPreview();
  await updateStorageInfo();
}

async function compressBgImage(file) {
  validateSupportedImageFile(file);
  const optimized = await assetStore.optimizeImage(file, {
    maxDimension:BG_MAX,
    webpQuality:BG_QUALITY,
    jpegQuality:BG_QUALITY,
    preserveAlpha:'auto'
  });

  return {
    blob:optimized.blob,
    width:optimized.width,
    height:optimized.height,
    sizeKB:Math.round(optimized.byteSize / 1024)
  };
}
function paintCanvasBackgroundPreview() {
  const el = $('appearanceBackgroundPreview');
  const url = resolveImageUrl(bgSettings.image);
  if (url) {
    el.style.backgroundImage = `url("${url}")`;
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = '尚未設定背景圖片';
  }
}

function formatStorageSize(byteSize) {
  const bytes = Math.max(0, Number(byteSize) || 0);
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

async function updateStorageInfo() {
  const assetCountEl = $('storageAssetCount');
  const assetSizeEl = $('storageAssetSize');

  let assetCount = 0;
  let assetBytes = 0;

  try {
    const stats = await assetStore.getStats();
    assetCount = Number(stats.count) || 0;
    assetBytes = Number(stats.byteSize) || 0;
  } catch (error) {
    console.warn('讀取圖片儲存統計失敗：', error);
  }

  if (assetCountEl) assetCountEl.textContent = String(assetCount);
  if (assetSizeEl) assetSizeEl.textContent = formatStorageSize(assetBytes);
}

$('appearanceBtn').onclick = openAppearancePanel;
$('appearanceCloseBtn').onclick = closeAppearancePanel;
appearanceDialog.onclick = event => {
  if (event.target === appearanceDialog) {
    closeAppearancePanel();
  }
};

$('storageBtn').onclick = () => {
  updateStorageInfo();
  storageDialog.classList.add('show');
};
$('storageCloseBtn').onclick = () => storageDialog.classList.remove('show');
storageDialog.onclick = e => { if (e.target === storageDialog) storageDialog.classList.remove('show'); };

// ========【恢復預設】 設定 - 介面設定與範例資料分開處理 ========
const resetUiSettingsBtn = $('resetUiSettingsBtn');
if (resetUiSettingsBtn) {
  resetUiSettingsBtn.onclick = async () => {
    const ok = await uiConfirm(
      '恢復主題、背景、側邊欄寬度、檢視模式與關係線等介面設定？\n族譜人物、關係與卡片位置不會被刪除。',
      { title:'重設介面設定', confirmText:'重設', kind:'default' }
    );
    if (!ok) return;

    [THEME_KEY, CUSTOM_COLORS_KEY, BG_KEY, MODE_KEY, LABELS_KEY,
      LABEL_LOCK_KEY, SIDEBAR_WIDTH_KEY, FAMILY_PANEL_COLLAPSED_KEY,
      PERSON_LIBRARY_VIEW_KEY, REL_LINE_STYLE_KEY].forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });

    customColors = { c1:'#f0c050', c2:'#a878c8' };
    bgSettings = { image:null, opacity:0.5, fit:'cover' };
    showRelLabels = true;
    personLibraryViewMode = 'detailed';
    relationshipLineSettings = JSON.parse(JSON.stringify(RELATIONSHIP_LINE_DEFAULTS));
    applyRelationshipLineSettings();
    applySidebarWidth(SIDEBAR_DEFAULT_WIDTH, { persist:false });
    setFamilyPanelCollapsed(false, { persist:false });
    chooseThemePreset('ling');
    applyViewMode('view');
    applyLabelLock(false);
    renderCanvasBackground();
    paintCanvasBackgroundPreview();
    updateLayoutToggle();
    const labelBtn = $('labelToggle');
    if (labelBtn) {
      labelBtn.classList.add('active');
      setIconText(labelBtn, 'tags', '隱藏關係');
    }
    paintThemeChoices();
    render();
    requestAnimationFrame(fitScreen);
    uiToast('介面設定已恢復預設。');
  };
}

const restoreSampleBtn = $('restoreSampleBtn');
if (restoreSampleBtn) {
  restoreSampleBtn.onclick = async event => {
    event?.preventDefault();
    event?.stopPropagation();

    // 防止連點造成兩個確認流程同時存在。
    if (restoreSampleBtn.dataset.confirmPending === '1') return;
    restoreSampleBtn.dataset.confirmPending = '1';

    try {
      // 讓觸發按鈕的 click / key activation 完整結束後才顯示確認視窗，
      // 避免同一個輸入事件落到確認按鈕。
      await new Promise(resolve => requestAnimationFrame(resolve));

      const ok = await uiConfirm(
        '這會刪除目前族譜資料，並恢復繁體中文的預設族譜。\n此操作無法復原，建議先匯出 JSON 備份。',
        { title:'恢復預設族譜', confirmText:'恢復預設族譜', kind:'danger' }
      );

      if (!ok) return;

      closeEditor();

      const sampleDb =
        buildSample();

      normalizeCurrentDatabase(
        sampleDb
      );

      genealogyData = sampleDb;
      dragHistory.clear();
      invalidateChildrenIndex();
      invalidateRelationshipGraph();
      save({ immediate:true });
      refreshFamilyUI();
      render();
      appearanceDialog.classList.remove('show');
      storageDialog.classList.remove('show');
      requestAnimationFrame(fitScreen);
      uiToast('已恢復預設族譜。');
    } finally {
      delete restoreSampleBtn.dataset.confirmPending;
    }
  };
}

$('appearanceBackgroundInput').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await replaceCanvasBackground(file);
  } catch (error) {
    uiAlert(
      '背景處理失敗：' + error.message,
      {
        title:'圖片處理失敗',
        kind:'danger'
      }
    );
  } finally {
    event.target.value = '';
  }
};

$('appearanceBackgroundOpacity').oninput = event => {
  setCanvasBackgroundOpacity(
    event.currentTarget.value
  );
};

$('appearanceBackgroundFit').onchange = event => {
  setCanvasBackgroundFit(
    event.currentTarget.value
  );
};

$('appearanceBackgroundClearBtn').onclick = removeCanvasBackground;

$('cleanupBtn').onclick = async () => {
  if (!await uiConfirm('將掃描所有未被引用的圖片並刪除。確定繼續嗎？', { title: '清理未使用圖片', kind: 'danger', confirmText: '開始清理' })) return;
  const button = $('cleanupBtn');
  if (button) button.disabled = true;
  try {
    const n = await cleanupUnusedImages();
    uiToast(n > 0 ? `清理完成：刪除了 ${n} 張未使用圖片。` : '目前沒有可清理的圖片。');
    await updateStorageInfo();
  } finally {
    if (button) button.disabled = false;
  }
};

$('helpBtn').onclick = () => helpDialog.classList.add('show');
$('helpCloseBtn').onclick = () => helpDialog.classList.remove('show');
helpDialog.onclick = e => { if (e.target === helpDialog) helpDialog.classList.remove('show'); };

const MODAL_STACK = ['avatarCropDialog','lifePhotoEditorDialog','petEditorDialog','simEditorDialog','personProfileDialog','lifePhotoViewerDialog',
                     'helpDialog','personLibraryDialog','familyMemberPickerDialog','storageDialog','appearanceDialog'];
function closeTopModal() {
  for (const id of MODAL_STACK) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('show')) {
      el.classList.remove('show');
      if (id === 'simEditorDialog') {
    resetSimEditorDraftState();
  }
      if (id === 'petEditorDialog') { petEditorState.index=-1; petEditorState.avatar=null; petEditorState.avatarFrame={...DEFAULT_AVATAR_FRAME}; }
      if (id === 'avatarCropDialog') { avatarCropTarget=null; avatarCropDraft={...DEFAULT_AVATAR_FRAME}; avatarCropUrl=''; avatarCropPointer=null; }
      if (id === 'lifePhotoEditorDialog') { lifePhotoState.editor.index = -1; lifePhotoState.editor.imageRef = ''; }
      if (id === 'personProfileDialog') personProfilePersonId = null;
      if (id === 'lifePhotoViewerDialog') {
        lifePhotoState.viewer.simId = null;
        lifePhotoState.viewer.mode = 'draft';
      }
      return true;
    }
  }
  return false;
}

function genealogyParentRelations(child, byId = null) {
  if (!child) return [];

  const childId = String(child.id || '');
  const relationByParent = new Map();

  const hasParent = parentId => {
    const id = String(parentId || '');
    if (!id || id === childId) return false;
    return byId instanceof Map
      ? byId.has(id)
      : !!genealogyData?.sims?.[id];
  };

  const addRelation = (parentId, kind) => {
    const id = String(parentId || '');
    if (!hasParent(id)) return;

    const current = relationByParent.get(id);
    if (current === 'adoptive') return;

    if (kind === 'adoptive' || !current) {
      relationByParent.set(id, kind);
    }
  };

  (child.parentIds || []).forEach(parentId => {
    addRelation(parentId, 'parent-child');
  });

  const explicitAdoptedParentIds =
    (child.gameData?.adoptedParentIds || [])
      .map(String)
      .filter(Boolean);

  explicitAdoptedParentIds.forEach(parentId => {
    addRelation(parentId, 'adoptive');
  });

  const parentPool =
    byId instanceof Map
      ? [...byId.values()]
      : Object.values(genealogyData?.sims || {});

  parentPool.forEach(parent => {
    if (!parent || parent.id == null) return;

    const adoptedChildIds =
      (parent.gameData?.adoptedChildIds || [])
        .map(String);

    if (adoptedChildIds.includes(childId)) {
      addRelation(parent.id, 'adoptive');
    }
  });

  return [...relationByParent.entries()]
    .map(([parentId, kind]) => ({ parentId, kind }))
    .sort((left, right) =>
      String(left.parentId).localeCompare(String(right.parentId))
    );
}

function genealogyParentIds(child, byId = null) {
  return genealogyParentRelations(child, byId)
    .map(relation => relation.parentId);
}

function genealogyParentRelationGroups(child, byId = null) {
  const groups = new Map();

  genealogyParentRelations(child, byId)
    .forEach(relation => {
      if (!groups.has(relation.kind)) {
        groups.set(relation.kind, []);
      }
      groups.get(relation.kind).push(relation.parentId);
    });

  return [...groups.entries()]
    .map(([kind, parentIds]) => ({
      kind,
      parentIds:[...new Set(parentIds)].sort()
    }))
    .filter(group => group.parentIds.length);
}

function genealogyParentKindFor(child, parentId, byId = null) {
  const id = String(parentId || '');
  const relation =
    genealogyParentRelations(child, byId)
      .find(item => item.parentId === id);

  return relation ? relation.kind : 'parent-child';
}

function normalizeAdoptionMetadataShape(sim){
    if(!sim)return null;
    if(!sim.gameData||typeof sim.gameData!=='object'||Array.isArray(sim.gameData))sim.gameData={};
    if(!Array.isArray(sim.gameData.adoptedParentIds))sim.gameData.adoptedParentIds=[];
    if(!Array.isArray(sim.gameData.adoptedChildIds))sim.gameData.adoptedChildIds=[];
    sim.gameData.adoptedParentIds=[...new Set(sim.gameData.adoptedParentIds.map(String).filter(Boolean))];
    sim.gameData.adoptedChildIds=[...new Set(sim.gameData.adoptedChildIds.map(String).filter(Boolean))];
    return sim.gameData;
  }
function isDescendant(ancestorId, nodeId) {
  const queue = [nodeId];
  const seen = new Set();

  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);

    const sim = genealogyData.sims[id];
    if (!sim) continue;

    for (const parentId of genealogyParentIds(sim)) {
      if (parentId === ancestorId) return true;
      queue.push(parentId);
    }
  }

  return false;
}

let _childrenIndex = null;
function getChildrenOf(id) {
  const parentId = String(id || '');

  if (!_childrenIndex) {
    _childrenIndex = new Map();

    Object.values(genealogyData.sims)
      .forEach(child => {
        genealogyParentIds(child)
          .forEach(pid => {
            if (!_childrenIndex.has(pid)) {
              _childrenIndex.set(pid, []);
            }

            const list = _childrenIndex.get(pid);
            if (!list.some(item => String(item.id) === String(child.id))) {
              list.push(child);
            }
          });
      });
  }

  return _childrenIndex.get(parentId) || [];
}
function invalidateChildrenIndex() {
  _childrenIndex = null;
}

function invalidateRelationshipGraph() {
  return genealogyRuntime?.invalidateRelationships?.();
}

genealogyStore =
  window.L1nGGenealogyStore?.create?.({
    getData:() => genealogyData,
    uid,
    getParentRelations:(sim) => genealogyParentRelations(sim),
    isSiblingLink,
    siblingRelationType:SIBLING_RELATION_TYPE,
    siblingRelationLabel:SIBLING_RELATION_LABEL,
    normalizeRelationshipType:normalizeRelationshipTypeText,
    isBuiltInRelationshipType:isBuiltInSocialRelationshipType
  }) ||
  null;

if (!genealogyStore) {
  throw new Error('Genealogy Store failed to initialize.');
}

function applyGenealogyMutation(
  mutation,
  {
    immediateSave = false,
    immediateRender = true,
    render = true,
    refreshFamily = true
  } = {}
) {
  if (!mutation?.dataChanged) return mutation;

  if (mutation.childrenIndexChanged) {
    invalidateChildrenIndex();
  }

  if (mutation.relationshipGraphChanged) {
    invalidateRelationshipGraph();
  }

  if (mutation.saveDirty) {
    save({ immediate:immediateSave });
  }

  if (
    refreshFamily &&
    mutation.familyUiChanged
  ) {
    refreshFamilyUI();
  }

  if (render) {
    const layers = {
      layout:!!mutation.layoutChanged,
      nodes:!!mutation.nodesChanged,
      edges:!!mutation.edgesChanged,
      chrome:!!mutation.chromeChanged,
      lists:!!mutation.listsChanged
    };

    if (Object.values(layers).some(Boolean)) {
      invalidateRender(
        layers,
        { immediate:immediateRender }
      );
    }
  }

  if (mutation.assetsChanged) {
    scheduleGC();
  }

  return mutation;
}


// ========【L1nG v1 資料正規化】 設定 - 只維護目前網站 canonical shape ========
function normalizeCurrentDatabase(targetDb) {
  Object.values(targetDb.sims || {}).forEach(sim => {
    if (!sim || typeof sim !== 'object') return;

    sim.gender = sim.gender || '男';
    sim.lifeStage = sim.lifeStage || '成年';
    sim.status = sim.status || '在世';

    if (!Array.isArray(sim.parentIds)) sim.parentIds = [];
    sim.parentIds = sim.parentIds
      .map(String)
      .filter(id => targetDb.sims[id]);

    if (!Array.isArray(sim.spouseIds)) sim.spouseIds = [];
    if (!Array.isArray(sim.exSpouseIds)) sim.exSpouseIds = [];
    if (!Array.isArray(sim.traits)) sim.traits = [];

    sim.spouseIds = sim.spouseIds
      .map(String)
      .filter(id => targetDb.sims[id]);

    sim.exSpouseIds = sim.exSpouseIds
      .map(String)
      .filter(id => targetDb.sims[id]);

    if (sim.avatar === undefined) sim.avatar = null;
    sim.avatarFrame = normalizeAvatarFrame(sim.avatarFrame);
    if (sim.race === undefined) sim.race = '';
    if (sim.residence === undefined) sim.residence = '';
    if (sim.aspiration === undefined) sim.aspiration = '';
    if (sim.causeOfDeath === undefined) sim.causeOfDeath = '';
    normalizeAdoptionMetadataShape(sim);
    sim.gameData.adoptedParentIds = sim.gameData.adoptedParentIds.filter(id => targetDb.sims[id] && id !== String(sim.id));
    sim.gameData.adoptedChildIds = sim.gameData.adoptedChildIds.filter(id => targetDb.sims[id] && id !== String(sim.id));
    delete sim.adoptive;

    if (!Array.isArray(sim.pets)) sim.pets = [];
    sim.pets = sim.pets
      .filter(pet => pet && typeof pet === 'object')
      .map(pet => ({
        ...pet,
        id:pet.id || uid('pet'),
        name:pet.name || '',
        species:pet.species || 'other',
        breed:pet.breed || '',
        gender:isEaCasPetSpecies(pet.species) ? (normalizePetGender(pet.gender) || 'male') : '',
        ageStage:pet.ageStage || '成年',
        status:pet.status || '在世',
        avatar:pet.avatar || null,
        avatarFrame:normalizeAvatarFrame(pet.avatarFrame)
      }));

    if (!Array.isArray(sim.gallery)) sim.gallery = [];
    sim.gallery = sim.gallery
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        ...item,
        id:item.id || uid('gal'),
        title:item.title || '',
        note:item.note || '',
        lifeStage:item.lifeStage || '',
        image:item.image || '',
        addedAt:item.addedAt || Date.now()
      }));
  });

  if (!Array.isArray(targetDb.links)) {
    targetDb.links = [];
  }

  targetDb.links = targetDb.links
    .filter(link =>
      link &&
      typeof link === 'object'
    )
    .map(link => {
      const next = { ...link };

      const legacySibling =
        next.type === '兄弟姐妹' ||
        next.type === '兄弟姊妹' ||
        next.label === '兄弟姐妹' ||
        next.label === '兄弟姊妹';

      if (legacySibling) {
        next.type =
          SIBLING_RELATION_TYPE;

        next.label =
          SIBLING_RELATION_LABEL;
      }

      return next;
    });

  const importedRelationshipTypeLibrary =
    Array.isArray(
      targetDb.relationshipTypeLibrary
    )
      ? targetDb.relationshipTypeLibrary
      : [];

  const relationshipTypesFromLinks =
    targetDb.links
      .filter(link =>
        !isSiblingLink(link)
      )
      .map(link =>
        normalizeRelationshipTypeText(
          link.label ||
          link.type ||
          ''
        )
      )
      .filter(Boolean);

  targetDb.relationshipTypeLibrary =
    [...new Set([
      ...importedRelationshipTypeLibrary
        .map(
          normalizeRelationshipTypeText
        )
        .filter(Boolean),
      ...relationshipTypesFromLinks
    ])]
      .filter(type =>
        type !== '關聯' &&
        !isBuiltInSocialRelationshipType(
          type
        )
      );

  if (
    !targetDb.relationshipMap ||
    typeof targetDb.relationshipMap !== 'object' ||
    Array.isArray(targetDb.relationshipMap)
  ) {
    targetDb.relationshipMap = {};
  } else {
    const normalizedRelationshipMap = {};

    Object.entries(
      targetDb.relationshipMap
    ).forEach(([key, saved]) => {
      if (
        !saved ||
        typeof saved !== 'object' ||
        Array.isArray(saved)
      ) {
        return;
      }

      const text =
        typeof saved.text === 'string'
          ? saved.text.trim()
          : '';

      const hidden =
        saved.hidden === true ||
        saved.kind === 'none';

      if (!text && !hidden) {
        return;
      }

      normalizedRelationshipMap[key] = {
        ...(text ? { text } : {}),
        ...(hidden ? { hidden:true } : {})
      };
    });

    targetDb.relationshipMap =
      normalizedRelationshipMap;
  }

  if (
    !targetDb.labelPositions ||
    typeof targetDb.labelPositions !== 'object' ||
    Array.isArray(targetDb.labelPositions)
  ) {
    targetDb.labelPositions = {};
  }

  targetDb.families.forEach(family => {
    if (!family || typeof family !== 'object') return;

    if (!Array.isArray(family.memberIds)) {
      family.memberIds = [];
    }

    family.memberIds = [...new Set(
      family.memberIds
        .map(String)
        .filter(id => targetDb.sims[id])
    )];

    ensureFamilyLayoutShape(family);
    ensureFamilyProfileShape(family);
  });

  const hasCurrentFamily =
    targetDb.currentFamilyId != null &&
    targetDb.families.some(
      family =>
        family &&
        family.id === targetDb.currentFamilyId
    );

  if (!hasCurrentFamily) {
    targetDb.currentFamilyId =
      targetDb.families[0]?.id ||
      null;
  }
}

function repairImportedHouseholdMembership(targetDb) {
  if (!targetDb || !targetDb.sims || !Array.isArray(targetDb.families)) return false;

  let changed = false;

  targetDb.families.forEach(fam => {
    if (!fam || !fam.gameImport) return;
    if (fam.gameData?.householdId == null) return;
    if (!Array.isArray(fam.gameData?.householdMemberIds)) return;

    const actualMemberIds = [...new Set(
      fam.gameData.householdMemberIds
        .map(String)
        .filter(id => targetDb.sims[id])
    )];

    const currentMemberIds = Array.isArray(fam.memberIds)
      ? fam.memberIds.map(String)
      : [];

    const same =
      currentMemberIds.length === actualMemberIds.length &&
      currentMemberIds.every((id, index) => id === actualMemberIds[index]);

    if (same) return;

    fam.memberIds = actualMemberIds;
    changed = true;
  });

  return changed;
}


function collectReferencedAssetIds(targetDb = genealogyData, targetBg = bgSettings, { strict = false } = {}) {
  const used = new Set();

  const add = (ref, label) => {
    if (!ref) return;
    if (isAssetId(ref)) {
      used.add(ref);
      return;
    }
    if (strict) {
      throw new Error(`${label || '圖片'}使用了目前不支援的舊圖片格式。`);
    }
  };

  Object.values(targetDb?.sims || {}).forEach(sim => {
    add(sim.avatar, '人物頭像');
    (sim.gallery || []).forEach(item => add(item.image, '人生照片'));
    (sim.pets || []).forEach(pet => add(pet.avatar, '寵物頭像'));
  });

  (targetDb?.families || []).forEach(fam => add(fam.coverImage, '家族封面'));
  (targetDb?.meta?.unassignedPets || []).forEach(pet => add(pet.avatar, '未分配寵物頭像'));
  add(targetBg?.image, '背景圖片');

  return used;
}

function clearUnsupportedImageRefs(targetDb = genealogyData, targetBg = bgSettings) {
  let cleared = 0;

  const clean = (obj, key, emptyValue = null) => {
    if (!obj || !obj[key] || isAssetId(obj[key])) return;
    obj[key] = emptyValue;
    cleared++;
  };

  Object.values(targetDb?.sims || {}).forEach(sim => {
    clean(sim, 'avatar', null);
    (sim.gallery || []).forEach(item => clean(item, 'image', ''));
    (sim.pets || []).forEach(pet => clean(pet, 'avatar', null));
  });

  (targetDb?.families || []).forEach(fam => clean(fam, 'coverImage', null));
  (targetDb?.meta?.unassignedPets || []).forEach(pet => clean(pet, 'avatar', null));
  clean(targetBg, 'image', null);

  return cleared;
}

async function cleanupUnusedImages() {
  const used = collectReferencedAssetIds();
  const removed = await assetStore.garbageCollect(used);
  if (removed) console.log(`[GC] 清理了 ${removed} 張未使用的圖片資產`);
  return removed;
}

let _gcTimer = null;
function scheduleGC() {
  if (_gcTimer) return;
  _gcTimer = setTimeout(async () => {
    _gcTimer = null;
    await cleanupUnusedImages();
  }, 5000);
}

function getRelInfoByKey(
  key,
  semanticType,
  defaultText = null
) {
  const saved =
    relationshipDisplayOverride(
      key
    );

  if (saved.hidden === true) {
    return null;
  }

  const descriptor =
    relationshipSemanticDescriptor(
      semanticType,
      defaultText
    );

  const customText =
    typeof saved.text === 'string'
      ? saved.text.trim()
      : '';

  return {
    icon:descriptor.icon,
    text:
      customText ||
      descriptor.label,
    semanticType:
      descriptor.semanticType
  };
}

function getLabelOffset(key) {
  if (!key) return { dx:0, dy:0 };
  const o = (genealogyData.labelPositions || {})[key] || {};
  return { dx: o.dx || 0, dy: o.dy || 0 };
}

const _mc = document.createElement('canvas');
const _mctx = _mc.getContext('2d');
const _textMeasureCache = new Map();
function getMeasureFontStack() {
  const lang = document.documentElement.lang || 'zh-Hant';
  if (lang === 'zh-Hans') return '"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';
  if (lang === 'en') return '"Segoe UI",Inter,Arial,system-ui,sans-serif';
  return '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
}
function measureText(t, fs) {
  const fontStack = getMeasureFontStack();
  const key = fontStack + '\u0001' + fs + '\u0001' + t;
  let v = _textMeasureCache.get(key);
  if (v !== undefined) return v;
  _mctx.font = `${fs}px ${fontStack}`;
  v = _mctx.measureText(t).width;
  if (_textMeasureCache.size > 3000) _textMeasureCache.clear();
  _textMeasureCache.set(key, v);
  return v;
}

function makeLabelSVG(x, y, iconName, text, key) {
  const fs = 12;
  const displayText = displayRelationshipText(text);
  const iconSpace = iconName ? 18 : 0;
  // 依實際顯示語言量測；英文較長時標籤會自動擴寬，不再被裁切。
  const w = Math.max(Math.ceil(measureText(displayText, fs) + iconSpace + 24), 42);
  const h = 22;
  const off = getLabelOffset(key);
  const tx = (x + off.dx).toFixed(1);
  const ty = (y + off.dy).toFixed(1);
  const keyAttr = key ? ` data-key="${esc(key)}"` : '';
  const iconHtml = iconName ? iconSvg(iconName) : '';
  return `<g class="edge-label"${keyAttr} data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" transform="translate(${tx},${ty})">
    <rect x="${(-w/2).toFixed(1)}" y="${-h/2}" width="${w.toFixed(1)}" height="${h}" rx="${h/2}"
      fill="var(--label-bg)" stroke="var(--label-border)" stroke-width="1.5"/>
    <foreignObject x="${(-w/2).toFixed(1)}" y="${-h/2}" width="${w.toFixed(1)}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="edge-label-content">${iconHtml}<span>${esc(displayText)}</span></div>
    </foreignObject>
  </g>`;
}

async function compressImage(file, kind = 'sim') {
  validateSupportedImageFile(file);
  const policy =
    kind === 'pet'
      ? IMAGE_PROCESSING_POLICY.petAvatar
      : IMAGE_PROCESSING_POLICY.avatar;

  const optimized = await assetStore.optimizeImage(file, {
    maxDimension:policy.max,
    webpQuality:policy.webp,
    jpegQuality:policy.jpeg,
    preserveAlpha:'auto'
  });

  return {
    blob:optimized.blob,
    width:optimized.width,
    height:optimized.height,
    sizeKB:Math.round(optimized.byteSize / 1024),
    isOriginal:optimized.usedOriginal
  };
}

async function compressGalleryImage(file) {
  validateSupportedImageFile(file);
  const policy = IMAGE_PROCESSING_POLICY.gallery;

  const optimized = await assetStore.optimizeImage(file, {
    maxDimension:policy.max,
    webpQuality:policy.webp,
    jpegQuality:policy.jpeg,
    preserveAlpha:'auto',
    keepOriginal:false
  });

  return {
    blob:optimized.blob,
    width:optimized.width,
    height:optimized.height,
    sizeKB:Math.round(optimized.byteSize / 1024),
    isOriginal:optimized.usedOriginal
  };
}

function getVisibleIds(familyId) {
  const fam =
    familyId ===
      genealogyData.currentFamilyId
      ? currentTreeFamily()
      : genealogyData.families.find(
          f => f.id === familyId
        );

  if (!fam) {
    return new Set();
  }

  const memberIds =
    (fam.memberIds || [])
      .map(String)
      .filter(id =>
        genealogyData.sims[id]
      );

  const result =
    new Set(memberIds);

  // ========【外部關係人物顯示範圍】 設定 - attachment 不再二次擴張 ========
  // EA 家庭 / EA 族譜：
  //   只從 primary 成員附加其直接配偶／前任。
  //   已經附著進來的 X 不會再把 X 的其他伴侶／家系帶進來。
  //
  // 大家族：
  //   保留原本「完整連通族譜」語意，memberIds 本身就是完整 component；
  //   仍允許補上 component 邊界上的直接配偶／前任。
  const relationshipSources =
    familyId ===
      genealogyData.currentFamilyId &&
    familyTreeViewMode !== 'extended' &&
    Array.isArray(
      fam.primaryMemberIds
    ) &&
    fam.primaryMemberIds.length
      ? fam.primaryMemberIds
      : memberIds;

  [...new Set(
    relationshipSources.map(String)
  )].forEach(id => {
    const sim =
      genealogyData.sims[id];

    if (!sim) return;

    [
      ...(sim.spouseIds || []),
      ...(sim.exSpouseIds || [])
    ]
      .map(String)
      .forEach(relatedId => {
        if (
          genealogyData.sims[
            relatedId
          ]
        ) {
          result.add(
            relatedId
          );
        }
      });
  });

  // 篩選是真正的顯示篩選。
  [...result].forEach(id => {
    if (
      !simMatchesTopbarFilters(
        genealogyData.sims[id]
      )
    ) {
      result.delete(id);
    }
  });

  return result;
}

// ========【圖片預熱】 設定 - 只預先載入目前畫面會立即看到的圖片，避免 F5 後頭像逐張跳出 ========
function preloadCurrentViewAssets() {
  if (!assetStoreReady || !genealogyData) {
    return Promise.resolve({
      requested:0,
      loaded:0
    });
  }

  const priorityIds = new Set();
  const secondaryIds = new Set();

  const addPriority = ref => {
    if (isAssetId(ref)) {
      priorityIds.add(ref);
    }
  };

  const addSecondary = ref => {
    if (
      isAssetId(ref) &&
      !priorityIds.has(ref)
    ) {
      secondaryIds.add(ref);
    }
  };

  addPriority(bgSettings?.image);

  const family =
    currentTreeFamily() ||
    currentFamily();

  addPriority(family?.coverImage);

  const visibleIds =
    getVisibleIds(
      genealogyData.currentFamilyId
    );

  visibleIds.forEach(id => {
    const sim =
      genealogyData.sims[id];

    if (sim) {
      addPriority(sim.avatar);
    }
  });

  // 側邊欄中目前不在主畫布的成員降為第二優先，
  // 不阻塞主畫布首次顯示。
  (currentFamily()?.memberIds || [])
    .forEach(id => {
      const sim =
        genealogyData.sims[id];

      if (sim) {
        addSecondary(sim.avatar);
      }
    });

  const primary =
    assetStore.preloadUrls(
      priorityIds,
      { concurrency:4 }
    );

  void primary
    .catch(() => {})
    .then(() =>
      assetStore.preloadUrls(
        secondaryIds,
        { concurrency:2 }
      )
    )
    .catch(() => {});

  return primary;
}

// ========【族譜 Scene】 設定 - Layout / Relationship Geometry / Renderer 唯一 Canvas Authority ========
genealogyScene =
  window.L1nGGenealogyScene?.create?.({
    runtime:genealogyRuntime,
    dom:{ stage, svg, labelsSvg, nodes },
    constants:{ PAD, VIEW_CARD_LAYOUT, RACE_PRESETS, GUIDE_SNAP_PX, RELATIONSHIP_VERTICAL_SNAP_PX },
    state:{
      getData:() => genealogyData,
      getViewMode:() => viewMode,
      getFamilyTreeViewMode:() => familyTreeViewMode,
      getShowRelLabels:() => showRelLabels,
      getRelationshipPerspectiveId:() => relationshipPerspectiveSimId,
      getScale:() => scale
    },
    helpers:{
      getCardViewSettings, getCardEditSettings, cardViewAppearanceClass, cardSettingsHasBody,
      buildViewCardContentModel, renderViewCardLine, getDims, getNodeDimensions, getNodeDimensionsById,
      getGaps, getCurrentManualPositions, getCurrentFreeLayout, formatCardGender, formatCardAge,
      getActiveFamilySelectorEntry, currentTreeFamily, currentFamily, uiText, displayDataText,
      displayRelationshipText, isSiblingLink, resolveKinshipLabel, relationshipPerspectiveSim,
      clampRelationshipCurveAmount, relationshipLineSetting, relationshipOtherType,
      getOtherRelationshipLineSetting, relationshipResolvedColor, relationshipInlineSvgStyle,
      genealogyParentIds, genealogyParentRelationGroups, getChildrenOf, getRelInfoByKey, measureText,
      makeLabelSVG, getVisibleIds, syncNodeSelectionClasses, formatBirthdaySummary, esc, iconSvg, pairKey,
      avatarHTML, buildTagsHTML, buildPetsChipsHTML, genderClass, statusClass
    }
  }) || null;
if (!genealogyScene) throw new Error('Genealogy Scene failed to initialize.');
function getSceneLayout() { return genealogyScene?.getLayoutSnapshot?.() || null; }
let _transformSettleTimer = null;
function applyTransform({ interacting = false } = {}) {
  // 對齊實體像素，避免非整數位移讓文字與卡片邊框變糊。
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const crispX = Math.round(panX * dpr) / dpr;
  const crispY = Math.round(panY * dpr) / dpr;
  stage.style.transform = `translate(${crispX}px, ${crispY}px) scale(${scale})`;

  // 只在互動期間提示瀏覽器建立合成層；停止縮放後移除，讓文字重新光柵化。
  if (interacting) {
    stage.classList.add('is-transforming');
    clearTimeout(_transformSettleTimer);
    _transformSettleTimer = setTimeout(() => {
      stage.classList.remove('is-transforming');
      // 強制重新計算目前 transform，讓 Chromium/Edge 重新以目前倍率繪製文字。
      void stage.offsetWidth;
      const dpr2 = Math.max(1, window.devicePixelRatio || 1);
      const x2 = Math.round(panX * dpr2) / dpr2;
      const y2 = Math.round(panY * dpr2) / dpr2;
      stage.style.transform = `translate(${x2}px, ${y2}px) scale(${scale})`;
    }, 140);
  }
  const zoomValue = $('zoomValue');
  if (zoomValue) zoomValue.textContent = `${Math.round(scale * 100)}%`;
}
function zoomAt(clientX, clientY, factor) {
  const rect = viewport.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const rawScale = Math.min(
    Math.max(scale * factor, SCALE_MIN),
    SCALE_MAX
  );
  const ns = Math.round(rawScale * 40) / 40;

  if (ns === scale) return;

  const wx = (mx - panX) / scale;
  const wy = (my - panY) / scale;

  canvasViewState = 'manual';
  scale = ns;
  panX = mx - wx * scale;
  panY = my - wy * scale;

  applyTransform({ interacting:true });
}

function getVisibleTreeContentBounds() {
  return genealogyScene?.getContentBounds?.() || null;
}

function fitScreen({ rememberState = true } = {}) {
  const vw =
    viewport.clientWidth;

  const vh =
    viewport.clientHeight;

  if (rememberState) {
    canvasViewState = 'fit';
  }

  const bounds =
    getVisibleTreeContentBounds();

  // 沒有人物時才退回 stage 外框。
  if (!bounds) {
    const w =
      parseFloat(stage.style.width) || 1;

    const h =
      parseFloat(stage.style.height) || 1;

    scale = Math.min(
      (vw - 40) / w,
      (vh - 40) / h,
      1.4
    );

    scale = Math.max(scale, SCALE_MIN);
    panX = (vw - w * scale) / 2;
    panY = (vh - h * scale) / 2;
    applyTransform();
    return;
  }

  const fitPadding = 56;

  scale = Math.min(
    (vw - fitPadding) / bounds.width,
    (vh - fitPadding) / bounds.height,
    1.4
  );

  scale = Math.max(scale, SCALE_MIN);

  // 直接把「實際人物內容中心」放到 viewport 中央。
  // stage 的 400×300 最小尺寸與 PAD 不再影響視覺置中。
  panX =
    vw / 2 -
    bounds.centerX * scale;

  panY =
    vh / 2 -
    bounds.centerY * scale;

  applyTransform();
}

function preserveWorldCenterAfterViewportResize(previousSize, nextSize) {
  if (!getSceneLayout()) return;

  if (canvasViewState === 'fit') {
    fitScreen({ rememberState:false });
    return;
  }

  if (!previousSize.width || !previousSize.height) return;

  const worldCenterX =
    (previousSize.width / 2 - panX) /
    scale;

  const worldCenterY =
    (previousSize.height / 2 - panY) /
    scale;

  panX =
    nextSize.width / 2 -
    worldCenterX * scale;

  panY =
    nextSize.height / 2 -
    worldCenterY * scale;

  applyTransform();
}

function setupViewportResizeObserver() {
  if (!viewport || viewportResizeObserver) return;

  lastViewportSize = {
    width:viewport.clientWidth,
    height:viewport.clientHeight
  };

  const handleResize = (width, height) => {
    const nextSize = {
      width:Math.max(1, Math.round(width)),
      height:Math.max(1, Math.round(height))
    };

    const previousSize = lastViewportSize;

    if (
      nextSize.width === previousSize.width &&
      nextSize.height === previousSize.height
    ) {
      return;
    }

    lastViewportSize = nextSize;

    if (viewportResizeRaf) {
      cancelAnimationFrame(viewportResizeRaf);
    }

    viewportResizeRaf = requestAnimationFrame(() => {
      viewportResizeRaf = null;

      preserveWorldCenterAfterViewportResize(
        previousSize,
        nextSize
      );
    });
  };

  if ('ResizeObserver' in window) {
    viewportResizeObserver =
      new ResizeObserver(entries => {
        const entry = entries.find(
          item => item.target === viewport
        );

        if (!entry) return;

        handleResize(
          entry.contentRect.width,
          entry.contentRect.height
        );
      });

    viewportResizeObserver.observe(viewport);
    return;
  }

  const fallback = () => {
    handleResize(
      viewport.clientWidth,
      viewport.clientHeight
    );
  };

  viewportResizeObserver = {
    disconnect:() =>
      window.removeEventListener(
        'resize',
        fallback
      )
  };

  window.addEventListener(
    'resize',
    fallback
  );
}

function focusSimOnCanvas(simId) {
  if (!simId || !genealogyData?.sims?.[simId]) return;
  if (!getSceneLayout() || !getSceneLayout().pos?.has(simId)) render();
  const pos = getSceneLayout()?.pos?.get(simId);
  if (!pos) return;
  const { W, H } = getNodeDimensions(genealogyData.sims[simId]);
  // 尋找人物屬於使用者主動移動畫布，viewport 改變後保留目前世界中心。
  canvasViewState = 'manual';

  // 尋找人物時不強制改成固定倍率；只有畫面縮得太小時才稍微放大，避免失去上下文。
  if (scale < .72) scale = .72;
  const centerX = pos.x + PAD + W / 2;
  const centerY = pos.y + PAD + H / 2;
  panX = viewport.clientWidth / 2 - centerX * scale;
  panY = viewport.clientHeight / 2 - centerY * scale;
  applyTransform();
  const node = [...nodes.querySelectorAll('.person-card[data-id]')].find(el => el.dataset.id === simId);
  if (node) {
    node.classList.remove('focus-pulse');
    void node.offsetWidth;
    node.classList.add('focus-pulse');
    setTimeout(() => node.classList.remove('focus-pulse'), 1100);
  }
}

// ========【App Render Orchestration】 設定 - Canvas dirty 交給 Scene；Chrome / Lists 留在 App ========
const APP_RENDER_DIRTY = Object.freeze({ chrome:1, lists:2 });
let appRenderDirtyMask = 0;
let appRenderInvalidationRaf = 0;
function flushAppRenderInvalidation() {
  if (appRenderInvalidationRaf) { cancelAnimationFrame(appRenderInvalidationRaf); appRenderInvalidationRaf = 0; }
  const mask = appRenderDirtyMask;
  appRenderDirtyMask = 0;
  if (!mask) return;
  if (mask & APP_RENDER_DIRTY.chrome) { syncRelationshipPerspectiveUI(); updateLayoutToggle(); }
  if (mask & APP_RENDER_DIRTY.lists) {
    if (personLibraryDialog.classList.contains('show')) renderPersonLibrary();
    if (familyMemberPickerDialog.classList.contains('show')) renderFamilyMemberPickerList();
  }
}
function invalidateRender(layers, { immediate = false } = {}) {
  genealogyScene?.invalidate?.({ layout:!!layers?.layout, nodes:!!layers?.nodes, edges:!!layers?.edges }, { immediate });
  if (layers?.chrome) appRenderDirtyMask |= APP_RENDER_DIRTY.chrome;
  if (layers?.lists) appRenderDirtyMask |= APP_RENDER_DIRTY.lists;
  if (!appRenderDirtyMask) return;
  if (immediate) { flushAppRenderInvalidation(); return; }
  if (appRenderInvalidationRaf) return;
  appRenderInvalidationRaf = requestAnimationFrame(() => { appRenderInvalidationRaf = 0; flushAppRenderInvalidation(); });
}
function scheduleEdgeRedraw() { genealogyScene?.scheduleEdgeRedraw?.(); }
function drawEdges() { genealogyScene?.invalidate?.({ edges:true }, { immediate:true }); }
function render() {
  invalidateRender({ layout:true, nodes:true, edges:true, chrome:true, lists:true }, { immediate:true });
}

function avatarHTML(sim) {
  return (
    buildPersonPresentation(sim)
      ?.avatarHtml ||
    '?'
  );
}

function statusBadgeHTML(sim) {
  const status =
    buildPersonPresentation(sim)
      ?.status;

  if (!status) return '';

  return `<div class="person-card-status-badge ${esc(status.className)}" title="${esc(status.text)}">${iconSvg(status.icon)}</div>`;
}

function statusIconHTML(sim) {
  const status =
    buildPersonPresentation(sim)
      ?.status;

  if (!status) return '';

  return `<span class="person-meta-icon status-icon status-${esc(status.className)}" title="${esc(status.text)}">${iconSvg(status.icon)}</span>`;
}

function raceBadgeHTML(sim) {
  const race =
    buildPersonPresentation(sim)
      ?.race;

  if (!race?.icon) return '';

  return `<div class="person-card-race-badge race-icon" title="${esc(race.text)}">${iconSvg(race.icon)}</div>`;
}

function raceIconHTML(sim) {
  const race =
    buildPersonPresentation(sim)
      ?.race;

  if (!race?.icon) return '';

  return `<span class="person-meta-icon race-icon" title="${esc(race.text)}">${iconSvg(race.icon)}</span>`;
}

function buildTagsHTML(traits, owner = null) {
  const list =
    (traits || [])
      .filter(Boolean)
      .map(value =>
        personDisplayText(
          value,
          owner
        )
      );

  if (!list.length) return '';

  const shown =
    list.slice(0, MAX_TAGS);

  const rest =
    list.length -
    shown.length;

  let html =
    shown
      .map(text =>
        `<span class="tag" title="${esc(text)}">${esc(text)}</span>`
      )
      .join('');

  if (rest > 0) {
    html +=
      `<span class="tag tag-more" title="${esc(list.slice(MAX_TAGS).join('、'))}">+${rest}</span>`;
  }

  return html;
}

function petIconFor(pet) {
  const species =
    PET_SPECIES[pet.species] ||
    PET_SPECIES.other;

  return iconSvg(
    species.icon,
    'pet-icon'
  );
}

function formatPetSpecies(pet) {
  const species =
    PET_SPECIES[
      String(pet?.species || '')
    ] ||
    PET_SPECIES.other;

  return uiText(
    species.label
  );
}

function isEaCasPetSpecies(species) {
  return [
    'dog',
    'cat',
    'horse'
  ].includes(
    String(species || '')
  );
}

function normalizePetGender(value) {
  const text =
    String(value || '')
      .trim()
      .toLowerCase();

  if (
    ['male','男','公']
      .includes(text)
  ) {
    return 'male';
  }

  if (
    ['female','女','母']
      .includes(text)
  ) {
    return 'female';
  }

  return '';
}

function petGenderLabel(pet) {
  const value =
    normalizePetGender(
      pet?.gender
    );

  if (value === 'male') {
    return uiText('公');
  }

  if (value === 'female') {
    return uiText('母');
  }

  return '';
}

// ========【寵物血統】 設定 - 遊戲匯入血統只讀顯示，不改變既有手動寵物編輯流程 ========
function getPetLineageInfo(pet) {
  const lineage =
    pet &&
    pet.gameData &&
    pet.gameData.lineage &&
    typeof pet.gameData.lineage === 'object'
      ? pet.gameData.lineage
      : null;

  if (!lineage) {
    return {
      parentNames:[],
      childNames:[],
      hasData:false
    };
  }

  const cleanNames = values =>
    Array.isArray(values)
      ? values
          .map(value => String(value || '').trim())
          .filter(Boolean)
      : [];

  return {
    parentNames:cleanNames(lineage.parentNames),
    childNames:cleanNames(lineage.childNames),
    hasData:
      (Array.isArray(lineage.parentIds) && lineage.parentIds.length > 0) ||
      (Array.isArray(lineage.childIds) && lineage.childIds.length > 0) ||
      cleanNames(lineage.parentNames).length > 0 ||
      cleanNames(lineage.childNames).length > 0
  };
}

function petLineageHTML(pet) {
  const lineage =
    getPetLineageInfo(pet);

  if (!lineage.hasData) return '';

  const parts = [];

  if (lineage.parentNames.length) {
    parts.push(
      `<span><strong>${esc(uiText('父母'))}：</strong>${lineage.parentNames.map(esc).join(' / ')}</span>`
    );
  }

  if (lineage.childNames.length) {
    parts.push(
      `<span><strong>${esc(uiText('子女'))}：</strong>${lineage.childNames.map(esc).join(' / ')}</span>`
    );
  }

  if (!parts.length) {
    parts.push(
      `<span class="muted">${esc(uiText('血統資料已保留，但目前沒有可顯示的姓名'))}</span>`
    );
  }

  return `<div class="pet-lineage">${parts.join('')}</div>`;
}

function renderPetLifeStatusIcon(pet) {
  const status =
    String(pet?.status || '');

  if (status === '幽靈') {
    return iconSvg('ghost-symbol');
  }

  if (status === '已故') {
    return iconSvg('tombstone');
  }

  return '';
}

function buildPetsChipsHTML(pets, owner = null) {
  if (!pets?.length) return '';

  const chips =
    pets
      .slice(0, 3)
      .map(pet => {
        const icon =
          petIconFor(pet);

        const status =
          renderPetLifeStatusIcon(
            pet
          );

        const petName =
          personDisplayText(
            pet.name,
            owner
          );

        const breed =
          personDisplayText(
            pet.breed,
            owner
          );

        return `<span class="person-card-pet-chip" title="${esc(petName)} · ${esc(formatPetSpecies(pet))}${breed ? ' · ' + esc(breed) : ''}"><span class="pet-icon">${icon}</span>${status || ''}${esc(petName)}</span>`;
      })
      .join('');

  const rest =
    pets.length > 3
      ? `<span class="person-card-pet-chip" title="${esc(uiText(`${pets.length} 只寵物`))}">+${pets.length - 3}</span>`
      : '';

  return chips + rest;
}

function genderClass(sim) {
  const gender =
    buildPersonPresentation(sim)
      ?.gender
      .value;

  return gender === '男'
    ? 'male'
    : gender === '女'
      ? 'female'
      : 'other';
}

function statusClass(sim) {
  const status =
    buildPersonPresentation(sim)
      ?.status
      .value;

  return status === '幽靈'
    ? 'ghost'
    : status === '已故'
      ? 'dead'
      : '';
}

// ========【個人資料關係】 設定 - 個人檔案與族譜視角共用同一套親屬稱謂解析器 ========

// ========【個人資料關係】 設定 - 個人檔案與族譜視角共用同一套親屬稱謂解析器 ========
function profileDirectFamilyIds(simId) {
  return resolveDirectFamilyRelationships(
    simId
  )
    .all
    .map(relation =>
      relation.targetId
    );
}

function profileFamilyRelationshipRows(
  simId
) {
  const groups =
    new Map();

  resolveDirectFamilyRelationships(
    simId
  )
    .all
    .forEach(relation => {
      const target =
        relation.target;

      const label =
        relation.label;

      if (!target || !label) return;

      if (!groups.has(label)) {
        groups.set(label, []);
      }

      groups.get(label)
        .push(
          displayDataText(
            target.name,
            target
          )
        );
    });

  return [...groups.entries()]
    .map(([label, names]) => ({
      label,
      names:[...new Set(names)]
    }));
}

function profileOtherRelationshipRows(
  simId
) {
  const id =
    String(simId || '');

  const groups =
    new Map();

  (genealogyData?.links || [])
    .forEach(link => {
      if (
        isSiblingLink(link) ||
        (
          String(link.from) !== id &&
          String(link.to) !== id
        )
      ) {
        return;
      }

      const otherId =
        String(link.from) === id
          ? String(link.to)
          : String(link.from);

      const other =
        genealogyData.sims[
          otherId
        ];

      if (!other) return;

      const type =
        normalizeRelationshipTypeText(
          link.label ||
          link.type ||
          '關聯'
        ) ||
        '關聯';

      if (!groups.has(type)) {
        groups.set(type, []);
      }

      groups.get(type)
        .push(
          displayDataText(
            other.name,
            other
          )
        );
    });

  return [...groups.entries()]
    .map(([type, names]) => ({
      type,
      label:
        displayRelationshipText(
          type
        ),
      names:[...new Set(names)]
    }));
}

function buildPersonProfilePresentation(person, options = {}) {
  if (!person) return null;

  const draft =
    options.draft === true;

  const presentation =
    buildPersonPresentation(
      person,
      { draft }
    );

  const householdId =
    person.gameData &&
    person.gameData.householdId != null
      ? String(
          person.gameData.householdId
        )
      : '';

  const importedHouseholdFamily =
    householdId
      ? genealogyData.families.find(
          family =>
            String(
              family.gameData?.householdId ??
              ''
            ) === householdId
        )
      : null;

  const householdNameRaw =
    (
      person.gameData &&
      person.gameData.householdName
    ) ||
    importedHouseholdFamily?.name ||
    '';

  const householdName =
    householdNameRaw
      ? personDisplayText(
          householdNameRaw,
          importedHouseholdFamily ||
          person,
          draft
        )
      : '';

  const familyNames =
    Array.isArray(
      options.familyNames
    )
      ? options.familyNames
      : genealogyData.families
          .filter(family =>
            !family.gameImport
          )
          .filter(family =>
            (
              family.memberIds ||
              []
            ).includes(person.id)
          )
          .map(family =>
            displayDataText(
              family.name,
              family
            )
          );

  const familyRelationshipRows =
    Array.isArray(
      options.familyRelationshipRows
    )
      ? options.familyRelationshipRows
      : profileFamilyRelationshipRows(
          person.id
        );

  const otherRelationshipRows =
    Array.isArray(
      options.otherRelationshipRows
    )
      ? options.otherRelationshipRows
      : profileOtherRelationshipRows(
          person.id
        );

  const generationLabel =
    options.generationLabel !==
      undefined
      ? options.generationLabel
      : getSimGenerationLabel(
          person.id,
          currentFamily()
        );

  return {
    person,
    draft,
    presentation,
    householdName,
    familyNames,
    familyRelationshipRows,
    otherRelationshipRows,
    generationLabel,
    onGallery:
      typeof options.onGallery ===
      'function'
        ? options.onGallery
        : null
  };
}

function renderPersonProfileRow(
  label,
  valueHtml,
  { muted = false } = {}
) {
  return `
    <div class="person-profile-row">
      <div class="person-profile-label">${esc(uiText(label))}</div>
      <div class="person-profile-value${muted ? ' muted' : ''}">${valueHtml}</div>
    </div>
  `;
}

function renderPersonProfileSection(
  title,
  content
) {
  return `
    <section class="person-profile-section">
      <h3 class="person-profile-section-title">${esc(uiText(title))}</h3>
      ${content}
    </section>
  `;
}

function renderPersonProfilePet(
  pet,
  model
) {
  const avatar =
    framedAvatarImageHTML(
      pet.avatar,
      pet.avatarFrame
    ) ||
    petIconFor(pet);

  const meta = [
    formatPetSpecies(pet),
    pet.breed
      ? personDisplayText(
          pet.breed,
          model.person,
          model.draft
        )
      : '',
    petGenderLabel(pet)
  ]
    .filter(Boolean)
    .join(' · ');

  const name =
    personDisplayText(
      pet.name,
      model.person,
      model.draft
    ) ||
    uiText('（未命名）');

  return `
    <div class="person-profile-pet">
      <div class="person-profile-pet-avatar">${avatar}</div>
      <div class="person-profile-pet-text">
        <div class="person-profile-pet-name">${esc(name)}</div>
        <div class="person-profile-pet-meta">${esc(meta)}</div>
        ${petLineageHTML(pet)}
      </div>
    </div>
  `;
}

function renderPersonProfileLifePhotoItem(
  photo,
  index
) {
  const url =
    resolveImageUrl(
      photo.image
    );

  const assetId =
    isAssetId(photo.image)
      ? String(photo.image)
      : '';

  return `
    <div
      class="life-photo-item"
      data-person-profile-life-photo-index="${index}"
      title="${esc(photo.title || '')}"
    >
      ${
        assetId
          ? `<img data-asset-id="${esc(assetId)}"${url ? ` src="${esc(url)}"` : ''} alt="" loading="lazy" decoding="async">`
          : ''
      }
    </div>
  `;
}

function renderPersonProfileContent(
  container,
  person,
  options = {}
) {
  if (
    !container ||
    !person
  ) {
    return;
  }

  const model =
    buildPersonProfilePresentation(
      person,
      options
    );

  if (!model) return;

  const {
    presentation
  } = model;

  const avatarClass = [
    'person-profile-avatar',
    presentation.status.value ===
      '幽靈'
      ? 'ghost'
      : '',
    presentation.status.value ===
      '已故'
      ? 'dead'
      : ''
  ]
    .filter(Boolean)
    .join(' ');

  const metaItems = [
    `<span class="stage-tag stage-${esc(presentation.lifeStage.value)}">${esc(presentation.lifeStage.text)}</span>`,
    `<span class="meta-pill">${iconSvg(presentation.gender.icon)}<span>${esc(presentation.gender.text)}</span></span>`,
    `<span class="meta-pill">${statusIconHTML(person)}<span>${esc(presentation.status.text)}</span></span>`
  ];

  if (presentation.race) {
    metaItems.push(
      `<span class="meta-pill">${presentation.race.icon ? iconSvg(presentation.race.icon) : ''}<span>${esc(presentation.race.text)}</span></span>`
    );
  }

  const headFacts = [
    `<div class="person-profile-head-fact">${iconSvg('cake2')}<span>${esc(presentation.birthdayText)} · ${esc(presentation.ageText)}</span></div>`,
    `<div class="person-profile-head-fact">${iconSvg('house')}<span>${esc(presentation.residence || uiText('居住地未知'))}</span></div>`
  ];

  const basicRows = [
    renderPersonProfileRow(
      '職業',
      esc(
        presentation.career ||
        '—'
      )
    ),
    renderPersonProfileRow(
      '人生抱負',
      esc(
        presentation.aspiration ||
        '—'
      )
    ),
    renderPersonProfileRow(
      '家庭',
      esc(
        model.householdName ||
        '—'
      )
    )
  ];

  if (
    (
      presentation.status.value ===
        '已故' ||
      presentation.status.value ===
        '幽靈'
    ) &&
    presentation.causeOfDeath
  ) {
    basicRows.push(
      renderPersonProfileRow(
        '死因',
        esc(
          presentation.causeOfDeath
        )
      )
    );
  }

  const traitsHtml =
    presentation.traits.length
      ? `<div class="person-profile-traits">${presentation.traits.map(trait => `<span class="tag">${esc(trait)}</span>`).join('')}</div>`
      : '<div class="person-profile-value muted">—</div>';

  basicRows.push(
    renderPersonProfileRow(
      '特徵',
      traitsHtml
    )
  );

  const sections = [
    renderPersonProfileSection(
      '基本資料',
      `<div class="person-profile-list">${basicRows.join('')}</div>`
    )
  ];

  const familyRows = [
    renderPersonProfileRow(
      '所屬家族',
      model.familyNames.length
        ? model.familyNames
            .map(esc)
            .join(' / ')
        : '—'
    )
  ];

  if (model.generationLabel) {
    familyRows.push(
      renderPersonProfileRow(
        '世代',
        esc(
          model.generationLabel
        )
      )
    );
  }

  model.familyRelationshipRows
    .forEach(item => {
      familyRows.push(
        renderPersonProfileRow(
          item.label,
          item.names
            .map(esc)
            .join(' / ')
        )
      );
    });

  sections.push(
    renderPersonProfileSection(
      '家庭關係',
      `<div class="person-profile-list">${familyRows.join('')}</div>`
    )
  );

  if (
    model.otherRelationshipRows
      .length
  ) {
    const otherRows =
      model.otherRelationshipRows
        .map(item =>
          renderPersonProfileRow(
            item.label,
            item.names
              .map(esc)
              .join(' / ')
          )
        )
        .join('');

    sections.push(
      renderPersonProfileSection(
        '其他關係',
        `<div class="person-profile-list">${otherRows}</div>`
      )
    );
  }

  sections.push(
    renderPersonProfileSection(
      '簡介',
      `<div class="person-profile-bio">${person.bio ? esc(presentation.bio) : '—'}</div>`
    )
  );

  const petItems =
    (person.pets || [])
      .map(pet =>
        renderPersonProfilePet(
          pet,
          model
        )
      )
      .join('') ||
    '<div class="person-profile-value muted">—</div>';

  const galleryItems =
    (person.gallery || [])
      .slice(0, 8)
      .map((photo, index) =>
        renderPersonProfileLifePhotoItem(
          photo,
          index
        )
      )
      .join('') ||
    '<div class="person-profile-value muted">—</div>';

  sections.push(
    `
      <section class="person-profile-section">
        <div class="person-profile-media">
          <div class="person-profile-media-column">
            <div class="person-profile-media-head">
              <span>${esc(uiText('寵物'))}</span>
              <span class="person-profile-media-count">${(person.pets || []).length}</span>
            </div>
            <div class="person-profile-pets">${petItems}</div>
          </div>
          <div class="person-profile-media-column">
            <div class="person-profile-media-head">
              <span>${esc(uiText('人生照片'))}</span>
              <span class="person-profile-media-count">${(person.gallery || []).length}</span>
            </div>
            <div class="person-profile-gallery">${galleryItems}</div>
          </div>
        </div>
      </section>
    `
  );

  container.innerHTML = `
    <div class="person-profile-header">
      <div class="${avatarClass}">${presentation.avatarHtml}</div>
      <div class="person-profile-header-text">
        <div class="person-profile-name-row">
          <span class="person-profile-name">${esc(presentation.name || '—')}</span>
        </div>
        <div class="person-profile-meta">${metaItems.join('')}</div>
        <div class="person-profile-head-facts">${headFacts.join('')}</div>
      </div>
    </div>
    <div class="person-profile-body">${sections.join('')}</div>
  `;

  container
    .querySelectorAll(
      '[data-person-profile-life-photo-index]'
    )
    .forEach(element => {
      element.onclick = () => {
        const index =
          Number(
            element.dataset.personProfileLifePhotoIndex
          );

        if (model.onGallery) {
          model.onGallery(index);
        } else if (
          person.id &&
          genealogyData?.sims?.[
            person.id
          ]
        ) {
          lifePhotoWorkspace
            .openSavedViewer(
              person.id,
              index
            );
        }
      };
    });
}

function openPersonProfile(id) {
  const person =
    genealogyData.sims[id];

  if (!person) return;

  personProfilePersonId = id;

  renderPersonProfileContent(
    $('personProfileContent'),
    person
  );

  personProfileDialog.classList.add(
    'show'
  );
}

function closePersonProfile() {
  personProfileDialog.classList.remove(
    'show'
  );
  personProfilePersonId = null;
}

$('personProfileCloseBtn').onclick =
  closePersonProfile;

personProfileDialog.onclick = event => {
  if (event.target === personProfileDialog) {
    closePersonProfile();
  }
};

$('personProfileEditBtn').onclick = () => {
  const id = personProfilePersonId;
  closePersonProfile();

  if (id) {
    openEditor(id);
  }
};

const lifePhotoWorkspace = {
  currentEditorEntry() {
    const index = lifePhotoState.editor.index;
    return index >= 0 && editingGallery[index]
      ? editingGallery[index]
      : null;
  },

  resetEditorState() {
    lifePhotoState.editor.index = -1;
    lifePhotoState.editor.imageRef = '';
    lifePhotoState.editor.sizeKB = 0;
    lifePhotoState.editor.isOriginal = false;
  },

  fillEditorFields(entry = null) {
    $('phTitle').value = entry?.title || '';
    $('phNote').value = entry?.note || '';
    $('phStage').value = entry?.lifeStage || '';
  },

  refreshPreview() {
    const preview = $('photoPreview');
    const imageRef = lifePhotoState.editor.imageRef;
    const assetId = isAssetId(imageRef)
      ? String(imageRef)
      : '';
    const url = resolveImageUrl(imageRef);

    if (assetId) preview.dataset.assetBgId = assetId;
    else delete preview.dataset.assetBgId;

    preview.classList.toggle('has-image', !!url);
    preview.style.backgroundImage =
      url ? `url("${url}")` : '';
    preview.textContent =
      url ? '' : '點選選擇 · 或拖曳 · 或 Ctrl+V 貼上';

    const tip = $('photoSizeTip');
    if (!url) {
      tip.textContent = '';
      tip.classList.remove('warn');
      return;
    }

    const sizeKB = Math.max(
      0,
      Number(lifePhotoState.editor.sizeKB) || 0
    );
    const sizeText = sizeKB >= 1024
      ? `約 ${(sizeKB / 1024).toFixed(2)} MB`
      : `約 ${Math.round(sizeKB)} KB`;

    tip.textContent =
      `${lifePhotoState.editor.isOriginal ? '原始圖片' : '壓縮'} · ${sizeText}`;
    tip.classList.toggle(
      'warn',
      lifePhotoState.editor.isOriginal &&
      sizeKB > ORIGINAL_WARN_KB
    );
  },

  openEditor(index = -1, { keepPreparedImage = false } = {}) {
    const validIndex =
      Number.isInteger(index) &&
      index >= 0 &&
      !!editingGallery[index];

    lifePhotoState.editor.index =
      validIndex ? index : -1;

    const entry =
      validIndex ? editingGallery[index] : null;

    if (!keepPreparedImage) {
      lifePhotoState.editor.imageRef =
        entry?.image || '';

      const url =
        resolveImageUrl(lifePhotoState.editor.imageRef);

      lifePhotoState.editor.sizeKB =
        url
          ? Math.round(url.length * 0.75 / 1024)
          : 0;

      lifePhotoState.editor.isOriginal = false;
    }

    this.fillEditorFields(entry);
    $('photoModalTitle').textContent =
      entry ? '編輯圖片' : '新增圖片';
    $('phDelete').style.display =
      entry ? '' : 'none';

    this.refreshPreview();
    lifePhotoEditorDialog.classList.add('show');
    setTimeout(() => $('phTitle').focus(), 60);
  },

  closeEditor() {
    lifePhotoEditorDialog.classList.remove('show');
    this.resetEditorState();
  },

  commitEditor() {
    if (!lifePhotoState.editor.imageRef) {
      uiAlert(
        '請先選擇一張圖片',
        { title:'尚未選擇圖片' }
      );
      return;
    }

    const previous = this.currentEditorEntry();
    const entry = {
      id:previous?.id || uid('photo'),
      title:$('phTitle').value.trim(),
      note:$('phNote').value.trim(),
      lifeStage:$('phStage').value,
      image:lifePhotoState.editor.imageRef,
      addedAt:previous?.addedAt || Date.now()
    };

    if (previous) {
      editingGallery[lifePhotoState.editor.index] = entry;
    } else {
      editingGallery.push(entry);
    }

    this.renderList();
    this.closeEditor();
  },

  async deleteEditorEntry() {
    const entry = this.currentEditorEntry();
    if (!entry) return;

    const confirmed = await uiConfirm(
      `確定刪除圖片「${entry.title || '未命名'}」嗎？`,
      {
        title:'刪除圖片',
        kind:'danger',
        confirmText:'刪除'
      }
    );
    if (!confirmed) return;

    editingGallery.splice(
      lifePhotoState.editor.index,
      1
    );
    this.renderList();
    this.closeEditor();
  },

  async prepareFile(file, { openEditor = false } = {}) {
    const result = await compressGalleryImage(file);

    if (
      result.isOriginal &&
      result.sizeKB > ORIGINAL_WARN_KB
    ) {
      const confirmed = await uiConfirm(
        `原始圖片大小約 ${(result.sizeKB / 1024).toFixed(2)} MB。\n\n原始圖片會較快佔用瀏覽器儲存空間。\n\n是否仍要儲存原始圖片？`,
        {
          title:'原始圖片容量提醒',
          confirmText:'仍要儲存'
        }
      );
      if (!confirmed) return false;
    }

    lifePhotoState.editor.imageRef =
      await saveImageAsset(
        result.blob,
        {
          width:result.width,
          height:result.height
        }
      );
    lifePhotoState.editor.sizeKB = result.sizeKB;
    lifePhotoState.editor.isOriginal = result.isOriginal;

    if (openEditor) {
      this.openEditor(
        -1,
        { keepPreparedImage:true }
      );
    } else {
      this.refreshPreview();
    }
    return true;
  },

  clearPreparedImage() {
    lifePhotoState.editor.imageRef = '';
    lifePhotoState.editor.sizeKB = 0;
    lifePhotoState.editor.isOriginal = false;
    this.refreshPreview();
  },

  renderList() {
    if (!lifePhotoGrid) return;

    if (!editingGallery.length) {
      lifePhotoGrid.innerHTML =
        '<div class="life-photo-empty" style="grid-column:1/-1;">尚未新增人生照片</div>';
      return;
    }

    lifePhotoGrid.innerHTML =
      editingGallery
        .map((entry, index) => {
          const stage = entry.lifeStage
            ? `<span class="life-photo-stage stage-${esc(entry.lifeStage)}">${esc(entry.lifeStage)}</span>`
            : '';
          const title = entry.title
            ? `<div class="life-photo-title">${esc(entry.title)}</div>`
            : '';
          const assetId = isAssetId(entry.image)
            ? String(entry.image)
            : '';
          const url = resolveImageUrl(entry.image);

          return `
            <div class="life-photo-item" data-life-photo-index="${index}">
              ${assetId ? `<img data-asset-id="${esc(assetId)}"${url ? ` src="${esc(url)}"` : ''} alt="" draggable="false" loading="lazy" decoding="async">` : ''}
              ${stage}
              <div class="life-photo-item-overlay">
                <button type="button" class="life-photo-action" data-life-photo-action="edit" data-life-photo-index="${index}" title="編輯">${iconSvg('pencil-square')}</button>
                <button type="button" class="life-photo-action danger" data-life-photo-action="delete" data-life-photo-index="${index}" title="刪除">${iconSvg('trash3')}</button>
              </div>
              ${title}
            </div>
          `;
        })
        .join('');

    lifePhotoGrid
      .querySelectorAll('.life-photo-item[data-life-photo-index]')
      .forEach(card => {
        card.addEventListener('click', event => {
          if (event.target.closest('[data-life-photo-action]')) return;
          this.openDraftViewer(
            Number(card.dataset.lifePhotoIndex)
          );
        });
      });

    lifePhotoGrid
      .querySelectorAll('[data-life-photo-action="edit"]')
      .forEach(button => {
        button.addEventListener('click', event => {
          event.stopPropagation();
          this.openEditor(
            Number(button.dataset.lifePhotoIndex)
          );
        });
      });

    lifePhotoGrid
      .querySelectorAll('[data-life-photo-action="delete"]')
      .forEach(button => {
        button.addEventListener('click', async event => {
          event.stopPropagation();
          const index =
            Number(button.dataset.lifePhotoIndex);
          const entry = editingGallery[index];
          if (!entry) return;

          const confirmed = await uiConfirm(
            `確定刪除圖片「${entry.title || '未命名'}」嗎？`,
            {
              title:'刪除圖片',
              kind:'danger',
              confirmText:'刪除'
            }
          );
          if (!confirmed) return;

          editingGallery.splice(index, 1);
          this.renderList();
        });
      });
  },

  viewerGallery() {
    if (
      lifePhotoState.viewer.mode === 'saved' &&
      lifePhotoState.viewer.simId
    ) {
      return (
        genealogyData.sims[
          lifePhotoState.viewer.simId
        ]?.gallery || []
      );
    }
    return editingGallery;
  },

  openDraftViewer(index) {
    if (!editingGallery[index]) return;

    lifePhotoState.viewer.mode = 'draft';
    lifePhotoState.viewer.simId = null;
    lifePhotoState.viewer.index = index;

    $('photoViewerPersonName').textContent =
      $('fName')?.value?.trim() ||
      uiText('人物');

    this.refreshViewer();
    lifePhotoViewerDialog.classList.add('show');
  },

  openSavedViewer(simId, index) {
    const sim = genealogyData.sims[simId];
    if (!sim) return;

    lifePhotoState.viewer.mode = 'saved';
    lifePhotoState.viewer.simId = simId;
    lifePhotoState.viewer.index = index;

    $('photoViewerPersonName').textContent =
      displayDataText(sim.name, sim) ||
      uiText('人物');

    this.refreshViewer();
    lifePhotoViewerDialog.classList.add('show');
  },

  refreshViewer() {
    const gallery = this.viewerGallery();
    if (!gallery.length) return;

    lifePhotoState.viewer.index =
      Math.max(
        0,
        Math.min(
          gallery.length - 1,
          lifePhotoState.viewer.index
        )
      );

    const entry =
      gallery[lifePhotoState.viewer.index];
    const image = $('photoViewerImage');
    const assetId = isAssetId(entry.image)
      ? String(entry.image)
      : '';
    const url = resolveImageUrl(entry.image);

    if (assetId) image.dataset.assetId = assetId;
    else delete image.dataset.assetId;

    if (url) image.src = url;
    else image.removeAttribute('src');

    $('photoViewerTitle').textContent =
      entry.title || uiText('（未命名）');

    const details = [];
    if (entry.lifeStage) {
      details.push(uiText(entry.lifeStage));
    }
    if (entry.note) details.push(entry.note);

    $('photoViewerNote').textContent = details.join(' · ');
    $('photoViewerCounter').textContent =
      `${lifePhotoState.viewer.index + 1} / ${gallery.length}`;

    const single = gallery.length <= 1;
    $('photoViewerPrevBtn').disabled = single;
    $('photoViewerNextBtn').disabled = single;
  },

  moveViewer(delta) {
    const gallery = this.viewerGallery();
    if (gallery.length <= 1) return;

    lifePhotoState.viewer.index =
      (
        lifePhotoState.viewer.index +
        delta +
        gallery.length
      ) % gallery.length;

    this.refreshViewer();
  },

  closeViewer() {
    lifePhotoViewerDialog.classList.remove('show');
    lifePhotoState.viewer.mode = 'draft';
    lifePhotoState.viewer.simId = null;
    lifePhotoState.viewer.index = 0;
  }
};

$('btnAddPhoto').onclick = () => {
  lifePhotoWorkspace.openEditor();
};

lifePhotoGrid.addEventListener('dragover', event => {
  event.preventDefault();
  event.stopPropagation();
  lifePhotoGrid.classList.add('dragover');
});
lifePhotoGrid.addEventListener('dragleave', event => {
  event.preventDefault();
  lifePhotoGrid.classList.remove('dragover');
});
lifePhotoGrid.addEventListener('drop', async event => {
  event.preventDefault();
  event.stopPropagation();
  lifePhotoGrid.classList.remove('dragover');

  const files =
    Array.from(event.dataTransfer?.files || [])
      .filter(file => file.type.startsWith('image/'));

  for (const file of files) {
    try {
      await lifePhotoWorkspace.prepareFile(
        file,
        { openEditor:true }
      );
    } catch (error) {
      uiAlert(
        '圖片處理失敗：' + error.message,
        { title:'圖片處理失敗', kind:'danger' }
      );
    }
  }
});

$('phSave').onclick = () => {
  lifePhotoWorkspace.commitEditor();
};
$('phCancel').onclick = () => {
  lifePhotoWorkspace.closeEditor();
};
$('phDelete').onclick = () => {
  lifePhotoWorkspace.deleteEditorEntry();
};
lifePhotoEditorDialog.onclick = event => {
  if (event.target === lifePhotoEditorDialog) {
    lifePhotoWorkspace.closeEditor();
  }
};

$('photoPreview').onclick = () => {
  $('photoInput').click();
};
$('photoInput').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await lifePhotoWorkspace.prepareFile(file);
  } catch (error) {
    uiAlert(
      '圖片處理失敗：' + error.message,
      { title:'圖片處理失敗', kind:'danger' }
    );
  } finally {
    event.target.value = '';
  }
};
$('photoClearBtn').onclick = () => {
  lifePhotoWorkspace.clearPreparedImage();
};

document.addEventListener('paste', async event => {
  if (!lifePhotoEditorDialog.classList.contains('show')) return;

  const imageItem =
    Array.from(event.clipboardData?.items || [])
      .find(item => item.type.startsWith('image/'));

  if (!imageItem) return;

  const file = imageItem.getAsFile();
  if (!file) return;

  event.preventDefault();

  try {
    await lifePhotoWorkspace.prepareFile(file);
  } catch (error) {
    uiAlert(
      '圖片處理失敗：' + error.message,
      { title:'圖片處理失敗', kind:'danger' }
    );
  }
});

$('photoViewerCloseBtn').onclick = () => {
  lifePhotoWorkspace.closeViewer();
};
$('photoViewerPrevBtn').onclick = () => {
  lifePhotoWorkspace.moveViewer(-1);
};
$('photoViewerNextBtn').onclick = () => {
  lifePhotoWorkspace.moveViewer(1);
};
lifePhotoViewerDialog.onclick = event => {
  if (event.target === lifePhotoViewerDialog) {
    lifePhotoWorkspace.closeViewer();
  }
};

/* =========================================================
 *  自由排列選取 / 框選 + 平移 / 縮放
 * ========================================================= */
function syncNodeSelectionClasses() {
  const visible = new Set();
  nodes.querySelectorAll('.person-card[data-id]').forEach(el => {
    visible.add(el.dataset.id);
    el.classList.toggle('person-card-selected', selectedNodeIds.has(el.dataset.id));
  });
  [...selectedNodeIds].forEach(id => { if (!visible.has(id)) selectedNodeIds.delete(id); });
}

function clearNodeSelection() {
  if (!selectedNodeIds.size) return;
  selectedNodeIds.clear();
  syncNodeSelectionClasses();
}

function selectVisibleNodes() {
  if (!getSceneLayout() || !getCurrentFreeLayout(currentFamily()) || arrangeTool !== 'select') return;
  selectedNodeIds.clear();
  getSceneLayout().visibleIds.forEach(id => selectedNodeIds.add(id));
  syncNodeSelectionClasses();
}

function closePersonCardMenu() {
  if (!personCardMenu) return;
  personCardMenu.classList.remove('show');
  personCardMenu.setAttribute('aria-hidden', 'true');
  personCardMenu.innerHTML = '';
}

function positionPersonCardMenu(clientX, clientY) {
  if (!personCardMenu) return;
  personCardMenu.style.left = `${clientX}px`;
  personCardMenu.style.top = `${clientY}px`;
  requestAnimationFrame(() => {
    const rect = personCardMenu.getBoundingClientRect();
    const pad = 8;
    const left = Math.max(pad, Math.min(clientX, window.innerWidth - rect.width - pad));
    const top = Math.max(pad, Math.min(clientY, window.innerHeight - rect.height - pad));
    personCardMenu.style.left = `${left}px`;
    personCardMenu.style.top = `${top}px`;
  });
}

function getSelectedLayoutNodeIds() {
  return [...selectedNodeIds]
    .filter(id => getSceneLayout()?.pos?.has(id));
}

function getLayoutNodeBox(id, position = null) {
  const pos =
    position ||
    getSceneLayout()?.pos?.get(id);

  if (!pos) return null;

  const dims = getNodeDimensionsById(id);

  return {
    id,
    x:pos.x,
    y:pos.y,
    width:dims.W,
    height:dims.H,
    right:pos.x + dims.W,
    bottom:pos.y + dims.H,
    centerX:pos.x + dims.W / 2,
    centerY:pos.y + dims.H / 2
  };
}

function applySelectedLayoutOperation(action) {
  const fam = currentFamily();
  if (!fam || !getSceneLayout()) return false;

  ensureFamilyLayoutShape(fam);

  const ids = getSelectedLayoutNodeIds();
  if (ids.length < 2) return false;

  const boxes =
    ids
      .map(id => getLayoutNodeBox(id))
      .filter(Boolean);

  if (boxes.length < 2) return false;

  if (
    (action === 'distribute-horizontal' ||
      action === 'distribute-vertical') &&
    boxes.length < 3
  ) {
    return false;
  }

  const before =
    captureLayoutHistoryState(
      fam,
      viewMode
    );

  const minLeft =
    Math.min(...boxes.map(box => box.x));
  const maxRight =
    Math.max(...boxes.map(box => box.right));
  const minTop =
    Math.min(...boxes.map(box => box.y));
  const maxBottom =
    Math.max(...boxes.map(box => box.bottom));
  const centerX =
    (minLeft + maxRight) / 2;
  const centerY =
    (minTop + maxBottom) / 2;

  const next =
    new Map(
      boxes.map(box => [
        box.id,
        { x:box.x, y:box.y }
      ])
    );

  if (action === 'align-left') {
    boxes.forEach(box => {
      next.get(box.id).x = minLeft;
    });
  } else if (action === 'align-center-x') {
    boxes.forEach(box => {
      next.get(box.id).x =
        centerX - box.width / 2;
    });
  } else if (action === 'align-right') {
    boxes.forEach(box => {
      next.get(box.id).x =
        maxRight - box.width;
    });
  } else if (action === 'align-top') {
    boxes.forEach(box => {
      next.get(box.id).y = minTop;
    });
  } else if (action === 'align-center-y') {
    boxes.forEach(box => {
      next.get(box.id).y =
        centerY - box.height / 2;
    });
  } else if (action === 'align-bottom') {
    boxes.forEach(box => {
      next.get(box.id).y =
        maxBottom - box.height;
    });
  } else if (action === 'distribute-horizontal') {
    const ordered =
      [...boxes].sort(
        (left, right) =>
          left.x - right.x
      );

    const span =
      ordered[ordered.length - 1].right -
      ordered[0].x;

    const occupied =
      ordered.reduce(
        (sum, box) =>
          sum + box.width,
        0
      );

    const gap =
      (span - occupied) /
      (ordered.length - 1);

    let cursor =
      ordered[0].x;

    ordered.forEach(box => {
      next.get(box.id).x = cursor;
      cursor += box.width + gap;
    });
  } else if (action === 'distribute-vertical') {
    const ordered =
      [...boxes].sort(
        (top, bottom) =>
          top.y - bottom.y
      );

    const span =
      ordered[ordered.length - 1].bottom -
      ordered[0].y;

    const occupied =
      ordered.reduce(
        (sum, box) =>
          sum + box.height,
        0
      );

    const gap =
      (span - occupied) /
      (ordered.length - 1);

    let cursor =
      ordered[0].y;

    ordered.forEach(box => {
      next.get(box.id).y = cursor;
      cursor += box.height + gap;
    });
  } else {
    return false;
  }

  const nextPositions = {};
  let changed = false;

  next.forEach((pos, id) => {
    const current =
      getSceneLayout().pos.get(id);

    if (
      !current ||
      Math.abs(current.x - pos.x) > 0.01 ||
      Math.abs(current.y - pos.y) > 0.01
    ) {
      changed = true;
    }

    nextPositions[id] = {
      x:pos.x,
      y:pos.y
    };
  });

  if (!changed) return false;

  const mutation =
    genealogyStore.setNodePositions(
      fam.id,
      viewMode,
      nextPositions
    );

  applyGenealogyMutation(mutation);
  syncNodeSelectionClasses();
  expandStageToFit();

  dragHistory.push({
    type:'card-layout',
    familyId:fam.id,
    mode:viewMode,
    before,
    after:captureLayoutHistoryState(
      fam,
      viewMode
    )
  });

  return true;
}

function renderPersonCardMenu(simId, clientX, clientY) {
  if (!personCardMenu || !genealogyData?.sims?.[simId]) return;
  const sim = genealogyData.sims[simId];
  const settings = viewMode === 'edit' ? getCardEditSettings() : getCardViewSettings();
  const isEditCard = viewMode === 'edit';
  const isMulti = selectedNodeIds.size > 1 && selectedNodeIds.has(simId);
  const selectedCount = isMulti ? selectedNodeIds.size : 1;
  const title = isMulti ? `${uiText('已選取')} ${selectedCount} ${uiText('人')}` : displayDataText(sim.name, sim);

  if (isMulti) {
    const canDistribute =
      selectedCount >= 3;

    personCardMenu.innerHTML = `
      <div class="person-card-menu-title">${esc(title)}</div>

      <div class="person-card-menu-section-title">${esc(uiText('對齊'))}</div>
      <div class="person-card-menu-grid">
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="align-left"><span>${esc(uiText('靠左'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="align-center-x"><span>${esc(uiText('水平置中'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="align-right"><span>${esc(uiText('靠右'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="align-top"><span>${esc(uiText('頂端'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="align-center-y"><span>${esc(uiText('垂直置中'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="align-bottom"><span>${esc(uiText('底端'))}</span></button>
      </div>

      <div class="person-card-menu-divider"></div>
      <div class="person-card-menu-section-title">${esc(uiText('分佈'))}</div>
      <div class="person-card-menu-grid">
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="distribute-horizontal" ${canDistribute ? '' : 'disabled'}><span>${esc(uiText('水平均勻'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="distribute-vertical" ${canDistribute ? '' : 'disabled'}><span>${esc(uiText('垂直均勻'))}</span></button>
      </div>

      <div class="person-card-menu-divider"></div>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="reset-selected">${iconSvg('arrow-counterclockwise')}<span>${esc(uiText('重設所選位置'))}</span></button>
      <button class="person-card-menu-action danger" type="button" data-person-card-menu-action="remove-selected">${iconSvg('person-dash')}<span>${esc(uiText('移出所選人物'))}</span></button>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="clear-selection">${iconSvg('x-lg')}<span>${esc(uiText('取消選取'))}</span></button>
    `;

    personCardMenu.dataset.simId = simId;
    personCardMenu.dataset.cardMode = viewMode;
    personCardMenu.classList.add('show');
    personCardMenu.setAttribute('aria-hidden', 'false');
    positionPersonCardMenu(clientX, clientY);
    return;
  }

  const fieldRows = [
    ['name','姓名'], ['gender','性別文字'], ['genderBar','性別色條'], ['lifeStage','人生階段'], ['age','年齡'], ['birthday','生日'],
    ['status','狀態'], ['race','種族'], ['career','職業'], ['residence','居住地'], ['aspiration','人生抱負'],
    ['traits','特徵'], ['pets','寵物'], ['gallery','人生照片']
  ].map(([key,label]) => `<label class="person-card-menu-check"><input type="checkbox" data-card-field="${key}" ${settings[key] ? 'checked' : ''}><span>${esc(uiText(label))}</span></label>`).join('');

  const appearanceSection = isEditCard ? '' : `
    <div class="person-card-menu-divider"></div>
    <div class="person-card-menu-section-title">${esc(uiText('檢視卡片外觀'))}</div>
    <label class="person-card-menu-radio"><input type="radio" name="nodeCardAppearance" value="minimal" ${settings.appearance === 'minimal' ? 'checked' : ''}><span>${esc(uiText('極簡'))}</span></label>
    <label class="person-card-menu-radio"><input type="radio" name="nodeCardAppearance" value="translucent" ${settings.appearance === 'translucent' ? 'checked' : ''}><span>${esc(uiText('半透明'))}</span></label>
    <label class="person-card-menu-radio"><input type="radio" name="nodeCardAppearance" value="full" ${settings.appearance === 'full' ? 'checked' : ''}><span>${esc(uiText('完整卡片'))}</span></label>`;

  personCardMenu.innerHTML = `
    <div class="person-card-menu-title">${esc(title)}</div>
    <button class="person-card-menu-action" type="button" data-person-card-menu-action="view">${iconSvg('person-vcard')}<span>${esc(uiText('查看個人檔案'))}</span></button>
    <button class="person-card-menu-action" type="button" data-person-card-menu-action="edit">${iconSvg('pencil-square')}<span>${esc(uiText('編輯模擬市民'))}</span></button>
    <button class="person-card-menu-action" type="button" data-person-card-menu-action="locate">${iconSvg('crosshair')}<span>${esc(uiText('在族譜中定位'))}</span></button>
    <button class="person-card-menu-action" type="button" data-person-card-menu-action="perspective">${iconSvg('person-vcard')}<span>${esc(relationshipPerspectiveActionText(sim, relationshipPerspectiveSimId === String(sim.id)))}</span></button>
    ${isMulti ? `
      <div class="person-card-menu-divider"></div>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="reset-selected">${iconSvg('arrow-counterclockwise')}<span>${esc(uiText('重設所選位置'))}</span></button>
      <button class="person-card-menu-action danger" type="button" data-person-card-menu-action="remove-selected">${iconSvg('person-dash')}<span>${esc(uiText('移出所選人物'))}</span></button>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="clear-selection">${iconSvg('x-lg')}<span>${esc(uiText('取消選取'))}</span></button>
    ` : ''}
    <div class="person-card-menu-divider"></div>
    <div class="person-card-menu-section-title">${esc(uiText(isEditCard ? '編輯模式顯示內容' : '檢視模式顯示內容'))}</div>
    <label class="person-card-menu-check fixed"><input type="checkbox" checked disabled><span>${esc(uiText('頭像'))}</span></label>
    <div class="person-card-menu-grid">${fieldRows}</div>
    ${appearanceSection}
    <div class="person-card-menu-note">${esc(uiText(isEditCard ? '只套用於編輯模式人物卡' : '只套用於檢視模式人物卡'))}</div>`;

  personCardMenu.dataset.simId = simId;
  personCardMenu.dataset.cardMode = viewMode;
  personCardMenu.classList.add('show');
  personCardMenu.setAttribute('aria-hidden', 'false');
  positionPersonCardMenu(clientX, clientY);
}

async function handlePersonCardMenuAction(action, simId) {
  if (!action) return;
  if (action === 'view') { closePersonCardMenu(); openPersonProfile(simId); return; }
  if (action === 'edit') { closePersonCardMenu(); openEditor(simId); return; }
  if (action === 'locate') { closePersonCardMenu(); focusSimOnCanvas(simId); return; }
  if (action === 'perspective') {
    const same =
      relationshipPerspectiveSimId ===
      String(simId);

    setRelationshipPerspective(
      same
        ? null
        : simId
    );

    closePersonCardMenu();

    if (!same) {
      focusSimOnCanvas(simId);
    }

    return;
  }
  if (action === 'clear-selection') { closePersonCardMenu(); clearNodeSelection(); return; }

  if ([
    'align-left',
    'align-center-x',
    'align-right',
    'align-top',
    'align-center-y',
    'align-bottom',
    'distribute-horizontal',
    'distribute-vertical'
  ].includes(action)) {
    applySelectedLayoutOperation(action);
    closePersonCardMenu();
    return;
  }

  if (action === 'reset-selected') {
    const fam = currentFamily();
    ensureFamilyLayoutShape(fam);

    const ids =
      [...selectedNodeIds]
        .filter(id =>
          Object.prototype.hasOwnProperty.call(
            fam.manualPositions[viewMode],
            id
          )
        );

    if (!ids.length) {
      closePersonCardMenu();
      return;
    }

    const before =
      captureLayoutHistoryState(
        fam,
        viewMode
      );

    const mutation =
      genealogyStore.removeNodePositions(
        fam.id,
        viewMode,
        ids
      );

    applyGenealogyMutation(mutation);
    syncNodeSelectionClasses();
    expandStageToFit();

    dragHistory.push({
      type:'card-layout',
      familyId:fam.id,
      mode:viewMode,
      before,
      after:captureLayoutHistoryState(
        fam,
        viewMode
      )
    });

    closePersonCardMenu();
    return;
  }
  if (action === 'remove-selected') {
    const fam = currentFamily();
    const ids = [...selectedNodeIds].filter(id => fam.memberIds.includes(id));
    if (!ids.length) { closePersonCardMenu(); return; }
    const ok = await uiConfirm(`${uiText('確定要將所選人物移出目前家族嗎？')}\n${uiText('人物本身仍會保留在人物資料中。')}`, {
      title: uiText('移出所選人物'), kind: 'danger', confirmText: uiText('移出家族')
    });
    if (!ok) return;
    const mutation =
      genealogyStore.removeFamilyMembers(
        fam.id,
        ids
      );

    clearNodeSelection();
    applyGenealogyMutation(mutation);
    closePersonCardMenu();
  }
}

personCardMenu?.addEventListener('click', e => {
  const actionBtn = e.target.closest('[data-person-card-menu-action]');
  if (actionBtn) {
    e.preventDefault(); e.stopPropagation();
    handlePersonCardMenuAction(actionBtn.dataset.personCardMenuAction, personCardMenu.dataset.simId);
  }
});
personCardMenu?.addEventListener('change', e => {
  const field = e.target?.dataset?.cardField;
  if (field && CARD_SETTING_FIELD_KEYS.includes(field)) {
    const settings = personCardMenu.dataset.cardMode === 'edit' ? getCardEditSettings() : getCardViewSettings();
    settings[field] = !!e.target.checked;
    save(); render();
    positionPersonCardMenu(parseFloat(personCardMenu.style.left) || 0, parseFloat(personCardMenu.style.top) || 0);
    return;
  }
  if (e.target?.name === 'nodeCardAppearance') {
    const value = e.target.value;
    if (['minimal','translucent','full'].includes(value)) {
      getCardViewSettings().appearance = value;
      save(); render();
      positionPersonCardMenu(parseFloat(personCardMenu.style.left) || 0, parseFloat(personCardMenu.style.top) || 0);
    }
  }
});

nodes.addEventListener('contextmenu', e => {
  const el = e.target.closest('.person-card[data-id]');
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  const id = el.dataset.id;
  if (getCurrentFreeLayout(currentFamily()) && arrangeTool === 'select' && !selectedNodeIds.has(id)) {
    selectedNodeIds.clear();
    selectedNodeIds.add(id);
    syncNodeSelectionClasses();
  }
  renderPersonCardMenu(id, e.clientX, e.clientY);
});

document.addEventListener('pointerdown', e => {
  if (personCardMenu?.classList.contains('show') && !e.target.closest('#personCardContextMenu')) closePersonCardMenu();
}, true);
window.addEventListener('resize', closePersonCardMenu);
window.addEventListener('blur', closePersonCardMenu);

function updateArrangeToolUI() {
  const fam = genealogyData ? currentFamily() : null;
  const isFree = !!fam && getCurrentFreeLayout(fam);
  const display = isFree ? '' : 'none';
  if (selectToolBtn) selectToolBtn.style.display = display;
  if (panToolBtn) panToolBtn.style.display = display;
  if (arrangeToolDivider) arrangeToolDivider.style.display = display;
  if (arrangeToolDividerEnd) arrangeToolDividerEnd.style.display = display;

  viewport.classList.toggle('selection-tool-active', isFree && arrangeTool === 'select' && !spacePanHeld);
  viewport.classList.toggle('pan-tool-active', isFree && arrangeTool === 'pan' && !spacePanHeld);
  viewport.classList.toggle('temporary-pan', isFree && spacePanHeld);

  if (selectToolBtn) {
    const active = isFree && arrangeTool === 'select';
    selectToolBtn.classList.toggle('active', active);
    selectToolBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  if (panToolBtn) {
    const active = isFree && arrangeTool === 'pan';
    panToolBtn.classList.toggle('active', active);
    panToolBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  if (!isFree) {
    clearNodeSelection();
    marqueeState = null;
    if (selectionMarquee) selectionMarquee.classList.remove('show');
  }
}

function setArrangeTool(tool) {
  if (tool !== 'select' && tool !== 'pan') return;

  const previousTool =
    arrangeTool;

  arrangeTool = tool;

  if (
    previousTool === 'select' &&
    tool === 'pan'
  ) {
    clearNodeSelection();
    finishMarquee();
    closePersonCardMenu();
  }

  updateArrangeToolUI();
}

selectToolBtn?.addEventListener('click', () => setArrangeTool('select'));
panToolBtn?.addEventListener('click', () => setArrangeTool('pan'));

function isTextInteractionTarget(target) {
  return !!target?.closest?.('input, textarea, select, [contenteditable="true"]');
}

function isPanGestureActive() {
  const fam = genealogyData ? currentFamily() : null;
  return !!fam && getCurrentFreeLayout(fam) && (arrangeTool === 'pan' || spacePanHeld);
}

function updateMarquee(clientX, clientY) {
  if (!marqueeState || !selectionMarquee) return;
  const viewportRect = viewport.getBoundingClientRect();
  const leftClient = Math.min(marqueeState.startX, clientX);
  const topClient = Math.min(marqueeState.startY, clientY);
  const rightClient = Math.max(marqueeState.startX, clientX);
  const bottomClient = Math.max(marqueeState.startY, clientY);

  selectionMarquee.style.left = `${leftClient - viewportRect.left}px`;
  selectionMarquee.style.top = `${topClient - viewportRect.top}px`;
  selectionMarquee.style.width = `${rightClient - leftClient}px`;
  selectionMarquee.style.height = `${bottomClient - topClient}px`;
  selectionMarquee.classList.add('show');

  const next = new Set(marqueeState.baseSelection);
  nodes.querySelectorAll('.person-card[data-id]').forEach(el => {
    const r = el.getBoundingClientRect();
    const intersects = r.right >= leftClient && r.left <= rightClient && r.bottom >= topClient && r.top <= bottomClient;
    if (intersects) next.add(el.dataset.id);
  });
  selectedNodeIds.clear();
  next.forEach(id => selectedNodeIds.add(id));
  syncNodeSelectionClasses();
}

function finishMarquee() {
  if (!marqueeState) return;
  marqueeState = null;
  if (selectionMarquee) {
    selectionMarquee.classList.remove('show');
    selectionMarquee.style.width = '0px';
    selectionMarquee.style.height = '0px';
  }
}

let panning = false, panStartX = 0, panStartY = 0, panStartPanX = 0, panStartPanY = 0;
viewport.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const onNode = !!e.target.closest('.person-card');
  const onLabel = !!e.target.closest('.edge-label');
  const fam = currentFamily();
  const isFree = getCurrentFreeLayout(fam);

  // 自由排列的框選會 preventDefault()，可能吃掉瀏覽器原生 dblclick。
  // 第二次按下空白畫布時直接執行置中，確保所有排列模式都一致。
  if (
    e.detail >= 2 &&
    !onNode &&
    !onLabel
  ) {
    e.preventDefault();
    finishMarquee();
    panning = false;
    viewport.classList.remove('dragging');
    fitScreen();
    return;
  }

  if (isFree && arrangeTool === 'select' && !spacePanHeld && !onNode && !onLabel) {
    e.preventDefault();
    marqueeState = {
      startX: e.clientX,
      startY: e.clientY,
      baseSelection: e.shiftKey ? new Set(selectedNodeIds) : new Set()
    };
    if (!e.shiftKey) clearNodeSelection();
    updateMarquee(e.clientX, e.clientY);
    return;
  }

  if (onNode && !isPanGestureActive()) return;
  if (onLabel) return;
  e.preventDefault();
  panning = true;
  viewport.classList.add('dragging');
  panStartX = e.clientX; panStartY = e.clientY;
  panStartPanX = panX; panStartPanY = panY;
});
window.addEventListener('mousemove', e => {
  if (marqueeState) updateMarquee(e.clientX, e.clientY);
  if (!panning) return;

  canvasViewState = 'manual';
  panX = panStartPanX + (e.clientX - panStartX);
  panY = panStartPanY + (e.clientY - panStartY);
  applyTransform();
});
window.addEventListener('mouseup', () => {
  finishMarquee();
  if (panning) { panning = false; viewport.classList.remove('dragging'); }
});
viewport.addEventListener('dblclick', e => {
  if (e.target.closest('.person-card')) return;
  if (e.target.closest('.edge-label')) return;

  e.preventDefault();
  finishMarquee();
  panning = false;
  viewport.classList.remove('dragging');
  fitScreen();
});
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const d = e.deltaY;
  if (d === 0) return;
  const step = Math.min(Math.abs(d)/100, 2);
  const factor = d < 0 ? Math.pow(1.12, step) : Math.pow(1/1.12, step);
  zoomAt(e.clientX, e.clientY, factor);
}, { passive: false });

labelsSvg.addEventListener('pointerdown', e => {
  if (labelLocked) return;
  const g = e.target.closest('.edge-label');
  if (!g) return;
  const key = g.dataset.key;
  if (!key) return;
  e.preventDefault(); e.stopPropagation();

  const baseX = parseFloat(g.dataset.x) || 0;
  const baseY = parseFloat(g.dataset.y) || 0;
  const cur = (genealogyData.labelPositions || {})[key] || { dx:0, dy:0 };

  labelDrag = {
    key,
    el:g,
    baseX,
    baseY,
    startX:e.clientX,
    startY:e.clientY,
    startDx:cur.dx || 0,
    startDy:cur.dy || 0,
    beforeOffset:captureLabelHistoryState(key),
    mutation:null,
    moved:false,
    pointerId:e.pointerId
  };

  try { g.setPointerCapture(e.pointerId); } catch(_){}
});

labelsSvg.addEventListener('pointermove', e => {
  if (!labelDrag || labelDrag.pointerId !== e.pointerId) return;

  const rawDx = (e.clientX - labelDrag.startX) / scale;
  const rawDy = (e.clientY - labelDrag.startY) / scale;

  if (
    !labelDrag.moved &&
    Math.hypot(rawDx * scale, rawDy * scale) > 3
  ) {
    labelDrag.moved = true;
    labelDrag.el.classList.add('dragging');
  }

  if (!labelDrag.moved) return;

  const snapDistance =
    GUIDE_SNAP_PX /
    Math.max(scale, 0.001);

  let dx = labelDrag.startDx + rawDx;
  let dy = labelDrag.startDy + rawDy;

  if (Math.abs(dx) <= snapDistance) dx = 0;
  if (Math.abs(dy) <= snapDistance) dy = 0;

  labelDrag.mutation =
    genealogyStore.mergeResults(
      labelDrag.mutation,
      genealogyStore.setRelationshipLabelPosition(
        labelDrag.key,
        dx === 0 && dy === 0
          ? null
          : { dx, dy }
      )
    );

  labelDrag.currentDx = dx;
  labelDrag.currentDy = dy;

  const tx = labelDrag.baseX + dx;
  const ty = labelDrag.baseY + dy;

  labelDrag.el.setAttribute(
    'transform',
    `translate(${tx.toFixed(1)},${ty.toFixed(1)})`
  );
});

const finishLabelDrag = e => {
  if (!labelDrag) return;
  if (
    e &&
    e.pointerId !== undefined &&
    labelDrag.pointerId !== e.pointerId
  ) {
    return;
  }

  const activeDrag = labelDrag;
  activeDrag.el.classList.remove('dragging');

  try {
    if (
      activeDrag.el.hasPointerCapture &&
      activeDrag.el.hasPointerCapture(activeDrag.pointerId)
    ) {
      activeDrag.el.releasePointerCapture(activeDrag.pointerId);
    }
  } catch (_) {}

  if (activeDrag.moved) {
    const afterOffset =
      captureLabelHistoryState(
        activeDrag.key
      );

    dragHistory.push({
      type:'relationship-label',
      key:activeDrag.key,
      before:{
        offset:activeDrag.beforeOffset
      },
      after:{
        offset:afterOffset
      }
    });

    applyGenealogyMutation(
      activeDrag.mutation,
      { render:false }
    );
  }

  labelDrag = null;
};

labelsSvg.addEventListener('pointerup', finishLabelDrag);
labelsSvg.addEventListener('pointercancel', finishLabelDrag);
labelsSvg.addEventListener('lostpointercapture', finishLabelDrag);

// ========【智慧對齊與等距吸附】// ========【智慧對齊與等距吸附】 設定 - 對齊邊緣 / 中心，同時支援水平與垂直等距 ========
function hideSmartGuides() {
  if (smartGuideVertical) smartGuideVertical.classList.remove('show');
  if (smartGuideHorizontal) smartGuideHorizontal.classList.remove('show');
  if (smartSpacingHorizontal) smartSpacingHorizontal.classList.remove('show');
  if (smartSpacingVertical) smartSpacingVertical.classList.remove('show');
}

function showSmartGuide(axis, stagePosition) {
  const guide = axis === 'x' ? smartGuideVertical : smartGuideHorizontal;
  if (!guide) return;
  const oneScreenPixel = 1 / Math.max(scale, 0.001);
  if (axis === 'x') {
    guide.style.left = `${stagePosition + PAD}px`;
    guide.style.width = `${oneScreenPixel}px`;
  } else {
    guide.style.top = `${stagePosition + PAD}px`;
    guide.style.height = `${oneScreenPixel}px`;
  }
  guide.classList.add('show');
}

function showEqualSpacingGuide(guideData) {
  if (!guideData) return;
  const target = guideData.axis === 'x' ? smartSpacingHorizontal : smartSpacingVertical;
  if (!target) return;

  const first = target.querySelector('.smart-spacing-first');
  const second = target.querySelector('.smart-spacing-second');
  const label = target.querySelector('.smart-spacing-label');
  if (!first || !second || !label) return;

  const firstStart = guideData.segments[0].start + PAD;
  const firstEnd = guideData.segments[0].end + PAD;
  const secondStart = guideData.segments[1].start + PAD;
  const secondEnd = guideData.segments[1].end + PAD;
  const gapText = `${Math.round(Math.max(0, guideData.gap))}`;

  if (guideData.axis === 'x') {
    const y = guideData.cross + PAD;
    first.style.left = `${firstStart}px`;
    first.style.top = `${y}px`;
    first.style.width = `${Math.max(0, firstEnd - firstStart)}px`;
    second.style.left = `${secondStart}px`;
    second.style.top = `${y}px`;
    second.style.width = `${Math.max(0, secondEnd - secondStart)}px`;
    label.style.left = `${(secondStart + secondEnd) / 2}px`;
    label.style.top = `${y - 3}px`;
  } else {
    const x = guideData.cross + PAD;
    first.style.left = `${x}px`;
    first.style.top = `${firstStart}px`;
    first.style.height = `${Math.max(0, firstEnd - firstStart)}px`;
    second.style.left = `${x}px`;
    second.style.top = `${secondStart}px`;
    second.style.height = `${Math.max(0, secondEnd - secondStart)}px`;
    label.style.left = `${x + 8}px`;
    label.style.top = `${(secondStart + secondEnd) / 2}px`;
  }

  label.textContent = gapText;
  target.classList.add('show');
}

// ========【Interaction Snap Orchestration】 設定 - Scene 提供 geometry，Interaction 執行對齊 / 等距 / 關係吸附 ========
function getSmartSnap(id, rawX, rawY, performanceSession = null) {
  const session =
    performanceSession ||
    createSingleDragPerformanceSession(id);

  if (session?.snap) {
    return session.snap(rawX, rawY, scale);
  }

  return {
    x:rawX,
    y:rawY,
    guideX:null,
    guideY:null,
    spacingX:null,
    spacingY:null
  };
}

function getDragSelectionSmartSnap(
  dragIds,
  startPositions,
  primaryId,
  rawDeltaX,
  rawDeltaY,
  performanceSession = null
) {
  if (dragIds.length === 1) {
    const start = startPositions.get(primaryId);
    if (!start) {
      return {
        deltaX:rawDeltaX,
        deltaY:rawDeltaY,
        guideX:null,
        guideY:null,
        spacingX:null,
        spacingY:null
      };
    }

    const snapped = getSmartSnap(
      primaryId,
      start.x + rawDeltaX,
      start.y + rawDeltaY,
      performanceSession
    );

    return {
      deltaX:snapped.x - start.x,
      deltaY:snapped.y - start.y,
      guideX:snapped.guideX,
      guideY:snapped.guideY,
      spacingX:snapped.spacingX,
      spacingY:snapped.spacingY
    };
  }

  const session =
    performanceSession ||
    createGroupDragPerformanceSession(
      dragIds,
      startPositions
    );

  if (session?.snapDelta) {
    return {
      ...session.snapDelta(rawDeltaX, rawDeltaY, scale),
      spacingX:null,
      spacingY:null
    };
  }

  return {
    deltaX:rawDeltaX,
    deltaY:rawDeltaY,
    guideX:null,
    guideY:null,
    spacingX:null,
    spacingY:null
  };
}
// ========【拖曳 Geometry Snapshot】 設定 - PointerMove 不再重建整張族譜幾何 ========
function buildDragPerformanceGeometry() {
  return genealogyScene?.buildDragPerformanceGeometry?.() || [];
}

function buildSingleDragRelationshipTargets(id) {
  return genealogyScene?.buildSingleDragRelationshipTargets?.(id) || { x:[], y:[] };
}

function createSingleDragPerformanceSession(
  id
) {
  if (
    !genealogyInteraction
      ?.createSingleDragSession
  ) {
    return null;
  }

  return genealogyInteraction
    .createSingleDragSession({
      id,
      geometry:
        buildDragPerformanceGeometry(),
      guideSnapPx:
        GUIDE_SNAP_PX,
      relationshipSnapPx:
        RELATIONSHIP_VERTICAL_SNAP_PX,
      relationshipTargets:
        buildSingleDragRelationshipTargets(
          id
        )
    });
}

function createGroupDragPerformanceSession(
  dragIds,
  startPositions
) {
  if (
    !genealogyInteraction
      ?.createGroupDragSession
  ) {
    return null;
  }

  return genealogyInteraction
    .createGroupDragSession({
      dragIds,
      startPositions,
      geometry:
        buildDragPerformanceGeometry(),
      guideSnapPx:
        GUIDE_SNAP_PX
    });
}

nodes.addEventListener('pointerdown', e => {
  // 只讓主滑鼠鍵進入人物卡的點擊／拖曳流程。
  // 右鍵必須完整保留給 contextmenu，避免自由排列模式的 preventDefault() 吃掉右鍵選單。
  if (e.button !== 0) return;
  const el = e.target.closest('.person-card');
  if (!el) return;
  const id = el.dataset.id;
  const fam = currentFamily();
  ensureFamilyLayoutShape(fam);
  const isFree = getCurrentFreeLayout(fam);

  // Space 是選取工具中的暫時平移：不攔截，交給 viewport 的平移手勢。
  if (isFree && spacePanHeld) return;

  // 拖曳工具：按住空白處平移畫布；按住人物卡片則直接移動該卡片。
  // 選取工具才負責多選 / 框選 / 整組拖曳，單張卡片移動不需要先進入選取狀態。
  if (isFree && arrangeTool === 'pan') {
    e.preventDefault();
    e.stopPropagation();

    const dragMode = viewMode;
    const manualPositions = fam.manualPositions[dragMode];
    const initialPos = manualPositions[id] || getSceneLayout()?.pos?.get(id) || null;
    const startPos = initialPos ? { x:initialPos.x, y:initialPos.y } : null;
    const sx = e.clientX, sy = e.clientY;
    const beforeLayoutState = captureLayoutHistoryState(fam, dragMode);
    let moved = false;
    let dragMutation = null;

    const dragPerformanceSession =
      createSingleDragPerformanceSession(
        id
      );

    const applyMove = ev => {
      if (fam.locked || !startPos) return;

      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;

      if (!moved && Math.hypot(dx, dy) > 3) {
        moved = true;
        el.classList.add('dragging');
      }

      if (!moved) return;

      const rawX = startPos.x + dx / scale;
      const rawY = startPos.y + dy / scale;
      const snapped =
        getSmartSnap(
          id,
          rawX,
          rawY,
          dragPerformanceSession
        );
      const nx = snapped.x;
      const ny = snapped.y;

      dragMutation =
        genealogyStore.mergeResults(
          dragMutation,
          genealogyStore.setNodePosition(
            fam.id,
            dragMode,
            id,
            { x:nx, y:ny }
          )
        );

      genealogyScene.updateLiveNodePosition(id, { x:nx, y:ny });

      el.style.left = `${nx + PAD}px`;
      el.style.top = `${ny + PAD}px`;

      hideSmartGuides();
      if (snapped.guideX !== null) showSmartGuide('x', snapped.guideX);
      if (snapped.guideY !== null) showSmartGuide('y', snapped.guideY);
      if (snapped.spacingX) showEqualSpacingGuide(snapped.spacingX);
      if (snapped.spacingY) showEqualSpacingGuide(snapped.spacingY);
      scheduleEdgeRedraw();
    };

    const moveFrame =
      genealogyInteraction
        ?.createFrameScheduler
        ? genealogyInteraction
            .createFrameScheduler(
              applyMove
            )
        : null;

    const onMove = ev => {
      const next = {
        clientX:ev.clientX,
        clientY:ev.clientY
      };

      if (moveFrame) {
        moveFrame.push(next);
      } else {
        applyMove(next);
      }
    };

    const onUp = () => {
      moveFrame?.flush?.();
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);

      el.classList.remove('dragging');
      hideSmartGuides();

      if (moved) {
        dragHistory.push({
          type:'card-layout',
          familyId:fam.id,
          mode:dragMode,
          before:beforeLayoutState,
          after:captureLayoutHistoryState(fam, dragMode)
        });

        applyGenealogyMutation(
          dragMutation,
          { render:false }
        );
        expandStageToFit();
      } else {
        if (viewMode === 'view') openPersonProfile(id);
        else openEditor(id);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return;
  }

  // 自由排列 + 選取工具：左鍵負責單選 / Shift 多選 / 拖曳已選人物。
  if (isFree && arrangeTool === 'select') {
    e.preventDefault();
    e.stopPropagation();

    const shift = e.shiftKey;
    const wasSelected = selectedNodeIds.has(id);

    if (!shift && !wasSelected) {
      selectedNodeIds.clear();
      selectedNodeIds.add(id);
      syncNodeSelectionClasses();
    } else if (shift && !wasSelected) {
      selectedNodeIds.add(id);
      syncNodeSelectionClasses();
    }

    const dragIds =
      [...selectedNodeIds]
        .filter(sid =>
          getSceneLayout()?.pos?.has(sid)
        );

    const startPositions = new Map();

    dragIds.forEach(sid => {
      const p =
        fam.manualPositions[viewMode][sid] ||
        getSceneLayout().pos.get(sid);

      if (p) {
        startPositions.set(
          sid,
          { x:p.x, y:p.y }
        );
      }
    });

    const primaryStart =
      startPositions.get(id);

    const sx = e.clientX;
    const sy = e.clientY;

    const beforeLayoutState =
      captureLayoutHistoryState(
        fam,
        viewMode
      );

    let moved = false;
    let dragMutation = null;

    const dragPerformanceSession =
      createGroupDragPerformanceSession(
        dragIds,
        startPositions
      );

    const applyMove = ev => {
      if (fam.locked || !primaryStart) return;

      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;

      if (
        !moved &&
        Math.hypot(dx, dy) > 3
      ) {
        moved = true;

        dragIds.forEach(sid =>
          nodes
            .querySelector(
              `.person-card[data-id="${CSS.escape(sid)}"]`
            )
            ?.classList
            .add('dragging')
        );
      }

      if (!moved) return;

      const rawDeltaX = dx / scale;
      const rawDeltaY = dy / scale;

      const snapped =
        getDragSelectionSmartSnap(
          dragIds,
          startPositions,
          id,
          rawDeltaX,
          rawDeltaY,
          dragPerformanceSession
        );

      const deltaX = snapped.deltaX;
      const deltaY = snapped.deltaY;
      const nextPositions = {};

      startPositions.forEach((startPos, sid) => {
        const nx = startPos.x + deltaX;
        const ny = startPos.y + deltaY;

        nextPositions[sid] = {
          x:nx,
          y:ny
        };

        genealogyScene.updateLiveNodePosition(sid, { x:nx, y:ny });

        const nodeEl =
          nodes.querySelector(
            `.person-card[data-id="${CSS.escape(sid)}"]`
          );

        if (nodeEl) {
          nodeEl.style.left =
            `${nx + PAD}px`;

          nodeEl.style.top =
            `${ny + PAD}px`;
        }
      });

      dragMutation =
        genealogyStore.mergeResults(
          dragMutation,
          genealogyStore.setNodePositions(
            fam.id,
            viewMode,
            nextPositions
          )
        );

      hideSmartGuides();

      if (snapped.guideX !== null) {
        showSmartGuide(
          'x',
          snapped.guideX
        );
      }

      if (snapped.guideY !== null) {
        showSmartGuide(
          'y',
          snapped.guideY
        );
      }

      if (snapped.spacingX) {
        showEqualSpacingGuide(
          snapped.spacingX
        );
      }

      if (snapped.spacingY) {
        showEqualSpacingGuide(
          snapped.spacingY
        );
      }

      scheduleEdgeRedraw();
    };

    const moveFrame =
      genealogyInteraction
        ?.createFrameScheduler
        ? genealogyInteraction
            .createFrameScheduler(
              applyMove
            )
        : null;

    const onMove = ev => {
      const next = {
        clientX:ev.clientX,
        clientY:ev.clientY
      };

      if (moveFrame) {
        moveFrame.push(next);
      } else {
        applyMove(next);
      }
    };

    const onUp = () => {
      moveFrame?.flush?.();

      document.removeEventListener(
        'pointermove',
        onMove
      );

      document.removeEventListener(
        'pointerup',
        onUp
      );

      document.removeEventListener(
        'pointercancel',
        onUp
      );

      dragIds.forEach(sid =>
        nodes
          .querySelector(
            `.person-card[data-id="${CSS.escape(sid)}"]`
          )
          ?.classList
          .remove('dragging')
      );

      hideSmartGuides();

      if (moved) {
        dragHistory.push({
          type:'card-layout',
          familyId:fam.id,
          mode:viewMode,
          before:beforeLayoutState,
          after:captureLayoutHistoryState(
            fam,
            viewMode
          )
        });

        applyGenealogyMutation(
          dragMutation,
          { render:false }
        );
        expandStageToFit();
      } else if (shift && wasSelected) {
        selectedNodeIds.delete(id);
        syncNodeSelectionClasses();
      }
    };

    document.addEventListener(
      'pointermove',
      onMove
    );

    document.addEventListener(
      'pointerup',
      onUp
    );

    document.addEventListener(
      'pointercancel',
      onUp
    );

    return;
  }

  // 自動排列沿用既有邏輯：拖動人物超過門檻後切換到自由排列。
  e.preventDefault();
  e.stopPropagation();

  if (fam.locked) {
    const sx = e.clientX;
    const sy = e.clientY;

    const onUp = ev => {
      document.removeEventListener(
        'pointerup',
        onUp
      );

      document.removeEventListener(
        'pointercancel',
        onUp
      );

      if (
        Math.hypot(
          ev.clientX - sx,
          ev.clientY - sy
        ) < 5
      ) {
        if (viewMode === 'view') {
          openPersonProfile(id);
        } else {
          openEditor(id);
        }
      }
    };

    document.addEventListener(
      'pointerup',
      onUp
    );

    document.addEventListener(
      'pointercancel',
      onUp
    );

    return;
  }

  const dragMode = viewMode;

  const beforeLayoutState =
    captureLayoutHistoryState(
      fam,
      dragMode
    );

  const manualPositions =
    fam.manualPositions[dragMode];

  const sim =
    genealogyData.sims[id];

  if (!sim) return;

  const initialPos =
    manualPositions[id] ||
    getSceneLayout().pos.get(id);

  if (!initialPos) return;

  const startPos = {
    x:initialPos.x,
    y:initialPos.y
  };

  const sx = e.clientX;
  const sy = e.clientY;

  let moved = false;
  let dragInitialized = false;
  let dragMutation = null;

  const dragPerformanceSession =
    createSingleDragPerformanceSession(
      id
    );

  const applyMove = ev => {
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;

    if (
      !moved &&
      Math.hypot(dx, dy) > 3
    ) {
      moved = true;
      el.classList.add('dragging');
    }

    if (!moved) return;

    if (!dragInitialized) {
      if (!fam.freeLayout[dragMode]) {
        const seededPositions = {};

        getSceneLayout().pos.forEach(
          (p, sid) => {
            seededPositions[sid] = {
              x:p.x,
              y:p.y
            };
          }
        );

        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setFamilyLayoutState(
              fam.id,
              dragMode,
              {
                freeLayout:true,
                manualPositions:seededPositions
              }
            )
          );

        arrangeTool = 'select';
        updateLayoutToggle();
      }

      if (!manualPositions[id]) {
        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setNodePosition(
              fam.id,
              dragMode,
              id,
              { ...startPos }
            )
          );
      }

      dragInitialized = true;
    }

    const rawX =
      startPos.x + dx / scale;

    const rawY =
      startPos.y + dy / scale;

    const snapped =
      getSmartSnap(
        id,
        rawX,
        rawY,
        dragPerformanceSession
      );

    const nx = snapped.x;
    const ny = snapped.y;

    dragMutation =
      genealogyStore.mergeResults(
        dragMutation,
        genealogyStore.setNodePosition(
          fam.id,
          dragMode,
          id,
          { x:nx, y:ny }
        )
      );

    genealogyScene.updateLiveNodePosition(id, { x:nx, y:ny });

    el.style.left =
      (nx + PAD) + 'px';

    el.style.top =
      (ny + PAD) + 'px';

    hideSmartGuides();

    if (snapped.guideX !== null) {
      showSmartGuide(
        'x',
        snapped.guideX
      );
    }

    if (snapped.guideY !== null) {
      showSmartGuide(
        'y',
        snapped.guideY
      );
    }

    if (snapped.spacingX) {
      showEqualSpacingGuide(
        snapped.spacingX
      );
    }

    if (snapped.spacingY) {
      showEqualSpacingGuide(
        snapped.spacingY
      );
    }

    scheduleEdgeRedraw();
  };

  const moveFrame =
    genealogyInteraction
      ?.createFrameScheduler
      ? genealogyInteraction
          .createFrameScheduler(
            applyMove
          )
      : null;

  const onMove = ev => {
    const next = {
      clientX:ev.clientX,
      clientY:ev.clientY
    };

    if (moveFrame) {
      moveFrame.push(next);
    } else {
      applyMove(next);
    }
  };

  const onUp = () => {
    moveFrame?.flush?.();

    document.removeEventListener(
      'pointermove',
      onMove
    );

    document.removeEventListener(
      'pointerup',
      onUp
    );

    document.removeEventListener(
      'pointercancel',
      onUp
    );

    el.classList.remove('dragging');
    hideSmartGuides();

    if (moved) {
      const afterLayoutState =
        captureLayoutHistoryState(
          fam,
          dragMode
        );

      dragHistory.push({
        type:'card-layout',
        familyId:fam.id,
        mode:dragMode,
        before:beforeLayoutState,
        after:afterLayoutState
      });

      selectedNodeIds.clear();
      selectedNodeIds.add(id);
      syncNodeSelectionClasses();

      applyGenealogyMutation(
        dragMutation,
        { render:false }
      );

      expandStageToFit();
    } else {
      if (viewMode === 'view') {
        openPersonProfile(id);
      } else {
        openEditor(id);
      }
    }
  };

  document.addEventListener(
    'pointermove',
    onMove
  );

  document.addEventListener(
    'pointerup',
    onUp
  );

  document.addEventListener(
    'pointercancel',
    onUp
  );
});

function expandStageToFit() {
  genealogyScene?.expandStageToFit?.();
}

function updateLayoutToggle() {
  const fam = currentFamily();
  const isFree = getCurrentFreeLayout(fam);
  const btn = $('layoutToggle'), lockBtn = $('lockToggle');
  if (isFree) {
    setIconText(btn, 'arrows-move', '自由排列');
    btn.classList.add('active');
    $('resetLayoutBtn').style.display = '';
    lockBtn.style.display = '';
    if (fam.locked) {
      setIconText(lockBtn, 'lock', '已鎖定');
      lockBtn.classList.add('active');
    } else {
      setIconText(lockBtn, 'unlock', '未鎖定');
      lockBtn.classList.remove('active');
    }
  } else {
    setIconText(btn, 'diagram-3', '自動排列');
    btn.classList.remove('active');
    $('resetLayoutBtn').style.display = 'none';
    lockBtn.style.display = 'none';
  }
  updateArrangeToolUI();
}
$('layoutToggle').onclick = () => {
  const fam = currentFamily();
  ensureFamilyLayoutShape(fam);

  let mutation;

  if (!fam.freeLayout[viewMode]) {
    const manualPositions = {};

    getSceneLayout().pos.forEach((p, sid) => {
      manualPositions[sid] = {
        x:p.x,
        y:p.y
      };
    });

    mutation =
      genealogyStore.setFamilyLayoutState(
        fam.id,
        viewMode,
        {
          freeLayout:true,
          manualPositions
        }
      );

    arrangeTool = 'pan';
  } else {
    mutation =
      genealogyStore.setFamilyLayoutState(
        fam.id,
        viewMode,
        {
          freeLayout:false,
          manualPositions:{}
        }
      );

    clearNodeSelection();
  }

  applyGenealogyMutation(mutation);
  updateLayoutToggle();
};

$('lockToggle').onclick = () => {
  const fam = currentFamily();
  if (!getCurrentFreeLayout(fam)) return;

  const mutation =
    genealogyStore.setFamilyLocked(
      fam.id,
      !fam.locked
    );

  applyGenealogyMutation(
    mutation,
    { render:false }
  );
  updateLayoutToggle();
};

$('resetLayoutBtn').onclick = async () => {
  const fam = currentFamily();
  const modeName =
    viewMode === 'view'
      ? '檢視'
      : '編輯';

  if (!await uiConfirm(
    `清除「${modeName}模式」下本家族的所有手動位置，恢復自動樹狀。確定嗎？`,
    {
      title:'重設卡片位置',
      kind:'danger',
      confirmText:'重設位置'
    }
  )) return;

  const mutation =
    genealogyStore.setFamilyLayoutState(
      fam.id,
      viewMode,
      {
        freeLayout:false,
        manualPositions:{}
      }
    );

  clearNodeSelection();
  applyGenealogyMutation(mutation);
  updateLayoutToggle();
  requestAnimationFrame(fitScreen);
};

relationshipPerspectiveBtn?.addEventListener(
  'click',
  () => {
    setRelationshipPerspective(null);
  }
);

$('labelToggle').onclick = () => {
  showRelLabels = !showRelLabels;
  const btn = $('labelToggle');
  if (showRelLabels) { btn.classList.add('active'); setIconText(btn, 'tags', '隱藏關係'); }
  else { btn.classList.remove('active'); setIconText(btn, 'tags', '顯示關係'); }
  syncRelationshipToolbarVisibility();
  try { localStorage.setItem(LABELS_KEY, showRelLabels ? '1' : '0'); } catch(e){}
  if (getSceneLayout()) drawEdges();
};

function getFamilyGenerationLevels(fam) {
  return (
    genealogyScene?.getGenerationLevels?.(
      fam?.memberIds || []
    ) ||
    new Map()
  );
}

function calculateFamilyGenerationCount(fam) {
  const levels = getFamilyGenerationLevels(fam);
  if (!levels.size) return 0;

  return (
    Math.max(...levels.values()) +
    1
  );
}

function formatGenerationLabel(level) {
  if (!Number.isFinite(level)) return '';

  const generation = level + 1;
  const language =
    document.documentElement.lang ||
    'zh-Hant';

  if (language === 'en') {
    return `Generation ${generation}`;
  }

  return `第 ${generation} 代`;
}

function getSimGenerationLabel(simId, fam = currentFamily()) {
  if (!simId || !fam) return '';

  const levels =
    getFamilyGenerationLevels(fam);

  const level =
    levels.get(simId);

  return Number.isFinite(level)
    ? formatGenerationLabel(level)
    : '';
}

function renderFamilyCover(fam) {
  const img = $('familyCoverImage'), collage = $('familyCoverCollage'), empty = $('familyCoverEmpty');
  if (!img || !collage || !empty) return;
  const coverUrl = resolveImageUrl(fam.coverImage);
  if (coverUrl) {
    img.src = coverUrl; img.hidden = false; collage.innerHTML=''; empty.style.display='none'; return;
  }
  img.hidden = true; img.removeAttribute('src');
  const members = (fam.memberIds || []).map(id => genealogyData.sims[id]).filter(Boolean).slice(0,4);
  const withContent = members.filter(Boolean);
  collage.innerHTML = withContent.map(sim => {
    const avatar = framedAvatarImageHTML(sim.avatar, sim.avatarFrame);
    return `<div class="family-cover-collage-item">${avatar || esc((displayDataText(sim.name,sim)||'?').charAt(0))}</div>`;
  }).join('');
  empty.style.display = withContent.length ? 'none' : '';
}


// ========【家族成員世代排序】 設定 - 只改側邊欄顯示順序，不改寫家族成員資料 ========
function familyGenerationSortText(order) {
  const lang = familyNavLanguage();

  if (lang === 'en') {
    return order === 'desc'
      ? 'Generation descending · descendants → ancestors'
      : 'Generation ascending · ancestors → descendants';
  }

  if (lang === 'zh-Hans') {
    return order === 'desc'
      ? '世代降序 · 后代 → 祖先'
      : '世代升序 · 祖先 → 后代';
  }

  return order === 'desc'
    ? '世代降序 · 後代 → 祖先'
    : '世代升序 · 祖先 → 後代';
}

function updateFamilyGenerationSortControl() {
  const btn = $('familyGenerationSortBtn');
  if (!btn) return;

  btn.dataset.sortOrder =
    familyMemberGenerationSort;

  const label =
    familyGenerationSortText(
      familyMemberGenerationSort
    );

  btn.title = label;
  btn.setAttribute('aria-label', label);
}

function setFamilyMemberGenerationSort(order) {
  familyMemberGenerationSort =
    order === 'desc'
      ? 'desc'
      : 'asc';

  try {
    localStorage.setItem(
      FAMILY_MEMBER_GENERATION_SORT_KEY,
      familyMemberGenerationSort
    );
  } catch (_) {}

  updateFamilyGenerationSortControl();
  renderFamilyMemberList(
    currentTreeFamily() ||
    currentFamily()
  );
}

$('familyGenerationSortBtn')?.addEventListener(
  'click',
  () => {
    const nextOrder =
      familyMemberGenerationSort === 'asc'
        ? 'desc'
        : 'asc';

    setFamilyMemberGenerationSort(nextOrder);
  }
);

const familyMemberController = {
  syncRemoveToolbar() {
    const startBtn = $('removeMemberBtn');
    const addMenu = $('familyMemberAddMenu');
    const toolbar = $('familyMemberRemoveToolbar');
    const countEl = $('familyMemberRemoveCount');
    const confirmBtn = $('familyMemberRemoveConfirmBtn');
    const count = familyMemberOperationState.selection.size;

    if (startBtn) startBtn.hidden = familyMemberOperationState.removeMode;
    if (addMenu) addMenu.hidden = familyMemberOperationState.removeMode;
    if (toolbar) toolbar.hidden = !familyMemberOperationState.removeMode;
    if (countEl) countEl.textContent = `已選 ${count} 位`;

    if (confirmBtn) {
      confirmBtn.disabled = count === 0;
      confirmBtn.textContent = `移除 ${count} 位`;
    }
  },

  setRemoveMode(enabled, selectedIds = []) {
    familyMemberOperationState.removeMode = !!enabled;
    familyMemberOperationState.selection.clear();

    if (familyMemberOperationState.removeMode) {
      selectedIds.forEach(id => {
        if (id && genealogyData.sims[id]) {
          familyMemberOperationState.selection.add(id);
        }
      });
    }

    if (typeof closeAppMenus === 'function') closeAppMenus();
    renderFamilyMemberList(currentFamily());
  },

  toggleSelection(simId) {
    if (!familyMemberOperationState.removeMode || !simId) return;

    if (familyMemberOperationState.selection.has(simId)) {
      familyMemberOperationState.selection.delete(simId);
    } else {
      familyMemberOperationState.selection.add(simId);
    }

    renderFamilyMemberList(currentFamily());
  },

  async confirmRemoveSelected(event) {
    if (
      !familyMemberOperationState.removeMode ||
      !familyMemberOperationState.selection.size
    ) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();

    const family = currentFamily();
    const ids = [...familyMemberOperationState.selection]
      .filter(id => family.memberIds.includes(id));

    if (!ids.length) return;

    const confirmed = await uiConfirm(
      `${uiText('確定要將所選人物移出目前家族嗎？')}\n${uiText('人物本身仍會保留在人物資料中。')}`,
      {
        title:uiText('移出所選人物'),
        kind:'danger',
        confirmText:uiText('移出家族')
      }
    );

    if (!confirmed) return;

    const mutation = genealogyStore.removeFamilyMembers(
      family.id,
      ids
    );

    resetFamilyMemberOperations();
    applyGenealogyMutation(mutation);
    requestAnimationFrame(fitScreen);
  }
};

function renderFamilyMemberList(fam) {
  const list = $('familyMemberList');
  if (!list) return;

  let members =
    (fam.memberIds || [])
      .map(id => genealogyData.sims[id])
      .filter(Boolean);

  updateFamilyGenerationSortControl();

  if (!members.length) {
    resetFamilyMemberOperations();
    familyMemberController.syncRemoveToolbar();
    list.innerHTML = `<div class="family-member-empty">${esc(uiText('目前家族還沒有成員'))}</div>`;
    return;
  }

  const currentIds =
    new Set(members.map(sim => sim.id));

  [...familyMemberOperationState.selection].forEach(id => {
    if (!currentIds.has(id)) {
      familyMemberOperationState.selection.delete(id);
    }
  });

  const generationLevels =
    getFamilyGenerationLevels(fam);

  const originalOrder =
    new Map(
      members.map(
        (sim, index) => [sim.id, index]
      )
    );

  const direction =
    familyMemberGenerationSort === 'desc'
      ? -1
      : 1;

  members = [...members].sort((a, b) => {
    const aGeneration =
      generationLevels.get(a.id);
    const bGeneration =
      generationLevels.get(b.id);

    const aKnown =
      Number.isFinite(aGeneration);
    const bKnown =
      Number.isFinite(bGeneration);

    // 無法判定世代的人物固定放在清單最後，
    // 升序 / 降序都不會把未連入族譜的人物推到最前面。
    if (aKnown !== bKnown) {
      return aKnown ? -1 : 1;
    }

    if (
      aKnown &&
      bKnown &&
      aGeneration !== bGeneration
    ) {
      return (
        aGeneration -
        bGeneration
      ) * direction;
    }

    // 同一世代保持原始家族成員順序。
    return (
      (originalOrder.get(a.id) ?? 0) -
      (originalOrder.get(b.id) ?? 0)
    );
  });

  list.innerHTML = members.map(sim => {
    const generation = generationLevels.has(sim.id)
      ? formatGenerationLabel(generationLevels.get(sim.id))
      : '';

    const meta = [
      generation,
      displayDataText(sim.lifeStage,sim),
      displayDataText(sim.career,sim)
    ].filter(Boolean).join(' · ');

    const selected = familyMemberOperationState.selection.has(sim.id);

    return `<div class="family-member-row${familyMemberOperationState.removeMode ? ' remove-mode' : ''}${selected ? ' remove-selected' : ''}" data-family-sim-id="${esc(sim.id)}" tabindex="0">
      <div class="family-member-avatar-wrap">
        <div class="family-member-avatar">${framedAvatarImageHTML(sim.avatar, sim.avatarFrame) || esc((displayDataText(sim.name,sim)||'?').charAt(0))}</div>
        <button class="family-member-remove-select${selected ? ' selected' : ''}" type="button" data-family-member-remove-select="${esc(sim.id)}" aria-pressed="${selected ? 'true' : 'false'}" title="${esc(uiText(selected ? '取消選取' : '批量移除'))}">
          ${iconSvg(selected ? 'check-lg' : 'trash3')}
        </button>
      </div>
      <div class="family-member-copy"><div class="family-member-name">${esc(displayDataText(sim.name,sim))}</div><div class="family-member-meta">${esc(meta)}</div></div>
      <div class="ui-menu family-member-menu">
        <button class="family-member-more ui-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="${esc(uiText('更多'))}">${iconSvg('three-dots')}</button>
        <div class="ui-menu-popover family-member-popover" role="menu">
          <button class="ui-menu-item" type="button" role="menuitem" data-family-member-action="view" data-family-member-id="${esc(sim.id)}">${iconSvg('person-vcard')}<span>${esc(uiText('查看個人檔案'))}</span></button>
          <button class="ui-menu-item" type="button" role="menuitem" data-family-member-action="edit" data-family-member-id="${esc(sim.id)}">${iconSvg('pencil-square')}<span>${esc(uiText('編輯模擬市民'))}</span></button>
          <button class="ui-menu-item" type="button" role="menuitem" data-family-member-action="locate" data-family-member-id="${esc(sim.id)}">${iconSvg('crosshair')}<span>${esc(uiText('在族譜中定位'))}</span></button>
          <div class="ui-menu-divider"></div>
          <button class="ui-menu-item danger" type="button" role="menuitem" data-family-member-action="remove" data-family-member-id="${esc(sim.id)}">${iconSvg('person-dash')}<span>${esc(uiText('移出目前家族'))}</span></button>
        </div>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-family-sim-id]').forEach(row => {
    const handle = e => {
      if (e?.target?.closest?.('.family-member-menu, .family-member-remove-select')) return;
      if (familyMemberOperationState.removeMode) {
        familyMemberController.toggleSelection(row.dataset.familySimId);
        return;
      }
      openPersonProfile(row.dataset.familySimId);
    };

    row.addEventListener('click', handle);
    row.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest?.('.family-member-menu')) {
        e.preventDefault();
        handle(e);
      }
    });
  });

  list.querySelectorAll('[data-family-member-remove-select]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      familyMemberController.toggleSelection(btn.dataset.familyMemberRemoveSelect);
    });
  });

  list.querySelectorAll('[data-family-member-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const simId = btn.dataset.familyMemberId;
      const action = btn.dataset.familyMemberAction;
      if (!simId || !genealogyData.sims[simId]) return;

      if (action === 'view') openPersonProfile(simId);
      else if (action === 'edit') openEditor(simId);
      else if (action === 'locate') focusSimOnCanvas(simId);
      else if (action === 'remove') familyMemberController.setRemoveMode(true, [simId]);
    });
  });

  familyMemberController.syncRemoveToolbar();
  if (!familyMemberOperationState.removeMode) setupAppMenus();
}

function refreshFamilyProfilePanel() {
  const fam = currentFamily(); if (!fam) return;
  const viewFamily = currentTreeFamily() || fam;
  ensureFamilyProfileShape(fam);
  const bio = $('familyBio'); if (bio && document.activeElement !== bio) bio.value = fam.bio || '';
  const members = (viewFamily.memberIds || []).map(id => genealogyData.sims[id]).filter(Boolean);
  if ($('familyMemberCount')) $('familyMemberCount').textContent = String(members.length);
  if ($('familyGenerationCount')) $('familyGenerationCount').textContent = String(calculateFamilyGenerationCount(viewFamily));
  if ($('familyDeceasedCount')) $('familyDeceasedCount').textContent = String(members.filter(sim => sim.status === '已故' || sim.status === '幽靈').length);

  const gameDate = $('familyGameDate');
  if (gameDate) {
    const dateText = formatGameDate(genealogyData && genealogyData.meta && genealogyData.meta.realDateCurrentDate);
    if (dateText) {
      gameDate.hidden = false;
      gameDate.title = uiText('匯出時遊戲日期');
      gameDate.innerHTML = `<span>${esc(uiText('遊戲日期'))}</span> <strong>${esc(dateText)}</strong>`;
    } else {
      gameDate.hidden = true;
      gameDate.removeAttribute('title');
      gameDate.textContent = '';
    }
  }

  renderFamilyCover(viewFamily); renderFamilyMemberList(viewFamily);
}

function refreshFamilyUI() {
  const fam = currentFamily();
  if (!fam) return;

  const familyName = displayDataText(fam.name, fam);
  const selectorEntries = getFamilySelectorEntries();

  familyNameInput.value = familyName;
  syncFamilyNameInputWidth();

  familySelect.innerHTML = selectorEntries
    .map(entry =>
      `<option value="${esc(entry.value)}">${esc(entry.label || displayDataText(entry.labelFamily.name, entry.labelFamily))}</option>`
    )
    .join('');

  const selected =
    selectorEntries.find(entry =>
      entry.value === getFamilyTreeSelectionValue(familyTreeViewMode)
    ) ||
    findBestFamilySelectorEntry(fam, selectorEntries);

  if (selected) {
    setFamilyTreeSelectionValue(
      familyTreeViewMode,
      selected.value
    );

    familySelect.value = selected.value;
  }

  document.title = familyName + ' · ' + uiText('模擬市民族譜工具');
  updateLayoutToggle();
  syncNavSelectControl('familySelect');
  refreshFamilyProfilePanel();
}
familySelect.onchange = async () => {
  relationshipPerspectiveSimId = null;
  syncRelationshipPerspectiveUI();

  const selectorEntries = getFamilySelectorEntries();
  const selectedEntry = selectorEntries.find(entry => entry.value === familySelect.value);
  if (!selectedEntry) return;

  dragHistory.clear();
  clearNodeSelection();
  arrangeTool = 'pan';

  setFamilyTreeSelectionValue(
    familyTreeViewMode,
    selectedEntry.value
  );

  genealogyData.currentFamilyId = selectedEntry.familyId;
  familyTreeLastSourceFamilyId = selectedEntry.familyId;

  resetPersonLibraryOperations({ batch:false, add:true });
  resetFamilyMemberOperations();
  familyMemberOperationState.removeMode = false;
  closeEditor();

  save();
  void preloadCurrentViewAssets();
  refreshFamilyUI();
  render();
  requestAnimationFrame(fitScreen);
};
familyNameInput.addEventListener('input', syncFamilyNameInputWidth);
$('familyNameEditBtn')?.addEventListener('click', () => {
  familyNameInput.focus();
  familyNameInput.select();
});
if (document.fonts?.ready) document.fonts.ready.then(syncFamilyNameInputWidth).catch(() => {});
window.addEventListener('resize', debounce(syncFamilyNameInputWidth, 80));
familyNameInput.onchange = () => {
  const fam = currentFamily();
  const shownBefore = displayDataText(fam.name, fam);
  const v = familyNameInput.value.trim() || uiText('家族');
  // 只是在其他語言下顯示內建範例名稱、沒有真的改字時，不回寫翻譯值。
  if (isBuiltinSampleFamily(fam) && v === shownBefore) {
    familyNameInput.value = shownBefore;
    syncFamilyNameInputWidth();
    return;
  }
  const mutation =
    genealogyStore.updateFamily(
      fam.id,
      { name:v }
    );

  familyNameInput.value = v;
  applyGenealogyMutation(mutation, {
    render:false
  });
};
const familyBioInput = $('familyBio');
if (familyBioInput) {
  familyBioInput.addEventListener('input', () => {
    const fam = currentFamily(); if (!fam) return;
    const mutation =
      genealogyStore.updateFamily(
        fam.id,
        { bio:familyBioInput.value }
      );

    applyGenealogyMutation(mutation, {
      render:false,
      refreshFamily:false
    });
  });
}
const familyCoverInput = $('familyCoverInput');
if (familyCoverInput) familyCoverInput.onchange = async e => {
  const file = e.target.files?.[0]; e.target.value=''; if (!file) return;
  try {
    const result = await compressBgImage(file);
    const fam = currentFamily();
    const coverImage = await saveImageAsset(result.blob, {
      width:result.width,
      height:result.height
    });

    const mutation =
      genealogyStore.updateFamily(
        fam.id,
        { coverImage }
      );

    applyGenealogyMutation(mutation, {
      immediateSave:true,
      render:false,
      refreshFamily:false
    });
    renderFamilyCover(fam);
    scheduleGC();
  } catch(err) { uiAlert(err.message || '圖片處理失敗', { title:'圖片處理失敗', kind:'danger' }); }
};
$('familyCoverClearBtn')?.addEventListener('click', async () => {
  const fam = currentFamily(); if (!fam || !fam.coverImage) return;

  const mutation =
    genealogyStore.updateFamily(
      fam.id,
      { coverImage:null }
    );

  applyGenealogyMutation(mutation, {
    immediateSave:true,
    render:false,
    refreshFamily:false
  });
  renderFamilyCover(fam);
  scheduleGC();
});

$('newFamilyBtn').onclick = async () => {
  const name = await uiPrompt('請輸入新家族名稱。', '新家族', { title: '新增家族', confirmText: '新增' });
  if (name === null) return;
  const fam = {
    id:uid('fam'), name:name.trim()||'新家族',
    memberIds:[], bio:'', coverImage:null,
    freeLayout: { view: false, edit: false },
    manualPositions: { view: {}, edit: {} }, locked: false
  };
  const mutation =
    genealogyStore.createFamily(
      fam,
      { makeCurrent:true }
    );

  dragHistory.clear();
  personLibraryState.addSelection.clear();
  familyMemberOperationState.selection.clear();
  applyGenealogyMutation(mutation);
  requestAnimationFrame(fitScreen);
};
$('delFamilyBtn').onclick = async () => {
  if (genealogyData.families.length <= 1) { uiAlert('至少需要保留一個家族。', { title: '無法刪除家族' }); return; }
  const fam = currentFamily();
  if (!await uiConfirm(`確定刪除家族「${displayDataText(fam.name, fam)}」嗎？\n（家族內所有模擬市民仍保留在模擬市民池中）`, { title: '刪除家族', kind: 'danger', confirmText: '刪除家族' })) return;
  const fallbackFamilyId =
    genealogyData.families
      .find(f => f.id !== fam.id)
      ?.id ||
    null;

  const mutation =
    genealogyStore.deleteFamily(
      fam.id,
      { fallbackFamilyId }
    );

  dragHistory.clear();
  personLibraryState.addSelection.clear();
  familyMemberOperationState.selection.clear();
  closeEditor();
  applyGenealogyMutation(mutation);
  scheduleGC();
  requestAnimationFrame(fitScreen);
};

function refreshSS(selectId) {
  const wrap = document.querySelector(`.ui-select-wrap[data-ui-select-for="${selectId}"]`);
  if (wrap && wrap._refresh) wrap._refresh();
}


// ========【共用單選箭頭】 設定 - 編輯頁與導覽共用同一顆 Chevron SVG ========
function installSharedNativeSelectChevrons(root = document) {
  const selector = '.ui-dialog-panel select:not([multiple])';
  const candidates = [];

  if (root instanceof Element && root.matches(selector)) candidates.push(root);
  if (root && root.querySelectorAll) candidates.push(...root.querySelectorAll(selector));

  candidates.forEach(select => {
    // 導覽列使用自己的自訂下拉；hidden select 是搜尋型下拉的資料來源，都不應包裝。
    if (!select || select.hidden || select.hasAttribute('hidden') || select.classList.contains('nav-native-select')) return;
    if (select.closest('.select-chevron-shell')) return;

    const parent = select.parentNode;
    if (!parent) return;

    const shell = document.createElement('span');
    shell.className = 'select-chevron-shell';
    parent.insertBefore(shell, select);
    shell.appendChild(select);

    const icon = document.createElement('span');
    icon.className = 'l1ng-icon icon-chevron-down select-chevron-icon';
    icon.setAttribute('aria-hidden', 'true');
    shell.appendChild(icon);
  });
}

function observeSharedNativeSelectChevrons() {
  installSharedNativeSelectChevrons(document);
  const observer = new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node instanceof Element) installSharedNativeSelectChevrons(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
function setupSearchSelects() {
  document.querySelectorAll(
    '.ui-select-wrap'
  ).forEach(wrap => {
    const selectId =
      wrap.dataset.ssFor;

    const select =
      document.getElementById(
        selectId
      );

    if (!select) return;

    const input =
      wrap.querySelector(
        '.ui-select-input'
      );

    const dropdown =
      wrap.querySelector(
        '.ui-select-dropdown'
      );

    const searchEl =
      wrap.querySelector(
        '.ui-select-search'
      );

    const optionsEl =
      wrap.querySelector(
        '.ui-select-options'
      );

    const isMultiple =
      select.multiple;

    const isCreatable =
      wrap.dataset.ssCreatable ===
      'true';

    const rawPlaceholder =
      wrap.dataset.placeholder ||
      '點選選擇…';

    const usePortalDropdown =
      wrap.dataset.ssPortal ===
      'true';

    const dropdownHome = {
      parent:dropdown.parentNode,
      next:dropdown.nextSibling
    };

    function restoreDropdownHome() {
      if (
        !usePortalDropdown ||
        dropdown.parentNode ===
          dropdownHome.parent
      ) {
        return;
      }

      dropdown.classList.remove(
        'ui-select-dropdown-portal'
      );

      dropdown.style.removeProperty(
        'left'
      );

      dropdown.style.removeProperty(
        'top'
      );

      dropdown.style.removeProperty(
        'width'
      );

      dropdown.style.removeProperty(
        'max-height'
      );

      if (
        dropdownHome.next &&
        dropdownHome.next.parentNode ===
          dropdownHome.parent
      ) {
        dropdownHome.parent.insertBefore(
          dropdown,
          dropdownHome.next
        );
      } else {
        dropdownHome.parent.appendChild(
          dropdown
        );
      }
    }

    function positionPortalDropdown() {
      if (
        !usePortalDropdown ||
        !wrap.classList.contains(
          'ui-select-open'
        )
      ) {
        return;
      }

      if (
        dropdown.parentNode !==
        document.body
      ) {
        document.body.appendChild(
          dropdown
        );
      }

      dropdown.classList.add(
        'ui-select-dropdown-portal'
      );

      const rect =
        input.getBoundingClientRect();

      const margin = 10;
      const gap = 5;

      const minWidth =
        Math.max(
          280,
          rect.width
        );

      const width =
        Math.min(
          Math.max(
            minWidth,
            rect.width
          ),
          Math.max(
            280,
            window.innerWidth -
              margin * 2
          )
        );

      const left =
        Math.min(
          Math.max(
            margin,
            rect.left
          ),
          Math.max(
            margin,
            window.innerWidth -
              width -
              margin
          )
        );

      const below =
        window.innerHeight -
        rect.bottom -
        gap -
        margin;

      const above =
        rect.top -
        gap -
        margin;

      const openAbove =
        below < 220 &&
        above > below;

      const maxHeight =
        Math.max(
          180,
          Math.min(
            360,
            openAbove
              ? above
              : below
          )
        );

      dropdown.style.width =
        Math.round(width) + 'px';

      dropdown.style.left =
        Math.round(left) + 'px';

      dropdown.style.maxHeight =
        Math.round(maxHeight) +
        'px';

      dropdown.style.top =
        openAbove
          ? Math.round(
              Math.max(
                margin,
                rect.top -
                  Math.min(
                    maxHeight,
                    dropdown.scrollHeight ||
                      maxHeight
                  ) -
                  gap
              )
            ) + 'px'
          : Math.round(
              rect.bottom + gap
            ) + 'px';
    }

    function renderInput() {
      const placeholder =
        uiText(
          rawPlaceholder
        );

      if (isMultiple) {
        const selected =
          [...select.options]
            .filter(option =>
              option.selected
            );

        if (!selected.length) {
          input.innerHTML =
            '<span class="ui-select-placeholder">' +
            esc(placeholder) +
            '</span>';
        } else {
          input.innerHTML =
            selected
              .map(option => {
                const locked =
                  option.disabled;

                const note =
                  option.dataset.ssNote ||
                  '';

                return (
                  '<span class="ui-select-tag' +
                  (
                    locked
                      ? ' locked'
                      : ''
                  ) +
                  '"' +
                  (
                    note
                      ? ' title="' +
                        esc(note) +
                        '"'
                      : ''
                  ) +
                  '>' +
                  esc(
                    option.textContent
                  ) +
                  (
                    locked
                      ? '<span class="ui-select-tag-note">' +
                        esc(
                          uiText('自動')
                        ) +
                        '</span>'
                      : '<span class="ui-select-tag-x" data-remove="' +
                        esc(option.value) +
                        '" title="移除">×</span>'
                  ) +
                  '</span>'
                );
              })
              .join('');
        }

        input.querySelectorAll(
          '.ui-select-tag-x'
        ).forEach(remove => {
          remove.onclick =
            event => {
              event.stopPropagation();

              const option =
                [...select.options]
                  .find(candidate =>
                    candidate.value ===
                    remove.dataset.remove
                  );

              if (option) {
                option.selected =
                  false;
              }

              renderInput();
              renderOptions(
                searchEl.value
              );

              select.dispatchEvent(
                new Event(
                  'change',
                  { bubbles:true }
                )
              );
            };
        });
      } else {
        const selected =
          select.options[
            select.selectedIndex
          ];

        if (
          !selected ||
          selected.value === ''
        ) {
          input.innerHTML =
            '<span class="ui-select-placeholder">' +
            esc(placeholder) +
            '</span>';
        } else {
          input.textContent =
            selected.textContent;
        }
      }

      input.insertAdjacentHTML(
        'beforeend',
        iconSvg(
          'chevron-down',
          'ui-select-chevron-icon'
        )
      );
    }

    function selectSingleOption(
      option
    ) {
      [...select.options]
        .forEach(candidate => {
          candidate.selected =
            false;
        });

      option.selected = true;

      closeDropdown();
      renderInput();

      select.dispatchEvent(
        new Event(
          'change',
          { bubbles:true }
        )
      );
    }

    function commitCreatableValue(
      rawValue
    ) {
      if (!isCreatable) {
        return '';
      }

      const value =
        normalizeRelationshipTypeText(
          rawValue
        );

      if (!value) return '';

      let option =
        [...select.options]
          .find(candidate =>
            candidate.value === value ||
            candidate.textContent
              .trim()
              .toLowerCase() ===
              value.toLowerCase()
          );

      if (!option) {
        option =
          document.createElement(
            'option'
          );

        option.value = value;
        option.textContent = value;

        select.appendChild(option);
      }

      selectSingleOption(option);
      return option.value;
    }

    function renderOptions(
      filter = ''
    ) {
      const raw =
        String(filter || '').trim();

      const q =
        raw.toLowerCase();

      const options =
        [...select.options];

      const filtered =
        q
          ? options.filter(
              option =>
                option.textContent
                  .toLowerCase()
                  .includes(q)
            )
          : options;

      const hasExact =
        !!raw &&
        options.some(option =>
          option.value === raw ||
          option.textContent
            .trim()
            .toLowerCase() ===
            q
        );

      const optionHTML =
        filtered
          .map(option => {
            const isEmpty =
              option.value === '';

            const selected =
              option.selected;

            const disabled =
              option.disabled;

            const note =
              option.dataset.ssNote ||
              '';

            const classes = [
              'ui-select-option',
              selected
                ? 'selected'
                : '',
              disabled
                ? 'disabled'
                : '',
              isEmpty
                ? 'none'
                : ''
            ]
              .filter(Boolean)
              .join(' ');

            const check =
              isMultiple &&
              !isEmpty
                ? '<span class="check">' +
                  (
                    selected
                      ? iconSvg(
                          'check-lg'
                        )
                      : ''
                  ) +
                  '</span>'
                : '';

            return (
              '<div class="' +
              classes +
              '" data-value="' +
              esc(option.value) +
              '"' +
              (
                disabled
                  ? ' aria-disabled="true"'
                  : ''
              ) +
              '>' +
              check +
              '<span>' +
              esc(
                option.textContent
              ) +
              '</span>' +
              (
                note
                  ? '<span class="ui-select-option-note">' +
                    esc(note) +
                    '</span>'
                  : ''
              ) +
              '</div>'
            );
          })
          .join('');

      const createHTML =
        isCreatable &&
        raw &&
        !hasExact
          ? (
              '<div class="ui-select-option" data-create-value="' +
              esc(raw) +
              '"><span>' +
              esc(
                relationshipCreateOptionText(
                  raw
                )
              ) +
              '</span></div>'
            )
          : '';

      if (
        !optionHTML &&
        !createHTML
      ) {
        optionsEl.innerHTML =
          '<div class="ui-select-empty">' +
          esc(
            uiText(
              '沒有符合的項目'
            )
          ) +
          '</div>';

        return;
      }

      optionsEl.innerHTML =
        optionHTML +
        createHTML;

      optionsEl.querySelectorAll(
        '.ui-select-option[data-value]'
      ).forEach(element => {
        element.onclick =
          event => {
            event.stopPropagation();

            const value =
              element.dataset.value;

            const option =
              [...select.options]
                .find(candidate =>
                  candidate.value ===
                  value
                );

            if (
              !option ||
              option.disabled
            ) {
              return;
            }

            if (isMultiple) {
              option.selected =
                !option.selected;

              renderInput();
              renderOptions(
                searchEl.value
              );

              select.dispatchEvent(
                new Event(
                  'change',
                  { bubbles:true }
                )
              );
            } else {
              selectSingleOption(
                option
              );
            }
          };
      });

      optionsEl.querySelectorAll(
        '[data-create-value]'
      ).forEach(element => {
        element.onclick =
          event => {
            event.stopPropagation();

            commitCreatableValue(
              element.dataset
                .createValue
            );
          };
      });
    }

    function openDropdown() {
      document.querySelectorAll(
        '.ui-select-wrap.ui-select-open'
      ).forEach(other => {
        if (
          other !== wrap &&
          other._closeDropdown
        ) {
          other._closeDropdown();
        }
      });

      dropdown.style.display = '';
      wrap.classList.add(
        'ui-select-open'
      );

      searchEl.value = '';
      renderOptions();

      if (usePortalDropdown) {
        requestAnimationFrame(
          () => {
            positionPortalDropdown();

            requestAnimationFrame(
              positionPortalDropdown
            );
          }
        );
      }

      setTimeout(
        () => searchEl.focus(),
        30
      );
    }

    function closeDropdown() {
      dropdown.style.display =
        'none';

      wrap.classList.remove(
        'ui-select-open'
      );

      restoreDropdownHome();
    }

    input.onclick = event => {
      if (
        event.target.closest(
          '.ui-select-tag-x'
        )
      ) {
        return;
      }

      if (
        wrap.classList.contains(
          'ui-select-open'
        )
      ) {
        closeDropdown();
      } else {
        openDropdown();
      }
    };

    searchEl.oninput =
      () => {
        renderOptions(
          searchEl.value
        );
      };

    searchEl.onkeydown =
      event => {
        if (
          event.key === 'Escape'
        ) {
          closeDropdown();
          input.focus();
          return;
        }

        if (
          event.key === 'Enter'
        ) {
          event.preventDefault();

          if (
            isCreatable &&
            searchEl.value.trim()
          ) {
            commitCreatableValue(
              searchEl.value
            );
          }
        }
      };

    document.addEventListener(
      'click',
      event => {
        if (
          !wrap.contains(
            event.target
          ) &&
          !dropdown.contains(
            event.target
          )
        ) {
          closeDropdown();
        }
      }
    );

    if (usePortalDropdown) {
      window.addEventListener(
        'resize',
        debounce(
          positionPortalDropdown,
          50
        )
      );

      document.addEventListener(
        'scroll',
        () => {
          if (
            wrap.classList.contains(
              'ui-select-open'
            )
          ) {
            positionPortalDropdown();
          }
        },
        true
      );
    }

    wrap._closeDropdown =
      closeDropdown;

    wrap._refresh =
      () => {
        renderInput();

        if (
          wrap.classList.contains(
            'ui-select-open'
          )
        ) {
          renderOptions(
            searchEl.value
          );

          if (
            usePortalDropdown
          ) {
            requestAnimationFrame(
              positionPortalDropdown
            );
          }
        }
      };

    wrap._pendingValue =
      () =>
        normalizeRelationshipTypeText(
          searchEl.value
        );

    wrap._commitCreatableValue =
      commitCreatableValue;

    renderInput();
  });
}

function getEditingAvatarCropSource(target){
  return target==='pet'
    ? {ref:petEditorState.avatar,frame:petEditorState.avatarFrame}
    : {ref:simEditorState.avatar,frame:simEditorState.avatarFrame};
}

function setEditingAvatarCropFrame(target,frame){
  const normalized=normalizeAvatarFrame(frame);

  if(target==='pet'){
    petEditorState.avatarFrame=normalized;
    petEditorController.refreshAvatarPreview();
  }else{
    simEditorState.avatarFrame=normalized;
    updateAvatarPreview();
    renderEditorInfoPreviewIfActive();
  }
}

function avatarCropBounds(){
  const workspace=$('avatarCropWorkspace');
  const windowEl=$('avatarCropWindow');

  if(
    !workspace||
    !windowEl||
    !avatarCropNaturalSize.width||
    !avatarCropNaturalSize.height
  ){
    return null;
  }

  const workspaceRect=workspace.getBoundingClientRect();
  const cropRect=windowEl.getBoundingClientRect();

  if(
    !workspaceRect.width||
    !workspaceRect.height||
    !cropRect.width||
    !cropRect.height
  ){
    return null;
  }

  const cropWidth=cropRect.width;
  const cropHeight=cropRect.height;
  const baseScale=Math.max(
    cropWidth/avatarCropNaturalSize.width,
    cropHeight/avatarCropNaturalSize.height
  );
  const zoom=Math.max(1,Number(avatarCropDraft.zoom)||1);
  const scale=baseScale*zoom;
  const imageWidth=avatarCropNaturalSize.width*scale;
  const imageHeight=avatarCropNaturalSize.height*scale;

  const minX=Math.min(.5,cropWidth/(2*imageWidth));
  const maxX=Math.max(.5,1-minX);
  const minY=Math.min(.5,cropHeight/(2*imageHeight));
  const maxY=Math.max(.5,1-minY);

  const cropCenterX=
    cropRect.left-workspaceRect.left+
    cropRect.width/2;
  const cropCenterY=
    cropRect.top-workspaceRect.top+
    cropRect.height/2;

  return{
    workspaceRect,
    cropRect,
    cropCenterX,
    cropCenterY,
    imageWidth,
    imageHeight,
    minX,
    maxX,
    minY,
    maxY
  };
}

function clampAvatarCropDraft(){
  const bounds=avatarCropBounds();
  if(!bounds)return avatarCropDraft;

  avatarCropDraft=normalizeAvatarFrame({
    ...avatarCropDraft,
    x:Math.min(
      bounds.maxX,
      Math.max(bounds.minX,avatarCropDraft.x)
    ),
    y:Math.min(
      bounds.maxY,
      Math.max(bounds.minY,avatarCropDraft.y)
    )
  });

  return avatarCropDraft;
}

function renderAvatarCropPreview(){
  const image=$('avatarCropImage');
  const zoom=$('avatarCropZoom');
  const output=$('avatarCropZoomValue');

  if(!image)return;

  if(avatarCropUrl&&image.src!==avatarCropUrl){
    image.src=avatarCropUrl;
  }

  if(
    !avatarCropNaturalSize.width||
    !avatarCropNaturalSize.height
  ){
    return;
  }

  clampAvatarCropDraft();
  const bounds=avatarCropBounds();
  if(!bounds)return;

  avatarCropRenderMetrics=bounds;

  image.style.width=`${bounds.imageWidth}px`;
  image.style.height=`${bounds.imageHeight}px`;
  image.style.left=`${
    bounds.cropCenterX-
    avatarCropDraft.x*bounds.imageWidth
  }px`;
  image.style.top=`${
    bounds.cropCenterY-
    avatarCropDraft.y*bounds.imageHeight
  }px`;

  if(zoom)zoom.value=String(avatarCropDraft.zoom);
  if(output){
    output.textContent=
      `${Math.round(avatarCropDraft.zoom*100)}%`;
  }
}

async function loadAvatarCropImage(url){
  const image=$('avatarCropImage');
  if(!image)return false;

  if(image.src!==url){
    image.src=url;
  }

  try{
    if(
      !image.complete||
      !image.naturalWidth
    ){
      await new Promise((resolve,reject)=>{
        const onLoad=()=>{
          cleanup();
          resolve();
        };
        const onError=()=>{
          cleanup();
          reject(new Error('avatar image load failed'));
        };
        const cleanup=()=>{
          image.removeEventListener('load',onLoad);
          image.removeEventListener('error',onError);
        };

        image.addEventListener('load',onLoad,{once:true});
        image.addEventListener('error',onError,{once:true});
      });
    }
  }catch(_){
    return false;
  }

  avatarCropNaturalSize={
    width:image.naturalWidth||0,
    height:image.naturalHeight||0
  };

  return !!(
    avatarCropNaturalSize.width&&
    avatarCropNaturalSize.height
  );
}

async function openAvatarCropEditor(target){
  const source=getEditingAvatarCropSource(target);
  if(!source.ref)return;

  let url=resolveImageUrl(source.ref);

  if(!url){
    try{
      url=await assetStore.getUrl(source.ref);
    }catch(_){
      url='';
    }
  }

  if(!url){
    uiAlert(
      '頭像載入失敗，請重新選擇圖片。',
      {title:'圖片處理失敗',kind:'danger'}
    );
    return;
  }

  avatarCropTarget=target==='pet'?'pet':'sim';
  avatarCropDraft=normalizeAvatarFrame(source.frame);
  avatarCropUrl=url;
  avatarCropPointer=null;
  avatarCropRenderMetrics=null;
  avatarCropNaturalSize={width:0,height:0};

  avatarCropDialog.classList.add('show');

  const loaded=await loadAvatarCropImage(url);

  if(!loaded){
    closeAvatarCropEditor();
    uiAlert(
      '頭像載入失敗，請重新選擇圖片。',
      {title:'圖片處理失敗',kind:'danger'}
    );
    return;
  }

  await new Promise(resolve=>requestAnimationFrame(resolve));
  renderAvatarCropPreview();
}

function closeAvatarCropEditor(){
  avatarCropDialog.classList.remove('show');
  avatarCropTarget=null;
  avatarCropDraft={...DEFAULT_AVATAR_FRAME};
  avatarCropUrl='';
  avatarCropPointer=null;
  avatarCropNaturalSize={width:0,height:0};
  avatarCropRenderMetrics=null;
  $('avatarCropWorkspace')?.classList.remove('dragging');
}

function resetAvatarCropEditor(){
  avatarCropDraft={...DEFAULT_AVATAR_FRAME};
  renderAvatarCropPreview();
}

function commitAvatarCropEditor(){
  if(avatarCropTarget){
    clampAvatarCropDraft();
    setEditingAvatarCropFrame(
      avatarCropTarget,
      avatarCropDraft
    );
  }

  closeAvatarCropEditor();
}

const avatarCropWorkspace=$('avatarCropWorkspace');

avatarCropWorkspace?.addEventListener(
  'pointerdown',
  event=>{
    if(!avatarCropTarget)return;

    event.preventDefault();
    avatarCropWorkspace.setPointerCapture?.(
      event.pointerId
    );

    renderAvatarCropPreview();

    avatarCropWorkspace.classList.add('dragging');

    avatarCropPointer={
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      frame:normalizeAvatarFrame(avatarCropDraft),
      imageWidth:
        avatarCropRenderMetrics?.imageWidth||1,
      imageHeight:
        avatarCropRenderMetrics?.imageHeight||1
    };
  }
);

avatarCropWorkspace?.addEventListener(
  'pointermove',
  event=>{
    if(
      !avatarCropPointer||
      avatarCropPointer.pointerId!==event.pointerId
    ){
      return;
    }

    const dx=
      event.clientX-avatarCropPointer.startX;
    const dy=
      event.clientY-avatarCropPointer.startY;

    avatarCropDraft=normalizeAvatarFrame({
      ...avatarCropDraft,
      x:
        avatarCropPointer.frame.x-
        dx/avatarCropPointer.imageWidth,
      y:
        avatarCropPointer.frame.y-
        dy/avatarCropPointer.imageHeight
    });

    renderAvatarCropPreview();
  }
);

const finishAvatarCropPointer=event=>{
  if(
    !avatarCropPointer||
    avatarCropPointer.pointerId!==event.pointerId
  ){
    return;
  }

  avatarCropPointer=null;
  avatarCropWorkspace?.classList.remove('dragging');
};

avatarCropWorkspace?.addEventListener(
  'pointerup',
  finishAvatarCropPointer
);
avatarCropWorkspace?.addEventListener(
  'pointercancel',
  finishAvatarCropPointer
);

avatarCropWorkspace?.addEventListener(
  'wheel',
  event=>{
    if(!avatarCropTarget)return;

    event.preventDefault();

    const direction=
      event.deltaY<0
        ? 1
        : -1;

    const step=
      event.ctrlKey
        ? .03
        : .08;

    avatarCropDraft=normalizeAvatarFrame({
      ...avatarCropDraft,
      zoom:
        avatarCropDraft.zoom+
        direction*step
    });

    renderAvatarCropPreview();
  },
  {passive:false}
);

$('avatarCropZoom')?.addEventListener(
  'input',
  event=>{
    avatarCropDraft=normalizeAvatarFrame({
      ...avatarCropDraft,
      zoom:Number(event.target.value)
    });

    renderAvatarCropPreview();
  }
);

$('avatarCropReset')?.addEventListener(
  'click',
  resetAvatarCropEditor
);
$('avatarCropCancel')?.addEventListener(
  'click',
  closeAvatarCropEditor
);
$('avatarCropDone')?.addEventListener(
  'click',
  commitAvatarCropEditor
);

avatarCropDialog?.addEventListener(
  'click',
  event=>{
    if(event.target===avatarCropDialog){
      closeAvatarCropEditor();
    }
  }
);

window.addEventListener(
  'resize',
  debounce(()=>{
    if(
      avatarCropDialog?.classList.contains('show')
    ){
      renderAvatarCropPreview();
    }
  },80)
);

function buildRelationEntries(simId) {
  const entries = [];
  const seen = new Set();
  const c = genealogyData.sims[simId];
  if (!c) return entries;

  const push = (
    entry,
    group = 'family'
  ) => {
    entry.group = group;
    entries.push(entry);
    seen.add(entry.key);
  };

  const parentRelations =
    genealogyParentRelations(c);

  if (parentRelations.length) {
    const names =
      parentRelations
        .map(relation => {
          const sim =
            genealogyData.sims[
              relation.parentId
            ];

          return sim
            ? displayDataText(
                sim.name,
                sim
              )
            : '';
        })
        .filter(Boolean)
        .join(' + ');

    if (names) {
      const hasAdoptive =
        parentRelations.some(
          relation =>
            relation.kind === 'adoptive'
        );

      const hasBiological =
        parentRelations.some(
          relation =>
            relation.kind !== 'adoptive'
        );

      push({
        key:'parent:' + simId,
        label:
          uiText('父母') +
          '：' +
          names,
        semanticType:
          hasAdoptive &&
          !hasBiological
            ? 'adoptive'
            : 'parent-child',
        defaultText:
          hasAdoptive &&
          hasBiological
            ? '親子 / 收養'
            : null
      });
    }
  }

  getChildrenOf(simId)
    .forEach(child => {
      const key =
        'parent:' + child.id;

      if (seen.has(key)) return;

      const semanticType =
        genealogyParentKindFor(
          child,
          simId
        );

      push({
        key,
        label:
          uiText('子女') +
          '：' +
          displayDataText(
            child.name,
            child
          ),
        semanticType,
        defaultText:null
      });
    });

  (c.spouseIds || [])
    .forEach(sid => {
      const spouse =
        genealogyData.sims[sid];

      if (!spouse) return;

      const key =
        'spouse:' +
        pairKey(simId, sid);

      if (seen.has(key)) return;

      push({
        key,
        label:
          uiText('配偶') +
          '：' +
          displayDataText(
            spouse.name,
            spouse
          ),
        semanticType:'spouse',
        defaultText:null
      });
    });

  (c.exSpouseIds || [])
    .forEach(sid => {
      const spouse =
        genealogyData.sims[sid];

      if (!spouse) return;

      const key =
        'exspouse:' +
        pairKey(simId, sid);

      if (seen.has(key)) return;

      push({
        key,
        label:
          uiText('前任配偶') +
          '：' +
          displayDataText(
            spouse.name,
            spouse
          ),
        semanticType:'exspouse',
        defaultText:null
      });
    });

  (genealogyData.links || [])
    .forEach(link => {
      if (
        link.from !== simId &&
        link.to !== simId
      ) {
        return;
      }

      const otherId =
        link.from === simId
          ? link.to
          : link.from;

      const other =
        genealogyData.sims[
          otherId
        ];

      if (!other) return;

      if (!link.id) {
        link.id = uid('lnk');
      }

      const key =
        'link:' + link.id;

      if (seen.has(key)) return;

      const sibling =
        isSiblingLink(link);

      const rawTag =
        sibling
          ? SIBLING_RELATION_LABEL
          : String(
              link.label ||
              link.type ||
              '關聯'
            ).trim() ||
            '關聯';

      const tag =
        displayRelationshipText(
          rawTag
        );

      push({
        key,
        label:
          tag +
          '：' +
          displayDataText(
            other.name,
            other
          ),
        semanticType:
          sibling
            ? 'sibling'
            : 'social',
        defaultText:
          sibling
            ? null
            : rawTag
      }, sibling ? 'family' : 'other');
    });

  return entries;
}
function renderRelAnnoList(
  simId,
  sectionId,
  listId,
  entries
) {
  const section =
    $(sectionId);

  const list =
    $(listId);

  if (!section || !list) return;

  if (!simId) {
    section.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  section.style.display = '';

  if (!entries.length) {
    list.innerHTML =
      '<div class="relationship-empty">' +
      esc(uiText('尚無關係連線')) +
      '</div>';

    return;
  }

  list.innerHTML =
    entries.map(entry => {
      const saved =
        relationshipDisplayOverride(
          entry.key
        );

      const hidden =
        saved.hidden === true;

      const curText =
        typeof saved.text === 'string'
          ? saved.text
          : '';

      const descriptor =
        relationshipSemanticDescriptor(
          entry.semanticType,
          entry.defaultText
        );

      const defaultLabel =
        displayRelationshipText(
          entry.defaultText ||
          descriptor.label
        );

      const hasOffset =
        !!(
          genealogyData.labelPositions &&
          genealogyData.labelPositions[
            entry.key
          ] &&
          (
            genealogyData.labelPositions[
              entry.key
            ].dx ||
            genealogyData.labelPositions[
              entry.key
            ].dy
          )
        );

      return (
        '<div class="relationship-annotation-item" ' +
        'data-anno-key="' +
        esc(entry.key) +
        '">' +
          '<div class="relationship-annotation-name" title="' +
          esc(entry.label) +
          '">' +
          esc(entry.label) +
          '</div>' +
          '<select data-rel-display-mode>' +
            '<option value="default">' +
              esc(
                uiText('預設') +
                ' · ' +
                defaultLabel
              ) +
            '</option>' +
            '<option value="none">' +
              esc(uiText('（不顯示）')) +
            '</option>' +
          '</select>' +
          '<input type="text" ' +
          'placeholder="' +
          esc(uiText('自訂文字（可選）')) +
          '" value="' +
          esc(curText) +
          '">' +
          (
            hasOffset
              ? '<button type="button" class="relationship-annotation-reset" data-reset-key="' +
                esc(entry.key) +
                '" title="' +
                esc(uiText('重設關係位置')) +
                '">' +
                esc(uiText('重設')) +
                '</button>'
              : '<span></span>'
          ) +
        '</div>'
      );
    }).join('');

  list.querySelectorAll(
    '.relationship-annotation-item'
  ).forEach(item => {
    const key =
      item.dataset.annoKey;

    const saved =
      relationshipDisplayOverride(key);

    const select =
      item.querySelector(
        '[data-rel-display-mode]'
      );

    if (select) {
      select.value =
        saved.hidden === true
          ? 'none'
          : 'default';
    }
  });

  list.querySelectorAll(
    '[data-reset-key]'
  ).forEach(btn => {
    btn.onclick = () => {
      const key =
        btn.dataset.resetKey;

      const mutation =
        genealogyStore.setRelationshipLabelPosition(
          key,
          null
        );

      if (!mutation.dataChanged) return;

      applyGenealogyMutation(mutation);
      renderRelAnno(simId);
    };
  });
}
function renderRelAnno(simId) {
  if(!simId){renderRelAnnoList(null,'familyRelationshipAnnotationSection','familyRelationshipAnnotationList',[]);renderRelAnnoList(null,'relationshipAnnotationSection','relationshipAnnotationList',[]);return;}
  const entries=buildRelationEntries(simId);
  renderRelAnnoList(simId,'familyRelationshipAnnotationSection','familyRelationshipAnnotationList',entries.filter(e=>e.group==='family'));
  renderRelAnnoList(simId,'relationshipAnnotationSection','relationshipAnnotationList',entries.filter(e=>e.group==='other'));
}

const petEditorController = {
  owner() {
    return simEditorState.simId
      ? genealogyData.sims[simEditorState.simId]
      : null;
  },

  currentPet() {
    return (
      petEditorState.index >= 0 &&
      editingPets[petEditorState.index]
    )
      ? editingPets[petEditorState.index]
      : null;
  },

  createBlankPet() {
    return {
      id:uid('pet'),
      name:'',
      species:'dog',
      breed:'',
      gender:'male',
      ageStage:'成年',
      status:'在世',
      avatar:null,
      avatarFrame:{ ...DEFAULT_AVATAR_FRAME }
    };
  },

  refreshAvatarPreview() {
    const preview = $('petAvatarPreview');
    const avatar =
      framedAvatarImageHTML(
        petEditorState.avatar,
        petEditorState.avatarFrame
      );

    if (avatar) {
      preview.innerHTML = avatar;
    } else {
      const name = $('pName').value.trim();
      const species =
        PET_SPECIES[$('pSpecies').value] ||
        PET_SPECIES.other;

      preview.innerHTML =
        name
          ? esc(name.charAt(0))
          : iconSvg(species.icon);
    }

    const adjust = $('petAvatarAdjustBtn');
    if (adjust) {
      adjust.disabled = !petEditorState.avatar;
    }
  },

  syncGenderVisibility() {
    const field = $('pGenderField');
    const select = $('pGender');
    const species = $('pSpecies').value;
    const visible = isEaCasPetSpecies(species);

    if (field) {
      field.hidden = !visible;
    }

    if (!select) return;

    select.value =
      visible
        ? (normalizePetGender(select.value) || 'male')
        : '';
  },

  populateForm(pet) {
    const owner = this.owner();

    $('pName').value =
      owner
        ? displayDataText(pet.name, owner)
        : (pet.name || '');

    $('pSpecies').value =
      pet.species || 'dog';

    $('pBreed').value =
      owner
        ? displayDataText(pet.breed, owner)
        : (pet.breed || '');

    $('pGender').value =
      normalizePetGender(pet.gender) ||
      'male';

    $('pAgeStage').value =
      pet.ageStage || '成年';

    $('pStatus').value =
      pet.status || '在世';

    petEditorState.avatar =
      pet.avatar || null;

    petEditorState.avatarFrame =
      normalizeAvatarFrame(
        pet.avatarFrame
      );

    this.syncGenderVisibility();
    this.refreshAvatarPreview();
  },

  open(index = -1) {
    const validIndex =
      Number.isInteger(index) &&
      index >= 0 &&
      !!editingPets[index];

    petEditorState.index =
      validIndex ? index : -1;

    const pet =
      validIndex
        ? editingPets[index]
        : this.createBlankPet();

    $('petModalTitle').textContent =
      uiText(
        validIndex
          ? '編輯寵物'
          : '新增寵物'
      );

    $('pDelete').style.display =
      validIndex ? '' : 'none';

    this.populateForm(pet);
    petEditorDialog.classList.add('show');

    setTimeout(
      () => $('pName').focus(),
      60
    );
  },

  close() {
    petEditorDialog.classList.remove('show');

    if (avatarCropTarget === 'pet') {
      closeAvatarCropEditor();
    }

    petEditorState.index = -1;
    petEditorState.avatar = null;
    petEditorState.avatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };
  },

  collectForm() {
    const owner = this.owner();
    const previous = this.currentPet();
    const inputName = $('pName').value.trim();

    if (!inputName) {
      uiAlert(
        '請填寫寵物名字',
        { title:'資料未完成' }
      );
      return null;
    }

    const shownName =
      previous && owner
        ? displayDataText(
            previous.name,
            owner
          )
        : '';

    const shownBreed =
      previous && owner
        ? displayDataText(
            previous.breed,
            owner
          )
        : '';

    const inputBreed =
      $('pBreed').value.trim();

    const name =
      previous &&
      isBuiltinSampleSim(owner) &&
      inputName === shownName
        ? previous.name
        : inputName;

    const breed =
      previous &&
      isBuiltinSampleSim(owner) &&
      inputBreed === shownBreed
        ? previous.breed
        : inputBreed;

    const species =
      $('pSpecies').value;

    return {
      ...(previous
        ? JSON.parse(JSON.stringify(previous))
        : {}),
      id:
        previous?.id ||
        uid('pet'),
      name,
      species,
      breed,
      gender:
        isEaCasPetSpecies(species)
          ? (
              normalizePetGender(
                $('pGender').value
              ) ||
              'male'
            )
          : '',
      ageStage:
        $('pAgeStage').value,
      status:
        $('pStatus').value,
      avatar:
        petEditorState.avatar ||
        null,
      avatarFrame:
        normalizeAvatarFrame(
          petEditorState.avatarFrame
        )
    };
  },

  commit() {
    const pet = this.collectForm();
    if (!pet) return;

    if (petEditorState.index >= 0) {
      editingPets[
        petEditorState.index
      ] = pet;
    } else {
      editingPets.push(pet);
    }

    renderPetDraftList();
    renderEditorInfoPreviewIfActive();
    this.close();
  },

  async removeCurrent() {
    const pet = this.currentPet();
    if (!pet) return;

    const confirmed = await uiConfirm(
      `確定刪除寵物「${pet.name}」嗎？`,
      {
        title:'刪除寵物',
        kind:'danger',
        confirmText:'刪除'
      }
    );

    if (!confirmed) return;

    editingPets.splice(
      petEditorState.index,
      1
    );

    renderPetDraftList();
    renderEditorInfoPreviewIfActive();
    this.close();
  },

  async setAvatarFile(file) {
    const result =
      await compressImage(
        file,
        'pet'
      );

    petEditorState.avatar =
      await saveImageAsset(
        result.blob,
        {
          width:result.width,
          height:result.height
        }
      );

    petEditorState.avatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };

    this.refreshAvatarPreview();
  },

  clearAvatar() {
    petEditorState.avatar = null;
    petEditorState.avatarFrame = {
      ...DEFAULT_AVATAR_FRAME
    };
    this.refreshAvatarPreview();
  }
};

function renderPetDraftList() {
  const list = $('petList');
  if (!list) return;

  if (!editingPets.length) {
    list.innerHTML =
      `<div class="relationship-empty">${esc(uiText('尚未新增寵物'))}</div>`;
    renderEditorInfoPreviewIfActive();
    return;
  }

  const owner = petEditorController.owner();

  list.innerHTML =
    editingPets.map((pet, index) => {
      const avatar =
        framedAvatarImageHTML(
          pet.avatar,
          pet.avatarFrame
        ) ||
        petIconFor(pet);

      const meta = [
        formatPetSpecies(pet)
      ];

      if (pet.breed) {
        meta.push(
          owner
            ? displayDataText(
                pet.breed,
                owner
              )
            : pet.breed
        );
      }

      const gender =
        petGenderLabel(pet);

      if (gender) meta.push(gender);
      if (pet.ageStage) {
        meta.push(
          uiText(pet.ageStage)
        );
      }

      if (
        pet.status &&
        pet.status !== '在世'
      ) {
        meta.push(
          uiText(pet.status)
        );
      }

      const displayName =
        owner
          ? displayDataText(
              pet.name,
              owner
            )
          : pet.name;

      return `
        <div class="pet-item" data-pet-draft-index="${index}">
          <div class="pet-item-avatar">${avatar}</div>
          <div class="pet-item-info">
            <div class="pet-item-name">${esc(displayName) || esc(uiText('（未命名）'))}</div>
            <div class="pet-item-meta">${esc(meta.join(' · '))}</div>
            ${petLineageHTML(pet)}
          </div>
          <div class="pet-item-actions">
            <button
              type="button"
              data-pet-action="edit"
              data-pet-index="${index}"
            >編輯</button>
            <button
              type="button"
              class="danger"
              data-pet-action="delete"
              data-pet-index="${index}"
            >刪除</button>
          </div>
        </div>
      `;
    }).join('');

  list
    .querySelectorAll('[data-pet-action="edit"]')
    .forEach(button => {
      button.addEventListener('click', () => {
        petEditorController.open(
          Number(button.dataset.petIndex)
        );
      });
    });

  list
    .querySelectorAll('[data-pet-action="delete"]')
    .forEach(button => {
      button.addEventListener(
        'click',
        async () => {
          const index =
            Number(button.dataset.petIndex);
          const pet = editingPets[index];

          if (!pet) return;

          const confirmed =
            await uiConfirm(
              `確定刪除寵物「${pet.name}」嗎？`,
              {
                title:'刪除寵物',
                kind:'danger',
                confirmText:'刪除'
              }
            );

          if (!confirmed) return;

          editingPets.splice(index, 1);
          renderPetDraftList();
          renderEditorInfoPreviewIfActive();
        }
      );
    });

  renderEditorInfoPreviewIfActive();
}

$('petAvatarInput').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await petEditorController.setAvatarFile(file);
  } catch (error) {
    uiAlert(
      '圖片處理失敗：' + error.message,
      {
        title:'圖片處理失敗',
        kind:'danger'
      }
    );
  } finally {
    event.target.value = '';
  }
};

$('petAvatarAdjustBtn').onclick = () => {
  openAvatarCropEditor('pet');
};

$('petAvatarClearBtn').onclick = () => {
  petEditorController.clearAvatar();
};

$('pName').addEventListener('input', () => {
  petEditorController.refreshAvatarPreview();
});

$('pSpecies').addEventListener('change', () => {
  petEditorController.syncGenderVisibility();
  petEditorController.refreshAvatarPreview();
});

$('pSave').onclick = () => {
  petEditorController.commit();
};

$('pCancel').onclick = () => {
  petEditorController.close();
};

$('pDelete').onclick = () => {
  petEditorController.removeCurrent();
};

petEditorDialog.onclick = event => {
  if (event.target === petEditorDialog) {
    petEditorController.close();
  }
};

$('btnAddPet').onclick = () => {
  petEditorController.open();
};

function updateAvatarPreview(){
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
      updateAvatarPreview();
      renderEditorInfoPreviewIfActive();
    }catch(error){
      uiAlert('圖片處理失敗：'+error.message,{
        title:'圖片處理失敗',
        kind:'danger'
      });
    }
    event.target.value='';
  };

  $('avatarAdjustBtn').onclick=()=>openAvatarCropEditor('sim');

  $('avatarClearBtn').onclick=()=>{
    simEditorState.avatar=null;
    simEditorState.avatarFrame={...DEFAULT_AVATAR_FRAME};
    updateAvatarPreview();
    renderEditorInfoPreviewIfActive();
  };

  $('fName').addEventListener('input',()=>{
    if(!simEditorState.avatar)updateAvatarPreview();
    renderEditorInfoPreviewIfActive();
  });

function updateCauseOfDeathVisibility() {
  const st = $('fStatus').value;
  const label = $('causeOfDeathLabel');
  if (st === '已故' || st === '幽靈') label.style.display = '';
  else label.style.display = 'none';
}
$('fStatus').addEventListener('change', updateCauseOfDeathVisibility);

// ========【個人檔案編輯器】 設定 - 分頁、生日年齡摘要與特徵標籤 ========
function getBirthdayDayLimit(monthValue) {
  const month = Number(monthValue) || 0;
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 31;
}

function populateBirthdayDays(preferredValue = null) {
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

function formatBirthdaySummary(monthValue, dayValue, yearValue = null) {
  const month = Number(monthValue) || 0;
  const day = Number(dayValue) || 0;
  const year = yearValue === null || yearValue === '' || !Number.isFinite(Number(yearValue))
    ? null
    : Math.trunc(Number(yearValue));
  if (!month || !day) return uiText('生日未知');

  const lang = document.documentElement.lang || 'zh-Hant';
  if (lang === 'en') {
    try {
      const options = year === null
        ? { month: 'short', day: 'numeric', timeZone: 'UTC' }
        : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
      return new Intl.DateTimeFormat('en', options)
        .format(new Date(Date.UTC(year === null ? 2000 : year, month - 1, day)));
    } catch (_) {}
  }

  return year === null
    ? `${month} ${uiText('月')} ${day} ${uiText('日')}`
    : `${year} ${uiText('年')} ${month} ${uiText('月')} ${day} ${uiText('日')}`;
}

function formatGameDate(value) {
  if (!value || typeof value !== 'object') return '';

  const year = Number(value.year);
  const month = Number(value.month);
  const day = Number(value.day);
  if (![year, month, day].every(Number.isFinite)) return '';

  const normalizedYear = Math.trunc(year);
  const normalizedMonth = Math.trunc(month);
  const normalizedDay = Math.trunc(day);
  const lang = document.documentElement.lang || 'zh-Hant';

  if (lang === 'en') {
    try {
      return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(Date.UTC(normalizedYear, normalizedMonth - 1, normalizedDay)));
    } catch (_) {}
  }

  return `${normalizedYear} ${uiText('年')} ${normalizedMonth} ${uiText('月')} ${normalizedDay} ${uiText('日')}`;
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

function editorDraftSim(){
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
        genealogyData?.sims?.[id]
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

          option.dataset.ssNote=
            uiText(
              '由父母關係自動推導'
            );
        }else{
          delete option.dataset
            .relationshipSource;

          delete option.dataset
            .ssNote;
        }
      });

    refreshSS('fSiblings');
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

    const draft=editorDraftSim();

    target.innerHTML=unique.map(id=>{
      const sim=genealogyData.sims[id];
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
    const draft=editorDraftSim();

    list.innerHTML=selectedEditorIds(selectId).map(id=>{
      const sim=genealogyData.sims[id];
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
        renderEditorFamilyPreviews();
        renderEditorInfoPreviewIfActive();
      };
    });
  }

  function renderEditorFamilyPreviews(){
    const familyTarget=$('editorFamilyMembershipPreview');

    if(familyTarget){
      const names=selectedEditorIds('fFamilyIds')
        .map(id=>genealogyData.families.find(family=>String(family.id)===id))
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
        editorDraftSim(),
        simEditorState.parentKinds.get(String(sim.id))||'parent-child'
      )
    );

    renderEditorRelationPeople(
      'editorSpousePreview',
      selectedEditorIds('fSpouse'),
      sim=>directFamilyKinshipLabel('spouse',sim,editorDraftSim())
    );

    renderEditorRelationPeople(
      'editorExSpousePreview',
      selectedEditorIds('fExSpouse'),
      sim=>directFamilyKinshipLabel('exspouse',sim,editorDraftSim())
    );

    renderEditorRelationPeople(
      'editorChildrenPreview',
      selectedEditorIds('fChildren'),
      sim=>directFamilyKinshipLabel(
        'child',
        sim,
        editorDraftSim(),
        simEditorState.childKinds.get(String(sim.id))||'parent-child'
      )
    );

    renderEditorRelationPeople(
      'editorSiblingsPreview',
      editorSiblingIds(),
      sim=>directFamilyKinshipLabel('sibling',sim,editorDraftSim())
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
      const sim=genealogyData.sims[id];
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
      const sim=genealogyData.sims[id];
      add(directFamilyKinshipLabel('spouse',sim,draft),sim);
    });

    selectedEditorIds('fExSpouse').forEach(id=>{
      const sim=genealogyData.sims[id];
      add(directFamilyKinshipLabel('exspouse',sim,draft),sim);
    });

    selectedEditorIds('fChildren').forEach(id=>{
      const sim=genealogyData.sims[id];
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
      const sim=genealogyData.sims[id];
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

    const draft=editorDraftSim();

    const familyNames=selectedEditorIds('fFamilyIds')
      .map(id=>genealogyData.families.find(family=>String(family.id)===id))
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

  function renderEditorInfoPreviewIfActive(){
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

  function setupSimEditorInteractions(){
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
      populateBirthdayDays($('fBirthdayDay')?.value||'');
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

        renderEditorFamilyPreviews();
        renderEditorInfoPreviewIfActive();
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
      renderEditorInfoPreviewIfActive();
    });

    editorModal?.addEventListener('change',()=>{
      renderEditorInfoPreviewIfActive();
    });
  }

  setupSimEditorInteractions();

  function openEditor(id){
    resetSimEditorDraftState();

    simEditorState.simId=
      id || null;

    const sim=
      id
        ? genealogyData.sims[id]
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

    populateBirthdayDays(sim&&sim.birthdayDay?sim.birthdayDay:'');

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
    updateAvatarPreview();

    editingPets=sim
      ? JSON.parse(JSON.stringify(sim.pets||[]))
      : [];
    renderPetDraftList();

    editingGallery=sim
      ? JSON.parse(JSON.stringify(sim.gallery||[]))
      : [];
    lifePhotoWorkspace.renderList();

    updateCauseOfDeathVisibility();
    switchEditorTab('basic');

    $('fFamilyIds').innerHTML=genealogyData.families
      .map(family=>`<option value="${family.id}">${esc(displayDataText(family.name,family))}</option>`)
      .join('');

    const currentFamilies=new Set();

    if(sim){
      genealogyData.families.forEach(family=>{
        if(family.memberIds.includes(sim.id)){
          currentFamilies.add(String(family.id));
        }
      });
    }else if(genealogyData.currentFamilyId){
      currentFamilies.add(String(genealogyData.currentFamilyId));
    }

    [...$('fFamilyIds').options].forEach(option=>{
      option.selected=currentFamilies.has(String(option.value));
    });

    const allSims=Object.values(genealogyData.sims);

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
    renderRelList(sim);
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
    ].forEach(refreshSS);

    resetEditorFamilyPanels();
    renderEditorFamilyPreviews();

    $('btnDelete').style.display=sim?'':'none';
    $('relationshipSection').style.display=sim?'':'none';

    const newRelHint=$('newSimRelationshipsHint');
    if(newRelHint)newRelHint.hidden=!!sim;

    mask.classList.add('show');
    setTimeout(()=>$('fName').focus(),60);
  }

  function closeEditor() {
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

  resetSimEditorDraftState();

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

function renderRelList(c) {
  if (!c) { $('relationshipList').innerHTML = ''; return; }
  const rels = (genealogyData.links||[]).filter(l => (l.from === c.id || l.to === c.id) && !isSiblingLink(l));
  $('relationshipList').innerHTML = rels.length
    ? rels.map((l, i) => {
        const otherId = l.from === c.id ? l.to : l.from;
        const other = genealogyData.sims[otherId];
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
        genealogyStore.removeRelationship(
          target.id
        );

      renderRelList(c);
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

function collectSimEditorSaveRequest() {
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

  return genealogyStore
    .mergeResults(
      mutation,
      genealogyStore
        .setNodePosition(
          family.id,
          viewMode,
          sim.id,
          nextPosition
        )
    );
}

function commitSimEditorDraft() {
  const request =
    collectSimEditorSaveRequest();

  if (!request) return;

  let mutation =
    genealogyStore.saveSimDraft({
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
    genealogyData.sims[
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
      genealogyStore
        .mergeResults(
          mutation,
          genealogyStore
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

  closeEditor();
  scheduleGC();
}

function saveChar() {
  commitSimEditorDraft();
}

function purgeSimData(id) {
  const mutation =
    genealogyStore.deleteSim(id);

  selectedNodeIds.delete(id);
  removePersonFromOperationState(id);

  return mutation;
}

function finalizeSimDataChange(mutation) {
  applyGenealogyMutation(mutation);
  closeEditor();
  scheduleGC();
}

async function deleteChar(id) {
  const c = genealogyData.sims[id];
  if (!c) return;

  const message =
    '確定徹底刪除「' + displayDataText(c.name, c) + '」嗎？\n' +
    '該操作會從所有家族中移除，並從人物庫永久刪除。\n\n' +
    '（若只想從目前家族移除，請使用「移出家族」）';

  if (!await uiConfirm(message, {
    title: '永久刪除人物',
    kind: 'danger',
    confirmText: '永久刪除'
  })) return;

  const mutation = purgeSimData(id);
  finalizeSimDataChange(mutation);

  if (personLibraryDialog.classList.contains('show')) {
    renderPersonLibrary();
  }
}

// ========【人物庫】 設定 - 精簡 / 詳細檢視、單人選單與批量管理 ========
const personLibraryController = {
  syncViewControls() {
    const compact = $('personLibraryCompactBtn');
    const detailed = $('personLibraryDetailedBtn');
    const list = $('personLibraryList');

    if (compact) {
      const active = personLibraryViewMode === 'compact';
      compact.classList.toggle('active', active);
      compact.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (detailed) {
      const active = personLibraryViewMode === 'detailed';
      detailed.classList.toggle('active', active);
      detailed.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (list) {
      list.classList.toggle('compact', personLibraryViewMode === 'compact');
      list.classList.toggle('detailed', personLibraryViewMode === 'detailed');
    }
  },

  setViewMode(mode) {
    personLibraryViewMode = mode === 'compact' ? 'compact' : 'detailed';
    try {
      localStorage.setItem(PERSON_LIBRARY_VIEW_KEY, personLibraryViewMode);
    } catch (_) {}

    this.syncViewControls();
    renderPersonLibrary();
  },

  syncBatchToolbar() {
    const count = personLibraryState.selection.size;
    const toolbar = $('personLibraryBatchToolbar');
    const batchBtn = $('personLibraryBatchBtn');
    const addBtn = $('personLibraryAddBtn');
    const countEl = $('personLibraryBatchCount');

    if (toolbar) toolbar.hidden = !personLibraryState.batchMode;
    if (batchBtn) batchBtn.hidden = personLibraryState.batchMode;
    if (addBtn) addBtn.hidden = personLibraryState.batchMode;
    if (countEl) countEl.textContent = '已選 ' + count + ' 位';

    ['personLibraryBatchAddFamilyBtn','personLibraryBatchRemoveFamilyBtn','personLibraryBatchDeleteBtn']
      .forEach(id => {
        const button = $(id);
        if (button) button.disabled = count === 0;
      });
  },

  setBatchMode(enabled) {
    personLibraryState.batchMode = !!enabled;
    personLibraryState.selection.clear();
    closeAppMenus();
    this.syncBatchToolbar();
    renderPersonLibrary();
  },

  toggleSelection(id) {
    if (!personLibraryState.batchMode || !genealogyData.sims[id]) return;

    if (personLibraryState.selection.has(id)) {
      personLibraryState.selection.delete(id);
    } else {
      personLibraryState.selection.add(id);
    }

    renderPersonLibrary();
  },

  open() {
    personLibrarySearch.value = '';
    resetPersonLibraryOperations({ batch:true, add:false });
    this.syncViewControls();
    renderPersonLibrary();
    personLibraryDialog.classList.add('show');
  },

  close() {
    personLibraryDialog.classList.remove('show');
    resetPersonLibraryOperations({ batch:true, add:false });
  },

  addSelectionToCurrentFamily() {
    const family = currentFamily();
    const mutation = genealogyStore.addFamilyMembers(
      family.id,
      [...personLibraryState.selection].filter(id => genealogyData.sims[id])
    );
    applyGenealogyMutation(mutation);
    this.setBatchMode(false);
  },

  removeSelectionFromCurrentFamily() {
    const family = currentFamily();
    const mutation = genealogyStore.removeFamilyMembers(
      family.id,
      [...personLibraryState.selection]
    );
    applyGenealogyMutation(mutation);
    this.setBatchMode(false);
  },

  async deleteSelection() {
    const ids = [...personLibraryState.selection]
      .filter(id => genealogyData.sims[id]);

    if (!ids.length) return;

    const confirmed = await uiConfirm(
      '確定永久刪除這 ' + ids.length + ' 位人物嗎？\n' +
      '人物資料、關係與人生照片都會一併移除。\n\n' +
      '此操作無法復原。',
      {
        title:'批量刪除人物',
        kind:'danger',
        confirmText:'永久刪除'
      }
    );

    if (!confirmed) return;

    const mutation = genealogyStore.mergeResults(
      ...ids.map(purgeSimData)
    );

    finalizeSimDataChange(mutation);
    this.setBatchMode(false);
  }
};

function personLibraryCompactMeta(sim) {
  const parts = [displayDataText(sim.lifeStage, sim)];
  if (sim.race) {
    parts.push(displayDataText(RACE_PRESETS[sim.race]?.label || sim.race, sim));
  }
  return parts.filter(Boolean).join(' · ');
}

function renderPersonLibrary() {
  const fam = currentFamily();
  const q = personLibrarySearch.value.trim().toLowerCase();
  const all = Object.values(genealogyData.sims);

  all.sort((x, y) => String(x.name).localeCompare(String(y.name), 'zh'));

  const filtered = q ? all.filter(s =>
    (s.name || '').toLowerCase().includes(q)
    || (s.career || '').toLowerCase().includes(q)
    || (s.residence || '').toLowerCase().includes(q)
    || (s.aspiration || '').toLowerCase().includes(q)
    || (s.causeOfDeath || '').toLowerCase().includes(q)
    || (s.traits || []).some(t => (t || '').toLowerCase().includes(q))
    || (s.pets || []).some(p =>
      (p.name || '').toLowerCase().includes(q)
      || (p.breed || '').toLowerCase().includes(q)
    )
    || (s.gallery || []).some(g => (g.title || '').toLowerCase().includes(q))
  ) : all;

  $('personLibraryCount').textContent = '（' + filtered.length + '/' + all.length + '）';
  personLibraryController.syncViewControls();
  personLibraryController.syncBatchToolbar();

  const list = $('personLibraryList');
  if (!filtered.length) {
    list.innerHTML = all.length
      ? '<div class="person-library-empty">沒有符合的人物</div>'
      : '<div class="person-library-empty">還沒有任何人物</div>';
    return;
  }

  list.innerHTML = filtered.map(s => {
    const familyNames = genealogyData.families
      .filter(f => f.memberIds.includes(s.id))
      .map(f => displayDataText(f.name, f));

    const selected = personLibraryState.selection.has(s.id);
    const compactMeta = personLibraryCompactMeta(s);
    const detail = [
      displayDataText(s.lifeStage, s),
      s.race ? displayDataText(RACE_PRESETS[s.race]?.label || s.race, s) : '',
      displayDataText(s.career, s),
      displayDataText(s.residence, s),
      familyNames.join(' · ') || uiText('（未歸屬）')
    ].filter(Boolean);

    const photoCount = (s.gallery || []).length;
    const detailHtml = detail
      .map(value => '<span>' + esc(value) + '</span>')
      .join('<span class="person-library-meta-separator" aria-hidden="true">·</span>');

    const photoHtml = photoCount
      ? '<span class="person-library-meta-separator" aria-hidden="true">·</span>' +
        '<span>' + iconSvg('images') + ' ' + photoCount + ' ' + esc(uiText('人生照片')) + '</span>'
      : '';

    const familyAction = fam.memberIds.includes(s.id) ? '移出目前家族' : '加入目前家族';
    const familyIcon = fam.memberIds.includes(s.id) ? 'person-dash' : 'person-add';

    return '<div class="person-library-item' +
        (personLibraryState.batchMode ? ' batch-mode' : '') +
        (selected ? ' batch-selected' : '') +
        '" data-person-library-id="' + esc(s.id) + '">' +
      '<div class="person-library-main">' +
        '<div class="person-library-avatar-wrap">' +
          '<div class="person-library-avatar">' + avatarHTML(s) + '</div>' +
          '<button class="person-library-batch-select' + (selected ? ' selected' : '') +
            '" type="button" data-person-library-select="' + esc(s.id) +
            '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
            (selected ? iconSvg('check-lg') : '') +
          '</button>' +
        '</div>' +
        '<div class="person-library-text">' +
          '<div class="person-library-name">' +
            raceIconHTML(s) + statusIconHTML(s) +
            '<span>' + esc(displayDataText(s.name, s)) + '</span>' +
          '</div>' +
          '<div class="person-library-compact-meta">' + esc(compactMeta) + '</div>' +
          '<div class="person-library-detailed-meta">' + detailHtml + photoHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ui-menu person-library-item-menu">' +
        '<button class="person-library-more ui-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="' + esc(uiText('更多')) + '">' +
          iconSvg('three-dots') +
        '</button>' +
        '<div class="ui-menu-popover person-library-item-popover" role="menu">' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-person-library-action="view" data-person-library-action-id="' + esc(s.id) + '">' +
            iconSvg('person-vcard') + '<span>' + esc(uiText('查看個人檔案')) + '</span>' +
          '</button>' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-person-library-action="edit" data-person-library-action-id="' + esc(s.id) + '">' +
            iconSvg('pencil-square') + '<span>' + esc(uiText('編輯模擬市民')) + '</span>' +
          '</button>' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-person-library-action="locate" data-person-library-action-id="' + esc(s.id) + '">' +
            iconSvg('crosshair') + '<span>' + esc(uiText('在族譜中定位')) + '</span>' +
          '</button>' +
          '<div class="ui-menu-divider"></div>' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-person-library-action="toggle-family" data-person-library-action-id="' + esc(s.id) + '">' +
            iconSvg(familyIcon) + '<span>' + esc(uiText(familyAction)) + '</span>' +
          '</button>' +
          '<div class="ui-menu-divider"></div>' +
          '<button class="ui-menu-item danger" type="button" role="menuitem" data-person-library-action="delete" data-person-library-action-id="' + esc(s.id) + '">' +
            iconSvg('trash3') + '<span>' + esc(uiText('永久刪除')) + '</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  list.querySelectorAll('[data-person-library-id]').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.person-library-item-menu, .person-library-batch-select')) return;
      const id = row.dataset.personLibraryId;
      if (personLibraryState.batchMode) personLibraryController.toggleSelection(id);
      else openPersonProfile(id);
    });
  });

  list.querySelectorAll('[data-person-library-select]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      personLibraryController.toggleSelection(btn.dataset.personLibrarySelect);
    });
  });

  list.querySelectorAll('[data-person-library-action]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();

      const id = btn.dataset.personLibraryActionId;
      const action = btn.dataset.personLibraryAction;
      if (!genealogyData.sims[id]) return;

      if (action === 'view') {
        openPersonProfile(id);
      } else if (action === 'edit') {
        openEditor(id);
      } else if (action === 'locate') {
        personLibraryDialog.classList.remove('show');
        focusSimOnCanvas(id);
      } else if (action === 'toggle-family') {
        const mutation =
          fam.memberIds.includes(id)
            ? genealogyStore.removeFamilyMember(fam.id, id)
            : genealogyStore.addFamilyMember(fam.id, id);

        applyGenealogyMutation(mutation);
        renderPersonLibrary();
      } else if (action === 'delete') {
        await deleteChar(id);
      }
    });
  });

  if (!personLibraryState.batchMode) setupAppMenus();
}

$('personLibraryBtn').onclick = () => {
  personLibraryController.open();
};

$('personLibraryCloseBtn').onclick = () => {
  personLibraryController.close();
};

personLibraryDialog.onclick = event => {
  if (event.target === personLibraryDialog) {
    personLibraryController.close();
  }
};

personLibrarySearch.oninput = debounce(renderPersonLibrary, 150);

$('personLibraryAddBtn').onclick = () => openEditor(null);
$('personLibraryCompactBtn').onclick = () => setPersonLibraryViewMode('compact');
$('personLibraryDetailedBtn').onclick = () => setPersonLibraryViewMode('detailed');
$('personLibraryBatchBtn').onclick = () => personLibraryController.setBatchMode(true);
$('personLibraryBatchCancelBtn').onclick = () => personLibraryController.setBatchMode(false);

$('personLibraryBatchAddFamilyBtn').onclick = () => {
  personLibraryController.addSelectionToCurrentFamily();
};

$('personLibraryBatchRemoveFamilyBtn').onclick = () => {
  personLibraryController.removeSelectionFromCurrentFamily();
};

$('personLibraryBatchDeleteBtn').onclick = () => {
  personLibraryController.deleteSelection();
};

const addMemberController = {
  open() {
    personLibraryState.addSelection.clear();
    $('familyMemberPickerSearch').value = '';
    renderFamilyMemberPickerList();
    familyMemberPickerDialog.classList.add('show');
  },

  close() {
    familyMemberPickerDialog.classList.remove('show');
    personLibraryState.addSelection.clear();
  },

  toggle(id) {
    if (!genealogyData.sims[id]) return;

    if (personLibraryState.addSelection.has(id)) {
      personLibraryState.addSelection.delete(id);
    } else {
      personLibraryState.addSelection.add(id);
    }

    renderFamilyMemberPickerList();
  },

  selectAllCandidates() {
    const family = currentFamily();
    const memberSet = new Set(family.memberIds);

    Object.values(genealogyData.sims).forEach(sim => {
      if (!memberSet.has(sim.id)) {
        personLibraryState.addSelection.add(sim.id);
      }
    });

    renderFamilyMemberPickerList();
  },

  clearSelection() {
    personLibraryState.addSelection.clear();
    renderFamilyMemberPickerList();
  },

  commit() {
    if (!personLibraryState.addSelection.size) return;

    const family = currentFamily();
    const mutation = genealogyStore.addFamilyMembers(
      family.id,
      [...personLibraryState.addSelection]
    );

    applyGenealogyMutation(mutation);
    this.close();
    refreshFamilyProfilePanel();
    requestAnimationFrame(fitScreen);
  }
};

function renderFamilyMemberPickerList() {
  const fam = currentFamily();
  const memberSet = new Set(fam.memberIds);
  const q = $('familyMemberPickerSearch').value.trim().toLowerCase();
  const all = Object.values(genealogyData.sims);
  all.sort((a,b) => String(a.name).localeCompare(String(b.name),'zh'));
  let candidates = all.filter(s => !memberSet.has(s.id));
  if (q) {
    candidates = candidates.filter(s =>
      (s.name||'').toLowerCase().includes(q)
      || (s.career||'').toLowerCase().includes(q)
      || (s.residence||'').toLowerCase().includes(q)
      || (s.traits||[]).some(t => (t||'').toLowerCase().includes(q)));
  }
  $('familyMemberPickerFamilyName').textContent = displayDataText(fam.name, fam);
  const list = $('familyMemberPickerList');
  if (!candidates.length) {
    list.innerHTML = all.length === memberSet.size
      ? '<div class="family-member-picker-empty">所有模擬市民都已在目前家族中</div>'
      : '<div class="family-member-picker-empty">沒有符合的項目</div>';
  } else {
    list.innerHTML = candidates.map(s => {
      const fams = genealogyData.families.filter(f => f.memberIds.includes(s.id)).map(f => displayDataText(f.name, f)).join(' · ') || uiText('（未歸屬）');
      const genderIcon = s.gender === '男' ? iconSvg('gender-male') : s.gender === '女' ? iconSvg('gender-female') : iconSvg('gender-ambiguous');
      const isSel = personLibraryState.addSelection.has(s.id);
      return `<div class="family-member-picker-item${isSel ? ' selected' : ''}" data-family-member-picker-id="${s.id}">
        <div class="family-member-picker-checkbox">${isSel ? iconSvg('check-lg') : ''}</div>
        <div class="family-member-picker-avatar">${avatarHTML(s)}</div>
        <div class="family-member-picker-text">
          <div class="family-member-picker-name">${raceIconHTML(s)}${statusIconHTML(s)}${esc(displayDataText(s.name, s))}
            <span class="stage-tag stage-${s.lifeStage}">${esc(uiText(s.lifeStage))}</span>
          </div>
          <div class="family-member-picker-meta">${genderIcon} ${esc(fams)}</div>
        </div>
      </div>`;
    }).join('');
  }
  const count = personLibraryState.addSelection.size;
  $('familyMemberPickerCount').innerHTML = `已選 <b>${count}</b> 人`;
  $('familyMemberPickerConfirmBtn').disabled = count === 0;
  list.querySelectorAll('.family-member-picker-item').forEach(el => {
    el.onclick = () => {
      const id = el.dataset.familyMemberPickerId;
      addMemberController.toggle(id);
    };
  });
}
$('addMemberBtn').onclick = () => {
  addMemberController.open();
};

$('familyMemberPickerSearch').oninput = debounce(renderFamilyMemberPickerList, 150);

$('familyMemberPickerCancelBtn').onclick = () => {
  addMemberController.close();
};

familyMemberPickerDialog.onclick = event => {
  if (event.target === familyMemberPickerDialog) {
    addMemberController.close();
  }
};

$('familyMemberPickerAllBtn').onclick = () => {
  addMemberController.selectAllCandidates();
};

$('familyMemberPickerNoneBtn').onclick = () => {
  addMemberController.clearSelection();
};

$('familyMemberPickerConfirmBtn').onclick = () => {
  addMemberController.commit();
};

// ========【家族成員批量移除】 設定 - 側邊欄原地選取，送出前必須二次確認 ========
$('removeMemberBtn').onclick = () => {
  const family = currentFamily();
  if (!family.memberIds.length) return;

  familyMemberController.setRemoveMode(true);
};

$('familyMemberRemoveCancelBtn').onclick = () => {
  familyMemberController.setRemoveMode(false);
};

$('familyMemberRemoveConfirmBtn').onclick = event => {
  familyMemberController.confirmRemoveSelected(event);
};

async function exportJSON() {
  try {
    const exportDb = JSON.parse(JSON.stringify(genealogyData));
    const exportBg = { ...bgSettings };
    const assetIds = collectReferencedAssetIds(exportDb, exportBg, { strict:true });
    const assets = await assetStore.serializeAssets(assetIds);

    const payload = {
      ...exportDb,
      bgSettings:exportBg,
      backupFormat:'l1ng-genealogy-backup',
      backupVersion:1,
      assets
    };

    // 備份以 compact JSON 輸出；Base64 只存在 portable backup，不回寫 runtime。
    const blob = new Blob([JSON.stringify(payload)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '模擬市民4_族譜備份.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch (error) {
    uiAlert('匯出失敗：' + error.message, { title:'匯出失敗', kind:'danger' });
  }
}

function openExportPanel() {
  if (!exportDialog) return;
  exportDialog.classList.add('show');
  exportDialog.setAttribute('aria-hidden', 'false');
}

function closeExportPanel() {
  if (!exportDialog) return;
  exportDialog.classList.remove('show');
  exportDialog.setAttribute('aria-hidden', 'true');
}

function getSelectedExportImageSize() {
  const checked = document.querySelector('input[name="exportImageSize"]:checked');
  return checked ? checked.value : 'standard';
}
function getSelectedExportBackgroundMode() {
  const checked = document.querySelector('input[name="exportBackgroundMode"]:checked');
  return checked?.value || 'current';
}


let _html2CanvasPromise = null;

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === src);
    if (existing) {
      if (window.html2canvas) { resolve(); return; }
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error(`Script load failed: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error(`Script load failed: ${src}`));
    };
    document.head.appendChild(script);
  });
}

async function ensureHtml2Canvas() {
  if (typeof window.html2canvas === 'function') return window.html2canvas;
  if (_html2CanvasPromise) return _html2CanvasPromise;

  const sources = [
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
  ];

  _html2CanvasPromise = (async () => {
    let lastError = null;
    for (const src of sources) {
      try {
        await loadScriptOnce(src);
        if (typeof window.html2canvas === 'function') return window.html2canvas;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('html2canvas is unavailable');
  })();

  try {
    return await _html2CanvasPromise;
  } catch (err) {
    _html2CanvasPromise = null;
    throw err;
  }
}

function sanitizeDownloadName(name) {
  return String(name || 'genealogy')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim() || 'genealogy';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const _exportIconSvgCache = new Map();

async function loadExportIconSvg(iconName) {
  if (_exportIconSvgCache.has(iconName)) {
    return _exportIconSvgCache.get(iconName);
  }

  const url =
    new URL(
      `../../html%20icons/${iconName}.svg`,
      document.baseURI
    ).href;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${iconName}.svg`);
  }

  const svg = await response.text();

  if (!svg.includes('<svg')) {
    throw new Error(`Invalid SVG: ${iconName}`);
  }

  _exportIconSvgCache.set(iconName, svg);
  return svg;
}

function colorizeExportSvg(svg, color) {
  return String(svg)
    .replace(/currentColor/g, color)
    .replace(/fill=(['"])black\1/gi, `fill="${color}"`)
    .replace(/fill=(['"])#000(?:000)?\1/gi, `fill="${color}"`)
    .replace(/stroke=(['"])black\1/gi, `stroke="${color}"`)
    .replace(/stroke=(['"])#000(?:000)?\1/gi, `stroke="${color}"`);
}

async function prepareCaptureIcons(captureRoot) {
  const icons =
    [...captureRoot.querySelectorAll('.l1ng-icon')];

  await Promise.all(
    icons.map(async icon => {
      const iconClass =
        [...icon.classList]
          .find(name => name.startsWith('icon-'));

      if (!iconClass) return;

      const iconName = iconClass.slice(5);

      try {
        const svg = await loadExportIconSvg(iconName);
        const color = getComputedStyle(icon).color || '#5f6875';
        const coloredSvg = colorizeExportSvg(svg, color);

        const dataUrl =
          'data:image/svg+xml;charset=utf-8,' +
          encodeURIComponent(coloredSvg);

        const image = document.createElement('img');
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.display = 'block';
        image.style.objectFit = 'contain';

        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = dataUrl;
        });

        icon.replaceChildren(image);
        icon.style.setProperty('-webkit-mask-image','none','important');
        icon.style.setProperty('mask-image','none','important');
        icon.style.setProperty('background','transparent','important');
        icon.style.setProperty('display','inline-flex','important');
        icon.style.setProperty('align-items','center','important');
        icon.style.setProperty('justify-content','center','important');
      } catch (err) {
        icon.style.setProperty('visibility','hidden','important');
      }
    })
  );
}

const EXPORT_TREE_PADDING_PX = 40;

// ========【族譜圖片主題背景】 設定 - 匯出時沿用目前主題的實際畫布底色與紋理 ========
function isTransparentBackgroundColor(value) {
  const normalized = String(value || '').replace(/\s+/g, '').toLowerCase();
  if (!normalized || normalized === 'transparent') return true;
  if (normalized === 'rgba(0,0,0,0)') return true;

  const match = normalized.match(/^rgba\([^,]+,[^,]+,[^,]+,([\d.]+)\)$/);
  return !!match && Number(match[1]) === 0;
}

function getThemeCanvasBackgroundStyle() {
  const viewportStyle = getComputedStyle(viewport);
  const bodyStyle = getComputedStyle(document.body);

  // 多數主題的 viewport 底色是透明，實際顯示的是 body 的 --bg；
  // L1nG 晴空則另外覆寫 viewport 底色，因此優先保留 viewport 的實際值。
  const backgroundColor = isTransparentBackgroundColor(viewportStyle.backgroundColor)
    ? bodyStyle.backgroundColor
    : viewportStyle.backgroundColor;

  return {
    color: backgroundColor || '#ffffff',
    image: viewportStyle.backgroundImage && viewportStyle.backgroundImage !== 'none'
      ? viewportStyle.backgroundImage
      : 'none',
    size: viewportStyle.backgroundSize || 'auto',
    position: viewportStyle.backgroundPosition || '0% 0%',
    repeat: viewportStyle.backgroundRepeat || 'repeat'
  };
}

function buildGenealogyCaptureNode(stageWidth, stageHeight, backgroundMode = 'current') {
  const captureViewport = viewport.cloneNode(true);
  captureViewport.classList.remove('dragging');
  captureViewport.style.position = 'fixed';
  captureViewport.style.left = '0';
  captureViewport.style.top = '0';
  captureViewport.style.zIndex = '-2147483647';
  captureViewport.style.pointerEvents = 'none';
  captureViewport.style.width = `${Math.max(1, Math.ceil(stageWidth))}px`;
  captureViewport.style.height = `${Math.max(1, Math.ceil(stageHeight))}px`;
  captureViewport.style.minWidth = captureViewport.style.width;
  captureViewport.style.minHeight = captureViewport.style.height;
  captureViewport.style.flex = 'none';
  captureViewport.style.overflow = 'hidden';
  captureViewport.style.cursor = 'default';

  if (backgroundMode === 'color' || backgroundMode === 'transparent') {
    // 「主題背景顏色」與「透明背景」都不帶玩家另外上傳的背景圖片。
    captureViewport.classList.remove('has-bg');
    captureViewport.style.setProperty('--custom-bg', 'none');
    captureViewport.style.setProperty('--custom-bg-opacity', '0');

    if (backgroundMode === 'transparent') {
      captureViewport.style.background = 'transparent';
    } else {
      const themeBackground = getThemeCanvasBackgroundStyle();

      // 不只複製單一 background-color；連同目前主題畫布的點陣 / 紋理一起輸出。
      captureViewport.style.background = 'none';
      captureViewport.style.backgroundColor = themeBackground.color;
      captureViewport.style.backgroundImage = themeBackground.image;
      captureViewport.style.backgroundSize = themeBackground.size;
      captureViewport.style.backgroundPosition = themeBackground.position;
      captureViewport.style.backgroundRepeat = themeBackground.repeat;
    }
  }

  const captureStage = captureViewport.querySelector('#genealogyCanvasStage');
  if (!captureStage) throw new Error('Genealogy stage was not found');
  captureStage.classList.remove('is-transforming');
  // 匯出直接使用族譜世界座標 1:1；Fit / zoom / pan 只屬於瀏覽視角，不參與輸出解析度。
  captureStage.style.transform = 'none';
  captureStage.style.transformOrigin = '0 0';
  captureStage.style.left = '0';
  captureStage.style.top = '0';

  const guides = captureViewport.querySelector('#smartGuides');
  if (guides) guides.remove();

  // 匯出只保留族譜內容，不帶入搜尋高亮、篩選淡化與拖曳中的操作狀態。
  captureViewport.querySelectorAll('.hl, .dim, .dragging').forEach(el => {
    el.classList.remove('hl', 'dim', 'dragging');
  });

  return captureViewport;
}

function fitCaptureToCompleteTree(captureViewport, stageWidth, stageHeight) {
  const captureStage = captureViewport.querySelector('#genealogyCanvasStage');
  if (!captureStage) throw new Error('Genealogy stage was not found');

  const viewportRect = captureViewport.getBoundingClientRect();
  const content = [
    ...captureStage.querySelectorAll('.person-card'),
    ...captureStage.querySelectorAll('#genealogyRelationshipLayer path'),
    ...captureStage.querySelectorAll('#genealogyRelationshipLabelLayer .edge-label')
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  content.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return;
    if (rect.width === 0 && rect.height === 0) return;

    minX = Math.min(minX, rect.left - viewportRect.left);
    minY = Math.min(minY, rect.top - viewportRect.top);
    maxX = Math.max(maxX, rect.right - viewportRect.left);
    maxY = Math.max(maxY, rect.bottom - viewportRect.top);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    minX = 0;
    minY = 0;
    maxX = Math.max(1, stageWidth);
    maxY = Math.max(1, stageHeight);
  }

  // 關係線 stroke、卡片陰影與外框需要安全邊界；四周固定相同留白，讓整棵族譜真正置中。
  const safety = 8;
  minX -= safety;
  minY -= safety;
  maxX += safety;
  maxY += safety;

  const contentWidth = Math.max(1, maxX - minX);
  const contentHeight = Math.max(1, maxY - minY);
  const width = Math.max(1, Math.ceil(contentWidth + EXPORT_TREE_PADDING_PX * 2));
  const height = Math.max(1, Math.ceil(contentHeight + EXPORT_TREE_PADDING_PX * 2));

  captureViewport.style.width = `${width}px`;
  captureViewport.style.height = `${height}px`;
  captureViewport.style.minWidth = `${width}px`;
  captureViewport.style.minHeight = `${height}px`;
  captureStage.style.left = `${EXPORT_TREE_PADDING_PX - minX}px`;
  captureStage.style.top = `${EXPORT_TREE_PADDING_PX - minY}px`;

  return { width, height };
}

async function exportGenealogyImage(sizeKey = 'standard', backgroundMode = 'current') {
  if (!genealogyData || !stage || !viewport) throw new Error('Genealogy canvas is not ready');

  // 等待目前語系字型完成載入後再量測與繪製，避免 HTML 與 PNG 的文字基線、膠囊背景位置不同。
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  render();

  const factorMap = { standard: 1, hd: 2, uhd: 3 };
  const factor = factorMap[sizeKey] || 1;
  const stageWidth = Math.max(1, Math.ceil(parseFloat(stage.style.width) || stage.offsetWidth || 1));
  const stageHeight = Math.max(1, Math.ceil(parseFloat(stage.style.height) || stage.offsetHeight || 1));

  const html2canvas = await ensureHtml2Canvas();
  const captureViewport = buildGenealogyCaptureNode(stageWidth, stageHeight, backgroundMode);
  document.body.appendChild(captureViewport);

  try {
    // 先讓 clone 套用完整 CSS，再把 mask icon 換成 html2canvas 能正確輸出的 SVG。
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await prepareCaptureIcons(captureViewport);
    const captureSize = fitCaptureToCompleteTree(captureViewport, stageWidth, stageHeight);
    const pixelWidth = Math.max(1, Math.round(captureSize.width * factor));
    const pixelHeight = Math.max(1, Math.round(captureSize.height * factor));

    if (pixelWidth > 32767 || pixelHeight > 32767 || pixelWidth * pixelHeight > 180000000) {
      throw new Error('圖片尺寸超過瀏覽器可安全輸出的範圍，請改用較小的匯出尺寸。');
    }

    const canvas = await html2canvas(captureViewport, {
      backgroundColor: backgroundMode === 'transparent' ? null : undefined,
      scale: factor,
      width: captureSize.width,
      height: captureSize.height,
      windowWidth: Math.max(document.documentElement.clientWidth, captureSize.width),
      windowHeight: Math.max(document.documentElement.clientHeight, captureSize.height),
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      foreignObjectRendering: true,
      allowTaint: false,
      imageTimeout: 15000,
      logging: false,
      removeContainer: true
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png');
    });

    const family = currentFamily();
    const familyName = displayDataText((family && family.name) || uiText('家族'), family || null);
    const fileBase = sanitizeDownloadName(`${familyName}_族譜`);
    const sizeLabel = sizeKey === 'uhd' ? '超高畫質' : sizeKey === 'hd' ? '高畫質' : '標準';
    downloadBlob(blob, `${fileBase}_${sizeLabel}.png`);
  } finally {
    captureViewport.remove();
  }
}

// ========【L1nG v1 資料載入】 設定 - 只讀取目前 schema，不承接舊版網站資料 ========
function readStoredGenealogyData() {
  const currentRaw =
    localStorage.getItem(STORE_KEY);

  return currentRaw
    ? JSON.parse(currentRaw)
    : null;
}

function isCurrentGenealogyData(raw) {
  return !!(
    raw &&
    typeof raw === 'object' &&
    Number(raw.version) === 1 &&
    raw.sims &&
    typeof raw.sims === 'object' &&
    !Array.isArray(raw.sims) &&
    Array.isArray(raw.families)
  );
}

function prepareDatabase(raw) {
  if (!isCurrentGenealogyData(raw)) {
    throw new Error(
      '不支援的網站資料格式。請使用目前 L1nG v1 族譜資料或遊戲族譜 ZIP。'
    );
  }

  const prepared = raw;

  normalizeCurrentDatabase(prepared);

  const householdMembershipRepaired =
    repairImportedHouseholdMembership(
      prepared
    );

  let missingLinkIdRepaired = false;

  prepared.links.forEach(link => {
    if (!link || link.id) return;
    link.id = uid('lnk');
    missingLinkIdRepaired = true;
  });

  return {
    prepared,
    changed:
      householdMembershipRepaired ||
      missingLinkIdRepaired
  };
}

async function importJSON(file) {
  try {
    const raw = JSON.parse(await file.text());

    if (
      raw?.backupFormat !== 'l1ng-genealogy-backup' ||
      Number(raw?.backupVersion) !== 1
    ) {
      throw new Error('這不是目前 L1nG 圖片資產架構的完整 JSON 備份。');
    }

    const incomingBg = raw.bgSettings && typeof raw.bgSettings === 'object'
      ? { ...raw.bgSettings }
      : { image:null, opacity:0.5, fit:'cover' };

    const rawDb = { ...raw };
    delete rawDb.backupFormat;
    delete rawDb.backupVersion;
    delete rawDb.bgSettings;
    delete rawDb.assets;

    const preparedResult = prepareDatabase(rawDb);
    const nextDb = preparedResult.prepared;
    const requiredAssets = collectReferencedAssetIds(nextDb, incomingBg, { strict:true });
    const serializedAssets = raw.assets || {};

    for (const id of requiredAssets) {
      if (!Object.prototype.hasOwnProperty.call(serializedAssets, id)) {
        throw new Error(`備份缺少被族譜引用的圖片資產：${id}`);
      }
    }

    await assetStore.importSerializedAssets(serializedAssets);

    genealogyData = nextDb;
    dragHistory.clear();
    bgSettings = { ...bgSettings, ...incomingBg };

    save({ immediate:true });
    persistCanvasBackground();
    refreshFamilyUI();
    renderCanvasBackground();
    render();
    scheduleGC();
    requestAnimationFrame(fitScreen);
  } catch(err) {
    uiAlert('匯入失敗：' + err.message, { title:'匯入失敗', kind:'danger' });
  }
}

// ========【遊戲族譜匯入狀態】 設定 - 顯示 ZIP 讀取與族譜建立進度 ========
let gameImportStatusElement = null;

function ensureGameImportStatus() {
  if (gameImportStatusElement) return gameImportStatusElement;

  const overlay = document.createElement('div');
  overlay.id = 'gameImportStatus';
  overlay.className = 'game-import-status-mask';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <div class="game-import-status-card" role="status" aria-live="polite" aria-atomic="true">
      <span class="game-import-spinner" aria-hidden="true"></span>

      <div class="game-import-status-content">
        <strong class="game-import-status-title">正在匯入遊戲族譜</strong>
        <span class="game-import-status-text">準備中…</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  gameImportStatusElement = overlay;

  return overlay;
}

function showGameImportStatus(message) {
  const overlay = ensureGameImportStatus();
  const text = overlay.querySelector('.game-import-status-text');

  if (text) text.textContent = uiText(message);

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}

function hideGameImportStatus() {
  if (!gameImportStatusElement) return;

  gameImportStatusElement.classList.remove('show');
  gameImportStatusElement.setAttribute('aria-hidden', 'true');
}

function waitForImportPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

// ========【遊戲族譜匯入】 設定 - 讀取 L1nG Genealogy Exporter ZIP ========
// ========【遊戲族譜頭像】 設定 - ZIP 圖片直接進 Blob Asset Store，再回填人物 / 寵物 assetId ========
async function persistGameImportAvatars(bundle, converted) {
  if (!window.L1nGGameImport || !bundle || !converted) {
    return { saved:0, unsupported:0, missing:0 };
  }

  const sourceSims =
    (bundle.genealogy && bundle.genealogy.sims) ||
    {};

  let saved = 0;
  let unsupported = 0;
  let missing = 0;

  const persistAsset = async (target, simId, kind = 'sim') => {
    const sourceSim = sourceSims[String(simId)];

    const asset =
      window.L1nGGameImport.getSimAvatarAsset(
        bundle,
        String(simId),
        sourceSim
      );

    if (!asset) {
      missing++;
      return;
    }

    if (!asset.supported || !asset.bytes) {
      unsupported++;
      return;
    }

    // 遊戲端 Genealogy Exporter ZIP 已提供 EA 原始頭像 bytes。
    // 這裡直接保存原始 Blob，避免再次經過一般手動上傳使用的
    // 384px 縮圖與 JPEG / WEBP 重新編碼，保留遊戲匯出的原始畫質。
    const sourceBlob = new Blob(
      [asset.bytes],
      { type:asset.mimeType }
    );

    target.avatar = await saveImageAsset(sourceBlob);

    saved++;
  };

  for (const [simId, sim] of Object.entries(converted.sims || {})) {
    await persistAsset(sim, simId);

    for (const pet of sim.pets || []) {
      const petSimId =
        pet &&
        pet.gameData &&
        pet.gameData.simId;

      if (!petSimId || pet.avatar) continue;
      await persistAsset(pet, petSimId, 'pet');
    }
  }

  const unassignedPets =
    converted.meta &&
    Array.isArray(converted.meta.unassignedPets)
      ? converted.meta.unassignedPets
      : [];

  for (const pet of unassignedPets) {
    const petSimId =
      pet &&
      pet.gameData &&
      pet.gameData.simId;

    if (!petSimId || pet.avatar) continue;
    await persistAsset(pet, petSimId, 'pet');
  }

  return {
    saved,
    unsupported,
    missing
  };
}

async function importGameGenealogy(file) {
  try {
    if (!window.L1nGGameImport) {
      throw new Error('找不到遊戲族譜匯入模組。');
    }

    showGameImportStatus('正在讀取 ZIP…');
    await waitForImportPaint();

    const bundle = await window.L1nGGameImport.parseFile(file);

    showGameImportStatus('正在整理人物與家族…');
    await waitForImportPaint();

    const converted = window.L1nGGameImport.convertBundle(bundle);

    showGameImportStatus('正在匯入人物頭像…');
    await waitForImportPaint();

    const avatarStats =
      await persistGameImportAvatars(
        bundle,
        converted
      );

    const preparedResult = prepareDatabase(converted);

    showGameImportStatus('正在建立族譜畫面…');
    await waitForImportPaint();

    genealogyData = preparedResult.prepared;

    // 匯入新資料時，同時清除上一份族譜留下的操作狀態。
    dragHistory.clear();
    clearNodeSelection();
    finishMarquee();

    labelDrag = null;
    panning = false;
    viewport.classList.remove('dragging');

    arrangeTool = 'pan';

    invalidateChildrenIndex();
    invalidateRelationshipGraph();

    save({ immediate: true });
    refreshFamilyUI();
    render();

    await new Promise(resolve => {
      requestAnimationFrame(() => {
        fitScreen();
        resolve();
      });
    });

    const stats = bundle.manifest && bundle.manifest.stats
      ? bundle.manifest.stats
      : {};

    const normalizedStats =
      converted.meta &&
      converted.meta.gameImportStats
        ? converted.meta.gameImportStats
        : {};

    const simCount =
      normalizedStats.peopleCount ||
      Object.keys(genealogyData.sims || {}).length;

    const petCount =
      normalizedStats.petCount ||
      0;

    const familyCount =
      Array.isArray(genealogyData.families)
        ? genealogyData.families.length
        : 0;

    const activeFamily = currentFamily();
    const activeFamilyName = activeFamily
      ? displayDataText(activeFamily.name, activeFamily)
      : '—';
    const importedGameDate = formatGameDate(
      converted && converted.meta && converted.meta.realDateCurrentDate
    );

    hideGameImportStatus();

    await uiAlert(
      [
        '遊戲族譜已成功匯入。',
        '',
        `人物：${simCount}`,
        `寵物：${petCount}`,
        `家族：${familyCount}`,
        `頭像：${avatarStats.saved}`,
        importedGameDate ? `${uiText('遊戲日期')}：${importedGameDate}` : null,
        `目前顯示：${activeFamilyName}`
      ].filter(Boolean).join('\n'),
      {
        title: '遊戲族譜匯入完成',
        confirmText: '查看族譜'
      }
    );

    // 完成後主動讓玩家看見家族清單。
    if (window.innerWidth <= 720) {
      openSidebar();
    } else {
      setFamilyPanelCollapsed(false);
    }

  } catch (err) {
    hideGameImportStatus();

    console.error('[遊戲族譜匯入]', err);

    await uiAlert(
      `遊戲族譜匯入失敗：${err && err.message ? err.message : 'Unknown error'}`,
      {
        title: '遊戲族譜匯入失敗',
        kind: 'danger'
      }
    );
  }
}


// ========【畫布檔案拖曳匯入】 設定 - JSON 備份 / 遊戲族譜 ZIP 可直接拖到畫布讀取 ========
let canvasImportDragDepth = 0;
let canvasImportDropOverlay = null;

function isCanvasImportFileDrag(event) {
  const types = Array.from(event?.dataTransfer?.types || []);
  return types.includes('Files');
}

function getCanvasImportFileKind(file) {
  const name = String(file?.name || '').trim().toLowerCase();
  if (name.endsWith('.zip')) return 'game-zip';
  if (name.endsWith('.json')) return 'json-backup';
  return '';
}

function ensureCanvasImportDropOverlay() {
  if (canvasImportDropOverlay) return canvasImportDropOverlay;

  const overlay = document.createElement('div');
  overlay.id = 'canvasImportDropOverlay';
  overlay.setAttribute('aria-hidden', 'true');

  Object.assign(overlay.style, {
    position: 'fixed',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '8px',
    boxSizing: 'border-box',
    padding: '24px',
    border: '2px dashed var(--accent, #5a7fa3)',
    borderRadius: '18px',
    background: 'rgba(255,255,255,.92)',
    boxShadow: '0 18px 50px rgba(35,48,61,.18)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#24303d',
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: '900'
  });

  const title = document.createElement('strong');
  title.className = 'canvas-import-drop-title';
  title.style.fontSize = '18px';
  title.style.lineHeight = '1.35';

  const note = document.createElement('span');
  note.className = 'canvas-import-drop-note';
  note.style.fontSize = '13px';
  note.style.lineHeight = '1.5';
  note.style.opacity = '.76';

  overlay.append(title, note);
  document.body.appendChild(overlay);
  canvasImportDropOverlay = overlay;

  return overlay;
}

function positionCanvasImportDropOverlay() {
  if (!canvasImportDropOverlay || !viewport) return;

  const rect = viewport.getBoundingClientRect();
  const inset = 14;

  canvasImportDropOverlay.style.left = `${Math.round(rect.left + inset)}px`;
  canvasImportDropOverlay.style.top = `${Math.round(rect.top + inset)}px`;
  canvasImportDropOverlay.style.width = `${Math.max(0, Math.round(rect.width - inset * 2))}px`;
  canvasImportDropOverlay.style.height = `${Math.max(0, Math.round(rect.height - inset * 2))}px`;
}

function showCanvasImportDropOverlay() {
  const overlay = ensureCanvasImportDropOverlay();
  const title = overlay.querySelector('.canvas-import-drop-title');
  const note = overlay.querySelector('.canvas-import-drop-note');

  if (title) title.textContent = uiText('放開即可匯入族譜檔案');
  if (note) note.textContent = uiText('支援遊戲族譜 ZIP 與 JSON 備份');

  positionCanvasImportDropOverlay();
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
}

function hideCanvasImportDropOverlay() {
  canvasImportDragDepth = 0;
  if (!canvasImportDropOverlay) return;

  canvasImportDropOverlay.style.display = 'none';
  canvasImportDropOverlay.setAttribute('aria-hidden', 'true');
}

async function importCanvasDroppedFile(file) {
  const kind = getCanvasImportFileKind(file);

  if (kind === 'game-zip') {
    await importGameGenealogy(file);
    return;
  }

  if (kind === 'json-backup') {
    uiToast('正在匯入 JSON 備份…');
    await importJSON(file);
    return;
  }

  await uiAlert(
    '不支援這個檔案。請使用遊戲族譜 ZIP 或 JSON 備份。',
    { title: '匯入失敗', kind: 'danger' }
  );
}

viewport.addEventListener('dragenter', event => {
  if (!isCanvasImportFileDrag(event)) return;

  event.preventDefault();
  canvasImportDragDepth += 1;
  showCanvasImportDropOverlay();
});

viewport.addEventListener('dragover', event => {
  if (!isCanvasImportFileDrag(event)) return;

  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  showCanvasImportDropOverlay();
});

viewport.addEventListener('dragleave', event => {
  if (!isCanvasImportFileDrag(event)) return;

  event.preventDefault();
  canvasImportDragDepth = Math.max(0, canvasImportDragDepth - 1);

  if (canvasImportDragDepth === 0) {
    hideCanvasImportDropOverlay();
  }
});

viewport.addEventListener('drop', async event => {
  if (!isCanvasImportFileDrag(event)) return;

  event.preventDefault();
  event.stopPropagation();
  hideCanvasImportDropOverlay();

  const files = Array.from(event.dataTransfer?.files || []);
  if (!files.length) return;

  if (files.length !== 1) {
    await uiAlert(
      '請一次只拖曳一個族譜檔案。',
      { title: '匯入失敗', kind: 'danger' }
    );
    return;
  }

  await importCanvasDroppedFile(files[0]);
});

window.addEventListener('resize', () => {
  if (canvasImportDropOverlay && canvasImportDropOverlay.style.display !== 'none') {
    positionCanvasImportDropOverlay();
  }
});

$('addBtn').onclick = () => openEditor(null);
$('btnCancel').onclick = closeEditor;
$('btnSave').onclick = saveChar;
$('btnDelete').onclick = () => simEditorState.simId && deleteChar(simEditorState.simId);
mask.onclick = e => { if (e.target === mask) closeEditor(); };

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const modifier = e.ctrlKey || e.metaKey;

  if (e.code === 'Space' && !isTextInteractionTarget(e.target) && getCurrentFreeLayout(currentFamily()) && arrangeTool === 'select') {
    spacePanHeld = true;
    updateArrangeToolUI();
    e.preventDefault();
  }

  if (modifier && key === 'a' && !isTextInteractionTarget(e.target) && getCurrentFreeLayout(currentFamily()) && arrangeTool === 'select') {
    selectVisibleNodes();
    e.preventDefault();
    return;
  }

  // 拖曳復原只在非文字編輯欄位攔截，輸入框仍保留瀏覽器原生 Ctrl+Z。
  if (modifier && !isNativeTextUndoTarget(e.target)) {
    if (key === 'z' && !e.shiftKey) {
      if (dragHistory.undo()) e.preventDefault();
      return;
    }
    if ((key === 'z' && e.shiftKey) || key === 'y') {
      if (dragHistory.redo()) e.preventDefault();
      return;
    }
  }

  if (e.key === 'Escape') {
    if (!closeTopModal() && selectedNodeIds.size) clearNodeSelection();
    return;
  }
  if (lifePhotoViewerDialog.classList.contains('show')) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); lifePhotoWorkspace.moveViewer(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); lifePhotoWorkspace.moveViewer(1); return; }
  }
  if (e.key === 'Enter' && e.ctrlKey) {
    if (lifePhotoEditorDialog.classList.contains('show')) lifePhotoWorkspace.commitEditor();
    else if (petEditorDialog.classList.contains('show')) petEditorController.commit();
    else if (mask.classList.contains('show')) saveChar();
  }
});

document.addEventListener('keyup', e => {
  if (e.code !== 'Space') return;
  spacePanHeld = false;
  updateArrangeToolUI();
});
window.addEventListener('blur', () => {
  if (!spacePanHeld) return;
  spacePanHeld = false;
  updateArrangeToolUI();
});

$('relationshipAddBtn').onclick = () => {
  if (!simEditorState.simId) return;

  const c =
    genealogyData.sims[
      simEditorState.simId
    ];

  if (!c) return;

  const typeSelect =
    $('relationshipType');

  const typeWrap =
    document.querySelector(
      '.ui-select-wrap[data-ui-select-for="relationshipType"]'
    );

  let type =
    normalizeRelationshipTypeText(
      typeSelect?.value
    );

  if (
    !type &&
    typeWrap?._pendingValue
  ) {
    type =
      normalizeRelationshipTypeText(
        typeWrap._pendingValue()
      );
  }

  if (!type) {
    uiAlert(
      '請選擇或輸入關係。',
      {
        title:'資料未完成'
      }
    );

    return;
  }

  const targetId =
    $('relationshipTarget').value;

  if (!targetId) {
    uiAlert(
      '請選擇關係對象。',
      {
        title:'資料未完成'
      }
    );

    return;
  }

  const mutation =
    genealogyStore.addRelationship({
      from:c.id,
      to:targetId,
      type,
      label:type
    });

  populateRelationshipTypePicker();

  if (typeSelect) {
    typeSelect.value = '';
  }

  refreshSS('relationshipType');

  renderRelList(c);
  renderRelAnno(c.id);

  applyGenealogyMutation(mutation);
};

// ========【頂部篩選】 設定 - 狀態、性別、種族與人生階段篩選 ========
function applyTopbarFilters() {
  updateTopbarFilterUI();
  render();
}

[
  ...statusFilterInputs,
  ...genderFilterInputs,
  ...raceFilterInputs,
  ...lifeStageFilterInputs
].forEach(input => {
  input.addEventListener('change', applyTopbarFilters);
});

$('filterResetBtn')?.addEventListener('click', event => {
  event.preventDefault();

  [
    ...statusFilterInputs,
    ...genderFilterInputs,
    ...raceFilterInputs,
    ...lifeStageFilterInputs
  ].forEach(input => {
    input.checked = true;
  });

  applyTopbarFilters();
});

updateTopbarFilterUI();

const zoomCenter = () => { const r=viewport.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; };
$('zoomInBtn')?.addEventListener('click',()=>{const p=zoomCenter();zoomAt(p.x,p.y,1.16);});
$('zoomOutBtn')?.addEventListener('click',()=>{const p=zoomCenter();zoomAt(p.x,p.y,1/1.16);});
$('fitScreenBtn')?.addEventListener('click',fitScreen);

$('exportBtn').onclick = openExportPanel;
if (exportCloseBtn) exportCloseBtn.onclick = closeExportPanel;
if (exportDialog) exportDialog.onclick = e => { if (e.target === exportDialog) closeExportPanel(); };
if (exportJsonBtn) exportJsonBtn.onclick = async () => { closeExportPanel(); await exportJSON(); };
if (exportImageBtn) exportImageBtn.onclick = async () => {
  const originalHtml =
    exportImageBtn.innerHTML;

  exportImageBtn.disabled = true;
  exportImageBtn.classList.add('is-loading');
  exportImageBtn.setAttribute('aria-busy', 'true');
  exportJsonBtn && (exportJsonBtn.disabled = true);

  const loadingText =
    uiText('正在匯出族譜圖片…')
      .replace(/[.…]+$/u, '');

  exportImageBtn.innerHTML =
    `<span>${esc(loadingText)}</span>` +
    '<span class="export-loading-dots" aria-hidden="true">' +
      '<span></span><span></span><span></span>' +
    '</span>';

  try {
    // 先讓 loading 狀態真正畫到畫面上，再開始較重的族譜 capture。
    await new Promise(resolve =>
      requestAnimationFrame(resolve)
    );

    await exportGenealogyImage(
      getSelectedExportImageSize(),
      getSelectedExportBackgroundMode()
    );

    closeExportPanel();
    uiToast('族譜圖片匯出完成');
  } catch (err) {
    console.error(err);
    await uiAlert(`族譜圖片匯出失敗：${err && err.message ? err.message : 'Unknown error'}`, { title: '族譜圖片匯出失敗', kind: 'danger' });
  } finally {
    exportImageBtn.innerHTML =
      originalHtml;

    exportImageBtn.classList.remove(
      'is-loading'
    );

    exportImageBtn.removeAttribute(
      'aria-busy'
    );

    exportImageBtn.disabled = false;
    exportJsonBtn && (exportJsonBtn.disabled = false);
  }
};
$('importInput').onchange = e => {
  const f = e.target.files[0];
  if (f) importJSON(f);
  e.target.value = '';
};

const gameImportInput = $('gameImportInput');

if (gameImportInput) {
  gameImportInput.onchange = async e => {
    const f = e.target.files[0];

    if (f) {
      await importGameGenealogy(f);
    }

    e.target.value = '';
  };
}

// ========【全站載入骨架】 設定 - 完成初始資料與圖片載入後一次移除 ========
function hideAppSkeleton() {
  const skeleton = $('appSkeleton');
  if (!skeleton || skeleton.classList.contains('is-hidden')) return;

  skeleton.classList.add('is-hidden');

  window.setTimeout(() => {
    skeleton.remove();
  }, 180);
}

async function init() {
  try {
    const v = localStorage.getItem(CUSTOM_COLORS_KEY);
    if (v) {
      const obj = JSON.parse(v);
      if (obj.c1) customColors.c1 = obj.c1;
      if (obj.c2) customColors.c2 = obj.c2;
    }
  } catch(e){}

  let savedTheme = 'ling';
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'custom') savedTheme = 'custom';
    else if (v && VALID_THEMES.includes(v)) savedTheme = v;

  } catch(e){}

  if (savedTheme === 'custom') chooseCustomTheme(customColors.c1, customColors.c2);
  else chooseThemePreset(savedTheme);

  let savedMode = 'view';
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v && VALID_MODES.includes(v)) savedMode = v;
  } catch(e){}
  applyViewMode(savedMode);

  let savedLock = false;
  try {
    const v = localStorage.getItem(LABEL_LOCK_KEY);
    savedLock = (v === '1');
  } catch(e){ savedLock = false; }
  applyLabelLock(savedLock);

  try {
    const v = localStorage.getItem(LABELS_KEY);
    showRelLabels = (v === '0') ? false : true;
  } catch(e){ showRelLabels = true; }

  (function updateLabelBtn() {
    const btn = $('labelToggle');
    if (showRelLabels) { btn.classList.add('active'); setIconText(btn, 'tags', '隱藏關係'); }
    else { btn.classList.remove('active'); setIconText(btn, 'tags', '顯示關係'); }
  })();
  syncRelationshipToolbarVisibility();

  try {
    await assetStore.openDb();
    assetStoreReady = true;
  } catch(error) {
    throw new Error('圖片資產資料庫無法使用：' + error.message);
  }

  let preparedResult;

  try {
    preparedResult =
      prepareDatabase(
        readStoredGenealogyData() ||
        buildSample()
      );
  } catch (error) {
    console.warn(
      '族譜資料載入失敗，改用目前預設資料。',
      error
    );

    preparedResult =
      prepareDatabase(
        buildSample()
      );
  }

  genealogyData = preparedResult.prepared;

  if (
    !genealogyData.families ||
    !genealogyData.families.length
  ) {
    genealogyData =
      prepareDatabase(
        buildSample()
      ).prepared;
  }

  invalidateChildrenIndex();
  invalidateRelationshipGraph();

  applyRelationshipLineSettings();
  restoreCanvasBackground();

  // clean-break：舊 img_* / dataURL 圖片引用不再進入新的 L1nG v1 圖片 schema。
  const clearedImageRefs = clearUnsupportedImageRefs(genealogyData, bgSettings);
  if (clearedImageRefs > 0) {
    console.warn(`[圖片資產] 已清除 ${clearedImageRefs} 個舊圖片引用；請重新匯入或上傳圖片。`);
    save({ immediate:true });
    persistCanvasBackground();
  } else if (preparedResult.changed) {
    save();
  }

  setupAppMenus();
  setupHelpTooltipPortal();
  restoreFamilyPanelCollapsed();
  setupViewportResizeObserver();
  setupSearchSelects();

  // 首屏先渲染結構，再由資產層非阻塞載入圖片。
  // 圖片 ready 只刷新對應 DOM，不再阻塞 Skeleton 或重算 Layout。
  void preloadCurrentViewAssets();

  refreshFamilyUI();
  render();

  requestAnimationFrame(() => {
    fitScreen();
    requestAnimationFrame(hideAppSkeleton);
  });
}



/* ========【多語系介面】 設定 - 以繁中為主要來源，提供簡中與英文翻譯 ======== */
/*
 * 維護原則：
 * 1. HTML、主程式文案、註解與系統新資料一律以繁體中文撰寫。
 * 2. ZH_HANS_EXACT / ZH_HANS_UI_PHRASES 的「值」才是簡體中文翻譯；繁中仍是索引鍵。
 * 3. EN 的索引鍵同樣使用繁中，避免主程式再以簡中作為 canonical source。
 * 4. 網站資料只接受目前 L1nG v1 schema；不維護舊版網站存檔欄位相容。
 */
const LING_I18N = (() => {
  /* ========【簡中翻譯】 設定 - 繁中完整文案對應簡中顯示值 ======== */
  const ZH_HANS_EXACT = {"你加入的頭像、寵物圖片、人生照片、家庭合照與背景圖片會保存在這台裝置的瀏覽器中，不會自動上傳。":"你添加的头像、宠物图片、人生照片、家庭合照和背景图片会保存在这台设备的浏览器中，不会自动上传。","目前使用量":"当前使用量","已儲存圖片":"已保存图片","圖片使用空間":"图片使用空间","圖片處理":"图片处理","圖片會自動調整":"图片会自动调整","新增或更換圖片時，工具會依照用途自動調整成適合族譜使用的大小，不需要另外設定畫質。":"添加或更换图片时，工具会根据用途自动调整为适合族谱使用的大小，不需要另外设置画质。","備份會包含圖片":"备份会包含图片","匯出 JSON 備份時，目前族譜使用中的圖片會一起保存；之後重新匯入也會一併還原。":"导出 JSON 备份时，当前族谱使用中的图片会一起保存；之后重新导入也会一并还原。","清理空間":"清理空间","只會刪除目前已經沒有被任何人物、寵物、人生照片、家庭合照或背景使用的圖片，不會影響仍在族譜中使用的圖片。":"只会删除当前已不再被任何人物、宠物、人生照片、家庭合照或背景使用的图片，不会影响仍在族谱中使用的图片。","支援 JPG / PNG / GIF · 圖片會自動調整":"支持 JPG / PNG / GIF · 图片会自动调整","世代":"世代","血統資料已保留，但目前沒有可顯示的姓名":"血统数据已保留，但目前没有可显示的姓名","10 倍以上":"10 倍以上","IndexedDB 不可用":"IndexedDB 不可用","IndexedDB 被阻塞":"IndexedDB 被阻塞","localStorage 已滿！ 建議：\n1. 等待圖片遷移到 IndexedDB 完成\n2. 或在「主題設定」中清理未使用圖片\n3. 或匯出備份後清空瀏覽器資料":"localStorage 已满！ 建议：\n1. 等待图片迁移到 IndexedDB 完成\n2. 或在「主题设置」中清理未使用图片\n3. 或导出备份后清空浏览器数据","— 快速上手與快捷鍵":"— 快速上手与快捷键","—（無 / 未知）":"—（无 / 未知）","↺ 重置位置":"↺ 重置位置","⌨ 快捷鍵":"⌨ 快捷键","中圖（720px · 約 40–60KB/張 · 預設）":"中图（720px · 约 40–60KB/张 · 默认）","平衡（256px · 預設）":"平衡（256px · 默认）","編輯":"编辑","其他":"其他","加入家族":"加入家族","新增":"新增","新增模擬市民":"新增模拟市民","新增家族":"新建家族","新增圖片":"添加图片","新增寵物":"添加宠物","移出家族":"移出家族","上一張 (←)":"上一张 (←)","下一張 (→)":"下一张 (→)","不包含頭像 / 寵物頭像 / 背景圖":"不包含头像 / 宠物头像 / 背景图","不壓縮 · 保留原始格式與畫質":"不压缩 · 保持原始格式与质量","喪偶":"丧偶","中型圖片":"中图","中，容量是 localStorage 的":"中，容量是 localStorage 的","主題配色（漸層）":"主题配色（渐变）","也屬於：":"也属于：","親生":"亲生","人":"人","人物小傳、結局、備註…":"人物小传、结局、备注…","人生抱負":"人生抱负","人生階段":"人生阶段","人類":"人类","人魚":"人鱼","僅屬於本家族":"仅属于本家族","仇敵":"仇敌","從":"从","從家族移除":"从家族移除","倉鼠":"仓鼠","仙子":"仙子","以滑鼠位置為中心縮放":"以鼠标位置为中心缩放","伴侶":"伴侣","作家 / 學生 / 無":"作家 / 学生 / 无","使用提示":"使用提示","側邊欄":"侧边栏","儲存":"保存","儲存圖片失敗":"保存图片失败","資訊卡彈出視窗":"信息卡弹窗","兒童":"儿童","兄妹":"兄妹","兄弟姐妹":"兄弟姐妹","兄弟姐妹（血緣 / 收養）":"兄弟姐妹（血缘 / 收养）","兔子":"兔子","全選":"全选","全部模擬市民":"全部模拟市民","全部階段":"全部阶段","關係":"关系","關係，如 好友":"关系，如 好友","關聯":"关联","關聯階段（可選）":"关联阶段（可选）","關閉":"关闭","關閉 (Esc)":"关闭 (Esc)","關閉目前彈出視窗":"关闭当前弹窗","刪除":"删除","刪除圖片":"删除图片","刪除失敗":"删除失败","刪除寵物":"删除宠物","刪除模擬市民":"删除模拟市民","到相簿網格，或按":"到相册网格，或按","前任配偶":"前任配偶","勾選後建立「兄弟姐妹」關聯":"勾选后建立「兄弟姐妹」关联","勾選後自動加入對方父母清單":"勾选后自动加入对方父母列表","午夜藍調":"午夜蓝调","壓縮品質":"压缩档位","原始圖片":"原图","雙擊空白處":"双击空白处","取消":"取消","可選：拍攝場景、備註、想記錄的故事…":"可选：拍摄场景、备注、想记录的故事…","名字":"名字","吸血鬼":"吸血鬼","品種":"品种","圖片":"图片","圖片儲存在瀏覽器":"图片保存在浏览器","圖片檢視器":"图片查看器","圖片檢視器中切換上一張 / 下一張":"图片查看器中切换上一张 / 下一张","圖片編輯視窗內貼上剪貼簿圖片":"图片编辑器内粘贴剪贴板图片","在世":"在世","在編輯彈出視窗中快速儲存":"在编辑弹窗中快速保存","填滿（裁切超出部分）":"填充（裁剪超出部分）","備註":"备注","外星人":"外星人","外觀":"外观","主題設定":"主题设置","可在主題設定中檢視":"主题设置里可查看","大型圖片":"大图","頭像畫質":"头像清晰度","女":"女","如：幼兒期 / 婚禮合影 / 全家福":"如：幼儿期 / 婚礼合影 / 全家福","如：旺財 / 咪咪":"如：旺财 / 咪咪","如：柳溪 - 花園社區":"如：柳溪 - 花园社区","如：暢銷作家 / 靈魂伴侶…":"如：畅销作家 / 灵魂伴侣…","如：莫蒂默·高斯":"如：莫蒂默·高斯","如：衰老 / 溺水 / 火災…":"如：衰老 / 溺水 / 火灾…","如：金毛、波斯貓…":"如：金毛、波斯猫…","姓名":"姓名","嬰兒":"婴儿","子女":"子女","子女（血緣 / 收養）":"子女（血缘 / 收养）","儲存空間使用量":"存储用量","完整顯示（可能留白）":"完整显示（可能留白）","寵物":"宠物","寵物頭像":"宠物头像","寵物編輯彈出視窗":"宠物编辑弹窗","家族":"家族","家族名稱":"家族名称","家族名稱：":"家族名称：","匯入":"导入","匯入 JSON 備份":"导入 JSON 备份","匯入失敗：":"导入失败：","匯出":"导出","匯出 JSON":"导出 JSON","匯出 JSON 備份":"导出 JSON 备份","小型圖片":"小图","居住地":"居住地","已故":"已故","已選":"已选","師承":"师承","平移整個族譜視圖":"平移整个族谱视图","平衡":"平衡","重複排列":"平铺","年齡階段":"年龄阶段","幼兒":"幼儿","幼年":"幼年","幽靈":"幽灵","套用自訂漸層":"应用自定义渐变","目前":"当前","目前家族還沒有成員":"当前家族还没有成员","目前家族還沒有成員，無需移除。":"当前家族还没有成员，无需移除。","目前家族還沒有模擬市民，點選左側「 新增模擬市民」開始記錄":"当前家族还没有模拟市民，点击左侧「新增模拟市民」开始记录","性別":"性别","情人":"情人","成年":"成年","所屬家族":"所属家族","所有模擬市民都已在目前家族中":"所有模拟市民都已在当前家族中","拖曳卡片":"拖动卡片","拖曳色票選擇兩種顏色，即時預覽漸層效果":"拖动色板自选两种颜色，实时预览渐变效果","拖曳圖片檔案":"拖拽图片文件","拖曳空白處":"拖拽空白处","摯友":"挚友","提示":"提示","提示面板":"提示面板","搜尋…":"搜索…","搜尋姓名 / 特徵 / 職業…":"搜索姓名 / 特征 / 职业…","搜尋姓名…":"搜索姓名…","搜尋家族…":"搜索家族…","搜尋標題 / 模擬市民名稱 / 備註…":"搜索标题 / 模拟市民名称 / 备注…","搜尋，按":"搜索，按","支援":"支持","支援 JPG / PNG / GIF":"支持 JPG / PNG / GIF","新家族":"新家族","時仍會轉回 base64，與舊版工具完全互通":"时仍会转回 base64，与旧版工具完全互通","尚無關係連線":"暂无关系连线","目前沒有可清理的圖片":"暂无可清理的图片","尚未新增寵物":"暂无宠物","尚未設定背景圖片":"暂无背景图","有創造力, 熱愛戶外, 物質主義":"有创造力, 热爱户外, 物质主义","朋友":"朋友","機器人":"机器人","檢視器中":"查看器中","標題":"标题","標題 / 關聯階段 / 備註":"标题 / 关联阶段 / 备注","標題 / 模擬市民名稱 / 備註":"标题 / 模拟市民名称 / 备注","植物模擬市民":"植物模拟市民","模擬市民":"模拟市民","模擬市民頭像":"模拟市民头像","橘子汽水":"橘子汽水","計算中…":"正在计算…","死因":"死因","每張卡片顯示來源模擬市民與標題；點選開啟大圖檢視器":"每张卡片显示来源模拟市民与标题；点击打开大图查看器","每張圖片可設定：":"每张图片可设置：","沒有符合的項目":"没有匹配","沒有符合的圖片":"没有匹配的图片","瀏覽，":"浏览，","新增其他關係（好友 / 仇敵 / 師承…）":"添加其他关系（好友 / 仇敌 / 师承…）","新增已有模擬市民":"添加已有模拟市民","新增模擬市民到":"添加模拟市民到","清理完成":"清理完成","清理未使用的圖片":"清理未使用图片","清空":"清空","清除圖片":"清除图片","清除頭像":"清除头像","清除篩選":"清除筛选","移除背景":"移除背景","滾輪":"滚轮","點選選擇 · 或拖曳 · 或 Ctrl+V 貼上":"点击选择 · 或拖拽 · 或 Ctrl+V 粘贴","愛上雷神":"爱上雷神","父母 A（血緣）":"父母 A（血缘）","父母 B（可選）":"父母 B（可选）","特徵":"特征","特徵（逗號分隔）":"特征（逗号分隔）","狀態":"状态","狗":"狗","狼人":"狼人","貓":"猫","現任配偶":"现任配偶","電腦版":"电脑版","男":"男","相簿":"相册","相簿圖片編輯彈出視窗":"相册图片编辑弹窗","節省空間":"省空间","知道了":"知道了","確定刪除目前家族嗎？\n人物本身不會被刪除。":"确定删除当前家族吗？\n人物本身不会被删除。","確定刪除這個模擬市民嗎？此操作會同時清除相關關係。":"确定删除这个模拟市民吗？此操作会同时清除相关关系。","離婚":"离婚","種族":"种族","種類":"种类","移除":"移除","簡中":"简中","簡介":"简介","貼上截圖":"粘贴截图","繁中":"繁中","編輯模擬市民 →":"编辑模拟市民 →","編輯模擬市民彈出視窗":"编辑模拟市民弹窗","老年":"老年","職業":"职业","職業 / 備註":"职业 / 备注","背景圖片":"背景图","自動切換為「自由排列」並儲存新位置":"自动切换为「自由排列」并保存新位置","自動適應螢幕":"自动适应屏幕","自訂":"自定义","至少需要保留一個家族。":"至少需要保留一个家族。","選單":"菜单","蔓越莓氣泡":"蔓越莓气泡","蜜桃烏龍":"蜜桃乌龙","蜥蜴":"蜥蜴","視圖與佈局":"视图与布局","模擬市民篩選":"模拟市民筛选","訂婚":"订婚","語言 / Language":"语言 / Language","請輸入家族名稱。":"请输入家族名称。","高畫質":"超清","跨模擬市民":"跨模拟市民","還沒有任何相簿圖片。 開啟某個模擬市民的編輯彈出視窗 →「 相簿」新增圖片後，會在這裡顯示。":"还没有任何相册图片。 打开某个模拟市民的编辑弹窗 →「相册」添加图片后，会在这里显示。","尚未新增人生照片":"还没有相册图片","顯示方式":"适应方式","透明度：":"透明度：","配偶":"配偶","青少年":"青少年","青年":"青年","青檸茉莉":"青柠茉莉","頂端支援按":"顶部支持按","領養":"领养","領養關係":"领养关系","顏色 1":"颜色 1","顏色 2":"颜色 2","首次開啟會自動把舊資料（base64）遷移到 IndexedDB":"首次打开会自动把旧数据（base64）迁移到 IndexedDB","馬":"马","魔法師":"魔法师","魚":"鱼","鳥":"鸟","（不指定）":"（不指定）","（不顯示）":"（不显示）","（多張圖片 / 不同階段 / 合影）":"（多张图片 / 不同阶段 / 合影）","（已刪除）":"（已删除）","（未命名）":"（未命名）","（未歸屬）":"（未归属）","（每條連線獨立設定）":"（每条连线独立设置）","（該模擬市民擁有的寵物）":"（该模拟市民拥有的宠物）","（預設）":"（默认）","，並一鍵":"，并一键","：為模擬市民新增多張圖片":"：为模拟市民添加多张图片","：檢視所有模擬市民的相簿圖片":"：查看所有模拟市民的相册图片","顯示標註":"显示标注","檢視模式":"查看模式","高畫質（384px）":"超清（384px）","高畫質（1440px · 約 150–250KB/張）":"高清（1440px · 约 150–250KB/张）","他們仍保留在模擬市民池中，可隨時再次加入任何家族。":"他们仍保留在模拟市民池中，可随时再次加入任何家族。","勾選後點選「加入家族」即可讓它們出現在目前家族的族譜中。":"勾选后点击「加入家族」即可让它们出现在当前家族的族谱中。","圖片資料儲存在瀏覽器的 IndexedDB 中（容量數十 MB），localStorage 僅儲存索引。匯出 JSON 時會自動轉回 base64，與舊版工具完全相容。":"图片数据保存在浏览器的 IndexedDB 中（容量数十 MB），localStorage 只保存索引。导出 JSON 时会自动转回 base64，与旧版工具完全兼容。","支援拖曳圖片到此處，或在編輯器內按 Ctrl+V 貼上截圖":"支持拖拽图片到此处，或在编辑器内按 Ctrl+V 粘贴截图","每條連線可擁有獨立的關係；標註在畫布上可拖曳，避免遮擋卡片。":"每条连线可拥有独立的关系标注；标注在画布上可拖动，避免遮挡卡片。","圖片儲存":"图片存储","大圖（1080px · 約 80–120KB/張）":"大图（1080px · 约 80–120KB/张）","相簿圖片畫質":"相册图片清晰度","相簿瀏覽器":"相册浏览器","模擬市民相簿":"角色相册","選擇圖片":"选择图片","搜尋姓名 / 職業 / 居住地…":"搜索姓名 / 职业 / 居住地…","自動排列":"自动布局","未鎖定":"未锁定","標註未鎖":"标注未锁","畫布操作":"画布操作","原始圖片（不壓縮 · 大小不限）":"原图（不压缩 · 大小不限）","刪除家族":"删除家族","清理未使用圖片":"清理未使用图片","小圖（512px · 約 20–30KB/張）":"小图（512px · 约 20–30KB/张）","節節省空間（160px）":"省空间（160px）","圖片資料儲存在瀏覽器的 IndexedDB 中（可用空間通常遠大於 localStorage），localStorage 僅儲存索引。匯出 JSON 時會自動轉回 base64，並維持與舊版工具的相容性。":"图片数据保存在浏览器的 IndexedDB 中（容量数十 MB），localStorage 只保存索引。导出 JSON 时会自动转回 base64，与旧版工具完全兼容。","節省空間（192px）":"省空间（192px）","平衡（384px · 預設）":"平衡（384px · 默认）","高畫質（768px）":"超清（768px）","192px · 約 10–16KB/張":"192px · 约 10–16KB/张","384px · 約 30–50KB/張":"384px · 约 30–50KB/张","768px · 約 70–130KB/張":"768px · 约 70–130KB/张","小型圖片（512px · 約 20–30KB/張）":"小图（512px · 约 20–30KB/张）","中型圖片（720px · 約 40–60KB/張 · 預設）":"中图（720px · 约 40–60KB/张 · 默认）","大型圖片（1080px · 約 80–120KB/張）":"大图（1080px · 约 80–120KB/张）","原始圖片（不壓縮 · 不限大小）":"原图（不压缩 · 大小不限）","目前品質：":"当前档位：","僅套用於之後上傳的頭像。":"仅对新上传头像生效。","僅套用於之後上傳的圖片。":"仅对新上传图片生效。","顯示關係":"显示关系","隱藏關係":"隐藏关系","鎖定關係":"锁定关系","解鎖關係":"解锁关系","重設關係位置":"重置关系位置","每條連線可擁有獨立的關係；關係名稱可在畫布上拖曳，避免遮擋卡片。":"每条连线可拥有独立的关系；关系名称可在画布上拖动，避免遮挡卡片。","L1nG 晴空":"L1nG 晴空","森霧鼠尾草":"森雾鼠尾草","莓果薄暮":"莓果薄暮","琥珀紙頁":"琥珀纸页","午夜靛藍":"午夜靛蓝","重設":"重置","重設介面設定":"重置界面设置","重建範例資料":"重建示例数据","「重設介面設定」不會刪除族譜資料；「重建範例資料」會以繁中預設範例重新建立目前資料。":"“重置界面设置”不会删除族谱数据；“重建示例数据”会以繁中默认示例重新建立当前数据。","介面設定已恢復預設。":"界面设置已恢复默认。","已重建繁中範例資料。":"已重建繁中示例数据。","請確認":"请确认","輸入資料":"输入数据","重設卡片位置":"重置卡片位置","重設位置":"重置位置","永久刪除模擬市民":"永久删除模拟市民","永久刪除":"永久删除","無法刪除家族":"无法删除家族","資料未完成":"数据未完成","父母":"父母","暫無更多資訊":"暂无更多信息","恢復主題、背景、側邊欄寬度、檢視模式與圖片品質等介面設定？":"恢复主题、背景、侧边栏宽度、查看模式与图片质量等界面设置？","族譜人物、關係與卡片位置不會被刪除。":"族谱人物、关系与卡片位置不会被删除。","這會刪除目前族譜資料，並重新建立繁體中文的預設範例。":"这会删除当前族谱数据，并重新建立繁体中文的默认示例。","此操作無法復原，建議先匯出 JSON 備份。":"此操作无法撤销，建议先导出 JSON 备份。","儲存空間不足":"存储空间不足","儲存失敗":"保存失败","背景圖片設定儲存失敗。":"背景图片设置保存失败。","圖片處理失敗":"图片处理失败","背景處理失敗":"背景处理失败","移除背景圖片":"移除背景图片","確定清除目前背景圖片嗎？":"确定清除当前背景图片吗？","將掃描所有未被引用的圖片並刪除。確定繼續嗎？":"将扫描所有未被引用的图片并删除。确定继续吗？","開始清理":"开始清理","尚未選擇圖片":"尚未选择图片","請先選擇一張圖片":"请先选择一张图片","原始圖片容量提醒":"原始图片容量提醒","是否仍要儲存原始圖片？":"是否仍要保存原始图片？","IndexedDB 容量雖然較大，但大圖片仍會快速佔滿空間。":"IndexedDB 容量虽然较大，但大图片仍会快速占满空间。","仍要儲存":"仍要保存","請填寫寵物名字":"请填写宠物名字","請填寫姓名":"请填写姓名","請至少選擇一個所屬家族":"请至少选择一个所属家族","沒有可移除的成員":"没有可移除的成员","匯入失敗":"导入失败","自訂文字（可選）":"自定义文字（可选）","張圖片":"张图片","暫無其他關係":"暂无其他关系","還沒有任何模擬市民":"还没有任何模拟市民","請選擇圖片檔案":"请选择图片文件","圖片載入失敗":"图片加载失败","檔案讀取失敗":"文件读取失败","目前瀏覽器已自動改用備用圖片儲存方式":"当前浏览器 IndexedDB 不可用，图片以 base64 保存在 localStorage","他們仍保留在模擬市民池中。":"他们仍保留在模拟市民池中。","點選選擇…":"点击选择…","點選選擇家族（可多選）…":"点击选择家族（可多选）…","點選選擇（可多選）…":"点击选择（可多选）…","選擇目標…":"选择目标…","還沒有任何相簿圖片。":"还没有任何相册图片。","開啟某個模擬市民的編輯彈出視窗 →「相簿」新增圖片後，會在這裡顯示。":"打开某个模拟市民的编辑弹窗 →「相册」添加图片后，会在这里显示。"};

  /* ========【英文翻譯】 設定 - 繁中完整文案對應英文顯示值 ======== */
  const EN = {"你加入的頭像、寵物圖片、人生照片、家庭合照與背景圖片會保存在這台裝置的瀏覽器中，不會自動上傳。":"Portraits, pet images, life photos, family photos, and backgrounds are stored in this browser on this device and are not uploaded automatically.","目前使用量":"Current Usage","已儲存圖片":"Saved Images","圖片使用空間":"Image Storage","圖片處理":"Image Handling","圖片會自動調整":"Images Are Adjusted Automatically","新增或更換圖片時，工具會依照用途自動調整成適合族譜使用的大小，不需要另外設定畫質。":"When you add or replace an image, the tool automatically adjusts it for its use in the genealogy. No quality setting is needed.","備份會包含圖片":"Backups Include Images","匯出 JSON 備份時，目前族譜使用中的圖片會一起保存；之後重新匯入也會一併還原。":"When you export a JSON backup, images currently used by the genealogy are included and restored when you import the backup again.","清理空間":"Free Up Space","只會刪除目前已經沒有被任何人物、寵物、人生照片、家庭合照或背景使用的圖片，不會影響仍在族譜中使用的圖片。":"Only images no longer used by any Sim, pet, life photo, family photo, or background are removed. Images still in use are kept.","支援 JPG / PNG / GIF · 圖片會自動調整":"Supports JPG / PNG / GIF · images are adjusted automatically","世代":"Generation","血統資料已保留，但目前沒有可顯示的姓名":"Lineage data is preserved, but no names are currently available","放開即可匯入族譜檔案":"Drop to import the genealogy file","支援遊戲族譜 ZIP 與 JSON 備份":"Supports game genealogy ZIP and JSON backups","正在匯入 JSON 備份…":"Importing JSON backup…","不支援這個檔案。請使用遊戲族譜 ZIP 或 JSON 備份。":"Unsupported file. Use a game genealogy ZIP or JSON backup.","請一次只拖曳一個族譜檔案。":"Drop one genealogy file at a time.","模擬市民族譜工具":"The Sims 4 Genealogy Tool","全部階段":"All Life Stages","嬰兒":"Infant","幼兒":"Toddler","兒童":"Child","青少年":"Teen","青年":"Young Adult","成年":"Adult","老年":"Elder","幼年":"Young","匯入":"Import","匯出":"Export","外觀":"Appearance","提示":"Help","家族":"Family","新增家族":"New Family","刪除家族":"Delete Family","模擬市民":"Sims","新增模擬市民":"Add Sim","全部模擬市民":"All Sims","加入家族":"Add to Family","移出家族":"Remove from Family","相簿":"Gallery","相簿瀏覽器":"Gallery Browser","視圖與佈局":"View & Layout","檢視模式":"View Mode","自動排列":"Auto Layout","未鎖定":"Unlocked","↺ 重置位置":"↺ Reset Positions","顯示標註":"Show Labels","隱藏標註":"Hide Labels","標註未鎖":"Labels Unlocked","標註已鎖":"Labels Locked","電腦版":"Desktop","編輯模擬市民":"Edit Sim","每條連線可擁有獨立的關係；標註在畫布上可拖曳，避免遮擋卡片。":"Each connection can have its own relationship label. Drag labels on the canvas to keep them clear of cards.","模擬市民頭像":"Sim Portraits","選擇圖片":"Choose Image","清除頭像":"Clear Portrait","支援 JPG / PNG / GIF":"Supports JPG / PNG / GIF","姓名":"Name","人生階段":"Life Stage","性別":"Gender","男":"Male","女":"Female","其他":"Other","狀態":"Status","在世":"Alive","幽靈":"Ghost","已故":"Deceased","種族":"Occult Type","（不顯示）":"(Hidden)","(不顯示)":"(Hidden)","人類":"Human","吸血鬼":"Vampire","外星人":"Alien","狼人":"Werewolf","人魚":"Mermaid","魔法師":"Spellcaster","仙子":"Fairy","植物模擬市民":"PlantSim","機器人":"Robot","領養關係":"Adoption","親生":"Biological","領養":"Adopted","死因":"Cause of Death","職業 / 備註":"Career / Notes","居住地":"Residence","人生抱負":"Aspiration","所屬家族":"Families","父母 A（血緣）":"Parent A (Biological)","父母 B（可選）":"Parent B (Optional)","現任配偶":"Current Spouse","前任配偶":"Former Spouse","子女（血緣 / 收養）":"Children (Biological / Adopted)","勾選後自動加入對方父母清單":"Selected Sims are automatically updated with this Sim as a parent.","兄弟姐妹（血緣 / 收養）":"Siblings (Biological / Adopted)","勾選後建立「兄弟姐妹」關聯":"Selecting creates a sibling relationship.","特徵（逗號分隔）":"Traits (comma-separated)","簡介":"Biography","寵物":"Pets","（該模擬市民擁有的寵物）":"(Pets owned by this Sim)","新增寵物":"Add Pet","（多張圖片 / 不同階段 / 合影）":"(Multiple photos / life stages / group photos)","新增圖片":"Add Photo","支援拖曳圖片到此處，或在編輯器內按 Ctrl+V 貼上截圖":"Drag images here, or press Ctrl+V in the editor to paste a screenshot.","關係":"Relationships","（每條連線獨立設定）":"(Configured per connection)","新增其他關係（好友 / 仇敵 / 師承…）":"Add Other Relationship (Friend / Rival / Mentor…)","新增":"Add","刪除模擬市民":"Delete Sim","取消":"Cancel","儲存":"Save","編輯寵物":"Edit Pet","寵物頭像":"Pet Portrait","名字":"Name","種類":"Species","狗":"Dog","貓":"Cat","馬":"Horse","兔子":"Rabbit","鳥":"Bird","倉鼠":"Hamster","魚":"Fish","蜥蜴":"Lizard","品種":"Breed","年齡階段":"Age Stage","刪除寵物":"Delete Pet","編輯圖片":"Edit Photo","圖片":"Image","點選選擇 · 或拖曳 · 或 Ctrl+V 貼上":"Click to choose · drag and drop · or paste with Ctrl+V","清除圖片":"Clear Image","標題":"Title","關聯階段（可選）":"Linked Life Stage (Optional)","（不指定）":"(Not specified)","備註":"Notes","刪除圖片":"Delete Image","圖片檢視器":"Image Viewer","清除篩選":"Clear Filter","關閉":"Close","編輯":"Edit","新增已有模擬市民":"Add Existing Sim","新增模擬市民到":"Add Sims to","勾選後點選「加入家族」即可讓它們出現在目前家族的族譜中。":"Select Sims and choose “Add to Family” to include them in the current family tree.","全選":"Select All","清空":"Clear","已選":"Selected","人":"Sim(s)","從家族移除":"Remove from Family","從":"Remove from","移除":"Remove","他們仍保留在模擬市民池中，可隨時再次加入任何家族。":"They remain in the global Sim pool and can be added to any family again later.","主題設定":"Theme Settings","主題配色（漸層）":"Theme Colors (Gradient)","顏色 1":"Color 1","顏色 2":"Color 2","拖曳色票選擇兩種顏色，即時預覽漸層效果":"Choose two colors to preview the gradient in real time.","套用自訂漸層":"Apply Custom Gradient","背景圖片":"Background Image","尚未設定背景圖片":"No background image","移除背景":"Remove Background","透明度：":"Opacity:","顯示方式":"Fit Mode","填滿（裁切超出部分）":"Cover (crop overflow)","完整顯示（可能留白）":"Contain (may leave empty space)","重複排列":"Tile","頭像畫質":"Portrait Quality","節省空間（160px）":"Compact (160px)","平衡（256px · 預設）":"Balanced (256px · Default)","高畫質（384px）":"HD (384px)","相簿圖片畫質":"Gallery Image Quality","壓縮品質":"Compression Preset","小型圖片（512px · 約 20–30KB/張）":"Small (512px · about 20–30KB/image)","中型圖片（720px · 約 40–60KB/張 · 預設）":"Medium (720px · about 40–60KB/image · Default)","大型圖片（1080px · 約 80–120KB/張）":"Large (1080px · about 80–120KB/image)","高畫質（1440px · 約 150–250KB/張）":"HD (1440px · about 150–250KB/image)","原始圖片（不壓縮 · 不限大小）":"Original (no compression · no size limit)","儲存空間使用量":"Storage Usage","計算中…":"Calculating…","清理未使用的圖片":"Clean Unused Images","圖片資料儲存在瀏覽器的 IndexedDB 中（可用空間通常遠大於 localStorage），localStorage 僅儲存索引。匯出 JSON 時會自動轉回 base64，並維持與舊版工具的相容性。":"Images are stored in the browser’s IndexedDB while localStorage keeps only references. JSON export converts them back to base64 for compatibility with older versions.","使用提示":"Help & Tips","— 快速上手與快捷鍵":"— Quick Start & Shortcuts","畫布操作":"Canvas Controls","拖曳空白處":"Drag empty space","平移整個族譜視圖":"Pan the family tree","滾輪":"Mouse wheel","以滑鼠位置為中心縮放":"Zoom around the pointer","雙擊空白處":"Double-click empty space","自動適應螢幕":"Fit to screen","拖曳卡片":"Drag a card","自動切換為「自由排列」並儲存新位置":"Automatically switches to Free Layout and saves the new position","側邊欄":"Sidebar","：檢視所有模擬市民的相簿圖片":": browse gallery images from all Sims","頂端支援按":"Search by","標題 / 模擬市民名稱 / 備註":"title / Sim name / notes","搜尋，按":"and filter by","模擬市民篩選":"Sim","每張卡片顯示來源模擬市民與標題；點選開啟大圖檢視器":"Each card shows the source Sim and title; click to open the image viewer.","檢視器中":"In the viewer, use","跨模擬市民":"across Sims","瀏覽，":"to browse,","不包含頭像 / 寵物頭像 / 背景圖":"Portraits, pet portraits, and background images are excluded.","模擬市民相簿":"Sim Gallery","編輯模擬市民 →":"Edit Sim →","：為模擬市民新增多張圖片":": add multiple images to a Sim","每張圖片可設定：":"Each image can include:","標題 / 關聯階段 / 備註":"title / linked life stage / notes","支援":"Supports","拖曳圖片檔案":"dragging image files","到相簿網格，或按":"into the gallery grid, or press","貼上截圖":"to paste a screenshot","圖片儲存":"Image Storage","圖片儲存在瀏覽器":"Images are stored in the browser’s","中，容量是 localStorage 的":"with much more capacity than localStorage","10 倍以上":"(10× or more)","首次開啟會自動把舊資料（base64）遷移到 IndexedDB":"On first launch, legacy base64 images are migrated to IndexedDB automatically.","匯出 JSON":"Exporting JSON","時仍會轉回 base64，與舊版工具完全互通":"converts images back to base64 for full backward compatibility.","可在主題設定中檢視":"Theme Settings shows","，並一鍵":"and lets you","⌨ 快捷鍵":"⌨ Shortcuts","關閉目前彈出視窗":"Close the current dialog","圖片檢視器中切換上一張 / 下一張":"Previous / next image in the viewer","圖片編輯視窗內貼上剪貼簿圖片":"Paste a clipboard image in the photo editor","在編輯彈出視窗中快速儲存":"Quick-save in an editor dialog","知道了":"Got it","選單":"Menu","家族名稱":"Family Name","搜尋姓名 / 職業 / 居住地…":"Search name / career / residence…","匯入 JSON 備份":"Import JSON Backup","匯出 JSON 備份":"Export JSON Backup","如：莫蒂默·高斯":"e.g. Mortimer Goth","如：衰老 / 溺水 / 火災…":"e.g. old age / drowning / fire…","作家 / 學生 / 無":"Writer / Student / None","如：柳溪 - 花園社區":"e.g. Willow Creek - Garden District","如：暢銷作家 / 靈魂伴侶…":"e.g. Bestselling Author / Soulmate…","搜尋家族…":"Search families…","搜尋姓名…":"Search names…","有創造力, 熱愛戶外, 物質主義":"Creative, Loves Outdoors, Materialistic","人物小傳、結局、備註…":"Biography, ending, notes…","關係，如 好友":"Relationship, e.g. Friend","如：旺財 / 咪咪":"e.g. Mochi / Luna","如：金毛、波斯貓…":"e.g. Golden Retriever, Persian…","如：幼兒期 / 婚禮合影 / 全家福":"e.g. Toddler years / wedding / family portrait","可選：拍攝場景、備註、想記錄的故事…":"Optional: scene, notes, or the story you want to remember…","關閉 (Esc)":"Close (Esc)","上一張 (←)":"Previous (←)","下一張 (→)":"Next (→)","搜尋標題 / 模擬市民名稱 / 備註…":"Search title / Sim / notes…","搜尋姓名 / 特徵 / 職業…":"Search name / traits / career…","搜尋…":"Search…","目前":"Current","職業":"Career","尚無關係連線":"No relationship links","尚未新增寵物":"No pets","沒有符合的項目":"No matches","所有模擬市民都已在目前家族中":"All Sims are already in the current family","目前家族還沒有成員":"The current family has no members","（未命名）":"(Unnamed)","（預設）":"(Default)","—（無 / 未知）":"— (None / Unknown)","（未歸屬）":"(Unassigned)","僅屬於本家族":"Only in this family","關聯":"Relationship","（已刪除）":"(Deleted)","刪除":"Delete","尚未新增人生照片":"No gallery images yet","沒有符合的圖片":"No matching images","新家族":"New Family","家族名稱：":"Family name:","至少需要保留一個家族。":"At least one family must remain.","確定刪除目前家族嗎？\n人物本身不會被刪除。":"Delete the current family?\nThe Sims themselves will not be deleted.","請輸入家族名稱。":"Please enter a family name.","確定刪除這個模擬市民嗎？此操作會同時清除相關關係。":"Delete this Sim? Related relationships will also be removed.","目前家族還沒有成員，無需移除。":"The current family has no members to remove.","匯入失敗：":"Import failed:","清理完成":"Cleanup complete","目前沒有可清理的圖片":"There are no unused images to clean up.","刪除失敗":"Delete failed","IndexedDB 不可用":"IndexedDB is unavailable","IndexedDB 被阻塞":"IndexedDB is blocked","儲存圖片失敗":"Failed to save image","蜜桃烏龍":"Peach Oolong","橘子汽水":"Orange Soda","蔓越莓氣泡":"Cranberry Fizz","青檸茉莉":"Lime Jasmine","愛上雷神":"Thunder","午夜藍調":"Midnight Blue","節省空間":"Compact","平衡":"Balanced","高畫質":"Ultra HD","小型圖片":"Small","中型圖片":"Medium","大型圖片":"Large","原始圖片":"Original","不壓縮 · 保留原始格式與畫質":"No compression · keep original format and quality","配偶":"Spouse","訂婚":"Engaged","伴侶":"Partner","情人":"Lover","離婚":"Divorced","喪偶":"Widowed","子女":"Child","兄弟姐妹":"Siblings","兄妹":"Sibling","摯友":"Best Friend","朋友":"Friend","仇敵":"Rival","師承":"Mentor","自訂":"Custom","編輯模擬市民彈出視窗":"Edit Sim Dialog","寵物編輯彈出視窗":"Pet Editor Dialog","相簿圖片編輯彈出視窗":"Gallery Photo Editor Dialog","資訊卡彈出視窗":"Sim Info Dialog","提示面板":"Help Panel","語言 / Language":"Language","160px · 約 8–12KB/張":"160px · about 8–12KB/image","256px · 約 15–25KB/張":"256px · about 15–25KB/image","384px · 約 30–50KB/張":"384px · about 30–50KB/image","512px · 約 20–30KB/張":"512px · about 20–30KB/image","720px · 約 40–60KB/張":"720px · about 40–60KB/image","1080px · 約 80–120KB/張":"1080px · about 80–120KB/image","1440px · 約 150–250KB/張":"1440px · about 150–250KB/image","岡瑟·高斯":"Gunther Goth","柳溪 - 歐菲莉亞別墅":"Willow Creek - Ophelia Villa","財富創造者":"Fabulously Wealthy","衰老":"Old Age","雄心勃勃":"Ambitious","天才":"Genius","勢利":"Snob","商業":"Business","高斯家族創始人之一，已故。":"One of the founders of the Goth family. Deceased.","科妮莉亞·高斯":"Cornelia Goth","大家庭":"Big Happy Family","家庭觀念":"Family-Oriented","愛整潔":"Neat","美食家":"Foodie","無":"None","高斯家族女主人，已故。":"Matriarch of the Goth family. Deceased.","莫蒂默·高斯":"Mortimer Goth","暢銷作家":"Bestselling Author","午夜":"Midnight","黑貓":"Black Cat","有創造力":"Creative","浪漫":"Romantic","陰沈":"Gloomy","作家":"Writer","現任高斯家族族長。":"Current head of the Goth family.","貝拉·巴切勒":"Bella Bachelor","靈魂伴侶":"Soulmate","金毛":"Goldie","金毛尋回犬":"Golden Retriever","熱愛戶外":"Loves Outdoors","開朗":"Cheerful","愛調情":"Romantic","巴切勒家的女兒，嫁入高斯家。":"Daughter of the Bachelor family, married into the Goth family.","卡桑德拉·高斯":"Cassandra Goth","柳溪 - 花園社區":"Willow Creek - Garden District","卓越畫家":"Painter Extraordinaire","物質主義":"Materialistic","學生":"Student","莫蒂默和貝拉的女兒。":"Daughter of Mortimer and Bella.","亞歷山大·高斯":"Alexander Goth","電腦奇才":"Computer Whiz","莫蒂默和貝拉的兒子。":"Son of Mortimer and Bella.","高斯家族":"Goth Family","巴切勒家族":"Bachelor Family","節省空間（192px）":"Compact (192px)","平衡（384px · 預設）":"Balanced (384px · Default)","高畫質（768px）":"HD (768px)","192px · 約 10–16KB/張":"192px · about 10–16KB/image","768px · 約 70–130KB/張":"768px · about 70–130KB/image","顯示關係":"Show Relationships","隱藏關係":"Hide Relationships","鎖定關係":"Lock Relationships","解鎖關係":"Unlock Relationships","重設關係位置":"Reset Relationship Position","每條連線可擁有獨立的關係；關係名稱可在畫布上拖曳，避免遮擋卡片。":"Each connection can have its own relationship. Drag relationship labels on the canvas to keep them clear of cards.","L1nG 晴空":"L1nG Clear Sky","森霧鼠尾草":"Sage Mist","莓果薄暮":"Berry Dusk","琥珀紙頁":"Amber Paper","午夜靛藍":"Midnight Indigo","重設":"Reset","重設介面設定":"Reset Interface Settings","重建範例資料":"Rebuild Sample Data","「重設介面設定」不會刪除族譜資料；「重建範例資料」會以繁中預設範例重新建立目前資料。":"Reset Interface Settings keeps your genealogy data. Rebuild Sample Data replaces the current data with the default Traditional Chinese sample.","介面設定已恢復預設。":"Interface settings restored to defaults.","已重建繁中範例資料。":"Traditional Chinese sample data rebuilt.","請確認":"Confirm","輸入資料":"Enter Information","重設卡片位置":"Reset Card Positions","重設位置":"Reset Positions","永久刪除模擬市民":"Permanently Delete Sim","永久刪除":"Permanently Delete","無法刪除家族":"Cannot Delete Family","資料未完成":"Incomplete Information","父母":"Parents","暫無更多資訊":"No additional information","自由排列":"Free Layout","已鎖定":"Locked","恢復主題、背景、側邊欄寬度、檢視模式與圖片品質等介面設定？":"Restore theme, background, sidebar width, view mode, and image-quality settings?","族譜人物、關係與卡片位置不會被刪除。":"Genealogy Sims, relationships, and card positions will not be deleted.","這會刪除目前族譜資料，並重新建立繁體中文的預設範例。":"This will delete the current genealogy data and rebuild the default Traditional Chinese sample.","此操作無法復原，建議先匯出 JSON 備份。":"This cannot be undone. Export a JSON backup first if you want to keep the current data.","儲存空間不足":"Storage Full","儲存失敗":"Save Failed","背景圖片設定儲存失敗。":"Failed to save the background-image settings.","圖片處理失敗":"Image Processing Failed","背景處理失敗":"Background Processing Failed","移除背景圖片":"Remove Background Image","確定清除目前背景圖片嗎？":"Remove the current background image?","清理未使用圖片":"Clean Up Unused Images","將掃描所有未被引用的圖片並刪除。確定繼續嗎？":"Scan for all unreferenced images and delete them?","開始清理":"Start Cleanup","尚未選擇圖片":"No Image Selected","請先選擇一張圖片":"Choose an image first.","原始圖片容量提醒":"Original Image Size Warning","是否仍要儲存原始圖片？":"Save the original image anyway?","IndexedDB 容量雖然較大，但大圖片仍會快速佔滿空間。":"IndexedDB has more capacity, but large images can still fill it quickly.","仍要儲存":"Save Anyway","請填寫寵物名字":"Enter a pet name.","請填寫姓名":"Enter a name.","請至少選擇一個所屬家族":"Select at least one family.","沒有可移除的成員":"No Members to Remove","匯入失敗":"Import Failed","自訂文字（可選）":"Custom text (optional)","張圖片":"image(s)","暫無其他關係":"No other relationships","還沒有任何模擬市民":"No Sims yet","請選擇圖片檔案":"Choose an image file.","圖片載入失敗":"Image failed to load.","檔案讀取失敗":"File read failed.","目前瀏覽器 IndexedDB 不可用，圖片以 base64 存在 localStorage":"IndexedDB is unavailable in this browser. Images are stored as base64 in localStorage.","他們仍保留在模擬市民池中。":"They will remain in the global Sim pool.","世界之友":"Friend of the World","健美運動員":"Bodybuilder","兒童期":"Childhood","全家福":"Family Portrait","公敵":"Public Enemy","凍死":"Freezing","名人":"Celebrity","吸血鬼灼燒":"Vampire Sunlight","園藝大師":"Freelance Botanist","婚禮合影":"Wedding Photo","嬰兒期":"Infancy","尷尬死":"Embarrassment","平移整個族譜畫布":"Pan the family-tree canvas","幼兒期":"Toddler Years","度假照":"Vacation Photo","心臟病":"Cardiac Explosion","快捷鍵":"Shortcuts","情場達人":"Serial Romantic","憤怒死":"Anger","成年期":"Adulthood","拖曳調整側邊欄寬度；雙擊恢復預設寬度":"Drag to resize the sidebar; double-click to restore the default width","搜尋結果":"Search Results","暴曬":"Overheating","極限運動員":"Extreme Sports Enthusiast","模擬市民 4 族譜工具":"The Sims 4 Genealogy Tool","檢視與佈局":"View & Layout","河豚":"Pufferfish","派對王":"Party Animal","流星":"Meteorite","溺水":"Drowning","火災":"Fire","無所事事":"Fabulously Filthy","牛頭人花":"Cowplant","生日派對":"Birthday Party","生物博士":"Curator","畢業照":"Graduation Photo","確定":"Confirm","神秘死":"Mysterious Death","笑死":"Hysteria","美食大師":"Master Chef","羞憤死":"Mortification","老年期":"Elder Years","考古學家":"Archaeology Scholar","自然主義者":"Outdoor Enthusiast","蒸汽浴":"Steam","調整側邊欄寬度":"Resize sidebar","調酒大師":"Master Mixologist","豪宅大亨":"Mansion Baron","超級父母":"Super Parent","連環浪漫":"Serial Romantic","都市傳說":"Urban Legend","釣魚大師":"Angling Ace","電擊":"Electrocution","靈魂探索者":"Inner Peace","青年期":"Young Adulthood","音樂天才":"Musical Genius","飢餓":"Starvation","首席運動員":"Chief of Mischief","首領":"Leader of the Pack","點選選擇…":"Click to choose…","點選選擇家族（可多選）…":"Choose families (multiple allowed)…","點選選擇（可多選）…":"Choose options (multiple allowed)…","選擇目標…":"Choose a target…","還沒有任何相簿圖片。":"No gallery images yet.","開啟某個模擬市民的編輯彈出視窗 →「相簿」新增圖片後，會在這裡顯示。":"Open a Sim editor and add images under “Gallery” to display them here."};

  /* ========【簡中字元】 設定 - 繁中字元對應簡中字元 ======== */
  const HANT_HANS_CHAR_MAP = {"與":"与","業":"业","兩":"两","喪":"丧","個":"个","為":"为","義":"义","烏":"乌","樂":"乐","於":"于","亞":"亚","親":"亲","僅":"仅","從":"从","倉":"仓","們":"们","優":"优","會":"会","傳":"传","侶":"侣","側":"侧","儲":"储","兒":"儿","關":"关","養":"养","內":"内","岡":"冈","冊":"册","寫":"写","凍":"冻","擊":"击","創":"创","刪":"删","別":"别","動":"动","勢":"势","區":"区","單":"单","佔":"占","歷":"历","壓":"压","雙":"双","變":"变","號":"号","後":"后","嗎":"吗","啓":"启","員":"员","園":"园","圖":"图","場":"场","處":"处","備":"备","復":"复","頭":"头","嬰":"婴","學":"学","實":"实","寵":"宠","對":"对","尋":"寻","導":"导","將":"将","尷":"尴","層":"层","屬":"属","師":"师","帶":"带","並":"并","應":"应","開":"开","異":"异","張":"张","彈":"弹","歸":"归","當":"当","錄":"录","徹":"彻","徵":"征","態":"态","總":"总","憤":"愤","戶":"户","擴":"扩","掃":"扫","擬":"拟","擁":"拥","擇":"择","摯":"挚","擋":"挡","換":"换","據":"据","攝":"摄","敵":"敌","數":"数","無":"无","舊":"旧","時":"时","顯":"显","曬":"晒","暫":"暂","機":"机","條":"条","來":"来","極":"极","檸":"柠","標":"标","棧":"栈","欄":"栏","樹":"树","檔":"档","歐":"欧","畢":"毕","氣":"气","沈":"沉","沒":"没","潔":"洁","淺":"浅","瀏":"浏","漸":"渐","滾":"滚","滿":"满","靈":"灵","災":"灾","點":"点","燒":"烧","熱":"热","愛":"爱","狀":"状","獨":"独","貓":"猫","環":"环","現":"现","電":"电","畫":"画","暢":"畅","礎":"础","確":"确","禮":"礼","離":"离","種":"种","稱":"称","篩":"筛","簡":"简","類":"类","約":"约","級":"级","線":"线","組":"组","結":"结","統":"统","繼":"继","續":"续","緩":"缓","編":"编","緣":"缘","縮":"缩","網":"网","職":"职","聯":"联","髒":"脏","腦":"脑","藝":"艺","節":"节","藍":"蓝","雖":"虽","觀":"观","視":"视","覽":"览","觸":"触","計":"计","訂":"订","認":"认","讓":"让","議":"议","記":"记","設":"设","該":"该","語":"语","誤":"误","說":"说","請":"请","讀":"读","調":"调","譜":"谱","貝":"贝","負":"负","財":"财","敗":"败","質":"质","貼":"贴","轉":"转","輪":"轮","載":"载","較":"较","輯":"辑","輸":"输","邊":"边","達":"达","遷":"迁","運":"运","還":"还","這":"这","連":"连","適":"适","選":"选","釣":"钓","鈕":"钮","鋪":"铺","銷":"销","鎖":"锁","鍵":"键","長":"长","閉":"闭","間":"间","陰":"阴","階":"阶","隨":"随","隱":"隐","頂":"顶","項":"项","預":"预","領":"领","題":"题","顏":"颜","額":"额","風":"风","飢":"饥","餓":"饿","馬":"马","魚":"鱼","鳥":"鸟","齡":"龄","龍":"龙"};

  /* ========【簡中介面詞彙】 設定 - 台灣用語對應簡中常用介面詞彙 ======== */
  const ZH_HANS_UI_PHRASES = {"主題設定":"主题设置","設定":"设置","預設":"默认","自訂":"自定义","套用自訂":"应用自定义","漸層":"渐变","相簿":"相册","儲存":"保存","資料":"数据","搜尋":"搜索","支援":"支持","滑鼠":"鼠标","螢幕":"屏幕","貼上":"粘贴","剪貼簿":"剪贴板","檔案":"文件","快取":"缓存","記憶體":"内存","匯入":"导入","匯出":"导出","相容":"兼容","拖曳":"拖动","新增":"新建","點選":"点击","上傳":"上传","下拉選單":"下拉列表","檢視器":"查看器","檢視模式":"查看模式","檢視所有":"查看所有","畫質":"质量","畫質設定":"画质档位","壓縮品質":"压缩档位","目前品質":"当前档位","節省空間":"省空间","高畫質":"高清","原始圖片":"原图","不壓縮 · 保留原始格式與畫質":"不压缩 · 保持原始格式与质量","顯示方式":"适应方式","填滿（裁切超出部分）":"填充（裁剪超出部分）","裁切":"裁剪","重複排列":"平铺","儲存空間使用量":"存储用量","計算中":"正在计算","目前家族":"当前家族","目前":"当前","即時":"实时","頂端":"顶部","首次開啟":"首次打开","開啟":"打开","關閉":"关闭","彈出視窗":"弹窗","網格":"网格","來源模擬市民":"来源模拟市民","模擬市民篩選":"模拟市民筛选","模擬市民名稱":"模拟市民名称","模擬市民相簿":"模拟市民相册","圖片編輯視窗":"图片编辑器","圖片檢視器":"图片查看器","數十 MB":"数十 MB","localStorage 僅儲存索引":"localStorage 只保存索引","側邊欄":"侧边栏","備註":"备注","資訊":"信息","選單":"菜单","清單":"列表","可在主題設定中檢視":"主题设置里可查看","這裡":"这里","移除嗎":"移除吗","標註":"标注","佈局":"布局","檢視":"查看","模擬市民":"模拟市民","非同步":"异步","啟動":"启动","重設":"重置","堆疊":"栈"};
  const ZH_HANS_UI_KEYS = Object.keys(ZH_HANS_UI_PHRASES).sort((a,b) => b.length - a.length);

Object.assign(ZH_HANS_EXACT, {
  '批量移除':'批量移除'
});

Object.assign(ZH_HANS_EXACT, {
  '匯出資料': '导出资料',
  '可選擇匯出目前完整族譜圖片，或匯出 JSON 備份。': '可选择导出当前完整族谱图片，或导出 JSON 备份。',
  '族譜圖片': '族谱图片',
  '匯出目前完整族譜畫面，不受目前縮放或平移視角限制。': '导出当前完整族谱画面，不受当前缩放或平移视角限制。',
  '標準': '标准',
  '輸出目前完整族譜尺寸': '输出当前完整族谱尺寸',
  '輸出 2× 尺寸，適合一般分享與保存': '输出 2× 尺寸，适合一般分享与保存',
  '超高畫質': '超高清',
  '輸出 3× 尺寸，適合高解析保存': '输出 3× 尺寸，适合高解析保存',
  '匯出族譜圖片': '导出族谱图片',
  'JSON 備份': 'JSON 备份',
  '保留完整族譜資料與圖片，可再次匯入本工具繼續編輯。': '保留完整族谱数据与图片，可再次导入本工具继续编辑。',
  'JSON 備份會包含目前族譜資料，並將已儲存在瀏覽器中的圖片一併轉回 base64。': 'JSON 备份会包含当前族谱数据，并将已保存在浏览器中的图片一并转回 base64。',
  '正在匯出族譜圖片…': '正在导出族谱图片…',
  '族譜圖片匯出完成': '族谱图片导出完成',
  '族譜圖片匯出失敗': '族谱图片导出失败'
});


Object.assign(ZH_HANS_EXACT, {
  '選取': '选择',
  '拖曳': '拖动',
  '選取工具：拖曳空白處框選人物': '选择工具：拖动空白处框选人物',
  '拖曳工具：拖曳畫布進行平移': '拖动工具：拖动画布进行平移',
  '自動排列時，拖曳空白處平移整個族譜畫布；滾輪以滑鼠位置為中心縮放': '自动布局时，拖动空白处平移整个族谱画布；滚轮以鼠标位置为中心缩放',
  '自由排列會出現選取與拖曳工具：選取工具下拖曳空白處可框選人物；拖曳工具下拖曳畫布可平移視角': '自由排列会显示选择与拖动工具：选择工具下拖动空白处可框选人物；拖动工具下拖动画布可平移视角',
  '選取工具支援 Shift + 點擊增減多選、Ctrl / Cmd + A 全選目前畫布人物；拖曳任一已選人物可整組移動': '选择工具支持 Shift + 点击增减多选、Ctrl / Cmd + A 全选当前画布人物；拖动任一已选人物可整组移动',
  '使用選取工具時可按住 Space 暫時切換成畫布拖曳，放開後回到選取工具': '使用选择工具时可按住 Space 暂时切换为画布拖动，松开后回到选择工具'
});

Object.assign(ZH_HANS_EXACT, {
  '畫布與佈局': '画布与布局',
  '平移整個族譜畫布；': '平移整个族谱画布；',
  '超過拖曳門檻後會自動切換為「自由排列」，並儲存新位置': '超过拖动门槛后会自动切换为「自由排列」，并保存新位置',
  '智慧對齊輔助線': '智能对齐辅助线',
  '會在卡片接近其他卡片的左 / 中 / 右或上 / 中 / 下位置時自動吸附': '会在卡片接近其他卡片的左 / 中 / 右或上 / 中 / 下位置时自动吸附',
  '等距吸附': '等距吸附',
  '支援水平與垂直排列；接近相同間距時會顯示兩段間距與數值，只移動目前拖曳的卡片': '支持水平与垂直排列；接近相同间距时会显示两段间距与数值，只移动当前拖动的卡片',
  '鎖定排列': '锁定排列',
  '避免誤拖；': '避免误拖；',
  '會清除目前模式的手動位置並恢復自動樹狀佈局': '会清除当前模式的手动位置并恢复自动树状布局',
  '家族欄分隔線': '侧边栏分隔线',
  '側邊欄分隔線': '侧边栏分隔线',
  '可拖曳調整寬度；雙擊分隔線恢復預設寬度': '可拖动调整宽度；双击分隔线恢复默认宽度',
  '關係與關係位置': '关系与关系位置',
  '顯示 / 隱藏關係': '显示 / 隐藏关系',
  '控制畫布上的關係名稱是否顯示': '控制画布上的关系名称是否显示',
  '關係未鎖定時可直接': '关系未锁定时可直接',
  '拖曳關係名稱': '拖动关系名称',
  '；接近原始水平或垂直位置時會分別吸附回原位': '；接近原始水平或垂直位置时会分别吸附回原位',
  '可避免誤拖關係名稱': '可避免误拖关系名称',
  '已移動的關係名稱可在模擬市民編輯視窗的關係清單中按': '已移动的关系名称可在模拟市民编辑弹窗的关系列表中按',
  '回到自動位置': '回到自动位置',
  '匯出與備份': '导出与备份',
  '點選頂端': '点击顶部',
  '可選擇': '可选择',
  '或': '或',
  '會輸出目前完整族譜，不受目前縮放或平移視角限制': '会输出当前完整族谱，不受当前缩放或平移视角限制',
  '圖片會保留目前的': '图片会保留当前的',
  '卡片位置 / 關係位置 / 主題 / 背景': '卡片位置 / 关系位置 / 主题 / 背景',
  '，但不包含頂端導覽、家族欄、智慧輔助線或拖曳狀態': '，但不包含顶部导航、侧边栏、智能辅助线或拖动状态',
  '族譜圖片可選擇': '族谱图片可选择',
  '標準（1×） / 高畫質（2×） / 超高畫質（3×）': '标准（1×） / 高清（2×） / 超高清（3×）',
  '保留可再次匯入的完整族譜資料，瀏覽器中的圖片會一併轉回 base64': '保留可再次导入的完整族谱数据，浏览器中的图片会一并转回 base64',
  '中，容量通常遠大於 localStorage': '中，容量通常远大于 localStorage',
  '復原上一個卡片或關係名稱拖曳；輸入欄位內仍使用瀏覽器原生文字復原': '撤销上一个卡片或关系名称拖动；输入框内仍使用浏览器原生文字撤销',
  '重做上一個拖曳操作': '重做上一个拖动操作'
});

Object.assign(ZH_HANS_EXACT, {
  '使用說明':'使用说明',
  '電腦版：':'电脑版：',
  'JSON 備份會包含完整族譜資料與圖片，可於之後重新匯入並繼續編輯':'JSON 备份会包含完整族谱数据与图片，可在之后重新导入并继续编辑',
  '頭像、相簿圖片、寵物圖片與背景圖片會儲存在目前使用的瀏覽器中，不會自動上傳到網站或伺服器':'头像、相册图片、宠物图片与背景图片会保存在当前使用的浏览器中，不会自动上传到网站或服务器',
  '圖片會儲存在目前使用的瀏覽器中，不會自動上傳。匯出 JSON 備份時會連同圖片一起備份；清理未使用的圖片只會移除目前沒有被任何內容使用的圖片。':'图片会保存在当前使用的浏览器中，不会自动上传。导出 JSON 备份时会连同图片一起备份；清理未使用的图片只会移除当前没有被任何内容使用的图片。',
  'JSON 備份會包含目前族譜資料與圖片，可於之後重新匯入並繼續編輯。':'JSON 备份会包含当前族谱数据与图片，可在之后重新导入并继续编辑。',
  '匯出 JSON 備份時，圖片會自動一起放進備份；之後重新匯入時也會一併還原':'导出 JSON 备份时，图片会自动一起放进备份；之后重新导入时也会一并还原',
  '清理未使用的圖片只會移除目前沒有被人物、寵物、相簿或背景引用的圖片，不會刪除仍在使用中的圖片':'清理未使用的图片只会移除当前没有被人物、宠物、相册或背景引用的图片，不会删除仍在使用中的图片'
});

Object.assign(EN, {
  '使用說明':'Help',
  '電腦版：':'Desktop: ',
  'JSON 備份會包含完整族譜資料與圖片，可於之後重新匯入並繼續編輯':'The JSON backup includes the complete genealogy data and images, so you can import it again later and continue editing.',
  '頭像、相簿圖片、寵物圖片與背景圖片會儲存在目前使用的瀏覽器中，不會自動上傳到網站或伺服器':'Portraits, gallery images, pet images, and background images are stored in your current browser and are not uploaded automatically.',
  '圖片會儲存在目前使用的瀏覽器中，不會自動上傳。匯出 JSON 備份時會連同圖片一起備份；清理未使用的圖片只會移除目前沒有被任何內容使用的圖片。':'Images are stored in your current browser and are not uploaded automatically. JSON backups include the images, and cleanup removes only images that are no longer in use.',
  'JSON 備份會包含目前族譜資料與圖片，可於之後重新匯入並繼續編輯。':'The JSON backup includes the current genealogy data and images, so you can import it again later and continue editing.',
  '匯出 JSON 備份時，圖片會自動一起放進備份；之後重新匯入時也會一併還原':'When you export a JSON backup, the images are included automatically and restored when you import the backup later.',
  '清理未使用的圖片只會移除目前沒有被人物、寵物、相簿或背景引用的圖片，不會刪除仍在使用中的圖片':'Clean Unused Images removes only images that are no longer referenced by Sims, pets, galleries, or the background. Images still in use are kept.'
});

Object.assign(EN, {
  '批量移除':'Remove Multiple'
});

Object.assign(EN, {
  '匯出資料': 'Export Data',
  '可選擇匯出目前完整族譜圖片，或匯出 JSON 備份。': 'Choose to export the full genealogy image or a JSON backup.',
  '族譜圖片': 'Genealogy Image',
  '匯出目前完整族譜畫面，不受目前縮放或平移視角限制。': 'Export the complete genealogy canvas, regardless of the current zoom or pan.',
  '標準': 'Standard',
  '輸出目前完整族譜尺寸': 'Export at the full current genealogy size.',
  '輸出 2× 尺寸，適合一般分享與保存': 'Export at 2× size, suitable for sharing and archiving.',
  '超高畫質': 'Ultra HD',
  '輸出 3× 尺寸，適合高解析保存': 'Export at 3× size, suitable for high-resolution archiving.',
  '匯出族譜圖片': 'Export Genealogy Image',
  'JSON 備份': 'JSON Backup',
  '保留完整族譜資料與圖片，可再次匯入本工具繼續編輯。': 'Preserves the complete genealogy data and images so you can import and continue editing later.',
  'JSON 備份會包含目前族譜資料，並將已儲存在瀏覽器中的圖片一併轉回 base64。': 'The JSON backup includes the current genealogy data and converts browser-stored images back to base64.',
  '正在匯出族譜圖片…': 'Exporting genealogy image…',
  '族譜圖片匯出完成': 'Genealogy image exported',
  '族譜圖片匯出失敗': 'Failed to export genealogy image',
  '畫布與佈局': 'Canvas & Layout',
  '平移整個族譜畫布；': ' pans the entire genealogy canvas; ',
  '超過拖曳門檻後會自動切換為「自由排列」，並儲存新位置': ' switches to Free Layout after the drag threshold and saves the new position.',
  '智慧對齊輔助線': 'Smart alignment guides',
  '會在卡片接近其他卡片的左 / 中 / 右或上 / 中 / 下位置時自動吸附': ' snap the dragged card to matching left/center/right or top/middle/bottom positions.',
  '等距吸附': 'Equal-spacing snapping',
  '支援水平與垂直排列；接近相同間距時會顯示兩段間距與數值，只移動目前拖曳的卡片': ' works horizontally and vertically. Near an equal gap, it shows both gap segments and the distance value; only the dragged card moves.',
  '鎖定排列': 'Lock Layout',
  '避免誤拖；': ' prevents accidental card dragging; ',
  '會清除目前模式的手動位置並恢復自動樹狀佈局': ' clears manual positions for the current mode and restores the automatic tree layout.',
  '家族欄分隔線': 'Sidebar divider',
  '側邊欄分隔線': 'Sidebar divider',
  '可拖曳調整寬度；雙擊分隔線恢復預設寬度': ' can be dragged to resize the sidebar; double-click it to restore the default width.',
  '關係與關係位置': 'Relationships & Label Positions',
  '顯示 / 隱藏關係': 'Show / Hide Relationships',
  '控制畫布上的關係名稱是否顯示': ' controls whether relationship labels are shown on the canvas.',
  '關係未鎖定時可直接': 'When relationships are unlocked, you can ',
  '拖曳關係名稱': 'drag relationship labels',
  '；接近原始水平或垂直位置時會分別吸附回原位': '; near the original horizontal or vertical position, each axis snaps back independently.',
  '可避免誤拖關係名稱': ' prevents accidental relationship-label dragging.',
  '已移動的關係名稱可在模擬市民編輯視窗的關係清單中按': 'For a moved relationship label, use ',
  '回到自動位置': ' in the Sim editor relationship list to return it to the automatic position.',
  '匯出與備份': 'Export & Backup',
  '點選頂端': 'Use the top ',
  '可選擇': ' to choose ',
  '或': ' or ',
  '會輸出目前完整族譜，不受目前縮放或平移視角限制': ' exports the complete current genealogy, independent of the current zoom or pan.',
  '圖片會保留目前的': 'The image keeps the current ',
  '卡片位置 / 關係位置 / 主題 / 背景': 'card positions / relationship-label positions / theme / background',
  '，但不包含頂端導覽、家族欄、智慧輔助線或拖曳狀態': ', while excluding the top navigation, sidebar, smart guides, and drag states.',
  '族譜圖片可選擇': 'Genealogy images can be exported as ',
  '標準（1×） / 高畫質（2×） / 超高畫質（3×）': 'Standard (1×) / HD (2×) / Ultra HD (3×).',
  '保留可再次匯入的完整族譜資料，瀏覽器中的圖片會一併轉回 base64': ' preserves the complete editable genealogy data; browser-stored images are converted back to base64.',
  '中，容量通常遠大於 localStorage': ', which usually offers much more capacity than localStorage.',
  '復原上一個卡片或關係名稱拖曳；輸入欄位內仍使用瀏覽器原生文字復原': ' undoes the previous card or relationship-label drag; text fields keep the browser’s native text undo.',
  '重做上一個拖曳操作': ' redoes the previous drag operation.'
});

Object.assign(ZH_HANS_EXACT, {
  '更換頭像': '更换头像',
  '移除頭像': '移除头像',
  '關係標註說明': '关系标注说明',
  '基本資料': '基本资料',
  '家庭關係': '家庭关系',
  '其他關係': '其他关系',
  '相簿與寵物': '相册与宠物',
  '模擬市民編輯分類': '模拟市民编辑分类',
  '生日': '生日',
  '年齡': '年龄',
  '年': '年',
  '月': '月',
  '日': '日',
  '歲': '岁',
  '生日年份': '生日年份',
  '生日月份': '生日月份',
  '遊戲日期': '游戏日期',
  '匯出時遊戲日期': '导出时游戏日期',
  '生日日期': '生日日期',
  '生日未知': '生日未知',
  '年齡未知': '年龄未知',
  '居住地未知': '居住地未知',
  '可逐一新增或移除': '可逐项添加或移除',
  '輸入特徵後按 Enter': '输入特征后按 Enter',
  '子女關係說明': '子女关系说明',
  '兄弟姐妹關係說明': '兄弟姐妹关系说明',
  '關係設定說明': '关系设置说明',
  '每條連線可獨立設定關係名稱，也可重設已拖曳的關係名稱位置。': '每条连线可独立设置关系名称，也可重置已拖动的关系名称位置。',
  '寵物說明': '宠物说明',
  '記錄該模擬市民擁有的寵物。': '记录该模拟市民拥有的宠物。',
  '相簿操作說明': '相册操作说明',
  '可記錄不同人生階段、合影等多張圖片；支援拖曳圖片到相簿，或在編輯器內按 Ctrl+V 貼上截圖。': '可记录不同人生阶段、合影等多张图片；支持拖拽图片到相册，或在编辑器内按 Ctrl+V 粘贴截图。',
  '儲存模擬市民後即可新增其他關係。': '保存模拟市民后即可添加其他关系。',
  '加入家族說明': '加入家族说明',
  '移出家族說明': '移出家族说明',
  '圖片儲存說明': '图片存储说明',
  'JSON 備份說明': 'JSON 备份说明',
  '模擬市民頭像畫質說明': '模拟市民头像画质说明',
  '寵物頭像畫質說明': '宠物头像画质说明',
  '相簿圖片畫質說明': '相册图片画质说明',
  '僅套用於之後上傳的頭像。': '仅适用于之后上传的头像。',
  '僅套用於之後上傳的圖片。': '仅适用于之后上传的图片。'
});

Object.assign(EN, {
  '族譜顯示':'Genealogy View',
  '清除搜尋':'Clear Search',
  '沒有符合的家族':'No matching families',
  '家庭': 'Household',
  '更換頭像': 'Change Portrait',
  '移除頭像': 'Remove Portrait',
  '關係標註說明': 'Relationship label help',
  '基本資料': 'Profile',
  '家庭關係': 'Family',
  '其他關係': 'Other Relationships',
  '相簿與寵物': 'Gallery & Pets',
  '模擬市民編輯分類': 'Sim editor sections',
  '生日': 'Birthday',
  '年齡': 'Age',
  '年': 'Year',
  '月': 'Month',
  '日': 'Day',
  '歲': 'years old',
  '生日年份': 'Birthday year',
  '生日月份': 'Birthday month',
  '遊戲日期': 'Game Date',
  '匯出時遊戲日期': 'Game date at export',
  '生日日期': 'Birthday day',
  '生日未知': 'Birthday unknown',
  '年齡未知': 'Age unknown',
  '居住地未知': 'Residence unknown',
  '可逐一新增或移除': 'Add or remove traits individually',
  '輸入特徵後按 Enter': 'Type a trait and press Enter',
  '子女關係說明': 'Children relationship help',
  '兄弟姐妹關係說明': 'Sibling relationship help',
  '關係設定說明': 'Relationship settings help',
  '每條連線可獨立設定關係名稱，也可重設已拖曳的關係名稱位置。': 'Each connection can have its own relationship label, and moved label positions can be reset.',
  '寵物說明': 'Pet help',
  '記錄該模擬市民擁有的寵物。': 'Record pets owned by this Sim.',
  '相簿操作說明': 'Gallery help',
  '可記錄不同人生階段、合影等多張圖片；支援拖曳圖片到相簿，或在編輯器內按 Ctrl+V 貼上截圖。': 'Store multiple photos from different life stages or group shots. Drag images into the gallery or press Ctrl+V in the editor to paste a screenshot.',
  '儲存模擬市民後即可新增其他關係。': 'Save the Sim first, then you can add other relationships.',
  '加入家族說明': 'Add to family help',
  '移出家族說明': 'Remove from family help',
  '圖片儲存說明': 'Image storage help',
  'JSON 備份說明': 'JSON backup help',
  '模擬市民頭像畫質說明': 'Sim portrait quality help',
  '寵物頭像畫質說明': 'Pet portrait quality help',
  '相簿圖片畫質說明': 'Gallery image quality help',
  '僅套用於之後上傳的頭像。': 'Applies only to portraits uploaded from now on.',
  '僅套用於之後上傳的圖片。': 'Applies only to images uploaded from now on.'
});


// 右鍵選單快捷關閉
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && personCardMenu?.classList.contains('show')) closePersonCardMenu();
});

Object.assign(ZH_HANS_EXACT, {
  '族譜顯示':'族谱显示',
  '清除搜尋':'清除搜索',
  '沒有符合的家族':'没有符合的家族',
  '家庭':'家庭',
  '編輯家族名稱':'编辑家族名称','管理…':'管理…','設定':'设置','家庭與關係':'家庭与关系','其他關係':'其他关系',
  '篩選':'筛选','全部狀態':'全部状态','全部性別':'全部性别','重設篩選':'重置筛选','父母 A':'父母 A','父母 B':'父母 B',
  '背景':'背景','目前背景圖片':'当前背景图片','主題背景顏色':'主题背景颜色','透明背景（PNG）':'透明背景（PNG）',
  '查看個人檔案':'查看个人资料','在族譜中定位':'在族谱中定位','移出目前家族':'移出当前家族',
  '對齊':'对齐','分佈':'分布','靠左':'左对齐','水平置中':'水平居中','靠右':'右对齐','頂端':'顶端对齐','垂直置中':'垂直居中','底端':'底端对齐','水平均勻':'水平平均分布','垂直均勻':'垂直平均分布',
  '卡片顯示內容':'卡片显示内容','卡片外觀':'卡片外观','檢視卡片外觀':'查看模式卡片外观','檢視模式顯示內容':'查看模式显示内容','編輯模式顯示內容':'编辑模式显示内容','極簡':'极简','半透明':'半透明','完整卡片':'完整卡片',
  '套用於所有檢視模式人物卡':'应用于所有查看模式人物卡','只套用於檢視模式人物卡':'仅应用于查看模式人物卡','只套用於編輯模式人物卡':'仅应用于编辑模式人物卡','顯示內容套用於檢視與編輯模式；外觀只套用檢視模式':'显示内容应用于查看与编辑模式；外观仅应用于查看模式','重設所選位置':'重置所选位置','移出所選人物':'移出所选人物','取消選取':'取消选择',
  '確定要將所選人物移出目前家族嗎？':'确定要将所选人物移出当前家族吗？','人物本身仍會保留在人物資料中。':'人物本身仍会保留在人物资料中。',
  '目前家族還沒有成員，使用「成員 ＋」新增或加入人物':'当前家族还没有成员，使用「成员 ＋」新建或加入人物',
  '圖片會保留目前的':'图片会保留当前的','卡片位置 / 關係位置 / 主題':'卡片位置 / 关系位置 / 主题',
  '匯出時可另外選擇':'导出时可另外选择','目前背景圖片 / 主題背景顏色 / PNG 透明背景':'当前背景图片 / 主题背景颜色 / PNG 透明背景',
  '匯出圖片不包含頂端導覽、家族欄、智慧輔助線或拖曳狀態':'导出图片不包含顶部导航、家族栏、智能辅助线或拖动状态',
  '頂端':'顶部','開啟相簿瀏覽器，檢視所有模擬市民的相簿圖片':'打开相册浏览器，查看所有模拟市民的相册图片'
});
Object.assign(EN, {
  '選取': 'Select',
  '拖曳': 'Pan',
  '選取工具：拖曳空白處框選人物': 'Select tool: drag empty canvas to marquee-select Sims',
  '拖曳工具：拖曳畫布進行平移': 'Pan tool: drag the canvas to move the view',
  '自動排列時，拖曳空白處平移整個族譜畫布；滾輪以滑鼠位置為中心縮放': 'In Auto Layout, drag empty canvas to pan; use the mouse wheel to zoom around the pointer.',
  '自由排列會出現選取與拖曳工具：選取工具下拖曳空白處可框選人物；拖曳工具下拖曳畫布可平移視角': 'Free Layout shows Select and Pan tools: drag empty canvas with Select to marquee-select Sims, or drag with Pan to move the view.',
  '選取工具支援 Shift + 點擊增減多選、Ctrl / Cmd + A 全選目前畫布人物；拖曳任一已選人物可整組移動': 'Select supports Shift-click to add or remove Sims and Ctrl / Cmd + A to select all visible Sims; drag any selected Sim to move the group.',
  '使用選取工具時可按住 Space 暫時切換成畫布拖曳，放開後回到選取工具': 'While using Select, hold Space to pan temporarily; release Space to return to Select.',
  '套用於所有人物卡':'Applies to all Sim cards',
  '左鍵':'Left click','右鍵':'Right click','滾輪':'Wheel','增減多選':'add / remove from selection',
  '全選目前畫布人物':'select all Sims on the current canvas','暫時拖動畫布':'temporarily pan the canvas',
  '開啟卡片設定與人物快捷操作':'open card settings and Sim shortcuts',
  '檢視模式查看資料 / 編輯模式編輯人物':'view profile in View Mode / edit the Sim in Edit Mode'
});

Object.assign(EN, {
  '編輯家族名稱':'Edit family name','管理…':'Manage…','設定':'Set','家庭與關係':'Family & Relationships','其他關係':'Other Relationships',
  '篩選':'Filter','全部狀態':'All statuses','全部性別':'All genders','重設篩選':'Reset filters','父母 A':'Parent A','父母 B':'Parent B',
  '背景':'Background','目前背景圖片':'Current background image','主題背景顏色':'Theme background color','透明背景（PNG）':'Transparent background (PNG)',
  '查看個人檔案':'View Profile','在族譜中定位':'Locate in Tree','移出目前家族':'Remove from Current Family',
  '對齊':'Align','分佈':'Distribute','靠左':'Align Left','水平置中':'Align Center','靠右':'Align Right','頂端':'Align Top','垂直置中':'Align Middle','底端':'Align Bottom','水平均勻':'Distribute Horizontally','垂直均勻':'Distribute Vertically',
  '卡片顯示內容':'Card content','卡片外觀':'Card appearance','檢視卡片外觀':'View card appearance','檢視模式顯示內容':'View mode content','編輯模式顯示內容':'Edit mode content','極簡':'Minimal','半透明':'Translucent','完整卡片':'Full card',
  '套用於所有檢視模式人物卡':'Applies to all View Mode cards','只套用於檢視模式人物卡':'Applies only to View Mode cards','只套用於編輯模式人物卡':'Applies only to Edit Mode cards','顯示內容套用於檢視與編輯模式；外觀只套用檢視模式':'Content applies to both View and Edit modes; appearance applies only to View Mode','重設所選位置':'Reset selected positions','移出所選人物':'Remove selected Sims','取消選取':'Clear selection',
  '確定要將所選人物移出目前家族嗎？':'Remove the selected Sims from the current family?','人物本身仍會保留在人物資料中。':'The Sims will remain in the global Sim data.',
  '目前家族還沒有成員，使用「成員 ＋」新增或加入人物':'This family has no members yet. Use “Members +” to create or add someone.',
  '圖片會保留目前的':'The image keeps the current ','卡片位置 / 關係位置 / 主題':'card positions / relationship positions / theme',
  '匯出時可另外選擇':'; for export, choose ','目前背景圖片 / 主題背景顏色 / PNG 透明背景':'current background image / theme background color / transparent PNG background',
  '匯出圖片不包含頂端導覽、家族欄、智慧輔助線或拖曳狀態':'The exported image excludes the top navigation, family panel, smart guides, and drag state.',
  '頂端':'Top bar','開啟相簿瀏覽器，檢視所有模擬市民的相簿圖片':' opens the Gallery Browser for all Sims.'
});

  /* 圖示已改為 SVG；這裡只清理舊版翻譯資料可能殘留的表情符號。 */
  const LEGACY_EMOJI_PREFIX = /^[\s]*(?:[\u2600-\u27BF]|[\u{1F000}-\u{1FAFF}])+[\uFE0F\u200D\s]*/u;
  Object.entries(EN).forEach(([key, value]) => {
    const cleanKey = String(key).replace(LEGACY_EMOJI_PREFIX, '');
    const cleanValue = String(value).replace(LEGACY_EMOJI_PREFIX, '');
    if (cleanKey !== key && EN[cleanKey] == null) EN[cleanKey] = cleanValue;
  });

  Object.assign(ZH_HANS_EXACT, {
    '人物':'人物','更多':'更多','語言':'语言','顯示 / 隱藏家族欄':'显示 / 隐藏家族栏','家族檔案':'家族档案',
    '家庭合照':'家庭合照','更換合照':'更换合照','移除家庭合照':'移除家庭合照','切換家族':'切换家族','家族管理':'家族管理',
    '家族簡介':'家族简介','加入這個家族的簡介、背景或備註…':'加入这个家族的简介、背景或备注…','位成員':'位成员','代':'代',
    '成員':'成员','新增成員':'新增成员','加入既有人物':'加入既有人物','成員管理':'成员管理','收合家族欄':'收起家族栏','展開家族欄':'展开家族栏',
    '調整家族欄寬度':'调整家族栏宽度','拖曳調整家族欄寬度；雙擊恢復預設寬度':'拖动调整家族栏宽度；双击恢复默认宽度',
    '主要功能':'主要功能','畫布工具':'画布工具','縮放工具':'缩放工具','縮小':'缩小','放大':'放大','適應畫面':'适应画面',
    '家庭關係標註':'家庭关系标注','家庭關係標註說明':'家庭关系标注说明','其他關係標註':'其他关系标注',
    '父母、子女、配偶、前任配偶與兄弟姐妹的關係名稱可在這裡個別調整，也可重設已拖曳的位置。':'父母、子女、配偶、前任配偶与兄弟姐妹的关系名称可在这里分别调整，也可重置已拖动的位置。'
  });
  Object.assign(EN, {
    '人物':'People','更多':'More','語言':'Language','顯示 / 隱藏家族欄':'Show / hide family panel','家族檔案':'Family Profile',
    '家庭合照':'Family Photo','更換合照':'Change Family Photo','移除家庭合照':'Remove Family Photo','切換家族':'Switch Family','家族管理':'Family Management',
    '家族簡介':'Family Bio','加入這個家族的簡介、背景或備註…':'Add a family bio, background, or notes…','位成員':' members','代':' generations',
    '成員':'Members','新增成員':'Add Member','加入既有人物':'Add Existing Sim','成員管理':'Member Management','收合家族欄':'Collapse Family Panel','展開家族欄':'Expand Family Panel',
    '調整家族欄寬度':'Resize family panel','拖曳調整家族欄寬度；雙擊恢復預設寬度':'Drag to resize the family panel; double-click to restore the default width',
    '主要功能':'Primary actions','畫布工具':'Canvas tools','縮放工具':'Zoom controls','縮小':'Zoom out','放大':'Zoom in','適應畫面':'Fit to Screen',
    '家庭關係標註':'Family Relationship Labels','家庭關係標註說明':'Family relationship label help','其他關係標註':'Other Relationship Labels',
    '父母、子女、配偶、前任配偶與兄弟姐妹的關係名稱可在這裡個別調整，也可重設已拖曳的位置。':'Parent, child, spouse, ex-spouse, and sibling labels can be adjusted individually here, and moved positions can be reset.'
  });

  Object.assign(ZH_HANS_EXACT, {
    '外觀設定':'外观设置',
    '圖片與儲存':'图片与存储',
    '人物顯示方式':'人物显示方式',
    '精簡檢視':'精简视图',
    '詳細檢視':'详细视图',
    '批量管理':'批量管理',
    '新增人物':'新增人物',
    '搜尋人物…':'搜索人物…',
    '加入目前家族':'加入当前家族',
    '移出目前家族':'移出当前家族',
    '人生照片':'人生照片',
    '人生照片與寵物':'人生照片与宠物',
    '人生照片說明':'人生照片说明',
    '族譜背景':'族谱背景',
    '主色':'主色',
    '輔色':'辅色',
    '套用自訂配色':'应用自定义配色',
    '圖片顯示':'图片显示',
    '關係線':'关系线',
    '父母 / 子女':'父母 / 子女',
    '前任':'前任',
    '其他關係':'其他关系',
    '自訂關係線外觀':'自定义关系线外观',
    '樣式':'样式',
    '粗細':'粗细',
    '顏色':'颜色',
    '實線':'实线',
    '短虛線':'短虚线',
    '長虛線':'长虚线',
    '點線':'点线',
    '曲線':'曲线',
    '曲線弧度':'曲线弧度',
    '雙向箭頭':'双向箭头',
    '即時預覽':'实时预览',
    '尚無其他關係':'暂无其他关系',
    '恢復關係線預設':'恢复关系线默认',
    '圖片品質':'图片质量',
    '人物頭像':'人物头像',
    '目前儲存空間':'当前存储空间',
    '資料管理':'数据管理',
    '沒有符合的人物':'没有符合的人物',
    '還沒有任何人物':'还没有任何人物',
    '批量刪除人物':'批量删除人物',
    '族譜資料約':'族谱数据约',
    '目前瀏覽器已自動改用備用圖片儲存方式':'当前浏览器已自动改用备用图片存储方式',
    '儲存狀態':'存储状态',
    '唯一圖片資產':'唯一图片资源',
    '圖片引用':'图片引用',
    '瀏覽器總用量':'浏览器总用量',
    '不含圖片本體':'不含图片本体',
    '配額':'配额',
    '次重複引用已自動共用':'次重复引用已自动共用',
    '瀏覽器儲存空間':'浏览器存储空间',
    '% 已使用':'% 已使用',
    'IndexedDB 圖片本體':'IndexedDB 图片本体',
    'SHA-256 自動去重':'SHA-256 自动去重',
    'JSON 備份含圖片':'JSON 备份含图片',
    '維護':'维护',
    '人物卡片與人物資料使用的頭像':'人物卡片与人物数据使用的头像',
    '寵物資料使用的頭像':'宠物数据使用的头像',
    '人生照片與相簿圖片':'人生照片与相册图片',
    '圖片本體儲存在目前瀏覽器；族譜資料只保存圖片索引。匯出 JSON 備份時會連同圖片一起帶走。':'图片本体保存在当前浏览器；族谱数据只保存图片索引。导出 JSON 备份时会连同图片一起带走。',
    '只影響之後新增或更換的圖片；已經儲存的圖片不會重新壓縮。':'只影响之后新增或更换的图片；已经保存的图片不会重新压缩。',
    '只有打開這個頁面時才會計算容量，不會在拖曳卡片或瀏覽族譜時掃描圖片庫。':'只有打开这个页面时才会计算容量，不会在拖动卡片或浏览族谱时扫描图片库。',
    '圖片只會保存在目前使用的瀏覽器，不會自動上傳到網站或伺服器。':'图片只会保存在当前使用的浏览器，不会自动上传到网站或服务器。',
    '刪除目前沒有任何人物、寵物、人生照片、家庭合照或背景引用的圖片資產。':'删除当前没有任何人物、宠物、人生照片、家庭合照或背景引用的图片资源。',
    '這裡只放會直接改動族譜資料的操作。':'这里只有会直接改动族谱数据的操作。',
    '重建範例資料會取代目前族譜內容；需要保留資料時，請先匯出 JSON 備份。':'重建示例数据会替换当前族谱内容；需要保留数据时，请先导出 JSON 备份。',
    '圖片品質已恢復預設。':'图片质量已恢复默认。',
    '恢復預設族譜':'恢复默认族谱',
    '這會刪除目前族譜資料，並恢復繁體中文的預設族譜。':'这会删除当前族谱数据，并恢复繁体中文的默认族谱。',
    '已恢復預設族譜。':'已恢复默认族谱。',
    '恢復主題、背景、側邊欄寬度、檢視模式與關係線等介面設定？':'恢复主题、背景、侧边栏宽度、查看模式与关系线等界面设置？'
  });

  Object.assign(EN, {
    '外觀設定':'Appearance',
    '圖片與儲存':'Images & Storage',
    '人物顯示方式':'People display',
    '精簡檢視':'Compact view',
    '詳細檢視':'Detailed view',
    '批量管理':'Batch Manage',
    '新增人物':'Add Person',
    '搜尋人物…':'Search people…',
    '加入目前家族':'Add to Current Family',
    '移出目前家族':'Remove from Current Family',
    '人生照片':'Life Photos',
    '人生照片與寵物':'Life Photos & Pets',
    '人生照片說明':'Life photo help',
    '族譜背景':'Genealogy Background',
    '主色':'Primary',
    '輔色':'Secondary',
    '套用自訂配色':'Apply Custom Colors',
    '圖片顯示':'Image Fit',
    '關係線':'Relationship Lines',
    '父母 / 子女':'Parent / Child',
    '前任':'Ex',
    '其他關係':'Other Relationships',
    '自訂關係線外觀':'Customize Relationship Lines',
    '樣式':'Style',
    '粗細':'Width',
    '顏色':'Color',
    '實線':'Solid',
    '短虛線':'Short Dash',
    '長虛線':'Long Dash',
    '點線':'Dotted',
    '曲線':'Curve',
    '曲線弧度':'Curve Bend',
    '雙向箭頭':'Bidirectional Arrows',
    '即時預覽':'Live Preview',
    '尚無其他關係':'No Other Relationships',
    '恢復關係線預設':'Reset Relationship Lines',
    '圖片品質':'Image Quality',
    '人物頭像':'Person Portrait',
    '目前儲存空間':'Current Storage',
    '資料管理':'Data Management',
    '沒有符合的人物':'No matching people',
    '還沒有任何人物':'No people yet',
    '批量刪除人物':'Delete Multiple People',
    '族譜資料約':'Genealogy data about',
    '目前瀏覽器已自動改用備用圖片儲存方式':'The browser has automatically switched to a fallback image storage method',
    '儲存狀態':'Storage Status',
    '唯一圖片資產':'Unique Image Assets',
    '圖片引用':'Image References',
    '瀏覽器總用量':'Browser Usage',
    '不含圖片本體':'Images excluded',
    '配額':'Quota',
    '次重複引用已自動共用':'duplicate references share an existing asset',
    '瀏覽器儲存空間':'Browser Storage',
    '% 已使用':'% used',
    'IndexedDB 圖片本體':'IndexedDB image blobs',
    'SHA-256 自動去重':'SHA-256 deduplication',
    'JSON 備份含圖片':'Images included in JSON backups',
    '維護':'Maintenance',
    '人物卡片與人物資料使用的頭像':'Portraits used by Sim cards and profiles',
    '寵物資料使用的頭像':'Portraits used by pet profiles',
    '人生照片與相簿圖片':'Life photos and gallery images',
    '圖片本體儲存在目前瀏覽器；族譜資料只保存圖片索引。匯出 JSON 備份時會連同圖片一起帶走。':'Image blobs stay in this browser while genealogy data stores only image references. JSON backups include the images.',
    '只影響之後新增或更換的圖片；已經儲存的圖片不會重新壓縮。':'Only new or replaced images use these settings. Existing images are not recompressed.',
    '只有打開這個頁面時才會計算容量，不會在拖曳卡片或瀏覽族譜時掃描圖片庫。':'Storage is calculated only when this panel opens. Normal browsing and card dragging do not scan the image library.',
    '圖片只會保存在目前使用的瀏覽器，不會自動上傳到網站或伺服器。':'Images stay in the current browser and are never uploaded automatically.',
    '刪除目前沒有任何人物、寵物、人生照片、家庭合照或背景引用的圖片資產。':'Delete image assets that are no longer referenced by people, pets, life photos, family photos, or the background.',
    '這裡只放會直接改動族譜資料的操作。':'Only operations that directly change genealogy data are kept here.',
    '重建範例資料會取代目前族譜內容；需要保留資料時，請先匯出 JSON 備份。':'Rebuilding sample data replaces the current genealogy. Export a JSON backup first if you want to keep it.',
    '圖片品質已恢復預設。':'Image quality settings restored to defaults.',
    '恢復預設族譜':'Restore Default Genealogy',
    '這會刪除目前族譜資料，並恢復繁體中文的預設族譜。':'This deletes the current genealogy and restores the default Traditional Chinese genealogy.',
    '已恢復預設族譜。':'Default genealogy restored.',
    '恢復主題、背景、側邊欄寬度、檢視模式與關係線等介面設定？':'Restore theme, background, sidebar width, view mode, and relationship-line settings?'
  });

  Object.assign(ZH_HANS_EXACT, {
    '預覽':'预览','編輯':'编辑','關係線標籤':'关系线标签','其他關係線標籤':'其他关系线标签','親生':'亲生','公':'公','母':'母','調整範圍':'调整范围','調整頭像範圍':'调整头像范围','拖曳調整焦點；使用縮放調整取景範圍。':'拖拽调整焦点；使用缩放调整取景范围。','縮放':'缩放','重設':'重置','完成':'完成','支援 JPG / PNG / WEBP':'支持 JPG / PNG / WEBP','僅支援 JPG / PNG / WEBP':'仅支持 JPG / PNG / WEBP','記錄這位模擬市民值得保存的人生照片；可標記人生階段、標題與備註。':'记录这位模拟市民值得保存的人生照片；可标记人生阶段、标题与备注。'
  });
  Object.assign(EN, {
    '預覽':'Preview','編輯':'Edit','關係線標籤':'Relationship Line Labels','其他關係線標籤':'Other Relationship Line Labels','親生':'Biological','公':'Male','母':'Female','調整範圍':'Adjust Crop','調整頭像範圍':'Adjust Avatar Crop','拖曳調整焦點；使用縮放調整取景範圍。':'Drag to reposition the image and use zoom to adjust the crop.','縮放':'Zoom','重設':'Reset','完成':'Done','支援 JPG / PNG / WEBP':'Supports JPG / PNG / WEBP','僅支援 JPG / PNG / WEBP':'Only JPG / PNG / WEBP are supported','記錄這位模擬市民值得保存的人生照片；可標記人生階段、標題與備註。':'Save meaningful life photos for this Sim; add a life stage, title, and notes.'
  });

  Object.assign(ZH_HANS_EXACT, {
    '拖曳圖片調整焦點；滾輪或下方滑桿可縮放。框外半透明區域不會出現在頭像中。':'拖拽图片调整焦点；滚轮或下方滑杆可缩放。框外半透明区域不会出现在头像中。'
  });
  Object.assign(EN, {
    '拖曳圖片調整焦點；滾輪或下方滑桿可縮放。框外半透明區域不會出現在頭像中。':'Drag the image to reposition it. Use the mouse wheel or slider to zoom. The dimmed area outside the frame will not appear in the avatar.'
  });

  Object.assign(ZH_HANS_EXACT, {
    '自動':'自动',
    '由父母關係自動推導':'由父母关系自动推导',
    '由父母關係推導的兄弟姊妹會自動同步；如需變更，請調整父母關係。':'由父母关系推导的兄弟姐妹会自动同步；如需变更，请调整父母关系。'
  });
  Object.assign(EN, {
    '自動':'Auto',
    '由父母關係自動推導':'Derived from parents',
    '由父母關係推導的兄弟姊妹會自動同步；如需變更，請調整父母關係。':'Siblings derived from shared parents stay in sync automatically. To change them, edit the parent relationships.'
  });

  Object.assign(ZH_HANS_EXACT, {
    '親子':'亲子',
    '親子 / 收養':'亲子 / 收养',
    '收養':'收养',
    '前任配偶':'前任配偶',
    '兄弟姊妹':'兄弟姐妹',
    '本人':'本人',
    '父親':'父亲','母親':'母亲','父母':'父母',
    '養父':'养父','養母':'养母','養親':'养亲',
    '兒子':'儿子','女兒':'女儿','子女':'子女',
    '養子':'养子','養女':'养女','養子女':'养子女',
    '丈夫':'丈夫','妻子':'妻子',
    '前夫':'前夫','前妻':'前妻',
    '哥哥':'哥哥','姐姐':'姐姐','弟弟':'弟弟','妹妹':'妹妹',
    '兄弟':'兄弟','姊妹':'姐妹',
    '爺爺':'爷爷','奶奶':'奶奶','外公':'外公','外婆':'外婆',
    '祖父':'祖父','祖母':'祖母','祖父母':'祖父母',
    '孫子':'孙子','孫女':'孙女','外孫':'外孙','外孫女':'外孙女','孫輩':'孙辈',
    '曾祖父':'曾祖父','曾祖母':'曾祖母','曾祖父母':'曾祖父母',
    '高祖父':'高祖父','高祖母':'高祖母','高祖父母':'高祖父母',
    '曾孫':'曾孙','曾孫女':'曾孙女','曾孫輩':'曾孙辈',
    '伯父':'伯父','叔叔':'叔叔','叔伯':'叔伯','姑姑':'姑姑','舅舅':'舅舅','阿姨':'阿姨',
    '父母的兄弟姊妹':'父母的兄弟姐妹',
    '姪子':'侄子','姪女':'侄女','外甥':'外甥','外甥女':'外甥女',
    '兄弟姊妹的子女':'兄弟姐妹的子女',
    '堂哥':'堂哥','堂姐':'堂姐','堂弟':'堂弟','堂妹':'堂妹','堂兄弟姊妹':'堂兄弟姐妹',
    '表哥':'表哥','表姐':'表姐','表弟':'表弟','表妹':'表妹','表兄弟姊妹':'表兄弟姐妹',
    '岳父':'岳父','岳母':'岳母','公公':'公公','婆婆':'婆婆',
    '配偶父親':'配偶父亲','配偶母親':'配偶母亲','配偶父母':'配偶父母',
    '（不顯示）':'（不显示）',
    '曖昧':'暧昧',
    '秘密情人':'秘密情人',
    '外遇':'出轨关系',
    '前任情人':'前任情人',
    '單戀':'单恋',
    '互相暗戀':'互相暗恋',
    '好友':'好友',
    '青梅竹馬':'青梅竹马',
    '網友':'网友',
    '宿敵':'宿敌',
    '死對頭':'死对头',
    '關係不睦':'关系不睦',
    '師生':'师生',
    '同事':'同事',
    '室友':'室友',
    '鄰居':'邻居',
    '選擇或輸入關係…':'选择或输入关系…',
    '搜尋或輸入關係…':'搜索或输入关系…',
    '沒有符合的項目':'没有符合的项目'
  });
  Object.assign(EN, {
    '親子':'Parent / Child',
    '親子 / 收養':'Parent / Child / Adoption',
    '收養':'Adoptive Parent / Child',
    '前任配偶':'Ex-spouse',
    '兄弟姊妹':'Sibling',
    '本人':'Self',
    '父親':'Father','母親':'Mother','父母':'Parent',
    '養父':'Adoptive Father','養母':'Adoptive Mother','養親':'Adoptive Parent',
    '兒子':'Son','女兒':'Daughter','子女':'Child',
    '養子':'Adoptive Son','養女':'Adoptive Daughter','養子女':'Adoptive Child',
    '丈夫':'Husband','妻子':'Wife',
    '前夫':'Ex-husband','前妻':'Ex-wife',
    '哥哥':'Older Brother','姐姐':'Older Sister','弟弟':'Younger Brother','妹妹':'Younger Sister',
    '兄弟':'Brother','姊妹':'Sister',
    '爺爺':'Paternal Grandfather','奶奶':'Paternal Grandmother',
    '外公':'Maternal Grandfather','外婆':'Maternal Grandmother',
    '祖父':'Grandfather','祖母':'Grandmother','祖父母':'Grandparent',
    '孫子':'Grandson','孫女':'Granddaughter','外孫':'Grandson','外孫女':'Granddaughter','孫輩':'Grandchild',
    '曾祖父':'Great-grandfather','曾祖母':'Great-grandmother','曾祖父母':'Great-grandparent',
    '高祖父':'2nd Great-grandfather','高祖母':'2nd Great-grandmother','高祖父母':'2nd Great-grandparent',
    '曾孫':'Great-grandson','曾孫女':'Great-granddaughter','曾孫輩':'Great-grandchild',
    '伯父':'Older Paternal Uncle','叔叔':'Younger Paternal Uncle','叔伯':'Paternal Uncle',
    '姑姑':'Paternal Aunt','舅舅':'Maternal Uncle','阿姨':'Maternal Aunt',
    '父母的兄弟姊妹':"Parent's Sibling",
    '姪子':'Nephew','姪女':'Niece','外甥':'Nephew','外甥女':'Niece',
    '兄弟姊妹的子女':"Sibling's Child",
    '堂哥':'Older Paternal Cousin','堂姐':'Older Paternal Cousin',
    '堂弟':'Younger Paternal Cousin','堂妹':'Younger Paternal Cousin','堂兄弟姊妹':'Paternal Cousin',
    '表哥':'Older Cousin','表姐':'Older Cousin','表弟':'Younger Cousin','表妹':'Younger Cousin','表兄弟姊妹':'Cousin',
    '岳父':'Father-in-law','岳母':'Mother-in-law','公公':'Father-in-law','婆婆':'Mother-in-law',
    '配偶父親':"Spouse's Father",'配偶母親':"Spouse's Mother",'配偶父母':"Spouse's Parent",
    '（不顯示）':'(Hidden)',
    '曖昧':'Situationship',
    '秘密情人':'Secret Lover',
    '外遇':'Affair',
    '前任情人':'Former Lover',
    '單戀':'Unrequited Love',
    '互相暗戀':'Mutual Crush',
    '好友':'Close Friend',
    '青梅竹馬':'Childhood Friend',
    '網友':'Online Friend',
    '宿敵':'Archrival',
    '死對頭':'Nemesis',
    '關係不睦':'Strained Relationship',
    '師生':'Teacher / Student',
    '同事':'Coworker',
    '室友':'Roommate',
    '鄰居':'Neighbor',
    '選擇或輸入關係…':'Choose or type a relationship…',
    '搜尋或輸入關係…':'Search or type a relationship…',
    '沒有符合的項目':'No matching items'
  });

  Object.assign(ZH_HANS_EXACT, {
    '族譜工具':'族谱工具',
    '網頁端族譜系統工具':'网页端族谱系统工具',
    '遊戲端資料提取模組':'游戏端数据提取模组'
  });
  Object.assign(EN, {
    '族譜工具':'Genealogy Tool',
    '網頁端族譜系統工具':'Web Genealogy Tool',
    '遊戲端資料提取模組':'Game Data Exporter Mod'
  });

  const nodeSource = new WeakMap();
  const nodeOutput = new WeakMap();
  const attrSource = new WeakMap();
  let language = 'zh-Hant';
  let applying = false;
  let observer = null;

  function getSavedLanguage() {
    try {
      const v = localStorage.getItem(LANG_KEY);
      if (['zh-Hant','zh-Hans','en'].includes(v)) return v;
    } catch(e) {}
    return 'zh-Hant';
  }

  function stripLegacyEmoji(text) {
    return String(text ?? '')
      .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\uFE0F\u200D]/gu, '')
      .replace(/ {2,}/g, ' ')
      .trim();
  }

  function canonicalTraditional(source) {
    // 主程式已以繁中為 canonical source；這裡只清理舊版表情符號，不再以簡中反向轉譯。
    return stripLegacyEmoji(source);
  }

  function toSimplifiedUI(value) {
    const canonical = canonicalTraditional(value);
    if (ZH_HANS_EXACT[canonical] != null) return stripLegacyEmoji(ZH_HANS_EXACT[canonical]);
    let out = canonical;
    // 先替換完整介面詞彙，再做字元層簡化，避免「設定 / 預設 / 相簿」等台灣用語直譯不自然。
    for (const key of ZH_HANS_UI_KEYS) out = out.split(key).join(ZH_HANS_UI_PHRASES[key]);
    out = Array.from(out).map(ch => HANT_HANS_CHAR_MAP[ch] || ch).join('');
    return stripLegacyEmoji(out);
  }

  function translateFor(lang, source) {
    const canonical = canonicalTraditional(source);
    if (lang === 'zh-Hant') return canonical;
    if (lang === 'zh-Hans') return toSimplifiedUI(canonical);
    if (lang === 'en') return stripLegacyEmoji(EN[canonical] ?? canonical);
    return canonical;
  }

  function translateExact(source) {
    if (!source) return source;
    const canonical = canonicalTraditional(source);
    if (language === 'zh-Hant') return canonical;
    if (language === 'zh-Hans') return toSimplifiedUI(canonical);
    return stripLegacyEmoji(EN[canonical] ?? canonical);
  }

  function translatePatterns(source) {
    const canonical = canonicalTraditional(source);
    if (language !== 'en') return translateExact(canonical);
    if (EN[canonical] != null) return stripLegacyEmoji(EN[canonical]);
    let m;
    if ((m = canonical.match(/^已選\s*(\d+)\s*人$/))) return `Selected ${m[1]} Sim(s)`;
    if ((m = canonical.match(/^相簿（(\d+)）$/))) return `Gallery (${m[1]})`;
    if ((m = canonical.match(/^寵物（(\d+)）$/))) return `Pets (${m[1]})`;
    if ((m = canonical.match(/^來自：(.+)$/))) return `From: ${m[1]}`;
    if ((m = canonical.match(/^也屬於：(.+)$/))) return `Also in: ${m[1]}`;
    if ((m = canonical.match(/^確定將以下 (\d+) 位從「(.+)」移除嗎？\s+([\s\S]+?)\s+他們仍保留在模擬市民池中。$/))) {
      return `Remove the following ${m[1]} Sim(s) from “${m[2]}”?

${m[3]}

They will remain in the global Sim pool.`;
    }
    if ((m = canonical.match(/^清理完成：刪除了 (\d+) 張未使用圖片。$/))) return `Cleanup complete: deleted ${m[1]} unused image(s).`;
    if ((m = canonical.match(/^儲存空間使用量：(.+)$/))) return `Storage usage: ${m[1]}`;
    if ((m = canonical.match(/^匯入失敗：(.+)$/))) return `Import failed: ${m[1]}`;
    if ((m = canonical.match(/^確定刪除家族「(.+)」嗎？$/))) return `Delete family “${m[1]}”?`;
    if (canonical === '（家族內所有模擬市民仍保留在模擬市民池中）') return '(All Sims in this family will remain in the global Sim pool.)';
    if ((m = canonical.match(/^確定徹底刪除「(.+)」嗎？$/))) return `Permanently delete “${m[1]}”?`;
    if (canonical === '該操作會從所有家族中移除，並從模擬市民池永久刪除。') return 'This removes the Sim from every family and permanently deletes it from the global Sim pool.';
    if (canonical === '（若只想從目前家族移除，請使用「移出家族」）') return '(To remove the Sim only from this family, use “Remove from Family”.)';
    if ((m = canonical.match(/^請輸入新家族名稱。$/))) return 'Enter a name for the new family.';
    if ((m = canonical.match(/^（(\d+) \/ (\d+) 張）$/))) return `(${m[1]} / ${m[2]} images)`;
    if ((m = canonical.match(/^(\d+) 只寵物$/))) return `${m[1]} pet(s)`;
    if ((m = canonical.match(/^原始圖片大小約 ([\d.]+) MB。$/))) return `Original image size: about ${m[1]} MB.`;
    if ((m = canonical.match(/^確定刪除圖片「(.+)」嗎？$/))) return `Delete image “${m[1]}”?`;
    if ((m = canonical.match(/^確定刪除寵物「(.+)」嗎？$/))) return `Delete pet “${m[1]}”?`;
    if ((m = canonical.match(/^圖片處理失敗：(.+)$/))) return `Image processing failed: ${translatePatterns(m[1])}`;
    if ((m = canonical.match(/^背景處理失敗：(.+)$/))) return `Background processing failed: ${translatePatterns(m[1])}`;
    if ((m = canonical.match(/^清除「(.+)模式」下本家族的所有手動位置，恢復自動樹狀。確定嗎？$/))) return `Clear all manual positions for this family in ${translatePatterns(m[1])} mode and restore automatic tree layout?`;
    if ((m = canonical.match(/^確定將以下 (\d+) 位從「(.+)」移除嗎？$/))) return `Remove the following ${m[1]} Sim(s) from “${m[2]}”?`;
    if (canonical === '他們仍保留在模擬市民池中。') return 'They will remain in the global Sim pool.';
    if (canonical === '查看') return 'View';
    if (canonical === '編輯') return 'Edit';
    // 由系統組合出的短片語（例如「成年 · 作家」）逐段翻譯，避免英文殘留繁中。
    if (canonical.includes(' · ')) {
      return canonical.split(' · ').map(part => EN[part] != null ? stripLegacyEmoji(EN[part]) : part).join(' · ');
    }
    return canonical;
  }

  function translatePreservingSpace(source) {
    const m = String(source).match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m || !m[2]) return source;
    return m[1] + translatePatterns(m[2]) + m[3];
  }

  function translateTextNode(node, refreshSource = false) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return;
    if (parent.closest && parent.closest('#languageSelect')) return;
    if (refreshSource || !nodeSource.has(node)) nodeSource.set(node, node.nodeValue);
    const translated = translatePreservingSpace(nodeSource.get(node));
    nodeOutput.set(node, translated);
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }

  function translateAttrs(el, refreshSource = false) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    const attrs = ['title','placeholder','aria-label','alt','data-tooltip'];
    let cache = attrSource.get(el);
    if (!cache) { cache = {}; attrSource.set(el, cache); }
    attrs.forEach(name => {
      if (!el.hasAttribute(name)) return;
      if (refreshSource || cache[name] == null) cache[name] = el.getAttribute(name);
      el.setAttribute(name, translatePatterns(cache[name]));
    });
  }

  function translateTree(root = document.body, refreshSource = false) {
    if (!root) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) translateTextNode(root, refreshSource);
      if (root.nodeType === Node.ELEMENT_NODE) translateAttrs(root, refreshSource);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, refreshSource);
        else translateAttrs(node, refreshSource);
      }
      document.documentElement.lang = language;
      document.title = language === 'en'
        ? "L1nG The Sims 4 Genealogy Tool"
        : language === 'zh-Hans'
          ? "L1nG 模拟市民族谱工具"
          : "L1nG 模擬市民族譜工具";
    } finally { applying = false; }
  }

  function setLanguage(lang) {
    if (!['zh-Hant','zh-Hans','en'].includes(lang)) lang = 'zh-Hant';
    language = lang;
    _builtinSampleVariantToCanonical = null;
    try { localStorage.setItem(LANG_KEY, lang); } catch(e) {}
    const sel = document.getElementById('languageSelect');
    if (sel) sel.value = lang;
    translateTree(document.body, false);
    // 關係標籤寬度與內建範例資料都依顯示語言重新計算。
    _textMeasureCache.clear();
    if (genealogyData && genealogyData.families && genealogyData.families.length) {
      refreshFamilyUI();
      render();
    }
    if (mask && mask.classList.contains('show')) {
      const birthdayDay = $('fBirthdayDay') ? $('fBirthdayDay').value : '';
      populateBirthdayDays(birthdayDay);
      renderEditorFamilyPreviews();
    }
    syncAllNavSelectControls();
  }

  function translateDialogMessage(message) {
    return String(message).split('\n').map(line => translatePatterns(line)).join('\n');
  }


  function observe() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(mutations => {
      if (applying) return;
      applying = true;
      try {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData') {
            // 忽略由翻譯本身造成的變更，避免翻譯結果覆蓋繁中來源文字。
            if (nodeOutput.has(mutation.target) && mutation.target.nodeValue === nodeOutput.get(mutation.target)) continue;
            translateTextNode(mutation.target, true);
          } else if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, true);
              else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node, true);
            });
          }
        }
      } finally { applying = false; }
    });
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }

  function initLanguage() {
    language = getSavedLanguage();
    const sel = document.getElementById('languageSelect');
    if (sel) {
      sel.value = language;
      sel.addEventListener('change', () => setLanguage(sel.value));
    }
    translateTree(document.body, true);
    observe();
  }

  return { init: initLanguage, setLanguage, translate: translatePatterns, translateFor, get language(){ return language; } };
})();

LING_I18N.init();
setupTopbarNavSelects();
observeSharedNativeSelectChevrons();
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && exportDialog && exportDialog.classList.contains('show')) closeExportPanel();
});
init();
