require('dotenv').config();
const { Pool } = require('pg');

async function inspect() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('\n=============================');
    console.log('      ORGANIZATIONS');
    console.log('=============================');
    const orgs = await client.query('SELECT id, name, "defaultLowStockThreshold", "createdAt" FROM "Organization"');
    console.table(orgs.rows);

    console.log('\n=============================');
    console.log('          USERS');
    console.log('=============================');
    const users = await client.query('SELECT id, email, "organizationId", "createdAt" FROM "User"');
    console.table(users.rows);

    console.log('\n=============================');
    console.log('      PRODUCTS SUMMARY');
    console.log('=============================');
    const products = await client.query('SELECT id, "organizationId", name, sku, quantity, "sellingPrice" FROM "Product"');
    console.table(products.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch((err) => {
  console.error(err);
  process.exit(1);
});
