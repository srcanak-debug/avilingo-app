'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/hr/analytics')
  }, [])

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--navy)', fontFamily: 'var(--fm)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Redirecting to HR Analytics...</h2>
      <p style={{ fontSize: '14px', color: 'var(--t3)' }}>If you are not redirected, <a href="/hr/analytics" style={{ color: 'var(--sky)', fontWeight: 700 }}>click here</a>.</p>
    </div>
  )
}
