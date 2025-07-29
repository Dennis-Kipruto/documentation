'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/toast'

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; displayName: string }) => Promise<boolean>
  type: 'module' | 'chapter' | 'document'
  title: string
  parentName?: string
}

export function CreateItemModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  title,
  parentName
}: CreateItemModalProps) {
  const { error } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    displayName: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.displayName.trim()) {
      error('Both name and display name are required')
      return
    }

    // Validate name format (folder-friendly)
    const nameRegex = /^[a-z0-9\-_]+$/
    if (!nameRegex.test(formData.name)) {
      error('Name can only contain lowercase letters, numbers, hyphens, and underscores')
      return
    }

    setIsLoading(true)
    try {
      const success = await onSubmit(formData)
      if (success) {
        handleClose()
      }
    } catch (err) {
      console.error('Error creating item:', err)
      error(`Failed to create ${type}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', displayName: '' })
    onClose()
  }

  const handleNameChange = (value: string) => {
    // Auto-generate folder name from display name if name is empty
    const folderName = value
      .toLowerCase()
      .replace(/[^a-z0-9\s\-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
    
    setFormData(prev => ({
      displayName: value,
      name: prev.name || folderName
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {parentName && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Creating in: <span className="font-medium text-slate-900 dark:text-white">{parentName}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${type} display name`}
              disabled={isLoading}
              autoFocus
            />
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The human-readable name shown in navigation
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={`${type}-folder-name`}
              disabled={isLoading}
              pattern="[a-z0-9\-_]+"
              title="Only lowercase letters, numbers, hyphens, and underscores allowed"
            />
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Used for URLs and file system (lowercase, hyphens, underscores only)
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.displayName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}