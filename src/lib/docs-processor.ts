import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'
import { prisma } from './db'

const DOCS_DIR = path.join(process.cwd(), 'docs')

export interface DocumentMeta {
  title: string
  description?: string
  order?: number
  draft?: boolean
  tags?: string[]
}

export interface ProcessedDocument {
  title: string
  content: string
  rawContent: string
  excerpt?: string
  meta: DocumentMeta
  filename: string
  path: string
}

// Custom rehype plugin to handle local media files
function rehypeLocalMedia() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'img' && node.properties?.src) {
        const src = node.properties.src
        // Handle relative paths for local images
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          node.properties.src = `/docs-media/${src}`
        }
        // Add responsive classes
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
        // Handle relative paths for local videos
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
          node.properties.src = `/docs-media/${src}`
        }
        // Add responsive classes and controls
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

export async function processMarkdown(content: string): Promise<{
  html: string
  data: DocumentMeta
}> {
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
    data: data as DocumentMeta
  }
}

export async function scanDocsDirectory(): Promise<void> {
  if (!fs.existsSync(DOCS_DIR)) {
    console.log('Creating docs directory...')
    fs.mkdirSync(DOCS_DIR, { recursive: true })
    
    // Create sample structure
    const sampleStructure = {
      'v1.0': {
        'getting-started': {
          'introduction': {
            'overview.md': `---
title: "Overview"
description: "Introduction to the documentation system"
order: 1
---

# Overview

Welcome to the documentation system. This is a comprehensive platform for managing versioned documentation with user access control.

## Features

- **Version Control**: Multiple versions of documentation
- **Access Control**: Role-based permissions
- **Search**: Full-text search across all documents
- **Media Support**: Images and videos embedded in documentation
- **Responsive Design**: Works on all devices
- **Dark Mode**: Toggle between light and dark themes

## Media Support

This documentation system supports various media types:

### Images

You can embed images using standard markdown syntax:

\`\`\`markdown
![Alt text](image.jpg)
\`\`\`

The system automatically handles:
- Responsive sizing
- Dark mode compatibility
- Proper styling with borders and shadows

### Videos

Video files are also supported:

\`\`\`markdown
<video src="demo.mp4" controls></video>
\`\`\`

Supported formats: MP4, WebM, OGG

## Getting Started

To get started, explore the different sections of the documentation using the navigation menu.`,
            'installation.md': `---
title: "Installation"
description: "How to install and set up the system"
order: 2
---

# Installation

This guide will help you install and configure the documentation system.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- SQLite database

## Installation Steps

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Set up the database: \`npx prisma db push\`
4. Start the development server: \`npm run dev\`

## Configuration

Configure your environment variables in the \`.env\` file:

\`\`\`bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
\`\`\`

## Media Files

Place your media files in the same directory as your markdown files or use relative paths. The system will automatically serve them at \`/docs-media/\` URLs.

### Supported File Types

- **Images**: JPG, PNG, GIF, WebP, SVG
- **Videos**: MP4, WebM, OGG, MOV, AVI
- **Documents**: PDF, TXT, CSV, JSON, XML

### Best Practices

1. Use descriptive filenames
2. Optimize images for web (compress them)
3. Provide alt text for accessibility
4. Use appropriate video codecs for web compatibility
`
          }
        },
        'api-reference': {
          'authentication': {
            'overview.md': `---
title: "Authentication"
description: "How authentication works"
order: 1
---

# Authentication

The system uses NextAuth.js for authentication with email-based sign-in.

## Sign In Process

1. User enters their email address
2. System sends a magic link to their email
3. User clicks the link to sign in
4. Session is created and user is redirected

## Permissions

Users can have different permission levels:
- **Admin**: Full access to all documentation and admin features
- **User**: Access to specific versions/modules based on assigned permissions
`
          }
        }
      }
    }
    
    createSampleStructure(DOCS_DIR, sampleStructure)
  }
  
  console.log('Scanning docs directory...')
  await syncDocsWithDatabase()
}

function createSampleStructure(basePath: string, structure: any, currentPath = '') {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(basePath, currentPath, key)
    
    if (typeof value === 'string') {
      // It's a file
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      fs.writeFileSync(fullPath, value)
    } else {
      // It's a directory
      fs.mkdirSync(fullPath, { recursive: true })
      createSampleStructure(basePath, value, path.join(currentPath, key))
    }
  }
}

async function syncDocsWithDatabase() {
  const versions = fs.readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const versionName of versions) {
    if (versionName === 'shared') continue // Skip shared assets folder
    
    const versionPath = path.join(DOCS_DIR, versionName)
    
    // Create or update version
    const version = await prisma.version.upsert({
      where: { name: versionName },
      update: { displayName: versionName },
      create: {
        name: versionName,
        displayName: versionName,
        order: versions.indexOf(versionName)
      }
    })
    
    // Process modules
    const modules = fs.readdirSync(versionPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    for (const moduleName of modules) {
      const modulePath = path.join(versionPath, moduleName)
      
      const module = await prisma.module.upsert({
        where: { versionId_name: { versionId: version.id, name: moduleName } },
        update: { displayName: moduleName },
        create: {
          name: moduleName,
          displayName: moduleName,
          versionId: version.id,
          order: modules.indexOf(moduleName)
        }
      })
      
      // Process chapters
      const chapters = fs.readdirSync(modulePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
      
      for (const chapterName of chapters) {
        const chapterPath = path.join(modulePath, chapterName)
        
        const chapter = await prisma.chapter.upsert({
          where: { moduleId_name: { moduleId: module.id, name: chapterName } },
          update: { displayName: chapterName },
          create: {
            name: chapterName,
            displayName: chapterName,
            moduleId: module.id,
            order: chapters.indexOf(chapterName)
          }
        })
        
        // Process documents
        const files = fs.readdirSync(chapterPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
          .map(dirent => dirent.name)
        
        for (const filename of files) {
          const filePath = path.join(chapterPath, filename)
          const content = fs.readFileSync(filePath, 'utf-8')
          
          const { html, data } = await processMarkdown(content)
          
          const title = data.title || filename.replace('.md', '')
          const excerpt = data.description || html.slice(0, 200).replace(/<[^>]*>/g, '')
          
          await prisma.document.upsert({
            where: { chapterId_filename: { chapterId: chapter.id, filename } },
            update: {
              title,
              content: html,
              rawContent: content,
              excerpt,
              order: data.order || files.indexOf(filename)
            },
            create: {
              filename,
              title,
              content: html,
              rawContent: content,
              excerpt,
              chapterId: chapter.id,
              order: data.order || files.indexOf(filename)
            }
          })
          

          // Note: Search indexing is handled by Meilisearch via separate scripts
        }
      }
    }
  }
  
  console.log('Documentation sync completed')
}

export async function getDocumentsByVersion(versionId: string) {
  return await prisma.version.findUnique({
    where: { id: versionId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          chapters: {
            orderBy: { order: 'asc' },
            include: {
              documents: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    }
  })
}

export async function getDocument(versionName: string, moduleName: string, chapterName: string, filename: string) {
  const version = await prisma.version.findUnique({
    where: { name: versionName },
    include: {
      modules: {
        where: { name: moduleName },
        include: {
          chapters: {
            where: { name: chapterName },
            include: {
              documents: {
                where: { filename },
                include: {
                  publishedBy: {
                    select: { id: true, name: true, email: true }
                  },
                  updatedBy: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  
  return version?.modules[0]?.chapters[0]?.documents[0]
}

export async function getAllVersions() {
  return await prisma.version.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  })
}