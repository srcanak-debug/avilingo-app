'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardGridProps {
  stats: { users: number; questions: number; exams: number; orgs: number }
  urgentTasks: any[]
  liveMonitor: { activeExams: number; candidatesOnline: number }
  setActiveSection: (section: string) => void
  setShowAI: (show: boolean) => void
  ROLE_PROFILES: Record<string, string[]>
  sectionColors: Record<string, string>
}

export default function DashboardGrid({ 
  stats, urgentTasks, liveMonitor, setActiveSection, setShowAI, ROLE_PROFILES, sectionColors 
}: DashboardGridProps) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      
      {/* Row 1: Live Monitor & Primary Stats */}
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:'16px'}}>
        {/* Live Monitor Card */}
        <div style={{background:'linear-gradient(135deg, var(--navy) 0%, #1e293b 100%)',borderRadius:'16px',padding:'24px',color:'#fff',boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)',display:'flex',flexDirection:'column',justifyContent:'space-between',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-10px',right:'-10px',width:'100px',height:'100px',background:'rgba(255,255,255,0.03)',borderRadius:'50%'}} />
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 8px #22c55e'}} />
              <span style={{fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'rgba(255,255,255,0.6)'}}>Live Monitor</span>
            </div>
            <div style={{fontSize:'42px',fontWeight:800,fontFamily:'var(--fm)',lineHeight:1}}>{liveMonitor.activeExams}</div>
            <div style={{fontSize:'14px',color:'rgba(255,255,255,0.7)',marginTop:'4px'}}>Active Exams in Progress</div>
          </div>
          <div style={{marginTop:'24px',paddingTop:'16px',borderTop:'1px solid rgba(255,255,255,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>Candidates Online</span>
            <span style={{fontSize:'16px',fontWeight:700}}>{liveMonitor.candidatesOnline}</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gridTemplateRows:'repeat(2, 1fr)',gap:'12px'}}>
          {stats ? [{label:'Total Users',value:stats.users,color:'#3b82f6',bg:'#eff6ff',icon:'👤'},
            {label:'Question Bank',value:stats.questions.toLocaleString(),color:'#f59e0b',bg:'#fffbeb',icon:'❓'},
            {label:'Total Exams',value:stats.exams,color:'#10b981',bg:'#ecfdf5',icon:'📋'},
            {label:'Organizations',value:stats.orgs,color:'#ef4444',bg:'#fef2f2',icon:'🏢'}
          ].map(m=>(
            <div key={m.label} style={{background:m.bg,borderRadius:'14px',padding:'18px',border:'1.5px solid rgba(0,0,0,0.02)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'11px',fontWeight:700,color:'rgba(0,0,0,0.4)',textTransform:'uppercase',marginBottom:'4px'}}>{m.label}</div>
                <div style={{fontSize:'22px',fontWeight:800,color:'var(--navy)',fontFamily:'var(--fm)'}}>{m.value}</div>
              </div>
              <div style={{fontSize:'24px',opacity:0.8}}>{m.icon}</div>
            </div>
          )) : <div style={{gridColumn:'span 2',textAlign:'center',padding:'20px',color:'var(--t3)'}}>Loading stats...</div>}
        </div>
      </div>

      {/* Row 2: Urgent Tasks & Quick Actions */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'16px'}}>
        
        {/* Urgent Tasks (Action Center) */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid var(--bdr)',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fafafa'}}>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)'}}>⚠️ Action Center (Urgent)</h3>
            <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:'#fee2e2',color:'#ef4444'}}>{urgentTasks.length} Pending</span>
          </div>
          <div style={{padding:'12px',maxHeight:'320px',overflowY:'auto'}}>
            {urgentTasks.length === 0 ? (
              <div style={{padding:'40px',textAlign:'center',color:'var(--t3)',fontSize:'13px'}}>No urgent tasks. Everything is on track! ✨</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {urgentTasks.map((t, idx) => (
                  <div key={idx} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'10px',background:t.type==='contract'?'#fff7ed':'#f0f9ff',border:'1px solid '+(t.type==='contract'?'#ffedd5':'#e0f2fe')}}>
                    <div style={{fontSize:'20px'}}>{t.type==='contract' ? '📅' : '✍️'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',fontWeight:700,color:'var(--navy)'}}>{t.label}</div>
                      <div style={{fontSize:'11.5px',color:'var(--t3)'}}>{t.sub}</div>
                    </div>
                    <button onClick={() => setActiveSection(t.type==='contract'?'organizations':'evaluator')} style={{padding:'6px 12px',borderRadius:'6px',border:'1px solid var(--bdr)',background:'#fff',fontSize:'11.5px',fontWeight:600,color:'var(--navy)',cursor:'pointer'}}>Handle</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div style={{background:'#fff',borderRadius:'16px',padding:'20px',border:'1px solid var(--bdr)'}}>
          <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',marginBottom:'16px'}}>Quick Actions</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {[
              {label:'Review UI',href:'/admin/review/latest',icon:'🔍'},
              {label:'Templates',id:'templates',icon:'📋'},
              {label:'Users',id:'users',icon:'👥'},
              {label:'Reports',href:'/admin/reports',icon:'📈'},
              {label:'Q-Bank',id:'questions',icon:'📚'},
              {label:'AI Import',id:'questions',ai:true,icon:'🤖'}
            ].map(a=>(
              a.href
                ? <a key={a.label} href={a.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',padding:'12px 8px',borderRadius:'12px',border:'1.5px solid var(--bdr)',background:'#fff',textDecoration:'none',transition:'all 0.2s'}}>
                    <span style={{fontSize:'18px'}}>{a.icon}</span>
                    <span style={{fontSize:'10px',fontWeight:700,color:'var(--navy)',textAlign:'center'}}>{a.label}</span>
                  </a>
                : <button key={a.label} onClick={()=>{setActiveSection(a.id??'questions');if(a.ai)setShowAI(true)}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',padding:'12px 8px',borderRadius:'12px',border:'1.5px solid var(--bdr)',background:'#fff',cursor:'pointer',transition:'all 0.2s',fontFamily:'var(--fb)'}}>
                    <span style={{fontSize:'18px'}}>{a.icon}</span>
                    <span style={{fontSize:'10px',fontWeight:700,color:'var(--navy)',textAlign:'center'}}>{a.label}</span>
                  </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Section Reference */}
      <div style={{background:'#fff',borderRadius:'16px',padding:'20px',border:'1px solid var(--bdr)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
          <div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'14px',fontWeight:800,color:'var(--navy)',margin:0}}>ICAO Doc 9835 Reference</h3>
            <p style={{fontSize:'11.5px',color:'var(--t3)',margin:0}}>Optimized sequencing by role profile</p>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'10px'}}>
          {Object.entries(ROLE_PROFILES).slice(0,4).map(([role,order])=>(
            <div key={role} style={{padding:'12px',borderRadius:'10px',border:'1px solid var(--bdr)',background:'var(--off)'}}>
              <div style={{fontSize:'11.5px',fontWeight:700,color:'var(--navy)',textTransform:'capitalize',marginBottom:'8px'}}>{role.replace('_',' ')}</div>
              <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                {order.map((s,i)=>(
                  <span key={s} style={{fontSize:'9px',fontWeight:700,padding:'2px 6px',borderRadius:'4px',background:(sectionColors[s]||'#888')+'20',color:sectionColors[s]||'#888'}}>{s.charAt(0).toUpperCase()}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
