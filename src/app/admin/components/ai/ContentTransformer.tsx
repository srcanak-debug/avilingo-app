'use client'
import { useState } from 'react'

interface TransformSession {
  id: string
  fileName: string
  status: 'processing' | 'review' | 'completed'
  progress: number
  chapters: string[]
}

export default function ContentTransformer() {
  const [session, setSession] = useState<TransformSession | null>(null)

  const handleUpload = () => {
    setSession({
      id: 'tx_992',
      fileName: 'B737_OM-B_Standard_Ops.pdf',
      status: 'processing',
      progress: 35,
      chapters: []
    })
    
    // Simulate AI Processing
    setTimeout(() => {
      setSession(prev => prev ? {
        ...prev,
        progress: 100,
        status: 'review',
        chapters: ['Cockpit Preparation', 'Before Start Procedure', 'Pushback and Engine Start', 'Taxi-out Guidelines']
      } : null)
    }, 3000)
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)', animation: 'drawerSlideIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>AI Content Transformer</h2>
        <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Upload SOPs or Manuals to automatically generate LMS modules and competency-mapped questions.</p>
      </div>

      {!session ? (
        <div 
          onClick={handleUpload}
          style={{ 
            border: '2px dashed var(--bdr)', borderRadius: '12px', padding: '60px', textAlign: 'center', 
            cursor: 'pointer', transition: 'all 0.2s', background: 'var(--off)' 
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--navy)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bdr)'}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
          <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Click or Drag PDF to Transform</div>
          <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '4px' }}>Supports PDF, DOCX (Max 50MB)</div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--bdr)', borderRadius: '12px', padding: '20px', background: 'var(--off)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 800 }}>Source Document</div>
              <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{session.fileName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '100px', background: 'var(--navy)', color: '#fff', textTransform: 'uppercase', fontWeight: 900 }}>
                {session.status}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '100px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ width: `${session.progress}%`, height: '100%', background: 'var(--navy)', transition: 'width 0.5s ease-out' }} />
          </div>

          {session.status === 'review' && (
            <div style={{ animation: 'drawerSlideIn 0.3s ease-out' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--navy)', marginBottom: '12px' }}>AI Extracted Chapters:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {session.chapters.map((ch, idx) => (
                  <div key={idx} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{idx + 1}. {ch}</span>
                    <button style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--off)', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Map to EBT</button>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                Generate LMS Course & Questions
              </button>
            </div>
          )}

          {session.status === 'processing' && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--t3)', fontSize: '14px' }}>
              Analyzing document structure and extracting competencies...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
