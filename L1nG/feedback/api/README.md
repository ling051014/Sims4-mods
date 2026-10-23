# L1nG 問題回饋 Worker — 部署手冊

> **安全狀態：尚未正式部署與端到端驗收。** GitHub 修改不代表 Cloudflare Worker 已更新。請保持目前公開服務停用，直到完成 Access、Worker Route 與 D1/R2 實機測試。

## 已建立的 Cloudflare 資源

- Worker：`l1ng-feedback-api`；公開呼叫路徑 `https://l1ng-feedback-api.zpl74520.workers.dev/v1/feedback`。
- D1：`l1ng-feedback-db`，ID `41982056-0458-490b-b9a7-a09f929960e3`，綁定名稱 `DB`。
- R2 私有儲存空間：`l1ng-feedback-attachments`，綁定名稱 `ATTACHMENTS`。**不要啟用 R2 Public Access。**
- Turnstile Secret：`TURNSTILE_SECRET_KEY`，存在 Cloudflare Worker Secrets。**不要提交或貼出 Secret。**
- 玩家來源：`https://realdate.by-l1ng.com`、`https://genealogy-tool.by-l1ng.com`。
- Cloudflare Access：已登入的 `home.by-l1ng.com/feedback/admin.html`，應用程式 `L1nG Dashboard`；**目前還需要涵蓋管理 API 路徑。**

## 上線順序（不可跳過）

1. **先在 Zero Trust 的同一個 `L1nG Dashboard` Access 應用程式中增加第二個受保護的路徑：`home.by-l1ng.com/feedback/admin-api/*`。** 保留原 `/feedback/admin.html`，仍只允許指定電子郵件。建議同一應用程式兩個目的地，使用相同 AUD。請先確認 Cloudflare UI 支援該配置且實際規則生效，再加 Worker Route。不要保護 `/v1/feedback` 玩家公開 API。
2. 找到該 Access 應用程式的 **Application Audience (AUD) Tag**，以及 Zero Trust Team domain。它們不是 Access policy ID。Cloudflare Worker → Settings → Variables and Secrets 加：
   - `ACCESS_TEAM_DOMAIN`：`https://<你的團隊名稱>.cloudflareaccess.com`（依 Zero Trust 實際顯示確認，不能猜）。
   - `ACCESS_AUD`：前述同一個 Access 應用程式的 JWT Audience Tag。
   - `ADMIN_EMAIL`：獲授權的管理員電子郵件；多個以逗號分隔。Worker 會再次驗證電子郵件，因此 Access 允許規則和此設定必須一致。
   - `TURNSTILE_SECRET_KEY` 是既有 Secret，保留原值；不需要重新建立。
3. 確認 D1 的四張表（`feedback`、`replies`、`attachments`、`request_limits`）及索引已建立；若資料庫是空的，可在 D1 Console 執行本資料夾 `schema.sql`。已建立則不須重跑。
4. 將本目錄的 `worker.js` 作為 Cloudflare Worker 實際程式部署。若使用 Wrangler：由專案根目錄執行 `npx wrangler deploy --config L1nG/feedback/api/wrangler.jsonc`，必須先核對帳號、網域、資源綁定。部署前確認 Secret 與變數不會因設定覆蓋而遺失。**目前不會自動部署，也沒有 GitHub→Worker 的 CI 部署。**
5. 最後才到 Worker → Settings → Domains & Routes，為 `by-l1ng.com` 新增只匹配 `home.by-l1ng.com/feedback/admin-api/*` 的 Worker Route 指向 `l1ng-feedback-api`。不要將這個路由設定到整個首頁，也不要把它指到 Pages 靜態資源。先核對 Cloudflare Pages 自訂網域和 Worker Route 是否能共存。
6. 以無痕視窗測試：未登入管理 API 不可取得任何回饋；管理員登入後 API 可存取；直接請求 `workers.dev/v1/admin/*` 永遠被拒；公開玩家回饋只允許正式 RealDate 與 Genealogy 來源。
7. 執行測試：有效、失敗、過期及重複 Turnstile；提交、匿名憑證查詢、玩家回覆、後台回覆／標記／刪除；3 附件、單檔 10 MB、總計 20 MB；資料庫失敗不得假報成功。實機驗收通過後才宣告上線。

## API 與路由

- 玩家公開 API（有 Origin / Turnstile / D1 Rate Limit）：`POST /v1/feedback`、`POST /v1/feedback/lookup`、`POST /v1/feedback/reply`。只由正式兩個網站使用，不開放預覽來源。
- 後台同網域（有 Access JWT 簽章、AUD、有效期、電子郵件核對）：`/feedback/admin-api/feedback`；`/feedback/admin-api/feedback/:id`；`/feedback/admin-api/feedback/:id/replies`；`/feedback/admin-api/feedback/:id/attachments/:fileId`。
- workers.dev 的舊管理路由 `/v1/admin/*` 一律拒絕。
- D1 僅保存匿名憑證雜湊與資料，不保存明文憑證；R2 附件永不公開，管理員下載需通過 Access。瀏覽器後台不能直接存取 R2 bucket。

## 測試與原始碼管理

- `node --test L1nG/feedback/api/worker.test.mjs` 可執行離線 API 測試。
- `.github/workflows/feedback-api-branch-check.yml` 只做語法／離線測試、設定檢查；不部署 Worker。
- `L1nG/build-pages.mjs` 刻意不把 `feedback/api` 放進公開靜態網站。
- 本次設定已將經過核對的 D1 ID、R2 綁定寫入 `wrangler.jsonc`；Cloudflare 帳號 ID、Turnstile Secret、Access AUD、管理員 Email 不硬寫在 GitHub。
- GA4 網站分析不屬於此輪回饋後端，仍未接通 Dashboard。

## 2026-10-24 · 玩家 Email 驗證／回覆通知（Resend）

此段為正式 `main` 的部署說明；GitHub 程式碼提交不會修改 Cloudflare / Resend 帳戶設定，也不代表已可向玩家寄信。

### 服務分工
- 原本給管理員的新回饋與玩家追加訊息：**Cloudflare `FEEDBACK_EMAIL`**，保留既有設定。
- 玩家明確勾選後的信箱驗證／管理員回覆通知：**Resend API**。不將 API Key 放在 GitHub 或前端。
- Email 三種語言依提交時網站語言記錄，驗證連結期限 24 小時，不包含私人憑證。
- 給玩家的信件寄件地址預設 `L1nG Notifications <notify@by-l1ng.com>`；請先在 Resend 驗證 `by-l1ng.com` 且可使用該地址。

### 尚需在控制台完成
1. Resend → Domains → Add Domain → 輸入 `by-l1ng.com`，依 Resend 所提供的 **實際 DNS 紀錄** 到 Cloudflare DNS 新增並驗證。請先比較既有 MX/SPF、Email Routing，避免擅自覆蓋。也可選專用寄件子網域，但 `RESEND_FROM_EMAIL` 需對應已驗證的寄件地址。
2. Resend → API Keys → Create API Key。只使用 Sending 權限，不要將密鑰貼在對話、截圖或 GitHub。
3. Cloudflare Workers → `l1ng-feedback-api` → Settings → Variables and Secrets，新增 **Secret** `RESEND_API_KEY`；另可設定 `RESEND_FROM_EMAIL`（例如 `L1nG Notifications <notify@by-l1ng.com>`），必須與 Resend 網域及寄件地址匹配。現有 `FEEDBACK_EMAIL`、D1、R2、Turnstile 和 Access 全部保留。
4. 備份 D1 正式庫後，在核對正確資料庫下執行一次 `migrations/20261024_email_notifications.sql`（僅新增表與索引），**不要將 `schema.sql` 套到既有正式資料庫**。
5. 核對 Wrangler 帳戶／綁定／密鑰再部署正式 Worker：`npx wrangler deploy --config L1nG/feedback/api/wrangler.jsonc`。GitHub Actions 僅測試不部署。
6. 用自己的測試信箱驗證三語系、等待→成功狀態、過期/重寄、管理員回覆信、對應回饋入口、關閉通知與管理員既有通知未退化。未經實際驗收不可對外宣稱上線。

### 注意
- Resend 的 `onboarding@resend.dev` 只供首次測試，不能用來向任意玩家寄信；正式寄信前必須完成自有寄件網域驗證。
- 如果缺少 `RESEND_API_KEY` 或呼叫失敗：回饋本身與私人憑證照常保存，Email 狀態顯示未能寄送，玩家可在限制時間後嘗試重寄。
- Resend API 呼叫僅由 Worker 伺服器端發出，禁止將 Key 放入前端；任何測試都不得向真實玩家信箱寄信。
