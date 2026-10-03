/* ========【L1nG Genealogy App】 設定 - 族譜工具主程式與 UI 協調 ======== */
/*
 * 主要來源語言：繁體中文（zh-Hant）
 * 支援語言：繁體中文 / 簡體中文 / English
 * 圖示：本機 Bootstrap Icons SVG
 */


const PAD = 80;
const STORE_KEY = 'l1ng_genealogy_v1';
const THEME_KEY = 'l1ng_genealogy_theme_v1';
const CUSTOM_COLORS_KEY = 'l1ng_genealogy_custom_theme_v1';
const BG_KEY = 'l1ng_genealogy_background_v1';
const MODE_KEY = 'l1ng_genealogy_view_mode_v1';
const LABELS_KEY = 'l1ng_genealogy_relationship_labels_v1';
const LABEL_LOCK_KEY = 'l1ng_genealogy_relationship_label_lock_v1';
const SIDEBAR_WIDTH_KEY = 'l1ng_genealogy_sidebar_width_v1';
const FAMILY_PANEL_COLLAPSED_KEY = 'l1ng_genealogy_family_panel_collapsed_v1';
const PERSON_LIBRARY_VIEW_KEY = 'l1ng_genealogy_person_library_view_v1';
const FAMILY_MEMBER_GENERATION_SORT_KEY = 'l1ng_genealogy_family_member_generation_sort_v1';
const REL_LINE_STYLE_KEY = 'l1ng_genealogy_relationship_line_style_v1';
const FAMILY_TREE_VIEW_MODE_KEY = 'l1ng_genealogy_family_tree_view_mode_v1';
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
const personEditor = window.L1nGGenealogyPersonEditor;
if (!personEditor) {
  throw new Error('找不到 L1nG 人物編輯器模組。');
}
const DEFAULT_AVATAR_FRAME = personEditor.DEFAULT_AVATAR_FRAME;
const simEditorState = personEditor.state.sim;
const editingPets = personEditor.state.pets;
const petEditorState = personEditor.state.pet;
const editingGallery = personEditor.state.gallery;
const lifePhotoState = personEditor.state.lifePhoto;

const THEME_PRESETS = [
  { id:'ling',       name:'L1nG 晴空',  grad:'linear-gradient(120deg, #ffffff 0%, #dfeffc 100%)' },
  { id:'sage',       name:'森霧鼠尾草', grad:'linear-gradient(120deg, #dfe9e0 0%, #eef3ea 100%)' },
  { id:'rose',       name:'莓果薄暮',   grad:'linear-gradient(120deg, #e8c4d0 0%, #f4dfe6 100%)' },
  { id:'amber',      name:'琥珀紙頁',   grad:'linear-gradient(120deg, #e5c896 0%, #f2dfb9 100%)' },
  { id:'ink',        name:'墨曜紫灰',   grad:'linear-gradient(120deg, #111014 0%, #211e24 100%)' },
  { id:'berrynight', name:'夜莓酒紅',   grad:'linear-gradient(120deg, #151013 0%, #281d22 100%)' },
  { id:'graphite',   name:'中性石墨',   grad:'linear-gradient(120deg, #111315 0%, #202428 100%)' }
];

const BG_MAX = 1920;
const BG_QUALITY = 0.72;
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
  'deceased-spouse': Object.freeze({
    icon:'flower1',
    label:'已故配偶'
  }),
  sibling: Object.freeze({
    icon:'people',
    label:'兄弟姊妹'
  })
});

const SOCIAL_RELATIONSHIP_DEFINITIONS = Object.freeze({
  // 戀愛 / 親密
  '曖昧':Object.freeze({ icon:'hearts', category:'romance', lineStyle:'short-dash', layoutPriority:260 }),
  '訂婚':Object.freeze({ icon:'gem', category:'romance', lineStyle:'solid', layoutPriority:780, symmetric:true }),
  '伴侶':Object.freeze({ icon:'hearts', category:'romance', lineStyle:'solid', layoutPriority:740, symmetric:true }),
  '情人':Object.freeze({ icon:'heart-fill', category:'romance', lineStyle:'short-dash', layoutPriority:600 }),
  '秘密情人':Object.freeze({ icon:'lock', category:'romance', lineStyle:'short-dash', layoutPriority:580 }),
  '外遇':Object.freeze({ icon:'heartbreak', category:'romance', lineStyle:'short-dash', layoutPriority:500 }),
  '砲友':Object.freeze({ icon:'activity', category:'intimacy', lineStyle:'short-dash', layoutPriority:420 }),
  '一夜情':Object.freeze({ icon:'moon-stars', category:'intimacy', lineStyle:'dot', layoutPriority:180 }),
  '前任伴侶':Object.freeze({ icon:'heartbreak', category:'romance', lineStyle:'short-dash', layoutPriority:260 }),
  '前任情人':Object.freeze({ icon:'heartbreak', category:'romance', lineStyle:'short-dash', layoutPriority:240 }),
  '單戀':Object.freeze({ icon:'heart', category:'romance', lineStyle:'dot', layoutPriority:120 }),
  '互相暗戀':Object.freeze({ icon:'hearts', category:'romance', lineStyle:'short-dash', layoutPriority:300, symmetric:true }),
  '喪偶':Object.freeze({ icon:'flower1', category:'romance', lineStyle:'short-dash', layoutPriority:180 }),

  // 友誼
  '朋友':Object.freeze({ icon:'person-heart', category:'friendship', symmetric:true }),
  '好友':Object.freeze({ icon:'person-heart', category:'friendship', symmetric:true }),
  '摯友':Object.freeze({ icon:'person-check', category:'friendship', symmetric:true }),
  '青梅竹馬':Object.freeze({ icon:'person-heart', category:'friendship', symmetric:true }),
  '網友':Object.freeze({ icon:'person-heart', category:'friendship', symmetric:true }),

  // 負面
  '仇敵':Object.freeze({ icon:'lightning', category:'negative' }),
  '宿敵':Object.freeze({ icon:'lightning', category:'negative' }),
  '死對頭':Object.freeze({ icon:'lightning', category:'negative' }),
  '關係不睦':Object.freeze({ icon:'lightning', category:'negative' }),

  // 生活 / 社會
  '師生':Object.freeze({ icon:'mortarboard', category:'social' }),
  '師承':Object.freeze({ icon:'mortarboard', category:'social' }),
  '同事':Object.freeze({ icon:'people', category:'social', symmetric:true }),
  '室友':Object.freeze({ icon:'house-heart', category:'social', symmetric:true }),
  '鄰居':Object.freeze({ icon:'house-heart', category:'social', symmetric:true }),

  // 非血緣親屬
  // 這些仍屬於其他關係 links，不參與父母 / 子女世代計算。
  '乾爸':Object.freeze({ icon:'person-heart', category:'chosen-kin' }),
  '乾媽':Object.freeze({ icon:'person-heart', category:'chosen-kin' }),
  '乾兒子':Object.freeze({ icon:'person-check', category:'chosen-kin' }),
  '乾女兒':Object.freeze({ icon:'person-check', category:'chosen-kin' }),
  '結拜兄弟姊妹':Object.freeze({ icon:'people', category:'chosen-kin', symmetric:true })
});

function isSymmetricSocialRelationshipType(value) {
  return (
    SOCIAL_RELATIONSHIP_DEFINITIONS[
      String(value || '').trim()
    ]?.symmetric === true
  );
}

function relationshipLayoutPriority(value) {
  return Number(
    SOCIAL_RELATIONSHIP_DEFINITIONS[
      String(value || '').trim()
    ]?.layoutPriority
  ) || 0;
}

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

const PET_SPECIES = Object.freeze({
  // ========【寵物種類】 設定 - 顯示文字、canonical value 與專用 SVG 圖示統一 ========
  dog:     Object.freeze({ icon:'dog', label:'狗' }),
  fox:     Object.freeze({ icon:'wolf-head', label:'狐狸' }),
  cat:     Object.freeze({ icon:'cat', label:'貓' }),
  raccoon: Object.freeze({ icon:'paw', label:'浣熊' }),
  horse:   Object.freeze({ icon:'horse', label:'馬' }),
  cow:     Object.freeze({ icon:'cow', label:'牛' }),
  crow:    Object.freeze({ icon:'bird', label:'烏鴉' }),
  parrot:  Object.freeze({ icon:'feather', label:'鸚鵡' }),
  leopard: Object.freeze({ icon:'cat', label:'豹' }),
  other:   Object.freeze({ icon:'paw', label:'其他' })
});

const VALID_THEMES = ['ling','sage','rose','amber','ink','berrynight','graphite'];
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
let customColors = { c1:'#ffffff', c2:'#dfeffc', c3:'#55acee' };
let hasSavedCustomTheme = false;

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
    curveAmount:50,
    routing:'auto'
  }),
  exspouse: Object.freeze({
    style:'short-dash',
    width:1.7,
    color:null,
    curved:false,
    curveAmount:50,
    routing:'auto'
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
    curved:false,
    curveAmount:50,
    routing:'auto',
    showArrow:false
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

function normalizeRelationshipLineSetting(
  key,
  saved,
  fallbackOverride = null
) {
  const fallback =
    fallbackOverride ||
    RELATIONSHIP_LINE_DEFAULTS[key] ||
    RELATIONSHIP_LINE_DEFAULTS.other;

  if (
    !saved ||
    typeof saved !== 'object' ||
    Array.isArray(saved)
  ) {
    return { ...fallback };
  }

  const normalized = {
    ...fallback,
    ...saved
  };

  if (
    !['solid','short-dash','long-dash','dot']
      .includes(normalized.style)
  ) {
    normalized.style =
      fallback.style;
  }

  normalized.curved =
    typeof normalized.curved === 'boolean'
      ? normalized.curved
      : !!fallback.curved;

  normalized.routing =
    ['auto','manual'].includes(
      normalized.routing
    )
      ? normalized.routing
      : (
          ['spouse','exspouse','other']
            .includes(key)
            ? 'auto'
            : 'manual'
        );

  normalized.curveAmount =
    Math.max(
      10,
      Math.min(
        100,
        Number(normalized.curveAmount) ||
        fallback.curveAmount ||
        50
      )
    );

  if (key === 'other') {
    const storedShowArrow =
      saved &&
      Object.prototype.hasOwnProperty.call(
        saved,
        'showArrow'
      )
        ? saved.showArrow
        : saved?.bidirectional;

    normalized.showArrow =
      !!storedShowArrow;

    delete normalized.bidirectional;
  }

  return normalized;
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
          normalizeRelationshipLineSetting(
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
            normalizeRelationshipLineSetting(
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
return {
    freeLayout: !!fam.freeLayout[mode],
    manualPositions: cloneManualPositionMap(fam.manualPositions[mode])
  };
}

function captureLabelHistoryState(key) {
  const saved = currentGenealogyData() && currentGenealogyData().labelPositions ? currentGenealogyData().labelPositions[key] : null;
  return saved ? { dx: Number(saved.dx) || 0, dy: Number(saved.dy) || 0 } : null;
}

function applyDragHistoryEntry(entry, stateKey) {
  const state = entry[stateKey];
  if (!state || !currentGenealogyData() || !genealogyStore) return;

  if (entry.type === 'card-layout') {
    const fam = currentGenealogyData().families.find(item => item.id === entry.familyId);
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
        currentGenealogyData().currentFamilyId === entry.familyId &&
        viewMode === entry.mode
    });

    if (
      currentGenealogyData().currentFamilyId === entry.familyId &&
      viewMode === entry.mode
    ) {
      syncLayoutModeControls();
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

let avatarCropTarget = null;
let avatarCropDraft = { ...DEFAULT_AVATAR_FRAME };
let avatarCropUrl = '';
let avatarCropPointer = null;
let avatarCropNaturalSize = { width:0, height:0 };
let avatarCropRenderMetrics = null;

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
        syncCanvasBackgroundSurface();
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
  return (
    genealogyStore?.getCardSettings?.(
      'view'
    ) ||
    { ...DEFAULT_CARD_VIEW_SETTINGS }
  );
}

function getCardEditSettings() {
  return (
    genealogyStore?.getCardSettings?.(
      'edit'
    ) ||
    { ...DEFAULT_CARD_EDIT_SETTINGS }
  );
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

// ========【檢視卡片內容模型】 設定 - 卡片內容由 App 提供；版型與幾何由 Scene 負責 ========
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

  // ========【預設偏好示範】 設定 - 不改預設家庭，只讓初次使用者能先看到偏好分頁 ========
  // 這些值是依 2026-10-02 實機匯出確認過的 EA preference schema / tuning metadata 建立的 UI 範例，
  // 不宣稱是史賓瑟．金．路易斯家庭目前存檔中的實際偏好；真正匯入遊戲 ZIP 時會由匯入資料取代。
  const samplePreferenceCategories = Object.freeze({
    activity:Object.freeze({
      tuningId:'264576',
      internalName:'PreferenceCategory_Activity',
      localizedName:'活動',
      localizedNameRef:null
    }),
    music:Object.freeze({
      tuningId:'264581',
      internalName:'PreferenceCategory_MusicGenre',
      localizedName:'音樂',
      localizedNameRef:null
    }),
    color:Object.freeze({
      tuningId:'259880',
      internalName:'PreferenceCategory_Color',
      localizedName:'顏色',
      localizedNameRef:null
    })
  });

  const samplePreferenceGroup = Object.freeze({
    tuningId:'361531',
    internalName:'casPreferenceGroup_likesdislikes',
    localizedName:'喜歡與不喜歡的事物',
    localizedNameRef:null
  });

  const samplePreferencePresets = Object.freeze({
    fitnessLike:['like','健身','activity'],
    fitnessDislike:['dislike','健身','activity'],
    popLike:['like','流行音樂','music'],
    popDislike:['dislike','流行音樂','music'],
    gardeningLike:['like','園藝','activity'],
    gardeningDislike:['dislike','園藝','activity'],
    cookingLike:['like','烹飪','activity'],
    cookingDislike:['dislike','烹飪','activity'],
    classicalLike:['like','古典音樂','music'],
    mischiefLike:['like','惡作劇','activity'],
    mischiefDislike:['dislike','惡作劇','activity'],
    paintingLike:['like','繪畫','activity'],
    jazzLike:['like','爵士樂','music'],
    rocketDislike:['dislike','火箭科學','activity'],
    blueLike:['like','藍色','color'],
    redLike:['like','紅色','color'],
    blackLike:['like','黑色','color'],
    electronicaLike:['like','電子音樂','music'],
    electronicaDislike:['dislike','電子音樂','music'],
    videoGamingLike:['like','電動遊戲','activity'],
    videoGamingDislike:['dislike','電動遊戲','activity'],
    kidsMusicLike:['like','兒童電台音樂','music'],
    writingLike:['like','寫作','activity'],
    programmingLike:['like','程式設計','activity'],
    programmingDislike:['dislike','程式設計','activity'],
    romanceMusicLike:['like','浪漫音樂','music'],
    alternativeLike:['like','另類音樂','music'],
    rockClimbingLike:['like','攀岩','activity'],
    afroLike:['like','非洲節奏音樂','music'],
    swordLike:['like','劍術','activity'],
    singerSongwriterLike:['like','創作歌手音樂','music'],
    summerLike:['like','夏日音樂','music'],
    ballroomLike:['like','華爾滋音樂','music'],
    tattooDislike:['dislike','刺青','activity'],
    mixologyDislike:['dislike','調酒','activity'],
    sPopLike:['like','模擬流行樂','music'],
    retroLike:['like','復古音樂','music'],
    pianoDislike:['dislike','鋼琴','activity']
  });

  const samplePreferenceKeysBySim = Object.freeze({
    // 史賓瑟．金．路易斯
    '944092612642014825':['fitnessLike','popLike','gardeningDislike'],
    '944092612642014826':['cookingLike','classicalLike','mischiefDislike'],
    '944092612642014827':['paintingLike','jazzLike','gardeningLike','rocketDislike'],
    '944092612642014828':['gardeningLike','classicalLike','blueLike','electronicaDislike'],
    '944092612642014829':['videoGamingLike','kidsMusicLike','paintingLike','fitnessDislike'],

    // 高斯
    '944092612642081636':['romanceMusicLike','redLike','fitnessLike','mischiefDislike'],
    '944092612642081637':['writingLike','classicalLike','programmingLike','fitnessDislike'],
    '944092612642081638':['paintingLike','alternativeLike','blackLike','popDislike'],
    '944092612642081639':['videoGamingLike','programmingLike','kidsMusicLike','cookingDislike'],

    // 朗德古拉伯
    '944092612642085336':['fitnessLike','popLike','blueLike','mischiefDislike'],
    '944092612642085337':['classicalLike','blackLike','writingLike','cookingDislike'],
    '944092612642085338':['mischiefLike','electronicaLike','blackLike','cookingDislike'],

    // 維托
    '944092612642294749':['fitnessLike','paintingLike','alternativeLike','gardeningDislike'],
    '944092612642294750':['cookingLike','classicalLike','blackLike','mischiefDislike'],

    // 伊藤
    '944092612642563314':['fitnessLike','classicalLike','redLike','cookingDislike'],
    '944092612642563315':['fitnessLike','rockClimbingLike','popLike','programmingDislike'],
    '944092612642563316':['rockClimbingLike','romanceMusicLike','popLike','cookingDislike'],
    '944092612642563317':['videoGamingLike','kidsMusicLike','mischiefLike','fitnessDislike'],

    // 達榮：依目前實機 ZIP 可見偏好內容整理。
    '944092612642774243':['afroLike','swordLike','paintingLike','singerSongwriterLike','writingLike','gardeningDislike','programmingDislike'],
    '944092612642774244':['afroLike','swordLike','summerLike','paintingLike','ballroomLike','writingLike','tattooDislike','mixologyDislike'],
    '944092612642774245':['swordLike','paintingLike','sPopLike','videoGamingDislike'],
    '944092612642774246':['videoGamingLike','retroLike','pianoDislike','fitnessDislike']
  });

  function makeSamplePreference(key) {
    const preset=
      samplePreferencePresets[key];

    if(!preset)return null;

    const [
      preference,
      displayName,
      categoryKey
    ]=preset;

    const category=
      samplePreferenceCategories[categoryKey];

    return {
      source:'sample',
      preference,
      tuningId:'',
      internalName:'',
      localizedName:
        (preference==='dislike'
          ? '不喜歡'
          : '喜歡')+
        displayName,
      displayName,
      localizedNameRef:null,
      traitType:{
        key:preference,
        value:
          preference==='dislike'
            ? 23
            : 22
      },
      subject:{
        key:'object',
        value:0
      },
      isAttractionPreference:false,
      item:null,
      category:{
        ...category
      },
      group:{
        ...samplePreferenceGroup
      }
    };
  }

  function samplePreferencesForSim(id) {
    const keys=
      samplePreferenceKeysBySim[
        String(id)
      ] || [];

    return keys
      .map(makeSamplePreference)
      .filter(Boolean);
  }

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

    const samplePreferences=
      samplePreferencesForSim(id);

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
        dataAvailability:{
          preferences:
            samplePreferences.length
              ? 'available'
              : 'unavailable'
        },
        preferences:{
          availability:
            samplePreferences.length
              ? 'available'
              : 'unavailable',
          likesDislikes:samplePreferences,
          attraction:[]
        },
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
      sampleVersion:7,
      sampleSource:'ea-npc-20260927',
      samplePreferenceDemo:true,
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

let genealogyViewport = null;

function currentGenealogyData() {
  return genealogyStore?.getData?.() || null;
}

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
const customColor3 = $('customColor3');
const appearanceCustomThemeEditor = $('appearanceCustomThemeEditor');
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
    currentGenealogyData().sims[String(simId)]?.gameData?.adoptedChildIds || [];

  return [...new Set([
    ...childIds,
    ...adoptedChildIds.map(String)
  ])]
    .filter(id => currentGenealogyData().sims[id]);
}

function familyDisplaySpouseIds(sim) {
  if (!sim) return [];

  return [...new Set([
    ...(sim.spouseIds || []),
    ...(sim.gameData?.deceasedSpouseIds || [])
  ].map(String))]
    .filter(id => currentGenealogyData().sims[id]);
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
      ? fam.gameData.householdMemberIds.map(String).filter(id => currentGenealogyData().sims[id])
      : [];

  if (householdIds.length) return householdIds;

  return (fam.memberIds || [])
    .map(String)
    .filter(id => currentGenealogyData().sims[id]);
}

// ========【Family Selector Cache】 設定 - 家族範圍只在 genealogy 結構改變時重建 ========
const familySelectorCache = {
  entriesByMode:new Map(),
  activeByMode:new Map()
};

function invalidateFamilySelectorCache() {
  familySelectorCache.entriesByMode.clear();
  familySelectorCache.activeByMode.clear();
}

function normalizeFamilySelectorMode(mode) {
  return mode === 'household' || mode === 'ea'
    ? mode
    : 'extended';
}

function buildHouseholdEntries() {
  if (!currentGenealogyData() || !Array.isArray(currentGenealogyData().families)) return [];

  return currentGenealogyData().families
    .map((fam, index) => {
      const imported = !!fam.gameImport;
      const memberIds =
        imported
          ? familySourceSeedIds(fam)
          : (fam.memberIds || []).map(String).filter(id => currentGenealogyData().sims[id]);

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
          currentGenealogyData().sims[id]
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
        currentGenealogyData().sims[id]
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
      currentGenealogyData().sims[id]
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
  const seeds = [...new Set(seedIds.map(String).filter(id => currentGenealogyData().sims[id]))];
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
      .filter(id => currentGenealogyData().sims[id])
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
    const sim = currentGenealogyData().sims[id];
    if (!sim) return;

    (sim.parentIds || []).forEach(parentId => connect(id, parentId));
    (sim.spouseIds || []).forEach(spouseId => connect(id, spouseId));
    (sim.exSpouseIds || []).forEach(spouseId => connect(id, spouseId));
    (sim.gameData?.deceasedSpouseIds || []).forEach(spouseId => connect(id, spouseId));
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
    .map(id => currentGenealogyData().sims[id])
    .filter(Boolean)
    .map(sim => displayDataText(sim.name, sim))
    .filter(Boolean)
    .slice(0, 2);

  return names.length
    ? `${base} · ${names.join(' / ')}`
    : base;
}

function buildEaTreeEntries() {
  if (!currentGenealogyData() || !Array.isArray(currentGenealogyData().families)) return [];

  const entries = [];

  currentGenealogyData().families.forEach((fam, familyIndex) => {
    if (!fam) return;

    if (!fam.gameImport) {
      const memberIds = (fam.memberIds || []).map(String).filter(id => currentGenealogyData().sims[id]);
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
  if (!currentGenealogyData() || !currentGenealogyData().sims || !Array.isArray(currentGenealogyData().families)) return [];

  const allIds = Object.keys(currentGenealogyData().sims);
  const adjacency = new Map(allIds.map(id => [id, new Set()]));

  allIds.forEach(id => {
    familyGenealogyNeighborIds(currentGenealogyData().sims[id]).forEach(rawRelatedId => {
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

  const importedFamilies = currentGenealogyData().families.filter(fam => fam && fam.gameImport);
  const manualFamilies = currentGenealogyData().families.filter(fam => fam && !fam.gameImport);
  const familyIndex = new Map(currentGenealogyData().families.map((fam, index) => [fam.id, index]));

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
      const memberIds = (fam.memberIds || []).map(String).filter(id => currentGenealogyData().sims[id]);
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
  if (!currentGenealogyData() || !Array.isArray(currentGenealogyData().families)) return [];

  const normalizedMode =
    normalizeFamilySelectorMode(
      mode
    );

  if (
    familySelectorCache.entriesByMode.has(
      normalizedMode
    )
  ) {
    return familySelectorCache.entriesByMode.get(
      normalizedMode
    );
  }

  const entries =
    normalizedMode === 'household'
      ? buildHouseholdEntries()
      : normalizedMode === 'ea'
        ? buildEaTreeEntries()
        : buildExtendedFamilyComponents();

  familySelectorCache.entriesByMode.set(
    normalizedMode,
    entries
  );

  return entries;
}

function getFamilyTreeSelectionValue(mode) {
  if (mode === 'household') return familyTreeHouseholdSelectionValue;
  if (mode === 'ea') return familyTreeEaSelectionValue;
  return familyTreeExtendedSelectionValue;
}

function setFamilyTreeSelectionValue(mode, value) {
  const normalizedMode =
    normalizeFamilySelectorMode(
      mode
    );

  if (normalizedMode === 'household') {
    familyTreeHouseholdSelectionValue = value;
  } else if (normalizedMode === 'ea') {
    familyTreeEaSelectionValue = value;
  } else {
    familyTreeExtendedSelectionValue = value;
  }

  familySelectorCache.activeByMode.delete(
    normalizedMode
  );
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
  const normalizedMode =
    normalizeFamilySelectorMode(
      mode
    );

  const entries =
    getFamilySelectorEntries(
      normalizedMode
    );

  if (!entries.length) return null;

  const selectedValue =
    getFamilyTreeSelectionValue(
      normalizedMode
    );

  const activeKey =
    [
      selectedValue || '',
      currentFamily()?.id || ''
    ].join('|');

  const cached =
    familySelectorCache.activeByMode.get(
      normalizedMode
    );

  if (
    cached &&
    cached.key === activeKey &&
    entries.includes(cached.entry)
  ) {
    return cached.entry;
  }

  let entry =
    entries.find(item =>
      item.value === selectedValue
    );

  if (!entry) {
    entry =
      findBestFamilySelectorEntry(
        currentFamily(),
        entries
      );

    setFamilyTreeSelectionValue(
      normalizedMode,
      entry?.value || null
    );
  }

  if (entry) {
    familySelectorCache.activeByMode.set(
      normalizedMode,
      {
        key:[
          getFamilyTreeSelectionValue(
            normalizedMode
          ) || '',
          currentFamily()?.id || ''
        ].join('|'),
        entry
      }
    );
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
      ? currentGenealogyData().families.find(fam => fam.id === familyTreeLastSourceFamilyId)
      : previousFamily;

  const selected = findBestFamilySelectorEntry(sourceFamily || previousFamily, entries);

  setFamilyTreeSelectionValue(
    familyTreeViewMode,
    selected?.value || null
  );

  if (selected?.familyId && currentGenealogyData().families.some(fam => fam.id === selected.familyId)) {
    genealogyStore.setCurrentFamilyId(selected.familyId);
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
    genealogyViewport.fit();
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

  window.addEventListener('resize', createDebouncedCallback(() => {
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
  cancelText = '取消',
  secondaryText = '',
  secondaryValue = null,
  secondaryKind = 'default',
  secondaryHint = '',
  confirmHint = '',
  confirmValue = true,
  cancelValue = mode === 'confirm' ? false : null
} = {}) {
  const overlay = $('confirmationDialog');
  const dialog = $('uiDialog');
  const titleEl = $('uiDialogTitle');
  const messageEl = $('uiDialogMessage');
  const inputEl = $('uiDialogInput');
  const cancelBtn = $('uiDialogCancel');
  const secondaryBtn = $('uiDialogSecondary');
  const confirmBtn = $('uiDialogConfirm');
  const titleHint = $('uiDialogTitleHint');
  const closeBtn = $('uiDialogClose');

  if (!overlay || !dialog || !titleEl || !messageEl || !inputEl || !cancelBtn || !secondaryBtn || !confirmBtn || !titleHint || !closeBtn) {
    return Promise.resolve(
      mode === 'confirm'
        ? false
        : mode === 'choice'
          ? null
          : mode === 'prompt'
            ? null
            : true
    );
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
  const hasSecondaryAction =
    !!String(secondaryText || '').trim();

  dialog.dataset.actionCount =
    mode === 'alert'
      ? '1'
      : hasSecondaryAction
        ? '3'
        : '2';

  confirmBtn.textContent = uiText(confirmText);
  cancelBtn.textContent = uiText(cancelText);
  cancelBtn.style.display = mode === 'alert' ? 'none' : '';

  secondaryBtn.textContent =
    hasSecondaryAction
      ? uiText(secondaryText)
      : '';

  secondaryBtn.hidden =
    !hasSecondaryAction;

  secondaryBtn.classList.toggle(
    'danger',
    hasSecondaryAction &&
    secondaryKind === 'danger'
  );

  const confirmHintText =
    String(confirmHint || '').trim();

  const secondaryHintText =
    String(secondaryHint || '').trim();

  const titleHintSections = [];

  if (confirmHintText) {
    titleHintSections.push(
      `${uiText(confirmText)}：${uiText(confirmHintText)}`
    );
  }

  if (
    hasSecondaryAction &&
    secondaryHintText
  ) {
    titleHintSections.push(
      `${uiText(secondaryText)}：${uiText(secondaryHintText)}`
    );
  }

  const titleHintText =
    titleHintSections.join('\n\n');

  titleHint.hidden =
    !titleHintText;

  if (titleHintText) {
    titleHint.dataset.tooltip =
      titleHintText;

    titleHint.setAttribute(
      'aria-label',
      uiText('匯入方式說明')
    );
  } else {
    delete titleHint.dataset.tooltip;
  }

  inputEl.classList.toggle('show', mode === 'prompt');
  inputEl.value = mode === 'prompt' ? uiText(defaultValue) : '';

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');

  return new Promise(resolve => {
    _uiDialogResolve = resolve;

    const finishConfirm = () => {
      if (mode === 'prompt') {
        closeUiDialog(inputEl.value);
        return;
      }

      closeUiDialog(confirmValue);
    };

    const finishSecondary = () =>
      closeUiDialog(secondaryValue);

    const finishCancel = () =>
      closeUiDialog(cancelValue);

    confirmBtn.onclick = finishConfirm;
    secondaryBtn.onclick =
      hasSecondaryAction
        ? finishSecondary
        : null;
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
        return;
      }

      dialog.focus({
        preventScroll:true
      });
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


function createDebouncedCallback(callback, wait = 150) {
  let timerId = null;

  return function debouncedCallback(...args) {
    const context = this;

    if (timerId !== null) {
      window.clearTimeout(timerId);
    }

    timerId =
      window.setTimeout(
        () => {
          timerId = null;
          callback.apply(
            context,
            args
          );
        },
        wait
      );
  };
}

function currentFamily() {
  return genealogyStore.getCurrentFamily();
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
    ...(sim.traits || []),
    ...(sim.gameData?.preferences?.likesDislikes || [])
      .flatMap(item => [
        item?.displayName,
        item?.category?.localizedName
      ])
  ])
].filter(Boolean));

function uiText(value) {
  const text = String(value ?? '');
  if (typeof LING_I18N !== 'undefined' && LING_I18N.translate) return LING_I18N.translate(text);
  return text;
}

// ========【日期顯示格式】 設定 - 生日與遊戲日期屬於 App 呈現層，不由人物編輯器持有 ========
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

function isBuiltinSampleSim(sim) {
  return !!(
    sim &&
    currentGenealogyData()?.meta?.sample === true &&
    BUILTIN_SAMPLE_SIM_IDS.has(sim.id)
  );
}

function isBuiltinSampleFamily(family) {
  return !!(
    family &&
    currentGenealogyData()?.meta?.sample === true &&
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

function relationshipTypeLibraryValues(db = currentGenealogyData()) {
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

let relationshipTypePickerCategory='romance';
let relationshipTypePickerTrigger=null;
let relationshipTypePickerValue='';
let relationshipTypePickerOnSelect=null;

function relationshipTypePickerCategoryOf(option){
  if(option?.custom)return'custom';

  const rawCategory=
    SOCIAL_RELATIONSHIP_DEFINITIONS[
      option?.value
    ]?.category||
    '';

  if(
    rawCategory==='romance'||
    rawCategory==='intimacy'
  ){
    return'romance';
  }

  if(rawCategory==='friendship')return'friendship';
  if(rawCategory==='negative')return'negative';
  if(rawCategory==='social')return'social';
  if(rawCategory==='chosen-kin')return'chosen-kin';
  return'custom';
}

function relationshipTypePickerCategoryText(category){
  const labels={
    romance:'戀愛 / 親密',
    friendship:'友誼',
    negative:'負面',
    social:'生活 / 社會',
    'chosen-kin':'非血緣親屬',
    custom:'自訂'
  };

  return uiText(
    labels[category]||
    labels.romance
  );
}

function relationshipTypePickerTabMarkup(category){
  const text=
    relationshipTypePickerCategoryText(
      category
    );

  const lang=
    document.documentElement.lang||
    'zh-Hant';

  if(lang==='en'){
    const shortLabels={
      romance:'Romance',
      friendship:'Friends',
      negative:'Negative',
      social:'Social',
      'chosen-kin':'Chosen Kin',
      custom:'Custom'
    };

    return '<span class="family-nav-tab-label-en">'+
      esc(
        shortLabels[category]||
        text
      )+
    '</span>';
  }

  if(category==='romance'){
    const parts=
      text
        .split('/')
        .map(item=>item.trim())
        .filter(Boolean);

    return '<span class="family-nav-tab-lines">'+
      parts
        .map(item=>'<span>'+esc(item)+'</span>')
        .join('')+
    '</span>';
  }

  if(category==='chosen-kin'){
    const chars=[...text.replace(/\s+/g,'')];

    return '<span class="family-nav-tab-lines">'+
      '<span>'+esc(chars.slice(0,3).join(''))+'</span>'+
      '<span>'+esc(chars.slice(3).join(''))+'</span>'+
    '</span>';
  }

  const compact=
    text
      .replace(/\s*\/\s*/g,'')
      .replace(/\s+/g,'');

  return '<span class="family-nav-tab-lines">'+
    [...compact]
      .map(char=>'<span>'+esc(char)+'</span>')
      .join('')+
  '</span>';
}

function syncRelationshipTypePickerTabs(){
  document
    .querySelectorAll(
      '[data-relationship-category]'
    )
    .forEach(button=>{
      const category=
        button.dataset
          .relationshipCategory||
        'romance';

      const active=
        category===
        relationshipTypePickerCategory;

      button.classList.toggle(
        'active',
        active
      );

      button.setAttribute(
        'aria-selected',
        active?'true':'false'
      );

      button.setAttribute(
        'aria-label',
        relationshipTypePickerCategoryText(
          category
        )
      );

      button.title=
        relationshipTypePickerCategoryText(
          category
        );

      button.innerHTML=
        relationshipTypePickerTabMarkup(
          category
        );
    });
}

function syncRelationshipTypePickerValue(){
  const select=$('relationshipType');
  const value=$('relationshipTypeValue');
  const trigger=$('relationshipTypeTrigger');

  if(!select||!value||!trigger)return;

  const selected=
    [...select.options]
      .find(option=>
        option.value===
        select.value
      );

  const text=
    selected&&selected.value
      ? selected.textContent
      : uiText('選擇或輸入關係…');

  value.textContent=text;
  value.title=text;
}

function relationshipTypePickerFilteredOptions(){
  const query=
    String(
      $('relationshipTypeSearch')
        ?.value||
      ''
    )
      .trim()
      .toLocaleLowerCase();

  const options=
    relationshipTypeOptions();

  if(query){
    return options.filter(option=>
      String(option.label||'')
        .toLocaleLowerCase()
        .includes(query)
    );
  }

  return options.filter(option=>
    relationshipTypePickerCategoryOf(
      option
    )===
    relationshipTypePickerCategory
  );
}

function activeRelationshipTypePickerTrigger(){
  return (
    relationshipTypePickerTrigger||
    $('relationshipTypeTrigger')
  );
}

function activeRelationshipTypePickerValue(){
  if(relationshipTypePickerOnSelect){
    return normalizeRelationshipTypeText(
      relationshipTypePickerValue
    );
  }

  return normalizeRelationshipTypeText(
    $('relationshipType')?.value
  );
}

function commitRelationshipTypePickerValue(value){
  const normalized=
    normalizeRelationshipTypeText(
      value
    );

  if(!normalized)return;

  if(relationshipTypePickerOnSelect){
    relationshipTypePickerValue=
      normalized;

    relationshipTypePickerOnSelect(
      normalized
    );

    return;
  }

  setRelationshipTypePickerValue(
    normalized
  );
}

function renderRelationshipTypePickerOptions(){
  const host=$('relationshipTypeOptions');
  const search=$('relationshipTypeSearch');

  if(!host)return;

  const raw=
    String(search?.value||'')
      .trim();

  const options=
    relationshipTypePickerFilteredOptions();

  const selected=
    activeRelationshipTypePickerValue();

  const optionMarkup=
    options
      .map(option=>{
        const active=
          option.value===selected;

        const descriptor=
          SOCIAL_RELATIONSHIP_DEFINITIONS[
            option.value
          ];

        return (
          '<button class="relationship-type-option'+
          (active?' selected':'')+
          '" type="button" role="option" aria-selected="'+
          (active?'true':'false')+
          '" data-relationship-type-value="'+
          esc(option.value)+
          '">'+
            (
              descriptor?.icon
                ? iconSvg(
                    descriptor.icon,
                    'relationship-type-option-icon'
                  )
                : iconSvg(
                    'tag',
                    'relationship-type-option-icon'
                  )
            )+
            '<span>'+
              esc(option.label)+
            '</span>'+
          '</button>'
        );
      })
      .join('');

  const normalizedRaw=
    normalizeRelationshipTypeText(
      raw
    );

  const hasExact=
    normalizedRaw&&
    relationshipTypeOptions()
      .some(option=>
        option.value===
          normalizedRaw||
        String(option.label||'')
          .toLocaleLowerCase()===
        normalizedRaw
          .toLocaleLowerCase()
      );

  const createMarkup=
    normalizedRaw&&!hasExact
      ? '<button class="relationship-type-option relationship-type-create" type="button" data-create-relationship-type="'+
        esc(normalizedRaw)+
        '">'+
          iconSvg(
            'plus-lg',
            'relationship-type-option-icon'
          )+
          '<span>'+
            esc(
              relationshipCreateOptionText(
                normalizedRaw
              )
            )+
          '</span>'+
        '</button>'
      : '';

  host.innerHTML=
    optionMarkup||
    createMarkup
      ? optionMarkup+createMarkup
      : '<div class="relationship-type-empty">'+
        esc(uiText('沒有符合的項目'))+
        '</div>';

  host
    .querySelectorAll(
      '[data-relationship-type-value]'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        event=>{
          event.preventDefault();
          event.stopPropagation();

          commitRelationshipTypePickerValue(
            button.dataset
              .relationshipTypeValue||
            ''
          );

          closeRelationshipTypePicker();
        }
      );
    });

  host
    .querySelectorAll(
      '[data-create-relationship-type]'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        event=>{
          event.preventDefault();
          event.stopPropagation();

          commitRelationshipTypePickerValue(
            button.dataset
              .createRelationshipType||
            ''
          );

          relationshipTypePickerCategory=
            'custom';

          syncRelationshipTypePickerTabs();
          closeRelationshipTypePicker();
        }
      );
    });
}

function setRelationshipTypePickerValue(value){
  const select=$('relationshipType');
  if(!select)return;

  const normalized=
    normalizeRelationshipTypeText(
      value
    );

  if(
    normalized&&
    ![...select.options]
      .some(option=>
        option.value===
        normalized
      )
  ){
    const option=
      document.createElement(
        'option'
      );

    option.value=normalized;
    option.textContent=normalized;
    select.appendChild(option);
  }

  select.value=normalized;
  select.dispatchEvent(
    new Event(
      'change',
      {bubbles:true}
    )
  );

  syncRelationshipTypePickerValue();
}

function ensureRelationshipTypePortal(){
  let portal=$('relationshipTypePortal');

  if(portal)return portal;

  portal=document.createElement('div');
  portal.id='relationshipTypePortal';
  portal.className='relationship-type-portal';
  portal.hidden=true;

  document.body.appendChild(portal);
  return portal;
}

function positionRelationshipTypePicker(){
  const trigger=
    activeRelationshipTypePickerTrigger();

  const portal=$('relationshipTypePortal');
  const popover=$('relationshipTypePopover');
  const index=$('relationshipTypeIndex');

  if(
    !trigger||
    !portal||
    !popover||
    !index||
    popover.hidden
  )return;

  const rect=
    trigger.getBoundingClientRect();

  const margin=10;
  const gap=6;
  const tabWidth=52;
  const tabOverlap=1;

  const viewportWidth=
    Math.max(
      1,
      window.innerWidth||
      document.documentElement.clientWidth||
      1
    );

  const viewportHeight=
    Math.max(
      1,
      window.innerHeight||
      document.documentElement.clientHeight||
      1
    );

  const menuWidth=
    Math.min(
      300,
      Math.max(
        220,
        Math.min(
          rect.width+28,
          viewportWidth-
          margin*2-
          tabWidth
        )
      )
    );

  const menuLeft=
    Math.min(
      Math.max(
        margin+tabWidth,
        rect.left
      ),
      Math.max(
        margin+tabWidth,
        viewportWidth-
        menuWidth-
        margin
      )
    );

  const portalLeft=
    Math.max(
      margin,
      menuLeft-
      tabWidth+
      tabOverlap
    );

  const below=
    viewportHeight-
    rect.bottom-
    gap-
    margin;

  const above=
    rect.top-
    gap-
    margin;

  const openAbove=
    below<260&&
    above>below;

  const availableHeight=
    Math.max(
      220,
      openAbove
        ? above
        : below
    );

  const height=
    Math.min(
      390,
      availableHeight
    );

  const portalTop=
    openAbove
      ? Math.max(
          margin,
          rect.top-
          gap-
          height
        )
      : Math.min(
          viewportHeight-
          margin-
          height,
          rect.bottom+
          gap
        );

  portal.style.position='fixed';
  portal.style.left=
    Math.round(portalLeft)+'px';
  portal.style.top=
    Math.round(portalTop)+'px';
  portal.style.width=
    Math.round(
      tabWidth-
      tabOverlap+
      menuWidth
    )+'px';
  portal.style.height=
    Math.round(height)+'px';

  index.style.position='absolute';
  index.style.display='flex';
  index.style.left='0';
  index.style.top='0';
  index.style.width=
    tabWidth+'px';
  index.style.height='100%';

  popover.style.position='absolute';
  popover.style.left=
    Math.round(
      tabWidth-
      tabOverlap
    )+'px';
  popover.style.top='0';
  popover.style.bottom='auto';
  popover.style.width=
    Math.round(menuWidth)+'px';
  popover.style.height='100%';
  popover.style.maxHeight='100%';
}

function openRelationshipTypePicker({
  trigger=$('relationshipTypeTrigger'),
  value=null,
  onSelect=null
}={}){
  const picker=$('relationshipTypePicker');
  const popover=$('relationshipTypePopover');
  const index=$('relationshipTypeIndex');
  const search=$('relationshipTypeSearch');
  const portal=
    ensureRelationshipTypePortal();

  if(
    !trigger||
    !popover||
    !index||
    !portal
  )return;

  relationshipTypePickerTrigger=
    trigger;

  relationshipTypePickerOnSelect=
    typeof onSelect==='function'
      ? onSelect
      : null;

  relationshipTypePickerValue=
    value==null
      ? String(
          $('relationshipType')?.value||
          ''
        )
      : String(value||'');

  const normalizedCurrent=
    normalizeRelationshipTypeText(
      relationshipTypePickerValue
    );

  if(normalizedCurrent){
    relationshipTypePickerCategory=
      relationshipTypePickerCategoryOf({
        value:normalizedCurrent,
        custom:
          !SOCIAL_RELATIONSHIP_DEFINITIONS[
            normalizedCurrent
          ]
      });
  }

  if(
    index.parentElement!==
    portal
  ){
    portal.appendChild(
      index
    );
  }

  if(
    popover.parentElement!==
    portal
  ){
    portal.appendChild(
      popover
    );
  }

  portal.hidden=false;
  popover.hidden=false;

  picker?.classList.add(
    'open'
  );

  trigger.classList.add(
    'open'
  );

  trigger.setAttribute(
    'aria-expanded',
    'true'
  );

  if(search)search.value='';

  syncRelationshipTypePickerTabs();
  renderRelationshipTypePickerOptions();

  requestAnimationFrame(()=>{
    positionRelationshipTypePicker();

    search?.focus({
      preventScroll:true
    });
  });
}

function closeRelationshipTypePicker(){
  const picker=$('relationshipTypePicker');
  const trigger=
    activeRelationshipTypePickerTrigger();
  const portal=$('relationshipTypePortal');
  const popover=$('relationshipTypePopover');
  const index=$('relationshipTypeIndex');

  if(!popover)return;

  popover.hidden=true;

  if(portal){
    portal.hidden=true;
    portal.style.removeProperty('width');
    portal.style.removeProperty('height');
  }

  popover.style.removeProperty('height');
  popover.style.removeProperty('max-height');
  popover.style.removeProperty('width');

  if(index){
    index.style.display='none';
    index.style.removeProperty('height');
    index.style.removeProperty('width');
  }

  picker?.classList.remove(
    'open'
  );

  if(trigger){
    trigger.classList.remove(
      'open'
    );

    trigger.setAttribute(
      'aria-expanded',
      'false'
    );
  }

  relationshipTypePickerTrigger=null;
  relationshipTypePickerValue='';
  relationshipTypePickerOnSelect=null;
}


function setupRelationshipTypePicker(){
  const trigger=$('relationshipTypeTrigger');
  const popover=$('relationshipTypePopover');
  const search=$('relationshipTypeSearch');

  if(
    !trigger||
    !popover||
    trigger.dataset
      .relationshipPickerBound==='1'
  )return;

  trigger.dataset
    .relationshipPickerBound='1';

  trigger.addEventListener(
    'click',
    event=>{
      event.preventDefault();
      event.stopPropagation();

      if(popover.hidden){
        openRelationshipTypePicker({
          trigger,
          value:
            $('relationshipType')?.value||
            ''
        });
      }else{
        closeRelationshipTypePicker();
      }
    }
  );

  document
    .querySelectorAll(
      '[data-relationship-category]'
    )
    .forEach(button=>{
      button.addEventListener(
        'click',
        event=>{
          event.preventDefault();
          event.stopPropagation();

          relationshipTypePickerCategory=
            button.dataset
              .relationshipCategory||
            'romance';

          if(search)search.value='';

          syncRelationshipTypePickerTabs();
          renderRelationshipTypePickerOptions();
        }
      );
    });

  search?.addEventListener(
    'input',
    ()=>{
      renderRelationshipTypePickerOptions();
    }
  );

  search?.addEventListener(
    'keydown',
    event=>{
      if(event.key==='Escape'){
        event.preventDefault();
        const activeTrigger=
          activeRelationshipTypePickerTrigger();

        closeRelationshipTypePicker();
        activeTrigger?.focus();
      }
    }
  );

  document.addEventListener(
    'click',
    event=>{
      const pickerNow=
        $('relationshipTypePicker');

      const popoverNow=
        $('relationshipTypePopover');

      const indexNow=
        $('relationshipTypeIndex');

      const portalNow=
        $('relationshipTypePortal');

      const activeTrigger=
        activeRelationshipTypePickerTrigger();

      if(
        pickerNow?.contains(
          event.target
        )||
        activeTrigger?.contains(
          event.target
        )||
        portalNow?.contains(
          event.target
        )||
        popoverNow?.contains(
          event.target
        )||
        indexNow?.contains(
          event.target
        )
      ){
        return;
      }

      closeRelationshipTypePicker();
    }
  );

  window.addEventListener(
    'resize',
    createDebouncedCallback(
      positionRelationshipTypePicker,
      60
    )
  );

  document.addEventListener(
    'scroll',
    ()=>{
      if(!popover.hidden){
        positionRelationshipTypePicker();
      }
    },
    true
  );

  syncRelationshipTypePickerTabs();
  syncRelationshipTypePickerValue();
}
window.L1nGRelationshipTypePicker=
  Object.freeze({
    open({
      trigger,
      value='',
      onSelect=null
    }={}){
      openRelationshipTypePicker({
        trigger,
        value,
        onSelect
      });
    },
    close(){
      closeRelationshipTypePicker();
    }
  });


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

  syncRelationshipTypePickerValue();

  if(
    !$('relationshipTypePopover')
      ?.hidden
  ){
    renderRelationshipTypePickerOptions();
  }
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
    (currentGenealogyData()?.links || [])
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
        currentGenealogyData()?.sims?.[otherId]
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
    currentGenealogyData().sims || {}
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
    currentGenealogyData()?.sims?.[id];

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
    currentGenealogyData()?.sims?.[id];

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
          currentGenealogyData()?.sims?.[otherId]
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
      currentGenealogyData()?.sims?.[targetId]
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
    currentGenealogyData()?.relationshipMap?.[key];

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
    currentGenealogyData()?.sims?.[id];

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
      currentGenealogyData().sims[
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

    const sim = currentGenealogyData()?.sims?.[current.id];
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
      currentGenealogyData().sims[
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
      currentGenealogyData().sims[
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
    currentGenealogyData()?.sims?.[
      perspectiveId
    ];

  const target =
    currentGenealogyData()?.sims?.[
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
      currentGenealogyData().sims[
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
    currentGenealogyData()?.sims?.[
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
      currentGenealogyData().sims[
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
    currentGenealogyData()?.sims?.[
      perspectiveId
    ];

  const target =
    currentGenealogyData()?.sims?.[
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
      currentGenealogyData().sims[
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
        currentGenealogyData().sims[
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
    currentGenealogyData()?.sims?.[
      perspectiveId
    ];

  const target =
    currentGenealogyData()?.sims?.[
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
      currentGenealogyData().sims[
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
    (currentGenealogyData()?.links || [])
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
    currentGenealogyData()?.sims?.[
      perspectiveId
    ];

  const target =
    currentGenealogyData()?.sims?.[
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
      ? currentGenealogyData()?.sims?.[
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
    currentGenealogyData()?.sims?.[id]
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
function restoreAppMenuPortal(menu) {
  const popover =
    menu?._bodyPortalPopover;

  if (!popover) return;

  popover.classList.remove(
    'ui-menu-body-portal'
  );

  popover.style.removeProperty('top');
  popover.style.removeProperty('left');
  popover.style.removeProperty('right');
  popover.style.removeProperty('bottom');

  menu.appendChild(popover);
  menu._bodyPortalPopover = null;
}

function positionAppMenuPortal(
  menu,
  trigger,
  popover
) {
  const margin = 8;
  const gap = 4;
  const triggerRect =
    trigger.getBoundingClientRect();

  document.body.appendChild(popover);

  popover.classList.add(
    'ui-menu-body-portal'
  );

  const popoverRect =
    popover.getBoundingClientRect();

  const left =
    Math.max(
      margin,
      Math.min(
        triggerRect.right -
          popoverRect.width,
        window.innerWidth -
          popoverRect.width -
          margin
      )
    );

  const belowTop =
    triggerRect.bottom + gap;

  const aboveTop =
    triggerRect.top -
    popoverRect.height -
    gap;

  const top =
    belowTop +
      popoverRect.height <=
        window.innerHeight -
          margin
      ? belowTop
      : Math.max(
          margin,
          aboveTop
        );

  popover.style.left =
    Math.round(left) + 'px';

  popover.style.top =
    Math.round(top) + 'px';

  popover.style.right = 'auto';
  popover.style.bottom = 'auto';

  menu._bodyPortalPopover =
    popover;
}

function closeAppMenu(menu) {
  if (!menu) return;

  menu.classList.remove('open');

  menu
    .querySelector(
      ':scope > .ui-menu-trigger'
    )
    ?.setAttribute(
      'aria-expanded',
      'false'
    );

  restoreAppMenuPortal(menu);
}

function closeAppMenus(except = null) {
  document
    .querySelectorAll(
      '.ui-menu.open'
    )
    .forEach(menu => {
      if (menu === except) return;
      closeAppMenu(menu);
    });
}

let _appMenuGlobalBound = false;

function setupAppMenus() {
  document
    .querySelectorAll('.ui-menu')
    .forEach(menu => {
      const trigger =
        menu.querySelector(
          ':scope > .ui-menu-trigger'
        );

      if (
        !trigger ||
        trigger.dataset.menuBound === '1'
      ) {
        return;
      }

      trigger.dataset.menuBound = '1';

      trigger.addEventListener(
        'click',
        e => {
          e.preventDefault();
          e.stopPropagation();

          const willOpen =
            !menu.classList.contains(
              'open'
            );

          closeAppMenus(menu);

          if (!willOpen) {
            closeAppMenu(menu);
            return;
          }

          menu.classList.add('open');

          trigger.setAttribute(
            'aria-expanded',
            'true'
          );

          if (
            menu.dataset.menuPortal ===
            'body'
          ) {
            const popover =
              menu.querySelector(
                ':scope > .ui-menu-popover'
              );

            if (popover) {
              positionAppMenuPortal(
                menu,
                trigger,
                popover
              );
            }
          }
        }
      );

      menu
        .querySelectorAll(
          '.ui-menu-item'
        )
        .forEach(item =>
          item.addEventListener(
            'click',
            () => {
              setTimeout(
                () => closeAppMenus(),
                0
              );
            }
          )
        );
    });

  if (!_appMenuGlobalBound) {
    _appMenuGlobalBound = true;

    document.addEventListener(
      'click',
      e => {
        if (
          !e.target.closest?.(
            '.ui-menu, .ui-menu-body-portal'
          )
        ) {
          closeAppMenus();
        }
      }
    );

    document.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape') {
          closeAppMenus();
        }
      }
    );

    window.addEventListener(
      'resize',
      () => closeAppMenus()
    );
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

window.addEventListener('resize', createDebouncedCallback(() => {
  if (window.innerWidth > 720) {
    const current = sidebar.getBoundingClientRect().width;
    const clamped = clampSidebarWidth(current);
    if (Math.abs(clamped - current) > 0.5) applySidebarWidth(clamped);
  }
}, 80));


// ========【資料儲存佇列】 設定 - Runtime Save Coordinator 為唯一儲存 Authority ========
const genealogySaveCoordinator =
  genealogyRuntime?.createSaveCoordinator?.({
    delay:260,
    idleTimeout:700,

    serialize:() =>
      JSON.stringify(
        currentGenealogyData()
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

if (!genealogySaveCoordinator) {
  throw new Error(
    'Genealogy Runtime Save Coordinator is required.'
  );
}

function save({
  immediate = false
} = {}) {
  return genealogySaveCoordinator
    .request({
      immediate
    });
}

function _flushSave() {
  return genealogySaveCoordinator
    .flush();
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

function normalizeHexColor(value) {
  const source =
    String(value || '')
      .trim()
      .replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(source)) {
    return source
      .split('')
      .map(channel => channel + channel)
      .join('')
      .toLowerCase();
  }

  if (/^[0-9a-f]{6}$/i.test(source)) {
    return source.toLowerCase();
  }

  return '000000';
}

function clampRgbChannel(value) {
  return Math.max(
    0,
    Math.min(
      255,
      Math.round(
        Number(value) || 0
      )
    )
  );
}

function parseHexColor(value) {
  const hex =
    normalizeHexColor(value);

  return {
    r:parseInt(hex.slice(0, 2), 16),
    g:parseInt(hex.slice(2, 4), 16),
    b:parseInt(hex.slice(4, 6), 16)
  };
}

function formatRgbHex(r, g, b) {
  const channelHex =
    value =>
      clampRgbChannel(value)
        .toString(16)
        .padStart(2, '0');

  return (
    '#' +
    channelHex(r) +
    channelHex(g) +
    channelHex(b)
  );
}

function formatHexRgba(hex, alpha) {
  const color =
    parseHexColor(hex);

  return `rgba(${color.r},${color.g},${color.b},${alpha})`;
}

function relativeHexLuminance(hex) {
  const { r, g, b } =
    parseHexColor(hex);

  const linearChannel =
    channel => {
      const normalized =
        channel / 255;

      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow(
            (normalized + 0.055) / 1.055,
            2.4
          );
    };

  return (
    0.2126 * linearChannel(r) +
    0.7152 * linearChannel(g) +
    0.0722 * linearChannel(b)
  );
}

function blendHexColors(first, second, ratio) {
  const start =
    parseHexColor(first);

  const end =
    parseHexColor(second);

  const amount =
    Math.max(
      0,
      Math.min(
        1,
        Number(ratio) || 0
      )
    );

  return formatRgbHex(
    start.r + (end.r - start.r) * amount,
    start.g + (end.g - start.g) * amount,
    start.b + (end.b - start.b) * amount
  );
}

function shiftHexLightness(hex, amount) {
  const color =
    parseHexColor(hex);

  const delta =
    Math.max(
      -1,
      Math.min(
        1,
        Number(amount) || 0
      )
    );

  const shifted =
    channel =>
      delta < 0
        ? channel * (1 + delta)
        : channel + (255 - channel) * delta;

  return formatRgbHex(
    shifted(color.r),
    shifted(color.g),
    shifted(color.b)
  );
}

function resetThemeSurface() {
  [
    '--brand-gradient-start','--brand-gradient-end',
    '--brand-tint-start','--brand-tint-end',
    '--action-primary','--action-primary-hover',
    '--action-primary-strong','--selection-highlight',
    '--navigation-text','--navigation-text-muted',
    '--navigation-control-surface','--navigation-control-border',
    '--navigation-control-text','--navigation-control-placeholder',
    '--navigation-control-hover','--surface-canvas',
    '--surface-canvas-pattern','--text-primary','--text-secondary',
    '--surface-card','--border-default','--surface-input',
    '--overlay-backdrop','--surface-panel','--surface-item',
    '--surface-item-hover','--tag-surface','--tag-text',
    '--relationship-parent','--relationship-spouse',
    '--relationship-former-spouse','--relationship-adoptive',
    '--relationship-other','--relationship-label-surface',
    '--relationship-label-border','--nav-dropdown-bg',
    '--nav-dropdown-text','--nav-dropdown-border',
    '--nav-dropdown-divider','--nav-dropdown-hover-bg',
    '--nav-dropdown-hover-text','--nav-dropdown-selected-bg',
    '--nav-dropdown-selected-text','--nav-button-hover-bg',
    '--nav-active-bg','--nav-active-border','--nav-active-text',
    '--genealogy-roster-item-bg','--genealogy-roster-item-hover'
  ].forEach(property => document.body.style.removeProperty(property));

  document.body.removeAttribute('data-topbar-contrast');
}

function currentThemeSeedColors() {
  const style = getComputedStyle(document.body);

  return {
    c1:normalizeColorForInput(style.getPropertyValue('--brand-gradient-start'),'#ffffff'),
    c2:normalizeColorForInput(style.getPropertyValue('--brand-gradient-end'),'#dfeffc'),
    c3:normalizeColorForInput(style.getPropertyValue('--action-primary'),'#55acee')
  };
}

function paintThemeChoices() {
  if (!appearanceThemeGrid) return;

  const choices = THEME_PRESETS.map(theme => ({
    id:theme.id,
    name:uiText(theme.name),
    gradient:theme.grad
  }));

  choices.push({
    id:'custom',
    name:uiText('自訂配色'),
    gradient:'linear-gradient(120deg, ' + customColors.c1 + ' 0%, ' + customColors.c2 + ' 100%)'
  });

  appearanceThemeGrid.innerHTML = choices.map(choice => {
    const selected = choice.id === currentThemeId;
    const previewId = choice.id === 'custom' ? ' id="customCardPreview"' : '';

    const customClass =
      choice.id === 'custom'
        ? ' custom-trigger'
        : '';

    const previewStyle =
      (
        choice.id === 'custom' &&
        !hasSavedCustomTheme &&
        currentThemeId !== 'custom'
      )
        ? ''
        : ' style="background:' +
          choice.gradient +
          '"';

    return (
      '<button class="appearance-theme-card' +
      customClass +
      (selected ? ' selected' : '') +
      '" type="button" data-theme-id="' + esc(choice.id) +
      '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="appearance-theme-preview"' + previewId +
          previewStyle + '></span>' +
        '<span class="appearance-theme-meta">' +
          '<span class="appearance-theme-radio" aria-hidden="true"></span>' +
          '<span class="appearance-theme-card-name">' + esc(choice.name) + '</span>' +
        '</span>' +
      '</button>'
    );
  }).join('');

  appearanceThemeGrid.querySelectorAll('[data-theme-id]').forEach(button => {
    button.addEventListener('click', () => {
      const themeId = button.dataset.themeId || '';

      if (themeId === 'custom') {
        if (!hasSavedCustomTheme && currentThemeId !== 'custom') {
          customColors = currentThemeSeedColors();
        }

        customColor1.value = customColors.c1;
        customColor2.value = customColors.c2;
        customColor3.value = customColors.c3;
        appearanceCustomThemeEditor.hidden = !appearanceCustomThemeEditor.hidden;
        paintCustomThemePreview();
        return;
      }

      appearanceCustomThemeEditor.hidden = true;
      chooseThemePreset(themeId);
    });
  });
}

function syncThemeChoiceDisplay() {
  appearanceThemeGrid?.querySelectorAll('[data-theme-id]').forEach(button => {
    const selected = button.dataset.themeId === currentThemeId;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });

  const customPreview = document.getElementById('customCardPreview');

  if (customPreview) {
    customPreview.style.background =
      'linear-gradient(120deg, ' + customColors.c1 + ' 0%, ' + customColors.c2 + ' 100%)';
    customPreview.style.boxShadow =
      'inset 0 0 0 2px ' + formatHexRgba(customColors.c3,0.55);
  }
}

function chooseThemePreset(themeId, { persist = true } = {}) {
  const nextTheme = VALID_THEMES.includes(themeId) ? themeId : 'ling';

  resetThemeSurface();
  document.body.dataset.theme = nextTheme;
  currentThemeId = nextTheme;

  if (persist) {
    try { localStorage.setItem(THEME_KEY,nextTheme); } catch (_) {}
  }

  syncThemeChoiceDisplay();
  applyRelationshipLineSettings();
}

function chooseCustomTheme(primary, secondary, accentColor, { persist = true } = {}) {
  const c1 = normalizeColorForInput(primary,'#ffffff');
  const c2 = normalizeColorForInput(secondary,'#dfeffc');
  const c3 = normalizeColorForInput(accentColor,'#55acee');
  const averageLuminance = (relativeHexLuminance(c1) + relativeHexLuminance(c2)) / 2;
  const dark = averageLuminance < 0.34;
  const mixed = blendHexColors(c1,c2,0.45);

  const surfaceCanvas = dark
    ? shiftHexLightness(mixed,-0.44)
    : shiftHexLightness(mixed,0.84);
  const surfacePanel = dark
    ? shiftHexLightness(surfaceCanvas,0.09)
    : shiftHexLightness(surfaceCanvas,-0.03);
  const surfaceCard = dark
    ? shiftHexLightness(surfaceCanvas,0.15)
    : '#ffffff';
  const border = dark
    ? shiftHexLightness(surfaceCanvas,0.28)
    : shiftHexLightness(mixed,0.55);
  const textPrimary = dark ? '#f5f3f6' : '#2f3135';
  const textSecondary = dark ? '#bbb6bf' : '#737780';

  resetThemeSurface();
  document.body.dataset.theme = 'custom';

  [
    ['--brand-gradient-start',c1],['--brand-gradient-end',c2],
    ['--brand-tint-start',formatHexRgba(c3,dark ? 0.16 : 0.13)],
    ['--brand-tint-end',formatHexRgba(c3,dark ? 0.09 : 0.07)],
    ['--action-primary',c3],
    ['--action-primary-hover',shiftHexLightness(c3,dark ? 0.12 : -0.12)],
    ['--action-primary-strong',shiftHexLightness(c3,dark ? -0.16 : -0.30)],
    ['--selection-highlight',formatHexRgba(c3,dark ? 0.42 : 0.30)],
    ['--navigation-text',textPrimary],['--navigation-text-muted',textSecondary],
    ['--navigation-control-surface',dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.72)'],
    ['--navigation-control-border',dark ? 'rgba(255,255,255,.14)' : formatHexRgba(border,0.92)],
    ['--navigation-control-text',textPrimary],['--navigation-control-placeholder',textSecondary],
    ['--navigation-control-hover',dark ? 'rgba(255,255,255,.12)' : '#ffffff'],
    ['--surface-canvas',surfaceCanvas],['--surface-canvas-pattern',formatHexRgba(c3,dark ? 0.07 : 0.08)],
    ['--text-primary',textPrimary],['--text-secondary',textSecondary],
    ['--surface-card',surfaceCard],['--border-default',border],
    ['--surface-input',dark ? surfacePanel : '#ffffff'],
    ['--overlay-backdrop',dark ? 'rgba(0,0,0,.72)' : 'rgba(31,35,40,.36)'],
    ['--surface-panel',surfacePanel],['--surface-item',surfaceCard],
    ['--surface-item-hover',dark ? shiftHexLightness(surfaceCard,0.08) : shiftHexLightness(surfacePanel,-0.03)],
    ['--tag-surface',dark ? shiftHexLightness(surfacePanel,0.10) : formatHexRgba(c3,0.10)],
    ['--tag-text',dark ? shiftHexLightness(c3,0.28) : shiftHexLightness(c3,-0.20)],
    ['--relationship-parent',border],
    ['--relationship-spouse',shiftHexLightness(c3,dark ? 0.12 : -0.02)],
    ['--relationship-former-spouse',dark ? shiftHexLightness(border,0.18) : shiftHexLightness(border,-0.12)],
    ['--relationship-adoptive',dark ? '#7fa49a' : '#77998f'],
    ['--relationship-other',dark ? shiftHexLightness(border,0.22) : shiftHexLightness(border,-0.08)],
    ['--relationship-label-surface',dark ? formatHexRgba(surfaceCard,0.97) : 'rgba(255,255,255,.97)'],
    ['--relationship-label-border',border],
    ['--nav-dropdown-bg',surfaceCard],['--nav-dropdown-text',textPrimary],['--nav-dropdown-border',border],
    ['--nav-dropdown-divider',dark ? shiftHexLightness(surfacePanel,0.10) : surfacePanel],
    ['--nav-dropdown-hover-bg',dark ? shiftHexLightness(surfaceCard,0.08) : surfacePanel],
    ['--nav-dropdown-hover-text',textPrimary],
    ['--nav-dropdown-selected-bg',dark ? shiftHexLightness(surfaceCard,0.13) : shiftHexLightness(surfacePanel,-0.03)],
    ['--nav-dropdown-selected-text',textPrimary],
    ['--nav-button-hover-bg',dark ? shiftHexLightness(surfaceCard,0.07) : surfacePanel],
    ['--nav-active-bg',dark ? shiftHexLightness(surfaceCard,0.11) : surfacePanel],
    ['--nav-active-border',border],['--nav-active-text',textPrimary],
    ['--genealogy-roster-item-bg',surfaceCard],
    ['--genealogy-roster-item-hover',dark ? shiftHexLightness(surfaceCard,0.08) : surfacePanel]
  ].forEach(([property,value]) => document.body.style.setProperty(property,value));

  document.body.setAttribute('data-topbar-contrast',dark ? 'dark' : 'light');
  currentThemeId = 'custom';
  customColors = { c1,c2,c3 };
  hasSavedCustomTheme = true;

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY,'custom');
      localStorage.setItem(CUSTOM_COLORS_KEY,JSON.stringify(customColors));
    } catch (_) {}
  }

  syncThemeChoiceDisplay();
  applyRelationshipLineSettings();
}

function paintCustomThemePreview() {
  if (!appearanceCustomThemePreview) return;

  appearanceCustomThemePreview.style.background =
    'linear-gradient(120deg, ' + customColor1.value + ' 0%, ' + customColor2.value + ' 100%)';
  appearanceCustomThemePreview.style.boxShadow =
    'inset 0 0 0 2px ' + formatHexRgba(customColor3.value,0.58);
}

[customColor1,customColor2,customColor3].forEach(input => {
  input?.addEventListener('input',paintCustomThemePreview);
});

$('applyCustomBtn').onclick = () => {
  chooseCustomTheme(customColor1.value,customColor2.value,customColor3.value);
};

// ========【自由排列跨模式映射】 設定 - 檢視 / 編輯共用同一份視覺構圖 ========
function medianNumber(values) {
  const list =
    (values || [])
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

  if (!list.length) {
    return 1;
  }

  const middle =
    Math.floor(
      list.length / 2
    );

  return list.length % 2
    ? list[middle]
    : (
        list[middle - 1] +
        list[middle]
      ) / 2;
}

function captureFreeLayoutModeSnapshot(
  fam,
  mode
) {
  if (
    !fam ||
    !fam.freeLayout?.[mode] ||
    !getSceneLayout()?.pos
  ) {
    return null;
  }

  const entries = [];

  getSceneLayout()
    .visibleIds
    .forEach(id => {
      const position =
        getSceneLayout().pos.get(id);

      if (!position) {
        return;
      }

      const dimensions =
        genealogyScene
          .measurePersonCardById(
            id
          );

      if (
        !dimensions ||
        !Number.isFinite(
          dimensions.W
        ) ||
        !Number.isFinite(
          dimensions.H
        )
      ) {
        return;
      }

      entries.push({
        id:String(id),
        x:Number(position.x) || 0,
        y:Number(position.y) || 0,
        width:dimensions.W,
        height:dimensions.H,
        centerX:
          (Number(position.x) || 0) +
          dimensions.W / 2,
        centerY:
          (Number(position.y) || 0) +
          dimensions.H / 2
      });
    });

  if (!entries.length) {
    return null;
  }

  const minX =
    Math.min(
      ...entries.map(entry =>
        entry.x
      )
    );

  const minY =
    Math.min(
      ...entries.map(entry =>
        entry.y
      )
    );

  const maxX =
    Math.max(
      ...entries.map(entry =>
        entry.x +
        entry.width
      )
    );

  const maxY =
    Math.max(
      ...entries.map(entry =>
        entry.y +
        entry.height
      )
    );

  return {
    sourceMode:mode,
    entries,
    minX,
    minY,
    centerX:
      (minX + maxX) / 2,
    centerY:
      (minY + maxY) / 2
  };
}

function mapFreeLayoutSnapshotToMode(
  fam,
  targetMode,
  snapshot
) {
  if (
    !fam ||
    !snapshot?.entries?.length
  ) {
    return null;
  }

  const mappedEntries =
    snapshot.entries
      .map(entry => {
        const dimensions =
          genealogyScene
            .measurePersonCardById(
              entry.id
            );

        if (
          !dimensions ||
          !Number.isFinite(
            dimensions.W
          ) ||
          !Number.isFinite(
            dimensions.H
          )
        ) {
          return null;
        }

        return {
          ...entry,
          targetWidth:
            dimensions.W,
          targetHeight:
            dimensions.H
        };
      })
      .filter(Boolean);

  if (!mappedEntries.length) {
    return null;
  }

  // 檢視卡是直向、編輯卡是橫向；
  // 用兩種卡片尺寸的中位比例縮放人物中心間距，
  // 不直接複製 top / left，避免模式切換後整張圖擠在一起。
  const scaleX =
    medianNumber(
      mappedEntries.map(entry =>
        entry.targetWidth /
        Math.max(
          1,
          entry.width
        )
      )
    );

  const scaleY =
    medianNumber(
      mappedEntries.map(entry =>
        entry.targetHeight /
        Math.max(
          1,
          entry.height
        )
      )
    );

  const next = {};

  const provisional =
    mappedEntries.map(entry => {
      const centerX =
        snapshot.centerX +
        (
          entry.centerX -
          snapshot.centerX
        ) *
        scaleX;

      const centerY =
        snapshot.centerY +
        (
          entry.centerY -
          snapshot.centerY
        ) *
        scaleY;

      return {
        id:entry.id,
        x:
          centerX -
          entry.targetWidth / 2,
        y:
          centerY -
          entry.targetHeight / 2,
        width:
          entry.targetWidth,
        height:
          entry.targetHeight
      };
    });

  const nextMinX =
    Math.min(
      ...provisional.map(entry =>
        entry.x
      )
    );

  const nextMinY =
    Math.min(
      ...provisional.map(entry =>
        entry.y
      )
    );

  const translateX =
    snapshot.minX -
    nextMinX;

  const translateY =
    snapshot.minY -
    nextMinY;

  provisional.forEach(entry => {
    next[entry.id] = {
      x:
        entry.x +
        translateX,
      y:
        entry.y +
        translateY
    };
  });

  // 保留目前 selector 範圍以外、但玩家先前在目標模式排過的位置。
  const merged =
    cloneManualPositionMap(
      fam.manualPositions?.[
        targetMode
      ]
    );

  Object.assign(
    merged,
    next
  );

  return merged;
}

function normalizeGenealogyViewMode(mode) {
  return VALID_MODES.includes(mode)
    ? mode
    : 'edit';
}

function syncViewModeControl() {
  if (!modeToggle) return;

  const viewing =
    viewMode === 'view';

  setIconText(
    modeToggle,
    viewing
      ? 'eye'
      : 'pencil-square',
    viewing
      ? '檢視模式'
      : '編輯模式'
  );

  modeToggle.classList.toggle(
    'active',
    viewing
  );
}

function setGenealogyViewMode(mode) {
  viewMode =
    normalizeGenealogyViewMode(
      mode
    );

  _dimsCache.mode = null;
  _gapsCache.mode = null;

  syncViewModeControl();

  try {
    localStorage.setItem(
      MODE_KEY,
      viewMode
    );
  } catch (_) {}
}
function toggleViewMode() {
  const fam =
    currentFamily();
const sourceMode =
    viewMode;

  const targetMode =
    sourceMode === 'view'
      ? 'edit'
      : 'view';

  const sourceWasFree =
    !!fam.freeLayout[
      sourceMode
    ];

  const transferSnapshot =
    sourceWasFree
      ? captureFreeLayoutModeSnapshot(
          fam,
          sourceMode
        )
      : null;

  dragHistory.clear();
  clearNodeSelection();
  arrangeTool = 'pan';

  setGenealogyViewMode(
    targetMode
  );

  let mutation = null;

  if (
    sourceWasFree &&
    transferSnapshot
  ) {
    const mappedPositions =
      mapFreeLayoutSnapshotToMode(
        fam,
        targetMode,
        transferSnapshot
      );

    if (mappedPositions) {
      mutation =
        genealogyStore
          .setFamilyLayoutState(
            fam.id,
            targetMode,
            {
              freeLayout:true,
              manualPositions:
                mappedPositions
            }
          );
    }
  }

  if (mutation) {
    applyGenealogyMutation(
      mutation,
      {
        render:false
      }
    );
  }

  render();

  requestAnimationFrame(() =>
    genealogyViewport.fit()
  );
}
modeToggle.onclick = toggleViewMode;

// ========【關係線外觀】 設定 - 沿用現有外觀 UI，次要關係增加曲線與個別類型設定 ========
const REL_LINE_KEYS =
  ['parent','spouse','exspouse','adopt','other'];

const REL_LINE_DEFAULT_COLOR_VARS = {
  parent:'--relationship-parent',
  spouse:'--relationship-spouse',
  exspouse:'--relationship-former-spouse',
  adopt:'--relationship-adoptive',
  other:'--relationship-other'
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
    ? formatRgbHex(
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
  return normalizeRelationshipLineSetting(
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
  const seen = new Map();

  Object.keys(SOCIAL_RELATIONSHIP_DEFINITIONS).forEach(type => {
    seen.set(type,displayRelationshipText(type));
  });

  (currentGenealogyData()?.links || []).forEach(link => {
    const type = relationshipOtherType(link);
    if (!seen.has(type)) seen.set(type,displayRelationshipText(type));
  });

  return [...seen.entries()].map(([type,label]) => ({ type,label }));
}

function relationshipOtherDefaultSetting(
  type
) {
  const definition =
    SOCIAL_RELATIONSHIP_DEFINITIONS[
      String(type || '').trim()
    ];

  return {
    ...RELATIONSHIP_LINE_DEFAULTS.other,
    style:
      definition?.lineStyle ||
      RELATIONSHIP_LINE_DEFAULTS.other.style
  };
}

function getOtherRelationshipLineSetting(
  type
) {
  const fallback =
    relationshipOtherDefaultSetting(
      type
    );

  const normalized =
    normalizeRelationshipLineSetting(
      'other',
      relationshipLineSettings
        .otherTypes?.[type],
      fallback
    );

  return normalized;
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
      ...relationshipOtherDefaultSetting(
        type
      )
    };
  }

  const setting =
    relationshipLineSettings
      .otherTypes[type];

  return setting;
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
    genealogyScene?.requestUpdate?.({ edges:true }, { immediate:true });
  }
}

function relationshipStyleOptionsHTML() {
  return [
    ['solid','實線'],['short-dash','短虛線'],['long-dash','長虛線'],['dot','點線']
  ].map(([value,label]) =>
    '<option value="' + value + '">' + esc(uiText(label)) + '</option>'
  ).join('');
}

function otherRelationshipDomKey(type) {
  return encodeURIComponent(String(type));
}

function otherRelationshipTypeFromDomKey(key) {
  try { return decodeURIComponent(String(key || '')); }
  catch (_) { return String(key || ''); }
}

const RELATIONSHIP_EDITOR_LABELS = Object.freeze({
  parent:'父母 / 子女',spouse:'配偶',exspouse:'前任',adopt:'領養',other:'其他關係'
});

let activeRelationshipStyleKey = 'parent';
let activeOtherRelationshipType = '';

function relationshipEditorSetting() {
  if (activeRelationshipStyleKey !== 'other') {
    return relationshipLineSettings[activeRelationshipStyleKey];
  }

  const types = getOtherRelationshipTypes();
  if (!activeOtherRelationshipType || !types.some(entry => entry.type === activeOtherRelationshipType)) {
    activeOtherRelationshipType = types[0]?.type || '關聯';
  }
  return ensureOtherRelationshipLineSetting(activeOtherRelationshipType);
}

function syncOtherRelationshipTypeSelect() {
  const select = $('relationshipOtherTypeSelect');
  if (!select) return;

  const types = getOtherRelationshipTypes();
  if (!activeOtherRelationshipType || !types.some(entry => entry.type === activeOtherRelationshipType)) {
    activeOtherRelationshipType = types[0]?.type || '關聯';
  }

  const options = types.length ? types : [{ type:'關聯',label:uiText('關聯') }];
  const nextHtml = options.map(entry =>
    '<option value="' + esc(entry.type) + '">' + esc(entry.label) + '</option>'
  ).join('');

  if (select.dataset.optionsHtml !== nextHtml) {
    select.innerHTML = nextHtml;
    select.dataset.optionsHtml = nextHtml;
  }

  select.value = activeOtherRelationshipType;
}

function setRelationshipSwitchState(button,enabled) {
  button?.setAttribute('aria-pressed',enabled ? 'true' : 'false');
}

function relationshipFullPreviewPath(key,setting) {
  if (key === 'parent' || key === 'adopt') return 'M160 76 L160 114';

  if ((key === 'exspouse' || key === 'other') && setting.curved) {
    const amount = clampRelationshipCurveAmount(setting.curveAmount);
    const amplitude = 8 + (amount / 100) * 34;
    return 'M108 95 Q160 ' + (95 - amplitude) + ' 212 95';
  }

  return 'M108 95 L212 95';
}

function updateRelationshipFullPreview() {
  const preview = $('relationshipFullPreview');
  const path = $('relationshipFullPreviewPath');
  const arrowShape = $('relationshipPreviewArrowShape');
  if (!preview || !path) return;

  const key = activeRelationshipStyleKey;
  const setting = relationshipEditorSetting();
  const color = relationshipResolvedColor(setting,key === 'other' ? 'other' : key);
  const vertical = key === 'parent' || key === 'adopt';

  preview.dataset.orientation = vertical ? 'vertical' : 'horizontal';
  path.setAttribute('d',relationshipFullPreviewPath(key,setting));
  path.setAttribute('stroke',color);
  path.setAttribute('stroke-width',String(Math.max(1,Number(setting.width) || 1.5)));
  path.setAttribute('stroke-dasharray',relationshipDashValue(setting));
  path.removeAttribute('marker-start');
  path.removeAttribute('marker-end');
  arrowShape?.setAttribute('fill',color);

  if (key === 'other' && setting.showArrow) {
    path.setAttribute('marker-end','url(#relationshipPreviewArrow)');
    if (isSymmetricSocialRelationshipType(activeOtherRelationshipType)) {
      path.setAttribute('marker-start','url(#relationshipPreviewArrow)');
    }
  }
}

function syncRelationshipNavPreviews() {
  REL_LINE_KEYS.forEach(key => {
    const preview = document.querySelector('[data-rel-preview="' + key + '"]');
    const setting =
      key === 'other'
        ? (activeOtherRelationshipType
            ? getOtherRelationshipLineSetting(activeOtherRelationshipType)
            : relationshipLineSetting('other'))
        : relationshipLineSetting(key);

    updateRelationshipLinePreview(preview,setting,key === 'other' ? 'other' : key);
  });
}

function syncRelationshipLineControls() {
  const key = activeRelationshipStyleKey;
  const other = key === 'other';

  if (other) syncOtherRelationshipTypeSelect();
  const setting = relationshipEditorSetting();

  document.querySelectorAll('[data-rel-editor-key]').forEach(button => {
    const selected = button.dataset.relEditorKey === key;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',selected ? 'true' : 'false');
  });

  const title = $('relationshipEditorTitle');
  if (title) title.textContent = uiText(RELATIONSHIP_EDITOR_LABELS[key] || '關係線');

  const otherField = $('relationshipOtherTypeField');
  if (otherField) otherField.hidden = !other;

  const styleEl = $('relationshipEditorStyle');
  const widthEl = $('relationshipEditorWidth');
  const widthValue = $('relationshipEditorWidthValue');
  const colorEl = $('relationshipEditorColor');

  if (styleEl) {
    styleEl.value = setting.style;
    window.L1nGGenealogyUIController?.refreshControl?.(styleEl);
  }
  if (widthEl) widthEl.value = String(setting.width);
  if (widthValue) widthValue.textContent = Number(setting.width).toFixed(1).replace(/\.0$/,'') + ' px';
  if (colorEl) colorEl.value = relationshipResolvedColor(setting,other ? 'other' : key);

  const curveSupported = key === 'exspouse' || key === 'other';
  const arrowSupported = key === 'other';
  const featureRow = $('relationshipFeatureRow');
  const curveCell = $('relationshipCurveToggleCell');
  const arrowCell = $('relationshipArrowToggleCell');

  if (featureRow) {
    featureRow.hidden = !curveSupported && !arrowSupported;
    featureRow.classList.toggle('single',curveSupported && !arrowSupported);
  }
  if (curveCell) curveCell.hidden = !curveSupported;
  if (arrowCell) arrowCell.hidden = !arrowSupported;

  setRelationshipSwitchState($('relationshipEditorCurveToggle'),curveSupported && !!setting.curved);
  setRelationshipSwitchState($('relationshipEditorArrowToggle'),arrowSupported && !!setting.showArrow);

  const curveRow = $('relationshipEditorCurveAmountRow');
  const curveInput = $('relationshipEditorCurveAmount');
  const curveValue = $('relationshipEditorCurveAmountValue');

  if (curveRow) {
    curveRow.hidden = !curveSupported;
    curveRow.classList.toggle('is-disabled',!setting.curved);
    curveRow.setAttribute('aria-disabled',setting.curved ? 'false' : 'true');
  }
  if (curveInput) {
    curveInput.value = String(setting.curveAmount);
    curveInput.disabled = !setting.curved;
  }
  if (curveValue) curveValue.textContent = Math.round(setting.curveAmount) + '%';

  if (other) window.L1nGGenealogyUIController?.refreshControl?.($('relationshipOtherTypeSelect'));
  syncRelationshipNavPreviews();
  updateRelationshipFullPreview();
}

document.querySelectorAll('[data-rel-editor-key]').forEach(button => {
  button.addEventListener('click',() => {
    activeRelationshipStyleKey = button.dataset.relEditorKey || 'parent';
    syncRelationshipLineControls();
  });
});

$('relationshipOtherTypeSelect')?.addEventListener('change',event => {
  activeOtherRelationshipType = event.currentTarget.value || '';
  syncRelationshipLineControls();
});

$('relationshipEditorStyle')?.addEventListener('change',event => {
  const setting = relationshipEditorSetting();
  setting.style = REL_STROKE_STYLES.has(event.currentTarget.value) ? event.currentTarget.value : 'solid';
  saveRelationshipLineSettings();
});

$('relationshipEditorWidth')?.addEventListener('input',event => {
  const setting = relationshipEditorSetting();
  setting.width = Math.max(1,Math.min(4,Number(event.currentTarget.value) || 1.5));
  saveRelationshipLineSettings();
});

$('relationshipEditorColor')?.addEventListener('input',event => {
  relationshipEditorSetting().color = event.currentTarget.value;
  saveRelationshipLineSettings();
});

$('relationshipEditorCurveToggle')?.addEventListener('click',() => {
  const setting = relationshipEditorSetting();
  setting.curved = !setting.curved;
  setting.routing = 'manual';
  saveRelationshipLineSettings();
});

$('relationshipEditorArrowToggle')?.addEventListener('click',() => {
  if (activeRelationshipStyleKey !== 'other') return;
  const setting = relationshipEditorSetting();
  setting.showArrow = !setting.showArrow;
  saveRelationshipLineSettings();
});

$('relationshipEditorCurveAmount')?.addEventListener('input',event => {
  const setting = relationshipEditorSetting();
  setting.curveAmount = clampRelationshipCurveAmount(event.currentTarget.value);
  saveRelationshipLineSettings();
});

$('resetRelationshipStyleBtn')?.addEventListener('click',() => {
  relationshipLineSettings = createRelationshipLineSettings();
  try { localStorage.removeItem(REL_LINE_STYLE_KEY); } catch (_) {}
  applyRelationshipLineSettings();
  if (getSceneLayout()) genealogyScene?.requestUpdate?.({ edges:true },{ immediate:true });
});

function syncRelationshipLabelLockControl() {
  if (!labelLockToggle) return;

  setIconText(
    labelLockToggle,
    labelLocked
      ? 'unlock'
      : 'lock',
    labelLocked
      ? '解鎖關係'
      : '鎖定關係'
  );

  labelLockToggle.classList.toggle(
    'active',
    labelLocked
  );
}

function cancelRelationshipLabelDrag() {
  if (!labelDrag) return;

  labelDrag.el?.classList.remove(
    'dragging'
  );

  labelDrag = null;
}

function setRelationshipLabelLock(locked) {
  labelLocked =
    Boolean(locked);

  labelsSvg?.classList.toggle(
    'labels-locked',
    labelLocked
  );

  if (labelLocked) {
    cancelRelationshipLabelDrag();
  }

  syncRelationshipLabelLockControl();

  try {
    localStorage.setItem(
      LABEL_LOCK_KEY,
      labelLocked
        ? '1'
        : '0'
    );
  } catch (_) {}
}
function syncRelationshipToolbarVisibility() {
  if (!labelLockToggle) return;
  labelLockToggle.hidden = !showRelLabels;
  labelLockToggle.style.display = showRelLabels ? '' : 'none';
}
labelLockToggle.onclick = () => setRelationshipLabelLock(!labelLocked);

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

  syncCanvasBackgroundSurface();
}

function deriveCanvasBackgroundPresentation() {
  const imageUrl =
    resolveImageUrl(
      bgSettings.image
    );

  if (!imageUrl) {
    return {
      visible:false,
      properties:{}
    };
  }

  const repeated =
    bgSettings.fit === 'repeat';

  return {
    visible:true,
    properties:{
      '--custom-bg':
        `url("${imageUrl}")`,
      '--custom-bg-opacity':
        String(bgSettings.opacity),
      '--custom-bg-size':
        repeated
          ? 'auto'
          : bgSettings.fit,
      '--custom-bg-repeat':
        repeated
          ? 'repeat'
          : 'no-repeat'
    }
  };
}

function applyCanvasBackgroundPresentation(
  presentation
) {
  const root =
    document.documentElement;

  const propertyNames = [
    '--custom-bg',
    '--custom-bg-opacity',
    '--custom-bg-size',
    '--custom-bg-repeat'
  ];

  propertyNames.forEach(
    property => {
      const value =
        presentation
          .properties?.[property];

      if (value == null) {
        root.style.removeProperty(
          property
        );
      } else {
        root.style.setProperty(
          property,
          value
        );
      }
    }
  );

  viewport.classList.toggle(
    'has-bg',
    presentation.visible === true
  );
}

function syncCanvasBackgroundSurface() {
  applyCanvasBackgroundPresentation(
    deriveCanvasBackgroundPresentation()
  );
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

  preview.classList.toggle('has-image',!!url);

  const actions = $('appearanceBackgroundActions');
  if (actions) actions.hidden = !url;

  const opacityInput =
    $('appearanceBackgroundOpacity');
  const fitSelect =
    $('appearanceBackgroundFit');
  const hasBackground =
    !!url;

  if (opacityInput) {
    opacityInput.disabled =
      !hasBackground;
  }

  if (fitSelect) {
    fitSelect.disabled =
      !hasBackground;

    window
      .L1nGGenealogyUIController
      ?.refreshControl?.(
        fitSelect
      );
  }

  document
    .querySelectorAll(
      '[data-background-control]'
    )
    .forEach(control => {
      control.classList.toggle(
        'is-disabled',
        !hasBackground
      );
    });

  preview.dataset.dropLabel = uiText('放開以上傳背景圖片');
  preview.setAttribute(
    'aria-label',
    url
      ? uiText('更換背景圖片')
      : uiText('拖曳圖片到這裡，或點擊此區域選擇檔案')
  );
}

function openAppearancePanel() {
  $('appearanceBackgroundOpacity').value =
    Math.round(bgSettings.opacity * 100);
  $('appearanceBackgroundOpacityValue').textContent =
    Math.round(bgSettings.opacity * 100) + '%';
  $('appearanceBackgroundFit').value = bgSettings.fit;

  customColor1.value = customColors.c1;
  customColor2.value = customColors.c2;
  customColor3.value = customColors.c3;

  appearanceCustomThemeEditor.hidden = true;

  paintCustomThemePreview();
  paintThemeChoices();
  paintCanvasBackgroundPreview();

  appearanceDialog.classList.add('show');

  syncRelationshipLineControls();

  genealogyUI.mountFormControls(appearanceDialog);
  genealogyUI.refreshControl($('appearanceBackgroundFit'));
  genealogyUI.refreshControl($('relationshipEditorStyle'));
  genealogyUI.refreshControl($('relationshipOtherTypeSelect'));
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

  syncCanvasBackgroundSurface();
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

  syncCanvasBackgroundSurface();
  persistCanvasBackground();
}

function setCanvasBackgroundFit(fit) {
  bgSettings.fit =
    ['cover','contain','repeat'].includes(fit)
      ? fit
      : 'cover';

  syncCanvasBackgroundSurface();
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

  syncCanvasBackgroundSurface();
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
function closeStoragePanel() {
  storageDialog.classList.remove('show');
}

$('storageCloseBtn').onclick = closeStoragePanel;
storageDialog.onclick = event => {
  if (event.target === storageDialog) {
    closeStoragePanel();
  }
};

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

    customColors = { c1:'#ffffff', c2:'#dfeffc', c3:'#55acee' };
    hasSavedCustomTheme = false;
    bgSettings = { image:null, opacity:0.5, fit:'cover' };
    showRelLabels = true;
    personLibraryViewMode = 'detailed';
    relationshipLineSettings = JSON.parse(JSON.stringify(RELATIONSHIP_LINE_DEFAULTS));
    applyRelationshipLineSettings();
    applySidebarWidth(SIDEBAR_DEFAULT_WIDTH, { persist:false });
    setFamilyPanelCollapsed(false, { persist:false });
    chooseThemePreset('ling');
    setGenealogyViewMode('view');
    setRelationshipLabelLock(false);
    syncCanvasBackgroundSurface();
    paintCanvasBackgroundPreview();
    syncLayoutModeControls();
    const labelBtn = $('labelToggle');
    if (labelBtn) {
      labelBtn.classList.add('active');
      setIconText(labelBtn, 'tags', '隱藏關係');
    }
    paintThemeChoices();
    render();
    requestAnimationFrame(() => genealogyViewport.fit());
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

      personEditor.close();

      const sampleDb =
        prepareDatabase(
          buildSample()
        ).prepared;

      replaceCanonicalGenealogyDatabase(
        sampleDb
      );
      dragHistory.clear();
      save({ immediate:true });
      refreshFamilyUI();
      render();
      appearanceDialog.classList.remove('show');
      storageDialog.classList.remove('show');
      requestAnimationFrame(() => genealogyViewport.fit());
      uiToast('已恢復預設族譜。');
    } finally {
      delete restoreSampleBtn.dataset.confirmPending;
    }
  };
}

async function importCanvasBackgroundFile(
  file
) {
  try {
    await replaceCanvasBackground(
      file
    );
  } catch (error) {
    uiAlert(
      uiText('背景處理失敗：') +
        error.message,
      {
        title:'圖片處理失敗',
        kind:'danger'
      }
    );
  }
}

const appearanceBackgroundInput =
  $('appearanceBackgroundInput');

const appearanceBackgroundPreview =
  $('appearanceBackgroundPreview');

appearanceBackgroundPreview?.addEventListener(
  'click',
  () => appearanceBackgroundInput?.click()
);

$('appearanceBackgroundChangeBtn')?.addEventListener(
  'click',
  () => appearanceBackgroundInput?.click()
);

appearanceBackgroundInput.onchange =
  async event => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      await importCanvasBackgroundFile(
        file
      );
    } finally {
      event.target.value = '';
    }
  };

let appearanceBackgroundDragDepth = 0;

function isFileDrag(event) {
  const types =
    Array.from(
      event.dataTransfer?.types || []
    );

  return (
    types.includes('Files') ||
    !!event.dataTransfer?.files?.length
  );
}

function clearAppearanceBackgroundDragState() {
  appearanceBackgroundDragDepth = 0;
  appearanceBackgroundPreview
    ?.classList
    .remove('dragover');
}

appearanceBackgroundPreview
  ?.addEventListener(
    'dragenter',
    event => {
      if (!isFileDrag(event)) return;

      event.preventDefault();
      event.stopPropagation();

      appearanceBackgroundDragDepth++;

      appearanceBackgroundPreview
        .classList
        .add('dragover');
    }
  );

appearanceBackgroundPreview
  ?.addEventListener(
    'dragover',
    event => {
      if (!isFileDrag(event)) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect =
          'copy';
      }

      appearanceBackgroundPreview
        .classList
        .add('dragover');
    }
  );

appearanceBackgroundPreview
  ?.addEventListener(
    'dragleave',
    event => {
      if (!isFileDrag(event)) return;

      event.preventDefault();
      event.stopPropagation();

      appearanceBackgroundDragDepth =
        Math.max(
          0,
          appearanceBackgroundDragDepth - 1
        );

      if (
        appearanceBackgroundDragDepth ===
        0
      ) {
        appearanceBackgroundPreview
          .classList
          .remove('dragover');
      }
    }
  );

appearanceBackgroundPreview
  ?.addEventListener(
    'drop',
    async event => {
      if (!isFileDrag(event)) return;

      event.preventDefault();
      event.stopPropagation();

      const files =
        [...(
          event.dataTransfer?.files ||
          []
        )];

      clearAppearanceBackgroundDragState();

      if (!files.length) return;

      if (files.length > 1) {
        uiAlert(
          '請一次只拖曳一張背景圖片。',
          {
            title:'圖片處理失敗',
            kind:'danger'
          }
        );
        return;
      }

      await importCanvasBackgroundFile(
        files[0]
      );
    }
  );

appearanceDialog
  ?.addEventListener(
    'dragend',
    clearAppearanceBackgroundDragState
  );

appearanceDialog
  ?.addEventListener(
    'drop',
    event => {
      if (
        !appearanceBackgroundPreview
          ?.contains(event.target)
      ) {
        clearAppearanceBackgroundDragState();
      }
    }
  );

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

// ========【使用說明輸入方式】 設定 - 依實際操作切換電腦／觸控說明，不綁定裝置類型 ========
let helpInputMode =
  window.matchMedia?.(
    '(hover: none) and (pointer: coarse)'
  )?.matches
    ? 'touch'
    : 'desktop';

document.addEventListener(
  'pointerdown',
  event => {
    if (
      event.pointerType === 'touch' ||
      event.pointerType === 'pen'
    ) {
      helpInputMode = 'touch';
      return;
    }

    if (
      event.pointerType === 'mouse'
    ) {
      helpInputMode = 'desktop';
    }
  },
  true
);

document.addEventListener(
  'keydown',
  () => {
    helpInputMode = 'desktop';
  },
  true
);

function syncHelpInputContent() {
  helpDialog
    ?.querySelectorAll(
      '[data-help-mode]'
    )
    .forEach(element => {
      element.hidden =
        element.dataset.helpMode !==
        helpInputMode;
    });

  if (helpDialog) {
    helpDialog.dataset.helpInputMode =
      helpInputMode;
  }
}

function openHelpPanel() {
  syncHelpInputContent();
  helpDialog.classList.add('show');
}

function closeHelpPanel() {
  helpDialog.classList.remove('show');
}

$('helpBtn').onclick = openHelpPanel;
$('helpCloseBtn').onclick = closeHelpPanel;
helpDialog.onclick = event => {
  if (event.target === helpDialog) {
    closeHelpPanel();
  }
};

// ========【彈窗 Lifecycle】 設定 - Esc 只找最上層彈窗；各 subsystem 自己清理狀態 ========
const MODAL_LIFECYCLE_STACK = [
  { dialog:avatarCropDialog, close:() => closeAvatarCropEditor() },
  { dialog:lifePhotoEditorDialog, close:() => lifePhotoWorkspace.closeEditor() },
  { dialog:petEditorDialog, close:() => petEditorController.close() },
  { dialog:mask, close:() => personEditor.close() },
  { dialog:personProfileDialog, close:() => closePersonProfile() },
  { dialog:lifePhotoViewerDialog, close:() => lifePhotoWorkspace.closeViewer() },
  { dialog:helpDialog, close:() => closeHelpPanel() },
  { dialog:personLibraryDialog, close:() => personLibraryController.close() },
  { dialog:familyMemberPickerDialog, close:() => addMemberController.close() },
  { dialog:storageDialog, close:() => closeStoragePanel() },
  { dialog:appearanceDialog, close:() => closeAppearancePanel() }
];

function closeTopModal() {
  for (const lifecycle of MODAL_LIFECYCLE_STACK) {
    if (
      !lifecycle.dialog ||
      !lifecycle.dialog.classList.contains('show')
    ) {
      continue;
    }

    lifecycle.close();
    return true;
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
      : !!currentGenealogyData()?.sims?.[id];
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
      : Object.values(currentGenealogyData()?.sims || {});

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

function isDescendant(ancestorId, nodeId) {
  const queue = [nodeId];
  const seen = new Set();

  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);

    const sim = currentGenealogyData().sims[id];
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

    Object.values(currentGenealogyData().sims)
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
    uid,
    getParentRelations:(sim) => genealogyParentRelations(sim),
    isSiblingLink,
    siblingRelationType:SIBLING_RELATION_TYPE,
    siblingRelationLabel:SIBLING_RELATION_LABEL,
    normalizeRelationshipType:normalizeRelationshipTypeText,
    isBuiltInRelationshipType:isBuiltInSocialRelationshipType,
    isSymmetricRelationshipType:isSymmetricSocialRelationshipType,
    normalizeTraitText:cleanTraitDisplayText,
    normalizeAvatarFrame,
    petSpeciesValues:Object.keys(PET_SPECIES),
    sexedPetSpeciesValues:['dog','cat','horse'],
    cardSettingFieldKeys:CARD_SETTING_FIELD_KEYS,
    defaultCardViewSettings:DEFAULT_CARD_VIEW_SETTINGS,
    defaultCardEditSettings:DEFAULT_CARD_EDIT_SETTINGS,
    cardViewAppearances:['minimal','translucent','full']
  }) ||
  null;

if (!genealogyStore) {
  throw new Error('Genealogy Store failed to initialize.');
}

personEditor.bindStore(genealogyStore);

// ========【Canonical Database Replace】 設定 - 整庫替換後統一失效所有結構快取 ========
function replaceCanonicalGenealogyDatabase(
  nextData
) {
  const replaced =
    genealogyStore.replaceDatabase(
      nextData
    );

  invalidateFamilySelectorCache();
  genealogyScene?.invalidateTopologyCache?.();
  invalidateChildrenIndex();
  invalidateRelationshipGraph();

  return replaced;
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

  if (
    mutation.relationshipGraphChanged ||
    mutation.familyMembershipChanged ||
    mutation.familiesChanged
  ) {
    invalidateFamilySelectorCache();
    genealogyScene?.invalidateTopologyCache?.();
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


// ========【Trait 顯示文字】 設定 - 人物與寵物共用舊資料富文字清理 ========
function cleanTraitDisplayText(value) {
  const source =
    String(value ?? '');

  if (!source) {
    return '';
  }

  let decoded =
    source;

  if (
    source.includes('&') &&
    typeof document !== 'undefined'
  ) {
    const decoder =
      document.createElement(
        'textarea'
      );

    decoder.innerHTML =
      source;

    decoded =
      decoder.value;
  }

  return String(decoded)
    .replace(
      /<\s*br\s*\/?>/gi,
      ' '
    )
    .replace(
      /<\/?[a-z][^>]*>/gi,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

// ========【L1nG v1 資料載入整理】 設定 - canonical shape 由 Genealogy Store 唯一負責 ========
function collectReferencedAssetIds(targetDb = currentGenealogyData(), targetBg = bgSettings, { strict = false } = {}) {
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

function clearUnsupportedImageRefs(targetDb = currentGenealogyData(), targetBg = bgSettings) {
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
  const o = (currentGenealogyData().labelPositions || {})[key] || {};
  return { dx: o.dx || 0, dy: o.dy || 0 };
}

const RELATIONSHIP_LABEL_TEXT_CACHE_LIMIT = 3000;

function relationshipLabelFontStack() {
  const language =
    document.documentElement.lang ||
    'zh-Hant';

  if (language === 'zh-Hans') {
    return '"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';
  }

  if (language === 'en') {
    return '"Segoe UI",Inter,Arial,system-ui,sans-serif';
  }

  return '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
}

const relationshipLabelTextMetrics = (() => {
  const canvas =
    document.createElement(
      'canvas'
    );

  const context =
    canvas.getContext('2d');

  const widths =
    new Map();

  return {
    width(text, fontSize) {
      const font =
        relationshipLabelFontStack();

      const source =
        String(text ?? '');

      const size =
        Number(fontSize) || 12;

      const cacheKey =
        [font, size, source]
          .join('\u0001');

      if (widths.has(cacheKey)) {
        return widths.get(cacheKey);
      }

      context.font =
        `${size}px ${font}`;

      const width =
        context.measureText(
          source
        ).width;

      if (
        widths.size >=
        RELATIONSHIP_LABEL_TEXT_CACHE_LIMIT
      ) {
        widths.clear();
      }

      widths.set(
        cacheKey,
        width
      );

      return width;
    }
  };
})();

function measureRelationshipLabelText(
  text,
  fontSize
) {
  return relationshipLabelTextMetrics
    .width(
      text,
      fontSize
    );
}

const RELATIONSHIP_LABEL_ICON_SPRITE =
  '../../html%20icons/relationship-label-icons.svg?v=20260930-relationship-catalog';

function makeLabelSVG(x, y, iconName, text, key) {
  const fs = 12;
  const displayText =
    displayRelationshipText(text);

  const safeIcon =
    String(iconName || '')
      .replace(
        /[^a-z0-9-]/gi,
        ''
      );

  const hasIcon =
    !!safeIcon;

  const iconSize = 11;
  const iconGap = 4;

  const textWidth =
    measureRelationshipLabelText(
      displayText,
      fs
    );

  const contentWidth =
    textWidth +
    (
      hasIcon
        ? iconSize + iconGap
        : 0
    );

  // 依實際顯示語言量測；英文較長時標籤會自動擴寬，不再被裁切。
  const w =
    Math.max(
      Math.ceil(
        contentWidth + 24
      ),
      42
    );

  const h = 22;
  const contentStart =
    -contentWidth / 2;

  const iconX =
    contentStart;

  const iconY =
    -iconSize / 2;

  const textX =
    hasIcon
      ? contentStart +
        iconSize +
        iconGap
      : 0;

  const off =
    getLabelOffset(key);

  const tx =
    (x + off.dx)
      .toFixed(1);

  const ty =
    (y + off.dy)
      .toFixed(1);

  const keyAttr =
    key
      ? ` data-key="${esc(key)}"`
      : '';

  const iconMarkup =
    hasIcon
      ? `<use
          class="edge-label-icon"
          href="${RELATIONSHIP_LABEL_ICON_SPRITE}#rel-${safeIcon}"
          x="${iconX.toFixed(1)}"
          y="${iconY.toFixed(1)}"
          width="${iconSize}"
          height="${iconSize}"
          aria-hidden="true"
        />`
      : '';

  return `<g
    class="edge-label"
    ${keyAttr}
    data-x="${x.toFixed(1)}"
    data-y="${y.toFixed(1)}"
    transform="translate(${tx},${ty})"
  >
    <rect
      x="${(-w / 2).toFixed(1)}"
      y="${-h / 2}"
      width="${w.toFixed(1)}"
      height="${h}"
      rx="${h / 2}"
      fill="var(--relationship-label-surface)"
      stroke="var(--relationship-label-border)"
      stroke-width="1.5"
    />
    ${iconMarkup}
    <text
      class="edge-label-text"
      x="${textX.toFixed(1)}"
      y="0"
      text-anchor="${hasIcon ? 'start' : 'middle'}"
      dominant-baseline="middle"
    >${esc(displayText)}</text>
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
      currentGenealogyData().currentFamilyId
      ? currentTreeFamily()
      : currentGenealogyData().families.find(
          f => f.id === familyId
        );

  if (!fam) {
    return new Set();
  }

  const memberIds =
    (fam.memberIds || [])
      .map(String)
      .filter(id =>
        currentGenealogyData().sims[id]
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
      currentGenealogyData().currentFamilyId &&
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
      currentGenealogyData().sims[id];

    if (!sim) return;

    [
      ...(sim.spouseIds || []),
      ...(sim.exSpouseIds || [])
    ]
      .map(String)
      .forEach(relatedId => {
        if (
          currentGenealogyData().sims[
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
        currentGenealogyData().sims[id]
      )
    ) {
      result.delete(id);
    }
  });

  return result;
}

// ========【圖片預熱】 設定 - 只預先載入目前畫面會立即看到的圖片，避免 F5 後頭像逐張跳出 ========
function preloadCurrentViewAssets() {
  if (!assetStoreReady || !currentGenealogyData()) {
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
      currentGenealogyData().currentFamilyId
    );

  visibleIds.forEach(id => {
    const sim =
      currentGenealogyData().sims[id];

    if (sim) {
      addPriority(sim.avatar);
    }
  });

  // 側邊欄中目前不在主畫布的成員降為第二優先，
  // 不阻塞主畫布首次顯示。
  (currentFamily()?.memberIds || [])
    .forEach(id => {
      const sim =
        currentGenealogyData().sims[id];

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

// ========【族譜 Viewport】 設定 - 視角狀態與座標換算由獨立模組唯一管理 ========
genealogyViewport =
  window.L1nGGenealogyViewport?.create?.({
    dom:{
      viewport,
      stage,
      zoomValue:$('zoomValue')
    },
    getContentBounds:() =>
      genealogyScene?.readContentBounds?.() ||
      null,
    hasSceneLayout:() =>
      !!getSceneLayout()
  }) || null;

if (!genealogyViewport) {
  throw new Error(
    'Genealogy Viewport failed to initialize.'
  );
}

// ========【族譜 Scene】 設定 - Layout / Relationship Geometry / Renderer 唯一 Canvas Authority ========
genealogyScene =
  window.L1nGGenealogyScene?.create?.({
    runtime:genealogyRuntime,
    dom:{ stage, svg, labelsSvg, nodes },
    constants:{ PAD, RACE_PRESETS, GUIDE_SNAP_PX, RELATIONSHIP_VERTICAL_SNAP_PX },
    state:{
      getData:() => genealogyStore.getData(),
      getViewMode:() => viewMode,
      getFamilyTreeViewMode:() => familyTreeViewMode,
      getShowRelLabels:() => showRelLabels,
      getRelationshipPerspectiveId:() => relationshipPerspectiveSimId,
      getScale:() => genealogyViewport.getScale()
    },
    helpers:{
      getCardViewSettings, getCardEditSettings, cardViewAppearanceClass, cardSettingsHasBody,
      buildViewCardContentModel, renderViewCardLine, formatCardGender, formatCardAge,
      getActiveFamilySelectorEntry, currentTreeFamily, currentFamily, uiText, displayDataText,
      displayRelationshipText, isSiblingLink, resolveKinshipLabel, relationshipPerspectiveSim,
      clampRelationshipCurveAmount, relationshipLineSetting, relationshipOtherType,
      getOtherRelationshipLineSetting, isSymmetricSocialRelationshipType, relationshipResolvedColor, relationshipInlineSvgStyle,
      relationshipLayoutPriority, genealogyParentIds, genealogyParentRelationGroups, getChildrenOf, getRelInfoByKey, measureRelationshipLabelText,
      makeLabelSVG, getVisibleIds, syncNodeSelectionClasses, formatBirthdaySummary, esc, iconSvg, pairKey,
      avatarHTML, renderTraitTagSummary, renderPetChipSummary, genderClass, statusClass
    }
  }) || null;
if (!genealogyScene) throw new Error('Genealogy Scene failed to initialize.');
function getSceneLayout() { return genealogyScene?.readScenePlan?.() || null; }
// Viewport transform / zoom / fit / resize lifecycle 已移至 genealogy_viewport.js。
function focusSimOnCanvas(simId) {
  if (!simId || !currentGenealogyData()?.sims?.[simId]) return;
  if (!getSceneLayout() || !getSceneLayout().pos?.has(simId)) render();
  const pos = getSceneLayout()?.pos?.get(simId);
  if (!pos) return;
  const { W, H } = genealogyScene.measurePersonCard(currentGenealogyData().sims[simId]);
  const centerX =
    pos.x + PAD + W / 2;

  const centerY =
    pos.y + PAD + H / 2;

  genealogyViewport.focusWorldPoint(
    centerX,
    centerY,
    { minFocusScale:0.72 }
  );
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
  if (mask & APP_RENDER_DIRTY.chrome) { syncRelationshipPerspectiveUI(); syncLayoutModeControls(); }
  if (mask & APP_RENDER_DIRTY.lists) {
    if (personLibraryDialog.classList.contains('show')) renderPersonLibrary();
    if (familyMemberPickerDialog.classList.contains('show')) renderFamilyMemberPickerList();
  }
}
function invalidateRender(layers, { immediate = false } = {}) {
  genealogyScene?.requestUpdate?.({ layout:!!layers?.layout, nodes:!!layers?.nodes, edges:!!layers?.edges }, { immediate });
  if (layers?.chrome) appRenderDirtyMask |= APP_RENDER_DIRTY.chrome;
  if (layers?.lists) appRenderDirtyMask |= APP_RENDER_DIRTY.lists;
  if (!appRenderDirtyMask) return;
  if (immediate) { flushAppRenderInvalidation(); return; }
  if (appRenderInvalidationRaf) return;
  appRenderInvalidationRaf = requestAnimationFrame(() => { appRenderInvalidationRaf = 0; flushAppRenderInvalidation(); });
}
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

function personTraitDisplayLabels(
  traits,
  owner = null
) {
  const labels = [];

  for (const value of traits || []) {
    if (!value) continue;

    const label =
      personDisplayText(
        value,
        owner
      );

    if (label) {
      labels.push(label);
    }
  }

  return labels;
}

function renderTraitTagSummary(
  traits,
  owner = null
) {
  const labels =
    personTraitDisplayLabels(
      traits,
      owner
    );

  if (!labels.length) {
    return '';
  }

  const visible =
    labels.slice(
      0,
      MAX_TAGS
    );

  const hidden =
    labels.slice(
      MAX_TAGS
    );

  const parts = [];

  for (const label of visible) {
    parts.push(
      `<span class="tag" title="${esc(label)}">${esc(label)}</span>`
    );
  }

  if (hidden.length) {
    parts.push(
      `<span class="tag tag-more" title="${esc(hidden.join('、'))}">+${hidden.length}</span>`
    );
  }

  return parts.join('');
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

function petChipPresentation(
  pet,
  owner
) {
  const name =
    personDisplayText(
      pet?.name,
      owner
    );

  const breed =
    personDisplayText(
      pet?.breed,
      owner
    );

  return {
    name,
    breed,
    species:
      formatPetSpecies(
        pet
      ),
    icon:
      petIconFor(
        pet
      ),
    statusIcon:
      renderPetLifeStatusIcon(
        pet
      )
  };
}

function renderPetChipSummary(
  pets,
  owner = null
) {
  const source =
    Array.isArray(pets)
      ? pets
      : [];

  if (!source.length) {
    return '';
  }

  const parts = [];
  const visiblePets =
    source.slice(0, 3);

  for (const pet of visiblePets) {
    const item =
      petChipPresentation(
        pet,
        owner
      );

    const title =
      item.name +
      ' · ' +
      item.species +
      (
        item.breed
          ? ' · ' + item.breed
          : ''
      );

    parts.push(
      '<span class="person-card-pet-chip" title="' +
      esc(title) +
      '">' +
        '<span class="pet-icon">' +
          item.icon +
        '</span>' +
        (item.statusIcon || '') +
        esc(item.name) +
      '</span>'
    );
  }

  const remaining =
    source.length -
    visiblePets.length;

  if (remaining > 0) {
    parts.push(
      '<span class="person-card-pet-chip" title="' +
      esc(
        uiText(
          `${source.length} 只寵物`
        )
      ) +
      '">+' +
      remaining +
      '</span>'
    );
  }

  return parts.join('');
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

  (currentGenealogyData()?.links || [])
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
        currentGenealogyData().sims[
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
      ? currentGenealogyData().families.find(
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
      : currentGenealogyData().families
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
        ${(pet.traits || []).length
          ? '<div class="person-profile-pet-traits">' +
            (pet.traits || [])
              .map(value =>
                personDisplayText(
                  value,
                  model.person,
                  model.draft
                )
              )
              .filter(Boolean)
              .map(value =>
                '<span class="tag">' +
                  esc(value) +
                '</span>'
              )
              .join('') +
            '</div>'
          : ''}
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
          currentGenealogyData()?.sims?.[
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
    currentGenealogyData().sims[id];

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
    personEditor.open(id);
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

    genealogyUI.refreshSelect('phTitle');
    genealogyUI.refreshSelect('phStage');
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

    requestAnimationFrame(() => {
      lifePhotoEditorDialog
        .querySelector('.photo-modal')
        ?.focus({
          preventScroll:true
        });
    });
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
        currentGenealogyData().sims[
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
    const sim = currentGenealogyData().sims[simId];
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
  if (
    !getSceneLayout() ||
    arrangeTool !== 'select'
  ) {
    return;
  }

  selectedNodeIds.clear();

  getSceneLayout()
    .visibleIds
    .forEach(id =>
      selectedNodeIds.add(id)
    );

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

  const dims = genealogyScene.measurePersonCardById(id);

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

function seedVisibleScenePositionsForFreeLayout(
  fam,
  mode
) {
  const scene =
    getSceneLayout();

  if (!fam || !scene?.pos) {
    return null;
  }

  const seeded =
    cloneManualPositionMap(
      fam.manualPositions?.[mode]
    );

  scene.visibleIds.forEach(id => {
    const position =
      scene.pos.get(id);

    if (!position) return;

    seeded[id] = {
      x:position.x,
      y:position.y
    };
  });

  return genealogyStore.setFamilyLayoutState(
    fam.id,
    mode,
    {
      freeLayout:true,
      manualPositions:seeded
    }
  );
}

function applySelectedLayoutOperation(action) {
  const fam = currentFamily();
  if (!fam || !getSceneLayout()) return false;
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

  const activateFreeLayout =
    !fam.freeLayout[viewMode];

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

  if (!changed && !activateFreeLayout) {
    return false;
  }

  const freeLayoutMutation =
    activateFreeLayout
      ? seedVisibleScenePositionsForFreeLayout(
          fam,
          viewMode
        )
      : null;

  const positionMutation =
    genealogyStore.setNodePositions(
      fam.id,
      viewMode,
      nextPositions
    );

  const mutation =
    genealogyStore.mergeResults(
      freeLayoutMutation,
      positionMutation
    );

  applyGenealogyMutation(mutation);
  syncLayoutModeControls();
  syncNodeSelectionClasses();
  genealogyScene?.resizeStageToContent?.();

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
  if (!personCardMenu || !currentGenealogyData()?.sims?.[simId]) return;
  const sim = currentGenealogyData().sims[simId];
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
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="distribute-horizontal" ${canDistribute ? '' : 'disabled'}><span>${esc(uiText('水平等距'))}</span></button>
        <button class="person-card-menu-action" type="button" data-person-card-menu-action="distribute-vertical" ${canDistribute ? '' : 'disabled'}><span>${esc(uiText('垂直等距'))}</span></button>
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
  if (action === 'edit') { closePersonCardMenu(); personEditor.open(simId); return; }
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
    genealogyScene?.resizeStageToContent?.();

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

  if (
    field &&
    CARD_SETTING_FIELD_KEYS.includes(field)
  ) {
    const mode =
      personCardMenu.dataset.cardMode === 'edit'
        ? 'edit'
        : 'view';

    const mutation =
      genealogyStore.setCardField(
        mode,
        field,
        !!e.target.checked
      );

    applyGenealogyMutation(
      mutation,
      { refreshFamily:false }
    );

    positionPersonCardMenu(
      parseFloat(
        personCardMenu.style.left
      ) || 0,
      parseFloat(
        personCardMenu.style.top
      ) || 0
    );

    return;
  }

  if (
    e.target?.name ===
    'nodeCardAppearance'
  ) {
    const mutation =
      genealogyStore.setCardAppearance(
        e.target.value
      );

    applyGenealogyMutation(
      mutation,
      { refreshFamily:false }
    );

    positionPersonCardMenu(
      parseFloat(
        personCardMenu.style.left
      ) || 0,
      parseFloat(
        personCardMenu.style.top
      ) || 0
    );
  }
});

nodes.addEventListener('contextmenu', e => {
  const el = e.target.closest('.person-card[data-id]');
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  const id = el.dataset.id;
  if (genealogyScene.isFreeLayoutActive(currentFamily()) && arrangeTool === 'select' && !selectedNodeIds.has(id)) {
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
  const fam =
    currentGenealogyData()
      ? currentFamily()
      : null;

  const hasFamily =
    !!fam;

  const display =
    hasFamily
      ? ''
      : 'none';

  if (selectToolBtn) {
    selectToolBtn.style.display =
      display;
  }

  if (panToolBtn) {
    panToolBtn.style.display =
      display;
  }

  if (arrangeToolDivider) {
    arrangeToolDivider.style.display =
      display;
  }

  if (arrangeToolDividerEnd) {
    arrangeToolDividerEnd.style.display =
      display;
  }

  viewport.classList.toggle(
    'selection-tool-active',
    hasFamily &&
      arrangeTool === 'select' &&
      !spacePanHeld
  );

  viewport.classList.toggle(
    'pan-tool-active',
    hasFamily &&
      arrangeTool === 'pan' &&
      !spacePanHeld
  );

  viewport.classList.toggle(
    'temporary-pan',
    hasFamily &&
      spacePanHeld
  );

  if (selectToolBtn) {
    const active =
      hasFamily &&
      arrangeTool === 'select';

    selectToolBtn.classList.toggle(
      'active',
      active
    );

    selectToolBtn.setAttribute(
      'aria-pressed',
      active
        ? 'true'
        : 'false'
    );
  }

  if (panToolBtn) {
    const active =
      hasFamily &&
      arrangeTool === 'pan';

    panToolBtn.classList.toggle(
      'active',
      active
    );

    panToolBtn.setAttribute(
      'aria-pressed',
      active
        ? 'true'
        : 'false'
    );
  }

  // selection 是互動狀態，不屬於 free-layout 資料。
  // 切換自動 / 自由排列不再清掉目前多選。
  if (!hasFamily) {
    clearNodeSelection();
    marqueeState = null;

    if (selectionMarquee) {
      selectionMarquee.classList.remove(
        'show'
      );
    }
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
  const fam = currentGenealogyData() ? currentFamily() : null;
  return !!fam && genealogyScene.isFreeLayoutActive(fam) && (arrangeTool === 'pan' || spacePanHeld);
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


const TOUCH_DRAG_THRESHOLD_PX = 8;
const TOUCH_LONG_PRESS_MS = 520;
const activeTouchPointers = new Map();
const touchCardActivationSuppressed = new Set();

let touchPinchGeometry = null;
let touchLongPressTimer = 0;
let touchLongPressPointerId = null;

function isTouchCardActivationSuppressed(
  event
) {
  return (
    event?.pointerType === 'touch' &&
    touchCardActivationSuppressed.has(
      event.pointerId
    )
  );
}

function cancelTouchLongPress() {
  if (touchLongPressTimer) {
    window.clearTimeout(
      touchLongPressTimer
    );
  }

  touchLongPressTimer = 0;
  touchLongPressPointerId = null;
}

function getTouchPointerKind(
  target
) {
  const card =
    target?.closest?.(
      '.person-card[data-id]'
    );

  if (card) {
    return {
      kind:'card',
      simId:card.dataset.id
    };
  }

  if (
    target?.closest?.(
      '.edge-label'
    )
  ) {
    return {
      kind:'label',
      simId:null
    };
  }

  if (
    target?.closest?.(
      'button, a, input, textarea, select, [contenteditable="true"]'
    )
  ) {
    return {
      kind:'control',
      simId:null
    };
  }

  const fam =
    currentGenealogyData()
      ? currentFamily()
      : null;

  const isFree =
    !!fam &&
    genealogyScene.isFreeLayoutActive(
      fam
    );

  return {
    kind:
      isFree &&
      arrangeTool === 'select'
        ? 'canvas-select'
        : 'canvas-pan',
    simId:null
  };
}

function readTouchPairGeometry() {
  const points =
    [...activeTouchPointers.values()]
      .slice(0, 2);

  if (points.length < 2) {
    return null;
  }

  const [first, second] =
    points;

  const dx =
    second.clientX -
    first.clientX;

  const dy =
    second.clientY -
    first.clientY;

  return {
    centerX:
      (
        first.clientX +
        second.clientX
      ) / 2,
    centerY:
      (
        first.clientY +
        second.clientY
      ) / 2,
    distance:
      Math.max(
        Math.hypot(dx, dy),
        1
      )
  };
}

function suppressActiveTouchCardActivation() {
  activeTouchPointers.forEach(
    point => {
      point.blocked = true;

      if (
        point.kind === 'card'
      ) {
        touchCardActivationSuppressed.add(
          point.pointerId
        );
      }
    }
  );
}

function scheduleTouchCardLongPress(
  point
) {
  cancelTouchLongPress();

  touchLongPressPointerId =
    point.pointerId;

  touchLongPressTimer =
    window.setTimeout(
      () => {
        const current =
          activeTouchPointers.get(
            point.pointerId
          );

        touchLongPressTimer = 0;
        touchLongPressPointerId = null;

        if (
          !current ||
          current.moved ||
          current.blocked ||
          activeTouchPointers.size !== 1 ||
          !current.simId
        ) {
          return;
        }

        current.blocked = true;

        touchCardActivationSuppressed.add(
          current.pointerId
        );

        const fam =
          currentGenealogyData()
            ? currentFamily()
            : null;

        if (
          fam &&
          genealogyScene.isFreeLayoutActive(
            fam
          ) &&
          arrangeTool === 'select' &&
          !selectedNodeIds.has(
            current.simId
          )
        ) {
          selectedNodeIds.clear();
          selectedNodeIds.add(
            current.simId
          );
          syncNodeSelectionClasses();
        }

        renderPersonCardMenu(
          current.simId,
          current.clientX,
          current.clientY
        );
      },
      TOUCH_LONG_PRESS_MS
    );
}

function handleTouchPointerDown(
  event
) {
  if (
    event.pointerType !== 'touch'
  ) {
    return;
  }

  const descriptor =
    getTouchPointerKind(
      event.target
    );

  const point = {
    pointerId:event.pointerId,
    startX:event.clientX,
    startY:event.clientY,
    clientX:event.clientX,
    clientY:event.clientY,
    moved:false,
    blocked:false,
    kind:descriptor.kind,
    simId:descriptor.simId
  };

  activeTouchPointers.set(
    event.pointerId,
    point
  );

  if (
    activeTouchPointers.size === 1
  ) {
    if (
      point.kind === 'card'
    ) {
      scheduleTouchCardLongPress(
        point
      );
    } else if (
      point.kind === 'canvas-pan'
    ) {
      event.preventDefault();

      genealogyViewport.beginPan(
        event.clientX,
        event.clientY
      );
    } else if (
      point.kind === 'canvas-select'
    ) {
      event.preventDefault();
    }

    return;
  }

  const hasControl =
    [...activeTouchPointers.values()]
      .some(
        item =>
          item.kind === 'control'
      );

  if (hasControl) {
    return;
  }

  cancelTouchLongPress();
  suppressActiveTouchCardActivation();
  finishMarquee();
  genealogyViewport.cancelPan();
  hideSmartGuides();

  touchPinchGeometry =
    readTouchPairGeometry();

  event.preventDefault();
  event.stopPropagation();
}

function handleTouchPointerMove(
  event
) {
  if (
    event.pointerType !== 'touch'
  ) {
    return;
  }

  const point =
    activeTouchPointers.get(
      event.pointerId
    );

  if (!point) return;

  point.clientX =
    event.clientX;

  point.clientY =
    event.clientY;

  if (
    !point.moved &&
    Math.hypot(
      point.clientX - point.startX,
      point.clientY - point.startY
    ) >
      TOUCH_DRAG_THRESHOLD_PX
  ) {
    point.moved = true;

    if (
      point.pointerId ===
      touchLongPressPointerId
    ) {
      cancelTouchLongPress();
    }
  }

  if (
    touchPinchGeometry &&
    activeTouchPointers.size >= 2
  ) {
    const nextGeometry =
      readTouchPairGeometry();

    if (nextGeometry) {
      const factor =
        nextGeometry.distance /
        touchPinchGeometry.distance;

      genealogyViewport
        .transformGesture?.(
          touchPinchGeometry.centerX,
          touchPinchGeometry.centerY,
          nextGeometry.centerX,
          nextGeometry.centerY,
          factor
        );

      touchPinchGeometry =
        nextGeometry;
    }

    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (point.blocked) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (
    point.kind === 'canvas-pan'
  ) {
    event.preventDefault();
    event.stopPropagation();

    genealogyViewport.movePan(
      event.clientX,
      event.clientY
    );

    return;
  }

  if (
    point.kind === 'canvas-select'
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      point.moved &&
      !marqueeState
    ) {
      clearNodeSelection();

      marqueeState = {
        startX:point.startX,
        startY:point.startY,
        baseSelection:new Set()
      };
    }

    if (
      point.moved
    ) {
      updateMarquee(
        event.clientX,
        event.clientY
      );
    }
  }
}

function finishTouchPointer(
  event
) {
  if (
    event.pointerType !== 'touch'
  ) {
    return;
  }

  const point =
    activeTouchPointers.get(
      event.pointerId
    );

  if (!point) return;

  const wasPinching =
    !!touchPinchGeometry &&
    activeTouchPointers.size >= 2;

  if (
    event.type === 'pointercancel' &&
    point.kind === 'card'
  ) {
    touchCardActivationSuppressed.add(
      point.pointerId
    );
  }

  if (
    point.pointerId ===
    touchLongPressPointerId
  ) {
    cancelTouchLongPress();
  }

  if (
    point.kind === 'canvas-pan' &&
    !wasPinching
  ) {
    genealogyViewport.endPan();
  }

  if (
    point.kind === 'canvas-select' &&
    !wasPinching
  ) {
    if (point.moved) {
      finishMarquee();
    } else if (!point.blocked) {
      clearNodeSelection();
    }
  }

  activeTouchPointers.delete(
    event.pointerId
  );

  if (wasPinching) {
    finishMarquee();
    genealogyViewport.cancelPan();

    if (
      activeTouchPointers.size >= 2
    ) {
      touchPinchGeometry =
        readTouchPairGeometry();
    } else {
      touchPinchGeometry = null;
      suppressActiveTouchCardActivation();
    }
  }

  if (
    activeTouchPointers.size === 0
  ) {
    touchPinchGeometry = null;
    cancelTouchLongPress();
    genealogyViewport.endPan();

    window.setTimeout(
      () =>
        touchCardActivationSuppressed
          .clear(),
      0
    );
  }
}

viewport.addEventListener(
  'pointerdown',
  handleTouchPointerDown,
  true
);

viewport.addEventListener(
  'pointermove',
  handleTouchPointerMove,
  true
);

viewport.addEventListener(
  'pointerup',
  finishTouchPointer,
  true
);

viewport.addEventListener(
  'pointercancel',
  finishTouchPointer,
  true
);


viewport.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const onNode = !!e.target.closest('.person-card');
  const onLabel = !!e.target.closest('.edge-label');
  const fam = currentFamily();
  const isFree = genealogyScene.isFreeLayoutActive(fam);

  // 自由排列的框選會 preventDefault()，可能吃掉瀏覽器原生 dblclick。
  // 第二次按下空白畫布時直接執行置中，確保所有排列模式都一致。
  if (
    e.detail >= 2 &&
    !onNode &&
    !onLabel
  ) {
    e.preventDefault();
    finishMarquee();
    genealogyViewport.cancelPan();
    genealogyViewport.fit();
    return;
  }

  if (arrangeTool === 'select' && !spacePanHeld && !onNode && !onLabel) {
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

  genealogyViewport.beginPan(
    e.clientX,
    e.clientY
  );
});

window.addEventListener('mousemove', e => {
  if (marqueeState) {
    updateMarquee(
      e.clientX,
      e.clientY
    );
  }

  genealogyViewport.movePan(
    e.clientX,
    e.clientY
  );
});

window.addEventListener('mouseup', () => {
  finishMarquee();
  genealogyViewport.endPan();
});
viewport.addEventListener('dblclick', e => {
  if (e.target.closest('.person-card')) return;
  if (e.target.closest('.edge-label')) return;

  e.preventDefault();
  finishMarquee();
  genealogyViewport.cancelPan();
  genealogyViewport.fit();
});
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const d = e.deltaY;
  if (d === 0) return;
  const step = Math.min(Math.abs(d)/100, 2);
  const factor = d < 0 ? Math.pow(1.12, step) : Math.pow(1/1.12, step);
  genealogyViewport.zoomAt(
    e.clientX,
    e.clientY,
    factor
  );
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
  const cur = (currentGenealogyData().labelPositions || {})[key] || { dx:0, dy:0 };

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

  const screenDx =
    e.clientX -
    labelDrag.startX;

  const screenDy =
    e.clientY -
    labelDrag.startY;

  const worldDelta =
    genealogyViewport.screenDeltaToWorld(
      screenDx,
      screenDy
    );

  const rawDx = worldDelta.x;
  const rawDy = worldDelta.y;

  if (
    !labelDrag.moved &&
    Math.hypot(
      screenDx,
      screenDy
    ) > 3
  ) {
    labelDrag.moved = true;
    labelDrag.el.classList.add('dragging');
  }

  if (!labelDrag.moved) return;

  const snapDistance =
    genealogyViewport
      .screenPixelsToWorld(
        GUIDE_SNAP_PX
      );

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
  const oneScreenPixel =
    genealogyViewport
      .screenPixelsToWorld(1);
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
    return session.snap(
      rawX,
      rawY,
      genealogyViewport.getScale()
    );
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
      ...session.snapDelta(
        rawDeltaX,
        rawDeltaY,
        genealogyViewport.getScale()
      ),
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
        genealogyScene?.createDragGeometrySnapshot?.() || [],
      guideSnapPx:
        GUIDE_SNAP_PX,
      relationshipSnapPx:
        RELATIONSHIP_VERTICAL_SNAP_PX,
      relationshipTargets:
        genealogyScene?.createSingleDragRelationshipTargets?.(
          id
        ) || { x:[], y:[] }
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
        genealogyScene?.createDragGeometrySnapshot?.() || [],
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
const isFree = genealogyScene.isFreeLayoutActive(fam);
  const cardDragThreshold =
    e.pointerType === 'touch'
      ? TOUCH_DRAG_THRESHOLD_PX
      : 3;
  const cardTapThreshold =
    e.pointerType === 'touch'
      ? TOUCH_DRAG_THRESHOLD_PX
      : 5;

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
    let previewPosition = null;

    const dragPerformanceSession =
      createSingleDragPerformanceSession(
        id
      );

    const applyMove = ev => {
      if (fam.locked || !startPos) return;

      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;

      if (!moved && Math.hypot(dx, dy) > cardDragThreshold) {
        moved = true;
        el.classList.add('dragging');
      }

      if (!moved) return;

      const worldDelta =
        genealogyViewport
          .screenDeltaToWorld(
            dx,
            dy
          );

      const rawX =
        startPos.x +
        worldDelta.x;

      const rawY =
        startPos.y +
        worldDelta.y;
      const snapped =
        getSmartSnap(
          id,
          rawX,
          rawY,
          dragPerformanceSession
        );
      const nx = snapped.x;
      const ny = snapped.y;

      previewPosition = {
        x:nx,
        y:ny
      };

      genealogyScene.updateTransientPersonPosition(
        id,
        previewPosition
      );

      el.style.left = `${nx + PAD}px`;
      el.style.top = `${ny + PAD}px`;

      hideSmartGuides();
      if (snapped.guideX !== null) showSmartGuide('x', snapped.guideX);
      if (snapped.guideY !== null) showSmartGuide('y', snapped.guideY);
      if (snapped.spacingX) showEqualSpacingGuide(snapped.spacingX);
      if (snapped.spacingY) showEqualSpacingGuide(snapped.spacingY);
      genealogyScene?.updateRelationshipPreviewImmediately?.([id]);
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

    const onUp = ev => {
      moveFrame?.flush?.();
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);

      el.classList.remove('dragging');
      hideSmartGuides();

      if (moved && previewPosition) {
        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setNodePosition(
              fam.id,
              dragMode,
              id,
              previewPosition
            )
          );

        dragHistory.push({
          type:'card-layout',
          familyId:fam.id,
          mode:dragMode,
          before:beforeLayoutState,
          after:captureLayoutHistoryState(
            fam,
            dragMode
          )
        });

        applyGenealogyMutation(
          dragMutation,
          { render:false }
        );

        genealogyScene?.resizeStageToContent?.();
      } else if (!isTouchCardActivationSuppressed(ev)) {
        if (viewMode === 'view') openPersonProfile(id);
        else personEditor.open(id);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return;
  }

  // 自由排列 + 選取工具：左鍵負責單選 / Shift 多選 / 拖曳已選人物。
  if (arrangeTool === 'select') {
    e.preventDefault();
    e.stopPropagation();

    const shift =
      e.pointerType === 'touch'
        ? true
        : e.shiftKey;
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
        isFree
          ? (
              fam.manualPositions[viewMode][sid] ||
              getSceneLayout().pos.get(sid)
            )
          : getSceneLayout().pos.get(sid);

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
    let previewPositions = null;
    let dragInitialized =
      isFree;

    const dragPerformanceSession =
      dragIds.length === 1
        ? createSingleDragPerformanceSession(
            id
          )
        : createGroupDragPerformanceSession(
            dragIds,
            startPositions
          );

    const applyMove = ev => {
      if (fam.locked || !primaryStart) return;

      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;

      if (
        !moved &&
        Math.hypot(dx, dy) > cardDragThreshold
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

      const worldDelta =
        genealogyViewport
          .screenDeltaToWorld(
            dx,
            dy
          );

      const rawDeltaX =
        worldDelta.x;

      const rawDeltaY =
        worldDelta.y;

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

        genealogyScene.updateTransientPersonPosition(sid, { x:nx, y:ny });

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

      previewPositions =
        nextPositions;

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

      genealogyScene?.updateRelationshipPreviewImmediately?.(dragIds);
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

    const onUp = ev => {
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

      if (moved && previewPositions) {
        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setNodePositions(
              fam.id,
              viewMode,
              previewPositions
            )
          );

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

        genealogyScene?.resizeStageToContent?.();
      } else if (
        !isTouchCardActivationSuppressed(ev) &&
        shift &&
        wasSelected
      ) {
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
        !isTouchCardActivationSuppressed(ev) &&
        Math.hypot(
          ev.clientX - sx,
          ev.clientY - sy
        ) < cardTapThreshold
      ) {
        if (viewMode === 'view') {
          openPersonProfile(id);
        } else {
          personEditor.open(id);
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
    currentGenealogyData().sims[id];

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
  let previewPosition = null;

  const dragPerformanceSession =
    createSingleDragPerformanceSession(
      id
    );

  const applyMove = ev => {
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;

    if (
      !moved &&
      Math.hypot(dx, dy) > cardDragThreshold
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
        syncLayoutModeControls();
      }

      dragInitialized = true;
    }

    const worldDelta =
      genealogyViewport
        .screenDeltaToWorld(
          dx,
          dy
        );

    const rawX =
      startPos.x +
      worldDelta.x;

    const rawY =
      startPos.y +
      worldDelta.y;

    const snapped =
      getSmartSnap(
        id,
        rawX,
        rawY,
        dragPerformanceSession
      );

    const nx = snapped.x;
    const ny = snapped.y;

    previewPosition = {
      x:nx,
      y:ny
    };

    genealogyScene.updateTransientPersonPosition(
      id,
      previewPosition
    );

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

    genealogyScene?.updateRelationshipPreviewImmediately?.([id]);
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

  const onUp = ev => {
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

    if (moved && previewPosition) {
      dragMutation =
        genealogyStore.mergeResults(
          dragMutation,
          genealogyStore.setNodePosition(
            fam.id,
            dragMode,
            id,
            previewPosition
          )
        );

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

      genealogyScene?.resizeStageToContent?.();
    } else if (!isTouchCardActivationSuppressed(ev)) {
      if (viewMode === 'view') {
        openPersonProfile(id);
      } else {
        personEditor.open(id);
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

function deriveLayoutModeControlState(
  family
) {
  const free =
    genealogyScene
      .isFreeLayoutActive(
        family
      );

  return {
    free,
    layoutIcon:
      free
        ? 'arrows-move'
        : 'diagram-3',
    layoutText:
      free
        ? '自由排列'
        : '自動排列',
    lockVisible:free,
    resetVisible:free,
    lockActive:
      free &&
      family?.locked === true,
    lockIcon:
      family?.locked
        ? 'lock'
        : 'unlock',
    lockText:
      family?.locked
        ? '已鎖定'
        : '未鎖定'
  };
}

function syncLayoutModeControls() {
  const family =
    currentFamily();

  if (!family) {
    return;
  }

  const state =
    deriveLayoutModeControlState(
      family
    );

  const layoutButton =
    $('layoutToggle');

  const lockButton =
    $('lockToggle');

  const resetButton =
    $('resetLayoutBtn');

  setIconText(
    layoutButton,
    state.layoutIcon,
    state.layoutText
  );

  layoutButton?.classList.toggle(
    'active',
    state.free
  );

  if (resetButton) {
    resetButton.style.display =
      state.resetVisible
        ? ''
        : 'none';
  }

  if (lockButton) {
    lockButton.style.display =
      state.lockVisible
        ? ''
        : 'none';

    setIconText(
      lockButton,
      state.lockIcon,
      state.lockText
    );

    lockButton.classList.toggle(
      'active',
      state.lockActive
    );
  }

  updateArrangeToolUI();
}
$('layoutToggle').onclick = () => {
  const fam =
    currentFamily();
const before =
    captureLayoutHistoryState(
      fam,
      viewMode
    );

  let mutation;

  if (!fam.freeLayout[viewMode]) {
    const savedManual =
      fam.manualPositions[
        viewMode
      ] || {};

    const visibleIds =
      getSceneLayout()
        ?.visibleIds ||
      new Set();

    const hasSavedManual =
      [...visibleIds]
        .some(id => {
          const position =
            savedManual[id];

          return !!(
            position &&
            Number.isFinite(
              Number(position.x)
            ) &&
            Number.isFinite(
              Number(position.y)
            )
          );
        });

    if (hasSavedManual) {
      // 回到自由排列：恢復玩家上次手動成果。
      mutation =
        genealogyStore.setFamilyLayoutState(
          fam.id,
          viewMode,
          {
            freeLayout:true
          }
        );
    } else {
      // 第一次進入自由排列：以目前畫面位置建立 snapshot。
      mutation =
        seedVisibleScenePositionsForFreeLayout(
          fam,
          viewMode
        );
    }

    arrangeTool =
      'pan';
  } else {
    // 自動排列只切換顯示來源；manualPositions 必須保留。
    // 真正刪除手動成果只有「重設位置」能做。
    mutation =
      genealogyStore.setFamilyLayoutState(
        fam.id,
        viewMode,
        {
          freeLayout:false
        }
      );
  }

  applyGenealogyMutation(
    mutation
  );

  syncLayoutModeControls();

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
};

$('lockToggle').onclick = () => {
  const fam = currentFamily();
  if (!genealogyScene.isFreeLayoutActive(fam)) return;

  const mutation =
    genealogyStore.setFamilyLocked(
      fam.id,
      !fam.locked
    );

  applyGenealogyMutation(
    mutation,
    { render:false }
  );
  syncLayoutModeControls();
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

  const before =
    captureLayoutHistoryState(
      fam,
      viewMode
    );

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
  syncLayoutModeControls();

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

  requestAnimationFrame(() => genealogyViewport.fit());
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
  if (getSceneLayout()) genealogyScene?.requestUpdate?.({ edges:true }, { immediate:true });
};

function getFamilyGenerationLevels(fam) {
  return (
    genealogyScene?.mapGenerationLevels?.(
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
  const members = (fam.memberIds || []).map(id => currentGenealogyData().sims[id]).filter(Boolean).slice(0,4);
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
        if (id && currentGenealogyData().sims[id]) {
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
    requestAnimationFrame(() => genealogyViewport.fit());
  }
};

function renderFamilyMemberList(fam) {
  const list = $('familyMemberList');
  if (!list) return;

  let members =
    (fam.memberIds || [])
      .map(id => currentGenealogyData().sims[id])
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
      if (!simId || !currentGenealogyData().sims[simId]) return;

      if (action === 'view') openPersonProfile(simId);
      else if (action === 'edit') personEditor.open(simId);
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
const bio = $('familyBio'); if (bio && document.activeElement !== bio) bio.value = fam.bio || '';
  const members = (viewFamily.memberIds || []).map(id => currentGenealogyData().sims[id]).filter(Boolean);
  if ($('familyMemberCount')) $('familyMemberCount').textContent = String(members.length);
  if ($('familyGenerationCount')) $('familyGenerationCount').textContent = String(calculateFamilyGenerationCount(viewFamily));
  if ($('familyDeceasedCount')) $('familyDeceasedCount').textContent = String(members.filter(sim => sim.status === '已故' || sim.status === '幽靈').length);

  const gameDate = $('familyGameDate');
  if (gameDate) {
    const dateText = formatGameDate(currentGenealogyData() && currentGenealogyData().meta && currentGenealogyData().meta.realDateCurrentDate);
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
  syncLayoutModeControls();
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

  genealogyStore.setCurrentFamilyId(selectedEntry.familyId);
  familyTreeLastSourceFamilyId = selectedEntry.familyId;

  resetPersonLibraryOperations({ batch:false, add:true });
  resetFamilyMemberOperations();
  familyMemberOperationState.removeMode = false;
  personEditor.close();

  save();
  void preloadCurrentViewAssets();
  refreshFamilyUI();
  render();
  requestAnimationFrame(() => genealogyViewport.fit());
};
familyNameInput.addEventListener('input', syncFamilyNameInputWidth);
$('familyNameEditBtn')?.addEventListener('click', () => {
  familyNameInput.focus();
  familyNameInput.select();
});
if (document.fonts?.ready) document.fonts.ready.then(syncFamilyNameInputWidth).catch(() => {});
window.addEventListener('resize', createDebouncedCallback(syncFamilyNameInputWidth, 80));
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
  requestAnimationFrame(() => genealogyViewport.fit());
};
$('delFamilyBtn').onclick = async () => {
  if (currentGenealogyData().families.length <= 1) { uiAlert('至少需要保留一個家族。', { title: '無法刪除家族' }); return; }
  const fam = currentFamily();
  if (!await uiConfirm(`確定刪除家族「${displayDataText(fam.name, fam)}」嗎？\n（家族內所有模擬市民仍保留在模擬市民池中）`, { title: '刪除家族', kind: 'danger', confirmText: '刪除家族' })) return;
  const fallbackFamilyId =
    currentGenealogyData().families
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
  personEditor.close();
  applyGenealogyMutation(mutation);
  scheduleGC();
  requestAnimationFrame(() => genealogyViewport.fit());
};

// ========【共用 UI Controller】 設定 - 單選 / 搜尋 / 多選 / 可輸入建議由獨立 UI 模組負責 ========
const genealogyUI =
  window.L1nGGenealogyUI?.create?.({
    helpers:{
      uiText,
      esc,
      iconSvg,
      debounce:createDebouncedCallback,
      normalizeCreatableValue:normalizeRelationshipTypeText,
      createOptionText:relationshipCreateOptionText
    }
  }) || null;

if (!genealogyUI) {
  throw new Error('Genealogy UI failed to initialize.');
}

window.L1nGGenealogyUIController = genealogyUI;


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
    personEditor.renderAvatarPreview();
    personEditor.renderInfoPreviewIfActive();
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
  createDebouncedCallback(()=>{
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
  const c = currentGenealogyData().sims[simId];
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
            currentGenealogyData().sims[
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
        currentGenealogyData().sims[sid];

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

  (c.gameData?.deceasedSpouseIds || [])
    .forEach(sid => {
      const spouse =
        currentGenealogyData().sims[sid];

      if (!spouse) return;

      const key =
        'deceased-spouse:' +
        pairKey(simId, sid);

      if (seen.has(key)) return;

      push({
        key,
        label:
          uiText('已故配偶') +
          '：' +
          displayDataText(
            spouse.name,
            spouse
          ),
        semanticType:'deceased-spouse',
        defaultText:null
      });
    });

  (c.exSpouseIds || [])
    .forEach(sid => {
      const spouse =
        currentGenealogyData().sims[sid];

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

  (currentGenealogyData().links || [])
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
        currentGenealogyData().sims[
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
          currentGenealogyData().labelPositions &&
          currentGenealogyData().labelPositions[
            entry.key
          ] &&
          (
            currentGenealogyData().labelPositions[
              entry.key
            ].dx ||
            currentGenealogyData().labelPositions[
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
  if(!simId){
    renderRelAnnoList(
      null,
      'relationshipAnnotationSection',
      'relationshipAnnotationList',
      []
    );
    return;
  }

  const entries=
    buildRelationEntries(simId)
      .filter(entry=>
        entry.group==='other'
      );

  renderRelAnnoList(
    simId,
    'relationshipAnnotationSection',
    'relationshipAnnotationList',
    entries
  );
}

const petEditorController = {
  owner() {
    return simEditorState.simId
      ? currentGenealogyData().sims[simEditorState.simId]
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
      traits:[],
      avatar:null,
      avatarFrame:{ ...DEFAULT_AVATAR_FRAME }
    };
  },

  renderTraits() {
    const list =
      $('petTraitChipList');

    if (!list) return;

    list.innerHTML =
      petEditorState.traits
        .map(
          (trait, index) =>
            '<span class="trait-chip">' +
              '<span>' +
                esc(trait) +
              '</span>' +
              '<button type="button" class="trait-chip-remove" data-pet-trait-index="' +
                index +
                '" aria-label="' +
                esc(uiText('移除')) +
                '" title="' +
                esc(uiText('移除')) +
              '">×</button>' +
            '</span>'
        )
        .join('');

    list
      .querySelectorAll(
        '[data-pet-trait-index]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            const index =
              Number(
                button.dataset
                  .petTraitIndex
              );

            if (
              !Number.isInteger(index) ||
              index < 0 ||
              index >=
                petEditorState
                  .traits
                  .length
            ) {
              return;
            }

            petEditorState.traits.splice(
              index,
              1
            );

            this.renderTraits();
          }
        );
      });
  },

  addTraitsFromInput() {
    const input =
      $('petTraitInput');

    if (!input) return;

    const values =
      input.value
        .split(/[,，\n]+/)
        .map(value =>
          value.trim()
        )
        .filter(Boolean);

    if (!values.length) {
      return;
    }

    for (const value of values) {
      const normalized =
        value.toLocaleLowerCase();

      const duplicate =
        petEditorState.traits
          .some(existing =>
            existing
              .toLocaleLowerCase() ===
            normalized
          );

      if (!duplicate) {
        petEditorState.traits.push(
          value
        );
      }
    }

    input.value = '';
    this.renderTraits();
    input.focus();
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

    genealogyUI.refreshSelect('pGender');
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

    petEditorState.traits =
      Array.isArray(pet.traits)
        ? pet.traits
            .map(value =>
              owner
                ? displayDataText(
                    value,
                    owner
                  )
                : String(value || '')
            )
            .map(value =>
              String(value || '').trim()
            )
            .filter(Boolean)
        : [];

    this.renderTraits();

    const traitInput =
      $('petTraitInput');

    if (traitInput) {
      traitInput.value = '';
    }

    petEditorState.avatar =
      pet.avatar || null;

    petEditorState.avatarFrame =
      normalizeAvatarFrame(
        pet.avatarFrame
      );

    this.syncGenderVisibility();
    this.refreshAvatarPreview();

    [
      'pSpecies',
      'pGender',
      'pAgeStage',
      'pStatus'
    ].forEach(id =>
      genealogyUI.refreshSelect(id)
    );
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

    requestAnimationFrame(() => {
      petEditorDialog
        .querySelector('.pet-editor-modal')
        ?.focus({
          preventScroll:true
        });
    });
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
    petEditorState.traits = [];
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

    const nextPet = {
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
      traits:[
        ...petEditorState.traits
      ],
      avatar:
        petEditorState.avatar ||
        null,
      avatarFrame:
        normalizeAvatarFrame(
          petEditorState.avatarFrame
        )
    };

    if (
      previous?.gameData?.simId != null
    ) {
      const overrides =
        new Set(
          Array.isArray(
            previous.gameData.manualOverrides
          )
            ? previous.gameData.manualOverrides
                .map(String)
                .filter(Boolean)
            : []
        );

      const managedFields =
        window.L1nGGameImport
          ?.GAME_MANAGED_PET_FIELDS ||
        [];

      managedFields
        .forEach(field => {
          const previousValue =
            field === 'avatarFrame'
              ? normalizeAvatarFrame(
                  previous.avatarFrame
                )
              : previous[field];

          const nextValue =
            field === 'avatarFrame'
              ? normalizeAvatarFrame(
                  nextPet.avatarFrame
                )
              : nextPet[field];

          if (
            JSON.stringify(previousValue) !==
            JSON.stringify(nextValue)
          ) {
            overrides.add(
              field === 'avatarFrame'
                ? 'avatar'
                : field
            );
          }
        });

      nextPet.gameData = {
        ...(nextPet.gameData || {}),
        manualOverrides:[
          ...overrides
        ]
      };
    }

    return nextPet;
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
    personEditor.renderInfoPreviewIfActive();
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
    personEditor.renderInfoPreviewIfActive();
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
    personEditor.renderInfoPreviewIfActive();
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
            ${(pet.traits || []).length
              ? '<div class="pet-trait-summary">' +
                (pet.traits || [])
                  .map(value =>
                    owner
                      ? displayDataText(
                          value,
                          owner
                        )
                      : String(value || '')
                  )
                  .filter(Boolean)
                  .map(value =>
                    '<span class="tag">' +
                      esc(value) +
                    '</span>'
                  )
                  .join('') +
                '</div>'
              : ''}
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
          personEditor.renderInfoPreviewIfActive();
        }
      );
    });

  personEditor.renderInfoPreviewIfActive();
}

$('petAvatarInput').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await petEditorController.setAvatarFile(file);
    await openAvatarCropEditor('pet');
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

$('petTraitAddBtn')?.addEventListener(
  'click',
  () => {
    petEditorController
      .addTraitsFromInput();
  }
);

$('petTraitInput')?.addEventListener(
  'keydown',
  event => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    petEditorController
      .addTraitsFromInput();
  }
);

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

// ========【人物編輯器 Authority】 設定 - Draft / lifecycle / 關係編輯由獨立模組負責 ========
personEditor.mount({
  openAvatarCropEditor
});

function purgeSimData(id) {
  const mutation =
    genealogyStore.deleteSim(id);

  selectedNodeIds.delete(id);
  removePersonFromOperationState(id);

  return mutation;
}

function finalizeSimDataChange(mutation) {
  applyGenealogyMutation(mutation);
  personEditor.close();
  scheduleGC();
}

async function deleteChar(id) {
  const c = currentGenealogyData().sims[id];
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
    if (!personLibraryState.batchMode || !currentGenealogyData().sims[id]) return;

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
      [...personLibraryState.selection].filter(id => currentGenealogyData().sims[id])
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
      .filter(id => currentGenealogyData().sims[id]);

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
  closeAppMenus();

  const fam = currentFamily();
  const q = personLibrarySearch.value.trim().toLowerCase();
  const all = Object.values(currentGenealogyData().sims);

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

  if (
    list &&
    list.dataset.menuScrollBound !==
      '1'
  ) {
    list.dataset.menuScrollBound = '1';

    list.addEventListener(
      'scroll',
      () => closeAppMenus(),
      { passive:true }
    );
  }

  if (!filtered.length) {
    list.innerHTML = all.length
      ? '<div class="person-library-empty">沒有符合的人物</div>'
      : '<div class="person-library-empty">還沒有任何人物</div>';
    return;
  }

  list.innerHTML = filtered.map(s => {
    const familyNames = currentGenealogyData().families
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
      '<div class="ui-menu person-library-item-menu" data-menu-portal="body">' +
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
      if (!currentGenealogyData().sims[id]) return;

      if (action === 'view') {
        openPersonProfile(id);
      } else if (action === 'edit') {
        personEditor.open(id);
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

personLibrarySearch.oninput = createDebouncedCallback(renderPersonLibrary, 150);

$('personLibraryAddBtn').onclick = () => personEditor.open(null);
$('personLibraryCompactBtn').onclick = () => personLibraryController.setViewMode('compact');
$('personLibraryDetailedBtn').onclick = () => personLibraryController.setViewMode('detailed');
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
    if (!currentGenealogyData().sims[id]) return;

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

    Object.values(currentGenealogyData().sims).forEach(sim => {
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
    requestAnimationFrame(() => genealogyViewport.fit());
  }
};

function renderFamilyMemberPickerList() {
  const fam = currentFamily();
  const memberSet = new Set(fam.memberIds);
  const q = $('familyMemberPickerSearch').value.trim().toLowerCase();
  const all = Object.values(currentGenealogyData().sims);
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
      const fams = currentGenealogyData().families.filter(f => f.memberIds.includes(s.id)).map(f => displayDataText(f.name, f)).join(' · ') || uiText('（未歸屬）');
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

$('familyMemberPickerSearch').oninput = createDebouncedCallback(renderFamilyMemberPickerList, 150);

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
    const exportDb = JSON.parse(JSON.stringify(currentGenealogyData()));
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

  // 多數主題的 viewport 底色是透明，實際顯示的是 body 的 --surface-canvas；
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
  if (!currentGenealogyData() || !stage || !viewport) throw new Error('Genealogy canvas is not ready');

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

  const normalizedResult =
    genealogyStore.normalizeDatabase(
      raw
    );

  return {
    prepared:
      normalizedResult.data,
    changed:
      normalizedResult.changed
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

    replaceCanonicalGenealogyDatabase(
      nextDb
    );
    dragHistory.clear();
    bgSettings = { ...bgSettings, ...incomingBg };

    save({ immediate:true });
    persistCanvasBackground();
    refreshFamilyUI();
    syncCanvasBackgroundSurface();
    render();
    scheduleGC();
    requestAnimationFrame(() => genealogyViewport.fit());
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


function formatGameImportTime(
  value
) {
  if (!value) return '';

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  const language =
    window.LING_I18N?.language ||
    'zh-Hant';

  const locale =
    language === 'en'
      ? 'en-US'
      : language === 'zh-Hans'
        ? 'zh-CN'
        : 'zh-TW';

  return new Intl.DateTimeFormat(
    locale,
    {
      year:'numeric',
      month:'2-digit',
      day:'2-digit',
      hour:'2-digit',
      minute:'2-digit',
      hour12:false
    }
  ).format(date);
}

function gameSaveSlotLabel(
  save
) {
  if (!save) {
    return uiText('無存檔識別資料');
  }

  const slot =
    String(
      save.slotFile || ''
    ).trim();

  const name =
    String(
      save.name || ''
    ).trim();

  if (name && slot) {
    return name + ' / ' + slot;
  }

  return (
    name ||
    slot ||
    uiText('無存檔識別資料')
  );
}

function gameImportSourceMessageLines(
  analysis
) {
  const source =
    analysis?.source || {};

  const lines = [];

  if (
    source.verification ===
    'same_slot'
  ) {
    lines.push(
      uiText('已確認來自相同遊戲存檔。'),
      gameSaveSlotLabel(
        source.incomingSave
      )
    );
  } else if (
    source.verification ===
    'known_save'
  ) {
    lines.push(
      uiText('已確認為目前族譜曾接受的存檔來源。'),
      gameSaveSlotLabel(
        source.incomingSave
      )
    );
  } else if (
    source.verification ===
    'different_slot'
  ) {
    lines.push(
      uiText('偵測到不同的遊戲存檔。'),
      `${uiText('目前族譜')}：${gameSaveSlotLabel(source.currentSave)}`,
      `${uiText('這次匯入')}：${gameSaveSlotLabel(source.incomingSave)}`
    );
  } else if (
    source.verification ===
    'conflict'
  ) {
    lines.push(
      uiText('ZIP 內的存檔識別資料不一致，網站無法自動確認來源。')
    );
  } else {
    lines.push(
      uiText('目前無法確認存檔來源，將以相同遊戲人物作為更新參考。')
    );
  }

  if (source.olderImport) {
    lines.push(
      '',
      uiText('這份遊戲資料早於目前族譜最後一次匯入，更新可能會同步回較早的遊戲狀態。'),
      `${uiText('目前最後匯入')}：${formatGameImportTime(source.currentLastImportedAt)}`,
      `${uiText('這次匯出')}：${formatGameImportTime(source.incomingImportedAt)}`
    );
  }

  return lines;
}

function currentGameImportUpdateAnalysis(
  incomingDatabase
) {
  return window.L1nGGameImport
    .analyzeUpdateCandidate(
      currentGenealogyData(),
      incomingDatabase
    );
}

async function chooseGameImportMode(
  analysis
) {
  const currentDatabase =
    currentGenealogyData();

  // 內建預設族譜只是示範資料，第一次匯入真正遊戲 ZIP 時直接建立新族譜。
  if (
    currentDatabase?.meta?.sample === true
  ) {
    return 'replace';
  }

  if (
    !analysis ||
    analysis.currentGameSimCount <= 0
  ) {
    return 'replace';
  }

  hideGameImportStatus();

  const source =
    analysis.source || {};

  const sourceLines =
    gameImportSourceMessageLines(
      analysis
    );

  const statsLines = [
    `${uiText('找到相同遊戲人物')}：${analysis.matchedSimCount}`,
    `${uiText('這次新增人物')}：${analysis.newSimCount}`,
    `${uiText('這次未出現人物')}：${analysis.missingSimCount}`
  ];

  const updateHint =
    '同步最新遊戲資料，保留手動排列、人生照片、自訂關係、家庭封面與你在網站上的修改。';

  const replaceHint =
    '使用這份 ZIP 重新建立遊戲族譜；目前族譜內容會被取代。';

  if (
    source.verification ===
      'different_slot' &&
    analysis.matchedSimCount > 0
  ) {
    return await openUiDialog({
      title:'匯入遊戲族譜',
      message:[
        ...sourceLines,
        '',
        ...statsLines,
        '',
        uiText('如果這是「另存新檔」後繼續遊玩的存檔，可以將它視為同一族譜並繼續更新。')
      ].join('\n'),
      mode:'choice',
      confirmText:'這是同一族譜，繼續更新',
      confirmValue:'continue_update',
      confirmHint:'將這個不同存檔記錄為目前族譜的延續來源，並同步最新遊戲資料。',
      secondaryText:'覆蓋現有族譜',
      secondaryValue:'replace',
      secondaryKind:'danger',
      secondaryHint:replaceHint,
      cancelText:'取消',
      cancelValue:'cancel'
    });
  }

  const sourceAllowsUpdate =
    source.verification ===
      'same_slot' ||
    source.verification ===
      'known_save';

  const fallbackAllowsUpdate =
    (
      source.verification ===
        'unverified' ||
      source.verification ===
        'conflict'
    ) &&
    analysis.matchedSimCount > 0;

  if (
    sourceAllowsUpdate ||
    fallbackAllowsUpdate
  ) {
    return await openUiDialog({
      title:'匯入遊戲族譜',
      message:[
        uiText('網站目前已經有遊戲族譜。'),
        '',
        ...sourceLines,
        '',
        ...statsLines
      ].join('\n'),
      mode:'choice',
      confirmText:'更新目前族譜',
      confirmValue:'update',
      confirmHint:updateHint,
      secondaryText:'覆蓋現有族譜',
      secondaryValue:'replace',
      secondaryKind:'danger',
      secondaryHint:replaceHint,
      cancelText:'取消',
      cancelValue:'cancel'
    });
  }

  const replace = await uiConfirm(
    [
      ...sourceLines,
      '',
      uiText('目前族譜已有遊戲資料，但這份 ZIP 沒有找到可安全更新的相同來源。'),
      uiText('是否仍要使用這份 ZIP 覆蓋現有族譜？')
    ].join('\n'),
    {
      title:'匯入遊戲族譜',
      kind:'danger',
      confirmText:'覆蓋現有族譜',
      cancelText:'取消'
    }
  );

  return replace
    ? 'replace'
    : 'cancel';
}

function gameImportUpdateSummary(
  result,
  avatarStats
) {
  const stats =
    result?.stats || {};

  return [
    uiText('遊戲族譜已更新。'),
    '',
    `${uiText('相同人物')}：${stats.people?.matched || 0}`,
    `${uiText('新增人物')}：${stats.people?.added || 0}`,
    `${uiText('本次未出現人物')}：${stats.people?.notSeen || 0}`,
    `${uiText('同步寵物')}：${stats.pets?.matched || 0}`,
    `${uiText('新增寵物')}：${stats.pets?.added || 0}`,
    `${uiText('更新家庭')}：${stats.families?.matched || 0}`,
    `${uiText('新增家庭')}：${stats.families?.added || 0}`,
    `${uiText('同步遊戲關係')}：${stats.relationships?.matched || 0}`,
    `${uiText('新增遊戲關係')}：${stats.relationships?.added || 0}`,
    `${uiText('移除已不存在的遊戲關係')}：${stats.relationships?.removed || 0}`,
    `${uiText('新匯入頭像')}：${avatarStats?.saved || 0}`,
    '',
    uiText('已保留：手動排列、人生照片、自訂關係、自訂標籤、家庭封面與網站手動資料。')
  ].join('\n');
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

    const converted =
      window.L1nGGameImport
        .convertBundle(bundle);

    const analysis =
      currentGameImportUpdateAnalysis(
        converted
      );

    const importMode =
      await chooseGameImportMode(
        analysis
      );

    if (importMode === 'cancel') {
      hideGameImportStatus();
      return;
    }

    showGameImportStatus(
      (importMode === 'update' || importMode === 'continue_update')
        ? '正在更新遊戲族譜…'
        : '正在匯入人物頭像…'
    );
    await waitForImportPaint();

    const avatarStats =
      await persistGameImportAvatars(
        bundle,
        converted
      );

    const incomingPrepared =
      prepareDatabase(
        converted
      ).prepared;

    let updateResult = null;
    let nextDatabase =
      incomingPrepared;

    if ((importMode === 'update' || importMode === 'continue_update')) {
      showGameImportStatus(
        '正在合併最新遊戲資料…'
      );
      await waitForImportPaint();

      updateResult =
        window.L1nGGameImport
          .mergeConvertedDatabase(
            currentGenealogyData(),
            incomingPrepared,
            {
              sourceVerification:
                importMode ===
                'continue_update'
                  ? 'confirmed_continuation'
                  : analysis.sourceVerification
            }
          );

      nextDatabase =
        prepareDatabase(
          updateResult.database
        ).prepared;
    }

    showGameImportStatus(
      (importMode === 'update' || importMode === 'continue_update')
        ? '正在更新族譜畫面…'
        : '正在建立族譜畫面…'
    );
    await waitForImportPaint();

    replaceCanonicalGenealogyDatabase(
      nextDatabase
    );

    // 整庫替換後清掉舊操作中的暫態狀態，但「更新」本身已保留資料庫內的手動排列。
    dragHistory.clear();
    clearNodeSelection();
    finishMarquee();

    labelDrag = null;
    genealogyViewport.cancelPan();

    arrangeTool = 'pan';

    save({ immediate:true });
    refreshFamilyUI();
    render();
    scheduleGC();

    if (importMode === 'replace') {
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          genealogyViewport.fit();
          resolve();
        });
      });
    }

    const normalizedStats =
      converted.meta &&
      converted.meta.gameImportStats
        ? converted.meta.gameImportStats
        : {};

    const simCount =
      normalizedStats.peopleCount ||
      Object.keys(
        currentGenealogyData().sims ||
        {}
      ).length;

    const petCount =
      normalizedStats.petCount ||
      0;

    const familyCount =
      Array.isArray(
        currentGenealogyData().families
      )
        ? currentGenealogyData()
            .families.length
        : 0;

    const activeFamily =
      currentFamily();

    const activeFamilyName =
      activeFamily
        ? displayDataText(
            activeFamily.name,
            activeFamily
          )
        : '—';

    const importedGameDate =
      formatGameDate(
        converted?.meta
          ?.realDateCurrentDate
      );

    hideGameImportStatus();

    if ((importMode === 'update' || importMode === 'continue_update')) {
      await uiAlert(
        gameImportUpdateSummary(
          updateResult,
          avatarStats
        ),
        {
          title:'遊戲族譜更新完成',
          confirmText:'查看族譜'
        }
      );
    } else {
      await uiAlert(
        [
          '遊戲族譜已成功匯入。',
          '',
          `人物：${simCount}`,
          `寵物：${petCount}`,
          `家族：${familyCount}`,
          `頭像：${avatarStats.saved}`,
          importedGameDate
            ? `${uiText('遊戲日期')}：${importedGameDate}`
            : null,
          `目前顯示：${activeFamilyName}`
        ].filter(Boolean).join('\n'),
        {
          title:'遊戲族譜匯入完成',
          confirmText:'查看族譜'
        }
      );
    }

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
    border: '2px dashed var(--action-primary, #5a7fa3)',
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

$('addBtn').onclick = () => personEditor.open(null);
$('btnCancel').onclick = personEditor.close;
$('btnSave').onclick = personEditor.commit;
$('btnDelete').onclick = () => simEditorState.simId && deleteChar(simEditorState.simId);
mask.onclick = e => { if (e.target === mask) personEditor.close(); };

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const modifier = e.ctrlKey || e.metaKey;

  if (e.code === 'Space' && !isTextInteractionTarget(e.target) && genealogyScene.isFreeLayoutActive(currentFamily()) && arrangeTool === 'select') {
    spacePanHeld = true;
    updateArrangeToolUI();
    e.preventDefault();
  }

  if (modifier && key === 'a' && !isTextInteractionTarget(e.target) && genealogyScene.isFreeLayoutActive(currentFamily()) && arrangeTool === 'select') {
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
    else if (mask.classList.contains('show')) personEditor.commit();
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
    currentGenealogyData().sims[
      simEditorState.simId
    ];

  if (!c) return;

  const typeSelect =
    $('relationshipType');

  const type =
    normalizeRelationshipTypeText(
      typeSelect?.value
    );

  if (!type) {
    uiAlert(
      '請選擇或輸入關係。',
      {
        title:'資料未完成'
      }
    );

    return;
  }

  const targetSelect=
    $('relationshipTarget');

  const targetIds=
    [...(
      targetSelect
        ?.selectedOptions||
      []
    )]
      .map(option=>
        String(
          option.value||
          ''
        )
      )
      .filter(Boolean);

  if (!targetIds.length) {
    uiAlert(
      '請選擇關係對象。',
      {
        title:'資料未完成'
      }
    );

    return;
  }

  let mutation=null;

  targetIds.forEach(targetId=>{
    mutation=
      genealogyStore.mergeResults(
        mutation,
        genealogyStore.addRelationship({
          from:c.id,
          to:targetId,
          type,
          label:type
        })
      );
  });

  populateRelationshipTypePicker();

  if (typeSelect) {
    typeSelect.value = '';
  }

  syncRelationshipTypePickerValue();

  if(targetSelect){
    [...targetSelect.options]
      .forEach(option=>{
        option.selected=false;
      });
  }

  genealogyUI.refreshSelect(
    'relationshipTarget'
  );

  personEditor.renderRelationshipList(c);
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
$('zoomInBtn')?.addEventListener('click',()=>{const p=zoomCenter();genealogyViewport.zoomAt(p.x,p.y,1.16);});
$('zoomOutBtn')?.addEventListener('click',()=>{const p=zoomCenter();genealogyViewport.zoomAt(p.x,p.y,1/1.16);});
$('fitScreenBtn')?.addEventListener('click', () => genealogyViewport.fit());

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

function restoreWorkspacePreferences() {
  try {
    const value =
      localStorage.getItem(
        CUSTOM_COLORS_KEY
      );

    if (value) {
      const parsed =
        JSON.parse(value);

      if (parsed.c1) {
        customColors.c1 =
          parsed.c1;
      }

      if (parsed.c2) {
        customColors.c2 =
          parsed.c2;
      }

      if (parsed.c3) {
        customColors.c3 =
          parsed.c3;
      }

      hasSavedCustomTheme =
        !!(
          parsed.c1 &&
          parsed.c2 &&
          parsed.c3
        );
    }
  } catch (_) {}

  let savedTheme = 'ling';

  try {
    const value =
      localStorage.getItem(
        THEME_KEY
      );

    if (value === 'custom') {
      savedTheme = 'custom';
    } else if (
      value &&
      VALID_THEMES.includes(value)
    ) {
      savedTheme = value;
    }
  } catch (_) {}

  if (savedTheme === 'custom') {
    chooseCustomTheme(
      customColors.c1,
      customColors.c2,
      customColors.c3
    );
  } else {
    chooseThemePreset(
      savedTheme
    );
  }

  let savedMode = 'view';

  try {
    const value =
      localStorage.getItem(
        MODE_KEY
      );

    if (
      value &&
      VALID_MODES.includes(value)
    ) {
      savedMode = value;
    }
  } catch (_) {}

  setGenealogyViewMode(savedMode);

  let savedLabelLock = false;

  try {
    savedLabelLock =
      localStorage.getItem(
        LABEL_LOCK_KEY
      ) === '1';
  } catch (_) {}

  setRelationshipLabelLock(
    savedLabelLock
  );

  try {
    showRelLabels =
      localStorage.getItem(
        LABELS_KEY
      ) !== '0';
  } catch (_) {
    showRelLabels = true;
  }

  const labelButton =
    $('labelToggle');

  if (showRelLabels) {
    labelButton.classList.add(
      'active'
    );

    setIconText(
      labelButton,
      'tags',
      '隱藏關係'
    );
  } else {
    labelButton.classList.remove(
      'active'
    );

    setIconText(
      labelButton,
      'tags',
      '顯示關係'
    );
  }

  syncRelationshipToolbarVisibility();
}

function connectAssetStoreInBackground() {
  void assetStore.openDb()
    .then(() => {
      assetStoreReady = true;
    })
    .catch(error => {
      assetStoreReady = false;

      console.warn(
        '圖片資產資料庫目前無法使用；族譜主功能將繼續運作。',
        error
      );
    });
}

function prepareInitialWorkspaceDatabase() {
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

  let initialDatabase =
    preparedResult.prepared;

  if (
    !initialDatabase.families ||
    !initialDatabase.families.length
  ) {
    preparedResult =
      prepareDatabase(
        buildSample()
      );

    initialDatabase =
      preparedResult.prepared;
  }

  return {
    preparedResult,
    initialDatabase
  };
}

function initializeGenealogyWorkspace() {
  restoreWorkspacePreferences();
  connectAssetStoreInBackground();

  const {
    preparedResult,
    initialDatabase
  } =
    prepareInitialWorkspaceDatabase();

  applyRelationshipLineSettings();
  restoreCanvasBackground();

  const clearedImageRefs =
    clearUnsupportedImageRefs(
      initialDatabase,
      bgSettings
    );

  replaceCanonicalGenealogyDatabase(
    initialDatabase
  );

  if (clearedImageRefs > 0) {
    console.warn(
      `[圖片資產] 已清除 ${clearedImageRefs} 個舊圖片引用；請重新匯入或上傳圖片。`
    );

    save({
      immediate:true
    });

    persistCanvasBackground();
  } else if (
    preparedResult.changed
  ) {
    save();
  }

  setupAppMenus();
  setupHelpTooltipPortal();
  restoreFamilyPanelCollapsed();
  genealogyViewport.observeResize();
  genealogyUI.mountFormControls();

  void preloadCurrentViewAssets();

  refreshFamilyUI();
  render();

  requestAnimationFrame(() => {
    genealogyViewport.fit();

    requestAnimationFrame(
      hideAppSkeleton
    );
  });
}


/* ========【多語系介面回呼】 設定 - 語言切換後刷新 App 專屬畫面狀態 ======== */
function handleGenealogyLanguageChanged() {
  // 關係標籤寬度與 selector 顯示文字都依目前語言重新計算。
  invalidateFamilySelectorCache();

  if (
    currentGenealogyData() &&
    currentGenealogyData().families &&
    currentGenealogyData().families.length
  ) {
    refreshFamilyUI();
    render();
  }

  if (mask && mask.classList.contains('show')) {
    const birthdayDay =
      $('fBirthdayDay')
        ? $('fBirthdayDay').value
        : '';

    personEditor.populateBirthdayDays(birthdayDay);
    personEditor.renderFamilyPreviews();
  }

  genealogyUI.refreshAllControls();
  syncAllNavSelectControls();
  syncRelationshipTypePickerTabs();
  syncRelationshipTypePickerValue();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && exportDialog && exportDialog.classList.contains('show')) closeExportPanel();
});

async function bootstrapGenealogyApp() {
  if (
    typeof LING_I18N === 'undefined' ||
    typeof LING_I18N.init !== 'function'
  ) {
    throw new Error('多語系模組未載入。');
  }

  LING_I18N.onLanguageChanged(
    handleGenealogyLanguageChanged
  );

  await LING_I18N.init();

  setupTopbarNavSelects();
  setupRelationshipTypePicker();
  genealogyUI.observeFormControls();

  initializeGenealogyWorkspace();
}

bootstrapGenealogyApp().catch(error => {
  console.error(
    '族譜工具初始化失敗：',
    error
  );

  // Skeleton 只代表「仍在初始化」，不能在 fatal error 後永久遮住頁面。
  hideAppSkeleton();

  void uiAlert(
    '族譜工具載入失敗：' +
    (error?.message || String(error)),
    {
      title:'族譜工具載入失敗',
      kind:'danger'
    }
  );
});
