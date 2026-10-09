// 預設 EA 肖像完整性：此測試不需要瀏覽器、網路或玩家 ZIP。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../L1nG/GenealogyExporter');
const getText = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const app = getText('genealogy_app.js');
const html = getText('genealogy.html');

function unpackSource() {
  const env = { window:{} };
  vm.runInNewContext(getText('genealogy_sample_preset.js'), env);
  vm.runInNewContext(getText('genealogy_sample_portraits.js'), env);
  for (let n = 0; n < 6; n++) {
    const name = 'genealogy_sample_portraits_v10_0' + n + '.js';
    assert.ok(html.includes(name), 'HTML 未載入 ' + name);
    vm.runInNewContext(getText(name), env);
  }
  return env.window;
}

function baselineSims(pack) {
  const rows = app.match(/  const rows = \[\n([\s\S]*?)\n  \];/);
  assert.ok(rows, '缺少內建六家庭人物清單');
  const base = vm.runInNewContext('[' + rows[1] + ']', {});
  const data = new Map(base.map(row => [String(row[0]), row[15]]));
  for (const [id, sim] of Object.entries(pack.sims)) {
    if (!data.has(id)) data.set(id, sim.gameData?.recordState);
  }
  return data;
}

function inspectPng(buffer, name, size) {
  assert.equal(buffer.subarray(0,8).toString('hex'), '89504e470d0a1a0a', name);
  assert.equal(buffer.subarray(12,16).toString('ascii'), 'IHDR', name);
  assert.equal(buffer.readUInt32BE(16), size, name + ' 寬度');
  assert.equal(buffer.readUInt32BE(20), size, name + ' 高度');
  assert.equal(buffer[24], 8, name + ' 色深');
  assert.equal(buffer[25], 6, name + ' 必須保留 RGBA');
}

test('13 家庭的 82 人與 6 隻寵物全部有原始解析度 PNG', () => {
  const { L1nGGenealogySamplePack: pack, L1nGGenealogySamplePortraits: images } = unpackSource();
  const sims = baselineSims(pack);
  assert.equal(sims.size, 82);
  const unknown = [...sims].filter(([, state]) => state === 'family_tree_only').map(([id]) => id);
  const full = [...sims].filter(([, state]) => state !== 'family_tree_only').map(([id]) => id);
  assert.equal(unknown.length, 29);
  assert.equal(full.length, 53);
  assert.equal(pack.families.length + 6, 13);

  const pets = [
    ...Object.values(pack.sims).flatMap(sim => sim.pets || []),
    ...(pack.unassignedPets || [])
  ].map(pet => String(pet.gameData?.simId || pet.id));
  assert.equal(pets.length, 6);
  const targets = new Set([...full, ...pets]);
  assert.equal(targets.size, 59);
  const embedded = [], published = [];
  for (const id of targets) {
    const name = id + '.png', key = 'assets/sample-portraits/' + name;
    let buffer;
    if (images[key]) {
      embedded.push(id);
      buffer = Buffer.from(images[key], 'base64');
    } else {
      published.push(id);
      buffer = fs.readFileSync(path.join(ROOT, key));
    }
    inspectPng(buffer, name, 512);
  }
  const unknownPng = Buffer.from(images['assets/sample-portraits/shared_unknown.png'], 'base64');
  inspectPng(unknownPng, 'shared_unknown.png', 128);
  assert.equal(embedded.length, 29);
  assert.equal(published.length, 30);
  assert.ok(!Object.keys(images).some(name => name.endsWith('.webp')), '禁止舊版 192px WebP 回退');
});

test('預設資料升級後重新保存新 PNG，正式匯入不受影響', () => {
  assert.match(app, /sampleVersion:11,/);
  assert.match(app, /samplePortraitVersion/);
  assert.match(app, /upgradedSample/);
  assert.match(app, /repairedSamplePortraits/);
  assert.match(app, /importOriginalPng/);
  assert.ok(!app.includes("path.endsWith('.webp')"), '不得再回退 WebP');
});
