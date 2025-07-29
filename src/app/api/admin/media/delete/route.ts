import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const DOCS_DIR = path.join(process.cwd(), 'docs')

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 })
    }
    
    const fullPath = path.join(DOCS_DIR, filePath)
    
    // Security check - ensure the file is within the docs directory
    if (!fullPath.startsWith(DOCS_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Don't allow deleting markdown files through this endpoint
    if (fullPath.endsWith('.md')) {
      return NextResponse.json({ error: 'Cannot delete markdown files through this endpoint' }, { status: 400 })
    }
    
    fs.unlinkSync(fullPath)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}