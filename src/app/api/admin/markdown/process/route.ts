import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'

// Custom rehype plugin to handle local media files
function rehypeLocalMedia() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'img' && node.properties?.src) {
        const src = node.properties.src
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          node.properties.src = `/docs-media/${src}`
        }
        node.properties.className = (node.properties.className || []).concat([
          'max-w-full',
          'h-auto',
          'rounded-lg',
          'shadow-sm',
          'border',
          'border-slate-200',
          'dark:border-slate-700'
        ])
      }
      
      if (node.tagName === 'video' && node.properties?.src) {
        const src = node.properties.src
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          node.properties.src = `/docs-media/${src}`
        }
        node.properties.controls = true
        node.properties.className = (node.properties.className || []).concat([
          'max-w-full',
          'h-auto',
          'rounded-lg',
          'shadow-sm',
          'border',
          'border-slate-200',
          'dark:border-slate-700'
        ])
      }
    })
  }
}

async function processMarkdown(content: string) {
  const { data, content: markdown } = matter(content)
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeLocalMedia)
    .use(rehypeHighlight)
    .use(rehypeStringify)

  const result = await processor.process(markdown)
  
  return {
    html: result.toString(),
    data: data
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { content } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    const result = await processMarkdown(content)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing markdown:', error)
    return NextResponse.json({ error: 'Failed to process markdown' }, { status: 500 })
  }
}