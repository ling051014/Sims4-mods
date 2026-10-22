// 模組收藏庫：12 份 JSON 是唯一卡片資料來源；網頁僅保存頁面框架。
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slugs = ['prep-mods','cheat-mods','ui-mods','world-mods','default-mods',
    'nsfw-mods','social-mods','build-buy','cas','slider','pose-mods','other'];

test('12 category HTML pages contain only the frame and dynamic JSON mount', async () => {
    let total = 0;
    let fields = 0;
    const ids = new Set();
    for (const slug of slugs) {
        const html = await readFile(resolve(root, slug + '.html'), 'utf8');
        const json = JSON.parse(await readFile(resolve(root, slug + '.json'), 'utf8'));
        assert.equal(json.schemaVersion, 2);
        assert.equal(json.category, slug);
        assert.equal(json.sourceFile, slug + '.html');
        assert(html.includes('class="mod-container" data-catalog-category="' + slug + '"'), slug);
        assert(!html.includes('mod-card-region'), slug);
        assert(html.includes('mod-catalog.js?v=20261022-json-runtime-r1'), slug);
        assert(html.includes('id="mod-sort"') && html.includes('mod-sort.js'), slug);
        assert(html.includes('site-skeleton.js'), slug);
        if (slug !== 'nsfw-mods') assert(html.includes('data-skeleton-auto="manual"'), slug);
        assert(!html.includes('class="mod-card"'), slug + ' must not duplicate JSON cards');
        assert(!html.includes('L1NG_MODS_START') && !html.includes('L1NG_MODS_END'));
        for (const mod of json.mods) {
            assert(!ids.has(mod.id), 'Duplicate mod id ' + mod.id);
            ids.add(mod.id);
            assert(Number.isInteger(mod.order) && mod.order > 0);
            assert(mod.title?.length && mod.preview?.length && mod.byline?.length);
            assert(Array.isArray(mod.authors) && mod.authors.length);
            assert(Array.isArray(mod.fields) && mod.fields.length);
            assert(!Object.hasOwn(mod, 'template') && !Object.hasOwn(mod, 'slots'));
            total++;
            fields += mod.fields.length;
        }
    }
    assert.equal(total, 194);
    assert.equal(fields, 844);
});

test('home, categories and 18+ confirmation use the same browser-side renderer', async () => {
    const home = await readFile(resolve(root, 'index.html'), 'utf8');
    const client = await readFile(resolve(root, 'home-mod-catalog.js'), 'utf8');
    const renderer = await readFile(resolve(root, 'mod-catalog.js'), 'utf8');
    const sort = await readFile(resolve(root, 'mod-sort.js'), 'utf8');
    const nsfw = await readFile(resolve(root, 'nsfw.js'), 'utf8');
    assert(home.includes('id="home-category-grid"') && home.includes('id="home-mod-catalog"'));
    assert(home.includes('data-view="category"') && home.includes('data-view="all"'));
    assert(home.includes('mod-catalog.js?v=20261022-json-runtime-r1'));
    assert(home.includes('home-mod-catalog.js?v=20261022-json-runtime-r1'));
    assert(client.includes('catalog.loadMany(selected') && client.includes('catalog.renderCategory(category, slug, true)'));
    assert(client.includes("slug !== 'nsfw-mods'") && client.includes("ageState === 'adult'"));
    assert(client.includes('L1nGSkeleton.start') && client.includes('positionSlider()'));
    assert(renderer.includes("fetch(slug + '.json')"));
    assert(renderer.includes('L1nGModSort?.bind'));
    assert(renderer.includes('L1nGModCardUI?.initialize'));
    assert(renderer.includes("container.dataset.catalogCategory !== 'nsfw-mods'"));
    assert(nsfw.includes("mountCategory(container, 'nsfw-mods')"));
    assert(sort.includes('card.dataset.sortAuthor'));
    await assert.rejects(access(resolve(root, 'build-mod-catalog.mjs')));
    await assert.rejects(access(resolve(root, 'all-mods.fragment.html')));
});
