'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  excerpt: string
  versionName: string
  moduleName: string
  chapterName: string
  url: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  versionName?: string
}

export function SearchModal({ isOpen, onClose, versionName }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ q: query })
        if (versionName) params.append('version', versionName)
        
        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()
        
        if (data.results) {
          setResults(data.results)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, versionName])

  const handleResultClick = (url: string) => {
    router.push(url)
    onClose()
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all mt-12 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-4 mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <SearchIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 outline-none text-xl bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-1"
                    autoFocus
                  />
                  {versionName && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-sm font-medium rounded-full">
                      {versionName}
                    </span>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <XIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </button>
                </div>

                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}

                {!isLoading && results.length > 0 && (
                  <div className="max-h-[32rem] overflow-y-auto">
                    <div className="mb-3 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600 pb-2">
                      Found {results.length} result{results.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-y-3">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result.url)}
                          className="w-full text-left p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:shadow-md group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {result.title}
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                {result.versionName}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2 space-x-2">
                            <span className="font-medium">{result.moduleName}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{result.chapterName}</span>
                          </div>
                          
                          <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                            {result.excerpt}
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {result.url}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && query.trim() && results.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-slate-500 dark:text-slate-400 text-lg mb-2">
                      No results found for "{query}"
                    </div>
                    <div className="text-sm text-slate-400 dark:text-slate-500">
                      Try a different search term or check your spelling
                    </div>
                  </div>
                )}

                {!query.trim() && (
                  <div className="text-center py-12">
                    <div className="text-slate-500 dark:text-slate-400 text-lg mb-4">
                      Start typing to search documentation...
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm text-slate-400 dark:text-slate-500">
                      <div className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">↑</kbd>
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">↓</kbd>
                        <span>to navigate</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Enter</kbd>
                        <span>to select</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd>
                        <span>to close</span>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}