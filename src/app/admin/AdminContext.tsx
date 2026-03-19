'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminContextType {
  adminId: string | null;
  adminRole: string | null;
  adminName: string;
  adminEmail: string;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('Admin')
  const [adminEmail, setAdminEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        try {
          const res = await fetch('/api/get-role', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId: session.user.id })
          })
          const json = await res.json()
          
          setAdminId(session.user.id)
          setAdminRole(json.role)
          setAdminName(json.full_name || 'Admin')
          setAdminEmail(json.email || session.user.email || '')
        } catch (err) {
          console.error('AdminContext Auth Error:', err)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  return (
    <AdminContext.Provider value={{ adminId, adminRole, adminName, adminEmail, loading }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
