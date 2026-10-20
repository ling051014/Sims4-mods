# 模組整理 JSON 重構（第一階段）

基準分支：`genealogy-structural-optimization-20260926`；重構分支：`mods-catalog-json-refactor-20261020`。

## 資料與生成
- `data/mods/*.json`：194 張模組卡片、12 個分類。每筆包含固定 ID、原有排列位置與明確的內容欄位（圖片、標題、作者、詳細資訊、備註）。
- `templates/mod-pages/*.html`：只移除原本的卡片內容、改成卡片插入標記，保留原有頁面導覽與各頁特殊元件。
- `scripts/build-mod-catalog.mjs`：使用 Node.js 標準函式庫從 JSON 產生既有分類 HTML 和作者索引 `authors.html`。頁面不用在執行階段下載 JSON。
- `authors.html`：沿用 `style.css` 和 `script.js`，可由分類頁頂部「作者」進入；每個模組連回原分類卡片定位。

## 指令
`node scripts/build-mod-catalog.mjs`：重新輸出 HTML。
`node scripts/build-mod-catalog.mjs --check`：核對已提交 HTML 是否與 JSON 一致。
`node --test tests/mod_catalog.test.mjs`：檢查卡片數、ID 與索引。

## 不改視覺的遷移
全部 194 張卡片均已先逐字還原驗證。生成後原分類頁只新增卡片錨點 ID 與一個原生導覽連結，保留 CSS、複雜版型、漢化連結、多行內容及 `★` / `⤷` 標記。CAS 的「抱負大修」仍在 CAS。

目前以具名內容插槽保留富文字 HTML，不是把原本的複雜說明強行拆掉。後續才能逐個把詳細欄位、DLC、版本與安裝狀態轉換成更嚴格的結構化資料，且每輪需通過前後比較驗收。不要再直接手改生成後的分類頁，以免和 JSON 不同步。

