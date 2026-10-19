/* ========【L1nG Genealogy App】 族譜工具主程式與 UI 協調 ======== */
/*
 * 主要來源語言：繁體中文（zh-Hant）
 * 支援語言：繁體中文 / 簡體中文 / English
 * 圖示：本機 Bootstrap Icons SVG
 */


// ========【滑桿填色】 將目前數值映射至自訂細軌道，不依賴瀏覽器原生進度 ========
function syncGenealogyRangeFill(input) {
  if (!input || input.type !== 'range') return;
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const progress = Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max) && max > min
    ? Math.min(100,Math.max(0,(value - min) / (max - min) * 100))
    : 0;
  input.style.setProperty('--range-fill',progress + '%');
}

// 原生 input 事件即時更新填色；程式主動更改 value 時則在對應設定流程同步更新。
document.querySelectorAll('input[type="range"]').forEach(input => {
  syncGenealogyRangeFill(input);
  input.addEventListener('input',() => syncGenealogyRangeFill(input));
});

const PAD = 80;
const STORE_KEY = 'l1ng_genealogy_v1';
// 大型遊戲族譜超出 localStorage 容量時，保存於現有 IndexedDB 資料庫。
const WORKSPACE_IDB_MARKER = 'L1NG_GENEALOGY_INDEXEDDB_V1';
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

// ========【族譜 Runtime】 Cache / DOM / Save 由獨立執行層負責 ========
const genealogyRuntime =
  window.L1nGGenealogyRuntime?.create?.() ||
  null;

const genealogyInteraction =
  window.L1nGGenealogyInteraction ||
  null;

let genealogyStore = null;
let genealogyScene = null;

// ========【族譜卡片顯示】 檢視 / 編輯模式各自保存顯示內容；檢視卡另有外觀設定 ========
const LIFE_PHOTOS_PUBLIC = document.body?.dataset.lifePhotos !== 'hidden';
const CARD_CONTENT_FIELD_KEYS = ['name','gender','lifeStage','age','birthday','status','race','career','residence','aspiration','traits','pets','gallery'];
const CARD_SETTING_FIELD_KEYS = [...CARD_CONTENT_FIELD_KEYS];
const PET_CARD_FIELD_KEYS = ['name','species','breed','gender','ageStage','status','traits','owners'];
const DEFAULT_PET_CARD_VIEW_SETTINGS = Object.freeze({
  avatar:true, name:true, species:true, breed:false,
  gender:true, ageStage:false, status:false, traits:false, owners:true,
  appearance:'minimal'
});
const DEFAULT_PET_CARD_EDIT_SETTINGS = Object.freeze({
  avatar:true, name:true, species:true, breed:true,
  gender:true, ageStage:true, status:true, traits:true, owners:true
});

const DEFAULT_CARD_VIEW_SETTINGS = Object.freeze({
  avatar: true,
  name: true,
  gender: true,
  lifeStage: false,
  age: false,
  birthday: false,
  status: true,
  race: false,
  career: false,
  residence: false,
  aspiration: false,
  traits: false,
  pets: true,
  gallery: false,
  appearance: 'minimal'
});

const DEFAULT_CARD_EDIT_SETTINGS = Object.freeze({
  avatar: true,
  name: true,
  gender: true,
  lifeStage: true,
  age: true,
  birthday: true,
  status: false,
  race: false,
  career: false,
  residence: true,
  aspiration: false,
  traits: true,
  pets: true,
  gallery: false
});


// 圖片處理政策集中由 Assets 管理。
const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze(['image/jpeg','image/png','image/webp']);
const SUPPORTED_IMAGE_EXTENSIONS = Object.freeze(['jpg','jpeg','png','webp']);
const personEditor = window.L1nGGenealogyPersonEditor;
if (!personEditor) {
  throw new Error('找不到 L1nG 模擬市民編輯器模組。');
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
  { id:'ink',        name:'墨曜紫灰',   grad:'linear-gradient(120deg, #141317 0%, #262229 100%)' },
  { id:'berrynight', name:'夜莓酒紅',   grad:'linear-gradient(120deg, #181417 0%, #2c2328 100%)' },
  { id:'graphite',   name:'中性石墨',   grad:'linear-gradient(120deg, #151719 0%, #272b2e 100%)' }
];

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
  '曖昧':Object.freeze({ icon:'hearts', category:'romance', lineStyle:'short-dash', layoutPriority:260, symmetric:true }),
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
  '繼父','繼母','繼親',
  '兒子','女兒','子女',
  '養子','養女','養子女',
  '私生子','私生女','私生子女','繼子','繼女','繼子女',
  '丈夫','妻子','配偶',
  '前夫','前妻','前任配偶',
  '哥哥','姐姐','弟弟','妹妹','兄弟','姊妹','兄弟姊妹',
  '爺爺','奶奶','外公','外婆','祖父','祖母','祖父母',
  '孫子','孫女','外孫','外孫女','孫輩',
  '曾祖父','曾祖母','曾祖父母',
  '高祖父','高祖母','高祖父母',
  '曾孫','曾孫女','曾孫輩','玄孫','玄孫女','玄孫輩',
  '兒媳','女婿','孫媳','孫女婿','外孫媳','外孫女婿',
  '曾孫媳','曾孫女婿','玄孫媳','玄孫女婿',
  '嫂嫂','弟媳','姐夫','妹夫','伯母','嬸嬸','姑丈','舅媽','姨丈',
  '姪媳','姪女婿','外甥媳','外甥女婿',
  '伯父','叔叔','叔伯','姑姑','舅舅','阿姨','父母的兄弟姊妹',
  '姪子','姪女','外甥','外甥女','兄弟姊妹的子女',
  '堂哥','堂姐','堂弟','堂妹','堂兄弟姊妹',
  '表哥','表姐','表弟','表妹','表兄弟姊妹',
  '岳父','岳母','公公','婆婆','配偶父親','配偶母親','配偶父母'
]);

const RACE_PRESETS = {
  '':           { icon:'', label:'（不顯示）' },
  human:        { icon:'person', label:'人類' },
  // 種族使用對應物種特徵的語意圖示，方便辨識。
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
  // ========【寵物種類】 顯示文字、canonical value 與專用 SVG 圖示統一 ========
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
let personProfilePetTarget = null;
let currentThemeId = 'ling';
let customColors = { c1:'#ffffff', c2:'#dfeffc', c3:'#55acee' };
let hasSavedCustomTheme = false;

let personLibraryViewMode = 'detailed';
let personLibraryCategory = 'sims';
let personLibraryAvatarObserver = null;
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

let familyTreeViewMode = 'household';
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
  }),
  spouse: Object.freeze({
    style:'solid',
    width:2.4,
    color:null,
    curved:false,
    routing:'auto'
  }),
  exspouse: Object.freeze({
    style:'short-dash',
    width:1.7,
    color:null,
    routing:'auto'
  }),
  adopt: Object.freeze({
    style:'long-dash',
    width:1.7,
    color:null,
    curved:false,
  }),
  other: Object.freeze({
    style:'dot',
    width:1.5,
    color:null,
    curved:false,
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

  // 正規化時排除未納入現行關係線設定的手動弧度屬性。
  delete normalized.curveAmount;
  delete normalized.curveAmountManual;

  if (key === 'exspouse') {
    normalized.routing = 'auto';
    delete normalized.curved;
  }

  if (key === 'other') {
    normalized.showArrow =
      saved.showArrow === undefined
        ? !!fallback.showArrow
        : !!saved.showArrow;
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
              setting,
              type === '室友' ? relationshipOtherDefaultSetting(type) : null
            );
        });
    }
  }
} catch (_) {}

// ========【拖曳歷史】 卡片與關係標籤共用 Ctrl+Z / Ctrl+Y ========
const DRAG_HISTORY_LIMIT = 60;

function sameLayoutHistoryState(left, right) {
  if (!left || !right) return left === right;
  if (!!left.freeLayout !== !!right.freeLayout) return false;

  const leftPositions = left.manualPositions || {};
  const rightPositions = right.manualPositions || {};
  const leftIds = Object.keys(leftPositions).sort();
  const rightIds = Object.keys(rightPositions).sort();

  if (leftIds.length !== rightIds.length) return false;

  for (let index = 0; index < leftIds.length; index += 1) {
    if (leftIds[index] !== rightIds[index]) return false;

    const id = leftIds[index];
    const leftPos = leftPositions[id] || {};
    const rightPos = rightPositions[id] || {};

    if (
      Number(leftPos.x) !== Number(rightPos.x) ||
      Number(leftPos.y) !== Number(rightPos.y)
    ) {
      return false;
    }
  }

  return true;
}

function sameLabelHistoryState(left, right) {
  const leftOffset = left?.offset || null;
  const rightOffset = right?.offset || null;

  if (!leftOffset || !rightOffset) {
    return leftOffset === rightOffset;
  }

  return (
    Number(leftOffset.dx) === Number(rightOffset.dx) &&
    Number(leftOffset.dy) === Number(rightOffset.dy)
  );
}

function dragHistoryEntryHasChange(entry) {
  if (!entry) return false;

  if (entry.type === 'database') return JSON.stringify(entry.before) !== JSON.stringify(entry.after);

  if (entry.type === 'card-layout') {
    return !sameLayoutHistoryState(entry.before, entry.after);
  }

  if (entry.type === 'relationship-label') {
    return !sameLabelHistoryState(entry.before, entry.after);
  }

  return true;
}

const dragHistory = {
  undoStack: [],
  redoStack: [],

  push(entry) {
    if (!dragHistoryEntryHasChange(entry)) return false;

    const previous = this.undoStack[this.undoStack.length - 1];
    const now = Date.now();
    if (entry.keyboardKey && previous?.keyboardKey === entry.keyboardKey &&
        previous.familyId === entry.familyId && now - previous.recordedAt < 380 &&
        sameLayoutHistoryState(previous.after, entry.before)) {
      previous.after = entry.after;
      previous.recordedAt = now;
      this.redoStack.length = 0;
      return true;
    }
    entry.recordedAt = now;
    this.undoStack.push(entry);
    if (this.undoStack.length > DRAG_HISTORY_LIMIT) this.undoStack.shift();
    let dataEntries = 0;
    for (let index = this.undoStack.length - 1; index >= 0; index--) {
      if (this.undoStack[index].type !== 'database') continue;
      if (++dataEntries > 8) this.undoStack.splice(index, 1);
    }
    this.redoStack.length = 0;
    return true;
  },

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  },

  undo() {
    let entry;

    while ((entry = this.undoStack.pop())) {
      if (!dragHistoryEntryHasChange(entry)) continue;

      applyDragHistoryEntry(entry, 'before');
      this.redoStack.push(entry);
      return true;
    }

    return false;
  },

  redo() {
    let entry;

    while ((entry = this.redoStack.pop())) {
      if (!dragHistoryEntryHasChange(entry)) continue;

      applyDragHistoryEntry(entry, 'after');
      this.undoStack.push(entry);
      return true;
    }

    return false;
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

function captureLayoutHistoryState(fam) {
return {
    freeLayout: !!fam.freeLayout,
    manualPositions: cloneManualPositionMap(fam.manualPositions)
  };
}

function captureLabelHistoryState(key) {
  const saved = currentGenealogyData() && currentGenealogyData().labelPositions ? currentGenealogyData().labelPositions[key] : null;
  return saved ? { dx: Number(saved.dx) || 0, dy: Number(saved.dy) || 0 } : null;
}

function applyDragHistoryEntry(entry, stateKey) {
  const state = entry[stateKey];
  if (!state || !currentGenealogyData() || !genealogyStore) return;

  if (entry.type === 'database') {
    replaceCanonicalGenealogyDatabase(state);
    clearNodeSelection();
    closePersonCardMenu();
    save({ immediate:true });
    refreshFamilyUI();
    render();
    if (personLibraryDialog?.classList.contains('show')) renderPersonLibrary();
    return;
  }

  if (entry.type === 'card-layout') {
    const fam = currentGenealogyData().families.find(item => item.id === entry.familyId);
    if (!fam) return;

    const mutation =
      genealogyStore.setFamilyLayoutState(
        entry.familyId,
        
        {
          freeLayout:!!state.freeLayout,
          manualPositions:cloneManualPositionMap(state.manualPositions)
        }
      );

    applyGenealogyMutation(mutation, {
      immediateSave:true,
      render:
        currentGenealogyData().currentFamilyId === entry.familyId
    });

    if (
      currentGenealogyData().currentFamilyId === entry.familyId
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

// 復原所需圖片以 Blob 保留，不會因資料暫時不再引用就被自動清理。
function retainedHistoryAssetIds() {
  const ids = new Set();
  const collect = snapshot => {
    if (!snapshot) return;
    assetStore.collectReferencedAssetIds(snapshot,null).forEach(id => ids.add(id));
  };
  [...dragHistory.undoStack,...dragHistory.redoStack].forEach(entry => {
    if (entry.type !== 'database') return;
    collect(entry.before);
    collect(entry.after);
  });
  return ids;
}
// 資料操作必須先取得可還原快照；大型族譜不得因大小門檻靜默跳過復原。
function captureCanonicalHistory() {
  try {
    return genealogyStore.snapshotDatabase();
  } catch (error) {
    console.error('[Genealogy] 無法建立操作歷史，已取消資料變更。',error);
    void uiAlert(uiText('無法建立復原記錄，操作已取消。'),{
      title:uiText('操作未執行'),kind:'danger'
    });
    return null;
  }
}
function recordCanonicalHistory(before) {
  if (!before) return false;
  try {
    return dragHistory.push({
      type:'database',before,after:genealogyStore.snapshotDatabase()
    });
  } catch (error) {
    // 不允許資料已刪除卻沒有可用的操作歷史。
    console.error('[Genealogy] 無法完成復原記錄，回復操作前資料。',error);
    replaceCanonicalGenealogyDatabase(before);
    save({immediate:true});
    refreshFamilyUI();
    render();
    void uiAlert(uiText('無法保存復原記錄，已還原本次變更。'),{
      title:uiText('操作已取消'),kind:'danger'
    });
    return false;
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
let avatarCropGeometry = null;
let avatarCropRenderFrame = 0;

// ========【圖片資產權威層】 genealogy.js 只保存 assetId；Blob / SHA-256 / Lazy URL 由獨立模組管理 ========
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
        // 模擬市民／寵物總覽的頭像由可見範圍觀察器管理，避免一次載入數百張導致暫存網址遭回收。
        if (element.classList.contains('person-library-deferred-image')) return;
        if (element.src !== url) {
          if (element.classList.contains('pet-avatar-image')) {
            element.closest('.genealogy-pet-card-avatar, .person-profile-pet-main-avatar, .person-profile-pet-avatar, .person-card-mini-pet-avatar, .family-cover-collage-pet')
              ?.classList.remove('has-image');
          }
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

      if (element.id === 'simPhotoEditorPreview') {
        $('simPhotoRemoveImageButton').disabled = false;
        $('simPhotoEditorSaveButton').disabled = false;
      }
    });
}

// ========【資產局部刷新】 圖片載入完成後只刷新受影響的顯示內容 ========
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
  function framedAvatarImageHTML(ref,frame,extraClass='',deferSrc=false){
    if(!isAssetId(ref))return'';

    const url=deferSrc?'':resolveImageUrl(ref);

    return `<img class="avatar-framed-image${extraClass ? ' ' + esc(extraClass) : ''}${url?'':' asset-pending'}" data-asset-id="${esc(ref)}"${url?` src="${esc(url)}"`:''} alt="" draggable="false" decoding="async" style="${avatarFrameInlineStyle(frame)}">`;
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

function getPetCardSettings(mode = viewMode) {
  return genealogyStore?.getPetCardSettings?.(mode) ||
    { ...(mode === 'edit' ? DEFAULT_PET_CARD_EDIT_SETTINGS : DEFAULT_PET_CARD_VIEW_SETTINGS) };
}

function cardViewAppearanceClass() {
  return `card-appearance-${getCardViewSettings().appearance}`;
}

function cardSettingsHasBody(settings) {
  return (
    !!settings.name ||
    CARD_CONTENT_FIELD_KEYS.some(
      key =>
        key !== 'name' &&
        key !== 'gender' &&
        !!settings[key]
    )
  );
}

// ========【模擬市民呈現模型】 畫布卡片、個人檔案與模擬市民清單共用同一份顯示資料 ========
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

  const notes =
    personDisplayText(
      sim.notes,
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

  const simStatusPresentationClass =
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
    notes,
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
      className:simStatusPresentationClass
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

// 畫布專屬的市民卡片內容及欄位排版，統一由 genealogy_scene.js 負責。

// ========【預設資料】 基準語言：繁體中文（zh-Hant） ========
// 簡體中文與英文僅作顯示翻譯；預設資料的 canonical source 永遠保留繁體中文。
// ========【預設族譜載入】 載入單一資料包並套用現行卡片顯示預設設定 ========
function buildDefaultGenealogyData() {
  const source = window.L1nGGenealogySamplePack;
  if (!source || source.version !== 1 || !source.meta || !source.sims || !Array.isArray(source.families)) {
    throw new Error('預設族譜資料尚未載入。');
  }
  const database = JSON.parse(JSON.stringify(source));
  database.meta.cardView = { ...DEFAULT_CARD_VIEW_SETTINGS };
  database.meta.cardEdit = { ...DEFAULT_CARD_EDIT_SETTINGS };
  database.meta.petCardView = { ...DEFAULT_PET_CARD_VIEW_SETTINGS };
  database.meta.petCardEdit = { ...DEFAULT_PET_CARD_EDIT_SETTINGS };
  return database;
}

let genealogyViewport = null;

function currentGenealogyData() {
  return genealogyStore?.getData?.() || null;
}

// 自由排列工具：選取 / 框選與畫布拖曳分離。
let arrangeTool = 'pan';
const selectedNodeIds = new Set();
const selectedPetIds = new Set();
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
const familyNameInput = $('familyNameInput'), familySelect = $('familySelect');
const statusFilterInputs = [...document.querySelectorAll('input[name="statusFilter"]')];
const genderFilterInputs = [...document.querySelectorAll('input[name="genderFilter"]')];
const raceFilterInputs = [...document.querySelectorAll('input[name="raceFilter"]')];
const lifeStageFilterInputs = [...document.querySelectorAll('input[name="lifeStageFilter"]')];
const petVisibilityFilter = $('petVisibilityFilter');
const petCardsLayer = $('genealogyPetLayer');
const personLibrarySearch = $('personLibrarySearch');
const modeToggle = $('modeToggle');
const selectToolBtn = $('selectToolBtn');
const panToolBtn = $('panToolBtn');
const arrangeToolDivider = $('arrangeToolDivider');
const arrangeToolDividerEnd = $('arrangeToolDividerEnd');
const selectionMarquee = $('selectionMarquee');
const personCardMenu = $('personCardContextMenu');
const relationshipLabelsLockToggle = $('relationshipLabelsLockToggle');
const relationshipPerspectiveBtn = $('relationshipPerspectiveBtn');
const familySidebar = $('familySidebar');
const sidebarResizer = $('sidebarResizer');
const familySidebarBackdrop = $('familySidebarBackdrop');
const familySidebarToggleButton = $('familySidebarToggleButton');
const smartGuideVertical = $('smartGuideVertical');
const smartGuideHorizontal = $('smartGuideHorizontal');
const smartSpacingHorizontal = $('smartSpacingHorizontal');
const smartSpacingVertical = $('smartSpacingVertical');
const appearanceThemeGrid = $('appearanceThemeGrid');
const customThemePrimaryColorInput = $('customThemePrimaryColorInput');
const customThemeSecondaryColorInput = $('customThemeSecondaryColorInput');
const customColor3 = $('customColor3');
const appearanceCustomThemeEditor = $('appearanceCustomThemeEditor');
const appearanceCustomThemePreview = $('appearanceCustomThemePreview');
const lifePhotoGrid = $('lifePhotoGrid');

// ========【家族名稱輸入】 固定導覽欄位、虛線只跟著文字寬度 ========
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
  // 長名稱以扣除操作圖示與間距後的實際可用寬度計算。
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

// ========【UI 圖示】 透過 genealogy_icon_masks.css 提供的內嵌遮罩呈現圖示 ========
const iconSvg = (name, extra = '') => {
  const safe = String(name || '').replace(/[^a-z0-9-]/gi, '');
  if (!safe) return '';

  const extraClass = extra ? ` ${extra}` : '';

  return `<span
    class="l1ng-icon icon-${safe}${extraClass}"
    aria-hidden="true"
  ></span>`;
};

function setIconText(el, iconName, text) {
  if (!el) return;
  el.innerHTML = `${iconSvg(iconName)}<span>${esc(text)}</span>`;
}

// ========【頂部自訂下拉選單】 取代瀏覽器原生 select 展開介面 ========
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

// ========【家族選擇器分流】 EA 家庭 / EA 原生族譜範圍 / 完整大家族分開 ========
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

// ========【Family Selector Cache】 家族範圍只在 genealogy 結構改變時重建 ========
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

  // EA 族譜可能將同一 Household 拆成多個分支，優先選到包含
  // 來源家庭成員的分支，而不是只按清單中的第一個來源家族命中。
  const sources = entries.filter(entry =>
    (entry.sourceFamilyIds || []).includes(fam.id)
  );
  if (sources.length) {
    const seedSet = new Set(familySourceSeedIds(fam));
    return sources
      .map(entry => ({
        entry,
        score:(entry.memberIds || []).reduce(
          (total, id) => total + (seedSet.has(id) ? 1 : 0), 0
        )
      }))
      .sort((left, right) =>
        right.score - left.score ||
        left.entry.sortIndex - right.entry.sortIndex
      )[0].entry;
  }

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
    // 切換分類後選項數量可能不同；重新依實際列高安排欄數，
    // 再讓目前選取的家庭回到可見範圍。
    if (control && control.host.classList.contains('open')) {
      positionFamilyNavSelectMenu(control);
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
  portal.style.left = Math.max(2, Math.round(menuRect.left - tabWidth)) + 'px';
  const active = portal.querySelector('.family-nav-index-tab.active');
  if (active) {
    const rect = active.getBoundingClientRect();
    const start = Math.max(0,Math.min(menuRect.height,rect.top-menuRect.top));
    const end = Math.max(start,Math.min(menuRect.height,rect.bottom-menuRect.top));
    control.menu.style.setProperty('--family-seam-start',start+'px');
    control.menu.style.setProperty('--family-seam-end',end+'px');
  }
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
  menu.style.removeProperty('overflow-y');
  menu.style.removeProperty('--family-menu-rows');

  hideFamilyNavTabsPortal(control);
}

// 家庭超量時選單會向右新增欄位：展開或切換分類後，讓目前家庭落在可見範圍中央。
function scrollSelectedFamilyNavOption(control) {
  if (!control || control.select.id !== 'familySelect') return;
  const menu = control.menu;
  if (!control.host.classList.contains('open') || menu.parentElement !== document.body) return;

  const selected = menu.querySelector('.nav-select-option.selected');
  const maxScroll = Math.max(0, menu.scrollWidth - menu.clientWidth);
  if (!selected || maxScroll <= 1) return;

  // 使用實際排版位置，不依賴固定列高或家族排序；只改選單本身的水平捲軸。
  const menuRect = menu.getBoundingClientRect();
  const itemRect = selected.getBoundingClientRect();
  const target = menu.scrollLeft +
    (itemRect.left + itemRect.width / 2) -
    (menuRect.left + menu.clientWidth / 2);
  menu.scrollLeft = Math.max(0, Math.min(maxScroll, target));
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
  // 依選項實際列高與上下內距計算清單高度，避免底部選項遭裁切。
  const menuStyle = getComputedStyle(menu);
  const verticalInset = [
    menuStyle.paddingTop,
    menuStyle.paddingBottom,
    menuStyle.borderTopWidth,
    menuStyle.borderBottomWidth
  ].reduce((total, value) => total + (parseFloat(value) || 0), 0);
  const itemHeight = Math.max(
    30,
    ...items.slice(0, 3).map(item => item.getBoundingClientRect().height)
  );
  const belowHeight = Math.max(0, window.innerHeight - rect.bottom - gap - margin);
  const aboveHeight = Math.max(0, rect.top - gap - margin);
  const openAbove = belowHeight < itemHeight + verticalInset && aboveHeight > belowHeight;
  const availableHeight = openAbove ? aboveHeight : belowHeight;
  const rows = Math.max(
    1,
    Math.min(items.length, Math.floor((availableHeight - verticalInset) / itemHeight))
  );
  const contentHeight = rows * itemHeight + verticalInset;
  const menuTop = openAbove
    ? rect.top - gap - contentHeight
    : rect.bottom + gap;

  menu.style.setProperty('--family-menu-rows', String(rows));
  menu.style.top = `${Math.round(Math.max(margin, menuTop))}px`;
  menu.style.left = `${Math.max(margin, Math.round(rect.left))}px`;
  menu.style.maxHeight = `${Math.floor(availableHeight)}px`;
  menu.style.maxWidth = `${Math.max(180, window.innerWidth - Math.max(margin, rect.left) - margin)}px`;
  // 極矮視窗連一列都容不下時，仍保留捲動入口，不留下看不見的可點擊項目。
  menu.style.overflowY = availableHeight < itemHeight + verticalInset ? 'auto' : 'hidden';
  positionFamilyNavTabsPortal(control);
  scrollSelectedFamilyNavOption(control);
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


// ========【共用 HTML 彈窗】 UI Controller 是唯一彈窗與按鈕 Loading Authority ========
const genealogyDialogs =
  window.L1nGGenealogyUI?.createDialogController?.({
    uiText,
    esc
  });

if (!genealogyDialogs) {
  throw new Error('Genealogy dialog controller failed to initialize.');
}

// 只保留 App 業務操作所需的穩定呼叫介面，不在 App 複製彈窗生命週期。
function closeUiDialog(result = null) {
  return genealogyDialogs.close(result);
}
function openUiDialog(options = {}) {
  return genealogyDialogs.open(options);
}
function uiAlert(message, options = {}) {
  return genealogyDialogs.alert(message, options);
}
function uiConfirm(message, options = {}) {
  return genealogyDialogs.confirm(message, options);
}
function uiPrompt(message, defaultValue = '', options = {}) {
  return genealogyDialogs.prompt(message, defaultValue, options);
}
function uiToast(message, duration = 2600) {
  return genealogyDialogs.toast(message, duration);
}
function withActionButtonLoading(button, label, action) {
  return genealogyDialogs.withActionButtonLoading(button, label, action);
}

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

// ========【頂部模擬市民篩選】 同類多選 OR、跨類別 AND ========
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
    petVisibilityFilter && !petVisibilityFilter.checked ? 1 : 0
  );

  const button = $('topbarFilterBtn');
  const countEl = $('topbarFilterCount');

  if (button) button.classList.toggle('active', excludedCount > 0);

  if (countEl) {
    countEl.hidden = excludedCount === 0;
    countEl.textContent = excludedCount ? `· ${excludedCount}` : '';
  }
}

// ========【預設資料翻譯】 繁中為唯一基準；只翻譯內建範例既有值 ========
const BUILTIN_SAMPLE_REFERENCE = buildDefaultGenealogyData();
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

// ========【日期顯示格式】 生日與遊戲日期屬於 App 呈現層，不由模擬市民編輯器持有 ========
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
  const lang = document.documentElement.lang || 'zh-Hant';

  // 世代序號與組合式姻親標籤採動態翻譯，不列舉所有可能代數。
  const depthMatch = text.match(/^第 (\d+) 代(祖先|後代)$/);
  if (depthMatch) {
    const depth = Number(depthMatch[1]);
    const ancestor = depthMatch[2] === '祖先';
    if (lang === 'en') return ancestor
      ? 'Ancestor (' + depth + ' generations above)'
      : 'Descendant (' + depth + ' generations below)';
    if (lang === 'zh-Hans') return '第 ' + depth + ' 代' + (ancestor ? '祖先' : '后代');
    return text;
  }

  const affinalMatch = text.match(/^(.+)的配偶$/);
  if (affinalMatch && (BUILTIN_RELATION_LABELS.has(affinalMatch[1]) ||
      /^第 \d+ 代(?:祖先|後代)$/.test(affinalMatch[1]))) {
    return lang === 'en'
      ? 'Spouse of ' + displayRelationshipText(affinalMatch[1])
      : lang === 'zh-Hans'
        ? displayRelationshipText(affinalMatch[1]) + '的配偶'
        : text;
  }
  const spouseRelativeMatch = text.match(/^配偶的(.+)$/);
  if (spouseRelativeMatch && BUILTIN_RELATION_LABELS.has(spouseRelativeMatch[1])) {
    return lang === 'en'
      ? "Spouse's " + displayRelationshipText(spouseRelativeMatch[1])
      : lang === 'zh-Hans'
        ? '配偶的' + displayRelationshipText(spouseRelativeMatch[1])
        : text;
  }

  // 系統語意與親屬稱謂會跟著介面語言切換；自訂詞彙保持原文。
  return BUILTIN_RELATION_LABELS.has(text) ? uiText(text) : text;
}


// ========【其他關係詞庫】 內建詞彙與玩家自訂詞彙分離；自訂詞彙跟著族譜資料保存 ========
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

function syncRelationshipTypePickerSeam(){
  const popover=$('relationshipTypePopover');
  const index=$('relationshipTypeIndex');
  const active=index?.querySelector('.relationship-type-index-tab.active');
  if(!popover||popover.hidden||!active)return;

  // 依排版後的頁籤與選單座標計算接縫，分類頁籤共用定位方式。
  const menuRect=popover.getBoundingClientRect();
  const tabRect=active.getBoundingClientRect();
  const start=Math.max(0,Math.min(menuRect.height,tabRect.top-menuRect.top));
  const end=Math.max(start,Math.min(menuRect.height,tabRect.bottom-menuRect.top));
  popover.style.setProperty('--relationship-seam-start',start+'px');
  popover.style.setProperty('--relationship-seam-end',end+'px');
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
  syncRelationshipTypePickerSeam();
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
      : uiText('新增其他關係');

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

  // 視覺設定共用關係種類選單，但僅列出目前存在的關係類型。
  const options=relationshipTypePickerOnSelect
    ? getOtherRelationshipTypes().map(entry=>({
        value:entry.type,
        label:entry.label,
        custom:!SOCIAL_RELATIONSHIP_DEFINITIONS[entry.type]
      }))
    : relationshipTypeOptions();

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
    !relationshipTypePickerOnSelect&&normalizedRaw&&!hasExact
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
  const tabOverlap=0;

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
  syncRelationshipTypePickerSeam();
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

// ========【關係語意】 客觀關係、社會關係與顯示覆寫分離 ========
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


function familyDerivedChildTitle(child, db = currentGenealogyData()) {
  return window.L1nGGenealogyKinship?.childKinshipLabel(child,db?.sims,db?.links) || '';
}
function familyStepParentTitle(sim) {
  return genderedKinship(sim,'繼父','繼母','繼親');
}
function familyStepChildTitle(sim) {
  return genderedKinship(sim,'繼子','繼女','繼子女');
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
    if (kind !== 'adoptive' && perspective && target &&
        !Array.isArray(perspective)) {
      const inferred = familyDerivedChildTitle(target);
      if (inferred) return inferred;
    }
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

  if (role === 'step-parent') return familyStepParentTitle(target);
  if (role === 'step-child') return familyStepChildTitle(target);

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

// ========【家庭關係 Authority】 所有 UI 共用同一份直接家庭關係模型 ========
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
    stepParents:[],
    stepChildren:[],
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

  const kinship = window.L1nGGenealogyKinship;
  const stepParents = (kinship?.stepParentIds(subject,currentGenealogyData().sims) || [])
    .map(targetId => makeEntry('step-parent',targetId,{source:'derived',editable:false}))
    .filter(Boolean);
  const stepChildren = (kinship?.stepChildIds(subject,currentGenealogyData().sims) || [])
    .map(targetId => makeEntry('step-child',targetId,{source:'derived',editable:false}))
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
    stepParents,
    stepChildren,
    all:[
      ...stepParents,
      ...stepChildren,
      ...parents,
      ...spouses,
      ...exSpouses,
      ...children,
      ...siblings
    ]
  };
}

// 親屬稱謂保留在 App，僅將祖先／後代路徑交給 Store。
function findAncestorPath(sourceId, targetId, maxDepth = 10) {
  return genealogyStore.findAncestorPath(sourceId, targetId, maxDepth);
}
function findDescendantPath(sourceId, targetId, maxDepth = 10) {
  return genealogyStore.findDescendantPath(sourceId, targetId, maxDepth);
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
  if (depth === 4) {
    return genderedKinship(targetSim, '玄孫', '玄孫女', '玄孫輩');
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

// 視角姻親只沿「血親 / 旁系 + 一條現任婚姻」推導，不將姻親寫回族譜資料。
function perspectiveBloodRelationDescriptor(perspectiveId, relativeId) {
  const db = currentGenealogyData();
  const source = db?.sims?.[String(perspectiveId)];
  const target = db?.sims?.[String(relativeId)];
  if (!source || !target || String(source.id) === String(target.id)) return null;
  const descendants = findDescendantPath(source.id, target.id, 10);
  if (descendants) return {kind:'descendant', depth:descendants.length,
    label:descendantKinshipLabel(source,target,descendants)};
  const ancestors = findAncestorPath(source.id, target.id, 10);
  if (ancestors) return {kind:'ancestor', depth:ancestors.length,
    label:ancestorKinshipLabel(source,target,ancestors)};
  if (genealogySiblingIds(source.id).includes(String(target.id)))
    return {kind:'sibling',label:siblingKinshipLabel(source,target)};
  const parentSibling = parentSiblingKinship(source.id,target.id);
  if (parentSibling) return {kind:'parent-sibling',label:parentSibling};
  const siblingChild = siblingChildKinship(source.id,target.id);
  if (siblingChild) return {kind:'sibling-child',label:siblingChild};
  const cousin = cousinKinship(source.id,target.id);
  if (cousin) return {kind:'cousin',label:cousin};
  return null;
}

function perspectiveAffinalLabel(perspectiveId,targetId) {
  return window.L1nGGenealogyKinship?.perspectiveAffinalKinship?.({
    perspectiveId,targetId,
    sims:currentGenealogyData()?.sims,
    describeBlood:relativeId=>perspectiveBloodRelationDescriptor(perspectiveId,relativeId),
    siblingIds:simId=>genealogySiblingIds(simId),
    siblingLabel:(spouse,target)=>siblingKinshipLabel(spouse,target)
  }) || null;
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

  return perspectiveAffinalLabel(root.id,target.id) || directSocialPerspectiveLabel(root.id,target.id);
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
      : 'View family tree from ' +
        name +
        "'s perspective";
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
    'scan-eye',
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



// ========【頂欄與側邊欄】 UI 模組唯一持有選單、Tooltip、Resize 事件 ========
const genealogyChrome =
  window.L1nGGenealogyUI?.createChromeController?.({
    dom:{
      familySidebar,
      familySidebarBackdrop,
      familySidebarToggleButton,
      sidebarResizer
    },
    constants:{
      SIDEBAR_MIN_WIDTH,
      SIDEBAR_MAX_WIDTH,
      SIDEBAR_DEFAULT_WIDTH,
      SIDEBAR_WIDTH_KEY,
      FAMILY_PANEL_COLLAPSED_KEY
    },
    helpers:{
      uiText,
      iconSvg,
      scheduleFamilyNameInputWidthSync,
      createDebouncedCallback
    }
  });

if (!genealogyChrome) {
  throw new Error('Genealogy chrome controller failed to initialize.');
}

// App 只協調互動流程；事件註冊與位置計算已由 UI Controller 接管。
function openSidebar() { return genealogyChrome.openSidebar(); }
function closeSidebar() { return genealogyChrome.closeSidebar(); }
function setFamilyPanelCollapsed(collapsed, options) {
  return genealogyChrome.setFamilyPanelCollapsed(collapsed, options);
}
function restoreFamilyPanelCollapsed() {
  return genealogyChrome.restoreFamilyPanelCollapsed();
}
function setupAppMenus() { return genealogyChrome.setupAppMenus(); }
function closeAppMenus(except = null) {
  return genealogyChrome.closeAppMenus(except);
}
function setupHelpTooltipPortal() {
  return genealogyChrome.setupHelpTooltipPortal();
}
function applySidebarWidth(value, options) {
  return genealogyChrome.applySidebarWidth(value, options);
}

// 在 UI Controller 建立後立即恢復側邊欄寬度。
genealogyChrome.restoreSidebarWidth();

// ========【資料儲存佇列】 Runtime Save Coordinator 為唯一儲存 Authority ========
let workspaceWriteSequence = 0;
let workspaceWritePending = Promise.resolve();
const genealogySaveCoordinator =
  genealogyRuntime?.createSaveCoordinator?.({
    delay:260,
    idleTimeout:700,

    serialize:() =>
      genealogyStore.serializeDatabase(),

    write:serialized => {
      const writeNumber = ++workspaceWriteSequence;
      try {
        localStorage.setItem(STORE_KEY, serialized);
        // 之前可能仍有圖片資料庫的寫入排隊；只允許最新版本更新儲存位置。
        workspaceWritePending = Promise.resolve();
      } catch (error) {
        if (
          error?.name !== 'QuotaExceededError' &&
          !/quota/i.test(error?.message || '')
        ) throw error;

        // 資料庫依寫入順序排隊。必須等原始字串完整保存後才切換輕量定位標記。
        workspaceWritePending = workspaceWritePending
          .catch(() => {})
          .then(async () => {
            await assetStore.saveWorkspaceData(serialized);
            if (writeNumber === workspaceWriteSequence) {
              localStorage.setItem(STORE_KEY, WORKSPACE_IDB_MARKER);
            }
          });
        void workspaceWritePending.catch(saveError => {
          console.error('[大型族譜資料儲存失敗]', saveError);
        });
      }
    },

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

function flushPendingGenealogySave() {
  return genealogySaveCoordinator
    .flush();
}

window.addEventListener(
  'beforeunload',
  () => flushPendingGenealogySave()
);

document.addEventListener(
  'visibilitychange',
  () => {
    if (
      document.visibilityState ===
      'hidden'
    ) {
      flushPendingGenealogySave();
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
    '--genealogy-roster-item-bg','--genealogy-roster-item-hover',
    '--filter-checkmark-image'
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

        customThemePrimaryColorInput.value = customColors.c1;
        customThemeSecondaryColorInput.value = customColors.c2;
        customColor3.value = customColors.c3;
        window.L1nGColorPicker?.sync?.();
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
    ['--filter-checkmark-image',relativeHexLuminance(c3) > 0.179
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3 8l3.2 3.2L13 4.7' stroke='%23172636' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
      : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3 8l3.2 3.2L13 4.7' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`],
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
    'linear-gradient(120deg, ' + customThemePrimaryColorInput.value + ' 0%, ' + customThemeSecondaryColorInput.value + ' 100%)';
  appearanceCustomThemePreview.style.boxShadow =
    'inset 0 0 0 2px ' + formatHexRgba(customColor3.value,0.58);
}

[customThemePrimaryColorInput,customThemeSecondaryColorInput,customColor3].forEach(input => {
  input?.addEventListener('input',paintCustomThemePreview);
});

$('applyCustomThemeColorsButton').onclick = () => {
  chooseCustomTheme(customThemePrimaryColorInput.value,customThemeSecondaryColorInput.value,customColor3.value);
};

// ========【共用排列狀態】切換檢視 / 編輯模式不再複製位置 ========
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
  clearNodeSelection();
  arrangeTool = 'pan';
  setGenealogyViewMode(viewMode === 'view' ? 'edit' : 'view');
  // 只改卡片外觀，不改手動位置、排列狀態或 Ctrl + Z 歷史。
  render();
  syncLayoutModeControls();
  requestAnimationFrame(() => genealogyViewport.fit());
}
modeToggle.onclick = toggleViewMode;

// ========【關係線外觀】 沿用現有外觀 UI，只有其他關係提供曲線與個別類型設定 ========
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

  const normalizedType = String(type || '').trim();
  const isRoommate = normalizedType === '室友';

  return {
    ...RELATIONSHIP_LINE_DEFAULTS.other,
    curved:normalizedType === '情人' || isRoommate,
    showArrow:isRoommate ? true : RELATIONSHIP_LINE_DEFAULTS.other.showArrow,
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

  return normalizeRelationshipLineSetting(
    'other',
    relationshipLineSettings.otherTypes?.[type],
    fallback
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

function relationshipCurvePreviewPath() {
  return 'M4 18 C41 3 79 3 116 18';
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
      relationshipCurvePreviewPath() +
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
  const label=$('relationshipOtherTypeValue');
  if (label) label.textContent=options.find(entry=>entry.type===activeOtherRelationshipType)?.label||uiText('關聯');
}

function setRelationshipSwitchState(button,enabled) {
  button?.setAttribute('aria-pressed',enabled ? 'true' : 'false');
}

function relationshipHorizontalPreviewAnchors(
  preview
) {
  const cardA =
    preview?.querySelector('.card-a');
  const cardB =
    preview?.querySelector('.card-b');

  if (
    !preview ||
    !cardA ||
    !cardB
  ) {
    return {
      aX:136,
      aY:95,
      bX:184,
      bY:95
    };
  }

  const previewRect =
    preview.getBoundingClientRect();
  const cardARect =
    cardA.getBoundingClientRect();
  const cardBRect =
    cardB.getBoundingClientRect();

  if (
    previewRect.width <= 0
  ) {
    return {
      aX:136,
      aY:95,
      bX:184,
      bY:95
    };
  }

  const scaleX =
    320 / previewRect.width;

  return {
    // X 只取左右卡片真正可見的相對邊緣。
    aX:
      (
        cardARect.right -
        previewRect.left
      ) * scaleX,
    // 橫向預覽永遠位於 190 高度的正中央。
    aY:95,

    bX:
      (
        cardBRect.left -
        previewRect.left
      ) * scaleX,
    bY:95
  };
}

function relationshipFullPreviewPath(
  key,
  setting,
  preview
) {
  // 父母 / 子女與領養使用固定垂直置中的關係預覽。
  if (
    key === 'parent' ||
    key === 'adopt'
  ) {
    return 'M160 76 L160 114';
  }

  const {
    aX,
    aY,
    bX,
    bY
  } =
    relationshipHorizontalPreviewAnchors(
      preview
    );

  if (
    key === 'other' &&
    setting.curved
  ) {
    const amplitude=Math.max(12,Math.min(32,Math.abs(bX-aX)*0.16));

    const midX =
      (aX + bX) / 2;

    const midY =
      (aY + bY) / 2;

    return (
      'M' +
      aX.toFixed(2) +
      ' ' +
      aY.toFixed(2) +
      ' Q' +
      midX.toFixed(2) +
      ' ' +
      (midY - amplitude).toFixed(2) +
      ' ' +
      bX.toFixed(2) +
      ' ' +
      bY.toFixed(2)
    );
  }

  return (
    'M' +
    aX.toFixed(2) +
    ' ' +
    aY.toFixed(2) +
    ' L' +
    bX.toFixed(2) +
    ' ' +
    bY.toFixed(2)
  );
}
function relationshipPreviewArrowPath(
  preview,
  tipX,
  tipY,
  directionX,
  directionY
) {
  const previewRect =
    preview?.getBoundingClientRect();

  const width =
    Math.max(
      1,
      previewRect?.width || 320
    );

  const height =
    Math.max(
      1,
      previewRect?.height || 190
    );

  const viewBoxScaleX =
    320 / width;

  const viewBoxScaleY =
    190 / height;

  // 畫布 markerWidth / markerHeight 的基準是 5.5，
  // marker path 實際三角形佔 viewBox 約 80%。
  // 因此預覽也用同一視覺比例，並跟隨目前線條粗細。
  const markerScreenSize =
    6.5;

  const arrowScreenLength =
    markerScreenSize * 0.8;

  const arrowScreenHalfWidth =
    markerScreenSize * 0.4;

  // 先把方向轉成螢幕座標再正規化，
  // 避免 preserveAspectRatio="none" 導致桌面版橫向箭頭被拉大。
  const screenDx =
    directionX / viewBoxScaleX;

  const screenDy =
    directionY / viewBoxScaleY;

  const screenLength =
    Math.hypot(
      screenDx,
      screenDy
    ) || 1;

  const dx =
    screenDx / screenLength;

  const dy =
    screenDy / screenLength;

  const baseScreenX =
    (tipX / viewBoxScaleX) -
    dx * arrowScreenLength;

  const baseScreenY =
    (tipY / viewBoxScaleY) -
    dy * arrowScreenLength;

  const px =
    -dy * arrowScreenHalfWidth;

  const py =
    dx * arrowScreenHalfWidth;

  const tipScreenX =
    tipX / viewBoxScaleX;

  const tipScreenY =
    tipY / viewBoxScaleY;

  return (
    'M' +
    tipX.toFixed(2) +
    ' ' +
    tipY.toFixed(2) +
    ' L' +
    ((baseScreenX + px) * viewBoxScaleX).toFixed(2) +
    ' ' +
    ((baseScreenY + py) * viewBoxScaleY).toFixed(2) +
    ' L' +
    ((baseScreenX - px) * viewBoxScaleX).toFixed(2) +
    ' ' +
    ((baseScreenY - py) * viewBoxScaleY).toFixed(2) +
    ' Z'
  );
}

function relationshipPreviewLineGeometry(setting, preview) {
  const {aX,aY,bX,bY}=relationshipHorizontalPreviewAnchors(preview);
  let controlX1=null,controlY1=null,controlX2=null,controlY2=null;
  if(setting.curved){
    const dx=bX-aX,dy=bY-aY;
    const rise=Math.max(10,Math.min(30,Math.abs(dx)*0.14));
    controlX1=aX+dx/3;
    controlY1=aY+dy/3-4*rise/3;
    controlX2=aX+dx*2/3;
    controlY2=aY+dy*2/3-4*rise/3;
  }
  return {startX:aX,startY:aY,endX:bX,endY:bY,
    controlX1,controlY1,controlX2,controlY2};
}

function relationshipPreviewArrowGeometry(setting, preview) {
  const g=relationshipPreviewLineGeometry(setting,preview);
  const startDx=setting.curved?g.controlX1-g.startX:g.endX-g.startX;
  const startDy=setting.curved?g.controlY1-g.startY:g.endY-g.startY;
  const endDx=setting.curved?g.endX-g.controlX2:g.endX-g.startX;
  const endDy=setting.curved?g.endY-g.controlY2:g.endY-g.startY;
  return {
    start:relationshipPreviewArrowPath(preview,g.startX,g.startY,-startDx,-startDy),
    end:relationshipPreviewArrowPath(preview,g.endX,g.endY,endDx,endDy)
  };
}

function updateRelationshipFullPreview() {
  const preview = $('relationshipFullPreview');
  const path = $('relationshipFullPreviewPath');
  const arrowStart = $('relationshipFullPreviewArrowStart');
  const arrowEnd = $('relationshipFullPreviewArrowEnd');
  if (!preview || !path) return;

  const key = activeRelationshipStyleKey;
  const setting = key === 'other'
    ? getOtherRelationshipLineSetting(activeOtherRelationshipType || '關聯')
    : relationshipEditorSetting();
  const color = relationshipResolvedColor(setting,key === 'other' ? 'other' : key);
  const vertical = key === 'parent' || key === 'adopt';

  preview.dataset.orientation = vertical ? 'vertical' : 'horizontal';

  const hasEndArrow =
    key === 'other' &&
    !!setting.showArrow;

  const hasStartArrow =
    hasEndArrow &&
    isSymmetricSocialRelationshipType(
      activeOtherRelationshipType
    );

  if (
    key === 'other'
  ) {
    const geometry =
      relationshipPreviewLineGeometry(
        setting,
        preview
      );

    if(setting.curved && geometry.controlX1 != null) {
      path.setAttribute('d',
        'M'+geometry.startX.toFixed(2)+' '+geometry.startY.toFixed(2)+
        ' C'+geometry.controlX1.toFixed(2)+' '+geometry.controlY1.toFixed(2)+
        ' '+geometry.controlX2.toFixed(2)+' '+geometry.controlY2.toFixed(2)+
        ' '+geometry.endX.toFixed(2)+' '+geometry.endY.toFixed(2)
      );
    } else {
      path.setAttribute(
        'd',
        'M' +
          geometry.startX.toFixed(2) +
          ' ' +
          geometry.startY.toFixed(2) +
          ' L' +
          geometry.endX.toFixed(2) +
          ' ' +
          geometry.endY.toFixed(2)
      );
    }
  } else {
    path.setAttribute(
      'd',
      relationshipFullPreviewPath(
        key,
        setting,
        preview
      )
    );
  }
  path.setAttribute('stroke',color);
  path.setAttribute('stroke-width',String(Math.max(1,Number(setting.width) || 1.5)));
  path.setAttribute('stroke-dasharray',relationshipDashValue(setting));

  if (arrowStart) {
    arrowStart.hidden = true;
    arrowStart.removeAttribute('d');
  }

  if (arrowEnd) {
    arrowEnd.hidden = true;
    arrowEnd.removeAttribute('d');
  }

  if (
    key === 'other' &&
    setting.showArrow
  ) {
    const arrows =
      relationshipPreviewArrowGeometry(
        setting,
        preview
      );

    if (arrowEnd) {
      arrowEnd.setAttribute(
        'd',
        arrows.end
      );
      arrowEnd.setAttribute(
        'fill',
        color
      );
      arrowEnd.hidden = false;
    }

    if (
      arrowStart &&
      isSymmetricSocialRelationshipType(
        activeOtherRelationshipType
      )
    ) {
      arrowStart.setAttribute(
        'd',
        arrows.start
      );
      arrowStart.setAttribute(
        'fill',
        color
      );
      arrowStart.hidden = false;
    }
  }
}

window.addEventListener(
  'resize',
  () => {
    if (
      $('appearanceDialog')
        ?.classList
        .contains('show')
    ) {
      updateRelationshipFullPreview();
    }
  }
);

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
  if (widthEl) {
    widthEl.value = String(setting.width);
    syncGenealogyRangeFill(widthEl);
  }
  if (widthValue) widthValue.textContent = Number(setting.width).toFixed(1).replace(/\.0$/,'') + ' px';
  if (colorEl) colorEl.value = relationshipResolvedColor(setting,other ? 'other' : key);
  window.L1nGColorPicker?.sync?.();

  const curveSupported = key === 'other';
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

  syncRelationshipNavPreviews();
  updateRelationshipFullPreview();
}

document.querySelectorAll('[data-rel-editor-key]').forEach(button => {
  button.addEventListener('click',() => {
    activeRelationshipStyleKey = button.dataset.relEditorKey || 'parent';
    syncRelationshipLineControls();
  });
});

$('relationshipOtherTypeTrigger')?.addEventListener('click',event=>{
  event.preventDefault();
  event.stopPropagation();
  const trigger=event.currentTarget;
  if (!$('relationshipTypePopover')?.hidden && trigger.getAttribute('aria-expanded')==='true') {
    closeRelationshipTypePicker();
    return;
  }
  openRelationshipTypePicker({
    trigger,
    value:activeOtherRelationshipType,
    onSelect:value=>{
      // 視覺設定只調整既有關係線類型，不在此新增家庭關係。
      if (!getOtherRelationshipTypes().some(entry=>entry.type===value)) return;
      const select=$('relationshipOtherTypeSelect');
      if (!select) return;
      select.value=value;
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
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
  if (activeRelationshipStyleKey !== 'other') return;
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

$('resetRelationshipStyleBtn')?.addEventListener('click',() => {
  relationshipLineSettings = createRelationshipLineSettings();
  try { localStorage.removeItem(REL_LINE_STYLE_KEY); } catch (_) {}
  applyRelationshipLineSettings();
  if (getSceneLayout()) genealogyScene?.requestUpdate?.({ edges:true },{ immediate:true });
});

function syncRelationshipLabelLockControl() {
  if (!relationshipLabelsLockToggle) return;

  setIconText(
    relationshipLabelsLockToggle,
    labelLocked
      ? 'unlock'
      : 'lock',
    labelLocked
      ? '解鎖關係'
      : '鎖定關係'
  );

  relationshipLabelsLockToggle.classList.toggle(
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
  if (!relationshipLabelsLockToggle) return;
  relationshipLabelsLockToggle.hidden = !showRelLabels;
  relationshipLabelsLockToggle.style.display = showRelLabels ? '' : 'none';
}
relationshipLabelsLockToggle.onclick = () => setRelationshipLabelLock(!labelLocked);

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
      : uiText('將圖片拖曳到這裡，或點選此處選擇檔案')
  );
}

function openAppearancePanel() {
  $('appearanceBackgroundOpacity').value =
    Math.round(bgSettings.opacity * 100);
  syncGenealogyRangeFill($('appearanceBackgroundOpacity'));
  $('appearanceBackgroundOpacityValue').textContent =
    Math.round(bgSettings.opacity * 100) + '%';
  $('appearanceBackgroundFit').value = bgSettings.fit;

  customThemePrimaryColorInput.value = customColors.c1;
  customThemeSecondaryColorInput.value = customColors.c2;
  customColor3.value = customColors.c3;
  window.L1nGColorPicker?.sync?.();

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
  const result = await assetStore.optimizeForUsage(validateSupportedImageFile(file), 'background');

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
    '確定移除目前背景圖片嗎？',
    {
      title:'移除背景圖片',
      kind:'danger',
      confirmText:'移除背景圖片'
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
$('appearanceHeaderCloseBtn')?.addEventListener('click', closeAppearancePanel);
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

// ========【恢復預設】 介面設定與範例資料分開處理 ========
const resetUiSettingsBtn = $('resetUiSettingsBtn');
if (resetUiSettingsBtn) {
  resetUiSettingsBtn.onclick = async () => {
    const ok = await uiConfirm(
      '恢復主題、背景、側邊欄寬度、檢視模式與關係線等介面設定？\n族譜模擬市民、關係與卡片位置不會被刪除。',
      { title:'恢復介面預設', confirmText:'恢復預設', kind:'default' }
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
    setRelationshipLabelLock(true);
    syncCanvasBackgroundSurface();
    paintCanvasBackgroundPreview();
    syncLayoutModeControls();
    const labelBtn = $('relationshipLabelsVisibilityToggle');
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
        '恢復後，目前的族譜資料將被取代且無法復原。建議先匯出 JSON 備份。',
        { title:'恢復預設族譜', confirmText:'恢復預設族譜', kind:'danger',
          richContent:{
            lead:'',
            warnings:['恢復後，目前的族譜資料將被取代且無法復原。建議先匯出 JSON 備份。']
          },
          backupAction:exportCurrentGenealogyBackup }
      );

      if (!ok) return;

      const progressTitle = '恢復預設族譜';
      showFileOperationStatus('準備預設族譜資料……', 10, progressTitle);
      await waitForFileOperationPaint();
      try {
        // 所有預設肖像必須先驗證完成，才允許取代玩家目前的族譜。
        const sampleDb = prepareDatabase(buildDefaultGenealogyData()).prepared;
        showFileOperationStatus('整理模擬市民、寵物與家庭關係……', 20, progressTitle);
        await waitForFileOperationPaint();
        await ensureSamplePortraitAssets(sampleDb, {
          onProgress(done, total) {
            const en = (document.documentElement.lang || '').toLowerCase().startsWith('en');
            const count = en ? ` (${done} / ${total})` : `（${done} / ${total}）`;
            showFileOperationStatus(
              '還原預設頭像' + count + '……',
              total ? 20 + Math.floor(65 * done / total) : 85,
              progressTitle
            );
          }
        });
        showFileOperationStatus('更新目前族譜……', 90, progressTitle);
        await waitForFileOperationPaint();
        personEditor.close();
        replaceCanonicalGenealogyDatabase(sampleDb);
        // 恢復預設族譜時，關係標籤鎖定與拖曳歷史一併還原。
        setRelationshipLabelLock(true);
        dragHistory.clear();

        showFileOperationStatus('儲存族譜與圖片資料……', 95, progressTitle);
        await save({ immediate:true });
        refreshFamilyUI();
        render();
        appearanceDialog.classList.remove('show');
        storageDialog.classList.remove('show');
        requestAnimationFrame(() => genealogyViewport.fit());
        showFileOperationStatus('所有資料已處理完成！', 100, progressTitle);
        await waitForFileOperationPaint();
        uiToast('已恢復預設族譜。');
      } catch (error) {
        hideFileOperationStatus();
        await uiAlert('恢復預設族譜失敗：' + (error?.message || String(error)), {
          title:'恢復預設族譜失敗', kind:'danger'
        });
      } finally {
        hideFileOperationStatus();
      }
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

$('cleanupUnusedImagesButton').onclick = async () => {
  if (!await uiConfirm('要清理未使用的圖片嗎？系統會移除目前沒有被族譜引用的圖片，仍在使用的圖片會保留。', { title: '清理未使用的圖片', kind: 'danger', confirmText: '開始清理' })) return;
  const button = $('cleanupUnusedImagesButton');

  await withActionButtonLoading(
    button,
    '清理中',
    async () => {
      const n =
        await assetStore.cleanupUnusedAssets(currentGenealogyData(), bgSettings);

      uiToast(
        n > 0
          ? `已清理 ${n} 張未使用的圖片。`
          : '目前沒有可清理的圖片。'
      );

      await updateStorageInfo();
    }
  );
};

// ========【使用說明輸入方式】 依實際操作切換電腦／觸控說明，不綁定裝置類型 ========
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

// ========【彈窗 Lifecycle】 Esc 只找最上層彈窗；各 subsystem 自己清理狀態 ========
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

const genealogyFocus = window.L1nGGenealogyFocus;
MODAL_LIFECYCLE_STACK.forEach(entry => genealogyFocus?.register(entry.dialog, entry.close));
genealogyFocus?.register(exportDialog, () => closeExportPanel());
function closeTopModal() {
  if (genealogyFocus) {
    const current = genealogyFocus.top();
    if (!current) return false;
    const lifecycle = MODAL_LIFECYCLE_STACK.find(item => item.dialog === current.element);
    if (lifecycle) { lifecycle.close(); return true; }
    if (current.element === exportDialog) { closeExportPanel(); return true; }
    return false;
  }
  return window.L1nGGenealogyUI.closeTopmostDialog(MODAL_LIFECYCLE_STACK);
}

// 親子／收養查詢由 Store 統一管理；保留既有畫布及編輯器呼叫介面。
function genealogyParentRelations(child, byId = null) {
  return genealogyStore.getParentRelations(child, byId);
}
function genealogyParentIds(child, byId = null) {
  return genealogyStore.getParentIds(child, byId);
}
function genealogyParentRelationGroups(child, byId = null) {
  return genealogyStore.getParentRelationGroups(child, byId);
}
function genealogyParentKindFor(child, parentId, byId = null) {
  return genealogyStore.getParentKindFor(child, parentId, byId);
}

// 子女索引由 Store 統一建立／失效。
function getChildrenOf(id) {
  return genealogyStore.getChildrenOf(id);
}
function invalidateChildrenIndex() {
  genealogyStore.invalidateChildrenIndex();
}

function invalidateRelationshipGraph() {
  return genealogyRuntime?.invalidateRelationships?.();
}

genealogyStore =
  window.L1nGGenealogyStore?.create?.({
    uid,
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
    gameManagedSimFields:
      window.L1nGGameImport
        ?.GAME_MANAGED_SIM_FIELDS ||
      [],
    cardSettingFieldKeys:CARD_SETTING_FIELD_KEYS,
    defaultCardViewSettings:DEFAULT_CARD_VIEW_SETTINGS,
    defaultCardEditSettings:DEFAULT_CARD_EDIT_SETTINGS,
    cardViewAppearances:['minimal','translucent','full'],
    petCardFieldKeys:PET_CARD_FIELD_KEYS,
    defaultPetCardViewSettings:DEFAULT_PET_CARD_VIEW_SETTINGS,
    defaultPetCardEditSettings:DEFAULT_PET_CARD_EDIT_SETTINGS
  }) ||
  null;

if (!genealogyStore) {
  throw new Error('Genealogy Store failed to initialize.');
}

personEditor.bindStore(genealogyStore);

// ========【Canonical Database Replace】 整庫替換後統一失效所有結構快取 ========
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


// ========【特質顯示文字】 模擬市民與寵物共用特質內容的富文字標籤清理 ========
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

// ========【Schema v1 資料載入】 資料正規化由 Genealogy Store 統一負責 ========
// 圖片清理排程交由 Assets；每次真正執行時讀取最新資料。
function scheduleGC() {
  assetStore.scheduleGarbageCollect(() => ({
    database:currentGenealogyData(),
    background:bgSettings,
    retainAssetIds:retainedHistoryAssetIds()
  }));
}

function getRelationshipInfoByKey(
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

  const inferredChildText = semanticType === 'parent-child' &&
    String(key).startsWith('parent:')
      ? familyDerivedChildTitle(
          currentGenealogyData()?.sims?.[String(key).slice(7)]
        )
      : '';
  const descriptor =
    relationshipSemanticDescriptor(
      semanticType,
      inferredChildText || defaultText
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

// 畫布關係標籤的量測與 SVG 排版，改由 genealogy_scene.js 負責。

// 模擬市民編輯器保留目前的回呼介面，但壓縮政策與執行由 Assets 負責。
async function compressImage(file, kind = 'sim') {
  validateSupportedImageFile(file);
  return assetStore.optimizeForUsage(file, kind === 'pet' ? 'petAvatar' : 'avatar');
}

function familyVisibleIds(familyId, { applyTopbarFilters = true } = {}) {
  const db = currentGenealogyData();
  const isCurrent = familyId === db.currentFamilyId;
  const family = isCurrent ? currentTreeFamily() : genealogyStore.getFamily(familyId);
  const attachmentSources = isCurrent && familyTreeViewMode !== 'extended' &&
    Array.isArray(family?.primaryMemberIds) && family.primaryMemberIds.length
      ? family.primaryMemberIds : null;
  return genealogyStore.getVisibleFamilyIds(family, {
    relationshipSourceIds:attachmentSources,
    matchesSim:applyTopbarFilters ? simMatchesTopbarFilters : null
  });
}

function getVisibleIds(familyId) {
  return familyVisibleIds(familyId);
}

// 側邊欄使用族譜完整成員範圍；頂部篩選只影響畫布。
// 配偶／前任屬於可顯示的關聯模擬市民，不代表已加入原始 Household。
function currentDisplayedFamily() {
  const family = currentFamily();
  if (!family) return null;
  const treeFamily = currentTreeFamily() || family;
  return {
    ...treeFamily,
    memberIds:[...familyVisibleIds(family.id, { applyTopbarFilters:false })]
  };
}

// ========【圖片預熱】 優先載入當前可見圖片，降低畫面中的頭像載入跳動 ========
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

  // 自動拼貼的寵物圖片即使畫布篩選隱藏寵物也需要載入。
  (family?.memberIds||[]).forEach(id=>{
    (currentGenealogyData().sims[id]?.pets||[]).forEach(pet=>addPriority(pet.avatar));
  });
  if(family?.gameData?.householdId!=null) {
    (currentGenealogyData()?.meta?.unassignedPets||[]).forEach(pet=>{
      if(String(pet?.gameData?.householdId??'')===String(family.gameData.householdId))addPriority(pet.avatar);
    });
  }

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

  if (!petVisibilityFilter || petVisibilityFilter.checked) {
    const current = currentFamily();
    const owners = new Set([
      ...(current?.memberIds || []),
      ...visibleIds
    ].map(String));
    const householdIds = new Set();
    owners.forEach(id => {
      const owner = currentGenealogyData().sims[id];
      const householdId = owner?.gameData?.householdId;
      if (householdId != null) householdIds.add(String(householdId));
      (owner?.pets || []).forEach(pet => addPriority(pet?.avatar));
    });
    if (current?.gameData?.householdId != null) {
      householdIds.add(String(current.gameData.householdId));
    }
    (currentGenealogyData()?.meta?.unassignedPets || []).forEach(pet => {
      const householdId = pet?.gameData?.householdId;
      if (householdId != null && householdIds.has(String(householdId))) {
        addPriority(pet.avatar);
      }
    });
  }

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

// ========【族譜 Viewport】 視角狀態與座標換算由獨立模組唯一管理 ========
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

// ========【族譜 Scene】 Layout / Relationship Geometry / Renderer 唯一 Canvas Authority ========
genealogyScene =
  window.L1nGGenealogyScene?.create?.({
    runtime:genealogyRuntime,
    dom:{ stage, svg, labelsSvg, nodes, pets:petCardsLayer },
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
      buildPersonPresentation,
      getActiveFamilySelectorEntry, currentTreeFamily, currentFamily, uiText, displayDataText,
      displayRelationshipText, isSiblingLink, resolveKinshipLabel, relationshipPerspectiveSim,
      relationshipLineSetting, relationshipOtherType,
      getOtherRelationshipLineSetting, isSymmetricSocialRelationshipType, relationshipResolvedColor, relationshipInlineSvgStyle,
      relationshipLayoutPriority, genealogyParentIds, genealogyParentRelationGroups, getChildrenOf, getRelationshipInfoByKey,
      getVisibleIds, syncNodeSelectionClasses, formatBirthdaySummary, esc, iconSvg, pairKey,
      avatarHTML, renderTraitTagSummary, getSimGenderClass, getSimStatusClass,
      showPetCards:() => !petVisibilityFilter || petVisibilityFilter.checked,
      petCardAvatarHTML:pet => petAvatarWithFallbackHTML(pet),
      petOwnerAvatarHTML:sim => {
        const name=displayDataText(sim.name,sim)||uiText('（未命名）');
        return framedAvatarImageHTML(sim.avatar,sim.avatarFrame)||esc((name||'?').charAt(0));
      },
      petCardSpeciesLabel:formatPetSpecies,
      petCardGenderLabel:petGenderLabel,
      getPetCardSettings,
      syncPetSelectionClasses
    }
  }) || null;
if (!genealogyScene) throw new Error('Genealogy Scene failed to initialize.');
function getSceneLayout() { return genealogyScene?.readScenePlan?.() || null; }
// Viewport transform / zoom / fit / resize lifecycle 已移至 genealogy_viewport.js。
// ========【模擬市民庫定位】 依實際族譜範圍找家庭，而不是只在當前畫布搜尋卡片 ========
function findPersonFamilyLocation(simId) {
  const db = currentGenealogyData();
  const id = String(simId || '');
  if (!db?.sims?.[id]) return null;

  const modeOrder = [...new Set([
    familyTreeViewMode, 'extended', 'ea', 'household'
  ])];
  const ownedFamilyIds = new Set(
    (db.families || []).filter(family =>
      (family.memberIds || []).map(String).includes(id) ||
      familySourceSeedIds(family).includes(id)
    ).map(family => String(family.id))
  );
  const inScope = (entry, mode) => {
    if (!entry) return false;
    const members = (entry.memberIds || []).map(String);
    if (members.includes(id)) return true;
    // Household／EA 族譜仍會顯示直接配偶或前任；找家庭時同樣使用 Store 規則。
    const sources = mode !== 'extended' && (entry.primaryMemberIds || []).length
      ? entry.primaryMemberIds : null;
    return genealogyStore.getVisibleFamilyIds(
      { memberIds:members },
      { relationshipSourceIds:sources }
    ).has(id);
  };

  const active = getActiveFamilySelectorEntry(familyTreeViewMode);
  if (inScope(active, familyTreeViewMode)) {
    return { mode:familyTreeViewMode, entry:active };
  }

  const candidates = [];
  modeOrder.forEach((mode, modeIndex) => {
    getFamilySelectorEntries(mode).forEach((entry, index) => {
      if (!inScope(entry, mode)) return;
      const directlyListed = (entry.memberIds || []).map(String).includes(id);
      const owned = ownedFamilyIds.has(String(entry.familyId)) ||
        (entry.sourceFamilyIds || []).some(familyId =>
          ownedFamilyIds.has(String(familyId))
        );
      candidates.push({ mode, entry, modeIndex, index, directlyListed, owned });
    });
  });
  candidates.sort((a,b) =>
    Number(b.owned)-Number(a.owned) ||
    Number(b.directlyListed)-Number(a.directlyListed) ||
    a.modeIndex-b.modeIndex ||
    (a.entry.memberIds?.length || 0)-(b.entry.memberIds?.length || 0) ||
    a.index-b.index
  );
  const selected = candidates[0];
  return selected ? { mode:selected.mode, entry:selected.entry } : null;
}

// 定位是玩家明確要求顯示模擬市民；若被篩選隱藏，只補勾必要的分類選項。
function revealPersonInTopbarFilters(sim) {
  let changed = false;
  [
    [statusFilterInputs, sim.status],
    [genderFilterInputs, sim.gender],
    [raceFilterInputs, sim.race],
    [lifeStageFilterInputs, sim.lifeStage]
  ].forEach(([inputs, value]) => {
    if (topbarFilterGroupMatches(checkedTopbarFilterValues(inputs), inputs, value)) return;
    const matching = inputs.find(input => input.value === (value || ''));
    if (matching) matching.checked = true;
    else inputs.forEach(input => { input.checked = true; });
    changed = true;
  });
  if (changed) updateTopbarFilterUI();
  return changed;
}

// 先確立家庭與分頁，再更新畫布，最後依新座標將模擬市民置中。
function locatePersonFromLibrary(simId) {
  const id = String(simId || '');
  const sim = currentGenealogyData()?.sims?.[id];
  if (!sim) return false;
  const target = findPersonFamilyLocation(id);
  if (!target?.entry) {
    uiAlert(uiText('找不到包含這位模擬市民的族譜，請先將其加入家族。'), {
      title:uiText('在族譜中定位')
    });
    return false;
  }

  const { mode, entry } = target;
  const changedFamily = familyTreeViewMode !== mode ||
    String(currentFamily()?.id || '') !== String(entry.familyId || '') ||
    getFamilyTreeSelectionValue(mode) !== entry.value;

  const changedFilters = revealPersonInTopbarFilters(sim);
  if (changedFamily) {
    familyTreeViewMode = mode;
    try { localStorage.setItem(FAMILY_TREE_VIEW_MODE_KEY, mode); } catch (_) {}
    setFamilyTreeSelectionValue(mode, entry.value);
    genealogyStore.setCurrentFamilyId(entry.familyId);
    familyTreeLastSourceFamilyId = entry.familyId;
    dragHistory.clear();
    clearNodeSelection();
    resetFamilyMemberOperations();
  }

  personLibraryController.close();
  if (changedFamily) {
    save();
    refreshFamilyUI();
  } else if (changedFilters) {
    refreshFamilyProfilePanel();
  }
  if (changedFamily || changedFilters) render();

  // 重建畫布後才可讀取新卡片的位置；不能沿用前一家庭的 Scene 快取。
  requestAnimationFrame(() => {
    if (!getSceneLayout()?.pos?.has(id)) render();
    requestAnimationFrame(() => {
      if (getSceneLayout()?.pos?.has(id)) {
        focusSimOnCanvas(id);
      } else {
        uiAlert(uiText('這位模擬市民目前沒有可顯示的族譜卡片。'), {
          title:uiText('在族譜中定位')
        });
      }
    });
  });
  return true;
}

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

// ========【App Render Orchestration】 Runtime 唯一管理 Scene / Chrome / Lists dirty 排程 ========
const genealogyRenderCoordinator =
  genealogyRuntime?.createRenderCoordinator?.({
    requestSceneUpdate:(layers,options) => genealogyScene?.requestUpdate?.(layers,options),
    refreshChrome:() => {
      syncRelationshipPerspectiveUI();
      syncLayoutModeControls();
    },
    refreshLists:() => {
      if (personLibraryDialog.classList.contains('show')) renderPersonLibrary();
      if (familyMemberPickerDialog.classList.contains('show')) renderFamilyMemberPickerList();
    }
  });

if (!genealogyRenderCoordinator) {
  throw new Error('Genealogy render coordinator failed to initialize.');
}

function invalidateRender(layers, options = {}) {
  return genealogyRenderCoordinator.invalidate(layers, options);
}

function render() {
  invalidateRender(
    { layout:true, nodes:true, edges:true, chrome:true, lists:true },
    { immediate:true }
  );
}

function avatarHTML(sim) {
  return (
    buildPersonPresentation(sim)
      ?.avatarHtml ||
    '?'
  );
}

function statusIconHTML(sim) {
  const status =
    buildPersonPresentation(sim)
      ?.status;

  if (!status) return '';

  return `<span class="person-meta-icon status-icon status-${esc(status.className)}" title="${esc(status.text)}">${iconSvg(status.icon)}</span>`;
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

// ========【寵物頭像】 物種 SVG 在圖片完成載入前保持可見 ========
function petAvatarWithFallbackHTML(pet) {
  const icon = petIconFor(pet);
  const image = framedAvatarImageHTML(pet?.avatar,pet?.avatarFrame,'pet-avatar-image');
  return `<span class="pet-avatar-species-fallback" aria-hidden="true">${icon}</span>${image}`;
}

function markPetAvatarLoaded(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.classList.contains('pet-avatar-image')) return;
  // 等圖片解碼成功才隱藏 SVG，避免透明的遊戲頭像露出預設物種圖示。
  image.closest('.genealogy-pet-card-avatar, .person-profile-pet-main-avatar, .person-profile-pet-avatar, .person-card-mini-pet-avatar, .family-cover-collage-pet')
    ?.classList.toggle('has-image', image.naturalWidth > 0);
}

function markPetAvatarError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.classList.contains('pet-avatar-image')) return;
  image.closest('.genealogy-pet-card-avatar, .person-profile-pet-main-avatar, .person-profile-pet-avatar, .person-card-mini-pet-avatar, .family-cover-collage-pet')
    ?.classList.remove('has-image');
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

// ========【寵物血統】 遊戲匯入血統只讀顯示，不改變既有手動寵物編輯流程 ========
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

function petLineageHTML(pet, { profileRows = false } = {}) {
  const lineage =
    getPetLineageInfo(pet);

  if (profileRows) {
    // 血統與模擬市民的家庭關係一樣常駐；缺少任一方時只顯示「—」。
    return '<div class="person-profile-list">' +
      renderPersonProfileRow(
        '父母',
        lineage.parentNames.length ? lineage.parentNames.map(esc).join(' / ') : '—'
      ) +
      renderPersonProfileRow(
        '子女',
        lineage.childNames.length ? lineage.childNames.map(esc).join(' / ') : '—'
      ) +
    '</div>';
  }

  // 市民編輯器內的寵物摘要仍維持原本的精簡呈現，不額外加上空資料。
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




function getSimGenderClass(sim) {
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

function getSimStatusClass(sim) {
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

// ========【個人資料關係】 個人檔案與族譜視角共用同一套親屬稱謂解析器 ========

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

function renderPersonProfilePet(pet,model) {
  const avatar=petAvatarWithFallbackHTML(pet);
  const name=personDisplayText(pet.name,model.person,model.draft)||uiText('（未命名）');
  const traits=(pet.traits || []).map(value=>
    personDisplayText(value,model.person,model.draft)
  ).filter(Boolean);
  const labels=[formatPetSpecies(pet),petGenderLabel(pet)].filter(Boolean);
  return `
    <div class="person-profile-pet">
      <div class="person-profile-pet-avatar">${avatar}</div>
      <div class="person-profile-pet-text">
        <div class="person-profile-pet-heading">
          <span class="person-profile-pet-name">${esc(name)}</span>
          <span class="person-profile-pet-identity">${esc(labels.join(' · '))}</span>
        </div>
        ${traits.length ? '<div class="person-profile-pet-traits">'+
          traits.map(value=>'<span class="tag">'+esc(value)+'</span>').join('')+'</div>' : ''}
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

  sections.push(
    renderPersonProfileSection(
      '備註',
      `<div class="person-profile-notes">${person.notes ? esc(presentation.notes) : '—'}</div>`
    )
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
  personProfilePetTarget = null;
  personProfileDialog.classList.remove('pet-profile-open');
  $('personProfileEditBtn').style.display = '';

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
  personProfileDialog.classList.remove('pet-profile-open');
  personProfilePersonId = null;
  personProfilePetTarget = null;
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
  const petTarget = personProfilePetTarget;
  closePersonProfile();

  if (petTarget) {
    openPetEditorFromCanvas(petTarget);
  } else if (id) {
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
    $('simPhotoTitleInput').value = entry?.title || '';
    $('simPhotoNoteTextarea').value = entry?.note || '';
    $('simPhotoLifeStageSelect').value = entry?.lifeStage || '';

    genealogyUI.refreshSelect('simPhotoTitleInput');
    genealogyUI.refreshSelect('simPhotoLifeStageSelect');
  },

  refreshPreview() {
    const preview = $('simPhotoEditorPreview');
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
    $('simPhotoRemoveImageButton').disabled = !imageRef;
    $('simPhotoEditorSaveButton').disabled = !imageRef;

    const tip = $('simPhotoFileInfo');
    if (!url) {
      tip.textContent = imageRef ? '圖片載入中……' : '尚未選擇圖片';
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
    $('simPhotoEditorTitle').textContent =
      entry ? '編輯圖片' : '新增圖片';
    $('simPhotoEditorDeleteButton').style.display =
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
      title:$('simPhotoTitleInput').value.trim(),
      note:$('simPhotoNoteTextarea').value.trim(),
      lifeStage:$('simPhotoLifeStageSelect').value,
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
      `要刪除「${entry.title || '未命名'}」這張圖片嗎？`,
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
    const result = await assetStore.optimizeForUsage(validateSupportedImageFile(file), 'gallery');

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
            `要刪除「${entry.title || '未命名'}」這張圖片嗎？`,
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
      $('simNameInput')?.value?.trim() ||
      uiText('模擬市民');

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
      uiText('模擬市民');

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

$('simAddLifePhotoButton').onclick = () => {
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

$('simPhotoEditorSaveButton').onclick = () => {
  lifePhotoWorkspace.commitEditor();
};
$('simPhotoEditorCancelButton').onclick = () => {
  lifePhotoWorkspace.closeEditor();
};
$('simPhotoEditorDeleteButton').onclick = () => {
  lifePhotoWorkspace.deleteEditorEntry();
};
lifePhotoEditorDialog.onclick = event => {
  if (event.target === lifePhotoEditorDialog) {
    lifePhotoWorkspace.closeEditor();
  }
};

$('simPhotoEditorPreview').onclick = () => {
  $('simPhotoFileInput').click();
};
$('simPhotoEditorPreview').addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  $('simPhotoFileInput').click();
});
for (const type of ['dragenter', 'dragover']) {
  $('simPhotoEditorPreview').addEventListener(type, event => {
    if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return;
    event.preventDefault();
    $('simPhotoEditorPreview').classList.add('dragover');
  });
}
for (const type of ['dragleave', 'drop']) {
  $('simPhotoEditorPreview').addEventListener(type, () => {
    $('simPhotoEditorPreview').classList.remove('dragover');
  });
}
$('simPhotoEditorPreview').addEventListener('drop', async event => {
  const file = Array.from(event.dataTransfer?.files || [])[0];
  if (!file) return;
  event.preventDefault();
  event.stopPropagation();
  try {
    await lifePhotoWorkspace.prepareFile(file);
  } catch (error) {
    await uiAlert('圖片處理失敗：' + error.message,
      { title:'圖片處理失敗', kind:'danger' });
  }
});
$('simPhotoFileInput').onchange = async event => {
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
$('simPhotoRemoveImageButton').onclick = () => {
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
function syncPetSelectionClasses() {
  if (!petCardsLayer) return;
  const visible = new Set();
  petCardsLayer.querySelectorAll('.genealogy-pet-card[data-pet-id]').forEach(element => {
    const id = element.dataset.petId;
    visible.add(id);
    const selected = selectedPetIds.has(id);
    element.classList.toggle('pet-card-selected', selected);
    element.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  [...selectedPetIds].forEach(id => {
    if (!visible.has(id)) selectedPetIds.delete(id);
  });
}

function syncNodeSelectionClasses() {
  const visible = new Set();
  nodes.querySelectorAll('.person-card[data-id]').forEach(el => {
    visible.add(el.dataset.id);
    el.classList.toggle('person-card-selected', selectedNodeIds.has(el.dataset.id));
  });
  [...selectedNodeIds].forEach(id => { if (!visible.has(id)) selectedNodeIds.delete(id); });
  syncPetSelectionClasses();
}

function clearNodeSelection() {
  if (!selectedNodeIds.size && !selectedPetIds.size) return;
  selectedNodeIds.clear();
  selectedPetIds.clear();
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
  selectedPetIds.clear();

  getSceneLayout()
    .visibleIds
    .forEach(id =>
      selectedNodeIds.add(id)
    );
  getSceneLayout()
    .petLayout?.cards
    ?.forEach(card => selectedPetIds.add(card.key));

  syncNodeSelectionClasses();
}

function closePersonCardMenu() {
  if (!personCardMenu) return;
  personCardMenu.classList.remove('show');
  personCardMenu.setAttribute('aria-hidden', 'true');
  personCardMenu.innerHTML = '';
  delete personCardMenu.dataset.petId;
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

// 混合多選共用相同的寵物位置鍵值，與市民拖曳使用同一筆歷史記錄。
function getSelectedPetDragPositions(fam) {
  const saved = fam?.manualPositions || {};
  const starts = new Map();
  (getSceneLayout()?.petLayout?.cards || []).forEach(card => {
    if (!selectedPetIds.has(card.key)) return;
    const pos = saved['pet:' + card.key] || card;
    starts.set(card.key, {x:pos.x, y:pos.y});
  });
  return starts;
}
function previewSelectedPetDrag(starts, dx, dy, positions) {
  starts.forEach((start, id) => {
    const next = {x:Math.max(0,start.x + dx), y:Math.max(0,start.y + dy)};
    positions['pet:' + id] = next;
    const element = petCardsLayer?.querySelector('.genealogy-pet-card[data-pet-id="' + CSS.escape(id) + '"]');
    if (element) {
      element.style.left = (next.x + PAD) + 'px';
      element.style.top = (next.y + PAD) + 'px';
    }
  });
}
function markSelectedPetDragging(starts, active) {
  starts.forEach((_,id) =>
    petCardsLayer?.querySelector('.genealogy-pet-card[data-pet-id="' + CSS.escape(id) + '"]')
      ?.classList.toggle('dragging', active)
  );
}

function getUnpositionedPetPositions(fam) {
  const saved = fam?.manualPositions || {};
  const positions = {};
  (getSceneLayout()?.petLayout?.cards || []).forEach(card => {
    const key = 'pet:' + card.key;
    if (Object.prototype.hasOwnProperty.call(saved,key)) return;
    positions[key] = {x:card.x,y:card.y};
  });
  return positions;
}

// 保留目前寵物的獨立位置，不讓移動模擬市民時因家庭錨點重新計算而連帶移動。
function freezeUnpositionedPetCards(fam) {
  const positions = getUnpositionedPetPositions(fam);
  return Object.keys(positions).length
    ? genealogyStore.setNodePositions(fam.id,positions)
    : null;
}

function seedVisibleScenePositionsForFreeLayout(fam) {
  const scene =
    getSceneLayout();

  if (!fam || !scene?.pos) {
    return null;
  }

  const seeded =
    cloneManualPositionMap(
      fam.manualPositions
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

  Object.assign(seeded,getUnpositionedPetPositions(fam));

  return genealogyStore.setFamilyLayoutState(
    fam.id,
    
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
    captureLayoutHistoryState(fam);

  const activateFreeLayout =
    !fam.freeLayout;

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
      ? seedVisibleScenePositionsForFreeLayout(fam)
      : null;

  const positionMutation =
    genealogyStore.setNodePositions(
      fam.id,
      
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
    before,
    after:captureLayoutHistoryState(fam)
  });

  return true;
}

// 精細移動沿用既有自由排列、選取及位置保存；鍵盤長按合併歷史。
function nudgeSelectedCanvasCards(event) {
  const directions = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  const direction = directions[event.key], fam = currentFamily(), layout = getSceneLayout();
  if (!direction || !fam || !layout || !genealogyScene.isFreeLayoutActive(fam) || arrangeTool !== 'select') return false;
  const mode = viewMode, saved = fam.manualPositions || {}, positions = {};
  const step = event.shiftKey ? 10 : 1, dx = direction[0]*step, dy = direction[1]*step;
  [...selectedNodeIds].forEach(id => {
    const from = saved[id] || layout.pos?.get(id);
    if (from) positions[id] = {x:Math.max(0,from.x+dx),y:Math.max(0,from.y+dy)};
  });
  (layout.petLayout?.cards || []).forEach(card => {
    if (!selectedPetIds.has(card.key)) return;
    const key='pet:'+card.key, from=saved[key] || card;
    positions[key]={x:Math.max(0,from.x+dx),y:Math.max(0,from.y+dy)};
  });
  if (!Object.keys(positions).length) return false;
  const changed = Object.entries(positions).some(([id,pos]) => {
    const from=saved[id] || (id.startsWith('pet:')
      ? layout.petLayout?.cards?.find(card => 'pet:'+card.key === id) : layout.pos?.get(id));
    return from && (from.x !== pos.x || from.y !== pos.y);
  });
  if (!changed) return false;
  const before=captureLayoutHistoryState(fam);
  const mutation=genealogyStore.mergeResults(freezeUnpositionedPetCards(fam),genealogyStore.setNodePositions(fam.id,positions));
  applyGenealogyMutation(mutation);
  dragHistory.push({type:'card-layout',keyboardKey:event.key,familyId:fam.id,before,after:captureLayoutHistoryState(fam)});
  syncNodeSelectionClasses();
  genealogyScene?.resizeStageToContent?.();
  return true;
}

function deleteSelectedCanvasCards() {
  const fam = currentFamily();
  const data = currentGenealogyData();
  const layout = getSceneLayout();
  if (!fam || !data || !layout) return false;

  // 只刪除畫布實際選取且目前可見的卡片，與排列模式 / 工具無關。
  const visibleSimIds = new Set(layout.visibleIds || []);
  const simIds = [...selectedNodeIds].filter(id =>
    visibleSimIds.has(id) && !!data.sims?.[id]
  );
  const petCards = new Map(
    (layout.petLayout?.cards || []).map(card => [card.key, card])
  );
  const petIds = [...new Set([...selectedPetIds].map(id => {
    const pet = petCards.get(id)?.pet;
    return String(pet?.gameData?.simId || pet?.id || '');
  }).filter(Boolean))];
  if (!simIds.length && !petIds.length) {
    syncNodeSelectionClasses();
    return false;
  }

  // 無法建立快照時直接取消；刪除後若歷史記錄失敗，會恢復快照。
  const before = captureCanonicalHistory();
  if (!before) return false;
  let mutation = null;
  simIds.forEach(id => {
    mutation = genealogyStore.mergeResults(mutation, purgeSimData(id));
  });
  petIds.forEach(id => {
    mutation = genealogyStore.mergeResults(mutation, genealogyStore.deletePet(id));
  });
  if (!mutation?.dataChanged) return false;
  clearNodeSelection();
  applyGenealogyMutation(mutation);
  if (!recordCanonicalHistory(before)) return false;
  scheduleGC();
  uiToast(uiText('已刪除選取的市民 / 寵物，可使用 Ctrl + Z 復原。'));
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
      <button class="person-card-menu-action danger" type="button" data-person-card-menu-action="remove-selected">${iconSvg('person-dash')}<span>${esc(uiText('移出所選模擬市民'))}</span></button>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="clear-selection">${iconSvg('x-lg')}<span>${esc(uiText('清除選取'))}</span></button>
    `;

    personCardMenu.dataset.simId = simId;
    personCardMenu.dataset.cardMode = viewMode;
    personCardMenu.classList.add('show');
    personCardMenu.setAttribute('aria-hidden', 'false');
    positionPersonCardMenu(clientX, clientY);
    return;
  }

  const fieldRows = [
    ['name','姓名'], ['gender','性別'], ['lifeStage','年齡階段'], ['age','年齡'], ['birthday','生日'],
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
    <button class="person-card-menu-action" type="button" data-person-card-menu-action="perspective">${iconSvg('scan-eye')}<span>${esc(relationshipPerspectiveActionText(sim, relationshipPerspectiveSimId === String(sim.id)))}</span></button>
    ${isMulti ? `
      <div class="person-card-menu-divider"></div>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="reset-selected">${iconSvg('arrow-counterclockwise')}<span>${esc(uiText('重設所選位置'))}</span></button>
      <button class="person-card-menu-action danger" type="button" data-person-card-menu-action="remove-selected">${iconSvg('person-dash')}<span>${esc(uiText('移出所選模擬市民'))}</span></button>
      <button class="person-card-menu-action" type="button" data-person-card-menu-action="clear-selection">${iconSvg('x-lg')}<span>${esc(uiText('清除選取'))}</span></button>
    ` : ''}
    <div class="person-card-menu-divider"></div>
    <div class="person-card-menu-section-title">${esc(uiText(isEditCard ? '編輯模式顯示內容' : '檢視模式顯示內容'))}</div>
    <div class="person-card-menu-grid">
      <label class="person-card-menu-check fixed"><input type="checkbox" checked disabled><span>${esc(uiText('頭像'))}</span></label>
      ${fieldRows}
    </div>
    ${appearanceSection}
    <div class="person-card-menu-note">${esc(uiText(isEditCard ? '只套用於編輯模式市民卡片' : '只套用於檢視模式市民卡片'))}</div>`;

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
            fam.manualPositions,
            id
          )
        );

    if (!ids.length) {
      closePersonCardMenu();
      return;
    }

    const before =
      captureLayoutHistoryState(fam);

    const mutation =
      genealogyStore.removeNodePositions(
        fam.id,
        
        ids
      );

    applyGenealogyMutation(mutation);
    syncNodeSelectionClasses();
    genealogyScene?.resizeStageToContent?.();

    dragHistory.push({
      type:'card-layout',
      familyId:fam.id,
      before,
      after:captureLayoutHistoryState(fam)
    });

    closePersonCardMenu();
    return;
  }
  if (action === 'remove-selected') {
    const fam = currentFamily();
    const ids = [...selectedNodeIds].filter(id => fam.memberIds.includes(id));
    if (!ids.length) { closePersonCardMenu(); return; }
    const ok = await uiConfirm(`${uiText('要將選取的模擬市民移出目前家族嗎？')}\n${uiText('模擬市民資料會保留，之後仍可重新加入家族。')}`, {
      title: uiText('移出所選模擬市民'), kind: 'danger', confirmText: uiText('移出家族')
    });
    if (!ok) return;
    const before=captureCanonicalHistory();
  if (!before) return;
    const mutation =
      genealogyStore.removeFamilyMembers(
        fam.id,
        ids
      );

    clearNodeSelection();
    applyGenealogyMutation(mutation);
    recordCanonicalHistory(before);
    closePersonCardMenu();
  }
}

personCardMenu?.addEventListener('click', e => {
  const petAction = e.target.closest('[data-pet-card-menu-action]');
  if (petAction) {
    e.preventDefault();
    e.stopPropagation();
    if (!petAction.disabled) handlePetCardMenuAction(petAction.dataset.petCardMenuAction,personCardMenu.dataset.petId);
    return;
  }
  const actionBtn = e.target.closest('[data-person-card-menu-action]');
  if (actionBtn) {
    e.preventDefault(); e.stopPropagation();
    handlePersonCardMenuAction(actionBtn.dataset.personCardMenuAction, personCardMenu.dataset.simId);
  }
});
personCardMenu?.addEventListener('change', e => {
  if (e.target?.name === 'petCardAppearance') {
    const mutation = genealogyStore.setPetCardAppearance(e.target.value);
    applyGenealogyMutation(mutation,{refreshFamily:false});
    positionPersonCardMenu(
      parseFloat(personCardMenu.style.left) || 0,
      parseFloat(personCardMenu.style.top) || 0
    );
    return;
  }
  const petField = e.target?.dataset?.petCardField;
  if (petField && PET_CARD_FIELD_KEYS.includes(petField)) {
    const mode = personCardMenu.dataset.cardMode === 'edit' ? 'edit' : 'view';
    const mutation = genealogyStore.setPetCardField(mode,petField,!!e.target.checked);
    applyGenealogyMutation(mutation,{refreshFamily:false});
    positionPersonCardMenu(
      parseFloat(personCardMenu.style.left) || 0,
      parseFloat(personCardMenu.style.top) || 0
    );
    return;
  }

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
  // 切換排列模式時保留目前的多選狀態。
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
function hasBlockingGenealogyDialog() {
  return MODAL_LIFECYCLE_STACK.some(entry=>entry.dialog?.classList.contains('show')) ||
    !!document.querySelector('[id$="Dialog"].show, .ui-dialog-mask.show, #fileOperationStatus.show');
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
  const nextPets = new Set(marqueeState.basePetSelection || []);
  petCardsLayer?.querySelectorAll('.genealogy-pet-card[data-pet-id]').forEach(el => {
    const r = el.getBoundingClientRect();
    const intersects = r.right >= leftClient && r.left <= rightClient && r.bottom >= topClient && r.top <= bottomClient;
    if (intersects) nextPets.add(el.dataset.petId);
  });
  selectedNodeIds.clear();
  next.forEach(id => selectedNodeIds.add(id));
  selectedPetIds.clear();
  nextPets.forEach(id => selectedPetIds.add(id));
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
const TOUCH_DOUBLE_TAP_MS = 320;
const TOUCH_DOUBLE_TAP_DISTANCE_PX = 28;
const activeTouchPointers = new Map();
const touchCardActivationSuppressed = new Set();

let touchPinchGeometry = null;
let touchGestureFrame = 0;
let pendingTouchGesture = null;

// 每個影格套用最後一筆雙指位置，保留真實倍率與雙指中心的平移。
function applyPendingTouchGesture() {
  touchGestureFrame = 0;
  const nextGeometry = pendingTouchGesture;
  pendingTouchGesture = null;
  if (!nextGeometry || !touchPinchGeometry || activeTouchPointers.size < 2) return;
  genealogyViewport.transformGesture?.(
    touchPinchGeometry.centerX,
    touchPinchGeometry.centerY,
    nextGeometry.centerX,
    nextGeometry.centerY,
    nextGeometry.distance / touchPinchGeometry.distance
  );
  touchPinchGeometry = nextGeometry;
}

function flushTouchGesture() {
  if (touchGestureFrame) {
    cancelAnimationFrame(touchGestureFrame);
    touchGestureFrame = 0;
  }
  applyPendingTouchGesture();
}
let touchLongPressTimer = 0;
let touchLongPressPointerId = null;
let lastTouchCanvasTap = null;

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

function handleTouchCanvasTapStart(
  point
) {
  if (
    !point ||
    (
      point.kind !== 'canvas-pan' &&
      point.kind !== 'canvas-select'
    )
  ) {
    lastTouchCanvasTap = null;
    return false;
  }

  const now =
    performance.now();

  const previous =
    lastTouchCanvasTap;

  const isDoubleTap =
    !!previous &&
    now - previous.time <=
      TOUCH_DOUBLE_TAP_MS &&
    Math.hypot(
      point.clientX - previous.clientX,
      point.clientY - previous.clientY
    ) <=
      TOUCH_DOUBLE_TAP_DISTANCE_PX;

  if (!isDoubleTap) {
    lastTouchCanvasTap = {
      time:now,
      clientX:point.clientX,
      clientY:point.clientY
    };
    return false;
  }

  lastTouchCanvasTap = null;
  point.blocked = true;

  finishMarquee();
  genealogyViewport.cancelPan();
  genealogyViewport.fit();

  return true;
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

  // 寵物卡是 button，但仍屬畫布卡片；與模擬市民共用觸控長按選單。
  const petCard = target?.closest?.('.genealogy-pet-card[data-pet-id]');
  if (petCard) {
    return {kind:'pet-card',simId:null,petId:petCard.dataset.petId};
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
        point.kind === 'card' || point.kind === 'pet-card'
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
          !(current.simId || current.petId)
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

        if (current.kind === 'pet-card') {
          const entry = findCanvasPetEntry(current.petId);
          if (!entry) return;
          if (
            fam && genealogyScene.isFreeLayoutActive(fam) &&
            arrangeTool === 'select' && !selectedPetIds.has(current.petId)
          ) {
            selectedPetIds.clear();
            selectedPetIds.add(current.petId);
            syncNodeSelectionClasses();
          }
          renderPetCardMenu(entry,current.clientX,current.clientY);
          return;
        }

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
    simId:descriptor.simId,
    petId:descriptor.petId || null
  };

  if (
    point.kind !== 'canvas-pan' &&
    point.kind !== 'canvas-select'
  ) {
    lastTouchCanvasTap = null;
  }

  activeTouchPointers.set(
    event.pointerId,
    point
  );

  if (
    activeTouchPointers.size === 1
  ) {
    if (
      handleTouchCanvasTapStart(
        point
      )
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (
      (point.kind === 'card' || point.kind === 'pet-card')
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

  flushTouchGesture();
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
      point.kind === 'canvas-pan' ||
      point.kind === 'canvas-select'
    ) {
      lastTouchCanvasTap = null;
    }

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
      pendingTouchGesture = nextGeometry;
      if (!touchGestureFrame) {
        touchGestureFrame = requestAnimationFrame(applyPendingTouchGesture);
      }
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
        baseSelection:new Set(),
        basePetSelection:new Set()
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
  if (wasPinching) flushTouchGesture();

  if (
    event.type === 'pointercancel' &&
    (point.kind === 'card' || point.kind === 'pet-card')
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

  if (wasPinching) {
    lastTouchCanvasTap = null;
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
  const onPetCard = !!e.target.closest('.genealogy-pet-card');
  const onLabel = !!e.target.closest('.edge-label');
  const fam = currentFamily();
  const isFree = genealogyScene.isFreeLayoutActive(fam);

  // 自由排列的框選會 preventDefault()，可能吃掉瀏覽器原生 dblclick。
  // 第二次按下空白畫布時直接執行置中，確保所有排列模式都一致。
  if (
    e.detail >= 2 &&
    !onNode &&
    !onLabel &&
    !onPetCard
  ) {
    e.preventDefault();
    finishMarquee();
    genealogyViewport.cancelPan();
    genealogyViewport.fit();
    return;
  }

  if (arrangeTool === 'select' && !spacePanHeld && !onNode && !onLabel && !onPetCard) {
    e.preventDefault();
    marqueeState = {
      startX: e.clientX,
      startY: e.clientY,
      baseSelection: e.shiftKey ? new Set(selectedNodeIds) : new Set(),
      basePetSelection: e.shiftKey ? new Set(selectedPetIds) : new Set()
    };
    if (!e.shiftKey) clearNodeSelection();
    updateMarquee(e.clientX, e.clientY);
    return;
  }

  if (onNode && !isPanGestureActive()) return;
  if (onPetCard || onLabel) return;
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
  if (e.target.closest('.genealogy-pet-card')) return;
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

// ========【智慧對齊與等距吸附】 邊緣、中心及水平／垂直等距吸附 ========
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

// ========【Interaction Snap Orchestration】 Scene 提供 geometry，Interaction 執行對齊 / 等距 / 關係吸附 ========
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
// ========【拖曳 Geometry Snapshot】 PointerMove 沿用手勢起始時的幾何快照 ========
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
  // 只讓主滑鼠鍵進入市民卡片的點擊／拖曳流程。
  // 右鍵必須完整保留給 contextmenu，避免自由排列模式的 preventDefault() 吃掉右鍵選單。
  if (e.button !== 0) return;
  const el = e.target.closest('.person-card');
  if (!el) return;
  const id = el.dataset.id;
  const fam = currentFamily();
  const isFree = genealogyScene.isFreeLayoutActive(fam);

  // 預設拖曳工具也可 Shift + 點擊選取卡片，不影響一般點擊開啟資料。
  if (e.shiftKey && arrangeTool !== 'select') {
    e.preventDefault();
    e.stopPropagation();
    // 指標選取只更新選取狀態，不主動移動鍵盤焦點。
    if (selectedNodeIds.has(id)) selectedNodeIds.delete(id);
    else selectedNodeIds.add(id);
    syncNodeSelectionClasses();
    return;
  }
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

  // 拖曳工具：按住空白處平移畫布；按住市民卡片則直接移動該卡片。
  // 選取工具才負責多選 / 框選 / 整組拖曳，單張卡片移動不需要先進入選取狀態。
  if (isFree && arrangeTool === 'pan') {
    e.preventDefault();
    e.stopPropagation();

    const dragMode = viewMode;
    const manualPositions = fam.manualPositions;
    const initialPos = manualPositions[id] || getSceneLayout()?.pos?.get(id) || null;
    const startPos = initialPos ? { x:initialPos.x, y:initialPos.y } : null;
    const sx = e.clientX, sy = e.clientY;
    const beforeLayoutState = captureLayoutHistoryState(fam);
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
        dragMutation = genealogyStore.mergeResults(
          dragMutation, freezeUnpositionedPetCards(fam)
        );
        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setNodePosition(
              fam.id,
              
              id,
              previewPosition
            )
          );

        dragHistory.push({
          type:'card-layout',
          familyId:fam.id,
          before:beforeLayoutState,
          after:captureLayoutHistoryState(fam)
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

  // 自由排列 + 選取工具：左鍵負責單選 / Shift 多選 / 拖曳已選模擬市民。
  if (arrangeTool === 'select') {
    e.preventDefault();
    e.stopPropagation();
    // 指標選取只更新選取狀態，不主動移動鍵盤焦點。

    const shift =
      e.pointerType === 'touch'
        ? true
        : e.shiftKey;
    const wasSelected = selectedNodeIds.has(id);

    if (!shift && !wasSelected) {
      selectedPetIds.clear();
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
              fam.manualPositions[sid] ||
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

    const startPetPositions = getSelectedPetDragPositions(fam);
    const primaryStart =
      startPositions.get(id);

    const sx = e.clientX;
    const sy = e.clientY;

    const beforeLayoutState =
      captureLayoutHistoryState(fam);

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

        markSelectedPetDragging(startPetPositions, true);
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

      previewSelectedPetDrag(startPetPositions, deltaX, deltaY, nextPositions);
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
      markSelectedPetDragging(startPetPositions, false);

      if (moved && previewPositions && ev.type !== 'pointercancel' && !isTouchCardActivationSuppressed(ev)) {
        dragMutation = genealogyStore.mergeResults(
          dragMutation, freezeUnpositionedPetCards(fam)
        );
        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setNodePositions(
              fam.id,
              
              previewPositions
            )
          );

        dragHistory.push({
          type:'card-layout',
          familyId:fam.id,
          before:beforeLayoutState,
          after:captureLayoutHistoryState(fam)
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

  // 自動排列沿用既有邏輯：拖動模擬市民超過門檻後切換到自由排列。
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
    captureLayoutHistoryState(fam);

  const manualPositions =
    fam.manualPositions;

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
      if (!fam.freeLayout) {
        const seededPositions = {};

        getSceneLayout().pos.forEach(
          (p, sid) => {
            seededPositions[sid] = {
              x:p.x,
              y:p.y
            };
          }
        );
        Object.assign(seededPositions,getUnpositionedPetPositions(fam));

        dragMutation =
          genealogyStore.mergeResults(
            dragMutation,
            genealogyStore.setFamilyLayoutState(
              fam.id,
              
              {
                freeLayout:true,
                manualPositions:seededPositions
              }
            )
          );

        // 單一卡片拖曳只啟用自由排列，不應強制切換成選取工具。
        setArrangeTool('pan');
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
      dragMutation = genealogyStore.mergeResults(
        dragMutation, freezeUnpositionedPetCards(fam)
      );
      dragMutation =
        genealogyStore.mergeResults(
          dragMutation,
          genealogyStore.setNodePosition(
            fam.id,
            
            id,
            previewPosition
          )
        );

      const afterLayoutState =
        captureLayoutHistoryState(fam);

      dragHistory.push({
        type:'card-layout',
        familyId:fam.id,
        before:beforeLayoutState,
        after:afterLayoutState
      });

      // 放開即結束單一卡片操作，不把該模擬市民留在選取狀態。
      clearNodeSelection();

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
    $('autoLayoutToggleButton');

  const lockButton =
    $('canvasLockToggleButton');

  const resetButton =
    $('resetCanvasLayoutButton');

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
$('autoLayoutToggleButton').onclick = () => {
  const fam =
    currentFamily();
const before =
    captureLayoutHistoryState(fam);

  let mutation;

  if (!fam.freeLayout) {
    const savedManual =
      fam.manualPositions || {};

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
          
          {
            freeLayout:true
          }
        );
    } else {
      // 第一次進入自由排列：以目前畫面位置建立 snapshot。
      mutation =
        seedVisibleScenePositionsForFreeLayout(fam);
    }

    arrangeTool =
      'pan';
  } else {
    // 自動排列只切換顯示來源；manualPositions 必須保留。
    // 真正刪除手動成果只有「重設位置」能做。
    mutation =
      genealogyStore.setFamilyLayoutState(
        fam.id,
        
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
    before,
    after:captureLayoutHistoryState(fam)
  });
};

$('canvasLockToggleButton').onclick = () => {
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

$('resetCanvasLayoutButton').onclick = async () => {
  const fam = currentFamily();
  if (!fam) return;
  if (!await uiConfirm(
    uiText('要重設這個家族的卡片位置嗎？所有手動調整的位置將被清除，卡片會重新自動排列。'),
    { title:'重設卡片位置', kind:'danger', confirmText:'重設位置' }
  )) return;
  const before = captureLayoutHistoryState(fam);
  const mutation = genealogyStore.setFamilyLayoutState(fam.id, {
    freeLayout:false,
    manualPositions:{}
  });
  clearNodeSelection();
  applyGenealogyMutation(mutation);
  syncLayoutModeControls();
  dragHistory.push({
    type:'card-layout', familyId:fam.id,
    before, after:captureLayoutHistoryState(fam)
  });
  requestAnimationFrame(() => genealogyViewport.fit());
};

relationshipPerspectiveBtn?.addEventListener(
  'click',
  () => {
    setRelationshipPerspective(null);
  }
);

$('relationshipLabelsVisibilityToggle').onclick = () => {
  showRelLabels = !showRelLabels;
  const btn = $('relationshipLabelsVisibilityToggle');
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
  // 手動上傳的封面優先；自動四格拼貼加入有關聯的寵物。
  const data=currentGenealogyData();
  const members=[...new Set((fam.memberIds||[]).map(String))].map(id=>data.sims[id]).filter(Boolean);
  const householdId=fam.gameData?.householdId==null?'':String(fam.gameData.householdId);
  const pets=new Map();
  const addPet=(pet,ownerId,index)=>{
    if(!pet||typeof pet!=='object')return;
    const id=String(pet.gameData?.simId||pet.id||ownerId+':'+index);
    if(!pets.has(id)||(!pets.get(id).avatar&&pet.avatar))pets.set(id,pet);
  };
  members.forEach(sim=>(sim.pets||[]).forEach((pet,i)=>addPet(pet,String(sim.id),i)));
  if(householdId)(data.meta?.unassignedPets||[]).forEach((pet,i)=>{
    if(String(pet?.gameData?.householdId??'')===householdId)addPet(pet,'unassigned',i);
  });
  const availablePets=[...pets.values()].sort((a,b)=>Number(!!b.avatar)-Number(!!a.avatar));
  const petSlots=availablePets.length?Math.min(availablePets.length,Math.max(1,4-members.length)):0;
  const collageMembers=members.slice(0,4-petSlots);
  const collagePets=availablePets.slice(0,4-collageMembers.length);
  collage.innerHTML=collageMembers.map(sim=>{
    const avatar=framedAvatarImageHTML(sim.avatar,sim.avatarFrame);
    return '<div class="family-cover-collage-item">'+(avatar||esc((displayDataText(sim.name,sim)||'?').charAt(0)))+'</div>';
  }).join('')+collagePets.map(pet=>
    '<div class="family-cover-collage-item family-cover-collage-pet" title="'+esc(displayDataText(pet.name)||uiText('寵物'))+'">'+petAvatarWithFallbackHTML(pet)+'</div>'
  ).join('');
  empty.style.display=(collageMembers.length||collagePets.length)?'none':'';
}


// ========【家族成員世代排序】 只改側邊欄顯示順序，不改寫家族成員資料 ========
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
  renderFamilyMemberList(currentDisplayedFamily());
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
    const startBtn = $('removeFamilyMembersButton');
    const addMenu = $('familyMemberAddMenu');
    const toolbar = $('familyMemberRemoveToolbar');
    const countEl = $('familyMemberRemoveCount');
    const confirmBtn = $('familyMemberRemoveConfirmBtn');
    const count = familyMemberOperationState.selection.size;

    if (startBtn) {
      startBtn.hidden = familyMemberOperationState.removeMode;
      startBtn.disabled = !(currentFamily()?.memberIds || []).length;
    }
    if (addMenu) addMenu.hidden = familyMemberOperationState.removeMode;
    if (toolbar) toolbar.hidden = !familyMemberOperationState.removeMode;
    if (countEl) countEl.textContent = `已選 ${count} 位`;

    if (confirmBtn) {
      confirmBtn.disabled = count === 0;
      confirmBtn.textContent = uiText(`移出 ${count} 位`);
    }
  },

  setRemoveMode(enabled, selectedIds = []) {
    familyMemberOperationState.removeMode = !!enabled;
    familyMemberOperationState.selection.clear();

    if (familyMemberOperationState.removeMode) {
      const editableIds = new Set((currentFamily()?.memberIds || []).map(String));
      selectedIds.forEach(id => {
        if (id && editableIds.has(String(id)) && currentGenealogyData().sims[id]) {
          familyMemberOperationState.selection.add(String(id));
        }
      });
    }

    if (typeof closeAppMenus === 'function') closeAppMenus();
    renderFamilyMemberList(currentDisplayedFamily());
  },

  toggleSelection(simId) {
    if (!familyMemberOperationState.removeMode || !simId ||
        !(currentFamily()?.memberIds || []).map(String).includes(String(simId))) return;

    if (familyMemberOperationState.selection.has(simId)) {
      familyMemberOperationState.selection.delete(simId);
    } else {
      familyMemberOperationState.selection.add(simId);
    }

    renderFamilyMemberList(currentDisplayedFamily());
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
      `${uiText('要將選取的模擬市民移出目前家族嗎？')}\n${uiText('模擬市民資料會保留，之後仍可重新加入家族。')}`,
      {
        title:uiText('移出所選模擬市民'),
        kind:'danger',
        confirmText:uiText('移出家族')
      }
    );

    if (!confirmed) return;

    const before = captureCanonicalHistory();
    if (!before) return;
    const mutation = genealogyStore.removeFamilyMembers(
      family.id,
      ids
    );

    resetFamilyMemberOperations();
    applyGenealogyMutation(mutation);
    recordCanonicalHistory(before);
    requestAnimationFrame(() => genealogyViewport.fit());
  }
};

function renderFamilyMemberList(fam) {
  const list = $('familyMemberList');
  if (!list) return;

  // 延伸族譜可顯示姻親等關聯模擬市民，但「移出目前家族」只能修改真正的成員。
  // 批量模式保留完整族譜清單，僅讓真正屬於目前家族的市民勾選移出。
  let members =
    (fam?.memberIds || [])
      .map(id => currentGenealogyData().sims[id])
      .filter(Boolean);

  updateFamilyGenerationSortControl();

  if (!members.length) {
    resetFamilyMemberOperations();
    familyMemberController.syncRemoveToolbar();
    list.innerHTML = `<div class="family-member-empty">${esc(uiText('目前家族還沒有成員'))}</div>`;
    return;
  }

  list.classList.toggle('is-remove-mode', familyMemberOperationState.removeMode);

  const currentIds =
    new Set(members.map(sim => sim.id));
  const editableIds =
    new Set((currentFamily()?.memberIds || []).map(String));

  [...familyMemberOperationState.selection].forEach(id => {
    if (!currentIds.has(id) || !editableIds.has(id)) {
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

    // 無法判定世代的模擬市民固定放在清單最後，
    // 升序 / 降序都不會把未連入族譜的模擬市民推到最前面。
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
    const editable = editableIds.has(String(sim.id));
    const unavailable = familyMemberOperationState.removeMode && !editable;
    const unavailableHint = uiText('此模擬市民不屬於目前家族，無法移出');

    return `<div class="family-member-row${familyMemberOperationState.removeMode && editable ? ' remove-mode' : ''}${unavailable ? ' remove-unavailable' : ''}${selected ? ' remove-selected' : ''}" data-family-sim-id="${esc(sim.id)}" ${unavailable ? `title="${esc(unavailableHint)}"` : ''} tabindex="0">
      <div class="family-member-avatar-wrap">
        <div class="family-member-avatar">${framedAvatarImageHTML(sim.avatar, sim.avatarFrame) || esc((displayDataText(sim.name,sim)||'?').charAt(0))}</div>
        ${editable ? `<button class="family-member-remove-select${selected ? ' selected' : ''}" type="button" data-family-member-remove-select="${esc(sim.id)}" aria-pressed="${selected ? 'true' : 'false'}" title="${esc(uiText(selected ? '取消選取' : '批量移除'))}">
          ${iconSvg(selected ? 'check-lg' : 'trash3')}
        </button>` : unavailable ? `<span class="family-member-remove-unavailable" title="${esc(unavailableHint)}" aria-label="${esc(unavailableHint)}">${iconSvg('lock')}</span>` : ''}
      </div>
      <div class="family-member-copy"><div class="family-member-name">${esc(displayDataText(sim.name,sim))}</div><div class="family-member-meta">${esc(meta)}</div></div>
      <div class="ui-menu family-member-menu">
        <button class="family-member-more ui-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="${esc(uiText('更多'))}">${iconSvg('three-dots')}</button>
        <div class="ui-menu-popover family-member-popover" role="menu">
          <button class="ui-menu-item" type="button" role="menuitem" data-family-member-action="view" data-family-member-id="${esc(sim.id)}">${iconSvg('person-vcard')}<span>${esc(uiText('查看個人檔案'))}</span></button>
          <button class="ui-menu-item" type="button" role="menuitem" data-family-member-action="edit" data-family-member-id="${esc(sim.id)}">${iconSvg('pencil-square')}<span>${esc(uiText('編輯模擬市民'))}</span></button>
          <button class="ui-menu-item" type="button" role="menuitem" data-family-member-action="locate" data-family-member-id="${esc(sim.id)}">${iconSvg('crosshair')}<span>${esc(uiText('在族譜中定位'))}</span></button>
          ${editable ? `<div class="ui-menu-divider"></div>
          <button class="ui-menu-item danger" type="button" role="menuitem" data-family-member-action="remove" data-family-member-id="${esc(sim.id)}">${iconSvg('person-dash')}<span>${esc(uiText('移出目前家族'))}</span></button>` : ''}
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
  const viewFamily = currentDisplayedFamily() || fam;
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

  // 合照使用真正的 Household 成員；成員清單仍與目前族譜畫布範圍一致。
  renderFamilyCover(fam); renderFamilyMemberList(viewFamily);
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
    const result = await assetStore.optimizeForUsage(validateSupportedImageFile(file), 'background');
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

$('createFamilyButton').onclick = async () => {
  const name = await uiPrompt('請為新家族取個名稱。', '新家族', { title: '新增家族', confirmText: '新增' });
  if (name === null) return;
  const fam = {
    id:uid('fam'), name:name.trim()||'新家族',
    memberIds:[], bio:'', coverImage:null,
    freeLayout:false,
    manualPositions:{}, locked: false
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
$('deleteFamilyButton').onclick = async () => {
  if (currentGenealogyData().families.length <= 1) { uiAlert('需要保留至少一個家族，才能繼續使用族譜畫布。', { title: '無法刪除家族' }); return; }
  const fam = currentFamily();
  if (!await uiConfirm(`要刪除「${displayDataText(fam.name, fam)}」家族嗎？\n家族中的模擬市民不會被刪除，之後仍可加入其他家族。`, { title: '刪除家族', kind: 'danger', confirmText: '刪除家族' })) return;
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

// ========【共用 UI Controller】 單選 / 搜尋 / 多選 / 可輸入建議由獨立 UI 模組負責 ========
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
    if (petEditorState.avatarSource === 'game') petEditorState.gameAvatarFrame = normalized;
    else petEditorState.customAvatarFrame = normalized;
    petEditorState.avatarFrame=normalized;
    petEditorController.refreshAvatarPreview();
  }else{
    if(simEditorState.avatarSource==='game'){
      simEditorState.gameAvatarFrame=normalized;
    }else{
      simEditorState.customAvatarFrame=normalized;
    }

    simEditorState.avatarFrame=normalized;
    personEditor.renderAvatarPreview();
    personEditor.renderInfoPreviewIfActive();
  }
}

// 工作區及裁切框尺寸在開啟時快取；縮放只重新計算數值，不重讀 DOM。
function measureAvatarCropGeometry(){
  if(avatarCropGeometry)return avatarCropGeometry;
  const workspace=$('avatarCropWorkspace');
  const windowEl=$('avatarCropWindow');
  if(!workspace||!windowEl||
    !avatarCropNaturalSize.width||!avatarCropNaturalSize.height)return null;
  const workspaceRect=workspace.getBoundingClientRect();
  const cropRect=windowEl.getBoundingClientRect();
  if(!workspaceRect.width||!workspaceRect.height||
    !cropRect.width||!cropRect.height)return null;
  const scale=Math.max(
    cropRect.width/avatarCropNaturalSize.width,
    cropRect.height/avatarCropNaturalSize.height
  );
  avatarCropGeometry={
    cropWidth:cropRect.width,
    cropHeight:cropRect.height,
    cropCenterX:cropRect.left-workspaceRect.left+cropRect.width/2,
    cropCenterY:cropRect.top-workspaceRect.top+cropRect.height/2,
    baseImageWidth:avatarCropNaturalSize.width*scale,
    baseImageHeight:avatarCropNaturalSize.height*scale
  };
  return avatarCropGeometry;
}

function avatarCropBounds(){
  const geometry=measureAvatarCropGeometry();
  if(!geometry)return null;
  const zoom=Math.max(1,Number(avatarCropDraft.zoom)||1);
  const imageWidth=geometry.baseImageWidth*zoom;
  const imageHeight=geometry.baseImageHeight*zoom;
  const minX=Math.min(.5,geometry.cropWidth/(2*imageWidth));
  const minY=Math.min(.5,geometry.cropHeight/(2*imageHeight));
  return{
    ...geometry,
    imageWidth,
    imageHeight,
    minX,
    maxX:Math.max(.5,1-minX),
    minY,
    maxY:Math.max(.5,1-minY)
  };
}

function clampAvatarCropDraft(bounds=avatarCropBounds()){
  if(!bounds)return avatarCropDraft;
  avatarCropDraft=normalizeAvatarFrame({
    ...avatarCropDraft,
    x:Math.min(bounds.maxX,Math.max(bounds.minX,avatarCropDraft.x)),
    y:Math.min(bounds.maxY,Math.max(bounds.minY,avatarCropDraft.y))
  });
  return avatarCropDraft;
}

function renderAvatarCropPreview(){
  const image=$('avatarCropImage');
  if(!image)return;
  if(avatarCropUrl&&image.src!==avatarCropUrl)image.src=avatarCropUrl;

  const bounds=avatarCropBounds();
  if(!bounds)return;
  clampAvatarCropDraft(bounds);
  avatarCropRenderMetrics=bounds;

  // 維持取景幾何，透過 GPU 合成層 transform 更新圖片位置。
  image.style.width=bounds.baseImageWidth+'px';
  image.style.height=bounds.baseImageHeight+'px';
  const left=bounds.cropCenterX-avatarCropDraft.x*bounds.imageWidth;
  const top=bounds.cropCenterY-avatarCropDraft.y*bounds.imageHeight;
  image.style.transform='translate3d('+left+'px,'+top+'px,0) scale('+avatarCropDraft.zoom+')';

  const zoom=$('avatarCropZoom');
  const output=$('avatarCropZoomValue');
  if(zoom){
    zoom.value=String(avatarCropDraft.zoom);
    syncGenealogyRangeFill(zoom);
  }
  if(output)output.textContent=Math.round(avatarCropDraft.zoom*100)+'%';
}

// 高頻拖曳／滾輪只繪製每個影格最後的狀態；放開按鈕即時套用最後位置。
function scheduleAvatarCropRender(){
  if(avatarCropRenderFrame||!avatarCropTarget)return;
  avatarCropRenderFrame=requestAnimationFrame(()=>{
    avatarCropRenderFrame=0;
    if(avatarCropTarget)renderAvatarCropPreview();
  });
}

function flushAvatarCropRender(){
  if(avatarCropRenderFrame){
    cancelAnimationFrame(avatarCropRenderFrame);
    avatarCropRenderFrame=0;
  }
  renderAvatarCropPreview();
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
  avatarCropGeometry=null;
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
  avatarCropGeometry=null;
  if(avatarCropRenderFrame){
    cancelAnimationFrame(avatarCropRenderFrame);
    avatarCropRenderFrame=0;
  }
  $('avatarCropWorkspace')?.classList.remove('dragging');
}

function resetAvatarCropEditor(){
  avatarCropDraft={...DEFAULT_AVATAR_FRAME};
  flushAvatarCropRender();
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

function updateAvatarCropPointer(event){
  const pointer=avatarCropPointer;
  if(!pointer||pointer.pointerId!==event.pointerId)return;
  const dx=event.clientX-pointer.startX;
  const dy=event.clientY-pointer.startY;
  avatarCropDraft=normalizeAvatarFrame({
    ...avatarCropDraft,
    x:pointer.frame.x-dx/pointer.imageWidth,
    y:pointer.frame.y-dy/pointer.imageHeight
  });
  scheduleAvatarCropRender();
}


avatarCropWorkspace?.addEventListener(
  'pointerdown',
  event=>{
    if(!avatarCropTarget)return;

    event.preventDefault();
    avatarCropWorkspace.setPointerCapture?.(
      event.pointerId
    );

    flushAvatarCropRender();

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
  updateAvatarCropPointer
);

const finishAvatarCropPointer=event=>{
  if(
    !avatarCropPointer||
    avatarCropPointer.pointerId!==event.pointerId
  ){
    return;
  }

  if(event.type==='pointerup')updateAvatarCropPointer(event);
  avatarCropPointer=null;
  avatarCropWorkspace?.classList.remove('dragging');
  flushAvatarCropRender();
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

    scheduleAvatarCropRender();
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

    scheduleAvatarCropRender();
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
      avatarCropGeometry=null;
      scheduleAvatarCropRender();
    }
  },80)
);

function buildRelationshipListEntries(simId) {
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
      renderRelationshipAnnotations(simId);
    };
  });
}
function renderRelationshipAnnotations(simId) {
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
    buildRelationshipListEntries(simId)
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

function syncPetEditorActiveAvatar() {
  let source = petEditorState.avatarSource === 'game' ? 'game' : 'custom';
  if (source === 'game' && !petEditorState.gameAvatar && petEditorState.customAvatar) source = 'custom';
  else if (source === 'custom' && !petEditorState.customAvatar && petEditorState.gameAvatar) source = 'game';
  petEditorState.avatarSource = source;
  petEditorState.avatar = source === 'game' ? petEditorState.gameAvatar : petEditorState.customAvatar;
  petEditorState.avatarFrame = normalizeAvatarFrame(
    source === 'game' ? petEditorState.gameAvatarFrame : petEditorState.customAvatarFrame
  );
  return source;
}

const petEditorController = {
  directEntry:null,

  owner() {
    if (this.directEntry) return currentGenealogyData()?.sims?.[this.directEntry.ownerId] || null;
    return simEditorState.simId
      ? currentGenealogyData().sims[simEditorState.simId]
      : null;
  },

  currentPet() {
    if (this.directEntry) return this.directEntry.pet;
    return (
      petEditorState.index >= 0 &&
      editingPets[petEditorState.index]
    )
      ? editingPets[petEditorState.index]
      : null;
  },

  // 偏好沿用模擬市民編輯器的資料與顯示規則；寵物新增時不顯示唯讀分頁。
  switchPreferenceTab(tabName='basic') {
    const tabs=[...petEditorDialog.querySelectorAll('.pet-editor-tab[data-pet-editor-tab]')]
      .filter(tab=>!tab.hidden);
    if(!tabs.some(tab=>tab.dataset.petEditorTab===tabName))tabName='basic';

    tabs.forEach(tab=>{
      const active=tab.dataset.petEditorTab===tabName;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
      tab.tabIndex=active?0:-1;
    });

    petEditorDialog.querySelectorAll('.pet-editor-panel[data-pet-editor-panel]')
      .forEach(panel=>{
        const active=panel.dataset.petEditorPanel===tabName;
        panel.classList.toggle('active',active);
        panel.hidden=!active;
      });

    if(tabName!=='basic'){
      const isAttraction=tabName==='attraction';
      personEditor.renderPreferenceList(
        this.currentPet(),
        tabName,
        isAttraction?'petAttractionPreferenceList':'petGamePreferenceList',
        isAttraction?'petAttractionPreferenceEmpty':'petGamePreferenceEmpty'
      );
    }
    const content=petEditorDialog.querySelector('.pet-editor-content');
    if(content)content.scrollTop=0;
  },

  syncPreferenceTabs(pet) {
    const exists=!!this.currentPet();
    const data=personEditor.preferenceData(pet);
    petEditorDialog.querySelectorAll('.pet-editor-tab[data-pet-editor-tab]')
      .forEach(tab=>{
        if(tab.dataset.petEditorTab==='preferences')tab.hidden=!exists;
        if(tab.dataset.petEditorTab==='attraction')tab.hidden=!exists||!data.attraction.length;
      });
    this.switchPreferenceTab('basic');
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
      notes:'',
      avatar:null,
      avatarFrame:{ ...DEFAULT_AVATAR_FRAME },
      gameAvatar:null, gameAvatarFrame:null,
      customAvatar:null, customAvatarFrame:null,
      avatarSource:'custom'
    };
  },

  ownerEditOpen:false,
  outsideOwnerIds:new Set(),

  eligibleOwnerSims(pet) {
    const db=currentGenealogyData();
    const sims=Object.values(db?.sims || {}).filter(sim=>sim?.id);
    const linkedOwner=db?.sims?.[this.directEntry?.ownerId];
    const householdId=pet?.gameData?.householdId ?? linkedOwner?.gameData?.householdId;
    if(householdId!=null && String(householdId)!=='') {
      return sims.filter(sim=>sim.gameData?.householdId!=null &&
        String(sim.gameData.householdId)===String(householdId));
    }
    const petId=String(pet?.gameData?.simId || pet?.id || '');
    const owners=new Set(sims.filter(sim=>(sim.pets || []).some(item=>
      String(item?.gameData?.simId || item?.id || '')===petId
    )).map(sim=>String(sim.id)));
    const families=db?.families || [];
    const current=currentFamily();
    const family=current && (current.memberIds || []).some(id=>owners.has(String(id)))
      ? current
      : families.find(f=>(f.memberIds || []).some(id=>owners.has(String(id))));
    if(!family)return [];
    const ids=new Set((family.memberIds || []).map(String));
    return sims.filter(sim=>ids.has(String(sim.id)));
  },

  renderOwnerPreview() {
    const preview=$('petOwnerPreview'),select=$('petOwnerIds');
    if(!preview || !select)return;
    const ids=new Set([...select.selectedOptions].map(option=>String(option.value)));
    this.outsideOwnerIds.forEach(id=>ids.add(id));
    const sims=currentGenealogyData()?.sims || {};
    preview.classList.toggle('family-rel-preview-editable',this.ownerEditOpen);
    preview.innerHTML=[...ids].map(id=>{
      const sim=sims[id];
      if(!sim)return '';
      const name=displayDataText(sim.name,sim)||uiText('（未命名）');
      const avatar=framedAvatarImageHTML(sim.avatar,sim.avatarFrame)||esc((name||'?').charAt(0));
      return '<div class="family-rel-preview-row'+(this.ownerEditOpen?' is-editing':'')+'">'+
        (this.ownerEditOpen?'<button class="family-rel-remove" type="button" data-pet-owner-remove="'+esc(id)+'" aria-label="'+esc(uiText('移除飼主'))+'">'+iconSvg('x-lg')+'</button>':'')+
        '<span class="family-rel-person"><span class="family-rel-person-avatar">'+avatar+'</span>'+
        '<span class="family-rel-person-copy"><span class="family-rel-person-name">'+esc(name)+'</span></span></span></div>';
    }).join('')||'<span class="family-rel-empty">—</span>';
    preview.querySelectorAll('[data-pet-owner-remove]').forEach(button=>button.onclick=()=>{
      const id=button.dataset.petOwnerRemove;
      const option=[...select.options].find(item=>String(item.value)===id);
      if(option)option.selected=false;
      this.outsideOwnerIds.delete(id);
      genealogyUI.refreshSelect('petOwnerIds');
      this.renderOwnerPreview();
    });
  },

  toggleOwnerEditing(force) {
    if($('petOwnerField').hidden)return;
    this.ownerEditOpen=typeof force==='boolean'?force:!this.ownerEditOpen;
    $('petOwnerEditPanel').hidden=!this.ownerEditOpen;
    const toggle=$('petOwnerEditToggle');
    toggle.textContent=uiText(this.ownerEditOpen?'完成':'編輯');
    toggle.setAttribute('aria-expanded',String(this.ownerEditOpen));
    this.renderOwnerPreview();
    if(this.ownerEditOpen)$('petOwnerEditPanel').querySelector('.ui-select-input')?.focus({preventScroll:true});
  },

  renderOwnerChoices(pet) {
    const row=$('petOwnerField');
    row.hidden=!this.directEntry;
    this.ownerEditOpen=false;
    this.outsideOwnerIds=new Set();
    $('petOwnerEditPanel').hidden=true;
    $('petOwnerEditToggle').textContent=uiText('編輯');
    $('petOwnerEditToggle').setAttribute('aria-expanded','false');
    const select=$('petOwnerIds');
    select.replaceChildren();
    if(!this.directEntry)return;
    const petId=String(pet?.gameData?.simId || pet?.id || '');
    const sims=Object.values(currentGenealogyData()?.sims || {});
    const owners=new Set(sims.filter(sim=>(sim.pets || []).some(item=>
      String(item?.gameData?.simId || item?.id || '')===petId
    )).map(sim=>String(sim.id)));
    const eligible=this.eligibleOwnerSims(pet);
    const allowed=new Set(eligible.map(sim=>String(sim.id)));
    this.outsideOwnerIds=new Set([...owners].filter(id=>!allowed.has(id)));
    eligible.forEach(sim=>{
      const option=document.createElement('option');
      option.value=String(sim.id);
      option.textContent=displayDataText(sim.name,sim)||uiText('（未命名）');
      option.selected=owners.has(String(sim.id));
      select.appendChild(option);
    });
    genealogyUI.refreshSelect('petOwnerIds');
    this.renderOwnerPreview();
  },

  openDirect(entry) {
    if (!entry?.pet) return false;
    this.directEntry = entry;
    petEditorState.index = -1;
    $('petEditorTitle').textContent = uiText('編輯寵物');
    $('petEditorDeleteButton').style.display = '';
    $('petEditorDeleteButton').textContent = uiText('永久刪除寵物');
    this.populateForm(entry.pet);
    this.syncPreferenceTabs(entry.pet);
    this.renderOwnerChoices(entry.pet);
    petEditorDialog.classList.add('show');
    requestAnimationFrame(() =>
      petEditorDialog.querySelector('.pet-editor-modal')?.focus({preventScroll:true})
    );
    return true;
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
                esc(uiText('移除特徵')) +
                '" title="' +
                esc(uiText('移除特徵')) +
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
    const source = syncPetEditorActiveAvatar();
    const toggle = $('petAvatarSourceToggleBtn');
    if (toggle) {
      const target = source === 'game' ? 'custom' : 'game';
      toggle.textContent = uiText(target === 'game' ? '使用遊戲頭像' : '使用自訂頭像');
      toggle.disabled = !(target === 'game' ? petEditorState.gameAvatar : petEditorState.customAvatar);
      toggle.dataset.avatarTarget = target;
    }
    const clear = $('petAvatarRemoveButton');
    if (clear) clear.disabled = source !== 'custom' || !petEditorState.customAvatar;
    const preview = $('petAvatarPreview');
    const avatar =
      framedAvatarImageHTML(
        petEditorState.avatar,
        petEditorState.avatarFrame
      );

    if (avatar) {
      preview.innerHTML = avatar;
    } else {
      const name = $('petNameInput').value.trim();
      const species =
        PET_SPECIES[$('petSpeciesSelect').value] ||
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
    const field = $('petGenderField');
    const select = $('petGenderSelect');
    const species = $('petSpeciesSelect').value;
    const visible = isEaCasPetSpecies(species);

    if (field) {
      field.hidden = !visible;
    }

    if (!select) return;

    select.value =
      visible
        ? (normalizePetGender(select.value) || 'male')
        : '';

    genealogyUI.refreshSelect('petGenderSelect');
  },

  populateForm(pet) {
    const owner = this.owner();

    $('petNameInput').value =
      owner
        ? displayDataText(pet.name, owner)
        : (pet.name || '');

    $('petSpeciesSelect').value =
      pet.species || 'dog';

    $('petBreedInput').value =
      owner
        ? displayDataText(pet.breed, owner)
        : (pet.breed || '');

    $('petGenderSelect').value =
      normalizePetGender(pet.gender) ||
      'male';

    $('petLifeStageSelect').value =
      pet.ageStage || '成年';

    $('petStatusSelect').value =
      pet.status || '在世';

    $('petNotesTextarea').value =
      owner
        ? displayDataText(pet.notes || '', owner)
        : (typeof pet.notes === 'string' ? pet.notes : '');

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

    petEditorState.gameAvatar = pet.gameAvatar || null;
    petEditorState.gameAvatarFrame = normalizeAvatarFrame(pet.gameAvatarFrame);
    petEditorState.customAvatar = pet.customAvatar || null;
    petEditorState.customAvatarFrame = normalizeAvatarFrame(pet.customAvatarFrame);
    petEditorState.avatarSource = pet.avatarSource === 'game' ? 'game' : 'custom';
    syncPetEditorActiveAvatar();

    this.syncGenderVisibility();
    this.refreshAvatarPreview();

    [
      'petSpeciesSelect',
      'petGenderSelect',
      'petLifeStageSelect',
      'petStatusSelect'
    ].forEach(id =>
      genealogyUI.refreshSelect(id)
    );
  },

  open(index = -1) {
    this.directEntry = null;
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

    $('petEditorTitle').textContent =
      uiText(
        validIndex
          ? '編輯寵物'
          : '新增寵物'
      );

    $('petEditorDeleteButton').style.display =
      validIndex ? '' : 'none';
    $('petEditorDeleteButton').textContent = uiText('刪除寵物');

    this.populateForm(pet);
    this.syncPreferenceTabs(pet);
    this.renderOwnerChoices(pet);
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
    this.directEntry = null;
    this.ownerEditOpen=false;
    this.outsideOwnerIds.clear();

    if (avatarCropTarget === 'pet') {
      closeAvatarCropEditor();
    }

    petEditorState.index = -1;
    petEditorState.avatar = null;
    petEditorState.avatarFrame = { ...DEFAULT_AVATAR_FRAME };
    petEditorState.gameAvatar = null;
    petEditorState.gameAvatarFrame = { ...DEFAULT_AVATAR_FRAME };
    petEditorState.customAvatar = null;
    petEditorState.customAvatarFrame = { ...DEFAULT_AVATAR_FRAME };
    petEditorState.avatarSource = 'custom';
    petEditorState.traits = [];
  },

  collectForm() {
    const owner = this.owner();
    const previous = this.currentPet();
    const inputName = $('petNameInput').value.trim();

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
      $('petBreedInput').value.trim();

    const shownNotes =
      previous && owner
        ? displayDataText(previous.notes || '', owner)
        : '';
    const inputNotes = $('petNotesTextarea').value.trim();

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

    const notes =
      previous &&
      isBuiltinSampleSim(owner) &&
      inputNotes === shownNotes
        ? (previous.notes || '')
        : inputNotes;

    const species =
      $('petSpeciesSelect').value;

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
                $('petGenderSelect').value
              ) ||
              'male'
            )
          : '',
      ageStage:
        $('petLifeStageSelect').value,
      status:
        $('petStatusSelect').value,
      traits:[
        ...petEditorState.traits
      ],
      notes,
      avatar:petEditorState.avatar || null,
      avatarFrame:normalizeAvatarFrame(petEditorState.avatarFrame),
      gameAvatar:petEditorState.gameAvatar || null,
      gameAvatarFrame:petEditorState.gameAvatar ? normalizeAvatarFrame(petEditorState.gameAvatarFrame) : null,
      customAvatar:petEditorState.customAvatar || null,
      customAvatarFrame:petEditorState.customAvatar ? normalizeAvatarFrame(petEditorState.customAvatarFrame) : null,
      avatarSource:petEditorState.avatarSource
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

    if (this.directEntry) {
      const owners = [...$('petOwnerIds').selectedOptions].map(option=>String(option.value)).concat([...this.outsideOwnerIds]);
      const before=captureCanonicalHistory();
  if (!before) return;
      const mutation = genealogyStore.savePetWithOwners(pet,owners);
      applyGenealogyMutation(mutation);
      recordCanonicalHistory(before);
      this.close();
      uiToast(uiText('已儲存寵物資料'));
      return;
    }

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

    const permanent = !!this.directEntry;
    const confirmed = await uiConfirm(
      permanent
        ? uiText('確定永久刪除寵物') + '「' + displayDataText(pet.name, pet) + '」？\n' + uiText('刪除後可使用 Ctrl + Z 復原，操作歷史不會跨重新整理或切換家族保留。')
        : `要刪除寵物「${pet.name}」嗎？`,
      {
        title:permanent ? uiText('永久刪除寵物') : uiText('刪除寵物'),
        kind:'danger',
        confirmText:permanent ? uiText('永久刪除') : uiText('刪除')
      }
    );

    if (!confirmed) return;

    if (this.directEntry) {
      // 寵物資料卡的刪除是完整刪除，而非解除飼主；所有飼主引用一併移除。
      const petId = String(pet.gameData?.simId || pet.id || '');
      const before=captureCanonicalHistory();
  if (!before) return;
      const mutation = genealogyStore.deletePet(petId);
      if (!mutation.dataChanged) return;
      selectedPetIds.delete(petId);
      this.close();
      applyGenealogyMutation(mutation);
      recordCanonicalHistory(before);
      return;
    }

    // 模擬市民編輯器使用草稿，僅對目前尚未儲存的寵物清單進行刪除。
    if (petEditorState.index < 0 || petEditorState.index >= editingPets.length) return;
    editingPets.splice(petEditorState.index,1);
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

    petEditorState.customAvatar = await saveImageAsset(
      result.blob,{width:result.width,height:result.height}
    );
    petEditorState.customAvatarFrame = { ...DEFAULT_AVATAR_FRAME };
    petEditorState.avatarSource = 'custom';
    this.refreshAvatarPreview();
  },

  clearAvatar() {
    if (petEditorState.avatarSource !== 'custom' || !petEditorState.customAvatar) return;
    petEditorState.customAvatar = null;
    petEditorState.customAvatarFrame = { ...DEFAULT_AVATAR_FRAME };
    if (petEditorState.gameAvatar) petEditorState.avatarSource = 'game';
    this.refreshAvatarPreview();
  }
};

function renderPetDraftList() {
  const list = $('simEditorPetList');
  if (!list) return;
  const editing = $('simEditorPetsSection').classList.contains('is-editing');
  const toggle = $('petSectionEditToggle');
  if (toggle) {
    toggle.textContent = uiText(editing ? '完成' : '編輯');
    toggle.setAttribute('aria-expanded', String(editing));
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

      const identity=[formatPetSpecies(pet),petGenderLabel(pet)].filter(Boolean);

      const displayName =
        owner
          ? displayDataText(
              pet.name,
              owner
            )
          : pet.name;

      return `
        <div class="pet-list-item" data-pet-draft-index="${index}">
          <div class="pet-list-item-avatar">${avatar}</div>
          <div class="pet-list-item-details">
            <div class="pet-item-heading"><span class="pet-list-item-name">${esc(displayName) || esc(uiText('（未命名）'))}</span><span class="pet-item-identity">${esc(identity.join(' · '))}</span></div>
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
          </div>
          ${editing ? `<div class="pet-list-item-actions">
            <button type="button" data-pet-action="edit" data-pet-index="${index}">${esc(uiText('編輯'))}</button>
            <button type="button" class="danger" data-pet-action="delete" data-pet-index="${index}">${esc(uiText('刪除'))}</button>
          </div>` : ''}
        </div>
      `;
    }).join('') +
    (!editingPets.length && !editing
      ? '<div class="relationship-empty">'+esc(uiText('尚未新增寵物'))+'</div>'
      : '') +
    (editing
      ? '<button class="pet-list-add-button" id="btnAddPet" type="button">'+
          iconSvg('plus-lg')+'<span>'+esc(uiText('新增寵物'))+'</span></button>'
      : '');

  list.querySelector('#btnAddPet')?.addEventListener('click', () => {
    petEditorController.open();
  });

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
              `要刪除寵物「${pet.name}」嗎？`,
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

$('petAvatarFileInput').onchange = async event => {
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

$('petAvatarSourceToggleBtn').onclick = () => {
  const target = petEditorState.avatarSource === 'game' ? 'custom' : 'game';
  const available = target === 'game' ? petEditorState.gameAvatar : petEditorState.customAvatar;
  if (!available) return;
  petEditorState.avatarSource = target;
  petEditorController.refreshAvatarPreview();
};

$('petAvatarRemoveButton').onclick = () => {
  petEditorController.clearAvatar();
};

$('petNameInput').addEventListener('input', () => {
  petEditorController.refreshAvatarPreview();
});

$('petSpeciesSelect').addEventListener('change', () => {
  petEditorController.syncGenderVisibility();
  petEditorController.refreshAvatarPreview();
});

petEditorDialog.querySelectorAll('.pet-editor-tab[data-pet-editor-tab]').forEach(tab=>{
  tab.addEventListener('click',()=>{
    petEditorController.switchPreferenceTab(tab.dataset.petEditorTab);
  });
  tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...petEditorDialog.querySelectorAll('.pet-editor-tab[data-pet-editor-tab]')]
      .filter(item=>!item.hidden);
    const index=tabs.indexOf(tab);
    if(index<0)return;
    event.preventDefault();
    let nextIndex=index;
    if(event.key==='ArrowLeft')nextIndex=(index-1+tabs.length)%tabs.length;
    if(event.key==='ArrowRight')nextIndex=(index+1)%tabs.length;
    if(event.key==='Home')nextIndex=0;
    if(event.key==='End')nextIndex=tabs.length-1;
    petEditorController.switchPreferenceTab(tabs[nextIndex].dataset.petEditorTab);
    tabs[nextIndex].focus();
  });
});

$('petOwnerEditToggle')?.addEventListener('click',()=>petEditorController.toggleOwnerEditing());
$('petOwnerIds')?.addEventListener('change',()=>petEditorController.renderOwnerPreview());

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

$('petEditorSaveButton').onclick = () => {
  petEditorController.commit();
};

$('petEditorCancelButton').onclick = () => {
  petEditorController.close();
};

$('petEditorDeleteButton').onclick = () => {
  petEditorController.removeCurrent();
};

petEditorDialog.onclick = event => {
  if (event.target === petEditorDialog) {
    petEditorController.close();
  }
};

$('petSectionEditToggle')?.addEventListener('click',()=>{
  const section=$('simEditorPetsSection');
  section.classList.toggle('is-editing');
  renderPetDraftList();
});

// ========【模擬市民編輯器 Authority】 Draft / lifecycle / 關係編輯由獨立模組負責 ========
personEditor.mount({
  openAvatarCropEditor,
  compressImage,
  saveImageAsset,
  showToast:uiToast,
  scene:genealogyScene,
  getCurrentFamily:currentFamily,
  getViewMode:() => viewMode
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
    '要永久刪除「' + displayDataText(c.name, c) + '」嗎？\n' +
    '這位模擬市民將從所有家族移除，模擬市民資料與相關關係也會一併刪除。\n\n' +
    '如果只想移出目前家族，請使用「移出家族」。\n' +
    uiText('刪除後可使用 Ctrl + Z 復原，操作歷史不會跨重新整理或切換家族保留。');

  if (!await uiConfirm(message, {
    title: '永久刪除模擬市民',
    kind: 'danger',
    confirmText: '永久刪除'
  })) return;

  const before=captureCanonicalHistory();
  if (!before) return;
  const mutation = purgeSimData(id);
  finalizeSimDataChange(mutation);
  recordCanonicalHistory(before);

  if (personLibraryDialog.classList.contains('show')) {
    renderPersonLibrary();
  }
}

// ========【模擬市民庫】 精簡 / 詳細檢視、單人選單與批量管理 ========
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
    const addNewSimButton = $('personLibraryAddBtn');
    const countEl = $('personLibraryBatchCount');

    if (toolbar) toolbar.hidden = !personLibraryState.batchMode || personLibraryCategory === 'pets';
    if (batchBtn) batchBtn.hidden = personLibraryState.batchMode || personLibraryCategory === 'pets';
    if (addNewSimButton) addNewSimButton.hidden = personLibraryState.batchMode || personLibraryCategory === 'pets';
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
    this.syncCategoryControls();
    this.syncViewControls();
    renderPersonLibrary();
    personLibraryDialog.classList.add('show');
  },

  close() {
    personLibraryDialog.classList.remove('show');
    personLibraryAvatarObserver?.disconnect();
    personLibraryAvatarObserver = null;
    resetPersonLibraryOperations({ batch:true, add:false });
  },
  syncCategoryCounts() {
    const sims = Object.keys(currentGenealogyData().sims || {}).length;
    const pets = collectPetLibraryEntries().length;
    if ($('personLibrarySimsCount')) $('personLibrarySimsCount').textContent = String(sims);
    if ($('personLibraryPetsCount')) $('personLibraryPetsCount').textContent = String(pets);
  },
  syncCategoryControls() {
    const petTab = personLibraryCategory === 'pets';
    const sims = $('personLibrarySimsTab');
    const pets = $('personLibraryPetsTab');
    for (const [button, active] of [[sims, !petTab], [pets, petTab]]) {
      if (!button) continue;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    }
    if (personLibrarySearch) {
      personLibrarySearch.placeholder = uiText(petTab ? '搜尋寵物……' : '搜尋市民……');
    }
  },
  setCategory(category) {
    personLibraryCategory = category === 'pets' ? 'pets' : 'sims';
    personLibrarySearch.value = '';
    resetPersonLibraryOperations({ batch:true, add:false });
    $('personLibraryList').scrollTop = 0;
    this.syncCategoryControls();
    renderPersonLibrary();
  },

  addSelectionToCurrentFamily() {
    const family = currentFamily();
    const before = captureCanonicalHistory();
    if (!before) return;
    const mutation = genealogyStore.addFamilyMembers(
      family.id,
      [...personLibraryState.selection].filter(id => currentGenealogyData().sims[id])
    );
    applyGenealogyMutation(mutation);
    recordCanonicalHistory(before);
    this.setBatchMode(false);
  },

  removeSelectionFromCurrentFamily() {
    const family = currentFamily();
    const before = captureCanonicalHistory();
    if (!before) return;
    const mutation = genealogyStore.removeFamilyMembers(
      family.id,
      [...personLibraryState.selection]
    );
    applyGenealogyMutation(mutation);
    recordCanonicalHistory(before);
    this.setBatchMode(false);
  },

  async deleteSelection() {
    const ids = [...personLibraryState.selection]
      .filter(id => currentGenealogyData().sims[id]);

    if (!ids.length) return;

    const confirmed = await uiConfirm(
      '要永久刪除選取的 ' + ids.length + ' 位模擬市民嗎？\n' +
      (LIFE_PHOTOS_PUBLIC ? '模擬市民資料、關係與人生照片都會一併刪除。\n\n' : '模擬市民資料與相關關係都會一併刪除。\n\n') +
      uiText('刪除後可使用 Ctrl + Z 復原，操作歷史不會跨重新整理或切換家族保留。'),
      {
        title:'批量刪除模擬市民',
        kind:'danger',
        confirmText:'永久刪除',
        richContent:{
          lead:'要永久刪除選取的 ' + ids.length + ' 位模擬市民嗎？',
          warnings:[LIFE_PHOTOS_PUBLIC
            ? uiText('模擬市民資料、關係與人生照片都會一併刪除。') + ' ' + uiText('刪除後可使用 Ctrl + Z 復原，操作歷史不會跨重新整理或切換家族保留。')
            : uiText('模擬市民資料與相關關係都會一併刪除。') + ' ' + uiText('刪除後可使用 Ctrl + Z 復原，操作歷史不會跨重新整理或切換家族保留。')]
        },
        backupAction:exportCurrentGenealogyBackup
      }
    );

    if (!confirmed) return;

    const before = captureCanonicalHistory();
    if (!before) return;
    const mutation = genealogyStore.mergeResults(
      ...ids.map(purgeSimData)
    );

    finalizeSimDataChange(mutation);
    recordCanonicalHistory(before);
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


/* ========【模擬市民與寵物總覽】 清單只載入可見頭像，避免 256 個暫存網址被大量清單耗盡 ======== */
function personLibraryAvatarHTML(sim) {
  const name = displayDataText(sim?.name, sim) || '?';
  const initial = esc(name.trim().charAt(0) || '?');
  const image = framedAvatarImageHTML(sim?.avatar, sim?.avatarFrame, 'person-library-deferred-image', true);
  // 已設定頭像時只輸出圖片；透明 PNG 不得透出舊的姓名首字。
  return image || initial;
}

// 總覽與加入家族共用市民精簡列內容。
function personLibrarySimMainHTML(sim, detailHtml = '') {
  return '<div class="person-library-main">' +
    '<div class="person-library-avatar-wrap"><div class="person-library-avatar">' +
      personLibraryAvatarHTML(sim) + '</div></div>' +
    '<div class="person-library-text">' +
      '<div class="person-library-name">' +
        '<span class="person-library-name-label">' + esc(displayDataText(sim.name, sim)) + '</span>' +
        '<span class="person-library-life">' + esc(displayDataText(sim.lifeStage, sim)) + '</span>' +
      '</div>' +
      '<div class="person-library-compact-meta">' + esc(personLibraryCompactMeta(sim)) + '</div>' +
      '<div class="person-library-detailed-meta">' + detailHtml + '</div>' +
    '</div>' +
  '</div>';
}

function petLibraryAvatarHTML(pet) {
  return '<span class="pet-avatar-species-fallback" aria-hidden="true">' +
    petIconFor(pet) + '</span>' +
    framedAvatarImageHTML(pet?.avatar, pet?.avatarFrame, 'person-library-deferred-image', true);
}

function observePersonLibraryAvatars(list) {
  personLibraryAvatarObserver?.disconnect();
  personLibraryAvatarObserver = null;
  const images = [...list.querySelectorAll('img.person-library-deferred-image[data-asset-id]')];
  if (!images.length) return;

  async function loadVisibleAvatar(image) {
    const id = image.dataset.assetId;
    try {
      const url = await assetStore.getUrl(id);
      if (image.dataset.libraryVisible !== '1' || !image.isConnected) return;
      if (!url) return;
      const setReady = ready => {
        if (!image.isConnected || image.dataset.libraryVisible !== '1') return;
        const loaded = ready && image.naturalWidth > 0;
        image.classList.toggle('asset-ready', loaded);
        image.closest('.person-library-avatar')?.classList.toggle('has-image', loaded);
      };
      image.onload = () => setReady(true);
      image.onerror = () => setReady(false);
      image.src = url;
      if (image.complete) setReady(image.naturalWidth > 0);
    } catch (error) {
      console.warn('模擬市民庫頭像載入失敗：', id, error);
    }
  }

  if (typeof IntersectionObserver !== 'function') {
    // 舊瀏覽器也採分批載入，不會在同一幀建立幾百個圖片網址。
    images.slice(0, 60).forEach(image => {
      image.dataset.libraryVisible = '1';
      void loadVisibleAvatar(image);
    });
    return;
  }

  personLibraryAvatarObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const image = entry.target;
      if (entry.isIntersecting) {
        if (image.dataset.libraryVisible === '1') return;
        image.dataset.libraryVisible = '1';
        void loadVisibleAvatar(image);
      } else {
        image.dataset.libraryVisible = '0';
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
        image.classList.remove('asset-ready');
        image.closest('.person-library-avatar')?.classList.remove('has-image');
      }
    });
  }, { root:list, rootMargin:'140px 0px' });
  images.forEach(image => personLibraryAvatarObserver.observe(image));
}

function collectPetLibraryEntries() {
  const db = currentGenealogyData();
  const byId = new Map();
  const add = (pet, ownerId, index) => {
    if (!pet || typeof pet !== 'object') return;
    const stable = pet.gameData?.simId || pet.id;
    const key = stable != null && String(stable)
      ? String(stable)
      : (ownerId || 'unassigned') + ':pet:' + index;
    let entry = byId.get(key);
    if (!entry) {
      entry = { key, pet, ownerId:ownerId || '', ownerIds:new Set() };
      byId.set(key, entry);
    }
    if (ownerId) {
      entry.ownerIds.add(String(ownerId));
      if (!entry.ownerId) entry.ownerId = String(ownerId);
    }
    if (!entry.pet.avatar && pet.avatar) entry.pet = pet;
  };
  Object.values(db?.sims || {}).forEach(sim => {
    (sim.pets || []).forEach((pet, index) => add(pet, String(sim.id), index));
  });
  (db?.meta?.unassignedPets || []).forEach((pet,index) => add(pet,'',index));
  return [...byId.values()].sort((a,b) =>
    String(a.pet.name || '').localeCompare(String(b.pet.name || ''), 'zh')
  );
}

function petLibraryDisplayInfo(entry) {
  const db = currentGenealogyData();
  const pet = entry.pet;
  const owner = db?.sims?.[entry.ownerId] || null;
  const owners = [...entry.ownerIds]
    .map(id => db.sims[id])
    .filter(Boolean)
    .map(sim => displayDataText(sim.name,sim));
  const householdId = pet?.gameData?.householdId;
  const household = householdId == null ? null :
    (db?.families || []).find(f => String(f.gameData?.householdId ?? '') === String(householdId));
  const ownerLabel = owners.length ? owners.join(' · ') :
    (household ? displayDataText(household.name,household) : uiText('（未歸屬）'));
  const name = displayDataText(pet.name,owner) || uiText('（未命名）');
  const breed = displayDataText(pet.breed,owner);
  const traits = (pet.traits || []).map(t => displayDataText(t,owner));
  return {name,breed,traits,ownerLabel,owner,species:formatPetSpecies(pet)};
}


function findPetFamilyLocation(entry) {
  const db=currentGenealogyData();
  const pet=entry?.pet;
  if(!pet)return null;
  const petId=String(pet.gameData?.simId || pet.id || '');
  const ownerIds=new Set([...(entry.ownerIds || [])].map(String));
  Object.values(db?.sims || {}).forEach(sim=>{
    if((sim.pets || []).some(item=>String(item?.gameData?.simId || item?.id || '')===petId))
      ownerIds.add(String(sim.id));
  });
  const householdId=pet.gameData?.householdId == null ? '' : String(pet.gameData.householdId);
  const modeOrder=[...new Set([familyTreeViewMode,'household','ea','extended'])];
  const matches=[];
  modeOrder.forEach((mode,modeIndex)=>{
    // 只讀取當前模式的作用中項目；查找其他模式不可修改其選擇狀態。
    const active=mode===familyTreeViewMode ? getActiveFamilySelectorEntry(mode) : null;
    getFamilySelectorEntries(mode).forEach((candidate,index)=>{
      const memberIds=(candidate.memberIds || []).map(String);
      const relationSources=mode!=='extended' && (candidate.primaryMemberIds || []).length
        ? candidate.primaryMemberIds : null;
      // 與 Scene 相同：家族成員、主要成員、可見關聯模擬市民都可能攜帶寵物。
      const visible=genealogyStore.getVisibleFamilyIds(
        {memberIds},{relationshipSourceIds:relationSources}
      );
      const sourceIds=new Set([
        ...memberIds,
        ...(candidate.primaryMemberIds || []).map(String),
        ...visible
      ]);
      const ownerId=[...ownerIds].find(id=>sourceIds.has(id));
      const family=db.families.find(item=>String(item.id)===String(candidate.familyId));
      const familyHousehold=family?.gameData?.householdId;
      const byHousehold=!!householdId && (
        (familyHousehold != null && String(familyHousehold)===householdId) ||
        [...sourceIds].some(id=>String(db.sims[id]?.gameData?.householdId ?? '')===householdId)
      );
      if(!ownerId && !byHousehold)return;
      matches.push({mode,entry:candidate,ownerId,byHousehold,
        score:(ownerId?0:1)*100 + (candidate===active?0:1)*10 + modeIndex,
        index});
    });
  });
  matches.sort((a,b)=>a.score-b.score || a.index-b.index);
  return matches[0] || null;
}

function locatePetFromLibrary(entry) {
  const petId=String(entry?.pet?.gameData?.simId || entry?.pet?.id || '');
  if(!petId)return false;
  const selected=findPetFamilyLocation(entry);
  if(!selected){
    uiAlert(uiText('找不到包含這隻寵物的族譜，請先指派飼主或所屬家庭。'),{
      title:uiText('在族譜中定位')
    });
    return false;
  }
  const {mode,entry:familyEntry,ownerId}=selected;
  const changedFamily=familyTreeViewMode!==mode ||
    String(currentFamily()?.id || '')!==String(familyEntry.familyId || '') ||
    getFamilyTreeSelectionValue(mode)!==familyEntry.value;
  const changedFilters=petVisibilityFilter && !petVisibilityFilter.checked;
  if(changedFilters){
    petVisibilityFilter.checked=true;
    updateTopbarFilterUI();
  }
  const revealedOwner=ownerId ? revealPersonInTopbarFilters(currentGenealogyData().sims[ownerId]) : false;
  if(changedFamily){
    familyTreeViewMode=mode;
    try{localStorage.setItem(FAMILY_TREE_VIEW_MODE_KEY,mode);}catch(_){}
    setFamilyTreeSelectionValue(mode,familyEntry.value);
    genealogyStore.setCurrentFamilyId(familyEntry.familyId);
    familyTreeLastSourceFamilyId=familyEntry.familyId;
    dragHistory.clear();
    clearNodeSelection();
    resetFamilyMemberOperations();
  }
  personLibraryController.close();
  if(changedFamily){
    save();
    refreshFamilyUI();
  }else if(changedFilters || revealedOwner){
    refreshFamilyProfilePanel();
  }
  if(changedFamily || changedFilters || revealedOwner)render();
  requestAnimationFrame(()=>{
    if(!findCanvasPetEntry(petId))render();
    requestAnimationFrame(()=>{
      const card=findCanvasPetEntry(petId);
      if(card)focusPetOnCanvas(card);
      else uiAlert(uiText('這隻寵物目前沒有可顯示的族譜卡片。'),{
        title:uiText('在族譜中定位')
      });
    });
  });
  return true;
}

async function deletePetFromLibrary(entry) {
  const petId=String(entry?.pet?.gameData?.simId || entry?.pet?.id || '');
  if(!petId)return;
  const info=petLibraryDisplayInfo(entry);
  const confirmed=await uiConfirm(
    uiText('確定永久刪除寵物')+'「'+info.name+'」？\n'+
    uiText('這會從所有飼主與未指派寵物清單中移除。') + '\n' + uiText('刪除後可使用 Ctrl + Z 復原，操作歷史不會跨重新整理或切換家族保留。'),
    {title:uiText('永久刪除寵物'),kind:'danger',confirmText:uiText('永久刪除')}
  );
  if(!confirmed)return;
  const before=captureCanonicalHistory();
  if (!before) return;
  const mutation=genealogyStore.deletePet(petId);
  if(!mutation.dataChanged)return;
  selectedPetIds.delete(petId);
  applyGenealogyMutation(mutation);
  recordCanonicalHistory(before);
  if(personLibraryDialog.classList.contains('show'))renderPersonLibrary();
}

function renderPetLibrary() {
  const list = $('personLibraryList');
  const all = collectPetLibraryEntries();
  const query = personLibrarySearch.value.trim().toLowerCase();
  const filtered = all.filter(entry => {
    if (!query) return true;
    const info = petLibraryDisplayInfo(entry);
    return [info.name,info.breed,info.species,info.ownerLabel,...info.traits]
      .some(value => String(value || '').toLowerCase().includes(query));
  });
  personLibraryController.syncCategoryCounts();
  personLibraryController.syncViewControls();
  personLibraryController.syncBatchToolbar();
  if (!filtered.length) {
    list.innerHTML = '<div class="person-library-empty">' +
      esc(uiText(all.length ? '沒有符合的寵物' : '尚無寵物資料')) + '</div>';
    return;
  }

  list.innerHTML = filtered.map(entry => {
    const info = petLibraryDisplayInfo(entry);
    const pet = entry.pet;
    const details = [
      [uiText('物種'),info.species],
      [uiText('品種'),info.breed],
      [uiText('性別'),petGenderLabel(pet)],
      [uiText('狀態'),uiText(pet.status || '')],
      [uiText('所屬家庭'),info.ownerLabel]
    ].filter(([,value]) => !!value);
    const short = [info.species,info.breed].filter(Boolean).join(' · ');
    const detailHtml = details.map(([label,value]) =>
      '<div class="person-library-detail-field"><span class="person-library-detail-label">' +
      esc(label) + '</span><span class="person-library-detail-value">' +
      esc(value) + '</span></div>'
    ).join('');
    return '<div class="person-library-item person-library-pet-item" data-pet-library-key="' + esc(entry.key) + '">' +
      '<div class="person-library-main">' +
        '<div class="person-library-avatar-wrap"><div class="person-library-avatar">' +
          petLibraryAvatarHTML(pet) + '</div></div>' +
        '<div class="person-library-text">' +
          '<div class="person-library-name"><span class="person-library-name-label">' + esc(info.name) + '</span>' +
          '<span class="person-library-life">' + esc(uiText(pet.ageStage || '')) + '</span></div>' +
          '<div class="person-library-compact-meta">' + esc(short) + '</div>' +
          '<div class="person-library-detailed-meta">' + detailHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ui-menu person-library-item-menu" data-menu-portal="body">' +
        '<button class="person-library-more ui-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="' + esc(uiText('更多')) + '">' +
          iconSvg('three-dots') + '</button>' +
        '<div class="ui-menu-popover person-library-item-popover" role="menu">' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-pet-library-action="view">' +
            iconSvg('person-vcard') + '<span>' + esc(uiText('查看寵物資料')) + '</span></button>' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-pet-library-action="edit">' +
            iconSvg('pencil-square') + '<span>' + esc(uiText('編輯寵物')) + '</span></button>' +
          '<button class="ui-menu-item" type="button" role="menuitem" data-pet-library-action="locate">' +
            iconSvg('crosshair') + '<span>' + esc(uiText('在族譜中定位')) + '</span></button>' +
          '<div class="ui-menu-divider"></div>' +
          '<button class="ui-menu-item danger" type="button" role="menuitem" data-pet-library-action="delete">' +
            iconSvg('trash3') + '<span>' + esc(uiText('永久刪除')) + '</span></button>' +
        '</div>' +
      '</div></div>';
  }).join('');

  const indexed = new Map(filtered.map(entry => [entry.key,entry]));
  list.querySelectorAll('[data-pet-library-key]').forEach(row => {
    const entry = indexed.get(row.dataset.petLibraryKey);
    if (!entry) return;
    row.addEventListener('click', event => {
      if (event.target.closest('.person-library-item-menu')) return;
      openPetProfileFromCanvas(entry);
    });
    row.querySelectorAll('[data-pet-library-action]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const action=button.dataset.petLibraryAction;
        if (action === 'edit') openPetEditorFromCanvas(entry);
        else if (action === 'locate') locatePetFromLibrary(entry);
        else if (action === 'delete') void deletePetFromLibrary(entry);
        else openPetProfileFromCanvas(entry);
      });
    });
  });
  observePersonLibraryAvatars(list);
  setupAppMenus();
}

function renderPersonLibrary() {
  closeAppMenus();
  personLibraryAvatarObserver?.disconnect();
  personLibraryAvatarObserver = null;
  personLibraryController.syncCategoryControls();
  if (personLibraryCategory === 'pets') {
    renderPetLibrary();
    return;
  }

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

  personLibraryController.syncCategoryCounts();
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
      ? '<div class="person-library-empty">沒有符合的模擬市民</div>'
      : '<div class="person-library-empty">還沒有任何模擬市民</div>';
    return;
  }

  list.innerHTML = filtered.map(s => {
    const familyNames = currentGenealogyData().families
      .filter(f => f.memberIds.includes(s.id))
      .map(f => displayDataText(f.name, f));

    const selected = personLibraryState.selection.has(s.id);
    const photoCount = (s.gallery || []).length;
    const familyLabel = familyNames.join(' · ') || uiText('（未歸屬）');
    const familyDetails = familyLabel + (photoCount ? ' · ' + photoCount + ' ' + uiText('張人生照片') : '');
    const detail = [
      [uiText('種族'), s.race ? displayDataText(RACE_PRESETS[s.race]?.label || s.race, s) : '—'],
      [uiText('職業'), displayDataText(s.career, s) || '—'],
      [uiText('居住地'), displayDataText(s.residence, s) || uiText('居住地未知')],
      [uiText('所屬家族'), familyDetails]
    ];
    const detailHtml = detail.map(([label,value]) =>
      '<div class="person-library-detail-field"><span class="person-library-detail-label">' +
      esc(label) + '</span><span class="person-library-detail-value">' +
      esc(value) + '</span></div>'
    ).join('');

    const familyAction = fam.memberIds.includes(s.id) ? '移出目前家族' : '加入目前家族';
    const familyIcon = fam.memberIds.includes(s.id) ? 'person-dash' : 'person-add';

    return '<div class="person-library-item' +
        (personLibraryState.batchMode ? ' batch-mode' : '') +
        (selected ? ' batch-selected' : '') +
        '" data-person-library-id="' + esc(s.id) + '">' +
      personLibrarySimMainHTML(s, detailHtml) +
      '<button class="person-library-batch-select' + (selected ? ' selected' : '') +
        '" type="button" data-person-library-select="' + esc(s.id) +
        '" aria-pressed="' + (selected ? 'true' : 'false') + '" aria-label="' +
        esc(uiText('選取') + ' ' + displayDataText(s.name,s)) + '">' +
        (selected ? iconSvg('check-lg') : '') +
      '</button>' +
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
        locatePersonFromLibrary(id);
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

  observePersonLibraryAvatars(list);
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

$('personLibrarySimsTab').onclick = () => personLibraryController.setCategory('sims');
$('personLibraryPetsTab').onclick = () => personLibraryController.setCategory('pets');
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

const familyMemberPickerVisibleIds = new Set();

const addMemberController = {
  open() {
    personLibraryState.addSelection.clear();
    $('familyMemberPickerSearch').value = '';
    familyMemberPickerDialog.classList.add('show');
    renderFamilyMemberPickerList();
    if (window.matchMedia('(min-width:721px)').matches) requestAnimationFrame(() => $('familyMemberPickerSearch').focus());
  },

  close() {
    familyMemberPickerDialog.classList.remove('show');
    personLibraryAvatarObserver?.disconnect();
    personLibraryAvatarObserver = null;
    personLibraryState.addSelection.clear();
  },

  toggle(id) {
    if (!currentGenealogyData().sims[id]) return;

    if (personLibraryState.addSelection.has(id)) {
      personLibraryState.addSelection.delete(id);
    } else {
      personLibraryState.addSelection.add(id);
    }

    syncFamilyMemberPickerSelection();
  },

  selectAllCandidates() {
    familyMemberPickerVisibleIds.forEach(id => personLibraryState.addSelection.add(id));
    syncFamilyMemberPickerSelection();
  },

  clearSelection() {
    personLibraryState.addSelection.clear();
    syncFamilyMemberPickerSelection();
  },

  commit() {
    if (!personLibraryState.addSelection.size) return;

    const family = currentFamily();
    const before=captureCanonicalHistory();
  if (!before) return;
    const mutation = genealogyStore.addFamilyMembers(
      family.id,
      [...personLibraryState.addSelection]
    );

    applyGenealogyMutation(mutation);
    recordCanonicalHistory(before);
    this.close();
    refreshFamilyProfilePanel();
    requestAnimationFrame(() => genealogyViewport.fit());
  }
};

function familyMemberPickerCandidates() {
  const fam = currentFamily();
  if (!fam) return { candidates:[], total:0, query:'' };
  const memberSet = new Set((fam.memberIds || []).map(String));
  const query = $('familyMemberPickerSearch').value.trim().toLocaleLowerCase();
  const all = Object.values(currentGenealogyData().sims).sort((a,b) => displayDataText(a.name,a).localeCompare(displayDataText(b.name,b),'zh'));
  const eligible = all.filter(sim => !memberSet.has(String(sim.id)));
  const candidates = !query ? eligible : eligible.filter(sim =>
    [displayDataText(sim.name,sim),displayDataText(sim.career,sim),displayDataText(sim.residence,sim),...(sim.traits || [])]
      .some(value => String(value || '').toLocaleLowerCase().includes(query)));
  return { candidates, total:eligible.length, query };
}

function syncFamilyMemberPickerSelection() {
  const selectedIds = personLibraryState.addSelection;
  const list = $('familyMemberPickerList');
  list.querySelectorAll('[data-family-member-picker-id]').forEach(row => {
    const selected = selectedIds.has(row.dataset.familyMemberPickerId);
    row.classList.toggle('batch-selected', selected);
    row.setAttribute('aria-pressed', String(selected));
    const check = row.querySelector('.person-library-batch-select');
    if (check) {
      check.classList.toggle('selected', selected);
      check.innerHTML = selected ? iconSvg('check-lg') : '';
    }
  });
  const count = selectedIds.size;
  $('familyMemberPickerCount').innerHTML = uiText('已選') + ' <b>' + count + '</b> ' + uiText('位');
  const confirm = $('familyMemberPickerConfirmBtn');
  confirm.disabled = count === 0;
  confirm.textContent = uiText('加入') + ' ' + count + ' ' + uiText('位');
}

function renderFamilyMemberPickerList() {
  const fam = currentFamily();
  if (!fam) return;
  const { candidates, total, query } = familyMemberPickerCandidates();
  familyMemberPickerVisibleIds.clear();
  candidates.forEach(sim => familyMemberPickerVisibleIds.add(String(sim.id)));
  $('familyMemberPickerFamilyName').textContent = displayDataText(fam.name, fam);
  $('familyMemberPickerAvailable').textContent = uiText(query ? '搜尋結果' : '可加入') + ' ' + candidates.length + ' ' + uiText('位');
  $('familyMemberPickerAllBtn').disabled = candidates.length === 0;
  const list = $('familyMemberPickerList');
  list.innerHTML = candidates.length ? candidates.map(sim => {
    const id = String(sim.id);
    const selected = personLibraryState.addSelection.has(id);
    return '<div class="person-library-item family-member-picker-item batch-mode' +
      (selected ? ' batch-selected' : '') +
      '" role="button" tabindex="0" data-family-member-picker-id="' + esc(id) +
      '" aria-pressed="' + String(selected) + '" aria-label="' +
      esc(uiText('選取') + ' ' + displayDataText(sim.name, sim)) + '">' +
      personLibrarySimMainHTML(sim) +
      '<span class="person-library-batch-select' + (selected ? ' selected' : '') +
      '" aria-hidden="true">' + (selected ? iconSvg('check-lg') : '') + '</span>' +
      '</div>';
  }).join('') : '<div class="person-library-empty">' +
    esc(uiText(total === 0 ? '所有模擬市民都已在目前家族中' : '沒有符合的項目')) + '</div>';
  observePersonLibraryAvatars(list);
  syncFamilyMemberPickerSelection();
}
$('familyMemberPickerList').addEventListener('click', event => {
  const row = event.target.closest('[data-family-member-picker-id]');
  if (row) addMemberController.toggle(row.dataset.familyMemberPickerId);
});
$('familyMemberPickerList').addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const row = event.target.closest('[data-family-member-picker-id]');
  if (!row) return;
  event.preventDefault();
  addMemberController.toggle(row.dataset.familyMemberPickerId);
});

$('addExistingSimToFamilyButton').onclick = () => {
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

// ========【家族成員批量移出家族】 側邊欄原地選取，送出前必須二次確認 ========
$('removeFamilyMembersButton').onclick = () => {
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

// 匯出檔名使用本次遊戲匯入的目前存檔來源；不將歷史 knownSaves 誤當成多存檔。
function exportSaveSlotPrefix(database) {
  const source = database?.meta?.gameImportSource;
  if (source?.saveSlotConsistency === 'conflict') return '';

  const save = source?.currentSave;
  if (!save || typeof save !== 'object' || Array.isArray(save)) return '';

  const slotFile = String(save.slotFile || '').trim();
  const matched = /^Slot_([0-9A-F]{8})$/i.exec(slotFile);
  if (matched) return 'Slot_' + matched[1].toUpperCase();

  if (save.slotId == null || save.slotId === '') return '';
  const slotId = Number(save.slotId);
  if (!Number.isSafeInteger(slotId) || slotId < 0 || slotId > 0xFFFFFFFF) return '';
  return 'Slot_' + slotId.toString(16).toUpperCase().padStart(8, '0');
}

function withExportSlotPrefix(filename, database) {
  const slot = exportSaveSlotPrefix(database);
  return slot ? slot + '_' + filename : filename;
}

function localizedExportFilenamePart(label) {
  return sanitizeDownloadName(uiText(label)).replace(/\s+/g, '_');
}

async function exportJSON() {
  const title = '匯出 JSON 備份';
  showFileOperationStatus('整理族譜與背景設定……', null, title);
  const exportDb = genealogyStore.snapshotDatabase();
  const exportBg = { ...bgSettings };
  const assetIds = assetStore.collectReferencedAssetIds(exportDb, exportBg, { strict:true });
  if (assetIds.size) showFileAssetProgress('整理圖片資產', 0, assetIds.size, title);
  const assets = await assetStore.serializeAssets(assetIds, (done, total) => {
    showFileAssetProgress('整理圖片資產', done, total, title);
  });
  showFileOperationStatus('建立 JSON 備份檔案……', null, title);
  const payload = { ...exportDb, bgSettings:exportBg,
    backupFormat:'l1ng-genealogy-backup', backupVersion:1, assets };
  // Base64 只寫入攜帶式備份，不變更原本儲存格式。
  const blob = new Blob([JSON.stringify(payload)], {type:'application/json'});
  showFileOperationStatus('準備下載……', null, title);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = withExportSlotPrefix(localizedExportFilenamePart('族譜備份') + '.json', exportDb);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ========【確認視窗內備份】共用現有 JSON 匯出與 Loading ======== */
let jsonBackupInProgress = false;
async function exportCurrentGenealogyBackup() {
  if (jsonBackupInProgress) throw new Error(uiText('匯出尚未完成，請稍後再試。'));
  jsonBackupInProgress = true;
  try {
    showFileOperationStatus('整理族譜與背景設定……', null, '匯出 JSON 備份');
    await waitForFileOperationPaint();
    await exportJSON();
    showFileOperationStatus('所有資料已處理完成！', 100, '匯出 JSON 備份');
    await waitForFileOperationPaint();
  } finally {
    hideFileOperationStatus();
    jsonBackupInProgress = false;
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

// iOS Safari 可能輸出 color(display-p3 ...)；標準 html2canvas 無法解析此色彩格式。
// iOS PNG 匯出另載入支援 CSS Color 4 的版本，桌面版維持標準繪製流程。
let _iosHtml2CanvasPromise = null;

async function ensureIosHtml2Canvas() {
  if (_iosHtml2CanvasPromise) return _iosHtml2CanvasPromise;

  const sources = [
    'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.6.7/dist/html2canvas-pro.min.js',
    'https://unpkg.com/html2canvas-pro@1.6.7/dist/html2canvas-pro.min.js'
  ];

  _iosHtml2CanvasPromise = (async () => {
    let lastError = null;

    for (const src of sources) {
      const previousRenderer = window.html2canvas;
      try {
        await loadScriptOnce(src);
        // 確認相容版已替換目前的 html2canvas 實例，避免沿用不支援色彩格式的實作。
        if (typeof window.html2canvas === 'function' &&
            window.html2canvas !== previousRenderer) {
          return window.html2canvas;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('無法載入支援 iOS 顏色格式的圖片轉換元件。');
  })();

  try {
    return await _iosHtml2CanvasPromise;
  } catch (err) {
    _iosHtml2CanvasPromise = null;
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

function decodeBundledIconSvg(iconName) {
  const safe =
    String(iconName || '')
      .replace(/[^a-z0-9-]/gi, '');

  if (!safe) {
    throw new Error('Invalid icon name');
  }

  const token =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(
        `--l1ng-icon-${safe}`
      )
      .trim();

  const match =
    token.match(
      /base64,([^"'\)]+)/
    );

  if (!match) {
    throw new Error(
      `Bundled SVG not found: ${safe}`
    );
  }

  const binary =
    atob(match[1]);

  if (
    typeof TextDecoder ===
    'function'
  ) {
    const bytes =
      Uint8Array.from(
        binary,
        char =>
          char.charCodeAt(0)
      );

    return new TextDecoder(
      'utf-8'
    ).decode(bytes);
  }

  return binary;
}

async function loadExportIconSvg(iconName) {
  if (_exportIconSvgCache.has(iconName)) {
    return _exportIconSvgCache.get(iconName);
  }

  const svg =
    decodeBundledIconSvg(
      iconName
    );

  if (!svg.includes('<svg')) {
    throw new Error(
      `Invalid bundled SVG: ${iconName}`
    );
  }

  _exportIconSvgCache.set(
    iconName,
    svg
  );

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


/* ========【族譜 PNG 匯出】 只在匯出副本內嵌頭像與關係圖示，不改動原畫布 ======== */
async function prepareCaptureAssetImages(captureRoot, backgroundMode) {
  const images = [...captureRoot.querySelectorAll('img[data-asset-id]')];
  const ids = new Set(images.map(image => image.dataset.assetId).filter(isAssetId));
  const backgroundId = backgroundMode === 'current' &&
    captureRoot.classList.contains('has-bg') &&
    isAssetId(bgSettings?.image) ? bgSettings.image : null;
  if (backgroundId) ids.add(backgroundId);
  if (!ids.size) return;

  // 直接讀取 IndexedDB 中的原始 Blob，而非重用可能被撤銷的 blob: 暫存網址。
  const assets = await assetStore.serializeAssets(ids);
  const assetDataUrl = id => {
    const asset = assets[id];
    if (!asset || !asset.data) throw new Error('缺少匯出圖片資產：' + id);
    return 'data:' + (asset.mime || 'image/png') + ';base64,' + asset.data;
  };

  images.forEach(image => {
    image.src = assetDataUrl(image.dataset.assetId);
    image.classList.remove('asset-pending');
  });

  if (backgroundId) {
    captureRoot.style.setProperty('--custom-bg', 'url("' + assetDataUrl(backgroundId) + '")');
  }

  // 所有頭像必須真正完成解碼，不能只確認 src 已設定就開始製作 PNG。
  await Promise.all(images.map(async image => {
    try {
      if (typeof image.decode === 'function') {
        await image.decode();
      } else if (!image.complete) {
        await new Promise((resolve, reject) => {
          image.addEventListener('load', resolve, { once:true });
          image.addEventListener('error', reject, { once:true });
        });
      }
      if (!image.naturalWidth) throw new Error('圖片解碼失敗');
    } catch (_) {
      throw new Error('族譜頭像無法載入：' + image.dataset.assetId);
    }
  }));
}

async function prepareCaptureRelationshipIcons(captureRoot) {
  const icons = [...captureRoot.querySelectorAll('#genealogyRelationshipLabelLayer use.edge-label-icon')];
  if (!icons.length) return;

  const firstHref = icons[0].getAttribute('href') || '';
  const splitAt = firstHref.lastIndexOf('#');
  if (splitAt <= 0) throw new Error('無法定位關係標籤 SVG 圖示來源');
  const response = await fetch(firstHref.slice(0, splitAt));
  if (!response.ok) throw new Error('無法讀取關係標籤 SVG 圖示');
  const sprite = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  if (sprite.querySelector('parsererror')) throw new Error('關係標籤 SVG 格式不正確');

  const svgNS = 'http://www.w3.org/2000/svg';
  icons.forEach(icon => {
    const href = icon.getAttribute('href') || '';
    const symbol = sprite.getElementById(href.slice(href.lastIndexOf('#') + 1));
    if (!symbol) throw new Error('找不到關係標籤 SVG：' + href);

    // <use href="外部 SVG#symbol"> 在 foreignObject 匯出時可能遺失；
    // 換成內嵌路徑，保留原本圖示尺寸、位置、顏色與特殊 viewBox。
    const inline = document.createElementNS(svgNS, 'svg');
    for (const attr of ['x', 'y', 'width', 'height']) {
      if (icon.hasAttribute(attr)) inline.setAttribute(attr, icon.getAttribute(attr));
    }
    inline.setAttribute('viewBox', symbol.getAttribute('viewBox') || '0 0 16 16');
    inline.setAttribute('class', 'edge-label-icon');
    inline.setAttribute('aria-hidden', 'true');
    const style = getComputedStyle(icon);
    inline.style.color = style.color;
    inline.style.fill = style.fill;
    symbol.childNodes.forEach(child => inline.appendChild(document.importNode(child, true)));
    icon.replaceWith(inline);
  });
}

const EXPORT_TREE_PADDING_PX = 40;

// ========【族譜圖片主題背景】 匯出時沿用目前主題的實際畫布底色與紋理 ========
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
    ...captureStage.querySelectorAll('.genealogy-pet-card, .genealogy-pet-family-label'),
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

// iPhone／iPad 的 WebKit 以 foreignObject 截圖時可能只保留卡片與 SVG，
// 卻漏畫已成功解碼的透明 PNG 肖像；在 iOS 改用 html2canvas 逐元素繪製。
function useSafeIosGenealogyCapture(navigatorInfo = navigator) {
  const agent = String(navigatorInfo?.userAgent || '');
  const platform = String(navigatorInfo?.platform || '');
  return /iPad|iPhone|iPod/i.test(agent) ||
    (platform === 'MacIntel' && Number(navigatorInfo?.maxTouchPoints) > 1);
}

async function exportGenealogyImage(sizeKey = 'standard', backgroundMode = 'current') {
  if (!currentGenealogyData() || !stage || !viewport) throw new Error('Genealogy canvas is not ready');

  // 等待目前語系字型完成載入後再量測與繪製，避免 HTML 與 PNG 的文字基線、膠囊背景位置不同。
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  render();
  showFileOperationStatus('準備族譜畫布……', null, '匯出族譜圖片');

  const factorMap = { standard: 1, hd: 2, uhd: 3 };
  const factor = factorMap[sizeKey] || 1;
  const stageWidth = Math.max(1, Math.ceil(parseFloat(stage.style.width) || stage.offsetWidth || 1));
  const stageHeight = Math.max(1, Math.ceil(parseFloat(stage.style.height) || stage.offsetHeight || 1));

  const html2canvas = useSafeIosGenealogyCapture()
    ? await ensureIosHtml2Canvas()
    : await ensureHtml2Canvas();
  const captureViewport = buildGenealogyCaptureNode(stageWidth, stageHeight, backgroundMode);
  document.body.appendChild(captureViewport);

  try {
    // 先讓 clone 套用完整 CSS，再把 mask icon 換成 html2canvas 能正確輸出的 SVG。
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    showFileOperationStatus('載入頭像與關係圖示……', null, '匯出族譜圖片');
    await Promise.all([
      prepareCaptureIcons(captureViewport),
      prepareCaptureRelationshipIcons(captureViewport),
      prepareCaptureAssetImages(captureViewport, backgroundMode)
    ]);
    const captureSize = fitCaptureToCompleteTree(captureViewport, stageWidth, stageHeight);
    const pixelWidth = Math.max(1, Math.round(captureSize.width * factor));
    const pixelHeight = Math.max(1, Math.round(captureSize.height * factor));

    if (pixelWidth > 32767 || pixelHeight > 32767 || pixelWidth * pixelHeight > 180000000) {
      throw new Error('圖片尺寸超過瀏覽器可安全輸出的範圍，請改用較小的匯出尺寸。');
    }

    showFileOperationStatus('正在繪製族譜圖片……', null, '匯出族譜圖片');
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
      // iOS Safari 的 foreignObject 匯出常會讓頭像整批消失；
      // 保留桌面版既有流程，只有 WebKit iOS 改走安全圖片繪製。
      foreignObjectRendering: !useSafeIosGenealogyCapture(),
      allowTaint: false,
      imageTimeout: 15000,
      logging: false,
      removeContainer: true
    });

    showFileOperationStatus('正在產生 PNG 檔案……', null, '匯出族譜圖片');
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png');
    });

    const family = currentFamily();
    const familyName = displayDataText((family && family.name) || uiText('家族'), family || null);
    const familySuffix = (window.LING_I18N?.language === 'en' ? ' ' : '') + uiText('族譜');
    const fileBase = sanitizeDownloadName(familyName + familySuffix);
    const sizeLabel = sizeKey === 'uhd' ? '超高畫質' : sizeKey === 'hd' ? '高畫質（2×）' : '標準';
    const filename = `${fileBase}_${localizedExportFilenamePart(sizeLabel)}.png`;
    showFileOperationStatus('準備下載……', null, '匯出族譜圖片');
    downloadBlob(blob, withExportSlotPrefix(filename, currentGenealogyData()));
  } finally {
    captureViewport.remove();
  }
}

// ========【L1nG v1 資料載入】 讀取現行工作區儲存格式 ========
async function readStoredGenealogyData() {
  const currentRaw = localStorage.getItem(STORE_KEY);
  if (currentRaw === WORKSPACE_IDB_MARKER) {
    const saved = await assetStore.loadWorkspaceData();
    if (!saved) {
      throw new Error('族譜圖片資料庫中的大型族譜存檔遺失，已停止載入以避免覆蓋資料。');
    }
    return JSON.parse(saved);
  }
  return currentRaw ? JSON.parse(currentRaw) : null;
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

// ========【族譜匯入診斷】在例外發生時保存原始資訊；不以 UI 摘要取代堆疊 ========
function captureGenealogyImportError(error, depth = 0) {
  if (error == null) return null;
  if (depth > 3) return { truncated:true };
  if (typeof error !== 'object') return { message:String(error) };
  const result = {
    name:String(error.name || 'Error'),
    message:String(error.message || error.code || '未知錯誤')
  };
  for (const key of ['code','stage','path']) {
    if (error[key] != null) result[key] = String(error[key]);
  }
  if (typeof error.stack === 'string') result.stack = error.stack;
  if (error.cause != null && error.cause !== error) {
    result.cause = captureGenealogyImportError(error.cause, depth + 1);
  }
  return result;
}

function makeGenealogyImportDiagnostic({source,stage,file,error,failures=[],counts=null}) {
  return {
    format:'l1ng-genealogy-import-diagnostic',
    version:1,
    capturedAt:new Date().toISOString(),
    source,
    stage:stage || 'unknown',
    file:file ? {
      name:String(file.name || ''),
      size:Number(file.size) || 0,
      type:String(file.type || ''),
      lastModified:Number(file.lastModified) || null
    } : null,
    browser:{
      userAgent:navigator.userAgent,
      language:document.documentElement.lang || navigator.language || ''
    },
    error:captureGenealogyImportError(error),
    counts,
    failures:failures.map(item => ({
      simId:item.simId || null,
      kind:item.kind || null,
      path:item.path || null,
      stage:item.stage || null,
      reason:item.reason || null,
      error:item.error || null
    }))
  };
}

function genealogyImportDetailOptions(report, failures=[]) {
  const entries=failures.length
    ? failures.map((item,index) => ({
        title:'失敗頭像 ' + (index + 1),
        caption:item.kind === 'pet' ? '寵物' : '模擬市民',
        fields:[
          ['Sim ID',item.simId || '未擷取'],
          ['失敗階段',item.stage || '未擷取'],
          ['錯誤原因',item.reason || '未擷取'],
          ['ZIP 路徑',item.path || '未擷取'],
          ['原始堆疊',item.error?.stack || '未擷取']
        ]
      }))
    : [{
        title:'原始錯誤紀錄',
        fields:[
          ['錯誤類型',report.error?.name || '未擷取'],
          ['錯誤訊息',report.error?.message || '未擷取'],
          ['錯誤代碼',report.error?.code || '未擷取'],
          ['發生階段',report.stage || '未擷取'],
          ['原始堆疊',report.error?.stack || '未擷取'],
          ...(report.error?.cause ? [['底層原因',JSON.stringify(report.error.cause,null,2)]] : [])
        ]
      }];
  return {
    label:'查看詳細資訊',
    items:entries,
    text:report.error?.message || (failures.length ? failures.length + ' 張頭像未能解析' : ''),
    copyText:JSON.stringify(report,null,2)
  };
}

async function showGenealogyImportError(error, {source,stage,file}) {
  const report=makeGenealogyImportDiagnostic({source,stage,file,error});
  const raw=report.error?.message || '未知錯誤';
  const isZip=source === 'game-zip';
  const title=isZip ? '遊戲族譜匯入失敗' : 'JSON 備份還原失敗';
  const isUnsaved=/尚未成功保存|尚未確認|儲存失敗|寫入失敗/.test(raw);
  await uiAlert(raw,{
    title,
    kind:'danger',
    richContent:{
      lead:raw,
      ...(isUnsaved ? {paragraphs:['資料尚未確認成功儲存，請先匯出 JSON 備份，不要重新整理網頁。']} : {})
    },
    details:genealogyImportDetailOptions(report)
  });
}

function reconcileImportedFamilyView({ defaultToHousehold = false } = {}) {
  // 新匯入／覆蓋時，先顯示 ZIP 選中的實際 Household；
  // 更新現有族譜則保留玩家的視角和目前選擇。
  const family=currentFamily();
  const sourceFamilyId=family?.id || null;
  if (defaultToHousehold && family) {
    familyTreeViewMode='household';
    try {
      localStorage.setItem(FAMILY_TREE_VIEW_MODE_KEY, familyTreeViewMode);
    } catch (_) {}
  }
  // 其他兩種族譜視角也以同一 Household 為來源對應，
  // 切換 EA 族譜／大家族時才展開相關市民。
  for (const mode of ['household','ea','extended']) {
    const entries=getFamilySelectorEntries(mode);
    const selected=findBestFamilySelectorEntry(family,entries);
    setFamilyTreeSelectionValue(mode,selected?.value || null);
  }
  familyTreeLastSourceFamilyId=sourceFamilyId;
}

async function importJSON(file) {
  const title = '匯入 JSON 備份';
  let diagnosticStage = 'read-json';
  try {
    showFileOperationStatus('讀取 JSON 備份檔案……', null, title);
    await waitForFileOperationPaint();
    const raw = JSON.parse(await file.text());
    diagnosticStage = 'verify-format';
    showFileOperationStatus('檢查備份格式與版本……', null, title);
    if (raw?.backupFormat !== 'l1ng-genealogy-backup' || Number(raw?.backupVersion) !== 1) {
      throw new Error('這不是目前 L1nG 圖片資產架構的完整 JSON 備份。');
    }
    const incomingBg = raw.bgSettings && typeof raw.bgSettings === 'object'
      ? { ...raw.bgSettings } : { image:null, opacity:0.5, fit:'cover' };
    const rawDb = { ...raw };
    delete rawDb.backupFormat;
    delete rawDb.backupVersion;
    delete rawDb.bgSettings;
    delete rawDb.assets;
    showFileOperationStatus('整理模擬市民、寵物與家庭關係……', null, title);
    diagnosticStage = 'prepare-database';
    const preparedResult = prepareDatabase(rawDb);
    const nextDb = preparedResult.prepared;
    showFileOperationStatus('檢查族譜引用的圖片資產……', null, title);
    diagnosticStage = 'validate-asset-references';
    const requiredAssets = assetStore.collectReferencedAssetIds(nextDb, incomingBg, { strict:true });
    const serializedAssets = raw.assets || {};
    for (const id of requiredAssets) {
      if (!Object.prototype.hasOwnProperty.call(serializedAssets, id)) {
        throw new Error(`備份缺少被族譜引用的圖片資產：${id}`);
      }
    }
    // 格式與引用驗證通過，寫入資料前提供備份及覆蓋確認。
    if (currentGenealogyData()?.meta?.sample !== true) {
      hideFileOperationStatus();
      const confirmed = await uiConfirm(
        uiText('這份 JSON 備份將取代目前族譜資料與背景設定。此操作無法復原，建議先匯出目前族譜的 JSON 備份。'),
        {
          title:'還原 JSON 備份',
          kind:'danger',
          richContent:{
            lead:'請確認是否要取代目前族譜。',
            warnings:['這份 JSON 備份將取代目前族譜資料與背景設定。此操作無法復原，建議先匯出目前族譜的 JSON 備份。']
          },
          confirmText:'還原這份備份',
          backupAction:exportCurrentGenealogyBackup
        }
      );
      if (!confirmed) return;
      showFileOperationStatus('檢查族譜引用的圖片資產……', null, title);
      await waitForFileOperationPaint();
    }
    const totalAssets = Object.keys(serializedAssets).length;
    if (totalAssets) showFileAssetProgress('還原圖片資產', 0, totalAssets, title);
    diagnosticStage = 'restore-assets';
    await assetStore.importSerializedAssets(serializedAssets, (done, total) => {
      showFileAssetProgress('還原圖片資產', done, total, title);
    });
    showFileOperationStatus('更新族譜與背景設定……', null, title);
    diagnosticStage = 'apply-database';
    replaceCanonicalGenealogyDatabase(nextDb);
    dragHistory.clear();
    bgSettings = { ...bgSettings, ...incomingBg };
    showFileOperationStatus('儲存族譜與圖片資料……', null, title);
    diagnosticStage = 'persist-database';
    save({ immediate:true });
    persistCanvasBackground();
    refreshFamilyUI();
    syncCanvasBackgroundSurface();
    render();
    scheduleGC();
    requestAnimationFrame(() => genealogyViewport.fit());
    showFileOperationStatus('所有資料已處理完成！', 100, title);
    await waitForFileOperationPaint();
  } catch(err) {
    hideFileOperationStatus();
    console.error('[JSON 備份還原]', err);
    await showGenealogyImportError(err,{source:'json-backup',stage:diagnosticStage,file});
  } finally {
    hideFileOperationStatus();
  }
}

// ========【檔案處理進度】匯入與匯出共用 UI ========
let fileOperationStatusElement = null;
function ensureFileOperationStatus() {
  if (fileOperationStatusElement) return fileOperationStatusElement;
  const overlay = document.createElement('div');
  overlay.id = 'fileOperationStatus';
  overlay.className = 'file-operation-status-mask';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="file-operation-status-card" role="status" aria-live="polite" aria-atomic="true">
      <span class="file-operation-spinner" aria-hidden="true"></span>
      <div class="file-operation-status-content">
        <strong class="file-operation-status-title">檔案處理中</strong>
        <span class="file-operation-status-text">準備中……</span>
      </div>
      <span class="file-operation-status-percent" aria-hidden="true">處理中</span>
      <div class="file-operation-status-track" role="progressbar" aria-label="檔案處理進度" aria-valuemin="0" aria-valuemax="100">
        <span class="file-operation-status-fill"></span>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  fileOperationStatusElement = overlay;
  return overlay;
}
function showFileOperationStatus(message, percent = null, title = '檔案處理中') {
  const overlay = ensureFileOperationStatus();
  const text = overlay.querySelector('.file-operation-status-text');
  const heading = overlay.querySelector('.file-operation-status-title');
  const number = overlay.querySelector('.file-operation-status-percent');
  const track = overlay.querySelector('.file-operation-status-track');
  const fill = overlay.querySelector('.file-operation-status-fill');
  const determinate = Number.isFinite(percent);
  text.textContent = uiText(message);
  heading.textContent = uiText(title);
  track.setAttribute('aria-label', uiText(title) + ' ' + uiText('進度'));
  track.setAttribute('aria-valuetext', uiText(message));
  overlay.classList.toggle('is-indeterminate', !determinate);
  if (determinate) {
    const value = Math.min(100, Math.max(0, Math.floor(percent)));
    number.textContent = value + '%';
    track.setAttribute('aria-valuenow', String(value));
    fill.style.width = value + '%';
  } else {
    number.textContent = uiText('處理中');
    track.removeAttribute('aria-valuenow');
    fill.style.width = '';
  }
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}
function hideFileOperationStatus() {
  if (!fileOperationStatusElement) return;
  fileOperationStatusElement.classList.remove('show', 'is-indeterminate');
  fileOperationStatusElement.setAttribute('aria-hidden', 'true');
}
function showFileAssetProgress(label, done, total, title) {
  const en = window.LING_I18N?.language === 'en';
  const count = en ? ` (${done} / ${total})` : `（${done} / ${total}）`;
  showFileOperationStatus(uiText(label) + count + '……', total ? done / total * 100 : null, title);
}
function waitForFileOperationPaint() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// ========【遊戲族譜匯入】 讀取 L1nG Genealogy Exporter ZIP ========
// ========【遊戲族譜頭像】 ZIP 圖片直接進 Blob Asset Store，再回填模擬市民 / 寵物 assetId ========
async function persistGameImportAvatars(bundle, converted, importMode = 'replace') {
  if (!window.L1nGGameImport || !bundle || !converted) {
    return { saved:0, unsupported:0, missing:0 };
  }

  const sourceSims =
    (bundle.genealogy && bundle.genealogy.sims) ||
    {};

  let saved = 0;
  let unsupported = 0;
  let missing = 0;
  let thumDecoded = 0;
  let decodeFailed = 0;
  const decodeFailures = [];

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

    let prepared;
    try {
      prepared = await window.L1nGGameImport.prepareGameAvatarAsset(asset, kind);
    } catch (error) {
      if (error?.code !== 'EA_THUM_DECODE_FAILED') throw error;
      // 已知 THUM conversion failure 只略過這張頭像，不能中止或損失整份族譜。
      decodeFailed++;
      decodeFailures.push({simId:String(simId),kind,path:String(asset.path || ''),stage:String(error.stage || ''),reason:String(error.message || error.code || ''),error:captureGenealogyImportError(error)});
      console.warn('[遊戲 ZIP 頭像] EA THUM fail closed：', { simId:String(simId), path:asset.path, stage:error.stage, reason:error.message }, error);
      return;
    }

    // 普通圖片仍保存原 bytes；THUM 保存 lossless straight-RGBA PNG，不經手動上傳 384px pipeline。
    const savedAvatar =
      await saveImageAsset(
        prepared.blob,
        prepared.metadata
      );

    if (kind === 'sim') {
      target.gameAvatar =
        savedAvatar;

      if (!target.gameAvatarFrame) {
        target.gameAvatarFrame = {
          ...DEFAULT_AVATAR_FRAME
        };
      }

      if (!target.customAvatar) {
        target.avatarSource =
          'game';
      }
    } else {
      target.gameAvatar = savedAvatar;
      if (!target.gameAvatarFrame) target.gameAvatarFrame = { ...DEFAULT_AVATAR_FRAME };
      if (!target.customAvatar) target.avatarSource = 'game';
      if (target.avatarSource === 'game') {
        target.avatar = savedAvatar;
        target.avatarFrame = normalizeAvatarFrame(target.gameAvatarFrame);
      }
    }

    if (prepared.converted) thumDecoded++;

    saved++;
  };

  const isUpdate = importMode === 'update' || importMode === 'continue_update';
  const progressTitle = isUpdate ? '更新遊戲族譜' : '匯入遊戲族譜';
  const english = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const personEntries = Object.entries(converted.sims || {});
  const petEntries = [];

  // 原有的每一筆寵物引用仍個別匯入；只調整處理順序以便顯示連續的寵物進度。
  for (const [, sim] of personEntries) {
    for (const pet of sim.pets || []) {
      const petId = pet?.gameData?.simId;
      if (petId && !pet.gameAvatar) petEntries.push([pet, petId]);
    }
  }
  const unassignedPets = Array.isArray(converted.meta?.unassignedPets)
    ? converted.meta.unassignedPets : [];
  for (const pet of unassignedPets) {
    const petId = pet?.gameData?.simId;
    if (petId && !pet.gameAvatar) petEntries.push([pet, petId]);
  }

  // 頭像總數只計算 ZIP 中實際存在、且格式可處理的圖片；
  // 沒有頭像的模擬市民仍經過原有匯入流程，但不計入圖片進度。
  const personHasPortrait = personEntries.map(([simId]) => {
    const asset = window.L1nGGameImport.getSimAvatarAsset(
      bundle, String(simId), sourceSims[String(simId)]
    );
    return !!(asset?.supported && asset.bytes);
  });
  const totalPeople = personHasPortrait.filter(Boolean).length;
  const petHasPortrait = petEntries.map(([, petId]) => {
    const asset = window.L1nGGameImport.getSimAvatarAsset(
      bundle, String(petId), sourceSims[String(petId)]
    );
    return !!(asset?.supported && asset.bytes);
  });
  const totalPets = petHasPortrait.filter(Boolean).length;
  showFileOperationStatus(
    uiText('處理模擬市民頭像') + (english ? ' (' : '（') +
      '0 / ' + totalPeople + (english ? ')' : '）'),
    25, progressTitle
  );
  const personStep = Math.max(1, Math.floor(totalPeople / 100));
  let personDone = 0;
  for (let index = 0; index < personEntries.length; index++) {
    const [simId, sim] = personEntries[index];
    await persistAsset(sim, simId);
    if (!personHasPortrait[index]) continue;
    const done = ++personDone;
    if (done % personStep === 0 || done === totalPeople) {
      showFileOperationStatus(
        uiText('處理模擬市民頭像') + (english ? ' (' : '（') +
          done + ' / ' + totalPeople + (english ? ')' : '）'),
        25 + Math.floor(50 * done / totalPeople), progressTitle
      );
    }
  }

  if (totalPets) {
    showFileOperationStatus(
      uiText('處理寵物頭像') + (english ? ' (' : '（') +
        '0 / ' + totalPets + (english ? ')' : '）'),
      75, progressTitle
    );
    const petStep = Math.max(1, Math.floor(totalPets / 100));
    let petDone = 0;
    for (let index = 0; index < petEntries.length; index++) {
      const [pet, petId] = petEntries[index];
      await persistAsset(pet, petId, 'pet');
      if (!petHasPortrait[index]) continue;
      const done = ++petDone;
      if (done % petStep === 0 || done === totalPets) {
        showFileOperationStatus(
          uiText('處理寵物頭像') + (english ? ' (' : '（') +
            done + ' / ' + totalPets + (english ? ')' : '）'),
          75 + Math.floor(13 * done / totalPets), progressTitle
        );
      }
    }
  }

  return {
    saved,
    unsupported,
    missing,
    thumDecoded,
    decodeFailed,
    decodeFailures
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

function currentGameImportUpdateAnalysis(
  incomingDatabase
) {
  return window.L1nGGameImport
    .analyzeUpdateCandidate(
      currentGenealogyData(),
      incomingDatabase
    );
}


/* ========【匯入對話框】使用共用元件渲染來源、統計與說明 ======== */
function gameImportChoiceRichContent(analysis, {canUpdate = true, continuation = false} = {}) {
  const source = analysis?.source || {};
  const state = source.verification || 'unverified';
  const leads = {
    same_slot:'已確認來自相同遊戲存檔。',
    known_save:'這份資料來自先前匯入過的遊戲存檔。',
    different_slot:'偵測到不同的遊戲存檔。',
    conflict:'ZIP 內的存檔識別資料不一致，網站無法自動確認來源。',
    unverified:'目前無法確認存檔來源，將以相同遊戲模擬市民作為更新參考。'
  };
  const meta = [];
  if (state === 'different_slot') {
    meta.push(['目前族譜', gameSaveSlotLabel(source.currentSave)]);
    meta.push(['這次匯入', gameSaveSlotLabel(source.incomingSave)]);
  } else if (state === 'same_slot' || state === 'known_save') {
    meta.push(['遊戲存檔', gameSaveSlotLabel(source.incomingSave)]);
  }
  if (source.olderImport) {
    meta.push(['目前最後匯入', formatGameImportTime(source.currentLastImportedAt)]);
    meta.push(['這次匯出', formatGameImportTime(source.incomingImportedAt)]);
  }
  const stats = analysis ? [
    ['找到相同遊戲模擬市民', analysis.matchedSimCount],
    ['這次新增模擬市民', analysis.newSimCount],
    ['這次未出現模擬市民', analysis.missingSimCount]
  ] : [];
  const paragraphs = canUpdate ? [LIFE_PHOTOS_PUBLIC
    ? '同步遊戲資料時，會保留手動排列、人生照片、自訂關係、自訂標籤、家庭封面及網站上的其他調整。'
    : '同步遊戲資料時，會保留手動排列、自訂關係、自訂標籤、家庭封面及網站上的其他調整。'] : [];
  const warnings = [];
  if (source.olderImport) {
    warnings.push('這份遊戲資料早於目前族譜最後一次匯入，更新可能會同步回較早的遊戲狀態。');
  }
  if (continuation) {
    warnings.push('如果這是「另存新檔」後繼續遊玩的存檔，可以將它視為同一族譜並繼續更新。');
  }
  if (!canUpdate) warnings.push('目前族譜已有遊戲資料，但這份 ZIP 沒有找到可安全更新的相同來源。');
  warnings.push('若以這份 ZIP 重新建立族譜，現有內容將被取代。建議先匯出 JSON 備份。');
  return {lead:leads[state] || leads.unverified, meta, stats, statsTitle:'模擬市民比對', paragraphs, warnings};
}

function gameImportUpdateRichContent(result, avatarStats) {
  const stats = result?.stats || {};
  const n = value => Number(value) || 0;
  const failed = n(avatarStats?.decodeFailed);
  return {
    lead:'已完成遊戲資料同步，網站上的自訂內容已保留。',
    sections:[
      {title:'模擬市民',items:[['相同模擬市民',n(stats.people?.matched)],
        ['新增模擬市民',n(stats.people?.added)],['本次未出現模擬市民',n(stats.people?.notSeen)]]},
      {title:'寵物',items:[['同步寵物',n(stats.pets?.matched)],['新增寵物',n(stats.pets?.added)]]},
      {title:'家族',items:[['更新家庭',n(stats.families?.matched)],['新增家庭',n(stats.families?.added)]]},
      {title:'遊戲關係',items:[['同步遊戲關係',n(stats.relationships?.matched)],
        ['新增遊戲關係',n(stats.relationships?.added)],
        ['移除已不存在的遊戲關係',n(stats.relationships?.removed)]]},
      {title:'頭像',items:[['新匯入頭像',n(avatarStats?.saved)]]}
    ],
    paragraphs:[LIFE_PHOTOS_PUBLIC
      ? '已保留：手動排列、人生照片、自訂關係、自訂標籤、家庭封面與網站手動資料。'
      : '已保留：手動排列、自訂關係、自訂標籤、家庭封面與網站手動資料。'],
    importWarning:failed ? {title:failed + ' 張遊戲頭像無法解析',description:'已略過失敗的頭像；其他族譜資料仍已完成匯入。'} : null
  };
}

function gameImportNewRichContent(sims, pets, families, portraits, gameDate, currentFamilyName, failedCount, hasActiveHousehold) {
  return {
    lead:'這次匯入的族譜資料已完成儲存。',
    sections:[{title:'本次匯入摘要',items:[
      ['模擬市民',sims],['寵物',pets],['家族',families],['頭像',portraits]
    ]}],
    meta:[...(gameDate ? [['遊戲日期',gameDate]] : []),['目前顯示',currentFamilyName]],
    paragraphs:hasActiveHousehold ? [] : ['這份 ZIP 未提供可識別的主控家庭，因此暫時顯示第一個有效 EA 家庭。此名稱不代表匯出時正在操作的家庭。'],
    importWarning:failedCount ? {title:failedCount + ' 張遊戲頭像無法解析',description:'已略過失敗的頭像；其他族譜資料仍已完成匯入。'} : null
  };
}

/* ========【匯入視窗】結構化內容為單一來源，純文字備援由同份資料產生 ======== */
function gameImportDialogText(content) {
  if (!content) return '';
  const blocks = [];
  const append = lines => {
    const visible = (lines || []).filter(value =>
      value !== null && value !== undefined && String(value).trim()
    );
    if (visible.length) blocks.push(visible.map(String).join('\n'));
  };
  const details = entries => (entries || []).map(([label, value]) =>
    String(label) + '：' + String(value ?? '')
  );
  append([content.lead]);
  append(details(content.meta));
  append([...(content.statsTitle && content.stats?.length ? [content.statsTitle] : []),
    ...details(content.stats)]);
  (content.sections || []).forEach(section => {
    if (section?.items?.length) append([section.title, ...details(section.items)]);
  });
  append(content.paragraphs);
  append(content.warnings);
  append([content.footer]);
  if (content.importWarning?.title) {
    append([content.importWarning.title, content.importWarning.description]);
  }
  return blocks.join('\n\n');
}

async function chooseGameImportMode(analysis) {
  const currentDatabase = currentGenealogyData();

  // 內建預設族譜只是示範資料，第一次匯入真正遊戲 ZIP 時直接建立新族譜。
  if (currentDatabase?.meta?.sample === true) return 'replace';

  if (!analysis || analysis.currentGameSimCount <= 0) {
    // 沒有既有遊戲來源不代表網站沒有玩家自行建立的資料。
    const pets = currentDatabase?.pets;
    const hasExistingContent =
      Object.keys(currentDatabase?.sims || {}).length > 0 ||
      (Array.isArray(pets) ? pets.length > 0 : Object.keys(pets || {}).length > 0) ||
      (currentDatabase?.families || []).some(family =>
        family?.memberIds?.length > 0 ||
        !!family?.coverImage ||
        !!String(family?.bio || '').trim()
      ) ||
      !!bgSettings?.image;
    if (!hasExistingContent) return 'replace';

    hideFileOperationStatus();
    const richContent = {
      lead:'請確認是否要取代目前族譜。',
      warnings:['目前族譜含有網站自行建立的資料，匯入這份 ZIP 將取代現有內容。建議先匯出 JSON 備份。']
    };
    const replace = await uiConfirm(gameImportDialogText(richContent), {
      title:'匯入遊戲族譜',
      kind:'danger',
      confirmText:'覆蓋現有族譜',
      backupAction:exportCurrentGenealogyBackup,
      richContent
    });
    return replace ? 'replace' : 'cancel';
  }

  hideFileOperationStatus();
  const source = analysis.source || {};
  const continuation =
    source.verification === 'different_slot' && analysis.matchedSimCount > 0;
  const sourceAllowsUpdate =
    source.verification === 'same_slot' || source.verification === 'known_save';
  const fallbackAllowsUpdate =
    (source.verification === 'unverified' || source.verification === 'conflict') &&
    analysis.matchedSimCount > 0;
  const canUpdate = continuation || sourceAllowsUpdate || fallbackAllowsUpdate;
  const richContent = gameImportChoiceRichContent(analysis, {canUpdate, continuation});
  // 操作提示也取自視窗內容，避免獨立維護第二份文字。
  const updateExplanation = richContent.paragraphs?.[0] || '';
  const replaceExplanation = richContent.warnings?.at(-1) || '';

  if (continuation) {
    return await openUiDialog({
      title:'匯入遊戲族譜',
      message:gameImportDialogText(richContent),
      mode:'choice',
      confirmText:'這是同一族譜，繼續更新',
      confirmValue:'continue_update',
      richContent,
      confirmHint:'將這個不同存檔記錄為目前族譜的延續來源，並同步最新遊戲資料。',
      secondaryText:'覆蓋現有族譜',
      secondaryValue:'replace',
      secondaryKind:'danger',
      secondaryHint:replaceExplanation,
      backupAction:exportCurrentGenealogyBackup,
      cancelText:'取消',
      cancelValue:'cancel'
    });
  }

  if (canUpdate) {
    return await openUiDialog({
      title:'匯入遊戲族譜',
      message:gameImportDialogText(richContent),
      mode:'choice',
      confirmText:'更新目前族譜',
      confirmValue:'update',
      richContent,
      confirmHint:updateExplanation,
      secondaryText:'覆蓋現有族譜',
      secondaryValue:'replace',
      secondaryKind:'danger',
      secondaryHint:replaceExplanation,
      backupAction:exportCurrentGenealogyBackup,
      cancelText:'取消',
      cancelValue:'cancel'
    });
  }

  const replace = await uiConfirm(gameImportDialogText(richContent), {
    title:'匯入遊戲族譜',
    kind:'danger',
    confirmText:'覆蓋現有族譜',
    cancelText:'取消',
    richContent,
    backupAction:exportCurrentGenealogyBackup
  });
  return replace ? 'replace' : 'cancel';
}

async function importGameGenealogy(file) {
  let diagnosticStage='read-zip';
  try {
    if (!window.L1nGGameImport) {
      throw new Error('找不到遊戲族譜匯入模組。');
    }

    showFileOperationStatus('讀取並檢查 ZIP 檔案……', 0, '匯入遊戲族譜');
    await waitForFileOperationPaint();

    const bundle = await window.L1nGGameImport.parseFile(file);

    showFileOperationStatus('整理模擬市民、寵物、家族與家庭關係……', 12, '匯入遊戲族譜');
    await waitForFileOperationPaint();

    diagnosticStage='convert-bundle';
    const converted =
      window.L1nGGameImport
        .convertBundle(bundle);

    showFileOperationStatus('比對遊戲存檔與現有族譜資料……', 22, '匯入遊戲族譜');
    await waitForFileOperationPaint();

    diagnosticStage='compare-save-source';
    const analysis =
      currentGameImportUpdateAnalysis(
        converted
      );

    const importMode =
      await chooseGameImportMode(
        analysis
      );

    if (importMode === 'cancel') {
      hideFileOperationStatus();
      return;
    }

    const isUpdate = importMode === 'update' || importMode === 'continue_update';
    const progressTitle = isUpdate ? '更新遊戲族譜' : '匯入遊戲族譜';
    showFileOperationStatus('準備處理匯入頭像……', 24, progressTitle);
    await waitForFileOperationPaint();

    diagnosticStage='persist-avatars';
    const avatarStats =
      await persistGameImportAvatars(
        bundle,
        converted,
        importMode
      );

    console.info('[遊戲 ZIP 頭像] 匯入摘要：', avatarStats);

    showFileOperationStatus('整理匯入資料並準備儲存……', 88, progressTitle);
    await waitForFileOperationPaint();

    diagnosticStage='prepare-database';
    const incomingPrepared =
      prepareDatabase(
        converted
      ).prepared;

    let updateResult = null;
    let nextDatabase =
      incomingPrepared;

    if (isUpdate) {
      showFileOperationStatus(
        '合併最新遊戲資料，保留網站上的手動修改……',
        91, progressTitle
      );
      await waitForFileOperationPaint();

      diagnosticStage='merge-database';
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

    showFileOperationStatus(
      '儲存資料並更新家族清單與族譜畫布……',
      95, progressTitle
    );
    await waitForFileOperationPaint();

    diagnosticStage='apply-database';
    replaceCanonicalGenealogyDatabase(
      nextDatabase
    );
    reconcileImportedFamilyView({ defaultToHousehold:!isUpdate });

    // 整庫替換後清掉舊操作中的暫態狀態，但「更新」本身已保留資料庫內的手動排列。
    dragHistory.clear();
    clearNodeSelection();
    finishMarquee();

    labelDrag = null;
    genealogyViewport.cancelPan();

    arrangeTool = 'pan';

    diagnosticStage='persist-workspace';
    save({ immediate:true });
    // 原本的成功提示只代表內存已更新；必須確認重新整理時能讀回完整資料。
    await workspaceWritePending;
    const expectedSave = genealogyStore.serializeDatabase();
    const savedLocation = localStorage.getItem(STORE_KEY);
    const restoredSave = savedLocation === WORKSPACE_IDB_MARKER
      ? await assetStore.loadWorkspaceData()
      : savedLocation;
    if (restoredSave !== expectedSave) {
      throw new Error('遊戲族譜尚未成功保存至瀏覽器，請先匯出 JSON 備份，不要重新整理網頁。');
    }

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

    const activeEntry=getActiveFamilySelectorEntry(familyTreeViewMode);
    // 摘要須反映實際畫面，不能把缺少主控標記的第一筆家族誤稱為主控。
    const activeFamilyName=activeEntry?.label ||
      (activeFamily ? displayDataText(activeFamily.name,activeFamily) : '—');

    const importedGameDate =
      formatGameDate(
        converted?.meta
          ?.realDateCurrentDate
      );

    showFileOperationStatus(
      '所有資料已處理完成！',
      100,
      isUpdate ? '遊戲族譜更新完成' : '遊戲族譜匯入完成'
    );
    await waitForFileOperationPaint();
    hideFileOperationStatus();

    if (isUpdate) {
      const richContent = gameImportUpdateRichContent(updateResult, avatarStats);
      const diagnosticReport=makeGenealogyImportDiagnostic({
        source:'game-zip',stage:'avatar-conversion',file,
        failures:avatarStats.decodeFailures || [],
        counts:{saved:avatarStats.saved,decodeFailed:avatarStats.decodeFailed,
          unsupported:avatarStats.unsupported,missing:avatarStats.missing}
      });
      const detailOptions=(avatarStats.decodeFailures || []).length
        ? genealogyImportDetailOptions(diagnosticReport,avatarStats.decodeFailures)
        : null;
      await uiAlert(gameImportDialogText(richContent), {
        title:'遊戲族譜更新完成',
        kind:'success',
        richContent,
        confirmText:'查看族譜',
        details:detailOptions
      });
    } else {
      const diagnosticReport=makeGenealogyImportDiagnostic({
        source:'game-zip',stage:'avatar-conversion',file,
        failures:avatarStats.decodeFailures || [],
        counts:{saved:avatarStats.saved,decodeFailed:avatarStats.decodeFailed,
          unsupported:avatarStats.unsupported,missing:avatarStats.missing}
      });
      const detailOptions=(avatarStats.decodeFailures || []).length
        ? genealogyImportDetailOptions(diagnosticReport,avatarStats.decodeFailures)
        : null;
      const richContent = gameImportNewRichContent(
        simCount, petCount, familyCount, avatarStats.saved,
        importedGameDate, activeFamilyName, avatarStats.decodeFailed,
        (converted.families || []).some(family =>
          family?.gameData?.isActiveHousehold === true
        )
      );
      await uiAlert(gameImportDialogText(richContent), {
        title:'遊戲族譜匯入完成',
        kind:'success',
        richContent,
        confirmText:'查看族譜',
        details:detailOptions
      });
    }

    // 完成後主動讓玩家看見家族清單。
    if (window.innerWidth <= 720) {
      openSidebar();
    } else {
      setFamilyPanelCollapsed(false);
    }

  } catch (err) {
    hideFileOperationStatus();

    console.error('[遊戲族譜匯入]', err);

    await showGenealogyImportError(err,{source:'game-zip',stage:diagnosticStage,file});
  }
}


// ========【畫布檔案拖曳匯入】 JSON 備份 / 遊戲族譜 ZIP 可直接拖到畫布讀取 ========
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
    await importJSON(file);
    return;
  }

  await uiAlert(
    '不支援這個檔案。請使用遊戲族譜 ZIP 或 JSON 備份。',
    { title: '不支援的檔案', kind: 'default' }
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
      { title: '請一次選擇一個檔案', kind: 'default' }
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

async function savePersonEditorFromUi() {
  try {
    const before=captureCanonicalHistory();
  if (!before) return;
    const result=await withActionButtonLoading(
      $('simEditorSaveButton'),
      '儲存中',
      () => personEditor.commit()
    );
    recordCanonicalHistory(before);
    return result;
  } catch (error) {
    console.error(
      '[Genealogy] Person editor save failed.',
      error
    );

    await uiAlert(
      '模擬市民資料儲存失敗：' +
        (
          error?.message ||
          '未知錯誤'
        ),
      {
        title:'儲存失敗',
        kind:'danger'
      }
    );

    return null;
  }
}

$('addNewSimButton').onclick = () => personEditor.open(null);
$('simEditorCancelButton').onclick = personEditor.close;
$('simEditorSaveButton').onclick = () => {
  void savePersonEditorFromUi();
};
$('simEditorDeleteButton').onclick = () => simEditorState.simId && deleteChar(simEditorState.simId);
mask.onclick = e => { if (e.target === mask) personEditor.close(); };

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const modifier = e.ctrlKey || e.metaKey;

  if (e.code === 'Space' && genealogyFocus.isCanvasShortcutTarget(e.target) && !hasBlockingGenealogyDialog() && genealogyScene.isFreeLayoutActive(currentFamily()) && arrangeTool === 'select') {
    spacePanHeld = true;
    updateArrangeToolUI();
    e.preventDefault();
  }

  if (modifier && key === 'a' && genealogyFocus.isCanvasShortcutTarget(e.target) && !hasBlockingGenealogyDialog() && genealogyScene.isFreeLayoutActive(currentFamily()) && arrangeTool === 'select') {
    selectVisibleNodes();
    e.preventDefault();
    return;
  }

  // 畫布歷史不干擾輸入框及其他視窗自己的 Ctrl / Cmd + Z。
  if (modifier && !isNativeTextUndoTarget(e.target) && !hasBlockingGenealogyDialog() && genealogyFocus.isCanvasShortcutTarget(e.target)) {
    const isUndoShortcut =
      key === 'z' &&
      !e.shiftKey;

    const isRedoShortcut =
      (key === 'z' && e.shiftKey) ||
      key === 'y';

    if ((isUndoShortcut || isRedoShortcut) && e.repeat) {
      // 鍵盤長按會連續送出 keydown；一次實際按鍵只允許退回／重做一筆歷史。
      e.preventDefault();
      return;
    }

    if (isUndoShortcut) {
      if (dragHistory.undo()) e.preventDefault();
      return;
    }

    if (isRedoShortcut) {
      if (dragHistory.redo()) e.preventDefault();
      return;
    }
  }

  if (!modifier && !e.altKey && !e.isComposing && genealogyFocus.isCanvasShortcutTarget(e.target) && !hasBlockingGenealogyDialog()) {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key) && nudgeSelectedCanvasCards(e)) {
      e.preventDefault();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedNodeIds.size || selectedPetIds.size)) {
      e.preventDefault();
      if (!e.repeat) deleteSelectedCanvasCards();
      return;
    }
    if (e.key === '+' || e.code === 'NumpadAdd') {
      e.preventDefault();
      const p=zoomCenter();
      genealogyViewport.zoomAt(p.x,p.y,1.16);
      return;
    }
    if (e.key === '-' || e.code === 'NumpadSubtract') {
      e.preventDefault();
      const p=zoomCenter();
      genealogyViewport.zoomAt(p.x,p.y,1/1.16);
      return;
    }
  }

  if (e.key === 'Escape') {
    if (e.defaultPrevented || genealogyFocus.top()) return;
    if (!closeTopModal() && (selectedNodeIds.size || selectedPetIds.size)) clearNodeSelection();
    return;
  }
  if (lifePhotoViewerDialog.classList.contains('show')) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); lifePhotoWorkspace.moveViewer(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); lifePhotoWorkspace.moveViewer(1); return; }
  }
  // 編輯視窗內使用 Ctrl/Cmd + S 快速儲存；一般頁面不攔截瀏覽器快捷鍵。
  if (modifier && key === 's' && !e.altKey) {
    const lifePhotoOpen = lifePhotoEditorDialog.classList.contains('show');
    const petEditorOpen = petEditorDialog.classList.contains('show');
    const personEditorOpen = mask.classList.contains('show');
    const nestedDialogOpen=avatarCropDialog.classList.contains('show') ||
      !!document.querySelector('.ui-dialog-mask.show');
    if (!nestedDialogOpen && (lifePhotoOpen || petEditorOpen || personEditorOpen)) {
      e.preventDefault();
      if (e.repeat) return;
      if (lifePhotoOpen) lifePhotoWorkspace.commitEditor();
      else if (petEditorOpen) petEditorController.commit();
      else void savePersonEditorFromUi();
      return;
    }
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

  const before=captureCanonicalHistory();
  if (!before) return;
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
  renderRelationshipAnnotations(c.id);

  applyGenealogyMutation(mutation);
  recordCanonicalHistory(before);
};

// ========【寵物卡互動】 檢視沿用模擬市民個人資料視窗；編輯沿用既有寵物編輯器 ========
function petCanvasOwnerIndex(entry) {
  const owner = currentGenealogyData()?.sims?.[entry?.ownerId];
  if (!owner || !Array.isArray(owner.pets)) return -1;
  const petId = String(entry.pet?.gameData?.simId || entry.pet?.id || '');
  return owner.pets.findIndex(pet =>
    String(pet.gameData?.simId || pet.id || '') === petId
  );
}

function openPetEditorFromCanvas(entry) {
  return petEditorController.openDirect(entry);
}

function resolvePetHouseholdName(entry) {
  const data = currentGenealogyData();
  const pet = entry?.pet;
  const owner = data?.sims?.[entry?.ownerId] || null;
  const importedName = String(pet?.gameData?.householdName || '').trim();
  if (importedName) return displayDataText(importedName, owner);
  const householdId = pet?.gameData?.householdId == null ? '' : String(pet.gameData.householdId);
  if (householdId) {
    const family = (data?.families || []).find(candidate =>
      candidate?.gameData?.householdId != null &&
      String(candidate.gameData.householdId) === householdId
    );
    if (family) return displayDataText(family.name, family);
  }
  if (owner && !householdId) {
    const family = (data?.families || []).find(item =>
      (item.memberIds || []).some(id => String(id) === String(owner.id))
    );
    if (family) return displayDataText(family.name, family);
  }
  return uiText('家庭未知');
}

function openPetProfileFromCanvas(entry) {
  const pet = entry.pet;
  const owner = currentGenealogyData()?.sims?.[entry.ownerId] || null;
  const name = displayDataText(pet.name,owner) || uiText('（未命名）');
  const avatar = petAvatarWithFallbackHTML(pet);
  const petId = String(pet.gameData?.simId || pet.id || '');
  const ownerNames = Object.values(currentGenealogyData()?.sims || {}).filter(sim =>
    (sim.pets || []).some(item => String(item?.gameData?.simId || item?.id || '') === petId)
  ).map(sim => displayDataText(sim.name,sim)).filter(Boolean);
  const petGender = normalizePetGender(pet.gender);
  const petStatus = pet.status || '在世';
  const petStatusIcon = petStatus === '幽靈' ? 'ghost-symbol'
    : petStatus === '已故' ? 'tombstone' : 'heart';
  const petSpecies = PET_SPECIES[pet.species] || PET_SPECIES.other;
  const metaItems = [
    pet.ageStage ? '<span class="stage-tag stage-' + esc(pet.ageStage) + '">' +
      esc(uiText(pet.ageStage)) + '</span>' : '',
    petGender ? '<span class="meta-pill">' +
      iconSvg(petGender === 'male' ? 'gender-male' : 'gender-female') +
      '<span>' + esc(petGenderLabel(pet)) + '</span></span>' : '',
    '<span class="meta-pill">' + iconSvg(petStatusIcon) +
      '<span>' + esc(uiText(petStatus)) + '</span></span>',
    '<span class="meta-pill">' + iconSvg(petSpecies.icon) +
      '<span>' + esc(formatPetSpecies(pet)) + '</span></span>'
  ].filter(Boolean);
  const facts = [
    [uiText('品種'),displayDataText(pet.breed,owner)],
    [uiText('所屬家庭'),resolvePetHouseholdName(entry)],
    [uiText('飼主'),ownerNames.join('、') || '—']
  ].filter(([,value]) => !!value);
  const traitMarkup = (pet.traits || []).map(trait => displayDataText(trait,owner))
    .filter(Boolean).map(trait => `<span class="tag">${esc(trait)}</span>`).join('');
  const factsMarkup = facts.map(([label,value]) => renderPersonProfileRow(label,esc(value))).join('') +
    renderPersonProfileRow(uiText('特徵'),'<div class="person-profile-traits">' + (traitMarkup || '—') + '</div>');
  const lineageMarkup = petLineageHTML(pet, { profileRows:true });
  const notes = displayDataText(pet.notes || '',owner).trim();
  $('personProfileContent').innerHTML = `
    <div class="person-profile-header">
      <div class="person-profile-avatar person-profile-pet-main-avatar">${avatar}</div>
      <div class="person-profile-header-text">
        <div class="person-profile-name-row"><span class="person-profile-name">${esc(name)}</span></div>
        <div class="person-profile-meta">${metaItems.join('')}</div>
      </div>
    </div>
    <div class="person-profile-body">
      <section class="person-profile-section">
        <h3 class="person-profile-section-title">${esc(uiText('基本資料'))}</h3>
        <div class="person-profile-list">${factsMarkup || '—'}</div>
      </section>
      <section class="person-profile-section">
        <h3 class="person-profile-section-title">${esc(uiText('血統'))}</h3>
        ${lineageMarkup}
      </section>
      <section class="person-profile-section">
        <h3 class="person-profile-section-title">${esc(uiText('備註'))}</h3>
        <div class="person-profile-notes">${notes ? esc(notes) : '—'}</div>
      </section>
    </div>`;
  personProfilePersonId = null;
  personProfilePetTarget = entry;
  $('personProfileEditBtn').style.display = '';
  personProfileDialog.classList.add('pet-profile-open');
  personProfileDialog.classList.add('show');
}


// ========【寵物右鍵選單】 沿用模擬市民選單外觀，操作僅指向寵物 ========
function findCanvasPetEntry(key) {
  return getSceneLayout()?.petLayout?.cards?.find(entry => entry.key === String(key)) || null;
}

function focusPetOnCanvas(entry) {
  if (!entry) return;
  genealogyViewport.focusWorldPoint(entry.x + PAD + entry.width/2,entry.y + PAD + entry.height/2,{minFocusScale:0.72});
  const element = [...petCardsLayer.querySelectorAll('.genealogy-pet-card[data-pet-id]')]
    .find(el => el.dataset.petId === entry.key);
  if (element) {
    element.classList.remove('focus-pulse');
    void element.offsetWidth;
    element.classList.add('focus-pulse');
    window.setTimeout(() => element.classList.remove('focus-pulse'),1100);
  }
}

function renderPetCardMenu(entry,clientX,clientY) {
  if (!personCardMenu || !entry) return;
  const owner = currentGenealogyData()?.sims?.[entry.ownerId] || null;
  const title = displayDataText(entry.pet?.name,owner) || uiText('（未命名）');
  const editable = petCanvasOwnerIndex(entry) >= 0;
  const settings = getPetCardSettings();
  const fieldRows = [
    ['name','姓名'],['species','物種'],['breed','品種'],['gender','性別'],
    ['ageStage','年齡階段'],['status','狀態'],['traits','特徵'],['owners','飼主']
  ].map(([key,label]) =>
    `<label class="person-card-menu-check"><input type="checkbox" data-pet-card-field="${key}" ${settings[key] ? 'checked' : ''}><span>${esc(uiText(label))}</span></label>`
  ).join('');
  const appearanceSection = viewMode === 'edit' ? '' : `
    <div class="person-card-menu-divider"></div>
    <div class="person-card-menu-section-title">${esc(uiText('檢視卡片外觀'))}</div>
    <label class="person-card-menu-radio"><input type="radio" name="petCardAppearance" value="minimal" ${settings.appearance === 'minimal' ? 'checked' : ''}><span>${esc(uiText('極簡'))}</span></label>
    <label class="person-card-menu-radio"><input type="radio" name="petCardAppearance" value="translucent" ${settings.appearance === 'translucent' ? 'checked' : ''}><span>${esc(uiText('半透明'))}</span></label>
    <label class="person-card-menu-radio"><input type="radio" name="petCardAppearance" value="full" ${settings.appearance === 'full' ? 'checked' : ''}><span>${esc(uiText('完整卡片'))}</span></label>`;
  personCardMenu.innerHTML = `
    <div class="person-card-menu-title">${esc(title)}</div>
    <button class="person-card-menu-action" type="button" data-pet-card-menu-action="view">${iconSvg('person-vcard')}<span>${esc(uiText('查看寵物資料'))}</span></button>
    <button class="person-card-menu-action" type="button" data-pet-card-menu-action="edit">${iconSvg('pencil-square')}<span>${esc(uiText('編輯寵物'))}</span></button>
    <button class="person-card-menu-action" type="button" data-pet-card-menu-action="locate">${iconSvg('crosshair')}<span>${esc(uiText('在族譜中定位'))}</span></button>
    <div class="person-card-menu-divider"></div>
    <div class="person-card-menu-section-title">${esc(uiText(viewMode === 'edit' ? '編輯模式顯示內容' : '檢視模式顯示內容'))}</div>
    <div class="person-card-menu-grid">
      <label class="person-card-menu-check fixed"><input type="checkbox" checked disabled><span>${esc(uiText('頭像'))}</span></label>
      ${fieldRows}
    </div>
    ${appearanceSection}
    <div class="person-card-menu-note">${esc(uiText(viewMode === 'edit' ? '只套用於編輯模式寵物卡' : '只套用於檢視模式寵物卡'))}</div>
  `;
  delete personCardMenu.dataset.simId;
  personCardMenu.dataset.petId = entry.key;
  personCardMenu.dataset.cardMode = viewMode;
  personCardMenu.classList.add('show');
  personCardMenu.setAttribute('aria-hidden','false');
  positionPersonCardMenu(clientX,clientY);
}

function handlePetCardMenuAction(action,key) {
  const entry = findCanvasPetEntry(key);
  if (!entry) {closePersonCardMenu();return;}
  closePersonCardMenu();
  if (action === 'view') { openPetProfileFromCanvas(entry); return; }
  if (action === 'edit') { openPetEditorFromCanvas(entry); return; }
  if (action === 'locate') { focusPetOnCanvas(entry); return; }
}

// ========【寵物卡操作】 PointerUp 啟用觸控／滑鼠卡片；Click 保留鍵盤啟用 ========
function activatePetCanvasCard(id, additive = false) {
  const card = getSceneLayout()?.petLayout?.cards?.find(entry => entry.key === id);
  if (!card) return false;

  if (arrangeTool === 'select' && !spacePanHeld) {
    if (!additive) {
      selectedNodeIds.clear();
      selectedPetIds.clear();
      selectedPetIds.add(id);
    } else if (selectedPetIds.has(id)) {
      selectedPetIds.delete(id);
    } else {
      selectedPetIds.add(id);
    }
    syncNodeSelectionClasses();
    return true;
  }

  if (viewMode === 'edit' && openPetEditorFromCanvas(card)) return true;
  openPetProfileFromCanvas(card);
  return true;
}

let lastPetPointerActivation = null;
let activePetTouchDragPointerId = null;
let lastPetTouchPressAt = -Infinity;
petCardsLayer?.addEventListener('load',markPetAvatarLoaded,true);
petCardsLayer?.addEventListener('error',markPetAvatarError,true);
nodes?.addEventListener('load',markPetAvatarLoaded,true);
nodes?.addEventListener('error',markPetAvatarError,true);
$('familyCoverCollage')?.addEventListener('load',markPetAvatarLoaded,true);
$('familyCoverCollage')?.addEventListener('error',markPetAvatarError,true);
personProfileDialog?.addEventListener('load',markPetAvatarLoaded,true);
personProfileDialog?.addEventListener('error',markPetAvatarError,true);
petCardsLayer?.addEventListener('contextmenu',event => {
  const cardElement = event.target.closest('.genealogy-pet-card[data-pet-id]');
  if (!cardElement) return;
  event.preventDefault();
  event.stopPropagation();
  // 觸控長按由共用 520ms 選單處理，略過 Safari 額外合成的 contextmenu。
  if (event.pointerType === 'touch' || activePetTouchDragPointerId !== null ||
      performance.now() - lastPetTouchPressAt < 1100) return;
  const entry = findCanvasPetEntry(cardElement.dataset.petId);
  if (entry) renderPetCardMenu(entry,event.clientX,event.clientY);
});
petCardsLayer?.addEventListener('keydown',event => {
  const cardElement = event.target.closest('.genealogy-pet-card[data-pet-id]');
  if (!cardElement || !(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) return;
  event.preventDefault();
  event.stopPropagation();
  const entry = findCanvasPetEntry(cardElement.dataset.petId);
  const box = cardElement.getBoundingClientRect();
  if (entry) renderPetCardMenu(entry,box.left+Math.min(box.width,40),box.top+Math.min(box.height,40));
});

// 與市民卡片一致：點擊開資料，移動超過 3px（觸控 8px）直接啟動拖曳；不等待長按。
// 手勢只由同一組 PointerDown/Move/Up 收尾，避免 pointerup/click 重複執行。
petCardsLayer?.addEventListener('pointerdown', event => {
  const element = event.target.closest('.genealogy-pet-card[data-pet-id]');
  if (!element || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const entry = findCanvasPetEntry(element.dataset.petId);
  if (!entry) return;
  // 拖曳工具下 Shift + 點擊只切換選取，不開啟寵物視窗。
  if (event.shiftKey && arrangeTool !== 'select') {
    event.preventDefault();
    event.stopPropagation();
    // 指標選取只更新選取狀態，不主動移動鍵盤焦點。
    if (selectedPetIds.has(entry.key)) selectedPetIds.delete(entry.key);
    else selectedPetIds.add(entry.key);
    syncNodeSelectionClasses();
    lastPetPointerActivation = {id:entry.key,time:performance.now()};
    return;
  }
  const fam = currentFamily();
  // 與模擬市民一致：已解鎖時，自動/自由排列都可開始手動拖曳。
  const canDrag = !!(fam && !fam.locked && !spacePanHeld);
  const mode = viewMode;
  const origin = {x:entry.x,y:entry.y};
  const groupDrag = !!(canDrag && genealogyScene.isFreeLayoutActive(fam) &&
    arrangeTool === 'select' && selectedPetIds.has(entry.key) &&
    selectedPetIds.size + selectedNodeIds.size > 1);
  const groupPets = groupDrag ? getSelectedPetDragPositions(fam) : new Map();
  const groupSims = new Map();
  if (groupDrag) selectedNodeIds.forEach(id => {
    const pos = fam.manualPositions?.[id] || getSceneLayout()?.pos?.get(id);
    if (pos) groupSims.set(id,{x:pos.x,y:pos.y});
  });
  const before = canDrag ? captureLayoutHistoryState(fam) : null;
  const isTouch = event.pointerType === 'touch';
  if (isTouch) {
    activePetTouchDragPointerId = event.pointerId;
    lastPetTouchPressAt = performance.now();
  }
  const dragThreshold = isTouch ? TOUCH_DRAG_THRESHOLD_PX : 3;
  const tapAllowance = isTouch ? TOUCH_DRAG_THRESHOLD_PX : 5;
  // 在手勢開始時固定模擬市民對齊目標；移動過程不再反覆取 Scene/遍歷 Map。
  const personSnapTargets = [...(getSceneLayout()?.pos?.values() || [])];
  let moved = false, gestureBlocked = false;
  let previewPosition = null;
  let previewGroupPositions = null;
  // 防止瀏覽器原生圖像拖曳；游標離開卡片仍維持追蹤。
  event.preventDefault();
  event.stopPropagation();
  try { element.setPointerCapture?.(event.pointerId); } catch (_) {}
  const movement = ev => Math.hypot(ev.clientX-event.clientX,ev.clientY-event.clientY);
  const clear = () => {
    moveFrame?.cancel?.();
    document.removeEventListener('pointermove',onMove);
    document.removeEventListener('pointerup',onFinish);
    document.removeEventListener('pointercancel',onFinish);
    element.classList.remove('dragging');
    if (groupDrag) {
      markSelectedPetDragging(groupPets,false);
      groupSims.forEach((_,id) =>
        nodes.querySelector('.person-card[data-id="' + CSS.escape(id) + '"]')
          ?.classList.remove('dragging'));
    }
    hideSmartGuides();
  };
  // 與市民卡片一致，將多次 PointerMove 合併到同一個動畫幀。
  const applyMove = point => {
    const worldDelta = genealogyViewport.screenDeltaToWorld(
      point.clientX-event.clientX,
      point.clientY-event.clientY
    );
    if (groupDrag) {
      const positions = {};
      groupSims.forEach((start,id) => {
        const next = {x:Math.max(0,start.x+worldDelta.x),y:Math.max(0,start.y+worldDelta.y)};
        positions[id] = next;
        genealogyScene.updateTransientPersonPosition(id,next);
        const el = nodes.querySelector('.person-card[data-id="' + CSS.escape(id) + '"]');
        if (el) {
          el.style.left = (next.x+PAD)+'px';
          el.style.top = (next.y+PAD)+'px';
        }
      });
      previewSelectedPetDrag(groupPets,worldDelta.x,worldDelta.y,positions);
      previewGroupPositions = positions;
      genealogyScene?.updateRelationshipPreviewImmediately?.([...groupSims.keys()]);
      hideSmartGuides();
      return;
    }
    const rawX = Math.max(0,origin.x+worldDelta.x);
    const rawY = Math.max(0,origin.y+worldDelta.y);
    const threshold = genealogyViewport.screenPixelsToWorld(8);
    let guideX = null, guideY = null;
    let nearestX = threshold, nearestY = threshold;
    for (const target of personSnapTargets) {
      const diffX = Math.abs(target.x-rawX);
      const diffY = Math.abs(target.y-rawY);
      if (diffX < nearestX) {nearestX=diffX;guideX=target.x;}
      if (diffY < nearestY) {nearestY=diffY;guideY=target.y;}
    }
    previewPosition = {x:Math.max(0,guideX ?? rawX),y:Math.max(0,guideY ?? rawY)};
    element.style.left = (previewPosition.x+PAD)+'px';
    element.style.top = (previewPosition.y+PAD)+'px';
    hideSmartGuides();
    if (guideX !== null) showSmartGuide('x',guideX);
    if (guideY !== null) showSmartGuide('y',guideY);
  };
  const moveFrame = genealogyInteraction?.createFrameScheduler?.(applyMove) || null;
  const onMove = ev => {
    if (ev.pointerId !== event.pointerId) return;
    // 雙指手勢只縮放畫布，絕不觸發寵物拖曳。
    if (isTouch && (activeTouchPointers.size !== 1 ||
      activeTouchPointers.get(event.pointerId)?.blocked ||
      touchCardActivationSuppressed.has(event.pointerId))) {
      gestureBlocked = true;
      moveFrame?.cancel?.();
      return;
    }
    if (!canDrag || gestureBlocked) return;
    if (!moved && movement(ev) <= dragThreshold) return;
    moved = true;
    element.classList.add('dragging');
    if (groupDrag) {
      markSelectedPetDragging(groupPets,true);
      groupSims.forEach((_,id) =>
        nodes.querySelector('.person-card[data-id="' + CSS.escape(id) + '"]')
          ?.classList.add('dragging'));
    } else if (genealogyScene.isFreeLayoutActive(fam) && arrangeTool === 'select' &&
      !selectedPetIds.has(entry.key)) {
      clearNodeSelection();
      selectedPetIds.add(entry.key);
      syncNodeSelectionClasses();
    }
    const point = {clientX:ev.clientX,clientY:ev.clientY};
    if (moveFrame) moveFrame.push(point);
    else applyMove(point);
    ev.preventDefault?.();
  };
  const onFinish = ev => {
    if (ev.pointerId !== event.pointerId) return;
    const cancelled = gestureBlocked || ev.type === 'pointercancel' ||
      (isTouch && touchCardActivationSuppressed.has(event.pointerId));
    // 寫入前補齊最後一幀，避免放開時位置落後指標；取消時丟棄預覽。
    if (!cancelled) moveFrame?.flush?.();
    const tap = !cancelled && !moved && movement(ev) <= tapAllowance;
    clear();
    if (isTouch && activePetTouchDragPointerId === ev.pointerId)
      activePetTouchDragPointerId = null;
    // 阻止 pointerup 之後瀏覽器合成的 click 重新開啟視窗。
    lastPetPointerActivation = {id:entry.key,time:performance.now()};
    if (moved && (groupDrag ? previewGroupPositions : previewPosition) && !cancelled) {
      const seed = fam.freeLayout ? null : seedVisibleScenePositionsForFreeLayout(fam);
      const change = groupDrag
        ? genealogyStore.setNodePositions(fam.id,previewGroupPositions)
        : genealogyStore.setNodePosition(fam.id,'pet:'+entry.key,previewPosition);
      // 讓排版重算排到下一幀，避免 pointerup 同步重建整張族譜。
      applyGenealogyMutation(genealogyStore.mergeResults(seed,change),{immediateRender:false});
      syncLayoutModeControls();
      dragHistory.push({type:'card-layout',familyId:fam.id,
        before,after:captureLayoutHistoryState(fam)});
    } else {
      if (moved && groupDrag) {
        groupSims.forEach((start,id) => {
          genealogyScene.updateTransientPersonPosition(id,start);
          const el = nodes.querySelector('.person-card[data-id="' + CSS.escape(id) + '"]');
          if (el) { el.style.left = (start.x+PAD)+'px'; el.style.top = (start.y+PAD)+'px'; }
        });
        previewSelectedPetDrag(groupPets,0,0,{});
        genealogyScene?.updateRelationshipPreviewImmediately?.([...groupSims.keys()]);
      }
      if (moved) {
        element.style.left = (origin.x+PAD)+'px';
        element.style.top = (origin.y+PAD)+'px';
      }
      if (tap) activatePetCanvasCard(entry.key,ev.shiftKey);
    }
    try {
      if (element.hasPointerCapture?.(ev.pointerId)) element.releasePointerCapture(ev.pointerId);
    } catch (_) {}
  };
  document.addEventListener('pointermove',onMove);
  document.addEventListener('pointerup',onFinish);
  document.addEventListener('pointercancel',onFinish);
});
petCardsLayer?.addEventListener('click', event => {
  const element = event.target.closest('.genealogy-pet-card[data-pet-id]');
  if (!element) return;
  event.stopPropagation();
  const id = element.dataset.petId;
  if (lastPetPointerActivation?.id === id &&
      performance.now()-lastPetPointerActivation.time < 900) {
    lastPetPointerActivation = null;
    return;
  }
  // 鍵盤啟用或無 Pointer Events 的瀏覽器保留 Click。
  activatePetCanvasCard(id,event.shiftKey);
});

// ========【頂部篩選】 狀態、性別、種族與年齡階段篩選 ========
function applyTopbarFilters() {
  updateTopbarFilterUI();
  // 畫布與側欄都由 getVisibleIds() 決定顯示模擬市民；篩選後一併刷新。
  refreshFamilyProfilePanel();
  render();
}

[
  ...statusFilterInputs,
  ...genderFilterInputs,
  ...raceFilterInputs,
  ...lifeStageFilterInputs,
  petVisibilityFilter
].filter(Boolean).forEach(input => {
  input.addEventListener('change', applyTopbarFilters);
});

$('filterResetBtn')?.addEventListener('click', event => {
  event.preventDefault();

  [
    ...statusFilterInputs,
    ...genderFilterInputs,
    ...raceFilterInputs,
    ...lifeStageFilterInputs,
    petVisibilityFilter
  ].filter(Boolean).forEach(input => {
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
if (exportJsonBtn) exportJsonBtn.onclick = async () => {
  exportJsonBtn.disabled = true;
  if (exportImageBtn) exportImageBtn.disabled = true;
  try {
    await exportCurrentGenealogyBackup();
    closeExportPanel();
    uiToast('JSON 備份匯出完成');
  } catch (err) {
    hideFileOperationStatus();
    console.error('[JSON 備份匯出]', err);
    await uiAlert('匯出失敗：' + (err?.message || '未知錯誤'), { title:'匯出失敗', kind:'danger' });
  } finally {
    hideFileOperationStatus();
    exportJsonBtn.disabled = false;
    if (exportImageBtn) exportImageBtn.disabled = false;
  }
};
if (exportImageBtn) exportImageBtn.onclick = async () => {
  exportImageBtn.disabled = true;
  if (exportJsonBtn) exportJsonBtn.disabled = true;
  try {
    showFileOperationStatus('準備族譜畫布……', null, '匯出族譜圖片');
    await waitForFileOperationPaint();
    await exportGenealogyImage(getSelectedExportImageSize(), getSelectedExportBackgroundMode());
    showFileOperationStatus('所有資料已處理完成！', 100, '匯出族譜圖片');
    await waitForFileOperationPaint();
    hideFileOperationStatus();
    closeExportPanel();
    uiToast('族譜圖片匯出完成');
  } catch (err) {
    hideFileOperationStatus();
    console.error('[族譜圖片匯出]', err);
    await uiAlert(`族譜圖片匯出失敗：${err?.message || '未知錯誤'}`, { title:'族譜圖片匯出失敗', kind:'danger' });
  } finally {
    hideFileOperationStatus();
    exportImageBtn.disabled = false;
    if (exportJsonBtn) exportJsonBtn.disabled = false;
  }
};
$('jsonBackupFileInput').onchange = async e => {
  const f = e.target.files[0];
  if (f) await importJSON(f);
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

// ========【全站載入骨架】 完成初始資料與圖片載入後一次移除 ========
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

  let savedLabelLock = true;
  try {
    savedLabelLock = localStorage.getItem(LABEL_LOCK_KEY) !== '0';
  } catch (_) {}
  setRelationshipLabelLock(savedLabelLock);

  try {
    showRelLabels =
      localStorage.getItem(
        LABELS_KEY
      ) !== '0';
  } catch (_) {
    showRelLabels = true;
  }

  const labelButton =
    $('relationshipLabelsVisibilityToggle');

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

// 內建範例的圖片在檔案中提供，首次載入與恢復預設時匯入既有 Blob 資產庫。
async function ensureSamplePortraitAssets(database, { onProgress = null } = {}) {
  if (!database?.meta?.sample || Number(database.meta.sampleVersion) !== 11) return false;

  // 只處理內建 82 位模擬市民與 6 隻寵物，不覆蓋玩家後來自行新增的角色。
  const baseline = buildDefaultGenealogyData();
  const prefix = 'assets/sample-portraits/';
  const sharedPath = prefix + 'shared_unknown.png';
  const items = new Map();
  for (const [id,original] of Object.entries(baseline.sims)) {
    const sim = database.sims?.[id];
    if (!sim) continue;
    const path = original.gameData?.recordState === 'family_tree_only'
      ? sharedPath : prefix + id + '.png';
    items.set('sim:' + id, { person:sim, path, isSim:true });
  }
  const samplePetIds = new Set([
    ...Object.values(baseline.sims).flatMap(sim => sim.pets || []),
    ...(baseline.meta.unassignedPets || [])
  ].map(pet => String(pet.gameData?.simId || pet.id)));
  for (const pet of [
    ...Object.values(database.sims || {}).flatMap(sim => sim.pets || []),
    ...(database.meta.unassignedPets || [])
  ]) {
    const id = String(pet.gameData?.simId || pet.id);
    if (samplePetIds.has(id)) {
      items.set('pet:' + id, { person:pet, path:prefix + id + '.png', isSim:false });
    }
  }

  // 同一張 EA 未知肖像只需保存一次，不重新取樣、修圖或轉成 WebP。
  const importPromises = new Map();
  async function importOriginalPng(path) {
    let promise = importPromises.get(path);
    if (promise) return promise;
    promise = (async () => {
      const response = await fetch(path, { cache:'no-store' });
      if (!response.ok) throw new Error(path + '：HTTP ' + response.status);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const signature = [137,80,78,71,13,10,26,10];
      if (bytes.length < 33 || !signature.every((value,index) => bytes[index] === value)) {
        throw new Error('預設肖像不是有效 PNG：' + path);
      }
      const dimensions = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const width = dimensions.getUint32(16, false);
      const height = dimensions.getUint32(20, false);
      const expected = path === sharedPath ? 128 : 512;
      if (width !== expected || height !== expected || bytes[25] !== 6) {
        throw new Error('預設肖像尺寸或透明通道不正確：' + path);
      }
      return assetStore.importBlob(new Blob([bytes], { type:'image/png' }), {
        width, height
      });
    })();
    importPromises.set(path, promise);
    return promise;
  }

  const entries = [...items.values()];
  let changed = false;
  if (typeof onProgress === 'function') onProgress(0, entries.length);
  for (let start = 0; start < entries.length; start += 4) {
    await Promise.all(entries.slice(start, start+4).map(async item => {
      // 重新整理已完成的預設肖像不重新下載；但若 IndexedDB 已遺失圖片，會自動補回。
      if (Number(database.meta.samplePortraitVersion) === 11 &&
          assetStore.isAssetId(item.person.avatar) &&
          await assetStore.hasAsset(item.person.avatar)) return;
      const id = await importOriginalPng(item.path);
      if (item.isSim) {
        if (item.person.avatar !== id) changed = true;
        item.person.avatar = id;
        item.person.gameAvatar = id;
        item.person.gameData = item.person.gameData || {};
        item.person.gameData.avatarSource = 'game';
      } else {
        if (item.person.gameAvatar !== id) changed = true;
        item.person.gameAvatar = id;
        item.person.gameAvatarFrame ||= { ...DEFAULT_AVATAR_FRAME };
        if (!item.person.customAvatar) item.person.avatarSource = 'game';
        if (item.person.avatarSource === 'game') {
          item.person.avatar = id;
          item.person.avatarFrame = normalizeAvatarFrame(item.person.gameAvatarFrame);
        }
      }
    }));
    if (typeof onProgress === 'function') {
      onProgress(Math.min(start + 4, entries.length), entries.length);
    }
  }
  if (Number(database.meta.samplePortraitVersion) !== 11) {
    database.meta.samplePortraitVersion = 11;
    changed = true;
  }
  return changed;
}

async function prepareInitialWorkspaceDatabase() {
  let preparedResult;

  try {
    const saved = await readStoredGenealogyData();
    preparedResult = prepareDatabase(saved || buildDefaultGenealogyData());
  } catch (error) {
    if (localStorage.getItem(STORE_KEY) === WORKSPACE_IDB_MARKER) throw error;
    console.warn(
      '族譜資料載入失敗，改用目前預設資料。',
      error
    );

    preparedResult =
      prepareDatabase(
        buildDefaultGenealogyData()
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
        buildDefaultGenealogyData()
      );

    initialDatabase =
      preparedResult.prepared;
  }

  return {
    preparedResult,
    initialDatabase
  };
}

async function initializeGenealogyWorkspace() {
  restoreWorkspacePreferences();
  connectAssetStoreInBackground();

  const {
    preparedResult,
    initialDatabase
  } =
    await prepareInitialWorkspaceDatabase();

  applyRelationshipLineSettings();
  restoreCanvasBackground();
  // IndexedDB 圖片 Blob 寫入失敗時，仍應允許讀取有效的族譜存檔。
  // 儲存空間異常期間，不得清除圖片參照或覆寫目前工作區。
  let repairedSamplePortraits = false;
  let portraitStorageError = null;
  try {
    repairedSamplePortraits = await ensureSamplePortraitAssets(initialDatabase);
  } catch (error) {
    const storageFailure = /Failed to write blobs|IOError|QuotaExceededError|quota/i.test(
      String(error?.name || '') + ' ' + String(error?.message || '')
    );
    if (!storageFailure) throw error;
    portraitStorageError = error;
    console.error('[圖片資產儲存失敗] 保留既有資料並繼續載入族譜。', error);
  }

  const clearedImageRefs =
    portraitStorageError ? 0 :
    assetStore.clearUnsupportedImageRefs(
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
    !portraitStorageError && (
      preparedResult.changed ||
      repairedSamplePortraits
    )
  ) {
    save({ immediate:true });
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
    if (portraitStorageError) {
      window.setTimeout(() => {
        void uiAlert(
          '瀏覽器暫時無法儲存部分肖像圖片（IndexedDB Blob 寫入失敗）。' +
          '\n\n族譜已繼續載入，原有的族譜資料及圖片引用不會因此清除。' +
          '\n請先確認是否能匯出 JSON 備份，再檢查裝置可用儲存空間。' +
          '\n在備份前請勿清除網站資料或重設瀏覽器儲存空間。',
          { title:'圖片儲存異常', kind:'danger' }
        );
      }, 220);
    }
  });
}


/* ========【多語系介面回呼】 語言切換後刷新 App 專屬畫面狀態 ======== */
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
      $('simBirthdayDaySelect')
        ? $('simBirthdayDaySelect').value
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
  // Export dialog Escape is handled by the shared focus manager.
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

  await initializeGenealogyWorkspace();
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
