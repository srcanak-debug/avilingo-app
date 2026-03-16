'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ExamStartPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [ready, setReady] = useState(false)

  const ROLE_SECTION_ORDER: Record<string,string[]> = {
    general:      ['grammar','reading','listening','writing','speaking'],
    flight_deck:  ['grammar','reading','listening','writing','speaking'],
    cabin_crew:   ['grammar','listening','reading','speaking','writing'],
    atc:          ['grammar','listening','reading','speaking','writing'],
    maintenance:  ['grammar','reading','writing','listening','speaking'],
    ground_staff: ['grammar','reading','listening','writing','speaking'],
  }

  const sectionColors: Record<string,string> = {
    grammar:'#3A8ED0', reading:'#0A8870', writing:'#B8881A', speaking:'#B83040', listening:'#7C3AED'
  }

  useEffect(() => { loadExam() }, [])

  async function loadExam() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase
      .from('exams')
      .select('*,exam_templates(*),organizations(name)')
      .eq('id', examId)
      .eq('candidate_id', user.id)
      .single()
    if (!data) { router.push('/exam'); return }
    setExam(data)
    setLoading(false)
  }

  async function enterFullscreenAndStart() {
    try {
      await document.documentElement.requestFullscreen()
      setFullscreen(true)
      setReady(true)
    } catch {
      setFullscreen(false)
    }
  }

  async function startExam() {
    const template = exam.exam_templates
    const role = template.role_profile || 'general'
    const sectionOrder = ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general
    const firstSection = sectionOrder.find((s: string) => (template[`${s}_count`] || 0) > 0) || sectionOrder[0]
    router.push(`/exam/${examId}/section/${firstSection}`)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)'}}>Loading exam...</div>
    </div>
  )

  const template = exam?.exam_templates
  const role = template?.role_profile || 'general'
  const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general).filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
  const totalQuestions = sectionOrder.reduce((sum: number, s: string) => sum + (template?.[`${s}_count`] || 0), 0)

  return (
    <div style={{minHeight:'100vh',background:'#0C1F3F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'600px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:900,color:'#fff',marginBottom:'8px'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span> e-Test</div>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:800,color:'#fff',marginBottom:'4px'}}>{template?.name}</h2>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Candidate briefing · Please read carefully</div>
        </div>

        <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'20px'}}>
            {[
              {label:'Total Time',value:`${template?.time_limit_mins} min`},
              {label:'Questions',value:totalQuestions},
              {label:'Pass Score',value:template?.passing_cefr},
            ].map(s=>(
              <div key={s.label} style={{background:'rgba(255,255,255,0.05)',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
                <div style={{fontSize:'20px',fontWeight:700,color:'#fff',fontFamily:'var(--fm)'}}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:'18px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>Section Order</div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {sectionOrder.map((s: string, i: number) => (
                <div key={s} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <span style={{fontSize:'12px',fontWeight:700,padding:'4px 10px',borderRadius:'100px',background:sectionColors[s]+'25',color:sectionColors[s],border:'1px solid '+sectionColors[s]+'40',textTransform:'capitalize'}}>
                    {i+1}. {s} ({template?.[`${s}_count`]}q)
                  </span>
                  {i < sectionOrder.length-1 && <span style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>→</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:'16px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>Important Rules</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {[
                'Once you complete a section, you cannot go back.',
                'Switching tabs or windows will trigger a warning strike.',
                'Three strikes will automatically invalidate your exam.',
                'Exiting fullscreen will pause your timer and hide content.',
                `Writing section: ${template?.writing_timer_mins} minutes per question.`,
                `Speaking section: Maximum ${template?.speaking_attempts} recording attempts per question.`,
                template?.listening_single_play ? 'Listening section: Each audio plays exactly once.' : '',
              ].filter(Boolean).map((rule,i) => (
                <div key={i} style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <span style={{color:'#5AAEDF',fontSize:'12px',flexShrink:0,marginTop:'1px'}}>▸</span>
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:1.4}}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!ready ? (
          <button onClick={enterFullscreenAndStart} style={{width:'100%',padding:'13px',borderRadius:'10px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
            Enter Fullscreen & Continue →
          </button>
        ) : (
          <button onClick={startExam} style={{width:'100%',padding:'13px',borderRadius:'10px',border:'none',background:'#1AD18A',color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
            I Understand — Begin Exam →
          </button>
        )}

        <div style={{textAlign:'center',marginTop:'12px',fontSize:'12px',color:'rgba(255,255,255,0.2)'}}>
          By starting this exam you confirm you are the registered candidate.
        </div>
      </div>
    </div>
  )
}
