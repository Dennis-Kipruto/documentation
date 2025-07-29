'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-50">
        <SunIcon className="w-5 h-5 text-slate-500" />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
      ) : (
        <MoonIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      )}
    </button>
  )
}