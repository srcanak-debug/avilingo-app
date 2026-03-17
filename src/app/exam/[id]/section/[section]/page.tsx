'use client'
import { useEffect, useState, useRef } from 'react'
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

const sectionIcons: Record<string,string> = {
  grammar:'G', reading:'R', writing:'W', speaking:'S', listening:'L'
}

const sectionDescriptions: Record<string,string> = {
  grammar: 'Multiple choice questions testing aviation grammar and structural accuracy.',
  reading: 'Read operational texts (SOPs, NOTAMs, safety protocols) and answer questions.',
  listening: 'Listen carefully. Each audio plays ONCE only. Answer the questions.',
  writing: 'Write responses to aviation scenarios. Each question has a time limit.',
  speaking: 'Record your spoken responses. You have limited attempts per question.',
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
  const [phase, setPhase] = useState<'prep'|'exam'>('prep')
  const [prepCountdown, setPrepCountdown] = useState(45)
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
  const [pipStream, setPipStream] = useState<MediaStream|null>(null)

  const timerRef = useRef<any>(null)
  const questionTimerRef = useRef<any>(null)
  const recordingTimerRef = useRef<any>(null)
  const prepTimerRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const strikesRef = useRef(0)

  useEffect(() => { loadExamAndQuestions() }, [])

  // Sync strikesRef with strikes state
  useEffect(() => { strikesRef.current = strikes }, [strikes])

  // Anti-cheat listeners
  useEffect(() => {
    if (phase !== 'exam') return
    const onVisibility = () => { if (document.hidden) triggerStrike('tab_switch') }
    const onBlur = () => triggerStrike('window_blur')
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey) && ['c','v','x'].includes(e.key)) e.preventDefault() }
    const onContext = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('keydown', onKey)
    document.addEventListener('contextmenu', onContext)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('contextmenu', onContext)
    }
  }, [phase])

  // Start PiP camera
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setPipStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch { /* camera unavailable */ }
  }

  useEffect(() => {
    if (phase === 'exam') startCamera()
    return () => { pipStream?.getTracks().forEach(t => t.stop()) }
  }, [phase])

  // Prep countdown
  useEffect(() => {
    if (phase !== 'prep' || loading) return
    setPrepCountdown(45)
    prepTimerRef.current = setInterval(() => {
      setPrepCountdown(c => {
        if (c <= 1) { clearInterval(prepTimerRef.current); setPhase('exam'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(prepTimerRef.current)
  }, [phase, loading])

  // Writing micro-timer — restart when question changes
  useEffect(() => {
    if (phase !== 'exam' || section !== 'writing' || !exam || loading) return
    const mins = exam.exam_templates?.writing_timer_mins || 3.5
    startQuestionTimer(Math.round(mins * 60))
    return () => clearInterval(questionTimerRef.current)
  }, [currentIndex, phase])

  // Recording timer
  useEffect(() => {
    if (recordingState === 'recording') {
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } else {
      clearInterval(recordingTimerRef.current)
    }
    return () => clearInterval(recordingTimerRef.current)
  }, [recordingState])

  async function triggerStrike(type: string) {
    const newStrikes = strikesRef.current + 1
    strikesRef.current = newStrikes
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
      .from('exams').select('*,exam_templates(*)')
      .eq('id', examId).eq('candidate_id', user.id).single()

    if (!examData || examData.status === 'invalidated') { router.push('/exam'); return }
    setExam(examData)

    const template = examData.exam_templates
    const count = template[`${section}_count`] || 10

    const { data: existingSet } = await supabase
      .from('exam_question_sets').select('*,questions(*)')
      .eq('exam_id', examId).eq('section', section).order('question_order')

    let questionSet = existingSet || []

    if (questionSet.length === 0) {
      const { data: pool } = await supabase
        .from('questions').select('*')
        .eq('section', section).eq('active', true).eq('is_latest', true)
        .limit(count * 5)

      if (!pool?.length) { setLoading(false); return }
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count)
      const inserts = shuffled.map((q, i) => ({ exam_id: examId, question_id: q.id, section, question_order: i }))
      await supabase.from('exam_question_sets').insert(inserts)
      questionSet = inserts.map((ins, i) => ({ ...ins, questions: shuffled[i] }))
    }

    setQuestions(questionSet.map((qs: any) => qs.questions).filter(Boolean))

    const totalMins = template.time_limit_mins || 90
    setTimeLeft(totalMins * 60)
    setLoading(false)
    // Start global timer after prep phase ends (handled in phase effect)
  }

  // Start global timer when exam phase begins
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSectionComplete(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

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
      exam_id: examId, question_id: questionId, section, answer, time_spent_ms: 0
    }, { onConflict: 'exam_id,question_id' })
  }

  function handleNextQuestion(autoAdvance = false) {
    const currentQ = questions[currentIndex]
    if (currentQ) saveAnswer(currentQ.id, answers[currentQ.id] || '')
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      setWordCount(0)
      setRecordingState('idle')
      setRecordingTime(0)
      setAttempts(0)
      setAudioPlayed(false)
    } else {
      setShowTransitionModal(true)
    }
  }

  async function handleSectionComplete() {
    setSaving(true)
    for (const q of questions) await saveAnswer(q.id, answers[q.id] || '')
    clearInterval(timerRef.current)
    clearInterval(questionTimerRef.current)
    pipStream?.getTracks().forEach(t => t.stop())

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
    const template = exam?.exam_templates
    const role = template?.role_profile || 'general'
    const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general)
      .filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
    const nextSection = sectionOrder[sectionOrder.indexOf(section) + 1]

    if (nextSection) {
      setShowTransitionModal(false)
      router.push(`/exam/${examId}/section/${nextSection}`)
    } else {
      await supabase.from('exams').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', examId)
      router.push(`/exam/${examId}/complete`)
    }
  }

  const currentQ = questions[currentIndex]
  const template = exam?.exam_templates
  const role = template?.role_profile || 'general'
  const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general)
    .filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
  const sectionIndex = sectionOrder.indexOf(section)
  const isTimeCritical = timeLeft < 300
  const maxSpeakingAttempts = template?.speaking_attempts || 3
  const minWords = 40

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0B1629',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff',fontFamily:'var(--fb)',fontSize:'16px'}}>Loading questions...</div>
    </div>
  )

  // ── PREP SCREEN ──
  if (phase === 'prep') return (
    <div style={{minHeight:'100vh',background:'#0B1629',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fb)',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'560px',textAlign:'center'}}>
        <div style={{width:'80px',height:'80px',borderRadius:'50%',background:sectionColors[section]+'20',border:'2px solid'+sectionColors[section],display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:'28px',fontWeight:800,color:sectionColors[section],fontFamily:'var(--fm)'}}>
          {sectionIcons[section]}
        </div>
        <div style={{fontSize:'11px',fontWeight:700,color:sectionColors[section],textTransform:'uppercase',letterSpacing:'2px',marginBottom:'10px'}}>
          Section {sectionIndex + 1} of {sectionOrder.length}
        </div>
        <h2 style={{fontFamily:'var(--fm)',fontSize:'28px',fontWeight:900,color:'#fff',marginBottom:'12px',textTransform:'capitalize'}}>{section}</h2>
        <p style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',lineHeight:1.7,marginBottom:'32px',maxWidth:'400px',margin:'0 auto 32px'}}>{sectionDescriptions[section]}</p>

        <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'20px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'28px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Questions</div>
              <div style={{fontSize:'22px',fontWeight:700,color:'#fff',fontFamily:'var(--fm)'}}>{questions.length}</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                {section === 'writing' ? 'Per Question' : 'Total Time'}
              </div>
              <div style={{fontSize:'22px',fontWeight:700,color:'#fff',fontFamily:'var(--fm)'}}>
                {section === 'writing' ? `${template?.writing_timer_mins || 3.5}m` : `${template?.time_limit_mins || 90}m`}
              </div>
            </div>
          </div>
          {section === 'listening' && (
            <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(124,58,237,0.15)',borderRadius:'8px',border:'1px solid rgba(124,58,237,0.3)',fontSize:'13px',color:'#C4B5FD'}}>
              ⚠️ Each audio clip plays exactly once. Listen carefully — you cannot replay it.
            </div>
          )}
          {section === 'speaking' && (
            <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(184,48,64,0.15)',borderRadius:'8px',border:'1px solid rgba(184,48,64,0.3)',fontSize:'13px',color:'#FCA5A5'}}>
              🎙️ You have {maxSpeakingAttempts} recording attempts per question. Minimum 30 seconds required.
            </div>
          )}
          {section === 'writing' && (
            <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(184,136,26,0.15)',borderRadius:'8px',border:'1px solid rgba(184,136,26,0.3)',fontSize:'13px',color:'#FCD34D'}}>
              ✍️ Minimum {minWords} words required. Copy/paste is disabled. Timer auto-advances when expired.
            </div>
          )}
        </div>

        <div style={{fontSize:'48px',fontWeight:900,color:sectionColors[section],fontFamily:'var(--fm)',marginBottom:'8px'}}>{prepCountdown}</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)',marginBottom:'24px'}}>seconds until this section begins automatically</div>

        <button onClick={() => { clearInterval(prepTimerRef.current); setPhase('exam') }} style={{padding:'13px 36px',borderRadius:'10px',border:'none',background:sectionColors[section],color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
          Start Now →
        </button>
      </div>
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

  return (
    <div style={{minHeight:'100vh',background:'#0B1629',fontFamily:'var(--fb)',display:'flex',flexDirection:'column',userSelect:'none',position:'relative'}}>

      {/* PiP Camera — always visible during exam */}
      {pipStream && (
        <div style={{position:'fixed',top:'16px',left:'16px',zIndex:900,width:'120px',height:'90px',borderRadius:'10px',overflow:'hidden',border:'2px solid rgba(255,255,255,0.15)',background:'#000'}}>
          <video ref={videoRef} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}} />
          <div style={{position:'absolute',bottom:'4px',left:'6px',fontSize:'9px',fontWeight:700,color:'rgba(255,255,255,0.6)',letterSpacing:'0.5px'}}>● REC</div>
        </div>
      )}

      {/* Strike modal */}
      {showStrikeModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#1A2744',borderRadius:'16px',padding:'36px',maxWidth:'400px',textAlign:'center',border:'2px solid #EF4444'}}>
            <div style={{fontSize:'48px',marginBottom:'12px'}}>⚠️</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:800,color:'#EF4444',marginBottom:'8px'}}>Strike {strikes} of 3</h3>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'8px'}}>Focus violation detected.</p>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'24px'}}>{3-strikes} strike{3-strikes!==1?'s':''} remaining before automatic invalidation with score 0.</p>
            <button onClick={()=>setShowStrikeModal(false)} style={{padding:'11px 28px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>I Understand — Continue</button>
          </div>
        </div>
      )}

      {/* Transition modal */}
      {showTransitionModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#1A2744',borderRadius:'16px',padding:'36px',maxWidth:'440px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🔒</div>
            <h3 style={{fontFamily:'var(--fm)',fontSize:'22px',fontWeight:800,color:'#fff',marginBottom:'8px',textTransform:'capitalize'}}>{section} Complete</h3>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'6px'}}>This section will be permanently locked.</p>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'28px'}}>You cannot return to this section after confirming.</p>
            <button onClick={handleSectionComplete} disabled={saving} style={{padding:'12px 32px',borderRadius:'8px',border:'none',background:'#3A8ED0',color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)'}}>
              {saving ? 'Saving...' : 'Lock & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'10px 24px 10px 152px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'12px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',background:sectionColors[section]+'30',color:sectionColors[section],textTransform:'capitalize',border:'1px solid'+sectionColors[section]+'50'}}>{section}</span>
          <span style={{fontSize:'12.5px',color:'rgba(255,255,255,0.4)'}}>Q {currentIndex+1} / {questions.length}</span>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          {section === 'writing' && questionTimeLeft > 0 && (
            <span style={{fontSize:'13px',fontWeight:700,color:questionTimeLeft<60?'#EF4444':'#F59E0B',background:'rgba(255,255,255,0.06)',padding:'4px 10px',borderRadius:'6px'}}>
              ⏱ {formatTime(questionTimeLeft)}
            </span>
          )}
          <span style={{fontSize:'15px',fontWeight:700,color:isTimeCritical?'#EF4444':'rgba(255,255,255,0.8)',fontFamily:'var(--fm)'}}>
            {formatTime(timeLeft)}
          </span>
          {strikes > 0 && (
            <span style={{fontSize:'12px',fontWeight:700,color:'#EF4444',background:'rgba(239,68,68,0.15)',padding:'3px 9px',borderRadius:'6px'}}>⚠️ {strikes}/3</span>
          )}
        </div>

        <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
          {sectionOrder.map((s: string, i: number) => (
            <div key={s} style={{width:'24px',height:'4px',borderRadius:'2px',background:i<sectionIndex?sectionColors[s]:s===section?sectionColors[s]:'rgba(255,255,255,0.08)',opacity:i<sectionIndex?0.4:1}} />
          ))}
        </div>
      </div>

      {/* Question progress bar */}
      <div style={{height:'2px',background:'rgba(255,255,255,0.05)'}}>
        <div style={{height:'100%',background:sectionColors[section],width:`${((currentIndex+1)/questions.length)*100}%`,transition:'width 0.3s'}} />
      </div>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
        <div style={{width:'100%',maxWidth:'720px'}}>

          {/* Question card */}
          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'24px',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'20px'}}>
            <div style={{fontSize:'10.5px',fontWeight:700,color:sectionColors[section],textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>{section} · Question {currentIndex+1}</div>
            <p style={{fontSize:'15.5px',color:'#fff',lineHeight:1.75,whiteSpace:'pre-wrap',margin:0}}>{currentQ.content}</p>

            {/* Listening audio — single play */}
            {section === 'listening' && currentQ.audio_url && (
              <div style={{marginTop:'16px'}}>
                {!audioPlayed ? (
                  <audio
                    src={currentQ.audio_url}
                    controls
                    onEnded={()=>setAudioPlayed(true)}
                    style={{width:'100%',accentColor:sectionColors.listening}}
                    onPlay={()=>{}}
                  />
                ) : (
                  <div style={{padding:'12px 16px',background:'rgba(124,58,237,0.1)',borderRadius:'8px',border:'1px solid rgba(124,58,237,0.2)',fontSize:'13px',color:'#C4B5FD',display:'flex',alignItems:'center',gap:'8px'}}>
                    <span>🔒</span> Audio has been played. Replay is not permitted.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grammar / Reading — MCQ */}
          {(section === 'grammar' || section === 'reading' || section === 'listening') && (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {['A','B','C','D'].map((opt, idx) => {
                const lines = currentQ.content?.split('\n') || []
                const optionLine = lines.find((l: string) => l.trim().match(new RegExp(`^${opt}[.)\\s]`)))
                const displayText = optionLine
                  ? optionLine.replace(/^[A-D][.)]\s*/, '')
                  : `Option ${opt}`
                const hasOptions = lines.some((l: string) => l.trim().match(/^[A-D][.)]/))
                if (hasOptions && !optionLine) return null
                return (
                  <button key={opt} onClick={()=>handleAnswer(currentQ.id, displayText)} style={{padding:'14px 18px',borderRadius:'10px',border:'2px solid',borderColor:answers[currentQ.id]===displayText?sectionColors[section]:'rgba(255,255,255,0.08)',background:answers[currentQ.id]===displayText?sectionColors[section]+'20':'rgba(255,255,255,0.03)',color:'#fff',fontSize:'14px',cursor:'pointer',fontFamily:'var(--fb)',textAlign:'left',display:'flex',gap:'12px',alignItems:'center',transition:'all 0.15s'}}>
                    <span style={{width:'26px',height:'26px',borderRadius:'50%',border:'1.5px solid',borderColor:answers[currentQ.id]===displayText?sectionColors[section]:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,flexShrink:0,color:answers[currentQ.id]===displayText?sectionColors[section]:'rgba(255,255,255,0.4)',background:answers[currentQ.id]===displayText?sectionColors[section]+'15':'transparent'}}>{opt}</span>
                    {displayText}
                  </button>
                )
              })}
            </div>
          )}

          {/* Writing */}
          {section === 'writing' && (
            <div>
              <textarea
                value={answers[currentQ.id]||''}
                onChange={e=>handleAnswer(currentQ.id,e.target.value)}
                placeholder="Write your answer here in full sentences..."
                rows={9}
                style={{width:'100%',padding:'16px',borderRadius:'10px',border:'2px solid',borderColor:wordCount>=minWords?'rgba(26,209,138,0.3)':'rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'14px',fontFamily:'var(--fb)',resize:'none',lineHeight:1.75,outline:'none',transition:'border-color 0.2s'}}
                onCopy={e=>e.preventDefault()}
                onPaste={e=>e.preventDefault()}
                onCut={e=>e.preventDefault()}
              />
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontSize:'13px',fontWeight:700,color:wordCount>=minWords?'#1AD18A':wordCount>minWords*0.7?'#F59E0B':'rgba(255,255,255,0.4)'}}>
                    {wordCount} words
                  </span>
                  {wordCount < minWords && (
                    <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>({minWords - wordCount} more needed)</span>
                  )}
                  {wordCount >= minWords && (
                    <span style={{fontSize:'12px',color:'#1AD18A'}}>✓ Minimum met</span>
                  )}
                </div>
                <span style={{fontSize:'11.5px',color:'rgba(255,255,255,0.2)'}}>Copy/paste disabled</span>
              </div>
            </div>
          )}

          {/* Speaking */}
          {section === 'speaking' && (
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'12px',padding:'28px',textAlign:'center',border:'1px solid rgba(255,255,255,0.08)'}}>
              {/* Attempt tracker */}
              <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'20px'}}>
                {Array.from({length:maxSpeakingAttempts}).map((_,i)=>(
                  <div key={i} style={{width:'32px',height:'32px',borderRadius:'50%',border:'2px solid',borderColor:i<attempts?'#B83040':i===attempts&&recordingState!=='idle'?'#B83040':'rgba(255,255,255,0.15)',background:i<attempts?'rgba(184,48,64,0.2)':i===attempts&&recordingState!=='idle'?'rgba(184,48,64,0.1)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:i<attempts?'#B83040':i===attempts&&recordingState!=='idle'?'#B83040':'rgba(255,255,255,0.3)'}}>
                    {i<attempts?'✓':i+1}
                  </div>
                ))}
              </div>
              <div style={{fontSize:'12.5px',color:'rgba(255,255,255,0.35)',marginBottom:'20px'}}>
                Attempt {Math.min(attempts+1,maxSpeakingAttempts)} of {maxSpeakingAttempts}
              </div>

              {recordingState === 'idle' && attempts < maxSpeakingAttempts && (
                <button onClick={()=>setRecordingState('recording')} style={{padding:'16px 40px',borderRadius:'100px',border:'2px solid #B83040',background:'rgba(184,48,64,0.1)',color:'#B83040',fontSize:'16px',fontWeight:600,cursor:'pointer',fontFamily:'var(--fb)',display:'inline-flex',alignItems:'center',gap:'10px'}}>
                  <span style={{width:'12px',height:'12px',borderRadius:'50%',background:'#B83040',display:'inline-block'}}></span>
                  Start Recording
                </button>
              )}

              {recordingState === 'idle' && attempts >= maxSpeakingAttempts && (
                <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>Maximum attempts reached. Click Next to continue.</div>
              )}

              {recordingState === 'recording' && (
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',marginBottom:'16px'}}>
                    <span style={{width:'14px',height:'14px',borderRadius:'50%',background:'#EF4444',display:'inline-block',animation:'pulse 1s infinite'}}></span>
                    <span style={{fontSize:'28px',fontWeight:700,color:'#fff',fontFamily:'var(--fm)'}}>{formatTime(recordingTime)}</span>
                  </div>
                  <div style={{fontSize:'12.5px',color:'rgba(255,255,255,0.3)',marginBottom:'20px'}}>
                    {recordingTime < 30 ? `Minimum 30 seconds — ${30 - recordingTime}s remaining` : 'You may stop recording now'}
                  </div>
                  <div style={{height:'4px',background:'rgba(255,255,255,0.08)',borderRadius:'2px',marginBottom:'20px',overflow:'hidden'}}>
                    <div style={{height:'100%',background:recordingTime>=30?'#1AD18A':'#B83040',width:`${Math.min((recordingTime/30)*100,100)}%`,transition:'width 0.5s,background 0.3s',borderRadius:'2px'}}/>
                  </div>
                  <button onClick={()=>{if(recordingTime>=30){setRecordingState('recorded');setAttempts(a=>a+1);handleAnswer(currentQ.id,'recorded')}}} disabled={recordingTime<30} style={{padding:'13px 32px',borderRadius:'100px',border:'none',background:recordingTime>=30?'#B83040':'rgba(255,255,255,0.08)',color:'#fff',fontSize:'14px',fontWeight:600,cursor:recordingTime>=30?'pointer':'not-allowed',fontFamily:'var(--fb)'}}>
                    Stop & Save
                  </button>
                </div>
              )}

              {recordingState === 'recorded' && (
                <div>
                  <div style={{fontSize:'16px',fontWeight:600,color:'#1AD18A',marginBottom:'6px'}}>✓ Recording saved ({recordingTime}s)</div>
                  <div style={{fontSize:'12.5px',color:'rgba(255,255,255,0.3)',marginBottom:'16px'}}>
                    {attempts < maxSpeakingAttempts ? `${maxSpeakingAttempts - attempts} attempt${maxSpeakingAttempts-attempts!==1?'s':''} remaining` : 'No attempts remaining'}
                  </div>
                  {attempts < maxSpeakingAttempts && (
                    <button onClick={()=>{setRecordingState('idle');setRecordingTime(0)}} style={{padding:'9px 20px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer',fontFamily:'var(--fb)'}}>
                      Re-record (uses 1 attempt)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'20px'}}>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.2)'}}>
              {section === 'writing' && 'Timer auto-advances when expired'}
              {section === 'speaking' && recordingState==='recording' && 'Recording in progress...'}
            </div>
            <button
              onClick={()=>handleNextQuestion()}
              disabled={
                (section==='writing' && wordCount < minWords) ||
                (section==='speaking' && recordingState==='recording')
              }
              style={{padding:'11px 28px',borderRadius:'9px',border:'none',background:
                (section==='writing'&&wordCount<minWords)||(section==='speaking'&&recordingState==='recording')
                  ?'rgba(255,255,255,0.1)':sectionColors[section],
                color:'#fff',fontSize:'14px',fontWeight:600,
                cursor:(section==='writing'&&wordCount<minWords)||(section==='speaking'&&recordingState==='recording')?'not-allowed':'pointer',
                fontFamily:'var(--fb)',transition:'background 0.2s'}}>
              {currentIndex < questions.length-1 ? 'Next →' : 'Complete Section →'}
            </button>
          </div>

          {section === 'writing' && wordCount < minWords && (
            <div style={{textAlign:'right',marginTop:'6px',fontSize:'12px',color:'#F59E0B'}}>
              Write at least {minWords} words to continue
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
