L1nG / Genealogy 整合說明

檔案：
- genealogy.html
- genealogy.css
- genealogy.js

建議放置位置：
Sims4-mods/
├─ html icons/
│  └─ （共用 SVG 圖示）
└─ L1nG/
   ├─ genealogy.html
   ├─ genealogy.css
   └─ genealogy.js

SVG 路徑已設定為：../html icons/*.svg
因此這三個檔案直接放進根目錄下的 L1nG 資料夾即可。

本輪調整：
- 移除族譜專用版本紀錄 / Changelog 介面與程式。
- 檔名移除 l1ng- 前綴。
- HTML 重新整理為四空白縮排與清楚區塊註解。
- CSS 改為與現有 Sims4-mods/style.css 相同的逐項 /* 中文註解 */ 風格。
- SVG 改用專案根目錄共用的 html icons 資料夾。
- 不包含先前討論中的側欄拖曳寬度與 Smart Guides；這兩項保留給下一輪互動功能實作。
