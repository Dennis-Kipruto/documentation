import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const createChapterSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  moduleId: z.string(),
  order: z.number().optional(),
})

// Create a new chapter
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const validatedData = createChapterSchema.parse(body)
    
    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: validatedData.moduleId },
      include: { version: true }
    })
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    
    // Check if chapter name already exists in this module
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        moduleId: validatedData.moduleId,
        name: validatedData.name
      }
    })
    
    if (existingChapter) {
      return NextResponse.json({ error: 'Chapter name already exists in this module' }, { status: 400 })
    }
    
    // Get the next order if not provided
    const order = validatedData.order ?? await getNextChapterOrder(validatedData.moduleId)
    
    // Create chapter in database
    const chapter = await prisma.chapter.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        moduleId: validatedData.moduleId,
        order
      },
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
    
    // Create directory in filesystem
    const chapterDir = path.join(process.cwd(), 'docs', module.version.name, module.name, validatedData.name)
    await fs.mkdir(chapterDir, { recursive: true })
    
    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    
    console.error('Error creating chapter:', error)
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 })
  }
}

async function getNextChapterOrder(moduleId: string): Promise<number> {
  const lastChapter = await prisma.chapter.findFirst({
    where: { moduleId },
    orderBy: { order: 'desc' }
  })
  
  return lastChapter ? lastChapter.order + 1 : 0
}