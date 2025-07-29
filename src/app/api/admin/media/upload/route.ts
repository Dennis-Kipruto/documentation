import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const DOCS_DIR = path.join(process.cwd(), 'docs')
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetPath = formData.get('path') as string || ''
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf', 'text/plain', 'text/csv', 'application/json'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type ${file.type} not allowed` 
      }, { status: 400 })
    }
    
    // Create target directory
    const uploadDir = path.join(DOCS_DIR, targetPath)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    // Generate unique filename if file already exists
    let filename = file.name
    let counter = 1
    const fileBaseName = path.parse(filename).name
    const fileExtension = path.parse(filename).ext
    
    while (fs.existsSync(path.join(uploadDir, filename))) {
      filename = `${fileBaseName}_${counter}${fileExtension}`
      counter++
    }
    
    const filePath = path.join(uploadDir, filename)
    
    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)
    
    const stats = fs.statSync(filePath)
    const relativePath = path.join(targetPath, filename).replace(/\\/g, '/')
    
    return NextResponse.json({
      success: true,
      file: {
        name: filename,
        path: relativePath,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        url: `/docs-media/${relativePath}`
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}