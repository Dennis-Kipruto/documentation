import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const updateChapterSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  order: z.number().optional(),
})

// Get a specific chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            version: true
          }
        },
        documents: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    
    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 })
  }
}

// Update a chapter
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const validatedData = updateChapterSchema.parse(body)
    
    // Get current chapter
    const currentChapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            version: true
          }
        }
      }
    })
    
    if (!currentChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    
    // Check if new name conflicts with existing chapters (if name is being changed)
    if (validatedData.name && validatedData.name !== currentChapter.name) {
      const existingChapter = await prisma.chapter.findFirst({
        where: {
          moduleId: currentChapter.moduleId,
          name: validatedData.name,
          id: { not: id }
        }
      })
      
      if (existingChapter) {
        return NextResponse.json({ error: 'Chapter name already exists in this module' }, { status: 400 })
      }
    }
    
    // Update chapter in database
    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: validatedData,
      include: {
        module: {
          include: {
            version: true
          }
        },
        documents: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    // If name changed, rename directory in filesystem
    if (validatedData.name && validatedData.name !== currentChapter.name) {
      const oldDir = path.join(
        process.cwd(), 
        'docs', 
        currentChapter.module.version.name, 
        currentChapter.module.name, 
        currentChapter.name
      )
      const newDir = path.join(
        process.cwd(), 
        'docs', 
        currentChapter.module.version.name, 
        currentChapter.module.name, 
        validatedData.name
      )
      
      try {
        await fs.access(oldDir)
        await fs.rename(oldDir, newDir)
      } catch (fsError) {
        console.warn('Failed to rename chapter directory:', fsError)
        // Continue anyway - database is updated
      }
    }
    
    return NextResponse.json(updatedChapter)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    
    console.error('Error updating chapter:', error)
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 })
  }
}

// Delete a chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get chapter with module and version info
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            version: true
          }
        },
        documents: true
      }
    })
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    
    // Check if chapter has documents
    if (chapter.documents.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete chapter with documents. Please delete all documents first.' 
      }, { status: 400 })
    }
    
    // Delete chapter (cascade will handle any remaining relations)
    await prisma.chapter.delete({
      where: { id }
    })
    
    // Remove directory from filesystem
    const chapterDir = path.join(
      process.cwd(), 
      'docs', 
      chapter.module.version.name, 
      chapter.module.name, 
      chapter.name
    )
    try {
      await fs.rmdir(chapterDir, { recursive: true })
    } catch (fsError) {
      console.warn('Failed to remove chapter directory:', fsError)
      // Continue anyway - database is cleaned up
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chapter:', error)
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 })
  }
}