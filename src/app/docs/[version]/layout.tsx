'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Header } from '@/components/navigation/header'
import { Sidebar } from '@/components/navigation/sidebar'

interface Version {
  id: string
  name: string
  displayName: string
  order: number
  modules: Module[]
}

interface Module {
  id: string
  name: string
  displayName: string
  order: number
  chapters: Chapter[]
}

interface Chapter {
  id: string
  name: string
  displayName: string
  order: number
  documents: Document[]
}

interface Document {
  id: string
  filename: string
  title: string
  order: number
}

export default function VersionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ version: string }>
}) {
  // const [versionName, setVersionName] = useState<string>('')
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [version, setVersion] = useState<Version | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if we're on a document page (has 6 parts: /docs/[version]/[module]/[chapter]/[document])
  const pathParts = pathname.split('/')
  const isDocumentPage = pathParts.length === 6 // /docs/[version]/[module]/[chapter]/[document]
  const shouldShowSidebar = isDocumentPage

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const resolvedParams = await params
        // setVersionName(resolvedParams.version)
        const response = await fetch(`/api/versions/${resolvedParams.version}`)
        if (response.ok) {
          const data = await response.json()
          setVersion(data)
        }
      } catch {
        console.error('Error fetching version:')
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchVersion()
    }
  }, [session, params])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !version) {
    return null
  }

  // Render with sidebar only for document pages
  if (shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header
          versionName={version.displayName}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        <div className="flex">
          <Sidebar
            version={version}
            className={`${
              isMobileMenuOpen ? 'block' : 'hidden'
            } lg:block fixed lg:relative z-40 lg:z-auto h-full lg:h-auto`}
          />
          
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          
          <main className="flex-1 p-6 bg-white dark:bg-slate-800 h-screen overflow-hidden">
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // For all non-document pages (modules, chapters, documents list), render without sidebar
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header
        versionName={version.displayName}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <main className="p-6 bg-slate-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  )
}