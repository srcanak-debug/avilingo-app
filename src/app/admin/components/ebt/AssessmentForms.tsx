'use client'
import { useState } from 'react'

interface Criterion {
  id: string
  label: string
  score: number | null
  comment: string
}

export default function AssessmentForms() {
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', label: 'Take-off with Engine Failure at V1', score: null, comment: '' },
    { id: '2', label: 'Precision Approach ILS CAT II/III', score: null, comment: '' },
    { id: '3', label: 'Emergency Descent Procedures', score: null, comment: '' },
    { id: '4', label: 'Go-around with All Engines Operating', score: null, comment: '' },
  ])

  const setScore = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c))
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>E-Form: Simulator Assessment</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>B737-MAX Recurrent Training • ID #772</p>
        </div>
        <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
          ✓ SYNCED WITH CLOUD
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {criteria.map((c, i) => (
          <div key={c.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--bdr)', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>{c.label}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setScore(c.id, s)}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--bdr)', 
                      background: c.score === s ? 'var(--navy)' : '#fff',
                      color: c.score === s ? '#fff' : 'var(--navy)',
                      fontWeight: 800, cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea 
              placeholder="Add observation comments..." 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bdr)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', minHeight: '60px' }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', padding: '24px', borderRadius: '12px', background: 'var(--off)', border: '1px solid var(--bdr)' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t3)', marginBottom: '8px' }}>TRAINEE SIGNATURE</div>
          <div style={{ height: '80px', background: '#fff', border: '1px solid var(--bdr)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.2)', fontSize: '12px' }}>
            Awaiting Digital Signature
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t3)', marginBottom: '8px' }}>INSTRUCTOR SIGNATURE</div>
          <div style={{ height: '80px', background: '#fff', border: '1px solid var(--bdr)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.2)', fontSize: '12px' }}>
            Awaiting Digital Signature
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid var(--bdr)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Draft</button>
        <button style={{ padding: '12px 32px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Submit Assessment</button>
      </div>
    </div>
  )
}
