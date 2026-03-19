'use client'
import { useState } from 'react'

interface Lesson {
  id: string
  title: string
  type: 'video' | 'quiz' | 'document' | 'scorm'
  completed: boolean
}

export default function LessonPlayer() {
  const [activeLesson, setActiveLesson] = useState<Lesson>({
    id: '1', title: 'Part 1: Operational Limitations', type: 'video', completed: false
  })

  const [lessons] = useState<Lesson[]>([
    { id: '1', title: 'Part 1: Operational Limitations', type: 'video', completed: true },
    { id: '2', title: 'Part 2: Fuel Management', type: 'video', completed: false },
    { id: '3', title: 'Part 3: Alternate Aerodromes', type: 'document', completed: false },
    { id: '4', title: 'Session Quiz', type: 'quiz', completed: false },
  ])

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '600px', background: 'var(--navy)', borderRadius: '16px', overflow: 'hidden' }}>
      
      {/* Sidebar: Lesson List */}
      <div style={{ width: '300px', background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 800, margin: 0 }}>ETOPS Initial Course</h3>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Progress: 25% complete</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {lessons.map(l => (
            <button 
              key={l.id} 
              onClick={() => setActiveLesson(l)}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '10px', 
                background: activeLesson.id === l.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '4px'
              }}
            >
              <div style={{ 
                width: '16px', height: '16px', borderRadius: '50%', 
                border: l.completed ? 'none' : '2px solid rgba(255,255,255,0.2)',
                background: l.completed ? '#10b981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {l.completed && <span style={{ fontSize: '10px', color: '#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: activeLesson.id === l.id ? '#fff' : 'rgba(255,255,255,0.6)' }}>{l.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Player Area */}
      <div style={{ flex: 1, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{activeLesson.title}</span>
          <button style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Next Lesson →</button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Simulated Video/SCORM Player */}
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #0f172a 0%, #1e293b 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎥</div>
             <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Video Player Mockup (ETOPS Training Content)</div>
             <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '20px', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: '#3b82f6' }} />
             </div>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div style={{ padding: '16px 24px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⏯️</button>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
            <div style={{ width: '35%', height: '100%', background: '#3b82f6' }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>12:45 / 45:00</span>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⛶</button>
        </div>
      </div>

    </div>
  )
}
