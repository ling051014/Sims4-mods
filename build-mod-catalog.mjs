// L1nG 模組收藏庫：JSON 是卡片資料來源，分類 HTML 保留現有頁面骨架。
// 用法：node build-mod-catalog.mjs ; node build-mod-catalog.mjs --check
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const pages = ["prep-mods.html","cheat-mods.html","ui-mods.html","world-mods.html","default-mods.html","nsfw-mods.html","social-mods.html","build-buy.html","cas.html","slider.html","pose-mods.html","other.html"];
const START = '<!-- L1NG_MODS_START -->';
const END = '<!-- L1NG_MODS_END -->';

const attr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const tags = new Set(['a','b','br','button','details','div','em','i','del','img','input','label','p','small','span','strong','summary','svg','path','video','source','wbr','hr','code','kbd','ul','li','ol']);
function rich(nodes) {
    if (!Array.isArray(nodes)) throw new Error('Rich text must be an array');
    return nodes.map(node => {
        if (typeof node === 'string') return node;
        if (!node || typeof node !== 'object') throw new Error('Invalid rich-text node');
        if (Object.hasOwn(node, 'comment')) return '<!--' + node.comment + '-->';
        if (Object.hasOwn(node, 'close')) return '</' + node.close + '>';
        if (typeof node.tag !== 'string' || !tags.has(node.tag)) throw new Error('Unexpected rich-text element: ' + node.tag);
        const attrs = Object.entries(node.attrs || {}).map(([key, value]) => value === null ? ' ' + key : ' ' + key + '="' + value + '"').join('');
        return '<' + node.tag + attrs + '>' +
            (node.children ? rich(node.children) + (node.unclosed ? '' : '</' + node.tag + '>') : '');
    }).join('');
}
function renderCard(mod, category = '') {
    const layout = mod.layout || {};
    const noteTag = layout.notesTag || 'div';
    if (!['p', 'div'].includes(noteTag)) throw new Error('Invalid notes layout');
    const notes = mod.notes
        ? '<' + noteTag + ' class="tips">' + rich(mod.notes) + '</' + noteTag + '>'
        : '';
    const previewStyle = layout.previewStyle ? ' style="' + attr(layout.previewStyle) + '"' : '';
    const author = attr(mod.authors?.[0]?.name || '');

    // 每張卡片輸出可閱讀的縮排、換行；原富文字內容保持不變。
    const rows = [
        '<div class="mod-card" id="mod-' + mod.id + '" data-sort-author="' + author + '"' +
            (category ? ' data-category="' + category + '"' : '') + '>'
    ];
    if (category) {
        rows.push('    <button type="button" class="mod-category-label" aria-pressed="false" aria-label="篩選 ' +
            category + ' 分類">' + category + '</button>');
    }
    rows.push(
        '    <div class="preview-img"' + previewStyle + '>',
        '        ' + rich(mod.preview),
        '    </div>',
        '    <div class="content">',
        '        <h2 class="mod-header">' + rich(mod.title) + '</h2>',
        '        <div class="author">' + rich(mod.byline) + '</div>',
        '        <div class="details">'
    );
    for (const field of mod.fields) {
        rows.push('            <div class="info-row"><strong>' +
            field.label + '</strong>' + rich(field.value) + '</div>');
    }
    rows.push('        </div>');
    if (!layout.notesOutside && notes) rows.push('        ' + notes);
    rows.push('    </div>');
    if (layout.notesOutside && notes) rows.push('    ' + notes);
    rows.push('</div>');
    return rows.join('\n');
}
export function generateCategory(source, data) {
    if (data.schemaVersion !== 2 || !Array.isArray(data.mods)) throw new Error('Unsupported JSON schema');
    const start = source.indexOf(START), end = source.indexOf(END);
    if (start < 0 || end < start || source.indexOf(START, start + START.length) >= 0 ||
        source.indexOf(END, end + END.length) >= 0) throw new Error('Missing or duplicated card region');
    const seen = new Set(), orders = new Set();
    const mods = [...data.mods].sort((a, b) => a.order - b.order);
    for (const mod of mods) {
        if (!/^[a-z0-9-]+$/.test(mod.id) || seen.has(mod.id)) throw new Error('Invalid/duplicate ID ' + mod.id);
        if (!Number.isInteger(mod.order) || orders.has(mod.order)) throw new Error('Invalid/duplicate order ' + mod.id);
        if (!Array.isArray(mod.title) || !Array.isArray(mod.byline) || !Array.isArray(mod.preview) ||
            !Array.isArray(mod.fields)) throw new Error('Invalid mod record ' + mod.id);
        seen.add(mod.id); orders.add(mod.order);
    }
    const output = START + '\n' + mods.map(renderCard).join('\n') + '\n' + END;
    return source.slice(0, start) + output + source.slice(end + END.length);
}

let count = 0;
const allMods = [];
for (const page of pages) {
    const filename = page.replace(/\.html$/, '.json');
    const data = JSON.parse(await readFile(resolve(root, filename), 'utf8'));
    if (data.sourceFile !== page) throw new Error('Wrong sourceFile in ' + filename);
    const path = resolve(root, page);
    const before = await readFile(path, 'utf8');
    const after = generateCategory(before, data);
    if (process.argv.includes('--check')) {
        if (before !== after) throw new Error('Outdated generated HTML: ' + page);
    } else if (before !== after) {
        await writeFile(path, after, 'utf8');
    }
    const category = page.replace(/\.html$/, '').replace(/-mods$/, '').replace(/-/g, '').toUpperCase();
    for (const mod of [...data.mods].sort((a, b) => a.order - b.order)) allMods.push(renderCard(mod, category));
    count += data.mods.length;
}
// 全模組為生成的 HTML 片段（不是第二個頁面，也不維護第二份資料）。
const fragmentPath = resolve(root, 'all-mods.fragment.html');
const fullFragment = '<!-- 由 build-mod-catalog.mjs 從 12 個 JSON 產生，不要直接修改 -->\n' +
    allMods.join('\n') + '\n';
if (process.argv.includes('--check')) {
    if (await readFile(fragmentPath, 'utf8') !== fullFragment) throw new Error('Outdated all-mods.fragment.html');
} else {
    await writeFile(fragmentPath, fullFragment, 'utf8');
}
console.log((process.argv.includes('--check') ? 'Verified ' : 'Generated ') +
    count + ' mods / ' + pages.length + ' categories');
