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

## 2026-10-24 · Email 回覆通知（僅族譜重構分支，尚未部署）

本次新增 RealDate（繁中 / EN）與族譜工具（繁中 / 簡中 / EN）的選用 Email 回覆通知。Email 內容會在玩家提交時保存語言偏好；不跟隨管理員後台語言。只有選擇「建立匿名對話」、填寫 Email 並明確勾選通知，才會建立待驗證紀錄。

流程：
1. 原有 Cloudflare Turnstile 通過後，回饋與私人憑證照常建立，後端自動嘗試寄驗證信。寄送失敗仍可用私人憑證查看對話，不得顯示「已寄送」。
2. 驗證連結有 24 小時有效期，只保存 SHA-256 token 雜湊，不含私人對話憑證；從 Email 開的新頁面只顯示驗證結果。
3. 原成功頁用私有憑證向 API 查詢狀態，返回頁面時立即查詢，等待中每 12 秒查詢，成功或停用後停止。
4. 管理員已儲存的回覆觸發一次寄信嘗試，郵件不包含私有憑證與對話全文。以 reply_id 去重，錯誤以 email_delivery.failed 紀錄，不讓寄信故障回滾已保存的站內回覆。
5. 玩家可在通知郵件中開啟關閉通知頁；必須再按一次確認才會停用，避免郵件掃描器自動請求 GET 就取消通知。

### 部署前置條件（不得直接公開啟用）

1. **先備份 D1**。正式庫原本已有資料，請在核對資料庫與環境後執行一次 `migrations/20261024_email_notifications.sql`（增量遷移）。`schema.sql` 僅用於空資料庫初始化，不是正式庫遷移腳本。
2. 本分支採 **Resend API** 作為可設定的發信介面；並不代表現有 `notify@by-l1ng.com` 收件通知服務自動具有寄信權限。需先在發信商驗證 `by-l1ng.com` 或適用的寄件網域，並確認可以向玩家的任意收件信箱寄信。
3. 在 Worker Secret 設定 `RESEND_API_KEY`；在 Worker 環境設定 `FEEDBACK_MAIL_FROM`（例如驗證後可使用的 `L1nG Notifications <notify@by-l1ng.com>`，實際值須與寄信商允許的地址一致）。不可把 API Key 加入 GitHub。
4. 保持正式 `ALLOWED_ORIGINS` 與 Turnstile 配置；部署新 Worker、啟用 D1 遷移，才能端到端驗證。單純推送 GitHub 分支不會變更 Cloudflare Worker / D1。
5. 測試繁中、簡中、英文寄信、錯誤地址、未勾選、一次性回饋、過期 / 重送、同一回覆去重、管理員通知、取消通知及跨分頁同步。避免向真實玩家信箱發測試信。

**提醒：** 分支預覽目前為靜態預覽網域，不在正式 `isLive()` 白名單；只能檢查前端樣式，不會直接送出正式回饋或郵件。這是刻意的安全限制。
