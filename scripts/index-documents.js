const { PrismaClient } = require('@prisma/client')
const { MeiliSearch } = require('meilisearch')

const prisma = new PrismaClient()
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'netra-doc-secure-key-2025-change-in-production',
})

const INDEX_NAME = 'documents'

async function indexAllDocuments() {
  try {
    console.log('Starting document indexing...')

    // Create or get index with primary key
    try {
      await client.createIndex(INDEX_NAME, { primaryKey: 'id' })
      console.log('Created new index')
    } catch (error) {
      console.log('Index already exists')
    }
    
    const index = client.index(INDEX_NAME)

    // Configure searchable attributes and ranking rules
    await index.updateSettings({
      filterableAttributes: ['versionId', 'moduleId', 'chapterId'],
      searchableAttributes: ['title', 'content', 'versionName', 'moduleName', 'chapterName'],
      displayedAttributes: ['id', 'title', 'content', 'versionId', 'versionName', 'moduleId', 'moduleName', 'chapterId', 'chapterName', 'url', 'updatedAt'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ],
      stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      synonyms: {
        'payment': ['pay', 'transaction', 'billing'],
        'api': ['endpoint', 'interface'],
        'auth': ['authentication', 'login', 'credentials']
      }
    })

    // Get all documents with related data
    const documents = await prisma.document.findMany({
      include: {
        chapter: {
          include: {
            module: {
              include: {
                version: true
              }
            }
          }
        }
      }
    })

    console.log(`Found ${documents.length} documents to index`)

    // Transform documents for Meilisearch
    const searchDocuments = documents.map(doc => {
      const version = doc.chapter.module.version
      const module = doc.chapter.module
      const chapter = doc.chapter

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content.replace(/<[^>]*>/g, ''), // Strip HTML tags
        versionId: version.id,
        versionName: version.name,
        moduleId: module.id,
        moduleName: module.displayName,
        chapterId: chapter.id,
        chapterName: chapter.displayName,
        url: `/docs/${version.name}/${module.name}/${chapter.name}/${doc.filename.replace('.md', '')}`,
        updatedAt: doc.updatedAt.toISOString()
      }
    })

    // Add documents to Meilisearch
    const task = await index.addDocuments(searchDocuments)
    console.log(`Indexing task created: ${task.taskUid}`)

    // Give it a moment to process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Document indexing initiated successfully!')
    console.log(`${searchDocuments.length} documents sent for indexing`)
    
    // Show index stats after a delay
    try {
      const stats = await index.getStats()
      console.log(`Index stats: ${stats.numberOfDocuments} documents indexed`)
    } catch (error) {
      console.log('Index is still processing...')
    }

  } catch (error) {
    console.error('Error indexing documents:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  indexAllDocuments()
}

module.exports = { indexAllDocuments }