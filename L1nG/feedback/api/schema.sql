-- L1nG 匿名回饋資料結構。由 D1 Console 或 Wrangler 執行一次。
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('RealDate','Genealogy')),
  category TEXT NOT NULL CHECK (category IN ('bug','feature','other')),
  target TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  follow_up TEXT NOT NULL CHECK (follow_up IN ('once','conversation')),
  receipt_hash TEXT,
  contact_method TEXT,
  contact_value TEXT,
  version TEXT,
  game_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','progress','done','spam')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK(author IN ('player','admin')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  reply_id TEXT REFERENCES replies(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_created_idx ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS replies_feedback_idx ON replies(feedback_id,created_at);
CREATE INDEX IF NOT EXISTS attachments_feedback_idx ON attachments(feedback_id);

-- 頻率限制：雜湊後的來源識別與每小時用量，不保存原始 IP。
CREATE TABLE IF NOT EXISTS request_limits (
  bucket TEXT PRIMARY KEY,
  used INTEGER NOT NULL CHECK(used >= 0),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS request_limits_expiry_idx ON request_limits(expires_at);

-- 已驗證且主動同意的匿名回覆 Email 通知；與既有回饋資料分開管理。
CREATE TABLE IF NOT EXISTS email_notifications (
  feedback_id TEXT PRIMARY KEY REFERENCES feedback(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  language TEXT NOT NULL CHECK(language IN ('zh-Hant','zh-Hans','en')),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','verified','disabled')),
  verify_hash TEXT UNIQUE,
  verify_expires_at TEXT,
  verified_at TEXT,
  last_verification_sent_at TEXT,
  unsubscribe_hash TEXT UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS email_notifications_verify_idx ON email_notifications(verify_hash);
CREATE TABLE IF NOT EXISTS email_delivery (
  reply_id TEXT PRIMARY KEY REFERENCES replies(id) ON DELETE CASCADE,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('sent','failed')),
  updated_at TEXT NOT NULL
);
