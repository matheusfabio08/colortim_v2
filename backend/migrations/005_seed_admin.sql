-- Admin user seed: password = "admin123" (bcrypt hash rounds=12)
-- IMPORTANT: Change this password immediately after first login
INSERT INTO users (id, username, password_hash, name, email, role, is_active)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4kR4eLMlei',
  'Administrador',
  'admin@colortim.com.br',
  'Admin',
  TRUE
)
ON CONFLICT (username) DO NOTHING;
