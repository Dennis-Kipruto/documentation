'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon } from 'lucide-react'

interface Version {
  id: string
  name: string
  displayName: string
  isActive: boolean
}

interface VersionSelectorProps {
  currentVersion?: string
}

export function VersionSelector({ currentVersion }: VersionSelectorProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch('/api/versions')
        if (response.ok) {
          const data = await response.json()
          setVersions(data)
        }
      } catch (error) {
        console.error('Error fetching versions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVersions()
  }, [])

  const handleVersionChange = async (versionName: string) => {
    setIsOpen(false)
    
    if (versionName === currentVersion) return

    // Navigate to the modules listing page for the selected version
    router.push(`/docs/${versionName}`)
  }

  if (isLoading || versions.length <= 1) {
    return null
  }

  const current = versions.find(v => v.name === currentVersion)
  const activeVersions = versions.filter(v => v.isActive)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className="text-slate-700 dark:text-slate-300">
          {current?.displayName || currentVersion || 'Select Version'}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-20 border border-slate-200 dark:border-slate-600">
            {activeVersions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleVersionChange(version.name)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  version.name === currentVersion
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {version.displayName}
                {version.name === currentVersion && (
                  <span className="ml-2 text-blue-500 dark:text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}