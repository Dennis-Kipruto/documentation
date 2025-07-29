import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const createModuleSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  versionId: z.string(),
  order: z.number().optional(),
})


// Create a new module
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const validatedData = createModuleSchema.parse(body)
    
    // Check if version exists
    const version = await prisma.version.findUnique({
      where: { id: validatedData.versionId }
    })
    
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }
    
    // Check if module name already exists in this version
    const existingModule = await prisma.module.findFirst({
      where: {
        versionId: validatedData.versionId,
        name: validatedData.name
      }
    })
    
    if (existingModule) {
      return NextResponse.json({ error: 'Module name already exists in this version' }, { status: 400 })
    }
    
    // Get the next order if not provided
    const order = validatedData.order ?? await getNextModuleOrder(validatedData.versionId)
    
    // Create module in database
    const module = await prisma.module.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        versionId: validatedData.versionId,
        order
      },
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
    
    // Create directory in filesystem
    const moduleDir = path.join(process.cwd(), 'docs', version.name, validatedData.name)
    await fs.mkdir(moduleDir, { recursive: true })
    
    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    
    console.error('Error creating module:', error)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}

async function getNextModuleOrder(versionId: string): Promise<number> {
  const lastModule = await prisma.module.findFirst({
    where: { versionId },
    orderBy: { order: 'desc' }
  })
  
  return lastModule ? lastModule.order + 1 : 0
}