import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateDocument, deleteDocument } from '@/lib/meilisearch'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const DOCS_DIR = path.join(process.cwd(), 'docs')

// Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const resolvedParams = await params
    const document = await prisma.document.findUnique({
      where: { id: resolvedParams.id },
      include: {
        chapter: {
          include: {
            module: {
              include: {
                version: true
              }
            }
          }
        }
      }
    })
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

// Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const resolvedParams = await params
    const { title, content, rawContent } = await request.json()
    
    // Get the document to find its file path
    const document = await prisma.document.findUnique({
      where: { id: resolvedParams.id },
      include: {
        chapter: {
          include: {
            module: {
              include: {
                version: true
              }
            }
          }
        }
      }
    })
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Parse the frontmatter to preserve existing metadata
    const { data: frontmatter } = matter(document.rawContent)
    
    // Update frontmatter with new title
    const updatedFrontmatter = {
      ...frontmatter,
      title: title
    }
    
    // Create new content with updated frontmatter
    const contentWithoutFrontmatter = rawContent.replace(/^---\n[\s\S]*?\n---\n/, '')
    const newRawContent = matter.stringify(contentWithoutFrontmatter, updatedFrontmatter)
    
    // Update file on disk
    const filePath = path.join(
      DOCS_DIR,
      document.chapter.module.version.name,
      document.chapter.module.name,
      document.chapter.name,
      document.filename
    )
    
    fs.writeFileSync(filePath, newRawContent)
    
    // Update database
    const updatedDocument = await prisma.document.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        content,
        rawContent: newRawContent,
        excerpt: content.slice(0, 200).replace(/<[^>]*>/g, ''),
        updatedById: (session.user as any)?.id || null
      }
    })
    
    
    // Update Meilisearch
    await updateDocument({
      id: document.id,
      title,
      content: content.replace(/<[^>]*>/g, ''),
      versionId: document.chapter.module.version.id,
      versionName: document.chapter.module.version.name,
      moduleId: document.chapter.module.id,
      moduleName: document.chapter.module.displayName,
      chapterId: document.chapterId,
      chapterName: document.chapter.displayName,
      url: `/docs/${document.chapter.module.version.name}/${document.chapter.module.name}/${document.chapter.name}/${document.filename.replace('.md', '')}`,
      updatedAt: new Date().toISOString()
    })
    
    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

// Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const resolvedParams = await params
    
    // Get the document to find its file path
    const document = await prisma.document.findUnique({
      where: { id: resolvedParams.id },
      include: {
        chapter: {
          include: {
            module: {
              include: {
                version: true
              }
            }
          }
        }
      }
    })
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Delete file from disk
    const filePath = path.join(
      DOCS_DIR,
      document.chapter.module.version.name,
      document.chapter.module.name,
      document.chapter.name,
      document.filename
    )
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    
    // Delete from Meilisearch
    await deleteDocument(document.id)
    
    // Delete from database
    await prisma.document.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}