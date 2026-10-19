'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../L1nG/GenealogyExporter');
const importerSource = fs.readFileSync(path.join(root, 'genealogy_gameImport.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'genealogy_app.js'), 'utf8');
const sandbox = { window:{} };
vm.runInNewContext(importerSource, sandbox, { filename:'genealogy_gameImport.js' });
const importer = sandbox.window.L1nGGameImport;

function bundle(active = true) {
  return {
    manifest:{ format:'l1ng-genealogy', schemaVersion:1 },
    genealogy:{
      sims:{
        '101':{ name:{first:'First',last:'Sim'}, householdId:'11' },
        '102':{ name:{first:'Second',last:'Sim'}, householdId:'22' }
      },
      households:{
        '11':{ name:'Previously played', memberIds:['101'], isPlayedHousehold:true },
        '22':{ name:'Currently controlled', memberIds:['102'], isActiveHousehold:active }
      }
    }
  };
}

test('ZIP replacement selects the active EA household, not the first or merely played household', () => {
  const db = importer.convertBundle(bundle());
  assert.equal(db.families.length, 2);
  assert.equal(db.currentFamilyId, db.families[1].id);
  assert.equal(db.families[1].gameData.isActiveHousehold, true);
});

test('ZIP replacement without a known active household falls back to the first valid family', () => {
  const db = importer.convertBundle(bundle(false));
  assert.equal(db.currentFamilyId, db.families[0].id);
});

test('ZIP incremental update keeps existing selected family', () => {
  const before = importer.convertBundle(bundle(false));
  before.currentFamilyId = before.families[0].id;
  const incoming = importer.convertBundle(bundle(true));
  const merged = importer.mergeConvertedDatabase(before, incoming, {});
  assert.equal(merged.database.currentFamilyId, before.currentFamilyId);
});

test('post-import view reconciliation keeps the original source household anchor', () => {
  assert.match(appSource, /const sources = entries\.filter\(entry =>/);
  assert.match(appSource, /familyTreeLastSourceFamilyId=sourceFamilyId;/);
  assert.doesNotMatch(appSource, /if \(active\?\.familyId\) genealogyStore\.setCurrentFamilyId\(active\.familyId\);/);
});
