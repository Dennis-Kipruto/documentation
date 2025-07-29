const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const role = process.argv[4] || 'user'
  
  if (!email || !password) {
    console.error('Please provide email and password')
    console.log('Usage: node scripts/create-user.js <email> <password> [role]')
    console.log('Example: node scripts/create-user.js admin@email.com SecurePass123 admin')
    process.exit(1)
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        password: hashedPassword,
        role 
      },
      create: {
        email,
        name: role === 'admin' ? 'Admin User' : 'User',
        password: hashedPassword,
        role
      }
    })
    
    console.log(`✅ User created/updated:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Password: ${password}`)
    console.log(`\n🔐 Login Credentials:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${password}`)
  } catch (error) {
    console.error('❌ Error creating user:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()