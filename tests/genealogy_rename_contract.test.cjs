'use strict';
// 與原版重複識別名稱的重構契約；只檢查現行 UI，不碰保存 schema。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../L1nG/GenealogyExporter');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('genealogy.html');
const css = read('genealogy.css');
const js = ['genealogy_app.js', 'genealogy_personEditor.js', 'genealogy_scene.js',
  'genealogy_ui.js', 'genealogy_colorPicker.js'].map(read).join('\n');
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);

const renamedIds = [
  ['modalTitle', 'simEditorTitle'],
  ['avatarInput', 'simAvatarFileInput'],
  ['avatarPreview', 'simAvatarPreview'],
  ['avatarClearBtn', 'simAvatarRemoveButton'],
  ['avatarQualityHint', 'simAvatarFormatHint'],
  ['causeOfDeathLabel', 'simCauseOfDeathField'],
  ['petModalTitle', 'petEditorTitle'],
  ['petAvatarInput', 'petAvatarFileInput'],
  ['petAvatarClearBtn', 'petAvatarRemoveButton'],
  ['petAvatarQualityHint', 'petAvatarFormatHint'],
  ['petSection', 'simEditorPetsSection'],
  ['petList', 'simEditorPetList'],
  ['photoModalTitle', 'simPhotoEditorTitle'],
  ['photoInput', 'simPhotoFileInput'],
  ['photoPreview', 'simPhotoEditorPreview'],
  ['photoClearBtn', 'simPhotoRemoveImageButton'],
  ['photoSizeTip', 'simPhotoFileInfo'],
  ['photoTitlePresets', 'simPhotoTitleSuggestions'],
  ['lifePhotoTitleInput', 'simPhotoTitleInput'],
  ['lifePhotoLifeStageSelect', 'simPhotoLifeStageSelect'],
  ['lifePhotoNoteTextarea', 'simPhotoNoteTextarea'],
  ['lifePhotoEditorDeleteButton', 'simPhotoEditorDeleteButton'],
  ['lifePhotoEditorCancelButton', 'simPhotoEditorCancelButton'],
  ['lifePhotoEditorSaveButton', 'simPhotoEditorSaveButton'],
  ['addBtn', 'addNewSimButton'],
  ['addMemberBtn', 'addExistingSimToFamilyButton'],
  ['removeMemberBtn', 'removeFamilyMembersButton'],
  ['newFamilyBtn', 'createFamilyButton'],
  ['delFamilyBtn', 'deleteFamilyButton'],
  ['familyName', 'familyNameInput'],
  ['layoutToggle', 'autoLayoutToggleButton'],
  ['lockToggle', 'canvasLockToggleButton'],
  ['labelToggle', 'relationshipLabelsVisibilityToggle'],
  ['labelLockToggle', 'relationshipLabelsLockToggle'],
  ['resetLayoutBtn', 'resetCanvasLayoutButton'],
  ['menuToggle', 'familySidebarToggleButton'],
  ['sidebar', 'familySidebar'],
  ['sidebarBackdrop', 'familySidebarBackdrop'],
  ['customColor1', 'customThemePrimaryColorInput'],
  ['customColor2', 'customThemeSecondaryColorInput'],
  ['applyCustomBtn', 'applyCustomThemeColorsButton'],
  ['importInput', 'jsonBackupFileInput'],
  ['cleanupBtn', 'cleanupUnusedImagesButton']
];
const functions = [
  ['buildSample', 'buildDefaultGenealogyData'],
  ['genderClass', 'getSimGenderClass'],
  ['statusClass', 'getSimStatusClass'],
  ['buildRelationEntries', 'buildRelationshipListEntries'],
  ['renderRelAnno', 'renderRelationshipAnnotations'],
  ['makeLabelSVG', 'buildRelationshipLabelSvgMarkup'],
  ['_flushSave', 'flushPendingGenealogySave'],
  ['getRelInfoByKey', 'getRelationshipInfoByKey']
];
const renamedClasses = [
  ['gv-counter', 'photo-viewer-counter'],
  ['gv-note', 'photo-viewer-note'],
  ['gv-title', 'photo-viewer-title'],
  ['pet-add-btn', 'pet-list-add-button'],
  ['pet-item', 'pet-list-item'],
  ['pet-item-actions', 'pet-list-item-actions'],
  ['pet-item-avatar', 'pet-list-item-avatar'],
  ['pet-item-info', 'pet-list-item-details'],
  ['pet-item-name', 'pet-list-item-name']
];

test('原版重複的 HTML ID 已全部改名，且不存在重複 ID', () => {
  const actual = new Set(ids);
  assert.equal(ids.length, actual.size, 'HTML ID 不能重複');
  for (const [oldId, newId] of renamedIds) {
    assert.ok(actual.has(newId), '缺少新 ID: ' + newId);
    assert.ok(!actual.has(oldId), '舊 ID 不應保留: ' + oldId);
  }
});

test('HTML 表單及 ARIA 對已更名欄位的引用有效', () => {
  const actual = new Set(ids);
  const renamed = new Set(renamedIds.map(pair => pair[1]));
  const attr = /\b(?:for|aria-controls|aria-labelledby|data-color-for|data-ui-suggestion-list|data-nav-select-for)=["']([^"']+)["']/g;
  for (const match of html.matchAll(attr)) {
    for (const id of match[1].split(/\s+/)) {
      if (renamed.has(id)) assert.ok(actual.has(id), '表單 / ARIA 引用未找到: ' + id);
    }
  }
});

test('JS 函式新名稱有宣告且舊名稱未在受影響程式沿用', () => {
  for (const [oldName, newName] of functions) {
    assert.match(js, new RegExp('\\bfunction\\s+' + newName + '\\s*\\('), newName);
    assert.doesNotMatch(js, new RegExp('(?<![\\w$-])' + oldName + '(?![\\w$-])'), oldName);
  }
  assert.match(js, /getRelationshipInfoByKey/);
  assert.match(js, /getSimGenderClass/);
});

test('圖片檢視器和寵物卡片使用同一組更新後的 CSS 類別', () => {
  for (const [oldName, newName] of renamedClasses) {
    assert.ok(css.includes('.' + newName), 'CSS 缺少: ' + newName);
    assert.ok(!new RegExp('\\.' + oldName + '(?![\\w-])').test(css), 'CSS 殘留: ' + oldName);
  }
  for (const name of ['pet-list-item', 'pet-list-item-avatar', 'pet-list-item-details']) {
    assert.ok(js.includes(name), 'JS 標記缺少: ' + name);
  }
});

test('照片 UI 暫用 simPhoto 命名，保存資料欄位不進行遷移', () => {
  assert.ok(html.includes('id="simPhotoEditorTitle"'));
  assert.match(js, /\blifePhotos\b/);
  assert.ok(!html.includes('id="lifePhotoTitleInput"'));
});
