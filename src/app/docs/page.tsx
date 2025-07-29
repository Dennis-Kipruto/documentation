import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function DocsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Check if any versions exist
  const versions = await prisma.version.findMany({
    where: { isActive: true },
    orderBy: { order: 'desc' }
  })

  // If versions exist, redirect to the latest one
  if (versions.length > 0) {
    redirect(`/docs/${versions[0].name}`)
  }

  // No versions available - show helpful message
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg 
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Documentation Available
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          There are currently no documentation versions available. Please contact your administrator to set up documentation or sync content from the file system.
        </p>

        {session.user && (session.user as any).role === 'admin' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              As an admin, you can:
            </p>
            <div className="space-y-2">
              <a 
                href="/admin" 
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Admin Dashboard
              </a>
              <button 
                onClick={() => window.location.reload()} 
                className="block w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}