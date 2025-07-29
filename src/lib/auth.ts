import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.password) return null
        
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        Object.assign(session.user, { 
          id: token.id, 
          role: token.role 
        })
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
}

export async function getUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      versionPerms: {
        include: {
          version: true,
        },
      },
      modulePerms: {
        include: {
          module: {
            include: {
              version: true,
            },
          },
        },
      },
      permissions: true,
    },
  })

  return user
}

export async function hasPermission(
  userId: string,
  _resourceType: 'version' | 'module' | 'chapter',
  _resourceId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return false
  
  // All authenticated users have access to all documentation by default
  // Only admins need to be explicitly checked for admin-only features
  return true
}

// All users have documentation access by default
export async function hasDocumentationAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return false
  
  // All authenticated users have access to documentation
  return true
}