'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sectionColors: Record<string, string> = {
  grammar: '#3B82F6', reading: '#16A34A', writing: '#9333EA',
  speaking: '#DC2626', listening: '#F59E0B',
}

const sectionLabels: Record<string, string> = {
  grammar: 'Grammar', reading: 'Reading', writing: 'Writing',
  speaking: 'Speaking', listening: 'Listening',
}

const sectionIcons: Record<string, string> = {
  grammar: '📖', reading: '🧩', writing: '✏️',
  speaking: '🗣️', listening: '🔊',
}

export default function ExamCompletePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const examId = params.id as string
  const isTimeUp = searchParams.get('timeup') === '1'

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [summary, setSummary] = useState({ total: 0, answered: 0, completion: 0, time: 0 })
  const [completedSections, setCompletedSections] = useState<string[]>([])

  useEffect(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
    loadExamData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); router.push('/exam'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  async function loadExamData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: examData } = await supabase
      .from('exams')
      .select('*,exam_templates(*)')
      .eq('id', examId).single()

    if (!examData) { router.push('/exam'); return }
    setExam(examData)

    const template = examData.exam_templates
    const sections = ['grammar', 'reading', 'writing', 'speaking', 'listening']
    const activeSections = sections.filter(s => (template?.[`${s}_count`] || 0) > 0)
    setCompletedSections(activeSections)

    const total = activeSections.reduce((sum, s) => sum + (template?.[`${s}_count`] || 0), 0)

    const { count: answeredCount } = await supabase
      .from('exam_answers')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', examId)
      .neq('answer', '')

    const answered = answeredCount || 0
    const startedAt = examData.started_at ? new Date(examData.started_at).getTime() : 0
    const completedAt = examData.completed_at ? new Date(examData.completed_at).getTime() : Date.now()
    const timeMinutes = startedAt ? Math.round((completedAt - startedAt) / 60000) : 0

    setSummary({
      total,
      answered,
      completion: total > 0 ? Math.round((answered / total) * 100) : 0,
      time: timeMinutes,
    })

    // Trigger auto-scoring if not already scored
    if (examData.status === 'completed' && !examData.final_numeric_score) {
      try {
        await fetch('/api/score-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId })
        })
      } catch (err) {
        console.error('Scoring error:', err)
      }
    }

    setLoading(false)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F0F2F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: '#6B7280', fontSize: '16px' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F3F4F6',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#0A1628',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
          {exam?.exam_templates?.name || 'English Proficiency Exam'}
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 700, padding: '4px 14px', borderRadius: '100px',
          background: isTimeUp ? 'rgba(255,255,255,0.15)' : '#16A34A',
          color: '#fff',
        }}>{isTimeUp ? '⏱ Time\'s Up' : '✓ Completed'}</span>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px', maxWidth: '600px', width: '100%',
          overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          {/* Green/Orange header */}
          <div style={{
            background: isTimeUp ? '#F59E0B' : '#16A34A',
            padding: '32px', textAlign: 'center',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 16px',
            }}>{isTimeUp ? '⏱' : '🏆'}</div>
            <h2 style={{
              fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '6px',
              fontFamily: "'Montserrat', sans-serif",
            }}>{isTimeUp ? "Time's Up!" : 'Congratulations!'}</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
              {isTimeUp
                ? 'Your answers have been submitted automatically.'
                : 'You have successfully completed the exam.'}
            </p>
          </div>

          {/* Summary */}
          <div style={{ padding: '28px' }}>
            <h3 style={{
              fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px',
            }}>Exam Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>Total Questions</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{summary.total}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>Answered</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{summary.answered}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>Completion</span>
                <span style={{
                  fontSize: '14px', fontWeight: 700,
                  color: summary.completion >= 80 ? '#16A34A' : '#D97706',
                }}>{summary.completion}%</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 14px', background: '#F9FAFB', borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>Time</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{summary.time} minutes</span>
              </div>
            </div>

            {/* Completed Sections */}
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Completed Sections</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {completedSections.map(s => (
                <span key={s} style={{
                  fontSize: '12px', fontWeight: 600, padding: '4px 14px',
                  borderRadius: '100px',
                  background: sectionColors[s] + '15',
                  color: sectionColors[s],
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {sectionIcons[s]} {sectionLabels[s]}
                </span>
              ))}
            </div>

            {/* Success message */}
            <div style={{
              background: '#F0FDF4', borderRadius: '10px', padding: '14px 18px',
              border: '1px solid #BBF7D0', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#16A34A' }}>
                  Your answers have been saved successfully
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Results are being evaluated.
                </div>
              </div>
            </div>

            {/* Return button */}
            <button onClick={() => router.push('/exam')} style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              border: 'none', background: '#1F2937', color: '#fff',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              🏠 Return to Home Page
            </button>
            <div style={{
              textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#9CA3AF',
            }}>
              Auto-redirect in {countdown}s
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
