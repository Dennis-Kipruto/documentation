import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDocument } from '@/lib/docs-processor'
import { prisma } from '@/lib/db'
import { DocumentViewer } from '@/components/document/document-viewer'

interface Props {
  params: Promise<{
    version: string
    module: string
    chapter: string
    document: string
  }>
}

export default async function DocumentPage({ params }: Props) {
  const { version, module, chapter, document: documentName } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const document = await getDocument(
    version,
    module,
    chapter,
    `${documentName}.md`
  )

  if (!document) {
    redirect('/docs')
  }

  // Check permissions
  const versionData = await prisma.version.findUnique({
    where: { name: version },
    include: {
      modules: {
        where: { name: module },
        include: {
          chapters: {
            where: { name: chapter }
          }
        }
      }
    }
  })

  if (!versionData) {
    redirect('/docs')
  }

  const moduleData = versionData.modules[0]
  const chapterData = moduleData?.chapters[0]

  if (!moduleData || !chapterData) {
    redirect('/docs')
  }

  // All authenticated users have access to all documentation
  // No permission check needed - authentication is handled by the session check above

  // Get full version data for navigation
  const fullVersion = await prisma.version.findUnique({
    where: { name: version },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          chapters: {
            orderBy: { order: 'asc' },
            include: {
              documents: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    }
  })

  if (!fullVersion) {
    redirect('/docs')
  }

  // Transform document for component compatibility
  const documentForViewer = {
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  }

  return (
    <DocumentViewer
      document={documentForViewer}
      version={fullVersion as any}
      module={moduleData as any}
      chapter={chapterData as any}
    />
  )
}