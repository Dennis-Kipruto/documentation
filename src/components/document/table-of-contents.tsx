'use client'

import { useEffect, useState } from 'react'
import { ChevronRightIcon } from 'lucide-react'

interface TocItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const items: TocItem[] = []

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      const title = heading.textContent || ''
      const id = heading.id || `heading-${index}`
      
      // Ensure heading has an ID for scrolling
      if (!heading.id) {
        heading.id = id
      }

      items.push({ id, title, level })
    })

    setTocItems(items)

    // Update the actual DOM content with IDs
    const mainContent = document.querySelector('[data-document-content]')
    if (mainContent) {
      mainContent.innerHTML = tempDiv.innerHTML
    }
  }, [content])

  useEffect(() => {
    const scrollContainer = document.querySelector('main div.overflow-y-auto')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        root: scrollContainer,
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0
      }
    )

    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [tocItems])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // Find the scrollable container (div inside main element)
      const scrollContainer = document.querySelector('main div.overflow-y-auto') || document.documentElement
      const containerRect = scrollContainer.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      // Calculate scroll position accounting for the container and some offset
      const scrollTop = scrollContainer.scrollTop + elementRect.top - containerRect.top - 80
      
      scrollContainer.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  if (tocItems.length === 0) {
    return null
  }

  return (
    <div className="sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
          <ChevronRightIcon className="w-4 h-4 mr-1" />
          Table of Contents
        </h3>
        
        <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`block w-full text-left text-sm transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                activeId === item.id 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              style={{ 
                paddingLeft: `${(item.level - 1) * 12}px`,
                paddingTop: '4px',
                paddingBottom: '4px'
              }}
            >
              {item.title}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}