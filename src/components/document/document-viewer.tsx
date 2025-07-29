'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, PrinterIcon, ShareIcon } from 'lucide-react'
import { TableOfContents } from './table-of-contents'

interface Document {
  id: string
  title: string
  content: string
  filename: string
  order: number
  createdAt: string
  updatedAt: string
}

interface Chapter {
  id: string
  name: string
  displayName: string
  documents: Document[]
}

interface Module {
  id: string
  name: string
  displayName: string
  chapters: Chapter[]
}

interface Version {
  id: string
  name: string
  displayName: string
  modules: Module[]
}

interface DocumentViewerProps {
  document: Document
  version: Version
  module: Module
  chapter: Chapter
}

export function DocumentViewer({ document, version, module, chapter }: DocumentViewerProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)

  // Find navigation context
  const allDocuments = version.modules
    .flatMap(m => m.chapters)
    .flatMap(c => c.documents)
    .sort((a, b) => a.order - b.order)

  const currentIndex = allDocuments.findIndex(d => d.id === document.id)
  const prevDocument = currentIndex > 0 ? allDocuments[currentIndex - 1] : null
  const nextDocument = currentIndex < allDocuments.length - 1 ? allDocuments[currentIndex + 1] : null

  const findDocumentContext = (doc: Document) => {
    for (const mod of version.modules) {
      for (const chap of mod.chapters) {
        if (chap.documents.find(d => d.id === doc.id)) {
          return { module: mod, chapter: chap }
        }
      }
    }
    return null
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        })
      } catch {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      setShowShareMenu(false)
      // You could show a toast notification here
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex gap-8">
      {/* Main content */}
      <div className="flex-1 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/docs" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Documentation
          </Link>
          <span>•</span>
          <Link href={`/docs/${version.name}`} className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            {version.displayName}
          </Link>
          <span>•</span>
          <span className="text-slate-700 dark:text-slate-300">{module.displayName}</span>
          <span>•</span>
          <span className="text-slate-700 dark:text-slate-300">{chapter.displayName}</span>
          <span>•</span>
          <span className="text-slate-900 dark:text-white font-medium">{document.title}</span>
        </nav>

        {/* Document actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{document.title}</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleShare}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Share Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document metadata */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-medium text-slate-900 dark:text-white">Published by:</span>{' '}
              {(document as any).publishedBy?.name || 'Unknown'}
            </div>
            <div>
              <span className="font-medium text-slate-900 dark:text-white">Published:</span>{' '}
              {new Date(document.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            {(document as any).updatedBy && (
              <>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">Last updated by:</span>{' '}
                  {(document as any).updatedBy.name}
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">Last updated:</span>{' '}
                  {new Date(document.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Document content */}
        <div className="prose prose-lg prose-enhanced max-w-none dark:prose-invert">
          <div
            data-document-content
            dangerouslySetInnerHTML={{ __html: document.content }}
            className="prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-blockquote:border-l-slate-300 dark:prose-blockquote:border-l-slate-600 prose-th:text-slate-900 dark:prose-th:text-slate-100 prose-td:text-slate-700 dark:prose-td:text-slate-300"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            {prevDocument && (
              <Link
                href={`/docs/${version.name}/${findDocumentContext(prevDocument)?.module.name}/${findDocumentContext(prevDocument)?.chapter.name}/${prevDocument.filename.replace('.md', '')}`}
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Previous</div>
                  <div className="font-medium">{prevDocument.title}</div>
                </div>
              </Link>
            )}
          </div>

          <div className="flex-1 text-right">
            {nextDocument && (
              <Link
                href={`/docs/${version.name}/${findDocumentContext(nextDocument)?.module.name}/${findDocumentContext(nextDocument)?.chapter.name}/${nextDocument.filename.replace('.md', '')}`}
                className="flex items-center justify-end space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Next</div>
                  <div className="font-medium">{nextDocument.title}</div>
                </div>
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Table of Contents Sidebar */}
      <div className="hidden xl:block w-64 flex-shrink-0">
        <TableOfContents content={document.content} />
      </div>
    </div>
  )
}