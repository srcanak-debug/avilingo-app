'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── CONSTANTS ───
const CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2']
const sectionColors: Record<string,string> = { writing:'#B8881A', speaking:'#B83040' }
const CEFR_DESCRIPTORS: Record<string,string> = {
  A1:'Beginner', A2:'Elementary', B1:'Intermediate',
  B2:'Upper Intermediate', C1:'Advanced', C2:'Mastery'
}

const DEFAULT_RUBRICS: Record<string, {criterion:string, description:string, max_score:number}[]> = {
  writing: [
    { criterion:'Task Achievement', description:'Completes all parts of the task; relevant and sufficiently developed ideas', max_score:10 },
    { criterion:'Coherence & Cohesion', description:'Logical organisation; clear progression; effective use of cohesive devices', max_score:10 },
    { criterion:'Lexical Resource', description:'Range and accuracy of vocabulary; appropriate word choice for aviation context', max_score:10 },
    { criterion:'Grammatical Range & Accuracy', description:'Variety and correctness of sentence structures', max_score:10 },
    { criterion:'Aviation Terminology', description:'Correct use of ICAO phraseology, technical terms, and domain-specific language', max_score:10 },
  ],
  speaking: [
    { criterion:'Pronunciation', description:'Clear articulation; appropriate stress and intonation; intelligibility', max_score:10 },
    { criterion:'Fluency', description:'Smooth delivery; appropriate pace; minimal hesitation; self-correction', max_score:10 },
    { criterion:'Vocabulary & Phraseology', description:'Range of lexical resources; accurate use of aviation terminology', max_score:10 },
    { criterion:'Structure & Grammar', description:'Grammatical accuracy; complexity of sentence patterns', max_score:10 },
    { criterion:'Comprehension & Interaction', description:'Understands the prompt; responds relevantly; maintains coherent discourse', max_score:10 },
    { criterion:'Task Completion', description:'Fully addresses the scenario; appropriate length; covers all required points', max_score:10 },
  ],
}

const CEFR_BAND_GUIDE: Record<string, {range:string}> = {
  'C2': { range:'9-10' }, 'C1': { range:'7-8' }, 'B2': { range:'5-6' },
  'B1': { range:'3-4' }, 'A2': { range:'2' }, 'A1': { range:'0-1' },
}

interface RubricScore {
  criterion: string
  description: string
  max_score: number
  score: number
  comment: string
}

export default function EvaluatorQueue() {
  const router = useRouter()
  const [evaluator, setEvaluator] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all'|'writing'|'speaking'>('all')
  const [stats, setStats] = useState({ pending: 0, graded_today: 0, total: 0 })

  // Rubric grading state
  const [rubricScores, setRubricScores] = useState<RubricScore[]>([])
  const [generalFeedback, setGeneralFeedback] = useState('')
  const [overrideCefr, setOverrideCefr] = useState<string|null>(null)
  const [proctoringEvents, setProctoringEvents] = useState<any[]>([])

  // History
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

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
    const sections = filter === 'all' ? ['writing','speaking'] : [filter]

    const { data: answers } = await supabase
      .from('exam_answers')
      .select('*,questions(id,content,section,type,competency_tag,cefr_level),exams(id,status,candidate_id,template_id,exam_templates(name,role_profile,passing_cefr))')
      .in('section', sections)
      .not('answer', 'is', null)
      .neq('answer', '')
      .order('created_at', { ascending: true })

    const examIds = Array.from(new Set(answers?.map(a => a.exam_id) || []))
    const candidateMap: Record<string,any> = {}
    for (const eid of examIds) {
      const exam = answers?.find(a => a.exam_id === eid)?.exams
      if (exam?.candidate_id) {
        const { data: cand } = await supabase.from('users').select('full_name,email,organizations(name)').eq('id', exam.candidate_id).single()
        candidateMap[eid] = cand
      }
    }
    answers?.forEach(a => { if (a.exams) a.exams.users = candidateMap[a.exam_id] })

    // Check graded (answer-level or section-level fallback)
    const { data: graded } = await supabase.from('grades').select('exam_id,section,answer_id').eq('evaluator_id', evaluator.id)
    const gradedAnswerIds = new Set(graded?.map(g => g.answer_id).filter(Boolean) || [])
    const gradedKeys = new Set(graded?.map(g => `${g.exam_id}-${g.section}`) || [])

    const pending = answers?.filter(a =>
      !gradedAnswerIds.has(a.id) &&
      !gradedKeys.has(`${a.exam_id}-${a.section}`) &&
      ['completed','grading'].includes(a.exams?.status || '')
    ) || []

    setQueue(pending)
    setStats({ pending: pending.length, graded_today: graded?.length || 0, total: answers?.length || 0 })
    setLoading(false)
  }

  async function loadRubricsForItem(item: any) {
    const { data: qRubrics } = await supabase
      .from('question_rubrics').select('*')
      .eq('question_id', item.questions?.id || item.question_id)
      .order('sort_order')

    let rubrics: RubricScore[]
    if (qRubrics && qRubrics.length > 0) {
      rubrics = qRubrics.map(r => ({ criterion: r.criterion, description: r.description || '', max_score: r.max_score || 10, score: 0, comment: '' }))
    } else {
      const defaults = DEFAULT_RUBRICS[item.section] || DEFAULT_RUBRICS.writing
      rubrics = defaults.map(r => ({ ...r, score: 0, comment: '' }))
    }
    setRubricScores(rubrics)
    setGeneralFeedback('')
    setOverrideCefr(null)

    // Fetch proctoring logs
    const { data: procData } = await supabase.from('proctoring_events').select('*').eq('exam_id', item.exam_id)
    setProctoringEvents(procData || [])
  }

  function openItem(item: any) {
    setActiveItem(item)
    loadRubricsForItem(item)
  }

  // ─── DERIVED SCORING ───
  const totalMaxScore = useMemo(() => rubricScores.reduce((s,r) => s + r.max_score, 0), [rubricScores])
  const totalScore = useMemo(() => rubricScores.reduce((s,r) => s + r.score, 0), [rubricScores])
  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
  const autoSuggestedCefr = useMemo(() => {
    if (percentage >= 91) return 'C2'
    if (percentage >= 76) return 'C1'
    if (percentage >= 61) return 'B2'
    if (percentage >= 41) return 'B1'
    if (percentage >= 21) return 'A2'
    return 'A1'
  }, [percentage])
  const effectiveCefr = overrideCefr || autoSuggestedCefr
  const allScored = rubricScores.every(r => r.score > 0)

  async function submitGrade() {
    if (!activeItem || !allScored) { alert('Please score all criteria before submitting.'); return }
    setSaving(true)

    const feedbackText = generalFeedback || rubricScores.map(r => `${r.criterion}: ${r.score}/${r.max_score}${r.comment ? ' — ' + r.comment : ''}`).join('\n')

    const { data: gradeRow, error: gradeErr } = await supabase.from('grades').insert({
      exam_id: activeItem.exam_id, evaluator_id: evaluator.id, section: activeItem.section,
      answer_id: activeItem.id, numeric_score: percentage, cefr_level: effectiveCefr,
      feedback: feedbackText, graded_at: new Date().toISOString(),
    }).select().single()

    if (gradeErr) { alert('Error: ' + gradeErr.message); setSaving(false); return }

    // Save rubric details
    if (gradeRow) {
      const details = rubricScores.map(r => ({
        grade_id: gradeRow.id, criterion: r.criterion, score: r.score, max_score: r.max_score, comment: r.comment || '',
      }))
      await supabase.from('grade_details').insert(details)
    }

    // Update exam status
    await supabase.from('exams').update({ status: 'grading' }).eq('id', activeItem.exam_id).eq('status', 'completed')

    // Check if all answers graded → trigger auto-scoring
    const { data: examAnswers } = await supabase.from('exam_answers').select('id').eq('exam_id', activeItem.exam_id).in('section', ['writing','speaking']).not('answer', 'is', null).neq('answer', '')
    const { data: examGrades } = await supabase.from('grades').select('answer_id').eq('exam_id', activeItem.exam_id)
    const gradedIds = new Set(examGrades?.map(g => g.answer_id).filter(Boolean) || [])
    if (examAnswers?.every(a => gradedIds.has(a.id))) {
      try { await fetch('/api/score-exam', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({examId:activeItem.exam_id}) }) } catch {}
    }

    setSaving(false); setActiveItem(null); setRubricScores([]); setGeneralFeedback(''); setOverrideCefr(null)
    loadQueue()
  }

  async function loadHistory() {
    setHistoryLoading(true)
    const { data } = await supabase.from('grades').select('*,grade_details(*)').eq('evaluator_id', evaluator.id).order('graded_at', { ascending: false }).limit(30)
    setHistory(data || [])
    setHistoryLoading(false)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  const scoreToColor = (score: number) => score >= 76 ? '#1AD18A' : score >= 61 ? '#3A8ED0' : score >= 41 ? '#B8881A' : '#EF4444'
  const rubricColor = (score: number, max: number) => {
    const pct = max > 0 ? (score / max) * 100 : 0
    return pct >= 80 ? '#1AD18A' : pct >= 60 ? '#3A8ED0' : pct >= 40 ? '#B8881A' : pct > 0 ? '#EF4444' : 'rgba(255,255,255,0.15)'
  }

  return (
    <div style={{minHeight:'100vh',background:'#0B1629',fontFamily:'var(--fb)',display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <div style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:900,color:'#fff'}}>Avil<span style={{color:'#5AAEDF'}}>ingo</span></div>
          <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>Evaluator · Rubric Grading</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={()=>{setShowHistory(!showHistory);if(!showHistory)loadHistory()}}
            style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:showHistory?'rgba(58,142,208,0.2)':'transparent',color:showHistory?'#5AAEDF':'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer',fontFamily:'var(--fb)',fontWeight:600}}>
            {showHistory ? '← Queue' : 'History'}
          </button>
          <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{evaluator?.full_name || evaluator?.email}</span>
          <button onClick={handleSignOut} style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer',fontFamily:'var(--fb)'}}>Sign out</button>
        </div>
      </div>

      {/* ── HISTORY VIEW ── */}
      {showHistory ? (
        <div style={{flex:1,overflowY:'auto',padding:'24px 32px',maxWidth:'900px',margin:'0 auto',width:'100%'}}>
          <h2 style={{fontFamily:'var(--fm)',fontSize:'18px',fontWeight:800,color:'#fff',marginBottom:'16px'}}>Grading History</h2>
          {historyLoading ? (
            <div style={{padding:'32px',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>Loading...</div>
          ) : history.length === 0 ? (
            <div style={{padding:'32px',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>No grading history yet.</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {history.map(g => (
                <div key={g.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'16px 20px',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'100px',background:(sectionColors[g.section]||'#3A8ED0')+'25',color:sectionColors[g.section]||'#3A8ED0',textTransform:'capitalize'}}>{g.section}</span>
                      <span style={{fontSize:'18px',fontWeight:700,color:scoreToColor(g.numeric_score),fontFamily:'var(--fm)'}}>{g.numeric_score}%</span>
                      <span style={{fontSize:'12px',fontWeight:700,padding:'2px 8px',borderRadius:'6px',background:'rgba(58,142,208,0.15)',color:'#5AAEDF'}}>{g.cefr_level}</span>
                    </div>
                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.25)'}}>{new Date(g.graded_at).toLocaleString()}</span>
                  </div>
                  {g.grade_details?.length > 0 && (
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {g.grade_details.map((d:any,di:number) => (
                        <span key={di} style={{fontSize:'11px',padding:'3px 8px',borderRadius:'6px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.5)'}}>
                          {d.criterion}: <strong style={{color:rubricColor(d.score,d.max_score)}}>{d.score}/{d.max_score}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {g.feedback && <p style={{fontSize:'12.5px',color:'rgba(255,255,255,0.5)',lineHeight:1.6,margin:0,whiteSpace:'pre-wrap'}}>{g.feedback}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      /* ── MAIN GRADING VIEW ── */
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* Queue sidebar */}
        <div style={{width:'340px',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
              {[{label:'Pending',value:stats.pending,color:'#EF4444'},{label:'Graded',value:stats.graded_today,color:'#1AD18A'},{label:'Total',value:stats.total,color:'#5AAEDF'}].map(s=>(
                <div key={s.label} style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'8px',textAlign:'center'}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
                  <div style={{fontSize:'18px',fontWeight:700,color:s.color,fontFamily:'var(--fm)'}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'5px'}}>
              {(['all','writing','speaking'] as const).map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{flex:1,padding:'6px',borderRadius:'6px',border:'1px solid',borderColor:filter===f?(sectionColors[f]||'#3A8ED0'):'rgba(255,255,255,0.08)',background:filter===f?'rgba(255,255,255,0.08)':'transparent',color:filter===f?'#fff':'rgba(255,255,255,0.35)',fontSize:'11.5px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',textTransform:'capitalize'}}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {loading ? (
              <div style={{padding:'32px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Loading queue...</div>
            ) : queue.length === 0 ? (
              <div style={{padding:'32px',textAlign:'center'}}>
                <div style={{fontSize:'28px',marginBottom:'10px'}}>✓</div>
                <div style={{fontSize:'14px',fontWeight:600,color:'#1AD18A',marginBottom:'4px'}}>Queue is clear!</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>All submissions have been graded.</div>
              </div>
            ) : queue.map((item) => (
              <div key={item.id} onClick={()=>openItem(item)} style={{padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',background:activeItem?.id===item.id?'rgba(58,142,208,0.12)':'transparent',transition:'background 0.15s'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                  <span style={{fontSize:'10.5px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:(sectionColors[item.section]||'#888')+'25',color:sectionColors[item.section],textTransform:'capitalize',border:'1px solid '+(sectionColors[item.section]||'#888')+'35'}}>{item.section}</span>
                  <span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)'}}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{fontSize:'12.5px',color:'#fff',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.exams?.users?.full_name || item.exams?.users?.email || 'Candidate'}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.questions?.content?.substring(0,60)}...</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── GRADING PANEL ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {!activeItem ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'12px'}}>
              <div style={{fontSize:'32px'}}>📝</div>
              <div style={{fontSize:'14px',color:'rgba(255,255,255,0.3)'}}>Select a submission from the queue</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.15)'}}>Each answer is graded on {DEFAULT_RUBRICS.writing.length}–{DEFAULT_RUBRICS.speaking.length} rubric criteria</div>
            </div>
          ) : (
            <div style={{flex:1,overflowY:'auto',padding:'22px 28px'}}>

              {/* Candidate info bar */}
              <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:'260px',background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'14px 18px',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'3px'}}>{activeItem.exams?.users?.full_name || activeItem.exams?.users?.email}</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>
                    {activeItem.exams?.exam_templates?.name} · Pass: {activeItem.exams?.exam_templates?.passing_cefr}
                    {activeItem.exams?.users?.organizations?.name && ` · ${activeItem.exams.users.organizations.name}`}
                  </div>
                </div>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'100px',background:(sectionColors[activeItem.section]||'#888')+'20',color:sectionColors[activeItem.section],textTransform:'capitalize',border:'1px solid '+(sectionColors[activeItem.section]||'#888')+'35'}}>{activeItem.section}</span>
                  {activeItem.questions?.cefr_level && <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'100px',background:'rgba(58,142,208,0.12)',color:'#5AAEDF'}}>Target: {activeItem.questions.cefr_level}</span>}
                  {activeItem.questions?.competency_tag && <span style={{fontSize:'11px',padding:'4px 10px',borderRadius:'100px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.35)'}}>{activeItem.questions.competency_tag.replace(/_/g,' ')}</span>}
                </div>
              </div>

              {/* Proctoring Warning */}
              {proctoringEvents.length > 0 && (
                <div style={{background:'rgba(239, 68, 68, 0.1)',borderRadius:'12px',padding:'14px 18px',border:'1px solid rgba(239, 68, 68, 0.3)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <span style={{fontSize:'20px'}}>⚠️</span>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:700,color:'#EF4444'}}>Security Alert: {proctoringEvents.length} violations detected during this exam</div>
                    <div style={{fontSize:'12px',color:'rgba(239, 68, 68, 0.7)',marginTop:'2px'}}>
                      {proctoringEvents.filter(e => e.event_type === 'tab_switch').length} tab switches, {proctoringEvents.filter(e => e.event_type === 'fullscreen_exit').length} fullscreen exits.
                    </div>
                  </div>
                </div>
              )}

              {/* Prompt + Response */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'18px'}}>
                <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'16px',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{fontSize:'10.5px',fontWeight:700,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>Prompt</div>
                  <p style={{fontSize:'13.5px',color:'rgba(255,255,255,0.75)',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{activeItem.questions?.content}</p>
                </div>
                <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'16px',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:'10.5px',fontWeight:700,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>
                    Candidate Response
                    {activeItem.section === 'writing' && activeItem.answer && (
                      <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,marginLeft:'8px',color:'rgba(255,255,255,0.15)'}}>
                        {activeItem.answer.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    )}
                  </div>
                  {activeItem.section === 'speaking' ? (
                    <div>
                      {activeItem.audio_url ? <audio src={activeItem.audio_url} controls style={{width:'100%',accentColor:'#B83040'}} />
                       : activeItem.answer ? <p style={{fontSize:'13.5px',color:'#fff',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{activeItem.answer}</p>
                       : <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)',padding:'16px 0',textAlign:'center'}}>No audio available</div>}
                      {activeItem.time_spent_ms && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.2)',marginTop:'8px'}}>Duration: {Math.round(activeItem.time_spent_ms / 1000)}s</div>}
                    </div>
                  ) : (
                    <p style={{fontSize:'13.5px',color:'#fff',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{activeItem.answer}</p>
                  )}
                </div>
              </div>

              {/* ── RUBRIC SCORING GRID ── */}
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'14px',padding:'20px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'16px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Rubric Assessment</div>
                    <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>Score each criterion. Click the bar segments or type a value.</div>
                  </div>
                  <div style={{display:'flex',gap:'4px'}}>
                    {Object.entries(CEFR_BAND_GUIDE).map(([level, info]) => (
                      <div key={level} style={{padding:'2px 6px',borderRadius:'4px',background:'rgba(255,255,255,0.04)',textAlign:'center'}}>
                        <div style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.4)'}}>{level}</div>
                        <div style={{fontSize:'9px',color:'rgba(255,255,255,0.2)'}}>{info.range}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {rubricScores.map((rubric, idx) => (
                    <div key={idx} style={{
                      background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'14px 16px',
                      border:`1px solid ${rubric.score > 0 ? rubricColor(rubric.score, rubric.max_score) + '30' : 'rgba(255,255,255,0.06)'}`,
                      transition:'border-color 0.2s',
                    }}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'8px'}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>{rubric.criterion}</div>
                          <div style={{fontSize:'11.5px',color:'rgba(255,255,255,0.3)',lineHeight:1.5}}>{rubric.description}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0,marginLeft:'16px'}}>
                          <input type="number" min={0} max={rubric.max_score} value={rubric.score}
                            onChange={e=>{
                              const val = Math.max(0, Math.min(rubric.max_score, +e.target.value || 0))
                              const u = [...rubricScores]; u[idx] = {...u[idx], score:val}; setRubricScores(u)
                            }}
                            style={{
                              width:'48px',textAlign:'center',padding:'6px',borderRadius:'7px',
                              border:`2px solid ${rubricColor(rubric.score, rubric.max_score)}`,
                              background:'rgba(255,255,255,0.06)',color:rubricColor(rubric.score, rubric.max_score),
                              fontSize:'16px',fontWeight:700,fontFamily:'var(--fm)',outline:'none',
                            }} />
                          <span style={{fontSize:'12px',color:'rgba(255,255,255,0.2)'}}>/ {rubric.max_score}</span>
                        </div>
                      </div>

                      {/* Clickable score bar */}
                      <div style={{display:'flex',gap:'3px',marginBottom:'8px'}}>
                        {Array.from({length: rubric.max_score + 1}, (_, i) => (
                          <button key={i} onClick={()=>{
                            const u = [...rubricScores]; u[idx] = {...u[idx], score:i}; setRubricScores(u)
                          }} style={{
                            width: i === 0 ? '16px' : '100%', maxWidth:'32px', height:'6px',
                            borderRadius:'3px', border:'none', cursor:'pointer',
                            background: i <= rubric.score && rubric.score > 0 ? rubricColor(rubric.score, rubric.max_score) : 'rgba(255,255,255,0.08)',
                            transition:'background 0.1s', opacity: i === 0 ? 0.4 : 1,
                          }} title={`${i}/${rubric.max_score}`} />
                        ))}
                      </div>

                      <input value={rubric.comment} onChange={e=>{
                        const u = [...rubricScores]; u[idx] = {...u[idx], comment:e.target.value}; setRubricScores(u)
                      }} placeholder={`Notes on ${rubric.criterion.toLowerCase()}...`}
                        style={{width:'100%',padding:'7px 10px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.6)',fontSize:'12px',fontFamily:'var(--fb)',outline:'none'}} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SUMMARY BAR ── */}
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'18px 20px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px'}}>Total</div>
                  <div style={{fontSize:'28px',fontWeight:800,color:scoreToColor(percentage),fontFamily:'var(--fm)',lineHeight:1}}>{percentage}%</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'2px'}}>{totalScore}/{totalMaxScore}</div>
                </div>
                <div style={{flex:1,minWidth:'150px'}}>
                  <div style={{height:'8px',borderRadius:'4px',background:'rgba(255,255,255,0.06)',overflow:'hidden',marginBottom:'6px'}}>
                    <div style={{height:'100%',width:`${percentage}%`,background:scoreToColor(percentage),borderRadius:'4px',transition:'width 0.3s'}} />
                  </div>
                  <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                    {rubricScores.map((r, i) => (
                      <span key={i} style={{fontSize:'10px',padding:'2px 6px',borderRadius:'4px',background:r.score>0?rubricColor(r.score,r.max_score)+'20':'rgba(255,255,255,0.04)',color:r.score>0?rubricColor(r.score,r.max_score):'rgba(255,255,255,0.15)',fontWeight:600}}>
                        {r.criterion.split(' ')[0]}: {r.score}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px'}}>
                    CEFR {overrideCefr ? '(override)' : '(auto)'}
                  </div>
                  <div style={{display:'flex',gap:'4px'}}>
                    {CEFR_LEVELS.map(l => (
                      <button key={l} onClick={()=>setOverrideCefr(overrideCefr===l && l===autoSuggestedCefr ? null : l)}
                        style={{width:'34px',height:'34px',borderRadius:'7px',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',
                          borderColor:effectiveCefr===l?'#3A8ED0':'rgba(255,255,255,0.08)',background:effectiveCefr===l?'rgba(58,142,208,0.2)':'transparent',
                          color:effectiveCefr===l?'#5AAEDF':'rgba(255,255,255,0.25)',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'var(--fb)'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:'10.5px',color:'rgba(255,255,255,0.2)',marginTop:'4px'}}>{CEFR_DESCRIPTORS[effectiveCefr]}</div>
                </div>
              </div>

              {/* General feedback */}
              <div style={{marginBottom:'16px'}}>
                <label style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:'6px'}}>General Feedback (optional)</label>
                <textarea value={generalFeedback} onChange={e=>setGeneralFeedback(e.target.value)}
                  placeholder="Overall observations, recommendations..." rows={3}
                  style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1.5px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:'13px',fontFamily:'var(--fb)',resize:'vertical',lineHeight:1.6,outline:'none'}} />
              </div>

              {/* Submit */}
              <div style={{display:'flex',gap:'10px',paddingBottom:'32px'}}>
                <button onClick={submitGrade} disabled={saving||!allScored}
                  style={{flex:1,padding:'13px',borderRadius:'10px',border:'none',background:allScored?'#3A8ED0':'rgba(255,255,255,0.06)',color:allScored?'#fff':'rgba(255,255,255,0.2)',fontSize:'14px',fontWeight:700,cursor:allScored?'pointer':'not-allowed',fontFamily:'var(--fb)',transition:'all 0.2s'}}>
                  {saving ? 'Submitting...' : allScored ? `Submit — ${effectiveCefr} · ${percentage}% (${totalScore}/${totalMaxScore})` : `Score all ${rubricScores.length} criteria to submit`}
                </button>
                <button onClick={()=>{setActiveItem(null);setRubricScores([])}}
                  style={{padding:'13px 20px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontFamily:'var(--fb)'}}>Skip</button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
