import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  const { version: versionName } = await params
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const version = await prisma.version.findUnique({
      where: { name: versionName },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
              include: {
                documents: {
                  orderBy: { order: 'asc' },
                  include: {
                    publishedBy: {
                      select: { id: true, name: true, email: true }
                    },
                    updatedBy: {
                      select: { id: true, name: true, email: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json(version)
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}