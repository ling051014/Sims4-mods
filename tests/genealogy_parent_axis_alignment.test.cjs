// 父母置中驗收：不載入瀏覽器，不變更玩家自由排列或預設人物資料。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scene = fs.readFileSync(
  path.join(__dirname, '../L1nG/GenealogyExporter/genealogy_scene.js'),
  'utf8'
);
const start = scene.indexOf('function translateFamilyDescendants(');
const end = scene.indexOf('function solveAutomaticGenealogyPositions(', start);
assert.ok(start >= 0 && end > start, '自動排列必須保留父母／子女錨點校正');
assert.match(
  scene.slice(end, scene.indexOf('function petCardFieldRows(', end)),
  /alignFamilyBranchParentAxes\(\s*layers,\s*model,\s*connectorGroups,\s*ownership\s*\)/,
  '真正的自動排列流程必須呼叫置中校正'
);

function makeUnit(id, x, width, generation, anchors) {
  return { id, x, width, generation, anchors };
}

function createFixture(units, groups) {
  const layers = new Map();
  const unitBySim = new Map();
  for (const unit of units) {
    if (!layers.has(unit.generation)) layers.set(unit.generation, []);
    layers.get(unit.generation).push(unit);
    for (const id of Object.keys(unit.anchors)) unitBySim.set(id, unit);
  }

  const model = { unitBySim };
  const anchor = id => {
    const unit = unitBySim.get(id);
    return unit ? unit.x + unit.anchors[id] : null;
  };
  const scope = {
    resolveLayoutGaps:() => ({ SIBLING:30 }),
    genealogyGroupParentEntries:(group, currentModel) => group.parentIds
      .map(id => currentModel.unitBySim.get(id))
      .filter(Boolean)
      .map(unit => ({ unit })),
    genealogyChildAnchorX:(id) => anchor(id),
    genealogyGroupSourceX:(group) => {
      const points = group.parentIds.map(anchor).filter(Number.isFinite);
      return points.length
        ? (Math.min(...points) + Math.max(...points)) / 2
        : null;
    }
  };
  const code = scene.slice(start, end) + '\nalignFamilyBranchParentAxes;';
  const align = vm.runInNewContext(code, scope);
  return { layers, model, groups, align, anchor };
}

function nearly(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.001, actual + ' !== ' + expected);
}

test('阿布蘭特斯：不計配偶區塊寬度，母親置中於兩名子女', () => {
  const mother = makeUnit('mother-unit', 255, 106, 0, { mother:53 });
  const couple = makeUnit('couple-unit', 0, 470, 1, { spouse:53, son:418 });
  const daughter = makeUnit('daughter-unit', 500, 106, 1, { daughter:53 });
  const fixture = createFixture(
    [mother, couple, daughter],
    [{ parentIds:['mother'], children:['son', 'daughter'] }]
  );
  fixture.align(fixture.layers, fixture.model, fixture.groups);
  nearly(fixture.anchor('mother'), (fixture.anchor('son') + fixture.anchor('daughter')) / 2);
  nearly(couple.x, 0);
  nearly(daughter.x, 500);
});

test('水平配偶雙親：以兩位父母的連接點為中心', () => {
  const parents = makeUnit('parents-unit', 0, 220, 0, { father:53, mother:167 });
  const child = makeUnit('child-unit', 300, 106, 1, { child:53 });
  const fixture = createFixture(
    [parents, child],
    [{ parentIds:['father', 'mother'], children:['child'] }]
  );
  fixture.align(fixture.layers, fixture.model, fixture.groups);
  nearly((fixture.anchor('father') + fixture.anchor('mother')) / 2, fixture.anchor('child'));
});

test('同代有其他家庭時：向中心靠攏但不能與旁邊卡片碰撞', () => {
  const parent = makeUnit('parent-unit', 255, 106, 0, { parent:53 });
  const neighbor = makeUnit('neighbor-unit', 380, 106, 0, { neighbor:53 });
  const couple = makeUnit('couple-unit', 0, 470, 1, { spouse:53, son:418 });
  const daughter = makeUnit('daughter-unit', 500, 106, 1, { daughter:53 });
  const fixture = createFixture(
    [parent, neighbor, couple, daughter],
    [{ parentIds:['parent'], children:['son', 'daughter'] }]
  );
  fixture.align(fixture.layers, fixture.model, fixture.groups);
  nearly(parent.x, 244);
  assert.ok(parent.x + parent.width + 30 <= neighbor.x);
});

test('三代家系：先校正子代，再用更新後的位置校正祖先', () => {
  const grandparent = makeUnit('g', 0, 106, 0, { gp:53 });
  const parent = makeUnit('p', 200, 106, 1, { parent:53 });
  const child = makeUnit('c', 500, 106, 2, { child:53 });
  const fixture = createFixture(
    [grandparent, parent, child],
    [
      { parentIds:['gp'], children:['parent'] },
      { parentIds:['parent'], children:['child'] }
    ]
  );
  fixture.align(fixture.layers, fixture.model, fixture.groups);
  nearly(grandparent.x, 500);
  nearly(parent.x, 500);
});

test('無親子關係的卡片不更動', () => {
  const first = makeUnit('a', 0, 106, 0, { a:53 });
  const second = makeUnit('b', 200, 106, 0, { b:53 });
  const fixture = createFixture([first, second], []);
  fixture.align(fixture.layers, fixture.model, fixture.groups);
  nearly(first.x, 0);
  nearly(second.x, 200);
});
