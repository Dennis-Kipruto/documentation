import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchDocuments } from '@/lib/meilisearch'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const versionId = searchParams.get('version')
  
  if (!query) {
    return NextResponse.json({ results: [] })
  }
  
  try {
    const results = await searchDocuments(query, versionId || undefined)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}