-- Apply once to the existing l1ng-feedback-db. Do NOT replay schema.sql on production.
CREATE TABLE IF NOT EXISTS email_notifications (
  feedback_id TEXT PRIMARY KEY REFERENCES feedback(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  language TEXT NOT NULL CHECK(language IN ('zh-Hant','zh-Hans','en')),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','verified','disabled','delivery_unavailable')),
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
