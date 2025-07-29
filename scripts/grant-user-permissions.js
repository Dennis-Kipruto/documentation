const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function grantUserPermissions() {
  const email = process.argv[2]
  const versionName = process.argv[3]
  
  if (!email) {
    console.error('Please provide user email')
    console.log('Usage: node scripts/grant-user-permissions.js <email> [version]')
    console.log('Example: node scripts/grant-user-permissions.js user@example.com v1.0')
    console.log('Example: node scripts/grant-user-permissions.js user@example.com (grants access to all versions)')
    process.exit(1)
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }
    
    if (versionName) {
      // Grant access to specific version
      const version = await prisma.version.findUnique({
        where: { name: versionName }
      })
      
      if (!version) {
        console.error(`❌ Version not found: ${versionName}`)
        process.exit(1)
      }
      
      await prisma.versionPermission.upsert({
        where: {
          versionId_userId: {
            versionId: version.id,
            userId: user.id
          }
        },
        update: {},
        create: {
          versionId: version.id,
          userId: user.id,
          permission: 'read'
        }
      })
      
      console.log(`✅ Granted access to ${user.email} for version ${versionName}`)
    } else {
      // Grant access to all versions
      const versions = await prisma.version.findMany({
        where: { isActive: true }
      })
      
      for (const version of versions) {
        await prisma.versionPermission.upsert({
          where: {
            versionId_userId: {
              versionId: version.id,
              userId: user.id
            }
          },
          update: {},
          create: {
            versionId: version.id,
            userId: user.id,
            permission: 'read'
          }
        })
      }
      
      console.log(`✅ Granted access to ${user.email} for all versions:`)
      versions.forEach(v => console.log(`   - ${v.name}`))
    }
    
  } catch (error) {
    console.error('❌ Error granting permissions:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

grantUserPermissions()