const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateVersionOrder() {
  try {
    console.log('Updating version order...')
    
    // Get all versions
    const versions = await prisma.version.findMany({
      orderBy: { name: 'asc' }
    })
    
    // Update order based on version name (semantic versioning)
    const sortedVersions = versions.sort((a, b) => {
      // Extract version numbers (assuming format like v1.0, v2.0, etc.)
      const aVersion = a.name.replace(/[^0-9.]/g, '')
      const bVersion = b.name.replace(/[^0-9.]/g, '')
      
      const aParts = aVersion.split('.').map(Number)
      const bParts = bVersion.split('.').map(Number)
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0
        const bPart = bParts[i] || 0
        
        if (aPart !== bPart) {
          return aPart - bPart
        }
      }
      
      return 0
    })
    
    // Update order in database
    for (let i = 0; i < sortedVersions.length; i++) {
      await prisma.version.update({
        where: { id: sortedVersions[i].id },
        data: { order: i }
      })
      
      console.log(`Updated ${sortedVersions[i].name} to order ${i}`)
    }
    
    console.log('✅ Version order updated successfully')
    
    // Show current order
    const updatedVersions = await prisma.version.findMany({
      orderBy: { order: 'asc' }
    })
    
    console.log('\nCurrent version order:')
    updatedVersions.forEach(v => {
      console.log(`  ${v.order}: ${v.name} (${v.displayName})`)
    })
    
  } catch (error) {
    console.error('❌ Error updating version order:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateVersionOrder()