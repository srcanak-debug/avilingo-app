'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    // Use API route (service role key) to bypass RLS and get role reliably
    let role: string | null = null
    try {
      const res = await fetch('/api/get-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id })
      })
      const json = await res.json()
      role = json.role
    } catch {
      role = null
    }

    // Auto-heal: if no user row found, create as candidate
    if (!role) {
      await fetch('/api/get-role', { method: 'POST', body: JSON.stringify({ userId: data.user.id }) })
      role = 'candidate'
    }

    if (['super_admin', 'hr_manager', 'evaluator', 'instructor'].includes(role || '')) {
      localStorage.setItem('adminId', data.user.id)
      localStorage.setItem('adminRole', role || '')
      // Sync to cookies for Middleware
      document.cookie = `adminId=${data.user.id}; path=/; max-age=86400`
      document.cookie = `adminRole=${role}; path=/; max-age=86400`
    }

    if (role === 'super_admin') router.push('/admin')
    else if (role === 'hr_manager') router.push('/hr')
    else if (role === 'instructor') router.push('/instructor')
    else if (role === 'evaluator') router.push('/evaluator')
    else if (role === 'candidate') router.push('/exam')
    else if (role === 'student') router.push('/learn')
    else router.push('/dashboard')
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'420px'}}>
        
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'32px',fontWeight:900,color:'#fff',letterSpacing:'-0.5px'}}>
            Avil<span style={{color:'#5AAEDF'}}>ingo</span>
          </div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',marginTop:'6px'}}>Aviation Training & Assessment Platform</div>
        </div>

        {/* Card */}
        <div style={{background:'#fff',borderRadius:'18px',padding:'36px 32px'}}>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'var(--navy)',marginBottom:'6px'}}>Welcome back</h2>
          <p style={{fontSize:'13.5px',color:'var(--t3)',marginBottom:'28px'}}>Sign in to your account to continue</p>

          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div>
              <label style={{fontSize:'13px',fontWeight:600,color:'var(--t1)',display:'block',marginBottom:'6px'}}>Email address</label>
              <input 
                type="email" 
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:600,color:'var(--t1)',display:'block',marginBottom:'6px'}}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <div style={{marginTop:'14px',padding:'10px 14px',background:'#FEE2E2',borderRadius:'8px',fontSize:'13px',color:'#991B1B'}}>
              {error}
            </div>
          )}

          <button 
            className="btn btn-navy btn-full" 
            style={{marginTop:'22px',padding:'13px',fontSize:'15px'}}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <div style={{marginTop:'20px',textAlign:'center',fontSize:'12px',color:'var(--t3)'}}>
            Having trouble? Contact{' '}
            <a href="mailto:info@avilingo.com" style={{color:'var(--sky)'}}>info@avilingo.com</a>
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:'20px',fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>
          © 2026 Avilingo · Secure Platform
        </div>
      </div>
    </div>
  )
}
