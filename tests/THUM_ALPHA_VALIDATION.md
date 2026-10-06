# EA THUM：遊戲 ZIP avatar alpha 解碼驗收

本次只修改 `genealogy-structural-optimization-20260926`；基準 HEAD：
`0d3396d32cad9dc08a054905ce8e3fa696cb0447`。不修改 main、遊戲 Python 或 ts4script。

## Canonical owner 與資料流

```text
genealogy.html 載入 codec
  genealogy_app.persistGameImportAvatars（遊戲 ZIP 頭像的現有 owner）
    genealogy_gameImport.prepareGameAvatarAsset
      genealogy_thumDecoder（binary validation / native decode / straight RGBA PNG）
    saveImageAsset → 現有 genealogy_assets.importBlob → SHA-256 / IndexedDB
```

新增 `genealogy_thumDecoder.js` 是因為這是可獨立驗證的 EA image codec：
strict binary parser、native pixel decode 與 PNG container writer 不屬於 ZIP discovery
或 generic asset store。codec 不依賴 app、game importer、asset store、worker，因此沒有循環依賴。
`genealogy_assets.js`、`genealogy_image_worker.js` 和手動上傳 pipeline 完全未修改。

只在遊戲 ZIP **人物** JPEG avatar 呼叫。普通 JPEG 沒有 exact ALFA tag 就原 bytes 保存。
遊戲 pet、手動人物／寵物上傳、人生照片、家庭封面、JSON restore 不走此 codec。

## Detection / decode contract

- exact JPEG SOI；第一 APP0 為 16-byte JFIF；第二 APP0 marker 位於 20。
- offset 24 是 `ALFA`；offset 28 是 big-endian uint32 PNG length；offset 32 是 PNG signature。
- APP0 uint16 length 必須等於 PNG length + 10，範圍不得超出 resource。
- 驗證 PNG chunks、CRC、IHDR、IDAT、IEND，JPEG SOF/SOS/EOI 與 coding segment 範圍。
- PNG 與 JPEG header dimensions 完全一致；native decode 成功且 dimensions 再次一致。
- 目前接受 8-bit non-interlaced alpha PNG；alpha container 自身必須不透明，否則 fail closed。
- pixel allocation 有 16M 安全上限，不對 image identity／畫質做猜測。

精確移除第二 APP0 形成 **metadata-only stripped JPEG Blob**，保留後續 JPEG coding bytes。
JPEG 與 alpha PNG 都由 native `createImageBitmap` 解碼；沒有該 API 時使用 `Image` / ObjectURL。
使用 OffscreenCanvas（或 HTML canvas）1:1 讀取不透明 RGB／alpha plane，無 resize。

只修改 `A = alpha.R`；R/G/B 保持 browser decoded JPEG 值。不 invert、不 premultiply、
不 unpremultiply、不 unmatte、不做 halo filter。

### 為何最終 PNG 不使用 canvas.toBlob

真實 preflight 發現 RGBA `putImageData → canvas.toBlob` round-trip 會因 canvas 的
premultiplied backing representation 改變半透明／alpha=0 的 RGB。不能滿足逐 channel golden。

因此 final straight-RGBA rows 使用 PNG filter 0，加 IHDR（8-bit / color type 6）、IDAT、IEND
及 CRC。DEFLATE 全由 **瀏覽器原生 CompressionStream** 執行。不是手寫 JPEG/PNG decoder、
不是自行實作 DEFLATE，也不是重新 encode JPEG。缺少 CompressionStream 時不改用有損路徑，
該頭像 fail closed。此處 PNG 壓縮為 lossless，不改任何原 dimensions 或 RGB。

## Failure / storage / async

已知 ALFA 格式若驗證／native decode／PNG encode 失敗，採 **B：略過該頭像**。
console warning 保留 Sim ID、avatar path、stage、reason、Error；摘要記錄 decodeFailed，
匯入完成對話框亦提示 skipped count。其他人物、關係、家庭及寵物照常匯入。
未知 programmer exception 不吞掉。沒有 ALFA exact tag 的一般圖片仍原流程。

最終 IndexedDB 只保存 decoded `image/png`；原 THUM 只在當次 ZIP/import memory，
不新增 dual storage／base64／另一套 DB。`gameData.portrait.source` 與原 path 不改，
人物 avatar 指向既有 `asset_<SHA256>` ID。

匯入依序 await native decode、native stream encode、asset persistence，再宣告成功。
不建立批次巨大 intermediate pixel buffer；每張 finally close bitmap、revoke temporary URL、
reset canvas。既有 asset store 的顯示 URL 由原 cache/dispose lifecycle 管理。

## 執行測試

無外部 dependency 的 binary / scope tests：

```text
node --test tests/thum_decoder.test.cjs
```

真正 browser 測試需開發環境可載入 Playwright 與本機 Chrome（不打包進網站）：

```text
node tests/thum_browser.cjs
node tests/thum_browser.cjs --zip <Runtime6 ZIP> --reference-exe <ThumReferenceHarness.exe> --report-dir <local-private-report-directory>
node tests/thum_browser.cjs --browser <Edge executable> --zip <Runtime6 ZIP> --reference-exe <ThumReferenceHarness.exe> --report-dir <local-private-report-directory>
```

所有 real samples / reference PNG / screenshots / report 在 checkout **外**。
不提交玩家 cache、姓名、Sim IDs 或人物圖片。repo 只有 tiny synthetic 4×4 fixture。

### 2026-10-06 實際結果

- binary / scope：16 / 16 PASS；JavaScript syntax 與 diff whitespace checks PASS。
- Chrome 154.0.8037.95：20 / 20 browser checks PASS。
- Edge 154.0.4258.53：同一套 20 / 20 browser checks PASS。
- 真實 `L1nG_Genealogy_CacheTest_00001127_20261006_061849.zip` canonical UI 匯入完成。
- 22 / 22 THUM → PNG；0 decode failure；MIME image/png；PNG color type 6。
- 尺寸：48×48 17 張、70×70 1 張、128×128 3 張、256×256 1 張。
- **全部 22 張** final PNG 解壓後與真正 s4pe reference RGBA 相同：changedPixels=0，R/G/B/A max difference=0。
- tiny fixture alpha 0 / 64 / 128 / 255 保留，包含透明像素的 RGB 也完全相同。
- 696 人物、53 寵物、296 家族；non-avatar converted payload 完全一致；source/path provenance 保留。
- native Image/ObjectURL fallback 同樣 golden-equivalent；缺 CompressionStream fail closed。
- 手動 Human/Pet avatar 仍 ordinary JPEG pipeline，不讀取 ALFA。
- canonical JSON asset backup/restore 到空 IndexedDB byte-exact；SHA-256 dedupe 正常。
- F5 full genealogy snapshot、22 references 與 PNG Blob persistence 正常。
- malformed THUM 只跳過一張 image，不取消 genealogy；沒有 unhandled page exceptions。
- Chrome real conversion 134 bitmaps created / 134 closed；asset display URLs 22 → dispose 後 0。
- 256px raw/decoded/reference 已以 checkerboard、white、dark 拍攝本地比較截圖。

這不是全網站所有互動的完整人工 regression，也不是永久記憶體 profiler 證明。
拖曳、undo、關係線、手機版等未改 source，但仍應由分支預覽作最終人工驗收。
未驗證其他 browser engine 對 JPEG pixel rounding 的一致性，不宣稱跨所有 engine pixel-equivalent。

## 本機開發預覽 / 人工比較

```text
node tests/thum_browser.cjs --serve --port 8787
```

- 網站：http://127.0.0.1:8787/L1nG/GenealogyExporter/genealogy.html
- 比較頁：http://127.0.0.1:8787/tests/thum-browser.html

比較頁不在玩家 UI。可載入 tiny fixture，或選本地 raw THUM/JPG 加 s4pe reference PNG，
切棋盤／白底／深色底並下載 final PNG；不上传、不寫 IndexedDB。
網站頁匯入上述 ZIP，檢查 22 人配對、透明輪廓，再 F5。

## Format reference / license

參考格式來源：[s4ptacle/Sims4Tools](https://github.com/s4ptacle/Sims4Tools/tree/b5db166dd4b935abc9f47c4c998fce98c61bd4de)，
GPLv3-or-later。`s4pi Wrappers/ImageResource/ThumbnailResource.cs` 的
`TransformToPNG / UpdateAlpha / ToImageStream` 作 pixel golden reference。
本 JS 為依已證實 binary contract 的獨立實作，沒有 port substantial GPL source。
fixture metadata 保存 reference commit／source hash；fixture 是研究用 synthetic，不是玩家 resource。
