import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDocument } from '@/lib/meilisearch'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const DOCS_DIR = path.join(process.cwd(), 'docs')

// Create new document
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { title, content, rawContent, chapterId, filename } = await request.json()
    
    if (!title || !chapterId || !filename) {
      return NextResponse.json({ 
        error: 'Title, chapter ID, and filename are required' 
      }, { status: 400 })
    }
    
    // Get chapter info to build file path
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        module: {
          include: {
            version: true
          }
        }
      }
    })
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    
    // Ensure filename ends with .md
    const cleanFilename = filename.endsWith('.md') ? filename : `${filename}.md`
    
    // Check if file already exists
    const existingDoc = await prisma.document.findUnique({
      where: {
        chapterId_filename: {
          chapterId,
          filename: cleanFilename
        }
      }
    })
    
    if (existingDoc) {
      return NextResponse.json({ 
        error: 'A document with this filename already exists in this chapter' 
      }, { status: 400 })
    }
    
    // Create frontmatter
    const frontmatter = {
      title,
      description: content?.slice(0, 200).replace(/<[^>]*>/g, '') || '',
      order: 1 // Default order, can be adjusted later
    }
    
    // Create content with frontmatter
    const fileContent = matter.stringify(rawContent || `# ${title}\n\nYour content here...`, frontmatter)
    
    // Create file on disk
    const dirPath = path.join(
      DOCS_DIR,
      chapter.module.version.name,
      chapter.module.name,
      chapter.name
    )
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    const filePath = path.join(dirPath, cleanFilename)
    fs.writeFileSync(filePath, fileContent)
    
    // Get the next order number
    const lastDocument = await prisma.document.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' }
    })
    
    const order = lastDocument ? lastDocument.order + 1 : 1
    
    // Create in database
    const document = await prisma.document.create({
      data: {
        filename: cleanFilename,
        title,
        content: content || `<h1>${title}</h1><p>Your content here...</p>`,
        rawContent: fileContent,
        excerpt: content?.slice(0, 200).replace(/<[^>]*>/g, '') || '',
        chapterId,
        order,
        publishedById: (session.user as any)?.id || null
      }
    })
    
    
    // Add to Meilisearch
    await addDocument({
      id: document.id,
      title,
      content: content?.replace(/<[^>]*>/g, '') || title,
      versionId: chapter.module.version.id,
      versionName: chapter.module.version.name,
      moduleId: chapter.module.id,
      moduleName: chapter.module.displayName,
      chapterId,
      chapterName: chapter.displayName,
      url: `/docs/${chapter.module.version.name}/${chapter.module.name}/${chapter.name}/${cleanFilename.replace('.md', '')}`,
      updatedAt: new Date().toISOString()
    })
    
    return NextResponse.json(document)
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}