# 模組整理 / JSON 動態載入架構

此方案**僅在 `mods-catalog-json-refactor-20261020` 分支使用**。模組資料集中於專案根目錄 12 份 JSON，分類 HTML 保留現有導航、搜尋、排序及其他頁面元件，但不再包含任何預先生成的 `.mod-card`。

## 檔案職責

- `cas.json`、`social-mods.json` 等 12 份 JSON：194 張卡片及 844 個詳細資訊欄位的**唯一資料來源**
- `mod-catalog.js`：瀏覽器 fetch JSON，驗證分類、建立完整卡片、保留現有富文字和連結，統一渲染及快取
- `cas.html` 等 12 個分類頁：`<div class="mod-card-region" data-catalog-category="cas"></div>` 作為卡片載入位置，不手寫模組卡片
- `home-mod-catalog.js`：首頁首次切換到全部模組時載入 12 份 JSON，含年齡確認、搜尋、分類標籤及排序
- `mod-sort.js`：資料載入完成後初始化作者排序
- `script.js`：卡片載入完成後初始化入場動畫、文字斷行、原有搜尋功能
- `site-skeleton.js` / `.css`：載入中、成功、空資料及錯誤狀態的共用骨架屏

已移除 `build-mod-catalog.mjs`、`all-mods.fragment.html`。新版本**不需執行生成指令**。修改 JSON 後，重新整理頁面即可載入最新資料（視瀏覽器快取而定）。

## 保留的功能

首頁依分類 / 全部模組雙模式、卡片右上編號與首頁左側彩色分類標籤、搜尋下拉選單、作者排序、圖片和影片預覽、NC4T 抱負大修資料、DLC 查詢、CAS / Build Buy 關鍵字表與共用骨架屏均延續既有規則。頁面上不需額外建立另一份卡片資料。

**年齡限制：** 獨立 NSFW 分類頁在使用者確認成年後才取得 `nsfw-mods.json`；首頁首次切換到全部模組會要求年齡確認，成年載入全部 194 張，未成年僅請求其餘 11 類共 188 張，取消返回分類模式。

## 驗收

```sh
node --test tests/mod_catalog.test.mjs
```

測試檢查 12 分類對應、194 筆 ID 唯一、844 個欄位、分類 HTML 未殘留完整卡片、首頁共用渲染器，以及 NSFW 載入限制。仍須實際操作桌面和手機瀏覽器，包含搜尋、排序、影片及 DLC 提示彈窗。

## 備註

JSON 的 `title` / `byline` / `preview` / `fields` / `notes` 仍包含富文字節點，主要為了完整保留原本格式；目前並未將每個版本與 DLC 資料全部拆成更精細的欄位，未經確認不可任意推測安裝狀態。
