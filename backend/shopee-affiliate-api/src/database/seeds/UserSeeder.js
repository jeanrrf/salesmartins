const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateConnection() {
  try {
    await prisma.$connect();
    // Verify if users table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `;

    if (!tableExists[0].exists) {
      console.error('❌ Database tables not found. Please run migrations first:');
      console.log('npx prisma migrate dev --name init');
      return false;
    }

    console.log('✅ Database connection and schema verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Please check your DATABASE_URL in .env file');
    console.log('Current connection string format should be: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public');
    return false;
  }
}

async function seedUsers() {
  try {
    if (!(await validateConnection())) {
      process.exit(1);
    }

    // Create super admin user
    await prisma.user.upsert({
      where: { email: 'admin' },
      update: {},
      create: {
        email: 'admin',
        password: await bcrypt.hash('admin', 10),
        role: 'SUPER_ADMIN',
        name: 'Administrator',
        isActive: true
      },
    });

    // Create Sales Martins admin user
    await prisma.user.upsert({
      where: { email: 'salesmartins.siaw@gmail.com' },
      update: {},
      create: {
        email: 'salesmartins.siaw@gmail.com',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: 'ADMIN',
        name: 'Sales Martins',
        isActive: true
      },
    });

    // Create test Google user
    await prisma.user.upsert({
      where: { email: 'googleuser@gmail.com' },
      update: {},
      create: {
        email: 'googleuser@gmail.com',
        googleId: 'test_google_id',
        role: 'CLIENT',
        name: 'Google User',
        isActive: true
      },
    });

    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seeding
seedUsers()
  .catch((error) => {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  });
