'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'success' })
  }, [addToast])

  const error = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'error', duration: 7000 })
  }, [addToast])

  const warning = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'warning', duration: 6000 })
  }, [addToast])

  const info = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'info' })
  }, [addToast])

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { id, title, message, type } = toast

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-800 dark:text-green-200',
      messageColor: 'text-green-700 dark:text-green-300'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-800 dark:text-red-200',
      messageColor: 'text-red-700 dark:text-red-300'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
      messageColor: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-200',
      messageColor: 'text-blue-700 dark:text-blue-300'
    }
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} 
      border rounded-lg p-4 shadow-lg transition-all duration-300 
      transform translate-x-0 opacity-100 max-w-sm w-full
      animate-in slide-in-from-right-5 fade-in duration-300
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h4 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${config.messageColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onRemove(id)}
            className={`
              inline-flex rounded-md p-1.5 transition-colors duration-200
              ${config.iconColor} hover:bg-black/5 dark:hover:bg-white/5
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
              focus:ring-current
            `}
          >
            <span className="sr-only">Dismiss</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}