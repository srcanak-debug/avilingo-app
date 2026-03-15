'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, exams: 0, questions: 0, orgs: 0 })
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')

  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
    if (data?.role !== 'super_admin') { router.push('/login'); return }
    setAdminName(data.full_name || 'Admin')
    setLoading(false)
  }

  async function loadStats() {
    const [u, e, q, o] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
    ])
    setStats({ users: u.count||0, exams: e.count||0, questions: q.count||0, orgs: o.count||0 })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)'}}>Loading...</div>
    </div>
  )

  const navItems = [
    { id:'dashboard', label:'Dashboard' },
    { id:'users', label:'Users' },
    { id:'organizations', label:'Organizations' },
    { id:'questions', label:'Question Bank' },
    { id:'exams', label:'Exams' },
    { id:'templates', label:'Exam Templates' },
    { id:'evaluator', label:'Grading Queue' },
    { id:'reports', label:'Reports' },
    { id:'invoices', label:'Invoices' },
    { id:'emails', label:'Email Templates' },
    { id:'audit', label:'Audit Logs' },
  ]

  const metrics = [
    { label:'Total Users', value: stats.users, color:'#5AAEDF' },
    { label:'Total Exams', value: stats.exams, color:'#12B898' },
    { label:'Questions', value: stats.questions, color:'#DEAC50' },
    { label:'Organizations', value: stats.orgs, color:'#E06070' },
  ]

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'var(--fb)'}}>

      {/* Sidebar */}
      <div style={{width:'220px',background:'var(--navy)',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'20px 16px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:900,color:'#fff'}}>
            Avil<span style={{color:'#5AAEDF'}}>ingo</span>
          </div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'3px'}}>Admin Panel</div>
        </div>

        <nav style={{padding:'12px 8px',flex:1}}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
              display:'block',width:'100%',textAlign:'left',padding:'9px 12px',marginBottom:'2px',
              borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:500,
              background: activeSection === item.id ? 'rgba(58,142,208,0.2)' : 'transparent',
              color: activeSection === item.id ? '#5AAEDF' : 'rgba(255,255,255,0.55)',
            }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',padding:'8px 12px',marginBottom:'4px'}}>{adminName}</div>
          <button onClick={handleSignOut} style={{
            display:'block',width:'100%',textAlign:'left',padding:'9px 12px',
            borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'13px',
            background:'transparent',color:'rgba(255,255,255,0.4)',
          }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,background:'var(--off)',display:'flex',flexDirection:'column'}}>

        {/* Topbar */}
        <div style={{background:'#fff',padding:'14px 28px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',textTransform:'capitalize'}}>
            {activeSection}
          </h1>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'100px',background:'#EAF3DE',color:'#27500A',fontWeight:600}}>System Online</span>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--sky3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'var(--sky)'}}>
              {adminName.charAt(0)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{padding:'28px',flex:1}}>

          {activeSection === 'dashboard' && (
            <>
              {/* Metrics */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'28px'}}>
                {metrics.map(m => (
                  <div key={m.label} style={{background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid var(--bdr)'}}>
                    <div style={{fontSize:'12px',color:'var(--t3)',marginBottom:'6px'}}>{m.label}</div>
                    <div style={{fontSize:'28px',fontWeight:700,color:m.color,fontFamily:'var(--fm)'}}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)',marginBottom:'20px'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Quick Actions</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {[
                    {label:'Add Question', section:'questions'},
                    {label:'Create Exam Template', section:'templates'},
                    {label:'Invite User', section:'users'},
                    {label:'Add Organization', section:'organizations'},
                    {label:'View Grading Queue', section:'evaluator'},
                    {label:'Generate Report', section:'reports'},
                  ].map(a => (
                    <button key={a.label} onClick={() => setActiveSection(a.section)} style={{
                      padding:'9px 16px',borderRadius:'8px',border:'1.5px solid var(--bdr)',
                      background:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:600,
                      color:'var(--navy)',fontFamily:'var(--fb)',
                    }}>
                      {a.label} →
                    </button>
                  ))}
                </div>
              </div>

              {/* System status */}
              <div style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid var(--bdr)'}}>
                <h3 style={{fontFamily:'var(--fm)',fontSize:'15px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>System Status</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
                  {[
                    {label:'Database', status:'Online', color:'#EAF3DE', text:'#27500A'},
                    {label:'Auth Service', status:'Online', color:'#EAF3DE', text:'#27500A'},
                    {label:'Storage', status:'Online', color:'#EAF3DE', text:'#27500A'},
                    {label:'Email Service', status:'Configure', color:'#FAEEDA', text:'#633806'},
                    {label:'Proctoring', status:'Configure', color:'#FAEEDA', text:'#633806'},
                    {label:'PDF Generator', status:'Configure', color:'#FAEEDA', text:'#633806'},
                  ].map(s => (
                    <div key={s.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:'8px',border:'1px solid var(--bdr)'}}>
                      <span style={{fontSize:'13px',color:'var(--t2)',fontWeight:500}}>{s.label}</span>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:s.color,color:s.text}}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection !== 'dashboard' && (
            <div style={{background:'#fff',borderRadius:'14px',padding:'40px',border:'1px solid var(--bdr)',textAlign:'center'}}>
              <div style={{fontSize:'40px',marginBottom:'16px'}}>🚧</div>
              <h3 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'var(--navy)',marginBottom:'8px',textTransform:'capitalize'}}>{activeSection} Panel</h3>
              <p style={{fontSize:'14px',color:'var(--t3)'}}>This section is being built. Coming in the next phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
