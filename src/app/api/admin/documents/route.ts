import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Get all documents with their structure
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')
    
    if (versionId) {
      // Get documents for a specific version
      const version = await prisma.version.findUnique({
        where: { id: versionId },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              chapters: {
                orderBy: { order: 'asc' },
                include: {
                  documents: {
                    orderBy: { order: 'asc' },
                    select: {
                      id: true,
                      filename: true,
                      title: true,
                      excerpt: true,
                      order: true,
                      chapterId: true
                    }
                  }
                }
              }
            }
          }
        }
      })
      
      return NextResponse.json(version)
    } else {
      // Get all versions with basic info
      const versions = await prisma.version.findMany({
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: {
              modules: true
            }
          }
        }
      })
      
      return NextResponse.json(versions)
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}