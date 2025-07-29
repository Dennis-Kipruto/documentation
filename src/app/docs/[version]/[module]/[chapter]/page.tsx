import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { FileTextIcon, ArrowLeftIcon } from 'lucide-react'

interface Props {
  params: Promise<{ version: string; module: string; chapter: string }>
}

export default async function ChapterPage({ params }: Props) {
  const { version, module, chapter } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const chapterData = await prisma.chapter.findFirst({
    where: {
      name: chapter,
      module: {
        name: module,
        version: { name: version }
      }
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

  if (!chapterData) {
    redirect(`/docs/${version}/${module}`)
  }

  if (chapterData.documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href={`/docs/${version}/${module}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Chapters
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {chapterData.displayName}
          </h1>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            No documents found
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            This chapter doesn&apos;t contain any documents yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link
          href={`/docs/${version}/${module}`}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Chapters
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {chapterData.displayName}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Choose a document to read.
        </p>
      </div>

      <div className="space-y-4">
        {chapterData.documents.map((document) => {
          return (
            <Link
              key={document.id}
              href={`/docs/${version}/${module}/${chapter}/${document.filename.replace('.md', '')}`}
              className="block bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-6 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {document.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {document.filename}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}