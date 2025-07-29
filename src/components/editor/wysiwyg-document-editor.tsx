'use client'

import { useState, useEffect, useCallback } from 'react'
import { RichTextEditor } from './rich-text-editor'
import { convertHtmlToMarkdown, convertMarkdownToHtml } from '@/lib/markdown-converter'
import { 
  Eye, 
  Edit, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react'

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

interface WysiwygDocumentEditorProps {
  document: DocumentDetail
  onSave: (updatedDocument: Partial<DocumentDetail>) => Promise<void>
  onTitleChange?: (title: string) => void
}

export function WysiwygDocumentEditor({ 
  document, 
  onSave, 
  onTitleChange 
}: WysiwygDocumentEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [editTitle, setEditTitle] = useState(document.title)
  const [htmlContent, setHtmlContent] = useState('')
  const [markdownContent, setMarkdownContent] = useState('')
  const [previewContent, setPreviewContent] = useState('')

  // Initialize editor content
  useEffect(() => {
    const initializeContent = async () => {
      setIsLoading(true)
      try {
        if (document.rawContent) {
          // Convert existing markdown to HTML for editing
          const { html } = await convertMarkdownToHtml(document.rawContent)
          setHtmlContent(html)
          setMarkdownContent(document.rawContent)
          setPreviewContent(document.content)
        } else if (document.content) {
          // Use existing HTML content
          setHtmlContent(document.content)
          setPreviewContent(document.content)
          // Convert to markdown for storage
          const markdown = convertHtmlToMarkdown(document.content, {
            preserveFrontmatter: true,
            title: document.title,
            order: document.order
          })
          setMarkdownContent(markdown)
        }
      } catch (error) {
        console.error('Error initializing content:', error)
        setHtmlContent('<p>Error loading content</p>')
      } finally {
        setIsLoading(false)
      }
    }

    initializeContent()
  }, [document])

  // Handle content changes from the rich text editor
  const handleContentChange = useCallback((newHtmlContent: string) => {
    setHtmlContent(newHtmlContent)
    setSaveStatus('idle')
    
    // Convert to markdown for storage
    const markdown = convertHtmlToMarkdown(newHtmlContent, {
      preserveFrontmatter: true,
      title: editTitle,
      order: document.order
    })
    setMarkdownContent(markdown)
  }, [editTitle, document.order])

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setEditTitle(newTitle)
    onTitleChange?.(newTitle)
    setSaveStatus('idle')
    
    // Update markdown with new title
    const markdown = convertHtmlToMarkdown(htmlContent, {
      preserveFrontmatter: true,
      title: newTitle,
      order: document.order
    })
    setMarkdownContent(markdown)
  }, [htmlContent, document.order, onTitleChange])

  // Save document
  const handleSave = useCallback(async () => {
    if (isSaving) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      // Process the HTML content for preview
      const { html: processedHtml } = await convertMarkdownToHtml(markdownContent)
      
      await onSave({
        title: editTitle,
        content: processedHtml,
        rawContent: markdownContent
      })
      
      setPreviewContent(processedHtml)
      setSaveStatus('saved')
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error saving document:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }, [editTitle, markdownContent, onSave, isSaving])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Toggle preview mode
  const togglePreview = useCallback(async () => {
    if (!isPreview) {
      // Generate fresh preview content
      try {
        const { html } = await convertMarkdownToHtml(markdownContent)
        setPreviewContent(html)
      } catch (error) {
        console.error('Error generating preview:', error)
      }
    }
    setIsPreview(!isPreview)
  }, [isPreview, markdownContent])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-xl font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Document title"
            />
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {document.chapter.module.version.displayName} → {document.chapter.module.displayName} → {document.chapter.displayName}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save Status */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-blue-600">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Error</span>
                  </>
                )}
              </div>
            )}
            
            {/* Toggle Preview */}
            <button
              onClick={togglePreview}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${ 
                isPreview
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {isPreview ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          // Preview Mode
          <div className="h-full overflow-y-auto bg-white dark:bg-slate-800 p-6">
            <div className="max-w-4xl mx-auto">
              <div 
                className="prose prose-lg prose-enhanced max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>
        ) : (
          // Edit Mode - Rich Text Editor
          <div className="h-full p-4 bg-slate-50 dark:bg-slate-900">
            <RichTextEditor
              content={htmlContent}
              onChange={handleContentChange}
              onSave={handleSave}
              placeholder="Start writing your document..."
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}