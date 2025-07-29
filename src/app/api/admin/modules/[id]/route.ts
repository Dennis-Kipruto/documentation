import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const updateModuleSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  order: z.number().optional(),
})

// Get a specific module
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
    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        version: true,
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            documents: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    return NextResponse.json(module)
  } catch (error) {
    console.error('Error fetching module:', error)
    return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 })
  }
}

// Update a module
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
    const validatedData = updateModuleSchema.parse(body)
    
    // Get current module
    const currentModule = await prisma.module.findUnique({
      where: { id },
      include: { version: true }
    })
    
    if (!currentModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    // Check if new name conflicts with existing modules (if name is being changed)
    if (validatedData.name && validatedData.name !== currentModule.name) {
      const existingModule = await prisma.module.findFirst({
        where: {
          versionId: currentModule.versionId,
          name: validatedData.name,
          id: { not: id }
        }
      })
      
      if (existingModule) {
        return NextResponse.json({ error: 'Module name already exists in this version' }, { status: 400 })
      }
    }
    
    // Update module in database
    const updatedModule = await prisma.module.update({
      where: { id },
      data: validatedData,
      include: {
        version: true,
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            documents: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })
    
    // If name changed, rename directory in filesystem
    if (validatedData.name && validatedData.name !== currentModule.name) {
      const oldDir = path.join(process.cwd(), 'docs', currentModule.version.name, currentModule.name)
      const newDir = path.join(process.cwd(), 'docs', currentModule.version.name, validatedData.name)
      
      try {
        await fs.access(oldDir)
        await fs.rename(oldDir, newDir)
      } catch (fsError) {
        console.warn('Failed to rename module directory:', fsError)
        // Continue anyway - database is updated
      }
    }
    
    return NextResponse.json(updatedModule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

// Delete a module
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
    // Get module with version info
    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        version: true,
        chapters: {
          include: {
            documents: true
          }
        }
      }
    })
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    // Check if module has content
    const totalDocuments = module.chapters.reduce((total, chapter) => total + chapter.documents.length, 0)
    if (totalDocuments > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete module with documents. Please delete all documents first.' 
      }, { status: 400 })
    }
    
    // Delete module (cascade will handle chapters)
    await prisma.module.delete({
      where: { id }
    })
    
    // Remove directory from filesystem
    const moduleDir = path.join(process.cwd(), 'docs', module.version.name, module.name)
    try {
      await fs.rmdir(moduleDir, { recursive: true })
    } catch (fsError) {
      console.warn('Failed to remove module directory:', fsError)
      // Continue anyway - database is cleaned up
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}