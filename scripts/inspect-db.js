const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

console.log('\n=============================');
console.log('      ORGANIZATIONS');
console.log('=============================');
const orgs = db.prepare('SELECT id, name, defaultLowStockThreshold, createdAt FROM Organization').all();
console.table(orgs);

console.log('\n=============================');
console.log('          USERS');
console.log('=============================');
const users = db.prepare('SELECT id, email, organizationId, createdAt FROM User').all();
console.table(users);

console.log('\n=============================');
console.log('      PRODUCTS SUMMARY');
console.log('=============================');
const products = db.prepare('SELECT id, organizationId, name, sku, quantity, sellingPrice FROM Product').all();
console.table(products);
