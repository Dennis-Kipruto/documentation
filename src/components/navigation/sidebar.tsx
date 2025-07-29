'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDownIcon, ChevronRightIcon, BookOpenIcon, FolderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  filename: string
  title: string
  order: number
}

interface Chapter {
  id: string
  name: string
  displayName: string
  order: number
  documents: Document[]
}

interface Module {
  id: string
  name: string
  displayName: string
  order: number
  chapters: Chapter[]
}

interface Version {
  id: string
  name: string
  displayName: string
  order: number
  modules: Module[]
}

interface SidebarProps {
  version: Version
  className?: string
}

export function Sidebar({ version, className }: SidebarProps) {
  const pathname = usePathname()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const isDocumentActive = (versionName: string, moduleName: string, chapterName: string, filename: string) => {
    const docPath = `/docs/${versionName}/${moduleName}/${chapterName}/${filename.replace('.md', '')}`
    return pathname === docPath
  }

  return (
    <div className={cn('w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto', className)}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {version.displayName}
        </h2>
        
        <nav className="space-y-2">
          {version.modules.map((module) => (
            <div key={module.id}>
              <button
                onClick={() => toggleModule(module.id)}
                className="flex items-center w-full text-left px-2 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <FolderIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                {expandedModules.has(module.id) ? (
                  <ChevronDownIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 mr-1" />
                )}
                {module.displayName}
              </button>
              
              {expandedModules.has(module.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {module.chapters.map((chapter) => (
                    <div key={chapter.id}>
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="flex items-center w-full text-left px-2 py-1 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                      >
                        <BookOpenIcon className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                        {expandedChapters.has(chapter.id) ? (
                          <ChevronDownIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 mr-1" />
                        )}
                        {chapter.displayName}
                      </button>
                      
                      {expandedChapters.has(chapter.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {chapter.documents.map((document) => (
                            <Link
                              key={document.id}
                              href={`/docs/${version.name}/${module.name}/${chapter.name}/${document.filename.replace('.md', '')}`}
                              className={cn(
                                'block px-2 py-1 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                                isDocumentActive(version.name, module.name, chapter.name, document.filename)
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600 dark:border-blue-400 font-medium'
                                  : 'text-slate-600 dark:text-slate-400'
                              )}
                            >
                              {document.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}