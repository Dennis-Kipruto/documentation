'use client'

import { SearchIcon } from 'lucide-react'

interface InlineSearchProps {
  placeholder: string
  targetSelector: string
  titleSelector: string
}

export function InlineSearch({ placeholder, targetSelector, titleSelector }: InlineSearchProps) {
  const handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    const searchTerm = e.currentTarget.value.toLowerCase()
    const cards = document.querySelectorAll(targetSelector)
    
    cards.forEach(card => {
      const title = card.querySelector(titleSelector)?.textContent?.toLowerCase() || ''
      const shouldShow = title.includes(searchTerm)
      ;(card as HTMLElement).style.display = shouldShow ? 'block' : 'none'
    })
  }

  return (
    <div className="relative max-w-md">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onInput={handleSearch}
      />
    </div>
  )
}