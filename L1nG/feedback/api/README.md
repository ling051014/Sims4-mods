# L1nG 匿名回饋後端（未上線）

本資料夾只實作原有 RealDate／Genealogy 問題回饋所需的後端，不更動公開網站的其他功能。

## 現有 Cloudflare 資源

- Worker: l1ng-feedback-api（目前線上仍可能是 Hello World）
- D1: l1ng-feedback-db，以 binding 名稱 DB 存取
- Secret: TURNSTILE_SECRET_KEY（已由站長設於 Worker Production；不得提交到 GitHub）
- Turnstile Site Key: 只在公開前端使用

## 上線前必要步驟

1. 唯讀核對 Cloudflare Worker、D1 與網域設定；不要直接覆寫現有 Worker。
2. 在 D1 Console 執行 schema.sql（或使用 Wrangler 執行 migration），確認有 3 個資料表。
3. Cloudflare R2 建立私有 bucket，將它綁定到 Worker，變數名稱 ATTACHMENTS。**沒有 R2 時，帶附件送出會明確失敗，絕不假稱成功。**
4. 確認部署的程式使用 worker.js，並同步設定 wrangler.jsonc 中的 D1 binding。Secret Key 仍需保留於 Worker Secrets，不寫入版本控制。
5. Cloudflare Access 建立只有站長電子郵件可登入的受保護管理應用；Worker 設定 ACCESS_TEAM_DOMAIN、ACCESS_AUD、ADMIN_EMAIL。所有 /v1/admin/* 路由會在缺少有效 JWT 時拒絕存取。Access 保護管理前台（admin.html）與 API 都是必要工作，不能只藏網址。
6. 測試正常／無效／過期／重複 Turnstile token、附件大小、私人憑證查詢、陌生人讀取、管理員存取、失敗後不回報成功、實機匿名對話。
7. 正式域名以 Cloudflare 控制台為準，這份範例使用 realdate.by-l1ng.com、genealogy.by-l1ng.com。若更換，需同時更新 Turnstile Hostnames、Worker allowlist 及網站端設定。

## API 契約

- POST /v1/feedback：multipart/form-data，source、category、target、message、followUp、version、gameVersion、contactMethod、contactValue、turnstileToken、files（0~3）。
- POST /v1/feedback/lookup：JSON {receipt}，回傳只有該對話的狀態與訊息。
- POST /v1/feedback/reply：multipart/form-data，receipt、message、turnstileToken、files；每次都需重新完成人機驗證。
- GET /v1/admin/feedback：管理員清單。
- GET/PATCH/DELETE /v1/admin/feedback/:id：詳情、狀態與刪除。
- POST /v1/admin/feedback/:id/replies：管理員回覆。
- GET /v1/admin/feedback/:id/attachments/:fileId：需管理員驗證的附件讀取。

## 安全設計

- Turnstile 必須由 Worker 伺服器端呼叫 Siteverify，並檢查成功、核發網域及來源；憑證僅單次、有效期約 5 分鐘。
- 公開 API 只允許明列的 Origin，安全性不能單靠 CORS，還有 Turnstile 和伺服器端檢查。
- 私人憑證只在建立時回傳，D1 僅保存 SHA-256，憑證遺失不可重取。
- 管理 API 驗證 Cloudflare Access JWT 的簽章、受眾、有效期及電子郵件；未設定則拒絕。
- R2 僅使用私有 bucket，不回傳公開檔案 URL。附件僅經授權管理 API 存取。
- 不能將 D1、R2、私密金鑰或 Access 管理 API 放進 GitHub Pages 前端程式。
- **目前只是版本庫中的程式碼，不代表已部署、實機驗收或可開始正式收件。**
