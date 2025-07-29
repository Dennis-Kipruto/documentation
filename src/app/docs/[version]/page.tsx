import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { FolderIcon, BookOpenIcon, FileTextIcon, ClockIcon } from 'lucide-react'
import { InlineSearch } from '@/components/search/inline-search'

interface Props {
  params: Promise<{ version: string }>
}

export default async function VersionPage({ params }: Props) {
  const { version } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const versionData = await prisma.version.findUnique({
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

  if (!versionData) {
    redirect('/docs')
  }

  if (versionData.modules.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            No modules found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            This version doesn&apos;t contain any modules yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {versionData.displayName}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Explore documentation modules, chapters and guides
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1">
              <FolderIcon className="w-4 h-4" />
              <span>{versionData.modules.length} modules</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpenIcon className="w-4 h-4" />
              <span>{versionData.modules.reduce((sum, module) => sum + module.chapters.length, 0)} chapters</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileTextIcon className="w-4 h-4" />
              <span>{versionData.modules.reduce((sum, module) => sum + module.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.documents.length, 0), 0)} documents</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <InlineSearch 
          placeholder="Search modules..."
          targetSelector="[data-module-card]"
          titleSelector="[data-module-title]"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <FolderIcon className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Total Modules</p>
              <p className="text-2xl font-bold">{versionData.modules.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Total Chapters</p>
              <p className="text-2xl font-bold">{versionData.modules.reduce((sum, module) => sum + module.chapters.length, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <FileTextIcon className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Total Documents</p>
              <p className="text-2xl font-bold">{versionData.modules.reduce((sum, module) => sum + module.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.documents.length, 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {versionData.modules.map((module) => {
          const totalChapters = module.chapters.length
          const totalDocuments = module.chapters.reduce((sum, chapter) => sum + chapter.documents.length, 0)
          const lastUpdated = new Date().toLocaleDateString() // You can replace with actual lastUpdated from DB
          
          return (
            <Link
              key={module.id}
              href={`/docs/${versionData.name}/${module.name}`}
              data-module-card
              className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-6 hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <FolderIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 data-module-title className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    {module.displayName}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    Comprehensive documentation covering all aspects of {module.displayName.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <BookOpenIcon className="w-4 h-4" />
                    <span>{totalChapters} chapters</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileTextIcon className="w-4 h-4" />
                    <span>{totalDocuments} docs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <ClockIcon className="w-3 h-3" />
                  <span>Updated {lastUpdated}</span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  <span className="text-sm font-medium">Explore →</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}