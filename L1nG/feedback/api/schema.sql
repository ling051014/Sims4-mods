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
