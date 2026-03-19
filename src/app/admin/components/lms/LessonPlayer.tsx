'use client'
import { useState, useEffect } from 'react'
import { TCAS_ACASII_COURSE } from '@/lib/data/courses/tcas-acas-v71'
import { WXR_2100_COURSE } from '@/lib/data/courses/boeing-wxr-2100'

interface Lesson {
  id: string
  title: string
  subpoints?: string[]
  type: 'intro' | 'title' | 'content' | 'exam' | 'summary' | 'interactive'
  completed: boolean
}

export default function LessonPlayer() {
  const [activeCourse] = useState(TCAS_ACASII_COURSE)
  const [activeLesson, setActiveLesson] = useState<Lesson>(() => ({
    id: '0',
    title: TCAS_ACASII_COURSE.outline[0].title,
    subpoints: TCAS_ACASII_COURSE.outline[0].subpoints,
    type: TCAS_ACASII_COURSE.outline[0].type as any,
    completed: false
  }))

  const [lessons, setLessons] = useState<Lesson[]>(() => 
    activeCourse.outline.map((item, idx) => ({
      id: idx.toString(),
      title: item.title,
      subpoints: item.subpoints,
      type: item.type as any,
      completed: idx === 0
    }))
  )

  const [progress, setProgress] = useState(15)

  const handleLessonClick = (l: Lesson) => {
    setActiveLesson(l)
    setLessons(prev => prev.map(item => item.id === l.id ? { ...item, completed: true } : item))
  }

  useEffect(() => {
    const completedCount = lessons.filter(l => l.completed).length
    setProgress(Math.round((completedCount / lessons.length) * 100))
  }, [lessons])

  return (
    <div id="lesson-player-root" style={{ display: 'flex', height: '100%', minHeight: '650px', background: '#0f172a', borderRadius: '16px', overflow: 'hidden' }}>
      
      {/* Sidebar: Technical Outline */}
      <div style={{ width: '320px', background: 'rgba(2, 6, 23, 0.5)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Expert Masterclass</div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{activeCourse.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
             <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.4s ease' }} />
             </div>
             <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{progress}%</span>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {lessons.map(l => (
            <button 
              key={l.id} 
              id={`lesson-item-${l.id}`}
              onClick={() => handleLessonClick(l)}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '10px', 
                background: activeLesson.id === l.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: '18px', height: '18px', borderRadius: '50%', 
                border: l.completed ? 'none' : '2px solid rgba(255,255,255,0.2)',
                background: l.completed ? '#10b981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {l.completed && <span style={{ fontSize: '10px', color: '#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: activeLesson.id === l.id ? '#fff' : 'rgba(255,255,255,0.6)' }}>{l.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: High-Fidelity Slide Player */}
      <div style={{ flex: 1, background: '#020617', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>SLIDE {parseInt(activeLesson.id) + 1} / {lessons.length}</span>
             <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>{activeLesson.title}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Previous</button>
             <button style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Next Slide</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ 
            width: '100%', height: '100%', 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column'
          }}>
             <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, marginBottom: '32px', borderLeft: '6px solid #3b82f6', paddingLeft: '24px' }}>{activeLesson.title}</h1>
             
             <div style={{ flex: 1 }}>
                {activeLesson.subpoints ? (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeLesson.subpoints.map((p, i) => (
                      <li key={i} style={{ 
                        color: '#cbd5e1', fontSize: '18px', lineHeight: 1.6, 
                        display: 'flex', gap: '16px', alignItems: 'flex-start',
                        padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <span style={{ color: '#3b82f6', fontWeight: 900 }}>•</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚀</div>
                    <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700 }}>Initializing Masterclass Content...</div>
                  </div>
                )}
             </div>

             <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700 }}>Standard: ICAO / EASA OPS</span>
                <span style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 800 }}>AVILINGO CERTIFIED TRAINING</span>
             </div>
          </div>
        </div>

        {/* Player Controls */}
        <div style={{ padding: '16px 32px', background: 'rgba(15, 23, 42, 0.98)', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>⏮️</button>
          <button style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: 'none', color: '#000', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶️</button>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>⏭️</button>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
               <div style={{ width: '22%', height: '100%', background: '#3b82f6', borderRadius: '2px' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', opacity: 0.7 }}>💬</button>
             <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>⛶</button>
          </div>
        </div>
      </div>
    </div>
  )
}
