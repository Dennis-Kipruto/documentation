'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  FolderIcon, 
  DocumentIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { WysiwygDocumentEditor } from '@/components/editor/wysiwyg-document-editor'
import { EditableItem } from '@/components/admin/editable-item'
import { CreateItemModal } from '@/components/admin/create-item-modal'
import { useToast } from '@/components/ui/toast'

interface Version {
  id: string
  name: string
  displayName: string
  modules: Module[]
}

interface Module {
  id: string
  name: string
  displayName: string
  chapters: Chapter[]
}

interface Chapter {
  id: string
  name: string
  displayName: string
  documents: DocumentSummary[]
}

interface DocumentSummary {
  id: string
  filename: string
  title: string
  excerpt: string
  order: number
  chapterId: string
}

interface DocumentDetail {
  id: string
  filename: string
  title: string
  content: string
  rawContent: string
  order: number
  chapterId: string
  chapter: {
    id: string
    name: string
    displayName: string
    module: {
      id: string
      name: string
      displayName: string
      version: {
        id: string
        name: string
        displayName: string
      }
    }
  }
}

export default function EditorPage() {
  const { data: session } = useSession()
  const { success, error } = useToast()
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [useWysiwyg, setUseWysiwyg] = useState(true)
  const [createForm, setCreateForm] = useState({
    title: '',
    filename: '',
    chapterId: ''
  })
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false)
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false)
  const [createModuleVersionId, setCreateModuleVersionId] = useState('')
  const [createChapterModuleId, setCreateChapterModuleId] = useState('')

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/login')
  }

  const fetchVersions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/documents')
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
        if (data.length > 0 && !selectedVersion) {
          await loadVersion(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/admin/documents?versionId=${versionId}`)
      if (response.ok) {
        const version = await response.json()
        setSelectedVersion(version)
        setVersions(prev => prev.map(v => v.id === versionId ? version : v))
      }
    } catch (error) {
      console.error('Error loading version:', error)
    }
  }

  const loadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`)
      if (response.ok) {
        const document = await response.json()
        setSelectedDocument(document)
        setEditContent(document.rawContent)
        setEditTitle(document.title)
        setIsPreview(false)
      }
    } catch (error) {
      console.error('Error loading document:', error)
    }
  }

  const saveDocument = async (updatedData?: Partial<DocumentDetail>) => {
    if (!selectedDocument) return
    
    setIsSaving(true)
    try {
      const dataToSave = updatedData || {
        title: editTitle,
        content: editContent,
        rawContent: editContent
      }
      
      // Process markdown to HTML for preview if we have raw content
      if (dataToSave.rawContent && !dataToSave.content) {
        const processResponse = await fetch('/api/admin/markdown/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: dataToSave.rawContent })
        })
        
        if (processResponse.ok) {
          const { html } = await processResponse.json()
          dataToSave.content = html
        }
      }
      
      const response = await fetch(`/api/admin/documents/${selectedDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      })
      
      if (response.ok) {
        const updated = await response.json()
        setSelectedDocument({ ...selectedDocument, ...updated })
        if (updatedData?.title) {
          setEditTitle(updatedData.title)
        }
        if (updatedData?.rawContent) {
          setEditContent(updatedData.rawContent)
        }
        success('Document saved successfully!')
      } else {
        const errorData = await response.json()
        error(`Save failed: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error saving document:', err)
      error('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const createDocument = async () => {
    try {
      const response = await fetch('/api/admin/documents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...createForm,
          rawContent: `# ${createForm.title}\n\nYour content here...`,
          content: `<h1>${createForm.title}</h1><p>Your content here...</p>`
        })
      })
      
      if (response.ok) {
        const newDoc = await response.json()
        setShowCreateModal(false)
        setCreateForm({ title: '', filename: '', chapterId: '' })
        
        // Reload the version to show the new document
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        
        // Load the new document
        await loadDocument(newDoc.id)
      } else {
        const errorData = await response.json()
        error(`Create failed: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error creating document:', err)
      error('Create failed')
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Clear selection if deleting current document
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null)
          setEditContent('')
          setEditTitle('')
        }
        
        // Reload version
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        success('Document deleted successfully!')
      } else {
        const errorData = await response.json()
        error(`Delete failed: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error deleting document:', err)
      error('Delete failed')
    }
  }

  // Module management functions
  const createModule = async (data: { name: string; displayName: string }) => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, versionId: createModuleVersionId })
      })
      
      if (response.ok) {
        // Reload version to show new module
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        success('Module created successfully!')
        return true
      } else {
        const errorData = await response.json()
        error(`Create failed: ${errorData.error}`)
        return false
      }
    } catch (err) {
      console.error('Error creating module:', err)
      error('Create failed')
      return false
    }
  }

  const updateModule = async (moduleId: string, data: { name?: string; displayName?: string }) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        return true
      } else {
        const errorData = await response.json()
        error(`Update failed: ${errorData.error}`)
        return false
      }
    } catch (err) {
      console.error('Error updating module:', err)
      error('Update failed')
      return false
    }
  }

  const deleteModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        return true
      } else {
        const errorData = await response.json()
        error(`Delete failed: ${errorData.error}`)
        return false
      }
    } catch (err) {
      console.error('Error deleting module:', err)
      error('Delete failed')
      return false
    }
  }

  // Chapter management functions
  const createChapter = async (data: { name: string; displayName: string }) => {
    try {
      const response = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, moduleId: createChapterModuleId })
      })
      
      if (response.ok) {
        // Reload version to show new chapter
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        success('Chapter created successfully!')
        return true
      } else {
        const errorData = await response.json()
        error(`Create failed: ${errorData.error}`)
        return false
      }
    } catch (err) {
      console.error('Error creating chapter:', err)
      error('Create failed')
      return false
    }
  }

  const updateChapter = async (chapterId: string, data: { name?: string; displayName?: string }) => {
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        return true
      } else {
        const errorData = await response.json()
        error(`Update failed: ${errorData.error}`)
        return false
      }
    } catch (err) {
      console.error('Error updating chapter:', err)
      error('Update failed')
      return false
    }
  }

  const deleteChapter = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        if (selectedVersion) {
          await loadVersion(selectedVersion.id)
        }
        return true
      } else {
        const errorData = await response.json()
        error(`Delete failed: ${errorData.error}`)
        return false
      }
    } catch (err) {
      console.error('Error deleting chapter:', err)
      error('Delete failed')
      return false
    }
  }

  useEffect(() => {
    fetchVersions()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar - File Explorer */}
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Content Editor
            </h2>
            <Link
              href="/admin"
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              Back to Admin
            </Link>
          </div>
          
          {/* Version Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedVersion?.id || ''}
              onChange={(e) => loadVersion(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Select Version</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.displayName}
                </option>
              ))}
            </select>
            {selectedVersion && (
              <button
                onClick={() => {
                  setCreateModuleVersionId(selectedVersion.id)
                  setShowCreateModuleModal(true)
                }}
                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                title="Add Module"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedVersion ? (
            <div className="space-y-2">
              {selectedVersion.modules.map((module) => (
                <EditableItem
                  key={module.id}
                  id={module.id}
                  name={module.name}
                  displayName={module.displayName}
                  type="module"
                  onUpdate={updateModule}
                  onDelete={deleteModule}
                  onAdd={() => {
                    setCreateChapterModuleId(module.id)
                    setShowCreateChapterModal(true)
                  }}
                  icon={<FolderIcon className="w-4 h-4 mr-2" />}
                >
                  <div className="space-y-1">
                    {module.chapters.map((chapter) => (
                      <EditableItem
                        key={chapter.id}
                        id={chapter.id}
                        name={chapter.name}
                        displayName={chapter.displayName}
                        type="chapter"
                        onUpdate={updateChapter}
                        onDelete={deleteChapter}
                        onAdd={() => {
                          setCreateForm({ ...createForm, chapterId: chapter.id })
                          setShowCreateModal(true)
                        }}
                        icon={<FolderIcon className="w-3 h-3 mr-2" />}
                      >
                        <div className="space-y-1">
                          {chapter.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className={`group flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer transition-colors ${ 
                                selectedDocument?.id === doc.id
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                              onClick={() => loadDocument(doc.id)}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <DocumentIcon className="w-3 h-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{doc.title}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteDocument(doc.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-opacity"
                                title="Delete document"
                              >
                                <TrashIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </EditableItem>
                    ))}
                  </div>
                </EditableItem>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
              Select a version to view documents
            </div>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selectedDocument ? (
          <>
            {/* Editor Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white w-full"
                    placeholder="Document title"
                  />
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {selectedDocument.chapter.module.version.displayName} → {selectedDocument.chapter.module.displayName} → {selectedDocument.chapter.displayName}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Editor Mode Toggle */}
                  <button
                    onClick={() => setUseWysiwyg(!useWysiwyg)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      useWysiwyg
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    title={useWysiwyg ? 'Switch to Markdown Editor' : 'Switch to WYSIWYG Editor'}
                  >
                    {useWysiwyg ? <ArrowRightIcon className="w-4 h-4" /> : <ArrowLeftIcon className="w-4 h-4" />}
                    {useWysiwyg ? 'WYSIWYG' : 'Markdown'}
                  </button>
                  
                  {/* Preview Toggle (only for markdown mode) */}
                  {!useWysiwyg && (
                    <button
                      onClick={() => setIsPreview(!isPreview)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${ 
                        isPreview
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {isPreview ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      {isPreview ? 'Edit' : 'Preview'}
                    </button>
                  )}
                  
                  {/* Save Button (only for markdown mode) */}
                  {!useWysiwyg && (
                    <button
                      onClick={() => saveDocument()}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <DocumentArrowUpIcon className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden">
              {useWysiwyg ? (
                // WYSIWYG Editor Mode
                <div className="flex-1">
                  <WysiwygDocumentEditor
                    document={selectedDocument}
                    onSave={saveDocument}
                    onTitleChange={(title) => setEditTitle(title)}
                  />
                </div>
              ) : (
                // Traditional Markdown Editor Mode
                <>
                  {isPreview ? (
                    // Preview Mode
                    <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-800">
                      <div className="max-w-4xl mx-auto">
                        <div 
                          className="prose prose-lg prose-enhanced max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="flex-1 flex">
                      <div className="flex-1 p-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Write your markdown here..."
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          // Welcome Screen
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800">
            <div className="text-center">
              <DocumentIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No Document Selected
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Select a document from the sidebar to start editing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Create New Document
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter document title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={createForm.filename}
                  onChange={(e) => setCreateForm({ ...createForm, filename: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="filename.md"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createDocument}
                disabled={!createForm.title || !createForm.filename}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ title: '', filename: '', chapterId: '' })
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Module Modal */}
      <CreateItemModal
        isOpen={showCreateModuleModal}
        onClose={() => {
          setShowCreateModuleModal(false)
          setCreateModuleVersionId('')
        }}
        onSubmit={createModule}
        type="module"
        title="Create New Module"
        parentName={selectedVersion?.displayName}
      />

      {/* Create Chapter Modal */}
      <CreateItemModal
        isOpen={showCreateChapterModal}
        onClose={() => {
          setShowCreateChapterModal(false)
          setCreateChapterModuleId('')
        }}
        onSubmit={createChapter}
        type="chapter"
        title="Create New Chapter"
        parentName={selectedVersion?.modules.find(m => m.id === createChapterModuleId)?.displayName}
      />
    </div>
  )
}