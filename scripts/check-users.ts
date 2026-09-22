import { db } from '../src/lib/prisma';

async function checkUsers() {
  console.log('🔍 Checking database users...');
  
  try {
    const adminUser = await db.getUserByEmail('habtamukifilu@gmail.com');
    const affiliate1 = await db.getUserByEmail('yordanostilahunolana@gmail.com');
    const affiliate2 = await db.getUserByEmail('wadahabtamuk@gmail.com');
    
    console.log('\n👤 Users in database:');
    console.log('Admin User:', adminUser ? `✅ ${adminUser.email} (${adminUser.role}, ${adminUser.status})` : '❌ Not found');
    console.log('Affiliate 1:', affiliate1 ? `✅ ${affiliate1.email} (${affiliate1.role}, ${affiliate1.status})` : '❌ Not found');
    console.log('Affiliate 2:', affiliate2 ? `✅ ${affiliate2.email} (${affiliate2.role}, ${affiliate2.status})` : '❌ Not found');
    
    if (!adminUser) {
      console.log('\n🌱 Users not found. Running seed...');
      await db.seedDatabase();
      console.log('✅ Database seeded!');
      
      // Check again
      const newAdmin = await db.getUserByEmail('habtamukifilu@gmail.com');
      console.log('New Admin User:', newAdmin ? `✅ ${newAdmin.email}` : '❌ Still not found');
    }
    
    console.log('\n🔑 Login credentials:');
    console.log('Email: habtamukifilu@gmail.com');
    console.log('Password: password');
    console.log('URL: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers();