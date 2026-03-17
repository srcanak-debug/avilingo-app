'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sectionColors: Record<string, string> = {
  grammar: '#3B82F6',
  reading: '#16A34A',
  writing: '#9333EA',
  speaking: '#DC2626',
  listening: '#F59E0B',
}

const sectionLabels: Record<string, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  listening: 'Listening',
}

const ROLE_SECTION_ORDER: Record<string, string[]> = {
  general: ['grammar', 'reading', 'listening', 'writing', 'speaking'],
  flight_deck: ['grammar', 'reading', 'listening', 'writing', 'speaking'],
  cabin_crew: ['grammar', 'listening', 'reading', 'speaking', 'writing'],
  atc: ['grammar', 'listening', 'reading', 'speaking', 'writing'],
  maintenance: ['grammar', 'reading', 'writing', 'listening', 'speaking'],
  ground_staff: ['grammar', 'reading', 'listening', 'writing', 'speaking'],
}

export default function ExamStartPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    if (data.status === 'completed') { router.push(`/exam/${examId}/complete`); return }
    setExam(data)
    setLoading(false)
  }

  async function handleStartExam() {
    const template = exam.exam_templates
    const role = template.role_profile || 'general'
    const sectionOrder = ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general
    const firstSection = sectionOrder.find((s: string) => (template[`${s}_count`] || 0) > 0) || sectionOrder[0]
    router.push(`/exam/${examId}/section/${firstSection}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6B7280', fontSize: '16px', fontFamily: "'Inter', sans-serif" }}>Loading exam...</div>
    </div>
  )

  const template = exam?.exam_templates
  const role = template?.role_profile || 'general'
  const sectionOrder = (ROLE_SECTION_ORDER[role] || ROLE_SECTION_ORDER.general)
    .filter((s: string) => (template?.[`${s}_count`] || 0) > 0)
  const totalQuestions = sectionOrder.reduce((sum: number, s: string) => sum + (template?.[`${s}_count`] || 0), 0)

  const levelRange = template?.passing_cefr
    ? (() => {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        const idx = levels.indexOf(template.passing_cefr)
        return idx > 0 ? `${levels[idx - 1]} - ${levels[idx]}` : template.passing_cefr
      })()
    : 'B1 - B2'

  const isActive = exam.status === 'pending' || exam.status === 'in_progress'

  const formatDate = (d: string) => {
    if (!d) return '—'
    const date = new Date(d)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>📋</span>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, color: '#111',
            fontFamily: "'Montserrat', sans-serif", margin: 0,
          }}>
            {template?.name || 'English Proficiency Exam'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '42px', marginBottom: '28px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '3px 12px',
            borderRadius: '100px', background: '#DBEAFE', color: '#2563EB',
          }}>{levelRange}</span>
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '3px 12px',
            borderRadius: '100px',
            background: isActive ? '#DCFCE7' : '#FEE2E2',
            color: isActive ? '#16A34A' : '#DC2626',
          }}>{isActive ? 'Active' : exam.status}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Exam Schedule */}
            <div style={{
              background: '#FAFAFA', borderRadius: '12px', padding: '20px',
              border: '1px solid #F3F4F6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>⏰</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>Exam Schedule</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Start: </span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{formatDate(exam.created_at)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>End: </span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    {formatDate(new Date(new Date(exam.created_at).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString())}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Estimated Duration: </span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{template?.time_limit_mins} minutes</span>
                </div>
              </div>
            </div>

            {/* Question Distribution */}
            <div style={{
              background: '#FAFAFA', borderRadius: '12px', padding: '20px',
              border: '1px solid #F3F4F6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>📂</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>Question Distribution</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {sectionOrder.map((s: string) => (
                  <span key={s} style={{
                    fontSize: '12px', fontWeight: 600, padding: '4px 14px',
                    borderRadius: '100px',
                    background: sectionColors[s] + '15',
                    color: sectionColors[s],
                    border: `1px solid ${sectionColors[s]}30`,
                  }}>
                    {sectionLabels[s]}: {template?.[`${s}_count`]} Questions
                  </span>
                ))}
              </div>
            </div>

            {/* Exam Information */}
            <div style={{
              background: '#FAFAFA', borderRadius: '12px', padding: '20px',
              border: '1px solid #F3F4F6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>Exam Information</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Level: </span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{levelRange}</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Format: </span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Online (Proctored)</span>
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Total Questions: </span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{totalQuestions}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Your camera and microphone will be monitored throughout the exam.
                </div>
              </div>
            </div>

            {/* Important Rules */}
            <div style={{
              background: '#FFFBEB', borderRadius: '12px', padding: '20px',
              border: '1px solid #FEF3C7',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>Important Rules</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Do not switch to another tab during the exam',
                  'Do not turn off your camera or microphone',
                  'Do not use other applications or websites',
                  'Do not attempt to cheat or use unauthorized materials',
                ].map((rule, i) => (
                  <div key={i} style={{ fontSize: '13px', color: '#374151', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#6B7280', flexShrink: 0 }}>•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ready bar */}
          <div style={{
            background: '#F0FDF4', borderRadius: '12px', padding: '14px 24px',
            border: '1px solid #BBF7D0', textAlign: 'center', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#16A34A' }}>Ready to start!</span>
          </div>

          {/* Start Button */}
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleStartExam} style={{
              padding: '14px 48px', borderRadius: '12px',
              border: 'none', background: '#2563EB',
              color: '#fff', fontSize: '16px', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}>
              ▶ Start Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
