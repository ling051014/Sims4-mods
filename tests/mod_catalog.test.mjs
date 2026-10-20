// 驗證根目錄 JSON 是唯一的模組來源，生成卡片不遺失或重複。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ["prep-mods.html","cheat-mods.html","ui-mods.html","world-mods.html","default-mods.html","nsfw-mods.html","social-mods.html","build-buy.html","cas.html","slider.html","pose-mods.html","other.html"];
const ids = new Set();
let total = 0, fields = 0;
for (const page of pages) {
    const json = JSON.parse(await readFile(resolve(root, page.replace(/\.html$/, '.json')), 'utf8'));
    const html = await readFile(resolve(root, page), 'utf8');
    assert.equal(json.schemaVersion, 2, page);
    assert.equal(json.sourceFile, page);
    assert.equal((html.match(/class="mod-card"/g) || []).length, json.mods.length, page);
    assert.equal((html.match(/data-sort-author="/g) || []).length, json.mods.length, page);
    assert(html.includes('<!-- L1NG_MODS_START -->') && html.includes('<!-- L1NG_MODS_END -->'), page);
    assert(html.includes('id="mod-sort"') && html.includes('mod-sort.js'), page);
    assert(!html.includes('href="authors.html"'), page);
    for (const mod of json.mods) {
        assert(!ids.has(mod.id), 'Duplicate id: ' + mod.id);
        ids.add(mod.id);
        assert(html.includes('id="mod-' + mod.id + '"'));
        assert(mod.title?.length && mod.byline?.length && mod.preview?.length);
        assert(Array.isArray(mod.authors) && mod.authors.length > 0);
        assert(Array.isArray(mod.fields) && mod.fields.length > 0);
        assert(!Object.hasOwn(mod, 'template') && !Object.hasOwn(mod, 'slots'));
        total++; fields += mod.fields.length;
    }
}
assert.equal(total, 194);
assert.equal(fields, 844);
const sortJs = await readFile(resolve(root, 'mod-sort.js'), 'utf8');
assert(sortJs.includes('card.dataset.sortAuthor'));
execFileSync(process.execPath, ['build-mod-catalog.mjs', '--check'], { cwd: root, stdio: 'pipe' });
console.log('PASS: ' + total + ' structured mods / ' + fields + ' fields / 12 static category pages');
