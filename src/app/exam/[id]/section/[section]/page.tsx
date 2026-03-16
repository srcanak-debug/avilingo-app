'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function ExamSectionPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const section = params.section as string

  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [showStrikeModal, setShowStrikeModal] = useState(false)
  const [showTransitionModal, setShowTransitionModal] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [recordingState, setRecordingState] = useState<'idle'|'recording'|'recorded'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const [saving, setSaving] = useState(false)

  const timerRef = useRef<any>(null)
  const questionTimerRef = useRef<any>(null)
  const recordingTimerRef = useRef<any>(null)
  const mediaRecorderRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => { loadExamAndQuestions() }, [])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', e => e.preventDefault())
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [strikes])

  function handleVisibilityChange() {
    if (document.hidden) triggerStrike('tab_switch')
  }
  function handleWindowBlur() { triggerStrike('window_blur') }
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && ['c','v','x'].includes(e.key)) e.preventDefault()
  }

  async function triggerStrike(type: string) {
    const newStrikes = strikes + 1
    setStrikes(newStrikes)
    await supabase.from('violations').insert({ exam_id: examId, type, strike_number: newStrikes })
    if (newStrikes >= 3) {
      await supabase.from('exams').update({ status: 'invalidated' }).eq('id', examId)
      router.push(`/exam/${examId}/invalidated`)
      return
    }
    setShowStrikeModal(true)
  }

  async function loadExamAndQuestions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: examData } = await supabase
      .from('exams')
      .select('*,exam_templates(*)')
      .eq('id', examId)
      .eq('candidate_id', user.id)
      .single()

    if (!examData || examData.status === 'invalidated') { router.push('/exam'); return }
    setExam(examData)

    const template = examData.exam_templates
    const count = template[`${section}_count`] || 10

    // Check if question set already generated
    const { data: existingSet } = await supabase
      .from('exam_question_sets')
      .select('*,questions(*)')
      .eq('exam_id', examId)
      .eq('section', section)
      .order('question_order')

    let questionSet = existingSet || []

    if (questionSet.length === 0) {
      // Generate random question set for this section
      const { data: pool } = await supabase
        .from('questions')
        .select('*')
        .eq('section', section)
        .eq('active', true)
        .eq('is_latest', true)
        .limit(count * 3)

      if (!pool?.length) { setLoading(false); return }

      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count)
      const inserts = shuffled.map((q, i) => ({
        exam_id: examId, question_id: q.id, section, question_order: i
      }))
      await supabase.from('exam_question_sets').insert(inserts)
      questionSet = inserts.map((ins, i) => ({ ...ins, questions: shuffled[i] }))
    }

    setQuestions(questionSet.map((qs: any) => qs.questions))

    // Timer
    const totalMins = template.time_limit_mins || 90
    setTimeLeft(totalMins * 60)

    // Writing micro-timer
    if (section === 'writing') {
      const writingMins = template.writing_timer_mins || 3.5
      setQuestionTimeLeft(Math.round(writingMins * 60))
    }

    setLoading(false)
    startGlobalTimer()
  }

  function startGlobalTimer() {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSectionComplete(); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function startQuestionTimer(seconds: number) {
    clearInterval(questionTimerRef.current)
    setQuestionTimeLeft(seconds)
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(t => {
        if (t <= 1) { clearInterval(questionTimerRef.current); handleNextQuestion(true); return 0 }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (!loading && section === 'writing' && exam) {
      const mins = exam.exam_templates?.writing_timer_mins || 3.5
      startQuestionTimer(Math.round(mins * 60))
    }
  }, [currentIndex, loading])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  function handleAnswer(questionId: string, answer: string) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    if (section === 'writing') setWordCount(answer.trim().split(/\s+/).filter(Boolean).length)
  }

  async function saveAnswer(questionId: string, answer: string) {
    await supabase.from('exam_answers').upsert({
      exam_id: examId, question_id: questionId, section, answer,
      time_spent_ms: 0
    }, { onConflict: 'exam_id,question_id' })
  }

  function handleNextQuestion(autoAdvance = false) {
    const currentQ = questions[currentIndex]
    if (currentQ) saveAnswer(currentQ.id, answers[currentQ.id] || '')
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      setWordCount(0)
      setRecordingState('idle')
      setAttempts(0)
      setAudioPlayed(false)
    } else {
      setShowTransitionModal(true)
    }
  }

  async function handleSectionComplete() {
    setSaving(true)
    // Save all remaining answers
    for (const q of questions) {
      await saveAnswer(q.id, answers[q.id] || '')
    }
    clearInterval(timerRef.current)
    clearInterval(questionTimerRef.current)

    // Auto-grade grammar, reading, listening
    if (['grammar','reading','listening'].includes(section)) {
      for (const q of questions) {
        const answer = answers[q.id] || ''
        const correct = q.correct_answer?.trim().toLowerCase()
        const given = answer.trim().toLowerCase()
        const score = correct && given === correct ? 1 : 0
        await supabase.from('exam_answers').upsert({
          exam_id: examId, question_id: q.id, section, answer, auto_score: score
        }, { onConflict: 'exam_id,question_id' })
      }
    }

    setSaving(false)
    // Navigate to next section
    const template = exam?.exam_templates
    const role = template?.role_profile || 'general'
    const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general).filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
    const currentSectionIndex = sectionOrder.indexOf(section)
    const nextSection = sectionOrder[currentSectionIndex + 1]

    if (nextSection) {
      setShowTransitionModal(false)
      router.push(`/exam/${examId}/section/${nextSection}`)
    } else {
      // All sections done
      await supabase.from('exams').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', examId)
      router.push(`/exam/${examId}/complete`)
    }
  }

  const currentQ = questions[currentIndex]

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0B1629',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)'}}>Loading questions...</div>
    </div>
  )

  if (!currentQ) return (
    <div style={{minHeight:'100vh',background:'#0B1629',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)',textAlign:'center'}}>
        <div style={{marginBottom:'16px'}}>No questions available for this section.</div>
        <button onClick={handleSectionComplete} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',cursor:'pointer',fontFamily:'var(--fb)'}}>Continue →</button>
      </div>
    </div>
  )

  const template = exam?.exam_templates
  const role = template?.role_profile || 'general'
  const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general).filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
  const sectionIndex = sectionOrder.indexOf(section)
  const isTimeCritical = timeLeft < 300

  return (
    <div style={{minHeight:'100vh',background:'#0B1629',fontFamily:'var(--fb)',display:'flex',flexDirection:'column',userSelect:'none'}}>

      {/* Strike modal */}
      {showStrikeModal && (
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#1A2744',borderRadius:'16px',padding:'32px',maxWidth:'400px',textAlign:'center',border:'2px solid #EF4444'}}>
            <div style={{fontSize:'36px',marginBottom:'12px'}}>⚠️</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'#fff',marginBottom:'8px'}}>Warning — Strike {strikes} of 3</h3>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'20px'}}>Focus violation detected. {3-strikes} strike{3-strikes!==1?'s':''} remaining before automatic invalidation.</p>
            <button onClick={()=>setShowStrikeModal(false)} style={{padding:'10px 28px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>I Understand — Continue</button>
          </div>
        </div>
      )}

      {/* Transition modal */}
      {showTransitionModal && (
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#1A2744',borderRadius:'16px',padding:'32px',maxWidth:'420px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>🔒</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'20px',fontWeight:800,color:'#fff',marginBottom:'8px',textTransform:'capitalize'}}>{section} Section Complete</h3>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'6px'}}>You are about to permanently lock this section.</p>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'24px'}}>You cannot return to this section after confirming.</p>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={handleSectionComplete} disabled={saving} style={{padding:'11px 24px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                {saving ? 'Saving...' : 'Confirm & Continue →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'12px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:sectionColors[section]+'30',color:sectionColors[section],textTransform:'capitalize',border:'1px solid '+sectionColors[section]+'50'}}>{section}</span>
          <span style={{fontSize:'12.5px',color:'rgba(255,255,255,0.35)'}}>Question {currentIndex+1} of {questions.length}</span>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          {section === 'writing' && (
            <span style={{fontSize:'13px',fontWeight:700,color:questionTimeLeft < 60 ? '#EF4444' : '#F59E0B'}}>
              ⏱ {formatTime(questionTimeLeft)}
            </span>
          )}
          <span style={{fontSize:'14px',fontWeight:700,color:isTimeCritical?'#EF4444':'rgba(255,255,255,0.7)'}}>
            {formatTime(timeLeft)}
          </span>
          {strikes > 0 && (
            <span style={{fontSize:'12px',fontWeight:700,color:'#EF4444'}}>⚠️ {strikes}/3 strikes</span>
          )}
        </div>

        {/* Section progress */}
        <div style={{display:'flex',gap:'4px'}}>
          {sectionOrder.map((s: string, i: number) => (
            <div key={s} style={{width:'28px',height:'4px',borderRadius:'2px',background:i<sectionIndex?sectionColors[s]:s===section?sectionColors[s]:'rgba(255,255,255,0.1)',opacity:i<sectionIndex?0.5:1}} />
          ))}
        </div>
      </div>

      {/* Question progress bar */}
      <div style={{height:'3px',background:'rgba(255,255,255,0.06)'}}>
        <div style={{height:'100%',background:sectionColors[section],width:`${((currentIndex+1)/questions.length)*100}%`,transition:'width 0.3s'}} />
      </div>

      {/* Main content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
        <div style={{width:'100%',maxWidth:'720px'}}>

          {/* Question */}
          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'24px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'20px'}}>
            <div style={{fontSize:'11px',fontWeight:700,color:sectionColors[section],textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'12px'}}>{section} · Question {currentIndex+1}</div>
            <p style={{fontSize:'16px',color:'#fff',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{currentQ.content}</p>
            {currentQ.audio_url && section === 'listening' && (
              <div style={{marginTop:'16px'}}>
                <audio ref={audioRef} src={currentQ.audio_url} controls={!audioPlayed} onEnded={()=>setAudioPlayed(true)} style={{width:'100%',accentColor:sectionColors[section]}} />
                {audioPlayed && <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',marginTop:'6px'}}>Audio has been played. You cannot replay it.</div>}
              </div>
            )}
          </div>

          {/* Answer area */}
          {(section === 'grammar' || section === 'reading') && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {['A','B','C','D'].map((opt, idx) => {
                const optionText = currentQ.content?.split('\n').find((l: string) => l.startsWith(`${opt}.`) || l.startsWith(`${opt})`))?.replace(/^[A-D][\.\)]\s*/,'')
                if (!optionText && idx >= 2) return null
                const displayText = optionText || `Option ${opt}`
                return (
                  <button key={opt} onClick={()=>handleAnswer(currentQ.id, opt)} style={{padding:'14px 18px',borderRadius:'10px',border:'2px solid',borderColor:answers[currentQ.id]===opt?sectionColors[section]:'rgba(255,255,255,0.08)',background:answers[currentQ.id]===opt?sectionColors[section]+'20':'rgba(255,255,255,0.03)',color:'#fff',fontSize:'14px',cursor:'pointer',fontFamily:'var(--fb)',textAlign:'left',display:'flex',gap:'12px',alignItems:'center',transition:'all 0.15s'}}>
                    <span style={{width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid',borderColor:answers[currentQ.id]===opt?sectionColors[section]:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,flexShrink:0,color:answers[currentQ.id]===opt?sectionColors[section]:'rgba(255,255,255,0.4)'}}>{opt}</span>
                    {displayText}
                  </button>
                )
              })}
            </div>
          )}

          {section === 'listening' && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {['A','B','C','D'].map((opt) => (
                <button key={opt} onClick={()=>handleAnswer(currentQ.id, opt)} style={{padding:'14px 18px',borderRadius:'10px',border:'2px solid',borderColor:answers[currentQ.id]===opt?sectionColors[section]:'rgba(255,255,255,0.08)',background:answers[currentQ.id]===opt?sectionColors[section]+'20':'rgba(255,255,255,0.03)',color:'#fff',fontSize:'14px',cursor:'pointer',fontFamily:'var(--fb)',textAlign:'left',display:'flex',gap:'12px',alignItems:'center'}}>
                  <span style={{width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid',borderColor:answers[currentQ.id]===opt?sectionColors[section]:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,flexShrink:0,color:answers[currentQ.id]===opt?sectionColors[section]:'rgba(255,255,255,0.4)'}}>{opt}</span>
                  Option {opt}
                </button>
              ))}
            </div>
          )}

          {section === 'writing' && (
            <div>
              <textarea value={answers[currentQ.id]||''} onChange={e=>handleAnswer(currentQ.id,e.target.value)} placeholder="Write your answer here..." rows={8} style={{width:'100%',padding:'16px',borderRadius:'10px',border:'2px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'14px',fontFamily:'var(--fb)',resize:'vertical',lineHeight:1.7,outline:'none'}} onCopy={e=>e.preventDefault()} onPaste={e=>e.preventDefault()} />
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px'}}>
                <span style={{fontSize:'12px',color:wordCount>=40?'#1AD18A':'rgba(255,255,255,0.3)'}}>
                  {wordCount} words {wordCount<40?`(minimum 40 — ${40-wordCount} more needed)`:' ✓'}
                </span>
                <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>Copy/paste disabled</span>
              </div>
            </div>
          )}

          {section === 'speaking' && (
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'24px',textAlign:'center',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>Attempts used: {attempts} / {template?.speaking_attempts || 3}</div>
              {recordingState === 'idle' && attempts < (template?.speaking_attempts || 3) && (
                <button onClick={()=>setRecordingState('recording')} style={{padding:'14px 32px',borderRadius:'100px',border:'2px solid #B83040',background:'transparent',color:'#B83040',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
                  ● Start Recording
                </button>
              )}
              {recordingState === 'recording' && (
                <div>
                  <div style={{fontSize:'24px',fontWeight:700,color:'#B83040',fontFamily:'var(--fm)',marginBottom:'12px'}}>● REC {recordingTime}s</div>
                  <button onClick={()=>{setRecordingState('recorded');setAttempts(a=>a+1)}} disabled={recordingTime<30} style={{padding:'12px 28px',borderRadius:'100px',border:'none',background:recordingTime>=30?'#B83040':'rgba(255,255,255,0.1)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:recordingTime>=30?'pointer':'not-allowed',fontFamily:'var(--fb)'}}>
                    Stop {recordingTime<30?`(min 30s — wait ${30-recordingTime}s)`:'& Save'}
                  </button>
                </div>
              )}
              {recordingState === 'recorded' && (
                <div>
                  <div style={{fontSize:'14px',color:'#1AD18A',marginBottom:'12px'}}>✓ Recording saved</div>
                  {attempts < (template?.speaking_attempts || 3) && (
                    <button onClick={()=>{setRecordingState('idle');handleAnswer(currentQ.id,'recorded')}} style={{padding:'10px 20px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer',fontFamily:'var(--fb)',marginRight:'8px'}}>
                      Re-record (burns attempt)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'20px'}}>
            <div style={{fontSize:'12.5px',color:'rgba(255,255,255,0.25)'}}>
              {section === 'writing' && 'Auto-advances when timer expires'}
              {section === 'speaking' && `${(template?.speaking_attempts||3) - attempts} attempt${(template?.speaking_attempts||3)-attempts!==1?'s':''} remaining`}
            </div>
            <button onClick={()=>handleNextQuestion()} style={{padding:'11px 28px',borderRadius:'9px',border:'none',background:sectionColors[section],color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
              {currentIndex < questions.length-1 ? 'Next →' : 'Complete Section →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
