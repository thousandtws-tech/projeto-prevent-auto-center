ALTER TABLE auth_users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_email_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS auth_email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES auth_users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auth_email_verification_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_email_verification_tokens_user_id
    ON auth_email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_auth_email_verification_tokens_lookup
    ON auth_email_verification_tokens (token_hash, used_at);
