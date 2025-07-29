// Use dynamic import to avoid webpack issues
async function getClient() {
  const { MeiliSearch } = await import('meilisearch')
  return new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || 'netra-doc-secure-key-2025-change-in-production',
  })
}

const INDEX_NAME = 'documents'

export interface MeiliSearchDocument {
  id: string
  title: string
  content: string
  versionId: string
  versionName: string
  moduleId: string
  moduleName: string
  chapterId: string
  chapterName: string
  url: string
  updatedAt: string
}

export interface SearchResult {
  id: string
  title: string
  excerpt: string
  versionId: string
  versionName: string
  moduleId: string
  moduleName: string
  chapterId: string
  chapterName: string
  url: string
}

export async function searchDocuments(
  query: string,
  versionId?: string,
  limit = 50
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  try {
    const client = await getClient()
    const index = client.index(INDEX_NAME)
    
    // Temporarily disable filtering to avoid errors - TODO: re-enable when stable
    const searchResults = await index.search(query, {
      limit,
      attributesToHighlight: ['title', 'content'],
      attributesToCrop: ['content'],
      cropLength: 200,
      showMatchesPosition: true
    })

    return searchResults.hits.map((hit: any) => ({
      id: hit.id,
      title: hit.title,
      excerpt: hit._formatted?.content || hit.content.slice(0, 200),
      versionId: hit.versionId,
      versionName: hit.versionName,
      moduleId: hit.moduleId,
      moduleName: hit.moduleName,
      chapterId: hit.chapterId,
      chapterName: hit.chapterName,
      url: hit.url
    }))

  } catch (error) {
    console.error('Meilisearch error:', error)
    return []
  }
}

export async function addDocument(document: MeiliSearchDocument): Promise<void> {
  try {
    const client = await getClient()
    const index = client.index(INDEX_NAME)
    
    // Ensure index exists with correct primary key and settings
    try {
      await index.getSettings()
    } catch {
      // Index doesn't exist, create it
      await client.createIndex(INDEX_NAME, { primaryKey: 'id' })
      
      // Configure filterable attributes
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
        ]
      })
    }
    
    await index.addDocuments([document])
  } catch (error) {
    console.error('Error adding document to Meilisearch:', error)
  }
}

export async function updateDocument(document: MeiliSearchDocument): Promise<void> {
  try {
    const client = await getClient()
    const index = client.index(INDEX_NAME)
    await index.addDocuments([document]) // addDocuments handles updates too
  } catch (error) {
    console.error('Error updating document in Meilisearch:', error)
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const client = await getClient()
    const index = client.index(INDEX_NAME)
    await index.deleteDocument(documentId)
  } catch (error) {
    console.error('Error deleting document from Meilisearch:', error)
  }
}

export async function getSuggestions(query: string, limit = 5): Promise<string[]> {
  if (!query.trim()) return []

  try {
    const client = await getClient()
    const index = client.index(INDEX_NAME)
    const results = await index.search(query, {
      limit,
      attributesToRetrieve: ['title']
    })

    return results.hits.map((hit: any) => hit.title)
  } catch (error) {
    console.error('Error getting suggestions:', error)
    return []
  }
}