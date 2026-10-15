# L1nG 管理中心：GA4 正式接線與驗收

僅適用於 `main` 的 `l1ng-home` Pages 正式環境。網站分析由 `/feedback/ga4-api` (Cloudflare Pages Function) 呼叫官方 Google Analytics Data API；前端不包含服務帳戶私鑰。

## Cloudflare Pages（Production）必要環境變數

位於 **Workers & Pages → l1ng-home → Settings → Variables and secrets → Production**：

- `GA4_PROPERTY_ID`：Text，數字 GA4 Property ID（現有：`558394569`）。
- `GA4_SERVICE_ACCOUNT_JSON`：Secret，Google Cloud 服務帳戶完整 JSON，絕不提交 GitHub。
- `ACCESS_TEAM_DOMAIN`：Text，例如 `https://your-team.cloudflareaccess.com`，**須從 Cloudflare Zero Trust 查實值**。
- `ACCESS_AUD`：Text，對應 Cloudflare Access 應用程式的 **Application Audience (AUD) Tag**，不是 Policy ID。
- `ADMIN_EMAIL`：Text，允許操作管理中心的管理員 Email，多位用英文逗號分隔。

注意：所有安全驗證設定未完成時，API 一律拒絕查詢，不會以公開 Google 金鑰、隱藏前端按鈕或弱權限替代。

## Cloudflare Access 路徑保護（務必完成）

請在 Zero Trust 中，使用保護 `home.by-l1ng.com/feedback/admin.html` 的**同一個** `L1nG Dashboard` Access 應用程式及允許政策，另外納入：

- `home.by-l1ng.com/feedback/ga4-api`

請確認同一應用程式的 AUD 有效；驗證部署時的 JWT，包括簽章、簽發者、AUD、有效期、管理員 Email。端點即使未正確納入 Access，也仍會預設拒絕沒有有效 JWT 的請求，但必須設定真正的 Access 路徑保護才可公開使用。

如果你的 Access 應用程式已設定相同 JWT 的共享保護路徑，請核對實際策略；不要把 `/feedback/` 下的玩家公開 API 一起納入管理員 Access。

**請勿**在聊天室、回饋系統、GitHub 或公開 HTML 中貼出服務帳戶 JSON。變數更新後，確認 Cloudflare Pages Production 有重新部署，並檢查新部署的 Functions 路由。

## 測試

- `node --test tests/ga4_api.test.mjs`：拒絕未授權、錯誤篩選及有效 JWT 與模擬 GA4 回應。
- `node L1nG/build-pages.mjs home`：檢查首頁靜態產物與 `_routes.json`。
- 未登入／無有效 JWT：`GET https://home.by-l1ng.com/feedback/ga4-api` 必須被拒。
- 管理員登入後，網站分析選取近 7／30／90 天、自訂日期與五站篩選，確實出現 GA4 真實數據；資料為零時顯示 0 或「沒有資料」，查詢失敗時顯示明確錯誤。
- GA4 報表的下載數量來自 `l1ng_download_click` 事件。追蹤受到 Cookie 同意設定約束；歷史未追蹤事件不會回補。
- 正式站可開啟 `/feedback/admin.html`，但**不可**在未經 Access 身分驗證的情況下查詢 GA4。

## 其他系統

此 GA4 整合不會自動部署 `l1ng-feedback-api` Worker，也不會變更 D1/R2/Turnstile 的正式接線；回饋 API 是否正常須另做正式環境驗收。

## 管理頁面伺服器端保護

`/feedback/admin.html` 現在由 Pages Function 預先驗證 Access JWT，匿名請求只會收到 403 JSON，不會返回管理中心 HTML。`/feedback/ga4-api` 同樣使用 Access JWT 身分驗證。請在 Zero Trust 同時保護兩條路徑（繼續沿用既有 L1nG Dashboard 應用程式），不要把整個公開 `/feedback/` 目錄設為管理員專用。
