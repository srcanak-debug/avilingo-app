'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CandidateDashboard() {
  const router = useRouter()
  const [candidate, setCandidate] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: userData } = await supabase.from('users').select('*,organizations(name)').eq('id', user.id).single()
    if (!userData) { router.push('/login'); return }
    setCandidate(userData)
    const { data: examData } = await supabase
      .from('exams')
      .select('*,exam_templates(name,role_profile,grammar_count,reading_count,writing_count,speaking_count,listening_count,time_limit_mins,passing_cefr),organizations(name)')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })
    setExams(examData || [])
    setLoading(false)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)'}}>Loading...</div>
    </div>
  )

  const statusColor: Record<string,string> = { pending:'#FAEEDA', in_progress:'#E6F1FB', completed:'#EAF3DE', invalidated:'#FCEBEB', grading:'#F5F3FF', certified:'#EAF3DE' }
  const statusText: Record<string,string> = { pending:'Pending', in_progress:'In Progress', completed:'Submitted', invalidated:'Invalidated', grading:'Being Graded', certified:'Certified' }

  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',fontFamily:'var(--fb)'}}>
      <div style={{background:'rgba(255,255,255,0.05)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:900,color:'#fff'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>{candidate?.full_name || candidate?.email}</span>
          <button onClick={handleSignOut} style={{padding:'6px 14px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:'12.5px',cursor:'pointer',fontFamily:'var(--fb)'}}>Sign out</button>
        </div>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'40px 24px'}}>
        <h1 style={{fontFamily:'var(--fm)',fontSize:'24px',fontWeight:900,color:'#fff',marginBottom:'6px'}}>Your Assessments</h1>
        <p style={{fontSize:'14px',color:'rgba(255,255,255,0.4)',marginBottom:'32px'}}>
          {candidate?.organizations?.name ? `${candidate.organizations.name} · ` : ''}ICAO Aviation English Platform
        </p>

        {exams.length === 0 ? (
          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'16px',padding:'48px',textAlign:'center',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>📋</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'#fff',marginBottom:'6px'}}>No exams assigned yet</h3>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>Your exam will appear here once assigned by your HR department.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {exams.map(exam => (
              <div key={exam.id} style={{background:'rgba(255,255,255,0.06)',borderRadius:'14px',padding:'22px',border:'1px solid rgba(255,255,255,0.1)'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'14px'}}>
                  <div>
                    <h3 style={{fontFamily:'var(--fm)',fontSize:'16px',fontWeight:800,color:'#fff',marginBottom:'4px'}}>{exam.exam_templates?.name || 'Assessment'}</h3>
                    <div style={{fontSize:'12.5px',color:'rgba(255,255,255,0.4)'}}>{exam.organizations?.name} · Pass: {exam.exam_templates?.passing_cefr} · {exam.exam_templates?.time_limit_mins} mins</div>
                  </div>
                  <span style={{fontSize:'11.5px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:statusColor[exam.status]||'#F1EFE8',color:'#333'}}>{statusText[exam.status]||exam.status}</span>
                </div>

                {exam.status === 'certified' && exam.final_cefr_score && (
                  <div style={{background:'rgba(26,209,138,0.1)',borderRadius:'8px',padding:'12px 16px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
                    <span style={{fontSize:'24px',fontWeight:800,color:'#1AD18A',fontFamily:'var(--fm)'}}>{exam.final_cefr_score}</span>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:600,color:'#fff'}}>ICAO Certified</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>Certificate issued</div>
                    </div>
                  </div>
                )}

                {(exam.status === 'pending' || exam.status === 'in_progress') && (
                  <button onClick={() => router.push(`/exam/${exam.id}/preflight`)} style={{padding:'11px 24px',borderRadius:'9px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',width:'100%'}}>
                    {exam.status === 'in_progress' ? '▶ Resume Exam' : '▶ Start Exam'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
