'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/navigation/header'
import { RefreshCwIcon, UsersIcon, BookOpenIcon, ShieldIcon, ImageIcon, PencilIcon, UserPlusIcon } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

interface Version {
  id: string
  name: string
  displayName: string
  isActive: boolean
}

export function AdminDashboard() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [createUserMessage, setCreateUserMessage] = useState('')
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersResponse, versionsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/versions')
      ])

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()
        setVersions(versionsData)
      }
    } catch {
      console.error('Error fetching data:')
    } finally {
      setIsLoading(false)
    }
  }

  const syncDocs = async () => {
    setIsSyncing(true)
    setSyncMessage('')

    try {
      const response = await fetch('/api/docs/sync', {
        method: 'POST',
      })

      if (response.ok) {
        setSyncMessage('Documentation synced successfully!')
        fetchData() // Refresh data
      } else {
        setSyncMessage('Failed to sync documentation')
      }
    } catch {
      setSyncMessage('Error syncing documentation')
    } finally {
      setIsSyncing(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch {
      console.error('Error updating user role:')
    }
  }

  const createUser = async () => {
    setIsCreatingUser(true)
    setCreateUserMessage('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        setCreateUserMessage('User created successfully!')
        setNewUser({ email: '', name: '', password: '', role: 'user' })
        setShowCreateUser(false)
        fetchData() // Refresh data
      } else {
        const error = await response.json()
        setCreateUserMessage(error.error || 'Failed to create user')
      }
    } catch {
      setCreateUserMessage('Error creating user')
    } finally {
      setIsCreatingUser(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage users, documentation, and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <UsersIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                <p className="text-slate-600 dark:text-slate-400">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <BookOpenIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{versions.length}</p>
                <p className="text-slate-600 dark:text-slate-400">Documentation Versions</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <ShieldIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-slate-600 dark:text-slate-400">Admin Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/admin/media" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <ImageIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Media Library</h3>
                  <p className="text-slate-600 dark:text-slate-400">Manage images, videos, and documents</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/editor" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <PencilIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Content Editor</h3>
                  <p className="text-slate-600 dark:text-slate-400">Create and edit documentation</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Documentation Sync */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Documentation Management</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Sync documentation from the docs folder to the database
              </p>
              {syncMessage && (
                <p className={`text-sm ${syncMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {syncMessage}
                </p>
              )}
            </div>
            <button
              onClick={syncDocs}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Documentation'}</span>
            </button>
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Users Management</h2>
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>
          
          {createUserMessage && (
            <div className={`mb-4 p-3 rounded-md ${createUserMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {createUserMessage}
            </div>
          )}

          {/* Create User Form */}
          {showCreateUser && (
            <div className="mb-6 p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Create New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="User Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowCreateUser(false)
                    setNewUser({ email: '', name: '', password: '', role: 'user' })
                    setCreateUserMessage('')
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={isCreatingUser || !newUser.email || !newUser.password}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        disabled={user.id === (session?.user as any)?.id}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}