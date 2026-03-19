'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SECTION_COLORS: Record<string, string> = {
  general:  '#3B82F6',
  picture:  '#8B5CF6',
  scenario: '#F59E0B',
  retell:   '#10B981',
}
const SECTION_LABELS: Record<string, string> = {
  general:  'Genel Soru',
  picture:  'Görsel Anlatım',
  scenario: 'Senaryo',
  retell:   'Metin Yeniden Anlatma',
}
const SECTION_ICONS: Record<string, string> = {
  general: '💬', picture: '🖼️', scenario: '📋', retell: '📖'
}

type Question = {
  questionId: string
  order: number
  section: string
  content: string
  imageUrl: string | null
  readingText: string | null
  answerTimeSec: number
  readTimeSec: number | null
  type: string
}

type Phase = 'loading' | 'reading' | 'answering' | 'submitted' | 'finished' | 'error'

export default function DLAExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [timeLeft, setTimeLeft] = useState(0)
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentQ = questions[currentIdx]

  // Auth + Sınav sorularını yükle
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)

      // Mevcut sınavın sorularını çek
      const { data: examQuestions } = await supabase
        .from('dla_exam_questions')
        .select('*, questions(*)')
        .eq('dla_exam_id', examId)
        .order('question_order', { ascending: true })

      if (!examQuestions || examQuestions.length === 0) {
        setError('Sınav soruları bulunamadı. Lütfen yeniden başlayın.')
        setPhase('error')
        return
      }

      const formatted: Question[] = examQuestions.map(eq => ({
        questionId: eq.question_id,
        order: eq.question_order,
        section: eq.dla_section,
        content: eq.questions?.content || '',
        imageUrl: eq.questions?.image_url || null,
        readingText: eq.questions?.reading_text || null,
        answerTimeSec: eq.questions?.answer_time_sec || 75,
        readTimeSec: eq.questions?.read_time_sec || null,
        type: eq.questions?.type || 'dla_general_question',
      }))

      setQuestions(formatted)
      startQuestion(formatted[0])
    }
    init()

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examId])

  function startQuestion(q: Question) {
    if (timerRef.current) clearInterval(timerRef.current)
    setResponse('')
    setSubmitting(false)

    if (q.readTimeSec && q.readingText) {
      // Retell: önce okuma fazı
      setPhase('reading')
      setTimeLeft(q.readTimeSec)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setPhase('answering')
            startAnswerTimer(q.answerTimeSec)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setPhase('answering')
      startAnswerTimer(q.answerTimeSec)
    }
  }

  function startAnswerTimer(sec: number) {
    setTimeLeft(sec)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleAutoSubmit() {
    await submitAnswer(false)
  }

  async function submitAnswer(skipped: boolean) {
    if (submitting || !currentQ) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const res = await fetch('/api/dla/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId,
          questionId: currentQ.questionId,
          questionOrder: currentQ.order,
          section: currentQ.section,
          responseText: response.trim() || null,
          timespentSec: currentQ.answerTimeSec - timeLeft,
          skipped,
        }),
      })
      const data = await res.json()

      if (data.isComplete) {
        setPhase('finished')
      } else {
        const nextIdx = currentIdx + 1
        if (nextIdx < questions.length) {
          setCurrentIdx(nextIdx)
          startQuestion(questions[nextIdx])
        } else {
          setPhase('finished')
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'loading') return (
    <div style={styles.fullScreen}>
      <div style={styles.loadingSpinner}>⏳ Sorular yükleniyor...</div>
    </div>
  )

  if (phase === 'error') return (
    <div style={styles.fullScreen}>
      <div style={{ color: '#FCA5A5', fontSize: '16px', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <p>{error}</p>
        <button onClick={() => router.push('/dla')} style={styles.backBtn}>← Geri Dön</button>
      </div>
    </div>
  )

  if (phase === 'finished') return (
    <div style={styles.fullScreen}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '32px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', fontFamily: "'Montserrat',sans-serif", marginBottom: '12px' }}>
          Tebrikler! Sınav Tamamlandı
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
          Tüm {questions.length} soruyu yanıtladınız. Yanıtlarınız değerlendiriliyor.
        </p>
        <button
          onClick={() => router.push(`/dla/result/${examId}`)}
          style={{ ...styles.primaryBtn, display: 'block', width: '100%' }}
        >
          📊 Sonuçları Görüntüle →
        </button>
      </div>
    </div>
  )

  if (!currentQ) return null

  const progress = ((currentIdx) / questions.length) * 100
  const color = SECTION_COLORS[currentQ.section] || '#5AAEDF'
  const isUrgent = timeLeft <= 15

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0A1628 0%, #0C2340 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* Top Bar */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: "'Montserrat',sans-serif" }}>
          Avil<span style={{ color: '#5AAEDF' }}>ingo</span>
          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#5AAEDF', background: 'rgba(90,174,223,0.1)', padding: '2px 8px', borderRadius: '100px' }}>DLA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Soru {currentIdx + 1} / {questions.length}</span>
          {/* Timer */}
          <div style={{
            padding: '6px 16px', borderRadius: '100px', fontWeight: 800,
            fontSize: '16px', fontFamily: "'Montserrat',sans-serif",
            background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
            color: isUrgent ? '#FCA5A5' : '#fff',
            border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
            animation: isUrgent ? 'pulse 1s infinite' : 'none',
          }}>
            {phase === 'reading' ? '📖' : '⏱️'} {String(Math.floor(timeLeft / 60)).padStart(2,'0')}:{String(timeLeft % 60).padStart(2,'0')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: 'width 0.5s ease' }} />
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Bölüm Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            {SECTION_ICONS[currentQ.section]}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {SECTION_LABELS[currentQ.section]}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              Soru {currentQ.order} / {questions.length}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: color, background: color + '15', padding: '3px 10px', borderRadius: '100px', border: `1px solid ${color}30`, fontWeight: 700 }}>
            {phase === 'reading' ? '📖 OKUMA SÜRESİ' : '🎤 CEVAP SÜRESİ'}
          </div>
        </div>

        {/* Soru Kartı */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, borderRadius: '18px', padding: '28px', marginBottom: '20px', borderTop: `3px solid ${color}` }}>

          {/* Görsel (Bölüm 2) */}
          {currentQ.imageUrl && (
            <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', maxHeight: '260px' }}>
              <img
                src={currentQ.imageUrl}
                alt="Açıklayınız"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Okuma Metni (Bölüm 4) */}
          {currentQ.readingText && phase === 'reading' && (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📖 Metni Okuyun ({currentQ.readTimeSec}s)
              </div>
              <p style={{ color: '#fff', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
                {currentQ.readingText}
              </p>
            </div>
          )}

          {/* Metin okuma sonrası gizlendi bildirimi */}
          {currentQ.readingText && phase === 'answering' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', fontSize: '13px', color: '#FBBF24' }}>
              📖 Metin gizlendi — şimdi kendi kelimelerinizle anlatın.
            </div>
          )}

          {/* Soru Metni */}
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#fff', lineHeight: 1.6, margin: 0 }}>
            {currentQ.content}
          </p>
        </div>

        {/* Cevap Alanı */}
        {phase === 'answering' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
              💡 Cevabınızı buraya yazın (gerçek sınavda sesli konuşursunuz)
            </div>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Cevabınızı yazın..."
              rows={5}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '15px', lineHeight: 1.6,
                resize: 'none', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Butonlar */}
        {phase === 'answering' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => submitAnswer(true)}
              disabled={submitting}
              style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              Geç →
            </button>
            <button
              onClick={() => submitAnswer(false)}
              disabled={submitting || !response.trim()}
              style={{
                flex: 3, padding: '14px', borderRadius: '12px', border: 'none',
                background: response.trim() ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'rgba(255,255,255,0.1)',
                color: response.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '15px', fontWeight: 700, cursor: response.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Montserrat', sans-serif",
                boxShadow: response.trim() ? `0 4px 20px ${color}40` : 'none',
              }}
            >
              {submitting ? '⏳ Kaydediliyor...' : currentIdx + 1 === questions.length ? '✓ Tamamla' : '→ Sonraki Soru'}
            </button>
          </div>
        )}

        {phase === 'reading' && (
          <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Okuma süresi bitince cevap verme ekranı otomatik açılacak...
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  fullScreen: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0A1628 0%, #0C2340 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,
  loadingSpinner: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '16px',
  } as React.CSSProperties,
  backBtn: {
    marginTop: '20px',
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  primaryBtn: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #3A8ED0, #5AAEDF)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    boxShadow: '0 6px 24px rgba(58,142,208,0.35)',
  } as React.CSSProperties,
}
