'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  PlusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/toast'

interface EditableItemProps {
  id: string
  name: string
  displayName: string
  type: 'module' | 'chapter'
  onUpdate: (id: string, data: { name?: string; displayName?: string }) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onAdd?: () => void
  canDelete?: boolean
  children?: React.ReactNode
  icon?: React.ReactNode
}

export function EditableItem({
  id,
  name,
  displayName,
  type,
  onUpdate,
  onDelete,
  onAdd,
  canDelete = true,
  children,
  icon
}: EditableItemProps) {
  const { success, error } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const [editDisplayName, setEditDisplayName] = useState(displayName)
  const [isLoading, setIsLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const displayNameInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleSave = async () => {
    if (!editName.trim() || !editDisplayName.trim()) {
      error('Both name and display name are required')
      return
    }

    if (editName === name && editDisplayName === displayName) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      const updates: { name?: string; displayName?: string } = {}
      
      if (editName !== name) updates.name = editName.trim()
      if (editDisplayName !== displayName) updates.displayName = editDisplayName.trim()

      const success_result = await onUpdate(id, updates)
      if (success_result) {
        setIsEditing(false)
        success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`)
      }
    } catch (err) {
      console.error('Error updating item:', err)
      error(`Failed to update ${type}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditName(name)
    setEditDisplayName(displayName)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      const success_result = await onDelete(id)
      if (success_result) {
        success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`)
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      error(`Failed to delete ${type}`)
    } finally {
      setIsLoading(false)
      setShowMenu(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="group">
        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-2 border-blue-200 dark:border-blue-700">
          <div className="flex-1 space-y-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Folder Name (for URLs)
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${type} folder name`}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Display Name
              </label>
              <input
                ref={displayNameInputRef}
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${type} display name`}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="ml-3 flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={isLoading || !editName.trim() || !editDisplayName.trim()}
              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors disabled:opacity-50"
              title="Save changes"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors disabled:opacity-50"
              title="Cancel editing"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {children && (
          <div className="ml-6 mt-2">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <div className="flex items-center flex-1 min-w-0">
          {icon}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
              {displayName}
            </div>
            {name !== displayName && (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                /{name}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAdd && (
            <button
              onClick={onAdd}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
              title={`Add ${type === 'module' ? 'chapter' : 'document'}`}
            >
              <PlusIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </button>
          )}
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              title="More options"
            >
              <EllipsisVerticalIcon className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <PencilIcon className="w-3 h-3" />
                  Edit
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <TrashIcon className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {children && (
        <div className="ml-6 mt-1">
          {children}
        </div>
      )}
    </div>
  )
}