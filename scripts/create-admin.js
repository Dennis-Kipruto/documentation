const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2]
  
  if (!email) {
    console.error('Please provide an email address')
    console.log('Usage: node scripts/create-admin.js <email>')
    process.exit(1)
  }
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'admin' },
      create: {
        email,
        name: 'Admin User',
        role: 'admin'
      }
    })
    
    console.log(`Admin user created/updated: ${user.email}`)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()