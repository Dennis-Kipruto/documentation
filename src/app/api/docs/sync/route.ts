import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scanDocsDirectory } from '@/lib/docs-processor'

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = session.user as any
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  try {
    await scanDocsDirectory()
    return NextResponse.json({ message: 'Documentation synced successfully' })
  } catch (error) {
    console.error('Error syncing documentation:', error)
    return NextResponse.json({ error: 'Failed to sync documentation' }, { status: 500 })
  }
}