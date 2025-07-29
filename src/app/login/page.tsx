'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setMessage('Invalid email or password. Please try again.')
      } else if (result?.ok) {
        router.push('/')
      }
    } catch {
      setMessage('Error signing in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        
        {/* Left Panel */}
        <div className="w-full md:w-2/5 flex items-center justify-center px-6">
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Logo */}
            <img
                src="/loginLogo.png"
                alt="Bizwiz Logo"
                className="h-20 w-auto mb-6 mt-2"
                draggable={false}
            />

            {/* Heading */}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 text-center">Welcome!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">
              Welcome back! Please enter your details.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  Username
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500 text-base transition"
                    placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500 text-base pr-10 transition"
                      placeholder="Enter your password"
                  />
                  <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              {message && (
                  <div className={`text-center text-sm mt-2 ${message.includes('Error') || message.includes('Invalid') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {message}
                  </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-3/5 relative min-h-[400px] rounded-tl-[60px] rounded-bl-[60px] overflow-hidden flex flex-col justify-end bg-slate-200 dark:bg-slate-800">
          {/* Replace the src below with your actual background image path */}
          <img
              src="/login.png"
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
          />
          <div className="absolute inset-0 " />
          <div className="relative z-10 px-8 md:px-16 pb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white dark:text-slate-100 mb-4 drop-shadow-lg leading-tight">
              Forging the Future of the Retail Market <br className="hidden md:block" />and Distribution of Quality Products!
            </h1>
            <div className="mt-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-white dark:text-slate-100 mb-2">
                Bizwiz POS & ERP System
              </h2>
              <p className="text-white/90 dark:text-slate-300 text-sm">
                Copyright © 2025. RetailPay. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
  )
}
