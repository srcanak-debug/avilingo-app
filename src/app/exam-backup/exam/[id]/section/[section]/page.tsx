'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ── CONSTANTS ── */
const ROLE_SECTION_ORDER: Record<string, string[]> = {
  general: ['grammar', 'reading', 'listening', 'writing', 'speaking'],
  flight_deck: ['grammar', 'reading', 'listening', 'writing', 'speaking'],
  cabin_crew: ['grammar', 'listening', 'reading', 'speaking', 'writing'],
  atc: ['grammar', 'listening', 'reading', 'speaking', 'writing'],
  maintenance: ['grammar', 'reading', 'writing', 'listening', 'speaking'],
  ground_staff: ['grammar', 'reading', 'listening', 'writing', 'speaking'],
}

const sectionColors: Record<string, string> = {
  grammar: '#3B82F6', reading: '#16A34A', writing: '#9333EA',
  speaking: '#DC2626', listening: '#F59E0B',
}

const sectionIcons: Record<string, string> = {
  grammar: '📖', reading: '🧩', writing: '✏️',
  speaking: '🗣️', listening: '🔊',
}

const sectionLabels: Record<string, string> = {
  grammar: 'Grammar', reading: 'Reading', writing: 'Writing',
  speaking: 'Speaking', listening: 'Listening',
}

/* ── PHASE TYPES ── */
type Phase = 'loading' | 'prep' | 'exam'
type LoadingStep = 'preparing' | 'security' | 'timer'

export default function ExamSectionPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const section = params.section as string

  /* ── STATE ── */
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('loading')
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('preparing')
  const [prepCountdown, setPrepCountdown] = useState(60)
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [showStrikeModal, setShowStrikeModal] = useState(false)
  const [showTransitionModal, setShowTransitionModal] = useState(false)
  const [showFullscreenModal, setShowFullscreenModal] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [answerSaving, setAnswerSaving] = useState(false)
  const [pipStream, setPipStream] = useState<MediaStream | null>(null)

  // Speaking
  const [speakingPhase, setSpeakingPhase] = useState<'prep' | 'recording' | 'done'>('prep')
  const [speakingPrepTime, setSpeakingPrepTime] = useState(90)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Listening
  const [listeningPhase, setListeningPhase] = useState<'prep' | 'playing' | 'answering'>('prep')
  const [listeningPrepTime, setListeningPrepTime] = useState(60)
  const [audioPlayed, setAudioPlayed] = useState(false)

  // Writing lock
  const [writingLocked, setWritingLocked] = useState(false)

  // Completed sections tracking
  const [completedSections, setCompletedSections] = useState<string[]>([])

  /* ── REFS ── */
  const timerRef = useRef<any>(null)
  const questionTimerRef = useRef<any>(null)
  const recordingTimerRef = useRef<any>(null)
  const prepTimerRef = useRef<any>(null)
  const speakingPrepRef = useRef<any>(null)
  const listeningPrepRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const strikesRef = useRef(0)
  const chunksRef = useRef<Blob[]>([])
  const timeLeftRef = useRef(0)

  /* ── SYNC REFS ── */
  useEffect(() => { strikesRef.current = strikes }, [strikes])
  useEffect(() => { timeLeftRef.current = timeLeft }, [timeLeft])

  /* ── LOAD EXAM ── */
  useEffect(() => { loadExamAndQuestions() }, [])

  async function loadExamAndQuestions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: examData } = await supabase
      .from('exams').select('*,exam_templates(*)')
      .eq('id', examId).eq('candidate_id', user.id).single()

    if (!examData || examData.status === 'invalidated') { router.push('/exam'); return }
    if (examData.status === 'completed') { router.push(`/exam/${examId}/complete`); return }
    setExam(examData)

    const template = examData.exam_templates
    const count = template[`${section}_count`] || 10

    // Load or create question set
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
      const inserts = shuffled.map((q, i) => ({
        exam_id: examId, question_id: q.id, section, question_order: i
      }))
      await supabase.from('exam_question_sets').insert(inserts)
      questionSet = inserts.map((ins, i) => ({ ...ins, questions: shuffled[i] }))
    }

    setQuestions(questionSet.map((qs: any) => qs.questions).filter(Boolean))

    // Calculate time left
    const totalMins = template.time_limit_mins || 90
    const startedAt = examData.started_at ? new Date(examData.started_at).getTime() : Date.now()
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    const remaining = Math.max(0, totalMins * 60 - elapsed)
    setTimeLeft(remaining)

    // Determine completed sections
    const role = template.role_profile || 'general'
    const allSections = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general)
      .filter((s: string) => (template[`${s}_count`] || 0) > 0)
    const currentIdx = allSections.indexOf(section)
    setCompletedSections(allSections.slice(0, currentIdx))

    setLoading(false)
    setPhase('loading')

    // Run loading animation
    runLoadingSequence()
  }

  /* ── LOADING SEQUENCE ── */
  async function runLoadingSequence() {
    setLoadingStep('preparing')
    await delay(2000)
    setLoadingStep('security')
    await delay(2000)
    setLoadingStep('timer')
    await delay(2000)
    setPhase('prep')
  }

  /* ── PREP COUNTDOWN ── */
  useEffect(() => {
    if (phase !== 'prep' || loading) return
    const template = exam?.exam_templates
    const prepConfig = template?.[`prep_${section}`]
    const prepTime = prepConfig?.seconds || 60
    setPrepCountdown(prepTime)

    prepTimerRef.current = setInterval(() => {
      setPrepCountdown(c => {
        if (c <= 1) {
          clearInterval(prepTimerRef.current)
          setPhase('exam')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(prepTimerRef.current)
  }, [phase, loading])

  /* ── GLOBAL TIMER ── */
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleTimeUp()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  /* ── WRITING QUESTION TIMER ── */
  useEffect(() => {
    if (phase !== 'exam' || section !== 'writing' || !exam || loading) return
    const mins = exam.exam_templates?.writing_timer_mins || 3.5
    setWritingLocked(false)
    startQuestionTimer(Math.round(mins * 60))
    return () => clearInterval(questionTimerRef.current)
  }, [currentIndex, phase])

  /* ── SPEAKING PREP TIMER ── */
  useEffect(() => {
    if (phase !== 'exam' || section !== 'speaking') return
    setSpeakingPhase('prep')
    setSpeakingPrepTime(90)
    setRecordingTime(0)
    setAudioBlob(null)
    setAudioUrl(null)

    speakingPrepRef.current = setInterval(() => {
      setSpeakingPrepTime(t => {
        if (t <= 1) {
          clearInterval(speakingPrepRef.current)
          startSpeakingRecording()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      clearInterval(speakingPrepRef.current)
      clearInterval(recordingTimerRef.current)
    }
  }, [currentIndex, phase])

  /* ── LISTENING PREP TIMER ── */
  useEffect(() => {
    if (phase !== 'exam' || section !== 'listening') return
    setListeningPhase('prep')
    setListeningPrepTime(60)
    setAudioPlayed(false)

    listeningPrepRef.current = setInterval(() => {
      setListeningPrepTime(t => {
        if (t <= 1) {
          clearInterval(listeningPrepRef.current)
          playListeningAudio()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(listeningPrepRef.current)
  }, [currentIndex, phase])

  /* ── CAMERA ── */
  useEffect(() => {
    if (phase === 'exam') startCamera()
    return () => { pipStream?.getTracks().forEach(t => t.stop()) }
  }, [phase])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setPipStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch { }
  }

  /* ── ANTI-CHEAT ── */
  useEffect(() => {
    if (phase !== 'exam') return
    const onVisibility = () => { if (document.hidden) triggerStrike('tab_switch') }
    const onBlur = () => { /* only use visibility API */ }
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)) e.preventDefault()
    }
    const onContext = (e: MouseEvent) => e.preventDefault()
    const onFullscreen = () => {
      if (!document.fullscreenElement) setShowFullscreenModal(true)
      else setShowFullscreenModal(false)
    }

    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('keydown', onKey)
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [phase])

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

  /* ── SPEAKING RECORDING ── */
  async function startSpeakingRecording() {
    setSpeakingPhase('recording')
    setRecordingTime(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setSpeakingPhase('done')
      }
      recorder.start(1000)
      setMediaRecorder(recorder)

      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 89) {
            clearInterval(recordingTimerRef.current)
            recorder.stop()
            return 90
          }
          return t + 1
        })
      }, 1000)
    } catch {
      setSpeakingPhase('done')
    }
  }

  function stopSpeakingRecording() {
    clearInterval(recordingTimerRef.current)
    mediaRecorder?.stop()
  }

  /* ── LISTENING AUDIO ── */
  function playListeningAudio() {
    setListeningPhase('playing')
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  function onListeningEnded() {
    setAudioPlayed(true)
    setListeningPhase('answering')
  }

  /* ── HELPERS ── */
  function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function startQuestionTimer(seconds: number) {
    clearInterval(questionTimerRef.current)
    setQuestionTimeLeft(seconds)
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(t => {
        if (t <= 1) {
          clearInterval(questionTimerRef.current)
          lockAndAdvanceWriting()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  function lockAndAdvanceWriting() {
    setWritingLocked(true)
    const currentQ = questions[currentIndex]
    if (currentQ) saveAnswer(currentQ.id, answers[currentQ.id] || '')
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1)
        setWordCount(0)
        setWritingLocked(false)
      } else {
        handleSectionComplete()
      }
    }, 2000)
  }

  function handleAnswer(questionId: string, answer: string) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    if (section === 'writing') {
      setWordCount(answer.trim().split(/\s+/).filter(Boolean).length)
    }
    // Auto-save for MCQ
    if (['grammar', 'reading', 'listening'].includes(section)) {
      setAnswerSaving(true)
      saveAnswer(questionId, answer).then(() => setAnswerSaving(false))
    }
  }

  async function saveAnswer(questionId: string, answer: string) {
    await supabase.from('exam_answers').upsert({
      exam_id: examId, question_id: questionId, section, answer, time_spent_ms: 0
    }, { onConflict: 'exam_id,question_id' })
  }

  async function handleTimeUp() {
    // Save all answers
    for (const q of questions) await saveAnswer(q.id, answers[q.id] || '')
    pipStream?.getTracks().forEach(t => t.stop())
    await supabase.from('exams').update({
      status: 'completed', completed_at: new Date().toISOString()
    }).eq('id', examId)
    router.push(`/exam/${examId}/complete?timeup=1`)
  }

  function handleNextQuestion() {
    const currentQ = questions[currentIndex]
    if (currentQ && section === 'writing') saveAnswer(currentQ.id, answers[currentQ.id] || '')

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      setWordCount(0)
      setAnswerSaving(false)
    } else {
      // Last question — show transition or complete
      const template = exam?.exam_templates
      const role = template?.role_profile || 'general'
      const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general)
        .filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
      const nextSection = sectionOrder[sectionOrder.indexOf(section) + 1]

      if (['writing', 'speaking', 'listening'].includes(section)) {
        // Auto advance for timed sections
        handleSectionComplete()
      } else {
        setShowTransitionModal(true)
      }
    }
  }

  function handlePreviousQuestion() {
    if (['writing', 'speaking', 'listening'].includes(section)) return
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  async function handleSectionComplete() {
    setSaving(true)
    for (const q of questions) await saveAnswer(q.id, answers[q.id] || '')
    clearInterval(timerRef.current)
    clearInterval(questionTimerRef.current)
    clearInterval(recordingTimerRef.current)
    clearInterval(speakingPrepRef.current)
    clearInterval(listeningPrepRef.current)

    // Auto-score MCQ sections
    if (['grammar', 'reading', 'listening'].includes(section)) {
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
      router.push(`/exam/${examId}/section/${nextSection}`)
    } else {
      pipStream?.getTracks().forEach(t => t.stop())
      await supabase.from('exams').update({
        status: 'completed', completed_at: new Date().toISOString()
      }).eq('id', examId)
      router.push(`/exam/${examId}/complete`)
    }
  }

  /* ── COMPUTED ── */
  const currentQ = questions[currentIndex]
  const template = exam?.exam_templates
  const role = template?.role_profile || 'general'
  const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general)
    .filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
  const sectionIndex = sectionOrder.indexOf(section)
  const nextSectionName = sectionOrder[sectionIndex + 1]
  const isTimeCritical = timeLeft < 300
  const totalQ = sectionOrder.reduce((sum: number, s: string) => sum + (template?.[`${s}_count`] || 0), 0)
  const overallProgress = sectionOrder.slice(0, sectionIndex).reduce((sum: number, s: string) => sum + (template?.[`${s}_count`] || 0), 0) + currentIndex + 1
  const unansweredCount = questions.filter(q => !answers[q.id]).length
  const minWords = 40

  // Parse MCQ options from content
  function parseOptions(content: string) {
    const lines = content.split('\n')
    const questionText = lines.filter(l => !l.trim().match(/^[A-D][.)]\s/)).join('\n').trim()
    const opts: { letter: string; text: string }[] = []
    for (const l of lines) {
      const match = l.trim().match(/^([A-D])[.)]\s*(.+)/)
      if (match) opts.push({ letter: match[1], text: match[2] })
    }
    return { questionText, opts }
  }

  // Parse reading passage + question from content
  function parseReadingContent(content: string) {
    const parts = content.split(/\n{2,}/)
    if (parts.length >= 2) {
      const passage = parts[0].trim()
      const rest = parts.slice(1).join('\n\n').trim()
      const { questionText, opts } = parseOptions(rest)
      return { passage, questionText: questionText || rest, opts }
    }
    const { questionText, opts } = parseOptions(content)
    return { passage: '', questionText, opts }
  }

  /* ── LOADING SCREEN ── */
  if (loading || phase === 'loading') {
    const stepConfig: Record<LoadingStep, { icon: string; title: string; subtitle: string }> = {
      preparing: { icon: '⏳', title: 'Preparing Your Exam...', subtitle: 'Creating your exam session' },
      security: { icon: '🛡️', title: 'Security Checks...', subtitle: 'Activating proctoring system' },
      timer: { icon: '⏱️', title: 'Setting Up Timer...', subtitle: 'Configuring exam duration' },
    }
    const steps: LoadingStep[] = ['preparing', 'security', 'timer']
    const currentStepIdx = steps.indexOf(loadingStep)
    const config = stepConfig[loadingStep]

    return (
      <div style={{
        minHeight: '100vh', background: '#3B82F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', margin: '0 auto 28px',
            animation: 'spin 2s linear infinite',
          }}>{config.icon}</div>
          <h2 style={{
            fontSize: '24px', fontWeight: 700, marginBottom: '8px',
            fontFamily: "'Montserrat', sans-serif",
          }}>{config.title}</h2>
          <p style={{ fontSize: '15px', opacity: 0.8, marginBottom: '32px' }}>{config.subtitle}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: i === currentStepIdx ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <p style={{ fontSize: '13px', opacity: 0.6 }}>Please wait, do not close or refresh this page</p>
        </div>
        <style>{`@keyframes spin{0%{border-color:rgba(255,255,255,0.3) rgba(255,255,255,0.1) rgba(255,255,255,0.1) rgba(255,255,255,0.1)}25%{border-color:rgba(255,255,255,0.1) rgba(255,255,255,0.3) rgba(255,255,255,0.1) rgba(255,255,255,0.1)}50%{border-color:rgba(255,255,255,0.1) rgba(255,255,255,0.1) rgba(255,255,255,0.3) rgba(255,255,255,0.1)}75%{border-color:rgba(255,255,255,0.1) rgba(255,255,255,0.1) rgba(255,255,255,0.1) rgba(255,255,255,0.3)}}`}</style>
      </div>
    )
  }

  /* ── PREP SCREEN ── */
  if (phase === 'prep') {
    const prepConfig = template?.[`prep_${section}`]
    const bullets = prepConfig?.bullets || []
    const progress = prepConfig?.seconds ? ((prepConfig.seconds - prepCountdown) / prepConfig.seconds) * 100 : 0

    return (
      <div style={{
        minHeight: '100vh', background: '#F0F2F5',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Mini header */}
        <div style={{
          padding: '10px 24px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>Section Transition</span>
          <span style={{
            fontSize: '12px', padding: '3px 12px', borderRadius: '100px',
            border: '1px solid #E5E7EB', color: '#6B7280',
          }}>Preparation Time</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 50px)', padding: '24px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '40px 48px',
            maxWidth: '700px', width: '100%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: sectionColors[section],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', margin: '0 auto',
              }}>{sectionIcons[section]}</div>
            </div>
            <h2 style={{
              textAlign: 'center', fontSize: '22px', fontWeight: 700,
              color: sectionColors[section], marginBottom: '28px',
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {sectionLabels[section]} section is starting
            </h2>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {bullets.map((b: string, i: number) => (
                <div key={i} style={{
                  fontSize: '14px', color: '#374151', lineHeight: 1.6,
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}>
                  <span style={{ color: '#9CA3AF', flexShrink: 0 }}>•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '48px', fontWeight: 800, color: sectionColors[section],
                fontFamily: "'Montserrat', sans-serif", marginBottom: '4px',
              }}>{formatTime(prepCountdown)}</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>Time Left</div>
              {/* Progress bar */}
              <div style={{
                height: '6px', background: '#E5E7EB', borderRadius: '3px',
                overflow: 'hidden', margin: '0 20px',
              }}>
                <div style={{
                  height: '100%', background: sectionColors[section],
                  width: `${progress}%`, transition: 'width 1s linear',
                  borderRadius: '3px',
                }} />
              </div>
            </div>

            {/* Skip button */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button onClick={() => {
                clearInterval(prepTimerRef.current)
                setPhase('exam')
              }} style={{
                padding: '10px 28px', borderRadius: '10px',
                border: `2px solid ${sectionColors[section]}`,
                background: 'transparent', color: sectionColors[section],
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}>
                Start Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── NO QUESTIONS ── */
  if (!currentQ) return (
    <div style={{
      minHeight: '100vh', background: '#F0F2F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#6B7280', marginBottom: '16px' }}>No questions available for this section.</p>
        <button onClick={handleSectionComplete} style={{
          padding: '10px 24px', borderRadius: '8px', border: 'none',
          background: '#2563EB', color: '#fff', cursor: 'pointer',
        }}>Continue →</button>
      </div>
    </div>
  )

  /* ── MAIN EXAM SCREEN ── */
  return (
    <div style={{
      minHeight: '100vh', background: '#F0F2F5',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column',
      userSelect: 'none', position: 'relative',
    }}>

      {/* ── MODALS ── */}

      {/* Strike Modal */}
      {showStrikeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '480px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
              padding: '8px 14px', background: '#FEF3C7', borderRadius: '8px',
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#D97706' }}>Tab Switch Detected</span>
            </div>
            <div style={{
              background: '#FFFBEB', borderRadius: '10px', padding: '14px',
              marginBottom: '16px', border: '1px solid #FDE68A',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>⚠️</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>You switched to another tab or window!</span>
              </div>
              <span style={{ fontSize: '13px', color: '#92400E' }}>This behavior is not allowed during the exam and has been recorded.</span>
            </div>
            <div style={{
              textAlign: 'center', padding: '16px',
              background: '#F9FAFB', borderRadius: '10px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#D97706' }}>{strikes} / 3</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Tab Switches</div>
            </div>
            <div style={{
              background: '#FEF2F2', borderRadius: '8px', padding: '12px',
              marginBottom: '16px', border: '1px solid #FECACA',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginBottom: '2px' }}>
                🚫 Important Warning:
              </div>
              <div style={{ fontSize: '13px', color: '#991B1B' }}>
                If you switch tabs 3 times, your exam will be automatically invalidated and you will not receive a score.
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
              Please remain on this tab for the duration of the exam. All tab switches are logged and monitored.
            </div>
            <button onClick={() => setShowStrikeModal(false)} style={{
              width: '100%', padding: '14px', borderRadius: '10px',
              border: 'none', background: '#2563EB', color: '#fff',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            }}>I Understand - Continue Exam</button>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreenModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#FFFBEB', borderRadius: '16px', padding: '36px',
            maxWidth: '440px', width: '90%', textAlign: 'center',
            border: '3px solid #F59E0B',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⛶</div>
            <h3 style={{
              fontSize: '20px', fontWeight: 700, color: '#D97706',
              marginBottom: '12px', fontFamily: "'Montserrat', sans-serif",
            }}>🔒 Fullscreen Mode Required</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              For security reasons, the exam must be taken in fullscreen mode. This prevents you from opening other tabs or windows.
            </p>
            <div style={{
              background: '#FEF3C7', borderRadius: '8px', padding: '12px',
              marginBottom: '20px',
            }}>
              <span style={{ fontSize: '13px', color: '#92400E' }}>
                ⚠️ Your exam is paused until you return to fullscreen mode.
              </span>
            </div>
            <button onClick={async () => {
              try {
                await document.documentElement.requestFullscreen()
                setShowFullscreenModal(false)
              } catch { }
            }} style={{
              padding: '14px 32px', borderRadius: '12px',
              border: 'none', background: '#D97706', color: '#fff',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>⛶ Enter Fullscreen Mode</button>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
              Tip: You can also press F11 to enter fullscreen mode
            </p>
          </div>
        </div>
      )}

      {/* Section Transition Modal */}
      {showTransitionModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '440px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#FEF3C7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px',
            }}>⚠️</div>
            <h3 style={{
              fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '8px',
              fontFamily: "'Montserrat', sans-serif",
            }}>Section Transition</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
              Next is the {sectionLabels[nextSectionName] || 'next'} section.
            </p>
            <div style={{
              background: '#FFFBEB', borderRadius: '8px', padding: '12px',
              marginBottom: '12px', border: '1px solid #FDE68A',
            }}>
              <span style={{ fontSize: '13px', color: '#92400E' }}>
                ⚠️ If you proceed to this section, you cannot go back to the previous section and you cannot answer questions you left blank.
              </span>
            </div>
            {unansweredCount > 0 && (
              <div style={{
                fontSize: '14px', color: '#DC2626', marginBottom: '16px', fontWeight: 600,
              }}>
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} left blank in the {sectionLabels[section]} section.
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowTransitionModal(false)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: '2px solid #2563EB', background: '#fff',
                color: '#2563EB', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={() => { setShowTransitionModal(false); handleSectionComplete() }} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: 'none', background: '#16A34A', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>
                {saving ? 'Saving...' : 'Understood, Go to Next Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px',
            background: sectionColors[section] + '20', color: sectionColors[section],
          }}>{sectionIcons[section]} {sectionLabels[section]}</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>
            {sectionLabels[section]} - Question {currentIndex + 1} / {questions.length}
          </span>
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Overall Progress: {overallProgress} / {totalQ}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {section === 'writing' && (
            <span style={{
              fontSize: '14px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
              background: questionTimeLeft < 30 ? '#FEF2F2' : '#F0F9FF',
              color: questionTimeLeft < 30 ? '#DC2626' : '#2563EB',
              border: `1px solid ${questionTimeLeft < 30 ? '#FECACA' : '#BFDBFE'}`,
            }}>⏱ {formatTime(questionTimeLeft)}</span>
          )}
          <span style={{
            fontSize: '15px', fontWeight: 700, padding: '5px 14px', borderRadius: '8px',
            color: isTimeCritical ? '#DC2626' : '#D97706',
            background: isTimeCritical ? '#FEF2F2' : '#FFFBEB',
            border: `1px solid ${isTimeCritical ? '#FECACA' : '#FDE68A'}`,
            fontFamily: "'Montserrat', sans-serif",
          }}>🕐 {formatTime(timeLeft)}</span>
          {answerSaving && (
            <span style={{
              fontSize: '12px', padding: '3px 10px', borderRadius: '6px',
              background: '#EFF6FF', color: '#2563EB', fontWeight: 600,
            }}>Saving...</span>
          )}
          <span style={{
            fontSize: '12px', padding: '4px 12px', borderRadius: '100px',
            border: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 600,
          }}>In Progress</span>
          {strikes > 0 && (
            <span style={{
              fontSize: '12px', fontWeight: 700, color: '#DC2626',
              background: '#FEF2F2', padding: '4px 10px', borderRadius: '6px',
            }}>⚠️ {strikes}/3</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: '#E5E7EB' }}>
        <div style={{
          height: '100%', background: sectionColors[section],
          width: `${((currentIndex + 1) / questions.length) * 100}%`,
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Completed sections indicator */}
      {completedSections.length > 0 && (
        <div style={{
          padding: '6px 24px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6',
          fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>Completed:</span>
          {completedSections.map(s => (
            <span key={s} style={{
              padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
              background: sectionColors[s] + '15', color: sectionColors[s],
            }}>{sectionLabels[s]}</span>
          ))}
          <span>→ Now: <strong style={{ color: sectionColors[section] }}>{sectionLabels[section]}</strong></span>
        </div>
      )}

      {/* ── CAMERA PiP ── */}
      {pipStream && (
        <div style={{
          position: 'fixed', top: '80px', left: '16px', zIndex: 900,
          width: '120px', height: '90px', borderRadius: '12px',
          overflow: 'hidden', border: '2px solid rgba(0,0,0,0.15)',
          background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          <video ref={videoRef} autoPlay muted playsInline style={{
            width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
          }} />
          <div style={{
            position: 'absolute', top: '6px', left: '8px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#4ADE80', display: 'inline-block',
            }} />
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>LIVE</span>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>

          {/* ── GRAMMAR / READING / LISTENING MCQ ── */}
          {['grammar', 'reading', 'listening'].includes(section) && (() => {
            const parsed = section === 'reading'
              ? parseReadingContent(currentQ.content)
              : { passage: '', ...parseOptions(currentQ.content) }

            return (
              <div style={{
                background: '#fff', borderRadius: '16px', padding: '28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                {/* Question header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{sectionIcons[section]}</span>
                    <span style={{
                      fontSize: '16px', fontWeight: 600, color: sectionColors[section],
                    }}>{sectionLabels[section]} - Question {currentIndex + 1}</span>
                  </div>
                  {answers[currentQ.id] && (
                    <button onClick={() => {
                      setAnswers(prev => { const n = { ...prev }; delete n[currentQ.id]; return n })
                    }} style={{
                      padding: '6px 14px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', background: '#F9FAFB',
                      color: '#6B7280', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>🗑️ Clear Answer</button>
                  )}
                </div>

                {/* Reading passage */}
                {section === 'reading' && parsed.passage && (
                  <div style={{
                    background: '#F9FAFB', borderRadius: '10px', padding: '16px 20px',
                    marginBottom: '16px', border: '1px solid #F3F4F6',
                    fontSize: '14px', color: '#374151', lineHeight: 1.7,
                  }}>{parsed.passage}</div>
                )}

                {/* Listening audio */}
                {section === 'listening' && currentQ.audio_url && (
                  <div style={{ marginBottom: '16px' }}>
                    {listeningPhase === 'prep' && (
                      <div style={{
                        background: '#FFFBEB', borderRadius: '10px', padding: '16px',
                        border: '1px solid #FDE68A', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#D97706', marginBottom: '4px' }}>
                          Read the question first. Audio will play in {listeningPrepTime}s
                        </div>
                        <button onClick={() => {
                          clearInterval(listeningPrepRef.current)
                          playListeningAudio()
                        }} style={{
                          padding: '8px 20px', borderRadius: '8px', marginTop: '8px',
                          border: '1.5px solid #F59E0B', background: '#fff',
                          color: '#D97706', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        }}>▶ Start Listening Now</button>
                      </div>
                    )}
                    {listeningPhase === 'playing' && (
                      <audio ref={audioRef} src={currentQ.audio_url} onEnded={onListeningEnded}
                        controls style={{ width: '100%' }} />
                    )}
                    {listeningPhase === 'answering' && (
                      <div style={{
                        background: '#F0F9FF', borderRadius: '8px', padding: '12px',
                        border: '1px solid #BAE6FD', fontSize: '13px', color: '#0369A1',
                      }}>🔒 Audio has been played. Replay is not permitted.</div>
                    )}
                  </div>
                )}

                {/* Question text */}
                <div style={{
                  background: '#F9FAFB', borderRadius: '10px', padding: '16px 20px',
                  marginBottom: '16px', border: '1px solid #F3F4F6',
                  fontSize: '15px', color: '#111', lineHeight: 1.7,
                }}>{parsed.questionText}</div>

                {/* Options 2x2 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {(parsed.opts.length > 0 ? parsed.opts : [
                    { letter: 'A', text: 'Option A' }, { letter: 'B', text: 'Option B' },
                    { letter: 'C', text: 'Option C' }, { letter: 'D', text: 'Option D' },
                  ]).map(opt => {
                    const isSelected = answers[currentQ.id] === opt.text
                    return (
                      <button key={opt.letter} onClick={() => handleAnswer(currentQ.id, opt.text)} style={{
                        padding: '16px 18px', borderRadius: '12px',
                        border: `2px solid ${isSelected ? sectionColors[section] : '#E5E7EB'}`,
                        background: isSelected ? sectionColors[section] + '10' : '#fff',
                        color: '#111', fontSize: '14px', cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif", textAlign: 'left',
                        display: 'flex', gap: '12px', alignItems: 'center',
                        transition: 'all 0.15s',
                      }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: `2px solid ${isSelected ? sectionColors[section] : '#D1D5DB'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, flexShrink: 0,
                          background: isSelected ? sectionColors[section] : 'transparent',
                          color: isSelected ? '#fff' : '#9CA3AF',
                        }}>
                          {isSelected ? '●' : ''}
                        </span>
                        <span>{opt.letter}. {opt.text}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Saving indicator */}
                {answerSaving && (
                  <div style={{
                    textAlign: 'center', marginTop: '12px',
                    fontSize: '13px', color: '#6B7280',
                  }}>↻ Your answer is being saved...</div>
                )}
              </div>
            )
          })()}

          {/* ── WRITING ── */}
          {section === 'writing' && (
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>✏️</span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#9333EA' }}>
                    Writing Section - Question {currentIndex + 1}
                  </span>
                </div>
                <span style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 700,
                  background: questionTimeLeft < 30 ? '#FEF2F2' : '#F5F3FF',
                  color: questionTimeLeft < 30 ? '#DC2626' : '#7C3AED',
                  border: `1.5px solid ${questionTimeLeft < 30 ? '#FECACA' : '#DDD6FE'}`,
                }}>⏱ {formatTime(questionTimeLeft)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left: Question + Prompt */}
                <div>
                  <p style={{ fontSize: '14px', color: '#374151', marginBottom: '14px' }}>
                    Write a composition of at least {minWords} words on the following topic:
                  </p>
                  {/* Question box */}
                  <div style={{
                    background: '#2563EB', borderRadius: '12px', padding: '16px',
                    marginBottom: '12px',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 10px',
                      borderRadius: '4px', background: 'rgba(255,255,255,0.2)',
                      color: '#fff', display: 'inline-block', marginBottom: '8px',
                    }}>Question</span>
                    <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.6, fontStyle: 'italic' }}>
                      {currentQ.content.split('\n')[0]}
                    </p>
                  </div>
                  {/* Prompt box */}
                  <div style={{
                    background: '#2563EB', borderRadius: '12px', padding: '16px',
                    marginBottom: '12px',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 10px',
                      borderRadius: '4px', background: 'rgba(255,255,255,0.2)',
                      color: '#fff', display: 'inline-block', marginBottom: '8px',
                    }}>Prompt</span>
                    <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.6 }}>
                      {currentQ.content.split('\n').slice(1).join('\n') || 'Write your response based on the scenario above.'}
                    </p>
                  </div>
                  {/* Info */}
                  <div style={{
                    background: '#F0F9FF', borderRadius: '8px', padding: '12px',
                    border: '1px solid #BAE6FD', fontSize: '13px', color: '#0369A1',
                  }}>
                    ⏱ You have a total of {Math.round((exam?.exam_templates?.writing_timer_mins || 3.5) * 60)} seconds for this question. When time expires, it will be automatically saved and proceed to the next question.
                  </div>
                </div>

                {/* Right: Textarea */}
                <div>
                  {!writingLocked ? (
                    <textarea
                      value={answers[currentQ.id] || ''}
                      onChange={e => handleAnswer(currentQ.id, e.target.value)}
                      placeholder="Write your composition here..."
                      rows={14}
                      style={{
                        width: '100%', padding: '16px', borderRadius: '12px',
                        border: `2px solid ${wordCount >= minWords ? '#86EFAC' : '#E5E7EB'}`,
                        background: '#fff', color: '#111', fontSize: '14px',
                        fontFamily: "'Inter', sans-serif", resize: 'none',
                        lineHeight: 1.7, outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onCopy={e => e.preventDefault()}
                      onPaste={e => e.preventDefault()}
                      onCut={e => e.preventDefault()}
                    />
                  ) : (
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      border: '2px solid #86EFAC', background: '#F0FDF4',
                      minHeight: '300px', fontSize: '14px', color: '#6B7280',
                      lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    }}>
                      {answers[currentQ.id] || ''}
                    </div>
                  )}
                  {writingLocked && (
                    <div style={{
                      background: '#F0FDF4', borderRadius: '8px', padding: '10px 14px',
                      marginTop: '8px', border: '1px solid #BBF7D0',
                      fontSize: '13px', color: '#16A34A', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>✅ This question has been saved and can no longer be edited</div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: '8px',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: '#6B7280' }}>
                      Word count: <span style={{
                        fontWeight: 700,
                        color: wordCount >= minWords ? '#16A34A' : '#DC2626',
                      }}>{wordCount}</span> / {minWords}
                    </span>
                    {saving && <span style={{ color: '#6B7280' }}>↻ Saving...</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SPEAKING ── */}
          {section === 'speaking' && (
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>🗣️</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#DC2626' }}>
                  Speaking Section - Question {currentIndex + 1}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left: Question + Prompt */}
                <div>
                  <div style={{
                    background: '#DC2626', borderRadius: '12px', padding: '16px', marginBottom: '12px',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'inline-block', marginBottom: '8px',
                    }}>Question</span>
                    <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.6, fontStyle: 'italic' }}>
                      {currentQ.content.split('\n')[0]}
                    </p>
                  </div>
                  <div style={{
                    background: '#2563EB', borderRadius: '12px', padding: '16px', marginBottom: '12px',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'inline-block', marginBottom: '8px',
                    }}>Prompt</span>
                    <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.6 }}>
                      {currentQ.content.split('\n').slice(1).join('\n') || 'Speak about the scenario above.'}
                    </p>
                  </div>
                  <div style={{
                    background: '#F0F9FF', borderRadius: '8px', padding: '12px', marginBottom: '8px',
                    border: '1px solid #BAE6FD', fontSize: '13px', color: '#0369A1',
                  }}>🎙️ Record your answer using the recording component. Press the "Start" button.</div>
                  <div style={{
                    background: '#FFFBEB', borderRadius: '8px', padding: '12px',
                    border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E',
                  }}>⚠️ You have 1 recording attempt. Minimum 30 seconds required for assessment.</div>
                </div>

                {/* Right: Recording */}
                <div style={{
                  background: '#F9FAFB', borderRadius: '12px', padding: '24px',
                  border: '1px solid #E5E7EB',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '20px',
                  }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111', margin: 0 }}>Voice Recording</h4>
                    <span style={{
                      fontSize: '12px', padding: '3px 10px', borderRadius: '100px',
                      background: speakingPhase === 'done' ? '#FEF3C7' : '#F3F4F6',
                      color: speakingPhase === 'done' ? '#D97706' : '#6B7280',
                      fontWeight: 600,
                    }}>{speakingPhase === 'done' ? '⚠️ Recorded' : 'No recording'}</span>
                  </div>

                  {speakingPhase === 'prep' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px', color: '#6B7280', marginBottom: '12px',
                      }}>Preparation time: <strong>{speakingPrepTime}s</strong></div>
                      <button onClick={() => {
                        clearInterval(speakingPrepRef.current)
                        startSpeakingRecording()
                      }} style={{
                        padding: '14px 32px', borderRadius: '10px',
                        border: 'none', background: '#DC2626', color: '#fff',
                        fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                      }}>🎙️ Start Recording</button>
                    </div>
                  )}

                  {speakingPhase === 'recording' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        marginBottom: '12px',
                      }}>
                        <span style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: '#DC2626', animation: 'pulse 1s infinite',
                        }} />
                        <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>Stop Recording</span>
                      </div>
                      <div style={{
                        fontSize: '14px', color: '#6B7280', marginBottom: '8px',
                      }}>Recording in progress... <strong>{formatTime(recordingTime)}</strong> / 1:30</div>
                      <div style={{
                        height: '4px', background: '#FEE2E2', borderRadius: '2px',
                        overflow: 'hidden', marginBottom: '16px',
                      }}>
                        <div style={{
                          height: '100%', background: recordingTime >= 30 ? '#16A34A' : '#DC2626',
                          width: `${(recordingTime / 90) * 100}%`, transition: 'width 1s',
                        }} />
                      </div>
                      {recordingTime >= 30 && (
                        <button onClick={stopSpeakingRecording} style={{
                          padding: '10px 24px', borderRadius: '8px',
                          border: 'none', background: '#DC2626', color: '#fff',
                          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        }}>■ Stop Recording</button>
                      )}
                      {recordingTime < 30 && (
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          Minimum 30 seconds — {30 - recordingTime}s remaining
                        </div>
                      )}
                    </div>
                  )}

                  {speakingPhase === 'done' && audioUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <audio src={audioUrl} controls style={{ width: '100%' }} />
                      </div>
                      <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600, marginBottom: '8px' }}>
                        ✓ Recording saved ({recordingTime}s)
                      </div>
                      <div style={{
                        background: '#F0F9FF', borderRadius: '8px', padding: '10px',
                        fontSize: '12px', color: '#0369A1',
                      }}>ℹ️ Your recording has been made but not sent yet. When you go to the next question, it will be sent automatically.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{
        background: '#fff', borderTop: '1px solid #E5E7EB',
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          {['grammar', 'reading'].includes(section) && currentIndex > 0 && (
            <button onClick={handlePreviousQuestion} style={{
              padding: '10px 20px', borderRadius: '10px',
              border: '1.5px solid #E5E7EB', background: '#fff',
              color: '#374151', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>← Previous</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            {sectionLabels[section]} {currentIndex + 1} / {questions.length}
          </span>
          <button onClick={() => {}} style={{
            padding: '10px 20px', borderRadius: '10px',
            border: '1.5px solid #FECACA', background: '#FEF2F2',
            color: '#DC2626', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>🚩 Finish Exam</button>
        </div>
        <div>
          <button
            onClick={handleNextQuestion}
            disabled={
              (section === 'speaking' && speakingPhase === 'recording') ||
              (section === 'writing' && writingLocked)
            }
            style={{
              padding: '10px 24px', borderRadius: '10px',
              border: 'none',
              background: currentIndex === questions.length - 1 && nextSectionName
                ? sectionColors[nextSectionName] || '#16A34A'
                : '#2563EB',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              opacity: (section === 'speaking' && speakingPhase === 'recording') ? 0.5 : 1,
            }}
          >
            {currentIndex === questions.length - 1
              ? nextSectionName
                ? `Go to ${sectionLabels[nextSectionName]} →`
                : 'Complete Section →'
              : 'Next →'}
          </button>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
