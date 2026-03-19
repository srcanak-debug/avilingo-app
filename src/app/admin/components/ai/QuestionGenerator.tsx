'use client'
import { useState } from 'react'

interface GeneratedQuestion {
  id: string
  text: string
  type: 'mcq' | 'true_false'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function QuestionGenerator() {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])

  const generate = () => {
    setLoading(true)
    setTimeout(() => {
      setQuestions([
        { id: 'g1', text: 'What is the required cockpit preparation time before pushback according to OM-B?', type: 'mcq', category: 'SOP', difficulty: 'medium' },
        { id: 'g2', text: 'Engine start is prohibited during crosswinds exceeding 35 knots.', type: 'true_false', category: 'Operating Limits', difficulty: 'hard' },
        { id: 'g3', text: 'When should the sterile cockpit rule be terminated during climb?', type: 'mcq', category: 'Procedures', difficulty: 'easy' },
      ])
      setLoading(false)
    }, 2500)
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)', animation: 'drawerSlideIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>AI Question Generator</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Transform raw text or manuals into validated exam questions.</p>
        </div>
        <button 
          onClick={generate}
          disabled={loading}
          style={{ 
            padding: '12px 24px', background: 'var(--navy)', color: '#fff', 
            borderRadius: '10px', border: 'none', fontWeight: 800, cursor: 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Generating...' : '🛠️ Generate Now'}
        </button>
      </div>

      {!loading && questions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ padding: '16px', background: 'var(--off)', borderRadius: '12px', border: '1px solid var(--bdr)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--t3)' }}>Question {idx + 1} • {q.type}</span>
                 <span style={{ 
                   fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: '#fff', border: '1px solid var(--bdr)', fontWeight: 800, color: 'var(--navy)' 
                 }}>{q.difficulty}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>{q.text}</div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                 <button style={{ padding: '6px 12px', fontSize: '11px', background: '#fff', border: '1px solid var(--bdr)', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                 <button style={{ padding: '6px 12px', fontSize: '11px', background: '#fff', border: '1px solid var(--bdr)', borderRadius: '6px', fontWeight: 700, color: 'var(--navy)', cursor: 'pointer' }}>Add to Bank</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--t3)', fontSize: '14px', background: 'var(--off)', borderRadius: '12px', border: '1px dashed var(--bdr)' }}>
           No questions generated yet. Select a source document or enter text to begin.
        </div>
      )}
    </div>
  )
}
