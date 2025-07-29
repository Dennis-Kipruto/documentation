import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const versions = await prisma.version.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        isActive: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}