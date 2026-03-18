'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ExamTemplate {
  title: string
  description: string
  duration_minutes: number
  passing_score: number
  sections: Section[]
  proctoring_enabled: boolean
  violation_threshold: number
  cefr_level: string
  rubric_enabled: boolean
}

interface Section {
  name: string
  duration_minutes: number
  question_ids: string[]
}

export default function ExamWizardStepper() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ExamTemplate>({
    title: '',
    description: '',
    duration_minutes: 60,
    passing_score: 70,
    sections: [],
    proctoring_enabled: false,
    violation_threshold: 3,
    cefr_level: 'B1',
    rubric_enabled: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const steps = [
    { num: 1, title: 'Basic Info', icon: '📝' },
    { num: 2, title: 'Duration & Scoring', icon: '⏱️' },
    { num: 3, title: 'Select Questions', icon: '❓' },
    { num: 4, title: 'Create Sections', icon: '📚' },
    { num: 5, title: 'Setup Rubric', icon: '⭐' },
    { num: 6, title: 'Proctoring Rules', icon: '👁️' },
    { num: 7, title: 'Invite Candidates', icon: '📧' },
    { num: 8, title: 'CEFR Settings', icon: '🎯' },
    { num: 9, title: 'Review & Publish', icon: '✅' },
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      setError('')
    }
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const validateStep = (currentStep: number): boolean => {
    switch(currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError('Exam title is required')
          return false
        }
        return true
      case 2:
        if (formData.duration_minutes < 15) {
          setError('Duration must be at least 15 minutes')
          return false
        }
        if (formData.passing_score < 0 || formData.passing_score > 100) {
          setError('Passing score must be 0-100')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('exam_templates')
        .insert([{ name: formData.title, description: formData.description, duration_minutes: formData.duration_minutes, passing_score: formData.passing_score, sections: formData.sections, proctoring_enabled: formData.proctoring_enabled, violation_threshold: formData.violation_threshold, cefr_level: formData.cefr_level, rubric_enabled: formData.rubric_enabled, created_at: new Date(), }])
      
      if (err) throw err
      setSuccess('✅ Exam template published successfully!')
      setTimeout(() => window.location.href = '/admin', 2000)
    } catch (err: any) {
      setError('❌ ' + (err.message || 'Failed to publish'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', padding: '40px 20px', fontFamily: 'var(--fb)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <a href="/admin" style={{ fontSize: '13px', color: 'var(--sky)', textDecoration: 'none' }}>
            ← Back to Admin
          </a>
          <h1 style={{ fontFamily: 'var(--fm)', fontSize: '28px', fontWeight: 900, color: 'var(--navy)', marginTop: '10px', marginBottom: '4px' }}>
            Exam Wizard
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--t3)' }}>
            Create and configure a new exam in 9 easy steps
          </p>
        </div>

        {/* Stepper */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--bdr)', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(9, 1fr)`, gap: '8px', marginBottom: '24px' }}>
            {steps.map(s => (
              <div
                key={s.num}
                onClick={() => s.num <= step && setStep(s.num)}
                style={{
                  cursor: s.num <= step ? 'pointer' : 'default',
                  padding: '12px 8px',
                  borderRadius: '8px',
                  background: s.num === step ? 'var(--sky)' : s.num < step ? 'var(--sky3)' : 'var(--off)',
                  border: `2px solid ${s.num === step ? 'var(--sky)' : s.num < step ? 'var(--sky)' : 'var(--bdr)'}`,
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ fontSize: '16px', marginBottom: '2px' }}>{s.icon}</div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: s.num === step ? '#fff' : s.num < step ? 'var(--sky)' : 'var(--t2)',
                }}>
                  {s.num}
                </div>
              </div>
            ))}
          </div>

          {/* Current Step Title */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px 0' }}>
              {steps[step - 1].icon} {steps[step - 1].title}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--t3)' }}>
              Step {step} of 9
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '6px', color: '#991B1B', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '12px', background: '#EAF3DE', border: '1px solid #BBEF63', borderRadius: '6px', color: '#27500A', fontSize: '13px', marginBottom: '16px' }}>
              {success}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                Exam Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="e.g., English Proficiency Test Level B1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--bdr)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  fontFamily: 'var(--fb)',
                }}
              />

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of this exam..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--bdr)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'var(--fb)',
                  minHeight: '100px',
                  marginBottom: '16px',
                }}
              />
            </div>
          )}

          {/* Step 2: Duration & Scoring */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="15"
                  value={formData.duration_minutes}
                  onChange={e => handleInputChange('duration_minutes', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--bdr)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'var(--fb)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                  Passing Score (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_score}
                  onChange={e => handleInputChange('passing_score', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--bdr)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'var(--fb)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Select Questions */}
          {step === 3 && (
            <div style={{ padding: '16px', background: 'var(--off)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>❓</div>
              <p style={{ color: 'var(--t2)', marginBottom: '12px' }}>
                Question selection interface (to be implemented with question bank)
              </p>
              <button style={{
                padding: '10px 20px',
                background: 'var(--sky)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}>
                Browse Questions
              </button>
            </div>
          )}

          {/* Step 4: Create Sections */}
          {step === 4 && (
            <div style={{ padding: '16px', background: 'var(--off)', borderRadius: '6px', textAlign: 'center' }}>
              <p style={{ color: 'var(--t2)' }}>Section management (e.g., Grammar, Reading, Writing, Listening)</p>
            </div>
          )}

          {/* Step 5: Setup Rubric */}
          {step === 5 && (
            <div>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.rubric_enabled}
                  onChange={e => handleInputChange('rubric_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)' }}>
                  Enable Rubric-Based Grading
                </span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '8px' }}>
                {formData.rubric_enabled
                  ? 'Rubric-based grading allows detailed per-criterion scoring'
                  : 'Evaluators will assign simple point scores'}
              </p>
            </div>
          )}

          {/* Step 6: Proctoring Rules */}
          {step === 6 && (
            <div>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={formData.proctoring_enabled}
                  onChange={e => handleInputChange('proctoring_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)' }}>
                  Enable Proctoring
                </span>
              </label>

              {formData.proctoring_enabled && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                    Violation Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.violation_threshold}
                    onChange={e => handleInputChange('violation_threshold', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--bdr)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'var(--fb)',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '6px' }}>
                    Exam will be flagged after this many violations
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Invite Candidates */}
          {step === 7 && (
            <div style={{ padding: '16px', background: 'var(--off)', borderRadius: '6px', textAlign: 'center' }}>
              <p style={{ color: 'var(--t2)' }}>Candidate invitation system (bulk email with links)</p>
            </div>
          )}

          {/* Step 8: CEFR Settings */}
          {step === 8 && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                CEFR Level
              </label>
              <select
                value={formData.cefr_level}
                onChange={e => handleInputChange('cefr_level', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--bdr)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'var(--fb)',
                }}
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>
          )}

          {/* Step 9: Review & Publish */}
          {step === 9 && (
            <div>
              <div style={{ background: 'var(--off)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>Exam Summary</h3>
                <div style={{ fontSize: '14px', color: 'var(--t1)', lineHeight: '1.8' }}>
                  <p><strong>Title:</strong> {formData.title}</p>
                  <p><strong>Duration:</strong> {formData.duration_minutes} minutes</p>
                  <p><strong>Passing Score:</strong> {formData.passing_score}%</p>
                  <p><strong>CEFR Level:</strong> {formData.cefr_level}</p>
                  <p><strong>Proctoring:</strong> {formData.proctoring_enabled ? '✅ Enabled' : '❌ Disabled'}</p>
                  <p><strong>Rubric Grading:</strong> {formData.rubric_enabled ? '✅ Enabled' : '❌ Disabled'}</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--t3)' }}>
                Review all settings above. Click "Publish" to create this exam template.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button
            onClick={handlePrev}
            disabled={step === 1}
            style={{
              padding: '11px 24px',
              border: '1px solid var(--bdr)',
              background: '#fff',
              color: 'var(--navy)',
              borderRadius: '6px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: step === 1 ? 0.5 : 1,
              fontSize: '14px',
            }}
          >
            ← Previous
          </button>

          <div style={{ fontSize: '13px', color: 'var(--t2)', display: 'flex', alignItems: 'center' }}>
            Step {step} of 9
          </div>

          {step < 9 ? (
            <button
              onClick={handleNext}
              style={{
                padding: '11px 24px',
                border: 'none',
                background: 'var(--sky)',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={loading}
              style={{
                padding: '11px 24px',
                border: 'none',
                background: loading ? 'var(--t2)' : '#27500A',
                color: '#fff',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {loading ? '⏳ Publishing...' : '✅ Publish Exam'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}