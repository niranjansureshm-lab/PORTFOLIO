-- =========================================================
-- Portfolio schema (idempotent: safe to run many times)
-- =========================================================

CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(30) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id       INT NOT NULL REFERENCES roles(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(80) UNIQUE NOT NULL,
  name        VARCHAR(160) NOT NULL,
  category    VARCHAR(80) NOT NULL DEFAULT '',
  filter_tags TEXT[] NOT NULL DEFAULT '{}',
  icon        VARCHAR(40) NOT NULL DEFAULT 'FolderCode',
  description TEXT NOT NULL DEFAULT '',
  tech        TEXT[] NOT NULL DEFAULT '{}',
  github_url  TEXT,
  live_url    TEXT,
  detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order  INT NOT NULL DEFAULT 0,
  published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id            SERIAL PRIMARY KEY,
  category      VARCHAR(60) NOT NULL,
  category_icon VARCHAR(40) NOT NULL DEFAULT 'Code2',
  name          VARCHAR(80) NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  level         INT NOT NULL DEFAULT 50 CHECK (level BETWEEN 0 AND 100),
  sort_order    INT NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, name)
);

CREATE TABLE IF NOT EXISTS experiences (
  id          SERIAL PRIMARY KEY,
  role        VARCHAR(160) NOT NULL,
  company     VARCHAR(160) NOT NULL,
  duration    VARCHAR(80) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  highlights  JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order  INT NOT NULL DEFAULT 0,
  published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certifications (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  provider   VARCHAR(120) NOT NULL DEFAULT '',
  year       VARCHAR(10) NOT NULL DEFAULT '',
  icon       VARCHAR(40) NOT NULL DEFAULT 'Award',
  sort_order INT NOT NULL DEFAULT 0,
  published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(160) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_messages_read  ON messages(is_read, created_at DESC);
