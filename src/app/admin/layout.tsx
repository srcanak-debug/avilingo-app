'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import { AdminProvider } from './AdminContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProvider>
      <AdminContent>{children}</AdminContent>
    </AdminProvider>
  )
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        document.cookie = `adminId=${session.user.id}; path=/; max-age=86400`
      } else if (event === 'SIGNED_OUT') {
        document.cookie = "adminId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "adminRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

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
      const role = json.role

      if (!['super_admin', 'hr_manager', 'evaluator', 'instructor'].includes(role)) {
        router.push('/login')
        return
      }

      setAdminName(json.full_name || 'Admin')
      setAdminEmail(json.email || session.user.email || '')
      
      document.cookie = `adminId=${session.user.id}; path=/; max-age=86400`
      document.cookie = `adminRole=${role}; path=/; max-age=86400`
      
      setLoading(false)
    } catch (err) {
      console.error('CheckAuth Error:', err)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--navy)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--fm)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>Avilingo</div>
          <div style={{ fontSize: '14px', opacity: 0.6 }}>Securing session...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader adminName={adminName} adminEmail={adminEmail} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
