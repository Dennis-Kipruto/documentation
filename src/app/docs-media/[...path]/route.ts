import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    const fullPath = path.join(process.cwd(), 'docs', filePath)
    
    // Security check - ensure the file is within the docs directory
    const docsPath = path.join(process.cwd(), 'docs')
    if (!fullPath.startsWith(docsPath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Check if it's a file (not directory)
    const stats = fs.statSync(fullPath)
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(fullPath)
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = getContentType(ext)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving media file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getContentType(extension: string): string {
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml'
  }
  
  return contentTypes[extension] || 'application/octet-stream'
}