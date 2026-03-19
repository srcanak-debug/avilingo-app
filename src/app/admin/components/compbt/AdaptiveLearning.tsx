'use client'
import { useState } from 'react'

interface CompetencyGap {
  topic: string
  score: number
  recommended_lessons: string[]
}

export default function AdaptiveLearning() {
  const [assessmentDone, setAssessmentDone] = useState(false)
  const [gaps] = useState<CompetencyGap[]>([
    { topic: 'B737 Hydraulic Systems', score: 45, recommended_lessons: ['Hydraulic System A/B Architecture', 'Standby System Operations'] },
    { topic: 'Emergency Descent Phase', score: 60, recommended_lessons: ['Coordination with ATC in EMER', 'Oxygen Mask Deployment Timing'] },
    { topic: 'Fuel Management Policy', score: 85, recommended_lessons: [] },
  ])

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>CompBT: Adaptive Learning Path</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>AI-driven curriculum customization based on pre-test performance.</p>
        </div>
        <button 
          onClick={() => setAssessmentDone(!assessmentDone)}
          style={{ padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          {assessmentDone ? 'Reset Assessment' : 'Run Gap Analysis'}
        </button>
      </div>

      {!assessmentDone ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--off)', borderRadius: '16px', border: '2px dashed var(--bdr)' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧠</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>Ready to Analyze</h3>
          <p style={{ fontSize: '14px', color: 'var(--t3)', maxWidth: '400px', margin: '8px auto 24px' }}>
            The system will analyze the candidate's recent pre-test and EBT matrix results to generate a personalized training program.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>Identified Knowledge Gaps</h3>
            {gaps.map((gap, i) => (
              <div key={i} style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--bdr)', background: gap.score < 50 ? '#fef2f2' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{gap.topic}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: gap.score < 50 ? '#ef4444' : '#10b981' }}>{gap.score}% Score</span>
                </div>
                <div style={{ height: '6px', background: 'var(--off)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ width: gap.score + '%', height: '100%', background: gap.score < 50 ? '#ef4444' : '#10b981' }} />
                </div>
                {gap.recommended_lessons.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t3)', marginBottom: '8px', textTransform: 'uppercase' }}>Recommended Remedial Lessons:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {gap.recommended_lessons.map((l, li) => (
                        <div key={li} style={{ fontSize: '13px', color: 'var(--navy)', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '6px' }}>
                          📚 {l}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--navy)', color: '#fff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px' }}>Adapted Path</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
               <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
               {[
                 { title: 'Core Refresher', desc: 'Standard yearly recurrent items' },
                 { title: 'Remedial: Hydraulics', desc: 'Personalized based on gap analysis', premium: true },
                 { title: 'Remedial: Emergency Ops', desc: 'Personalized based on gap analysis', premium: true },
                 { title: 'Final Competency Check', desc: 'Integrated assessment' }
               ].map((step, si) => (
                 <div key={si} style={{ position: 'relative', paddingLeft: '28px' }}>
                   <div style={{ position: 'absolute', left: '0', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: step.premium ? '#3b82f6' : 'rgba(255,255,255,0.2)', border: '3px solid var(--navy)' }} />
                   <div style={{ fontSize: '14px', fontWeight: 700 }}>{step.title}</div>
                   <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{step.desc}</div>
                 </div>
               ))}
            </div>
            <button style={{ width: '100%', marginTop: '32px', padding: '12px', borderRadius: '10px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
               Publish Adapted Syllabus
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
