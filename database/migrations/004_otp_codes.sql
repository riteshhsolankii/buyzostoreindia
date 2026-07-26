-- Email verification codes for customer sign-up.
-- Previously these lived in an in-memory Map, which cannot work once the app
-- runs on more than one instance: the request that sends a code and the request
-- that verifies it may land on different servers. One row per target, replaced
-- on resend, so the semantics match the old single-code-per-address behaviour.
--
-- The code itself is never stored in plain text — only a hash — so a leaked
-- database row cannot be used to complete somebody else's sign-up.
CREATE TABLE IF NOT EXISTS otp_codes (
  target TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0, 1)),
  sent_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

-- Lets the periodic cleanup delete expired rows without a full scan.
CREATE INDEX IF NOT EXISTS otp_codes_expires_at_idx ON otp_codes(expires_at);
