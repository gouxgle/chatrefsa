const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Ciudadano', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {
      password: adminPassword
    },
    create: {
      email: 'admin@empresa.com',
      username: 'admin',
      password: adminPassword,
      fullName: 'Administrador',
      role: 'ADMIN',
      status: 'AVAILABLE',
      isVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);



  // Create system configs
  const configs = [
    { key: 'max_file_size', value: '52428800' },
    { key: 'allowed_file_types', value: 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,video/*,audio/*,application/zip' },
    { key: 'max_group_members', value: '256' },
    { key: 'message_max_length', value: '4096' },
    { key: 'require_email_verification', value: 'false' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log('✅ System configs created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
