# 模組收藏庫 / JSON 結構

僅在 `mods-catalog-json-refactor-20261020` 分支修改。分類頁 `cas.html`、`social-mods.html` 等仍保留原網址、CSS、搜尋與卡片樣式。

## 根目錄 JSON

12 份資料依原分類命名：`cas.json`、`social-mods.json` 等。共 194 筆收藏、844 個下載與版本等詳細欄位。每筆有：

- `id`、`order`：固定識別碼、原本的卡片排序
- `title`：中英模組名稱（保留原本標題格式）
- `authors`：可供排序的作者名稱與來源連結。第一位為排序依據；`byline` 保存作者與漢化者等顯示內容
- `preview`：預覽圖片及既有互動標記
- `fields`：結構化的 `label` / `value` 列表（下載、漢化、DLC、版本、日期等，順序不變）
- `notes`：保留色彩、連結、換行、展開區域的富文字節點陣列，不是整段 HTML 字串
- `layout`：極少數特殊卡片的備註位置或預覽樣式

特殊備註仍有富文字標籤結構，並未硬猜缺少的安裝狀態、DLC 編號或漢化作者角色；不要將 `notes` 重新合併成 HTML 字串。

## 產生與驗收

直接在專案根目錄執行：

```sh
node build-mod-catalog.mjs
node build-mod-catalog.mjs --check
node --test tests/mod_catalog.test.mjs
```

產生器只更新分類 HTML 中 `<!-- L1NG_MODS_START -->` 至 `<!-- L1NG_MODS_END -->` 的卡片區，其他頁面、搜尋框、排序選單、CSS 與 JS 保留。不要直接手動編輯這段產生後的 HTML，請先更新對應的 JSON。

## 遷移原則

此輪重構已逐筆比對原分類頁的 194 張卡片：文字、連結與圖片來源無差異，且保留 CAS 中的 NC4T「抱負大修」。舊的 `data/mods/`、`templates/mod-pages/` 及 `scripts/build-mod-catalog.mjs` 是先前遷移過程的重複資料，現在已改由根目錄 JSON + 根目錄產生器取代。

## 首頁雙模式 / 分類彩色標籤

- `index.html` 保留原有 12 個分類入口、快捷鍵、密技、DLC 對照、頁腳，新增「依分類瀏覽 / 全部模組」切換。
- `all-mods.fragment.html` 是由同一個 `build-mod-catalog.mjs` 從 12 份 JSON 自動生成的卡片片段，**不是另一個網頁**，不手動編輯。
- `home-mod-catalog.js` 只在切換到全部模組時載入片段，支援全文搜尋、作者排序、點選彩色分類標籤篩選 / 再次點選取消。
- 分類標籤左上角（與編號同尺寸）、編號右上角；12 類固定低飽和顏色，只在首頁全部模組模式顯示。
- `mod-sort.js` 共用排序邏輯，分類頁既有的排序行為不變。
- 修改 JSON 後請執行 `node build-mod-catalog.mjs`，並以 `node build-mod-catalog.mjs --check` 驗證所有分類 HTML 及全模組片段與 JSON 一致。

### 18+ 模組原有年齡驗證

首頁「全部模組」保留現有 NSFW 分類的年齡提示：確認已滿 18 歲後顯示全部 194 張；未滿 18 歲則只顯示其餘 188 張，顯示提示。取消年齡提示會返回原本的分類入口，不直接呈現成人卡片。

## 產生的 HTML 排版

分類 HTML 與 `all-mods.fragment.html` 都是由根目錄 JSON 自動產生。產生器會把每張 `.mod-card` 的圖片、標題、作者、詳細資料列與備註輸出成有縮排和換行的原始碼，方便在 GitHub 檢查與比較。這些換行是原始碼排版，卡片樣式仍由既有 CSS 負責。

修改模組資訊只需更新對應 JSON，再執行 `node build-mod-catalog.mjs` 同步產生 12 個分類頁及首頁模組片段；以 `node --test tests/mod_catalog.test.mjs` 檢查產生結果及縮排。請勿將 `cas.html` 等頁面中的產生區改回手寫資料。
