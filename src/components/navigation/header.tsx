'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { SearchIcon, MenuIcon, XIcon, UserIcon } from 'lucide-react'
import { SearchModal } from '../search/search-modal'
import { VersionSelector } from './version-selector'
import { ThemeToggle } from '../theme-toggle'

interface HeaderProps {
  versionName?: string
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function Header({ versionName, onMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { data: session } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Documentation
              </h1>
              {versionName && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  • {versionName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Search...</span>
            </button>

            <VersionSelector currentVersion={versionName} />
            <ThemeToggle />

            {session?.user && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden sm:inline text-sm text-slate-700 dark:text-slate-300">
                    {session.user.name || session.user.email}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      {session.user.email}
                    </div>
                    {(session.user as any).role === 'admin' && (
                      <a
                        href="/admin"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Admin Panel
                      </a>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        versionName={versionName}
      />
    </>
  )
}