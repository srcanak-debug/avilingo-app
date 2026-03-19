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
        const { data: u } = await supabase.from('users').select('role,full_name').eq('id', session.user.id).single()
        setAdminId(session.user.id)
        setAdminRole(u?.role || null)
        setAdminName(u?.full_name || 'Admin')
        setAdminEmail(session.user.email || '')
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
