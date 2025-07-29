'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  DocumentIcon, 
  TrashIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/toast'
import { Header } from '@/components/navigation/header'

interface MediaFile {
  name: string
  path: string
  type: 'image' | 'video' | 'document' | 'other'
  size: number
  lastModified: string
  url: string
}

interface MediaResponse {
  files: MediaFile[]
  totalSize: number
  count: number
}

const FILE_TYPE_ICONS = {
  image: PhotoIcon,
  video: VideoCameraIcon,
  document: DocumentIcon,
  other: DocumentIcon
}

const FILE_TYPE_COLORS = {
  image: 'text-green-600 dark:text-green-400',
  video: 'text-blue-600 dark:text-blue-400',
  document: 'text-purple-600 dark:text-purple-400',
  other: 'text-slate-600 dark:text-slate-400'
}

export default function MediaLibraryPage() {
  const { data: session } = useSession()
  const { success, error } = useToast()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<MediaFile['type'] | 'all'>('all')
  const [currentPath] = useState('')
  const [totalSize, setTotalSize] = useState(0)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/login')
  }

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentPath) params.set('path', currentPath)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      
      const response = await fetch(`/api/admin/media?${params}`)
      if (response.ok) {
        const data: MediaResponse = await response.json()
        setFiles(data.files)
        setTotalSize(data.totalSize)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [currentPath, typeFilter])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', currentPath)

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchFiles()
        event.target.value = '' // Reset input
        success('File uploaded successfully!')
      } else {
        const errorData = await response.json()
        error(`Upload failed: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error uploading file:', err)
      error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return

    try {
      const response = await fetch(`/api/admin/media/delete?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchFiles()
        setSelectedFile(null)
        success('File deleted successfully!')
      } else {
        const errorData = await response.json()
        error(`Delete failed: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error deleting file:', err)
      error('Delete failed')
    }
  }

  const copyMarkdownSyntax = async (file: MediaFile) => {
    const syntax = file.type === 'image' 
      ? `![${file.name}](${file.name})`
      : file.type === 'video'
      ? `<video src="${file.name}" controls></video>`
      : `[${file.name}](${file.name})`
    
    try {
      await navigator.clipboard.writeText(syntax)
      success('Markdown syntax copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      error('Failed to copy markdown syntax')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Media Library
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage images, videos, and documents for your documentation
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <a href="/admin" className="hover:text-slate-700 dark:hover:text-slate-300">
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Files</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{files.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Size</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatFileSize(totalSize)}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">Images</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {files.filter(f => f.type === 'image').length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">Videos</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {files.filter(f => f.type === 'video').length}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Upload */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <ArrowUpTrayIcon className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Upload File'}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.txt,.csv,.json,.xml"
                />
              </label>
              
              {currentPath && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Uploading to: <span className="font-mono">{currentPath}</span>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as MediaFile['type'] | 'all')}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* File Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {filter ? 'No files match your search' : 'No media files found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
              {filteredFiles.map((file) => {
                const IconComponent = FILE_TYPE_ICONS[file.type]
                const iconColor = FILE_TYPE_COLORS[file.type]
                
                return (
                  <div
                    key={file.path}
                    className="group relative bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    {/* File Preview */}
                    <div className="aspect-square bg-white dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <IconComponent className={`w-12 h-12 ${iconColor}`} />
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="text-sm">
                      <div className="font-medium text-slate-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyMarkdownSyntax(file)
                          }}
                          className="p-1 bg-white dark:bg-slate-800 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                          title="Copy markdown syntax"
                        >
                          <ClipboardIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile(file)
                          }}
                          className="p-1 bg-white dark:bg-slate-800 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900"
                          title="Delete file"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* File Details Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </h3>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>
                
                {/* File Preview */}
                <div className="mb-4">
                  {selectedFile.type === 'image' ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  ) : selectedFile.type === 'video' ? (
                    <video
                      src={selectedFile.url}
                      controls
                      className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
                      <DocumentIcon className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
                
                {/* File Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Size:</span>
                    <span className="text-slate-900 dark:text-white">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Type:</span>
                    <span className="text-slate-900 dark:text-white capitalize">{selectedFile.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Path:</span>
                    <span className="text-slate-900 dark:text-white font-mono text-xs">{selectedFile.path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Modified:</span>
                    <span className="text-slate-900 dark:text-white">
                      {new Date(selectedFile.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => copyMarkdownSyntax(selectedFile)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                    Copy Markdown
                  </button>
                  <button
                    onClick={() => window.open(selectedFile.url, '_blank')}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteFile(selectedFile)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}