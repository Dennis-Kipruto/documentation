import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Get the latest version (highest order number)
  const latestVersion = await prisma.version.findFirst({
    where: { isActive: true },
    orderBy: { order: 'desc' }
  })

  if (!latestVersion) {
    redirect('/docs')
  }

  // Always redirect to the modules page for the latest version
  redirect(`/docs/${latestVersion.name}`)
}
