import 'dotenv/config';
import { db } from '../src/config/database';
import { hashPassword } from '../src/utils/password';

async function seed() {
  const password_hash = await hashPassword('admin123');
  await db.query(
    `INSERT INTO users (username, password_hash, name, email, role)
     VALUES ('admin', $1, 'Administrador', 'admin@colortim.com', 'Admin')
     ON CONFLICT (username) DO NOTHING`,
    [password_hash]
  );

  await db.query(`INSERT INTO fibras (name) VALUES ('Algodão'), ('Poliester'), ('Viscose'), ('Elastano'), ('Nylon') ON CONFLICT (name) DO NOTHING`);
  await db.query(`INSERT INTO regioes_entrega (name) VALUES ('Jaraguá do Sul'), ('Brusque'), ('Gaspar') ON CONFLICT (name) DO NOTHING`);
  await db.query(`INSERT INTO transportadoras (name) VALUES ('Transportadora A'), ('Transportadora B'), ('Retirada pelo cliente') ON CONFLICT (name) DO NOTHING`);

  console.log('Seeds executados com sucesso!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
