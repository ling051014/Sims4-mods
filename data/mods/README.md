# 模組整理 JSON 重構 / 依作者排序
以族譜重構分支為基準，只修改獨立的 `mods-catalog-json-refactor-20261020` 分支。

- `data/mods/*.json`：12 個原有分類，194 張卡片，保留原卡片 HTML 片段與排序順序。
- `templates/mod-pages/*.html`：保留各分類原始頁面骨架。
- `scripts/build-mod-catalog.mjs`：由 JSON 生成原分類靜態 HTML，加入原生「原本順序 / 作者 A–Z / 作者 Z–A」選單。
- `mod-sort.js`：僅將同一分類的既有卡片按原作者名稱重排，不建立作者索引頁、不變更分類，不複製卡片。
- `style.css`：新增最少量的排序選單樣式，完全沿用現有卡片及手機版樣式。

執行 `node scripts/build-mod-catalog.mjs` 產生靜態頁面、`node scripts/build-mod-catalog.mjs --check` 核對，`node --test tests/mod_catalog.test.mjs` 做資料完整性測試。

原本順序使用頁面 DOM 初始化的既有卡片排列；作者同名時維持原先順序。缺乏可識別作者名稱的卡片排在排序結果最後。
