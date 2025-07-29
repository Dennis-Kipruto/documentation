import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const DOCS_DIR = path.join(process.cwd(), 'docs')

interface MediaFile {
  name: string
  path: string
  type: 'image' | 'video' | 'document' | 'other'
  size: number
  lastModified: string
  url: string
}

function getFileType(filename: string): MediaFile['type'] {
  const ext = path.extname(filename).toLowerCase()
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    return 'image'
  }
  if (['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext)) {
    return 'video'
  }
  if (['.pdf', '.txt', '.csv', '.json', '.xml', '.doc', '.docx'].includes(ext)) {
    return 'document'
  }
  return 'other'
}

function scanMediaFiles(dirPath: string, relativePath = ''): MediaFile[] {
  const files: MediaFile[] = []
  
  if (!fs.existsSync(dirPath)) {
    return files
  }
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name)
    const itemRelativePath = path.join(relativePath, item.name)
    
    if (item.isDirectory()) {
      // Recursively scan subdirectories
      files.push(...scanMediaFiles(fullPath, itemRelativePath))
    } else if (item.isFile() && !item.name.endsWith('.md')) {
      // Only include non-markdown files
      const stats = fs.statSync(fullPath)
      
      files.push({
        name: item.name,
        path: itemRelativePath,
        type: getFileType(item.name),
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        url: `/docs-media/${itemRelativePath.replace(/\\/g, '/')}`
      })
    }
  }
  
  return files
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const filterPath = searchParams.get('path') || ''
    const fileType = searchParams.get('type') as MediaFile['type'] | null
    
    const searchPath = filterPath ? path.join(DOCS_DIR, filterPath) : DOCS_DIR
    const files = scanMediaFiles(searchPath, filterPath)
    
    // Filter by file type if specified
    const filteredFiles = fileType 
      ? files.filter(file => file.type === fileType)
      : files
    
    // Sort by last modified (newest first)
    filteredFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    
    return NextResponse.json({
      files: filteredFiles,
      totalSize: filteredFiles.reduce((sum, file) => sum + file.size, 0),
      count: filteredFiles.length
    })
  } catch (error) {
    console.error('Error scanning media files:', error)
    return NextResponse.json({ error: 'Failed to scan media files' }, { status: 500 })
  }
}