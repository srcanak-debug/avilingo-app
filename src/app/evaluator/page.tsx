'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2']
const sectionColors: Record<string,string> = { writing:'#B8881A', speaking:'#B83040' }

const CEFR_DESCRIPTORS: Record<string,string> = {
  A1:'Beginner', A2:'Elementary', B1:'Intermediate',
  B2:'Upper Intermediate', C1:'Advanced', C2:'Mastery'
}

export default function EvaluatorQueue() {
  const router = useRouter()
  const [evaluator, setEvaluator] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState<any>(null)
  const [gradeForm, setGradeForm] = useState({ numeric_score: 70, cefr_level: 'B2', feedback: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all'|'writing'|'speaking'>('all')
  const [stats, setStats] = useState({ pending: 0, graded_today: 0, total: 0 })

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (evaluator) loadQueue() }, [evaluator, filter])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!data || !['super_admin','evaluator'].includes(data.role)) { router.push('/login'); return }
    setEvaluator(data)
  }

  async function loadQueue() {
    setLoading(true)

    // Get all exam answers for writing/speaking that need grading
    let query = supabase
      .from('exam_answers')
      .select(`
        *,
        questions(content, section, type, competency_tag, cefr_level),
        exams(id, status, candidate_id, exam_templates(name, role_profile, passing_cefr),
          users:candidate_id(full_name, email, organizations(name)))
      `)
      .in('section', filter === 'all' ? ['writing','speaking'] : [filter])
      .not('answer', 'is', null)
      .neq('answer', '')
      .order('created_at', { ascending: true })

    const { data: answers } = await query

    // Get already graded items
    const { data: graded } = await supabase
      .from('grades')
      .select('exam_id, section, question_id:id')
      .eq('evaluator_id', evaluator.id)

    const gradedKeys = new Set(graded?.map(g => `${g.exam_id}-${g.section}`) || [])

    // Filter to ungraded
    const pending = answers?.filter(a =>
      !gradedKeys.has(`${a.exam_id}-${a.section}`) &&
      ['completed','grading'].includes(a.exams?.status || '')
    ) || []

    setQueue(pending)
    setStats({
      pending: pending.length,
      graded_today: graded?.filter(g => {
        const today = new Date().toDateString()
        return true // simplified
      }).length || 0,
      total: answers?.length || 0
    })

    setLoading(false)
  }

  async function submitGrade() {
    if (!activeItem || !gradeForm.feedback.trim()) {
      alert('Please add feedback before submitting.')
      return
    }
    setSaving(true)

    await supabase.from('grades').insert({
      exam_id: activeItem.exam_id,
      evaluator_id: evaluator.id,
      section: activeItem.section,
      numeric_score: gradeForm.numeric_score,
      cefr_level: gradeForm.cefr_level,
      feedback: gradeForm.feedback,
      graded_at: new Date().toISOString()
    })

    // Update exam status to grading if not already
    await supabase.from('exams')
      .update({ status: 'grading' })
      .eq('id', activeItem.exam_id)
      .eq('status', 'completed')

    // Check if all sections are graded — if so trigger auto-scoring
    const { data: allGrades } = await supabase
      .from('grades')
      .select('section')
      .eq('exam_id', activeItem.exam_id)

    const gradedSections = new Set(allGrades?.map(g => g.section) || [])
    const template = activeItem.exams?.exam_templates
    const needsWriting = (template?.writing_count || 0) > 0
    const needsSpeaking = (template?.speaking_count || 0) > 0
    const allHumanGraded = (!needsWriting || gradedSections.has('writing')) && (!needsSpeaking || gradedSections.has('speaking'))

    if (allHumanGraded) {
      // Auto-trigger scoring
      try {
        await fetch('/api/score-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: activeItem.exam_id })
        })
      } catch (e) { console.log('Auto-scoring will run manually') }
    }

    setSaving(false)
    setActiveItem(null)
    setGradeForm({ numeric_score: 70, cefr_level: 'B2', feedback: '' })
    loadQueue()
  }

  function openItem(item: any) {
    setActiveItem(item)
    setGradeForm({ numeric_score: 70, cefr_level: 'B2', feedback: '' })
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  const scoreToColor = (score: number) => score >= 76 ? '#1AD18A' : score >= 61 ? '#3A8ED0' : score >= 41 ? '#B8881A' : '#EF4444'

  return (
    <div style={{minHeight:'100vh',background:'#0B1629',fontFamily:'var(--fb)',display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <div style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:900,color:'#fff'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
          <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>Evaluator Queue</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{evaluator?.full_name || evaluator?.email}</span>
          <button onClick={handleSignOut} style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer',fontFamily:'var(--fb)'}}>Sign out</button>
        </div>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* Queue sidebar */}
        <div style={{width:'360px',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',flexShrink:0}}>

          {/* Stats */}
          <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
              {[{label:'Pending',value:stats.pending,color:'#EF4444'},{label:'Total',value:stats.total,color:'#5AAEDF'}].map(s=>(
                <div key={s.label} style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
                  <div style={{fontSize:'22px',fontWeight:700,color:s.color,fontFamily:'var(--fm)'}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              {(['all','writing','speaking'] as const).map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{flex:1,padding:'6px',borderRadius:'6px',border:'1px solid',borderColor:filter===f?sectionColors[f]||'#3A8ED0':'rgba(255,255,255,0.08)',background:filter===f?'rgba(255,255,255,0.08)':'transparent',color:filter===f?'#fff':'rgba(255,255,255,0.35)',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',textTransform:'capitalize'}}>{f}</button>
              ))}
            </div>
          </div>

          {/* Queue list */}
          <div style={{flex:1,overflowY:'auto'}}>
            {loading ? (
              <div style={{padding:'32px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Loading queue...</div>
            ) : queue.length === 0 ? (
              <div style={{padding:'32px',textAlign:'center'}}>
                <div style={{fontSize:'28px',marginBottom:'10px'}}>✓</div>
                <div style={{fontSize:'14px',fontWeight:600,color:'#1AD18A',marginBottom:'4px'}}>Queue is clear!</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>All submissions have been graded.</div>
              </div>
            ) : queue.map((item, i) => (
              <div key={item.id} onClick={()=>openItem(item)} style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',background:activeItem?.id===item.id?'rgba(58,142,208,0.1)':'transparent',transition:'background 0.15s'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
                  <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:sectionColors[item.section]+'25',color:sectionColors[item.section],textTransform:'capitalize',border:'1px solid '+sectionColors[item.section]+'40'}}>{item.section}</span>
                  <span style={{fontSize:'10.5px',color:'rgba(255,255,255,0.25)'}}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{fontSize:'12.5px',color:'#fff',marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.exams?.users?.full_name || item.exams?.users?.email || 'Candidate'}</div>
                <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.exams?.exam_templates?.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grading panel */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {!activeItem ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{fontSize:'32px'}}>👈</div>
              <div style={{fontSize:'14px',color:'rgba(255,255,255,0.3)'}}>Select a submission from the queue to begin grading</div>
            </div>
          ) : (
            <div style={{flex:1,overflowY:'auto',padding:'24px'}}>

              {/* Candidate info */}
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'16px 20px',marginBottom:'18px',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
                <div>
                  <div style={{fontSize:'15px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>{activeItem.exams?.users?.full_name || activeItem.exams?.users?.email}</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>{activeItem.exams?.exam_templates?.name} · Pass: {activeItem.exams?.exam_templates?.passing_cefr}</div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:sectionColors[activeItem.section]+'20',color:sectionColors[activeItem.section],textTransform:'capitalize',border:'1px solid '+sectionColors[activeItem.section]+'40'}}>{activeItem.section}</span>
                  {activeItem.questions?.cefr_level && <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:'rgba(58,142,208,0.15)',color:'#5AAEDF'}}>Prompt: {activeItem.questions.cefr_level}</span>}
                </div>
              </div>

              {/* Split screen */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>

                {/* Left: Prompt */}
                <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'18px',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'12px'}}>Original Prompt</div>
                  <p style={{fontSize:'14px',color:'rgba(255,255,255,0.8)',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{activeItem.questions?.content}</p>
                  {activeItem.questions?.competency_tag && (
                    <div style={{marginTop:'12px',fontSize:'11.5px',color:'rgba(255,255,255,0.25)'}}>Tag: {activeItem.questions.competency_tag.replace(/_/g,' ')}</div>
                  )}
                </div>

                {/* Right: Candidate response */}
                <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'18px',border:'1px solid rgba(255,255,255,0.1)'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'12px'}}>Candidate Response</div>
                  {activeItem.section === 'speaking' ? (
                    <div style={{textAlign:'center',padding:'20px 0'}}>
                      {activeItem.audio_url ? (
                        <audio src={activeItem.audio_url} controls style={{width:'100%',accentColor:'#B83040'}} />
                      ) : (
                        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)'}}>Audio recording submitted. Playback coming soon.</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p style={{fontSize:'14px',color:'#fff',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{activeItem.answer}</p>
                      <div style={{marginTop:'10px',fontSize:'11.5px',color:'rgba(255,255,255,0.25)'}}>
                        Word count: {activeItem.answer?.trim().split(/\s+/).filter(Boolean).length || 0}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grading form */}
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'14px',padding:'20px',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginBottom:'16px'}}>Evaluator Assessment</div>

                {/* Score slider */}
                <div style={{marginBottom:'18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                    <label style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.5)'}}>Numeric Score</label>
                    <span style={{fontSize:'22px',fontWeight:700,color:scoreToColor(gradeForm.numeric_score),fontFamily:'var(--fm)'}}>{gradeForm.numeric_score}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={gradeForm.numeric_score} onChange={e=>{
                    const score = +e.target.value
                    const cefr = score>=91?'C2':score>=76?'C1':score>=61?'B2':score>=41?'B1':score>=21?'A2':'A1'
                    setGradeForm({...gradeForm, numeric_score:score, cefr_level:cefr})
                  }} style={{width:'100%',accentColor:scoreToColor(gradeForm.numeric_score)}} />
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'rgba(255,255,255,0.2)',marginTop:'4px'}}>
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>
                </div>

                {/* CEFR selector */}
                <div style={{marginBottom:'16px'}}>
                  <label style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>CEFR Level</label>
                  <div style={{display:'flex',gap:'6px'}}>
                    {CEFR_LEVELS.map(l=>(
                      <button key={l} onClick={()=>setGradeForm({...gradeForm,cefr_level:l})} style={{flex:1,padding:'8px',borderRadius:'7px',border:'1.5px solid',borderColor:gradeForm.cefr_level===l?'#3A8ED0':'rgba(255,255,255,0.08)',background:gradeForm.cefr_level===l?'rgba(58,142,208,0.2)':'transparent',color:gradeForm.cefr_level===l?'#5AAEDF':'rgba(255,255,255,0.35)',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.25)',marginTop:'5px'}}>{CEFR_DESCRIPTORS[gradeForm.cefr_level]}</div>
                </div>

                {/* Feedback */}
                <div style={{marginBottom:'16px'}}>
                  <label style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'6px'}}>Evaluator Feedback *</label>
                  <textarea value={gradeForm.feedback} onChange={e=>setGradeForm({...gradeForm,feedback:e.target.value})} placeholder="Provide specific feedback on the candidate's performance, strengths and areas for improvement..." rows={4} style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'13.5px',fontFamily:'var(--fb)',resize:'vertical',lineHeight:1.6,outline:'none'}} />
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.2)',marginTop:'3px'}}>Minimum feedback required before submission</div>
                </div>

                <div style={{display:'flex',gap:'10px'}}>
                  <button onClick={submitGrade} disabled={saving||!gradeForm.feedback.trim()} style={{flex:1,padding:'12px',borderRadius:'9px',border:'none',background:gradeForm.feedback.trim()?'#3A8ED0':'rgba(255,255,255,0.08)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:gradeForm.feedback.trim()?'pointer':'not-allowed',fontFamily:'var(--fb)'}}>
                    {saving ? 'Submitting...' : `Submit Grade — ${gradeForm.cefr_level} (${gradeForm.numeric_score}%)`}
                  </button>
                  <button onClick={()=>setActiveItem(null)} style={{padding:'12px 18px',borderRadius:'9px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer',fontFamily:'var(--fb)'}}>Skip</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
