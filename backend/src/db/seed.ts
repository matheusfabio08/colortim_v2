import pool from './pool';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (username, password_hash, name, email, role)
      VALUES ('admin', $1, 'Administrador', 'admin@colortim.com', 'Admin')
      ON CONFLICT (username) DO NOTHING
    `, [passwordHash]);

    // Seed fibras
    const fibras = ['Algodão', 'Poliéster', 'Viscose', 'Elastano', 'Nylon'];
    for (const f of fibras) {
      await client.query(`INSERT INTO fibras (name) VALUES ($1) ON CONFLICT DO NOTHING`, [f]);
    }

    // Seed employees
    const employees = [
      { name: 'João Silva', sector: 'Preparação' },
      { name: 'Maria Santos', sector: 'Produção' },
      { name: 'Pedro Oliveira', sector: 'Qualidade' },
    ];
    for (const e of employees) {
      await client.query(`INSERT INTO employees (name, sector) VALUES ($1, $2)`, [e.name, e.sector]);
    }

    console.log('Seed completed!');
    console.log('Login: admin / admin123');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
