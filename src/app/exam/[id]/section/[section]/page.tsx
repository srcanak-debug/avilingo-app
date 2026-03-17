'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ═══ BRAND ═══ */
const BRAND = {
  navy: '#0A1628', navy2: '#1E3A5F', navy3: '#152238',
  gold: '#C9A84C', goldLight: '#F5EFD7', goldDark: '#A88B3D',
  white: '#FFFFFF', off: '#F3F4F6', border: '#E5E7EB',
  text1: '#111827', text2: '#374151', text3: '#6B7280', text4: '#9CA3AF',
  success: '#16A34A', danger: '#DC2626', warning: '#D97706',
}

/* ═══ CONSTANTS ═══ */
const ROLE_ORDER: Record<string, string[]> = {
  general: ['grammar','reading','listening','writing','speaking'],
  flight_deck: ['grammar','reading','listening','writing','speaking'],
  cabin_crew: ['grammar','listening','reading','speaking','writing'],
  atc: ['grammar','listening','reading','speaking','writing'],
  maintenance: ['grammar','reading','writing','listening','speaking'],
  ground_staff: ['grammar','reading','listening','writing','speaking'],
}
const SC: Record<string,string> = { grammar:'#3B82F6', reading:'#16A34A', writing:'#7C3AED', speaking:'#DC2626', listening:'#F59E0B' }
const SI: Record<string,string> = { grammar:'📖', reading:'🧩', writing:'✏️', speaking:'🗣️', listening:'🔊' }
const SL: Record<string,string> = { grammar:'Grammar', reading:'Reading', writing:'Writing', speaking:'Speaking', listening:'Listening' }

export default function ExamSectionPage() {
  const router = useRouter()
  const { id: examId, section } = useParams() as { id: string; section: string }

  /* ═══ STATE ═══ */
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [ci, setCi] = useState(0)
  const [answers, setAnswers] = useState<Record<string,string>>({})
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<'writing-prep'|'exam'>('exam')

  // Timers
  const [prepCD, setPrepCD] = useState(60)
  const [timeLeft, setTimeLeft] = useState(5400) // default 90 min, overridden by load()
  const [qTimeLeft, setQTimeLeft] = useState(0)
  const [wPrepCD, setWPrepCD] = useState(90)

  // Anti-cheat
  const [strikes, setStrikes] = useState(0)
  const [showStrike, setShowStrike] = useState(false)
  const [showFS, setShowFS] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [showFinish, setShowFinish] = useState(false)

  // Writing
  const [wordCount, setWordCount] = useState(0)
  const [wLocked, setWLocked] = useState(false)

  // Speaking
  const [spkPhase, setSpkPhase] = useState<'prep'|'rec'|'done'>('prep')
  const [spkPrep, setSpkPrep] = useState(90)
  const [recTime, setRecTime] = useState(0)
  const [recorder, setRecorder] = useState<MediaRecorder|null>(null)
  const [audioUrl, setAudioUrl] = useState<string|null>(null)

  // Listening
  const [lstPhase, setLstPhase] = useState<'prep'|'play'|'answer'>('prep')
  const [lstPrep, setLstPrep] = useState(60)

  // UI
  const [saving, setSaving] = useState(false)
  const [answerSaving, setAnswerSaving] = useState(false)
  const [cam, setCam] = useState<MediaStream|null>(null)
  const [completedSec, setCompletedSec] = useState<string[]>([])

  // Refs
  const gTimer = useRef<any>(null)
  const qTimer = useRef<any>(null)
  const pTimer = useRef<any>(null)
  const spTimer = useRef<any>(null)
  const rTimer = useRef<any>(null)
  const lTimer = useRef<any>(null)
  const wTimer = useRef<any>(null)
  const vidRef = useRef<HTMLVideoElement>(null)
  const audRef = useRef<HTMLAudioElement>(null)
  const stRef = useRef(0)
  const chunks = useRef<Blob[]>([])

  useEffect(() => { stRef.current = strikes }, [strikes])

  /* ═══ LOAD ═══ */
  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data: ed } = await supabase.from('exams').select('*,exam_templates(*)').eq('id', examId).eq('candidate_id', user.id).single()
    if (!ed || ed.status === 'invalidated') return router.push('/exam')
    if (ed.status === 'completed') return router.push(`/exam/${examId}/complete`)
    setExam(ed)

    const t = ed.exam_templates, cnt = t[`${section}_count`] || 10
    const { data: es } = await supabase.from('exam_question_sets').select('*,questions(*)').eq('exam_id', examId).eq('section', section).order('question_order')
    let qs = es || []
    if (!qs.length) {
      const { data: pool } = await supabase.from('questions').select('*').eq('section', section).eq('active', true).eq('is_latest', true).limit(cnt * 5)
      if (!pool?.length) { setReady(true); return }
      const sh = pool.sort(() => Math.random() - 0.5).slice(0, cnt)
      const ins = sh.map((q, i) => ({ exam_id: examId, question_id: q.id, section, question_order: i }))
      await supabase.from('exam_question_sets').insert(ins)
      qs = ins.map((x, i) => ({ ...x, questions: sh[i] }))
    }
    setQuestions(qs.map((x: any) => x.questions).filter(Boolean))

    const totalMins = t.time_limit_mins || 90
    const started = ed.started_at ? new Date(ed.started_at).getTime() : Date.now()
    setTimeLeft(Math.max(0, totalMins * 60 - Math.floor((Date.now() - started) / 1000)))

    const role = t.role_profile || 'general'
    const all = (ROLE_ORDER[role] || ROLE_ORDER.general).filter((s: string) => (t[`${s}_count`] || 0) > 0)
    const idx = all.indexOf(section)
    setCompletedSec(all.slice(0, idx))
    setReady(true)
    setPhase(section === 'writing' ? 'writing-prep' : 'exam')
  }

  /* ═══ PREP — REMOVED (skip directly to exam) ═══ */
  function goExam() { setPhase(section === 'writing' ? 'writing-prep' : 'exam') }

  /* ═══ WRITING PREP ═══ */
  useEffect(() => {
    if (phase !== 'writing-prep') return
    setWPrepCD(90); setWLocked(false)
    wTimer.current = setInterval(() => setWPrepCD(c => { if (c <= 1) { clearInterval(wTimer.current); setPhase('exam'); return 0 } return c - 1 }), 1000)
    return () => clearInterval(wTimer.current)
  }, [phase, ci])

  /* ═══ GLOBAL TIMER ═══ */
  useEffect(() => {
    if (phase !== 'exam' && phase !== 'writing-prep') return
    if (timeLeft <= 0) return
    if (gTimer.current) return
    gTimer.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(gTimer.current); gTimer.current = null; timeUp(); return 0 } return t - 1 }), 1000)
    return () => { clearInterval(gTimer.current); gTimer.current = null }
  }, [phase, timeLeft > 0])

  /* ═══ WRITING Q TIMER ═══ */
  useEffect(() => {
    if (phase !== 'exam' || section !== 'writing' || !exam) return
    const s = Math.round((exam.exam_templates?.writing_timer_mins || 3.5) * 60)
    setQTimeLeft(s); setWLocked(false)
    qTimer.current = setInterval(() => setQTimeLeft(t => { if (t <= 1) { clearInterval(qTimer.current); lockW(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(qTimer.current)
  }, [ci, phase])

  function lockW() {
    setWLocked(true)
    const q = questions[ci]; if (q) saveAns(q.id, answers[q.id] || '')
    setTimeout(() => { if (ci < questions.length - 1) { setCi(i => i + 1); setWordCount(0); setPhase('writing-prep') } else sectionDone() }, 2000)
  }

  /* ═══ SPEAKING ═══ */
  useEffect(() => {
    if (phase !== 'exam' || section !== 'speaking') return
    setSpkPhase('prep'); setSpkPrep(90); setRecTime(0); setAudioUrl(null)
    spTimer.current = setInterval(() => setSpkPrep(t => { if (t <= 1) { clearInterval(spTimer.current); startRec(); return 0 } return t - 1 }), 1000)
    return () => { clearInterval(spTimer.current); clearInterval(rTimer.current) }
  }, [ci, phase])

  async function startRec() {
    setSpkPhase('rec'); setRecTime(0); chunks.current = []
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(s, { mimeType: 'audio/webm' })
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = () => {
        s.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        setSpkPhase('done')
        // Upload to Supabase Storage
        const fileName = `speaking/${examId}/${cq?.id}_${Date.now()}.webm`
        supabase.storage.from('exam-audio').upload(fileName, blob, { contentType: 'audio/webm', upsert: true })
          .then(({ error }) => { if (error) console.warn('Audio upload:', error) })
        // Save audio URL reference in answer
        if (cq) saveAns(cq.id, `[audio:${fileName}]`)
      }
      mr.start(1000); setRecorder(mr)
      const st = Date.now()
      rTimer.current = setInterval(() => { const e = Math.floor((Date.now() - st) / 1000); setRecTime(e); if (e >= 90) { clearInterval(rTimer.current); mr.stop() } }, 250)
    } catch { setSpkPhase('done') }
  }

  function stopRec() { clearInterval(rTimer.current); recorder?.stop() }

  /* ═══ LISTENING ═══ */
  useEffect(() => {
    if (phase !== 'exam' || section !== 'listening') return
    setLstPhase('prep'); setLstPrep(60)
    lTimer.current = setInterval(() => setLstPrep(t => { if (t <= 1) { clearInterval(lTimer.current); playAud(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(lTimer.current)
  }, [ci, phase])

  function playAud() { setLstPhase('play'); audRef.current?.play() }

  /* ═══ CAMERA ═══ */
  useEffect(() => {
    if (phase === 'exam' || phase === 'writing-prep') initCam()
    return () => { cam?.getTracks().forEach(t => t.stop()) }
  }, [phase])

  async function initCam() {
    try {
      cam?.getTracks().forEach(t => t.stop())
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
      setCam(s)
      // Retry attaching stream to video element until it's available
      const attach = () => {
        if (vidRef.current) {
          vidRef.current.srcObject = s
          vidRef.current.play().catch(() => {})
        } else {
          setTimeout(attach, 300)
        }
      }
      setTimeout(attach, 100)
    } catch (e) { console.warn('cam:', e) }
  }

  // Re-attach stream when vidRef becomes available (after render)
  useEffect(() => {
    if (cam && vidRef.current && !vidRef.current.srcObject) {
      vidRef.current.srcObject = cam
      vidRef.current.play().catch(() => {})
    }
  })

  /* ═══ PROCTORING PERIODIC PHOTO ═══ */
  const procTimer = useRef<any>(null)
  const procCanvas = useRef<HTMLCanvasElement|null>(null)

  useEffect(() => {
    if (phase !== 'exam' && phase !== 'writing-prep') return
    if (!cam) return
    const interval = exam?.exam_templates?.proctoring_photo_interval_seconds || 30
    // Create canvas once
    if (!procCanvas.current) {
      procCanvas.current = document.createElement('canvas')
      procCanvas.current.width = 320
      procCanvas.current.height = 240
    }
    procTimer.current = setInterval(() => {
      if (vidRef.current && procCanvas.current) {
        const ctx = procCanvas.current.getContext('2d')
        ctx?.drawImage(vidRef.current, 0, 0, 320, 240)
        procCanvas.current.toBlob(async (blob) => {
          if (!blob) return
          try {
            const fileName = `proctoring/${examId}/${Date.now()}.jpg`
            await supabase.storage.from('exam-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })
          } catch (e) { console.warn('Proctoring photo:', e) }
        }, 'image/jpeg', 0.6)
      }
    }, interval * 1000)
    return () => clearInterval(procTimer.current)
  }, [phase, cam])

  /* ═══ ANTI-CHEAT ═══ */
  useEffect(() => {
    if (phase !== 'exam' && phase !== 'writing-prep') return
    const onVis = () => { if (document.hidden) strike('tab_switch') }
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && ['c','v','x'].includes(e.key)) e.preventDefault() }
    const onCtx = (e: MouseEvent) => e.preventDefault()
    const onFS = () => {
      if (!document.fullscreenElement) {
        setShowFS(true)
      } else {
        setShowFS(false)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    document.addEventListener('keydown', onKey)
    document.addEventListener('contextmenu', onCtx)
    document.addEventListener('fullscreenchange', onFS)
    return () => { document.removeEventListener('visibilitychange', onVis); document.removeEventListener('keydown', onKey); document.removeEventListener('contextmenu', onCtx); document.removeEventListener('fullscreenchange', onFS) }
  }, [phase])

  async function strike(type: string) {
    const n = stRef.current + 1; stRef.current = n; setStrikes(n)
    await supabase.from('violations').insert({ exam_id: examId, type, strike_number: n })
    if (n >= 3) { await supabase.from('exams').update({ status: 'invalidated' }).eq('id', examId); return router.push(`/exam/${examId}/invalidated`) }
    setShowStrike(true)
  }

  /* ═══ HELPERS ═══ */
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
  const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  function handleAns(qid: string, ans: string) {
    setAnswers(p => ({ ...p, [qid]: ans }))
    if (section === 'writing') setWordCount(ans.trim().split(/\s+/).filter(Boolean).length)
    if (['grammar','reading','listening'].includes(section)) { setAnswerSaving(true); saveAns(qid, ans).then(() => setTimeout(() => setAnswerSaving(false), 400)) }
  }

  async function saveAns(qid: string, ans: string) {
    await supabase.from('exam_answers').upsert({ exam_id: examId, question_id: qid, section, answer: ans, time_spent_ms: 0 }, { onConflict: 'exam_id,question_id' })
  }

  async function timeUp() {
    cam?.getTracks().forEach(t => t.stop())
    // Bulk save all at once
    const batch = questions.map(q => ({ exam_id: examId, question_id: q.id, section, answer: answers[q.id] || '', time_spent_ms: 0, auto_score: ['grammar','reading','listening'].includes(section) ? (q.correct_answer?.trim().toLowerCase() === (answers[q.id] || '').trim().toLowerCase() ? 1 : 0) : null }))
    if (batch.length) await supabase.from('exam_answers').upsert(batch, { onConflict: 'exam_id,question_id' })
    await supabase.from('exams').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', examId)
    router.push(`/exam/${examId}/complete?timeup=1`)
  }

  function handleNext() {
    const q = questions[ci]
    if (q && ['grammar','reading'].includes(section)) saveAns(q.id, answers[q.id] || '')
    if (ci < questions.length - 1) {
      if (section === 'writing' && !wLocked) { saveAns(q.id, answers[q.id] || ''); setCi(i => i+1); setWordCount(0); setPhase('writing-prep') }
      else if (section === 'speaking') { setCi(i => i+1) }
      else if (section === 'listening') { setCi(i => i+1) }
      else { setCi(i => i+1) }
    } else {
      if (['writing','speaking','listening'].includes(section)) sectionDone()
      else setShowTransition(true)
    }
  }

  function handlePrev() { if (!['writing','speaking','listening'].includes(section) && ci > 0) setCi(i => i-1) }

  async function sectionDone() {
    setSaving(true)
    // Bulk save + auto-score in one batch
    const batch = questions.map(q => {
      const a = answers[q.id] || ''
      const score = ['grammar','reading','listening'].includes(section) ? (q.correct_answer?.trim().toLowerCase() === a.trim().toLowerCase() ? 1 : 0) : null
      return { exam_id: examId, question_id: q.id, section, answer: a, time_spent_ms: 0, auto_score: score }
    })
    if (batch.length) await supabase.from('exam_answers').upsert(batch, { onConflict: 'exam_id,question_id' })

    ;[gTimer,qTimer,pTimer,spTimer,rTimer,lTimer,wTimer].forEach(r => clearInterval(r.current))
    setSaving(false)

    const t = exam?.exam_templates, role = t?.role_profile || 'general'
    const order = (ROLE_ORDER[role] || ROLE_ORDER.general).filter((s: string) => (t?.[`${s}_count`] || 0) > 0)
    const next = order[order.indexOf(section) + 1]
    if (next) router.push(`/exam/${examId}/section/${next}`)
    else { cam?.getTracks().forEach(t => t.stop()); await supabase.from('exams').update({ status:'completed', completed_at: new Date().toISOString() }).eq('id', examId); router.push(`/exam/${examId}/complete`) }
  }

  async function finishExam() {
    setSaving(true)
    const batch = questions.map(q => {
      const a = answers[q.id] || ''
      return { exam_id: examId, question_id: q.id, section, answer: a, time_spent_ms: 0, auto_score: ['grammar','reading','listening'].includes(section) ? (q.correct_answer?.trim().toLowerCase() === a.trim().toLowerCase() ? 1 : 0) : null }
    })
    if (batch.length) await supabase.from('exam_answers').upsert(batch, { onConflict: 'exam_id,question_id' })
    cam?.getTracks().forEach(t => t.stop())
    ;[gTimer,qTimer,pTimer,spTimer,rTimer,lTimer,wTimer].forEach(r => clearInterval(r.current))
    await supabase.from('exams').update({ status:'completed', completed_at: new Date().toISOString() }).eq('id', examId)
    setSaving(false)
    router.push(`/exam/${examId}/complete`)
  }

  /* ═══ COMPUTED ═══ */
  const cq = questions[ci]
  const t = exam?.exam_templates
  const role = t?.role_profile || 'general'
  const secOrder = (ROLE_ORDER[role] || ROLE_ORDER.general).filter((s: string) => (t?.[`${s}_count`] || 0) > 0)
  const secIdx = secOrder.indexOf(section)
  const nextSec = secOrder[secIdx + 1]
  const totalQ = secOrder.reduce((s: number, x: string) => s + (t?.[`${x}_count`] || 0), 0)
  const overallP = secOrder.slice(0, secIdx).reduce((s: number, x: string) => s + (t?.[`${x}_count`] || 0), 0) + ci + 1
  const unanswered = questions.filter(q => !answers[q.id]).length
  const isTimeCrit = timeLeft < 300
  const minW = 40

  function parseOpts(c: string) {
    const lines = c.split('\n'), qT = lines.filter(l => !l.trim().match(/^[A-D][.)]\s/)).join('\n').trim()
    const opts: {letter:string;text:string}[] = []
    for (const l of lines) { const m = l.trim().match(/^([A-D])[.)]\s*(.+)/); if (m) opts.push({letter:m[1],text:m[2]}) }
    return { qT, opts }
  }
  function parseReading(c: string) {
    const p = c.split(/\n{2,}/)
    if (p.length >= 2) { const pass = p[0].trim(), r = p.slice(1).join('\n\n').trim(), {qT,opts} = parseOpts(r); return {pass,qT:qT||r,opts} }
    const {qT,opts} = parseOpts(c); return {pass:'',qT,opts}
  }

  /* ═══ LOADING ═══ */
  if (!ready) return (
    <div style={{minHeight:'100vh',background:BRAND.off,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif"}}>
      <div style={{width:'32px',height:'32px',border:'3px solid #E5E7EB',borderTop:'3px solid #3B82F6',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  /* ═══ NO Q ═══ */
  if (!cq) return <div style={{minHeight:'100vh',background:BRAND.off,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><p style={{color:BRAND.text3,marginBottom:'16px'}}>No questions available.</p><button onClick={sectionDone} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:BRAND.navy,color:'#fff',cursor:'pointer'}}>Continue →</button></div></div>

  /* ═══ WRITING PREP ═══ */
  if (phase === 'writing-prep') {
    const lines = cq.content.split('\n'), qLine = lines[0] || '', promptLine = lines.slice(1).join('\n') || 'Write your response based on the scenario above.'
    return (
      <div style={{minHeight:'100vh',background:BRAND.off,fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column'}}>
        <div style={{background:BRAND.white,borderBottom:`1px solid ${BRAND.border}`,padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'16px',fontWeight:900,fontFamily:"'Montserrat',sans-serif",color:BRAND.navy}}>AVILINGO</span>
            <span style={{fontSize:'12px',fontWeight:700,padding:'4px 12px',borderRadius:'6px',background:SC.writing+'15',color:SC.writing}}>✏️ Writing</span>
            <span style={{fontSize:'14px',fontWeight:600,color:BRAND.text1}}>Question {ci+1} / {questions.length} — Preparation</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontSize:'15px',fontWeight:700,padding:'5px 14px',borderRadius:'8px',color:'#7C3AED',background:'#F5F3FF',border:'1px solid #DDD6FE',fontFamily:"'Montserrat',sans-serif"}}>📖 {fmt(wPrepCD)}</span>
            <span style={{fontSize:'15px',fontWeight:700,padding:'5px 14px',borderRadius:'8px',color:isTimeCrit?BRAND.danger:BRAND.warning,background:isTimeCrit?'#FEF2F2':'#FFFBEB',border:`1px solid ${isTimeCrit?'#FECACA':'#FDE68A'}`,fontFamily:"'Montserrat',sans-serif"}}>🕐 {fmt(timeLeft)}</span>
          </div>
        </div>
        {cam && <CamPip vidRef={vidRef} />}
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
          <div style={{maxWidth:'640px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'16px',fontWeight:600,color:'#7C3AED',marginBottom:'8px'}}>📖 Read the question and prepare your answer</div>
            <p style={{fontSize:'14px',color:BRAND.text3,marginBottom:'24px'}}>You have {fmt(wPrepCD)} to read. Writing will start automatically.</p>
            <div style={{background:'#0A1628',borderRadius:'14px',padding:'20px',marginBottom:'14px',textAlign:'left'}}>
              <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'4px',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',display:'inline-block',marginBottom:'10px'}}>Scenario</span>
              <p style={{fontSize:'15px',color:'#fff',lineHeight:1.7,fontStyle:'italic',margin:0}}>{qLine}</p>
            </div>
            <div style={{background:'#334155',borderRadius:'14px',padding:'20px',marginBottom:'20px',textAlign:'left'}}>
              <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'4px',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',display:'inline-block',marginBottom:'10px'}}>Your Task</span>
              <p style={{fontSize:'15px',color:'#fff',lineHeight:1.7,margin:0}}>{promptLine}</p>
            </div>
            <button onClick={() => { clearInterval(wTimer.current); setPhase('exam') }} style={{padding:'12px 28px',borderRadius:'12px',border:'2px solid #7C3AED',background:'transparent',color:'#7C3AED',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>I'm Ready — Start Writing →</button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══ MAIN EXAM ═══ */
  return (
    <div style={{minHeight:'100vh',background:BRAND.off,fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column',userSelect:'none',position:'relative'}}>

      {/* STRIKE MODAL */}
      {showStrike && <Modal><div style={{background:BRAND.white,borderRadius:'16px',padding:'32px',maxWidth:'460px',width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',padding:'10px 16px',background:'#FEF3C7',borderRadius:'10px',border:'1px solid #FDE68A'}}><span style={{fontSize:'22px'}}>⚠️</span><span style={{fontSize:'18px',fontWeight:700,color:BRAND.warning}}>Tab Switch Detected</span></div>
        <div style={{background:'#FFFBEB',borderRadius:'10px',padding:'14px',marginBottom:'14px',border:'1px solid #FDE68A'}}><p style={{fontSize:'14px',fontWeight:600,color:'#92400E',marginBottom:'4px'}}>You switched to another tab or window!</p><p style={{fontSize:'13px',color:'#92400E',margin:0}}>This behavior is not allowed and has been recorded.</p></div>
        <div style={{textAlign:'center',padding:'18px',background:BRAND.off,borderRadius:'10px',marginBottom:'14px'}}><div style={{fontSize:'36px',fontWeight:800,color:BRAND.warning}}>{strikes} / 3</div><div style={{fontSize:'13px',color:BRAND.text3}}>Tab Switches</div></div>
        <div style={{background:'#FEF2F2',borderRadius:'10px',padding:'12px',marginBottom:'14px',border:'1px solid #FECACA'}}><p style={{fontSize:'13px',fontWeight:600,color:'#991B1B',marginBottom:'2px'}}>🚫 Important Warning:</p><p style={{fontSize:'13px',color:'#991B1B',margin:0}}>If you switch tabs 3 times, your exam will be automatically invalidated.</p></div>
        <button onClick={() => setShowStrike(false)} style={{width:'100%',padding:'14px',borderRadius:'10px',border:'none',background:BRAND.navy,color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>I Understand - Continue Exam</button>
      </div></Modal>}

      {/* FULLSCREEN MODAL */}
      {showFS && <Modal dark><div style={{background:'#FFFBEB',borderRadius:'16px',padding:'36px',maxWidth:'440px',width:'90%',textAlign:'center',border:`3px solid ${BRAND.gold}`}}>
        <div style={{fontSize:'48px',marginBottom:'12px'}}>🔒</div>
        <h3 style={{fontSize:'20px',fontWeight:700,color:BRAND.warning,marginBottom:'12px',fontFamily:"'Montserrat',sans-serif"}}>Fullscreen Mode Required</h3>
        <p style={{fontSize:'14px',color:BRAND.text3,marginBottom:'16px'}}>For security reasons, the exam must be taken in fullscreen mode.</p>
        <div style={{background:'#FEF3C7',borderRadius:'8px',padding:'12px',marginBottom:'20px'}}><span style={{fontSize:'13px',color:'#92400E'}}>⚠️ Your exam is paused until you return to fullscreen mode.</span></div>
        <button onClick={async () => { try { await document.documentElement.requestFullscreen(); setShowFS(false) } catch(e) { console.warn('fs:', e) } }} style={{padding:'14px 32px',borderRadius:'12px',border:'none',background:BRAND.gold,color:BRAND.white,fontSize:'15px',fontWeight:700,cursor:'pointer'}}>⛶ Enter Fullscreen Mode</button>
        <p style={{fontSize:'12px',color:BRAND.text4,marginTop:'12px'}}>Tip: You can also press F11</p>
      </div></Modal>}

      {/* TRANSITION MODAL — Section Briefing */}
      {showTransition && <Modal><div style={{background:BRAND.white,borderRadius:'20px',padding:'0',maxWidth:'560px',width:'92%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',overflow:'hidden'}}>
        {/* Header with section color */}
        <div style={{background:SC[nextSec]||BRAND.navy,padding:'28px 32px',textAlign:'center'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>{SI[nextSec]||'📋'}</div>
          <h3 style={{fontSize:'22px',fontWeight:800,color:'#fff',margin:0,fontFamily:"'Montserrat',sans-serif"}}>Up Next: {SL[nextSec] || 'Next Section'}</h3>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.8)',margin:'8px 0 0'}}>Section {secIdx + 2} of {secOrder.length}</p>
        </div>
        {/* Briefing content */}
        <div style={{padding:'24px 32px'}}>
          <div style={{background:BRAND.off,borderRadius:'12px',padding:'16px',marginBottom:'16px',border:`1px solid ${BRAND.border}`}}>
            <div style={{fontSize:'13px',fontWeight:700,color:BRAND.text2,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>What to expect</div>
            {nextSec === 'listening' && <><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• You will listen to audio recordings and answer questions.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• Each audio can only be played once.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:0}}>• Read the question before the audio starts.</p></>}
            {nextSec === 'reading' && <><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• You will read passages and answer comprehension questions.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:0}}>• Read carefully — pay attention to details.</p></>}
            {nextSec === 'writing' && <><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• You will write responses to given scenarios.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• Minimum 40 words per question.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:0}}>• Copy/paste is disabled for security.</p></>}
            {nextSec === 'speaking' && <><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• You will record spoken responses to scenarios.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• Minimum 30 seconds per recording.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:0}}>• You have one attempt per question.</p></>}
            {nextSec === 'grammar' && <><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:'0 0 6px'}}>• Multiple-choice grammar questions.</p><p style={{fontSize:'14px',color:BRAND.text2,lineHeight:1.7,margin:0}}>• Select the best answer for each question.</p></>}
          </div>
          <div style={{background:'#FFFBEB',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',border:'1px solid #FDE68A'}}>
            <span style={{fontSize:'13px',color:'#92400E',fontWeight:500}}>⚠️ Once you proceed, you cannot return to the {SL[section]} section.</span>
          </div>
          {unanswered > 0 && <div style={{background:'#FEF2F2',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',border:'1px solid #FECACA'}}>
            <span style={{fontSize:'13px',color:BRAND.danger,fontWeight:600}}>⚠️ {unanswered} unanswered question{unanswered>1?'s':''} in {SL[section]}.</span>
          </div>}
          <div style={{display:'flex',gap:'12px'}}>
            <button onClick={() => setShowTransition(false)} style={{flex:1,padding:'14px',borderRadius:'12px',border:`2px solid ${BRAND.border}`,background:BRAND.white,color:BRAND.text2,fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Go Back</button>
            <button onClick={() => { setShowTransition(false); sectionDone() }} style={{flex:1,padding:'14px',borderRadius:'12px',border:'none',background:SC[nextSec]||BRAND.success,color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Continue to {SL[nextSec]} →</button>
          </div>
        </div>
      </div></Modal>}

      {/* FINISH EXAM MODAL */}
      {showFinish && <Modal><div style={{background:BRAND.white,borderRadius:'16px',padding:'32px',maxWidth:'440px',width:'90%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 16px'}}>🚩</div>
        <h3 style={{fontSize:'20px',fontWeight:700,color:BRAND.danger,marginBottom:'8px',fontFamily:"'Montserrat',sans-serif"}}>Finish Exam?</h3>
        <p style={{fontSize:'14px',color:BRAND.text3,marginBottom:'14px'}}>Are you sure you want to finish the exam now? This action cannot be undone.</p>
        <div style={{background:BRAND.off,borderRadius:'10px',padding:'14px',marginBottom:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'13px',color:BRAND.text3}}>Current Section</span><span style={{fontSize:'13px',fontWeight:600,color:BRAND.text1}}>{SL[section]}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'13px',color:BRAND.text3}}>Questions Answered</span><span style={{fontSize:'13px',fontWeight:600,color:BRAND.text1}}>{questions.length - unanswered} / {questions.length}</span></div>
          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'13px',color:BRAND.text3}}>Time Remaining</span><span style={{fontSize:'13px',fontWeight:600,color:isTimeCrit?BRAND.danger:BRAND.text1}}>{fmt(timeLeft)}</span></div>
        </div>
        {unanswered > 0 && <div style={{background:'#FEF2F2',borderRadius:'8px',padding:'10px',marginBottom:'14px',border:'1px solid #FECACA'}}><span style={{fontSize:'13px',color:BRAND.danger,fontWeight:600}}>⚠️ You have {unanswered} unanswered question{unanswered>1?'s':''}!</span></div>}
        <div style={{display:'flex',gap:'12px'}}>
          <button onClick={() => setShowFinish(false)} style={{flex:1,padding:'12px',borderRadius:'10px',border:`2px solid ${BRAND.border}`,background:BRAND.white,color:BRAND.text2,fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Continue Exam</button>
          <button onClick={() => { setShowFinish(false); finishExam() }} style={{flex:1,padding:'12px',borderRadius:'10px',border:'none',background:BRAND.danger,color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>{saving ? 'Saving...' : 'Finish Now'}</button>
        </div>
      </div></Modal>}

      {/* TOP BAR */}
      <div style={{background:BRAND.white,borderBottom:`1px solid ${BRAND.border}`,padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'16px',fontWeight:900,fontFamily:"'Montserrat',sans-serif",color:BRAND.navy,letterSpacing:'0.5px'}}>AVILINGO</span>
          <span style={{fontSize:'12px',fontWeight:700,padding:'4px 12px',borderRadius:'6px',background:SC[section]+'15',color:SC[section]}}>{SI[section]} {SL[section]}</span>
          <span style={{fontSize:'14px',fontWeight:600,color:BRAND.text1}}>Question {ci+1} of {questions.length}</span>
          <span style={{fontSize:'12px',color:BRAND.text4,fontWeight:500}}>Overall {overallP}/{totalQ}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {section==='writing' && <span style={{fontSize:'14px',fontWeight:700,padding:'5px 14px',borderRadius:'8px',background:qTimeLeft<30?'#FEF2F2':'#F5F3FF',color:qTimeLeft<30?BRAND.danger:'#7C3AED',border:`1px solid ${qTimeLeft<30?'#FECACA':'#DDD6FE'}`}}>⏱ {fmt(qTimeLeft)}</span>}
          <span style={{fontSize:'15px',fontWeight:700,padding:'5px 14px',borderRadius:'8px',color:isTimeCrit?BRAND.danger:BRAND.warning,background:isTimeCrit?'#FEF2F2':'#FFFBEB',border:`1px solid ${isTimeCrit?'#FECACA':'#FDE68A'}`,fontFamily:"'Montserrat',sans-serif"}}>🕐 {fmt(timeLeft)}</span>
          {answerSaving && <span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'6px',background:'#EFF6FF',color:'#2563EB',fontWeight:600}}>Saving...</span>}
          {strikes > 0 && <span style={{fontSize:'12px',fontWeight:700,color:BRAND.danger,background:'#FEF2F2',padding:'4px 10px',borderRadius:'6px'}}>⚠️ {strikes}/3</span>}
        </div>
      </div>
      <div style={{height:'3px',background:BRAND.border}}><div style={{height:'100%',background:SC[section],width:`${((ci+1)/questions.length)*100}%`,transition:'width 0.3s'}} /></div>
      {completedSec.length > 0 && <div style={{padding:'6px 24px',background:'#FAFAFA',borderBottom:`1px solid ${BRAND.border}`,fontSize:'12px',color:BRAND.text3,display:'flex',alignItems:'center',gap:'8px'}}>
        <span>Completed:</span>{completedSec.map(s => <span key={s} style={{padding:'2px 10px',borderRadius:'100px',fontSize:'11px',fontWeight:600,background:SC[s]+'15',color:SC[s]}}>{SL[s]}</span>)}<span>→ Now: <strong style={{color:SC[section]}}>{SL[section]}</strong></span>
      </div>}

      {/* CAMERA */}
      {cam && <CamPip vidRef={vidRef} />}

      {/* CONTENT */}
      <div style={{flex:1,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'28px 24px'}}>
        <div style={{width:'100%',maxWidth:'820px'}}>

          {/* MCQ */}
          {['grammar','reading','listening'].includes(section) && (() => {
            const p = section==='reading' ? parseReading(cq.content) : {pass:'', ...parseOpts(cq.content)}
            return <div style={{background:BRAND.white,borderRadius:'16px',padding:'28px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'18px'}}>{SI[section]}</span><span style={{fontSize:'16px',fontWeight:700,color:SC[section]}}>{SL[section]} - Question {ci+1}</span></div>
                {answers[cq.id] && <button onClick={() => setAnswers(p => {const n={...p};delete n[cq.id];return n})} style={{padding:'6px 14px',borderRadius:'8px',border:`1px solid ${BRAND.border}`,background:BRAND.off,color:BRAND.text3,fontSize:'12px',fontWeight:600,cursor:'pointer'}}>🗑️ Clear Answer</button>}
              </div>
              {section==='reading' && p.pass && <div style={{background:BRAND.off,borderRadius:'10px',padding:'18px',marginBottom:'14px',border:`1px solid ${BRAND.border}`,fontSize:'14.5px',color:BRAND.text2,lineHeight:1.75}}>{p.pass}</div>}
              {section==='listening' && cq.audio_url && <div style={{marginBottom:'16px'}}>
                {lstPhase==='prep' && <div style={{background:'#FFFBEB',borderRadius:'10px',padding:'16px',border:'1px solid #FDE68A',textAlign:'center'}}><div style={{fontSize:'14px',fontWeight:600,color:BRAND.warning,marginBottom:'6px'}}>Read the question first. Audio plays in {lstPrep}s</div><button onClick={() => {clearInterval(lTimer.current);playAud()}} style={{padding:'8px 20px',borderRadius:'8px',border:'1.5px solid #F59E0B',background:'#fff',color:BRAND.warning,fontSize:'13px',fontWeight:600,cursor:'pointer',marginTop:'6px'}}>▶ Start Listening Now</button></div>}
                {lstPhase==='play' && <audio ref={audRef} src={cq.audio_url} onEnded={() => setLstPhase('answer')} controls style={{width:'100%'}} />}
                {lstPhase==='answer' && <div style={{background:'#F0F9FF',borderRadius:'8px',padding:'12px',border:'1px solid #BAE6FD',fontSize:'13px',color:'#0369A1'}}>🔒 Audio has been played. Replay is not permitted.</div>}
              </div>}
              <div style={{background:BRAND.off,borderRadius:'10px',padding:'20px',marginBottom:'18px',border:`1px solid ${BRAND.border}`,fontSize:'16px',color:BRAND.text1,lineHeight:1.8}}>{p.qT}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                {(p.opts.length>0?p.opts:[{letter:'A',text:'Option A'},{letter:'B',text:'Option B'},{letter:'C',text:'Option C'},{letter:'D',text:'Option D'}]).map(o => {
                  const sel = answers[cq.id]===o.text
                  return <button key={o.letter} onClick={() => handleAns(cq.id,o.text)} style={{padding:'16px 18px',borderRadius:'12px',border:`2px solid ${sel?SC[section]:BRAND.border}`,background:sel?SC[section]+'10':BRAND.white,color:BRAND.text1,fontSize:'15px',cursor:'pointer',textAlign:'left',display:'flex',gap:'12px',alignItems:'center',transition:'all 0.15s'}}>
                    <span style={{width:'28px',height:'28px',borderRadius:'50%',border:`2px solid ${sel?SC[section]:'#D1D5DB'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:800,flexShrink:0,background:sel?SC[section]:'transparent',color:sel?'#fff':BRAND.text3}}>{sel?'✓':o.letter}</span>
                    <span><strong style={{fontWeight:600}}>{o.letter}.</strong> {o.text}</span>
                  </button>
                })}
              </div>
              {answerSaving && <div style={{textAlign:'center',marginTop:'12px',fontSize:'13px',color:BRAND.text3}}>↻ Your answer is being saved...</div>}
            </div>
          })()}

          {/* WRITING */}
          {section==='writing' && <div style={{background:BRAND.white,borderRadius:'16px',padding:'28px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'18px'}}>✏️</span><span style={{fontSize:'16px',fontWeight:700,color:'#7C3AED'}}>Writing - Question {ci+1}</span></div>
              <span style={{padding:'6px 16px',borderRadius:'20px',fontSize:'14px',fontWeight:700,background:qTimeLeft<30?'#FEF2F2':'#F5F3FF',color:qTimeLeft<30?BRAND.danger:'#7C3AED',border:`1.5px solid ${qTimeLeft<30?'#FECACA':'#DDD6FE'}`}}>⏱ {fmt(qTimeLeft)}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
              <div>
                <p style={{fontSize:'14px',color:BRAND.text2,marginBottom:'14px'}}>Write at least {minW} words:</p>
                <div style={{background:'#0A1628',borderRadius:'14px',padding:'18px',marginBottom:'12px'}}><span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'4px',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',display:'inline-block',marginBottom:'10px'}}>Scenario</span><p style={{fontSize:'14.5px',color:'#fff',lineHeight:1.7,fontStyle:'italic',margin:0}}>{cq.content.split('\n')[0]}</p></div>
                <div style={{background:'#334155',borderRadius:'14px',padding:'18px',marginBottom:'12px'}}><span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'4px',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',display:'inline-block',marginBottom:'10px'}}>Your Task</span><p style={{fontSize:'14.5px',color:'#fff',lineHeight:1.7,margin:0}}>{cq.content.split('\n').slice(1).join('\n') || 'Write your response.'}</p></div>
                <div style={{background:'#F0F9FF',borderRadius:'8px',padding:'12px',border:'1px solid #BAE6FD',fontSize:'13px',color:'#0369A1'}}>⏱ {Math.round((t?.writing_timer_mins||3.5)*60)}s per question. Auto-saves when time expires.</div>
              </div>
              <div>
                {!wLocked ? <textarea value={answers[cq.id]||''} onChange={e=>handleAns(cq.id,e.target.value)} placeholder="Write your composition here..." rows={18} style={{width:'100%',padding:'16px',borderRadius:'12px',border:`2px solid ${wordCount>=minW?'#86EFAC':BRAND.border}`,background:BRAND.white,color:BRAND.text1,fontSize:'15px',fontFamily:"'Inter',sans-serif",resize:'none',lineHeight:1.8,outline:'none',minHeight:'360px'}} onCopy={e=>e.preventDefault()} onPaste={e=>e.preventDefault()} onCut={e=>e.preventDefault()} />
                : <div style={{padding:'16px',borderRadius:'12px',border:'2px solid #86EFAC',background:'#F0FDF4',minHeight:'360px',fontSize:'15px',color:BRAND.text3,lineHeight:1.8,whiteSpace:'pre-wrap'}}>{answers[cq.id]||''}</div>}
                {wLocked && <div style={{background:'#F0FDF4',borderRadius:'8px',padding:'10px 14px',marginTop:'8px',border:'1px solid #BBF7D0',fontSize:'13px',color:BRAND.success,fontWeight:600}}>✅ Saved and locked</div>}
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px',fontSize:'13px'}}><span style={{color:BRAND.text3}}>Words: <span style={{fontWeight:700,color:wordCount>=minW?BRAND.success:BRAND.danger}}>{wordCount}</span> / {minW}</span></div>
              </div>
            </div>
          </div>}

          {/* SPEAKING */}
          {section==='speaking' && <div style={{background:BRAND.white,borderRadius:'16px',padding:'28px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'18px'}}><span style={{fontSize:'18px'}}>🗣️</span><span style={{fontSize:'16px',fontWeight:700,color:BRAND.danger}}>Speaking - Question {ci+1}</span></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
              <div>
                <div style={{background:'#0A1628',borderRadius:'14px',padding:'18px',marginBottom:'12px'}}><span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'4px',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',display:'inline-block',marginBottom:'10px'}}>Scenario</span><p style={{fontSize:'14.5px',color:'#fff',lineHeight:1.7,fontStyle:'italic',margin:0}}>{cq.content.split('\n')[0]}</p></div>
                <div style={{background:'#334155',borderRadius:'14px',padding:'18px',marginBottom:'12px'}}><span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'4px',background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',display:'inline-block',marginBottom:'10px'}}>Your Task</span><p style={{fontSize:'14.5px',color:'#fff',lineHeight:1.7,margin:0}}>{cq.content.split('\n').slice(1).join('\n') || 'Speak about the scenario.'}</p></div>
                <div style={{background:'#F0F9FF',borderRadius:'8px',padding:'12px',marginBottom:'8px',border:'1px solid #BAE6FD',fontSize:'13px',color:'#0369A1'}}>🎙️ Record your answer.</div>
                <div style={{background:'#FFFBEB',borderRadius:'8px',padding:'12px',border:'1px solid #FDE68A',fontSize:'13px',color:'#92400E'}}>⚠️ 1 attempt. Min 30 seconds.</div>
              </div>
              <div style={{background:BRAND.off,borderRadius:'12px',padding:'24px',border:`1px solid ${BRAND.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><h4 style={{fontSize:'15px',fontWeight:700,color:BRAND.text1,margin:0}}>Voice Recording</h4><span style={{fontSize:'12px',padding:'3px 10px',borderRadius:'100px',background:spkPhase==='done'?'#DCFCE7':'#F3F4F6',color:spkPhase==='done'?BRAND.success:BRAND.text3,fontWeight:600}}>{spkPhase==='done'?'✅ Recorded':'No recording'}</span></div>
                {spkPhase==='prep' && <div style={{textAlign:'center'}}><div style={{fontSize:'14px',color:BRAND.text3,marginBottom:'12px'}}>Preparation: <strong style={{color:BRAND.danger}}>{fmt(spkPrep)}</strong></div><button onClick={() => {clearInterval(spTimer.current);startRec()}} style={{padding:'14px 32px',borderRadius:'10px',border:'none',background:BRAND.danger,color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>🎙️ Start Recording</button></div>}
                {spkPhase==='rec' && <div style={{textAlign:'center'}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'12px'}}><span style={{width:'12px',height:'12px',borderRadius:'50%',background:BRAND.danger,animation:'pulse 1s infinite'}} /><span style={{fontSize:'13px',color:BRAND.danger,fontWeight:600}}>Recording...</span></div><div style={{fontSize:'14px',color:BRAND.text3,marginBottom:'8px'}}>{fmt(recTime)} / 1:30</div><div style={{height:'4px',background:'#FEE2E2',borderRadius:'2px',overflow:'hidden',marginBottom:'16px'}}><div style={{height:'100%',background:recTime>=30?BRAND.success:BRAND.danger,width:`${(recTime/90)*100}%`,transition:'width 0.25s'}} /></div>{recTime>=30 ? <button onClick={stopRec} style={{padding:'10px 24px',borderRadius:'8px',border:'none',background:BRAND.danger,color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>■ Stop Recording</button> : <div style={{fontSize:'12px',color:BRAND.text4}}>Min 30s — {30-recTime}s left</div>}</div>}
                {spkPhase==='done' && <div style={{textAlign:'center'}}>{audioUrl && <audio src={audioUrl} controls style={{width:'100%',marginBottom:'12px'}} />}<div style={{fontSize:'14px',color:BRAND.success,fontWeight:600}}>✓ Recording saved ({recTime}s)</div></div>}
              </div>
            </div>
          </div>}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{background:BRAND.white,borderTop:`1px solid ${BRAND.border}`,padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div>{['grammar','reading'].includes(section) && ci>0 && <button onClick={handlePrev} style={{padding:'10px 20px',borderRadius:'10px',border:`1.5px solid ${BRAND.border}`,background:BRAND.white,color:BRAND.text2,fontSize:'14px',fontWeight:600,cursor:'pointer'}}>← Previous</button>}</div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          {/* Question Navigator */}
          {['grammar','reading','listening'].includes(section) && (
            <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
              {questions.map((q, i) => (
                <button key={i} onClick={() => setCi(i)} style={{
                  width:'30px',height:'30px',borderRadius:'7px',border:'none',fontSize:'12px',fontWeight:700,cursor:'pointer',
                  background: i===ci ? SC[section] : answers[q.id] ? SC[section]+'25' : '#F3F4F6',
                  color: i===ci ? '#fff' : answers[q.id] ? SC[section] : '#9CA3AF',
                  transition:'all 0.15s',
                }}>{i+1}</button>
              ))}
            </div>
          )}
          <button onClick={() => setShowFinish(true)} style={{padding:'8px 16px',borderRadius:'10px',border:'1.5px solid #FECACA',background:'#FEF2F2',color:BRAND.danger,fontSize:'13px',fontWeight:600,cursor:'pointer'}}>🚩 Finish</button>
        </div>
        <div>
          <button onClick={handleNext} disabled={false} style={{padding:'10px 24px',borderRadius:'10px',border:'none',background:ci===questions.length-1&&nextSec?SC[nextSec]||BRAND.success:BRAND.navy,color:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',opacity:1}}>
            {ci===questions.length-1 ? nextSec ? `Go to ${SL[nextSec]} →` : 'Complete Section →' : 'Next →'}
          </button>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}

/* ═══ COMPONENTS ═══ */
function Modal({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <div style={{position:'fixed',inset:0,background:dark?'rgba(0,0,0,0.95)':'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>{children}</div>
}

function CamPip({ vidRef }: { vidRef: React.RefObject<HTMLVideoElement> }) {
  const [pos, setPos] = useState({ x: 16, y: 70 })
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 130, e.clientX - offset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.current.y)) })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  return (
    <div
      onMouseDown={e => { offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; setDragging(true) }}
      style={{position:'fixed',top:pos.y,left:pos.x,zIndex:900,width:'120px',height:'90px',borderRadius:'12px',overflow:'hidden',border:'2px solid rgba(255,255,255,0.3)',background:'#000',boxShadow:'0 4px 16px rgba(0,0,0,0.4)',cursor:dragging?'grabbing':'grab',userSelect:'none'}}>
      <video ref={vidRef} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',pointerEvents:'none'}} />
      <div style={{position:'absolute',top:'6px',left:'8px',display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#4ADE80',display:'inline-block'}} /><span style={{fontSize:'9px',fontWeight:700,color:'#fff'}}>LIVE</span></div>
    </div>
  )
}
