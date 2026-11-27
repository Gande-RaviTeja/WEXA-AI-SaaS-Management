require('dotenv').config();
const { execSync } = require('child_process');

if (!process.env.TEST_DATABASE_URL) {
  console.error('❌ Error: TEST_DATABASE_URL is not set in .env');
  console.error('Please add TEST_DATABASE_URL="postgresql://..." to your .env file.');
  process.exit(1);
}

console.log('🚀 Applying migrations to TEST branch database...');
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_TARGET_ENV: 'test',
    },
  });
  console.log('✅ Migrations successfully applied to TEST branch.');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
