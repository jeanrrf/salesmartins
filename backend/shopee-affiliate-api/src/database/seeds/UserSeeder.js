const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUsers() {
  try {
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
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seeding
seedUsers()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
