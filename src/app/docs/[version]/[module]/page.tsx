import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { BookOpenIcon, FileTextIcon, ArrowLeftIcon, ClockIcon } from 'lucide-react'
import { InlineSearch } from '@/components/search/inline-search'

interface Props {
  params: Promise<{ version: string; module: string }>
}

export default async function ModulePage({ params }: Props) {
  const { version, module } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const moduleData = await prisma.module.findFirst({
    where: {
      name: module,
      version: { name: version }
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

  if (!moduleData) {
    redirect(`/docs/${version}`)
  }

  if (moduleData.chapters.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href={`/docs/${version}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Modules
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {moduleData.displayName}
          </h1>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            No chapters found
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            This module doesn&apos;t contain any chapters yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header & Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <Link href={`/docs/${version}`} className="hover:text-blue-600 dark:hover:text-blue-400">
            {moduleData.version.displayName}
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300">{moduleData.displayName}</span>
        </div>
        
        <Link
          href={`/docs/${version}`}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Modules
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {moduleData.displayName}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Explore chapters and detailed documentation guides
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1">
              <BookOpenIcon className="w-4 h-4" />
              <span>{moduleData.chapters.length} chapters</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileTextIcon className="w-4 h-4" />
              <span>{moduleData.chapters.reduce((sum, chapter) => sum + chapter.documents.length, 0)} documents</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <InlineSearch 
          placeholder="Search chapters..."
          targetSelector="[data-chapter-card]"
          titleSelector="[data-chapter-title]"
        />
      </div>

      {/* Statistics Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{moduleData.chapters.length}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Chapters</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <FileTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {moduleData.chapters.reduce((sum, chapter) => sum + chapter.documents.length, 0)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {moduleData.chapters.map((chapter) => {
          const totalDocuments = chapter.documents.length
          const lastUpdated = new Date().toLocaleDateString()
          
          return (
            <Link
              key={chapter.id}
              href={`/docs/${version}/${module}/${chapter.name}`}
              data-chapter-card
              className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-6 hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <BookOpenIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 data-chapter-title className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    {chapter.displayName}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    Detailed guides and documentation for {chapter.displayName.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center space-x-1">
                  <FileTextIcon className="w-4 h-4" />
                  <span>{totalDocuments} documents</span>
                </div>
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">
                  Chapter {chapter.order}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <ClockIcon className="w-3 h-3" />
                  <span>Updated {lastUpdated}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  <span className="text-sm font-medium">View Docs →</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}