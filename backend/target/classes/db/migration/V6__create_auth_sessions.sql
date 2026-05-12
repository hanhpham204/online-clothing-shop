CREATE TABLE auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(128) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    browser VARCHAR(120),
    os VARCHAR(120),
    ip_address VARCHAR(64),
    approximate_location VARCHAR(255),
    user_agent VARCHAR(1024),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_auth_sessions_user_active
    ON auth_sessions(user_id, revoked, expires_at);

CREATE INDEX idx_auth_sessions_last_active
    ON auth_sessions(user_id, last_active_at DESC);
