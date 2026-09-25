/* ========【L1nG Genealogy】 設定 - 族譜工具核心程式 ======== */
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
const STORE_KEY = 'sims4_genealogy_v3';
const THEME_KEY = 'sims4_genealogy_theme';
const CUSTOM_COLORS_KEY = 'sims4_custom_colors';
const BG_KEY = 'sims4_genealogy_bg';
const MODE_KEY = 'sims4_genealogy_mode';
const LABELS_KEY = 'sims4_genealogy_labels';
const AVATAR_PROFILE_KEY = 'sims4_genealogy_avatar_profile';
const PET_AVATAR_PROFILE_KEY = 'sims4_genealogy_pet_avatar_profile';
const GALLERY_PROFILE_KEY = 'sims4_genealogy_gallery_profile';
const LABEL_LOCK_KEY = 'sims4_genealogy_label_lock';
const SIDEBAR_WIDTH_KEY = 'sims4_genealogy_sidebar_width';
const FAMILY_PANEL_COLLAPSED_KEY = 'sims4_genealogy_family_panel_collapsed';
const LANG_KEY = 'ling_genealogy_language_v1';
const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 260;
const SIDEBAR_MAX_WIDTH = 430;
const GUIDE_SNAP_PX = 8;
const SIBLING_LABEL = '兄弟姐妹';

// ========【族譜卡片顯示】 設定 - 檢視 / 編輯模式各自保存顯示內容；檢視卡另有外觀設定 ========
const CARD_CONTENT_FIELD_KEYS = ['name','gender','lifeStage','age','birthday','status','race','career','residence','aspiration','traits','pets','gallery'];

const DEFAULT_CARD_VIEW_SETTINGS = Object.freeze({
  avatar: true,
  name: true,
  gender: true,
  lifeStage: false,
  age: false,
  birthday: false,
  status: false,
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
  gender: true,
  lifeStage: true,
  age: false,
  birthday: false,
  status: false,
  race: false,
  career: true,
  residence: true,
  aspiration: false,
  traits: false,
  pets: false,
  gallery: false
});


const IMG_DB_NAME = 'sims4_images_db';
const IMG_DB_VERSION = 1;
const IMG_STORE = 'images';

const AVATAR_PROFILES = {
  compact:  { max: 192, webp: 0.83, jpeg: 0.81, label: '節省空間', hint: '192px · 約 10–16KB/張' },
  balanced: { max: 384, webp: 0.87, jpeg: 0.84, label: '平衡',   hint: '384px · 約 30–50KB/張' },
  hd:       { max: 768, webp: 0.90, jpeg: 0.88, label: '高畫質',   hint: '768px · 約 70–130KB/張' }
};
let avatarProfile = 'balanced';
let petAvatarProfile = 'balanced';

const GALLERY_PROFILES = {
  small:    { max: 512,  webp: 0.82, jpeg: 0.80, label: '小型圖片',   hint: '512px · 約 20–30KB/張' },
  medium:   { max: 720,  webp: 0.85, jpeg: 0.82, label: '中型圖片',   hint: '720px · 約 40–60KB/張' },
  large:    { max: 1080, webp: 0.86, jpeg: 0.84, label: '大型圖片',   hint: '1080px · 約 80–120KB/張' },
  hd:       { max: 1440, webp: 0.88, jpeg: 0.86, label: '高畫質',   hint: '1440px · 約 150–250KB/張' },
  original: { max: null, webp: 1.00, jpeg: 1.00, label: '原始圖片',   hint: '不壓縮 · 保留原始格式與畫質' }
};
let galleryProfile = 'medium';

function getAvatarProfile() { return AVATAR_PROFILES[avatarProfile] || AVATAR_PROFILES.balanced; }
function getPetAvatarProfile() { return AVATAR_PROFILES[petAvatarProfile] || AVATAR_PROFILES.balanced; }
function getGalleryProfile() { return GALLERY_PROFILES[galleryProfile] || GALLERY_PROFILES.medium; }

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

const REL_PRESETS = {
  spouse:{icon:'heart',label:'配偶'}, engaged:{icon:'gem',label:'訂婚'},
  partner:{icon:'hearts',label:'伴侶'}, lover:{icon:'heart-fill',label:'情人'},
  exspouse:{icon:'heartbreak',label:'離婚'}, widow:{icon:'flower1',label:'喪偶'},
  'parent-child':{icon:'person-hearts',label:'子女'}, adoptive:{icon:'house-heart',label:'領養'},
  sibling:{icon:'people',label:'兄妹'}, bestfriend:{icon:'person-check',label:'摯友'},
  friend:{icon:'person-heart',label:'朋友'}, rival:{icon:'lightning',label:'仇敵'},
  mentor:{icon:'mortarboard',label:'師承'}, custom:{icon:'tag',label:'自訂'},
  none:{icon:'',label:'(不顯示)'}
};

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
const VALID_PROFILES = ['compact','balanced','hd'];
const VALID_GALLERY_PROFILES = ['small','medium','large','hd','original'];
let showRelLabels = true;
let bgSettings = { image:null, opacity:0.5, fit:'cover' };
let addMemberSelection = new Set();
let removeMemberSelection = new Set();
let labelDrag = null;
let viewMode = 'view';
let infoCardId = null;
let currentThemeId = 'ling';
let customColors = { c1: '#f0c050', c2: '#a878c8' };

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
    manualPos: cloneManualPositionMap(fam.manualPos[mode])
  };
}

function captureLabelHistoryState(key) {
  const saved = db && db.labelPos ? db.labelPos[key] : null;
  return saved ? { dx: Number(saved.dx) || 0, dy: Number(saved.dy) || 0 } : null;
}

function applyDragHistoryEntry(entry, stateKey) {
  const state = entry[stateKey];
  if (!state || !db) return;

  if (entry.type === 'card-layout') {
    const fam = db.families.find(item => item.id === entry.familyId);
    if (!fam) return;
    ensureFamilyLayoutShape(fam);
    fam.freeLayout[entry.mode] = !!state.freeLayout;
    fam.manualPos[entry.mode] = cloneManualPositionMap(state.manualPos);
    save({ immediate: true });
    if (db.currentId === entry.familyId && viewMode === entry.mode) {
      render();
      updateLayoutToggle();
    }
    return;
  }

  if (entry.type === 'relationship-label') {
    if (!db.labelPos) db.labelPos = {};
    if (state.offset) db.labelPos[entry.key] = { ...state.offset };
    else delete db.labelPos[entry.key];
    save({ immediate: true });
    if (layoutCache) drawEdges();
  }
}

function isNativeTextUndoTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('[contenteditable="true"]')) return true;
  return !!target.closest('input, textarea, select');
}

let editingPets = [];
let editingTraits = [];
let editingPetIndex = -1;
let editingPetAvatar = null;

let editingGallery = [];
let editingPhotoIndex = -1;
let editingPhotoImageRef = '';
let editingPhotoSizeKB = 0;
let editingPhotoOriginal = false;

/* 檢視器狀態 */
let viewerMode = 'edit';         // 'edit' | 'sim' | 'global'
let viewerSimId = null;
let viewerIndex = 0;
let viewerGlobalList = [];       // global 模式下的快照

/* ===== IndexedDB 圖片層 ===== */
let _imgDb = null;
const imageCache = new Map();
let _idbAvailable = true;

function openImageDB() {
  return new Promise((resolve, reject) => {
    if (_imgDb) return resolve(_imgDb);
    if (!_idbAvailable) return reject(new Error('IndexedDB 不可用'));
    try {
      const req = indexedDB.open(IMG_DB_NAME, IMG_DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(IMG_STORE)) {
          d.createObjectStore(IMG_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = e => { _imgDb = e.target.result; resolve(_imgDb); };
      req.onerror = () => { _idbAvailable = false; reject(req.error); };
      req.onblocked = () => { reject(new Error('IndexedDB 被阻塞')); };
    } catch(e) { _idbAvailable = false; reject(e); }
  });
}

async function idbPutImage(id, dataUrl) {
  const d = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IMG_STORE, 'readwrite');
    const sizeKB = Math.round((dataUrl || '').length * 0.75 / 1024);
    tx.objectStore(IMG_STORE).put({ id, dataUrl, sizeKB, addedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAllImages() {
  const d = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IMG_STORE, 'readonly');
    const req = tx.objectStore(IMG_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbDeleteImage(id) {
  const d = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IMG_STORE, 'readwrite');
    tx.objectStore(IMG_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClearAll() {
  const d = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(IMG_STORE, 'readwrite');
    tx.objectStore(IMG_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function isBase64Ref(ref) {
  return typeof ref === 'string' && ref.startsWith('data:');
}
function isImageIdRef(ref) {
  return typeof ref === 'string' && ref.startsWith('img_');
}
function resolveImageUrl(ref) {
  if (!ref) return '';
  if (isBase64Ref(ref)) return ref;
  if (isImageIdRef(ref)) return imageCache.get(ref) || '';
  return '';
}
function newImageId() {
  return 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function saveImageToIdb(dataUrl) {
  if (!_idbAvailable) return null;
  try {
    const id = newImageId();
    await idbPutImage(id, dataUrl);
    imageCache.set(id, dataUrl);
    return id;
  } catch(e) {
    console.error('儲存圖片失敗', e);
    return null;
  }
}

let _dimsCache = { mode: null, dims: null };
let _gapsCache = { mode: null, gaps: null };

function getCardViewSettings() {
  const target = (typeof db !== 'undefined' && db) ? db : null;
  if (!target) return { ...DEFAULT_CARD_VIEW_SETTINGS };
  if (!target.meta || typeof target.meta !== 'object') target.meta = {};
  if (!target.meta.cardView || typeof target.meta.cardView !== 'object') target.meta.cardView = {};
  const current = target.meta.cardView;
  current.avatar = true;
  CARD_CONTENT_FIELD_KEYS.forEach(key => {
    if (typeof current[key] !== 'boolean') current[key] = DEFAULT_CARD_VIEW_SETTINGS[key];
  });
  if (!['minimal','translucent','full'].includes(current.appearance)) current.appearance = DEFAULT_CARD_VIEW_SETTINGS.appearance;
  return current;
}

function getCardEditSettings() {
  const target = (typeof db !== 'undefined' && db) ? db : null;
  if (!target) return { ...DEFAULT_CARD_EDIT_SETTINGS };
  if (!target.meta || typeof target.meta !== 'object') target.meta = {};
  if (!target.meta.cardEdit || typeof target.meta.cardEdit !== 'object') target.meta.cardEdit = {};
  const current = target.meta.cardEdit;
  current.avatar = true;
  CARD_CONTENT_FIELD_KEYS.forEach(key => {
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
    if (!bodyRows) return { W: 92, H: 92 };
    return {
      W: NODE_DIMS.edit.W,
      H: Math.max(98, 30 + Math.max(64, bodyRows * 18))
    };
  }

  const settings = getCardViewSettings();
  const compactMetaLine = settings.lifeStage || settings.age;
  const statusLine = settings.status || settings.race;
  const mediaLine = settings.pets || settings.gallery;
  const genderOnlyLine = settings.gender && !settings.name;
  const primaryRows = [genderOnlyLine, compactMetaLine, settings.birthday, statusLine].filter(Boolean).length;
  const detailRows = [settings.career, settings.residence, settings.aspiration, settings.traits, mediaLine].filter(Boolean).length;
  const hasAnyText = !!(settings.name || primaryRows || detailRows);

  if (settings.appearance === 'minimal') {
    if (!hasAnyText) return { W: 100, H: 100 };
    const extraLines = primaryRows + detailRows;
    const hasWideText = settings.name || settings.career || settings.residence || settings.aspiration || settings.traits;
    const width = (settings.career || settings.residence || settings.aspiration || settings.traits) ? 164 : (hasWideText ? 136 : 108);
    const baseHeight = settings.name ? 118 : 102;
    return { W: width, H: Math.max(102, baseHeight + extraLines * 17) };
  }

  // 有外框時改用「頭像 + 主要資料」橫向頭部；額外資料再往下排，避免大面積空白。
  if (!hasAnyText) return { W: 100, H: 100 };
  const headTextRows = (settings.name ? 1 : 0) + primaryRows;
  const headHeight = Math.max(64, headTextRows * 16 + (settings.name ? 3 : 0));
  const width = 192;
  const detailsHeight = detailRows ? (8 + detailRows * 17) : 0;
  return { W: width, H: Math.max(88, 20 + headHeight + detailsHeight) };
}
function getGaps() {
  return GAPS[viewMode] || GAPS.view;
}

function getCurrentManualPos(fam) {
  if (!fam.manualPos) return {};
  return fam.manualPos[viewMode] || {};
}
function getCurrentFreeLayout(fam) {
  if (!fam.freeLayout || typeof fam.freeLayout !== 'object') return false;
  return !!fam.freeLayout[viewMode];
}
function ensureFamilyLayoutShape(fam) {
  if (!fam.manualPos || typeof fam.manualPos !== 'object') {
    fam.manualPos = { view: {}, edit: {} };
  } else {
    if (!fam.manualPos.view || typeof fam.manualPos.view !== 'object') fam.manualPos.view = {};
    if (!fam.manualPos.edit || typeof fam.manualPos.edit !== 'object') fam.manualPos.edit = {};
  }
  if (!fam.freeLayout || typeof fam.freeLayout !== 'object') {
    fam.freeLayout = { view: false, edit: false };
  } else {
    if (typeof fam.freeLayout.view !== 'boolean') fam.freeLayout.view = false;
    if (typeof fam.freeLayout.edit !== 'boolean') fam.freeLayout.edit = false;
  }
  if (typeof fam.locked !== 'boolean') fam.locked = false;
}

function ensureFamilyProfileShape(fam) {
  if (!fam || typeof fam !== 'object') return;
  if (typeof fam.bio !== 'string') fam.bio = '';
  if (fam.coverImage === undefined) fam.coverImage = null;
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
  const add = o => { sims[o.id] = o; return o; };
  add({id:'g1',name:'岡瑟·高斯',gender:'男',lifeStage:'老年',status:'幽靈',race:'',
    residence:'柳溪 - 歐菲莉亞別墅', aspiration:'財富創造者', causeOfDeath:'衰老',
    pets:[], gallery:[], parentIds:[], spouseIds:['g2'],exSpouseIds:[],adoptive:false,
    traits:['雄心勃勃','天才','勢利'],career:'商業',bio:'高斯家族創始人之一，已故。',order:0,avatar:null});
  add({id:'g2',name:'科妮莉亞·高斯',gender:'女',lifeStage:'老年',status:'幽靈',race:'',
    residence:'柳溪 - 歐菲莉亞別墅', aspiration:'大家庭', causeOfDeath:'衰老',
    pets:[], gallery:[], parentIds:[], spouseIds:['g1'],exSpouseIds:[],adoptive:false,
    traits:['家庭觀念','愛整潔','美食家'],career:'無',bio:'高斯家族女主人，已故。',order:0,avatar:null});
  add({id:'g3',name:'莫蒂默·高斯',gender:'男',lifeStage:'成年',status:'在世',race:'vampire',
    residence:'柳溪 - 歐菲莉亞別墅', aspiration:'暢銷作家', causeOfDeath:'',
    pets:[{ id:'pet_g3_1', name:'午夜', species:'cat', breed:'黑貓', gender:'女', ageStage:'成年', status:'在世', avatar:null }],
    gallery:[],
    parentIds:['g1','g2'],spouseIds:['g4'],exSpouseIds:[],adoptive:false,
    traits:['有創造力','浪漫','陰沈'],career:'作家',bio:'現任高斯家族族長。',order:0,avatar:null});
  add({id:'g4',name:'貝拉·巴切勒',gender:'女',lifeStage:'成年',status:'在世',race:'',
    residence:'柳溪 - 歐菲莉亞別墅', aspiration:'靈魂伴侶', causeOfDeath:'',
    pets:[{ id:'pet_g4_1', name:'金毛', species:'dog', breed:'金毛尋回犬', gender:'男', ageStage:'成年', status:'在世', avatar:null }],
    gallery:[],
    parentIds:[],spouseIds:['g3'],exSpouseIds:[],adoptive:false,
    traits:['熱愛戶外','開朗','愛調情'],career:'無',bio:'巴切勒家的女兒，嫁入高斯家。',order:0,avatar:null});
  add({id:'g5',name:'卡桑德拉·高斯',gender:'女',lifeStage:'青少年',status:'在世',race:'spellcaster',
    residence:'柳溪 - 花園社區', aspiration:'卓越畫家', causeOfDeath:'',
    pets:[], gallery:[],
    parentIds:['g3','g4'],spouseIds:[],exSpouseIds:[],adoptive:false,
    traits:['天才','陰沈','物質主義'],career:'學生',bio:'莫蒂默和貝拉的女兒。',order:0,avatar:null});
  add({id:'g6',name:'亞歷山大·高斯',gender:'男',lifeStage:'兒童',status:'在世',race:'',
    residence:'柳溪 - 花園社區', aspiration:'電腦奇才', causeOfDeath:'',
    pets:[], gallery:[],
    parentIds:['g3','g4'],spouseIds:[],exSpouseIds:[],adoptive:false,
    traits:['天才','有創造力','熱愛戶外'],career:'學生',bio:'莫蒂默和貝拉的兒子。',order:1,avatar:null});
  const famGoth = {
    id:'fam_goth', name:'高斯家族', memberIds:['g1','g2','g3','g5','g6'], bio:'', coverImage:null,
    freeLayout: { view: false, edit: false },
    manualPos: { view: {}, edit: {} }, locked: false
  };
  const famBache = {
    id:'fam_bacheler', name:'巴切勒家族', memberIds:['g4'], bio:'', coverImage:null,
    freeLayout: { view: false, edit: false },
    manualPos: { view: {}, edit: {} }, locked: false
  };
  return {version:3,meta:{sample:true,sampleLanguage:'zh-Hant'},sims,families:[famGoth,famBache],links:[],relMap:{},labelPos:{},currentId:famGoth.id};
}

let db = null, layoutCache = null, scale = 1;
let panX = 0, panY = 0, editingId = null, editingAvatar = null;

// 自由排列工具：選取 / 框選與畫布拖曳分離。
let arrangeTool = 'pan';
const selectedNodeIds = new Set();
let spacePanHeld = false;
let marqueeState = null;

const $ = id => document.getElementById(id);
const viewport = $('viewport'), stage = $('stage'), svg = $('links'), nodes = $('nodes');
const labelsSvg = $('labels');
const mask = $('mask'), rosterMask = $('rosterMask'), bgMask = $('bgMask');
const addMemberMask = $('addMemberMask');
const removeMemberMask = $('removeMemberMask');
const tipsMask = $('tipsMask');
const infoMask = $('infoMask');
const petMask = $('petMask');
const photoMask = $('photoMask');
const galleryViewerMask = $('galleryViewerMask');
const galleryBrowserMask = $('galleryBrowserMask');
const exportMask = $('exportMask');
const exportCloseBtn = $('exportCloseBtn');
const exportImageBtn = $('exportImageBtn');
const exportJsonBtn = $('exportJsonBtn');
const familyNameInput = $('familyName'), familySelect = $('familySelect');
const searchInput = $('search'), searchResults = $('searchResults');
const statusFilterInputs = [...document.querySelectorAll('input[name="statusFilter"]')];
const genderFilterInputs = [...document.querySelectorAll('input[name="genderFilter"]')];
const rosterSearch = $('rosterSearch');
const modeToggle = $('modeToggle');
const selectToolBtn = $('selectToolBtn');
const panToolBtn = $('panToolBtn');
const arrangeToolDivider = $('arrangeToolDivider');
const arrangeToolDividerEnd = $('arrangeToolDividerEnd');
const selectionMarquee = $('selectionMarquee');
const nodeContextMenu = $('nodeContextMenu');
const avatarProfileSelect = $('avatarProfile');
const petAvatarProfileSelect = $('petAvatarProfile');
const galleryProfileSelect = $('galleryProfile');
const labelLockToggle = $('labelLockToggle');
const sidebar = $('sidebar');
const sidebarResizer = $('sidebarResizer');
const sidebarBackdrop = $('sidebarBackdrop');
const menuToggle = $('menuToggle');
const smartGuideVertical = $('smartGuideVertical');
const smartGuideHorizontal = $('smartGuideHorizontal');
const smartSpacingHorizontal = $('smartSpacingHorizontal');
const smartSpacingVertical = $('smartSpacingVertical');
const themeGrid = $('themeGrid');
const customColor1 = $('customColor1');
const customColor2 = $('customColor2');
const customThemePreview = $('customThemePreview');
const galleryGrid = $('galleryGrid');

// ========【家族名稱輸入】 設定 - 固定導覽欄位、虛線只跟著文字寬度 ========
const _familyNameMeasureCanvas = document.createElement('canvas');
const _familyNameMeasureContext = _familyNameMeasureCanvas.getContext('2d');

function syncFamilyNameInputWidth() {
  if (!familyNameInput || !_familyNameMeasureContext) return;
  const editor = familyNameInput.closest('.family-name-editor');
  const row = familyNameInput.closest('.family-title-row');
  if (!editor) return;

  const inputStyle = getComputedStyle(familyNameInput);
  const fontWeight = inputStyle.fontWeight || '700';
  const fontSize = inputStyle.fontSize || '18px';
  const fontFamily = inputStyle.fontFamily || 'sans-serif';
  _familyNameMeasureContext.font = `${fontWeight} ${fontSize} ${fontFamily}`;

  const source = familyNameInput.value || familyNameInput.placeholder || '';
  const measured = Math.ceil(_familyNameMeasureContext.measureText(source).width + 18);
  const rowWidth = row ? row.clientWidth : 280;
  // 預留鉛筆、家族切換箭頭與家族管理按鈕的寬度；底線只跟著實際名稱文字伸縮。
  const maxWidth = Math.max(68, rowWidth - 78);
  const width = Math.max(68, Math.min(maxWidth, measured));
  familyNameInput.style.width = `${width}px`;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const pairKey = (a,b) => [a,b].sort().join('::');

// ========【UI 圖示】 Bootstrap Icons 統一輸出 ========
const iconSvg = (name, extra = '') => {
  const safe = String(name || '').replace(/[^a-z0-9-]/gi, '');
  if (!safe) return '';
  const extraClass = extra ? ' ' + extra : '';
  return `<span class="l1ng-icon icon-${safe}${extraClass}" aria-hidden="true"></span>`;
};
function setIconText(el, iconName, text) {
  if (!el) return;
  el.innerHTML = `${iconSvg(iconName)}<span>${esc(text)}</span>`;
}

// ========【SVG 圖示來源】 設定 - 本機預覽缺少專案資源時自動使用 Bootstrap Icons 備援 ========
const ICON_LOCAL_PROBE = '../html%20icons/check-circle.svg';
const ICON_PREVIEW_FALLBACK_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/';

// 這幾顆是 Genealogy 專用的語意 SVG，不存在 Bootstrap CDN。
// file:// 預覽時以 data URI 備援，正式網站仍讀取 html icons/ 內的獨立 SVG。
const CUSTOM_ICON_PREVIEW_DATA = {
  'paw': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M3.1 6.3c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.7.9-1.7 2 .7 2 1.7 2Zm9.8 0c1 0 1.7-.9 1.7-2s-.7-2-1.7-2-1.8.9-1.8 2 .8 2 1.8 2ZM6.2 5.1c1 0 1.8-1 1.8-2.1S7.2.9 6.2.9 4.4 1.8 4.4 3s.8 2.1 1.8 2.1Zm3.6 0c1 0 1.8-1 1.8-2.1S10.8.9 9.8.9 8 1.8 8 3s.8 2.1 1.8 2.1ZM8 6.1c-2.6 0-5 2.8-5 5 0 1.8 1.4 3 3 3 .8 0 1.4-.4 2-.4s1.2.4 2 .4c1.6 0 3-1.2 3-3 0-2.2-2.4-5-5-5Z"/></svg>`,
  'tombstone': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M5 12V6a3 3 0 0 1 6 0v6h1.5a.5.5 0 0 1 .5.5V14H3v-1.5a.5.5 0 0 1 .5-.5H5Zm2.4-7.7v1.2H6.2v1h1.2v2h1.2v-2h1.2v-1H8.6V4.3H7.4Z"/></svg>`,
  'ghost-symbol': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M8 1.2A5.2 5.2 0 0 0 2.8 6.4V14l2-1.45L6.4 14 8 12.55 9.6 14l1.6-1.45 2 1.45V6.4A5.2 5.2 0 0 0 8 1.2Zm-1.8 5A1.1 1.1 0 1 1 6.2 4a1.1 1.1 0 0 1 0 2.2Zm3.6 0A1.1 1.1 0 1 1 9.8 4a1.1 1.1 0 0 1 0 2.2Z"/></svg>`,
  'alien-head': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M8 1C4.6 1 2.4 3.3 2.4 6.2c0 3.7 3.8 7.8 5.6 8.8 1.8-1 5.6-5.1 5.6-8.8C13.6 3.3 11.4 1 8 1Zm-2.6 7.5c-1-.4-1.7-1.4-1.8-2.6 1.5-.1 2.7.4 3.5 1.5-.3.8-.9 1.2-1.7 1.1Zm5.2 0c-.8.1-1.4-.3-1.7-1.1.8-1.1 2-1.6 3.5-1.5-.1 1.2-.8 2.2-1.8 2.6ZM6.6 11h2.8c-.4.7-.9 1-1.4 1s-1-.3-1.4-1Z"/></svg>`,
  'vampire-fangs': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M2 4.2C3.8 3.4 5.8 3 8 3s4.2.4 6 1.2v3.1c0 3.4-2.3 5.7-6 5.7s-6-2.3-6-5.7V4.2Zm2 2v1.1C4 9.6 5.5 11 8 11s4-1.4 4-3.7V6.2c-1.2-.4-2.6-.7-4-.7s-2.8.3-4 .7Zm1.2.2h2L6.8 9 5.2 6.4Zm3.6 0h2L9.2 9 8.8 6.4Z"/></svg>`,
  'wolf-head': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="m2 1.5 3.2 2A7.8 7.8 0 0 1 8 3a7.8 7.8 0 0 1 2.8.5l3.2-2-.8 4.2c.5.9.8 2 .8 3.1 0 3.3-2.7 6-6 6s-6-2.7-6-6c0-1.1.3-2.2.8-3.1L2 1.5Zm3.1 5.2 1.8.5-.8 1.3-1-.4v-1.4Zm5.8 0v1.4l-1 .4-.8-1.3 1.8-.5ZM8 9.1l1.1 1.3L8 11.2l-1.1-.8L8 9.1Z"/></svg>`,
  'mermaid-tail': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M3 1.3C5.6 1.8 7.3 3 8.2 4.8c.9-1.8 2.6-3 5.2-3.5-.2 2.6-1.2 4.3-3 5.1.7 1.1.9 2.3.5 3.5-.6 2-2.5 3.5-5.8 4.8.7-2.2 1.6-3.9 2.7-5.2.7-.9.9-1.8.4-2.8C7 4.1 5.3 2.3 3 1.3Z"/></svg>`,
  'fairy-wings': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="black" d="M7.3 7.2C5.8 3.1 3.7 1 1 1c-.1 3.2 1.4 5.6 4.6 7.1C2.9 9.2 1.5 11.2 1.4 14c2.7.1 4.6-1.6 5.9-5.1v-1.7Zm1.4 0C10.2 3.1 12.3 1 15 1c.1 3.2-1.4 5.6-4.6 7.1 2.7 1.1 4.1 3.1 4.2 5.9-2.7.1-4.6-1.6-5.9-5.1V7.2ZM7.4 6.3h1.2v4.4H7.4V6.3Z"/></svg>`
};

function svgToDataUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function applyPreviewIconFallback(root = document) {
  root.querySelectorAll('.l1ng-icon').forEach(icon => {
    const iconClass = [...icon.classList].find(name => name.startsWith('icon-'));
    if (!iconClass) return;
    const iconName = iconClass.slice(5);
    if (CUSTOM_ICON_PREVIEW_DATA[iconName]) {
      icon.style.setProperty('--l1ng-icon', svgToDataUrl(CUSTOM_ICON_PREVIEW_DATA[iconName]));
      return;
    }
    icon.style.setProperty('--l1ng-icon', `url("${ICON_PREVIEW_FALLBACK_BASE}${iconName}.svg")`);
  });
}

function enablePreviewIconFallback() {
  applyPreviewIconFallback(document);

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches('.l1ng-icon')) applyPreviewIconFallback(node.parentElement || document);
        else applyPreviewIconFallback(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function verifyLocalIconAssets() {
  // 直接用 file:// 開啟 HTML 時，瀏覽器通常會阻擋 CSS mask 讀取其他本機 SVG。
  // 因此本機預覽直接改用 HTTPS 備援；正式網站仍優先使用專案內的 html icons。
  if (window.location.protocol === 'file:') {
    enablePreviewIconFallback();
    return;
  }

  const probe = new Image();
  probe.onload = () => {};
  probe.onerror = enablePreviewIconFallback;
  probe.src = new URL(ICON_LOCAL_PROBE, document.baseURI).href;
}

verifyLocalIconAssets();

// ========【頂部自訂下拉選單】 設定 - 取代瀏覽器原生 select 展開介面 ========
const navSelectControls = new Map();

function getNavSelectDisplayText(select, option) {
  if (!select || !option) return '';
  if (select.id === 'languageSelect') {
    const nativeNames = { 'zh-Hant':'繁中', 'zh-Hans':'简中', en:'EN' };
    return nativeNames[option.value] || option.textContent || option.value;
  }
  return option.textContent || option.value || '';
}

function closeNavSelect(host) {
  if (!host) return;
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
      const willOpen = !host.classList.contains('open');
      closeAllNavSelects(host);
      host.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) {
        syncNavSelectControl(selectId);
        requestAnimationFrame(() => {
          const current = menu.querySelector('.nav-select-option.selected') || menu.querySelector('.nav-select-option');
          if (current) current.focus({ preventScroll: true });
        });
      }
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

    select.addEventListener('change', () => syncNavSelectControl(selectId));
    syncNavSelectControl(selectId);
  });

  document.addEventListener('click', event => {
    const inside = event.target.closest && event.target.closest('.nav-select');
    closeAllNavSelects(inside || null);
  });
}


// ========【共用 HTML 彈窗】 設定 - 取代瀏覽器原生 alert / confirm / prompt ========
let _uiDialogResolve = null;
let _uiDialogMode = 'alert';

function closeUiDialog(result = null) {
  const overlay = $('uiDialogMask');
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
  const overlay = $('uiDialogMask');
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
  const overlay = $('uiDialogMask');
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
  return db.families.find(f => f.id === db.currentId) || db.families[0];
}

// ========【頂部人物篩選】 設定 - 狀態與性別可交叉篩選，取代單一人生階段篩選 ========
function getTopbarFilterState() {
  const status = document.querySelector('input[name="statusFilter"]:checked')?.value || '';
  const gender = document.querySelector('input[name="genderFilter"]:checked')?.value || '';
  return { status, gender };
}

function simMatchesTopbarFilters(sim) {
  if (!sim) return false;
  const { status, gender } = getTopbarFilterState();
  if (status && sim.status !== status) return false;
  if (gender && sim.gender !== gender) return false;
  return true;
}

function updateTopbarFilterUI() {
  const { status, gender } = getTopbarFilterState();
  const count = (status ? 1 : 0) + (gender ? 1 : 0);
  const button = $('topbarFilterBtn');
  const countEl = $('topbarFilterCount');
  if (button) button.classList.toggle('active', count > 0);
  if (countEl) {
    countEl.hidden = count === 0;
    countEl.textContent = count ? `· ${count}` : '';
  }
}

// ========【預設資料翻譯】 設定 - 繁中為唯一基準；只翻譯內建範例既有值 ========
const BUILTIN_SAMPLE_SIM_IDS = new Set(['g1','g2','g3','g4','g5','g6']);
const BUILTIN_SAMPLE_FAMILY_IDS = new Set(['fam_goth','fam_bacheler']);

// 只有這些「原始繁中範例值」可跟著語言切換。
// 玩家新增的資料，以及玩家把範例欄位改成的新文字，都保持原文，不做自動翻譯。
const BUILTIN_SAMPLE_TEXT_VALUES = new Set([
  '岡瑟·高斯','科妮莉亞·高斯','莫蒂默·高斯','貝拉·巴切勒','卡桑德拉·高斯','亞歷山大·高斯',
  '高斯家族','巴切勒家族','柳溪 - 歐菲莉亞別墅','柳溪 - 花園社區',
  '財富創造者','大家庭','暢銷作家','靈魂伴侶','卓越畫家','電腦奇才',
  '衰老','雄心勃勃','天才','勢利','家庭觀念','愛整潔','美食家','有創造力','浪漫','陰沈',
  '熱愛戶外','開朗','愛調情','物質主義','商業','作家','學生','無',
  '高斯家族創始人之一，已故。','高斯家族女主人，已故。','現任高斯家族族長。',
  '巴切勒家的女兒，嫁入高斯家。','莫蒂默和貝拉的女兒。','莫蒂默和貝拉的兒子。',
  '午夜','黑貓','金毛','金毛尋回犬'
]);

function uiText(value) {
  const text = String(value ?? '');
  if (typeof LING_I18N !== 'undefined' && LING_I18N.translate) return LING_I18N.translate(text);
  return text;
}

function sampleDbLooksBuiltIn() {
  if (!db || !db.sims || !Array.isArray(db.families)) return false;
  const hasSims = [...BUILTIN_SAMPLE_SIM_IDS].every(id => !!db.sims[id]);
  const familyIds = new Set(db.families.map(f => f && f.id).filter(Boolean));
  return hasSims && [...BUILTIN_SAMPLE_FAMILY_IDS].every(id => familyIds.has(id));
}

function isBuiltinSampleSim(sim) {
  return !!(sim && BUILTIN_SAMPLE_SIM_IDS.has(sim.id) && (db?.meta?.sample || sampleDbLooksBuiltIn()));
}

function isBuiltinSampleFamily(family) {
  return !!(family && BUILTIN_SAMPLE_FAMILY_IDS.has(family.id) && (db?.meta?.sample || sampleDbLooksBuiltIn()));
}

let _builtinSampleVariantToCanonical = null;
function getBuiltinSampleVariantToCanonical() {
  if (_builtinSampleVariantToCanonical) return _builtinSampleVariantToCanonical;
  const map = new Map();
  BUILTIN_SAMPLE_TEXT_VALUES.forEach(canonical => {
    map.set(canonical, canonical);
    if (typeof LING_I18N !== 'undefined' && LING_I18N.translateFor) {
      const hans = String(LING_I18N.translateFor('zh-Hans', canonical) ?? '');
      const en = String(LING_I18N.translateFor('en', canonical) ?? '');
      if (hans) map.set(hans, canonical);
      if (en) map.set(en, canonical);
    }
  });
  _builtinSampleVariantToCanonical = map;
  return map;
}

function canonicalBuiltinSampleText(value) {
  const text = String(value ?? '');
  return getBuiltinSampleVariantToCanonical().get(text) || text;
}

function displayDataText(value, owner = null) {
  const text = String(value ?? '');
  const isBuiltInOwner = owner && (isBuiltinSampleSim(owner) || isBuiltinSampleFamily(owner));
  if (!isBuiltInOwner) return text;

  // 預設資料永遠以繁中 canonical 為基準。舊版若曾把簡中 / 英文顯示值寫回，
  // 先辨識回繁中，再依目前介面語言輸出；玩家自行修改的新文字不會被翻譯。
  const canonical = canonicalBuiltinSampleText(text);
  if (BUILTIN_SAMPLE_TEXT_VALUES.has(canonical)) return uiText(canonical);
  return text;
}

const BUILTIN_RELATION_LABELS = new Set(Object.values(REL_PRESETS).map(item => item.label));
function displayRelationshipText(value) {
  const text = String(value ?? '');
  // 只翻譯系統內建關係名稱；玩家自訂關係名稱保持原文。
  return BUILTIN_RELATION_LABELS.has(text) ? uiText(text) : text;
}

// ========【內建範例正規化】 設定 - 範例資料固定以繁中 canonical 儲存 ========
function normalizeBuiltinSampleToTraditional(targetDb) {
  if (!targetDb || !targetDb.sims || !Array.isArray(targetDb.families)) return false;

  const canonicalDb = buildSample();
  const hasBuiltinIds = Object.keys(canonicalDb.sims).every(id => !!targetDb.sims[id]);
  const familyIds = new Set(targetDb.families.map(family => family && family.id).filter(Boolean));
  const hasBuiltinFamilies = canonicalDb.families.every(family => familyIds.has(family.id));
  if (!hasBuiltinIds || !hasBuiltinFamilies) return false;

  let changed = false;
  const canonicalize = (current, canonical) => {
    const currentText = String(current ?? '');
    const canonicalText = String(canonical ?? '');
    if (!canonicalText) return currentText;

    const mappedCanonical = canonicalBuiltinSampleText(currentText);
    if (mappedCanonical === canonicalText && currentText !== canonicalText) {
      changed = true;
      return canonicalText;
    }

    // 列舉值（人生階段、性別、狀態）不一定屬於範例文字集合，仍以各語言變體比對。
    const variants = new Set([canonicalText]);
    if (typeof LING_I18N !== 'undefined' && LING_I18N.translateFor) {
      variants.add(String(LING_I18N.translateFor('zh-Hans', canonicalText) ?? ''));
      variants.add(String(LING_I18N.translateFor('en', canonicalText) ?? ''));
    }
    if (variants.has(currentText) && currentText !== canonicalText) {
      changed = true;
      return canonicalText;
    }
    return currentText;
  };

  canonicalDb.families.forEach(canonicalFamily => {
    const family = targetDb.families.find(item => item && item.id === canonicalFamily.id);
    if (!family) return;
    family.name = canonicalize(family.name, canonicalFamily.name);
  });

  Object.entries(canonicalDb.sims).forEach(([id, canonicalSim]) => {
    const sim = targetDb.sims[id];
    if (!sim) return;

    ['name','gender','lifeStage','status','residence','aspiration','causeOfDeath','career','bio'].forEach(field => {
      sim[field] = canonicalize(sim[field], canonicalSim[field]);
    });

    if (Array.isArray(sim.traits) && Array.isArray(canonicalSim.traits) && sim.traits.length === canonicalSim.traits.length) {
      sim.traits = sim.traits.map((value, index) => canonicalize(value, canonicalSim.traits[index]));
    }

    if (Array.isArray(sim.pets) && Array.isArray(canonicalSim.pets)) {
      canonicalSim.pets.forEach((canonicalPet, index) => {
        const pet = sim.pets[index];
        if (!pet) return;
        ['name','breed','gender','ageStage','status'].forEach(field => {
          pet[field] = canonicalize(pet[field], canonicalPet[field]);
        });
      });
    }
  });

  targetDb.meta = { ...(targetDb.meta || {}), sample: true, sampleLanguage: 'zh-Hant' };
  return changed;
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
  requestAnimationFrame(() => { if (layoutCache) fitScreen(); });
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
  document.querySelectorAll('.app-menu.open').forEach(menu => {
    if (menu === except) return;
    menu.classList.remove('open');
    menu.querySelector('.app-menu-trigger')?.setAttribute('aria-expanded','false');
  });
}
let _appMenuGlobalBound = false;
function setupAppMenus() {
  document.querySelectorAll('.app-menu').forEach(menu => {
    const trigger = menu.querySelector(':scope > .app-menu-trigger');
    if (!trigger || trigger.dataset.menuBound === '1') return;
    trigger.dataset.menuBound = '1';
    trigger.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const willOpen = !menu.classList.contains('open');
      closeAppMenus(menu);
      menu.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true':'false');
    });
    menu.querySelectorAll('.app-menu-item').forEach(item => item.addEventListener('click', () => {
      setTimeout(() => closeAppMenus(), 0);
    }));
  });
  if (!_appMenuGlobalBound) {
    _appMenuGlobalBound = true;
    document.addEventListener('click', e => { if (!e.target.closest?.('.app-menu')) closeAppMenus(); });
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


let _saveTimer = null, _pendingSave = false;
function save({ immediate = false } = {}) {
  _pendingSave = true;
  if (immediate) return _flushSave();
  if (_saveTimer) return;
  _saveTimer = setTimeout(_flushSave, 260);
}
function _flushSave() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  if (!_pendingSave) return;
  _pendingSave = false;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || /quota/i.test(e.message || '')) {
      uiAlert('localStorage 已滿！\n\n建議：\n1. 等待圖片遷移到 IndexedDB 完成\n2. 或在「主題設定」中清理未使用的圖片\n3. 或匯出備份後清空瀏覽器資料', { title: '儲存空間不足', kind: 'danger' });
    }
  }
}
window.addEventListener('beforeunload', () => _flushSave());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') _flushSave();
});

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

function clearCustomOverrides() {
  const props = ['--grad-1','--grad-2','--grad-1-soft','--grad-2-soft',
                 '--accent','--accent-hover','--primary-dark','--hl'];
  props.forEach(p => document.body.style.removeProperty(p));
  document.body.removeAttribute('data-topbar-contrast');
}

function renderThemeGrid() {
  const cells = THEME_PRESETS.map(t => `
    <div class="theme-card${currentThemeId === t.id ? ' selected' : ''}"
         data-theme-id="${esc(t.id)}">
      <div class="theme-preview" style="background:${t.grad}"></div>
      <div class="theme-card-name">${esc(t.name)}</div>
    </div>
  `).join('');
  const customCard = `
    <div class="theme-card${currentThemeId === 'custom' ? ' selected' : ''}"
         data-theme-id="custom">
      <div class="theme-preview" id="customCardPreview"
           style="background:linear-gradient(120deg, ${customColors.c1} 0%, ${customColors.c2} 100%)"></div>
      <div class="theme-card-name">${iconSvg('palette')} <span>自訂</span></div>
    </div>
  `;
  themeGrid.innerHTML = cells + customCard;
  themeGrid.querySelectorAll('.theme-card').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.themeId;
      if (id === 'custom') applyCustomTheme(customColors.c1, customColors.c2);
      else applyTheme(id);
    };
  });
}

function applyTheme(name) {
  if (!VALID_THEMES.includes(name)) name = 'ling';
  clearCustomOverrides();
  document.body.dataset.theme = name;
  currentThemeId = name;
  try { localStorage.setItem(THEME_KEY, name); } catch(e){}
  updateThemeSelection();
}

function applyCustomTheme(c1, c2) {
  clearCustomOverrides();
  document.body.dataset.theme = 'custom';
  currentThemeId = 'custom';
  document.body.style.setProperty('--grad-1', c1);
  document.body.style.setProperty('--grad-2', c2);
  document.body.style.setProperty('--grad-1-soft', hexToRgba(c1, 0.2));
  document.body.style.setProperty('--grad-2-soft', hexToRgba(c2, 0.2));
  const lum = (relLum(c1) + relLum(c2)) / 2;
  document.body.setAttribute('data-topbar-contrast', lum > 0.62 ? 'light' : 'dark');
  const mix = mixHex(c1, c2, 0.5);
  const accent = adjustLightness(mix, -0.28);
  document.body.style.setProperty('--accent', accent);
  document.body.style.setProperty('--accent-hover', adjustLightness(accent, -0.12));
  document.body.style.setProperty('--primary-dark', adjustLightness(mix, -0.4));
  document.body.style.setProperty('--hl', hexToRgba(accent, 0.5));
  try {
    localStorage.setItem(THEME_KEY, 'custom');
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify({ c1, c2 }));
  } catch(e){}
  customColors = { c1, c2 };
  updateThemeSelection();
}

function updateThemeSelection() {
  themeGrid.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.themeId === currentThemeId);
  });
  const preview = document.getElementById('customCardPreview');
  if (preview) {
    preview.style.background = `linear-gradient(120deg, ${customColors.c1} 0%, ${customColors.c2} 100%)`;
  }
}

function updateCustomPreview() {
  customThemePreview.style.background = `linear-gradient(120deg, ${customColor1.value} 0%, ${customColor2.value} 100%)`;
}
customColor1.addEventListener('input', updateCustomPreview);
customColor2.addEventListener('input', updateCustomPreview);
$('applyCustomBtn').onclick = () => applyCustomTheme(customColor1.value, customColor2.value);

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

function applyAvatarProfile(name) {
  if (!VALID_PROFILES.includes(name)) name = 'balanced';
  avatarProfile = name;
  avatarProfileSelect.value = name;
  try { localStorage.setItem(AVATAR_PROFILE_KEY, name); } catch(e){}
  const p = getAvatarProfile();
  const hint = $('avatarProfileHint');
  if (hint) hint.innerHTML = `目前品質：<b>${p.label}</b>（最大 ${p.max}px）。`;
  const avTip = $('avatarQualityHint');
  if (avTip) avTip.textContent = `支援 JPG / PNG / GIF，自動壓縮為 ${p.max}×${p.max}`;
}
avatarProfileSelect.onchange = () => applyAvatarProfile(avatarProfileSelect.value);

function applyPetAvatarProfile(name) {
  if (!VALID_PROFILES.includes(name)) name = 'balanced';
  petAvatarProfile = name;
  petAvatarProfileSelect.value = name;
  try { localStorage.setItem(PET_AVATAR_PROFILE_KEY, name); } catch(e){}
  const p = getPetAvatarProfile();
  const hint = $('petAvatarProfileHint');
  if (hint) hint.innerHTML = `目前品質：<b>${p.label}</b>（最大 ${p.max}px）。`;
  const tip = $('petAvatarQualityHint');
  if (tip) tip.textContent = `支援 JPG / PNG / GIF，自動壓縮為 ${p.max}×${p.max}`;
}
petAvatarProfileSelect.onchange = () => applyPetAvatarProfile(petAvatarProfileSelect.value);

function applyGalleryProfile(name) {
  if (!VALID_GALLERY_PROFILES.includes(name)) name = 'medium';
  galleryProfile = name;
  galleryProfileSelect.value = name;
  try { localStorage.setItem(GALLERY_PROFILE_KEY, name); } catch(e){}
  const p = getGalleryProfile();
  const hint = $('galleryProfileHint');
  if (hint) {
    if (name === 'original') {
      hint.innerHTML = `目前品質：<b>原始圖片</b>。不壓縮，保持原始格式與畫質。<br>
        ${iconSvg('exclamation-triangle')} IndexedDB 容量雖然較大，但大型圖片仍會快速佔滿空間。`;
    } else {
      hint.innerHTML = `目前品質：<b>${p.label}</b>（最大 ${p.max}px · ${p.hint}）。`;
    }
  }
}
galleryProfileSelect.onchange = () => applyGalleryProfile(galleryProfileSelect.value);

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

function loadSavedBg() {
  try {
    const raw = localStorage.getItem(BG_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      bgSettings = { image:obj.image||null,
        opacity: typeof obj.opacity==='number' ? obj.opacity : 0.5,
        fit: obj.fit||'cover' };
    }
  } catch(e){}
  applyBg();
}
function applyBg() {
  const root = document.documentElement;
  const url = resolveImageUrl(bgSettings.image);
  if (url) {
    root.style.setProperty('--custom-bg', `url("${url}")`);
    root.style.setProperty('--custom-bg-opacity', bgSettings.opacity);
    if (bgSettings.fit === 'repeat') {
      root.style.setProperty('--custom-bg-size', 'auto');
      root.style.setProperty('--custom-bg-repeat', 'repeat');
    } else {
      root.style.setProperty('--custom-bg-size', bgSettings.fit);
      root.style.setProperty('--custom-bg-repeat', 'no-repeat');
    }
    viewport.classList.add('has-bg');
  } else {
    root.style.removeProperty('--custom-bg');
    root.style.removeProperty('--custom-bg-opacity');
    root.style.removeProperty('--custom-bg-size');
    root.style.removeProperty('--custom-bg-repeat');
    viewport.classList.remove('has-bg');
  }
}
function saveBg() {
  try { localStorage.setItem(BG_KEY, JSON.stringify(bgSettings)); }
  catch(e) { uiAlert('背景圖片設定儲存失敗。', { title: '儲存失敗', kind: 'danger' }); }
}
function compressBgImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('請選擇圖片檔案')); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = Math.min(BG_MAX / img.width, BG_MAX / img.height, 1);
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = '';
          try { dataUrl = c.toDataURL('image/webp', BG_QUALITY); } catch(_){}
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = c.toDataURL('image/jpeg', BG_QUALITY);
          }
          resolve(dataUrl);
        } catch(err){ reject(err); }
      };
      img.onerror = () => reject(new Error('圖片載入失敗'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}
function updateBgPreview() {
  const el = $('bgPreview');
  const url = resolveImageUrl(bgSettings.image);
  if (url) {
    el.style.backgroundImage = `url("${url}")`;
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = '尚未設定背景圖片';
  }
}

async function updateStorageInfo() {
  const infoEl = $('storageInfo');
  const barEl = $('storageBarFill');
  if (!infoEl || !barEl) return;

  let imgCount = 0, imgSizeKB = 0;
  try {
    const all = await idbGetAllImages();
    imgCount = all.length;
    imgSizeKB = all.reduce((sum, i) => sum + (i.sizeKB || 0), 0);
  } catch(e) {}

  let lsSizeKB = 0;
  try {
    const raw = localStorage.getItem(STORE_KEY) || '';
    lsSizeKB = Math.round(raw.length * 0.75 / 1024);
  } catch(e) {}

  let quotaMB = 0, usedMB = 0;
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      usedMB = est.usage / 1024 / 1024;
      quotaMB = est.quota / 1024 / 1024;
    } catch(e) {}
  }

  const totalKB = imgSizeKB + lsSizeKB;
  let html = `${iconSvg('images')} 圖片 <b>${imgCount}</b> 張 · 約 <b>${(imgSizeKB/1024).toFixed(2)} MB</b>`;
  html += `<br>${iconSvg('file-earmark-text')} 資料（localStorage）約 <b>${(lsSizeKB/1024).toFixed(2)} MB</b>`;
  if (quotaMB > 0) {
    html += `<br>${iconSvg('database')} 瀏覽器總用量 <b>${usedMB.toFixed(1)} MB</b> / 配額 <b>${quotaMB.toFixed(0)} MB</b>`;
    const pct = Math.min(100, (usedMB / quotaMB) * 100);
    barEl.style.width = pct + '%';
    barEl.classList.toggle('warn', pct > 75);
  } else {
    barEl.style.width = Math.min(100, totalKB / 50000 * 100) + '%';
  }

  if (!_idbAvailable) {
    html += `<br><span style="color:#c94a3a">${iconSvg('exclamation-triangle')} 目前瀏覽器 IndexedDB 不可用，圖片以 base64 存在 localStorage</span>`;
  }

  infoEl.innerHTML = html;
}

$('bgBtn').onclick = () => {
  $('bgOpacity').value = Math.round(bgSettings.opacity * 100);
  $('bgOpacityVal').textContent = Math.round(bgSettings.opacity * 100) + '%';
  $('bgFit').value = bgSettings.fit;
  avatarProfileSelect.value = avatarProfile;
  petAvatarProfileSelect.value = petAvatarProfile;
  galleryProfileSelect.value = galleryProfile;
  customColor1.value = customColors.c1;
  customColor2.value = customColors.c2;
  updateCustomPreview();
  renderThemeGrid();
  updateBgPreview();
  updateStorageInfo();
  bgMask.classList.add('show');
};
$('bgCloseBtn').onclick = () => bgMask.classList.remove('show');
bgMask.onclick = e => { if (e.target === bgMask) bgMask.classList.remove('show'); };

// ========【恢復預設】 設定 - 介面設定與範例資料分開處理 ========
const resetUiSettingsBtn = $('resetUiSettingsBtn');
if (resetUiSettingsBtn) {
  resetUiSettingsBtn.onclick = async () => {
    const ok = await uiConfirm(
      '恢復主題、背景、側邊欄寬度、檢視模式與圖片品質等介面設定？\n族譜人物、關係與卡片位置不會被刪除。',
      { title:'重設介面設定', confirmText:'重設', kind:'default' }
    );
    if (!ok) return;

    [THEME_KEY, CUSTOM_COLORS_KEY, BG_KEY, MODE_KEY, LABELS_KEY,
      AVATAR_PROFILE_KEY, PET_AVATAR_PROFILE_KEY, GALLERY_PROFILE_KEY,
      LABEL_LOCK_KEY, SIDEBAR_WIDTH_KEY, FAMILY_PANEL_COLLAPSED_KEY].forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });

    customColors = { c1:'#f0c050', c2:'#a878c8' };
    bgSettings = { image:null, opacity:0.5, fit:'cover' };
    showRelLabels = true;
    applySidebarWidth(SIDEBAR_DEFAULT_WIDTH, { persist:false });
    setFamilyPanelCollapsed(false, { persist:false });
    applyTheme('ling');
    applyViewMode('view');
    applyLabelLock(false);
    applyAvatarProfile('balanced');
    applyPetAvatarProfile('balanced');
    applyGalleryProfile('medium');
    applyBg();
    updateBgPreview();
    updateLayoutToggle();
    const labelBtn = $('labelToggle');
    if (labelBtn) {
      labelBtn.classList.add('active');
      setIconText(labelBtn, 'tags', '隱藏關係');
    }
    renderThemeGrid();
    render();
    requestAnimationFrame(fitScreen);
    uiToast('介面設定已恢復預設。');
  };
}

const restoreSampleBtn = $('restoreSampleBtn');
if (restoreSampleBtn) {
  restoreSampleBtn.onclick = async () => {
    const ok = await uiConfirm(
      '這會刪除目前族譜資料，並重新建立繁體中文的預設範例。\n此操作無法復原，建議先匯出 JSON 備份。',
      { title:'重建範例資料', confirmText:'重建範例資料', kind:'danger' }
    );
    if (!ok) return;
    closeEditor();
    db = buildSample();
    dragHistory.clear();
    normalizeAllSims(db);
    invalidateChildrenIndex();
    save({ immediate:true });
    refreshFamilyUI();
    render();
    bgMask.classList.remove('show');
    requestAnimationFrame(fitScreen);
    uiToast('已重建繁中範例資料。');
  };
}

$('bgInput').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await compressBgImage(file);
    const id = await saveImageToIdb(dataUrl);
    if (id) bgSettings.image = id;
    else bgSettings.image = dataUrl;
    applyBg(); saveBg(); updateBgPreview();
  } catch(err){ uiAlert('背景處理失敗：' + err.message, { title: '圖片處理失敗', kind: 'danger' }); }
  e.target.value = '';
};
$('bgOpacity').oninput = () => {
  const v = +$('bgOpacity').value;
  bgSettings.opacity = v / 100;
  $('bgOpacityVal').textContent = v + '%';
  applyBg(); saveBg();
};
$('bgFit').onchange = () => {
  bgSettings.fit = $('bgFit').value;
  applyBg(); saveBg();
};
$('bgClearBtn').onclick = async () => {
  if (!bgSettings.image) return;
  if (!await uiConfirm('確定清除目前背景圖片嗎？', { title: '移除背景圖片', kind: 'danger', confirmText: '移除背景' })) return;
  if (isImageIdRef(bgSettings.image)) {
    try { await idbDeleteImage(bgSettings.image); } catch(e){}
    imageCache.delete(bgSettings.image);
  }
  bgSettings.image = null;
  applyBg(); saveBg(); updateBgPreview();
  updateStorageInfo();
};

$('cleanupBtn').onclick = async () => {
  if (!await uiConfirm('將掃描所有未被引用的圖片並刪除。確定繼續嗎？', { title: '清理未使用圖片', kind: 'danger', confirmText: '開始清理' })) return;
  const n = await cleanupUnusedImages();
  uiToast(`清理完成，共刪除 ${n} 張未使用圖片。`);
  updateStorageInfo();
};

$('tipsBtn').onclick = () => tipsMask.classList.add('show');
$('tipsCloseBtn').onclick = () => tipsMask.classList.remove('show');
tipsMask.onclick = e => { if (e.target === tipsMask) tipsMask.classList.remove('show'); };

const MODAL_STACK = ['photoMask','petMask','mask','infoMask','galleryViewerMask',
                     'galleryBrowserMask','tipsMask',
                     'removeMemberMask','rosterMask','addMemberMask','bgMask'];
function closeTopModal() {
  for (const id of MODAL_STACK) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('show')) {
      el.classList.remove('show');
      if (id === 'mask') { editingId = null; editingAvatar = null; editingPets = []; editingGallery = []; }
      if (id === 'petMask') { editingPetIndex = -1; editingPetAvatar = null; }
      if (id === 'photoMask') { editingPhotoIndex = -1; editingPhotoImageRef = ''; }
      if (id === 'infoMask') infoCardId = null;
      if (id === 'galleryViewerMask') {
        viewerSimId = null;
        viewerMode = 'edit';
        viewerGlobalList = [];
      }
      return true;
    }
  }
  return false;
}

function isDescendant(ancestorId, nodeId) {
  const queue = [nodeId]; const seen = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const s = db.sims[id];
    if (!s) continue;
    for (const pid of (s.parentIds||[])) {
      if (pid === ancestorId) return true;
      queue.push(pid);
    }
  }
  return false;
}

let _childrenIndex = null;
function getChildrenOf(id) {
  if (!_childrenIndex) {
    _childrenIndex = new Map();
    Object.values(db.sims).forEach(s => {
      (s.parentIds || []).forEach(pid => {
        let arr = _childrenIndex.get(pid);
        if (!arr) { arr = []; _childrenIndex.set(pid, arr); }
        arr.push(s);
      });
    });
  }
  return _childrenIndex.get(id) || [];
}
function invalidateChildrenIndex() { _childrenIndex = null; }


/* ========【舊版資料相容】 設定 - 將舊版簡中系統值正規化為繁中 ======== */
/*
 * 注意：下列簡中文字串只用來辨識舊 JSON / localStorage 內的系統列舉值。
 * 使用者自行輸入的姓名、簡介、備註、特徵等文字不會被自動轉換。
 */
const LEGACY_SYSTEM_VALUE_MAP = Object.freeze({
  // 舊版簡中列舉值
  '婴儿':'嬰兒', '幼儿':'幼兒', '儿童':'兒童',
  '幽灵':'幽靈',
  '领养':'領養', '亲生':'親生',

  // 歷史版本可能保存過顯示語言值；載入時統一正規化為繁中 canonical 列舉值。
  'Infant':'嬰兒', 'Toddler':'幼兒', 'Child':'兒童', 'Teen':'青少年',
  'Young Adult':'青年', 'Adult':'成年', 'Elder':'老年', 'Young':'幼年',
  'Male':'男', 'Female':'女', 'Other':'其他',
  'Alive':'在世', 'Ghost':'幽靈', 'Deceased':'已故'
});

function normalizeLegacySystemValue(value) {
  return LEGACY_SYSTEM_VALUE_MAP[value] || value;
}

function normalizeAllSims(targetDb) {
  Object.values(targetDb.sims || {}).forEach(s => {
    // 只正規化程式列舉值；玩家自行輸入的內容維持原樣。
    s.gender = normalizeLegacySystemValue(s.gender || '男');
    s.lifeStage = normalizeLegacySystemValue(s.lifeStage || '成年');
    s.status = normalizeLegacySystemValue(s.status || '在世');
    if (!Array.isArray(s.parentIds)) {
      s.parentIds = s.parentId ? [s.parentId] : [];
      delete s.parentId;
    }
    s.parentIds = s.parentIds.filter(id => targetDb.sims[id]);
    if (s.parentIds.length > 2) s.parentIds = s.parentIds.slice(0,2);
    if (!Array.isArray(s.spouseIds)) s.spouseIds = [];
    if (!Array.isArray(s.exSpouseIds)) s.exSpouseIds = [];
    if (!Array.isArray(s.traits)) s.traits = [];
    if (s.avatar === undefined) s.avatar = null;
    if (s.race === undefined) s.race = '';
    if (s.residence === undefined) s.residence = '';
    if (s.aspiration === undefined) s.aspiration = '';
    if (s.causeOfDeath === undefined) s.causeOfDeath = '';
    if (!Array.isArray(s.pets)) s.pets = [];
    s.pets = s.pets.filter(p => p && typeof p === 'object').map(p => ({
      id: p.id || uid('pet'),
      name: p.name || '',
      species: p.species || 'other',
      breed: p.breed || '',
      gender: normalizeLegacySystemValue(p.gender || '男'),
      ageStage: normalizeLegacySystemValue(p.ageStage || '成年'),
      status: normalizeLegacySystemValue(p.status || '在世'),
      avatar: p.avatar || null
    }));
    if (!Array.isArray(s.gallery)) s.gallery = [];
    s.gallery = s.gallery.filter(g => g && typeof g === 'object').map(g => ({
      id: g.id || uid('gal'),
      title: g.title || '',
      note: g.note || '',
      lifeStage: normalizeLegacySystemValue(g.lifeStage || ''),
      image: g.image || '',
      addedAt: g.addedAt || Date.now()
    }));
  });
  if (!targetDb.relMap || typeof targetDb.relMap !== 'object') targetDb.relMap = {};
  if (!targetDb.labelPos || typeof targetDb.labelPos !== 'object') targetDb.labelPos = {};
  targetDb.families.forEach(f => { ensureFamilyLayoutShape(f); ensureFamilyProfileShape(f); });
}


async function migrateBase64ToIdb() {
  if (!_idbAvailable) return 0;
  let count = 0;
  const tasks = [];
  const migrateRef = (obj, key) => {
    if (!isBase64Ref(obj[key])) return;
    const dataUrl = obj[key];
    tasks.push((async () => {
      try {
        const id = await saveImageToIdb(dataUrl);
        if (id) { obj[key] = id; count++; }
      } catch(e) {}
    })());
  };
  Object.values(db.sims).forEach(sim => {
    migrateRef(sim, 'avatar');
    (sim.gallery || []).forEach(g => migrateRef(g, 'image'));
    (sim.pets || []).forEach(p => migrateRef(p, 'avatar'));
  });
  (db.families || []).forEach(fam => migrateRef(fam, 'coverImage'));
  if (bgSettings) migrateRef(bgSettings, 'image');
  await Promise.all(tasks);
  if (count > 0) {
    save({ immediate: true });
    try { localStorage.setItem(BG_KEY, JSON.stringify(bgSettings)); } catch(e){}
    console.log(`[遷移] 已將 ${count} 張圖片從 localStorage 遷移到 IndexedDB`);
  }
  return count;
}

async function cleanupUnusedImages() {
  if (!_idbAvailable) return 0;
  const used = new Set();
  Object.values(db.sims).forEach(sim => {
    if (sim.avatar && isImageIdRef(sim.avatar)) used.add(sim.avatar);
    (sim.gallery || []).forEach(g => { if (g.image && isImageIdRef(g.image)) used.add(g.image); });
    (sim.pets || []).forEach(p => { if (p.avatar && isImageIdRef(p.avatar)) used.add(p.avatar); });
  });
  (db.families || []).forEach(fam => { if (fam.coverImage && isImageIdRef(fam.coverImage)) used.add(fam.coverImage); });
  if (bgSettings?.image && isImageIdRef(bgSettings.image)) used.add(bgSettings.image);

  let orphans = [];
  try {
    const all = await idbGetAllImages();
    orphans = all.filter(img => !used.has(img.id));
  } catch(e) { return 0; }

  for (const img of orphans) {
    try {
      await idbDeleteImage(img.id);
      imageCache.delete(img.id);
    } catch(e){}
  }
  if (orphans.length) console.log(`[GC] 清理了 ${orphans.length} 張未使用的圖片`);
  return orphans.length;
}

let _gcTimer = null;
function scheduleGC() {
  if (_gcTimer) return;
  _gcTimer = setTimeout(async () => {
    _gcTimer = null;
    await cleanupUnusedImages();
  }, 5000);
}

function getRelInfoByKey(key, kindHint) {
  const rm = db.relMap || {};
  let saved = rm[key];
  if (!saved) {
    const colon = key.indexOf(':');
    if (colon >= 0) {
      const raw = key.slice(colon+1);
      if (rm[raw]) saved = rm[raw];
    }
  }
  saved = saved || {};
  const kind = saved.kind || kindHint || 'custom';
  if (kind === 'none') return null;
  const preset = REL_PRESETS[kind] || REL_PRESETS.custom;
  const text = (saved.text && saved.text.trim()) || preset.label;
  return { icon: preset.icon, text, kind };
}

function getLabelOffset(key) {
  if (!key) return { dx:0, dy:0 };
  const o = (db.labelPos || {})[key] || {};
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

function compressImage(file, kind = 'sim') {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('請選擇圖片檔案')); return; }
    const prof = (kind === 'pet') ? getPetAvatarProfile() : getAvatarProfile();
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = Math.min(prof.max / img.width, prof.max / img.height, 1);
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = '';
          try { dataUrl = c.toDataURL('image/webp', prof.webp); } catch(_){}
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = c.toDataURL('image/jpeg', prof.jpeg);
          }
          resolve({ dataUrl, sizeKB: Math.round(dataUrl.length * 0.75 / 1024) });
        } catch(err){ reject(err); }
      };
      img.onerror = () => reject(new Error('圖片載入失敗'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}

function compressGalleryImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('請選擇圖片檔案')); return; }
    const prof = getGalleryProfile();
    const isOriginal = galleryProfile === 'original';
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      if (isOriginal) {
        const sizeKB = Math.round(dataUrl.length * 0.75 / 1024);
        resolve({ dataUrl, sizeKB, isOriginal: true });
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = Math.min(prof.max / img.width, prof.max / img.height, 1);
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          let out = '';
          try { out = c.toDataURL('image/webp', prof.webp); } catch(_){}
          if (!out.startsWith('data:image/webp')) {
            out = c.toDataURL('image/jpeg', prof.jpeg);
          }
          resolve({ dataUrl: out, sizeKB: Math.round(out.length * 0.75 / 1024), isOriginal: false });
        } catch(err) { reject(err); }
      };
      img.onerror = () => reject(new Error('圖片載入失敗'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}

function getVisibleIds(familyId) {
  const fam = db.families.find(f => f.id === familyId);
  if (!fam) return new Set();
  const result = new Set(fam.memberIds.filter(id => db.sims[id]));
  [...result].forEach(id => {
    const s = db.sims[id];
    if (!s) return;
    (s.spouseIds||[]).forEach(sid => { if (db.sims[sid]) result.add(sid); });
    (s.exSpouseIds||[]).forEach(sid => { if (db.sims[sid]) result.add(sid); });
  });

  // 篩選是真正的顯示篩選，不再只是把不符合的人物淡化。
  [...result].forEach(id => {
    if (!simMatchesTopbarFilters(db.sims[id])) result.delete(id);
  });
  return result;
}

// ========【配偶間距】 設定 - 依關係標籤實際寬度自適應 ========
function relationshipBubbleWidth(info) {
  if (!info) return 0;
  const fs = 12;
  const displayText = displayRelationshipText(info.text || '');
  const iconSpace = info.icon ? 18 : 0;
  return Math.max(Math.ceil(measureText(displayText, fs) + iconSpace + 24), 42);
}

function getAdaptiveSpouseGap(members, baseGap) {
  if (!members || members.length < 2) return baseGap;

  // 配偶標籤必須完整放在兩張卡片之間，左右各保留約 10px 呼吸空間。
  // 英文、自訂長關係名稱都會依實際顯示文字重新量測；隱藏關係按鈕不會改變這個幾何間距。
  let widestLabel = 0;
  const head = members[0];
  for (let i = 1; i < members.length; i += 1) {
    const spouse = members[i];
    const pairK = pairKey(head.id, spouse.id);
    const info = getRelInfoByKey('spouse:' + pairK, 'spouse');
    widestLabel = Math.max(widestLabel, relationshipBubbleWidth(info));
  }

  const visualMinimum = viewMode === 'view' ? 52 : 60;
  const labelDrivenGap = widestLabel ? widestLabel + 20 : 0;
  // 上限避免極長自訂關係把整棵族譜撐得過度鬆散。
  return Math.min(Math.max(baseGap, visualMinimum, labelDrivenGap), 168);
}

function computeAutoPositions(visibleIds) {
  const { W: NODE_W, H: NODE_H } = getDims();
  const { SPOUSE: SPOUSE_GAP, SIBLING: SIBLING_GAP, LEVEL: LEVEL_GAP } = getGaps();
  const sims = [...visibleIds].map(id => db.sims[id]).filter(Boolean);
  const byId = new Map(sims.map(c => [c.id, c]));
  const childrenOf = new Map();
  sims.forEach(c => {
    const visPids = (c.parentIds||[]).filter(pid => byId.has(pid));
    if (visPids.length) {
      const anchor = visPids[0];
      if (!childrenOf.has(anchor)) childrenOf.set(anchor, []);
      childrenOf.get(anchor).push(c);
    }
  });
  childrenOf.forEach(arr => arr.sort((a,b) =>
    (a.order??0) - (b.order??0) || String(a.name).localeCompare(String(b.name),'zh')));
  const placed = new Set(); const units = []; let cursor = 0;
  function makeUnit(head) {
    const members = [head]; placed.add(head.id);
    (head.spouseIds||[]).forEach(sid => {
      const sp = byId.get(sid);
      if (sp && !placed.has(sp.id)) { members.push(sp); placed.add(sp.id); }
    });
    const spouseGap = getAdaptiveSpouseGap(members, SPOUSE_GAP);
    return {
      members,
      spouseGap,
      width: members.length * NODE_W + (members.length - 1) * spouseGap,
      x:0,
      y:0
    };
  }
  function layoutUnit(unit, depth) {
    const childHeads = [];
    unit.members.forEach(m => {
      (childrenOf.get(m.id)||[]).forEach(ch => { if (!placed.has(ch.id)) childHeads.push(ch); });
    });
    const childUnits = [];
    childHeads.forEach(h => { if (!placed.has(h.id)) childUnits.push(makeUnit(h)); });
    if (childUnits.length === 0) {
      unit.x = cursor;
      cursor += unit.width + SIBLING_GAP;
    } else {
      childUnits.forEach(cu => layoutUnit(cu, depth+1));
      const first = childUnits[0], last = childUnits[childUnits.length - 1];
      unit.x = (first.x + last.x + last.width) / 2 - unit.width / 2;
      if (unit.x + unit.width + SIBLING_GAP > cursor) cursor = unit.x + unit.width + SIBLING_GAP;
    }
    unit.y = depth * (NODE_H + LEVEL_GAP);
    units.push(unit);
  }
  sims.forEach(c => {
    if (placed.has(c.id)) return;
    if ((c.parentIds||[]).some(pid => byId.has(pid))) return;
    layoutUnit(makeUnit(c), 0);
  });
  sims.forEach(c => { if (!placed.has(c.id)) layoutUnit(makeUnit(c), 0); });
  const pos = new Map();
  units.forEach(u => {
    const spouseGap = Number.isFinite(u.spouseGap) ? u.spouseGap : SPOUSE_GAP;
    u.members.forEach((m,i) => { pos.set(m.id, { x: u.x + i * (NODE_W + spouseGap), y: u.y }); });
  });
  let minX = Infinity;
  pos.forEach(p => { if (p.x < minX) minX = p.x; });
  if (minX < 0) pos.forEach(p => { p.x -= minX; });
  return pos;
}

function computeLayout() {
  const { W: NODE_W, H: NODE_H } = getDims();
  const fam = currentFamily();
  const visibleIds = getVisibleIds(fam.id);
  const sims = [...visibleIds].map(id => db.sims[id]).filter(Boolean);
  const byId = new Map(sims.map(c => [c.id, c]));
  const manualPos = getCurrentManualPos(fam);
  const isFree = getCurrentFreeLayout(fam);
  if (isFree) {
    const autoPos = computeAutoPositions(visibleIds);
    const pos = new Map(); let maxX=0, maxY=0;
    sims.forEach(s => {
      const manual = manualPos[s.id];
      const p = manual || autoPos.get(s.id) || {x:0,y:0};
      pos.set(s.id, {x:p.x, y:p.y});
      maxX = Math.max(maxX, p.x + NODE_W);
      maxY = Math.max(maxY, p.y + NODE_H);
    });
    return {pos, width:maxX, height:maxY, byId, visibleIds};
  }
  const pos = computeAutoPositions(visibleIds);
  let maxX=0, maxY=0;
  pos.forEach(p => {
    maxX = Math.max(maxX, p.x + NODE_W);
    maxY = Math.max(maxY, p.y + NODE_H);
  });
  return {pos, width:maxX, height:maxY, byId, visibleIds};
}

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
  const mx = clientX - rect.left, my = clientY - rect.top;
  const rawScale = Math.min(Math.max(scale*factor, SCALE_MIN), SCALE_MAX);
  const ns = Math.round(rawScale * 40) / 40;
  if (ns === scale) return;
  const wx = (mx - panX) / scale, wy = (my - panY) / scale;
  scale = ns;
  panX = mx - wx * scale;
  panY = my - wy * scale;
  applyTransform({ interacting: true });
}
function fitScreen() {
  const w = parseFloat(stage.style.width) || 1;
  const h = parseFloat(stage.style.height) || 1;
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  scale = Math.min((vw-40)/w, (vh-40)/h, 1.4);
  scale = Math.max(scale, SCALE_MIN);
  panX = (vw - w*scale)/2;
  panY = (vh - h*scale)/2;
  applyTransform();
}

function focusSimOnCanvas(simId) {
  if (!simId || !db?.sims?.[simId]) return;
  if (!layoutCache || !layoutCache.pos?.has(simId)) render();
  const pos = layoutCache?.pos?.get(simId);
  if (!pos) return;
  const { W, H } = getDims();
  // 尋找人物時不強制改成固定倍率；只有畫面縮得太小時才稍微放大，避免失去上下文。
  if (scale < .72) scale = .72;
  const centerX = pos.x + PAD + W / 2;
  const centerY = pos.y + PAD + H / 2;
  panX = viewport.clientWidth / 2 - centerX * scale;
  panY = viewport.clientHeight / 2 - centerY * scale;
  applyTransform();
  const node = [...nodes.querySelectorAll('.node[data-id]')].find(el => el.dataset.id === simId);
  if (node) {
    node.classList.remove('focus-pulse');
    void node.offsetWidth;
    node.classList.add('focus-pulse');
    setTimeout(() => node.classList.remove('focus-pulse'), 1100);
  }
}

let _edgeRaf = null;
function scheduleEdgeRedraw() {
  if (_edgeRaf) return;
  _edgeRaf = requestAnimationFrame(() => { _edgeRaf = null; drawEdges(); });
}

function render() {
  layoutCache = computeLayout();
  const {width, height} = layoutCache;
  const sW = Math.max(width + PAD*2, 400);
  const sH = Math.max(height + PAD*2, 300);
  stage.style.width = sW + 'px';
  stage.style.height = sH + 'px';
  svg.setAttribute('width', sW);
  svg.setAttribute('height', sH);
  svg.setAttribute('viewBox', `0 0 ${sW} ${sH}`);
  labelsSvg.setAttribute('width', sW);
  labelsSvg.setAttribute('height', sH);
  labelsSvg.setAttribute('viewBox', `0 0 ${sW} ${sH}`);
  drawEdges();
  drawNodes();
  updateLayoutToggle();
  if (rosterMask.classList.contains('show')) renderRoster();
  if (addMemberMask.classList.contains('show')) renderAddMemberList();
  if (removeMemberMask.classList.contains('show')) renderRemoveMemberList();
  if (galleryBrowserMask.classList.contains('show')) renderGalleryBrowser();
}

function drawEdges() {
  if (!layoutCache) return;
  const { W: NODE_W, H: NODE_H } = getDims();
  const {pos, byId, visibleIds} = layoutCache;
  const paths = [], labels = [];

  visibleIds.forEach(id => {
    const c = byId.get(id);
    if (!c) return;
    const visPids = (c.parentIds||[]).filter(pid => byId.has(pid));
    if (!visPids.length) return;
    const a = pos.get(c.id);
    if (!a) return;
    const p0 = pos.get(visPids[0]);
    if (!p0) return;

    // 雙親存在時，主幹必須直接接到兩位父母之間的配偶線。
    // 雙親子女連線以實際配偶線接點作為共同起點，避免自由排列時產生懸空斷點。
    let start;
    if (visPids.length >= 2) {
      const pA = pos.get(visPids[0]);
      const pB = pos.get(visPids[1]);
      if (!pA || !pB) return;
      start = pairJoinPoint(pA, pB);
    } else {
      const childIsBelow = cardCenterY(a) >= cardCenterY(p0);
      start = cardVerticalAnchor(p0, childIsBelow ? 'bottom' : 'top');
    }

    // 親子線只允許接到子女卡片的上 / 下正中央，不因水平拖曳改接左右側。
    const childAnchor = cardVerticalAnchor(a, start.y <= cardCenterY(a) ? 'top' : 'bottom');
    const x1 = start.x;
    const y1 = start.y;
    const x2 = childAnchor.x;
    const y2 = childAnchor.y;

    // 親子關係的水平分支線與關係標籤必須共用同一個中點。
    // 以「上一代卡片底部」與「下一代卡片頂部」之間的可用空間計算，
    // 因此拉開代距後，線與文字會一起維持在視覺正中央。
    let branchY = y1 + (y2 - y1) / 2;
    const childTop = cardVerticalAnchor(a, 'top').y;
    if (childTop > y1) {
      let upperBottom = cardVerticalAnchor(p0, 'bottom').y;
      if (visPids.length >= 2) {
        const pA = pos.get(visPids[0]);
        const pB = pos.get(visPids[1]);
        if (pA && pB) {
          upperBottom = Math.max(
            cardVerticalAnchor(pA, 'bottom').y,
            cardVerticalAnchor(pB, 'bottom').y
          );
        }
      }
      if (childTop > upperBottom) branchY = upperBottom + (childTop - upperBottom) / 2;
    }

    const adopt = c.adoptive ? ' edge-adopt' : '';
    paths.push(`<path class="edge edge-parent${adopt}" d="M${x1} ${y1} V${branchY} H${x2} V${y2}"/>`);
    if (showRelLabels) {
      const key = 'parent:' + c.id;
      const info = getRelInfoByKey(key, c.adoptive ? 'adoptive' : 'parent-child');
      if (info) labels.push(makeLabelSVG((x1+x2)/2, branchY, info.icon, info.text, key));
    }
  });

  const drawnPair = new Set();
  visibleIds.forEach(id => {
    const c = byId.get(id);
    if (!c) return;
    (c.spouseIds||[]).forEach(sid => {
      if (!visibleIds.has(sid)) return;
      const pairK = pairKey(id, sid);
      if (drawnPair.has(pairK)) return;
      drawnPair.add(pairK);
      const a = pos.get(id), b = pos.get(sid);
      if (!a || !b) return;
      paths.push(`<path class="edge edge-spouse" d="${pairPath(a,b)}"/>`);
      if (showRelLabels) {
        const key = 'spouse:' + pairK;
        const info = getRelInfoByKey(key, 'spouse');
        if (info) {
          const join = pairJoinPoint(a, b);
          labels.push(makeLabelSVG(join.x, join.y, info.icon, info.text, key));
        }
      }
    });
  });

  const drawnEx = new Set();
  visibleIds.forEach(id => {
    const c = byId.get(id);
    if (!c) return;
    (c.exSpouseIds||[]).forEach(sid => {
      if (!visibleIds.has(sid)) return;
      const pairK = pairKey(id, sid);
      if (drawnEx.has(pairK)) return;
      drawnEx.add(pairK);
      const a = pos.get(id), b = pos.get(sid);
      if (!a || !b) return;
      paths.push(`<path class="edge edge-exspouse" d="${pairPath(a,b)}"/>`);
      if (showRelLabels) {
        const key = 'exspouse:' + pairK;
        const info = getRelInfoByKey(key, 'exspouse');
        if (info) {
          const join = pairJoinPoint(a, b);
          labels.push(makeLabelSVG(join.x, join.y, info.icon, info.text, key));
        }
      }
    });
  });

  (db.links||[]).forEach(l => {
    if (!visibleIds.has(l.from) || !visibleIds.has(l.to)) return;
    const a = pos.get(l.from), b = pos.get(l.to);
    if (!a || !b) return;
    const fromAnchor = avatarBoundaryAnchor(a, b);
    const toAnchor = avatarBoundaryAnchor(b, a);
    const x1 = fromAnchor.x, y1 = fromAnchor.y;
    const x2 = toAnchor.x, y2 = toAnchor.y;
    const dx = x2-x1, dy = y2-y1;
    const cx = (x1+x2)/2 - dy*0.15;
    const cy = (y1+y2)/2 + dx*0.15;
    paths.push(`<path class="edge edge-other" d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}"/>`);
    if (showRelLabels) {
      const key = 'link:' + l.id;
      const info = getRelInfoByKey(key, 'custom');
      if (info) {
        const px = 0.25*x1 + 0.5*cx + 0.25*x2;
        const py = 0.25*y1 + 0.5*cy + 0.25*y2;
        labels.push(makeLabelSVG(px, py, info.icon, info.text, key));
      }
    }
  });

  svg.innerHTML = paths.join('');
  labelsSvg.innerHTML = labels.join('');
}

// ========【族譜連線】 設定 - 無框卡接頭像；有外框卡接卡片邊界，避免線條延伸進卡片 ========
function getCardAvatarGeometry() {
  const { W: NODE_W } = getDims();
  if (viewMode === 'edit') {
    const settings = getCardEditSettings();
    const hasBody = cardSettingsHasBody(settings);
    return hasBody
      ? { size:64, left:12, top:14, centered:false }
      : { size:64, left:(NODE_W - 64) / 2, top:14, centered:false };
  }

  const settings = getCardViewSettings();
  const hasPrimary = !!(settings.name || settings.gender || settings.lifeStage || settings.age || settings.birthday || settings.status || settings.race);
  if (settings.appearance !== 'minimal') {
    return hasPrimary
      ? { size:64, left:12, top:10, centered:false }
      : { size:64, left:(NODE_W - 64) / 2, top:10, centered:false };
  }
  return { size:76, left:(NODE_W - 76) / 2, top:12, centered:false };
}

function cardAvatarRect(card) {
  const geo = getCardAvatarGeometry();
  const left = card.x + PAD + geo.left;
  const top = card.y + PAD + geo.top;
  return {
    left,
    top,
    right: left + geo.size,
    bottom: top + geo.size,
    centerX: left + geo.size / 2,
    centerY: top + geo.size / 2
  };
}

function cardOuterRect(card) {
  const { W: NODE_W, H: NODE_H } = getDims();
  const left = card.x + PAD;
  const top = card.y + PAD;
  return {
    left,
    top,
    right: left + NODE_W,
    bottom: top + NODE_H,
    centerX: left + NODE_W / 2,
    centerY: top + NODE_H / 2
  };
}

function lineAnchorUsesAvatar() {
  // 極簡檢視卡沒有可見外框，線直接接頭像。
  // 半透明／完整檢視卡與編輯卡都有可見外框，線停在卡片邊界，不再向內延伸到頭像。
  return viewMode === 'view' && getCardViewSettings().appearance === 'minimal';
}

function lineAnchorRect(card) {
  return lineAnchorUsesAvatar() ? cardAvatarRect(card) : cardOuterRect(card);
}

function avatarVerticalAnchor(card, side) {
  const rect = lineAnchorRect(card);
  return {
    x: rect.centerX,
    y: side === 'top' ? rect.top : rect.bottom
  };
}

function avatarBoundaryAnchor(card, targetCard) {
  const rect = lineAnchorRect(card);
  const target = lineAnchorRect(targetCard);
  const dx = target.centerX - rect.centerX;
  const dy = target.centerY - rect.centerY;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx >= 0 ? rect.right : rect.left, y: rect.centerY };
  }
  return { x: rect.centerX, y: dy >= 0 ? rect.bottom : rect.top };
}

function pairJoinPoint(a, b) {
  const aRect = lineAnchorRect(a);
  const bRect = lineAnchorRect(b);
  const dx = bRect.centerX - aRect.centerX;
  const dy = bRect.centerY - aRect.centerY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = dx > 0 ? aRect.right : aRect.left;
    const x2 = dx > 0 ? bRect.left : bRect.right;
    if (Math.abs(aRect.centerY - bRect.centerY) < 2) {
      return { x: (x1 + x2) / 2, y: aRect.centerY };
    }
    return { x: (x1 + x2) / 2, y: (aRect.centerY + bRect.centerY) / 2 };
  }

  const y1 = dy > 0 ? aRect.bottom : aRect.top;
  const y2 = dy > 0 ? bRect.top : bRect.bottom;
  return { x: (aRect.centerX + bRect.centerX) / 2, y: (y1 + y2) / 2 };
}

function cardVerticalAnchor(card, side) {
  return avatarVerticalAnchor(card, side);
}

function cardCenterY(card) {
  return lineAnchorRect(card).centerY;
}

function pairPath(a, b) {
  const aRect = lineAnchorRect(a);
  const bRect = lineAnchorRect(b);
  const dx = bRect.centerX - aRect.centerX;
  const dy = bRect.centerY - aRect.centerY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = dx > 0 ? aRect.right : aRect.left;
    const x2 = dx > 0 ? bRect.left : bRect.right;
    if (Math.abs(aRect.centerY - bRect.centerY) < 2) {
      return `M${x1} ${aRect.centerY} H${x2}`;
    }
    const mx = (x1 + x2) / 2;
    return `M${x1} ${aRect.centerY} H${mx} V${bRect.centerY} H${x2}`;
  }

  const y1 = dy > 0 ? aRect.bottom : aRect.top;
  const y2 = dy > 0 ? bRect.top : bRect.bottom;
  const my = (y1 + y2) / 2;
  return `M${aRect.centerX} ${y1} V${my} H${bRect.centerX} V${y2}`;
}

function avatarHTML(sim) {
  const url = resolveImageUrl(sim.avatar);
  if (url) return `<img src="${esc(url)}" alt="" draggable="false">`;
  const ch = displayDataText(sim.name||'?', sim).trim().charAt(0) || '?';
  return esc(ch);
}
function statusBadgeHTML(sim) {
  if (sim.status === '幽靈') return `<div class="n-badge ghost" title="${esc(uiText('幽靈'))}">${iconSvg('ghost-symbol')}</div>`;
  if (sim.status === '已故') return `<div class="n-badge dead" title="${esc(uiText('已故'))}">${iconSvg('tombstone')}</div>`;
  return `<div class="n-badge alive" title="${esc(uiText('在世'))}">${iconSvg('heart')}</div>`;
}
function statusIconHTML(sim) {
  if (sim.status === '幽靈') return `<span class="roster-badge status-icon status-ghost" title="${esc(uiText('幽靈'))}">${iconSvg('ghost-symbol')}</span>`;
  if (sim.status === '已故') return `<span class="roster-badge status-icon status-dead" title="${esc(uiText('已故'))}">${iconSvg('tombstone')}</span>`;
  return `<span class="roster-badge status-icon status-alive" title="${esc(uiText('在世'))}">${iconSvg('heart')}</span>`;
}
function raceBadgeHTML(sim) {
  const r = (sim.race || '').trim();
  if (!r) return '';
  const preset = RACE_PRESETS[r];
  if (!preset || !preset.icon) return '';
  return `<div class="n-race-badge race-icon" title="${esc(uiText(preset.label))}">${iconSvg(preset.icon)}</div>`;
}
function raceIconHTML(sim) {
  const r = (sim.race || '').trim();
  if (!r) return '';
  const preset = RACE_PRESETS[r];
  if (!preset || !preset.icon) return '';
  return `<span class="roster-badge race-icon" title="${esc(uiText(preset.label))}">${iconSvg(preset.icon)}</span>`;
}
function buildTagsHTML(traits, owner = null) {
  const list = (traits||[]).filter(Boolean).map(value => displayDataText(value, owner));
  if (!list.length) return '';
  const shown = list.slice(0, MAX_TAGS);
  const rest = list.length - shown.length;
  let html = shown.map(t => `<span class="tag" title="${esc(t)}">${esc(t)}</span>`).join('');
  if (rest > 0) {
    html += `<span class="tag tag-more" title="${esc(list.slice(MAX_TAGS).join('、'))}">+${rest}</span>`;
  }
  return html;
}
function petIconFor(pet) {
  const sp = PET_SPECIES[pet.species] || PET_SPECIES.other;
  return iconSvg(sp.icon, 'pet-icon');
}
function petSpeciesLabel(pet) {
  const sp = PET_SPECIES[pet.species] || PET_SPECIES.other;
  return uiText(sp.label);
}
function petStatusIcon(pet) {
  if (pet.status === '幽靈') return iconSvg('ghost-symbol');
  if (pet.status === '已故') return iconSvg('tombstone');
  return '';
}
function buildPetsChipsHTML(pets, owner = null) {
  if (!pets || !pets.length) return '';
  const chips = pets.slice(0, 3).map(p => {
    const icon = petIconFor(p);
    const st = petStatusIcon(p);
    const petName = displayDataText(p.name, owner);
    const breed = displayDataText(p.breed, owner);
    return `<span class="n-pet-chip" title="${esc(petName)} · ${esc(petSpeciesLabel(p))}${breed ? ' · ' + esc(breed) : ''}"><span class="pet-icon">${icon}</span>${st ? st : ''}${esc(petName)}</span>`;
  }).join('');
  const rest = pets.length > 3 ? `<span class="n-pet-chip" title="${esc(uiText(`${pets.length} 只寵物`))}">+${pets.length-3}</span>` : '';
  return chips + rest;
}
function genderClass(sim) {
  return sim.gender === '男' ? 'male' : sim.gender === '女' ? 'female' : 'other';
}
function statusClass(sim) {
  return sim.status === '幽靈' ? 'ghost' : sim.status === '已故' ? 'dead' : '';
}
function commonNodeClasses(c, opts) {
  opts = opts || {};
  return [
    'node',
    opts.viewMode ? 'view' : '',
    genderClass(c),
    statusClass(c),
    opts.isInlaw ? 'inlaw' : '',
    opts.matchSearch ? 'hl' : ''
  ].filter(Boolean).join(' ');
}

function drawNodes() {
  const { W: NODE_W, H: NODE_H } = getDims();
  const fam = currentFamily();
  const memberSet = new Set(fam.memberIds);
  const {pos, byId, visibleIds} = layoutCache;
  const q = searchInput.value.trim().toLowerCase();
  const isView = viewMode === 'view';
  const cardSettings = isView ? getCardViewSettings() : getCardEditSettings();
  const appearanceClass = isView ? cardViewAppearanceClass() : '';

  const html = [...visibleIds].map(id => {
    const c = byId.get(id);
    const p = pos.get(id);
    if (!c || !p) return '';
    const isInlaw = !memberSet.has(id);

    const dName = displayDataText(c.name, c);
    const dCareer = displayDataText(c.career, c);
    const dResidence = displayDataText(c.residence, c);
    const dAspiration = displayDataText(c.aspiration, c);
    const dCause = displayDataText(c.causeOfDeath, c);
    const dTraits = (c.traits||[]).map(value => displayDataText(value, c));
    const searchable = [
      c.name, dName, c.career, dCareer, c.residence, dResidence,
      c.aspiration, dAspiration, c.causeOfDeath, dCause,
      ...(c.traits||[]), ...dTraits,
      ...(c.pets||[]).flatMap(pt => [pt.name, displayDataText(pt.name, c), pt.breed, displayDataText(pt.breed, c)])
    ].filter(Boolean).join(' ').toLowerCase();
    const matchSearch = !!q && searchable.includes(q);
    const cls = commonNodeClasses(c, {viewMode:isView, isInlaw, matchSearch});
    const dStage = uiText(c.lifeStage);
    const displayName = cardSettings.name ? `${dName}${cardSettings.gender ? formatCardGender(c.gender) : ''}` : '';
    const genderHiddenClass = cardSettings.gender ? '' : ' card-gender-hidden';

    if (isView) {
      const primaryLines = [];
      const detailLines = [];

      if (!cardSettings.name && cardSettings.gender) {
        primaryLines.push(`<div class="n-view-meta">${esc(uiText(c.gender || '其他'))}</div>`);
      }

      const stageAge = [];
      if (cardSettings.lifeStage) stageAge.push(dStage);
      if (cardSettings.age && c.age != null && c.age !== '') stageAge.push(formatCardAge(c.age));
      if (stageAge.length) primaryLines.push(`<div class="n-view-meta">${esc(stageAge.join(' · '))}</div>`);

      if (cardSettings.birthday && c.birthdayMonth && c.birthdayDay) {
        primaryLines.push(`<div class="n-view-meta">${iconSvg('cake2')}<span>${esc(formatBirthdaySummary(c.birthdayMonth, c.birthdayDay))}</span></div>`);
      }

      const statusRace = [];
      if (cardSettings.status) statusRace.push(uiText(c.status || '在世'));
      if (cardSettings.race && c.race && RACE_PRESETS[c.race]) statusRace.push(uiText(RACE_PRESETS[c.race].label));
      if (statusRace.length) primaryLines.push(`<div class="n-view-meta">${esc(statusRace.join(' · '))}</div>`);

      if (cardSettings.career && c.career) detailLines.push(`<div class="n-view-meta n-view-text" title="${esc(dCareer)}">${esc(dCareer)}</div>`);
      if (cardSettings.residence && c.residence) detailLines.push(`<div class="n-view-meta n-view-text" title="${esc(dResidence)}">${iconSvg('house')}<span>${esc(dResidence)}</span></div>`);
      if (cardSettings.aspiration && c.aspiration) detailLines.push(`<div class="n-view-meta n-view-text" title="${esc(dAspiration)}">${iconSvg('bullseye')}<span>${esc(dAspiration)}</span></div>`);
      if (cardSettings.traits && dTraits.length) {
        const traitText = dTraits.slice(0, 2).join(' / ') + (dTraits.length > 2 ? ` +${dTraits.length - 2}` : '');
        detailLines.push(`<div class="n-view-meta n-view-text" title="${esc(dTraits.join(' / '))}">${esc(traitText)}</div>`);
      }
      if (cardSettings.pets || cardSettings.gallery) {
        const mediaBits = [];
        if (cardSettings.pets && (c.pets||[]).length) mediaBits.push(`${uiText('寵物')} ${(c.pets||[]).length}`);
        if (cardSettings.gallery && (c.gallery||[]).length) mediaBits.push(`${uiText('相簿')} ${(c.gallery||[]).length}`);
        if (mediaBits.length) detailLines.push(`<div class="n-view-meta">${esc(mediaBits.join(' · '))}</div>`);
      }

      const configuredPrimary = !!(cardSettings.name || cardSettings.gender || cardSettings.lifeStage || cardSettings.age || cardSettings.birthday || cardSettings.status || cardSettings.race);
      const configuredDetails = !!(cardSettings.career || cardSettings.residence || cardSettings.aspiration || cardSettings.traits || cardSettings.pets || cardSettings.gallery);
      const hasAnyConfiguredText = configuredPrimary || configuredDetails;
      const avatarOnlyClass = hasAnyConfiguredText ? '' : ' card-avatar-only';

      if (cardSettings.appearance === 'minimal') {
        return `<div class="${cls} mode-view ${appearanceClass}${genderHiddenClass}${avatarOnlyClass}" data-id="${c.id}" data-stage="${c.lifeStage}"
          style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
          <div class="n-view-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
          ${cardSettings.name ? `<div class="n-view-name" title="${esc(displayName)}">${esc(displayName)}</div>` : ''}
          ${primaryLines.join('')}
          ${detailLines.join('')}
        </div>`;
      }

      return `<div class="${cls} mode-view ${appearanceClass}${genderHiddenClass}${avatarOnlyClass}" data-id="${c.id}" data-stage="${c.lifeStage}"
        style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
        <div class="n-view-card-head${configuredPrimary ? '' : ' avatar-only'}">
          <div class="n-view-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
          ${configuredPrimary ? `<div class="n-view-card-head-text">
            ${cardSettings.name ? `<div class="n-view-name" title="${esc(displayName)}">${esc(displayName)}</div>` : ''}
            ${primaryLines.join('') || `<div class="n-view-meta">—</div>`}
          </div>` : ''}
        </div>
        ${configuredDetails ? `<div class="n-view-card-details">${detailLines.join('') || `<div class="n-view-meta">—</div>`}</div>` : ''}
      </div>`;
    }

    // 編輯模式有自己的顯示內容設定，不再跟檢視模式同步。
    const editRows = [];
    if (!cardSettings.name && cardSettings.gender) {
      editRows.push(`<div class="n-edit-meta">${esc(uiText(c.gender || '其他'))}</div>`);
    }

    const stageAge = [];
    if (cardSettings.lifeStage) stageAge.push(dStage);
    if (cardSettings.age && c.age != null && c.age !== '') stageAge.push(formatCardAge(c.age));
    if (stageAge.length) editRows.push(`<div class="n-edit-meta">${esc(stageAge.join(' · '))}</div>`);

    if (cardSettings.birthday && c.birthdayMonth && c.birthdayDay) {
      editRows.push(`<div class="n-edit-meta">${iconSvg('cake2')}<span>${esc(formatBirthdaySummary(c.birthdayMonth, c.birthdayDay))}</span></div>`);
    }

    const statusRace = [];
    if (cardSettings.status) statusRace.push(uiText(c.status || '在世'));
    if (cardSettings.race && c.race && RACE_PRESETS[c.race]) statusRace.push(uiText(RACE_PRESETS[c.race].label));
    if (statusRace.length) editRows.push(`<div class="n-edit-meta">${esc(statusRace.join(' · '))}</div>`);

    if (cardSettings.career && c.career) editRows.push(`<div class="n-edit-meta n-edit-text" title="${esc(dCareer)}">${esc(dCareer)}</div>`);
    if (cardSettings.residence && c.residence) editRows.push(`<div class="n-residence" title="${esc(dResidence)}">${iconSvg('house')}${esc(dResidence)}</div>`);
    if (cardSettings.aspiration && c.aspiration) editRows.push(`<div class="n-aspiration" title="${esc(uiText('人生抱負'))}：${esc(dAspiration)}">${iconSvg('bullseye')}${esc(dAspiration)}</div>`);
    if (cardSettings.traits && dTraits.length) editRows.push(`<div class="n-tags">${buildTagsHTML(c.traits, c)}</div>`);
    if (cardSettings.pets && (c.pets||[]).length) editRows.push(`<div class="n-pets">${buildPetsChipsHTML(c.pets, c)}</div>`);
    if (cardSettings.gallery && (c.gallery||[]).length) editRows.push(`<div class="n-gallery-badge" title="${esc(uiText('相簿'))} ${(c.gallery||[]).length}">${iconSvg('images')} ${(c.gallery||[]).length}</div>`);

    const configuredEditBody = cardSettingsHasBody(cardSettings);
    const editBody = configuredEditBody ? `<div class="n-body">
      ${cardSettings.name ? `<div class="n-name" title="${esc(displayName)}">${esc(displayName)}</div>` : ''}
      ${editRows.join('') || (cardSettings.name ? '' : `<div class="n-edit-meta">—</div>`)}
    </div>` : '';
    const avatarOnlyClass = configuredEditBody ? '' : ' card-avatar-only';

    return `<div class="${cls} mode-edit${genderHiddenClass}${avatarOnlyClass}" data-id="${c.id}" data-stage="${c.lifeStage}"
      style="left:${p.x+PAD}px;top:${p.y+PAD}px;width:${NODE_W}px;height:${NODE_H}px">
      <div class="n-avatar" data-line-anchor="avatar">${avatarHTML(c)}</div>
      ${editBody}
    </div>`;
  }).join('');

  nodes.innerHTML = html ||
    `<div class="empty">${esc(uiText('目前家族還沒有成員，使用「成員 ＋」新增或加入人物'))}</div>`;
  syncNodeSelectionClasses();
}

function openInfoCard(id) {
  const c = db.sims[id];
  if (!c) return;
  infoCardId = id;

  const dName = displayDataText(c.name, c);
  const dCareer = displayDataText(c.career, c);
  const dResidence = displayDataText(c.residence, c);
  const dAspiration = displayDataText(c.aspiration, c);
  const dCause = displayDataText(c.causeOfDeath, c);
  const dBio = displayDataText(c.bio, c);

  const av = $('infoCardAvatar');
  av.className = 'info-card-avatar';
  if (c.status === '幽靈') av.classList.add('ghost');
  if (c.status === '已故') av.classList.add('dead');
  const avUrl = resolveImageUrl(c.avatar);
  if (avUrl) av.innerHTML = `<img src="${esc(avUrl)}" alt="">`;
  else av.textContent = (dName || '?').trim().charAt(0) || '?';

  $('infoCardName').textContent = dName || '—';

  const metaItems = [];
  metaItems.push(`<span class="stage-tag stage-${c.lifeStage}">${esc(uiText(c.lifeStage))}</span>`);
  const genderText = uiText(c.gender || '其他');
  const genderIcon = c.gender === '男' ? 'gender-male' : c.gender === '女' ? 'gender-female' : 'gender-ambiguous';
  metaItems.push(`<span class="meta-pill">${iconSvg(genderIcon)}<span>${esc(genderText)}</span></span>`);
  metaItems.push(`<span class="meta-pill">${statusIconHTML(c)}<span>${esc(uiText(c.status || '在世'))}</span></span>`);
  if (c.race && RACE_PRESETS[c.race]) {
    const race = RACE_PRESETS[c.race];
    metaItems.push(`<span class="meta-pill">${race.icon ? iconSvg(race.icon) : ''}<span>${esc(uiText(race.label))}</span></span>`);
  }
  $('infoCardMeta').innerHTML = metaItems.join('');

  const headFacts = [];
  const birthdayText = c.birthdayMonth && c.birthdayDay ? formatBirthdaySummary(c.birthdayMonth, c.birthdayDay) : uiText('生日未設定');
  const ageText = c.age != null && c.age !== ''
    ? ((document.documentElement.lang || 'zh-Hant') === 'en' ? `${uiText('年齡')} ${c.age}` : `${c.age} ${uiText('歲')}`)
    : uiText('年齡未設定');
  headFacts.push(`<div class="info-card-head-fact">${iconSvg('cake2')}<span>${esc(birthdayText)} · ${esc(ageText)}</span></div>`);
  headFacts.push(`<div class="info-card-head-fact">${iconSvg('house')}<span>${esc(dResidence || uiText('居住地未設定'))}</span></div>`);
  $('infoCardHeadFacts').innerHTML = headFacts.join('');

  const familyNames = db.families.filter(f => (f.memberIds || []).includes(c.id)).map(f => displayDataText(f.name, f));
  const personNames = ids => (ids || []).map(pid => db.sims[pid]).filter(Boolean).map(sim => displayDataText(sim.name, sim));
  const parentNames = personNames(c.parentIds);
  const spouseNames = personNames(c.spouseIds);
  const exSpouseNames = personNames(c.exSpouseIds);
  const childNames = getChildrenOf(c.id).map(sim => displayDataText(sim.name, sim));
  const siblingIds = [...new Set((db.links || []).filter(l =>
    (l.from === c.id || l.to === c.id) && (l.label === SIBLING_LABEL || l.type === SIBLING_LABEL)
  ).map(l => l.from === c.id ? l.to : l.from))];
  const siblingNames = personNames(siblingIds);
  const otherRelations = (db.links || []).filter(l => {
    if (l.from !== c.id && l.to !== c.id) return false;
    return !(l.label === SIBLING_LABEL || l.type === SIBLING_LABEL);
  }).map(l => {
    const other = db.sims[l.from === c.id ? l.to : l.from];
    if (!other) return null;
    return `${displayRelationshipText(l.label || l.type || '關聯')}：${displayDataText(other.name, other)}`;
  }).filter(Boolean);

  const row = (label, value, muted = false) => `<div class="info-card-row"><div class="info-card-label">${esc(uiText(label))}</div><div class="info-card-value${muted ? ' muted' : ''}">${value}</div></div>`;
  const textOrDash = values => values.length ? values.map(esc).join(' / ') : '—';

  const sections = [];
  const basicRows = [];
  basicRows.push(row('職業', esc(dCareer || '—')));
  basicRows.push(row('人生抱負', esc(dAspiration || '—')));
  basicRows.push(row('所屬家族', familyNames.length ? familyNames.map(esc).join(' / ') : '—'));
  basicRows.push(row('領養關係', esc(uiText(c.adoptive ? '領養' : '親生'))));
  if ((c.status === '已故' || c.status === '幽靈') && c.causeOfDeath) basicRows.push(row('死因', esc(dCause)));
  const traits = (c.traits || []).length
    ? `<div class="info-card-traits">${c.traits.map(t => `<span class="tag">${esc(displayDataText(t, c))}</span>`).join('')}</div>`
    : `<div class="info-card-value muted">—</div>`;
  basicRows.push(`<div class="info-card-row"><div class="info-card-label">${esc(uiText('特徵'))}</div><div class="info-card-value">${traits}</div></div>`);
  sections.push(`<section class="info-profile-section"><h3 class="info-profile-section-title">${esc(uiText('基本資料'))}</h3><div class="info-profile-list">${basicRows.join('')}</div></section>`);

  const relRows = [
    row('父母 A', parentNames[0] ? esc(parentNames[0]) : '—'),
    row('父母 B', parentNames[1] ? esc(parentNames[1]) : '—'),
    row('配偶', textOrDash(spouseNames)),
    row('前任配偶', textOrDash(exSpouseNames)),
    row('子女', textOrDash(childNames)),
    row('兄弟姐妹', textOrDash(siblingNames))
  ];
  if (otherRelations.length) relRows.push(row('其他關係', otherRelations.map(esc).join(' / ')));
  sections.push(`<section class="info-profile-section"><h3 class="info-profile-section-title">${esc(uiText('家庭與關係'))}</h3><div class="info-profile-list">${relRows.join('')}</div></section>`);

  sections.push(`<section class="info-profile-section"><h3 class="info-profile-section-title">${esc(uiText('簡介'))}</h3><div class="info-card-bio">${c.bio ? esc(dBio) : '—'}</div></section>`);

  const petItems = (c.pets || []).map(p => {
    const pUrl = resolveImageUrl(p.avatar);
    const avatar = pUrl ? `<img src="${esc(pUrl)}" alt="">` : petIconFor(p);
    const meta = [petSpeciesLabel(p), p.breed ? displayDataText(p.breed, c) : ''].filter(Boolean).join(' · ');
    return `<div class="info-card-pet"><div class="info-card-pet-avatar">${avatar}</div><div class="info-card-pet-text"><div class="info-card-pet-name">${esc(displayDataText(p.name, c) || uiText('（未命名）'))}</div><div class="info-card-pet-meta">${esc(meta)}</div></div></div>`;
  }).join('') || `<div class="info-card-value muted">—</div>`;

  const galleryItems = (c.gallery || []).slice(0, 8).map((g, i) => {
    const url = resolveImageUrl(g.image);
    return `<div class="gallery-item" data-info-gallery-idx="${i}" title="${esc(g.title || '')}"><img src="${esc(url)}" alt=""></div>`;
  }).join('') || `<div class="info-card-value muted">—</div>`;

  sections.push(`<section class="info-profile-section"><div class="info-card-media"><div class="info-card-media-column"><div class="info-card-media-head"><span>${esc(uiText('寵物'))}</span><span class="info-card-media-count">${(c.pets || []).length}</span></div><div class="info-card-pets">${petItems}</div></div><div class="info-card-media-column"><div class="info-card-media-head"><span>${esc(uiText('相簿'))}</span><span class="info-card-media-count">${(c.gallery || []).length}</span></div><div class="info-card-gallery">${galleryItems}</div></div></div></section>`);

  const body = $('infoCardBody');
  body.innerHTML = sections.join('');
  body.querySelectorAll('[data-info-gallery-idx]').forEach(el => { el.onclick = () => openGalleryViewer(c.id, +el.dataset.infoGalleryIdx); });
  infoMask.classList.add('show');
}
function closeInfoCard() {
  infoMask.classList.remove('show');
  infoCardId = null;
}
$('infoCloseBtn').onclick = closeInfoCard;
infoMask.onclick = e => { if (e.target === infoMask) closeInfoCard(); };
$('infoEditBtn').onclick = () => {
  const id = infoCardId; closeInfoCard(); if (id) openEditor(id);
};

function renderGalleryGrid() {
  if (!galleryGrid) return;
  if (!editingGallery.length) {
    galleryGrid.innerHTML = '<div class="gallery-empty" style="grid-column:1/-1;">尚未新增相簿圖片</div>';
    return;
  }
  galleryGrid.innerHTML = editingGallery.map((g, i) => {
    const stageTag = g.lifeStage
      ? `<span class="gallery-item-stage stage-${g.lifeStage}">${esc(g.lifeStage)}</span>`
      : '';
    const title = g.title ? esc(g.title) : '';
    const url = resolveImageUrl(g.image);
    return `<div class="gallery-item" data-gallery-idx="${i}">
      <img src="${esc(url)}" alt="" draggable="false">
      ${stageTag}
      <div class="gallery-item-overlay">
        <button type="button" class="gallery-item-btn" data-gallery-edit="${i}" title="編輯">${iconSvg('pencil-square')}</button>
        <button type="button" class="gallery-item-btn danger" data-gallery-del="${i}" title="刪除">${iconSvg('trash3')}</button>
      </div>
      ${title ? `<div class="gallery-item-title">${title}</div>` : ''}
    </div>`;
  }).join('');

  galleryGrid.querySelectorAll('.gallery-item').forEach(el => {
    el.onclick = e => {
      if (e.target.closest('.gallery-item-btn')) return;
      openGalleryViewerPreview(+el.dataset.galleryIdx);
    };
  });
  galleryGrid.querySelectorAll('[data-gallery-edit]').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); openPhotoEditor(+btn.dataset.galleryEdit); };
  });
  galleryGrid.querySelectorAll('[data-gallery-del]').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const i = +btn.dataset.galleryDel;
      const g = editingGallery[i];
      if (!g) return;
      if (!await uiConfirm(`確定刪除圖片「${g.title || '未命名'}」嗎？`, { title: '刪除圖片', kind: 'danger', confirmText: '刪除' })) return;
      editingGallery.splice(i, 1);
      renderGalleryGrid();
    };
  });
}

$('btnAddPhoto').onclick = () => openPhotoEditor(-1);

galleryGrid.addEventListener('dragover', e => {
  e.preventDefault(); e.stopPropagation();
  galleryGrid.classList.add('dragover');
});
galleryGrid.addEventListener('dragleave', e => {
  e.preventDefault(); galleryGrid.classList.remove('dragover');
});
galleryGrid.addEventListener('drop', async e => {
  e.preventDefault(); e.stopPropagation();
  galleryGrid.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (!files || !files.length) return;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    await handleGalleryFile(file);
  }
});

async function handleGalleryFile(file) {
  try {
    const result = await compressGalleryImage(file);
    if (result.isOriginal && result.sizeKB > ORIGINAL_WARN_KB) {
      const mb = (result.sizeKB / 1024).toFixed(2);
      const ok = await uiConfirm(
        `原始圖片大小約 ${mb} MB。\n\n` +
        `IndexedDB 容量雖然較大，但大圖片仍會快速佔滿空間。\n\n` +
        `是否仍要儲存原始圖片？`,
        { title: '原始圖片容量提醒', confirmText: '仍要儲存' }
      );
      if (!ok) return;
    }
    const id = await saveImageToIdb(result.dataUrl);
    editingPhotoImageRef = id || result.dataUrl;
    editingPhotoSizeKB = result.sizeKB;
    editingPhotoOriginal = result.isOriginal;
    openPhotoEditor(-1, true);
  } catch(err) {
    uiAlert('圖片處理失敗：' + err.message, { title: '圖片處理失敗', kind: 'danger' });
  }
}

function updatePhotoPreview() {
  const el = $('photoPreview');
  const url = resolveImageUrl(editingPhotoImageRef);
  if (url) {
    el.classList.add('has-image');
    el.style.backgroundImage = `url("${url}")`;
    el.textContent = '';
  } else {
    el.classList.remove('has-image');
    el.style.backgroundImage = '';
    el.textContent = '點選選擇 · 或拖曳 · 或 Ctrl+V 貼上';
  }
  const tip = $('photoSizeTip');
  if (url) {
    const kb = editingPhotoSizeKB;
    const sizeText = kb >= 1024 ? `約 ${(kb/1024).toFixed(2)} MB` : `約 ${kb} KB`;
    const isLarge = kb > ORIGINAL_WARN_KB && editingPhotoOriginal;
    tip.textContent = `${editingPhotoOriginal ? '原始圖片' : '壓縮'} · ${sizeText}`;
    tip.classList.toggle('warn', isLarge);
  } else {
    tip.textContent = '';
    tip.classList.remove('warn');
  }
}

function openPhotoEditor(index, fromDrop = false) {
  editingPhotoIndex = (typeof index === 'number') ? index : -1;
  const p = editingPhotoIndex >= 0 ? editingGallery[editingPhotoIndex] : null;
  $('photoModalTitle').textContent = editingPhotoIndex >= 0 ? '編輯圖片' : '新增圖片';
  if (editingPhotoIndex >= 0 && !fromDrop) {
    editingPhotoImageRef = p.image || '';
    const url = resolveImageUrl(editingPhotoImageRef);
    editingPhotoSizeKB = Math.round((url||'').length * 0.75 / 1024);
    editingPhotoOriginal = false;
    $('phTitle').value = p.title || '';
    $('phNote').value = p.note || '';
    $('phStage').value = p.lifeStage || '';
  } else if (!fromDrop) {
    editingPhotoImageRef = '';
    editingPhotoSizeKB = 0;
    editingPhotoOriginal = false;
    $('phTitle').value = '';
    $('phNote').value = '';
    $('phStage').value = '';
  } else {
    $('phTitle').value = '';
    $('phNote').value = '';
    $('phStage').value = '';
  }
  $('phDelete').style.display = editingPhotoIndex >= 0 ? '' : 'none';
  updatePhotoPreview();
  photoMask.classList.add('show');
  setTimeout(() => $('phTitle').focus(), 60);
}

function closePhotoEditor() {
  photoMask.classList.remove('show');
  editingPhotoIndex = -1;
  editingPhotoImageRef = '';
  editingPhotoSizeKB = 0;
  editingPhotoOriginal = false;
}

function savePhoto() {
  if (!editingPhotoImageRef) { uiAlert('請先選擇一張圖片', { title: '尚未選擇圖片' }); return; }
  const data = {
    id: (editingPhotoIndex >= 0 && editingGallery[editingPhotoIndex])
      ? editingGallery[editingPhotoIndex].id
      : uid('gal'),
    title: $('phTitle').value.trim(),
    note: $('phNote').value.trim(),
    lifeStage: $('phStage').value,
    image: editingPhotoImageRef,
    addedAt: (editingPhotoIndex >= 0 && editingGallery[editingPhotoIndex])
      ? editingGallery[editingPhotoIndex].addedAt
      : Date.now()
  };
  if (editingPhotoIndex >= 0) editingGallery[editingPhotoIndex] = data;
  else editingGallery.push(data);
  renderGalleryGrid();
  closePhotoEditor();
}

async function deletePhotoFromEditor() {
  if (editingPhotoIndex < 0) return;
  const g = editingGallery[editingPhotoIndex];
  if (!g) return;
  if (!await uiConfirm(`確定刪除圖片「${g.title || '未命名'}」嗎？`, { title: '刪除圖片', kind: 'danger', confirmText: '刪除' })) return;
  editingGallery.splice(editingPhotoIndex, 1);
  renderGalleryGrid();
  closePhotoEditor();
}

$('phSave').onclick = savePhoto;
$('phCancel').onclick = closePhotoEditor;
$('phDelete').onclick = deletePhotoFromEditor;
photoMask.onclick = e => { if (e.target === photoMask) closePhotoEditor(); };

$('photoPreview').onclick = () => $('photoInput').click();
$('photoInput').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const result = await compressGalleryImage(file);
    if (result.isOriginal && result.sizeKB > ORIGINAL_WARN_KB) {
      const mb = (result.sizeKB / 1024).toFixed(2);
      const ok = await uiConfirm(`原始圖片大小約 ${mb} MB。\n\n是否仍要儲存原始圖片？`, { title: '原始圖片容量提醒', confirmText: '仍要儲存' });
      if (!ok) { e.target.value = ''; return; }
    }
    const id = await saveImageToIdb(result.dataUrl);
    editingPhotoImageRef = id || result.dataUrl;
    editingPhotoSizeKB = result.sizeKB;
    editingPhotoOriginal = result.isOriginal;
    updatePhotoPreview();
  } catch(err) {
    uiAlert('圖片處理失敗：' + err.message, { title: '圖片處理失敗', kind: 'danger' });
  }
  e.target.value = '';
};
$('photoClearBtn').onclick = () => {
  editingPhotoImageRef = '';
  editingPhotoSizeKB = 0;
  editingPhotoOriginal = false;
  updatePhotoPreview();
};

document.addEventListener('paste', async e => {
  if (!photoMask.classList.contains('show')) return;
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      try {
        const result = await compressGalleryImage(file);
        if (result.isOriginal && result.sizeKB > ORIGINAL_WARN_KB) {
          const mb = (result.sizeKB / 1024).toFixed(2);
          const ok = await uiConfirm(`原始圖片大小約 ${mb} MB。\n\n是否仍要儲存原始圖片？`, { title: '原始圖片容量提醒', confirmText: '仍要儲存' });
          if (!ok) return;
        }
        const id = await saveImageToIdb(result.dataUrl);
        editingPhotoImageRef = id || result.dataUrl;
        editingPhotoSizeKB = result.sizeKB;
        editingPhotoOriginal = result.isOriginal;
        updatePhotoPreview();
      } catch(err){ uiAlert('圖片處理失敗：' + err.message, { title: '圖片處理失敗', kind: 'danger' }); }
      return;
    }
  }
});

/* =========================================================
 *  圖片檢視器（三種模式）
 * ========================================================= */
function openGalleryViewerPreview(idx) {
  const gal = editingGallery;
  if (!gal || !gal[idx]) return;
  viewerMode = 'edit';
  viewerSimId = null;
  viewerIndex = idx;
  updateViewerContent(gal);
  galleryViewerMask.classList.add('show');
}

function openGalleryViewer(simId, idx) {
  const sim = db.sims[simId];
  if (!sim) return;
  viewerMode = 'sim';
  viewerSimId = simId;
  viewerIndex = idx;
  updateViewerContent(sim.gallery || []);
  galleryViewerMask.classList.add('show');
}

function openGalleryViewerGlobal(idx) {
  const list = viewerGlobalList;
  if (!list || !list[idx]) return;
  viewerMode = 'global';
  viewerSimId = null;
  viewerIndex = idx;
  updateViewerContent(list);
  galleryViewerMask.classList.add('show');
}

function getViewerGallery() {
  if (viewerMode === 'global') return viewerGlobalList;
  if (viewerMode === 'sim' && viewerSimId) {
    const sim = db.sims[viewerSimId];
    return sim ? (sim.gallery || []) : [];
  }
  return editingGallery;
}

function updateViewerContent(gal) {
  if (!gal || !gal.length) return;
  if (viewerIndex < 0) viewerIndex = 0;
  if (viewerIndex >= gal.length) viewerIndex = gal.length - 1;
  const g = gal[viewerIndex];
  $('gvImg').src = resolveImageUrl(g.image) || '';
  $('gvTitle').textContent = g.title || '（未命名）';
  let noteText = g.note || '';
  if (viewerMode === 'global' && g.simName) {
    noteText = (noteText ? noteText + ' · ' : '') + `來自：${g.simName}`;
  }
  $('gvNote').textContent = noteText;
  $('gvCounter').textContent = `${viewerIndex + 1} / ${gal.length}`;
  $('gvPrev').disabled = gal.length <= 1;
  $('gvNext').disabled = gal.length <= 1;
}

function viewerNav(delta) {
  const gal = getViewerGallery();
  if (!gal || gal.length <= 1) return;
  viewerIndex = (viewerIndex + delta + gal.length) % gal.length;
  updateViewerContent(gal);
}

$('gvClose').onclick = () => {
  galleryViewerMask.classList.remove('show');
  viewerSimId = null;
  viewerMode = 'edit';
  viewerGlobalList = [];
};
$('gvPrev').onclick = () => viewerNav(-1);
$('gvNext').onclick = () => viewerNav(1);
galleryViewerMask.onclick = e => {
  if (e.target === galleryViewerMask) {
    galleryViewerMask.classList.remove('show');
    viewerSimId = null;
    viewerMode = 'edit';
    viewerGlobalList = [];
  }
};

/* =========================================================
 *  相簿瀏覽器
 * ========================================================= */
function buildGlobalGalleryList() {
  const list = [];
  Object.values(db.sims).forEach(sim => {
    (sim.gallery || []).forEach(g => {
      if (!g.image) return;
      list.push({
        sim,
        simId: sim.id,
        simName: displayDataText(sim.name, sim) || uiText('（未命名）'),
        id: g.id,
        title: g.title,
        note: g.note,
        lifeStage: g.lifeStage,
        image: g.image,
        addedAt: g.addedAt || 0
      });
    });
  });
  // 按 addedAt 降序（最新在前）
  list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  return list;
}

function renderGalleryBrowserFilter() {
  const sel = $('galleryBrowserFilter');
  const prev = sel.value;
  // 收集有相簿圖片的模擬市民
  const withGallery = Object.values(db.sims).filter(s => (s.gallery || []).length > 0);
  withGallery.sort((a,b) => String(a.name).localeCompare(String(b.name), 'zh'));
  sel.innerHTML = '<option value="">全部模擬市民</option>' +
    withGallery.map(s => {
      const n = (s.gallery || []).length;
      return `<option value="${esc(s.id)}">${esc(displayDataText(s.name, s) || uiText('（未命名）'))} · ${n} ${esc(uiText('張圖片'))}</option>`;
    }).join('');
  if (prev && withGallery.some(s => s.id === prev)) sel.value = prev;
}

function renderGalleryBrowser() {
  const searchEl = $('galleryBrowserSearch');
  const filterEl = $('galleryBrowserFilter');
  const listEl = $('galleryBrowserList');
  const countEl = $('galleryBrowserCount');
  if (!listEl) return;

  const allList = buildGlobalGalleryList();
  const total = allList.length;
  const q = (searchEl.value || '').trim().toLowerCase();
  const filterSimId = filterEl.value;

  let filtered = allList;
  if (filterSimId) filtered = filtered.filter(item => item.simId === filterSimId);
  if (q) {
    filtered = filtered.filter(item =>
      (item.title || '').toLowerCase().includes(q)
      || (item.simName || '').toLowerCase().includes(q)
      || (item.note || '').toLowerCase().includes(q)
      || (item.lifeStage || '').toLowerCase().includes(q)
    );
  }

  countEl.textContent = uiText(`（${filtered.length} / ${total} 張）`);

  if (!total) {
    listEl.innerHTML = '<div class="gb-empty">還沒有任何相簿圖片。<br><br>開啟某個模擬市民的編輯彈出視窗 →「相簿」新增圖片後，會在這裡顯示。</div>';
    return;
  }
  if (!filtered.length) {
    listEl.innerHTML = '<div class="gb-empty">沒有符合的圖片</div>';
    return;
  }

  listEl.innerHTML = filtered.map((item, i) => {
    const url = resolveImageUrl(item.image);
    const stageTag = item.lifeStage
      ? `<span class="gb-stage stage-${item.lifeStage}">${esc(uiText(item.lifeStage))}</span>`
      : '';
    return `<div class="gb-item" data-global-idx="${i}">
      <img src="${esc(url)}" alt="" loading="lazy" draggable="false">
      ${stageTag}
      <div class="gb-overlay">
        <div class="gb-sim" title="${esc(item.simName)}">${iconSvg('person')} ${esc(item.simName)}</div>
        <div class="gb-title" title="${esc(item.title || '（未命名）')}">${esc(item.title || '（未命名）')}</div>
      </div>
    </div>`;
  }).join('');

  // 更新 viewerGlobalList 為目前的 filtered
  viewerGlobalList = filtered;

  listEl.querySelectorAll('.gb-item').forEach(el => {
    el.onclick = () => openGalleryViewerGlobal(+el.dataset.globalIdx);
  });
}

function openGalleryBrowser() {
  renderGalleryBrowserFilter();
  $('galleryBrowserSearch').value = '';
  renderGalleryBrowser();
  galleryBrowserMask.classList.add('show');
  closeSidebar();
}

$('galleryBrowserBtn').onclick = openGalleryBrowser;
$('galleryBrowserCloseBtn').onclick = () => galleryBrowserMask.classList.remove('show');
galleryBrowserMask.onclick = e => { if (e.target === galleryBrowserMask) galleryBrowserMask.classList.remove('show'); };

$('galleryBrowserSearch').oninput = debounce(() => renderGalleryBrowser(), 150);
$('galleryBrowserFilter').onchange = () => renderGalleryBrowser();
$('galleryBrowserClearFilter').onclick = () => {
  $('galleryBrowserSearch').value = '';
  $('galleryBrowserFilter').value = '';
  renderGalleryBrowser();
};

/* =========================================================
 *  自由排列選取 / 框選 + 平移 / 縮放
 * ========================================================= */
function syncNodeSelectionClasses() {
  const visible = new Set();
  nodes.querySelectorAll('.node[data-id]').forEach(el => {
    visible.add(el.dataset.id);
    el.classList.toggle('node-selected', selectedNodeIds.has(el.dataset.id));
  });
  [...selectedNodeIds].forEach(id => { if (!visible.has(id)) selectedNodeIds.delete(id); });
}

function clearNodeSelection() {
  if (!selectedNodeIds.size) return;
  selectedNodeIds.clear();
  syncNodeSelectionClasses();
}

function selectVisibleNodes() {
  if (!layoutCache || !getCurrentFreeLayout(currentFamily()) || arrangeTool !== 'select') return;
  selectedNodeIds.clear();
  layoutCache.visibleIds.forEach(id => selectedNodeIds.add(id));
  syncNodeSelectionClasses();
}

function closeNodeContextMenu() {
  if (!nodeContextMenu) return;
  nodeContextMenu.classList.remove('show');
  nodeContextMenu.setAttribute('aria-hidden', 'true');
  nodeContextMenu.innerHTML = '';
}

function positionNodeContextMenu(clientX, clientY) {
  if (!nodeContextMenu) return;
  nodeContextMenu.style.left = `${clientX}px`;
  nodeContextMenu.style.top = `${clientY}px`;
  requestAnimationFrame(() => {
    const rect = nodeContextMenu.getBoundingClientRect();
    const pad = 8;
    const left = Math.max(pad, Math.min(clientX, window.innerWidth - rect.width - pad));
    const top = Math.max(pad, Math.min(clientY, window.innerHeight - rect.height - pad));
    nodeContextMenu.style.left = `${left}px`;
    nodeContextMenu.style.top = `${top}px`;
  });
}

function renderNodeContextMenu(simId, clientX, clientY) {
  if (!nodeContextMenu || !db?.sims?.[simId]) return;
  const sim = db.sims[simId];
  const settings = viewMode === 'edit' ? getCardEditSettings() : getCardViewSettings();
  const isEditCard = viewMode === 'edit';
  const isMulti = selectedNodeIds.size > 1 && selectedNodeIds.has(simId);
  const selectedCount = isMulti ? selectedNodeIds.size : 1;
  const title = isMulti ? `${uiText('已選取')} ${selectedCount} ${uiText('人')}` : displayDataText(sim.name, sim);

  const fieldRows = [
    ['name','姓名'], ['gender','性別'], ['lifeStage','人生階段'], ['age','年齡'], ['birthday','生日'],
    ['status','狀態'], ['race','種族'], ['career','職業'], ['residence','居住地'], ['aspiration','人生抱負'],
    ['traits','特徵'], ['pets','寵物'], ['gallery','相簿']
  ].map(([key,label]) => `<label class="node-context-check"><input type="checkbox" data-card-field="${key}" ${settings[key] ? 'checked' : ''}><span>${esc(uiText(label))}</span></label>`).join('');

  const appearanceSection = isEditCard ? '' : `
    <div class="node-context-divider"></div>
    <div class="node-context-section-title">${esc(uiText('檢視卡片外觀'))}</div>
    <label class="node-context-radio"><input type="radio" name="nodeCardAppearance" value="minimal" ${settings.appearance === 'minimal' ? 'checked' : ''}><span>${esc(uiText('極簡'))}</span></label>
    <label class="node-context-radio"><input type="radio" name="nodeCardAppearance" value="translucent" ${settings.appearance === 'translucent' ? 'checked' : ''}><span>${esc(uiText('半透明'))}</span></label>
    <label class="node-context-radio"><input type="radio" name="nodeCardAppearance" value="full" ${settings.appearance === 'full' ? 'checked' : ''}><span>${esc(uiText('完整卡片'))}</span></label>`;

  nodeContextMenu.innerHTML = `
    <div class="node-context-title">${esc(title)}</div>
    <button class="node-context-action" type="button" data-node-context-action="view">${iconSvg('person-vcard')}<span>${esc(uiText('查看個人檔案'))}</span></button>
    <button class="node-context-action" type="button" data-node-context-action="edit">${iconSvg('pencil-square')}<span>${esc(uiText('編輯模擬市民'))}</span></button>
    <button class="node-context-action" type="button" data-node-context-action="locate">${iconSvg('crosshair')}<span>${esc(uiText('在族譜中定位'))}</span></button>
    ${isMulti ? `
      <div class="node-context-divider"></div>
      <button class="node-context-action" type="button" data-node-context-action="reset-selected">${iconSvg('arrow-counterclockwise')}<span>${esc(uiText('重設所選位置'))}</span></button>
      <button class="node-context-action danger" type="button" data-node-context-action="remove-selected">${iconSvg('person-dash')}<span>${esc(uiText('移出所選人物'))}</span></button>
      <button class="node-context-action" type="button" data-node-context-action="clear-selection">${iconSvg('x-lg')}<span>${esc(uiText('取消選取'))}</span></button>
    ` : ''}
    <div class="node-context-divider"></div>
    <div class="node-context-section-title">${esc(uiText(isEditCard ? '編輯模式顯示內容' : '檢視模式顯示內容'))}</div>
    <label class="node-context-check fixed"><input type="checkbox" checked disabled><span>${esc(uiText('頭像'))}</span></label>
    <div class="node-context-grid">${fieldRows}</div>
    ${appearanceSection}
    <div class="node-context-note">${esc(uiText(isEditCard ? '只套用於編輯模式人物卡' : '只套用於檢視模式人物卡'))}</div>`;

  nodeContextMenu.dataset.simId = simId;
  nodeContextMenu.dataset.cardMode = viewMode;
  nodeContextMenu.classList.add('show');
  nodeContextMenu.setAttribute('aria-hidden', 'false');
  positionNodeContextMenu(clientX, clientY);
}

async function handleNodeContextAction(action, simId) {
  if (!action) return;
  if (action === 'view') { closeNodeContextMenu(); openInfoCard(simId); return; }
  if (action === 'edit') { closeNodeContextMenu(); openEditor(simId); return; }
  if (action === 'locate') { closeNodeContextMenu(); focusSimOnCanvas(simId); return; }
  if (action === 'clear-selection') { closeNodeContextMenu(); clearNodeSelection(); return; }
  if (action === 'reset-selected') {
    const fam = currentFamily();
    ensureFamilyLayoutShape(fam);
    [...selectedNodeIds].forEach(id => { delete fam.manualPos[viewMode][id]; });
    save(); render(); closeNodeContextMenu();
    return;
  }
  if (action === 'remove-selected') {
    const fam = currentFamily();
    const ids = [...selectedNodeIds].filter(id => fam.memberIds.includes(id));
    if (!ids.length) { closeNodeContextMenu(); return; }
    const ok = await uiConfirm(`${uiText('確定要將所選人物移出目前家族嗎？')}\n${uiText('人物本身仍會保留在人物資料中。')}`, {
      title: uiText('移出所選人物'), kind: 'danger', confirmText: uiText('移出家族')
    });
    if (!ok) return;
    fam.memberIds = fam.memberIds.filter(id => !ids.includes(id));
    clearNodeSelection();
    save(); refreshFamilyUI(); render(); closeNodeContextMenu();
  }
}

nodeContextMenu?.addEventListener('click', e => {
  const actionBtn = e.target.closest('[data-node-context-action]');
  if (actionBtn) {
    e.preventDefault(); e.stopPropagation();
    handleNodeContextAction(actionBtn.dataset.nodeContextAction, nodeContextMenu.dataset.simId);
  }
});
nodeContextMenu?.addEventListener('change', e => {
  const field = e.target?.dataset?.cardField;
  if (field && CARD_CONTENT_FIELD_KEYS.includes(field)) {
    const settings = nodeContextMenu.dataset.cardMode === 'edit' ? getCardEditSettings() : getCardViewSettings();
    settings[field] = !!e.target.checked;
    save(); render();
    positionNodeContextMenu(parseFloat(nodeContextMenu.style.left) || 0, parseFloat(nodeContextMenu.style.top) || 0);
    return;
  }
  if (e.target?.name === 'nodeCardAppearance') {
    const value = e.target.value;
    if (['minimal','translucent','full'].includes(value)) {
      getCardViewSettings().appearance = value;
      save(); render();
      positionNodeContextMenu(parseFloat(nodeContextMenu.style.left) || 0, parseFloat(nodeContextMenu.style.top) || 0);
    }
  }
});

nodes.addEventListener('contextmenu', e => {
  const el = e.target.closest('.node[data-id]');
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  const id = el.dataset.id;
  if (getCurrentFreeLayout(currentFamily()) && arrangeTool === 'select' && !selectedNodeIds.has(id)) {
    selectedNodeIds.clear();
    selectedNodeIds.add(id);
    syncNodeSelectionClasses();
  }
  renderNodeContextMenu(id, e.clientX, e.clientY);
});

document.addEventListener('pointerdown', e => {
  if (nodeContextMenu?.classList.contains('show') && !e.target.closest('#nodeContextMenu')) closeNodeContextMenu();
}, true);
window.addEventListener('resize', closeNodeContextMenu);
window.addEventListener('blur', closeNodeContextMenu);

function updateArrangeToolUI() {
  const fam = db ? currentFamily() : null;
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
  arrangeTool = tool;
  updateArrangeToolUI();
}

selectToolBtn?.addEventListener('click', () => setArrangeTool('select'));
panToolBtn?.addEventListener('click', () => setArrangeTool('pan'));

function isTextInteractionTarget(target) {
  return !!target?.closest?.('input, textarea, select, [contenteditable="true"]');
}

function isPanGestureActive() {
  const fam = db ? currentFamily() : null;
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
  nodes.querySelectorAll('.node[data-id]').forEach(el => {
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
  const onNode = !!e.target.closest('.node');
  const onLabel = !!e.target.closest('.edge-label');
  const fam = currentFamily();
  const isFree = getCurrentFreeLayout(fam);

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
  panX = panStartPanX + (e.clientX - panStartX);
  panY = panStartPanY + (e.clientY - panStartY);
  applyTransform();
});
window.addEventListener('mouseup', () => {
  finishMarquee();
  if (panning) { panning = false; viewport.classList.remove('dragging'); }
});
viewport.addEventListener('dblclick', e => {
  if (e.target.closest('.node')) return;
  if (e.target.closest('.edge-label')) return;
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
  const cur = (db.labelPos || {})[key] || { dx:0, dy:0 };
  labelDrag = {
    key, el: g, baseX, baseY,
    startX: e.clientX, startY: e.clientY,
    startDx: cur.dx || 0, startDy: cur.dy || 0,
    beforeOffset: captureLabelHistoryState(key),
    moved: false, pointerId: e.pointerId
  };
  try { g.setPointerCapture(e.pointerId); } catch(_){}
});
labelsSvg.addEventListener('pointermove', e => {
  if (!labelDrag || labelDrag.pointerId !== e.pointerId) return;
  const rawDx = (e.clientX - labelDrag.startX) / scale;
  const rawDy = (e.clientY - labelDrag.startY) / scale;
  if (!labelDrag.moved && Math.hypot(rawDx * scale, rawDy * scale) > 3) {
    labelDrag.moved = true;
    labelDrag.el.classList.add('dragging');
  }
  if (!labelDrag.moved) return;
  const snapDistance = GUIDE_SNAP_PX / Math.max(scale, 0.001);
  let dx = labelDrag.startDx + rawDx;
  let dy = labelDrag.startDy + rawDy;

  // X 軸接近 0 時吸附回關係線的水平中心；Y 軸接近 0 時吸附回原始關係線。
  // 兩個方向彼此獨立，所以玩家仍可只沿著關係線水平移動，或只保持置中上下移動。
  if (Math.abs(dx) <= snapDistance) dx = 0;
  if (Math.abs(dy) <= snapDistance) dy = 0;

  if (!db.labelPos) db.labelPos = {};
  if (dx === 0 && dy === 0) delete db.labelPos[labelDrag.key];
  else db.labelPos[labelDrag.key] = { dx, dy };

  labelDrag.currentDx = dx;
  labelDrag.currentDy = dy;
  const tx = labelDrag.baseX + dx;
  const ty = labelDrag.baseY + dy;
  labelDrag.el.setAttribute('transform', `translate(${tx.toFixed(1)},${ty.toFixed(1)})`);
});
const finishLabelDrag = e => {
  if (!labelDrag) return;
  if (e && labelDrag.pointerId !== e.pointerId) return;
  labelDrag.el.classList.remove('dragging');
  if (labelDrag.moved) {
    const afterOffset = captureLabelHistoryState(labelDrag.key);
    dragHistory.push({
      type: 'relationship-label',
      key: labelDrag.key,
      before: { offset: labelDrag.beforeOffset },
      after: { offset: afterOffset }
    });
    save();
  }
  labelDrag = null;
};
labelsSvg.addEventListener('pointerup', finishLabelDrag);
labelsSvg.addEventListener('pointercancel', finishLabelDrag);

// ========【智慧對齊與等距吸附】 設定 - 對齊邊緣 / 中心，同時支援水平與垂直等距 ========
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

function getAlignmentSnap(id, rawX, rawY) {
  const { W: NODE_W, H: NODE_H } = getDims();
  const threshold = GUIDE_SNAP_PX / Math.max(scale, 0.001);
  const draggedX = [rawX, rawX + NODE_W / 2, rawX + NODE_W];
  const draggedY = [rawY, rawY + NODE_H / 2, rawY + NODE_H];
  let bestX = null;
  let bestY = null;

  layoutCache.pos.forEach((p, otherId) => {
    if (otherId === id) return;
    const targetX = [p.x, p.x + NODE_W / 2, p.x + NODE_W];
    const targetY = [p.y, p.y + NODE_H / 2, p.y + NODE_H];

    for (let i = 0; i < draggedX.length; i += 1) {
      const delta = targetX[i] - draggedX[i];
      const distance = Math.abs(delta);
      if (distance <= threshold && (!bestX || distance < bestX.distance)) {
        bestX = { value: rawX + delta, distance, guide: targetX[i] };
      }
    }

    for (let i = 0; i < draggedY.length; i += 1) {
      const delta = targetY[i] - draggedY[i];
      const distance = Math.abs(delta);
      if (distance <= threshold && (!bestY || distance < bestY.distance)) {
        bestY = { value: rawY + delta, distance, guide: targetY[i] };
      }
    }
  });

  return { x: bestX, y: bestY };
}

function pickCloserSnap(alignmentCandidate, spacingCandidate) {
  if (!alignmentCandidate) return spacingCandidate;
  if (!spacingCandidate) return alignmentCandidate;
  return spacingCandidate.distance < alignmentCandidate.distance
    ? spacingCandidate
    : alignmentCandidate;
}

function buildHorizontalSpacingGuide(firstStart, firstEnd, secondStart, secondEnd, centerY, gap) {
  return {
    axis: 'x',
    gap,
    cross: centerY,
    segments: [
      { start: firstStart, end: firstEnd },
      { start: secondStart, end: secondEnd }
    ]
  };
}

function buildVerticalSpacingGuide(firstStart, firstEnd, secondStart, secondEnd, centerX, gap) {
  return {
    axis: 'y',
    gap,
    cross: centerX,
    segments: [
      { start: firstStart, end: firstEnd },
      { start: secondStart, end: secondEnd }
    ]
  };
}

function getHorizontalEqualSpacingSnap(id, rawX, rawY) {
  const { W: NODE_W, H: NODE_H } = getDims();
  const threshold = GUIDE_SNAP_PX / Math.max(scale, 0.001);
  const rowTolerance = (GUIDE_SNAP_PX * 1.5) / Math.max(scale, 0.001);
  const draggedCenterY = rawY + NODE_H / 2;
  const rowNodes = [];

  layoutCache.pos.forEach((p, otherId) => {
    if (otherId === id) return;
    const centerY = p.y + NODE_H / 2;
    if (Math.abs(centerY - draggedCenterY) <= rowTolerance) {
      rowNodes.push({ id: otherId, x: p.x, y: p.y, centerY });
    }
  });

  rowNodes.sort((a, b) => a.x - b.x);
  let best = null;

  function consider(value, gap, guide) {
    const distance = Math.abs(value - rawX);
    if (distance > threshold) return;
    if (!best || distance < best.distance) {
      best = { value, distance, spacingGuide: guide };
    }
  }

  for (let i = 0; i < rowNodes.length - 1; i += 1) {
    const left = rowNodes[i];
    const right = rowNodes[i + 1];
    if (Math.abs(left.centerY - right.centerY) > rowTolerance) continue;

    const existingGap = right.x - (left.x + NODE_W);
    const rowCenterY = (left.centerY + right.centerY + draggedCenterY) / 3;

    // 在既有兩張卡片的左側或右側延續相同間距。
    if (existingGap >= 0) {
      const rightTarget = right.x + NODE_W + existingGap;
      consider(
        rightTarget,
        existingGap,
        buildHorizontalSpacingGuide(
          left.x + NODE_W,
          right.x,
          right.x + NODE_W,
          rightTarget,
          rowCenterY,
          existingGap
        )
      );

      const leftTarget = left.x - NODE_W - existingGap;
      consider(
        leftTarget,
        existingGap,
        buildHorizontalSpacingGuide(
          leftTarget + NODE_W,
          left.x,
          left.x + NODE_W,
          right.x,
          rowCenterY,
          existingGap
        )
      );
    }

    // 拖到兩張卡片之間時，平均分配左右兩段剩餘空間。
    const available = right.x - (left.x + NODE_W);
    if (available >= NODE_W) {
      const middleGap = (available - NODE_W) / 2;
      const middleTarget = left.x + NODE_W + middleGap;
      consider(
        middleTarget,
        middleGap,
        buildHorizontalSpacingGuide(
          left.x + NODE_W,
          middleTarget,
          middleTarget + NODE_W,
          right.x,
          rowCenterY,
          middleGap
        )
      );
    }
  }

  return best;
}

function getVerticalEqualSpacingSnap(id, rawX, rawY) {
  const { W: NODE_W, H: NODE_H } = getDims();
  const threshold = GUIDE_SNAP_PX / Math.max(scale, 0.001);
  const columnTolerance = (GUIDE_SNAP_PX * 1.5) / Math.max(scale, 0.001);
  const draggedCenterX = rawX + NODE_W / 2;
  const columnNodes = [];

  layoutCache.pos.forEach((p, otherId) => {
    if (otherId === id) return;
    const centerX = p.x + NODE_W / 2;
    if (Math.abs(centerX - draggedCenterX) <= columnTolerance) {
      columnNodes.push({ id: otherId, x: p.x, y: p.y, centerX });
    }
  });

  columnNodes.sort((a, b) => a.y - b.y);
  let best = null;

  function consider(value, gap, guide) {
    const distance = Math.abs(value - rawY);
    if (distance > threshold) return;
    if (!best || distance < best.distance) {
      best = { value, distance, spacingGuide: guide };
    }
  }

  for (let i = 0; i < columnNodes.length - 1; i += 1) {
    const top = columnNodes[i];
    const bottom = columnNodes[i + 1];
    if (Math.abs(top.centerX - bottom.centerX) > columnTolerance) continue;

    const existingGap = bottom.y - (top.y + NODE_H);
    const columnCenterX = (top.centerX + bottom.centerX + draggedCenterX) / 3;

    // 在既有兩張卡片的上方或下方延續相同間距。
    if (existingGap >= 0) {
      const bottomTarget = bottom.y + NODE_H + existingGap;
      consider(
        bottomTarget,
        existingGap,
        buildVerticalSpacingGuide(
          top.y + NODE_H,
          bottom.y,
          bottom.y + NODE_H,
          bottomTarget,
          columnCenterX,
          existingGap
        )
      );

      const topTarget = top.y - NODE_H - existingGap;
      consider(
        topTarget,
        existingGap,
        buildVerticalSpacingGuide(
          topTarget + NODE_H,
          top.y,
          top.y + NODE_H,
          bottom.y,
          columnCenterX,
          existingGap
        )
      );
    }

    // 拖到兩張卡片之間時，平均分配上下兩段剩餘空間。
    const available = bottom.y - (top.y + NODE_H);
    if (available >= NODE_H) {
      const middleGap = (available - NODE_H) / 2;
      const middleTarget = top.y + NODE_H + middleGap;
      consider(
        middleTarget,
        middleGap,
        buildVerticalSpacingGuide(
          top.y + NODE_H,
          middleTarget,
          middleTarget + NODE_H,
          bottom.y,
          columnCenterX,
          middleGap
        )
      );
    }
  }

  return best;
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

function getSmartSnap(id, rawX, rawY) {
  const alignment = getAlignmentSnap(id, rawX, rawY);
  const horizontalSpacing = getHorizontalEqualSpacingSnap(id, rawX, rawY);
  const verticalSpacing = getVerticalEqualSpacingSnap(id, rawX, rawY);
  const bestX = pickCloserSnap(alignment.x, horizontalSpacing);
  const bestY = pickCloserSnap(alignment.y, verticalSpacing);

  return {
    x: bestX ? bestX.value : rawX,
    y: bestY ? bestY.value : rawY,
    guideX: bestX && bestX.guide !== undefined ? bestX.guide : null,
    guideY: bestY && bestY.guide !== undefined ? bestY.guide : null,
    spacingX: bestX && bestX.spacingGuide ? bestX.spacingGuide : null,
    spacingY: bestY && bestY.spacingGuide ? bestY.spacingGuide : null
  };
}

nodes.addEventListener('pointerdown', e => {
  // 只讓主滑鼠鍵進入人物卡的點擊／拖曳流程。
  // 右鍵必須完整保留給 contextmenu，避免自由排列模式的 preventDefault() 吃掉右鍵選單。
  if (e.button !== 0) return;
  const el = e.target.closest('.node');
  if (!el) return;
  const id = el.dataset.id;
  const fam = currentFamily();
  ensureFamilyLayoutShape(fam);
  const isFree = getCurrentFreeLayout(fam);

  // Space 是選取工具中的暫時平移：不攔截，交給 viewport 的平移手勢。
  if (isFree && spacePanHeld) return;

  // 拖曳工具：拖曳卡片位置也用來平移畫布；單純點一下仍可開啟人物資料。
  if (isFree && arrangeTool === 'pan') {
    const sx = e.clientX, sy = e.clientY;
    const onUp = ev => {
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) {
        if (viewMode === 'view') openInfoCard(id); else openEditor(id);
      }
    };
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

    const dragIds = [...selectedNodeIds].filter(sid => layoutCache?.pos?.has(sid));
    const startPositions = new Map();
    dragIds.forEach(sid => {
      const p = fam.manualPos[viewMode][sid] || layoutCache.pos.get(sid);
      if (p) startPositions.set(sid, { x: p.x, y: p.y });
    });
    const primaryStart = startPositions.get(id);
    const sx = e.clientX, sy = e.clientY;
    const beforeLayoutState = captureLayoutHistoryState(fam, viewMode);
    let moved = false;

    const onMove = ev => {
      if (fam.locked || !primaryStart) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 3) {
        moved = true;
        dragIds.forEach(sid => nodes.querySelector(`.node[data-id="${CSS.escape(sid)}"]`)?.classList.add('dragging'));
      }
      if (!moved) return;

      const rawPrimaryX = primaryStart.x + dx / scale;
      const rawPrimaryY = primaryStart.y + dy / scale;
      // 多選整組移動時保留彼此相對位置；單選時仍使用智慧吸附。
      const snapped = dragIds.length === 1
        ? getSmartSnap(id, rawPrimaryX, rawPrimaryY)
        : { x: rawPrimaryX, y: rawPrimaryY, guideX:null, guideY:null, spacingX:null, spacingY:null };
      const deltaX = snapped.x - primaryStart.x;
      const deltaY = snapped.y - primaryStart.y;
      const manualPos = fam.manualPos[viewMode];

      startPositions.forEach((startPos, sid) => {
        const nx = startPos.x + deltaX;
        const ny = startPos.y + deltaY;
        manualPos[sid] = { x:nx, y:ny };
        layoutCache.pos.set(sid, { x:nx, y:ny });
        const nodeEl = nodes.querySelector(`.node[data-id="${CSS.escape(sid)}"]`);
        if (nodeEl) {
          nodeEl.style.left = `${nx + PAD}px`;
          nodeEl.style.top = `${ny + PAD}px`;
        }
      });

      hideSmartGuides();
      if (snapped.guideX !== null) showSmartGuide('x', snapped.guideX);
      if (snapped.guideY !== null) showSmartGuide('y', snapped.guideY);
      if (snapped.spacingX) showEqualSpacingGuide(snapped.spacingX);
      if (snapped.spacingY) showEqualSpacingGuide(snapped.spacingY);
      scheduleEdgeRedraw();
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      dragIds.forEach(sid => nodes.querySelector(`.node[data-id="${CSS.escape(sid)}"]`)?.classList.remove('dragging'));
      hideSmartGuides();

      if (moved) {
        dragHistory.push({
          type:'card-layout',
          familyId:fam.id,
          mode:viewMode,
          before:beforeLayoutState,
          after:captureLayoutHistoryState(fam, viewMode)
        });
        save();
        expandStageToFit();
      } else if (shift && wasSelected) {
        selectedNodeIds.delete(id);
        syncNodeSelectionClasses();
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return;
  }

  // 自動佈局沿用既有邏輯：拖動人物超過門檻後切換到自由排列。
  e.preventDefault(); e.stopPropagation();
  if (fam.locked) {
    const sx = e.clientX, sy = e.clientY;
    const onUp = ev => {
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (Math.hypot(ev.clientX-sx, ev.clientY-sy) < 5) {
        if (viewMode === 'view') openInfoCard(id); else openEditor(id);
      }
    };
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return;
  }
  const dragMode = viewMode;
  const beforeLayoutState = captureLayoutHistoryState(fam, dragMode);
  const manualPos = fam.manualPos[dragMode];
  const sim = db.sims[id];
  if (!sim) return;
  const initialPos = manualPos[id] || layoutCache.pos.get(id);
  if (!initialPos) return;
  const startPos = { x: initialPos.x, y: initialPos.y };
  const sx = e.clientX, sy = e.clientY;
  let moved = false;
  let dragInitialized = false;
  const onMove = ev => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (!moved && Math.hypot(dx, dy) > 3) {
      moved = true;
      el.classList.add('dragging');
    }
    if (!moved) return;

    if (!dragInitialized) {
      if (!fam.freeLayout[dragMode]) {
        fam.freeLayout[dragMode] = true;
        layoutCache.pos.forEach((p, sid) => { manualPos[sid] = { x:p.x, y:p.y }; });
        arrangeTool = 'pan';
        updateLayoutToggle();
      }
      if (!manualPos[id]) manualPos[id] = { ...startPos };
      dragInitialized = true;
    }
    const rawX = startPos.x + dx / scale;
    const rawY = startPos.y + dy / scale;
    const snapped = getSmartSnap(id, rawX, rawY);
    const nx = snapped.x;
    const ny = snapped.y;

    manualPos[id] = {x:nx, y:ny};
    layoutCache.pos.set(id, {x:nx, y:ny});
    el.style.left = (nx+PAD)+'px';
    el.style.top = (ny+PAD)+'px';

    hideSmartGuides();
    if (snapped.guideX !== null) showSmartGuide('x', snapped.guideX);
    if (snapped.guideY !== null) showSmartGuide('y', snapped.guideY);
    if (snapped.spacingX) showEqualSpacingGuide(snapped.spacingX);
    if (snapped.spacingY) showEqualSpacingGuide(snapped.spacingY);
    scheduleEdgeRedraw();
  };
  const onUp = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    el.classList.remove('dragging');
    hideSmartGuides();
    if (moved) {
      const afterLayoutState = captureLayoutHistoryState(fam, dragMode);
      dragHistory.push({
        type: 'card-layout',
        familyId: fam.id,
        mode: dragMode,
        before: beforeLayoutState,
        after: afterLayoutState
      });
      selectedNodeIds.clear();
      selectedNodeIds.add(id);
      syncNodeSelectionClasses();
      save();
      expandStageToFit();
    } else {
      if (viewMode === 'view') openInfoCard(id);
      else openEditor(id);
    }
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
});

function expandStageToFit() {
  const { W: NODE_W, H: NODE_H } = getDims();
  const fam = currentFamily();
  if (!getCurrentFreeLayout(fam)) return;
  let maxX=0, maxY=0;
  layoutCache.pos.forEach(p => {
    maxX = Math.max(maxX, p.x + NODE_W);
    maxY = Math.max(maxY, p.y + NODE_H);
  });
  const sW = Math.max(maxX + PAD*2, 400);
  const sH = Math.max(maxY + PAD*2, 300);
  stage.style.width = sW + 'px';
  stage.style.height = sH + 'px';
  svg.setAttribute('width', sW);
  svg.setAttribute('height', sH);
  svg.setAttribute('viewBox', `0 0 ${sW} ${sH}`);
  labelsSvg.setAttribute('width', sW);
  labelsSvg.setAttribute('height', sH);
  labelsSvg.setAttribute('viewBox', `0 0 ${sW} ${sH}`);

  // 尺寸更新後再補一次連線重繪，避免快速拖曳後 SVG 還停留在舊幀。
  scheduleEdgeRedraw();
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
    setIconText(btn, 'diagram-3', '自動佈局');
    btn.classList.remove('active');
    $('resetLayoutBtn').style.display = 'none';
    lockBtn.style.display = 'none';
  }
  updateArrangeToolUI();
}
$('layoutToggle').onclick = () => {
  const fam = currentFamily();
  ensureFamilyLayoutShape(fam);
  const manualPos = fam.manualPos[viewMode];
  if (!fam.freeLayout[viewMode]) {
    fam.freeLayout[viewMode] = true;
    arrangeTool = 'pan';
    layoutCache.pos.forEach((p, sid) => { manualPos[sid] = {x:p.x, y:p.y}; });
  } else {
    fam.freeLayout[viewMode] = false;
    fam.manualPos[viewMode] = {};
    clearNodeSelection();
  }
  save(); updateLayoutToggle(); render();
};
$('lockToggle').onclick = () => {
  const fam = currentFamily();
  if (!getCurrentFreeLayout(fam)) return;
  fam.locked = !fam.locked;
  save(); updateLayoutToggle();
};
$('resetLayoutBtn').onclick = async () => {
  const fam = currentFamily();
  const modeName = viewMode === 'view' ? '檢視' : '編輯';
  if (!await uiConfirm(`清除「${modeName}模式」下本家族的所有手動位置，恢復自動樹狀。確定嗎？`, { title: '重設卡片位置', kind: 'danger', confirmText: '重設位置' })) return;
  ensureFamilyLayoutShape(fam);
  fam.freeLayout[viewMode] = false;
  fam.manualPos[viewMode] = {};
  clearNodeSelection();
  save(); updateLayoutToggle(); render();
  requestAnimationFrame(fitScreen);
};
$('labelToggle').onclick = () => {
  showRelLabels = !showRelLabels;
  const btn = $('labelToggle');
  if (showRelLabels) { btn.classList.add('active'); setIconText(btn, 'tags', '隱藏關係'); }
  else { btn.classList.remove('active'); setIconText(btn, 'tags', '顯示關係'); }
  syncRelationshipToolbarVisibility();
  try { localStorage.setItem(LABELS_KEY, showRelLabels ? '1' : '0'); } catch(e){}
  if (layoutCache) drawEdges();
};

function calculateFamilyGenerationCount(fam) {
  const ids = new Set((fam.memberIds || []).filter(id => db.sims[id]));
  if (!ids.size) return 0;
  const depthMemo = new Map();
  const depth = (id, stack = new Set()) => {
    if (depthMemo.has(id)) return depthMemo.get(id);
    if (stack.has(id)) return 1;
    const sim = db.sims[id];
    if (!sim) return 1;
    const parents = (sim.parentIds || []).filter(pid => ids.has(pid));
    if (!parents.length) { depthMemo.set(id,1); return 1; }
    const next = new Set(stack); next.add(id);
    const value = 1 + Math.max(...parents.map(pid => depth(pid,next)));
    depthMemo.set(id,value); return value;
  };
  return Math.max(...[...ids].map(id => depth(id)));
}

function renderFamilyCover(fam) {
  const img = $('familyCoverImage'), collage = $('familyCoverCollage'), empty = $('familyCoverEmpty');
  if (!img || !collage || !empty) return;
  const coverUrl = resolveImageUrl(fam.coverImage);
  if (coverUrl) {
    img.src = coverUrl; img.hidden = false; collage.innerHTML=''; empty.style.display='none'; return;
  }
  img.hidden = true; img.removeAttribute('src');
  const members = (fam.memberIds || []).map(id => db.sims[id]).filter(Boolean).slice(0,4);
  const withContent = members.filter(Boolean);
  collage.innerHTML = withContent.map(sim => {
    const url = resolveImageUrl(sim.avatar);
    return `<div class="family-cover-collage-item">${url ? `<img src="${esc(url)}" alt="">` : esc((displayDataText(sim.name,sim)||'?').charAt(0))}</div>`;
  }).join('');
  empty.style.display = withContent.length ? 'none' : '';
}

function renderFamilyMemberList(fam) {
  const list = $('familyMemberList'); if (!list) return;
  const members = (fam.memberIds || []).map(id => db.sims[id]).filter(Boolean);
  if (!members.length) { list.innerHTML = `<div class="family-member-empty">${esc(uiText('目前家族還沒有成員'))}</div>`; return; }
  list.innerHTML = members.map(sim => {
    const url = resolveImageUrl(sim.avatar);
    const meta = [displayDataText(sim.lifeStage,sim), displayDataText(sim.career,sim)].filter(Boolean).join(' · ');
    return `<div class="family-member-row" data-family-sim-id="${esc(sim.id)}" tabindex="0">
      <div class="family-member-avatar">${url ? `<img src="${esc(url)}" alt="">` : esc((displayDataText(sim.name,sim)||'?').charAt(0))}</div>
      <div class="family-member-copy"><div class="family-member-name">${esc(displayDataText(sim.name,sim))}</div><div class="family-member-meta">${esc(meta)}</div></div>
      <div class="app-menu family-member-menu">
        <button class="family-member-more app-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="${esc(uiText('更多'))}">${iconSvg('three-dots')}</button>
        <div class="app-menu-popover family-member-popover" role="menu">
          <button class="app-menu-item" type="button" role="menuitem" data-family-member-action="view" data-family-member-id="${esc(sim.id)}">${iconSvg('person-vcard')}<span>${esc(uiText('查看個人檔案'))}</span></button>
          <button class="app-menu-item" type="button" role="menuitem" data-family-member-action="edit" data-family-member-id="${esc(sim.id)}">${iconSvg('pencil-square')}<span>${esc(uiText('編輯模擬市民'))}</span></button>
          <button class="app-menu-item" type="button" role="menuitem" data-family-member-action="locate" data-family-member-id="${esc(sim.id)}">${iconSvg('crosshair')}<span>${esc(uiText('在族譜中定位'))}</span></button>
          <div class="app-menu-divider"></div>
          <button class="app-menu-item danger" type="button" role="menuitem" data-family-member-action="remove" data-family-member-id="${esc(sim.id)}">${iconSvg('person-dash')}<span>${esc(uiText('移出目前家族'))}</span></button>
        </div>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-family-sim-id]').forEach(row => {
    const open = e => {
      if (e?.target?.closest?.('.family-member-menu')) return;
      openInfoCard(row.dataset.familySimId);
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest?.('.family-member-menu')) {
        e.preventDefault(); open(e);
      }
    });
  });

  list.querySelectorAll('[data-family-member-action]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      const simId = btn.dataset.familyMemberId;
      const action = btn.dataset.familyMemberAction;
      if (!simId || !db.sims[simId]) return;
      if (action === 'view') openInfoCard(simId);
      else if (action === 'edit') openEditor(simId);
      else if (action === 'locate') focusSimOnCanvas(simId);
      else if (action === 'remove') {
        const activeFamily = currentFamily();
        const sim = db.sims[simId];
        const simName = displayDataText(sim.name, sim);
        const familyName = displayDataText(activeFamily.name, activeFamily);
        const ok = await uiConfirm(`將「${simName}」移出「${familyName}」？\n人物本身仍會保留在人物資料中。`, {
          title: '移出目前家族', kind: 'danger', confirmText: '移出家族'
        });
        if (!ok) return;
        activeFamily.memberIds = (activeFamily.memberIds || []).filter(id => id !== simId);
        save();
        refreshFamilyUI();
        render();
        requestAnimationFrame(fitScreen);
      }
    });
  });
  setupAppMenus();
}

function refreshFamilyProfilePanel() {
  const fam = currentFamily(); if (!fam) return;
  ensureFamilyProfileShape(fam);
  const bio = $('familyBio'); if (bio && document.activeElement !== bio) bio.value = fam.bio || '';
  const members = (fam.memberIds || []).map(id => db.sims[id]).filter(Boolean);
  if ($('familyMemberCount')) $('familyMemberCount').textContent = String(members.length);
  if ($('familyGenerationCount')) $('familyGenerationCount').textContent = String(calculateFamilyGenerationCount(fam));
  if ($('familyDeceasedCount')) $('familyDeceasedCount').textContent = String(members.filter(sim => sim.status === '已故' || sim.status === '幽靈').length);
  renderFamilyCover(fam); renderFamilyMemberList(fam);
}

function refreshFamilyUI() {
  const fam = currentFamily();
  const familyName = displayDataText(fam.name, fam);
  familyNameInput.value = familyName;
  syncFamilyNameInputWidth();
  familySelect.innerHTML = db.families.map(f => `<option value="${f.id}">${esc(displayDataText(f.name, f))}</option>`).join('');
  familySelect.value = db.currentId;
  document.title = familyName + ' · ' + uiText('模擬市民族譜工具');
  updateLayoutToggle();
  syncNavSelectControl('familySelect');
  refreshFamilyProfilePanel();
}
familySelect.onchange = () => {
  dragHistory.clear();
  clearNodeSelection();
  arrangeTool = 'pan';
  db.currentId = familySelect.value;
  addMemberSelection.clear();
  removeMemberSelection.clear();
  closeEditor();
  save(); refreshFamilyUI(); render();
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
  fam.name = v;
  familyNameInput.value = v;
  save(); refreshFamilyUI();
};
const familyBioInput = $('familyBio');
if (familyBioInput) {
  familyBioInput.addEventListener('input', () => {
    const fam = currentFamily(); if (!fam) return;
    ensureFamilyProfileShape(fam);
    fam.bio = familyBioInput.value;
    save();
  });
}
const familyCoverInput = $('familyCoverInput');
if (familyCoverInput) familyCoverInput.onchange = async e => {
  const file = e.target.files?.[0]; e.target.value=''; if (!file) return;
  try {
    const dataUrl = await compressBgImage(file);
    const fam = currentFamily(); ensureFamilyProfileShape(fam);
    if (_idbAvailable) { const id = await saveImageToIdb(dataUrl); fam.coverImage = id || dataUrl; }
    else fam.coverImage = dataUrl;
    save({ immediate:true }); renderFamilyCover(fam); scheduleGC();
  } catch(err) { uiAlert(err.message || '圖片處理失敗', { title:'圖片處理失敗', kind:'danger' }); }
};
$('familyCoverClearBtn')?.addEventListener('click', async () => {
  const fam = currentFamily(); if (!fam || !fam.coverImage) return;
  fam.coverImage = null; save({ immediate:true }); renderFamilyCover(fam); scheduleGC();
});

$('newFamilyBtn').onclick = async () => {
  const name = await uiPrompt('請輸入新家族名稱。', '新家族', { title: '新增家族', confirmText: '新增' });
  if (name === null) return;
  const fam = {
    id:uid('fam'), name:name.trim()||'新家族',
    memberIds:[], bio:'', coverImage:null,
    freeLayout: { view: false, edit: false },
    manualPos: { view: {}, edit: {} }, locked: false
  };
  db.families.push(fam);
  dragHistory.clear();
  db.currentId = fam.id;
  addMemberSelection.clear();
  removeMemberSelection.clear();
  save(); refreshFamilyUI(); render();
  requestAnimationFrame(fitScreen);
};
$('delFamilyBtn').onclick = async () => {
  if (db.families.length <= 1) { uiAlert('至少需要保留一個家族。', { title: '無法刪除家族' }); return; }
  const fam = currentFamily();
  if (!await uiConfirm(`確定刪除家族「${displayDataText(fam.name, fam)}」嗎？\n（家族內所有模擬市民仍保留在模擬市民池中）`, { title: '刪除家族', kind: 'danger', confirmText: '刪除家族' })) return;
  db.families = db.families.filter(f => f.id !== fam.id);
  dragHistory.clear();
  db.currentId = db.families[0].id;
  addMemberSelection.clear();
  removeMemberSelection.clear();
  closeEditor(); save(); refreshFamilyUI(); render();
  scheduleGC();
  requestAnimationFrame(fitScreen);
};

function refreshSS(selectId) {
  const wrap = document.querySelector(`.ss-wrap[data-ss-for="${selectId}"]`);
  if (wrap && wrap._refresh) wrap._refresh();
}


// ========【共用單選箭頭】 設定 - 編輯頁與導覽共用同一顆 Chevron SVG ========
function installSharedNativeSelectChevrons(root = document) {
  const selector = '.modal select:not([multiple]), #galleryBrowserFilter';
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
  document.querySelectorAll('.ss-wrap').forEach(wrap => {
    const select = document.getElementById(wrap.dataset.ssFor);
    if (!select) return;
    const input = wrap.querySelector('.ss-input');
    const dropdown = wrap.querySelector('.ss-dropdown');
    const searchEl = wrap.querySelector('.ss-search');
    const optionsEl = wrap.querySelector('.ss-options');
    const isMultiple = select.multiple;
    const rawPlaceholder = wrap.dataset.placeholder || '點選選擇…';

    function renderInput() {
      // 自訂下拉選單的提示文字跟著目前介面語言即時切換。
      const placeholder = uiText(rawPlaceholder);
      if (isMultiple) {
        const selected = [...select.options].filter(o => o.selected);
        if (!selected.length) {
          input.innerHTML = `<span class="ss-placeholder">${esc(placeholder)}</span>`;
        } else {
          input.innerHTML = selected.map(o =>
            `<span class="ss-tag">${esc(o.textContent)}<span class="ss-tag-x" data-remove="${esc(o.value)}" title="移除">×</span></span>`
          ).join('');
        }
        input.querySelectorAll('.ss-tag-x').forEach(x => {
          x.onclick = ev => {
            ev.stopPropagation();
            const opt = [...select.options].find(o => o.value === x.dataset.remove);
            if (opt) opt.selected = false;
            renderInput();
            renderOptions(searchEl.value);
            select.dispatchEvent(new Event('change', {bubbles:true}));
          };
        });
      } else {
        const sel = select.options[select.selectedIndex];
        if (!sel || sel.value === '') input.innerHTML = `<span class="ss-placeholder">${esc(placeholder)}</span>`;
        else input.textContent = sel.textContent;
      }

      // 搜尋型欄位與頂部導覽共用同一顆 chevron-down.svg；
      // 以真正的 SVG ICON 呈現，顏色可直接跟隨各主題，不再被背景色蓋掉。
      input.insertAdjacentHTML('beforeend', iconSvg('chevron-down', 'ss-chevron-icon'));
    }
    function renderOptions(filter = '') {
      const q = filter.trim().toLowerCase();
      const opts = [...select.options];
      const filtered = q ? opts.filter(o => o.textContent.toLowerCase().includes(q)) : opts;
      if (!filtered.length) { optionsEl.innerHTML = '<div class="ss-empty">沒有符合的項目</div>'; return; }
      optionsEl.innerHTML = filtered.map(o => {
        const isEmpty = o.value === '';
        const selected = o.selected;
        const cls = ['ss-option', selected ? 'selected' : '', isEmpty ? 'none' : ''].filter(Boolean).join(' ');
        const check = isMultiple && !isEmpty ? `<span class="check">${selected ? iconSvg('check-lg') : ''}</span>` : '';
        return `<div class="${cls}" data-value="${esc(o.value)}">${check}<span>${esc(o.textContent)}</span></div>`;
      }).join('');
      optionsEl.querySelectorAll('.ss-option').forEach(el => {
        el.onclick = e => {
          e.stopPropagation();
          const val = el.dataset.value;
          const opt = [...select.options].find(o => o.value === val);
          if (!opt) return;
          if (isMultiple) opt.selected = !opt.selected;
          else {
            [...select.options].forEach(o => { o.selected = false; });
            opt.selected = true;
            closeDropdown();
          }
          renderInput();
          renderOptions(searchEl.value);
          select.dispatchEvent(new Event('change', {bubbles:true}));
        };
      });
    }
    function openDropdown() {
      document.querySelectorAll('.ss-wrap.ss-open').forEach(w => {
        if (w !== wrap) {
          w.classList.remove('ss-open');
          const dd = w.querySelector('.ss-dropdown');
          if (dd) dd.style.display = 'none';
        }
      });
      dropdown.style.display = '';
      wrap.classList.add('ss-open');
      searchEl.value = '';
      renderOptions();
      setTimeout(() => searchEl.focus(), 30);
    }
    function closeDropdown() {
      dropdown.style.display = 'none';
      wrap.classList.remove('ss-open');
    }
    input.onclick = e => {
      if (e.target.closest('.ss-tag-x')) return;
      if (wrap.classList.contains('ss-open')) closeDropdown();
      else openDropdown();
    };
    searchEl.oninput = () => renderOptions(searchEl.value);
    searchEl.onkeydown = e => {
      if (e.key === 'Escape') { closeDropdown(); input.focus(); }
      if (e.key === 'Enter') e.preventDefault();
    };
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) closeDropdown();
    });
    wrap._refresh = () => {
      renderInput();
      if (wrap.classList.contains('ss-open')) renderOptions(searchEl.value);
    };
    renderInput();
  });
}

function buildRelationEntries(simId) {
  const entries = []; const seen = new Set();
  const c = db.sims[simId]; if (!c) return entries;
  const push = (entry, group='family') => { entry.group = group; entries.push(entry); seen.add(entry.key); };
  if ((c.parentIds||[]).length) {
    const names = c.parentIds.map(pid => { const sim=db.sims[pid]; return sim ? displayDataText(sim.name,sim) : ''; }).filter(Boolean).join(' + ');
    if (names) { const key='parent:'+simId; push({key,label:`${uiText('父母')}：${names}`,kindHint:c.adoptive?'adoptive':'parent-child'}); }
  }
  getChildrenOf(simId).forEach(child => { const key='parent:'+child.id; if (seen.has(key)) return; push({key,label:`${uiText('子女')}：${displayDataText(child.name,child)}`,kindHint:child.adoptive?'adoptive':'parent-child'}); });
  (c.spouseIds||[]).forEach(sid => { const spouse=db.sims[sid]; if(!spouse)return; const key='spouse:'+pairKey(simId,sid); if(seen.has(key))return; push({key,label:`${uiText('配偶')}：${displayDataText(spouse.name,spouse)}`,kindHint:'spouse'}); });
  (c.exSpouseIds||[]).forEach(sid => { const spouse=db.sims[sid]; if(!spouse)return; const key='exspouse:'+pairKey(simId,sid); if(seen.has(key))return; push({key,label:`${uiText('前任配偶')}：${displayDataText(spouse.name,spouse)}`,kindHint:'exspouse'}); });
  (db.links||[]).forEach(l => {
    if (l.from!==simId && l.to!==simId) return; const otherId=l.from===simId?l.to:l.from; const other=db.sims[otherId]; if(!other)return;
    if(!l.id)l.id=uid('lnk'); const key='link:'+l.id; if(seen.has(key))return;
    const rawTag=l.label||l.type||'關聯'; const tag=displayRelationshipText(rawTag);
    const isSibling = rawTag === SIBLING_LABEL || l.type === SIBLING_LABEL || l.label === SIBLING_LABEL;
    push({key,label:`${tag}：${displayDataText(other.name,other)}`,kindHint:isSibling?'sibling':'custom'}, isSibling?'family':'other');
  });
  return entries;
}
function renderRelAnnoList(simId, sectionId, listId, entries) {
  const section=$(sectionId), list=$(listId); if(!section||!list)return;
  if(!simId){section.style.display='none';list.innerHTML='';return;}
  section.style.display='';
  if(!entries.length){list.innerHTML=`<div class="rel-empty">${esc(uiText('尚無關係連線'))}</div>`;return;}
  const optHTML=Object.entries(REL_PRESETS).map(([k,v])=>`<option value="${k}">${esc(displayRelationshipText(v.label||'(不顯示)'))}</option>`).join('');
  list.innerHTML=entries.map(e=>{
    const rm=db.relMap||{}; let saved=rm[e.key]; if(!saved){const colon=e.key.indexOf(':');const raw=colon>=0?e.key.slice(colon+1):e.key;if(rm[raw])saved=rm[raw];} saved=saved||{};
    const curText=saved.text||'',curKind=saved.kind||''; const hasOffset=!!(db.labelPos&&db.labelPos[e.key]&&(db.labelPos[e.key].dx||db.labelPos[e.key].dy));
    return `<div class="rel-anno-item" data-anno-key="${esc(e.key)}" data-kind-hint="${esc(e.kindHint)}" data-cur-kind="${esc(curKind)}"><div class="rel-anno-name" title="${esc(e.label)}">${esc(e.label)}</div><select><option value="">${esc(uiText('（預設）'))}</option>${optHTML}</select><input type="text" placeholder="${esc(uiText('自訂文字（可選）'))}" value="${esc(curText)}">${hasOffset?`<button type="button" class="rel-anno-reset" data-reset-key="${esc(e.key)}" title="${esc(uiText('重設關係位置'))}">${esc(uiText('重設'))}</button>`:'<span></span>'}</div>`;
  }).join('');
  list.querySelectorAll('.rel-anno-item').forEach(item=>{const curKind=item.dataset.curKind||'',sel=item.querySelector('select');sel.value=curKind&&Object.prototype.hasOwnProperty.call(REL_PRESETS,curKind)?curKind:'';});
  list.querySelectorAll('[data-reset-key]').forEach(btn=>{btn.onclick=()=>{const key=btn.dataset.resetKey;if(db.labelPos&&db.labelPos[key]){delete db.labelPos[key];save();render();renderRelAnno(simId);}};});
}
function renderRelAnno(simId) {
  if(!simId){renderRelAnnoList(null,'familyRelAnnoSection','familyRelAnnoList',[]);renderRelAnnoList(null,'relAnnoSection','relAnnoList',[]);return;}
  const entries=buildRelationEntries(simId);
  renderRelAnnoList(simId,'familyRelAnnoSection','familyRelAnnoList',entries.filter(e=>e.group==='family'));
  renderRelAnnoList(simId,'relAnnoSection','relAnnoList',entries.filter(e=>e.group==='other'));
}

function renderPetAvatarPreview() {
  const el = $('petAvatarPreview');
  const url = resolveImageUrl(editingPetAvatar);
  if (url) el.innerHTML = `<img src="${esc(url)}" alt="">`;
  else {
    const name = $('pName').value.trim();
    const sp = PET_SPECIES[$('pSpecies').value] || PET_SPECIES.other;
    el.innerHTML = name ? esc(name.charAt(0)) : iconSvg(sp.icon);
  }
}
$('petAvatarInput').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const result = await compressImage(file, 'pet');
    const id = await saveImageToIdb(result.dataUrl);
    editingPetAvatar = id || result.dataUrl;
    renderPetAvatarPreview();
  } catch(err){ uiAlert('圖片處理失敗：' + err.message, { title: '圖片處理失敗', kind: 'danger' }); }
  e.target.value = '';
};
$('petAvatarClearBtn').onclick = () => { editingPetAvatar = null; renderPetAvatarPreview(); };
$('pName').addEventListener('input', renderPetAvatarPreview);
$('pSpecies').addEventListener('change', renderPetAvatarPreview);

function openPetEditor(index) {
  editingPetIndex = (typeof index === 'number') ? index : -1;
  const p = editingPetIndex >= 0 ? editingPets[editingPetIndex] : {
    id: uid('pet'), name: '', species: 'dog', breed: '',
    gender: '男', ageStage: '成年', status: '在世', avatar: null
  };
  const owner = editingId ? db.sims[editingId] : null;
  $('petModalTitle').textContent = uiText(editingPetIndex >= 0 ? '編輯寵物' : '新增寵物');
  $('pName').value = owner ? displayDataText(p.name, owner) : (p.name || '');
  $('pSpecies').value = p.species || 'dog';
  $('pBreed').value = owner ? displayDataText(p.breed, owner) : (p.breed || '');
  $('pGender').value = p.gender || '男';
  $('pAgeStage').value = p.ageStage || '成年';
  $('pStatus').value = p.status || '在世';
  editingPetAvatar = p.avatar || null;
  $('pDelete').style.display = editingPetIndex >= 0 ? '' : 'none';
  renderPetAvatarPreview();
  petMask.classList.add('show');
  setTimeout(() => $('pName').focus(), 60);
}
function closePetEditor() {
  petMask.classList.remove('show');
  editingPetIndex = -1;
  editingPetAvatar = null;
}
function savePet() {
  const owner = editingId ? db.sims[editingId] : null;
  const originalPet = editingPetIndex >= 0 && editingPets[editingPetIndex] ? editingPets[editingPetIndex] : null;
  const shownName = originalPet && owner ? displayDataText(originalPet.name, owner) : '';
  const shownBreed = originalPet && owner ? displayDataText(originalPet.breed, owner) : '';
  const inputName = $('pName').value.trim();
  if (!inputName) { uiAlert('請填寫寵物名字', { title: '資料未完成' }); return; }
  const name = originalPet && isBuiltinSampleSim(owner) && inputName === shownName ? originalPet.name : inputName;
  const inputBreed = $('pBreed').value.trim();
  const breed = originalPet && isBuiltinSampleSim(owner) && inputBreed === shownBreed ? originalPet.breed : inputBreed;
  const data = {
    id: originalPet ? originalPet.id : uid('pet'),
    name,
    species: $('pSpecies').value,
    breed,
    gender: $('pGender').value,
    ageStage: $('pAgeStage').value,
    status: $('pStatus').value,
    avatar: editingPetAvatar || null
  };
  if (editingPetIndex >= 0) editingPets[editingPetIndex] = data;
  else editingPets.push(data);
  renderPetsList();
  closePetEditor();
}
async function deletePetFromEditor() {
  if (editingPetIndex < 0) return;
  const p = editingPets[editingPetIndex];
  if (!p) return;
  if (!await uiConfirm(`確定刪除寵物「${p.name}」嗎？`, { title: '刪除寵物', kind: 'danger', confirmText: '刪除' })) return;
  editingPets.splice(editingPetIndex, 1);
  renderPetsList();
  closePetEditor();
}
$('pSave').onclick = savePet;
$('pCancel').onclick = closePetEditor;
$('pDelete').onclick = deletePetFromEditor;
petMask.onclick = e => { if (e.target === petMask) closePetEditor(); };

function renderPetsList() {
  const list = $('petList');
  if (!list) return;
  if (!editingPets.length) { list.innerHTML = `<div class="rel-empty">${esc(uiText('尚未新增寵物'))}</div>`; return; }
  const owner = editingId ? db.sims[editingId] : null;
  list.innerHTML = editingPets.map((p, i) => {
    const icon = petIconFor(p);
    const url = resolveImageUrl(p.avatar);
    const av = url ? `<img src="${esc(url)}" alt="">` : icon;
    const statusIcon = p.status === '幽靈' ? iconSvg('cloud-haze2') : p.status === '已故' ? iconSvg('flower1') : '';
    const metaParts = [petSpeciesLabel(p)];
    if (p.breed) metaParts.push(owner ? displayDataText(p.breed, owner) : p.breed);
    if (p.gender) metaParts.push(uiText(p.gender));
    if (p.ageStage) metaParts.push(uiText(p.ageStage));
    if (p.status && p.status !== '在世') metaParts.push(statusIcon + ' ' + uiText(p.status));
    const displayName = owner ? displayDataText(p.name, owner) : p.name;
    return `<div class="pet-item">
      <div class="pet-item-avatar">${av}</div>
      <div class="pet-item-info">
        <div class="pet-item-name">${esc(displayName) || esc(uiText('（未命名）'))}</div>
        <div class="pet-item-meta">${esc(metaParts.join(' · '))}</div>
      </div>
      <div class="pet-item-actions">
        <button type="button" data-edit-pet="${i}">編輯</button>
        <button type="button" class="danger" data-del-pet="${i}">刪除</button>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-edit-pet]').forEach(btn => {
    btn.onclick = () => openPetEditor(+btn.dataset.editPet);
  });
  list.querySelectorAll('[data-del-pet]').forEach(btn => {
    btn.onclick = async () => {
      const i = +btn.dataset.delPet;
      const p = editingPets[i];
      if (!p) return;
      if (!await uiConfirm(`確定刪除寵物「${p.name}」嗎？`, { title: '刪除寵物', kind: 'danger', confirmText: '刪除' })) return;
      editingPets.splice(i, 1);
      renderPetsList();
    };
  });
}
$('btnAddPet').onclick = () => openPetEditor(-1);

function updateAvatarPreview() {
  const el = $('avatarPreview');
  const url = resolveImageUrl(editingAvatar);
  if (url) el.innerHTML = `<img src="${esc(url)}" alt="">`;
  else {
    const name = $('fName').value.trim();
    el.textContent = name ? name.charAt(0) : '?';
  }
}
$('avatarInput').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const result = await compressImage(file, 'sim');
    const id = await saveImageToIdb(result.dataUrl);
    editingAvatar = id || result.dataUrl;
    updateAvatarPreview();
  } catch(err){ uiAlert('圖片處理失敗：' + err.message, { title: '圖片處理失敗', kind: 'danger' }); }
  e.target.value = '';
};
$('avatarClearBtn').onclick = () => { editingAvatar = null; updateAvatarPreview(); };
$('fName').addEventListener('input', () => {
  const url = resolveImageUrl(editingAvatar);
  if (!url) updateAvatarPreview();
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

function formatBirthdaySummary(monthValue, dayValue) {
  const month = Number(monthValue) || 0;
  const day = Number(dayValue) || 0;
  if (!month || !day) return uiText('生日未設定');

  const lang = document.documentElement.lang || 'zh-Hant';
  if (lang === 'en') {
    try {
      return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(2000, month - 1, day)));
    } catch (_) {}
  }
  return `${month} ${uiText('月')} ${day} ${uiText('日')}`;
}

function syncTraitHiddenInput() {
  const hidden = $('fTraits');
  if (hidden) hidden.value = editingTraits.join('，');
}

function renderTraitEditor() {
  const list = $('traitChipList');
  if (!list) return;
  syncTraitHiddenInput();
  list.innerHTML = editingTraits.map((trait, index) =>
    `<span class="trait-chip"><span>${esc(trait)}</span><button type="button" class="trait-chip-remove" data-trait-index="${index}" aria-label="${esc(uiText('移除'))}" title="${esc(uiText('移除'))}">×</button></span>`
  ).join('');
  list.querySelectorAll('.trait-chip-remove').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.traitIndex);
      if (!Number.isInteger(index) || index < 0 || index >= editingTraits.length) return;
      editingTraits.splice(index, 1);
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
    if (!editingTraits.some(existing => existing.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      editingTraits.push(value);
    }
  });
  input.value = '';
  renderTraitEditor();
  input.focus();
}

function switchEditorTab(tabName = 'basic') {
  const tabs = [...document.querySelectorAll('.sim-editor-tab[data-editor-tab]')];
  const panels = [...document.querySelectorAll('.sim-editor-panel[data-editor-panel]')];
  if (!tabs.some(tab => tab.dataset.editorTab === tabName)) tabName = 'basic';

  tabs.forEach(tab => {
    const active = tab.dataset.editorTab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.tabIndex = active ? 0 : -1;
  });
  panels.forEach(panel => {
    const active = panel.dataset.editorPanel === tabName;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });

  const content = document.querySelector('.sim-editor-content');
  if (content) content.scrollTop = 0;
}

function renderEditorRelationPeople(targetId, ids, emptyText = '—') {
  const target = $(targetId);
  if (!target) return;
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) {
    target.innerHTML = `<span class="family-rel-empty">${esc(uiText(emptyText))}</span>`;
    return;
  }
  target.innerHTML = unique.map(id => {
    const sim = db.sims[id];
    if (!sim) return '';
    const name = displayDataText(sim.name, sim);
    const url = resolveImageUrl(sim.avatar);
    return `<span class="family-rel-person"><span class="family-rel-person-avatar">${url ? `<img src="${esc(url)}" alt="">` : esc((name || '?').charAt(0))}</span><span class="family-rel-person-name">${esc(name)}</span></span>`;
  }).join('') || `<span class="family-rel-empty">${esc(uiText(emptyText))}</span>`;
}

function renderEditorFamilyPreviews() {
  const familyTarget = $('editorFamilyMembershipPreview');
  if (familyTarget) {
    const ids = [...($('fFamilyIds')?.selectedOptions || [])].map(o => o.value);
    const names = ids.map(id => db.families.find(f => f.id === id)).filter(Boolean).map(f => displayDataText(f.name, f));
    familyTarget.innerHTML = names.length
      ? names.map(name => `<span class="family-rel-person family-rel-family"><span class="family-rel-person-avatar">${iconSvg('people')}</span><span class="family-rel-person-name">${esc(name)}</span></span>`).join('')
      : `<span class="family-rel-empty">—</span>`;
  }
  renderEditorRelationPeople('editorParent1Preview', [$('fParent1')?.value]);
  renderEditorRelationPeople('editorParent2Preview', [$('fParent2')?.value]);
  renderEditorRelationPeople('editorSpousePreview', [...($('fSpouse')?.selectedOptions || [])].map(o => o.value));
  renderEditorRelationPeople('editorExSpousePreview', [...($('fExSpouse')?.selectedOptions || [])].map(o => o.value));
  renderEditorRelationPeople('editorChildrenPreview', [...($('fChildren')?.selectedOptions || [])].map(o => o.value));
  renderEditorRelationPeople('editorSiblingsPreview', [...($('fSiblings')?.selectedOptions || [])].map(o => o.value));
}

function resetEditorFamilyPanels() {
  document.querySelectorAll('[data-family-editor-edit]').forEach(panel => { panel.hidden = true; });
  document.querySelectorAll('[data-family-editor-toggle]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
}

function setupSimEditorInteractions() {
  document.querySelectorAll('.sim-editor-tab[data-editor-tab]').forEach(tab => {
    tab.addEventListener('click', () => switchEditorTab(tab.dataset.editorTab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const tabs = [...document.querySelectorAll('.sim-editor-tab[data-editor-tab]')];
      const index = tabs.indexOf(tab);
      if (index < 0) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      switchEditorTab(tabs[nextIndex].dataset.editorTab);
      tabs[nextIndex].focus();
    });
  });

  const traitAddBtn = $('traitAddBtn');
  if (traitAddBtn) traitAddBtn.addEventListener('click', addTraitFromEditor);
  const traitInput = $('traitInput');
  if (traitInput) traitInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTraitFromEditor();
  });

  const month = $('fBirthdayMonth');
  if (month) month.addEventListener('change', () => {
    const previousDay = $('fBirthdayDay')?.value || '';
    populateBirthdayDays(previousDay);
  });

  ['fFamilyIds','fParent1','fParent2','fSpouse','fExSpouse','fChildren','fSiblings'].forEach(id => {
    const element = $(id);
    if (element) element.addEventListener('change', renderEditorFamilyPreviews);
  });

  document.querySelectorAll('[data-family-editor-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.familyEditorToggle;
      const panel = document.querySelector(`[data-family-editor-edit="${key}"]`);
      if (!panel) return;
      const willOpen = panel.hidden;
      document.querySelectorAll('[data-family-editor-edit]').forEach(other => { if (other !== panel) other.hidden = true; });
      document.querySelectorAll('[data-family-editor-toggle]').forEach(other => other.setAttribute('aria-expanded', 'false'));
      panel.hidden = !willOpen;
      button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) panel.querySelector('.ss-input')?.focus({ preventScroll:true });
    });
  });
}

setupSimEditorInteractions();

function openEditor(id) {
  editingId = id || null;
  const c = id ? db.sims[id] : null;
  $('modalTitle').textContent = c ? uiText('編輯模擬市民') : uiText('新增模擬市民');
  $('fName').value = c ? displayDataText(c.name, c) : '';
  $('fStage').value = c ? c.lifeStage : '成年';
  $('fGender').value = c ? (c.gender||'男') : '男';
  $('fStatus').value = c ? (c.status||'在世') : '在世';
  $('fRace').value = c ? (c.race||'') : '';
  $('fBirthdayMonth').value = c && c.birthdayMonth ? String(c.birthdayMonth) : '';
  populateBirthdayDays(c && c.birthdayDay ? c.birthdayDay : '');
  $('fAge').value = c && c.age != null ? String(c.age) : '';
  $('fResidence').value = c ? displayDataText(c.residence, c) : '';
  $('fAspiration').value = c ? displayDataText(c.aspiration, c) : '';
  $('fCauseOfDeath').value = c ? displayDataText(c.causeOfDeath, c) : '';
  editingTraits = c ? (c.traits||[]).map(value => displayDataText(value, c)) : [];
  renderTraitEditor();
  if ($('traitInput')) $('traitInput').value = '';
  $('fCareer').value = c ? displayDataText(c.career, c) : '';
  $('fBio').value = c ? displayDataText(c.bio, c) : '';
  $('fAdoptive').value = c ? String(c.adoptive||false) : 'false';
  editingAvatar = c ? (c.avatar||null) : null;
  updateAvatarPreview();
  editingPets = c ? JSON.parse(JSON.stringify(c.pets || [])) : [];
  renderPetsList();
  editingGallery = c ? JSON.parse(JSON.stringify(c.gallery || [])) : [];
  renderGalleryGrid();
  updateCauseOfDeathVisibility();
  switchEditorTab('basic');

  $('fFamilyIds').innerHTML = db.families.map(f =>
    `<option value="${f.id}">${esc(displayDataText(f.name, f))}</option>`).join('');
  const curFams = new Set();
  if (c) db.families.forEach(f => { if (f.memberIds.includes(c.id)) curFams.add(f.id); });
  else curFams.add(db.currentId);
  [...$('fFamilyIds').options].forEach(o => { o.selected = curFams.has(o.value); });

  const allSims = Object.values(db.sims);
  const parentOptions = allSims
    .filter(x => !c || (x.id !== c.id && !isDescendant(c.id, x.id)))
    .map(x => `<option value="${x.id}">${esc(displayDataText(x.name, x))}</option>`).join('');
  $('fParent1').innerHTML = `<option value="">${esc(uiText('—（無 / 未知）'))}</option>` + parentOptions;
  $('fParent2').innerHTML = `<option value="">${esc(uiText('—（無 / 未知）'))}</option>` + parentOptions;
  const pids = c ? (c.parentIds||[]) : [];
  $('fParent1').value = pids[0] || '';
  $('fParent2').value = pids[1] || '';

  const spouseOptions = allSims
    .filter(x => !c || x.id !== c.id)
    .map(x => `<option value="${x.id}">${esc(displayDataText(x.name, x))}</option>`).join('');
  $('fSpouse').innerHTML = spouseOptions;
  const curSpouses = new Set(c ? (c.spouseIds||[]) : []);
  [...$('fSpouse').options].forEach(o => { o.selected = curSpouses.has(o.value); });

  $('fExSpouse').innerHTML = spouseOptions;
  const curEx = new Set(c ? (c.exSpouseIds||[]) : []);
  [...$('fExSpouse').options].forEach(o => { o.selected = curEx.has(o.value); });

  const childIds = c
    ? Object.values(db.sims).filter(s => (s.parentIds||[]).includes(c.id)).map(s => s.id)
    : [];
  $('fChildren').innerHTML = spouseOptions;
  [...$('fChildren').options].forEach(o => { o.selected = childIds.includes(o.value); });

  const siblingIds = c
    ? (db.links||[])
        .filter(l => (l.from === c.id || l.to === c.id) &&
                     (l.label === SIBLING_LABEL || l.type === SIBLING_LABEL))
        .map(l => l.from === c.id ? l.to : l.from)
    : [];
  $('fSiblings').innerHTML = spouseOptions;
  [...$('fSiblings').options].forEach(o => { o.selected = siblingIds.includes(o.value); });

  $('relTarget').innerHTML = allSims
    .filter(x => !c || x.id !== c.id)
    .map(x => `<option value="${x.id}">${esc(displayDataText(x.name, x))}</option>`).join('');

  renderRelList(c);
  renderRelAnno(c ? c.id : null);
  ['fFamilyIds','fParent1','fParent2','fSpouse','fExSpouse','fChildren','fSiblings','relTarget'].forEach(refreshSS);
  resetEditorFamilyPanels();
  renderEditorFamilyPreviews();

  $('btnDelete').style.display = c ? '' : 'none';
  $('relSection').style.display = c ? '' : 'none';
  const newRelHint = $('newSimRelationsHint');
  if (newRelHint) newRelHint.hidden = !!c;
  mask.classList.add('show');
  setTimeout(() => $('fName').focus(), 60);
}

function closeEditor() {
  mask.classList.remove('show');
  editingId = null;
  editingAvatar = null;
  editingPets = [];
  editingTraits = [];
  editingGallery = [];
  petMask.classList.remove('show');
  editingPetIndex = -1;
  editingPetAvatar = null;
  photoMask.classList.remove('show');
  editingPhotoIndex = -1;
  editingPhotoImageRef = '';
}

function renderRelList(c) {
  if (!c) { $('relList').innerHTML = ''; return; }
  const rels = (db.links||[]).filter(l => (l.from === c.id || l.to === c.id) && !(l.label === SIBLING_LABEL || l.type === SIBLING_LABEL));
  $('relList').innerHTML = rels.length
    ? rels.map((l, i) => {
        const otherId = l.from === c.id ? l.to : l.from;
        const other = db.sims[otherId];
        const arrow = l.from === c.id ? '→' : '←';
        return `<div class="rel-item">
          <span>${esc(displayRelationshipText(l.label || l.type || '關聯'))} ${arrow} ${esc(other ? displayDataText(other.name, other) : uiText('（已刪除）'))}</span>
          <button type="button" data-del="${i}" title="刪除">×</button>
        </div>`;
      }).join('')
    : `<div class="rel-empty">${esc(uiText('暫無其他關係'))}</div>`;
  $('relList').querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      const target = rels[+btn.dataset.del];
      if (target && target.id) {
        if (db.relMap) delete db.relMap['link:' + target.id];
        if (db.labelPos) delete db.labelPos['link:' + target.id];
      }
      db.links = (db.links||[]).filter(l => l !== target);
      renderRelList(c);
      renderRelAnno(c.id);
      save(); render();
    };
  });
}

function syncSpouses(c) {
  Object.values(db.sims).forEach(o => {
    if (o.id === c.id) return;
    o.spouseIds = (o.spouseIds||[]).filter(id => id !== c.id);
    o.exSpouseIds = (o.exSpouseIds||[]).filter(id => id !== c.id);
  });
  c.spouseIds = (c.spouseIds||[]).filter(id => id !== c.id && db.sims[id]);
  c.exSpouseIds = (c.exSpouseIds||[]).filter(id => id !== c.id && db.sims[id]);
  c.spouseIds.forEach(id => {
    const o = db.sims[id];
    if (!o) return;
    o.spouseIds = o.spouseIds || [];
    if (!o.spouseIds.includes(c.id)) o.spouseIds.push(c.id);
  });
  c.exSpouseIds.forEach(id => {
    const o = db.sims[id];
    if (!o) return;
    o.exSpouseIds = o.exSpouseIds || [];
    if (!o.exSpouseIds.includes(c.id)) o.exSpouseIds.push(c.id);
  });
}

function syncChildren(c, newChildIds) {
  const newSet = new Set(newChildIds);
  Object.values(db.sims).forEach(s => {
    if (s.id === c.id) return;
    const wasChild = (s.parentIds || []).includes(c.id);
    const shouldBeChild = newSet.has(s.id);
    if (shouldBeChild && !wasChild) {
      if (!Array.isArray(s.parentIds)) s.parentIds = [];
      s.parentIds = s.parentIds.filter(pid => db.sims[pid]);
      if (s.parentIds.length < 2) s.parentIds.push(c.id);
      else s.parentIds[1] = c.id;
    } else if (wasChild && !shouldBeChild) {
      s.parentIds = s.parentIds.filter(pid => pid !== c.id);
    }
  });
}

function syncSiblings(c, newSiblingIds) {
  const newSet = new Set(newSiblingIds);
  db.links = db.links || [];
  db.links = db.links.filter(l => {
    if (l.from !== c.id && l.to !== c.id) return true;
    const isSibling = (l.label === SIBLING_LABEL) || (l.type === SIBLING_LABEL);
    if (!isSibling) return true;
    const other = l.from === c.id ? l.to : l.from;
    return newSet.has(other);
  });
  newSiblingIds.forEach(sid => {
    const exists = db.links.some(l =>
      (l.from === c.id && l.to === sid) || (l.from === sid && l.to === c.id));
    if (!exists) {
      db.links.push({
        id: uid('lnk'), from: c.id, to: sid,
        type: SIBLING_LABEL, label: SIBLING_LABEL
      });
    }
  });
}

function applyFamilyMembership(simId, newFamilyIds) {
  db.families.forEach(f => {
    const inList = f.memberIds.includes(simId);
    const shouldBe = newFamilyIds.includes(f.id);
    if (shouldBe && !inList) f.memberIds.push(simId);
    else if (!shouldBe && inList) {
      f.memberIds = f.memberIds.filter(id => id !== simId);
      ensureFamilyLayoutShape(f);
      delete f.manualPos.view[simId];
      delete f.manualPos.edit[simId];
    }
  });
}

function collectRelAnnotations() {
  const items = document.querySelectorAll('#familyRelAnnoList .rel-anno-item, #relAnnoList .rel-anno-item');
  items.forEach(item => {
    const key = item.dataset.annoKey;
    if (!key) return;
    const hint = item.dataset.kindHint || '';
    const sel = item.querySelector('select').value;
    const text = item.querySelector('input').value.trim();
    const differs = (sel && sel !== hint) || !!text;
    if (differs) db.relMap[key] = { kind: sel || '', text };
    else delete db.relMap[key];
  });
}

function saveChar() {
  const existing = editingId ? db.sims[editingId] : null;
  const sampleOwner = existing && isBuiltinSampleSim(existing) ? existing : null;
  const preserveSampleText = (field, inputValue) => {
    const input = String(inputValue ?? '').trim();
    if (!sampleOwner) return input;
    const canonical = String(sampleOwner[field] ?? '');
    return input === displayDataText(canonical, sampleOwner) ? canonical : input;
  };
  const preserveSampleTraits = inputTraits => {
    if (!sampleOwner) return inputTraits;
    const shown = (sampleOwner.traits || []).map(value => displayDataText(value, sampleOwner));
    if (shown.length === inputTraits.length && shown.every((value, index) => value === inputTraits[index])) {
      return [...(sampleOwner.traits || [])];
    }
    return inputTraits;
  };

  const rawName = $('fName').value.trim();
  if (!rawName) { uiAlert('請填寫姓名', { title: '資料未完成' }); return; }
  const name = preserveSampleText('name', rawName);
  const newFamilyIds = [...$('fFamilyIds').selectedOptions].map(o => o.value);
  if (!newFamilyIds.length) { uiAlert('請至少選擇一個所屬家族', { title: '資料未完成' }); return; }
  const p1 = $('fParent1').value || null;
  const p2 = $('fParent2').value || null;
  const parentIds = [...new Set([p1, p2].filter(Boolean))];
  const st = $('fStatus').value;

  const data = {
    name,
    lifeStage: $('fStage').value,
    gender: $('fGender').value,
    status: st,
    race: $('fRace').value || '',
    birthdayMonth: $('fBirthdayMonth').value ? Number($('fBirthdayMonth').value) : null,
    birthdayDay: $('fBirthdayDay').value ? Number($('fBirthdayDay').value) : null,
    age: $('fAge').value === '' ? null : Math.min(999, Math.max(0, Number($('fAge').value) || 0)),
    residence: preserveSampleText('residence', $('fResidence').value),
    aspiration: preserveSampleText('aspiration', $('fAspiration').value),
    causeOfDeath: (st === '已故' || st === '幽靈') ? preserveSampleText('causeOfDeath', $('fCauseOfDeath').value) : '',
    parentIds,
    spouseIds: [...$('fSpouse').selectedOptions].map(o => o.value),
    exSpouseIds: [...$('fExSpouse').selectedOptions].map(o => o.value),
    adoptive: $('fAdoptive').value === 'true',
    traits: preserveSampleTraits([...editingTraits]),
    career: preserveSampleText('career', $('fCareer').value),
    bio: preserveSampleText('bio', $('fBio').value),
    avatar: editingAvatar || null,
    pets: JSON.parse(JSON.stringify(editingPets)),
    gallery: JSON.parse(JSON.stringify(editingGallery))
  };
  const newChildIds = [...$('fChildren').selectedOptions].map(o => o.value);
  const newSiblingIds = [...$('fSiblings').selectedOptions].map(o => o.value);

  let c;
  if (editingId) {
    c = db.sims[editingId];
    Object.assign(c, data);
  } else {
    c = { id: uid('sim'), order: Object.keys(db.sims).length, ...data };
    db.sims[c.id] = c;
  }

  syncSpouses(c);
  syncChildren(c, newChildIds);
  syncSiblings(c, newSiblingIds);
  applyFamilyMembership(c.id, newFamilyIds);
  if (editingId) collectRelAnnotations();

  const fam = currentFamily();
  ensureFamilyLayoutShape(fam);
  const { H: NODE_H } = getDims();
  const { LEVEL: LEVEL_GAP } = getGaps();
  if (fam.freeLayout[viewMode]) {
    const manualPos = fam.manualPos[viewMode];
    if (!manualPos[c.id]) {
      const anchorPid = parentIds.find(pid => manualPos[pid]);
      if (anchorPid) {
        const pp = manualPos[anchorPid];
        manualPos[c.id] = { x: pp.x, y: pp.y + NODE_H + LEVEL_GAP };
      } else {
        let maxY = 0;
        Object.values(manualPos).forEach(p => { maxY = Math.max(maxY, p.y + NODE_H); });
        manualPos[c.id] = { x: 0, y: maxY ? maxY + 40 : 0 };
      }
    }
  }
  invalidateChildrenIndex();
  save(); refreshFamilyUI(); render(); closeEditor();
  scheduleGC();
}

async function deleteChar(id) {
  const c = db.sims[id];
  if (!c) return;
  if (!await uiConfirm(`確定徹底刪除「${displayDataText(c.name, c)}」嗎？\n該操作會從所有家族中移除，並從模擬市民池永久刪除。\n\n（若只想從目前家族移除，請使用「移出家族」）`, { title: '永久刪除模擬市民', kind: 'danger', confirmText: '永久刪除' })) return;
  db.families.forEach(f => {
    f.memberIds = f.memberIds.filter(x => x !== id);
    ensureFamilyLayoutShape(f);
    delete f.manualPos.view[id];
    delete f.manualPos.edit[id];
  });
  selectedNodeIds.delete(id);
  delete db.sims[id];
  Object.values(db.sims).forEach(s => {
    s.parentIds = (s.parentIds||[]).filter(x => x !== id);
    s.spouseIds = (s.spouseIds||[]).filter(x => x !== id);
    s.exSpouseIds = (s.exSpouseIds||[]).filter(x => x !== id);
  });
  const removedLinkIds = (db.links||[]).filter(l => l.from === id || l.to === id).map(l => l.id);
  db.links = (db.links||[]).filter(l => l.from !== id && l.to !== id);
  const rm = db.relMap || {};
  Object.keys(rm).forEach(k => {
    const colon = k.indexOf(':');
    const raw = colon >= 0 ? k.slice(colon+1) : k;
    const parts = raw.split('::');
    if (parts.includes(id)) { delete rm[k]; return; }
    if (k.startsWith('link:') && removedLinkIds.includes(k.slice(5))) delete rm[k];
  });
  const lp = db.labelPos || {};
  Object.keys(lp).forEach(k => {
    const colon = k.indexOf(':');
    const raw = colon >= 0 ? k.slice(colon+1) : k;
    const parts = raw.split('::');
    if (parts.includes(id)) { delete lp[k]; return; }
    if (k.startsWith('link:') && removedLinkIds.includes(k.slice(5))) delete lp[k];
  });
  addMemberSelection.delete(id);
  removeMemberSelection.delete(id);
  invalidateChildrenIndex();
  save(); refreshFamilyUI(); render(); closeEditor();
  scheduleGC();
}

function renderRoster() {
  const fam = currentFamily();
  const memberSet = new Set(fam.memberIds);
  const q = rosterSearch.value.trim().toLowerCase();
  const all = Object.values(db.sims);
  all.sort((a,b) => String(a.name).localeCompare(String(b.name),'zh'));
  const filtered = q ? all.filter(s =>
    (s.name||'').toLowerCase().includes(q)
    || (s.career||'').toLowerCase().includes(q)
    || (s.residence||'').toLowerCase().includes(q)
    || (s.aspiration||'').toLowerCase().includes(q)
    || (s.causeOfDeath||'').toLowerCase().includes(q)
    || (s.traits||[]).some(t => (t||'').toLowerCase().includes(q))
    || (s.pets||[]).some(p => (p.name||'').toLowerCase().includes(q) || (p.breed||'').toLowerCase().includes(q))
    || (s.gallery||[]).some(g => (g.title||'').toLowerCase().includes(q))
  ) : all;
  $('rosterCount').textContent = `（${filtered.length}/${all.length}）`;
  if (!filtered.length) {
    $('rosterList').innerHTML = all.length
      ? '<div class="roster-empty">沒有符合的項目</div>'
      : '<div class="roster-empty">還沒有任何模擬市民</div>';
    return;
  }
  $('rosterList').innerHTML = filtered.map(s => {
    const fams = db.families.filter(f => f.memberIds.includes(s.id)).map(f => displayDataText(f.name, f)).join(' · ') || uiText('（未歸屬）');
    const galleryCount = (s.gallery||[]).length;
    const metaParts = [
      { icon:'house-heart', text:fams, title:uiText('所屬家族') }
    ];
    if (galleryCount) metaParts.push({ icon:'images', text:String(galleryCount), title:uiText('相簿') });
    if (s.residence) metaParts.push({ icon:'house', text:displayDataText(s.residence, s), title:uiText('居住地') });
    if ((s.status === '已故' || s.status === '幽靈') && s.causeOfDeath) {
      metaParts.push({ icon:'tombstone', text:displayDataText(s.causeOfDeath, s), title:uiText('死因') });
    }
    if ((s.pets||[]).length) {
      metaParts.push({
        icon:'paw',
        text:(s.pets||[]).map(p => displayDataText(p.name, s)).join('、'),
        title:uiText('寵物')
      });
    }
    const genderIconName = s.gender === '男' ? 'gender-male' : s.gender === '女' ? 'gender-female' : 'gender-ambiguous';
    const genderHTML = `<span class="roster-meta-part roster-meta-gender" title="${esc(uiText(s.gender))}">${iconSvg(genderIconName)}</span>`;
    const metaHTML = metaParts.map(part => {
      const title = part.title ? ` title="${esc(part.title)}"` : '';
      return `<span class="roster-meta-part"${title}>${part.icon ? iconSvg(part.icon) : ''}<span>${esc(part.text)}</span></span>`;
    }).join('<span class="roster-meta-separator" aria-hidden="true">·</span>');
    return `<div class="roster-item">
      <div class="roster-main" data-edit="${s.id}">
        <div class="roster-avatar">${avatarHTML(s)}</div>
        <div class="roster-text">
          <div class="roster-name">${raceIconHTML(s)}${statusIconHTML(s)}${esc(displayDataText(s.name, s))}
            <span class="stage-tag stage-${s.lifeStage}">${esc(uiText(s.lifeStage))}</span>
          </div>
          <div class="roster-meta">${genderHTML}${metaHTML ? '<span class="roster-meta-separator" aria-hidden="true">·</span>' + metaHTML : ''}</div>
        </div>
      </div>
      <div class="roster-actions">
        <button data-edit="${s.id}">編輯</button>
        <button class="danger" data-del="${s.id}">刪除</button>
      </div>
    </div>`;
  }).join('');
  $('rosterList').querySelectorAll('[data-edit]').forEach(el => {
    el.onclick = () => openEditor(el.dataset.edit);
  });
  $('rosterList').querySelectorAll('[data-del]').forEach(el => {
    el.onclick = e => { e.stopPropagation(); deleteChar(el.dataset.del); };
  });
}
$('rosterBtn').onclick = () => {
  rosterSearch.value = '';
  renderRoster();
  rosterMask.classList.add('show');
};
$('rosterCloseBtn').onclick = () => rosterMask.classList.remove('show');
rosterMask.onclick = e => { if (e.target === rosterMask) rosterMask.classList.remove('show'); };
rosterSearch.oninput = debounce(renderRoster, 150);
$('rosterAddBtn').onclick = () => openEditor(null);

function renderAddMemberList() {
  const fam = currentFamily();
  const memberSet = new Set(fam.memberIds);
  const q = $('addMemberSearch').value.trim().toLowerCase();
  const all = Object.values(db.sims);
  all.sort((a,b) => String(a.name).localeCompare(String(b.name),'zh'));
  let candidates = all.filter(s => !memberSet.has(s.id));
  if (q) {
    candidates = candidates.filter(s =>
      (s.name||'').toLowerCase().includes(q)
      || (s.career||'').toLowerCase().includes(q)
      || (s.residence||'').toLowerCase().includes(q)
      || (s.traits||[]).some(t => (t||'').toLowerCase().includes(q)));
  }
  $('addMemberFamilyName').textContent = displayDataText(fam.name, fam);
  const list = $('addMemberList');
  if (!candidates.length) {
    list.innerHTML = all.length === memberSet.size
      ? '<div class="roster-empty">所有模擬市民都已在目前家族中</div>'
      : '<div class="roster-empty">沒有符合的項目</div>';
  } else {
    list.innerHTML = candidates.map(s => {
      const fams = db.families.filter(f => f.memberIds.includes(s.id)).map(f => displayDataText(f.name, f)).join(' · ') || uiText('（未歸屬）');
      const genderIcon = s.gender === '男' ? iconSvg('gender-male') : s.gender === '女' ? iconSvg('gender-female') : iconSvg('gender-ambiguous');
      const isSel = addMemberSelection.has(s.id);
      return `<div class="addmember-item${isSel ? ' selected' : ''}" data-add-id="${s.id}">
        <div class="addmember-checkbox">${isSel ? iconSvg('check-lg') : ''}</div>
        <div class="roster-avatar">${avatarHTML(s)}</div>
        <div class="roster-text">
          <div class="roster-name">${raceIconHTML(s)}${statusIconHTML(s)}${esc(displayDataText(s.name, s))}
            <span class="stage-tag stage-${s.lifeStage}">${esc(uiText(s.lifeStage))}</span>
          </div>
          <div class="roster-meta">${genderIcon} ${esc(fams)}</div>
        </div>
      </div>`;
    }).join('');
  }
  const count = addMemberSelection.size;
  $('addMemberCount').innerHTML = `已選 <b>${count}</b> 人`;
  $('addMemberConfirmBtn').disabled = count === 0;
  list.querySelectorAll('.addmember-item').forEach(el => {
    el.onclick = () => {
      const id = el.dataset.addId;
      if (addMemberSelection.has(id)) addMemberSelection.delete(id);
      else addMemberSelection.add(id);
      renderAddMemberList();
    };
  });
}
$('addMemberBtn').onclick = () => {
  addMemberSelection.clear();
  $('addMemberSearch').value = '';
  renderAddMemberList();
  addMemberMask.classList.add('show');
};
$('addMemberSearch').oninput = debounce(renderAddMemberList, 150);
$('addMemberCancelBtn').onclick = () => addMemberMask.classList.remove('show');
addMemberMask.onclick = e => { if (e.target === addMemberMask) addMemberMask.classList.remove('show'); };
$('addMemberAllBtn').onclick = () => {
  const fam = currentFamily();
  const memberSet = new Set(fam.memberIds);
  Object.values(db.sims).forEach(s => { if (!memberSet.has(s.id)) addMemberSelection.add(s.id); });
  renderAddMemberList();
};
$('addMemberNoneBtn').onclick = () => { addMemberSelection.clear(); renderAddMemberList(); };
$('addMemberConfirmBtn').onclick = () => {
  if (!addMemberSelection.size) return;
  const fam = currentFamily();
  const ids = [...addMemberSelection];
  ids.forEach(id => { if (!fam.memberIds.includes(id)) fam.memberIds.push(id); });
  save();
  addMemberSelection.clear();
  addMemberMask.classList.remove('show');
  refreshFamilyProfilePanel();
  render();
  requestAnimationFrame(fitScreen);
};

function renderRemoveMemberList() {
  const fam = currentFamily();
  const q = $('removeMemberSearch').value.trim().toLowerCase();
  let candidates = fam.memberIds.map(id => db.sims[id]).filter(Boolean);
  candidates.sort((a,b) => String(a.name).localeCompare(String(b.name),'zh'));
  if (q) {
    candidates = candidates.filter(s =>
      (s.name||'').toLowerCase().includes(q)
      || (s.career||'').toLowerCase().includes(q)
      || (s.traits||[]).some(t => (t||'').toLowerCase().includes(q)));
  }
  $('removeMemberFamilyName').textContent = displayDataText(fam.name, fam);
  const list = $('removeMemberList');
  if (!fam.memberIds.length) {
    list.innerHTML = '<div class="roster-empty">目前家族還沒有成員</div>';
  } else if (!candidates.length) {
    list.innerHTML = '<div class="roster-empty">沒有符合的項目</div>';
  } else {
    list.innerHTML = candidates.map(s => {
      const otherFams = db.families.filter(f => f.id !== fam.id && f.memberIds.includes(s.id)).map(f => displayDataText(f.name, f)).join(' · ');
      const alsoIn = otherFams ? uiText('也屬於：') + otherFams : uiText('僅屬於本家族');
      const genderIcon = s.gender === '男' ? iconSvg('gender-male') : s.gender === '女' ? iconSvg('gender-female') : iconSvg('gender-ambiguous');
      const isSel = removeMemberSelection.has(s.id);
      return `<div class="addmember-item${isSel ? ' remove-selected' : ''}" data-remove-id="${s.id}">
        <div class="addmember-checkbox">${isSel ? iconSvg('check-lg') : ''}</div>
        <div class="roster-avatar">${avatarHTML(s)}</div>
        <div class="roster-text">
          <div class="roster-name">${raceIconHTML(s)}${statusIconHTML(s)}${esc(displayDataText(s.name, s))}
            <span class="stage-tag stage-${s.lifeStage}">${esc(uiText(s.lifeStage))}</span>
          </div>
          <div class="roster-meta">${genderIcon} ${esc(alsoIn)}</div>
        </div>
      </div>`;
    }).join('');
  }
  const count = removeMemberSelection.size;
  $('removeMemberCount').innerHTML = `已選 <b>${count}</b> 人`;
  $('removeMemberConfirmBtn').disabled = count === 0;
  list.querySelectorAll('.addmember-item').forEach(el => {
    el.onclick = () => {
      const id = el.dataset.removeId;
      if (removeMemberSelection.has(id)) removeMemberSelection.delete(id);
      else removeMemberSelection.add(id);
      renderRemoveMemberList();
    };
  });
}
$('removeMemberBtn').onclick = () => {
  const fam = currentFamily();
  if (!fam.memberIds.length) { uiAlert('目前家族還沒有成員，無需移除。', { title: '沒有可移除的成員' }); return; }
  removeMemberSelection.clear();
  $('removeMemberSearch').value = '';
  renderRemoveMemberList();
  removeMemberMask.classList.add('show');
};
$('removeMemberSearch').oninput = debounce(renderRemoveMemberList, 150);
$('removeMemberCancelBtn').onclick = () => removeMemberMask.classList.remove('show');
removeMemberMask.onclick = e => { if (e.target === removeMemberMask) removeMemberMask.classList.remove('show'); };
$('removeMemberAllBtn').onclick = () => {
  const fam = currentFamily();
  fam.memberIds.forEach(id => removeMemberSelection.add(id));
  renderRemoveMemberList();
};
$('removeMemberNoneBtn').onclick = () => { removeMemberSelection.clear(); renderRemoveMemberList(); };
$('removeMemberConfirmBtn').onclick = async () => {
  if (!removeMemberSelection.size) return;
  const fam = currentFamily();
  const ids = [...removeMemberSelection];
  const names = ids.map(id => db.sims[id] ? displayDataText(db.sims[id].name, db.sims[id]) : '').filter(Boolean).join('、');
  if (!await uiConfirm(`確定將以下 ${ids.length} 位從「${displayDataText(fam.name, fam)}」移除嗎？\n\n${names}\n\n他們仍保留在模擬市民池中。`, { title: '移出家族', kind: 'danger', confirmText: '移出家族' })) return;
  ensureFamilyLayoutShape(fam);
  ids.forEach(id => {
    fam.memberIds = fam.memberIds.filter(x => x !== id);
    delete fam.manualPos.view[id];
    delete fam.manualPos.edit[id];
  });
  save();
  removeMemberSelection.clear();
  removeMemberMask.classList.remove('show');
  refreshFamilyProfilePanel();
  render();
  requestAnimationFrame(fitScreen);
};

async function exportJSON() {
  const exportDb = JSON.parse(JSON.stringify(db));
  const exportBg = { ...bgSettings };

  const resolve = ref => {
    if (!ref) return ref;
    if (isBase64Ref(ref)) return ref;
    if (isImageIdRef(ref)) return imageCache.get(ref) || '';
    return '';
  };

  Object.values(exportDb.sims).forEach(sim => {
    sim.avatar = resolve(sim.avatar) || null;
    (sim.gallery || []).forEach(g => { g.image = resolve(g.image) || ''; });
    (sim.pets || []).forEach(p => { p.avatar = resolve(p.avatar) || null; });
  });
  (exportDb.families || []).forEach(fam => { fam.coverImage = resolve(fam.coverImage) || null; });
  exportBg.image = resolve(exportBg.image) || null;

  const payload = { ...exportDb, bgSettings: exportBg };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '模擬市民4_族譜備份.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function openExportPanel() {
  if (!exportMask) return;
  exportMask.classList.add('show');
  exportMask.setAttribute('aria-hidden', 'false');
}

function closeExportPanel() {
  if (!exportMask) return;
  exportMask.classList.remove('show');
  exportMask.setAttribute('aria-hidden', 'true');
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
  if (_exportIconSvgCache.has(iconName)) return _exportIconSvgCache.get(iconName);

  if (CUSTOM_ICON_PREVIEW_DATA[iconName]) {
    const svg = CUSTOM_ICON_PREVIEW_DATA[iconName];
    _exportIconSvgCache.set(iconName, svg);
    return svg;
  }

  const candidates = [
    new URL(`../html%20icons/${iconName}.svg`, document.baseURI).href,
    `${ICON_PREVIEW_FALLBACK_BASE}${iconName}.svg`
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const svg = await response.text();
      if (!svg.includes('<svg')) throw new Error('Invalid SVG');
      _exportIconSvgCache.set(iconName, svg);
      return svg;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Icon not found: ${iconName}`);
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
  const icons = [...captureRoot.querySelectorAll('.l1ng-icon')];
  await Promise.all(icons.map(async icon => {
    const iconClass = [...icon.classList].find(name => name.startsWith('icon-'));
    if (!iconClass) return;
    const iconName = iconClass.slice(5);

    try {
      const svg = await loadExportIconSvg(iconName);
      const color = getComputedStyle(icon).color || '#5f6875';
      const coloredSvg = colorizeExportSvg(svg, color);

      // 匯出與畫面共用同一顆 SVG 圖形：clone 中直接放入 inline SVG，避免 background/mask 形成第二套渲染。
      const parsed = new DOMParser().parseFromString(coloredSvg, 'image/svg+xml');
      const svgEl = parsed.documentElement;
      if (!svgEl || String(svgEl.nodeName).toLowerCase() !== 'svg') throw new Error('Invalid SVG');
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      icon.innerHTML = new XMLSerializer().serializeToString(svgEl);
      icon.style.setProperty('-webkit-mask-image', 'none', 'important');
      icon.style.setProperty('mask-image', 'none', 'important');
      icon.style.setProperty('background', 'transparent', 'important');
      icon.style.setProperty('display', 'inline-flex', 'important');
      icon.style.setProperty('align-items', 'center', 'important');
      icon.style.setProperty('justify-content', 'center', 'important');
    } catch (err) {
      // 圖示無法載入時寧可隱藏，也不要輸出成錯誤的實心方塊。
      icon.style.setProperty('visibility', 'hidden', 'important');
    }
  }));
}

const EXPORT_TREE_PADDING_PX = 40;

function buildGenealogyCaptureNode(stageWidth, stageHeight, displayScale, backgroundMode = 'current') {
  const captureViewport = viewport.cloneNode(true);
  captureViewport.classList.remove('dragging');
  captureViewport.style.position = 'fixed';
  captureViewport.style.left = '0';
  captureViewport.style.top = '0';
  captureViewport.style.zIndex = '-2147483647';
  captureViewport.style.pointerEvents = 'none';
  captureViewport.style.width = `${Math.max(1, Math.ceil(stageWidth * displayScale))}px`;
  captureViewport.style.height = `${Math.max(1, Math.ceil(stageHeight * displayScale))}px`;
  captureViewport.style.minWidth = captureViewport.style.width;
  captureViewport.style.minHeight = captureViewport.style.height;
  captureViewport.style.flex = 'none';
  captureViewport.style.overflow = 'hidden';
  captureViewport.style.cursor = 'default';

  if (backgroundMode === 'color' || backgroundMode === 'transparent') {
    captureViewport.classList.remove('has-bg');
    captureViewport.style.setProperty('--custom-bg', 'none');
    captureViewport.style.setProperty('--custom-bg-opacity', '0');
    captureViewport.style.backgroundImage = 'none';
    if (backgroundMode === 'transparent') {
      captureViewport.style.backgroundColor = 'transparent';
      captureViewport.style.background = 'transparent';
    } else {
      const viewportStyle = getComputedStyle(viewport);
      captureViewport.style.background = viewportStyle.backgroundColor || getComputedStyle(document.body).backgroundColor || '#ffffff';
    }
  }

  const captureStage = captureViewport.querySelector('#stage');
  if (!captureStage) throw new Error('Genealogy stage was not found');
  captureStage.classList.remove('is-transforming');
  // 使用與「自動適應螢幕」相同的縮放倍率，只移除 pan；不受玩家當下手動縮放影響。
  captureStage.style.transform = `scale(${displayScale})`;
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

function fitCaptureToCompleteTree(captureViewport, stageWidth, stageHeight, displayScale) {
  const captureStage = captureViewport.querySelector('#stage');
  if (!captureStage) throw new Error('Genealogy stage was not found');

  const viewportRect = captureViewport.getBoundingClientRect();
  const content = [
    ...captureStage.querySelectorAll('.node'),
    ...captureStage.querySelectorAll('#links path'),
    ...captureStage.querySelectorAll('#labels .edge-label')
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
    maxX = Math.max(1, stageWidth * displayScale);
    maxY = Math.max(1, stageHeight * displayScale);
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

function getExportDisplayScale(stageWidth, stageHeight) {
  // 與 fitScreen() 使用同一套公式：匯出保留網頁正常「適應螢幕」時的視覺比例，
  // 但不受玩家當下滾輪縮放或平移位置影響。
  const viewportWidth = Math.max(1, viewport.clientWidth || 1);
  const viewportHeight = Math.max(1, viewport.clientHeight || 1);
  const fitScale = Math.min(
    Math.max(1, viewportWidth - 40) / Math.max(1, stageWidth),
    Math.max(1, viewportHeight - 40) / Math.max(1, stageHeight),
    1.4
  );
  return Math.max(fitScale, SCALE_MIN);
}

async function exportGenealogyImage(sizeKey = 'standard', backgroundMode = 'current') {
  if (!db || !stage || !viewport) throw new Error('Genealogy canvas is not ready');

  // 等待目前語系字型完成載入後再量測與繪製，避免 HTML 與 PNG 的文字基線、膠囊背景位置不同。
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  render();

  const factorMap = { standard: 1, hd: 2, uhd: 3 };
  const factor = factorMap[sizeKey] || 1;
  const stageWidth = Math.max(1, Math.ceil(parseFloat(stage.style.width) || stage.offsetWidth || 1));
  const stageHeight = Math.max(1, Math.ceil(parseFloat(stage.style.height) || stage.offsetHeight || 1));

  const displayScale = getExportDisplayScale(stageWidth, stageHeight);
  const html2canvas = await ensureHtml2Canvas();
  const captureViewport = buildGenealogyCaptureNode(stageWidth, stageHeight, displayScale, backgroundMode);
  document.body.appendChild(captureViewport);

  try {
    // 先讓 clone 套用完整 CSS，再把 mask icon 換成 html2canvas 能正確輸出的 SVG。
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await prepareCaptureIcons(captureViewport);
    const captureSize = fitCaptureToCompleteTree(captureViewport, stageWidth, stageHeight, displayScale);
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

function migrate(raw) {
  if (raw && raw.sims && Array.isArray(raw.families)) {
    // 舊版內建高斯範例沒有 meta 標記；只有完整符合固定 ID 時才補上範例旗標。
    if (['g1','g2','g3','g4','g5','g6'].every(id => raw.sims[id]) &&
        raw.families.some(f => f.id === 'fam_goth') && raw.families.some(f => f.id === 'fam_bacheler')) {
      raw.meta = { ...(raw.meta || {}), sample: true };
    }
    if (!raw.relMap) raw.relMap = {};
    if (!raw.labelPos) raw.labelPos = {};
    raw.families.forEach(f => {
      const oldManualPos = f.manualPos;
      let isNewShape = false;
      if (oldManualPos && typeof oldManualPos === 'object') {
        isNewShape = (typeof oldManualPos.view === 'object') && (typeof oldManualPos.edit === 'object');
      }
      if (!isNewShape) {
        const old = {};
        if (oldManualPos && typeof oldManualPos === 'object') {
          Object.keys(oldManualPos).forEach(k => {
            if (oldManualPos[k] && typeof oldManualPos[k] === 'object' && 'x' in oldManualPos[k] && 'y' in oldManualPos[k]) {
              old[k] = { x: oldManualPos[k].x, y: oldManualPos[k].y };
            }
          });
        }
        f.manualPos = { view: {}, edit: old };
      }
      if (typeof f.freeLayout === 'boolean') f.freeLayout = { view: false, edit: f.freeLayout };
      ensureFamilyLayoutShape(f);
      ensureFamilyProfileShape(f);
    });
    return raw;
  }
  if (raw && Array.isArray(raw.families) && raw.families[0]?.sims) {
    const newSims = {}, newFams = [], map = {};
    raw.families.forEach(fam => {
      const famId = fam.id || uid('fam');
      const newFam = {
        id:famId, name:fam.name||'家族', memberIds:[], bio:fam.bio||'', coverImage:fam.coverImage||null,
        freeLayout: { view: false, edit: !!fam.freeLayout },
        manualPos: { view: {}, edit: {} },
        locked: !!fam.locked
      };
      newFams.push(newFam);
      const tf = newFam;
      fam.sims.forEach(s => {
        const newId = uid('sim');
        map[`${fam.id}::${s.id}`] = newId;
        newSims[newId] = {
          id:newId, name:s.name||'', gender:s.gender||'男',
          lifeStage:s.lifeStage||'成年', status:s.status||'在世',
          race:s.race||'', residence:s.residence||'', aspiration:s.aspiration||'',
          causeOfDeath:s.causeOfDeath||'',
          pets: Array.isArray(s.pets) ? s.pets : [],
          gallery: Array.isArray(s.gallery) ? s.gallery : [],
          parentIds:[], spouseIds:[], exSpouseIds:[],
          adoptive:!!s.adoptive, traits:s.traits||[],
          career:s.career||'', bio:s.bio||'', order:s.order??0,
          avatar:s.avatar||null
        };
        tf.memberIds.push(newId);
        if (fam.freeLayout && s.manualPos) tf.manualPos.edit[newId] = { ...s.manualPos };
      });
    });
    raw.families.forEach(fam => {
      fam.sims.forEach(s => {
        const newId = map[`${fam.id}::${s.id}`];
        const sim = newSims[newId];
        const rawPids = s.parentIds || (s.parentId ? [s.parentId] : []);
        sim.parentIds = rawPids.map(x => map[`${fam.id}::${x}`]).filter(Boolean);
        sim.spouseIds = (s.spouseIds||[]).map(x => map[`${fam.id}::${x}`]).filter(Boolean);
        sim.exSpouseIds = (s.exSpouseIds||[]).map(x => map[`${fam.id}::${x}`]).filter(Boolean);
      });
    });
    const newLinks = [];
    raw.families.forEach(fam => {
      (fam.links||[]).forEach(l => {
        const f = map[`${fam.id}::${l.from}`], t = map[`${fam.id}::${l.to}`];
        if (f && t) newLinks.push({id:uid('lnk'), from:f, to:t, type:l.type, label:l.label});
      });
    });
    return {version:3, sims:newSims, families:newFams, links:newLinks, relMap:{}, labelPos:{},
      currentId: raw.currentId && newFams.some(f => f.id === raw.currentId) ? raw.currentId : newFams[0].id};
  }
  if (raw && Array.isArray(raw.sims)) {
    const sims = {};
    const fam = {
      id:uid('fam'), name:raw.meta?.familyName||'家族', memberIds:[], bio:'', coverImage:null,
      freeLayout: { view: false, edit: false },
      manualPos: { view: {}, edit: {} }, locked: false
    };
    raw.sims.forEach(s => {
      const newId = s.id || uid('sim');
      sims[newId] = {
        id:newId, name:s.name||'', gender:s.gender||'男',
        lifeStage:s.lifeStage||'成年', status:s.status||'在世',
        race:s.race||'', residence:s.residence||'', aspiration:s.aspiration||'',
        causeOfDeath:s.causeOfDeath||'',
        pets: Array.isArray(s.pets) ? s.pets : [],
        gallery: Array.isArray(s.gallery) ? s.gallery : [],
        parentIds:s.parentIds || (s.parentId ? [s.parentId] : []),
        spouseIds:s.spouseIds||[], exSpouseIds:s.exSpouseIds||[],
        adoptive:!!s.adoptive, traits:s.traits||[],
        career:s.career||'', bio:s.bio||'', order:s.order??0,
        avatar:s.avatar||null
      };
      fam.memberIds.push(newId);
    });
    return {version:3, sims, families:[fam],
      links:(raw.links||[]).map(l => ({id:uid('lnk'), ...l})), relMap:{}, labelPos:{}, currentId:fam.id};
  }
  return buildSample();
}

// ========【資料載入管線】 設定 - 遷移、範例正規化與結構正規化只走同一條流程 ========
function prepareDatabase(raw) {
  const prepared = migrate(raw);
  const sampleLanguageRepaired = normalizeBuiltinSampleToTraditional(prepared);
  normalizeAllSims(prepared);
  (prepared.links || []).forEach(link => { if (!link.id) link.id = uid('lnk'); });
  return { prepared, changed: sampleLanguageRepaired };
}

async function importJSON(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const raw = JSON.parse(reader.result);
      const incomingBg = raw.bgSettings;
      const preparedResult = prepareDatabase(raw);
      db = preparedResult.prepared;
      dragHistory.clear();

      if (_idbAvailable) {
        const tasks = [];
        const extract = (obj, key) => {
          if (!isBase64Ref(obj[key])) return;
          const dataUrl = obj[key];
          tasks.push((async () => {
            try {
              const id = await saveImageToIdb(dataUrl);
              if (id) obj[key] = id;
            } catch(e) {}
          })());
        };
        Object.values(db.sims).forEach(sim => {
          extract(sim, 'avatar');
          (sim.gallery || []).forEach(g => extract(g, 'image'));
          (sim.pets || []).forEach(p => extract(p, 'avatar'));
        });
        (db.families || []).forEach(fam => extract(fam, 'coverImage'));
        if (incomingBg && isBase64Ref(incomingBg.image)) {
          const id = await saveImageToIdb(incomingBg.image);
          if (id) incomingBg.image = id;
        }
        await Promise.all(tasks);
        if (incomingBg) {
          bgSettings = { ...bgSettings, ...incomingBg };
          try { localStorage.setItem(BG_KEY, JSON.stringify(bgSettings)); } catch(e){}
        }
      }

      save({ immediate: true });
      refreshFamilyUI();
      applyBg();
      render();
      requestAnimationFrame(fitScreen);
    } catch(err){ uiAlert('匯入失敗：' + err.message, { title: '匯入失敗', kind: 'danger' }); }
  };
  reader.readAsText(file);
}

$('addBtn').onclick = () => openEditor(null);
$('btnCancel').onclick = closeEditor;
$('btnSave').onclick = saveChar;
$('btnDelete').onclick = () => editingId && deleteChar(editingId);
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
  if (galleryViewerMask.classList.contains('show')) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); viewerNav(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); viewerNav(1); return; }
  }
  if (e.key === 'Enter' && e.ctrlKey) {
    if (photoMask.classList.contains('show')) savePhoto();
    else if (petMask.classList.contains('show')) savePet();
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

$('btnAddRel').onclick = () => {
  if (!editingId) return;
  const c = db.sims[editingId];
  if (!c) return;
  const type = $('relType').value.trim() || '關聯';
  const targetId = $('relTarget').value;
  if (!targetId) return;
  db.links = db.links || [];
  db.links.push({id:uid('lnk'), from:c.id, to:targetId, type, label:type});
  $('relType').value = '';
  renderRelList(c);
  renderRelAnno(c.id);
  save(); render();
};

// ========【頂部搜尋】 設定 - 保留原本族譜篩選並補上專案風格搜尋結果 ========
function displayNavText(value, owner = null) {
  return owner ? displayDataText(value, owner) : String(value ?? '');
}

function hideTopbarSearchResults() {
  if (!searchResults) return;
  searchResults.classList.remove('show');
  searchResults.innerHTML = '';
}

function renderTopbarSearchResults() {
  if (!searchResults || !db) return;

  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    hideTopbarSearchResults();
    return;
  }

  const fam = currentFamily();
  const matches = (fam.memberIds || [])
    .map(id => db.sims[id])
    .filter(Boolean)
    .filter(simMatchesTopbarFilters)
    .filter(c => {
      const raw = [c.name, c.career, c.residence].filter(Boolean).join(' ').toLowerCase();
      const translated = [c.name, c.career, c.residence]
        .filter(Boolean)
        .map(value => displayNavText(value, c))
        .join(' ')
        .toLowerCase();
      return raw.includes(q) || translated.includes(q);
    })
    .slice(0, 12);

  if (!matches.length) {
    searchResults.innerHTML = '<div class="topbar-search-empty">沒有符合的項目</div>';
    searchResults.classList.add('show');
    return;
  }

  searchResults.innerHTML = matches.map(c => {
    const meta = [displayNavText(c.career, c), displayNavText(c.residence, c)].filter(Boolean).join(' · ');
    return `
      <div class="topbar-search-result" role="option" tabindex="0" data-search-sim-id="${esc(c.id)}">
        <span class="topbar-search-result-name">${esc(displayNavText(c.name, c))}</span>
        ${meta ? `<span class="topbar-search-result-meta">${esc(meta)}</span>` : ''}
      </div>`;
  }).join('');

  searchResults.classList.add('show');

  searchResults.querySelectorAll('[data-search-sim-id]').forEach(item => {
    const openResult = () => {
      const simId = item.dataset.searchSimId;
      hideTopbarSearchResults();
      if (simId) openInfoCard(simId);
    };
    item.onclick = openResult;
    item.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openResult();
      }
    };
  });
}

searchInput.oninput = debounce(() => {
  if (layoutCache) drawNodes();
  renderTopbarSearchResults();
}, 150);

searchInput.onfocus = () => {
  if (searchInput.value.trim()) renderTopbarSearchResults();
};

function applyTopbarFilters() {
  updateTopbarFilterUI();
  render();
  if (searchInput.value.trim()) renderTopbarSearchResults();
}

[...statusFilterInputs, ...genderFilterInputs].forEach(input => {
  input.addEventListener('change', applyTopbarFilters);
});

$('filterResetBtn')?.addEventListener('click', event => {
  event.preventDefault();
  const defaultStatus = statusFilterInputs.find(input => input.value === '');
  const defaultGender = genderFilterInputs.find(input => input.value === '');
  if (defaultStatus) defaultStatus.checked = true;
  if (defaultGender) defaultGender.checked = true;
  applyTopbarFilters();
});

updateTopbarFilterUI();

document.addEventListener('click', e => {
  if (!searchResults || !searchInput) return;
  const wrap = searchInput.closest('.topbar-search-wrap');
  if (wrap && !wrap.contains(e.target)) hideTopbarSearchResults();
});

const zoomCenter = () => { const r=viewport.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; };
$('zoomInBtn')?.addEventListener('click',()=>{const p=zoomCenter();zoomAt(p.x,p.y,1.16);});
$('zoomOutBtn')?.addEventListener('click',()=>{const p=zoomCenter();zoomAt(p.x,p.y,1/1.16);});
$('fitScreenBtn')?.addEventListener('click',fitScreen);

$('exportBtn').onclick = openExportPanel;
if (exportCloseBtn) exportCloseBtn.onclick = closeExportPanel;
if (exportMask) exportMask.onclick = e => { if (e.target === exportMask) closeExportPanel(); };
if (exportJsonBtn) exportJsonBtn.onclick = async () => { closeExportPanel(); await exportJSON(); };
if (exportImageBtn) exportImageBtn.onclick = async () => {
  const originalText = exportImageBtn.textContent;
  exportImageBtn.disabled = true;
  exportJsonBtn && (exportJsonBtn.disabled = true);
  try {
    exportImageBtn.textContent = uiText('正在匯出族譜圖片…');
    await exportGenealogyImage(getSelectedExportImageSize(), getSelectedExportBackgroundMode());
    closeExportPanel();
    uiToast('族譜圖片匯出完成');
  } catch (err) {
    console.error(err);
    await uiAlert(`族譜圖片匯出失敗：${err && err.message ? err.message : 'Unknown error'}`, { title: '族譜圖片匯出失敗', kind: 'danger' });
  } finally {
    exportImageBtn.textContent = originalText;
    exportImageBtn.disabled = false;
    exportJsonBtn && (exportJsonBtn.disabled = false);
  }
};
$('importInput').onchange = e => {
  const f = e.target.files[0];
  if (f) importJSON(f);
  e.target.value = '';
};

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
    else if (v) {
      const legacyMap = {
        blue:'ling', peach:'rose', orange:'amber', pink:'rose', cranberry:'rose',
        green:'sage', lime:'sage', purple:'amber', thunder:'amber', night:'midnight'
      };
      savedTheme = legacyMap[v] || 'ling';
    }
  } catch(e){}

  if (savedTheme === 'custom') applyCustomTheme(customColors.c1, customColors.c2);
  else applyTheme(savedTheme);

  let savedMode = 'view';
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v && VALID_MODES.includes(v)) savedMode = v;
  } catch(e){}
  applyViewMode(savedMode);

  let savedProfile = 'balanced';
  try {
    const v = localStorage.getItem(AVATAR_PROFILE_KEY);
    if (v && VALID_PROFILES.includes(v)) savedProfile = v;
  } catch(e){}
  applyAvatarProfile(savedProfile);

  let savedPetProfile = 'balanced';
  try {
    const v = localStorage.getItem(PET_AVATAR_PROFILE_KEY);
    if (v && VALID_PROFILES.includes(v)) savedPetProfile = v;
  } catch(e){}
  applyPetAvatarProfile(savedPetProfile);

  let savedGalleryProfile = 'medium';
  try {
    const v = localStorage.getItem(GALLERY_PROFILE_KEY);
    if (v && VALID_GALLERY_PROFILES.includes(v)) savedGalleryProfile = v;
  } catch(e){}
  applyGalleryProfile(savedGalleryProfile);

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
    await openImageDB();
    const all = await idbGetAllImages();
    all.forEach(img => imageCache.set(img.id, img.dataUrl));
    console.log(`[圖片] 已從 IndexedDB 載入 ${all.length} 張圖片`);
  } catch(e) {
    console.warn('IndexedDB 不可用，將使用 localStorage 直接儲存 base64', e);
    _idbAvailable = false;
  }

  const raw = localStorage.getItem(STORE_KEY);
  let preparedResult;
  try {
    preparedResult = prepareDatabase(raw ? JSON.parse(raw) : buildSample());
  } catch(e) {
    preparedResult = prepareDatabase(buildSample());
  }
  db = preparedResult.prepared;
  if (!db.families || !db.families.length) db = prepareDatabase(buildSample()).prepared;
  invalidateChildrenIndex();
  if (preparedResult.changed) save();

  loadSavedBg();

  if (_idbAvailable) {
    migrateBase64ToIdb().then(n => {
      if (n > 0) {
        render();
        applyBg();
        console.log(`[遷移] 完成，共遷移 ${n} 張圖片`);
      }
    });
  }

  setupAppMenus();
  setupHelpTooltipPortal();
  restoreFamilyPanelCollapsed();
  setupSearchSelects();
  refreshFamilyUI();
  render();
  requestAnimationFrame(fitScreen);
}



/* ========【多語系介面】 設定 - 以繁中為主要來源，提供簡中與英文翻譯 ======== */
/*
 * 維護原則：
 * 1. HTML、主程式文案、註解與系統新資料一律以繁體中文撰寫。
 * 2. ZH_HANS_EXACT / ZH_HANS_UI_PHRASES 的「值」才是簡體中文翻譯；繁中仍是索引鍵。
 * 3. EN 的索引鍵同樣使用繁中，避免主程式再以簡中作為 canonical source。
 * 4. 舊版簡中存檔的列舉值由「舊版資料相容」區塊處理，不轉換玩家自行輸入的內容。
 */
const LING_I18N = (() => {
  /* ========【簡中翻譯】 設定 - 繁中完整文案對應簡中顯示值 ======== */
  const ZH_HANS_EXACT = {"10 倍以上":"10 倍以上","IndexedDB 不可用":"IndexedDB 不可用","IndexedDB 被阻塞":"IndexedDB 被阻塞","localStorage 已滿！ 建議：\n1. 等待圖片遷移到 IndexedDB 完成\n2. 或在「主題設定」中清理未使用圖片\n3. 或匯出備份後清空瀏覽器資料":"localStorage 已满！ 建议：\n1. 等待图片迁移到 IndexedDB 完成\n2. 或在「主题设置」中清理未使用图片\n3. 或导出备份后清空浏览器数据","— 快速上手與快捷鍵":"— 快速上手与快捷键","—（無 / 未知）":"—（无 / 未知）","↺ 重置位置":"↺ 重置位置","⌨ 快捷鍵":"⌨ 快捷键","中圖（720px · 約 40–60KB/張 · 預設）":"中图（720px · 约 40–60KB/张 · 默认）","平衡（256px · 預設）":"平衡（256px · 默认）","編輯":"编辑","其他":"其他","加入家族":"加入家族","新增":"新增","新增模擬市民":"新增模拟市民","新增家族":"新建家族","新增圖片":"添加图片","新增寵物":"添加宠物","移出家族":"移出家族","上一張 (←)":"上一张 (←)","下一張 (→)":"下一张 (→)","不包含頭像 / 寵物頭像 / 背景圖":"不包含头像 / 宠物头像 / 背景图","不壓縮 · 保留原始格式與畫質":"不压缩 · 保持原始格式与质量","喪偶":"丧偶","中型圖片":"中图","中，容量是 localStorage 的":"中，容量是 localStorage 的","主題配色（漸層）":"主题配色（渐变）","也屬於：":"也属于：","親生":"亲生","人":"人","人物小傳、結局、備註…":"人物小传、结局、备注…","人生抱負":"人生抱负","人生階段":"人生阶段","人類":"人类","人魚":"人鱼","僅屬於本家族":"仅属于本家族","仇敵":"仇敌","從":"从","從家族移除":"从家族移除","倉鼠":"仓鼠","仙子":"仙子","以滑鼠位置為中心縮放":"以鼠标位置为中心缩放","伴侶":"伴侣","作家 / 學生 / 無":"作家 / 学生 / 无","使用提示":"使用提示","側邊欄":"侧边栏","儲存":"保存","儲存圖片失敗":"保存图片失败","資訊卡彈出視窗":"信息卡弹窗","兒童":"儿童","兄妹":"兄妹","兄弟姐妹":"兄弟姐妹","兄弟姐妹（血緣 / 收養）":"兄弟姐妹（血缘 / 收养）","兔子":"兔子","全選":"全选","全部模擬市民":"全部模拟市民","全部階段":"全部阶段","關係":"关系","關係，如 好友":"关系，如 好友","關聯":"关联","關聯階段（可選）":"关联阶段（可选）","關閉":"关闭","關閉 (Esc)":"关闭 (Esc)","關閉目前彈出視窗":"关闭当前弹窗","刪除":"删除","刪除圖片":"删除图片","刪除失敗":"删除失败","刪除寵物":"删除宠物","刪除模擬市民":"删除模拟市民","到相簿網格，或按":"到相册网格，或按","前任配偶":"前任配偶","勾選後建立「兄弟姐妹」關聯":"勾选后建立「兄弟姐妹」关联","勾選後自動加入對方父母清單":"勾选后自动加入对方父母列表","午夜藍調":"午夜蓝调","壓縮品質":"压缩档位","原始圖片":"原图","雙擊空白處":"双击空白处","取消":"取消","可選：拍攝場景、備註、想記錄的故事…":"可选：拍摄场景、备注、想记录的故事…","名字":"名字","吸血鬼":"吸血鬼","品種":"品种","圖片":"图片","圖片儲存在瀏覽器":"图片保存在浏览器","圖片檢視器":"图片查看器","圖片檢視器中切換上一張 / 下一張":"图片查看器中切换上一张 / 下一张","圖片編輯視窗內貼上剪貼簿圖片":"图片编辑器内粘贴剪贴板图片","在世":"在世","在編輯彈出視窗中快速儲存":"在编辑弹窗中快速保存","填滿（裁切超出部分）":"填充（裁剪超出部分）","備註":"备注","外星人":"外星人","外觀":"外观","主題設定":"主题设置","可在主題設定中檢視":"主题设置里可查看","大型圖片":"大图","頭像畫質":"头像清晰度","女":"女","如：幼兒期 / 婚禮合影 / 全家福":"如：幼儿期 / 婚礼合影 / 全家福","如：旺財 / 咪咪":"如：旺财 / 咪咪","如：柳溪 - 花園社區":"如：柳溪 - 花园社区","如：暢銷作家 / 靈魂伴侶…":"如：畅销作家 / 灵魂伴侣…","如：莫蒂默·高斯":"如：莫蒂默·高斯","如：衰老 / 溺水 / 火災…":"如：衰老 / 溺水 / 火灾…","如：金毛、波斯貓…":"如：金毛、波斯猫…","姓名":"姓名","嬰兒":"婴儿","子女":"子女","子女（血緣 / 收養）":"子女（血缘 / 收养）","儲存空間使用量":"存储用量","完整顯示（可能留白）":"完整显示（可能留白）","寵物":"宠物","寵物頭像":"宠物头像","寵物編輯彈出視窗":"宠物编辑弹窗","家族":"家族","家族名稱":"家族名称","家族名稱：":"家族名称：","匯入":"导入","匯入 JSON 備份":"导入 JSON 备份","匯入失敗：":"导入失败：","匯出":"导出","匯出 JSON":"导出 JSON","匯出 JSON 備份":"导出 JSON 备份","小型圖片":"小图","居住地":"居住地","已故":"已故","已選":"已选","師承":"师承","平移整個族譜視圖":"平移整个族谱视图","平衡":"平衡","重複排列":"平铺","年齡階段":"年龄阶段","幼兒":"幼儿","幼年":"幼年","幽靈":"幽灵","套用自訂漸層":"应用自定义渐变","目前":"当前","目前家族還沒有成員":"当前家族还没有成员","目前家族還沒有成員，無需移除。":"当前家族还没有成员，无需移除。","目前家族還沒有模擬市民，點選左側「 新增模擬市民」開始記錄":"当前家族还没有模拟市民，点击左侧「新增模拟市民」开始记录","性別":"性别","情人":"情人","成年":"成年","所屬家族":"所属家族","所有模擬市民都已在目前家族中":"所有模拟市民都已在当前家族中","拖曳卡片":"拖动卡片","拖曳色票選擇兩種顏色，即時預覽漸層效果":"拖动色板自选两种颜色，实时预览渐变效果","拖曳圖片檔案":"拖拽图片文件","拖曳空白處":"拖拽空白处","摯友":"挚友","提示":"提示","提示面板":"提示面板","搜尋…":"搜索…","搜尋姓名 / 特徵 / 職業…":"搜索姓名 / 特征 / 职业…","搜尋姓名…":"搜索姓名…","搜尋家族…":"搜索家族…","搜尋標題 / 模擬市民名稱 / 備註…":"搜索标题 / 模拟市民名称 / 备注…","搜尋，按":"搜索，按","支援":"支持","支援 JPG / PNG / GIF":"支持 JPG / PNG / GIF","新家族":"新家族","時仍會轉回 base64，與舊版工具完全互通":"时仍会转回 base64，与旧版工具完全互通","尚無關係連線":"暂无关系连线","目前沒有可清理的圖片":"暂无可清理的图片","尚未新增寵物":"暂无宠物","尚未設定背景圖片":"暂无背景图","有創造力, 熱愛戶外, 物質主義":"有创造力, 热爱户外, 物质主义","朋友":"朋友","機器人":"机器人","檢視器中":"查看器中","標題":"标题","標題 / 關聯階段 / 備註":"标题 / 关联阶段 / 备注","標題 / 模擬市民名稱 / 備註":"标题 / 模拟市民名称 / 备注","植物模擬市民":"植物模拟市民","模擬市民":"模拟市民","模擬市民頭像":"模拟市民头像","橘子汽水":"橘子汽水","計算中…":"正在计算…","死因":"死因","每張卡片顯示來源模擬市民與標題；點選開啟大圖檢視器":"每张卡片显示来源模拟市民与标题；点击打开大图查看器","每張圖片可設定：":"每张图片可设置：","沒有符合的項目":"没有匹配","沒有符合的圖片":"没有匹配的图片","瀏覽，":"浏览，","新增其他關係（好友 / 仇敵 / 師承…）":"添加其他关系（好友 / 仇敌 / 师承…）","新增已有模擬市民":"添加已有模拟市民","新增模擬市民到":"添加模拟市民到","清理完成":"清理完成","清理未使用的圖片":"清理未使用图片","清空":"清空","清除圖片":"清除图片","清除頭像":"清除头像","清除篩選":"清除筛选","移除背景":"移除背景","滾輪":"滚轮","點選選擇 · 或拖曳 · 或 Ctrl+V 貼上":"点击选择 · 或拖拽 · 或 Ctrl+V 粘贴","愛上雷神":"爱上雷神","父母 A（血緣）":"父母 A（血缘）","父母 B（可選）":"父母 B（可选）","特徵":"特征","特徵（逗號分隔）":"特征（逗号分隔）","狀態":"状态","狗":"狗","狼人":"狼人","貓":"猫","現任配偶":"现任配偶","電腦版":"电脑版","男":"男","相簿":"相册","相簿圖片編輯彈出視窗":"相册图片编辑弹窗","節省空間":"省空间","知道了":"知道了","確定刪除目前家族嗎？\n人物本身不會被刪除。":"确定删除当前家族吗？\n人物本身不会被删除。","確定刪除這個模擬市民嗎？此操作會同時清除相關關係。":"确定删除这个模拟市民吗？此操作会同时清除相关关系。","離婚":"离婚","種族":"种族","種類":"种类","移除":"移除","簡中":"简中","簡介":"简介","貼上截圖":"粘贴截图","繁中":"繁中","編輯模擬市民 →":"编辑模拟市民 →","編輯模擬市民彈出視窗":"编辑模拟市民弹窗","老年":"老年","職業":"职业","職業 / 備註":"职业 / 备注","背景圖片":"背景图","自動切換為「自由排列」並儲存新位置":"自动切换为「自由排列」并保存新位置","自動適應螢幕":"自动适应屏幕","自訂":"自定义","至少需要保留一個家族。":"至少需要保留一个家族。","選單":"菜单","蔓越莓氣泡":"蔓越莓气泡","蜜桃烏龍":"蜜桃乌龙","蜥蜴":"蜥蜴","視圖與佈局":"视图与布局","模擬市民篩選":"模拟市民筛选","訂婚":"订婚","語言 / Language":"语言 / Language","請輸入家族名稱。":"请输入家族名称。","高畫質":"超清","跨模擬市民":"跨模拟市民","還沒有任何相簿圖片。 開啟某個模擬市民的編輯彈出視窗 →「 相簿」新增圖片後，會在這裡顯示。":"还没有任何相册图片。 打开某个模拟市民的编辑弹窗 →「相册」添加图片后，会在这里显示。","尚未新增相簿圖片":"还没有相册图片","顯示方式":"适应方式","透明度：":"透明度：","配偶":"配偶","青少年":"青少年","青年":"青年","青檸茉莉":"青柠茉莉","頂端支援按":"顶部支持按","領養":"领养","領養關係":"领养关系","顏色 1":"颜色 1","顏色 2":"颜色 2","首次開啟會自動把舊資料（base64）遷移到 IndexedDB":"首次打开会自动把旧数据（base64）迁移到 IndexedDB","馬":"马","魔法師":"魔法师","魚":"鱼","鳥":"鸟","（不指定）":"（不指定）","（不顯示）":"（不显示）","（多張圖片 / 不同階段 / 合影）":"（多张图片 / 不同阶段 / 合影）","（已刪除）":"（已删除）","（未命名）":"（未命名）","（未歸屬）":"（未归属）","（每條連線獨立設定）":"（每条连线独立设置）","（該模擬市民擁有的寵物）":"（该模拟市民拥有的宠物）","（預設）":"（默认）","，並一鍵":"，并一键","：為模擬市民新增多張圖片":"：为模拟市民添加多张图片","：檢視所有模擬市民的相簿圖片":"：查看所有模拟市民的相册图片","顯示標註":"显示标注","檢視模式":"查看模式","高畫質（384px）":"超清（384px）","高畫質（1440px · 約 150–250KB/張）":"高清（1440px · 约 150–250KB/张）","他們仍保留在模擬市民池中，可隨時再次加入任何家族。":"他们仍保留在模拟市民池中，可随时再次加入任何家族。","勾選後點選「加入家族」即可讓它們出現在目前家族的族譜中。":"勾选后点击「加入家族」即可让它们出现在当前家族的族谱中。","圖片資料儲存在瀏覽器的 IndexedDB 中（容量數十 MB），localStorage 僅儲存索引。匯出 JSON 時會自動轉回 base64，與舊版工具完全相容。":"图片数据保存在浏览器的 IndexedDB 中（容量数十 MB），localStorage 只保存索引。导出 JSON 时会自动转回 base64，与旧版工具完全兼容。","支援拖曳圖片到此處，或在編輯器內按 Ctrl+V 貼上截圖":"支持拖拽图片到此处，或在编辑器内按 Ctrl+V 粘贴截图","每條連線可擁有獨立的關係；標註在畫布上可拖曳，避免遮擋卡片。":"每条连线可拥有独立的关系标注；标注在画布上可拖动，避免遮挡卡片。","圖片儲存":"图片存储","大圖（1080px · 約 80–120KB/張）":"大图（1080px · 约 80–120KB/张）","相簿圖片畫質":"相册图片清晰度","相簿瀏覽器":"相册浏览器","模擬市民相簿":"角色相册","選擇圖片":"选择图片","搜尋姓名 / 職業 / 居住地…":"搜索姓名 / 职业 / 居住地…","自動佈局":"自动布局","未鎖定":"未锁定","標註未鎖":"标注未锁","畫布操作":"画布操作","原始圖片（不壓縮 · 大小不限）":"原图（不压缩 · 大小不限）","刪除家族":"删除家族","清理未使用圖片":"清理未使用图片","小圖（512px · 約 20–30KB/張）":"小图（512px · 约 20–30KB/张）","節節省空間（160px）":"省空间（160px）","圖片資料儲存在瀏覽器的 IndexedDB 中（可用空間通常遠大於 localStorage），localStorage 僅儲存索引。匯出 JSON 時會自動轉回 base64，並維持與舊版工具的相容性。":"图片数据保存在浏览器的 IndexedDB 中（容量数十 MB），localStorage 只保存索引。导出 JSON 时会自动转回 base64，与旧版工具完全兼容。","節省空間（192px）":"省空间（192px）","平衡（384px · 預設）":"平衡（384px · 默认）","高畫質（768px）":"超清（768px）","192px · 約 10–16KB/張":"192px · 约 10–16KB/张","384px · 約 30–50KB/張":"384px · 约 30–50KB/张","768px · 約 70–130KB/張":"768px · 约 70–130KB/张","小型圖片（512px · 約 20–30KB/張）":"小图（512px · 约 20–30KB/张）","中型圖片（720px · 約 40–60KB/張 · 預設）":"中图（720px · 约 40–60KB/张 · 默认）","大型圖片（1080px · 約 80–120KB/張）":"大图（1080px · 约 80–120KB/张）","原始圖片（不壓縮 · 不限大小）":"原图（不压缩 · 大小不限）","目前品質：":"当前档位：","僅套用於之後上傳的頭像。":"仅对新上传头像生效。","僅套用於之後上傳的圖片。":"仅对新上传图片生效。","顯示關係":"显示关系","隱藏關係":"隐藏关系","鎖定關係":"锁定关系","解鎖關係":"解锁关系","重設關係位置":"重置关系位置","每條連線可擁有獨立的關係；關係名稱可在畫布上拖曳，避免遮擋卡片。":"每条连线可拥有独立的关系；关系名称可在画布上拖动，避免遮挡卡片。","L1nG 晴空":"L1nG 晴空","森霧鼠尾草":"森雾鼠尾草","莓果薄暮":"莓果薄暮","琥珀紙頁":"琥珀纸页","午夜靛藍":"午夜靛蓝","重設":"重置","重設介面設定":"重置界面设置","重建範例資料":"重建示例数据","「重設介面設定」不會刪除族譜資料；「重建範例資料」會以繁中預設範例重新建立目前資料。":"“重置界面设置”不会删除族谱数据；“重建示例数据”会以繁中默认示例重新建立当前数据。","介面設定已恢復預設。":"界面设置已恢复默认。","已重建繁中範例資料。":"已重建繁中示例数据。","請確認":"请确认","輸入資料":"输入数据","重設卡片位置":"重置卡片位置","重設位置":"重置位置","永久刪除模擬市民":"永久删除模拟市民","永久刪除":"永久删除","無法刪除家族":"无法删除家族","資料未完成":"数据未完成","父母":"父母","暫無更多資訊":"暂无更多信息","恢復主題、背景、側邊欄寬度、檢視模式與圖片品質等介面設定？":"恢复主题、背景、侧边栏宽度、查看模式与图片质量等界面设置？","族譜人物、關係與卡片位置不會被刪除。":"族谱人物、关系与卡片位置不会被删除。","這會刪除目前族譜資料，並重新建立繁體中文的預設範例。":"这会删除当前族谱数据，并重新建立繁体中文的默认示例。","此操作無法復原，建議先匯出 JSON 備份。":"此操作无法撤销，建议先导出 JSON 备份。","儲存空間不足":"存储空间不足","儲存失敗":"保存失败","背景圖片設定儲存失敗。":"背景图片设置保存失败。","圖片處理失敗":"图片处理失败","背景處理失敗":"背景处理失败","移除背景圖片":"移除背景图片","確定清除目前背景圖片嗎？":"确定清除当前背景图片吗？","將掃描所有未被引用的圖片並刪除。確定繼續嗎？":"将扫描所有未被引用的图片并删除。确定继续吗？","開始清理":"开始清理","尚未選擇圖片":"尚未选择图片","請先選擇一張圖片":"请先选择一张图片","原始圖片容量提醒":"原始图片容量提醒","是否仍要儲存原始圖片？":"是否仍要保存原始图片？","IndexedDB 容量雖然較大，但大圖片仍會快速佔滿空間。":"IndexedDB 容量虽然较大，但大图片仍会快速占满空间。","仍要儲存":"仍要保存","請填寫寵物名字":"请填写宠物名字","請填寫姓名":"请填写姓名","請至少選擇一個所屬家族":"请至少选择一个所属家族","沒有可移除的成員":"没有可移除的成员","匯入失敗":"导入失败","自訂文字（可選）":"自定义文字（可选）","張圖片":"张图片","暫無其他關係":"暂无其他关系","還沒有任何模擬市民":"还没有任何模拟市民","請選擇圖片檔案":"请选择图片文件","圖片載入失敗":"图片加载失败","檔案讀取失敗":"文件读取失败","目前瀏覽器 IndexedDB 不可用，圖片以 base64 存在 localStorage":"当前浏览器 IndexedDB 不可用，图片以 base64 保存在 localStorage","他們仍保留在模擬市民池中。":"他们仍保留在模拟市民池中。","點選選擇…":"点击选择…","點選選擇家族（可多選）…":"点击选择家族（可多选）…","點選選擇（可多選）…":"点击选择（可多选）…","選擇目標…":"选择目标…","還沒有任何相簿圖片。":"还没有任何相册图片。","開啟某個模擬市民的編輯彈出視窗 →「相簿」新增圖片後，會在這裡顯示。":"打开某个模拟市民的编辑弹窗 →「相册」添加图片后，会在这里显示。"};

  /* ========【英文翻譯】 設定 - 繁中完整文案對應英文顯示值 ======== */
  const EN = {"模擬市民族譜工具":"The Sims 4 Genealogy Tool","全部階段":"All Life Stages","嬰兒":"Infant","幼兒":"Toddler","兒童":"Child","青少年":"Teen","青年":"Young Adult","成年":"Adult","老年":"Elder","幼年":"Young","匯入":"Import","匯出":"Export","外觀":"Appearance","提示":"Help","家族":"Family","新增家族":"New Family","刪除家族":"Delete Family","模擬市民":"Sims","新增模擬市民":"Add Sim","全部模擬市民":"All Sims","加入家族":"Add to Family","移出家族":"Remove from Family","相簿":"Gallery","相簿瀏覽器":"Gallery Browser","視圖與佈局":"View & Layout","檢視模式":"View Mode","自動佈局":"Auto Layout","未鎖定":"Unlocked","↺ 重置位置":"↺ Reset Positions","顯示標註":"Show Labels","隱藏標註":"Hide Labels","標註未鎖":"Labels Unlocked","標註已鎖":"Labels Locked","電腦版":"Desktop","編輯模擬市民":"Edit Sim","每條連線可擁有獨立的關係；標註在畫布上可拖曳，避免遮擋卡片。":"Each connection can have its own relationship label. Drag labels on the canvas to keep them clear of cards.","模擬市民頭像":"Sim Portraits","選擇圖片":"Choose Image","清除頭像":"Clear Portrait","支援 JPG / PNG / GIF":"Supports JPG / PNG / GIF","姓名":"Name","人生階段":"Life Stage","性別":"Gender","男":"Male","女":"Female","其他":"Other","狀態":"Status","在世":"Alive","幽靈":"Ghost","已故":"Deceased","種族":"Occult Type","（不顯示）":"(Hidden)","(不顯示)":"(Hidden)","人類":"Human","吸血鬼":"Vampire","外星人":"Alien","狼人":"Werewolf","人魚":"Mermaid","魔法師":"Spellcaster","仙子":"Fairy","植物模擬市民":"PlantSim","機器人":"Robot","領養關係":"Adoption","親生":"Biological","領養":"Adopted","死因":"Cause of Death","職業 / 備註":"Career / Notes","居住地":"Residence","人生抱負":"Aspiration","所屬家族":"Families","父母 A（血緣）":"Parent A (Biological)","父母 B（可選）":"Parent B (Optional)","現任配偶":"Current Spouse","前任配偶":"Former Spouse","子女（血緣 / 收養）":"Children (Biological / Adopted)","勾選後自動加入對方父母清單":"Selected Sims are automatically updated with this Sim as a parent.","兄弟姐妹（血緣 / 收養）":"Siblings (Biological / Adopted)","勾選後建立「兄弟姐妹」關聯":"Selecting creates a sibling relationship.","特徵（逗號分隔）":"Traits (comma-separated)","簡介":"Biography","寵物":"Pets","（該模擬市民擁有的寵物）":"(Pets owned by this Sim)","新增寵物":"Add Pet","（多張圖片 / 不同階段 / 合影）":"(Multiple photos / life stages / group photos)","新增圖片":"Add Photo","支援拖曳圖片到此處，或在編輯器內按 Ctrl+V 貼上截圖":"Drag images here, or press Ctrl+V in the editor to paste a screenshot.","關係":"Relationships","（每條連線獨立設定）":"(Configured per connection)","新增其他關係（好友 / 仇敵 / 師承…）":"Add Other Relationship (Friend / Rival / Mentor…)","新增":"Add","刪除模擬市民":"Delete Sim","取消":"Cancel","儲存":"Save","編輯寵物":"Edit Pet","寵物頭像":"Pet Portrait","名字":"Name","種類":"Species","狗":"Dog","貓":"Cat","馬":"Horse","兔子":"Rabbit","鳥":"Bird","倉鼠":"Hamster","魚":"Fish","蜥蜴":"Lizard","品種":"Breed","年齡階段":"Age Stage","刪除寵物":"Delete Pet","編輯圖片":"Edit Photo","圖片":"Image","點選選擇 · 或拖曳 · 或 Ctrl+V 貼上":"Click to choose · drag and drop · or paste with Ctrl+V","清除圖片":"Clear Image","標題":"Title","關聯階段（可選）":"Linked Life Stage (Optional)","（不指定）":"(Not specified)","備註":"Notes","刪除圖片":"Delete Image","圖片檢視器":"Image Viewer","清除篩選":"Clear Filter","關閉":"Close","編輯":"Edit","新增已有模擬市民":"Add Existing Sim","新增模擬市民到":"Add Sims to","勾選後點選「加入家族」即可讓它們出現在目前家族的族譜中。":"Select Sims and choose “Add to Family” to include them in the current family tree.","全選":"Select All","清空":"Clear","已選":"Selected","人":"Sim(s)","從家族移除":"Remove from Family","從":"Remove from","移除":"Remove","他們仍保留在模擬市民池中，可隨時再次加入任何家族。":"They remain in the global Sim pool and can be added to any family again later.","主題設定":"Theme Settings","主題配色（漸層）":"Theme Colors (Gradient)","顏色 1":"Color 1","顏色 2":"Color 2","拖曳色票選擇兩種顏色，即時預覽漸層效果":"Choose two colors to preview the gradient in real time.","套用自訂漸層":"Apply Custom Gradient","背景圖片":"Background Image","尚未設定背景圖片":"No background image","移除背景":"Remove Background","透明度：":"Opacity:","顯示方式":"Fit Mode","填滿（裁切超出部分）":"Cover (crop overflow)","完整顯示（可能留白）":"Contain (may leave empty space)","重複排列":"Tile","頭像畫質":"Portrait Quality","節省空間（160px）":"Compact (160px)","平衡（256px · 預設）":"Balanced (256px · Default)","高畫質（384px）":"HD (384px)","相簿圖片畫質":"Gallery Image Quality","壓縮品質":"Compression Preset","小型圖片（512px · 約 20–30KB/張）":"Small (512px · about 20–30KB/image)","中型圖片（720px · 約 40–60KB/張 · 預設）":"Medium (720px · about 40–60KB/image · Default)","大型圖片（1080px · 約 80–120KB/張）":"Large (1080px · about 80–120KB/image)","高畫質（1440px · 約 150–250KB/張）":"HD (1440px · about 150–250KB/image)","原始圖片（不壓縮 · 不限大小）":"Original (no compression · no size limit)","儲存空間使用量":"Storage Usage","計算中…":"Calculating…","清理未使用的圖片":"Clean Unused Images","圖片資料儲存在瀏覽器的 IndexedDB 中（可用空間通常遠大於 localStorage），localStorage 僅儲存索引。匯出 JSON 時會自動轉回 base64，並維持與舊版工具的相容性。":"Images are stored in the browser’s IndexedDB while localStorage keeps only references. JSON export converts them back to base64 for compatibility with older versions.","使用提示":"Help & Tips","— 快速上手與快捷鍵":"— Quick Start & Shortcuts","畫布操作":"Canvas Controls","拖曳空白處":"Drag empty space","平移整個族譜視圖":"Pan the family tree","滾輪":"Mouse wheel","以滑鼠位置為中心縮放":"Zoom around the pointer","雙擊空白處":"Double-click empty space","自動適應螢幕":"Fit to screen","拖曳卡片":"Drag a card","自動切換為「自由排列」並儲存新位置":"Automatically switches to Free Layout and saves the new position","側邊欄":"Sidebar","：檢視所有模擬市民的相簿圖片":": browse gallery images from all Sims","頂端支援按":"Search by","標題 / 模擬市民名稱 / 備註":"title / Sim name / notes","搜尋，按":"and filter by","模擬市民篩選":"Sim","每張卡片顯示來源模擬市民與標題；點選開啟大圖檢視器":"Each card shows the source Sim and title; click to open the image viewer.","檢視器中":"In the viewer, use","跨模擬市民":"across Sims","瀏覽，":"to browse,","不包含頭像 / 寵物頭像 / 背景圖":"Portraits, pet portraits, and background images are excluded.","模擬市民相簿":"Sim Gallery","編輯模擬市民 →":"Edit Sim →","：為模擬市民新增多張圖片":": add multiple images to a Sim","每張圖片可設定：":"Each image can include:","標題 / 關聯階段 / 備註":"title / linked life stage / notes","支援":"Supports","拖曳圖片檔案":"dragging image files","到相簿網格，或按":"into the gallery grid, or press","貼上截圖":"to paste a screenshot","圖片儲存":"Image Storage","圖片儲存在瀏覽器":"Images are stored in the browser’s","中，容量是 localStorage 的":"with much more capacity than localStorage","10 倍以上":"(10× or more)","首次開啟會自動把舊資料（base64）遷移到 IndexedDB":"On first launch, legacy base64 images are migrated to IndexedDB automatically.","匯出 JSON":"Exporting JSON","時仍會轉回 base64，與舊版工具完全互通":"converts images back to base64 for full backward compatibility.","可在主題設定中檢視":"Theme Settings shows","，並一鍵":"and lets you","⌨ 快捷鍵":"⌨ Shortcuts","關閉目前彈出視窗":"Close the current dialog","圖片檢視器中切換上一張 / 下一張":"Previous / next image in the viewer","圖片編輯視窗內貼上剪貼簿圖片":"Paste a clipboard image in the photo editor","在編輯彈出視窗中快速儲存":"Quick-save in an editor dialog","知道了":"Got it","選單":"Menu","家族名稱":"Family Name","搜尋姓名 / 職業 / 居住地…":"Search name / career / residence…","匯入 JSON 備份":"Import JSON Backup","匯出 JSON 備份":"Export JSON Backup","如：莫蒂默·高斯":"e.g. Mortimer Goth","如：衰老 / 溺水 / 火災…":"e.g. old age / drowning / fire…","作家 / 學生 / 無":"Writer / Student / None","如：柳溪 - 花園社區":"e.g. Willow Creek - Garden District","如：暢銷作家 / 靈魂伴侶…":"e.g. Bestselling Author / Soulmate…","搜尋家族…":"Search families…","搜尋姓名…":"Search names…","有創造力, 熱愛戶外, 物質主義":"Creative, Loves Outdoors, Materialistic","人物小傳、結局、備註…":"Biography, ending, notes…","關係，如 好友":"Relationship, e.g. Friend","如：旺財 / 咪咪":"e.g. Mochi / Luna","如：金毛、波斯貓…":"e.g. Golden Retriever, Persian…","如：幼兒期 / 婚禮合影 / 全家福":"e.g. Toddler years / wedding / family portrait","可選：拍攝場景、備註、想記錄的故事…":"Optional: scene, notes, or the story you want to remember…","關閉 (Esc)":"Close (Esc)","上一張 (←)":"Previous (←)","下一張 (→)":"Next (→)","搜尋標題 / 模擬市民名稱 / 備註…":"Search title / Sim / notes…","搜尋姓名 / 特徵 / 職業…":"Search name / traits / career…","搜尋…":"Search…","目前":"Current","職業":"Career","尚無關係連線":"No relationship links","尚未新增寵物":"No pets","沒有符合的項目":"No matches","所有模擬市民都已在目前家族中":"All Sims are already in the current family","目前家族還沒有成員":"The current family has no members","（未命名）":"(Unnamed)","（預設）":"(Default)","—（無 / 未知）":"— (None / Unknown)","（未歸屬）":"(Unassigned)","僅屬於本家族":"Only in this family","關聯":"Relationship","（已刪除）":"(Deleted)","刪除":"Delete","尚未新增相簿圖片":"No gallery images yet","沒有符合的圖片":"No matching images","新家族":"New Family","家族名稱：":"Family name:","至少需要保留一個家族。":"At least one family must remain.","確定刪除目前家族嗎？\n人物本身不會被刪除。":"Delete the current family?\nThe Sims themselves will not be deleted.","請輸入家族名稱。":"Please enter a family name.","確定刪除這個模擬市民嗎？此操作會同時清除相關關係。":"Delete this Sim? Related relationships will also be removed.","目前家族還沒有成員，無需移除。":"The current family has no members to remove.","匯入失敗：":"Import failed:","清理完成":"Cleanup complete","目前沒有可清理的圖片":"There are no unused images to clean up.","刪除失敗":"Delete failed","IndexedDB 不可用":"IndexedDB is unavailable","IndexedDB 被阻塞":"IndexedDB is blocked","儲存圖片失敗":"Failed to save image","蜜桃烏龍":"Peach Oolong","橘子汽水":"Orange Soda","蔓越莓氣泡":"Cranberry Fizz","青檸茉莉":"Lime Jasmine","愛上雷神":"Thunder","午夜藍調":"Midnight Blue","節省空間":"Compact","平衡":"Balanced","高畫質":"Ultra HD","小型圖片":"Small","中型圖片":"Medium","大型圖片":"Large","原始圖片":"Original","不壓縮 · 保留原始格式與畫質":"No compression · keep original format and quality","配偶":"Spouse","訂婚":"Engaged","伴侶":"Partner","情人":"Lover","離婚":"Divorced","喪偶":"Widowed","子女":"Child","兄弟姐妹":"Siblings","兄妹":"Sibling","摯友":"Best Friend","朋友":"Friend","仇敵":"Rival","師承":"Mentor","自訂":"Custom","編輯模擬市民彈出視窗":"Edit Sim Dialog","寵物編輯彈出視窗":"Pet Editor Dialog","相簿圖片編輯彈出視窗":"Gallery Photo Editor Dialog","資訊卡彈出視窗":"Sim Info Dialog","提示面板":"Help Panel","語言 / Language":"Language","160px · 約 8–12KB/張":"160px · about 8–12KB/image","256px · 約 15–25KB/張":"256px · about 15–25KB/image","384px · 約 30–50KB/張":"384px · about 30–50KB/image","512px · 約 20–30KB/張":"512px · about 20–30KB/image","720px · 約 40–60KB/張":"720px · about 40–60KB/image","1080px · 約 80–120KB/張":"1080px · about 80–120KB/image","1440px · 約 150–250KB/張":"1440px · about 150–250KB/image","岡瑟·高斯":"Gunther Goth","柳溪 - 歐菲莉亞別墅":"Willow Creek - Ophelia Villa","財富創造者":"Fabulously Wealthy","衰老":"Old Age","雄心勃勃":"Ambitious","天才":"Genius","勢利":"Snob","商業":"Business","高斯家族創始人之一，已故。":"One of the founders of the Goth family. Deceased.","科妮莉亞·高斯":"Cornelia Goth","大家庭":"Big Happy Family","家庭觀念":"Family-Oriented","愛整潔":"Neat","美食家":"Foodie","無":"None","高斯家族女主人，已故。":"Matriarch of the Goth family. Deceased.","莫蒂默·高斯":"Mortimer Goth","暢銷作家":"Bestselling Author","午夜":"Midnight","黑貓":"Black Cat","有創造力":"Creative","浪漫":"Romantic","陰沈":"Gloomy","作家":"Writer","現任高斯家族族長。":"Current head of the Goth family.","貝拉·巴切勒":"Bella Bachelor","靈魂伴侶":"Soulmate","金毛":"Goldie","金毛尋回犬":"Golden Retriever","熱愛戶外":"Loves Outdoors","開朗":"Cheerful","愛調情":"Romantic","巴切勒家的女兒，嫁入高斯家。":"Daughter of the Bachelor family, married into the Goth family.","卡桑德拉·高斯":"Cassandra Goth","柳溪 - 花園社區":"Willow Creek - Garden District","卓越畫家":"Painter Extraordinaire","物質主義":"Materialistic","學生":"Student","莫蒂默和貝拉的女兒。":"Daughter of Mortimer and Bella.","亞歷山大·高斯":"Alexander Goth","電腦奇才":"Computer Whiz","莫蒂默和貝拉的兒子。":"Son of Mortimer and Bella.","高斯家族":"Goth Family","巴切勒家族":"Bachelor Family","節省空間（192px）":"Compact (192px)","平衡（384px · 預設）":"Balanced (384px · Default)","高畫質（768px）":"HD (768px)","192px · 約 10–16KB/張":"192px · about 10–16KB/image","768px · 約 70–130KB/張":"768px · about 70–130KB/image","顯示關係":"Show Relationships","隱藏關係":"Hide Relationships","鎖定關係":"Lock Relationships","解鎖關係":"Unlock Relationships","重設關係位置":"Reset Relationship Position","每條連線可擁有獨立的關係；關係名稱可在畫布上拖曳，避免遮擋卡片。":"Each connection can have its own relationship. Drag relationship labels on the canvas to keep them clear of cards.","L1nG 晴空":"L1nG Clear Sky","森霧鼠尾草":"Sage Mist","莓果薄暮":"Berry Dusk","琥珀紙頁":"Amber Paper","午夜靛藍":"Midnight Indigo","重設":"Reset","重設介面設定":"Reset Interface Settings","重建範例資料":"Rebuild Sample Data","「重設介面設定」不會刪除族譜資料；「重建範例資料」會以繁中預設範例重新建立目前資料。":"Reset Interface Settings keeps your genealogy data. Rebuild Sample Data replaces the current data with the default Traditional Chinese sample.","介面設定已恢復預設。":"Interface settings restored to defaults.","已重建繁中範例資料。":"Traditional Chinese sample data rebuilt.","請確認":"Confirm","輸入資料":"Enter Information","重設卡片位置":"Reset Card Positions","重設位置":"Reset Positions","永久刪除模擬市民":"Permanently Delete Sim","永久刪除":"Permanently Delete","無法刪除家族":"Cannot Delete Family","資料未完成":"Incomplete Information","父母":"Parents","暫無更多資訊":"No additional information","自由排列":"Free Layout","已鎖定":"Locked","恢復主題、背景、側邊欄寬度、檢視模式與圖片品質等介面設定？":"Restore theme, background, sidebar width, view mode, and image-quality settings?","族譜人物、關係與卡片位置不會被刪除。":"Genealogy Sims, relationships, and card positions will not be deleted.","這會刪除目前族譜資料，並重新建立繁體中文的預設範例。":"This will delete the current genealogy data and rebuild the default Traditional Chinese sample.","此操作無法復原，建議先匯出 JSON 備份。":"This cannot be undone. Export a JSON backup first if you want to keep the current data.","儲存空間不足":"Storage Full","儲存失敗":"Save Failed","背景圖片設定儲存失敗。":"Failed to save the background-image settings.","圖片處理失敗":"Image Processing Failed","背景處理失敗":"Background Processing Failed","移除背景圖片":"Remove Background Image","確定清除目前背景圖片嗎？":"Remove the current background image?","清理未使用圖片":"Clean Up Unused Images","將掃描所有未被引用的圖片並刪除。確定繼續嗎？":"Scan for all unreferenced images and delete them?","開始清理":"Start Cleanup","尚未選擇圖片":"No Image Selected","請先選擇一張圖片":"Choose an image first.","原始圖片容量提醒":"Original Image Size Warning","是否仍要儲存原始圖片？":"Save the original image anyway?","IndexedDB 容量雖然較大，但大圖片仍會快速佔滿空間。":"IndexedDB has more capacity, but large images can still fill it quickly.","仍要儲存":"Save Anyway","請填寫寵物名字":"Enter a pet name.","請填寫姓名":"Enter a name.","請至少選擇一個所屬家族":"Select at least one family.","沒有可移除的成員":"No Members to Remove","匯入失敗":"Import Failed","自訂文字（可選）":"Custom text (optional)","張圖片":"image(s)","暫無其他關係":"No other relationships","還沒有任何模擬市民":"No Sims yet","請選擇圖片檔案":"Choose an image file.","圖片載入失敗":"Image failed to load.","檔案讀取失敗":"File read failed.","目前瀏覽器 IndexedDB 不可用，圖片以 base64 存在 localStorage":"IndexedDB is unavailable in this browser. Images are stored as base64 in localStorage.","他們仍保留在模擬市民池中。":"They will remain in the global Sim pool.","世界之友":"Friend of the World","健美運動員":"Bodybuilder","兒童期":"Childhood","全家福":"Family Portrait","公敵":"Public Enemy","凍死":"Freezing","名人":"Celebrity","吸血鬼灼燒":"Vampire Sunlight","園藝大師":"Freelance Botanist","婚禮合影":"Wedding Photo","嬰兒期":"Infancy","尷尬死":"Embarrassment","平移整個族譜畫布":"Pan the family-tree canvas","幼兒期":"Toddler Years","度假照":"Vacation Photo","心臟病":"Cardiac Explosion","快捷鍵":"Shortcuts","情場達人":"Serial Romantic","憤怒死":"Anger","成年期":"Adulthood","拖曳調整側邊欄寬度；雙擊恢復預設寬度":"Drag to resize the sidebar; double-click to restore the default width","搜尋結果":"Search Results","暴曬":"Overheating","極限運動員":"Extreme Sports Enthusiast","模擬市民 4 族譜工具":"The Sims 4 Genealogy Tool","檢視與佈局":"View & Layout","河豚":"Pufferfish","派對王":"Party Animal","流星":"Meteorite","溺水":"Drowning","火災":"Fire","無所事事":"Fabulously Filthy","牛頭人花":"Cowplant","生日派對":"Birthday Party","生物博士":"Curator","畢業照":"Graduation Photo","確定":"Confirm","神秘死":"Mysterious Death","笑死":"Hysteria","美食大師":"Master Chef","羞憤死":"Mortification","老年期":"Elder Years","考古學家":"Archaeology Scholar","自然主義者":"Outdoor Enthusiast","蒸汽浴":"Steam","調整側邊欄寬度":"Resize sidebar","調酒大師":"Master Mixologist","豪宅大亨":"Mansion Baron","超級父母":"Super Parent","連環浪漫":"Serial Romantic","都市傳說":"Urban Legend","釣魚大師":"Angling Ace","電擊":"Electrocution","靈魂探索者":"Inner Peace","青年期":"Young Adulthood","音樂天才":"Musical Genius","飢餓":"Starvation","首席運動員":"Chief of Mischief","首領":"Leader of the Pack","點選選擇…":"Click to choose…","點選選擇家族（可多選）…":"Choose families (multiple allowed)…","點選選擇（可多選）…":"Choose options (multiple allowed)…","選擇目標…":"Choose a target…","還沒有任何相簿圖片。":"No gallery images yet.","開啟某個模擬市民的編輯彈出視窗 →「相簿」新增圖片後，會在這裡顯示。":"Open a Sim editor and add images under “Gallery” to display them here."};

  /* ========【簡中字元】 設定 - 繁中字元對應簡中字元 ======== */
  const HANT_HANS_CHAR_MAP = {"與":"与","業":"业","兩":"两","喪":"丧","個":"个","為":"为","義":"义","烏":"乌","樂":"乐","於":"于","亞":"亚","親":"亲","僅":"仅","從":"从","倉":"仓","們":"们","優":"优","會":"会","傳":"传","侶":"侣","側":"侧","儲":"储","兒":"儿","關":"关","養":"养","內":"内","岡":"冈","冊":"册","寫":"写","凍":"冻","擊":"击","創":"创","刪":"删","別":"别","動":"动","勢":"势","區":"区","單":"单","佔":"占","歷":"历","壓":"压","雙":"双","變":"变","號":"号","後":"后","嗎":"吗","啓":"启","員":"员","園":"园","圖":"图","場":"场","處":"处","備":"备","復":"复","頭":"头","嬰":"婴","學":"学","實":"实","寵":"宠","對":"对","尋":"寻","導":"导","將":"将","尷":"尴","層":"层","屬":"属","師":"师","帶":"带","並":"并","應":"应","開":"开","異":"异","張":"张","彈":"弹","歸":"归","當":"当","錄":"录","徹":"彻","徵":"征","態":"态","總":"总","憤":"愤","戶":"户","擴":"扩","掃":"扫","擬":"拟","擁":"拥","擇":"择","摯":"挚","擋":"挡","換":"换","據":"据","攝":"摄","敵":"敌","數":"数","無":"无","舊":"旧","時":"时","顯":"显","曬":"晒","暫":"暂","機":"机","條":"条","來":"来","極":"极","檸":"柠","標":"标","棧":"栈","欄":"栏","樹":"树","檔":"档","歐":"欧","畢":"毕","氣":"气","沈":"沉","沒":"没","潔":"洁","淺":"浅","瀏":"浏","漸":"渐","滾":"滚","滿":"满","靈":"灵","災":"灾","點":"点","燒":"烧","熱":"热","愛":"爱","狀":"状","獨":"独","貓":"猫","環":"环","現":"现","電":"电","畫":"画","暢":"畅","礎":"础","確":"确","禮":"礼","離":"离","種":"种","稱":"称","篩":"筛","簡":"简","類":"类","約":"约","級":"级","線":"线","組":"组","結":"结","統":"统","繼":"继","續":"续","緩":"缓","編":"编","緣":"缘","縮":"缩","網":"网","職":"职","聯":"联","髒":"脏","腦":"脑","藝":"艺","節":"节","藍":"蓝","雖":"虽","觀":"观","視":"视","覽":"览","觸":"触","計":"计","訂":"订","認":"认","讓":"让","議":"议","記":"记","設":"设","該":"该","語":"语","誤":"误","說":"说","請":"请","讀":"读","調":"调","譜":"谱","貝":"贝","負":"负","財":"财","敗":"败","質":"质","貼":"贴","轉":"转","輪":"轮","載":"载","較":"较","輯":"辑","輸":"输","邊":"边","達":"达","遷":"迁","運":"运","還":"还","這":"这","連":"连","適":"适","選":"选","釣":"钓","鈕":"钮","鋪":"铺","銷":"销","鎖":"锁","鍵":"键","長":"长","閉":"闭","間":"间","陰":"阴","階":"阶","隨":"随","隱":"隐","頂":"顶","項":"项","預":"预","領":"领","題":"题","顏":"颜","額":"额","風":"风","飢":"饥","餓":"饿","馬":"马","魚":"鱼","鳥":"鸟","齡":"龄","龍":"龙"};

  /* ========【簡中介面詞彙】 設定 - 台灣用語對應簡中常用介面詞彙 ======== */
  const ZH_HANS_UI_PHRASES = {"主題設定":"主题设置","設定":"设置","預設":"默认","自訂":"自定义","套用自訂":"应用自定义","漸層":"渐变","相簿":"相册","儲存":"保存","資料":"数据","搜尋":"搜索","支援":"支持","滑鼠":"鼠标","螢幕":"屏幕","貼上":"粘贴","剪貼簿":"剪贴板","檔案":"文件","快取":"缓存","記憶體":"内存","匯入":"导入","匯出":"导出","相容":"兼容","拖曳":"拖动","新增":"新建","點選":"点击","上傳":"上传","下拉選單":"下拉列表","檢視器":"查看器","檢視模式":"查看模式","檢視所有":"查看所有","畫質":"质量","畫質設定":"画质档位","壓縮品質":"压缩档位","目前品質":"当前档位","節省空間":"省空间","高畫質":"高清","原始圖片":"原图","不壓縮 · 保留原始格式與畫質":"不压缩 · 保持原始格式与质量","顯示方式":"适应方式","填滿（裁切超出部分）":"填充（裁剪超出部分）","裁切":"裁剪","重複排列":"平铺","儲存空間使用量":"存储用量","計算中":"正在计算","目前家族":"当前家族","目前":"当前","即時":"实时","頂端":"顶部","首次開啟":"首次打开","開啟":"打开","關閉":"关闭","彈出視窗":"弹窗","網格":"网格","來源模擬市民":"来源模拟市民","模擬市民篩選":"模拟市民筛选","模擬市民名稱":"模拟市民名称","模擬市民相簿":"模拟市民相册","圖片編輯視窗":"图片编辑器","圖片檢視器":"图片查看器","數十 MB":"数十 MB","localStorage 僅儲存索引":"localStorage 只保存索引","側邊欄":"侧边栏","備註":"备注","資訊":"信息","選單":"菜单","清單":"列表","可在主題設定中檢視":"主题设置里可查看","這裡":"这里","移除嗎":"移除吗","標註":"标注","佈局":"布局","檢視":"查看","模擬市民":"模拟市民","非同步":"异步","啟動":"启动","重設":"重置","堆疊":"栈"};
  const ZH_HANS_UI_KEYS = Object.keys(ZH_HANS_UI_PHRASES).sort((a,b) => b.length - a.length);

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
  '自動佈局時，拖曳空白處平移整個族譜畫布；滾輪以滑鼠位置為中心縮放': '自动布局时，拖动空白处平移整个族谱画布；滚轮以鼠标位置为中心缩放',
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
  '月': '月',
  '日': '日',
  '歲': '岁',
  '生日月份': '生日月份',
  '生日日期': '生日日期',
  '生日未設定': '生日未设置',
  '年齡未設定': '年龄未设置',
  '居住地未設定': '居住地未设置',
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
  '月': 'Month',
  '日': 'Day',
  '歲': 'years old',
  '生日月份': 'Birthday month',
  '生日日期': 'Birthday day',
  '生日未設定': 'Birthday not set',
  '年齡未設定': 'Age not set',
  '居住地未設定': 'Residence not set',
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
  if (e.key === 'Escape' && nodeContextMenu?.classList.contains('show')) closeNodeContextMenu();
});

Object.assign(ZH_HANS_EXACT, {
  '編輯家族名稱':'编辑家族名称','管理…':'管理…','設定':'设置','家庭與關係':'家庭与关系','其他關係':'其他关系',
  '篩選':'筛选','全部狀態':'全部状态','全部性別':'全部性别','重設篩選':'重置筛选','父母 A':'父母 A','父母 B':'父母 B',
  '背景':'背景','目前背景圖片':'当前背景图片','背景顏色':'背景颜色','透明背景（PNG）':'透明背景（PNG）',
  '查看個人檔案':'查看个人资料','在族譜中定位':'在族谱中定位','移出目前家族':'移出当前家族',
  '卡片顯示內容':'卡片显示内容','卡片外觀':'卡片外观','檢視卡片外觀':'查看模式卡片外观','檢視模式顯示內容':'查看模式显示内容','編輯模式顯示內容':'编辑模式显示内容','極簡':'极简','半透明':'半透明','完整卡片':'完整卡片',
  '套用於所有檢視模式人物卡':'应用于所有查看模式人物卡','只套用於檢視模式人物卡':'仅应用于查看模式人物卡','只套用於編輯模式人物卡':'仅应用于编辑模式人物卡','顯示內容套用於檢視與編輯模式；外觀只套用檢視模式':'显示内容应用于查看与编辑模式；外观仅应用于查看模式','重設所選位置':'重置所选位置','移出所選人物':'移出所选人物','取消選取':'取消选择',
  '確定要將所選人物移出目前家族嗎？':'确定要将所选人物移出当前家族吗？','人物本身仍會保留在人物資料中。':'人物本身仍会保留在人物资料中。',
  '目前家族還沒有成員，使用「成員 ＋」新增或加入人物':'当前家族还没有成员，使用「成员 ＋」新建或加入人物',
  '圖片會保留目前的':'图片会保留当前的','卡片位置 / 關係位置 / 主題':'卡片位置 / 关系位置 / 主题',
  '匯出時可另外選擇':'导出时可另外选择','目前背景圖片 / 背景顏色 / PNG 透明背景':'当前背景图片 / 背景颜色 / PNG 透明背景',
  '匯出圖片不包含頂端導覽、家族欄、智慧輔助線或拖曳狀態':'导出图片不包含顶部导航、家族栏、智能辅助线或拖动状态',
  '頂端':'顶部','開啟相簿瀏覽器，檢視所有模擬市民的相簿圖片':'打开相册浏览器，查看所有模拟市民的相册图片'
});
Object.assign(EN, {
  '選取': 'Select',
  '拖曳': 'Pan',
  '選取工具：拖曳空白處框選人物': 'Select tool: drag empty canvas to marquee-select Sims',
  '拖曳工具：拖曳畫布進行平移': 'Pan tool: drag the canvas to move the view',
  '自動佈局時，拖曳空白處平移整個族譜畫布；滾輪以滑鼠位置為中心縮放': 'In Auto Layout, drag empty canvas to pan; use the mouse wheel to zoom around the pointer.',
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
  '背景':'Background','目前背景圖片':'Current background image','背景顏色':'Background color','透明背景（PNG）':'Transparent background (PNG)',
  '查看個人檔案':'View Profile','在族譜中定位':'Locate in Tree','移出目前家族':'Remove from Current Family',
  '卡片顯示內容':'Card content','卡片外觀':'Card appearance','檢視卡片外觀':'View card appearance','檢視模式顯示內容':'View mode content','編輯模式顯示內容':'Edit mode content','極簡':'Minimal','半透明':'Translucent','完整卡片':'Full card',
  '套用於所有檢視模式人物卡':'Applies to all View Mode cards','只套用於檢視模式人物卡':'Applies only to View Mode cards','只套用於編輯模式人物卡':'Applies only to Edit Mode cards','顯示內容套用於檢視與編輯模式；外觀只套用檢視模式':'Content applies to both View and Edit modes; appearance applies only to View Mode','重設所選位置':'Reset selected positions','移出所選人物':'Remove selected Sims','取消選取':'Clear selection',
  '確定要將所選人物移出目前家族嗎？':'Remove the selected Sims from the current family?','人物本身仍會保留在人物資料中。':'The Sims will remain in the global Sim data.',
  '目前家族還沒有成員，使用「成員 ＋」新增或加入人物':'This family has no members yet. Use “Members +” to create or add someone.',
  '圖片會保留目前的':'The image keeps the current ','卡片位置 / 關係位置 / 主題':'card positions / relationship positions / theme',
  '匯出時可另外選擇':'; for export, choose ','目前背景圖片 / 背景顏色 / PNG 透明背景':'current background image / background color / transparent PNG background',
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
      document.title = "LING'S SIMS 4 GENEALOGY";
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
    if (db && db.families && db.families.length) {
      refreshFamilyUI();
      render();
      if (searchInput && searchInput.value.trim()) renderTopbarSearchResults();
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
  if (e.key === 'Escape' && exportMask && exportMask.classList.contains('show')) closeExportPanel();
});
init();
