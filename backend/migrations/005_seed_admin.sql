-- Seed do usuario Admin inicial
-- Senha padrao: Admin@2025 (bcrypt hash rounds=12)
-- TROQUE A SENHA APOS O PRIMEIRO LOGIN

INSERT INTO users (username, password_hash, name, email, role)
VALUES (
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCbmYbAAAAAAAAAAAAAAAAAA',
  'Administrador',
  'admin@colortim.com.br',
  'Admin'
) ON CONFLICT (username) DO NOTHING;

-- Regioes padrao
INSERT INTO regioes_entrega (name) VALUES ('Jaragua do Sul'),('Brusque'),('Gaspar') ON CONFLICT DO NOTHING;

-- Transportadoras padrao  
INSERT INTO transportadoras (name) VALUES ('Propria'),('Terceirizada') ON CONFLICT DO NOTHING;
