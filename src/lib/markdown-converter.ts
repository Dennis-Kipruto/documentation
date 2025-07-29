import TurndownService from 'turndown'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'
import matter from 'gray-matter'

// Configure Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
  bulletListMarker: '-',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full'
})

// Custom rules for better markdown conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: function (content) {
    return '~~' + content + '~~'
  }
})

turndownService.addRule('codeBlock', {
  filter: function (node) {
    return !!(
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },
  replacement: function (content, node) {
    const className = (node.firstChild as HTMLElement)?.getAttribute('class') || ''
    const language = className.replace(/.*language-(\w+).*/, '$1')
    return '\n\n```' + language + '\n' + ((node.firstChild as HTMLElement)?.textContent || '') + '\n```\n\n'
  }
})

turndownService.addRule('table', {
  filter: 'table',
  replacement: function (content, node) {
    const rows = Array.from(node.querySelectorAll('tr'))
    let markdown = '\n\n'
    
    rows.forEach((row, index) => {
      const cells = Array.from(row.querySelectorAll('td, th'))
      const cellContents = cells.map(cell => cell.textContent?.trim() || '')
      markdown += '| ' + cellContents.join(' | ') + ' |\n'
      
      // Add header separator after first row
      if (index === 0) {
        markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n'
      }
    })
    
    return markdown + '\n'
  }
})

// Custom rehype plugin to handle local media files
function rehypeLocalMedia() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      // Handle images
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
      
      // Handle videos
      if (node.tagName === 'video' && node.properties?.src) {
        const src = node.properties.src
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          node.properties.src = `/docs-media/${src}`
        }
        node.properties.className = (node.properties.className || []).concat([
          'max-w-full',
          'h-auto',
          'rounded-lg',
          'border',
          'border-slate-200',
          'dark:border-slate-700'
        ])
        // Ensure videos have controls
        node.properties.controls = true
      }
    })
  }
}

export interface ConversionOptions {
  preserveFrontmatter?: boolean
  title?: string
  description?: string
  order?: number
}

export class MarkdownConverter {
  /**
   * Convert HTML to Markdown
   */
  static htmlToMarkdown(html: string, options: ConversionOptions = {}): string {
    const markdown = turndownService.turndown(html)
    
    if (options.preserveFrontmatter) {
      const frontmatter = {
        title: options.title || 'Untitled',
        description: options.description || '',
        order: options.order || 1
      }
      
      return matter.stringify(markdown, frontmatter)
    }
    
    return markdown
  }

  /**
   * Convert Markdown to HTML
   */
  static async markdownToHtml(markdown: string): Promise<{ html: string; data: any }> {
    const { data, content } = matter(markdown)
    
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeLocalMedia)
      .use(rehypeStringify)

    const result = await processor.process(content)
    
    return {
      html: result.toString(),
      data: data
    }
  }

  /**
   * Extract plain text from HTML (for search indexing)
   */
  static htmlToPlainText(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Convert Tiptap JSON to Markdown
   */
  static tiptapJsonToMarkdown(_json: any): string {
    // First convert JSON to HTML using Tiptap's generateHTML
    // Then convert HTML to Markdown
    // Note: This would require server-side rendering or a more complex setup
    // For now, we'll work with HTML content directly
    return ''
  }

  /**
   * Validate markdown content
   */
  static validateMarkdown(markdown: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    try {
      matter(markdown)
    } catch (error) {
      errors.push('Invalid frontmatter: ' + (error instanceof Error ? error.message : String(error)))
    }
    
    // Check for common markdown issues
    if (markdown.includes('](') && !markdown.includes(')')) {
      errors.push('Unclosed link detected')
    }
    
    if (markdown.includes('![') && !markdown.includes(')')) {
      errors.push('Unclosed image link detected')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Utility functions for common operations
export const convertHtmlToMarkdown = (html: string, options?: ConversionOptions) => 
  MarkdownConverter.htmlToMarkdown(html, options)

export const convertMarkdownToHtml = (markdown: string) => 
  MarkdownConverter.markdownToHtml(markdown)

export const extractPlainText = (html: string) => 
  MarkdownConverter.htmlToPlainText(html)

export const validateMarkdown = (markdown: string) => 
  MarkdownConverter.validateMarkdown(markdown)