'use client'
import { useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useLayoutEffect(() => {
    router.replace('/admin/dashboard')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--navy)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--fm)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>Avilingo</div>
        <div style={{ fontSize: '14px', opacity: 0.6 }}>Loading dashboard...</div>
      </div>
    </div>
  )
}
